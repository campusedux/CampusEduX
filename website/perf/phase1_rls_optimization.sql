-- ============================================================================
-- CampusEduX — Phase 1 RLS optimization: wrap auth.uid() in (select auth.uid())
-- ============================================================================
-- REVIEW BEFORE RUNNING. NOT applied automatically. The DB is shared by
-- mobile-app + admin-panel + website — hand this to whoever owns the Supabase
-- migrations. Behaviour is IDENTICAL before/after; this is purely a planner
-- optimization.
--
-- WHY --------------------------------------------------------------------------
-- In a Postgres RLS policy, a bare `auth.uid()` (a STABLE function) is
-- re-evaluated FOR EVERY ROW the query touches. Wrapping it as
-- `(select auth.uid())` turns it into an InitPlan that Postgres evaluates ONCE
-- per statement and reuses. On big tables this is a well-documented 10x–100x
-- RLS speedup; Supabase recommends it as standard practice.
-- Ref: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices
--
-- AUDIT FINDING --------------------------------------------------------------
--   auth.uid() occurrences across all migrations : 317
--   already wrapped in (select auth.uid())       : 0
-- Every user-owned table the website reads (wallet_transactions, notifications,
-- applications, purchases, resumes_builder, resume_versions/downloads/shares,
-- custom_project_*, learning_bookmarks, legal_consents, test_attempts, …) uses
-- the bare form.
--
-- SCOPE OF THIS FILE --------------------------------------------------------
-- The tables the WEBSITE hits most, as explicit `alter policy` statements
-- (requires Postgres 15+, which Supabase is on). A FULL codebase-wide sweep
-- (all 317 sites, incl. mobile-only tables and the admin policies) is worth
-- doing as one dedicated migration afterwards — the pattern is mechanical:
--     using (auth.uid() = user_id)            ->  using ((select auth.uid()) = user_id)
--     with check (auth.uid() = user_id ...)   ->  with check ((select auth.uid()) = user_id ...)
--     ... where a.user_id = auth.uid()        ->  ... where a.user_id = (select auth.uid())
--
-- Each `alter policy` re-states the policy's FULL condition — copy the current
-- definition from the migration that created it and wrap only the auth.uid()
-- call(s). The statements below already do that for the current definitions.
-- If a policy has been changed since, reconcile against the live definition
-- (\d+ <table> in psql, or select * from pg_policies where tablename = '...').
-- ============================================================================


-- ---- purchases  (mobile-app/supabase/migrations/0006_purchases.sql) ---------
alter policy "purchases_select_own" on public.purchases
  using ((select auth.uid()) = user_id);
alter policy "purchases_update_own_failed" on public.purchases
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and status in ('pending', 'failed'));

-- ---- wallet_transactions  (0020_wallet.sql; insert policy replaced in 0038) --
alter policy "wallet_transactions_select_own" on public.wallet_transactions
  using ((select auth.uid()) = user_id);
-- NOTE: "wallet_transactions_insert_own_debit" was dropped/replaced in
-- 0038_wallet_withdrawal_rpc.sql — wrap whatever the current insert policy is.
alter policy "wallet_topup_orders_select_own" on public.wallet_topup_orders
  using ((select auth.uid()) = user_id);

-- ---- wishlists  (0005_wishlists.sql) ---------------------------------------
alter policy "wishlists_select_own" on public.wishlists
  using ((select auth.uid()) = user_id);
alter policy "wishlists_insert_own" on public.wishlists
  with check ((select auth.uid()) = user_id);
alter policy "wishlists_delete_own" on public.wishlists
  using ((select auth.uid()) = user_id);

-- ---- saved_jobs  (mobile-app/supabase/migrations/0013*) ------------------
alter policy "saved_jobs_select_own" on public.saved_jobs
  using ((select auth.uid()) = user_id);
alter policy "saved_jobs_insert_own" on public.saved_jobs
  with check ((select auth.uid()) = user_id);
alter policy "saved_jobs_delete_own" on public.saved_jobs
  using ((select auth.uid()) = user_id);

-- ---- applications  (0012_job_applications.sql) ---------------------------
alter policy "applications_select_own" on public.applications
  using ((select auth.uid()) = user_id);
alter policy "applications_insert_own" on public.applications
  with check ((select auth.uid()) = user_id);
alter policy "application_stages_select_via_parent" on public.application_stages
  using (exists (
    select 1 from public.applications a
    where a.id = application_stages.application_id
      and a.user_id = (select auth.uid())
  ));

-- ---- notifications  (mobile-app/supabase/migrations/0027* or 0028*) ------
alter policy "notifications_select_own" on public.notifications
  using ((select auth.uid()) = user_id);
-- + any notifications update/delete ("mark read") policy — same wrap.

-- ---- resumes_builder + resume_downloads  (0014_resume_builder.sql) ------
alter policy "resumes_builder_select_own" on public.resumes_builder
  using ((select auth.uid()) = user_id);
alter policy "resumes_builder_insert_own" on public.resumes_builder
  with check ((select auth.uid()) = user_id);
alter policy "resumes_builder_update_own" on public.resumes_builder
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "resumes_builder_delete_own" on public.resumes_builder
  using ((select auth.uid()) = user_id);
alter policy "resume_downloads_select_own" on public.resume_downloads
  using ((select auth.uid()) = user_id);
alter policy "resume_downloads_insert_own" on public.resume_downloads
  with check ((select auth.uid()) = user_id);

-- ---- resume_versions  (mobile-app migration 0061*) ---------------------
alter policy "resume_versions_select_own" on public.resume_versions
  using ((select auth.uid()) = user_id);
alter policy "resume_versions_insert_own" on public.resume_versions
  with check ((select auth.uid()) = user_id);

-- ---- resume_shares  (mobile-app migration 0060* / admin 035*) ----------
alter policy "resume_shares_select_own" on public.resume_shares
  using ((select auth.uid()) = user_id);
alter policy "resume_shares_insert_own" on public.resume_shares
  with check ((select auth.uid()) = user_id);
alter policy "resume_shares_update_own" on public.resume_shares
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "resume_shares_delete_own" on public.resume_shares
  using ((select auth.uid()) = user_id);

-- ---- custom_project_requests + children  (mobile-app 0032* / 0034*) ----
alter policy "custom_project_requests_select_own" on public.custom_project_requests
  using ((select auth.uid()) = user_id);
-- child tables gate via EXISTS on the parent request — wrap the inner uid():
--   ... where r.id = <child>.request_id and r.user_id = (select auth.uid())
-- Apply to: custom_project_request_features / _files / _history,
--           custom_project_deliveries, custom_project_delivery_assets,
--           custom_project_messages (cpm_insert_own / _select policies),
--           custom_project_drafts (select/insert/update/delete own).

-- ---- learning_bookmarks  (mobile-app 0042* / 0043*) -------------------
alter policy "learning_bookmarks_select_own" on public.learning_bookmarks
  using ((select auth.uid()) = user_id);
alter policy "learning_bookmarks_insert_own" on public.learning_bookmarks
  with check ((select auth.uid()) = user_id);
alter policy "learning_bookmarks_delete_own" on public.learning_bookmarks
  using ((select auth.uid()) = user_id);

-- ---- legal_consents  (mobile-app 0039_legal_consent.sql) --------------
alter policy "legal_consents_select_own" on public.legal_consents
  using ((select auth.uid()) = user_id);
alter policy "legal_consents_insert_own" on public.legal_consents
  with check ((select auth.uid()) = user_id);

-- ---- test_attempts + answers  (0017_test_attempts.sql) ---------------
alter policy "test_attempts_select_own" on public.test_attempts
  using ((select auth.uid()) = user_id);
alter policy "test_attempts_insert_own" on public.test_attempts
  with check ((select auth.uid()) = user_id);
alter policy "test_attempt_answers_select_via_parent" on public.test_attempt_answers
  using (exists (
    select 1 from public.test_attempts a
    where a.id = test_attempt_answers.attempt_id
      and a.user_id = (select auth.uid())
  ));
alter policy "test_attempt_answers_insert_via_parent" on public.test_attempt_answers
  with check (exists (
    select 1 from public.test_attempts a
    where a.id = test_attempt_answers.attempt_id
      and a.user_id = (select auth.uid())
  ));


-- ============================================================================
-- SECOND, SEPARATE OPTIMIZATION — premium-gate helper
-- ============================================================================
-- public.current_user_is_premium() is called (bare) in ~12 policies on the
-- premium-gated Learning tables (learning_contents, practice_tests, dsa_*,
-- hr_questions, …). Same problem: bare STABLE-function call = per-row eval.
-- Wrap each call site as `(select public.current_user_is_premium())`.
--
-- The website mostly reads Learning through SECURITY DEFINER RPCs
-- (learning_tree / learning_topic_content / learning_topic_practice), which
-- already do their checks once — so this matters more for the mobile app's
-- direct table reads than for the website. Still worth doing in the same sweep.
--
-- Example:
--   alter policy "learning_contents_select_published" on public.learning_contents
--     using (
--       <existing published/target chain>
--       and (
--         not coalesce((select t.is_premium from public.learning_topics t
--                       where t.id = learning_contents.topic_id), false)
--         or (select public.current_user_is_premium())
--       )
--     );

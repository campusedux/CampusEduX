# CampusEduX — Supabase Database Security Audit (RLS / Policies / Functions / Storage / Edge)

**Scope:** the shared Supabase project's schema, as defined by
`mobile-app/supabase/migrations/` (0001–0089), `admin-panel/supabase/migrations/` (001–061),
and `website/supabase/migrations/0001_contact_submissions.sql`.
**Method:** read + report only. No migration was written or modified. Seed-only files
(`*_seed_*`, the large content dumps) were excluded from policy analysis; every schema /
policy / function / trigger DDL file was read.
**Date:** 2026-09-09

Line references are `path:line` relative to the repo root. The mobile-app tree is the
canonical schema; the admin-panel tree adds admin-side policies and money RPCs. Many
migrations ship as a "canonical pair" (identical body in both trees, both guarded) — a
reference to one applies to its twin.

---

## Executive summary

| Severity | Count | The finding |
|---|---:|---|
| **CRITICAL** | 1 | **C1** — `refund_requests`: the requester fully controls `amount` and may reference *any* `purchase_id` (or none); `admin_process_refund()` credits `r.amount` to the wallet with **no cap against the purchase total and no ownership check**, and flips that purchase to `refunded`. One careless admin "approve" = arbitrary wallet credit + griefing another user's purchase. |
| **HIGH** | 3 | **H1** `profiles` UPDATE policy has no column allow-list — 0037 pins only `is_premium`; `status` / `blocked_*` / `admin_notes` / `email` / `referral_code` remain self-writable. **H2** `test_questions.correct_index` + `practice_tests` premium flag are world-readable (`USING (true)`, no column grant) — full answer key to anon, premium tests readable & attemptable by non-premium. **H3** `dsa_problems.test_cases` (hidden judge cases) + `solution_code` are directly selectable via PostgREST for every non-premium coding/practice problem, bypassing the redaction RPCs. |
| **MEDIUM** | 5 | **M1** `coupons` / `offers` world-readable. **M2** own-row UPDATE policies without column allow-lists (`notifications`, `job_alerts`, `premium_subscriptions` pre-0037). **M3** `verify-*-payment` idempotency is check-then-act with no lock — a double-fire race can double-debit the wallet. **M4** `restore_resume_version()` has no `SET search_path`. **M5** storage buckets have no `file_size_limit` / `allowed_mime_types`. |
| **LOW** | 5 | `resume_ai_prompts` world-readable; `email_for_mobile` enumeration oracle; flat referral bonus not capped by `max_payout`; `profiles.email` self-write → admin-panel display spoofing; `get_shared_resume` `view_count` un-throttled. |
| **PASS** | — | **RLS is ENABLED on 100 % of public tables.** No `USING (true)` / `WITH CHECK (true)` on any INSERT/UPDATE/DELETE/`FOR ALL` policy anywhere. SEC-001 (self-granted premium) and SEC-002 (wallet over-withdrawal) are correctly fixed by 0037 / 0038 and **not** re-opened by any later migration. Test-score forgery is fixed by 0040. Every money move goes through a SECURITY DEFINER function that re-checks `is_admin()`, sets `search_path`, and takes a row lock. Razorpay signatures are HMAC-verified server-side with the amount read from the DB. Storage is private + owner-folder-scoped. |

**Top priority:** fix **C1** (SQL below), then **H1** (column-pin trigger, same pattern as 0037), then **H2/H3** (column-level `REVOKE` on the answer-key / solution columns).

---

## 1. TABLE COVERAGE — is RLS enabled on every table?

**Yes. Every table in the `public` schema has `ROW LEVEL SECURITY` enabled.** There is **no table with RLS OFF** — so there is no CRITICAL "RLS OFF" finding.

Verification method: for each of the 105 distinct `create table … public.<name>` statements across all non-seed migrations, confirmed a matching `alter table public.<name> enable row level security` — either literal, or via a `do $$ … execute format('alter table public.%I enable row level security', t) …$$` loop. The three that resolve only through a `format()` loop are `courses`, `branches`, `academic_years` (`admin-panel/supabase/migrations/009_settings_admin.sql:69-84`) — RLS **is** enabled there.

| Table | RLS OFF? | Enable statement | Write access (non-admin) |
|---|:---:|---|---|
| `profiles` | No | `mobile-app/…/0001_profiles.sql:39` | owner UPDATE **no column allow-list** — see **H1** |
| `categories` | No | `0002_categories.sql:36` | admin only |
| `projects` | No | `0003_projects.sql` (see 0035/0036/0041) | admin only |
| `project_images` `project_files` `project_versions` | No | `0003`/`0008` | admin only |
| `reviews` | No | `0004_reviews.sql:37` | owner insert/update/delete (`auth.uid()=user_id`) |
| `wishlists` | No | `0005_wishlists.sql:26` | owner insert/delete |
| `purchases` | No | `0006_purchases.sql:55` | owner UPDATE limited to `status IN ('pending','failed')`; **no INSERT policy** (Edge Function only) |
| `downloads` | No | `0007_downloads.sql:28` | owner insert |
| `companies` `recruiters` | No | `0009_companies.sql:51-52` | admin only |
| `jobs` | No | `0010_jobs.sql` (see 0036/0041) | admin only |
| `resumes` | No | `0011_resumes.sql:30` | owner insert/delete; **no UPDATE policy** |
| `applications` | No | `0012_job_applications.sql:67` | owner insert; **no UPDATE** (recruiter via admin) |
| `application_stages` | No | `0012:68` | none (SELECT via parent only) |
| `saved_jobs` `job_alerts` | No | `0013_job_personalization.sql:44-45` | owner CRUD (`job_alerts` UPDATE has no column allow-list — **M2**) |
| `resume_templates` | No | `0014_resume_builder.sql:76` | admin only (world-readable catalog) |
| `resumes_builder` | No | `0014:77` | owner CRUD (`auth.uid()=user_id`) |
| `resume_downloads` | No | `0014:78` | owner select/insert |
| `aptitude_topics` | No | `0015_aptitude.sql` | admin only |
| `practice_tests` | No | `0016_practice_tests.sql:56` | admin only — **but SELECT is `USING (true)` with no premium gate → H2** |
| `test_questions` | No | `0016:57` | admin only — **SELECT `USING (true)`, `correct_index` exposed → H2** |
| `test_attempts` | No | `0017_test_attempts.sql:63` | **INSERT policy DROPPED by 0040** — `submit_test_attempt()` only |
| `test_attempt_answers` | No | `0017:64` | **INSERT policy DROPPED by 0040** |
| `dsa_topics` `dsa_problems` | No | `0018_dsa.sql:64-65` | admin only — **`dsa_problems` columns `test_cases`/`solution_code` exposed → H3** |
| `user_dsa_progress` | No | `0018:66` | owner select/insert/update |
| `hr_questions` | No | `0019_hr_questions.sql:49` | admin only (world-readable) |
| `user_favorite_questions` | No | `0019:50` | owner select/insert/delete |
| `wallet_transactions` | No | `0020_wallet.sql:60` | **INSERT policy DROPPED by 0038** — `request_withdrawal()` only; credits are Edge-Function/service-role |
| `wallet_topup_orders` | No | `0020:61` | owner SELECT only (writes service-role) |
| `referral_codes` `referrals` `referral_earnings` | No | `0021_referrals.sql:80-82` | **no user write path** — trigger/service-role only |
| `premium_plans` `premium_features` | No | `0022_premium.sql:78-79` | admin only |
| `premium_subscriptions` | No | `0022:80` | owner UPDATE — status/plan/price/period **pinned by 0037 trigger** |
| `notifications` | No | `0023_notifications.sql:48` | owner UPDATE, no column allow-list (**M2**); **no INSERT** |
| `offer_banners` | No | `0023:49` | admin only |
| `reward_settings` | No | `0026_referral_reward_settings.sql:35` / `admin …/007:139` | admin UPDATE only |
| `user_preferences` `notification_preferences` `blocked_users` | No | `0024_settings.sql:63-65` | owner CRUD |
| `prep_notes` | No | `0028_preparation_notes.sql:49` | admin only (see admin 018) |
| `prep_note_bookmarks` | No | `0028:72` | owner CRUD |
| `edge_rate_limits` | No | `0030_edge_order_rate_limit.sql:21` | **RLS on, zero policies** — service-role only |
| `custom_project_pricing` `_platform_pricing` `_features` `_feature_categories` | No | `0033_custom_project_builder.sql:487-489`, `0034:…` | admin only (world-readable catalog) |
| `custom_project_requests` | No | `0033:490` | **SELECT own only — no INSERT/UPDATE** (Edge Function creates; status uneditable) |
| `custom_project_request_features` `_files` `_history` `_payments` | No | `0033:491-494` | SELECT via parent ownership |
| `custom_project_deliveries` `_delivery_assets` | No | `0033:495-496` | SELECT only when parent `status='delivered'` |
| `custom_project_messages` | No | `0033:497` | owner SELECT + INSERT forced `sender_role='student'` |
| `custom_project_drafts` | No | `0033:498` | owner full CRUD |
| `custom_project_admin_inbox` | No | `0033:499` | **RLS on, no student policy** (admin SELECT in admin 013) |
| `learning_grids` `learning_sections` `learning_topics` | No | `0042_learning_management.sql:327-329` | admin only; SELECT chained on published + platform |
| `learning_contents` | No | `0042:330` | admin only; SELECT enforces **premium at the row level** |
| `learning_bookmarks` | No | `0042:331` | owner CRUD |
| `learning_grid_companies` `learning_migration_map` | No | `0044_learning_unification.sql:213,229` | admin only |
| `legal_consents` | No | `0039_legal_consent.sql:39` | **SELECT own only — no INSERT** (`record_legal_consent()` only) |
| `resume_ai_requests` | No | `0059_resume_ai_requests.sql:21` | owner select/insert (append-only) |
| `resume_shares` | No | `0060_resume_shares.sql:38` | owner CRUD; anon read via `get_shared_resume()` only |
| `resume_versions` | No | `0061_resume_versions.sql:20` | owner select/insert (no update/delete) |
| `blog_categories` `blog_posts` | No | `0065_blog.sql:146-147` | admin only; public SELECT = `status='published'` |
| `coding_submissions` | No | `0072_practice_coding.sql:145` | owner select/insert |
| `admin_users` `role_permissions` `admin_activity_logs` `admin_notifications` | No | `admin …/001_admin_core.sql:274-277` | staff only; `admin_users` write = `super_admin`; logs write via function |
| `contact_submissions` `contact_rate_limits` | No | `website/…/0001:38,49` | **RLS on, no public policy** — `submit_contact_message()` only |
| `site_settings` `technologies` `ats_rules` `resume_template_categories` `coupons` `offers` `live_tests` `backups` `generated_reports` `push_notifications` `review_reports` `refund_requests` `withdrawal_requests` `resume_share_reports` | No | admin 003/005/006/007/008/009/012/035 | admin-only writes; `coupons`/`offers` SELECT `USING (true)` → **M1**; `refund_requests`/`withdrawal_requests` owner INSERT `status='pending'` |
| `courses` `branches` `academic_years` | No | `admin …/009_settings_admin.sql:69-84` (format loop) | admin only (world-readable catalog) |

---

## 2. PRIVILEGE ESCALATION on `profiles`

### The UPDATE policy (verbatim)

`mobile-app/supabase/migrations/0001_profiles.sql:51-55`
```sql
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
```
This is the **only** self-service UPDATE policy on `profiles`. It is **never re-created or altered** by any later migration (grep across all trees: only occurrence is line 51 above). The admin-side policy `profiles_update_admin` (`admin-panel/supabase/migrations/002_admin_rls_policies.sql:47-49`) is `USING (public.is_admin(auth.uid()))` and does not apply to a student.

### Can a user set privileged columns through `PATCH /rest/v1/profiles?id=eq.<self>`?

| Column | Blocked? | By what |
|---|:---:|---|
| `is_premium` | **YES** | `protect_profile_is_premium()` BEFORE UPDATE trigger — `0037_protect_is_premium.sql:86-103`. Pins `new.is_premium := old.is_premium` unless the transaction-local GUC `app.sync_is_premium='on'` (set only inside `sync_profile_is_premium()`). |
| `role` / any admin flag | **N/A** | `profiles` has **no** role/admin column. Staff identity lives in `public.admin_users` (`admin …/001_admin_core.sql:28-42`), whose write policy is `current_admin_role() = 'super_admin'` — a student cannot insert there. |
| balance / credit column | **N/A** | `profiles` has no wallet column; balance is derived from `wallet_transactions`. |
| `status` (`'active'`/`'blocked'`) | **NO — UNPROTECTED** | Added by `admin …/002:32`. No trigger, no `WITH CHECK` clause, no column GRANT restricts it. A user can `PATCH {"status":"active"}` on their own row. |
| `blocked_reason` `blocked_at` `blocked_by` `admin_notes` | **NO — UNPROTECTED** | Added by `admin …/002:38-41`. Fully self-writable. A user can null out their block metadata, forge `blocked_by`, or write arbitrary text into their own `admin_notes` (which staff read in the panel — `admin-panel/src/lib/students/queries.ts:83`). |
| `email` | **NO** | Self-writable. Desyncs `profiles.email` from `auth.users.email`; enables a spoofed display email in the admin students list. (**L4**) |
| `referral_code` | **NO** | Self-writable, but **inert**: `link_referral_on_signup()` (`0026_referral_reward_settings.sql:82-128`) is an `AFTER INSERT` trigger on `profiles`; changing `referral_code` after signup does nothing. The user's *own* shareable code is `referral_codes.code`, which has no user write policy. |
| `coding_profiles` `linkedin_url` `github_url` `portfolio_url` `full_name` `course` `branch` … | intentionally writable | These are the profile-form fields the website/app legitimately update. |

### Is there a column-level GRANT / BEFORE UPDATE trigger / WITH CHECK that stops it?

- **`is_premium`:** yes — the `profiles_guard_is_premium` trigger (`0037_protect_is_premium.sql:100-103`). Quoted above.
- **`status` / `blocked_*` / `admin_notes`:** **NO.** There is no trigger on `profiles` other than `profiles_guard_is_premium` (pins `is_premium` only), `profiles_set_updated_at`, `profiles_ensure_referral_code` (AFTER INSERT), `profiles_link_referral` (AFTER INSERT). There is no column-level `GRANT`/`REVOKE` on `profiles` anywhere in the migration tree. The `WITH CHECK (auth.uid() = id)` clause only pins *which row*, never *which columns*.

### Finding H1 — `profiles` moderation columns are self-writable — HIGH

**Impact today:** a user can rewrite their own `admin_notes` (pollute the moderation record staff rely on), forge `blocked_by`/`blocked_at`, and clear `blocked_reason`. A user can set `profiles.email` to an arbitrary string shown to staff.

**Latent escalation:** `admin-panel/src/app/(panel)/students/actions.ts:134` blocks a student by writing `profiles.status='blocked'`, and the admin dashboard/reports treat `status='blocked'` as the blocked signal (`admin-panel/src/lib/dashboard/analytics.ts:27`, `admin-panel/src/lib/students/queries.ts:143`). **No runtime code in `mobile-app/src` or `website/src` currently denies access based on `profiles.status`** — so a self-unblock is not an *active* bypass yet, but the moment enforcement is wired in (a very natural next step given the whole block UI exists), a blocked user un-blocks themselves with one PATCH.

**Migrations 0037/0038 — confirmed.** `0037_protect_is_premium.sql` exists and closes SEC-001 (`profiles.is_premium`) **and** the `premium_subscriptions` activation bypass (`protect_premium_subscription_fields()` trigger, `0037:112-152`). `0038_wallet_withdrawal_rpc.sql` exists and closes SEC-002. **No later migration re-creates `profiles_update_own`, re-adds `test_attempts_insert_own`, re-adds `wallet_transactions_insert_own_debit`, or drops the 0037 triggers** (verified by grep across `mobile-app/`, `admin-panel/`, `website/` migration trees — the only definitions of those three policies are their originals in `0001`/`0017`/`0020`, each dropped by the corresponding fix).

**Suggested fix (do NOT apply — suggestion only):** mirror the 0037 pattern with a BEFORE UPDATE trigger that pins the moderation columns for any caller that isn't the service role or an active admin.
```sql
-- suggested: 00xx_protect_profile_moderation_fields.sql
create or replace function public.protect_profile_moderation_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('service_role','supabase_admin','postgres') then
    return new;
  end if;
  if public.is_admin(auth.uid()) then
    return new;
  end if;
  -- non-admin, non-service caller: pin every staff-controlled column
  new.status         := old.status;
  new.blocked_reason := old.blocked_reason;
  new.blocked_at     := old.blocked_at;
  new.blocked_by     := old.blocked_by;
  new.admin_notes    := old.admin_notes;
  new.email          := old.email;   -- keep in sync with auth.users only
  return new;
end;
$$;

drop trigger if exists profiles_guard_moderation on public.profiles;
create trigger profiles_guard_moderation
  before update on public.profiles
  for each row execute function public.protect_profile_moderation_fields();
```

---

## 3. POLICY-BY-POLICY REVIEW (the requested tables)

Legend: **A→B read** / **A→B write** = "can user A read / write user B's rows?"

### `wallet_transactions` — `mobile-app/…/0020_wallet.sql:60`, `0038_wallet_withdrawal_rpc.sql:100`
```sql
-- 0020
create policy "wallet_transactions_select_own" for select using (auth.uid() = user_id);
create policy "wallet_transactions_insert_own_debit" for insert
  with check (auth.uid() = user_id and type = 'debit' and category = 'withdrawal');   -- DROPPED by 0038:100
-- admin 002
create policy "wallet_transactions_admin_select" for select using (public.is_admin(auth.uid()));
```
**A→B read: NO** (own only + admin). **A→B write: NO.** After 0038 there is **no client INSERT/UPDATE/DELETE policy at all**; the only client write path is `request_withdrawal()` (SECURITY DEFINER, advisory lock, real-balance check — `0038:35-94`). Credits are inserted by the Edge Functions / `admin_adjust_wallet()` on the service role. **Not effectively `true`.** PASS.

### `purchases` — `0006_purchases.sql:55`
```sql
create policy "purchases_select_own" for select using (auth.uid() = user_id);
create policy "purchases_update_own_failed" for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status in ('pending', 'failed'));
-- admin 002: purchases_admin_select (SELECT only — admin_ro_locked)
```
**A→B read: NO.** **A→B write:** own rows only, and the `WITH CHECK` forbids a client escalating to `status='success'` or `'refunded'`. **No INSERT policy** (Edge Function only). PASS.

### `applications` — `0012_job_applications.sql:67`
```sql
create policy "applications_select_own" for select using (auth.uid() = user_id);
create policy "applications_insert_own" for insert with check (auth.uid() = user_id);
-- admin 002: applications_admin_all (full CRUD, is_admin)
```
**A→B read: NO.** **A→B write:** insert own only; **no client UPDATE** (status changes are admin). PASS. `application_stages` (`0012:68`) has SELECT-via-parent only. PASS.

### `resumes` — `0011_resumes.sql:30`
```sql
create policy "resumes_select_own"  for select using (auth.uid() = user_id);
create policy "resumes_insert_own"  for insert with check (auth.uid() = user_id);
create policy "resumes_delete_own"  for delete using (auth.uid() = user_id);
-- admin 002: resumes_admin_select (SELECT only)
```
**A→B: NO.** No UPDATE policy. PASS.

### `resumes_builder` — `0014_resume_builder.sql:77`
```sql
create policy "resumes_builder_select_own" for select using (auth.uid() = user_id);
create policy "resumes_builder_insert_own" for insert with check (auth.uid() = user_id);
create policy "resumes_builder_update_own" for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "resumes_builder_delete_own" for delete using (auth.uid() = user_id);
-- admin 002: resumes_builder_admin_select (SELECT only)
```
**A→B: NO.** The anon share path (`get_shared_resume()`) is a separate SECURITY DEFINER function that never adds a policy to this table. PASS.

### `resume_shares` — `0060_resume_shares.sql:38`
Owner select/insert/update/delete (`auth.uid() = user_id`), plus `resume_shares_admin_all` (`admin …/035:15`). **A→B: NO.** PASS.

### `resume_versions` — `0061_resume_versions.sql:20`
`resume_versions_select_own` + `resume_versions_insert_own` only (`auth.uid() = user_id`). **No UPDATE, no DELETE policy for any client role** — snapshots are immutable; pruning is a SECURITY DEFINER trigger. **A→B: NO.** PASS.

### `resume_downloads` — `0014:78`
Owner select/insert (`auth.uid() = user_id`) + admin SELECT. **A→B: NO.** PASS.

### `saved_jobs` — `0013_job_personalization.sql:44`
Owner select/insert/delete (`auth.uid() = user_id`). **A→B: NO.** PASS.

### `wishlists` — `0005_wishlists.sql:26`
Owner select/insert/delete (`auth.uid() = user_id`). **A→B: NO.** PASS.

### `notifications` — `0023_notifications.sql:48`
```sql
create policy "notifications_select_own" for select using (auth.uid() = user_id);
create policy "notifications_update_own" for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- admin 002: notifications_admin_all
```
**A→B read: NO.** **A→B write: NO** (own rows), **but the UPDATE `WITH CHECK` has no column allow-list** — a user can rewrite `title` / `body` / `category` / `image_url` of *their own* notification rows. Cosmetic, own-row only. **M2 (LOW-MEDIUM).** No client INSERT policy.

### `referrals` — `0021_referrals.sql:81`
```sql
create policy "referrals_select_involved" for select
  using (auth.uid() = referrer_id or auth.uid() = referred_user_id);
create policy "referrals_select_successful" for select to authenticated
  using (status = 'successful');                       -- cross-user, SELECT only (leaderboard)
-- admin 002: referrals_admin_all
```
**A→B read: PARTIAL BY DESIGN** — a signed-in user can read *converted* (`status='successful'`) referral rows for **every** user (`referrer_id`, `referred_user_id`, `reward_amount`, `created_at`) for the leaderboard. Names are still masked because the `profiles` join is RLS-restricted. Pending/cancelled referrals stay private. This is documented and intentional; the only PII exposed is "user X successfully referred user Y for ₹Z" to authenticated users. **NOTE, not a defect** — but if the leaderboard is dropped, drop this policy too. **A→B write: NO — there is no user INSERT/UPDATE/DELETE policy.** PASS on writes.

### `referral_codes` — `0021:80`
`referral_codes_select_own` (`auth.uid() = user_id`) + admin. **No user write policy** — `code` / `total_referrals` / `total_earned` are trigger-maintained (`sync_referral_totals()`, `ensure_referral_code()`). **A→B: NO.** PASS.

### `legal_consents` — `0039_legal_consent.sql:39`
`legal_consents_select_own` (`auth.uid() = user_id`) only. **No INSERT/UPDATE/DELETE policy** — writes exclusively via `record_legal_consent()` (SECURITY DEFINER, pins `user_id = auth.uid()`, `accepted_at = now()`, `set search_path = public` — `0039:50-91`). **A→B: NO.** Rows immutable. PASS.

### `coding_submissions` — `0072_practice_coding.sql:145`
```sql
create policy "coding_submissions_select_own" for select using (auth.uid() = user_id);
create policy "coding_submissions_insert_own" for insert with check (auth.uid() = user_id);
create policy "coding_submissions_admin_all" for all using (public.is_admin(auth.uid())) ...
```
**A→B read: NO.** **A→B write:** insert own only. A user can insert a submission row with a self-chosen `verdict`/`passed`/`total`/`runtime_ms` (the website route computes these server-side before inserting, but nothing *forces* honest values). Impact: forged personal practice stats only — no money, no cross-user. **NOTE (LOW).**

### `user_dsa_progress` — `0018_dsa.sql:66`
`select/insert/update` own (`auth.uid() = user_id`). A user can mark any problem "solved" for themselves. Personal-stat integrity only. **NOTE (LOW).** **A→B: NO.**

### `test_attempts` / `test_attempt_answers` — `0017:63-64`, `0040_test_attempt_scoring.sql:118-119`
```sql
-- 0017 (INSERT policies DROPPED by 0040:118-119)
create policy "test_attempts_select_own" for select using (auth.uid() = user_id);
create policy "test_attempt_answers_select_via_parent" for select using (exists ( ... a.user_id = auth.uid()));
-- admin 002: *_admin_select (SELECT only)
```
**A→B read: NO.** **A→B write: NO** — after 0040 there is **no client INSERT policy**; the only write path is `submit_test_attempt()` (SECURITY DEFINER, recomputes `score`/`correct_count` from `test_questions.correct_index` + `marks`, ignores any client score — `0040:30-112`). PASS on the *recorded result*. (The answer key itself is still readable — see **H2**.)

### `custom_project_requests` — `0033_custom_project_builder.sql:490`
```sql
create policy "cpr_select_own" for select using (auth.uid() = user_id);
-- admin 013: cpr_admin_all
```
**A→B read: NO.** **A→B write: NO — there is no user INSERT/UPDATE/DELETE policy.** Requests are created by `create-custom-project-order` (service role); a student cannot forge a request or change its `status`. PASS.

### `custom_project_messages` — `0033:497`
```sql
create policy "cpm_select_own" for select using (exists ( ... r.user_id = auth.uid()));
create policy "cpm_insert_own" for insert to authenticated with check (
  sender_id = auth.uid() and sender_role = 'student'
  and exists (select 1 from public.custom_project_requests r where r.id = request_id and r.user_id = auth.uid()));
```
**A→B read: NO** (thread ownership via parent). **A→B write: NO** — `sender_id` pinned to `auth.uid()`, `sender_role` pinned to `'student'`, request ownership enforced. A user cannot post as `'admin'` or into another user's thread. PASS.

### `custom_project_drafts` — `0033:498`
`cpdraft_rw_own` — `FOR ALL … USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`. Full CRUD on the user's own scratchpad row. **A→B: NO.** PASS.

### `custom_project_deliveries` — `0033:495`
```sql
create policy "cpd_select_delivered" for select using (exists (
  select 1 from public.custom_project_requests r
  where r.id = request_id and r.user_id = auth.uid() and r.status = 'delivered'));
```
**A→B read: NO**, and even the owner sees a delivery only once `status='delivered'`. No user write policy. `custom_project_delivery_assets` (`0033:496`) — same, joined through the delivery. PASS.

**Summary of Section 3:** no policy in this list has a `USING`/`WITH CHECK` that is effectively `true` for a write. The only cross-user *read* is the deliberate `referrals_select_successful` leaderboard policy (converted referrals only, names masked).

---

## 4. PREMIUM / ANSWER-KEY LEAKS

### 4a. Can a signed-in NON-premium user SELECT rows for a premium test? — **YES (H2)**

`test_questions` policy — `mobile-app/…/0016_practice_tests.sql:64-67`:
```sql
create policy "test_questions_select_public"
  on public.test_questions for select
  using (true);
```
`practice_tests` policy — `0016:59-62`:
```sql
create policy "practice_tests_select_public"
  on public.practice_tests for select
  using (true);
```
`0048_topic_practice.sql:119-125` re-creates `practice_tests_select_public` adding `status='published'` + platform + academic targeting — **but still no `is_premium` gate**:
```sql
create policy "practice_tests_select_public" on public.practice_tests
  for select using (
    coalesce(status, 'published') = 'published'
    and (coalesce(show_on_website, true) or coalesce(show_on_mobile, true))
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id));
```
`test_questions` is **never re-scoped** — it stays `USING (true)` (also readable by **`anon`**). There is **no column-level `GRANT`/`REVOKE`** on either table (grep confirmed: zero column grants on `test_questions` / `practice_tests` / `dsa_problems` anywhere).

**Consequences:**
- `GET /rest/v1/test_questions?test_id=eq.<any>&select=id,correct_index,explanation` returns the **full answer key** to any caller, signed-in or anonymous, before submitting.
- `GET /rest/v1/practice_tests?is_premium=eq.true` lists every premium test; its questions are then readable via the line above.
- `submit_test_attempt()` (`0040:30-112`) checks only `if not exists (select 1 from public.practice_tests where id = p_test_id)` — **no premium / entitlement check** — so a non-premium user can also *record a scored attempt* on a premium test.

The website's own comment in `0016:51-54` acknowledges this ("if that ever matters, move scoring into an Edge Function and drop `correct_index` from this policy") — scoring *was* moved server-side (0040) but `correct_index` was **not** dropped from the read path.

### 4b. Can any authenticated user SELECT `correct_index` for a test they have not submitted? — **YES** (same as 4a; anon can too).

### 4c. Does `submit_test_attempt` re-check premium AND recompute the score server-side? — **score: YES / premium: NO**

`0040_test_attempt_scoring.sql:62-90` recomputes `v_score` / `v_correct` / `v_total_marks` from `test_questions.correct_index` and `marks` via a CTE; the client-sent score is never read. **The client score is not trusted.** ✓
But there is **no `current_user_is_premium()` / `is_admin()` check** — a non-premium user's submission on a premium test succeeds and is recorded. ✗ (part of **H2**).

### 4d. Do `coding_problem_run_cases` / `practice_problem_run_cases` refuse hidden cases + premium bodies for a non-entitled caller? — **the RPCs: YES. The underlying table: NO (H3).**

`coding_problem_run_cases()` — `0048_topic_practice.sql:282-333`:
```sql
if (coalesce(v.is_premium, false) or coalesce(v.topic_premium, false))
   and not public.current_user_is_premium()
   and not public.is_admin(auth.uid()) then
  return null;
end if;
... jsonb_build_object('input', coalesce(tc->>'input',''), 'expected', ..., 'hidden', coalesce((tc->>'hidden')::boolean, true))
```
The route then strips `input`/`expected` from `hidden` cases. `practice_problem_run_cases()` (`0072:344-394`) is identical. **These RPCs are correct.** ✓

**But `dsa_problems` is directly readable via PostgREST** — `dsa_problems_select_public` (`0048:104-117`):
```sql
create policy "dsa_problems_select_public" on public.dsa_problems
  for select using (
    coalesce(status, 'published') = 'published'
    and (coalesce(show_on_website, true) or coalesce(show_on_mobile, true))
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
    and (
      not coalesce(is_premium, false)
      or public.current_user_is_premium()
      or public.is_admin(auth.uid())
    ));
```
The premium gate hides the **row** for a premium problem, but for every **non-premium** coding / practice problem (the large majority — the 0073–0089 seed pairs are `is_premium=false`), the row is fully readable, including:
- `dsa_problems.test_cases` — **the hidden judge cases** (`0048:77` adds this column). `GET /rest/v1/dsa_problems?slug=eq.<x>&select=test_cases` returns every hidden input/expected.
- `dsa_problems.solution_code` (`0018_dsa.sql:40`) and `solution_approach` / `editorial` — the **reference solution**, readable directly → trivial "auto-solve".

There is **no column-level `REVOKE`** to stop this. The redaction logic lives only in the RPC/route, which an attacker doesn't have to use.

### Finding H2 — answer keys & premium test content world-readable — HIGH
### Finding H3 — hidden judge cases & reference solutions readable for every free problem — HIGH

**Suggested fix (suggestion only — do NOT apply):** column-level privilege lockdown + route everything through the RPCs.
```sql
-- H2: stop the answer key leaving the DB, and premium-gate the test itself
revoke select (correct_index, explanation) on public.test_questions from anon, authenticated;
-- keep only the columns the quiz UI needs:
grant  select (id, test_id, question_text, options, marks, sort_order) on public.test_questions to anon, authenticated;

drop policy if exists "practice_tests_select_public" on public.practice_tests;
create policy "practice_tests_select_public" on public.practice_tests for select using (
  coalesce(status,'published') = 'published'
  and (coalesce(show_on_website,true) or coalesce(show_on_mobile,true))
  and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
  and (not coalesce(is_premium,false) or public.current_user_is_premium() or public.is_admin(auth.uid())));

-- and add to submit_test_attempt(), right after the "test not found" check:
--   if (select is_premium from public.practice_tests where id = p_test_id)
--      and not public.current_user_is_premium() and not public.is_admin(auth.uid())
--   then raise exception 'This is a premium test' using errcode = 'insufficient_privilege'; end if;

-- H3: never expose the hidden cases / reference solution as columns
revoke select (test_cases, solution_code, solution_approach, editorial) on public.dsa_problems from anon, authenticated;
grant  select (id, topic_id, learning_topic_id, slug, title, difficulty, sort_order, description,
               examples, constraints, starter_code, time_complexity, space_complexity,
               is_premium, status, show_on_website, show_on_mobile,
               target_type, target_course_id, target_branch_ids, target_year_id,
               created_at, updated_at)
  on public.dsa_problems to anon, authenticated;
```
(Column-level `GRANT` requires the table's blanket `GRANT SELECT` to be narrowed — verify PostgREST role grants first. The RPCs already read these columns internally and are unaffected because they run SECURITY DEFINER as the owner.)

---

## 5. SECURITY DEFINER FUNCTIONS

Every `SECURITY DEFINER` function found, with identity handling and `search_path`:

| Function | File:line | Pins caller to `auth.uid()`? | Trusts a `user_id` arg? | `SET search_path`? |
|---|---|---|---|---|
| `email_for_mobile(text)` | `0001_profiles.sql:61` | n/a (pre-session lookup) | no (takes `p_mobile`) | ✅ `= public` |
| `handle_new_user()` | `0001:76` | uses `new.id` from `auth.users` trigger | no | ✅ |
| `ensure_referral_code()` | `0021_referrals.sql:116` | `new.id` (trigger) | no | ✅ |
| `link_referral_on_signup()` | `0021:162` / redef `0026:82` | `new.id` (trigger); **rejects `referrer = new.id`** (self-referral) | no | ✅ |
| `increment_project_sales_count(text)` | `0025_rpc_helpers.sql:10` | n/a | no | ✅ · `execute` → `service_role` only |
| `referral_reward_for(numeric)` | `0026_referral_reward_settings.sql:44` | n/a | no | ✅ |
| `convert_referral_on_first_purchase()` | `0026:137` | `new.user_id` (purchases trigger) | no | ✅ |
| `check_rate_limit(uuid,text,int,int)` | `0030_edge_order_rate_limit.sql:30` | no — takes `p_user_id` | **yes, by design** — `execute` → `service_role` only (Edge Functions pass the verified user id) | ✅ |
| `current_user_course_id()` / `current_user_branch_id()` / `current_user_year_id()` | `0036_academic_visibility.sql:50`, `0035`, `0044:386` | ✅ `where pr.id = auth.uid()` | no | ✅ |
| `current_user_is_premium()` | `0042_learning_management.sql:253` | ✅ `where id = auth.uid()` | no | ✅ |
| `learning_grid_visible` / `_section_visible` / `_topic_visible` | `0042:263,281,301` / redef `0044` | n/a (takes an id) | no | ✅ |
| `learning_row_visible(text,text,text[],text)` | `0044_learning_unification.sql:~400` | calls the `current_user_*` resolvers | no | ✅ |
| `learning_grids_list` / `learning_tree` / `learning_topic_content` / `learning_search` / `learning_sitemap` | `0042:408,435,486,587,650` | premium/visibility via `current_user_is_premium()`+`is_admin()` | no | ✅ |
| `learning_topic_practice` / `coding_problem_detail` / `coding_problem_run_cases` / `mock_test_detail` / `coding_problems_sitemap` | `0048_topic_practice.sql:134,207,282,340,391` | premium via `current_user_is_premium()`+`is_admin()` | no | ✅ |
| `practice_categories` / `practice_problems_list` / `practice_problem_detail` / `practice_problem_run_cases` / `practice_problems_sitemap` | `0072_practice_coding.sql:176,214,276,344,400` | premium via `current_user_is_premium()`+`is_admin()` | no | ✅ |
| `protect_profile_is_premium()` / `sync_profile_is_premium()` (redef) / `protect_premium_subscription_fields()` | `0037_protect_is_premium.sql:86,57,112` | trigger context; `protect_premium_subscription_fields` checks `current_user` + `is_admin(auth.uid())` | no | ⚠️ `sync_*` & `protect_*` have **no** `SET search_path` — they are plain `plpgsql` triggers (not DEFINER for `protect_*`; `sync_*` inherits). Trigger functions on a specific table are lower-risk; note only. |
| `request_withdrawal(numeric,text)` | `0038_wallet_withdrawal_rpc.sql:35` | ✅ `v_uid := auth.uid()`, insert `user_id = v_uid`; `pg_advisory_xact_lock` + real-balance check | no | ✅ |
| `record_legal_consent(text,text,text,text)` | `0039_legal_consent.sql:50` | ✅ `v_uid := auth.uid()`, insert pins `user_id`+`accepted_at` | no | ✅ |
| `submit_test_attempt(text,jsonb,int)` | `0040_test_attempt_scoring.sql:30` | ✅ `v_uid := auth.uid()`; recomputes score from answer key | no | ✅ — **but no premium check (H2)** |
| `match_resume_to_jd(...)` / `compute_ats_breakdown(...)` | `0057`/`0058_resume_jd_match.sql` | operate on a `p_resume_id` — **rely on caller RLS** (INVOKER-style read of `resumes_builder`) | takes `p_resume_id`, not a user id | `0058` ✅ (`match_resume_to_jd` is `SET search_path`); verify `compute_ats_breakdown` |
| `get_shared_resume(text)` | `0060_resume_shares.sql:72` | n/a (anon path); validates active+unexpired token; hand-picked projection (no id/user_id/ats_score) | no | ✅ |
| `prune_resume_versions()` | `0061_resume_versions.sql:39` | trigger; only touches `resume_id = new.resume_id` | no | ✅ |
| `restore_resume_version(uuid)` | `0061:70` | **SECURITY INVOKER** (deliberate) — inherits caller RLS on `resume_versions` + `resumes_builder`; a forged id → "not found" | no | ❌ **no `SET search_path`** — **M4** (invoker rights limit impact; `authenticated` cannot create objects in `public` by default, so exploitability is low) |
| `report_shared_resume(text,text)` | `admin …/035_resume_shares_admin.sql:44` | n/a (anon); validates token→active share; 1-hour per-share dedupe | no | ✅ |
| `submit_contact_message(text,text,text,text)` | `website/…/0001:57` | records `auth.uid()` (no user_id param); validates + rate-limits 4/h/client-key | no | ✅ |
| `is_admin(uuid)` | `admin …/001_admin_core.sql:55` | default arg `auth.uid()`; callers pass `auth.uid()` | takes `uid` (for `is_admin(auth.uid())` in policies) | ✅ |
| `current_admin_role()` / `has_permission(uuid,text,text)` | `admin …/001:60,91` | `has_permission` takes `p_user_id` — always called with `auth.uid()` | mild | ✅ |
| `log_admin_activity(...)` | `admin …/001:227` | `if not public.is_admin(auth.uid()) then raise` | no | ✅ |
| `admin_adjust_wallet(uuid,text,text,numeric,text)` | `admin …/002_admin_rls_policies.sql:136` | `if not public.is_admin(auth.uid()) then raise`; balance check on debit | takes `p_user_id` (admin acts on a target) — **gated by `is_admin()`** | ✅ |
| `admin_process_refund(uuid,text,text)` | `admin …/007_commerce_admin.sql:181` | `if not public.is_admin(auth.uid()) then raise`; `select … for update` | reads the request row | ✅ — **but see C1 (trusts `r.amount`)** |
| `admin_process_withdrawal(uuid,text,text)` | `admin …/007:229` | `if not public.is_admin(auth.uid()) then raise`; `for update` + balance check | reads the request row | ✅ |

**Verdict:** every SECURITY DEFINER function that a normal session can call either (a) pins the acting identity to `auth.uid()` internally, or (b) is `execute`-granted to `service_role` only, or (c) re-checks `is_admin(auth.uid())` as its first statement. **None trusts a client-supplied `user_id` to decide *whose* data to act on.** The `SET search_path = public` hygiene is applied on **every** SECURITY DEFINER function except `restore_resume_version()` (which is INVOKER — **M4**) and the plain trigger functions.

**Specifically requested functions — all PASS:**
- `record_legal_consent` — pins `user_id`+`accepted_at`; no client INSERT policy on `legal_consents`.
- `get_shared_resume` — token-gated, narrow projection, no id/user_id leak.
- `report_shared_resume` — token→active-share validation, per-share dedupe.
- `submit_contact_message` — `auth.uid()` recorded, DB-side rate limit, no user_id param.
- `email_for_mobile` — returns only an email string for an exact mobile match (enumeration oracle — **L2**).
- `submit_test_attempt` — recomputes score from the answer key; **missing** premium check (**H2**).
- `restore_resume_version` — INVOKER, inherits caller RLS on both tables; no `search_path` (**M4**).
- `learning_topic_content` — enforces publish/platform + returns `contents: []` when `v_locked` (`0042:520,548-556`). PASS.

---

## 6. REFERRAL ABUSE

Functions: `handle_new_user()` (`0001:76`), `ensure_referral_code()` (`0021:116`), `link_referral_on_signup()` (`0021:162` → redefined `0026:82`), `convert_referral_on_first_purchase()` (`0021:282` → redefined `0026:137`), `sync_referral_totals()` (`0021:228`), `referral_reward_for()` (`0026:44`).

| Question | Answer |
|---|---|
| **Can a user refer themselves?** | **No.** At signup the new profile has no code yet, and `link_referral_on_signup()` explicitly bails: `if referrer is null or referrer = new.id then return new;` (`0026:102`). Setting `profiles.referral_code` *after* signup is inert (the trigger is `AFTER INSERT` only). |
| **Can a code be replayed / farmed for rewards?** | **Not cheaply.** `referrals_unique_pair_key` — partial unique index on `(referrer_id, referred_user_id)` (`0021:52`) — plus the `if not exists (…)` guard (`0026:106`) → **one referral row per (referrer, referee) pair**. Conversion fires only on the referee's **first** successful purchase (`if (select count(*) from public.purchases where user_id = new.user_id and status = 'success') > 1 then return null;` — `0026:158`). The wallet bonus is written once, protected by `wallet_transactions_referral_bonus_key` partial unique index (`0021:220`) + the `not exists` guard in `sync_referral_totals()` (`0021:245`). Farming therefore requires N genuine `auth.users` each making a genuine paid purchase. |
| **Is `reward_settings.max_payout` enforced in SQL?** | **Partially.** `referral_reward_for()` caps **percentage** bonuses at `s.max_payout` (`0026:63-65`). **Flat bonuses are NOT capped** — `reward := coalesce(s.bonus_value, 0)` is paid in full (`0026:68`). If an admin sets `bonus_type='flat'` with a large `bonus_value`, every conversion pays it. **L3 (LOW)** — admin-configured, not user-exploitable. |
| **Are `referral_codes.total_earned` / wallet credits writable by the user?** | **No.** `referral_codes`, `referrals`, `referral_earnings` have **no user INSERT/UPDATE/DELETE policy** (`0021:80-105`) — only trigger/service-role writes. `wallet_transactions` has no client INSERT policy after 0038. `total_earned` is recomputed by `sync_referral_totals()` from `sum(reward_amount) where status='successful'` (`0021:262-266`). |

**Verdict: the referral system is server-enforced and abuse-resistant.** One nit (**L3**): flat bonuses ignore `max_payout`. All four trigger functions are `SECURITY DEFINER … SET search_path = public`.

---

## 7. STORAGE

Buckets and `storage.objects` policies:

| Bucket | Public? | Created | Object policies | Path scoping |
|---|:---:|---|---|---|
| `avatars` | **public** | `0029_storage_buckets.sql:13` | `avatars_public_read` (SELECT `bucket_id='avatars'`), `avatars_owner_write` / `_owner_update` / `_owner_delete` | `(storage.foldername(name))[1] = auth.uid()::text` ✅ |
| `resumes` | **private** | `0029:19` | `resumes_owner_all` (`FOR ALL to authenticated`), `resumes_admin_read` (guarded, `is_admin()`) | `bucket_id='resumes' AND (storage.foldername(name))[1] = auth.uid()::text` ✅ |
| `custom-project-uploads` | **private** | `0033_custom_project_builder.sql:585` | `cp_uploads_owner_all` (FOR ALL), `cp_uploads_admin_read` (guarded) | `(storage.foldername(name))[1] = auth.uid()::text` ✅ |
| `custom-project-deliveries` | **private** | `0033:589` | `cp_deliveries_owner_read` (SELECT), `cp_deliveries_admin_all` (guarded) | `(storage.foldername(name))[1] = auth.uid()::text` ✅ |
| `project-files` / `project-media` / `resume-templates` / `site` | mixed | admin 003 / 006 / 009 | admin write + public/there-scoped read | catalog assets — n/a |

- **`resumes` is private and correctly scoped** to `(storage.foldername(name))[1] = auth.uid()::text` — exactly the pattern the question asks for. ✅
- **Path traversal:** `storage.foldername(name)` splits on `/` and `[1]` is the first segment; a key like `../<victim>/x` has first segment `..`, which is not `auth.uid()::text`, so the write is rejected. A key `<victim-uuid>/x` fails the `= auth.uid()::text` check. ✅ No traversal.
- **M5 (MEDIUM): no bucket-level `file_size_limit` or `allowed_mime_types`.** Every `insert into storage.buckets` sets only `(id, name, public)` — there is no size/MIME restriction at the storage layer. The apps validate size + extension client- and route-side (`website/src/lib/resume.ts`, `/api/resume/parse`), but a direct `storage.from('resumes').upload()` with the anon key + a session bypasses those checks and can put an arbitrary-type, arbitrary-size object in the user's own folder. Impact is bounded (own folder, private bucket, admin-read only) but a 5 GB upload or an `.html`/`.svg` payload later surfaced via a signed URL is worth closing.
  *Suggested (not applied):* `update storage.buckets set file_size_limit = 10485760, allowed_mime_types = array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'] where id = 'resumes';` (and similar per bucket).

---

## 8. EDGE FUNCTIONS — payment verification

Read: `mobile-app/supabase/functions/_shared/razorpay.ts`, `verify-razorpay-payment/index.ts`, and (by shared pattern) `verify-premium-payment`, `verify-wallet-topup-payment`, `verify-custom-project-payment`.

| Check | Result | Evidence |
|---|:---:|---|
| **HMAC-SHA256 signature verified server-side** | ✅ | `_shared/razorpay.ts:58-82` — `crypto.subtle` HMAC over `` `${razorpayOrderId}|${razorpayPaymentId}` `` with `RAZORPAY_KEY_SECRET`; **constant-time hex compare** (`timingSafeEqualHex`, `:85-92`). `KEY_SECRET` is `Deno.env.get` only, never returned or logged. |
| **Amount read from the DB, never from the request body** | ✅ | `verify-razorpay-payment/index.ts:40` destructures only `{ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` — **no amount field**. The wallet debit uses `updated.total_amount` read back from `purchases` (`:102-108`). `create-*-order` functions compute the paise amount from DB catalog rows + `reward_settings`. |
| **Ownership + order binding** | ✅ | `:58-63` — `owner.user_id !== user.id → 403`; `:64-66` — `purchase.razorpay_order_id !== razorpayOrderId → 400`. |
| **Idempotent on repeat call with the same payment id** | ⚠️ **check-then-act, no lock** | `:69` — `if (purchase.status === "success") return json(purchase);` guards the *common* repeat. But it is a read (`:49-53`) followed by an unconditional `update … set status='success'` + `increment_project_sales_count` + `wallet_transactions.insert` (`:88-108`) with **no row lock, no unique constraint on the side-effect rows, and no `WHERE status <> 'success'` on the UPDATE**. Two verify calls fired within the same few ms on a still-`pending` order can both pass `:69` and both run the side effects → **double `project_purchase` wallet debit** and a double `sales_count` bump. **M3.** |

**M3 suggested hardening (not applied):** make the settle UPDATE the concurrency gate —
`update purchases set status='success', … where id = :orderId and status <> 'success' returning *;` — and only run the side effects when a row was returned; or add `select … for update` on the purchase row at the top of the transaction; or a unique index on `wallet_transactions (razorpay_payment_id)` for `category='project_purchase'`.

**Auth:** all verify functions call `getUser(req)` and 401 if absent (`verify-razorpay-payment/index.ts:36-37`). The `adminClient()` (service role) is used only *after* the signature + ownership checks pass. ✅

---

## Appendix A — CRITICAL finding, in full

### C1 — `refund_requests`: arbitrary wallet credit + cross-user purchase tampering on admin approval

**Files:**
- Table + policies: `admin-panel/supabase/migrations/007_commerce_admin.sql:64-90`
- Settle function: `admin-panel/supabase/migrations/007_commerce_admin.sql:181-227`

**Policy (verbatim):**
```sql
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references public.purchases (id) on delete cascade,   -- NULLABLE
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10,2) not null default 0,                              -- NO check constraint
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  refund_to text not null default 'wallet' check (refund_to in ('wallet','source')),
  ...
);
create policy "refund_requests_insert_own" on public.refund_requests
  for insert with check (auth.uid() = user_id and status = 'pending');   -- amount UNCONSTRAINED
```
**Settle function (verbatim excerpt):**
```sql
create or replace function public.admin_process_refund(p_request_id uuid, p_decision text, p_note text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare r public.refund_requests%rowtype; v_txn_id uuid;
begin
  if not public.is_admin(auth.uid()) then raise exception '…not an active admin'; end if;
  select * into r from public.refund_requests where id = p_request_id for update;
  ...
  if p_decision = 'approve' then
    if r.refund_to = 'wallet' then
      insert into public.wallet_transactions (user_id, type, category, amount, description)
      values (r.user_id, 'credit', 'cashback', r.amount,                 -- ← r.amount trusted verbatim
              'Refund for order ' || coalesce(r.purchase_id::text, ''))
      returning id into v_txn_id;
    end if;
    if r.purchase_id is not null then
      update public.purchases set status = 'refunded' where id = r.purchase_id;  -- ← no user_id / status / amount check
    end if;
    ...
```

**Why it's CRITICAL:**
1. `refund_requests_insert_own` lets a user insert a row with `user_id = self`, `status = 'pending'`, and **any `amount`** (no `CHECK`, no policy constraint) — e.g. `amount = 999999.99`.
2. `purchase_id` is **nullable** and only FK-constrained to *exist* — a user can set it to `null` (refund for nothing) or to **another user's** `purchases.id`.
3. `admin_process_refund()` on `approve` credits `r.amount` to `r.user_id`'s wallet with **no validation that `r.amount ≤ purchases.total_amount`**, that `purchases.user_id = r.user_id`, or that the purchase is `status='success'` and not already `refunded`.
4. It then flips `purchases.status='refunded'` for whatever `purchase_id` was supplied — including **another user's** successful purchase (griefing: that user loses access / the row now reads "refunded").
5. The **only** control is an admin visually noticing an absurd amount in the refund queue before clicking approve. The admin panel's refund list (`admin-panel/src/lib/…`) surfaces the requested `amount` as-is.

This is the single place in the schema where a user-controlled numeric flows into a wallet **credit** with no server-side ceiling.

**Suggested fix (SUGGESTION ONLY — do NOT apply; owner decides):**
```sql
-- 1. constrain the request itself
alter table public.refund_requests
  add constraint refund_requests_amount_nonneg check (amount >= 0),
  alter column purchase_id set not null;   -- a refund must reference a real purchase

-- 2. make admin_process_refund derive/validate the amount from the purchase
create or replace function public.admin_process_refund(p_request_id uuid, p_decision text, p_note text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  r  public.refund_requests%rowtype;
  pu public.purchases%rowtype;
  v_refund numeric(10,2);
  v_txn_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_process_refund: caller is not an active admin';
  end if;

  select * into r from public.refund_requests where id = p_request_id for update;
  if not found then raise exception 'refund request not found'; end if;
  if r.status <> 'pending' then raise exception 'refund request already %', r.status; end if;

  select * into pu from public.purchases where id = r.purchase_id for update;
  if not found then raise exception 'linked purchase not found'; end if;
  if pu.user_id <> r.user_id then raise exception 'refund request does not match the purchase owner'; end if;
  if pu.status <> 'success' then raise exception 'purchase is % — not refundable', pu.status; end if;

  -- clamp the payout to what was actually paid; never trust r.amount as a ceiling
  v_refund := least(coalesce(r.amount, pu.total_amount), pu.total_amount);
  if v_refund <= 0 then raise exception 'refund amount must be positive'; end if;

  if p_decision = 'approve' then
    if r.refund_to = 'wallet' then
      insert into public.wallet_transactions (user_id, type, category, amount, description)
      values (r.user_id, 'credit', 'cashback', v_refund, 'Refund for order ' || r.purchase_id::text)
      returning id into v_txn_id;
    end if;
    update public.purchases set status = 'refunded' where id = r.purchase_id;   -- already ownership+status checked
    update public.refund_requests
       set status = 'approved', amount = v_refund, decided_by = auth.uid(),
           decided_at = now(), decision_note = p_note, wallet_transaction_id = v_txn_id
     where id = p_request_id;
  elsif p_decision = 'reject' then
    update public.refund_requests
       set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = p_note
     where id = p_request_id;
  else
    raise exception 'decision must be approve or reject';
  end if;

  return v_txn_id;
end;
$$;
```
(`admin_process_withdrawal()` already does the equivalent balance check with a row lock, so no change is needed there.)

---

## Appendix B — items that are NOT findings (verified good)

- **RLS coverage 100 %** — no table with RLS OFF.
- **No open write policy** — grep for `for (all|insert|update|delete) … (using|with check) (true)` across every non-seed migration in all three trees returned **zero** matches. Every `USING (true)` is a `FOR SELECT` on a catalog/reference table (or `reviews`, deliberately public).
- **SEC-001 (self-granted premium)** — closed by `0037` BEFORE UPDATE triggers on `profiles` and `premium_subscriptions`; not re-opened.
- **SEC-002 (wallet over-withdrawal)** — closed by `0038`: `wallet_transactions` has no client INSERT policy; `request_withdrawal()` takes `pg_advisory_xact_lock` and recomputes the real balance before inserting the debit.
- **Test-score forgery** — closed by `0040`: client INSERT policies dropped; `submit_test_attempt()` recomputes from the answer key.
- **Custom-project pipeline** — no user write to `custom_project_requests`; deliveries gated on `status='delivered'`; messages force `sender_role='student'`.
- **Learning premium** — enforced at the row level in `learning_contents_select_public` **and** inside every read RPC.
- **`get_shared_resume`** — token + active + unexpired; projection excludes `id`, `user_id`, `ats_score`.
- **Razorpay** — real HMAC-SHA256, constant-time compare, amount from DB, ownership + order binding, common-case idempotent.
- **`edge_rate_limits`, `contact_rate_limits`, `contact_submissions`, `resume_share_reports`, `custom_project_admin_inbox`** — RLS ON with **no** anon/authenticated policy (locked to SECURITY DEFINER functions / service role / admin).
- **`learning_search`** — `language sql` (no dynamic `EXECUTE`); the term is a bound value in `ilike '%' || term || '%'`, **not** SQL-injectable; premium snippet withheld.

---

## Appendix C — MEDIUM / LOW register

| ID | Sev | Where | Note |
|---|---|---|---|
| M1 | MEDIUM | `admin …/007_commerce_admin.sql:33,58` | `coupons_select_public` / `offers_select_public` are `USING (true)` — every coupon code (incl. unreleased / influencer / high-value) and offer config is enumerable by `anon` via `GET /rest/v1/coupons`. Scope to `is_active AND (valid_from is null or now() >= valid_from) AND (valid_to is null or now() <= valid_to)` at minimum, or drop the public policy and serve coupons through a validate-on-apply RPC. |
| M2 | MEDIUM | `0023_notifications.sql:56`, `0013_job_personalization.sql:72` | `notifications_update_own` / `job_alerts_update_own` have `WITH CHECK (auth.uid() = user_id)` with no column allow-list. Own-row only, cosmetic. (Serious instance = `profiles`, tracked as H1.) |
| M3 | MEDIUM | `verify-razorpay-payment/index.ts:69,88-108` (+ sibling verify fns) | Idempotency is check-then-act with no row lock / unique guard → concurrent double-fire can double-debit the wallet and double-bump `sales_count`. |
| M4 | MEDIUM | `0061_resume_versions.sql:70` | `restore_resume_version()` is SECURITY INVOKER with no `SET search_path`. Low exploitability (invoker rights; `authenticated` can't create objects in `public`), but add `set search_path = public` for consistency. |
| M5 | MEDIUM | `0029_storage_buckets.sql:13,19`, `0033:585,589` | No `file_size_limit` / `allowed_mime_types` on any bucket — direct `storage.upload()` bypasses the app's size/extension checks (own folder, private buckets only). |
| L1 | LOW | `admin …/034_resume_ai_prompts.sql:27` | `resume_ai_prompts_select_public USING (true)` — the AI system prompts are world-readable (aids prompt-injection crafting). Intentional (website reads with the anon key); content is anodyne. |
| L2 | LOW | `0001_profiles.sql:61` | `email_for_mobile(text)` — mobile-number → email oracle for `anon` (account enumeration). |
| L3 | LOW | `0026_referral_reward_settings.sql:66-69` | `referral_reward_for()` caps **percent** bonuses at `max_payout` but pays **flat** bonuses in full — an admin misconfiguration risk, not user-exploitable. |
| L4 | LOW | `0001_profiles.sql:51` + `admin …/002:32` | `profiles.email` is self-writable (no column pin) → a spoofed email string in the admin students list / display fallbacks. (Rolled into H1's fix.) |
| L5 | LOW | `0060_resume_shares.sql:96` | `get_shared_resume()` increments `view_count` on every call with no throttle — a refresh loop inflates the owner's view count. Cosmetic. |
| — | NOTE | `0072_practice_coding.sql:152`, `0018_dsa.sql:83-92` | `coding_submissions` / `user_dsa_progress` INSERT/UPDATE let a user record self-chosen `verdict` / `passed` / `status='solved'` for their own rows — personal-stat integrity only, no money, no cross-user. |
| — | NOTE | `0021_referrals.sql:96-100` | `referrals_select_successful` deliberately exposes converted referral rows (referrer id, referee id, reward, dates) to every authenticated user for the leaderboard. Names masked by `profiles` RLS. Intentional; revisit if the leaderboard is removed. |

---

*End of report. No migration was written or modified. Awaiting direction on which findings to fix and in which order.*

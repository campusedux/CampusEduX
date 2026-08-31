-- ============================================================================
-- 002_admin_rls_policies.sql — admin-read / admin-write policy on EVERY shared table
-- ============================================================================
-- Project rule: because this admin panel and the mobile app share one Supabase
-- project, every table's RLS needs an ADDITIONAL admin policy alongside the
-- existing `auth.uid() = user_id` student policy (which is left untouched —
-- these are additive/OR policies). The rule's example is:
--
--     create policy "admins can view all" on projects for select using (
--       exists (select 1 from profiles where id = auth.uid()
--               and role in ('super_admin','admin','editor','support','viewer')));
--
-- Here that check is factored into `public.is_admin(auth.uid())` from
-- 001_admin_core.sql — `exists (select 1 from admin_users where id = uid and
-- status = 'active')` — since staff live in `admin_users`, not `profiles`.
-- Any of the 5 roles satisfies it; role granularity (viewer = read-only,
-- support ≠ Settings, etc.) is enforced in the Next.js Server Actions via
-- `requirePermission(module, action)` → the DB `has_permission()` function,
-- belt-and-braces on top of these policies.
--
-- No service-role key is used anywhere in this panel (project rule): the
-- mobile catalog tables have no write policy at all (that design assumed a
-- service key), so admin writes are authorised by `is_admin()` instead, and
-- the transactional money moves go through SECURITY DEFINER functions below.
--
-- Every statement is guarded with `to_regclass(...)` so this file is safe to
-- run before OR after the mobile migrations, and safe to re-run. Apply AFTER
-- 001_admin_core.sql. Re-run it whenever you apply more mobile migrations.
-- ----------------------------------------------------------------------------

-- --- profiles: admin visibility + the block/unblock fields (Module 3) --------
alter table public.profiles add column if not exists status text not null default 'active';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_status_check') then
    alter table public.profiles add constraint profiles_status_check check (status in ('active', 'blocked'));
  end if;
end $$;
alter table public.profiles add column if not exists blocked_reason text;
alter table public.profiles add column if not exists blocked_at    timestamptz;
alter table public.profiles add column if not exists blocked_by    uuid references auth.users (id) on delete set null;
alter table public.profiles add column if not exists admin_notes   text;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin(auth.uid()));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin(auth.uid()));

-- --- bulk policy application ----------------------------------------------
-- Three buckets covering EVERY table in mobile-app/supabase/migrations
-- 0002–0024 (0025 is functions only):
--
--   admin_rw        → admin gets full CRUD (for all). Catalog tables the panel
--                     manages, plus user-owned tables the panel legitimately
--                     mutates (moderation, application pipeline, referral
--                     status, push fan-out).
--   admin_ro        → admin gets SELECT only. User-owned data the panel just
--                     reports on; nothing here should be edited by hand.
--   admin_ro_locked → admin gets SELECT only ON PURPOSE — all writes must go
--                     through the transactional SECURITY DEFINER functions so
--                     the ledger can never drift (project rule: wallet / refund
--                     / withdrawal approvals must be transactional).
do $$
declare
  t text;
  admin_rw text[] := array[
    -- catalog (world-readable, panel-managed)
    'categories', 'projects', 'project_images', 'project_files', 'project_versions',
    'companies', 'recruiters', 'jobs',
    'aptitude_topics', 'practice_tests', 'test_questions',
    'dsa_topics', 'dsa_problems', 'hr_questions',
    'resume_templates', 'premium_plans', 'premium_features', 'offer_banners',
    -- user-owned but panel-mutated
    'reviews',                      -- Module 11: approve / reject / delete
    'applications', 'application_stages',  -- Module 5: shortlist / reject / stages
    'referrals',                    -- Module 9: mark successful / cancelled
    'premium_subscriptions',        -- Module 3/8: cancel / extend
    'notifications'                 -- Module 10: send push (fan-out insert)
  ];
  admin_ro text[] := array[
    'downloads', 'wishlists', 'saved_jobs', 'job_alerts', 'resumes',
    'resumes_builder', 'resume_downloads',
    'test_attempts', 'test_attempt_answers', 'user_dsa_progress', 'user_favorite_questions',
    'referral_codes', 'referral_earnings',
    'user_preferences', 'notification_preferences', 'blocked_users',
    'wallet_topup_orders'
  ];
  admin_ro_locked text[] := array[
    'purchases',            -- refunds flip status via a SECURITY DEFINER fn (Phase 4)
    'wallet_transactions'   -- credits/debits via admin_adjust_wallet() + approvals
  ];
begin
  foreach t in array admin_rw loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
      execute format(
        'create policy %I on public.%I for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))',
        t || '_admin_all', t
      );
    end if;
  end loop;

  foreach t in array (admin_ro || admin_ro_locked) loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_admin_select', t);
      execute format(
        'create policy %I on public.%I for select using (public.is_admin(auth.uid()))',
        t || '_admin_select', t
      );
    end if;
  end loop;
end $$;

-- --- transactional money moves (Modules 8 & 9) ------------------------------
-- Approving a refund / withdrawal must flip the request AND write the matching
-- wallet_transactions row in one shot. The client can't do that under RLS
-- (wallet_transactions only lets a user insert their own 'withdrawal' debit),
-- so it goes through these SECURITY DEFINER functions, each of which re-checks
-- is_admin() first. `purchases` gains a 'refunded' status for the refund path.
do $$ begin
  if to_regclass('public.purchases') is not null then
    alter table public.purchases drop constraint if exists purchases_status_check;
    alter table public.purchases add constraint purchases_status_check
      check (status in ('pending', 'success', 'failed', 'refunded'));
  end if;
end $$;

create or replace function public.admin_adjust_wallet(
  p_user_id     uuid,
  p_type        text,     -- 'credit' | 'debit'
  p_category    text,     -- e.g. 'added_money', 'cashback', 'withdrawal'
  p_amount      numeric,
  p_description text default 'Admin adjustment'
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_balance numeric;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_adjust_wallet: caller is not an active admin';
  end if;
  if p_type not in ('credit', 'debit') then
    raise exception 'type must be credit or debit';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  if p_type = 'debit' then
    select coalesce(sum(case when type = 'credit' then amount else -amount end), 0)
      into v_balance from public.wallet_transactions where user_id = p_user_id;
    if v_balance < p_amount then
      raise exception 'insufficient wallet balance (have %, need %)', v_balance, p_amount;
    end if;
  end if;

  insert into public.wallet_transactions (user_id, type, category, amount, description)
  values (p_user_id, p_type, p_category, p_amount, p_description)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.admin_adjust_wallet(uuid, text, text, numeric, text) from public;
grant execute on function public.admin_adjust_wallet(uuid, text, text, numeric, text) to authenticated;

notify pgrst, 'reload schema';

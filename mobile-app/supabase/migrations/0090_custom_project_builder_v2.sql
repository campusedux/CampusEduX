-- ============================================================================
-- 0090_custom_project_builder_v2.sql — website Custom Project Builder rebuild
-- ============================================================================
-- Supports the website's rebuilt Details/Features & Files/Estimate/Payment
-- wizard (website/src/app/custom-projects/**): every "included" feature is
-- now individually toggleable, features can declare dependencies (already
-- had a column) and conflicts (new), and a fresh "AI project understanding"
-- endpoint infers project type/level/platform + suggests features from
-- freeform text (mirrors resume_ai_requests, mobile-app migration 0059).
--
-- 100% additive · idempotent · re-runnable. Nothing existing is dropped or
-- renamed at the id level — only display copy on 3 existing rows changes,
-- and the pricing/payment tables (custom_project_pricing,
-- custom_project_platform_pricing, custom_project_requests, the
-- create-custom-project-order / verify-custom-project-payment Edge
-- Functions) are completely untouched.
--
-- The admin-panel mirror lives in
-- admin-panel/supabase/migrations/062_custom_project_builder_v2.sql. Either
-- file may run first; both are guarded.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ===========================================================================
-- 1. Customer-friendly names for the 3 mandatory-included features.
--    Same ids, same pricing/eligibility — display copy only.
-- ===========================================================================
update public.custom_project_features
  set name = 'Secure Login System',
      description = 'Allow users to securely sign in and access their account.'
  where id = 'auth-email-password';

update public.custom_project_features
  set name = 'Personal Profile Management',
      description = 'Allow users to manage their personal information and account settings.'
  where id = 'user-profile';

update public.custom_project_features
  set name = 'Search and Filter Bar',
      description = 'Help users quickly find the information, products or content they need.'
  where id = 'search-basic';

-- ===========================================================================
-- 2. Feature conflicts — mechanism only, no real conflict data invented yet.
-- ===========================================================================
do $$
begin
  if to_regclass('public.custom_project_features') is null then
    raise notice '0090: custom_project_features not present yet — run 0033/0034 first; skipping.';
    return;
  end if;

  alter table public.custom_project_features
    add column if not exists conflicts text[] not null default '{}'::text[];
end $$;

-- ===========================================================================
-- 3. A handful of genuine dependency pairs (spec: dependency auto-enable).
--    Only added while the target row's own dependencies are still empty, so
--    a later admin edit is never overwritten by a re-run.
-- ===========================================================================
do $$
begin
  if to_regclass('public.custom_project_features') is null then
    return;
  end if;

  update public.custom_project_features set dependencies = array['pay-razorpay']
    where id = 'pay-subscription' and dependencies = '{}'::text[];
  update public.custom_project_features set dependencies = array['pay-razorpay']
    where id = 'pay-refund' and dependencies = '{}'::text[];
  update public.custom_project_features set dependencies = array['admin-dashboard-basic']
    where id = 'admin-analytics' and dependencies = '{}'::text[];
  update public.custom_project_features set dependencies = array['admin-dashboard-basic']
    where id = 'admin-reports' and dependencies = '{}'::text[];
end $$;

-- ===========================================================================
-- 4. custom_project_ai_requests — AI understanding call log + daily cap
--    source, mirrors resume_ai_requests (mobile-app migration 0059) exactly.
-- ===========================================================================
create table if not exists public.custom_project_ai_requests (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists custom_project_ai_requests_user_created_idx
  on public.custom_project_ai_requests (user_id, created_at desc);

alter table public.custom_project_ai_requests enable row level security;

-- Append-only log: select/insert own, no update/delete policy at all.
drop policy if exists "custom_project_ai_requests_select_own" on public.custom_project_ai_requests;
create policy "custom_project_ai_requests_select_own"
  on public.custom_project_ai_requests for select
  using (auth.uid() = user_id);

drop policy if exists "custom_project_ai_requests_insert_own" on public.custom_project_ai_requests;
create policy "custom_project_ai_requests_insert_own"
  on public.custom_project_ai_requests for insert
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';

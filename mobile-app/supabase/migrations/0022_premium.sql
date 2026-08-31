-- Fixes: GET /rest/v1/premium_plans          -> 404 PGRST205
--        GET /rest/v1/premium_features        -> 404 PGRST205
--        GET /rest/v1/premium_subscriptions    -> 404 PGRST205
--
-- src/services/premium.service.ts:
--   getPlans():    premium_plans.select("*").order("sort_order")
--     mapPlanRow(): id, name, tier, monthly_price, yearly_price,
--                   yearly_discount_percent, is_popular, features (jsonb)
--   getFeatures(): premium_features.select("*").order("sort_order")
--                  -> id, icon, title, subtitle
--   getMembership(): premium_subscriptions.select("*, plan:premium_plans(name,
--                    features)").eq("user_id", uid).eq("status", "active")
--                    .order("started_at", desc).limit(1).maybeSingle()
--     reads: id, billing_cycle, price, status, started_at, current_period_end,
--            payment_method, auto_renew
--   cancelSubscription(): premium_subscriptions.update({ auto_renew:false }).eq("id", id)
--   supabase/functions/create-premium-order / verify-premium-payment own the
--     'pending' -> 'active' transition and set the razorpay_* columns.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.premium_plans (
  id                      text        primary key,
  name                    text        not null,
  tier                    text        not null default 'premium'
                            check (tier in ('basic', 'premium', 'premium_plus')),
  monthly_price           numeric(10,2) not null default 0,
  yearly_price            numeric(10,2) not null default 0,
  yearly_discount_percent integer     not null default 0,
  is_popular              boolean     not null default false,
  features                jsonb       not null default '[]'::jsonb,
  sort_order              integer     not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table if not exists public.premium_features (
  id         text        primary key,
  icon       text        not null default 'star-outline',
  title      text        not null,
  subtitle   text        not null default '',
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.premium_subscriptions (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.profiles (id) on delete cascade,
  plan_id             text        references public.premium_plans (id) on delete set null,
  status              text        not null default 'pending'
                        check (status in ('pending', 'active', 'cancelled', 'expired')),
  billing_cycle       text        not null default 'monthly'
                        check (billing_cycle in ('monthly', 'yearly')),
  price               numeric(10,2) not null default 0,
  started_at          timestamptz,
  current_period_end  timestamptz,
  payment_method      text        not null default 'UPI',
  auto_renew          boolean     not null default true,
  razorpay_order_id   text,
  razorpay_payment_id text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists premium_subscriptions_user_id_idx
  on public.premium_subscriptions (user_id, started_at desc);
create unique index if not exists premium_subscriptions_razorpay_order_id_key
  on public.premium_subscriptions (razorpay_order_id) where razorpay_order_id is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   premium_plans / premium_features: world-readable catalog.
--   premium_subscriptions: read own; the client may only toggle auto_renew
--     (cancelSubscription). Activation / status changes are service-role only.
-- ---------------------------------------------------------------------------
alter table public.premium_plans         enable row level security;
alter table public.premium_features      enable row level security;
alter table public.premium_subscriptions enable row level security;

drop policy if exists "premium_plans_select_public" on public.premium_plans;
create policy "premium_plans_select_public"
  on public.premium_plans for select
  using (true);

drop policy if exists "premium_features_select_public" on public.premium_features;
create policy "premium_features_select_public"
  on public.premium_features for select
  using (true);

drop policy if exists "premium_subscriptions_select_own" on public.premium_subscriptions;
create policy "premium_subscriptions_select_own"
  on public.premium_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "premium_subscriptions_update_own" on public.premium_subscriptions;
create policy "premium_subscriptions_update_own"
  on public.premium_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status in ('active', 'cancelled'));

drop trigger if exists premium_plans_set_updated_at on public.premium_plans;
create trigger premium_plans_set_updated_at
  before update on public.premium_plans
  for each row execute function public.set_updated_at();

drop trigger if exists premium_subscriptions_set_updated_at on public.premium_subscriptions;
create trigger premium_subscriptions_set_updated_at
  before update on public.premium_subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Mirror an active subscription onto profiles.is_premium so the rest of the
-- app (which only checks that flag) stays correct without extra joins.
-- ---------------------------------------------------------------------------
create or replace function public.sync_profile_is_premium()
returns trigger
language plpgsql
as $$
declare
  uid uuid := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
begin
  update public.profiles p
     set is_premium = exists (
       select 1 from public.premium_subscriptions s
       where s.user_id = uid and s.status = 'active'
         and (s.current_period_end is null or s.current_period_end > now())
     )
   where p.id = uid;
  return null;
end;
$$;

drop trigger if exists premium_subscriptions_sync_flag on public.premium_subscriptions;
create trigger premium_subscriptions_sync_flag
  after insert or update or delete on public.premium_subscriptions
  for each row execute function public.sync_profile_is_premium();

notify pgrst, 'reload schema';

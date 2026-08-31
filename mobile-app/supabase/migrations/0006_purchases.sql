-- Fixes: GET /rest/v1/purchases -> 404 PGRST205
--        "Could not find the table 'public.purchases' in the schema cache"
--
-- Written / read by:
--   supabase/functions/create-razorpay-order   -> inserts a 'pending' row
--   supabase/functions/verify-razorpay-payment  -> flips it to 'success'
--   src/services/payment.service.ts  getOrder(), markOrderFailed(), mapOrderRow()
--   src/services/project.service.ts  getPurchasedProjects() (status='success'),
--                                    hasPurchased()
--   src/services/myProjects.service.ts getOwnedProjectDetail() (purchased_version)
--   src/services/profile.service.ts  getPurchaseHistory()
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.purchases (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references public.profiles (id) on delete cascade,
  project_id          text        not null references public.projects (id) on delete restrict,
  status              text        not null default 'pending'
                        check (status in ('pending', 'success', 'failed')),
  -- amounts, all in rupees (the Razorpay "amount" in paise is derived server-side)
  price               numeric(10,2) not null default 0,
  platform_fee        numeric(10,2) not null default 0,
  discount            numeric(10,2) not null default 0,
  total_amount        numeric(10,2) not null default 0,
  coupon_code         text,
  -- Razorpay linkage (set by the Edge Functions, never by the client)
  razorpay_order_id   text,
  razorpay_payment_id text,
  failure_reason      text,
  -- which release the buyer downloaded (myProjects "update available" flow)
  purchased_version   text        not null default '1.0',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists purchases_user_id_idx    on public.purchases (user_id, created_at desc);
create index if not exists purchases_project_id_idx  on public.purchases (project_id);
create unique index if not exists purchases_razorpay_order_id_key
  on public.purchases (razorpay_order_id) where razorpay_order_id is not null;
-- one successful purchase per user per project (hasPurchased() expects at most one)
create unique index if not exists purchases_user_project_success_key
  on public.purchases (user_id, project_id) where status = 'success';

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * a buyer may read their own orders and mark a pending one 'failed'
--     (payment.service.markOrderFailed()).
--   * rows are created and marked 'success' only by the Edge Functions, which
--     use the service-role key and bypass RLS — so there is deliberately no
--     INSERT policy and the UPDATE policy forbids escalating to 'success'.
-- ---------------------------------------------------------------------------
alter table public.purchases enable row level security;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases for select
  using (auth.uid() = user_id);

drop policy if exists "purchases_update_own_failed" on public.purchases;
create policy "purchases_update_own_failed"
  on public.purchases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status in ('pending', 'failed'));

drop trigger if exists purchases_set_updated_at on public.purchases;
create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

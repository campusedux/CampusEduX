-- ============================================================================
-- 007_commerce_admin.sql — coupons, offers, refund + withdrawal queues,
--                          reward settings, and the transactional money RPCs
-- ============================================================================
-- Apply after 001–006 (SQL Editor). Additive + guarded + re-runnable.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- --- coupons (Module 8) --------------------------------------------------
create table if not exists public.coupons (
  id             uuid        primary key default gen_random_uuid(),
  code           text        not null unique,
  description    text        not null default '',
  discount_type  text        not null default 'percent' check (discount_type in ('percent', 'flat')),
  discount_value numeric(10,2) not null default 0,
  max_discount   numeric(10,2),
  min_order      numeric(10,2) not null default 0,
  usage_limit    integer,
  used_count     integer     not null default 0,
  valid_from     timestamptz,
  valid_till     timestamptz,
  status         text        not null default 'active' check (status in ('active', 'inactive', 'expired')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at before update on public.coupons
  for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;
drop policy if exists "coupons_select_public" on public.coupons;
create policy "coupons_select_public" on public.coupons for select using (true);
drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- offers (Module 8) --------------------------------------------------
create table if not exists public.offers (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null,
  description    text        not null default '',
  discount_label text        not null default '',
  coupon_code    text,
  priority       integer     not null default 0,
  valid_from     timestamptz,
  valid_till     timestamptz,
  status         text        not null default 'active' check (status in ('active', 'inactive', 'expired')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

alter table public.offers enable row level security;
drop policy if exists "offers_select_public" on public.offers;
create policy "offers_select_public" on public.offers for select using (true);
drop policy if exists "offers_admin_all" on public.offers;
create policy "offers_admin_all" on public.offers
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- refund_requests (Module 8) --------------------------------------
create table if not exists public.refund_requests (
  id                    uuid        primary key default gen_random_uuid(),
  purchase_id           uuid        references public.purchases (id) on delete cascade,
  user_id               uuid        not null references public.profiles (id) on delete cascade,
  amount                numeric(10,2) not null default 0,
  reason                text        not null default '',
  status                text        not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  refund_to             text        not null default 'wallet' check (refund_to in ('wallet', 'source')),
  decided_by            uuid        references auth.users (id) on delete set null,
  decided_at            timestamptz,
  decision_note         text        not null default '',
  wallet_transaction_id uuid        references public.wallet_transactions (id) on delete set null,
  created_at            timestamptz not null default now()
);
create index if not exists refund_requests_status_idx on public.refund_requests (status, created_at desc);

alter table public.refund_requests enable row level security;
drop policy if exists "refund_requests_select_own" on public.refund_requests;
create policy "refund_requests_select_own" on public.refund_requests for select using (auth.uid() = user_id);
drop policy if exists "refund_requests_insert_own" on public.refund_requests;
create policy "refund_requests_insert_own" on public.refund_requests
  for insert with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "refund_requests_admin_select" on public.refund_requests;
create policy "refund_requests_admin_select" on public.refund_requests for select using (public.is_admin(auth.uid()));
drop policy if exists "refund_requests_admin_update" on public.refund_requests;
create policy "refund_requests_admin_update" on public.refund_requests
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- withdrawal_requests (Modules 8 & 9) -----------------------------
create table if not exists public.withdrawal_requests (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references public.profiles (id) on delete cascade,
  amount                numeric(10,2) not null check (amount > 0),
  method                text        not null default 'upi',
  account_details       jsonb       not null default '{}'::jsonb,
  status                text        not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by            uuid        references auth.users (id) on delete set null,
  decided_at            timestamptz,
  decision_note         text        not null default '',
  wallet_transaction_id uuid        references public.wallet_transactions (id) on delete set null,
  created_at            timestamptz not null default now()
);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests (status, created_at desc);

alter table public.withdrawal_requests enable row level security;
drop policy if exists "withdrawal_requests_select_own" on public.withdrawal_requests;
create policy "withdrawal_requests_select_own" on public.withdrawal_requests for select using (auth.uid() = user_id);
drop policy if exists "withdrawal_requests_insert_own" on public.withdrawal_requests;
create policy "withdrawal_requests_insert_own" on public.withdrawal_requests
  for insert with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "withdrawal_requests_admin_select" on public.withdrawal_requests;
create policy "withdrawal_requests_admin_select" on public.withdrawal_requests for select using (public.is_admin(auth.uid()));
drop policy if exists "withdrawal_requests_admin_update" on public.withdrawal_requests;
create policy "withdrawal_requests_admin_update" on public.withdrawal_requests
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- reward_settings (Module 9, single row) -------------------------
create table if not exists public.reward_settings (
  id                       integer     primary key default 1 check (id = 1),
  bonus_type               text        not null default 'flat' check (bonus_type in ('percent', 'flat')),
  bonus_value              numeric(10,2) not null default 100,
  min_payout               numeric(10,2) not null default 100,
  max_payout               numeric(10,2) not null default 5000,
  bonus_validity_days      integer     not null default 90,
  reward_on_signup         boolean     not null default false,
  reward_on_first_purchase boolean     not null default true,
  reward_on_subscription   boolean     not null default false,
  updated_at               timestamptz not null default now(),
  updated_by               uuid        references auth.users (id) on delete set null
);
insert into public.reward_settings (id) values (1) on conflict (id) do nothing;
drop trigger if exists reward_settings_set_updated_at on public.reward_settings;
create trigger reward_settings_set_updated_at before update on public.reward_settings
  for each row execute function public.set_updated_at();

alter table public.reward_settings enable row level security;
drop policy if exists "reward_settings_select_public" on public.reward_settings;
create policy "reward_settings_select_public" on public.reward_settings for select using (true);
drop policy if exists "reward_settings_admin_update" on public.reward_settings;
create policy "reward_settings_admin_update" on public.reward_settings
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- purchases: admin notes, payment method, referral source ------
do $$ begin
  if to_regclass('public.purchases') is not null then
    alter table public.purchases add column if not exists admin_notes     text;
    alter table public.purchases add column if not exists payment_method  text;
  end if;
  if to_regclass('public.referrals') is not null then
    alter table public.referrals add column if not exists source text not null default 'link';
  end if;
end $$;

-- keep coupons.used_count honest as coupon-bearing purchases succeed
create or replace function public.bump_coupon_usage()
returns trigger language plpgsql as $$
begin
  if new.status = 'success' and coalesce(new.coupon_code, '') <> ''
     and (tg_op = 'INSERT' or old.status is distinct from 'success') then
    update public.coupons set used_count = used_count + 1 where code = new.coupon_code;
  end if;
  return null;
end;
$$;
do $$ begin
  if to_regclass('public.purchases') is not null then
    drop trigger if exists purchases_bump_coupon on public.purchases;
    create trigger purchases_bump_coupon
      after insert or update of status on public.purchases
      for each row execute function public.bump_coupon_usage();
  end if;
end $$;

-- ============================================================================
-- Transactional money RPCs — the request flip AND the wallet_transactions row
-- happen in one function call (project rule). Each re-checks is_admin() first.
-- ============================================================================
create or replace function public.admin_process_refund(
  p_request_id uuid,
  p_decision   text,   -- 'approve' | 'reject'
  p_note       text default ''
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  r         public.refund_requests%rowtype;
  v_txn_id  uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_process_refund: caller is not an active admin';
  end if;

  select * into r from public.refund_requests where id = p_request_id for update;
  if not found then raise exception 'refund request not found'; end if;
  if r.status <> 'pending' then raise exception 'refund request already %', r.status; end if;

  if p_decision = 'approve' then
    if r.refund_to = 'wallet' then
      insert into public.wallet_transactions (user_id, type, category, amount, description)
      values (r.user_id, 'credit', 'cashback', r.amount,
              'Refund for order ' || coalesce(r.purchase_id::text, ''))
      returning id into v_txn_id;
    end if;

    if r.purchase_id is not null then
      update public.purchases set status = 'refunded' where id = r.purchase_id;
    end if;

    update public.refund_requests
       set status = 'approved', decided_by = auth.uid(), decided_at = now(),
           decision_note = p_note, wallet_transaction_id = v_txn_id
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
revoke all on function public.admin_process_refund(uuid, text, text) from public;
grant execute on function public.admin_process_refund(uuid, text, text) to authenticated;

create or replace function public.admin_process_withdrawal(
  p_request_id uuid,
  p_decision   text,
  p_note       text default ''
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  r         public.withdrawal_requests%rowtype;
  v_balance numeric;
  v_txn_id  uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_process_withdrawal: caller is not an active admin';
  end if;

  select * into r from public.withdrawal_requests where id = p_request_id for update;
  if not found then raise exception 'withdrawal request not found'; end if;
  if r.status <> 'pending' then raise exception 'withdrawal request already %', r.status; end if;

  if p_decision = 'approve' then
    select coalesce(sum(case when type = 'credit' then amount else -amount end), 0)
      into v_balance from public.wallet_transactions where user_id = r.user_id;
    if v_balance < r.amount then
      raise exception 'insufficient wallet balance (have %, need %)', v_balance, r.amount;
    end if;

    insert into public.wallet_transactions (user_id, type, category, amount, description)
    values (r.user_id, 'debit', 'withdrawal', r.amount, 'Withdrawal approved')
    returning id into v_txn_id;

    update public.withdrawal_requests
       set status = 'approved', decided_by = auth.uid(), decided_at = now(),
           decision_note = p_note, wallet_transaction_id = v_txn_id
     where id = p_request_id;
  elsif p_decision = 'reject' then
    update public.withdrawal_requests
       set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = p_note
     where id = p_request_id;
  else
    raise exception 'decision must be approve or reject';
  end if;

  return v_txn_id;
end;
$$;
revoke all on function public.admin_process_withdrawal(uuid, text, text) from public;
grant execute on function public.admin_process_withdrawal(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';

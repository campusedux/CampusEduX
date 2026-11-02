-- SEC-01. PREPARED ONLY: do not apply without separate environment-specific approval.
-- Canonical twin: admin-panel/supabase/migrations/124_razorpay_order_binding.sql.
-- New internal claims enforce binding across payment surfaces, including concurrent
-- callback/webhook writes. No capture, amount reconciliation or settlement redesign.
-- Installation locks payment writers and fails on conflicting legacy bindings;
-- it never repairs or deletes financial rows. Review conflicts separately first.
lock table public.purchases, public.wallet_topup_orders, public.premium_subscriptions,
  public.custom_project_requests, public.custom_project_payments in share row exclusive mode;

create table if not exists public.razorpay_order_bindings (
  provider_order_id text primary key check (length(btrim(provider_order_id)) > 0),
  owner_type text not null check (owner_type in ('purchase','wallet','premium','token','balance')),
  owner_id uuid not null,
  unique (owner_type, owner_id)
);
create table if not exists public.razorpay_payment_bindings (
  provider_payment_id text primary key check (length(btrim(provider_payment_id)) > 0),
  provider_order_id text not null references public.razorpay_order_bindings(provider_order_id)
);
alter table public.razorpay_order_bindings enable row level security;
alter table public.razorpay_payment_bindings enable row level security;
revoke all on public.razorpay_order_bindings, public.razorpay_payment_bindings
  from public, anon, authenticated, service_role;

-- Unique keys serialize conflicting claims even across tables and snapshots.
-- Token requests and their token ledger share one logical owner; balances do not.
create or replace function public._claim_razorpay_binding(
  p_type text, p_owner uuid, p_order text, p_payment text
) returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_order is null then
    if p_payment is not null then
      raise exception 'payment requires a provider order binding' using errcode = '23514';
    end if;
    return;
  end if;
  if length(btrim(p_order)) = 0 or (p_payment is not null and length(btrim(p_payment)) = 0) then
    raise exception 'empty provider binding' using errcode = '23514';
  end if;
  insert into public.razorpay_order_bindings values (p_order, p_type, p_owner)
    on conflict do nothing;
  if not exists (select 1 from public.razorpay_order_bindings
    where provider_order_id = p_order and owner_type = p_type and owner_id = p_owner) then
    raise exception 'provider order is already bound to another order' using errcode = '23505';
  end if;
  if p_payment is not null then
    insert into public.razorpay_payment_bindings values (p_payment, p_order)
      on conflict do nothing;
    if not exists (select 1 from public.razorpay_payment_bindings
      where provider_payment_id = p_payment and provider_order_id = p_order) then
      raise exception 'provider payment is already bound to another order' using errcode = '23505';
    end if;
  end if;
end;
$$;
revoke all on function public._claim_razorpay_binding(text,uuid,text,text)
  from public, anon, authenticated, service_role;

create or replace function public.guard_razorpay_binding()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  n jsonb := to_jsonb(new);
  o jsonb;
  order_column text := case when tg_table_name = 'custom_project_requests' then 'payment_order_id' else 'razorpay_order_id' end;
  payment_column text := case when tg_table_name = 'custom_project_requests' then 'payment_id' else 'razorpay_payment_id' end;
  owner_type text;
  owner_id uuid := new.id;
begin
  if tg_op = 'UPDATE' then
    o := to_jsonb(old);
    if not public._is_privileged_caller() and (
      n->>order_column is distinct from o->>order_column or
      n->>payment_column is distinct from o->>payment_column) then
      raise exception 'provider bindings are server owned' using errcode = '42501';
    end if;
    -- Buyers may still mark an order failed. They cannot supply/change the
    -- server-owned order identity, amounts or provider identifiers (RISK-01).
    if tg_table_name = 'purchases' and not public._is_privileged_caller()
       and (n - array['status','failure_reason','updated_at']) is distinct from
           (o - array['status','failure_reason','updated_at']) then
      raise exception 'purchase payment fields are server owned' using errcode = '42501';
    end if;
    if o->>order_column is not null and (
       n->>order_column is distinct from o->>order_column or new.id is distinct from old.id
       or n->>'user_id' is distinct from o->>'user_id'
       or n->>'request_id' is distinct from o->>'request_id'
       or n->>'kind' is distinct from o->>'kind') then
      raise exception 'provider order binding is immutable' using errcode = '23514';
    end if;
    if coalesce(o->>'token_payment_status', o->>'status') in ('success','paid','active','refund_due')
       and o->>payment_column is not null
       and n->>payment_column is distinct from o->>payment_column then
      raise exception 'settled provider payment binding is immutable' using errcode = '23514';
    end if;
  elsif not public._is_privileged_caller() and
    (n->>order_column is not null or n->>payment_column is not null) then
    raise exception 'provider bindings are server owned' using errcode = '42501';
  end if;
  owner_type := case tg_table_name
    when 'purchases' then 'purchase' when 'wallet_topup_orders' then 'wallet'
    when 'premium_subscriptions' then 'premium' when 'custom_project_requests' then 'token'
    when 'custom_project_payments' then n->>'kind' end;
  if tg_table_name = 'custom_project_payments' and n->>'kind' = 'token' then
    owner_id := (n->>'request_id')::uuid;
  end if;
  perform public._claim_razorpay_binding(owner_type, owner_id, n->>order_column, n->>payment_column);
  return new;
end;
$$;
revoke all on function public.guard_razorpay_binding() from public, anon, authenticated, service_role;

-- Backfill claims without rewriting existing orders, timestamps or entitlements.
-- Fail closed on conflicting non-null links; preserve unbound legacy rows.
do $$
declare r record;
begin
  for r in
    select 'purchase'::text as kind, id, razorpay_order_id as oid, razorpay_payment_id as pid from public.purchases
    union all select 'wallet', id, razorpay_order_id, razorpay_payment_id from public.wallet_topup_orders
    union all select 'premium', id, razorpay_order_id, razorpay_payment_id from public.premium_subscriptions
    union all select 'token', id, payment_order_id, payment_id from public.custom_project_requests
    union all select kind, case when kind = 'token' then request_id else id end,
      razorpay_order_id, razorpay_payment_id from public.custom_project_payments
  loop
    perform public._claim_razorpay_binding(r.kind, r.id, r.oid, r.pid);
  end loop;
end $$;

-- Run before the existing balance-credit trigger. A rejected binding rolls back
-- the entire statement, including any existing AFTER-trigger side effects.
drop trigger if exists a_sec01_razorpay_binding on public.purchases;
create trigger a_sec01_razorpay_binding before insert or update on public.purchases
  for each row execute function public.guard_razorpay_binding();
drop trigger if exists a_sec01_razorpay_binding on public.wallet_topup_orders;
create trigger a_sec01_razorpay_binding before insert or update on public.wallet_topup_orders
  for each row execute function public.guard_razorpay_binding();
drop trigger if exists a_sec01_razorpay_binding on public.premium_subscriptions;
create trigger a_sec01_razorpay_binding before insert or update on public.premium_subscriptions
  for each row execute function public.guard_razorpay_binding();
drop trigger if exists a_sec01_razorpay_binding on public.custom_project_requests;
create trigger a_sec01_razorpay_binding before insert or update on public.custom_project_requests
  for each row execute function public.guard_razorpay_binding();
drop trigger if exists a_sec01_razorpay_binding on public.custom_project_payments;
create trigger a_sec01_razorpay_binding before insert or update on public.custom_project_payments
  for each row execute function public.guard_razorpay_binding();

-- Index the fail-closed callback reuse reads without requiring a new public API.
create index if not exists purchases_sec01_payment_idx on public.purchases(razorpay_payment_id) where razorpay_payment_id is not null;
create index if not exists wallet_sec01_payment_idx on public.wallet_topup_orders(razorpay_payment_id) where razorpay_payment_id is not null;
create index if not exists premium_sec01_payment_idx on public.premium_subscriptions(razorpay_payment_id) where razorpay_payment_id is not null;
create index if not exists custom_request_sec01_payment_idx on public.custom_project_requests(payment_id) where payment_id is not null;
create index if not exists custom_payment_sec01_payment_idx on public.custom_project_payments(razorpay_payment_id) where razorpay_payment_id is not null;

notify pgrst, 'reload schema';

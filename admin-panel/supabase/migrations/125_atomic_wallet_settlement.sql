-- SEC-03. Local preparation only; requires separately approved deployment.
-- Canonical twin: admin-panel/supabase/migrations/125_atomic_wallet_settlement.sql.
-- Apply transactionally. No backfill: historical credits have no reliable order
-- identity. Paid orders without a matching linked credit require separate review
-- of captured provider evidence AND the complete ledger before reconciliation.
-- Never infer a historical credit from amount/time alone or automatically pay it.
lock table public.wallet_topup_orders, public.wallet_transactions in access exclusive mode;

alter table public.wallet_transactions
  add column if not exists topup_order_id uuid references public.wallet_topup_orders(id) on delete cascade;
create unique index if not exists wallet_transactions_topup_order_key
  on public.wallet_transactions(topup_order_id) where topup_order_id is not null;

-- Paid financial terms cannot drift after a credit has been issued. This also
-- preserves legacy paid orders verbatim, without certifying/recrediting them.
create or replace function public.guard_wallet_paid_terms()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if old.status = 'paid' and
     row(new.id,new.user_id,new.amount,new.currency,new.status,new.razorpay_order_id,new.razorpay_payment_id)
       is distinct from
     row(old.id,old.user_id,old.amount,old.currency,old.status,old.razorpay_order_id,old.razorpay_payment_id) then
    raise exception 'settled wallet financial terms are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_wallet_paid_terms() from public, anon, authenticated, service_role;
drop trigger if exists b_sec03_wallet_paid_terms on public.wallet_topup_orders;
create trigger b_sec03_wallet_paid_terms before update on public.wallet_topup_orders
  for each row execute function public.guard_wallet_paid_terms();

-- Deferred checks observe the final transaction state, so neither half of a
-- new settlement can commit alone, including through direct privileged writes.
-- Untouched pre-migration paid rows are deliberately not validated/backfilled.
create or replace function public.check_wallet_settlement_credit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  ids uuid[];
  oid uuid;
  o public.wallet_topup_orders;
  c public.wallet_transactions;
begin
  if tg_table_name = 'wallet_topup_orders' then
    if new.status <> 'paid' then return null; end if;
    if tg_op = 'UPDATE' and old.status = 'paid' and not exists
      (select 1 from public.wallet_transactions where topup_order_id = new.id) then
      return null; -- grandfathered legacy row, never an RPC success
    end if;
    ids := array[new.id];
  elsif tg_op = 'INSERT' then
    ids := array[new.topup_order_id];
  elsif tg_op = 'DELETE' then
    ids := array[old.topup_order_id];
  else
    ids := array[old.topup_order_id,new.topup_order_id];
  end if;
  foreach oid in array ids loop
    if oid is null then continue; end if;
    select * into o from public.wallet_topup_orders where id = oid for update;
    if not found then continue; end if; -- existing account-deletion cascades
    select * into c from public.wallet_transactions where topup_order_id = oid;
    if not found or o.status <> 'paid' or o.razorpay_order_id is null
       or o.razorpay_payment_id is null or c.user_id <> o.user_id
       or c.type <> 'credit' or c.category <> 'added_money' or c.amount <> o.amount then
      raise exception 'wallet settlement requires exactly one matching credit' using errcode = '23514';
    end if;
  end loop;
  return null;
end;
$$;
revoke all on function public.check_wallet_settlement_credit() from public, anon, authenticated, service_role;
drop trigger if exists sec03_wallet_order_credit on public.wallet_topup_orders;
create constraint trigger sec03_wallet_order_credit after insert or update on public.wallet_topup_orders
  deferrable initially deferred for each row execute function public.check_wallet_settlement_credit();
drop trigger if exists sec03_wallet_ledger_credit on public.wallet_transactions;
create constraint trigger sec03_wallet_ledger_credit after insert or update or delete on public.wallet_transactions
  deferrable initially deferred for each row execute function public.check_wallet_settlement_credit();

-- Capture is verified ONLY by trusted Edge callers (provider GET or signed raw
-- webhook + SEC-02 validator), never by client-supplied flags. Exact verified
-- expectations are checked again under the row lock to prevent stale settlement.
create or replace function public.settle_wallet_topup(
  p_order_id uuid, p_user_id uuid, p_provider_order_id text,
  p_payment_id text, p_amount_paise bigint, p_currency text
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  o public.wallet_topup_orders;
  c public.wallet_transactions;
begin
  if coalesce(current_setting('role',true),'') <> 'service_role' then
    raise exception 'wallet settlement is service-role only' using errcode = '42501';
  end if;
  if p_order_id is null or p_user_id is null or p_provider_order_id is null
     or length(btrim(p_provider_order_id)) = 0 or p_payment_id is null
     or length(btrim(p_payment_id)) = 0 or p_amount_paise is null or p_amount_paise <= 0
     or p_currency is null or length(btrim(p_currency)) = 0 then
    raise exception 'invalid wallet settlement expectations' using errcode = '23514';
  end if;
  select * into o from public.wallet_topup_orders where id = p_order_id for update;
  if not found or o.user_id <> p_user_id
     or o.razorpay_order_id is distinct from p_provider_order_id
     or o.amount * 100 <> p_amount_paise or o.currency <> p_currency then
    raise exception 'wallet settlement expectations changed' using errcode = '23514';
  end if;
  select * into c from public.wallet_transactions where topup_order_id = o.id for update;
  if o.status = 'paid' then
    if o.razorpay_payment_id is distinct from p_payment_id or c.id is null
       or c.user_id <> o.user_id or c.amount <> o.amount
       or c.type <> 'credit' or c.category <> 'added_money' then
      raise exception 'wallet settlement requires reviewed reconciliation' using errcode = '23514';
    end if;
    return jsonb_build_object('amount',o.amount,'alreadySettled',true);
  end if;
  if o.status not in ('created','failed') or c.id is not null then
    raise exception 'inconsistent wallet settlement state' using errcode = '23514';
  end if;

  -- SEC-01's existing trigger claims provider IDs globally. A claim conflict,
  -- ledger error, deferred constraint failure or transaction abort rolls back
  -- BOTH writes and the claim. No swallowed errors and no ON CONFLICT success.
  update public.wallet_topup_orders set status = 'paid', razorpay_payment_id = p_payment_id
    where id = o.id;
  insert into public.wallet_transactions(user_id,type,category,amount,description,topup_order_id)
    values (o.user_id,'credit','added_money',o.amount,'Added Money',o.id);
  return jsonb_build_object('amount',o.amount,'alreadySettled',false);
end;
$$;
revoke all on function public.settle_wallet_topup(uuid,uuid,text,text,bigint,text)
  from public, anon, authenticated, service_role;
grant execute on function public.settle_wallet_topup(uuid,uuid,text,text,bigint,text) to service_role;

notify pgrst, 'reload schema';

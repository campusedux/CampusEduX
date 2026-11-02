-- SEC-04. Local preparation only. Canonical admin twin: 126.
-- Apply transactionally with bounded lock waits during separately approved rollout.
-- No historical debit inference/backfill or entitlement repair. Existing success
-- rows remain readable/retryable; a retry never creates missing historical effects.
lock table public.purchases, public.wallet_transactions in access exclusive mode;

alter table public.wallet_transactions
  add column if not exists purchase_id uuid references public.purchases(id) on delete cascade;
create unique index if not exists wallet_transactions_purchase_key
  on public.wallet_transactions(purchase_id) where purchase_id is not null;

create or replace function public.guard_purchase_settlement_terms()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  -- Never let client cancellation, failed callbacks or delayed events regress
  -- an entitlement. Refunding remains the existing privileged business operation.
  if (old.status = 'success' and new.status not in ('success','refunded'))
     or (old.status not in ('pending','failed','success') and new.status <> old.status) then
    raise exception 'terminal purchase state cannot be reopened' using errcode = '23514';
  end if;
  if (old.razorpay_order_id is not null or old.status in ('success','refunded')) and
     row(new.id,new.user_id,new.project_id,new.price,new.platform_fee,new.discount,
         new.total_amount,new.coupon_code,new.razorpay_order_id)
       is distinct from
     row(old.id,old.user_id,old.project_id,old.price,old.platform_fee,old.discount,
         old.total_amount,old.coupon_code,old.razorpay_order_id) then
    raise exception 'bound purchase financial terms are immutable' using errcode = '23514';
  end if;
  if old.status in ('success','refunded') and
     row(new.razorpay_payment_id,new.failure_reason) is distinct from
     row(old.razorpay_payment_id,old.failure_reason) then
    raise exception 'settled purchase payment terms are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_purchase_settlement_terms() from public, anon, authenticated, service_role;
drop trigger if exists b_sec04_purchase_terms on public.purchases;
create trigger b_sec04_purchase_terms before update on public.purchases
  for each row execute function public.guard_purchase_settlement_terms();

-- Run once on the actual transition, including privileged direct writers.
-- Name sorts before the constraint trigger for SET CONSTRAINTS IMMEDIATE.
-- Existing coupon/referral conversion triggers run in this same transaction.
-- An error in ANY effect rolls back the entitlement, all effects and SEC-01 claims.
create or replace function public.apply_purchase_settlement_effects()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare title text;
begin
  if new.status <> 'success' or (tg_op = 'UPDATE' and old.status = 'success') then return null; end if;
  if nullif(btrim(new.razorpay_order_id),'') is null
     or nullif(btrim(new.razorpay_payment_id),'') is null or new.total_amount <= 0 then
    raise exception 'purchase settlement requires bound payment terms' using errcode = '23514';
  end if;
  select p.title into strict title from public.projects p where p.id = new.project_id;
  perform public.increment_project_sales_count(new.project_id);
  insert into public.wallet_transactions(user_id,type,category,amount,description,purchase_id)
    values (new.user_id,'debit','project_purchase',new.total_amount,
            'Purchased "' || coalesce(title,'project') || '"',new.id);
  return null;
end;
$$;
revoke all on function public.apply_purchase_settlement_effects() from public, anon, authenticated, service_role;
drop trigger if exists c_sec04_purchase_effects on public.purchases;
create trigger c_sec04_purchase_effects after insert or update of status on public.purchases
  for each row execute function public.apply_purchase_settlement_effects();

-- Keep the linked spend immutable/complete through refunds. Account deletion
-- still uses existing cascades. Unlinked historical debits remain untouched.
create or replace function public.check_purchase_settlement_debit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare ids uuid[]; pid uuid; p public.purchases; d public.wallet_transactions;
begin
  if tg_table_name = 'purchases' then
    if new.status not in ('success','refunded') then return null; end if;
    if tg_op = 'UPDATE' and old.status in ('success','refunded') and not exists
      (select 1 from public.wallet_transactions where purchase_id = new.id) then
      return null; -- untouched legacy entitlement; no historical certification
    end if;
    -- A pre-settlement admin refund has no spend to validate.
    if new.status = 'refunded' and not exists
      (select 1 from public.wallet_transactions where purchase_id = new.id) then return null; end if;
    ids := array[new.id];
  elsif tg_op = 'INSERT' then ids := array[new.purchase_id];
  elsif tg_op = 'DELETE' then ids := array[old.purchase_id];
  else ids := array[old.purchase_id,new.purchase_id];
  end if;
  foreach pid in array ids loop
    if pid is null then continue; end if;
    select * into p from public.purchases where id = pid for update;
    if not found then continue; end if;
    select * into d from public.wallet_transactions where purchase_id = pid;
    if not found or p.status not in ('success','refunded')
       or p.razorpay_order_id is null or p.razorpay_payment_id is null
       or d.user_id <> p.user_id or d.type <> 'debit'
       or d.category <> 'project_purchase' or d.amount <> p.total_amount then
      raise exception 'purchase settlement requires exactly one matching debit' using errcode = '23514';
    end if;
  end loop;
  return null;
end;
$$;
revoke all on function public.check_purchase_settlement_debit() from public, anon, authenticated, service_role;
drop trigger if exists sec04_purchase_debit on public.purchases;
create constraint trigger sec04_purchase_debit after insert or update on public.purchases
  deferrable initially deferred for each row execute function public.check_purchase_settlement_debit();
drop trigger if exists sec04_ledger_debit on public.wallet_transactions;
create constraint trigger sec04_ledger_debit after insert or update or delete on public.wallet_transactions
  deferrable initially deferred for each row execute function public.check_purchase_settlement_debit();

-- Only trusted Edge callers supply expectations AFTER SEC-02 provider GET or
-- raw-body signed webhook capture validation. Never accept a client capture flag.
create or replace function public.settle_project_purchase(
  p_purchase_id uuid, p_user_id uuid, p_provider_order_id text,
  p_payment_id text, p_amount_paise bigint, p_currency text
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare p public.purchases; already boolean; result jsonb;
begin
  if coalesce(current_setting('role',true),'') <> 'service_role' then
    raise exception 'purchase settlement is service-role only' using errcode = '42501';
  end if;
  if p_purchase_id is null or p_user_id is null or nullif(btrim(p_provider_order_id),'') is null
     or nullif(btrim(p_payment_id),'') is null or p_amount_paise is null or p_amount_paise <= 0
     or p_currency is distinct from 'INR' then
    raise exception 'invalid purchase settlement expectations' using errcode = '23514';
  end if;
  select * into p from public.purchases where id = p_purchase_id for update;
  if not found or p.user_id <> p_user_id or p.razorpay_order_id is distinct from p_provider_order_id
     or p.total_amount * 100 <> p_amount_paise then
    raise exception 'purchase settlement expectations changed' using errcode = '23514';
  end if;
  already := p.status = 'success';
  if already then
    if p.razorpay_payment_id is distinct from p_payment_id then
      raise exception 'settled purchase payment mismatch' using errcode = '23514';
    end if;
  elsif p.status in ('pending','failed') then
    update public.purchases set status='success',razorpay_payment_id=p_payment_id,failure_reason=null
      where id=p.id and status in ('pending','failed') returning * into p;
  else
    raise exception 'terminal purchase cannot be settled' using errcode = '23514';
  end if;
  -- Exact public purchase response, including its existing project embed.
  select jsonb_build_object('id',p.id,'project_id',p.project_id,'price',p.price,
    'platform_fee',p.platform_fee,'discount',p.discount,'total_amount',p.total_amount,
    'status',p.status,'razorpay_order_id',p.razorpay_order_id,'razorpay_payment_id',p.razorpay_payment_id,
    'failure_reason',p.failure_reason,'created_at',p.created_at,
    'project',jsonb_build_object('title',pr.title)) into result
    from public.projects pr where pr.id=p.project_id;
  return jsonb_build_object('purchase',result,'alreadySettled',already);
end;
$$;
revoke all on function public.settle_project_purchase(uuid,uuid,text,text,bigint,text)
  from public, anon, authenticated, service_role;
grant execute on function public.settle_project_purchase(uuid,uuid,text,text,bigint,text) to service_role;
notify pgrst, 'reload schema';

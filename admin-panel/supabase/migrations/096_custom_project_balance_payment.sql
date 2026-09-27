-- mobile-app/supabase/migrations/0124_custom_project_balance_payment.sql
-- CANONICAL PAIR - byte-identical to admin-panel/supabase/migrations/096_custom_project_balance_payment.sql
-- (apply either; the other is an idempotent no-op).
--
-- Custom Projects: admin-set final price + "pay the remaining balance" support.
--
--   balance   = coalesce(final_price, estimated_total) - amount_paid        (computed server-side only)
--
-- 1. custom_project_requests.final_price  (nullable, admin-only)   and   .amount_paid (service-role only)
--    amount_paid is backfilled to token_amount for every already-paid request and, from now on, set to the
--    token amount by a trigger the moment token_payment_status flips to 'paid'.
-- 2. Column guard: nobody but a trusted DB role (service_role / postgres) can change amount_paid; final_price
--    can only change through admin_set_custom_project_final_price() (or postgres maintenance). The live DB has
--    no owner UPDATE policy on this table; this guard is the second layer if one is ever added.
-- 3. custom_project_payments.kind ('token' | 'balance') + status 'refund_due'. A BEFORE trigger applies a
--    balance payment atomically the moment its ledger row turns 'paid' (from the verify function OR the
--    Razorpay webhook), refusing overpayment / double payment: anything that does not fit the remaining
--    balance becomes 'refund_due' and raises an admin inbox row instead of touching amount_paid.
-- 4. admin_set_custom_project_final_price(): permission-checked, cannot go below amount_paid, locked once the
--    balance is fully paid, blocked while a balance checkout is in flight, and logged in the history.
-- 5. custom_project_request_history gets event / old_value / new_value. Users only ever read event='status'
--    rows (policy replaced), so price and payment audit rows stay admin-only for old and new clients alike.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.custom_project_requests') is null
     or to_regclass('public.custom_project_payments') is null
     or to_regclass('public.custom_project_request_history') is null
     or to_regclass('public.notifications') is null
     or to_regprocedure('public.has_permission(uuid,text,text)') is null
     or to_regprocedure('public._is_privileged_caller()') is null then
    raise exception '0124 prerequisite missing: custom project tables (0033), notifications (0023), has_permission (admin 001) and _is_privileged_caller (0118/0119) must be applied first';
  end if;
end $$;

-- ---- 1. columns ------------------------------------------------------------
alter table public.custom_project_requests add column if not exists final_price numeric(10,2);
alter table public.custom_project_requests add column if not exists amount_paid numeric(10,2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'custom_project_requests_final_price_nonneg') then
    alter table public.custom_project_requests
      add constraint custom_project_requests_final_price_nonneg check (final_price is null or final_price >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'custom_project_requests_amount_paid_nonneg') then
    alter table public.custom_project_requests
      add constraint custom_project_requests_amount_paid_nonneg check (amount_paid >= 0);
  end if;
end $$;

-- Backfill: every request whose token is already paid has paid exactly its token so far.
update public.custom_project_requests
   set amount_paid = token_amount
 where token_payment_status = 'paid' and amount_paid = 0 and token_amount > 0;

-- ---- history audit columns --------------------------------------------------
alter table public.custom_project_request_history add column if not exists event text not null default 'status';
alter table public.custom_project_request_history add column if not exists old_value text;
alter table public.custom_project_request_history add column if not exists new_value text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'custom_project_request_history_event_check') then
    alter table public.custom_project_request_history
      add constraint custom_project_request_history_event_check check (event in ('status', 'price', 'payment'));
  end if;
end $$;

-- Owners read status rows only: price / payment audit rows are admin-facing (old app builds select every row).
drop policy if exists "cprh_select_own" on public.custom_project_request_history;
create policy "cprh_select_own" on public.custom_project_request_history
  for select using (
    event = 'status'
    and exists (
      select 1 from public.custom_project_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );

-- ---- ledger: kind + refund_due ---------------------------------------------
alter table public.custom_project_payments add column if not exists kind text not null default 'token';

do $$
declare c text;
begin
  if not exists (select 1 from pg_constraint where conname = 'custom_project_payments_kind_check') then
    alter table public.custom_project_payments
      add constraint custom_project_payments_kind_check check (kind in ('token', 'balance'));
  end if;
  -- widen the status check to allow 'refund_due' (find the original, unnamed-in-0033 constraint by definition)
  for c in
    select conname from pg_constraint
     where conrelid = 'public.custom_project_payments'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%' and pg_get_constraintdef(oid) not ilike '%refund_due%'
  loop
    execute format('alter table public.custom_project_payments drop constraint %I', c);
  end loop;
  if not exists (select 1 from pg_constraint where conname = 'custom_project_payments_status_check2') then
    alter table public.custom_project_payments
      add constraint custom_project_payments_status_check2
      check (status in ('created', 'paid', 'failed', 'refund_due'));
  end if;
end $$;

-- at most ONE settled balance payment per request (single full payment; no installments)
create unique index if not exists custom_project_payments_one_paid_balance
  on public.custom_project_payments (request_id) where kind = 'balance' and status = 'paid';
create index if not exists custom_project_payments_balance_open_idx
  on public.custom_project_payments (request_id, created_at desc) where kind = 'balance' and status = 'created';

-- ---- 2. column guard on custom_project_requests ------------------------------
create or replace function public.custom_project_guard_money_columns()
returns trigger language plpgsql set search_path = public as $$
declare
  v_role text := coalesce(nullif(current_setting('role', true), ''), 'none');
begin
  if tg_op = 'INSERT' then
    if v_role in ('authenticated', 'anon') and (new.final_price is not null or new.amount_paid <> 0) then
      raise exception 'final_price / amount_paid cannot be set by clients' using errcode = '42501';
    end if;
    return new;
  end if;

  -- amount_paid: trusted DB roles only (service role = payment verification / webhook path)
  if new.amount_paid is distinct from old.amount_paid and not public._is_privileged_caller() then
    raise exception 'amount_paid can only be changed by the payment verification path' using errcode = '42501';
  end if;

  -- final_price: only via admin_set_custom_project_final_price() (transaction-local flag) or postgres maintenance
  if new.final_price is distinct from old.final_price
     and coalesce(current_setting('cx.cp_final_price_rpc', true), '') <> 'on'
     and v_role not in ('none', 'postgres', 'supabase_admin') then
    raise exception 'final_price can only be set through admin_set_custom_project_final_price()' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.custom_project_guard_money_columns() from public, anon, authenticated;

drop trigger if exists custom_project_requests_guard_money on public.custom_project_requests;
create trigger custom_project_requests_guard_money
  before insert or update on public.custom_project_requests
  for each row execute function public.custom_project_guard_money_columns();

-- the token counts as the first payment the moment it is verified (verify function / webhook untouched)
create or replace function public.custom_project_token_counts_as_paid()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.token_payment_status = 'paid'
     and (tg_op = 'INSERT' or old.token_payment_status is distinct from 'paid') then
    new.amount_paid := greatest(new.amount_paid, new.token_amount);
  end if;
  return new;
end;
$$;
revoke all on function public.custom_project_token_counts_as_paid() from public, anon, authenticated;

drop trigger if exists custom_project_requests_token_paid on public.custom_project_requests;
create trigger custom_project_requests_token_paid
  before insert or update on public.custom_project_requests
  for each row execute function public.custom_project_token_counts_as_paid();

-- ---- 3. balance payment ledger trigger ---------------------------------------
-- SECURITY DEFINER so crediting the request never depends on the caller's RLS bypass; the `role` GUC (and so the
-- _is_privileged_caller() gate below) is unchanged inside a definer body.
create or replace function public.custom_project_apply_balance_payment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r public.custom_project_requests;
  v_remaining numeric;
begin
  if new.kind is distinct from 'balance' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'created' then
      raise exception 'a balance payment must start as created' using errcode = '42501';
    end if;
    return new;
  end if;

  -- a paid row is immutable (the webhook's .neq('status','paid') guard mirrors this)
  if old.status = 'paid' and new.status is distinct from 'paid' then
    raise exception 'a paid balance payment cannot change status' using errcode = '42501';
  end if;

  if new.status in ('paid', 'refund_due') and new.status is distinct from old.status
     and not public._is_privileged_caller() then
    raise exception 'only the payment verification path can settle a balance payment' using errcode = '42501';
  end if;

  if new.status = 'paid' and old.status is distinct from 'paid' then
    select * into r from public.custom_project_requests where id = new.request_id for update;
    v_remaining := round(coalesce(r.final_price, r.estimated_total) - r.amount_paid, 2);

    if r.id is not null and r.token_payment_status = 'paid' and r.status <> 'cancelled'
       and new.amount > 0 and new.amount <= v_remaining then
      update public.custom_project_requests
         set amount_paid = amount_paid + new.amount
       where id = r.id;
      insert into public.custom_project_request_history
        (request_id, old_status, new_status, changed_by_role, note, event, old_value, new_value)
      values
        (r.id, r.status, r.status, 'system',
         'Balance payment received (' || new.amount::text || ')', 'payment',
         r.amount_paid::text, (r.amount_paid + new.amount)::text);
      -- Inserted here (not by the calling Edge Function) so the notification fires exactly once
      -- however the payment gets settled: the verify function OR the Razorpay webhook (if the
      -- customer closes the app/tab before the browser's verify call runs).
      insert into public.notifications (user_id, title, body, category)
      values (
        r.user_id, 'Balance payment received',
        'Payment of ' || new.amount::text || ' received for "' || r.title || '". Remaining: '
          || greatest(v_remaining - new.amount, 0)::text || '.',
        'updates'
      );
    else
      -- overpayment / duplicate / cancelled: never touch amount_paid; flag for a manual refund.
      -- NOTE: this sets custom_project_payments.status (this ledger row only) — it never touches
      -- custom_project_requests.status (the new/in_development/testing/ready/delivered/cancelled
      -- workflow column, whose check constraint this migration does not modify), so an
      -- in_development or delivered project's progress is never affected by a refund flag.
      new.status := 'refund_due';
      if r.id is not null then
        -- The ONLY place this inbox row is created (the calling Edge Function must not insert its
        -- own copy) so a browser-settled and a webhook-settled refund_due each raise exactly one.
        insert into public.custom_project_admin_inbox (request_id, title, body)
        values (
          r.id,
          'Balance payment needs a manual refund',
          coalesce(r.request_code, r.id::text) || ' · payment ' || coalesce(new.razorpay_payment_id, new.razorpay_order_id, '?')
            || ' of ' || new.amount::text || ' does not fit the remaining balance (' || greatest(v_remaining, 0)::text || ').'
        );
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.custom_project_apply_balance_payment() from public, anon, authenticated;

drop trigger if exists custom_project_payments_apply_balance on public.custom_project_payments;
create trigger custom_project_payments_apply_balance
  before insert or update on public.custom_project_payments
  for each row execute function public.custom_project_apply_balance_payment();

-- ---- 4. admin final-price RPC --------------------------------------------------
create or replace function public.admin_set_custom_project_final_price(
  p_request_id  uuid,
  p_final_price numeric,
  p_note        text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.custom_project_requests;
  v_new numeric;
  v_old_total numeric;
begin
  if auth.uid() is null or not public.has_permission(auth.uid(), 'custom_projects', 'edit') then
    raise exception 'admin_set_custom_project_final_price: not permitted' using errcode = '42501';
  end if;
  if p_final_price is null then
    raise exception 'A final price is required.';
  end if;
  v_new := round(p_final_price, 2);
  if v_new < 0 or v_new > 100000000 then
    raise exception 'Final price is out of range.';
  end if;

  select * into r from public.custom_project_requests where id = p_request_id for update;
  if not found then raise exception 'Custom project request not found.'; end if;
  if r.token_payment_status <> 'paid' then raise exception 'The token is not paid yet.'; end if;
  if r.status = 'cancelled' then raise exception 'This request is cancelled.'; end if;

  v_old_total := coalesce(r.final_price, r.estimated_total);
  if r.amount_paid >= v_old_total then
    raise exception 'The balance is fully paid, so the price is locked.';
  end if;
  if v_new < r.amount_paid then
    raise exception 'Final price cannot be below the amount already paid (%).', r.amount_paid;
  end if;
  if exists (
    select 1 from public.custom_project_payments p
     where p.request_id = p_request_id and p.kind = 'balance' and p.status = 'created'
       and p.created_at > now() - interval '30 minutes'
  ) then
    raise exception 'The customer has a balance checkout open. Try again in a few minutes.';
  end if;
  if r.final_price is not distinct from v_new then
    return jsonb_build_object('changed', false, 'final_price', r.final_price);
  end if;

  perform set_config('cx.cp_final_price_rpc', 'on', true);
  update public.custom_project_requests set final_price = v_new where id = p_request_id;
  perform set_config('cx.cp_final_price_rpc', 'off', true);

  insert into public.custom_project_request_history
    (request_id, old_status, new_status, changed_by, changed_by_role, note, event, old_value, new_value)
  values
    (p_request_id, r.status, r.status, auth.uid(), 'admin',
     'Final price ' || coalesce(r.final_price::text, 'unset (estimate ' || r.estimated_total::text || ')')
       || ' -> ' || v_new::text || coalesce(' — ' || nullif(p_note, ''), ''),
     'price', r.final_price::text, v_new::text);

  return jsonb_build_object('changed', true, 'final_price', v_new, 'amount_paid', r.amount_paid,
                            'remaining', v_new - r.amount_paid);
end;
$$;
revoke all on function public.admin_set_custom_project_final_price(uuid, numeric, text) from public, anon;
grant execute on function public.admin_set_custom_project_final_price(uuid, numeric, text) to authenticated;

notify pgrst, 'reload schema';

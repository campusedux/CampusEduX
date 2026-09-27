-- mobile-app/supabase/migrations/0128_custom_project_value_addons_edits.sql
-- CANONICAL PAIR - byte-identical to admin-panel/supabase/migrations/099_custom_project_value_addons_edits.sql
-- (apply either; the other is an idempotent no-op).
--
-- Custom Projects: one due calculation, add-ons, credits, request editing, edit history.
--
--   project_value = base value (admin: coalesce(final_price, estimated_total)) + sum(ACCEPTED add-on prices)
--   due           = greatest(project_value - successful payments - credits, 0)
--
-- 1. public._custom_project_amounts(request) is THE calculation. Every consumer uses it: the website, the app
--    and the admin panel (via the access-checked wrapper custom_project_amounts / custom_project_amounts_bulk),
--    the balance-order Edge Function, the balance-payment trigger and the admin price RPC. Payments are read
--    from the custom_project_payments LEDGER (status 'paid'), not from the amount_paid counter, so a counter
--    that drifted can no longer produce a wrong due. amount_paid is kept as a mirror (payments + credits) only
--    so already-installed app builds that still read it keep showing a sensible number.
-- 2. custom_project_credits: admin-recorded credits (offline payment, discount, referral, goodwill, adjustment).
-- 3. custom_project_addons: user-requested extras, priced by an admin, accepted by the user. Only ACCEPTED
--    prices count toward the project value. Price/status can only move through the add-on RPCs (RLS has no
--    client write policy at all + a guard trigger that rejects a non-admin price change even if RLS were
--    ever loosened).
-- 4. custom_project_changes: who changed what and when (request fields, base value, add-ons, credits).
-- 5. Request editing: owner via custom_project_update_request() only while status = 'new'; admin via
--    admin_update_custom_project_request() at any status. Pricing columns are rejected by both RPCs and by the
--    money-column guard trigger.
-- 6. Payment-flow fixes found while tracing the "paid in full but a balance still shows" report:
--    a) a token payment settled only by the Razorpay webhook (customer closed the tab before the browser's
--       verify call) left custom_project_requests.token_payment_status = 'pending' forever: no amount_paid,
--       hidden from "My projects", full estimate still "due". The ledger now settles the request itself.
--    b) the one-paid-balance-per-request unique index made any SECOND balance payment (needed once an add-on
--       is accepted after the balance was paid) fail with a unique violation AFTER Razorpay captured the money.
-- 7. Delivered files stay visible after delivery even if the admin later moves the status (e.g. back to
--    in_development to build an accepted add-on): owners may read a delivery once it has a delivered_at.
--    Downloads are never gated on payment. The deliveries Storage bucket follows the same rule (section 12):
--    an uploaded-but-undelivered file is no longer readable by the owner.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.custom_project_requests') is null
     or to_regclass('public.custom_project_payments') is null
     or to_regclass('public.custom_project_deliveries') is null
     or to_regclass('public.custom_project_admin_inbox') is null
     or to_regclass('public.notifications') is null
     or to_regprocedure('public.admin_set_custom_project_final_price(uuid,numeric,text)') is null
     or to_regprocedure('public.custom_project_apply_balance_payment()') is null
     or to_regprocedure('public.has_permission(uuid,text,text)') is null
     or to_regprocedure('public._is_privileged_caller()') is null then
    raise exception '0128 prerequisite missing: apply 0033, 0118/0119 and 0124 (admin 013, 090/091, 096) first';
  end if;
end $$;

-- ============================================================================
-- 1. tables
-- ============================================================================
alter table public.custom_project_requests add column if not exists deadline date;

create table if not exists public.custom_project_addons (
  id           uuid          primary key default gen_random_uuid(),
  project_id   uuid          not null references public.custom_project_requests (id) on delete cascade,
  title        text          not null check (char_length(btrim(title)) between 1 and 200),
  description  text          not null default '' check (char_length(description) <= 5000),
  requested_by uuid          references auth.users (id) on delete set null,
  status       text          not null default 'pending'
                               check (status in ('pending', 'priced', 'accepted', 'rejected')),
  price        numeric(10,2) check (price is null or (price >= 0 and price <= 100000000)),
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now(),
  constraint custom_project_addons_priced_has_price check (status not in ('priced', 'accepted') or price is not null)
);
create index if not exists custom_project_addons_project_idx on public.custom_project_addons (project_id, created_at);
create index if not exists custom_project_addons_open_idx
  on public.custom_project_addons (status, created_at) where status in ('pending', 'priced');

drop trigger if exists custom_project_addons_set_updated_at on public.custom_project_addons;
create trigger custom_project_addons_set_updated_at
  before update on public.custom_project_addons
  for each row execute function public.set_updated_at();

create table if not exists public.custom_project_credits (
  id          uuid          primary key default gen_random_uuid(),
  request_id  uuid          not null references public.custom_project_requests (id) on delete cascade,
  amount      numeric(10,2) not null check (amount > 0 and amount <= 100000000),
  kind        text          not null default 'adjustment'
                              check (kind in ('offline_payment', 'discount', 'referral', 'goodwill', 'adjustment')),
  note        text          not null default '' check (char_length(note) <= 1000),
  created_by  uuid          references auth.users (id) on delete set null,
  created_at  timestamptz   not null default now()
);
create index if not exists custom_project_credits_request_idx on public.custom_project_credits (request_id);

create table if not exists public.custom_project_changes (
  id          uuid        primary key default gen_random_uuid(),
  request_id  uuid        not null references public.custom_project_requests (id) on delete cascade,
  addon_id    uuid        references public.custom_project_addons (id) on delete set null,
  actor_id    uuid        references auth.users (id) on delete set null,
  actor_role  text        not null check (actor_role in ('student', 'admin', 'system')),
  entity      text        not null check (entity in ('request', 'price', 'addon', 'credit', 'attachment')),
  action      text        not null,
  field       text,
  old_value   jsonb,
  new_value   jsonb,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists custom_project_changes_request_idx on public.custom_project_changes (request_id, created_at desc);

-- RLS: reads only; every write goes through the SECURITY DEFINER functions below.
alter table public.custom_project_addons  enable row level security;
alter table public.custom_project_credits enable row level security;
alter table public.custom_project_changes enable row level security;
revoke all on public.custom_project_addons, public.custom_project_credits, public.custom_project_changes from anon;
revoke insert, update, delete, truncate on public.custom_project_addons, public.custom_project_credits,
  public.custom_project_changes from authenticated;
grant select on public.custom_project_addons, public.custom_project_credits, public.custom_project_changes to authenticated;

drop policy if exists "cpa_select_owner" on public.custom_project_addons;
create policy "cpa_select_owner" on public.custom_project_addons for select to authenticated
  using (exists (select 1 from public.custom_project_requests r where r.id = project_id and r.user_id = auth.uid()));
drop policy if exists "cpa_select_admin" on public.custom_project_addons;
create policy "cpa_select_admin" on public.custom_project_addons for select to authenticated
  using ((select public.has_permission(auth.uid(), 'custom_projects', 'view')));

drop policy if exists "cpc_select_admin" on public.custom_project_credits;
create policy "cpc_select_admin" on public.custom_project_credits for select to authenticated
  using ((select public.has_permission(auth.uid(), 'custom_projects', 'view')));

drop policy if exists "cpch_select_admin" on public.custom_project_changes;
create policy "cpch_select_admin" on public.custom_project_changes for select to authenticated
  using ((select public.has_permission(auth.uid(), 'custom_projects', 'view')));

-- ============================================================================
-- 2. THE calculation
-- ============================================================================
create or replace function public._custom_project_amounts(p_request_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r              public.custom_project_requests;
  v_base         numeric;
  v_addons       numeric;
  v_pending      integer;
  v_priced       integer;
  v_token_ledger numeric;
  v_balance      numeric;
  v_token        numeric;
  v_payments     numeric;
  v_credits      numeric;
  v_value        numeric;
  v_due          numeric;
begin
  select * into r from public.custom_project_requests where id = p_request_id;
  if not found then
    return null;
  end if;

  v_base := round(coalesce(r.final_price, r.estimated_total, 0), 2);

  select coalesce(sum(a.price) filter (where a.status = 'accepted'), 0),
         count(*) filter (where a.status = 'pending'),
         count(*) filter (where a.status = 'priced')
    into v_addons, v_pending, v_priced
    from public.custom_project_addons a
   where a.project_id = p_request_id;

  select sum(p.amount) filter (where p.kind = 'token' and p.status = 'paid'),
         coalesce(sum(p.amount) filter (where p.kind = 'balance' and p.status = 'paid'), 0)
    into v_token_ledger, v_balance
    from public.custom_project_payments p
   where p.request_id = p_request_id;

  -- The token normally has a paid ledger row. Requests whose flag says paid but whose ledger row never got
  -- flipped (verify's second write failed) still count the token they paid.
  v_token := case
               when v_token_ledger is not null then v_token_ledger
               when r.token_payment_status = 'paid' then coalesce(r.token_amount, 0)
               else 0
             end;

  select coalesce(sum(c.amount), 0) into v_credits
    from public.custom_project_credits c
   where c.request_id = p_request_id;

  v_value    := round(v_base + v_addons, 2);
  v_payments := round(v_token + v_balance, 2);
  v_credits  := round(v_credits, 2);
  v_due      := greatest(round(v_value - v_payments - v_credits, 2), 0);

  return jsonb_build_object(
    'request_id',      r.id,
    'base_value',      v_base,
    'addons_total',    round(v_addons, 2),
    'project_value',   v_value,
    'payments_total',  v_payments,
    'credits_total',   v_credits,
    'settled_total',   round(v_payments + v_credits, 2),
    'due',             v_due,
    'payment_status',  case when v_due = 0 then 'paid'
                            when v_payments + v_credits > 0 then 'partially_paid'
                            else 'unpaid' end,
    'pending_addons',  v_pending,
    'priced_addons',   v_priced
  );
end;
$$;
revoke all on function public._custom_project_amounts(uuid) from public, anon, authenticated;

-- Access-checked wrapper: the owner, an admin with custom_projects:view, or a trusted DB role.
create or replace function public.custom_project_amounts(p_request_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.custom_project_requests where id = p_request_id;
  if v_owner is null
     or not (public._is_privileged_caller()
             or v_owner = auth.uid()
             or coalesce(public.has_permission(auth.uid(), 'custom_projects', 'view'), false)) then
    raise exception 'Custom project request not found.' using errcode = '42501';
  end if;
  return public._custom_project_amounts(p_request_id);
end;
$$;
revoke all on function public.custom_project_amounts(uuid) from public, anon;
grant execute on function public.custom_project_amounts(uuid) to authenticated, service_role;

-- Same calculation for a list page; silently skips ids the caller may not read.
create or replace function public.custom_project_amounts_bulk(p_request_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_admin boolean := public._is_privileged_caller()
                     or coalesce(public.has_permission(auth.uid(), 'custom_projects', 'view'), false);
begin
  if p_request_ids is null or cardinality(p_request_ids) = 0 then
    return '[]'::jsonb;
  end if;
  if cardinality(p_request_ids) > 200 then
    raise exception 'Too many requests (max 200).';
  end if;
  return coalesce((
    select jsonb_agg(public._custom_project_amounts(r.id))
      from public.custom_project_requests r
     where r.id = any (p_request_ids)
       and (v_admin or r.user_id = auth.uid())
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.custom_project_amounts_bulk(uuid[]) from public, anon;
grant execute on function public.custom_project_amounts_bulk(uuid[]) to authenticated, service_role;

-- ============================================================================
-- 3. internal helpers
-- ============================================================================
create or replace function public._custom_project_log(
  p_request_id uuid, p_addon_id uuid, p_actor_role text, p_entity text, p_action text,
  p_field text default null, p_old jsonb default null, p_new jsonb default null, p_note text default null
)
returns void language sql security definer set search_path = public as $$
  insert into public.custom_project_changes
    (request_id, addon_id, actor_id, actor_role, entity, action, field, old_value, new_value, note)
  values
    (p_request_id, p_addon_id, auth.uid(), p_actor_role, p_entity, p_action, p_field, p_old, p_new, nullif(p_note, ''));
$$;
revoke all on function public._custom_project_log(uuid, uuid, text, text, text, text, jsonb, jsonb, text)
  from public, anon, authenticated;

-- amount_paid is a compatibility mirror of (payments + credits); only ever written from the calculation.
create or replace function public._custom_project_sync_amount_paid(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_settled numeric := (public._custom_project_amounts(p_request_id) ->> 'settled_total')::numeric;
begin
  if v_settled is null then
    return;
  end if;
  perform set_config('cx.cp_money_sync', 'on', true);
  update public.custom_project_requests
     set amount_paid = v_settled
   where id = p_request_id and amount_paid is distinct from v_settled;
  perform set_config('cx.cp_money_sync', 'off', true);
end;
$$;
revoke all on function public._custom_project_sync_amount_paid(uuid) from public, anon, authenticated;

create or replace function public._custom_project_is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and coalesce(public.has_permission(auth.uid(), 'custom_projects', 'edit'), false);
$$;
revoke all on function public._custom_project_is_editor() from public, anon, authenticated;

-- ============================================================================
-- 4. money-column guard (replaces 0124's): pricing columns are admin/trusted-only
-- ============================================================================
create or replace function public.custom_project_guard_money_columns()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(nullif(current_setting('role', true), ''), 'none');
  v_sync boolean := coalesce(current_setting('cx.cp_money_sync', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    if v_role in ('authenticated', 'anon') and (new.final_price is not null or new.amount_paid <> 0) then
      raise exception 'final_price / amount_paid cannot be set by clients' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.amount_paid is distinct from old.amount_paid and not v_sync and not public._is_privileged_caller() then
    raise exception 'amount_paid can only be changed by the payment verification path' using errcode = '42501';
  end if;

  if new.final_price is distinct from old.final_price
     and coalesce(current_setting('cx.cp_final_price_rpc', true), '') <> 'on'
     and v_role not in ('none', 'postgres', 'supabase_admin') then
    raise exception 'final_price can only be set through admin_set_custom_project_final_price()' using errcode = '42501';
  end if;

  -- the frozen pricing snapshot: never editable by a client (owner or admin session)
  if (new.estimated_total, new.base_price, new.platform_charge, new.feature_total, new.token_amount)
       is distinct from
     (old.estimated_total, old.base_price, old.platform_charge, old.feature_total, old.token_amount)
     and not public._is_privileged_caller() then
    raise exception 'The project price can only be changed by an admin through the price function.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.custom_project_guard_money_columns() from public, anon, authenticated;

-- ============================================================================
-- 5. balance payments (replaces 0124's trigger body; same contract, due from the calculation)
-- ============================================================================
-- Multiple balance payments are legitimate now (an add-on accepted after the balance was paid creates a new
-- due). Overpayment is still impossible: the trigger below credits only what fits the due, under a row lock.
drop index if exists public.custom_project_payments_one_paid_balance;

create or replace function public.custom_project_apply_balance_payment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r           public.custom_project_requests;
  v_amounts   jsonb;
  v_remaining numeric;
  v_settled   numeric;
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

  if old.status = 'paid' and new.status is distinct from 'paid' then
    raise exception 'a paid balance payment cannot change status' using errcode = '42501';
  end if;

  if new.status in ('paid', 'refund_due') and new.status is distinct from old.status
     and not public._is_privileged_caller() then
    raise exception 'only the payment verification path can settle a balance payment' using errcode = '42501';
  end if;

  if new.status = 'paid' and old.status is distinct from 'paid' then
    select * into r from public.custom_project_requests where id = new.request_id for update;
    -- this ledger row is not 'paid' in the table yet, so it is not counted in the due below
    v_amounts   := public._custom_project_amounts(new.request_id);
    v_remaining := coalesce((v_amounts ->> 'due')::numeric, 0);
    v_settled   := coalesce((v_amounts ->> 'settled_total')::numeric, 0);

    if r.id is not null and r.token_payment_status = 'paid' and r.status <> 'cancelled'
       and new.amount > 0 and new.amount <= v_remaining then
      perform set_config('cx.cp_money_sync', 'on', true);
      update public.custom_project_requests set amount_paid = v_settled + new.amount where id = r.id;
      perform set_config('cx.cp_money_sync', 'off', true);
      insert into public.custom_project_request_history
        (request_id, old_status, new_status, changed_by_role, note, event, old_value, new_value)
      values
        (r.id, r.status, r.status, 'system',
         'Balance payment received (' || new.amount::text || ')', 'payment',
         r.amount_paid::text, (v_settled + new.amount)::numeric(10,2)::text);
      insert into public.notifications (user_id, title, body, category)
      values (
        r.user_id, 'Balance payment received',
        'Payment of ' || new.amount::text || ' received for "' || r.title || '". Remaining: '
          || greatest(v_remaining - new.amount, 0)::numeric(10,2)::text || '.',
        'updates'
      );
    else
      -- overpayment / duplicate / cancelled: never credited; flagged for a manual refund (ledger row only,
      -- the request's workflow status is untouched).
      new.status := 'refund_due';
      if r.id is not null then
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

-- ============================================================================
-- 6. token payments settled by the ledger (webhook-only settlement)
-- ============================================================================
create or replace function public.custom_project_settle_token_from_ledger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r public.custom_project_requests;
begin
  if new.kind is distinct from 'token' or new.status is distinct from 'paid' or old.status = 'paid' then
    return null;
  end if;
  if not public._is_privileged_caller() then
    raise exception 'only the payment verification path can settle a token payment' using errcode = '42501';
  end if;

  select * into r from public.custom_project_requests where id = new.request_id for update;
  if not found or r.token_payment_status = 'paid' then
    return null;   -- the verify function already settled the request (and did the side effects)
  end if;

  update public.custom_project_requests
     set token_payment_status = 'paid',
         payment_id = coalesce(payment_id, new.razorpay_payment_id)
   where id = r.id;

  -- the same side effects verify-custom-project-payment performs, exactly once
  insert into public.custom_project_request_history (request_id, old_status, new_status, changed_by, changed_by_role, note)
  values (r.id, null, 'new', r.user_id, 'system', 'Token paid (confirmed by payment gateway)');
  insert into public.notifications (user_id, title, body, category) values
    (r.user_id, 'Token payment successful', '₹' || r.token_amount::text || ' token paid for "' || r.title || '".', 'updates'),
    (r.user_id, 'Request created', 'Your custom project request ' || coalesce(r.request_code, '') || ' has been created.', 'updates');
  insert into public.custom_project_admin_inbox (request_id, title, body)
  values (r.id, 'New Paid Custom Project Request',
          coalesce(r.request_code, r.id::text) || ' · ' || r.project_type || '/' || r.project_level
            || ' · Est ₹' || r.estimated_total::text || ' · Token ₹' || r.token_amount::text);
  return null;
end;
$$;
revoke all on function public.custom_project_settle_token_from_ledger() from public, anon, authenticated;

drop trigger if exists custom_project_payments_settle_token on public.custom_project_payments;
create trigger custom_project_payments_settle_token
  after update of status on public.custom_project_payments
  for each row execute function public.custom_project_settle_token_from_ledger();

-- ============================================================================
-- 7. admin: base value (replaces 0124's RPC; same name/signature/rules, add-on aware)
-- ============================================================================
create or replace function public.admin_set_custom_project_final_price(
  p_request_id  uuid,
  p_final_price numeric,
  p_note        text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r         public.custom_project_requests;
  v_new     numeric;
  v_amounts jsonb;
  v_after   jsonb;
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

  v_amounts := public._custom_project_amounts(p_request_id);
  if (v_amounts ->> 'due')::numeric = 0 then
    raise exception 'The balance is fully paid, so the price is locked.';
  end if;
  if v_new + (v_amounts ->> 'addons_total')::numeric < (v_amounts ->> 'settled_total')::numeric then
    raise exception 'The base value plus accepted add-ons cannot be below the amount already paid (%).',
      (v_amounts ->> 'settled_total');
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
  perform public._custom_project_log(p_request_id, null, 'admin', 'price', 'set_base_value', 'final_price',
    to_jsonb(coalesce(r.final_price, r.estimated_total)), to_jsonb(v_new), p_note);

  v_after := public._custom_project_amounts(p_request_id);
  insert into public.notifications (user_id, title, body, category)
  values (r.user_id, 'Project value updated',
          'The project value for "' || r.title || '" is now ₹' || (v_after ->> 'project_value')
            || '. Amount due: ₹' || (v_after ->> 'due') || '.',
          'updates');

  return jsonb_build_object('changed', true, 'final_price', v_new, 'amount_paid', v_after -> 'settled_total',
                            'remaining', v_after -> 'due');
end;
$$;
revoke all on function public.admin_set_custom_project_final_price(uuid, numeric, text) from public, anon;
grant execute on function public.admin_set_custom_project_final_price(uuid, numeric, text) to authenticated;

-- ============================================================================
-- 8. admin: credits
-- ============================================================================
create or replace function public.admin_add_custom_project_credit(
  p_request_id uuid, p_amount numeric, p_kind text default 'adjustment', p_note text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r        public.custom_project_requests;
  v_amount numeric := round(coalesce(p_amount, 0), 2);
  v_id     uuid;
  v_after  jsonb;
begin
  if not public._custom_project_is_editor() then
    raise exception 'admin_add_custom_project_credit: not permitted' using errcode = '42501';
  end if;
  if v_amount <= 0 or v_amount > 100000000 then raise exception 'Credit amount must be greater than 0.'; end if;
  if p_kind is null or p_kind not in ('offline_payment', 'discount', 'referral', 'goodwill', 'adjustment') then
    raise exception 'Unknown credit type.';
  end if;
  select * into r from public.custom_project_requests where id = p_request_id for update;
  if not found then raise exception 'Custom project request not found.'; end if;

  insert into public.custom_project_credits (request_id, amount, kind, note, created_by)
  values (p_request_id, v_amount, p_kind, coalesce(btrim(p_note), ''), auth.uid())
  returning id into v_id;
  perform public._custom_project_sync_amount_paid(p_request_id);
  perform public._custom_project_log(p_request_id, null, 'admin', 'credit', 'add', p_kind, null,
    jsonb_build_object('credit_id', v_id, 'amount', v_amount, 'kind', p_kind), p_note);

  v_after := public._custom_project_amounts(p_request_id);
  insert into public.notifications (user_id, title, body, category)
  values (r.user_id, 'Payment credit added',
          '₹' || v_amount::text || ' was credited to "' || r.title || '". Amount due: ₹' || (v_after ->> 'due') || '.',
          'updates');
  return v_after;
end;
$$;
revoke all on function public.admin_add_custom_project_credit(uuid, numeric, text, text) from public, anon;
grant execute on function public.admin_add_custom_project_credit(uuid, numeric, text, text) to authenticated;

create or replace function public.admin_remove_custom_project_credit(p_credit_id uuid, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.custom_project_credits;
begin
  if not public._custom_project_is_editor() then
    raise exception 'admin_remove_custom_project_credit: not permitted' using errcode = '42501';
  end if;
  select * into c from public.custom_project_credits where id = p_credit_id;
  if not found then raise exception 'Credit not found.'; end if;
  perform 1 from public.custom_project_requests where id = c.request_id for update;
  delete from public.custom_project_credits where id = p_credit_id;
  perform public._custom_project_sync_amount_paid(c.request_id);
  perform public._custom_project_log(c.request_id, null, 'admin', 'credit', 'remove', c.kind,
    jsonb_build_object('credit_id', c.id, 'amount', c.amount, 'kind', c.kind), null, p_note);
  return public._custom_project_amounts(c.request_id);
end;
$$;
revoke all on function public.admin_remove_custom_project_credit(uuid, text) from public, anon;
grant execute on function public.admin_remove_custom_project_credit(uuid, text) to authenticated;

-- ============================================================================
-- 9. request editing (owner while 'new'; admin at any status)
-- ============================================================================
create or replace function public._custom_project_apply_request_changes(
  p_request_id uuid, p_changes jsonb, p_actor_role text
)
returns text[] language plpgsql security definer set search_path = public as $$
declare
  r        public.custom_project_requests;
  k        text;
  v        jsonb;
  v_text   text;
  v_date   date;
  v_reqs   jsonb;
  v_old    jsonb;
  v_new    jsonb;
  v_limits constant jsonb := '{"title":200,"objective":5000,"problem_statement":5000,"description":10000,
                                "target_users":2000,"technology_preference":500}';
  v_changed text[] := '{}';
begin
  if p_changes is null or jsonb_typeof(p_changes) <> 'object' then
    raise exception 'Nothing to update.';
  end if;
  select * into r from public.custom_project_requests where id = p_request_id for update;

  for k, v in select key, value from jsonb_each(p_changes) loop
    v_old := to_jsonb(r) -> k;
    if v_limits ? k then
      if jsonb_typeof(v) is distinct from 'string' then raise exception 'Field "%" must be text.', k; end if;
      v_text := btrim(v #>> '{}');
      if k = 'title' and v_text = '' then raise exception 'Title is required.'; end if;
      if char_length(v_text) > (v_limits ->> k)::int then
        raise exception 'Field "%" is too long (max % characters).', k, v_limits ->> k;
      end if;
      v_new := to_jsonb(v_text);
      if v_new is distinct from v_old then
        -- k is whitelisted by v_limits above; %I quotes it regardless
        execute format('update public.custom_project_requests set %I = $1 where id = $2', k) using v_text, p_request_id;
      end if;
    elsif k = 'custom_requirements' then
      if jsonb_typeof(v) is distinct from 'array' then raise exception 'Requirements must be a list.'; end if;
      select coalesce(jsonb_agg(jsonb_build_object('text', t)), '[]'::jsonb) into v_reqs
        from (
          select btrim(case jsonb_typeof(e) when 'object' then e ->> 'text' when 'string' then e #>> '{}' end) as t
            from jsonb_array_elements(v) e
        ) s
       where coalesce(t, '') <> '';
      if jsonb_array_length(v_reqs) > 30 then raise exception 'At most 30 requirements.'; end if;
      if exists (select 1 from jsonb_array_elements(v_reqs) e where char_length(e ->> 'text') > 500) then
        raise exception 'Each requirement can be at most 500 characters.';
      end if;
      v_new := v_reqs;
      if v_new is distinct from v_old then
        update public.custom_project_requests set custom_requirements = v_reqs where id = p_request_id;
      end if;
    elsif k = 'deadline' then
      if jsonb_typeof(v) = 'null' or btrim(coalesce(v #>> '{}', '')) = '' then
        v_date := null;
      else
        begin
          v_date := (v #>> '{}')::date;
        exception when others then
          raise exception 'Deadline must be a valid date (YYYY-MM-DD).';
        end;
        if p_actor_role = 'student' and v_date < current_date then
          raise exception 'The deadline cannot be in the past.';
        end if;
      end if;
      v_new := to_jsonb(v_date);
      if v_new is distinct from v_old then
        update public.custom_project_requests set deadline = v_date where id = p_request_id;
      end if;
    else
      -- anything else (final_price, estimated_total, status, amount_paid, user_id, ...) is never editable here
      raise exception 'The field "%" cannot be edited.', k using errcode = '42501';
    end if;

    if v_new is distinct from v_old then
      v_changed := v_changed || k;
      perform public._custom_project_log(p_request_id, null, p_actor_role, 'request', 'update', k, v_old, v_new);
    end if;
  end loop;
  return v_changed;
end;
$$;
revoke all on function public._custom_project_apply_request_changes(uuid, jsonb, text) from public, anon, authenticated;

create or replace function public.custom_project_update_request(p_request_id uuid, p_changes jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r         public.custom_project_requests;
  v_changed text[];
begin
  if auth.uid() is null then raise exception 'Please sign in again.' using errcode = '42501'; end if;
  select * into r from public.custom_project_requests where id = p_request_id for update;
  if not found or r.user_id <> auth.uid() then
    raise exception 'Custom project request not found.' using errcode = '42501';
  end if;
  if r.token_payment_status <> 'paid' then raise exception 'This request is not active yet.'; end if;
  if r.status <> 'new' then
    raise exception 'This request can no longer be edited because work has started. Add an extra feature or message the team instead.';
  end if;

  v_changed := public._custom_project_apply_request_changes(p_request_id, p_changes, 'student');
  if cardinality(v_changed) > 0 then
    insert into public.custom_project_admin_inbox (request_id, title, body)
    values (p_request_id, 'Customer edited a custom project request',
            coalesce(r.request_code, r.id::text) || ' · changed: ' || array_to_string(v_changed, ', '));
  end if;
  return jsonb_build_object('changed', to_jsonb(v_changed));
end;
$$;
revoke all on function public.custom_project_update_request(uuid, jsonb) from public, anon;
grant execute on function public.custom_project_update_request(uuid, jsonb) to authenticated;

create or replace function public.admin_update_custom_project_request(p_request_id uuid, p_changes jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r         public.custom_project_requests;
  v_changed text[];
begin
  if not public._custom_project_is_editor() then
    raise exception 'admin_update_custom_project_request: not permitted' using errcode = '42501';
  end if;
  select * into r from public.custom_project_requests where id = p_request_id for update;
  if not found then raise exception 'Custom project request not found.'; end if;

  v_changed := public._custom_project_apply_request_changes(p_request_id, p_changes, 'admin');
  if cardinality(v_changed) > 0 then
    insert into public.notifications (user_id, title, body, category)
    values (r.user_id, 'Project details updated',
            'The team updated the details of "' || r.title || '".', 'updates');
  end if;
  return jsonb_build_object('changed', to_jsonb(v_changed));
end;
$$;
revoke all on function public.admin_update_custom_project_request(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_custom_project_request(uuid, jsonb) to authenticated;

-- attachments (reference files) — same edit window as the request itself
create or replace function public.custom_project_add_attachment(
  p_request_id uuid, p_storage_path text, p_file_name text, p_size_mb numeric default 0, p_label text default ''
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  r    public.custom_project_requests;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in again.' using errcode = '42501'; end if;
  select * into r from public.custom_project_requests where id = p_request_id for update;
  if not found or r.user_id <> auth.uid() then
    raise exception 'Custom project request not found.' using errcode = '42501';
  end if;
  if r.token_payment_status <> 'paid' or r.status <> 'new' then
    raise exception 'Attachments can only be changed before work starts.';
  end if;
  if p_storage_path is null or position((auth.uid()::text || '/') in p_storage_path) <> 1
     or p_storage_path like '%..%' or char_length(p_storage_path) > 500 then
    raise exception 'Invalid file path.' using errcode = '42501';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'custom-project-uploads' and o.name = p_storage_path) then
    raise exception 'Upload the file first.';
  end if;
  if coalesce(p_size_mb, 0) < 0 or coalesce(p_size_mb, 0) > 100 then raise exception 'File is too large.'; end if;
  if (select count(*) from public.custom_project_request_files where request_id = p_request_id) >= 20 then
    raise exception 'At most 20 attachments per request.';
  end if;

  insert into public.custom_project_request_files (request_id, kind, label, storage_path, file_name, size_mb, sort_order)
  values (p_request_id, 'reference', left(coalesce(btrim(p_label), ''), 200), p_storage_path,
          left(coalesce(btrim(p_file_name), ''), 255), round(coalesce(p_size_mb, 0), 2),
          coalesce((select max(sort_order) + 1 from public.custom_project_request_files where request_id = p_request_id), 0))
  returning id into v_id;
  perform public._custom_project_log(p_request_id, null, 'student', 'attachment', 'add', 'file', null,
    jsonb_build_object('file_id', v_id, 'file_name', p_file_name));
  insert into public.custom_project_admin_inbox (request_id, title, body)
  values (p_request_id, 'Customer added an attachment', coalesce(r.request_code, r.id::text) || ' · ' || coalesce(p_file_name, 'file'));
  return v_id;
end;
$$;
revoke all on function public.custom_project_add_attachment(uuid, text, text, numeric, text) from public, anon;
grant execute on function public.custom_project_add_attachment(uuid, text, text, numeric, text) to authenticated;

create or replace function public.custom_project_remove_attachment(p_file_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  f public.custom_project_request_files;
  r public.custom_project_requests;
begin
  if auth.uid() is null then raise exception 'Please sign in again.' using errcode = '42501'; end if;
  select * into f from public.custom_project_request_files where id = p_file_id;
  if not found then raise exception 'Attachment not found.' using errcode = '42501'; end if;
  select * into r from public.custom_project_requests where id = f.request_id for update;
  if r.user_id <> auth.uid() then raise exception 'Attachment not found.' using errcode = '42501'; end if;
  if r.status <> 'new' then raise exception 'Attachments can only be changed before work starts.'; end if;
  delete from public.custom_project_request_files where id = p_file_id;
  perform public._custom_project_log(r.id, null, 'student', 'attachment', 'remove', 'file',
    jsonb_build_object('file_id', f.id, 'file_name', f.file_name), null);
  return f.storage_path;   -- the caller removes the object from its own storage folder
end;
$$;
revoke all on function public.custom_project_remove_attachment(uuid) from public, anon;
grant execute on function public.custom_project_remove_attachment(uuid) to authenticated;

-- ============================================================================
-- 10. add-ons
-- ============================================================================
-- Defence in depth under RLS (which grants no client write at all): only the add-on RPCs may write, and in
-- the owner's mode a price can never change.
create or replace function public.custom_project_addons_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_mode text := coalesce(nullif(current_setting('cx.cp_addon_rpc', true), ''), 'off');
begin
  if public._is_privileged_caller() or v_mode = 'admin' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  if v_mode = 'owner' then
    if tg_op = 'INSERT' then
      if new.status <> 'pending' or new.price is not null then
        raise exception 'Only an admin can price an add-on.' using errcode = '42501';
      end if;
      return new;
    elsif tg_op = 'UPDATE' then
      if new.price is distinct from old.price then
        raise exception 'Only an admin can change an add-on price.' using errcode = '42501';
      end if;
      if new.status is distinct from old.status and not (old.status = 'priced' and new.status = 'accepted') then
        raise exception 'This add-on status change is not allowed.' using errcode = '42501';
      end if;
      if new.project_id is distinct from old.project_id or new.requested_by is distinct from old.requested_by then
        raise exception 'This add-on change is not allowed.' using errcode = '42501';
      end if;
      return new;
    else
      if old.status <> 'pending' then
        raise exception 'Only pending add-ons can be deleted.' using errcode = '42501';
      end if;
      return old;
    end if;
  end if;
  raise exception 'Add-ons can only be changed through the add-on functions.' using errcode = '42501';
end;
$$;
revoke all on function public.custom_project_addons_guard() from public, anon, authenticated;

drop trigger if exists custom_project_addons_guard on public.custom_project_addons;
create trigger custom_project_addons_guard
  before insert or update or delete on public.custom_project_addons
  for each row execute function public.custom_project_addons_guard();

-- owner: create / edit / delete (pending only) / accept (priced only)
create or replace function public.custom_project_addon_create(p_project_id uuid, p_title text, p_description text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  r    public.custom_project_requests;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in again.' using errcode = '42501'; end if;
  select * into r from public.custom_project_requests where id = p_project_id for update;
  if not found or r.user_id <> auth.uid() then
    raise exception 'Custom project request not found.' using errcode = '42501';
  end if;
  if r.token_payment_status <> 'paid' then raise exception 'This request is not active yet.'; end if;
  if r.status = 'cancelled' then raise exception 'This request is cancelled.'; end if;
  if nullif(btrim(coalesce(p_title, '')), '') is null then raise exception 'Give the extra feature a title.'; end if;
  if char_length(btrim(p_title)) > 200 then raise exception 'Title is too long (max 200 characters).'; end if;
  if char_length(coalesce(p_description, '')) > 5000 then raise exception 'Description is too long (max 5000 characters).'; end if;
  if (select count(*) from public.custom_project_addons where project_id = p_project_id and status = 'pending') >= 20 then
    raise exception 'You already have 20 extra features waiting for a price.';
  end if;

  perform set_config('cx.cp_addon_rpc', 'owner', true);
  insert into public.custom_project_addons (project_id, title, description, requested_by, status, price)
  values (p_project_id, btrim(p_title), btrim(coalesce(p_description, '')), auth.uid(), 'pending', null)
  returning id into v_id;
  perform set_config('cx.cp_addon_rpc', 'off', true);

  perform public._custom_project_log(p_project_id, v_id, 'student', 'addon', 'create', null, null,
    jsonb_build_object('title', btrim(p_title), 'description', btrim(coalesce(p_description, ''))));
  insert into public.custom_project_admin_inbox (request_id, title, body)
  values (p_project_id, 'Extra feature requested',
          coalesce(r.request_code, r.id::text) || ' · ' || btrim(p_title) || ' — needs a price');
  return v_id;
end;
$$;
revoke all on function public.custom_project_addon_create(uuid, text, text) from public, anon;
grant execute on function public.custom_project_addon_create(uuid, text, text) to authenticated;

create or replace function public.custom_project_addon_update(p_addon_id uuid, p_title text, p_description text default '')
returns void language plpgsql security definer set search_path = public as $$
declare
  a public.custom_project_addons;
  r public.custom_project_requests;
begin
  if auth.uid() is null then raise exception 'Please sign in again.' using errcode = '42501'; end if;
  select * into a from public.custom_project_addons where id = p_addon_id for update;
  if not found then raise exception 'Extra feature not found.' using errcode = '42501'; end if;
  select * into r from public.custom_project_requests where id = a.project_id;
  if r.user_id <> auth.uid() then raise exception 'Extra feature not found.' using errcode = '42501'; end if;
  if a.status <> 'pending' then raise exception 'Only extra features still waiting for a price can be edited.'; end if;
  if nullif(btrim(coalesce(p_title, '')), '') is null then raise exception 'Give the extra feature a title.'; end if;
  if char_length(btrim(p_title)) > 200 then raise exception 'Title is too long (max 200 characters).'; end if;
  if char_length(coalesce(p_description, '')) > 5000 then raise exception 'Description is too long (max 5000 characters).'; end if;
  if a.title = btrim(p_title) and a.description = btrim(coalesce(p_description, '')) then
    return;
  end if;

  perform set_config('cx.cp_addon_rpc', 'owner', true);
  update public.custom_project_addons
     set title = btrim(p_title), description = btrim(coalesce(p_description, ''))
   where id = p_addon_id;
  perform set_config('cx.cp_addon_rpc', 'off', true);

  perform public._custom_project_log(a.project_id, a.id, 'student', 'addon', 'update', null,
    jsonb_build_object('title', a.title, 'description', a.description),
    jsonb_build_object('title', btrim(p_title), 'description', btrim(coalesce(p_description, ''))));
  insert into public.custom_project_admin_inbox (request_id, title, body)
  values (a.project_id, 'Extra feature edited', coalesce(r.request_code, r.id::text) || ' · ' || btrim(p_title));
end;
$$;
revoke all on function public.custom_project_addon_update(uuid, text, text) from public, anon;
grant execute on function public.custom_project_addon_update(uuid, text, text) to authenticated;

create or replace function public.custom_project_addon_delete(p_addon_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  a public.custom_project_addons;
  r public.custom_project_requests;
begin
  if auth.uid() is null then raise exception 'Please sign in again.' using errcode = '42501'; end if;
  select * into a from public.custom_project_addons where id = p_addon_id for update;
  if not found then raise exception 'Extra feature not found.' using errcode = '42501'; end if;
  select * into r from public.custom_project_requests where id = a.project_id;
  if r.user_id <> auth.uid() then raise exception 'Extra feature not found.' using errcode = '42501'; end if;
  if a.status <> 'pending' then raise exception 'Only extra features still waiting for a price can be deleted.'; end if;

  perform public._custom_project_log(a.project_id, null, 'student', 'addon', 'delete', null,
    jsonb_build_object('addon_id', a.id, 'title', a.title, 'description', a.description), null);
  perform set_config('cx.cp_addon_rpc', 'owner', true);
  delete from public.custom_project_addons where id = p_addon_id;
  perform set_config('cx.cp_addon_rpc', 'off', true);
  insert into public.custom_project_admin_inbox (request_id, title, body)
  values (a.project_id, 'Extra feature withdrawn', coalesce(r.request_code, r.id::text) || ' · ' || a.title);
end;
$$;
revoke all on function public.custom_project_addon_delete(uuid) from public, anon;
grant execute on function public.custom_project_addon_delete(uuid) to authenticated;

create or replace function public.custom_project_addon_accept(p_addon_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  a public.custom_project_addons;
  r public.custom_project_requests;
begin
  if auth.uid() is null then raise exception 'Please sign in again.' using errcode = '42501'; end if;
  select * into a from public.custom_project_addons where id = p_addon_id;
  if not found then raise exception 'Extra feature not found.' using errcode = '42501'; end if;
  -- lock the request first (same order as the payment trigger), then the add-on
  select * into r from public.custom_project_requests where id = a.project_id for update;
  if r.user_id <> auth.uid() then raise exception 'Extra feature not found.' using errcode = '42501'; end if;
  select * into a from public.custom_project_addons where id = p_addon_id for update;
  if a.status <> 'priced' then raise exception 'This extra feature has not been priced yet (or was already decided).'; end if;
  if r.status = 'cancelled' then raise exception 'This request is cancelled.'; end if;

  perform set_config('cx.cp_addon_rpc', 'owner', true);
  update public.custom_project_addons set status = 'accepted' where id = p_addon_id;
  perform set_config('cx.cp_addon_rpc', 'off', true);

  perform public._custom_project_log(a.project_id, a.id, 'student', 'addon', 'accept', 'status',
    to_jsonb('priced'::text), to_jsonb('accepted'::text));
  insert into public.custom_project_admin_inbox (request_id, title, body)
  values (a.project_id, 'Extra feature accepted',
          coalesce(r.request_code, r.id::text) || ' · ' || a.title || ' · ₹' || a.price::text);
  return public._custom_project_amounts(a.project_id);
end;
$$;
revoke all on function public.custom_project_addon_accept(uuid) from public, anon;
grant execute on function public.custom_project_addon_accept(uuid) to authenticated;

-- admin: price (pending/priced -> priced) and reject (pending/priced -> rejected)
create or replace function public.admin_custom_project_addon_set_price(p_addon_id uuid, p_price numeric, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  a       public.custom_project_addons;
  r       public.custom_project_requests;
  v_price numeric := round(p_price, 2);
begin
  if not public._custom_project_is_editor() then
    raise exception 'admin_custom_project_addon_set_price: not permitted' using errcode = '42501';
  end if;
  if v_price is null or v_price < 0 or v_price > 100000000 then raise exception 'Enter a valid price.'; end if;
  select * into a from public.custom_project_addons where id = p_addon_id;
  if not found then raise exception 'Add-on not found.'; end if;
  select * into r from public.custom_project_requests where id = a.project_id for update;
  select * into a from public.custom_project_addons where id = p_addon_id for update;
  if a.status not in ('pending', 'priced') then
    raise exception 'Only pending or priced add-ons can be (re)priced.';
  end if;
  if a.status = 'priced' and a.price = v_price then
    return;
  end if;

  perform set_config('cx.cp_addon_rpc', 'admin', true);
  update public.custom_project_addons set price = v_price, status = 'priced' where id = p_addon_id;
  perform set_config('cx.cp_addon_rpc', 'off', true);

  perform public._custom_project_log(a.project_id, a.id, 'admin', 'addon', 'price', 'price',
    jsonb_build_object('status', a.status, 'price', a.price), jsonb_build_object('status', 'priced', 'price', v_price), p_note);
  insert into public.notifications (user_id, title, body, category)
  values (r.user_id, 'Extra feature priced',
          '"' || a.title || '" for "' || r.title || '" is priced at ₹' || v_price::text || '. Accept it to add it to your project.',
          'updates');
end;
$$;
revoke all on function public.admin_custom_project_addon_set_price(uuid, numeric, text) from public, anon;
grant execute on function public.admin_custom_project_addon_set_price(uuid, numeric, text) to authenticated;

create or replace function public.admin_custom_project_addon_reject(p_addon_id uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  a public.custom_project_addons;
  r public.custom_project_requests;
begin
  if not public._custom_project_is_editor() then
    raise exception 'admin_custom_project_addon_reject: not permitted' using errcode = '42501';
  end if;
  select * into a from public.custom_project_addons where id = p_addon_id;
  if not found then raise exception 'Add-on not found.'; end if;
  select * into r from public.custom_project_requests where id = a.project_id for update;
  select * into a from public.custom_project_addons where id = p_addon_id for update;
  if a.status not in ('pending', 'priced') then
    raise exception 'Only pending or priced add-ons can be rejected.';
  end if;

  perform set_config('cx.cp_addon_rpc', 'admin', true);
  update public.custom_project_addons set status = 'rejected' where id = p_addon_id;
  perform set_config('cx.cp_addon_rpc', 'off', true);

  perform public._custom_project_log(a.project_id, a.id, 'admin', 'addon', 'reject', 'status',
    to_jsonb(a.status), to_jsonb('rejected'::text), p_note);
  insert into public.notifications (user_id, title, body, category)
  values (r.user_id, 'Extra feature not accepted',
          '"' || a.title || '" for "' || r.title || '" was not accepted by the team.'
            || coalesce(' Note: ' || nullif(btrim(p_note), ''), ''),
          'updates');
end;
$$;
revoke all on function public.admin_custom_project_addon_reject(uuid, text) from public, anon;
grant execute on function public.admin_custom_project_addon_reject(uuid, text) to authenticated;

-- ============================================================================
-- 11. delivered files stay visible after delivery (never gated on payment)
-- ============================================================================
drop policy if exists "cpd_select_delivered" on public.custom_project_deliveries;
create policy "cpd_select_delivered" on public.custom_project_deliveries
  for select using (exists (
    select 1 from public.custom_project_requests r
     where r.id = request_id and r.user_id = auth.uid()
       and (r.status = 'delivered' or delivered_at is not null)
  ));

drop policy if exists "cpda_select_delivered" on public.custom_project_delivery_assets;
create policy "cpda_select_delivered" on public.custom_project_delivery_assets
  for select using (exists (
    select 1
      from public.custom_project_deliveries d
      join public.custom_project_requests r on r.id = d.request_id
     where d.id = delivery_id and r.user_id = auth.uid()
       and (r.status = 'delivered' or d.delivered_at is not null)
  ));

-- ============================================================================
-- 12. deliveries bucket: the owner may read only files attached to a delivered delivery
-- ============================================================================
-- 0033's owner policy was path-only (<owner uid>/...), so files the admin had uploaded but not yet
-- delivered could be listed and downloaded straight from Storage. Now the same rule as the table policies
-- above applies: the object must be a custom_project_delivery_assets row of the caller's own request that is
-- delivered (status 'delivered' or delivered_at set). The admin policies on this bucket are unchanged.
create index if not exists custom_project_delivery_assets_storage_path_idx
  on public.custom_project_delivery_assets (storage_path);

create or replace function public.custom_project_can_read_delivery_file(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1
      from public.custom_project_delivery_assets a
      join public.custom_project_deliveries d on d.id = a.delivery_id
      join public.custom_project_requests r on r.id = d.request_id
     where a.storage_path = p_name
       and r.user_id = auth.uid()
       and (r.status = 'delivered' or d.delivered_at is not null)
  );
$$;
revoke all on function public.custom_project_can_read_delivery_file(text) from public, anon;
grant execute on function public.custom_project_can_read_delivery_file(text) to authenticated;

drop policy if exists "cp_deliveries_owner_read" on storage.objects;
create policy "cp_deliveries_owner_read" on storage.objects for select to authenticated
  using (bucket_id = 'custom-project-deliveries'
         and (storage.foldername(name))[1] = auth.uid()::text
         and public.custom_project_can_read_delivery_file(name));

notify pgrst, 'reload schema';

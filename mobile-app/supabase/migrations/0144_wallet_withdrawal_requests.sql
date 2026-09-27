-- mobile-app/supabase/migrations/0144_wallet_withdrawal_requests.sql
-- CANONICAL PAIR - byte-identical to admin-panel/supabase/migrations/115_wallet_withdrawal_requests.sql
-- (apply either; the other is an idempotent no-op).
--
-- UPI withdrawal = a REQUEST, never a payout. Before this migration two halves never met:
--   * request_withdrawal() (0038) inserted a permanent 'withdrawal' debit and nothing else, so the
--     request never reached the admin queue and could not be approved / rejected / refunded;
--   * the admin queue (withdrawal_requests, admin 007) debited only on approve and was fed by nothing.
--
-- Now (one flow, reusing both existing objects):
--   request_withdrawal(p_amount, p_upi_id)   same signature/return type as 0038 (mobile caller unchanged).
--     One transaction, per-user advisory lock: validates UPI ID format, amount > 0 with <= 2 decimals,
--     amount >= reward_settings.min_payout (the existing admin-set minimum), no other PENDING request,
--     amount <= balance (same maths as the clients: every credit minus every 'withdrawal' debit).
--     Then HOLDS the money by inserting the 'withdrawal' debit and creates the pending
--     withdrawal_requests row linked to it (wallet_transaction_id).
--   admin_process_withdrawal(id, decision, note)   same signature; decisions:
--     approve  pending  -> approved   (money already held; a legacy request with no hold is debited
--                                      here exactly as before, with the original balance check)
--     reject   pending|approved -> rejected   refunds the held debit with a 'withdrawal' CREDIT
--     paid     approved -> paid        note = payout reference (UTR); records a MANUAL transfer
--   Status lifecycle: pending / approved / rejected / paid. 'paid' and 'rejected' are terminal.
--
-- RLS: withdrawal_requests keeps "select own" + admin select/update (0119 permission-gated). The client
-- INSERT policy is dropped so the RPC is the only way to create a request (no un-held request can be
-- inserted). A partial unique index backs the "one pending request per user" rule.
-- Additive · guarded · idempotent · re-runnable. Existing rows are untouched.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.withdrawal_requests') is null
     or to_regclass('public.wallet_transactions') is null
     or to_regclass('public.reward_settings') is null
     or to_regprocedure('public.require_admin_role(text[],text,text)') is null then
    raise exception '0144 prerequisite missing: admin 007 (withdrawal_requests), mobile 0020/0026 and 0119 (require_admin_role)';
  end if;
end $$;

-- ---- 1. withdrawal_requests: 'paid' status + payout / refund bookkeeping --------------------------
alter table public.withdrawal_requests drop constraint if exists withdrawal_requests_status_check;
alter table public.withdrawal_requests
  add constraint withdrawal_requests_status_check
  check (status in ('pending', 'approved', 'rejected', 'paid'));

alter table public.withdrawal_requests
  add column if not exists paid_at               timestamptz,
  add column if not exists paid_by               uuid references auth.users (id) on delete set null,
  add column if not exists payout_reference      text not null default '',
  add column if not exists refund_transaction_id uuid references public.wallet_transactions (id) on delete set null;

create index if not exists withdrawal_requests_user_idx
  on public.withdrawal_requests (user_id, created_at desc);

do $$
begin
  if exists (select 1 from public.withdrawal_requests where status = 'pending'
             group by user_id having count(*) > 1) then
    raise warning '0144: users with >1 pending withdrawal exist; one-pending index NOT created (RPC still enforces it). Resolve them, then re-run.';
  else
    create unique index if not exists withdrawal_requests_one_pending_per_user
      on public.withdrawal_requests (user_id) where status = 'pending';
  end if;
end $$;

-- request_withdrawal() is the only client path to a withdrawal request.
drop policy if exists "withdrawal_requests_insert_own" on public.withdrawal_requests;

-- ---- 2. request_withdrawal: validate + hold + queue, atomically -----------------------------------
create or replace function public.request_withdrawal(
  p_amount numeric,
  p_upi_id text
)
returns public.wallet_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_upi     text := lower(btrim(coalesce(p_upi_id, '')));
  v_min     numeric;
  v_balance numeric;
  v_row     public.wallet_transactions;
begin
  if v_uid is null then
    raise exception 'You must be signed in to request a withdrawal'
      using errcode = 'insufficient_privilege';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter a withdrawal amount greater than zero'
      using errcode = 'check_violation';
  end if;

  if p_amount <> round(p_amount, 2) then
    raise exception 'Withdrawal amount can have at most 2 decimal places'
      using errcode = 'check_violation';
  end if;

  if v_upi = '' then
    raise exception 'A UPI ID is required to request a withdrawal'
      using errcode = 'check_violation';
  end if;

  if length(v_upi) > 100 or v_upi !~ '^[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{1,31}$' then
    raise exception 'Enter a valid UPI ID (for example name@bank)'
      using errcode = 'check_violation';
  end if;

  select coalesce(min_payout, 0) into v_min from public.reward_settings where id = 1;
  if p_amount < coalesce(v_min, 0) then
    raise exception 'Minimum withdrawal amount is %', coalesce(v_min, 0)
      using errcode = 'check_violation';
  end if;

  -- Serialise this user's withdrawal requests so two concurrent calls can't both pass the checks below.
  perform pg_advisory_xact_lock(hashtextextended('wallet:withdraw:' || v_uid::text, 0));

  if exists (select 1 from public.withdrawal_requests where user_id = v_uid and status = 'pending') then
    raise exception 'You already have a pending withdrawal request. Please wait until it is processed.'
      using errcode = 'check_violation';
  end if;

  -- Real balance — identical maths to walletService.getWalletSummary() / computeWalletBalance():
  -- every credit, minus every 'withdrawal' debit.
  select coalesce(sum(amount) filter (where type = 'credit'), 0)
       - coalesce(sum(amount) filter (where type = 'debit' and category = 'withdrawal'), 0)
    into v_balance
  from public.wallet_transactions
  where user_id = v_uid;

  if p_amount > v_balance then
    raise exception 'Withdrawal amount % exceeds your available balance of %', p_amount, v_balance
      using errcode = 'check_violation';
  end if;

  -- Hold: the debit reduces the balance now; a rejection refunds it with a matching credit.
  insert into public.wallet_transactions (user_id, type, category, amount, description)
  values (v_uid, 'debit', 'withdrawal', p_amount, 'Withdrawal requested to ' || v_upi)
  returning * into v_row;

  insert into public.withdrawal_requests (user_id, amount, method, account_details, status, wallet_transaction_id)
  values (v_uid, p_amount, 'upi', jsonb_build_object('upi_id', v_upi), 'pending', v_row.id);

  return v_row;
end;
$$;

revoke all on function public.request_withdrawal(numeric, text) from public, anon;
grant execute on function public.request_withdrawal(numeric, text) to authenticated;

-- ---- 3. admin_process_withdrawal: approve / reject (refund) / paid --------------------------------
create or replace function public.admin_process_withdrawal(p_request_id uuid, p_decision text, p_note text default ''::text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r         public.withdrawal_requests%rowtype;
  v_balance numeric;
  v_txn_id  uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_process_withdrawal: caller is not an active admin';
  end if;

  perform public.require_admin_role(array['super_admin','admin'], 'referrals', 'edit');

  select * into r from public.withdrawal_requests where id = p_request_id for update;
  if not found then raise exception 'withdrawal request not found'; end if;

  if p_decision = 'approve' then
    if r.status <> 'pending' then raise exception 'withdrawal request already %', r.status; end if;

    v_txn_id := r.wallet_transaction_id;
    if v_txn_id is null then
      -- legacy request created before 0144 (no hold): debit now, original behaviour
      select coalesce(sum(case when type = 'credit' then amount else -amount end), 0)
        into v_balance from public.wallet_transactions where user_id = r.user_id;
      if v_balance < r.amount then
        raise exception 'insufficient wallet balance (have %, need %)', v_balance, r.amount;
      end if;

      insert into public.wallet_transactions (user_id, type, category, amount, description)
      values (r.user_id, 'debit', 'withdrawal', r.amount, 'Withdrawal approved')
      returning id into v_txn_id;
    end if;

    update public.withdrawal_requests
       set status = 'approved', decided_by = auth.uid(), decided_at = now(),
           decision_note = coalesce(p_note, ''), wallet_transaction_id = v_txn_id
     where id = p_request_id;

  elsif p_decision = 'reject' then
    if r.status not in ('pending', 'approved') then raise exception 'withdrawal request already %', r.status; end if;

    -- refund the held debit (if any) so the user's balance is restored
    if r.wallet_transaction_id is not null then
      insert into public.wallet_transactions (user_id, type, category, amount, description)
      values (r.user_id, 'credit', 'withdrawal', r.amount, 'Withdrawal rejected — amount refunded to wallet')
      returning id into v_txn_id;
    end if;

    update public.withdrawal_requests
       set status = 'rejected', decided_by = auth.uid(), decided_at = now(),
           decision_note = coalesce(p_note, ''), refund_transaction_id = v_txn_id
     where id = p_request_id;

  elsif p_decision = 'paid' then
    if r.status <> 'approved' then
      raise exception 'only an approved withdrawal can be marked paid (currently %)', r.status;
    end if;
    if btrim(coalesce(p_note, '')) = '' then
      raise exception 'Enter the payout reference (UPI transaction ID / UTR)';
    end if;

    -- TODO(payout-provider): no payout provider (e.g. RazorpayX Payouts) is configured, so 'paid' only
    -- RECORDS a manual UPI transfer the admin made outside the platform. When a provider is integrated,
    -- initiate the payout from a service-role Edge Function and set 'paid' from its verified webhook.
    update public.withdrawal_requests
       set status = 'paid', paid_by = auth.uid(), paid_at = now(), payout_reference = btrim(p_note)
     where id = p_request_id;
    v_txn_id := r.wallet_transaction_id;

  else
    raise exception 'decision must be approve, reject or paid';
  end if;

  return v_txn_id;
end;
$$;

revoke all on function public.admin_process_withdrawal(uuid, text, text) from public, anon;
grant execute on function public.admin_process_withdrawal(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';

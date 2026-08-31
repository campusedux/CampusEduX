-- ============================================================================
-- 0038_wallet_withdrawal_rpc.sql — SEC-002: validate wallet withdrawals
--                                   server-side (balance + concurrency)
-- ============================================================================
-- The client INSERT policy wallet_transactions_insert_own_debit (0020) lets a
-- user insert a 'withdrawal' debit row for ANY amount:
--     INSERT /rest/v1/wallet_transactions
--       { user_id: <self>, type: 'debit', category: 'withdrawal', amount: 99999 }
-- There is no server-side check against the user's real balance, and nothing
-- serialises two requests, so a user can withdraw more than they have earned,
-- or fire two withdrawals against the same balance at once.
--
-- This migration:
--   1. adds public.request_withdrawal(p_amount, p_upi_id) — SECURITY DEFINER,
--      one transaction: takes a per-user advisory lock, recomputes the real
--      balance the exact way walletService.getWalletSummary() does (sum of
--      every credit, minus the sum of 'withdrawal' debits), rejects a
--      null / <= 0 / over-balance amount, and only then inserts the debit row
--      with user_id = auth.uid().
--   2. drops wallet_transactions_insert_own_debit so this RPC is the only
--      client path to a withdrawal. Wallet CREDITS still arrive via the Edge
--      Functions on the service-role key (which bypasses RLS); admin
--      adjustments still go through admin_adjust_wallet(). Do NOT re-add that
--      INSERT policy (0020 would recreate it on a blind re-run — that is
--      intentional to avoid here).
--
-- Concurrency: pg_advisory_xact_lock keyed on the caller's id serialises a
-- user's own withdrawal requests, so a second concurrent call blocks until the
-- first commits and then sees the reduced balance and is rejected.
--
-- Additive · guarded · idempotent · re-runnable.
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

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

  if coalesce(btrim(p_upi_id), '') = '' then
    raise exception 'A UPI ID is required to request a withdrawal'
      using errcode = 'check_violation';
  end if;

  -- Serialise this user's withdrawal requests so two concurrent calls can't
  -- both pass the balance check below.
  perform pg_advisory_xact_lock(hashtextextended('wallet:withdraw:' || v_uid::text, 0));

  -- Real balance — identical maths to walletService.getWalletSummary():
  -- every credit, minus every 'withdrawal' debit.
  select coalesce(sum(amount) filter (where type = 'credit'), 0)
       - coalesce(sum(amount) filter (where type = 'debit' and category = 'withdrawal'), 0)
    into v_balance
  from public.wallet_transactions
  where user_id = v_uid;

  if p_amount > v_balance then
    raise exception 'Withdrawal amount % exceeds your available balance of %',
      p_amount, v_balance
      using errcode = 'check_violation';
  end if;

  insert into public.wallet_transactions (user_id, type, category, amount, description)
  values (
    v_uid,
    'debit',
    'withdrawal',
    p_amount,
    'Withdrawal requested to ' || p_upi_id || ' — processing within 3-5 business days'
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.request_withdrawal(numeric, text) from public, anon;
grant execute on function public.request_withdrawal(numeric, text) to authenticated;

-- request_withdrawal() is now the only client path to a withdrawal debit.
drop policy if exists "wallet_transactions_insert_own_debit" on public.wallet_transactions;

notify pgrst, 'reload schema';

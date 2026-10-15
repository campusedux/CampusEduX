-- Sum the complete owner-scoped wallet ledger; direct-purchase debits are not wallet spend.
create or replace function public.wallet_available_balance()
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select greatest(0::numeric, coalesce(sum(
    case when type = 'credit' then amount
         when type = 'debit' and category = 'withdrawal' then -amount
         else 0 end
  ), 0::numeric))
  from public.wallet_transactions
  where user_id = (select auth.uid());
$$;
revoke all on function public.wallet_available_balance() from public, anon;
grant execute on function public.wallet_available_balance() to authenticated;

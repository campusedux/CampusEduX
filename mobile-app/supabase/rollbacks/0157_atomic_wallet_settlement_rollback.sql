-- SEC-03 recovery: apply with psql -1 / a single transaction to pause settlement.
-- Coordinate with both Edge handlers: keep them failing closed while paused.
-- Do NOT restore the old two-write handlers; that reopens the financial gap.
-- Preserve the unique order links, credits, consistency/immutability triggers,
-- all SEC-01 objects and financial history. No data/column/index is dropped.
-- Reapply 0157/125 to resume; reconciliation remains a separate approved task.
lock table public.wallet_topup_orders, public.wallet_transactions in access exclusive mode;
revoke all on function public.settle_wallet_topup(uuid,uuid,text,text,bigint,text)
  from public, anon, authenticated, service_role;
notify pgrst, 'reload schema';

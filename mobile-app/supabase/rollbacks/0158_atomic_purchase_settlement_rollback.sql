-- SEC-04 safe rollback: pause admission, preserve all financial records,
-- purchase links, transition/effect/integrity triggers and SEC-01/02/03 controls.
-- Apply in one transaction; coordinate handler admission and bounded lock waits.
-- Do not restore old multi-write handlers. Reapply 0158/126 to resume.
lock table public.purchases, public.wallet_transactions in access exclusive mode;
revoke all on function public.settle_project_purchase(uuid,uuid,text,text,bigint,text)
  from public, anon, authenticated, service_role;
notify pgrst, 'reload schema';

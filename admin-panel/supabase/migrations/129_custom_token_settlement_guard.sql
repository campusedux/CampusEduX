-- The token ledger UPDATE is the shared callback/webhook transaction boundary.
-- Check both mirrors under the same request lock used by migration 0128 before
-- its AFTER trigger credits money or emits history/notifications.
lock table public.custom_project_payments in share row exclusive mode;

create or replace function public.guard_custom_token_settlement()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  r public.custom_project_requests;
begin
  if tg_op = 'UPDATE' and old.kind = 'token' and old.status = 'paid' and
     row(new.id,new.request_id,new.user_id,new.kind,new.amount,new.currency,new.status,
         new.razorpay_order_id,new.razorpay_payment_id) is distinct from
     row(old.id,old.request_id,old.user_id,old.kind,old.amount,old.currency,old.status,
         old.razorpay_order_id,old.razorpay_payment_id) then
    raise exception 'settled token financial terms are immutable' using errcode = '23514';
  end if;
  if new.kind is distinct from 'token' or new.status is distinct from 'paid' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    raise exception 'token payment must start unsettled' using errcode = '23514';
  end if;
  if not public._is_privileged_caller() then
    raise exception 'token settlement requires the trusted payment path' using errcode = '42501';
  end if;
  select * into r from public.custom_project_requests where id = new.request_id for update;
  if not found or r.user_id is distinct from new.user_id
     or r.payment_order_id is null or r.payment_order_id is distinct from new.razorpay_order_id
     or new.razorpay_payment_id is null or length(btrim(new.razorpay_payment_id)) = 0
     or new.currency is distinct from 'INR' or new.amount <= 0
     or new.amount is distinct from r.token_amount
     or (r.token_payment_status = 'paid' and r.payment_id is distinct from new.razorpay_payment_id) then
    raise exception 'token settlement expectations changed' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_custom_token_settlement() from public, anon, authenticated, service_role;
drop trigger if exists b_sec07_custom_token_settlement on public.custom_project_payments;
create trigger b_sec07_custom_token_settlement before insert or update on public.custom_project_payments
  for each row execute function public.guard_custom_token_settlement();

notify pgrst, 'reload schema';

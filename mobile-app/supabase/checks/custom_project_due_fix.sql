-- ============================================================================
-- custom_project_due_fix.sql  --  ONE-TIME DATA CORRECTION. WRITES. Owner-approved runs only.
-- Run ONLY after migration 0128 (admin 099) is applied, and only after reviewing the rows from
-- checks/custom_project_due_audit.sql. It ends in ROLLBACK: run it once as-is to see the preview/result
-- sets, then change the last line to COMMIT and run it again to apply.
--
-- What it corrects (nothing else is touched):
--   1. token_settled_by_gateway_only -> token_payment_status = 'paid' (+ one history row each). The project
--      then appears in "My projects" and the token counts toward the due.
--   2. amount_paid_drift -> amount_paid re-synced from the one calculation (paid ledger rows + credits).
-- What it deliberately does NOT do (money decisions for a human):
--   * refund_due payments: refund in Razorpay, OR record them in the admin panel as an
--     "Offline payment" credit on the request (Custom projects -> request -> Credits).
--   * unsettled_balance_checkout: check each order id in the Razorpay dashboard; if captured, record it the
--     same way (credit), since the webhook/verify never settled it.
--   * delivered_files_hidden: mark the request Delivered in the admin panel (the delivery gate stays).
-- The due itself is never stored: it is always computed by public._custom_project_amounts(), so once 1 and
-- 2 are fixed every screen shows the right figure.
-- ============================================================================
begin;

-- ---- preview: rows that will change ----------------------------------------
select 'token_settled_by_gateway_only' as fix, r.request_code, r.title, r.token_payment_status as before_value, 'paid' as after_value
  from public.custom_project_requests r
 where r.token_payment_status <> 'paid'
   and exists (select 1 from public.custom_project_payments p
                where p.request_id = r.id and p.kind = 'token' and p.status = 'paid')
union all
select 'amount_paid_drift', r.request_code, r.title, r.amount_paid::text,
       (public._custom_project_amounts(r.id) ->> 'settled_total')
  from public.custom_project_requests r
 where r.amount_paid <> (public._custom_project_amounts(r.id) ->> 'settled_total')::numeric
order by 1, 2;

-- ---- 1. token captured by the gateway but never marked on the request ---------------
with fixed as (
  update public.custom_project_requests r
     set token_payment_status = 'paid',
         payment_id = coalesce(r.payment_id, (select p.razorpay_payment_id from public.custom_project_payments p
                                               where p.request_id = r.id and p.kind = 'token' and p.status = 'paid'
                                               order by p.created_at limit 1))
   where r.token_payment_status <> 'paid'
     and exists (select 1 from public.custom_project_payments p
                  where p.request_id = r.id and p.kind = 'token' and p.status = 'paid')
  returning r.id
)
insert into public.custom_project_request_history (request_id, old_status, new_status, changed_by_role, note)
select id, null, 'new', 'system', 'Token payment reconciled from the payment ledger (one-time fix)' from fixed;

-- ---- 2. amount_paid mirror re-synced from the one calculation ------------------------
select public._custom_project_sync_amount_paid(r.id)
  from public.custom_project_requests r
 where r.amount_paid <> (public._custom_project_amounts(r.id) ->> 'settled_total')::numeric;

-- ---- result: must return zero rows ---------------------------------------------------
select r.request_code, r.token_payment_status, r.amount_paid, public._custom_project_amounts(r.id) as amounts
  from public.custom_project_requests r
 where r.amount_paid <> (public._custom_project_amounts(r.id) ->> 'settled_total')::numeric
    or (r.token_payment_status <> 'paid'
        and exists (select 1 from public.custom_project_payments p
                     where p.request_id = r.id and p.kind = 'token' and p.status = 'paid'));

rollback;   -- change to COMMIT only after reviewing the preview above

-- ============================================================================
-- custom_project_due_audit.sql  --  READ-ONLY (SELECT only). Paste into the Supabase SQL editor.
-- Lists every custom project whose "due" / visibility is wrong today. Safe to run BEFORE or AFTER
-- migration 0128 (it does not use any 0128 object). One row per affected request; `problems` says why.
--
--   token_settled_by_gateway_only  Razorpay captured the token (ledger row 'paid', usually via the webhook)
--                                  but the request still says token_payment_status <> 'paid': the project is
--                                  hidden from "My projects" and the whole estimate shows as due.
--   amount_paid_drift              amount_paid (what both apps show) differs from the paid ledger rows.
--   refund_due_payment             the customer paid a balance that did not fit the balance at settle time;
--                                  it was NOT credited. Decide: refund it, or record it as an offline-payment
--                                  credit in the admin panel (after 0128).
--   unsettled_balance_checkout     a balance checkout older than 30 min is still 'created'/'failed'. Check the
--                                  order in the Razorpay dashboard: if it was captured, the money is not recorded.
--   delivered_files_hidden         a delivery with a demo URL/files exists but the request is not 'delivered'
--                                  and was never delivered, so the owner cannot see it.
-- ============================================================================
with ledger as (
  select p.request_id,
         sum(p.amount) filter (where p.kind = 'token'   and p.status = 'paid')                    as token_paid,
         coalesce(sum(p.amount) filter (where p.kind = 'balance' and p.status = 'paid'), 0)      as balance_paid,
         coalesce(sum(p.amount) filter (where p.status = 'refund_due'), 0)                        as refund_due_amount,
         count(*) filter (where p.kind = 'balance' and p.status in ('created', 'failed')
                            and p.created_at < now() - interval '30 minutes')                     as stale_balance_checkouts,
         string_agg(p.razorpay_order_id, ', ') filter (where p.status = 'refund_due'
                            or (p.kind = 'balance' and p.status in ('created', 'failed')
                                and p.created_at < now() - interval '30 minutes'))                as orders_to_check
    from public.custom_project_payments p
   group by p.request_id
),
calc as (
  select r.id, r.request_code, r.title, r.user_id, r.status, r.token_payment_status,
         r.estimated_total, r.final_price, r.token_amount, r.amount_paid,
         coalesce(r.final_price, r.estimated_total)                                    as base_value,
         case when l.token_paid is not null then l.token_paid
              when r.token_payment_status = 'paid' then r.token_amount else 0 end        as token_counted,
         coalesce(l.balance_paid, 0)                                                    as balance_paid,
         coalesce(l.refund_due_amount, 0)                                               as refund_due_amount,
         coalesce(l.stale_balance_checkouts, 0)                                         as stale_balance_checkouts,
         l.orders_to_check,
         exists (select 1 from public.custom_project_deliveries d
                  where d.request_id = r.id and d.delivered_at is null
                    and (d.demo_url is not null
                         or exists (select 1 from public.custom_project_delivery_assets a where a.delivery_id = d.id)))
           and r.status <> 'delivered'                                                   as delivered_files_hidden
    from public.custom_project_requests r
    left join ledger l on l.request_id = r.id
)
select request_code, title, status, token_payment_status,
       base_value,
       amount_paid                                                            as amount_paid_shown_now,
       greatest(base_value - amount_paid, 0)                                  as due_shown_now,
       token_counted + balance_paid                                           as paid_per_ledger,
       greatest(round(base_value - token_counted - balance_paid, 2), 0)       as due_per_ledger,
       refund_due_amount, orders_to_check,
       array_remove(array[
         case when token_payment_status <> 'paid' and token_counted > 0 then 'token_settled_by_gateway_only' end,
         case when amount_paid <> token_counted + balance_paid then 'amount_paid_drift' end,
         case when refund_due_amount > 0 then 'refund_due_payment' end,
         case when stale_balance_checkouts > 0 then 'unsettled_balance_checkout' end,
         case when delivered_files_hidden then 'delivered_files_hidden' end
       ], null)                                                               as problems,
       id as request_id, user_id
  from calc
 where (token_payment_status <> 'paid' and token_counted > 0)
    or amount_paid <> token_counted + balance_paid
    or refund_due_amount > 0
    or stale_balance_checkouts > 0
    or delivered_files_hidden
 order by request_code;

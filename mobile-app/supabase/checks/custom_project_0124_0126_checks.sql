-- ============================================================================
-- custom_project_0124_0126_checks.sql  --  READ-ONLY (SELECT only). Paste into the Supabase SQL editor.
-- Verifies migrations 0124/096 (balance payment), 0125/097 (delivery gate) and 0126/098 (referral RPCs)
-- are really live by inspecting the objects they create (columns, constraints, functions, triggers,
-- policies, grants, bucket limit) — not the migrations table. Also checks the prerequisites 0128 needs,
-- and reports (INFO only) whether the objects of the untracked 0127_restore_resume_admin_tables already
-- exist and which admin policies guard them.
-- One row per check; `result` is PASS / FAIL / INFO. Scan for FAIL.
-- ============================================================================
with
col as (
  select table_name || '.' || column_name as c
    from information_schema.columns
   where table_schema = 'public'
     and table_name in ('custom_project_requests', 'custom_project_request_history', 'custom_project_payments')
),
con as (
  select conname, pg_get_constraintdef(oid) as def from pg_constraint
   where connamespace = 'public'::regnamespace
),
trg as (
  select tgname from pg_trigger where not tgisinternal
),
fn as (
  select
    to_regprocedure('public.custom_project_guard_money_columns()')                 as guard,
    to_regprocedure('public.custom_project_token_counts_as_paid()')                as token_paid,
    to_regprocedure('public.custom_project_apply_balance_payment()')               as apply_balance,
    to_regprocedure('public.admin_set_custom_project_final_price(uuid,numeric,text)') as final_price_rpc,
    to_regprocedure('public.custom_project_set_status(uuid,text,text)')            as set_status,
    to_regprocedure('public.apply_referral_code(text)')                            as apply_ref,
    to_regprocedure('public.referral_history()')                                   as ref_hist,
    to_regprocedure('public.has_permission(uuid,text,text)')                       as has_perm,
    to_regprocedure('public._is_privileged_caller()')                              as priv,
    to_regprocedure('public.require_permission(text,text)')                        as req_perm
),
checks(id, what, ok, detail) as (
  -- ---------------------------------------------------------------- 0124 / 096
            select '0124-01', 'custom_project_requests.final_price column',
                   exists (select 1 from col where c = 'custom_project_requests.final_price'), null::text
  union all select '0124-02', 'custom_project_requests.amount_paid column',
                   exists (select 1 from col where c = 'custom_project_requests.amount_paid'), null
  union all select '0124-03', 'final_price / amount_paid non-negative constraints',
                   (select count(*) = 2 from con where conname in ('custom_project_requests_final_price_nonneg',
                                                                   'custom_project_requests_amount_paid_nonneg')), null
  union all select '0124-04', 'history.event / old_value / new_value columns',
                   (select count(*) = 3 from col where c in ('custom_project_request_history.event',
                                                             'custom_project_request_history.old_value',
                                                             'custom_project_request_history.new_value')), null
  union all select '0124-05', 'history event check constraint',
                   exists (select 1 from con where conname = 'custom_project_request_history_event_check'), null
  union all select '0124-06', 'custom_project_payments.kind column + check',
                   exists (select 1 from col where c = 'custom_project_payments.kind')
                   and exists (select 1 from con where conname = 'custom_project_payments_kind_check'), null
  union all select '0124-07', 'payments status check allows refund_due',
                   exists (select 1 from con where conname = 'custom_project_payments_status_check2' and def ilike '%refund_due%'), null
  union all select '0124-08', 'open-balance-checkout index',
                   to_regclass('public.custom_project_payments_balance_open_idx') is not null, null
  union all select '0124-09', 'money guard / token-paid / apply-balance functions',
                   (select guard is not null and token_paid is not null and apply_balance is not null from fn), null
  union all select '0124-10', 'admin_set_custom_project_final_price(uuid,numeric,text)',
                   (select final_price_rpc is not null from fn), null
  union all select '0124-11', 'final-price RPC: authenticated may execute, anon may not',
                   (select final_price_rpc is not null
                           and has_function_privilege('authenticated', final_price_rpc, 'execute')
                           and not has_function_privilege('anon', final_price_rpc, 'execute') from fn), null
  union all select '0124-12', 'triggers guard_money / token_paid / apply_balance',
                   (select count(*) = 3 from trg where tgname in ('custom_project_requests_guard_money',
                                                                  'custom_project_requests_token_paid',
                                                                  'custom_project_payments_apply_balance')), null
  union all select '0124-13', 'owner history policy limited to event = status',
                   exists (select 1 from pg_policies where schemaname = 'public'
                             and tablename = 'custom_project_request_history' and policyname = 'cprh_select_own'
                             and qual ilike '%event%status%'), null
  -- ---------------------------------------------------------------- 0125 / 097
  union all select '0125-01', 'delivery asset kind check allows pdf / ppt',
                   exists (select 1 from con where conname = 'custom_project_delivery_assets_kind_check2'
                             and def ilike '%''pdf''%' and def ilike '%''ppt''%'), null
  union all select '0125-02', 'custom_project_set_status has the delivery gate',
                   (select set_status is not null
                           and pg_get_functiondef(set_status) ilike '%at least one file before marking%' from fn), null
  union all select '0125-03', 'custom_project_set_status keeps the permission guard (0119)',
                   (select set_status is not null
                           and pg_get_functiondef(set_status) ilike '%require_permission(''custom_projects'', ''edit'')%' from fn), null
  union all select '0125-04', 'deliveries bucket file_size_limit = 100 MB',
                   exists (select 1 from storage.buckets where id = 'custom-project-deliveries'
                             and file_size_limit = 100 * 1024 * 1024), null
  -- ---------------------------------------------------------------- 0126 / 098
  union all select '0126-01', 'apply_referral_code(text) exists, authenticated-only',
                   (select apply_ref is not null
                           and has_function_privilege('authenticated', apply_ref, 'execute')
                           and not has_function_privilege('anon', apply_ref, 'execute') from fn), null
  union all select '0126-02', 'referral_history() exists, authenticated-only',
                   (select ref_hist is not null
                           and has_function_privilege('authenticated', ref_hist, 'execute')
                           and not has_function_privilege('anon', ref_hist, 'execute') from fn), null
  -- ---------------------------------------------------------------- 0128 prerequisites
  union all select '0128-pre', 'has_permission / _is_privileged_caller / require_permission present',
                   (select has_perm is not null and priv is not null and req_perm is not null from fn), null
)
select id, what, case when ok then 'PASS' else 'FAIL' end as result, detail from checks
union all
-- INFO rows: state that tells you WHICH side of 0128 this database is on / data health
select '0124-i1', 'one-paid-balance unique index (0124 creates it, 0128 drops it)', 'INFO',
       case when to_regclass('public.custom_project_payments_one_paid_balance') is not null
            then 'present -> 0128 not applied yet' else 'absent -> 0128 applied (or 0124 missing: see 0124-* rows)' end
union all
select '0124-i2', 'token-paid requests with amount_paid = 0 (0124 backfill)', 'INFO',
       -- evaluated only when the column exists, so this script never errors on a database without 0124
       case when exists (select 1 from information_schema.columns where table_schema = 'public'
                           and table_name = 'custom_project_requests' and column_name = 'amount_paid')
            then (xpath('/row/n/text()', query_to_xml(
                   'select count(*) as n from public.custom_project_requests
                     where token_payment_status = ''paid'' and amount_paid = 0 and token_amount > 0',
                   false, true, '')))[1]::text || ' row(s) — expected 0'
            else 'n/a (amount_paid column missing)' end
union all
-- ---------------------------------------------------------------- 0127 (restore resume admin tables)
select '0127-i1', 'resume_ai_prompts table (admin 034 / 0127)', 'INFO',
       case when to_regclass('public.resume_ai_prompts') is null then 'absent'
            else 'present, ' || (xpath('/row/n/text()', query_to_xml(
                   'select count(*) as n from public.resume_ai_prompts', false, true, '')))[1]::text || ' row(s)' end
union all
select '0127-i2', 'resume_share_reports table (admin 035 / 0127)', 'INFO',
       case when to_regclass('public.resume_share_reports') is null then 'absent' else 'present' end
union all
select '0127-i3', 'report_shared_resume(text,text) (admin 035 / 0127)', 'INFO',
       case when to_regprocedure('public.report_shared_resume(text,text)') is null then 'absent'
            when has_function_privilege('anon', 'public.report_shared_resume(text,text)'::regprocedure, 'execute')
              then 'present, anon may execute' else 'present, anon may NOT execute' end
union all
select '0127-i4', 'admin write policies on resume_ai_prompts / resume_shares / resume_share_reports', 'INFO',
       coalesce((select string_agg(tablename || '.' || policyname || ' [' || cmd || ', '
                   || case when coalesce(qual, '') || coalesce(with_check, '') like '%has_permission%' then 'permission-matrix'
                           when coalesce(qual, '') || coalesce(with_check, '') like '%is_admin%' then 'BROAD is_admin'
                           else 'other' end || ']', '; ' order by tablename, policyname)
                   from pg_policies
                  where schemaname = 'public' and cmd <> 'SELECT'
                    and tablename in ('resume_ai_prompts', 'resume_shares', 'resume_share_reports')
                    and coalesce(qual, '') || coalesce(with_check, '') ~ '(is_admin|has_permission)'), 'none')
union all
select '0128-i1', 'migration 0128 objects', 'INFO',
       case when to_regprocedure('public._custom_project_amounts(uuid)') is not null
            then 'already applied' else 'not applied' end
order by 1;

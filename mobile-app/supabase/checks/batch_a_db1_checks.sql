-- batch_a_db1_checks.sql  -  READ-ONLY (SELECT only). Safe to paste into the Supabase SQL editor.
-- Verifies migrations mobile 0117-0119 / admin 089-091 (audit DB-03, DB-04, DB-07/ADM-01, DB-22, DB-26, DB-27, DB-28, DB-32).
-- Every row: check | expected | actual | result (PASS / FAIL / INFO).  All rows should be PASS.
-- INFO rows show current state for the owner to eyeball (bucket flags, project-files policies).

with
sec_dbA as (
  select
    -- DB-22
    (select coalesce(public, false) from storage.buckets where id = 'project-files')                               as pf_public,
    (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
        and cmd in ('SELECT','ALL') and (roles && array['public'::name,'anon'::name])
        and coalesce(qual,'') like '%project-files%' and coalesce(qual,'') not like '%is_admin%'
        and coalesce(qual,'') not like '%purchases%')                                                            as pf_public_policies,
    (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
        and policyname = 'project_files_purchaser_read')                                                          as pf_purchaser_policy,
    (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
        and policyname = 'avatars_public_read')                                                                   as avatars_public_read,
    (select count(*) from pg_policies where schemaname='public' and tablename in ('project_files','project_versions')
        and cmd='SELECT' and coalesce(qual,'') !~ '(purchases|is_admin)')                                         as pf_table_open_select
),
prot as (
  select
    (select count(*) from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_guard_columns' and not tgisinternal) as guard_trg,
    (select count(*) from pg_trigger where tgrelid = 'public.profiles'::regclass and tgname = 'profiles_guard_is_premium'
        and (tgtype & 4) = 4 and (tgtype & 16) = 16)                                                              as premium_trg_ins_upd,   -- 4 = INSERT, 16 = UPDATE
    (select count(*) from pg_proc where proname = 'is_active_user' and pronamespace = 'public'::regnamespace and prosecdef)  as is_active_fn,
    (select count(*) from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own'
        and qual like '%is_active_user%')                                                                         as profiles_upd_policy,
    -- own-row write policies still missing is_active_user (deferred payment tables + profiles insert excluded)
    (select count(*) from pg_policies
      where cmd <> 'SELECT' and schemaname in ('public','storage')
        and coalesce(qual,'') || coalesce(with_check,'') like '%auth.uid()%'
        and coalesce(qual,'') || coalesce(with_check,'') !~ '(is_admin|has_permission|current_admin_role|is_active_user)'
        and tablename not in ('profiles','purchases','premium_subscriptions','refund_requests','withdrawal_requests','wallet_transactions',
                              'wallet_topup_orders','referrals','referral_codes','referral_earnings')
        and not (tablename = 'objects' and coalesce(qual,'') || coalesce(with_check,'') !~ '(avatars|resumes|custom-project-uploads)')) as own_write_unguarded,
    (select count(*) from pg_proc where proname in ('record_legal_consent','submit_test_attempt','submit_randomized_test_attempt')
        and pronamespace='public'::regnamespace and prosrc not like '%is_active_user%')                           as rpc_unguarded
),
adm as (
  select
    (select count(*) from pg_policies where schemaname='public' and cmd in ('ALL','INSERT','UPDATE','DELETE')
        and coalesce(qual,'') || coalesce(with_check,'') like '%is_admin(auth.uid())%'
        and coalesce(qual,'') || coalesce(with_check,'') !~ 'has_permission'
        and tablename not in ('admin_notifications'))                                                             as blanket_public,
    (select count(*) from pg_policies where schemaname='storage' and tablename='objects' and cmd in ('ALL','INSERT','UPDATE','DELETE')
        and coalesce(qual,'') || coalesce(with_check,'') like '%is_admin(auth.uid())%'
        and coalesce(qual,'') || coalesce(with_check,'') !~ 'has_permission'
        and coalesce(qual,'') || coalesce(with_check,'') !~ '(admin-media|avatars)')                              as blanket_storage,
    (select count(*) from pg_policies where (coalesce(qual,'')||coalesce(with_check,'')) like '%has_permission%')  as perm_policies,
    (select count(*) from pg_proc where pronamespace='public'::regnamespace
        and proname in ('admin_adjust_wallet','admin_process_refund','admin_process_withdrawal','send_bulk_notification','custom_project_set_status')
        and prosrc not like '%require_admin_role%' and prosrc not like '%require_permission%')                    as rpc_no_guard,
    (select count(*) from pg_proc where proname in ('require_admin_role','require_permission') and pronamespace='public'::regnamespace) as guard_fns,
    (select has_function_privilege('anon','public.has_permission(uuid,text,text)','execute'))                     as anon_has_perm,
    (select has_function_privilege('authenticated','public.has_permission(uuid,text,text)','execute'))            as auth_has_perm,
    (select count(*) from pg_proc where oid in ('public.restore_resume_version(uuid)'::regprocedure,'public.compute_ats_breakdown(uuid)'::regprocedure,
        'public.match_resume_to_jd(uuid,text)'::regprocedure)
        and (proconfig is null or not exists (select 1 from unnest(proconfig) c where c like 'search_path=%')))    as invoker_no_sp,
    (select count(*) from pg_proc where proname in ('admin_adjust_wallet','admin_process_refund','admin_process_withdrawal','send_bulk_notification',
        'custom_project_set_status','log_admin_activity','academic_usage') and pronamespace='public'::regnamespace
        and has_function_privilege('anon', oid, 'execute'))                                                       as anon_admin_rpcs,
    (select count(*) from pg_proc p where pronamespace='public'::regnamespace and prorettype='trigger'::regtype
        and has_function_privilege('anon', p.oid, 'execute'))                                                     as anon_trigger_fns,
    (select count(*) from pg_proc where proname='is_admin' and pronamespace='public'::regnamespace
        and prosrc like '%_is_privileged_caller%')                                                                as is_admin_hardened
)
select * from (
  select 1 as n, 'DB-22 project-files bucket private' as check_name, 'false' as expected, (select pf_public::text from sec_dbA) as actual,
         case when (select pf_public from sec_dbA) = false then 'PASS' else 'FAIL' end as result
  union all select 2, 'DB-22 public/anon policies exposing project-files', '0', (select pf_public_policies::text from sec_dbA), case when (select pf_public_policies from sec_dbA)=0 then 'PASS' else 'FAIL' end
  union all select 3, 'DB-22 purchaser-read policy present', '1', (select pf_purchaser_policy::text from sec_dbA), case when (select pf_purchaser_policy from sec_dbA)=1 then 'PASS' else 'FAIL' end
  union all select 4, 'DB-22 project_files/project_versions rows not world-readable', '0', (select pf_table_open_select::text from sec_dbA), case when (select pf_table_open_select from sec_dbA)=0 then 'PASS' else 'FAIL' end
  union all select 5, 'DB-22 avatars_public_read (listing) removed', '0', (select avatars_public_read::text from sec_dbA), case when (select avatars_public_read from sec_dbA)=0 then 'PASS' else 'FAIL' end
  union all select 6, 'DB-03 profiles_guard_columns trigger', '1', (select guard_trg::text from prot), case when (select guard_trg from prot)=1 then 'PASS' else 'FAIL' end
  union all select 7, 'DB-32 is_premium pin on INSERT+UPDATE', '1', (select premium_trg_ins_upd::text from prot), case when (select premium_trg_ins_upd from prot)=1 then 'PASS' else 'FAIL' end
  union all select 8, 'DB-04 is_active_user() exists (security definer)', '1', (select is_active_fn::text from prot), case when (select is_active_fn from prot)=1 then 'PASS' else 'FAIL' end
  union all select 9, 'DB-04 profiles_update_own requires active user', '1', (select profiles_upd_policy::text from prot), case when (select profiles_upd_policy from prot)=1 then 'PASS' else 'FAIL' end
  union all select 10, 'DB-04 own-row write policies without is_active_user (excl. payment tables)', '0', (select own_write_unguarded::text from prot), case when (select own_write_unguarded from prot)=0 then 'PASS' else 'FAIL' end
  union all select 11, 'DB-04 user write RPCs without active check', '0', (select rpc_unguarded::text from prot), case when (select rpc_unguarded from prot)=0 then 'PASS' else 'FAIL' end
  union all select 12, 'DB-07 blanket is_admin write policies (public tables)', '0', (select blanket_public::text from adm), case when (select blanket_public from adm)=0 then 'PASS' else 'FAIL' end
  union all select 13, 'DB-07 blanket is_admin write policies (storage, excl. admin-media)', '0', (select blanket_storage::text from adm), case when (select blanket_storage from adm)=0 then 'PASS' else 'FAIL' end
  union all select 14, 'DB-07 policies using has_permission', '>= 60', (select perm_policies::text from adm), case when (select perm_policies from adm)>=60 then 'PASS' else 'FAIL' end
  union all select 15, 'DB-07 money/admin RPCs without role guard', '0', (select rpc_no_guard::text from adm), case when (select rpc_no_guard from adm)=0 then 'PASS' else 'FAIL' end
  union all select 16, 'DB-07 require_admin_role/require_permission exist', '2', (select guard_fns::text from adm), case when (select guard_fns from adm)=2 then 'PASS' else 'FAIL' end
  union all select 17, 'DB-26 anon can execute has_permission', 'false', (select anon_has_perm::text from adm), case when (select anon_has_perm from adm)=false then 'PASS' else 'FAIL' end
  union all select 18, 'DB-26 authenticated can execute has_permission', 'true', (select auth_has_perm::text from adm), case when (select auth_has_perm from adm)=true then 'PASS' else 'FAIL' end
  union all select 19, 'DB-26 is_admin(uuid) self-only hardening in place', '1', (select is_admin_hardened::text from adm), case when (select is_admin_hardened from adm)=1 then 'PASS' else 'FAIL' end
  union all select 20, 'DB-27 invoker functions without search_path', '0', (select invoker_no_sp::text from adm), case when (select invoker_no_sp from adm)=0 then 'PASS' else 'FAIL' end
  union all select 21, 'DB-28 admin RPCs executable by anon', '0', (select anon_admin_rpcs::text from adm), case when (select anon_admin_rpcs from adm)=0 then 'PASS' else 'FAIL' end
  union all select 22, 'DB-28 trigger functions executable by anon', '0', (select anon_trigger_fns::text from adm), case when (select anon_trigger_fns from adm)=0 then 'PASS' else 'FAIL' end
  -- INFO rows: current state
  union all select 30, 'INFO bucket flags (id=public/size_limit/mime)', '',
         (select string_agg(id || '=' || coalesce(public::text,'null') || '/' || coalesce(file_size_limit::text,'-') || '/' || coalesce(array_to_string(allowed_mime_types, '|'),'-'), '; ' order by id) from storage.buckets), 'INFO'
  union all select 31, 'INFO storage policies on project-files', '',
         (select coalesce(string_agg(policyname || ' [' || cmd || ' ' || array_to_string(roles, ',') || ']', '; ' order by policyname), '(none)')
            from pg_policies where schemaname='storage' and tablename='objects' and (coalesce(qual,'') || coalesce(with_check,'')) like '%project-files%'), 'INFO'
  union all select 32, 'INFO non-payment admin write policies still without has_permission (should be admin_notifications only)', '',
         (select coalesce(string_agg(tablename || '.' || policyname, ', '), '(none)') from pg_policies
           where schemaname='public' and cmd in ('ALL','INSERT','UPDATE','DELETE')
             and coalesce(qual,'') || coalesce(with_check,'') like '%is_admin(auth.uid())%'
             and coalesce(qual,'') || coalesce(with_check,'') !~ 'has_permission'), 'INFO'
) t order by n;

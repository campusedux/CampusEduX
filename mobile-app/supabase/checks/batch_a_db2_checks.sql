-- ============================================================================
-- batch_a_db2_checks.sql  --  READ-ONLY (SELECT only). Paste into the Supabase SQL editor.
-- Verifies migrations 0120/092, 0121/093, 0122/094 (+ website 0002_contact_limiter_hardening)
-- landed. One row per check; the `result` column is PASS / FAIL / INFO.
-- Sort/scan for FAIL. (INFO rows are owner to-dos, not failures.)
-- ============================================================================
with
fn as (
  select
    to_regprocedure('public.coding_problem_run_cases(text,text)')   as cpr2,
    to_regprocedure('public.coding_problem_run_cases(text)')        as cpr1,
    to_regprocedure('public.practice_problem_run_cases(text,text)') as ppr2,
    to_regprocedure('public.practice_problem_run_cases(text)')      as ppr1,
    to_regprocedure('public._coding_problem_run_cases_impl(text)')  as cpi,
    to_regprocedure('public._practice_problem_run_cases_impl(text)') as ppi,
    to_regprocedure('public.admin_dsa_problem_secrets(text[])')     as adm,
    to_regprocedure('public._check_app_secret(text,text)')          as chk,
    to_regprocedure('public.regrant_dsa_problems_client_columns()') as regrant,
    to_regprocedure('public.record_coding_submission(text,text,text,text,text,text,integer,integer,integer,integer)') as rec,
    to_regprocedure('public._can_view_solution(text)')              as cvs,
    to_regprocedure('public.coding_problem_detail(text,text)')      as cpd,
    to_regprocedure('public.practice_problem_detail(text,text)')    as ppd,
    to_regprocedure('public.prep_notes_public_list(text,integer,integer)') as pnl,
    to_regprocedure('public.prep_note_get(uuid)')                   as png,
    to_regprocedure('public.my_wishlist()')                         as mwl,
    to_regprocedure('public.referral_leaderboard(text)')            as lb,
    to_regprocedure('public.rl_hit(text,integer,integer)')          as rl,
    to_regprocedure('public.ai_budget_take(text,integer)')          as ai,
    to_regprocedure('public.practice_test_questions(text,text)')    as ptq,
    to_regprocedure('public.link_referral_on_signup()')             as lnk,
    to_regprocedure('public.ensure_referral_code()')                as ens,
    to_regprocedure('public.submit_contact_message(text,text,text,text)') as scm,
    to_regprocedure('public._contact_hit(text,integer,integer)')    as chit
),
checks(item, chk, ok, detail) as (
  -- ---------------- DB-05
  select 'DB-05', 'app_secrets exists with RLS on and no policies',
         coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.app_secrets')), false)
         and not exists (select 1 from pg_policies where schemaname='public' and tablename='app_secrets'), null
  union all select 'DB-05', 'anon/authenticated have no privileges on app_secrets',
         to_regclass('public.app_secrets') is not null
         and not has_table_privilege('anon', 'public.app_secrets', 'select')
         and not has_table_privilege('authenticated', 'public.app_secrets', 'select'), null
  union all select 'DB-05', '_check_app_secret exists and is not executable by anon/authenticated',
         (select chk from fn) is not null
         and not has_function_privilege('anon', (select chk from fn), 'execute')
         and not has_function_privilege('authenticated', (select chk from fn), 'execute'), null
  union all select 'DB-05', 'run_cases new (slug, secret) signatures exist and are callable by anon',
         (select cpr2 from fn) is not null and (select ppr2 from fn) is not null
         and has_function_privilege('anon', (select cpr2 from fn), 'execute')
         and has_function_privilege('anon', (select ppr2 from fn), 'execute'), null
  union all select 'DB-05', 'old one-argument run_cases signatures are gone',
         (select cpr1 from fn) is null and (select ppr1 from fn) is null, null
  union all select 'DB-05', 'internal _impl functions are not executable by anon/authenticated',
         (select cpi from fn) is not null and (select ppi from fn) is not null
         and not has_function_privilege('anon', (select cpi from fn), 'execute')
         and not has_function_privilege('authenticated', (select cpi from fn), 'execute')
         and not has_function_privilege('anon', (select ppi from fn), 'execute')
         and not has_function_privilege('authenticated', (select ppi from fn), 'execute'), null
  union all select 'DB-05', 'anon cannot select dsa_problems.test_cases / solution_code',
         not has_column_privilege('anon', 'public.dsa_problems', 'test_cases', 'select')
         and not has_column_privilege('anon', 'public.dsa_problems', 'solution_code', 'select'), null
  union all select 'DB-05', 'authenticated cannot select dsa_problems.test_cases / solution_code',
         not has_column_privilege('authenticated', 'public.dsa_problems', 'test_cases', 'select')
         and not has_column_privilege('authenticated', 'public.dsa_problems', 'solution_code', 'select'), null
  union all select 'DB-05', 'anon/authenticated can still select safe columns (id, slug, examples)',
         has_column_privilege('anon', 'public.dsa_problems', 'id', 'select')
         and has_column_privilege('anon', 'public.dsa_problems', 'slug', 'select')
         and has_column_privilege('authenticated', 'public.dsa_problems', 'examples', 'select'), null
  union all select 'DB-05', 'dsa_problems: every non-secret column selectable by anon AND authenticated (grant coverage)',
         not exists (select 1 from pg_attribute a cross join (values ('anon'),('authenticated')) r(role_name)
                      where a.attrelid='public.dsa_problems'::regclass and a.attnum>0 and not a.attisdropped
                        and a.attname not in ('test_cases','solution_code')
                        and not has_column_privilege(r.role_name,'public.dsa_problems',a.attname,'select')),
         'if FAIL: a column was added after 0120; run  select public.regrant_dsa_problems_client_columns();'
  union all select 'DB-05', 'regrant_dsa_problems_client_columns() exists and is not executable by anon/authenticated',
         (select regrant from fn) is not null
         and not has_function_privilege('anon', (select regrant from fn), 'execute')
         and not has_function_privilege('authenticated', (select regrant from fn), 'execute'), null
  union all select 'DB-05b', 'problem_detail RPCs gate solution_code on submission (_can_view_solution) and expose solution_locked',
         (select cpd from fn) is not null and (select ppd from fn) is not null and (select cvs from fn) is not null
         and pg_get_functiondef((select cpd from fn)) like '%_can_view_solution%' and pg_get_functiondef((select cpd from fn)) like '%solution_locked%'
         and pg_get_functiondef((select ppd from fn)) like '%_can_view_solution%' and pg_get_functiondef((select ppd from fn)) like '%solution_locked%'
         and not has_function_privilege('anon', (select cvs from fn), 'execute')
         and not has_function_privilege('authenticated', (select cvs from fn), 'execute'), null
  union all select 'DB-05b', 'coding_submissions: no client INSERT policy/privilege; record_coding_submission is authenticated-only',
         not exists (select 1 from pg_policies where schemaname='public' and tablename='coding_submissions' and cmd in ('INSERT','ALL') and 'authenticated' = any (roles::text[])
                       and policyname not like '%admin%')
         and not has_table_privilege('authenticated', 'public.coding_submissions', 'insert')
         and (select rec from fn) is not null
         and has_function_privilege('authenticated', (select rec from fn), 'execute')
         and not has_function_privilege('anon', (select rec from fn), 'execute'), null
  union all select 'DB-05', 'admin_dsa_problem_secrets exists; anon cannot execute; authenticated can',
         (select adm from fn) is not null
         and not has_function_privilege('anon', (select adm from fn), 'execute')
         and has_function_privilege('authenticated', (select adm from fn), 'execute'), null
  -- ---------------- DB-10 / DB-11
  union all select 'DB-10', 'practice_test_questions is premium-aware (definition mentions premium gate)',
         (select ptq from fn) is not null
         and pg_get_functiondef((select ptq from fn)) like '%v_priv%'
         and pg_get_functiondef((select ptq from fn)) like '%is_premium%', null
  union all select 'DB-11', 'prep_notes anon policy excludes premium',
         exists (select 1 from pg_policies where schemaname='public' and tablename='prep_notes'
                   and policyname='prep_notes_select_anon' and qual like '%is_premium%'), null
  union all select 'DB-11', 'prep_notes authenticated policy gates premium',
         exists (select 1 from pg_policies where schemaname='public' and tablename='prep_notes'
                   and policyname='prep_notes_select_published' and qual like '%is_premium%'
                   and qual like '%current_user_is_premium%'), null
  union all select 'DB-11', 'prep_notes locked-list RPCs exist (anon + authenticated may call)',
         (select pnl from fn) is not null and (select png from fn) is not null
         and has_function_privilege('anon', (select pnl from fn), 'execute')
         and has_function_privilege('anon', (select png from fn), 'execute')
         and pg_get_functiondef((select pnl from fn)) like '%locked%', null
  -- ---------------- DB-13
  union all select 'DB-13', 'jobs: no select policy is USING (true); old policies gone',
         not exists (select 1 from pg_policies where schemaname='public' and tablename='jobs' and cmd='SELECT' and qual='true')
         and not exists (select 1 from pg_policies where schemaname='public' and tablename='jobs' and policyname in ('jobs_select_public','jobs_select_anon')), null
  union all select 'DB-13', 'jobs: visible-* policies filter drafts',
         (select count(*) from pg_policies where schemaname='public' and tablename='jobs'
            and policyname in ('jobs_select_visible_anon','jobs_select_visible_authenticated') and qual like '%draft%') = 2, null
  union all select 'DB-13', 'projects: no select policy is USING (true); old policies gone',
         not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and cmd='SELECT' and qual='true')
         and not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname in ('projects_select_public','projects_select_anon')), null
  union all select 'DB-13', 'projects: visible-* policies check published; authenticated keeps purchased but NOT wishlisted (no draft leak)',
         exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='projects_select_visible_anon' and qual like '%published%')
         and exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='projects_select_visible_authenticated'
                       and qual like '%purchases%' and qual not like '%wishlists%'), null
  union all select 'DB-13', 'my_wishlist() exists; authenticated only',
         (select mwl from fn) is not null
         and has_function_privilege('authenticated', (select mwl from fn), 'execute')
         and not has_function_privilege('anon', (select mwl from fn), 'execute'), null
  union all select 'DB-13', 'admin can still see every jobs/projects row (admin_all, or 0119 split admin_select)',
         (select count(*) from pg_policies where schemaname='public' and tablename in ('jobs','projects')
            and policyname in ('jobs_admin_all','projects_admin_all','jobs_admin_select','projects_admin_select')) >= 2, null
  -- ---------------- DB-17
  union all select 'DB-17', 'resume_shares insert/update policies require owning the resume',
         (select count(*) from pg_policies where schemaname='public' and tablename='resume_shares'
            and policyname in ('resume_shares_insert_own','resume_shares_update_own') and with_check like '%resumes_builder%') = 2, null
  union all select 'DB-17', 'resume_shares pin trigger exists',
         exists (select 1 from pg_trigger where tgrelid='public.resume_shares'::regclass and tgname='resume_shares_pin_server_fields' and not tgisinternal), null
  union all select 'DB-17', 'resume_shares.token default is random bytes',
         (select pg_get_expr(adbin, adrelid) from pg_attrdef where adrelid='public.resume_shares'::regclass
            and adnum=(select attnum from pg_attribute where attrelid='public.resume_shares'::regclass and attname='token')) like '%gen_random_bytes%', null
  -- ---------------- DB-08 (non-payment) / DB-15 / DB-38
  union all select 'DB-08a', 'reward_settings.reward_on_signup is false',
         (select not reward_on_signup from public.reward_settings where id=1), null
  union all select 'DB-08a', 'signup trigger no longer pays rewards (uses norm helpers, no referral_reward_for)',
         (select lnk from fn) is not null
         and pg_get_functiondef((select lnk from fn)) not like '%referral_reward_for%'
         and pg_get_functiondef((select lnk from fn)) like '%referral_norm_email%', null
  union all select 'DB-08b', 'reward_settings.max_referrals_per_day exists',
         exists (select 1 from information_schema.columns where table_schema='public' and table_name='reward_settings' and column_name='max_referrals_per_day'), null
  union all select 'DB-08c', 'self-referral checks include mobile',
         (select lnk from fn) is not null and pg_get_functiondef((select lnk from fn)) like '%referral_norm_mobile%', null
  union all select 'DB-38', 'ensure_referral_code uses random bytes',
         (select ens from fn) is not null and pg_get_functiondef((select ens from fn)) like '%gen_random_bytes%', null
  union all select 'DB-15', 'referrals_select_successful policy dropped; involved-only policy remains',
         not exists (select 1 from pg_policies where schemaname='public' and tablename='referrals' and policyname='referrals_select_successful')
         and exists (select 1 from pg_policies where schemaname='public' and tablename='referrals' and policyname='referrals_select_involved'), null
  union all select 'DB-15', 'referral_leaderboard exists; authenticated only',
         (select lb from fn) is not null
         and has_function_privilege('authenticated', (select lb from fn), 'execute')
         and not has_function_privilege('anon', (select lb from fn), 'execute'), null
  -- ---------------- 0122 rate limit / AI budget
  union all select 'RL', 'rl_hit / ai_budget_take exist; authenticated yes, anon no',
         (select rl from fn) is not null and (select ai from fn) is not null
         and has_function_privilege('authenticated', (select rl from fn), 'execute')
         and has_function_privilege('authenticated', (select ai from fn), 'execute')
         and not has_function_privilege('anon', (select rl from fn), 'execute')
         and not has_function_privilege('anon', (select ai from fn), 'execute'), null
  union all select 'RL', 'counter tables: RLS on, no policies, no client privileges',
         coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.rate_limit_hits')), false)
         and coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.ai_budget_usage')), false)
         and not exists (select 1 from pg_policies where schemaname='public' and tablename in ('rate_limit_hits','ai_budget_usage'))
         and not has_table_privilege('authenticated', 'public.rate_limit_hits', 'select')
         and not has_table_privilege('authenticated', 'public.ai_budget_usage', 'select'), null
  -- ---------------- DB-20 (website 0002)
  union all select 'DB-20', 'submit_contact_message uses the hardened limiter (website 0002 applied)',
         (select scm from fn) is not null and pg_get_functiondef((select scm from fn)) like '%_contact_hit%',
         'if FAIL: apply website/supabase/migrations/0002_contact_limiter_hardening.sql'
  union all select 'DB-20', '_contact_hit not executable by anon/authenticated',
         (select chit from fn) is not null
         and not has_function_privilege('anon', (select chit from fn), 'execute')
         and not has_function_privilege('authenticated', (select chit from fn), 'execute'), null
  -- ---------------- owner to-dos
  union all select 'DB-05', 'INFO: judge_rpc secret row configured (else judge routes deny everything)',
         null, case when to_regclass('public.app_secrets') is null then 'app_secrets table missing (0120 not applied)'
                    when (xpath('/row/n/text()', query_to_xml(
                           'select count(*) as n from public.app_secrets where name = ''judge_rpc'' and length(secret_hash) > 0', false, true, '')))[1]::text::int > 0
                    then 'configured' else 'NOT configured - run the owner insert from the 0120 header' end
)
select item,
       chk as "check",
       case when ok is null then 'INFO' when ok then 'PASS' else 'FAIL' end as result,
       detail
from checks
order by (case when ok is null then 2 when ok then 1 else 0 end), item, chk;

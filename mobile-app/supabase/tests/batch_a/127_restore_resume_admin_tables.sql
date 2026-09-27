-- 0127: restore resume_ai_prompts / resume_share_reports / report_shared_resume() WITHOUT re-opening
-- the broad is_admin() FOR ALL policies that 0119 split into role-matrix policies.
\set ON_ERROR_STOP on
grant insert, update, delete on storage.objects to authenticated;   -- parity with 119 (harmless here)

create or replace function public.t_can(q text) returns boolean language plpgsql as $$
declare n int;
begin
  execute q; get diagnostics n = row_count; return n > 0;
exception when insufficient_privilege then return false;
end $$;
grant execute on function public.t_can(text) to public;

-- snapshot the policy set 0119 left behind, then re-apply 0127 twice (idempotency + no policy drift)
create temp table pol_before as
  select tablename, policyname, cmd, qual, with_check from pg_policies
  where schemaname = 'public' and tablename in ('resume_ai_prompts','resume_share_reports','resume_shares');
\ir ../../migrations/0127_restore_resume_admin_tables.sql
\ir ../../migrations/0127_restore_resume_admin_tables.sql

do $$
declare
  n int; viewer uuid; editor uuid; sup uuid; stu uuid; owner uuid; rid uuid; sid uuid; tok text; ok boolean;
begin
  -- ===== structure / seed / idempotency =====
  if to_regclass('public.resume_ai_prompts') is null or to_regclass('public.resume_share_reports') is null then
    raise exception 'FAIL tables missing';
  end if;
  if (select count(*) from public.resume_ai_prompts where id in ('summary','experience','projects','skills')) <> 4 then
    raise exception 'FAIL seed rows';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.resume_ai_prompts'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.resume_share_reports'::regclass) then
    raise exception 'FAIL RLS not enabled';
  end if;
  select count(*) into n from (
    (select tablename, policyname, cmd, qual, with_check from pg_policies
       where schemaname = 'public' and tablename in ('resume_ai_prompts','resume_share_reports','resume_shares')
     except select * from pol_before)
    union all
    (select * from pol_before
     except select tablename, policyname, cmd, qual, with_check from pg_policies
       where schemaname = 'public' and tablename in ('resume_ai_prompts','resume_share_reports','resume_shares'))
  ) d;
  if n <> 0 then raise exception 'FAIL re-applying 0127 changed % policies', n; end if;

  -- no write-capable policy on these tables may rest on is_admin() alone (0119 invariant)
  select count(*) into n from pg_policies
   where schemaname = 'public' and tablename in ('resume_ai_prompts','resume_share_reports','resume_shares')
     and cmd <> 'SELECT'
     and (coalesce(qual,'') || coalesce(with_check,'')) like '%is_admin%'
     and (coalesce(qual,'') || coalesce(with_check,'')) not like '%has_permission%';
  if n <> 0 then raise exception 'FAIL % is_admin-only write policies on resume tables', n; end if;

  -- ===== admin role matrix (allowed + denied) =====
  viewer := test_make_user('viewer127@x.test');
  editor := test_make_user('editor127@x.test');
  sup    := test_make_user('super127@x.test');
  insert into public.admin_users(id,email,role,status) values
    (viewer,'viewer127@x.test','viewer','active'),
    (editor,'editor127@x.test','editor','active'),
    (sup,'super127@x.test','super_admin','active');

  perform test_as(viewer);
  if (select count(*) from public.resume_ai_prompts) = 0 then raise exception 'FAIL viewer cannot read prompts'; end if;
  if public.t_can('update public.resume_ai_prompts set max_tokens = max_tokens where id = ''summary''') then
    raise exception 'FAIL viewer updated resume_ai_prompts';
  end if;
  if public.t_can('insert into public.resume_ai_prompts(id,section,system_prompt) values (''v127'',''skills'',''x'')') then
    raise exception 'FAIL viewer inserted resume_ai_prompts';
  end if;
  perform test_reset();

  perform test_as(editor);
  ok := public.t_can('update public.resume_ai_prompts set max_tokens = max_tokens where id = ''summary''');
  perform test_reset();
  if ok is distinct from coalesce(public.has_permission(editor,'resume','edit'), false) then
    raise exception 'FAIL editor update prompts got %, matrix says %', ok, public.has_permission(editor,'resume','edit');
  end if;

  perform test_as(sup);
  if not public.t_can('update public.resume_ai_prompts set max_tokens = max_tokens where id = ''summary''') then
    raise exception 'FAIL super_admin cannot update resume_ai_prompts';
  end if;
  perform test_reset();

  -- ===== report_shared_resume(): anon path works, direct table access denied =====
  owner := test_make_user('owner127@x.test');
  stu   := test_make_user('student127@x.test');
  insert into public.resumes_builder(user_id,title) values (owner,'R') returning id into rid;
  insert into public.resume_shares(user_id,resume_id) values (owner,rid) returning id, token into sid, tok;

  perform test_as(null, 'anon');
  if public.report_shared_resume('no-such-token', 'spam') then raise exception 'FAIL forged token accepted'; end if;
  if not public.report_shared_resume(tok, 'spam') then raise exception 'FAIL valid report rejected'; end if;
  if not public.report_shared_resume(tok, 'spam again') then raise exception 'FAIL throttled repeat should return true'; end if;
  perform test_reset();
  if (select count(*) from public.resume_share_reports where share_id = sid) <> 1 then
    raise exception 'FAIL expected exactly 1 report row (throttle)';
  end if;

  perform test_as(null, 'anon');
  if public.t_can('insert into public.resume_share_reports(share_id,reason) values (''' || sid || ''',''x'')') then
    raise exception 'FAIL anon inserted report directly';
  end if;
  perform test_reset();
  perform test_as(stu);
  if public.t_can('insert into public.resume_share_reports(share_id,reason) values (''' || sid || ''',''x'')') then
    raise exception 'FAIL student inserted report directly';
  end if;
  if exists (select 1 from public.resume_share_reports) then raise exception 'FAIL student reads reports'; end if;
  perform test_reset();
  perform test_as(viewer);
  if not exists (select 1 from public.resume_share_reports) then raise exception 'FAIL viewer admin cannot read reports'; end if;
  if public.t_can('update public.resume_share_reports set status = ''resolved'' where share_id = ''' || sid || '''') then
    raise exception 'FAIL viewer resolved a report';
  end if;
  perform test_reset();
end $$;

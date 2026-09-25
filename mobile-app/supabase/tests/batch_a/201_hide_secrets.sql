-- DB-05: judge secrets hidden; run_cases secret-gated; admin still works.
\set ON_ERROR_STOP on
do $$
declare
  admin_id uuid; stu uuid; g uuid; t uuid; r jsonb; n int; ok boolean; s jsonb;
begin
  admin_id := test_make_user('adm201@x.io');
  stu      := test_make_user('stu201@x.io');
  insert into admin_users(id, email, role, status) values (admin_id,'adm201@x.io','super_admin','active')
    on conflict do nothing;

  insert into dsa_topics(id, name, kind) values ('pc1','Cat One','practice');
  insert into dsa_problems(id, topic_id, slug, title, description, examples, test_cases, solution_code)
  values ('pp1','pc1','hello-p','Hello','desc','[{"input":"1","output":"1"}]',
          '[{"input":"SECRETIN","expected":"SECRETOUT","hidden":true}]','{"python":"SECRETSOL"}');
  insert into learning_grids(name, slug) values ('G','g-one') returning id into g;
  insert into learning_topics(grid_id, title, slug) values (g,'T','t-one') returning id into t;
  insert into dsa_problems(id, learning_topic_id, slug, title, examples, test_cases, solution_code)
  values ('cp1', t, 'hello-c', 'HelloC','[{"input":"2","output":"2"}]',
          '[{"input":"CSECRETIN","expected":"CSECRETOUT"}]','{"python":"CSECRETSOL"}');

  -- no secret configured -> everything denied (fail closed)
  perform test_as(stu);
  begin perform coding_problem_run_cases('hello-c','anything'); raise exception 'FAIL: allowed w/o configured secret';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  insert into app_secrets(name, secret_hash) values ('judge_rpc', encode(extensions.digest('s3cret','sha256'),'hex'));

  -- anon + authenticated: wrong / missing / null secret denied for both RPCs
  foreach ok in array array[true,false] loop
    perform test_as(case when ok then null else stu end, case when ok then 'anon' else 'authenticated' end);
    begin perform practice_problem_run_cases('hello-p','wrong'); raise exception 'FAIL wrong secret';
    exception when insufficient_privilege then null; end;
    begin perform coding_problem_run_cases('hello-c', null); raise exception 'FAIL null secret';
    exception when insufficient_privilege then null; end;
    begin perform coding_problem_run_cases('hello-c', ''); raise exception 'FAIL empty secret';
    exception when insufficient_privilege then null; end;
    -- old one-arg forms are gone / not callable
    begin execute 'select public.practice_problem_run_cases(''hello-p'')'; raise exception 'FAIL old sig';
    exception when undefined_function or insufficient_privilege then null; end;
    begin execute 'select public._practice_problem_run_cases_impl(''hello-p'')'; raise exception 'FAIL impl callable';
    exception when insufficient_privilege then null; end;
    -- correct secret works, same return shape
    r := practice_problem_run_cases('hello-p','s3cret');
    if jsonb_array_length(r) <> 2 or r->1->>'input' <> 'SECRETIN' or (r->1->>'hidden') <> 'true' then raise exception 'FAIL practice shape %', r; end if;
    r := coding_problem_run_cases('hello-c','s3cret');
    if r->1->>'expected' <> 'CSECRETOUT' then raise exception 'FAIL coding shape %', r; end if;
    perform test_reset();
  end loop;

  -- direct table / column access
  perform test_as(null, 'anon');
  begin perform test_cases from dsa_problems; raise exception 'FAIL anon test_cases';
  exception when insufficient_privilege then null; end;
  begin perform solution_code from dsa_problems; raise exception 'FAIL anon solution_code';
  exception when insufficient_privilege then null; end;
  begin perform 1 from (select * from dsa_problems) x; raise exception 'FAIL anon select *';
  exception when insufficient_privilege then null; end;
  select count(*) into n from (select id, slug, title, examples, starter_code, is_premium from dsa_problems) x;
  if n < 2 then raise exception 'FAIL anon safe columns n=%', n; end if;
  perform test_reset();

  perform test_as(stu);
  begin perform test_cases from dsa_problems; raise exception 'FAIL auth test_cases';
  exception when insufficient_privilege then null; end;
  begin perform solution_code from dsa_problems; raise exception 'FAIL auth solution_code';
  exception when insufficient_privilege then null; end;
  -- non-admin cannot use the admin secrets RPC
  begin perform * from admin_dsa_problem_secrets(array['pp1']); raise exception 'FAIL student admin rpc';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(null,'anon');
  begin perform * from admin_dsa_problem_secrets(array['pp1']); raise exception 'FAIL anon admin rpc';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- admin: read via RPC, write columns directly
  perform test_as(admin_id);
  select test_cases into s from admin_dsa_problem_secrets(array['pp1']);
  if s->0->>'input' <> 'SECRETIN' then raise exception 'FAIL admin read %', s; end if;
  update dsa_problems set test_cases='[{"input":"NEW","expected":"X"}]', solution_code='{"java":"Z"}' where id='pp1';
  insert into dsa_problems(id, topic_id, slug, title, test_cases, solution_code) values ('pp2','pc1','hello-p2','H2','[]','{}');
  select test_cases into s from admin_dsa_problem_secrets(array['pp1']);
  if s->0->>'input' <> 'NEW' then raise exception 'FAIL admin write'; end if;
  perform test_reset();

  -- safe RPCs still return the statement (and no test_cases key)
  perform test_as(null,'anon');
  r := practice_problem_detail('hello-p');
  if r is null or (r::text like '%SECRETIN%') then raise exception 'FAIL detail leaks/null: %', r; end if;
  if (r::text like '%NEW%') then raise exception 'FAIL detail leaks new tc'; end if;
  perform test_reset();

  -- anon cannot read app_secrets
  perform test_as(null,'anon');
  begin perform * from app_secrets; raise exception 'FAIL app_secrets readable';
  exception when insufficient_privilege then null; end;
  begin perform _check_app_secret('judge_rpc','s3cret'); raise exception 'FAIL check fn callable';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(stu);
  begin perform * from app_secrets; raise exception 'FAIL app_secrets readable (auth)';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  if not _check_app_secret('judge_rpc','s3cret') or _check_app_secret('judge_rpc','x') or _check_app_secret('nope','s3cret') then
    raise exception 'FAIL _check_app_secret semantics';
  end if;
  raise notice 'DB-05 OK';
end $$;

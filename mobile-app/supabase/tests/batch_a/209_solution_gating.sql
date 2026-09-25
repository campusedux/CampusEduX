-- 7b: solution_code gated on admin / >=1 submission; submissions only via record_coding_submission (judge secret).
\set ON_ERROR_STOP on
do $$
declare
  adm uuid := test_make_user('adm209@x.io');
  a uuid := test_make_user('a209@x.io');
  b uuid := test_make_user('b209@x.io');
  g uuid; t uuid; r jsonb; sid uuid;
begin
  insert into admin_users(id,email,role,status) values (adm,'adm209@x.io','super_admin','active');
  insert into app_secrets(name, secret_hash) values ('judge_rpc', encode(extensions.digest('s3cret','sha256'),'hex'));
  insert into dsa_topics(id,name,kind) values ('pc9','Cat','practice');
  insert into dsa_problems(id,topic_id,slug,title,description,test_cases,solution_code,editorial,solution_approach)
    values ('pp9','pc9','sol-p','SolP','d','[{"input":"1","expected":"1"}]','{"python":"SECRETSOL"}','EDITORIAL','APPROACH');
  insert into dsa_problems(id,topic_id,slug,title,description,test_cases,solution_code)
    values ('pp9b','pc9','nosol-p','NoSol','d','[]','{}');
  insert into learning_grids(name,slug,status) values ('G9','g-nine','published') returning id into g;
  insert into learning_topics(grid_id,title,slug,status) values (g,'T9','t-nine','published') returning id into t;
  insert into dsa_problems(id,learning_topic_id,slug,title,description,test_cases,solution_code)
    values ('cp9',t,'sol-c','SolC','d','[]','{"python":"CSECRETSOL"}');

  -- anon / user without submission: locked
  perform test_as(null,'anon');
  r := practice_problem_detail('sol-p');
  if r->'solution_code' <> '{}'::jsonb or (r->>'solution_locked')::boolean is not true or r::text like '%SECRETSOL%' then raise exception 'FAIL anon practice %', r; end if;
  if r->>'editorial' <> 'EDITORIAL' or r->>'solution_approach' <> 'APPROACH' then raise exception 'FAIL editorial changed %', r; end if;
  perform test_reset();
  perform test_as(a);
  r := coding_problem_detail('sol-c');
  if r->'solution_code' <> '{}'::jsonb or (r->>'solution_locked')::boolean is not true then raise exception 'FAIL user coding locked %', r; end if;
  -- problem without any stored solution: nothing to unlock
  r := practice_problem_detail('nosol-p');
  if (r->>'solution_locked')::boolean is not false then raise exception 'FAIL nothing to unlock %', r; end if;
  perform test_reset();

  -- direct insert is impossible now (fake-submission unlock closed)
  perform test_as(a);
  begin
    insert into coding_submissions(user_id,problem_id,problem_slug,language,source_code,verdict) values (a,'pp9','sol-p','python','x','error');
    raise exception 'FAIL direct insert allowed';
  exception when insufficient_privilege then null; end;
  -- RPC: wrong / missing secret, bad data
  begin perform record_coding_submission('nope','pp9','sol-p','python','print(1)','accepted',1,1); raise exception 'FAIL wrong secret';
  exception when insufficient_privilege then null; end;
  begin perform record_coding_submission(null,'pp9','sol-p','python','print(1)','accepted',1,1); raise exception 'FAIL null secret';
  exception when insufficient_privilege then null; end;
  begin perform record_coding_submission('s3cret','pp9','sol-p','python','print(1)','bogus',1,1); raise exception 'FAIL bad verdict';
  exception when invalid_parameter_value then null; end;
  begin perform record_coding_submission('s3cret','pp9','sol-p','python','print(1)','accepted',5,1); raise exception 'FAIL passed>total';
  exception when invalid_parameter_value then null; end;
  begin perform record_coding_submission('s3cret','pp9','wrong-slug','python','print(1)','accepted',1,1); raise exception 'FAIL slug mismatch';
  exception when invalid_parameter_value then null; end;
  if (select count(*) from coding_submissions) <> 0 then raise exception 'FAIL rejected calls inserted rows'; end if;
  -- valid: any verdict unlocks (a wrong_answer attempt)
  sid := record_coding_submission('s3cret','pp9','SOL-P','python','print(1)','wrong_answer',0,1,12,3400);
  if sid is null or (select user_id from coding_submissions where id = sid) <> a then raise exception 'FAIL record'; end if;
  r := practice_problem_detail('sol-p');
  if r->'solution_code'->>'python' <> 'SECRETSOL' or (r->>'solution_locked')::boolean then raise exception 'FAIL unlocked %', r; end if;
  -- unlocked for THAT problem only
  r := coding_problem_detail('sol-c');
  if r->'solution_code' <> '{}'::jsonb then raise exception 'FAIL unlock leaked to other problem'; end if;
  perform test_reset();

  -- another user still locked; anon cannot call the RPC
  perform test_as(b);
  if practice_problem_detail('sol-p')->'solution_code' <> '{}'::jsonb then raise exception 'FAIL other user unlocked'; end if;
  perform test_reset();
  perform test_as(null,'anon');
  begin perform record_coding_submission('s3cret','pp9','sol-p','python','x','accepted',1,1); raise exception 'FAIL anon record';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- admin sees it without submissions; own-submission read policy unchanged
  perform test_as(adm);
  if coding_problem_detail('sol-c')->'solution_code'->>'python' <> 'CSECRETSOL' then raise exception 'FAIL admin solution'; end if;
  perform test_reset();
  perform test_as(a);
  if (select count(*) from coding_submissions) <> 1 then raise exception 'FAIL own submissions read'; end if;
  perform test_reset();
  perform test_as(b);
  if (select count(*) from coding_submissions) <> 0 then raise exception 'FAIL other submissions visible'; end if;
  perform test_reset();
  raise notice 'DB-05b OK';
end $$;

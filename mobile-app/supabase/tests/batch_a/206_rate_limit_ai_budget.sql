-- 0122: rl_hit + ai_budget_take (correctness, isolation, arg validation, privileges, concurrency).
\set ON_ERROR_STOP on
select test_make_user('u1-206@x.io') as u1 \gset
select test_make_user('u2-206@x.io') as u2 \gset
select set_config('t.u1', :'u1', false), set_config('t.u2', :'u2', false) \gset

do $$
declare u1 uuid := current_setting('t.u1')::uuid; u2 uuid := current_setting('t.u2')::uuid; r jsonb; i int;
begin
  perform test_as(u1);
  r := rl_hit('login', 3, 3600);
  if not (r->>'allowed')::bool or (r->>'remaining')::int <> 2 then raise exception 'FAIL first %', r; end if;
  perform rl_hit('login', 3, 3600); r := rl_hit('login', 3, 3600);
  if not (r->>'allowed')::bool or (r->>'remaining')::int <> 0 then raise exception 'FAIL third %', r; end if;
  r := rl_hit('login', 3, 3600);
  if (r->>'allowed')::bool or (r->>'retry_after_seconds')::int not between 1 and 3600 then raise exception 'FAIL fourth %', r; end if;
  -- another bucket unaffected
  if not (rl_hit('other', 3, 3600)->>'allowed')::bool then raise exception 'FAIL bucket isolation'; end if;
  perform test_reset();
  -- another user unaffected, and cannot touch u1's counters (key derives from auth.uid())
  perform test_as(u2);
  r := rl_hit('login', 3, 3600);
  if not (r->>'allowed')::bool or (r->>'remaining')::int <> 2 then raise exception 'FAIL user isolation %', r; end if;
  perform test_reset();
  if (select hits from rate_limit_hits where user_id = u1 and bucket='login') <> 3 then raise exception 'FAIL denied attempts must not be counted'; end if;

  -- window reset (2s aligned window, max 1): align to a window start so both calls share a window
  perform test_as(u1);
  perform pg_sleep(2 - mod(extract(epoch from clock_timestamp())::numeric, 2) + 0.05);
  r := rl_hit('w2', 1, 2); if not (r->>'allowed')::bool then raise exception 'FAIL w2 first'; end if;
  r := rl_hit('w2', 1, 2); if (r->>'allowed')::bool then raise exception 'FAIL w2 second should be denied'; end if;
  perform pg_sleep(2.1);
  if not (rl_hit('w2', 1, 2)->>'allowed')::bool then raise exception 'FAIL window did not reset'; end if;

  -- argument validation
  begin perform rl_hit('Bad Bucket!', 1, 1); raise exception 'FAIL charset'; exception when invalid_parameter_value then null; end;
  begin perform rl_hit(repeat('a',65), 1, 1); raise exception 'FAIL len'; exception when invalid_parameter_value then null; end;
  begin perform rl_hit('', 1, 1); raise exception 'FAIL empty'; exception when invalid_parameter_value then null; end;
  begin perform rl_hit(null, 1, 1); raise exception 'FAIL null bucket'; exception when invalid_parameter_value then null; end;
  begin perform rl_hit('a', 0, 1); raise exception 'FAIL max0'; exception when invalid_parameter_value then null; end;
  begin perform rl_hit('a', 10001, 1); raise exception 'FAIL max big'; exception when invalid_parameter_value then null; end;
  begin perform rl_hit('a', 1, 0); raise exception 'FAIL win0'; exception when invalid_parameter_value then null; end;
  begin perform rl_hit('a', 1, 86401); raise exception 'FAIL win big'; exception when invalid_parameter_value then null; end;
  perform rl_hit(repeat('a',64), 1, 86400);   -- boundary values OK
  perform rl_hit('ok:_.-9', 10000, 1);

  -- ai budget
  r := ai_budget_take('resume_assist', 2);
  if not (r->>'allowed')::bool or (r->>'used')::int <> 1 then raise exception 'FAIL ai1 %', r; end if;
  perform ai_budget_take('resume_assist', 2);
  r := ai_budget_take('resume_assist', 2);
  if (r->>'allowed')::bool or (r->>'used')::int <> 2 or (r->>'limit')::int <> 2 then raise exception 'FAIL ai3 %', r; end if;
  if not (ai_budget_take('coding_judge', 2)->>'allowed')::bool then raise exception 'FAIL kind isolation'; end if;
  begin perform ai_budget_take('free_tokens', 5); raise exception 'FAIL kind whitelist'; exception when invalid_parameter_value then null; end;
  begin perform ai_budget_take(null, 5); raise exception 'FAIL null kind'; exception when invalid_parameter_value then null; end;
  begin perform ai_budget_take('resume_assist', 0); raise exception 'FAIL limit 0'; exception when invalid_parameter_value then null; end;
  begin perform ai_budget_take('resume_assist', 100001); raise exception 'FAIL limit big'; exception when invalid_parameter_value then null; end;
  perform test_reset();
  perform test_as(u2);
  if not (ai_budget_take('resume_assist', 2)->>'allowed')::bool then raise exception 'FAIL ai user isolation'; end if;
  perform test_reset();
  -- new UTC day => fresh budget
  update ai_budget_usage set day = day - 1 where user_id = u1 and kind = 'resume_assist';
  perform test_as(u1);
  r := ai_budget_take('resume_assist', 2);
  if not (r->>'allowed')::bool or (r->>'used')::int <> 1 then raise exception 'FAIL new day %', r; end if;
  perform test_reset();

  -- privileges: anon cannot execute, tables closed, no client policies
  perform test_as(null, 'anon');
  begin perform rl_hit('x',1,1); raise exception 'FAIL anon rl'; exception when insufficient_privilege then null; end;
  begin perform ai_budget_take('coding_judge',1); raise exception 'FAIL anon ai'; exception when insufficient_privilege then null; end;
  begin perform 1 from rate_limit_hits; raise exception 'FAIL anon table'; exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(u1);
  begin perform 1 from rate_limit_hits; raise exception 'FAIL auth table'; exception when insufficient_privilege then null; end;
  begin perform 1 from ai_budget_usage; raise exception 'FAIL auth table 2'; exception when insufficient_privilege then null; end;
  begin delete from rate_limit_hits; raise exception 'FAIL auth delete'; exception when insufficient_privilege then null; end;
  perform test_reset();
  if exists (select 1 from pg_policies where tablename in ('rate_limit_hits','ai_budget_usage')) then raise exception 'FAIL policies exist'; end if;
  if not (select relrowsecurity from pg_class where oid='public.rate_limit_hits'::regclass) then raise exception 'FAIL rls'; end if;
  -- purge: old rows eventually removed (probabilistic; force many calls)
  insert into rate_limit_hits values (u2,'stale', now() - interval '3 days', 1);
  perform test_as(u1);
  for i in 1..600 loop perform rl_hit('purge', 10000, 1); end loop;
  perform test_reset();
  if exists (select 1 from rate_limit_hits where bucket='stale') then raise exception 'FAIL purge'; end if;
end $$;

-- concurrency: 8 parallel sessions x 25 attempts against max=50 in one shared bucket
select test_make_user('u3-206@x.io') as u3 \gset
select set_config('t.u3', :'u3', false) \gset
\setenv T_DB :DBNAME
\setenv T_U3 :u3
\! rm -f /tmp/dbb206.out; for i in 1 2 3 4 5 6 7 8; do ( psql -X -qAt -d "$T_DB" -c "select test_as('$T_U3'::uuid); select count(*) filter (where (rl_hit('burst',50,86400)->>'allowed')::bool) from generate_series(1,25)" 2>&1 | tail -1 >> /tmp/dbb206.out ) & done; wait
\set allowed `awk '{s+=$1} END{print s}' /tmp/dbb206.out`
select set_config('t.allowed', :'allowed', false) \gset
do $$
declare h int;
begin
  select hits into h from rate_limit_hits where user_id = current_setting('t.u3')::uuid and bucket = 'burst';
  if h <> 50 then raise exception 'FAIL concurrency: stored hits=% (expected exactly 50)', h; end if;
  if current_setting('t.allowed')::int <> 50 then raise exception 'FAIL concurrency: allowed responses=% (expected 50)', current_setting('t.allowed'); end if;
  raise notice 'rate limit OK (hits=%)', h;
end $$;

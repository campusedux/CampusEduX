-- Grant coverage on public.dsa_problems: every column except the two secrets is SELECTable by
-- anon + authenticated; the two secrets are not. Also proves the check can fail (adds a column in
-- this throw-away clone) and that regrant_dsa_problems_client_columns() repairs it.
\set ON_ERROR_STOP on

-- returns human readable violations; empty array = OK
create or replace function pg_temp.dsa_grant_violations() returns text[] language sql as $$
  select coalesce(array_agg(role_name || ':' || a.attname || case when a.attname in ('test_cases','solution_code') then ' (secret readable)' else ' (not readable)' end order by role_name, a.attnum), '{}')
    from pg_attribute a
   cross join (values ('anon'), ('authenticated')) r(role_name)
   where a.attrelid = 'public.dsa_problems'::regclass and a.attnum > 0 and not a.attisdropped
     and ( (a.attname in ('test_cases','solution_code') and has_column_privilege(role_name, 'public.dsa_problems', a.attname, 'select'))
        or (a.attname not in ('test_cases','solution_code') and not has_column_privilege(role_name, 'public.dsa_problems', a.attname, 'select')) );
$$;

do $$
declare v text[]; n int;
begin
  -- 1. baseline after the migrations
  v := pg_temp.dsa_grant_violations();
  if cardinality(v) > 0 then raise exception 'FAIL grant coverage: %', v; end if;
  select count(*) into n from pg_attribute where attrelid='public.dsa_problems'::regclass and attnum>0 and not attisdropped;
  if n < 10 then raise exception 'FAIL suspiciously few columns (%)', n; end if;

  -- 2. the check CAN fail: a column added later is flagged for both roles
  alter table public.dsa_problems add column zz_future_col text;
  v := pg_temp.dsa_grant_violations();
  if v is distinct from array['anon:zz_future_col (not readable)','authenticated:zz_future_col (not readable)'] then
    raise exception 'FAIL check did not flag the new column: %', v; end if;

  -- 3. ... and a leaked secret is flagged too
  perform public.regrant_dsa_problems_client_columns();
  v := pg_temp.dsa_grant_violations();
  if cardinality(v) > 0 then raise exception 'FAIL regrant did not repair: %', v; end if;
  grant select (solution_code) on public.dsa_problems to anon;
  v := pg_temp.dsa_grant_violations();
  if v is distinct from array['anon:solution_code (secret readable)'] then raise exception 'FAIL leak not flagged: %', v; end if;
  perform public.regrant_dsa_problems_client_columns();       -- also re-revokes the secret
  if cardinality(pg_temp.dsa_grant_violations()) > 0 then raise exception 'FAIL regrant left a leak'; end if;

  -- 4. regrant is not callable by clients
  perform test_as(null, 'anon');
  begin perform public.regrant_dsa_problems_client_columns(); raise exception 'FAIL anon can regrant';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(test_make_user('u208@x.io'));
  begin perform public.regrant_dsa_problems_client_columns(); raise exception 'FAIL authenticated can regrant';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- 5. end-to-end: the new column is readable by clients after regrant
  perform test_as(null, 'anon');
  perform zz_future_col from public.dsa_problems;
  perform test_reset();
  raise notice 'DSA grant coverage OK';
end $$;

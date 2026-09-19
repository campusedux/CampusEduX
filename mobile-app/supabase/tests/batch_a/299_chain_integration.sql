-- Cross-migration regression (0119 admin permissions vs 0120 content policies vs 0121 shares).
\set ON_ERROR_STOP on
do $$
begin
  -- DB-07 must survive later migrations: no blanket is_admin-only write policy on the core tables
  if exists (select 1 from pg_policies where schemaname='public' and tablename in ('jobs','projects','profiles','purchases','reviews','blog_posts')
      and cmd in ('ALL','INSERT','UPDATE','DELETE')
      and (coalesce(qual,'')||coalesce(with_check,'')) ~ 'is_admin\(auth\.uid\(\)\)'
      and (coalesce(qual,'')||coalesce(with_check,'')) !~ 'has_permission') then
    raise exception 'blanket admin write policy re-created by a later migration';
  end if;
  -- admins can still SEE draft jobs/projects
  if not exists (select 1 from pg_policies where tablename='jobs' and cmd in ('SELECT','ALL') and qual ~ 'is_admin') then raise exception 'admins lost jobs visibility'; end if;
  if not exists (select 1 from pg_policies where tablename='projects' and cmd in ('SELECT','ALL') and qual ~ 'is_admin') then raise exception 'admins lost projects visibility'; end if;
  -- DB-28: no client-executable trigger functions anywhere in public
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.prorettype='trigger'::regtype and has_function_privilege('anon', p.oid, 'execute')) then
    raise exception 'anon can execute a trigger function';
  end if;
  -- DB-03/04: every own-row write policy on user tables carries is_active_user
  if exists (select 1 from pg_policies where tablename='resume_shares' and policyname like '%\_own' and cmd in ('INSERT','UPDATE') and (coalesce(qual,'')||coalesce(with_check,'')) !~ 'is_active_user') then
    raise exception 'resume_shares write policy lacks is_active_user';
  end if;
end $$;
select 'ok' as chain_integration;

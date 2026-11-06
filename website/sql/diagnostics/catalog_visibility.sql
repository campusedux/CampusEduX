-- Read-only diagnostic. Run the whole file in the Supabase SQL editor.
-- Initial queries use the editor role; later queries enforce anonymous RLS.
-- No schema, policies, grants, or application data are changed.
begin transaction read only;

select status, count(*) as projects
from public.projects
group by status order by status;

select status,
  count(*) as jobs,
  count(*) filter (where application_deadline is null) as no_deadline,
  count(*) filter (where application_deadline >= now()) as deadline_not_passed,
  count(*) filter (where application_deadline < now()) as deadline_passed
from public.jobs
group by status order by status;

select c.relname as table_name, c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('projects', 'jobs');

select tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public' and tablename in ('projects', 'jobs')
order by tablename, policyname;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'anon';

select current_user as effective_role, auth.uid() as anonymous_user_id;

-- Raw anonymous visibility, before the website's explicit jobs filter.
select status, count(*) as anonymously_visible_projects
from public.projects group by status order by status;

select status, count(*) as anonymously_visible_jobs,
  count(*) filter (where status = 'open' and
    (application_deadline is null or application_deadline >= now())) as website_listable_jobs
from public.jobs group by status order by status;

select id, title, status
from public.projects order by id limit 100;

select id, title, status, application_deadline
from public.jobs
where status = 'open' and (application_deadline is null or application_deadline >= now())
order by id limit 100;

rollback;

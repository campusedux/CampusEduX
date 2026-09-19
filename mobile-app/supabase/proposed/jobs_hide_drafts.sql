-- PROPOSED — NOT APPLIED. Review, then run manually (copy to admin-panel/supabase/proposed/ if you keep the pair).
--
-- Goal: non-admin users (anon + authenticated) can SELECT jobs whose status <> 'draft'.
-- open / closed / expired rows stay readable, so saved/applied lists and the website's
-- "no longer accepting applications" page keep working. Admins keep full access.
--
-- Audience targeting is PRESERVED EXACTLY AS TODAY:
--   authenticated -> content_visible_to_current_user(target_type, target_course_id, target_branch_ids)
--                    (the 3-arg resolver from 0036/016), AND status <> 'draft'
--   anon          -> status <> 'draft' only. Today's jobs_select_anon is USING (true), i.e. anon
--                    already sees every audience; this keeps that and only removes drafts.
--
-- Replaces (dropped by name below):
--   jobs_select_public  (role: public = anon + authenticated; 0010 -> 0035/015 -> 0036/016 final form)
--   jobs_select_anon    (role: anon; 0041 / 017)
-- Left untouched:
--   jobs_admin_all      (FOR ALL, is_admin(auth.uid()); admin 002) — already gives admins every row incl. drafts
-- Re-created below only if missing, with the identical definition.

do $$
begin
  if to_regclass('public.jobs') is null then
    return;
  end if;

  drop policy if exists "jobs_select_public" on public.jobs;
  drop policy if exists "jobs_select_anon"   on public.jobs;
  drop policy if exists "jobs_select_visible_authenticated" on public.jobs;
  drop policy if exists "jobs_select_visible_anon"          on public.jobs;

  -- signed-in users: targeting rule unchanged + hide drafts
  create policy "jobs_select_visible_authenticated" on public.jobs
    for select to authenticated
    using (
      status <> 'draft'
      and public.content_visible_to_current_user(target_type, target_course_id, target_branch_ids)
    );

  -- anon: no targeting (as today) + hide drafts
  create policy "jobs_select_visible_anon" on public.jobs
    for select to anon
    using (status <> 'draft');

  -- admin: keep full access (normally already present from admin 002)
  if to_regprocedure('public.is_admin(uuid)') is not null
     and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'jobs' and policyname = 'jobs_admin_all') then
    create policy "jobs_admin_all" on public.jobs
      for all
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
  end if;
end $$;

notify pgrst, 'reload schema';

-- Verify after applying (as anon, then as a student, then as admin):
--   select status, count(*) from public.jobs group by 1;   -- anon/student: no 'draft' row
--   select policyname, roles, cmd from pg_policies where tablename = 'jobs' order by 1;
-- Rollback: drop the two jobs_select_visible_* policies, then re-run 0036 (jobs_select_public) and 0041 (jobs_select_anon).

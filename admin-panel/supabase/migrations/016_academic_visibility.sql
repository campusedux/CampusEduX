-- ============================================================================
-- 016_academic_visibility.sql — tighten academic content visibility to the
--                                spec's Course + Branch authorization rule.
-- ============================================================================
-- Apply after 001–015 (SQL Editor). Additive · guarded · idempotent.
--
-- Builds on:
--   * admin 009        — public.courses / public.branches / public.academic_years
--   * mobile 0031 / admin 011 — target_*_id / target_*_name columns
--   * mobile 0035 / admin 015 — target_type + target_branch_ids[], the
--     current_user_branch_id() resolver and the first content_visible_...()
--
-- 0035 shipped a branch-only safety net: 'branch' rows were hidden from other
-- branches, but 'course' rows stayed visible to EVERY student (ranked, never
-- filtered). The academic-personalization spec (§5, §13–§17, §35, §47) requires
-- a stricter rule, enforced at the database so search / category / company /
-- pagination / recommendations cannot bypass it:
--
--     GLOBAL                                     -> every student
--     COURSE  AND target_course_id = my course   -> only that course
--     BRANCH  AND my branch IN target_branch_ids -> only that course + branch
--
-- This migration:
--   * adds public.current_user_course_id()  (mirror of current_user_branch_id())
--   * replaces content_visible_to_current_user() with a 3-arg version carrying
--     the rule above; malformed targeted rows (type set, no target) fail OPEN
--     to global so content is never orphaned
--   * re-points the projects / jobs / prep_notes SELECT policies at it and drops
--     the old 2-arg function
--   * adds a BEFORE INSERT/UPDATE trigger (validate_content_targeting) so an
--     invalid Course/Branch combination is rejected server-side, not only in
--     React (spec §28)
--
-- Admins are unaffected: they read every row through the separate
-- projects_admin_all / jobs_admin_all / prep_notes_admin_all is_admin policies
-- (RLS policies are OR-combined). Existing rows are all target_type 'global'
-- after 0035's backfill, so nothing that is live today disappears.
--
-- 100 % additive · guarded · idempotent · re-runnable. Byte-identical body to
-- mobile-app/supabase/migrations/0036_academic_visibility.sql; both are guarded
-- so whichever runs first does the work.
-- ----------------------------------------------------------------------------

-- ===========================================================================
-- 1. RESOLVER — the signed-in student's catalog course id
-- ===========================================================================
-- Resolved from the free-text profiles.course (case-insensitive). NULL when the
-- student has no profile row or an unrecognised course name, in which case they
-- match no course-targeted (and no branch-targeted) content — only global.
create or replace function public.current_user_course_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.profiles pr
  join public.courses  c on lower(c.name) = lower(pr.course)
  where pr.id = auth.uid()
  limit 1;
$$;
revoke all on function public.current_user_course_id() from public;
grant execute on function public.current_user_course_id() to anon, authenticated;

-- ===========================================================================
-- 2. VISIBILITY — the spec §5 rule
-- ===========================================================================
-- global  -> everyone
-- course  -> target_course_id must equal the caller's resolved course id
-- branch  -> the caller's resolved branch id must be in target_branch_ids
--            (a branch id already encodes its course, so this also enforces the
--            course match for branch-targeted rows)
-- A targeted row with an empty target is treated as global (fail open) so a
-- content bug can never make a row invisible to everyone; the write-side
-- trigger below stops such rows being created in the first place.
create or replace function public.content_visible_to_current_user(
  p_target_type       text,
  p_target_course_id  text,
  p_target_branch_ids text[]
)
returns boolean
language sql
stable
as $$
  select case coalesce(nullif(p_target_type, ''), 'global')
    when 'global' then true
    when 'course' then
      p_target_course_id is null
      or p_target_course_id = ''
      or p_target_course_id = public.current_user_course_id()
    when 'branch' then
      p_target_branch_ids is null
      or cardinality(p_target_branch_ids) = 0
      or public.current_user_branch_id() = any (p_target_branch_ids)
    else true
  end;
$$;
revoke all on function public.content_visible_to_current_user(text, text, text[]) from public;
grant execute on function public.content_visible_to_current_user(text, text, text[]) to anon, authenticated;

-- ===========================================================================
-- 3. RLS — re-point the content SELECT policies at the 3-arg function
-- ===========================================================================
do $$
begin
  if to_regclass('public.projects') is not null then
    drop policy if exists "projects_select_public" on public.projects;
    create policy "projects_select_public" on public.projects
      for select
      using (public.content_visible_to_current_user(target_type, target_course_id, target_branch_ids));
  end if;

  if to_regclass('public.jobs') is not null then
    drop policy if exists "jobs_select_public" on public.jobs;
    create policy "jobs_select_public" on public.jobs
      for select
      using (public.content_visible_to_current_user(target_type, target_course_id, target_branch_ids));
  end if;

  if to_regclass('public.prep_notes') is not null then
    drop policy if exists "prep_notes_select_published" on public.prep_notes;
    if to_regprocedure('public.is_admin(uuid)') is not null then
      create policy "prep_notes_select_published" on public.prep_notes
        for select to authenticated
        using (
          (is_published = true
            and public.content_visible_to_current_user(target_type, target_course_id, target_branch_ids))
          or public.is_admin(auth.uid())
        );
    else
      create policy "prep_notes_select_published" on public.prep_notes
        for select to authenticated
        using (
          is_published = true
          and public.content_visible_to_current_user(target_type, target_course_id, target_branch_ids)
        );
    end if;
  end if;
end $$;

-- The old 2-arg signature is now unused (policies recreated above).
drop function if exists public.content_visible_to_current_user(text, text[]);

-- ===========================================================================
-- 4. WRITE-SIDE VALIDATION  (spec §28 — reject invalid Course/Branch combos at
--    the database, not only in the admin React form)
-- ===========================================================================
create or replace function public.validate_content_targeting()
returns trigger
language plpgsql
as $$
declare
  v_bad int;
begin
  if new.target_type = 'course' then
    if new.target_course_id is null or new.target_course_id = '' then
      raise exception 'targeting: a course-targeted % needs a target_course_id', tg_table_name
        using errcode = 'check_violation';
    end if;

  elsif new.target_type = 'branch' then
    if new.target_branch_ids is null or cardinality(new.target_branch_ids) = 0 then
      raise exception 'targeting: a branch-targeted % needs at least one branch', tg_table_name
        using errcode = 'check_violation';
    end if;

    -- Every targeted branch must belong to target_course_id. Only enforced when
    -- the catalog is present and a course was supplied (the admin resolver
    -- always supplies it for branch targeting).
    if to_regclass('public.branches') is not null
       and new.target_course_id is not null and new.target_course_id <> '' then
      select count(*) into v_bad
      from unnest(new.target_branch_ids) as bid
      left join public.branches b on b.id = bid
      where b.id is null or b.course_id is distinct from new.target_course_id;
      if v_bad > 0 then
        raise exception 'targeting: % branch(es) in % do not belong to course %',
          v_bad, tg_table_name, new.target_course_id
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  return new;
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['projects', 'jobs', 'prep_notes'] loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;
    -- needs the 0035 targeting columns
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = tbl and column_name = 'target_type'
    ) then
      continue;
    end if;

    execute format('drop trigger if exists %I on public.%I', tbl || '_validate_targeting', tbl);
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function public.validate_content_targeting()',
      tbl || '_validate_targeting', tbl);
  end loop;
end $$;

notify pgrst, 'reload schema';

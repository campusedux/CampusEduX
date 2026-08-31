-- ============================================================================
-- 0035_academic_system.sql — dynamic academic system: catalog hardening,
--                            starter catalog, Global/Course/Branch content
--                            targeting, and the branch-visibility safety net.
-- ============================================================================
-- Builds on:
--   * admin 009 — public.courses / public.branches / public.academic_years
--   * mobile 0031 / admin 011 — target_course_id/name, target_branch_id/name,
--     target_year_id/label on projects / jobs / prep_notes
--
-- 100 % additive · guarded · idempotent · re-runnable. Nothing is dropped that
-- carries data; every existing row stays visible (backfilled to target_type
-- 'global'). Profiles keep their free-text course / branch / year — no profile
-- schema change, no backfill.
--
-- The canonical copy also lives in
-- admin-panel/supabase/migrations/015_academic_system.sql (identical body, both
-- guarded — whichever runs first does the work, the other is a no-op).
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ===========================================================================
-- 1. CATALOG HARDENING  (spec §14 duplicate protection, §15 safe delete)
-- ===========================================================================
do $$
begin
  if to_regclass('public.courses') is null
     or to_regclass('public.branches') is null
     or to_regclass('public.academic_years') is null then
    raise notice '0035: courses/branches/academic_years not present yet — run admin 009 first; skipping catalog hardening.';
    return;
  end if;

  -- Case-insensitive uniqueness. Wrapped so a DB that already holds duplicates
  -- still migrates (the admin duplicate pre-check is the everyday guard).
  begin
    create unique index if not exists courses_name_ci_key on public.courses (lower(name));
  exception when unique_violation then
    raise notice '0035: courses(lower(name)) unique index skipped — resolve existing duplicates then re-run.';
  end;
  begin
    create unique index if not exists courses_code_ci_key on public.courses (lower(code)) where code <> '';
  exception when unique_violation then
    raise notice '0035: courses(lower(code)) unique index skipped — resolve existing duplicates then re-run.';
  end;
  begin
    create unique index if not exists branches_course_name_ci_key on public.branches (course_id, lower(name));
  exception when unique_violation then
    raise notice '0035: branches(course_id, lower(name)) unique index skipped — resolve existing duplicates then re-run.';
  end;
  begin
    create unique index if not exists academic_years_label_ci_key on public.academic_years (lower(label));
  exception when unique_violation then
    raise notice '0035: academic_years(lower(label)) unique index skipped — resolve existing duplicates then re-run.';
  end;

  create index if not exists branches_course_id_idx on public.branches (course_id, sort_order);

  -- branches.course_id was ON DELETE CASCADE (009) — a deleted course would
  -- silently wipe its branches. Switch to RESTRICT so the admin safe-delete
  -- check (academic_usage) is the only way through.
  if exists (select 1 from pg_constraint where conname = 'branches_course_id_fkey') then
    alter table public.branches drop constraint branches_course_id_fkey;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'branches_course_id_fkey') then
    alter table public.branches
      add constraint branches_course_id_fkey
      foreign key (course_id) references public.courses (id) on delete restrict;
  end if;
end $$;

-- ===========================================================================
-- 2. STARTER CATALOG  (spec §49 / §64 — admin dropdowns populated out of the
--    box; names match mobile-app/src/constants/options.ts so existing
--    free-text profiles resolve). Idempotent: on conflict do nothing.
-- ===========================================================================
do $$
begin
  if to_regclass('public.courses') is null then return; end if;

  insert into public.courses (id, name, code, sort_order) values
    ('btech',  'B.Tech',   'BTECH',  1),
    ('mtech',  'M.Tech',   'MTECH',  2),
    ('mba',    'MBA',      'MBA',    3),
    ('bba',    'BBA',      'BBA',    4),
    ('mca',    'MCA',      'MCA',    5),
    ('bca',    'BCA',      'BCA',    6),
    ('bsc',    'B.Sc',     'BSC',    7),
    ('bpharm', 'B.Pharm',  'BPHARM', 8),
    ('bams',   'BAMS',     'BAMS',   9)
  on conflict (id) do nothing;

  insert into public.branches (id, course_id, name, code, sort_order) values
    -- B.Tech
    ('btech-cse',    'btech', 'Computer Science Engineering',      'CSE',    1),
    ('btech-it',     'btech', 'Information Technology',            'IT',     2),
    ('btech-ece',    'btech', 'Electronics & Telecommunication',   'ECE',    3),
    ('btech-mech',   'btech', 'Mechanical Engineering',            'MECH',   4),
    ('btech-civil',  'btech', 'Civil Engineering',                 'CIVIL',  5),
    ('btech-eee',    'btech', 'Electrical Engineering',            'EEE',    6),
    ('btech-aids',   'btech', 'AI & Data Science',                 'AIDS',   7),
    -- M.Tech
    ('mtech-cse',    'mtech', 'Computer Engineering',              'CE',     1),
    ('mtech-vlsi',   'mtech', 'VLSI Design',                       'VLSI',   2),
    ('mtech-struct', 'mtech', 'Structural Engineering',            'STRUCT', 3),
    ('mtech-ml',     'mtech', 'Machine Learning',                  'ML',     4),
    -- MBA
    ('mba-fin',      'mba',   'Finance',                           'FIN',    1),
    ('mba-mkt',      'mba',   'Marketing',                         'MKT',    2),
    ('mba-hr',       'mba',   'Human Resources',                   'HR',     3),
    ('mba-ops',      'mba',   'Operations',                        'OPS',    4),
    ('mba-ba',       'mba',   'Business Analytics',                'BA',     5),
    -- BBA
    ('bba-fin',      'bba',   'Finance',                           'FIN',    1),
    ('bba-mkt',      'bba',   'Marketing',                         'MKT',    2),
    ('bba-hr',       'bba',   'Human Resources',                   'HR',     3),
    ('bba-ib',       'bba',   'International Business',             'IB',     4),
    -- MCA / BCA
    ('mca-gen',      'mca',   'General',                           'GEN',    1),
    ('bca-gen',      'bca',   'General',                           'GEN',    1),
    -- B.Sc
    ('bsc-cs',       'bsc',   'Computer Science',                  'CS',     1),
    ('bsc-math',     'bsc',   'Mathematics',                       'MATH',   2),
    ('bsc-phy',      'bsc',   'Physics',                           'PHY',    3),
    -- B.Pharm / BAMS
    ('bpharm-pharm', 'bpharm','Pharmacy',                          'PHARM',  1),
    ('bams-ayur',    'bams',  'Ayurveda',                          'AYUR',   1)
  on conflict (id) do nothing;
end $$;

-- ===========================================================================
-- 3. CONTENT TARGETING MODEL  (spec §25–§29, §41)
--    Extends 0031 / 011's target_* columns with an explicit target_type and a
--    multi-branch array. Applied to projects / jobs / prep_notes.
-- ===========================================================================
do $$
declare
  tbl text;
  v_customised boolean;
begin
  foreach tbl in array array['projects', 'jobs', 'prep_notes'] loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;

    -- 0031 / 011 columns (add here too so 0035 is self-sufficient).
    execute format('alter table public.%I add column if not exists target_course_id   text', tbl);
    execute format('alter table public.%I add column if not exists target_branch_id   text', tbl);
    execute format('alter table public.%I add column if not exists target_year_id     text', tbl);
    execute format('alter table public.%I add column if not exists target_course_name text', tbl);
    execute format('alter table public.%I add column if not exists target_branch_name text', tbl);
    execute format('alter table public.%I add column if not exists target_year_label  text', tbl);

    -- New: explicit audience type + multi-branch arrays.
    execute format($f$alter table public.%I add column if not exists target_type text not null default 'global'$f$, tbl);
    execute format($f$alter table public.%I add column if not exists target_branch_ids   text[] not null default '{}'::text[]$f$, tbl);
    execute format($f$alter table public.%I add column if not exists target_branch_names text[] not null default '{}'::text[]$f$, tbl);

    if not exists (select 1 from pg_constraint where conname = tbl || '_target_type_check') then
      execute format(
        $f$alter table public.%I add constraint %I check (target_type in ('global', 'course', 'branch'))$f$,
        tbl, tbl || '_target_type_check');
    end if;

    execute format('create index if not exists %I on public.%I using gin (target_branch_ids)', tbl || '_target_branch_ids_gin', tbl);
    execute format('create index if not exists %I on public.%I (target_type, target_course_id)', tbl || '_target_type_idx', tbl);

    -- One-time backfill from the 0031 scalar columns, only while every row is
    -- still the 'global' default so a later admin edit is never clobbered.
    execute format('select exists (select 1 from public.%I where target_type <> ''global'')', tbl)
      into v_customised;
    if v_customised then
      continue;
    end if;

    execute format($f$
      update public.%I
         set target_type          = 'branch',
             target_branch_ids    = array[target_branch_id],
             target_branch_names  = array[coalesce(target_branch_name, '')]
       where target_branch_id is not null and target_branch_id <> ''
    $f$, tbl);

    execute format($f$
      update public.%I
         set target_type = 'course'
       where target_type = 'global'
         and target_course_id is not null and target_course_id <> ''
         and (target_branch_id is null or target_branch_id = '')
    $f$, tbl);
  end loop;
end $$;

-- ===========================================================================
-- 4. RESOLVER + VISIBILITY + USAGE FUNCTIONS
-- ===========================================================================

-- The signed-in student's catalog branch id, resolved from the free-text
-- profiles.course / profiles.branch (case-insensitive, branch scoped to the
-- resolved course). NULL when the student has no profile / an unrecognised
-- value — in which case they simply match no branch-targeted content.
create or replace function public.current_user_branch_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.profiles pr
  join public.courses  c on lower(c.name) = lower(pr.course)
  join public.branches b on b.course_id = c.id and lower(b.name) = lower(pr.branch)
  where pr.id = auth.uid()
  limit 1;
$$;
revoke all on function public.current_user_branch_id() from public;
grant execute on function public.current_user_branch_id() to anon, authenticated;

-- Whether a content row is readable by the caller. global / course rows are
-- always visible (course rows are still ranked up for the matching course
-- client-side). A branch row is visible only when the caller's resolved
-- branch is in its target set. Admins read everything through the separate
-- *_admin_rw / prep_notes_admin_all policies (RLS policies are OR-combined).
create or replace function public.content_visible_to_current_user(
  p_target_type       text,
  p_target_branch_ids text[]
)
returns boolean
language sql
stable
as $$
  select
    coalesce(p_target_type, 'global') <> 'branch'
    or p_target_branch_ids is null
    or cardinality(p_target_branch_ids) = 0
    or public.current_user_branch_id() = any (p_target_branch_ids);
$$;
revoke all on function public.content_visible_to_current_user(text, text[]) from public;
grant execute on function public.content_visible_to_current_user(text, text[]) to anon, authenticated;

-- Reference counts for the admin "safe delete" check (spec §15). Returns only
-- aggregate numbers; gated to admins where is_admin() is available.
create or replace function public.academic_usage(p_kind text, p_id text)
returns table (branches int, students int, projects int, jobs int, prep_notes int)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    if not (select public.is_admin(auth.uid())) then
      raise exception 'academic_usage: caller is not an admin';
    end if;
  end if;

  if p_kind = 'course' then
    return query select
      (select count(*)::int from public.branches where course_id = p_id),
      (select count(*)::int from public.profiles pr
         join public.courses c on lower(c.name) = lower(pr.course) where c.id = p_id),
      (select count(*)::int from public.projects   where target_course_id = p_id),
      (select count(*)::int from public.jobs       where target_course_id = p_id),
      (select count(*)::int from public.prep_notes where target_course_id = p_id);
  elsif p_kind = 'branch' then
    return query select
      0,
      (select count(*)::int from public.profiles pr
         join public.courses  c on lower(c.name) = lower(pr.course)
         join public.branches b on b.course_id = c.id and lower(b.name) = lower(pr.branch)
        where b.id = p_id),
      (select count(*)::int from public.projects   where target_branch_id = p_id or target_branch_ids @> array[p_id]),
      (select count(*)::int from public.jobs       where target_branch_id = p_id or target_branch_ids @> array[p_id]),
      (select count(*)::int from public.prep_notes where target_branch_id = p_id or target_branch_ids @> array[p_id]);
  elsif p_kind = 'year' then
    return query select
      0,
      (select count(*)::int from public.profiles pr
         join public.academic_years y on lower(y.label) = lower(pr.year) where y.id = p_id),
      (select count(*)::int from public.projects   where target_year_id = p_id),
      (select count(*)::int from public.jobs       where target_year_id = p_id),
      (select count(*)::int from public.prep_notes where target_year_id = p_id);
  else
    return query select 0, 0, 0, 0, 0;
  end if;
end;
$$;
revoke all on function public.academic_usage(text, text) from public;
grant execute on function public.academic_usage(text, text) to authenticated;

-- ===========================================================================
-- 5. RLS — branch safety net on the content tables. global / course rows keep
--    behaving exactly as before; only another branch's branch-specific rows
--    become unreadable. Existing rows are all 'global' after the backfill.
-- ===========================================================================
do $$
begin
  if to_regclass('public.projects') is not null then
    drop policy if exists "projects_select_public" on public.projects;
    create policy "projects_select_public" on public.projects
      for select
      using (public.content_visible_to_current_user(target_type, target_branch_ids));
  end if;

  if to_regclass('public.jobs') is not null then
    drop policy if exists "jobs_select_public" on public.jobs;
    create policy "jobs_select_public" on public.jobs
      for select
      using (public.content_visible_to_current_user(target_type, target_branch_ids));
  end if;

  if to_regclass('public.prep_notes') is not null then
    drop policy if exists "prep_notes_select_published" on public.prep_notes;
    if to_regprocedure('public.is_admin(uuid)') is not null then
      create policy "prep_notes_select_published" on public.prep_notes
        for select to authenticated
        using (
          (is_published = true
            and public.content_visible_to_current_user(target_type, target_branch_ids))
          or public.is_admin(auth.uid())
        );
    else
      create policy "prep_notes_select_published" on public.prep_notes
        for select to authenticated
        using (
          is_published = true
          and public.content_visible_to_current_user(target_type, target_branch_ids)
        );
    end if;
  end if;
end $$;

notify pgrst, 'reload schema';

-- Optional academic targeting on content (projects / jobs / prep_notes).
--
-- The mobile Home page prioritises study material, projects and jobs that match
-- the signed-in student's profiles.course / branch / year. It reads these
-- columns via `select("*")` and ranks client-side (src/lib/personalization.ts):
--   target_branch_name → matched against profiles.branch
--   target_course_name → matched against profiles.course
--   target_year_label  → matched against profiles.year
-- A row with all target_* columns NULL is global content and is always shown as
-- the fallback — no Home section is ever left empty (spec §8, §27, §28).
--
-- The canonical definition (with FKs into courses/branches/academic_years and
-- the admin write path) lives in
-- admin-panel/supabase/migrations/011_academic_content_targeting.sql. This block
-- is a guarded fallback so a mobile-only database still works; whichever
-- migration runs first adds the columns, the other is a no-op.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

do $$
declare
  tbl text;
  has_academic boolean := to_regclass('public.courses') is not null
                      and to_regclass('public.branches') is not null
                      and to_regclass('public.academic_years') is not null;
begin
  foreach tbl in array array['projects', 'jobs', 'prep_notes'] loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;

    execute format('alter table public.%I add column if not exists target_course_id   text', tbl);
    execute format('alter table public.%I add column if not exists target_branch_id   text', tbl);
    execute format('alter table public.%I add column if not exists target_year_id     text', tbl);
    execute format('alter table public.%I add column if not exists target_course_name text', tbl);
    execute format('alter table public.%I add column if not exists target_branch_name text', tbl);
    execute format('alter table public.%I add column if not exists target_year_label  text', tbl);

    execute format('create index if not exists %I on public.%I (target_branch_name)', tbl || '_target_branch_idx', tbl);
    execute format('create index if not exists %I on public.%I (target_course_name)', tbl || '_target_course_idx', tbl);

    if has_academic then
      if not exists (select 1 from pg_constraint where conname = tbl || '_target_course_fk') then
        execute format(
          'alter table public.%I add constraint %I foreign key (target_course_id) references public.courses (id) on delete set null',
          tbl, tbl || '_target_course_fk');
      end if;
      if not exists (select 1 from pg_constraint where conname = tbl || '_target_branch_fk') then
        execute format(
          'alter table public.%I add constraint %I foreign key (target_branch_id) references public.branches (id) on delete set null',
          tbl, tbl || '_target_branch_fk');
      end if;
      if not exists (select 1 from pg_constraint where conname = tbl || '_target_year_fk') then
        execute format(
          'alter table public.%I add constraint %I foreign key (target_year_id) references public.academic_years (id) on delete set null',
          tbl, tbl || '_target_year_fk');
      end if;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';

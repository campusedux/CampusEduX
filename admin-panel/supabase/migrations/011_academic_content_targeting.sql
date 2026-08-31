-- ============================================================================
-- 011_academic_content_targeting.sql — optional academic targeting on content
-- ============================================================================
-- Apply after 001–010 (SQL Editor). Additive + guarded + re-runnable.
--
-- Lets an admin optionally tie a project / job / study note to a Course,
-- Branch and/or Year so the mobile Home page can prioritise relevant content
-- for each student. EVERY column is nullable — a row with all three null is
-- "global" content and keeps behaving exactly as today. No existing row is
-- touched, no RLS changes, the mobile app works with or without this migration.
--
-- Two representations are stored side by side:
--   * *_id      → FK into courses / branches / academic_years (integrity,
--                 admin dropdowns, future ID-based matching)
--   * *_name    → the plain label, matched by the mobile app against the
--                 student's existing free-text profiles.course/branch/year
-- The admin server actions write both.
-- ----------------------------------------------------------------------------

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

    -- Name columns drive the mobile priority ladder — index them.
    execute format('create index if not exists %I on public.%I (target_branch_name)', tbl || '_target_branch_idx', tbl);
    execute format('create index if not exists %I on public.%I (target_course_name)', tbl || '_target_course_idx', tbl);

    -- FKs only when the academic catalog tables exist (they do once 009 ran).
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

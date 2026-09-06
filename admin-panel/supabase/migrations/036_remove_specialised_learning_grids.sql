-- admin-panel/supabase/migrations/036_remove_specialised_learning_grids.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0064_remove_specialised_learning_grids.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — remove the five specialised default Learning grids
-- (mobile 0064_remove_specialised_learning_grids.sql == admin 036_remove_specialised_learning_grids.sql
--  below this header — byte-identical, guarded, idempotent, additive-safe.)
-- ============================================================================
-- WHAT / WHY
--   Migration 0044/021 seeded five "typed" grids — Aptitude, DSA / Coding,
--   Mock Test, HR Interview, Company Specific (source_kind='default_grid',
--   grid_type in aptitude/dsa/mock_test/hr/company) — as the specialised-grid
--   subsystem. That subsystem is being retired: the website TypedGridView, the
--   mobile placement practice suite and the admin "Placement (legacy)" grid
--   cards are removed in the same change. This migration removes the DATA:
--
--     * the 5 learning_grids rows and everything hanging off them
--       (learning_sections / learning_topics / learning_contents /
--        learning_bookmarks / learning_grid_companies) — INCLUDING any content
--       an admin built inside them.
--     * the learning_migration_map rows 0044/021 wrote for that backfill.
--     * tightens learning_grids.grid_type CHECK to ('content','custom').
--
--   The legacy practice TABLES themselves (practice_tests, test_questions,
--   dsa_topics, dsa_problems, hr_questions, live_tests, test_attempts,
--   user_dsa_progress, user_favorite_questions) are LEFT INTACT — they still
--   back topic-specific practice (migration 0048/025) and historical attempts.
--   Their learning_grid_id / learning_topic_id back-links to the removed grids
--   fall to NULL automatically (those FKs are ON DELETE SET NULL).
--
-- SAFETY
--   Guarded with to_regclass, ordered child-first, fully idempotent — a second
--   run finds nothing to do. The companion edit in 0044/021 stops its seed
--   block from re-creating the grids on a lone re-run.
-- ----------------------------------------------------------------------------

do $$
declare
  v_ids uuid[];
begin
  if to_regclass('public.learning_grids') is null then
    raise notice '036/0064: learning_grids absent — nothing to do.';
    return;
  end if;

  select array_agg(id) into v_ids
  from public.learning_grids
  where source_kind = 'default_grid'
     or lower(slug) in ('aptitude','dsa-coding','mock-test','hr-interview','company-specific');

  if v_ids is null or cardinality(v_ids) = 0 then
    raise notice '036/0064: no specialised default grids present — already removed.';
  else
    -- child-first: contents + bookmarks -> topics -> company links -> sections -> grids
    delete from public.learning_contents
     where topic_id in (select id from public.learning_topics where grid_id = any(v_ids));

    if to_regclass('public.learning_bookmarks') is not null then
      delete from public.learning_bookmarks
       where topic_id in (select id from public.learning_topics where grid_id = any(v_ids));
    end if;

    delete from public.learning_topics where grid_id = any(v_ids);

    if to_regclass('public.learning_grid_companies') is not null then
      delete from public.learning_grid_companies where grid_id = any(v_ids);
    end if;

    delete from public.learning_sections where grid_id = any(v_ids);
    delete from public.learning_grids    where id = any(v_ids);

    raise notice '036/0064: removed % specialised default grid(s) and their sub-tree.', cardinality(v_ids);
  end if;

  -- drop the backfill audit rows 0044/021 wrote for these grids
  if to_regclass('public.learning_migration_map') is not null then
    delete from public.learning_migration_map
     where entity in ('aptitude_topic','dsa_topic','mock_category','hr_category','company_link');
  end if;

  -- tighten the grid_type domain to the two generic tree types
  update public.learning_grids set grid_type = 'content'
   where grid_type is null or grid_type not in ('content','custom');

  if exists (
    select 1 from pg_constraint
    where conname = 'learning_grids_grid_type_check'
      and conrelid = 'public.learning_grids'::regclass
  ) then
    alter table public.learning_grids drop constraint learning_grids_grid_type_check;
  end if;
  alter table public.learning_grids
    add constraint learning_grids_grid_type_check check (grid_type in ('content','custom'));
end $$;

-- ---- validation (raises, never silently passes) -------------------------
do $$
declare
  v_left int;
  v_bad  int;
begin
  select count(*) into v_left from public.learning_grids where source_kind = 'default_grid';
  if v_left <> 0 then
    raise exception '036/0064: % default_grid row(s) still present after removal', v_left;
  end if;
  select count(*) into v_bad from public.learning_grids where grid_type not in ('content','custom');
  if v_bad <> 0 then
    raise exception '036/0064: % learning_grids row(s) with a disallowed grid_type', v_bad;
  end if;
  raise notice '036/0064 OK: specialised grids gone, grid_type domain = {content,custom}.';
end $$;

notify pgrst, 'reload schema';

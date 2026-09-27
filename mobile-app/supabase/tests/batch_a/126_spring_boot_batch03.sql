-- 0126/098: Spring Boot Tutorial batch 03 (Starters, Auto Configuration, Running, DevTools).
--   * lands exactly once and stays hidden with the course (anon + student denied, incl. direct table reads)
--   * re-applying never undoes an admin's premium / draft / visibility changes
--   * once the grid and its tests are switched on, anon can read every batch 03 topic, block and MCQ
--   * its rollback removes only batch 03 (batches 01-02, the section, the grid and other courses stay), twice is safe
--   * re-applying afterwards restores it completely
--   * guards: batch 03 refuses to run without the batch 01 grid, and batch 01 refuses a same-slug grid it
--     did not create
\ir ../../migrations/0126_seed_spring_boot_tutorial_batch03.sql
\ir ../../migrations/0126_seed_spring_boot_tutorial_batch03.sql

create temp table sb_b3 (slug text primary key);
-- every other batch (the chain now holds the whole course) must survive this batch's rollback
create temp table sb_all as select count(*)::int as n from public.learning_topics where source_kind = 'spring_boot_tutorial';
insert into sb_b3 values ('spring-boot-starters'), ('auto-configuration'),
  ('running-a-spring-boot-application'), ('spring-boot-devtools');
grant select on sb_b3 to anon, authenticated;

-- fingerprint of every Learning / test row that is NOT this course, to prove the rollback leaves it alone
create temp table sb_other as
select md5(string_agg(x, '|' order by x)) as fp from (
  select 's' || s.id || s.name || s.updated_at as x from public.learning_sections s join public.learning_grids g on g.id = s.grid_id where g.slug <> 'spring-boot-tutorial'
  union all select 't' || t.id || t.title || t.updated_at from public.learning_topics t where t.source_kind is distinct from 'spring_boot_tutorial'
  union all select 'c' || c.id || md5(c.body) || c.updated_at from public.learning_contents c where c.metadata ->> 'source' is distinct from 'spring_boot_seed'
  union all select 'p' || p.id || p.updated_at from public.practice_tests p where p.id not like 'pt-sb-%'
  union all select 'q' || q.id || q.question_text from public.test_questions q where q.test_id not like 'pt-sb-%'
) z;

do $$
declare n int; s text; u uuid; j jsonb;
begin
  u := test_make_user('sb3@x.test', '{"full_name":"Student SB3"}');

  select count(*) into n from public.learning_topics where source_kind = 'spring_boot_tutorial' and slug in (select slug from sb_b3);
  if n <> 4 then raise exception 'expected 4 batch 03 topics after re-apply, found %', n; end if;
  select count(*) into n from public.learning_topics t join public.learning_sections s on s.id = t.section_id
   where t.slug in (select slug from sb_b3) and s.slug = 'getting-started';
  if n <> 4 then raise exception 'batch 03 topics must sit in the getting-started section, found %', n; end if;
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where c.metadata ->> 'source' = 'spring_boot_seed' and c.metadata ->> 'block' = 'lesson' and t.slug in (select slug from sb_b3);
  if n <> 4 then raise exception 'expected 4 lesson blocks, found %', n; end if;
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where c.metadata ->> 'source' = 'spring_boot_seed' and c.metadata ->> 'block' = 'practice' and t.slug in (select slug from sb_b3);
  if n <> 4 then raise exception 'expected 4 practice blocks, found %', n; end if;
  select count(*) into n from public.test_questions where test_id in (select 'pt-sb-' || slug from sb_b3);
  if n <> 20 then raise exception 'expected 20 MCQs, found %', n; end if;
  if exists (select 1 from public.practice_tests where id in (select 'pt-sb-' || slug from sb_b3) and (show_on_website or show_on_mobile)) then
    raise exception 'batch 03 tests must copy the hidden grid flags';
  end if;

  -- ===== DENIED while hidden: anon and a signed-in student, RPCs and direct table reads =====
  foreach s in array (select array_agg(slug) from sb_b3) loop
    perform test_as(null, 'anon');
    if public.learning_topic_content('spring-boot-tutorial', s, 'website') is not null then raise exception 'anon: % content visible', s; end if;
    if public.mock_test_detail('pt-sb-' || s, 'website') is not null then raise exception 'anon: % test visible', s; end if;
    j := public.learning_topic_practice('spring-boot-tutorial', s, 'website');
    if coalesce(jsonb_array_length(j -> 'mock_tests'), 0) <> 0 then raise exception 'anon: % practice listed', s; end if;
    if exists (select 1 from public.test_questions where test_id = 'pt-sb-' || s)
       or exists (select 1 from public.practice_tests where id = 'pt-sb-' || s)
       or exists (select 1 from public.learning_topics where slug = s and source_kind = 'spring_boot_tutorial') then
      raise exception 'anon: % rows readable from tables', s; end if;
    perform test_reset();
    perform test_as(u);
    if public.learning_topic_content('spring-boot-tutorial', s, 'mobile') is not null then raise exception 'student: % content visible', s; end if;
    if exists (select 1 from public.test_questions where test_id = 'pt-sb-' || s) then raise exception 'student: % MCQs readable', s; end if;
    perform test_reset();
  end loop;

  -- ===== admin changes that a re-apply must keep =====
  update public.learning_topics set is_premium = true, status = 'draft', show_on_mobile = false where slug = 'spring-boot-devtools';
  update public.practice_tests set is_premium = true, status = 'archived' where id = 'pt-sb-auto-configuration';
  update public.learning_grids set show_on_website = true where slug = 'spring-boot-tutorial';
end $$;

\ir ../../migrations/0126_seed_spring_boot_tutorial_batch03.sql

do $$
begin
  if not exists (select 1 from public.learning_topics where slug = 'spring-boot-devtools'
                  and is_premium and status = 'draft' and not show_on_mobile) then
    raise exception 're-apply undid the admin premium / draft / visibility change on a topic';
  end if;
  if not exists (select 1 from public.practice_tests where id = 'pt-sb-auto-configuration' and is_premium and status = 'archived') then
    raise exception 're-apply undid the admin change on a mock test';
  end if;
  if not exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial' and show_on_website and not show_on_mobile) then
    raise exception 're-apply changed the grid visibility';
  end if;
  -- put the seed state back for the next checks
  update public.learning_topics set is_premium = false, status = 'published', show_on_mobile = true where slug = 'spring-boot-devtools';
  update public.practice_tests set is_premium = false, status = 'published' where id = 'pt-sb-auto-configuration';
  update public.learning_grids set show_on_website = false where slug = 'spring-boot-tutorial';
end $$;

-- ===== ALLOWED: grid and tests switched on (what the later "make visible" step does) =====
do $$
declare s text; n int; j jsonb; blocks int;
begin
  update public.learning_grids set show_on_website = true, show_on_mobile = true where slug = 'spring-boot-tutorial';
  update public.practice_tests set show_on_website = true, show_on_mobile = true where id like 'pt-sb-%';
  perform test_as(null, 'anon');
  foreach s in array (select array_agg(slug) from sb_b3) loop
    j := public.learning_topic_content('spring-boot-tutorial', s, 'website');
    blocks := 2;
    if j is null or jsonb_array_length(j -> 'contents') <> blocks or (j ->> 'locked')::boolean then
      raise exception 'anon: visible topic % should return % unlocked block(s)', s, blocks; end if;
    if public.mock_test_detail('pt-sb-' || s, 'website') is null then raise exception 'anon: visible test % missing', s; end if;
    select count(*) into n from public.test_questions where test_id = 'pt-sb-' || s;
    if n <> 5 then raise exception 'anon: expected 5 readable MCQs for %, got %', s, n; end if;
  end loop;
  perform test_reset();
  update public.learning_grids set show_on_website = false, show_on_mobile = false where slug = 'spring-boot-tutorial';
  update public.practice_tests set show_on_website = false, show_on_mobile = false where id like 'pt-sb-%';
end $$;

-- ===== batch 03 rollback, twice: only batch 03 goes =====
\ir ../../rollbacks/0126_seed_spring_boot_tutorial_batch03_rollback.sql
\ir ../../rollbacks/0126_seed_spring_boot_tutorial_batch03_rollback.sql
do $$
declare n int; fp text;
begin
  select count(*) into n from public.learning_topics where source_kind = 'spring_boot_tutorial' and slug in (select slug from sb_b3);
  if n <> 0 then raise exception 'after batch 03 rollback expected no batch 03 topics, found %', n; end if;
  if not exists (select 1 from public.learning_topics where source_kind = 'spring_boot_tutorial' and slug = 'what-is-spring-boot') then
    raise exception 'batch 03 rollback removed the batch 01 topic'; end if;
  if (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial') <> 91 then
    raise exception 'batch 03 rollback must keep the other 91 topics of the full 95-topic course'; end if;
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where t.slug = 'what-is-spring-boot' and c.metadata ->> 'source' = 'spring_boot_seed';
  if n <> 2 then raise exception 'batch 01 content damaged by batch 03 rollback, found % blocks', n; end if;
  if not exists (select 1 from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
                  where g.slug = 'spring-boot-tutorial' and s.slug = 'getting-started') then
    raise exception 'batch 03 rollback removed the getting-started section that batches 01-02 still use';
  end if;
  if exists (select 1 from public.practice_tests where id in (select 'pt-sb-' || slug from sb_b3)) then
    raise exception 'batch 03 tests left behind';
  end if;
  if (select count(*) from public.test_questions where test_id = 'pt-sb-what-is-spring-boot') <> 5 then
    raise exception 'batch 01 MCQs damaged';
  end if;
  select md5(string_agg(x, '|' order by x)) into fp from (
    select 's' || s.id || s.name || s.updated_at as x from public.learning_sections s join public.learning_grids g on g.id = s.grid_id where g.slug <> 'spring-boot-tutorial'
    union all select 't' || t.id || t.title || t.updated_at from public.learning_topics t where t.source_kind is distinct from 'spring_boot_tutorial'
    union all select 'c' || c.id || md5(c.body) || c.updated_at from public.learning_contents c where c.metadata ->> 'source' is distinct from 'spring_boot_seed'
    union all select 'p' || p.id || p.updated_at from public.practice_tests p where p.id not like 'pt-sb-%'
    union all select 'q' || q.id || q.question_text from public.test_questions q where q.test_id not like 'pt-sb-%'
  ) z;
  if fp is distinct from (select sb_other.fp from sb_other) then raise exception 'rollback changed rows of other courses'; end if;
end $$;

-- ===== re-apply restores batch 03 completely =====
\ir ../../migrations/0126_seed_spring_boot_tutorial_batch03.sql
do $$
begin
  if (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial' and slug in (select slug from sb_b3)) <> 4
     or (select count(*) from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
          where c.metadata ->> 'source' = 'spring_boot_seed' and t.slug in (select slug from sb_b3)) <> 8
     or (select count(*) from public.practice_tests where id in (select 'pt-sb-' || slug from sb_b3)) <> 4
     or (select count(*) from public.test_questions where test_id in (select 'pt-sb-' || slug from sb_b3)) <> 20 then
    raise exception 're-apply after rollback did not restore 4 topics / 8 blocks / 4 tests / 20 MCQs';
  end if;
end $$;

-- ===== guard: batch 03 without the batch 01 grid raises and writes nothing =====
\ir ../../rollbacks/0124_seed_spring_boot_tutorial_batch01_rollback.sql
\set ON_ERROR_STOP off
\ir ../../migrations/0126_seed_spring_boot_tutorial_batch03.sql
\set ON_ERROR_STOP on
do $$
begin
  if exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial')
     or exists (select 1 from public.learning_topics where source_kind = 'spring_boot_tutorial')
     or exists (select 1 from public.practice_tests where id like 'pt-sb-%') then
    raise exception 'batch 03 wrote rows although the batch 01 grid was missing';
  end if;
end $$;

-- ===== guard: batch 01 refuses a same-slug grid it did not create =====
insert into public.learning_grids (name, slug, status, show_on_website, show_on_mobile)
values ('Someone else''s Spring course', 'spring-boot-tutorial', 'published', true, true);
\set ON_ERROR_STOP off
\ir ../../migrations/0124_seed_spring_boot_tutorial_batch01.sql
\set ON_ERROR_STOP on
do $$
begin
  if not exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial'
                  and name = 'Someone else''s Spring course' and source_kind is null and show_on_website) then
    raise exception 'batch 01 changed a grid it did not create';
  end if;
  if exists (select 1 from public.learning_sections s join public.learning_grids g on g.id = s.grid_id where g.slug = 'spring-boot-tutorial')
     or exists (select 1 from public.learning_topics where source_kind = 'spring_boot_tutorial') then
    raise exception 'batch 01 added rows under a grid it did not create';
  end if;
end $$;

-- 0141/112: Spring Boot Tutorial batch 12 (6 topics: unit-testing-with-junit-5 ... testcontainers-basics).
--   * lands exactly once and stays hidden with the course (anon + student denied, incl. direct table reads)
--   * re-applying never undoes an admin's premium / draft / visibility changes
--   * once the grid and its tests are switched on, anon can read every batch 12 topic, block and MCQ
--   * its rollback removes only batch 12 (other batches, other courses stay), twice is safe
--   * re-applying afterwards restores it completely
--   * guard: batch 12 refuses to run without the batch 01 grid
\ir ../../migrations/0141_seed_spring_boot_tutorial_batch12.sql
\ir ../../migrations/0141_seed_spring_boot_tutorial_batch12.sql

create temp table sb_bn (slug text primary key, blocks int, mcqs int);
insert into sb_bn values
  ('unit-testing-with-junit-5', 2, 5),
  ('mockito-in-spring-boot', 2, 5),
  ('spring-boot-test', 2, 5),
  ('web-mvc-test-and-mockmvc', 2, 5),
  ('data-jpa-test', 2, 5),
  ('testcontainers-basics', 2, 5);
grant select on sb_bn to anon, authenticated;

-- whole-course fingerprint of counts and of every row that is NOT this course
create temp table sb_pre as
select (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial') as topics,
       (select count(*) from public.learning_contents where metadata ->> 'source' = 'spring_boot_seed') as blocks,
       (select count(*) from public.practice_tests where id like 'pt-sb-%') as tests,
       (select count(*) from public.test_questions where test_id like 'pt-sb-%') as mcqs;
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
  u := test_make_user('sb12@x.test', '{"full_name":"Student SB12"}');

  select count(*) into n from public.learning_topics where source_kind = 'spring_boot_tutorial' and slug in (select slug from sb_bn);
  if n <> 6 then raise exception 'expected 6 batch 12 topics after re-apply, found %', n; end if;
  select count(*) into n from public.learning_topics t join public.learning_sections s on s.id = t.section_id
   where t.slug in (select slug from sb_bn) and s.slug in ('testing');
  if n <> 6 then raise exception 'batch 12 topics must sit in their group sections, found %', n; end if;
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where c.metadata ->> 'source' = 'spring_boot_seed' and c.metadata ->> 'block' = 'lesson' and t.slug in (select slug from sb_bn);
  if n <> 6 then raise exception 'expected 6 lesson blocks, found %', n; end if;
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where c.metadata ->> 'source' = 'spring_boot_seed' and c.metadata ->> 'block' = 'practice' and t.slug in (select slug from sb_bn);
  if n <> 6 then raise exception 'expected 6 practice blocks, found %', n; end if;
  select count(*) into n from public.test_questions where test_id in (select 'pt-sb-' || slug from sb_bn);
  if n <> 30 then raise exception 'expected 30 MCQs, found %', n; end if;
  if exists (select 1 from public.practice_tests where id in (select 'pt-sb-' || slug from sb_bn) and (show_on_website or show_on_mobile)) then
    raise exception 'batch 12 tests must copy the hidden grid flags';
  end if;

  -- ===== DENIED while hidden: anon and a signed-in student, RPCs and direct table reads =====
  foreach s in array (select array_agg(slug) from sb_bn) loop
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
  update public.learning_topics set is_premium = true, status = 'draft', show_on_mobile = false where slug = 'testcontainers-basics';
  update public.practice_tests set is_premium = true, status = 'archived' where id = 'pt-sb-unit-testing-with-junit-5';
  update public.learning_grids set show_on_website = true where slug = 'spring-boot-tutorial';
end $$;

\ir ../../migrations/0141_seed_spring_boot_tutorial_batch12.sql

do $$
begin
  if not exists (select 1 from public.learning_topics where slug = 'testcontainers-basics'
                  and is_premium and status = 'draft' and not show_on_mobile) then
    raise exception 're-apply undid the admin premium / draft / visibility change on a topic';
  end if;
  if not exists (select 1 from public.practice_tests where id = 'pt-sb-unit-testing-with-junit-5' and is_premium and status = 'archived') then
    raise exception 're-apply undid the admin change on a mock test';
  end if;
  if not exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial' and show_on_website and not show_on_mobile) then
    raise exception 're-apply changed the grid visibility';
  end if;
  -- put the seed state back for the next checks
  update public.learning_topics set is_premium = false, status = 'published', show_on_mobile = true where slug = 'testcontainers-basics';
  update public.practice_tests set is_premium = false, status = 'published' where id = 'pt-sb-unit-testing-with-junit-5';
  update public.learning_grids set show_on_website = false where slug = 'spring-boot-tutorial';
end $$;

-- ===== ALLOWED: grid and tests switched on (what the later "make visible" step does) =====
do $$
declare s text; n int; j jsonb; b int; q int;
begin
  update public.learning_grids set show_on_website = true, show_on_mobile = true where slug = 'spring-boot-tutorial';
  update public.practice_tests set show_on_website = true, show_on_mobile = true where id like 'pt-sb-%';
  perform test_as(null, 'anon');
  for s, b, q in select slug, blocks, mcqs from sb_bn loop
    j := public.learning_topic_content('spring-boot-tutorial', s, 'website');
    if j is null or jsonb_array_length(j -> 'contents') <> b or (j ->> 'locked')::boolean then
      raise exception 'anon: visible topic % should return % unlocked block(s)', s, b; end if;
    if public.mock_test_detail('pt-sb-' || s, 'website') is null then raise exception 'anon: visible test % missing', s; end if;
    select count(*) into n from public.test_questions where test_id = 'pt-sb-' || s;
    if n <> q then raise exception 'anon: expected % readable MCQs for %, got %', q, s, n; end if;
  end loop;
  perform test_reset();
  update public.learning_grids set show_on_website = false, show_on_mobile = false where slug = 'spring-boot-tutorial';
  update public.practice_tests set show_on_website = false, show_on_mobile = false where id like 'pt-sb-%';
end $$;

-- ===== batch 12 rollback, twice: only batch 12 goes =====
\ir ../../rollbacks/0141_seed_spring_boot_tutorial_batch12_rollback.sql
\ir ../../rollbacks/0141_seed_spring_boot_tutorial_batch12_rollback.sql
do $$
declare n int; fp text;
begin
  select count(*) into n from public.learning_topics where source_kind = 'spring_boot_tutorial' and slug in (select slug from sb_bn);
  if n <> 0 then raise exception 'after batch 12 rollback expected no batch 12 topics, found %', n; end if;
  if (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial') <> (select topics - 6 from sb_pre) then
    raise exception 'batch 12 rollback must keep every topic of the other batches'; end if;
  if (select count(*) from public.learning_contents where metadata ->> 'source' = 'spring_boot_seed') <> (select blocks - 12 from sb_pre) then
    raise exception 'batch 12 rollback damaged content blocks of other batches'; end if;
  if (select count(*) from public.practice_tests where id like 'pt-sb-%') <> (select tests - 6 from sb_pre)
     or (select count(*) from public.test_questions where test_id like 'pt-sb-%') <> (select mcqs - 30 from sb_pre) then
    raise exception 'batch 12 rollback damaged tests or MCQs of other batches'; end if;
  if not exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial') then
    raise exception 'batch 12 rollback removed the grid'; end if;
  if not exists (select 1 from public.learning_topics where source_kind = 'spring_boot_tutorial' and slug = 'what-is-spring-boot') then
    raise exception 'batch 12 rollback removed the batch 01 topic'; end if;
  if exists (select 1 from public.practice_tests where id in (select 'pt-sb-' || slug from sb_bn)) then
    raise exception 'batch 12 tests left behind';
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

-- ===== re-apply restores batch 12 completely =====
\ir ../../migrations/0141_seed_spring_boot_tutorial_batch12.sql
do $$
begin
  if (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial') <> (select topics from sb_pre)
     or (select count(*) from public.learning_contents where metadata ->> 'source' = 'spring_boot_seed') <> (select blocks from sb_pre)
     or (select count(*) from public.practice_tests where id like 'pt-sb-%') <> (select tests from sb_pre)
     or (select count(*) from public.test_questions where test_id like 'pt-sb-%') <> (select mcqs from sb_pre) then
    raise exception 're-apply after rollback did not restore the whole course';
  end if;
end $$;

-- ===== guard: batch 12 without the batch 01 grid raises and writes nothing =====
\ir ../../rollbacks/0130_seed_spring_boot_tutorial_batch01_rollback.sql
\set ON_ERROR_STOP off
\ir ../../migrations/0141_seed_spring_boot_tutorial_batch12.sql
\set ON_ERROR_STOP on
do $$
begin
  if exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial')
     or exists (select 1 from public.learning_topics where source_kind = 'spring_boot_tutorial')
     or exists (select 1 from public.practice_tests where id like 'pt-sb-%') then
    raise exception 'batch 12 wrote rows although the batch 01 grid was missing';
  end if;
end $$;

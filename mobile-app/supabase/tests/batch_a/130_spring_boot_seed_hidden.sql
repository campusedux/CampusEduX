-- 0130/101: the Spring Boot Tutorial seed lands hidden. While the grid is hidden, anon and a signed-in
-- student see nothing of it through any Learning RPC or table (course, topic, content, mock test,
-- MCQs, sitemap, search). Once the grid AND its tests are switched on, the same actors see it all.
-- Also: applying the seed again is a no-op, and the batch 01 rollback removes the course completely
-- and is safe to run twice.
\ir ../../migrations/0130_seed_spring_boot_tutorial_batch01.sql
\ir ../../migrations/0130_seed_spring_boot_tutorial_batch01.sql
do $$
declare u uuid; who text; n int; j jsonb;
begin
  u := test_make_user('sb@x.test', '{"full_name":"Student SB"}');

  -- exactly one copy of everything after two applies (template already applied it once too)
  select count(*) into n from public.learning_topics where source_kind = 'spring_boot_tutorial' and source_ref = 'getting-started/what-is-spring-boot';
  if n <> 1 then raise exception 'expected 1 topic after re-apply, found %', n; end if;
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where c.metadata ->> 'source' = 'spring_boot_seed' and t.source_ref = 'getting-started/what-is-spring-boot';
  if n <> 2 then raise exception 'expected 2 content blocks after re-apply, found %', n; end if;
  select count(*) into n from public.test_questions where test_id = 'pt-sb-what-is-spring-boot';
  if n <> 5 then raise exception 'expected 5 MCQs after re-apply, found %', n; end if;
  if exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial' and (show_on_website or show_on_mobile)) then
    raise exception 'grid must be created hidden';
  end if;
  if exists (select 1 from public.practice_tests where id = 'pt-sb-what-is-spring-boot' and (show_on_website or show_on_mobile)) then
    raise exception 'mock test must inherit the hidden grid flags';
  end if;

  -- ===== DENIED: hidden course, as anon and as a signed-in student =====
  foreach who in array array['anon', 'authenticated'] loop
    if who = 'anon' then perform test_as(null, 'anon'); else perform test_as(u); end if;
    if exists (select 1 from public.learning_grids_list('website') g where g.slug = 'spring-boot-tutorial')
       or exists (select 1 from public.learning_grids_list('mobile') g where g.slug = 'spring-boot-tutorial') then
      raise exception '%: hidden grid listed', who; end if;
    if public.learning_tree('spring-boot-tutorial', 'website') is not null then raise exception '%: hidden tree returned', who; end if;
    if public.learning_topic_content('spring-boot-tutorial', 'what-is-spring-boot', 'website') is not null
       or public.learning_topic_content('spring-boot-tutorial', 'what-is-spring-boot', 'mobile') is not null then
      raise exception '%: hidden topic content returned', who; end if;
    j := public.learning_topic_practice('spring-boot-tutorial', 'what-is-spring-boot', 'website');
    if coalesce(jsonb_array_length(j -> 'mock_tests'), 0) <> 0 then raise exception '%: hidden topic practice listed', who; end if;
    if public.mock_test_detail('pt-sb-what-is-spring-boot', 'website') is not null then raise exception '%: hidden mock test detail', who; end if;
    if exists (select 1 from public.learning_sitemap('website') s where s.grid_slug = 'spring-boot-tutorial') then
      raise exception '%: hidden course in sitemap', who; end if;
    if exists (select 1 from public.learning_search('spring boot', 'website', 50) s where s.grid_slug = 'spring-boot-tutorial') then
      raise exception '%: hidden course in search', who; end if;
    if exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial')
       or exists (select 1 from public.learning_topics where source_kind = 'spring_boot_tutorial')
       or exists (select 1 from public.learning_contents where metadata ->> 'source' = 'spring_boot_seed')
       or exists (select 1 from public.practice_tests where id = 'pt-sb-what-is-spring-boot')
       or exists (select 1 from public.test_questions where test_id = 'pt-sb-what-is-spring-boot') then
      raise exception '%: hidden course rows readable from tables', who; end if;
    perform test_reset();
  end loop;

  -- ===== ALLOWED: switch the grid and its tests on (what the later "make visible" step does) =====
  update public.learning_grids set show_on_website = true, show_on_mobile = true where slug = 'spring-boot-tutorial';
  update public.practice_tests set show_on_website = true, show_on_mobile = true where id like 'pt-sb-%';
  foreach who in array array['anon', 'authenticated'] loop
    if who = 'anon' then perform test_as(null, 'anon'); else perform test_as(u); end if;
    if not exists (select 1 from public.learning_grids_list('website') g where g.slug = 'spring-boot-tutorial') then
      raise exception '%: visible grid not listed', who; end if;
    j := public.learning_topic_content('spring-boot-tutorial', 'what-is-spring-boot', 'website');
    if j is null or jsonb_array_length(j -> 'contents') <> 2 or (j ->> 'locked')::boolean then
      raise exception '%: visible topic should return 2 unlocked blocks, got %', who, j; end if;
    j := public.learning_topic_practice('spring-boot-tutorial', 'what-is-spring-boot', 'website');
    if jsonb_array_length(j -> 'mock_tests') <> 1 then raise exception '%: visible mock test not listed', who; end if;
    if public.mock_test_detail('pt-sb-what-is-spring-boot', 'website') is null then raise exception '%: visible mock test detail missing', who; end if;
    select count(*) into n from public.test_questions where test_id = 'pt-sb-what-is-spring-boot';
    if n <> 5 then raise exception '%: expected 5 readable MCQs, got %', who, n; end if;
    if not exists (select 1 from public.learning_sitemap('website') s where s.grid_slug = 'spring-boot-tutorial' and s.topic_slug = 'what-is-spring-boot') then
      raise exception '%: visible topic missing from sitemap', who; end if;
    perform test_reset();
  end loop;
end $$;

-- ===== rollback: removes the whole course, twice in a row is safe =====
\ir ../../rollbacks/0130_seed_spring_boot_tutorial_batch01_rollback.sql
\ir ../../rollbacks/0130_seed_spring_boot_tutorial_batch01_rollback.sql
do $$
begin
  if exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial')
     or exists (select 1 from public.learning_sections s where not exists (select 1 from public.learning_grids g where g.id = s.grid_id))
     or exists (select 1 from public.learning_topics where source_kind = 'spring_boot_tutorial')
     or exists (select 1 from public.learning_contents where metadata ->> 'source' = 'spring_boot_seed')
     or exists (select 1 from public.practice_tests where id like 'pt-sb-%')
     or exists (select 1 from public.test_questions where id like 'tq-sb-%') then
    raise exception 'rollback left Spring Boot rows behind';
  end if;
  if not exists (select 1 from public.learning_grids where slug = 'java-tutorial') then
    raise exception 'rollback touched another course';
  end if;
end $$;

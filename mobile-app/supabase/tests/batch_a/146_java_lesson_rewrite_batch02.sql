-- 0146/117: Java Tutorials lesson rewrite batch 02 (20 existing topics, bodies rewritten in place).
--   * re-applying is a no-op and never changes a topic id, slug, title, section, order or publish state
--   * an admin's draft / premium change survives a re-apply, and a draft topic stays DENIED to anon
--   * anon can read every rewritten lesson, the new Practice Problems block and the new test
--   * a student cannot write lesson content or MCQs (RLS denies it)
--   * the rollback restores the original 0047 text, removes only what batch 02 added (batch 01 stays), twice is safe
\ir ../../migrations/0146_java_lesson_rewrite_batch02.sql
\ir ../../migrations/0146_java_lesson_rewrite_batch02.sql

create temp table jr_b2 (slug text primary key);
insert into jr_b2 values ('linkedlist'), ('hashset'), ('treemap'), ('treeset'), ('iterator'),
  ('comparable'), ('comparator'), ('generics'), ('wrapper-classes'), ('enum'),
  ('access-modifiers'), ('encapsulation'), ('final-keyword'), ('super-keyword'), ('stringbuilder'),
  ('string-pool'), ('synchronization'), ('executor-framework'), ('garbage-collection'), ('jdbc');
grant select on jr_b2 to anon, authenticated;

-- fingerprint of every Learning / test row batch 02 must not touch (batch 01 included)
create temp table jr_other2 as
select md5(string_agg(x, '|' order by x)) as fp from (
  select 't' || t.id || t.title || t.short_description || t.updated_at as x from public.learning_topics t
   where not (t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b2))
  union all select 'c' || c.id || md5(c.body) || c.updated_at from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where not (t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b2))
  union all select 'p' || p.id || p.title || p.updated_at from public.practice_tests p where p.id not in (select 'pt-java-' || slug from jr_b2)
  union all select 'q' || q.id || q.question_text from public.test_questions q where q.test_id not in (select 'pt-java-' || slug from jr_b2)
) z;

create temp table jr_ident2 as
select t.id, t.slug, t.title, t.section_id, t.sort_order, t.status, t.is_premium, t.show_on_website, t.show_on_mobile
from public.learning_topics t where t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b2);

do $$
declare n int;
begin
  if (select count(*) from jr_ident2) <> 20 then raise exception 'expected 20 batch 02 topics, found %', (select count(*) from jr_ident2); end if;
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b2) and c.metadata ->> 'source' = 'java_tutorial_seed'
     and length(c.body) > 7000 and c.body not like '## 1. What %' and c.body like '%## Interview Questions%';
  if n <> 20 then raise exception 'expected 20 rewritten lesson bodies, found %', n; end if;
  select count(*) into n from public.learning_topics t where t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b2)
   and length(t.short_description) between 140 and 155;
  if n <> 20 then raise exception 'expected 20 new 140-155 char descriptions, found %', n; end if;
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where t.slug in (select slug from jr_b2) and c.metadata ->> 'source' = 'java_practice_seed' and c.metadata ->> 'origin' = 'java_lesson_rewrite'
     and c.heading = 'Practice Problems' and c.sort_order = 1;
  if n <> 20 then raise exception 'expected 20 new practice blocks, found %', n; end if;
  select count(*) into n from public.test_questions where test_id in (select 'pt-java-' || slug from jr_b2);
  if n <> 200 then raise exception 'expected 200 MCQs, found %', n; end if;
  select count(*) into n from public.practice_tests p join public.learning_topics t on t.id = p.learning_topic_id
   where p.id = 'pt-java-' || t.slug and t.slug in (select slug from jr_b2) and p.status = 'published' and p.question_count = 10;
  if n <> 20 then raise exception 'expected 20 linked published tests, found %', n; end if;

  update public.learning_topics set status = 'draft' where source_kind = 'java_tutorial' and slug = 'jdbc';
  update public.learning_topics set is_premium = true where source_kind = 'java_tutorial' and slug = 'generics';
end $$;

\ir ../../migrations/0146_java_lesson_rewrite_batch02.sql

do $$
declare n int; s text; j jsonb; u uuid;
begin
  if not exists (select 1 from public.learning_topics where source_kind = 'java_tutorial' and slug = 'jdbc' and status = 'draft')
     or not exists (select 1 from public.learning_topics where source_kind = 'java_tutorial' and slug = 'generics' and is_premium) then
    raise exception 're-apply undid an admin draft / premium change'; end if;
  select count(*) into n from jr_ident2 i join public.learning_topics t on t.id = i.id
   where (t.slug, t.title, t.section_id, t.sort_order, t.show_on_website, t.show_on_mobile)
       = (i.slug, i.title, i.section_id, i.sort_order, i.show_on_website, i.show_on_mobile);
  if n <> 20 then raise exception 'topic identity changed on % topic(s)', 20 - n; end if;

  -- ===== DENIED: a draft topic stays hidden from anon =====
  perform test_as(null, 'anon');
  if public.learning_topic_content('java-tutorial', 'jdbc', 'website') is not null then raise exception 'anon: draft topic content visible'; end if;
  perform test_reset();
  update public.learning_topics set status = 'published' where source_kind = 'java_tutorial' and slug = 'jdbc';
  update public.learning_topics set is_premium = false where source_kind = 'java_tutorial' and slug = 'generics';

  -- ===== ALLOWED: anon reads every rewritten lesson, its practice block and its test =====
  perform test_as(null, 'anon');
  foreach s in array (select array_agg(slug) from jr_b2) loop
    j := public.learning_topic_content('java-tutorial', s, 'website');
    if j is null or (j ->> 'locked')::boolean or jsonb_array_length(j -> 'contents') <> 2 then
      raise exception 'anon: % should return 2 unlocked blocks, got %', s, coalesce(jsonb_array_length(j -> 'contents'), -1); end if;
    if not exists (select 1 from jsonb_array_elements(j -> 'contents') e where e ->> 'body' like '%## Interview Questions%') then
      raise exception 'anon: % does not serve the rewritten body', s; end if;
    if public.mock_test_detail('pt-java-' || s, 'website') is null then raise exception 'anon: test for % missing', s; end if;
    j := public.learning_topic_practice('java-tutorial', s, 'website');
    if not exists (select 1 from jsonb_array_elements(j -> 'mock_tests') e where e ->> 'id' = 'pt-java-' || s) then
      raise exception 'anon: % test not listed in topic practice', s; end if;
  end loop;
  perform test_reset();

  -- ===== DENIED: a student cannot write lesson content or MCQs =====
  u := test_make_user('jr2@x.test', '{"full_name":"Student JR2"}');
  perform test_as(u);
  begin
    update public.learning_contents c set body = 'hacked' from public.learning_topics t
     where t.id = c.topic_id and t.slug = 'treemap' and t.source_kind = 'java_tutorial';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'student updated % lesson block(s)', n; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
    values ('tq-java-treemap-99', 'pt-java-treemap', 'x', '["a","b","c","d"]', 0, 'x', 1, 99);
    raise exception 'student inserted an MCQ';
  exception when insufficient_privilege then null;
  end;
  perform test_reset();
  if exists (select 1 from public.learning_contents where body = 'hacked') or exists (select 1 from public.test_questions where id = 'tq-java-treemap-99') then
    raise exception 'student write went through'; end if;
end $$;

-- ===== batch 02 rollback, twice: batch 01 stays rewritten =====
\ir ../../rollbacks/0146_java_lesson_rewrite_batch02_rollback.sql
\ir ../../rollbacks/0146_java_lesson_rewrite_batch02_rollback.sql
do $$
declare n int; fp text;
begin
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b2) and c.metadata ->> 'source' = 'java_tutorial_seed'
     and c.body like '## 1. What %' and c.body not like '%## Interview Questions%';
  if n <> 20 then raise exception 'rollback: expected 20 original bodies back, found %', n; end if;
  if exists (select 1 from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
              where c.metadata ->> 'origin' = 'java_lesson_rewrite' and t.slug in (select slug from jr_b2)) then
    raise exception 'rollback left batch 02 practice blocks behind'; end if;
  if exists (select 1 from public.practice_tests where id in (select 'pt-java-' || slug from jr_b2)) then
    raise exception 'rollback left batch 02 tests behind'; end if;
  -- batch 01 (applied earlier in the chain) is untouched
  if (select count(*) from public.test_questions where test_id = 'pt-java-hashmap') <> 10
     or not exists (select 1 from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
                     where t.slug = 'hashmap' and c.metadata ->> 'source' = 'java_tutorial_seed' and c.body like '%## Interview Questions%') then
    raise exception 'batch 02 rollback damaged batch 01'; end if;
  select count(*) into n from jr_ident2 i join public.learning_topics t on t.id = i.id;
  if n <> 20 then raise exception 'rollback removed a topic'; end if;
  select md5(string_agg(x, '|' order by x)) into fp from (
    select 't' || t.id || t.title || t.short_description || t.updated_at as x from public.learning_topics t
     where not (t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b2))
    union all select 'c' || c.id || md5(c.body) || c.updated_at from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
     where not (t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b2))
    union all select 'p' || p.id || p.title || p.updated_at from public.practice_tests p where p.id not in (select 'pt-java-' || slug from jr_b2)
    union all select 'q' || q.id || q.question_text from public.test_questions q where q.test_id not in (select 'pt-java-' || slug from jr_b2)
  ) z;
  if fp is distinct from (select jr_other2.fp from jr_other2) then raise exception 'batch 02 or its rollback touched rows outside its 20 topics'; end if;
end $$;

-- ===== re-apply after rollback restores it =====
\ir ../../migrations/0146_java_lesson_rewrite_batch02.sql
do $$
begin
  if (select count(*) from public.test_questions where test_id in (select 'pt-java-' || slug from jr_b2)) <> 200 then
    raise exception 're-apply after rollback: expected 200 MCQs'; end if;
end $$;

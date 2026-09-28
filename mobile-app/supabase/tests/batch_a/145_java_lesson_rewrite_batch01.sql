-- 0145/116: Java Tutorials lesson rewrite batch 01 (20 existing topics, bodies rewritten in place).
--   * re-applying is a no-op and never changes a topic id, slug, title, section, order or publish state
--   * an admin's draft / premium change survives a re-apply, and a draft topic stays DENIED to anon
--   * anon and a student can read every rewritten lesson, the new Practice Problems block and the new test
--   * a student cannot write lesson content or MCQs (RLS denies it)
--   * jdk-jre-and-jvm keeps its existing 0070 test, MCQs and practice block untouched
--   * the rollback restores the original 0047 text, removes only what this batch added, and is safe twice
\ir ../../migrations/0145_java_lesson_rewrite_batch01.sql
\ir ../../migrations/0145_java_lesson_rewrite_batch01.sql

create temp table jr_b1 (slug text primary key);
insert into jr_b1 values ('hashmap'), ('arraylist'), ('collection-framework'), ('stream-api'), ('lambda-expressions'),
  ('constructors'), ('inheritance'), ('polymorphism'), ('abstraction'), ('interface'),
  ('abstract-class'), ('static-keyword'), ('this-keyword'), ('method-overloading'), ('method-overriding'),
  ('string'), ('exception'), ('try-catch'), ('thread'), ('jdk-jre-and-jvm');
grant select on jr_b1 to anon, authenticated;

-- fingerprint of every Learning / test row this batch must not touch
create temp table jr_other as
select md5(string_agg(x, '|' order by x)) as fp from (
  select 't' || t.id || t.title || t.short_description || t.updated_at as x from public.learning_topics t
   where not (t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b1))
  union all select 'c' || c.id || md5(c.body) || c.updated_at from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where not (t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b1))
  union all select 'p' || p.id || p.title || p.updated_at from public.practice_tests p where p.id not in (select 'pt-java-' || slug from jr_b1)
  union all select 'q' || q.id || q.question_text from public.test_questions q where q.test_id not in (select 'pt-java-' || slug from jr_b1)
) z;
grant select on jr_other to anon, authenticated;

-- topic identity that must never change (id, slug, title, section, order, publish state)
create temp table jr_ident as
select t.id, t.slug, t.title, t.section_id, t.sort_order, t.status, t.is_premium, t.show_on_website, t.show_on_mobile
from public.learning_topics t where t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b1);

do $$
declare n int; s text;
begin
  if (select count(*) from jr_ident) <> 20 then raise exception 'expected 20 batch topics, found %', (select count(*) from jr_ident); end if;
  -- the rewrite landed: long bodies, new descriptions, the 0047 opener is gone
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b1) and c.metadata ->> 'source' = 'java_tutorial_seed'
     and length(c.body) > 7000 and c.body not like '## 1. What %' and c.body like '%## Interview Questions%';
  if n <> 20 then raise exception 'expected 20 rewritten lesson bodies, found %', n; end if;
  select count(*) into n from public.learning_topics t where t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b1)
   and length(t.short_description) between 140 and 155;
  if n <> 20 then raise exception 'expected 20 new 140-155 char descriptions, found %', n; end if;
  -- new rows: 19 practice blocks and 19 tests x 10 MCQs; jdk-jre-and-jvm keeps its own
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where t.slug in (select slug from jr_b1) and c.metadata ->> 'source' = 'java_practice_seed' and c.metadata ->> 'origin' = 'java_lesson_rewrite'
     and c.heading = 'Practice Problems' and c.sort_order = 1;
  if n <> 19 then raise exception 'expected 19 new practice blocks, found %', n; end if;
  select count(*) into n from public.test_questions where test_id in (select 'pt-java-' || slug from jr_b1 where slug <> 'jdk-jre-and-jvm');
  if n <> 190 then raise exception 'expected 190 MCQs, found %', n; end if;
  select count(*) into n from public.practice_tests p join public.learning_topics t on t.id = p.learning_topic_id
   where p.id = 'pt-java-' || t.slug and t.slug in (select slug from jr_b1) and p.status = 'published' and p.question_count = 10;
  if n <> 20 then raise exception 'expected 20 linked published tests (19 new + jdk-jre-and-jvm), found %', n; end if;
  if (select question_text from public.test_questions where id = 'tq-java-jdk-jre-and-jvm-1') <> 'Which one contains the Java compiler?' then
    raise exception 'jdk-jre-and-jvm MCQs were changed'; end if;
  if not exists (select 1 from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
                  where t.slug = 'jdk-jre-and-jvm' and c.metadata ->> 'source' = 'java_practice_seed' and c.metadata ->> 'origin' is null) then
    raise exception 'jdk-jre-and-jvm lost its 0070 practice block'; end if;

  -- ===== admin changes a re-apply must keep =====
  update public.learning_topics set status = 'draft' where source_kind = 'java_tutorial' and slug = 'thread';
  update public.learning_topics set is_premium = true where source_kind = 'java_tutorial' and slug = 'string';
end $$;

\ir ../../migrations/0145_java_lesson_rewrite_batch01.sql

do $$
declare n int; s text; j jsonb; u uuid;
begin
  if not exists (select 1 from public.learning_topics where source_kind = 'java_tutorial' and slug = 'thread' and status = 'draft')
     or not exists (select 1 from public.learning_topics where source_kind = 'java_tutorial' and slug = 'string' and is_premium) then
    raise exception 're-apply undid an admin draft / premium change'; end if;
  select count(*) into n from jr_ident i join public.learning_topics t on t.id = i.id
   where (t.slug, t.title, t.section_id, t.sort_order, t.show_on_website, t.show_on_mobile)
       = (i.slug, i.title, i.section_id, i.sort_order, i.show_on_website, i.show_on_mobile);
  if n <> 20 then raise exception 'topic identity changed on % topic(s)', 20 - n; end if;

  -- ===== DENIED: a draft topic stays hidden from anon =====
  perform test_as(null, 'anon');
  if public.learning_topic_content('java-tutorial', 'thread', 'website') is not null then raise exception 'anon: draft topic content visible'; end if;
  perform test_reset();
  update public.learning_topics set status = 'published' where source_kind = 'java_tutorial' and slug = 'thread';
  update public.learning_topics set is_premium = false where source_kind = 'java_tutorial' and slug = 'string';

  -- ===== ALLOWED: anon reads every rewritten lesson, its practice block and its test =====
  perform test_as(null, 'anon');
  foreach s in array (select array_agg(slug) from jr_b1) loop
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
  u := test_make_user('jr1@x.test', '{"full_name":"Student JR1"}');
  perform test_as(u);
  begin
    update public.learning_contents c set body = 'hacked' from public.learning_topics t
     where t.id = c.topic_id and t.slug = 'hashmap' and t.source_kind = 'java_tutorial';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'student updated % lesson block(s)', n; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
    values ('tq-java-hashmap-99', 'pt-java-hashmap', 'x', '["a","b","c","d"]', 0, 'x', 1, 99);
    raise exception 'student inserted an MCQ';
  exception when insufficient_privilege then null;
  end;
  perform test_reset();
  if exists (select 1 from public.learning_contents where body = 'hacked') or exists (select 1 from public.test_questions where id = 'tq-java-hashmap-99') then
    raise exception 'student write went through'; end if;
end $$;

-- ===== rollback, twice =====
\ir ../../rollbacks/0145_java_lesson_rewrite_batch01_rollback.sql
\ir ../../rollbacks/0145_java_lesson_rewrite_batch01_rollback.sql
do $$
declare n int; fp text;
begin
  select count(*) into n from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
   where t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b1) and c.metadata ->> 'source' = 'java_tutorial_seed'
     and c.body like '## 1. What %' and c.body not like '%## Interview Questions%';
  if n <> 20 then raise exception 'rollback: expected 20 original bodies back, found %', n; end if;
  if exists (select 1 from public.learning_contents where metadata ->> 'origin' = 'java_lesson_rewrite') then
    raise exception 'rollback left practice blocks behind'; end if;
  if exists (select 1 from public.practice_tests where id in (select 'pt-java-' || slug from jr_b1 where slug <> 'jdk-jre-and-jvm')) then
    raise exception 'rollback left tests behind'; end if;
  if (select count(*) from public.test_questions where test_id = 'pt-java-jdk-jre-and-jvm') <> 10 then
    raise exception 'rollback damaged the jdk-jre-and-jvm test'; end if;
  select count(*) into n from jr_ident i join public.learning_topics t on t.id = i.id;
  if n <> 20 then raise exception 'rollback removed a topic'; end if;
  select md5(string_agg(x, '|' order by x)) into fp from (
    select 't' || t.id || t.title || t.short_description || t.updated_at as x from public.learning_topics t
     where not (t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b1))
    union all select 'c' || c.id || md5(c.body) || c.updated_at from public.learning_contents c join public.learning_topics t on t.id = c.topic_id
     where not (t.source_kind = 'java_tutorial' and t.slug in (select slug from jr_b1))
    union all select 'p' || p.id || p.title || p.updated_at from public.practice_tests p where p.id not in (select 'pt-java-' || slug from jr_b1)
    union all select 'q' || q.id || q.question_text from public.test_questions q where q.test_id not in (select 'pt-java-' || slug from jr_b1)
  ) z;
  if fp is distinct from (select jr_other.fp from jr_other) then raise exception 'batch or rollback touched rows outside the 20 topics'; end if;
end $$;

-- ===== re-apply after rollback restores it =====
\ir ../../migrations/0145_java_lesson_rewrite_batch01.sql
do $$
begin
  if (select count(*) from public.test_questions where test_id in (select 'pt-java-' || slug from jr_b1)) <> 200 then
    raise exception 're-apply after rollback: expected 200 MCQs (190 new + 10 jdk)'; end if;
end $$;

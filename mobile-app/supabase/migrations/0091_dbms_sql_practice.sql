-- mobile-app/supabase/migrations/0091_dbms_sql_practice.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/063_dbms_sql_practice.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — DBMS & SQL Notes + Practice: schema + RPCs
-- (mobile 0091_dbms_sql_practice.sql  ==  admin 063_dbms_sql_practice.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Adds the schema needed for a "DBMS & SQL" Learning grid with a Practice
--   layer on top of it. Content is seeded separately (the next migration in
--   this pair). This migration only adds columns + 4 RPCs; it never runs
--   code and holds no secrets. Three pieces, all purely additive:
--
--   1. SQL as a judged language — dsa_problems gains sql_schema_sql /
--      sql_seed_sql / sql_check_sql (nullable). A SQL coding problem composes
--      its judge script server-side as
--        schema_sql ; (case.seed_sql or seed_sql) ; <student query> ; check_sql
--      instead of running the student's raw source — everything else about
--      the existing judge (coding_problem_run_cases -> the website judge/
--      submit routes -> the sandbox provider) is unchanged.
--      coding_problem_run_cases() is extended (additively — new keys only)
--      to carry schema_sql/seed_sql/check_sql alongside each case.
--
--   2. Chapter-wise & full-course RANDOMIZED tests — practice_tests gains a
--      `scope` ('topic' | 'chapter' | 'course', default 'topic' — every
--      existing row is unaffected), plus learning_section_id / learning_grid_id
--      (which chapter / course a chapter/course-scope test's pool is drawn
--      from) and randomize / question_limit. A chapter/course test owns NO
--      test_questions of its own — its pool is the LIVE union of every
--      'topic'-scope test's questions under that chapter/course, computed by
--      the new practice_test_pool() helper. That means seeding a new chapter
--      later automatically extends any existing chapter/course pool with no
--      migration touching this one. submit_test_attempt() (0040) is
--      untouched — it keeps scoring plain topic tests exactly as before;
--      chapter/course tests use the new submit_randomized_test_attempt(),
--      which re-validates the presented question ids against the live pool
--      server-side (a client can never submit a rigged question set).
--
--   3. Progress / weak-topics — a single read-only, owner-scoped RPC
--      (learning_progress_summary) aggregates the EXISTING test_attempts +
--      user_dsa_progress tables per topic under a grid. No new tables.
--
-- ACCESS CONTROL
--   New columns default to values that change nothing a caller can already
--   see (scope='topic' for every existing practice_tests row). The two new
--   test-taking RPCs are SECURITY DEFINER and re-check publish/platform
--   status themselves, exactly like every other read RPC in this codebase.
--   learning_progress_summary only ever returns auth.uid()'s own data — it
--   takes no user_id parameter.
--
-- SAFETY
--   100% additive. No DROP of anything holding data. Guarded with
--   to_regclass / to_regprocedure / IF NOT EXISTS so it is safe to run
--   before or after its twin and safe to re-run.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regclass('public.dsa_problems') is null or to_regclass('public.practice_tests') is null then
    raise exception '0091/063: dsa_problems / practice_tests not found — apply 0018_dsa.sql / 0016_practice_tests.sql first.';
  end if;
  if to_regprocedure('public.coding_problem_run_cases(text)') is null
     or to_regprocedure('public.submit_test_attempt(text, jsonb, integer)') is null then
    raise exception '0091/063: topic-practice RPCs not found — apply 0048_topic_practice.sql (admin 025) and 0040_test_attempt_scoring.sql first.';
  end if;
  if to_regclass('public.learning_sections') is null or to_regclass('public.learning_grids') is null then
    raise exception '0091/063: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. SCHEMA — SQL judge fields on dsa_problems
-- ===========================================================================
alter table public.dsa_problems
  add column if not exists sql_schema_sql text,
  add column if not exists sql_seed_sql   text,
  add column if not exists sql_check_sql  text;

-- ===========================================================================
-- 2. SCHEMA — chapter-wise / full-course scope on practice_tests
-- ===========================================================================
alter table public.practice_tests add column if not exists scope text;
update public.practice_tests set scope = 'topic' where scope is null;
alter table public.practice_tests alter column scope set default 'topic';
alter table public.practice_tests alter column scope set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'practice_tests_scope_chk') then
    alter table public.practice_tests add constraint practice_tests_scope_chk
      check (scope in ('topic','chapter','course'));
  end if;
end $$;

alter table public.practice_tests
  add column if not exists learning_section_id uuid references public.learning_sections (id) on delete cascade,
  add column if not exists learning_grid_id_scope uuid references public.learning_grids (id) on delete cascade,
  add column if not exists randomize boolean not null default false,
  add column if not exists question_limit integer;

-- practice_tests already has a learning_grid_id column (0044) used loosely for
-- provenance on topic tests; a chapter/course test's OWN grid (for scope=
-- 'course' pool selection) is kept in a distinct column so it never collides
-- with that existing meaning.
comment on column public.practice_tests.learning_grid_id_scope is
  'scope=course only: the grid whose entire topic-test pool this test randomly samples from.';
comment on column public.practice_tests.learning_section_id is
  'scope=chapter only: the section (chapter) whose topic-test pool this test randomly samples from.';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'practice_tests_scope_home_chk') then
    alter table public.practice_tests add constraint practice_tests_scope_home_chk
      check (
        (scope = 'topic')
        or (scope = 'chapter' and learning_section_id is not null)
        or (scope = 'course' and learning_grid_id_scope is not null)
      );
  end if;
end $$;

create index if not exists practice_tests_scope_section_idx
  on public.practice_tests (learning_section_id) where scope = 'chapter';
create index if not exists practice_tests_scope_grid_idx
  on public.practice_tests (learning_grid_id_scope) where scope = 'course';

-- ===========================================================================
-- 3. RPCs
-- ===========================================================================

-- 3a. coding_problem_run_cases — additive: carry the SQL judge's schema/seed/
--     check text alongside every case. Non-SQL problems just get empty
--     strings for these three keys (harmless extra keys for existing callers).
create or replace function public.coding_problem_run_cases(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v record;
begin
  select dp.id, dp.examples, dp.test_cases, dp.is_premium,
         dp.sql_schema_sql, dp.sql_seed_sql, dp.sql_check_sql,
         t.is_premium as topic_premium, t.id as topic_id
    into v
  from public.dsa_problems dp
  join public.learning_topics t on t.id = dp.learning_topic_id
  where dp.topic_id is null
    and dp.slug is not null
    and lower(dp.slug) = lower(p_slug)
    and coalesce(dp.status, 'published') = 'published'
    and public.learning_topic_visible(t.id, 'any')
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  limit 1;

  if v.id is null then
    return null;
  end if;

  if (coalesce(v.is_premium, false) or coalesce(v.topic_premium, false))
     and not public.current_user_is_premium()
     and not public.is_admin(auth.uid()) then
    return null;
  end if;

  return coalesce((
    select jsonb_agg(c order by (c->>'seq')::int)
    from (
      select jsonb_build_object(
               'seq', (row_number() over ()) - 1,
               'input',    coalesce(e->>'input', ''),
               'expected', coalesce(e->>'output', e->>'expected', ''),
               'hidden',   false,
               'schema_sql', coalesce(v.sql_schema_sql, ''),
               'seed_sql',   coalesce(e->>'seed_sql', v.sql_seed_sql, ''),
               'check_sql',  coalesce(v.sql_check_sql, '')
             ) as c
      from jsonb_array_elements(coalesce(v.examples, '[]'::jsonb)) e
      union all
      select jsonb_build_object(
               'seq', 1000 + ((row_number() over ()) - 1),
               'input',    coalesce(tc->>'input', ''),
               'expected', coalesce(tc->>'expected', tc->>'output', ''),
               'hidden',   coalesce((tc->>'hidden')::boolean, true),
               'schema_sql', coalesce(v.sql_schema_sql, ''),
               'seed_sql',   coalesce(tc->>'seed_sql', v.sql_seed_sql, ''),
               'check_sql',  coalesce(v.sql_check_sql, '')
             )
      from jsonb_array_elements(coalesce(v.test_cases, '[]'::jsonb)) tc
    ) rows
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.coding_problem_run_cases(text) from public;
grant execute on function public.coding_problem_run_cases(text) to anon, authenticated;

-- 3a-2. mock_test_detail — additive: also expose `scope`, so the website/
--       mobile test-taking screen can tell a chapter/course test apart from a
--       plain topic test and switch to the randomized-pool RPCs below. Body is
--       otherwise byte-identical to 0048's definition.
create or replace function public.mock_test_detail(
  p_test_id text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v     record;
  v_web boolean := (coalesce(p_platform,'website') <> 'mobile');
begin
  select pt.*, t.slug as topic_slug, t.title as topic_title, t.is_premium as topic_premium,
         g.slug as grid_slug
    into v
  from public.practice_tests pt
  left join public.learning_topics t on t.id = pt.learning_topic_id
  left join public.learning_grids g on g.id = t.grid_id
  where pt.id = p_test_id
    and coalesce(pt.status, 'published') = 'published'
    and case when v_web then coalesce(pt.show_on_website, true) else coalesce(pt.show_on_mobile, true) end
    and public.learning_row_visible(pt.target_type, pt.target_course_id, pt.target_branch_ids, pt.target_year_id)
  limit 1;

  if v.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', v.id,
    'title', v.title,
    'description', coalesce(v.description, ''),
    'category', v.category,
    'duration_minutes', coalesce(v.duration_minutes, 0),
    'difficulty', coalesce(v.difficulty, 'Medium'),
    'negative_marking', coalesce(v.negative_marking, 0),
    'instructions', coalesce(v.instructions, ''),
    'question_count', coalesce(v.question_limit, v.question_count, 0),
    'total_marks', coalesce(v.total_marks, 0),
    'attempts_allowed', v.attempts_allowed,
    'is_premium', coalesce(v.is_premium, false)
      or coalesce(v.topic_premium, false),
    'scope', coalesce(v.scope, 'topic'),
    'topic', case when v.grid_slug is null then null else jsonb_build_object(
      'grid_slug', v.grid_slug, 'topic_slug', v.topic_slug, 'title', v.topic_title
    ) end
  );
end;
$$;
revoke all on function public.mock_test_detail(text, text) from public;
grant execute on function public.mock_test_detail(text, text) to anon, authenticated;

-- 3b. practice_test_pool — internal helper (not granted to anon/authenticated):
--     the LIVE set of topic-test questions under a chapter/course test's
--     chapter or grid. Re-run any time — a later content batch that seeds
--     more chapters automatically widens this with zero migration changes.
create or replace function public.practice_test_pool(p_test_id text)
returns table (id text, marks integer, correct_index integer)
language sql stable security definer set search_path = public
as $$
  select tq.id, tq.marks, tq.correct_index
  from public.test_questions tq
  join public.practice_tests owner on owner.id = tq.test_id
  join public.learning_topics t on t.id = owner.learning_topic_id
  join public.practice_tests self on self.id = p_test_id
  where coalesce(owner.scope, 'topic') = 'topic'
    and coalesce(owner.status, 'published') = 'published'
    and (
      (self.scope = 'chapter' and t.section_id = self.learning_section_id)
      or (self.scope = 'course' and t.grid_id = self.learning_grid_id_scope)
    );
$$;
revoke all on function public.practice_test_pool(text) from public, anon, authenticated;

-- 3c. practice_test_questions — a random question_limit-sized sample from a
--     chapter/course test's live pool, no correct_index withheld (matches the
--     existing plain-topic-test posture — 0040's note: correct_index is not
--     treated as secret at this layer, server-side scoring is what's
--     protected). Plain topic tests are unaffected — they keep fetching
--     test_questions directly, unchanged.
create or replace function public.practice_test_questions(
  p_test_id text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v record;
  v_web boolean := (coalesce(p_platform,'website') <> 'mobile');
  v_limit int;
begin
  select pt.* into v
  from public.practice_tests pt
  where pt.id = p_test_id
    and coalesce(pt.scope, 'topic') in ('chapter','course')
    and coalesce(pt.status, 'published') = 'published'
    and case when v_web then coalesce(pt.show_on_website, true) else coalesce(pt.show_on_mobile, true) end
  limit 1;

  if v.id is null then
    return null;
  end if;

  v_limit := greatest(coalesce(v.question_limit, 20), 1);

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', tq.id, 'question_text', tq.question_text, 'options', tq.options,
             'correct_index', tq.correct_index, 'explanation', tq.explanation, 'marks', q.marks
           ))
    from (
      select id, marks from public.practice_test_pool(p_test_id) order by random() limit v_limit
    ) q
    join public.test_questions tq on tq.id = q.id
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.practice_test_questions(text, text) from public;
grant execute on function public.practice_test_questions(text, text) to anon, authenticated;

-- 3d. submit_randomized_test_attempt — server-authoritative scoring for a
--     chapter/course attempt, scoped ONLY to the question ids actually
--     presented (re-validated against the live pool — a tampered id list
--     outside the pool scores nothing). Mirrors submit_test_attempt (0040)
--     exactly; that function is untouched and keeps owning plain topic tests.
create or replace function public.submit_randomized_test_attempt(
  p_test_id            text,
  p_question_ids       text[],
  p_answers            jsonb,
  p_time_taken_seconds integer
)
returns public.test_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid         uuid := auth.uid();
  v_exists      boolean;
  v_attempt     public.test_attempts;
  v_qcount      integer := 0;
  v_total_marks integer := 0;
  v_score       integer := 0;
  v_correct     integer := 0;
begin
  if v_uid is null then
    raise exception 'You must be signed in to submit a test'
      using errcode = 'insufficient_privilege';
  end if;

  select exists(
    select 1 from public.practice_tests
    where id = p_test_id and coalesce(scope, 'topic') in ('chapter','course')
  ) into v_exists;
  if not v_exists then
    raise exception 'Test % not found', p_test_id using errcode = 'no_data_found';
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'p_answers must be a JSON array'
      using errcode = 'invalid_parameter_value';
  end if;
  if p_question_ids is null or array_length(p_question_ids, 1) is null then
    raise exception 'p_question_ids must not be empty'
      using errcode = 'invalid_parameter_value';
  end if;

  with q as (
    select
      pool.id, pool.marks, pool.correct_index,
      (
        select (a.value ->> 'selected_index')::int
        from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
        where a.value ->> 'question_id' = pool.id
        limit 1
      ) as selected_index
    from public.practice_test_pool(p_test_id) pool
    where pool.id = any (p_question_ids)
  )
  select
    count(*),
    coalesce(sum(marks), 0),
    coalesce(sum(marks) filter (where selected_index is not null and selected_index = correct_index), 0),
    count(*) filter (where selected_index is not null and selected_index = correct_index)
  into v_qcount, v_total_marks, v_score, v_correct
  from q;

  if v_qcount = 0 then
    raise exception 'None of the given questions belong to this test''s pool'
      using errcode = 'invalid_parameter_value';
  end if;

  insert into public.test_attempts
    (user_id, test_id, score, total_marks, correct_count, incorrect_count, time_taken_seconds)
  values
    (v_uid, p_test_id, v_score, v_total_marks, v_correct,
     greatest(v_qcount - v_correct, 0),
     greatest(coalesce(p_time_taken_seconds, 0), 0))
  returning * into v_attempt;

  insert into public.test_attempt_answers (attempt_id, question_id, selected_index, is_correct)
  select
    v_attempt.id, pool.id, sel.selected_index,
    coalesce(sel.selected_index is not null and sel.selected_index = pool.correct_index, false)
  from public.practice_test_pool(p_test_id) pool
  cross join lateral (
    select (
      select (a.value ->> 'selected_index')::int
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
      where a.value ->> 'question_id' = pool.id
      limit 1
    ) as selected_index
  ) sel
  where pool.id = any (p_question_ids)
  on conflict (attempt_id, question_id) do nothing;

  return v_attempt;
end;
$$;
revoke all on function public.submit_randomized_test_attempt(text, text[], jsonb, integer) from public, anon;
grant execute on function public.submit_randomized_test_attempt(text, text[], jsonb, integer) to authenticated;

-- 3e. learning_progress_summary — read-only, owner-scoped (no user_id param —
--     always auth.uid()). Per-topic best MCQ %, coding solved/attempted, and
--     a computed is_weak flag, aggregated purely from EXISTING tables
--     (test_attempts, user_dsa_progress). No new tables.
create or replace function public.learning_progress_summary(
  p_grid_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_grid_id uuid;
begin
  if v_uid is null then
    return null;
  end if;

  select id into v_grid_id from public.learning_grids where lower(slug) = lower(p_grid_slug);
  if v_grid_id is null then
    return null;
  end if;

  return jsonb_build_object(
    'grid_slug', p_grid_slug,
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object(
        'topic_id', t.id,
        'topic_slug', t.slug,
        'topic_title', t.title,
        'section_slug', s.slug,
        'section_name', s.name,
        'best_score_pct', tstat.best_pct,
        'mcq_attempts', coalesce(tstat.attempts, 0),
        'coding_total', coalesce(cstat.total, 0),
        'coding_solved', coalesce(cstat.solved, 0),
        'coding_attempted', coalesce(cstat.attempted, 0),
        'is_weak', (
          (tstat.best_pct is not null and tstat.best_pct < 60)
          or (coalesce(cstat.total, 0) > 0 and coalesce(cstat.solved, 0) = 0 and coalesce(cstat.attempted, 0) > 0)
        )
      ) order by s.sort_order, t.sort_order)
      from public.learning_topics t
      join public.learning_sections s on s.id = t.section_id
      left join lateral (
        select max(round(100.0 * ta.score / nullif(ta.total_marks, 0)))::int as best_pct,
               count(*) as attempts
        from public.test_attempts ta
        join public.practice_tests pt on pt.id = ta.test_id
        where pt.learning_topic_id = t.id and coalesce(pt.scope, 'topic') = 'topic'
          and ta.user_id = v_uid
      ) tstat on true
      left join lateral (
        select count(*) as total,
               count(*) filter (where udp.status = 'solved') as solved,
               count(*) filter (where udp.status = 'attempted') as attempted
        from public.dsa_problems dp
        left join public.user_dsa_progress udp on udp.problem_id = dp.id and udp.user_id = v_uid
        where dp.learning_topic_id = t.id and dp.topic_id is null
      ) cstat on true
      where t.grid_id = v_grid_id
        and coalesce(t.status, 'published') = 'published'
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.learning_progress_summary(text, text) from public, anon;
grant execute on function public.learning_progress_summary(text, text) to authenticated;

-- ===========================================================================
-- 4. VALIDATION
-- ===========================================================================
do $$
declare
  v_bad int;
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='dsa_problems' and column_name='sql_schema_sql') then
    raise exception 'validation: dsa_problems.sql_schema_sql missing';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='practice_tests' and column_name='scope') then
    raise exception 'validation: practice_tests.scope missing';
  end if;

  select count(*) into v_bad from public.practice_tests where scope not in ('topic','chapter','course');
  if v_bad > 0 then
    raise exception 'validation: % practice_tests rows have an invalid scope', v_bad;
  end if;

  select count(*) into v_bad from public.practice_tests where scope <> 'topic';
  -- (no exception — 0 is expected until the seed migration runs; this is
  -- just documentation that scope defaults to 'topic' for every prior row)

  if to_regprocedure('public.practice_test_pool(text)') is null
     or to_regprocedure('public.practice_test_questions(text, text)') is null
     or to_regprocedure('public.submit_randomized_test_attempt(text, text[], jsonb, integer)') is null
     or to_regprocedure('public.learning_progress_summary(text, text)') is null then
    raise exception 'validation: one or more DBMS-practice RPCs missing';
  end if;

  raise notice '0091 OK: SQL judge columns on dsa_problems, practice_tests.scope + chapter/course pool RPCs, learning_progress_summary live.';
end $$;

notify pgrst, 'reload schema';

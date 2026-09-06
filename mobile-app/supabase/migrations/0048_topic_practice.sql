-- mobile-app/supabase/migrations/0048_topic_practice.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/025_topic_practice.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — topic-specific Mock Tests + Coding Problems
-- (mobile 0048_topic_practice.sql  ==  admin 025_topic_practice.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Every Learning Topic (learning_topics, 0042/019) can now carry:
--     * topic-specific Mock Tests   — practice_tests rows whose learning_topic_id
--       points at the topic. The mock-test engine (test_questions + server-side
--       submit_test_attempt(), 0040) is UNCHANGED and shared by Website + Mobile.
--     * topic-specific Coding Problems — dsa_problems rows whose learning_topic_id
--       points at the topic AND whose legacy topic_id IS NULL. That NULL topic_id
--       is the discriminator: a "topic coding problem" has no dsa_topics parent,
--       so the DSA-dashboard read path (dsa_problems.eq(topic_id, ...)) never
--       sees it and vice-versa. Zero change to user_dsa_progress /
--       user_favorite_questions (text PKs preserved — nothing is copied).
--
--   Code EXECUTION stays website-only. Mobile shows the problem and links out to
--   the public website. This migration only adds columns + read RPCs; it never
--   runs code and holds no secrets.
--
--   0044/021 already added to these tables: learning_grid_id, learning_topic_id,
--   status, is_premium, negative_marking, instructions, attempts_allowed, slug,
--   hints, supported_languages, and the academic-targeting columns. This
--   migration finishes the shape:
--     dsa_problems   += show_on_website, show_on_mobile, test_cases, editorial
--                    += topic_id made NULLABLE + a "has a home" CHECK
--     practice_tests += show_on_website, show_on_mobile
--
-- ACCESS CONTROL
--   New rows default to status='published', target_type='global', both
--   show_on_* = true, is_premium = false — so applying this migration changes
--   NOTHING a caller can see. Enforcement (publish / platform / academic
--   targeting / premium) is applied by the RLS refresh in §2 and re-checked
--   inside every SECURITY DEFINER read RPC in §3, exactly like learning_*.
--   Hidden judge cases (dsa_problems.test_cases) are NEVER returned by
--   coding_problem_detail(); only the server-side judge route reads them via
--   coding_problem_run_cases(), and it strips hidden inputs/outputs from its
--   HTTP response.
--
-- SAFETY
--   100% additive. No DROP of anything holding data. Guarded with
--   to_regclass / to_regprocedure / IF NOT EXISTS so it is safe to run before
--   or after its twin and safe to re-run.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $$
begin
  if to_regprocedure('public.learning_row_visible(text, text, text[], text)') is null then
    raise exception '0048/025: learning_row_visible() not found — apply 0044_learning_unification.sql (admin 021) first.';
  end if;
  if to_regclass('public.dsa_problems') is null or to_regclass('public.practice_tests') is null then
    raise exception '0048/025: practice tables not found — apply 0016_practice_tests.sql / 0018_dsa.sql first.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='dsa_problems' and column_name='learning_topic_id') then
    raise exception '0048/025: dsa_problems.learning_topic_id not found — apply 0044_learning_unification.sql (admin 021) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. SCHEMA
-- ===========================================================================

-- ---- dsa_problems : a problem may hang off a Learning topic with NO dsa_topics
--      parent. topic_id becomes nullable; a CHECK keeps every row anchored.
alter table public.dsa_problems alter column topic_id drop not null;

alter table public.dsa_problems
  add column if not exists show_on_website boolean not null default true,
  add column if not exists show_on_mobile  boolean not null default true,
  add column if not exists test_cases      jsonb   not null default '[]'::jsonb,
  add column if not exists editorial       text    not null default '';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'dsa_problems_home_chk') then
    alter table public.dsa_problems add constraint dsa_problems_home_chk
      check (topic_id is not null or learning_topic_id is not null);
  end if;
end $$;

-- A topic coding problem (topic_id IS NULL) is addressed by a GLOBAL slug on the
-- website route /coding-problems/<slug>; enforce global uniqueness for those.
create unique index if not exists dsa_problems_cp_slug_key
  on public.dsa_problems (lower(slug))
  where topic_id is null and slug is not null;

-- ---- practice_tests : per-platform visibility (mirrors learning_*).
alter table public.practice_tests
  add column if not exists show_on_website boolean not null default true,
  add column if not exists show_on_mobile  boolean not null default true;

-- ===========================================================================
-- 2. RLS — add the platform gate to the existing public SELECT policies.
--    (Exact platform is filtered per-RPC; RLS keeps the "either platform"
--    coarse gate, exactly as the learning_* policies do.)
-- ===========================================================================

drop policy if exists "dsa_problems_select_public" on public.dsa_problems;
create policy "dsa_problems_select_public" on public.dsa_problems
  for select
  using (
    coalesce(status, 'published') = 'published'
    and (coalesce(show_on_website, true) or coalesce(show_on_mobile, true))
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
    and (
      not coalesce(is_premium, false)
      or public.current_user_is_premium()
      or public.is_admin(auth.uid())
    )
  );

drop policy if exists "practice_tests_select_public" on public.practice_tests;
create policy "practice_tests_select_public" on public.practice_tests
  for select
  using (
    coalesce(status, 'published') = 'published'
    and (coalesce(show_on_website, true) or coalesce(show_on_mobile, true))
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
  );

-- ===========================================================================
-- 3. READ RPCs (SECURITY DEFINER — visibility + premium enforced here so the
--    apps never assemble the list or trust a UI lock). grant anon+authenticated.
-- ===========================================================================

-- 3a. learning_topic_practice — the Mock Tests + Coding Problems attached to one
--     topic, for the bottom of the Learning topic page (Website + Mobile).
create or replace function public.learning_topic_practice(
  p_grid_slug text, p_topic_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_topic_id uuid;
  v_web      boolean := (coalesce(p_platform,'website') <> 'mobile');
begin
  select t.id
    into v_topic_id
  from public.learning_topics t
  join public.learning_grids g on g.id = t.grid_id
  left join public.learning_sections s on s.id = t.section_id
  where lower(g.slug) = lower(p_grid_slug)
    and lower(t.slug) = lower(p_topic_slug)
    and t.status = 'published' and g.status = 'published'
    and (t.section_id is null or s.status = 'published')
    and case when v_web
             then t.show_on_website and g.show_on_website and coalesce(s.show_on_website, true)
             else t.show_on_mobile  and g.show_on_mobile  and coalesce(s.show_on_mobile, true)
        end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
    and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
  limit 1;

  if v_topic_id is null then
    return null;
  end if;

  return jsonb_build_object(
    'mock_tests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', pt.id, 'title', pt.title, 'description', pt.description,
               'category', pt.category,
               'question_count', pt.question_count,
               'duration_minutes', pt.duration_minutes,
               'difficulty', coalesce(pt.difficulty, 'Medium'),
               'total_marks', coalesce(pt.total_marks, 0),
               'negative_marking', coalesce(pt.negative_marking, 0),
               'is_premium', coalesce(pt.is_premium, false)
             ) order by pt.created_at)
      from public.practice_tests pt
      where pt.learning_topic_id = v_topic_id
        and coalesce(pt.status, 'published') = 'published'
        and case when v_web then coalesce(pt.show_on_website, true) else coalesce(pt.show_on_mobile, true) end
        and public.learning_row_visible(pt.target_type, pt.target_course_id, pt.target_branch_ids, pt.target_year_id)
    ), '[]'::jsonb),
    'coding_problems', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', dp.id, 'slug', dp.slug, 'title', dp.title,
               'difficulty', coalesce(dp.difficulty, 'Easy'),
               'supported_languages', coalesce(dp.supported_languages, array['python','javascript','java','cpp']),
               'is_premium', coalesce(dp.is_premium, false)
             ) order by dp.sort_order, dp.created_at)
      from public.dsa_problems dp
      where dp.learning_topic_id = v_topic_id
        and dp.topic_id is null
        and dp.slug is not null
        and coalesce(dp.status, 'published') = 'published'
        and case when v_web then coalesce(dp.show_on_website, true) else coalesce(dp.show_on_mobile, true) end
        and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.learning_topic_practice(text, text, text) from public;
grant execute on function public.learning_topic_practice(text, text, text) to anon, authenticated;

-- 3b. coding_problem_detail — one topic coding problem by its GLOBAL slug, for
--     /coding-problems/<slug> (Website) and the Mobile problem screen. Never
--     returns test_cases. Body / editorial / solution withheld when locked.
create or replace function public.coding_problem_detail(
  p_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v      record;
  v_web  boolean := (coalesce(p_platform,'website') <> 'mobile');
  v_lock boolean;
begin
  select dp.*, t.slug as topic_slug, t.title as topic_title, t.is_premium as topic_premium,
         g.slug as grid_slug
    into v
  from public.dsa_problems dp
  join public.learning_topics t on t.id = dp.learning_topic_id
  join public.learning_grids g on g.id = t.grid_id
  left join public.learning_sections s on s.id = t.section_id
  where dp.topic_id is null
    and dp.slug is not null
    and lower(dp.slug) = lower(p_slug)
    and coalesce(dp.status, 'published') = 'published'
    and t.status = 'published' and g.status = 'published'
    and (t.section_id is null or s.status = 'published')
    and case when v_web
             then coalesce(dp.show_on_website, true) and t.show_on_website and g.show_on_website and coalesce(s.show_on_website, true)
             else coalesce(dp.show_on_mobile, true)  and t.show_on_mobile  and g.show_on_mobile  and coalesce(s.show_on_mobile, true)
        end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
    and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  limit 1;

  if v.id is null then
    return null;
  end if;

  v_lock := (coalesce(v.is_premium, false) or coalesce(v.topic_premium, false))
            and not public.current_user_is_premium()
            and not public.is_admin(auth.uid());

  return jsonb_build_object(
    'problem', jsonb_build_object(
      'id', v.id,
      'slug', v.slug,
      'title', v.title,
      'difficulty', coalesce(v.difficulty, 'Easy'),
      'is_premium', coalesce(v.is_premium, false),
      'supported_languages', coalesce(v.supported_languages, array['python','javascript','java','cpp']),
      'description',   case when v_lock then null else v.description end,
      'examples',      case when v_lock then '[]'::jsonb else coalesce(v.examples, '[]'::jsonb) end,
      'constraints',   case when v_lock then '[]'::jsonb else coalesce(v.constraints, '[]'::jsonb) end,
      'hints',         case when v_lock then '[]'::jsonb else coalesce(v.hints, '[]'::jsonb) end,
      'starter_code',  case when v_lock then '{}'::jsonb else coalesce(v.starter_code, '{}'::jsonb) end,
      'time_complexity',  case when v_lock then '' else coalesce(v.time_complexity, '') end,
      'space_complexity', case when v_lock then '' else coalesce(v.space_complexity, '') end
    ),
    'topic', jsonb_build_object(
      'grid_slug', v.grid_slug, 'topic_slug', v.topic_slug, 'title', v.topic_title
    ),
    'locked', v_lock,
    'editorial',     case when v_lock then '' else coalesce(v.editorial, '') end,
    'solution_code', case when v_lock then '{}'::jsonb else coalesce(v.solution_code, '{}'::jsonb) end,
    'solution_approach', case when v_lock then '' else coalesce(v.solution_approach, '') end
  );
end;
$$;
revoke all on function public.coding_problem_detail(text, text) from public;
grant execute on function public.coding_problem_detail(text, text) to anon, authenticated;

-- 3c. coding_problem_run_cases — the judge inputs for a topic coding problem.
--     Server-only in practice (the website /api/coding-problems/judge route),
--     but still premium-gated here. Returns visible examples (hidden=false) and
--     hidden test_cases (hidden=true); the route drops hidden input/expected
--     from its response.
create or replace function public.coding_problem_run_cases(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v record;
begin
  select dp.id, dp.examples, dp.test_cases, dp.is_premium,
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
               'hidden',   false
             ) as c
      from jsonb_array_elements(coalesce(v.examples, '[]'::jsonb)) e
      union all
      select jsonb_build_object(
               'seq', 1000 + ((row_number() over ()) - 1),
               'input',    coalesce(tc->>'input', ''),
               'expected', coalesce(tc->>'expected', tc->>'output', ''),
               'hidden',   coalesce((tc->>'hidden')::boolean, true)
             )
      from jsonb_array_elements(coalesce(v.test_cases, '[]'::jsonb)) tc
    ) rows
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.coding_problem_run_cases(text) from public;
grant execute on function public.coding_problem_run_cases(text) to anon, authenticated;

-- 3d. mock_test_detail — one topic mock test's meta for the Website instruction
--     card + breadcrumb. No correct_index. Questions stay gated by
--     test_questions RLS; scoring stays in submit_test_attempt().
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
    'question_count', coalesce(v.question_count, 0),
    'total_marks', coalesce(v.total_marks, 0),
    'attempts_allowed', v.attempts_allowed,
    'is_premium', coalesce(v.is_premium, false)
      or coalesce(v.topic_premium, false),
    'topic', case when v.grid_slug is null then null else jsonb_build_object(
      'grid_slug', v.grid_slug, 'topic_slug', v.topic_slug, 'title', v.topic_title
    ) end
  );
end;
$$;
revoke all on function public.mock_test_detail(text, text) from public;
grant execute on function public.mock_test_detail(text, text) to anon, authenticated;

-- 3e. coding_problems_sitemap — published, platform-visible topic coding-problem
--     slugs + last-modified, for website/sitemap.ts.
create or replace function public.coding_problems_sitemap(p_platform text default 'website')
returns table (slug text, updated_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select dp.slug, dp.updated_at
  from public.dsa_problems dp
  join public.learning_topics t on t.id = dp.learning_topic_id
  join public.learning_grids g on g.id = t.grid_id
  where dp.topic_id is null and dp.slug is not null
    and coalesce(dp.status, 'published') = 'published'
    and t.status = 'published' and g.status = 'published'
    and case p_platform
          when 'mobile' then coalesce(dp.show_on_mobile, true) and t.show_on_mobile and g.show_on_mobile
          else coalesce(dp.show_on_website, true) and t.show_on_website and g.show_on_website
        end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
    and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  order by dp.slug;
$$;
revoke all on function public.coding_problems_sitemap(text) from public;
grant execute on function public.coding_problems_sitemap(text) to anon, authenticated;

-- ===========================================================================
-- 4. INDEXES  (driven by the new read patterns)
-- ===========================================================================
create index if not exists practice_tests_ltopic_pub_idx
  on public.practice_tests (learning_topic_id, status)
  where learning_topic_id is not null;

create index if not exists dsa_problems_cp_topic_idx
  on public.dsa_problems (learning_topic_id, sort_order)
  where topic_id is null and learning_topic_id is not null;

-- ===========================================================================
-- 5. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $$
declare
  v_null_ok boolean;
  v_chk     boolean;
  v_bad     int;
begin
  select is_nullable = 'YES' into v_null_ok
  from information_schema.columns
  where table_schema='public' and table_name='dsa_problems' and column_name='topic_id';
  if not coalesce(v_null_ok, false) then
    raise exception 'validation: dsa_problems.topic_id should be nullable';
  end if;

  select exists (select 1 from pg_constraint where conname='dsa_problems_home_chk') into v_chk;
  if not v_chk then raise exception 'validation: dsa_problems_home_chk missing'; end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='practice_tests' and column_name='show_on_website') then
    raise exception 'validation: practice_tests.show_on_website missing';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='dsa_problems' and column_name='test_cases') then
    raise exception 'validation: dsa_problems.test_cases missing';
  end if;

  -- every legacy dsa_problem still has a home (topic_id was NOT NULL before)
  select count(*) into v_bad from public.dsa_problems
   where topic_id is null and learning_topic_id is null;
  if v_bad > 0 then
    raise exception 'validation: % dsa_problems have neither topic_id nor learning_topic_id', v_bad;
  end if;

  -- the four RPCs exist
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null
     or to_regprocedure('public.coding_problem_detail(text, text)') is null
     or to_regprocedure('public.coding_problem_run_cases(text)') is null
     or to_regprocedure('public.mock_test_detail(text, text)') is null then
    raise exception 'validation: one or more topic-practice RPCs missing';
  end if;

  raise notice '0048 OK: dsa_problems.topic_id nullable + home CHECK, per-platform flags on practice_tests/dsa_problems, 5 read RPCs live.';
end $$;

notify pgrst, 'reload schema';

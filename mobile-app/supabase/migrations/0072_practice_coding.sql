-- mobile-app/supabase/migrations/0072_practice_coding.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/044_practice_coding.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — global "Practice ▸ Coding Problems" (Website)
-- (mobile 0072_practice_coding.sql  ==  admin 044_practice_coding.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Adds a GLOBAL coding-practice area, kept separate from Learning
--   (Tutorials + Notes + MCQ Tests). It reuses the existing execution stack
--   (website /api/compiler/run) and the coding-problem workspace UI; this
--   migration only adds columns + a submissions table + read RPCs. It never
--   runs code and holds no secrets.
--
--   MODEL — no new "problem" table:
--     * dsa_topics  becomes the Practice CATEGORY catalog. New column `kind`
--       ('practice' | 'legacy'); every pre-existing row is set to 'legacy' so a
--       historical DSA topic can never be mistaken for a practice category.
--       + slug / description (already on the table from 0044) and per-platform
--       show flags.
--     * A GLOBAL practice problem is a dsa_problems row with
--         learning_topic_id IS NULL  AND  topic_id -> a dsa_topics row (kind='practice').
--       That satisfies the existing dsa_problems_home_chk with NO change to
--       dsa_problems. Its GLOBAL slug addresses the website route
--       /practice/problems/<slug>; a partial unique index enforces uniqueness
--       for exactly those rows (it coexists with dsa_problems_cp_slug_key, which
--       covers topic_id IS NULL — the Learning-topic coding problems from
--       0048/025, left completely untouched).
--     * NEW table coding_submissions — one row per "Submit" on a practice
--       problem (owner-only RLS). Solved / Unsolved reuses user_dsa_progress
--       (0018) with no change.
--
-- ACCESS CONTROL
--   New dsa_topics rows default to kind='practice', status='published', both
--   show_on_* = true. Practice problems inherit the existing
--   dsa_problems_select_public gate (published + academic targeting + premium).
--   Every SECURITY DEFINER read RPC in §4 re-checks that gate. Hidden judge
--   cases (dsa_problems.test_cases) are NEVER returned by
--   practice_problem_detail(); only the server-side judge/submit routes read
--   them via practice_problem_run_cases(), and they strip hidden inputs /
--   outputs from the HTTP response.
--
-- SAFETY
--   100% additive. No DROP of anything holding data, no FK removed. Guarded
--   with to_regclass / to_regprocedure / IF NOT EXISTS so it is safe to run
--   before or after its twin and safe to re-run.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regprocedure('public.learning_row_visible(text, text, text[], text)') is null then
    raise exception '0072/044: learning_row_visible() not found — apply 0044_learning_unification.sql (admin 021) first.';
  end if;
  if to_regclass('public.dsa_problems') is null or to_regclass('public.dsa_topics') is null then
    raise exception '0072/044: dsa_topics / dsa_problems not found — apply 0018_dsa.sql first.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='dsa_problems' and column_name='test_cases') then
    raise exception '0072/044: dsa_problems.test_cases not found — apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if to_regclass('public.profiles') is null then
    raise exception '0072/044: profiles not found — apply 0001_profiles.sql first.';
  end if;
end $$;

-- ===========================================================================
-- 1. SCHEMA — dsa_topics as the Practice category catalog
-- ===========================================================================

-- kind: default the EXISTING rows to 'legacy', then flip the column default so
-- every NEW category inserted from here on is 'practice'.
alter table public.dsa_topics add column if not exists kind text;
update public.dsa_topics set kind = 'legacy' where kind is null;
alter table public.dsa_topics alter column kind set default 'practice';
alter table public.dsa_topics alter column kind set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'dsa_topics_kind_chk') then
    alter table public.dsa_topics add constraint dsa_topics_kind_chk
      check (kind in ('practice','legacy'));
  end if;
end $$;

alter table public.dsa_topics
  add column if not exists show_on_website boolean not null default true,
  add column if not exists show_on_mobile  boolean not null default true;

-- One practice category per URL slug.
create unique index if not exists dsa_topics_practice_slug_key
  on public.dsa_topics (lower(slug))
  where kind = 'practice' and slug is not null;

-- A global practice problem is addressed by a GLOBAL slug on the website route
-- /practice/problems/<slug>; enforce global uniqueness for exactly those rows.
create unique index if not exists dsa_problems_practice_slug_key
  on public.dsa_problems (lower(slug))
  where learning_topic_id is null and topic_id is not null and slug is not null;

create index if not exists dsa_problems_practice_list_idx
  on public.dsa_problems (topic_id, sort_order, created_at)
  where learning_topic_id is null and topic_id is not null;

-- ===========================================================================
-- 2. SCHEMA — coding_submissions (one row per "Submit")
-- ===========================================================================
create table if not exists public.coding_submissions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  problem_id    text        not null references public.dsa_problems (id) on delete cascade,
  problem_slug  text        not null,
  language      text        not null,
  source_code   text        not null,
  verdict       text        not null
                  check (verdict in ('accepted','wrong_answer','compile_error',
                                     'runtime_error','time_limit_exceeded','error')),
  passed        integer     not null default 0,
  total         integer     not null default 0,
  runtime_ms    integer,
  memory_kb     integer,
  created_at    timestamptz not null default now()
);

create index if not exists coding_submissions_user_idx
  on public.coding_submissions (user_id, created_at desc);
create index if not exists coding_submissions_user_problem_idx
  on public.coding_submissions (user_id, problem_id, created_at desc);

-- ===========================================================================
-- 3. RLS
-- ===========================================================================

-- dsa_topics: add the per-platform show gate to the existing public policy.
drop policy if exists "dsa_topics_select_public" on public.dsa_topics;
create policy "dsa_topics_select_public" on public.dsa_topics
  for select
  using (
    coalesce(status, 'published') = 'published'
    and (coalesce(show_on_website, true) or coalesce(show_on_mobile, true))
    and (learning_grid_id is null or public.learning_grid_visible(learning_grid_id, 'any'))
  );

-- coding_submissions: strictly owner-only (plus an is_admin read backstop).
alter table public.coding_submissions enable row level security;

drop policy if exists "coding_submissions_select_own" on public.coding_submissions;
create policy "coding_submissions_select_own" on public.coding_submissions
  for select using (auth.uid() = user_id);

drop policy if exists "coding_submissions_insert_own" on public.coding_submissions;
create policy "coding_submissions_insert_own" on public.coding_submissions
  for insert with check (auth.uid() = user_id);

do $$ begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "coding_submissions_admin_all" on public.coding_submissions;
    create policy "coding_submissions_admin_all" on public.coding_submissions
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
    -- re-assert admin write on the two catalog tables (harmless if already there)
    drop policy if exists "dsa_topics_admin_all" on public.dsa_topics;
    create policy "dsa_topics_admin_all" on public.dsa_topics
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
    drop policy if exists "dsa_problems_admin_all" on public.dsa_problems;
    create policy "dsa_problems_admin_all" on public.dsa_problems
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

-- ===========================================================================
-- 4. READ RPCs (SECURITY DEFINER — visibility + premium enforced here so the
--    apps never assemble the list or trust a UI lock). grant anon+authenticated.
-- ===========================================================================

-- 4a. practice_categories — the Practice category catalog + a live problem count.
create or replace function public.practice_categories(p_platform text default 'website')
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_web boolean := (coalesce(p_platform,'website') <> 'mobile');
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'slug', dt.slug,
             'name', dt.name,
             'description', coalesce(dt.description, ''),
             'sort_order', coalesce(dt.sort_order, 0),
             'problem_count', (
               select count(*)
               from public.dsa_problems dp
               where dp.topic_id = dt.id
                 and dp.learning_topic_id is null
                 and dp.slug is not null
                 and coalesce(dp.status, 'published') = 'published'
                 and case when v_web then coalesce(dp.show_on_website, true) else coalesce(dp.show_on_mobile, true) end
                 and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
             )
           ) order by coalesce(dt.sort_order, 0), dt.name)
    from public.dsa_topics dt
    where dt.kind = 'practice'
      and dt.slug is not null
      and coalesce(dt.status, 'published') = 'published'
      and case when v_web then coalesce(dt.show_on_website, true) else coalesce(dt.show_on_mobile, true) end
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.practice_categories(text) from public;
grant execute on function public.practice_categories(text) to anon, authenticated;

-- 4b. practice_problems_list — paginated + filtered list for /practice/problems.
--     Never ships test_cases. Server-side filter/paginate so the browser never
--     holds every problem at once. Pure SQL, one pass for count + page.
create or replace function public.practice_problems_list(
  p_platform   text    default 'website',
  p_difficulty text    default null,
  p_category   text    default null,
  p_search     text    default null,
  p_limit      integer default 24,
  p_offset     integer default 0
)
returns jsonb
language sql stable security definer set search_path = public
as $$
  with base as (
    select dp.id, dp.slug, dp.title, coalesce(dp.difficulty, 'Easy') as difficulty,
           dt.slug as category_slug, dt.name as category_name,
           coalesce(dp.supported_languages, array['python','javascript','java','cpp']) as supported_languages,
           coalesce(dp.is_premium, false) as is_premium,
           coalesce(dt.sort_order, 0) as cat_sort, coalesce(dp.sort_order, 0) as prob_sort, dp.created_at
    from public.dsa_problems dp
    join public.dsa_topics dt on dt.id = dp.topic_id and dt.kind = 'practice'
    where dp.learning_topic_id is null
      and dp.slug is not null
      and coalesce(dp.status, 'published') = 'published'
      and coalesce(dt.status, 'published') = 'published'
      and case when coalesce(p_platform, 'website') <> 'mobile'
               then coalesce(dp.show_on_website, true) and coalesce(dt.show_on_website, true)
               else coalesce(dp.show_on_mobile, true)  and coalesce(dt.show_on_mobile, true)
          end
      and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
      and (nullif(btrim(coalesce(p_difficulty, '')), '') is null or lower(dp.difficulty) = lower(btrim(p_difficulty)))
      and (nullif(btrim(coalesce(p_category, '')), '') is null or lower(dt.slug) = lower(btrim(p_category)))
      and (nullif(btrim(coalesce(p_search, '')), '') is null
           or dp.title ilike '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%')
  ),
  page as (
    select * from base
    order by cat_sort, prob_sort, created_at
    offset greatest(coalesce(p_offset, 0), 0)
    limit least(greatest(coalesce(p_limit, 24), 1), 100)
  )
  select jsonb_build_object(
    'total', (select count(*) from base),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id,
               'slug', p.slug,
               'title', p.title,
               'difficulty', p.difficulty,
               'category_slug', p.category_slug,
               'category_name', p.category_name,
               'supported_languages', p.supported_languages,
               'is_premium', p.is_premium
             ) order by p.cat_sort, p.prob_sort, p.created_at)
      from page p
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.practice_problems_list(text, text, text, text, integer, integer) from public;
grant execute on function public.practice_problems_list(text, text, text, text, integer, integer) to anon, authenticated;

-- 4c. practice_problem_detail — one global practice problem by slug, for
--     /practice/problems/<slug>. Never returns test_cases. Body / editorial /
--     solution withheld when premium-locked.
create or replace function public.practice_problem_detail(
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
  select dp.*, dt.slug as category_slug, dt.name as category_name
    into v
  from public.dsa_problems dp
  join public.dsa_topics dt on dt.id = dp.topic_id and dt.kind = 'practice'
  where dp.learning_topic_id is null
    and dp.slug is not null
    and lower(dp.slug) = lower(p_slug)
    and coalesce(dp.status, 'published') = 'published'
    and coalesce(dt.status, 'published') = 'published'
    and case when v_web
             then coalesce(dp.show_on_website, true) and coalesce(dt.show_on_website, true)
             else coalesce(dp.show_on_mobile, true)  and coalesce(dt.show_on_mobile, true)
        end
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  limit 1;

  if v.id is null then
    return null;
  end if;

  v_lock := coalesce(v.is_premium, false)
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
    'category', jsonb_build_object('slug', v.category_slug, 'name', v.category_name),
    'topic', jsonb_build_object('grid_slug', null, 'topic_slug', null, 'title', v.category_name),
    'locked', v_lock,
    'editorial',     case when v_lock then '' else coalesce(v.editorial, '') end,
    'solution_code', case when v_lock then '{}'::jsonb else coalesce(v.solution_code, '{}'::jsonb) end,
    'solution_approach', case when v_lock then '' else coalesce(v.solution_approach, '') end
  );
end;
$$;
revoke all on function public.practice_problem_detail(text, text) from public;
grant execute on function public.practice_problem_detail(text, text) to anon, authenticated;

-- 4d. practice_problem_run_cases — the judge inputs for a global practice
--     problem. Server-only in practice (the website /api/practice/judge and
--     /api/practice/submit routes), premium-gated here. Returns visible examples
--     (hidden=false) and hidden test_cases (hidden=true); the routes drop hidden
--     input/expected from their responses.
create or replace function public.practice_problem_run_cases(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v record;
begin
  select dp.id, dp.examples, dp.test_cases, dp.is_premium
    into v
  from public.dsa_problems dp
  join public.dsa_topics dt on dt.id = dp.topic_id and dt.kind = 'practice'
  where dp.learning_topic_id is null
    and dp.slug is not null
    and lower(dp.slug) = lower(p_slug)
    and coalesce(dp.status, 'published') = 'published'
    and coalesce(dt.status, 'published') = 'published'
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  limit 1;

  if v.id is null then
    return null;
  end if;

  if coalesce(v.is_premium, false)
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
revoke all on function public.practice_problem_run_cases(text) from public;
grant execute on function public.practice_problem_run_cases(text) to anon, authenticated;

-- 4e. practice_problems_sitemap — published, platform-visible global practice
--     problem slugs + last-modified, for website/sitemap.ts.
create or replace function public.practice_problems_sitemap(p_platform text default 'website')
returns table (slug text, updated_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select dp.slug, dp.updated_at
  from public.dsa_problems dp
  join public.dsa_topics dt on dt.id = dp.topic_id and dt.kind = 'practice'
  where dp.learning_topic_id is null and dp.slug is not null
    and coalesce(dp.status, 'published') = 'published'
    and coalesce(dt.status, 'published') = 'published'
    and case p_platform
          when 'mobile' then coalesce(dp.show_on_mobile, true) and coalesce(dt.show_on_mobile, true)
          else coalesce(dp.show_on_website, true) and coalesce(dt.show_on_website, true)
        end
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  order by dp.slug;
$$;
revoke all on function public.practice_problems_sitemap(text) from public;
grant execute on function public.practice_problems_sitemap(text) to anon, authenticated;

-- ===========================================================================
-- 5. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='dsa_topics' and column_name='kind') then
    raise exception 'validation: dsa_topics.kind missing';
  end if;
  if exists (select 1 from public.dsa_topics where kind is null) then
    raise exception 'validation: dsa_topics.kind has NULLs';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'dsa_topics_kind_chk') then
    raise exception 'validation: dsa_topics_kind_chk missing';
  end if;
  if to_regclass('public.coding_submissions') is null then
    raise exception 'validation: coding_submissions table missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='dsa_problems_practice_slug_key') then
    raise exception 'validation: dsa_problems_practice_slug_key missing';
  end if;
  if to_regprocedure('public.practice_categories(text)') is null
     or to_regprocedure('public.practice_problems_list(text, text, text, text, integer, integer)') is null
     or to_regprocedure('public.practice_problem_detail(text, text)') is null
     or to_regprocedure('public.practice_problem_run_cases(text)') is null
     or to_regprocedure('public.practice_problems_sitemap(text)') is null then
    raise exception 'validation: one or more practice RPCs missing';
  end if;

  raise notice '0072 OK: dsa_topics.kind + show flags, coding_submissions + RLS, 2 practice slug indexes, 5 read RPCs live.';
end $$;

notify pgrst, 'reload schema';

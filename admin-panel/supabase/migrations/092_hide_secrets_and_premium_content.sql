-- ============================================================================
-- 0120_hide_secrets_and_premium_content.sql   (twin: admin-panel 092, byte-identical)
-- ============================================================================
-- Purpose : stop the judge's hidden data and premium content leaking to anon /
--           normal signed-in users. Idempotent; safe to re-run; twin is a no-op.
-- Audit   : DB-05 (dsa_problems test_cases/solution_code + *_run_cases),
--           DB-10 (practice_test_questions premium bypass + answer key to anon),
--           DB-11 (prep_notes premium content readable by anon),
--           DB-13 (draft jobs / unpublished projects public; see block below),
--           + owner decisions: locked premium notes (RPCs), solution_code gated on a
--           submission (record_coding_submission RPC), wishlist tombstones (my_wishlist RPC).
--
-- ADDING A dsa_problems COLUMN LATER  (READ THIS, authors!)
--   anon/authenticated only hold column-level SELECT (all columns except test_cases and
--   solution_code). A column added after this migration is NOT readable by them, so every
--   `select ...,new_col` from the apps fails with "permission denied". After the ALTER TABLE run,
--   in the SQL editor (as postgres / owner):
--       select public.regrant_dsa_problems_client_columns();
--   (regrant is idempotent; test 208 + checks/batch_a_db2_checks.sql flag a missing grant.)
--
-- DB-05 design decisions
--   * Table dsa_problems is read DIRECTLY by the website (submit routes look up
--     `id` by slug; sitemap reads slug/examples/constraints/starter_code), so
--     an admin-only row policy would break them. Instead: COLUMN-level SELECT.
--     Table-level SELECT is revoked from anon+authenticated and re-granted on
--     every column EXCEPT test_cases and solution_code. Row policies unchanged.
--   * The admin panel runs as `authenticated`, so it gets a definer RPC
--     admin_dsa_problem_secrets(text[]) (is_admin-gated) to READ the two
--     columns. Admin INSERT/UPDATE of those columns is unaffected (write
--     privileges untouched; admin code never `.select()`s them after a write).
--   * Consequence: `select *` on dsa_problems now fails for anon/authenticated
--     (permission denied) -- name columns explicitly. A column ADDED LATER is not
--     readable by anon/authenticated until you re-run this file's grant block
--     (or `grant select (col) on public.dsa_problems to anon, authenticated`).
--   * *_run_cases RPCs become secret-gated (no service-role key needed): a
--     trailing p_secret checked against public.app_secrets['judge_rpc'].
--     Old one-arg signatures are renamed to internal _..._impl (EXECUTE revoked
--     from everyone but the owner) so anon can no longer call the old form.
--   * *_problem_detail RPCs (coding_problem_detail, practice_problem_detail) return
--     solution_code ONLY to an admin or a caller with >= 1 coding_submissions row for
--     that problem (any verdict); everyone else gets {} plus `solution_locked: true`
--     (UI: "Submit an attempt to unlock the solution"). editorial / hints /
--     solution_approach are unchanged (owner scope: code only). To stop users faking a
--     submission row, clients no longer INSERT coding_submissions directly: the insert
--     policy is dropped and the website submit routes call record_coding_submission(),
--     which needs the judge secret (server-only) and runs as the calling user.
--
-- Owner one-liner after applying (choose a long random secret, put the same value
-- in the website env JUDGE_RPC_SECRET):
--   insert into public.app_secrets(name, secret_hash)
--   values ('judge_rpc', encode(extensions.digest('<the same secret>','sha256'),'hex'))
--   on conflict (name) do update set secret_hash = excluded.secret_hash;
-- Until that row exists the judge RPCs deny everything (fail closed).
-- ============================================================================

do $$
begin
  if to_regprocedure('extensions.digest(bytea,text)') is null then
    raise exception '0120 requires pgcrypto in schema "extensions" (extensions.digest missing)';
  end if;
  if to_regprocedure('public.is_admin(uuid)') is null then
    raise exception '0120 requires public.is_admin(uuid)';
  end if;
end $$;

-- ---- app secrets -----------------------------------------------------------
create table if not exists public.app_secrets (
  name        text primary key,
  secret_hash text not null
);
alter table public.app_secrets enable row level security;   -- NO policies on purpose
revoke all on public.app_secrets from public, anon, authenticated;

create or replace function public._check_app_secret(p_name text, p_secret text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_hash text;
begin
  if p_name is null or p_secret is null or length(p_secret) = 0 then
    return false;
  end if;
  select secret_hash into v_hash from public.app_secrets where name = p_name;
  if v_hash is null or length(v_hash) = 0 then
    return false;
  end if;
  -- compare digests of both sides: fixed-length, no early exit on the secret's own bytes
  return extensions.digest(convert_to(lower(v_hash), 'utf8'), 'sha256')
       = extensions.digest(convert_to(encode(extensions.digest(convert_to(p_secret, 'utf8'), 'sha256'), 'hex'), 'utf8'), 'sha256');
end;
$$;
revoke all on function public._check_app_secret(text, text) from public, anon, authenticated;

-- ---- DB-05: dsa_problems column privileges ---------------------------------
-- Plain (NOT security definer) helper: run it as the table owner in the SQL editor. It is
-- not executable by anon/authenticated, so it cannot be used to widen anything from the API.
create or replace function public.regrant_dsa_problems_client_columns()
returns text
language plpgsql
as $$
declare
  v_cols text;
begin
  if to_regclass('public.dsa_problems') is null then
    return 'public.dsa_problems absent - nothing to do';
  end if;
  select string_agg(quote_ident(attname), ', ' order by attnum) into v_cols
    from pg_attribute
   where attrelid = 'public.dsa_problems'::regclass
     and attnum > 0 and not attisdropped
     and attname not in ('test_cases', 'solution_code');
  execute 'revoke select on public.dsa_problems from anon, authenticated';
  execute format('grant select (%s) on public.dsa_problems to anon, authenticated', v_cols);
  return 'granted select on: ' || v_cols;
end;
$$;
revoke all on function public.regrant_dsa_problems_client_columns() from public, anon, authenticated;

select public.regrant_dsa_problems_client_columns();

create or replace function public.admin_dsa_problem_secrets(p_ids text[])
returns table (id text, test_cases jsonb, solution_code jsonb)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select dp.id, dp.test_cases, dp.solution_code
      from public.dsa_problems dp
     where dp.id = any (coalesce(p_ids, '{}'::text[]));
end;
$$;
revoke all on function public.admin_dsa_problem_secrets(text[]) from public, anon;
grant execute on function public.admin_dsa_problem_secrets(text[]) to authenticated;

-- ---- DB-05: secret-gated run_cases ------------------------------------------
do $$
begin
  if to_regclass('public.dsa_problems') is null then
    return;
  end if;

  -- coding_problem_run_cases(text) -> internal impl
  if to_regprocedure('public.coding_problem_run_cases(text)') is not null then
    drop function if exists public._coding_problem_run_cases_impl(text);
    alter function public.coding_problem_run_cases(text) rename to _coding_problem_run_cases_impl;
  end if;
  if to_regprocedure('public._coding_problem_run_cases_impl(text)') is null then
    raise exception '0120: coding_problem_run_cases missing - cannot secure judge data';
  end if;

  if to_regprocedure('public.practice_problem_run_cases(text)') is not null then
    drop function if exists public._practice_problem_run_cases_impl(text);
    alter function public.practice_problem_run_cases(text) rename to _practice_problem_run_cases_impl;
  end if;
  if to_regprocedure('public._practice_problem_run_cases_impl(text)') is null then
    raise exception '0120: practice_problem_run_cases missing - cannot secure judge data';
  end if;
end $$;

revoke all on function public._coding_problem_run_cases_impl(text)  from public, anon, authenticated;
revoke all on function public._practice_problem_run_cases_impl(text) from public, anon, authenticated;

create or replace function public.coding_problem_run_cases(p_slug text, p_secret text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public._check_app_secret('judge_rpc', p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public._coding_problem_run_cases_impl(p_slug);
end;
$$;

create or replace function public.practice_problem_run_cases(p_slug text, p_secret text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public._check_app_secret('judge_rpc', p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public._practice_problem_run_cases_impl(p_slug);
end;
$$;

revoke all on function public.coding_problem_run_cases(text, text)  from public;
revoke all on function public.practice_problem_run_cases(text, text) from public;
grant execute on function public.coding_problem_run_cases(text, text)  to anon, authenticated;
grant execute on function public.practice_problem_run_cases(text, text) to anon, authenticated;

-- ---- DB-05b: solution_code gating + submission recording -----------------------
-- (7b) Who may see solution_code: admin, or a caller who has recorded >= 1 submission
-- (any verdict) for that problem. Internal helper (owner-only EXECUTE; the definer detail
-- RPCs below call it as the owner).
create or replace function public._can_view_solution(p_problem_id text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
     and (
       coalesce(public.is_admin(auth.uid()), false)
       or exists (select 1 from public.coding_submissions cs
                   where cs.user_id = auth.uid() and cs.problem_id = p_problem_id)
     );
$$;
revoke all on function public._can_view_solution(text) from public, anon, authenticated;

-- coding_problem_detail / practice_problem_detail: same shape as 0048 / 0072 plus
-- gated `solution_code` and a new `solution_locked` boolean.
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
  v_can  boolean;
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

  -- solution code only after the caller has recorded >=1 submission for this problem (any verdict) or is admin
  v_can := public._can_view_solution(v.id);

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
    'solution_code', case when v_lock or not v_can then '{}'::jsonb else coalesce(v.solution_code, '{}'::jsonb) end,
    -- true when a solution exists but is withheld until the caller submits an attempt (UI: "Submit an attempt to unlock")
    'solution_locked', (not v_lock) and (not v_can) and coalesce(v.solution_code, '{}'::jsonb) <> '{}'::jsonb,
    'solution_approach', case when v_lock then '' else coalesce(v.solution_approach, '') end
  );
end;
$$;
revoke all on function public.coding_problem_detail(text, text) from public;
grant execute on function public.coding_problem_detail(text, text) to anon, authenticated;

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
  v_can  boolean;
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

  -- solution code only after the caller has recorded >=1 submission for this problem (any verdict) or is admin
  v_can := public._can_view_solution(v.id);

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
    'solution_code', case when v_lock or not v_can then '{}'::jsonb else coalesce(v.solution_code, '{}'::jsonb) end,
    -- true when a solution exists but is withheld until the caller submits an attempt (UI: "Submit an attempt to unlock")
    'solution_locked', (not v_lock) and (not v_can) and coalesce(v.solution_code, '{}'::jsonb) <> '{}'::jsonb,
    'solution_approach', case when v_lock then '' else coalesce(v.solution_approach, '') end
  );
end;
$$;
revoke all on function public.practice_problem_detail(text, text) from public;
grant execute on function public.practice_problem_detail(text, text) to anon, authenticated;

-- Clients can no longer insert submissions directly (a user could otherwise insert a fake row
-- to unlock the solution). The website submit routes (and therefore the mobile app, which calls
-- them) record the attempt through this RPC; it needs the server-only judge secret, so only the
-- server that actually ran the code can record a verdict. It runs as the calling user (auth.uid()).
do $$
begin
  if to_regclass('public.coding_submissions') is not null then
    drop policy if exists "coding_submissions_insert_own" on public.coding_submissions;
    revoke insert, update, delete on public.coding_submissions from anon, authenticated;
  end if;
end $$;

create or replace function public.record_coding_submission(
  p_secret     text,
  p_problem_id text,
  p_slug       text,
  p_language   text,
  p_source     text,
  p_verdict    text,
  p_passed     integer,
  p_total      integer,
  p_runtime_ms integer default null,
  p_memory_kb  integer default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'sign in required' using errcode = '42501';
  end if;
  if not public._check_app_secret('judge_rpc', p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(public.is_active_user(v_uid), false) is not true then
    raise exception 'account not active' using errcode = '42501';
  end if;
  if p_verdict is null or p_verdict not in ('accepted','wrong_answer','compile_error','runtime_error','time_limit_exceeded','error')
     or coalesce(p_passed, -1) < 0 or coalesce(p_total, -1) < 0 or p_passed > p_total
     or p_source is null or length(p_source) = 0 or length(p_source) > 600000
     or p_language is null or length(p_language) > 40 then
    raise exception 'invalid submission' using errcode = '22023';
  end if;
  if not exists (select 1 from public.dsa_problems dp
                  where dp.id = p_problem_id and lower(dp.slug) = lower(coalesce(p_slug, ''))) then
    raise exception 'unknown problem' using errcode = '22023';
  end if;

  insert into public.coding_submissions
    (user_id, problem_id, problem_slug, language, source_code, verdict, passed, total, runtime_ms, memory_kb)
  values
    (v_uid, p_problem_id, lower(p_slug), p_language, p_source, p_verdict, p_passed, p_total, p_runtime_ms, p_memory_kb)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.record_coding_submission(text, text, text, text, text, text, integer, integer, integer, integer) from public, anon;
grant execute on function public.record_coding_submission(text, text, text, text, text, text, integer, integer, integer, integer) to authenticated;

-- ---- DB-10: practice_test_questions ----------------------------------------
-- Same return shape. Premium owner tests / premium owner topics are excluded
-- unless the caller is premium or admin; a premium chapter/course test itself
-- returns [] to non-premium callers; anon gets no correct_index / explanation
-- (both websites and the app grade server-side via submit_*_attempt).
create or replace function public.practice_test_questions(p_test_id text, p_platform text default 'website')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v       record;
  v_web   boolean := (coalesce(p_platform,'website') <> 'mobile');
  v_limit int;
  v_uid   uuid := auth.uid();
  v_priv  boolean := false;
begin
  if v_uid is not null then
    v_priv := coalesce(public.current_user_is_premium(), false) or coalesce(public.is_admin(v_uid), false);
  end if;

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

  if coalesce(v.is_premium, false) and not v_priv then
    return '[]'::jsonb;
  end if;

  v_limit := greatest(coalesce(v.question_limit, 20), 1);

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', tq.id, 'question_text', tq.question_text, 'options', tq.options,
             'correct_index', case when v_uid is null then null else tq.correct_index end,
             'explanation',   case when v_uid is null then null else tq.explanation end,
             'marks', q.marks
           ))
    from (
      select pool.id, pool.marks
        from public.practice_test_pool(p_test_id) pool
        join public.test_questions tq2 on tq2.id = pool.id
        join public.practice_tests own on own.id = tq2.test_id
        left join public.learning_topics lt on lt.id = own.learning_topic_id
       where v_priv or (not coalesce(own.is_premium, false) and not coalesce(lt.is_premium, false))
       order by random() limit v_limit
    ) q
    join public.test_questions tq on tq.id = q.id
  ), '[]'::jsonb);
end;
$$;

-- ---- DB-11: prep_notes premium gate ----------------------------------------
-- TABLE (holds `content`): anon: published AND not premium. authenticated: published +
-- audience rule + (not premium OR premium user), or admin. So a non-premium user can never
-- SELECT the content of a premium row from the table.
-- LOCKED LISTING (owner decision 7a): free / anon users still see premium notes as locked
-- entries via SECURITY DEFINER RPCs that return list-safe columns + `locked`, never `content`
-- or `file_url` of a locked note: prep_notes_public_list(...) and prep_note_get(uuid).
do $$
begin
  if to_regclass('public.prep_notes') is null then
    return;
  end if;
  drop policy if exists "prep_notes_select_anon" on public.prep_notes;
  create policy "prep_notes_select_anon" on public.prep_notes
    for select to anon
    using (is_published = true and not is_premium);

  drop policy if exists "prep_notes_select_published" on public.prep_notes;
  create policy "prep_notes_select_published" on public.prep_notes
    for select to authenticated
    using (
      (is_published = true
        and public.content_visible_to_current_user(target_type, target_course_id, target_branch_ids)
        and (not is_premium or public.current_user_is_premium()))
      or public.is_admin(auth.uid())
    );
end $$;

create or replace function public.prep_notes_public_list(
  p_category text    default null,
  p_limit    integer default 50,
  p_offset   integer default 0
)
returns table (
  id            uuid,
  title         text,
  category      text,
  topic         text,
  tags          text[],
  thumbnail_url text,
  is_premium    boolean,
  created_at    timestamptz,
  locked        boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_priv boolean := false;
begin
  if to_regclass('public.prep_notes') is null then
    return;
  end if;
  if v_uid is not null then
    v_priv := coalesce(public.current_user_is_premium(), false) or coalesce(public.is_admin(v_uid), false);
  end if;
  return query
    select n.id, n.title, n.category, n.topic, n.tags, n.thumbnail_url, n.is_premium, n.created_at,
           (n.is_premium and not v_priv) as locked
      from public.prep_notes n
     where n.is_published = true
       and (p_category is null or n.category = p_category)
       and (coalesce(public.is_admin(v_uid), false)
            or public.content_visible_to_current_user(n.target_type, n.target_course_id, n.target_branch_ids))
     order by n.created_at desc, n.id
     limit least(greatest(coalesce(p_limit, 50), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;
revoke all on function public.prep_notes_public_list(text, integer, integer) from public;
grant execute on function public.prep_notes_public_list(text, integer, integer) to anon, authenticated;

-- One note. Returns NULL when it does not exist / is not visible to the caller. `content` and
-- `file_url` are NULL while `locked` is true.
create or replace function public.prep_note_get(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_priv boolean := false;
  n      record;
begin
  if to_regclass('public.prep_notes') is null then
    return null;
  end if;
  if v_uid is not null then
    v_priv := coalesce(public.current_user_is_premium(), false) or coalesce(public.is_admin(v_uid), false);
  end if;
  select * into n from public.prep_notes x
   where x.id = p_id and x.is_published = true
     and (coalesce(public.is_admin(v_uid), false)
          or public.content_visible_to_current_user(x.target_type, x.target_course_id, x.target_branch_ids));
  if n.id is null then
    return null;
  end if;
  return jsonb_build_object(
    'id', n.id, 'title', n.title, 'category', n.category, 'topic', n.topic, 'tags', to_jsonb(n.tags),
    'thumbnail_url', n.thumbnail_url, 'is_premium', n.is_premium, 'created_at', n.created_at,
    'locked', (n.is_premium and not v_priv),
    'content',  case when n.is_premium and not v_priv then null else n.content end,
    'file_url', case when n.is_premium and not v_priv then null else n.file_url end
  );
end;
$$;
revoke all on function public.prep_note_get(uuid) from public;
grant execute on function public.prep_note_get(uuid) to anon, authenticated;

-- ---- DB-13: hide draft jobs / unpublished projects --------------------------
-- Supersedes mobile-app/supabase/proposed/jobs_hide_drafts.sql (left in place, do not apply).
-- jobs (status open|closed|draft): non-admins never see 'draft'; open + closed stay visible
--   (saved/applied lists, "no longer accepting applications"). An applicant / saver keeps
--   seeing a job of theirs even if it is later moved back to draft.
-- projects (status draft|published|archived): anon sees published only; signed-in users see
--   published, PLUS any project they hold a successful purchase of (so My Projects joins never
--   go null). Audience targeting is preserved exactly.
--   WISHLIST (owner decision 7c): there is deliberately NO wishlist carve-out on the table any
--   more (wishlists.insert only needs a project id, so a carve-out would let anyone read a
--   draft's full row by wishlisting it). The wishlist screens use my_wishlist(), a definer RPC
--   that returns card columns for available projects and only {project_id, available:false}
--   ("No longer available" tombstone) otherwise. Available = published+visible, or purchased.
-- Admins keep every row through the existing *_admin_all (FOR ALL is_admin) policies.
do $$
begin
  if to_regclass('public.jobs') is not null then
    drop policy if exists "jobs_select_public" on public.jobs;
    drop policy if exists "jobs_select_anon" on public.jobs;
    drop policy if exists "jobs_select_visible_authenticated" on public.jobs;
    drop policy if exists "jobs_select_visible_anon" on public.jobs;

    create policy "jobs_select_visible_authenticated" on public.jobs
      for select to authenticated
      using (
        public.content_visible_to_current_user(target_type, target_course_id, target_branch_ids)
        and (
          status <> 'draft'
          or exists (select 1 from public.applications a where a.job_id = jobs.id and a.user_id = auth.uid())
          or exists (select 1 from public.saved_jobs s where s.job_id = jobs.id and s.user_id = auth.uid())
        )
      );
    create policy "jobs_select_visible_anon" on public.jobs
      for select to anon
      using (status <> 'draft');
    -- Admin visibility of every row. Never (re)create a blanket FOR ALL here: 0119
    -- splits *_admin_all into select + has_permission() write policies and a
    -- blanket ALL would silently undo DB-07. Only a SELECT policy is added, and
    -- only when neither the legacy ALL policy nor 0119's split select exists.
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='jobs'
                    and policyname in ('jobs_admin_all', 'jobs_admin_select')) then
      create policy "jobs_admin_select" on public.jobs for select
        using (public.is_admin(auth.uid()));
    end if;
  end if;

  if to_regclass('public.projects') is not null then
    drop policy if exists "projects_select_public" on public.projects;
    drop policy if exists "projects_select_anon" on public.projects;
    drop policy if exists "projects_select_visible_authenticated" on public.projects;
    drop policy if exists "projects_select_visible_anon" on public.projects;

    create policy "projects_select_visible_authenticated" on public.projects
      for select to authenticated
      using (
        public.content_visible_to_current_user(target_type, target_course_id, target_branch_ids)
        and (
          status = 'published'
          or exists (select 1 from public.purchases pu
                      where pu.project_id = projects.id and pu.user_id = auth.uid() and pu.status = 'success')
        )
      );
    create policy "projects_select_visible_anon" on public.projects
      for select to anon
      using (status = 'published');
    -- Admin visibility of every row. Never (re)create a blanket FOR ALL here: 0119
    -- splits *_admin_all into select + has_permission() write policies and a
    -- blanket ALL would silently undo DB-07. Only a SELECT policy is added, and
    -- only when neither the legacy ALL policy nor 0119's split select exists.
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects'
                    and policyname in ('projects_admin_all', 'projects_admin_select')) then
      create policy "projects_admin_select" on public.projects for select
        using (public.is_admin(auth.uid()));
    end if;
  end if;
end $$;

-- ---- DB-13b: my_wishlist() ---------------------------------------------------
create or replace function public.my_wishlist()
returns table (
  project_id     text,
  available      boolean,
  title          text,
  category_id    text,
  category_name  text,
  tech_stack     text[],
  price          numeric,
  rating         numeric,
  review_count   integer,
  thumbnail_url  text,
  is_premium     boolean,
  is_best_seller boolean,
  sales_count    integer,
  created_at     timestamptz,
  wishlisted_at  timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select w.project_id,
         a.ok,
         case when a.ok then p.title end,
         case when a.ok then p.category_id end,
         case when a.ok then p.category_name end,
         case when a.ok then p.tech_stack end,
         case when a.ok then p.price end,
         case when a.ok then p.rating end,
         case when a.ok then p.review_count end,
         case when a.ok then p.thumbnail_url end,
         case when a.ok then p.is_premium end,
         case when a.ok then p.is_best_seller end,
         case when a.ok then p.sales_count end,
         case when a.ok then p.created_at end,
         w.created_at
    from public.wishlists w
    left join public.projects p on p.id = w.project_id
    cross join lateral (
      select (p.id is not null and (
               (p.status = 'published'
                and public.content_visible_to_current_user(p.target_type, p.target_course_id, p.target_branch_ids))
               or exists (select 1 from public.purchases pu
                           where pu.project_id = p.id and pu.user_id = auth.uid() and pu.status = 'success')
             )) as ok
    ) a
   where w.user_id = auth.uid()
   order by w.created_at desc
   limit 100;
$$;
revoke all on function public.my_wishlist() from public, anon;
grant execute on function public.my_wishlist() to authenticated;

notify pgrst, 'reload schema';

-- ---- ROLLBACK (manual) -------------------------------------------------------
-- grant select on public.dsa_problems to anon, authenticated;
-- drop function public.regrant_dsa_problems_client_columns();
-- drop function public.coding_problem_run_cases(text, text);
-- alter function public._coding_problem_run_cases_impl(text) rename to coding_problem_run_cases;
-- grant execute on function public.coding_problem_run_cases(text) to anon, authenticated;
-- (same two lines for practice_problem_run_cases)
-- drop function public.admin_dsa_problem_secrets(text[]);
-- drop function public._check_app_secret(text, text); drop table public.app_secrets;
-- solution gating: re-run the coding_problem_detail definition of 0048 and practice_problem_detail of 0072
--   (they return solution_code unconditionally when not premium-locked); then
--   drop function public.record_coding_submission(text,text,text,text,text,text,integer,integer,integer,integer);
--   drop function public._can_view_solution(text);
--   grant insert on public.coding_submissions to authenticated;
--   create policy "coding_submissions_insert_own" on public.coding_submissions for insert with check (auth.uid() = user_id);
--   (and switch the two website submit routes back to a direct insert)
-- prep_notes: drop function public.prep_notes_public_list(text,integer,integer); drop function public.prep_note_get(uuid);
--   recreate the two policies with only `is_published = true` (+ audience for authenticated)
-- jobs/projects: drop the *_select_visible_* policies, recreate jobs_select_public/_anon + projects_select_public/_anon
--   (M:0036/0041 definitions: content_visible_to_current_user(...) for public, `true` for anon).
-- wishlist: drop function public.my_wishlist(); (apps: revert to the wishlists->projects join, re-add the
--   wishlist exists() carve-out to projects_select_visible_authenticated - NOT recommended, leaks drafts)
-- practice_test_questions: re-run the definition from admin 063 (A:063:278-313).

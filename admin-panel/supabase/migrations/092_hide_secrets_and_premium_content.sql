-- ============================================================================
-- 0120_hide_secrets_and_premium_content.sql   (twin: admin-panel 092, byte-identical)
-- ============================================================================
-- Purpose : stop the judge's hidden data and premium content leaking to anon /
--           normal signed-in users. Idempotent; safe to re-run; twin is a no-op.
-- Audit   : DB-05 (dsa_problems test_cases/solution_code + *_run_cases),
--           DB-10 (practice_test_questions premium bypass + answer key to anon),
--           DB-11 (prep_notes premium content readable by anon),
--           DB-13 (draft jobs / unpublished projects public; see block below).
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
--   * *_problem_detail RPCs still return solution_code for UNLOCKED problems
--     (product feature: Solution tab). Owner decision if that should change.
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
do $$
declare
  v_cols text;
begin
  if to_regclass('public.dsa_problems') is null then
    raise notice '0120: public.dsa_problems absent - DB-05 table part skipped';
    return;
  end if;
  select string_agg(quote_ident(attname), ', ' order by attnum) into v_cols
    from pg_attribute
   where attrelid = 'public.dsa_problems'::regclass
     and attnum > 0 and not attisdropped
     and attname not in ('test_cases', 'solution_code');
  execute 'revoke select on public.dsa_problems from anon, authenticated';
  execute format('grant select (%s) on public.dsa_problems to anon, authenticated', v_cols);
end $$;

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
-- anon: published AND not premium. authenticated: published + audience rule +
-- (not premium OR premium user), or admin. (Trade-off: premium notes are now
-- absent from lists for free users, not shown-as-locked.)
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

-- ---- DB-13: hide draft jobs / unpublished projects --------------------------
-- Supersedes mobile-app/supabase/proposed/jobs_hide_drafts.sql (left in place, do not apply).
-- jobs (status open|closed|draft): non-admins never see 'draft'; open + closed stay visible
--   (saved/applied lists, "no longer accepting applications"). An applicant / saver keeps
--   seeing a job of theirs even if it is later moved back to draft.
-- projects (status draft|published|archived): anon sees published only; signed-in users see
--   published, PLUS any project they hold a successful purchase of or wishlisted (so
--   My Projects / wishlist joins never go null). Audience targeting is preserved exactly.
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
          or exists (select 1 from public.wishlists w
                      where w.project_id = projects.id and w.user_id = auth.uid())
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

notify pgrst, 'reload schema';

-- ---- ROLLBACK (manual) -------------------------------------------------------
-- grant select on public.dsa_problems to anon, authenticated;
-- drop function public.coding_problem_run_cases(text, text);
-- alter function public._coding_problem_run_cases_impl(text) rename to coding_problem_run_cases;
-- grant execute on function public.coding_problem_run_cases(text) to anon, authenticated;
-- (same two lines for practice_problem_run_cases)
-- drop function public.admin_dsa_problem_secrets(text[]);
-- drop function public._check_app_secret(text, text); drop table public.app_secrets;
-- prep_notes: recreate the two policies with only `is_published = true` (+ audience for authenticated)
-- jobs/projects: drop the *_select_visible_* policies, recreate jobs_select_public/_anon + projects_select_public/_anon
--   (M:0036/0041 definitions: content_visible_to_current_user(...) for public, `true` for anon).
-- practice_test_questions: re-run the definition from admin 063 (A:063:278-313).

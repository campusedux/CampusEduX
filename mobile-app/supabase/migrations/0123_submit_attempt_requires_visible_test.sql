-- ============================================================================
-- 0123_submit_attempt_requires_visible_test.sql   (twin: admin-panel 095, byte-identical)
-- ============================================================================
-- Purpose : submit_test_attempt() and submit_randomized_test_attempt() only checked
--           that the test EXISTS, so a hidden test (unpublished, archived, turned off
--           on both website and mobile, or targeted at another course/branch/year)
--           still accepted attempts through a direct RPC call. Both now require the
--           test to be visible under the same rule as the practice_tests_select_public
--           read policy, and answer a hidden test exactly like a missing one
--           ('Test % not found', no_data_found), so no client change is needed.
-- Scope   : only the test lookup changes. Both bodies are otherwise verbatim from
--           0118 (blocked-user guard, scoring, answer rows). Existing attempts,
--           scores and answers are untouched. Premium gating is out of scope.
-- Order   : after 0118/090 (Batch A), which introduced is_active_user().
-- Idempotent (CREATE OR REPLACE); the twin re-apply is a no-op.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.submit_test_attempt(p_test_id text, p_answers jsonb, p_time_taken_seconds integer)
 RETURNS test_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid         uuid := auth.uid();
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

  -- DB-04: blocked / suspended accounts cannot write.
  if not public.is_active_user(v_uid) then
    raise exception 'Your account is blocked. Contact support.'
      using errcode = 'insufficient_privilege';
  end if;

  -- 0123: a test students cannot see takes no new attempts (same rule as the
  -- practice_tests_select_public read policy); same error as a missing test.
  if not exists (
    select 1 from public.practice_tests pt
    where pt.id = p_test_id
      and coalesce(pt.status, 'published') = 'published'
      and (coalesce(pt.show_on_website, true) or coalesce(pt.show_on_mobile, true))
      and public.learning_row_visible(pt.target_type, pt.target_course_id, pt.target_branch_ids, pt.target_year_id)
  ) then
    raise exception 'Test % not found', p_test_id using errcode = 'no_data_found';
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'p_answers must be a JSON array'
      using errcode = 'invalid_parameter_value';
  end if;

  with q as (
    select
      tq.id,
      tq.marks,
      tq.correct_index,
      (
        select (a.value ->> 'selected_index')::int
        from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
        where a.value ->> 'question_id' = tq.id
        limit 1
      ) as selected_index
    from public.test_questions tq
    where tq.test_id = p_test_id
  )
  select
    count(*),
    coalesce(sum(marks), 0),
    coalesce(sum(marks) filter (where selected_index is not null and selected_index = correct_index), 0),
    count(*) filter (where selected_index is not null and selected_index = correct_index)
  into v_qcount, v_total_marks, v_score, v_correct
  from q;

  insert into public.test_attempts
    (user_id, test_id, score, total_marks, correct_count, incorrect_count, time_taken_seconds)
  values
    (v_uid, p_test_id, v_score, v_total_marks, v_correct,
     greatest(v_qcount - v_correct, 0),
     greatest(coalesce(p_time_taken_seconds, 0), 0))
  returning * into v_attempt;

  insert into public.test_attempt_answers (attempt_id, question_id, selected_index, is_correct)
  select
    v_attempt.id,
    tq.id,
    sel.selected_index,
    coalesce(sel.selected_index is not null and sel.selected_index = tq.correct_index, false)
  from public.test_questions tq
  cross join lateral (
    select (
      select (a.value ->> 'selected_index')::int
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
      where a.value ->> 'question_id' = tq.id
      limit 1
    ) as selected_index
  ) sel
  where tq.test_id = p_test_id
  on conflict (attempt_id, question_id) do nothing;

  return v_attempt;
end;
$function$;
CREATE OR REPLACE FUNCTION public.submit_randomized_test_attempt(p_test_id text, p_question_ids text[], p_answers jsonb, p_time_taken_seconds integer)
 RETURNS test_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- DB-04: blocked / suspended accounts cannot write.
  if not public.is_active_user(v_uid) then
    raise exception 'Your account is blocked. Contact support.'
      using errcode = 'insufficient_privilege';
  end if;

  -- 0123: a test students cannot see takes no new attempts (same rule as the
  -- practice_tests_select_public read policy); same error as a missing test.
  select exists(
    select 1 from public.practice_tests pt
    where pt.id = p_test_id and coalesce(pt.scope, 'topic') in ('chapter','course')
      and coalesce(pt.status, 'published') = 'published'
      and (coalesce(pt.show_on_website, true) or coalesce(pt.show_on_mobile, true))
      and public.learning_row_visible(pt.target_type, pt.target_course_id, pt.target_branch_ids, pt.target_year_id)
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
$function$;

revoke all on function public.submit_test_attempt(text, jsonb, integer) from public, anon;
grant execute on function public.submit_test_attempt(text, jsonb, integer) to authenticated;
revoke all on function public.submit_randomized_test_attempt(text, text[], jsonb, integer) from public, anon;
grant execute on function public.submit_randomized_test_attempt(text, text[], jsonb, integer) to authenticated;

-- ---- ROLLBACK (manual) -------------------------------------------------------
-- Re-run the two function definitions from 0118_profiles_guard_and_blocked_enforcement.sql
-- (CREATE OR REPLACE FUNCTION public.submit_test_attempt / submit_randomized_test_attempt).

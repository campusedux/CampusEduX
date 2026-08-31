-- ============================================================================
-- 0040_test_attempt_scoring.sql — score practice tests on the server
-- ============================================================================
-- test_attempts_insert_own (0017) only checks `auth.uid() = user_id`, so a
-- client can POST any score / correct_count / total_marks:
--     INSERT /rest/v1/test_attempts { user_id:<self>, score:9999, total_marks:9999 }
-- Those numbers feed the student dashboard, performance analysis and the
-- company leaderboards. No money / entitlement is at stake, but the analytics
-- are trivially forgeable.
--
-- Fix: public.submit_test_attempt(p_test_id, p_answers, p_time_taken_seconds) —
-- SECURITY DEFINER. It recomputes score / counts from test_questions.correct_index
-- + marks (the answer key), inserts the attempt and one answer row per question
-- with a server-decided is_correct, and returns the attempt. The client-sent
-- score is never trusted.
--
-- p_answers shape:  [{ "question_id": "tq-1", "selected_index": 2 }, ...]
-- Unanswered questions (no entry, or null selected_index) count as incorrect,
-- matching the previous client behaviour.
--
-- The client INSERT policies are dropped so this RPC is the only write path;
-- the SELECT policies (own attempts / own answers) are left untouched.
-- correct_index stays readable on test_questions exactly as before (0016 note) —
-- what this migration protects is the *recorded* result.
--
-- Additive · guarded · idempotent · re-runnable.
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

create or replace function public.submit_test_attempt(
  p_test_id            text,
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

  if not exists (select 1 from public.practice_tests where id = p_test_id) then
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
$$;

revoke all on function public.submit_test_attempt(text, jsonb, integer) from public, anon;
grant execute on function public.submit_test_attempt(text, jsonb, integer) to authenticated;

-- submit_test_attempt() is now the only client path to a test result.
drop policy if exists "test_attempts_insert_own" on public.test_attempts;
drop policy if exists "test_attempt_answers_insert_via_parent" on public.test_attempt_answers;

notify pgrst, 'reload schema';

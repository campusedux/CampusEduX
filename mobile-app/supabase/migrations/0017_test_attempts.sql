-- Fixes: GET /rest/v1/test_attempts        -> 404 PGRST205
--        GET /rest/v1/test_attempt_answers  -> 404 PGRST205
--
-- src/services/placement.service.ts:
--   submitTestAttempt(): test_attempts.insert { user_id, test_id, score,
--                          total_marks, correct_count, incorrect_count,
--                          time_taken_seconds } returning "id, created_at"
--                        test_attempt_answers.insert [{ attempt_id, question_id,
--                          selected_index, is_correct }]
--   getDashboardSummary(): select "score, total_marks".eq("user_id", uid)
--   getTestResult():       select "*, test:practice_tests(title)".eq("id", id)
--   getPerformanceAnalysis(): select "score, total_marks, created_at,
--                          test:practice_tests(title, category)"
--   getCompanyPerformance(): test:practice_tests!inner(...).eq("test.company_id", id)
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.test_attempts (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references public.profiles (id) on delete cascade,
  test_id            text        not null references public.practice_tests (id) on delete cascade,
  score              integer     not null default 0,
  total_marks        integer     not null default 0,
  correct_count      integer     not null default 0,
  incorrect_count    integer     not null default 0,
  time_taken_seconds integer     not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists test_attempts_user_id_idx on public.test_attempts (user_id, created_at);
create index if not exists test_attempts_test_id_idx  on public.test_attempts (test_id);

create table if not exists public.test_attempt_answers (
  id             uuid        primary key default gen_random_uuid(),
  attempt_id     uuid        not null references public.test_attempts (id) on delete cascade,
  question_id    text        not null,
  selected_index integer,
  is_correct     boolean     not null default false,
  created_at     timestamptz not null default now(),
  -- one answer per question per attempt (also makes seed.sql idempotent)
  unique (attempt_id, question_id)
);

create index if not exists test_attempt_answers_attempt_id_idx
  on public.test_attempt_answers (attempt_id);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'test_attempt_answers_attempt_id_question_id_key'
  ) then
    alter table public.test_attempt_answers
      add constraint test_attempt_answers_attempt_id_question_id_key unique (attempt_id, question_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   test_attempts:        read + create own (auth.uid() = user_id).
--   test_attempt_answers: no user_id column -> ownership via parent attempt.
-- ---------------------------------------------------------------------------
alter table public.test_attempts        enable row level security;
alter table public.test_attempt_answers enable row level security;

drop policy if exists "test_attempts_select_own" on public.test_attempts;
create policy "test_attempts_select_own"
  on public.test_attempts for select
  using (auth.uid() = user_id);

drop policy if exists "test_attempts_insert_own" on public.test_attempts;
create policy "test_attempts_insert_own"
  on public.test_attempts for insert
  with check (auth.uid() = user_id);

drop policy if exists "test_attempt_answers_select_via_parent" on public.test_attempt_answers;
create policy "test_attempt_answers_select_via_parent"
  on public.test_attempt_answers for select
  using (exists (
    select 1 from public.test_attempts a
    where a.id = test_attempt_answers.attempt_id and a.user_id = auth.uid()
  ));

drop policy if exists "test_attempt_answers_insert_via_parent" on public.test_attempt_answers;
create policy "test_attempt_answers_insert_via_parent"
  on public.test_attempt_answers for insert
  with check (exists (
    select 1 from public.test_attempts a
    where a.id = test_attempt_answers.attempt_id and a.user_id = auth.uid()
  ));

notify pgrst, 'reload schema';

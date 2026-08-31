-- Fixes: GET /rest/v1/practice_tests -> 404 PGRST205
--        GET /rest/v1/test_questions -> 404 PGRST205
--
-- `practice_tests` is the "mock tests" catalog (aptitude / logical / verbal /
-- hr / company-pattern). `test_questions` holds each test's MCQs.
--
-- src/services/placement.service.ts:
--   getPracticeTests(): select "*".order("created_at", desc)
--                       [.eq("category", c)] [.eq("company_id", id)]
--     mapTestRow(): id, title, category, company_id, question_count,
--                   duration_minutes, description
--   getTestDetail():   select "*".eq("id", id).single()
--   getTestQuestions(): test_questions.select("*").eq("test_id", id).order("sort_order")
--     mapQuestionRow(): id, question_text, options (jsonb array), correct_index,
--                       explanation, marks
--   getCompanies(): companies.select("... practice_tests(count)")  (company_id FK)
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.practice_tests (
  id               text        primary key,
  title            text        not null,
  category         text        not null default 'aptitude'
                     check (category in ('aptitude', 'logical', 'verbal', 'hr', 'company')),
  company_id       text        references public.companies (id) on delete cascade,
  question_count   integer     not null default 0,
  duration_minutes integer     not null default 0,
  description      text        not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists practice_tests_category_idx   on public.practice_tests (category, created_at desc);
create index if not exists practice_tests_company_id_idx  on public.practice_tests (company_id);

create table if not exists public.test_questions (
  id            text        primary key,
  test_id       text        not null references public.practice_tests (id) on delete cascade,
  question_text text        not null,
  options       jsonb       not null default '[]'::jsonb,
  correct_index integer     not null default 0,
  explanation   text        not null default '',
  marks         integer     not null default 1,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists test_questions_test_id_idx on public.test_questions (test_id, sort_order);

-- ---------------------------------------------------------------------------
-- Row Level Security — question catalog, world-readable; writes service role.
-- (The correct answer is exposed the same way it is in the sample data, since
--  the quiz is scored client-side in submitTestAttempt(); if that ever matters,
--  move scoring into an Edge Function and drop correct_index from this policy.)
-- ---------------------------------------------------------------------------
alter table public.practice_tests enable row level security;
alter table public.test_questions enable row level security;

drop policy if exists "practice_tests_select_public" on public.practice_tests;
create policy "practice_tests_select_public"
  on public.practice_tests for select
  using (true);

drop policy if exists "test_questions_select_public" on public.test_questions;
create policy "test_questions_select_public"
  on public.test_questions for select
  using (true);

drop trigger if exists practice_tests_set_updated_at on public.practice_tests;
create trigger practice_tests_set_updated_at
  before update on public.practice_tests
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

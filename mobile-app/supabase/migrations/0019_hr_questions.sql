-- Fixes: GET /rest/v1/hr_questions              -> 404 PGRST205
--        GET /rest/v1/user_favorite_questions    -> 404 PGRST205
--
-- `hr_questions` covers both the generic HR bank (company_id IS NULL) and the
-- company-specific bank (company_id set) — the client filters on company_id.
--
-- src/services/placement.service.ts:
--   getHRQuestions():      hr_questions.select("*").is("company_id", null)
--                          .order("category") [.eq("category", c)]
--   getCompanyQuestions(): hr_questions.select("*").eq("company_id", id)
--   getFavoriteQuestions(): user_favorite_questions.select("question:hr_questions(*)")
--                           .eq("user_id", uid)
--   toggleFavoriteQuestion(): user_favorite_questions.insert { user_id, question_id }
--                             / .delete().eq("user_id", uid).eq("question_id", qid)
--   getCompanies(): companies.select("... hr_questions(count) ...")  (company_id FK)
--   mapHRQuestionRow(): id, category, question, answer_tips (jsonb), sample_answer
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.hr_questions (
  id            text        primary key,
  company_id    text        references public.companies (id) on delete cascade,
  category      text        not null default 'General Questions',
  question      text        not null,
  answer_tips   jsonb       not null default '[]'::jsonb,
  sample_answer text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists hr_questions_company_id_idx on public.hr_questions (company_id);
create index if not exists hr_questions_category_idx   on public.hr_questions (category);

create table if not exists public.user_favorite_questions (
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  question_id text        not null references public.hr_questions (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists user_favorite_questions_user_id_idx
  on public.user_favorite_questions (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   hr_questions:            world-readable catalog.
--   user_favorite_questions: read + create + delete own.
-- ---------------------------------------------------------------------------
alter table public.hr_questions            enable row level security;
alter table public.user_favorite_questions enable row level security;

drop policy if exists "hr_questions_select_public" on public.hr_questions;
create policy "hr_questions_select_public"
  on public.hr_questions for select
  using (true);

drop policy if exists "user_favorite_questions_select_own" on public.user_favorite_questions;
create policy "user_favorite_questions_select_own"
  on public.user_favorite_questions for select
  using (auth.uid() = user_id);

drop policy if exists "user_favorite_questions_insert_own" on public.user_favorite_questions;
create policy "user_favorite_questions_insert_own"
  on public.user_favorite_questions for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_favorite_questions_delete_own" on public.user_favorite_questions;
create policy "user_favorite_questions_delete_own"
  on public.user_favorite_questions for delete
  using (auth.uid() = user_id);

drop trigger if exists hr_questions_set_updated_at on public.hr_questions;
create trigger hr_questions_set_updated_at
  before update on public.hr_questions
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

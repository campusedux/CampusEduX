-- Fixes: GET /rest/v1/dsa_topics         -> 404 PGRST205
--        GET /rest/v1/dsa_problems       -> 404 PGRST205
--        GET /rest/v1/user_dsa_progress   -> 404 PGRST205
--
-- src/services/placement.service.ts:
--   getDSATopics():   dsa_topics.select("*, problems:dsa_problems(id)").order("sort_order")
--   getDSAProblems(): dsa_problems.select("id, title, difficulty")
--                     .eq("topic_id", id).order("sort_order")
--   getDSAProblemDetail(): dsa_problems.select("*").eq("id", id).single()
--     reads: description, examples, constraints, starter_code, time_complexity,
--            space_complexity, solution_approach, solution_code
--   markProblemSolved(): user_dsa_progress.upsert { user_id, problem_id,
--                          status, solved_at }   -> conflict target is the PK
--   getDashboardSummary(): user_dsa_progress head count where status='solved'
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.dsa_topics (
  id         text        primary key,
  name       text        not null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dsa_problems (
  id                text        primary key,
  topic_id          text        not null references public.dsa_topics (id) on delete cascade,
  title             text        not null,
  difficulty        text        not null default 'Easy'
                      check (difficulty in ('Easy', 'Medium', 'Hard')),
  sort_order        integer     not null default 0,
  description       text        not null default '',
  examples          jsonb       not null default '[]'::jsonb,
  constraints       jsonb       not null default '[]'::jsonb,
  starter_code      jsonb       not null default '{}'::jsonb,
  time_complexity   text        not null default '',
  space_complexity  text        not null default '',
  solution_approach text        not null default '',
  solution_code     jsonb       not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists dsa_problems_topic_id_idx on public.dsa_problems (topic_id, sort_order);

create table if not exists public.user_dsa_progress (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  problem_id text        not null references public.dsa_problems (id) on delete cascade,
  status     text        not null default 'solved'
               check (status in ('solved', 'attempted')),
  solved_at  timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create index if not exists user_dsa_progress_user_id_idx
  on public.user_dsa_progress (user_id, status);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   dsa_topics / dsa_problems: world-readable catalog.
--   user_dsa_progress:         read + create + update own (upsert needs both).
-- ---------------------------------------------------------------------------
alter table public.dsa_topics        enable row level security;
alter table public.dsa_problems      enable row level security;
alter table public.user_dsa_progress enable row level security;

drop policy if exists "dsa_topics_select_public" on public.dsa_topics;
create policy "dsa_topics_select_public"
  on public.dsa_topics for select
  using (true);

drop policy if exists "dsa_problems_select_public" on public.dsa_problems;
create policy "dsa_problems_select_public"
  on public.dsa_problems for select
  using (true);

drop policy if exists "user_dsa_progress_select_own" on public.user_dsa_progress;
create policy "user_dsa_progress_select_own"
  on public.user_dsa_progress for select
  using (auth.uid() = user_id);

drop policy if exists "user_dsa_progress_insert_own" on public.user_dsa_progress;
create policy "user_dsa_progress_insert_own"
  on public.user_dsa_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_dsa_progress_update_own" on public.user_dsa_progress;
create policy "user_dsa_progress_update_own"
  on public.user_dsa_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists dsa_topics_set_updated_at on public.dsa_topics;
create trigger dsa_topics_set_updated_at
  before update on public.dsa_topics
  for each row execute function public.set_updated_at();

drop trigger if exists dsa_problems_set_updated_at on public.dsa_problems;
create trigger dsa_problems_set_updated_at
  before update on public.dsa_problems
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

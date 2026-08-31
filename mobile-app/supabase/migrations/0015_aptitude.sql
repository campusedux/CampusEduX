-- Fixes: GET /rest/v1/aptitude_topics -> 404 PGRST205
--        "Could not find the table 'public.aptitude_topics' in the schema cache"
--
-- src/services/placement.service.ts getAptitudeTopics(category):
--   aptitude_topics.select("*").eq("category", category).order("name")
--   mapTopicRow() reads: id, category, name, total_questions, solved_questions
--   (solved_questions is a per-topic denormalised counter the admin maintains;
--    per-user progress lives in user_dsa_progress / test_attempts, not here.)
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.aptitude_topics (
  id               text        primary key,
  category         text        not null
                     check (category in ('quantitative', 'logical', 'verbal')),
  name             text        not null,
  total_questions  integer     not null default 0,
  solved_questions integer     not null default 0,
  sort_order       integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists aptitude_topics_category_idx on public.aptitude_topics (category, name);

-- ---------------------------------------------------------------------------
-- Row Level Security — question catalog, world-readable; writes service role.
-- ---------------------------------------------------------------------------
alter table public.aptitude_topics enable row level security;

drop policy if exists "aptitude_topics_select_public" on public.aptitude_topics;
create policy "aptitude_topics_select_public"
  on public.aptitude_topics for select
  using (true);

drop trigger if exists aptitude_topics_set_updated_at on public.aptitude_topics;
create trigger aptitude_topics_set_updated_at
  before update on public.aptitude_topics
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

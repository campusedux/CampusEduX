-- Phase 8 of the Advanced Resume & Career Profile System engagement.
--
-- Log of AI writing-assist calls (website/src/app/api/resume/assist). Two
-- jobs: (1) a durable trail of what was requested, (2) the source of truth
-- for a per-user daily cap so a single account can't run up API cost
-- unbounded — the assist route counts today's rows before calling Anthropic.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.resume_ai_requests (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  resume_id  uuid        references public.resumes_builder (id) on delete set null,
  mode       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists resume_ai_requests_user_created_idx
  on public.resume_ai_requests (user_id, created_at desc);

alter table public.resume_ai_requests enable row level security;

-- Append-only log: select/insert own, no update/delete policy at all —
-- nobody (not even the row's own owner) can edit or remove a past entry.
drop policy if exists "resume_ai_requests_select_own" on public.resume_ai_requests;
create policy "resume_ai_requests_select_own"
  on public.resume_ai_requests for select
  using (auth.uid() = user_id);

drop policy if exists "resume_ai_requests_insert_own" on public.resume_ai_requests;
create policy "resume_ai_requests_insert_own"
  on public.resume_ai_requests for insert
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';

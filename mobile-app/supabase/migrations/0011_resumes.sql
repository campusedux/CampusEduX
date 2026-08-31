-- Fixes: GET /rest/v1/resumes -> 404 PGRST205
--        "Could not find the table 'public.resumes' in the schema cache"
--
-- This is the *uploaded PDF* resume used when applying to a job (Module 4),
-- NOT the Resume Builder document (that is `resumes_builder`, see 0014).
--
-- src/services/job.service.ts:
--   getResumes():   select "*".eq("user_id", uid).order("uploaded_at", desc)
--   uploadResume(): storage.from("resumes").upload(...) then
--                   insert { user_id, file_name, file_url }
--   applyToJob():   applications.resume_id references resumes.id (see 0012)
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.resumes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  file_name   text        not null,
  file_url    text        not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes (user_id, uploaded_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — an uploaded resume belongs to one user.
-- ---------------------------------------------------------------------------
alter table public.resumes enable row level security;

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
  on public.resumes for select
  using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
  on public.resumes for insert
  with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own"
  on public.resumes for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

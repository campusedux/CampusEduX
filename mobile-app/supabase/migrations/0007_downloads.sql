-- Fixes: GET /rest/v1/downloads -> 404 PGRST205
--        "Could not find the table 'public.downloads' in the schema cache"
--
-- src/services/project.service.ts:
--   getDownloadHistory(): select "*, project:projects(title)"
--                         .eq("user_id", uid).order("downloaded_at", desc)
--   recordDownload():     insert { user_id, project_id, file_label, file_size_mb }
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.downloads (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  project_id    text        not null references public.projects (id) on delete cascade,
  file_label    text        not null,
  file_size_mb  numeric(10,2) not null default 0,
  downloaded_at timestamptz not null default now()
);

create index if not exists downloads_user_id_idx on public.downloads (user_id, downloaded_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — a download record belongs to one user; read + create
-- own only, matching 0001_profiles.sql's auth.uid() scoping.
-- ---------------------------------------------------------------------------
alter table public.downloads enable row level security;

drop policy if exists "downloads_select_own" on public.downloads;
create policy "downloads_select_own"
  on public.downloads for select
  using (auth.uid() = user_id);

drop policy if exists "downloads_insert_own" on public.downloads;
create policy "downloads_insert_own"
  on public.downloads for insert
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';

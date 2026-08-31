-- Fixes: GET /rest/v1/project_files   -> 404 PGRST205
--        GET /rest/v1/project_versions -> 404 PGRST205
--
-- src/services/myProjects.service.ts:
--   getProjectFiles():   select "*".eq("project_id", id).eq("category", cat)
--                        .order("sort_order")  -> maps storage_path via
--                        supabase.storage.from("project-files").getPublicUrl()
--   getVersionHistory(): select "*".eq("project_id", id).order("released_at", desc)
--   getOwnedProjectDetail(): select "version".eq("is_latest", true).maybeSingle()
--   markVersionUpdated():  writes purchases.purchased_version (see 0006)
--
-- These are catalog rows the admin panel manages; the buyer only reads them.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.project_files (
  id           text        primary key,
  project_id   text        not null references public.projects (id) on delete cascade,
  category     text        not null default 'main' check (category in ('main', 'documentation')),
  label        text        not null,
  file_name    text        not null,
  size_mb      numeric(10,2) not null default 0,
  -- path inside the `project-files` storage bucket, e.g. "tr-1/source-code.zip"
  storage_path text        not null,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists project_files_project_id_idx
  on public.project_files (project_id, category, sort_order);

create table if not exists public.project_versions (
  id          uuid        primary key default gen_random_uuid(),
  project_id  text        not null references public.projects (id) on delete cascade,
  version     text        not null,
  is_latest   boolean     not null default false,
  released_at timestamptz not null default now(),
  size_mb     numeric(10,2) not null default 0,
  changelog   jsonb       not null default '[]'::jsonb,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  unique (project_id, version)
);

create index if not exists project_versions_project_id_idx
  on public.project_versions (project_id, released_at desc);
-- getOwnedProjectDetail() does .eq("is_latest", true).maybeSingle(); guarantee
-- there is at most one "latest" row per project.
create unique index if not exists project_versions_one_latest_key
  on public.project_versions (project_id) where is_latest;

-- ---------------------------------------------------------------------------
-- Row Level Security — world-readable catalog, writes via service role.
-- ---------------------------------------------------------------------------
alter table public.project_files    enable row level security;
alter table public.project_versions enable row level security;

drop policy if exists "project_files_select_public" on public.project_files;
create policy "project_files_select_public"
  on public.project_files for select
  using (true);

drop policy if exists "project_versions_select_public" on public.project_versions;
create policy "project_versions_select_public"
  on public.project_versions for select
  using (true);

notify pgrst, 'reload schema';

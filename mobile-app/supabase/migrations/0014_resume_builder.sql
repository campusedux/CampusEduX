-- Fixes: GET /rest/v1/resumes_builder   -> 404 PGRST205
--        GET /rest/v1/resume_downloads   -> 404 PGRST205
--        GET /rest/v1/resume_templates   -> 404 PGRST205
--
-- src/services/resume.service.ts (Module 6, Resume Builder):
--   getResumes():        select "id, title, template, ats_score, updated_at"
--                        .eq("user_id", uid).order("updated_at", desc)
--   createResume():      insert { user_id, title, template, personal_details,
--                                 education, skills, sections }
--   getResumeDetail():   select "*".eq("id", id).single()  -> mapRow() reads
--                        personal_details / education / skills / sections / ats_score
--   updateTemplate/updatePersonalDetails/updateEducation/updateSkills/
--   updateFreeformSection/getATSBreakdown(): update those jsonb columns + ats_score
--   deleteResume():      delete .eq("id", id)
--   recordDownload():    resume_downloads.insert { user_id, resume_id,
--                                 resume_title, file_url }
--   getDownloadHistory(): resume_downloads.select "*".eq("user_id", uid)
--                        .order("downloaded_at", desc)
--
-- `resume_templates` is a small read-only catalog for the Templates screen; the
-- accent colours mirror TEMPLATE_ACCENTS in resume.service.ts.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.resume_templates (
  id           text        primary key
                 check (id in ('modern', 'professional', 'minimal', 'creative')),
  name         text        not null,
  accent_color text        not null default '#4F39F6',
  description  text        not null default '',
  is_premium   boolean     not null default false,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.resumes_builder (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles (id) on delete cascade,
  title            text        not null default 'Untitled Resume',
  -- CHECK, not an FK to resume_templates: createResume() must still succeed on a
  -- project whose resume_templates catalog has not been seeded yet.
  template         text        not null default 'modern'
                     check (template in ('modern', 'professional', 'minimal', 'creative')),
  personal_details jsonb       not null default '{}'::jsonb,
  education        jsonb       not null default '[]'::jsonb,
  skills           jsonb       not null default '{"technical":[],"soft":[]}'::jsonb,
  sections         jsonb       not null default '{}'::jsonb,
  ats_score        integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists resumes_builder_user_id_idx
  on public.resumes_builder (user_id, updated_at desc);

create table if not exists public.resume_downloads (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  resume_id     uuid        references public.resumes_builder (id) on delete set null,
  resume_title  text        not null default '',
  file_url      text        not null default '',
  downloaded_at timestamptz not null default now()
);

create index if not exists resume_downloads_user_id_idx
  on public.resume_downloads (user_id, downloaded_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   resume_templates: world-readable catalog.
--   resumes_builder / resume_downloads: full CRUD scoped to the owner, exactly
--   like 0001_profiles.sql (select/insert/update own; delete own where used).
-- ---------------------------------------------------------------------------
alter table public.resume_templates enable row level security;
alter table public.resumes_builder  enable row level security;
alter table public.resume_downloads enable row level security;

drop policy if exists "resume_templates_select_public" on public.resume_templates;
create policy "resume_templates_select_public"
  on public.resume_templates for select
  using (true);

drop policy if exists "resumes_builder_select_own" on public.resumes_builder;
create policy "resumes_builder_select_own"
  on public.resumes_builder for select
  using (auth.uid() = user_id);

drop policy if exists "resumes_builder_insert_own" on public.resumes_builder;
create policy "resumes_builder_insert_own"
  on public.resumes_builder for insert
  with check (auth.uid() = user_id);

drop policy if exists "resumes_builder_update_own" on public.resumes_builder;
create policy "resumes_builder_update_own"
  on public.resumes_builder for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "resumes_builder_delete_own" on public.resumes_builder;
create policy "resumes_builder_delete_own"
  on public.resumes_builder for delete
  using (auth.uid() = user_id);

drop policy if exists "resume_downloads_select_own" on public.resume_downloads;
create policy "resume_downloads_select_own"
  on public.resume_downloads for select
  using (auth.uid() = user_id);

drop policy if exists "resume_downloads_insert_own" on public.resume_downloads;
create policy "resume_downloads_insert_own"
  on public.resume_downloads for insert
  with check (auth.uid() = user_id);

drop trigger if exists resumes_builder_set_updated_at on public.resumes_builder;
create trigger resumes_builder_set_updated_at
  before update on public.resumes_builder
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

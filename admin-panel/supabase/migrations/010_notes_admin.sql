-- ============================================================================
-- 010_notes_admin.sql — Preparation Notes CMS (Placement Prep → Notes)
-- ============================================================================
-- Apply after 001–009 (SQL Editor). Additive + guarded + re-runnable.
--
-- Canonical definition of public.prep_notes (mobile-app migration 0028 carries
-- a byte-identical guarded copy for mobile-only databases). This migration adds
-- the admin write policy, which needs is_admin() from 001_admin_core.sql.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

create table if not exists public.prep_notes (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  content       text        not null default '',
  category      text        not null default 'General Placement'
                  check (category in (
                    'Aptitude', 'Logical Reasoning', 'Verbal', 'DSA', 'Coding',
                    'HR', 'Technical Interview', 'Company Preparation', 'General Placement'
                  )),
  topic         text        not null default '',
  tags          text[]      not null default '{}',
  file_url      text,
  thumbnail_url text,
  is_premium    boolean     not null default false,
  is_published  boolean     not null default false,
  created_by    uuid        references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists prep_notes_category_idx  on public.prep_notes (category, created_at desc);
create index if not exists prep_notes_published_idx on public.prep_notes (is_published, created_at desc);

drop trigger if exists prep_notes_set_updated_at on public.prep_notes;
create trigger prep_notes_set_updated_at
  before update on public.prep_notes
  for each row execute function public.set_updated_at();

alter table public.prep_notes enable row level security;

drop policy if exists "prep_notes_select_published" on public.prep_notes;
create policy "prep_notes_select_published"
  on public.prep_notes for select
  to authenticated
  using (is_published = true or public.is_admin(auth.uid()));

drop policy if exists "prep_notes_admin_all" on public.prep_notes;
create policy "prep_notes_admin_all"
  on public.prep_notes for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';

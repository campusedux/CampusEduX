-- Preparation → Notes (Module 5). Study notes authored in the admin panel
-- (Placement Prep → Notes) and read by students under the Prep tab.
--
-- src/services/notes.service.ts:
--   listNotes():   prep_notes.select("*").eq("is_published", true)
--                    [.eq("category", …)] [.or(title/topic/tags ilike)]
--                    .order("created_at", desc)   + bookmark join
--   toggleBookmark(): prep_note_bookmarks insert / delete
--   listBookmarks():  prep_note_bookmarks -> prep_notes
--
-- The canonical table definition also lives in
-- admin-panel/supabase/migrations/010_notes_admin.sql (identical shape + the
-- admin write policy, which needs is_admin() from the admin migrations). This
-- block is a guarded fallback so a mobile-only database still works; whichever
-- migration runs first creates it, the other is a no-op.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

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

-- Students see published notes only. (The admin migration adds an is_admin()
-- "for all" policy for authoring.)
drop policy if exists "prep_notes_select_published" on public.prep_notes;
create policy "prep_notes_select_published"
  on public.prep_notes for select
  to authenticated
  using (is_published = true);

-- ---------------------------------------------------------------------------
-- Per-student bookmarks.
-- ---------------------------------------------------------------------------
create table if not exists public.prep_note_bookmarks (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  note_id    uuid        not null references public.prep_notes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

create index if not exists prep_note_bookmarks_user_idx
  on public.prep_note_bookmarks (user_id, created_at desc);

alter table public.prep_note_bookmarks enable row level security;

drop policy if exists "prep_note_bookmarks_rw_own" on public.prep_note_bookmarks;
create policy "prep_note_bookmarks_rw_own"
  on public.prep_note_bookmarks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';

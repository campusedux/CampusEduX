-- ============================================================================
-- 003_project_admin.sql — technologies catalog, project admin fields, storage
-- ============================================================================
-- Apply after 001 + 002 (SQL Editor). Safe to re-run. Additive only — the
-- mobile app keeps working unchanged; the new columns default to values that
-- match today's behaviour.
-- ----------------------------------------------------------------------------

-- --- technologies (Module 4 / Module 12 "Technologies CRUD") ---------------
-- The mobile app stores tech as `projects.tech_stack text[]`; this is the
-- managed vocabulary the admin picks from. `select` is public so the mobile
-- app can adopt it later without a schema change.
create table if not exists public.technologies (
  id         text        primary key,
  name       text        not null,
  slug       text        not null unique,
  icon       text        not null default 'code',
  category   text        not null default 'General',
  status     text        not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists technologies_set_updated_at on public.technologies;
create trigger technologies_set_updated_at
  before update on public.technologies
  for each row execute function public.set_updated_at();

alter table public.technologies enable row level security;

drop policy if exists "technologies_select_public" on public.technologies;
create policy "technologies_select_public" on public.technologies for select using (true);

drop policy if exists "technologies_admin_all" on public.technologies;
create policy "technologies_admin_all" on public.technologies
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

insert into public.technologies (id, name, slug, category, sort_order) values
  ('react',      'React',        'react',      'Frontend', 1),
  ('nextjs',     'Next.js',      'nextjs',     'Frontend', 2),
  ('react-native','React Native','react-native','Mobile',  3),
  ('flutter',    'Flutter',      'flutter',    'Mobile',   4),
  ('nodejs',     'Node.js',      'nodejs',     'Backend',  5),
  ('express',    'Express',      'express',    'Backend',  6),
  ('django',     'Django',       'django',     'Backend',  7),
  ('spring-boot','Spring Boot',  'spring-boot','Backend',  8),
  ('postgresql', 'PostgreSQL',   'postgresql', 'Database', 9),
  ('mongodb',    'MongoDB',      'mongodb',    'Database', 10),
  ('firebase',   'Firebase',     'firebase',   'Database', 11),
  ('supabase',   'Supabase',     'supabase',   'Database', 12),
  ('python',     'Python',       'python',     'Language', 13),
  ('java',       'Java',         'java',       'Language', 14),
  ('typescript', 'TypeScript',   'typescript', 'Language', 15)
on conflict (id) do nothing;

-- --- projects: admin-only columns ----------------------------------------
do $$ begin
  if to_regclass('public.projects') is not null then
    alter table public.projects add column if not exists status               text    not null default 'published';
    alter table public.projects add column if not exists is_featured          boolean not null default false;
    alter table public.projects add column if not exists featured_priority    integer not null default 0;
    alter table public.projects add column if not exists best_seller_priority integer not null default 0;
    alter table public.projects add column if not exists view_count           integer not null default 0;

    if not exists (select 1 from pg_constraint where conname = 'projects_status_check') then
      alter table public.projects add constraint projects_status_check
        check (status in ('draft', 'published', 'archived'));
    end if;

    create index if not exists projects_is_featured_idx
      on public.projects (is_featured, featured_priority) where is_featured;
  end if;
end $$;

-- --- Storage buckets for project media ---------------------------------
-- Images + video live in `project-media` (public URLs stored on the row).
-- Source code + documentation stay in `project-files` so the mobile app's
-- storage_path resolution (myProjects.service) keeps working.
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true),
       ('project-files',  'project-files',  true)
on conflict (id) do nothing;

drop policy if exists "project_media_admin_write" on storage.objects;
create policy "project_media_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'project-media' and public.is_admin(auth.uid()))
  with check (bucket_id = 'project-media' and public.is_admin(auth.uid()));

drop policy if exists "project_files_admin_write" on storage.objects;
create policy "project_files_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'project-files' and public.is_admin(auth.uid()))
  with check (bucket_id = 'project-files' and public.is_admin(auth.uid()));

-- (Public buckets serve reads through /object/public/… without an RLS policy,
--  so no SELECT policy is needed here.)

notify pgrst, 'reload schema';

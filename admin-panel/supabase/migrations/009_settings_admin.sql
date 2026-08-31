-- ============================================================================
-- 009_settings_admin.sql — site settings, academic data, backups registry
-- ============================================================================
-- Apply after 001–008 (SQL Editor). Additive + guarded + re-runnable.
-- (admin_users / role_permissions / admin_activity_logs already exist — 001.)
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- --- site_settings (single row) --------------------------------------
create table if not exists public.site_settings (
  id                 integer     primary key default 1 check (id = 1),
  site_name          text        not null default 'ProjectHub',
  tagline            text        not null default '',
  admin_email        text        not null default '',
  support_email      text        not null default '',
  contact_phone      text        not null default '',
  logo_url           text,
  favicon_url        text,
  social_links       jsonb       not null default '{}'::jsonb,
  maintenance_mode   boolean     not null default false,
  email_notifications boolean    not null default true,
  user_registration  boolean     not null default true,
  allow_guest_access boolean     not null default false,
  updated_at         timestamptz not null default now(),
  updated_by         uuid        references auth.users (id) on delete set null
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;
drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings for select using (true);
drop policy if exists "site_settings_admin_update" on public.site_settings;
create policy "site_settings_admin_update" on public.site_settings
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- courses / branches / academic_years --------------------------
create table if not exists public.courses (
  id         text        primary key,
  name       text        not null,
  code       text        not null default '',
  status     text        not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.branches (
  id         text        primary key,
  course_id  text        references public.courses (id) on delete cascade,
  name       text        not null,
  code       text        not null default '',
  status     text        not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.academic_years (
  id         text        primary key,
  label      text        not null,
  status     text        not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['courses', 'branches', 'academic_years'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_public', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_select_public', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))',
      t || '_admin_all', t
    );
  end loop;
end $$;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at before update on public.courses for each row execute function public.set_updated_at();
drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at before update on public.branches for each row execute function public.set_updated_at();

insert into public.academic_years (id, label, sort_order) values
  ('1', '1st Year', 1), ('2', '2nd Year', 2), ('3', '3rd Year', 3), ('4', '4th Year', 4), ('passed-out', 'Passed Out', 5)
on conflict (id) do nothing;

-- --- backups registry --------------------------------------------
create table if not exists public.backups (
  id             uuid        primary key default gen_random_uuid(),
  status         text        not null default 'completed' check (status in ('completed', 'failed', 'running')),
  size_bytes     bigint      not null default 0,
  note           text        not null default '',
  download_url   text,
  created_by     uuid        references auth.users (id) on delete set null,
  created_by_email text      not null default '',
  created_at     timestamptz not null default now()
);
alter table public.backups enable row level security;
drop policy if exists "backups_admin_select" on public.backups;
create policy "backups_admin_select" on public.backups for select using (public.is_admin(auth.uid()));
drop policy if exists "backups_admin_insert" on public.backups;
create policy "backups_admin_insert" on public.backups for insert with check (public.is_admin(auth.uid()));

-- --- storage bucket for logo / favicon --------------------------
insert into storage.buckets (id, name, public) values ('site', 'site', true) on conflict (id) do nothing;
drop policy if exists "site_admin_write" on storage.objects;
create policy "site_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'site' and public.is_admin(auth.uid()))
  with check (bucket_id = 'site' and public.is_admin(auth.uid()));

notify pgrst, 'reload schema';

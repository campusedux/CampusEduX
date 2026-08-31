-- ============================================================================
-- 0034_custom_feature_catalog.sql — Feature Catalog → advanced feature mgmt
-- ============================================================================
-- Extends the §7 Feature Catalog (public.custom_project_features, created in
-- 0033) so the admin panel can manage features PER PROJECT TYPE with a feature
-- LEVEL, an optional icon/image, dependencies, and a managed CATEGORY
-- vocabulary — without changing the data shape the mobile builder and the
-- create-custom-project-order Edge Function already rely on.
--
-- 100 % additive · idempotent · re-runnable. Nothing existing is dropped:
--   • new columns are nullable or carry a safe default
--   • project_types stays a text[] (no relation migration — spec §21)
--   • category stays FREE TEXT; the new custom_project_feature_categories table
--     is a *managed vocabulary* for the picker + filters, NOT a foreign key,
--     so no existing feature row can be orphaned
--   • the pricing SNAPSHOT frozen on every custom_project_request is untouched
--
-- The admin WRITE policy for the new category table also lives in
-- admin-panel/supabase/migrations/014_custom_feature_catalog.sql (which needs
-- is_admin()). Either file may run first; both are guarded.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ===========================================================================
-- 1. NEW COLUMNS on custom_project_features  (§4 / §5 / §7 / §14)
-- ===========================================================================
do $$
begin
  if to_regclass('public.custom_project_features') is null then
    raise notice '0034: custom_project_features not present yet — run 0033 first; skipping columns.';
    return;
  end if;

  alter table public.custom_project_features
    add column if not exists level        text   not null default 'standard',
    add column if not exists icon         text,
    add column if not exists image_url    text,
    add column if not exists dependencies text[] not null default '{}'::text[];

  -- feature-level vocabulary (spec §5). Name-guarded so a re-run is a no-op.
  if not exists (
    select 1 from pg_constraint where conname = 'custom_project_features_level_check'
  ) then
    alter table public.custom_project_features
      add constraint custom_project_features_level_check
      check (level in ('basic', 'standard', 'advanced', 'premium'));
  end if;
end $$;

-- One-time, best-effort level backfill. Runs ONLY while every row is still the
-- 'standard' default, so a later admin edit is never overwritten by a re-run.
do $$
begin
  if to_regclass('public.custom_project_features') is not null
     and not exists (select 1 from public.custom_project_features where level <> 'standard')
  then
    update public.custom_project_features set level = 'basic'
      where price = 0;
    update public.custom_project_features set level = 'premium'
      where level = 'standard' and (price >= 4000 or name ilike '%enterprise%');
    update public.custom_project_features set level = 'advanced'
      where level = 'standard' and (price >= 2000 or name ilike '%advanced%');
  end if;
end $$;

create index if not exists custom_project_features_level_idx
  on public.custom_project_features (level);
create index if not exists custom_project_features_created_idx
  on public.custom_project_features (created_at desc);
create index if not exists custom_project_features_active_sort_idx
  on public.custom_project_features (is_active, sort_order);
-- GIN index → `project_types @> array['business']` filtering stays fast (§2/§22)
create index if not exists custom_project_features_types_gin
  on public.custom_project_features using gin (project_types);

-- ===========================================================================
-- 2. MANAGED CATEGORY VOCABULARY  (§3 / §15)
-- ===========================================================================
create table if not exists public.custom_project_feature_categories (
  id          text        primary key,          -- slug, e.g. 'user-management'
  name        text        not null,
  description text        not null default '',
  icon        text,
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists custom_project_feature_categories_set_updated_at
  on public.custom_project_feature_categories;
create trigger custom_project_feature_categories_set_updated_at
  before update on public.custom_project_feature_categories
  for each row execute function public.set_updated_at();

-- Seed the canonical list (spec §3). slug id + human name; reusable across
-- Academic / Personal / Business (spec §15).
insert into public.custom_project_feature_categories (id, name, sort_order) values
  ('authentication',  'Authentication',   10),
  ('user-management', 'User Management',   20),
  ('admin',           'Admin',            30),
  ('dashboard',       'Dashboard',        40),
  ('payments',        'Payments',         50),
  ('notifications',   'Notifications',    60),
  ('chat',            'Chat',             70),
  ('ai',              'AI',               80),
  ('analytics',       'Analytics',        90),
  ('reports',         'Reports',         100),
  ('search',          'Search',          110),
  ('booking',         'Booking',         120),
  ('maps-location',   'Maps / Location', 130),
  ('social',          'Social',          140),
  ('media',           'Media',           150),
  ('file-management', 'File Management', 160),
  ('security',        'Security',        170),
  ('api',             'API',             180),
  ('database',        'Database',        190),
  ('e-commerce',      'E-commerce',      200),
  ('education',       'Education',        210),
  ('placement',       'Placement',       220),
  ('jobs',            'Jobs',            230),
  ('resume',          'Resume',          240),
  ('real-time',       'Real-Time',       250),
  ('integration',     'Integration',     260),
  ('location',        'Location',        270),
  ('files-media',     'Files & Media',   280),
  ('deployment',      'Deployment',      290),
  ('documentation',   'Documentation',   300),
  ('automation',      'Automation',      310),
  ('general',         'General',         320),
  ('other',           'Other',           330)
on conflict (id) do nothing;

-- Absorb any category string a feature already uses but that isn't seeded
-- above, so the picker / filter never hides an in-use value.
do $$
declare c text;
begin
  if to_regclass('public.custom_project_features') is not null then
    for c in
      select distinct category from public.custom_project_features
      where coalesce(nullif(trim(category), ''), '') <> ''
    loop
      insert into public.custom_project_feature_categories (id, name, sort_order)
      values (
        regexp_replace(regexp_replace(lower(trim(c)), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'),
        c,
        900
      )
      on conflict (id) do nothing;
    end loop;
  end if;
end $$;

-- ===========================================================================
-- 3. ROW LEVEL SECURITY — world-readable (mirrors cpf_select_public in 0033)
-- ===========================================================================
alter table public.custom_project_feature_categories enable row level security;

drop policy if exists "cpfc_select_public" on public.custom_project_feature_categories;
create policy "cpfc_select_public" on public.custom_project_feature_categories
  for select using (true);

-- admin write — guarded; is_admin() only exists after the admin migrations.
-- admin-panel/supabase/migrations/014 re-creates this unconditionally.
do $$
begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "cpfc_admin_all" on public.custom_project_feature_categories;
    create policy "cpfc_admin_all" on public.custom_project_feature_categories
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

notify pgrst, 'reload schema';

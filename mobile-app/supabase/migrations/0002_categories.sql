-- Fixes: GET /rest/v1/categories -> 404 PGRST205
--        "Could not find the table 'public.categories' in the schema cache"
--
-- src/services/home.service.ts getCategories() selects
-- `id, name, icon, project_count` from public.categories and orders by
-- project_count. Without this table the Home screen silently falls back to
-- SAMPLE_CATEGORIES forever.
--
-- Apply with either:
--   supabase db push                       (Supabase CLI, linked project)
--   Dashboard -> SQL Editor -> paste + Run (no CLI needed)

create table if not exists public.categories (
  -- text (slug) PK on purpose: the client navigates with the raw category id
  -- coming from SAMPLE_CATEGORIES ("web-development", ...) and seed.sql keeps
  -- those exact ids so "real backend" mode matches sample-fallback mode.
  id            text        primary key,
  name          text        not null,
  icon          text        not null default 'folder-outline',
  project_count integer     not null default 0,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- home.service orders categories by project_count desc.
create index if not exists categories_project_count_idx
  on public.categories (project_count desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Catalog data: readable by everyone (anon + authenticated). Writes happen
-- only through the admin panel / seed, which use the service-role key and
-- bypass RLS, so no write policy is defined here on purpose.
alter table public.categories enable row level security;

drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public"
  on public.categories for select
  using (true);

-- ---------------------------------------------------------------------------
-- Keep updated_at honest (public.set_updated_at() is created in 0001).
-- ---------------------------------------------------------------------------
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

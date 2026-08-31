-- Fixes: GET /rest/v1/projects -> 404 PGRST205
--        "Could not find the table 'public.projects' in the schema cache"
--
-- src/services/home.service.ts and src/services/project.service.ts both query
-- public.projects heavily:
--   * select "*, category:categories(name)"            (needs FK category_id)
--   * order by sales_count / created_at / price
--   * .eq("is_premium", true) / .eq("is_best_seller", true)
--   * .overlaps("tech_stack", [...])                   (needs text[] column)
--   * .ilike("title", "%q%")
-- mapProjectRow()/mapProjectDetailRow() read every column below.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.projects (
  -- text PK: seed.sql reuses the sample ids ("tr-1", "pr-1", ...) so that
  -- wishlists / purchases / reviews rows can reference stable ids and the app
  -- looks identical with or without the real backend.
  id                     text        primary key,
  title                  text        not null,
  category_id            text        references public.categories (id) on delete set null,
  -- denormalised fallback used by mapProjectRow() when the category join is absent
  category_name          text        not null default '',
  tech_stack             text[]      not null default '{}',
  price                  numeric(10,2) not null default 0,
  rating                 numeric(3,2)  not null default 0,
  review_count           integer     not null default 0,
  thumbnail_url          text,
  is_premium             boolean     not null default false,
  is_best_seller         boolean     not null default false,
  sales_count            integer     not null default 0,
  -- ProjectDetail fields (mapProjectDetailRow)
  description            text        not null default '',
  images                 text[]      not null default '{}',
  video_url             text,
  live_demo_url         text,
  source_code_size_mb   numeric(10,2) not null default 0,
  documentation_size_mb numeric(10,2) not null default 0,
  platform_fee_percent  numeric(5,2)  not null default 2,
  -- OwnedProjectDetail fields (myProjects.service.getOwnedProjectDetail)
  license               text        not null default 'Regular License',
  developer_name        text        not null default 'ProjectHub Studio',
  github_url            text,
  repo_owner           text,
  repo_name            text,
  repo_language        text,
  repo_stars           integer,
  repo_forks           integer,
  repo_updated_at      timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists projects_category_id_idx   on public.projects (category_id);
create index if not exists projects_sales_count_idx    on public.projects (sales_count desc);
create index if not exists projects_created_at_idx     on public.projects (created_at desc);
create index if not exists projects_is_premium_idx     on public.projects (is_premium) where is_premium;
create index if not exists projects_is_best_seller_idx on public.projects (is_best_seller) where is_best_seller;
create index if not exists projects_tech_stack_gin     on public.projects using gin (tech_stack);

-- Optional normalised gallery table (the admin panel writes here; the mobile
-- client reads projects.images directly via select "*"). Kept so the schema is
-- complete and an admin can manage images without editing an array literal.
create table if not exists public.project_images (
  id         uuid        primary key default gen_random_uuid(),
  project_id text        not null references public.projects (id) on delete cascade,
  url        text        not null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_id_idx on public.project_images (project_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — catalog data, world-readable, writes via service role.
-- ---------------------------------------------------------------------------
alter table public.projects       enable row level security;
alter table public.project_images enable row level security;

drop policy if exists "projects_select_public" on public.projects;
create policy "projects_select_public"
  on public.projects for select
  using (true);

drop policy if exists "project_images_select_public" on public.project_images;
create policy "project_images_select_public"
  on public.project_images for select
  using (true);

-- ---------------------------------------------------------------------------
-- updated_at trigger (public.set_updated_at() defined in 0001).
-- ---------------------------------------------------------------------------
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Keep categories.project_count honest as projects are added / re-categorised
-- / removed, instead of trusting a hand-maintained number.
-- ---------------------------------------------------------------------------
create or replace function public.sync_category_project_count()
returns trigger
language plpgsql
as $$
declare
  affected text[] := '{}';
  cid text;
begin
  if tg_op <> 'DELETE' then
    affected := affected || new.category_id;
  end if;
  if tg_op <> 'INSERT' then
    affected := affected || old.category_id;
  end if;

  foreach cid in array array_remove(affected, null) loop
    update public.categories c
       set project_count = (select count(*) from public.projects p where p.category_id = c.id)
     where c.id = cid;
  end loop;
  return null;
end;
$$;

drop trigger if exists projects_sync_category_count on public.projects;
create trigger projects_sync_category_count
  after insert or update of category_id or delete on public.projects
  for each row execute function public.sync_category_project_count();

notify pgrst, 'reload schema';

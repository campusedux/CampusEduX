-- mobile-app/supabase/migrations/0065_blog.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/037_blog.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — Blog system (categories + posts)
--   Consumed by: website `/blog` + `/blog/[slug]` and the admin panel
--   `Blog` module. The mobile app does not read these tables.
--
-- ACCESS CONTROL
--   • blog_categories — world-readable; admin full CRUD.
--   • blog_posts      — anon/authenticated can SELECT a row ONLY when it is
--                       status='published' AND published_at <= now(); drafts,
--                       archived posts and future-dated (scheduled) posts are
--                       invisible to the public. Admins (any of the 5 roles,
--                       via is_admin()) get full CRUD; role granularity
--                       (editor cannot delete, viewer/support read-only) is
--                       enforced in the Next.js Server Actions via
--                       requirePermission('blog', …) → has_permission().
--
-- SAFETY
--   100% additive. No DROP of anything holding data. Guarded with
--   to_regclass / to_regprocedure / IF NOT EXISTS so it is safe to run before
--   or after its twin and safe to re-run. Reuses the existing public
--   `admin-media` Storage bucket (migration 012 / 0032) for blog imagery —
--   no new bucket or storage policy.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $$
begin
  if to_regprocedure('public.is_admin(uuid)') is null then
    raise exception 'blog: public.is_admin(uuid) not found — apply admin migration 001_admin_core.sql first.';
  end if;
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'blog: public.set_updated_at() not found — apply admin migration 001_admin_core.sql (or mobile 0001) first.';
  end if;
end $$;

create extension if not exists pgcrypto;

-- ===========================================================================
-- 1. SCHEMA
-- ===========================================================================

-- ---- blog_categories ---------------------------------------------------
create table if not exists public.blog_categories (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique
                check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists blog_categories_set_updated_at on public.blog_categories;
create trigger blog_categories_set_updated_at
  before update on public.blog_categories
  for each row execute function public.set_updated_at();

-- ---- blog_posts ------------------------------------------------------
create table if not exists public.blog_posts (
  id                 uuid        primary key default gen_random_uuid(),
  title              text        not null,
  slug               text        not null
                       check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt            text        not null default '',
  content            text        not null default '',          -- Markdown
  featured_image     text,                                     -- URL (Storage or /public)
  featured_image_alt text        not null default '',
  author_id          uuid        references auth.users (id) on delete set null,
  author_name        text        not null default 'CampusEduX Team',
  category_id        uuid        references public.blog_categories (id) on delete set null,
  category_name      text        not null default '',          -- denormalised, kept in sync by trigger
  tags               text[]      not null default '{}',
  status             text        not null default 'draft'
                       check (status in ('draft', 'published', 'archived')),
  published_at       timestamptz,
  reading_time       integer     not null default 0,           -- minutes
  seo_title          text        not null default '',
  seo_description    text        not null default '',
  seo_keywords       text        not null default '',
  canonical_url      text        not null default '',
  is_featured        boolean     not null default false,
  created_by         uuid        references auth.users (id) on delete set null,
  updated_by         uuid        references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- slug is the public URL key → globally unique, case-insensitively.
create unique index if not exists blog_posts_slug_key on public.blog_posts (lower(slug));

-- Public listing: newest published first.
create index if not exists blog_posts_public_idx
  on public.blog_posts (status, published_at desc);
-- Category filter.
create index if not exists blog_posts_category_idx on public.blog_posts (category_id);
-- Tag filter (tags @> / && ).
create index if not exists blog_posts_tags_gin on public.blog_posts using gin (tags);
-- Featured strip.
create index if not exists blog_posts_featured_idx
  on public.blog_posts (published_at desc) where is_featured;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ---- keep blog_posts.category_name in sync ---------------------------
create or replace function public.blog_posts_sync_category_name()
returns trigger language plpgsql as $$
begin
  new.category_name := coalesce(
    (select name from public.blog_categories where id = new.category_id), ''
  );
  return new;
end;
$$;

drop trigger if exists blog_posts_category_name_sync on public.blog_posts;
create trigger blog_posts_category_name_sync
  before insert or update of category_id on public.blog_posts
  for each row execute function public.blog_posts_sync_category_name();

create or replace function public.blog_categories_cascade_name()
returns trigger language plpgsql as $$
begin
  if new.name is distinct from old.name then
    update public.blog_posts set category_name = new.name where category_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists blog_categories_cascade_name on public.blog_categories;
create trigger blog_categories_cascade_name
  after update of name on public.blog_categories
  for each row execute function public.blog_categories_cascade_name();

-- ===========================================================================
-- 2. RLS
-- ===========================================================================
alter table public.blog_categories enable row level security;
alter table public.blog_posts      enable row level security;

-- blog_categories: world-readable, admin-writable.
drop policy if exists "blog_categories_select_public" on public.blog_categories;
create policy "blog_categories_select_public" on public.blog_categories
  for select using (true);

drop policy if exists "blog_categories_admin_all" on public.blog_categories;
create policy "blog_categories_admin_all" on public.blog_categories
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- blog_posts: the public only ever sees a live published post.
drop policy if exists "blog_posts_select_public" on public.blog_posts;
create policy "blog_posts_select_public" on public.blog_posts
  for select using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

drop policy if exists "blog_posts_admin_all" on public.blog_posts;
create policy "blog_posts_admin_all" on public.blog_posts
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ===========================================================================
-- 3. PERMISSIONS — seed the `blog` module row for Settings → Roles.
--    Mirrors admin-panel/src/lib/permissions.ts (DEFAULT_PERMISSIONS).
--    `on conflict do nothing` so a super_admin's later edits are never clobbered.
-- ===========================================================================
do $$
begin
  if to_regclass('public.role_permissions') is not null then
    insert into public.role_permissions (role, module, can_view, can_add, can_edit, can_delete) values
      ('super_admin', 'blog', true,  true,  true,  true),
      ('admin',       'blog', true,  true,  true,  true),
      ('editor',      'blog', true,  true,  true,  false),
      ('support',     'blog', true,  false, false, false),
      ('viewer',      'blog', true,  false, false, false)
    on conflict (role, module) do nothing;
  end if;
end $$;

-- ===========================================================================
-- 4. SEED — the initial category set. Admin can add / rename / reorder more.
-- ===========================================================================
insert into public.blog_categories (name, slug, description, sort_order) values
  ('Artificial Intelligence', 'artificial-intelligence', 'AI concepts, tools and how they are used in the real world.', 1),
  ('Technology',              'technology',              'Broad technology explainers and trends.',                     2),
  ('Programming',             'programming',             'Languages, tools and day-to-day coding.',                     3),
  ('Education',               'education',               'Learning, study skills and student life.',                    4),
  ('Career',                  'career',                  'Jobs, internships, interviews and growth.',                   5),
  ('Software Development',     'software-development',    'Building software: practices, teams and delivery.',           6),
  ('Future of Technology',    'future-of-technology',    'Where technology is heading and what it means for you.',      7)
on conflict (slug) do nothing;

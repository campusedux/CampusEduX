-- ============================================================================
-- 019_learning_management.sql — hierarchical Learning Management System
--   Learning Grids -> Sections -> Topics -> Contents  (+ per-student bookmarks)
-- ============================================================================
-- Apply after 001-018 (Supabase SQL Editor / `supabase db push`).
-- Additive - guarded - idempotent - re-runnable.
--
-- CANONICAL COPY. The identical body also ships as
-- mobile-app/supabase/migrations/0042_learning_management.sql so a mobile-only
-- database still gets the schema; both files are guarded, whichever runs first
-- does the work. Keep the two byte-identical below the header.
--
-- Adds an admin-managed content tree (Learning Management module) that the
-- Website and Mobile app render dynamically. `prep_notes` and everything that
-- reads it (website /placement/notes, the mobile Notes screen, the admin
-- "Preparation Notes" manager) are LEFT COMPLETELY UNTOUCHED — the two systems
-- coexist. The admin "Import from Preparation Notes" action copies notes into
-- this hierarchy and stamps learning_topics.source_prep_note_id for idempotency.
--
-- MODEL
--   status         draft | published | archived   (soft-delete = archived)
--   show_on_website / show_on_mobile              (independent per platform)
--   Effective public visibility of a row =
--     row.status='published' AND row.show_on_<platform>
--     AND every ancestor is likewise published + visible on that platform.
--   Premium: learning_topics.is_premium. RLS hides the learning_contents rows
--   of a premium topic from anyone who is not premium / not an admin.
--   FKs are ON DELETE RESTRICT up the tree; only a leaf topic cascades to its
--   own content blocks.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ===========================================================================
-- 1. TABLES
-- ===========================================================================

-- ---- learning_grids --------------------------------------------------------
create table if not exists public.learning_grids (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  slug            text        not null,
  description     text        not null default '',
  icon            text,                    -- lucide / ionicon name or an emoji
  icon_url        text,                    -- optional uploaded square icon
  cover_image_url text,                    -- optional wide banner
  accent_color    text,                    -- optional #RRGGBB card tint
  sort_order      integer     not null default 0,
  status          text        not null default 'draft'
                    check (status in ('draft', 'published', 'archived')),
  show_on_website boolean     not null default true,
  show_on_mobile  boolean     not null default true,
  is_featured     boolean     not null default false,
  created_by      uuid        references auth.users (id) on delete set null,
  updated_by      uuid        references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint learning_grids_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
create unique index if not exists learning_grids_slug_key
  on public.learning_grids (lower(slug));
create index if not exists learning_grids_status_idx
  on public.learning_grids (status, sort_order, name);

-- ---- learning_sections ---------------------------------------------------
create table if not exists public.learning_sections (
  id              uuid        primary key default gen_random_uuid(),
  grid_id         uuid        not null references public.learning_grids (id) on delete restrict,
  name            text        not null,
  slug            text        not null,
  description     text        not null default '',
  sort_order      integer     not null default 0,
  status          text        not null default 'draft'
                    check (status in ('draft', 'published', 'archived')),
  show_on_website boolean     not null default true,
  show_on_mobile  boolean     not null default true,
  created_by      uuid        references auth.users (id) on delete set null,
  updated_by      uuid        references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint learning_sections_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
create unique index if not exists learning_sections_grid_slug_key
  on public.learning_sections (grid_id, lower(slug));
create index if not exists learning_sections_grid_order_idx
  on public.learning_sections (grid_id, sort_order, created_at);

-- ---- learning_topics ---------------------------------------------------
-- `grid_id` is denormalised from the parent section (kept in sync by trigger)
-- so a topic slug is unique per GRID and the website route
-- /learning/<gridSlug>/<topicSlug> resolves with one indexed lookup.
create table if not exists public.learning_topics (
  id                  uuid        primary key default gen_random_uuid(),
  section_id          uuid        not null references public.learning_sections (id) on delete restrict,
  grid_id             uuid        not null references public.learning_grids (id) on delete restrict,
  title               text        not null,
  slug                text        not null,
  short_description   text        not null default '',
  sort_order          integer     not null default 0,
  is_premium          boolean     not null default false,
  status              text        not null default 'draft'
                        check (status in ('draft', 'published', 'archived')),
  show_on_website     boolean     not null default true,
  show_on_mobile      boolean     not null default true,
  source_prep_note_id uuid,               -- provenance for the prep_notes importer
  created_by          uuid        references auth.users (id) on delete set null,
  updated_by          uuid        references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint learning_topics_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
create unique index if not exists learning_topics_grid_slug_key
  on public.learning_topics (grid_id, lower(slug));
create index if not exists learning_topics_section_order_idx
  on public.learning_topics (section_id, sort_order, created_at);
create unique index if not exists learning_topics_source_note_key
  on public.learning_topics (source_prep_note_id)
  where source_prep_note_id is not null;

-- ---- learning_contents ------------------------------------------------
-- One topic may hold several ordered content blocks. Deleting a (leaf) topic
-- cascades to its blocks — that is the explicit, expected action.
create table if not exists public.learning_contents (
  id             uuid        primary key default gen_random_uuid(),
  topic_id       uuid        not null references public.learning_topics (id) on delete cascade,
  heading        text        not null default '',
  body           text        not null default '',
  content_format text        not null default 'markdown'
                   check (content_format in ('markdown', 'plain')),
  file_url       text,
  video_url      text,
  metadata       jsonb       not null default '{}'::jsonb,
  sort_order     integer     not null default 0,
  status         text        not null default 'published'
                   check (status in ('draft', 'published', 'archived')),
  created_by     uuid        references auth.users (id) on delete set null,
  updated_by     uuid        references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists learning_contents_topic_order_idx
  on public.learning_contents (topic_id, sort_order, created_at);

-- ---- learning_bookmarks --------------------------------------------
-- Per-student topic bookmarks. Distinct from prep_note_bookmarks (different
-- target table) — NOT a duplicate of that system, it points at the new tree.
create table if not exists public.learning_bookmarks (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  topic_id   uuid        not null references public.learning_topics (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);
create index if not exists learning_bookmarks_user_idx
  on public.learning_bookmarks (user_id, created_at desc);

-- ===========================================================================
-- 2. TRIGGERS  — updated_at + grid_id denormalisation + slug tidy
-- ===========================================================================

-- shared updated_at helper (from mobile 0001 / admin 001); assert it exists.
do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    create or replace function public.set_updated_at()
    returns trigger language plpgsql as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end $$;

drop trigger if exists learning_grids_set_updated_at on public.learning_grids;
create trigger learning_grids_set_updated_at
  before update on public.learning_grids
  for each row execute function public.set_updated_at();

drop trigger if exists learning_sections_set_updated_at on public.learning_sections;
create trigger learning_sections_set_updated_at
  before update on public.learning_sections
  for each row execute function public.set_updated_at();

drop trigger if exists learning_topics_set_updated_at on public.learning_topics;
create trigger learning_topics_set_updated_at
  before update on public.learning_topics
  for each row execute function public.set_updated_at();

drop trigger if exists learning_contents_set_updated_at on public.learning_contents;
create trigger learning_contents_set_updated_at
  before update on public.learning_contents
  for each row execute function public.set_updated_at();

-- Keep learning_topics.grid_id equal to its section's grid, and derive a slug
-- from the title when the caller left it blank.
create or replace function public.learning_topics_sync_parent()
returns trigger language plpgsql as $$
declare
  v_grid uuid;
begin
  select grid_id into v_grid from public.learning_sections where id = new.section_id;
  if v_grid is null then
    raise exception 'learning_topics: section % does not exist', new.section_id
      using errcode = 'foreign_key_violation';
  end if;
  new.grid_id := v_grid;

  if new.slug is null or btrim(new.slug) = '' then
    new.slug := regexp_replace(lower(btrim(new.title)), '[^a-z0-9]+', '-', 'g');
    new.slug := btrim(new.slug, '-');
  end if;
  return new;
end;
$$;

drop trigger if exists learning_topics_sync_parent on public.learning_topics;
create trigger learning_topics_sync_parent
  before insert or update of section_id, title, slug on public.learning_topics
  for each row execute function public.learning_topics_sync_parent();

-- If a section is ever moved to another grid, re-stamp its topics.
create or replace function public.learning_sections_cascade_grid()
returns trigger language plpgsql as $$
begin
  if new.grid_id is distinct from old.grid_id then
    update public.learning_topics set grid_id = new.grid_id where section_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists learning_sections_cascade_grid on public.learning_sections;
create trigger learning_sections_cascade_grid
  after update of grid_id on public.learning_sections
  for each row execute function public.learning_sections_cascade_grid();

-- ===========================================================================
-- 3. HELPER FUNCTIONS  (SECURITY DEFINER — see raw rows regardless of RLS)
-- ===========================================================================

-- The signed-in student's live premium flag (derived mirror, 0022/0037).
create or replace function public.current_user_is_premium()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_premium from public.profiles where id = auth.uid()), false);
$$;
revoke all on function public.current_user_is_premium() from public;
grant execute on function public.current_user_is_premium() to anon, authenticated;

-- p_platform: 'website' | 'mobile' | 'any'
create or replace function public.learning_grid_visible(p_grid_id uuid, p_platform text default 'any')
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.learning_grids g
    where g.id = p_grid_id
      and g.status = 'published'
      and case p_platform
            when 'website' then g.show_on_website
            when 'mobile'  then g.show_on_mobile
            else (g.show_on_website or g.show_on_mobile)
          end
  );
$$;
revoke all on function public.learning_grid_visible(uuid, text) from public;
grant execute on function public.learning_grid_visible(uuid, text) to anon, authenticated;

create or replace function public.learning_section_visible(p_section_id uuid, p_platform text default 'any')
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.learning_sections s
    join public.learning_grids g on g.id = s.grid_id
    where s.id = p_section_id
      and s.status = 'published' and g.status = 'published'
      and case p_platform
            when 'website' then s.show_on_website and g.show_on_website
            when 'mobile'  then s.show_on_mobile  and g.show_on_mobile
            else (s.show_on_website or s.show_on_mobile) and (g.show_on_website or g.show_on_mobile)
          end
  );
$$;
revoke all on function public.learning_section_visible(uuid, text) from public;
grant execute on function public.learning_section_visible(uuid, text) to anon, authenticated;

create or replace function public.learning_topic_visible(p_topic_id uuid, p_platform text default 'any')
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.learning_topics t
    join public.learning_sections s on s.id = t.section_id
    join public.learning_grids g on g.id = t.grid_id
    where t.id = p_topic_id
      and t.status = 'published' and s.status = 'published' and g.status = 'published'
      and case p_platform
            when 'website' then t.show_on_website and s.show_on_website and g.show_on_website
            when 'mobile'  then t.show_on_mobile  and s.show_on_mobile  and g.show_on_mobile
            else (t.show_on_website or t.show_on_mobile)
                 and (s.show_on_website or s.show_on_mobile)
                 and (g.show_on_website or g.show_on_mobile)
          end
  );
$$;
revoke all on function public.learning_topic_visible(uuid, text) from public;
grant execute on function public.learning_topic_visible(uuid, text) to anon, authenticated;

-- ===========================================================================
-- 4. ROW LEVEL SECURITY
-- ===========================================================================
alter table public.learning_grids     enable row level security;
alter table public.learning_sections  enable row level security;
alter table public.learning_topics    enable row level security;
alter table public.learning_contents  enable row level security;
alter table public.learning_bookmarks enable row level security;

-- ---- admin authoring (needs is_admin() from admin 001) ------------------
do $$
begin
  if to_regprocedure('public.is_admin(uuid)') is null then
    raise notice '0042: public.is_admin(uuid) not present yet — admin write policies skipped; apply admin 001_admin_core.sql then re-run this migration.';
  else
    drop policy if exists "learning_grids_admin_all" on public.learning_grids;
    create policy "learning_grids_admin_all" on public.learning_grids
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

    drop policy if exists "learning_sections_admin_all" on public.learning_sections;
    create policy "learning_sections_admin_all" on public.learning_sections
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

    drop policy if exists "learning_topics_admin_all" on public.learning_topics;
    create policy "learning_topics_admin_all" on public.learning_topics
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

    drop policy if exists "learning_contents_admin_all" on public.learning_contents;
    create policy "learning_contents_admin_all" on public.learning_contents
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

-- ---- public read (anon + authenticated), visibility inherited up the tree
drop policy if exists "learning_grids_select_public" on public.learning_grids;
create policy "learning_grids_select_public" on public.learning_grids
  for select
  using (status = 'published' and (show_on_website or show_on_mobile));

drop policy if exists "learning_sections_select_public" on public.learning_sections;
create policy "learning_sections_select_public" on public.learning_sections
  for select
  using (
    status = 'published'
    and (show_on_website or show_on_mobile)
    and public.learning_grid_visible(grid_id, 'any')
  );

drop policy if exists "learning_topics_select_public" on public.learning_topics;
create policy "learning_topics_select_public" on public.learning_topics
  for select
  using (
    status = 'published'
    and (show_on_website or show_on_mobile)
    and public.learning_section_visible(section_id, 'any')
  );

-- contents: chain published/visible AND (topic not premium OR caller premium/admin)
drop policy if exists "learning_contents_select_public" on public.learning_contents;
create policy "learning_contents_select_public" on public.learning_contents
  for select
  using (
    status = 'published'
    and public.learning_topic_visible(topic_id, 'any')
    and (
      not coalesce((select t.is_premium from public.learning_topics t where t.id = topic_id), false)
      or public.current_user_is_premium()
      or public.is_admin(auth.uid())
    )
  );

-- ---- bookmarks: each student owns their own rows ---------------------
drop policy if exists "learning_bookmarks_rw_own" on public.learning_bookmarks;
create policy "learning_bookmarks_rw_own" on public.learning_bookmarks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===========================================================================
-- 5. CANONICAL READ RPCs  (one round-trip, visibility + premium enforced here
--    so Website / Mobile never have to assemble the tree or trust a UI lock)
-- ===========================================================================

-- 5a. Grid list for a platform, with child counts.
create or replace function public.learning_grids_list(p_platform text default 'website')
returns table (
  id uuid, name text, slug text, description text,
  icon text, icon_url text, cover_image_url text, accent_color text,
  is_featured boolean, sort_order integer,
  section_count bigint, topic_count bigint
)
language sql stable security definer set search_path = public
as $$
  select g.id, g.name, g.slug, g.description,
         g.icon, g.icon_url, g.cover_image_url, g.accent_color,
         g.is_featured, g.sort_order,
         (select count(*) from public.learning_sections s
            where s.grid_id = g.id and s.status = 'published'
              and case p_platform when 'mobile' then s.show_on_mobile else s.show_on_website end),
         (select count(*) from public.learning_topics t
            where t.grid_id = g.id and t.status = 'published'
              and case p_platform when 'mobile' then t.show_on_mobile else t.show_on_website end)
  from public.learning_grids g
  where g.status = 'published'
    and case p_platform when 'mobile' then g.show_on_mobile else g.show_on_website end
  order by g.sort_order, g.name;
$$;
revoke all on function public.learning_grids_list(text) from public;
grant execute on function public.learning_grids_list(text) to anon, authenticated;

-- 5b. Full navigation tree for one grid.
create or replace function public.learning_tree(p_grid_slug text, p_platform text default 'website')
returns jsonb
language sql stable security definer set search_path = public
as $$
  with g as (
    select * from public.learning_grids
    where lower(slug) = lower(p_grid_slug)
      and status = 'published'
      and case p_platform when 'mobile' then show_on_mobile else show_on_website end
    limit 1
  )
  select case when g.id is null then null else
    jsonb_build_object(
      'grid', jsonb_build_object(
        'id', g.id, 'name', g.name, 'slug', g.slug, 'description', g.description,
        'icon', g.icon, 'icon_url', g.icon_url, 'cover_image_url', g.cover_image_url,
        'accent_color', g.accent_color
      ),
      'sections', coalesce((
        select jsonb_agg(sec order by sec.sort_order, sec.created_at)
        from (
          select s.sort_order, s.created_at,
            jsonb_build_object(
              'id', s.id, 'name', s.name, 'slug', s.slug, 'description', s.description,
              'topics', coalesce((
                select jsonb_agg(top order by top.sort_order, top.created_at)
                from (
                  select t.sort_order, t.created_at,
                    jsonb_build_object(
                      'id', t.id, 'title', t.title, 'slug', t.slug,
                      'short_description', t.short_description, 'is_premium', t.is_premium
                    ) as top
                  from public.learning_topics t
                  where t.section_id = s.id and t.status = 'published'
                    and case p_platform when 'mobile' then t.show_on_mobile else t.show_on_website end
                ) top
              ), '[]'::jsonb)
            ) as sec
          from public.learning_sections s
          where s.grid_id = g.id and s.status = 'published'
            and case p_platform when 'mobile' then s.show_on_mobile else s.show_on_website end
        ) sec
      ), '[]'::jsonb)
    )
  end
  from (select * from g) g;
$$;
revoke all on function public.learning_tree(text, text) from public;
grant execute on function public.learning_tree(text, text) to anon, authenticated;

-- 5c. One topic + its content blocks + prev/next, premium enforced.
create or replace function public.learning_topic_content(
  p_grid_slug text, p_topic_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_topic   record;
  v_locked  boolean;
  v_result  jsonb;
  v_rn      bigint;
begin
  select t.*, s.name as section_name, s.slug as section_slug,
         g.name as grid_name, g.slug as grid_slug
    into v_topic
  from public.learning_topics t
  join public.learning_sections s on s.id = t.section_id
  join public.learning_grids g on g.id = t.grid_id
  where lower(g.slug) = lower(p_grid_slug)
    and lower(t.slug) = lower(p_topic_slug)
    and t.status = 'published' and s.status = 'published' and g.status = 'published'
    and case p_platform
          when 'mobile' then t.show_on_mobile and s.show_on_mobile and g.show_on_mobile
          else t.show_on_website and s.show_on_website and g.show_on_website
        end
  limit 1;

  if v_topic.id is null then
    return null;
  end if;

  v_locked := v_topic.is_premium
              and not public.current_user_is_premium()
              and not public.is_admin(auth.uid());

  -- reading-order position within the grid (for prev / next)
  with ordered as (
    select t.id,
      row_number() over (order by s.sort_order, s.created_at, t.sort_order, t.created_at) as rn
    from public.learning_topics t
    join public.learning_sections s on s.id = t.section_id
    where t.grid_id = v_topic.grid_id
      and t.status = 'published' and s.status = 'published'
      and case p_platform
            when 'mobile' then t.show_on_mobile and s.show_on_mobile
            else t.show_on_website and s.show_on_website
          end
  )
  select rn into v_rn from ordered where id = v_topic.id;

  v_result := jsonb_build_object(
    'topic', jsonb_build_object(
      'id', v_topic.id, 'title', v_topic.title, 'slug', v_topic.slug,
      'short_description', v_topic.short_description, 'is_premium', v_topic.is_premium,
      'updated_at', v_topic.updated_at
    ),
    'section', jsonb_build_object('name', v_topic.section_name, 'slug', v_topic.section_slug),
    'grid', jsonb_build_object('name', v_topic.grid_name, 'slug', v_topic.grid_slug),
    'locked', v_locked,
    'contents', case when v_locked then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'heading', c.heading, 'body', c.body,
               'content_format', c.content_format, 'file_url', c.file_url,
               'video_url', c.video_url, 'metadata', c.metadata
             ) order by c.sort_order, c.created_at)
      from public.learning_contents c
      where c.topic_id = v_topic.id and c.status = 'published'
    ), '[]'::jsonb) end,
    'prev', (
      with ordered as (
        select t.id, t.title, t.slug,
          row_number() over (order by s.sort_order, s.created_at, t.sort_order, t.created_at) as rn
        from public.learning_topics t
        join public.learning_sections s on s.id = t.section_id
        where t.grid_id = v_topic.grid_id and t.status = 'published' and s.status = 'published'
          and case p_platform when 'mobile' then t.show_on_mobile and s.show_on_mobile
                              else t.show_on_website and s.show_on_website end
      )
      select jsonb_build_object('title', title, 'slug', slug) from ordered where rn = v_rn - 1
    ),
    'next', (
      with ordered as (
        select t.id, t.title, t.slug,
          row_number() over (order by s.sort_order, s.created_at, t.sort_order, t.created_at) as rn
        from public.learning_topics t
        join public.learning_sections s on s.id = t.section_id
        where t.grid_id = v_topic.grid_id and t.status = 'published' and s.status = 'published'
          and case p_platform when 'mobile' then t.show_on_mobile and s.show_on_mobile
                              else t.show_on_website and s.show_on_website end
      )
      select jsonb_build_object('title', title, 'slug', slug) from ordered where rn = v_rn + 1
    )
  );

  return v_result;
end;
$$;
revoke all on function public.learning_topic_content(text, text, text) from public;
grant execute on function public.learning_topic_content(text, text, text) to anon, authenticated;

-- 5d. Search across the published, platform-visible tree.
create or replace function public.learning_search(
  p_q text, p_platform text default 'website', p_limit integer default 20
)
returns table (
  kind text, grid_slug text, grid_name text, section_name text,
  topic_slug text, title text, snippet text, is_premium boolean
)
language sql stable security definer set search_path = public
as $$
  with q as (select nullif(btrim(p_q), '') as term),
  hits as (
    -- grid matches
    select 'grid'::text kind, g.slug grid_slug, g.name grid_name, null::text section_name,
           null::text topic_slug, g.name title, left(g.description, 160) snippet,
           false is_premium, 0 rank
    from public.learning_grids g, q
    where q.term is not null and g.status = 'published'
      and case p_platform when 'mobile' then g.show_on_mobile else g.show_on_website end
      and (g.name ilike '%' || q.term || '%' or g.description ilike '%' || q.term || '%')
    union all
    -- topic + content matches
    select 'topic'::text, g.slug, g.name, s.name, t.slug, t.title,
           left(coalesce(
             (select string_agg(c.body, ' ') from public.learning_contents c
               where c.topic_id = t.id and c.status = 'published'),
             t.short_description), 200),
           t.is_premium, 1
    from public.learning_topics t
    join public.learning_sections s on s.id = t.section_id
    join public.learning_grids g on g.id = t.grid_id, q
    where q.term is not null
      and t.status = 'published' and s.status = 'published' and g.status = 'published'
      and case p_platform
            when 'mobile' then t.show_on_mobile and s.show_on_mobile and g.show_on_mobile
            else t.show_on_website and s.show_on_website and g.show_on_website
          end
      and (
        t.title ilike '%' || q.term || '%'
        or t.short_description ilike '%' || q.term || '%'
        or exists (
          select 1 from public.learning_contents c
          where c.topic_id = t.id and c.status = 'published'
            and c.body ilike '%' || q.term || '%'
        )
      )
  )
  select kind, grid_slug, grid_name, section_name, topic_slug, title,
         -- withhold the body snippet for premium topics the caller can't open
         case when is_premium
                   and not public.current_user_is_premium()
                   and not public.is_admin(auth.uid())
              then null else snippet end,
         is_premium
  from hits
  order by rank, title
  limit greatest(1, least(p_limit, 50));
$$;
revoke all on function public.learning_search(text, text, integer) from public;
grant execute on function public.learning_search(text, text, integer) to anon, authenticated;

-- 5e. Sitemap feed — every published, platform-visible grid + topic URL with
--     a last-modified timestamp. One grid row (topic_slug null) per grid, then
--     one row per visible topic.
create or replace function public.learning_sitemap(p_platform text default 'website')
returns table (grid_slug text, topic_slug text, updated_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select g.slug, null::text, g.updated_at
  from public.learning_grids g
  where g.status = 'published'
    and case p_platform when 'mobile' then g.show_on_mobile else g.show_on_website end
  union all
  select g.slug, t.slug, t.updated_at
  from public.learning_topics t
  join public.learning_sections s on s.id = t.section_id
  join public.learning_grids g on g.id = t.grid_id
  where t.status = 'published' and s.status = 'published' and g.status = 'published'
    and case p_platform
          when 'mobile' then t.show_on_mobile and s.show_on_mobile and g.show_on_mobile
          else t.show_on_website and s.show_on_website and g.show_on_website
        end
  order by 1, 2 nulls first;
$$;
revoke all on function public.learning_sitemap(text) from public;
grant execute on function public.learning_sitemap(text) to anon, authenticated;

-- ===========================================================================
-- 6. Optional trigram indexes for search (only if pg_trgm is available)
-- ===========================================================================
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_trgm') then
    create extension if not exists pg_trgm;
    create index if not exists learning_grids_name_trgm
      on public.learning_grids using gin (name gin_trgm_ops);
    create index if not exists learning_topics_title_trgm
      on public.learning_topics using gin (title gin_trgm_ops);
    create index if not exists learning_contents_body_trgm
      on public.learning_contents using gin (body gin_trgm_ops);
  end if;
end $$;

notify pgrst, 'reload schema';

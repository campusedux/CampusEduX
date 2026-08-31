-- Fixes: GET /rest/v1/wishlists -> 404 PGRST205
--        "Could not find the table 'public.wishlists' in the schema cache"
--
-- src/services/project.service.ts:
--   isWishlisted():      select "project_id".eq(project_id).eq(user_id).maybeSingle()
--   getWishlist():       select "project:projects(*, category:categories(name))"
--                        .eq("user_id", uid).order("created_at", desc)
--   addToWishlist():     insert { project_id, user_id }
--   removeFromWishlist():delete .eq(project_id).eq(user_id)
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.wishlists (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  project_id text        not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create index if not exists wishlists_user_id_idx on public.wishlists (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — a wishlist row belongs to exactly one user.
-- Same select/insert/delete-scoped-to-auth.uid() pattern as 0001_profiles.sql.
-- ---------------------------------------------------------------------------
alter table public.wishlists enable row level security;

drop policy if exists "wishlists_select_own" on public.wishlists;
create policy "wishlists_select_own"
  on public.wishlists for select
  using (auth.uid() = user_id);

drop policy if exists "wishlists_insert_own" on public.wishlists;
create policy "wishlists_insert_own"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

drop policy if exists "wishlists_delete_own" on public.wishlists;
create policy "wishlists_delete_own"
  on public.wishlists for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';

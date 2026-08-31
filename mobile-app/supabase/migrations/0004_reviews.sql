-- Fixes: GET /rest/v1/reviews -> 404 PGRST205
--        "Could not find the table 'public.reviews' in the schema cache"
--
-- src/services/project.service.ts:
--   getReviews():  select "*, profile:profiles(full_name, avatar_url)"
--                  .eq("project_id", id).order("created_at", desc)
--   addReview():   insert { project_id, user_id, rating, comment }
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id         uuid        primary key default gen_random_uuid(),
  project_id text        not null references public.projects (id) on delete cascade,
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  rating     integer     not null check (rating between 1 and 5),
  comment    text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one review per user per project (addReview() has no upsert, so a repeat
  -- submit should fail loudly rather than create duplicates)
  unique (project_id, user_id)
);

create index if not exists reviews_project_id_idx on public.reviews (project_id, created_at desc);
create index if not exists reviews_user_id_idx    on public.reviews (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * SELECT is public: a project's reviews are shown to every visitor.
--     (The embedded profiles(full_name, avatar_url) is still subject to the
--      profiles RLS from 0001, so other users' names resolve to null and the
--      client falls back to "CampusEduX User" — see docs/database.md.)
--   * writes are scoped to the review's owner via auth.uid().
-- ---------------------------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews for select
  using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger.
-- ---------------------------------------------------------------------------
drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Keep projects.rating / projects.review_count in sync with real reviews so
-- mapProjectRow() shows accurate aggregates without a separate recompute job.
-- ---------------------------------------------------------------------------
create or replace function public.sync_project_rating()
returns trigger
language plpgsql
as $$
declare
  target text := case when tg_op = 'DELETE' then old.project_id else new.project_id end;
begin
  update public.projects p
     set review_count = agg.cnt,
         rating       = coalesce(agg.avg_rating, 0)
    from (
      select count(*)::int as cnt, round(avg(rating)::numeric, 2) as avg_rating
        from public.reviews
       where project_id = target
    ) agg
   where p.id = target;
  return null;
end;
$$;

drop trigger if exists reviews_sync_project_rating on public.reviews;
create trigger reviews_sync_project_rating
  after insert or update or delete on public.reviews
  for each row execute function public.sync_project_rating();

notify pgrst, 'reload schema';

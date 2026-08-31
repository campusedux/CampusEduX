-- Fixes: GET /rest/v1/notifications  -> 404 PGRST205
--        GET /rest/v1/offer_banners  -> 404 PGRST205
--
-- src/services/home.service.ts:
--   getNotifications(): notifications.select("*").order("created_at", desc).limit(50)
--     -> the query has NO user filter; RLS below scopes it to the caller, so
--        each user only ever sees their own notifications.
--     mapper: id, title, body, category, is_read, created_at
--   markNotificationRead(): notifications.update({ is_read:true }).eq("id", id)
--   getOfferBanners(): offer_banners.select("*").eq("is_active", true)
--     .order("sort_order")  -> id, title, description, discount_label, coupon_code
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  title      text        not null,
  body       text        not null default '',
  category   text        not null default 'updates'
               check (category in ('offers', 'updates', 'messages')),
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

create table if not exists public.offer_banners (
  id             text        primary key,
  title          text        not null,
  description    text        not null default '',
  discount_label text        not null default '',
  coupon_code    text        not null default '',
  is_active      boolean     not null default true,
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   notifications: read + mark-read your own rows. New notifications are
--     created by the system (service role), so there is no INSERT policy.
--   offer_banners: world-readable catalog.
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.offer_banners enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "offer_banners_select_public" on public.offer_banners;
create policy "offer_banners_select_public"
  on public.offer_banners for select
  using (true);

drop trigger if exists offer_banners_set_updated_at on public.offer_banners;
create trigger offer_banners_set_updated_at
  before update on public.offer_banners
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

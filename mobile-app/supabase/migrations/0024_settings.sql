-- Fixes: GET /rest/v1/user_preferences          -> 404 PGRST205
--        GET /rest/v1/notification_preferences    -> 404 PGRST205
--        GET /rest/v1/blocked_users               -> 404 PGRST205
--
-- src/services/settings.service.ts:
--   getPreferences(): user_preferences.select("*").eq("user_id", uid).maybeSingle()
--                     notification_preferences.select("*").eq("user_id", uid).maybeSingle()
--   syncPreferences():   user_preferences.upsert({ user_id, theme, accent_color,
--                          use_amoled_dark, reduce_animations, language_code,
--                          has_agreed_to_terms, updated_at })
--   syncNotifications(): notification_preferences.upsert({ user_id, push_enabled,
--                          sound_enabled, vibration_enabled, promotions, job_alerts,
--                          application_updates, message_alerts, news_updates, updated_at })
--     -> both .upsert() calls omit onConflict, so user_id IS the PK.
--   getBlockedUsers(): blocked_users.select("blocked_at, blocked:profiles!
--                        blocked_users_blocked_user_id_fkey(id, full_name, avatar_url)")
--                        .eq("user_id", uid).order("blocked_at", desc)
--   unblockUser(): blocked_users.delete().eq("user_id", uid).eq("blocked_user_id", bid)
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.user_preferences (
  user_id            uuid        primary key references public.profiles (id) on delete cascade,
  theme              text        not null default 'light'
                       check (theme in ('light', 'dark', 'system')),
  accent_color       text        not null default '#4F39F6',
  use_amoled_dark    boolean     not null default false,
  reduce_animations  boolean     not null default false,
  language_code      text        not null default 'en',
  has_agreed_to_terms boolean    not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id             uuid        primary key references public.profiles (id) on delete cascade,
  push_enabled        boolean     not null default true,
  sound_enabled       boolean     not null default true,
  vibration_enabled   boolean     not null default true,
  promotions          boolean     not null default true,
  job_alerts          boolean     not null default true,
  application_updates  boolean     not null default true,
  message_alerts      boolean     not null default true,
  news_updates        boolean     not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.blocked_users (
  user_id         uuid        not null references public.profiles (id) on delete cascade,
  blocked_user_id uuid        not null references public.profiles (id) on delete cascade,
  blocked_at      timestamptz not null default now(),
  primary key (user_id, blocked_user_id),
  check (user_id <> blocked_user_id)
);

create index if not exists blocked_users_user_id_idx on public.blocked_users (user_id, blocked_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — every row here belongs to exactly one user; same
-- select/insert/update/delete-scoped-to-auth.uid() pattern as 0001_profiles.sql.
-- ---------------------------------------------------------------------------
alter table public.user_preferences         enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.blocked_users            enable row level security;

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
  on public.user_preferences for select using (auth.uid() = user_id);
drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
  on public.user_preferences for insert with check (auth.uid() = user_id);
drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
  on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences for select using (auth.uid() = user_id);
drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert with check (auth.uid() = user_id);
drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "blocked_users_select_own" on public.blocked_users;
create policy "blocked_users_select_own"
  on public.blocked_users for select using (auth.uid() = user_id);
drop policy if exists "blocked_users_insert_own" on public.blocked_users;
create policy "blocked_users_insert_own"
  on public.blocked_users for insert with check (auth.uid() = user_id);
drop policy if exists "blocked_users_delete_own" on public.blocked_users;
create policy "blocked_users_delete_own"
  on public.blocked_users for delete using (auth.uid() = user_id);

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

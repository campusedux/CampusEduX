-- Fixes: GET /rest/v1/profiles -> 404 PGRST205
--        "Could not find the table 'public.profiles' in the schema cache"
--
-- src/services/auth.service.ts reads public.profiles immediately after
-- signInWithPassword, so login cannot complete until this table exists.
--
-- Apply with either:
--   supabase db push                       (Supabase CLI, linked project)
--   Dashboard -> SQL Editor -> paste + Run (no CLI needed)

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text        not null,
  full_name     text        not null default '',
  mobile_number text        not null default '',
  avatar_url    text,
  course        text,
  branch        text,
  year          text,
  date_of_birth date,
  gender        text,
  location      text,
  is_premium    boolean     not null default false,
  referral_code text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- auth.service.ts looks an account up by mobile number before signing in.
create unique index if not exists profiles_mobile_number_key
  on public.profiles (mobile_number)
  where mobile_number <> '';

create index if not exists profiles_email_idx on public.profiles (email);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The mobile-number -> email lookup in authService.login() runs *before* the
-- user has a session, so auth.uid() is null there. Expose only that one
-- mapping through a SECURITY DEFINER function instead of opening up the
-- table to anonymous SELECT.
create or replace function public.email_for_mobile(p_mobile text)
returns text
language sql
security definer
set search_path = public
as $$
  select email from public.profiles where mobile_number = p_mobile limit 1;
$$;

revoke all on function public.email_for_mobile(text) from public;
grant execute on function public.email_for_mobile(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Auto-create a profile row on signup, so a user is never left without one.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, mobile_number, referral_code)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'mobile_number', ''),
    new.raw_user_meta_data ->> 'referral_code'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Keep updated_at honest.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Backfill profiles for users that already exist in auth.users.
insert into public.profiles (id, email, full_name, mobile_number)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'mobile_number', '')
from auth.users u
on conflict (id) do nothing;

notify pgrst, 'reload schema';

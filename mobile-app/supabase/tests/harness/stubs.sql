-- Minimal Supabase stubs for plain PostgreSQL 17 (LOCAL TEST ONLY). Idempotent.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_admin') then create role supabase_admin nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator nologin noinherit; end if;
end $$;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
-- Supabase puts extensions on the search_path; pgcrypto functions must resolve unqualified.
set search_path = "$user", public, extensions;

create schema if not exists auth;
create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key default gen_random_uuid(),
  aud varchar(255) default 'authenticated',
  role varchar(255) default 'authenticated',
  email varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  phone text,
  phone_confirmed_at timestamptz,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  is_super_admin boolean,
  banned_until timestamptz,
  last_sign_in_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim', true), ''),
                  nullif(current_setting('request.jwt.claims', true), ''))::jsonb $$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
                         (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claim.role', true),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) $$;
create or replace function auth.email() returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claim.email', true),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')) $$;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text not null unique, owner uuid,
  public boolean default false, file_size_limit bigint, allowed_mime_types text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text, owner uuid, metadata jsonb, path_tokens text[],
  created_at timestamptz default now(), updated_at timestamptz default now(), last_accessed_at timestamptz
);
alter table storage.objects enable row level security;
alter table storage.buckets enable row level security;
create or replace function storage.foldername(name text) returns text[] language plpgsql immutable as $$
declare _parts text[];
begin select string_to_array(name, '/') into _parts; return _parts[1:array_length(_parts,1)-1]; end $$;
create or replace function storage.filename(name text) returns text language plpgsql immutable as $$
declare _parts text[];
begin select string_to_array(name, '/') into _parts; return _parts[array_length(_parts,1)]; end $$;
create or replace function storage.extension(name text) returns text language plpgsql immutable as $$
declare _parts text[]; _filename text;
begin select string_to_array(name, '/') into _parts; _filename := _parts[array_length(_parts,1)];
  return reverse(split_part(reverse(_filename), '.', 1)); end $$;

-- Realtime publication (Supabase creates it; migrations may ALTER PUBLICATION ... ADD TABLE)
do $$ begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    create publication supabase_realtime; end if;
end $$;

-- Grants similar to Supabase defaults
grant usage on schema public, extensions, auth, storage to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
grant execute on all functions in schema storage to anon, authenticated, service_role;
grant select on auth.users to service_role;
grant all on all tables in schema storage to service_role;
grant select on all tables in schema storage to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

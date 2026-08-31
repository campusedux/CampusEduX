-- ============================================================================
-- 001_admin_core.sql — admin identity, roles, permissions, audit trail
-- ============================================================================
-- Apply in the Supabase SQL Editor (Dashboard → SQL Editor → paste → Run) on
-- the SAME project the mobile app uses. Safe to re-run.
--
-- Depends only on `auth.users`. The mobile app's own migrations (0002–0025 in
-- ../../../mobile-app/supabase/migrations) can be applied before or after this.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- Shared updated_at helper (already exists once mobile 0001 is applied; defined
-- here too so this file stands alone on a fresh project).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- admin_users — one row per staff member. Separate from `profiles` (students).
-- The row's id IS the auth.users id, so an admin signs in with normal Supabase
-- Auth and this table just says "…and they're staff, with role X".
-- ----------------------------------------------------------------------------
create table if not exists public.admin_users (
  id            uuid        primary key references auth.users (id) on delete cascade,
  email         text        not null,
  full_name     text        not null default '',
  phone         text        not null default '',
  avatar_url    text,
  role          text        not null default 'viewer'
                  check (role in ('super_admin', 'admin', 'editor', 'support', 'viewer')),
  status        text        not null default 'active'
                  check (status in ('active', 'suspended')),
  last_login_at timestamptz,
  created_by    uuid        references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists admin_users_role_idx on public.admin_users (role);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Helpers used by RLS on every other table + by the Next.js server actions.
-- SECURITY DEFINER so they can read admin_users regardless of its own RLS.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where id = uid and status = 'active');
$$;

create or replace function public.current_admin_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.admin_users where id = auth.uid() and status = 'active';
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;
revoke all on function public.current_admin_role() from public;
grant execute on function public.current_admin_role() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- role_permissions — the checkbox matrix behind Settings → Roles & Permissions.
-- A super_admin edits this live; it drives sidebar visibility + button gating
-- in the UI and is enforced server-side via has_permission().
-- ----------------------------------------------------------------------------
create table if not exists public.role_permissions (
  role       text    not null check (role in ('super_admin', 'admin', 'editor', 'support', 'viewer')),
  module     text    not null,
  can_view   boolean not null default false,
  can_add    boolean not null default false,
  can_edit   boolean not null default false,
  can_delete boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (role, module)
);

drop trigger if exists role_permissions_set_updated_at on public.role_permissions;
create trigger role_permissions_set_updated_at
  before update on public.role_permissions
  for each row execute function public.set_updated_at();

create or replace function public.has_permission(p_user_id uuid, p_module text, p_action text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when (select role from public.admin_users where id = p_user_id and status = 'active') = 'super_admin'
      then true
    else coalesce((
      select case p_action
        when 'view'   then rp.can_view
        when 'add'    then rp.can_add
        when 'edit'   then rp.can_edit
        when 'delete' then rp.can_delete
        else false
      end
      from public.role_permissions rp
      join public.admin_users au on au.role = rp.role
      where au.id = p_user_id and au.status = 'active' and rp.module = p_module
    ), false)
  end;
$$;

revoke all on function public.has_permission(uuid, text, text) from public;
grant execute on function public.has_permission(uuid, text, text) to anon, authenticated;

-- Seed the default matrix. `on conflict do nothing` so re-running the migration
-- never clobbers a super_admin's later edits. Keep this in sync with
-- admin-panel/src/lib/permissions.ts (DEFAULT_PERMISSIONS).
insert into public.role_permissions (role, module, can_view, can_add, can_edit, can_delete) values
  -- super_admin: everything, everywhere
  ('super_admin','dashboard',   true,true,true,true),
  ('super_admin','students',    true,true,true,true),
  ('super_admin','projects',    true,true,true,true),
  ('super_admin','jobs',        true,true,true,true),
  ('super_admin','placement',   true,true,true,true),
  ('super_admin','resume',      true,true,true,true),
  ('super_admin','orders',      true,true,true,true),
  ('super_admin','referrals',   true,true,true,true),
  ('super_admin','cms',         true,true,true,true),
  ('super_admin','reviews',     true,true,true,true),
  ('super_admin','reports',     true,true,true,true),
  ('super_admin','settings',    true,true,true,true),
  ('super_admin','admin_users', true,true,true,true),
  ('super_admin','roles',       true,true,true,true),
  ('super_admin','backup',      true,true,true,true),
  ('super_admin','system_logs', true,true,true,true),
  -- admin: full product, but the four super-only areas stay dark
  ('admin','dashboard',   true,true,true,true),
  ('admin','students',    true,true,true,true),
  ('admin','projects',    true,true,true,true),
  ('admin','jobs',        true,true,true,true),
  ('admin','placement',   true,true,true,true),
  ('admin','resume',      true,true,true,true),
  ('admin','orders',      true,true,true,true),
  ('admin','referrals',   true,true,true,true),
  ('admin','cms',         true,true,true,true),
  ('admin','reviews',     true,true,true,true),
  ('admin','reports',     true,true,true,true),
  ('admin','settings',    true,true,true,true),
  ('admin','admin_users', false,false,false,false),
  ('admin','roles',       false,false,false,false),
  ('admin','backup',      false,false,false,false),
  ('admin','system_logs', false,false,false,false),
  -- editor: content create/edit, no deletes, no settings
  ('editor','dashboard',  true,false,false,false),
  ('editor','students',   true,false,false,false),
  ('editor','projects',   true,true,true,false),
  ('editor','jobs',       true,true,true,false),
  ('editor','placement',  true,true,true,false),
  ('editor','resume',     true,true,true,false),
  ('editor','orders',     true,false,false,false),
  ('editor','referrals',  true,false,false,false),
  ('editor','cms',        true,true,true,false),
  ('editor','reviews',    true,true,true,false),
  ('editor','reports',    true,false,false,false),
  ('editor','settings',   false,false,false,false),
  ('editor','admin_users',false,false,false,false),
  ('editor','roles',      false,false,false,false),
  ('editor','backup',     false,false,false,false),
  ('editor','system_logs',false,false,false,false),
  -- support: operations desk (students / orders / wallet queue / moderation)
  ('support','dashboard', true,false,false,false),
  ('support','students',  true,false,true,false),
  ('support','projects',  true,false,false,false),
  ('support','jobs',      true,false,false,false),
  ('support','placement', true,false,false,false),
  ('support','resume',    true,false,false,false),
  ('support','orders',    true,false,true,false),
  ('support','referrals', true,false,true,false),
  ('support','cms',       true,false,false,false),
  ('support','reviews',   true,false,true,false),
  ('support','reports',   false,false,false,false),
  ('support','settings',  false,false,false,false),
  ('support','admin_users',false,false,false,false),
  ('support','roles',     false,false,false,false),
  ('support','backup',    false,false,false,false),
  ('support','system_logs',false,false,false,false),
  -- viewer: read-only everywhere except the super-only areas
  ('viewer','dashboard',  true,false,false,false),
  ('viewer','students',   true,false,false,false),
  ('viewer','projects',   true,false,false,false),
  ('viewer','jobs',       true,false,false,false),
  ('viewer','placement',  true,false,false,false),
  ('viewer','resume',     true,false,false,false),
  ('viewer','orders',     true,false,false,false),
  ('viewer','referrals',  true,false,false,false),
  ('viewer','cms',        true,false,false,false),
  ('viewer','reviews',    true,false,false,false),
  ('viewer','reports',    true,false,false,false),
  ('viewer','settings',   true,false,false,false),
  ('viewer','admin_users',false,false,false,false),
  ('viewer','roles',      false,false,false,false),
  ('viewer','backup',     false,false,false,false),
  ('viewer','system_logs',false,false,false,false)
on conflict (role, module) do nothing;

-- ----------------------------------------------------------------------------
-- admin_activity_logs — durable audit trail. Written ONLY by the
-- log_admin_activity() SECURITY DEFINER function (no client INSERT policy) so
-- an admin's own session can't forge or edit entries.
-- ----------------------------------------------------------------------------
create table if not exists public.admin_activity_logs (
  id            uuid        primary key default gen_random_uuid(),
  actor_id      uuid        references auth.users (id) on delete set null,
  actor_email   text        not null default '',
  action        text        not null,
  module        text        not null default '',
  resource_type text,
  resource_id   text,
  details       jsonb,
  ip_address    text,
  created_at    timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs (created_at desc);
create index if not exists admin_activity_logs_module_idx  on public.admin_activity_logs (module, created_at desc);
create index if not exists admin_activity_logs_actor_idx   on public.admin_activity_logs (actor_id);

create or replace function public.log_admin_activity(
  p_action        text,
  p_module        text,
  p_resource_type text default null,
  p_resource_id   text default null,
  p_details       jsonb default null,
  p_ip            text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_email text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'log_admin_activity: caller is not an active admin';
  end if;
  select email into v_email from public.admin_users where id = auth.uid();
  insert into public.admin_activity_logs
    (actor_id, actor_email, action, module, resource_type, resource_id, details, ip_address)
  values
    (auth.uid(), coalesce(v_email, ''), p_action, coalesce(p_module, ''), p_resource_type, p_resource_id, p_details, p_ip);
end;
$$;

revoke all on function public.log_admin_activity(text, text, text, text, jsonb, text) from public;
grant execute on function public.log_admin_activity(text, text, text, text, jsonb, text) to authenticated;

-- ----------------------------------------------------------------------------
-- admin_notifications — the Dashboard → Notifications feed (system alerts,
-- queue reminders, broadcast receipts). Distinct from the mobile
-- `notifications` table (per-student push).
-- ----------------------------------------------------------------------------
create table if not exists public.admin_notifications (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null,
  body       text        not null default '',
  level      text        not null default 'info' check (level in ('info', 'success', 'warning', 'critical')),
  link       text,
  for_role   text        check (for_role in ('super_admin', 'admin', 'editor', 'support', 'viewer')),
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_created_idx on public.admin_notifications (is_read, created_at desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.admin_users         enable row level security;
alter table public.role_permissions    enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.admin_notifications enable row level security;

-- admin_users: every active admin can read the staff directory; only
-- super_admin can change it. The FIRST row must be inserted from the SQL
-- Editor (postgres role bypasses RLS) — see README.
drop policy if exists "admin_users_select" on public.admin_users;
create policy "admin_users_select" on public.admin_users
  for select using (public.is_admin(auth.uid()));

drop policy if exists "admin_users_write_super" on public.admin_users;
create policy "admin_users_write_super" on public.admin_users
  for all using (public.current_admin_role() = 'super_admin')
  with check (public.current_admin_role() = 'super_admin');

-- role_permissions: readable by any admin; writable by super_admin only.
drop policy if exists "role_permissions_select" on public.role_permissions;
create policy "role_permissions_select" on public.role_permissions
  for select using (public.is_admin(auth.uid()));

drop policy if exists "role_permissions_write_super" on public.role_permissions;
create policy "role_permissions_write_super" on public.role_permissions
  for all using (public.current_admin_role() = 'super_admin')
  with check (public.current_admin_role() = 'super_admin');

-- admin_activity_logs: read-only for admins; writes go through the function.
drop policy if exists "admin_activity_logs_select" on public.admin_activity_logs;
create policy "admin_activity_logs_select" on public.admin_activity_logs
  for select using (public.is_admin(auth.uid()));

-- admin_notifications: any admin can read + mark read; inserts via any admin
-- (system events) or service role.
drop policy if exists "admin_notifications_select" on public.admin_notifications;
create policy "admin_notifications_select" on public.admin_notifications
  for select using (public.is_admin(auth.uid()));

drop policy if exists "admin_notifications_update" on public.admin_notifications;
create policy "admin_notifications_update" on public.admin_notifications
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "admin_notifications_insert" on public.admin_notifications;
create policy "admin_notifications_insert" on public.admin_notifications
  for insert with check (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';

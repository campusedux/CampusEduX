-- ============================================================================
-- 0001_contact_submissions.sql — the marketing website's /contact form
-- ============================================================================
-- Website-specific (not in mobile-app / admin-panel): the mobile app routes
-- support through in-app screens, but the public site needs a contact form.
-- One shared Supabase project, so apply this alongside the mobile + admin
-- migrations (Supabase CLI `db push`, or SQL Editor → paste + Run). Idempotent.
--
-- Design notes:
--  * NO anon/authenticated INSERT policy. Rows are written ONLY by
--    submit_contact_message() — a SECURITY DEFINER function — so validation +
--    rate limiting cannot be bypassed even though the anon key is public.
--  * NO public SELECT. Only an active admin (admin_users, via is_admin() from
--    admin-panel/supabase/migrations/001) may read or update. Guarded so this
--    file is safe to run before OR after the admin migrations.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

create table if not exists public.contact_submissions (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  message    text        not null,
  status     text        not null default 'new' check (status in ('new', 'read', 'archived')),
  -- set when a signed-in user submits; null for an anonymous visitor
  user_id    uuid        references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint contact_submissions_name_len    check (char_length(name) between 2 and 120),
  constraint contact_submissions_email_len   check (char_length(email) between 3 and 200),
  constraint contact_submissions_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint contact_submissions_message_len check (char_length(message) between 10 and 5000)
);

create index if not exists contact_submissions_status_created_idx
  on public.contact_submissions (status, created_at desc);

alter table public.contact_submissions enable row level security;
-- deliberately NO anon/authenticated policy — see submit_contact_message().

-- Fixed-window rate-limit counters, keyed by an opaque client key (an IP, or a
-- UA hash when the IP is unavailable). RLS on, no policies — only the
-- SECURITY DEFINER function below ever touches it.
create table if not exists public.contact_rate_limits (
  client_key   text        primary key,
  window_start timestamptz not null default now(),
  count        integer     not null default 0
);
alter table public.contact_rate_limits enable row level security;

comment on table public.contact_rate_limits is
  'Per-client fixed-window counters for submit_contact_message(). Written only by that function.';

-- The one and only writer for contact_submissions. Validates, rate-limits
-- (4 / hour / client key), then inserts. Callable by anyone (anon or signed
-- in); records auth.uid() when there is a session.
create or replace function public.submit_contact_message(
  p_name       text,
  p_email      text,
  p_message    text,
  p_client_key text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_message text := btrim(coalesce(p_message, ''));
  v_key     text := coalesce(nullif(btrim(p_client_key), ''), 'anon');
  v_limit   constant integer := 4;
  v_window  constant integer := 3600;
  v_now     timestamptz := now();
  v_count   integer;
  v_id      uuid;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'INVALID_NAME';
  end if;
  if char_length(v_email) > 200
     or v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL';
  end if;
  if char_length(v_message) < 10 or char_length(v_message) > 5000 then
    raise exception 'INVALID_MESSAGE';
  end if;

  insert into public.contact_rate_limits as r (client_key, window_start, count)
  values (v_key, v_now, 1)
  on conflict (client_key) do update
    set count = case
          when r.window_start < v_now - make_interval(secs => v_window) then 1
          else r.count + 1 end,
        window_start = case
          when r.window_start < v_now - make_interval(secs => v_window) then v_now
          else r.window_start end
  returning count into v_count;

  if v_count > v_limit then
    raise exception 'RATE_LIMITED';
  end if;

  insert into public.contact_submissions (name, email, message, user_id)
  values (v_name, v_email, v_message, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;

-- admin read / status update — guarded (is_admin() lives in the admin migrations)
do $$
begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "contact_submissions_select_admin" on public.contact_submissions;
    create policy "contact_submissions_select_admin" on public.contact_submissions
      for select using (public.is_admin(auth.uid()));

    drop policy if exists "contact_submissions_update_admin" on public.contact_submissions;
    create policy "contact_submissions_update_admin" on public.contact_submissions
      for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

notify pgrst, 'reload schema';

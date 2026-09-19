-- ============================================================================
-- 0002_contact_limiter_hardening.sql -- contact-form rate limiter (audit DB-20)
-- ============================================================================
-- Fixes vs 0001: (1) client key is normalised (lower-case, charset-stripped,
-- <=64 chars) and hashed, never stored raw; (2) a request with no key no longer
-- shares one global 'anon' bucket (5 calls locking everyone out) -- it falls back
-- to the server-derived caller IP from PostgREST's request.headers; (3) signed-in
-- callers are keyed by auth.uid(); (4) rotating fake keys is capped by an extra
-- per-header-IP bucket and a global hourly cap; (5) stale windows are purged.
-- Same signature/return as 0001 -- no website code change required. Idempotent.
--
-- Limits / hour: per identity 4 (30 when no identity is derivable); per header-IP
-- 40 (the website server's own egress IP is the header IP for proxied calls, so this
-- is deliberately generous); global 300.
-- Rollback: re-run 0001_contact_submissions.sql (restores the old function body).
-- ============================================================================

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.contact_rate_limits') is null then
    raise exception '0002 requires 0001_contact_submissions.sql to be applied first';
  end if;
end $$;

create or replace function public._contact_hit(p_key text, p_limit int, p_window int)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now   timestamptz := now();
  v_count integer;
begin
  insert into public.contact_rate_limits as r (client_key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (client_key) do update
    set count = case when r.window_start < v_now - make_interval(secs => p_window) then 1 else r.count + 1 end,
        window_start = case when r.window_start < v_now - make_interval(secs => p_window) then v_now else r.window_start end
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;
revoke all on function public._contact_hit(text, int, int) from public, anon, authenticated;

create or replace function public.submit_contact_message(
  p_name       text,
  p_email      text,
  p_message    text,
  p_client_key text default null
) returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_message text := btrim(coalesce(p_message, ''));
  v_uid     uuid := auth.uid();
  v_hdrs    json;
  v_hdr_ip  text;
  v_supplied text := nullif(left(regexp_replace(lower(btrim(coalesce(p_client_key, ''))), '[^a-z0-9:._-]', '', 'g'), 64), '');
  v_ident   text;
  v_limit   integer := 4;
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

  begin
    v_hdrs := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_hdrs := null;
  end;
  v_hdr_ip := nullif(left(btrim(split_part(coalesce(
                v_hdrs ->> 'cf-connecting-ip', v_hdrs ->> 'x-real-ip', v_hdrs ->> 'x-forwarded-for', ''), ',', 1)), 64), '');

  if v_uid is not null then
    v_ident := 'u:' || v_uid::text;
  elsif v_supplied is not null then
    v_ident := 'k:' || encode(digest(v_supplied, 'sha256'), 'hex');
  elsif v_hdr_ip is not null then
    v_ident := 'ip:' || encode(digest(v_hdr_ip, 'sha256'), 'hex');
  else
    v_ident := 'unknown';
    v_limit := 30;
  end if;

  if not public._contact_hit(v_ident, v_limit, 3600) then
    raise exception 'RATE_LIMITED';
  end if;
  if v_hdr_ip is not null
     and not public._contact_hit('hip:' || encode(digest(v_hdr_ip, 'sha256'), 'hex'), 40, 3600) then
    raise exception 'RATE_LIMITED';
  end if;
  if not public._contact_hit('global', 300, 3600) then
    raise exception 'RATE_LIMITED';
  end if;

  -- opportunistic purge of stale windows (bounded)
  if random() < 0.05 then
    delete from public.contact_rate_limits
     where ctid in (select ctid from public.contact_rate_limits
                     where window_start < now() - interval '1 day' limit 200);
  end if;

  insert into public.contact_submissions (name, email, message, user_id)
  values (v_name, v_email, v_message, v_uid)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

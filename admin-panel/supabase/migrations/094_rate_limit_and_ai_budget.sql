-- ============================================================================
-- 0122_rate_limit_and_ai_budget.sql   (twin: admin-panel 094, byte-identical)
-- ============================================================================
-- Purpose : per-user rate limiting and a per-user daily AI budget that the website
--           routes can call with the USER's JWT (no service-role key needed).
--           Keys are ALWAYS derived from auth.uid(); a caller can only ever touch
--           their own counters. Idempotent; twin is a no-op.
-- Audit   : supports the website AI / judge routes (rate-limit + cost-abuse items).
--
-- rl_hit(p_bucket, p_max, p_window_seconds) -> {"allowed","remaining","retry_after_seconds"}
--   Fixed window aligned to the window length; atomic via INSERT .. ON CONFLICT
--   DO UPDATE .. WHERE hits < max, so a counter never exceeds p_max even under
--   concurrency. Denied attempts are not counted. bucket: [a-z0-9_:.-]{1,64};
--   max 1..10000; window 1..86400s.
-- ai_budget_take(p_kind, p_daily_limit) -> {"allowed","used","limit"}
--   Per user, per UTC day, per kind (whitelist), consumes 1 unit when allowed.
-- Stale rows: rl_hit opportunistically deletes (bounded, 100 rows) hits older than
-- 2 days on ~2% of calls; ai budget rows older than 40 days likewise.
-- Caveat: a single user can create many distinct bucket names (bounded only by
-- the purge); callers should use a fixed set of bucket names.
-- ============================================================================

create table if not exists public.rate_limit_hits (
  user_id      uuid        not null,
  bucket       text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  primary key (user_id, bucket, window_start)
);
create index if not exists rate_limit_hits_window_idx on public.rate_limit_hits (window_start);
alter table public.rate_limit_hits enable row level security;   -- no policies
revoke all on public.rate_limit_hits from public, anon, authenticated;

create table if not exists public.ai_budget_usage (
  user_id uuid    not null,
  kind    text    not null,
  day     date    not null,
  used    integer not null default 0,
  primary key (user_id, kind, day)
);
create index if not exists ai_budget_usage_day_idx on public.ai_budget_usage (day);
alter table public.ai_budget_usage enable row level security;   -- no policies
revoke all on public.ai_budget_usage from public, anon, authenticated;

create or replace function public.rl_hit(p_bucket text, p_max int, p_window_seconds int)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_now   timestamptz := clock_timestamp();
  v_start timestamptz;
  v_hits  integer;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_bucket is null or p_bucket !~ '^[a-z0-9_:.-]{1,64}$' then
    raise exception 'invalid bucket' using errcode = '22023';
  end if;
  if p_max is null or p_max < 1 or p_max > 10000 then
    raise exception 'invalid max' using errcode = '22023';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid window' using errcode = '22023';
  end if;

  v_start := to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);

  if random() < 0.02 then
    delete from public.rate_limit_hits
     where ctid in (select ctid from public.rate_limit_hits
                     where window_start < v_now - interval '2 days' limit 100);
  end if;

  insert into public.rate_limit_hits as h (user_id, bucket, window_start, hits)
  values (v_uid, p_bucket, v_start, 1)
  on conflict (user_id, bucket, window_start)
  do update set hits = h.hits + 1 where h.hits < p_max
  returning h.hits into v_hits;

  if v_hits is null then
    return jsonb_build_object(
      'allowed', false, 'remaining', 0,
      'retry_after_seconds', greatest(1, ceil(extract(epoch from (v_start + make_interval(secs => p_window_seconds) - v_now)))::int));
  end if;
  return jsonb_build_object('allowed', true, 'remaining', p_max - v_hits, 'retry_after_seconds', 0);
end;
$$;

create or replace function public.ai_budget_take(p_kind text, p_daily_limit int)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid  uuid := auth.uid();
  v_day  date := (now() at time zone 'utc')::date;
  v_used integer;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_kind is null or p_kind not in ('resume_assist', 'custom_project_understand', 'coding_judge') then
    raise exception 'invalid kind' using errcode = '22023';
  end if;
  if p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 100000 then
    raise exception 'invalid limit' using errcode = '22023';
  end if;

  if random() < 0.02 then
    delete from public.ai_budget_usage
     where ctid in (select ctid from public.ai_budget_usage where day < v_day - 40 limit 100);
  end if;

  insert into public.ai_budget_usage as u (user_id, kind, day, used)
  values (v_uid, p_kind, v_day, 1)
  on conflict (user_id, kind, day)
  do update set used = u.used + 1 where u.used < p_daily_limit
  returning u.used into v_used;

  if v_used is null then
    select u.used into v_used from public.ai_budget_usage u
     where u.user_id = v_uid and u.kind = p_kind and u.day = v_day;
    return jsonb_build_object('allowed', false, 'used', coalesce(v_used, 0), 'limit', p_daily_limit);
  end if;
  return jsonb_build_object('allowed', true, 'used', v_used, 'limit', p_daily_limit);
end;
$$;

revoke all on function public.rl_hit(text, int, int)        from public, anon;
revoke all on function public.ai_budget_take(text, int)     from public, anon;
grant execute on function public.rl_hit(text, int, int)     to authenticated;
grant execute on function public.ai_budget_take(text, int)  to authenticated;

notify pgrst, 'reload schema';

-- ---- ROLLBACK (manual) -------------------------------------------------------
-- drop function public.rl_hit(text, int, int); drop function public.ai_budget_take(text, int);
-- drop table public.rate_limit_hits; drop table public.ai_budget_usage;

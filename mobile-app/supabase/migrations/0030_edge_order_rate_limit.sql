-- 0030_edge_order_rate_limit.sql
--
-- Per-user rate limiting for the three order-creation Edge Functions
-- (create-razorpay-order, create-premium-order, create-wallet-topup-order).
-- A compromised or buggy client could otherwise spam order creation, each call
-- writing a pending purchases / premium_subscriptions / wallet_topup_orders row
-- and hitting the Razorpay Orders API.
--
-- The functions call check_rate_limit() through the service-role client. The
-- counter table has RLS on with no policies, so nothing reachable from a normal
-- session can read or write it.

create table if not exists public.edge_rate_limits (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  action       text        not null,
  window_start timestamptz not null default now(),
  count        integer     not null default 0,
  primary key (user_id, action)
);

alter table public.edge_rate_limits enable row level security;
-- No policies: only SECURITY DEFINER functions / the service role touch this.

comment on table public.edge_rate_limits is
  'Fixed-window request counters for order-creation Edge Functions. Written only by check_rate_limit().';

-- Atomically bump the caller's counter for (user, action) and report whether
-- they are still within `p_limit` requests per `p_window_seconds`. The window
-- resets the first time a request arrives after it has elapsed.
create or replace function public.check_rate_limit(
  p_user_id        uuid,
  p_action         text,
  p_limit          integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now       timestamptz := now();
  v_cutoff    timestamptz := v_now - make_interval(secs => greatest(p_window_seconds, 1));
  v_count     integer;
begin
  insert into public.edge_rate_limits as e (user_id, action, window_start, count)
  values (p_user_id, p_action, v_now, 1)
  on conflict (user_id, action) do update
    set count        = case when e.window_start < v_cutoff then 1 else e.count + 1 end,
        window_start = case when e.window_start < v_cutoff then v_now else e.window_start end
  returning e.count into v_count;

  return v_count <= greatest(p_limit, 1);
end;
$$;

revoke all on function public.check_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(uuid, text, integer, integer) to service_role;

-- SEC-06. Byte-identical admin twin: 128. Local preparation only.
-- Read-time authorization; no historical reconciliation or scheduled writes.
-- Existing privileged finite extensions and auto_renew=false remain valid.
create or replace function public._has_valid_premium_subscription(p_user_id uuid, p_at timestamptz)
returns boolean
language sql stable security definer set search_path = pg_catalog, public
as $$
  select p_user_id is not null and exists (
    select 1
      from public.profiles p
      join public.premium_subscriptions s on s.user_id = p.id
      join public.premium_plans plan on plan.id = s.plan_id
     where p.id = p_user_id and p.status = 'active'
       and s.status = 'active' and s.billing_cycle in ('monthly', 'yearly')
       and s.started_at is not null and s.current_period_end is not null
       and isfinite(s.started_at) and isfinite(s.current_period_end)
       and s.started_at < s.current_period_end
       and s.started_at <= p_at
       and p_at < s.current_period_end
  );
$$;
-- Internal only: callers cannot inspect another user's entitlement.
revoke all on function public._has_valid_premium_subscription(uuid,timestamptz)
  from public, anon, authenticated, service_role;

-- Keep the existing RLS/RPC API and all independent admin permission checks.
-- Capture the real clock once per call, including after SEC-05's row lock.
-- VOLATILE prevents a long transaction/prepared plan retaining an earlier time.
create or replace function public.current_user_is_premium()
returns boolean
language sql volatile security definer set search_path = pg_catalog, public
as $$
  select public._has_valid_premium_subscription(auth.uid(), clock_timestamp());
$$;
revoke all on function public.current_user_is_premium()
  from public, anon, authenticated, service_role;
grant execute on function public.current_user_is_premium() to anon, authenticated;

-- Compatibility mirror only. It can age without a write and is never authority.
-- Reuse exactly the same eligibility predicate when subscription writes occur.
create or replace function public.sync_profile_is_premium()
returns trigger
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  uid uuid := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  previous_sync text := current_setting('app.sync_is_premium', true);
begin
  perform set_config('app.sync_is_premium', 'on', true);
  update public.profiles set is_premium = public._has_valid_premium_subscription(uid, clock_timestamp())
    where id = uid;
  perform set_config('app.sync_is_premium', coalesce(previous_sync, 'off'), true);
  return null;
end;
$$;
revoke all on function public.sync_profile_is_premium()
  from public, anon, authenticated, service_role;
notify pgrst, 'reload schema';

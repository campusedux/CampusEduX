-- ============================================================================
-- 0037_protect_is_premium.sql — SEC-001: stop clients granting themselves
--                                premium (profiles.is_premium + the
--                                premium_subscriptions activation bypass)
-- ============================================================================
-- The UPDATE policy on public.profiles (profiles_update_own, 0001) only checks
--     auth.uid() = id
-- with no column-level restriction, so any authenticated user can
--     PATCH /rest/v1/profiles?id=eq.<uid>   {"is_premium": true}
-- and unlock every premium feature without paying. Nothing lowers the flag
-- again until that user's premium_subscriptions rows next change.
--
-- is_premium is a DERIVED mirror of "has a live premium_subscriptions row"
-- (0022, sync_profile_is_premium()). Its only legitimate writer is that
-- trigger. Section 1-2 below add a BEFORE UPDATE trigger on public.profiles
-- that pins is_premium to its stored value on every UPDATE *except* the one
-- performed by sync_profile_is_premium(), which now announces itself with a
-- transaction-local GUC (app.sync_is_premium = 'on'). The profiles_update_own
-- RLS policy is left exactly as-is, per the fix spec.
--
-- Section 3 closes the sibling hole: premium_subscriptions_update_own (0022)
-- has `with check (... status in ('active','cancelled'))`, so a user who
-- starts a premium checkout (create-premium-order inserts a 'pending' row they
-- own) then abandons payment can PATCH that row to status='active' — which
-- fires sync_profile_is_premium() and would still set is_premium=true. A
-- BEFORE UPDATE trigger now pins status + the price / period / razorpay
-- columns for any caller that is not the service role (Edge Functions) or an
-- active admin, so a signed-in student can only ever flip auto_renew — exactly
-- what walletService/premiumService.cancelSubscription() does. WITH CHECK
-- cannot do this itself: a PATCH lets the client set every column in the row,
-- and the admin panel shares the `authenticated` role (it is distinguished
-- only by public.is_admin()).
--
-- Trigger ordering:
--   * BEFORE UPDATE row triggers fire in trigger-NAME order. profiles_guard_
--     is_premium sorts before profiles_set_updated_at (0001); premium_
--     subscriptions_guard_fields sorts before premium_subscriptions_set_
--     updated_at (0022). set_updated_at() only touches updated_at, so the
--     ordering is in fact immaterial — the names just keep the intent obvious.
--
-- NOTE: this deliberately also stops the admin panel writing is_premium
-- directly (admin-panel/src/app/(panel)/students/actions.ts setStudentPremium /
-- createStudent, which run as the admin's `authenticated` session via the
-- profiles_update_admin policy). After this migration an admin premium grant
-- must go through premium_subscriptions instead. This is the intended, spec'd
-- behaviour of the SEC-001 fix. (Admin management of premium_subscriptions
-- itself is unaffected — section 3's trigger allows is_admin() callers.)
--
-- 100% additive · guarded · idempotent · re-runnable.
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

-- ===========================================================================
-- 1. Re-declare the premium sync (0022) so it flags its own write to profiles.
--    Body is the 0022 version plus the two set_config() lines.
-- ===========================================================================
create or replace function public.sync_profile_is_premium()
returns trigger
language plpgsql
as $$
declare
  uid uuid := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
begin
  -- Tell profiles_guard_is_premium() that the is_premium write on the next
  -- statement is the trusted, subscription-driven one. Transaction-local
  -- (third arg true) so it never leaks to the next statement on a pooled
  -- connection.
  perform set_config('app.sync_is_premium', 'on', true);

  update public.profiles p
     set is_premium = exists (
       select 1 from public.premium_subscriptions s
       where s.user_id = uid and s.status = 'active'
         and (s.current_period_end is null or s.current_period_end > now())
     )
   where p.id = uid;

  perform set_config('app.sync_is_premium', 'off', true);
  return null;
end;
$$;

-- ===========================================================================
-- 2. profiles: pin is_premium against any non-sync UPDATE.
-- ===========================================================================
create or replace function public.protect_profile_is_premium()
returns trigger
language plpgsql
as $$
begin
  if new.is_premium is distinct from old.is_premium
     and coalesce(current_setting('app.sync_is_premium', true), 'off') <> 'on' then
    -- Client-supplied change to a server-derived column: silently ignore it.
    new.is_premium := old.is_premium;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_is_premium on public.profiles;
create trigger profiles_guard_is_premium
  before update on public.profiles
  for each row execute function public.protect_profile_is_premium();

-- ===========================================================================
-- 3. premium_subscriptions: a signed-in student may only ever flip auto_renew.
--    Everything else (status, plan, price, period, razorpay linkage) is pinned
--    unless the caller is the service role (Edge Functions) or an active admin.
--    Plain (non-SECURITY DEFINER) function so current_user is the caller's
--    Postgres role.
-- ===========================================================================
create or replace function public.protect_premium_subscription_fields()
returns trigger
language plpgsql
as $$
declare
  v_is_admin boolean := false;
begin
  -- Trusted server contexts: verify-premium-payment (service_role) owns the
  -- pending -> active transition and the period dates; migrations / cron run
  -- as postgres.
  if current_user in ('service_role', 'supabase_admin', 'postgres') then
    return new;
  end if;

  -- Admin panel manages subscriptions (cancel / extend) through the separate
  -- premium_subscriptions_admin_all policy but still runs as `authenticated`.
  if to_regprocedure('public.is_admin(uuid)') is not null then
    execute 'select public.is_admin($1)' into v_is_admin using auth.uid();
  end if;
  if v_is_admin then
    return new;
  end if;

  -- Everyone else: keep only auto_renew (premiumService.cancelSubscription()).
  new.status              := old.status;
  new.plan_id             := old.plan_id;
  new.price               := old.price;
  new.billing_cycle       := old.billing_cycle;
  new.started_at          := old.started_at;
  new.current_period_end  := old.current_period_end;
  new.payment_method      := old.payment_method;
  new.razorpay_order_id   := old.razorpay_order_id;
  new.razorpay_payment_id := old.razorpay_payment_id;
  return new;
end;
$$;

drop trigger if exists premium_subscriptions_guard_fields on public.premium_subscriptions;
create trigger premium_subscriptions_guard_fields
  before update on public.premium_subscriptions
  for each row execute function public.protect_premium_subscription_fields();

notify pgrst, 'reload schema';

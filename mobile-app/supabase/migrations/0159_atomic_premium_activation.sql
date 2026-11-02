-- SEC-05. Canonical admin twin: 127. Local preparation only.
-- Install transactionally with bounded lock waits during approved rollout.
-- No historical date repair, catalog repricing, or read-time expiry change.
lock table public.premium_subscriptions in share row exclusive mode;

-- Preserve the original callback's Date.setUTCMonth / setUTCFullYear overflow
-- semantics (Jan 31 -> Mar 3; leap-day yearly -> Mar 1), NOT interval clamping.
create or replace function public.premium_billing_period_end(p_start timestamptz, p_cycle text)
returns timestamptz language plpgsql immutable set search_path = pg_catalog, public as $$
declare t timestamp; target timestamp;
begin
  if p_start is null or not isfinite(p_start) or p_cycle is null
     or p_cycle not in ('monthly','yearly') then
    raise exception 'invalid premium billing period' using errcode = '23514';
  end if;
  t := p_start at time zone 'UTC';
  target := date_trunc('month',t) + case when p_cycle='yearly' then interval '1 year' else interval '1 month' end;
  return (target + (extract(day from t)::integer-1)*interval '1 day' + (t-t::date)) at time zone 'UTC';
end;
$$;
revoke all on function public.premium_billing_period_end(timestamptz,text) from public, anon, authenticated, service_role;

create or replace function public.guard_premium_activation()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if tg_op='UPDATE' then
    if old.razorpay_order_id is not null and
       row(new.id,new.user_id,new.plan_id,new.billing_cycle,new.price) is distinct from
       row(old.id,old.user_id,old.plan_id,old.billing_cycle,old.price) then
      raise exception 'bound premium terms are immutable' using errcode = '23514';
    end if;
    -- A previously established paid period cannot be reactivated after expiry
    -- or cancellation by replaying its payment. Failed, never-activated orders
    -- use status expired in the existing signed failure-webhook contract.
    if old.status in ('cancelled','expired') and new.status='active'
       and (old.started_at is not null or old.current_period_end is not null) then
      raise exception 'established premium period cannot be reopened' using errcode = '23514';
    end if;
    if old.status='active' and new.status='active' and
       row(new.started_at,new.current_period_end) is not distinct from
       row(old.started_at,old.current_period_end) then
      return new; -- no historical validation/repair on auto-renew edits
    end if;
  end if;
  if new.status='active' then
    if new.started_at is null or new.current_period_end is null
       or not isfinite(new.started_at) or not isfinite(new.current_period_end)
       or new.current_period_end <= new.started_at then
      raise exception 'active premium requires a finite positive billing period' using errcode = '23514';
    end if;
    if tg_op='INSERT' or old.status<>'active' then
      if new.plan_id is null or not exists(select 1 from public.premium_plans where id=new.plan_id) then
        raise exception 'premium activation requires a valid plan' using errcode = '23514';
      end if;
      if new.razorpay_order_id is not null and
         (nullif(btrim(new.razorpay_payment_id),'') is null or new.price<=0
          or new.current_period_end <> public.premium_billing_period_end(new.started_at,new.billing_cycle)) then
        raise exception 'paid premium activation requires bound payment and plan period' using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_premium_activation() from public, anon, authenticated, service_role;
drop trigger if exists z_sec05_premium_activation on public.premium_subscriptions;
-- After the existing field-protection trigger; ordinary auto-renew stays valid.
create trigger z_sec05_premium_activation before insert or update on public.premium_subscriptions
  for each row execute function public.guard_premium_activation();

-- Trusted Edge callers invoke ONLY after SEC-02 captured-payment verification
-- (provider GET or raw-body signed capture). Clients cannot assert capture.
-- Price is the checkout snapshot plus existing rounded 18% GST, not today's catalog.
create or replace function public.activate_premium_subscription(
  p_subscription_id uuid, p_user_id uuid, p_provider_order_id text,
  p_payment_id text, p_plan_id text, p_billing_cycle text,
  p_amount_paise bigint, p_currency text
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare s public.premium_subscriptions; already boolean; started timestamptz;
begin
  if coalesce(current_setting('role',true),'') <> 'service_role' then
    raise exception 'premium activation is service-role only' using errcode = '42501';
  end if;
  if p_subscription_id is null or p_user_id is null or nullif(btrim(p_provider_order_id),'') is null
     or nullif(btrim(p_payment_id),'') is null or nullif(btrim(p_plan_id),'') is null
     or p_billing_cycle is null or p_billing_cycle not in ('monthly','yearly')
     or p_amount_paise is null or p_amount_paise<=0 or p_currency is distinct from 'INR' then
    raise exception 'invalid premium activation expectations' using errcode = '23514';
  end if;
  select * into s from public.premium_subscriptions where id=p_subscription_id for update;
  if not found or s.user_id<>p_user_id or s.razorpay_order_id is distinct from p_provider_order_id
     or s.plan_id is distinct from p_plan_id or s.billing_cycle is distinct from p_billing_cycle
     -- Match JS round2(price * 0.18), including its binary half-cent behavior
     -- (1.25 -> GST 0.22). Decimal round() would change existing checkout amounts.
     -- Both stored base and rounded GST are cents; total rounding adds no cents.
     or s.price<=0 or s.price*100 +
       floor((s.price::double precision*0.18::double precision)*100::double precision+0.5::double precision)::bigint <> p_amount_paise then
    raise exception 'premium activation expectations changed' using errcode = '23514';
  end if;
  perform 1 from public.premium_plans where id=s.plan_id for key share;
  if not found then raise exception 'premium plan not found' using errcode = '23514'; end if;
  already := s.status='active';
  if already then
    if s.razorpay_payment_id is distinct from p_payment_id or s.started_at is null
       or s.current_period_end is null or not isfinite(s.started_at)
       or not isfinite(s.current_period_end) or s.current_period_end<=s.started_at then
      raise exception 'existing premium activation is invalid; separate reconciliation required' using errcode = '23514';
    end if;
    -- Preserve legitimate prior periods, including privileged extensions.
    -- A retry does not write dates, payment, status, auto_renew or updated_at.
  elsif s.status in ('pending','expired') and s.started_at is null and s.current_period_end is null then
    started := clock_timestamp(); -- after the row lock, once, in the committing transaction
    update public.premium_subscriptions set status='active',started_at=started,
      current_period_end=public.premium_billing_period_end(started,s.billing_cycle),
      razorpay_payment_id=p_payment_id,payment_method='Razorpay'
      where id=s.id returning * into s;
  else
    raise exception 'premium state cannot be activated' using errcode = '23514';
  end if;
  return jsonb_build_object('subscription',to_jsonb(s),'alreadyActive',already);
end;
$$;
revoke all on function public.activate_premium_subscription(uuid,uuid,text,text,text,text,bigint,text)
  from public, anon, authenticated, service_role;
grant execute on function public.activate_premium_subscription(uuid,uuid,text,text,text,text,bigint,text) to service_role;
notify pgrst, 'reload schema';

-- Referral rewards are driven by the admin panel's reward_settings row
-- (admin-panel/supabase/migrations/007_commerce_admin.sql), NOT a hard-coded ₹100.
--
-- Before this migration, convert_referral_on_first_purchase() (0021) always paid
-- reward_amount = 100 and link_referral_on_signup() ignored the "reward on
-- signup" toggle. This makes both read reward_settings so:
--   Admin sets Bonus value ₹200  ->  referral reward = ₹200
--   Admin sets Bonus type "percent" 10%  ->  reward = 10% of the first order
--                                             (capped at Max payout)
--   Admin unticks "Reward on first purchase"  ->  referrals stay pending
--   Admin ticks  "Reward on signup"          ->  referral converts immediately
--
-- reward_settings has a public SELECT policy already, so the mobile client can
-- read the same rule for its UI (see src/services/referral.service.ts).
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

-- Defensive: create reward_settings if the admin migrations have not been
-- applied to this database yet. Identical shape to 007_commerce_admin.sql, so
-- this is a no-op where that migration already ran.
create table if not exists public.reward_settings (
  id                       integer       primary key default 1 check (id = 1),
  bonus_type               text          not null default 'flat' check (bonus_type in ('percent', 'flat')),
  bonus_value              numeric(10,2) not null default 100,
  min_payout               numeric(10,2) not null default 100,
  max_payout               numeric(10,2) not null default 5000,
  bonus_validity_days      integer       not null default 90,
  reward_on_signup         boolean       not null default false,
  reward_on_first_purchase boolean       not null default true,
  updated_at               timestamptz   not null default now(),
  updated_by               uuid          references auth.users (id) on delete set null
);
insert into public.reward_settings (id) values (1) on conflict (id) do nothing;

alter table public.reward_settings enable row level security;
drop policy if exists "reward_settings_select_public" on public.reward_settings;
create policy "reward_settings_select_public"
  on public.reward_settings for select using (true);

-- ---------------------------------------------------------------------------
-- Shared helper: the ₹ reward for one converted referral, given the order
-- total (0 when there is no order, e.g. reward-on-signup).
-- ---------------------------------------------------------------------------
create or replace function public.referral_reward_for(p_order_total numeric)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s      public.reward_settings%rowtype;
  reward numeric(10,2);
begin
  select * into s from public.reward_settings where id = 1;
  if not found then
    return 0;
  end if;

  if s.bonus_type = 'percent' then
    reward := round(coalesce(p_order_total, 0) * coalesce(s.bonus_value, 0) / 100.0, 2);
    -- cap percentage rewards at the configured ceiling
    if coalesce(s.max_payout, 0) > 0 then
      reward := least(reward, s.max_payout);
    end if;
  else
    -- flat: pay exactly what the admin configured
    reward := coalesce(s.bonus_value, 0);
  end if;

  if reward < 0 then
    reward := 0;
  end if;
  return reward;
end;
$$;

-- ---------------------------------------------------------------------------
-- Signup: honour the "Reward on signup" toggle. Default (toggle off) is the
-- documented rule — start 'pending', reward 0, convert on first purchase.
-- ---------------------------------------------------------------------------
create or replace function public.link_referral_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer      uuid;
  reward_signup boolean;
  v_reward      numeric(10,2);
begin
  if new.referral_code is null or new.referral_code = '' then
    return new;
  end if;

  select user_id into referrer
    from public.referral_codes
   where code = upper(new.referral_code)
   limit 1;

  if referrer is null or referrer = new.id then
    return new;
  end if;

  if exists (
    select 1 from public.referrals
    where referrer_id = referrer and referred_user_id = new.id
  ) then
    return new;
  end if;

  select coalesce(reward_on_signup, false) into reward_signup
    from public.reward_settings where id = 1;

  if coalesce(reward_signup, false) then
    -- Immediate conversion. Percentage bonuses have no order yet, so they pay 0
    -- on signup and rely on the first-purchase path instead.
    v_reward := public.referral_reward_for(0);
    insert into public.referrals (referrer_id, referred_user_id, status, reward_amount, completed_at)
    values (referrer, new.id, 'successful', v_reward, now());
  else
    insert into public.referrals (referrer_id, referred_user_id, status, reward_amount)
    values (referrer, new.id, 'pending', 0);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Conversion rule: a referred student's FIRST successful project purchase
-- converts their pending inbound referral to 'successful'. The reward now comes
-- from reward_settings via referral_reward_for(). Skipped entirely when the
-- admin turns "Reward on first purchase" off.
-- sync_referral_totals() (0021) then pays the wallet + ledger from reward_amount.
-- ---------------------------------------------------------------------------
create or replace function public.convert_referral_on_first_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reward_first boolean;
  v_reward     numeric(10,2);
begin
  if new.status <> 'success' or (tg_op = 'UPDATE' and old.status = 'success') then
    return null;  -- only the pending -> success transition matters
  end if;

  select coalesce(reward_on_first_purchase, true) into reward_first
    from public.reward_settings where id = 1;
  if coalesce(reward_first, true) = false then
    return null;  -- admin disabled first-purchase rewards
  end if;

  -- only the first successful purchase
  if (select count(*) from public.purchases
      where user_id = new.user_id and status = 'success') > 1 then
    return null;
  end if;

  v_reward := public.referral_reward_for(coalesce(new.total_amount, 0));

  update public.referrals
     set status = 'successful',
         reward_amount = v_reward,
         completed_at = now()
   where referred_user_id = new.user_id
     and status = 'pending';
  return null;
end;
$$;

notify pgrst, 'reload schema';

-- Fixes: GET /rest/v1/referral_codes    -> 404 PGRST205
--        GET /rest/v1/referrals          -> 404 PGRST205
--        GET /rest/v1/referral_earnings   -> 404 PGRST205
--
-- src/services/referral.service.ts & src/services/home.service.ts:
--   getOverview() / getReferralSummary():
--     referral_codes.select("code, total_referrals, total_earned")
--       .eq("user_id", uid).single()
--   getReferralHistory() / getEarningsSummary():
--     referrals.select("*, referred_user:profiles!referrals_referred_user_id_fkey(
--       full_name, email)").eq("referrer_id", uid).order("created_at", desc)
--   getLeaderboard():
--     referrals.select("referrer_id, reward_amount, created_at,
--       referrer:profiles!referrals_referrer_id_fkey(full_name, email, avatar_url)")
--       .eq("status", "successful")
--   mapReferralRow(): id, status, reward_amount, created_at, completed_at
--
-- NOTE the FK constraint names below are the Postgres defaults
-- (referrals_referrer_id_fkey / referrals_referred_user_id_fkey), which are the
-- exact names the client passes to PostgREST for disambiguation.
--
-- `referral_earnings` is a ledger the admin panel / analytics read; the mobile
-- client derives earnings from `referrals` directly, so it is kept in sync by a
-- trigger rather than by client writes.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.referral_codes (
  user_id         uuid        primary key references public.profiles (id) on delete cascade,
  code            text        not null unique,
  total_referrals integer     not null default 0,
  total_earned    numeric(10,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.referrals (
  id               uuid        primary key default gen_random_uuid(),
  referrer_id      uuid        not null references public.profiles (id) on delete cascade,
  referred_user_id uuid        references public.profiles (id) on delete set null,
  status           text        not null default 'pending'
                     check (status in ('successful', 'pending', 'cancelled')),
  reward_amount    numeric(10,2) not null default 0,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index if not exists referrals_referrer_id_idx on public.referrals (referrer_id, created_at desc);
create index if not exists referrals_status_idx      on public.referrals (status);
create unique index if not exists referrals_unique_pair_key
  on public.referrals (referrer_id, referred_user_id) where referred_user_id is not null;

create table if not exists public.referral_earnings (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  referral_id uuid        not null references public.referrals (id) on delete cascade,
  amount      numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  unique (referral_id)
);

create index if not exists referral_earnings_user_id_idx on public.referral_earnings (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   referral_codes:    read own (created by trigger, never by the client).
--   referrals:         read rows where you are the referrer or the referee,
--                      PLUS any row that has already converted (status
--                      'successful') so the cross-user Leaderboard query works.
--                      Pending / cancelled referrals stay private. Names on the
--                      leaderboard still come from the profiles join, which is
--                      RLS-restricted (0001), so other users show as
--                      "CampusEduX Member" until a public-profiles view exists
--                      — see docs/database.md. Rows are created by the signup
--                      flow / admin via the service role.
--   referral_earnings: read own; kept in sync by trigger, no client writes.
-- ---------------------------------------------------------------------------
alter table public.referral_codes    enable row level security;
alter table public.referrals         enable row level security;
alter table public.referral_earnings enable row level security;

drop policy if exists "referral_codes_select_own" on public.referral_codes;
create policy "referral_codes_select_own"
  on public.referral_codes for select
  using (auth.uid() = user_id);

drop policy if exists "referrals_select_involved" on public.referrals;
create policy "referrals_select_involved"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_user_id);

-- Converted referrals are visible to any signed-in user so the Leaderboard
-- (referral.service.getLeaderboard) can rank across users.
drop policy if exists "referrals_select_successful" on public.referrals;
create policy "referrals_select_successful"
  on public.referrals for select
  to authenticated
  using (status = 'successful');

drop policy if exists "referral_earnings_select_own" on public.referral_earnings;
create policy "referral_earnings_select_own"
  on public.referral_earnings for select
  using (auth.uid() = user_id);

drop trigger if exists referral_codes_set_updated_at on public.referral_codes;
create trigger referral_codes_set_updated_at
  before update on public.referral_codes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Give every profile a referral code on creation, the same way 0001 makes sure
-- a user is never left without a profile row.
-- ---------------------------------------------------------------------------
create or replace function public.ensure_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base      text;
  candidate text;
  suffix    int := 0;
begin
  base := upper(regexp_replace(coalesce(split_part(new.full_name, ' ', 1), ''), '[^a-zA-Z0-9]', '', 'g'));
  if base = '' then
    base := 'PH';
  end if;
  base := left(base, 8);

  loop
    if suffix = 0 then
      candidate := base || lpad((floor(random() * 90) + 10)::int::text, 2, '0');
    else
      candidate := base || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    end if;
    exit when not exists (select 1 from public.referral_codes where code = candidate);
    suffix := suffix + 1;
  end loop;

  insert into public.referral_codes (user_id, code)
  values (new.id, candidate)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_ensure_referral_code on public.profiles;
create trigger profiles_ensure_referral_code
  after insert on public.profiles
  for each row execute function public.ensure_referral_code();

-- ---------------------------------------------------------------------------
-- When a student signs up with someone's code (authService.register puts it in
-- raw_user_meta_data -> handle_new_user copies it to profiles.referral_code),
-- record the referral so the referrer's count goes 0 -> 1. It starts 'pending'
-- (reward 0); a separate rule / admin marks it 'successful' once the referee
-- converts, at which point sync_referral_totals() credits the ₹ reward.
-- ---------------------------------------------------------------------------
create or replace function public.link_referral_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer uuid;
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

  -- guard instead of ON CONFLICT: the uniqueness is enforced by a *partial*
  -- index (referrals_unique_pair_key), which ON CONFLICT cannot infer cleanly.
  if not exists (
    select 1 from public.referrals
    where referrer_id = referrer and referred_user_id = new.id
  ) then
    insert into public.referrals (referrer_id, referred_user_id, status, reward_amount)
    values (referrer, new.id, 'pending', 0);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_link_referral on public.profiles;
create trigger profiles_link_referral
  after insert on public.profiles
  for each row execute function public.link_referral_on_signup();

-- Backfill codes for profiles that already exist. The md5(id) suffix keeps the
-- generated codes unique without a retry loop.
insert into public.referral_codes (user_id, code)
select p.id,
       upper(left(coalesce(nullif(regexp_replace(split_part(p.full_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g'), ''), 'PH'), 8))
       || upper(substr(md5(p.id::text), 1, 4))
from public.profiles p
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- A converted referral pays the referrer a wallet bonus. wallet_transactions
-- gets a nullable referral_id so that credit is (a) traceable and (b) written
-- at most once per referral. The mobile client never reads referral_id
-- (walletService.mapTransactionRow ignores it), so this column is additive.
-- ---------------------------------------------------------------------------
alter table public.wallet_transactions
  add column if not exists referral_id uuid references public.referrals (id) on delete set null;

create unique index if not exists wallet_transactions_referral_bonus_key
  on public.wallet_transactions (referral_id)
  where referral_id is not null and category = 'referral_bonus';

-- ---------------------------------------------------------------------------
-- Keep referral_codes aggregates, the referral_earnings ledger AND the
-- referrer's wallet honest as referrals are created / converted / cancelled.
-- ---------------------------------------------------------------------------
create or replace function public.sync_referral_totals()
returns trigger
language plpgsql
as $$
declare
  ref uuid := case when tg_op = 'DELETE' then old.referrer_id else new.referrer_id end;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    if new.status = 'successful' then
      -- earnings ledger: one row per successful referral
      insert into public.referral_earnings (user_id, referral_id, amount, created_at)
      values (new.referrer_id, new.id, new.reward_amount, coalesce(new.completed_at, now()))
      on conflict (referral_id) do update set amount = excluded.amount;

      -- wallet bonus: credit the referrer once (the partial unique index +
      -- this guard make repeated 'successful' updates a no-op)
      if new.reward_amount > 0
         and not exists (select 1 from public.wallet_transactions
                         where referral_id = new.id and category = 'referral_bonus') then
        insert into public.wallet_transactions (user_id, type, category, amount, description, referral_id)
        values (new.referrer_id, 'credit', 'referral_bonus', new.reward_amount, 'Referral bonus', new.id);
      end if;
    else
      -- referral reverted to pending / cancelled: undo the ledger + wallet credit
      delete from public.referral_earnings where referral_id = new.id;
      delete from public.wallet_transactions where referral_id = new.id and category = 'referral_bonus';
    end if;
  end if;
  if tg_op = 'DELETE' then
    delete from public.referral_earnings where referral_id = old.id;
    delete from public.wallet_transactions where referral_id = old.id and category = 'referral_bonus';
  end if;

  -- rollup on referral_codes
  update public.referral_codes rc
     set total_referrals = (select count(*) from public.referrals r where r.referrer_id = ref),
         total_earned    = coalesce((select sum(reward_amount) from public.referrals r
                                     where r.referrer_id = ref and r.status = 'successful'), 0)
   where rc.user_id = ref;
  return null;
end;
$$;

drop trigger if exists referrals_sync_totals on public.referrals;
create trigger referrals_sync_totals
  after insert or update or delete on public.referrals
  for each row execute function public.sync_referral_totals();

-- ---------------------------------------------------------------------------
-- Conversion rule: a referred student's FIRST successful project purchase
-- converts their pending inbound referral to 'successful' with the flat ₹100
-- referrer bonus. sync_referral_totals() above then pays the wallet + ledger.
-- (Change the amount / trigger event here to use a different rule.)
-- ---------------------------------------------------------------------------
create or replace function public.convert_referral_on_first_purchase()
returns trigger
language plpgsql
as $$
begin
  if new.status <> 'success' or (tg_op = 'UPDATE' and old.status = 'success') then
    return null;  -- only the pending -> success transition matters
  end if;
  -- only the first successful purchase
  if (select count(*) from public.purchases
      where user_id = new.user_id and status = 'success') > 1 then
    return null;
  end if;

  update public.referrals
     set status = 'successful',
         reward_amount = 100,
         completed_at = now()
   where referred_user_id = new.user_id
     and status = 'pending';
  return null;
end;
$$;

drop trigger if exists purchases_convert_referral on public.purchases;
create trigger purchases_convert_referral
  after insert or update of status on public.purchases
  for each row execute function public.convert_referral_on_first_purchase();

notify pgrst, 'reload schema';

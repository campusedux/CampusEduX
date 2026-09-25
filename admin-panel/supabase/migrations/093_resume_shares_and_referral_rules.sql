-- ============================================================================
-- 0121_resume_shares_and_referral_rules.sql   (twin: admin-panel 093, byte-identical)
-- ============================================================================
-- Purpose : (1) resume share links can only point at the caller's own resume and
--           their token/view_count can't be forged; (2) non-payment referral
--           hardening. Idempotent; twin is a no-op.
-- Audit   : DB-17, DB-08 (non-payment parts a-c), DB-38, DB-15.
--
-- Referral: what this does
--   a) reward_settings.reward_on_signup forced false + the signup trigger NEVER
--      grants a reward at signup (rewards only via the existing first-purchase
--      conversion, which is NOT touched here).
--   b) reward_settings.max_referrals_per_day (default 10, additive): a referrer
--      can gain at most N new referral rows per rolling 24h; extra signups still
--      succeed but are simply not attached.
--   c) self-referral denied when referrer and new user share a normalised email
--      (lower-case, +tag stripped, dots stripped for gmail/googlemail) or the same
--      mobile number (last 10 digits).
--   d) NEW referral codes are random (prefix<=4 letters + 8 chars from a 32-symbol
--      alphabet, crypto random). Existing codes are untouched.
--   e) referrals: the "any authenticated may read every successful row" policy is
--      dropped; users read only rows where they are referrer/referred. The
--      leaderboard moves to referral_leaderboard(text) (masked names).
-- Deliberately NOT done (payment-dependent, out of scope): reward <= share of
-- price cap, clawback on refund, minimum order / min_payout / validity-days,
-- pay-after-N-days, payer de-duplication, anything in convert_referral_on_first_purchase.
-- ============================================================================

do $$
begin
  if to_regprocedure('extensions.gen_random_bytes(integer)') is null then
    raise exception '0121 requires pgcrypto in schema "extensions"';
  end if;
end $$;

-- ---- DB-17: resume_shares ---------------------------------------------------
do $$
declare active_clause text;
begin
  if to_regclass('public.resume_shares') is null or to_regclass('public.resumes_builder') is null then
    raise notice '0121: resume_shares / resumes_builder absent - DB-17 skipped';
    return;
  end if;

  -- unguessable server-side token: 192 random bits, hex
  alter table public.resume_shares
    alter column token set default encode(extensions.gen_random_bytes(24), 'hex');

  -- blocked users must not write (0118 is_active_user); applied only when 0118
  -- exists so this file stays independently re-runnable. 0118 also rewrites
  -- these policies if it is applied afterwards.
  active_clause := case when to_regprocedure('public.is_active_user(uuid)') is not null
                        then ' and (select public.is_active_user())' else '' end;

  drop policy if exists "resume_shares_insert_own" on public.resume_shares;
  execute 'create policy "resume_shares_insert_own" on public.resume_shares for insert with check ('
    || 'auth.uid() = user_id and exists (select 1 from public.resumes_builder r where r.id = resume_id and r.user_id = auth.uid())'
    || active_clause || ')';

  drop policy if exists "resume_shares_update_own" on public.resume_shares;
  execute 'create policy "resume_shares_update_own" on public.resume_shares for update using (auth.uid() = user_id'
    || active_clause || ') with check ('
    || 'auth.uid() = user_id and exists (select 1 from public.resumes_builder r where r.id = resume_id and r.user_id = auth.uid())'
    || active_clause || ')';
end $$;

create or replace function public.resume_shares_pin_server_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Only API callers (anon/authenticated JWT roles) are pinned; service_role /
  -- SECURITY DEFINER internals (get_shared_resume bumping view_count) are not.
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.token      := encode(extensions.gen_random_bytes(24), 'hex');
      new.view_count := 0;
      new.created_at := now();
    else
      new.token      := old.token;
      new.view_count := old.view_count;
      new.created_at := old.created_at;
      new.user_id    := old.user_id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.resume_shares_pin_server_fields() from public, anon, authenticated;

do $$
begin
  if to_regclass('public.resume_shares') is null then return; end if;
  drop trigger if exists resume_shares_pin_server_fields on public.resume_shares;
  create trigger resume_shares_pin_server_fields
    before insert or update on public.resume_shares
    for each row execute function public.resume_shares_pin_server_fields();
end $$;

-- ---- DB-08 (b): daily cap setting ------------------------------------------
do $$
begin
  if to_regclass('public.reward_settings') is null then
    raise exception '0121 requires public.reward_settings';
  end if;
  alter table public.reward_settings
    add column if not exists max_referrals_per_day integer not null default 10;
  if not exists (select 1 from pg_constraint where conname = 'reward_settings_max_referrals_per_day_check') then
    alter table public.reward_settings
      add constraint reward_settings_max_referrals_per_day_check check (max_referrals_per_day between 1 and 1000);
  end if;
  -- (a) reward-at-signup off
  update public.reward_settings set reward_on_signup = false where reward_on_signup;
end $$;

-- ---- normalisation helpers ---------------------------------------------------
create or replace function public.referral_norm_email(p_email text)
returns text language plpgsql immutable set search_path = public as $$
declare
  v text := lower(btrim(coalesce(p_email, '')));
  l text; d text;
begin
  if position('@' in v) = 0 then return v; end if;
  l := split_part(v, '@', 1);
  d := split_part(v, '@', 2);
  l := split_part(l, '+', 1);
  if d in ('gmail.com', 'googlemail.com') then
    l := replace(l, '.', '');
    d := 'gmail.com';
  end if;
  return l || '@' || d;
end $$;

create or replace function public.referral_norm_mobile(p_mobile text)
returns text language sql immutable set search_path = public as $$
  select case when length(regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g')) < 7 then ''
              else right(regexp_replace(p_mobile, '\D', '', 'g'), 10) end
$$;
revoke all on function public.referral_norm_email(text), public.referral_norm_mobile(text) from public, anon, authenticated;

-- ---- DB-08 (a,b,c): signup attach trigger -----------------------------------
create or replace function public.link_referral_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  referrer   uuid;
  v_cap      integer;
  v_r_email  text;
  v_r_mobile text;
begin
  if new.referral_code is null or new.referral_code = '' then
    return new;
  end if;

  select user_id into referrer
    from public.referral_codes
   where code = upper(btrim(new.referral_code))
   limit 1;

  if referrer is null or referrer = new.id then
    return new;
  end if;

  if exists (select 1 from public.referrals
              where referrer_id = referrer and referred_user_id = new.id) then
    return new;
  end if;

  -- (c) self-referral by identity: same normalised email or same mobile
  select email, mobile_number into v_r_email, v_r_mobile from public.profiles where id = referrer;
  if public.referral_norm_email(v_r_email) <> ''
     and public.referral_norm_email(v_r_email) = public.referral_norm_email(new.email) then
    return new;
  end if;
  if public.referral_norm_mobile(v_r_mobile) <> ''
     and public.referral_norm_mobile(v_r_mobile) = public.referral_norm_mobile(new.mobile_number) then
    return new;
  end if;

  -- (b) rolling-24h cap on new attachments per referrer
  select coalesce(max_referrals_per_day, 10) into v_cap from public.reward_settings where id = 1;
  v_cap := coalesce(v_cap, 10);
  if (select count(*) from public.referrals
       where referrer_id = referrer and created_at > now() - interval '24 hours') >= v_cap then
    return new;
  end if;

  -- (a) NEVER reward at signup: always pending; conversion happens only via the
  -- existing first-purchase trigger.
  insert into public.referrals (referrer_id, referred_user_id, status, reward_amount)
  values (referrer, new.id, 'pending', 0);
  return new;
end;
$$;

-- ---- DB-38: random codes for NEW users --------------------------------------
create or replace function public.ensure_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base      text;
  candidate text;
  alphabet  constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  rnd       bytea;
  i         int;
  suffix    text;
begin
  base := upper(regexp_replace(coalesce(split_part(new.full_name, ' ', 1), ''), '[^a-zA-Z0-9]', '', 'g'));
  if base = '' then
    base := 'PH';
  end if;
  base := left(base, 4);

  loop
    rnd := extensions.gen_random_bytes(8);
    suffix := '';
    for i in 0..7 loop
      suffix := suffix || substr(alphabet, (get_byte(rnd, i) % 32) + 1, 1);
    end loop;
    candidate := base || suffix;
    exit when not exists (select 1 from public.referral_codes where code = candidate);
  end loop;

  insert into public.referral_codes (user_id, code)
  values (new.id, candidate)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ---- DB-15: referrals SELECT + leaderboard RPC ------------------------------
drop policy if exists "referrals_select_successful" on public.referrals;
-- (referrals_select_involved, auth.uid() = referrer_id or referred_user_id, remains)

create or replace function public.referral_leaderboard(p_period text default 'all_time')
returns table (
  rank              integer,
  user_id           uuid,      -- only populated for the caller's own row
  display_name      text,      -- first name + last initial
  total_referrals   integer,
  total_earned      numeric,
  is_current_user   boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_start timestamptz;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_start := case coalesce(p_period, 'all_time')
    when 'this_month' then date_trunc('month', now())
    when 'this_year'  then date_trunc('year', now())
    else null end;

  return query
  with agg as (
    select r.referrer_id,
           count(*)::integer                       as n,
           coalesce(sum(r.reward_amount), 0)::numeric as earned
      from public.referrals r
     where r.status = 'successful'
       and (v_start is null or r.created_at >= v_start)
     group by r.referrer_id
  ), ranked as (
    select a.*, (row_number() over (order by a.earned desc, a.n desc, a.referrer_id))::integer as rk from agg a
  )
  select rk,
         case when ranked.referrer_id = auth.uid() then ranked.referrer_id end,
         coalesce(
           nullif(btrim(split_part(btrim(p.full_name), ' ', 1)
                  || case when position(' ' in btrim(p.full_name)) > 0
                          then ' ' || left(btrim(substr(btrim(p.full_name), position(' ' in btrim(p.full_name)) + 1)), 1) || '.'
                          else '' end), ''),
           'CampusEduX Member'),
         ranked.n, ranked.earned, (ranked.referrer_id = auth.uid())
    from ranked
    left join public.profiles p on p.id = ranked.referrer_id
   where rk <= 50 or ranked.referrer_id = auth.uid()
   order by rk;
end;
$$;
revoke all on function public.referral_leaderboard(text) from public, anon;
grant execute on function public.referral_leaderboard(text) to authenticated;

notify pgrst, 'reload schema';

-- ---- ROLLBACK (manual) -------------------------------------------------------
-- drop trigger resume_shares_pin_server_fields on public.resume_shares; drop function public.resume_shares_pin_server_fields();
-- recreate resume_shares_insert_own / _update_own with only (auth.uid() = user_id)
-- create policy "referrals_select_successful" on public.referrals for select to authenticated using (status = 'successful');
-- drop function public.referral_leaderboard(text), public.referral_norm_email(text), public.referral_norm_mobile(text);
-- alter table public.reward_settings drop column max_referrals_per_day;
-- restore link_referral_on_signup() / ensure_referral_code() from M:0026 / M:0021 definitions.

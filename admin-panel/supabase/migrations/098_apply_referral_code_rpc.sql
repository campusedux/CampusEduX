-- ============================================================================
-- 0126_apply_referral_code_rpc.sql   (twin: admin-panel 098, byte-identical)
-- ============================================================================
-- Purpose : (1) let a brand-new Google OAuth sign-up attach a referral code
--           after the session exists, since signInWithOAuth has no
--           raw_user_meta_data channel the way signUp's options.data does
--           for email/password signup (handle_new_user(), migration 0001);
--           (2) give the referrer a privacy-safe way to see referred users'
--           progress without exposing email/phone.
-- Both functions are purely additive (new functions only) — no table,
-- column or RLS changes. Idempotent; twin is a no-op.
-- ============================================================================

-- ---- apply_referral_code(text): one-time referral attach for OAuth signup --
-- Mirrors link_referral_on_signup() (migration 0121) exactly — same
-- self-referral-by-identity check, same dedupe, same rolling-24h cap, same
-- "never reward at signup" rule (status is always 'pending', reward_amount
-- 0; conversion only happens via the existing first-purchase trigger) — but
-- callable directly by an authenticated user instead of firing off a
-- profiles insert, and guarded so it can only ever run once per profile.
create or replace function public.apply_referral_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_code     text := upper(btrim(coalesce(p_code, '')));
  referrer   uuid;
  v_cap      integer;
  v_r_email  text;
  v_r_mobile text;
  v_email    text;
  v_mobile   text;
  v_existing text;
begin
  if v_uid is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_code = '' then
    return false;
  end if;

  -- One-time only: a profile that already has a referral_code (email
  -- signup, or a prior call) never gets a second one attached.
  select referral_code, email, mobile_number into v_existing, v_email, v_mobile
    from public.profiles where id = v_uid;
  if v_existing is not null and v_existing <> '' then
    return false;
  end if;

  if exists (select 1 from public.referrals where referred_user_id = v_uid) then
    return false;
  end if;

  select user_id into referrer from public.referral_codes where code = v_code limit 1;
  if referrer is null or referrer = v_uid then
    return false;
  end if;

  -- Self-referral by identity: same normalised email or same mobile.
  select email, mobile_number into v_r_email, v_r_mobile from public.profiles where id = referrer;
  if public.referral_norm_email(v_r_email) <> ''
     and public.referral_norm_email(v_r_email) = public.referral_norm_email(v_email) then
    return false;
  end if;
  if public.referral_norm_mobile(v_r_mobile) <> ''
     and public.referral_norm_mobile(v_r_mobile) = public.referral_norm_mobile(v_mobile) then
    return false;
  end if;

  -- Rolling-24h cap on new attachments per referrer.
  select coalesce(max_referrals_per_day, 10) into v_cap from public.reward_settings where id = 1;
  v_cap := coalesce(v_cap, 10);
  if (select count(*) from public.referrals
       where referrer_id = referrer and created_at > now() - interval '24 hours') >= v_cap then
    return false;
  end if;

  update public.profiles set referral_code = v_code where id = v_uid;
  insert into public.referrals (referrer_id, referred_user_id, status, reward_amount)
  values (referrer, v_uid, 'pending', 0);
  return true;
end;
$$;
revoke all on function public.apply_referral_code(text) from public, anon;
grant execute on function public.apply_referral_code(text) to authenticated;

-- ---- referral_history(): privacy-safe progress list for the referrer ------
-- website/src/app/account/referral/page.tsx previously joined
-- profiles!referrals_referred_user_id_fkey(full_name,email) through the
-- RLS-enforced client — profiles RLS has no policy letting a referrer read
-- a referred user's row, so that join was silently denied (always null) and
-- also a latent PII-leak code path had RLS ever been loosened. This RPC
-- replaces it: scoped to the caller's own rows, masked display name only
-- (reusing the exact first-name + last-initial expression already used by
-- referral_leaderboard(text), migration 0121) — no email, no phone, ever.
create or replace function public.referral_history()
returns table (
  id                    uuid,
  status                text,
  reward_amount         numeric,
  created_at            timestamptz,
  completed_at          timestamptz,
  referred_display_name text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select r.id, r.status, r.reward_amount, r.created_at, r.completed_at,
         coalesce(
           nullif(btrim(split_part(btrim(p.full_name), ' ', 1)
                  || case when position(' ' in btrim(p.full_name)) > 0
                          then ' ' || left(btrim(substr(btrim(p.full_name), position(' ' in btrim(p.full_name)) + 1)), 1) || '.'
                          else '' end), ''),
           null
         ) as referred_display_name
    from public.referrals r
    left join public.profiles p on p.id = r.referred_user_id
   where r.referrer_id = auth.uid()
   order by r.created_at desc;
end;
$$;
revoke all on function public.referral_history() from public, anon;
grant execute on function public.referral_history() to authenticated;

notify pgrst, 'reload schema';

-- ---- ROLLBACK (manual) -------------------------------------------------------
-- drop function public.apply_referral_code(text);
-- drop function public.referral_history();

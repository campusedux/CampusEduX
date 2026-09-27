-- 0126/098: apply_referral_code(text) + referral_history() — OAuth referral
-- attach (no raw_user_meta_data channel for signInWithOAuth) and the
-- privacy-safe referral progress list.
\set ON_ERROR_STOP on
do $$
declare
  ref uuid; code text; nu uuid; ok boolean; r record; h jsonb; c int;
begin
  ref := test_make_user('ref.two206@gmail.com', '{"full_name":"Priya Sharma","mobile_number":"+91 98765 43210"}');
  select rc.code into code from referral_codes rc where user_id = ref;

  -- A Google OAuth signup never has referral_code in raw_user_meta_data —
  -- simulate that: plain signup, no code, profile.referral_code stays null.
  nu := test_make_user('oauth1-206@x.io', '{"full_name":"OAuth One"}');
  if (select referral_code from profiles where id = nu) is not null then raise exception 'FAIL fixture'; end if;

  -- denied: anon has no auth.uid()
  perform test_as(null, 'anon');
  begin
    perform apply_referral_code(code);
    raise exception 'FAIL anon should be forbidden';
  exception when insufficient_privilege then null;
  end;
  perform test_reset();

  -- allowed: the new user attaches the code to themselves, once
  perform test_as(nu);
  select apply_referral_code(code) into ok;
  if not ok then raise exception 'FAIL apply should succeed'; end if;
  select * into r from referrals where referred_user_id = nu;
  if r.referrer_id is distinct from ref or r.status <> 'pending' or r.reward_amount <> 0 then
    raise exception 'FAIL attach row %', r;
  end if;
  if (select referral_code from profiles where id = nu) <> code then raise exception 'FAIL profile code not set'; end if;

  -- denied: idempotent — a second call for the same (now already-linked) user is a no-op
  select apply_referral_code(code) into ok;
  if ok then raise exception 'FAIL second apply should be a no-op'; end if;
  if (select count(*) from referrals where referred_user_id = nu) <> 1 then raise exception 'FAIL duplicate referral row'; end if;
  perform test_reset();

  -- denied: self-referral by own code
  perform test_as(ref);
  select apply_referral_code(code) into ok;
  if ok or exists (select 1 from referrals where referred_user_id = ref) then raise exception 'FAIL self-referral by own code'; end if;
  perform test_reset();

  -- denied: self-referral by identity (same normalised gmail)
  nu := test_make_user('reftwo206+farm@googlemail.com', '{"full_name":"Dup"}');
  perform test_as(nu);
  select apply_referral_code(code) into ok;
  if ok or exists (select 1 from referrals where referred_user_id = nu) then raise exception 'FAIL self-referral by email'; end if;
  perform test_reset();

  -- denied: unknown code
  nu := test_make_user('oauth2-206@x.io', '{"full_name":"OAuth Two"}');
  perform test_as(nu);
  select apply_referral_code('NOSUCHCODE99') into ok;
  if ok then raise exception 'FAIL unknown code should not apply'; end if;
  perform test_reset();

  -- denied: over the daily cap
  select count(*) into c from referrals where referrer_id = ref;
  update reward_settings set max_referrals_per_day = c where id = 1;
  nu := test_make_user('oauth3-206@x.io', '{"full_name":"OAuth Three"}');
  perform test_as(nu);
  select apply_referral_code(code) into ok;
  if ok then raise exception 'FAIL should be blocked by daily cap'; end if;
  perform test_reset();
  update reward_settings set max_referrals_per_day = 10 where id = 1;

  -- referral_history(): masked name, own rows only, no email/phone in the row shape
  perform test_as(ref);
  select jsonb_agg(to_jsonb(x)) into h from referral_history() x;
  if h is null or not exists (select 1 from jsonb_array_elements(h) e where e->>'referred_display_name' = 'OAuth O.') then
    raise exception 'FAIL referral_history masked name %', h;
  end if;
  if exists (select 1 from jsonb_array_elements(h) e where e ? 'email' or e ? 'referred_user_id' or e ? 'mobile_number') then
    raise exception 'FAIL referral_history leaks pii %', h;
  end if;
  perform test_reset();

  -- denied: a third party sees none of ref's rows
  nu := test_make_user('third206@x.io', '{"full_name":"Zed"}');
  perform test_as(nu);
  select jsonb_agg(to_jsonb(x)) into h from referral_history() x;
  if h is not null then raise exception 'FAIL third party sees rows %', h; end if;
  perform test_reset();

  perform test_as(null, 'anon');
  begin
    perform * from referral_history();
    raise exception 'FAIL anon referral_history should be forbidden';
  exception when insufficient_privilege then null;
  end;
  perform test_reset();

  raise notice '0126/098 apply_referral_code/referral_history OK';
end $$;

-- DB-08 (a-c), DB-38, DB-15: referral hardening (non-payment parts).
\set ON_ERROR_STOP on
do $$
declare
  ref uuid; ref2 uuid; nu uuid; n int; code text; code2 text; r record; lb jsonb; third uuid; c int;
begin
  ref := test_make_user('ref.two205@gmail.com', '{"full_name":"Priya Sharma","mobile_number":"+91 98765 43210"}');
  select rc.code into code from referral_codes rc where user_id = ref;
  -- DB-38 code shape: <=4 letter prefix + 8 random chars, unguessable pattern
  if code !~ '^PRIY[A-HJ-NP-Z2-9]{8}$' then raise exception 'FAIL code shape %', code; end if;
  ref2 := test_make_user('other205@x.io', '{"full_name":"Priya Sharma"}');
  select rc.code into code2 from referral_codes rc where user_id = ref2;
  if code2 = code then raise exception 'FAIL codes collide'; end if;

  -- normal signup attaches as PENDING, reward 0
  nu := test_make_user('new1-205@x.io', jsonb_build_object('full_name','New One','referral_code', lower(code)));
  select * into r from referrals where referred_user_id = nu;
  if r.referrer_id is distinct from ref or r.status <> 'pending' or r.reward_amount <> 0 then raise exception 'FAIL normal attach %', r; end if;

  -- (a) reward_on_signup=true is neutralised: still pending, and the migration set it false
  update reward_settings set reward_on_signup = true where id = 1;
  nu := test_make_user('new2-205@x.io', jsonb_build_object('full_name','Two','referral_code', code));
  select * into r from referrals where referred_user_id = nu;
  if r.status <> 'pending' or r.reward_amount <> 0 or r.completed_at is not null then raise exception 'FAIL signup reward %', r; end if;
  if not exists (select 1 from wallet_transactions where false) and exists (select 1 from wallet_transactions where referral_id = r.id) then raise exception 'FAIL wallet credit at signup'; end if;
  update reward_settings set reward_on_signup = false where id = 1;

  -- (c) self-referral: same gmail after normalising dots / +tag / googlemail
  nu := test_make_user('reftwo205+farm@googlemail.com', jsonb_build_object('referral_code', code));
  if exists (select 1 from referrals where referred_user_id = nu) then raise exception 'FAIL email self-referral'; end if;
  nu := test_make_user('r.e.f.t.w.o205@gmail.com', jsonb_build_object('referral_code', code));
  if exists (select 1 from referrals where referred_user_id = nu) then raise exception 'FAIL dotted gmail self-referral'; end if;
  -- same mobile (different formatting)
  nu := test_make_user('diff205@x.io', jsonb_build_object('mobile_number','09876543210','referral_code', code));
  if exists (select 1 from referrals where referred_user_id = nu) then raise exception 'FAIL mobile self-referral'; end if;
  -- a non-gmail plus/dot variant is NOT the same person (dots significant elsewhere)
  nu := test_make_user('ref.two205@other.com', jsonb_build_object('referral_code', code));
  if not exists (select 1 from referrals where referred_user_id = nu) then raise exception 'FAIL false positive'; end if;

  -- (b) daily cap
  select count(*) into c from referrals where referrer_id = ref;   -- currently 3
  update reward_settings set max_referrals_per_day = c + 1 where id = 1;
  nu := test_make_user('cap1-205@x.io', jsonb_build_object('referral_code', code));
  nu := test_make_user('cap2-205@x.io', jsonb_build_object('referral_code', code));   -- over cap: signup ok, not attached
  if not exists (select 1 from profiles where id = nu) then raise exception 'FAIL signup blocked by cap'; end if;
  if (select count(*) from referrals where referrer_id = ref) <> c + 1 then raise exception 'FAIL cap (%)', (select count(*) from referrals where referrer_id = ref); end if;
  -- after 24h the window frees
  update referrals set created_at = now() - interval '25 hours' where referrer_id = ref;
  nu := test_make_user('cap3-205@x.io', jsonb_build_object('referral_code', code));
  if not exists (select 1 from referrals where referred_user_id = nu) then raise exception 'FAIL cap window reset'; end if;
  if (select max_referrals_per_day from reward_settings where id=1) is null then raise exception 'FAIL setting'; end if;
  update reward_settings set max_referrals_per_day = 10 where id = 1;

  -- (e) referrals RLS + leaderboard
  third := test_make_user('third205@x.io', '{"full_name":"Zed"}');
  update referrals set status='successful', reward_amount=100, completed_at=now() where referred_user_id = (select id from auth.users where email='new1-205@x.io');
  perform test_as(third);
  if exists (select 1 from referrals) then raise exception 'FAIL third reads referrals'; end if;
  select jsonb_agg(to_jsonb(x)) into lb from referral_leaderboard('all_time') x;
  if lb is null or lb->0->>'display_name' <> 'Priya S.' or lb->0->>'user_id' is not null or (lb->0->>'total_referrals')::int <> 1 or (lb->0->>'is_current_user')::boolean then raise exception 'FAIL leaderboard %', lb; end if;
  perform test_reset();
  perform test_as(ref);
  if (select count(*) from referrals) < 3 then raise exception 'FAIL referrer own rows'; end if;
  select jsonb_agg(to_jsonb(x)) into lb from referral_leaderboard('this_month') x;
  if lb->0->>'user_id' <> ref::text or not (lb->0->>'is_current_user')::boolean then raise exception 'FAIL own leaderboard row %', lb; end if;
  perform test_reset();
  perform test_as((select id from auth.users where email='new1-205@x.io'));
  if (select count(*) from referrals) <> 1 then raise exception 'FAIL referred own row'; end if;
  perform test_reset();
  perform test_as(null,'anon');
  begin perform * from referral_leaderboard(); raise exception 'FAIL anon leaderboard';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  raise notice 'DB-08/15/38 OK';
end $$;

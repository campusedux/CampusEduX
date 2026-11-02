-- SEC-06: real PostgreSQL RLS/RPC tests; fabricated actors only.
\set ON_ERROR_STOP on
create function pg_temp.assert_premium(actor uuid, allowed boolean, label text)
returns void language plpgsql as $$
declare note_id uuid; r jsonb; platform text;
begin
  select id into note_id from public.prep_notes where title='sec06-note';
  perform public.test_as(actor, case when actor is null then 'anon' else 'authenticated' end);
  if public.current_user_is_premium() is distinct from allowed then
    raise exception 'FAIL %: entitlement', label; end if;
  if exists(select 1 from public.prep_notes where id=note_id) is distinct from allowed then
    raise exception 'FAIL %: notes RLS', label; end if;
  if exists(select 1 from public.learning_contents where heading='sec06-body') is distinct from allowed then
    raise exception 'FAIL %: learning RLS', label; end if;
  if exists(select 1 from public.test_questions where id='sec06-question') is distinct from allowed then
    raise exception 'FAIL %: questions RLS', label; end if;
  r := public.prep_note_get(note_id);
  if r is null or (r->>'locked')::boolean is distinct from not allowed
     or (r->>'content' = 'SEC06-NOTE-CONTENT') is distinct from (case when allowed then true else null::boolean end) then
    raise exception 'FAIL %: note RPC', label; end if;
  foreach platform in array array['website','mobile'] loop
    r := public.learning_topic_content('sec06-grid','sec06-topic',platform);
    if r is null or (r->>'locked')::boolean is distinct from not allowed
       or jsonb_array_length(r->'contents') <> (case when allowed then 1 else 0 end) then
      raise exception 'FAIL %: % topic RPC', label,platform; end if;
    r := public.practice_test_questions('sec06-test',platform);
    if jsonb_array_length(r) <> (case when allowed then 1 else 0 end) then
      raise exception 'FAIL %: % questions RPC', label,platform; end if;
  end loop;
  perform public.test_reset();
  raise notice 'PASS SEC06 % (helper, 3 RLS reads, website/mobile RPCs)',label;
end $$;

do $$
declare
  u uuid; free_user uuid := test_make_user('sec06-free@example.invalid');
  g uuid; section_id uuid; topic uuid; sub uuid; label text; row_data record;
  saved jsonb; activated jsonb; changed integer;
begin
  insert into public.premium_plans(id,name) values ('sec06-plan','Fixture');
  insert into public.learning_grids(name,slug,status) values ('SEC06','sec06-grid','published') returning id into g;
  insert into public.learning_sections(grid_id,name,slug,status) values (g,'SEC06','sec06-section','published') returning id into section_id;
  insert into public.learning_topics(grid_id,section_id,title,slug,is_premium,status)
    values(g,section_id,'SEC06','sec06-topic',true,'published') returning id into topic;
  insert into public.learning_contents(topic_id,heading,body,is_premium)
    values(topic,'sec06-body','SEC06-LEARNING-CONTENT',true);
  insert into public.prep_notes(title,is_published,is_premium,content)
    values ('sec06-note',true,true,'SEC06-NOTE-CONTENT');
  insert into public.practice_tests(id,title,learning_topic_id,scope,is_premium,status)
    values ('sec06-test','SEC06',topic,'topic',true,'published');
  insert into public.test_questions(id,test_id,question_text,options,correct_index)
    values ('sec06-question','sec06-test','SEC06-QUESTION','["a","b"]',1);

  perform pg_temp.assert_premium(null,false,'missing authentication');
  perform pg_temp.assert_premium(free_user,false,'free user');
  -- Own profile updates and missing-row inserts cannot self-grant premium.
  perform test_as(free_user);
  update public.profiles set is_premium=true where id=free_user;
  if (select is_premium from public.profiles where id=free_user) then raise exception 'FAIL profile UPDATE self grant'; end if;
  begin
    perform public._has_valid_premium_subscription(free_user,clock_timestamp());
    raise exception 'FAIL internal entitlement oracle callable';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  delete from public.profiles where id=free_user;
  perform pg_temp.assert_premium(free_user,false,'missing profile');
  perform test_as(free_user);
  insert into public.profiles(id,email,is_premium) values(free_user,'sec06-free@example.invalid',true);
  if (select is_premium from public.profiles where id=free_user) then raise exception 'FAIL profile INSERT self grant'; end if;
  perform test_reset();

  -- Simulate legacy invalid rows only in this disposable fixture transaction.
  -- Production keeps every SEC-05 trigger; no historical rows are repaired.
  alter table public.premium_subscriptions disable trigger z_sec05_premium_activation;
  for row_data in select * from (values
    ('monthly',true,'monthly','active',statement_timestamp()-interval '1 day',statement_timestamp()+interval '29 days','sec06-plan'),
    ('yearly',true,'yearly','active',statement_timestamp()-interval '1 day',statement_timestamp()+interval '364 days','sec06-plan'),
    ('expired one second',false,'monthly','active',statement_timestamp()-interval '1 month',statement_timestamp()-interval '1 second','sec06-plan'),
    ('exact expiry',false,'monthly','active',statement_timestamp()-interval '1 month',statement_timestamp(),'sec06-plan'),
    ('starts now',true,'monthly','active',statement_timestamp(),statement_timestamp()+interval '1 month','sec06-plan'),
    ('future start',false,'monthly','active',statement_timestamp()+interval '1 day',statement_timestamp()+interval '1 month','sec06-plan'),
    ('cancelled',false,'monthly','cancelled',statement_timestamp()-interval '1 day',statement_timestamp()+interval '1 month','sec06-plan'),
    ('expired status',false,'monthly','expired',statement_timestamp()-interval '1 day',statement_timestamp()+interval '1 month','sec06-plan'),
    ('pending',false,'monthly','pending',statement_timestamp()-interval '1 day',statement_timestamp()+interval '1 month','sec06-plan'),
    ('missing expiry',false,'monthly','active',statement_timestamp()-interval '1 day',null,'sec06-plan'),
    ('missing start',false,'monthly','active',null,statement_timestamp()+interval '1 month','sec06-plan'),
    ('zero period',false,'monthly','active',statement_timestamp(),statement_timestamp(),'sec06-plan'),
    ('reversed period',false,'monthly','active',statement_timestamp(),statement_timestamp()-interval '1 day','sec06-plan'),
    ('infinite expiry',false,'monthly','active',statement_timestamp()-interval '1 day','infinity'::timestamptz,'sec06-plan'),
    ('infinite start',false,'monthly','active','-infinity'::timestamptz,statement_timestamp()+interval '1 month','sec06-plan'),
    ('missing plan',false,'monthly','active',statement_timestamp()-interval '1 day',statement_timestamp()+interval '1 month',null)
  ) fixtures(label,allowed,cycle,state,started,ended,plan_id) loop
    u := test_make_user('sec06-'||replace(row_data.label,' ','-')||'@example.invalid');
    insert into public.premium_subscriptions(user_id,plan_id,status,billing_cycle,started_at,current_period_end)
      values(u,row_data.plan_id,row_data.state,row_data.cycle,row_data.started,row_data.ended) returning id into sub;
    -- Controlled clock on the owner-only predicate proves exact equality,
    -- without sleeps or a public client-controlled time parameter.
    if public._has_valid_premium_subscription(u,statement_timestamp()) is distinct from row_data.allowed then
      raise exception 'FAIL %: controlled time predicate',row_data.label; end if;
    if row_data.label in ('monthly','yearly') then
      if public._has_valid_premium_subscription(u,row_data.started-interval '1 microsecond')
         or not public._has_valid_premium_subscription(u,row_data.started)
         or not public._has_valid_premium_subscription(u,row_data.ended-interval '1 microsecond')
         or public._has_valid_premium_subscription(u,row_data.ended)
         or public._has_valid_premium_subscription(u,row_data.ended+interval '1 microsecond') then
        raise exception 'FAIL %: exact [start,end) time boundaries',row_data.label; end if;
    end if;
    -- Deliberately stale mirror in both directions proves it is not authority.
    perform set_config('app.sync_is_premium','on',true);
    update public.profiles set is_premium=not row_data.allowed where id=u;
    perform set_config('app.sync_is_premium','off',true);
    perform pg_temp.assert_premium(u,row_data.allowed,row_data.label);
    if (select is_premium from public.profiles where id=u) is distinct from not row_data.allowed then
      raise exception 'FAIL authorization wrote profile'; end if;
    if row_data.label='monthly' then
      -- Revocation uses existing status=cancelled; stopping renewal is separate.
      perform test_as(u); update public.premium_subscriptions set auto_renew=false where id=sub; perform test_reset();
      perform pg_temp.assert_premium(u,true,'auto-renew off still in paid period');
      perform test_as(u);
      update public.premium_subscriptions set current_period_end=statement_timestamp()+interval '100 years' where id=sub;
      perform test_reset();
      if (select current_period_end from public.premium_subscriptions where id=sub)<>row_data.ended then
        raise exception 'FAIL owner extended period'; end if;
      update public.premium_subscriptions set status='cancelled' where id=sub;
      perform pg_temp.assert_premium(u,false,'privileged cancellation revokes');
    end if;
  end loop;
  alter table public.premium_subscriptions enable trigger z_sec05_premium_activation;

  u := test_make_user('sec06-multiple@example.invalid');
  insert into public.premium_subscriptions(user_id,plan_id,status,started_at,current_period_end)
    values(u,'sec06-plan','active',statement_timestamp()-interval '1 day',statement_timestamp()+interval '1 day');
  insert into public.premium_subscriptions(user_id,plan_id,status,started_at,current_period_end)
    values(u,'sec06-plan','expired',statement_timestamp(),statement_timestamp()+interval '1 day'),
          (u,'sec06-plan','cancelled',statement_timestamp(),statement_timestamp()+interval '1 day');
  perform pg_temp.assert_premium(u,true,'any valid subscription among newer ineligible rows');
  update public.profiles set status='blocked' where id=u;
  perform pg_temp.assert_premium(u,false,'blocked account');
  -- Suspended is not in today's profiles vocabulary. Widen ONLY this local
  -- fixture constraint to prove the helper fails closed for that future state.
  for label in select conname from pg_constraint where conrelid='public.profiles'::regclass
    and contype='c' and pg_get_constraintdef(oid) like '%status%' loop
    execute format('alter table public.profiles drop constraint %I',label);
  end loop;
  update public.profiles set status='suspended' where id=u;
  perform pg_temp.assert_premium(u,false,'suspended account fixture');

  -- SEC-05 real atomic activation, identical to the shared webhook-first RPC.
  u := test_make_user('sec06-webhook@example.invalid');
  insert into public.premium_subscriptions(user_id,plan_id,price,razorpay_order_id)
    values(u,'sec06-plan',100,'order_sec06_webhook') returning id into sub;
  perform test_as(u,'service_role');
  activated := public.activate_premium_subscription(sub,u,'order_sec06_webhook','pay_sec06_webhook','sec06-plan','monthly',11800,'INR');
  perform test_reset();
  if activated->>'alreadyActive'<>'false' or not (select is_premium from public.profiles where id=u) then
    raise exception 'FAIL SEC05 activation/mirror'; end if;
  perform pg_temp.assert_premium(u,true,'webhook-first SEC05 activation');
  perform pg_temp.assert_premium(free_user,false,'another user cannot borrow subscription');
  select to_jsonb(s) into saved from public.premium_subscriptions s where id=sub;
  perform test_as(u,'service_role');
  activated := public.activate_premium_subscription(sub,u,'order_sec06_webhook','pay_sec06_webhook','sec06-plan','monthly',11800,'INR');
  perform test_reset();
  if activated->>'alreadyActive'<>'true' or saved is distinct from (select to_jsonb(s) from public.premium_subscriptions s where id=sub) then
    raise exception 'FAIL SEC05 replay changed period'; end if;
  -- Only ordinary auto-renew remains editable; the trusted sync cannot leak
  -- its GUC privilege to the subsequent direct profile update.
  perform test_as(u); update public.premium_subscriptions set auto_renew=false where id=sub;
  update public.profiles set is_premium=false where id=u;
  if not (select is_premium from public.profiles where id=u) then raise exception 'FAIL sync privilege leaked'; end if;
  perform test_reset();
  if not exists(select 1 from public.razorpay_payment_bindings where provider_payment_id='pay_sec06_webhook') then
    raise exception 'FAIL SEC01 claim missing'; end if;
end $$;

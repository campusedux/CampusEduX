-- SEC-04. Fabricated local cx_* fixtures only, through the ordered harness.
\set ON_ERROR_STOP on
create function public.sec04_fixture_failure() returns trigger language plpgsql as $$
begin
  if (tg_table_name='wallet_transactions' and new.category='project_purchase'
      and current_setting('sec04.fixture_failure',true)='debit')
     or (tg_table_name='wallet_transactions' and new.category='referral_bonus'
      and current_setting('sec04.fixture_failure',true)='referral') then
    raise exception 'disposable ledger failure' using errcode='23514';
  end if;
  return new;
end $$;
create trigger sec04_fixture_debit_failure before insert on public.wallet_transactions
  for each row execute function public.sec04_fixture_failure();
create function public.sec04_fixture_sales_failure() returns trigger language plpgsql as $$
begin
  if new.sales_count is distinct from old.sales_count and current_setting('sec04.fixture_failure',true)='sales' then
    raise exception 'disposable sales failure' using errcode='23514';
  end if;
  return new;
end $$;
create trigger sec04_fixture_sales_failure before update on public.projects
  for each row execute function public.sec04_fixture_sales_failure();

do $$
declare
  u uuid := test_make_user('sec04-owner@example.invalid');
  stranger uuid := test_make_user('sec04-stranger@example.invalid');
  referrer uuid := test_make_user('sec04-referrer@example.invalid');
  admin_id uuid := test_make_user('sec04-admin@example.invalid');
  p uuid; p2 uuid; p3 uuid; rid uuid; refund uuid; debit uuid; result jsonb;
  mode text; bad text; affected integer;
begin
  insert into public.projects(id,title) values ('sec04-project','Fixture'),('sec04-other','Other fixture');
  insert into public.coupons(code) values ('SEC04');
  insert into public.referrals(referrer_id,referred_user_id) values (referrer,u) returning id into rid;
  insert into public.purchases(user_id,project_id,price,total_amount,coupon_code,razorpay_order_id)
    values(u,'sec04-project',10.01,10.01,'SEC04','order_sec04') returning id into p;
  insert into public.purchases(user_id,project_id,total_amount,razorpay_order_id)
    values(u,'sec04-other',10.01,'order_sec04_second') returning id into p2;
  perform test_as(u,'service_role');
  begin
    perform public.settle_project_purchase(p,stranger,'order_sec04','pay_sec04',1001,'INR');
    raise exception 'FAIL wrong owner';
  exception when check_violation then null; end;
  begin
    perform public.settle_project_purchase(p,u,'order_wrong','pay_sec04',1001,'INR');
    raise exception 'FAIL wrong order';
  exception when check_violation then null; end;
  begin
    perform public.settle_project_purchase(p,u,'order_sec04','pay_sec04',1000,'INR');
    raise exception 'FAIL wrong amount';
  exception when check_violation then null; end;
  foreach bad in array array['USD','',null] loop
    begin
      perform public.settle_project_purchase(p,u,'order_sec04','pay_sec04',1001,bad);
      raise exception 'FAIL wrong currency';
    exception when check_violation then null; end;
  end loop;
  foreach bad in array array['','   ',null] loop
    begin
      perform public.settle_project_purchase(p,u,'order_sec04',bad,1001,'INR');
      raise exception 'FAIL empty payment';
    exception when check_violation then null; end;
  end loop;

  foreach mode in array array['debit','sales','referral'] loop
    perform set_config('sec04.fixture_failure',mode,true);
    begin
      perform public.settle_project_purchase(p,u,'order_sec04','pay_sec04',1001,'INR');
      raise exception 'FAIL injected financial failure';
    exception when check_violation then null; end;
    perform test_reset(); -- internal SEC-01 claims are intentionally unreadable to service_role
    if (select status from public.purchases where id=p) <> 'pending'
       or exists(select 1 from public.wallet_transactions where purchase_id=p or referral_id=rid)
       or exists(select 1 from public.referral_earnings where referral_id=rid)
       or (select sales_count from public.projects where id='sec04-project') <> 0
       or (select used_count from public.coupons where code='SEC04') <> 0
       or (select status from public.referrals where id=rid) <> 'pending'
       or exists(select 1 from public.razorpay_payment_bindings where provider_payment_id='pay_sec04') then
      raise exception 'FAIL transaction partially committed';
    end if;
    perform test_as(u,'service_role');
  end loop;
  perform set_config('sec04.fixture_failure','off',true);
  result := public.settle_project_purchase(p,u,'order_sec04','pay_sec04',1001,'INR');
  if result->>'alreadySettled' <> 'false' or result#>>'{purchase,status}' <> 'success'
     or result#>>'{purchase,project,title}' <> 'Fixture'
     or (result->'purchase') ? 'user_id' then raise exception 'FAIL public result contract'; end if;
  result := public.settle_project_purchase(p,u,'order_sec04','pay_sec04',1001,'INR');
  if result->>'alreadySettled' <> 'true'
     or (select count(*) from public.wallet_transactions where purchase_id=p) <> 1
     or (select amount from public.wallet_transactions where purchase_id=p) <> 10.01
     or (select count(*) from public.wallet_transactions where referral_id=rid) <> 1
     or (select count(*) from public.referral_earnings where referral_id=rid) <> 1
     or (select sales_count from public.projects where id='sec04-project') <> 1
     or (select used_count from public.coupons where code='SEC04') <> 1 then
    raise exception 'FAIL duplicate or missing effect';
  end if;
  begin
    perform public.settle_project_purchase(p,u,'order_sec04','pay_different',1001,'INR');
    raise exception 'FAIL changed settled payment';
  exception when check_violation then null; end;
  begin
    perform public.settle_project_purchase(p2,u,'order_sec04_second','pay_sec04',1001,'INR');
    raise exception 'FAIL reused payment';
  exception when unique_violation then null; end;
  -- A signed failed-attempt ID can be replaced by a captured retry on its order.
  update public.purchases set status='failed',razorpay_payment_id='pay_sec04_failed' where id=p2;
  result := public.settle_project_purchase(p2,u,'order_sec04_second','pay_sec04_retry',1001,'INR');
  if result->>'alreadySettled' <> 'false' then raise exception 'FAIL legitimate retry'; end if;

  perform test_reset();
  set constraints all immediate;
  select id into debit from public.wallet_transactions where purchase_id=p;
  begin
    delete from public.wallet_transactions where id=debit;
    raise exception 'FAIL deleted linked spend';
  exception when check_violation then null; end;
  begin
    update public.wallet_transactions set purchase_id=null where id=debit;
    raise exception 'FAIL unlinked spend';
  exception when check_violation then null; end;
  begin
    update public.wallet_transactions set amount=1 where id=debit;
    raise exception 'FAIL altered spend';
  exception when check_violation then null; end;
  begin
    insert into public.wallet_transactions(user_id,type,category,amount,purchase_id)
      values(u,'debit','project_purchase',10.01,p);
    raise exception 'FAIL duplicate spend';
  exception when unique_violation then null; end;
  begin
    update public.purchases set project_id='sec04-other' where id=p;
    raise exception 'FAIL changed bound entitlement';
  exception when check_violation then null; end;
  begin
    update public.purchases set total_amount=1 where id=p;
    raise exception 'FAIL changed bound amount';
  exception when check_violation then null; end;

  -- Owner cancellation remains available before settlement, but cannot revoke
  -- existing success. Neither owner, stranger, anon nor an admin can call RPC.
  foreach mode in array array['authenticated','anon'] loop
    perform test_as(u,mode);
    begin
      perform public.settle_project_purchase(p,u,'order_sec04','pay_sec04',1001,'INR');
      raise exception 'FAIL public RPC execution';
    exception when insufficient_privilege then null; end;
    perform test_reset();
  end loop;
  perform test_as(u);
  if not exists(select 1 from public.purchases where id=p and status='success') then
    raise exception 'FAIL legitimate entitlement hidden'; end if;
  begin
    update public.purchases set status='failed',failure_reason='late cancellation' where id=p;
    raise exception 'FAIL owner downgraded success';
  exception when check_violation or insufficient_privilege then null; end;
  perform test_reset(); perform test_as(stranger);
  if exists(select 1 from public.purchases where id=p) then raise exception 'FAIL foreign entitlement'; end if;
  update public.purchases set status='failed' where id=p;
  get diagnostics affected=row_count;
  if affected <> 0 then raise exception 'FAIL foreign cancellation'; end if;
  perform test_reset();

  -- Exercise the actual existing admin refund RPC without changing its policy.
  insert into public.admin_users(id,email,role,status) values(admin_id,'sec04-admin@example.invalid','super_admin','active');
  insert into public.refund_requests(user_id,purchase_id,amount,refund_to)
    values(u,p,10.01,'wallet') returning id into refund;
  perform test_as(admin_id);
  begin
    perform public.settle_project_purchase(p,u,'order_sec04','pay_sec04',1001,'INR');
    raise exception 'FAIL admin direct settlement';
  exception when insufficient_privilege then null; end;
  perform public.admin_process_refund(refund,'approve','fabricated fixture');
  perform test_reset();
  if (select status from public.purchases where id=p) <> 'refunded'
     or (select count(*) from public.wallet_transactions where purchase_id=p) <> 1
     or (select count(*) from public.wallet_transactions where user_id=u and category='cashback') <> 1 then
    raise exception 'FAIL existing refund contract'; end if;
  perform test_as(u,'service_role');
  begin
    perform public.settle_project_purchase(p,u,'order_sec04','pay_sec04',1001,'INR');
    raise exception 'FAIL refunded replay';
  exception when check_violation then null; end;
  begin
    update public.purchases set status='pending' where id=p;
    raise exception 'FAIL reopened terminal purchase';
  exception when check_violation then null; end;
  begin
    update public.purchases set razorpay_payment_id='pay_changed_refund' where id=p;
    raise exception 'FAIL changed refunded payment';
  exception when check_violation then null; end;
  -- No cancelled/revoked purchase statuses exist. Reject unsupported states.
  begin
    update public.purchases set status='cancelled' where id=p2;
    raise exception 'FAIL unsupported cancellation state';
  exception when check_violation then null; end;
  perform test_reset();
  -- Existing account-deletion cascades still remove both sides together.
  delete from auth.users where id=u;
  if exists(select 1 from public.wallet_transactions where purchase_id in (p,p2)) then
    raise exception 'FAIL account-deletion cascade'; end if;
  -- The effects must also precede integrity checks with immediate constraints.
  insert into public.purchases(user_id,project_id,total_amount,razorpay_order_id)
    values(stranger,'sec04-project',10.01,'order_sec04_immediate') returning id into p3;
  perform test_as(stranger,'service_role');
  result := public.settle_project_purchase(p3,stranger,'order_sec04_immediate','pay_sec04_immediate',1001,'INR');
  if result->>'alreadySettled' <> 'false' then raise exception 'FAIL immediate constraint settlement'; end if;
  perform test_reset();
end $$;

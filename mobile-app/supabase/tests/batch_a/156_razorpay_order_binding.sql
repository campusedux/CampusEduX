-- SEC-01: run through the ordered disposable local cx_* harness only.
-- Uses fabricated identities only. No provider requests, real payments or remote DB.
\set ON_ERROR_STOP on
do $$
declare
  u uuid := test_make_user('sec01-fixture@example.invalid');
  other_user uuid := test_make_user('sec01-other-fixture@example.invalid');
  w uuid; w2 uuid; p uuid; r uuid; token uuid; premium uuid; balance_payment uuid;
  affected integer;
  target record;
begin
  insert into public.projects(id,title) values ('sec01-project','Fixture');
  insert into public.purchases(user_id,project_id,total_amount)
    values (u,'sec01-project',10) returning id into p;
  insert into public.wallet_topup_orders(user_id,amount,razorpay_order_id)
    values (u,10,'order_sec01_wallet') returning id into w;
  insert into public.wallet_topup_orders(user_id,amount)
    values (u,100000) returning id into w2;
  update public.wallet_topup_orders set status='paid', razorpay_payment_id='pay_sec01_wallet' where id=w;
  -- Same pair remains valid; no claim can migrate to another owner or surface.
  update public.wallet_topup_orders set razorpay_payment_id='pay_sec01_wallet' where id=w;
  begin
    update public.purchases set razorpay_order_id='order_sec01_wallet' where id=p;
    raise exception 'FAIL reused order across surfaces';
  exception when unique_violation then null; end;
  update public.wallet_topup_orders set razorpay_order_id='order_sec01_other' where id=w2;
  begin
    update public.wallet_topup_orders set status='paid', razorpay_payment_id='pay_sec01_wallet' where id=w2;
    raise exception 'FAIL payment reuse';
  exception when unique_violation then null; end;
  if (select status from public.wallet_topup_orders where id=w2) <> 'created' then
    raise exception 'FAIL rejected reuse changed financial state';
  end if;
  begin
    update public.wallet_topup_orders set razorpay_order_id=null where id=w;
    raise exception 'FAIL unbound settled order';
  exception when check_violation then null; end;
  begin
    update public.wallet_topup_orders set razorpay_order_id='order_wrong' where id=w;
    raise exception 'FAIL rebound settled order';
  exception when check_violation then null; end;
  begin
    update public.wallet_topup_orders set razorpay_payment_id='pay_wrong' where id=w;
    raise exception 'FAIL replaced settled payment';
  exception when check_violation then null; end;
  begin
    update public.purchases set razorpay_payment_id='pay_unbound' where id=p;
    raise exception 'FAIL payment without order';
  exception when check_violation then null; end;
  begin
    update public.purchases set razorpay_order_id='   ' where id=p;
    raise exception 'FAIL empty order binding';
  exception when check_violation then null; end;

  -- A failed attempt can retry on the SAME immutable provider order.
  update public.wallet_topup_orders set status='failed', razorpay_payment_id='pay_failed_attempt' where id=w2;
  update public.wallet_topup_orders set status='paid', razorpay_payment_id='pay_retry_attempt' where id=w2;
  -- SEC-03 adds a deferred paid/credit invariant. Preserve all SEC-01 checks
  -- while supplying the corresponding credits in this same fixture transaction.
  if exists (select 1 from information_schema.columns where table_schema='public'
      and table_name='wallet_transactions' and column_name='topup_order_id') then
    execute 'insert into public.wallet_transactions(user_id,type,category,amount,description,topup_order_id)
      select user_id,''credit'',''added_money'',amount,''Fixture'',id
      from public.wallet_topup_orders where id in ($1,$2)' using w,w2;
  end if;

  insert into public.custom_project_requests(user_id,title,project_type,project_level,platform,
    service_scope,assessment_use,integrity_acknowledged_at,payment_order_id,token_amount,estimated_total)
    values (u,'Fixture','personal','standard','web','custom_software','no',now(),'order_sec01_token',10,100) returning id into r;
  insert into public.custom_project_payments(request_id,user_id,project_type,kind,amount,razorpay_order_id)
    values (r,u,'personal','token',10,'order_sec01_token') returning id into token;
  update public.custom_project_requests set token_payment_status='paid', payment_id='pay_sec01_token' where id=r;
  update public.custom_project_payments set status='paid', razorpay_payment_id='pay_sec01_token' where id=token;
  if (select count(*) from public.razorpay_payment_bindings where provider_payment_id='pay_sec01_token') <> 1 then
    raise exception 'FAIL token mirror did not share one binding';
  end if;

  -- Preserve buyer cancellation but prevent supplying a provider identity/price.
  perform test_as(u);
  if not exists (select 1 from public.purchases where id=p)
     or not exists (select 1 from public.wallet_topup_orders where id=w) then
    raise exception 'FAIL owner cannot read own payment rows';
  end if;
  update public.purchases set status='failed', failure_reason='Fixture cancellation' where id=p;
  begin
    update public.purchases set razorpay_order_id='order_attacker' where id=p;
    raise exception 'FAIL buyer assigned provider order';
  exception when insufficient_privilege then null; end;
  begin
    update public.purchases set total_amount=100000 where id=p;
    raise exception 'FAIL buyer changed trusted amount';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.razorpay_payment_bindings values ('pay_direct','order_sec01_wallet');
    raise exception 'FAIL buyer wrote internal claim';
  exception when insufficient_privilege then null; end;
  begin
    perform public._claim_razorpay_binding('purchase',p,'order_direct','pay_direct');
    raise exception 'FAIL buyer invoked internal claim';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(other_user);
  if exists (select 1 from public.purchases where id=p)
     or exists (select 1 from public.wallet_topup_orders where id=w)
     or exists (select 1 from public.custom_project_requests where id=r)
     or exists (select 1 from public.custom_project_payments where id=token) then
    raise exception 'FAIL another owner read protected payment rows';
  end if;
  update public.purchases set failure_reason='Unauthorized fixture' where id=p;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL another owner updated purchase'; end if;
  perform test_reset();
  perform test_as(null,'anon');
  if exists (select 1 from public.purchases where id=p)
     or exists (select 1 from public.wallet_topup_orders where id=w) then
    raise exception 'FAIL anonymous payment row read';
  end if;
  begin
    perform 1 from public.razorpay_order_bindings;
    raise exception 'FAIL anonymous claim read';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- Edge Functions use service_role. Internal trigger calls are allowed, but
  -- that role cannot bypass claim uniqueness by writing the claim tables.
  perform test_as(u,'service_role');
  update public.purchases set razorpay_order_id='order_sec01_purchase' where id=p;
  update public.purchases set status='success', razorpay_payment_id='pay_sec01_purchase' where id=p;
  -- SEC-05 requires the premium fixture to include its paid plan and period.
  insert into public.premium_plans(id,name) values ('sec01-premium-plan','Fixture');
  insert into public.premium_subscriptions(user_id,plan_id,price,razorpay_order_id)
    values (u,'sec01-premium-plan',10,'order_sec01_premium') returning id into premium;
  perform public.activate_premium_subscription(premium,u,'order_sec01_premium',
    'pay_sec01_premium','sec01-premium-plan','monthly',1180,'INR');
  if (select status from public.premium_subscriptions where id=premium) <> 'active' then
    raise exception 'FAIL service-role premium transition was pinned';
  end if;
  insert into public.custom_project_payments(request_id,user_id,project_type,kind,amount,razorpay_order_id)
    values (r,u,'personal','balance',20,'order_sec01_balance') returning id into balance_payment;
  update public.custom_project_payments set status='paid', razorpay_payment_id='pay_sec01_balance' where id=balance_payment;
  if (select amount_paid from public.custom_project_requests where id=r) <> 30 then
    raise exception 'FAIL valid balance payment did not preserve existing credit trigger';
  end if;
  update public.wallet_topup_orders set razorpay_payment_id='pay_sec01_wallet' where id=w;
  begin
    update public.wallet_topup_orders set razorpay_order_id='order_service_rebind' where id=w;
    raise exception 'FAIL service role rebound a provider order';
  exception when check_violation then null; end;
  for target in select * from (values
    ('purchases','razorpay_order_id','razorpay_payment_id',p),
    ('wallet_topup_orders','razorpay_order_id','razorpay_payment_id',w),
    ('premium_subscriptions','razorpay_order_id','razorpay_payment_id',premium),
    ('custom_project_requests','payment_order_id','payment_id',r),
    ('custom_project_payments','razorpay_order_id','razorpay_payment_id',balance_payment)
  ) as targets(table_name,order_column,payment_column,row_id)
  loop
    begin
      execute format('update public.%I set %I=null where id=$1',target.table_name,target.order_column) using target.row_id;
      raise exception 'FAIL service role cleared binding on %',target.table_name;
    exception when check_violation then null; end;
    begin
      execute format('update public.%I set %I=''order_other_fixture'' where id=$1',target.table_name,target.order_column) using target.row_id;
      raise exception 'FAIL service role replaced binding on %',target.table_name;
    exception when check_violation then null; end;
    begin
      execute format('update public.%I set %I=''pay_other_fixture'' where id=$1',target.table_name,target.payment_column) using target.row_id;
      raise exception 'FAIL service role replaced settled payment on %',target.table_name;
    exception when check_violation then null; end;
    begin
      execute format('update public.%I set user_id=$1 where id=$2',target.table_name) using other_user,target.row_id;
      raise exception 'FAIL service role changed bound owner on %',target.table_name;
    exception when check_violation then null; end;
  end loop;
  begin
    update public.custom_project_payments set kind='token' where id=balance_payment;
    raise exception 'FAIL balance payment changed logical owner type';
  exception when check_violation then null; end;
  begin
    select count(*) into affected from public.razorpay_payment_bindings;
    raise exception 'FAIL service role read internal claims directly';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.razorpay_payment_bindings where provider_payment_id='pay_sec01_wallet';
    raise exception 'FAIL service role deleted replay protection';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  if exists (select 1 from pg_class where oid in (
      'public.razorpay_order_bindings'::regclass,'public.razorpay_payment_bindings'::regclass)
      and not relrowsecurity) then raise exception 'FAIL claim table RLS disabled'; end if;
  if exists (select 1 from pg_policies where tablename in ('razorpay_order_bindings','razorpay_payment_bindings')) then
    raise exception 'FAIL internal claim tables have client policies';
  end if;
  raise notice 'SEC-01 binding checks OK';
end $$;

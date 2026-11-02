-- SEC-03: real PostgreSQL allowed/denied/failure/integrity tests; disposable cx_* only.
\set ON_ERROR_STOP on
create function public.sec03_fixture_credit_failure() returns trigger language plpgsql as $$
begin
  if current_setting('sec03.fixture_failure',true) = 'on' and new.topup_order_id is not null then
    raise exception 'disposable ledger failure' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger sec03_fixture_credit_failure before insert on public.wallet_transactions
  for each row execute function public.sec03_fixture_credit_failure();

do $$
declare
  u uuid := test_make_user('sec03-owner@example.invalid');
  other_user uuid := test_make_user('sec03-other@example.invalid');
  w uuid; w2 uuid; result jsonb; credit_id uuid; affected integer;
begin
  insert into public.wallet_topup_orders(user_id,amount,razorpay_order_id)
    values (u,10.01,'order_sec03_wallet') returning id into w;
  insert into public.wallet_topup_orders(user_id,amount,razorpay_order_id)
    values (u,20,'order_sec03_retry') returning id into w2;
  perform test_as(u,'service_role');
  -- Every verified expectation is revalidated under the database lock.
  begin
    perform public.settle_wallet_topup(w,other_user,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
    raise exception 'FAIL wrong owner';
  exception when check_violation then null; end;
  begin
    perform public.settle_wallet_topup(w,u,'order_wrong','pay_sec03_wallet',1001,'INR');
    raise exception 'FAIL wrong provider order';
  exception when check_violation then null; end;
  begin
    perform public.settle_wallet_topup(gen_random_uuid(),u,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
    raise exception 'FAIL wrong local order';
  exception when check_violation then null; end;
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1000,'INR');
    raise exception 'FAIL incorrect amount';
  exception when check_violation then null; end;
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1001,'USD');
    raise exception 'FAIL incorrect currency';
  exception when check_violation then null; end;
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet',' ',1001,'INR');
    raise exception 'FAIL blank payment';
  exception when check_violation then null; end;
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',null,'INR');
    raise exception 'FAIL null amount';
  exception when check_violation then null; end;

  -- Actual trigger failure after the order update: paid state/claim must roll back.
  perform set_config('sec03.fixture_failure','on',true);
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
    raise exception 'FAIL ledger failure accepted';
  exception when check_violation then null; end;
  perform set_config('sec03.fixture_failure','off',true);
  perform test_reset();
  if (select status from public.wallet_topup_orders where id=w) <> 'created'
     or exists (select 1 from public.wallet_transactions where topup_order_id=w)
     or exists (select 1 from public.razorpay_payment_bindings where provider_payment_id='pay_sec03_wallet') then
    raise exception 'FAIL failed insertion left financial state/claim';
  end if;
  perform test_as(u,'service_role');
  -- A later error in the outer transaction also rolls back a successful RPC.
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
    raise division_by_zero;
  exception when division_by_zero then null; end;
  if (select status from public.wallet_topup_orders where id=w) <> 'created'
     or exists (select 1 from public.wallet_transactions where topup_order_id=w) then
    raise exception 'FAIL outer transaction did not roll back';
  end if;

  result := public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
  if result <> '{"amount":10.01,"alreadySettled":false}'::jsonb then
    raise exception 'FAIL initial result %', result;
  end if;
  set constraints all immediate;
  set constraints all deferred;
  select id into credit_id from public.wallet_transactions where topup_order_id=w;
  result := public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
  if result <> '{"amount":10.01,"alreadySettled":true}'::jsonb
     or (select count(*) from public.wallet_transactions where topup_order_id=w) <> 1
     or (select id from public.wallet_transactions where topup_order_id=w) <> credit_id then
    raise exception 'FAIL replay changed credit';
  end if;
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_other',1001,'INR');
    raise exception 'FAIL settled payment replacement';
  exception when check_violation then null; end;
  begin
    perform public.settle_wallet_topup(w2,u,'order_sec03_retry','pay_sec03_wallet',2000,'INR');
    raise exception 'FAIL reused payment';
  exception when unique_violation then null; end;
  -- A failed provider attempt may be retried on the same immutable provider order.
  update public.wallet_topup_orders set status='failed',razorpay_payment_id='pay_sec03_failed' where id=w2;
  perform public.settle_wallet_topup(w2,u,'order_sec03_retry','pay_sec03_retry',2000,'INR');
  set constraints all immediate;
  set constraints all deferred;

  begin
    insert into public.wallet_transactions(user_id,type,category,amount,topup_order_id)
      values (u,'credit','added_money',10.01,w);
    raise exception 'FAIL duplicate credit';
  exception when unique_violation then null; end;
  begin
    update public.wallet_transactions set amount=11 where id=credit_id;
    set constraints all immediate;
    raise exception 'FAIL changed credited amount';
  exception when check_violation then null; end;
  begin
    update public.wallet_transactions set topup_order_id=null where id=credit_id;
    set constraints all immediate;
    raise exception 'FAIL unlinked credit';
  exception when check_violation then null; end;
  begin
    delete from public.wallet_transactions where id=credit_id;
    set constraints all immediate;
    raise exception 'FAIL removed settled credit';
  exception when check_violation then null; end;
  begin
    update public.wallet_topup_orders set amount=11 where id=w;
    raise exception 'FAIL changed settled financial terms';
  exception when check_violation then null; end;
  begin
    update public.wallet_topup_orders set status='failed' where id=w;
    raise exception 'FAIL downgraded paid order';
  exception when check_violation then null; end;
  begin
    insert into public.wallet_topup_orders(user_id,amount,status,razorpay_order_id,razorpay_payment_id)
      values (u,10,'paid','order_sec03_no_credit','pay_sec03_no_credit');
    set constraints all immediate;
    raise exception 'FAIL direct paid order without credit';
  exception when check_violation then null; end;
  if (select sum(case when type='credit' then amount else -amount end)
      from public.wallet_transactions where user_id=u) <> 30.01 then
    raise exception 'FAIL balance';
  end if;
  perform test_reset();

  -- Actual execute permissions, including a caller claiming a service JWT.
  perform test_as(u);
  perform set_config('request.jwt.claim.role','service_role',true);
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
    raise exception 'FAIL owner direct settlement';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.wallet_transactions(user_id,type,category,amount,topup_order_id)
      values (u,'credit','added_money',1,w2);
    raise exception 'FAIL owner direct credit';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(other_user);
  if exists (select 1 from public.wallet_transactions where topup_order_id=w) then
    raise exception 'FAIL other owner read credit';
  end if;
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
    raise exception 'FAIL other owner settlement';
  exception when insufficient_privilege then null; end;
  update public.wallet_topup_orders set status='paid' where id=w2;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL direct unauthorized paid transition'; end if;
  perform test_reset();
  perform test_as(null,'anon');
  begin
    perform public.settle_wallet_topup(w,u,'order_sec03_wallet','pay_sec03_wallet',1001,'INR');
    raise exception 'FAIL anonymous settlement';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  if has_function_privilege('authenticated','public.settle_wallet_topup(uuid,uuid,text,text,bigint,text)','execute')
     or has_function_privilege('anon','public.settle_wallet_topup(uuid,uuid,text,text,bigint,text)','execute') then
    raise exception 'FAIL exposed settlement function';
  end if;
  -- Profile deletion must retain existing account cleanup behavior.
  delete from auth.users where id=u;
  set constraints all immediate;
  if exists (select 1 from public.wallet_transactions where topup_order_id in (w,w2)) then
    raise exception 'FAIL account deletion cascade';
  end if;
  raise notice 'SEC-03 settlement SQL checks passed';
end $$;

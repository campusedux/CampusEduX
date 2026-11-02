-- SEC-05: fabricated records, ordered disposable cx_* harness only.
\set ON_ERROR_STOP on
create function pg_temp.expect_failure(statement text, expected text default '23514')
returns void language plpgsql as $$
begin
  execute statement;
  raise exception 'FAIL statement unexpectedly succeeded: %', statement;
exception when others then
  if sqlstate <> expected then raise; end if;
end $$;

do $$
declare
  u uuid := test_make_user('sec05-owner@example.invalid');
  stranger uuid := test_make_user('sec05-stranger@example.invalid');
  a uuid; b uuid; missing uuid; result jsonb; saved jsonb; cycle text; suffix text;
  query text; entry text; affected integer; amount numeric; expected bigint;
begin
  insert into public.premium_plans(id,name,monthly_price,yearly_price)
    values ('sec05-plan','Fixture',74.75,700),('sec05-other','Other',5,50);
  -- Same semantics as the original UTC Date setters, including overflow.
  if public.premium_billing_period_end('2025-01-31 12:34:56.123456+00','monthly') <> '2025-03-03 12:34:56.123456+00'
     or public.premium_billing_period_end('2024-01-31 12:00+00','monthly') <> '2024-03-02 12:00+00'
     or public.premium_billing_period_end('2024-02-29 23:00+00','yearly') <> '2025-03-01 23:00+00'
     or public.premium_billing_period_end('2025-12-31 12:00+00','monthly') <> '2026-01-31 12:00+00' then
    raise exception 'FAIL UTC duration semantics'; end if;
  perform set_config('TimeZone','Asia/Kolkata',true);
  if public.premium_billing_period_end('2024-02-29 23:00+00','yearly') <> '2025-03-01 23:00+00' then
    raise exception 'FAIL session timezone changed period'; end if;
  perform pg_temp.expect_failure($q$select public.premium_billing_period_end(null,'monthly')$q$);
  perform pg_temp.expect_failure($q$select public.premium_billing_period_end('infinity','monthly')$q$);
  perform pg_temp.expect_failure($q$select public.premium_billing_period_end(now(),'weekly')$q$);
  perform pg_temp.expect_failure($q$select public.premium_billing_period_end(now(),null)$q$);

  foreach cycle in array array['monthly','yearly'] loop
    suffix := 'sec05_'||cycle;
    insert into public.premium_subscriptions(user_id,plan_id,billing_cycle,price,razorpay_order_id)
      values(u,'sec05-plan',cycle,74.75,'order_'||suffix) returning id into a;
    query := format('select public.activate_premium_subscription(%L,%L,%L,%L,%L,%L,8821,''INR'')',
      a,u,'order_'||suffix,'pay_'||suffix,'sec05-plan',cycle);
    -- Catalog price changes must not reprice a captured checkout snapshot.
    update public.premium_plans set monthly_price=100,yearly_price=1000 where id='sec05-plan';
    perform test_as(u,'service_role'); execute query into result;
    if result->>'alreadyActive' <> 'false' then raise exception 'FAIL initial activation'; end if;
    perform test_reset();
    if not exists(select 1 from public.premium_subscriptions where id=a and status='active'
      and razorpay_payment_id='pay_'||suffix and payment_method='Razorpay'
      and current_period_end=public.premium_billing_period_end(started_at,cycle)) then
      raise exception 'FAIL bounded paid activation'; end if;
    if not (select is_premium from public.profiles where id=u) then raise exception 'FAIL profile sync'; end if;
    select to_jsonb(s) into saved from public.premium_subscriptions s where id=a;
    perform test_as(u,'service_role'); execute query into result; perform test_reset();
    if result->>'alreadyActive'<>'true' or saved is distinct from
      (select to_jsonb(s) from public.premium_subscriptions s where id=a) then raise exception 'FAIL retry reset'; end if;
    -- Existing legitimate admin extensions survive callback/webhook replay.
    perform test_as(u,'service_role');
    update public.premium_subscriptions set current_period_end=current_period_end+interval '3 days' where id=a;
    perform test_reset();
    select to_jsonb(s) into saved from public.premium_subscriptions s where id=a;
    perform test_as(u,'service_role'); execute query into result; perform test_reset();
    if saved is distinct from (select to_jsonb(s) from public.premium_subscriptions s where id=a) then
      raise exception 'FAIL legitimate prior period overwritten'; end if;
  end loop;

  -- Existing JS GST behavior, including binary half-cent cases. No repricing.
  for amount,expected in select * from (values
    (1.25::numeric,147::bigint),(5.75,678),(6.75,796),(10.75,1268),(74.75,8821),(100.00,11800)
  ) prices loop
    insert into public.premium_subscriptions(user_id,plan_id,price,razorpay_order_id)
      values(u,'sec05-plan',amount,'order_sec05_gst_'||amount::text) returning id into b;
    perform test_as(u,'service_role');
    perform public.activate_premium_subscription(b,u,'order_sec05_gst_'||amount::text,
      'pay_sec05_gst_'||amount::text,'sec05-plan','monthly',expected,'INR');
    perform test_reset();
  end loop;

  insert into public.premium_subscriptions(user_id,plan_id,price,razorpay_order_id)
    values(u,'sec05-plan',74.75,'order_sec05_pending') returning id into b;
  query := format('select public.activate_premium_subscription(%L,%L,''order_sec05_pending'',''pay_sec05_pending'',''sec05-plan'',''monthly'',8821,''INR'')',b,u);
  perform test_as(u,'service_role');
  foreach entry in array array[
    replace(query,u::text,stranger::text),replace(query,'order_sec05_pending','order_wrong'),
    replace(query,'sec05-plan','sec05-other'),replace(query,'monthly','yearly'),
    replace(query,'8821','8820'),replace(query,'INR','USD'),replace(query,'8821','0'),
    replace(query,'''sec05-plan''','null'),replace(query,'''monthly''','null'),
    replace(query,'pay_sec05_pending',' ')] loop
    perform pg_temp.expect_failure(entry);
  end loop;
  perform test_reset();
  if (select status from public.premium_subscriptions where id=b)<>'pending' then raise exception 'FAIL invalid activation wrote'; end if;

  -- Transaction/SEC-01 claims roll back when direct activation has invalid dates.
  perform test_as(u,'service_role');
  foreach entry in array array[
    'null,null', 'now(),null', 'null,now()', 'now(),now()', 'now(),now()-interval ''1 day''',
    'now(),''infinity''::timestamptz', '''-infinity''::timestamptz,now()',
    'now(),now()+interval ''5 years'''] loop
    perform pg_temp.expect_failure(format('update public.premium_subscriptions set status=''active'',razorpay_payment_id=''pay_sec05_invalid'',started_at=(%s),current_period_end=(%s) where id=%L',
      split_part(entry,',',1),split_part(entry,',',2),b));
  end loop;
  perform test_reset();
  if exists(select 1 from public.razorpay_payment_bindings where provider_payment_id='pay_sec05_invalid') then
    raise exception 'FAIL rejected activation retained claim'; end if;

  -- Missing plan cannot be activated; the FK itself rejects unknown plans.
  insert into public.premium_subscriptions(user_id,price,razorpay_order_id)
    values(u,74.75,'order_sec05_missing') returning id into missing;
  perform test_as(u,'service_role');
  perform pg_temp.expect_failure(format('select public.activate_premium_subscription(%L,%L,''order_sec05_missing'',''pay_missing'',''sec05-plan'',''monthly'',8821,''INR'')',missing,u));
  perform pg_temp.expect_failure(format('insert into public.premium_subscriptions(user_id,plan_id) values(%L,''does-not-exist'')',u),'23503');
  -- Existing failure webhook marks never-activated orders expired; capture retries it.
  update public.premium_subscriptions set status='expired',razorpay_payment_id='pay_sec05_failed' where id=b;
  execute query into result; perform test_reset();
  if result->>'alreadyActive'<>'false' then raise exception 'FAIL transient retry'; end if;
  perform test_as(u,'service_role');
  perform pg_temp.expect_failure(replace(query,'pay_sec05_pending','pay_wrong'));
  perform pg_temp.expect_failure(format('update public.premium_subscriptions set current_period_end=null where id=%L',b));
  perform pg_temp.expect_failure(format('update public.premium_subscriptions set current_period_end=started_at where id=%L',b));
  perform pg_temp.expect_failure(format('update public.premium_subscriptions set price=1 where id=%L',b));
  perform pg_temp.expect_failure(format('update public.premium_subscriptions set plan_id=''sec05-other'' where id=%L',b));
  perform pg_temp.expect_failure(format('update public.premium_subscriptions set billing_cycle=''yearly'' where id=%L',b));
  perform pg_temp.expect_failure(format('update public.premium_subscriptions set user_id=%L where id=%L',stranger,b));
  perform pg_temp.expect_failure(format('select public.activate_premium_subscription(%L,%L,''order_sec05_missing'',''pay_sec05_pending'',''sec05-plan'',''monthly'',8821,''INR'')',missing,u));
  update public.premium_subscriptions set status='expired' where id=b;
  perform pg_temp.expect_failure(query);
  perform pg_temp.expect_failure(format('update public.premium_subscriptions set status=''active'' where id=%L',b));
  perform test_reset();

  -- Ordinary users/admin sessions cannot invoke the trusted capture boundary.
  foreach entry in array array['anon','authenticated'] loop
    perform test_as(u,entry); perform pg_temp.expect_failure(query,'42501');
    perform pg_temp.expect_failure(format('insert into public.premium_subscriptions(user_id,plan_id,status,started_at,current_period_end) values(%L,''sec05-plan'',''active'',now(),now()+interval ''1 month'')',u),'42501');
    perform test_reset();
  end loop;
  perform test_as(u);
  -- Spoofed JWT role never grants function execution.
  perform set_config('request.jwt.claim.role','service_role',true);
  perform pg_temp.expect_failure(query,'42501'); perform test_reset();
  perform test_as(u);
  update public.premium_subscriptions set auto_renew=false where id=a;
  perform pg_temp.expect_failure(format('update public.premium_subscriptions set status=''active'',started_at=now(),current_period_end=now()+interval ''1 year'' where id=%L',b),'42501');
  perform test_reset();
  if (select auto_renew from public.premium_subscriptions where id=a)
    or (select status from public.premium_subscriptions where id=b)<>'expired' then
    raise exception 'FAIL owner update protection'; end if;
  select to_jsonb(s)-'updated_at' into saved from public.premium_subscriptions s where id=a;
  perform test_as(u);
  update public.premium_subscriptions set started_at=null,current_period_end='infinity',price=1 where id=a;
  perform test_reset();
  if saved is distinct from (select to_jsonb(s)-'updated_at' from public.premium_subscriptions s where id=a) then
    raise exception 'FAIL owner changed active billing terms'; end if;
  perform test_as(stranger);
  if exists(select 1 from public.premium_subscriptions where id=a) then raise exception 'FAIL foreign read'; end if;
  update public.premium_subscriptions set status='active' where id=b;
  get diagnostics affected=row_count;
  if affected<>0 then raise exception 'FAIL foreign update'; end if;
  perform test_reset();
end $$;

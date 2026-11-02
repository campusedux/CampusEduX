\set ON_ERROR_STOP on
begin;
do $$
declare
  u uuid := test_make_user('token-guard-161@synthetic.invalid');
  peer uuid := test_make_user('token-peer-161@synthetic.invalid');
  r uuid; p uuid;
  role_name text;
begin
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,
    estimated_total,token_amount,service_scope,assessment_use,integrity_acknowledged_at,payment_order_id)
    values(u,'Guard token','personal','standard','web',10000,3000,'custom_software','no',now(),
      'order_token_guard_161') returning id into r;
  insert into custom_project_payments(request_id,user_id,project_type,amount,kind,razorpay_order_id)
    values(r,u,'personal',3000,'token','order_token_guard_161') returning id into p;

  foreach role_name in array array['anon','authenticated','service_role'] loop
    if has_function_privilege(role_name,'public.guard_custom_token_settlement()','EXECUTE') then
      raise exception 'FAIL callable internal guard for %',role_name;
    end if;
  end loop;
  perform test_as(u);
  begin
    update custom_project_payments set status='paid',razorpay_payment_id='pay_token_guard_161' where id=p;
    if found then raise exception 'FAIL buyer settled token'; end if;
  exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(peer);
  if exists(select 1 from custom_project_payments where id=p) then raise exception 'FAIL cross-user read'; end if;
  perform test_reset();
  perform test_as(null,'anon');
  begin
    update custom_project_payments set status='paid' where id=p;
    if found then raise exception 'FAIL anonymous settlement'; end if;
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- A request amount that changed after provider verification must not credit.
  update custom_project_requests set token_amount=3001 where id=r;
  perform test_as(null,'service_role');
  begin
    update custom_project_payments set status='paid',razorpay_payment_id='pay_token_guard_161' where id=p;
    raise exception 'FAIL mismatched request amount settled';
  exception when check_violation then null; end;
  perform test_reset();
  if exists(select 1 from razorpay_payment_bindings where provider_payment_id='pay_token_guard_161')
     or (select amount_paid from custom_project_requests where id=r) <> 0 then
    raise exception 'FAIL rejected payment retained value or claim';
  end if;
  update custom_project_requests set token_amount=3000 where id=r;
  perform test_as(null,'service_role');
  update custom_project_payments set status='paid',razorpay_payment_id='pay_token_guard_161'
    where id=p and status in ('created','failed');
  begin
    update custom_project_payments set amount=1 where id=p;
    raise exception 'FAIL paid amount mutation';
  exception when check_violation then null; end;
  begin
    update custom_project_payments set status='failed' where id=p;
    raise exception 'FAIL paid state regression';
  exception when check_violation then null; end;
  perform test_reset();
  if (select amount_paid from custom_project_requests where id=r) <> 3000
     or (select count(*) from custom_project_request_history where request_id=r) <> 1 then
    raise exception 'FAIL token value/history invariant';
  end if;
  raise notice 'PASS token guard, grants, owner/peer/anon denial, drift rollback, immutable paid terms';
end $$;
rollback;

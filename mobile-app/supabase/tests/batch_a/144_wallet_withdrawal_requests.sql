-- Migration 0144/115: UPI withdrawal request flow. request_withdrawal validates + holds + queues atomically;
-- admin approve / reject (refund) / paid; users only see their own requests; no direct client insert.
\set ON_ERROR_STOP on
do $$
declare
  u    uuid := test_make_user('u144@x.io');
  u2   uuid := test_make_user('u2144@x.io');
  adm  uuid := test_make_user('adm144@x.io');
  vw   uuid := test_make_user('vw144@x.io');
  req  uuid;
  req2 uuid;
  bal  numeric;
  n    int;
  t    public.wallet_transactions;
begin
  insert into admin_users(id,email,role,status) values (adm,'adm144@x.io','super_admin','active');
  insert into admin_users(id,email,role,status) values (vw,'vw144@x.io','viewer','active');
  update reward_settings set min_payout = 100 where id = 1;
  insert into wallet_transactions(user_id,type,category,amount,description) values
    (u, 'credit','referral_bonus', 500, 'bonus'),
    (u2,'credit','referral_bonus', 300, 'bonus');

  -- anon cannot call it
  perform test_as(null, 'anon');
  begin
    perform request_withdrawal(150, 'name@okaxis');
    raise exception 'FAIL anon requested withdrawal';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  perform test_as(u);
  -- invalid inputs are rejected
  begin perform request_withdrawal(150, 'not-a-upi'); raise exception 'FAIL bad UPI accepted';
  exception when check_violation then null; end;
  begin perform request_withdrawal(150, 'a@b'); raise exception 'FAIL short PSP accepted';
  exception when check_violation then null; end;
  begin perform request_withdrawal(50, 'name@okaxis'); raise exception 'FAIL below min_payout accepted';
  exception when check_violation then null; end;
  begin perform request_withdrawal(600, 'name@okaxis'); raise exception 'FAIL over-balance accepted';
  exception when check_violation then null; end;
  begin perform request_withdrawal(150.555, 'name@okaxis'); raise exception 'FAIL 3 decimals accepted';
  exception when check_violation then null; end;
  begin perform request_withdrawal(0, 'name@okaxis'); raise exception 'FAIL zero accepted';
  exception when check_violation then null; end;

  -- valid request: debit hold + pending queue row, linked
  t := request_withdrawal(200, ' Name.Pay@OkAxis ');
  select id into req from withdrawal_requests where user_id = u and status = 'pending';
  if req is null then raise exception 'FAIL no pending request row'; end if;
  if (select wallet_transaction_id from withdrawal_requests where id = req) <> t.id then raise exception 'FAIL hold not linked'; end if;
  if (select account_details->>'upi_id' from withdrawal_requests where id = req) <> 'name.pay@okaxis' then raise exception 'FAIL upi not normalised'; end if;
  select sum(case when type='credit' then amount when category='withdrawal' then -amount else 0 end) into bal from wallet_transactions where user_id = u;
  if bal <> 300 then raise exception 'FAIL balance after hold %', bal; end if;

  -- duplicate pending blocked
  begin perform request_withdrawal(100, 'name@okaxis'); raise exception 'FAIL duplicate pending accepted';
  exception when check_violation then null; end;

  -- no direct insert into the queue (policy dropped) and no forging a ledger row
  begin
    insert into withdrawal_requests(user_id, amount, status) values (u, 10, 'pending');
    raise exception 'FAIL direct queue insert allowed';
  exception when insufficient_privilege then null; end;

  -- user cannot change own request status
  update withdrawal_requests set status = 'paid' where id = req;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL user updated own request'; end if;

  -- user cannot decide via admin RPC
  begin perform admin_process_withdrawal(req, 'approve', ''); raise exception 'FAIL user approved';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  perform test_reset();

  -- other user cannot see it
  perform test_as(u2);
  select count(*) into n from withdrawal_requests where user_id = u;
  if n <> 0 then raise exception 'FAIL u2 sees u requests'; end if;
  req2 := null;
  perform request_withdrawal(150, 'u2@ybl');
  select id into req2 from withdrawal_requests where user_id = u2 and status = 'pending';
  perform test_reset();

  -- view-only admin cannot decide
  perform test_as(vw);
  begin perform admin_process_withdrawal(req, 'approve', ''); raise exception 'FAIL viewer approved';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  perform test_reset();

  perform test_as(adm);
  -- paid before approve is refused
  begin perform admin_process_withdrawal(req, 'paid', 'UTR1'); raise exception 'FAIL paid while pending';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  perform admin_process_withdrawal(req, 'approve', 'ok');
  -- approve does not double-debit
  if (select count(*) from wallet_transactions where user_id = u and category = 'withdrawal') <> 1 then raise exception 'FAIL approve double-debited'; end if;
  begin perform admin_process_withdrawal(req, 'paid', '  '); raise exception 'FAIL paid without reference';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  perform admin_process_withdrawal(req, 'paid', 'UTR123');
  if (select status || '|' || payout_reference from withdrawal_requests where id = req) <> 'paid|UTR123' then raise exception 'FAIL paid state'; end if;
  begin perform admin_process_withdrawal(req, 'reject', 'x'); raise exception 'FAIL rejected a paid request';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;

  -- reject refunds the hold
  perform admin_process_withdrawal(req2, 'reject', 'UPI name mismatch');
  if (select status from withdrawal_requests where id = req2) <> 'rejected' then raise exception 'FAIL reject state'; end if;
  if (select refund_transaction_id from withdrawal_requests where id = req2) is null then raise exception 'FAIL no refund txn'; end if;
  perform test_reset();
  select sum(case when type='credit' then amount when category='withdrawal' then -amount else 0 end) into bal from wallet_transactions where user_id = u2;
  if bal <> 300 then raise exception 'FAIL u2 balance not restored %', bal; end if;
  select sum(case when type='credit' then amount when category='withdrawal' then -amount else 0 end) into bal from wallet_transactions where user_id = u;
  if bal <> 300 then raise exception 'FAIL u balance after paid %', bal; end if;

  -- after a decision the user can request again
  perform test_as(u2);
  perform request_withdrawal(100, 'u2@ybl');
  perform test_reset();

  -- legacy request (no hold) keeps the debit-on-approve behaviour
  insert into withdrawal_requests(user_id, amount, status) values (u, 100, 'pending') returning id into req;
  perform test_as(adm);
  perform admin_process_withdrawal(req, 'approve', '');
  perform test_reset();
  if (select wallet_transaction_id from withdrawal_requests where id = req) is null then raise exception 'FAIL legacy approve did not debit'; end if;

  raise notice 'DB-144 OK';
end $$;

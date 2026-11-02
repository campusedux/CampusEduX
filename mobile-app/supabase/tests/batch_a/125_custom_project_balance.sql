-- Custom project final_price / amount_paid / balance payment rules (migration 0124 / admin 096).
-- Everything runs in one transaction that is ROLLED BACK at the end, so the deliberately permissive
-- policies created in part 2 (to prove the triggers hold even if RLS were misconfigured) never persist.
\set ON_ERROR_STOP on
begin;
-- Real Supabase's service_role has BYPASSRLS; this harness's stub role may not. Mirror production for this (rolled-back) test.
alter role service_role bypassrls;

-- ============================ part 1: behaviour under the real policies ============================
do $$
declare
  a uuid := test_make_user('a125@x.io');
  b uuid := test_make_user('b125@x.io');
  adm uuid := test_make_user('adm125@x.io');
  ed uuid := test_make_user('ed125@x.io');
  r uuid; l1 uuid; l2 uuid; l3 uuid; j jsonb;
begin
  insert into public.admin_users(id,email,role,status) values (adm,'adm125@x.io','super_admin','active');
  insert into public.admin_users(id,email,role,status) values (ed,'ed125@x.io','viewer','active');

  -- A pre-existing-shaped history row (inserted the way custom_project_set_status() — and every row
  -- that existed before this migration ran — inserts one: no `event` column at all) must still default
  -- to event='status' and stay owner-visible under the NEW policy. Proves the ADD COLUMN ... NOT NULL
  -- DEFAULT 'status' backfill/default is real, not just an aspiration in a comment.
  declare v_legacy_req uuid; v_legacy_hist uuid; v_legacy_event text;
  begin
    insert into custom_project_requests(user_id,title,project_type,project_level,platform,token_payment_status,service_scope,assessment_use,integrity_acknowledged_at)
      values (a,'Legacy row proj','personal','standard','web','paid','custom_software','no',now()) returning id into v_legacy_req;
    insert into custom_project_request_history(request_id, old_status, new_status, changed_by_role, note)
      values (v_legacy_req, null, 'new', 'system', null) returning id into v_legacy_hist;
    select event into v_legacy_event from custom_project_request_history where id = v_legacy_hist;
    if v_legacy_event <> 'status' then raise exception 'FAIL legacy-shaped row did not default to event=status (got %)', v_legacy_event; end if;
    perform test_as(a);
    if not exists (select 1 from custom_project_request_history where id = v_legacy_hist) then
      raise exception 'FAIL owner cannot see a pre-existing-shaped history row';
    end if;
    perform test_reset();
  end;

  -- token counts as the first payment
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,
                                      estimated_total,token_amount,token_payment_status,service_scope,assessment_use,integrity_acknowledged_at)
    values (a,'A proj','personal','standard','web',10000,3000,'pending','custom_software','no',now()) returning id into r;
  if (select amount_paid from custom_project_requests where id = r) <> 0 then raise exception 'FAIL unpaid amount_paid'; end if;
  update custom_project_requests set token_payment_status = 'paid' where id = r;
  if (select amount_paid from custom_project_requests where id = r) <> 3000 then raise exception 'FAIL token did not count as paid'; end if;

  -- the owner cannot change the request at all (no owner UPDATE policy exists)
  perform test_as(a);
  update custom_project_requests set final_price = 1, amount_paid = 10000 where id = r;
  perform test_reset();
  if (select final_price from custom_project_requests where id = r) is not null
     or (select amount_paid from custom_project_requests where id = r) <> 3000 then raise exception 'FAIL owner wrote money columns'; end if;

  -- admin RPC: permission
  perform test_as(b);
  begin perform admin_set_custom_project_final_price(r, 9000); raise exception 'FAIL non-admin RPC';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(ed);
  begin perform admin_set_custom_project_final_price(r, 9000); raise exception 'FAIL viewer RPC';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- admin RPC: rules + audit
  perform test_as(adm);
  begin perform admin_set_custom_project_final_price(r, 2999); raise exception 'FAIL below amount paid';
  exception when raise_exception then if sqlerrm not like '%below the amount already paid%' then raise; end if; end;
  begin perform admin_set_custom_project_final_price(r, -5); raise exception 'FAIL negative';
  exception when raise_exception then if sqlerrm not like '%out of range%' then raise; end if; end;
  j := admin_set_custom_project_final_price(r, 9000, 'agreed after review');
  if (j->>'changed')::boolean is not true or (j->>'remaining')::numeric <> 6000 then raise exception 'FAIL set price %', j; end if;
  j := admin_set_custom_project_final_price(r, 9000);
  if (j->>'changed')::boolean then raise exception 'FAIL repeat not a no-op'; end if;
  perform test_reset();
  if (select final_price from custom_project_requests where id = r) <> 9000 then raise exception 'FAIL final_price not stored'; end if;
  if not exists (select 1 from custom_project_request_history
                  where request_id = r and event = 'price' and old_value is null and new_value = '9000.00'
                    and changed_by = adm and changed_by_role = 'admin') then
    raise exception 'FAIL price history row';
  end if;
  perform test_as(adm);
  perform admin_set_custom_project_final_price(r, 8000);
  perform test_reset();
  if not exists (select 1 from custom_project_request_history where request_id = r and event = 'price' and old_value = '9000.00' and new_value = '8000.00') then
    raise exception 'FAIL price history old->new';
  end if;

  -- the owner reads status rows only, never the price/payment audit rows
  insert into custom_project_request_history(request_id,new_status) values (r,'new');
  perform test_as(a);
  if exists (select 1 from custom_project_request_history where event <> 'status') then raise exception 'FAIL user reads audit rows'; end if;
  if (select count(*) from custom_project_request_history where request_id = r) <> 1 then raise exception 'FAIL user status rows'; end if;
  perform test_reset();

  -- balance payment: remaining is 8000 - 3000 = 5000
  insert into custom_project_payments(request_id,user_id,project_type,amount,status,kind,razorpay_order_id)
    values (r,a,'personal',5000,'created','balance','order_bal_1') returning id into l1;

  perform test_as(adm);
  begin perform admin_set_custom_project_final_price(r, 7000); raise exception 'FAIL price change during open checkout';
  exception when raise_exception then if sqlerrm not like '%checkout open%' then raise; end if; end;
  perform test_reset();

  -- the owner cannot settle a ledger row
  perform test_as(a);
  update custom_project_payments set status = 'paid' where id = l1;
  perform test_reset();
  if (select status from custom_project_payments where id = l1) <> 'created'
     or (select amount_paid from custom_project_requests where id = r) <> 3000 then raise exception 'FAIL owner settled ledger'; end if;

  -- the service role (verify function / webhook) settles it exactly once
  perform test_as(null,'service_role');
  update custom_project_payments set status = 'paid', razorpay_payment_id = 'pay_1' where id = l1;
  perform test_reset();
  if (select amount_paid from custom_project_requests where id = r) <> 8000 then raise exception 'FAIL balance not applied'; end if;
  if not exists (select 1 from custom_project_request_history where request_id = r and event = 'payment' and old_value='3000.00' and new_value='8000.00') then
    raise exception 'FAIL payment history';
  end if;
  -- the user notification is inserted by the TRIGGER itself (not by whichever Edge Function/webhook
  -- performed the UPDATE), so a webhook-only settlement (app closed before the browser's verify call
  -- runs) still notifies the user — this is the exact case the owner asked about.
  if not exists (select 1 from notifications where user_id = a and title = 'Balance payment received') then
    raise exception 'FAIL no balance-received notification';
  end if;

  -- webhook replay: idempotent
  perform test_as(null,'service_role');
  update custom_project_payments set status = 'paid', razorpay_payment_id = 'pay_1' where id = l1;
  perform test_reset();
  if (select amount_paid from custom_project_requests where id = r) <> 8000 then raise exception 'FAIL replay double credit'; end if;
  -- a paid row can never go back
  perform test_as(null,'service_role');
  begin update custom_project_payments set status = 'failed' where id = l1; raise exception 'FAIL paid row reverted';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- double payment: a second balance order paid after the balance is settled -> refund_due, no credit,
  -- and — the owner's exact worry — the project's WORKFLOW status (in_development/testing/ready/
  -- delivered/cancelled, on custom_project_requests) must not move or reset because of it. Advance it
  -- first so there is real progress to lose if this were wrong.
  perform test_as(adm);
  perform custom_project_set_status(r, 'in_development', null);
  perform test_reset();
  if (select status from custom_project_requests where id = r) <> 'in_development' then raise exception 'FAIL setup: status not advanced'; end if;

  insert into custom_project_payments(request_id,user_id,project_type,amount,status,kind,razorpay_order_id)
    values (r,a,'personal',5000,'created','balance','order_bal_2') returning id into l2;
  perform test_as(null,'service_role');
  update custom_project_payments set status = 'paid', razorpay_payment_id = 'pay_2' where id = l2;
  perform test_reset();
  if (select status from custom_project_payments where id = l2) <> 'refund_due' then raise exception 'FAIL duplicate not refund_due'; end if;
  if (select amount_paid from custom_project_requests where id = r) <> 8000 then raise exception 'FAIL overpayment credited'; end if;
  if (select status from custom_project_requests where id = r) <> 'in_development' then
    raise exception 'FAIL a refund_due payment moved the request workflow status (progress would be lost)';
  end if;
  if not exists (select 1 from custom_project_admin_inbox where request_id = r and title like '%manual refund%') then
    raise exception 'FAIL no refund inbox row';
  end if;
  -- exactly one inbox row — the calling Edge Function must not add its own duplicate
  if (select count(*) from custom_project_admin_inbox where request_id = r and title like '%manual refund%') <> 1 then
    raise exception 'FAIL duplicate refund-due inbox row';
  end if;
  -- 'refund_due' can never reach the workflow column at all — its check constraint is untouched
  begin
    update custom_project_requests set status = 'refund_due' where id = r;
    raise exception 'FAIL requests.status accepted refund_due';
  exception when check_violation then null; end;

  -- an amount larger than the remaining balance is refused too — same proof, this time on a
  -- fully 'delivered' project (the other end of the workflow, and the one the owner named)
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,
                                      estimated_total,token_amount,token_payment_status,service_scope,assessment_use,integrity_acknowledged_at)
    values (a,'A2','personal','standard','web',6000,3000,'paid','custom_software','no',now()) returning id into r;
  -- migration 0125's delivery gate requires an actual deliverable before 'delivered' is reachable.
  insert into custom_project_deliveries(request_id, demo_url) values (r, 'https://example.com/a2-demo');
  perform test_as(adm);
  perform custom_project_set_status(r, 'in_development', null);
  perform custom_project_set_status(r, 'testing', null);
  perform custom_project_set_status(r, 'ready', null);
  perform custom_project_set_status(r, 'delivered', null);
  perform test_reset();
  if (select status from custom_project_requests where id = r) <> 'delivered' then raise exception 'FAIL setup: not delivered'; end if;

  insert into custom_project_payments(request_id,user_id,project_type,amount,status,kind,razorpay_order_id)
    values (r,a,'personal',3500,'created','balance','order_bal_3') returning id into l3;
  perform test_as(null,'service_role');
  update custom_project_payments set status = 'paid', razorpay_payment_id = 'pay_3' where id = l3;
  perform test_reset();
  if (select status from custom_project_payments where id = l3) <> 'refund_due'
     or (select amount_paid from custom_project_requests where id = r) <> 3000 then
    raise exception 'FAIL over-remaining payment accepted';
  end if;
  if (select status from custom_project_requests where id = r) <> 'delivered' then
    raise exception 'FAIL an over-remaining payment un-delivered the project';
  end if;

  -- the price is locked once fully paid ('A proj' is 8000 / 8000)
  select id into r from custom_project_requests where title = 'A proj';
  perform test_as(adm);
  begin perform admin_set_custom_project_final_price(r, 20000); raise exception 'FAIL price change after fully paid';
  exception when raise_exception then if sqlerrm not like '%locked%' then raise; end if; end;
  perform test_reset();
  if (select final_price from custom_project_requests where id = r) <> 8000 then raise exception 'FAIL locked price moved'; end if;

  raise notice 'DB-125 part 1 OK';
end $$;

-- ===== part 2: the triggers hold even if RLS were misconfigured (permissive policies, rolled back) =====
create policy tmp_req_all on custom_project_requests for all using (true) with check (true);
create policy tmp_pay_all on custom_project_payments for all using (true) with check (true);

do $$
declare
  a uuid := (select id from auth.users where email = 'a125@x.io');
  adm uuid := (select id from auth.users where email = 'adm125@x.io');
  r uuid := (select id from custom_project_requests where title = 'A2');
  l uuid;
begin
  -- normal user: neither column, alone or mixed with a harmless one, nor on INSERT
  perform test_as(a);
  begin update custom_project_requests set final_price = 1 where id = r; raise exception 'FAIL user set final_price';
  exception when insufficient_privilege then null; end;
  begin update custom_project_requests set amount_paid = 10000 where id = r; raise exception 'FAIL user set amount_paid';
  exception when insufficient_privilege then null; end;
  begin update custom_project_requests set estimated_total = 1, amount_paid = 1, final_price = 1 where id = r; raise exception 'FAIL user multi-col';
  exception when insufficient_privilege then null; end;
  begin insert into custom_project_requests(user_id,title,project_type,project_level,platform,amount_paid,service_scope,assessment_use,integrity_acknowledged_at)
        values (a,'x','personal','standard','web',999,'custom_software','no',now()); raise exception 'FAIL user insert amount_paid';
  exception when insufficient_privilege then null; end;
  begin insert into custom_project_requests(user_id,title,project_type,project_level,platform,final_price,service_scope,assessment_use,integrity_acknowledged_at)
        values (a,'x','personal','standard','web',1,'custom_software','no',now()); raise exception 'FAIL user insert final_price';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- an admin session cannot write them directly either: only the RPC may set final_price, only the service role amount_paid
  perform test_as(adm);
  begin update custom_project_requests set final_price = 9000 where id = r; raise exception 'FAIL admin direct final_price';
  exception when insufficient_privilege then null; end;
  begin update custom_project_requests set amount_paid = 9000 where id = r; raise exception 'FAIL admin direct amount_paid';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- no client can settle or fabricate a paid balance ledger row
  insert into custom_project_payments(request_id,user_id,project_type,amount,status,kind,razorpay_order_id)
    values (r,a,'personal',3000,'created','balance','order_bal_4') returning id into l;
  perform test_as(adm);
  begin update custom_project_payments set status = 'paid' where id = l; raise exception 'FAIL admin settled ledger';
  exception when insufficient_privilege then null; end;
  begin insert into custom_project_payments(request_id,user_id,project_type,amount,status,kind)
        values (r,a,'personal',3000,'paid','balance'); raise exception 'FAIL insert paid balance';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  perform test_as(a);
  begin update custom_project_payments set status = 'paid' where id = l; raise exception 'FAIL user settled ledger';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  if (select amount_paid from custom_project_requests where id = r) <> 3000
     or (select final_price from custom_project_requests where id = r) is not null then
    raise exception 'FAIL money columns changed';
  end if;
  raise notice 'DB-125 OK';
end $$;

rollback;

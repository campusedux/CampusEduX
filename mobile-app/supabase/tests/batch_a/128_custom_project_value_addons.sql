-- Migration 0128 / admin 099: one due calculation, add-ons, credits, request edits, delivery visibility.
-- Everything is rolled back at the end (part 3 creates deliberately permissive policies).
\set ON_ERROR_STOP on
begin;
alter role service_role bypassrls;

create function pg_temp.amt(p uuid, k text) returns numeric language sql as $$
  select (public.custom_project_amounts(p) ->> k)::numeric
$$;
create function pg_temp.pstatus(p uuid) returns text language sql as $$
  select public.custom_project_amounts(p) ->> 'payment_status'
$$;
-- a Razorpay-settled ledger row, the way verify / the webhook settle it
create function pg_temp.pay(p uuid, u uuid, k text, amount numeric, oid text) returns uuid language plpgsql as $$
declare l uuid;
begin
  insert into custom_project_payments(request_id,user_id,project_type,amount,status,kind,razorpay_order_id)
    values (p,u,'personal',amount,'created',k,oid) returning id into l;
  perform test_as(null,'service_role');
  update custom_project_payments set status = 'paid', razorpay_payment_id = 'pay_' || oid where id = l;
  perform test_reset();
  return l;
end $$;

-- ================================ part 1: the calculation ================================
do $$
declare
  a   uuid := test_make_user('a128@x.io');
  adm uuid := test_make_user('adm128@x.io');
  r uuid; ad uuid; l uuid;
begin
  insert into admin_users(id,email,role,status) values (adm,'adm128@x.io','super_admin','active');

  -- (1) unpaid: token not paid yet -> the whole value is due
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,estimated_total,token_amount)
    values (a,'Unpaid','personal','standard','web',10000,3000) returning id into r;
  if pg_temp.amt(r,'due') <> 10000 or pg_temp.pstatus(r) <> 'unpaid' then raise exception 'FAIL unpaid %', custom_project_amounts(r); end if;

  -- (2) partial: token paid through the WEBHOOK ONLY (verify never ran) -> request settles itself
  l := pg_temp.pay(r, a, 'token', 3000, 'o_tok_1');
  if (select token_payment_status from custom_project_requests where id = r) <> 'paid' then
    raise exception 'FAIL webhook-settled token did not mark the request paid';
  end if;
  if (select amount_paid from custom_project_requests where id = r) <> 3000 then raise exception 'FAIL token amount_paid mirror'; end if;
  if pg_temp.amt(r,'due') <> 7000 or pg_temp.pstatus(r) <> 'partially_paid' then raise exception 'FAIL partial %', custom_project_amounts(r); end if;
  if (select count(*) from custom_project_admin_inbox where request_id = r and title = 'New Paid Custom Project Request') <> 1
     or (select count(*) from notifications where user_id = a and title = 'Token payment successful') <> 1 then
    raise exception 'FAIL webhook token side effects not created exactly once';
  end if;
  -- verify arriving afterwards (request already paid) does not duplicate anything
  perform test_as(null,'service_role');
  update custom_project_requests set token_payment_status = 'paid' where id = r;
  update custom_project_payments set status = 'paid' where id = l;
  perform test_reset();
  if (select count(*) from custom_project_admin_inbox where request_id = r and title = 'New Paid Custom Project Request') <> 1 then
    raise exception 'FAIL duplicate token inbox row';
  end if;

  -- (3) full payment -> Paid, due 0
  perform pg_temp.pay(r, a, 'balance', 7000, 'o_bal_1');
  if pg_temp.amt(r,'due') <> 0 or pg_temp.pstatus(r) <> 'paid' or pg_temp.amt(r,'payments_total') <> 10000 then
    raise exception 'FAIL full payment %', custom_project_amounts(r);
  end if;
  if (select amount_paid from custom_project_requests where id = r) <> 10000 then raise exception 'FAIL full amount_paid mirror'; end if;

  -- (4) add-on pending / priced do NOT count; accepted does
  perform test_as(a);
  ad := custom_project_addon_create(r, 'Dark mode', 'Toggle in settings');
  perform test_reset();
  if pg_temp.amt(r,'project_value') <> 10000 or pg_temp.amt(r,'due') <> 0 or pg_temp.amt(r,'pending_addons') <> 1 then
    raise exception 'FAIL pending add-on counted %', custom_project_amounts(r);
  end if;
  perform test_as(adm);
  perform admin_custom_project_addon_set_price(ad, 1500.50);
  perform test_reset();
  if pg_temp.amt(r,'project_value') <> 10000 or pg_temp.amt(r,'priced_addons') <> 1 then raise exception 'FAIL priced add-on counted'; end if;
  perform test_as(a);
  perform custom_project_addon_accept(ad);
  perform test_reset();
  if pg_temp.amt(r,'project_value') <> 11500.50 or pg_temp.amt(r,'due') <> 1500.50 or pg_temp.pstatus(r) <> 'partially_paid' then
    raise exception 'FAIL accepted add-on %', custom_project_amounts(r);
  end if;

  -- (5) a SECOND balance payment after full payment (the old unique index rejected this after capture)
  perform pg_temp.pay(r, a, 'balance', 1500.50, 'o_bal_2');
  if pg_temp.amt(r,'due') <> 0 or pg_temp.pstatus(r) <> 'paid' or pg_temp.amt(r,'payments_total') <> 11500.50 then
    raise exception 'FAIL second balance payment %', custom_project_amounts(r);
  end if;
  -- an overpayment is still refused
  l := pg_temp.pay(r, a, 'balance', 1, 'o_bal_3');
  if (select status from custom_project_payments where id = l) <> 'refund_due' or pg_temp.amt(r,'payments_total') <> 11500.50 then
    raise exception 'FAIL overpayment accepted';
  end if;

  -- (6) paise-precision amounts, no float drift, and the due never goes negative
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,estimated_total,token_amount)
    values (a,'Paise','personal','standard','web',10000.50,1500.25) returning id into r;
  perform pg_temp.pay(r, a, 'token', 1500.25, 'o_tok_2');
  perform pg_temp.pay(r, a, 'balance', 1234.56, 'o_bal_4');   -- a checkout for a partial amount
  if pg_temp.amt(r,'due') <> 7265.69 then raise exception 'FAIL paise due %', custom_project_amounts(r); end if;
  perform test_as(adm);
  perform admin_add_custom_project_credit(r, 7265.69, 'offline_payment', 'UPI to office');
  perform test_reset();
  if pg_temp.amt(r,'due') <> 0 or pg_temp.pstatus(r) <> 'paid' or pg_temp.amt(r,'credits_total') <> 7265.69 then
    raise exception 'FAIL credit settles due %', custom_project_amounts(r);
  end if;
  if (select amount_paid from custom_project_requests where id = r) <> 10000.50 then raise exception 'FAIL credit mirror'; end if;
  perform test_as(adm);
  perform admin_add_custom_project_credit(r, 500, 'goodwill', null);
  perform test_reset();
  if pg_temp.amt(r,'due') <> 0 then raise exception 'FAIL negative due'; end if;
  -- removing a credit brings the due back
  perform test_as(adm);
  perform admin_remove_custom_project_credit((select id from custom_project_credits where request_id = r and kind = 'offline_payment'), 'mistake');
  perform test_reset();
  if pg_temp.amt(r,'due') <> 6765.69 then raise exception 'FAIL credit removal %', custom_project_amounts(r); end if;

  -- (7) legacy shape: token flag paid but no paid token ledger row -> token still counts
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,estimated_total,token_amount,token_payment_status)
    values (a,'Legacy','academic','standard','web',7999,1500,'paid') returning id into r;
  if pg_temp.amt(r,'due') <> 6499 then raise exception 'FAIL legacy token %', custom_project_amounts(r); end if;

  -- (8) base value (admin) + add-ons: final price replaces the estimate as the base
  perform test_as(adm);
  perform admin_set_custom_project_final_price(r, 9000, 'scope agreed');
  perform test_reset();
  if pg_temp.amt(r,'base_value') <> 9000 or pg_temp.amt(r,'due') <> 7500 then raise exception 'FAIL base value %', custom_project_amounts(r); end if;
  if not exists (select 1 from notifications where user_id = a and title = 'Project value updated') then
    raise exception 'FAIL no value-change notification';
  end if;
  if not exists (select 1 from custom_project_changes where request_id = r and entity = 'price' and actor_role = 'admin') then
    raise exception 'FAIL no price change row';
  end if;

  raise notice 'DB-128 part 1 OK';
end $$;

-- ================================ part 2: permissions, edit lock, visibility ================================
do $$
declare
  a   uuid := (select id from auth.users where email = 'a128@x.io');
  adm uuid := (select id from auth.users where email = 'adm128@x.io');
  b   uuid := test_make_user('b128@x.io');
  vw  uuid := test_make_user('vw128@x.io');
  r uuid; ad uuid; ad2 uuid; d uuid; j jsonb; n int;
begin
  insert into admin_users(id,email,role,status) values (vw,'vw128@x.io','viewer','active');
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,estimated_total,token_amount,token_payment_status)
    values (a,'Edit me','personal','standard','web',20000,3000,'paid') returning id into r;

  -- the owner edits allowed fields while 'new'
  perform test_as(a);
  j := custom_project_update_request(r, jsonb_build_object(
         'title', '  Edited title ', 'description', 'New description', 'technology_preference', 'Next.js',
         'custom_requirements', jsonb_build_array(jsonb_build_object('text','Export CSV'), jsonb_build_object('text','  ')),
         'deadline', (current_date + 30)::text));
  perform test_reset();
  if (select title from custom_project_requests where id = r) <> 'Edited title'
     or (select jsonb_array_length(custom_requirements) from custom_project_requests where id = r) <> 1
     or (select deadline from custom_project_requests where id = r) <> current_date + 30 then
    raise exception 'FAIL owner edit %', j;
  end if;
  if (select count(*) from custom_project_changes where request_id = r and entity = 'request' and actor_role = 'student') <> 5 then
    raise exception 'FAIL change rows';
  end if;
  if not exists (select 1 from custom_project_admin_inbox where request_id = r and title like 'Customer edited%') then
    raise exception 'FAIL admin not notified of edit';
  end if;

  -- the owner can NEVER touch the price: not through the RPC ...
  perform test_as(a);
  begin perform custom_project_update_request(r, '{"final_price": 1}'); raise exception 'FAIL owner final_price via RPC';
  exception when insufficient_privilege then null; end;
  begin perform custom_project_update_request(r, '{"estimated_total": 1}'); raise exception 'FAIL owner estimated_total via RPC';
  exception when insufficient_privilege then null; end;
  begin perform custom_project_update_request(r, '{"status": "delivered"}'); raise exception 'FAIL owner status via RPC';
  exception when insufficient_privilege then null; end;
  begin perform custom_project_update_request(r, jsonb_build_object('deadline', (current_date - 1)::text)); raise exception 'FAIL past deadline';
  exception when raise_exception then null; end;
  -- ... nor with a direct table write (what a crafted REST call does): RLS matches no row
  update custom_project_requests set final_price = 1, estimated_total = 1 where id = r;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL owner direct update matched rows'; end if;
  perform test_reset();
  if (select final_price from custom_project_requests where id = r) is not null
     or (select estimated_total from custom_project_requests where id = r) <> 20000 then raise exception 'FAIL price changed'; end if;

  -- another user: no edit, no amounts, no add-ons on A's project
  perform test_as(b);
  begin perform custom_project_update_request(r, '{"title":"hijack"}'); raise exception 'FAIL b edited';
  exception when insufficient_privilege then null; end;
  begin perform custom_project_amounts(r); raise exception 'FAIL b read amounts';
  exception when insufficient_privilege then null; end;
  begin perform custom_project_addon_create(r, 'x'); raise exception 'FAIL b created add-on';
  exception when insufficient_privilege then null; end;
  if jsonb_array_length(custom_project_amounts_bulk(array[r])) <> 0 then raise exception 'FAIL b bulk amounts'; end if;
  perform test_reset();

  -- add-on flow + owner limits
  perform test_as(a);
  ad := custom_project_addon_create(r, 'Push notifications', 'FCM');
  ad2 := custom_project_addon_create(r, 'Chat', '');
  perform custom_project_addon_update(ad, 'Push notifications v2', 'FCM + APNs');
  perform custom_project_addon_delete(ad2);
  begin perform custom_project_addon_accept(ad); raise exception 'FAIL accept before price';
  exception when raise_exception then null; end;
  -- the owner cannot price an add-on: no admin RPC ...
  begin perform admin_custom_project_addon_set_price(ad, 1); raise exception 'FAIL owner priced via admin RPC';
  exception when insufficient_privilege then null; end;
  -- ... and no direct write (no client write privilege on the table at all)
  begin update custom_project_addons set price = 1, status = 'accepted' where id = ad; raise exception 'FAIL owner direct add-on write';
  exception when insufficient_privilege then null; end;
  begin insert into custom_project_addons(project_id,title,status,price) values (r,'free','accepted',0); raise exception 'FAIL owner direct add-on insert';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  if exists (select 1 from custom_project_addons where id = ad2) then raise exception 'FAIL pending add-on not deleted'; end if;

  -- a view-only admin can read but not price
  perform test_as(vw);
  if pg_temp.amt(r,'due') is null then raise exception 'FAIL viewer cannot read amounts'; end if;
  begin perform admin_custom_project_addon_set_price(ad, 100); raise exception 'FAIL viewer priced';
  exception when insufficient_privilege then null; end;
  begin perform admin_add_custom_project_credit(r, 100); raise exception 'FAIL viewer credit';
  exception when insufficient_privilege then null; end;
  begin perform admin_update_custom_project_request(r, '{"title":"x"}'); raise exception 'FAIL viewer edit';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  perform test_as(adm);
  perform admin_custom_project_addon_set_price(ad, 2500);
  perform test_reset();
  if not exists (select 1 from notifications where user_id = a and title = 'Extra feature priced') then raise exception 'FAIL price notification'; end if;
  -- once priced, the owner can no longer edit or delete it
  perform test_as(a);
  begin perform custom_project_addon_update(ad, 'cheaper?', ''); raise exception 'FAIL edit priced add-on';
  exception when raise_exception then null; end;
  begin perform custom_project_addon_delete(ad); raise exception 'FAIL delete priced add-on';
  exception when raise_exception then null; end;
  perform custom_project_addon_accept(ad);
  perform test_reset();
  if pg_temp.amt(r,'project_value') <> 22500 then raise exception 'FAIL accepted value'; end if;
  -- an accepted add-on can't be re-priced or rejected
  perform test_as(adm);
  begin perform admin_custom_project_addon_set_price(ad, 1); raise exception 'FAIL re-price accepted';
  exception when raise_exception then null; end;
  begin perform admin_custom_project_addon_reject(ad); raise exception 'FAIL reject accepted';
  exception when raise_exception then null; end;
  perform test_reset();

  -- edit lock: once work starts the owner can't edit the request (admin can); add-ons still allowed
  perform test_as(adm);
  perform custom_project_set_status(r, 'in_development', null);
  perform test_reset();
  perform test_as(a);
  begin perform custom_project_update_request(r, '{"title":"late"}'); raise exception 'FAIL owner edit after start';
  exception when raise_exception then if sqlerrm not like '%no longer be edited%' then raise; end if; end;
  ad2 := custom_project_addon_create(r, 'Offline mode', '');
  perform test_reset();
  perform test_as(adm);
  j := admin_update_custom_project_request(r, '{"title":"Admin fixed title"}');
  begin perform admin_update_custom_project_request(r, '{"amount_paid": 99999}'); raise exception 'FAIL admin amount_paid via edit RPC';
  exception when insufficient_privilege then null; end;
  perform admin_custom_project_addon_reject(ad2, 'Out of scope');
  perform test_reset();
  if (select title from custom_project_requests where id = r) <> 'Admin fixed title' then raise exception 'FAIL admin edit'; end if;
  if not exists (select 1 from notifications where user_id = a and title = 'Extra feature not accepted') then raise exception 'FAIL reject notification'; end if;
  if pg_temp.amt(r,'project_value') <> 22500 then raise exception 'FAIL rejected add-on counted'; end if;

  -- the owner never reads the admin change log or credits
  perform test_as(a);
  if exists (select 1 from custom_project_changes) or exists (select 1 from custom_project_credits) then
    raise exception 'FAIL owner reads admin-only tables';
  end if;
  if (select count(*) from custom_project_addons where project_id = r) <> 2 then raise exception 'FAIL owner add-on list'; end if;
  perform test_reset();

  -- delivered files stay visible after the admin moves the status back (e.g. to build an add-on)
  insert into custom_project_deliveries(request_id, demo_url) values (r, 'https://example.com/demo') returning id into d;
  insert into custom_project_delivery_assets(delivery_id, storage_path) values (d, a::text || '/' || r::text || '/src.zip');
  perform test_as(a);
  if exists (select 1 from custom_project_deliveries where id = d) then raise exception 'FAIL undelivered files visible'; end if;
  perform test_reset();
  perform test_as(adm);
  perform custom_project_set_status(r, 'delivered', null);
  perform custom_project_set_status(r, 'in_development', 'building accepted add-on');
  perform test_reset();
  perform test_as(a);
  if not exists (select 1 from custom_project_deliveries where id = d)
     or not exists (select 1 from custom_project_delivery_assets where delivery_id = d) then
    raise exception 'FAIL delivered files hidden after status moved back';
  end if;
  perform test_reset();
  perform test_as(b);
  if exists (select 1 from custom_project_deliveries where id = d) then raise exception 'FAIL other user sees delivery'; end if;
  perform test_reset();

  -- attachments: own folder + uploaded object only, and only while 'new'
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,estimated_total,token_amount,token_payment_status)
    values (a,'Attach','personal','standard','web',5000,3000,'paid') returning id into r;
  insert into storage.objects(bucket_id, name) values ('custom-project-uploads', a::text || '/spec.pdf');
  insert into storage.objects(bucket_id, name) values ('custom-project-uploads', b::text || '/other.pdf');
  perform test_as(a);
  perform custom_project_add_attachment(r, a::text || '/spec.pdf', 'spec.pdf', 1.2, 'Spec');
  begin perform custom_project_add_attachment(r, b::text || '/other.pdf', 'other.pdf', 1, ''); raise exception 'FAIL foreign path';
  exception when insufficient_privilege then null; end;
  begin perform custom_project_add_attachment(r, a::text || '/missing.pdf', 'm.pdf', 1, ''); raise exception 'FAIL missing object';
  exception when raise_exception then null; end;
  if (select count(*) from custom_project_request_files where request_id = r) <> 1 then raise exception 'FAIL attachment count'; end if;
  perform custom_project_remove_attachment((select id from custom_project_request_files where request_id = r));
  perform test_reset();

  raise notice 'DB-128 part 2 OK';
end $$;

-- ===== part 3: the guards hold even if RLS were misconfigured (permissive policies, rolled back) =====
create policy tmp_req_all on custom_project_requests for all using (true) with check (true);
create policy tmp_addon_all on custom_project_addons for all using (true) with check (true);
grant insert, update, delete on custom_project_addons to authenticated;

do $$
declare
  a  uuid := (select id from auth.users where email = 'a128@x.io');
  r  uuid := (select id from custom_project_requests where title = 'Admin fixed title');
  ad uuid := (select id from custom_project_addons where project_id = r and status = 'accepted');
begin
  perform test_as(a);
  begin update custom_project_requests set estimated_total = 1 where id = r; raise exception 'FAIL guard estimated_total';
  exception when insufficient_privilege then null; end;
  begin update custom_project_requests set base_price = 1, feature_total = 0 where id = r; raise exception 'FAIL guard base_price';
  exception when insufficient_privilege then null; end;
  begin update custom_project_requests set final_price = 1 where id = r; raise exception 'FAIL guard final_price';
  exception when insufficient_privilege then null; end;
  begin update custom_project_addons set price = 1 where id = ad; raise exception 'FAIL guard add-on price';
  exception when insufficient_privilege then null; end;
  begin insert into custom_project_addons(project_id,title,status,price) values (r,'free','accepted',0); raise exception 'FAIL guard add-on insert';
  exception when insufficient_privilege then null; end;
  begin delete from custom_project_addons where id = ad; raise exception 'FAIL guard add-on delete';
  exception when insufficient_privilege then null; end;
  perform test_reset();
  if (select price from custom_project_addons where id = ad) <> 2500 then raise exception 'FAIL add-on price moved'; end if;
  raise notice 'DB-128 OK';
end $$;

rollback;

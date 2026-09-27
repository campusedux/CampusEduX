-- Bug 1: custom-project requests + children are owner-only; an admin is the only other reader.
\set ON_ERROR_STOP on
do $$
declare
  a uuid := test_make_user('a124@x.io');
  b uuid := test_make_user('b124@x.io');
  ra uuid; rb uuid; da uuid;
begin
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,token_payment_status,status)
    values (a,'A proj','personal','standard','web','paid','delivered') returning id into ra;
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,token_payment_status)
    values (b,'B proj','personal','standard','web','paid') returning id into rb;
  insert into custom_project_payments(request_id,user_id,project_type,amount,status) values (ra,a,'personal',3000,'paid');
  insert into custom_project_messages(request_id,sender_id,sender_role,body) values (ra,a,'student','hi from A');
  insert into custom_project_request_history(request_id,new_status) values (ra,'new');
  insert into custom_project_deliveries(request_id,notes) values (ra,'A delivery') returning id into da;
  insert into custom_project_delivery_assets(delivery_id,storage_path) values (da, a::text || '/' || ra::text || '/x.zip');

  -- B sees only B's request and none of A's children
  perform test_as(b);
  if (select count(*) from custom_project_requests) <> 1 then raise exception 'FAIL b sees other requests'; end if;
  if exists (select 1 from custom_project_requests where id = ra) then raise exception 'FAIL b reads A request'; end if;
  if exists (select 1 from custom_project_payments) then raise exception 'FAIL b reads A payments'; end if;
  if exists (select 1 from custom_project_messages) then raise exception 'FAIL b reads A messages'; end if;
  if exists (select 1 from custom_project_request_history) then raise exception 'FAIL b reads A history'; end if;
  if exists (select 1 from custom_project_deliveries) then raise exception 'FAIL b reads A delivery'; end if;
  if exists (select 1 from custom_project_delivery_assets) then raise exception 'FAIL b reads A delivery assets'; end if;
  -- B cannot post into A's thread
  begin
    insert into custom_project_messages(request_id,sender_id,sender_role,body) values (ra,b,'student','intrusion');
    raise exception 'FAIL b posted into A thread';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  -- anon sees nothing
  perform test_as(null,'anon');
  if exists (select 1 from custom_project_requests) then raise exception 'FAIL anon reads requests'; end if;
  perform test_reset();

  -- A sees own request + delivery (status = delivered)
  perform test_as(a);
  if (select count(*) from custom_project_requests) <> 1 then raise exception 'FAIL a own request'; end if;
  if (select count(*) from custom_project_delivery_assets) <> 1 then raise exception 'FAIL a own delivery assets'; end if;
  perform test_reset();

  -- NOTE: the admin "for all" policy is NOT asserted here. In the harness chain admin 013 runs before
  -- mobile 0033 creates these tables, so 013's to_regclass guard skips it; on the live DB it exists
  -- (custom_project_requests_admin_all) and lets an admin read every row, which is why the "my
  -- projects" client queries add an explicit .eq('user_id', ...).

  raise notice 'DB-124 OK';
end $$;

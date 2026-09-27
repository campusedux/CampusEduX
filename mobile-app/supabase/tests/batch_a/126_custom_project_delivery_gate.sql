-- Bug 4: custom_project_set_status() refuses 'delivered' with no deliverable (migration 0125 / 097).
\set ON_ERROR_STOP on
do $$
declare
  a uuid := test_make_user('a126@x.io');
  adm uuid := test_make_user('adm126@x.io');
  r1 uuid; r2 uuid; r3 uuid; d uuid;
begin
  insert into public.admin_users(id,email,role,status) values (adm,'adm126@x.io','super_admin','active');

  -- r1: no delivery row at all -> cannot deliver
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,
                                      estimated_total,token_amount,token_payment_status,status)
    values (a,'R1','personal','standard','web',5000,3000,'paid','ready') returning id into r1;
  perform test_as(adm);
  begin perform custom_project_set_status(r1, 'delivered', null); raise exception 'FAIL delivered with no delivery row';
  exception when raise_exception then if sqlerrm not like '%demo URL or at least one file%' then raise; end if; end;
  perform test_reset();
  if (select status from custom_project_requests where id = r1) <> 'ready' then raise exception 'FAIL status moved despite rejection'; end if;

  -- r2: a delivery row exists but is empty (no demo_url, no assets) -> still cannot deliver
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,
                                      estimated_total,token_amount,token_payment_status,status)
    values (a,'R2','personal','standard','web',5000,3000,'paid','ready') returning id into r2;
  insert into custom_project_deliveries(request_id) values (r2);
  perform test_as(adm);
  begin perform custom_project_set_status(r2, 'delivered', null); raise exception 'FAIL delivered with empty delivery row';
  exception when raise_exception then if sqlerrm not like '%demo URL or at least one file%' then raise; end if; end;
  perform test_reset();

  -- r2: a demo_url alone is enough
  update custom_project_deliveries set demo_url = 'https://example.com/demo' where request_id = r2;
  perform test_as(adm);
  perform custom_project_set_status(r2, 'delivered', null);
  perform test_reset();
  if (select status from custom_project_requests where id = r2) <> 'delivered' then raise exception 'FAIL demo_url alone not accepted'; end if;
  if (select delivered_at from custom_project_deliveries where request_id = r2) is null then raise exception 'FAIL delivered_at not stamped'; end if;

  -- r3: an asset alone (no demo_url) is enough, including the new 'pdf'/'ppt' kinds
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,
                                      estimated_total,token_amount,token_payment_status,status)
    values (a,'R3','personal','standard','web',5000,3000,'paid','ready') returning id into r3;
  insert into custom_project_deliveries(request_id) values (r3) returning id into d;
  insert into custom_project_delivery_assets(delivery_id, kind, storage_path)
    values (d, 'pdf', a::text || '/' || r3::text || '/spec.pdf');
  perform test_as(adm);
  perform custom_project_set_status(r3, 'delivered', null);
  perform test_reset();
  if (select status from custom_project_requests where id = r3) <> 'delivered' then raise exception 'FAIL asset alone not accepted'; end if;

  -- the 'ppt' kind is also accepted by the widened check constraint
  insert into custom_project_delivery_assets(delivery_id, kind, storage_path)
    values (d, 'ppt', a::text || '/' || r3::text || '/deck.ppt');

  -- re-delivering (already delivered) never re-runs the gate or re-stamps delivered_at
  perform test_as(adm);
  perform custom_project_set_status(r3, 'delivered', 'no-op re-save');
  perform test_reset();

  -- non-'delivered' transitions are completely unaffected by the gate
  perform test_as(adm);
  perform custom_project_set_status(r1, 'in_development', null);
  perform test_reset();
  if (select status from custom_project_requests where id = r1) <> 'in_development' then raise exception 'FAIL unrelated transition blocked'; end if;

  raise notice 'DB-126 OK';
end $$;

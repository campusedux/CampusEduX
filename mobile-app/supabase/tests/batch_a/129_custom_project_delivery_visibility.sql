-- Migration 0128/099 loosened the owner read policies on custom_project_deliveries / _delivery_assets
-- (status = 'delivered' OR delivered_at IS NOT NULL). Prove the loosening is OWNER-ONLY: another signed-in
-- user and anon can never read a delivery, its assets or its storage objects in any lifecycle state,
-- even when they know every id and path.
\set ON_ERROR_STOP on
grant insert, update, delete on storage.objects to authenticated;  -- stub only grants SELECT; real Supabase grants all
do $$
declare
  a   uuid := test_make_user('a129@x.io');
  b   uuid := test_make_user('b129@x.io');
  adm uuid := test_make_user('adm129@x.io');
  r_staged uuid; r_delivered uuid; r_moved_back uuid;
  d_staged uuid; d_delivered uuid; d_moved_back uuid;
  n int;
begin
  insert into admin_users(id,email,role,status) values (adm,'adm129@x.io','super_admin','active');

  insert into custom_project_requests(user_id,title,project_type,project_level,platform,token_payment_status,status)
    values (a,'staged','personal','standard','web','paid','ready') returning id into r_staged;
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,token_payment_status)
    values (a,'delivered','personal','standard','web','paid') returning id into r_delivered;
  insert into custom_project_requests(user_id,title,project_type,project_level,platform,token_payment_status)
    values (a,'moved back','personal','standard','web','paid') returning id into r_moved_back;

  insert into custom_project_deliveries(request_id, demo_url) values (r_staged, 'https://x.io/s') returning id into d_staged;
  insert into custom_project_deliveries(request_id, demo_url) values (r_delivered, 'https://x.io/d') returning id into d_delivered;
  insert into custom_project_deliveries(request_id, demo_url) values (r_moved_back, 'https://x.io/m') returning id into d_moved_back;
  insert into custom_project_delivery_assets(delivery_id, storage_path) values
    (d_staged,     a::text || '/' || r_staged::text     || '/src.zip'),
    (d_delivered,  a::text || '/' || r_delivered::text  || '/src.zip'),
    (d_moved_back, a::text || '/' || r_moved_back::text || '/src.zip');
  insert into storage.objects(bucket_id, name) values
    ('custom-project-deliveries', a::text || '/' || r_staged::text     || '/src.zip'),
    ('custom-project-deliveries', a::text || '/' || r_delivered::text  || '/src.zip'),
    ('custom-project-deliveries', a::text || '/' || r_moved_back::text || '/src.zip');

  perform test_as(adm);
  perform custom_project_set_status(r_delivered, 'delivered', null);
  perform custom_project_set_status(r_moved_back, 'delivered', null);
  perform custom_project_set_status(r_moved_back, 'in_development', 'building an accepted add-on');
  perform test_reset();
  if (select delivered_at from custom_project_deliveries where id = d_moved_back) is null then
    raise exception 'FAIL setup: delivered_at not set';
  end if;

  -- another signed-in user: nothing, in every state, even filtering by the exact ids / paths
  perform test_as(b);
  select count(*) into n from custom_project_deliveries;                                   if n <> 0 then raise exception 'FAIL b deliveries %', n; end if;
  select count(*) into n from custom_project_deliveries where id in (d_staged, d_delivered, d_moved_back);
  if n <> 0 then raise exception 'FAIL b deliveries by id'; end if;
  select count(*) into n from custom_project_delivery_assets;                              if n <> 0 then raise exception 'FAIL b assets %', n; end if;
  select count(*) into n from custom_project_delivery_assets where delivery_id in (d_staged, d_delivered, d_moved_back);
  if n <> 0 then raise exception 'FAIL b assets by delivery id'; end if;
  select count(*) into n from storage.objects where bucket_id = 'custom-project-deliveries'; if n <> 0 then raise exception 'FAIL b storage %', n; end if;
  select count(*) into n from storage.objects
   where bucket_id = 'custom-project-deliveries' and name = a::text || '/' || r_delivered::text || '/src.zip';
  if n <> 0 then raise exception 'FAIL b storage by exact path'; end if;
  perform test_reset();

  -- anon: nothing
  perform test_as(null, 'anon');
  select count(*) into n from custom_project_deliveries;                                   if n <> 0 then raise exception 'FAIL anon deliveries'; end if;
  select count(*) into n from custom_project_delivery_assets;                              if n <> 0 then raise exception 'FAIL anon assets'; end if;
  select count(*) into n from storage.objects where bucket_id = 'custom-project-deliveries'; if n <> 0 then raise exception 'FAIL anon storage'; end if;
  perform test_reset();

  -- the owner: delivered + moved-back are readable; the staged (never delivered) one is not
  perform test_as(a);
  if not exists (select 1 from custom_project_deliveries where id = d_delivered)
     or not exists (select 1 from custom_project_delivery_assets where delivery_id = d_delivered) then
    raise exception 'FAIL owner cannot read a delivered delivery';
  end if;
  if not exists (select 1 from custom_project_deliveries where id = d_moved_back)
     or not exists (select 1 from custom_project_delivery_assets where delivery_id = d_moved_back) then
    raise exception 'FAIL owner lost a delivery after the status moved back';
  end if;
  if exists (select 1 from custom_project_deliveries where id = d_staged)
     or exists (select 1 from custom_project_delivery_assets where delivery_id = d_staged) then
    raise exception 'FAIL owner reads a staged (never delivered) delivery';
  end if;
  select count(*) into n from storage.objects
   where bucket_id = 'custom-project-deliveries' and name like a::text || '/%';
  if n < 2 then raise exception 'FAIL owner cannot read own delivered files (%)', n; end if;
  -- the owner still cannot write into the deliveries bucket
  begin
    insert into storage.objects(bucket_id, name) values ('custom-project-deliveries', a::text || '/x/own.zip');
    raise exception 'FAIL owner wrote to deliveries bucket';
  exception when insufficient_privilege then null; end;
  perform test_reset();

  raise notice 'DB-129 OK';
end $$;

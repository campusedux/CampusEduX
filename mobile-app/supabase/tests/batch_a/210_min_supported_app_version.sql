-- Migration 0129/100: site_settings.min_supported_app_version — readable by everyone (the app reads it
-- before sign-in), valid x.y.z only, and changeable only by an admin with settings:edit.
\set ON_ERROR_STOP on
do $$
declare
  u   uuid := test_make_user('u210@x.io');
  adm uuid := test_make_user('adm210@x.io');
  vw  uuid := test_make_user('vw210@x.io');
  n int; v text;
begin
  insert into admin_users(id,email,role,status) values (adm,'adm210@x.io','super_admin','active');
  insert into admin_users(id,email,role,status) values (vw,'vw210@x.io','viewer','active');

  perform test_as(null, 'anon');
  select min_supported_app_version into v from site_settings where id = 1;
  if v is distinct from '0.0.0' then raise exception 'FAIL anon read / default %', v; end if;
  perform test_reset();

  -- a normal user and a view-only admin cannot change it (RLS matches no row)
  perform test_as(u);
  update site_settings set min_supported_app_version = '9.9.9' where id = 1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL user updated min version'; end if;
  perform test_reset();
  perform test_as(vw);
  update site_settings set min_supported_app_version = '9.9.9' where id = 1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL viewer updated min version'; end if;
  perform test_reset();

  -- an admin with settings:edit can; malformed values are rejected
  perform test_as(adm);
  update site_settings set min_supported_app_version = '1.2.0' where id = 1;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL admin could not update'; end if;
  begin
    update site_settings set min_supported_app_version = '1.2' where id = 1;
    raise exception 'FAIL malformed version accepted';
  exception when check_violation then null; end;
  begin
    update site_settings set min_supported_app_version = '1.2.0-beta' where id = 1;
    raise exception 'FAIL suffixed version accepted';
  exception when check_violation then null; end;
  perform test_reset();
  if (select min_supported_app_version from site_settings where id = 1) <> '1.2.0' then raise exception 'FAIL value'; end if;
  raise notice 'DB-210 OK';
end $$;

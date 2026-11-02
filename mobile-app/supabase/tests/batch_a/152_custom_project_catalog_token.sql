-- Catalog updates synchronize levels without changing existing RLS or request snapshots.
\set ON_ERROR_STOP on
begin;
do $$
declare
  admin_id uuid := test_make_user('catalog-admin152@x.test');
  student_id uuid := test_make_user('catalog-student152@x.test');
  n integer;
begin
  insert into public.admin_users(id,email,role,status)
    values (admin_id,'catalog-admin152@x.test','super_admin','active');
  perform test_as(admin_id);
  update public.custom_project_pricing set token_amount = 2123.45, base_price = 12345
    where project_type = 'personal' and project_level = 'standard';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL admin update returned % rows', n; end if;
  if (select count(*) from public.custom_project_pricing
      where project_type = 'personal' and token_amount = 2123.45) <> 2 then
    raise exception 'FAIL token not synchronized across levels';
  end if;
  if (select base_price from public.custom_project_pricing
      where project_type = 'personal' and project_level = 'advanced') = 12345 then
    raise exception 'FAIL peer base price changed';
  end if;
  update public.custom_project_pricing set token_amount = 2345
    where project_type = 'personal' and project_level = 'advanced';
  if (select count(*) from public.custom_project_pricing
      where project_type = 'personal' and token_amount = 2345) <> 2 then
    raise exception 'FAIL reverse synchronization';
  end if;
  perform test_reset();

  perform test_as(student_id);
  begin
    update public.custom_project_pricing set token_amount = 1 where project_type = 'personal';
    get diagnostics n = row_count;
  exception when insufficient_privilege then n := 0;
  end;
  perform test_reset();
  if n <> 0 then raise exception 'FAIL student changed pricing'; end if;

  perform test_as(null, 'anon');
  begin
    update public.custom_project_pricing set token_amount = 1 where project_type = 'personal';
    get diagnostics n = row_count;
  exception when insufficient_privilege then n := 0;
  end;
  perform test_reset();
  if n <> 0 then raise exception 'FAIL anon changed pricing'; end if;
  if (select count(*) from public.custom_project_pricing
      where project_type = 'personal' and token_amount = 2345) <> 2 then
    raise exception 'FAIL denied write changed token';
  end if;
end;
$$;
rollback;

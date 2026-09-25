-- Harness smoke: users + signup trigger, profile RLS isolation, admin_users / is_admin().
do $$
declare a uuid; b uuid; n int; adm uuid;
begin
  a := test_make_user('a@example.test', '{"full_name":"User A"}');
  b := test_make_user('b@example.test', '{"full_name":"User B"}');
  if (select count(*) from public.profiles where id in (a,b)) <> 2 then
    raise exception 'signup trigger did not create both profiles'; end if;

  perform test_as(a);
  if auth.uid() is distinct from a then raise exception 'auth.uid() mismatch'; end if;
  select count(*) into n from public.profiles where id = b;
  if n <> 0 then raise exception 'A can see B''s profile (% rows)', n; end if;
  select count(*) into n from public.profiles where id = a;
  if n <> 1 then raise exception 'A cannot see own profile'; end if;
  perform test_reset();

  -- expected-failure pattern
  perform test_as(a);
  begin
    insert into public.admin_users(id, email, role) values (a, 'a@example.test', 'admin');
    raise exception 'non-admin inserted into admin_users';
  exception when insufficient_privilege or check_violation then null; end;
  perform test_reset();

  if public.is_admin(b) then raise exception 'b should not be admin'; end if;
  insert into public.admin_users(id, email, role, status) values (b, 'b@example.test', 'super_admin', 'active');
  if not public.is_admin(b) then raise exception 'is_admin(b) false after insert'; end if;
  perform test_as(b);
  if not public.is_admin() then raise exception 'is_admin() false as admin b'; end if;
  perform test_reset();
end $$;

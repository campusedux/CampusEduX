-- DB-03 / DB-04 / DB-32 / 0118: profile guard trigger, is_active_user(), blocked-user write enforcement.
grant insert, update, delete on storage.objects to authenticated;   -- stub only grants SELECT
do $$
declare u uuid; v uuid; adm uuid; sup uuid; vw uuid; n int; r record; ok boolean;
begin
  u := test_make_user('u@x.test', '{"full_name":"User U","mobile_number":"9000000001"}');
  v := test_make_user('v@x.test', '{"full_name":"User V"}');
  adm := test_make_user('adm@x.test'); sup := test_make_user('sup@x.test'); vw := test_make_user('vw@x.test');
  insert into public.admin_users(id,email,role,status) values
    (adm,'adm@x.test','admin','active'), (sup,'sup@x.test','support','active'), (vw,'vw@x.test','viewer','active');
  insert into public.projects(id,title) values ('proj-1','P1');

  -- ===== normal user: allowed fields work, pinned fields are silently kept =====
  perform test_as(u);
  update public.profiles set full_name='New Name', avatar_url='http://a/x.jpg', course='BTech', mobile_number='9000000002',
    location='Pune', github_url='https://github.com/u' where id=u;
  select * into r from public.profiles where id=u;
  if r.full_name<>'New Name' or r.avatar_url is null or r.mobile_number<>'9000000002' or r.location<>'Pune' then
    raise exception 'allowed profile fields were not updated: %', r; end if;
  update public.profiles set status='blocked', blocked_reason='x', blocked_at=now(), blocked_by=u, admin_notes='hi',
    email='evil@x.test', referral_code='HACK1', is_premium=true where id=u;
  select * into r from public.profiles where id=u;
  if r.status<>'active' or r.blocked_reason is not null or r.blocked_at is not null or r.blocked_by is not null
     or r.admin_notes is not null or r.email<>'u@x.test' or r.referral_code is not null or r.is_premium then
    raise exception 'pinned columns changed by user: %', r; end if;
  perform test_reset();

  -- email may follow a verified auth email change
  update auth.users set email='u2@x.test' where id=u;
  perform test_as(u); update public.profiles set email='u2@x.test' where id=u;
  if (select email from public.profiles where id=u)<>'u2@x.test' then raise exception 'email sync to auth email refused'; end if;
  perform test_reset();

  -- ===== INSERT path (DB-32 + sanitising) =====
  delete from public.profiles where id=v;
  perform test_as(v);
  insert into public.profiles(id,email,full_name,is_premium,status,admin_notes,blocked_reason,referral_code)
    values (v,'spoof@x.test','V',true,'blocked','n','r',null);
  select * into r from public.profiles where id=v;
  if r.is_premium or r.status<>'active' or r.admin_notes is not null or r.blocked_reason is not null or r.email<>'v@x.test' then
    raise exception 'insert not sanitised: %', r; end if;
  perform test_reset();

  -- ===== is_active_user semantics =====
  if not public.is_active_user(u) then raise exception 'active user reported inactive (privileged caller)'; end if;
  perform test_as(u);
  if not public.is_active_user() then raise exception 'is_active_user() false for active self'; end if;
  if public.is_active_user(v) then raise exception 'is_active_user(other) leaks status'; end if;
  perform test_reset();
  perform test_as(null,'anon'); if public.is_active_user() then raise exception 'anon active'; end if; perform test_reset();

  -- ===== admin/support can block & unblock; viewer cannot =====
  perform test_as(adm);
  update public.profiles set status='blocked', blocked_reason='abuse', blocked_at=now(), blocked_by=adm, admin_notes='n' where id=u;
  if (select status from public.profiles where id=u)<>'blocked' then raise exception 'admin could not block'; end if;
  perform test_reset();
  if public.is_active_user(u) then raise exception 'blocked user still active'; end if;

  perform test_as(vw);
  update public.profiles set status='active' where id=u;
  get diagnostics n = row_count;
  if n<>0 then raise exception 'viewer updated profile'; end if;
  perform test_reset();

  -- ===== blocked user: read yes, writes no =====
  insert into public.custom_project_drafts(user_id,payload) values (u,'{}');   -- pre-existing row (superuser)
  perform test_as(u);
  if (select count(*) from public.profiles where id=u)<>1 then raise exception 'blocked user cannot read own profile'; end if;
  update public.profiles set status='active', blocked_reason=null where id=u;
  get diagnostics n = row_count;
  if n<>0 or (select status from public.profiles where id=u)<>'blocked' then raise exception 'blocked user self-unblocked'; end if;
  update public.profiles set full_name='Sneaky' where id=u;
  get diagnostics n = row_count; if n<>0 then raise exception 'blocked user updated profile'; end if;

  ok := false; begin insert into public.wishlists(user_id,project_id) values (u,'proj-1'); exception when insufficient_privilege or check_violation then ok := true; end;
  if not ok then raise exception 'blocked user inserted wishlist'; end if;
  ok := false; begin insert into public.reviews(project_id,user_id,rating) values ('proj-1',u,5); exception when insufficient_privilege or check_violation then ok := true; end;
  if not ok then raise exception 'blocked user inserted review'; end if;
  -- ALL policy split: read allowed, update/delete of existing row denied, insert denied
  if (select count(*) from public.custom_project_drafts where user_id=u)<>1 then raise exception 'blocked user cannot read own draft'; end if;
  update public.custom_project_drafts set payload='{"a":1}' where user_id=u; get diagnostics n = row_count;
  if n<>0 then raise exception 'blocked user updated draft'; end if;
  delete from public.custom_project_drafts where user_id=u; get diagnostics n = row_count;
  if n<>0 then raise exception 'blocked user deleted draft'; end if;
  -- storage uploads
  ok := false; begin insert into storage.objects(bucket_id,name) values ('avatars', u::text||'/a.jpg'); exception when insufficient_privilege or check_violation then ok := true; end;
  if not ok then raise exception 'blocked user uploaded avatar'; end if;
  ok := false; begin insert into storage.objects(bucket_id,name) values ('resumes', u::text||'/r.pdf'); exception when insufficient_privilege or check_violation then ok := true; end;
  if not ok then raise exception 'blocked user uploaded resume'; end if;
  -- RPCs
  ok := false; begin perform public.record_legal_consent('1','1','1','app'); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'blocked user recorded consent'; end if;
  ok := false; begin perform public.submit_test_attempt('nope','[]'::jsonb,1); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'blocked user submit_test_attempt not rejected with 42501'; end if;
  ok := false; begin perform public.submit_randomized_test_attempt('nope',array[]::text[],'[]'::jsonb,1); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'blocked user submit_randomized_test_attempt not rejected'; end if;
  perform test_reset();

  -- ===== support (students:edit) unblocks =====
  perform test_as(sup);
  update public.profiles set status='active', blocked_reason=null, blocked_at=null, blocked_by=null where id=u;
  if (select status from public.profiles where id=u)<>'active' then raise exception 'support could not unblock'; end if;
  perform test_reset();

  -- ===== unblocked user writes again =====
  perform test_as(u);
  insert into public.wishlists(user_id,project_id) values (u,'proj-1');
  insert into storage.objects(bucket_id,name) values ('avatars', u::text||'/a.jpg');
  update public.custom_project_drafts set payload='{"a":2}' where user_id=u; get diagnostics n = row_count;
  if n<>1 then raise exception 'unblocked user cannot update draft'; end if;
  delete from public.wishlists where user_id=u;
  perform test_reset();

  -- ===== no own-row write policy without is_active_user (except deferred payment tables / profiles insert) =====
  if exists (select 1 from pg_policies where cmd<>'SELECT' and schemaname in ('public','storage')
      and (coalesce(qual,'')||coalesce(with_check,'')) like '%auth.uid()%'
      and (coalesce(qual,'')||coalesce(with_check,'')) !~ '(is_admin|has_permission|current_admin_role|is_active_user)'
      and tablename not in ('profiles','purchases','premium_subscriptions','refund_requests','withdrawal_requests')
      and not (tablename='objects' and (coalesce(qual,'')||coalesce(with_check,'')) !~ '(avatars|resumes|custom-project-uploads)')) then
    raise exception 'own-row write policy without is_active_user remains: %',
      (select string_agg(tablename||'.'||policyname, ', ') from pg_policies where cmd<>'SELECT' and schemaname in ('public','storage')
        and (coalesce(qual,'')||coalesce(with_check,'')) like '%auth.uid()%'
        and (coalesce(qual,'')||coalesce(with_check,'')) !~ '(is_admin|has_permission|current_admin_role|is_active_user)'
        and tablename not in ('profiles','purchases','premium_subscriptions','refund_requests','withdrawal_requests')); end if;
end $$;

-- idempotence: re-running the migration rewrites nothing new
\ir ../../migrations/0118_profiles_guard_and_blocked_enforcement.sql

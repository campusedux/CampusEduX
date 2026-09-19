-- DB-07 / ADM-01 / DB-26 / DB-27 / DB-28 / 0119: role matrix enforced in RLS + admin RPC guards.
grant insert, update, delete on storage.objects to authenticated;   -- stub only grants SELECT

-- t_can(sql): true when the statement affects >=1 row; false on RLS/privilege denial (42501) or 0 rows.
create or replace function public.t_can(q text) returns boolean language plpgsql as $$
declare n int;
begin
  execute q; get diagnostics n = row_count; return n > 0;
exception when insufficient_privilege then return false;
end $$;
grant execute on function public.t_can(text) to public;

create temp table spec(module text, tbl text, keycol text, cols text, vals text, ops text);
-- ops: a=insert, e=update, d=delete ; %K% = key literal ; update sets keycol := keycol || 'x'
insert into spec values
 ('settings','courses','id','id,name','''%K%'',''n''','aed'),
 ('cms','faqs','question','question','''%K%''','aed'),
 ('jobs','companies','id','id,name','''%K%'',''n''','aed'),
 ('learning','learning_grids','slug','name,slug','''n'',''%K%''','aed'),
 ('learning','practice_tests','id','id,title','''%K%'',''t''','aed'),
 ('placement','practice_tests','id','id,title','''%K%'',''t''','aed'),
 ('resume','ats_rules','id','id,section,rule','''%K%'',''general'',''r''','aed'),
 ('blog','blog_categories','slug','name,slug','''n'',''%K%''','aed'),
 ('projects','categories','id','id,name','''%K%'',''n''','aed'),
 ('orders','coupons','code','code','''%K%''','aed'),
 ('custom_projects','custom_project_feature_categories','id','id,name','''%K%'',''n''','aed'),
 ('reviews','testimonials','author_name','author_name,quote','''%K%'',''q''','aed'),
 ('reports','generated_reports','kind','kind,created_by','''%K%'',auth.uid()','ad'),
 ('cms','push_notifications','title','title','''%K%''','a');

do $$
declare
  roles text[] := array['super_admin','admin','editor','support','viewer'];
  rl text; uid uuid; s record; k text; q text; mods text[];
  exp_a boolean; exp_e boolean; exp_d boolean; got boolean; stu uuid; n int;
  uids jsonb := '{}'::jsonb; ok boolean;
begin
  stu := test_make_user('student@x.test');
  foreach rl in array roles loop
    uid := test_make_user(rl||'@x.test');
    insert into public.admin_users(id,email,role,status) values (uid, rl||'@x.test', rl, 'active');
    uids := uids || jsonb_build_object(rl, uid);
  end loop;

  foreach rl in array roles loop
    uid := (uids->>rl)::uuid;
    for s in select * from spec loop
      -- expected from the live matrix (super_admin: always true)
      select bool_or(coalesce(public.has_permission(uid, s.module, 'add'), false)),
             bool_or(coalesce(public.has_permission(uid, s.module, 'edit'), false)),
             bool_or(coalesce(public.has_permission(uid, s.module, 'delete'), false))
        into exp_a, exp_e, exp_d;
      -- has_permission(uid,...) with a foreign uid is false for an unprivileged caller, but we are superuser here -> exact.
      if s.module = 'learning' and s.tbl = 'practice_tests' then null; end if;
      -- practice_tests policies accept learning OR placement: expected = OR of both modules
      if s.tbl = 'practice_tests' then
        exp_a := coalesce(public.has_permission(uid,'learning','add'),false) or coalesce(public.has_permission(uid,'placement','add'),false);
        exp_e := coalesce(public.has_permission(uid,'learning','edit'),false) or coalesce(public.has_permission(uid,'placement','edit'),false);
        exp_d := coalesce(public.has_permission(uid,'learning','delete'),false) or coalesce(public.has_permission(uid,'placement','delete'),false);
      end if;

      -- INSERT
      if strpos(s.ops,'a')>0 then
        k := 'k'||replace(gen_random_uuid()::text,'-','');
        q := format('insert into public.%I(%s) values (%s)', s.tbl, s.cols, replace(s.vals,'%K%',k));
        perform test_as(uid); got := public.t_can(q); perform test_reset();
        if got is distinct from exp_a then raise exception '% insert % (module %): got %, expected %', rl, s.tbl, s.module, got, exp_a; end if;
        execute format('delete from public.%I where %I = %L', s.tbl, s.keycol, k);
      end if;
      -- UPDATE
      if strpos(s.ops,'e')>0 then
        execute format('delete from public.%I where %I = ''seed''', s.tbl, s.keycol);
        execute format('insert into public.%I(%s) values (%s)', s.tbl, s.cols, replace(s.vals,'%K%','seed'));
        q := format('update public.%I set %I = %I || ''x'' where %I = ''seed''', s.tbl, s.keycol, s.keycol, s.keycol);
        perform test_as(uid); got := public.t_can(q); perform test_reset();
        if got is distinct from exp_e then raise exception '% update % (module %): got %, expected %', rl, s.tbl, s.module, got, exp_e; end if;
        execute format('delete from public.%I where %I in (''seed'',''seedx'')', s.tbl, s.keycol);
      end if;
      -- DELETE
      if strpos(s.ops,'d')>0 then
        execute format('delete from public.%I where %I = ''seed''', s.tbl, s.keycol);
        execute format('insert into public.%I(%s) values (%s)', s.tbl, s.cols, replace(s.vals,'%K%','seed'));
        q := format('delete from public.%I where %I = ''seed''', s.tbl, s.keycol);
        perform test_as(uid); got := public.t_can(q); perform test_reset();
        if got is distinct from exp_d then raise exception '% delete % (module %): got %, expected %', rl, s.tbl, s.module, got, exp_d; end if;
        execute format('delete from public.%I where %I = ''seed''', s.tbl, s.keycol);
      end if;
    end loop;

    -- singleton tables: profiles (students:edit), reward_settings (referrals:edit), site_settings (settings:edit)
    perform test_as(uid);
    got := public.t_can(format('update public.profiles set location=%L where id=%L','X',stu));
    if got is distinct from coalesce(public.has_permission(uid,'students','edit'),false) then raise exception '% profiles update got %', rl, got; end if;
    got := public.t_can('update public.reward_settings set updated_at = now()');
    if got is distinct from coalesce(public.has_permission(uid,'referrals','edit'),false) then raise exception '% reward_settings update got %', rl, got; end if;
    got := public.t_can('update public.site_settings set updated_at = now()');
    if got is distinct from coalesce(public.has_permission(uid,'settings','edit'),false) then raise exception '% site_settings update got %', rl, got; end if;
    got := public.t_can('insert into public.backups default values');
    if got is distinct from coalesce(public.has_permission(uid,'backup','add'),false) then raise exception '% backups insert got %', rl, got; end if;
    -- every admin can still READ
    if (select count(*) from public.courses) = 0 then raise exception '% cannot read courses', rl; end if;
    if (select count(*) from public.admin_users) = 0 then raise exception '% cannot read admin_users', rl; end if;
    perform test_reset();
  end loop;

  -- ===== explicit expectations against the seeded matrix (guards against a vacuous loop) =====
  -- super_admin passes everything; viewer nothing; editor add/edit-not-delete on projects; support edit-only on students
  perform test_as((uids->>'super_admin')::uuid);
  if not public.has_permission((uids->>'super_admin')::uuid,'roles','delete') then raise exception 'super_admin bypass lost'; end if;
  perform test_reset();
  perform test_as((uids->>'viewer')::uuid);
  if public.t_can('insert into public.categories(id,name) values (''v1'',''v'')') then raise exception 'viewer inserted'; end if;
  perform test_reset();
  perform test_as((uids->>'editor')::uuid);
  if not public.t_can('insert into public.categories(id,name) values (''e1'',''e'')') then raise exception 'editor cannot add project category'; end if;
  if not public.t_can('update public.categories set name=''e2'' where id=''e1''') then raise exception 'editor cannot edit'; end if;
  if public.t_can('delete from public.categories where id=''e1''') then raise exception 'editor deleted'; end if;
  if public.t_can('insert into public.coupons(code) values (''EDX'')') then raise exception 'editor wrote orders module'; end if;
  perform test_reset();
  perform test_as((uids->>'support')::uuid);
  if not public.t_can(format('update public.profiles set location=%L where id=%L','S',stu)) then raise exception 'support cannot edit students'; end if;
  if public.t_can('insert into public.categories(id,name) values (''s1'',''s'')') then raise exception 'support wrote projects'; end if;
  perform test_reset();

  -- ===== storage: bucket -> module =====
  perform test_as((uids->>'super_admin')::uuid);
  foreach k in array array['project-files','project-media','banners','site','resume-templates','learning-files','custom-project-deliveries','admin-media'] loop
    insert into storage.objects(bucket_id,name) values (k, 'p/a.bin');
    update storage.objects set name = 'p/b.bin' where bucket_id=k and name='p/a.bin';
    get diagnostics n = row_count; if n<>1 then raise exception 'super_admin cannot update in %', k; end if;
    delete from storage.objects where bucket_id=k and name='p/b.bin';
    get diagnostics n = row_count; if n<>1 then raise exception 'super_admin cannot delete in %', k; end if;
  end loop;
  perform test_reset();
  perform test_as((uids->>'viewer')::uuid);
  foreach k in array array['project-files','banners','learning-files','custom-project-deliveries'] loop
    if public.t_can(format('insert into storage.objects(bucket_id,name) values (%L,''p/v.bin'')', k)) then raise exception 'viewer uploaded to %', k; end if;
  end loop;
  -- admin-media stays generic: any admin, viewer included, as before
  if not public.t_can('insert into storage.objects(bucket_id,name) values (''admin-media'',''p/v.bin'')') then raise exception 'admin-media generic write lost'; end if;
  perform test_reset();
  perform test_as((uids->>'editor')::uuid);
  if not public.t_can('insert into storage.objects(bucket_id,name) values (''project-files'',''p1/e.bin'')') then raise exception 'editor cannot upload project-files'; end if;
  if not public.t_can('delete from storage.objects where bucket_id=''project-files'' and name=''p1/e.bin''') then raise exception 'editor cannot replace/remove project-files (edit)'; end if;
  perform test_reset();
  perform test_as((uids->>'support')::uuid);
  if public.t_can('insert into storage.objects(bucket_id,name) values (''project-files'',''p1/s.bin'')') then raise exception 'support uploaded project-files'; end if;
  if not public.t_can('insert into storage.objects(bucket_id,name) values (''custom-project-deliveries'',''u/s.bin'')') then raise exception 'support (custom_projects:edit) cannot upload deliveries'; end if;
  perform test_reset();

  -- ===== admin RPC guards: denied roles get 42501, allowed roles get past the guard =====
  foreach rl in array roles loop
    uid := (uids->>rl)::uuid; perform test_as(uid);
    -- money RPCs: super_admin/admin only
    ok := true; begin perform public.admin_adjust_wallet(stu,'credit','cashback',10,'t'); exception when insufficient_privilege then ok := false; end;
    if ok is distinct from (rl in ('super_admin','admin')) then raise exception '% admin_adjust_wallet allowed=%', rl, ok; end if;
    ok := true; begin perform public.admin_process_refund(gen_random_uuid(),'approve','x'); exception when insufficient_privilege then ok := false; when others then null; end;
    if ok is distinct from (rl in ('super_admin','admin')) then raise exception '% admin_process_refund allowed=%', rl, ok; end if;
    ok := true; begin perform public.admin_process_withdrawal(gen_random_uuid(),'approve','x'); exception when insufficient_privilege then ok := false; when others then null; end;
    if ok is distinct from (rl in ('super_admin','admin')) then raise exception '% admin_process_withdrawal allowed=%', rl, ok; end if;
    ok := true; begin perform public.send_bulk_notification('t','b'); exception when insufficient_privilege then ok := false; end;
    if ok is distinct from (rl in ('super_admin','admin')) then raise exception '% send_bulk_notification allowed=%', rl, ok; end if;
    -- custom project status: custom_projects:edit (super_admin, admin, editor, support; not viewer)
    ok := true; begin perform public.custom_project_set_status(gen_random_uuid(),'testing','x'); exception when insufficient_privilege then ok := false; when others then null; end;
    if ok is distinct from (rl <> 'viewer') then raise exception '% custom_project_set_status allowed=%', rl, ok; end if;
    perform test_reset();
  end loop;
  -- a plain student (not an admin) is still rejected by the pre-existing is_admin check
  perform test_as(stu);
  ok := true; begin perform public.admin_adjust_wallet(stu,'credit','cashback',10,'t'); exception when others then ok := false; end;
  if ok then raise exception 'student ran admin_adjust_wallet'; end if;
  perform test_reset();

  -- editing the matrix changes enforcement (no hard-coded roles for module permissions)
  update public.role_permissions set can_edit = false where role='admin' and module='cms';
  perform test_as((uids->>'admin')::uuid);
  if public.t_can('update public.faqs set answer=''z'' where true') then raise exception 'matrix edit not enforced'; end if;
  perform test_reset();

  -- ===== DB-26: no role oracle; anonymous public reads still work =====
  perform test_as(null,'anon');
  if public.is_admin((uids->>'super_admin')::uuid) then raise exception 'anon oracle: is_admin(other)'; end if;
  if has_function_privilege('anon','public.has_permission(uuid,text,text)','execute') then raise exception 'anon can execute has_permission'; end if;
  perform 1 from public.courses limit 1;      -- policies evaluate is_admin() as anon: must not raise
  perform 1 from public.projects limit 1;
  perform 1 from public.blog_posts limit 1;
  perform test_reset();
  perform test_as(stu);
  if public.is_admin((uids->>'super_admin')::uuid) then raise exception 'student oracle: is_admin(other)'; end if;
  if public.has_permission((uids->>'super_admin')::uuid,'roles','edit') then raise exception 'student oracle: has_permission(other)'; end if;
  if public.is_admin() then raise exception 'student is admin'; end if;
  perform test_reset();
  perform test_as((uids->>'admin')::uuid);
  if not public.is_admin() or not public.is_admin((uids->>'admin')::uuid) then raise exception 'admin self check broken'; end if;
  if not public.has_permission((uids->>'admin')::uuid,'projects','edit') then raise exception 'admin self has_permission broken'; end if;
  perform test_reset();
  if not public.is_admin((uids->>'admin')::uuid) then raise exception 'privileged caller lost is_admin(uid)'; end if;

  -- ===== DB-27 / DB-28 =====
  if exists (select 1 from pg_proc where oid in ('public.restore_resume_version(uuid)'::regprocedure,'public.compute_ats_breakdown(uuid)'::regprocedure,
        'public.match_resume_to_jd(uuid,text)'::regprocedure) and (proconfig is null or not exists (select 1 from unnest(proconfig) c where c like 'search_path=%'))) then
    raise exception 'DB-27: search_path missing'; end if;
  foreach k in array array['public.admin_adjust_wallet(uuid,text,text,numeric,text)','public.admin_process_refund(uuid,text,text)',
      'public.admin_process_withdrawal(uuid,text,text)','public.send_bulk_notification(text,text,text,text,text)',
      'public.custom_project_set_status(uuid,text,text)','public.log_admin_activity(text,text,text,text,jsonb,text)','public.academic_usage(text,text)'] loop
    if has_function_privilege('anon', k, 'execute') then raise exception 'DB-28: anon can execute %', k; end if;
    if not has_function_privilege('authenticated', k, 'execute') then raise exception 'authenticated lost execute on %', k; end if;
  end loop;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prorettype='trigger'::regtype
      and has_function_privilege('anon', p.oid, 'execute')) then raise exception 'DB-28: anon can execute a trigger function'; end if;
end $$;

-- no is_admin-only write policy may remain on mapped tables; re-run is a no-op
select count(*) as blanket_left from pg_policies where schemaname in ('public','storage') and cmd in ('ALL','INSERT','UPDATE','DELETE')
  and (coalesce(qual,'')||coalesce(with_check,'')) ~ 'is_admin\(auth\.uid\(\)\)' and (coalesce(qual,'')||coalesce(with_check,'')) !~ 'has_permission'
  and tablename not in ('admin_notifications') \gset
\if :blanket_left
\echo 'NOTE blanket is_admin write policies left (expected only admin-media/admin_notifications):' :blanket_left
\endif
\ir ../../migrations/0119_admin_permission_enforcement.sql

-- DB-22 / 0117: project-files private, purchaser-only read, no public exposure; avatars listing closed.
grant insert, update, delete on storage.objects to authenticated;  -- stub only grants SELECT; real Supabase grants all
do $$
declare buyer uuid; other uuid; adm uuid; n int; b record;
begin
  buyer := test_make_user('buyer@x.test'); other := test_make_user('other@x.test'); adm := test_make_user('adm@x.test');
  insert into public.admin_users(id,email,role,status) values (adm,'adm@x.test','super_admin','active');
  insert into public.projects(id,title) values ('proj-1','P1');
  insert into public.purchases(user_id,project_id,status) values (buyer,'proj-1','success');
  insert into public.purchases(user_id,project_id,status) values (other,'proj-1','pending');
  insert into storage.objects(bucket_id,name) values ('project-files','proj-1/source-code.zip'),
    ('avatars', buyer::text||'/a.jpg'), ('avatars', other::text||'/a.jpg');

  -- bucket flags
  if (select public from storage.buckets where id='project-files') then raise exception 'project-files is public'; end if;
  select file_size_limit into n from storage.buckets where id='resumes';
  if n is distinct from 5*1024*1024 then raise exception 'resumes size limit %', n; end if;
  select file_size_limit into n from storage.buckets where id='avatars';
  if n is distinct from 2*1024*1024 then raise exception 'avatars size limit %', n; end if;
  if (select allowed_mime_types from storage.buckets where id='avatars') is distinct from array['image/jpeg','image/png','image/webp'] then raise exception 'avatars mimes'; end if;
  if (select allowed_mime_types from storage.buckets where id='resumes') is distinct from array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'] then raise exception 'resumes mimes'; end if;
  if 'application/octet-stream' = any (select unnest(allowed_mime_types) from storage.buckets where id in ('avatars','resumes','custom-project-uploads')) then raise exception 'octet-stream allowed'; end if;
  if not ((select allowed_mime_types from storage.buckets where id='custom-project-uploads') @> array['application/zip']) then raise exception 'cp mimes'; end if;
  select file_size_limit into n from storage.buckets where id='custom-project-uploads';
  if n is distinct from 15*1024*1024 then raise exception 'cp-uploads size limit %', n; end if;

  -- no policy exposes project-files to anon/public without admin/purchase condition
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
       and cmd in ('SELECT','ALL') and roles && array['public'::name,'anon'::name]
       and coalesce(qual,'') like '%project-files%' and qual not like '%is_admin%' and qual not like '%purchases%') then
    raise exception 'public exposure policy on project-files remains'; end if;

  -- anon: nothing
  perform test_as(null, 'anon'); select count(*) into n from storage.objects where bucket_id='project-files';
  if n<>0 then raise exception 'anon sees % project files', n; end if; perform test_reset();
  -- non-purchaser (pending purchase): nothing
  perform test_as(other); select count(*) into n from storage.objects where bucket_id='project-files';
  if n<>0 then raise exception 'non-purchaser sees files'; end if; perform test_reset();
  -- purchaser: sees
  perform test_as(buyer); select count(*) into n from storage.objects where bucket_id='project-files';
  if n<>1 then raise exception 'purchaser cannot read (% rows)', n; end if;
  -- purchaser cannot write
  begin insert into storage.objects(bucket_id,name) values ('project-files','proj-1/x.zip'); raise exception 'purchaser uploaded';
  exception when insufficient_privilege or check_violation then null; end;
  perform test_reset();
  -- admin: read + write
  perform test_as(adm); select count(*) into n from storage.objects where bucket_id='project-files';
  if n<>1 then raise exception 'admin cannot read'; end if;
  insert into storage.objects(bucket_id,name) values ('project-files','proj-1/doc.pdf'); perform test_reset();

  -- project_files table rows hidden from anon
  insert into public.project_files(id,project_id,label,file_name,storage_path) values ('pf1','proj-1','Source','s.zip','proj-1/s.zip');
  perform test_as(null,'anon'); select count(*) into n from public.project_files; if n<>0 then raise exception 'anon reads project_files'; end if; perform test_reset();

  -- avatars: no listing of other users' objects; owner still sees own; anon sees none via API
  perform test_as(buyer); select count(*) into n from storage.objects where bucket_id='avatars';
  if n<>1 then raise exception 'avatar owner should see exactly own object, got %', n; end if; perform test_reset();
  perform test_as(null,'anon'); select count(*) into n from storage.objects where bucket_id='avatars';
  if n<>0 then raise exception 'anon lists avatars'; end if; perform test_reset();
  -- owner may still upload to own folder, not to another's
  perform test_as(buyer); insert into storage.objects(bucket_id,name) values ('avatars', buyer::text||'/new.jpg');
  begin insert into storage.objects(bucket_id,name) values ('avatars', other::text||'/evil.jpg'); raise exception 'cross-folder upload';
  exception when insufficient_privilege or check_violation then null; end;
  perform test_reset();
end $$;

-- Regression: simulate a project where 0100 was never applied (public bucket + public read), re-run 0117.
update storage.buckets set public = true where id='project-files';
create policy "project_files_public_read" on storage.objects for select using (bucket_id = 'project-files');
update public.project_files set id = id; -- no-op
\ir ../../migrations/0117_project_files_private_check.sql
do $$
declare n int;
begin
  if (select public from storage.buckets where id='project-files') then raise exception 'bucket still public after 0117'; end if;
  if exists (select 1 from pg_policies where policyname='project_files_public_read') then raise exception 'public policy not dropped'; end if;
  perform test_as(null,'anon'); select count(*) into n from storage.objects where bucket_id='project-files';
  if n<>0 then raise exception 'anon sees files after 0117 re-run'; end if; perform test_reset();
end $$;

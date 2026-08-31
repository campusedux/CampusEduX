-- Storage buckets the mobile app writes to but that no migration created:
--   avatars  -> src/services/profile.service.ts  uploadAvatar()
--   resumes  -> src/services/job.service.ts      uploadResume()
-- (project-files / project-media / resume-templates / site are created by the
--  admin migrations 003 / 006 / 009.)
--
-- Without this, every avatar / resume upload fails with "Bucket not found".
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

-- avatars: public read (shown in the drawer / profile everywhere); each user
-- may only write inside their own "<uid>/..." folder.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- resumes: PRIVATE. The app now reads them back via a long-lived signed URL
-- (job.service.uploadResume), so they are never world-readable.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Policies on storage.objects. `(storage.foldername(name))[1]` is the first
-- path segment, which both upload paths set to the user's id.
-- ---------------------------------------------------------------------------

-- avatars ------------------------------------------------------------------
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- resumes ----------------------------------------------------------------
drop policy if exists "resumes_owner_all" on storage.objects;
create policy "resumes_owner_all"
  on storage.objects for all to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admins (job-application review in the admin panel) may read any resume.
-- Guarded: is_admin() only exists once the admin migrations are applied.
do $$
begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "resumes_admin_read" on storage.objects;
    create policy "resumes_admin_read"
      on storage.objects for select
      using (bucket_id = 'resumes' and public.is_admin(auth.uid()));
  end if;
end $$;

-- Keep the object path so a fresh signed URL can be minted when one expires.
alter table public.resumes
  add column if not exists storage_path text;

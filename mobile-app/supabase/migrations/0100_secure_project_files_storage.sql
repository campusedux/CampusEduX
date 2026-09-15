-- mobile-app/supabase/migrations/0100_secure_project_files_storage.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/072_secure_project_files_storage.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- SEC-003: paid project files were downloadable by anyone, unauthenticated
-- ============================================================================
-- Found by the RLS audit. Two compounding holes:
--   1. The `project-files` Storage bucket was created `public: true` (003
--      admin migration), so any object in it is servable straight from
--      /storage/v1/object/public/project-files/... with NO auth check at
--      all — Storage's public-bucket fast path bypasses RLS entirely.
--   2. public.project_files / public.project_versions (0008) had a plain
--      `using (true)` SELECT policy, so the exact `storage_path` for a
--      project's source-code.zip / documentation.pdf was readable via
--      GET /rest/v1/project_files by anyone too, no purchase required.
--
-- Together: a signed-out client could list every paid project's file path
-- and download the file directly, for free. The purchases-based paywall was
-- never consulted at the storage layer.
--
-- Fix — mirror the pattern public.custom_project_delivery_assets /
-- 'custom-project-deliveries' (0033) already uses correctly:
--   * flip the bucket private
--   * gate storage.objects reads on "has a successful purchase of the
--     project whose id is the first path segment" (upload paths are always
--     `${projectId}/...`, set by the admin panel's UploadDropzone)
--   * gate the project_files / project_versions table rows the same way
--   * admins keep full access — the table policies check is_admin()
--     directly, and storage.objects already has a separate `for all`
--     is_admin() policy (project_files_admin_write, 003) that covers admin
--     reads, so no second admin clause is needed on the new storage policy.
--
-- 100% additive · guarded · idempotent · re-runnable. Does not touch any
-- other table, bucket, or the dbms_sql tutorial content migrations.
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

-- 1. Bucket: public -> private. Uploads/deletes are unaffected (those go
--    through project_files_admin_write, which never depended on `public`).
update storage.buckets set public = false where id = 'project-files';

-- 2. public.project_files — purchaser (status = 'success') or admin only.
drop policy if exists "project_files_select_public" on public.project_files;
create policy "project_files_select_public"
  on public.project_files for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.purchases p
      where p.project_id = project_files.project_id
        and p.user_id = auth.uid()
        and p.status = 'success'
    )
  );

-- 3. public.project_versions — same rule (version history / changelog is
--    part of what a buyer gets, same as the files themselves).
drop policy if exists "project_versions_select_public" on public.project_versions;
create policy "project_versions_select_public"
  on public.project_versions for select
  using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.purchases p
      where p.project_id = project_versions.project_id
        and p.user_id = auth.uid()
        and p.status = 'success'
    )
  );

-- 4. storage.objects — purchaser read on the now-private bucket. Admin read
--    is already granted by project_files_admin_write (003); this policy only
--    needs to add the purchaser case. Path convention: `${projectId}/...`
--    (see admin ProjectFileManager's UploadDropzone pathPrefix).
drop policy if exists "project_files_purchaser_read" on storage.objects;
create policy "project_files_purchaser_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.purchases p
      where p.project_id = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
        and p.status = 'success'
    )
  );

notify pgrst, 'reload schema';

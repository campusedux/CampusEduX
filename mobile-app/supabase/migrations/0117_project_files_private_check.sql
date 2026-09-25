-- mobile-app/supabase/migrations/0117_project_files_private_check.sql
-- CANONICAL PAIR - byte-identical to admin-panel/supabase/migrations/089_project_files_private_check.sql
-- (apply either; the other is an idempotent no-op).
--
-- ============================================================================
-- DB-22  `project-files` must be PRIVATE with purchaser-only read, independent of
--        whether 0100/072 was applied. Also storage hygiene (DB-22 follow-ups).
-- ============================================================================
-- Audit ids: DB-22 (+ storage hardening for avatars / resumes / custom-project-uploads: limits + MIME allow-lists).
--
-- Chain analysis: A:003 created the bucket PUBLIC; only M:0100 / A:072 flips it private and
-- adds `project_files_purchaser_read`. In the local chain (0100 present) the final state is
-- already correct; this migration makes the outcome independent of apply order / partial applies:
--   1. bucket `project-files` -> public = false
--   2. drop any storage.objects policy that exposes project-files to anon/public without an
--      admin or purchase condition
--   3. (re)create `project_files_purchaser_read` (authenticated, successful purchase, first path
--      segment = project id). Admin access stays via `project_files_admin_write` (A:003) and is
--      re-asserted here if missing.
--   4. project_files / project_versions table SELECT policies re-asserted purchaser-or-admin only
--      (same as 0100; they were `using (true)` before it).
--   5. Bucket limits + MIME allow-lists (owner decision, set UNCONDITIONALLY so all environments end up
--      identical; a re-run just re-asserts the same values). Each bucket has ONE update statement in
--      the exact shape below - the app test suites (website tests/lib/uploadLimits.test.ts, mobile
--      tests/unit/lib/uploadLimits.test.ts) read these numbers/arrays by regexp and fail if the
--      client constants diverge, so keep the shape when editing:
--        avatars                 2 MB   image/jpeg, image/png, image/webp
--        resumes                 5 MB   application/pdf, application/msword, application/vnd...wordprocessingml.document
--        custom-project-uploads 15 MB   png/jpeg/webp, pdf, doc, docx, zip (+ x-zip-compressed, Windows browsers)
--      Storage validates the type of the uploaded BODY (multipart part type for Blob/File, the
--      Content-Type header for ArrayBuffer), NOT the `contentType` upload option when a Blob/File is
--      passed. Hence `application/octet-stream` is deliberately NOT allowed anywhere: the clients now
--      derive the type from the file extension (website src/lib/uploads.ts, mobile src/lib/uploadMime.ts)
--      and send an ArrayBuffer / re-typed Blob, so a real upload never carries octet-stream.
--      Existing objects are untouched (limits apply to new uploads only).
--   6. avatars: the blanket `avatars_public_read` SELECT policy (which allowed LISTING every
--      user's avatar folder through the Storage API) is replaced by an owner-only SELECT policy.
--      Public-bucket object URLs (/storage/v1/object/public/avatars/...) do not consult RLS, so
--      getPublicUrl() links keep working; the owner SELECT also keeps `upload(..., {upsert:true})`
--      working (upsert needs SELECT on the row).
--
-- Idempotent / re-runnable. Hard failure only if the storage schema exists but a control cannot
-- be enforced (nothing to raise here: every step is an UPDATE/DROP/CREATE).
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise notice '0117: storage schema not present - skipped (nothing to secure).';
    return;
  end if;

  -- 1. private bucket
  update storage.buckets set public = false where id = 'project-files' and public is distinct from false;

  -- 2. drop public/anon exposure of project-files that is neither admin- nor purchase-gated
  declare r record;
  begin
    for r in
      select policyname from pg_policies
       where schemaname = 'storage' and tablename = 'objects'
         and cmd in ('SELECT', 'ALL')
         and (roles && array['public'::name, 'anon'::name])
         and coalesce(qual, '') like '%project-files%'
         and coalesce(qual, '') not like '%is_admin%'
         and coalesce(qual, '') not like '%purchases%'
    loop
      execute format('drop policy %I on storage.objects', r.policyname);
      raise notice '0117: dropped public exposure policy %', r.policyname;
    end loop;
  end;
end $$;

do $$
begin
  if to_regclass('storage.objects') is null then return; end if;

  -- 3. admin full access + purchaser read (idempotent re-creates)
  -- (only when no admin policy for this bucket exists: 0119 later splits the blanket policy into
  --  per-command permission policies named project_files_admin_*, which a re-run must not undo)
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                  and policyname like 'project\_files\_admin\_%') then
    create policy "project_files_admin_write" on storage.objects
      for all to authenticated
      using (bucket_id = 'project-files' and public.is_admin(auth.uid()))
      with check (bucket_id = 'project-files' and public.is_admin(auth.uid()));
  end if;

  drop policy if exists "project_files_purchaser_read" on storage.objects;
  create policy "project_files_purchaser_read" on storage.objects
    for select to authenticated
    using (
      bucket_id = 'project-files'
      and exists (
        select 1 from public.purchases p
        where p.project_id = (storage.foldername(name))[1]
          and p.user_id = auth.uid()
          and p.status = 'success'
      )
    );

  -- 5. size limits + MIME allow-lists (see header; keep one statement per bucket, this exact shape)
  update storage.buckets set file_size_limit = 2 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
   where id = 'avatars';
  update storage.buckets set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
   where id = 'resumes';
  update storage.buckets set file_size_limit = 15 * 1024 * 1024,
    allowed_mime_types = array['image/png','image/jpeg','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip','application/x-zip-compressed']
   where id = 'custom-project-uploads';

  -- 6. avatars: no listing for everybody; owner-only SELECT (public URLs unaffected)
  drop policy if exists "avatars_public_read" on storage.objects;
  drop policy if exists "avatars_owner_read" on storage.objects;
  create policy "avatars_owner_read" on storage.objects
    for select to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
end $$;

-- 4. table rows: purchaser-or-admin only (mirrors 0100)
do $$
begin
  if to_regclass('public.project_files') is not null and to_regclass('public.purchases') is not null then
    drop policy if exists "project_files_select_public" on public.project_files;
    create policy "project_files_select_public" on public.project_files for select
      using (
        public.is_admin(auth.uid())
        or exists (select 1 from public.purchases p
                   where p.project_id = project_files.project_id and p.user_id = auth.uid() and p.status = 'success')
      );
  end if;
  if to_regclass('public.project_versions') is not null and to_regclass('public.purchases') is not null then
    drop policy if exists "project_versions_select_public" on public.project_versions;
    create policy "project_versions_select_public" on public.project_versions for select
      using (
        public.is_admin(auth.uid())
        or exists (select 1 from public.purchases p
                   where p.project_id = project_versions.project_id and p.user_id = auth.uid() and p.status = 'success')
      );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- ROLLBACK (manual; only if a legitimate flow breaks - NOT recommended to re-publicise project-files):
--   drop policy if exists "avatars_owner_read" on storage.objects;
--   create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
--   update storage.buckets set file_size_limit = null, allowed_mime_types = null where id in ('avatars','resumes','custom-project-uploads');
--   -- project-files stays private (do not revert; that re-opens paid source code).
-- ----------------------------------------------------------------------------

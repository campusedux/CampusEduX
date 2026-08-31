-- ============================================================================
-- 017_public_catalog.sql — let logged-out (anon) website visitors browse the
--                           full projects / jobs catalog and published notes.
-- ============================================================================
-- Context
--   0035 / 0036 scoped projects.jobs.prep_notes SELECT to the signed-in
--   student's Course + Branch (`content_visible_to_current_user(...)`). For an
--   anonymous caller `current_user_course_id()` / `current_user_branch_id()`
--   are NULL, so the existing `*_select_public` policies expose ONLY
--   `target_type = 'global'` rows — and `prep_notes_select_published` is
--   `TO authenticated`, so anon sees no notes at all.
--
--   The CampusEduX website needs the marketplace and jobs board to be
--   browsable without an account (login is required only for purchase / apply
--   / other protected actions). This migration lets that happen WITHOUT
--   loosening anything for authenticated users.
--
-- What it does — 100% ADDITIVE
--   * adds one permissive SELECT policy per table, scoped `TO anon`:
--       projects_select_anon              USING (true)
--       jobs_select_anon                  USING (true)
--       prep_notes_select_anon            USING (is_published = true)
--   * touches no existing policy. RLS policies for the same command are
--     OR-combined, and the existing `*_select_public` policies are unscoped
--     (role `public` = anon + authenticated) — so:
--       - anon          → new policy grants the full catalog / published notes
--       - authenticated → new `TO anon` policy does not apply; the existing
--         Course/Branch rule (0036) is unchanged; the mobile app and the
--         signed-in website are completely unaffected
--       - admins        → still covered by the separate is_admin policies
--
-- Idempotent · guarded · re-runnable. The canonical copy also lives in
-- mobile-app/supabase/migrations/0041_public_catalog.sql (identical body, both
-- guarded — whichever runs first does the work).
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

do $$
begin
  -- ---- projects -------------------------------------------------------------
  if to_regclass('public.projects') is not null then
    drop policy if exists "projects_select_anon" on public.projects;
    create policy "projects_select_anon" on public.projects
      for select to anon
      using (true);
  end if;

  -- ---- jobs ---------------------------------------------------------------
  if to_regclass('public.jobs') is not null then
    drop policy if exists "jobs_select_anon" on public.jobs;
    create policy "jobs_select_anon" on public.jobs
      for select to anon
      using (true);
  end if;

  -- ---- prep_notes (published only) --------------------------------------
  if to_regclass('public.prep_notes') is not null then
    drop policy if exists "prep_notes_select_anon" on public.prep_notes;
    create policy "prep_notes_select_anon" on public.prep_notes
      for select to anon
      using (is_published = true);
  end if;
end $$;

notify pgrst, 'reload schema';

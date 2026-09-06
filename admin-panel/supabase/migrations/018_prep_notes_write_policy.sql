-- ============================================================================
-- 018_prep_notes_write_policy.sql — restore the admin authoring policy on
--                                   public.prep_notes (Placement Prep → Notes)
-- ============================================================================
-- Apply after 001–017 (SQL Editor / `supabase db push`). Additive · guarded ·
-- idempotent · re-runnable.
--
-- WHY THIS EXISTS
--   public.prep_notes can be created by EITHER migration:
--     * admin  010_notes_admin.sql        — table + SELECT policy + the
--                                            `prep_notes_admin_all` WRITE policy
--     * mobile 0028_preparation_notes.sql — table + SELECT policy ONLY
--                                            ("the admin migration adds the
--                                             is_admin() 'for all' policy")
--   Migrations 015 / 016 / 017 later DROP+RECREATE only the prep_notes SELECT
--   policy; none of them recreates the write policy.
--
--   Result on a database where the mobile 0028 (or a partial 010) ran but admin
--   010 did not: `prep_notes` has RLS enabled and SELECT policies, but NO
--   INSERT / UPDATE / DELETE policy. Every admin-panel write — Add note,
--   Save note, Delete note, the Published toggle — is then refused with:
--
--       new row violates row-level security policy for table "prep_notes"   (42501)
--
--   even though the caller is a valid active admin, because PostgREST denies a
--   write when RLS is on and no permissive policy matches the command.
--
-- WHAT THIS DOES
--   Re-asserts, verbatim from admin 010, the single `prep_notes_admin_all`
--   policy: authenticated active admins (is_admin(auth.uid())) may read AND
--   write every note; everyone else keeps exactly the access the SELECT
--   policies (prep_notes_select_published / prep_notes_select_anon) already
--   grant. Students, anon and non-admins still cannot write.
--
--   If admin 010 DID run, this migration is a harmless no-op (drops and
--   recreates an identical policy).
--
-- Canonical write-policy definition still lives in admin 010_notes_admin.sql;
-- keep the two in sync.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.prep_notes') is null then
    raise notice '018: public.prep_notes not present yet — run admin 010 (or mobile 0028) first; skipping.';
    return;
  end if;

  if to_regprocedure('public.is_admin(uuid)') is null then
    raise exception '018: public.is_admin(uuid) is missing — apply admin 001_admin_core.sql before this migration';
  end if;

  -- RLS is already enabled by 010 / 0028; assert it so this file is safe to run
  -- against any partial state.
  execute 'alter table public.prep_notes enable row level security';

  -- The one authoring policy. `for all` covers INSERT (Add note), UPDATE
  -- (Save note + Published toggle) and DELETE (Delete note). WITH CHECK guards
  -- the NEW row on INSERT/UPDATE; USING guards the existing row on
  -- UPDATE/DELETE/SELECT. Both are `is_admin(auth.uid())` — no ownership column
  -- is required, so a note authored by one admin stays editable by the team.
  drop policy if exists "prep_notes_admin_all" on public.prep_notes;
  create policy "prep_notes_admin_all"
    on public.prep_notes for all
    using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));
end $$;

notify pgrst, 'reload schema';

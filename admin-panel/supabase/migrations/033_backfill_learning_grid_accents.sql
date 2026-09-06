-- ============================================================================
-- admin-panel/supabase/migrations/033_backfill_learning_grid_accents.sql
--   Backfill the Java/Python Tutorial Learning grids: a description for Java
--   (its seed's description never applied because the row already existed),
--   and a topic-tinted accent_color for both (amber for Java, blue for
--   Python) so the website "Notes & resources" cards get a distinct icon
--   badge tint instead of the flat default indigo.
-- ============================================================================
-- Apply anytime after 024/047 (Java seed) and 027/050 (Python seed) — safe to
-- run before them too, it just matches zero rows until the grids exist.
-- Additive · guarded · idempotent · re-runnable. Data-only — no schema / RLS /
-- function changes.
--
-- CANONICAL PAIR — the body below the marker is byte-identical to its twin
--   twin: mobile-app/supabase/migrations/0056_backfill_learning_grid_accents.sql
-- Apply EITHER file once; the other is a guarded no-op.
-- ----------------------------------------------------------------------------

-- ============================================================================
-- BODY (byte-identical in both twins)
-- ============================================================================
-- Every UPDATE below only fills in a column that is still null/empty, so an
-- admin who has since edited a grid's description or accent color from the
-- Admin ▸ Learning UI is never overwritten — same "never clobber an admin
-- edit" rule the seed migrations (024/047, 027/050) already follow.

do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '033/0056: learning_grids not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
end
$guard$;

update public.learning_grids
set description = 'Complete Core Java course — fundamentals, OOP, collections, multithreading, JDBC, JVM internals, best practices, hands-on practice programs and interview preparation.',
    updated_at = now()
where lower(slug) = 'java-tutorial'
  and (description is null or btrim(description) = '');

update public.learning_grids
set accent_color = '#F59E0B', -- warm amber (matches the app's "warning" token)
    updated_at = now()
where lower(slug) = 'java-tutorial'
  and (accent_color is null or btrim(accent_color) = '');

update public.learning_grids
set accent_color = '#2563EB', -- cool blue
    updated_at = now()
where lower(slug) = 'python-tutorial'
  and (accent_color is null or btrim(accent_color) = '');

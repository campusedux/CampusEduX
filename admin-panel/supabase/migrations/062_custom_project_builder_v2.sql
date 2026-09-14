-- ============================================================================
-- 062_custom_project_builder_v2.sql — admin mirror for the website Custom
--   Project Builder rebuild (mobile-app migration 0090).
-- ============================================================================
-- Apply AFTER 013/014 and AFTER mobile 0090. Safe in either order and
-- re-runnable — every statement is guarded with to_regclass(...) and drops
-- before it creates.
--
-- mobile 0090 already:
--   • renames 3 feature rows to customer-friendly copy (no schema change)
--   • adds `conflicts text[]` to custom_project_features
--   • populates a handful of real `dependencies` entries
--   • creates custom_project_ai_requests (owner select+insert RLS)
--
-- This file just GUARANTEES the admin policies exist once is_admin() is
-- present, gives admins read visibility into the new AI-request log (for
-- future support/abuse investigation — no new admin UI ships in this pass),
-- and re-affirms the features-table admin policy so it also covers the new
-- `conflicts` column. No new role_permissions module — everything here stays
-- under the existing 'custom_projects' module.
-- ----------------------------------------------------------------------------

do $$
begin
  -- --- features: re-affirm the 013 admin "for all" policy -------------
  -- Column-less policy, so it already covers the new `conflicts` column;
  -- re-creating it is a harmless no-op that also self-heals a DB where 0090
  -- ran but 013 didn't.
  if to_regclass('public.custom_project_features') is not null then
    execute 'alter table public.custom_project_features enable row level security';
    drop policy if exists "custom_project_features_admin_all" on public.custom_project_features;
    create policy "custom_project_features_admin_all" on public.custom_project_features
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;

  -- --- custom_project_ai_requests: admin read-only visibility ---------
  if to_regclass('public.custom_project_ai_requests') is not null and to_regprocedure('public.is_admin(uuid)') is not null then
    execute 'alter table public.custom_project_ai_requests enable row level security';
    drop policy if exists "custom_project_ai_requests_admin_select" on public.custom_project_ai_requests;
    create policy "custom_project_ai_requests_admin_select" on public.custom_project_ai_requests
      for select using (public.is_admin(auth.uid()));
  end if;
end $$;

notify pgrst, 'reload schema';

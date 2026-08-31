-- ============================================================================
-- 014_custom_feature_catalog.sql — admin write access for the advanced
--   Feature Catalog (categories vocabulary + feature-table policy re-affirm).
-- ============================================================================
-- Apply AFTER 013 and AFTER mobile 0034. Safe in either order and re-runnable —
-- every statement is guarded with to_regclass(...) and drops before it creates.
--
-- mobile 0034 already:
--   • adds level / icon / image_url / dependencies to custom_project_features
--   • creates custom_project_feature_categories (+ world-read, + a guarded
--     is_admin() write policy)
--
-- This file just GUARANTEES the admin policies exist once is_admin() is
-- present (mobile 0034 may have run before the admin migrations did), and
-- re-affirms the feature-table admin policy from 013 so it also covers the
-- new columns. No new role_permissions module — the Feature Catalog stays
-- under the existing 'custom_projects' module.
-- ----------------------------------------------------------------------------

do $$
begin
  -- --- managed category vocabulary: admin full CRUD -------------------
  if to_regclass('public.custom_project_feature_categories') is not null then
    execute 'alter table public.custom_project_feature_categories enable row level security';

    drop policy if exists "cpfc_select_public" on public.custom_project_feature_categories;
    create policy "cpfc_select_public" on public.custom_project_feature_categories
      for select using (true);

    drop policy if exists "cpfc_admin_all" on public.custom_project_feature_categories;
    create policy "cpfc_admin_all" on public.custom_project_feature_categories
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;

  -- --- features: re-affirm the 013 admin "for all" policy -----------
  -- Column-less policy, so it already covers level / icon / image_url /
  -- dependencies; re-creating it is a harmless no-op that also self-heals a
  -- DB where 0034 ran but 013 didn't.
  if to_regclass('public.custom_project_features') is not null then
    execute 'alter table public.custom_project_features enable row level security';
    drop policy if exists "custom_project_features_admin_all" on public.custom_project_features;
    create policy "custom_project_features_admin_all" on public.custom_project_features
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

notify pgrst, 'reload schema';

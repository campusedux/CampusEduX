-- Admin pricing writes were invisible to RLS: 0033 supplied public SELECT,
-- while admin 013 ran before the table existed in the ordered local chain.
-- Use the current permission matrix rather than an is_admin-only write rule.
drop policy if exists cpp_admin_update on public.custom_project_pricing;
create policy cpp_admin_update on public.custom_project_pricing
  for update to authenticated
  using (public.has_permission(auth.uid(), 'custom_projects', 'edit'))
  with check (public.has_permission(auth.uid(), 'custom_projects', 'edit'));
revoke update on public.custom_project_pricing from anon;

-- 0147's trigger functions inherited client EXECUTE grants. The triggers stay
-- installed; only direct client EXECUTE privilege is removed.
revoke all on function public.custom_project_academic_scope_guard() from public, anon, authenticated;
revoke all on function public.custom_project_mentoring_feature_guard() from public, anon, authenticated;
revoke all on function public.custom_project_mentoring_addon_guard() from public, anon, authenticated;
revoke all on function public.custom_project_mentoring_delivery_record_guard() from public, anon, authenticated;
revoke all on function public.custom_project_mentoring_delivery_guard() from public, anon, authenticated;
revoke all on function public.sync_custom_project_catalog_token() from public, anon, authenticated;

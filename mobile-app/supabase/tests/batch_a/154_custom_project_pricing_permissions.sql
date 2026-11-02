-- Pricing writes require the admin permission matrix; trigger functions are not callable by clients.
\set ON_ERROR_STOP on
do $$
declare
  fn text;
begin
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='custom_project_pricing' and policyname='cpp_admin_update' and cmd='UPDATE') then
    raise exception 'FAIL admin pricing update policy missing';
  end if;
  foreach fn in array array[
    'public.custom_project_academic_scope_guard()',
    'public.custom_project_mentoring_feature_guard()',
    'public.custom_project_mentoring_addon_guard()',
    'public.custom_project_mentoring_delivery_record_guard()',
    'public.custom_project_mentoring_delivery_guard()',
    'public.sync_custom_project_catalog_token()'
  ] loop
    if has_function_privilege('anon', fn, 'execute')
       or has_function_privilege('authenticated', fn, 'execute') then
      raise exception 'FAIL client EXECUTE on %', fn;
    end if;
  end loop;
end $$;

-- 0116: default "Included" features per project type + level.
-- Only touches rows whose included_in_levels is still empty, so later admin
-- edits are never overwritten. Requires 0115.

do $$
begin
  if to_regclass('public.custom_project_features') is null
     or not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'custom_project_features'
                      and column_name = 'included_in_levels') then
    raise notice '0116: included_in_levels not present — run 0115 first; skipping.';
    return;
  end if;

  update public.custom_project_features f
     set included_in_levels = s.levels
    from (values
      ('auth-email-password',   array['academic:standard','academic:advanced','personal:standard','personal:advanced','business:standard','business:advanced']),
      ('user-profile',          array['academic:standard','academic:advanced','personal:standard','personal:advanced','business:standard','business:advanced']),
      ('media-image-upload',    array['academic:standard','academic:advanced','personal:standard','personal:advanced','business:standard','business:advanced']),
      ('search-basic',          array['academic:standard','academic:advanced','personal:standard','personal:advanced','business:standard','business:advanced']),
      ('search-filters',        array['academic:advanced','personal:standard','personal:advanced','business:standard','business:advanced']),
      ('notif-inapp',           array['academic:advanced','personal:standard','personal:advanced','business:standard','business:advanced']),
      ('doc-documentation',     array['academic:advanced']),
      ('notif-email',           array['personal:advanced','business:standard','business:advanced']),
      ('media-multi-image',     array['personal:advanced','business:advanced']),
      ('admin-dashboard-basic', array['personal:advanced','business:advanced']),
      ('user-management',       array['business:standard','business:advanced']),
      ('sec-role-access',       array['business:advanced']),
      ('analytics-dashboard',   array['business:advanced'])
    ) as s(id, levels)
   where f.id = s.id
     and f.included_in_levels = '{}'::text[];
end $$;

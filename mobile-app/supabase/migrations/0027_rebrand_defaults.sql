-- Rebrand: ProjectHub -> CampusEduX for values baked into the database as
-- column defaults / seed rows by earlier migrations.
--
--   0003_projects.sql        projects.developer_name default 'ProjectHub Studio'
--   admin 009_settings_admin settings.site_name       default 'ProjectHub'
--
-- Historical migrations are left untouched; this migration carries the rename
-- forward for both the default and any rows still holding the old value.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

do $$
begin
  if to_regclass('public.projects') is not null then
    alter table public.projects
      alter column developer_name set default 'CampusEduX Studio';
    update public.projects
       set developer_name = 'CampusEduX Studio'
     where developer_name = 'ProjectHub Studio';
  end if;

  if to_regclass('public.settings') is not null then
    begin
      alter table public.settings
        alter column site_name set default 'CampusEduX';
      update public.settings
         set site_name = 'CampusEduX'
       where site_name = 'ProjectHub';
    exception when undefined_column then
      -- settings has no site_name column in this deployment; nothing to do.
      null;
    end;
  end if;
end $$;

notify pgrst, 'reload schema';

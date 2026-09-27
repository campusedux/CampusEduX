-- mobile-app/supabase/migrations/0129_min_supported_app_version.sql
-- CANONICAL PAIR - byte-identical to admin-panel/supabase/migrations/100_min_supported_app_version.sql
-- (apply either; the other is an idempotent no-op).
--
-- Force-update floor for the mobile app. site_settings (admin 009) is the single-row, publicly readable
-- settings table the admin panel already edits (UPDATE is permission-gated, settings:edit, since 0119/091).
-- The app compares its own version (app.json "version") with this value on start and blocks with an
-- "Update required" screen linking to the Play Store when it is lower. Default '0.0.0' = never blocks.
-- 100% additive; no existing column, row or policy is changed.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.site_settings') is null then
    raise exception '0129 prerequisite missing: public.site_settings (admin 009_settings_admin.sql)';
  end if;
end $$;

alter table public.site_settings
  add column if not exists min_supported_app_version text not null default '0.0.0';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'site_settings_min_supported_app_version_format') then
    alter table public.site_settings
      add constraint site_settings_min_supported_app_version_format
      check (min_supported_app_version ~ '^[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}$');
  end if;
end $$;

notify pgrst, 'reload schema';

-- 0115: "Included" features for the Custom Project Builder.
--
-- A feature can be INCLUDED (free, read-only, never charged) for specific
-- "<project_type>:<project_level>" combos, e.g. {academic:standard,academic:advanced}.
-- Everything else stays a paid add-on. The request snapshot gains an
-- is_included flag so the admin panel can show what the customer gets in full.
-- Additive + idempotent; no existing policy or column changes.

do $$
begin
  if to_regclass('public.custom_project_features') is null then
    raise notice '0115: custom_project_features not present yet — run 0033/0034 first; skipping.';
    return;
  end if;

  alter table public.custom_project_features
    add column if not exists included_in_levels text[] not null default '{}'::text[];

  if not exists (
    select 1 from pg_constraint
    where conname = 'custom_project_features_included_in_levels_chk'
  ) then
    alter table public.custom_project_features
      add constraint custom_project_features_included_in_levels_chk
      check (included_in_levels <@ array[
        'academic:standard','academic:advanced',
        'personal:standard','personal:advanced',
        'business:standard','business:advanced'
      ]::text[]);
  end if;

  -- Advanced must never include less than Standard: a feature included for
  -- "<type>:standard" must also be included for "<type>:advanced".
  if not exists (
    select 1 from pg_constraint
    where conname = 'custom_project_features_included_standard_in_advanced_chk'
  ) then
    alter table public.custom_project_features
      add constraint custom_project_features_included_standard_in_advanced_chk
      check (
        (not ('academic:standard' = any(included_in_levels)) or 'academic:advanced' = any(included_in_levels))
        and (not ('personal:standard' = any(included_in_levels)) or 'personal:advanced' = any(included_in_levels))
        and (not ('business:standard' = any(included_in_levels)) or 'business:advanced' = any(included_in_levels))
      );
  end if;

  comment on column public.custom_project_features.included_in_levels is
    'Included (free, read-only) for these "<project_type>:<project_level>" combos. Never charged.';
end $$;

do $$
begin
  if to_regclass('public.custom_project_request_features') is null then
    raise notice '0115: custom_project_request_features not present yet — skipping is_included.';
    return;
  end if;

  alter table public.custom_project_request_features
    add column if not exists is_included boolean not null default false;

  comment on column public.custom_project_request_features.is_included is
    'True when the feature came with the project (price 0), false for a paid add-on.';
end $$;

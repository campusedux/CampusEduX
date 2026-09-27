-- mobile-app/supabase/migrations/0125_custom_project_delivery_gate.sql
-- CANONICAL PAIR - byte-identical to admin-panel/supabase/migrations/097_custom_project_delivery_gate.sql
-- (apply either; the other is an idempotent no-op).
--
-- Bug 4 (delivery): the admin's delivery upload page and the "mark status Delivered" control were
-- two disconnected steps, and custom_project_set_status() enforced NOTHING about their being paired
-- — it would happily set status='delivered' with no custom_project_deliveries row at all, or with a
-- row that has neither a demo_url nor any asset. RLS then correctly shows the student nothing (a
-- "Delivered" badge over an empty page), which is the actual bug the owner reported.
--
-- 1. custom_project_delivery_assets.kind gets 'pdf' and 'ppt' (existing rows/kinds untouched;
--    'screenshot'/'apk'/'source_code'/'documentation'/'demo'/'other' are all still valid).
-- 2. custom_project_set_status() is replaced with its CURRENT (post-0119/091) body — including the
--    require_permission('custom_projects','edit') guard 0119 added — plus one new check: transitioning
--    to 'delivered' now requires the request's custom_project_deliveries row to have a non-null
--    demo_url OR at least one custom_project_delivery_assets row. This is enforced HERE — the
--    trusted boundary — so it holds regardless of which UI or caller invokes the RPC, not only the
--    admin panel's new "Save & Deliver" button. (The local test harness's run_dba.sh rebuilds
--    cx_tpl_dbA by re-applying 0117-0119/089-091 on top of the full chain for THOSE migrations' own
--    tests; since 0119 fully redefines this same function, that rebuild step re-clobbers whatever
--    this migration adds — a harness-only artifact, never a production one, since production applies
--    migrations exactly once in order and 0119 is already live. batch_a/126 runs its assertions
--    against a plain full-chain database for that reason, not through run_dba.sh's dbA rebuild.)
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.custom_project_delivery_assets') is null
     or to_regprocedure('public.custom_project_set_status(uuid,text,text)') is null
     or to_regprocedure('public.require_permission(text,text)') is null then
    raise exception '0125 prerequisite missing: custom_project_delivery_assets (0033), custom_project_set_status (013) and require_permission (0119/091) must be applied first';
  end if;
end $$;

-- ---- 0. storage-layer size ceiling (the trusted boundary; app-level checks are UX only) -----------
-- The largest approved deliverable is a 100MB source-code ZIP; PDF/PPT are capped at 25MB each by the
-- app layer (addDeliveryAssets), since a single Supabase bucket has only one file_size_limit. This
-- only RAISES or explicitly documents the ceiling — never narrows anything already working. NOTE for
-- the owner: Supabase's default per-file cap (varies by plan/dashboard "Global file size limit") may
-- be lower than 100MB; if the project-level default is below this bucket-level value, the smaller of
-- the two applies, so also raise the project's global setting under Storage settings if needed.
update storage.buckets set file_size_limit = 100 * 1024 * 1024 where id = 'custom-project-deliveries';

-- ---- 1. widen the asset kind check --------------------------------------
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.custom_project_delivery_assets'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%kind%' and pg_get_constraintdef(oid) not ilike '%''pdf''%'
  loop
    execute format('alter table public.custom_project_delivery_assets drop constraint %I', c);
  end loop;
  if not exists (select 1 from pg_constraint where conname = 'custom_project_delivery_assets_kind_check2') then
    alter table public.custom_project_delivery_assets
      add constraint custom_project_delivery_assets_kind_check2
      check (kind in ('screenshot', 'apk', 'source_code', 'documentation', 'demo', 'pdf', 'ppt', 'other'));
  end if;
end $$;

-- ---- 2. the delivery gate, folded into custom_project_set_status() -------
create or replace function public.custom_project_set_status(
  p_request_id uuid,
  p_new_status text,
  p_note       text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_old text;
  v_has_deliverable boolean;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'custom_project_set_status: caller is not an active admin';
  end if;

  -- DB-07 / ADM-01 (0119/091): role + permission-matrix guard — carried over unchanged.
  perform public.require_permission('custom_projects', 'edit');
  if p_new_status not in ('new', 'in_development', 'testing', 'ready', 'delivered', 'cancelled') then
    raise exception 'custom_project_set_status: invalid status %', p_new_status;
  end if;

  select status into v_old from public.custom_project_requests where id = p_request_id for update;
  if not found then raise exception 'custom project request not found'; end if;

  if p_new_status = 'delivered' and v_old is distinct from 'delivered' then
    select (d.demo_url is not null) or exists (
             select 1 from public.custom_project_delivery_assets a where a.delivery_id = d.id
           )
      into v_has_deliverable
      from public.custom_project_deliveries d
     where d.request_id = p_request_id;
    if not coalesce(v_has_deliverable, false) then
      raise exception 'Add a demo URL or at least one file before marking this request Delivered.';
    end if;
  end if;

  if v_old is distinct from p_new_status then
    update public.custom_project_requests set status = p_new_status where id = p_request_id;

    insert into public.custom_project_request_history
      (request_id, old_status, new_status, changed_by, changed_by_role, note)
    values
      (p_request_id, v_old, p_new_status, auth.uid(), 'admin', nullif(p_note, ''));

    if p_new_status = 'delivered' then
      update public.custom_project_deliveries
         set delivered_at = coalesce(delivered_at, now())
       where request_id = p_request_id;
    end if;
  elsif nullif(p_note, '') is not null then
    -- status unchanged but a note was supplied — still record it
    insert into public.custom_project_request_history
      (request_id, old_status, new_status, changed_by, changed_by_role, note)
    values
      (p_request_id, v_old, p_new_status, auth.uid(), 'admin', p_note);
  end if;
end;
$$;

revoke all on function public.custom_project_set_status(uuid, text, text) from public, anon;
grant execute on function public.custom_project_set_status(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';

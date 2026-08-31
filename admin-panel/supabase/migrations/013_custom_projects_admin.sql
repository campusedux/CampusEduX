-- ============================================================================
-- 013_custom_projects_admin.sql — Custom Project Builder: admin access
-- ============================================================================
-- Apply AFTER 001–012 and AFTER the mobile migration
-- mobile-app/supabase/migrations/0033_custom_project_builder.sql (which creates
-- every custom_project_* table + the student RLS + the storage buckets).
--
-- Adds, all guarded with to_regclass(...) so it is safe to run before or after
-- 0033 and safe to re-run:
--   • an is_admin() "for all" policy on every custom_project_* table
--   • custom_project_requests.admin_notes  (private; the mobile app never reads it)
--   • custom_project_set_status()  — status change + history row, transactionally
--   • the storage admin policies (is_admin() is guaranteed to exist by now)
--   • the role_permissions seed for the new 'custom_projects' module
--     (keep in sync with admin-panel/src/lib/permissions.ts)
-- ----------------------------------------------------------------------------

-- --- admin_notes column --------------------------------------------------
do $$ begin
  if to_regclass('public.custom_project_requests') is not null then
    alter table public.custom_project_requests add column if not exists admin_notes text;
  end if;
end $$;

-- --- bulk admin "for all" policy on every custom_project_* table --------
do $$
declare
  t text;
  tables text[] := array[
    'custom_project_pricing',
    'custom_project_platform_pricing',
    'custom_project_features',
    'custom_project_requests',
    'custom_project_request_features',
    'custom_project_request_files',
    'custom_project_payments',
    'custom_project_request_history',
    'custom_project_deliveries',
    'custom_project_delivery_assets',
    'custom_project_messages',
    'custom_project_drafts',
    'custom_project_admin_inbox'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
      execute format(
        'create policy %I on public.%I for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))',
        t || '_admin_all', t
      );
    end if;
  end loop;
end $$;

-- --- status change + history, in one call -------------------------------
-- Mirrors admin_process_refund (007): re-checks is_admin(), stamps the history
-- row's changed_by itself so the trail can't be forged. plpgsql bodies are
-- resolved lazily, so this creates cleanly even if 0033 has not run yet.
create or replace function public.custom_project_set_status(
  p_request_id uuid,
  p_new_status text,
  p_note       text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_old text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'custom_project_set_status: caller is not an active admin';
  end if;
  if p_new_status not in ('new', 'in_development', 'testing', 'ready', 'delivered', 'cancelled') then
    raise exception 'custom_project_set_status: invalid status %', p_new_status;
  end if;

  select status into v_old from public.custom_project_requests where id = p_request_id for update;
  if not found then raise exception 'custom project request not found'; end if;

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

-- --- storage admin policies --------------------------------------------
drop policy if exists "cp_uploads_admin_read" on storage.objects;
create policy "cp_uploads_admin_read" on storage.objects for select
  using (bucket_id = 'custom-project-uploads' and public.is_admin(auth.uid()));

drop policy if exists "cp_deliveries_admin_all" on storage.objects;
create policy "cp_deliveries_admin_all" on storage.objects for all
  using (bucket_id = 'custom-project-deliveries' and public.is_admin(auth.uid()))
  with check (bucket_id = 'custom-project-deliveries' and public.is_admin(auth.uid()));

-- --- role_permissions seed for the 'custom_projects' module ------------
-- Keep in sync with admin-panel/src/lib/permissions.ts DEFAULT_PERMISSIONS.
-- on conflict do nothing so a super_admin's later edits are never clobbered.
insert into public.role_permissions (role, module, can_view, can_add, can_edit, can_delete) values
  ('super_admin', 'custom_projects', true,  true,  true,  true),
  ('admin',       'custom_projects', true,  true,  true,  true),
  ('editor',      'custom_projects', true,  true,  true,  false),
  ('support',     'custom_projects', true,  false, true,  false),
  ('viewer',      'custom_projects', true,  false, false, false)
on conflict (role, module) do nothing;

notify pgrst, 'reload schema';

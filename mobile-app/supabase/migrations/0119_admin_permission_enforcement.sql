-- mobile-app/supabase/migrations/0119_admin_permission_enforcement.sql
-- CANONICAL PAIR - byte-identical to admin-panel/supabase/migrations/091_admin_permission_enforcement.sql
-- (apply either; the other is an idempotent no-op).
--
-- ============================================================================
-- DB-07 / ADM-01  Enforce the admin role matrix (role_permissions) in the database.
-- DB-26           is_admin(uuid) / has_permission(...) no longer usable as a role oracle.
-- DB-27           search_path on 3 invoker functions.
-- DB-28           explicit revoke from anon on admin RPCs / trigger functions.
-- ============================================================================
--
-- BEFORE: every `*_admin_all` policy was `FOR ALL USING (is_admin())`, so any active admin_users row
-- (even `viewer`) could write every table and call every admin RPC through PostgREST.
-- AFTER : SELECT stays `is_admin()` (any active admin may read; the panel hides what a role may not
-- view). INSERT / UPDATE / DELETE require has_permission(auth.uid(), <module>, add|edit|delete).
-- super_admin ALWAYS passes: has_permission() returns true for an active super_admin before it looks
-- at role_permissions (A:001), so the owner cannot be locked out by a missing/edited matrix row.
--
-- TABLE -> MODULE MAP (derived from admin-panel/src/app/(panel)/*/actions.ts; module names = MODULES in
-- admin-panel/src/lib/permissions.ts; a list means "any of"):
--   settings        academic_years, courses, branches, site_settings
--   cms             announcements, banners, cms_pages, faqs, push_notifications
--   jobs            application_stages, applications, companies, jobs, recruiters
--   learning        aptitude_topics, coding_submissions, dsa_problems, dsa_topics, hr_questions,
--                   interview_categories, interview_questions, interview_topics, learning_contents,
--                   learning_grid_companies, learning_grids, learning_sections, learning_topics, prep_notes
--   learning|placement   live_tests, practice_tests, test_questions   (both modules edit them)
--   resume          ats_rules, resume_ai_prompts, resume_share_reports, resume_shares,
--                   resume_template_categories, resume_templates
--   blog            blog_categories, blog_posts
--   projects        categories, project_files, project_images, project_versions, projects, technologies
--   reviews|projects     reviews          (projects module deletes reviews too)
--   reviews         review_reports, testimonials
--   orders          coupons, offers, refund_requests (UPDATE policy)
--   referrals       reward_settings, withdrawal_requests (UPDATE policy)
--   custom_projects custom_project_feature_categories, custom_project_features
--   students        profiles (INSERT/UPDATE admin policies)
--   reports         generated_reports          backup   backups
--   NOT CHANGED: admin_users / role_permissions (super_admin only), admin_notifications, admin_activity_logs
--   (any active admin), storage bucket `admin-media` (generic uploader used by every module).
-- Storage (admin write policies on storage.objects): bucket -> module:
--   project-files, project-media -> projects | banners, site -> cms | resume-templates -> resume |
--   learning-files -> learning | custom-project-deliveries -> custom_projects.
--   INSERT needs add OR edit, UPDATE needs edit, DELETE needs delete OR edit (uploader replace/remove flows).
--
-- HOW: the DO block below reads pg_policies and rewrites every policy whose only admin condition is
-- `is_admin(auth.uid())`: FOR ALL policies are split into <base>_select / _insert / _update / _delete
-- (<base> = policy name minus a trailing `_all`), single-command policies are rewritten in place.
-- Expressions are wrapped `(select public.has_permission(...))` so they are evaluated once per statement.
-- Tables not in the map raise a WARNING (left untouched). Re-runs are no-ops (no is_admin-only write
-- policies remain). Policies created by later migrations must be added to the map.
--
-- RPC GUARDS (guard line inserted after the existing is_admin() check, bodies otherwise verbatim):
--   admin_adjust_wallet(...)        require_admin_role(super_admin|admin) + referrals:edit
--   admin_process_refund(...)       require_admin_role(super_admin|admin) + orders:edit
--   admin_process_withdrawal(...)   require_admin_role(super_admin|admin) + referrals:edit
--   send_bulk_notification(...)     require_admin_role(super_admin|admin) + cms:add
--   custom_project_set_status(...)  require_permission(custom_projects, edit)
--   (log_admin_activity: any admin; academic_usage: read-only, any admin)
--   NOTE: the seeded `support` role holds orders:edit / referrals:edit (wallet desk) - it is now DENIED
--   the money RPCs by the super_admin|admin role guard. Owner decision (see report).
--
-- DB-26 approach: revoking anon EXECUTE from is_admin() would break anonymous reads (RLS policies on
-- public tables evaluate is_admin(auth.uid()) as the calling role). Instead is_admin(uid) /
-- has_permission(uid,..) return false for any uid other than the caller's own (auth.uid()) unless the
-- caller is a trusted DB role, which removes the oracle; has_permission() is additionally revoked from
-- anon (only used by write policies / the admin panel). is_admin(uuid) keeps its grants.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regprocedure('public.has_permission(uuid,text,text)') is null
     or to_regprocedure('public.is_admin(uuid)') is null
     or to_regclass('public.role_permissions') is null then
    raise exception '0119 prerequisite missing: admin 001_admin_core must be applied first';
  end if;
end $$;

-- ---- helpers ---------------------------------------------------------------------------------
create or replace function public._is_privileged_caller()
returns boolean language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('role', true), ''), 'none')
         in ('none', 'postgres', 'supabase_admin', 'service_role');
$$;
revoke all on function public._is_privileged_caller() from public, anon, authenticated;

-- DB-26: same semantics as A:001 for the caller's own uid; other uids only for trusted DB roles.
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
     where id = uid and status = 'active'
       and (uid is not distinct from auth.uid() or public._is_privileged_caller())
  );
$$;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

create or replace function public.has_permission(p_user_id uuid, p_module text, p_action text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when not (p_user_id is not distinct from auth.uid() or public._is_privileged_caller()) then false
    when (select role from public.admin_users where id = p_user_id and status = 'active') = 'super_admin'
      then true
    else coalesce((
      select case p_action
        when 'view'   then rp.can_view
        when 'add'    then rp.can_add
        when 'edit'   then rp.can_edit
        when 'delete' then rp.can_delete
        else false
      end
      from public.role_permissions rp
      join public.admin_users au on au.role = rp.role
      where au.id = p_user_id and au.status = 'active' and rp.module = p_module
    ), false)
  end;
$$;
revoke all on function public.has_permission(uuid, text, text) from public, anon;
grant execute on function public.has_permission(uuid, text, text) to authenticated, service_role;

-- Raise 42501 unless the caller is an active admin whose role is in p_roles and (optionally) the
-- role_permissions matrix grants p_module:p_action (super_admin always passes the matrix).
create or replace function public.require_admin_role(p_roles text[], p_module text default null, p_action text default null)
returns void language plpgsql stable security definer set search_path = public as $$
declare
  v_role text := public.current_admin_role();
begin
  if v_role is null or not (v_role = any (p_roles)) then
    raise exception 'insufficient_privilege: requires admin role %', array_to_string(p_roles, ' or ')
      using errcode = '42501';
  end if;
  if p_module is not null
     and not coalesce(public.has_permission(auth.uid(), p_module, coalesce(p_action, 'edit')), false) then
    raise exception 'insufficient_privilege: role % may not % in %', v_role, coalesce(p_action, 'edit'), p_module
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.require_admin_role(text[], text, text) from public, anon;
grant execute on function public.require_admin_role(text[], text, text) to authenticated, service_role;

create or replace function public.require_permission(p_module text, p_action text)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not coalesce(public.has_permission(auth.uid(), p_module, p_action), false) then
    raise exception 'insufficient_privilege: no % permission in %', p_action, p_module
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.require_permission(text, text) from public, anon;
grant execute on function public.require_permission(text, text) to authenticated, service_role;

-- ---- policy rewrite ----------------------------------------------------------------------------
do $$
declare
  r        record;
  v_mods   text[];
  v_map jsonb := '{
    "academic_years":["settings"], "courses":["settings"], "branches":["settings"],
    "site_settings":["settings"], "announcements":["cms"], "banners":["cms"],
    "cms_pages":["cms"], "faqs":["cms"], "push_notifications":["cms"],
    "application_stages":["jobs"], "applications":["jobs"], "companies":["jobs"],
    "jobs":["jobs"], "recruiters":["jobs"], "aptitude_topics":["learning"],
    "coding_submissions":["learning"], "dsa_problems":["learning"], "dsa_topics":["learning"],
    "hr_questions":["learning"], "interview_categories":["learning"], "interview_questions":["learning"],
    "interview_topics":["learning"], "learning_contents":["learning"], "learning_grid_companies":["learning"],
    "learning_grids":["learning"], "learning_sections":["learning"], "learning_topics":["learning"],
    "prep_notes":["learning"], "live_tests":["learning","placement"], "practice_tests":["learning","placement"],
    "test_questions":["learning","placement"], "ats_rules":["resume"], "resume_ai_prompts":["resume"],
    "resume_share_reports":["resume"], "resume_shares":["resume"], "resume_template_categories":["resume"],
    "resume_templates":["resume"], "blog_categories":["blog"], "blog_posts":["blog"],
    "categories":["projects"], "project_files":["projects"], "project_images":["projects"],
    "project_versions":["projects"], "projects":["projects"], "technologies":["projects"],
    "reviews":["reviews","projects"], "review_reports":["reviews"], "testimonials":["reviews"],
    "coupons":["orders"], "offers":["orders"], "refund_requests":["orders"],
    "reward_settings":["referrals"], "withdrawal_requests":["referrals"], "custom_project_feature_categories":["custom_projects"],
    "custom_project_features":["custom_projects"], "profiles":["students"], "generated_reports":["reports"],
    "backups":["backup"]
  }'::jsonb;
  v_bmap jsonb := '{
    "project-files":["projects"], "project-media":["projects"], "banners":["cms"],
    "site":["cms"], "resume-templates":["resume"], "learning-files":["learning"],
    "custom-project-deliveries":["custom_projects"]
  }'::jsonb;
  v_bucket text;
  v_roles  text;
  v_base   text;
  v_n_pub  int := 0;
  v_n_sto  int := 0;
  v_unmapped text[] := '{}';

  -- (modules text[], actions text[]) -> "((select has_permission(..)) or ...)"
  -- built inline below via perm()
begin
  -- local helper as a nested function is not possible in plpgsql; use a scratch SQL function
  create or replace function pg_temp.perm(mods text[], acts text[]) returns text language sql as $f$
    select '(' || string_agg(format('(select public.has_permission(auth.uid(), %L, %L))', m, a), ' or ') || ')'
      from unnest(mods) m, unnest(acts) a
  $f$;

  -- public tables
  for r in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      from pg_policies
     where schemaname = 'public' and cmd <> 'SELECT'
       and coalesce(qual, '') || coalesce(with_check, '') like '%is_admin(auth.uid())%'
       and coalesce(qual, '') || coalesce(with_check, '') !~ '(has_permission|current_admin_role)'
       and tablename not in ('admin_notifications', 'admin_users', 'role_permissions')
     order by tablename, policyname
  loop
    if not (v_map ? r.tablename) then
      v_unmapped := v_unmapped || (r.tablename || '.' || r.policyname);
      continue;
    end if;
    select array_agg(x) into v_mods from jsonb_array_elements_text(v_map -> r.tablename) x;
    v_roles := (select string_agg(case when x = 'public' then 'public' else quote_ident(x) end, ', ') from unnest(r.roles) x);
    v_base  := regexp_replace(r.policyname, '_all$', '');
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if r.cmd = 'ALL' then
      execute format('create policy %I on %I.%I for select to %s using (%s)',
                     v_base || '_select', r.schemaname, r.tablename, v_roles, r.qual);
      execute format('create policy %I on %I.%I for insert to %s with check (%s)',
                     v_base || '_insert', r.schemaname, r.tablename, v_roles,
                     replace(coalesce(r.with_check, r.qual), 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['add'])));
      execute format('create policy %I on %I.%I for update to %s using (%s) with check (%s)',
                     v_base || '_update', r.schemaname, r.tablename, v_roles,
                     replace(r.qual, 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['edit'])),
                     replace(coalesce(r.with_check, r.qual), 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['edit'])));
      execute format('create policy %I on %I.%I for delete to %s using (%s)',
                     v_base || '_delete', r.schemaname, r.tablename, v_roles,
                     replace(r.qual, 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['delete'])));
    elsif r.cmd = 'INSERT' then
      execute format('create policy %I on %I.%I for insert to %s with check (%s)',
                     r.policyname, r.schemaname, r.tablename, v_roles,
                     replace(r.with_check, 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['add'])));
    elsif r.cmd = 'UPDATE' then
      execute format('create policy %I on %I.%I for update to %s using (%s) with check (%s)',
                     r.policyname, r.schemaname, r.tablename, v_roles,
                     replace(r.qual, 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['edit'])),
                     replace(coalesce(r.with_check, r.qual), 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['edit'])));
    elsif r.cmd = 'DELETE' then
      execute format('create policy %I on %I.%I for delete to %s using (%s)',
                     r.policyname, r.schemaname, r.tablename, v_roles,
                     replace(r.qual, 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['delete'])));
    end if;
    v_n_pub := v_n_pub + 1;
  end loop;

  -- storage.objects admin write policies (bucket-scoped)
  for r in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      from pg_policies
     where schemaname = 'storage' and tablename = 'objects' and cmd <> 'SELECT'
       and coalesce(qual, '') || coalesce(with_check, '') like '%is_admin(auth.uid())%'
       and coalesce(qual, '') || coalesce(with_check, '') !~ '(has_permission|current_admin_role)'
     order by policyname
  loop
    v_bucket := substring(coalesce(r.qual, r.with_check) from 'bucket_id = ''([a-z0-9-]+)''');
    if v_bucket is null or not (v_bmap ? v_bucket) then continue; end if;   -- e.g. admin-media stays generic
    select array_agg(x) into v_mods from jsonb_array_elements_text(v_bmap -> v_bucket) x;
    v_roles := (select string_agg(case when x = 'public' then 'public' else quote_ident(x) end, ', ') from unnest(r.roles) x);
    v_base  := regexp_replace(r.policyname, '_all$', '');
    execute format('drop policy %I on storage.objects', r.policyname);
    if r.cmd in ('ALL', 'INSERT') then
      if r.cmd = 'ALL' then
        execute format('create policy %I on storage.objects for select to %s using (%s)',
                       v_base || '_select', v_roles, r.qual);
      end if;
      execute format('create policy %I on storage.objects for insert to %s with check (%s)',
                     v_base || '_insert', v_roles,
                     replace(coalesce(r.with_check, r.qual), 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['add','edit'])));
    end if;
    if r.cmd in ('ALL', 'UPDATE') then
      execute format('create policy %I on storage.objects for update to %s using (%s) with check (%s)',
                     v_base || '_update', v_roles,
                     replace(r.qual, 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['edit'])),
                     replace(coalesce(r.with_check, r.qual), 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['edit'])));
    end if;
    if r.cmd in ('ALL', 'DELETE') then
      execute format('create policy %I on storage.objects for delete to %s using (%s)',
                     v_base || '_delete', v_roles,
                     replace(r.qual, 'is_admin(auth.uid())', pg_temp.perm(v_mods, array['delete','edit'])));
    end if;
    v_n_sto := v_n_sto + 1;
  end loop;

  raise notice '0119: rewrote % public-table and % storage admin write policies to has_permission()', v_n_pub, v_n_sto;
  if array_length(v_unmapped, 1) > 0 then
    raise warning '0119: admin write policies NOT mapped to a module (still blanket is_admin): %', v_unmapped;
  end if;
end $$;

-- ---- admin RPC guards (bodies verbatim from the live definitions + one guard line) --------------
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(p_user_id uuid, p_type text, p_category text, p_amount numeric, p_description text DEFAULT 'Admin adjustment'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_balance numeric;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_adjust_wallet: caller is not an active admin';
  end if;

  -- DB-07 / ADM-01: role + permission-matrix guard (added; body otherwise verbatim)
  perform public.require_admin_role(array['super_admin','admin'], 'referrals', 'edit');
  if p_type not in ('credit', 'debit') then
    raise exception 'type must be credit or debit';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  if p_type = 'debit' then
    select coalesce(sum(case when type = 'credit' then amount else -amount end), 0)
      into v_balance from public.wallet_transactions where user_id = p_user_id;
    if v_balance < p_amount then
      raise exception 'insufficient wallet balance (have %, need %)', v_balance, p_amount;
    end if;
  end if;

  insert into public.wallet_transactions (user_id, type, category, amount, description)
  values (p_user_id, p_type, p_category, p_amount, p_description)
  returning id into v_id;

  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_process_refund(p_request_id uuid, p_decision text, p_note text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r         public.refund_requests%rowtype;
  v_txn_id  uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_process_refund: caller is not an active admin';
  end if;

  -- DB-07 / ADM-01: role + permission-matrix guard (added; body otherwise verbatim)
  perform public.require_admin_role(array['super_admin','admin'], 'orders', 'edit');

  select * into r from public.refund_requests where id = p_request_id for update;
  if not found then raise exception 'refund request not found'; end if;
  if r.status <> 'pending' then raise exception 'refund request already %', r.status; end if;

  if p_decision = 'approve' then
    if r.refund_to = 'wallet' then
      insert into public.wallet_transactions (user_id, type, category, amount, description)
      values (r.user_id, 'credit', 'cashback', r.amount,
              'Refund for order ' || coalesce(r.purchase_id::text, ''))
      returning id into v_txn_id;
    end if;

    if r.purchase_id is not null then
      update public.purchases set status = 'refunded' where id = r.purchase_id;
    end if;

    update public.refund_requests
       set status = 'approved', decided_by = auth.uid(), decided_at = now(),
           decision_note = p_note, wallet_transaction_id = v_txn_id
     where id = p_request_id;
  elsif p_decision = 'reject' then
    update public.refund_requests
       set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = p_note
     where id = p_request_id;
  else
    raise exception 'decision must be approve or reject';
  end if;

  return v_txn_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_process_withdrawal(p_request_id uuid, p_decision text, p_note text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r         public.withdrawal_requests%rowtype;
  v_balance numeric;
  v_txn_id  uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_process_withdrawal: caller is not an active admin';
  end if;

  -- DB-07 / ADM-01: role + permission-matrix guard (added; body otherwise verbatim)
  perform public.require_admin_role(array['super_admin','admin'], 'referrals', 'edit');

  select * into r from public.withdrawal_requests where id = p_request_id for update;
  if not found then raise exception 'withdrawal request not found'; end if;
  if r.status <> 'pending' then raise exception 'withdrawal request already %', r.status; end if;

  if p_decision = 'approve' then
    select coalesce(sum(case when type = 'credit' then amount else -amount end), 0)
      into v_balance from public.wallet_transactions where user_id = r.user_id;
    if v_balance < r.amount then
      raise exception 'insufficient wallet balance (have %, need %)', v_balance, r.amount;
    end if;

    insert into public.wallet_transactions (user_id, type, category, amount, description)
    values (r.user_id, 'debit', 'withdrawal', r.amount, 'Withdrawal approved')
    returning id into v_txn_id;

    update public.withdrawal_requests
       set status = 'approved', decided_by = auth.uid(), decided_at = now(),
           decision_note = p_note, wallet_transaction_id = v_txn_id
     where id = p_request_id;
  elsif p_decision = 'reject' then
    update public.withdrawal_requests
       set status = 'rejected', decided_by = auth.uid(), decided_at = now(), decision_note = p_note
     where id = p_request_id;
  else
    raise exception 'decision must be approve or reject';
  end if;

  return v_txn_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.send_bulk_notification(p_title text, p_body text, p_category text DEFAULT 'updates'::text, p_audience text DEFAULT 'all'::text, p_image_url text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_count integer;
  v_cat   text := coalesce(nullif(p_category, ''), 'updates');
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'send_bulk_notification: caller is not an active admin';
  end if;

  -- DB-07 / ADM-01: role + permission-matrix guard (added; body otherwise verbatim)
  perform public.require_admin_role(array['super_admin','admin'], 'cms', 'add');
  if v_cat not in ('offers', 'updates', 'messages') then v_cat := 'updates'; end if;

  insert into public.notifications (user_id, title, body, category, image_url)
  select p.id, p_title, coalesce(p_body, ''), v_cat, nullif(p_image_url, '')
  from public.profiles p
  where case p_audience
          when 'premium' then p.is_premium = true
          when 'free'    then p.is_premium = false
          else true
        end;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.custom_project_set_status(p_request_id uuid, p_new_status text, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_old text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'custom_project_set_status: caller is not an active admin';
  end if;

  -- DB-07 / ADM-01: role + permission-matrix guard (added; body otherwise verbatim)
  perform public.require_permission('custom_projects', 'edit');
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
$function$;

-- ---- DB-27: invoker functions without search_path ------------------------------------------------
do $$
begin
  if to_regprocedure('public.restore_resume_version(uuid)') is not null then
    alter function public.restore_resume_version(uuid) set search_path = public; end if;
  if to_regprocedure('public.compute_ats_breakdown(uuid)') is not null then
    alter function public.compute_ats_breakdown(uuid) set search_path = public; end if;
  if to_regprocedure('public.match_resume_to_jd(uuid,text)') is not null then
    alter function public.match_resume_to_jd(uuid, text) set search_path = public; end if;
end $$;

-- ---- DB-28: explicit revokes ---------------------------------------------------------------------
revoke all on function public.admin_adjust_wallet(uuid, text, text, numeric, text)      from public, anon;
revoke all on function public.admin_process_refund(uuid, text, text)                   from public, anon;
revoke all on function public.admin_process_withdrawal(uuid, text, text)               from public, anon;
revoke all on function public.send_bulk_notification(text, text, text, text, text)     from public, anon;
revoke all on function public.custom_project_set_status(uuid, text, text)              from public, anon;
revoke all on function public.log_admin_activity(text, text, text, text, jsonb, text)  from public, anon;
revoke all on function public.academic_usage(text, text)                               from public, anon;
grant execute on function public.admin_adjust_wallet(uuid, text, text, numeric, text)     to authenticated;
grant execute on function public.admin_process_refund(uuid, text, text)                  to authenticated;
grant execute on function public.admin_process_withdrawal(uuid, text, text)              to authenticated;
grant execute on function public.send_bulk_notification(text, text, text, text, text)    to authenticated;
grant execute on function public.custom_project_set_status(uuid, text, text)             to authenticated;
grant execute on function public.log_admin_activity(text, text, text, text, jsonb, text) to authenticated;
grant execute on function public.academic_usage(text, text)                              to authenticated;

-- trigger functions are never called through the API; EXECUTE is only checked at CREATE TRIGGER time
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
do $$
begin
  if to_regprocedure('public.referral_reward_for(numeric)') is not null then
    revoke all on function public.referral_reward_for(numeric) from public, anon;   -- grant only; no logic change
  end if;
end $$;

notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- ROLLBACK (manual):
--   -- policies: for every <base>_select/_insert/_update/_delete created above, drop them and re-create the
--   -- original blanket policy, e.g.  create policy projects_admin_all on public.projects for all
--   --   using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
--   -- (single-command policies: replace the has_permission(...) expression back with is_admin(auth.uid())).
--   -- RPCs: re-create the five functions from A:007 / M:0033 etc. without the "DB-07 / ADM-01" guard line.
--   -- is_admin / has_permission: re-run A:001 lines 55-68 / 91-112 (removes the self-only oracle limit).
--   -- drop function public.require_admin_role(text[],text,text), public.require_permission(text,text);
--   -- grants: grant execute on function public.has_permission(uuid,text,text) to anon;
-- ----------------------------------------------------------------------------

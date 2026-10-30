-- P0-01: new academic requests are mentoring only. NULL identifies legacy
-- orders; do not rewrite their contracts, snapshots, payments or deliveries.
alter table public.custom_project_requests
  add column if not exists service_scope text,
  add column if not exists assessment_use text,
  add column if not exists integrity_acknowledged_at timestamptz,
  add column if not exists student_authored_confirmed boolean;

alter table public.custom_project_requests
  add constraint custom_project_service_scope_check
  check (service_scope is null or
    (service_scope = 'mentoring' and project_type = 'academic' and assessment_use in ('yes','no')
      and integrity_acknowledged_at is not null and student_authored_confirmed = true) or
    (service_scope = 'custom_software' and project_type in ('personal','business') and assessment_use = 'no'
      and integrity_acknowledged_at is not null));

-- A mentoring session replaces the legacy complete-implementation price.
-- Existing orders retain their frozen price snapshots.
update public.custom_project_pricing
   set base_price = 1500, pricing_version = pricing_version + 1
 where project_type = 'academic' and base_price <> 1500;

create or replace function public.custom_project_academic_scope_guard()
returns trigger language plpgsql set search_path = public as $$
declare
  v_text text;
begin
  if tg_op = 'INSERT' and new.service_scope is null then
    raise exception 'New requests require a service scope.' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.service_scope is distinct from old.service_scope then
    raise exception 'A request service scope cannot be changed.' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and old.service_scope is not null and
     (new.assessment_use is distinct from old.assessment_use or
      new.integrity_acknowledged_at is distinct from old.integrity_acknowledged_at or
      new.student_authored_confirmed is distinct from old.student_authored_confirmed or
      new.project_type is distinct from old.project_type) then
    raise exception 'Academic-integrity answers and project type cannot be changed after order creation.' using errcode = '23514';
  end if;
  if new.service_scope is null then return new; end if;
  v_text := lower(concat_ws(' ', new.title, new.objective, new.problem_statement,
    new.description, new.target_users, new.custom_requirements::text));
  if v_text ~ '(ready[ -]to[ -]submit|do my assignment|do our assignment|submit (it|this) as (mine|my own))'
     or v_text ~ '(write|build|make|complete|prepare|deliver|do) (my|our|the|a|an)? ?(whole|entire|complete|final[ -]year|mini|major)? ?(project|assignment|assessment|report|presentation|slides|ppt|viva|thesis|dissertation) (for me|for us|to submit|for submission|on my behalf)'
     or (new.service_scope = 'custom_software' and
         v_text ~ '(final[ -]year|mini[ -]project|major[ -]project|college assignment|coursework|academic submission|viva)') then
    raise exception 'Assessment outsourcing is not available.' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists custom_project_academic_scope_guard on public.custom_project_requests;
create trigger custom_project_academic_scope_guard
  before insert or update on public.custom_project_requests
  for each row execute function public.custom_project_academic_scope_guard();

-- New mentoring requests cannot gain complete-implementation features through
-- an admin catalog change or a forged client selection.
create or replace function public.custom_project_mentoring_feature_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.custom_project_requests r
             where r.id = new.request_id and r.service_scope = 'mentoring') then
    raise exception 'Implementation features are unavailable for mentoring.' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists custom_project_mentoring_feature_guard on public.custom_project_request_features;
create trigger custom_project_mentoring_feature_guard
  before insert or update on public.custom_project_request_features
  for each row execute function public.custom_project_mentoring_feature_guard();

-- Add-ons and delivery files are unavailable on new mentoring requests.
-- Review and feedback use the existing message thread. Legacy rows are exempt.
create or replace function public.custom_project_mentoring_addon_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.custom_project_requests r
             where r.id = new.project_id and r.service_scope = 'mentoring') then
    raise exception 'Add-ons are unavailable for mentoring requests.' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists custom_project_mentoring_addon_guard on public.custom_project_addons;
create trigger custom_project_mentoring_addon_guard
  before insert or update on public.custom_project_addons
  for each row execute function public.custom_project_mentoring_addon_guard();

create or replace function public.custom_project_mentoring_delivery_record_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.custom_project_requests r
             where r.id = new.request_id and r.service_scope = 'mentoring') then
    raise exception 'Use the message thread for mentoring feedback; completed deliveries are unavailable.' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists custom_project_mentoring_delivery_record_guard on public.custom_project_deliveries;
create trigger custom_project_mentoring_delivery_record_guard
  before insert or update on public.custom_project_deliveries
  for each row execute function public.custom_project_mentoring_delivery_record_guard();

create or replace function public.custom_project_mentoring_delivery_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (select 1 from public.custom_project_deliveries d
             join public.custom_project_requests r on r.id = d.request_id
             where d.id = new.delivery_id and r.service_scope = 'mentoring') then
    raise exception 'Completed deliverable files are unavailable for mentoring.' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists custom_project_mentoring_delivery_guard on public.custom_project_delivery_assets;
create trigger custom_project_mentoring_delivery_guard
  before insert or update on public.custom_project_delivery_assets
  for each row execute function public.custom_project_mentoring_delivery_guard();

-- Keep the existing delivery-file gate for software. A mentoring request may be
-- completed only after an admin has sent substantive feedback in the thread.
create or replace function public.custom_project_set_status(
  p_request_id uuid, p_new_status text, p_note text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_old text;
  v_scope text;
  v_has_deliverable boolean;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'custom_project_set_status: caller is not an active admin';
  end if;
  perform public.require_permission('custom_projects', 'edit');
  if p_new_status not in ('new', 'in_development', 'testing', 'ready', 'delivered', 'cancelled') then
    raise exception 'custom_project_set_status: invalid status %', p_new_status;
  end if;

  select status, service_scope into v_old, v_scope
    from public.custom_project_requests where id = p_request_id for update;
  if not found then raise exception 'custom project request not found'; end if;

  if p_new_status = 'delivered' and v_old is distinct from 'delivered' then
    if v_scope = 'mentoring' then
      select exists(select 1 from public.custom_project_messages m
                     where m.request_id = p_request_id and m.sender_role = 'admin'
                       and char_length(btrim(m.body)) >= 50)
        into v_has_deliverable;
      if not v_has_deliverable then
        raise exception 'Send substantive mentoring feedback in the message thread before completing this request.';
      end if;
    else
      select (d.demo_url is not null) or exists (
               select 1 from public.custom_project_delivery_assets a where a.delivery_id = d.id
             ) into v_has_deliverable
        from public.custom_project_deliveries d where d.request_id = p_request_id;
      if not coalesce(v_has_deliverable, false) then
        raise exception 'Add a demo URL or at least one file before marking this request Delivered.';
      end if;
    end if;
  end if;

  if v_old is distinct from p_new_status then
    update public.custom_project_requests set status = p_new_status where id = p_request_id;
    insert into public.custom_project_request_history
      (request_id, old_status, new_status, changed_by, changed_by_role, note)
    values (p_request_id, v_old, p_new_status, auth.uid(), 'admin', nullif(p_note, ''));
    if p_new_status = 'delivered' and v_scope is distinct from 'mentoring' then
      update public.custom_project_deliveries
         set delivered_at = coalesce(delivered_at, now())
       where request_id = p_request_id;
    end if;
  elsif nullif(p_note, '') is not null then
    insert into public.custom_project_request_history
      (request_id, old_status, new_status, changed_by, changed_by_role, note)
    values (p_request_id, v_old, p_new_status, auth.uid(), 'admin', p_note);
  end if;
end;
$$;
revoke all on function public.custom_project_set_status(uuid, text, text) from public, anon;
grant execute on function public.custom_project_set_status(uuid, text, text) to authenticated;
notify pgrst, 'reload schema';

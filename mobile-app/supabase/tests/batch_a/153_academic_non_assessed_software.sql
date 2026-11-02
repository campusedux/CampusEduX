-- Assessed mentoring remains protected; non-assessed Academic software can carry features.
\set ON_ERROR_STOP on
begin;
do $$
declare
  student_id uuid := test_make_user('academic153@x.test');
  assessed_id uuid;
  legacy_mentoring_id uuid;
  software_id uuid;
  denied boolean;
begin
  insert into public.custom_project_requests
    (user_id, title, project_type, project_level, platform, service_scope,
     assessment_use, integrity_acknowledged_at, student_authored_confirmed)
  values (student_id, 'Review my code', 'academic', 'standard', 'web',
          'mentoring', 'yes', now(), true)
  returning id into assessed_id;

  -- The old non-assessed mentoring shape remains valid for existing mobile callers.
  insert into public.custom_project_requests
    (user_id, title, project_type, project_level, platform, service_scope,
     assessment_use, integrity_acknowledged_at, student_authored_confirmed)
  values (student_id, 'Code review', 'academic', 'standard', 'web',
          'mentoring', 'no', now(), true)
  returning id into legacy_mentoring_id;
  if assessed_id is null or legacy_mentoring_id is null then
    raise exception 'FAIL existing mentoring shapes rejected';
  end if;

  denied := false;
  begin
    insert into public.custom_project_request_features (request_id, feature_id)
    values (assessed_id, 'auth-google');
  exception when check_violation then denied := true;
  end;
  if not denied then raise exception 'FAIL assessed mentoring accepted a feature'; end if;

  denied := false;
  begin
    insert into public.custom_project_addons (project_id, title)
    values (assessed_id, 'Extra package');
  exception when check_violation then denied := true;
  end;
  if not denied then raise exception 'FAIL assessed mentoring accepted an add-on'; end if;

  denied := false;
  begin
    insert into public.custom_project_deliveries (request_id)
    values (assessed_id);
  exception when check_violation then denied := true;
  end;
  if not denied then raise exception 'FAIL assessed mentoring accepted a delivery'; end if;

  denied := false;
  begin
    insert into public.custom_project_requests
      (user_id, title, project_type, project_level, platform, service_scope,
       assessment_use, integrity_acknowledged_at, student_authored_confirmed)
    values (student_id, 'Invalid assessed software', 'academic', 'standard', 'web',
            'custom_software', 'yes', now(), true);
  exception when check_violation then denied := true;
  end;
  if not denied then raise exception 'FAIL assessed Academic software accepted'; end if;

  denied := false;
  begin
    update public.custom_project_requests set assessment_use = 'no'
    where id = assessed_id;
  exception when check_violation then denied := true;
  end;
  if not denied then raise exception 'FAIL existing assessed scope was changed'; end if;

  denied := false;
  begin
    insert into public.custom_project_requests
      (user_id, title, project_type, project_level, platform, service_scope,
       assessment_use, integrity_acknowledged_at, student_authored_confirmed)
    values (student_id, 'Missing attestation', 'academic', 'standard', 'web',
            'custom_software', 'no', now(), false);
  exception when check_violation then denied := true;
  end;
  if not denied then raise exception 'FAIL missing Academic attestation accepted'; end if;

  denied := false;
  begin
    insert into public.custom_project_requests
      (user_id, title, project_type, project_level, platform, service_scope,
       assessment_use, integrity_acknowledged_at, student_authored_confirmed)
    values (student_id, 'Missing acknowledgement', 'academic', 'standard', 'web',
            'custom_software', 'no', null, true);
  exception when check_violation then denied := true;
  end;
  if not denied then raise exception 'FAIL missing Academic acknowledgement accepted'; end if;

  insert into public.custom_project_requests
    (user_id, title, project_type, project_level, platform, service_scope,
     assessment_use, integrity_acknowledged_at, student_authored_confirmed)
  values (student_id, 'Independent software', 'academic', 'standard', 'web',
          'custom_software', 'no', now(), true)
  returning id into software_id;
  insert into public.custom_project_request_features (request_id, feature_id)
  values (software_id, 'auth-google');
  insert into public.custom_project_addons (project_id, title)
  values (software_id, 'Extra feature');
  if (select count(*) from public.custom_project_request_features where request_id = software_id) <> 1
     or (select count(*) from public.custom_project_addons where project_id = software_id) <> 1 then
    raise exception 'FAIL non-assessed Academic software lost features or add-ons';
  end if;
end;
$$;
rollback;

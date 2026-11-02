-- Keep assessed Academic requests under the existing mentoring guards. Allow
-- explicitly non-assessed Academic software with both integrity attestations.
-- This single ALTER TABLE statement replaces the CHECK atomically.
alter table public.custom_project_requests
  drop constraint if exists custom_project_service_scope_check,
  add constraint custom_project_service_scope_check
  check (
    service_scope is null
    or (service_scope = 'mentoring' and project_type = 'academic'
        and assessment_use in ('yes', 'no')
        and integrity_acknowledged_at is not null
        and student_authored_confirmed = true)
    or (service_scope = 'custom_software'
        and project_type in ('personal', 'business')
        and assessment_use = 'no'
        and integrity_acknowledged_at is not null)
    or coalesce(
      service_scope = 'custom_software' and project_type = 'academic'
        and assessment_use = 'no'
        and integrity_acknowledged_at is not null
        and student_authored_confirmed = true,
      false
    )
  );

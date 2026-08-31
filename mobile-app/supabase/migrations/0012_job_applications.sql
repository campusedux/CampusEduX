-- Fixes: GET /rest/v1/applications        -> 404 PGRST205
--        GET /rest/v1/application_stages   -> 404 PGRST205
--
-- src/services/job.service.ts:
--   applyToJob():           insert { user_id, job_id, resume_id } returning id
--   getJobDetail():         applications.select("id").eq(job_id).eq(user_id).maybeSingle()
--   getAppliedJobs():       select "*, job:jobs(*, company:companies(name, logo_url)),
--                                   resume:resumes(file_name)".eq("user_id", uid)
--   getApplicationDetail(): + application_stages.select("*").eq("application_id", id)
--                             .order("sort_order")
--   mapped fields: status (overallStatus), created_at (appliedAt),
--                  stage.label, stage.status, stage.occurred_at (date)
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create extension if not exists pgcrypto;

create table if not exists public.applications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  job_id     text        not null references public.jobs (id) on delete cascade,
  resume_id  uuid        references public.resumes (id) on delete set null,
  status     text        not null default 'in_review'
               check (status in ('in_review', 'shortlisted', 'rejected', 'hired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- applyToJob() has no upsert; a second apply to the same job should fail
  unique (user_id, job_id)
);

create index if not exists applications_user_id_idx on public.applications (user_id, created_at desc);
create index if not exists applications_job_id_idx  on public.applications (job_id);

create table if not exists public.application_stages (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        not null references public.applications (id) on delete cascade,
  label          text        not null,
  status         text        not null default 'pending'
                   check (status in ('completed', 'in_progress', 'pending')),
  occurred_at    timestamptz,
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now(),
  -- one stage per position per application (also makes seed.sql idempotent)
  unique (application_id, sort_order)
);

create index if not exists application_stages_application_id_idx
  on public.application_stages (application_id, sort_order);

-- add the unique constraint on a table that predates this line
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'application_stages_application_id_sort_order_key'
  ) then
    alter table public.application_stages
      add constraint application_stages_application_id_sort_order_key unique (application_id, sort_order);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   applications:       read + create own (auth.uid() = user_id).
--                       Recruiter-side status changes happen via service role.
--   application_stages: no user_id column, so ownership is derived from the
--                       parent application (matches the 0001 auth.uid() intent).
-- ---------------------------------------------------------------------------
alter table public.applications       enable row level security;
alter table public.application_stages enable row level security;

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own"
  on public.applications for select
  using (auth.uid() = user_id);

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own"
  on public.applications for insert
  with check (auth.uid() = user_id);

drop policy if exists "application_stages_select_via_parent" on public.application_stages;
create policy "application_stages_select_via_parent"
  on public.application_stages for select
  using (exists (
    select 1 from public.applications a
    where a.id = application_stages.application_id and a.user_id = auth.uid()
  ));

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Every new application starts its timeline with a completed "Application
-- Submitted" stage (matches sampleAppliedJobs()), so ApplicationStatusScreen
-- shows something immediately. Recruiters/admin add the later stages.
-- ---------------------------------------------------------------------------
create or replace function public.seed_first_application_stage()
returns trigger
language plpgsql
as $$
begin
  insert into public.application_stages (application_id, label, status, occurred_at, sort_order)
  values (new.id, 'Application Submitted', 'completed', new.created_at, 0)
  on conflict (application_id, sort_order) do nothing;
  return null;
end;
$$;

drop trigger if exists applications_seed_first_stage on public.applications;
create trigger applications_seed_first_stage
  after insert on public.applications
  for each row execute function public.seed_first_application_stage();

notify pgrst, 'reload schema';

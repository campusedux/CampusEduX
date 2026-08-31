-- Fixes: GET /rest/v1/saved_jobs -> 404 PGRST205
--        GET /rest/v1/job_alerts -> 404 PGRST205
--
-- src/services/job.service.ts:
--   toggleSavedJob():  insert { job_id, user_id } / delete .eq(job_id).eq(user_id)
--   getJobDetail():    saved_jobs.select("job_id").eq(job_id).eq(user_id).maybeSingle()
--   getSavedJobs():    select "job:jobs(*, company:companies(name, logo_url))"
--                      .eq("user_id", uid).order("created_at", desc)
--   getJobAlertPreferences(): job_alerts.select("*").eq("user_id", uid).maybeSingle()
--   saveJobAlertPreferences(): job_alerts.upsert({ user_id, enabled, job_role,
--                              location, experience, salary_range, job_type })
--     -> upsert() with no onConflict targets the PK, so user_id IS the PK.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.saved_jobs (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  job_id     text        not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index if not exists saved_jobs_user_id_idx on public.saved_jobs (user_id, created_at desc);

create table if not exists public.job_alerts (
  -- one alert config per user; user_id is the PK so supabase-js .upsert()
  -- (which defaults to the primary-key conflict target) works.
  user_id      uuid        primary key references public.profiles (id) on delete cascade,
  enabled      boolean     not null default true,
  job_role     text        not null default '',
  location     text        not null default '',
  experience   text        not null default '',
  salary_range text        not null default '',
  job_type     text        not null default 'All'
                 check (job_type in ('All', 'Full Time', 'Part Time', 'Internship', 'Contract')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security — both tables are per-user; same auth.uid() scoping as
-- 0001_profiles.sql.
-- ---------------------------------------------------------------------------
alter table public.saved_jobs enable row level security;
alter table public.job_alerts enable row level security;

drop policy if exists "saved_jobs_select_own" on public.saved_jobs;
create policy "saved_jobs_select_own"
  on public.saved_jobs for select
  using (auth.uid() = user_id);

drop policy if exists "saved_jobs_insert_own" on public.saved_jobs;
create policy "saved_jobs_insert_own"
  on public.saved_jobs for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_jobs_delete_own" on public.saved_jobs;
create policy "saved_jobs_delete_own"
  on public.saved_jobs for delete
  using (auth.uid() = user_id);

drop policy if exists "job_alerts_select_own" on public.job_alerts;
create policy "job_alerts_select_own"
  on public.job_alerts for select
  using (auth.uid() = user_id);

drop policy if exists "job_alerts_insert_own" on public.job_alerts;
create policy "job_alerts_insert_own"
  on public.job_alerts for insert
  with check (auth.uid() = user_id);

drop policy if exists "job_alerts_update_own" on public.job_alerts;
create policy "job_alerts_update_own"
  on public.job_alerts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists job_alerts_set_updated_at on public.job_alerts;
create trigger job_alerts_set_updated_at
  before update on public.job_alerts
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

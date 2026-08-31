-- Fixes: GET /rest/v1/jobs -> 404 PGRST205
--        "Could not find the table 'public.jobs' in the schema cache"
--
-- src/services/job.service.ts & src/services/home.service.ts:
--   select "*, company:companies(name, logo_url[, rating, review_count])"
--   order by posted_at / salary_max_lpa
--   .eq("company_id", id) / .eq("job_type", t)
--   .ilike("location", "%x%") / .ilike("title", "%q%")
--   .gte("salary_min_lpa", n) / .lte("salary_max_lpa", n)
--   .or("title.ilike.%b%,skills.cs.{branch}")        (skills must be text[])
--   jobs.select("recruiter:recruiters(...)")          (needs recruiter_id FK)
--   mapJobRow() reads id,title,company_id,company_name,company_logo_url,
--               location,salary_range,posted_at,created_at,job_type
--   getJobDetail() also reads description,requirements,skills,experience
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.jobs (
  id                text        primary key,
  title             text        not null,
  company_id        text        references public.companies (id) on delete set null,
  -- denormalised fallbacks used by mapJobRow() when the company join is absent
  company_name      text        not null default '',
  company_logo_url  text,
  recruiter_id      text        references public.recruiters (id) on delete set null,
  location          text        not null default '',
  salary_range      text        not null default '',
  salary_min_lpa    numeric(6,2),
  salary_max_lpa    numeric(6,2),
  job_type          text        not null default 'Full Time'
                      check (job_type in ('Full Time', 'Part Time', 'Internship', 'Contract')),
  description        text        not null default '',
  requirements      text[]      not null default '{}',
  skills            text[]      not null default '{}',
  experience        text        not null default '',
  posted_at         timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists jobs_company_id_idx  on public.jobs (company_id);
create index if not exists jobs_posted_at_idx   on public.jobs (posted_at desc);
create index if not exists jobs_job_type_idx    on public.jobs (job_type);
create index if not exists jobs_skills_gin      on public.jobs using gin (skills);

-- ---------------------------------------------------------------------------
-- Row Level Security — job listings are world-readable; writes service role.
-- ---------------------------------------------------------------------------
alter table public.jobs enable row level security;

drop policy if exists "jobs_select_public" on public.jobs;
create policy "jobs_select_public"
  on public.jobs for select
  using (true);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Keep companies.open_jobs_count honest (getCompanies() orders by it).
-- ---------------------------------------------------------------------------
create or replace function public.sync_company_open_jobs()
returns trigger
language plpgsql
as $$
declare
  affected text[] := '{}';
  cid text;
begin
  if tg_op <> 'DELETE' then
    affected := affected || new.company_id;
  end if;
  if tg_op <> 'INSERT' then
    affected := affected || old.company_id;
  end if;

  foreach cid in array array_remove(affected, null) loop
    update public.companies c
       set open_jobs_count = (select count(*) from public.jobs j where j.company_id = c.id)
     where c.id = cid;
  end loop;
  return null;
end;
$$;

drop trigger if exists jobs_sync_company_count on public.jobs;
create trigger jobs_sync_company_count
  after insert or update of company_id or delete on public.jobs
  for each row execute function public.sync_company_open_jobs();

notify pgrst, 'reload schema';

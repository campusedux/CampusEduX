-- Fixes: GET /rest/v1/companies  -> 404 PGRST205
--        GET /rest/v1/recruiters -> 404 PGRST205
--
-- src/services/job.service.ts:
--   getCompanies():       select "*".order("open_jobs_count", desc) [+ ilike name]
--   getCompanyDetails():  select "*".eq("id", id).single()
--   getRecruiterForJob(): jobs.select("recruiter:recruiters(*, company:companies(name, logo_url))")
--   mapCompanyRow()/mapRecruiterRow() read every column below.
-- src/services/placement.service.ts getCompanies():
--   companies.select("id, name, logo_url, hr_questions(count), practice_tests(count)")
--   -> needs hr_questions.company_id + practice_tests.company_id FKs (0017, 0020)
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.companies (
  id              text        primary key,
  name            text        not null,
  logo_url        text,
  website         text,
  rating          numeric(3,2) not null default 0,
  review_count    integer     not null default 0,
  employee_count  text        not null default '',
  about           text        not null default '',
  open_jobs_count integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists companies_open_jobs_count_idx on public.companies (open_jobs_count desc);

create table if not exists public.recruiters (
  id           text        primary key,
  company_id   text        references public.companies (id) on delete set null,
  name         text        not null,
  title        text        not null default '',
  rating       numeric(3,2) not null default 0,
  review_count integer     not null default 0,
  email        text        not null default '',
  phone        text        not null default '',
  location     text        not null default '',
  about        text        not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists recruiters_company_id_idx on public.recruiters (company_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — recruiting catalog, world-readable; writes service role.
-- ---------------------------------------------------------------------------
alter table public.companies  enable row level security;
alter table public.recruiters enable row level security;

drop policy if exists "companies_select_public" on public.companies;
create policy "companies_select_public"
  on public.companies for select
  using (true);

drop policy if exists "recruiters_select_public" on public.recruiters;
create policy "recruiters_select_public"
  on public.recruiters for select
  using (true);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists recruiters_set_updated_at on public.recruiters;
create trigger recruiters_set_updated_at
  before update on public.recruiters
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

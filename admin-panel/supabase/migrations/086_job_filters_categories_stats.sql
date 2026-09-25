-- 0114 (mobile) == admin 086 -- byte-identical, guarded, idempotent, additive.
-- Jobs dashboard data model:
--   * jobs.work_mode         Remote | Hybrid | On-site          (nullable)
--   * jobs.experience_level  Fresher | Experienced              (nullable)
--   * jobs.category          normalised to the fixed set below; the original
--                            free-text value is preserved in jobs.category_raw
--   * BEFORE INSERT/UPDATE trigger that ONLY fills category / experience_level
--     / work_mode when they are NULL or invalid -- an admin-set valid value is
--     never overwritten
--   * RPCs job_category_counts() and job_dashboard_stats() (SECURITY INVOKER,
--     so counts respect the same RLS/targeting as the job list)
-- "Active" job = status = 'open' AND (application_deadline IS NULL OR > now()).
-- No existing column is dropped or retyped; website reads are unaffected.

do $$
begin
  if to_regclass('public.jobs') is null then
    return;
  end if;

  alter table public.jobs add column if not exists work_mode        text;
  alter table public.jobs add column if not exists experience_level text;
  alter table public.jobs add column if not exists category_raw     text;

  if not exists (select 1 from pg_constraint where conname = 'jobs_work_mode_check') then
    alter table public.jobs add constraint jobs_work_mode_check
      check (work_mode is null or work_mode in ('Remote', 'Hybrid', 'On-site'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobs_experience_level_check') then
    alter table public.jobs add constraint jobs_experience_level_check
      check (experience_level is null or experience_level in ('Fresher', 'Experienced'));
  end if;
end $$;

-- ---- helpers ---------------------------------------------------------------
create or replace function public.job_canonical_category(p_category text)
returns text
language sql
immutable
as $$
  select case lower(btrim(coalesce(p_category, '')))
    when 'it & software'      then 'IT & Software'
    when 'core engineering'   then 'Core Engineering'
    when 'data/ai'            then 'Data/AI'
    when 'design'             then 'Design'
    when 'marketing'          then 'Marketing'
    when 'sales'              then 'Sales'
    when 'finance'            then 'Finance'
    when 'hr'                 then 'HR'
    when 'other'              then 'Other'
    else null
  end;
$$;

create or replace function public.normalize_job_category(p_title text, p_skills text[], p_category text)
returns text
language plpgsql
immutable
as $$
declare
  h text := lower(coalesce(p_title, '') || ' ' || coalesce(p_category, '') || ' ' ||
                  coalesce(array_to_string(p_skills, ' '), ''));
begin
  if h ~ '\m(data scientist|data analyst|data engineer|machine learning|ml engineer|ai engineer|artificial intelligence|deep learning|nlp|analytics|business intelligence|tableau|power bi|pandas|tensorflow|pytorch|data science)\M' then
    return 'Data/AI';
  elsif h ~ '\m(ui|ux|ui/ux|graphic|design|designer|figma|photoshop|illustrator|product design|visual design|animation)\M' then
    return 'Design';
  elsif h ~ '\m(marketing|seo|sem|social media|content writer|copywriter|brand|digital marketing|growth)\M' then
    return 'Marketing';
  elsif h ~ '\m(sales|business development|bdm|bde|inside sales|account executive|telecaller|lead generation)\M' then
    return 'Sales';
  elsif h ~ '\m(finance|accountant|accounting|accounts|audit|auditor|taxation|banking|investment|tally|gst|chartered)\M' then
    return 'Finance';
  elsif h ~ '\m(hr|human resources|recruiter|recruitment|talent acquisition|payroll|hrbp)\M' then
    return 'HR';
  elsif h ~ '\m(mechanical|electrical|electronics|civil|production|manufacturing|manufacture|plc|cad|autocad|solidworks|catia|npi|eco|bom|plm|quality engineer|maintenance|instrumentation|embedded|vlsi|automobile|automotive|core engineering)\M' then
    return 'Core Engineering';
  elsif h ~ '\m(software|developer|programmer|full stack|frontend|front-end|backend|back-end|java|python|javascript|react|node|angular|android|ios|devops|cloud|aws|sql|qa|testing|sde|web|api|cyber|security|it support|network)\M' then
    return 'IT & Software';
  end if;
  return 'Other';
end;
$$;

create or replace function public.derive_experience_level(p_experience text, p_job_type text)
returns text
language plpgsql
immutable
as $$
declare
  t text := lower(btrim(coalesce(p_experience, '')));
  first_num numeric;
  upper_num numeric;
  m text[];
begin
  if p_job_type = 'Internship' then
    return 'Fresher';
  end if;
  if t = '' then
    return null;
  end if;
  if t ~ '\m(freshers?|entry[ -]level|graduates?)\M' then
    return 'Fresher';
  end if;

  m := regexp_match(t, '^(\d+(?:\.\d+)?)\s*(?:[-–—]\s*(\d+(?:\.\d+)?))?');
  if m is null then
    return null; -- unparseable: don't guess
  end if;
  first_num := m[1]::numeric;
  upper_num := coalesce(m[2]::numeric, first_num);

  if first_num >= 1 then
    return 'Experienced';
  end if;
  -- starts at 0: "0", "0-1", "0-2" are Fresher; wider ranges are ambiguous
  if upper_num <= 2 then
    return 'Fresher';
  end if;
  return null;
end;
$$;

-- ---- trigger: fill only NULL / invalid, never overwrite a valid value -------
create or replace function public.jobs_fill_derived_fields()
returns trigger
language plpgsql
as $$
declare
  canon text;
begin
  canon := public.job_canonical_category(new.category);
  if canon is not null then
    new.category := canon;              -- valid (only fixes casing/whitespace)
  else
    if new.category is not null and btrim(new.category) <> '' then
      new.category_raw := coalesce(new.category_raw, new.category);
    end if;
    new.category := public.normalize_job_category(new.title, new.skills, new.category);
  end if;

  if new.experience_level is null then
    new.experience_level := public.derive_experience_level(new.experience, new.job_type);
  end if;
  -- work_mode: no reliable signal in existing columns; stays NULL unless set.
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.jobs') is null then
    return;
  end if;

  drop trigger if exists jobs_fill_derived_fields on public.jobs;
  create trigger jobs_fill_derived_fields
    before insert or update on public.jobs
    for each row execute function public.jobs_fill_derived_fields();

  -- backfill existing rows (the trigger does the work; touching a column is enough)
  update public.jobs set title = title;

  create index if not exists jobs_status_posted_idx on public.jobs (status, posted_at desc);
  create index if not exists jobs_category_idx      on public.jobs (category);
end $$;

-- ---- RPCs ------------------------------------------------------------------
create or replace function public.job_category_counts()
returns table (category text, job_count bigint)
language sql
stable
security invoker
as $$
  select coalesce(j.category, 'Other') as category, count(*)::bigint as job_count
    from public.jobs j
   where j.status = 'open'
     and (j.application_deadline is null or j.application_deadline > now())
   group by 1
   order by 2 desc, 1 asc;
$$;

create or replace function public.job_dashboard_stats()
returns table (active_jobs bigint, company_count bigint, fresher_jobs bigint)
language sql
stable
security invoker
as $$
  select count(*)::bigint,
         count(distinct coalesce(j.company_id, nullif(j.company_name, '')))::bigint,
         count(*) filter (where j.experience_level = 'Fresher')::bigint
    from public.jobs j
   where j.status = 'open'
     and (j.application_deadline is null or j.application_deadline > now());
$$;

grant execute on function public.job_category_counts()  to anon, authenticated;
grant execute on function public.job_dashboard_stats()  to anon, authenticated;

notify pgrst, 'reload schema';

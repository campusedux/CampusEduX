-- 0113 (mobile) == admin 085 -- byte-identical, guarded, idempotent, additive.
-- Adds the job fields the existing schema lacks (external apply link, deadline,
-- requisition id, category, qualification, shift, benefits, summary,
-- responsibilities, candidate note) and seeds one job: Flex - Junior Engineer,
-- Engineering Change Management (Pune).
--
-- Mapping onto existing columns:
--   "About the role"     -> jobs.description        (paragraph)
--   "What they're looking for" -> jobs.requirements (text[], one per bullet)
--   "About the company"  -> companies.about          (company id 'flex')
--   "Posted on"          -> jobs.posted_at
--   NEW: apply_url, application_deadline, requisition_id, category,
--        qualification, shift, benefits[], summary, responsibilities[],
--        candidate_note

do $$
begin
  if to_regclass('public.jobs') is null then
    return;
  end if;

  alter table public.jobs add column if not exists apply_url            text;
  alter table public.jobs add column if not exists application_deadline timestamptz;
  alter table public.jobs add column if not exists requisition_id       text;
  alter table public.jobs add column if not exists category             text;
  alter table public.jobs add column if not exists qualification        text;
  alter table public.jobs add column if not exists shift                text;
  alter table public.jobs add column if not exists benefits             text[] not null default '{}';
  alter table public.jobs add column if not exists summary              text;
  alter table public.jobs add column if not exists responsibilities     text[] not null default '{}';
  alter table public.jobs add column if not exists candidate_note       text;

  if not exists (select 1 from pg_constraint where conname = 'jobs_apply_url_http_check') then
    alter table public.jobs add constraint jobs_apply_url_http_check
      check (apply_url is null or apply_url ~* '^https?://');
  end if;

  create index if not exists jobs_application_deadline_idx on public.jobs (application_deadline);
end $$;

-- ---- seed: company + job (only when the tables exist) ----------------------
do $$
begin
  if to_regclass('public.jobs') is null or to_regclass('public.companies') is null then
    return;
  end if;

  insert into public.companies (id, name, about)
  values (
    'flex',
    'Flex (Flextronics)',
    'Flex is a large contract manufacturer that designs and builds products for well-known global brands. Its Pune team supports manufacturing sites around the world, so you''ll be working with engineers across different locations and time zones.'
  )
  on conflict (id) do update set name = excluded.name, about = excluded.about;

  insert into public.jobs (
    id, title, company_id, company_name, location, job_type, status,
    summary, description, responsibilities, requirements, skills, experience,
    qualification, shift, benefits, category, requisition_id,
    apply_url, application_deadline, candidate_note, posted_at
  ) values (
    'flex-junior-engineer-ecm-wd228947',
    'Junior Engineer – Engineering Change Management',
    'flex',
    'Flex (Flextronics)',
    'Pune, India',
    'Full Time',
    'open',
    'Flex is hiring a Junior Engineer in Pune to handle engineering changes, BOMs and part data for products built across its global factories. Good fit if you have a year or more of NPI or ECO experience in electronics manufacturing.',
    'When a product changes, even slightly, someone has to make sure every factory builds the updated version correctly. That''s what this role is about. You''ll track engineering change orders from start to finish, keep part numbers and BOMs accurate, and make sure production teams always have the right information in hand.',
    array[
      'Setting up part numbers, BOMs and approved vendor lists in Agile PLM and Baan',
      'Collecting customer documents like product specs and releasing them in the document control system',
      'Acting as the change analyst when new products are being introduced (NPI)',
      'Releasing part lists to the production floor for new models and after changes go live',
      'Creating, reviewing, routing and releasing ECOs in Agile PLM for sites worldwide',
      'Reading through ECOs and drawings carefully and following up with site process and product engineers',
      'Working with engineering and materials teams whenever a product is updated',
      'Answering questions from internal teams and customers about change orders',
      'Keeping your work on track against the team''s process targets'
    ],
    array[
      'B.E. in EEE or ECE with at least 1 year as an NPI or ECO engineer in a manufacturing setup (EMS background is a plus)',
      'Real, hands-on experience with NPI, ECO handling, BOM management and a PLM tool',
      'Strong spoken and written English — this is a must',
      'Comfort with MS Office and Outlook',
      'A sharp eye for detail and good problem-solving ability',
      'Ability to guide juniors, handle disagreements calmly and lead when needed',
      'Willingness to work night shifts'
    ],
    array['NPI','ECO','BOM','PLM','Agile PLM','Baan','Change Management','EMS','MS Office'],
    '1+ years',
    'B.E. in EEE or ECE',
    'Night shift required',
    array['Health insurance','Paid time off'],
    'Production Engineering',
    'WD228947',
    'https://flextronics.wd1.myworkdayjobs.com/Careers/job/India-Pune/Junior-Engineer---Engineering-Change-Management_WD228947',
    timestamptz '2026-09-22 23:59:59+05:30',
    'Flex never asks for money at any stage of hiring. If anyone requests a fee, it''s a scam.',
    timestamptz '2026-09-18 00:00:00+05:30'
  )
  on conflict (id) do update set
    title = excluded.title, company_id = excluded.company_id, company_name = excluded.company_name,
    location = excluded.location, job_type = excluded.job_type, status = excluded.status,
    summary = excluded.summary, description = excluded.description,
    responsibilities = excluded.responsibilities, requirements = excluded.requirements,
    skills = excluded.skills, experience = excluded.experience, qualification = excluded.qualification,
    shift = excluded.shift, benefits = excluded.benefits, category = excluded.category,
    requisition_id = excluded.requisition_id, apply_url = excluded.apply_url,
    application_deadline = excluded.application_deadline, candidate_note = excluded.candidate_note,
    posted_at = excluded.posted_at;
end $$;

notify pgrst, 'reload schema';

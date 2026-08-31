-- ============================================================================
-- 006_resume_admin.sql — resume-template CRUD fields, ATS rules, categories
-- ============================================================================
-- Apply after 001–005 (SQL Editor). Additive + guarded + re-runnable.
-- ----------------------------------------------------------------------------

-- --- relax the fixed-id CHECKs so admins can add their own templates ------
do $$ begin
  if to_regclass('public.resume_templates') is not null then
    alter table public.resume_templates drop constraint if exists resume_templates_id_check;
    alter table public.resume_templates add column if not exists category          text    not null default 'General';
    alter table public.resume_templates add column if not exists preview_image_url text;
    alter table public.resume_templates add column if not exists features          jsonb   not null default '[]'::jsonb;
    alter table public.resume_templates add column if not exists status            text    not null default 'active';
    if not exists (select 1 from pg_constraint where conname = 'resume_templates_status_check') then
      alter table public.resume_templates add constraint resume_templates_status_check
        check (status in ('active', 'inactive'));
    end if;
  end if;

  if to_regclass('public.resumes_builder') is not null then
    -- a student may now pick any admin-created template id
    alter table public.resumes_builder drop constraint if exists resumes_builder_template_check;
  end if;
end $$;

-- --- resume_template_categories (Module 7 "Template Categories") --------
create table if not exists public.resume_template_categories (
  id         text        primary key,
  name       text        not null,
  slug       text        not null unique,
  status     text        not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists resume_template_categories_set_updated_at on public.resume_template_categories;
create trigger resume_template_categories_set_updated_at
  before update on public.resume_template_categories
  for each row execute function public.set_updated_at();

alter table public.resume_template_categories enable row level security;
drop policy if exists "rtc_select_public" on public.resume_template_categories;
create policy "rtc_select_public" on public.resume_template_categories for select using (true);
drop policy if exists "rtc_admin_all" on public.resume_template_categories;
create policy "rtc_admin_all" on public.resume_template_categories
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

insert into public.resume_template_categories (id, name, slug, sort_order) values
  ('general', 'General', 'general', 1),
  ('technical', 'Technical', 'technical', 2),
  ('creative', 'Creative', 'creative', 3),
  ('executive', 'Executive', 'executive', 4),
  ('fresher', 'Fresher', 'fresher', 5)
on conflict (id) do nothing;

-- --- ats_rules (Module 7 "ATS Rules & Guidelines") -------------------
create table if not exists public.ats_rules (
  id         text        primary key,
  section    text        not null
               check (section in ('profile_summary', 'work_experience', 'education', 'skills', 'formatting', 'general')),
  rule       text        not null,
  guideline  text        not null default '',
  importance text        not null default 'medium'
               check (importance in ('low', 'medium', 'high', 'critical')),
  is_active  boolean     not null default true,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists ats_rules_set_updated_at on public.ats_rules;
create trigger ats_rules_set_updated_at
  before update on public.ats_rules
  for each row execute function public.set_updated_at();

alter table public.ats_rules enable row level security;
drop policy if exists "ats_rules_select_public" on public.ats_rules;
create policy "ats_rules_select_public" on public.ats_rules for select using (true);
drop policy if exists "ats_rules_admin_all" on public.ats_rules;
create policy "ats_rules_admin_all" on public.ats_rules
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

insert into public.ats_rules (id, section, rule, guideline, importance, sort_order) values
  ('ps-1', 'profile_summary', 'Keep the summary to 3–4 lines', 'Recruiters skim; lead with role, years and top skills.', 'high', 1),
  ('we-1', 'work_experience', 'Start bullets with an action verb', 'e.g. "Built", "Led", "Reduced" — not "Responsible for".', 'high', 2),
  ('we-2', 'work_experience', 'Quantify impact', 'Add numbers: %, ₹, time saved, users.', 'critical', 3),
  ('ed-1', 'education', 'List most recent degree first', 'Include institution, year and CGPA if strong.', 'medium', 4),
  ('sk-1', 'skills', 'Group skills by category', 'Languages, Frameworks, Tools, Databases.', 'medium', 5),
  ('fmt-1', 'formatting', 'Use a single-column layout', 'Multi-column resumes confuse many ATS parsers.', 'critical', 6),
  ('fmt-2', 'formatting', 'Avoid tables, text boxes and images', 'Parsers often drop their contents.', 'high', 7),
  ('gen-1', 'general', 'Match keywords from the job description', 'Mirror the exact phrasing where truthful.', 'high', 8)
on conflict (id) do nothing;

-- --- storage bucket for template previews --------------------------
insert into storage.buckets (id, name, public)
values ('resume-templates', 'resume-templates', true)
on conflict (id) do nothing;

drop policy if exists "resume_templates_admin_write" on storage.objects;
create policy "resume_templates_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'resume-templates' and public.is_admin(auth.uid()))
  with check (bucket_id = 'resume-templates' and public.is_admin(auth.uid()));

notify pgrst, 'reload schema';

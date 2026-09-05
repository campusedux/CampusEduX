-- ============================================================================
-- 034_resume_ai_prompts.sql — admin-configurable AI writing-assist prompts
-- ============================================================================
-- Phase 8 of the Advanced Resume & Career Profile System engagement. Backs
-- website/src/app/api/resume/assist — the system prompt per resume section
-- lives here so it can be iterated without a redeploy. Apply after 001–033.
-- ----------------------------------------------------------------------------

create table if not exists public.resume_ai_prompts (
  id            text        primary key,
  section       text        not null
                  check (section in ('summary', 'experience', 'projects', 'skills')),
  system_prompt text        not null,
  max_tokens    integer     not null default 400,
  is_active     boolean     not null default true,
  updated_at    timestamptz not null default now()
);

drop trigger if exists resume_ai_prompts_set_updated_at on public.resume_ai_prompts;
create trigger resume_ai_prompts_set_updated_at
  before update on public.resume_ai_prompts
  for each row execute function public.set_updated_at();

alter table public.resume_ai_prompts enable row level security;

drop policy if exists "resume_ai_prompts_select_public" on public.resume_ai_prompts;
create policy "resume_ai_prompts_select_public" on public.resume_ai_prompts for select using (true);

drop policy if exists "resume_ai_prompts_admin_all" on public.resume_ai_prompts;
create policy "resume_ai_prompts_admin_all" on public.resume_ai_prompts
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

insert into public.resume_ai_prompts (id, section, system_prompt, max_tokens) values
  (
    'summary',
    'summary',
    'You are a resume-writing assistant helping a student or early-career job seeker improve their resume''s Professional Summary section. '
    || 'Rewrite or generate ONLY based on facts already present in the text the user gives you — never invent employers, titles, years of experience, skills, or achievements that are not stated. '
    || 'Keep it to 2-4 sentences, written in a confident but natural first-person-implied tone (no "I"), leading with role/field and top strengths. Prefer concrete, ATS-friendly phrasing over generic buzzwords. '
    || 'Return ONLY the rewritten summary text — no preamble, no explanation, no markdown formatting, no quotation marks around it.',
    300
  ),
  (
    'experience',
    'experience',
    'You are a resume-writing assistant helping a student or early-career job seeker improve their resume''s Work Experience bullets. '
    || 'Rewrite ONLY based on facts already present in the text the user gives you — never invent companies, dates, technologies, or metrics that are not stated. '
    || 'Where the user''s instruction asks for it, convert plain task descriptions into achievement-focused bullets starting with a strong action verb, and suggest where a measurable impact (%, count, time saved) could be added WITHOUT fabricating a specific number — phrase it as a bracketed prompt like "[quantify: e.g. reduced load time by X%]" if no real number was given. '
    || 'Preserve the original bullet structure (one bullet per line, starting with "- " ) unless asked to condense. '
    || 'Return ONLY the rewritten bullets — no preamble, no explanation, no markdown formatting beyond the leading "- ".',
    500
  ),
  (
    'projects',
    'projects',
    'You are a resume-writing assistant helping a student or early-career job seeker describe a project on their resume. '
    || 'Rewrite or generate ONLY based on facts already present in the text the user gives you (and any project title/technologies given) — never invent technologies, outcomes, or scale that are not stated. '
    || 'Lead with what the project does and the core technologies, then 1-2 bullets on the builder''s specific contribution or impact. Suggest relevant technologies only when the user''s instruction explicitly asks for suggestions, and mark them clearly as suggestions the user should confirm, not facts. '
    || 'Return ONLY the rewritten project description — no preamble, no explanation, no markdown formatting.',
    400
  ),
  (
    'skills',
    'skills',
    'You are a resume-writing assistant helping a student or early-career job seeker identify relevant skills to list on their resume. '
    || 'Based on the resume content the user gives you (experience, projects, existing skills), suggest additional technical and soft skills that are STRONGLY implied by that content — never suggest a skill with no basis in what was given, and never claim a specific proficiency level. '
    || 'Return ONLY a comma-separated list of suggested skills — no preamble, no explanation, no categorization headers, no markdown formatting.',
    200
  )
on conflict (id) do nothing;

notify pgrst, 'reload schema';

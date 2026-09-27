-- ============================================================================
-- 0127_restore_resume_admin_tables.sql — restore resume_ai_prompts +
-- resume_share_reports into the mobile-app migration chain   (mobile-only; no admin twin)
-- ============================================================================
-- These two tables/functions were only ever defined in admin-panel migrations
-- 034_resume_ai_prompts.sql and 035_resume_shares_admin.sql, which are absent
-- from the mobile-app chain. Live source (admin-panel/src/lib/resume/queries.ts,
-- admin-panel/src/app/(panel)/resume/actions.ts, website/src/lib/resumeBuilder/
-- aiAssist.ts) reads/writes both tables, so they must exist wherever this
-- chain is the source of truth.
--
-- SCOPE: tables + seed rows + report_shared_resume() ONLY. Every statement is
-- idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING / CREATE OR REPLACE), so on
-- a database where admin 034/035 already ran, this file changes nothing.
--
-- NO POLICIES ARE CREATED HERE. Row access on resume_ai_prompts,
-- resume_share_reports and resume_shares is owned by admin 034/035 as rewritten
-- by 0119_admin_permission_enforcement (SELECT = is_admin(), INSERT/UPDATE/DELETE
-- = has_permission('resume', add|edit|delete)). The admin-panel originals'
-- `*_admin_all FOR ALL USING (is_admin())` policies are deliberately NOT
-- restored: re-creating them after 0119 would let a `viewer` admin write these
-- tables again (regression of DB-07 / ADM-01).
-- RLS is still ENABLED on both tables, so that on a database where this file is
-- the first to create them they fail CLOSED (no policy = no anon/authenticated
-- access) instead of open.
--
-- Depends on: public.set_updated_at() (mobile 0001), public.resume_shares
-- (mobile 0060_resume_shares.sql).
-- ----------------------------------------------------------------------------

-- --- from admin-panel/034_resume_ai_prompts.sql -----------------------------

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

-- --- from admin-panel/035_resume_shares_admin.sql ---------------------------

create table if not exists public.resume_share_reports (
  id            uuid        primary key default gen_random_uuid(),
  share_id      uuid        not null references public.resume_shares (id) on delete cascade,
  reason        text        not null,
  status        text        not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create index if not exists resume_share_reports_status_idx on public.resume_share_reports (status, created_at desc);

-- Deliberately NO anon/authenticated policy at all — the table is
-- unreadable and uninsertable by anyone except an admin (0119 policies), or
-- through the narrow report_shared_resume() function below (SECURITY DEFINER).
alter table public.resume_share_reports enable row level security;

-- The only way an anonymous visitor can create a report row — validates the
-- token maps to an active share first, so a report can't be attached to an
-- arbitrary/forged share_id. No service-role key needed on the website for
-- this at all; the website calls this RPC directly with the anon key.
create or replace function public.report_shared_resume(p_token text, p_reason text)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
declare
  share_row public.resume_shares%rowtype;
begin
  select * into share_row from public.resume_shares where token = p_token and is_active;
  if not found then
    return false;
  end if;

  -- Best-effort throttle: an anon caller can retry this freely (no session,
  -- no per-IP tracking available inside a plain SQL function), so silently
  -- no-op a repeat report on the same share within an hour instead of
  -- letting a refresh loop flood the moderation queue with duplicates.
  if exists (
    select 1 from public.resume_share_reports
    where share_id = share_row.id and created_at > now() - interval '1 hour'
  ) then
    return true;
  end if;
  insert into public.resume_share_reports (share_id, reason) values (share_row.id, left(coalesce(p_reason, ''), 500));
  return true;
end;
$$;

revoke all on function public.report_shared_resume(text, text) from public;
grant execute on function public.report_shared_resume(text, text) to anon, authenticated;

notify pgrst, 'reload schema';

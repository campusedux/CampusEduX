-- Frontend-completion follow-up to 0062.
--
--   resumes_builder.is_demo boolean  — true right after a résumé is created
--     from a template (it holds that template's demo persona). The editor
--     shows a "Demo content" banner until the student clears it, imports
--     their CampusEduX profile over it, or dismisses it. Never shared.
--
--   resumes_builder.design jsonb  — per-résumé design overrides on top of the
--     chosen template's spec: { accentColor?, fontFamily?, fontScale?,
--     spacing?, margin?, headingStyle? }. Clamped to ATS-safe ranges by the
--     Server Action before it is written. Included in get_shared_resume() so
--     a shared résumé keeps the look its owner gave it.
--
-- Additive only — no backfill, no scoring/JD/version changes.
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- Apply AFTER 0062.

alter table public.resumes_builder add column if not exists is_demo boolean not null default false;
alter table public.resumes_builder add column if not exists design  jsonb   not null default '{}'::jsonb;

-- get_shared_resume(): add `design` to the hand-picked projection. Everything
-- else about this function is unchanged from 0062 (still the only anon-read
-- path; still returns null for an invalid/expired/revoked token; is_demo is
-- deliberately NOT exposed).
create or replace function public.get_shared_resume(p_token text)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  share_row  public.resume_shares%rowtype;
  resume_row public.resumes_builder%rowtype;
begin
  select * into share_row
  from public.resume_shares
  where token = p_token and is_active and (expires_at is null or expires_at > now());
  if not found then
    return null;
  end if;

  select * into resume_row from public.resumes_builder where id = share_row.resume_id;
  if not found then
    return null;
  end if;

  update public.resume_shares set view_count = view_count + 1 where id = share_row.id;

  return jsonb_build_object(
    'title', resume_row.title,
    'template', resume_row.template,
    'design', resume_row.design,
    'personalDetails', resume_row.personal_details,
    'content', resume_row.content,
    'education', resume_row.education,
    'skills', resume_row.skills,
    'sections', resume_row.sections,
    'layout', resume_row.layout,
    'updatedAt', resume_row.updated_at
  );
end;
$$;

revoke all on function public.get_shared_resume(text) from public;
grant execute on function public.get_shared_resume(text) to anon, authenticated;

notify pgrst, 'reload schema';

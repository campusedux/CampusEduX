-- Phase 1 of the Advanced Resume & Career Profile System engagement.
--
-- 1. profiles gains social/coding-profile links so the Resume Builder can
--    prefill a new resume instead of always starting blank (closes the gap
--    found in src/services/resume.service.ts's EMPTY_PERSONAL).
-- 2. resumes_builder gains a `layout` column (section order/visibility) so
--    the website editor (Phase 4) can add/remove/reorder/hide sections
--    without a schema change later.
-- 3. ats_rules (admin-managed, 006_resume_admin.sql) gains an optional
--    `check_key` so a small set of admin-authored rules can be mechanically
--    evaluated against a resume's real content; any rule without a
--    recognised check_key is still surfaced as general guidance (see
--    compute_ats_breakdown below) rather than silently ignored.
-- 4. Two new functions replace the mobile client's hardcoded
--    computeATSBreakdown() (src/services/resume.service.ts:64-92) with a
--    single source of truth callable via supabase.rpc(...) from mobile,
--    website and any future client — admins editing ats_rules changes the
--    guidance shown everywhere with no app redeploy.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

-- ---------------------------------------------------------------------------
-- 1. profiles: social / coding-profile links
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists linkedin_url    text;
alter table public.profiles add column if not exists github_url     text;
alter table public.profiles add column if not exists portfolio_url  text;
alter table public.profiles add column if not exists coding_profiles jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- 2. resumes_builder: section order/visibility
-- ---------------------------------------------------------------------------
alter table public.resumes_builder add column if not exists layout jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 3. ats_rules: optional mechanical-check mapping
-- ---------------------------------------------------------------------------
do $$ begin
  if to_regclass('public.ats_rules') is not null then
    alter table public.ats_rules add column if not exists check_key text;
  end if;
end $$;

-- Best-effort mapping for the 8 seed rules from 006_resume_admin.sql. Only
-- backfilled when unset, so an admin who has already customised a rule's
-- check_key (once the admin UI exposes it) is never overwritten.
update public.ats_rules set check_key = 'summary_present'   where id = 'ps-1'  and check_key is null;
update public.ats_rules set check_key = 'has_action_verbs'  where id = 'we-1'  and check_key is null;
update public.ats_rules set check_key = 'quantified_impact' where id = 'we-2'  and check_key is null;
update public.ats_rules set check_key = 'has_education'     where id = 'ed-1'  and check_key is null;
update public.ats_rules set check_key = 'skills_grouped'    where id = 'sk-1'  and check_key is null;
update public.ats_rules set check_key = 'single_column_safe' where id = 'fmt-1' and check_key is null;
update public.ats_rules set check_key = 'single_column_safe' where id = 'fmt-2' and check_key is null;
-- gen-1 ("match keywords from the job description") has no check_key: it is
-- only mechanically checkable once a JD is supplied (Phase 6's
-- match_resume_to_jd), so it stays general, always-shown guidance here.

-- ---------------------------------------------------------------------------
-- 4a. Shared keyword tokenizer (also used by Phase 6's JD matching)
-- ---------------------------------------------------------------------------
create or replace function public.tokenize_keywords(p_text text)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(distinct word), array[]::text[])
  from (
    select word
    from regexp_split_to_table(
      regexp_replace(lower(coalesce(p_text, '')), '[^a-z0-9]+', ' ', 'g'),
      '\s+'
    ) as word
    where length(word) > 2
      and word <> all (array[
        'the','and','for','with','from','that','this','have','was','were','are','you','your',
        'our','their','into','over','under','than','then','also','been','being','will','shall',
        'can','could','would','should','not','but','all','any','each','more','most','some','such',
        'only','own','same','too','very','just','about','after','before','while','during','when',
        'where','which','who','whom','why','how'
      ])
  ) t;
$$;

revoke all on function public.tokenize_keywords(text) from public;
grant execute on function public.tokenize_keywords(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4b. Real ATS scoring engine
--
-- SECURITY INVOKER (the default): runs as the calling user, so the initial
-- select/update against resumes_builder still goes through its existing
-- owner-only RLS policies unchanged — this function grants no new access,
-- it only centralises scoring logic that used to live in the mobile client.
-- ---------------------------------------------------------------------------
create or replace function public.compute_ats_breakdown(p_resume_id uuid)
returns jsonb
language plpgsql
as $$
declare
  r                public.resumes_builder%rowtype;
  personal         jsonb;
  sections         jsonb;
  skills           jsonb;
  education        jsonb;
  filled_personal  int;
  content_sections int;
  content_score    int;
  formatting_score int := 80; -- matches the old client heuristic (a template is always set)
  total_skills     int;
  skills_score     int;
  combined_text    text;
  keyword_list     text[] := array['developed','built','led','designed','implemented','improved','team','project','api','database'];
  keyword_hits     int;
  keywords_score   int;
  quantified       boolean;
  overall          int;
  tips             jsonb := '[]'::jsonb;
  ar               record;
  rule_met         boolean;
begin
  select * into r from public.resumes_builder where id = p_resume_id;
  if not found then
    raise exception 'resume % not found or not accessible', p_resume_id;
  end if;

  personal  := coalesce(r.personal_details, '{}'::jsonb);
  sections  := coalesce(r.sections, '{}'::jsonb);
  skills    := coalesce(r.skills, '{"technical":[],"soft":[]}'::jsonb);
  education := coalesce(r.education, '[]'::jsonb);

  filled_personal :=
    (case when nullif(personal->>'fullName', '') is not null then 1 else 0 end) +
    (case when nullif(personal->>'jobTitle', '') is not null then 1 else 0 end) +
    (case when nullif(personal->>'email', '')    is not null then 1 else 0 end) +
    (case when nullif(personal->>'phone', '')    is not null then 1 else 0 end) +
    (case when nullif(personal->>'location', '') is not null then 1 else 0 end);

  content_sections :=
    (case when length(trim(coalesce(sections->>'summary', '')))    > 20 then 1 else 0 end) +
    (case when length(trim(coalesce(sections->>'experience', ''))) > 20 then 1 else 0 end) +
    (case when length(trim(coalesce(sections->>'projects', '')))   > 20 then 1 else 0 end);

  content_score := round((filled_personal::numeric / 5) * 40 + (content_sections::numeric / 3) * 60);

  total_skills := coalesce(jsonb_array_length(skills->'technical'), 0) + coalesce(jsonb_array_length(skills->'soft'), 0);
  skills_score := least(100, round((total_skills::numeric / 10) * 100));

  combined_text := lower(
    coalesce(sections->>'summary', '') || ' ' ||
    coalesce(sections->>'experience', '') || ' ' ||
    coalesce(sections->>'projects', '')
  );

  select count(*) into keyword_hits from unnest(keyword_list) k where combined_text like '%' || k || '%';

  keywords_score := least(100, round((keyword_hits::numeric / array_length(keyword_list, 1)) * 100)
    + (case when jsonb_array_length(education) > 0 then 10 else 0 end));

  quantified := combined_text ~ '[0-9]';

  overall := least(100, round(content_score * 0.35 + formatting_score * 0.15 + skills_score * 0.25 + keywords_score * 0.25));

  update public.resumes_builder set ats_score = overall where id = p_resume_id;

  -- Dynamic guidance: for each active admin-authored rule, show it as a tip
  -- when either (a) it has a recognised check_key and the resume currently
  -- fails that check, or (b) it has no check_key at all, meaning it is
  -- general guidance no automated check can honestly claim to verify —
  -- `checked` tells the UI which case it is, so it never overstates what
  -- was actually detected.
  for ar in
    select id, section, rule, guideline, importance, check_key
    from public.ats_rules
    where is_active
    order by
      case importance when 'critical' then 0 when 'high' then 1 when 'medium' then 2 else 3 end,
      sort_order
  loop
    rule_met := null;
    if ar.check_key = 'has_action_verbs' then
      rule_met := keyword_hits > 0;
    elsif ar.check_key = 'quantified_impact' then
      rule_met := quantified;
    elsif ar.check_key = 'summary_present' then
      rule_met := length(trim(coalesce(sections->>'summary', ''))) > 20;
    elsif ar.check_key = 'has_education' then
      rule_met := jsonb_array_length(education) > 0;
    elsif ar.check_key = 'skills_grouped' then
      rule_met := coalesce(jsonb_array_length(skills->'technical'), 0) > 0
        and coalesce(jsonb_array_length(skills->'soft'), 0) > 0;
    elsif ar.check_key = 'single_column_safe' then
      rule_met := true; -- structural guarantee of our own generated templates
    end if;

    if rule_met is distinct from true then
      tips := tips || jsonb_build_object(
        'ruleId', ar.id,
        'section', ar.section,
        'problem', ar.rule,
        'why', ar.guideline,
        'importance', ar.importance,
        'checked', ar.check_key is not null
      );
    end if;
  end loop;

  if jsonb_array_length(tips) = 0 then
    tips := jsonb_build_array(jsonb_build_object(
      'ruleId', null, 'section', 'general',
      'problem', 'Great! Your resume has a high chance of passing ATS screening.',
      'why', '', 'importance', 'low', 'checked', true
    ));
  end if;

  return jsonb_build_object(
    'overall', overall,
    'content', content_score,
    'formatting', formatting_score,
    'skills', skills_score,
    'keywords', keywords_score,
    'tips', tips
  );
end;
$$;

revoke all on function public.compute_ats_breakdown(uuid) from public;
grant execute on function public.compute_ats_breakdown(uuid) to authenticated;

notify pgrst, 'reload schema';

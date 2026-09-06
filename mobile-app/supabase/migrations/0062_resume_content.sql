-- Follow-up to the Advanced Resume & Career Profile System engagement.
--
-- Turns resumes_builder into a structured, extensible section model:
--
--   resumes_builder.content jsonb  — an ORDERED array of section blocks
--     [{ id, type, heading, variant: text|entries|tags|links, hidden,
--        text? | entries?[] | groups?[] | links?[] }]
--
--   `type` is open-ended (summary, objective, experience, internships,
--   education, skills, projects, certifications, achievements, awards,
--   publications, research, volunteer, leadership, languages, interests,
--   coding_profiles, social_links, references, custom …). The legacy
--   columns (sections / education / skills / layout) are KEPT and are still
--   written by the apps as a derived projection, so an app build that
--   predates `content` keeps working during the rollout — but `content` is
--   the source of truth everything new reads.
--
-- Also:
--   * compute_ats_breakdown() now scores from `content` and returns two new
--     categories — completeness + readability.
--   * match_resume_to_jd() reads its resume text from `content`.
--   * restore_resume_version() / get_shared_resume() carry `content`.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- Apply AFTER 0057..0061. Idempotent + re-runnable.

-- ---------------------------------------------------------------------------
-- 1. the column
-- ---------------------------------------------------------------------------
alter table public.resumes_builder add column if not exists content jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- 2. one-time backfill: build `content` from the legacy columns for every row
--    that doesn't have it yet. Mirrors the client's normalizeContent() legacy
--    branch (website lib/resumeBuilder/content.ts) exactly.
-- ---------------------------------------------------------------------------
create or replace function public.resume_content_from_legacy(
  p_sections jsonb, p_education jsonb, p_skills jsonb, p_layout jsonb
) returns jsonb
language plpgsql
as $$
declare
  v_sections   jsonb := coalesce(p_sections, '{}'::jsonb);
  v_education   jsonb := coalesce(p_education, '[]'::jsonb);
  v_skills      jsonb := coalesce(p_skills, '{"technical":[],"soft":[]}'::jsonb);
  v_default     text[] := array['summary','education','skills','experience','projects','certifications','achievements','languages','references'];
  v_text_keys   text[] := array['summary','experience','projects','certifications','achievements','languages','references'];
  v_labels      jsonb := jsonb_build_object(
                   'summary','Professional Summary','experience','Work Experience','projects','Projects',
                   'certifications','Certifications','achievements','Achievements','languages','Languages',
                   'references','References');
  v_order       text[];
  v_hidden      text[];
  v_key         text;
  v_result      jsonb := '[]'::jsonb;
  v_entries     jsonb;
  v_groups      jsonb;
  v_tech        jsonb;
  v_soft        jsonb;
  v_txt         text;
  v_hidden_flag boolean;
  e             jsonb;
begin
  select coalesce(array_agg(x), array[]::text[]) into v_order
  from jsonb_array_elements_text(coalesce(p_layout->'order','[]'::jsonb)) x
  where x = any(v_default);
  v_order := v_order || array(select k from unnest(v_default) k where not (k = any(coalesce(v_order, array[]::text[]))));

  select coalesce(array_agg(x), array[]::text[]) into v_hidden
  from jsonb_array_elements_text(coalesce(p_layout->'hidden','[]'::jsonb)) x;

  foreach v_key in array v_order loop
    v_hidden_flag := v_key = any(v_hidden);

    if v_key = 'education' then
      if coalesce(jsonb_array_length(v_education), 0) = 0 then continue; end if;
      v_entries := '[]'::jsonb;
      for e in select value from jsonb_array_elements(v_education) loop
        v_entries := v_entries || jsonb_build_object(
          'id', coalesce(nullif(e->>'id',''), 'ent-' || replace(gen_random_uuid()::text, '-', '')),
          'title', coalesce(e->>'degree',''),
          'subtitle', coalesce(e->>'institution',''),
          'location', '',
          'startDate', coalesce(e->>'startYear',''),
          'endDate', coalesce(e->>'endYear',''),
          'description', case when coalesce(e->>'percentage','') <> '' then 'Score: ' || (e->>'percentage') else '' end,
          'url', '',
          'tags', '[]'::jsonb
        );
      end loop;
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'id', 'blk-' || replace(gen_random_uuid()::text, '-', ''),
        'type', 'education', 'variant', 'entries', 'heading', 'Education',
        'hidden', v_hidden_flag, 'entries', v_entries));

    elsif v_key = 'skills' then
      v_tech := coalesce(v_skills->'technical', '[]'::jsonb);
      v_soft := coalesce(v_skills->'soft', '[]'::jsonb);
      if coalesce(jsonb_array_length(v_tech),0) = 0 and coalesce(jsonb_array_length(v_soft),0) = 0 then continue; end if;
      v_groups := '[]'::jsonb;
      if coalesce(jsonb_array_length(v_tech),0) > 0 then
        v_groups := v_groups || jsonb_build_array(jsonb_build_object('id','grp-'||replace(gen_random_uuid()::text,'-',''),'label','Technical','items',v_tech));
      end if;
      if coalesce(jsonb_array_length(v_soft),0) > 0 then
        v_groups := v_groups || jsonb_build_array(jsonb_build_object('id','grp-'||replace(gen_random_uuid()::text,'-',''),'label','Soft','items',v_soft));
      end if;
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'id', 'blk-' || replace(gen_random_uuid()::text, '-', ''),
        'type', 'skills', 'variant', 'tags', 'heading', 'Technical Skills',
        'hidden', v_hidden_flag, 'groups', v_groups));

    elsif v_key = any(v_text_keys) then
      v_txt := coalesce(v_sections->>v_key, '');
      if length(trim(v_txt)) = 0 then continue; end if;
      v_result := v_result || jsonb_build_array(jsonb_build_object(
        'id', 'blk-' || replace(gen_random_uuid()::text, '-', ''),
        'type', v_key, 'variant', 'text', 'heading', coalesce(v_labels->>v_key, initcap(v_key)),
        'hidden', v_hidden_flag, 'text', v_txt));
    end if;
  end loop;

  return v_result;
end;
$$;

-- migration-only helper — no client needs to call it directly.
revoke all on function public.resume_content_from_legacy(jsonb, jsonb, jsonb, jsonb) from public;

update public.resumes_builder
set content = public.resume_content_from_legacy(sections, education, skills, layout)
where content = '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- 3. shared text extractor — flattens the chosen block types of a `content`
--    array to plain text, for the ATS + JD-match engines.
-- ---------------------------------------------------------------------------
create or replace function public.resume_section_text(p_content jsonb, p_types text[])
returns text
language sql
immutable
as $$
  select coalesce(string_agg(part, ' '), '')
  from (
    select
      case b->>'variant'
        when 'text' then coalesce(b->>'text','')
        when 'entries' then coalesce((
          select string_agg(
            coalesce(e->>'title','') || ' ' || coalesce(e->>'subtitle','') || ' ' || coalesce(e->>'description','') || ' ' ||
            coalesce((select string_agg(tg, ' ') from jsonb_array_elements_text(coalesce(e->'tags','[]'::jsonb)) tg), ''), ' ')
          from jsonb_array_elements(coalesce(b->'entries','[]'::jsonb)) e), '')
        when 'tags' then coalesce((
          select string_agg(it, ' ')
          from jsonb_array_elements(coalesce(b->'groups','[]'::jsonb)) g
          cross join jsonb_array_elements_text(coalesce(g->'items','[]'::jsonb)) it), '')
        when 'links' then coalesce((
          select string_agg(coalesce(l->>'label','') || ' ' || coalesce(l->>'url',''), ' ')
          from jsonb_array_elements(coalesce(b->'links','[]'::jsonb)) l), '')
        else ''
      end as part
    from jsonb_array_elements(coalesce(p_content, '[]'::jsonb)) b
    where b->>'type' = any(p_types)
  ) s;
$$;

revoke all on function public.resume_section_text(jsonb, text[]) from public;
grant execute on function public.resume_section_text(jsonb, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. ATS scoring engine — now reads `content`, adds completeness + readability
-- ---------------------------------------------------------------------------
create or replace function public.compute_ats_breakdown(p_resume_id uuid)
returns jsonb
language plpgsql
as $$
declare
  r                public.resumes_builder%rowtype;
  personal         jsonb;
  v_content        jsonb;
  summary_txt      text;
  exp_txt          text;
  proj_txt         text;
  combined_text    text;
  filled_personal  int;
  content_sections int;
  content_score    int;
  formatting_score int := 80;
  total_skills     int;
  skills_score     int;
  has_tech         boolean;
  has_soft         boolean;
  edu_present      boolean;
  keyword_list     text[] := array['developed','built','led','designed','implemented','improved','team','project','api','database'];
  keyword_hits     int;
  keywords_score   int;
  quantified       boolean;
  completeness     int;
  readability      int;
  long_lines       int;
  filled_core      int;
  overall          int;
  tips             jsonb := '[]'::jsonb;
  ar               record;
  rule_met         boolean;
begin
  select * into r from public.resumes_builder where id = p_resume_id;
  if not found then
    raise exception 'resume % not found or not accessible', p_resume_id;
  end if;

  personal   := coalesce(r.personal_details, '{}'::jsonb);
  v_content  := coalesce(r.content, '[]'::jsonb);
  summary_txt := public.resume_section_text(v_content, array['summary','objective']);
  exp_txt     := public.resume_section_text(v_content, array['experience','internships']);
  proj_txt    := public.resume_section_text(v_content, array['projects']);
  combined_text := lower(coalesce(summary_txt,'') || ' ' || coalesce(exp_txt,'') || ' ' || coalesce(proj_txt,''));

  total_skills := coalesce((
    select sum(coalesce(jsonb_array_length(g->'items'), 0))::int
    from jsonb_array_elements(v_content) b
    cross join jsonb_array_elements(coalesce(b->'groups','[]'::jsonb)) g
    where b->>'type' = 'skills'
  ), 0);
  has_tech := exists (
    select 1 from jsonb_array_elements(v_content) b
    cross join jsonb_array_elements(coalesce(b->'groups','[]'::jsonb)) g
    where b->>'type' = 'skills' and lower(coalesce(g->>'label','')) not like '%soft%' and coalesce(jsonb_array_length(g->'items'),0) > 0);
  has_soft := exists (
    select 1 from jsonb_array_elements(v_content) b
    cross join jsonb_array_elements(coalesce(b->'groups','[]'::jsonb)) g
    where b->>'type' = 'skills' and lower(coalesce(g->>'label','')) like '%soft%' and coalesce(jsonb_array_length(g->'items'),0) > 0);
  edu_present := exists (
    select 1 from jsonb_array_elements(v_content) b
    cross join jsonb_array_elements(coalesce(b->'entries','[]'::jsonb)) e
    where b->>'type' = 'education' and coalesce(e->>'title','') <> '');

  filled_personal :=
    (case when nullif(personal->>'fullName', '') is not null then 1 else 0 end) +
    (case when nullif(personal->>'jobTitle', '') is not null then 1 else 0 end) +
    (case when nullif(personal->>'email', '')    is not null then 1 else 0 end) +
    (case when nullif(personal->>'phone', '')    is not null then 1 else 0 end) +
    (case when nullif(personal->>'location', '') is not null then 1 else 0 end);

  content_sections :=
    (case when length(trim(coalesce(summary_txt, ''))) > 20 then 1 else 0 end) +
    (case when length(trim(coalesce(exp_txt, '')))     > 20 then 1 else 0 end) +
    (case when length(trim(coalesce(proj_txt, '')))    > 20 then 1 else 0 end);

  content_score := round((filled_personal::numeric / 5) * 40 + (content_sections::numeric / 3) * 60);
  skills_score  := least(100, round((total_skills::numeric / 10) * 100));

  select count(*) into keyword_hits from unnest(keyword_list) k where combined_text like '%' || k || '%';
  keywords_score := least(100, round((keyword_hits::numeric / array_length(keyword_list, 1)) * 100)
    + (case when edu_present then 10 else 0 end));
  quantified := combined_text ~ '[0-9]';

  -- completeness: share of the 6 things a recruiter always expects
  filled_core :=
    (case when nullif(personal->>'fullName','') is not null and nullif(personal->>'email','') is not null then 1 else 0 end) +
    (case when nullif(personal->>'phone','') is not null or nullif(personal->>'location','') is not null then 1 else 0 end) +
    (case when length(trim(coalesce(summary_txt,''))) > 20 then 1 else 0 end) +
    (case when length(trim(coalesce(exp_txt,''))) > 20 or length(trim(coalesce(proj_txt,''))) > 20 then 1 else 0 end) +
    (case when edu_present then 1 else 0 end) +
    (case when total_skills > 0 then 1 else 0 end);
  completeness := round((filled_core::numeric / 6) * 100);

  -- readability: penalise walls of text / very long lines, reward some structure
  readability := 100;
  if length(combined_text) > 600 and (length(combined_text) - length(replace(combined_text, E'\n', ''))) < 3 then
    readability := readability - 30;
  end if;
  select count(*) into long_lines from regexp_split_to_table(combined_text, E'\n') ln where length(ln) > 180;
  readability := readability - least(30, long_lines * 6);
  if (select count(*) from regexp_split_to_table(coalesce(exp_txt,'') || E'\n' || coalesce(proj_txt,''), E'\n') ln where length(trim(ln)) > 0) >= 3 then
    readability := readability + 5;
  end if;
  readability := greatest(30, least(100, readability));

  overall := least(100, round(
    content_score * 0.30 + formatting_score * 0.12 + skills_score * 0.22 + keywords_score * 0.22
    + completeness * 0.08 + readability * 0.06));

  update public.resumes_builder set ats_score = overall where id = p_resume_id;

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
      rule_met := length(trim(coalesce(summary_txt, ''))) > 20;
    elsif ar.check_key = 'has_education' then
      rule_met := edu_present;
    elsif ar.check_key = 'skills_grouped' then
      rule_met := has_tech and has_soft;
    elsif ar.check_key = 'single_column_safe' then
      rule_met := true;
    end if;

    if rule_met is distinct from true then
      tips := tips || jsonb_build_object(
        'ruleId', ar.id, 'section', ar.section, 'problem', ar.rule, 'why', ar.guideline,
        'importance', ar.importance, 'checked', ar.check_key is not null);
    end if;
  end loop;

  if jsonb_array_length(tips) = 0 then
    tips := jsonb_build_array(jsonb_build_object(
      'ruleId', null, 'section', 'general',
      'problem', 'Great! Your resume has a high chance of passing ATS screening.',
      'why', '', 'importance', 'low', 'checked', true));
  end if;

  return jsonb_build_object(
    'overall', overall,
    'content', content_score,
    'formatting', formatting_score,
    'skills', skills_score,
    'keywords', keywords_score,
    'completeness', completeness,
    'readability', readability,
    'tips', tips
  );
end;
$$;

revoke all on function public.compute_ats_breakdown(uuid) from public;
grant execute on function public.compute_ats_breakdown(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. JD matching — resume text now comes from `content`
-- ---------------------------------------------------------------------------
create or replace function public.match_resume_to_jd(p_resume_id uuid, p_jd_text text)
returns jsonb
language plpgsql
as $$
declare
  r              public.resumes_builder%rowtype;
  resume_text    text;
  resume_tokens  text[];
  jd_tokens      text[];
  matched        text[];
  missing        text[];
  jd_token_count int;
  match_count    int;
  match_percent  int;
begin
  select * into r from public.resumes_builder where id = p_resume_id;
  if not found then
    raise exception 'resume % not found or not accessible', p_resume_id;
  end if;

  resume_text := lower(public.resume_section_text(coalesce(r.content, '[]'::jsonb), array[
    'summary','objective','experience','internships','projects','certifications','achievements',
    'awards','publications','research','volunteer','leadership','skills','languages','custom'
  ]));

  resume_tokens := public.tokenize_keywords(resume_text);
  jd_tokens := public.tokenize_keywords(p_jd_text);
  jd_token_count := coalesce(array_length(jd_tokens, 1), 0);

  if jd_token_count = 0 then
    return jsonb_build_object('matchPercent', 0, 'matched', '[]'::jsonb, 'missing', '[]'::jsonb, 'jdKeywordCount', 0);
  end if;

  select coalesce(array_agg(t order by t), array[]::text[]) into matched
  from unnest(jd_tokens) t where t = any(resume_tokens);
  select coalesce(array_agg(t order by t), array[]::text[]) into missing
  from unnest(jd_tokens) t where not (t = any(resume_tokens));

  match_count := coalesce(array_length(matched, 1), 0);
  match_percent := least(100, round((match_count::numeric / jd_token_count) * 100));

  return jsonb_build_object(
    'matchPercent', match_percent,
    'matched', to_jsonb(matched),
    'missing', to_jsonb(missing[1:30]),
    'jdKeywordCount', jd_token_count
  );
end;
$$;

revoke all on function public.match_resume_to_jd(uuid, text) from public;
grant execute on function public.match_resume_to_jd(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. version restore — snapshot + restore now carry `content`
-- ---------------------------------------------------------------------------
create or replace function public.restore_resume_version(p_version_id uuid)
returns void
language plpgsql
as $$
declare
  version_row public.resume_versions%rowtype;
  current_row public.resumes_builder%rowtype;
begin
  select * into version_row from public.resume_versions where id = p_version_id;
  if not found then
    raise exception 'version % not found or not accessible', p_version_id;
  end if;

  select * into current_row from public.resumes_builder where id = version_row.resume_id;
  if not found then
    raise exception 'resume % not found or not accessible', version_row.resume_id;
  end if;

  insert into public.resume_versions (user_id, resume_id, label, snapshot)
  values (
    current_row.user_id, current_row.id, 'Before restore',
    jsonb_build_object(
      'title', current_row.title,
      'template', current_row.template,
      'personal_details', current_row.personal_details,
      'content', current_row.content,
      'education', current_row.education,
      'skills', current_row.skills,
      'sections', current_row.sections,
      'layout', current_row.layout
    )
  );

  update public.resumes_builder set
    title            = coalesce(version_row.snapshot->>'title', title),
    template         = coalesce(version_row.snapshot->>'template', template),
    personal_details = coalesce(version_row.snapshot->'personal_details', personal_details),
    content          = coalesce(version_row.snapshot->'content', content),
    education        = coalesce(version_row.snapshot->'education', education),
    skills           = coalesce(version_row.snapshot->'skills', skills),
    sections         = coalesce(version_row.snapshot->'sections', sections),
    layout           = coalesce(version_row.snapshot->'layout', layout),
    updated_at       = now()
  where id = version_row.resume_id;
end;
$$;

revoke all on function public.restore_resume_version(uuid) from public;
grant execute on function public.restore_resume_version(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. shared-resume projection — include `content`
-- ---------------------------------------------------------------------------
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

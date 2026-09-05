-- Phase 6 of the Advanced Resume & Career Profile System engagement.
--
-- Deterministic (not AI) job-description matching, built on Phase 1's
-- shared tokenize_keywords() so the "keywords" logic used for ATS scoring
-- and JD matching stays a single implementation. Also unblocks a live,
-- non-static ATS view on the website (it already had the RPC to call from
-- Phase 1 — this migration adds nothing new for that, just documents the
-- dependency).
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

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

  -- Free-text content plus the resume's structured skill tags — skills are
  -- the most reliable signal a JD's requirements actually match against.
  resume_text := lower(
    coalesce(r.sections->>'summary', '') || ' ' ||
    coalesce(r.sections->>'experience', '') || ' ' ||
    coalesce(r.sections->>'projects', '') || ' ' ||
    coalesce((select string_agg(value, ' ') from jsonb_array_elements_text(coalesce(r.skills->'technical', '[]'::jsonb))), '') || ' ' ||
    coalesce((select string_agg(value, ' ') from jsonb_array_elements_text(coalesce(r.skills->'soft', '[]'::jsonb))), '')
  );

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
    -- capped so a very long JD can't return an unbounded "missing" list
    'missing', to_jsonb(missing[1:30]),
    'jdKeywordCount', jd_token_count
  );
end;
$$;

revoke all on function public.match_resume_to_jd(uuid, text) from public;
grant execute on function public.match_resume_to_jd(uuid, text) to authenticated;

notify pgrst, 'reload schema';

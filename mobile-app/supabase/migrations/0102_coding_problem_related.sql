-- mobile-app/supabase/migrations/0102_coding_problem_related.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/074_coding_problem_related.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — internal-linking read RPCs: related problems + prev/next problem nav
-- (mobile 0102_coding_problem_related.sql  ==  admin 074_coding_problem_related.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Two new read-only RPCs backing the website's internal-linking pass (no
--   schema change, no new tables/columns). Each detail page needs, in one
--   round trip: up to 3 related problems + a deterministic previous/next
--   problem, scoped separately for the two existing coding-problem systems:
--     * coding_problem_related    — Learning topic-scoped problems
--       (dsa_problems.topic_id is null, learning_topic_id is not null),
--       backing coding_problem_detail() / /coding-problems/<slug>.
--     * practice_problem_related  — global Practice problems
--       (dsa_problems.learning_topic_id is null, topic_id -> a
--       dsa_topics row with kind='practice'), backing
--       practice_problem_detail() / /practice/problems/<slug>.
--
--   "Related" prefers problems in the SAME topic/category first, then (for
--   the Learning system only) tops up from sibling topics in the SAME grid
--   (course) when the current topic doesn't have 3 siblings of its own —
--   never padded with unrelated rows, never crossing into a different grid.
--   Practice has no cross-category top-up (categories are the coarsest unit
--   there; crossing one would break topical relevance).
--
--   "Prev"/"next" walk the SAME ordering the apps already read elsewhere
--   (dsa_problems.sort_order, created_at — the same key backing
--   dsa_problems_cp_topic_idx / dsa_problems_practice_list_idx), scoped to
--   the current problem's own topic/category.
--
-- ACCESS CONTROL
--   Same visibility gate as coding_problem_detail() / practice_problem_detail()
--   (published + show_on_website/mobile + learning_row_visible academic
--   targeting). Premium candidates are INCLUDED with is_premium=true (the
--   website renders a lock icon, same convention as learning_topic_practice's
--   coding_problems list) — never silently hidden, never bypassed. No hidden
--   judge fields (test_cases, solution_code, editorial) are ever returned by
--   these two RPCs — only slug/title/difficulty/languages/premium flag.
--
-- SAFETY
--   100% additive. No DROP of anything holding data. Guarded with
--   to_regprocedure/to_regclass so it is safe to run before or after its twin
--   and safe to re-run.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regprocedure('public.coding_problem_detail(text, text)') is null then
    raise exception '0102/074: coding_problem_detail() not found — apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if to_regprocedure('public.practice_problem_detail(text, text)') is null then
    raise exception '0102/074: practice_problem_detail() not found — apply 0072_practice_coding.sql (admin 044) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. coding_problem_related — Learning topic-scoped problems
-- ===========================================================================
create or replace function public.coding_problem_related(
  p_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v      record;
  v_web  boolean := (coalesce(p_platform,'website') <> 'mobile');
begin
  select dp.id, dp.learning_topic_id, coalesce(dp.sort_order, 0) as sort_order,
         dp.created_at, coalesce(dp.difficulty, 'Easy') as difficulty,
         t.grid_id
    into v
  from public.dsa_problems dp
  join public.learning_topics t on t.id = dp.learning_topic_id
  join public.learning_grids g on g.id = t.grid_id
  left join public.learning_sections s on s.id = t.section_id
  where dp.topic_id is null
    and dp.slug is not null
    and lower(dp.slug) = lower(p_slug)
    and coalesce(dp.status, 'published') = 'published'
    and t.status = 'published' and g.status = 'published'
    and (t.section_id is null or s.status = 'published')
    and case when v_web
             then coalesce(dp.show_on_website, true) and t.show_on_website and g.show_on_website and coalesce(s.show_on_website, true)
             else coalesce(dp.show_on_mobile, true)  and t.show_on_mobile  and g.show_on_mobile  and coalesce(s.show_on_mobile, true)
        end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
    and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  limit 1;

  if v.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'related', coalesce((
      select jsonb_agg(jsonb_build_object(
               'slug', c.slug, 'title', c.title, 'difficulty', c.difficulty,
               'is_premium', c.is_premium, 'supported_languages', c.supported_languages
             ))
      from (
        select dp2.slug, dp2.title, coalesce(dp2.difficulty, 'Easy') as difficulty,
               coalesce(dp2.is_premium, false) as is_premium,
               coalesce(dp2.supported_languages, array['python','javascript','java','cpp']) as supported_languages
        from public.dsa_problems dp2
        join public.learning_topics t2 on t2.id = dp2.learning_topic_id
        join public.learning_grids g2 on g2.id = t2.grid_id
        left join public.learning_sections s2 on s2.id = t2.section_id
        where dp2.topic_id is null
          and dp2.slug is not null
          and dp2.id <> v.id
          and t2.grid_id = v.grid_id
          and coalesce(dp2.status, 'published') = 'published'
          and t2.status = 'published' and g2.status = 'published'
          and (t2.section_id is null or s2.status = 'published')
          and case when v_web
                   then coalesce(dp2.show_on_website, true) and t2.show_on_website and g2.show_on_website and coalesce(s2.show_on_website, true)
                   else coalesce(dp2.show_on_mobile, true)  and t2.show_on_mobile  and g2.show_on_mobile  and coalesce(s2.show_on_mobile, true)
              end
          and public.learning_row_visible(g2.target_type, g2.target_course_id, g2.target_branch_ids, g2.target_year_id)
          and public.learning_row_visible(t2.target_type, t2.target_course_id, t2.target_branch_ids, t2.target_year_id)
          and public.learning_row_visible(dp2.target_type, dp2.target_course_id, dp2.target_branch_ids, dp2.target_year_id)
        order by (t2.id = v.learning_topic_id) desc,
                 (coalesce(dp2.difficulty, 'Easy') = v.difficulty) desc,
                 coalesce(dp2.sort_order, 0), dp2.created_at
        limit 3
      ) c
    ), '[]'::jsonb),
    'prev', (
      select jsonb_build_object('slug', p.slug, 'title', p.title)
      from public.dsa_problems p
      where p.topic_id is null and p.learning_topic_id = v.learning_topic_id
        and p.slug is not null and p.id <> v.id
        and coalesce(p.status, 'published') = 'published'
        and case when v_web then coalesce(p.show_on_website, true) else coalesce(p.show_on_mobile, true) end
        and public.learning_row_visible(p.target_type, p.target_course_id, p.target_branch_ids, p.target_year_id)
        and (coalesce(p.sort_order, 0), p.created_at) < (v.sort_order, v.created_at)
      order by coalesce(p.sort_order, 0) desc, p.created_at desc
      limit 1
    ),
    'next', (
      select jsonb_build_object('slug', p.slug, 'title', p.title)
      from public.dsa_problems p
      where p.topic_id is null and p.learning_topic_id = v.learning_topic_id
        and p.slug is not null and p.id <> v.id
        and coalesce(p.status, 'published') = 'published'
        and case when v_web then coalesce(p.show_on_website, true) else coalesce(p.show_on_mobile, true) end
        and public.learning_row_visible(p.target_type, p.target_course_id, p.target_branch_ids, p.target_year_id)
        and (coalesce(p.sort_order, 0), p.created_at) > (v.sort_order, v.created_at)
      order by coalesce(p.sort_order, 0) asc, p.created_at asc
      limit 1
    )
  );
end;
$$;
revoke all on function public.coding_problem_related(text, text) from public;
grant execute on function public.coding_problem_related(text, text) to anon, authenticated;

-- ===========================================================================
-- 2. practice_problem_related — global Practice problems
-- ===========================================================================
create or replace function public.practice_problem_related(
  p_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v      record;
  v_web  boolean := (coalesce(p_platform,'website') <> 'mobile');
begin
  select dp.id, dp.topic_id, coalesce(dp.sort_order, 0) as sort_order,
         dp.created_at, coalesce(dp.difficulty, 'Easy') as difficulty
    into v
  from public.dsa_problems dp
  join public.dsa_topics dt on dt.id = dp.topic_id and dt.kind = 'practice'
  where dp.learning_topic_id is null
    and dp.slug is not null
    and lower(dp.slug) = lower(p_slug)
    and coalesce(dp.status, 'published') = 'published'
    and coalesce(dt.status, 'published') = 'published'
    and case when v_web
             then coalesce(dp.show_on_website, true) and coalesce(dt.show_on_website, true)
             else coalesce(dp.show_on_mobile, true)  and coalesce(dt.show_on_mobile, true)
        end
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  limit 1;

  if v.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'related', coalesce((
      select jsonb_agg(jsonb_build_object(
               'slug', c.slug, 'title', c.title, 'difficulty', c.difficulty,
               'is_premium', c.is_premium, 'supported_languages', c.supported_languages
             ))
      from (
        select dp2.slug, dp2.title, coalesce(dp2.difficulty, 'Easy') as difficulty,
               coalesce(dp2.is_premium, false) as is_premium,
               coalesce(dp2.supported_languages, array['python','javascript','java','cpp']) as supported_languages
        from public.dsa_problems dp2
        join public.dsa_topics dt2 on dt2.id = dp2.topic_id and dt2.kind = 'practice'
        where dp2.learning_topic_id is null
          and dp2.slug is not null
          and dp2.id <> v.id
          and dp2.topic_id = v.topic_id
          and coalesce(dp2.status, 'published') = 'published'
          and coalesce(dt2.status, 'published') = 'published'
          and case when v_web
                   then coalesce(dp2.show_on_website, true) and coalesce(dt2.show_on_website, true)
                   else coalesce(dp2.show_on_mobile, true)  and coalesce(dt2.show_on_mobile, true)
              end
          and public.learning_row_visible(dp2.target_type, dp2.target_course_id, dp2.target_branch_ids, dp2.target_year_id)
        order by (coalesce(dp2.difficulty, 'Easy') = v.difficulty) desc,
                 coalesce(dp2.sort_order, 0), dp2.created_at
        limit 3
      ) c
    ), '[]'::jsonb),
    'prev', (
      select jsonb_build_object('slug', p.slug, 'title', p.title)
      from public.dsa_problems p
      where p.learning_topic_id is null and p.topic_id = v.topic_id
        and p.slug is not null and p.id <> v.id
        and coalesce(p.status, 'published') = 'published'
        and case when v_web then coalesce(p.show_on_website, true) else coalesce(p.show_on_mobile, true) end
        and public.learning_row_visible(p.target_type, p.target_course_id, p.target_branch_ids, p.target_year_id)
        and (coalesce(p.sort_order, 0), p.created_at) < (v.sort_order, v.created_at)
      order by coalesce(p.sort_order, 0) desc, p.created_at desc
      limit 1
    ),
    'next', (
      select jsonb_build_object('slug', p.slug, 'title', p.title)
      from public.dsa_problems p
      where p.learning_topic_id is null and p.topic_id = v.topic_id
        and p.slug is not null and p.id <> v.id
        and coalesce(p.status, 'published') = 'published'
        and case when v_web then coalesce(p.show_on_website, true) else coalesce(p.show_on_mobile, true) end
        and public.learning_row_visible(p.target_type, p.target_course_id, p.target_branch_ids, p.target_year_id)
        and (coalesce(p.sort_order, 0), p.created_at) > (v.sort_order, v.created_at)
      order by coalesce(p.sort_order, 0) asc, p.created_at asc
      limit 1
    )
  );
end;
$$;
revoke all on function public.practice_problem_related(text, text) from public;
grant execute on function public.practice_problem_related(text, text) to anon, authenticated;

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $$
begin
  if to_regprocedure('public.coding_problem_related(text, text)') is null
     or to_regprocedure('public.practice_problem_related(text, text)') is null then
    raise exception 'validation: coding_problem_related / practice_problem_related missing';
  end if;

  raise notice '0102 OK: coding_problem_related + practice_problem_related RPCs live.';
end $$;

notify pgrst, 'reload schema';

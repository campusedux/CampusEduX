-- admin-panel/supabase/migrations/073_dbms_sql_check_sql_case_override.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0101_dbms_sql_check_sql_case_override.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — fix: coding_problem_run_cases() ignores a per-case check_sql override
-- ============================================================================
-- WHAT / WHY
--   0091/063 already let a case's own seed_sql override the problem-level
--   sql_seed_sql, but check_sql was left problem-level only. Batch 4
--   (067/0095, Chapter 9) already seeds a hidden test case with its own
--   check_sql (a DDL-writing problem with no seed data to vary the
--   verification query against), so coding_problem_run_cases() needs to
--   honour it the same way it already honours a per-case seed_sql.
--
--   0091/063 has already shipped to the linked database (confirmed
--   read-only, via its RPCs' grant/revoke behaviour, before writing this),
--   so it is not edited in place — this migration re-defines the one
--   function with the corrected COALESCE. 100% additive/idempotent
--   (create or replace; safe to re-run; no schema/grant changes).
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regprocedure('public.coding_problem_run_cases(text)') is null then
    raise exception '073/0101: coding_problem_run_cases missing — apply 0091/063 first.';
  end if;
end $$;

create or replace function public.coding_problem_run_cases(p_slug text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v record;
begin
  select dp.id, dp.examples, dp.test_cases, dp.is_premium,
         dp.sql_schema_sql, dp.sql_seed_sql, dp.sql_check_sql,
         t.is_premium as topic_premium, t.id as topic_id
    into v
  from public.dsa_problems dp
  join public.learning_topics t on t.id = dp.learning_topic_id
  where dp.topic_id is null
    and dp.slug is not null
    and lower(dp.slug) = lower(p_slug)
    and coalesce(dp.status, 'published') = 'published'
    and public.learning_topic_visible(t.id, 'any')
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  limit 1;

  if v.id is null then
    return null;
  end if;

  if (coalesce(v.is_premium, false) or coalesce(v.topic_premium, false))
     and not public.current_user_is_premium()
     and not public.is_admin(auth.uid()) then
    return null;
  end if;

  return coalesce((
    select jsonb_agg(c order by (c->>'seq')::int)
    from (
      select jsonb_build_object(
               'seq', (row_number() over ()) - 1,
               'input',    coalesce(e->>'input', ''),
               'expected', coalesce(e->>'output', e->>'expected', ''),
               'hidden',   false,
               'schema_sql', coalesce(v.sql_schema_sql, ''),
               'seed_sql',   coalesce(e->>'seed_sql', v.sql_seed_sql, ''),
               'check_sql',  coalesce(e->>'check_sql', v.sql_check_sql, '')
             ) as c
      from jsonb_array_elements(coalesce(v.examples, '[]'::jsonb)) e
      union all
      select jsonb_build_object(
               'seq', 1000 + ((row_number() over ()) - 1),
               'input',    coalesce(tc->>'input', ''),
               'expected', coalesce(tc->>'expected', tc->>'output', ''),
               'hidden',   coalesce((tc->>'hidden')::boolean, true),
               'schema_sql', coalesce(v.sql_schema_sql, ''),
               'seed_sql',   coalesce(tc->>'seed_sql', v.sql_seed_sql, ''),
               'check_sql',  coalesce(tc->>'check_sql', v.sql_check_sql, '')
             )
      from jsonb_array_elements(coalesce(v.test_cases, '[]'::jsonb)) tc
    ) rows
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.coding_problem_run_cases(text) from public;
grant execute on function public.coding_problem_run_cases(text) to anon, authenticated;

notify pgrst, 'reload schema';

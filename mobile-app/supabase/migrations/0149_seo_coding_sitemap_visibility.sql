-- Match coding_problem_detail's existing section publication/platform gates.
-- Changes sitemap membership only; access policies and problem bodies are untouched.
create or replace function public.coding_problems_sitemap(p_platform text default 'website')
returns table (slug text, updated_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select dp.slug, dp.updated_at
  from public.dsa_problems dp
  join public.learning_topics t on t.id = dp.learning_topic_id
  join public.learning_grids g on g.id = t.grid_id
  left join public.learning_sections s on s.id = t.section_id
  where dp.topic_id is null and dp.slug is not null
    and coalesce(dp.status, 'published') = 'published'
    and t.status = 'published' and g.status = 'published'
    and (t.section_id is null or s.status = 'published')
    and case when coalesce(p_platform, 'website') <> 'mobile'
          then coalesce(dp.show_on_website, true) and t.show_on_website and g.show_on_website and coalesce(s.show_on_website, true)
          else coalesce(dp.show_on_mobile, true) and t.show_on_mobile and g.show_on_mobile and coalesce(s.show_on_mobile, true)
        end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
    and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
    and public.learning_row_visible(dp.target_type, dp.target_course_id, dp.target_branch_ids, dp.target_year_id)
  order by dp.slug;
$$;
revoke all on function public.coding_problems_sitemap(text) from public;
grant execute on function public.coding_problems_sitemap(text) to anon, authenticated;

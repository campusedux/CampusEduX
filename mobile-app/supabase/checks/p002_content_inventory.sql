-- Read-only P0-02 staging/live inventory. Run with an authorized read-only role.
-- Export results before any owner-approved visibility change. RLS may omit rows.
with affected_topics as (
  select t.id, t.slug, t.source_ref, t.status, t.show_on_website, t.show_on_mobile,
         g.slug as grid_slug
  from public.learning_topics t
  join public.learning_grids g on g.id = t.grid_id
  where g.slug in ('ai-ml-notes', 'generative-ai', 'java-tutorial', 'python-tutorial')
), learning_items as (
  select 'learning_topics'::text as resource_type, t.id::text as resource_id,
         t.grid_slug as family, t.slug as topic_slug, t.source_ref,
         t.status, t.show_on_website, t.show_on_mobile,
         '/learning/' || t.grid_slug || '/' || t.slug as public_url
  from affected_topics t
  union all
  select 'learning_contents', c.id::text, t.grid_slug, t.slug, t.source_ref,
         c.status, t.show_on_website, t.show_on_mobile,
         '/learning/' || t.grid_slug || '/' || t.slug
  from public.learning_contents c join affected_topics t on t.id = c.topic_id
  union all
  select 'practice_tests', p.id, t.grid_slug, t.slug, t.source_ref,
         p.status, t.show_on_website, t.show_on_mobile,
         '/learning/' || t.grid_slug || '/' || t.slug
  from public.practice_tests p join affected_topics t on t.id = p.learning_topic_id
  union all
  select 'test_questions', q.id, t.grid_slug, t.slug, t.source_ref,
         p.status, t.show_on_website, t.show_on_mobile,
         '/learning/' || t.grid_slug || '/' || t.slug
  from public.test_questions q join public.practice_tests p on p.id = q.test_id
  join affected_topics t on t.id = p.learning_topic_id
  union all
  select 'dsa_problems', d.id, t.grid_slug, t.slug, t.source_ref,
         d.status, t.show_on_website, t.show_on_mobile,
         '/coding-problems/' || coalesce(d.slug, d.id)
  from public.dsa_problems d join affected_topics t on t.id = d.learning_topic_id
), interview_items as (
  select 'interview_questions'::text as resource_type, q.id as resource_id,
         c.slug as family, t.slug as topic_slug, null::text as source_ref,
         q.status, q.show_on_website, q.show_on_mobile,
         '/practice/interview-questions/' || c.slug || '/' || t.slug as public_url
  from public.interview_questions q
  join public.interview_topics t on t.id = q.topic_id
  join public.interview_categories c on c.id = t.category_id
  where c.id in ('java', 'python')
)
select i.*
from (select * from learning_items union all select * from interview_items) i
order by family, topic_slug, resource_type, resource_id;

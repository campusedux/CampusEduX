-- Run only in the disposable database created by scripts/test-seo-sitemap-sql.sh.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create function public.learning_row_visible(text, text, text[], text)
returns boolean language sql immutable as $$ select $1 <> 'hidden' $$;
create table public.learning_grids (
  id text primary key, status text, show_on_website boolean, show_on_mobile boolean,
  target_type text default 'all', target_course_id text, target_branch_ids text[], target_year_id text
);
create table public.learning_sections (
  id text primary key, status text, show_on_website boolean, show_on_mobile boolean
);
create table public.learning_topics (
  id text primary key, grid_id text, section_id text, status text,
  show_on_website boolean, show_on_mobile boolean,
  target_type text default 'all', target_course_id text, target_branch_ids text[], target_year_id text
);
create table public.dsa_problems (
  slug text, updated_at timestamptz, learning_topic_id text, topic_id text, status text,
  show_on_website boolean, show_on_mobile boolean,
  target_type text default 'all', target_course_id text, target_branch_ids text[], target_year_id text
);
insert into learning_grids (id,status,show_on_website,show_on_mobile) values ('g','published',true,true);
insert into learning_sections values
  ('both','published',true,true), ('mobile','published',false,true),
  ('web','published',true,false), ('draft','draft',true,true);
insert into learning_topics (id,grid_id,section_id,status,show_on_website,show_on_mobile) values
  ('both','g','both','published',true,true), ('mobile','g','mobile','published',true,true),
  ('web','g','web','published',true,true), ('draft-section','g','draft','published',true,true),
  ('sectionless','g',null,'published',true,true), ('missing-section','g','missing','published',true,true),
  ('draft-topic','g','both','draft',true,true);
insert into dsa_problems (slug,learning_topic_id,status,show_on_website,show_on_mobile,updated_at)
select id, id, 'published', true, true, '2026-01-01' from learning_topics;
insert into dsa_problems (slug,learning_topic_id,status,show_on_website,show_on_mobile,target_type) values
  ('hidden','both','published',true,true,'hidden'), ('draft-problem','both','draft',true,true,'all'),
  ('web-problem','both','published',true,false,'all'), ('mobile-problem','both','published',false,true,'all');
-- A global practice problem must never leak into /coding-problems/.
insert into dsa_problems (slug,learning_topic_id,topic_id,status,show_on_website,show_on_mobile)
values ('global','both','practice','published',true,true);
\ir ../../../mobile-app/supabase/migrations/0149_seo_coding_sitemap_visibility.sql
set role anon;
do $$
declare actual text[];
begin
  select array_agg(slug order by slug) into actual from public.coding_problems_sitemap('website');
  if actual is distinct from array['both','sectionless','web','web-problem'] then
    raise exception 'Website sitemap mismatch: %', actual;
  end if;
  select array_agg(slug order by slug) into actual from public.coding_problems_sitemap('mobile');
  if actual is distinct from array['both','mobile','mobile-problem','sectionless'] then
    raise exception 'Mobile sitemap mismatch: %', actual;
  end if;
  select array_agg(slug order by slug) into actual from public.coding_problems_sitemap(null);
  if actual is distinct from array['both','sectionless','web','web-problem'] then
    raise exception 'NULL platform must match website: %', actual;
  end if;
end $$;
reset role;
-- Existing parent targeting restrictions still apply.
update learning_grids set target_type='hidden';
set role anon;
do $$ begin
  if exists (select from public.coding_problems_sitemap('website')) then
    raise exception 'Grid targeting leaked';
  end if;
end $$;
reset role;
select 'SEO sitemap visibility checks passed' as result;

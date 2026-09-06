-- mobile-app/supabase/migrations/0045_learning_unification_rls.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/022_learning_unification_rls.sql ; apply either, the other is a guarded no-op. Phase 2 of the Learning
-- unification (see LEARNING_UNIFICATION_AUDIT.md). Additive · idempotent.
--
-- ============================================================================
-- BODY — learning unification, part 2/2 : RLS + READ RPCs + STORAGE + PERMS
-- (mobile 0045_learning_unification_rls.sql == admin 022_learning_unification_rls.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- Depends on part 1/2 (mobile 0044 / admin 021). Turns the schema + data from
-- part 1 into an enforced security boundary:
--
--   * `learning_*` SELECT policies gain academic-targeting + NULL-section
--     tolerance (a topic may now sit directly under a grid).
--   * The practice / DSA / HR tables move from `USING (true)` to
--     `status='published' AND learning_row_visible(...) [AND premium gate]`.
--     `companies` / `recruiters` are LEFT as public directories (shared with
--     the Jobs module).
--   * The five read RPCs (`learning_grids_list`, `learning_tree`,
--     `learning_topic_content`, `learning_search`, `learning_sitemap`) — the
--     real read path for Website + Mobile — get the same targeting filter, so
--     enforcement does not depend on the RLS the SECURITY DEFINER RPCs bypass.
--   * A PRIVATE `learning-files` storage bucket for premium / downloadable
--     assets + `learning_content_accessible(uuid)` so the app only mints a
--     signed URL for a caller who may read that content.
--   * `role_permissions` gains a dedicated `learning` module (+ the missing
--     `custom_projects` rows) — `on conflict do nothing`, additive.
--
-- Nothing here changes what a caller could see for CONTENT that is global +
-- published (every legacy row, after part 1's backfill). It only starts
-- ENFORCING course / branch / year / premium / publish where an admin later
-- sets them.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $$
begin
  if to_regprocedure('public.learning_row_visible(text, text, text[], text)') is null then
    raise exception '0045/022: learning_row_visible() not found — apply part 1/2 (mobile 0044 / admin 021) first.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='learning_grids' and column_name='grid_type') then
    raise exception '0045/022: learning_grids.grid_type not found — apply part 1/2 (mobile 0044 / admin 021) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. learning_* — refresh the public SELECT policies
-- ===========================================================================

-- grid: own status + platform + own targeting
drop policy if exists "learning_grids_select_public" on public.learning_grids;
create policy "learning_grids_select_public" on public.learning_grids
  for select
  using (
    status = 'published'
    and (show_on_website or show_on_mobile)
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
  );

-- section: own status + platform + grid visible (learning_grid_visible now also
-- checks the grid's targeting — see part 1 §7d)
drop policy if exists "learning_sections_select_public" on public.learning_sections;
create policy "learning_sections_select_public" on public.learning_sections
  for select
  using (
    status = 'published'
    and (show_on_website or show_on_mobile)
    and public.learning_grid_visible(grid_id, 'any')
  );

-- topic: own status + platform + grid visible + (section visible OR no section)
--        + own targeting
drop policy if exists "learning_topics_select_public" on public.learning_topics;
create policy "learning_topics_select_public" on public.learning_topics
  for select
  using (
    status = 'published'
    and (show_on_website or show_on_mobile)
    and public.learning_grid_visible(grid_id, 'any')
    and (section_id is null or public.learning_section_visible(section_id, 'any'))
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
  );

-- content: own status + topic visible (chains grid+section+their targeting) +
--          own targeting + premium gate (unchanged)
drop policy if exists "learning_contents_select_public" on public.learning_contents;
create policy "learning_contents_select_public" on public.learning_contents
  for select
  using (
    status = 'published'
    and public.learning_topic_visible(topic_id, 'any')
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
    and (
      not coalesce((select t.is_premium from public.learning_topics t where t.id = topic_id), false)
      and not coalesce(is_premium, false)
      or public.current_user_is_premium()
      or public.is_admin(auth.uid())
    )
  );

-- ===========================================================================
-- 2. learning_grid_companies — admin write + public read
-- ===========================================================================
do $$ begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "learning_grid_companies_admin_all" on public.learning_grid_companies;
    create policy "learning_grid_companies_admin_all" on public.learning_grid_companies
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

drop policy if exists "learning_grid_companies_select_public" on public.learning_grid_companies;
create policy "learning_grid_companies_select_public" on public.learning_grid_companies
  for select
  using (
    status = 'published'
    and (show_on_website or show_on_mobile)
    and public.learning_grid_visible(grid_id, 'any')
  );

-- ===========================================================================
-- 3. Practice / DSA / HR — replace `USING (true)` with real gates
--    (admin `*_admin_all` policies from admin 002 are left untouched)
-- ===========================================================================

-- practice_tests: published + targeting. The row stays visible for a premium
-- test (upsell); the QUESTIONS are what get withheld (below).
drop policy if exists "practice_tests_select_public" on public.practice_tests;
create policy "practice_tests_select_public" on public.practice_tests
  for select
  using (
    coalesce(status, 'published') = 'published'
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
  );

-- test_questions: parent test published + visible, AND premium gate on the
-- parent test. correct_index stays column-readable exactly as before (0016) —
-- server scoring (submit_test_attempt, 0040) is the real protection.
drop policy if exists "test_questions_select_public" on public.test_questions;
create policy "test_questions_select_public" on public.test_questions
  for select
  using (
    exists (
      select 1 from public.practice_tests p
      where p.id = test_questions.test_id
        and coalesce(p.status, 'published') = 'published'
        and public.learning_row_visible(p.target_type, p.target_course_id, p.target_branch_ids, p.target_year_id)
    )
    and (
      not coalesce((select p.is_premium from public.practice_tests p where p.id = test_questions.test_id), false)
      or public.current_user_is_premium()
      or public.is_admin(auth.uid())
    )
  );

-- dsa_topics: published + grid visible (if linked)
drop policy if exists "dsa_topics_select_public" on public.dsa_topics;
create policy "dsa_topics_select_public" on public.dsa_topics
  for select
  using (
    coalesce(status, 'published') = 'published'
    and (learning_grid_id is null or public.learning_grid_visible(learning_grid_id, 'any'))
  );

-- dsa_problems: published + targeting + premium gate (statement + solution are
-- one row; a premium problem is hidden from a non-premium caller)
drop policy if exists "dsa_problems_select_public" on public.dsa_problems;
create policy "dsa_problems_select_public" on public.dsa_problems
  for select
  using (
    coalesce(status, 'published') = 'published'
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
    and (
      not coalesce(is_premium, false)
      or public.current_user_is_premium()
      or public.is_admin(auth.uid())
    )
  );

-- hr_questions: published + targeting + premium gate
drop policy if exists "hr_questions_select_public" on public.hr_questions;
create policy "hr_questions_select_public" on public.hr_questions
  for select
  using (
    coalesce(status, 'published') = 'published'
    and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
    and (
      not coalesce(is_premium, false)
      or public.current_user_is_premium()
      or public.is_admin(auth.uid())
    )
  );

-- live_tests: parent practice_test still published (or standalone)
drop policy if exists "live_tests_select_public" on public.live_tests;
create policy "live_tests_select_public" on public.live_tests
  for select
  using (
    coalesce(is_published, true)
    and (
      practice_test_id is null
      or exists (
        select 1 from public.practice_tests p
        where p.id = live_tests.practice_test_id
          and coalesce(p.status, 'published') = 'published'
      )
    )
  );

-- ===========================================================================
-- 4. READ RPCs — apply the same targeting on the SECURITY DEFINER read path
--    (bodies re-emitted from migration 0042/019 with the targeting terms added
--     + `grid_type` / `is_premium` appended to learning_grids_list so the Mobile
--     app can route its dynamic Learning home by grid_type. `drop function`
--     first because a RETURNS-TABLE change can't use CREATE OR REPLACE.)
-- ===========================================================================

drop function if exists public.learning_grids_list(text);

create function public.learning_grids_list(p_platform text default 'website')
returns table (
  id uuid, name text, slug text, description text,
  icon text, icon_url text, cover_image_url text, accent_color text,
  is_featured boolean, sort_order integer,
  section_count bigint, topic_count bigint,
  grid_type text, is_premium boolean
)
language sql stable security definer set search_path = public
as $$
  select g.id, g.name, g.slug, g.description,
         g.icon, g.icon_url, g.cover_image_url, g.accent_color,
         g.is_featured, g.sort_order,
         (select count(*) from public.learning_sections s
            where s.grid_id = g.id and s.status = 'published'
              and case p_platform when 'mobile' then s.show_on_mobile else s.show_on_website end),
         (select count(*) from public.learning_topics t
            where t.grid_id = g.id and t.status = 'published'
              and case p_platform when 'mobile' then t.show_on_mobile else t.show_on_website end
              and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)),
         g.grid_type, g.is_premium
  from public.learning_grids g
  where g.status = 'published'
    and case p_platform when 'mobile' then g.show_on_mobile else g.show_on_website end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
  order by g.sort_order, g.name;
$$;
revoke all on function public.learning_grids_list(text) from public;
grant execute on function public.learning_grids_list(text) to anon, authenticated;

create or replace function public.learning_tree(p_grid_slug text, p_platform text default 'website')
returns jsonb
language sql stable security definer set search_path = public
as $$
  with g as (
    select * from public.learning_grids
    where lower(slug) = lower(p_grid_slug)
      and status = 'published'
      and case p_platform when 'mobile' then show_on_mobile else show_on_website end
      and public.learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)
    limit 1
  )
  select case when g.id is null then null else
    jsonb_build_object(
      'grid', jsonb_build_object(
        'id', g.id, 'name', g.name, 'slug', g.slug, 'description', g.description,
        'icon', g.icon, 'icon_url', g.icon_url, 'cover_image_url', g.cover_image_url,
        'accent_color', g.accent_color
      ),
      'sections', coalesce((
        select jsonb_agg(sec order by sec.sort_order, sec.created_at)
        from (
          select s.sort_order, s.created_at,
            jsonb_build_object(
              'id', s.id, 'name', s.name, 'slug', s.slug, 'description', s.description,
              'topics', coalesce((
                select jsonb_agg(top order by top.sort_order, top.created_at)
                from (
                  select t.sort_order, t.created_at,
                    jsonb_build_object(
                      'id', t.id, 'title', t.title, 'slug', t.slug,
                      'short_description', t.short_description, 'is_premium', t.is_premium
                    ) as top
                  from public.learning_topics t
                  where t.section_id = s.id and t.status = 'published'
                    and case p_platform when 'mobile' then t.show_on_mobile else t.show_on_website end
                    and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
                ) top
              ), '[]'::jsonb)
            ) as sec
          from public.learning_sections s
          where s.grid_id = g.id and s.status = 'published'
            and case p_platform when 'mobile' then s.show_on_mobile else s.show_on_website end
        ) sec
      ), '[]'::jsonb)
    )
  end
  from (select * from g) g;
$$;
revoke all on function public.learning_tree(text, text) from public;
grant execute on function public.learning_tree(text, text) to anon, authenticated;

create or replace function public.learning_topic_content(
  p_grid_slug text, p_topic_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_topic   record;
  v_locked  boolean;
  v_result  jsonb;
  v_rn      bigint;
begin
  select t.*, s.name as section_name, s.slug as section_slug,
         g.name as grid_name, g.slug as grid_slug
    into v_topic
  from public.learning_topics t
  join public.learning_sections s on s.id = t.section_id
  join public.learning_grids g on g.id = t.grid_id
  where lower(g.slug) = lower(p_grid_slug)
    and lower(t.slug) = lower(p_topic_slug)
    and t.status = 'published' and s.status = 'published' and g.status = 'published'
    and case p_platform
          when 'mobile' then t.show_on_mobile and s.show_on_mobile and g.show_on_mobile
          else t.show_on_website and s.show_on_website and g.show_on_website
        end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
    and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
  limit 1;

  if v_topic.id is null then
    return null;
  end if;

  v_locked := v_topic.is_premium
              and not public.current_user_is_premium()
              and not public.is_admin(auth.uid());

  with ordered as (
    select t.id,
      row_number() over (order by s.sort_order, s.created_at, t.sort_order, t.created_at) as rn
    from public.learning_topics t
    join public.learning_sections s on s.id = t.section_id
    where t.grid_id = v_topic.grid_id
      and t.status = 'published' and s.status = 'published'
      and case p_platform
            when 'mobile' then t.show_on_mobile and s.show_on_mobile
            else t.show_on_website and s.show_on_website
          end
      and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
  )
  select rn into v_rn from ordered where id = v_topic.id;

  v_result := jsonb_build_object(
    'topic', jsonb_build_object(
      'id', v_topic.id, 'title', v_topic.title, 'slug', v_topic.slug,
      'short_description', v_topic.short_description, 'is_premium', v_topic.is_premium,
      'updated_at', v_topic.updated_at
    ),
    'section', jsonb_build_object('name', v_topic.section_name, 'slug', v_topic.section_slug),
    'grid', jsonb_build_object('name', v_topic.grid_name, 'slug', v_topic.grid_slug),
    'locked', v_locked,
    'contents', case when v_locked then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'heading', c.heading, 'body', c.body,
               'content_format', c.content_format, 'file_url', c.file_url,
               'video_url', c.video_url, 'metadata', c.metadata
             ) order by c.sort_order, c.created_at)
      from public.learning_contents c
      where c.topic_id = v_topic.id and c.status = 'published'
        and public.learning_row_visible(c.target_type, c.target_course_id, c.target_branch_ids, c.target_year_id)
        and (not coalesce(c.is_premium, false) or public.current_user_is_premium() or public.is_admin(auth.uid()))
    ), '[]'::jsonb) end,
    'prev', (
      with ordered as (
        select t.id, t.title, t.slug,
          row_number() over (order by s.sort_order, s.created_at, t.sort_order, t.created_at) as rn
        from public.learning_topics t
        join public.learning_sections s on s.id = t.section_id
        where t.grid_id = v_topic.grid_id and t.status = 'published' and s.status = 'published'
          and case p_platform when 'mobile' then t.show_on_mobile and s.show_on_mobile
                              else t.show_on_website and s.show_on_website end
          and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
      )
      select jsonb_build_object('title', title, 'slug', slug) from ordered where rn = v_rn - 1
    ),
    'next', (
      with ordered as (
        select t.id, t.title, t.slug,
          row_number() over (order by s.sort_order, s.created_at, t.sort_order, t.created_at) as rn
        from public.learning_topics t
        join public.learning_sections s on s.id = t.section_id
        where t.grid_id = v_topic.grid_id and t.status = 'published' and s.status = 'published'
          and case p_platform when 'mobile' then t.show_on_mobile and s.show_on_mobile
                              else t.show_on_website and s.show_on_website end
          and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
      )
      select jsonb_build_object('title', title, 'slug', slug) from ordered where rn = v_rn + 1
    )
  );

  return v_result;
end;
$$;
revoke all on function public.learning_topic_content(text, text, text) from public;
grant execute on function public.learning_topic_content(text, text, text) to anon, authenticated;

create or replace function public.learning_search(
  p_q text, p_platform text default 'website', p_limit integer default 20
)
returns table (
  kind text, grid_slug text, grid_name text, section_name text,
  topic_slug text, title text, snippet text, is_premium boolean
)
language sql stable security definer set search_path = public
as $$
  with q as (select nullif(btrim(p_q), '') as term),
  hits as (
    select 'grid'::text kind, g.slug grid_slug, g.name grid_name, null::text section_name,
           null::text topic_slug, g.name title, left(g.description, 160) snippet,
           false is_premium, 0 rank
    from public.learning_grids g, q
    where q.term is not null and g.status = 'published'
      and case p_platform when 'mobile' then g.show_on_mobile else g.show_on_website end
      and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
      and (g.name ilike '%' || q.term || '%' or g.description ilike '%' || q.term || '%')
    union all
    select 'topic'::text, g.slug, g.name, s.name, t.slug, t.title,
           left(coalesce(
             (select string_agg(c.body, ' ') from public.learning_contents c
               where c.topic_id = t.id and c.status = 'published'),
             t.short_description), 200),
           t.is_premium, 1
    from public.learning_topics t
    join public.learning_sections s on s.id = t.section_id
    join public.learning_grids g on g.id = t.grid_id, q
    where q.term is not null
      and t.status = 'published' and s.status = 'published' and g.status = 'published'
      and case p_platform
            when 'mobile' then t.show_on_mobile and s.show_on_mobile and g.show_on_mobile
            else t.show_on_website and s.show_on_website and g.show_on_website
          end
      and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
      and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
      and (
        t.title ilike '%' || q.term || '%'
        or t.short_description ilike '%' || q.term || '%'
        or exists (
          select 1 from public.learning_contents c
          where c.topic_id = t.id and c.status = 'published'
            and c.body ilike '%' || q.term || '%'
        )
      )
  )
  select kind, grid_slug, grid_name, section_name, topic_slug, title,
         case when is_premium
                   and not public.current_user_is_premium()
                   and not public.is_admin(auth.uid())
              then null else snippet end,
         is_premium
  from hits
  order by rank, title
  limit greatest(1, least(p_limit, 50));
$$;
revoke all on function public.learning_search(text, text, integer) from public;
grant execute on function public.learning_search(text, text, integer) to anon, authenticated;

create or replace function public.learning_sitemap(p_platform text default 'website')
returns table (grid_slug text, topic_slug text, updated_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select g.slug, null::text, g.updated_at
  from public.learning_grids g
  where g.status = 'published'
    and case p_platform when 'mobile' then g.show_on_mobile else g.show_on_website end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
  union all
  select g.slug, t.slug, t.updated_at
  from public.learning_topics t
  join public.learning_sections s on s.id = t.section_id
  join public.learning_grids g on g.id = t.grid_id
  where t.status = 'published' and s.status = 'published' and g.status = 'published'
    and case p_platform
          when 'mobile' then t.show_on_mobile and s.show_on_mobile and g.show_on_mobile
          else t.show_on_website and s.show_on_website and g.show_on_website
        end
    and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
    and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
  order by 1, 2 nulls first;
$$;
revoke all on function public.learning_sitemap(text) from public;
grant execute on function public.learning_sitemap(text) to anon, authenticated;

-- ===========================================================================
-- 5. STORAGE — private bucket for premium / downloadable learning assets
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('learning-files', 'learning-files', false)
on conflict (id) do nothing;

-- admin-only object access; there is NO public/anon read policy, so an object
-- is reachable only via a short-lived signed URL the app mints AFTER
-- learning_content_accessible() passes. Archived / unpublished content is
-- therefore never exposed.
do $$ begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "learning_files_admin_all" on storage.objects;
    create policy "learning_files_admin_all" on storage.objects
      for all to authenticated
      using (bucket_id = 'learning-files' and public.is_admin(auth.uid()))
      with check (bucket_id = 'learning-files' and public.is_admin(auth.uid()));
  end if;
end $$;

-- May the current caller read this content block's attached file?
create or replace function public.learning_content_accessible(p_content_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.learning_contents c
    where c.id = p_content_id
      and c.status = 'published'
      and public.learning_topic_visible(c.topic_id, 'any')
      and public.learning_row_visible(c.target_type, c.target_course_id, c.target_branch_ids, c.target_year_id)
      and (
        not coalesce(c.is_premium, false)
        and not coalesce((select t.is_premium from public.learning_topics t where t.id = c.topic_id), false)
        or public.current_user_is_premium()
        or public.is_admin(auth.uid())
      )
  );
$$;
revoke all on function public.learning_content_accessible(uuid) from public;
grant execute on function public.learning_content_accessible(uuid) to anon, authenticated;

-- ===========================================================================
-- 6. PERMISSIONS — dedicated `learning` module (+ the missing custom_projects
--    rows). Mirrors the placement defaults from admin 001. Additive.
-- ===========================================================================
do $$ begin
  if to_regclass('public.role_permissions') is null then
    raise notice '0045: role_permissions not present — apply admin 001 first; skipping permission seed.';
    return;
  end if;

  insert into public.role_permissions (role, module, can_view, can_add, can_edit, can_delete) values
    ('super_admin','learning',        true, true, true, true),
    ('admin',      'learning',        true, true, true, true),
    ('editor',     'learning',        true, true, true, false),
    ('support',    'learning',        true, false,false,false),
    ('viewer',     'learning',        true, false,false,false),
    ('super_admin','custom_projects', true, true, true, true),
    ('admin',      'custom_projects', true, true, true, true),
    ('editor',     'custom_projects', true, true, true, false),
    ('support',    'custom_projects', true, false,true, false),
    ('viewer',     'custom_projects', true, false,false,false)
  on conflict (role, module) do nothing;
end $$;

notify pgrst, 'reload schema';

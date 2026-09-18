-- admin-panel/supabase/migrations/075_interview_questions.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0103_interview_questions.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — Practice ▸ Interview Questions (Website + Mobile)
-- (mobile 0103_interview_questions.sql  ==  admin 075_interview_questions.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Adds a new "Interview Questions" area under Practice, separate from the
--   existing Practice ▸ Coding Problems system (dsa_topics/dsa_problems,
--   0072/044) and from Learning. It is a 3-level catalog so more languages
--   (Python, C, ...) can be added later purely through the admin panel:
--
--     interview_categories  — one row per language/track (e.g. "Java"),
--                              addressed by /practice/interview-questions/<slug>
--     interview_topics      — one row per topic within a category
--                              (e.g. "OOP Questions"), FK -> interview_categories,
--                              addressed by /practice/interview-questions/<cat>/<slug>
--     interview_questions   — one row per Q&A within a topic, FK -> interview_topics
--                              (question / answer / example / important_point,
--                              rendered by the existing Markdown component —
--                              no new rendering code needed)
--
--   Table names deliberately avoid the "practice_" prefix already used by the
--   practice_categories() RPC (0072/044) to prevent any name confusion between
--   an RPC and a table.
--
-- ACCESS CONTROL
--   Public read of published + platform-visible rows only (mirrors the
--   dsa_topics/dsa_problems public-select gate from 0072/044). Admin write via
--   is_admin(auth.uid()), same as every other admin-managed catalog table.
--   No academic targeting / premium gating — Interview Questions content is
--   open to every learner, so learning_row_visible() is not involved here.
--
-- SAFETY
--   100% additive. No DROP of anything holding data. Guarded with
--   to_regclass / to_regprocedure / IF NOT EXISTS so it is safe to run before
--   or after its twin and safe to re-run.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception '0103/075: set_updated_at() not found — apply 0001_profiles.sql first.';
  end if;
end $$;

-- ===========================================================================
-- 1. SCHEMA
-- ===========================================================================

create table if not exists public.interview_categories (
  id              text        primary key,
  name            text        not null,
  slug            text        not null,
  description     text        not null default '',
  icon            text        not null default '',
  sort_order      integer     not null default 0,
  status          text        not null default 'published'
                    check (status in ('draft','published','archived')),
  show_on_website boolean     not null default true,
  show_on_mobile  boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists interview_categories_slug_key
  on public.interview_categories (lower(slug));

drop trigger if exists interview_categories_set_updated_at on public.interview_categories;
create trigger interview_categories_set_updated_at
  before update on public.interview_categories
  for each row execute function public.set_updated_at();

create table if not exists public.interview_topics (
  id              text        primary key,
  category_id     text        not null references public.interview_categories (id) on delete cascade,
  name            text        not null,
  slug            text        not null,
  description     text        not null default '',
  sort_order      integer     not null default 0,
  status          text        not null default 'published'
                    check (status in ('draft','published','archived')),
  show_on_website boolean     not null default true,
  show_on_mobile  boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists interview_topics_category_slug_key
  on public.interview_topics (category_id, lower(slug));
create index if not exists interview_topics_category_idx
  on public.interview_topics (category_id, sort_order);

drop trigger if exists interview_topics_set_updated_at on public.interview_topics;
create trigger interview_topics_set_updated_at
  before update on public.interview_topics
  for each row execute function public.set_updated_at();

create table if not exists public.interview_questions (
  id                text        primary key default gen_random_uuid()::text,
  topic_id          text        not null references public.interview_topics (id) on delete cascade,
  question          text        not null,
  answer            text        not null default '',
  example           text        not null default '',
  important_point   text        not null default '',
  difficulty        text        not null default 'Medium'
                      check (difficulty in ('Easy','Medium','Hard')),
  sort_order        integer     not null default 0,
  status            text        not null default 'published'
                      check (status in ('draft','published','archived')),
  show_on_website   boolean     not null default true,
  show_on_mobile    boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists interview_questions_topic_idx
  on public.interview_questions (topic_id, sort_order);

drop trigger if exists interview_questions_set_updated_at on public.interview_questions;
create trigger interview_questions_set_updated_at
  before update on public.interview_questions
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 2. RLS
-- ===========================================================================

alter table public.interview_categories enable row level security;
alter table public.interview_topics     enable row level security;
alter table public.interview_questions  enable row level security;

drop policy if exists "interview_categories_select_public" on public.interview_categories;
create policy "interview_categories_select_public" on public.interview_categories
  for select using (
    coalesce(status, 'published') = 'published'
    and (coalesce(show_on_website, true) or coalesce(show_on_mobile, true))
  );

drop policy if exists "interview_topics_select_public" on public.interview_topics;
create policy "interview_topics_select_public" on public.interview_topics
  for select using (
    coalesce(status, 'published') = 'published'
    and (coalesce(show_on_website, true) or coalesce(show_on_mobile, true))
  );

drop policy if exists "interview_questions_select_public" on public.interview_questions;
create policy "interview_questions_select_public" on public.interview_questions
  for select using (
    coalesce(status, 'published') = 'published'
    and (coalesce(show_on_website, true) or coalesce(show_on_mobile, true))
  );

do $$ begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "interview_categories_admin_all" on public.interview_categories;
    create policy "interview_categories_admin_all" on public.interview_categories
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
    drop policy if exists "interview_topics_admin_all" on public.interview_topics;
    create policy "interview_topics_admin_all" on public.interview_topics
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
    drop policy if exists "interview_questions_admin_all" on public.interview_questions;
    create policy "interview_questions_admin_all" on public.interview_questions
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

-- ===========================================================================
-- 3. READ RPCs (SECURITY DEFINER — visibility enforced here). grant anon+authenticated.
-- ===========================================================================

-- 3a. interview_categories_list — hub page (/practice/interview-questions).
create or replace function public.interview_categories_list(p_platform text default 'website')
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_web boolean := (coalesce(p_platform,'website') <> 'mobile');
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'slug', ic.slug,
             'name', ic.name,
             'description', coalesce(ic.description, ''),
             'icon', coalesce(ic.icon, ''),
             'topic_count', (
               select count(*)
               from public.interview_topics it
               where it.category_id = ic.id
                 and coalesce(it.status, 'published') = 'published'
                 and case when v_web then coalesce(it.show_on_website, true) else coalesce(it.show_on_mobile, true) end
             )
           ) order by coalesce(ic.sort_order, 0), ic.name)
    from public.interview_categories ic
    where coalesce(ic.status, 'published') = 'published'
      and case when v_web then coalesce(ic.show_on_website, true) else coalesce(ic.show_on_mobile, true) end
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.interview_categories_list(text) from public;
grant execute on function public.interview_categories_list(text) to anon, authenticated;

-- 3b. interview_topics_list — topic grid for one category
--     (/practice/interview-questions/<category>). Null category means "not
--     found / unpublished" so the website can 404.
create or replace function public.interview_topics_list(
  p_category_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_cat record;
  v_web boolean := (coalesce(p_platform,'website') <> 'mobile');
begin
  select ic.id, ic.slug, ic.name, ic.description
    into v_cat
  from public.interview_categories ic
  where lower(ic.slug) = lower(p_category_slug)
    and coalesce(ic.status, 'published') = 'published'
    and case when v_web then coalesce(ic.show_on_website, true) else coalesce(ic.show_on_mobile, true) end
  limit 1;

  if v_cat.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'category', jsonb_build_object('slug', v_cat.slug, 'name', v_cat.name, 'description', coalesce(v_cat.description, '')),
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object(
               'slug', it.slug,
               'name', it.name,
               'description', coalesce(it.description, ''),
               'question_count', (
                 select count(*)
                 from public.interview_questions iq
                 where iq.topic_id = it.id
                   and coalesce(iq.status, 'published') = 'published'
                   and case when v_web then coalesce(iq.show_on_website, true) else coalesce(iq.show_on_mobile, true) end
               )
             ) order by coalesce(it.sort_order, 0), it.name)
      from public.interview_topics it
      where it.category_id = v_cat.id
        and coalesce(it.status, 'published') = 'published'
        and case when v_web then coalesce(it.show_on_website, true) else coalesce(it.show_on_mobile, true) end
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.interview_topics_list(text, text) from public;
grant execute on function public.interview_topics_list(text, text) to anon, authenticated;

-- 3c. interview_topic_detail — one topic page: every published question in
--     order, plus previous/next topic within the same category
--     (/practice/interview-questions/<category>/<topic>). Same tuple-compare
--     prev/next technique as practice_problem_related() (0102/074).
create or replace function public.interview_topic_detail(
  p_category_slug text, p_topic_slug text, p_platform text default 'website'
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_cat  record;
  v_top  record;
  v_web  boolean := (coalesce(p_platform,'website') <> 'mobile');
begin
  select ic.id, ic.slug, ic.name
    into v_cat
  from public.interview_categories ic
  where lower(ic.slug) = lower(p_category_slug)
    and coalesce(ic.status, 'published') = 'published'
    and case when v_web then coalesce(ic.show_on_website, true) else coalesce(ic.show_on_mobile, true) end
  limit 1;

  if v_cat.id is null then
    return null;
  end if;

  select it.id, it.slug, it.name, it.description, it.sort_order, it.created_at
    into v_top
  from public.interview_topics it
  where it.category_id = v_cat.id
    and lower(it.slug) = lower(p_topic_slug)
    and coalesce(it.status, 'published') = 'published'
    and case when v_web then coalesce(it.show_on_website, true) else coalesce(it.show_on_mobile, true) end
  limit 1;

  if v_top.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'category', jsonb_build_object('slug', v_cat.slug, 'name', v_cat.name),
    'topic', jsonb_build_object('slug', v_top.slug, 'name', v_top.name, 'description', coalesce(v_top.description, '')),
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
               'question', iq.question,
               'answer', coalesce(iq.answer, ''),
               'example', coalesce(iq.example, ''),
               'important_point', coalesce(iq.important_point, ''),
               'difficulty', coalesce(iq.difficulty, 'Medium')
             ) order by coalesce(iq.sort_order, 0), iq.created_at)
      from public.interview_questions iq
      where iq.topic_id = v_top.id
        and coalesce(iq.status, 'published') = 'published'
        and case when v_web then coalesce(iq.show_on_website, true) else coalesce(iq.show_on_mobile, true) end
    ), '[]'::jsonb),
    'prev', (
      select jsonb_build_object('slug', it2.slug, 'name', it2.name)
      from public.interview_topics it2
      where it2.category_id = v_cat.id
        and it2.id <> v_top.id
        and coalesce(it2.status, 'published') = 'published'
        and case when v_web then coalesce(it2.show_on_website, true) else coalesce(it2.show_on_mobile, true) end
        and (coalesce(it2.sort_order, 0), it2.created_at) < (coalesce(v_top.sort_order, 0), v_top.created_at)
      order by coalesce(it2.sort_order, 0) desc, it2.created_at desc
      limit 1
    ),
    'next', (
      select jsonb_build_object('slug', it2.slug, 'name', it2.name)
      from public.interview_topics it2
      where it2.category_id = v_cat.id
        and it2.id <> v_top.id
        and coalesce(it2.status, 'published') = 'published'
        and case when v_web then coalesce(it2.show_on_website, true) else coalesce(it2.show_on_mobile, true) end
        and (coalesce(it2.sort_order, 0), it2.created_at) > (coalesce(v_top.sort_order, 0), v_top.created_at)
      order by coalesce(it2.sort_order, 0) asc, it2.created_at asc
      limit 1
    )
  );
end;
$$;
revoke all on function public.interview_topic_detail(text, text, text) from public;
grant execute on function public.interview_topic_detail(text, text, text) to anon, authenticated;

-- 3d. interview_questions_sitemap — published, platform-visible topic slugs
--     + last-modified, for website/sitemap.ts (topic granularity, matching
--     the routed page).
create or replace function public.interview_questions_sitemap(p_platform text default 'website')
returns table (category_slug text, topic_slug text, updated_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select ic.slug, it.slug, it.updated_at
  from public.interview_topics it
  join public.interview_categories ic on ic.id = it.category_id
  where coalesce(it.status, 'published') = 'published'
    and coalesce(ic.status, 'published') = 'published'
    and case p_platform
          when 'mobile' then coalesce(it.show_on_mobile, true) and coalesce(ic.show_on_mobile, true)
          else coalesce(it.show_on_website, true) and coalesce(ic.show_on_website, true)
        end
  order by ic.slug, it.slug;
$$;
revoke all on function public.interview_questions_sitemap(text) from public;
grant execute on function public.interview_questions_sitemap(text) to anon, authenticated;

-- ===========================================================================
-- 4. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $$
begin
  if to_regclass('public.interview_categories') is null
     or to_regclass('public.interview_topics') is null
     or to_regclass('public.interview_questions') is null then
    raise exception 'validation: interview_categories/topics/questions table missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='interview_categories_slug_key') then
    raise exception 'validation: interview_categories_slug_key missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and indexname='interview_topics_category_slug_key') then
    raise exception 'validation: interview_topics_category_slug_key missing';
  end if;
  if to_regprocedure('public.interview_categories_list(text)') is null
     or to_regprocedure('public.interview_topics_list(text, text)') is null
     or to_regprocedure('public.interview_topic_detail(text, text, text)') is null
     or to_regprocedure('public.interview_questions_sitemap(text)') is null then
    raise exception 'validation: one or more interview_* RPCs missing';
  end if;

  raise notice '0103 OK: interview_categories/topics/questions + RLS, 4 read RPCs live.';
end $$;

notify pgrst, 'reload schema';

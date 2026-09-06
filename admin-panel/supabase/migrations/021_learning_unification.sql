-- admin-panel/supabase/migrations/021_learning_unification.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0044_learning_unification.sql ; apply either, the other is a guarded no-op. Phase 2 of the Learning
-- unification (see LEARNING_UNIFICATION_AUDIT.md). Additive · idempotent.
--
-- ============================================================================
-- BODY — learning unification, part 1/2 : SCHEMA + FUNCTIONS + SEED + BACKFILL
-- (mobile 0044_learning_unification.sql  ==  admin 021_learning_unification.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Phase 1 established that `learning_*` (grids -> sections -> topics ->
--   contents, migration 0042/019) is the canonical Learning spine, and that the
--   practice suites (`aptitude_topics`, `practice_tests`+`test_questions`,
--   `dsa_topics`+`dsa_problems`, `hr_questions`, `live_tests`) and `companies`
--   are the canonical practice / company data. This migration makes the two
--   ONE system:
--
--     * `learning_grids` gains `grid_type` + academic targeting; the FIVE
--       default grids (Aptitude, DSA / Coding, Mock Test, HR Interview, Company
--       Specific) are SEEDED AS DATA — status='draft', hidden on both platforms
--       until an admin publishes them, so nothing changes for users on apply.
--     * `learning_topics.section_id` becomes NULLABLE so a topic may hang
--       directly off a grid (Grid -> Topic -> Content), while existing
--       Grid -> Section -> Topic content keeps working untouched.
--     * The practice / DSA / HR tables gain nullable `learning_grid_id` /
--       `learning_topic_id` links, a `status` publish state, `is_premium`, and
--       the same academic-targeting columns — EXTENDED IN PLACE, never copied,
--       so every `text` primary key (and therefore every `test_attempts`,
--       `user_dsa_progress`, `user_favorite_questions` reference) is preserved.
--     * `companies` is REUSED for "Company Specific"; one thin junction table
--       `learning_grid_companies` records which companies appear under a
--       company-type grid. No second company table.
--     * `learning_migration_map` records every old_id -> new_id mapping.
--
--   NO RLS POLICY is changed here — new columns all default to
--   target_type='global' / status='published', so visibility is byte-for-byte
--   what it was. Part 2/2 (mobile 0045 / admin 022) tightens RLS + the read
--   RPCs + storage once this schema + data is in place.
--
-- ACADEMIC TARGETING — NULL / GLOBAL SEMANTICS (used by part 2's RLS)
--   target_type  : 'global' (or NULL / '')  -> visible to everyone
--                  'course'                  -> only profiles.course resolving
--                                               to target_course_id
--                  'branch'                  -> only profiles.branch resolving
--                                               into target_branch_ids[]
--   target_year_id : NULL / ''  -> no year restriction
--                    set        -> AND-combined with the above; only profiles
--                                  whose profiles.year resolves to it
--   i.e. "B.Tech CSE 3rd year" = target_type='branch', target_branch_ids &
--   target_year_id both set. A branch id already encodes its course.
--
-- SAFETY
--   100% additive. No DROP of anything that holds data. Guarded with
--   to_regclass / to_regprocedure / IF NOT EXISTS so it is safe to run before
--   or after its twin and safe to re-run. Legacy rows are backfilled to
--   status='published' so they stay visible.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ---- ordering guard -------------------------------------------------------
-- Requires 0042/019 (learning_* tables) and 0043/020 (learning_slugify()).
do $$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0044/021: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_slugify(text)') is null then
    raise exception '0044/021: learning_slugify() not found — apply 0043_merge_notes_into_learning.sql (admin 020) first.';
  end if;
  if to_regprocedure('public.content_visible_to_current_user(text, text, text[])') is null then
    raise exception '0044/021: content_visible_to_current_user(text,text,text[]) not found — apply 0036/016 first.';
  end if;
end $$;

-- ===========================================================================
-- 1. learning_grids — grid_type, premium flag, academic targeting
-- ===========================================================================
alter table public.learning_grids
  add column if not exists grid_type text not null default 'content';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'learning_grids_grid_type_check') then
    alter table public.learning_grids add constraint learning_grids_grid_type_check
      check (grid_type in ('content','aptitude','dsa','mock_test','hr','company','custom'));
  end if;
end $$;

alter table public.learning_grids
  add column if not exists is_premium          boolean not null default false,
  add column if not exists source_kind         text,
  add column if not exists source_ref          text,
  add column if not exists target_type         text    not null default 'global',
  add column if not exists target_course_id    text,
  add column if not exists target_course_name  text,
  add column if not exists target_branch_ids   text[]  not null default '{}'::text[],
  add column if not exists target_branch_names text[]  not null default '{}'::text[],
  add column if not exists target_year_id      text,
  add column if not exists target_year_label   text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'learning_grids_target_type_check') then
    alter table public.learning_grids add constraint learning_grids_target_type_check
      check (target_type in ('global','course','branch'));
  end if;
end $$;
create unique index if not exists learning_grids_source_key
  on public.learning_grids (source_kind, source_ref)
  where source_kind is not null and source_ref is not null;

-- ===========================================================================
-- 2. learning_topics — nullable section_id, icons, targeting, provenance,
--    optional company scope (for company-type grids)
-- ===========================================================================
alter table public.learning_topics alter column section_id drop not null;

alter table public.learning_topics
  add column if not exists icon                text,
  add column if not exists icon_url            text,
  add column if not exists company_id          text,
  add column if not exists source_kind         text,
  add column if not exists source_ref          text,
  add column if not exists target_type         text    not null default 'global',
  add column if not exists target_course_id    text,
  add column if not exists target_course_name  text,
  add column if not exists target_branch_ids   text[]  not null default '{}'::text[],
  add column if not exists target_branch_names text[]  not null default '{}'::text[],
  add column if not exists target_year_id      text,
  add column if not exists target_year_label   text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'learning_topics_target_type_check') then
    alter table public.learning_topics add constraint learning_topics_target_type_check
      check (target_type in ('global','course','branch'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'learning_topics_company_fk')
     and to_regclass('public.companies') is not null then
    alter table public.learning_topics add constraint learning_topics_company_fk
      foreign key (company_id) references public.companies (id) on delete set null;
  end if;
  -- a topic must sit under a section OR directly under a grid (grid_id is always
  -- populated by the sync trigger, so just assert it is never null)
  if not exists (select 1 from pg_constraint where conname = 'learning_topics_parent_chk') then
    alter table public.learning_topics add constraint learning_topics_parent_chk
      check (grid_id is not null);
  end if;
end $$;

create unique index if not exists learning_topics_source_key
  on public.learning_topics (source_kind, source_ref)
  where source_kind is not null and source_ref is not null;

-- ===========================================================================
-- 3. learning_contents — first-class metadata + targeting + private file ref
-- ===========================================================================
alter table public.learning_contents
  add column if not exists title               text    not null default '',
  add column if not exists slug                text,
  add column if not exists short_description   text    not null default '',
  add column if not exists difficulty          text,
  add column if not exists estimated_minutes   integer,
  add column if not exists tags                text[]  not null default '{}'::text[],
  add column if not exists external_url        text,
  add column if not exists is_premium          boolean not null default false,
  add column if not exists file_bucket         text    not null default 'admin-media',
  add column if not exists file_path           text,
  add column if not exists target_type         text    not null default 'global',
  add column if not exists target_course_id    text,
  add column if not exists target_course_name  text,
  add column if not exists target_branch_ids   text[]  not null default '{}'::text[],
  add column if not exists target_branch_names text[]  not null default '{}'::text[],
  add column if not exists target_year_id      text,
  add column if not exists target_year_label   text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'learning_contents_target_type_check') then
    alter table public.learning_contents add constraint learning_contents_target_type_check
      check (target_type in ('global','course','branch'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'learning_contents_difficulty_check') then
    alter table public.learning_contents add constraint learning_contents_difficulty_check
      check (difficulty is null or difficulty in ('Easy','Medium','Hard'));
  end if;
end $$;

-- ===========================================================================
-- 4. learning_grid_companies — the "Company" tier of a company-type grid.
--    Reuses public.companies (shared with the Jobs module) — NOT a copy.
-- ===========================================================================
create table if not exists public.learning_grid_companies (
  id              uuid        primary key default gen_random_uuid(),
  grid_id         uuid        not null references public.learning_grids (id) on delete restrict,
  company_id      text        not null references public.companies (id)      on delete restrict,
  headline        text        not null default '',
  sort_order      integer     not null default 0,
  status          text        not null default 'draft'
                    check (status in ('draft','published','archived')),
  show_on_website boolean     not null default true,
  show_on_mobile  boolean     not null default true,
  created_by      uuid        references auth.users (id) on delete set null,
  updated_by      uuid        references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (grid_id, company_id)
);
create index if not exists learning_grid_companies_grid_idx
  on public.learning_grid_companies (grid_id, sort_order, created_at);
create index if not exists learning_grid_companies_company_idx
  on public.learning_grid_companies (company_id);

drop trigger if exists learning_grid_companies_set_updated_at on public.learning_grid_companies;
create trigger learning_grid_companies_set_updated_at
  before update on public.learning_grid_companies
  for each row execute function public.set_updated_at();

alter table public.learning_grid_companies enable row level security;

-- ===========================================================================
-- 5. learning_migration_map — durable old_id -> new_id record (spec §11)
-- ===========================================================================
create table if not exists public.learning_migration_map (
  id         uuid        primary key default gen_random_uuid(),
  entity     text        not null,          -- 'aptitude_topic' | 'dsa_topic' | 'hr_category' | ...
  old_id     text        not null,
  new_id     uuid        not null,
  migration  text        not null default '0044_learning_unification',
  note       text        not null default '',
  created_at timestamptz not null default now(),
  unique (entity, old_id)
);
create index if not exists learning_migration_map_new_idx on public.learning_migration_map (new_id);
alter table public.learning_migration_map enable row level security;
do $$ begin
  if to_regprocedure('public.is_admin(uuid)') is not null then
    drop policy if exists "learning_migration_map_admin_ro" on public.learning_migration_map;
    create policy "learning_migration_map_admin_ro" on public.learning_migration_map
      for select using (public.is_admin(auth.uid()));
  end if;
end $$;

-- ===========================================================================
-- 6. Extend the practice / DSA / HR tables IN PLACE (ids preserved)
-- ===========================================================================

-- ---- practice_tests -------------------------------------------------------
alter table public.practice_tests
  add column if not exists learning_grid_id    uuid references public.learning_grids  (id) on delete set null,
  add column if not exists learning_topic_id   uuid references public.learning_topics (id) on delete set null,
  add column if not exists status              text    not null default 'published',
  add column if not exists is_premium          boolean not null default false,
  add column if not exists negative_marking    numeric not null default 0,
  add column if not exists instructions        text    not null default '',
  add column if not exists attempts_allowed    integer,           -- NULL = unlimited
  add column if not exists target_type         text    not null default 'global',
  add column if not exists target_course_id    text,
  add column if not exists target_course_name  text,
  add column if not exists target_branch_ids   text[]  not null default '{}'::text[],
  add column if not exists target_branch_names text[]  not null default '{}'::text[],
  add column if not exists target_year_id      text,
  add column if not exists target_year_label   text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'practice_tests_status_check') then
    alter table public.practice_tests add constraint practice_tests_status_check
      check (status in ('draft','published','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'practice_tests_target_type_check') then
    alter table public.practice_tests add constraint practice_tests_target_type_check
      check (target_type in ('global','course','branch'));
  end if;
end $$;
-- backfill status from the legacy is_published flag, once.
update public.practice_tests
   set status = case when is_published then 'published' else 'draft' end
 where status = 'published' and is_published = false;

-- keep status <-> is_published in lock-step regardless of which the (unchanged)
-- app / admin code writes.
create or replace function public.practice_tests_sync_publish()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'published' then
      new.is_published := (new.status = 'published');
    else
      new.status := case when new.is_published then 'published' else 'draft' end;
    end if;
  elsif new.status is distinct from old.status then
    new.is_published := (new.status = 'published');
  elsif new.is_published is distinct from old.is_published then
    new.status := case when new.is_published then 'published'
                       when old.status = 'archived' then 'archived'
                       else 'draft' end;
  end if;
  return new;
end;
$$;
drop trigger if exists practice_tests_sync_publish on public.practice_tests;
create trigger practice_tests_sync_publish
  before insert or update on public.practice_tests
  for each row execute function public.practice_tests_sync_publish();

-- ---- test_questions -----------------------------------------------------
alter table public.test_questions
  add column if not exists question_type text not null default 'mcq';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'test_questions_question_type_check') then
    alter table public.test_questions add constraint test_questions_question_type_check
      check (question_type in ('mcq','multi','numeric','descriptive'));
  end if;
end $$;

-- ---- dsa_topics -------------------------------------------------------
alter table public.dsa_topics
  add column if not exists learning_grid_id  uuid references public.learning_grids  (id) on delete set null,
  add column if not exists learning_topic_id uuid references public.learning_topics (id) on delete set null,
  add column if not exists slug              text,
  add column if not exists description       text    not null default '',
  add column if not exists status            text    not null default 'published';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'dsa_topics_status_check') then
    alter table public.dsa_topics add constraint dsa_topics_status_check
      check (status in ('draft','published','archived'));
  end if;
end $$;

-- ---- dsa_problems ---------------------------------------------------
alter table public.dsa_problems
  add column if not exists learning_grid_id    uuid references public.learning_grids  (id) on delete set null,
  add column if not exists learning_topic_id   uuid references public.learning_topics (id) on delete set null,
  add column if not exists slug                text,
  add column if not exists hints               jsonb   not null default '[]'::jsonb,
  add column if not exists supported_languages text[]  not null default array['python','javascript','java','cpp'],
  add column if not exists status              text    not null default 'published',
  add column if not exists is_premium          boolean not null default false,
  add column if not exists target_type         text    not null default 'global',
  add column if not exists target_course_id    text,
  add column if not exists target_course_name  text,
  add column if not exists target_branch_ids   text[]  not null default '{}'::text[],
  add column if not exists target_branch_names text[]  not null default '{}'::text[],
  add column if not exists target_year_id      text,
  add column if not exists target_year_label   text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'dsa_problems_status_check') then
    alter table public.dsa_problems add constraint dsa_problems_status_check
      check (status in ('draft','published','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'dsa_problems_target_type_check') then
    alter table public.dsa_problems add constraint dsa_problems_target_type_check
      check (target_type in ('global','course','branch'));
  end if;
end $$;

-- ---- hr_questions -------------------------------------------------
alter table public.hr_questions
  add column if not exists learning_grid_id    uuid references public.learning_grids  (id) on delete set null,
  add column if not exists learning_topic_id   uuid references public.learning_topics (id) on delete set null,
  add column if not exists status              text    not null default 'published',
  add column if not exists is_premium          boolean not null default false,
  add column if not exists target_type         text    not null default 'global',
  add column if not exists target_course_id    text,
  add column if not exists target_course_name  text,
  add column if not exists target_branch_ids   text[]  not null default '{}'::text[],
  add column if not exists target_branch_names text[]  not null default '{}'::text[],
  add column if not exists target_year_id      text,
  add column if not exists target_year_label   text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'hr_questions_status_check') then
    alter table public.hr_questions add constraint hr_questions_status_check
      check (status in ('draft','published','archived'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'hr_questions_target_type_check') then
    alter table public.hr_questions add constraint hr_questions_target_type_check
      check (target_type in ('global','course','branch'));
  end if;
end $$;

-- ---- live_tests -----------------------------------------------------
alter table public.live_tests
  add column if not exists learning_grid_id uuid references public.learning_grids (id) on delete set null,
  add column if not exists is_published     boolean not null default true;

-- ===========================================================================
-- 7. FUNCTIONS
-- ===========================================================================

-- 7a. current_user_year_id() — mirror of current_user_course_id/branch_id.
create or replace function public.current_user_year_id()
returns text
language sql stable security definer set search_path = public
as $$
  select y.id
  from public.profiles pr
  join public.academic_years y on lower(y.label) = lower(pr.year)
  where pr.id = auth.uid()
  limit 1;
$$;
revoke all on function public.current_user_year_id() from public;
grant execute on function public.current_user_year_id() to anon, authenticated;

-- 7b. learning_row_visible(type, course_id, branch_ids[], year_id) — the one
--     spec §10 rule. Reuses content_visible_to_current_user() for course/branch
--     and AND-combines an independent year check.
create or replace function public.learning_row_visible(
  p_target_type       text,
  p_target_course_id  text,
  p_target_branch_ids text[],
  p_target_year_id    text
)
returns boolean
language sql stable
as $$
  select public.content_visible_to_current_user(
           coalesce(nullif(p_target_type, ''), 'global'),
           p_target_course_id,
           coalesce(p_target_branch_ids, '{}'::text[])
         )
     and (
           p_target_year_id is null
        or p_target_year_id = ''
        or p_target_year_id = public.current_user_year_id()
     );
$$;
revoke all on function public.learning_row_visible(text, text, text[], text) from public;
grant execute on function public.learning_row_visible(text, text, text[], text) to anon, authenticated;

-- 7c. learning_topics_sync_parent() — allow a topic to sit directly under a
--     grid (section_id NULL). grid_id is derived from the section when present,
--     otherwise the caller must supply it.
create or replace function public.learning_topics_sync_parent()
returns trigger language plpgsql as $$
declare
  v_grid uuid;
begin
  if new.section_id is not null then
    select grid_id into v_grid from public.learning_sections where id = new.section_id;
    if v_grid is null then
      raise exception 'learning_topics: section % does not exist', new.section_id
        using errcode = 'foreign_key_violation';
    end if;
    new.grid_id := v_grid;
  elsif new.grid_id is null then
    raise exception 'learning_topics: a topic needs either a section_id or a grid_id'
      using errcode = 'not_null_violation';
  end if;

  if new.slug is null or btrim(new.slug) = '' then
    new.slug := regexp_replace(lower(btrim(new.title)), '[^a-z0-9]+', '-', 'g');
    new.slug := btrim(new.slug, '-');
  end if;
  return new;
end;
$$;
drop trigger if exists learning_topics_sync_parent on public.learning_topics;
create trigger learning_topics_sync_parent
  before insert or update of section_id, grid_id, title, slug on public.learning_topics
  for each row execute function public.learning_topics_sync_parent();

-- 7d. NULL-section-tolerant visibility helpers (0042 originals used INNER JOINs
--     on learning_sections). Behaviour is identical for section-backed topics.
create or replace function public.learning_grid_visible(p_grid_id uuid, p_platform text default 'any')
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.learning_grids g
    where g.id = p_grid_id
      and g.status = 'published'
      and case p_platform
            when 'website' then g.show_on_website
            when 'mobile'  then g.show_on_mobile
            else (g.show_on_website or g.show_on_mobile)
          end
      and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
  );
$$;
revoke all on function public.learning_grid_visible(uuid, text) from public;
grant execute on function public.learning_grid_visible(uuid, text) to anon, authenticated;

create or replace function public.learning_section_visible(p_section_id uuid, p_platform text default 'any')
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.learning_sections s
    join public.learning_grids g on g.id = s.grid_id
    where s.id = p_section_id
      and s.status = 'published' and g.status = 'published'
      and case p_platform
            when 'website' then s.show_on_website and g.show_on_website
            when 'mobile'  then s.show_on_mobile  and g.show_on_mobile
            else (s.show_on_website or s.show_on_mobile) and (g.show_on_website or g.show_on_mobile)
          end
      and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
  );
$$;
revoke all on function public.learning_section_visible(uuid, text) from public;
grant execute on function public.learning_section_visible(uuid, text) to anon, authenticated;

create or replace function public.learning_topic_visible(p_topic_id uuid, p_platform text default 'any')
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.learning_topics t
    join public.learning_grids g on g.id = t.grid_id
    left join public.learning_sections s on s.id = t.section_id
    where t.id = p_topic_id
      and t.status = 'published' and g.status = 'published'
      and (t.section_id is null or s.status = 'published')
      and case p_platform
            when 'website' then t.show_on_website and g.show_on_website and coalesce(s.show_on_website, true)
            when 'mobile'  then t.show_on_mobile  and g.show_on_mobile  and coalesce(s.show_on_mobile, true)
            else (t.show_on_website or t.show_on_mobile)
                 and (g.show_on_website or g.show_on_mobile)
                 and (coalesce(s.show_on_website, true) or coalesce(s.show_on_mobile, true))
          end
      and public.learning_row_visible(g.target_type, g.target_course_id, g.target_branch_ids, g.target_year_id)
      and public.learning_row_visible(t.target_type, t.target_course_id, t.target_branch_ids, t.target_year_id)
  );
$$;
revoke all on function public.learning_topic_visible(uuid, text) from public;
grant execute on function public.learning_topic_visible(uuid, text) to anon, authenticated;

-- 7e. validate_learning_targeting() — write-side guard (course/branch reuse the
--     same rules as validate_content_targeting(); adds a year existence check).
create or replace function public.validate_learning_targeting()
returns trigger language plpgsql as $$
declare
  v_bad int;
begin
  if new.target_type = 'course' then
    if new.target_course_id is null or new.target_course_id = '' then
      raise exception 'targeting: a course-targeted % needs a target_course_id', tg_table_name
        using errcode = 'check_violation';
    end if;
  elsif new.target_type = 'branch' then
    if new.target_branch_ids is null or cardinality(new.target_branch_ids) = 0 then
      raise exception 'targeting: a branch-targeted % needs at least one branch', tg_table_name
        using errcode = 'check_violation';
    end if;
    if to_regclass('public.branches') is not null
       and new.target_course_id is not null and new.target_course_id <> '' then
      select count(*) into v_bad
      from unnest(new.target_branch_ids) as bid
      left join public.branches b on b.id = bid
      where b.id is null or b.course_id is distinct from new.target_course_id;
      if v_bad > 0 then
        raise exception 'targeting: % branch(es) in % do not belong to course %',
          v_bad, tg_table_name, new.target_course_id using errcode = 'check_violation';
      end if;
    end if;
  end if;

  if new.target_year_id is not null and new.target_year_id <> ''
     and to_regclass('public.academic_years') is not null then
    if not exists (select 1 from public.academic_years y where y.id = new.target_year_id) then
      raise exception 'targeting: academic year % does not exist', new.target_year_id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'learning_grids','learning_topics','learning_contents',
    'practice_tests','dsa_problems','hr_questions'
  ] loop
    execute format('drop trigger if exists %I on public.%I', tbl || '_validate_targeting', tbl);
    execute format(
      'create trigger %I before insert or update on public.%I
         for each row execute function public.validate_learning_targeting()',
      tbl || '_validate_targeting', tbl);
  end loop;
end $$;

-- ===========================================================================
-- 8. SEED — the five default grids.
--    SUPERSEDED by migration 036 (admin) / 0064 (mobile): the specialised grid
--    subsystem was retired and those grids are removed. This block is kept as a
--    no-op so a lone re-run of this migration cannot re-create them.
-- ===========================================================================
do $$
begin
  raise notice '0044/021 section 8: default-grid seed is superseded by 036/0064 — skipped.';
end $$;

-- ===========================================================================
-- 9. BACKFILL — map legacy practice data into the new grids. Dependency-safe
--    order: grids (done) -> sections -> topics -> map -> link legacy rows.
--    Every step guarded so a re-run is a no-op.
-- ===========================================================================
do $$
declare
  g_apt uuid; g_dsa uuid; g_mock uuid; g_hr uuid; g_co uuid;
  s_id  uuid; t_id uuid;
  r     record;
  v_slug text;
begin
  -- SUPERSEDED by 036/0064: if the specialised default grids were removed there
  -- is nothing to backfill. Keeps a lone re-run of this migration harmless.
  if not exists (select 1 from public.learning_grids where source_kind='default_grid') then
    raise notice '0044/021 section 9: default grids absent — legacy backfill skipped.';
    return;
  end if;
  select id into g_apt  from public.learning_grids where source_kind='default_grid' and source_ref='aptitude';
  select id into g_dsa  from public.learning_grids where source_kind='default_grid' and source_ref='dsa';
  select id into g_mock from public.learning_grids where source_kind='default_grid' and source_ref='mock_test';
  select id into g_hr   from public.learning_grids where source_kind='default_grid' and source_ref='hr';
  select id into g_co   from public.learning_grids where source_kind='default_grid' and source_ref='company';

  -- ---- APTITUDE : one section per aptitude category, one topic per aptitude_topic
  if to_regclass('public.aptitude_topics') is not null then
    for r in select distinct category from public.aptitude_topics order by category loop
      select id into s_id from public.learning_sections
        where grid_id = g_apt and lower(slug) = public.learning_slugify(r.category);
      if s_id is null then
        insert into public.learning_sections (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
        values (g_apt, initcap(r.category), public.learning_slugify(r.category), '', 0, 'published', true, true)
        returning id into s_id;
      end if;
    end loop;

    for r in select * from public.aptitude_topics order by category, sort_order, name loop
      if not exists (select 1 from public.learning_topics
                     where source_kind='aptitude_topic' and source_ref = r.id) then
        select id into s_id from public.learning_sections
          where grid_id = g_apt and lower(slug) = public.learning_slugify(r.category);
        v_slug := public.learning_slugify(r.name);
        if v_slug = '' then v_slug := 'topic-' || replace(r.id,'-',''); end if;
        if exists (select 1 from public.learning_topics where grid_id = g_apt and slug = v_slug) then
          v_slug := v_slug || '-' || left(md5(r.id), 6);
        end if;
        insert into public.learning_topics
          (section_id, grid_id, title, slug, short_description, sort_order, status,
           show_on_website, show_on_mobile, source_kind, source_ref)
        values
          (s_id, g_apt, r.name, v_slug, '', coalesce(r.sort_order,0), 'published',
           true, true, 'aptitude_topic', r.id)
        returning id into t_id;
        insert into public.learning_migration_map (entity, old_id, new_id, note)
        values ('aptitude_topic', r.id, t_id, 'aptitude_topics.'||r.category)
        on conflict (entity, old_id) do nothing;
      end if;
    end loop;
  end if;

  -- ---- DSA : one section, one topic per dsa_topic; link dsa_problems
  if to_regclass('public.dsa_topics') is not null then
    select id into s_id from public.learning_sections
      where grid_id = g_dsa and lower(slug) = 'topics';
    if s_id is null then
      insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
      values (g_dsa, 'Topics', 'topics', 0, 'published', true, true) returning id into s_id;
    end if;

    for r in select * from public.dsa_topics order by sort_order, name loop
      select new_id into t_id from public.learning_migration_map where entity='dsa_topic' and old_id = r.id;
      if t_id is null then
        v_slug := public.learning_slugify(r.name);
        if v_slug = '' then v_slug := 'topic-' || replace(r.id,'-',''); end if;
        if exists (select 1 from public.learning_topics where grid_id = g_dsa and slug = v_slug) then
          v_slug := v_slug || '-' || left(md5(r.id), 6);
        end if;
        insert into public.learning_topics
          (section_id, grid_id, title, slug, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
        values (s_id, g_dsa, r.name, v_slug, coalesce(r.sort_order,0), 'published', true, true, 'dsa_topic', r.id)
        returning id into t_id;
        insert into public.learning_migration_map (entity, old_id, new_id, note)
        values ('dsa_topic', r.id, t_id, 'dsa_topics') on conflict (entity, old_id) do nothing;
      end if;
      update public.dsa_topics
         set learning_grid_id = g_dsa, learning_topic_id = t_id,
             slug = coalesce(slug, public.learning_slugify(r.name))
       where id = r.id;
    end loop;

    update public.dsa_problems dp
       set learning_grid_id  = g_dsa,
           learning_topic_id = m.new_id,
           slug = coalesce(dp.slug, public.learning_slugify(dp.title))
      from public.learning_migration_map m
     where m.entity = 'dsa_topic' and m.old_id = dp.topic_id
       and (dp.learning_grid_id is null or dp.learning_topic_id is null);
  end if;

  -- ---- MOCK TEST : one section, one topic per practice_tests.category; link tests
  if to_regclass('public.practice_tests') is not null then
    select id into s_id from public.learning_sections
      where grid_id = g_mock and lower(slug) = 'tests';
    if s_id is null then
      insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
      values (g_mock, 'Tests', 'tests', 0, 'published', true, true) returning id into s_id;
    end if;

    for r in select distinct category from public.practice_tests order by category loop
      if not exists (select 1 from public.learning_topics
                     where source_kind='mock_category' and source_ref = r.category) then
        v_slug := public.learning_slugify(r.category);
        insert into public.learning_topics
          (section_id, grid_id, title, slug, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
        values (s_id, g_mock, initcap(r.category) || ' Tests', v_slug, 0, 'published', true, true, 'mock_category', r.category)
        returning id into t_id;
        insert into public.learning_migration_map (entity, old_id, new_id, note)
        values ('mock_category', r.category, t_id, 'practice_tests.category') on conflict (entity, old_id) do nothing;
      end if;
    end loop;

    update public.practice_tests pt
       set learning_grid_id  = g_mock,
           learning_topic_id = m.new_id
      from public.learning_migration_map m
     where m.entity = 'mock_category' and m.old_id = pt.category
       and (pt.learning_grid_id is null or pt.learning_topic_id is null);

    update public.live_tests lt set learning_grid_id = g_mock where lt.learning_grid_id is null;
  end if;

  -- ---- HR : one section, one topic per distinct hr_questions.category; link
  if to_regclass('public.hr_questions') is not null then
    select id into s_id from public.learning_sections
      where grid_id = g_hr and lower(slug) = 'hr-interview';
    if s_id is null then
      insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
      values (g_hr, 'HR Interview', 'hr-interview', 0, 'published', true, true) returning id into s_id;
    end if;

    for r in select distinct coalesce(nullif(btrim(category),''),'General Questions') as category
             from public.hr_questions order by 1 loop
      if not exists (select 1 from public.learning_topics
                     where source_kind='hr_category' and source_ref = r.category) then
        v_slug := public.learning_slugify(r.category);
        if v_slug = '' then v_slug := 'general'; end if;
        if exists (select 1 from public.learning_topics where grid_id = g_hr and slug = v_slug) then
          v_slug := v_slug || '-hr';
        end if;
        insert into public.learning_topics
          (section_id, grid_id, title, slug, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
        values (s_id, g_hr, r.category, v_slug, 0, 'published', true, true, 'hr_category', r.category)
        returning id into t_id;
        insert into public.learning_migration_map (entity, old_id, new_id, note)
        values ('hr_category', r.category, t_id, 'hr_questions.category') on conflict (entity, old_id) do nothing;
      end if;
    end loop;

    update public.hr_questions hq
       set learning_grid_id  = g_hr,
           learning_topic_id = m.new_id
      from public.learning_migration_map m
     where m.entity = 'hr_category'
       and m.old_id = coalesce(nullif(btrim(hq.category),''),'General Questions')
       and (hq.learning_grid_id is null or hq.learning_topic_id is null);
  end if;

  -- ---- COMPANY SPECIFIC : one learning_grid_companies row per company that
  --      already has company-scoped practice content. Reuses public.companies.
  if to_regclass('public.companies') is not null then
    for r in
      select c.id, c.name
      from public.companies c
      where exists (select 1 from public.hr_questions   h where h.company_id = c.id)
         or exists (select 1 from public.practice_tests p where p.company_id = c.id)
      order by c.name
    loop
      if not exists (select 1 from public.learning_grid_companies where grid_id = g_co and company_id = r.id) then
        insert into public.learning_grid_companies (grid_id, company_id, sort_order, status, show_on_website, show_on_mobile)
        values (g_co, r.id, 0, 'published', true, true);
        insert into public.learning_migration_map (entity, old_id, new_id, note)
        values ('company_link', r.id,
                (select id from public.learning_grid_companies where grid_id = g_co and company_id = r.id),
                'companies -> learning_grid_companies')
        on conflict (entity, old_id) do nothing;
      end if;
    end loop;
  end if;
end $$;

-- ===========================================================================
-- 10. INDEXES  (spec §18 — driven by the real query patterns)
-- ===========================================================================
create index if not exists learning_grids_type_status_idx
  on public.learning_grids (grid_type, status, sort_order);
create index if not exists learning_grids_target_idx
  on public.learning_grids (target_type, target_course_id);
create index if not exists learning_grids_target_year_idx
  on public.learning_grids (target_year_id) where target_year_id is not null;

create index if not exists learning_topics_grid_status_idx
  on public.learning_topics (grid_id, status, sort_order);
create index if not exists learning_topics_company_idx
  on public.learning_topics (company_id) where company_id is not null;
create index if not exists learning_topics_target_idx
  on public.learning_topics (target_type, target_course_id);
create index if not exists learning_topics_target_branch_gin
  on public.learning_topics using gin (target_branch_ids);
create index if not exists learning_topics_target_year_idx
  on public.learning_topics (target_year_id) where target_year_id is not null;

create index if not exists learning_contents_status_idx
  on public.learning_contents (topic_id, status, sort_order);
create index if not exists learning_contents_target_idx
  on public.learning_contents (target_type, target_course_id);

create index if not exists practice_tests_grid_idx      on public.practice_tests (learning_grid_id, status);
create index if not exists practice_tests_topic_idx     on public.practice_tests (learning_topic_id);
create index if not exists practice_tests_status_idx    on public.practice_tests (status, created_at desc);
create index if not exists practice_tests_target_idx    on public.practice_tests (target_type, target_course_id);
create index if not exists practice_tests_target_branch_gin on public.practice_tests using gin (target_branch_ids);
create index if not exists practice_tests_premium_idx   on public.practice_tests (is_premium);

create index if not exists dsa_topics_grid_idx          on public.dsa_topics (learning_grid_id, status, sort_order);
create index if not exists dsa_problems_grid_idx        on public.dsa_problems (learning_grid_id);
create index if not exists dsa_problems_ltopic_idx      on public.dsa_problems (learning_topic_id);
create index if not exists dsa_problems_status_idx      on public.dsa_problems (status);
create index if not exists dsa_problems_premium_idx     on public.dsa_problems (is_premium);
create index if not exists dsa_problems_target_idx      on public.dsa_problems (target_type, target_course_id);

create index if not exists hr_questions_grid_idx        on public.hr_questions (learning_grid_id);
create index if not exists hr_questions_ltopic_idx      on public.hr_questions (learning_topic_id);
create index if not exists hr_questions_status_idx      on public.hr_questions (status);
create index if not exists hr_questions_premium_idx     on public.hr_questions (is_premium);
create index if not exists hr_questions_target_idx      on public.hr_questions (target_type, target_course_id);

-- ===========================================================================
-- 11. POST-MIGRATION VALIDATION  (spec §13 — raises, never silently passes)
-- ===========================================================================
do $$
declare
  v_grids int; v_apt int; v_apt_map int; v_dsa int; v_dsa_map int;
  v_dsa_linked int; v_dsa_total int; v_pt_linked int; v_pt_total int;
  v_hr_linked int; v_hr_total int; v_co int; v_orphan int;
begin
  -- SUPERSEDED by 036/0064: post-removal this DB has 0 default grids and the
  -- seed/backfill assertions below no longer apply.
  if not exists (select 1 from public.learning_grids where source_kind='default_grid') then
    raise notice '0044/021 section 11: default grids absent — post-migration validation skipped.';
    return;
  end if;
  select count(*) into v_grids from public.learning_grids where source_kind='default_grid';
  if v_grids <> 5 then raise exception 'validation: expected 5 default grids, found %', v_grids; end if;

  select count(*) into v_apt     from public.aptitude_topics;
  select count(*) into v_apt_map from public.learning_migration_map where entity='aptitude_topic';
  if v_apt <> v_apt_map then
    raise exception 'validation: aptitude_topics % but map rows % ', v_apt, v_apt_map; end if;

  select count(*) into v_dsa     from public.dsa_topics;
  select count(*) into v_dsa_map from public.learning_migration_map where entity='dsa_topic';
  if v_dsa <> v_dsa_map then
    raise exception 'validation: dsa_topics % but map rows %', v_dsa, v_dsa_map; end if;

  select count(*) into v_dsa_total  from public.dsa_problems;
  select count(*) into v_dsa_linked from public.dsa_problems where learning_grid_id is not null and learning_topic_id is not null;
  if v_dsa_total <> v_dsa_linked then
    raise exception 'validation: % dsa_problems, only % linked to a learning grid/topic', v_dsa_total, v_dsa_linked; end if;

  select count(*) into v_pt_total  from public.practice_tests;
  select count(*) into v_pt_linked from public.practice_tests where learning_grid_id is not null and learning_topic_id is not null;
  if v_pt_total <> v_pt_linked then
    raise exception 'validation: % practice_tests, only % linked', v_pt_total, v_pt_linked; end if;

  select count(*) into v_hr_total  from public.hr_questions;
  select count(*) into v_hr_linked from public.hr_questions where learning_grid_id is not null and learning_topic_id is not null;
  if v_hr_total <> v_hr_linked then
    raise exception 'validation: % hr_questions, only % linked', v_hr_total, v_hr_linked; end if;

  -- no orphan learning_topics (grid_id must always resolve)
  select count(*) into v_orphan from public.learning_topics t
    left join public.learning_grids g on g.id = t.grid_id where g.id is null;
  if v_orphan > 0 then raise exception 'validation: % orphan learning_topics', v_orphan; end if;

  -- historical attempts still resolve to a test
  select count(*) into v_orphan from public.test_attempts a
    left join public.practice_tests p on p.id = a.test_id where p.id is null;
  if v_orphan > 0 then raise exception 'validation: % test_attempts now orphaned', v_orphan; end if;

  select count(*) into v_orphan from public.user_dsa_progress u
    left join public.dsa_problems d on d.id = u.problem_id where d.id is null;
  if v_orphan > 0 then raise exception 'validation: % user_dsa_progress now orphaned', v_orphan; end if;

  select count(*) into v_co from public.learning_grid_companies;
  raise notice '0044 OK: 5 default grids, % aptitude + % dsa topics mapped, % practice_tests + % dsa_problems + % hr_questions linked, % company links, progress intact.',
    v_apt_map, v_dsa_map, v_pt_linked, v_dsa_linked, v_hr_linked, v_co;
end $$;

notify pgrst, 'reload schema';

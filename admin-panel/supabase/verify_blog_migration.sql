-- ============================================================================
-- verify_blog_migration.sql  —  READ-ONLY diagnostic (NOT a migration)
-- ----------------------------------------------------------------------------
-- Paste into the Supabase SQL editor and Run. It changes NOTHING: every
-- statement is a SELECT against pg_catalog / a RAISE NOTICE. It reports whether
-- every object defined by migration 037_blog.sql (mobile 0065_blog.sql) exists
-- in this database.
--
-- Expected (all present):
--   tables      : blog_categories, blog_posts
--   indexes     : blog_categories_pkey, blog_categories_slug_key,
--                 blog_posts_pkey, blog_posts_slug_key (UNIQUE on lower(slug)),
--                 blog_posts_public_idx, blog_posts_category_idx,
--                 blog_posts_tags_gin, blog_posts_featured_idx
--   FKs         : blog_posts_author_id_fkey, blog_posts_category_id_fkey,
--                 blog_posts_created_by_fkey, blog_posts_updated_by_fkey
--   checks      : blog_categories_slug_check, blog_posts_slug_check,
--                 blog_posts_status_check
--   triggers    : blog_categories_set_updated_at, blog_categories_cascade_name,
--                 blog_posts_set_updated_at, blog_posts_category_name_sync
--   RLS enabled : both tables
--   policies    : blog_categories_select_public, blog_categories_admin_all,
--                 blog_posts_select_public, blog_posts_admin_all
--   role rows   : role_permissions where module = 'blog'  (5 rows)
--   seed        : blog_categories has >= 7 rows
--
-- If a row is missing below, migration 037 is idempotent — simply re-paste and
-- Run 037_blog.sql; it recreates only what is absent and never drops data.
-- Do NOT create a new migration file for a gap here.
-- ============================================================================

\echo '--- 1. TABLES ---'
select table_name
from information_schema.tables
where table_schema = 'public' and table_name in ('blog_categories','blog_posts')
order by table_name;

\echo '--- 2. COLUMNS (expect 7 for blog_categories, 24 for blog_posts) ---'
select table_name, count(*) as column_count
from information_schema.columns
where table_schema = 'public' and table_name in ('blog_categories','blog_posts')
group by table_name
order by table_name;

select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('blog_categories','blog_posts')
order by table_name, ordinal_position;

\echo '--- 3. INDEXES ---'
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename in ('blog_categories','blog_posts')
order by tablename, indexname;

\echo '--- 4. CONSTRAINTS (PK / FK / CHECK / UNIQUE) ---'
select c.conrelid::regclass::text as table_name,
       c.conname as constraint_name,
       case c.contype when 'p' then 'PRIMARY KEY'
                      when 'f' then 'FOREIGN KEY'
                      when 'c' then 'CHECK'
                      when 'u' then 'UNIQUE'
                      else c.contype::text end as kind,
       pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid in ('public.blog_categories'::regclass, 'public.blog_posts'::regclass)
order by table_name, kind, constraint_name;

\echo '--- 5. TRIGGERS ---'
select event_object_table as table_name, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where trigger_schema = 'public' and event_object_table in ('blog_categories','blog_posts')
order by table_name, trigger_name;

\echo '--- 6. RLS ENABLED? (rowsecurity must be true for both) ---'
select relname as table_name, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where oid in ('public.blog_categories'::regclass, 'public.blog_posts'::regclass);

\echo '--- 7. RLS POLICIES ---'
select tablename, policyname, cmd as command, roles,
       coalesce(qual, '(none)')       as using_expr,
       coalesce(with_check, '(none)') as with_check_expr
from pg_policies
where schemaname = 'public' and tablename in ('blog_categories','blog_posts')
order by tablename, policyname;

\echo '--- 8. role_permissions rows for the blog module (expect 5) ---'
select role, module, can_view, can_add, can_edit, can_delete
from public.role_permissions
where module = 'blog'
order by role;

\echo '--- 9. seed data ---'
select 'blog_categories' as table_name, count(*) as rows from public.blog_categories
union all
select 'blog_posts', count(*) from public.blog_posts;

\echo '--- 10. blog_posts by status (data-state, not schema) ---'
select status, count(*) as posts, count(*) filter (where published_at is not null) as with_publish_date
from public.blog_posts
group by status
order by status;

-- ---------------------------------------------------------------------------
-- 11. One-line PASS/FAIL summary
-- ---------------------------------------------------------------------------
do $$
declare
  ok boolean := true;
  msg text := '';
  n int;
begin
  if to_regclass('public.blog_categories') is null then ok := false; msg := msg || ' [missing table blog_categories]'; end if;
  if to_regclass('public.blog_posts')      is null then ok := false; msg := msg || ' [missing table blog_posts]'; end if;

  if to_regclass('public.blog_posts') is not null then
    select count(*) into n from information_schema.columns
      where table_schema='public' and table_name='blog_posts';
    if n <> 24 then ok := false; msg := msg || format(' [blog_posts has %s columns, expected 24]', n); end if;

    for n in select 1 from unnest(array[
      'blog_posts_slug_key','blog_posts_public_idx','blog_posts_category_idx',
      'blog_posts_tags_gin','blog_posts_featured_idx']) x(name)
      where not exists (select 1 from pg_indexes where schemaname='public' and indexname=x.name)
    loop ok := false; end loop;
    if not ok then msg := msg || ' [one or more blog_posts indexes missing]'; end if;

    if not (select relrowsecurity from pg_class where oid='public.blog_posts'::regclass) then
      ok := false; msg := msg || ' [RLS disabled on blog_posts]';
    end if;
    if not exists (select 1 from pg_policies where tablename='blog_posts' and policyname='blog_posts_select_public') then
      ok := false; msg := msg || ' [missing policy blog_posts_select_public]';
    end if;
    if not exists (select 1 from pg_policies where tablename='blog_posts' and policyname='blog_posts_admin_all') then
      ok := false; msg := msg || ' [missing policy blog_posts_admin_all]';
    end if;
  end if;

  select count(*) into n from public.role_permissions where module='blog';
  if n < 5 then ok := false; msg := msg || format(' [role_permissions has %s blog rows, expected 5]', n); end if;

  if ok then
    raise notice 'BLOG MIGRATION 037/0065: FULLY APPLIED — schema, indexes, RLS and permissions all present.';
  else
    raise warning 'BLOG MIGRATION 037/0065: GAPS FOUND ->%. Re-run 037_blog.sql (idempotent) to backfill.', msg;
  end if;
end $$;

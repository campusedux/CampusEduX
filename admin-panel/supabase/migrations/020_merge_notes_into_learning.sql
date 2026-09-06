-- ============================================================================
-- 020_merge_notes_into_learning.sql — fold the flat Preparation Notes system
--   (prep_notes) into the single hierarchical Learning system (learning_*).
-- ============================================================================
-- Apply AFTER 019_learning_management.sql (Supabase SQL Editor / `supabase db
-- push`). Additive · guarded · idempotent · re-runnable.
--
-- CANONICAL COPY. The identical body also ships as
-- mobile-app/supabase/migrations/0043_merge_notes_into_learning.sql — both are
-- guarded, whichever runs first does the work. Keep the two byte-identical
-- below this header.
--
-- WHY
--   CampusEduX had two content systems for the same purpose: the flat
--   `prep_notes` table (website /placement/notes, the mobile Notes screen, the
--   admin "Preparation Notes" manager) and the hierarchical `learning_*` tree.
--   The product now has ONE learning system, "Learning". This migration copies
--   every prep_notes row into learning_* and the app code retires the standalone
--   Notes UI. `prep_notes` / `prep_note_bookmarks` are kept (deprecated,
--   read-only) for rollback and dropped in a later cleanup.
--
-- WHAT IT DOES  (all idempotent via learning_topics.source_prep_note_id)
--   1. one grid  "Preparation Notes"  (slug `preparation-notes`)
--   2. one section per distinct prep_notes.category
--   3. one topic  + one 'plain' content block per note
--   4. carries prep_note_bookmarks -> learning_bookmarks
--   5. resolver RPC learning_topic_by_source_note(uuid) for the website's
--      /placement/notes/<id> -> /learning/<grid>/<topic> redirect
--   6. marks prep_notes / prep_note_bookmarks DEPRECATED (comment only)
--
-- SAFETY
--   A prep_notes row that is course/branch-targeted (target_type <> 'global')
--   is imported as a DRAFT topic — learning_* has no academic targeting, so an
--   admin must confirm scope and re-publish. Global published notes import as
--   published topics. Nothing in prep_notes is modified or deleted.
-- ----------------------------------------------------------------------------

-- Table-free helper — safe to (re)create unconditionally. Mirrors the TS
-- slugify() in admin-panel/src/lib/learning/constants.ts and the slug CHECK
-- `^[a-z0-9]+(?:-[a-z0-9]+)*$` on learning_grids/sections/topics.
create or replace function public.learning_slugify(p text)
returns text language sql immutable as $$
  select btrim(regexp_replace(lower(btrim(coalesce(p, ''))), '[^a-z0-9]+', '-', 'g'), '-');
$$;

do $$
declare
  v_grid_id uuid;
  v_has_published boolean;
  v_cat text;
  v_order integer := 0;
begin
  if to_regclass('public.learning_grids') is null then
    raise notice '0043: learning_* tables not found — apply 0042_learning_management.sql (or admin 019) first, then re-run this migration.';
    return;
  end if;
  if to_regclass('public.prep_notes') is null then
    raise notice '0043: prep_notes not found — nothing to merge.';
    return;
  end if;
  if not exists (select 1 from public.prep_notes) then
    raise notice '0043: prep_notes has no rows — nothing to merge.';
    return;
  end if;

  -- --------------------------------------------------------------------------
  -- Resolver RPC (guarded dynamic DDL — body references learning_* tables).
  -- Returns the canonical grid/topic slug for a legacy prep_notes id so the
  -- website can 301 old /placement/notes/<id> links into /learning.
  -- --------------------------------------------------------------------------
  execute $ddl$
    create or replace function public.learning_topic_by_source_note(p_note_id uuid)
    returns table (grid_slug text, topic_slug text)
    language sql stable security definer set search_path = public as $fn$
      select g.slug, t.slug
      from public.learning_topics t
      join public.learning_sections s on s.id = t.section_id
      join public.learning_grids g on g.id = t.grid_id
      where t.source_prep_note_id = p_note_id
        and t.status = 'published' and s.status = 'published' and g.status = 'published'
        and t.show_on_website and s.show_on_website and g.show_on_website
      limit 1;
    $fn$;
  $ddl$;
  execute 'revoke all on function public.learning_topic_by_source_note(uuid) from public';
  execute 'grant execute on function public.learning_topic_by_source_note(uuid) to anon, authenticated';

  -- --------------------------------------------------------------------------
  -- 1. The "Preparation Notes" grid.
  -- --------------------------------------------------------------------------
  select id into v_grid_id from public.learning_grids where lower(slug) = 'preparation-notes';
  select exists (select 1 from public.prep_notes where is_published) into v_has_published;

  if v_grid_id is null then
    insert into public.learning_grids
      (name, slug, description, icon, sort_order, status, show_on_website, show_on_mobile)
    values
      ('Preparation Notes', 'preparation-notes',
       'Study notes carried over from the earlier Preparation Notes system.',
       'BookOpen', 100,
       case when v_has_published then 'published' else 'draft' end, true, true)
    returning id into v_grid_id;
  end if;

  -- --------------------------------------------------------------------------
  -- 2. One section per distinct prep_notes.category.
  -- --------------------------------------------------------------------------
  for v_cat in
    select distinct coalesce(nullif(btrim(category), ''), 'General Placement') as c
    from public.prep_notes
    order by 1
  loop
    if not exists (
      select 1 from public.learning_sections
      where grid_id = v_grid_id and lower(slug) = public.learning_slugify(v_cat)
    ) then
      insert into public.learning_sections
        (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
      values
        (v_grid_id, v_cat, public.learning_slugify(v_cat), '', v_order, 'published', true, true);
    end if;
    v_order := v_order + 10;
  end loop;

  -- --------------------------------------------------------------------------
  -- 3. One topic per not-yet-imported note (source_prep_note_id = idempotency).
  -- --------------------------------------------------------------------------
  with src as (
    select
      pn.id, pn.title, pn.topic, pn.content, pn.is_premium, pn.is_published, pn.created_at,
      coalesce(nullif(btrim(pn.category), ''), 'General Placement')      as cat,
      nullif(public.learning_slugify(pn.title), '')                     as base_slug,
      coalesce(to_jsonb(pn) ->> 'target_type', 'global')                as tgt_type
    from public.prep_notes pn
    where not exists (select 1 from public.learning_topics t where t.source_prep_note_id = pn.id)
  ),
  prepared as (
    select
      src.*,
      case
        when src.base_slug is null
          then 'note-' || replace(src.id::text, '-', '')
        when count(*) over (partition by src.base_slug) > 1
          then src.base_slug || '-' || replace(src.id::text, '-', '')
        when exists (
          select 1 from public.learning_topics t2
          where t2.grid_id = v_grid_id and t2.slug = src.base_slug
        )
          then src.base_slug || '-' || replace(src.id::text, '-', '')
        else src.base_slug
      end as final_slug
    from src
  )
  insert into public.learning_topics
    (section_id, title, slug, short_description, is_premium, status,
     show_on_website, show_on_mobile, source_prep_note_id, sort_order)
  select
    s.id,
    p.title,
    p.final_slug,
    left(coalesce(nullif(btrim(p.topic), ''), left(p.content, 200)), 300),
    coalesce(p.is_premium, false),
    case when p.is_published and p.tgt_type = 'global' then 'published' else 'draft' end,
    true, true,
    p.id,
    row_number() over (partition by p.cat order by p.created_at)
  from prepared p
  join public.learning_sections s
    on s.grid_id = v_grid_id
   and lower(s.slug) = public.learning_slugify(p.cat);

  -- one 'plain' content block per freshly-created topic (idempotent).
  insert into public.learning_contents
    (topic_id, heading, body, content_format, file_url, metadata, status, sort_order)
  select
    t.id, '', pn.content, 'plain', pn.file_url,
    jsonb_build_object(
      'source', 'prep_notes',
      'tags', to_jsonb(coalesce(pn.tags, '{}'::text[])),
      'thumbnail_url', pn.thumbnail_url
    ),
    'published', 0
  from public.learning_topics t
  join public.prep_notes pn on pn.id = t.source_prep_note_id
  where t.grid_id = v_grid_id
    and not exists (select 1 from public.learning_contents c where c.topic_id = t.id);

  -- --------------------------------------------------------------------------
  -- 4. Carry per-student bookmarks across.
  -- --------------------------------------------------------------------------
  if to_regclass('public.prep_note_bookmarks') is not null then
    insert into public.learning_bookmarks (user_id, topic_id, created_at)
    select b.user_id, t.id, b.created_at
    from public.prep_note_bookmarks b
    join public.learning_topics t on t.source_prep_note_id = b.note_id
    on conflict (user_id, topic_id) do nothing;
  end if;

  -- --------------------------------------------------------------------------
  -- 5. Mark the old tables deprecated (comment only — no data touched).
  -- --------------------------------------------------------------------------
  execute $c$comment on table public.prep_notes is
    'DEPRECATED 2026-09-01 — content merged into learning_* by migration 0043/020. Read-only; standalone UI retired. Drop after production verification.'$c$;
  if to_regclass('public.prep_note_bookmarks') is not null then
    execute $c$comment on table public.prep_note_bookmarks is
      'DEPRECATED 2026-09-01 — superseded by learning_bookmarks (migration 0043/020). Drop after production verification.'$c$;
  end if;

  raise notice '0043: merge complete — grid %, % topics now sourced from prep_notes.',
    v_grid_id,
    (select count(*) from public.learning_topics where source_prep_note_id is not null);
end $$;

notify pgrst, 'reload schema';

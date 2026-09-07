-- mobile-app/supabase/migrations/0067_blog_public_rls.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/039_blog_public_rls.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — Blog: public read = status='published' (drop the published_at gate)
--   Consumed by: website `/blog` + `/blog/[slug]`. The admin panel is
--   unaffected — it reads/writes through `blog_posts_admin_all` (is_admin).
-- ----------------------------------------------------------------------------
-- WHAT / WHY
--   Migration 037/0065 gave blog_posts this public SELECT policy:
--
--     status = 'published' AND published_at IS NOT NULL AND published_at <= now()
--
--   The admin panel, however, treats a post as "Published" on its `status`
--   column ALONE — the dashboard "Published" stat, the status pill and the
--   Publish / Unpublish toggle never look at published_at. A post that is
--   status='published' but whose published_at is NULL or still in the future
--   therefore shows as Published in Admin yet stays invisible to the anon role
--   on the website. That is the "/blog shows 1 of 2 published posts" bug: the
--   second post is published, but its published_at fails the extra gate.
--
--   This aligns the public gate with Admin: a row is publicly readable exactly
--   when status = 'published'. Draft and archived posts stay hidden.
--
--   Trade-off: a future-dated published post now goes live immediately instead
--   of being "scheduled". published_at is still stored and still drives display
--   order + article metadata (datePublished); it simply no longer gates
--   visibility. If scheduled publishing is wanted back later, reintroduce a
--   `(published_at is null or published_at <= now())` clause here and the
--   matching `.lte('published_at', …)` filters in website/src/lib/blog.ts.
--
-- SAFETY
--   Idempotent and reversible: drops and recreates ONE policy. No schema
--   change, no data change. The `blog_posts_admin_all` policy is untouched.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.blog_posts') is null then
    raise exception 'blog public rls: public.blog_posts not found — apply 037_blog.sql (or mobile 0065_blog.sql) first.';
  end if;
end $$;

drop policy if exists "blog_posts_select_public" on public.blog_posts;
create policy "blog_posts_select_public" on public.blog_posts
  for select using (status = 'published');

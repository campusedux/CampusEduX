-- PREPARED ONLY. Apply website/rollbacks/phase-2-public-cache.patch first.
-- Stop/drain ALL old website workers, restart with that app patch, and verify
-- fresh-read behavior BEFORE this SQL. See the Phase 2 handoff for exact steps.
-- This file owns its transaction: psql -X -v ON_ERROR_STOP=1 -f <this-file>;
-- do not add --single-transaction or wrap it in another BEGIN/COMMIT.
-- No content or revision data is removed. Do not apply to shared staging automatically.
begin;
drop trigger if exists public_revision_learning on public.learning_grids;
drop trigger if exists public_revision_learning on public.learning_sections;
drop trigger if exists public_revision_learning on public.learning_topics;
drop trigger if exists public_revision_learning on public.learning_contents;
drop trigger if exists public_revision_learning on public.practice_tests;
drop trigger if exists public_revision_learning on public.dsa_problems;
drop trigger if exists public_revision_blog on public.blog_posts;
drop trigger if exists public_revision_blog on public.blog_categories;
drop trigger if exists public_revision_home on public.projects;
drop trigger if exists public_revision_home on public.testimonials;
drop trigger if exists public_revision_home on public.faqs;
drop trigger if exists public_revision_home on public.banners;
revoke execute on function public.public_content_revision(text) from anon;
notify pgrst, 'reload schema';
commit;
-- Keep canonical ledger 0155 applied: it records an actually executed migration.
-- Do not fabricate admin 123, repair 0155 to reverted, or rerun a twin to resume.
-- Re-enabling requires a separately reviewed forward migration and app restart.

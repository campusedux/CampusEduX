-- ============================================================================
-- CampusEduX — Phase 1 index review (website query patterns)
-- ============================================================================
-- REVIEW BEFORE RUNNING. This is NOT applied automatically. Hand it to whoever
-- owns the Supabase migrations (the DB is shared by mobile-app + admin-panel +
-- website). Run in a migration or the SQL editor; each statement is idempotent.
--
-- Context: the existing schema is already well-indexed for the website's
-- access patterns (verified against mobile-app/ + admin-panel/ migrations —
-- ~180 indexes). The statements below close the *specific* gaps found while
-- auditing the website's server-side queries. They are ordered by expected
-- benefit. Nothing here is required for correctness.
--
-- `create index concurrently` cannot run inside a transaction / a single
-- migration file with other DDL. If your migration runner wraps files in a
-- transaction, either (a) put each CONCURRENTLY statement in its own file, or
-- (b) drop CONCURRENTLY (brief write-lock; fine for these small/medium tables).
-- The forms below use plain `create index` for portability — switch to
-- CONCURRENTLY if any of these tables is large and write-hot in production.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Marketplace / jobs free-text search  (HIGHEST VALUE)
-- ----------------------------------------------------------------------------
-- src/app/projects/page.tsx : .ilike("title", `%${q}%`)
-- src/app/jobs/page.tsx     : .ilike("title", `%${q}%`), .ilike("location", `%${q}%`)
--
-- A leading-wildcard ILIKE ('%term%') CANNOT use a btree index — today every
-- marketplace/jobs search is a full sequential scan of the table. pg_trgm GIN
-- indexes make these index-assisted. (The Learning module already uses trgm
-- indexes — this just extends the same treatment to projects/jobs.)

create extension if not exists pg_trgm;

create index if not exists projects_title_trgm
  on public.projects using gin (title gin_trgm_ops);

create index if not exists jobs_title_trgm
  on public.jobs using gin (title gin_trgm_ops);

create index if not exists jobs_location_trgm
  on public.jobs using gin (location gin_trgm_ops);


-- ----------------------------------------------------------------------------
-- 2. Marketplace / jobs sort options with no supporting index
-- ----------------------------------------------------------------------------
-- src/lib/marketplace.ts PROJECT_SORTS: "price-low" / "price-high" -> order by price
--                                       "rating"                   -> order by rating desc
-- src/lib/marketplace.ts JOB_SORTS:     "salary-high"              -> order by salary_max_lpa desc
--
-- projects already has indexes on category_id, sales_count, created_at,
-- is_premium, is_best_seller — but NOT price or rating, so those two sort
-- orders do a full sort every request. Same for jobs.salary_max_lpa.

create index if not exists projects_price_idx
  on public.projects (price);

create index if not exists projects_rating_idx
  on public.projects (rating desc);

create index if not exists jobs_salary_max_lpa_idx
  on public.jobs (salary_max_lpa desc nulls last);


-- ----------------------------------------------------------------------------
-- 3. Résumé dashboard version tally
-- ----------------------------------------------------------------------------
-- src/app/resume/page.tsx:
--   supabase.from("resume_versions").select("resume_id").eq("user_id", user.id)
--
-- resume_versions only has (resume_id, created_at desc). The dashboard filters
-- by user_id alone to count versions per résumé, which currently scans that
-- user's rows via RLS instead of using an index.

create index if not exists resume_versions_user_id_idx
  on public.resume_versions (user_id);


-- ----------------------------------------------------------------------------
-- 4. OPTIONAL — low value today, worth it only if these tables grow
-- ----------------------------------------------------------------------------
-- resume_shares is filtered by (resume_id, user_id) on the editor page and in
-- listResumeSharesAction, but only (user_id) is indexed. Few rows per user, so
-- the (user_id) prefix scan is cheap — add this only if share usage grows.
create index if not exists resume_shares_resume_id_idx
  on public.resume_shares (resume_id);

-- The small CMS/config tables below are read on ISR-cached routes (revalidate
-- 300s) and hold well under ~100 rows each, so a seq scan is already trivial.
-- Provided for completeness; skip unless a table unexpectedly grows large.
create index if not exists faqs_active_sort_idx
  on public.faqs (sort_order) where status = 'active';

create index if not exists testimonials_active_sort_idx
  on public.testimonials (sort_order) where status = 'active';

create index if not exists offer_banners_active_sort_idx
  on public.offer_banners (sort_order) where is_active;

create index if not exists announcements_active_updated_idx
  on public.announcements (updated_at desc) where status = 'active';


-- ----------------------------------------------------------------------------
-- NOT NEEDED — verified already covered (do not add)
-- ----------------------------------------------------------------------------
--   saved_jobs            : PK (user_id, job_id)
--   wishlists             : PK (user_id, project_id)
--   applications          : unique (user_id, job_id) + applications_job_id_idx
--   learning_bookmarks    : PK (user_id, topic_id)
--   custom_project_drafts : PK (user_id)
--   wallet_transactions   : (user_id, created_at desc)
--   notifications         : (user_id, created_at desc)
--   purchases             : (user_id, created_at desc) + purchases_project_id_idx
--   resumes_builder       : (user_id, updated_at desc)
--   resume_downloads      : (user_id, downloaded_at desc)
--   legal_consents        : (user_id, accepted_at desc)
--   reviews               : (project_id, created_at desc)
--   companies             : PK (id) + (open_jobs_count desc)
--   jobs                  : company_id, posted_at, job_type, skills(gin), status
--   custom_project_*       : every child table has a (request_id) / (delivery_id) index
--   test_questions         : (test_id, sort_order)
--   test_attempt_answers   : (attempt_id)

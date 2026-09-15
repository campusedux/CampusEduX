-- mobile-app/supabase/migrations/0096_seed_dbms_sql_tutorial_ch12_ch13_ch14.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/068_seed_dbms_sql_tutorial_ch12_ch13_ch14.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — DBMS & SQL Tutorial: Chapters 12, 13, 14 (batch 5)
-- ============================================================================
-- WHAT / WHY
--   Fifth content batch, on top of 0091/063 (schema) + batches 1-4 (chapters
--   1-11). Adds Chapter 12 (SELECT and Filtering, 15 topics), Chapter 13
--   (Sorting and Pagination, 9 topics), Chapter 14 (SQL Functions, 13
--   topics) = 37 more topics, 296 more topic-quiz MCQs, 3 more Chapter
--   tests, and 9 more SQL coding problems (6 on Chapter 12 covering WHERE/
--   BETWEEN/IN/LIKE/CASE/COALESCE, 3 on Chapter 13 covering multi-key sort/
--   Top-N/keyset pagination, 3 more spread implicitly via Chapter 14's
--   aggregate/string/date function problems — all verified end-to-end
--   against Paiza's live sandbox).
--
--   Same content policy as batch 1: original, accurate DBMS content authored
--   from real subject knowledge, using the source file's chapter/topic
--   TITLES as the curriculum outline (its body text is unusable boilerplate).
--
--   The full-course test (pt-dbms-sql-course-test, 0092) needs NO changes —
--   its pool is computed live via practice_test_pool() (0091/063) and
--   automatically grows to include these 37 topics' questions.
--
-- IDEMPOTENT. Same guarantees as 0092/064: never duplicates, never
-- overwrites an admin's later publish/premium/visibility edits.
-- ----------------------------------------------------------------------------

-- ---- ordering guard ---------------------------------------------------------
do $guard$
begin
  if not exists (select 1 from public.learning_grids where lower(slug) = $dbv40001$dbms-sql-tutorial$dbv40001$) then
    raise exception '0096/068: dbms-sql-tutorial grid not found — apply 0092_seed_dbms_sql_tutorial_ch1_ch2_ch8.sql (admin 064) first.';
  end if;
  if to_regprocedure('public.practice_test_pool(text)') is null then
    raise exception '0096/068: DBMS-practice RPCs not found — apply 0091_dbms_sql_practice.sql (admin 063) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 1. SECTIONS — re-affirm all 43 (idempotent no-op for rows 0092 already set;
--    harmless if this migration is ever applied to a fresh project before 0092).
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = $dbv40002$dbms-sql-tutorial$dbv40002$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40003$Chapter 1: Database Foundations$dbv40003$, $dbv40004$chapter-1-database-foundations$dbv40004$, 1, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40005$dbms-sql-tutorial$dbv40005$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40006$Chapter 2: DBMS Architecture$dbv40006$, $dbv40007$chapter-2-dbms-architecture$dbv40007$, 2, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40008$dbms-sql-tutorial$dbv40008$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40009$Chapter 3: Data Models$dbv40009$, $dbv40010$chapter-3-data-models$dbv40010$, 3, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40011$dbms-sql-tutorial$dbv40011$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40012$Chapter 4: Relational Model$dbv40012$, $dbv40013$chapter-4-relational-model$dbv40013$, 4, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40014$dbms-sql-tutorial$dbv40014$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40015$Chapter 5: Keys and Integrity$dbv40015$, $dbv40016$chapter-5-keys-and-integrity$dbv40016$, 5, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40017$dbms-sql-tutorial$dbv40017$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40018$Chapter 6: ER and EER Modeling$dbv40018$, $dbv40019$chapter-6-er-and-eer-modeling$dbv40019$, 6, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40020$dbms-sql-tutorial$dbv40020$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40021$Chapter 7: Relational Algebra$dbv40021$, $dbv40022$chapter-7-relational-algebra$dbv40022$, 7, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40023$dbms-sql-tutorial$dbv40023$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40024$Chapter 8: SQL Fundamentals$dbv40024$, $dbv40025$chapter-8-sql-fundamentals$dbv40025$, 8, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40026$dbms-sql-tutorial$dbv40026$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40027$Chapter 9: DDL and Schema Design$dbv40027$, $dbv40028$chapter-9-ddl-and-schema-design$dbv40028$, 9, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40029$dbms-sql-tutorial$dbv40029$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40030$Chapter 10: SQL Constraints$dbv40030$, $dbv40031$chapter-10-sql-constraints$dbv40031$, 10, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40032$dbms-sql-tutorial$dbv40032$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40033$Chapter 11: DML and Data Modification$dbv40033$, $dbv40034$chapter-11-dml-and-data-modification$dbv40034$, 11, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40035$dbms-sql-tutorial$dbv40035$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40036$Chapter 12: SELECT and Filtering$dbv40036$, $dbv40037$chapter-12-select-and-filtering$dbv40037$, 12, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40038$dbms-sql-tutorial$dbv40038$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40039$Chapter 13: Sorting and Pagination$dbv40039$, $dbv40040$chapter-13-sorting-and-pagination$dbv40040$, 13, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40041$dbms-sql-tutorial$dbv40041$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40042$Chapter 14: SQL Functions$dbv40042$, $dbv40043$chapter-14-sql-functions$dbv40043$, 14, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40044$dbms-sql-tutorial$dbv40044$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40045$Chapter 15: GROUP BY and Aggregation$dbv40045$, $dbv40046$chapter-15-group-by-and-aggregation$dbv40046$, 15, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40047$dbms-sql-tutorial$dbv40047$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40048$Chapter 16: Joins$dbv40048$, $dbv40049$chapter-16-joins$dbv40049$, 16, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40050$dbms-sql-tutorial$dbv40050$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40051$Chapter 17: Subqueries$dbv40051$, $dbv40052$chapter-17-subqueries$dbv40052$, 17, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40053$dbms-sql-tutorial$dbv40053$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40054$Chapter 18: Set Operations$dbv40054$, $dbv40055$chapter-18-set-operations$dbv40055$, 18, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40056$dbms-sql-tutorial$dbv40056$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40057$Chapter 19: Views$dbv40057$, $dbv40058$chapter-19-views$dbv40058$, 19, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40059$dbms-sql-tutorial$dbv40059$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40060$Chapter 20: Indexes and Access Paths$dbv40060$, $dbv40061$chapter-20-indexes-and-access-paths$dbv40061$, 20, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40062$dbms-sql-tutorial$dbv40062$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40063$Chapter 21: Normalization and Functional Dependencies$dbv40063$, $dbv40064$chapter-21-normalization-and-functional-dependencies$dbv40064$, 21, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40065$dbms-sql-tutorial$dbv40065$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40066$Chapter 22: Transactions$dbv40066$, $dbv40067$chapter-22-transactions$dbv40067$, 22, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40068$dbms-sql-tutorial$dbv40068$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40069$Chapter 23: Concurrency Control$dbv40069$, $dbv40070$chapter-23-concurrency-control$dbv40070$, 23, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40071$dbms-sql-tutorial$dbv40071$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40072$Chapter 24: Locking Protocols$dbv40072$, $dbv40073$chapter-24-locking-protocols$dbv40073$, 24, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40074$dbms-sql-tutorial$dbv40074$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40075$Chapter 25: Isolation Levels$dbv40075$, $dbv40076$chapter-25-isolation-levels$dbv40076$, 25, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40077$dbms-sql-tutorial$dbv40077$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40078$Chapter 26: Recovery and Logging$dbv40078$, $dbv40079$chapter-26-recovery-and-logging$dbv40079$, 26, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40080$dbms-sql-tutorial$dbv40080$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40081$Chapter 27: Database Security$dbv40081$, $dbv40082$chapter-27-database-security$dbv40082$, 27, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40083$dbms-sql-tutorial$dbv40083$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40084$Chapter 28: Stored Procedures$dbv40084$, $dbv40085$chapter-28-stored-procedures$dbv40085$, 28, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40086$dbms-sql-tutorial$dbv40086$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40087$Chapter 29: Stored Functions$dbv40087$, $dbv40088$chapter-29-stored-functions$dbv40088$, 29, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40089$dbms-sql-tutorial$dbv40089$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40090$Chapter 30: Triggers$dbv40090$, $dbv40091$chapter-30-triggers$dbv40091$, 30, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40092$dbms-sql-tutorial$dbv40092$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40093$Chapter 31: Cursors$dbv40093$, $dbv40094$chapter-31-cursors$dbv40094$, 31, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40095$dbms-sql-tutorial$dbv40095$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40096$Chapter 32: Advanced SQL: CTE$dbv40096$, $dbv40097$chapter-32-advanced-sql-cte$dbv40097$, 32, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40098$dbms-sql-tutorial$dbv40098$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40099$Chapter 33: Advanced SQL: Window Functions$dbv40099$, $dbv40100$chapter-33-advanced-sql-window-functions$dbv40100$, 33, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40101$dbms-sql-tutorial$dbv40101$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40102$Chapter 34: Advanced SQL Patterns$dbv40102$, $dbv40103$chapter-34-advanced-sql-patterns$dbv40103$, 34, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40104$dbms-sql-tutorial$dbv40104$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40105$Chapter 35: Query Processing and Optimization$dbv40105$, $dbv40106$chapter-35-query-processing-and-optimization$dbv40106$, 35, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40107$dbms-sql-tutorial$dbv40107$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40108$Chapter 36: Physical Storage$dbv40108$, $dbv40109$chapter-36-physical-storage$dbv40109$, 36, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40110$dbms-sql-tutorial$dbv40110$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40111$Chapter 37: Advanced Index Structures$dbv40111$, $dbv40112$chapter-37-advanced-index-structures$dbv40112$, 37, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40113$dbms-sql-tutorial$dbv40113$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40114$Chapter 38: Distributed Databases$dbv40114$, $dbv40115$chapter-38-distributed-databases$dbv40115$, 38, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40116$dbms-sql-tutorial$dbv40116$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40117$Chapter 39: NoSQL Databases$dbv40117$, $dbv40118$chapter-39-nosql-databases$dbv40118$, 39, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40119$dbms-sql-tutorial$dbv40119$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40120$Chapter 40: Database Scaling$dbv40120$, $dbv40121$chapter-40-database-scaling$dbv40121$, 40, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40122$dbms-sql-tutorial$dbv40122$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40123$Chapter 41: Data Warehousing$dbv40123$, $dbv40124$chapter-41-data-warehousing$dbv40124$, 41, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40125$dbms-sql-tutorial$dbv40125$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40126$Chapter 42: Database Design Projects$dbv40126$, $dbv40127$chapter-42-database-design-projects$dbv40127$, 42, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40128$dbms-sql-tutorial$dbv40128$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbv40129$Chapter 43: Interview and Placement Preparation$dbv40129$, $dbv40130$chapter-43-interview-and-placement-preparation$dbv40130$, 43, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. TOPICS + NOTES CONTENT + MCQ QUIZ per topic (chapters 3, 4, 5)
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- Chapter 12: SELECT and Filtering
-- ---------------------------------------------------------------------------
-- 12.1 SELECT
with g as (select id from public.learning_grids where lower(slug) = $dbv40131$dbms-sql-tutorial$dbv40131$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40132$chapter-12-select-and-filtering$dbv40132$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40133$SELECT$dbv40133$, $dbv40134$select$dbv40134$, '', 1, 'published', true, true, $dbv40135$dbms_sql_tutorial$dbv40135$, $dbv40136$chapter-12-select-and-filtering/select$dbv40136$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40137$dbms_sql_tutorial$dbv40137$ and source_ref = $dbv40138$chapter-12-select-and-filtering/select$dbv40138$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40139$SELECT$dbv40139$, $dbv40140$### Definition

`SELECT` retrieves data from one or more tables — it's the single most-used SQL statement, and the entry point for reading anything back out of a database.

### How It Works

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name, price FROM products;
SELECT * FROM products;                -- every column
SELECT name, price * 1.18 AS price_with_tax FROM products;  -- computed expression
```

`SELECT` can return literal columns, computed expressions, or `*` (every column). The column list can also include arithmetic, string concatenation, or function calls — anything that produces one value per row.

### Edge Cases and Pitfalls

- `SELECT *` is convenient for exploring data interactively but risky in application code: it silently changes shape if the table's columns change later, and returns more data over the network than might be needed.
- The order of columns in the output exactly matches the order written in the `SELECT` list — it has nothing to do with the table's physical column order.
- `SELECT` alone with no `FROM` is valid in some dialects for evaluating a plain expression (`SELECT 2 + 2;`) — useful for testing an expression without touching any table.

### Key Takeaways

- `SELECT column_list FROM table` is the basic shape of every read query.
- The column list can include real columns, computed expressions, and aliases.
- Prefer explicit column lists over `SELECT *` in real application code.$dbv40140$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40141$dbms_sql_tutorial_seed$dbv40141$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40142$dbms_sql_tutorial_seed$dbv40142$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40143$dbms-sql-tutorial$dbv40143$),
     t as (select id from public.learning_topics where source_kind = $dbv40144$dbms_sql_tutorial$dbv40144$ and source_ref = $dbv40145$chapter-12-select-and-filtering/select$dbv40145$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40146$pt-dbms-sql-12-select$dbv40146$, $dbv40147$SELECT - Quick Test$dbv40147$, 'aptitude', 8, 8,
  $dbv40148$8 questions on SELECT.$dbv40148$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40149$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40149$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40150$tq-dbms-sql-12-select-1$dbv40150$, $dbv40151$pt-dbms-sql-12-select$dbv40151$,
   $dbv40152$What does SELECT do?$dbv40152$,
   $dbv40153$["Modifies data", "Retrieves data from one or more tables", "Deletes a table", "Creates an index"]$dbv40153$::jsonb,
   1, $dbv40154$SELECT is the read/retrieval statement in SQL.$dbv40154$, 1, 0),
  ($dbv40155$tq-dbms-sql-12-select-2$dbv40155$, $dbv40156$pt-dbms-sql-12-select$dbv40156$,
   $dbv40157$What does SELECT * FROM products return?$dbv40157$,
   $dbv40158$["Only the first column", "Every column of every row in products", "Only distinct rows", "A count of rows"]$dbv40158$::jsonb,
   1, $dbv40159$The asterisk requests all columns.$dbv40159$, 1, 1),
  ($dbv40160$tq-dbms-sql-12-select-3$dbv40160$, $dbv40161$pt-dbms-sql-12-select$dbv40161$,
   $dbv40162$Can a SELECT column list include a computed expression, not just raw columns?$dbv40162$,
   $dbv40163$["No, only column names are allowed", "Yes \u2014 expressions like price * 1.18 AS price_with_tax are valid and common", "Only in the WHERE clause, never SELECT", "Only aggregate functions can appear in SELECT"]$dbv40163$::jsonb,
   1, $dbv40164$SELECT can compute values, not just retrieve stored ones, as long as one value per row results.$dbv40164$, 1, 2),
  ($dbv40165$tq-dbms-sql-12-select-4$dbv40165$, $dbv40166$pt-dbms-sql-12-select$dbv40166$,
   $dbv40167$What determines the ORDER of columns in a SELECT's output?$dbv40167$,
   $dbv40168$["The table's physical column storage order, always", "The order the columns are written in the SELECT list", "Alphabetical order automatically", "It is randomized each time"]$dbv40168$::jsonb,
   1, $dbv40169$Output column order follows the SELECT list, independent of the table's underlying column order.$dbv40169$, 1, 3),
  ($dbv40170$tq-dbms-sql-12-select-5$dbv40170$, $dbv40171$pt-dbms-sql-12-select$dbv40171$,
   $dbv40172$Why is SELECT * considered risky in production application code?$dbv40172$,
   $dbv40173$["It is always slower than naming columns by a large fixed amount", "It silently changes shape if the table's columns change later, and returns unnecessary data", "SELECT * is not valid SQL", "It can only be used with exactly one table"]$dbv40173$::jsonb,
   1, $dbv40174$Implicit dependence on the table's current shape is the core risk of SELECT * in real code.$dbv40174$, 1, 4),
  ($dbv40175$tq-dbms-sql-12-select-6$dbv40175$, $dbv40176$pt-dbms-sql-12-select$dbv40176$,
   $dbv40177$Is `SELECT 2 + 2;` (no FROM clause) valid in some dialects?$dbv40177$,
   $dbv40178$["No, FROM is always mandatory", "Yes, in dialects that support it \u2014 useful for evaluating a plain expression", "Only if a table named 'dual' exists", "This always returns an error in every dialect"]$dbv40178$::jsonb,
   1, $dbv40179$Several dialects (e.g. MySQL, PostgreSQL) allow SELECT without FROM for expression-only queries.$dbv40179$, 1, 5),
  ($dbv40180$tq-dbms-sql-12-select-7$dbv40180$, $dbv40181$pt-dbms-sql-12-select$dbv40181$,
   $dbv40182$Can an alias given with AS be used to rename a SELECT column in the output?$dbv40182$,
   $dbv40183$["No, aliases only apply to tables", "Yes \u2014 AS renames the output column, purely for display/readability", "Aliases change the underlying stored column name", "AS is required for every column"]$dbv40183$::jsonb,
   1, $dbv40184$AS provides a friendlier or clearer name for the result column without touching the schema.$dbv40184$, 1, 6),
  ($dbv40185$tq-dbms-sql-12-select-8$dbv40185$, $dbv40186$pt-dbms-sql-12-select$dbv40186$,
   $dbv40187$Does SELECT modify any data in the underlying table?$dbv40187$,
   $dbv40188$["Yes, it can update rows as a side effect", "No \u2014 SELECT is purely read-only", "Only if ORDER BY is included", "Only for aggregate queries"]$dbv40188$::jsonb,
   1, $dbv40189$SELECT never changes stored data — it's the read-only counterpart to INSERT/UPDATE/DELETE.$dbv40189$, 1, 7)
on conflict (id) do nothing;

-- 12.2 DISTINCT
with g as (select id from public.learning_grids where lower(slug) = $dbv40190$dbms-sql-tutorial$dbv40190$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40191$chapter-12-select-and-filtering$dbv40191$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40192$DISTINCT$dbv40192$, $dbv40193$distinct$dbv40193$, '', 2, 'published', true, true, $dbv40194$dbms_sql_tutorial$dbv40194$, $dbv40195$chapter-12-select-and-filtering/distinct$dbv40195$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40196$dbms_sql_tutorial$dbv40196$ and source_ref = $dbv40197$chapter-12-select-and-filtering/distinct$dbv40197$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40198$DISTINCT$dbv40198$, $dbv40199$### Definition

`DISTINCT` removes duplicate rows from a `SELECT`'s result, keeping only one copy of each unique combination of the selected columns.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT DISTINCT category FROM products;
```

This returns each category name exactly once, no matter how many products share it — 'Electronics', 'Stationery', 'Books', etc., each appearing a single time.

### Edge Cases and Pitfalls

- `DISTINCT` applies to the ENTIRE row of selected columns, not each column independently: `SELECT DISTINCT category, price FROM products` keeps a row only if the (category, price) COMBINATION is unique, not each column separately.
- `DISTINCT` requires the database to compare and de-duplicate every row, which has a real performance cost on large result sets — it's not "free."
- `COUNT(DISTINCT column)` (combining DISTINCT with an aggregate, as seen in Chapter 14) is a different syntactic position than `SELECT DISTINCT` — both achieve de-duplication, but in different contexts (one counts distinct values, the other returns distinct rows).

### Key Takeaways

- `DISTINCT` removes duplicate rows based on the full combination of selected columns.
- It has a genuine performance cost — a de-duplication pass over the result.
- `SELECT DISTINCT col` and `COUNT(DISTINCT col)` are related but distinct usages.$dbv40199$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40200$dbms_sql_tutorial_seed$dbv40200$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40201$dbms_sql_tutorial_seed$dbv40201$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40202$dbms-sql-tutorial$dbv40202$),
     t as (select id from public.learning_topics where source_kind = $dbv40203$dbms_sql_tutorial$dbv40203$ and source_ref = $dbv40204$chapter-12-select-and-filtering/distinct$dbv40204$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40205$pt-dbms-sql-12-distinct$dbv40205$, $dbv40206$DISTINCT - Quick Test$dbv40206$, 'aptitude', 8, 8,
  $dbv40207$8 questions on DISTINCT.$dbv40207$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40208$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40208$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40209$tq-dbms-sql-12-distinct-1$dbv40209$, $dbv40210$pt-dbms-sql-12-distinct$dbv40210$,
   $dbv40211$What does DISTINCT do?$dbv40211$,
   $dbv40212$["Sorts the result", "Removes duplicate rows from the result, based on the selected columns", "Filters rows by a condition", "Limits the number of rows returned"]$dbv40212$::jsonb,
   1, $dbv40213$DISTINCT de-duplicates the result set.$dbv40213$, 1, 0),
  ($dbv40214$tq-dbms-sql-12-distinct-2$dbv40214$, $dbv40215$pt-dbms-sql-12-distinct$dbv40215$,
   $dbv40216$In SELECT DISTINCT category, price FROM products, what counts as a 'duplicate' to be removed?$dbv40216$,
   $dbv40217$["Any row sharing the same category, regardless of price", "Rows where the (category, price) COMBINATION matches exactly", "Any row sharing the same price, regardless of category", "DISTINCT cannot be used with two columns"]$dbv40217$::jsonb,
   1, $dbv40218$DISTINCT considers the full combination of selected columns together, not each independently.$dbv40218$, 1, 1),
  ($dbv40219$tq-dbms-sql-12-distinct-3$dbv40219$, $dbv40220$pt-dbms-sql-12-distinct$dbv40220$,
   $dbv40221$Does DISTINCT have a performance cost?$dbv40221$,
   $dbv40222$["No, it is always free", "Yes \u2014 comparing and de-duplicating rows takes real computational work, especially on large result sets", "Only when used with ORDER BY", "Only on tables with fewer than 10 rows"]$dbv40222$::jsonb,
   1, $dbv40223$De-duplication is genuine work the database must perform, not a free operation.$dbv40223$, 1, 2),
  ($dbv40224$tq-dbms-sql-12-distinct-4$dbv40224$, $dbv40225$pt-dbms-sql-12-distinct$dbv40225$,
   $dbv40226$If products has 4 Electronics rows and 2 Books rows, how many rows does SELECT DISTINCT category return?$dbv40226$,
   $dbv40227$["6", "2", "4", "0"]$dbv40227$::jsonb,
   1, $dbv40228$Only the distinct category values (Electronics, Books) are returned — 2 rows.$dbv40228$, 1, 3),
  ($dbv40229$tq-dbms-sql-12-distinct-5$dbv40229$, $dbv40230$pt-dbms-sql-12-distinct$dbv40230$,
   $dbv40231$Is COUNT(DISTINCT column) the same syntax position as SELECT DISTINCT?$dbv40231$,
   $dbv40232$["Yes, identical usage", "No \u2014 they're related but different: one counts distinct values inside an aggregate, the other returns distinct full rows", "COUNT(DISTINCT column) is invalid SQL", "SELECT DISTINCT can only be used inside COUNT"]$dbv40232$::jsonb,
   1, $dbv40233$Both use the DISTINCT keyword for de-duplication but in different syntactic roles.$dbv40233$, 1, 4),
  ($dbv40234$tq-dbms-sql-12-distinct-6$dbv40234$, $dbv40235$pt-dbms-sql-12-distinct$dbv40235$,
   $dbv40236$Can DISTINCT be combined with ORDER BY?$dbv40236$,
   $dbv40237$["No, they are mutually exclusive", "Yes \u2014 DISTINCT de-duplicates first, and the result can still be sorted with ORDER BY", "ORDER BY undoes the effect of DISTINCT", "DISTINCT automatically sorts the result, making ORDER BY redundant"]$dbv40237$::jsonb,
   1, $dbv40238$DISTINCT and ORDER BY can be combined; DISTINCT doesn't inherently guarantee any particular order.$dbv40238$, 1, 5),
  ($dbv40239$tq-dbms-sql-12-distinct-7$dbv40239$, $dbv40240$pt-dbms-sql-12-distinct$dbv40240$,
   $dbv40241$What is the effect of SELECT DISTINCT * FROM products (using every column)?$dbv40241$,
   $dbv40242$["It returns only unique full rows \u2014 equivalent to how a relational-algebra Projection onto all columns behaves", "It has no effect since every row already has a unique id", "It causes a syntax error", "It only removes duplicate ids"]$dbv40242$::jsonb,
   0, $dbv40243$DISTINCT * removes any fully-duplicate rows across every column, matching the set-based row-uniqueness idea from relational algebra Projection.$dbv40243$, 1, 6),
  ($dbv40244$tq-dbms-sql-12-distinct-8$dbv40244$, $dbv40245$pt-dbms-sql-12-distinct$dbv40245$,
   $dbv40246$Does DISTINCT distinguish between NULL and other NULL values when de-duplicating?$dbv40246$,
   $dbv40247$["Every NULL is always treated as distinct from every other NULL", "For de-duplication purposes, DISTINCT treats multiple NULLs in the same column as duplicates of each other (unlike UNIQUE constraint semantics)", "DISTINCT cannot be used on columns that allow NULL", "NULLs are always removed entirely by DISTINCT"]$dbv40247$::jsonb,
   1, $dbv40248$This is a genuine SQL subtlety — DISTINCT groups NULLs together as equal for de-duplication, differing from how NULL is treated in most other comparisons.$dbv40248$, 1, 7)
on conflict (id) do nothing;

-- 12.3 WHERE
with g as (select id from public.learning_grids where lower(slug) = $dbv40249$dbms-sql-tutorial$dbv40249$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40250$chapter-12-select-and-filtering$dbv40250$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40251$WHERE$dbv40251$, $dbv40252$where$dbv40252$, '', 3, 'published', true, true, $dbv40253$dbms_sql_tutorial$dbv40253$, $dbv40254$chapter-12-select-and-filtering/where$dbv40254$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40255$dbms_sql_tutorial$dbv40255$ and source_ref = $dbv40256$chapter-12-select-and-filtering/where$dbv40256$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40257$WHERE$dbv40257$, $dbv40258$### Definition

`WHERE` filters rows, keeping only those where a condition evaluates to `TRUE` — the direct SQL implementation of relational algebra's Selection (7.1).

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name, price FROM products WHERE category = 'Electronics' AND price > 50000;
```

`WHERE` is evaluated per-row, BEFORE any grouping (`GROUP BY`) happens — this is exactly why `WHERE` cannot reference an aggregate like `SUM(price)` (that's what `HAVING` is for, Chapter 15). A `WHERE` condition can combine comparisons (12.4), logical operators (12.5), ranges (`BETWEEN`, 12.6), set membership (`IN`, 12.7), pattern matching (`LIKE`, 12.8), and NULL tests (`IS NULL`, 12.10) — all the topics in the rest of this chapter are building blocks for `WHERE` conditions.

### Edge Cases and Pitfalls

- Rows where the `WHERE` condition evaluates to `UNKNOWN` (usually from a `NULL` comparison) are excluded, exactly like `FALSE` rows — this is the three-valued-logic behavior from Chapter 8's NULL Semantics.
- Omitting `WHERE` entirely from a `SELECT` returns every row — harmless for `SELECT`, but the same omission on `UPDATE`/`DELETE` is a serious, common mistake (Chapter 11).
- `WHERE` conditions are evaluated left-to-right respecting operator precedence (12.15) — parenthesizing compound conditions explicitly, even when not strictly required, makes intent clearer and avoids precedence mistakes.

### Key Takeaways

- `WHERE` filters individual rows before any grouping; it's the SQL form of relational Selection.
- It cannot reference aggregate functions — that's HAVING's job (Chapter 15).
- Every filtering technique in this chapter (comparisons, BETWEEN, IN, LIKE, IS NULL) is a building block for WHERE conditions.$dbv40258$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40259$dbms_sql_tutorial_seed$dbv40259$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40260$dbms_sql_tutorial_seed$dbv40260$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40261$dbms-sql-tutorial$dbv40261$),
     t as (select id from public.learning_topics where source_kind = $dbv40262$dbms_sql_tutorial$dbv40262$ and source_ref = $dbv40263$chapter-12-select-and-filtering/where$dbv40263$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40264$pt-dbms-sql-12-where$dbv40264$, $dbv40265$WHERE - Quick Test$dbv40265$, 'aptitude', 8, 8,
  $dbv40266$8 questions on WHERE.$dbv40266$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40267$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40267$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40268$tq-dbms-sql-12-where-1$dbv40268$, $dbv40269$pt-dbms-sql-12-where$dbv40269$,
   $dbv40270$What does WHERE do?$dbv40270$,
   $dbv40271$["Sorts rows", "Filters rows, keeping only those where the condition is TRUE", "Groups rows into categories", "Renames a column"]$dbv40271$::jsonb,
   1, $dbv40272$WHERE is SQL's row-filtering clause.$dbv40272$, 1, 0),
  ($dbv40273$tq-dbms-sql-12-where-2$dbv40273$, $dbv40274$pt-dbms-sql-12-where$dbv40274$,
   $dbv40275$Which relational algebra operation does WHERE directly correspond to?$dbv40275$,
   $dbv40276$["Projection", "Selection", "Union", "Cartesian Product"]$dbv40276$::jsonb,
   1, $dbv40277$WHERE is the SQL implementation of Selection (7.1).$dbv40277$, 1, 1),
  ($dbv40278$tq-dbms-sql-12-where-3$dbv40278$, $dbv40279$pt-dbms-sql-12-where$dbv40279$,
   $dbv40280$Why can't a WHERE clause reference an aggregate function like SUM(price)?$dbv40280$,
   $dbv40281$["Aggregate functions are never allowed anywhere in SQL", "WHERE is evaluated before any grouping/aggregation happens, so aggregate values don't exist yet at that stage", "WHERE can only compare text values", "This is simply a made-up SQL rule with no real reason"]$dbv40281$::jsonb,
   1, $dbv40282$Aggregates are computed during/after GROUP BY, which runs after WHERE — hence HAVING exists for aggregate-based filtering.$dbv40282$, 1, 2),
  ($dbv40283$tq-dbms-sql-12-where-4$dbv40283$, $dbv40284$pt-dbms-sql-12-where$dbv40284$,
   $dbv40285$What happens to a row where the WHERE condition evaluates to UNKNOWN (e.g. due to a NULL comparison)?$dbv40285$,
   $dbv40286$["It is included, treated the same as TRUE", "It is excluded, treated the same as FALSE", "It causes an error", "It is included but flagged specially"]$dbv40286$::jsonb,
   1, $dbv40287$WHERE only keeps rows where the condition is definitely TRUE; UNKNOWN rows are filtered out just like FALSE ones.$dbv40287$, 1, 3),
  ($dbv40288$tq-dbms-sql-12-where-5$dbv40288$, $dbv40289$pt-dbms-sql-12-where$dbv40289$,
   $dbv40290$Is omitting WHERE from a SELECT statement dangerous the same way it is for UPDATE/DELETE?$dbv40290$,
   $dbv40291$["Yes, equally dangerous in all cases", "No \u2014 a WHERE-less SELECT just returns every row (harmless read), while a WHERE-less UPDATE/DELETE modifies/removes every row (potentially damaging write)", "SELECT requires WHERE by SQL syntax rules", "WHERE cannot be omitted from any statement"]$dbv40291$::jsonb,
   1, $dbv40292$The risk profile differs because SELECT only reads data, while UPDATE/DELETE change it.$dbv40292$, 1, 4),
  ($dbv40293$tq-dbms-sql-12-where-6$dbv40293$, $dbv40294$pt-dbms-sql-12-where$dbv40294$,
   $dbv40295$Which of these building-block techniques can appear inside a WHERE condition?$dbv40295$,
   $dbv40296$["Only simple equality comparisons", "Comparisons, logical operators, BETWEEN, IN, LIKE, and IS NULL, among others", "Only aggregate functions", "Only column names with no operators"]$dbv40296$::jsonb,
   1, $dbv40297$WHERE conditions can combine any of these filtering techniques, all covered in this chapter.$dbv40297$, 1, 5),
  ($dbv40298$tq-dbms-sql-12-where-7$dbv40298$, $dbv40299$pt-dbms-sql-12-where$dbv40299$,
   $dbv40300$Why is explicit parenthesization of compound WHERE conditions good practice, even when not strictly required?$dbv40300$,
   $dbv40301$["It has no real benefit", "It makes the intended evaluation order clear and avoids operator-precedence mistakes", "Parentheses are mandatory in every WHERE clause", "It makes the query run faster"]$dbv40301$::jsonb,
   1, $dbv40302$Clarity and avoiding precedence bugs are the practical benefits of explicit parentheses.$dbv40302$, 1, 6),
  ($dbv40303$tq-dbms-sql-12-where-8$dbv40303$, $dbv40304$pt-dbms-sql-12-where$dbv40304$,
   $dbv40305$At what stage of query processing does WHERE run relative to GROUP BY?$dbv40305$,
   $dbv40306$["After GROUP BY", "Before GROUP BY", "Simultaneously, with no defined order", "WHERE and GROUP BY cannot appear in the same query"]$dbv40306$::jsonb,
   1, $dbv40307$WHERE filters individual rows first; GROUP BY then operates on the already-filtered rows.$dbv40307$, 1, 7)
on conflict (id) do nothing;

-- 12.4 Comparison Operators
with g as (select id from public.learning_grids where lower(slug) = $dbv40308$dbms-sql-tutorial$dbv40308$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40309$chapter-12-select-and-filtering$dbv40309$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40310$Comparison Operators$dbv40310$, $dbv40311$comparison-operators$dbv40311$, '', 4, 'published', true, true, $dbv40312$dbms_sql_tutorial$dbv40312$, $dbv40313$chapter-12-select-and-filtering/comparison-operators$dbv40313$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40314$dbms_sql_tutorial$dbv40314$ and source_ref = $dbv40315$chapter-12-select-and-filtering/comparison-operators$dbv40315$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40316$Comparison Operators$dbv40316$, $dbv40317$### Definition

**Comparison operators** (`=`, `<>`/`!=`, `<`, `>`, `<=`, `>=`) compare two values and produce `TRUE`, `FALSE`, or `UNKNOWN` (if either side is `NULL`) — the basic building blocks of any `WHERE` condition.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name FROM products WHERE price >= 500;
SELECT name FROM products WHERE category <> 'Books';
```

`<>` is the standard SQL "not equal" operator; `!=` is a widely-supported but non-standard alternative spelling (most dialects accept both). Comparisons work on numbers, strings (compared according to the column's collation — usually alphabetical), and dates (chronologically).

### Edge Cases and Pitfalls

- `= NULL` and `<> NULL` NEVER evaluate to `TRUE`, for either value — comparing anything to `NULL` with an ordinary comparison operator always produces `UNKNOWN` (Chapter 8's NULL Semantics); only `IS NULL`/`IS NOT NULL` (12.10, 12.11) correctly test for NULL.
- Comparing values of different types (e.g. a number to a string) often triggers an implicit type conversion, which can produce a confusing or unexpected result — being explicit about types avoids relying on conversion rules that vary by dialect.
- String comparison honors the column's collation setting, which determines case-sensitivity and locale-specific ordering rules — `'apple' = 'Apple'` may be TRUE or FALSE depending entirely on the collation, not on the `=` operator itself.

### Key Takeaways

- The six comparison operators (=, <>/!=, <, >, <=, >=) are the atomic building blocks of WHERE conditions.
- Comparing to NULL with these operators always yields UNKNOWN, never TRUE — use IS NULL/IS NOT NULL instead.
- String comparison behavior (case sensitivity, ordering) depends on collation, not just the operator.$dbv40317$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40318$dbms_sql_tutorial_seed$dbv40318$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40319$dbms_sql_tutorial_seed$dbv40319$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40320$dbms-sql-tutorial$dbv40320$),
     t as (select id from public.learning_topics where source_kind = $dbv40321$dbms_sql_tutorial$dbv40321$ and source_ref = $dbv40322$chapter-12-select-and-filtering/comparison-operators$dbv40322$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40323$pt-dbms-sql-12-comparison-operators$dbv40323$, $dbv40324$Comparison Operators - Quick Test$dbv40324$, 'aptitude', 8, 8,
  $dbv40325$8 questions on Comparison Operators.$dbv40325$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40326$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40326$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40327$tq-dbms-sql-12-comparison-operators-1$dbv40327$, $dbv40328$pt-dbms-sql-12-comparison-operators$dbv40328$,
   $dbv40329$Which operator is the standard SQL 'not equal' comparison?$dbv40329$,
   $dbv40330$["!=", "<>", "><", "NOT="]$dbv40330$::jsonb,
   1, $dbv40331$<> is the standard SQL not-equal operator; != is a widely supported non-standard alternative.$dbv40331$, 1, 0),
  ($dbv40332$tq-dbms-sql-12-comparison-operators-2$dbv40332$, $dbv40333$pt-dbms-sql-12-comparison-operators$dbv40333$,
   $dbv40334$What does `price = NULL` evaluate to for a row where price actually is NULL?$dbv40334$,
   $dbv40335$["TRUE", "UNKNOWN \u2014 comparisons to NULL never evaluate to TRUE, even when the value genuinely is NULL", "FALSE", "An error is raised"]$dbv40335$::jsonb,
   1, $dbv40336$Ordinary comparison operators always produce UNKNOWN when compared to NULL, regardless of the actual value.$dbv40336$, 1, 1),
  ($dbv40337$tq-dbms-sql-12-comparison-operators-3$dbv40337$, $dbv40338$pt-dbms-sql-12-comparison-operators$dbv40338$,
   $dbv40339$How should you correctly test whether a column's value is NULL?$dbv40339$,
   $dbv40340$["WHERE column = NULL", "WHERE column IS NULL", "WHERE column <> NULL", "WHERE column == NULL"]$dbv40340$::jsonb,
   1, $dbv40341$IS NULL is the only comparison-operator-independent way to correctly test for NULL.$dbv40341$, 1, 2),
  ($dbv40342$tq-dbms-sql-12-comparison-operators-4$dbv40342$, $dbv40343$pt-dbms-sql-12-comparison-operators$dbv40343$,
   $dbv40344$What determines whether 'apple' = 'Apple' evaluates to TRUE or FALSE?$dbv40344$,
   $dbv40345$["The exact operator used (= vs ==)", "The column's collation setting, which governs case sensitivity and locale-specific comparison rules", "The length of the strings being compared", "This is always FALSE in every SQL dialect"]$dbv40345$::jsonb,
   1, $dbv40346$Collation, not the comparison operator itself, determines case-sensitivity behavior for string comparisons.$dbv40346$, 1, 3),
  ($dbv40347$tq-dbms-sql-12-comparison-operators-5$dbv40347$, $dbv40348$pt-dbms-sql-12-comparison-operators$dbv40348$,
   $dbv40349$What risk does comparing values of different data types (e.g. a number to a string) introduce?$dbv40349$,
   $dbv40350$["No risk \u2014 SQL always handles this identically everywhere", "An implicit type conversion may occur, which can produce confusing or dialect-dependent results", "This always causes an immediate syntax error", "Different types can never be compared under any circumstances"]$dbv40350$::jsonb,
   1, $dbv40351$Implicit conversions are a real, dialect-variable source of subtle bugs.$dbv40351$, 1, 4),
  ($dbv40352$tq-dbms-sql-12-comparison-operators-6$dbv40352$, $dbv40353$pt-dbms-sql-12-comparison-operators$dbv40353$,
   $dbv40354$Do comparison operators work on date values?$dbv40354$,
   $dbv40355$["No, dates cannot be compared", "Yes \u2014 dates compare chronologically using the same operators (<, >, =, etc.)", "Only using a special DATE_COMPARE function", "Only the = operator works with dates"]$dbv40355$::jsonb,
   1, $dbv40356$Standard comparison operators apply to dates just as they do to numbers, comparing chronological order.$dbv40356$, 1, 5),
  ($dbv40357$tq-dbms-sql-12-comparison-operators-7$dbv40357$, $dbv40358$pt-dbms-sql-12-comparison-operators$dbv40358$,
   $dbv40359$Which comparison operators exist in standard SQL for ordering (not just equality)?$dbv40359$,
   $dbv40360$["Only = and <>", "<, >, <=, >= in addition to = and <>", "Only < and >", "SQL has no ordering comparison operators"]$dbv40360$::jsonb,
   1, $dbv40361$The full set of six operators covers equality, inequality, and ordering.$dbv40361$, 1, 6),
  ($dbv40362$tq-dbms-sql-12-comparison-operators-8$dbv40362$, $dbv40363$pt-dbms-sql-12-comparison-operators$dbv40363$,
   $dbv40364$Is `!=` part of the official SQL standard?$dbv40364$,
   $dbv40365$["Yes, it is the standard operator", "No \u2014 <> is the standard spelling; != is a widely-supported but non-standard alternative accepted by most dialects", "Neither != nor <> is valid SQL", "!= only works in NoSQL databases"]$dbv40365$::jsonb,
   1, $dbv40366$<> is the ISO SQL standard spelling for not-equal; != is a common but technically non-standard addition.$dbv40366$, 1, 7)
on conflict (id) do nothing;

-- 12.5 Logical Operators
with g as (select id from public.learning_grids where lower(slug) = $dbv40367$dbms-sql-tutorial$dbv40367$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40368$chapter-12-select-and-filtering$dbv40368$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40369$Logical Operators$dbv40369$, $dbv40370$logical-operators$dbv40370$, '', 5, 'published', true, true, $dbv40371$dbms_sql_tutorial$dbv40371$, $dbv40372$chapter-12-select-and-filtering/logical-operators$dbv40372$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40373$dbms_sql_tutorial$dbv40373$ and source_ref = $dbv40374$chapter-12-select-and-filtering/logical-operators$dbv40374$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40375$Logical Operators$dbv40375$, $dbv40376$### Definition

**Logical operators** (`AND`, `OR`, `NOT`) combine multiple conditions into a single compound `WHERE` condition, following three-valued logic (`TRUE`/`FALSE`/`UNKNOWN`) rather than ordinary two-valued boolean logic.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name FROM products WHERE category = 'Electronics' AND price > 50000;
SELECT name FROM products WHERE category = 'Books' OR category = 'Stationery';
SELECT name FROM products WHERE NOT category = 'Electronics';
```

`AND` requires both sides `TRUE`; `OR` requires at least one side `TRUE`; `NOT` inverts a condition. Because NULL comparisons can produce `UNKNOWN`, combining logical operators with NULL-involving conditions needs care: `TRUE AND UNKNOWN` is `UNKNOWN` (not `TRUE`), while `TRUE OR UNKNOWN` is `TRUE` (the known `TRUE` side is enough regardless of the other).

### Edge Cases and Pitfalls

- `AND` binds tighter than `OR` in operator precedence (12.15) — `WHERE a OR b AND c` means `WHERE a OR (b AND c)`, NOT `WHERE (a OR b) AND c`; this is a very common source of subtly wrong filter logic when parentheses are omitted.
- `NOT (condition involving NULL)` doesn't simply "flip" `UNKNOWN` to a definite value — `NOT UNKNOWN` is still `UNKNOWN`, not `TRUE`, which surprises people expecting NOT to always produce a definite opposite.
- Chaining many `OR`ed equality checks against the same column (`category = 'Books' OR category = 'Stationery' OR category = 'Home'`) is exactly what `IN` (12.7) exists to express more concisely.

### Key Takeaways

- AND/OR/NOT combine conditions, but follow three-valued logic — UNKNOWN doesn't behave like a normal boolean value under NOT.
- AND binds tighter than OR — always parenthesize mixed AND/OR conditions to avoid precedence surprises.
- Many chained OR-equality checks against one column are better expressed with IN.$dbv40376$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40377$dbms_sql_tutorial_seed$dbv40377$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40378$dbms_sql_tutorial_seed$dbv40378$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40379$dbms-sql-tutorial$dbv40379$),
     t as (select id from public.learning_topics where source_kind = $dbv40380$dbms_sql_tutorial$dbv40380$ and source_ref = $dbv40381$chapter-12-select-and-filtering/logical-operators$dbv40381$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40382$pt-dbms-sql-12-logical-operators$dbv40382$, $dbv40383$Logical Operators - Quick Test$dbv40383$, 'aptitude', 8, 8,
  $dbv40384$8 questions on Logical Operators.$dbv40384$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40385$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40385$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40386$tq-dbms-sql-12-logical-operators-1$dbv40386$, $dbv40387$pt-dbms-sql-12-logical-operators$dbv40387$,
   $dbv40388$What do AND, OR, and NOT do in a WHERE clause?$dbv40388$,
   $dbv40389$["They sort the result", "They combine multiple conditions into a single compound condition", "They rename columns", "They limit the number of returned rows"]$dbv40389$::jsonb,
   1, $dbv40390$These are SQL's logical operators for building compound conditions.$dbv40390$, 1, 0),
  ($dbv40391$tq-dbms-sql-12-logical-operators-2$dbv40391$, $dbv40392$pt-dbms-sql-12-logical-operators$dbv40392$,
   $dbv40393$In `WHERE a OR b AND c` with no parentheses, how is this actually evaluated?$dbv40393$,
   $dbv40394$["As (a OR b) AND c", "As a OR (b AND c), since AND binds tighter than OR", "Left to right with no precedence rules", "This is always a syntax error"]$dbv40394$::jsonb,
   1, $dbv40395$AND has higher precedence than OR, so it binds first — a common source of unintended filter logic.$dbv40395$, 1, 1),
  ($dbv40396$tq-dbms-sql-12-logical-operators-3$dbv40396$, $dbv40397$pt-dbms-sql-12-logical-operators$dbv40397$,
   $dbv40398$What does TRUE AND UNKNOWN evaluate to?$dbv40398$,
   $dbv40399$["TRUE", "UNKNOWN", "FALSE", "This combination is undefined in SQL"]$dbv40399$::jsonb,
   1, $dbv40400$AND requires both sides to be definitely TRUE; an UNKNOWN side keeps the result UNKNOWN.$dbv40400$, 1, 2),
  ($dbv40401$tq-dbms-sql-12-logical-operators-4$dbv40401$, $dbv40402$pt-dbms-sql-12-logical-operators$dbv40402$,
   $dbv40403$What does TRUE OR UNKNOWN evaluate to?$dbv40403$,
   $dbv40404$["UNKNOWN", "TRUE \u2014 a known TRUE side is enough regardless of the other side", "FALSE", "This combination causes an error"]$dbv40404$::jsonb,
   1, $dbv40405$OR only needs one side to be TRUE, so a TRUE side guarantees a TRUE result even if the other side is UNKNOWN.$dbv40405$, 1, 3),
  ($dbv40406$tq-dbms-sql-12-logical-operators-5$dbv40406$, $dbv40407$pt-dbms-sql-12-logical-operators$dbv40407$,
   $dbv40408$What does NOT UNKNOWN evaluate to?$dbv40408$,
   $dbv40409$["TRUE", "Still UNKNOWN \u2014 NOT does not convert UNKNOWN into a definite value", "FALSE", "It depends on the specific SQL dialect"]$dbv40409$::jsonb,
   1, $dbv40410$This is a genuinely counter-intuitive but important three-valued-logic fact: NOT UNKNOWN remains UNKNOWN.$dbv40410$, 1, 4),
  ($dbv40411$tq-dbms-sql-12-logical-operators-6$dbv40411$, $dbv40412$pt-dbms-sql-12-logical-operators$dbv40412$,
   $dbv40413$What is a more concise way to write `category = 'Books' OR category = 'Stationery' OR category = 'Home'`?$dbv40413$,
   $dbv40414$["category BETWEEN 'Books' AND 'Home'", "category IN ('Books', 'Stationery', 'Home')", "category LIKE 'Books|Stationery|Home'", "There is no more concise equivalent"]$dbv40414$::jsonb,
   1, $dbv40415$IN is designed exactly for this repeated-OR-equality pattern against one column.$dbv40415$, 1, 5),
  ($dbv40416$tq-dbms-sql-12-logical-operators-7$dbv40416$, $dbv40417$pt-dbms-sql-12-logical-operators$dbv40417$,
   $dbv40418$Why should mixed AND/OR conditions generally be parenthesized explicitly?$dbv40418$,
   $dbv40419$["Parentheses are required by SQL syntax in every case", "To make the intended evaluation order unambiguous and avoid precedence-related bugs", "Parenthesized conditions run faster", "Parentheses convert three-valued logic into two-valued logic"]$dbv40419$::jsonb,
   1, $dbv40420$Explicit parentheses remove any ambiguity about which operator binds first, preventing subtle logic bugs.$dbv40420$, 1, 6),
  ($dbv40421$tq-dbms-sql-12-logical-operators-8$dbv40421$, $dbv40422$pt-dbms-sql-12-logical-operators$dbv40422$,
   $dbv40423$Does NOT simply invert TRUE to FALSE and FALSE to TRUE, with no other cases to consider?$dbv40423$,
   $dbv40424$["Yes, that's the complete behavior", "No \u2014 NOT UNKNOWN remains UNKNOWN, a third case beyond the simple TRUE/FALSE inversion", "NOT can only be applied to TRUE, never FALSE", "NOT is not supported in standard SQL"]$dbv40424$::jsonb,
   1, $dbv40425$Three-valued logic means NOT has three possible outcomes to consider, not just two.$dbv40425$, 1, 7)
on conflict (id) do nothing;

-- 12.6 BETWEEN
with g as (select id from public.learning_grids where lower(slug) = $dbv40426$dbms-sql-tutorial$dbv40426$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40427$chapter-12-select-and-filtering$dbv40427$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40428$BETWEEN$dbv40428$, $dbv40429$between$dbv40429$, '', 6, 'published', true, true, $dbv40430$dbms_sql_tutorial$dbv40430$, $dbv40431$chapter-12-select-and-filtering/between$dbv40431$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40432$dbms_sql_tutorial$dbv40432$ and source_ref = $dbv40433$chapter-12-select-and-filtering/between$dbv40433$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40434$BETWEEN$dbv40434$, $dbv40435$### Definition

`BETWEEN low AND high` tests whether a value falls within a range, **inclusive of both endpoints** — shorthand for `value >= low AND value <= high`.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name, price FROM products WHERE price BETWEEN 200 AND 1000;
-- exactly equivalent to:
SELECT name, price FROM products WHERE price >= 200 AND price <= 1000;
```

A product priced at EXACTLY 200 or EXACTLY 1000 is included — `BETWEEN` is inclusive on both ends, a detail worth remembering precisely since "between" in everyday English is sometimes read as exclusive.

### Edge Cases and Pitfalls

- `BETWEEN` also works on dates and strings, not just numbers: `order_date BETWEEN '2026-01-01' AND '2026-01-31'` is a common way to filter to a calendar month — though be careful with `TIMESTAMP`/`DATETIME` columns that include a time component, since `'2026-01-31'` implicitly means midnight at the start of that day, potentially excluding timestamps later on the 31st.
- If `low` is greater than `high` (a reversed range), `BETWEEN` doesn't error — it simply matches nothing, since no value can simultaneously be `>= low` and `<= high` under those conditions.
- `NOT BETWEEN` inverts the test (`value < low OR value > high`) — also inclusive-boundary-aware, so a value exactly at `low` or `high` is excluded by `NOT BETWEEN`.

### Key Takeaways

- BETWEEN low AND high is shorthand for >= low AND <= high — inclusive of both endpoints.
- It works on numbers, dates, and strings alike.
- A reversed range (low > high) silently matches zero rows rather than erroring.$dbv40435$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40436$dbms_sql_tutorial_seed$dbv40436$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40437$dbms_sql_tutorial_seed$dbv40437$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40438$dbms-sql-tutorial$dbv40438$),
     t as (select id from public.learning_topics where source_kind = $dbv40439$dbms_sql_tutorial$dbv40439$ and source_ref = $dbv40440$chapter-12-select-and-filtering/between$dbv40440$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40441$pt-dbms-sql-12-between$dbv40441$, $dbv40442$BETWEEN - Quick Test$dbv40442$, 'aptitude', 8, 8,
  $dbv40443$8 questions on BETWEEN.$dbv40443$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40444$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40444$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40445$tq-dbms-sql-12-between-1$dbv40445$, $dbv40446$pt-dbms-sql-12-between$dbv40446$,
   $dbv40447$Is BETWEEN inclusive or exclusive of its endpoints?$dbv40447$,
   $dbv40448$["Exclusive of both endpoints", "Inclusive of both endpoints", "Inclusive of the lower bound only", "Inclusive of the upper bound only"]$dbv40448$::jsonb,
   1, $dbv40449$BETWEEN low AND high includes both low and high themselves.$dbv40449$, 1, 0),
  ($dbv40450$tq-dbms-sql-12-between-2$dbv40450$, $dbv40451$pt-dbms-sql-12-between$dbv40451$,
   $dbv40452$Which expression is exactly equivalent to `price BETWEEN 200 AND 1000`?$dbv40452$,
   $dbv40453$["price > 200 AND price < 1000", "price >= 200 AND price <= 1000", "price >= 200 OR price <= 1000", "price = 200 OR price = 1000"]$dbv40453$::jsonb,
   1, $dbv40454$BETWEEN is shorthand for the inclusive >= and <= combination.$dbv40454$, 1, 1),
  ($dbv40455$tq-dbms-sql-12-between-3$dbv40455$, $dbv40456$pt-dbms-sql-12-between$dbv40456$,
   $dbv40457$Can BETWEEN be used with date or string values, not just numbers?$dbv40457$,
   $dbv40458$["No, only numeric types are supported", "Yes \u2014 BETWEEN works on any comparable type, including dates and strings", "Only with the DATE type specifically", "BETWEEN requires exactly two numeric arguments"]$dbv40458$::jsonb,
   1, $dbv40459$BETWEEN applies to any type that supports ordering comparisons.$dbv40459$, 1, 2),
  ($dbv40460$tq-dbms-sql-12-between-4$dbv40460$, $dbv40461$pt-dbms-sql-12-between$dbv40461$,
   $dbv40462$What happens if the low value in BETWEEN is greater than the high value?$dbv40462$,
   $dbv40463$["An error is raised", "It silently matches zero rows, since no value can satisfy both conditions", "It automatically swaps the two values", "It matches every row instead"]$dbv40463$::jsonb,
   1, $dbv40464$A reversed range simply can never be satisfied, so the result is empty rather than an error.$dbv40464$, 1, 3),
  ($dbv40465$tq-dbms-sql-12-between-5$dbv40465$, $dbv40466$pt-dbms-sql-12-between$dbv40466$,
   $dbv40467$What is a subtle risk of using `order_date BETWEEN '2026-01-01' AND '2026-01-31'` on a TIMESTAMP column?$dbv40467$,
   $dbv40468$["No risk \u2014 this always captures the entire month correctly", "'2026-01-31' implies midnight at the start of that day, so timestamps later on the 31st could be excluded", "BETWEEN cannot be used with TIMESTAMP columns at all", "This syntax causes a guaranteed error"]$dbv40468$::jsonb,
   1, $dbv40469$The implicit midnight boundary on the upper date can silently exclude part of the intended day.$dbv40469$, 1, 4),
  ($dbv40470$tq-dbms-sql-12-between-6$dbv40470$, $dbv40471$pt-dbms-sql-12-between$dbv40471$,
   $dbv40472$What does NOT BETWEEN 200 AND 1000 match?$dbv40472$,
   $dbv40473$["Values strictly less than 200 or strictly greater than 1000 (200 and 1000 themselves are excluded from the match)", "Values exactly equal to 200 or 1000", "Every value with no exceptions", "Only values between 200 and 1000"]$dbv40473$::jsonb,
   0, $dbv40474$NOT BETWEEN inverts the inclusive range, excluding the boundary values themselves from the negated match.$dbv40474$, 1, 5),
  ($dbv40475$tq-dbms-sql-12-between-7$dbv40475$, $dbv40476$pt-dbms-sql-12-between$dbv40476$,
   $dbv40477$Is `age BETWEEN 18 AND 18` a valid, meaningful condition?$dbv40477$,
   $dbv40478$["No, this is invalid syntax", "Yes \u2014 it is equivalent to age = 18, just an unusual way to write it", "It always matches zero rows", "BETWEEN requires the two bounds to differ"]$dbv40478$::jsonb,
   1, $dbv40479$Using the same value for both bounds is valid and equivalent to an equality check.$dbv40479$, 1, 6),
  ($dbv40480$tq-dbms-sql-12-between-8$dbv40480$, $dbv40481$pt-dbms-sql-12-between$dbv40481$,
   $dbv40482$How is 'between' in everyday English different from SQL's BETWEEN, that's worth being careful about?$dbv40482$,
   $dbv40483$["There is no difference at all", "Everyday English sometimes implies an exclusive range, while SQL's BETWEEN is always inclusive of both endpoints", "SQL's BETWEEN is exclusive, unlike everyday English", "Everyday English BETWEEN only applies to numbers"]$dbv40483$::jsonb,
   1, $dbv40484$This mismatch in intuition is exactly why BETWEEN's inclusive-both-ends behavior is worth stating explicitly.$dbv40484$, 1, 7)
on conflict (id) do nothing;

-- 12.7 IN
with g as (select id from public.learning_grids where lower(slug) = $dbv40485$dbms-sql-tutorial$dbv40485$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40486$chapter-12-select-and-filtering$dbv40486$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40487$IN$dbv40487$, $dbv40488$in$dbv40488$, '', 7, 'published', true, true, $dbv40489$dbms_sql_tutorial$dbv40489$, $dbv40490$chapter-12-select-and-filtering/in$dbv40490$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40491$dbms_sql_tutorial$dbv40491$ and source_ref = $dbv40492$chapter-12-select-and-filtering/in$dbv40492$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40493$IN$dbv40493$, $dbv40494$### Definition

`IN (value1, value2, ...)` tests whether a value matches ANY item in a given list — shorthand for a chain of `OR`-ed equality checks against the same column.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name, category FROM products WHERE category IN ('Electronics', 'Books');
-- exactly equivalent to:
SELECT name, category FROM products WHERE category = 'Electronics' OR category = 'Books';
```

`IN` can also take a SUBQUERY instead of a literal list: `WHERE category IN (SELECT category FROM featured_categories)` — this is one of the main bridges between simple filtering and subqueries (Chapter 17).

### Edge Cases and Pitfalls

- If the list (or subquery) passed to `IN` contains a `NULL`, and the tested value doesn't match any of the non-NULL items, the WHOLE `IN` expression evaluates to `UNKNOWN` rather than a clean `FALSE` — this matters most for `NOT IN` (see the classic gotcha covered in Chapter 7's Division topic), where a single `NULL` in the list can cause the entire `NOT IN` to unexpectedly match nothing.
- `IN` with a long literal list is fine for a handful of values; for genuinely large lookup sets, a `JOIN` against a real table (or a subquery) is usually more maintainable and can be more efficient.
- `column IN (single_value)` works but is unnecessarily indirect — a plain `column = single_value` says the same thing more directly.

### Key Takeaways

- IN (list) is shorthand for chained OR-equality checks against one column; it also accepts a subquery instead of a literal list.
- A NULL inside the IN list can make the whole IN (and especially NOT IN) behave unexpectedly — treat this as a genuine gotcha to watch for.
- For a single value, plain equality is more direct than IN.$dbv40494$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40495$dbms_sql_tutorial_seed$dbv40495$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40496$dbms_sql_tutorial_seed$dbv40496$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40497$dbms-sql-tutorial$dbv40497$),
     t as (select id from public.learning_topics where source_kind = $dbv40498$dbms_sql_tutorial$dbv40498$ and source_ref = $dbv40499$chapter-12-select-and-filtering/in$dbv40499$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40500$pt-dbms-sql-12-in$dbv40500$, $dbv40501$IN - Quick Test$dbv40501$, 'aptitude', 8, 8,
  $dbv40502$8 questions on IN.$dbv40502$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40503$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40503$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40504$tq-dbms-sql-12-in-1$dbv40504$, $dbv40505$pt-dbms-sql-12-in$dbv40505$,
   $dbv40506$What does IN test for?$dbv40506$,
   $dbv40507$["Whether a value falls within a numeric range", "Whether a value matches ANY item in a given list (or subquery)", "Whether a string contains a substring", "Whether a column is NULL"]$dbv40507$::jsonb,
   1, $dbv40508$IN checks membership in a set of values.$dbv40508$, 1, 0),
  ($dbv40509$tq-dbms-sql-12-in-2$dbv40509$, $dbv40510$pt-dbms-sql-12-in$dbv40510$,
   $dbv40511$Which is equivalent to `category IN ('Electronics', 'Books')`?$dbv40511$,
   $dbv40512$["category = 'Electronics' AND category = 'Books'", "category = 'Electronics' OR category = 'Books'", "category BETWEEN 'Electronics' AND 'Books'", "category LIKE 'Electronics,Books'"]$dbv40512$::jsonb,
   1, $dbv40513$IN is shorthand for chained OR-equality checks against the same column.$dbv40513$, 1, 1),
  ($dbv40514$tq-dbms-sql-12-in-3$dbv40514$, $dbv40515$pt-dbms-sql-12-in$dbv40515$,
   $dbv40516$Can IN take a subquery instead of a literal list?$dbv40516$,
   $dbv40517$["No, only literal values are allowed", "Yes \u2014 WHERE category IN (SELECT ...) is a common and valid pattern bridging to subqueries", "Only SELECT DISTINCT subqueries are allowed inside IN", "Subqueries inside IN require a special SQL extension"]$dbv40517$::jsonb,
   1, $dbv40518$IN accepting a subquery is one of the fundamental ways subqueries integrate into filtering.$dbv40518$, 1, 2),
  ($dbv40519$tq-dbms-sql-12-in-4$dbv40519$, $dbv40520$pt-dbms-sql-12-in$dbv40520$,
   $dbv40521$What happens if a NULL is present in an IN list and the tested value doesn't match any non-NULL item?$dbv40521$,
   $dbv40522$["The IN expression evaluates to a clean FALSE", "The IN expression evaluates to UNKNOWN rather than FALSE, due to the NULL's presence", "The NULL is silently ignored with no effect", "This causes a SQL syntax error"]$dbv40522$::jsonb,
   1, $dbv40523$A NULL anywhere in the list can turn a would-be FALSE result into UNKNOWN — a classic gotcha, especially significant for NOT IN.$dbv40523$, 1, 3),
  ($dbv40524$tq-dbms-sql-12-in-5$dbv40524$, $dbv40525$pt-dbms-sql-12-in$dbv40525$,
   $dbv40526$Why is `column IN (single_value)` considered unnecessarily indirect?$dbv40526$,
   $dbv40527$["It is actually invalid syntax", "A plain column = single_value expresses the exact same condition more directly", "IN cannot accept a single value, only two or more", "This form is always slower to execute"]$dbv40527$::jsonb,
   1, $dbv40528$For exactly one value, ordinary equality is the more direct and idiomatic choice.$dbv40528$, 1, 4),
  ($dbv40529$tq-dbms-sql-12-in-6$dbv40529$, $dbv40530$pt-dbms-sql-12-in$dbv40530$,
   $dbv40531$For a genuinely large lookup set, what alternative to a long literal IN list is often more maintainable?$dbv40531$,
   $dbv40532$["There is no alternative; IN must always be used", "A JOIN against a real table (or a subquery) holding those values", "Repeating the query once per value", "Switching to a NoSQL database"]$dbv40532$::jsonb,
   1, $dbv40533$A real table plus JOIN scales better and is easier to maintain than a very long hardcoded list.$dbv40533$, 1, 5),
  ($dbv40534$tq-dbms-sql-12-in-7$dbv40534$, $dbv40535$pt-dbms-sql-12-in$dbv40535$,
   $dbv40536$Why is the NULL-in-IN-list gotcha especially dangerous for NOT IN specifically?$dbv40536$,
   $dbv40537$["It isn't more dangerous for NOT IN than for IN", "A single NULL in the subquery/list can make the entire NOT IN condition evaluate to UNKNOWN for every row, silently returning zero results", "NOT IN automatically ignores any NULLs in the list", "NOT IN cannot be used with subqueries at all"]$dbv40537$::jsonb,
   1, $dbv40538$This exact scenario was highlighted as a real-world footgun back in Chapter 7's NULL Semantics discussion of NOT IN.$dbv40538$, 1, 6),
  ($dbv40539$tq-dbms-sql-12-in-8$dbv40539$, $dbv40540$pt-dbms-sql-12-in$dbv40540$,
   $dbv40541$Is IN limited to string values, or can it be used with numbers too?$dbv40541$,
   $dbv40542$["Only strings are supported", "IN works with any comparable data type, including numbers and dates", "Only numbers are supported", "IN requires mixed types in the same list"]$dbv40542$::jsonb,
   1, $dbv40543$IN is type-agnostic — it works with whatever type the compared column holds.$dbv40543$, 1, 7)
on conflict (id) do nothing;

-- 12.8 LIKE
with g as (select id from public.learning_grids where lower(slug) = $dbv40544$dbms-sql-tutorial$dbv40544$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40545$chapter-12-select-and-filtering$dbv40545$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40546$LIKE$dbv40546$, $dbv40547$like$dbv40547$, '', 8, 'published', true, true, $dbv40548$dbms_sql_tutorial$dbv40548$, $dbv40549$chapter-12-select-and-filtering/like$dbv40549$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40550$dbms_sql_tutorial$dbv40550$ and source_ref = $dbv40551$chapter-12-select-and-filtering/like$dbv40551$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40552$LIKE$dbv40552$, $dbv40553$### Definition

`LIKE` tests whether a string matches a simple pattern using two wildcards: `%` (any sequence of zero or more characters) and `_` (exactly one character).

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name FROM products WHERE name LIKE 'Pro%';   -- starts with 'Pro'
SELECT name FROM products WHERE name LIKE '%book%'; -- contains 'book' anywhere
SELECT name FROM products WHERE name LIKE '_ovel';  -- exactly 5 chars, ending in 'ovel'
```

`'Pro%'` matches 'ProLaptop' and 'ProPhone' (anything STARTING with 'Pro'); `'%book%'` matches 'Notebook' (containing 'book' anywhere); `'_ovel'` matches 'Novel' (exactly one character, then 'ovel').

### Edge Cases and Pitfalls

- `LIKE`'s case-sensitivity depends on the column's collation, exactly like ordinary comparison (12.4) — `'pro%'` may or may not match 'ProLaptop' depending on that setting, not on `LIKE` itself.
- A leading `%` (`'%book%'`) generally CANNOT use a normal index efficiently, since the database can't know where in the string to start looking — a trailing-only wildcard (`'book%'`) can typically still use an index. This is a real, common performance consideration for large tables.
- To match a LITERAL `%` or `_` character (not as a wildcard), most dialects support an `ESCAPE` clause: `LIKE '50\%%' ESCAPE '\'` to find strings starting with the literal text "50%".

### Key Takeaways

- `%` matches any sequence of characters (including zero); `_` matches exactly one character.
- Case-sensitivity follows the column's collation, not LIKE itself.
- A leading `%` defeats normal index usage — a real performance consideration on large tables.$dbv40553$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40554$dbms_sql_tutorial_seed$dbv40554$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40555$dbms_sql_tutorial_seed$dbv40555$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40556$dbms-sql-tutorial$dbv40556$),
     t as (select id from public.learning_topics where source_kind = $dbv40557$dbms_sql_tutorial$dbv40557$ and source_ref = $dbv40558$chapter-12-select-and-filtering/like$dbv40558$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40559$pt-dbms-sql-12-like$dbv40559$, $dbv40560$LIKE - Quick Test$dbv40560$, 'aptitude', 8, 8,
  $dbv40561$8 questions on LIKE.$dbv40561$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40562$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40562$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40563$tq-dbms-sql-12-like-1$dbv40563$, $dbv40564$pt-dbms-sql-12-like$dbv40564$,
   $dbv40565$What does the % wildcard match in a LIKE pattern?$dbv40565$,
   $dbv40566$["Exactly one character", "Any sequence of zero or more characters", "A literal percent sign only", "Exactly zero characters"]$dbv40566$::jsonb,
   1, $dbv40567$% matches any run of characters, including none at all.$dbv40567$, 1, 0),
  ($dbv40568$tq-dbms-sql-12-like-2$dbv40568$, $dbv40569$pt-dbms-sql-12-like$dbv40569$,
   $dbv40570$What does the _ wildcard match in a LIKE pattern?$dbv40570$,
   $dbv40571$["Any sequence of characters", "Exactly one character", "A literal underscore only", "Zero or one character"]$dbv40571$::jsonb,
   1, $dbv40572$_ matches precisely one character, no more and no fewer.$dbv40572$, 1, 1),
  ($dbv40573$tq-dbms-sql-12-like-3$dbv40573$, $dbv40574$pt-dbms-sql-12-like$dbv40574$,
   $dbv40575$Which pattern matches strings that START with 'Pro'?$dbv40575$,
   $dbv40576$["'%Pro'", "'Pro%'", "'_Pro_'", "'%Pro%'"]$dbv40576$::jsonb,
   1, $dbv40577$A trailing % after the fixed prefix matches anything starting with 'Pro'.$dbv40577$, 1, 2),
  ($dbv40578$tq-dbms-sql-12-like-4$dbv40578$, $dbv40579$pt-dbms-sql-12-like$dbv40579$,
   $dbv40580$Why can a leading % in a LIKE pattern (e.g. '%book%') hurt performance on large tables?$dbv40580$,
   $dbv40581$["It never affects performance", "The database can't know where in the string to start looking, generally preventing efficient use of a normal index", "Leading % is not valid syntax", "It always causes a syntax error on large tables specifically"]$dbv40581$::jsonb,
   1, $dbv40582$Without a fixed starting point, an index that's sorted by the column's value can't narrow the search efficiently.$dbv40582$, 1, 3),
  ($dbv40583$tq-dbms-sql-12-like-5$dbv40583$, $dbv40584$pt-dbms-sql-12-like$dbv40584$,
   $dbv40585$How can you match a literal '%' character rather than using it as a wildcard?$dbv40585$,
   $dbv40586$["This is impossible with LIKE", "Using an ESCAPE clause, e.g. LIKE '50\\%%' ESCAPE '\\'", "By using two percent signs together", "By switching to the = operator instead"]$dbv40586$::jsonb,
   1, $dbv40587$Most dialects support an ESCAPE clause to treat a wildcard character as a literal.$dbv40587$, 1, 4),
  ($dbv40588$tq-dbms-sql-12-like-6$dbv40588$, $dbv40589$pt-dbms-sql-12-like$dbv40589$,
   $dbv40590$Does LIKE's case sensitivity come from LIKE itself or from something else?$dbv40590$,
   $dbv40591$["LIKE is always case-sensitive by definition", "It depends on the column's collation setting, the same as ordinary comparison operators", "LIKE is always case-insensitive by definition", "Case sensitivity is randomly determined per query"]$dbv40591$::jsonb,
   1, $dbv40592$Collation governs case-sensitivity for LIKE just as it does for =, not a property of LIKE itself.$dbv40592$, 1, 5),
  ($dbv40593$tq-dbms-sql-12-like-7$dbv40593$, $dbv40594$pt-dbms-sql-12-like$dbv40594$,
   $dbv40595$What does '_ovel' match?$dbv40595$,
   $dbv40596$["Any string ending in 'ovel'", "A string of exactly 5 characters, with any first character followed by 'ovel'", "Only the exact string 'ovel'", "Any string starting with 'ovel'"]$dbv40596$::jsonb,
   1, $dbv40597$_ requires exactly one character in that position, followed by the literal 'ovel'.$dbv40597$, 1, 6),
  ($dbv40598$tq-dbms-sql-12-like-8$dbv40598$, $dbv40599$pt-dbms-sql-12-like$dbv40599$,
   $dbv40600$Does a trailing-only wildcard pattern like 'book%' have the same indexing limitation as a leading wildcard?$dbv40600$,
   $dbv40601$["Yes, identically limited", "No \u2014 a trailing-only wildcard can typically still use a normal index efficiently, unlike a leading wildcard", "Trailing wildcards are not supported by LIKE", "Both patterns always require a full table scan"]$dbv40601$::jsonb,
   1, $dbv40602$Because the fixed prefix gives the index a starting point, trailing-wildcard patterns are generally index-friendly.$dbv40602$, 1, 7)
on conflict (id) do nothing;

-- 12.9 Pattern Matching
with g as (select id from public.learning_grids where lower(slug) = $dbv40603$dbms-sql-tutorial$dbv40603$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40604$chapter-12-select-and-filtering$dbv40604$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40605$Pattern Matching$dbv40605$, $dbv40606$pattern-matching$dbv40606$, '', 9, 'published', true, true, $dbv40607$dbms_sql_tutorial$dbv40607$, $dbv40608$chapter-12-select-and-filtering/pattern-matching$dbv40608$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40609$dbms_sql_tutorial$dbv40609$ and source_ref = $dbv40610$chapter-12-select-and-filtering/pattern-matching$dbv40610$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40611$Pattern Matching$dbv40611$, $dbv40612$### Definition

Beyond `LIKE`'s simple `%`/`_` wildcards, most SQL dialects also support **regular expressions** for genuinely complex pattern matching — a much more expressive (and more complex) matching language.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
-- MySQL / MariaDB
SELECT name FROM products WHERE name REGEXP '^Pro[A-Z]';

-- PostgreSQL
SELECT name FROM products WHERE name ~ '^Pro[A-Z]';
```

Regular expressions can express patterns `LIKE` fundamentally cannot: "starts with 'Pro' followed by an uppercase letter," "contains exactly one digit," "matches one of several alternative word forms" — anything requiring real pattern logic beyond simple substring/wildcard matching.

### Edge Cases and Pitfalls

- Regular expression SYNTAX and the function/operator NAME to invoke it (`REGEXP`, `RLIKE`, `~`, `SIMILAR TO`) both vary significantly by dialect — this is one of the least portable areas of SQL, more so even than most other dialect differences covered in this course.
- Regular expression matching is typically much more computationally expensive than a simple `LIKE` pattern, especially a complex regex run over a large table with no supporting index — reach for `LIKE` first when a simple wildcard genuinely suffices.
- Because regex patterns use characters like `.`, `*`, `[`, `]`, `^`, `$` with special meaning, matching those characters LITERALLY requires escaping them — a common source of "why doesn't my pattern match" confusion for anyone used to LIKE's much simpler two-wildcard system.

### Key Takeaways

- Full regular expressions (via REGEXP/RLIKE/~ depending on dialect) handle pattern-matching needs beyond what LIKE's simple wildcards can express.
- Regex syntax and invocation keywords are notably dialect-fragmented — expect real portability friction.
- Prefer simple LIKE patterns when they suffice; reach for regex only when genuinely needed, given the performance and complexity cost.$dbv40612$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40613$dbms_sql_tutorial_seed$dbv40613$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40614$dbms_sql_tutorial_seed$dbv40614$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40615$dbms-sql-tutorial$dbv40615$),
     t as (select id from public.learning_topics where source_kind = $dbv40616$dbms_sql_tutorial$dbv40616$ and source_ref = $dbv40617$chapter-12-select-and-filtering/pattern-matching$dbv40617$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40618$pt-dbms-sql-12-pattern-matching$dbv40618$, $dbv40619$Pattern Matching - Quick Test$dbv40619$, 'aptitude', 8, 8,
  $dbv40620$8 questions on Pattern Matching.$dbv40620$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40621$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40621$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40622$tq-dbms-sql-12-pattern-matching-1$dbv40622$, $dbv40623$pt-dbms-sql-12-pattern-matching$dbv40623$,
   $dbv40624$What can regular expressions express that LIKE's simple wildcards cannot?$dbv40624$,
   $dbv40625$["Nothing \u2014 they are equivalent in power", "More complex pattern logic, like character classes, alternatives, and precise repetition rules", "Only exact string matches", "Only numeric comparisons"]$dbv40625$::jsonb,
   1, $dbv40626$Regex is a strictly more expressive pattern language than LIKE's two wildcards.$dbv40626$, 1, 0),
  ($dbv40627$tq-dbms-sql-12-pattern-matching-2$dbv40627$, $dbv40628$pt-dbms-sql-12-pattern-matching$dbv40628$,
   $dbv40629$Which operator/function does PostgreSQL use for regex matching?$dbv40629$,
   $dbv40630$["REGEXP", "~", "RLIKE", "MATCH"]$dbv40630$::jsonb,
   1, $dbv40631$PostgreSQL uses the ~ operator (and ~* for case-insensitive) for regex matching.$dbv40631$, 1, 1),
  ($dbv40632$tq-dbms-sql-12-pattern-matching-3$dbv40632$, $dbv40633$pt-dbms-sql-12-pattern-matching$dbv40633$,
   $dbv40634$Which keyword does MySQL use for regex matching?$dbv40634$,
   $dbv40635$["~", "REGEXP (or its synonym RLIKE)", "SIMILAR TO", "MATCHES"]$dbv40635$::jsonb,
   1, $dbv40636$MySQL's REGEXP (and RLIKE as a synonym) performs regex matching.$dbv40636$, 1, 2),
  ($dbv40637$tq-dbms-sql-12-pattern-matching-4$dbv40637$, $dbv40638$pt-dbms-sql-12-pattern-matching$dbv40638$,
   $dbv40639$Is regex matching generally more or less expensive than a simple LIKE pattern?$dbv40639$,
   $dbv40640$["Always less expensive", "Generally more computationally expensive, especially on large tables without supporting indexes", "Exactly the same cost in every case", "Regex matching cannot be used on any indexed column"]$dbv40640$::jsonb,
   1, $dbv40641$The added expressive power of regex comes with real additional computational cost.$dbv40641$, 1, 3),
  ($dbv40642$tq-dbms-sql-12-pattern-matching-5$dbv40642$, $dbv40643$pt-dbms-sql-12-pattern-matching$dbv40643$,
   $dbv40644$Why is regex syntax described as one of the least portable areas of SQL?$dbv40644$,
   $dbv40645$["It is actually perfectly standardized across all dialects", "Both the invocation keyword (REGEXP/~/RLIKE/SIMILAR TO) and details of the regex dialect itself vary significantly across database engines", "Regex is not supported by any mainstream database", "Portability issues only affect LIKE, not regex"]$dbv40645$::jsonb,
   1, $dbv40646$This dialect fragmentation is more pronounced for regex than for most other SQL features.$dbv40646$, 1, 4),
  ($dbv40647$tq-dbms-sql-12-pattern-matching-6$dbv40647$, $dbv40648$pt-dbms-sql-12-pattern-matching$dbv40648$,
   $dbv40649$Why might `.` need special handling in a regex pattern if you want to match a literal period?$dbv40649$,
   $dbv40650$["`.` has no special meaning in regex", "`.` normally means 'any single character' in regex, so matching a literal period requires escaping it", "Periods are never allowed in regex patterns", "`.` only has special meaning in LIKE, not regex"]$dbv40650$::jsonb,
   1, $dbv40651$Regex special characters like `.` need escaping to be matched literally — a common gotcha.$dbv40651$, 1, 5),
  ($dbv40652$tq-dbms-sql-12-pattern-matching-7$dbv40652$, $dbv40653$pt-dbms-sql-12-pattern-matching$dbv40653$,
   $dbv40654$When should you prefer LIKE over a full regular expression?$dbv40654$,
   $dbv40655$["Always use regex regardless of complexity", "When a simple wildcard pattern genuinely suffices \u2014 it's simpler and typically cheaper than regex", "LIKE should never be used if regex is available", "There's no meaningful difference in when to use each"]$dbv40655$::jsonb,
   1, $dbv40656$Reaching for the simpler, generally cheaper tool when it's sufficient is good practice.$dbv40656$, 1, 6),
  ($dbv40657$tq-dbms-sql-12-pattern-matching-8$dbv40657$, $dbv40658$pt-dbms-sql-12-pattern-matching$dbv40658$,
   $dbv40659$Can regex patterns express alternation (matching one of several alternative forms)?$dbv40659$,
   $dbv40660$["No, this is impossible with regex", "Yes \u2014 this is a classic example of pattern logic regex supports that LIKE fundamentally cannot express", "Only LIKE can express alternation", "Alternation requires a separate UNION query instead"]$dbv40660$::jsonb,
   1, $dbv40661$Alternation (e.g. matching 'cat' or 'dog') is a standard regex capability beyond LIKE's simple wildcards.$dbv40661$, 1, 7)
on conflict (id) do nothing;

-- 12.10 IS NULL
with g as (select id from public.learning_grids where lower(slug) = $dbv40662$dbms-sql-tutorial$dbv40662$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40663$chapter-12-select-and-filtering$dbv40663$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40664$IS NULL$dbv40664$, $dbv40665$is-null$dbv40665$, '', 10, 'published', true, true, $dbv40666$dbms_sql_tutorial$dbv40666$, $dbv40667$chapter-12-select-and-filtering/is-null$dbv40667$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40668$dbms_sql_tutorial$dbv40668$ and source_ref = $dbv40669$chapter-12-select-and-filtering/is-null$dbv40669$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40670$IS NULL$dbv40670$, $dbv40671$### Definition

`IS NULL` tests whether a value is `NULL` — the only correct way to check for a missing/unknown value, since ordinary comparison operators (`=`, `<>`) can never produce `TRUE` when compared against `NULL` (Chapter 8's NULL Semantics, 12.4).

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name FROM products WHERE stock IS NULL;
```

This correctly finds every product whose stock hasn't been counted yet — `Notebook`, in the running example. `stock = NULL` would incorrectly return zero rows, always, regardless of how many products actually have a NULL stock.

### Edge Cases and Pitfalls

- `IS NULL` is a special comparison operator PAIR (`IS NULL`/`IS NOT NULL`), not an ordinary function or a value comparison — it's genuinely part of SQL's syntax specifically because ordinary `=` cannot express this test.
- `IS NULL` can be combined with other conditions using `AND`/`OR`, exactly like any other condition: `WHERE stock IS NULL OR stock = 0` finds products that are either uncounted OR confirmed empty.
- A common realistic use: `LEFT JOIN ... WHERE right_table.key IS NULL` — the anti-join pattern (used repeatedly in this course, e.g. 5.11, 7.11) for finding rows with NO match in another table.

### Key Takeaways

- IS NULL is the only correct way to test for a missing value — never use = NULL.
- It's a distinct SQL syntax construct, not an ordinary comparison operator applied to the literal NULL.
- Combined with LEFT JOIN, IS NULL is the standard anti-join pattern for finding unmatched rows.$dbv40671$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40672$dbms_sql_tutorial_seed$dbv40672$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40673$dbms_sql_tutorial_seed$dbv40673$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40674$dbms-sql-tutorial$dbv40674$),
     t as (select id from public.learning_topics where source_kind = $dbv40675$dbms_sql_tutorial$dbv40675$ and source_ref = $dbv40676$chapter-12-select-and-filtering/is-null$dbv40676$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40677$pt-dbms-sql-12-is-null$dbv40677$, $dbv40678$IS NULL - Quick Test$dbv40678$, 'aptitude', 8, 8,
  $dbv40679$8 questions on IS NULL.$dbv40679$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40680$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40680$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40681$tq-dbms-sql-12-is-null-1$dbv40681$, $dbv40682$pt-dbms-sql-12-is-null$dbv40682$,
   $dbv40683$What is the correct way to test whether a column's value is NULL?$dbv40683$,
   $dbv40684$["column = NULL", "column IS NULL", "column == NULL", "column <> NULL"]$dbv40684$::jsonb,
   1, $dbv40685$IS NULL is specifically designed for this test; ordinary comparison operators cannot express it.$dbv40685$, 1, 0),
  ($dbv40686$tq-dbms-sql-12-is-null-2$dbv40686$, $dbv40687$pt-dbms-sql-12-is-null$dbv40687$,
   $dbv40688$Why does `stock = NULL` fail to find rows where stock is NULL?$dbv40688$,
   $dbv40689$["It actually works correctly", "Because = always evaluates to UNKNOWN when compared against NULL, never TRUE, regardless of the actual value", "Because NULL is treated as zero by =", "Because = can only compare numbers"]$dbv40689$::jsonb,
   1, $dbv40690$This is the direct consequence of NULL comparison semantics covered in Chapter 8.$dbv40690$, 1, 1),
  ($dbv40691$tq-dbms-sql-12-is-null-3$dbv40691$, $dbv40692$pt-dbms-sql-12-is-null$dbv40692$,
   $dbv40693$Can IS NULL be combined with other conditions using AND/OR?$dbv40693$,
   $dbv40694$["No, IS NULL must always be the only condition in WHERE", "Yes \u2014 WHERE stock IS NULL OR stock = 0 is a valid, common pattern", "IS NULL can only be combined with NOT", "IS NULL cannot appear in a WHERE clause at all"]$dbv40694$::jsonb,
   1, $dbv40695$IS NULL behaves like any other boolean condition and combines naturally with AND/OR.$dbv40695$, 1, 2),
  ($dbv40696$tq-dbms-sql-12-is-null-4$dbv40696$, $dbv40697$pt-dbms-sql-12-is-null$dbv40697$,
   $dbv40698$What is the 'anti-join' pattern that uses IS NULL?$dbv40698$,
   $dbv40699$["INNER JOIN combined with IS NULL", "LEFT JOIN followed by WHERE <right_table>.key IS NULL, to find rows with no match in the other table", "A join that only works on NULL columns", "GROUP BY combined with IS NULL"]$dbv40699$::jsonb,
   1, $dbv40700$This pattern, used repeatedly across the course, finds unmatched rows via a LEFT JOIN plus an IS NULL filter.$dbv40700$, 1, 3),
  ($dbv40701$tq-dbms-sql-12-is-null-5$dbv40701$, $dbv40702$pt-dbms-sql-12-is-null$dbv40702$,
   $dbv40703$Is IS NULL an ordinary function applied to the value NULL, or a distinct piece of SQL syntax?$dbv40703$,
   $dbv40704$["An ordinary function, just like UPPER() or LENGTH()", "A distinct syntax construct (the IS NULL / IS NOT NULL operator pair), specifically because ordinary = cannot express this test", "A deprecated legacy feature", "A synonym for the COALESCE function"]$dbv40704$::jsonb,
   1, $dbv40705$IS NULL exists as dedicated syntax precisely because standard comparison operators are incapable of this test.$dbv40705$, 1, 4),
  ($dbv40706$tq-dbms-sql-12-is-null-6$dbv40706$, $dbv40707$pt-dbms-sql-12-is-null$dbv40707$,
   $dbv40708$In the running products example, which product(s) have a NULL stock?$dbv40708$,
   $dbv40709$["ProLaptop", "Notebook", "ProPhone", "None of them"]$dbv40709$::jsonb,
   1, $dbv40710$Notebook's stock is shown as NULL in the running example table.$dbv40710$, 1, 5),
  ($dbv40711$tq-dbms-sql-12-is-null-7$dbv40711$, $dbv40712$pt-dbms-sql-12-is-null$dbv40712$,
   $dbv40713$Can IS NULL be used on any column type, or only numeric columns?$dbv40713$,
   $dbv40714$["Only numeric columns", "Any column type \u2014 NULL is a property independent of the column's data type", "Only text columns", "Only columns declared without NOT NULL"]$dbv40714$::jsonb,
   1, $dbv40715$NULL-ness is orthogonal to data type; IS NULL applies universally.$dbv40715$, 1, 6),
  ($dbv40716$tq-dbms-sql-12-is-null-8$dbv40716$, $dbv40717$pt-dbms-sql-12-is-null$dbv40717$,
   $dbv40718$If a column is declared NOT NULL, is there ever a practical reason to still write IS NULL against it in a query?$dbv40718$,
   $dbv40719$["No, it would always be pointless", "It's rarely useful for that specific column, though the same query pattern is essential for other nullable columns or after an outer join introduces NULLs", "IS NULL is illegal syntax on NOT NULL columns", "It would cause a runtime error"]$dbv40719$::jsonb,
   1, $dbv40720$While redundant on a genuinely NOT NULL column directly, the same construct remains essential elsewhere, including columns from an outer-joined table that can be NULL regardless of the joined table's own constraint.$dbv40720$, 1, 7)
on conflict (id) do nothing;

-- 12.11 IS NOT NULL
with g as (select id from public.learning_grids where lower(slug) = $dbv40721$dbms-sql-tutorial$dbv40721$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40722$chapter-12-select-and-filtering$dbv40722$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40723$IS NOT NULL$dbv40723$, $dbv40724$is-not-null$dbv40724$, '', 11, 'published', true, true, $dbv40725$dbms_sql_tutorial$dbv40725$, $dbv40726$chapter-12-select-and-filtering/is-not-null$dbv40726$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40727$dbms_sql_tutorial$dbv40727$ and source_ref = $dbv40728$chapter-12-select-and-filtering/is-not-null$dbv40728$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40729$IS NOT NULL$dbv40729$, $dbv40730$### Definition

`IS NOT NULL` tests whether a value is present (not `NULL`) — the direct complement of `IS NULL` (12.10), and equally necessary since `<> NULL` suffers the exact same "never TRUE" problem as `= NULL`.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name, stock FROM products WHERE stock IS NOT NULL;
```

This correctly returns every product whose stock HAS actually been counted — excluding `Notebook`. Just like `IS NULL`, this is dedicated syntax, not a comparison against the literal value `NULL`.

### Edge Cases and Pitfalls

- `NOT (column IS NULL)` and `column IS NOT NULL` are equivalent — but the direct `IS NOT NULL` form is clearer and more idiomatic than wrapping `IS NULL` in `NOT`.
- A `NOT NULL` constraint on a column (Chapter 10) means `IS NOT NULL` will ALWAYS be true for every row in that column — the runtime check becomes redundant specifically for that column, though it still matters for any nullable column, or after an outer join potentially reintroduces NULLs even for an originally NOT NULL column from the non-preserved side.
- Combining `IS NOT NULL` with other filters is common for "only consider complete records": `WHERE email IS NOT NULL AND phone IS NOT NULL` finds only fully-contactable customers.

### Key Takeaways

- IS NOT NULL correctly tests for a present (non-NULL) value; <> NULL does not work, for the same reason = NULL doesn't.
- It's the direct, idiomatic complement to IS NULL — prefer it over NOT (... IS NULL).
- Especially useful for filtering to "complete" records across several optionally-NULL columns.$dbv40730$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40731$dbms_sql_tutorial_seed$dbv40731$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40732$dbms_sql_tutorial_seed$dbv40732$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40733$dbms-sql-tutorial$dbv40733$),
     t as (select id from public.learning_topics where source_kind = $dbv40734$dbms_sql_tutorial$dbv40734$ and source_ref = $dbv40735$chapter-12-select-and-filtering/is-not-null$dbv40735$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40736$pt-dbms-sql-12-is-not-null$dbv40736$, $dbv40737$IS NOT NULL - Quick Test$dbv40737$, 'aptitude', 8, 8,
  $dbv40738$8 questions on IS NOT NULL.$dbv40738$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40739$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40739$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40740$tq-dbms-sql-12-is-not-null-1$dbv40740$, $dbv40741$pt-dbms-sql-12-is-not-null$dbv40741$,
   $dbv40742$What does IS NOT NULL test for?$dbv40742$,
   $dbv40743$["Whether a value is missing", "Whether a value is present (not NULL)", "Whether a value equals zero", "Whether a value is a string"]$dbv40743$::jsonb,
   1, $dbv40744$IS NOT NULL is the direct complement of IS NULL.$dbv40744$, 1, 0),
  ($dbv40745$tq-dbms-sql-12-is-not-null-2$dbv40745$, $dbv40746$pt-dbms-sql-12-is-not-null$dbv40746$,
   $dbv40747$Why doesn't `stock <> NULL` correctly find rows where stock has a real value?$dbv40747$,
   $dbv40748$["It actually works fine", "<> against NULL always evaluates to UNKNOWN, never TRUE, exactly like = against NULL", "<> only works on text columns", "NULL always equals itself under <>"]$dbv40748$::jsonb,
   1, $dbv40749$The same NULL-comparison semantics that break = NULL also break <> NULL.$dbv40749$, 1, 1),
  ($dbv40750$tq-dbms-sql-12-is-not-null-3$dbv40750$, $dbv40751$pt-dbms-sql-12-is-not-null$dbv40751$,
   $dbv40752$Are `column IS NOT NULL` and `NOT (column IS NULL)` equivalent?$dbv40752$,
   $dbv40753$["No, they produce different results", "Yes, they are logically equivalent, though IS NOT NULL is the more direct, idiomatic phrasing", "IS NOT NULL is deprecated in favor of NOT (IS NULL)", "These can only be used in different clauses"]$dbv40753$::jsonb,
   1, $dbv40754$Both express the same condition; IS NOT NULL is simply the clearer, standard way to write it.$dbv40754$, 1, 2),
  ($dbv40755$tq-dbms-sql-12-is-not-null-4$dbv40755$, $dbv40756$pt-dbms-sql-12-is-not-null$dbv40756$,
   $dbv40757$If a column has a NOT NULL constraint, what does IS NOT NULL evaluate to for every row in that column?$dbv40757$,
   $dbv40758$["It varies row by row", "Always TRUE, since the constraint guarantees no NULLs exist in that column", "Always FALSE", "It causes an error since the check is redundant"]$dbv40758$::jsonb,
   1, $dbv40759$A NOT NULL constraint guarantees the condition is always satisfied for that column, making the check (for that column specifically) trivially true.$dbv40759$, 1, 3),
  ($dbv40760$tq-dbms-sql-12-is-not-null-5$dbv40760$, $dbv40761$pt-dbms-sql-12-is-not-null$dbv40761$,
   $dbv40762$Can a column from a NOT NULL-constrained table still show NULL in a query result?$dbv40762$,
   $dbv40763$["Never, under any circumstances", "Yes \u2014 after an outer join, columns from the non-preserved side can appear as NULL in the result even if the original column itself disallows NULL", "Only if the column is also a primary key", "Only in aggregate queries"]$dbv40763$::jsonb,
   1, $dbv40764$An outer join can introduce NULLs into the result for unmatched rows, regardless of the source table's own constraints.$dbv40764$, 1, 4),
  ($dbv40765$tq-dbms-sql-12-is-not-null-6$dbv40765$, $dbv40766$pt-dbms-sql-12-is-not-null$dbv40766$,
   $dbv40767$What does `WHERE email IS NOT NULL AND phone IS NOT NULL` accomplish?$dbv40767$,
   $dbv40768$["Finds records missing both email and phone", "Finds only records that have BOTH an email and a phone number present", "Finds records with either an email or a phone", "This is invalid syntax"]$dbv40768$::jsonb,
   1, $dbv40769$Combining multiple IS NOT NULL checks with AND filters to fully complete records across those columns.$dbv40769$, 1, 5),
  ($dbv40770$tq-dbms-sql-12-is-not-null-7$dbv40770$, $dbv40771$pt-dbms-sql-12-is-not-null$dbv40771$,
   $dbv40772$In the running products example, which product's stock satisfies IS NOT NULL?$dbv40772$,
   $dbv40773$["Notebook", "ProLaptop, Python Basics, and ProPhone", "None of them", "Only Notebook"]$dbv40773$::jsonb,
   1, $dbv40774$Every product except Notebook has a non-NULL stock value in the running example.$dbv40774$, 1, 6),
  ($dbv40775$tq-dbms-sql-12-is-not-null-8$dbv40775$, $dbv40776$pt-dbms-sql-12-is-not-null$dbv40776$,
   $dbv40777$Is IS NOT NULL a comparison against the literal value NULL, using the <> operator internally?$dbv40777$,
   $dbv40778$["Yes, that's exactly how it works internally", "No \u2014 like IS NULL, it's dedicated SQL syntax, not an application of an ordinary comparison operator", "It uses the = operator internally", "It is implemented as a user-defined function in every dialect"]$dbv40778$::jsonb,
   1, $dbv40779$IS NOT NULL is its own syntactic construct precisely because ordinary comparison operators can't express this test.$dbv40779$, 1, 7)
on conflict (id) do nothing;

-- 12.12 CASE
with g as (select id from public.learning_grids where lower(slug) = $dbv40780$dbms-sql-tutorial$dbv40780$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40781$chapter-12-select-and-filtering$dbv40781$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40782$CASE$dbv40782$, $dbv40783$case$dbv40783$, '', 12, 'published', true, true, $dbv40784$dbms_sql_tutorial$dbv40784$, $dbv40785$chapter-12-select-and-filtering/case$dbv40785$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40786$dbms_sql_tutorial$dbv40786$ and source_ref = $dbv40787$chapter-12-select-and-filtering/case$dbv40787$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40788$CASE$dbv40788$, $dbv40789$### Definition

`CASE WHEN ... THEN ... ELSE ... END` is SQL's conditional expression — it evaluates a series of conditions in order and returns the value tied to the first one that's `TRUE`, falling back to `ELSE` (or `NULL` if `ELSE` is omitted) if none match.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT
  name,
  price,
  CASE
    WHEN price < 300 THEN 'Budget'
    WHEN price <= 1000 THEN 'Mid'
    ELSE 'Premium'
  END AS tier
FROM products;
```

Conditions are checked TOP TO BOTTOM, and the FIRST match wins — for a price of exactly 300, the first branch (`price < 300`) is false, so it falls through to the second (`price <= 1000`, true) and returns 'Mid'. This ordering-matters behavior is easy to get wrong if branches aren't written from most-specific to least-specific (or, as here, in a logical increasing order).

### Edge Cases and Pitfalls

- `CASE` can appear almost anywhere a value is expected — in `SELECT`, `WHERE`, `ORDER BY`, even inside another function call — because it's an EXPRESSION, not a separate statement.
- There's also a "simple CASE" form, `CASE column WHEN val1 THEN ... WHEN val2 THEN ... END`, which only tests equality against one column — more concise than the full `WHEN condition THEN` form when every branch is a plain equality check on the same column.
- If no `WHEN` branch matches and there's no `ELSE`, the result is `NULL` — not an error — which can silently produce unexpected `NULL`s if a case wasn't anticipated; including an explicit `ELSE` is good defensive practice.

### Key Takeaways

- CASE WHEN...THEN...ELSE...END evaluates conditions top-to-bottom and returns the first match's value.
- It's a value-producing expression usable almost anywhere, not a standalone statement.
- Omitting ELSE silently produces NULL for unmatched rows — usually worth avoiding with an explicit ELSE.$dbv40789$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40790$dbms_sql_tutorial_seed$dbv40790$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40791$dbms_sql_tutorial_seed$dbv40791$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40792$dbms-sql-tutorial$dbv40792$),
     t as (select id from public.learning_topics where source_kind = $dbv40793$dbms_sql_tutorial$dbv40793$ and source_ref = $dbv40794$chapter-12-select-and-filtering/case$dbv40794$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40795$pt-dbms-sql-12-case$dbv40795$, $dbv40796$CASE - Quick Test$dbv40796$, 'aptitude', 8, 8,
  $dbv40797$8 questions on CASE.$dbv40797$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40798$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40798$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40799$tq-dbms-sql-12-case-1$dbv40799$, $dbv40800$pt-dbms-sql-12-case$dbv40800$,
   $dbv40801$What does CASE WHEN...THEN...ELSE...END do?$dbv40801$,
   $dbv40802$["Filters rows", "Evaluates conditions in order and returns the value tied to the first TRUE one (or ELSE if none match)", "Sorts rows by a condition", "Groups rows by a condition"]$dbv40802$::jsonb,
   1, $dbv40803$CASE is SQL's conditional expression, producing a value based on the first matching condition.$dbv40803$, 1, 0),
  ($dbv40804$tq-dbms-sql-12-case-2$dbv40804$, $dbv40805$pt-dbms-sql-12-case$dbv40805$,
   $dbv40806$In what order are CASE's WHEN conditions evaluated?$dbv40806$,
   $dbv40807$["In random order", "Top to bottom, with the FIRST TRUE condition's value being returned", "Bottom to top", "All conditions simultaneously, picking the most specific"]$dbv40807$::jsonb,
   1, $dbv40808$Order matters — evaluation proceeds top-to-bottom and stops at the first match.$dbv40808$, 1, 1),
  ($dbv40809$tq-dbms-sql-12-case-3$dbv40809$, $dbv40810$pt-dbms-sql-12-case$dbv40810$,
   $dbv40811$What does CASE return if no WHEN condition matches and there's no ELSE clause?$dbv40811$,
   $dbv40812$["An error is raised", "NULL", "The value 0", "An empty string"]$dbv40812$::jsonb,
   1, $dbv40813$Without ELSE, an unmatched row's CASE expression silently evaluates to NULL.$dbv40813$, 1, 2),
  ($dbv40814$tq-dbms-sql-12-case-4$dbv40814$, $dbv40815$pt-dbms-sql-12-case$dbv40815$,
   $dbv40816$Can CASE be used inside a WHERE clause, not just SELECT?$dbv40816$,
   $dbv40817$["No, CASE can only appear in SELECT", "Yes \u2014 CASE is an expression usable almost anywhere a value is expected, including WHERE, ORDER BY, and inside function calls", "CASE can only appear in ORDER BY", "CASE requires its own separate statement"]$dbv40817$::jsonb,
   1, $dbv40818$As an expression rather than a statement, CASE is broadly usable throughout a query.$dbv40818$, 1, 3),
  ($dbv40819$tq-dbms-sql-12-case-5$dbv40819$, $dbv40820$pt-dbms-sql-12-case$dbv40820$,
   $dbv40821$What is the 'simple CASE' form?$dbv40821$,
   $dbv40822$["A CASE with no WHEN branches at all", "CASE column WHEN val1 THEN ... WHEN val2 THEN ... END, which tests equality against one column, more concisely than the full WHEN-condition form", "A CASE that can only return TRUE or FALSE", "A deprecated, no-longer-supported CASE syntax"]$dbv40822$::jsonb,
   1, $dbv40823$The simple form is a shorthand specifically for equality-only branches against a single column.$dbv40823$, 1, 4),
  ($dbv40824$tq-dbms-sql-12-case-6$dbv40824$, $dbv40825$pt-dbms-sql-12-case$dbv40825$,
   $dbv40826$For price = 300 with WHEN price < 300 THEN 'Budget' WHEN price <= 1000 THEN 'Mid', what tier results?$dbv40826$,
   $dbv40827$["'Budget'", "'Mid'", "NULL", "An error, since 300 matches no exact condition"]$dbv40827$::jsonb,
   1, $dbv40828$300 fails the first (strictly less than) condition but satisfies the second (<=), so 'Mid' is returned.$dbv40828$, 1, 5),
  ($dbv40829$tq-dbms-sql-12-case-7$dbv40829$, $dbv40830$pt-dbms-sql-12-case$dbv40830$,
   $dbv40831$Why is including an explicit ELSE generally good defensive practice?$dbv40831$,
   $dbv40832$["ELSE is required by SQL syntax", "It avoids silently producing unexpected NULLs for cases the WHEN branches didn't anticipate", "ELSE makes the query run faster", "ELSE is only needed for numeric CASE expressions"]$dbv40832$::jsonb,
   1, $dbv40833$An explicit ELSE makes the fallback behavior intentional and visible, rather than an implicit NULL.$dbv40833$, 1, 6),
  ($dbv40834$tq-dbms-sql-12-case-8$dbv40834$, $dbv40835$pt-dbms-sql-12-case$dbv40835$,
   $dbv40836$Is CASE a standalone SQL statement or an expression?$dbv40836$,
   $dbv40837$["A standalone statement, like SELECT or UPDATE", "An expression that produces a value, usable within other statements", "Neither \u2014 it's a type of constraint", "A comment syntax"]$dbv40837$::jsonb,
   1, $dbv40838$CASE's expression nature is exactly why it can be embedded almost anywhere a value belongs.$dbv40838$, 1, 7)
on conflict (id) do nothing;

-- 12.13 COALESCE
with g as (select id from public.learning_grids where lower(slug) = $dbv40839$dbms-sql-tutorial$dbv40839$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40840$chapter-12-select-and-filtering$dbv40840$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40841$COALESCE$dbv40841$, $dbv40842$coalesce$dbv40842$, '', 13, 'published', true, true, $dbv40843$dbms_sql_tutorial$dbv40843$, $dbv40844$chapter-12-select-and-filtering/coalesce$dbv40844$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40845$dbms_sql_tutorial$dbv40845$ and source_ref = $dbv40846$chapter-12-select-and-filtering/coalesce$dbv40846$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40847$COALESCE$dbv40847$, $dbv40848$### Definition

`COALESCE(val1, val2, ..., valN)` returns the FIRST non-NULL value among its arguments, evaluated left to right — the standard way to supply a fallback/default when a value might be `NULL`.

Running example — a `products(id, name, category, price, stock)` table, where `stock` can be `NULL` (not yet counted):

| id | name | category | price | stock |
|----|------|----------|-------|-------|
| 1 | ProLaptop | Electronics | 85000 | 12 |
| 2 | Notebook | Stationery | 40 | NULL |
| 3 | Python Basics | Books | 350 | 5 |
| 4 | ProPhone | Electronics | 45000 | 0 |

```sql
SELECT name, COALESCE(stock, 0) AS stock FROM products;
```

For `Notebook` (whose `stock` is `NULL`), this returns 0 instead of `NULL` — `COALESCE` checked its first argument (`stock`), found it `NULL`, and fell through to the second argument (the literal `0`). For every other product, `stock` itself is already non-NULL, so it's returned unchanged.

### Edge Cases and Pitfalls

- `COALESCE` can take MORE than two arguments, checking each in order: `COALESCE(preferred_phone, backup_phone, office_phone, 'No phone on file')` tries each option in turn.
- `COALESCE` is standard SQL, supported essentially everywhere — unlike dialect-specific two-argument shortcuts like MySQL's `IFNULL()` or Oracle's `NVL()` (Chapter 14), which only accept exactly two arguments. `COALESCE` is generally the more portable choice.
- All arguments to `COALESCE` should be of compatible types — mixing incompatible types (e.g. a number and an unconvertable string) can cause an error or an unexpected implicit conversion, depending on the dialect.

### Key Takeaways

- COALESCE(a, b, c, ...) returns the first non-NULL value among its arguments, checked left to right.
- It's the standard, portable way to supply a fallback for a possibly-NULL value — preferred over dialect-specific two-argument alternatives.
- It accepts any number of arguments, not just two.$dbv40848$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40849$dbms_sql_tutorial_seed$dbv40849$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40850$dbms_sql_tutorial_seed$dbv40850$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40851$dbms-sql-tutorial$dbv40851$),
     t as (select id from public.learning_topics where source_kind = $dbv40852$dbms_sql_tutorial$dbv40852$ and source_ref = $dbv40853$chapter-12-select-and-filtering/coalesce$dbv40853$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40854$pt-dbms-sql-12-coalesce$dbv40854$, $dbv40855$COALESCE - Quick Test$dbv40855$, 'aptitude', 8, 8,
  $dbv40856$8 questions on COALESCE.$dbv40856$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40857$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40857$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40858$tq-dbms-sql-12-coalesce-1$dbv40858$, $dbv40859$pt-dbms-sql-12-coalesce$dbv40859$,
   $dbv40860$What does COALESCE(val1, val2, ..., valN) return?$dbv40860$,
   $dbv40861$["The last non-NULL value", "The first non-NULL value among its arguments, checked left to right", "The average of all non-NULL values", "TRUE if any argument is NULL"]$dbv40861$::jsonb,
   1, $dbv40862$COALESCE scans left to right and returns the first argument that isn't NULL.$dbv40862$, 1, 0),
  ($dbv40863$tq-dbms-sql-12-coalesce-2$dbv40863$, $dbv40864$pt-dbms-sql-12-coalesce$dbv40864$,
   $dbv40865$For Notebook where stock is NULL, what does COALESCE(stock, 0) return?$dbv40865$,
   $dbv40866$["NULL", "0", "An error", "The string 'NULL'"]$dbv40866$::jsonb,
   1, $dbv40867$Since stock is NULL, COALESCE falls through to the next argument, the literal 0.$dbv40867$, 1, 1),
  ($dbv40868$tq-dbms-sql-12-coalesce-3$dbv40868$, $dbv40869$pt-dbms-sql-12-coalesce$dbv40869$,
   $dbv40870$Can COALESCE accept more than two arguments?$dbv40870$,
   $dbv40871$["No, exactly two arguments are required", "Yes \u2014 it can take any number of arguments, checking each in order until a non-NULL one is found", "It accepts exactly three arguments", "More than two arguments causes a syntax error"]$dbv40871$::jsonb,
   1, $dbv40872$COALESCE is variadic — it can chain through any number of fallback options.$dbv40872$, 1, 2),
  ($dbv40873$tq-dbms-sql-12-coalesce-4$dbv40873$, $dbv40874$pt-dbms-sql-12-coalesce$dbv40874$,
   $dbv40875$Why is COALESCE generally preferred over dialect-specific alternatives like MySQL's IFNULL()?$dbv40875$,
   $dbv40876$["COALESCE is always faster", "COALESCE is standard SQL supported broadly, while IFNULL()/NVL()-style functions are dialect-specific and typically limited to exactly two arguments", "IFNULL() is deprecated and no longer works anywhere", "COALESCE can only be used with numeric types, making it more predictable"]$dbv40876$::jsonb,
   1, $dbv40877$Portability and flexibility (any number of arguments) favor COALESCE for general use.$dbv40877$, 1, 3),
  ($dbv40878$tq-dbms-sql-12-coalesce-5$dbv40878$, $dbv40879$pt-dbms-sql-12-coalesce$dbv40879$,
   $dbv40880$What happens if EVERY argument to COALESCE is NULL?$dbv40880$,
   $dbv40881$["An error is raised", "COALESCE itself returns NULL, since there's no non-NULL value to fall back to", "It returns the literal string 'NULL'", "It returns 0 by default"]$dbv40881$::jsonb,
   1, $dbv40882$If no argument is non-NULL, there's nothing for COALESCE to return except NULL itself.$dbv40882$, 1, 4),
  ($dbv40883$tq-dbms-sql-12-coalesce-6$dbv40883$, $dbv40884$pt-dbms-sql-12-coalesce$dbv40884$,
   $dbv40885$What real-world pattern does `COALESCE(preferred_phone, backup_phone, office_phone, 'No phone on file')` express?$dbv40885$,
   $dbv40886$["Averaging four phone numbers together", "Trying each contact option in priority order, falling back to a final default message if none are available", "Concatenating all four values into one string", "Validating that all four phone numbers are correctly formatted"]$dbv40886$::jsonb,
   1, $dbv40887$This is a classic multi-level fallback pattern that COALESCE's variadic nature supports directly.$dbv40887$, 1, 5),
  ($dbv40888$tq-dbms-sql-12-coalesce-7$dbv40888$, $dbv40889$pt-dbms-sql-12-coalesce$dbv40889$,
   $dbv40890$Should all arguments passed to COALESCE be of compatible types?$dbv40890$,
   $dbv40891$["No, type never matters for COALESCE", "Yes \u2014 mixing incompatible types can cause an error or an unexpected implicit conversion, depending on the dialect", "Only the first argument's type matters", "COALESCE automatically converts every argument to text"]$dbv40891$::jsonb,
   1, $dbv40892$Type compatibility across COALESCE's arguments avoids relying on potentially inconsistent implicit conversions.$dbv40892$, 1, 6),
  ($dbv40893$tq-dbms-sql-12-coalesce-8$dbv40893$, $dbv40894$pt-dbms-sql-12-coalesce$dbv40894$,
   $dbv40895$Is COALESCE part of the SQL standard, or a MySQL-specific extension?$dbv40895$,
   $dbv40896$["A MySQL-specific extension only", "Part of the standard SQL specification, supported broadly across dialects", "A PostgreSQL-only feature", "Not part of any formal specification"]$dbv40896$::jsonb,
   1, $dbv40897$COALESCE's standard-SQL status is exactly what makes it more portable than vendor-specific shortcuts.$dbv40897$, 1, 7)
on conflict (id) do nothing;

-- 12.14 NULLIF
with g as (select id from public.learning_grids where lower(slug) = $dbv40898$dbms-sql-tutorial$dbv40898$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40899$chapter-12-select-and-filtering$dbv40899$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40900$NULLIF$dbv40900$, $dbv40901$nullif$dbv40901$, '', 14, 'published', true, true, $dbv40902$dbms_sql_tutorial$dbv40902$, $dbv40903$chapter-12-select-and-filtering/nullif$dbv40903$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40904$dbms_sql_tutorial$dbv40904$ and source_ref = $dbv40905$chapter-12-select-and-filtering/nullif$dbv40905$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40906$NULLIF$dbv40906$, $dbv40907$### Definition

`NULLIF(val1, val2)` returns `NULL` if `val1` equals `val2`, otherwise returns `val1` unchanged — essentially the inverse operation of `COALESCE`: instead of replacing a NULL with a fallback, it deliberately CREATES a NULL when a specific "sentinel" value is seen.

### How It Works

```sql
SELECT name, NULLIF(stock, 0) AS stock_or_null FROM products;
```

For `ProPhone` (`stock = 0`), this returns `NULL` instead of `0` — useful when `0` is being used as a placeholder for "not really tracked" and you want later calculations (like `AVG`, which ignores `NULL`s but not zeros) to skip those rows rather than treating them as a real zero value.

A very common real use: **safely avoiding division by zero**. `total_revenue / NULLIF(total_orders, 0)` returns `NULL` (not an error, and not an incorrect result) when `total_orders` is 0, instead of the division itself failing or producing an undefined result.

### Edge Cases and Pitfalls

- `NULLIF(a, b)` is exactly equivalent to `CASE WHEN a = b THEN NULL ELSE a END` — it's really just a concise shorthand for a very specific, common `CASE` pattern.
- Combining `NULLIF` and `COALESCE` together is a common, powerful pattern: `COALESCE(NULLIF(discount_code, ''), 'NONE')` treats an empty string the same as a missing value, converting it to NULL first (via `NULLIF`) so `COALESCE` can then supply a real fallback.
- `NULLIF`'s equality check follows ordinary comparison semantics — if `val1` is already `NULL`, `NULLIF(NULL, anything)` returns `NULL` (since `NULL = anything` is `UNKNOWN`, not `TRUE`, so the "otherwise return val1" branch applies, and val1 IS NULL).

### Key Takeaways

- NULLIF(a, b) returns NULL if a equals b, otherwise returns a — the inverse of COALESCE's "replace NULL" behavior.
- Its most common real use is safe division: value / NULLIF(divisor, 0) avoids a division-by-zero error.
- NULLIF(a, b) is shorthand for CASE WHEN a = b THEN NULL ELSE a END.$dbv40907$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40908$dbms_sql_tutorial_seed$dbv40908$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40909$dbms_sql_tutorial_seed$dbv40909$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40910$dbms-sql-tutorial$dbv40910$),
     t as (select id from public.learning_topics where source_kind = $dbv40911$dbms_sql_tutorial$dbv40911$ and source_ref = $dbv40912$chapter-12-select-and-filtering/nullif$dbv40912$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40913$pt-dbms-sql-12-nullif$dbv40913$, $dbv40914$NULLIF - Quick Test$dbv40914$, 'aptitude', 8, 8,
  $dbv40915$8 questions on NULLIF.$dbv40915$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40916$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40916$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40917$tq-dbms-sql-12-nullif-1$dbv40917$, $dbv40918$pt-dbms-sql-12-nullif$dbv40918$,
   $dbv40919$What does NULLIF(val1, val2) return if val1 equals val2?$dbv40919$,
   $dbv40920$["val1", "val2", "NULL", "An error"]$dbv40920$::jsonb,
   2, $dbv40921$NULLIF specifically converts a matching value into NULL.$dbv40921$, 1, 0),
  ($dbv40922$tq-dbms-sql-12-nullif-2$dbv40922$, $dbv40923$pt-dbms-sql-12-nullif$dbv40923$,
   $dbv40924$What does NULLIF(val1, val2) return if val1 does NOT equal val2?$dbv40924$,
   $dbv40925$["NULL", "val1, unchanged", "val2", "An error"]$dbv40925$::jsonb,
   1, $dbv40926$When the values differ, NULLIF simply passes val1 through unchanged.$dbv40926$, 1, 1),
  ($dbv40927$tq-dbms-sql-12-nullif-3$dbv40927$, $dbv40928$pt-dbms-sql-12-nullif$dbv40928$,
   $dbv40929$What is the most common real-world use of NULLIF?$dbv40929$,
   $dbv40930$["Sorting rows", "Safely avoiding division by zero: value / NULLIF(divisor, 0)", "Removing duplicate rows", "Converting text to uppercase"]$dbv40930$::jsonb,
   1, $dbv40931$Turning a zero divisor into NULL avoids a division error, since division by NULL simply yields NULL.$dbv40931$, 1, 2),
  ($dbv40932$tq-dbms-sql-12-nullif-4$dbv40932$, $dbv40933$pt-dbms-sql-12-nullif$dbv40933$,
   $dbv40934$Which CASE expression is NULLIF(a, b) exactly equivalent to?$dbv40934$,
   $dbv40935$["CASE WHEN a = b THEN a ELSE NULL END", "CASE WHEN a = b THEN NULL ELSE a END", "CASE WHEN a <> b THEN NULL ELSE a END", "CASE WHEN a IS NULL THEN b ELSE a END"]$dbv40935$::jsonb,
   1, $dbv40936$NULLIF is shorthand for exactly this specific CASE pattern.$dbv40936$, 1, 3),
  ($dbv40937$tq-dbms-sql-12-nullif-5$dbv40937$, $dbv40938$pt-dbms-sql-12-nullif$dbv40938$,
   $dbv40939$What does COALESCE(NULLIF(discount_code, ''), 'NONE') accomplish?$dbv40939$,
   $dbv40940$["It always returns an empty string", "It treats an empty string the same as a missing value, converting it to NULL first, then supplying 'NONE' as the fallback", "It concatenates discount_code with 'NONE'", "It causes an error if discount_code is empty"]$dbv40940$::jsonb,
   1, $dbv40941$This combines NULLIF (empty-string-to-NULL) and COALESCE (NULL-to-fallback) into a single useful pattern.$dbv40941$, 1, 4),
  ($dbv40942$tq-dbms-sql-12-nullif-6$dbv40942$, $dbv40943$pt-dbms-sql-12-nullif$dbv40943$,
   $dbv40944$Is NULLIF the inverse operation of COALESCE?$dbv40944$,
   $dbv40945$["No, they do the same thing", "Yes \u2014 COALESCE replaces NULL with a fallback value; NULLIF deliberately creates a NULL from a specific sentinel value", "NULLIF only works with numbers, unlike COALESCE", "NULLIF is a deprecated alias for COALESCE"]$dbv40945$::jsonb,
   1, $dbv40946$The two functions serve complementary, opposite purposes.$dbv40946$, 1, 5),
  ($dbv40947$tq-dbms-sql-12-nullif-7$dbv40947$, $dbv40948$pt-dbms-sql-12-nullif$dbv40948$,
   $dbv40949$What does NULLIF(NULL, 5) return?$dbv40949$,
   $dbv40950$["5", "NULL", "An error", "0"]$dbv40950$::jsonb,
   1, $dbv40951$Since NULL = 5 is UNKNOWN (never TRUE), the 'otherwise return val1' branch applies — and val1 is itself NULL.$dbv40951$, 1, 6),
  ($dbv40952$tq-dbms-sql-12-nullif-8$dbv40952$, $dbv40953$pt-dbms-sql-12-nullif$dbv40953$,
   $dbv40954$Why might '0' be treated as a sentinel value worth converting to NULL with NULLIF in some datasets?$dbv40954$,
   $dbv40955$["Zero always means the same thing as NULL in every context", "Sometimes 0 is used as a placeholder for 'not really tracked,' and treating it as NULL lets NULL-ignoring aggregate functions (like AVG) correctly skip those rows", "NULLIF requires converting all zeros to NULL for validity", "This has no real practical benefit"]$dbv40955$::jsonb,
   1, $dbv40956$Distinguishing a genuine zero from a 'not tracked' placeholder matters for correct aggregate calculations.$dbv40956$, 1, 7)
on conflict (id) do nothing;

-- 12.15 Operator Precedence
with g as (select id from public.learning_grids where lower(slug) = $dbv40957$dbms-sql-tutorial$dbv40957$),
     s as (select id from public.learning_sections where lower(slug) = $dbv40958$chapter-12-select-and-filtering$dbv40958$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv40959$Operator Precedence$dbv40959$, $dbv40960$operator-precedence$dbv40960$, '', 15, 'published', true, true, $dbv40961$dbms_sql_tutorial$dbv40961$, $dbv40962$chapter-12-select-and-filtering/operator-precedence$dbv40962$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv40963$dbms_sql_tutorial$dbv40963$ and source_ref = $dbv40964$chapter-12-select-and-filtering/operator-precedence$dbv40964$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv40965$Operator Precedence$dbv40965$, $dbv40966$### Definition

**Operator precedence** determines which operators are evaluated FIRST when a SQL expression combines several without explicit parentheses — the same general concept as arithmetic's "multiplication before addition," applied to SQL's full operator set.

### How It Works

A simplified precedence order (highest to lowest, roughly):
1. Arithmetic (`*`, `/`, `%` before `+`, `-`)
2. Comparison operators (`=`, `<`, `>`, `BETWEEN`, `IN`, `LIKE`, `IS NULL`)
3. `NOT`
4. `AND`
5. `OR`

```sql
WHERE category = 'Books' OR category = 'Stationery' AND price < 100
-- evaluates as:
WHERE category = 'Books' OR (category = 'Stationery' AND price < 100)
```

Because `AND` binds tighter than `OR` (12.5), this returns ALL Books (regardless of price) PLUS Stationery under 100 — likely NOT the intent if the goal was "cheap items in either category." The fix is explicit parentheses: `WHERE (category = 'Books' OR category = 'Stationery') AND price < 100`.

### Edge Cases and Pitfalls

- This exact AND-before-OR precedence trap is one of the most common real-world sources of subtly wrong `WHERE` clauses — code that "runs fine" and returns SOME plausible-looking rows, while actually answering a different question than intended.
- Arithmetic precedence inside SQL expressions follows the same rules learned in basic mathematics (`*`/`/` before `+`/`-`) — `price + tax * 0.1` computes `tax * 0.1` first, then adds `price`.
- The safest general practice, given how easy precedence mistakes are to introduce and how hard they can be to spot in review, is to use explicit parentheses around any compound condition mixing more than one kind of logical or arithmetic operator — even where the default precedence would technically already produce the intended result.

### Key Takeaways

- SQL operators have a defined precedence order (roughly: arithmetic, then comparisons, then NOT, then AND, then OR).
- AND binds tighter than OR — a genuinely common, genuinely dangerous source of wrong query logic when parentheses are omitted.
- Default to explicit parentheses around any compound expression — the small verbosity cost is worth the clarity and safety.$dbv40966$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv40967$dbms_sql_tutorial_seed$dbv40967$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv40968$dbms_sql_tutorial_seed$dbv40968$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv40969$dbms-sql-tutorial$dbv40969$),
     t as (select id from public.learning_topics where source_kind = $dbv40970$dbms_sql_tutorial$dbv40970$ and source_ref = $dbv40971$chapter-12-select-and-filtering/operator-precedence$dbv40971$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv40972$pt-dbms-sql-12-operator-precedence$dbv40972$, $dbv40973$Operator Precedence - Quick Test$dbv40973$, 'aptitude', 8, 8,
  $dbv40974$8 questions on Operator Precedence.$dbv40974$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv40975$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv40975$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv40976$tq-dbms-sql-12-operator-precedence-1$dbv40976$, $dbv40977$pt-dbms-sql-12-operator-precedence$dbv40977$,
   $dbv40978$What does operator precedence determine?$dbv40978$,
   $dbv40979$["The order columns appear in the result", "Which operators are evaluated first when an expression combines several without explicit parentheses", "How fast a query executes", "Which rows are returned first"]$dbv40979$::jsonb,
   1, $dbv40980$Precedence resolves ambiguity in expressions with multiple operators and no parentheses.$dbv40980$, 1, 0),
  ($dbv40981$tq-dbms-sql-12-operator-precedence-2$dbv40981$, $dbv40982$pt-dbms-sql-12-operator-precedence$dbv40982$,
   $dbv40983$Between AND and OR, which binds tighter (is evaluated first)?$dbv40983$,
   $dbv40984$["OR", "AND", "They have identical precedence", "Neither has defined precedence in SQL"]$dbv40984$::jsonb,
   1, $dbv40985$AND has higher precedence than OR in SQL's operator precedence rules.$dbv40985$, 1, 1),
  ($dbv40986$tq-dbms-sql-12-operator-precedence-3$dbv40986$, $dbv40987$pt-dbms-sql-12-operator-precedence$dbv40987$,
   $dbv40988$How does `WHERE category = 'Books' OR category = 'Stationery' AND price < 100` actually get evaluated?$dbv40988$,
   $dbv40989$["As (category = 'Books' OR category = 'Stationery') AND price < 100", "As category = 'Books' OR (category = 'Stationery' AND price < 100)", "Left to right with no precedence applied", "This is a syntax error"]$dbv40989$::jsonb,
   1, $dbv40990$AND binding tighter than OR means the AND clause groups first.$dbv40990$, 1, 2),
  ($dbv40991$tq-dbms-sql-12-operator-precedence-4$dbv40991$, $dbv40992$pt-dbms-sql-12-operator-precedence$dbv40992$,
   $dbv40993$What is the safest general practice given how easy precedence mistakes are to make?$dbv40993$,
   $dbv40994$["Never use more than one operator per WHERE clause", "Use explicit parentheses around compound conditions, even when default precedence would already give the intended result", "Avoid AND and OR entirely, using only single conditions", "Always write conditions in alphabetical order"]$dbv40994$::jsonb,
   1, $dbv40995$Explicit parentheses remove ambiguity and protect against subtle precedence bugs.$dbv40995$, 1, 3),
  ($dbv40996$tq-dbms-sql-12-operator-precedence-5$dbv40996$, $dbv40997$pt-dbms-sql-12-operator-precedence$dbv40997$,
   $dbv40998$In arithmetic expressions within SQL, which is evaluated first: * or +?$dbv40998$,
   $dbv40999$["+ is always evaluated first", "* (and /) are evaluated before + (and -), matching ordinary math rules", "They have equal precedence, evaluated left to right always", "This depends entirely on the SQL dialect with no general rule"]$dbv40999$::jsonb,
   1, $dbv41000$SQL arithmetic precedence mirrors standard mathematical convention.$dbv41000$, 1, 4),
  ($dbv41001$tq-dbms-sql-12-operator-precedence-6$dbv41001$, $dbv41002$pt-dbms-sql-12-operator-precedence$dbv41002$,
   $dbv41003$Why is the AND-before-OR precedence trap considered dangerous in practice?$dbv41003$,
   $dbv41004$["It always causes an obvious syntax error", "The query 'runs fine' and returns plausible-looking rows while actually answering a different question than intended \u2014 making the bug hard to notice", "It only affects performance, not correctness", "Modern SQL engines automatically detect and warn about this pattern"]$dbv41004$::jsonb,
   1, $dbv41005$The silent-wrong-answer nature (no error, just wrong logic) is what makes this mistake particularly insidious.$dbv41005$, 1, 5),
  ($dbv41006$tq-dbms-sql-12-operator-precedence-7$dbv41006$, $dbv41007$pt-dbms-sql-12-operator-precedence$dbv41007$,
   $dbv41008$Where does comparison operator precedence (=, <, BETWEEN, IN, etc.) generally fall relative to AND/OR?$dbv41008$,
   $dbv41009$["Comparisons are evaluated after AND and OR", "Comparisons are evaluated before AND, NOT, and OR", "Comparisons and AND/OR are evaluated simultaneously", "There is no defined relationship between them"]$dbv41009$::jsonb,
   1, $dbv41010$Comparisons resolve to TRUE/FALSE/UNKNOWN first; the logical operators then combine those results.$dbv41010$, 1, 6),
  ($dbv41011$tq-dbms-sql-12-operator-precedence-8$dbv41011$, $dbv41012$pt-dbms-sql-12-operator-precedence$dbv41012$,
   $dbv41013$Does adding parentheses that match the DEFAULT precedence order change a query's behavior?$dbv41013$,
   $dbv41014$["Yes, it always changes the result", "No \u2014 such parentheses are purely for clarity and don't change behavior, since they match what would happen anyway", "It causes a syntax error", "It always makes the query slower"]$dbv41014$::jsonb,
   1, $dbv41015$Redundant-but-clarifying parentheses are free from a correctness standpoint — they just make intent explicit.$dbv41015$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 13: Sorting and Pagination
-- ---------------------------------------------------------------------------
-- 13.1 ORDER BY
with g as (select id from public.learning_grids where lower(slug) = $dbv41016$dbms-sql-tutorial$dbv41016$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41017$chapter-13-sorting-and-pagination$dbv41017$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41018$ORDER BY$dbv41018$, $dbv41019$order-by$dbv41019$, '', 1, 'published', true, true, $dbv41020$dbms_sql_tutorial$dbv41020$, $dbv41021$chapter-13-sorting-and-pagination/order-by$dbv41021$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41022$dbms_sql_tutorial$dbv41022$ and source_ref = $dbv41023$chapter-13-sorting-and-pagination/order-by$dbv41023$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41024$ORDER BY$dbv41024$, $dbv41025$### Definition

`ORDER BY` sorts the rows of a result set. Without it, SQL makes **no promise** about the order rows come back in — the engine can return them in whatever order is convenient (file order, index order, join order), and that order can change between runs. `ORDER BY` is the only clause that guarantees a specific order.

Syntax:

```sql
SELECT column1, column2, ...
FROM table_name
ORDER BY sort_expression [ASC | DESC], ...;
```

`ASC` (ascending) is the **default** — you almost never need to write it explicitly. `DESC` reverses the direction.

### Running Example

```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  category VARCHAR(30),
  price NUMERIC(10,2),
  rating NUMERIC(2,1)
);

INSERT INTO products (id, name, category, price, rating) VALUES
 (1, 'Wireless Mouse', 'Electronics', 599.00, 4.2),
 (2, 'Bluetooth Speaker', 'Electronics', 1499.00, 4.5),
 (3, 'Desk Lamp', 'Home', 899.00, 4.0),
 (4, 'Yoga Mat', 'Sports', 499.00, 4.6),
 (5, 'Notebook Set', 'Stationery', 199.00, 3.8);
```

Sort cheapest to most expensive:

```sql
SELECT name, price
FROM products
ORDER BY price;   -- ASC is implied
```

Result:

```
 name               | price
--------------------+--------
 Notebook Set       | 199.00
 Yoga Mat           | 499.00
 Wireless Mouse     | 599.00
 Desk Lamp          | 899.00
 Bluetooth Speaker  | 1499.00
```

Most expensive first:

```sql
SELECT name, price FROM products ORDER BY price DESC;
```

### Sorting by Position or Expression

SQL lets you order by the **ordinal position** of a column in the SELECT list, not just its name:

```sql
SELECT name, price FROM products ORDER BY 2 DESC;  -- sorts by price
```

This works but is **discouraged**: if someone reorders or adds a column to the SELECT list, the meaning of `ORDER BY 2` silently changes, producing a hard-to-spot bug. Prefer naming the column or its alias.

You can also order by an expression or an alias that isn't even in the SELECT list:

```sql
SELECT name, price, price * 0.9 AS discounted_price
FROM products
ORDER BY discounted_price;

-- or without an alias in scope, order by the raw expression:
SELECT name FROM products ORDER BY LENGTH(name);
```

### Key Takeaways

- **Q: What order does SQL return rows in if I omit ORDER BY?**
  A: Unspecified — never rely on it, even if it "looks" consistent in testing.
- **Q: Is ASC or DESC the default?**
  A: ASC.
- **Q: Why avoid `ORDER BY 2`?**
  A: It's positional and breaks silently when the SELECT list changes; column names/aliases are self-documenting and safer.$dbv41025$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41026$dbms_sql_tutorial_seed$dbv41026$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41027$dbms_sql_tutorial_seed$dbv41027$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41028$dbms-sql-tutorial$dbv41028$),
     t as (select id from public.learning_topics where source_kind = $dbv41029$dbms_sql_tutorial$dbv41029$ and source_ref = $dbv41030$chapter-13-sorting-and-pagination/order-by$dbv41030$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41031$pt-dbms-sql-13-order-by$dbv41031$, $dbv41032$ORDER BY - Quick Test$dbv41032$, 'aptitude', 8, 8,
  $dbv41033$8 questions on ORDER BY.$dbv41033$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41034$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41034$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41035$tq-dbms-sql-13-order-by-1$dbv41035$, $dbv41036$pt-dbms-sql-13-order-by$dbv41036$,
   $dbv41037$What does the ORDER BY clause do?$dbv41037$,
   $dbv41038$["Filters rows based on a condition", "Sorts the result set by one or more columns or expressions", "Groups rows sharing a common value", "Limits the number of rows returned"]$dbv41038$::jsonb,
   1, $dbv41039$ORDER BY sorts the final result set; it does not filter or group rows.$dbv41039$, 1, 0),
  ($dbv41040$tq-dbms-sql-13-order-by-2$dbv41040$, $dbv41041$pt-dbms-sql-13-order-by$dbv41041$,
   $dbv41042$In `SELECT name, price FROM products ORDER BY price;`, what sort direction is used?$dbv41042$,
   $dbv41043$["Descending, because that is the default", "Ascending, because ASC is the default when no direction is given", "Undefined, because a direction must always be specified", "It sorts alphabetically regardless of data type"]$dbv41043$::jsonb,
   1, $dbv41044$ASC is the implicit default direction whenever ASC/DESC is omitted.$dbv41044$, 1, 1),
  ($dbv41045$tq-dbms-sql-13-order-by-3$dbv41045$, $dbv41046$pt-dbms-sql-13-order-by$dbv41046$,
   $dbv41047$What does `ORDER BY 2 DESC` mean in `SELECT name, price FROM products ORDER BY 2 DESC`?$dbv41047$,
   $dbv41048$["Sort by the literal number 2", "Sort by the second column in the SELECT list (price), descending", "It causes a syntax error", "Sort by the second row only"]$dbv41048$::jsonb,
   1, $dbv41049$SQL allows ordering by the ordinal position of a column in the SELECT list; position 2 here is `price`.$dbv41049$, 1, 2),
  ($dbv41050$tq-dbms-sql-13-order-by-4$dbv41050$, $dbv41051$pt-dbms-sql-13-order-by$dbv41051$,
   $dbv41052$Why is ordering by column position (e.g. `ORDER BY 2`) generally discouraged in production code?$dbv41052$,
   $dbv41053$["It is not supported by any SQL engine", "It runs slower than naming the column", "If the SELECT list's column order changes, the sort silently changes meaning without any error", "It always sorts descending"]$dbv41053$::jsonb,
   2, $dbv41054$Positional ordering is fragile — reordering or adding columns to the SELECT list silently changes what gets sorted, with no warning.$dbv41054$, 1, 3),
  ($dbv41055$tq-dbms-sql-13-order-by-5$dbv41055$, $dbv41056$pt-dbms-sql-13-order-by$dbv41056$,
   $dbv41057$Can you ORDER BY an expression that is not a column in the table, such as `LENGTH(name)`?$dbv41057$,
   $dbv41058$["No, ORDER BY only accepts raw column names", "Yes, ORDER BY can use any valid expression, including ones not listed in SELECT", "Only if the expression is first stored as a view", "Only in MySQL, not in standard SQL"]$dbv41058$::jsonb,
   1, $dbv41059$ORDER BY accepts any expression, including expressions on columns not present in the SELECT list.$dbv41059$, 1, 4),
  ($dbv41060$tq-dbms-sql-13-order-by-6$dbv41060$, $dbv41061$pt-dbms-sql-13-order-by$dbv41061$,
   $dbv41062$What guarantee does SQL give about row order when ORDER BY is omitted?$dbv41062$,
   $dbv41063$["Rows always come back in primary key order", "Rows always come back in insertion order", "No guarantee at all \u2014 the order is unspecified and may vary", "Rows come back in alphabetical order by the first column"]$dbv41063$::jsonb,
   2, $dbv41064$Without ORDER BY, the engine is free to return rows in any order, and that order is not guaranteed to be stable across executions.$dbv41064$, 1, 5),
  ($dbv41065$tq-dbms-sql-13-order-by-7$dbv41065$, $dbv41066$pt-dbms-sql-13-order-by$dbv41066$,
   $dbv41067$Which of these correctly sorts products alphabetically by name, Z to A?$dbv41067$,
   $dbv41068$["ORDER BY name", "ORDER BY name ASC", "ORDER BY name DESC", "SORT BY name DESC"]$dbv41068$::jsonb,
   2, $dbv41069$DESC reverses the default ascending order, giving Z-to-A for text.$dbv41069$, 1, 6),
  ($dbv41070$tq-dbms-sql-13-order-by-8$dbv41070$, $dbv41071$pt-dbms-sql-13-order-by$dbv41071$,
   $dbv41072$Given `SELECT name, price, price * 0.9 AS discounted_price FROM products ORDER BY discounted_price;`, what is being sorted on?$dbv41072$,
   $dbv41073$["The original, undiscounted price", "The computed discounted_price alias", "The name column", "This query is invalid because you cannot ORDER BY an alias"]$dbv41073$::jsonb,
   1, $dbv41074$Most SQL engines allow ORDER BY to reference a SELECT-list alias, sorting by the computed expression it represents.$dbv41074$, 1, 7)
on conflict (id) do nothing;

-- 13.2 Multiple Sort Keys
with g as (select id from public.learning_grids where lower(slug) = $dbv41075$dbms-sql-tutorial$dbv41075$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41076$chapter-13-sorting-and-pagination$dbv41076$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41077$Multiple Sort Keys$dbv41077$, $dbv41078$multiple-sort-keys$dbv41078$, '', 2, 'published', true, true, $dbv41079$dbms_sql_tutorial$dbv41079$, $dbv41080$chapter-13-sorting-and-pagination/multiple-sort-keys$dbv41080$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41081$dbms_sql_tutorial$dbv41081$ and source_ref = $dbv41082$chapter-13-sorting-and-pagination/multiple-sort-keys$dbv41082$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41083$Multiple Sort Keys$dbv41083$, $dbv41084$### Definition

You can sort by more than one column by listing them, comma-separated, in `ORDER BY`. The **first** column is the primary sort key; each subsequent column is only used to break ties **within groups of equal values** from the column(s) before it. Each column can independently be `ASC` or `DESC`.

```sql
SELECT column1, column2
FROM table_name
ORDER BY column1 [ASC|DESC], column2 [ASC|DESC], ...;
```

### Worked Example

Using `products(id, name, category, price, rating)`:

```sql
INSERT INTO products (id, name, category, price, rating) VALUES
 (6, 'Phone Case', 'Electronics', 299.00, 4.1),
 (7, 'Table Lamp', 'Home', 699.00, 4.3);
```

Sort by category, then within each category by price ascending:

```sql
SELECT name, category, price
FROM products
ORDER BY category, price;
```

Result:

```
 name               | category    | price
--------------------+-------------+--------
 Phone Case         | Electronics | 299.00
 Wireless Mouse     | Electronics | 599.00
 Bluetooth Speaker  | Electronics | 1499.00
 Table Lamp         | Home        | 699.00
 Desk Lamp          | Home        | 899.00
 Notebook Set       | Stationery  | 199.00
 Yoga Mat           | Sports      | 499.00
```

Notice: `price` only sorted the rows **inside** each `category` group (e.g. Phone Case before Mouse before Speaker, all Electronics). It never reordered across categories — categories themselves are ordered alphabetically because that is the first key.

### Column Order Matters

`ORDER BY category, price` and `ORDER BY price, category` produce **completely different results**:

```sql
SELECT name, category, price FROM products ORDER BY price, category;
```

This sorts the *entire table* by price first (199, 299, 499, 599, 699, 899, 1499), and category is now irrelevant unless two rows happen to have the exact same price. The two queries answer different questions: "group by category, cheapest first within each" vs. "cheapest overall, ignoring category."

### Mixed Directions

```sql
SELECT name, category, rating
FROM products
ORDER BY category ASC, rating DESC;
```

This groups alphabetically by category, then shows the **highest-rated** product first within each category — a common "best in category" pattern.

### Key Takeaways

- **Q: What does the second column in `ORDER BY col1, col2` actually do?**
  A: It only breaks ties for rows that have identical `col1` values; it has zero effect on rows whose `col1` values already differ.
- **Q: Does swapping the column order change the result?**
  A: Yes — the sort keys are applied in strict left-to-right priority, so swapping changes which column dominates.
- **Q: Can each column have its own direction?**
  A: Yes, e.g. `ORDER BY category ASC, price DESC`.$dbv41084$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41085$dbms_sql_tutorial_seed$dbv41085$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41086$dbms_sql_tutorial_seed$dbv41086$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41087$dbms-sql-tutorial$dbv41087$),
     t as (select id from public.learning_topics where source_kind = $dbv41088$dbms_sql_tutorial$dbv41088$ and source_ref = $dbv41089$chapter-13-sorting-and-pagination/multiple-sort-keys$dbv41089$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41090$pt-dbms-sql-13-multiple-sort-keys$dbv41090$, $dbv41091$Multiple Sort Keys - Quick Test$dbv41091$, 'aptitude', 8, 8,
  $dbv41092$8 questions on Multiple Sort Keys.$dbv41092$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41093$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41093$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41094$tq-dbms-sql-13-multiple-sort-keys-1$dbv41094$, $dbv41095$pt-dbms-sql-13-multiple-sort-keys$dbv41095$,
   $dbv41096$In `ORDER BY category, price`, what role does `price` play?$dbv41096$,
   $dbv41097$["It is the primary and only sort key", "It sorts the whole table regardless of category", "It only breaks ties among rows that already share the same category", "It is ignored because only one ORDER BY key is allowed"]$dbv41097$::jsonb,
   2, $dbv41098$Secondary sort keys only apply within groups of equal values from the preceding key(s).$dbv41098$, 1, 0),
  ($dbv41099$tq-dbms-sql-13-multiple-sort-keys-2$dbv41099$, $dbv41100$pt-dbms-sql-13-multiple-sort-keys$dbv41100$,
   $dbv41101$Will `ORDER BY category, price` and `ORDER BY price, category` generally produce the same row order?$dbv41101$,
   $dbv41102$["Yes, ORDER BY is commutative regardless of column order", "No, because sort keys are applied in priority order left to right, so swapping them changes the result", "Yes, but only if both columns are numeric", "No, because SQL only allows one column in ORDER BY"]$dbv41102$::jsonb,
   1, $dbv41103$The leftmost column is the dominant sort key; swapping column order changes which one takes priority and produces a different overall order.$dbv41103$, 1, 1),
  ($dbv41104$tq-dbms-sql-13-multiple-sort-keys-3$dbv41104$, $dbv41105$pt-dbms-sql-13-multiple-sort-keys$dbv41105$,
   $dbv41106$Can different columns in a multi-key ORDER BY use different sort directions?$dbv41106$,
   $dbv41107$["No, all columns must use the same direction", "Yes, e.g. ORDER BY category ASC, rating DESC is valid", "Only the first column can specify a direction", "Only if using a stored procedure"]$dbv41107$::jsonb,
   1, $dbv41108$Each column in ORDER BY can independently specify ASC or DESC.$dbv41108$, 1, 2),
  ($dbv41109$tq-dbms-sql-13-multiple-sort-keys-4$dbv41109$, $dbv41110$pt-dbms-sql-13-multiple-sort-keys$dbv41110$,
   $dbv41111$Given rows with categories 'Electronics' and 'Home', and prices within each, what does `ORDER BY category, price DESC` do?$dbv41111$,
   $dbv41112$["Sorts all rows by price descending, ignoring category", "Groups rows alphabetically by category, then sorts each group's prices from highest to lowest", "Sorts categories in reverse alphabetical order", "Produces a syntax error because DESC must apply to all columns"]$dbv41112$::jsonb,
   1, $dbv41113$DESC applies only to the column it follows (price); category still sorts ascending (the default) as the primary key.$dbv41113$, 1, 3),
  ($dbv41114$tq-dbms-sql-13-multiple-sort-keys-5$dbv41114$, $dbv41115$pt-dbms-sql-13-multiple-sort-keys$dbv41115$,
   $dbv41116$If two products have the exact same category AND the exact same price, what determines their relative order under `ORDER BY category, price`?$dbv41116$,
   $dbv41117$["They are guaranteed to appear in name-alphabetical order", "Their order is unspecified unless an additional tiebreaker column is added", "They are guaranteed to appear in insertion order", "SQL raises an error for exact ties"]$dbv41117$::jsonb,
   1, $dbv41118$With no further tiebreaker column, rows tied on all specified sort keys have no guaranteed relative order.$dbv41118$, 1, 4),
  ($dbv41119$tq-dbms-sql-13-multiple-sort-keys-6$dbv41119$, $dbv41120$pt-dbms-sql-13-multiple-sort-keys$dbv41120$,
   $dbv41121$How many columns can appear in an ORDER BY clause?$dbv41121$,
   $dbv41122$["Exactly one", "At most two", "Any number, separated by commas", "Only as many as appear in the WHERE clause"]$dbv41122$::jsonb,
   2, $dbv41123$ORDER BY supports an arbitrary comma-separated list of sort expressions.$dbv41123$, 1, 5),
  ($dbv41124$tq-dbms-sql-13-multiple-sort-keys-7$dbv41124$, $dbv41125$pt-dbms-sql-13-multiple-sort-keys$dbv41125$,
   $dbv41126$You want the highest-rated product overall to appear first, and among equally-rated products, the cheapest first. Which ORDER BY achieves this?$dbv41126$,
   $dbv41127$["ORDER BY price ASC, rating DESC", "ORDER BY rating DESC, price ASC", "ORDER BY rating, price", "ORDER BY price, rating DESC"]$dbv41127$::jsonb,
   1, $dbv41128$Rating must be the primary (dominant) key in descending order, with price as the ascending tiebreaker.$dbv41128$, 1, 6),
  ($dbv41129$tq-dbms-sql-13-multiple-sort-keys-8$dbv41129$, $dbv41130$pt-dbms-sql-13-multiple-sort-keys$dbv41130$,
   $dbv41131$A report needs rows grouped by category (alphabetical), and within each category by rating (best first), and within equal ratings by name (alphabetical). Which clause is correct?$dbv41131$,
   $dbv41132$["ORDER BY category, rating DESC, name", "ORDER BY name, rating DESC, category", "ORDER BY category DESC, rating, name", "ORDER BY rating DESC, category, name"]$dbv41132$::jsonb,
   0, $dbv41133$The sort keys must be listed in priority order matching the requirement: category first, then rating descending, then name as final tiebreaker.$dbv41133$, 1, 7)
on conflict (id) do nothing;

-- 13.3 NULL Ordering
with g as (select id from public.learning_grids where lower(slug) = $dbv41134$dbms-sql-tutorial$dbv41134$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41135$chapter-13-sorting-and-pagination$dbv41135$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41136$NULL Ordering$dbv41136$, $dbv41137$null-ordering$dbv41137$, '', 3, 'published', true, true, $dbv41138$dbms_sql_tutorial$dbv41138$, $dbv41139$chapter-13-sorting-and-pagination/null-ordering$dbv41139$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41140$dbms_sql_tutorial$dbv41140$ and source_ref = $dbv41141$chapter-13-sorting-and-pagination/null-ordering$dbv41141$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41142$NULL Ordering$dbv41142$, $dbv41143$### Definition

`NULL` represents "unknown" or "missing," so where should it sort — before the smallest value, or after the largest? SQL standard and most engines let you control this explicitly with `NULLS FIRST` / `NULLS LAST`:

```sql
SELECT column1 FROM table_name ORDER BY column1 NULLS FIRST;
SELECT column1 FROM table_name ORDER BY column1 NULLS LAST;
```

But if you **don't** specify one, the **default behavior differs by database engine** — a genuine, well-documented dialect trap.

### The Dialect Difference

- **PostgreSQL**: default is `NULLS LAST` for `ASC`, and `NULLS FIRST` for `DESC`. (NULLs are treated as "larger than any value.")
- **MySQL**: NULLs sort as the **smallest** possible value, so in `ASC` order NULLs come **first** by default, and in `DESC` order they come **last**. MySQL does not support `NULLS FIRST/LAST` syntax directly (as of common versions) — you emulate it with `ORDER BY column IS NULL, column`.
- **SQL Server**: like MySQL, NULLs sort first in ASC order by default, and also lacks native `NULLS FIRST/LAST` syntax.

This means the **same query, same data, same ASC keyword** can put NULL rows at opposite ends of the result depending on which engine runs it.

### Worked Example (PostgreSQL)

```sql
INSERT INTO products (id, name, category, price, rating) VALUES
 (8, 'Mystery Box', 'Misc', NULL, 3.0);

SELECT name, price FROM products ORDER BY price ASC;
```

PostgreSQL result (NULL sorts LAST by default in ASC):

```
 name               | price
--------------------+--------
 Notebook Set       | 199.00
 Yoga Mat           | 499.00
 Wireless Mouse     | 599.00
 Desk Lamp          | 899.00
 Bluetooth Speaker  | 1499.00
 Mystery Box        | NULL
```

To force NULLs to the top instead:

```sql
SELECT name, price FROM products ORDER BY price ASC NULLS FIRST;
```

```
 name               | price
--------------------+--------
 Mystery Box        | NULL
 Notebook Set       | 199.00
 ...
```

On **MySQL**, the plain `ORDER BY price ASC` would instead put `Mystery Box` (NULL) **first** by default — the opposite of PostgreSQL's default — because MySQL treats NULL as the lowest value.

### Key Takeaways

- **Q: Does ASC always put NULLs last?**
  A: No — that's only PostgreSQL's default. MySQL and SQL Server put NULLs first in ASC by default.
- **Q: How do you make NULL ordering deterministic across engines?**
  A: Always specify `NULLS FIRST`/`NULLS LAST` explicitly (Postgres/standard SQL) or an equivalent `CASE`/`IS NULL` trick (MySQL/SQL Server), rather than relying on engine defaults.
- **Q: Why does this matter in practice?**
  A: Code that "works" in local testing on one engine can silently misorder NULLs when ported to another engine or a different DB version.$dbv41143$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41144$dbms_sql_tutorial_seed$dbv41144$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41145$dbms_sql_tutorial_seed$dbv41145$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41146$dbms-sql-tutorial$dbv41146$),
     t as (select id from public.learning_topics where source_kind = $dbv41147$dbms_sql_tutorial$dbv41147$ and source_ref = $dbv41148$chapter-13-sorting-and-pagination/null-ordering$dbv41148$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41149$pt-dbms-sql-13-null-ordering$dbv41149$, $dbv41150$NULL Ordering - Quick Test$dbv41150$, 'aptitude', 8, 8,
  $dbv41151$8 questions on NULL Ordering.$dbv41151$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41152$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41152$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41153$tq-dbms-sql-13-null-ordering-1$dbv41153$, $dbv41154$pt-dbms-sql-13-null-ordering$dbv41154$,
   $dbv41155$In PostgreSQL, where do NULL values sort by default under `ORDER BY column ASC`?$dbv41155$,
   $dbv41156$["First", "Last", "Randomly", "PostgreSQL raises an error if the column contains NULLs"]$dbv41156$::jsonb,
   1, $dbv41157$PostgreSQL's default treats NULL as larger than any value, so ASC order places NULLs last.$dbv41157$, 1, 0),
  ($dbv41158$tq-dbms-sql-13-null-ordering-2$dbv41158$, $dbv41159$pt-dbms-sql-13-null-ordering$dbv41159$,
   $dbv41160$In MySQL, where do NULL values sort by default under `ORDER BY column ASC`?$dbv41160$,
   $dbv41161$["Last, same as PostgreSQL", "First, because MySQL treats NULL as the smallest possible value", "MySQL always excludes NULL rows from sorted results", "It depends on the storage engine (InnoDB vs MyISAM)"]$dbv41161$::jsonb,
   1, $dbv41162$MySQL sorts NULL as the lowest value, so ascending order places NULL rows first by default — the opposite convention from PostgreSQL.$dbv41162$, 1, 1),
  ($dbv41163$tq-dbms-sql-13-null-ordering-3$dbv41163$, $dbv41164$pt-dbms-sql-13-null-ordering$dbv41164$,
   $dbv41165$Which clause lets you explicitly control NULL placement regardless of engine defaults, in standard SQL / PostgreSQL?$dbv41165$,
   $dbv41166$["ORDER BY column NULLS FIRST | NULLS LAST", "ORDER BY column SKIP NULLS", "WHERE column IS NOT NULL", "GROUP BY column HAVING NULL"]$dbv41166$::jsonb,
   0, $dbv41167$NULLS FIRST / NULLS LAST explicitly overrides whatever the engine's default NULL placement is.$dbv41167$, 1, 2),
  ($dbv41168$tq-dbms-sql-13-null-ordering-4$dbv41168$, $dbv41169$pt-dbms-sql-13-null-ordering$dbv41169$,
   $dbv41170$The same query `SELECT * FROM t ORDER BY price ASC;` is run unchanged on PostgreSQL and then on MySQL against identical data containing NULL prices. What is the likely result?$dbv41170$,
   $dbv41171$["Identical row order on both engines, since ASC is standardized", "NULL rows may appear at opposite ends of the result \u2014 last on PostgreSQL, first on MySQL", "The query fails on one of the two engines", "NULLs are automatically converted to 0 on both engines"]$dbv41171$::jsonb,
   1, $dbv41172$This is the classic cross-engine dialect trap: default NULL placement in ASC order differs between PostgreSQL (last) and MySQL (first).$dbv41172$, 1, 3),
  ($dbv41173$tq-dbms-sql-13-null-ordering-5$dbv41173$, $dbv41174$pt-dbms-sql-13-null-ordering$dbv41174$,
   $dbv41175$Why should a developer explicitly write NULLS FIRST/NULLS LAST (or an engine-specific equivalent) instead of relying on ASC/DESC defaults when a sort column can contain NULLs?$dbv41175$,
   $dbv41176$["It's required syntax and queries fail without it", "It makes the query run faster", "Default NULL placement is engine-specific, so relying on it makes behavior non-portable and easy to get wrong when porting code", "NULLS FIRST/LAST is the only way to filter out NULL rows"]$dbv41176$::jsonb,
   2, $dbv41177$Since default NULL ordering varies by database engine, being explicit avoids silent behavioral differences when code moves between engines.$dbv41177$, 1, 4),
  ($dbv41178$tq-dbms-sql-13-null-ordering-6$dbv41178$, $dbv41179$pt-dbms-sql-13-null-ordering$dbv41179$,
   $dbv41180$In PostgreSQL, what is the default NULL placement under `ORDER BY column DESC`?$dbv41180$,
   $dbv41181$["NULLS LAST", "NULLS FIRST", "NULLs are omitted from DESC sorts", "Undefined and varies per query"]$dbv41181$::jsonb,
   1, $dbv41182$PostgreSQL's rule is symmetric: DESC defaults to NULLS FIRST (consistent with treating NULL as 'largest').$dbv41182$, 1, 5),
  ($dbv41183$tq-dbms-sql-13-null-ordering-7$dbv41183$, $dbv41184$pt-dbms-sql-13-null-ordering$dbv41184$,
   $dbv41185$A common workaround to control NULL placement on an engine lacking native NULLS FIRST/LAST syntax is:$dbv41185$,
   $dbv41186$["ORDER BY column IS NULL, column", "ORDER BY NULL(column)", "GROUP BY column IS NULL", "WHERE column IS NULL ORDER BY column"]$dbv41186$::jsonb,
   0, $dbv41187$`column IS NULL` evaluates to 0/false for non-null and 1/true for null, so ordering by it first pushes NULLs to a controlled position before applying the real sort.$dbv41187$, 1, 6),
  ($dbv41188$tq-dbms-sql-13-null-ordering-8$dbv41188$, $dbv41189$pt-dbms-sql-13-null-ordering$dbv41189$,
   $dbv41190$Which statement about NULL ordering is TRUE?$dbv41190$,
   $dbv41191$["All major SQL engines agree that NULLs sort last in ascending order", "NULL ordering conventions differ across engines, so cross-engine code should specify it explicitly", "NULL values can never appear in a sortable column", "NULLS FIRST and NULLS LAST have identical effect in every engine"]$dbv41191$::jsonb,
   1, $dbv41192$Default NULL placement is a known, real dialect difference (e.g. PostgreSQL vs MySQL), which is why explicit NULLS FIRST/LAST exists.$dbv41192$, 1, 7)
on conflict (id) do nothing;

-- 13.4 LIMIT
with g as (select id from public.learning_grids where lower(slug) = $dbv41193$dbms-sql-tutorial$dbv41193$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41194$chapter-13-sorting-and-pagination$dbv41194$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41195$LIMIT$dbv41195$, $dbv41196$limit$dbv41196$, '', 4, 'published', true, true, $dbv41197$dbms_sql_tutorial$dbv41197$, $dbv41198$chapter-13-sorting-and-pagination/limit$dbv41198$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41199$dbms_sql_tutorial$dbv41199$ and source_ref = $dbv41200$chapter-13-sorting-and-pagination/limit$dbv41200$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41201$LIMIT$dbv41201$, $dbv41202$### Definition

`LIMIT` caps the number of rows returned by a query, regardless of how many rows actually matched.

```sql
SELECT column1 FROM table_name
ORDER BY ...
LIMIT n;
```

(In SQL Server the equivalent is `SELECT TOP n`, and standard SQL also offers `FETCH FIRST n ROWS ONLY` — but `LIMIT` is the common syntax in PostgreSQL, MySQL, and SQLite.)

### Worked Example

```sql
SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 3;
```

Result (top 3 most expensive):

```
 name               | price
--------------------+---------
 Bluetooth Speaker  | 1499.00
 Table Lamp         |  699.00
 Desk Lamp          |  899.00
```

(Ordered by price DESC then capped at 3 rows: Bluetooth Speaker 1499, Desk Lamp 899, Table Lamp 699 — showing the actual top 3 highest prices.)

### The Critical Pitfall: LIMIT Without ORDER BY

```sql
SELECT name, price FROM products LIMIT 3;   -- DANGEROUS
```

This returns *some* 3 rows — but **which 3** is entirely up to the engine's internal execution plan (physical storage order, index scan order, parallel worker scheduling, etc.). There is **no guarantee** it is the same 3 rows every time you run it, especially as the table grows, gets updated, is vacuumed/reorganized, or the query planner picks a different plan. This is one of the most common real-world SQL bugs: code that "seems to always return the newest rows" in dev, then breaks in production once the table is large enough for the planner to choose a different access path.

**Rule: `LIMIT` only produces a deterministic, meaningful result when paired with `ORDER BY`.**

```sql
-- Meaningful: deterministic top-3 cheapest
SELECT name, price FROM products ORDER BY price ASC LIMIT 3;

-- Meaningless: "some" 3 rows, order and identity not guaranteed
SELECT name, price FROM products LIMIT 3;
```

### LIMIT with Zero or Large Values

- `LIMIT 0` returns zero rows (sometimes used to test query validity or fetch only column metadata).
- `LIMIT` larger than the number of matching rows simply returns all matching rows — no error.

```sql
SELECT name FROM products ORDER BY price LIMIT 1000;  -- returns all 8 rows, no error
```

### Key Takeaways

- **Q: What happens if you run `SELECT * FROM products LIMIT 5` twice without ORDER BY — are the two result sets guaranteed identical?**
  A: No. Without ORDER BY, the engine is free to change which rows it returns and in what order.
- **Q: Does LIMIT error if fewer rows exist than requested?**
  A: No, it just returns however many rows are available.
- **Q: What is the fix for non-deterministic LIMIT results?**
  A: Always add an ORDER BY clause — ideally one that ends in a unique column so ties are also broken deterministically (see Stable Sorting, 13.9).$dbv41202$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41203$dbms_sql_tutorial_seed$dbv41203$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41204$dbms_sql_tutorial_seed$dbv41204$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41205$dbms-sql-tutorial$dbv41205$),
     t as (select id from public.learning_topics where source_kind = $dbv41206$dbms_sql_tutorial$dbv41206$ and source_ref = $dbv41207$chapter-13-sorting-and-pagination/limit$dbv41207$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41208$pt-dbms-sql-13-limit$dbv41208$, $dbv41209$LIMIT - Quick Test$dbv41209$, 'aptitude', 8, 8,
  $dbv41210$8 questions on LIMIT.$dbv41210$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41211$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41211$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41212$tq-dbms-sql-13-limit-1$dbv41212$, $dbv41213$pt-dbms-sql-13-limit$dbv41213$,
   $dbv41214$What does the LIMIT clause do?$dbv41214$,
   $dbv41215$["Filters rows matching a WHERE condition", "Restricts the maximum number of rows returned by the query", "Groups rows into batches of a fixed size", "Sorts rows before returning them"]$dbv41215$::jsonb,
   1, $dbv41216$LIMIT caps the row count of the result set; it does not filter, group, or sort on its own.$dbv41216$, 1, 0),
  ($dbv41217$tq-dbms-sql-13-limit-2$dbv41217$, $dbv41218$pt-dbms-sql-13-limit$dbv41218$,
   $dbv41219$What is guaranteed about the result of `SELECT name FROM products LIMIT 3;` with no ORDER BY, run twice on the same unchanged table?$dbv41219$,
   $dbv41220$["It always returns the 3 most recently inserted rows", "It always returns the same 3 rows in the same order both times", "Nothing is guaranteed \u2014 the engine may return different rows or a different order between runs", "It always returns rows in primary key order"]$dbv41220$::jsonb,
   2, $dbv41221$Without ORDER BY, LIMIT's chosen rows depend on the query plan and storage details, which are not guaranteed to be stable or repeatable.$dbv41221$, 1, 1),
  ($dbv41222$tq-dbms-sql-13-limit-3$dbv41222$, $dbv41223$pt-dbms-sql-13-limit$dbv41223$,
   $dbv41224$Why is `LIMIT` considered meaningless on its own, without ORDER BY?$dbv41224$,
   $dbv41225$["Because LIMIT is deprecated in modern SQL", "Because it always returns zero rows unless ORDER BY is present", "Because which specific rows get returned is undefined without a sort order, so the result is not reproducible", "Because LIMIT requires a WHERE clause to function"]$dbv41225$::jsonb,
   2, $dbv41226$LIMIT simply cuts off the result stream at N rows; without ORDER BY there's no defined stream to cut, so the chosen rows are arbitrary.$dbv41226$, 1, 2),
  ($dbv41227$tq-dbms-sql-13-limit-4$dbv41227$, $dbv41228$pt-dbms-sql-13-limit$dbv41228$,
   $dbv41229$What happens if you request `LIMIT 1000` but the query only matches 8 rows?$dbv41229$,
   $dbv41230$["An error is raised for requesting more rows than exist", "All 8 matching rows are returned with no error", "Exactly 1000 rows are returned, padded with NULLs", "The query silently returns zero rows"]$dbv41230$::jsonb,
   1, $dbv41231$LIMIT never pads or errors; it simply returns as many rows as are available, up to the requested cap.$dbv41231$, 1, 3),
  ($dbv41232$tq-dbms-sql-13-limit-5$dbv41232$, $dbv41233$pt-dbms-sql-13-limit$dbv41233$,
   $dbv41234$A developer writes `SELECT * FROM orders LIMIT 10;` intending to always show the 10 newest orders. What is wrong with this query?$dbv41234$,
   $dbv41235$["Nothing \u2014 LIMIT always returns the most recently inserted rows by default", "It needs an ORDER BY (e.g. by created_at DESC) because LIMIT alone does not guarantee 'newest' or any particular order", "LIMIT can only be used with UPDATE statements, not SELECT", "It should use OFFSET instead of LIMIT"]$dbv41235$::jsonb,
   1, $dbv41236$LIMIT has no inherent notion of 'newest'; without an explicit ORDER BY on a relevant column, the returned rows are arbitrary.$dbv41236$, 1, 4),
  ($dbv41237$tq-dbms-sql-13-limit-6$dbv41237$, $dbv41238$pt-dbms-sql-13-limit$dbv41238$,
   $dbv41239$What does `LIMIT 0` return?$dbv41239$,
   $dbv41240$["A syntax error", "All rows in the table", "Zero rows", "One row"]$dbv41240$::jsonb,
   2, $dbv41241$LIMIT 0 explicitly requests zero rows, sometimes used to check query validity without fetching data.$dbv41241$, 1, 5),
  ($dbv41242$tq-dbms-sql-13-limit-7$dbv41242$, $dbv41243$pt-dbms-sql-13-limit$dbv41243$,
   $dbv41244$Which query below is guaranteed to deterministically return the 5 cheapest products every time it runs (assuming price is unique)?$dbv41244$,
   $dbv41245$["SELECT name, price FROM products LIMIT 5;", "SELECT name, price FROM products ORDER BY price ASC LIMIT 5;", "SELECT name, price FROM products WHERE price > 0 LIMIT 5;", "SELECT TOP 5 name, price FROM products;  -- with no ORDER BY equivalent logic"]$dbv41245$::jsonb,
   1, $dbv41246$Only pairing LIMIT with an explicit ORDER BY on price guarantees which specific rows and in what order are returned.$dbv41246$, 1, 6),
  ($dbv41247$tq-dbms-sql-13-limit-8$dbv41247$, $dbv41248$pt-dbms-sql-13-limit$dbv41248$,
   $dbv41249$In SQL Server, which construct is the rough equivalent of PostgreSQL/MySQL's LIMIT?$dbv41249$,
   $dbv41250$["SELECT TOP n", "SELECT MAX n", "WHERE ROWNUM <= n only", "GROUP BY LIMIT n"]$dbv41250$::jsonb,
   0, $dbv41251$SQL Server uses TOP n (or the standard FETCH FIRST n ROWS ONLY) instead of the LIMIT keyword used by PostgreSQL, MySQL, and SQLite.$dbv41251$, 1, 7)
on conflict (id) do nothing;

-- 13.5 OFFSET
with g as (select id from public.learning_grids where lower(slug) = $dbv41252$dbms-sql-tutorial$dbv41252$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41253$chapter-13-sorting-and-pagination$dbv41253$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41254$OFFSET$dbv41254$, $dbv41255$offset$dbv41255$, '', 5, 'published', true, true, $dbv41256$dbms_sql_tutorial$dbv41256$, $dbv41257$chapter-13-sorting-and-pagination/offset$dbv41257$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41258$dbms_sql_tutorial$dbv41258$ and source_ref = $dbv41259$chapter-13-sorting-and-pagination/offset$dbv41259$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41260$OFFSET$dbv41260$, $dbv41261$### Definition

`OFFSET` skips the first N rows of an ordered result set before returning rows. Combined with `LIMIT`, it is the classic mechanism for **pagination**: "give me page 3, 10 rows per page."

```sql
SELECT column1 FROM table_name
ORDER BY ...
LIMIT page_size OFFSET (page_number - 1) * page_size;
```

### Worked Example

Assume `products` is ordered by `id` and we want 2 items per page.

```sql
-- Page 1: skip 0, take 2
SELECT id, name FROM products ORDER BY id LIMIT 2 OFFSET 0;
```

```
 id | name
----+-------------------
 1  | Wireless Mouse
 2  | Bluetooth Speaker
```

```sql
-- Page 2: skip 2, take 2
SELECT id, name FROM products ORDER BY id LIMIT 2 OFFSET 2;
```

```
 id | name
----+-------------
 3  | Desk Lamp
 4  | Yoga Mat
```

```sql
-- Page 3: skip 4, take 2
SELECT id, name FROM products ORDER BY id LIMIT 2 OFFSET 4;
```

```
 id | name
----+---------------
 5  | Notebook Set
 6  | Phone Case
```

This `LIMIT ... OFFSET ...` pattern is the **naive pagination** approach — simple, intuitive, and fine for small tables or early pages.

### The Performance Pitfall

OFFSET does **not** magically jump to row N. Internally, the database must still **produce and then discard** every one of the first N rows before it can start returning the rows you actually asked for. `OFFSET 4` isn't expensive on an 8-row table, but consider:

```sql
SELECT id, name FROM products ORDER BY id LIMIT 20 OFFSET 1000000;
```

To answer this, the engine typically must scan (or walk an index) through **1,000,000 rows**, throw all of them away, and only then hand you the next 20. As the offset grows, query time grows roughly linearly with it — page 1 might take 2ms, page 50,000 might take several seconds, even though both pages only return 20 rows. This is exactly the problem addressed by Keyset Pagination (13.6).

### Edge Cases

- `OFFSET` larger than the number of matching rows simply returns an empty result — no error.
- `OFFSET` without `LIMIT` is legal in most engines (skip N, return everything after) but rare in practice.
- `OFFSET` inherits all the non-determinism risk of `LIMIT` if there is no `ORDER BY` — "page 2" is meaningless without a defined order to skip through.

### Key Takeaways

- **Q: What does OFFSET do?**
  A: Skips the first N rows of the ordered result before returning the next rows.
- **Q: Why does `OFFSET 1000000` get slow?**
  A: The database must still generate and discard all 1,000,000 skipped rows internally — it can't skip directly to row 1,000,001 without doing that work.
- **Q: Is LIMIT+OFFSET the only pagination technique?**
  A: No — see Keyset Pagination (13.6) for a faster alternative at scale.$dbv41261$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41262$dbms_sql_tutorial_seed$dbv41262$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41263$dbms_sql_tutorial_seed$dbv41263$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41264$dbms-sql-tutorial$dbv41264$),
     t as (select id from public.learning_topics where source_kind = $dbv41265$dbms_sql_tutorial$dbv41265$ and source_ref = $dbv41266$chapter-13-sorting-and-pagination/offset$dbv41266$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41267$pt-dbms-sql-13-offset$dbv41267$, $dbv41268$OFFSET - Quick Test$dbv41268$, 'aptitude', 8, 8,
  $dbv41269$8 questions on OFFSET.$dbv41269$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41270$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41270$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41271$tq-dbms-sql-13-offset-1$dbv41271$, $dbv41272$pt-dbms-sql-13-offset$dbv41272$,
   $dbv41273$What does the OFFSET clause do?$dbv41273$,
   $dbv41274$["Limits the maximum number of rows returned", "Skips a specified number of rows before returning results", "Sorts rows in descending order", "Groups rows by a shared value"]$dbv41274$::jsonb,
   1, $dbv41275$OFFSET skips N rows from the (ordered) result set before the remaining rows (optionally capped by LIMIT) are returned.$dbv41275$, 1, 0),
  ($dbv41276$tq-dbms-sql-13-offset-2$dbv41276$, $dbv41277$pt-dbms-sql-13-offset$dbv41277$,
   $dbv41278$In `SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 20;`, which rows are returned?$dbv41278$,
   $dbv41279$["The first 10 rows", "Rows 21 through 30 in id order", "Rows 1 through 20", "The last 10 rows"]$dbv41279$::jsonb,
   1, $dbv41280$OFFSET 20 skips the first 20 ordered rows, then LIMIT 10 takes the next 10 — rows 21-30.$dbv41280$, 1, 1),
  ($dbv41281$tq-dbms-sql-13-offset-3$dbv41281$, $dbv41282$pt-dbms-sql-13-offset$dbv41282$,
   $dbv41283$Why does a query like `... LIMIT 20 OFFSET 1000000` tend to get slower as the offset value grows, even though it only returns 20 rows?$dbv41283$,
   $dbv41284$["Because OFFSET values greater than 100,000 are rejected by most engines", "Because the database must still generate and discard all 1,000,000 skipped rows before returning the next 20", "Because LIMIT and OFFSET cannot be used together on large tables", "Because OFFSET forces a full table lock"]$dbv41284$::jsonb,
   1, $dbv41285$The engine cannot jump directly to the offset row; it must scan through and discard all preceding rows first, so cost grows with the offset size.$dbv41285$, 1, 2),
  ($dbv41286$tq-dbms-sql-13-offset-4$dbv41286$, $dbv41287$pt-dbms-sql-13-offset$dbv41287$,
   $dbv41288$What happens if OFFSET is larger than the number of rows the query matches?$dbv41288$,
   $dbv41289$["An error is thrown", "The query returns an empty result set, with no error", "The OFFSET value is silently capped to the row count", "It returns all matching rows, ignoring OFFSET"]$dbv41289$::jsonb,
   1, $dbv41290$If there are no rows left after skipping OFFSET rows, the result is simply empty — this is not an error condition.$dbv41290$, 1, 3),
  ($dbv41291$tq-dbms-sql-13-offset-5$dbv41291$, $dbv41292$pt-dbms-sql-13-offset$dbv41292$,
   $dbv41293$Comparing page 1 (`OFFSET 0`) and page 50,000 (`OFFSET 1000000`) of the same paginated query on a large table, which statement is generally true?$dbv41293$,
   $dbv41294$["Both pages execute in roughly the same time, since each returns the same number of rows", "Page 50,000 is typically much slower, because far more rows must be scanned and discarded internally", "Page 1 is always slower because it has no rows to skip", "OFFSET performance is unrelated to how many rows are skipped"]$dbv41294$::jsonb,
   1, $dbv41295$OFFSET cost scales with the number of rows skipped, so deep pages (high OFFSET) become progressively slower on large tables.$dbv41295$, 1, 4),
  ($dbv41296$tq-dbms-sql-13-offset-6$dbv41296$, $dbv41297$pt-dbms-sql-13-offset$dbv41297$,
   $dbv41298$Is `LIMIT ... OFFSET ...` pagination meaningful without an ORDER BY clause?$dbv41298$,
   $dbv41299$["Yes, OFFSET always operates on primary key order by default", "No \u2014 without ORDER BY, there is no defined row order to skip through, so 'page 2' is not well-defined", "Yes, because OFFSET implies ORDER BY internally", "It depends only on whether an index exists on the table"]$dbv41299$::jsonb,
   1, $dbv41300$OFFSET skips rows from whatever order the result happens to be in; without ORDER BY, that order is undefined, making pagination unreliable.$dbv41300$, 1, 5),
  ($dbv41301$tq-dbms-sql-13-offset-7$dbv41301$, $dbv41302$pt-dbms-sql-13-offset$dbv41302$,
   $dbv41303$Which technique is specifically designed to avoid OFFSET's performance degradation on deep pages?$dbv41303$,
   $dbv41304$["Adding more indexes to the OFFSET column only", "Keyset (seek-method) pagination using WHERE on the last-seen sort key", "Increasing the LIMIT value", "Removing ORDER BY from the query"]$dbv41304$::jsonb,
   1, $dbv41305$Keyset pagination replaces OFFSET's skip-and-discard approach with a WHERE condition that jumps directly past already-seen rows, avoiding the scan-and-discard cost.$dbv41305$, 1, 6),
  ($dbv41306$tq-dbms-sql-13-offset-8$dbv41306$, $dbv41307$pt-dbms-sql-13-offset$dbv41307$,
   $dbv41308$In `SELECT * FROM t ORDER BY id LIMIT 5 OFFSET 5;`, if the table has only 7 rows total, how many rows are returned?$dbv41308$,
   $dbv41309$["5", "2", "0", "7"]$dbv41309$::jsonb,
   1, $dbv41310$OFFSET 5 skips the first 5 rows, leaving only 2 remaining rows (rows 6 and 7), which is fewer than the LIMIT of 5, so only those 2 are returned.$dbv41310$, 1, 7)
on conflict (id) do nothing;

-- 13.6 Keyset Pagination
with g as (select id from public.learning_grids where lower(slug) = $dbv41311$dbms-sql-tutorial$dbv41311$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41312$chapter-13-sorting-and-pagination$dbv41312$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41313$Keyset Pagination$dbv41313$, $dbv41314$keyset-pagination$dbv41314$, '', 6, 'published', true, true, $dbv41315$dbms_sql_tutorial$dbv41315$, $dbv41316$chapter-13-sorting-and-pagination/keyset-pagination$dbv41316$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41317$dbms_sql_tutorial$dbv41317$ and source_ref = $dbv41318$chapter-13-sorting-and-pagination/keyset-pagination$dbv41318$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41319$Keyset Pagination$dbv41319$, $dbv41320$### Definition

Keyset pagination (also called the **"seek method"**) is an alternative to `LIMIT ... OFFSET` that avoids scanning and discarding skipped rows. Instead of saying "skip N rows," you remember the sort-key value of the **last row seen on the previous page**, and ask the database to seek directly to rows **after** that value:

```sql
SELECT column1, ...
FROM table_name
WHERE sort_col > last_seen_value
ORDER BY sort_col
LIMIT page_size;
```

Because `sort_col` is (ideally) indexed, `WHERE sort_col > last_seen_value` can be answered directly via an index seek — the database jumps straight to the right spot in the index rather than counting through every earlier row.

### Worked Example

Using `products(id, name, price)`, paginate by `id`, 2 rows per page:

```sql
-- Page 1: no "last seen" yet, so no WHERE filter
SELECT id, name FROM products ORDER BY id LIMIT 2;
```

```
 id | name
----+-------------------
 1  | Wireless Mouse
 2  | Bluetooth Speaker
```

The client remembers `last_seen_id = 2`. For page 2:

```sql
SELECT id, name FROM products
WHERE id > 2
ORDER BY id
LIMIT 2;
```

```
 id | name
----+-------------
 3  | Desk Lamp
 4  | Yoga Mat
```

Client remembers `last_seen_id = 4`. For page 3:

```sql
SELECT id, name FROM products
WHERE id > 4
ORDER BY id
LIMIT 2;
```

```
 id | name
----+---------------
 5  | Notebook Set
 6  | Phone Case
```

Notice: no `OFFSET` was used at all — each query jumps straight past the previous page's last row using a `WHERE` condition.

### Multi-Column Keysets

If the sort key is not unique alone (e.g. sorting by `price`), the keyset condition needs a compound comparison to also break ties, typically using the primary key as a tiebreaker:

```sql
SELECT id, name, price FROM products
WHERE (price, id) > (699.00, 7)   -- "row-value" comparison (supported in PostgreSQL)
ORDER BY price, id
LIMIT 2;
```

### Trade-offs

**Advantages:** query cost stays roughly constant no matter how deep the page is — page 2 and page 50,000 cost about the same, because the engine always seeks directly via the index rather than scanning-and-discarding.

**Limitations:**
- You **cannot jump directly to an arbitrary page number** (e.g. "show me page 500") — you can only move forward/backward from a known row, because there is no "last seen value" for a page you've never visited.
- Requires an index on the sort key(s) to get the seek benefit; without one, it degrades to a scan anyway.
- Slightly more application logic: the client must track and pass along the last-seen key.

### Key Takeaways

- **Q: What does keyset pagination replace OFFSET with?**
  A: A `WHERE sort_col > last_seen_value` condition that seeks directly to the right spot.
- **Q: What is the main limitation compared to OFFSET pagination?**
  A: It can't jump to an arbitrary page number directly — only to the "next"/"previous" page relative to a known position.
- **Q: Why is it faster at scale?**
  A: It uses an index seek instead of scanning and discarding all preceding rows.$dbv41320$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41321$dbms_sql_tutorial_seed$dbv41321$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41322$dbms_sql_tutorial_seed$dbv41322$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41323$dbms-sql-tutorial$dbv41323$),
     t as (select id from public.learning_topics where source_kind = $dbv41324$dbms_sql_tutorial$dbv41324$ and source_ref = $dbv41325$chapter-13-sorting-and-pagination/keyset-pagination$dbv41325$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41326$pt-dbms-sql-13-keyset-pagination$dbv41326$, $dbv41327$Keyset Pagination - Quick Test$dbv41327$, 'aptitude', 8, 8,
  $dbv41328$8 questions on Keyset Pagination.$dbv41328$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41329$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41329$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41330$tq-dbms-sql-13-keyset-pagination-1$dbv41330$, $dbv41331$pt-dbms-sql-13-keyset-pagination$dbv41331$,
   $dbv41332$What is another common name for keyset pagination?$dbv41332$,
   $dbv41333$["The seek method", "The offset method", "The cursor scan", "The window method"]$dbv41333$::jsonb,
   0, $dbv41334$Keyset pagination is also widely known as the 'seek method' because it seeks directly to a known position via an indexed comparison.$dbv41334$, 1, 0),
  ($dbv41335$tq-dbms-sql-13-keyset-pagination-2$dbv41335$, $dbv41336$pt-dbms-sql-13-keyset-pagination$dbv41336$,
   $dbv41337$What does a keyset pagination query use instead of OFFSET to find the next page?$dbv41337$,
   $dbv41338$["A random sample of rows", "A WHERE condition comparing the sort column to the last-seen row's value", "A subquery that counts all prior rows", "A second LIMIT clause"]$dbv41338$::jsonb,
   1, $dbv41339$Keyset pagination remembers the last row's sort-key value and filters with WHERE sort_col > last_seen_value to fetch the next page.$dbv41339$, 1, 1),
  ($dbv41340$tq-dbms-sql-13-keyset-pagination-3$dbv41340$, $dbv41341$pt-dbms-sql-13-keyset-pagination$dbv41341$,
   $dbv41342$Why can keyset pagination be significantly faster than OFFSET-based pagination on large tables and deep pages?$dbv41342$,
   $dbv41343$["It avoids sorting the data entirely", "It can use an index seek to jump directly past already-seen rows instead of scanning and discarding them", "It caches all pages in memory automatically", "It replaces LIMIT with a faster keyword"]$dbv41343$::jsonb,
   1, $dbv41344$The WHERE-based seek lets the engine use an index to jump straight to the right position, whereas OFFSET must scan and discard every skipped row.$dbv41344$, 1, 2),
  ($dbv41345$tq-dbms-sql-13-keyset-pagination-4$dbv41345$, $dbv41346$pt-dbms-sql-13-keyset-pagination$dbv41346$,
   $dbv41347$What is a key limitation of keyset pagination compared to LIMIT/OFFSET?$dbv41347$,
   $dbv41348$["It cannot be combined with ORDER BY", "It cannot jump directly to an arbitrary page number (e.g. page 500) without visiting the pages before it", "It only works on tables with fewer than 1000 rows", "It requires disabling indexes on the sort column"]$dbv41348$::jsonb,
   1, $dbv41349$Because keyset pagination seeks relative to a known 'last seen' value, there's no way to jump straight to an arbitrary page without first knowing that page's starting key.$dbv41349$, 1, 3),
  ($dbv41350$tq-dbms-sql-13-keyset-pagination-5$dbv41350$, $dbv41351$pt-dbms-sql-13-keyset-pagination$dbv41351$,
   $dbv41352$When the sort key used for keyset pagination is not unique (e.g. sorting only by price, which can repeat), what should be added?$dbv41352$,
   $dbv41353$["Nothing, duplicates are automatically handled", "A unique tiebreaker column (like the primary key) included in both ORDER BY and the WHERE comparison", "A DISTINCT clause on the price column", "An OFFSET 0 clause"]$dbv41353$::jsonb,
   1, $dbv41354$A non-unique sort key needs a unique tiebreaker (typically the primary key) in a compound comparison to correctly and unambiguously determine 'rows after the last seen row'.$dbv41354$, 1, 4),
  ($dbv41355$tq-dbms-sql-13-keyset-pagination-6$dbv41355$, $dbv41356$pt-dbms-sql-13-keyset-pagination$dbv41356$,
   $dbv41357$For keyset pagination's performance benefit to actually be realized, what does the sort/filter column typically need?$dbv41357$,
   $dbv41358$["To be of type TEXT", "To be indexed", "To allow NULL values", "To be the only column in the table"]$dbv41358$::jsonb,
   1, $dbv41359$Without an index on the sort/filter column, the WHERE condition still requires a scan, losing the seek advantage.$dbv41359$, 1, 5),
  ($dbv41360$tq-dbms-sql-13-keyset-pagination-7$dbv41360$, $dbv41361$pt-dbms-sql-13-keyset-pagination$dbv41361$,
   $dbv41362$In the query `WHERE id > 4 ORDER BY id LIMIT 2`, what does the value `4` represent?$dbv41362$,
   $dbv41363$["The total number of rows in the table", "The id of the last row seen on the previous page", "The page size", "The number of pages already fetched"]$dbv41363$::jsonb,
   1, $dbv41364$4 is the last-seen id from the prior page, used as the seek point for fetching the next page.$dbv41364$, 1, 6),
  ($dbv41365$tq-dbms-sql-13-keyset-pagination-8$dbv41365$, $dbv41366$pt-dbms-sql-13-keyset-pagination$dbv41366$,
   $dbv41367$A UI needs a 'Load More' / infinite-scroll feed where users only ever move forward through results. Which pagination approach is best suited and why?$dbv41367$,
   $dbv41368$["LIMIT/OFFSET, because arbitrary page jumps are needed", "Keyset pagination, because it only needs forward-moving 'next page' access and stays fast regardless of how far the user has scrolled", "Neither approach works for infinite scroll", "GROUP BY, because it deduplicates the feed"]$dbv41368$::jsonb,
   1, $dbv41369$Infinite-scroll/load-more UIs only need sequential forward access (no arbitrary page jump), which is exactly what keyset pagination is optimized for, with no performance degradation at depth.$dbv41369$, 1, 7)
on conflict (id) do nothing;

-- 13.7 Top N Queries
with g as (select id from public.learning_grids where lower(slug) = $dbv41370$dbms-sql-tutorial$dbv41370$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41371$chapter-13-sorting-and-pagination$dbv41371$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41372$Top N Queries$dbv41372$, $dbv41373$top-n-queries$dbv41373$, '', 7, 'published', true, true, $dbv41374$dbms_sql_tutorial$dbv41374$, $dbv41375$chapter-13-sorting-and-pagination/top-n-queries$dbv41375$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41376$dbms_sql_tutorial$dbv41376$ and source_ref = $dbv41377$chapter-13-sorting-and-pagination/top-n-queries$dbv41377$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41378$Top N Queries$dbv41378$, $dbv41379$### Definition

A "Top N" query answers: "give me the N highest (or lowest) rows by some measure, across the whole result set." The standard pattern is `ORDER BY` on the measure, then `LIMIT N`:

```sql
SELECT column1, measure_column
FROM table_name
ORDER BY measure_column DESC
LIMIT n;
```

### Worked Example: Top 3 Products by Rating

```sql
SELECT name, rating
FROM products
ORDER BY rating DESC
LIMIT 3;
```

Result:

```
 name               | rating
--------------------+--------
 Yoga Mat           | 4.6
 Bluetooth Speaker  | 4.5
 Table Lamp         | 4.3
```

### Bottom N

Simply flip the direction:

```sql
SELECT name, price
FROM products
ORDER BY price ASC
LIMIT 3;   -- 3 cheapest products
```

### Handling Ties at the Cutoff

A subtlety: if the Nth and (N+1)th rows are tied on the sort value, plain `LIMIT N` arbitrarily includes one and excludes the other (whichever the engine happens to pick), which can feel wrong for a "Top N" ranking that users expect to be fair. Some engines offer `FETCH FIRST N ROWS WITH TIES` (SQL Server, and standard SQL in newer engines) to include *all* rows tied with the Nth value, potentially returning more than N rows. Plain `LIMIT` does not have this option — it always returns exactly N (or fewer) regardless of ties.

### Top N *Per Group* — A Different, Harder Problem

A plain "Top N" query answers a *global* question — the top N rows across the *entire* table. A very different and much harder question is **"Top N per group"** — for example: "show me the top 2 highest-rated products **within each category**."

```sql
-- This does NOT give top-2-per-category; it just gives the global top 2:
SELECT name, category, rating FROM products ORDER BY rating DESC LIMIT 2;
```

That query would return only 2 rows total, possibly both from the same category, which is not what "top 2 per category" means. Solving "Top N per group" correctly requires **window functions** (`ROW_NUMBER()`, `RANK()`, or `DENSE_RANK()` partitioned by category) — a technique covered later, in the chapter on window functions (Chapter 33). For now, just recognize the shape of the problem and know that plain `ORDER BY ... LIMIT N` is *not* the tool for it.

### Key Takeaways

- **Q: What is the standard pattern for a global Top N query?**
  A: `ORDER BY measure DESC LIMIT N` (or `ASC` for Bottom N).
- **Q: Does `LIMIT N` guarantee exactly N rows if there's a tie at the boundary?**
  A: No — plain LIMIT cuts off at exactly N rows even mid-tie; some engines offer `WITH TIES` to include tied rows beyond N.
- **Q: Can `ORDER BY ... LIMIT N` solve "Top N per group"?**
  A: No — that needs window functions (covered later), since LIMIT only caps the overall result, not per-group subsets.$dbv41379$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41380$dbms_sql_tutorial_seed$dbv41380$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41381$dbms_sql_tutorial_seed$dbv41381$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41382$dbms-sql-tutorial$dbv41382$),
     t as (select id from public.learning_topics where source_kind = $dbv41383$dbms_sql_tutorial$dbv41383$ and source_ref = $dbv41384$chapter-13-sorting-and-pagination/top-n-queries$dbv41384$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41385$pt-dbms-sql-13-top-n-queries$dbv41385$, $dbv41386$Top N Queries - Quick Test$dbv41386$, 'aptitude', 8, 8,
  $dbv41387$8 questions on Top N Queries.$dbv41387$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41388$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41388$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41389$tq-dbms-sql-13-top-n-queries-1$dbv41389$, $dbv41390$pt-dbms-sql-13-top-n-queries$dbv41390$,
   $dbv41391$What is the standard SQL pattern for a global 'Top N' query?$dbv41391$,
   $dbv41392$["GROUP BY measure_column LIMIT n", "ORDER BY measure_column DESC LIMIT n", "WHERE measure_column = MAX(measure_column)", "SELECT DISTINCT measure_column LIMIT n"]$dbv41392$::jsonb,
   1, $dbv41393$Ordering by the measure column descending and then limiting to N rows is the standard way to get the top N rows.$dbv41393$, 1, 0),
  ($dbv41394$tq-dbms-sql-13-top-n-queries-2$dbv41394$, $dbv41395$pt-dbms-sql-13-top-n-queries$dbv41395$,
   $dbv41396$How would you modify a Top N query to instead return the N lowest values (Bottom N)?$dbv41396$,
   $dbv41397$["Add a WHERE clause filtering out high values", "Change ORDER BY ... DESC to ORDER BY ... ASC", "Use GROUP BY instead of ORDER BY", "Bottom N queries are not possible in SQL"]$dbv41397$::jsonb,
   1, $dbv41398$Switching the sort direction to ASC returns the lowest values first, so LIMIT N then captures the Bottom N.$dbv41398$, 1, 1),
  ($dbv41399$tq-dbms-sql-13-top-n-queries-3$dbv41399$, $dbv41400$pt-dbms-sql-13-top-n-queries$dbv41400$,
   $dbv41401$If the 3rd and 4th ranked rows are tied on the sort column, what does plain `ORDER BY col DESC LIMIT 3` do?$dbv41401$,
   $dbv41402$["Automatically includes both tied rows, returning 4 total", "Returns an error due to the ambiguous tie", "Returns exactly 3 rows, arbitrarily including one of the tied rows and excluding the other", "Averages the two tied rows into one result"]$dbv41402$::jsonb,
   2, $dbv41403$Plain LIMIT always cuts off at exactly N rows; when a tie straddles the cutoff, which tied row is kept is not guaranteed.$dbv41403$, 1, 2),
  ($dbv41404$tq-dbms-sql-13-top-n-queries-4$dbv41404$, $dbv41405$pt-dbms-sql-13-top-n-queries$dbv41405$,
   $dbv41406$Which SQL feature is designed to include ALL rows tied with the Nth value, even if that means returning more than N rows?$dbv41406$,
   $dbv41407$["LIMIT WITH TIES / FETCH FIRST N ROWS WITH TIES", "GROUP BY HAVING", "DISTINCT ON", "OFFSET 0"]$dbv41407$::jsonb,
   0, $dbv41408$WITH TIES (available in SQL Server and newer standard SQL) explicitly extends the result to include all rows tied with the cutoff value.$dbv41408$, 1, 3),
  ($dbv41409$tq-dbms-sql-13-top-n-queries-5$dbv41409$, $dbv41410$pt-dbms-sql-13-top-n-queries$dbv41410$,
   $dbv41411$What does 'Top N per group' mean, e.g. 'top 2 highest-rated products per category'?$dbv41411$,
   $dbv41412$["The same thing as a global Top N query", "Finding the N highest-ranked rows within EACH distinct group/category, not just N rows overall", "A query that only works with exactly 2 categories", "A query that requires deleting all but the top N rows"]$dbv41412$::jsonb,
   1, $dbv41413$Top N per group asks for N top rows independently within every group, which is a fundamentally different (and harder) question than a single global Top N.$dbv41413$, 1, 4),
  ($dbv41414$tq-dbms-sql-13-top-n-queries-6$dbv41414$, $dbv41415$pt-dbms-sql-13-top-n-queries$dbv41415$,
   $dbv41416$Does `SELECT name, category, rating FROM products ORDER BY rating DESC LIMIT 2;` correctly return the top 2 rated products in EACH category?$dbv41416$,
   $dbv41417$["Yes, LIMIT automatically applies per category", "No \u2014 it returns only 2 rows total across the whole table, not 2 per category", "Yes, but only if the table has exactly 2 categories", "No, because ORDER BY cannot be combined with category columns"]$dbv41417$::jsonb,
   1, $dbv41418$Without partitioning logic, LIMIT applies globally to the whole result set, so this returns just the single overall top 2 rows, not 2 per group.$dbv41418$, 1, 5),
  ($dbv41419$tq-dbms-sql-13-top-n-queries-7$dbv41419$, $dbv41420$pt-dbms-sql-13-top-n-queries$dbv41420$,
   $dbv41421$What SQL feature is generally required to correctly solve a 'Top N per group' problem?$dbv41421$,
   $dbv41422$["Plain ORDER BY and LIMIT only", "Window functions such as ROW_NUMBER() or RANK() partitioned by the group column", "The DISTINCT keyword alone", "Nested LIMIT clauses"]$dbv41422$::jsonb,
   1, $dbv41423$Window functions like ROW_NUMBER()/RANK() with PARTITION BY the group column can rank rows within each group, enabling correct Top-N-per-group filtering.$dbv41423$, 1, 6),
  ($dbv41424$tq-dbms-sql-13-top-n-queries-8$dbv41424$, $dbv41425$pt-dbms-sql-13-top-n-queries$dbv41425$,
   $dbv41426$A query returns the single most expensive product using `ORDER BY price DESC LIMIT 1`. What happens if two products are tied for the highest price?$dbv41426$,
   $dbv41427$["The query returns both tied products", "The query returns exactly one of the tied products, chosen arbitrarily by the engine unless a tiebreaker or WITH TIES is used", "The query throws a runtime error", "The query returns zero rows"]$dbv41427$::jsonb,
   1, $dbv41428$Plain LIMIT 1 returns exactly one row even when there's a tie for that position; which tied row is returned is not guaranteed without an additional tiebreaker or a WITH TIES clause.$dbv41428$, 1, 7)
on conflict (id) do nothing;

-- 13.8 Pagination Performance
with g as (select id from public.learning_grids where lower(slug) = $dbv41429$dbms-sql-tutorial$dbv41429$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41430$chapter-13-sorting-and-pagination$dbv41430$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41431$Pagination Performance$dbv41431$, $dbv41432$pagination-performance$dbv41432$, '', 8, 'published', true, true, $dbv41433$dbms_sql_tutorial$dbv41433$, $dbv41434$chapter-13-sorting-and-pagination/pagination-performance$dbv41434$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41435$dbms_sql_tutorial$dbv41435$ and source_ref = $dbv41436$chapter-13-sorting-and-pagination/pagination-performance$dbv41436$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41437$Pagination Performance$dbv41437$, $dbv41438$### Definition

This topic ties together `LIMIT`/`OFFSET` (13.4-13.5) and Keyset Pagination (13.6) into a direct performance comparison, to build intuition for **why** one degrades with depth and the other doesn't.

### Why OFFSET Gets Slower With Depth

Conceptually, `LIMIT n OFFSET m` asks the database to:

1. Produce the ordered stream of matching rows.
2. Walk past (and discard) the first `m` of them.
3. Return the next `n`.

Step 2's cost is proportional to `m`. So on a `products`-like table with, say, 5,000,000 rows:

```sql
-- Page 1: cheap. Skip 0 rows.
SELECT id, name FROM products ORDER BY id LIMIT 20 OFFSET 0;

-- Page 50,000: expensive. Must walk past 999,980 rows first.
SELECT id, name FROM products ORDER BY id LIMIT 20 OFFSET 999980;
```

Even with an index on `id` making the *scan* itself efficient, the engine still has to traverse and count off nearly a million index entries before it can start emitting the 20 you want. Roughly speaking, OFFSET-based pagination cost grows **linearly (O(m))** with the offset, so time-per-page keeps climbing the deeper a user pages in — noticeable as "page 1 loads instantly, page 500 takes 3 seconds."

### Why Keyset Pagination Stays Fast

Keyset pagination instead asks:

```sql
SELECT id, name FROM products
WHERE id > 999980
ORDER BY id
LIMIT 20;
```

With an index on `id`, `WHERE id > 999980` is answered by an **index seek** directly to the right leaf position — roughly **O(log m)** to locate the start point, then a cheap sequential read of just the 20 rows needed. It costs about the same whether `999980` represents page 2 or page 50,000, because the seek doesn't need to touch any of the rows before the target — it jumps straight there via the index structure, unlike OFFSET which must pass through each one.

### Side-by-Side Intuition

| Page depth | LIMIT/OFFSET cost | Keyset cost |
|---|---|---|
| Page 1 (offset 0) | Fast | Fast |
| Page 100 (offset ~2,000) | Fast | Fast |
| Page 50,000 (offset ~1,000,000) | Slow — must scan+discard ~1M rows | Still fast — index seek, unaffected by depth |

### Practical Guidance

- For small tables, or UIs that only ever show the first few pages (typical search results), `LIMIT`/`OFFSET` is simple and perfectly fine.
- For large tables, deep pagination, infinite scroll, or APIs consumed by other systems (which often page through *everything*), prefer keyset pagination.
- Always pair pagination with `ORDER BY` on an indexed column — an unindexed sort column makes both approaches slow, since the engine must first sort the entire table before it can apply LIMIT/OFFSET or the keyset filter efficiently.

### Key Takeaways

- **Q: What is the rough time complexity of LIMIT/OFFSET as OFFSET grows?**
  A: Roughly linear (O(m)) in the offset value — cost grows with how many rows must be skipped.
- **Q: What is the rough time complexity of keyset pagination as depth grows?**
  A: Roughly constant regardless of depth (an O(log m) index seek to the start point, then a small, fixed read) — it doesn't degrade the deeper you page.
- **Q: What single factor most determines whether either pagination style performs well?**
  A: Whether the sort/filter column is indexed.$dbv41438$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41439$dbms_sql_tutorial_seed$dbv41439$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41440$dbms_sql_tutorial_seed$dbv41440$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41441$dbms-sql-tutorial$dbv41441$),
     t as (select id from public.learning_topics where source_kind = $dbv41442$dbms_sql_tutorial$dbv41442$ and source_ref = $dbv41443$chapter-13-sorting-and-pagination/pagination-performance$dbv41443$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41444$pt-dbms-sql-13-pagination-performance$dbv41444$, $dbv41445$Pagination Performance - Quick Test$dbv41445$, 'aptitude', 8, 8,
  $dbv41446$8 questions on Pagination Performance.$dbv41446$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41447$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41447$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41448$tq-dbms-sql-13-pagination-performance-1$dbv41448$, $dbv41449$pt-dbms-sql-13-pagination-performance$dbv41449$,
   $dbv41450$As the OFFSET value grows on a large table, what generally happens to LIMIT/OFFSET query time?$dbv41450$,
   $dbv41451$["It stays constant regardless of offset", "It grows, roughly in proportion to the offset value, because more rows must be scanned and discarded", "It decreases, because later pages have fewer rows left", "It becomes instant once an index exists, with no relation to offset size"]$dbv41451$::jsonb,
   1, $dbv41452$OFFSET-based pagination cost grows roughly linearly with the offset value because the engine must walk past and discard that many rows first.$dbv41452$, 1, 0),
  ($dbv41453$tq-dbms-sql-13-pagination-performance-2$dbv41453$, $dbv41454$pt-dbms-sql-13-pagination-performance$dbv41454$,
   $dbv41455$Why does keyset pagination avoid the slowdown that OFFSET experiences at deep pages?$dbv41455$,
   $dbv41456$["It disables ORDER BY entirely", "It uses a WHERE condition on an indexed sort key, allowing an index seek directly to the right position instead of scanning and discarding rows", "It caches all previous pages permanently in the database", "It limits tables to a maximum of 1000 rows"]$dbv41456$::jsonb,
   1, $dbv41457$Keyset pagination's WHERE-based seek can jump directly to the target position via an index, unlike OFFSET which must traverse every preceding row.$dbv41457$, 1, 1),
  ($dbv41458$tq-dbms-sql-13-pagination-performance-3$dbv41458$, $dbv41459$pt-dbms-sql-13-pagination-performance$dbv41459$,
   $dbv41460$What single factor most determines whether either OFFSET-based or keyset pagination performs efficiently?$dbv41460$,
   $dbv41461$["Whether the table uses a NoSQL engine", "Whether the sort/filter column has an index", "Whether the query uses SELECT *", "Whether the client caches results in the browser"]$dbv41461$::jsonb,
   1, $dbv41462$An index on the sort/filter column is what enables either an efficient scan-and-skip (OFFSET) or an efficient seek (keyset); without it, both approaches require a full sort/scan.$dbv41462$, 1, 2),
  ($dbv41463$tq-dbms-sql-13-pagination-performance-4$dbv41463$, $dbv41464$pt-dbms-sql-13-pagination-performance$dbv41464$,
   $dbv41465$For a public search UI that never shows results past page 5, which pagination approach is a reasonable, simple choice?$dbv41465$,
   $dbv41466$["Keyset pagination is mandatory in all cases", "Plain LIMIT/OFFSET is fine, since depth is always shallow and the performance downside never materializes", "Neither approach works without window functions", "Pagination should be avoided and all rows should be returned at once"]$dbv41466$::jsonb,
   1, $dbv41467$OFFSET's cost problem only shows up at deep pages; for shallow, bounded pagination it's simple and performs perfectly well.$dbv41467$, 1, 3),
  ($dbv41468$tq-dbms-sql-13-pagination-performance-5$dbv41468$, $dbv41469$pt-dbms-sql-13-pagination-performance$dbv41469$,
   $dbv41470$Roughly how does LIMIT/OFFSET query cost scale as the offset (m) grows, assuming the sort column is indexed?$dbv41470$,
   $dbv41471$["Constant time, O(1)", "Roughly linear, O(m)", "Roughly logarithmic, O(log m)", "It decreases as m increases"]$dbv41471$::jsonb,
   1, $dbv41472$The engine must still traverse and discard on the order of m rows/index entries before returning the requested page, giving roughly linear cost in m.$dbv41472$, 1, 4),
  ($dbv41473$tq-dbms-sql-13-pagination-performance-6$dbv41473$, $dbv41474$pt-dbms-sql-13-pagination-performance$dbv41474$,
   $dbv41475$An API that must page through millions of rows (e.g. a data export job) is experiencing progressively slower requests as it advances through pages using LIMIT/OFFSET. What is the most effective fix?$dbv41475$,
   $dbv41476$["Increase the page size to reduce the number of requests", "Switch to keyset (seek-method) pagination using a WHERE condition on the last-seen indexed key", "Remove the ORDER BY clause to speed up each query", "Add a second OFFSET clause"]$dbv41476$::jsonb,
   1, $dbv41477$This is precisely the scenario keyset pagination is built for — deep, sequential pagination over large datasets, where its constant-ish cost avoids OFFSET's linear blowup.$dbv41477$, 1, 5),
  ($dbv41478$tq-dbms-sql-13-pagination-performance-7$dbv41478$, $dbv41479$pt-dbms-sql-13-pagination-performance$dbv41479$,
   $dbv41480$If the column used for pagination sorting has NO index at all, what happens to both LIMIT/OFFSET and keyset pagination?$dbv41480$,
   $dbv41481$["Both remain equally fast regardless of index presence", "Both suffer, since the engine must first sort/scan the whole table before either approach can apply its cutoff or seek", "Only LIMIT/OFFSET is affected; keyset pagination is immune to missing indexes", "Only keyset pagination is affected; LIMIT/OFFSET is immune to missing indexes"]$dbv41481$::jsonb,
   1, $dbv41482$Without an index, both techniques require scanning/sorting the full table first, eliminating keyset's seek advantage and making OFFSET's linear cost even worse.$dbv41482$, 1, 6),
  ($dbv41483$tq-dbms-sql-13-pagination-performance-8$dbv41483$, $dbv41484$pt-dbms-sql-13-pagination-performance$dbv41484$,
   $dbv41485$Which best summarizes the trade-off between OFFSET pagination and keyset pagination?$dbv41485$,
   $dbv41486$["OFFSET allows arbitrary page jumps but degrades with depth; keyset stays fast at any depth but can't jump to an arbitrary page directly", "Keyset pagination is always slower but simpler to implement", "OFFSET pagination requires window functions; keyset does not", "There is no meaningful performance difference between the two approaches"]$dbv41486$::jsonb,
   0, $dbv41487$This captures the core trade-off: OFFSET's simplicity and arbitrary-page-jump ability comes at the cost of degrading performance at depth, while keyset trades away arbitrary jumps for consistently fast sequential access.$dbv41487$, 1, 7)
on conflict (id) do nothing;

-- 13.9 Stable Sorting
with g as (select id from public.learning_grids where lower(slug) = $dbv41488$dbms-sql-tutorial$dbv41488$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41489$chapter-13-sorting-and-pagination$dbv41489$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41490$Stable Sorting$dbv41490$, $dbv41491$stable-sorting$dbv41491$, '', 9, 'published', true, true, $dbv41492$dbms_sql_tutorial$dbv41492$, $dbv41493$chapter-13-sorting-and-pagination/stable-sorting$dbv41493$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41494$dbms_sql_tutorial$dbv41494$ and source_ref = $dbv41495$chapter-13-sorting-and-pagination/stable-sorting$dbv41495$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41496$Stable Sorting$dbv41496$, $dbv41497$### Definition

A sort is called **stable** if rows with **equal** sort-key values always come back in the same, repeatable relative order, run after run. Plain SQL `ORDER BY` on a column that is **not unique** does **not** guarantee this by default — when two or more rows tie on every column listed in `ORDER BY`, the relative order of those tied rows is left to the engine, and it is legal (and observed in practice) for it to differ between executions, especially after the table is updated, reorganized (e.g. `VACUUM`, `OPTIMIZE TABLE`), or the query planner picks a different execution path.

### Worked Example: The Problem

```sql
SELECT name, category FROM products ORDER BY category;
```

If three products share `category = 'Electronics'` (Wireless Mouse, Bluetooth Speaker, Phone Case), SQL guarantees they will all appear together and before/after other categories correctly — but it does **not** guarantee whether Wireless Mouse comes before or after Phone Case within that Electronics group. Run the same query again after an unrelated `UPDATE` or `VACUUM`, and their relative order **could change**, even though nothing about `category` itself changed. This is a real, observed source of "flaky" tests and inconsistent UI ordering (e.g. a paginated list where the same row appears twice across two page loads, or never appears, because the tie-order shifted between the two queries).

### The Fix: Add a Unique Tiebreaker

Append a column (or combination of columns) known to be **unique** — the primary key is the natural choice — as the final `ORDER BY` key:

```sql
SELECT name, category FROM products
ORDER BY category, id;   -- id is UNIQUE, so ties are now fully broken
```

Now every row has a completely distinct `(category, id)` pair, so there are **no remaining ties at all** — the sort becomes fully deterministic: the same query against the same data will produce the exact same row order, every single time, regardless of engine internals, plan changes, or physical storage reshuffles.

### Why This Matters for Pagination Specifically

Stable, deterministic ordering is *essential* for correct pagination (both `LIMIT/OFFSET` and Keyset). If page 1 and page 2 are fetched with two separate queries and the sort has unresolved ties, a tied row could appear on **both** pages (duplicated) or on **neither** page (skipped) if its relative position shifts between the two queries. Ending `ORDER BY` in a unique column eliminates this risk entirely — a prerequisite for trustworthy pagination.

```sql
-- Safe for pagination: fully deterministic order
SELECT id, name FROM products ORDER BY rating DESC, id ASC LIMIT 5 OFFSET 5;
```

### Key Takeaways

- **Q: Does plain ORDER BY on a non-unique column guarantee the same tie order every run?**
  A: No — ties are unresolved and their order is not guaranteed across executions.
- **Q: What is the fix to make a sort deterministic?**
  A: Add a final, guaranteed-unique column (typically the primary key) to the end of ORDER BY.
- **Q: Why does this matter beyond aesthetics?**
  A: Non-deterministic tie order in pagination can cause rows to be duplicated across pages or silently skipped entirely.$dbv41497$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41498$dbms_sql_tutorial_seed$dbv41498$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41499$dbms_sql_tutorial_seed$dbv41499$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41500$dbms-sql-tutorial$dbv41500$),
     t as (select id from public.learning_topics where source_kind = $dbv41501$dbms_sql_tutorial$dbv41501$ and source_ref = $dbv41502$chapter-13-sorting-and-pagination/stable-sorting$dbv41502$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41503$pt-dbms-sql-13-stable-sorting$dbv41503$, $dbv41504$Stable Sorting - Quick Test$dbv41504$, 'aptitude', 8, 8,
  $dbv41505$8 questions on Stable Sorting.$dbv41505$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41506$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41506$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41507$tq-dbms-sql-13-stable-sorting-1$dbv41507$, $dbv41508$pt-dbms-sql-13-stable-sorting$dbv41508$,
   $dbv41509$What does it mean for a sort to be 'stable'?$dbv41509$,
   $dbv41510$["It always sorts in ascending order", "Rows with equal sort-key values keep a consistent, repeatable relative order across runs", "It never includes NULL values", "It executes in constant time regardless of table size"]$dbv41510$::jsonb,
   1, $dbv41511$Stability specifically concerns tie-breaking: whether rows tied on the sort key(s) retain the same relative order every time the sort runs.$dbv41511$, 1, 0),
  ($dbv41512$tq-dbms-sql-13-stable-sorting-2$dbv41512$, $dbv41513$pt-dbms-sql-13-stable-sorting$dbv41513$,
   $dbv41514$Does plain `ORDER BY category` guarantee the same relative order for two rows that share the same category value, across repeated executions?$dbv41514$,
   $dbv41515$["Yes, SQL guarantees ties always resolve identically", "No \u2014 the relative order of tied rows is not guaranteed and can differ between runs", "Yes, but only in PostgreSQL", "No, because ORDER BY cannot be used on non-unique columns"]$dbv41515$::jsonb,
   1, $dbv41516$When rows tie on all specified ORDER BY columns, SQL does not guarantee any particular relative order among them, and it can vary between executions.$dbv41516$, 1, 1),
  ($dbv41517$tq-dbms-sql-13-stable-sorting-3$dbv41517$, $dbv41518$pt-dbms-sql-13-stable-sorting$dbv41518$,
   $dbv41519$What is the standard fix to make an ORDER BY clause fully deterministic?$dbv41519$,
   $dbv41520$["Add LIMIT to the query", "Append a guaranteed-unique column, such as the primary key, as the final sort key", "Use SELECT DISTINCT instead of ORDER BY", "Remove all WHERE conditions"]$dbv41520$::jsonb,
   1, $dbv41521$Adding a unique column as the last ORDER BY key eliminates any remaining ties, making the sort order fully deterministic.$dbv41521$, 1, 2),
  ($dbv41522$tq-dbms-sql-13-stable-sorting-4$dbv41522$, $dbv41523$pt-dbms-sql-13-stable-sorting$dbv41523$,
   $dbv41524$Why is deterministic (stable) ordering especially important for pagination?$dbv41524$,
   $dbv41525$["It makes queries run faster automatically", "Without it, a tied row could appear on two different pages (duplicated) or on no page at all (skipped) as the tie order shifts between queries", "It is only a cosmetic concern with no functional impact", "It is required syntax for LIMIT to work at all"]$dbv41525$::jsonb,
   1, $dbv41526$If ties are unresolved, a row's position relative to the page boundary can shift between the two separate queries that fetch page N and page N+1, causing duplication or omission.$dbv41526$, 1, 3),
  ($dbv41527$tq-dbms-sql-13-stable-sorting-5$dbv41527$, $dbv41528$pt-dbms-sql-13-stable-sorting$dbv41528$,
   $dbv41529$Which ORDER BY clause guarantees fully deterministic results when paginating a products table, assuming `id` is the unique primary key?$dbv41529$,
   $dbv41530$["ORDER BY category", "ORDER BY rating DESC", "ORDER BY rating DESC, id ASC", "ORDER BY price"]$dbv41530$::jsonb,
   2, $dbv41531$Appending the unique id column as a final tiebreaker after rating eliminates any remaining ties, making the order fully deterministic.$dbv41531$, 1, 4),
  ($dbv41532$tq-dbms-sql-13-stable-sorting-6$dbv41532$, $dbv41533$pt-dbms-sql-13-stable-sorting$dbv41533$,
   $dbv41534$What could cause the relative order of tied rows to change between two runs of the same non-deterministic ORDER BY query, even though the tied values themselves haven't changed?$dbv41534$,
   $dbv41535$["Nothing can change it if the WHERE clause is identical", "Physical storage reorganization (e.g. VACUUM), updates to other rows, or the query planner choosing a different execution plan", "Changing the SELECT list column order", "Only changing the database's time zone setting"]$dbv41535$::jsonb,
   1, $dbv41536$Because tie order isn't guaranteed, anything that affects physical row layout or plan choice (VACUUM, updates, planner changes) can shift the observed order of tied rows.$dbv41536$, 1, 5),
  ($dbv41537$tq-dbms-sql-13-stable-sorting-7$dbv41537$, $dbv41538$pt-dbms-sql-13-stable-sorting$dbv41538$,
   $dbv41539$A test suite asserts `SELECT name FROM products ORDER BY category` always returns rows within the 'Electronics' group in a specific fixed order, and the test occasionally fails intermittently. What is the most likely root cause?$dbv41539$,
   $dbv41540$["The category column contains a typo", "ORDER BY category alone doesn't guarantee tie order among same-category rows, so the test is relying on unstable, undefined behavior", "The test is checking the wrong table", "SQL always sorts alphabetically by name automatically"]$dbv41540$::jsonb,
   1, $dbv41541$This is a classic flaky-test symptom caused by relying on unresolved tie order; adding a unique tiebreaker column to ORDER BY would fix it.$dbv41541$, 1, 6),
  ($dbv41542$tq-dbms-sql-13-stable-sorting-8$dbv41542$, $dbv41543$pt-dbms-sql-13-stable-sorting$dbv41543$,
   $dbv41544$If every row in a query result already has a fully unique combination of ORDER BY column values (e.g. ORDER BY id where id is a primary key), is the sort guaranteed to be deterministic?$dbv41544$,
   $dbv41545$["No, uniqueness has no effect on determinism", "Yes \u2014 with no ties possible at all, there is nothing left for the engine to order arbitrarily, so the result is fully deterministic", "Only if the table has fewer than 1000 rows", "Only in MySQL, not other engines"]$dbv41545$::jsonb,
   1, $dbv41546$When the ORDER BY key(s) are unique across all rows, no ties exist, so there is no ambiguity left for the engine to resolve non-deterministically.$dbv41546$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 14: SQL Functions
-- ---------------------------------------------------------------------------
-- 14.1 Aggregate Functions
with g as (select id from public.learning_grids where lower(slug) = $dbv41547$dbms-sql-tutorial$dbv41547$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41548$chapter-14-sql-functions$dbv41548$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41549$Aggregate Functions$dbv41549$, $dbv41550$aggregate-functions$dbv41550$, '', 1, 'published', true, true, $dbv41551$dbms_sql_tutorial$dbv41551$, $dbv41552$chapter-14-sql-functions/aggregate-functions$dbv41552$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41553$dbms_sql_tutorial$dbv41553$ and source_ref = $dbv41554$chapter-14-sql-functions/aggregate-functions$dbv41554$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41555$Aggregate Functions$dbv41555$, $dbv41556$### What Is an Aggregate Function?

An **aggregate function** takes many rows as input and collapses them into a **single value**. Where a scalar function (like `UPPER()`) transforms one row at a time, an aggregate function looks across a whole set of rows and produces one summary number, date, or string.

The five core aggregate functions in standard SQL are:

| Function | Purpose |
|---|---|
| `COUNT()` | how many rows (or non-NULL values) |
| `SUM()` | total of a numeric column |
| `AVG()` | arithmetic mean of a numeric column |
| `MIN()` | smallest value |
| `MAX()` | largest value |

This chapter looks at each of these individually, applied to an **entire table** (no `GROUP BY` yet — that's Chapter 15, where aggregates are computed per-group instead of per-table).

### Running Example

Every example in this chapter uses one `orders` table:

```sql
CREATE TABLE orders (
  id            INT PRIMARY KEY,
  customer_name VARCHAR(50),
  amount        DECIMAL(10,2),
  order_date    DATE,
  status        VARCHAR(20)
);

INSERT INTO orders VALUES
  (1, 'Alice',   250.00, '2024-01-05', 'completed'),
  (2, 'Bob',     NULL,   '2024-01-07', 'pending'),
  (3, 'Alice',   400.00, '2024-02-10', 'completed'),
  (4, 'Charlie', 150.00, '2024-02-15', 'cancelled'),
  (5, 'Bob',     300.00, '2024-03-01', 'completed');
```

Row 2 (Bob) has a `NULL` amount — this matters a lot for what follows.

### A Quick Look at All Five Together

```sql
SELECT COUNT(*)      AS total_rows,
       COUNT(amount) AS priced_rows,
       SUM(amount)   AS total_amount,
       AVG(amount)   AS avg_amount,
       MIN(amount)   AS smallest,
       MAX(amount)   AS largest
FROM orders;
```

Result:

| total_rows | priced_rows | total_amount | avg_amount | smallest | largest |
|---|---|---|---|---|---|
| 5 | 4 | 1100.00 | 275.00 | 150.00 | 400.00 |

Notice `total_rows` (5) and `priced_rows` (4) differ — Bob's `NULL` amount is not counted by `COUNT(amount)`.

### The Golden Rule: Aggregates Ignore NULLs

`SUM`, `AVG`, `MIN`, `MAX`, and `COUNT(column)` all **skip `NULL` values** when doing their calculation. A `NULL` is treated as "unknown/absent," not as zero. Only `COUNT(*)` is different — it counts rows regardless of whether any column is `NULL`, because it isn't looking at a particular column's value at all.

This is why `AVG(amount)` above is `275.00` (1100 / **4**), not `220.00` (1100 / 5). If NULL were treated as zero, the average would be pulled down — SQL deliberately avoids that.

### Aggregates Return One Row

Without `GROUP BY`, an aggregate query collapses the *entire* result set into a single output row, no matter how many rows fed into it. You cannot mix an aggregate with a plain (non-aggregated, non-grouped) column in the same `SELECT` — `SELECT customer_name, SUM(amount) FROM orders` without a `GROUP BY` is invalid in standard SQL (some dialects like SQLite/MySQL will silently pick an arbitrary row, which is a trap, not a feature). Chapter 15 covers the correct way to mix a grouping column with aggregates.

### Key Takeaways / Interview Q&A

**Q: What's the difference between a scalar function and an aggregate function?**
A: A scalar function operates on one row's value and returns one value per row (e.g. `UPPER(name)`). An aggregate function operates across many rows and returns one value for the whole set (or group).

**Q: Do aggregate functions count NULLs?**
A: No — except `COUNT(*)`, every aggregate function ignores `NULL` values in its input column.

**Q: Can `SUM()` return NULL?**
A: Yes — if every value in the column is `NULL` (or the table/group has zero rows), `SUM()` returns `NULL`, not `0`.

**Q: Name the five core aggregate functions.**
A: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.$dbv41556$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41557$dbms_sql_tutorial_seed$dbv41557$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41558$dbms_sql_tutorial_seed$dbv41558$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41559$dbms-sql-tutorial$dbv41559$),
     t as (select id from public.learning_topics where source_kind = $dbv41560$dbms_sql_tutorial$dbv41560$ and source_ref = $dbv41561$chapter-14-sql-functions/aggregate-functions$dbv41561$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41562$pt-dbms-sql-14-aggregate-functions$dbv41562$, $dbv41563$Aggregate Functions - Quick Test$dbv41563$, 'aptitude', 8, 8,
  $dbv41564$8 questions on Aggregate Functions.$dbv41564$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41565$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41565$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41566$tq-dbms-sql-14-aggregate-functions-1$dbv41566$, $dbv41567$pt-dbms-sql-14-aggregate-functions$dbv41567$,
   $dbv41568$What is the defining characteristic of an aggregate function in SQL?$dbv41568$,
   $dbv41569$["It transforms a single row's value into another value", "It collapses multiple rows into a single summary value", "It only works on VARCHAR columns", "It must always be used with a WHERE clause"]$dbv41569$::jsonb,
   1, $dbv41570$Aggregate functions (COUNT, SUM, AVG, MIN, MAX) take a set of rows and produce one summary value, unlike scalar functions which act row by row.$dbv41570$, 1, 0),
  ($dbv41571$tq-dbms-sql-14-aggregate-functions-2$dbv41571$, $dbv41572$pt-dbms-sql-14-aggregate-functions$dbv41572$,
   $dbv41573$Which of these is NOT one of the five core aggregate functions?$dbv41573$,
   $dbv41574$["COUNT", "AVG", "ROUND", "MAX"]$dbv41574$::jsonb,
   2, $dbv41575$ROUND is a numeric (scalar) function, not an aggregate function. COUNT, AVG, and MAX are aggregates.$dbv41575$, 1, 1),
  ($dbv41576$tq-dbms-sql-14-aggregate-functions-3$dbv41576$, $dbv41577$pt-dbms-sql-14-aggregate-functions$dbv41577$,
   $dbv41578$Using the orders table (amounts: 250, NULL, 400, 150, 300), what does a plain aggregate query without GROUP BY return?$dbv41578$,
   $dbv41579$["One row per customer", "One row per status", "A single summary row for the whole table", "Five rows, one per order"]$dbv41579$::jsonb,
   2, $dbv41580$Without GROUP BY, aggregate functions collapse the entire result set into one row.$dbv41580$, 1, 2),
  ($dbv41581$tq-dbms-sql-14-aggregate-functions-4$dbv41581$, $dbv41582$pt-dbms-sql-14-aggregate-functions$dbv41582$,
   $dbv41583$Which statement about NULL and aggregate functions is TRUE?$dbv41583$,
   $dbv41584$["SUM() treats NULL as 0 when adding values", "All aggregate functions, including COUNT(*), ignore NULL rows entirely", "SUM, AVG, MIN, and MAX ignore NULL values in the target column; only COUNT(*) does not look at a specific column's NULL status", "AVG() divides by the total row count including NULLs"]$dbv41584$::jsonb,
   2, $dbv41585$COUNT(*), SUM, AVG, MIN, MAX all skip NULLs when evaluating a column, but COUNT(*) counts every row regardless of column contents since it isn't examining a column value.$dbv41585$, 1, 3),
  ($dbv41586$tq-dbms-sql-14-aggregate-functions-5$dbv41586$, $dbv41587$pt-dbms-sql-14-aggregate-functions$dbv41587$,
   $dbv41588$What does SUM(amount) return if every row in a table has a NULL amount?$dbv41588$,
   $dbv41589$["0", "NULL", "An error", "-1"]$dbv41589$::jsonb,
   1, $dbv41590$If there are no non-NULL values to sum, SUM() returns NULL, not zero.$dbv41590$, 1, 4),
  ($dbv41591$tq-dbms-sql-14-aggregate-functions-6$dbv41591$, $dbv41592$pt-dbms-sql-14-aggregate-functions$dbv41592$,
   $dbv41593$Which SQL statement is invalid (or dialect-risky) in standard SQL because it mixes an aggregate with a non-aggregated column without GROUP BY?$dbv41593$,
   $dbv41594$["SELECT COUNT(*) FROM orders;", "SELECT SUM(amount) FROM orders;", "SELECT customer_name, SUM(amount) FROM orders;", "SELECT MAX(amount) FROM orders;"]$dbv41594$::jsonb,
   2, $dbv41595$Mixing a plain column (customer_name) with an aggregate (SUM) without a GROUP BY is invalid in standard SQL; some dialects allow it but return an arbitrary row for customer_name, which is unreliable.$dbv41595$, 1, 5),
  ($dbv41596$tq-dbms-sql-14-aggregate-functions-7$dbv41596$, $dbv41597$pt-dbms-sql-14-aggregate-functions$dbv41597$,
   $dbv41598$Why is AVG(amount) on the example orders table 275.00 rather than 220.00?$dbv41598$,
   $dbv41599$["Because AVG rounds up automatically", "Because AVG divides the sum (1100) by the count of non-NULL values (4), not by the total row count (5)", "Because the NULL row is treated as amount = 0", "Because AVG excludes the highest and lowest values"]$dbv41599$::jsonb,
   1, $dbv41600$1100 / 4 = 275.00. AVG ignores the NULL row entirely rather than treating it as zero or including it in the row count.$dbv41600$, 1, 6),
  ($dbv41601$tq-dbms-sql-14-aggregate-functions-8$dbv41601$, $dbv41602$pt-dbms-sql-14-aggregate-functions$dbv41602$,
   $dbv41603$Which pair of functions from the core five works meaningfully on non-numeric columns such as VARCHAR or DATE?$dbv41603$,
   $dbv41604$["SUM and AVG", "COUNT(*) and SUM", "MIN and MAX", "AVG and COUNT(column)"]$dbv41604$::jsonb,
   2, $dbv41605$MIN and MAX can operate on dates (earliest/latest) and strings (alphabetically first/last), while SUM and AVG only make sense on numeric data.$dbv41605$, 1, 7)
on conflict (id) do nothing;

-- 14.2 COUNT
with g as (select id from public.learning_grids where lower(slug) = $dbv41606$dbms-sql-tutorial$dbv41606$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41607$chapter-14-sql-functions$dbv41607$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41608$COUNT$dbv41608$, $dbv41609$count$dbv41609$, '', 2, 'published', true, true, $dbv41610$dbms_sql_tutorial$dbv41610$, $dbv41611$chapter-14-sql-functions/count$dbv41611$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41612$dbms_sql_tutorial$dbv41612$ and source_ref = $dbv41613$chapter-14-sql-functions/count$dbv41613$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41614$COUNT$dbv41614$, $dbv41615$### The Three Faces of COUNT

`COUNT` is the most-used aggregate function, but it has three distinct forms that behave differently. Using the running `orders` table:

```sql
id | customer_name | amount | order_date | status
 1 | Alice         | 250.00 | 2024-01-05 | completed
 2 | Bob           | NULL   | 2024-01-07 | pending
 3 | Alice         | 400.00 | 2024-02-10 | completed
 4 | Charlie       | 150.00 | 2024-02-15 | cancelled
 5 | Bob           | 300.00 | 2024-03-01 | completed
```

#### 1. `COUNT(*)` — counts all rows

```sql
SELECT COUNT(*) FROM orders;
-- 5
```

`COUNT(*)` counts every row in the result set, **regardless of NULLs in any column**. It doesn't look at a specific column's value at all — it just counts rows.

#### 2. `COUNT(column)` — counts non-NULL values in that column

```sql
SELECT COUNT(amount) FROM orders;
-- 4
```

Bob's order has `amount = NULL`, so it is excluded. `COUNT(amount)` answers "how many rows *have* a value for this column?"

```sql
SELECT COUNT(status) FROM orders;
-- 5   (status is never NULL here)
```

#### 3. `COUNT(DISTINCT column)` — counts distinct non-NULL values

```sql
SELECT COUNT(DISTINCT customer_name) FROM orders;
-- 3   (Alice, Bob, Charlie — Alice and Bob each appear twice but count once)

SELECT COUNT(DISTINCT status) FROM orders;
-- 3   (completed, pending, cancelled)
```

`COUNT(DISTINCT ...)` first removes duplicate values, then removes `NULL`s, then counts what's left.

### Why This Distinction Matters

These three answer genuinely different business questions:

| Question | Query |
|---|---|
| "How many orders exist in total?" | `COUNT(*)` |
| "How many orders have a recorded amount?" | `COUNT(amount)` |
| "How many distinct customers placed orders?" | `COUNT(DISTINCT customer_name)` |

Mixing them up is a classic reporting bug — e.g. using `COUNT(email)` when you meant `COUNT(*)` will silently under-report if any emails are `NULL`.

### COUNT with WHERE

`COUNT` combines naturally with `WHERE` to count a filtered subset:

```sql
SELECT COUNT(*) FROM orders WHERE status = 'completed';
-- 3
```

### COUNT(1) vs COUNT(*)

You may see `COUNT(1)` in older code — it behaves identically to `COUNT(*)` in every modern engine (both count rows, not a column named `1`). There's no meaningful performance difference in modern query planners; `COUNT(*)` is the clearer, more idiomatic choice.

### Edge Cases

- `COUNT(*)` on an empty table returns `0`, never `NULL` (unlike `SUM`/`AVG`/`MIN`/`MAX`, which return `NULL` on an empty set).
- `COUNT(DISTINCT col1, col2)` (counting distinct *combinations* of two columns) is supported in some dialects (e.g. MySQL, PostgreSQL) but not universally standard.
- `COUNT(NULL)` — literally counting the constant `NULL` — always returns `0`.

### Key Takeaways / Interview Q&A

**Q: What's the difference between COUNT(*) and COUNT(column)?**
A: `COUNT(*)` counts all rows regardless of NULLs; `COUNT(column)` counts only the rows where that column is non-NULL.

**Q: What does COUNT(DISTINCT column) do?**
A: Counts the number of unique, non-NULL values in that column.

**Q: Does COUNT() ever return NULL?**
A: No. Unlike SUM/AVG/MIN/MAX, COUNT always returns a number — 0 if there's nothing to count, never NULL.

**Q: Is COUNT(1) faster than COUNT(*)?**
A: No, they're equivalent in every modern SQL engine; it's purely a style preference (and COUNT(*) is generally preferred as the standard idiom).$dbv41615$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41616$dbms_sql_tutorial_seed$dbv41616$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41617$dbms_sql_tutorial_seed$dbv41617$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41618$dbms-sql-tutorial$dbv41618$),
     t as (select id from public.learning_topics where source_kind = $dbv41619$dbms_sql_tutorial$dbv41619$ and source_ref = $dbv41620$chapter-14-sql-functions/count$dbv41620$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41621$pt-dbms-sql-14-count$dbv41621$, $dbv41622$COUNT - Quick Test$dbv41622$, 'aptitude', 8, 8,
  $dbv41623$8 questions on COUNT.$dbv41623$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41624$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41624$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41625$tq-dbms-sql-14-count-1$dbv41625$, $dbv41626$pt-dbms-sql-14-count$dbv41626$,
   $dbv41627$Given the orders table (5 rows, 1 with amount = NULL), what does COUNT(*) return?$dbv41627$,
   $dbv41628$["4", "5", "NULL", "1"]$dbv41628$::jsonb,
   1, $dbv41629$COUNT(*) counts every row regardless of NULLs in any column, so it returns 5.$dbv41629$, 1, 0),
  ($dbv41630$tq-dbms-sql-14-count-2$dbv41630$, $dbv41631$pt-dbms-sql-14-count$dbv41631$,
   $dbv41632$Given the orders table (5 rows, Bob's amount is NULL, the other 4 amounts are non-NULL), what does COUNT(amount) return?$dbv41632$,
   $dbv41633$["5", "4", "0", "NULL"]$dbv41633$::jsonb,
   1, $dbv41634$COUNT(column) only counts non-NULL values in that column. One row has a NULL amount, so 4 of the 5 rows are counted.$dbv41634$, 1, 1),
  ($dbv41635$tq-dbms-sql-14-count-3$dbv41635$, $dbv41636$pt-dbms-sql-14-count$dbv41636$,
   $dbv41637$What does COUNT(DISTINCT customer_name) return for orders placed by Alice, Bob, Alice, Charlie, Bob?$dbv41637$,
   $dbv41638$["5", "2", "3", "0"]$dbv41638$::jsonb,
   2, $dbv41639$There are 3 distinct customer names (Alice, Bob, Charlie); duplicates are counted once each.$dbv41639$, 1, 2),
  ($dbv41640$tq-dbms-sql-14-count-4$dbv41640$, $dbv41641$pt-dbms-sql-14-count$dbv41641$,
   $dbv41642$What does COUNT(*) return when run against a completely empty table?$dbv41642$,
   $dbv41643$["NULL", "0", "An error", "-1"]$dbv41643$::jsonb,
   1, $dbv41644$COUNT(*) always returns a number, 0 for an empty table — unlike SUM/AVG/MIN/MAX which return NULL when there's nothing to aggregate.$dbv41644$, 1, 3),
  ($dbv41645$tq-dbms-sql-14-count-5$dbv41645$, $dbv41646$pt-dbms-sql-14-count$dbv41646$,
   $dbv41647$A report needs 'how many customer orders have a recorded amount value?'. Which query answers that correctly?$dbv41647$,
   $dbv41648$["SELECT COUNT(*) FROM orders;", "SELECT COUNT(amount) FROM orders;", "SELECT COUNT(DISTINCT amount) FROM orders;", "SELECT SUM(amount) FROM orders;"]$dbv41648$::jsonb,
   1, $dbv41649$COUNT(amount) counts rows where amount is not NULL, which is exactly 'orders with a recorded amount'.$dbv41649$, 1, 4),
  ($dbv41650$tq-dbms-sql-14-count-6$dbv41650$, $dbv41651$pt-dbms-sql-14-count$dbv41651$,
   $dbv41652$What is the practical difference between COUNT(1) and COUNT(*) in modern SQL engines?$dbv41652$,
   $dbv41653$["COUNT(1) is significantly faster because it avoids reading columns", "COUNT(1) counts only rows where the first column is non-NULL", "They behave identically \u2014 both count all rows regardless of NULLs", "COUNT(1) is invalid syntax in standard SQL"]$dbv41653$::jsonb,
   2, $dbv41654$COUNT(1) and COUNT(*) are functionally identical in every modern query engine; there is no meaningful difference.$dbv41654$, 1, 5),
  ($dbv41655$tq-dbms-sql-14-count-7$dbv41655$, $dbv41656$pt-dbms-sql-14-count$dbv41656$,
   $dbv41657$What does COUNT(DISTINCT status) return for the statuses: completed, pending, completed, cancelled, completed?$dbv41657$,
   $dbv41658$["5", "3", "1", "4"]$dbv41658$::jsonb,
   1, $dbv41659$There are 3 distinct status values (completed, pending, cancelled) among the 5 rows.$dbv41659$, 1, 6),
  ($dbv41660$tq-dbms-sql-14-count-8$dbv41660$, $dbv41661$pt-dbms-sql-14-count$dbv41661$,
   $dbv41662$What does the literal expression COUNT(NULL) evaluate to?$dbv41662$,
   $dbv41663$["NULL", "0", "1", "An error"]$dbv41663$::jsonb,
   1, $dbv41664$COUNT(NULL) counts occurrences of a constant NULL expression per row; since NULL is never counted, the result is always 0.$dbv41664$, 1, 7)
on conflict (id) do nothing;

-- 14.3 SUM
with g as (select id from public.learning_grids where lower(slug) = $dbv41665$dbms-sql-tutorial$dbv41665$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41666$chapter-14-sql-functions$dbv41666$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41667$SUM$dbv41667$, $dbv41668$sum$dbv41668$, '', 3, 'published', true, true, $dbv41669$dbms_sql_tutorial$dbv41669$, $dbv41670$chapter-14-sql-functions/sum$dbv41670$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41671$dbms_sql_tutorial$dbv41671$ and source_ref = $dbv41672$chapter-14-sql-functions/sum$dbv41672$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41673$SUM$dbv41673$, $dbv41674$### SUM: Totaling a Numeric Column

`SUM(column)` adds up all the (non-NULL) numeric values in a column across the rows in scope.

```sql
SELECT SUM(amount) FROM orders;
```

Using the running example (amounts: 250.00, NULL, 400.00, 150.00, 300.00):

```
SUM(amount)
------------
    1100.00
```

`SUM` adds `250 + 400 + 150 + 300 = 1100`. Bob's `NULL` amount is **skipped**, not treated as `0`.

### SUM Ignores NULLs — It Does Not Zero Them

This is worth repeating because it's a common source of bugs: if you expected `NULL` to act like `0` in a total, you'd get `1100` either way in this example (since adding 0 changes nothing) — but the distinction becomes visible when you divide, as in `AVG`, or when *every* value is `NULL`:

```sql
SELECT SUM(amount) FROM orders WHERE customer_name = 'NoOneReal';
-- NULL   (no matching rows at all → NULL, not 0)
```

If your application logic expects a number and might get `NULL` back (e.g. "total sales today" when there were no sales), wrap it:

```sql
SELECT COALESCE(SUM(amount), 0) AS total_amount FROM orders WHERE order_date = CURRENT_DATE;
```

### SUM with a Filter

```sql
SELECT SUM(amount) FROM orders WHERE status = 'completed';
-- 250.00 + 400.00 + 300.00 = 950.00
```

### SUM of an Expression

`SUM` can take any numeric expression, not just a bare column:

```sql
SELECT SUM(amount * 0.18) AS total_tax FROM orders;
-- SUM of 18% tax on each non-NULL amount
```

### Data Type of the Result

The result type of `SUM` generally widens to avoid overflow: summing an `INT` column typically yields a `BIGINT`-class result in many engines, and summing a `DECIMAL(10,2)` column stays decimal. This matters for very large tables where a plain `INT` sum could overflow — the engine handles this automatically in most dialects, but it's worth being aware of when working with huge counters.

### Edge Cases

- `SUM()` over zero rows (or all-`NULL` values) returns `NULL`, not `0`.
- `SUM(DISTINCT column)` is legal — it sums only the distinct values first (rarely useful, but valid: `SUM(DISTINCT amount)` on `250, 400, 150, 300` — no duplicates here, so it'd still be `1100`, but if `Alice` had two `250.00` orders, `SUM(DISTINCT amount)` would only add `250` once).
- Summing mixed positive/negative values (e.g. a `transactions` table with debits as negative) works exactly like ordinary arithmetic addition.

### Key Takeaways / Interview Q&A

**Q: Does SUM() treat NULL as zero?**
A: No — SUM ignores NULL values entirely; they don't reduce or contribute to the total.

**Q: What does SUM() return over an empty result set?**
A: NULL, not 0. Use `COALESCE(SUM(x), 0)` if you need a guaranteed numeric zero.

**Q: Can you SUM an expression instead of a raw column?**
A: Yes — `SUM(amount * 0.18)` or any numeric expression works.

**Q: What does SUM(DISTINCT column) do?**
A: Removes duplicate values first, then sums what remains — different from a plain SUM whenever the column has repeated values.$dbv41674$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41675$dbms_sql_tutorial_seed$dbv41675$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41676$dbms_sql_tutorial_seed$dbv41676$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41677$dbms-sql-tutorial$dbv41677$),
     t as (select id from public.learning_topics where source_kind = $dbv41678$dbms_sql_tutorial$dbv41678$ and source_ref = $dbv41679$chapter-14-sql-functions/sum$dbv41679$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41680$pt-dbms-sql-14-sum$dbv41680$, $dbv41681$SUM - Quick Test$dbv41681$, 'aptitude', 8, 8,
  $dbv41682$8 questions on SUM.$dbv41682$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41683$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41683$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41684$tq-dbms-sql-14-sum-1$dbv41684$, $dbv41685$pt-dbms-sql-14-sum$dbv41685$,
   $dbv41686$Given order amounts 250.00, NULL, 400.00, 150.00, 300.00, what does SUM(amount) return?$dbv41686$,
   $dbv41687$["1100.00", "1350.00", "220.00", "NULL"]$dbv41687$::jsonb,
   0, $dbv41688$SUM ignores the NULL row and adds 250 + 400 + 150 + 300 = 1100.00.$dbv41688$, 1, 0),
  ($dbv41689$tq-dbms-sql-14-sum-2$dbv41689$, $dbv41690$pt-dbms-sql-14-sum$dbv41690$,
   $dbv41691$What does SUM(amount) return when filtered to a customer with zero matching orders?$dbv41691$,
   $dbv41692$["0", "NULL", "An error", "-1"]$dbv41692$::jsonb,
   1, $dbv41693$SUM over an empty set (no rows, or all values NULL) returns NULL, not zero.$dbv41693$, 1, 1),
  ($dbv41694$tq-dbms-sql-14-sum-3$dbv41694$, $dbv41695$pt-dbms-sql-14-sum$dbv41695$,
   $dbv41696$Which expression guarantees a numeric 0 instead of NULL when there are no rows to sum?$dbv41696$,
   $dbv41697$["SUM(amount)", "SUM(amount) + 0", "COALESCE(SUM(amount), 0)", "SUM(DISTINCT amount)"]$dbv41697$::jsonb,
   2, $dbv41698$COALESCE replaces a NULL result with the fallback value 0, which plain arithmetic on NULL cannot do (NULL + 0 is still NULL).$dbv41698$, 1, 2),
  ($dbv41699$tq-dbms-sql-14-sum-4$dbv41699$, $dbv41700$pt-dbms-sql-14-sum$dbv41700$,
   $dbv41701$Given completed orders with amounts 250.00, 400.00, and 300.00 (the cancelled/pending orders excluded by a WHERE clause), what does SUM(amount) return?$dbv41701$,
   $dbv41702$["950.00", "1100.00", "1050.00", "NULL"]$dbv41702$::jsonb,
   0, $dbv41703$250 + 400 + 300 = 950.00 for the filtered set of completed orders.$dbv41703$, 1, 3),
  ($dbv41704$tq-dbms-sql-14-sum-5$dbv41704$, $dbv41705$pt-dbms-sql-14-sum$dbv41705$,
   $dbv41706$Why might SUM(amount) + 0 fail to produce a fallback zero when there are no matching rows?$dbv41706$,
   $dbv41707$["Because SUM never returns NULL", "Because any arithmetic expression involving NULL evaluates to NULL, so NULL + 0 is still NULL", "Because addition with NULL always errors out", "Because SUM always returns 0 for empty sets already"]$dbv41707$::jsonb,
   1, $dbv41708$NULL propagates through arithmetic — NULL + 0 = NULL, which is why COALESCE (not plain addition) is needed to supply a real fallback.$dbv41708$, 1, 4),
  ($dbv41709$tq-dbms-sql-14-sum-6$dbv41709$, $dbv41710$pt-dbms-sql-14-sum$dbv41710$,
   $dbv41711$What does SUM(DISTINCT amount) compute differently from a plain SUM(amount)?$dbv41711$,
   $dbv41712$["It sums the absolute values only", "It first removes duplicate values, then sums the remaining distinct values", "It sums only the top value", "It has no difference in any case"]$dbv41712$::jsonb,
   1, $dbv41713$SUM(DISTINCT ...) deduplicates the column's values before adding them, so repeated identical amounts are only counted once.$dbv41713$, 1, 5),
  ($dbv41714$tq-dbms-sql-14-sum-7$dbv41714$, $dbv41715$pt-dbms-sql-14-sum$dbv41715$,
   $dbv41716$If two of Alice's orders both had amount = 250.00, how would SUM(DISTINCT amount) differ from SUM(amount) across all orders?$dbv41716$,
   $dbv41717$["They would always be identical regardless of duplicates", "SUM(DISTINCT amount) would count the repeated 250.00 only once, producing a smaller total than SUM(amount)", "SUM(DISTINCT amount) would throw an error", "SUM(DISTINCT amount) would double the repeated value"]$dbv41717$::jsonb,
   1, $dbv41718$DISTINCT removes duplicate values before summing, so a repeated amount contributes only once to SUM(DISTINCT amount), making it potentially smaller than the plain sum.$dbv41718$, 1, 6),
  ($dbv41719$tq-dbms-sql-14-sum-8$dbv41719$, $dbv41720$pt-dbms-sql-14-sum$dbv41720$,
   $dbv41721$What generally happens to the result data type when SUM() is applied to a large INT column?$dbv41721$,
   $dbv41722$["It stays INT and may silently overflow with no protection", "Most engines widen the result type (e.g. to a BIGINT-class type) to reduce overflow risk", "SUM automatically converts INT to VARCHAR", "SUM refuses to run on INT columns"]$dbv41722$::jsonb,
   1, $dbv41723$To avoid overflow on large totals, most SQL engines widen the aggregate result type for SUM on integer columns.$dbv41723$, 1, 7)
on conflict (id) do nothing;

-- 14.4 AVG
with g as (select id from public.learning_grids where lower(slug) = $dbv41724$dbms-sql-tutorial$dbv41724$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41725$chapter-14-sql-functions$dbv41725$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41726$AVG$dbv41726$, $dbv41727$avg$dbv41727$, '', 4, 'published', true, true, $dbv41728$dbms_sql_tutorial$dbv41728$, $dbv41729$chapter-14-sql-functions/avg$dbv41729$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41730$dbms_sql_tutorial$dbv41730$ and source_ref = $dbv41731$chapter-14-sql-functions/avg$dbv41731$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41732$AVG$dbv41732$, $dbv41733$### AVG: The Arithmetic Mean

`AVG(column)` computes the average (arithmetic mean) of the non-NULL numeric values in a column: sum of the values divided by the *count of non-NULL values* (not the total row count).

```sql
SELECT AVG(amount) FROM orders;
```

With amounts `250.00, NULL, 400.00, 150.00, 300.00`:

```
AVG(amount)
------------
     275.00
```

`AVG` computes `(250 + 400 + 150 + 300) / 4 = 1100 / 4 = 275.00`. The denominator is **4** (non-NULL values), not **5** (total rows) and not **6** as if NULL contributed 0 to a sum divided by all rows.

### AVG Is Not the Same as SUM / COUNT(*)

A very common mistake is assuming `AVG(x) = SUM(x) / COUNT(*)`. That's only true when there are **no NULLs**. The correct identity is:

```
AVG(x) = SUM(x) / COUNT(x)
```

Verify: `SUM(amount) = 1100`, `COUNT(amount) = 4` → `1100 / 4 = 275`. If you (incorrectly) divided by `COUNT(*) = 5`, you'd get `220`, which is wrong.

```sql
-- These two produce the SAME correct result:
SELECT AVG(amount) FROM orders;                          -- 275.00
SELECT SUM(amount) / COUNT(amount) FROM orders;           -- 275.00

-- This produces a DIFFERENT (incorrect, if you wanted a true average) result:
SELECT SUM(amount) / COUNT(*) FROM orders;                 -- 220.00
```

### AVG with a Filter

```sql
SELECT AVG(amount) FROM orders WHERE status = 'completed';
-- (250 + 400 + 300) / 3 = 950 / 3 = 316.666...
```

### Integer Division Trap

In some dialects, `AVG` on an integer column still correctly returns a decimal/float result (most engines special-case `AVG` to avoid the integer-division truncation problem). However, if you *manually* compute `SUM(int_col) / COUNT(int_col)` where both are integer types, some dialects (e.g. older MySQL configurations, or explicit integer casts) may perform **integer division** and truncate the decimal part — this is the same integer-vs-decimal-division nuance discussed for the `/` operator in Chapter 8 (Data Types / NULL semantics). Casting one operand to a decimal/float avoids it: `SUM(amount) / COUNT(amount)::DECIMAL`.

### Edge Cases

- `AVG()` over zero rows or all-NULL values returns `NULL`, not `0` or an error.
- `AVG(DISTINCT column)` averages only the distinct non-NULL values.
- Averaging a column with extreme outliers behaves exactly like ordinary arithmetic mean — SQL has no built-in median or mode function in the standard aggregate set (some dialects add `PERCENTILE_CONT` for median-like calculations, which is beyond this chapter's scope).

### Key Takeaways / Interview Q&A

**Q: What does AVG() divide by — total rows or non-NULL values?**
A: The count of non-NULL values in that column, i.e. `AVG(x) = SUM(x) / COUNT(x)`, not `SUM(x) / COUNT(*)`.

**Q: If a column has 10 rows but 3 are NULL, what's the denominator when computing AVG?**
A: 7 — only the non-NULL values are averaged.

**Q: What does AVG() return over an empty set?**
A: NULL.

**Q: Why might manually writing SUM(col)/COUNT(col) give a wrong, truncated result?**
A: If both operands are integer types, some dialects perform integer division and truncate the fractional part — cast to decimal/float first.$dbv41733$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41734$dbms_sql_tutorial_seed$dbv41734$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41735$dbms_sql_tutorial_seed$dbv41735$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41736$dbms-sql-tutorial$dbv41736$),
     t as (select id from public.learning_topics where source_kind = $dbv41737$dbms_sql_tutorial$dbv41737$ and source_ref = $dbv41738$chapter-14-sql-functions/avg$dbv41738$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41739$pt-dbms-sql-14-avg$dbv41739$, $dbv41740$AVG - Quick Test$dbv41740$, 'aptitude', 8, 8,
  $dbv41741$8 questions on AVG.$dbv41741$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41742$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41742$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41743$tq-dbms-sql-14-avg-1$dbv41743$, $dbv41744$pt-dbms-sql-14-avg$dbv41744$,
   $dbv41745$Given order amounts 250.00, NULL, 400.00, 150.00, 300.00, what does AVG(amount) return?$dbv41745$,
   $dbv41746$["220.00", "275.00", "250.00", "1100.00"]$dbv41746$::jsonb,
   1, $dbv41747$AVG divides the sum of non-NULL values (1100) by the count of non-NULL values (4), giving 275.00 — not by the total row count of 5.$dbv41747$, 1, 0),
  ($dbv41748$tq-dbms-sql-14-avg-2$dbv41748$, $dbv41749$pt-dbms-sql-14-avg$dbv41749$,
   $dbv41750$What is the correct identity for how AVG(x) is computed?$dbv41750$,
   $dbv41751$["AVG(x) = SUM(x) / COUNT(*)", "AVG(x) = SUM(x) / COUNT(x)", "AVG(x) = MAX(x) - MIN(x)", "AVG(x) = COUNT(x) / SUM(x)"]$dbv41751$::jsonb,
   1, $dbv41752$AVG divides the sum of non-NULL values by the count of non-NULL values in that same column, not by the total row count.$dbv41752$, 1, 1),
  ($dbv41753$tq-dbms-sql-14-avg-3$dbv41753$, $dbv41754$pt-dbms-sql-14-avg$dbv41754$,
   $dbv41755$What does AVG(amount) return for the completed orders only, with amounts 250.00, 400.00, and 300.00?$dbv41755$,
   $dbv41756$["316.67 (approximately)", "950.00", "300.00", "250.00"]$dbv41756$::jsonb,
   0, $dbv41757$(250 + 400 + 300) / 3 = 950 / 3 = 316.666..., which rounds to about 316.67.$dbv41757$, 1, 2),
  ($dbv41758$tq-dbms-sql-14-avg-4$dbv41758$, $dbv41759$pt-dbms-sql-14-avg$dbv41759$,
   $dbv41760$A table has 5 amount values: 100, NULL, NULL, 200, 300. What does AVG(amount) return?$dbv41760$,
   $dbv41761$["120.00", "200.00", "600.00", "150.00"]$dbv41761$::jsonb,
   1, $dbv41762$Sum of non-NULL values = 100+200+300 = 600, count of non-NULL values = 3, so 600/3 = 200.00.$dbv41762$, 1, 3),
  ($dbv41763$tq-dbms-sql-14-avg-5$dbv41763$, $dbv41764$pt-dbms-sql-14-avg$dbv41764$,
   $dbv41765$What does AVG(amount) return over a filtered query that matches zero rows?$dbv41765$,
   $dbv41766$["0", "NULL", "1", "An error"]$dbv41766$::jsonb,
   1, $dbv41767$With no rows (and therefore no non-NULL values), AVG returns NULL, just like SUM.$dbv41767$, 1, 4),
  ($dbv41768$tq-dbms-sql-14-avg-6$dbv41768$, $dbv41769$pt-dbms-sql-14-avg$dbv41769$,
   $dbv41770$Why is manually computing SUM(int_col) / COUNT(int_col) sometimes riskier than just using AVG(int_col)?$dbv41770$,
   $dbv41771$["SUM and COUNT can never be combined in one expression", "If both operands remain integer types, some dialects perform integer division and truncate the decimal part, unlike AVG which is designed to avoid this", "COUNT always returns a decimal, causing a type mismatch", "SUM(int_col) always returns NULL for integer columns"]$dbv41771$::jsonb,
   1, $dbv41772$AVG is built to return a proper fractional result, but a manual division of two integer-typed expressions can trigger integer division truncation in some dialects — the same nuance covered for the / operator in Chapter 8.$dbv41772$, 1, 5),
  ($dbv41773$tq-dbms-sql-14-avg-7$dbv41773$, $dbv41774$pt-dbms-sql-14-avg$dbv41774$,
   $dbv41775$Given amounts 250.00, 250.00, and 400.00, what would AVG(DISTINCT amount) return (compared to a plain AVG)?$dbv41775$,
   $dbv41776$["325.00 (average of 250 and 400 only, duplicate removed)", "300.00 (average of all three values including the duplicate)", "The same value as AVG(amount) always", "An error, since DISTINCT cannot be used with AVG"]$dbv41776$::jsonb,
   0, $dbv41777$AVG(DISTINCT amount) removes the duplicate 250.00 first, leaving 250 and 400, so the average is (250+400)/2 = 325.00 — different from the plain AVG of 300.00.$dbv41777$, 1, 6),
  ($dbv41778$tq-dbms-sql-14-avg-8$dbv41778$, $dbv41779$pt-dbms-sql-14-avg$dbv41779$,
   $dbv41780$Which statement about AVG() and outliers/median is TRUE in standard SQL?$dbv41780$,
   $dbv41781$["AVG() automatically excludes the highest and lowest values like a trimmed mean", "AVG() computes the ordinary arithmetic mean and has no built-in awareness of medians or outlier trimming", "AVG() always returns the median value of the column", "AVG() requires a GROUP BY clause to function at all"]$dbv41781$::jsonb,
   1, $dbv41782$AVG is a plain arithmetic mean; it is sensitive to outliers and standard SQL has no separate built-in median function among the core five aggregates (some dialects add specialized functions like PERCENTILE_CONT for that).$dbv41782$, 1, 7)
on conflict (id) do nothing;

-- 14.5 MIN
with g as (select id from public.learning_grids where lower(slug) = $dbv41783$dbms-sql-tutorial$dbv41783$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41784$chapter-14-sql-functions$dbv41784$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41785$MIN$dbv41785$, $dbv41786$min$dbv41786$, '', 5, 'published', true, true, $dbv41787$dbms_sql_tutorial$dbv41787$, $dbv41788$chapter-14-sql-functions/min$dbv41788$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41789$dbms_sql_tutorial$dbv41789$ and source_ref = $dbv41790$chapter-14-sql-functions/min$dbv41790$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41791$MIN$dbv41791$, $dbv41792$### MIN: The Smallest Value

`MIN(column)` returns the smallest non-NULL value in a column. It works on numbers, but also on dates, times, and strings — anywhere an ordering ("less than") is defined.

```sql
SELECT MIN(amount) FROM orders;
```

With amounts `250.00, NULL, 400.00, 150.00, 300.00`:

```
MIN(amount)
------------
     150.00
```

`NULL` is ignored, as always — `MIN` never returns `NULL` unless *every* value is `NULL` or the set is empty.

### MIN on Dates

```sql
SELECT MIN(order_date) FROM orders;
-- 2024-01-05   (the earliest order)
```

This is one of the most common real-world uses of `MIN`: "when was the first order placed?", "what's the earliest hire date?", "what's the oldest unresolved ticket?".

### MIN on Strings

```sql
SELECT MIN(customer_name) FROM orders;
-- 'Alice'   (alphabetically first among Alice, Bob, Alice, Charlie, Bob)
```

String comparison is lexicographic (dictionary-order), following the column's collation — by default this is typically case-sensitive or case-insensitive depending on the database's collation settings, which can make `'Apple'` sort before or after `'apple'` depending on configuration.

### MIN with a Filter

```sql
SELECT MIN(amount) FROM orders WHERE status = 'completed';
-- MIN(250.00, 400.00, 300.00) = 250.00
```

### MIN vs a Sort-and-Limit Approach

`MIN(amount)` is equivalent in *result* to `SELECT amount FROM orders ORDER BY amount ASC LIMIT 1`, but conceptually different: `MIN` returns just the value, is a true aggregate (collapses to one row, works cleanly with `GROUP BY` per group in Chapter 15), and typically lets the engine use an index more efficiently for a single global minimum. The `ORDER BY ... LIMIT 1` approach is more flexible when you also need *other columns from that same row* (e.g. "which customer placed the cheapest order?") — `MIN` alone can't tell you which row it came from.

### Edge Cases

- `MIN()` over an empty result set (or an all-NULL column) returns `NULL`.
- `MIN(DISTINCT column)` is legal but pointless — the minimum of a set of distinct values is identical to the minimum of the same set with duplicates, so `DISTINCT` never changes a `MIN` (or `MAX`) result.
- Comparing `MIN` across mixed-case strings, or across different DATE/TIME types, depends entirely on the database's collation and type rules — always confirm behavior on your specific engine when precision matters.

### Key Takeaways / Interview Q&A

**Q: Does MIN() work on non-numeric columns?**
A: Yes — MIN works on any type with a defined ordering: numbers, dates, times, and strings (using lexicographic/collation-based ordering).

**Q: What does MIN() return on an empty set?**
A: NULL.

**Q: Does MIN(DISTINCT column) differ from MIN(column)?**
A: No — removing duplicates never changes which value is smallest, so DISTINCT has no effect on MIN (or MAX).

**Q: If you need MIN(amount) AND the customer who placed that order, can MIN alone give you both?**
A: No — MIN only returns the value itself. To also see other columns from that row, use ORDER BY ... LIMIT 1, or join back to filter WHERE amount = (SELECT MIN(amount) ...).$dbv41792$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41793$dbms_sql_tutorial_seed$dbv41793$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41794$dbms_sql_tutorial_seed$dbv41794$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41795$dbms-sql-tutorial$dbv41795$),
     t as (select id from public.learning_topics where source_kind = $dbv41796$dbms_sql_tutorial$dbv41796$ and source_ref = $dbv41797$chapter-14-sql-functions/min$dbv41797$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41798$pt-dbms-sql-14-min$dbv41798$, $dbv41799$MIN - Quick Test$dbv41799$, 'aptitude', 8, 8,
  $dbv41800$8 questions on MIN.$dbv41800$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41801$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41801$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41802$tq-dbms-sql-14-min-1$dbv41802$, $dbv41803$pt-dbms-sql-14-min$dbv41803$,
   $dbv41804$Given order amounts 250.00, NULL, 400.00, 150.00, 300.00, what does MIN(amount) return?$dbv41804$,
   $dbv41805$["150.00", "0.00", "NULL", "250.00"]$dbv41805$::jsonb,
   0, $dbv41806$MIN ignores the NULL and finds the smallest of the remaining non-NULL values: 150.00.$dbv41806$, 1, 0),
  ($dbv41807$tq-dbms-sql-14-min-2$dbv41807$, $dbv41808$pt-dbms-sql-14-min$dbv41808$,
   $dbv41809$What does MIN(order_date) conceptually return?$dbv41809$,
   $dbv41810$["The most recent order date", "The earliest order date", "Today's date", "The average order date"]$dbv41810$::jsonb,
   1, $dbv41811$MIN on a date column returns the chronologically earliest (smallest) date value.$dbv41811$, 1, 1),
  ($dbv41812$tq-dbms-sql-14-min-3$dbv41812$, $dbv41813$pt-dbms-sql-14-min$dbv41813$,
   $dbv41814$Can MIN() be used on a VARCHAR (string) column?$dbv41814$,
   $dbv41815$["No, MIN only works on numeric types", "Yes, it returns the alphabetically first value based on the column's collation", "Yes, but it always returns an error for text data", "Only if the strings are numeric digits"]$dbv41815$::jsonb,
   1, $dbv41816$MIN works on any type with a defined ordering, including strings, returning the lexicographically smallest value per the column's collation.$dbv41816$, 1, 2),
  ($dbv41817$tq-dbms-sql-14-min-4$dbv41817$, $dbv41818$pt-dbms-sql-14-min$dbv41818$,
   $dbv41819$Given the names Alice, Bob, Alice, Charlie, Bob, what does MIN(customer_name) return?$dbv41819$,
   $dbv41820$["'Bob'", "'Charlie'", "'Alice'", "NULL"]$dbv41820$::jsonb,
   2, $dbv41821$'Alice' is alphabetically first among the distinct and repeated names present.$dbv41821$, 1, 3),
  ($dbv41822$tq-dbms-sql-14-min-5$dbv41822$, $dbv41823$pt-dbms-sql-14-min$dbv41823$,
   $dbv41824$What does MIN(amount) return over a query that matches zero rows?$dbv41824$,
   $dbv41825$["0", "NULL", "-1", "An error"]$dbv41825$::jsonb,
   1, $dbv41826$Like other aggregates, MIN returns NULL when there are no rows (or no non-NULL values) to evaluate.$dbv41826$, 1, 4),
  ($dbv41827$tq-dbms-sql-14-min-6$dbv41827$, $dbv41828$pt-dbms-sql-14-min$dbv41828$,
   $dbv41829$How does MIN(DISTINCT amount) compare to MIN(amount) on the same column?$dbv41829$,
   $dbv41830$["MIN(DISTINCT amount) is always smaller", "MIN(DISTINCT amount) is always larger", "They always produce the identical result, since removing duplicates never changes which value is smallest", "MIN(DISTINCT amount) throws a syntax error"]$dbv41830$::jsonb,
   2, $dbv41831$DISTINCT removes duplicate values but never changes the smallest value present, so MIN(DISTINCT x) always equals MIN(x).$dbv41831$, 1, 5),
  ($dbv41832$tq-dbms-sql-14-min-7$dbv41832$, $dbv41833$pt-dbms-sql-14-min$dbv41833$,
   $dbv41834$You need both the minimum order amount AND the name of the customer who placed that order. Why can't MIN(amount) alone answer this?$dbv41834$,
   $dbv41835$["MIN(amount) is always NULL when combined with a customer name", "MIN only returns the scalar minimum value, with no way to also retrieve other columns from the row it came from", "MIN cannot be used at all without GROUP BY", "MIN requires a JOIN to compute at all"]$dbv41835$::jsonb,
   1, $dbv41836$MIN collapses to a single value with no reference back to its source row; to get sibling columns you need ORDER BY ... LIMIT 1 or a subquery filter like WHERE amount = (SELECT MIN(amount) ...).$dbv41836$, 1, 6),
  ($dbv41837$tq-dbms-sql-14-min-8$dbv41837$, $dbv41838$pt-dbms-sql-14-min$dbv41838$,
   $dbv41839$Why might MIN(amount) be preferred over SELECT amount FROM orders ORDER BY amount ASC LIMIT 1 when you only need the minimum value itself?$dbv41839$,
   $dbv41840$["MIN cannot be combined with WHERE, so it's always simpler", "MIN is a true aggregate that collapses to one row directly, often lets the engine use an index efficiently, and composes naturally with GROUP BY for per-group minimums", "ORDER BY ... LIMIT 1 is not valid SQL syntax", "MIN always returns multiple rows, unlike ORDER BY ... LIMIT 1"]$dbv41840$::jsonb,
   1, $dbv41841$MIN is conceptually and often practically more efficient for the value alone, and unlike a LIMIT 1 approach, it works cleanly per group once GROUP BY is introduced.$dbv41841$, 1, 7)
on conflict (id) do nothing;

-- 14.6 MAX
with g as (select id from public.learning_grids where lower(slug) = $dbv41842$dbms-sql-tutorial$dbv41842$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41843$chapter-14-sql-functions$dbv41843$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41844$MAX$dbv41844$, $dbv41845$max$dbv41845$, '', 6, 'published', true, true, $dbv41846$dbms_sql_tutorial$dbv41846$, $dbv41847$chapter-14-sql-functions/max$dbv41847$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41848$dbms_sql_tutorial$dbv41848$ and source_ref = $dbv41849$chapter-14-sql-functions/max$dbv41849$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41850$MAX$dbv41850$, $dbv41851$### MAX: The Largest Value

`MAX(column)` is the mirror image of `MIN` — it returns the largest non-NULL value in a column, and works on numbers, dates, times, and strings.

```sql
SELECT MAX(amount) FROM orders;
```

With amounts `250.00, NULL, 400.00, 150.00, 300.00`:

```
MAX(amount)
------------
     400.00
```

### MAX on Dates

```sql
SELECT MAX(order_date) FROM orders;
-- 2024-03-01   (the most recent order)
```

Common real-world uses: "what's the most recent login?", "what's the latest invoice date?", "when did this customer last order?".

### MAX on Strings

```sql
SELECT MAX(customer_name) FROM orders;
-- 'Charlie'   (alphabetically last among Alice, Bob, Alice, Charlie, Bob)
```

### MAX and MIN Together

A very common pattern is fetching both bounds of a range in one query:

```sql
SELECT MIN(amount) AS cheapest, MAX(amount) AS priciest FROM orders;
-- cheapest = 150.00, priciest = 400.00

SELECT MIN(order_date) AS first_order, MAX(order_date) AS last_order FROM orders;
-- first_order = 2024-01-05, last_order = 2024-03-01
```

This is often used to compute a range/spread:

```sql
SELECT MAX(amount) - MIN(amount) AS amount_range FROM orders;
-- 400.00 - 150.00 = 250.00
```

### MAX with a Filter

```sql
SELECT MAX(amount) FROM orders WHERE status = 'completed';
-- MAX(250.00, 400.00, 300.00) = 400.00
```

### Edge Cases

- `MAX()` over an empty result set (or an all-NULL column) returns `NULL`, never an error and never a sentinel like `0` or `-1`.
- Like `MIN`, `MAX(DISTINCT column)` always equals `MAX(column)` — removing duplicates never changes the largest value.
- Comparing `MAX` on mixed-precision numeric types (e.g. comparing a `FLOAT` column with values very close together) can be subject to floating-point representation quirks; using `DECIMAL` for money (as in this chapter's `orders.amount`) avoids that entirely — this is why financial data should virtually never be stored as `FLOAT`.

### Key Takeaways / Interview Q&A

**Q: What does MAX() return on an empty set?**
A: NULL — same as MIN, SUM, and AVG (only COUNT returns 0 instead of NULL for an empty set).

**Q: Can MAX() find the "most recent" date?**
A: Yes — since later dates are "larger" in chronological ordering, MAX(date_column) returns the most recent date.

**Q: How would you compute the range (spread) between the highest and lowest order amount in one query?**
A: `SELECT MAX(amount) - MIN(amount) FROM orders;`

**Q: Does DISTINCT ever change the result of MAX or MIN?**
A: No — MAX(DISTINCT x) and MIN(DISTINCT x) are always identical to MAX(x) and MIN(x) respectively, since deduplication cannot change which value is largest or smallest.$dbv41851$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41852$dbms_sql_tutorial_seed$dbv41852$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41853$dbms_sql_tutorial_seed$dbv41853$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41854$dbms-sql-tutorial$dbv41854$),
     t as (select id from public.learning_topics where source_kind = $dbv41855$dbms_sql_tutorial$dbv41855$ and source_ref = $dbv41856$chapter-14-sql-functions/max$dbv41856$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41857$pt-dbms-sql-14-max$dbv41857$, $dbv41858$MAX - Quick Test$dbv41858$, 'aptitude', 8, 8,
  $dbv41859$8 questions on MAX.$dbv41859$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41860$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41860$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41861$tq-dbms-sql-14-max-1$dbv41861$, $dbv41862$pt-dbms-sql-14-max$dbv41862$,
   $dbv41863$Given order amounts 250.00, NULL, 400.00, 150.00, 300.00, what does MAX(amount) return?$dbv41863$,
   $dbv41864$["300.00", "400.00", "NULL", "1100.00"]$dbv41864$::jsonb,
   1, $dbv41865$MAX ignores the NULL and finds the largest of the non-NULL values: 400.00.$dbv41865$, 1, 0),
  ($dbv41866$tq-dbms-sql-14-max-2$dbv41866$, $dbv41867$pt-dbms-sql-14-max$dbv41867$,
   $dbv41868$What does MAX(order_date) conceptually return?$dbv41868$,
   $dbv41869$["The earliest order date", "The most recent (latest) order date", "The current date", "A random order date"]$dbv41869$::jsonb,
   1, $dbv41870$Later dates are chronologically 'larger', so MAX(date) returns the most recent date in the column.$dbv41870$, 1, 1),
  ($dbv41871$tq-dbms-sql-14-max-3$dbv41871$, $dbv41872$pt-dbms-sql-14-max$dbv41872$,
   $dbv41873$Given the names Alice, Bob, Alice, Charlie, Bob, what does MAX(customer_name) return?$dbv41873$,
   $dbv41874$["'Alice'", "'Bob'", "'Charlie'", "NULL"]$dbv41874$::jsonb,
   2, $dbv41875$'Charlie' is alphabetically last among the names present.$dbv41875$, 1, 2),
  ($dbv41876$tq-dbms-sql-14-max-4$dbv41876$, $dbv41877$pt-dbms-sql-14-max$dbv41877$,
   $dbv41878$What single query correctly computes the range between the highest and lowest order amounts (150.00 to 400.00)?$dbv41878$,
   $dbv41879$["SELECT AVG(amount) FROM orders;", "SELECT MAX(amount) - MIN(amount) FROM orders;", "SELECT MAX(amount) + MIN(amount) FROM orders;", "SELECT COUNT(amount) FROM orders;"]$dbv41879$::jsonb,
   1, $dbv41880$MAX(amount) - MIN(amount) = 400.00 - 150.00 = 250.00, the spread between the largest and smallest values.$dbv41880$, 1, 3),
  ($dbv41881$tq-dbms-sql-14-max-5$dbv41881$, $dbv41882$pt-dbms-sql-14-max$dbv41882$,
   $dbv41883$What does MAX(amount) return over a query that matches zero rows?$dbv41883$,
   $dbv41884$["0", "NULL", "-1", "An error"]$dbv41884$::jsonb,
   1, $dbv41885$Like MIN, SUM, and AVG, MAX returns NULL when there is nothing to aggregate, rather than a placeholder value.$dbv41885$, 1, 4),
  ($dbv41886$tq-dbms-sql-14-max-6$dbv41886$, $dbv41887$pt-dbms-sql-14-max$dbv41887$,
   $dbv41888$How does MAX(DISTINCT amount) compare to MAX(amount) on the same column?$dbv41888$,
   $dbv41889$["They always produce the identical result", "MAX(DISTINCT amount) is always smaller because duplicates are removed", "MAX(DISTINCT amount) is always larger", "MAX(DISTINCT amount) is invalid syntax"]$dbv41889$::jsonb,
   0, $dbv41890$Removing duplicate values never changes which value is the largest, so MAX(DISTINCT x) always equals MAX(x).$dbv41890$, 1, 5),
  ($dbv41891$tq-dbms-sql-14-max-7$dbv41891$, $dbv41892$pt-dbms-sql-14-max$dbv41892$,
   $dbv41893$Why is storing monetary amounts as FLOAT (rather than DECIMAL) risky when using MAX or other comparisons?$dbv41893$,
   $dbv41894$["FLOAT columns cannot be used with aggregate functions at all", "Floating-point representation can introduce tiny rounding errors that make comparisons between very close values unreliable", "MAX always rounds FLOAT values down to the nearest integer", "FLOAT columns are automatically converted to strings before comparison"]$dbv41894$::jsonb,
   1, $dbv41895$Floating-point binary representation cannot exactly store many decimal fractions, which can cause subtly incorrect comparisons — DECIMAL avoids this and is the standard choice for money.$dbv41895$, 1, 6),
  ($dbv41896$tq-dbms-sql-14-max-8$dbv41896$, $dbv41897$pt-dbms-sql-14-max$dbv41897$,
   $dbv41898$For completed orders with amounts 250.00, 400.00, and 300.00, what does MAX(amount) - MIN(amount) evaluate to?$dbv41898$,
   $dbv41899$["150.00", "50.00", "950.00", "400.00"]$dbv41899$::jsonb,
   0, $dbv41900$MAX = 400.00, MIN = 250.00 among the completed orders, so 400.00 - 250.00 = 150.00.$dbv41900$, 1, 7)
on conflict (id) do nothing;

-- 14.7 String Functions
with g as (select id from public.learning_grids where lower(slug) = $dbv41901$dbms-sql-tutorial$dbv41901$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41902$chapter-14-sql-functions$dbv41902$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41903$String Functions$dbv41903$, $dbv41904$string-functions$dbv41904$, '', 7, 'published', true, true, $dbv41905$dbms_sql_tutorial$dbv41905$, $dbv41906$chapter-14-sql-functions/string-functions$dbv41906$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41907$dbms_sql_tutorial$dbv41907$ and source_ref = $dbv41908$chapter-14-sql-functions/string-functions$dbv41908$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41909$String Functions$dbv41909$, $dbv41910$### Scalar Functions vs Aggregates

From here on, this chapter shifts from aggregate functions (which collapse many rows into one value) to **scalar functions** — functions applied to a single value, once per row, that produce a transformed value per row. String functions manipulate text data.

### CONCAT — Joining Strings Together

```sql
SELECT CONCAT(customer_name, ' - ', status) AS summary FROM orders;
```

Result (for the first two rows):

```
summary
------------------
Alice - completed
Bob - pending
```

**Dialect variance:** `CONCAT(a, b, c)` (the function form) works in MySQL, PostgreSQL, SQL Server (2012+), and Oracle. Some dialects — notably PostgreSQL, Oracle, and SQLite — also support (or exclusively prefer historically) the `||` concatenation operator:

```sql
SELECT customer_name || ' - ' || status AS summary FROM orders;   -- PostgreSQL / Oracle / SQLite
```

SQL Server historically used `+` for string concatenation instead of `||`.

### UPPER / LOWER — Case Conversion

```sql
SELECT UPPER(customer_name) FROM orders WHERE id = 1;   -- 'ALICE'
SELECT LOWER(status)        FROM orders WHERE id = 1;   -- 'completed'
```

### LENGTH — String Length

```sql
SELECT LENGTH(customer_name) FROM orders WHERE customer_name = 'Charlie';
-- 7
```

**Dialect variance:** `LENGTH()` is standard/PostgreSQL/MySQL/SQLite; SQL Server uses `LEN()` instead.

### SUBSTRING — Extracting Part of a String

```sql
SELECT SUBSTRING(customer_name, 1, 3) FROM orders WHERE customer_name = 'Charlie';
-- 'Cha'   (3 characters starting at position 1)
```

Signature: `SUBSTRING(string, start_position, length)`. SQL Server also supports `SUBSTRING()` with this same signature; MySQL additionally accepts `SUBSTR()` as a common alias.

### TRIM — Removing Leading/Trailing Whitespace

```sql
SELECT TRIM('  Alice  ') AS cleaned;
-- 'Alice'
```

`TRIM` removes leading and trailing spaces by default; most dialects also support `LTRIM()`/`RTRIM()` for one-sided trimming, and an optional character argument (`TRIM('x' FROM 'xxAlicexx')` → `'Alice'`) to strip characters other than spaces.

### REPLACE — Substituting Text

```sql
SELECT REPLACE(status, 'completed', 'DONE') FROM orders WHERE id = 1;
-- 'DONE'
```

`REPLACE(string, search_value, replacement)` swaps every occurrence of `search_value` with `replacement`.

### Combining String Functions

```sql
SELECT UPPER(SUBSTRING(customer_name, 1, 1)) AS initial FROM orders;
-- 'A', 'B', 'A', 'C', 'B'  (first initial, capitalized)
```

### Edge Cases

- `CONCAT()` with a `NULL` argument: in MySQL, `CONCAT('a', NULL, 'b')` returns `NULL` for the whole expression (any NULL "poisons" the result) — but PostgreSQL's `CONCAT()` function specifically treats NULL as an empty string, while its `||` operator returns NULL if either side is NULL. Always test your specific engine's NULL behavior.
- `SUBSTRING` with an out-of-range start position or length returns an empty string or truncates gracefully rather than erroring, in most dialects.
- `LENGTH('')` returns `0`; `LENGTH(NULL)` returns `NULL`.

### Key Takeaways / Interview Q&A

**Q: What's the difference between CONCAT() and ||?**
A: `CONCAT()` is a function available across most dialects; `||` is an operator used in PostgreSQL, Oracle, and SQLite. SQL Server historically used `+` instead.

**Q: Which dialect uses LEN() instead of LENGTH()?**
A: SQL Server.

**Q: What does TRIM() do by default?**
A: Removes leading and trailing spaces from a string (some dialects allow trimming other characters).

**Q: Does CONCAT() always treat NULL the same way across dialects?**
A: No — this varies by dialect (e.g. MySQL's CONCAT propagates NULL, PostgreSQL's CONCAT treats NULL as empty string), so behavior must be verified per engine.$dbv41910$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41911$dbms_sql_tutorial_seed$dbv41911$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41912$dbms_sql_tutorial_seed$dbv41912$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41913$dbms-sql-tutorial$dbv41913$),
     t as (select id from public.learning_topics where source_kind = $dbv41914$dbms_sql_tutorial$dbv41914$ and source_ref = $dbv41915$chapter-14-sql-functions/string-functions$dbv41915$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41916$pt-dbms-sql-14-string-functions$dbv41916$, $dbv41917$String Functions - Quick Test$dbv41917$, 'aptitude', 8, 8,
  $dbv41918$8 questions on String Functions.$dbv41918$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41919$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41919$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41920$tq-dbms-sql-14-string-functions-1$dbv41920$, $dbv41921$pt-dbms-sql-14-string-functions$dbv41921$,
   $dbv41922$What does CONCAT(customer_name, ' - ', status) produce for a row with customer_name='Alice' and status='completed'?$dbv41922$,
   $dbv41923$["'Alice completed'", "'Alice - completed'", "'AliceStatus'", "An error"]$dbv41923$::jsonb,
   1, $dbv41924$CONCAT joins the three arguments in order: 'Alice' + ' - ' + 'completed' = 'Alice - completed'.$dbv41924$, 1, 0),
  ($dbv41925$tq-dbms-sql-14-string-functions-2$dbv41925$, $dbv41926$pt-dbms-sql-14-string-functions$dbv41926$,
   $dbv41927$Which operator, used as an alternative to CONCAT() in dialects like PostgreSQL, Oracle, and SQLite, joins strings together?$dbv41927$,
   $dbv41928$["+", "&", "||", "%"]$dbv41928$::jsonb,
   2, $dbv41929$|| is the standard-SQL-style string concatenation operator supported by PostgreSQL, Oracle, and SQLite; SQL Server historically used + instead.$dbv41929$, 1, 1),
  ($dbv41930$tq-dbms-sql-14-string-functions-3$dbv41930$, $dbv41931$pt-dbms-sql-14-string-functions$dbv41931$,
   $dbv41932$What does LENGTH('Charlie') return?$dbv41932$,
   $dbv41933$["6", "7", "8", "NULL"]$dbv41933$::jsonb,
   1, $dbv41934$'Charlie' has 7 characters: C-h-a-r-l-i-e.$dbv41934$, 1, 2),
  ($dbv41935$tq-dbms-sql-14-string-functions-4$dbv41935$, $dbv41936$pt-dbms-sql-14-string-functions$dbv41936$,
   $dbv41937$Which SQL dialect uses LEN() instead of the more common LENGTH() function?$dbv41937$,
   $dbv41938$["PostgreSQL", "MySQL", "SQL Server", "SQLite"]$dbv41938$::jsonb,
   2, $dbv41939$SQL Server's string-length function is named LEN(), unlike LENGTH() in PostgreSQL, MySQL, and SQLite.$dbv41939$, 1, 3),
  ($dbv41940$tq-dbms-sql-14-string-functions-5$dbv41940$, $dbv41941$pt-dbms-sql-14-string-functions$dbv41941$,
   $dbv41942$What does SUBSTRING('Charlie', 1, 3) return?$dbv41942$,
   $dbv41943$["'Cha'", "'har'", "'lie'", "'Charlie'"]$dbv41943$::jsonb,
   0, $dbv41944$SUBSTRING(string, start, length) extracts 3 characters starting at position 1: 'Cha'.$dbv41944$, 1, 4),
  ($dbv41945$tq-dbms-sql-14-string-functions-6$dbv41945$, $dbv41946$pt-dbms-sql-14-string-functions$dbv41946$,
   $dbv41947$What does TRIM('  Alice  ') return?$dbv41947$,
   $dbv41948$["'  Alice  ' (unchanged)", "'Alice'", "'Alice  '", "'  Alice'"]$dbv41948$::jsonb,
   1, $dbv41949$TRIM removes both leading and trailing spaces by default, leaving just 'Alice'.$dbv41949$, 1, 5),
  ($dbv41950$tq-dbms-sql-14-string-functions-7$dbv41950$, $dbv41951$pt-dbms-sql-14-string-functions$dbv41951$,
   $dbv41952$What does REPLACE(status, 'completed', 'DONE') return for a row where status = 'completed'?$dbv41952$,
   $dbv41953$["'completed'", "'DONE'", "'DONEcompleted'", "NULL"]$dbv41953$::jsonb,
   1, $dbv41954$REPLACE(string, search, replacement) substitutes every occurrence of 'completed' with 'DONE', so the entire matching string becomes 'DONE'.$dbv41954$, 1, 6),
  ($dbv41955$tq-dbms-sql-14-string-functions-8$dbv41955$, $dbv41956$pt-dbms-sql-14-string-functions$dbv41956$,
   $dbv41957$Why is it important to test how a specific SQL dialect's CONCAT() handles a NULL argument?$dbv41957$,
   $dbv41958$["Because CONCAT() is not supported in any dialect", "Because behavior genuinely varies \u2014 e.g. some dialects propagate NULL through the whole result while others treat NULL as an empty string", "Because CONCAT() always throws a syntax error with NULL arguments", "Because NULL arguments are illegal in all SQL dialects"]$dbv41958$::jsonb,
   1, $dbv41959$NULL handling in CONCAT() is dialect-specific: some engines (e.g. MySQL's CONCAT) return NULL if any argument is NULL, while others (e.g. PostgreSQL's CONCAT function) substitute an empty string for NULL arguments instead.$dbv41959$, 1, 7)
on conflict (id) do nothing;

-- 14.8 Numeric Functions
with g as (select id from public.learning_grids where lower(slug) = $dbv41960$dbms-sql-tutorial$dbv41960$),
     s as (select id from public.learning_sections where lower(slug) = $dbv41961$chapter-14-sql-functions$dbv41961$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv41962$Numeric Functions$dbv41962$, $dbv41963$numeric-functions$dbv41963$, '', 8, 'published', true, true, $dbv41964$dbms_sql_tutorial$dbv41964$, $dbv41965$chapter-14-sql-functions/numeric-functions$dbv41965$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv41966$dbms_sql_tutorial$dbv41966$ and source_ref = $dbv41967$chapter-14-sql-functions/numeric-functions$dbv41967$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv41968$Numeric Functions$dbv41968$, $dbv41969$### Scalar Numeric Functions

Numeric functions transform a single numeric value per row — rounding, truncating, taking absolute values, or computing remainders.

### ROUND — Rounding to N Decimal Places

```sql
SELECT ROUND(316.6666, 2) AS rounded;
-- 316.67

SELECT ROUND(amount, 0) FROM orders WHERE customer_name = 'Charlie';
-- 150   (150.00 rounded to 0 decimal places)
```

Signature: `ROUND(number, decimal_places)`. A negative `decimal_places` rounds to the left of the decimal point: `ROUND(1234, -2)` → `1200`.

### CEILING / CEIL — Round Up

```sql
SELECT CEILING(150.10) AS ceil_val;
-- 151

SELECT CEIL(150.00) AS ceil_val;
-- 150   (already a whole number, unchanged)
```

`CEILING()` and `CEIL()` are synonyms in most dialects (MySQL and PostgreSQL support both; some engines prefer one spelling).

### FLOOR — Round Down

```sql
SELECT FLOOR(150.90) AS floor_val;
-- 150
```

`FLOOR` always rounds toward negative infinity: `FLOOR(-150.10)` is `-151`, not `-150` (contrast with simple truncation).

### ABS — Absolute Value

```sql
SELECT ABS(-250.00) AS abs_val;
-- 250.00

SELECT ABS(amount - 300) AS distance_from_300 FROM orders;
-- for amount=250: |250-300| = 50.00
-- for amount=400: |400-300| = 100.00
```

`ABS` is commonly used to compute a magnitude of difference regardless of direction (e.g. "how far off was the estimate?").

### MOD / % — Remainder

```sql
SELECT MOD(17, 5) AS remainder;   -- 2   (standard function form)
SELECT 17 % 5 AS remainder;       -- 2   (operator form, most dialects)
```

**Dialect variance:** `MOD(a, b)` is widely supported (MySQL, Oracle, PostgreSQL); the `%` operator works in MySQL, SQL Server, and PostgreSQL. Standard SQL itself doesn't mandate one universal spelling, so check your engine.

`MOD` is frequently used to test even/odd (`id % 2 = 0`) or to bucket rows into a fixed number of groups (`id % 3` gives values 0, 1, 2 in rotation).

### Integer vs Decimal Division — Cross-Reference

As covered in Chapter 8 (Data Types), dividing two `INT` operands with `/` in some dialects (e.g. MySQL for `INT`/`INT`, or explicit integer types in others) can perform **integer division**, discarding the remainder (`7 / 2` → `3`, not `3.5`). This is distinct from `MOD`, which specifically *returns* that discarded remainder (`7 % 2` → `1`). When you need a true decimal result, cast at least one operand: `7 / 2.0` → `3.5`.

### Edge Cases

- `ROUND()` with a `NULL` input returns `NULL`.
- `MOD(x, 0)` (or `x % 0`) raises a division-by-zero error in most dialects, exactly like `/` by zero.
- Rounding behavior at exact `.5` boundaries (e.g. `ROUND(2.5, 0)`) can differ subtly between "round half up" and "round half to even" (banker's rounding) depending on the engine and data type — worth verifying if precision at the boundary matters.

### Key Takeaways / Interview Q&A

**Q: What's the difference between CEILING and FLOOR?**
A: CEILING rounds up to the next whole number (or leaves it unchanged if already whole); FLOOR rounds down toward negative infinity.

**Q: What does MOD(17, 5) or 17 % 5 return?**
A: 2 — the remainder after dividing 17 by 5 three times (15), leaving 2.

**Q: What's the difference between integer division and MOD?**
A: Integer division (`/` on two integer operands in some dialects) discards the remainder and keeps the quotient; MOD (`%`) does the opposite — it discards the quotient and returns just the remainder.

**Q: Does ROUND(x, -2) make sense?**
A: Yes — a negative decimal-places argument rounds to the left of the decimal point, e.g. ROUND(1234, -2) = 1200.$dbv41969$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv41970$dbms_sql_tutorial_seed$dbv41970$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv41971$dbms_sql_tutorial_seed$dbv41971$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv41972$dbms-sql-tutorial$dbv41972$),
     t as (select id from public.learning_topics where source_kind = $dbv41973$dbms_sql_tutorial$dbv41973$ and source_ref = $dbv41974$chapter-14-sql-functions/numeric-functions$dbv41974$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv41975$pt-dbms-sql-14-numeric-functions$dbv41975$, $dbv41976$Numeric Functions - Quick Test$dbv41976$, 'aptitude', 8, 8,
  $dbv41977$8 questions on Numeric Functions.$dbv41977$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv41978$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv41978$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv41979$tq-dbms-sql-14-numeric-functions-1$dbv41979$, $dbv41980$pt-dbms-sql-14-numeric-functions$dbv41980$,
   $dbv41981$What does ROUND(316.6666, 2) return?$dbv41981$,
   $dbv41982$["316.66", "316.67", "317.00", "316.6666"]$dbv41982$::jsonb,
   1, $dbv41983$Rounding 316.6666 to 2 decimal places gives 316.67 (the third decimal digit, 6, rounds the second digit up from 6 to 7).$dbv41983$, 1, 0),
  ($dbv41984$tq-dbms-sql-14-numeric-functions-2$dbv41984$, $dbv41985$pt-dbms-sql-14-numeric-functions$dbv41985$,
   $dbv41986$What does CEILING(150.10) return?$dbv41986$,
   $dbv41987$["150", "151", "150.10", "150.1"]$dbv41987$::jsonb,
   1, $dbv41988$CEILING rounds up to the next whole number, so 150.10 becomes 151.$dbv41988$, 1, 1),
  ($dbv41989$tq-dbms-sql-14-numeric-functions-3$dbv41989$, $dbv41990$pt-dbms-sql-14-numeric-functions$dbv41990$,
   $dbv41991$What does FLOOR(150.90) return?$dbv41991$,
   $dbv41992$["151", "150", "150.9", "149"]$dbv41992$::jsonb,
   1, $dbv41993$FLOOR rounds down toward negative infinity, so 150.90 becomes 150.$dbv41993$, 1, 2),
  ($dbv41994$tq-dbms-sql-14-numeric-functions-4$dbv41994$, $dbv41995$pt-dbms-sql-14-numeric-functions$dbv41995$,
   $dbv41996$What does ABS(-250.00) return?$dbv41996$,
   $dbv41997$["-250.00", "250.00", "0", "NULL"]$dbv41997$::jsonb,
   1, $dbv41998$ABS returns the absolute (non-negative) value of a number, so -250.00 becomes 250.00.$dbv41998$, 1, 3),
  ($dbv41999$tq-dbms-sql-14-numeric-functions-5$dbv41999$, $dbv42000$pt-dbms-sql-14-numeric-functions$dbv42000$,
   $dbv42001$What does MOD(17, 5) (equivalently 17 % 5) return?$dbv42001$,
   $dbv42002$["3", "2", "3.4", "12"]$dbv42002$::jsonb,
   1, $dbv42003$17 divided by 5 is 3 with a remainder of 2; MOD returns just the remainder, 2.$dbv42003$, 1, 4),
  ($dbv42004$tq-dbms-sql-14-numeric-functions-6$dbv42004$, $dbv42005$pt-dbms-sql-14-numeric-functions$dbv42005$,
   $dbv42006$What is the key difference between integer division (7 / 2 in an all-integer context) and MOD (7 % 2)?$dbv42006$,
   $dbv42007$["They always return the same value", "Integer division returns the truncated quotient (3), while MOD returns the remainder (1)", "MOD always returns 0", "Integer division is not supported in any SQL dialect"]$dbv42007$::jsonb,
   1, $dbv42008$7 / 2 with integer operands truncates to 3 (discarding the remainder), while 7 % 2 = 1 returns exactly that discarded remainder.$dbv42008$, 1, 5),
  ($dbv42009$tq-dbms-sql-14-numeric-functions-7$dbv42009$, $dbv42010$pt-dbms-sql-14-numeric-functions$dbv42010$,
   $dbv42011$What does FLOOR(-150.10) return?$dbv42011$,
   $dbv42012$["-150", "-151", "-150.10", "150"]$dbv42012$::jsonb,
   1, $dbv42013$FLOOR always rounds toward negative infinity, so for a negative number like -150.10, it rounds further down to -151, not up to -150.$dbv42013$, 1, 6),
  ($dbv42014$tq-dbms-sql-14-numeric-functions-8$dbv42014$, $dbv42015$pt-dbms-sql-14-numeric-functions$dbv42015$,
   $dbv42016$What does ROUND(1234, -2) return?$dbv42016$,
   $dbv42017$["1234.00", "1200", "1230", "1300"]$dbv42017$::jsonb,
   1, $dbv42018$A negative decimal-places argument rounds to the left of the decimal point; rounding 1234 to the nearest hundred gives 1200.$dbv42018$, 1, 7)
on conflict (id) do nothing;

-- 14.9 Date Functions
with g as (select id from public.learning_grids where lower(slug) = $dbv42019$dbms-sql-tutorial$dbv42019$),
     s as (select id from public.learning_sections where lower(slug) = $dbv42020$chapter-14-sql-functions$dbv42020$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv42021$Date Functions$dbv42021$, $dbv42022$date-functions$dbv42022$, '', 9, 'published', true, true, $dbv42023$dbms_sql_tutorial$dbv42023$, $dbv42024$chapter-14-sql-functions/date-functions$dbv42024$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv42025$dbms_sql_tutorial$dbv42025$ and source_ref = $dbv42026$chapter-14-sql-functions/date-functions$dbv42026$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv42027$Date Functions$dbv42027$, $dbv42028$### Working with Dates

Date functions let you get the current date, perform date arithmetic, and extract parts of a date. Dialect naming varies more here than almost anywhere else in SQL.

### CURRENT_DATE — Today's Date

```sql
SELECT CURRENT_DATE;
-- e.g. 2026-09-14
```

`CURRENT_DATE` is standard SQL and widely supported (PostgreSQL, MySQL, SQLite). It returns today's date with no time component.

### Adding/Subtracting Time — Dialect Variance

**PostgreSQL** uses `INTERVAL` arithmetic directly on dates:

```sql
SELECT order_date + INTERVAL '7 days' AS week_later FROM orders WHERE id = 1;
-- 2024-01-05 + 7 days = 2024-01-12
```

**MySQL** uses `DATE_ADD()` / `DATE_SUB()`:

```sql
SELECT DATE_ADD(order_date, INTERVAL 7 DAY) AS week_later FROM orders WHERE id = 1;
-- 2024-01-12

SELECT DATE_SUB(order_date, INTERVAL 7 DAY) AS week_earlier FROM orders WHERE id = 1;
-- 2023-12-29
```

**SQL Server** uses `DATEADD()`:

```sql
SELECT DATEADD(day, 7, order_date) AS week_later FROM orders WHERE id = 1;
-- 2024-01-12
```

Three different spellings for the same operation — always check the target dialect's documentation before writing date arithmetic.

### DATEDIFF — Difference Between Two Dates

```sql
-- MySQL / SQL Server style
SELECT DATEDIFF(order_date, '2024-01-01') AS days_since_new_year FROM orders WHERE id = 1;
-- MySQL: 4 (2024-01-05 minus 2024-01-01)
```

**Dialect variance:** MySQL's `DATEDIFF(date1, date2)` returns `date1 - date2` in days. SQL Server's `DATEDIFF(unit, date1, date2)` takes a unit (day, month, year, etc.) as the first argument and returns `date2 - date1` — the argument order and meaning are reversed compared to MySQL, a genuine gotcha when porting code between engines. PostgreSQL has no built-in `DATEDIFF`; you simply subtract two dates directly (`date2 - date1`) to get an integer number of days.

### EXTRACT — Pulling Out a Date Part

```sql
SELECT EXTRACT(YEAR FROM order_date) AS order_year FROM orders WHERE id = 1;
-- 2024

SELECT EXTRACT(MONTH FROM order_date) AS order_month FROM orders WHERE id = 1;
-- 1

SELECT EXTRACT(DAY FROM order_date) AS order_day FROM orders WHERE id = 1;
-- 5
```

`EXTRACT(part FROM date)` is standard SQL, supported by PostgreSQL, MySQL, and Oracle. SQL Server instead commonly uses `DATEPART(part, date)` or `YEAR()`/`MONTH()`/`DAY()` convenience functions with equivalent results.

### Practical Example: Orders in the Last 30 Days

```sql
-- PostgreSQL
SELECT * FROM orders WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';

-- MySQL
SELECT * FROM orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
```

### Edge Cases

- Date arithmetic across month/year boundaries (e.g. adding a month to January 31st) can produce different results across engines — some clamp to the last valid day of the target month, others error.
- `EXTRACT` and date-arithmetic functions all propagate `NULL`: if `order_date` is `NULL`, every derived expression is also `NULL`.
- Time zones are *not* a concern for a plain `DATE` type (no time-of-day component at all) but become very relevant once `TIMESTAMP`/`DATETIME` is involved (covered next, in Time Functions).

### Key Takeaways / Interview Q&A

**Q: Name three different ways engines spell "add days to a date".**
A: PostgreSQL: `date + INTERVAL 'n days'`. MySQL: `DATE_ADD(date, INTERVAL n DAY)`. SQL Server: `DATEADD(day, n, date)`.

**Q: What's the DATEDIFF argument-order gotcha between MySQL and SQL Server?**
A: MySQL's `DATEDIFF(date1, date2)` = `date1 - date2`; SQL Server's `DATEDIFF(unit, date1, date2)` = `date2 - date1` (reversed) and additionally requires a unit as the first argument.

**Q: What does EXTRACT(YEAR FROM order_date) do?**
A: Returns just the year component of a date as an integer, e.g. 2024.$dbv42028$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv42029$dbms_sql_tutorial_seed$dbv42029$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv42030$dbms_sql_tutorial_seed$dbv42030$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv42031$dbms-sql-tutorial$dbv42031$),
     t as (select id from public.learning_topics where source_kind = $dbv42032$dbms_sql_tutorial$dbv42032$ and source_ref = $dbv42033$chapter-14-sql-functions/date-functions$dbv42033$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv42034$pt-dbms-sql-14-date-functions$dbv42034$, $dbv42035$Date Functions - Quick Test$dbv42035$, 'aptitude', 8, 8,
  $dbv42036$8 questions on Date Functions.$dbv42036$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv42037$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv42037$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv42038$tq-dbms-sql-14-date-functions-1$dbv42038$, $dbv42039$pt-dbms-sql-14-date-functions$dbv42039$,
   $dbv42040$What does CURRENT_DATE return?$dbv42040$,
   $dbv42041$["The current date and time together", "Just today's date, with no time component", "The date the table was created", "NULL unless explicitly cast"]$dbv42041$::jsonb,
   1, $dbv42042$CURRENT_DATE is a standard SQL function that returns today's date only, without any time-of-day component.$dbv42042$, 1, 0),
  ($dbv42043$tq-dbms-sql-14-date-functions-2$dbv42043$, $dbv42044$pt-dbms-sql-14-date-functions$dbv42044$,
   $dbv42045$Which function does MySQL use to add an interval of time to a date?$dbv42045$,
   $dbv42046$["DATEADD()", "date + INTERVAL syntax only", "DATE_ADD()", "ADD_DATE_INTERVAL()"]$dbv42046$::jsonb,
   2, $dbv42047$MySQL provides DATE_ADD(date, INTERVAL n unit) for adding time to a date (and DATE_SUB() for subtracting).$dbv42047$, 1, 1),
  ($dbv42048$tq-dbms-sql-14-date-functions-3$dbv42048$, $dbv42049$pt-dbms-sql-14-date-functions$dbv42049$,
   $dbv42050$Which SQL Server function adds a number of days to a date?$dbv42050$,
   $dbv42051$["DATE_ADD()", "DATEADD()", "ADD_DATE()", "date + INTERVAL"]$dbv42051$::jsonb,
   1, $dbv42052$SQL Server's syntax is DATEADD(unit, number, date), e.g. DATEADD(day, 7, order_date).$dbv42052$, 1, 2),
  ($dbv42053$tq-dbms-sql-14-date-functions-4$dbv42053$, $dbv42054$pt-dbms-sql-14-date-functions$dbv42054$,
   $dbv42055$What does EXTRACT(YEAR FROM order_date) return for order_date = '2024-01-05'?$dbv42055$,
   $dbv42056$["1", "5", "2024", "'2024-01-05'"]$dbv42056$::jsonb,
   2, $dbv42057$EXTRACT(YEAR FROM date) pulls out just the year component, 2024.$dbv42057$, 1, 3),
  ($dbv42058$tq-dbms-sql-14-date-functions-5$dbv42058$, $dbv42059$pt-dbms-sql-14-date-functions$dbv42059$,
   $dbv42060$In MySQL, what does DATEDIFF('2024-01-05', '2024-01-01') return?$dbv42060$,
   $dbv42061$["4", "-4", "0", "1"]$dbv42061$::jsonb,
   0, $dbv42062$MySQL's DATEDIFF(date1, date2) computes date1 - date2 in days: 2024-01-05 minus 2024-01-01 is 4 days.$dbv42062$, 1, 4),
  ($dbv42063$tq-dbms-sql-14-date-functions-6$dbv42063$, $dbv42064$pt-dbms-sql-14-date-functions$dbv42064$,
   $dbv42065$What is the key gotcha when porting a DATEDIFF() call from MySQL to SQL Server?$dbv42065$,
   $dbv42066$["SQL Server's DATEDIFF requires a unit argument first and computes date2 - date1, the reverse order and meaning of MySQL's two-argument version", "SQL Server does not support DATEDIFF at all", "MySQL's DATEDIFF always returns a negative number", "There is no difference; both behave identically"]$dbv42066$::jsonb,
   0, $dbv42067$SQL Server's DATEDIFF(unit, date1, date2) takes a unit and computes date2 minus date1, whereas MySQL's DATEDIFF(date1, date2) has no unit argument and computes date1 minus date2 — a real source of bugs when migrating code.$dbv42067$, 1, 5),
  ($dbv42068$tq-dbms-sql-14-date-functions-7$dbv42068$, $dbv42069$pt-dbms-sql-14-date-functions$dbv42069$,
   $dbv42070$Which of the following correctly filters PostgreSQL orders placed within the last 30 days using interval arithmetic?$dbv42070$,
   $dbv42071$["WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'", "WHERE order_date >= DATEADD(day, -30, CURRENT_DATE)", "WHERE DATEDIFF(order_date, CURRENT_DATE) = 30", "WHERE order_date = CURRENT_DATE - 30"]$dbv42071$::jsonb,
   0, $dbv42072$PostgreSQL supports direct interval arithmetic on dates: subtracting an INTERVAL from CURRENT_DATE gives the date 30 days ago, and >= filters to that range.$dbv42072$, 1, 6),
  ($dbv42073$tq-dbms-sql-14-date-functions-8$dbv42073$, $dbv42074$pt-dbms-sql-14-date-functions$dbv42074$,
   $dbv42075$If order_date is NULL for a row, what does EXTRACT(MONTH FROM order_date) return for that row?$dbv42075$,
   $dbv42076$["0", "1", "NULL", "An error"]$dbv42076$::jsonb,
   2, $dbv42077$Like most scalar functions, EXTRACT propagates NULL — if the input date is NULL, the extracted part is also NULL.$dbv42077$, 1, 7)
on conflict (id) do nothing;

-- 14.10 Time Functions
with g as (select id from public.learning_grids where lower(slug) = $dbv42078$dbms-sql-tutorial$dbv42078$),
     s as (select id from public.learning_sections where lower(slug) = $dbv42079$chapter-14-sql-functions$dbv42079$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv42080$Time Functions$dbv42080$, $dbv42081$time-functions$dbv42081$, '', 10, 'published', true, true, $dbv42082$dbms_sql_tutorial$dbv42082$, $dbv42083$chapter-14-sql-functions/time-functions$dbv42083$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv42084$dbms_sql_tutorial$dbv42084$ and source_ref = $dbv42085$chapter-14-sql-functions/time-functions$dbv42085$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv42086$Time Functions$dbv42086$, $dbv42087$### Time and Timestamp Functions

Where date functions deal with calendar dates, time functions deal with time-of-day and combined date+time values.

### Recap: DATE vs TIME vs TIMESTAMP/DATETIME (Cross-Reference to Chapter 8)

As introduced in Chapter 8 (Data Types), these three types store fundamentally different things:

| Type | Stores | Example |
|---|---|---|
| `DATE` | Calendar date only | `2024-01-05` |
| `TIME` | Time-of-day only | `14:30:00` |
| `TIMESTAMP` / `DATETIME` | Date **and** time together | `2024-01-05 14:30:00` |

Choosing the wrong one is a common design mistake — e.g. storing an order's placement moment as `DATE` loses the time-of-day entirely, making it impossible to answer "which orders were placed in the morning?"

### CURRENT_TIME — Time of Day Right Now

```sql
SELECT CURRENT_TIME;
-- e.g. 09:42:17   (just the time, no date)
```

### CURRENT_TIMESTAMP / NOW() — Date and Time Right Now

```sql
SELECT CURRENT_TIMESTAMP;
-- e.g. 2026-09-14 09:42:17

SELECT NOW();
-- e.g. 2026-09-14 09:42:17   (MySQL / PostgreSQL convenience alias)
```

**Dialect variance:** `CURRENT_TIMESTAMP` is standard SQL and works broadly. `NOW()` is a widely supported convenience function (MySQL, PostgreSQL) that is generally equivalent to `CURRENT_TIMESTAMP`. SQL Server uses `GETDATE()` for the same purpose.

### Adding a Placed-At Column and Querying by Time

```sql
ALTER TABLE orders ADD COLUMN placed_at TIMESTAMP;
UPDATE orders SET placed_at = '2024-01-05 14:30:00' WHERE id = 1;

SELECT * FROM orders WHERE EXTRACT(HOUR FROM placed_at) < 12;
-- orders placed before noon
```

### Time Arithmetic

Time arithmetic follows the same interval patterns as date arithmetic:

```sql
-- PostgreSQL
SELECT placed_at + INTERVAL '2 hours' AS two_hours_later FROM orders WHERE id = 1;
-- 2024-01-05 16:30:00

-- MySQL
SELECT DATE_ADD(placed_at, INTERVAL 2 HOUR) AS two_hours_later FROM orders WHERE id = 1;
-- 2024-01-05 16:30:00
```

Subtracting two `TIMESTAMP` values typically yields an interval (PostgreSQL) or requires an explicit function like `TIMESTAMPDIFF()` (MySQL) to get a numeric difference in a chosen unit:

```sql
-- MySQL: difference in minutes between two timestamps
SELECT TIMESTAMPDIFF(MINUTE, '2024-01-05 14:30:00', '2024-01-05 16:30:00') AS minutes_apart;
-- 120
```

### Edge Cases

- Mixing `DATE` and `TIMESTAMP` values in a comparison usually works because the `DATE` is implicitly treated as midnight (`00:00:00`) of that day — but this can cause subtle off-by-one-day bugs in range filters (e.g. `WHERE placed_at <= '2024-01-05'` silently excludes any time later than midnight on the 5th).
- Time zone handling differs sharply by type name: plain `TIMESTAMP` (or `DATETIME`) usually stores a "naive" value with no time zone, while `TIMESTAMPTZ` / `TIMESTAMP WITH TIME ZONE` (PostgreSQL) stores and normalizes a time zone-aware instant — mixing the two carelessly is a common source of bugs in distributed applications.
- `CURRENT_TIME` and `CURRENT_TIMESTAMP` are typically evaluated **once per statement** (not once per row), so all rows in the same query see the identical "now" value.

### Key Takeaways / Interview Q&A

**Q: What's the difference between DATE, TIME, and TIMESTAMP?**
A: DATE stores only a calendar date, TIME stores only a time-of-day, and TIMESTAMP/DATETIME stores both together.

**Q: What does NOW() return, and where is it commonly available?**
A: The current date and time together; it's a common convenience alias for CURRENT_TIMESTAMP in MySQL and PostgreSQL. SQL Server instead uses GETDATE().

**Q: Why might comparing a TIMESTAMP column to a bare date string with <= silently exclude some rows on that day?**
A: A bare date is implicitly midnight (00:00:00) of that day, so any TIMESTAMP later than midnight on the target date fails a <= comparison meant to include the whole day.

**Q: What's the practical difference between plain TIMESTAMP and TIMESTAMPTZ?**
A: Plain TIMESTAMP has no time zone awareness ("naive"); TIMESTAMPTZ (PostgreSQL) stores/normalizes a time-zone-aware instant, which matters for distributed or multi-region applications.$dbv42087$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv42088$dbms_sql_tutorial_seed$dbv42088$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv42089$dbms_sql_tutorial_seed$dbv42089$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv42090$dbms-sql-tutorial$dbv42090$),
     t as (select id from public.learning_topics where source_kind = $dbv42091$dbms_sql_tutorial$dbv42091$ and source_ref = $dbv42092$chapter-14-sql-functions/time-functions$dbv42092$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv42093$pt-dbms-sql-14-time-functions$dbv42093$, $dbv42094$Time Functions - Quick Test$dbv42094$, 'aptitude', 8, 8,
  $dbv42095$8 questions on Time Functions.$dbv42095$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv42096$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv42096$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv42097$tq-dbms-sql-14-time-functions-1$dbv42097$, $dbv42098$pt-dbms-sql-14-time-functions$dbv42098$,
   $dbv42099$What does the DATE type store, in contrast to TIMESTAMP?$dbv42099$,
   $dbv42100$["Only a time-of-day value", "Only a calendar date, with no time-of-day component", "Both date and time together", "A time zone offset only"]$dbv42100$::jsonb,
   1, $dbv42101$DATE stores just a calendar date (e.g. 2024-01-05); TIMESTAMP/DATETIME combines both date and time.$dbv42101$, 1, 0),
  ($dbv42102$tq-dbms-sql-14-time-functions-2$dbv42102$, $dbv42103$pt-dbms-sql-14-time-functions$dbv42103$,
   $dbv42104$Which function is a common MySQL/PostgreSQL convenience alias for CURRENT_TIMESTAMP?$dbv42104$,
   $dbv42105$["TODAY()", "NOW()", "GETDATE()", "SYSDATE()"]$dbv42105$::jsonb,
   1, $dbv42106$NOW() is widely supported in MySQL and PostgreSQL as an equivalent to CURRENT_TIMESTAMP. SQL Server instead uses GETDATE().$dbv42106$, 1, 1),
  ($dbv42107$tq-dbms-sql-14-time-functions-3$dbv42107$, $dbv42108$pt-dbms-sql-14-time-functions$dbv42108$,
   $dbv42109$Which SQL Server function returns the current date and time?$dbv42109$,
   $dbv42110$["NOW()", "CURRENT_DATE()", "GETDATE()", "TODAY()"]$dbv42110$::jsonb,
   2, $dbv42111$SQL Server's convenience function for the current date and time is GETDATE().$dbv42111$, 1, 2),
  ($dbv42112$tq-dbms-sql-14-time-functions-4$dbv42112$, $dbv42113$pt-dbms-sql-14-time-functions$dbv42113$,
   $dbv42114$What does CURRENT_TIME return?$dbv42114$,
   $dbv42115$["Just the date", "Just the time-of-day, with no date component", "Date and time together", "A Unix timestamp integer"]$dbv42115$::jsonb,
   1, $dbv42116$CURRENT_TIME returns only the time-of-day portion, with no calendar date.$dbv42116$, 1, 3),
  ($dbv42117$tq-dbms-sql-14-time-functions-5$dbv42117$, $dbv42118$pt-dbms-sql-14-time-functions$dbv42118$,
   $dbv42119$Why might WHERE placed_at <= '2024-01-05' unexpectedly exclude orders placed later in the day on January 5th?$dbv42119$,
   $dbv42120$["Because TIMESTAMP columns cannot be compared with strings", "Because the bare date string is implicitly treated as midnight (00:00:00) of that day, so anything later on the same day fails the <= comparison", "Because <= is not a valid operator for date comparisons", "Because placed_at is always stored in a different time zone"]$dbv42120$::jsonb,
   1, $dbv42121$A bare date compared against a TIMESTAMP column is implicitly midnight of that date, so any time later than 00:00:00 on the 5th is excluded from a <= filter intended to cover the whole day.$dbv42121$, 1, 4),
  ($dbv42122$tq-dbms-sql-14-time-functions-6$dbv42122$, $dbv42123$pt-dbms-sql-14-time-functions$dbv42123$,
   $dbv42124$In MySQL, what does TIMESTAMPDIFF(MINUTE, '2024-01-05 14:30:00', '2024-01-05 16:30:00') return?$dbv42124$,
   $dbv42125$["2", "120", "7200", "-120"]$dbv42125$::jsonb,
   1, $dbv42126$The two timestamps are 2 hours apart, which is 120 minutes.$dbv42126$, 1, 5),
  ($dbv42127$tq-dbms-sql-14-time-functions-7$dbv42127$, $dbv42128$pt-dbms-sql-14-time-functions$dbv42128$,
   $dbv42129$What is the key difference between a plain TIMESTAMP and PostgreSQL's TIMESTAMPTZ (TIMESTAMP WITH TIME ZONE)?$dbv42129$,
   $dbv42130$["They are always functionally identical", "Plain TIMESTAMP is 'naive' with no time zone awareness, while TIMESTAMPTZ stores/normalizes a time zone-aware instant", "TIMESTAMPTZ cannot store a time-of-day component", "Plain TIMESTAMP is only usable for dates before 2000"]$dbv42130$::jsonb,
   1, $dbv42131$Plain TIMESTAMP has no concept of time zone, while TIMESTAMPTZ is aware of and normalizes for time zones — an important distinction in distributed or multi-region applications.$dbv42131$, 1, 6),
  ($dbv42132$tq-dbms-sql-14-time-functions-8$dbv42132$, $dbv42133$pt-dbms-sql-14-time-functions$dbv42133$,
   $dbv42134$When CURRENT_TIMESTAMP is referenced multiple times within the same SQL statement across many rows, what generally happens?$dbv42134$,
   $dbv42135$["Each row gets a slightly different timestamp reflecting real elapsed execution time", "CURRENT_TIMESTAMP is typically evaluated once per statement, so every row sees the identical value", "CURRENT_TIMESTAMP causes a syntax error if used more than once per statement", "CURRENT_TIMESTAMP always returns NULL after the first row"]$dbv42135$::jsonb,
   1, $dbv42136$Most engines evaluate CURRENT_TIME/CURRENT_TIMESTAMP once per statement execution, not once per row, so all rows see a consistent 'now' value.$dbv42136$, 1, 7)
on conflict (id) do nothing;

-- 14.11 Conversion Functions
with g as (select id from public.learning_grids where lower(slug) = $dbv42137$dbms-sql-tutorial$dbv42137$),
     s as (select id from public.learning_sections where lower(slug) = $dbv42138$chapter-14-sql-functions$dbv42138$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv42139$Conversion Functions$dbv42139$, $dbv42140$conversion-functions$dbv42140$, '', 11, 'published', true, true, $dbv42141$dbms_sql_tutorial$dbv42141$, $dbv42142$chapter-14-sql-functions/conversion-functions$dbv42142$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv42143$dbms_sql_tutorial$dbv42143$ and source_ref = $dbv42144$chapter-14-sql-functions/conversion-functions$dbv42144$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv42145$Conversion Functions$dbv42145$, $dbv42146$### Why You Need Conversion Functions

SQL is strongly typed at the column level, but expressions sometimes need to move a value from one type to another — a numeric ID stored oddly as text, a decimal that needs to display as a formatted string, or a date embedded in a `VARCHAR` column that needs to be filtered as a real date.

### CAST — The Standard, Portable Way

```sql
SELECT CAST('123' AS INTEGER) AS as_int;
-- 123   (now a real integer, not text)

SELECT CAST(amount AS VARCHAR(20)) AS amount_text FROM orders WHERE id = 1;
-- '250.00'   (now a string)

SELECT CAST('2024-01-05' AS DATE) AS as_date;
-- 2024-01-05   (now a real DATE value, usable in date arithmetic)
```

`CAST(expression AS target_type)` is standard SQL and works identically across PostgreSQL, MySQL, SQL Server, Oracle, and SQLite. It's the safest, most portable choice.

### CONVERT — The Dialect-Specific Way

**SQL Server** uses `CONVERT()` with a different (and reversed) argument order:

```sql
SELECT CONVERT(INT, '123') AS as_int;              -- SQL Server: type comes FIRST
SELECT CONVERT(VARCHAR(20), amount) AS amount_text; -- SQL Server
```

SQL Server's `CONVERT()` also accepts an optional third "style" argument for formatting (particularly common with dates), which `CAST` does not support:

```sql
SELECT CONVERT(VARCHAR, GETDATE(), 101) AS us_format;  -- SQL Server: 'MM/DD/YYYY' style
```

**MySQL** also has a `CONVERT()` function, but with syntax closer to `CAST`:

```sql
SELECT CONVERT('123', SIGNED) AS as_int;   -- MySQL
```

### Practical Use: Comparing Mismatched Types

```sql
-- If a column was mistakenly stored as VARCHAR but holds numeric-looking text
SELECT * FROM orders WHERE CAST(amount AS DECIMAL(10,2)) > 200;
```

### Implicit vs Explicit Conversion

Many engines will *implicitly* convert compatible types without an explicit `CAST` — e.g. comparing a numeric column to a numeric-looking string literal, or concatenating a number into a string. Implicit conversion is convenient but can silently produce unexpected results (or errors, or even prevent an index from being used efficiently in some engines) when the two types aren't cleanly compatible. Using explicit `CAST` documents intent and avoids relying on the engine's guesswork.

### Edge Cases

- `CAST('abc' AS INTEGER)` raises an error in virtually every dialect — text that isn't numeric-looking cannot become a number.
- `CAST(NULL AS INTEGER)` succeeds and simply returns a typed `NULL`.
- Converting a `DECIMAL` to a narrower type (e.g. `CAST(316.6666 AS INTEGER)`) truncates or rounds depending on the dialect — always verify which behavior your engine uses when precision matters.
- Some dialects offer a "safe" conversion function that returns `NULL` instead of erroring on bad input (e.g. SQL Server's `TRY_CAST()` / `TRY_CONVERT()`), useful for cleaning messy data.

### Key Takeaways / Interview Q&A

**Q: What's the difference between CAST and CONVERT?**
A: CAST is standard SQL, portable across dialects, with the syntax `CAST(expr AS type)`. CONVERT is dialect-specific (notably SQL Server and MySQL) with different, engine-specific argument orders and often extra formatting options.

**Q: Which one supports a "style" argument for date formatting?**
A: SQL Server's CONVERT() — CAST does not support a style/format argument.

**Q: What happens with CAST('abc' AS INTEGER)?**
A: It raises a conversion error, since 'abc' isn't a valid numeric string.

**Q: How can you convert a value without risking an error on bad input?**
A: Use a "safe" conversion function where available, such as SQL Server's TRY_CAST() / TRY_CONVERT(), which returns NULL instead of erroring.$dbv42146$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv42147$dbms_sql_tutorial_seed$dbv42147$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv42148$dbms_sql_tutorial_seed$dbv42148$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv42149$dbms-sql-tutorial$dbv42149$),
     t as (select id from public.learning_topics where source_kind = $dbv42150$dbms_sql_tutorial$dbv42150$ and source_ref = $dbv42151$chapter-14-sql-functions/conversion-functions$dbv42151$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv42152$pt-dbms-sql-14-conversion-functions$dbv42152$, $dbv42153$Conversion Functions - Quick Test$dbv42153$, 'aptitude', 8, 8,
  $dbv42154$8 questions on Conversion Functions.$dbv42154$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv42155$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv42155$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv42156$tq-dbms-sql-14-conversion-functions-1$dbv42156$, $dbv42157$pt-dbms-sql-14-conversion-functions$dbv42157$,
   $dbv42158$What does CAST('123' AS INTEGER) return?$dbv42158$,
   $dbv42159$["The string '123' unchanged", "The integer 123", "NULL", "An error"]$dbv42159$::jsonb,
   1, $dbv42160$CAST converts the numeric-looking string '123' into a true integer value, 123.$dbv42160$, 1, 0),
  ($dbv42161$tq-dbms-sql-14-conversion-functions-2$dbv42161$, $dbv42162$pt-dbms-sql-14-conversion-functions$dbv42162$,
   $dbv42163$Which function/syntax is standard SQL and portable across most major database engines?$dbv42163$,
   $dbv42164$["CONVERT()", "CAST(expr AS type)", "TO_TYPE()", "TRANSFORM()"]$dbv42164$::jsonb,
   1, $dbv42165$CAST(expression AS target_type) is standard SQL, supported identically across PostgreSQL, MySQL, SQL Server, Oracle, and SQLite.$dbv42165$, 1, 1),
  ($dbv42166$tq-dbms-sql-14-conversion-functions-3$dbv42166$, $dbv42167$pt-dbms-sql-14-conversion-functions$dbv42167$,
   $dbv42168$Which database's CONVERT() function places the target type as the FIRST argument, unlike CAST?$dbv42168$,
   $dbv42169$["MySQL", "PostgreSQL", "SQL Server", "SQLite"]$dbv42169$::jsonb,
   2, $dbv42170$SQL Server's CONVERT(type, expression) puts the type first, in reversed order compared to CAST(expression AS type).$dbv42170$, 1, 2),
  ($dbv42171$tq-dbms-sql-14-conversion-functions-4$dbv42171$, $dbv42172$pt-dbms-sql-14-conversion-functions$dbv42172$,
   $dbv42173$What extra capability does SQL Server's CONVERT() offer that CAST() does not?$dbv42173$,
   $dbv42174$["The ability to convert NULL values", "An optional 'style' argument for formatting output, commonly used with dates", "The ability to convert between numeric types only", "Automatic error suppression on invalid input"]$dbv42174$::jsonb,
   1, $dbv42175$SQL Server's CONVERT() accepts a third, optional style argument that controls output formatting (especially for dates), a feature standard CAST does not have.$dbv42175$, 1, 3),
  ($dbv42176$tq-dbms-sql-14-conversion-functions-5$dbv42176$, $dbv42177$pt-dbms-sql-14-conversion-functions$dbv42177$,
   $dbv42178$What happens when you run CAST('abc' AS INTEGER)?$dbv42178$,
   $dbv42179$["It returns 0", "It returns NULL", "It raises a conversion error", "It returns the ASCII code of 'a'"]$dbv42179$::jsonb,
   2, $dbv42180$'abc' is not a valid numeric string, so attempting to CAST it to INTEGER raises a conversion error in virtually every SQL dialect.$dbv42180$, 1, 4),
  ($dbv42181$tq-dbms-sql-14-conversion-functions-6$dbv42181$, $dbv42182$pt-dbms-sql-14-conversion-functions$dbv42182$,
   $dbv42183$What does CAST(NULL AS INTEGER) return?$dbv42183$,
   $dbv42184$["0", "An error", "A typed NULL value", "The string 'NULL'"]$dbv42184$::jsonb,
   2, $dbv42185$Casting NULL to any type succeeds and simply produces a NULL of that target type — there's no value to convert, so no error occurs.$dbv42185$, 1, 5),
  ($dbv42186$tq-dbms-sql-14-conversion-functions-7$dbv42186$, $dbv42187$pt-dbms-sql-14-conversion-functions$dbv42187$,
   $dbv42188$Which SQL Server function returns NULL instead of raising an error when a conversion fails on invalid input?$dbv42188$,
   $dbv42189$["SAFE_CAST()", "TRY_CAST()", "NULL_CAST()", "SOFT_CONVERT()"]$dbv42189$::jsonb,
   1, $dbv42190$SQL Server's TRY_CAST() (and TRY_CONVERT()) attempts the conversion and returns NULL on failure instead of throwing an error, which is useful for cleaning messy data.$dbv42190$, 1, 6),
  ($dbv42191$tq-dbms-sql-14-conversion-functions-8$dbv42191$, $dbv42192$pt-dbms-sql-14-conversion-functions$dbv42192$,
   $dbv42193$Why might relying on implicit type conversion (instead of an explicit CAST) be risky in a WHERE clause comparing a column to a literal?$dbv42193$,
   $dbv42194$["Implicit conversion is not supported by any engine", "It can silently produce unexpected results and, on some engines, prevent efficient index usage on that column", "It always causes a syntax error", "It converts every value to VARCHAR regardless of context"]$dbv42194$::jsonb,
   1, $dbv42195$Implicit conversion can behave unpredictably across engines and data, and in some cases keeps the query planner from using an index efficiently on the converted column — explicit CAST makes intent clear and behavior predictable.$dbv42195$, 1, 7)
on conflict (id) do nothing;

-- 14.12 Conditional Functions
with g as (select id from public.learning_grids where lower(slug) = $dbv42196$dbms-sql-tutorial$dbv42196$),
     s as (select id from public.learning_sections where lower(slug) = $dbv42197$chapter-14-sql-functions$dbv42197$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv42198$Conditional Functions$dbv42198$, $dbv42199$conditional-functions$dbv42199$, '', 12, 'published', true, true, $dbv42200$dbms_sql_tutorial$dbv42200$, $dbv42201$chapter-14-sql-functions/conditional-functions$dbv42201$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv42202$dbms_sql_tutorial$dbv42202$ and source_ref = $dbv42203$chapter-14-sql-functions/conditional-functions$dbv42203$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv42204$Conditional Functions$dbv42204$, $dbv42205$### CASE WHEN as a Value-Producing Expression

Chapter 12 introduced `CASE WHEN` as a filtering-adjacent tool inside `WHERE`/`ORDER BY`. Here, treat it as a general **function-like expression that produces a value per row** — most commonly used to derive a new computed column.

```sql
SELECT
  customer_name,
  amount,
  CASE
    WHEN amount IS NULL   THEN 'unknown'
    WHEN amount < 200      THEN 'low'
    WHEN amount < 350      THEN 'medium'
    ELSE                        'high'
  END AS price_tier
FROM orders;
```

Result:

| customer_name | amount | price_tier |
|---|---|---|
| Alice | 250.00 | medium |
| Bob | NULL | unknown |
| Alice | 400.00 | high |
| Charlie | 150.00 | low |
| Bob | 300.00 | medium |

`CASE` evaluates its `WHEN` clauses **top to bottom** and returns the value from the *first* one that matches; if none match, it returns the `ELSE` value (or `NULL` if there's no `ELSE`).

### Simple CASE Form

There's also a shorter "simple" form for equality checks against one expression:

```sql
SELECT status,
       CASE status
         WHEN 'completed' THEN 'Order fulfilled'
         WHEN 'pending'   THEN 'Awaiting fulfillment'
         WHEN 'cancelled' THEN 'Order cancelled'
         ELSE 'Unknown status'
       END AS status_description
FROM orders;
```

This is equivalent to a searched `CASE WHEN status = 'completed' THEN ...` chain, just terser when every branch tests the same column for equality.

### IF() / IIF() — Dialect-Specific Two-Branch Shorthand

For a simple two-outcome decision, some dialects offer a shorter function:

```sql
-- MySQL / SQLite
SELECT IF(amount > 300, 'expensive', 'affordable') AS bucket FROM orders;

-- SQL Server
SELECT IIF(amount > 300, 'expensive', 'affordable') AS bucket FROM orders;
```

`IF(condition, value_if_true, value_if_false)` (MySQL/SQLite) and `IIF(condition, value_if_true, value_if_false)` (SQL Server) are both shorthand for a two-branch `CASE WHEN condition THEN value_if_true ELSE value_if_false END`. Neither is standard SQL — PostgreSQL, for example, has no `IF()` expression function and requires the full `CASE WHEN` form.

### Nested/Combined Use

```sql
SELECT customer_name,
       CASE
         WHEN status = 'cancelled' THEN 0
         ELSE amount
       END AS billable_amount
FROM orders;
```

This zeroes out cancelled orders for a billing report while leaving other amounts as-is — a pattern often used just before an aggregate like `SUM(billable_amount)`.

### Edge Cases

- `CASE` with no matching `WHEN` and no `ELSE` returns `NULL` — a very common source of "why is this column NULL?" bugs when someone forgot the `ELSE`.
- All branches of a `CASE` expression should ideally return a compatible/comparable type; mixing, say, a number in one branch and text in another can cause an implicit-conversion surprise or an outright type error depending on the engine.
- `IF()`/`IIF()` only handle exactly two outcomes; for three or more branches, a full `CASE WHEN` is required (or nested `IF`s, which quickly become unreadable).

### Key Takeaways / Interview Q&A

**Q: How does CASE differ when used as a value expression vs. inside a WHERE clause (Chapter 12)?**
A: The mechanics are identical (evaluate WHEN clauses top-down, return the first match's value); the difference is purely where it's used — as a filtering condition vs. as a computed output column.

**Q: What does CASE return if no WHEN matches and there's no ELSE?**
A: NULL.

**Q: What's the difference between IF() and IIF()?**
A: They do the same thing (a two-branch conditional shorthand) but are named differently by dialect: IF() in MySQL/SQLite, IIF() in SQL Server. Neither exists in PostgreSQL, which requires CASE WHEN.

**Q: When would you prefer full CASE WHEN over IF()/IIF()?**
A: Whenever you have more than two possible outcomes, or need portability across dialects that don't support IF()/IIF() (like PostgreSQL).$dbv42205$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv42206$dbms_sql_tutorial_seed$dbv42206$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv42207$dbms_sql_tutorial_seed$dbv42207$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv42208$dbms-sql-tutorial$dbv42208$),
     t as (select id from public.learning_topics where source_kind = $dbv42209$dbms_sql_tutorial$dbv42209$ and source_ref = $dbv42210$chapter-14-sql-functions/conditional-functions$dbv42210$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv42211$pt-dbms-sql-14-conditional-functions$dbv42211$, $dbv42212$Conditional Functions - Quick Test$dbv42212$, 'aptitude', 8, 8,
  $dbv42213$8 questions on Conditional Functions.$dbv42213$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv42214$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv42214$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv42215$tq-dbms-sql-14-conditional-functions-1$dbv42215$, $dbv42216$pt-dbms-sql-14-conditional-functions$dbv42216$,
   $dbv42217$In the price_tier CASE expression, what value does an order with amount = 400.00 receive (given branches: <200 'low', <350 'medium', else 'high')?$dbv42217$,
   $dbv42218$["'low'", "'medium'", "'high'", "'unknown'"]$dbv42218$::jsonb,
   2, $dbv42219$400.00 is not less than 200 or 350, so it falls through to the ELSE branch, 'high'.$dbv42219$, 1, 0),
  ($dbv42220$tq-dbms-sql-14-conditional-functions-2$dbv42220$, $dbv42221$pt-dbms-sql-14-conditional-functions$dbv42221$,
   $dbv42222$What does a CASE expression return if none of its WHEN conditions match and there is no ELSE clause?$dbv42222$,
   $dbv42223$["0", "An empty string", "NULL", "It raises an error"]$dbv42223$::jsonb,
   2, $dbv42224$Without an ELSE, a CASE expression with no matching WHEN simply evaluates to NULL rather than erroring.$dbv42224$, 1, 1),
  ($dbv42225$tq-dbms-sql-14-conditional-functions-3$dbv42225$, $dbv42226$pt-dbms-sql-14-conditional-functions$dbv42226$,
   $dbv42227$Which dialect does NOT support IF() or IIF() as a shorthand conditional function, requiring full CASE WHEN instead?$dbv42227$,
   $dbv42228$["MySQL", "SQLite", "SQL Server", "PostgreSQL"]$dbv42228$::jsonb,
   3, $dbv42229$PostgreSQL has no IF()/IIF() expression function; MySQL and SQLite use IF(), and SQL Server uses IIF().$dbv42229$, 1, 2),
  ($dbv42230$tq-dbms-sql-14-conditional-functions-4$dbv42230$, $dbv42231$pt-dbms-sql-14-conditional-functions$dbv42231$,
   $dbv42232$In a searched CASE expression, what order are the WHEN clauses evaluated in?$dbv42232$,
   $dbv42233$["Bottom to top", "In random order chosen by the optimizer", "Top to bottom, stopping at the first match", "All at once, and ties are resolved alphabetically"]$dbv42233$::jsonb,
   2, $dbv42234$CASE evaluates WHEN clauses in the order they're written and returns the value from the first one that matches.$dbv42234$, 1, 3),
  ($dbv42235$tq-dbms-sql-14-conditional-functions-5$dbv42235$, $dbv42236$pt-dbms-sql-14-conditional-functions$dbv42236$,
   $dbv42237$What does IIF(amount > 300, 'expensive', 'affordable') evaluate to for amount = 250.00?$dbv42237$,
   $dbv42238$["'expensive'", "'affordable'", "NULL", "An error"]$dbv42238$::jsonb,
   1, $dbv42239$250.00 is not greater than 300, so the false branch, 'affordable', is returned.$dbv42239$, 1, 4),
  ($dbv42240$tq-dbms-sql-14-conditional-functions-6$dbv42240$, $dbv42241$pt-dbms-sql-14-conditional-functions$dbv42241$,
   $dbv42242$Which SQL Server expression is functionally equivalent to CASE WHEN amount > 300 THEN 'expensive' ELSE 'affordable' END?$dbv42242$,
   $dbv42243$["IF(amount > 300, 'expensive', 'affordable')", "IIF(amount > 300, 'expensive', 'affordable')", "SWITCH(amount > 300, 'expensive', 'affordable')", "COALESCE(amount > 300, 'expensive', 'affordable')"]$dbv42243$::jsonb,
   1, $dbv42244$IIF() is SQL Server's two-branch conditional shorthand, directly equivalent to a simple CASE WHEN...ELSE...END with one condition.$dbv42244$, 1, 5),
  ($dbv42245$tq-dbms-sql-14-conditional-functions-7$dbv42245$, $dbv42246$pt-dbms-sql-14-conditional-functions$dbv42246$,
   $dbv42247$Why can't IF()/IIF() directly replace a CASE expression with four possible output tiers (e.g. low/medium/high/unknown)?$dbv42247$,
   $dbv42248$["IF()/IIF() can handle any number of branches natively", "IF()/IIF() only support exactly two outcomes (true/false branches), so more than two tiers require nested IFs or a full CASE WHEN", "IF()/IIF() cannot return string values", "IF()/IIF() are aggregate functions and cannot be used per-row"]$dbv42248$::jsonb,
   1, $dbv42249$IF()/IIF() are strictly two-branch conditionals; representing more outcomes requires nesting them (quickly unreadable) or switching to a full CASE WHEN chain.$dbv42249$, 1, 6),
  ($dbv42250$tq-dbms-sql-14-conditional-functions-8$dbv42250$, $dbv42251$pt-dbms-sql-14-conditional-functions$dbv42251$,
   $dbv42252$What is a likely consequence of mixing incompatible return types across CASE branches, e.g. returning a number in one branch and text in another?$dbv42252$,
   $dbv42253$["SQL always silently converts everything to VARCHAR with no issue", "It can trigger an implicit-conversion surprise or an outright type error, depending on the engine", "CASE expressions ignore type mismatches entirely", "The query always returns NULL for every row in that case"]$dbv42253$::jsonb,
   1, $dbv42254$CASE branches should return compatible types; mismatched types can force implicit conversion (sometimes unexpected) or cause a hard type error, depending on the specific engine's rules.$dbv42254$, 1, 7)
on conflict (id) do nothing;

-- 14.13 NULL Functions
with g as (select id from public.learning_grids where lower(slug) = $dbv42255$dbms-sql-tutorial$dbv42255$),
     s as (select id from public.learning_sections where lower(slug) = $dbv42256$chapter-14-sql-functions$dbv42256$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbv42257$NULL Functions$dbv42257$, $dbv42258$null-functions$dbv42258$, '', 13, 'published', true, true, $dbv42259$dbms_sql_tutorial$dbv42259$, $dbv42260$chapter-14-sql-functions/null-functions$dbv42260$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbv42261$dbms_sql_tutorial$dbv42261$ and source_ref = $dbv42262$chapter-14-sql-functions/null-functions$dbv42262$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbv42263$NULL Functions$dbv42263$, $dbv42264$### Handling NULL with Dedicated Functions

Chapter 12 introduced `COALESCE` as a general NULL-handling tool. This topic rounds out the picture with `COALESCE`'s dialect-specific two-argument cousins, and flags one genuinely confusing naming collision.

### COALESCE — Quick Recap

```sql
SELECT COALESCE(amount, 0) AS amount_or_zero FROM orders;
```

`COALESCE(a, b, c, ...)` returns the first non-NULL argument in its list — it can take **any number** of arguments and is standard SQL, portable across every major dialect. For Bob's `NULL` amount, this returns `0`; for every other row, it returns the actual `amount`.

### IFNULL() — MySQL/SQLite's Two-Argument Shortcut

```sql
-- MySQL / SQLite
SELECT IFNULL(amount, 0) AS amount_or_zero FROM orders;
```

`IFNULL(expr, replacement)` takes **exactly two** arguments and returns `expr` if it's non-NULL, otherwise `replacement`. It behaves identically to `COALESCE(expr, replacement)` when there are only two arguments — it's simply a shorter, dialect-specific spelling for the common two-argument case.

### NVL() — Oracle's Two-Argument Shortcut

```sql
-- Oracle
SELECT NVL(amount, 0) AS amount_or_zero FROM orders;
```

`NVL(expr, replacement)` is Oracle's equivalent of `IFNULL()` — same two-argument behavior, different name. Oracle also supports `NVL2(expr, value_if_not_null, value_if_null)`, a three-argument variant with no direct MySQL/SQLite equivalent.

### The ISNULL() Naming Collision — A Genuine Gotcha

SQL Server has a function called `ISNULL()`:

```sql
-- SQL Server
SELECT ISNULL(amount, 0) AS amount_or_zero FROM orders;
```

**This looks like it should test "is this value NULL?" but it does NOT.** SQL Server's `ISNULL(expr, replacement)` is a **NULL-replacement function** — functionally equivalent to `IFNULL()`/`NVL()`/two-argument `COALESCE()`. It returns `expr` if non-NULL, otherwise `replacement`.

The actual "is this value NULL?" **operator**, in every SQL dialect including SQL Server, is spelled with a space: `IS NULL`.

```sql
-- Testing for NULL — the actual boolean predicate, used in WHERE
SELECT * FROM orders WHERE amount IS NULL;
-- returns Bob's row

-- Replacing a NULL with a fallback — SQL Server's function (not the same thing at all)
SELECT ISNULL(amount, 0) FROM orders;
-- returns every row's amount, substituting 0 for Bob's NULL
```

`ISNULL(amount, 0)` and `amount IS NULL` do completely different things despite the near-identical name — one returns a *value* (a NULL-replaced amount), the other returns a *boolean* (true/false, usable in `WHERE`). This is a classic interview trick question and a real-world source of confusion for developers moving between dialects, since `ISNULL()` doesn't even exist as a function name outside SQL Server (other dialects only have the `IS NULL` operator, plus their own two-argument replacement functions under different names).

### Summary Table

| Dialect | Two-arg NULL-replacement function |
|---|---|
| Standard SQL (any dialect) | `COALESCE(expr, replacement)` |
| MySQL / SQLite | `IFNULL(expr, replacement)` |
| Oracle | `NVL(expr, replacement)` |
| SQL Server | `ISNULL(expr, replacement)` (function — NOT the `IS NULL` operator) |

### Edge Cases

- `COALESCE` short-circuits: it stops evaluating arguments once it finds the first non-NULL one, which matters if a later argument is an expensive subquery.
- SQL Server's `ISNULL()` has a subtle additional quirk: it infers its result data type from the *first* argument, which can silently truncate a longer replacement string, whereas `COALESCE` follows standard type-precedence rules across all arguments — another reason to prefer `COALESCE` for portable code.
- `NULL = NULL` evaluates to `NULL` (not `TRUE`), which is precisely why a dedicated `IS NULL` operator (rather than `= NULL`) is required to test for NULL — this ties back to the three-valued logic covered in earlier chapters.

### Key Takeaways / Interview Q&A

**Q: What's the difference between COALESCE and IFNULL/NVL?**
A: COALESCE is standard SQL and accepts any number of arguments, returning the first non-NULL one. IFNULL (MySQL/SQLite) and NVL (Oracle) are dialect-specific shortcuts that only accept exactly two arguments, equivalent to a two-argument COALESCE.

**Q: Does SQL Server's ISNULL() test whether a value is NULL?**
A: No — despite the name, ISNULL(expr, replacement) is a NULL-replacement function, functionally like IFNULL/NVL. The actual test-for-NULL operator, in every dialect, is `IS NULL` (with a space).

**Q: Why can't you write `WHERE amount = NULL` to find NULL rows?**
A: Because NULL = NULL evaluates to NULL (not TRUE) under SQL's three-valued logic, so the condition never matches. You must use `WHERE amount IS NULL` instead.

**Q: Name Oracle's three-argument NULL-handling function.**
A: NVL2(expr, value_if_not_null, value_if_null) — it branches on whether expr is NULL, unlike two-argument NVL which just supplies a replacement value.$dbv42264$, 'markdown', 0, 'published', jsonb_build_object('source', $dbv42265$dbms_sql_tutorial_seed$dbv42265$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbv42266$dbms_sql_tutorial_seed$dbv42266$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbv42267$dbms-sql-tutorial$dbv42267$),
     t as (select id from public.learning_topics where source_kind = $dbv42268$dbms_sql_tutorial$dbv42268$ and source_ref = $dbv42269$chapter-14-sql-functions/null-functions$dbv42269$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbv42270$pt-dbms-sql-14-null-functions$dbv42270$, $dbv42271$NULL Functions - Quick Test$dbv42271$, 'aptitude', 8, 8,
  $dbv42272$8 questions on NULL Functions.$dbv42272$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbv42273$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbv42273$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbv42274$tq-dbms-sql-14-null-functions-1$dbv42274$, $dbv42275$pt-dbms-sql-14-null-functions$dbv42275$,
   $dbv42276$What does COALESCE(amount, 0) return for a row where amount is NULL?$dbv42276$,
   $dbv42277$["NULL", "0", "An error", "-1"]$dbv42277$::jsonb,
   1, $dbv42278$COALESCE returns the first non-NULL argument in its list; since amount is NULL, it falls through to the next argument, 0.$dbv42278$, 1, 0),
  ($dbv42279$tq-dbms-sql-14-null-functions-2$dbv42279$, $dbv42280$pt-dbms-sql-14-null-functions$dbv42280$,
   $dbv42281$Which two dialects commonly provide IFNULL() as a two-argument NULL-replacement shortcut?$dbv42281$,
   $dbv42282$["Oracle and SQL Server", "MySQL and SQLite", "PostgreSQL and Oracle", "SQL Server and PostgreSQL"]$dbv42282$::jsonb,
   1, $dbv42283$IFNULL(expr, replacement) is a MySQL/SQLite convenience function equivalent to a two-argument COALESCE.$dbv42283$, 1, 1),
  ($dbv42284$tq-dbms-sql-14-null-functions-3$dbv42284$, $dbv42285$pt-dbms-sql-14-null-functions$dbv42285$,
   $dbv42286$What is Oracle's equivalent of MySQL's IFNULL() function?$dbv42286$,
   $dbv42287$["ISNULL()", "NVL()", "COALESCE2()", "NULLIF()"]$dbv42287$::jsonb,
   1, $dbv42288$NVL(expr, replacement) is Oracle's two-argument NULL-replacement function, functionally equivalent to IFNULL().$dbv42288$, 1, 2),
  ($dbv42289$tq-dbms-sql-14-null-functions-4$dbv42289$, $dbv42290$pt-dbms-sql-14-null-functions$dbv42290$,
   $dbv42291$In SQL Server, what does ISNULL(amount, 0) actually do?$dbv42291$,
   $dbv42292$["Returns TRUE or FALSE depending on whether amount is NULL", "Returns amount if it's non-NULL, otherwise returns 0 \u2014 it's a NULL-replacement function, not a NULL test", "Deletes rows where amount is NULL", "Throws an error if amount is NULL"]$dbv42292$::jsonb,
   1, $dbv42293$Despite its name suggesting a NULL test, SQL Server's ISNULL() is a two-argument NULL-replacement function, just like IFNULL()/NVL().$dbv42293$, 1, 3),
  ($dbv42294$tq-dbms-sql-14-null-functions-5$dbv42294$, $dbv42295$pt-dbms-sql-14-null-functions$dbv42295$,
   $dbv42296$What is the correct way to test whether a column's value is NULL in a WHERE clause, across all SQL dialects?$dbv42296$,
   $dbv42297$["WHERE amount = NULL", "WHERE ISNULL(amount)", "WHERE amount IS NULL", "WHERE amount == NULL"]$dbv42297$::jsonb,
   2, $dbv42298$IS NULL (with a space) is the universal operator for testing NULL; = NULL never works because NULL = NULL evaluates to NULL, not TRUE.$dbv42298$, 1, 4),
  ($dbv42299$tq-dbms-sql-14-null-functions-6$dbv42299$, $dbv42300$pt-dbms-sql-14-null-functions$dbv42300$,
   $dbv42301$Why does the condition amount = NULL never match any rows, even ones where amount actually is NULL?$dbv42301$,
   $dbv42302$["Because = is reserved and cannot be used with NULL under any circumstances", "Because NULL = NULL evaluates to NULL (not TRUE) under SQL's three-valued logic, so the WHERE clause never treats it as a match", "Because NULL is automatically converted to the string 'NULL' before comparison", "Because amount = NULL is a syntax error, not a logical issue"]$dbv42302$::jsonb,
   1, $dbv42303$Under three-valued logic, any comparison involving NULL (including NULL = NULL) evaluates to NULL, which WHERE treats as 'not a match' — hence the need for the dedicated IS NULL operator.$dbv42303$, 1, 5),
  ($dbv42304$tq-dbms-sql-14-null-functions-7$dbv42304$, $dbv42305$pt-dbms-sql-14-null-functions$dbv42305$,
   $dbv42306$What does Oracle's NVL2(expr, value_if_not_null, value_if_null) do differently from two-argument NVL()?$dbv42306$,
   $dbv42307$["It behaves identically to NVL() with no differences", "It branches to one of two different replacement values depending on whether expr is NULL, rather than just substituting one fallback", "It only works with numeric expressions", "It tests for NULL and returns a boolean"]$dbv42307$::jsonb,
   1, $dbv42308$NVL2 takes three arguments and returns value_if_not_null when expr is non-NULL, or value_if_null when it is NULL — a genuine two-way branch, unlike NVL's single fallback value.$dbv42308$, 1, 6),
  ($dbv42309$tq-dbms-sql-14-null-functions-8$dbv42309$, $dbv42310$pt-dbms-sql-14-null-functions$dbv42310$,
   $dbv42311$Why might COALESCE be preferred over SQL Server's ISNULL() for portable, safe code involving string replacements?$dbv42311$,
   $dbv42312$["COALESCE cannot be used with string types", "ISNULL() infers its result type from only the first argument, which can silently truncate a longer replacement string, while COALESCE applies standard type-precedence across all arguments", "ISNULL() only accepts numeric arguments", "COALESCE always returns NULL when used with strings"]$dbv42312$::jsonb,
   1, $dbv42313$SQL Server's ISNULL() bases its output type on the first argument alone, risking silent truncation of a longer second argument, whereas COALESCE follows standard SQL type-precedence rules across every argument — making it safer and more portable.$dbv42313$, 1, 7)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. CHAPTER TESTS — one per new chapter (3, 4, 5). Pools are LIVE joins via
--    practice_test_pool() (0091/063); no test_questions of their own.
-- ===========================================================================
with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbv42314$chapter-12-select-and-filtering$dbv42314$ and lower(g.slug) = $dbv42315$dbms-sql-tutorial$dbv42315$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbv42316$pt-dbms-sql-ch12-test$dbv42316$, $dbv42317$SELECT and Filtering - Chapter Test$dbv42317$, 'aptitude', sec.id, 'chapter', true, 18,
  23,
  $dbv42318$18 randomly-sampled questions drawn from every SELECT and Filtering topic quiz.$dbv42318$,
  'published', true, true, true, 'Medium', 0,
  $dbv42319$This test randomly samples 18 questions from all of Chapter 12's topic quizzes. Each carries 1 mark. No negative marking. You have 23 minutes.$dbv42319$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbv42320$chapter-13-sorting-and-pagination$dbv42320$ and lower(g.slug) = $dbv42321$dbms-sql-tutorial$dbv42321$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbv42322$pt-dbms-sql-ch13-test$dbv42322$, $dbv42323$Sorting and Pagination - Chapter Test$dbv42323$, 'aptitude', sec.id, 'chapter', true, 12,
  17,
  $dbv42324$12 randomly-sampled questions drawn from every Sorting and Pagination topic quiz.$dbv42324$,
  'published', true, true, true, 'Medium', 0,
  $dbv42325$This test randomly samples 12 questions from all of Chapter 13's topic quizzes. Each carries 1 mark. No negative marking. You have 17 minutes.$dbv42325$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbv42326$chapter-14-sql-functions$dbv42326$ and lower(g.slug) = $dbv42327$dbms-sql-tutorial$dbv42327$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbv42328$pt-dbms-sql-ch14-test$dbv42328$, $dbv42329$SQL Functions - Chapter Test$dbv42329$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dbv42330$15 randomly-sampled questions drawn from every SQL Functions topic quiz.$dbv42330$,
  'published', true, true, true, 'Medium', 0,
  $dbv42331$This test randomly samples 15 questions from all of Chapter 14's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dbv42331$
from sec
on conflict (id) do nothing;

-- ===========================================================================
-- 4. SQL CODING PROBLEMS (Chapter 9 DDL-writing, Chapter 10 constraint-
--    violation-finding, Chapter 11 DML-writing — every problem verified
--    end-to-end against Paiza's live MySQL sandbox, 2026-09).
-- ===========================================================================
-- Expensive Electronics (topic chapter-12-select-and-filtering/where)
with t as (select id from public.learning_topics where source_kind = $dbv42335$dbms_sql_tutorial$dbv42335$ and source_ref = $dbv42336$chapter-12-select-and-filtering/where$dbv42336$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42337$cp-dbms-sql-expensive-electronics$dbv42337$, null::text, $dbv42338$Expensive Electronics$dbv42338$, $dbv42339$Easy$dbv42339$, $dbv42340$expensive-electronics$dbv42340$,
  $dbv42341$Write a query returning `id`, `name`, `price` for every product in the `'Electronics'` category priced above 50000, ordered by `id`. (This case may legitimately return zero rows if no product matches.)

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);
```
$dbv42341$,
  $dbv42332$[{"input": "", "output": "id\tname\tprice\n1\tProLaptop\t85000"}]$dbv42332$::jsonb, $dbv42333$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price, stock) VALUES\n(1, 'ProTablet', 'Electronics', 32000, 4),\n(2, 'Pencil Set', 'Stationery', 60, NULL),\n(3, 'SQL Guide', 'Books', 500, 10),\n(4, 'ProSpeaker', 'Electronics', 6000, 0);", "expected": ""}]$dbv42333$::jsonb, jsonb_build_object('sql', $dbv42334$-- Write your SELECT query here
$dbv42334$),
  $dbv42342$Combine an equality check with a comparison using AND. Reference: `SELECT id, name, price FROM products WHERE category = 'Electronics' AND price > 50000 ORDER BY id;`$dbv42342$, array['sql'], $dbv42343$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);$dbv42343$, $dbv42344$INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);$dbv42344$, $dbv42345$$dbv42345$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Mid-Range Prices (topic chapter-12-select-and-filtering/between)
with t as (select id from public.learning_topics where source_kind = $dbv42349$dbms_sql_tutorial$dbv42349$ and source_ref = $dbv42350$chapter-12-select-and-filtering/between$dbv42350$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42351$cp-dbms-sql-mid-range-prices$dbv42351$, null::text, $dbv42352$Mid-Range Prices$dbv42352$, $dbv42353$Easy$dbv42353$, $dbv42354$mid-range-prices$dbv42354$,
  $dbv42355$Write a query returning `id`, `name`, `price` for every product priced between 200 and 1000 (inclusive), ordered by `id`.

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);
```
$dbv42355$,
  $dbv42346$[{"input": "", "output": "id\tname\tprice\n3\tPython Basics\t350\n5\tNovel\t220\n6\tDesk Lamp\t900"}]$dbv42346$::jsonb, $dbv42347$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price, stock) VALUES\n(1, 'ProTablet', 'Electronics', 32000, 4),\n(2, 'Pencil Set', 'Stationery', 60, NULL),\n(3, 'SQL Guide', 'Books', 500, 10),\n(4, 'ProSpeaker', 'Electronics', 6000, 0);", "expected": "id\tname\tprice\n3\tSQL Guide\t500"}]$dbv42347$::jsonb, jsonb_build_object('sql', $dbv42348$-- Write your SELECT query here
$dbv42348$),
  $dbv42356$BETWEEN is inclusive of both endpoints. Reference: `SELECT id, name, price FROM products WHERE price BETWEEN 200 AND 1000 ORDER BY id;`$dbv42356$, array['sql'], $dbv42357$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);$dbv42357$, $dbv42358$INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);$dbv42358$, $dbv42359$$dbv42359$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Electronics or Books (topic chapter-12-select-and-filtering/in)
with t as (select id from public.learning_topics where source_kind = $dbv42363$dbms_sql_tutorial$dbv42363$ and source_ref = $dbv42364$chapter-12-select-and-filtering/in$dbv42364$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42365$cp-dbms-sql-electronics-or-books$dbv42365$, null::text, $dbv42366$Electronics or Books$dbv42366$, $dbv42367$Easy$dbv42367$, $dbv42368$electronics-or-books$dbv42368$,
  $dbv42369$Write a query returning `id`, `name`, `category` for every product in either the `'Electronics'` or `'Books'` category, ordered by `id`.

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);
```
$dbv42369$,
  $dbv42360$[{"input": "", "output": "id\tname\tcategory\n1\tProLaptop\tElectronics\n3\tPython Basics\tBooks\n4\tProPhone\tElectronics\n5\tNovel\tBooks"}]$dbv42360$::jsonb, $dbv42361$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price, stock) VALUES\n(1, 'ProTablet', 'Electronics', 32000, 4),\n(2, 'Pencil Set', 'Stationery', 60, NULL),\n(3, 'SQL Guide', 'Books', 500, 10),\n(4, 'ProSpeaker', 'Electronics', 6000, 0);", "expected": "id\tname\tcategory\n1\tProTablet\tElectronics\n3\tSQL Guide\tBooks\n4\tProSpeaker\tElectronics"}]$dbv42361$::jsonb, jsonb_build_object('sql', $dbv42362$-- Write your SELECT query here
$dbv42362$),
  $dbv42370$IN checks membership against a list, avoiding repeated OR-equality checks. Reference: `SELECT id, name, category FROM products WHERE category IN ('Electronics', 'Books') ORDER BY id;`$dbv42370$, array['sql'], $dbv42371$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);$dbv42371$, $dbv42372$INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);$dbv42372$, $dbv42373$$dbv42373$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Names Starting with Pro (topic chapter-12-select-and-filtering/like)
with t as (select id from public.learning_topics where source_kind = $dbv42377$dbms_sql_tutorial$dbv42377$ and source_ref = $dbv42378$chapter-12-select-and-filtering/like$dbv42378$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42379$cp-dbms-sql-names-starting-with-pro$dbv42379$, null::text, $dbv42380$Names Starting with Pro$dbv42380$, $dbv42381$Easy$dbv42381$, $dbv42382$names-starting-with-pro$dbv42382$,
  $dbv42383$Write a query returning `id`, `name` for every product whose name starts with `'Pro'`, ordered by `id`.

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);
```
$dbv42383$,
  $dbv42374$[{"input": "", "output": "id\tname\n1\tProLaptop\n4\tProPhone"}]$dbv42374$::jsonb, $dbv42375$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price, stock) VALUES\n(1, 'ProTablet', 'Electronics', 32000, 4),\n(2, 'Pencil Set', 'Stationery', 60, NULL),\n(3, 'SQL Guide', 'Books', 500, 10),\n(4, 'ProSpeaker', 'Electronics', 6000, 0);", "expected": "id\tname\n1\tProTablet\n4\tProSpeaker"}]$dbv42375$::jsonb, jsonb_build_object('sql', $dbv42376$-- Write your SELECT query here
$dbv42376$),
  $dbv42384$A trailing % wildcard matches any suffix after the fixed prefix. Reference: `SELECT id, name FROM products WHERE name LIKE 'Pro%' ORDER BY id;`$dbv42384$, array['sql'], $dbv42385$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);$dbv42385$, $dbv42386$INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);$dbv42386$, $dbv42387$$dbv42387$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Price Tiers (topic chapter-12-select-and-filtering/case)
with t as (select id from public.learning_topics where source_kind = $dbv42391$dbms_sql_tutorial$dbv42391$ and source_ref = $dbv42392$chapter-12-select-and-filtering/case$dbv42392$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42393$cp-dbms-sql-price-tiers$dbv42393$, null::text, $dbv42394$Price Tiers$dbv42394$, $dbv42395$Medium$dbv42395$, $dbv42396$price-tiers$dbv42396$,
  $dbv42397$Write a query returning `id`, `name`, and a computed `tier` column: `'Budget'` if price < 300, `'Mid'` if price is between 300 and 1000 inclusive, otherwise `'Premium'`. Order by `id`.

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);
```
$dbv42397$,
  $dbv42388$[{"input": "", "output": "id\tname\ttier\n1\tProLaptop\tPremium\n2\tNotebook\tBudget\n3\tPython Basics\tMid\n4\tProPhone\tPremium\n5\tNovel\tBudget\n6\tDesk Lamp\tMid"}]$dbv42388$::jsonb, $dbv42389$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price, stock) VALUES\n(1, 'ProTablet', 'Electronics', 32000, 4),\n(2, 'Pencil Set', 'Stationery', 60, NULL),\n(3, 'SQL Guide', 'Books', 500, 10),\n(4, 'ProSpeaker', 'Electronics', 6000, 0);", "expected": "id\tname\ttier\n1\tProTablet\tPremium\n2\tPencil Set\tBudget\n3\tSQL Guide\tMid\n4\tProSpeaker\tPremium"}]$dbv42389$::jsonb, jsonb_build_object('sql', $dbv42390$-- Write your SELECT query here
$dbv42390$),
  $dbv42398$CASE evaluates conditions top-to-bottom; order the branches from most specific to least. Reference: `SELECT id, name, CASE WHEN price < 300 THEN 'Budget' WHEN price <= 1000 THEN 'Mid' ELSE 'Premium' END AS tier FROM products ORDER BY id;`$dbv42398$, array['sql'], $dbv42399$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);$dbv42399$, $dbv42400$INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);$dbv42400$, $dbv42401$$dbv42401$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Stock With a Default (topic chapter-12-select-and-filtering/coalesce)
with t as (select id from public.learning_topics where source_kind = $dbv42405$dbms_sql_tutorial$dbv42405$ and source_ref = $dbv42406$chapter-12-select-and-filtering/coalesce$dbv42406$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42407$cp-dbms-sql-stock-with-a-default$dbv42407$, null::text, $dbv42408$Stock With a Default$dbv42408$, $dbv42409$Easy$dbv42409$, $dbv42410$stock-with-a-default$dbv42410$,
  $dbv42411$Some products have a `NULL` stock (never counted). Write a query returning `id`, `name`, and a `stock` column that shows 0 instead of NULL when stock hasn't been counted, ordered by `id`.

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);
```
$dbv42411$,
  $dbv42402$[{"input": "", "output": "id\tname\tstock\n1\tProLaptop\t12\n2\tNotebook\t0\n3\tPython Basics\t5\n4\tProPhone\t0\n5\tNovel\t0\n6\tDesk Lamp\t8"}]$dbv42402$::jsonb, $dbv42403$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price, stock) VALUES\n(1, 'ProTablet', 'Electronics', 32000, 4),\n(2, 'Pencil Set', 'Stationery', 60, NULL),\n(3, 'SQL Guide', 'Books', 500, 10),\n(4, 'ProSpeaker', 'Electronics', 6000, 0);", "expected": "id\tname\tstock\n1\tProTablet\t4\n2\tPencil Set\t0\n3\tSQL Guide\t10\n4\tProSpeaker\t0"}]$dbv42403$::jsonb, jsonb_build_object('sql', $dbv42404$-- Write your SELECT query here
$dbv42404$),
  $dbv42412$COALESCE returns the first non-NULL argument. Reference: `SELECT id, name, COALESCE(stock, 0) AS stock FROM products ORDER BY id;`$dbv42412$, array['sql'], $dbv42413$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER
);$dbv42413$, $dbv42414$INSERT INTO products (id, name, category, price, stock) VALUES
(1, 'ProLaptop', 'Electronics', 85000, 12),
(2, 'Notebook', 'Stationery', 40, NULL),
(3, 'Python Basics', 'Books', 350, 5),
(4, 'ProPhone', 'Electronics', 45000, 0),
(5, 'Novel', 'Books', 220, NULL),
(6, 'Desk Lamp', 'Home', 900, 8);$dbv42414$, $dbv42415$$dbv42415$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Sort by Category, Then Price Descending (topic chapter-13-sorting-and-pagination/multiple-sort-keys)
with t as (select id from public.learning_topics where source_kind = $dbv42419$dbms_sql_tutorial$dbv42419$ and source_ref = $dbv42420$chapter-13-sorting-and-pagination/multiple-sort-keys$dbv42420$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42421$cp-dbms-sql-sort-by-category-then-price-descending$dbv42421$, null::text, $dbv42422$Sort by Category, Then Price Descending$dbv42422$, $dbv42423$Medium$dbv42423$, $dbv42424$sort-by-category-then-price-descending$dbv42424$,
  $dbv42425$Write a query returning `id`, `name`, `category`, `price` for every product, sorted by `category` ascending (A-Z), and within each category by `price` descending (highest first).

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price) VALUES
(1, 'ProLaptop', 'Electronics', 85000),
(2, 'Desk Lamp', 'Home', 900),
(3, 'ProPhone', 'Electronics', 45000),
(4, 'Python Basics', 'Books', 350),
(5, 'Novel', 'Books', 220),
(6, 'Headphones', 'Electronics', 3000),
(7, 'Rug', 'Home', 4500);
```
$dbv42425$,
  $dbv42416$[{"input": "", "output": "id\tname\tcategory\tprice\n4\tPython Basics\tBooks\t350\n5\tNovel\tBooks\t220\n1\tProLaptop\tElectronics\t85000\n3\tProPhone\tElectronics\t45000\n6\tHeadphones\tElectronics\t3000\n7\tRug\tHome\t4500\n2\tDesk Lamp\tHome\t900"}]$dbv42416$::jsonb, $dbv42417$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price) VALUES\n(1, 'Tablet', 'Electronics', 20000),\n(2, 'Sofa', 'Home', 30000),\n(3, 'Speaker', 'Electronics', 5000),\n(4, 'Cookbook', 'Books', 400),\n(5, 'Chair', 'Home', 2500),\n(6, 'Mouse', 'Electronics', 900);", "expected": "id\tname\tcategory\tprice\n4\tCookbook\tBooks\t400\n1\tTablet\tElectronics\t20000\n3\tSpeaker\tElectronics\t5000\n6\tMouse\tElectronics\t900\n2\tSofa\tHome\t30000\n5\tChair\tHome\t2500"}]$dbv42417$::jsonb, jsonb_build_object('sql', $dbv42418$-- Write your SELECT query here
$dbv42418$),
  $dbv42426$The second ORDER BY key only breaks ties within the first key's groups. Reference: `SELECT id, name, category, price FROM products ORDER BY category ASC, price DESC;`$dbv42426$, array['sql'], $dbv42427$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);$dbv42427$, $dbv42428$INSERT INTO products (id, name, category, price) VALUES
(1, 'ProLaptop', 'Electronics', 85000),
(2, 'Desk Lamp', 'Home', 900),
(3, 'ProPhone', 'Electronics', 45000),
(4, 'Python Basics', 'Books', 350),
(5, 'Novel', 'Books', 220),
(6, 'Headphones', 'Electronics', 3000),
(7, 'Rug', 'Home', 4500);$dbv42428$, $dbv42429$$dbv42429$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Next Page After ID 3 (topic chapter-13-sorting-and-pagination/keyset-pagination)
with t as (select id from public.learning_topics where source_kind = $dbv42433$dbms_sql_tutorial$dbv42433$ and source_ref = $dbv42434$chapter-13-sorting-and-pagination/keyset-pagination$dbv42434$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42435$cp-dbms-sql-next-page-after-id-3$dbv42435$, null::text, $dbv42436$Next Page After ID 3$dbv42436$, $dbv42437$Medium$dbv42437$, $dbv42438$next-page-after-id-3$dbv42438$,
  $dbv42439$Using keyset pagination (not OFFSET), fetch the next page of 3 products after the last-seen `id` of 3, ordered by `id` ascending. Return `id`, `name`.

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price) VALUES
(1, 'ProLaptop', 'Electronics', 85000),
(2, 'Desk Lamp', 'Home', 900),
(3, 'ProPhone', 'Electronics', 45000),
(4, 'Python Basics', 'Books', 350),
(5, 'Novel', 'Books', 220),
(6, 'Headphones', 'Electronics', 3000),
(7, 'Rug', 'Home', 4500);
```
$dbv42439$,
  $dbv42430$[{"input": "", "output": "id\tname\n4\tPython Basics\n5\tNovel\n6\tHeadphones"}]$dbv42430$::jsonb, $dbv42431$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price) VALUES\n(1, 'Tablet', 'Electronics', 20000),\n(2, 'Sofa', 'Home', 30000),\n(3, 'Speaker', 'Electronics', 5000),\n(4, 'Cookbook', 'Books', 400),\n(5, 'Chair', 'Home', 2500),\n(6, 'Mouse', 'Electronics', 900);", "expected": "id\tname\n4\tCookbook\n5\tChair\n6\tMouse"}]$dbv42431$::jsonb, jsonb_build_object('sql', $dbv42432$-- Write your SELECT query here
$dbv42432$),
  $dbv42440$Keyset pagination filters WHERE key > last_seen_value instead of using OFFSET, staying fast regardless of page depth. Reference: `SELECT id, name FROM products WHERE id > 3 ORDER BY id ASC LIMIT 3;`$dbv42440$, array['sql'], $dbv42441$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);$dbv42441$, $dbv42442$INSERT INTO products (id, name, category, price) VALUES
(1, 'ProLaptop', 'Electronics', 85000),
(2, 'Desk Lamp', 'Home', 900),
(3, 'ProPhone', 'Electronics', 45000),
(4, 'Python Basics', 'Books', 350),
(5, 'Novel', 'Books', 220),
(6, 'Headphones', 'Electronics', 3000),
(7, 'Rug', 'Home', 4500);$dbv42442$, $dbv42443$$dbv42443$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Top 3 Most Expensive Products (topic chapter-13-sorting-and-pagination/top-n-queries)
with t as (select id from public.learning_topics where source_kind = $dbv42447$dbms_sql_tutorial$dbv42447$ and source_ref = $dbv42448$chapter-13-sorting-and-pagination/top-n-queries$dbv42448$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42449$cp-dbms-sql-top-3-most-expensive-products$dbv42449$, null::text, $dbv42450$Top 3 Most Expensive Products$dbv42450$, $dbv42451$Easy$dbv42451$, $dbv42452$top-3-most-expensive-products$dbv42452$,
  $dbv42453$Write a query returning the `id`, `name`, `price` of the 3 most expensive products, highest price first. Break ties by `id` ascending, so the result is fully deterministic.

```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO products (id, name, category, price) VALUES
(1, 'ProLaptop', 'Electronics', 85000),
(2, 'Desk Lamp', 'Home', 900),
(3, 'ProPhone', 'Electronics', 45000),
(4, 'Python Basics', 'Books', 350),
(5, 'Novel', 'Books', 220),
(6, 'Headphones', 'Electronics', 3000),
(7, 'Rug', 'Home', 4500);
```
$dbv42453$,
  $dbv42444$[{"input": "", "output": "id\tname\tprice\n1\tProLaptop\t85000\n3\tProPhone\t45000\n7\tRug\t4500"}]$dbv42444$::jsonb, $dbv42445$[{"hidden": true, "seed_sql": "INSERT INTO products (id, name, category, price) VALUES\n(1, 'Tablet', 'Electronics', 20000),\n(2, 'Sofa', 'Home', 30000),\n(3, 'Speaker', 'Electronics', 5000),\n(4, 'Cookbook', 'Books', 400),\n(5, 'Chair', 'Home', 2500),\n(6, 'Mouse', 'Electronics', 900);", "expected": "id\tname\tprice\n2\tSofa\t30000\n1\tTablet\t20000\n3\tSpeaker\t5000"}]$dbv42445$::jsonb, jsonb_build_object('sql', $dbv42446$-- Write your SELECT query here
$dbv42446$),
  $dbv42454$LIMIT after ORDER BY gives a Top-N query; a secondary tiebreaker key (id) makes ties deterministic. Reference: `SELECT id, name, price FROM products ORDER BY price DESC, id ASC LIMIT 3;`$dbv42454$, array['sql'], $dbv42455$CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);$dbv42455$, $dbv42456$INSERT INTO products (id, name, category, price) VALUES
(1, 'ProLaptop', 'Electronics', 85000),
(2, 'Desk Lamp', 'Home', 900),
(3, 'ProPhone', 'Electronics', 45000),
(4, 'Python Basics', 'Books', 350),
(5, 'Novel', 'Books', 220),
(6, 'Headphones', 'Electronics', 3000),
(7, 'Rug', 'Home', 4500);$dbv42456$, $dbv42457$$dbv42457$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Order Summary Stats (topic chapter-14-sql-functions/aggregate-functions)
with t as (select id from public.learning_topics where source_kind = $dbv42461$dbms_sql_tutorial$dbv42461$ and source_ref = $dbv42462$chapter-14-sql-functions/aggregate-functions$dbv42462$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42463$cp-dbms-sql-order-summary-stats$dbv42463$, null::text, $dbv42464$Order Summary Stats$dbv42464$, $dbv42465$Easy$dbv42465$, $dbv42466$order-summary-stats$dbv42466$,
  $dbv42467$Write a query returning three aggregate columns over the whole `orders` table: `order_count` (total number of orders), `total_revenue` (sum of all `amount`), and `avg_amount` (integer average, using `SUM(amount) DIV COUNT(*)`).

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  order_date DATE NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO orders (id, customer_name, amount, order_date) VALUES
(1, 'Asha', 500, '2026-03-05'),
(2, 'Rohan', 300, '2026-03-20'),
(3, 'Neha', 700, '2026-04-02'),
(4, 'Asha', 200, '2026-03-28');
```
$dbv42467$,
  $dbv42458$[{"input": "", "output": "order_count\ttotal_revenue\tavg_amount\n4\t1700\t425"}]$dbv42458$::jsonb, $dbv42459$[{"hidden": true, "seed_sql": "INSERT INTO orders (id, customer_name, amount, order_date) VALUES\n(1, 'Zara', 1000, '2026-05-01'),\n(2, 'Omar', 400, '2026-05-15'),\n(3, 'Leo', 250, '2026-06-01');", "expected": "order_count\ttotal_revenue\tavg_amount\n3\t1650\t550"}]$dbv42459$::jsonb, jsonb_build_object('sql', $dbv42460$-- Write your SELECT query here
$dbv42460$),
  $dbv42468$COUNT(*), SUM(amount), and integer division combine into one summary row. Reference: `SELECT COUNT(*) AS order_count, SUM(amount) AS total_revenue, SUM(amount) DIV COUNT(*) AS avg_amount FROM orders;`$dbv42468$, array['sql'], $dbv42469$CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  order_date DATE NOT NULL
);$dbv42469$, $dbv42470$INSERT INTO orders (id, customer_name, amount, order_date) VALUES
(1, 'Asha', 500, '2026-03-05'),
(2, 'Rohan', 300, '2026-03-20'),
(3, 'Neha', 700, '2026-04-02'),
(4, 'Asha', 200, '2026-03-28');$dbv42470$, $dbv42471$$dbv42471$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Uppercase Names and Lengths (topic chapter-14-sql-functions/string-functions)
with t as (select id from public.learning_topics where source_kind = $dbv42475$dbms_sql_tutorial$dbv42475$ and source_ref = $dbv42476$chapter-14-sql-functions/string-functions$dbv42476$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42477$cp-dbms-sql-uppercase-names-and-lengths$dbv42477$, null::text, $dbv42478$Uppercase Names and Lengths$dbv42478$, $dbv42479$Easy$dbv42479$, $dbv42480$uppercase-names-and-lengths$dbv42480$,
  $dbv42481$Write a query returning `id`, an uppercase version of `customer_name` as `name_upper`, and the number of characters in `customer_name` as `name_length`, ordered by `id`.

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  order_date DATE NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO orders (id, customer_name, amount, order_date) VALUES
(1, 'Asha', 500, '2026-03-05'),
(2, 'Rohan', 300, '2026-03-20'),
(3, 'Neha', 700, '2026-04-02'),
(4, 'Asha', 200, '2026-03-28');
```
$dbv42481$,
  $dbv42472$[{"input": "", "output": "id\tname_upper\tname_length\n1\tASHA\t4\n2\tROHAN\t5\n3\tNEHA\t4\n4\tASHA\t4"}]$dbv42472$::jsonb, $dbv42473$[{"hidden": true, "seed_sql": "INSERT INTO orders (id, customer_name, amount, order_date) VALUES\n(1, 'Zara', 1000, '2026-05-01'),\n(2, 'Omar', 400, '2026-05-15'),\n(3, 'Leo', 250, '2026-06-01');", "expected": "id\tname_upper\tname_length\n1\tZARA\t4\n2\tOMAR\t4\n3\tLEO\t3"}]$dbv42473$::jsonb, jsonb_build_object('sql', $dbv42474$-- Write your SELECT query here
$dbv42474$),
  $dbv42482$UPPER() and LENGTH() are standard string functions available in every mainstream dialect. Reference: `SELECT id, UPPER(customer_name) AS name_upper, LENGTH(customer_name) AS name_length FROM orders ORDER BY id;`$dbv42482$, array['sql'], $dbv42483$CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  order_date DATE NOT NULL
);$dbv42483$, $dbv42484$INSERT INTO orders (id, customer_name, amount, order_date) VALUES
(1, 'Asha', 500, '2026-03-05'),
(2, 'Rohan', 300, '2026-03-20'),
(3, 'Neha', 700, '2026-04-02'),
(4, 'Asha', 200, '2026-03-28');$dbv42484$, $dbv42485$$dbv42485$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Orders Placed in March 2026 (topic chapter-14-sql-functions/date-functions)
with t as (select id from public.learning_topics where source_kind = $dbv42489$dbms_sql_tutorial$dbv42489$ and source_ref = $dbv42490$chapter-14-sql-functions/date-functions$dbv42490$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbv42491$cp-dbms-sql-orders-placed-in-march-2026$dbv42491$, null::text, $dbv42492$Orders Placed in March 2026$dbv42492$, $dbv42493$Medium$dbv42493$, $dbv42494$orders-placed-in-march-2026$dbv42494$,
  $dbv42495$Write a query returning `id`, `customer_name`, `order_date` for every order placed in March 2026 (the 1st through the 31st, inclusive), ordered by `id`. (This case may legitimately return zero rows if no order falls in that month.)

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  order_date DATE NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO orders (id, customer_name, amount, order_date) VALUES
(1, 'Asha', 500, '2026-03-05'),
(2, 'Rohan', 300, '2026-03-20'),
(3, 'Neha', 700, '2026-04-02'),
(4, 'Asha', 200, '2026-03-28');
```
$dbv42495$,
  $dbv42486$[{"input": "", "output": "id\tcustomer_name\torder_date\n1\tAsha\t2026-03-05\n2\tRohan\t2026-03-20\n4\tAsha\t2026-03-28"}]$dbv42486$::jsonb, $dbv42487$[{"hidden": true, "seed_sql": "INSERT INTO orders (id, customer_name, amount, order_date) VALUES\n(1, 'Zara', 1000, '2026-05-01'),\n(2, 'Omar', 400, '2026-05-15'),\n(3, 'Leo', 250, '2026-06-01');", "expected": ""}]$dbv42487$::jsonb, jsonb_build_object('sql', $dbv42488$-- Write your SELECT query here
$dbv42488$),
  $dbv42496$A half-open range (>= start of month AND < start of next month) correctly and safely includes every timestamp in the month. Reference: `SELECT id, customer_name, order_date FROM orders WHERE order_date >= '2026-03-01' AND order_date < '2026-04-01' ORDER BY id;`$dbv42496$, array['sql'], $dbv42497$CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  order_date DATE NOT NULL
);$dbv42497$, $dbv42498$INSERT INTO orders (id, customer_name, amount, order_date) VALUES
(1, 'Asha', 500, '2026-03-05'),
(2, 'Rohan', 300, '2026-03-20'),
(3, 'Neha', 700, '2026-04-02'),
(4, 'Asha', 200, '2026-03-28');$dbv42498$, $dbv42499$$dbv42499$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- ===========================================================================
-- 5. VALIDATION
-- ===========================================================================
do $$
declare
  v_grid_id uuid;
  v_topics int;
  v_questions int;
  v_problems int;
  v_chtests int;
begin
  select id into v_grid_id from public.learning_grids where lower(slug) = $dbv42500$dbms-sql-tutorial$dbv42500$;
  if v_grid_id is null then raise exception 'validation: dbms-sql-tutorial grid missing'; end if;

  select count(*) into v_topics from public.learning_topics where grid_id = v_grid_id and source_kind = $dbv42501$dbms_sql_tutorial$dbv42501$;
  if v_topics < 186 then raise exception 'validation: expected at least 186 dbms_sql_tutorial topics (149 from batches 1-4 + 37 from batch 5), found %', v_topics; end if;

  select count(*) into v_questions from public.test_questions tq
    join public.practice_tests pt on pt.id = tq.test_id
    where pt.learning_topic_id in (select id from public.learning_topics where grid_id = v_grid_id and source_kind = $dbv42502$dbms_sql_tutorial$dbv42502$);
  if v_questions < 1488 then raise exception 'validation: expected at least 1488 topic-quiz questions, found %', v_questions; end if;

  select count(*) into v_chtests from public.practice_tests where id in ('pt-dbms-sql-ch12-test','pt-dbms-sql-ch13-test','pt-dbms-sql-ch14-test') and scope = 'chapter';
  if v_chtests <> 3 then raise exception 'validation: expected 3 new chapter tests, found %', v_chtests; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-dbms-sql-%';
  if v_problems < 30 then raise exception 'validation: expected at least 30 SQL coding problems total, found %', v_problems; end if;

  raise notice '0096 OK: % total topics, % total topic-quiz questions, 3 new chapter tests (ch12/ch13/ch14), % total SQL coding problems.', v_topics, v_questions, v_problems;
end $$;

notify pgrst, 'reload schema';
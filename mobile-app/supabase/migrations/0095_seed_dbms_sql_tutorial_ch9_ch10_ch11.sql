-- mobile-app/supabase/migrations/0095_seed_dbms_sql_tutorial_ch9_ch10_ch11.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/067_seed_dbms_sql_tutorial_ch9_ch10_ch11.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — DBMS & SQL Tutorial: Chapters 9, 10, 11 (batch 4)
-- ============================================================================
-- WHAT / WHY
--   Fourth content batch, on top of 0091/063 (schema, ALSO extended here to
--   let a hidden test case override check_sql, not just seed_sql — needed for
--   DDL-writing problems with no seed data to vary) + batches 1-3 (chapters
--   1,2,3,4,5,6,7,8). Adds Chapter 9 (DDL and Schema Design, 12 topics),
--   Chapter 10 (SQL Constraints, 11 topics), Chapter 11 (DML and Data
--   Modification, 11 topics) = 34 more topics, 272 more topic-quiz MCQs, 3
--   more Chapter tests, and 8 more SQL coding problems (2 DDL-writing on
--   Chapter 9, 2 constraint-violation-finding on Chapter 10, 4 DML-writing
--   on Chapter 11 — all verified end-to-end against Paiza's live sandbox).
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
  if not exists (select 1 from public.learning_grids where lower(slug) = $dbw30001$dbms-sql-tutorial$dbw30001$) then
    raise exception '0095/067: dbms-sql-tutorial grid not found — apply 0092_seed_dbms_sql_tutorial_ch1_ch2_ch8.sql (admin 064) first.';
  end if;
  if to_regprocedure('public.practice_test_pool(text)') is null then
    raise exception '0095/067: DBMS-practice RPCs not found — apply 0091_dbms_sql_practice.sql (admin 063) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 1. SECTIONS — re-affirm all 43 (idempotent no-op for rows 0092 already set;
--    harmless if this migration is ever applied to a fresh project before 0092).
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = $dbw30002$dbms-sql-tutorial$dbw30002$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30003$Chapter 1: Database Foundations$dbw30003$, $dbw30004$chapter-1-database-foundations$dbw30004$, 1, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30005$dbms-sql-tutorial$dbw30005$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30006$Chapter 2: DBMS Architecture$dbw30006$, $dbw30007$chapter-2-dbms-architecture$dbw30007$, 2, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30008$dbms-sql-tutorial$dbw30008$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30009$Chapter 3: Data Models$dbw30009$, $dbw30010$chapter-3-data-models$dbw30010$, 3, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30011$dbms-sql-tutorial$dbw30011$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30012$Chapter 4: Relational Model$dbw30012$, $dbw30013$chapter-4-relational-model$dbw30013$, 4, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30014$dbms-sql-tutorial$dbw30014$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30015$Chapter 5: Keys and Integrity$dbw30015$, $dbw30016$chapter-5-keys-and-integrity$dbw30016$, 5, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30017$dbms-sql-tutorial$dbw30017$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30018$Chapter 6: ER and EER Modeling$dbw30018$, $dbw30019$chapter-6-er-and-eer-modeling$dbw30019$, 6, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30020$dbms-sql-tutorial$dbw30020$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30021$Chapter 7: Relational Algebra$dbw30021$, $dbw30022$chapter-7-relational-algebra$dbw30022$, 7, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30023$dbms-sql-tutorial$dbw30023$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30024$Chapter 8: SQL Fundamentals$dbw30024$, $dbw30025$chapter-8-sql-fundamentals$dbw30025$, 8, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30026$dbms-sql-tutorial$dbw30026$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30027$Chapter 9: DDL and Schema Design$dbw30027$, $dbw30028$chapter-9-ddl-and-schema-design$dbw30028$, 9, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30029$dbms-sql-tutorial$dbw30029$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30030$Chapter 10: SQL Constraints$dbw30030$, $dbw30031$chapter-10-sql-constraints$dbw30031$, 10, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30032$dbms-sql-tutorial$dbw30032$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30033$Chapter 11: DML and Data Modification$dbw30033$, $dbw30034$chapter-11-dml-and-data-modification$dbw30034$, 11, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30035$dbms-sql-tutorial$dbw30035$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30036$Chapter 12: SELECT and Filtering$dbw30036$, $dbw30037$chapter-12-select-and-filtering$dbw30037$, 12, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30038$dbms-sql-tutorial$dbw30038$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30039$Chapter 13: Sorting and Pagination$dbw30039$, $dbw30040$chapter-13-sorting-and-pagination$dbw30040$, 13, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30041$dbms-sql-tutorial$dbw30041$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30042$Chapter 14: SQL Functions$dbw30042$, $dbw30043$chapter-14-sql-functions$dbw30043$, 14, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30044$dbms-sql-tutorial$dbw30044$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30045$Chapter 15: GROUP BY and Aggregation$dbw30045$, $dbw30046$chapter-15-group-by-and-aggregation$dbw30046$, 15, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30047$dbms-sql-tutorial$dbw30047$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30048$Chapter 16: Joins$dbw30048$, $dbw30049$chapter-16-joins$dbw30049$, 16, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30050$dbms-sql-tutorial$dbw30050$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30051$Chapter 17: Subqueries$dbw30051$, $dbw30052$chapter-17-subqueries$dbw30052$, 17, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30053$dbms-sql-tutorial$dbw30053$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30054$Chapter 18: Set Operations$dbw30054$, $dbw30055$chapter-18-set-operations$dbw30055$, 18, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30056$dbms-sql-tutorial$dbw30056$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30057$Chapter 19: Views$dbw30057$, $dbw30058$chapter-19-views$dbw30058$, 19, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30059$dbms-sql-tutorial$dbw30059$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30060$Chapter 20: Indexes and Access Paths$dbw30060$, $dbw30061$chapter-20-indexes-and-access-paths$dbw30061$, 20, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30062$dbms-sql-tutorial$dbw30062$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30063$Chapter 21: Normalization and Functional Dependencies$dbw30063$, $dbw30064$chapter-21-normalization-and-functional-dependencies$dbw30064$, 21, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30065$dbms-sql-tutorial$dbw30065$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30066$Chapter 22: Transactions$dbw30066$, $dbw30067$chapter-22-transactions$dbw30067$, 22, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30068$dbms-sql-tutorial$dbw30068$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30069$Chapter 23: Concurrency Control$dbw30069$, $dbw30070$chapter-23-concurrency-control$dbw30070$, 23, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30071$dbms-sql-tutorial$dbw30071$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30072$Chapter 24: Locking Protocols$dbw30072$, $dbw30073$chapter-24-locking-protocols$dbw30073$, 24, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30074$dbms-sql-tutorial$dbw30074$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30075$Chapter 25: Isolation Levels$dbw30075$, $dbw30076$chapter-25-isolation-levels$dbw30076$, 25, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30077$dbms-sql-tutorial$dbw30077$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30078$Chapter 26: Recovery and Logging$dbw30078$, $dbw30079$chapter-26-recovery-and-logging$dbw30079$, 26, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30080$dbms-sql-tutorial$dbw30080$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30081$Chapter 27: Database Security$dbw30081$, $dbw30082$chapter-27-database-security$dbw30082$, 27, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30083$dbms-sql-tutorial$dbw30083$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30084$Chapter 28: Stored Procedures$dbw30084$, $dbw30085$chapter-28-stored-procedures$dbw30085$, 28, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30086$dbms-sql-tutorial$dbw30086$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30087$Chapter 29: Stored Functions$dbw30087$, $dbw30088$chapter-29-stored-functions$dbw30088$, 29, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30089$dbms-sql-tutorial$dbw30089$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30090$Chapter 30: Triggers$dbw30090$, $dbw30091$chapter-30-triggers$dbw30091$, 30, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30092$dbms-sql-tutorial$dbw30092$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30093$Chapter 31: Cursors$dbw30093$, $dbw30094$chapter-31-cursors$dbw30094$, 31, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30095$dbms-sql-tutorial$dbw30095$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30096$Chapter 32: Advanced SQL: CTE$dbw30096$, $dbw30097$chapter-32-advanced-sql-cte$dbw30097$, 32, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30098$dbms-sql-tutorial$dbw30098$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30099$Chapter 33: Advanced SQL: Window Functions$dbw30099$, $dbw30100$chapter-33-advanced-sql-window-functions$dbw30100$, 33, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30101$dbms-sql-tutorial$dbw30101$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30102$Chapter 34: Advanced SQL Patterns$dbw30102$, $dbw30103$chapter-34-advanced-sql-patterns$dbw30103$, 34, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30104$dbms-sql-tutorial$dbw30104$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30105$Chapter 35: Query Processing and Optimization$dbw30105$, $dbw30106$chapter-35-query-processing-and-optimization$dbw30106$, 35, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30107$dbms-sql-tutorial$dbw30107$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30108$Chapter 36: Physical Storage$dbw30108$, $dbw30109$chapter-36-physical-storage$dbw30109$, 36, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30110$dbms-sql-tutorial$dbw30110$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30111$Chapter 37: Advanced Index Structures$dbw30111$, $dbw30112$chapter-37-advanced-index-structures$dbw30112$, 37, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30113$dbms-sql-tutorial$dbw30113$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30114$Chapter 38: Distributed Databases$dbw30114$, $dbw30115$chapter-38-distributed-databases$dbw30115$, 38, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30116$dbms-sql-tutorial$dbw30116$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30117$Chapter 39: NoSQL Databases$dbw30117$, $dbw30118$chapter-39-nosql-databases$dbw30118$, 39, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30119$dbms-sql-tutorial$dbw30119$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30120$Chapter 40: Database Scaling$dbw30120$, $dbw30121$chapter-40-database-scaling$dbw30121$, 40, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30122$dbms-sql-tutorial$dbw30122$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30123$Chapter 41: Data Warehousing$dbw30123$, $dbw30124$chapter-41-data-warehousing$dbw30124$, 41, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30125$dbms-sql-tutorial$dbw30125$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30126$Chapter 42: Database Design Projects$dbw30126$, $dbw30127$chapter-42-database-design-projects$dbw30127$, 42, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30128$dbms-sql-tutorial$dbw30128$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbw30129$Chapter 43: Interview and Placement Preparation$dbw30129$, $dbw30130$chapter-43-interview-and-placement-preparation$dbw30130$, 43, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. TOPICS + NOTES CONTENT + MCQ QUIZ per topic (chapters 3, 4, 5)
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- Chapter 9: DDL and Schema Design
-- ---------------------------------------------------------------------------
-- 9.1 CREATE DATABASE
with g as (select id from public.learning_grids where lower(slug) = $dbw30131$dbms-sql-tutorial$dbw30131$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30132$chapter-9-ddl-and-schema-design$dbw30132$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30133$CREATE DATABASE$dbw30133$, $dbw30134$create-database$dbw30134$, '', 1, 'published', true, true, $dbw30135$dbms_sql_tutorial$dbw30135$, $dbw30136$chapter-9-ddl-and-schema-design/create-database$dbw30136$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30137$dbms_sql_tutorial$dbw30137$ and source_ref = $dbw30138$chapter-9-ddl-and-schema-design/create-database$dbw30138$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30139$CREATE DATABASE$dbw30139$, $dbw30140$### What CREATE DATABASE Does

`CREATE DATABASE` is the DDL statement that provisions a brand-new, top-level container in a database server. A database is the outermost unit of isolation: it owns its own set of schemas (or, in MySQL, is itself the namespace), its own storage files/tablespace, its own set of connections, and often its own character set, collation, and access-control boundary.

```sql
-- PostgreSQL
CREATE DATABASE company_db
    WITH ENCODING = 'UTF8'
         OWNER = admin
         TEMPLATE = template0;

-- MySQL (identical to CREATE SCHEMA here — see 9.2)
CREATE DATABASE IF NOT EXISTS company_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- SQL Server
CREATE DATABASE CompanyDB;
```

### How It Works

The server allocates catalog metadata (an entry in a system table like `pg_database` or `information_schema.SCHEMATA`) and the physical storage backing it (data files, log files, or a tablespace). Once created, the database becomes a connection target — clients must actually connect *to* `company_db` before they can create tables inside it; you cannot create objects in a database you haven't switched into.

A practical worked example: setting up a fresh environment for a new microservice.

```sql
CREATE DATABASE billing_service WITH ENCODING = 'UTF8' OWNER = billing_admin;
\c billing_service
CREATE TABLE invoices (id SERIAL PRIMARY KEY, amount NUMERIC(10,2));
```

### Edge Cases and Pitfalls

- **Cannot run inside a transaction block** on most engines (PostgreSQL explicitly forbids `CREATE DATABASE` inside `BEGIN...COMMIT`) because it involves file-system-level operations that aren't easily made transactional.
- **Name collisions**: database names must be unique per server instance; re-running without `IF NOT EXISTS` throws an error.
- **Case sensitivity** of database names can differ by operating system (case-insensitive on Windows file systems, case-sensitive on Linux), which occasionally causes cross-environment bugs.
- **Dropping** requires no active connections in many engines — `DROP DATABASE` fails if any session is still connected to it.
- Costs real disk/memory resources immediately, even before a single table is created — don't create databases speculatively in production.

### Key Takeaways / Q&A

**Q: Is a database the same thing as a schema?**
A: Not always — see the CREATE SCHEMA topic. In PostgreSQL/SQL Server/Oracle, a schema is a namespace *inside* a database. In MySQL, "schema" and "database" are literal synonyms — `CREATE SCHEMA` and `CREATE DATABASE` do exactly the same thing.

**Q: Can two databases on the same server share data via a plain SQL JOIN?**
A: Generally no — cross-database queries require special mechanisms (linked servers, `dblink`, foreign data wrappers, or fully-qualified `database.schema.table` syntax where the engine supports it), because databases are meant to be isolated units.$dbw30140$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30141$dbms_sql_tutorial_seed$dbw30141$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30142$dbms_sql_tutorial_seed$dbw30142$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30143$dbms-sql-tutorial$dbw30143$),
     t as (select id from public.learning_topics where source_kind = $dbw30144$dbms_sql_tutorial$dbw30144$ and source_ref = $dbw30145$chapter-9-ddl-and-schema-design/create-database$dbw30145$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30146$pt-dbms-sql-9-create-database$dbw30146$, $dbw30147$CREATE DATABASE - Quick Test$dbw30147$, 'aptitude', 8, 8,
  $dbw30148$8 questions on CREATE DATABASE.$dbw30148$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30149$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30149$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30150$tq-dbms-sql-9-create-database-1$dbw30150$, $dbw30151$pt-dbms-sql-9-create-database$dbw30151$,
   $dbw30152$What is the primary purpose of the CREATE DATABASE statement?$dbw30152$,
   $dbw30153$["To add a new column to an existing table", "To provision a new top-level container that holds schemas, tables, and its own storage", "To generate a new row of data", "To create an index on a table"]$dbw30153$::jsonb,
   1, $dbw30154$CREATE DATABASE provisions a brand-new top-level container with its own catalog metadata and storage.$dbw30154$, 1, 0),
  ($dbw30155$tq-dbms-sql-9-create-database-2$dbw30155$, $dbw30156$pt-dbms-sql-9-create-database$dbw30156$,
   $dbw30157$In PostgreSQL, why can't CREATE DATABASE normally be run inside a BEGIN...COMMIT transaction block?$dbw30157$,
   $dbw30158$["It requires two-phase commit", "It involves file-system-level allocation that isn't easily made transactional", "It is deprecated syntax", "It always requires superuser privileges"]$dbw30158$::jsonb,
   1, $dbw30159$Creating a database allocates physical files/storage, an operation PostgreSQL does not allow inside a regular transaction.$dbw30159$, 1, 1),
  ($dbw30160$tq-dbms-sql-9-create-database-3$dbw30160$, $dbw30161$pt-dbms-sql-9-create-database$dbw30161$,
   $dbw30162$Which of the following must generally be true before DROP DATABASE will succeed on most engines?$dbw30162$,
   $dbw30163$["The database must contain at least one table", "No active sessions can be connected to that database", "The database must be renamed first", "All tables must be truncated first"]$dbw30163$::jsonb,
   1, $dbw30164$Most engines refuse to drop a database while other sessions are still connected to it.$dbw30164$, 1, 2),
  ($dbw30165$tq-dbms-sql-9-create-database-4$dbw30165$, $dbw30166$pt-dbms-sql-9-create-database$dbw30166$,
   $dbw30167$In MySQL, what is the relationship between CREATE DATABASE and CREATE SCHEMA?$dbw30167$,
   $dbw30168$["CREATE SCHEMA creates a namespace inside a database created by CREATE DATABASE", "They are unrelated commands", "CREATE SCHEMA is only used for views", "They are exact synonyms \u2014 both create the same kind of object"]$dbw30168$::jsonb,
   3, $dbw30169$MySQL treats 'schema' and 'database' as synonyms, unlike PostgreSQL/SQL Server/Oracle where schema is a namespace inside a database.$dbw30169$, 1, 3),
  ($dbw30170$tq-dbms-sql-9-create-database-5$dbw30170$, $dbw30171$pt-dbms-sql-9-create-database$dbw30171$,
   $dbw30172$What must a client do immediately after creating a new database before creating tables in it?$dbw30172$,
   $dbw30173$["Nothing, tables can be created from any connection", "Restart the database server", "Connect to (switch into) the newly created database", "Grant themselves superuser rights"]$dbw30173$::jsonb,
   2, $dbw30174$You must connect to the new database before you can create objects inside it — CREATE DATABASE alone does not switch your session's context.$dbw30174$, 1, 4),
  ($dbw30175$tq-dbms-sql-9-create-database-6$dbw30175$, $dbw30176$pt-dbms-sql-9-create-database$dbw30176$,
   $dbw30177$Which clause prevents an error when CREATE DATABASE is run against a name that may already exist?$dbw30177$,
   $dbw30178$["CASCADE", "IF NOT EXISTS", "WITH CHECK OPTION", "ON CONFLICT"]$dbw30178$::jsonb,
   1, $dbw30179$IF NOT EXISTS makes the statement a no-op instead of erroring when the database name is already taken.$dbw30179$, 1, 5),
  ($dbw30180$tq-dbms-sql-9-create-database-7$dbw30180$, $dbw30181$pt-dbms-sql-9-create-database$dbw30181$,
   $dbw30182$Why is directly running SQL JOINs across two separate databases on the same server typically not possible without special setup?$dbw30182$,
   $dbw30183$["JOIN syntax does not support more than one table", "Databases are isolated units; cross-database access needs mechanisms like linked servers, dblink, or foreign data wrappers", "Databases cannot contain more than one table each", "SQL does not support JOIN at all"]$dbw30183$::jsonb,
   1, $dbw30184$Databases are designed as isolated containers, so cross-database querying needs special connectivity features rather than a plain JOIN.$dbw30184$, 1, 6),
  ($dbw30185$tq-dbms-sql-9-create-database-8$dbw30185$, $dbw30186$pt-dbms-sql-9-create-database$dbw30186$,
   $dbw30187$A team creates a database on a case-insensitive Windows file system and later deploys the same script on a Linux server. What subtle issue can arise?$dbw30187$,
   $dbw30188$["Linux does not support CREATE DATABASE", "Database name case sensitivity differs between operating systems, potentially causing name-mismatch bugs", "SQL syntax differs entirely between operating systems", "Windows does not allow more than one database"]$dbw30188$::jsonb,
   1, $dbw30189$Case sensitivity of database names can differ by OS/file system, which is a real cross-environment migration pitfall.$dbw30189$, 1, 7)
on conflict (id) do nothing;

-- 9.2 CREATE SCHEMA
with g as (select id from public.learning_grids where lower(slug) = $dbw30190$dbms-sql-tutorial$dbw30190$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30191$chapter-9-ddl-and-schema-design$dbw30191$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30192$CREATE SCHEMA$dbw30192$, $dbw30193$create-schema$dbw30193$, '', 2, 'published', true, true, $dbw30194$dbms_sql_tutorial$dbw30194$, $dbw30195$chapter-9-ddl-and-schema-design/create-schema$dbw30195$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30196$dbms_sql_tutorial$dbw30196$ and source_ref = $dbw30197$chapter-9-ddl-and-schema-design/create-schema$dbw30197$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30198$CREATE SCHEMA$dbw30198$, $dbw30199$### What a Schema Is

A schema is a **namespace inside a database** that groups related objects — tables, views, functions, sequences — under one name, so `sales.orders` and `hr.orders` can coexist without conflict even though both are called `orders`. Schemas are the standard way to organize a large database and to scope permissions.

```sql
-- PostgreSQL / SQL Server / Oracle style
CREATE SCHEMA sales AUTHORIZATION sales_admin;

CREATE TABLE sales.orders (
    id       SERIAL PRIMARY KEY,
    customer VARCHAR(100),
    amount   NUMERIC(10,2)
);

CREATE TABLE hr.orders (          -- a totally different table, no name clash
    id        SERIAL PRIMARY KEY,
    equipment VARCHAR(100)
);
```

### The Critical Dialect Nuance

**This is a genuine trap for anyone moving between engines.** In PostgreSQL, SQL Server, and Oracle, a *schema* is a namespace living *inside* one database — one database can hold many schemas. In **MySQL**, however, `CREATE SCHEMA` is a literal, byte-for-byte synonym for `CREATE DATABASE`; MySQL has no separate "namespace inside a database" concept at all — what MySQL calls a schema *is* the database. So `CREATE SCHEMA sales;` in MySQL creates an entirely new database named `sales`, not a namespace inside your current one. Always know which engine you're on before reading schema-related SQL.

### How It Works (Postgres/SQL Server Style)

Every database ships with a default schema (`public` in PostgreSQL, `dbo` in SQL Server). Unqualified object references resolve using a `search_path` (Postgres) or default schema (SQL Server). A worked example — multi-tenant isolation by schema:

```sql
CREATE SCHEMA tenant_acme;
CREATE SCHEMA tenant_globex;

CREATE TABLE tenant_acme.users   (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE tenant_globex.users (id SERIAL PRIMARY KEY, name TEXT);

GRANT USAGE ON SCHEMA tenant_acme TO acme_app_role;
```

Each tenant's application connects with a role whose `search_path` (or explicit qualification) points only at its own schema, giving logical isolation without spinning up a whole new database per customer.

### Edge Cases and Pitfalls

- Object name collisions across *different* schemas are perfectly fine — that's the whole point.
- Dropping a schema with `DROP SCHEMA sales CASCADE;` drops every object inside it — just as destructive as `DROP DATABASE`, but scoped smaller.
- Permissions are commonly granted per-schema (`GRANT USAGE ON SCHEMA`), which is a common way to sandbox a group of tables from a group of users.
- Forgetting to qualify a table name can silently resolve to the wrong schema if your `search_path` includes more than one schema.

### Key Takeaways / Q&A

**Q: Can I have two tables named `orders` in the same database?**
A: Only if they live in different schemas (Postgres/SQL Server/Oracle). Not possible in MySQL, where "schema" == "database", so there's no intermediate namespace to separate them.

**Q: Is CREATE SCHEMA ever destructive on its own?**
A: No — creating a schema is additive and safe. It's `DROP SCHEMA ... CASCADE` that is destructive.$dbw30199$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30200$dbms_sql_tutorial_seed$dbw30200$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30201$dbms_sql_tutorial_seed$dbw30201$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30202$dbms-sql-tutorial$dbw30202$),
     t as (select id from public.learning_topics where source_kind = $dbw30203$dbms_sql_tutorial$dbw30203$ and source_ref = $dbw30204$chapter-9-ddl-and-schema-design/create-schema$dbw30204$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30205$pt-dbms-sql-9-create-schema$dbw30205$, $dbw30206$CREATE SCHEMA - Quick Test$dbw30206$, 'aptitude', 8, 8,
  $dbw30207$8 questions on CREATE SCHEMA.$dbw30207$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30208$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30208$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30209$tq-dbms-sql-9-create-schema-1$dbw30209$, $dbw30210$pt-dbms-sql-9-create-schema$dbw30210$,
   $dbw30211$In PostgreSQL, what best describes a schema?$dbw30211$,
   $dbw30212$["A synonym for a database", "A namespace inside a database that groups related objects", "A backup file format", "A type of index"]$dbw30212$::jsonb,
   1, $dbw30213$In PostgreSQL, SQL Server, and Oracle, a schema is a namespace living inside one database.$dbw30213$, 1, 0),
  ($dbw30214$tq-dbms-sql-9-create-schema-2$dbw30214$, $dbw30215$pt-dbms-sql-9-create-schema$dbw30215$,
   $dbw30216$In MySQL, what does CREATE SCHEMA actually do?$dbw30216$,
   $dbw30217$["Nothing \u2014 MySQL has no such statement", "It creates a namespace inside the current database", "It is a literal synonym for CREATE DATABASE, creating an entirely new database", "It creates a view"]$dbw30217$::jsonb,
   2, $dbw30218$MySQL treats 'schema' as a synonym for 'database' — CREATE SCHEMA and CREATE DATABASE do exactly the same thing.$dbw30218$, 1, 1),
  ($dbw30219$tq-dbms-sql-9-create-schema-3$dbw30219$, $dbw30220$pt-dbms-sql-9-create-schema$dbw30220$,
   $dbw30221$Why can `sales.orders` and `hr.orders` coexist in the same PostgreSQL database?$dbw30221$,
   $dbw30222$["PostgreSQL allows duplicate table names anywhere", "They are in different schemas, which act as separate namespaces", "One of them must be a view", "PostgreSQL silently renames the second table"]$dbw30222$::jsonb,
   1, $dbw30223$Schemas namespace objects, so identically named tables in different schemas don't collide.$dbw30223$, 1, 2),
  ($dbw30224$tq-dbms-sql-9-create-schema-4$dbw30224$, $dbw30225$pt-dbms-sql-9-create-schema$dbw30225$,
   $dbw30226$What happens when you run DROP SCHEMA sales CASCADE?$dbw30226$,
   $dbw30227$["Only the schema's metadata is removed; tables remain accessible", "Every object contained in the schema (tables, views, etc.) is dropped along with the schema", "It renames the schema to 'sales_old'", "It is a no-op unless the schema is empty"]$dbw30227$::jsonb,
   1, $dbw30228$CASCADE on DROP SCHEMA removes every object inside it — just as destructive as dropping a database, but scoped smaller.$dbw30228$, 1, 3),
  ($dbw30229$tq-dbms-sql-9-create-schema-5$dbw30229$, $dbw30230$pt-dbms-sql-9-create-schema$dbw30230$,
   $dbw30231$What PostgreSQL/SQL Server mechanism determines which schema an unqualified table reference resolves to?$dbw30231$,
   $dbw30232$["Alphabetical order of schema names", "The search_path (Postgres) or default schema (SQL Server)", "The most recently created schema", "It is always resolved to the public schema and nothing else"]$dbw30232$::jsonb,
   1, $dbw30233$The search_path (or default schema) governs how unqualified names are resolved.$dbw30233$, 1, 4),
  ($dbw30234$tq-dbms-sql-9-create-schema-6$dbw30234$, $dbw30235$pt-dbms-sql-9-create-schema$dbw30235$,
   $dbw30236$A developer moving from PostgreSQL to MySQL writes `CREATE SCHEMA sales;` expecting a namespace inside their existing database. What actually happens in MySQL?$dbw30236$,
   $dbw30237$["An error, since MySQL requires CREATE DATABASE for this", "A brand new database named 'sales' is created, separate from their current one", "MySQL creates a view named sales", "Nothing changes since MySQL ignores CREATE SCHEMA"]$dbw30237$::jsonb,
   1, $dbw30238$Because MySQL treats schema and database as synonyms, this creates a whole new database rather than a namespace.$dbw30238$, 1, 5),
  ($dbw30239$tq-dbms-sql-9-create-schema-7$dbw30239$, $dbw30240$pt-dbms-sql-9-create-schema$dbw30240$,
   $dbw30241$What is a common real-world use of per-schema permissions (e.g. GRANT USAGE ON SCHEMA tenant_acme)?$dbw30241$,
   $dbw30242$["Improving query performance", "Logically isolating groups of tables/users, such as per-tenant data in a multi-tenant app", "Compressing table storage", "Encrypting column data"]$dbw30242$::jsonb,
   1, $dbw30243$Schema-level grants are a common pattern for sandboxing tenants or subsystems within one database.$dbw30243$, 1, 6),
  ($dbw30244$tq-dbms-sql-9-create-schema-8$dbw30244$, $dbw30245$pt-dbms-sql-9-create-schema$dbw30245$,
   $dbw30246$Why must you know which database engine you are using before interpreting schema-related SQL scripts?$dbw30246$,
   $dbw30247$["Schema syntax is identical everywhere so it doesn't matter", "Because 'schema' means a namespace inside a database on some engines but is a database synonym on MySQL", "Because only Oracle supports schemas", "Because schemas are deprecated on all modern engines"]$dbw30247$::jsonb,
   1, $dbw30248$The dialect nuance between namespace-style schemas (Postgres/SQL Server/Oracle) and database-synonym schemas (MySQL) changes what the same SQL actually does.$dbw30248$, 1, 7)
on conflict (id) do nothing;

-- 9.3 CREATE TABLE
with g as (select id from public.learning_grids where lower(slug) = $dbw30249$dbms-sql-tutorial$dbw30249$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30250$chapter-9-ddl-and-schema-design$dbw30250$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30251$CREATE TABLE$dbw30251$, $dbw30252$create-table$dbw30252$, '', 3, 'published', true, true, $dbw30253$dbms_sql_tutorial$dbw30253$, $dbw30254$chapter-9-ddl-and-schema-design/create-table$dbw30254$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30255$dbms_sql_tutorial$dbw30255$ and source_ref = $dbw30256$chapter-9-ddl-and-schema-design/create-table$dbw30256$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30257$CREATE TABLE$dbw30257$, $dbw30258$### Definition

`CREATE TABLE` defines a new relation: its columns, their data types, and the constraints that guard data integrity (primary keys, foreign keys, `NOT NULL`, `UNIQUE`, `CHECK`, `DEFAULT`).

```sql
CREATE TABLE departments (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE employees (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    salary   NUMERIC(10,2) CHECK (salary > 0),
    dept_id  INT REFERENCES departments(id),
    hired_on DATE DEFAULT CURRENT_DATE
);
```

### How It Works

The engine registers the table's metadata (column list, types, constraints) in the system catalog and allocates initial storage. Constraints are enforced on every subsequent `INSERT`/`UPDATE`. Foreign keys like `dept_id INT REFERENCES departments(id)` require the referenced table (and referenced column, usually a primary/unique key) to already exist — order matters when creating related tables.

A genuinely useful pattern is **CREATE TABLE AS SELECT (CTAS)**, which creates a new table populated from a query in one shot:

```sql
CREATE TABLE high_earners AS
SELECT id, name, salary
FROM employees
WHERE salary > 100000;
```

This copies both structure (inferred from the query) and data, but **not** constraints or indexes from the source — those must be added manually afterward if needed.

### Edge Cases and Pitfalls

- **Forward references fail**: you cannot create `employees` referencing `departments` before `departments` exists, unless you create the FK afterward via `ALTER TABLE ... ADD CONSTRAINT` (useful for circular references between two tables).
- **`IF NOT EXISTS`** avoids errors on re-run but silently skips creation even if your column definitions changed — it does not reconcile schema drift.
- **Reserved words** (e.g. `order`, `user`, `group`) as table/column names require quoting (`"order"`) and are best avoided entirely.
- **Default column widths matter**: an undersized `VARCHAR(20)` for names or emails is a common early design mistake that later requires a (potentially locking) `ALTER TABLE`.
- CTAS silently drops the source table's constraints, indexes, and identity/auto-increment behavior — a frequent surprise for people who expect a "clone".

### Key Takeaways / Q&A

**Q: Does CREATE TABLE ... AS SELECT copy indexes and constraints?**
A: No — only column names and inferred data types (and the data itself). Primary keys, foreign keys, and indexes must be added separately.

**Q: What's the fix for two tables that need to reference each other (a circular foreign key)?**
A: Create both tables without the problematic FK first, then add it afterward with `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ...`.

**Q: Is CREATE TABLE reversible?**
A: The statement itself just adds an object; removing it later means DROP TABLE, which is destructive (see 9.5) — so review column types and constraints carefully before creating, especially on tables that will soon hold real data.$dbw30258$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30259$dbms_sql_tutorial_seed$dbw30259$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30260$dbms_sql_tutorial_seed$dbw30260$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30261$dbms-sql-tutorial$dbw30261$),
     t as (select id from public.learning_topics where source_kind = $dbw30262$dbms_sql_tutorial$dbw30262$ and source_ref = $dbw30263$chapter-9-ddl-and-schema-design/create-table$dbw30263$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30264$pt-dbms-sql-9-create-table$dbw30264$, $dbw30265$CREATE TABLE - Quick Test$dbw30265$, 'aptitude', 8, 8,
  $dbw30266$8 questions on CREATE TABLE.$dbw30266$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30267$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30267$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30268$tq-dbms-sql-9-create-table-1$dbw30268$, $dbw30269$pt-dbms-sql-9-create-table$dbw30269$,
   $dbw30270$What must already exist before you can successfully create a table with a foreign key referencing it (in a single CREATE TABLE)?$dbw30270$,
   $dbw30271$["Nothing, foreign keys are resolved lazily", "The referenced table and referenced key column", "An index on the new table", "A view with the same name"]$dbw30271$::jsonb,
   1, $dbw30272$A foreign key must reference an existing table and typically a primary/unique key column, so referenced tables must be created first.$dbw30272$, 1, 0),
  ($dbw30273$tq-dbms-sql-9-create-table-2$dbw30273$, $dbw30274$pt-dbms-sql-9-create-table$dbw30274$,
   $dbw30275$What does CREATE TABLE ... AS SELECT (CTAS) copy from the source query?$dbw30275$,
   $dbw30276$["Only the constraints and indexes, not the data", "Column structure (inferred) and the resulting data, but not constraints or indexes", "Everything including primary keys and foreign keys", "Only the table name"]$dbw30276$::jsonb,
   1, $dbw30277$CTAS copies inferred columns and data but does not carry over constraints or indexes from the source.$dbw30277$, 1, 1),
  ($dbw30278$tq-dbms-sql-9-create-table-3$dbw30278$, $dbw30279$pt-dbms-sql-9-create-table$dbw30279$,
   $dbw30280$How can two tables that need to reference each other via foreign keys (a circular reference) be created?$dbw30280$,
   $dbw30281$["It is impossible in SQL", "Create both tables without the problematic FK, then add it later via ALTER TABLE ADD CONSTRAINT", "Use CREATE SCHEMA instead of CREATE TABLE", "Use TRUNCATE TABLE first"]$dbw30281$::jsonb,
   1, $dbw30282$Circular foreign keys are handled by creating the tables first and adding the constraint afterward.$dbw30282$, 1, 2),
  ($dbw30283$tq-dbms-sql-9-create-table-4$dbw30283$, $dbw30284$pt-dbms-sql-9-create-table$dbw30284$,
   $dbw30285$What is the risk of using IF NOT EXISTS on a CREATE TABLE statement whose column definitions have changed since it was last run?$dbw30285$,
   $dbw30286$["It always throws an error", "It silently skips creation, so schema drift is not reconciled", "It automatically alters the existing table to match", "It drops and recreates the table"]$dbw30286$::jsonb,
   1, $dbw30287$IF NOT EXISTS just prevents an error if the table exists; it does not update the table to match a changed definition.$dbw30287$, 1, 3),
  ($dbw30288$tq-dbms-sql-9-create-table-5$dbw30288$, $dbw30289$pt-dbms-sql-9-create-table$dbw30289$,
   $dbw30290$Which clause enforces that a numeric column can never hold a non-positive value?$dbw30290$,
   $dbw30291$["DEFAULT (salary > 0)", "UNIQUE (salary > 0)", "CHECK (salary > 0)", "NOT NULL (salary > 0)"]$dbw30291$::jsonb,
   2, $dbw30292$CHECK constraints validate a boolean condition on every insert/update.$dbw30292$, 1, 4),
  ($dbw30293$tq-dbms-sql-9-create-table-6$dbw30293$, $dbw30294$pt-dbms-sql-9-create-table$dbw30294$,
   $dbw30295$Why should reserved words like 'order' or 'user' generally be avoided as table or column names?$dbw30295$,
   $dbw30296$["They are automatically converted to uppercase", "They require special quoting and can cause confusing syntax errors", "SQL does not allow them under any circumstances", "They automatically become primary keys"]$dbw30296$::jsonb,
   1, $dbw30297$Reserved words need quoting (e.g. double quotes) and are best avoided to reduce ambiguity and errors.$dbw30297$, 1, 5),
  ($dbw30298$tq-dbms-sql-9-create-table-7$dbw30298$, $dbw30299$pt-dbms-sql-9-create-table$dbw30299$,
   $dbw30300$A team originally defines `email VARCHAR(20)` and later needs longer values. What kind of statement is needed to fix this after the table already has data?$dbw30300$,
   $dbw30301$["A second CREATE TABLE statement", "An ALTER TABLE statement to widen the column", "A DROP SCHEMA statement", "Nothing \u2014 VARCHAR auto-expands"]$dbw30301$::jsonb,
   1, $dbw30302$Fixing an undersized column after creation requires ALTER TABLE, which is covered in the next topic and can be costly on large tables.$dbw30302$, 1, 6),
  ($dbw30303$tq-dbms-sql-9-create-table-8$dbw30303$, $dbw30304$pt-dbms-sql-9-create-table$dbw30304$,
   $dbw30305$Which statement about CREATE TABLE is most accurate?$dbw30305$,
   $dbw30306$["It always requires at least one foreign key", "It registers metadata (columns, types, constraints) in the system catalog and allocates storage", "It cannot include DEFAULT values", "It automatically populates the table with sample data"]$dbw30306$::jsonb,
   1, $dbw30307$CREATE TABLE's job is to register the table's structure and constraints and reserve storage for it.$dbw30307$, 1, 7)
on conflict (id) do nothing;

-- 9.4 ALTER TABLE
with g as (select id from public.learning_grids where lower(slug) = $dbw30308$dbms-sql-tutorial$dbw30308$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30309$chapter-9-ddl-and-schema-design$dbw30309$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30310$ALTER TABLE$dbw30310$, $dbw30311$alter-table$dbw30311$, '', 4, 'published', true, true, $dbw30312$dbms_sql_tutorial$dbw30312$, $dbw30313$chapter-9-ddl-and-schema-design/alter-table$dbw30313$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30314$dbms_sql_tutorial$dbw30314$ and source_ref = $dbw30315$chapter-9-ddl-and-schema-design/alter-table$dbw30315$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30316$ALTER TABLE$dbw30316$, $dbw30317$### Definition

`ALTER TABLE` modifies the structure of an existing table without recreating it from scratch: adding/dropping columns, changing data types, adding/dropping constraints, or renaming columns.

```sql
ALTER TABLE employees ADD COLUMN email VARCHAR(150);

ALTER TABLE employees ALTER COLUMN salary TYPE NUMERIC(12,2);

ALTER TABLE employees ADD CONSTRAINT chk_email CHECK (email LIKE '%@%');

ALTER TABLE employees DROP COLUMN legacy_flag;

ALTER TABLE employees RENAME COLUMN salary TO base_salary;
```

### How It Works

Depending on the change, the engine either updates catalog metadata only (cheap — e.g. adding a nullable column with no default in PostgreSQL 11+) or physically rewrites every row of the table (expensive — e.g. changing a column's data type, or adding a column with a non-null default on older engine versions). Rewrites require exclusive locks that can block reads and writes for the duration.

**Worked example — safely adding a required column to a huge, live table:**

```sql
-- Step 1: add nullable first (fast, metadata-only on modern Postgres)
ALTER TABLE employees ADD COLUMN status VARCHAR(20);

-- Step 2: backfill in batches (avoids one giant lock/transaction)
UPDATE employees SET status = 'active' WHERE status IS NULL AND id BETWEEN 1 AND 100000;
-- ... repeat in chunks ...

-- Step 3: only now enforce NOT NULL, once every row is populated
ALTER TABLE employees ALTER COLUMN status SET NOT NULL;
```

This "add nullable, backfill, then constrain" sequence avoids one long table-locking operation and is the standard technique for zero/low-downtime schema changes (also central to the "Schema Evolution" topic).

### Edge Cases and Pitfalls

- **Locking on huge live tables**: a type change or full-table rewrite can hold an exclusive lock for minutes or hours on a large table, blocking application traffic — a top cause of production incidents.
- **Adding NOT NULL without a default** on a populated table fails outright if any existing row would violate it.
- **Engine differences**: MySQL's `ALGORITHM=INPLACE, LOCK=NONE` and tools like `pt-online-schema-change`/`gh-ost` exist specifically to avoid blocking locks for large-table changes; PostgreSQL made many `ADD COLUMN` operations metadata-only since v11 but type changes still typically rewrite.
- **Dropping a column** is often irreversible in practice — the data is gone unless you have a backup, even though the table itself remains.
- Adding a constraint (like a new `CHECK` or `FOREIGN KEY`) forces a validation scan of existing rows by default, which is itself a locking operation on large tables (Postgres offers `NOT VALID` + separate `VALIDATE CONSTRAINT` to split this into two lighter steps).

### Key Takeaways / Q&A

**Q: Why is "add nullable, backfill, then constrain" preferred over "add NOT NULL column directly" on a huge live table?**
A: Adding a NOT NULL column directly either fails (no default) or requires rewriting every row at once with a default value while holding a lock — batching the backfill avoids one long blocking operation.

**Q: Is ALTER TABLE always cheap?**
A: No — it ranges from an instant metadata update to a full-table rewrite, depending on the exact change and the engine/version.$dbw30317$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30318$dbms_sql_tutorial_seed$dbw30318$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30319$dbms_sql_tutorial_seed$dbw30319$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30320$dbms-sql-tutorial$dbw30320$),
     t as (select id from public.learning_topics where source_kind = $dbw30321$dbms_sql_tutorial$dbw30321$ and source_ref = $dbw30322$chapter-9-ddl-and-schema-design/alter-table$dbw30322$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30323$pt-dbms-sql-9-alter-table$dbw30323$, $dbw30324$ALTER TABLE - Quick Test$dbw30324$, 'aptitude', 8, 8,
  $dbw30325$8 questions on ALTER TABLE.$dbw30325$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30326$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30326$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30327$tq-dbms-sql-9-alter-table-1$dbw30327$, $dbw30328$pt-dbms-sql-9-alter-table$dbw30328$,
   $dbw30329$What does ALTER TABLE allow you to do?$dbw30329$,
   $dbw30330$["Only rename a table", "Modify an existing table's structure \u2014 add/drop columns, change types, add/drop constraints", "Only delete rows from a table", "Create a brand new table"]$dbw30330$::jsonb,
   1, $dbw30331$ALTER TABLE modifies an existing table's structure without recreating it.$dbw30331$, 1, 0),
  ($dbw30332$tq-dbms-sql-9-alter-table-2$dbw30332$, $dbw30333$pt-dbms-sql-9-alter-table$dbw30333$,
   $dbw30334$Why can ALTER TABLE ... ALTER COLUMN ... TYPE be expensive on a huge table?$dbw30334$,
   $dbw30335$["It always requires dropping the whole database", "It can require a full-table rewrite under an exclusive lock", "It only works on empty tables", "It automatically creates a backup first"]$dbw30335$::jsonb,
   1, $dbw30336$Changing a column's data type commonly rewrites every row, holding a lock for the duration.$dbw30336$, 1, 1),
  ($dbw30337$tq-dbms-sql-9-alter-table-3$dbw30337$, $dbw30338$pt-dbms-sql-9-alter-table$dbw30338$,
   $dbw30339$What is the recommended sequence to add a required (NOT NULL) column to a huge, live, already-populated table with minimal locking?$dbw30339$,
   $dbw30340$["Add the column as NOT NULL directly in one statement", "Add it nullable, backfill values in batches, then set NOT NULL once fully populated", "Drop and recreate the table", "Only possible during scheduled downtime"]$dbw30340$::jsonb,
   1, $dbw30341$Adding nullable first, backfilling in batches, then constraining afterward avoids one long table-locking rewrite.$dbw30341$, 1, 2),
  ($dbw30342$tq-dbms-sql-9-alter-table-4$dbw30342$, $dbw30343$pt-dbms-sql-9-alter-table$dbw30343$,
   $dbw30344$What happens if you try to add a NOT NULL column with no DEFAULT to a table that already has rows?$dbw30344$,
   $dbw30345$["It succeeds silently, leaving nulls in old rows", "It fails, since existing rows would violate the NOT NULL constraint", "It automatically deletes all existing rows", "It converts the column to nullable automatically"]$dbw30345$::jsonb,
   1, $dbw30346$Existing rows have no value to put in the new NOT NULL column, so the operation fails unless a default is supplied or the column starts nullable.$dbw30346$, 1, 3),
  ($dbw30347$tq-dbms-sql-9-alter-table-5$dbw30347$, $dbw30348$pt-dbms-sql-9-alter-table$dbw30348$,
   $dbw30349$What is the purpose of tools like pt-online-schema-change or gh-ost, or MySQL's ALGORITHM=INPLACE, LOCK=NONE?$dbw30349$,
   $dbw30350$["To back up a database", "To perform schema changes on large live tables while minimizing locking/blocking", "To convert MySQL databases to PostgreSQL", "To generate sample data"]$dbw30350$::jsonb,
   1, $dbw30351$These tools/options exist specifically to avoid long blocking locks when altering large production tables.$dbw30351$, 1, 4),
  ($dbw30352$tq-dbms-sql-9-alter-table-6$dbw30352$, $dbw30353$pt-dbms-sql-9-alter-table$dbw30353$,
   $dbw30354$In PostgreSQL, what technique lets you add a new CHECK or FOREIGN KEY constraint on a large table without an immediate full validation scan under lock?$dbw30354$,
   $dbw30355$["ADD CONSTRAINT ... NOT VALID, followed later by a separate VALIDATE CONSTRAINT", "There is no such technique", "Using TRUNCATE first", "Renaming the table first"]$dbw30355$::jsonb,
   0, $dbw30356$NOT VALID skips the initial validation scan, which can then be run separately with VALIDATE CONSTRAINT, splitting the work into lighter steps.$dbw30356$, 1, 5),
  ($dbw30357$tq-dbms-sql-9-alter-table-7$dbw30357$, $dbw30358$pt-dbms-sql-9-alter-table$dbw30358$,
   $dbw30359$Is dropping a column with ALTER TABLE ... DROP COLUMN typically recoverable?$dbw30359$,
   $dbw30360$["Yes, columns are always recoverable via UNDO", "No, in practice the data is gone unless restored from a backup, even though the table itself remains", "It only removes the column name, keeping the data", "It automatically archives the dropped column elsewhere"]$dbw30360$::jsonb,
   1, $dbw30361$Dropping a column removes its data; recovery requires a backup, similar in spirit to other irreversible DDL operations.$dbw30361$, 1, 6),
  ($dbw30362$tq-dbms-sql-9-alter-table-8$dbw30362$, $dbw30363$pt-dbms-sql-9-alter-table$dbw30363$,
   $dbw30364$Since PostgreSQL 11, why is ALTER TABLE ADD COLUMN with no default often described as 'metadata-only' and fast?$dbw30364$,
   $dbw30365$["Because it deletes the table and recreates it instantly", "Because it doesn't need to rewrite existing rows \u2014 the new column is treated as unset until touched", "Because PostgreSQL disables constraints permanently", "Because it only works on temporary tables"]$dbw30365$::jsonb,
   1, $dbw30366$PostgreSQL can add such columns without rewriting existing rows, making the operation a fast metadata change rather than a full table rewrite.$dbw30366$, 1, 7)
on conflict (id) do nothing;

-- 9.5 DROP TABLE
with g as (select id from public.learning_grids where lower(slug) = $dbw30367$dbms-sql-tutorial$dbw30367$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30368$chapter-9-ddl-and-schema-design$dbw30368$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30369$DROP TABLE$dbw30369$, $dbw30370$drop-table$dbw30370$, '', 5, 'published', true, true, $dbw30371$dbms_sql_tutorial$dbw30371$, $dbw30372$chapter-9-ddl-and-schema-design/drop-table$dbw30372$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30373$dbms_sql_tutorial$dbw30373$ and source_ref = $dbw30374$chapter-9-ddl-and-schema-design/drop-table$dbw30374$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30375$DROP TABLE$dbw30375$, $dbw30376$### Definition

`DROP TABLE` permanently removes a table's **structure and all of its data** from the database. Unlike `TRUNCATE` (empties data, keeps structure) or `DELETE` (removes rows selectively), `DROP TABLE` erases the object entirely — columns, constraints, indexes, and rows all disappear.

```sql
DROP TABLE orders;

DROP TABLE IF EXISTS orders;

DROP TABLE orders CASCADE;   -- also drops dependent views/FKs that reference it
```

### How It Works

The engine removes the table's catalog entry and reclaims its storage. If other objects depend on the table — a foreign key from another table, or a view built with `SELECT * FROM orders` — the default behavior (`RESTRICT`) blocks the drop with an error. `CASCADE` forces the drop to proceed, taking all dependent objects down with it.

**Worked example:**

```sql
CREATE TABLE customers (id SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id));
CREATE VIEW customer_orders AS SELECT c.name, o.id FROM customers c JOIN orders o ON o.customer_id = c.id;

DROP TABLE customers;            -- ERROR: still referenced by orders.customer_id and by the view
DROP TABLE customers CASCADE;    -- succeeds, but silently drops the FK constraint on orders AND the view
```

That second statement is exactly why `CASCADE` deserves caution: it doesn't just fix the immediate blocker, it deletes every dependent object in one shot, possibly things the person running the command didn't even know existed.

### Edge Cases and Pitfalls

- **Irreversible outside a transaction**: once committed, the table and its data are gone. In engines with transactional DDL (PostgreSQL, SQL Server), running `DROP TABLE` inside an explicit transaction *can* be rolled back before `COMMIT`. In MySQL, DDL causes an implicit commit — there is no rollback once the statement runs.
- **Dependent views break** silently if dropped without `CASCADE` being noticed — always check dependencies first (e.g. via `information_schema` or engine-specific dependency views) before dropping in production.
- **No `WHERE` clause exists for DROP TABLE** — it is all-or-nothing on the entire object, unlike `DELETE`.
- Best practice before a destructive drop in production: rename the table first (`ALTER TABLE orders RENAME TO orders_pending_delete;`), let it sit for a safety window, then drop it once confident nothing still depends on it.

### Key Takeaways / Q&A

**Q: DROP TABLE vs TRUNCATE TABLE vs DELETE — what's the core difference?**
A: `DROP TABLE` removes the table object itself (structure + data + indexes + constraints). `TRUNCATE TABLE` empties all rows quickly but keeps the table structure. `DELETE` removes rows transactionally, row-by-row, optionally filtered with `WHERE`, and is the only one of the three that can target a subset of rows.

**Q: Can DROP TABLE be rolled back?**
A: Only inside an explicit transaction on engines with transactional DDL (e.g., PostgreSQL) and only before commit. On MySQL, no — DDL auto-commits.

**Q: What does CASCADE do that RESTRICT (the default) does not?**
A: CASCADE also drops every object that depends on the table (foreign keys, views, etc.) instead of erroring out.$dbw30376$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30377$dbms_sql_tutorial_seed$dbw30377$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30378$dbms_sql_tutorial_seed$dbw30378$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30379$dbms-sql-tutorial$dbw30379$),
     t as (select id from public.learning_topics where source_kind = $dbw30380$dbms_sql_tutorial$dbw30380$ and source_ref = $dbw30381$chapter-9-ddl-and-schema-design/drop-table$dbw30381$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30382$pt-dbms-sql-9-drop-table$dbw30382$, $dbw30383$DROP TABLE - Quick Test$dbw30383$, 'aptitude', 8, 8,
  $dbw30384$8 questions on DROP TABLE.$dbw30384$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30385$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30385$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30386$tq-dbms-sql-9-drop-table-1$dbw30386$, $dbw30387$pt-dbms-sql-9-drop-table$dbw30387$,
   $dbw30388$What does DROP TABLE remove?$dbw30388$,
   $dbw30389$["Only the rows, keeping the table definition", "The table's entire structure and all of its data, including indexes and constraints", "Only the indexes on the table", "Only rows matching a WHERE clause"]$dbw30389$::jsonb,
   1, $dbw30390$DROP TABLE erases the object entirely, unlike TRUNCATE (data only) or DELETE (selective rows).$dbw30390$, 1, 0),
  ($dbw30391$tq-dbms-sql-9-drop-table-2$dbw30391$, $dbw30392$pt-dbms-sql-9-drop-table$dbw30392$,
   $dbw30393$What is the key structural difference between DROP TABLE and TRUNCATE TABLE?$dbw30393$,
   $dbw30394$["They are identical in every way", "DROP TABLE removes the table object itself; TRUNCATE TABLE removes rows but keeps the table structure", "TRUNCATE TABLE removes the table object; DROP TABLE only removes rows", "DROP TABLE only works on views"]$dbw30394$::jsonb,
   1, $dbw30395$DROP TABLE deletes the entire object; TRUNCATE empties the data but leaves the (now empty) table structure intact.$dbw30395$, 1, 1),
  ($dbw30396$tq-dbms-sql-9-drop-table-3$dbw30396$, $dbw30397$pt-dbms-sql-9-drop-table$dbw30397$,
   $dbw30398$What does the RESTRICT behavior (the default) do when you try to DROP TABLE a table that other objects depend on?$dbw30398$,
   $dbw30399$["It silently drops the dependents too", "It blocks the drop with an error", "It renames the dependents automatically", "It converts the table into a view"]$dbw30399$::jsonb,
   1, $dbw30400$RESTRICT is the safe default: it refuses to drop a table that still has dependents.$dbw30400$, 1, 2),
  ($dbw30401$tq-dbms-sql-9-drop-table-4$dbw30401$, $dbw30402$pt-dbms-sql-9-drop-table$dbw30402$,
   $dbw30403$What is a major risk of using DROP TABLE ... CASCADE?$dbw30403$,
   $dbw30404$["It only works on temporary tables", "It can silently drop dependent objects like foreign keys and views the user may not know about", "It requires the table to be empty first", "It automatically creates a backup before dropping"]$dbw30404$::jsonb,
   1, $dbw30405$CASCADE removes every dependent object along with the table, which can have unintended side effects.$dbw30405$, 1, 3),
  ($dbw30406$tq-dbms-sql-9-drop-table-5$dbw30406$, $dbw30407$pt-dbms-sql-9-drop-table$dbw30407$,
   $dbw30408$In MySQL, why can't a DROP TABLE typically be rolled back even inside a BEGIN...COMMIT block?$dbw30408$,
   $dbw30409$["MySQL does not support DROP TABLE", "DDL statements in MySQL cause an implicit commit, so there is nothing left to roll back", "MySQL requires two-phase commit for all statements", "DROP TABLE in MySQL only works on views"]$dbw30409$::jsonb,
   1, $dbw30410$MySQL's DDL auto-commits, unlike PostgreSQL/SQL Server which support transactional DDL that can be rolled back before commit.$dbw30410$, 1, 4),
  ($dbw30411$tq-dbms-sql-9-drop-table-6$dbw30411$, $dbw30412$pt-dbms-sql-9-drop-table$dbw30412$,
   $dbw30413$Which of DROP TABLE, TRUNCATE TABLE, and DELETE supports a WHERE clause to target a subset of rows?$dbw30413$,
   $dbw30414$["All three", "Only DELETE", "Only TRUNCATE TABLE", "Only DROP TABLE"]$dbw30414$::jsonb,
   1, $dbw30415$Only DELETE can be filtered with WHERE; DROP TABLE and TRUNCATE TABLE act on the whole table.$dbw30415$, 1, 5),
  ($dbw30416$tq-dbms-sql-9-drop-table-7$dbw30416$, $dbw30417$pt-dbms-sql-9-drop-table$dbw30417$,
   $dbw30418$What is a recommended safety practice before running DROP TABLE on an important production table?$dbw30418$,
   $dbw30419$["Run TRUNCATE TABLE first", "Rename the table and let it sit for a safety window before actually dropping it", "Always use CASCADE to be thorough", "Disable all indexes first"]$dbw30419$::jsonb,
   1, $dbw30420$Renaming first provides a safety buffer to confirm nothing still depends on the table before permanently dropping it.$dbw30420$, 1, 6),
  ($dbw30421$tq-dbms-sql-9-drop-table-8$dbw30421$, $dbw30422$pt-dbms-sql-9-drop-table$dbw30422$,
   $dbw30423$On PostgreSQL, under what condition can a DROP TABLE statement actually be undone?$dbw30423$,
   $dbw30424$["Never, under any circumstance", "If it was run inside an explicit transaction and COMMIT has not yet been issued", "Only if CASCADE was used", "Only if the table had no rows"]$dbw30424$::jsonb,
   1, $dbw30425$PostgreSQL supports transactional DDL, so a DROP TABLE can be rolled back before the transaction commits.$dbw30425$, 1, 7)
on conflict (id) do nothing;

-- 9.6 TRUNCATE TABLE
with g as (select id from public.learning_grids where lower(slug) = $dbw30426$dbms-sql-tutorial$dbw30426$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30427$chapter-9-ddl-and-schema-design$dbw30427$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30428$TRUNCATE TABLE$dbw30428$, $dbw30429$truncate-table$dbw30429$, '', 6, 'published', true, true, $dbw30430$dbms_sql_tutorial$dbw30430$, $dbw30431$chapter-9-ddl-and-schema-design/truncate-table$dbw30431$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30432$dbms_sql_tutorial$dbw30432$ and source_ref = $dbw30433$chapter-9-ddl-and-schema-design/truncate-table$dbw30433$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30434$TRUNCATE TABLE$dbw30434$, $dbw30435$### Definition

`TRUNCATE TABLE` quickly removes **all rows** from a table while keeping its structure (columns, constraints, indexes) intact. It is optimized for speed: rather than deleting rows one at a time, it deallocates the data pages wholesale.

```sql
TRUNCATE TABLE staging_orders;

-- Postgres extras:
TRUNCATE TABLE staging_orders RESTART IDENTITY CASCADE;
```

### TRUNCATE vs DELETE (Recap and Contrast)

| Aspect | TRUNCATE TABLE | DELETE |
|---|---|---|
| Row selection | Whole table only, no `WHERE` | Can filter with `WHERE` |
| Speed on large tables | Very fast (deallocates pages) | Slower (row-by-row, fully logged) |
| Logging | Minimal | Full row-level logging |
| Triggers | Row-level triggers typically do **not** fire | Row-level triggers fire normally |
| Identity/auto-increment | Resets the counter (engine-dependent, see below) | Does not reset the counter |
| Transactional rollback | Dialect-dependent — see below | Always rollback-able within a transaction |

### The Dialect Nuance on Transactionality (Important)

A common but overly broad claim is "TRUNCATE cannot be rolled back." This is **engine-dependent**:
- **PostgreSQL and SQL Server**: `TRUNCATE` genuinely *can* be run inside a transaction and rolled back before commit — it is fully transactional there.
- **MySQL/InnoDB**: `TRUNCATE TABLE` causes an implicit commit (like other DDL), so it effectively **cannot** be rolled back once executed, behaving much more like `DROP TABLE`+`CREATE TABLE` under the hood.

Always verify this behavior on your specific engine before relying on it in a script that assumes rollback safety.

### Worked Example

A nightly ETL job needs to clear a staging table before reloading fresh data, and wants the identity counter reset for cleanliness:

```sql
BEGIN;
TRUNCATE TABLE staging_orders RESTART IDENTITY;
COPY staging_orders FROM '/data/today_orders.csv' WITH (FORMAT csv);
COMMIT;   -- on Postgres, this whole block is atomic; a failure before COMMIT rolls everything back
```

Using `DELETE FROM staging_orders;` instead would work too, but would be dramatically slower on a multi-million-row staging table and would generate far more transaction log/WAL volume.

### Edge Cases and Pitfalls

- **Fails in the presence of foreign keys** referencing the table (in Postgres/SQL Server) unless `CASCADE` is used or the referencing rows are handled — you can't truncate a table that other rows still point to.
- **Resets auto-increment/identity counters** by default in many engines (e.g., MySQL always resets; Postgres requires the explicit `RESTART IDENTITY` option, otherwise the counter is left untouched by default `CONTINUE IDENTITY`).
- **Does not fire row-level `AFTER DELETE` triggers** in most engines — code relying on delete triggers for auditing will silently miss truncations.
- Despite being "DDL-like" in behavior, syntactically it still reads like a DML statement (`TRUNCATE TABLE x;`), which confuses newcomers about why it resets identity counters while `DELETE FROM x;` does not.

### Key Takeaways / Q&A

**Q: Can I TRUNCATE just some rows matching a condition?**
A: No — TRUNCATE always affects 100% of the table's rows; for a filtered removal use `DELETE ... WHERE ...`.

**Q: Does TRUNCATE reset auto-increment counters?**
A: Typically yes (this is one of its defining differences from DELETE), though the exact default/option varies by engine (Postgres needs `RESTART IDENTITY` explicitly).$dbw30435$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30436$dbms_sql_tutorial_seed$dbw30436$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30437$dbms_sql_tutorial_seed$dbw30437$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30438$dbms-sql-tutorial$dbw30438$),
     t as (select id from public.learning_topics where source_kind = $dbw30439$dbms_sql_tutorial$dbw30439$ and source_ref = $dbw30440$chapter-9-ddl-and-schema-design/truncate-table$dbw30440$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30441$pt-dbms-sql-9-truncate-table$dbw30441$, $dbw30442$TRUNCATE TABLE - Quick Test$dbw30442$, 'aptitude', 8, 8,
  $dbw30443$8 questions on TRUNCATE TABLE.$dbw30443$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30444$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30444$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30445$tq-dbms-sql-9-truncate-table-1$dbw30445$, $dbw30446$pt-dbms-sql-9-truncate-table$dbw30446$,
   $dbw30447$What does TRUNCATE TABLE do?$dbw30447$,
   $dbw30448$["Removes the table structure entirely", "Quickly removes all rows from a table while keeping its structure intact", "Removes only rows matching a WHERE clause", "Renames the table"]$dbw30448$::jsonb,
   1, $dbw30449$TRUNCATE clears all data but preserves the table's columns, constraints, and indexes.$dbw30449$, 1, 0),
  ($dbw30450$tq-dbms-sql-9-truncate-table-2$dbw30450$, $dbw30451$pt-dbms-sql-9-truncate-table$dbw30451$,
   $dbw30452$Which statement can be filtered with a WHERE clause: TRUNCATE TABLE or DELETE?$dbw30452$,
   $dbw30453$["Both can", "Neither can", "Only DELETE", "Only TRUNCATE TABLE"]$dbw30453$::jsonb,
   2, $dbw30454$TRUNCATE always removes every row; only DELETE supports a WHERE clause.$dbw30454$, 1, 1),
  ($dbw30455$tq-dbms-sql-9-truncate-table-3$dbw30455$, $dbw30456$pt-dbms-sql-9-truncate-table$dbw30456$,
   $dbw30457$Why is TRUNCATE typically much faster than DELETE on a very large table?$dbw30457$,
   $dbw30458$["It uses a different programming language internally", "It deallocates data pages wholesale instead of removing rows one at a time with full logging", "It compresses the data first", "It only removes half the rows"]$dbw30458$::jsonb,
   1, $dbw30459$TRUNCATE's page-deallocation approach avoids the overhead of row-by-row logged deletion.$dbw30459$, 1, 2),
  ($dbw30460$tq-dbms-sql-9-truncate-table-4$dbw30460$, $dbw30461$pt-dbms-sql-9-truncate-table$dbw30461$,
   $dbw30462$Is it accurate to say 'TRUNCATE can never be rolled back' across all database engines?$dbw30462$,
   $dbw30463$["Yes, this is universally true", "No \u2014 it is engine-dependent: PostgreSQL and SQL Server support rollback within a transaction, while MySQL/InnoDB implicitly commits and cannot roll it back", "No, TRUNCATE can never be used inside any transaction", "Yes, but only for temporary tables"]$dbw30463$::jsonb,
   1, $dbw30464$This is a common oversimplification; rollback support for TRUNCATE varies by engine.$dbw30464$, 1, 3),
  ($dbw30465$tq-dbms-sql-9-truncate-table-5$dbw30465$, $dbw30466$pt-dbms-sql-9-truncate-table$dbw30466$,
   $dbw30467$What commonly happens to a table's auto-increment/identity counter after TRUNCATE, compared to DELETE?$dbw30467$,
   $dbw30468$["Both reset the counter identically", "TRUNCATE typically resets it (fully or via an explicit option); DELETE does not reset it", "DELETE always resets it; TRUNCATE never does", "Neither statement affects the counter"]$dbw30468$::jsonb,
   1, $dbw30469$TRUNCATE is commonly associated with resetting identity counters (e.g., PostgreSQL's RESTART IDENTITY option, MySQL's default behavior), unlike DELETE.$dbw30469$, 1, 4),
  ($dbw30470$tq-dbms-sql-9-truncate-table-6$dbw30470$, $dbw30471$pt-dbms-sql-9-truncate-table$dbw30471$,
   $dbw30472$Why might a TRUNCATE TABLE statement fail on a table referenced by foreign keys from another table?$dbw30472$,
   $dbw30473$["TRUNCATE never fails under any condition", "Because other rows still reference this table's rows, and TRUNCATE cannot proceed without CASCADE or resolving those dependencies", "Because TRUNCATE requires the table to have no indexes", "Because foreign keys are automatically dropped by TRUNCATE"]$dbw30473$::jsonb,
   1, $dbw30474$Referential integrity blocks truncation of a table whose rows are still referenced elsewhere, similar in spirit to DROP TABLE dependency checks.$dbw30474$, 1, 5),
  ($dbw30475$tq-dbms-sql-9-truncate-table-7$dbw30475$, $dbw30476$pt-dbms-sql-9-truncate-table$dbw30476$,
   $dbw30477$What is a practical consequence of TRUNCATE typically not firing row-level AFTER DELETE triggers?$dbw30477$,
   $dbw30478$["Nothing, triggers always fire regardless of the statement used", "Auditing/logging logic that relies on delete triggers may silently miss truncations", "The table becomes read-only afterward", "TRUNCATE becomes slower than DELETE as a result"]$dbw30478$::jsonb,
   1, $dbw30479$Since most engines skip row-level triggers during TRUNCATE, trigger-based auditing can miss these events.$dbw30479$, 1, 6),
  ($dbw30480$tq-dbms-sql-9-truncate-table-8$dbw30480$, $dbw30481$pt-dbms-sql-9-truncate-table$dbw30481$,
   $dbw30482$A nightly ETL job uses TRUNCATE TABLE staging_orders; followed by a bulk load, wrapped in BEGIN...COMMIT on PostgreSQL. What happens if the bulk load fails before COMMIT?$dbw30482$,
   $dbw30483$["The truncate is already permanent and cannot be undone", "Both the truncate and the failed load are rolled back together since Postgres supports transactional TRUNCATE", "Only the load is rolled back; the table stays truncated", "The database crashes"]$dbw30483$::jsonb,
   1, $dbw30484$Because PostgreSQL treats TRUNCATE as transactional, a failure before COMMIT rolls back the whole block, including the truncate.$dbw30484$, 1, 7)
on conflict (id) do nothing;

-- 9.7 RENAME
with g as (select id from public.learning_grids where lower(slug) = $dbw30485$dbms-sql-tutorial$dbw30485$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30486$chapter-9-ddl-and-schema-design$dbw30486$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30487$RENAME$dbw30487$, $dbw30488$rename-statement$dbw30488$, '', 7, 'published', true, true, $dbw30489$dbms_sql_tutorial$dbw30489$, $dbw30490$chapter-9-ddl-and-schema-design/rename-statement$dbw30490$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30491$dbms_sql_tutorial$dbw30491$ and source_ref = $dbw30492$chapter-9-ddl-and-schema-design/rename-statement$dbw30492$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30493$RENAME$dbw30493$, $dbw30494$### Definition

Renaming lets you change the name of a table, column, or other object **without recreating it** — data, indexes, and most permissions are preserved; only the name changes.

```sql
-- PostgreSQL
ALTER TABLE employees RENAME TO staff;
ALTER TABLE staff RENAME COLUMN salary TO base_salary;

-- MySQL
RENAME TABLE employees TO staff;
ALTER TABLE staff RENAME COLUMN salary TO base_salary;   -- MySQL 8.0+
ALTER TABLE staff CHANGE salary base_salary DECIMAL(10,2); -- older MySQL syntax (also allows type change)

-- SQL Server
EXEC sp_rename 'employees', 'staff';
EXEC sp_rename 'staff.salary', 'base_salary', 'COLUMN';
```

### How It Works

The engine updates the catalog entry that maps the object's name to its underlying storage/identifier — the physical data files and internal object ID typically don't change, only the label used to address it. This is why renames are usually near-instant, unlike a full rebuild.

**Worked example — a phased table rename during migration:**

```sql
ALTER TABLE employees RENAME TO staff;
CREATE VIEW employees AS SELECT * FROM staff;   -- compatibility shim
-- Update application code over the next release cycle to use `staff` directly.
-- Once nothing queries the `employees` view anymore, drop it.
DROP VIEW employees;
```

This lets a rename roll out without a hard cutover, avoiding breaking every caller simultaneously.

### Edge Cases and Pitfalls

- **Dependent objects may still reference the old name internally**: in some engines (notably older MySQL), a view defined with `SELECT * FROM employees` can break or behave unexpectedly if the underlying table is renamed, because the view's definition was resolved/cached at creation time.
- **Foreign key constraints** generally continue to work after a table rename (they track the object internally, not just the name) — but always verify on your specific engine and version.
- **Application/connection code and cached query plans** may reference the old name; a rename doesn't retroactively fix hardcoded SQL strings scattered through an application.
- **Case sensitivity**: renaming to a name differing only by case can behave inconsistently across operating systems/engines (e.g., case-insensitive collations).
- **Locking during rename**: even though it's metadata-only, most engines still take a brief exclusive lock, which can momentarily block concurrent queries on a busy table — rename during low-traffic windows for critical tables.
- Renaming a column that's referenced in stored procedures, triggers, or ORM model definitions is a very common source of runtime errors that only surface later, not at rename time.

### Key Takeaways / Q&A

**Q: Does renaming a table change its data or indexes?**
A: No — data and indexes are preserved; only the name (and possibly dependent object bookkeeping) changes.

**Q: Why is a compatibility view a good idea when renaming a heavily used table?**
A: It lets old queries keep working under the old name during a transition period while new code and be migrated to the new name gradually, avoiding a hard, all-at-once cutover.

**Q: Is a rename always instantaneous?**
A: It's typically fast (metadata-only) but still requires a brief lock, and dependent-object bookkeeping (especially in older MySQL versions with views) can complicate things beyond a pure name change.$dbw30494$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30495$dbms_sql_tutorial_seed$dbw30495$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30496$dbms_sql_tutorial_seed$dbw30496$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30497$dbms-sql-tutorial$dbw30497$),
     t as (select id from public.learning_topics where source_kind = $dbw30498$dbms_sql_tutorial$dbw30498$ and source_ref = $dbw30499$chapter-9-ddl-and-schema-design/rename-statement$dbw30499$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30500$pt-dbms-sql-9-rename-statement$dbw30500$, $dbw30501$RENAME - Quick Test$dbw30501$, 'aptitude', 8, 8,
  $dbw30502$8 questions on RENAME.$dbw30502$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30503$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30503$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30504$tq-dbms-sql-9-rename-statement-1$dbw30504$, $dbw30505$pt-dbms-sql-9-rename-statement$dbw30505$,
   $dbw30506$What is preserved when you rename a table using ALTER TABLE ... RENAME TO?$dbw30506$,
   $dbw30507$["Nothing \u2014 all data is lost", "The data and indexes; only the object's name changes", "Only the indexes, not the data", "Only the data, not the indexes"]$dbw30507$::jsonb,
   1, $dbw30508$Renaming updates the catalog's name mapping while data and indexes remain intact.$dbw30508$, 1, 0),
  ($dbw30509$tq-dbms-sql-9-rename-statement-2$dbw30509$, $dbw30510$pt-dbms-sql-9-rename-statement$dbw30510$,
   $dbw30511$Which SQL Server procedure is used to rename a table or column?$dbw30511$,
   $dbw30512$["ALTER RENAME", "sp_rename", "RENAME OBJECT", "MODIFY TABLE"]$dbw30512$::jsonb,
   1, $dbw30513$SQL Server uses the sp_rename system stored procedure for renaming objects.$dbw30513$, 1, 1),
  ($dbw30514$tq-dbms-sql-9-rename-statement-3$dbw30514$, $dbw30515$pt-dbms-sql-9-rename-statement$dbw30515$,
   $dbw30516$What is a documented risk of renaming a table in older MySQL versions when views reference it with SELECT *?$dbw30516$,
   $dbw30517$["The view is automatically renamed too", "The view may break or behave unexpectedly because its definition was resolved/cached at creation time", "MySQL blocks all renames if any view exists", "Views are unaffected in every MySQL version"]$dbw30517$::jsonb,
   1, $dbw30518$Dependent views can be a pitfall of renaming, especially historically in MySQL, since their column resolution was cached.$dbw30518$, 1, 2),
  ($dbw30519$tq-dbms-sql-9-rename-statement-4$dbw30519$, $dbw30520$pt-dbms-sql-9-rename-statement$dbw30520$,
   $dbw30521$Why might a team create a compatibility view (e.g., CREATE VIEW employees AS SELECT * FROM staff) after renaming a table?$dbw30521$,
   $dbw30522$["To improve query performance", "To let old code using the old table name keep working during a gradual migration", "Because views are required by SQL syntax after a rename", "To reduce storage usage"]$dbw30522$::jsonb,
   1, $dbw30523$A compatibility view provides a soft transition period instead of forcing an immediate, all-at-once cutover of every caller.$dbw30523$, 1, 3),
  ($dbw30524$tq-dbms-sql-9-rename-statement-5$dbw30524$, $dbw30525$pt-dbms-sql-9-rename-statement$dbw30525$,
   $dbw30526$Does renaming a table typically require rewriting the table's physical data files?$dbw30526$,
   $dbw30527$["Yes, always", "No \u2014 it is usually a metadata-only catalog change, so it is fast", "Only if the table has more than one index", "Only on PostgreSQL"]$dbw30527$::jsonb,
   1, $dbw30528$Renaming just updates the name-to-object mapping in most engines, which is why it's typically near-instant.$dbw30528$, 1, 4),
  ($dbw30529$tq-dbms-sql-9-rename-statement-6$dbw30529$, $dbw30530$pt-dbms-sql-9-rename-statement$dbw30530$,
   $dbw30531$What is a real risk when renaming a column that is used inside stored procedures or ORM model definitions?$dbw30531$,
   $dbw30532$["No risk \u2014 all references update automatically everywhere", "Those references are not automatically updated and can cause runtime errors discovered later", "The stored procedures are automatically deleted", "The rename operation itself will fail immediately"]$dbw30532$::jsonb,
   1, $dbw30533$A rename doesn't retroactively fix hardcoded references in procedures, triggers, or application code.$dbw30533$, 1, 5),
  ($dbw30534$tq-dbms-sql-9-rename-statement-7$dbw30534$, $dbw30535$pt-dbms-sql-9-rename-statement$dbw30535$,
   $dbw30536$Even though a rename is usually metadata-only, why might it still momentarily affect concurrent queries on a busy table?$dbw30536$,
   $dbw30537$["It requires a full table scan", "Most engines still take a brief exclusive lock during the rename", "It always drops and recreates all indexes", "It forces a database restart"]$dbw30537$::jsonb,
   1, $dbw30538$A short exclusive lock is typically required even for a metadata-only rename, which can briefly block concurrent access.$dbw30538$, 1, 6),
  ($dbw30539$tq-dbms-sql-9-rename-statement-8$dbw30539$, $dbw30540$pt-dbms-sql-9-rename-statement$dbw30540$,
   $dbw30541$In general, do foreign key constraints continue to function correctly after the referenced table is renamed?$dbw30541$,
   $dbw30542$["No, foreign keys are always dropped by a rename", "Generally yes, since most engines track the relationship by internal object identity rather than by name alone, but this should be verified per engine/version", "Only if the constraint is manually recreated after every rename", "Only in MySQL"]$dbw30542$::jsonb,
   1, $dbw30543$Most engines track foreign keys internally rather than purely by name, so they typically survive a rename, though verification per engine is wise.$dbw30543$, 1, 7)
on conflict (id) do nothing;

-- 9.8 Generated Columns
with g as (select id from public.learning_grids where lower(slug) = $dbw30544$dbms-sql-tutorial$dbw30544$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30545$chapter-9-ddl-and-schema-design$dbw30545$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30546$Generated Columns$dbw30546$, $dbw30547$generated-columns$dbw30547$, '', 8, 'published', true, true, $dbw30548$dbms_sql_tutorial$dbw30548$, $dbw30549$chapter-9-ddl-and-schema-design/generated-columns$dbw30549$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30550$dbms_sql_tutorial$dbw30550$ and source_ref = $dbw30551$chapter-9-ddl-and-schema-design/generated-columns$dbw30551$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30552$Generated Columns$dbw30552$, $dbw30553$### Definition

A generated (a.k.a. computed) column's value is automatically derived from an expression over other columns in the same row, rather than being supplied directly by an `INSERT`/`UPDATE`. It exists to keep derived data consistent without relying on application code or triggers.

```sql
-- PostgreSQL (STORED is currently the only supported kind)
CREATE TABLE order_items (
    id       SERIAL PRIMARY KEY,
    qty      INT NOT NULL,
    price    NUMERIC(10,2) NOT NULL,
    total    NUMERIC(12,2) GENERATED ALWAYS AS (qty * price) STORED
);

-- MySQL (supports both STORED and VIRTUAL)
CREATE TABLE order_items (
    qty   INT,
    price DECIMAL(10,2),
    total DECIMAL(12,2) AS (qty * price) STORED
);

-- SQL Server ("computed column")
CREATE TABLE order_items (
    qty   INT,
    price DECIMAL(10,2),
    total AS (qty * price) PERSISTED
);
```

### STORED vs VIRTUAL

- **STORED / PERSISTED**: the computed value is physically written to disk alongside the row, recalculated whenever a source column changes. It can be indexed like a normal column, at the cost of extra storage.
- **VIRTUAL**: the value is computed on read and not stored at all (MySQL and SQL Server support this; PostgreSQL currently only supports `STORED`). Saves space but adds CPU cost per read and, in some engines, cannot be indexed directly (SQL Server *can* index some virtual computed columns).

### Worked Example

A useful, realistic use is building a searchable full name from parts, and indexing it:

```sql
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    full_name  TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED
);

CREATE INDEX idx_users_full_name ON users (full_name);

SELECT * FROM users WHERE full_name = 'Ada Lovelace';   -- uses the index, no runtime concatenation needed
```

### Edge Cases and Pitfalls

- **You cannot write to a generated column directly**: `INSERT INTO order_items (qty, price, total) VALUES (2, 9.99, 19.98);` raises an error in PostgreSQL — `total` must be omitted, always letting the engine compute it.
- **Dependency locking**: you generally cannot drop or change the type of a column that a generated column depends on without first altering/dropping the generated column.
- **Expression restrictions**: the expression must typically be deterministic — no subqueries, no calls to other tables, and often no volatile functions (e.g. `now()`, `random()`) are allowed, since the value must be reliably reproducible from the row's own columns.
- **Not free**: STORED generated columns consume real disk space and add write-time CPU cost on every insert/update to source columns.

### Key Takeaways / Q&A

**Q: Can you INSERT a value directly into a generated column?**
A: No — its value is always derived by the engine from its expression; attempting to supply one explicitly raises an error.

**Q: Why choose STORED over VIRTUAL for a generated column you plan to query often?**
A: STORED values can be indexed directly and avoid recomputation on every read, trading extra storage for query performance.

**Q: What happens if you try to drop a column referenced by a generated column's expression?**
A: Most engines block it (or require you to drop/alter the generated column first), since the expression would no longer be computable.$dbw30553$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30554$dbms_sql_tutorial_seed$dbw30554$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30555$dbms_sql_tutorial_seed$dbw30555$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30556$dbms-sql-tutorial$dbw30556$),
     t as (select id from public.learning_topics where source_kind = $dbw30557$dbms_sql_tutorial$dbw30557$ and source_ref = $dbw30558$chapter-9-ddl-and-schema-design/generated-columns$dbw30558$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30559$pt-dbms-sql-9-generated-columns$dbw30559$, $dbw30560$Generated Columns - Quick Test$dbw30560$, 'aptitude', 8, 8,
  $dbw30561$8 questions on Generated Columns.$dbw30561$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30562$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30562$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30563$tq-dbms-sql-9-generated-columns-1$dbw30563$, $dbw30564$pt-dbms-sql-9-generated-columns$dbw30564$,
   $dbw30565$What is a generated (computed) column?$dbw30565$,
   $dbw30566$["A column whose value is manually entered by the user on every insert", "A column whose value is automatically derived from an expression over other columns in the same row", "A column that stores a foreign key reference", "A column used only for indexing purposes"]$dbw30566$::jsonb,
   1, $dbw30567$Generated columns compute their value from an expression rather than accepting a directly supplied value.$dbw30567$, 1, 0),
  ($dbw30568$tq-dbms-sql-9-generated-columns-2$dbw30568$, $dbw30569$pt-dbms-sql-9-generated-columns$dbw30569$,
   $dbw30570$What is the difference between STORED and VIRTUAL generated columns?$dbw30570$,
   $dbw30571$["There is no difference, they are synonyms", "STORED writes the computed value to disk; VIRTUAL computes it on read without storing it", "VIRTUAL is only available in PostgreSQL; STORED is only available in MySQL", "STORED columns cannot be indexed while VIRTUAL columns always can"]$dbw30571$::jsonb,
   1, $dbw30572$STORED persists the value physically (usable in indexes); VIRTUAL computes it at query time without storage.$dbw30572$, 1, 1),
  ($dbw30573$tq-dbms-sql-9-generated-columns-3$dbw30573$, $dbw30574$pt-dbms-sql-9-generated-columns$dbw30574$,
   $dbw30575$What happens if you try to directly INSERT a value into a GENERATED ALWAYS AS column in PostgreSQL?$dbw30575$,
   $dbw30576$["It succeeds and overrides the computed value", "It raises an error \u2014 the value must always be derived by the engine, not supplied directly", "It is silently ignored", "It sets the column to NULL"]$dbw30576$::jsonb,
   1, $dbw30577$GENERATED ALWAYS columns cannot accept explicit values; the engine always computes them.$dbw30577$, 1, 2),
  ($dbw30578$tq-dbms-sql-9-generated-columns-4$dbw30578$, $dbw30579$pt-dbms-sql-9-generated-columns$dbw30579$,
   $dbw30580$Why can STORED generated columns be indexed directly while some engines restrict indexing on VIRTUAL ones?$dbw30580$,
   $dbw30581$["Indexing rules are unrelated to storage", "STORED values physically exist on disk like a normal column, whereas VIRTUAL values are computed on the fly", "VIRTUAL columns are always faster to index", "STORED columns are always primary keys"]$dbw30581$::jsonb,
   1, $dbw30582$Because STORED columns have a physical on-disk value, they can be indexed the same way as any other column.$dbw30582$, 1, 3),
  ($dbw30583$tq-dbms-sql-9-generated-columns-5$dbw30583$, $dbw30584$pt-dbms-sql-9-generated-columns$dbw30584$,
   $dbw30585$Which kind of expression is typically NOT allowed in a generated column definition?$dbw30585$,
   $dbw30586$["Arithmetic on other columns in the same row", "String concatenation of other columns in the same row", "A call to a volatile, non-deterministic function like now() or random()", "A CASE expression over other columns in the same row"]$dbw30586$::jsonb,
   2, $dbw30587$Generated column expressions must generally be deterministic, so volatile functions are typically disallowed.$dbw30587$, 1, 4),
  ($dbw30588$tq-dbms-sql-9-generated-columns-6$dbw30588$, $dbw30589$pt-dbms-sql-9-generated-columns$dbw30589$,
   $dbw30590$What typically happens if you try to drop a source column that a generated column's expression depends on?$dbw30590$,
   $dbw30591$["It succeeds silently, leaving the generated column broken", "Most engines block the drop unless the generated column is altered or dropped first", "The generated column automatically becomes a regular column", "It is impossible to ever create such a dependency"]$dbw30591$::jsonb,
   1, $dbw30592$Dependency enforcement typically prevents dropping a column that a generated expression relies on.$dbw30592$, 1, 5),
  ($dbw30593$tq-dbms-sql-9-generated-columns-7$dbw30593$, $dbw30594$pt-dbms-sql-9-generated-columns$dbw30594$,
   $dbw30595$What is a realistic reason to create a STORED generated column like full_name = first_name || ' ' || last_name and index it?$dbw30595$,
   $dbw30596$["To reduce the total number of columns in the table", "To allow fast, indexable searching by full name without recomputing the concatenation on every query", "Because PostgreSQL requires it for text columns", "To avoid needing a primary key"]$dbw30596$::jsonb,
   1, $dbw30597$Storing and indexing the computed value avoids repeated runtime concatenation and enables efficient lookups.$dbw30597$, 1, 6),
  ($dbw30598$tq-dbms-sql-9-generated-columns-8$dbw30598$, $dbw30599$pt-dbms-sql-9-generated-columns$dbw30599$,
   $dbw30600$What is a cost of using STORED generated columns extensively on a write-heavy table?$dbw30600$,
   $dbw30601$["They have no cost at all", "They consume extra disk space and add CPU/write cost whenever source columns change", "They prevent the table from ever being indexed", "They disable transactions on the table"]$dbw30601$::jsonb,
   1, $dbw30602$STORED columns are recalculated and rewritten to disk on relevant changes, incurring real storage and write overhead.$dbw30602$, 1, 7)
on conflict (id) do nothing;

-- 9.9 Identity Columns
with g as (select id from public.learning_grids where lower(slug) = $dbw30603$dbms-sql-tutorial$dbw30603$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30604$chapter-9-ddl-and-schema-design$dbw30604$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30605$Identity Columns$dbw30605$, $dbw30606$identity-columns$dbw30606$, '', 9, 'published', true, true, $dbw30607$dbms_sql_tutorial$dbw30607$, $dbw30608$chapter-9-ddl-and-schema-design/identity-columns$dbw30608$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30609$dbms_sql_tutorial$dbw30609$ and source_ref = $dbw30610$chapter-9-ddl-and-schema-design/identity-columns$dbw30610$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30611$Identity Columns$dbw30611$, $dbw30612$### Definition

An identity column is a column-level mechanism that automatically generates a unique, sequential value on insert — most commonly used for surrogate primary keys.

```sql
-- Standard SQL / PostgreSQL
CREATE TABLE students (
    id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- MySQL
CREATE TABLE students (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- SQL Server
CREATE TABLE students (
    id   INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);
```

### GENERATED ALWAYS vs GENERATED BY DEFAULT

The standard SQL/PostgreSQL syntax offers two modes:
- `GENERATED ALWAYS AS IDENTITY` — the engine always assigns the value; an explicit `INSERT` value is rejected unless you use `OVERRIDING SYSTEM VALUE`.
- `GENERATED BY DEFAULT AS IDENTITY` — behaves like a normal default: the engine generates a value only if the insert doesn't supply one, useful when migrating existing rows with pre-assigned IDs.

```sql
-- bulk-loading legacy IDs into a GENERATED ALWAYS column requires an explicit override
INSERT INTO students (id, name) OVERRIDING SYSTEM VALUE VALUES (500, 'Legacy Import');
```

### How It Works

Internally, most engines (including PostgreSQL) implement identity columns using a hidden, dedicated sequence object bound one-to-one to that column. Each insert calls the equivalent of `nextval()` on that internal sequence to obtain the next value, which is then used as the column's default.

### Edge Cases and Pitfalls

- **Gaps are normal, not bugs**: a rolled-back transaction or a failed insert still consumes a value from the counter (because the counter increment itself isn't part of the transaction being rolled back on most engines), so `id` sequences having gaps (1, 2, 5, 6...) is expected behavior, not corruption.
- **TRUNCATE vs DELETE effect on the counter**: many engines reset the identity counter on `TRUNCATE` (Postgres needs the explicit `RESTART IDENTITY` option; MySQL resets by default) but leave it untouched after a plain `DELETE`, even `DELETE FROM students;` with no `WHERE` — the next inserted row still continues from wherever the counter was.
- **Concurrency-safe by design**: the mechanism guarantees no two concurrent inserts get the same value, without the application needing its own locking.
- **Cannot easily "reuse" a deleted ID** for a new row — by design, since gaps are considered acceptable and reuse risks referencing stale foreign keys.

### Key Takeaways / Q&A

**Q: Identity Column vs Sequence — what's the core distinction?**
A: An identity column is bound to exactly one column of one table and generates values automatically as part of that column's definition. A Sequence (see next topic) is a standalone, independent object that can be shared across multiple tables/columns and referenced explicitly with `nextval()`. In fact, PostgreSQL's identity columns are implemented internally *using* a hidden sequence — identity columns are essentially "a sequence with convenience wrapping" bound to one column.

**Q: Why did my table's id jump from 42 straight to 47?**
A: Almost certainly some inserts between 43 and 46 failed or were rolled back — the counter still advanced even though those rows never landed, which is expected identity-column behavior, not a bug.$dbw30612$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30613$dbms_sql_tutorial_seed$dbw30613$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30614$dbms_sql_tutorial_seed$dbw30614$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30615$dbms-sql-tutorial$dbw30615$),
     t as (select id from public.learning_topics where source_kind = $dbw30616$dbms_sql_tutorial$dbw30616$ and source_ref = $dbw30617$chapter-9-ddl-and-schema-design/identity-columns$dbw30617$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30618$pt-dbms-sql-9-identity-columns$dbw30618$, $dbw30619$Identity Columns - Quick Test$dbw30619$, 'aptitude', 8, 8,
  $dbw30620$8 questions on Identity Columns.$dbw30620$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30621$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30621$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30622$tq-dbms-sql-9-identity-columns-1$dbw30622$, $dbw30623$pt-dbms-sql-9-identity-columns$dbw30623$,
   $dbw30624$What is an identity column primarily used for?$dbw30624$,
   $dbw30625$["Storing free-text descriptions", "Automatically generating a unique, sequential value on insert, commonly for surrogate primary keys", "Enforcing a CHECK constraint", "Storing computed totals from other columns"]$dbw30625$::jsonb,
   1, $dbw30626$Identity columns auto-generate sequential unique values, most commonly used for primary keys.$dbw30626$, 1, 0),
  ($dbw30627$tq-dbms-sql-9-identity-columns-2$dbw30627$, $dbw30628$pt-dbms-sql-9-identity-columns$dbw30628$,
   $dbw30629$What is the core distinction between GENERATED ALWAYS AS IDENTITY and GENERATED BY DEFAULT AS IDENTITY?$dbw30629$,
   $dbw30630$["They are exact synonyms", "GENERATED ALWAYS rejects explicit insert values by default; GENERATED BY DEFAULT allows an explicit value to override the generated one", "GENERATED BY DEFAULT can only be used with text columns", "GENERATED ALWAYS is only available in MySQL"]$dbw30630$::jsonb,
   1, $dbw30631$GENERATED ALWAYS enforces engine-assigned values (needing OVERRIDING SYSTEM VALUE to bypass), while GENERATED BY DEFAULT lets an explicit value take precedence when supplied.$dbw30631$, 1, 1),
  ($dbw30632$tq-dbms-sql-9-identity-columns-3$dbw30632$, $dbw30633$pt-dbms-sql-9-identity-columns$dbw30633$,
   $dbw30634$Why are gaps in an identity column's sequence (e.g., 1, 2, 5, 6) generally considered normal rather than a bug?$dbw30634$,
   $dbw30635$["Because identity columns are supposed to be random", "Because the counter can be advanced by rolled-back or failed inserts, whose consumed values are not reused", "Because gaps only occur due to database corruption", "Because identity columns always skip even numbers"]$dbw30635$::jsonb,
   1, $dbw30636$The counter increment typically isn't rolled back along with a failed transaction, so gaps are expected.$dbw30636$, 1, 2),
  ($dbw30637$tq-dbms-sql-9-identity-columns-4$dbw30637$, $dbw30638$pt-dbms-sql-9-identity-columns$dbw30638$,
   $dbw30639$How does TRUNCATE typically affect an identity/auto-increment counter compared to a plain DELETE with no WHERE clause?$dbw30639$,
   $dbw30640$["Both reset the counter identically", "TRUNCATE commonly resets the counter (directly or via an explicit option); a plain DELETE typically leaves it untouched", "DELETE always resets it; TRUNCATE never does", "Neither statement ever affects the counter"]$dbw30640$::jsonb,
   1, $dbw30641$This mirrors the TRUNCATE vs DELETE distinction: TRUNCATE is associated with resetting identity counters, while DELETE is not.$dbw30641$, 1, 3),
  ($dbw30642$tq-dbms-sql-9-identity-columns-5$dbw30642$, $dbw30643$pt-dbms-sql-9-identity-columns$dbw30643$,
   $dbw30644$What is the core distinction between an Identity Column and a Sequence?$dbw30644$,
   $dbw30645$["They are unrelated concepts with no overlap", "An identity column is bound to one specific column of one table; a sequence is a standalone object that can be shared across multiple tables/columns", "A sequence can only be used once ever", "Identity columns can be shared across tables while sequences cannot"]$dbw30645$::jsonb,
   1, $dbw30646$Identity columns are column-attached; sequences are independent, reusable generator objects — some engines implement identity columns on top of sequences internally.$dbw30646$, 1, 4),
  ($dbw30647$tq-dbms-sql-9-identity-columns-6$dbw30647$, $dbw30648$pt-dbms-sql-9-identity-columns$dbw30648$,
   $dbw30649$In PostgreSQL, how are identity columns typically implemented under the hood?$dbw30649$,
   $dbw30650$["Using a hidden trigger that runs a random number generator", "Using a hidden, dedicated sequence object bound one-to-one to the column", "By scanning the table for the current maximum value on every insert", "Using an external application server"]$dbw30650$::jsonb,
   1, $dbw30651$PostgreSQL implements identity columns using an internal sequence tied to that column.$dbw30651$, 1, 5),
  ($dbw30652$tq-dbms-sql-9-identity-columns-7$dbw30652$, $dbw30653$pt-dbms-sql-9-identity-columns$dbw30653$,
   $dbw30654$What must you use to insert an explicit value into a column defined as GENERATED ALWAYS AS IDENTITY?$dbw30654$,
   $dbw30655$["Nothing special \u2014 explicit values are always accepted", "The OVERRIDING SYSTEM VALUE clause in the INSERT statement", "A separate ALTER TABLE statement", "You can never insert an explicit value into such a column"]$dbw30655$::jsonb,
   1, $dbw30656$GENERATED ALWAYS requires OVERRIDING SYSTEM VALUE to allow an explicit value to be used, such as during a legacy data import.$dbw30656$, 1, 6),
  ($dbw30657$tq-dbms-sql-9-identity-columns-8$dbw30657$, $dbw30658$pt-dbms-sql-9-identity-columns$dbw30658$,
   $dbw30659$Why is reusing a deleted identity value for a brand-new row generally discouraged and not done automatically?$dbw30659$,
   $dbw30660$["It would improve performance", "It risks the new row appearing linked to stale foreign key references that pointed at the old, deleted row's ID", "SQL syntax forbids reusing any integer", "It would violate the NOT NULL constraint"]$dbw30660$::jsonb,
   1, $dbw30661$Reusing IDs risks accidental referential collisions with old foreign key references, so gaps are preferred over reuse.$dbw30661$, 1, 7)
on conflict (id) do nothing;

-- 9.10 Sequences
with g as (select id from public.learning_grids where lower(slug) = $dbw30662$dbms-sql-tutorial$dbw30662$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30663$chapter-9-ddl-and-schema-design$dbw30663$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30664$Sequences$dbw30664$, $dbw30665$sequences$dbw30665$, '', 10, 'published', true, true, $dbw30666$dbms_sql_tutorial$dbw30666$, $dbw30667$chapter-9-ddl-and-schema-design/sequences$dbw30667$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30668$dbms_sql_tutorial$dbw30668$ and source_ref = $dbw30669$chapter-9-ddl-and-schema-design/sequences$dbw30669$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30670$Sequences$dbw30670$, $dbw30671$### Definition

A **sequence** is a standalone, schema-level object that generates a series of unique numeric values, independent of any single table or column. Unlike an identity column, a sequence is created, altered, and dropped on its own, and its values can be pulled by any number of tables or even application code.

```sql
CREATE SEQUENCE order_seq
    START WITH 1000
    INCREMENT BY 1
    MINVALUE 1
    CACHE 20;

-- Using it explicitly
INSERT INTO orders (id, customer_id) VALUES (nextval('order_seq'), 42);

-- Or as a column default
CREATE TABLE invoices (
    id     INT DEFAULT nextval('order_seq') PRIMARY KEY,
    amount NUMERIC(10,2)
);
```

Key functions: `nextval('seq')` advances and returns the next value; `currval('seq')` returns the last value obtained *in the current session*; `setval('seq', n)` manually resets the counter.

### Worked Example — Sharing One Sequence Across Tables

A business wants globally unique document numbers across two different document types stored in separate tables:

```sql
CREATE SEQUENCE document_number_seq START WITH 100000;

CREATE TABLE invoices (
    id  INT DEFAULT nextval('document_number_seq') PRIMARY KEY,
    ...
);

CREATE TABLE credit_notes (
    id  INT DEFAULT nextval('document_number_seq') PRIMARY KEY,
    ...
);
```

Now an invoice numbered 100001 and a credit note numbered 100002 can never collide, because both draw from the same counter — something a per-table identity column cannot do on its own.

### Edge Cases and Pitfalls

- **CACHE causes gaps and non-strict ordering**: `CACHE 20` pre-allocates 20 values to a session for speed; if the server restarts or the session disconnects, unused cached values are lost forever, creating visible jumps. Concurrent sessions caching blocks also means values are *not* guaranteed to be handed out in strict chronological/insert order across sessions.
- **Not rolled back on transaction abort**: calling `nextval()` inside a transaction that later rolls back does **not** give the value back — sequence advancement is intentionally non-transactional in PostgreSQL, to avoid serializing all inserts through one row.
- **CYCLE risk**: a sequence defined `CYCLE` wraps back to `MINVALUE` after hitting `MAXVALUE`. If old rows using low values from a previous cycle still exist, this can produce duplicate values (which then may violate a `UNIQUE`/primary key constraint, or worse, silently overwrite if there's no uniqueness constraint at all).
- **`ALTER SEQUENCE ... RESTART WITH n`** is the correct way to manually reset a sequence, e.g. after a bulk data migration that inserted explicit IDs beyond its current value.

### Key Takeaways / Q&A

**Q: Identity Column vs Sequence — when would you reach for a raw Sequence instead of an identity column?**
A: When you need one counter shared across multiple tables/columns (e.g., a single global document-number space), or when you need fine control accessible outside of any one column's default (calling `nextval()` explicitly from application logic before an insert, for example).

**Q: Does rolling back a transaction restore a sequence value consumed by nextval() inside it?**
A: No — sequence advancement is not undone by rollback in PostgreSQL, which is why gaps appear after failed transactions, exactly as with identity columns (since identity columns are usually sequences underneath).

**Q: What's the danger of a CYCLE sequence?**
A: After wrapping around, it can reissue a value that's already in use by an old row, risking constraint violations or, without a uniqueness constraint, silent data collisions.$dbw30671$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30672$dbms_sql_tutorial_seed$dbw30672$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30673$dbms_sql_tutorial_seed$dbw30673$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30674$dbms-sql-tutorial$dbw30674$),
     t as (select id from public.learning_topics where source_kind = $dbw30675$dbms_sql_tutorial$dbw30675$ and source_ref = $dbw30676$chapter-9-ddl-and-schema-design/sequences$dbw30676$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30677$pt-dbms-sql-9-sequences$dbw30677$, $dbw30678$Sequences - Quick Test$dbw30678$, 'aptitude', 8, 8,
  $dbw30679$8 questions on Sequences.$dbw30679$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30680$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30680$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30681$tq-dbms-sql-9-sequences-1$dbw30681$, $dbw30682$pt-dbms-sql-9-sequences$dbw30682$,
   $dbw30683$What is a sequence in SQL?$dbw30683$,
   $dbw30684$["A column-level auto-increment attribute tied to one table", "A standalone, schema-level object that generates unique numeric values independent of any single table", "A type of index", "A synonym for a view"]$dbw30684$::jsonb,
   1, $dbw30685$A sequence is an independent generator object, distinct from being bound to one specific column like an identity column.$dbw30685$, 1, 0),
  ($dbw30686$tq-dbms-sql-9-sequences-2$dbw30686$, $dbw30687$pt-dbms-sql-9-sequences$dbw30687$,
   $dbw30688$What is a key advantage of a sequence over a per-table identity column?$dbw30688$,
   $dbw30689$["Sequences are always faster at every scale", "A single sequence can be shared across multiple tables/columns to guarantee globally unique values across them", "Sequences require no syntax to use", "Identity columns cannot be used as primary keys"]$dbw30689$::jsonb,
   1, $dbw30690$Sequences are standalone and can be reused across several tables, unlike identity columns which are bound to one column.$dbw30690$, 1, 1),
  ($dbw30691$tq-dbms-sql-9-sequences-3$dbw30691$, $dbw30692$pt-dbms-sql-9-sequences$dbw30692$,
   $dbw30693$What does the CACHE option on a sequence do, and what risk does it introduce?$dbw30693$,
   $dbw30694$["It stores computed query results; no risk involved", "It pre-allocates a block of values to a session for speed, but unused cached values are lost on restart/disconnect, causing gaps", "It prevents the sequence from ever producing duplicate values", "It encrypts the sequence's current value"]$dbw30694$::jsonb,
   1, $dbw30695$CACHE improves performance by pre-allocating values but risks losing unused cached values, creating gaps.$dbw30695$, 1, 2),
  ($dbw30696$tq-dbms-sql-9-sequences-4$dbw30696$, $dbw30697$pt-dbms-sql-9-sequences$dbw30697$,
   $dbw30698$If a transaction calls nextval('order_seq') and then rolls back, what happens to that consumed sequence value in PostgreSQL?$dbw30698$,
   $dbw30699$["It is returned to the sequence and reused by the next call", "It is not restored \u2014 sequence advancement is non-transactional, so a gap results", "The entire sequence is reset to its start value", "The transaction cannot roll back once nextval is called"]$dbw30699$::jsonb,
   1, $dbw30700$PostgreSQL intentionally does not roll back sequence advancement, to avoid serializing inserts through a single row lock.$dbw30700$, 1, 3),
  ($dbw30701$tq-dbms-sql-9-sequences-5$dbw30701$, $dbw30702$pt-dbms-sql-9-sequences$dbw30702$,
   $dbw30703$What risk does a CYCLE sequence introduce after it wraps around to MINVALUE?$dbw30703$,
   $dbw30704$["No risk; it is always perfectly safe", "It can reissue a value already used by an old surviving row, risking constraint violations or silent collisions", "The sequence permanently stops working", "It automatically drops the table it's used in"]$dbw30704$::jsonb,
   1, $dbw30705$Wrapping around risks reissuing values still in use by existing rows if old data wasn't cleaned up.$dbw30705$, 1, 4),
  ($dbw30706$tq-dbms-sql-9-sequences-6$dbw30706$, $dbw30707$pt-dbms-sql-9-sequences$dbw30707$,
   $dbw30708$Which statement correctly resets a sequence's next value to a specific number after a bulk data migration?$dbw30708$,
   $dbw30709$["TRUNCATE SEQUENCE order_seq TO 5000;", "ALTER SEQUENCE order_seq RESTART WITH 5000;", "DELETE SEQUENCE order_seq WHERE value < 5000;", "UPDATE order_seq SET value = 5000;"]$dbw30709$::jsonb,
   1, $dbw30710$ALTER SEQUENCE ... RESTART WITH is the standard way to manually reset a sequence's counter.$dbw30710$, 1, 5),
  ($dbw30711$tq-dbms-sql-9-sequences-7$dbw30711$, $dbw30712$pt-dbms-sql-9-sequences$dbw30712$,
   $dbw30713$How are identity columns and sequences related in an engine like PostgreSQL?$dbw30713$,
   $dbw30714$["They are entirely unrelated features", "Identity columns are typically implemented internally using a hidden sequence bound to that one column", "Sequences are implemented using identity columns internally", "Only one of the two features can exist in a given database"]$dbw30714$::jsonb,
   1, $dbw30715$PostgreSQL implements identity columns on top of a hidden sequence object dedicated to that column.$dbw30715$, 1, 6),
  ($dbw30716$tq-dbms-sql-9-sequences-8$dbw30716$, $dbw30717$pt-dbms-sql-9-sequences$dbw30717$,
   $dbw30718$What does currval('order_seq') return, in contrast to nextval('order_seq')?$dbw30718$,
   $dbw30719$["It advances the sequence and returns a brand-new value, same as nextval", "It returns the last value obtained by nextval() in the current session, without advancing the sequence", "It resets the sequence to its starting value", "It returns the total count of rows in the associated table"]$dbw30719$::jsonb,
   1, $dbw30720$currval() reads back the most recently obtained value in the current session rather than generating a new one.$dbw30720$, 1, 7)
on conflict (id) do nothing;

-- 9.11 Temporary Tables
with g as (select id from public.learning_grids where lower(slug) = $dbw30721$dbms-sql-tutorial$dbw30721$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30722$chapter-9-ddl-and-schema-design$dbw30722$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30723$Temporary Tables$dbw30723$, $dbw30724$temporary-tables$dbw30724$, '', 11, 'published', true, true, $dbw30725$dbms_sql_tutorial$dbw30725$, $dbw30726$chapter-9-ddl-and-schema-design/temporary-tables$dbw30726$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30727$dbms_sql_tutorial$dbw30727$ and source_ref = $dbw30728$chapter-9-ddl-and-schema-design/temporary-tables$dbw30728$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30729$Temporary Tables$dbw30729$, $dbw30730$### Definition

A temporary table is a table whose lifetime and visibility are scoped to a session or a transaction rather than persisting like a normal table. It's used for staging intermediate results in complex, multi-step queries or ETL logic, and is automatically dropped when its scope ends.

```sql
-- PostgreSQL
CREATE TEMPORARY TABLE temp_west_sales AS
SELECT * FROM sales WHERE region = 'West';

CREATE TEMP TABLE temp_calc (id INT, total NUMERIC) ON COMMIT DROP;   -- dropped at end of transaction

-- MySQL
CREATE TEMPORARY TABLE temp_west_sales AS
SELECT * FROM sales WHERE region = 'West';   -- session-scoped, dropped on disconnect

-- SQL Server
CREATE TABLE #temp_west_sales (id INT, region VARCHAR(50), amount DECIMAL(10,2));   -- local temp, this session only
CREATE TABLE ##global_temp (id INT);                                                -- global temp, visible cross-session until all referencing sessions close
```

### How It Works

Most engines store temporary tables in a special namespace (e.g., `pg_temp_*` schemas in PostgreSQL, `tempdb` in SQL Server) that's automatically isolated per session, so two different sessions can each create a table named `temp_calc` without conflict. Postgres additionally lets you choose `ON COMMIT PRESERVE ROWS` (default, keeps data until the session ends) or `ON COMMIT DROP` (table vanishes at the end of the transaction that created it).

### Worked Example — Breaking Up a Complex Report

Instead of one deeply nested query that's hard to read and optimize, a report can be broken into staged temp tables:

```sql
CREATE TEMP TABLE step1_regional_totals AS
SELECT region, SUM(amount) AS total FROM sales GROUP BY region;

CREATE TEMP TABLE step2_ranked AS
SELECT region, total, RANK() OVER (ORDER BY total DESC) AS rnk
FROM step1_regional_totals;

SELECT * FROM step2_ranked WHERE rnk <= 3;
```

Each step is easy to inspect and debug independently — a real advantage over a single giant nested subquery, at the cost of extra I/O for the intermediate materializations (a trade-off `WITH` CTEs sometimes address instead, depending on the engine's optimizer).

### Edge Cases and Pitfalls

- **`tempdb` contention (SQL Server)**: heavy temp-table usage across many concurrent sessions can make `tempdb` itself a serious performance bottleneck — a well-known SQL Server operational concern.
- **Not covered by regular backups**: temporary tables are, by design, excluded from standard database backup/restore processes.
- **Connection pooling surprises**: an application using a pooled connection may create a temp table, then a subsequent "session" (actually a different pooled physical connection) can't see it, producing confusing "table not found" errors — a frequent bug in ORMs/pooled environments.
- **Constraint limitations**: some engines restrict or disallow foreign keys on temporary tables referencing permanent tables (and vice versa).
- **Naming collisions across sessions are generally fine** (isolated namespaces) but a `##global_temp` table in SQL Server is genuinely shared and can collide if two sessions pick the same name.

### Key Takeaways / Q&A

**Q: What's the difference between SQL Server's #temp and ##temp tables?**
A: `#temp` is local — visible only to the session that created it. `##temp` is global — visible to all sessions until every session referencing it disconnects.

**Q: Are temporary tables backed up like normal tables?**
A: No — they are excluded from standard backup/restore processes since they're inherently transient.

**Q: Why did my ORM throw "table not found" for a temp table I just created?**
A: Likely a connection-pooling issue — a different physical connection (which the pool treats as available) doesn't see a temp table created on another connection/session.$dbw30730$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30731$dbms_sql_tutorial_seed$dbw30731$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30732$dbms_sql_tutorial_seed$dbw30732$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30733$dbms-sql-tutorial$dbw30733$),
     t as (select id from public.learning_topics where source_kind = $dbw30734$dbms_sql_tutorial$dbw30734$ and source_ref = $dbw30735$chapter-9-ddl-and-schema-design/temporary-tables$dbw30735$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30736$pt-dbms-sql-9-temporary-tables$dbw30736$, $dbw30737$Temporary Tables - Quick Test$dbw30737$, 'aptitude', 8, 8,
  $dbw30738$8 questions on Temporary Tables.$dbw30738$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30739$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30739$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30740$tq-dbms-sql-9-temporary-tables-1$dbw30740$, $dbw30741$pt-dbms-sql-9-temporary-tables$dbw30741$,
   $dbw30742$What defines a temporary table's key characteristic compared to a regular table?$dbw30742$,
   $dbw30743$["It cannot contain any data", "Its lifetime/visibility is scoped to a session or transaction, and it is automatically dropped when that scope ends", "It must always be empty", "It can only contain one column"]$dbw30743$::jsonb,
   1, $dbw30744$Temporary tables exist only for the duration of a session or transaction and are auto-dropped afterward.$dbw30744$, 1, 0),
  ($dbw30745$tq-dbms-sql-9-temporary-tables-2$dbw30745$, $dbw30746$pt-dbms-sql-9-temporary-tables$dbw30746$,
   $dbw30747$In SQL Server, what is the difference between #temp and ##temp tables?$dbw30747$,
   $dbw30748$["They are identical in every respect", "#temp is local to the creating session; ##temp is global, visible to all sessions until all referencing sessions disconnect", "##temp is local; #temp is global", "#temp tables persist forever like normal tables"]$dbw30748$::jsonb,
   1, $dbw30749$The single-# prefix denotes a session-local temp table, while double-# denotes a global temp table visible across sessions.$dbw30749$, 1, 1),
  ($dbw30750$tq-dbms-sql-9-temporary-tables-3$dbw30750$, $dbw30751$pt-dbms-sql-9-temporary-tables$dbw30751$,
   $dbw30752$What does PostgreSQL's ON COMMIT DROP option do for a temporary table?$dbw30752$,
   $dbw30753$["Prevents the table from ever being dropped", "Automatically drops the table at the end of the transaction that created it", "Drops the table only when the database server restarts", "Converts the temp table into a permanent table"]$dbw30753$::jsonb,
   1, $dbw30754$ON COMMIT DROP scopes the temp table's lifetime to just the current transaction rather than the whole session.$dbw30754$, 1, 2),
  ($dbw30755$tq-dbms-sql-9-temporary-tables-4$dbw30755$, $dbw30756$pt-dbms-sql-9-temporary-tables$dbw30756$,
   $dbw30757$Why can heavy use of temporary tables become a serious performance concern specifically on SQL Server?$dbw30757$,
   $dbw30758$["Temporary tables are always stored in RAM with no limits", "Because they are stored in tempdb, and contention there under heavy concurrent use is a well-known bottleneck", "SQL Server does not support temporary tables at all", "Temporary tables automatically lock the entire database"]$dbw30758$::jsonb,
   1, $dbw30759$tempdb contention from heavy temp-table use is a recognized SQL Server operational issue.$dbw30759$, 1, 3),
  ($dbw30760$tq-dbms-sql-9-temporary-tables-5$dbw30760$, $dbw30761$pt-dbms-sql-9-temporary-tables$dbw30761$,
   $dbw30762$Why might an application see a 'table not found' error for a temp table it just created, in an environment using connection pooling?$dbw30762$,
   $dbw30763$["Temp tables are never supported with connection pooling", "A subsequent operation may run on a different physical pooled connection that never created and cannot see that session-scoped temp table", "The temp table was automatically renamed", "The database ran out of storage"]$dbw30763$::jsonb,
   1, $dbw30764$Session-scoped temp tables aren't visible across different physical connections, which pooling can silently switch between.$dbw30764$, 1, 4),
  ($dbw30765$tq-dbms-sql-9-temporary-tables-6$dbw30765$, $dbw30766$pt-dbms-sql-9-temporary-tables$dbw30766$,
   $dbw30767$Are temporary tables included in a database's standard backup and restore process?$dbw30767$,
   $dbw30768$["Yes, always, just like permanent tables", "No \u2014 they are excluded by design since they are inherently transient", "Only if explicitly requested at creation time", "Only global temp tables are backed up"]$dbw30768$::jsonb,
   1, $dbw30769$Temporary tables are transient by nature and are not part of standard backup/restore workflows.$dbw30769$, 1, 5),
  ($dbw30770$tq-dbms-sql-9-temporary-tables-7$dbw30770$, $dbw30771$pt-dbms-sql-9-temporary-tables$dbw30771$,
   $dbw30772$What is a practical benefit of breaking a complex report query into several staged temporary tables instead of one deeply nested query?$dbw30772$,
   $dbw30773$["It always makes the query run faster with zero trade-offs", "Each step becomes easier to inspect and debug independently, at the cost of extra I/O for the intermediate materializations", "It eliminates the need for any indexes", "It automatically parallelizes the whole report"]$dbw30773$::jsonb,
   1, $dbw30774$Staged temp tables trade some I/O overhead for much greater readability and debuggability of each intermediate step.$dbw30774$, 1, 6),
  ($dbw30775$tq-dbms-sql-9-temporary-tables-8$dbw30775$, $dbw30776$pt-dbms-sql-9-temporary-tables$dbw30776$,
   $dbw30777$What is a common constraint-related limitation involving temporary tables in several engines?$dbw30777$,
   $dbw30778$["Temporary tables can never have a primary key", "Some engines restrict or disallow foreign keys between temporary tables and permanent tables", "Temporary tables must always have exactly one column", "Temporary tables cannot store numeric data"]$dbw30778$::jsonb,
   1, $dbw30779$Cross-referencing constraints between temp and permanent tables are limited or disallowed in a number of engines.$dbw30779$, 1, 7)
on conflict (id) do nothing;

-- 9.12 Schema Evolution
with g as (select id from public.learning_grids where lower(slug) = $dbw30780$dbms-sql-tutorial$dbw30780$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30781$chapter-9-ddl-and-schema-design$dbw30781$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30782$Schema Evolution$dbw30782$, $dbw30783$schema-evolution$dbw30783$, '', 12, 'published', true, true, $dbw30784$dbms_sql_tutorial$dbw30784$, $dbw30785$chapter-9-ddl-and-schema-design/schema-evolution$dbw30785$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30786$dbms_sql_tutorial$dbw30786$ and source_ref = $dbw30787$chapter-9-ddl-and-schema-design/schema-evolution$dbw30787$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30788$Schema Evolution$dbw30788$, $dbw30789$### Definition

Schema evolution is the practice of managing changes to a database's structure over time — as an application's requirements grow — while keeping existing data intact and the system available. It's not a single SQL statement but a discipline built on migration tooling, versioned scripts, and change patterns that avoid breaking running applications.

### Migration Tooling

Tools like **Flyway**, **Liquibase**, Django migrations, or Rails migrations track schema changes as an ordered sequence of versioned scripts, applied consistently across dev/staging/production environments:

```sql
-- V12__add_status_to_employees.sql
ALTER TABLE employees ADD COLUMN status VARCHAR(20);

-- V13__backfill_employee_status.sql
UPDATE employees SET status = 'active' WHERE status IS NULL;

-- V14__enforce_employee_status_not_null.sql
ALTER TABLE employees ALTER COLUMN status SET NOT NULL;
```

Each script runs exactly once, in order, and the tool records which versions have already been applied — enabling repeatable, auditable deployments across environments.

### The Expand-Contract Pattern (Zero-Downtime Renames)

A genuinely useful worked example: safely renaming a column that's actively used by a live application, across several deploys, without downtime.

```sql
-- Deploy 1 ("expand"): add the new column alongside the old one
ALTER TABLE users ADD COLUMN email_address VARCHAR(255);

-- App code deploy: application now dual-writes to BOTH columns on every insert/update
-- (old code paths still read from the old column, so nothing breaks yet)

-- Migration: backfill existing rows
UPDATE users SET email_address = email WHERE email_address IS NULL;

-- App code deploy: application switches all reads to the new column
-- (still dual-writing for safety during the transition)

-- Deploy N ("contract"): once confident nothing reads the old column anymore
ALTER TABLE users DROP COLUMN email;
```

This "expand, migrate, contract" sequence — add new, dual-write, backfill, cut over reads, remove old — is the standard pattern for changing a live schema without a single hard, breaking cutover.

### Edge Cases and Pitfalls

- **Deploying a breaking schema change at the same moment as dependent app code** is a classic cause of downtime — if the old app version is still running against the new schema (or vice versa) even briefly during a rolling deploy, requests fail.
- **Large-table `ALTER TABLE` operations locking production** (see Topic 9.4) directly threaten schema evolution efforts — a naive one-shot migration on a huge table can take the whole application down.
- **Environment drift**: if migrations aren't applied consistently and in order across dev/staging/prod, schemas silently diverge, causing "works on my machine" bugs and failed deployments.
- **Transactional DDL differences matter here too**: PostgreSQL can wrap multiple DDL statements in one transaction so a failed migration rolls back cleanly; MySQL's implicit per-statement commits mean a multi-step migration that fails partway through can leave the schema in an inconsistent, hard-to-reverse intermediate state.
- Always have a rollback/down-migration plan, and test migrations against a realistic data volume/shape before running them on production.

### Key Takeaways / Q&A

**Q: Why not just rename a column directly in one step when the app is live?**
A: A direct rename requires the application code change to deploy at the *exact same instant* as the schema change, which is nearly impossible in a rolling/zero-downtime deployment — some app instances will briefly run old code against the new schema (or vice versa) and break.

**Q: What is the "expand-contract" pattern in one sentence?**
A: Add the new structure alongside the old, migrate reads/writes over gradually across multiple deploys, and only remove the old structure once nothing depends on it anymore.

**Q: Why does the choice of transactional vs auto-committing DDL (Postgres vs MySQL) matter for migration safety?**
A: It determines whether a multi-statement migration that fails partway through can be cleanly rolled back as a unit (Postgres) or leaves a partially-applied, harder-to-fix schema state (MySQL).$dbw30789$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30790$dbms_sql_tutorial_seed$dbw30790$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30791$dbms_sql_tutorial_seed$dbw30791$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30792$dbms-sql-tutorial$dbw30792$),
     t as (select id from public.learning_topics where source_kind = $dbw30793$dbms_sql_tutorial$dbw30793$ and source_ref = $dbw30794$chapter-9-ddl-and-schema-design/schema-evolution$dbw30794$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30795$pt-dbms-sql-9-schema-evolution$dbw30795$, $dbw30796$Schema Evolution - Quick Test$dbw30796$, 'aptitude', 8, 8,
  $dbw30797$8 questions on Schema Evolution.$dbw30797$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30798$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30798$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30799$tq-dbms-sql-9-schema-evolution-1$dbw30799$, $dbw30800$pt-dbms-sql-9-schema-evolution$dbw30800$,
   $dbw30801$What is schema evolution primarily concerned with?$dbw30801$,
   $dbw30802$["A single SQL statement for renaming tables", "Managing structural changes to a database over time while keeping data intact and the system available", "Encrypting database backups", "Optimizing query execution plans"]$dbw30802$::jsonb,
   1, $dbw30803$Schema evolution is a discipline of managing ongoing structural change safely, not a single command.$dbw30803$, 1, 0),
  ($dbw30804$tq-dbms-sql-9-schema-evolution-2$dbw30804$, $dbw30805$pt-dbms-sql-9-schema-evolution$dbw30805$,
   $dbw30806$What do tools like Flyway and Liquibase provide for schema evolution?$dbw30806$,
   $dbw30807$["Automatic query optimization", "Tracking of schema changes as an ordered, versioned sequence of scripts applied consistently across environments", "A replacement for SQL entirely", "Automatic data visualization"]$dbw30807$::jsonb,
   1, $dbw30808$Migration tools track and apply versioned schema change scripts in order, ensuring consistency across environments.$dbw30808$, 1, 1),
  ($dbw30809$tq-dbms-sql-9-schema-evolution-3$dbw30809$, $dbw30810$pt-dbms-sql-9-schema-evolution$dbw30810$,
   $dbw30811$In the expand-contract pattern for renaming a live column, what is the correct high-level order of steps?$dbw30811$,
   $dbw30812$["Drop old column, then add new column, then backfill", "Add new column, dual-write to both, backfill, switch reads to new column, then drop old column", "Rename the column directly in one atomic step while the app is live", "Backfill first, then create the table"]$dbw30812$::jsonb,
   1, $dbw30813$Expand-contract adds new structure first, transitions gradually, and removes old structure only once safe.$dbw30813$, 1, 2),
  ($dbw30814$tq-dbms-sql-9-schema-evolution-4$dbw30814$, $dbw30815$pt-dbms-sql-9-schema-evolution$dbw30815$,
   $dbw30816$Why is directly renaming a column in one step risky for a live, actively-deployed application?$dbw30816$,
   $dbw30817$["It is never risky", "The application code change must deploy at the exact same instant as the schema change, which rolling deployments can't guarantee, causing brief breakage", "SQL does not support column renames", "It always corrupts the entire database"]$dbw30817$::jsonb,
   1, $dbw30818$During a rolling deploy some instances will briefly run mismatched code/schema versions if the change isn't done gradually.$dbw30818$, 1, 3),
  ($dbw30819$tq-dbms-sql-9-schema-evolution-5$dbw30819$, $dbw30820$pt-dbms-sql-9-schema-evolution$dbw30820$,
   $dbw30821$How does PostgreSQL's support for transactional DDL benefit multi-step migrations, compared to MySQL?$dbw30821$,
   $dbw30822$["It has no practical benefit", "A failed multi-statement migration can be rolled back as a single unit in Postgres, whereas MySQL's implicit per-statement commits can leave a partially-applied state", "MySQL migrations are always safer as a result", "PostgreSQL cannot run more than one DDL statement per migration"]$dbw30822$::jsonb,
   1, $dbw30823$Transactional DDL lets Postgres cleanly roll back a whole failed migration, unlike MySQL's auto-committing DDL.$dbw30823$, 1, 4),
  ($dbw30824$tq-dbms-sql-9-schema-evolution-6$dbw30824$, $dbw30825$pt-dbms-sql-9-schema-evolution$dbw30825$,
   $dbw30826$Why does a naive one-shot ALTER TABLE on a huge production table threaten schema evolution efforts?$dbw30826$,
   $dbw30827$["ALTER TABLE never affects production traffic", "It can hold a long lock that blocks reads/writes, potentially taking the application down during the change", "It always deletes all the table's data", "It automatically rolls back after 1 second"]$dbw30827$::jsonb,
   1, $dbw30828$Large-table ALTER TABLE locking (covered in Topic 9.4) is a direct operational risk to schema evolution.$dbw30828$, 1, 5),
  ($dbw30829$tq-dbms-sql-9-schema-evolution-7$dbw30829$, $dbw30830$pt-dbms-sql-9-schema-evolution$dbw30830$,
   $dbw30831$What problem does 'environment drift' refer to in the context of schema migrations?$dbw30831$,
   $dbw30832$["Physical hardware degrading over time", "Migrations not being applied consistently and in order across dev/staging/prod, causing schemas to silently diverge", "Network latency between database replicas", "A database engine's storage engine changing automatically"]$dbw30832$::jsonb,
   1, $dbw30833$Inconsistent migration application across environments causes schema divergence and related deployment bugs.$dbw30833$, 1, 6),
  ($dbw30834$tq-dbms-sql-9-schema-evolution-8$dbw30834$, $dbw30835$pt-dbms-sql-9-schema-evolution$dbw30835$,
   $dbw30836$What best practice is recommended before running a schema migration against production?$dbw30836$,
   $dbw30837$["Skip testing to save time", "Test the migration against a realistic data volume/shape and have a rollback/down-migration plan", "Always disable all constraints permanently", "Run it directly on production first to save a step"]$dbw30837$::jsonb,
   1, $dbw30838$Testing at realistic scale and preparing a rollback plan reduces the risk of a migration causing an incident.$dbw30838$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 10: SQL Constraints
-- ---------------------------------------------------------------------------
-- 10.1 NOT NULL
with g as (select id from public.learning_grids where lower(slug) = $dbw30839$dbms-sql-tutorial$dbw30839$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30840$chapter-10-sql-constraints$dbw30840$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30841$NOT NULL$dbw30841$, $dbw30842$not-null$dbw30842$, '', 1, 'published', true, true, $dbw30843$dbms_sql_tutorial$dbw30843$, $dbw30844$chapter-10-sql-constraints/not-null$dbw30844$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30845$dbms_sql_tutorial$dbw30845$ and source_ref = $dbw30846$chapter-10-sql-constraints/not-null$dbw30846$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30847$NOT NULL$dbw30847$, $dbw30848$### What NOT NULL Does

`NOT NULL` is a column constraint that forbids the absence-of-value marker `NULL` from ever being stored in that column. It says nothing about *which* values are valid — only that *some* value must be present. A column can be `NOT NULL` and still accept an empty string `''` or `0`, because those are values, not the absence of a value.

### Declaring It at Column Level

```sql
CREATE TABLE employees (
    emp_id    INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email     VARCHAR(150) NOT NULL,
    manager_id INT NULL          -- explicit NULL is the default anyway
);
```

Every column is nullable unless you say otherwise, so `NOT NULL` must be spelled out explicitly.

### Adding NOT NULL to an Existing Column

This is where dialects diverge sharply — there is no single portable statement.

```sql
-- MySQL / MariaDB: repeat the FULL column definition
ALTER TABLE employees MODIFY email VARCHAR(150) NOT NULL;

-- PostgreSQL: a dedicated sub-clause, no need to restate the type
ALTER TABLE employees ALTER COLUMN email SET NOT NULL;

-- SQL Server
ALTER TABLE employees ALTER COLUMN email VARCHAR(150) NOT NULL;

-- Oracle
ALTER TABLE employees MODIFY (email VARCHAR2(150) NOT NULL);
```

Note the trap in MySQL's `MODIFY`: if you forget to re-specify the type, length, or an existing `DEFAULT`, you can silently *lose* those attributes, because `MODIFY` replaces the whole column definition, not just the nullability bit.

### The Existing-NULLs Problem

Every one of the statements above will **fail** if the column currently contains even one `NULL` row, because the engine validates existing data against the new rule before committing the change. The standard remedy is a three-step pattern:

```sql
-- 1. Backfill first
UPDATE employees SET email = 'unknown@example.com' WHERE email IS NULL;

-- 2. Now the constraint can be added safely
ALTER TABLE employees ALTER COLUMN email SET NOT NULL;   -- PostgreSQL
```

Skipping step 1 gives an error like `column "email" contains null values` (Postgres) or `Column 'email' cannot be null` (MySQL, during the implicit re-validation on some storage engines).

### Removing NOT NULL

```sql
ALTER TABLE employees ALTER COLUMN manager_id DROP NOT NULL;   -- PostgreSQL
ALTER TABLE employees MODIFY manager_id INT NULL;              -- MySQL
```

### Edge Cases

- `NOT NULL` combined with a `DEFAULT` means: omit the column in `INSERT` → default kicks in and satisfies the constraint; explicitly insert `NULL` → constraint violation, DEFAULT does **not** rescue you.
- A `PRIMARY KEY` column is always implicitly `NOT NULL` (plus unique) — you never need to write it twice, though doing so is harmless.
- `NOT NULL` is a column constraint only; there is no "table-level" form of it, unlike `CHECK`, `UNIQUE`, `PRIMARY KEY`, and `FOREIGN KEY`.

### Key Takeaways / Q&A

**Q: Does `NOT NULL` prevent empty strings?**
A: No. `''` is a zero-length value, not `NULL`. Use a `CHECK` if you also need to reject empty strings.

**Q: Why does adding `NOT NULL` to a populated column sometimes fail even though you just checked and saw no NULLs?**
A: Concurrent writes between your check and your `ALTER TABLE` can insert a `NULL` in the gap; in high-traffic systems this is handled with a brief lock or by adding the constraint as `NOT VALID` first (Postgres) then validating separately.

**Q: Is `NOT NULL` enforced at INSERT and UPDATE, or only at INSERT?**
A: Both — any statement that would leave the column `NULL` after execution is rejected.$dbw30848$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30849$dbms_sql_tutorial_seed$dbw30849$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30850$dbms_sql_tutorial_seed$dbw30850$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30851$dbms-sql-tutorial$dbw30851$),
     t as (select id from public.learning_topics where source_kind = $dbw30852$dbms_sql_tutorial$dbw30852$ and source_ref = $dbw30853$chapter-10-sql-constraints/not-null$dbw30853$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30854$pt-dbms-sql-10-not-null$dbw30854$, $dbw30855$NOT NULL - Quick Test$dbw30855$, 'aptitude', 8, 8,
  $dbw30856$8 questions on NOT NULL.$dbw30856$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30857$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30857$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30858$tq-dbms-sql-10-not-null-1$dbw30858$, $dbw30859$pt-dbms-sql-10-not-null$dbw30859$,
   $dbw30860$What is the primary effect of applying a NOT NULL constraint to a column?$dbw30860$,
   $dbw30861$["It forces the column to contain only unique values", "It forbids the NULL marker from being stored in that column", "It sets a default value for the column", "It forces the column to be indexed"]$dbw30861$::jsonb,
   1, $dbw30862$NOT NULL only bans the absence-of-value marker NULL; it does not enforce uniqueness, defaults, or indexing.$dbw30862$, 1, 0),
  ($dbw30863$tq-dbms-sql-10-not-null-2$dbw30863$, $dbw30864$pt-dbms-sql-10-not-null$dbw30864$,
   $dbw30865$In MySQL, which statement correctly adds NOT NULL to an existing nullable column `email VARCHAR(150)`?$dbw30865$,
   $dbw30866$["ALTER TABLE employees SET email NOT NULL;", "ALTER TABLE employees ALTER COLUMN email SET NOT NULL;", "ALTER TABLE employees MODIFY email VARCHAR(150) NOT NULL;", "ALTER TABLE employees ADD NOT NULL email;"]$dbw30866$::jsonb,
   2, $dbw30867$MySQL uses MODIFY with the full column definition restated; ALTER COLUMN ... SET NOT NULL is PostgreSQL syntax.$dbw30867$, 1, 1),
  ($dbw30868$tq-dbms-sql-10-not-null-3$dbw30868$, $dbw30869$pt-dbms-sql-10-not-null$dbw30869$,
   $dbw30870$What happens if you try to add a NOT NULL constraint to a column that currently contains one or more NULL rows?$dbw30870$,
   $dbw30871$["The engine automatically deletes those rows", "The engine automatically replaces NULLs with an empty string", "The ALTER TABLE statement fails with a validation error", "The constraint is added but silently not enforced for old rows"]$dbw30871$::jsonb,
   2, $dbw30872$Existing data is validated against the new rule before the change commits; any remaining NULLs cause the statement to fail.$dbw30872$, 1, 2),
  ($dbw30873$tq-dbms-sql-10-not-null-4$dbw30873$, $dbw30874$pt-dbms-sql-10-not-null$dbw30874$,
   $dbw30875$A column is declared `qty INT NOT NULL DEFAULT 10`. What happens when a row is inserted with `INSERT INTO t (qty) VALUES (NULL)`?$dbw30875$,
   $dbw30876$["qty is set to 10 because of the DEFAULT", "The insert fails with a NOT NULL violation", "qty is set to 0", "qty remains NULL since it was explicit"]$dbw30876$::jsonb,
   1, $dbw30877$DEFAULT only applies when the column is omitted entirely from the INSERT list, not when NULL is explicitly supplied; explicit NULL still violates NOT NULL.$dbw30877$, 1, 3),
  ($dbw30878$tq-dbms-sql-10-not-null-5$dbw30878$, $dbw30879$pt-dbms-sql-10-not-null$dbw30879$,
   $dbw30880$Which column is implicitly NOT NULL even if you never write the keyword?$dbw30880$,
   $dbw30881$["Any VARCHAR column", "A column declared UNIQUE", "A PRIMARY KEY column", "A column with a DEFAULT value"]$dbw30881$::jsonb,
   2, $dbw30882$A PRIMARY KEY column is always implicitly NOT NULL in addition to being unique.$dbw30882$, 1, 4),
  ($dbw30883$tq-dbms-sql-10-not-null-6$dbw30883$, $dbw30884$pt-dbms-sql-10-not-null$dbw30884$,
   $dbw30885$In MySQL, what risk does `ALTER TABLE employees MODIFY email VARCHAR(150) NOT NULL;` carry compared to PostgreSQL's `ALTER COLUMN ... SET NOT NULL`?$dbw30885$,
   $dbw30886$["It cannot be rolled back", "It requires dropping the table first", "Forgetting to restate other attributes like DEFAULT can silently remove them, since MODIFY replaces the whole definition", "It automatically drops any existing indexes on the column"]$dbw30886$::jsonb,
   2, $dbw30887$MySQL's MODIFY rewrites the entire column definition, so omitted attributes (type details, DEFAULT, etc.) can be lost, unlike Postgres's targeted SET NOT NULL sub-clause.$dbw30887$, 1, 5),
  ($dbw30888$tq-dbms-sql-10-not-null-7$dbw30888$, $dbw30889$pt-dbms-sql-10-not-null$dbw30889$,
   $dbw30890$Does NOT NULL prevent an empty string ('') from being stored in a VARCHAR column?$dbw30890$,
   $dbw30891$["Yes, empty string is treated as NULL", "No, empty string is a valid value distinct from NULL", "Only in PostgreSQL", "Only if the column is also UNIQUE"]$dbw30891$::jsonb,
   1, $dbw30892$An empty string is a zero-length value, not the absence of a value, so NOT NULL does not block it; a CHECK constraint would be needed for that.$dbw30892$, 1, 6),
  ($dbw30893$tq-dbms-sql-10-not-null-8$dbw30893$, $dbw30894$pt-dbms-sql-10-not-null$dbw30894$,
   $dbw30895$Which statement about NOT NULL and table-level constraint syntax is correct?$dbw30895$,
   $dbw30896$["NOT NULL can be written as either a column-level or table-level constraint", "NOT NULL has no table-level form; it exists only as a column constraint", "NOT NULL must always be paired with CHECK", "NOT NULL can only be applied via a trigger"]$dbw30896$::jsonb,
   1, $dbw30897$Unlike CHECK, UNIQUE, PRIMARY KEY, and FOREIGN KEY, NOT NULL is exclusively a column-level constraint with no separate table-level clause form.$dbw30897$, 1, 7)
on conflict (id) do nothing;

-- 10.2 UNIQUE
with g as (select id from public.learning_grids where lower(slug) = $dbw30898$dbms-sql-tutorial$dbw30898$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30899$chapter-10-sql-constraints$dbw30899$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30900$UNIQUE$dbw30900$, $dbw30901$unique$dbw30901$, '', 2, 'published', true, true, $dbw30902$dbms_sql_tutorial$dbw30902$, $dbw30903$chapter-10-sql-constraints/unique$dbw30903$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30904$dbms_sql_tutorial$dbw30904$ and source_ref = $dbw30905$chapter-10-sql-constraints/unique$dbw30905$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30906$UNIQUE$dbw30906$, $dbw30907$### Declaring UNIQUE in SQL

While the conceptual role of a unique/candidate key was covered earlier, here we focus purely on how you *write* the constraint. `UNIQUE` guarantees that no two rows share the same value in the constrained column(s) — except that most engines (PostgreSQL, MySQL, SQL Server, Oracle) treat multiple `NULL`s as **not** duplicating each other, so several rows can each have `NULL` in a UNIQUE column simultaneously.

### Column-Level Syntax

```sql
CREATE TABLE users (
    user_id  INT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email    VARCHAR(150) UNIQUE NOT NULL
);
```

### Table-Level Syntax (required for multi-column uniqueness)

```sql
CREATE TABLE enrollments (
    student_id INT,
    course_id  INT,
    UNIQUE (student_id, course_id)   -- a student can't enroll in the same course twice
);
```

A column-level `UNIQUE` can never express "this *combination* of columns must be unique" — only the table-level clause can span more than one column.

### Adding UNIQUE to an Existing Table

```sql
ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);
```

This statement scans the existing data first; if duplicate `username` values already exist, the `ALTER TABLE` is rejected until they're resolved (e.g. via a `GROUP BY ... HAVING COUNT(*) > 1` cleanup query).

### Dropping It

```sql
-- PostgreSQL / Oracle / SQL Server style
ALTER TABLE users DROP CONSTRAINT uq_users_username;

-- MySQL treats a UNIQUE constraint as an index
ALTER TABLE users DROP INDEX uq_users_username;
```

This MySQL quirk — unique constraints are implemented as unique indexes internally — means `SHOW INDEX FROM users;` is how you discover the name if it wasn't chosen explicitly.

### UNIQUE vs PRIMARY KEY, Syntactically

A table can have only one `PRIMARY KEY` but many `UNIQUE` constraints. `UNIQUE` columns *can* accept `NULL` (subject to the multiple-NULLs behavior above) whereas `PRIMARY KEY` columns cannot, since `PRIMARY KEY` = `UNIQUE` + `NOT NULL` bundled together.

### Edge Cases

- SQL Server, notably, allows only **one** `NULL` in a UNIQUE column by default (its unique index treats NULLs as equal), which differs from Postgres/MySQL/Oracle — a genuine cross-dialect portability trap.
- Composite `UNIQUE (a, b)` still allows duplicate `a` values or duplicate `b` values individually; only the *pair* must be distinct.
- A `UNIQUE` constraint automatically creates a supporting index in most engines, which is why heavy write workloads sometimes avoid over-constraining columns that don't need it.

### Key Takeaways / Q&A

**Q: Can two rows both have NULL in a UNIQUE column in PostgreSQL?**
A: Yes — Postgres (and MySQL, Oracle) treat NULL as "unknown," and two unknowns are never considered equal to each other, so the uniqueness check doesn't fire.

**Q: When must you use table-level UNIQUE syntax instead of column-level?**
A: Whenever the uniqueness rule spans two or more columns together, such as `UNIQUE (student_id, course_id)`.

**Q: How do you find the auto-generated name of a UNIQUE constraint to drop it?**
A: Query the catalog — `information_schema.table_constraints` (Postgres/MySQL) or `SHOW INDEX` (MySQL) — since an unnamed constraint gets a system-generated identifier.$dbw30907$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30908$dbms_sql_tutorial_seed$dbw30908$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30909$dbms_sql_tutorial_seed$dbw30909$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30910$dbms-sql-tutorial$dbw30910$),
     t as (select id from public.learning_topics where source_kind = $dbw30911$dbms_sql_tutorial$dbw30911$ and source_ref = $dbw30912$chapter-10-sql-constraints/unique$dbw30912$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30913$pt-dbms-sql-10-unique$dbw30913$, $dbw30914$UNIQUE - Quick Test$dbw30914$, 'aptitude', 8, 8,
  $dbw30915$8 questions on UNIQUE.$dbw30915$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30916$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30916$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30917$tq-dbms-sql-10-unique-1$dbw30917$, $dbw30918$pt-dbms-sql-10-unique$dbw30918$,
   $dbw30919$Which SQL clause is required when a uniqueness rule must span two columns together, such as (student_id, course_id)?$dbw30919$,
   $dbw30920$["Two separate column-level UNIQUE clauses, one per column", "A table-level UNIQUE clause listing both columns", "A CHECK constraint referencing both columns", "A FOREIGN KEY referencing both columns"]$dbw30920$::jsonb,
   1, $dbw30921$Column-level UNIQUE applies to a single column only; a composite uniqueness rule requires the table-level UNIQUE (col1, col2) form.$dbw30921$, 1, 0),
  ($dbw30922$tq-dbms-sql-10-unique-2$dbw30922$, $dbw30923$pt-dbms-sql-10-unique$dbw30923$,
   $dbw30924$In standard PostgreSQL behavior, how many rows can have NULL in a UNIQUE column?$dbw30924$,
   $dbw30925$["Zero \u2014 NULL is forbidden in a UNIQUE column", "Exactly one", "Multiple rows, since NULL is never considered equal to another NULL", "Unlimited only if the column is also indexed manually"]$dbw30925$::jsonb,
   2, $dbw30926$PostgreSQL, like MySQL and Oracle, treats each NULL as an unknown value, so multiple NULLs don't violate uniqueness; SQL Server differs and allows only one.$dbw30926$, 1, 1),
  ($dbw30927$tq-dbms-sql-10-unique-3$dbw30927$, $dbw30928$pt-dbms-sql-10-unique$dbw30928$,
   $dbw30929$What is the correct way to drop a named UNIQUE constraint `uq_users_username` in MySQL?$dbw30929$,
   $dbw30930$["ALTER TABLE users DROP CONSTRAINT uq_users_username;", "ALTER TABLE users DROP UNIQUE uq_users_username;", "ALTER TABLE users DROP INDEX uq_users_username;", "DROP UNIQUE ON users.uq_users_username;"]$dbw30930$::jsonb,
   2, $dbw30931$MySQL implements UNIQUE constraints as unique indexes internally, so they are dropped with DROP INDEX rather than DROP CONSTRAINT.$dbw30931$, 1, 2),
  ($dbw30932$tq-dbms-sql-10-unique-4$dbw30932$, $dbw30933$pt-dbms-sql-10-unique$dbw30933$,
   $dbw30934$What happens when you run ALTER TABLE users ADD CONSTRAINT uq_username UNIQUE (username); on a table that already has two rows with the same username value?$dbw30934$,
   $dbw30935$["The constraint is added and future duplicates are blocked, but the existing duplicates remain", "The statement fails because existing data violates the new constraint", "MySQL silently deletes one of the duplicate rows", "The constraint is added in a disabled state"]$dbw30935$::jsonb,
   1, $dbw30936$Adding a UNIQUE constraint validates existing data first; duplicates already present cause the ALTER TABLE to be rejected.$dbw30936$, 1, 3),
  ($dbw30937$tq-dbms-sql-10-unique-5$dbw30937$, $dbw30938$pt-dbms-sql-10-unique$dbw30938$,
   $dbw30939$How many PRIMARY KEY constraints and how many UNIQUE constraints can a single table have?$dbw30939$,
   $dbw30940$["Exactly one PRIMARY KEY, and any number of UNIQUE constraints", "Any number of both", "Exactly one of each", "Any number of PRIMARY KEY, exactly one UNIQUE"]$dbw30940$::jsonb,
   0, $dbw30941$A table has at most one PRIMARY KEY but can define multiple UNIQUE constraints on different columns or column combinations.$dbw30941$, 1, 4),
  ($dbw30942$tq-dbms-sql-10-unique-6$dbw30942$, $dbw30943$pt-dbms-sql-10-unique$dbw30943$,
   $dbw30944$Which best describes the relationship between PRIMARY KEY and UNIQUE at the syntax/semantics level?$dbw30944$,
   $dbw30945$["They are unrelated features with no overlap", "PRIMARY KEY is equivalent to UNIQUE plus NOT NULL bundled together", "UNIQUE is a stricter version of PRIMARY KEY", "PRIMARY KEY allows NULLs while UNIQUE does not"]$dbw30945$::jsonb,
   1, $dbw30946$A PRIMARY KEY combines the uniqueness guarantee of UNIQUE with an implicit NOT NULL, which is why PRIMARY KEY columns can never contain NULL.$dbw30946$, 1, 5),
  ($dbw30947$tq-dbms-sql-10-unique-7$dbw30947$, $dbw30948$pt-dbms-sql-10-unique$dbw30948$,
   $dbw30949$In a composite constraint UNIQUE (a, b), which of the following is allowed?$dbw30949$,
   $dbw30950$["Duplicate values in column a alone, as long as the (a, b) pair as a whole is not duplicated", "Any duplicate row where a matches another row's a", "No duplicates in either column individually", "Duplicate (a, b) pairs as long as a is not the primary key"]$dbw30950$::jsonb,
   0, $dbw30951$A composite UNIQUE constraint only forbids duplicate combinations of the listed columns; individual columns may repeat freely on their own.$dbw30951$, 1, 6),
  ($dbw30952$tq-dbms-sql-10-unique-8$dbw30952$, $dbw30953$pt-dbms-sql-10-unique$dbw30953$,
   $dbw30954$Why might a database administrator avoid adding a UNIQUE constraint to a column that doesn't strictly need one?$dbw30954$,
   $dbw30955$["UNIQUE constraints prevent the column from ever being updated", "UNIQUE automatically creates a supporting index in most engines, adding overhead to write-heavy workloads", "UNIQUE constraints cannot coexist with NOT NULL", "UNIQUE constraints are deprecated in modern SQL"]$dbw30955$::jsonb,
   1, $dbw30956$Most engines back a UNIQUE constraint with an index to enforce it efficiently, and that index carries maintenance cost on every insert/update, which matters for high-write tables.$dbw30956$, 1, 7)
on conflict (id) do nothing;

-- 10.3 PRIMARY KEY
with g as (select id from public.learning_grids where lower(slug) = $dbw30957$dbms-sql-tutorial$dbw30957$),
     s as (select id from public.learning_sections where lower(slug) = $dbw30958$chapter-10-sql-constraints$dbw30958$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw30959$PRIMARY KEY$dbw30959$, $dbw30960$primary-key-constraint-syntax$dbw30960$, '', 3, 'published', true, true, $dbw30961$dbms_sql_tutorial$dbw30961$, $dbw30962$chapter-10-sql-constraints/primary-key-constraint-syntax$dbw30962$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw30963$dbms_sql_tutorial$dbw30963$ and source_ref = $dbw30964$chapter-10-sql-constraints/primary-key-constraint-syntax$dbw30964$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw30965$PRIMARY KEY$dbw30965$, $dbw30966$### This Topic's Focus

Chapter 5 covered *what* a primary key represents conceptually (entity integrity, the unique identifying attribute of a row). Here the focus is purely mechanical: how you *declare, name, alter, and drop* a `PRIMARY KEY` constraint in SQL DDL.

### Column-Level Declaration

```sql
CREATE TABLE students (
    student_id INT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL
);
```

This inline form works only for a single-column key.

### Table-Level Declaration (mandatory for composite keys)

```sql
CREATE TABLE enrollments (
    student_id INT,
    course_id  INT,
    grade      CHAR(2),
    PRIMARY KEY (student_id, course_id)
);
```

A composite primary key made of two or more columns can *only* be expressed as a table-level clause — there is no way to inline it onto a single column definition.

### Naming the Constraint

```sql
CREATE TABLE students (
    student_id INT,
    name       VARCHAR(100) NOT NULL,
    CONSTRAINT pk_students PRIMARY KEY (student_id)
);
```

If you don't name it, the engine auto-generates a name (e.g. `students_pkey` in PostgreSQL, or a numeric-suffixed name in MySQL/SQL Server), which you'll need to look up later before you can drop it.

### Adding a PRIMARY KEY to an Existing Table

```sql
ALTER TABLE students ADD CONSTRAINT pk_students PRIMARY KEY (student_id);
```

Preconditions: the target column(s) must already be `NOT NULL` (or the engine implicitly makes them so) and must not currently contain duplicate values — both are validated against existing rows before the constraint is accepted.

### Dropping / Replacing a PRIMARY KEY

```sql
-- PostgreSQL / Oracle / SQL Server
ALTER TABLE students DROP CONSTRAINT pk_students;

-- MySQL (primary keys are unnamed at the engine level)
ALTER TABLE students DROP PRIMARY KEY;
```

MySQL's dedicated `DROP PRIMARY KEY` syntax exists precisely because MySQL doesn't let you assign an arbitrary custom name to the primary key the way other engines do — it's always identified as *the* primary key of the table, singular.

### Edge Cases

- You cannot have two `PRIMARY KEY` clauses in one `CREATE TABLE` — attempting it is a syntax/semantic error, unlike `UNIQUE` where multiple are fine.
- Auto-increment/identity columns (`AUTO_INCREMENT` in MySQL, `SERIAL`/`GENERATED ALWAYS AS IDENTITY` in Postgres, `IDENTITY` in SQL Server) are commonly paired with `PRIMARY KEY` but are logically independent features — you can have one without the other.
- Changing which column(s) make up the primary key later requires dropping the old constraint and adding a new one; there's no direct "ALTER PRIMARY KEY" rename-in-place across all engines.

### Key Takeaways / Q&A

**Q: Can a composite primary key be declared with column-level syntax?**
A: No — any key spanning more than one column requires the table-level `PRIMARY KEY (col1, col2, ...)` clause.

**Q: What must be true of a table's data before `ALTER TABLE ... ADD PRIMARY KEY` succeeds?**
A: The target columns must contain no NULLs and no duplicate combinations — the engine validates this against existing rows first.

**Q: How do you drop an unnamed primary key in MySQL vs PostgreSQL?**
A: MySQL uses `ALTER TABLE t DROP PRIMARY KEY` directly; PostgreSQL requires you to know (or look up) the auto-generated constraint name and use `DROP CONSTRAINT`.$dbw30966$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw30967$dbms_sql_tutorial_seed$dbw30967$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw30968$dbms_sql_tutorial_seed$dbw30968$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw30969$dbms-sql-tutorial$dbw30969$),
     t as (select id from public.learning_topics where source_kind = $dbw30970$dbms_sql_tutorial$dbw30970$ and source_ref = $dbw30971$chapter-10-sql-constraints/primary-key-constraint-syntax$dbw30971$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw30972$pt-dbms-sql-10-primary-key-constraint-syntax$dbw30972$, $dbw30973$PRIMARY KEY - Quick Test$dbw30973$, 'aptitude', 8, 8,
  $dbw30974$8 questions on PRIMARY KEY.$dbw30974$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw30975$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw30975$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw30976$tq-dbms-sql-10-primary-key-constraint-syntax-1$dbw30976$, $dbw30977$pt-dbms-sql-10-primary-key-constraint-syntax$dbw30977$,
   $dbw30978$Why must a composite primary key spanning two columns be declared using table-level syntax?$dbw30978$,
   $dbw30979$["Because column-level syntax cannot list more than one column at a time", "Because MySQL disallows composite keys entirely", "Because table-level syntax is faster to execute", "Because composite keys require a separate CHECK constraint"]$dbw30979$::jsonb,
   0, $dbw30980$Column-level PRIMARY KEY syntax attaches inline to a single column definition and has no way to reference a second column, so any multi-column key must use the table-level PRIMARY KEY (col1, col2) clause.$dbw30980$, 1, 0),
  ($dbw30981$tq-dbms-sql-10-primary-key-constraint-syntax-2$dbw30981$, $dbw30982$pt-dbms-sql-10-primary-key-constraint-syntax$dbw30982$,
   $dbw30983$In MySQL, how do you drop the primary key from a table named students?$dbw30983$,
   $dbw30984$["ALTER TABLE students DROP CONSTRAINT pk_students;", "ALTER TABLE students DROP PRIMARY KEY;", "ALTER TABLE students DROP KEY PRIMARY;", "DROP PRIMARY KEY FROM students;"]$dbw30984$::jsonb,
   1, $dbw30985$MySQL provides a dedicated DROP PRIMARY KEY clause since it does not let you assign a custom name to the primary key; DROP CONSTRAINT is used in PostgreSQL/Oracle/SQL Server instead.$dbw30985$, 1, 1),
  ($dbw30986$tq-dbms-sql-10-primary-key-constraint-syntax-3$dbw30986$, $dbw30987$pt-dbms-sql-10-primary-key-constraint-syntax$dbw30987$,
   $dbw30988$What must be true of existing table data before ALTER TABLE ... ADD CONSTRAINT ... PRIMARY KEY (col) will succeed?$dbw30988$,
   $dbw30989$["The column must already be indexed", "The column must contain no NULLs and no duplicate values", "The table must be empty", "The column must be of an integer data type"]$dbw30989$::jsonb,
   1, $dbw30990$Adding a PRIMARY KEY validates existing rows: any NULL or duplicate value in the target column(s) causes the ALTER TABLE to fail.$dbw30990$, 1, 2),
  ($dbw30991$tq-dbms-sql-10-primary-key-constraint-syntax-4$dbw30991$, $dbw30992$pt-dbms-sql-10-primary-key-constraint-syntax$dbw30992$,
   $dbw30993$How many PRIMARY KEY constraints can a single CREATE TABLE statement declare?$dbw30993$,
   $dbw30994$["Unlimited, one per candidate key", "Exactly one", "Up to two, for redundancy", "As many as there are UNIQUE constraints"]$dbw30994$::jsonb,
   1, $dbw30995$A table can have only one PRIMARY KEY; declaring a second one is a semantic error, unlike UNIQUE which permits multiple.$dbw30995$, 1, 3),
  ($dbw30996$tq-dbms-sql-10-primary-key-constraint-syntax-5$dbw30996$, $dbw30997$pt-dbms-sql-10-primary-key-constraint-syntax$dbw30997$,
   $dbw30998$Is an AUTO_INCREMENT (MySQL) or SERIAL (PostgreSQL) column required to also be a PRIMARY KEY?$dbw30998$,
   $dbw30999$["Yes, they cannot exist independently", "No, auto-increment/identity behavior and the PRIMARY KEY constraint are logically independent features often paired together but not required to be", "Yes, but only in PostgreSQL", "No, but only if the table has no other columns"]$dbw30999$::jsonb,
   1, $dbw31000$Auto-increment/identity generation controls how values are produced; PRIMARY KEY is a separate integrity constraint. They're commonly combined but neither requires the other.$dbw31000$, 1, 4),
  ($dbw31001$tq-dbms-sql-10-primary-key-constraint-syntax-6$dbw31001$, $dbw31002$pt-dbms-sql-10-primary-key-constraint-syntax$dbw31002$,
   $dbw31003$What is the naming convention risk of NOT explicitly naming a PRIMARY KEY constraint?$dbw31003$,
   $dbw31004$["The table cannot be queried until it is named", "The engine auto-generates a name you must look up later before you can DROP CONSTRAINT by name", "The primary key silently becomes a UNIQUE constraint instead", "Unnamed primary keys are rejected at CREATE TABLE time"]$dbw31004$::jsonb,
   1, $dbw31005$An unnamed PRIMARY KEY still gets a system-generated identifier (e.g. students_pkey in Postgres); referencing it later for DROP CONSTRAINT requires first discovering that generated name.$dbw31005$, 1, 5),
  ($dbw31006$tq-dbms-sql-10-primary-key-constraint-syntax-7$dbw31006$, $dbw31007$pt-dbms-sql-10-primary-key-constraint-syntax$dbw31007$,
   $dbw31008$Which statement correctly declares a composite primary key on (student_id, course_id) for an existing empty table enrollments?$dbw31008$,
   $dbw31009$["ALTER TABLE enrollments ADD PRIMARY KEY student_id, course_id;", "ALTER TABLE enrollments ADD CONSTRAINT pk_enroll PRIMARY KEY (student_id, course_id);", "ALTER TABLE enrollments MODIFY PRIMARY KEY (student_id) AND (course_id);", "ALTER TABLE enrollments SET PRIMARY KEY = (student_id, course_id);"]$dbw31009$::jsonb,
   1, $dbw31010$The table-level ADD CONSTRAINT ... PRIMARY KEY (col1, col2) form is the correct portable syntax for adding a composite key to an existing table.$dbw31010$, 1, 6),
  ($dbw31011$tq-dbms-sql-10-primary-key-constraint-syntax-8$dbw31011$, $dbw31012$pt-dbms-sql-10-primary-key-constraint-syntax$dbw31012$,
   $dbw31013$If a table's primary key needs to change from one column to a different column entirely, what is generally required across most SQL engines?$dbw31013$,
   $dbw31014$["A single ALTER TABLE RENAME PRIMARY KEY statement", "Dropping the existing primary key constraint and adding a new one on the new column", "Recreating the entire database", "It cannot be done once data exists in the table"]$dbw31014$::jsonb,
   1, $dbw31015$There is no universal direct 'rename primary key column set' operation; the standard approach is DROP CONSTRAINT (or DROP PRIMARY KEY) followed by ADD CONSTRAINT ... PRIMARY KEY on the new column(s).$dbw31015$, 1, 7)
on conflict (id) do nothing;

-- 10.4 FOREIGN KEY
with g as (select id from public.learning_grids where lower(slug) = $dbw31016$dbms-sql-tutorial$dbw31016$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31017$chapter-10-sql-constraints$dbw31017$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31018$FOREIGN KEY$dbw31018$, $dbw31019$foreign-key-constraint-syntax$dbw31019$, '', 4, 'published', true, true, $dbw31020$dbms_sql_tutorial$dbw31020$, $dbw31021$chapter-10-sql-constraints/foreign-key-constraint-syntax$dbw31021$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31022$dbms_sql_tutorial$dbw31022$ and source_ref = $dbw31023$chapter-10-sql-constraints/foreign-key-constraint-syntax$dbw31023$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31024$FOREIGN KEY$dbw31024$, $dbw31025$### This Topic's Focus

Chapter 5 explained referential integrity conceptually. This topic is about the SQL mechanics: declaration syntax, naming, the `ON DELETE`/`ON UPDATE` action clauses, and how validation behaves when you add a foreign key to a table that already has data.

### Column-Level Syntax

```sql
CREATE TABLE orders (
    order_id    INT PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id)
);
```

### Table-Level Syntax (required for composite foreign keys)

```sql
CREATE TABLE order_items (
    order_id   INT,
    product_id INT,
    quantity   INT,
    FOREIGN KEY (order_id, product_id)
        REFERENCES order_catalog(order_id, product_id)
);
```

Just like `PRIMARY KEY`, a foreign key referencing more than one column in the parent table can only be written using the table-level `FOREIGN KEY (...) REFERENCES ...` clause — you cannot inline a multi-column reference onto a single column.

### Naming the Constraint

```sql
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
```

### ON DELETE / ON UPDATE Actions

```sql
CREATE TABLE orders (
    order_id    INT PRIMARY KEY,
    customer_id INT,
    CONSTRAINT fk_orders_customer
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);
```

Common action keywords: `CASCADE` (propagate the delete/update to child rows), `SET NULL` (child FK column becomes NULL), `RESTRICT`/`NO ACTION` (block the parent operation if children reference it — the default in most engines), `SET DEFAULT` (child FK reverts to its DEFAULT value).

### Adding a FOREIGN KEY to an Existing Populated Table

```sql
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
```

This scans every existing row in `orders`; if any `customer_id` value has no matching row in `customers` (an "orphan"), the statement fails. The standard fix is to find and clean up orphans first:

```sql
SELECT o.* FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL AND o.customer_id IS NOT NULL;
```

### Dropping It

```sql
ALTER TABLE orders DROP CONSTRAINT fk_orders_customer;   -- PostgreSQL/Oracle/SQL Server
ALTER TABLE orders DROP FOREIGN KEY fk_orders_customer;  -- MySQL
```

### Edge Cases

- The referenced parent column(s) must be a `PRIMARY KEY` or have a `UNIQUE` constraint — you cannot reference an arbitrary non-unique column.
- A NULL value in the FK column is always allowed regardless of whether it matches any parent row — foreign keys don't enforce NOT NULL by themselves; combine explicitly with `NOT NULL` if required.
- Some engines (notably older MySQL MyISAM tables) silently ignore `FOREIGN KEY` clauses entirely because the storage engine doesn't support them — always confirm InnoDB is in use.

### Key Takeaways / Q&A

**Q: When is table-level FOREIGN KEY syntax mandatory?**
A: When the key references multiple columns in the parent table as a composite reference.

**Q: What happens if you add a FOREIGN KEY constraint to a table that already contains orphaned rows?**
A: The `ALTER TABLE` statement fails; orphans must be fixed or removed first.

**Q: Does a FOREIGN KEY column reject NULL by default?**
A: No — NULL is exempt from FK matching; add `NOT NULL` separately if the relationship must always be populated.$dbw31025$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31026$dbms_sql_tutorial_seed$dbw31026$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31027$dbms_sql_tutorial_seed$dbw31027$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31028$dbms-sql-tutorial$dbw31028$),
     t as (select id from public.learning_topics where source_kind = $dbw31029$dbms_sql_tutorial$dbw31029$ and source_ref = $dbw31030$chapter-10-sql-constraints/foreign-key-constraint-syntax$dbw31030$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31031$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31031$, $dbw31032$FOREIGN KEY - Quick Test$dbw31032$, 'aptitude', 8, 8,
  $dbw31033$8 questions on FOREIGN KEY.$dbw31033$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31034$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31034$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31035$tq-dbms-sql-10-foreign-key-constraint-syntax-1$dbw31035$, $dbw31036$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31036$,
   $dbw31037$Which SQL clause form is required when a foreign key references a composite (multi-column) primary key in the parent table?$dbw31037$,
   $dbw31038$["Column-level REFERENCES on each child column separately", "The table-level FOREIGN KEY (col1, col2) REFERENCES parent(col1, col2) clause", "Two separate single-column foreign keys", "A CHECK constraint combined with REFERENCES"]$dbw31038$::jsonb,
   1, $dbw31039$A composite foreign key must be declared as one table-level FOREIGN KEY clause listing all referencing and referenced columns together; it cannot be split across column-level REFERENCES clauses.$dbw31039$, 1, 0),
  ($dbw31040$tq-dbms-sql-10-foreign-key-constraint-syntax-2$dbw31040$, $dbw31041$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31041$,
   $dbw31042$What happens when you attempt to add a FOREIGN KEY constraint to a populated table that contains rows whose FK column value has no matching row in the parent table?$dbw31042$,
   $dbw31043$["The orphaned rows are automatically deleted", "The orphaned rows' FK column is automatically set to NULL", "The ALTER TABLE statement fails until the orphan rows are resolved", "The constraint is added but disabled for those rows"]$dbw31043$::jsonb,
   2, $dbw31044$Adding a FOREIGN KEY validates all existing rows against the parent table; any orphan reference causes the statement to fail.$dbw31044$, 1, 1),
  ($dbw31045$tq-dbms-sql-10-foreign-key-constraint-syntax-3$dbw31045$, $dbw31046$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31046$,
   $dbw31047$By default, does a NULL value in a foreign key column violate the foreign key constraint?$dbw31047$,
   $dbw31048$["Yes, always", "No, NULL is exempt from FK matching regardless of parent table contents", "Only if the parent table is empty", "Only in PostgreSQL"]$dbw31048$::jsonb,
   1, $dbw31049$Foreign keys only validate non-NULL values against the parent; NULL is always permitted unless a separate NOT NULL constraint is also applied.$dbw31049$, 1, 2),
  ($dbw31050$tq-dbms-sql-10-foreign-key-constraint-syntax-4$dbw31050$, $dbw31051$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31051$,
   $dbw31052$Which ON DELETE action causes child rows to be automatically deleted when the referenced parent row is deleted?$dbw31052$,
   $dbw31053$["RESTRICT", "SET NULL", "CASCADE", "NO ACTION"]$dbw31053$::jsonb,
   2, $dbw31054$ON DELETE CASCADE propagates the delete operation to matching child rows; RESTRICT/NO ACTION block the delete instead.$dbw31054$, 1, 3),
  ($dbw31055$tq-dbms-sql-10-foreign-key-constraint-syntax-5$dbw31055$, $dbw31056$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31056$,
   $dbw31057$What must be true of the column(s) in the parent table that a FOREIGN KEY references?$dbw31057$,
   $dbw31058$["They must be of type INT", "They must be indexed with a non-unique index", "They must be a PRIMARY KEY or carry a UNIQUE constraint", "They must be NOT NULL only, uniqueness is not required"]$dbw31058$::jsonb,
   2, $dbw31059$A foreign key can only reference a column or column set that is guaranteed unique in the parent — either its PRIMARY KEY or a UNIQUE constraint.$dbw31059$, 1, 4),
  ($dbw31060$tq-dbms-sql-10-foreign-key-constraint-syntax-6$dbw31060$, $dbw31061$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31061$,
   $dbw31062$In MySQL, which statement correctly drops a foreign key constraint named fk_orders_customer?$dbw31062$,
   $dbw31063$["ALTER TABLE orders DROP CONSTRAINT fk_orders_customer;", "ALTER TABLE orders DROP FOREIGN KEY fk_orders_customer;", "ALTER TABLE orders REMOVE FOREIGN KEY fk_orders_customer;", "DROP FOREIGN KEY fk_orders_customer ON orders;"]$dbw31063$::jsonb,
   1, $dbw31064$MySQL requires the DROP FOREIGN KEY clause specifically, distinct from the DROP CONSTRAINT syntax used by PostgreSQL, Oracle, and SQL Server.$dbw31064$, 1, 5),
  ($dbw31065$tq-dbms-sql-10-foreign-key-constraint-syntax-7$dbw31065$, $dbw31066$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31066$,
   $dbw31067$Why might a FOREIGN KEY clause in a CREATE TABLE statement be silently ignored in older MySQL setups?$dbw31067$,
   $dbw31068$["Because foreign keys were never part of the SQL standard", "Because the table uses a storage engine like MyISAM that does not support foreign key enforcement", "Because the column names don't match exactly", "Because MySQL requires foreign keys to be added only via ALTER TABLE, never CREATE TABLE"]$dbw31068$::jsonb,
   1, $dbw31069$Non-transactional storage engines like MyISAM parse but do not enforce FOREIGN KEY clauses; InnoDB is required for actual enforcement.$dbw31069$, 1, 6),
  ($dbw31070$tq-dbms-sql-10-foreign-key-constraint-syntax-8$dbw31070$, $dbw31071$pt-dbms-sql-10-foreign-key-constraint-syntax$dbw31071$,
   $dbw31072$What is the key syntactic difference this chapter's FOREIGN KEY discussion emphasizes compared to a prior chapter's coverage of foreign keys?$dbw31072$,
   $dbw31073$["This chapter explains why referential integrity matters conceptually", "This chapter focuses on DDL declaration mechanics: syntax, naming, ON DELETE/ON UPDATE actions, and validation against existing data", "This chapter only discusses foreign keys in the context of normalization", "There is no difference; the two chapters cover identical material"]$dbw31073$::jsonb,
   1, $dbw31074$The conceptual role of foreign keys (referential integrity) was covered earlier; this chapter's angle is purely the SQL syntax and validation mechanics used to declare and manage them.$dbw31074$, 1, 7)
on conflict (id) do nothing;

-- 10.5 CHECK
with g as (select id from public.learning_grids where lower(slug) = $dbw31075$dbms-sql-tutorial$dbw31075$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31076$chapter-10-sql-constraints$dbw31076$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31077$CHECK$dbw31077$, $dbw31078$check$dbw31078$, '', 5, 'published', true, true, $dbw31079$dbms_sql_tutorial$dbw31079$, $dbw31080$chapter-10-sql-constraints/check$dbw31080$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31081$dbms_sql_tutorial$dbw31081$ and source_ref = $dbw31082$chapter-10-sql-constraints/check$dbw31082$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31083$CHECK$dbw31083$, $dbw31084$### What CHECK Does

A `CHECK` constraint enforces an arbitrary boolean condition on every row: any `INSERT` or `UPDATE` that would make the expression evaluate to `FALSE` is rejected. Rows where the expression evaluates to `UNKNOWN` (typically because a referenced column is `NULL`) are **allowed** — `CHECK` only blocks definite `FALSE`, not `UNKNOWN`.

### Column-Level Syntax

```sql
CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    salary NUMERIC(10,2) CHECK (salary > 0),
    age    INT CHECK (age >= 18)
);
```

### Table-Level Syntax (needed when the condition spans multiple columns)

```sql
CREATE TABLE bookings (
    check_in  DATE,
    check_out DATE,
    CHECK (check_out > check_in)
);
```

`CHECK (check_out > check_in)` references two columns, so it must be written as a table-level clause; you cannot attach it inline to just one of the two columns.

### Adding CHECK to an Existing Table

```sql
ALTER TABLE employees ADD CONSTRAINT chk_salary_positive CHECK (salary > 0);
```

As with other constraints, this validates every existing row; a `salary` of `0` or negative anywhere in the table causes the `ALTER TABLE` to fail.

### The Historical MySQL Gotcha

For years — through MySQL 5.x and early 8.0 releases before **8.0.16** (released 2019) — MySQL's parser accepted `CHECK` constraint syntax without any error, but silently discarded it at execution time. You could declare `CHECK (salary > 0)`, insert a row with `salary = -500`, and MySQL would happily accept it with no warning. This caught many developers off guard because the DDL looked perfectly valid and no error was ever raised — the constraint simply did nothing. **MySQL 8.0.16 and later actually enforce `CHECK` constraints properly.** This is a well-known, frequently-tested historical gotcha: always verify your MySQL version (or migrate to PostgreSQL, which has enforced `CHECK` correctly since its earliest versions) before relying on `CHECK` for real data integrity.

### Edge Cases

- `CHECK (col IS NOT NULL)` is technically valid but redundant with — and less efficient than — a plain `NOT NULL` constraint; prefer `NOT NULL` for that specific case.
- A `CHECK` constraint can reference multiple columns but, in most engines, **cannot** reference another table (no subqueries) — that kind of cross-table rule needs a trigger instead.
- `CHECK` conditions involving `NULL` follow three-valued logic: `CHECK (age >= 18)` on a row where `age IS NULL` evaluates to `UNKNOWN`, not `FALSE`, so the row is **accepted** — a frequent source of confusion when people expect NULL to fail a numeric check.

### Key Takeaways / Q&A

**Q: Does a CHECK constraint reject a row when the expression evaluates to NULL/UNKNOWN?**
A: No — only a definite `FALSE` result blocks the row; `UNKNOWN` (from NULL operands) is treated as passing.

**Q: Why is the "old MySQL silently ignores CHECK" issue significant?**
A: Because the DDL parses without error, developers could believe integrity was enforced when it wasn't — a real, historically documented pitfall (fixed in MySQL 8.0.16+).

**Q: When must CHECK be written at table level rather than column level?**
A: Whenever the boolean expression involves more than one column, e.g. comparing `check_out` to `check_in`.$dbw31084$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31085$dbms_sql_tutorial_seed$dbw31085$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31086$dbms_sql_tutorial_seed$dbw31086$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31087$dbms-sql-tutorial$dbw31087$),
     t as (select id from public.learning_topics where source_kind = $dbw31088$dbms_sql_tutorial$dbw31088$ and source_ref = $dbw31089$chapter-10-sql-constraints/check$dbw31089$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31090$pt-dbms-sql-10-check$dbw31090$, $dbw31091$CHECK - Quick Test$dbw31091$, 'aptitude', 8, 8,
  $dbw31092$8 questions on CHECK.$dbw31092$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31093$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31093$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31094$tq-dbms-sql-10-check-1$dbw31094$, $dbw31095$pt-dbms-sql-10-check$dbw31095$,
   $dbw31096$What happens to a row where a CHECK constraint's boolean expression evaluates to UNKNOWN (e.g., due to a NULL operand)?$dbw31096$,
   $dbw31097$["The row is rejected, same as FALSE", "The row is accepted, since only a definite FALSE result blocks a row", "The row is accepted but flagged with a warning", "The behavior is undefined and engine-specific"]$dbw31097$::jsonb,
   1, $dbw31098$CHECK constraints use three-valued logic: only a definite FALSE evaluation rejects the row; UNKNOWN (typically from NULL) is treated as passing.$dbw31098$, 1, 0),
  ($dbw31099$tq-dbms-sql-10-check-2$dbw31099$, $dbw31100$pt-dbms-sql-10-check$dbw31100$,
   $dbw31101$Before which MySQL version did CHECK constraints parse successfully but get silently ignored at runtime?$dbw31101$,
   $dbw31102$["MySQL 5.0", "MySQL 8.0.16", "MySQL 8.0.30", "MySQL never had this issue"]$dbw31102$::jsonb,
   1, $dbw31103$MySQL versions prior to 8.0.16 (released 2019) accepted CHECK syntax but did not enforce it; 8.0.16 onward actually enforces CHECK constraints.$dbw31103$, 1, 1),
  ($dbw31104$tq-dbms-sql-10-check-3$dbw31104$, $dbw31105$pt-dbms-sql-10-check$dbw31105$,
   $dbw31106$Which CHECK constraint declaration correctly enforces that an employee's age must be at least 18?$dbw31106$,
   $dbw31107$["CHECK age >= 18", "age INT CHECK (age >= 18)", "age INT DEFAULT (age >= 18)", "CONSTRAINT age >= 18"]$dbw31107$::jsonb,
   1, $dbw31108$The correct column-level syntax wraps the boolean expression in CHECK(...) attached to the column definition.$dbw31108$, 1, 2),
  ($dbw31109$tq-dbms-sql-10-check-4$dbw31109$, $dbw31110$pt-dbms-sql-10-check$dbw31110$,
   $dbw31111$Why must CHECK (check_out > check_in) be written as a table-level constraint rather than a column-level one?$dbw31111$,
   $dbw31112$["Because DATE columns cannot have column-level CHECK constraints", "Because the expression references two columns, and column-level CHECK can only attach to a single column", "Because table-level CHECK constraints execute faster", "Because MySQL forbids column-level CHECK entirely"]$dbw31112$::jsonb,
   1, $dbw31113$A CHECK expression spanning multiple columns cannot be inlined onto just one of them; it requires the table-level CHECK clause.$dbw31113$, 1, 3),
  ($dbw31114$tq-dbms-sql-10-check-5$dbw31114$, $dbw31115$pt-dbms-sql-10-check$dbw31115$,
   $dbw31116$What happens when you run ALTER TABLE employees ADD CONSTRAINT chk_salary_positive CHECK (salary > 0); on a table that already has a row with salary = -100?$dbw31116$,
   $dbw31117$["The constraint is added and applies only to future rows", "The ALTER TABLE statement fails because the existing row violates the new constraint", "MySQL fixes the row automatically to salary = 0", "PostgreSQL ignores the violation silently"]$dbw31117$::jsonb,
   1, $dbw31118$Adding a CHECK constraint validates all existing rows; any row violating the new condition causes the ALTER TABLE to fail in standard-conforming engines.$dbw31118$, 1, 4),
  ($dbw31119$tq-dbms-sql-10-check-6$dbw31119$, $dbw31120$pt-dbms-sql-10-check$dbw31120$,
   $dbw31121$Can a standard CHECK constraint reference a column in a different table via a subquery?$dbw31121$,
   $dbw31122$["Yes, in all major SQL engines", "No, in most engines CHECK constraints cannot reference other tables; a trigger is needed for that", "Yes, but only in MySQL", "Yes, but only for foreign key columns"]$dbw31122$::jsonb,
   1, $dbw31123$CHECK constraints are generally restricted to expressions over columns in the same row/table; cross-table validation logic requires a trigger instead.$dbw31123$, 1, 5),
  ($dbw31124$tq-dbms-sql-10-check-7$dbw31124$, $dbw31125$pt-dbms-sql-10-check$dbw31125$,
   $dbw31126$Which of these is functionally redundant with a plain NOT NULL constraint, though technically valid as a CHECK?$dbw31126$,
   $dbw31127$["CHECK (salary > 0)", "CHECK (col IS NOT NULL)", "CHECK (age >= 18)", "CHECK (check_out > check_in)"]$dbw31127$::jsonb,
   1, $dbw31128$CHECK (col IS NOT NULL) duplicates what a dedicated NOT NULL constraint already does more directly and efficiently.$dbw31128$, 1, 6),
  ($dbw31129$tq-dbms-sql-10-check-8$dbw31129$, $dbw31130$pt-dbms-sql-10-check$dbw31130$,
   $dbw31131$A developer on an old MySQL 5.7 database declares CHECK (price >= 0) and then successfully inserts a row with price = -50 with no error. What is the most likely explanation?$dbw31131$,
   $dbw31132$["MySQL 5.7 rounds negative prices to zero automatically", "MySQL 5.7 predates CHECK enforcement, so the constraint was parsed but never enforced", "The column must not actually be of a numeric type", "The insert used a different connection without constraints enabled"]$dbw31132$::jsonb,
   1, $dbw31133$This is the well-known historical MySQL gotcha: versions before 8.0.16 accepted CHECK syntax without error but never enforced it at runtime.$dbw31133$, 1, 7)
on conflict (id) do nothing;

-- 10.6 DEFAULT
with g as (select id from public.learning_grids where lower(slug) = $dbw31134$dbms-sql-tutorial$dbw31134$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31135$chapter-10-sql-constraints$dbw31135$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31136$DEFAULT$dbw31136$, $dbw31137$default$dbw31137$, '', 6, 'published', true, true, $dbw31138$dbms_sql_tutorial$dbw31138$, $dbw31139$chapter-10-sql-constraints/default$dbw31139$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31140$dbms_sql_tutorial$dbw31140$ and source_ref = $dbw31141$chapter-10-sql-constraints/default$dbw31141$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31142$DEFAULT$dbw31142$, $dbw31143$### What DEFAULT Does

`DEFAULT` supplies a value automatically for a column when an `INSERT` statement omits that column entirely. It is a convenience/consistency feature, not an integrity constraint — it never rejects a statement; it just fills in a gap.

### Literal Defaults

```sql
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    in_stock   BOOLEAN DEFAULT TRUE,
    quantity   INT DEFAULT 0,
    status     VARCHAR(20) DEFAULT 'pending'
);
```

```sql
INSERT INTO products (product_id) VALUES (1);
-- in_stock = TRUE, quantity = 0, status = 'pending' automatically
```

### Expression / Function Defaults

```sql
CREATE TABLE orders (
    order_id   INT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

`CURRENT_TIMESTAMP` (also `NOW()` in MySQL, `SYSDATE` in Oracle) is evaluated fresh at the moment each row is inserted, not fixed at table-creation time. MySQL additionally supports `ON UPDATE CURRENT_TIMESTAMP` on a column so it auto-refreshes on every update — a MySQL-specific extension, not standard SQL.

### The Critical Rule: DEFAULT vs Explicit NULL

```sql
INSERT INTO products (product_id, quantity) VALUES (2, NULL);
-- quantity is explicitly set to NULL — DEFAULT does NOT apply here
```

`DEFAULT` only fires when a column is **left out of the column list** (or, in some dialects, when the literal keyword `DEFAULT` is used in the VALUES list: `VALUES (2, DEFAULT)`). Explicitly passing `NULL` always wins over any `DEFAULT` clause — the two are not interchangeable. This means `quantity INT DEFAULT 0` will still end up `NULL` in that row unless the column is *also* `NOT NULL`, in which case the explicit-NULL insert would instead fail outright.

### Adding/Changing a DEFAULT on an Existing Table

```sql
ALTER TABLE products ALTER COLUMN status SET DEFAULT 'active';   -- PostgreSQL
ALTER TABLE products ALTER status SET DEFAULT 'active';          -- SQL Server
ALTER TABLE products MODIFY status VARCHAR(20) DEFAULT 'active'; -- MySQL
```

Crucially, changing a `DEFAULT` never retroactively updates existing rows — it only affects future inserts that omit the column.

### Dropping a DEFAULT

```sql
ALTER TABLE products ALTER COLUMN status DROP DEFAULT;   -- PostgreSQL
```

### Edge Cases

- A `DEFAULT` expression referencing a non-deterministic function (like `RANDOM()` or `CURRENT_TIMESTAMP`) produces a different value per row, which is fine and common, but a `DEFAULT` cannot reference other columns of the same row in standard SQL (no `DEFAULT (price * 1.1)` referencing `price`) — that requires a generated/computed column instead.
- `DEFAULT` and `NOT NULL` combine well: `DEFAULT` handles the "column omitted" case; `NOT NULL` guards the "explicit NULL" case, but only if both are declared together.
- Auto-increment mechanisms (`SERIAL`, `AUTO_INCREMENT`, `IDENTITY`) are conceptually a specialized DEFAULT-like mechanism but are usually a separate keyword/feature, not the `DEFAULT` clause itself.

### Key Takeaways / Q&A

**Q: If a column has DEFAULT 0 and NOT NULL, and an INSERT explicitly supplies NULL for it, what happens?**
A: The insert fails with a NOT NULL violation — DEFAULT never rescues an explicit NULL.

**Q: Does changing a column's DEFAULT value update existing rows?**
A: No, only future inserts that omit the column are affected; existing stored values are untouched.

**Q: Is CURRENT_TIMESTAMP evaluated once when the table is created, or per row?**
A: Per row, at the moment each individual row is inserted.$dbw31143$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31144$dbms_sql_tutorial_seed$dbw31144$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31145$dbms_sql_tutorial_seed$dbw31145$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31146$dbms-sql-tutorial$dbw31146$),
     t as (select id from public.learning_topics where source_kind = $dbw31147$dbms_sql_tutorial$dbw31147$ and source_ref = $dbw31148$chapter-10-sql-constraints/default$dbw31148$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31149$pt-dbms-sql-10-default$dbw31149$, $dbw31150$DEFAULT - Quick Test$dbw31150$, 'aptitude', 8, 8,
  $dbw31151$8 questions on DEFAULT.$dbw31151$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31152$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31152$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31153$tq-dbms-sql-10-default-1$dbw31153$, $dbw31154$pt-dbms-sql-10-default$dbw31154$,
   $dbw31155$When does a column's DEFAULT value actually get applied during an INSERT?$dbw31155$,
   $dbw31156$["Whenever the column's value is NULL, whether explicit or omitted", "Only when the column is omitted entirely from the INSERT column list", "Only during UPDATE statements", "Only if the table has no PRIMARY KEY"]$dbw31156$::jsonb,
   1, $dbw31157$DEFAULT fires specifically when a column is left out of the INSERT; explicitly supplying NULL bypasses DEFAULT entirely.$dbw31157$, 1, 0),
  ($dbw31158$tq-dbms-sql-10-default-2$dbw31158$, $dbw31159$pt-dbms-sql-10-default$dbw31159$,
   $dbw31160$A column is declared `quantity INT DEFAULT 0` (nullable, no NOT NULL). What is the result of INSERT INTO products (product_id, quantity) VALUES (2, NULL)?$dbw31160$,
   $dbw31161$["quantity is set to 0 via the DEFAULT", "quantity is stored as NULL, since explicit NULL overrides DEFAULT", "The insert fails", "quantity is set to an empty string"]$dbw31161$::jsonb,
   1, $dbw31162$Explicitly passing NULL always wins over DEFAULT; DEFAULT only fills in when the column is omitted from the statement, not when NULL is explicitly given.$dbw31162$, 1, 1),
  ($dbw31163$tq-dbms-sql-10-default-3$dbw31163$, $dbw31164$pt-dbms-sql-10-default$dbw31164$,
   $dbw31165$When is CURRENT_TIMESTAMP as a column DEFAULT evaluated?$dbw31165$,
   $dbw31166$["Once, at the moment the table is created", "Fresh, at the moment each individual row is inserted", "Once per session, cached for all inserts in that session", "Never automatically; it must be set manually per insert"]$dbw31166$::jsonb,
   1, $dbw31167$DEFAULT CURRENT_TIMESTAMP is evaluated per row at insert time, giving each row its own accurate insertion timestamp.$dbw31167$, 1, 2),
  ($dbw31168$tq-dbms-sql-10-default-4$dbw31168$, $dbw31169$pt-dbms-sql-10-default$dbw31169$,
   $dbw31170$If you run ALTER TABLE products ALTER COLUMN status SET DEFAULT 'active'; on a table with existing rows, what happens to those existing rows' status values?$dbw31170$,
   $dbw31171$["They are all immediately updated to 'active'", "They remain unchanged; only future inserts that omit the column get the new default", "They become NULL until manually updated", "The ALTER TABLE fails if rows already exist"]$dbw31171$::jsonb,
   1, $dbw31172$Changing a DEFAULT clause only affects future inserts; it is not retroactively applied to rows already stored in the table.$dbw31172$, 1, 3),
  ($dbw31173$tq-dbms-sql-10-default-5$dbw31173$, $dbw31174$pt-dbms-sql-10-default$dbw31174$,
   $dbw31175$Which MySQL-specific extension allows a TIMESTAMP column to automatically refresh its value whenever the row is updated?$dbw31175$,
   $dbw31176$["DEFAULT CURRENT_TIMESTAMP alone", "ON UPDATE CURRENT_TIMESTAMP", "AUTO REFRESH TIMESTAMP", "TRIGGER BEFORE UPDATE"]$dbw31176$::jsonb,
   1, $dbw31177$MySQL supports an ON UPDATE CURRENT_TIMESTAMP clause on a column, a non-standard extension not part of ANSI SQL, that auto-updates the value on every row update.$dbw31177$, 1, 4),
  ($dbw31178$tq-dbms-sql-10-default-6$dbw31178$, $dbw31179$pt-dbms-sql-10-default$dbw31179$,
   $dbw31180$Can a column's DEFAULT expression reference another column in the same row, e.g. DEFAULT (price * 1.1)?$dbw31180$,
   $dbw31181$["Yes, in all standard SQL engines", "No, standard DEFAULT cannot reference sibling columns; a generated/computed column feature is needed for that", "Yes, but only in PostgreSQL", "Yes, but only for numeric columns"]$dbw31181$::jsonb,
   1, $dbw31182$A DEFAULT clause is a static or function-based expression independent of other columns; referencing another column's value requires a generated/computed column instead.$dbw31182$, 1, 5),
  ($dbw31183$tq-dbms-sql-10-default-7$dbw31183$, $dbw31184$pt-dbms-sql-10-default$dbw31184$,
   $dbw31185$Is a table's auto-increment mechanism (AUTO_INCREMENT / SERIAL / IDENTITY) the same feature as the DEFAULT clause?$dbw31185$,
   $dbw31186$["Yes, they are exactly the same keyword", "No, auto-increment is conceptually similar but is usually a distinct feature/keyword, not the DEFAULT clause itself", "Yes, but only in Oracle", "No, auto-increment is a type of CHECK constraint"]$dbw31186$::jsonb,
   1, $dbw31187$While auto-increment behaves like an automatically-supplied value, it is implemented via its own dedicated syntax (AUTO_INCREMENT, SERIAL, GENERATED ... AS IDENTITY) rather than the generic DEFAULT clause.$dbw31187$, 1, 6),
  ($dbw31188$tq-dbms-sql-10-default-8$dbw31188$, $dbw31189$pt-dbms-sql-10-default$dbw31189$,
   $dbw31190$A column is `status VARCHAR(20) NOT NULL DEFAULT 'pending'`. What happens with INSERT INTO t (id, status) VALUES (1, NULL)?$dbw31190$,
   $dbw31191$["status becomes 'pending' via DEFAULT", "The insert fails with a NOT NULL violation, because explicit NULL bypasses DEFAULT", "status becomes an empty string", "The insert succeeds with status left as NULL"]$dbw31191$::jsonb,
   1, $dbw31192$Because NULL is explicitly supplied, DEFAULT does not intervene, and the NOT NULL constraint then rejects the explicit NULL value, causing the statement to fail.$dbw31192$, 1, 7)
on conflict (id) do nothing;

-- 10.7 Named Constraints
with g as (select id from public.learning_grids where lower(slug) = $dbw31193$dbms-sql-tutorial$dbw31193$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31194$chapter-10-sql-constraints$dbw31194$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31195$Named Constraints$dbw31195$, $dbw31196$named-constraints$dbw31196$, '', 7, 'published', true, true, $dbw31197$dbms_sql_tutorial$dbw31197$, $dbw31198$chapter-10-sql-constraints/named-constraints$dbw31198$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31199$dbms_sql_tutorial$dbw31199$ and source_ref = $dbw31200$chapter-10-sql-constraints/named-constraints$dbw31200$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31201$Named Constraints$dbw31201$, $dbw31202$### Why Naming Matters

Every constraint — `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK` — gets a name whether you supply one or not. If you don't, the database engine auto-generates one, and those generated names are usually ugly, inconsistent across engines, and unpredictable: things like `SYS_C0012345` in Oracle, `employees_salary_check` in PostgreSQL (usually readable, but not guaranteed stable across recreations), or a numeric suffix pattern in SQL Server like `CK__employee__salary__3B75D760`.

### Explicit Naming Syntax

```sql
CREATE TABLE employees (
    emp_id INT,
    salary NUMERIC(10,2),
    CONSTRAINT pk_employees PRIMARY KEY (emp_id),
    CONSTRAINT chk_salary_positive CHECK (salary > 0)
);
```

The pattern is always `CONSTRAINT <name> <constraint-type> (...)`, and it works identically for column-level attachment:

```sql
CREATE TABLE employees (
    emp_id INT,
    salary NUMERIC(10,2) CONSTRAINT chk_salary_positive CHECK (salary > 0)
);
```

### Why Explicit Names Matter in Practice

Without a name, dropping or altering the constraint later requires first discovering what the engine actually called it:

```sql
-- You have to go find the generated name first...
SELECT conname FROM pg_constraint WHERE conrelid = 'employees'::regclass;
-- ...before you can do this:
ALTER TABLE employees DROP CONSTRAINT sql_generated_ugly_name_1234;
```

Compare that to the simple, predictable version when the constraint was named up front:

```sql
ALTER TABLE employees DROP CONSTRAINT chk_salary_positive;
```

This matters enormously in migration scripts, CI/CD pipelines, and cross-environment deployments (dev/staging/prod), where an auto-generated name can differ between environments if the table was created via slightly different paths — breaking a script that hardcodes one specific generated name.

### A Recommended Naming Convention

A common, readable convention:
- `pk_<table>` for primary keys
- `fk_<table>_<referenced_table>` for foreign keys
- `uq_<table>_<column>` for unique constraints
- `chk_<table>_<rule>` for check constraints

```sql
CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
```

### Renaming an Existing Constraint

```sql
ALTER TABLE employees RENAME CONSTRAINT old_name TO chk_salary_positive;  -- PostgreSQL
```

(Not all engines support a direct rename; MySQL, for instance, requires dropping and re-adding the constraint under the new name.)

### Edge Cases

- Constraint names must be unique **within a schema** in most engines (PostgreSQL), or within the table in others — check your target engine's scoping rule before reusing a name across tables.
- `NOT NULL` is the one constraint type that typically cannot be given an explicit custom name in standard syntax — it's referenced by column name directly when altering it.
- Naming collisions during a bulk migration (e.g., two tables both wanting `chk_status`) are a real, common error source — namespacing with the table name avoids this.

### Key Takeaways / Q&A

**Q: What is the main practical cost of leaving a constraint unnamed?**
A: Later maintenance (dropping, altering, or scripting against it) requires first looking up the engine's auto-generated name.

**Q: What is the general syntax pattern for naming any constraint?**
A: `CONSTRAINT <name> <constraint-definition>`, usable at both column level and table level.

**Q: Is NOT NULL typically given an explicit constraint name?**
A: No — most engines don't support naming NOT NULL directly; it's managed by referencing the column itself.$dbw31202$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31203$dbms_sql_tutorial_seed$dbw31203$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31204$dbms_sql_tutorial_seed$dbw31204$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31205$dbms-sql-tutorial$dbw31205$),
     t as (select id from public.learning_topics where source_kind = $dbw31206$dbms_sql_tutorial$dbw31206$ and source_ref = $dbw31207$chapter-10-sql-constraints/named-constraints$dbw31207$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31208$pt-dbms-sql-10-named-constraints$dbw31208$, $dbw31209$Named Constraints - Quick Test$dbw31209$, 'aptitude', 8, 8,
  $dbw31210$8 questions on Named Constraints.$dbw31210$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31211$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31211$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31212$tq-dbms-sql-10-named-constraints-1$dbw31212$, $dbw31213$pt-dbms-sql-10-named-constraints$dbw31213$,
   $dbw31214$What is the general syntax pattern for explicitly naming any constraint in SQL DDL?$dbw31214$,
   $dbw31215$["NAME <name> ON <constraint-definition>", "CONSTRAINT <name> <constraint-definition>", "<constraint-definition> AS <name>", "ALIAS <name> <constraint-definition>"]$dbw31215$::jsonb,
   1, $dbw31216$The standard pattern is CONSTRAINT <name> followed by the constraint type and its definition, usable at both column and table level.$dbw31216$, 1, 0),
  ($dbw31217$tq-dbms-sql-10-named-constraints-2$dbw31217$, $dbw31218$pt-dbms-sql-10-named-constraints$dbw31218$,
   $dbw31219$What is the primary practical downside of leaving a constraint unnamed?$dbw31219$,
   $dbw31220$["The constraint is not enforced until named", "Later dropping or altering it requires first discovering the engine's auto-generated name", "Unnamed constraints run slower at query time", "Unnamed constraints cannot be combined with NOT NULL"]$dbw31220$::jsonb,
   1, $dbw31221$An unnamed constraint still gets a system-generated identifier, but that name is often unpredictable and must be looked up before you can reference it in a later ALTER TABLE ... DROP CONSTRAINT.$dbw31221$, 1, 1),
  ($dbw31222$tq-dbms-sql-10-named-constraints-3$dbw31222$, $dbw31223$pt-dbms-sql-10-named-constraints$dbw31223$,
   $dbw31224$Why can auto-generated constraint names cause problems specifically in migration scripts across dev/staging/prod environments?$dbw31224$,
   $dbw31225$["Migration scripts cannot run against auto-generated names at all", "The generated name can differ between environments if tables were created via slightly different paths, breaking scripts that hardcode one specific name", "Auto-generated names are always identical across environments, so this is not actually a risk", "Migration tools automatically rename constraints on deploy"]$dbw31225$::jsonb,
   1, $dbw31226$Because the generation algorithm can be sensitive to creation order or path, hardcoding a guessed or observed auto-generated name in a script is fragile across environments; explicit naming avoids this entirely.$dbw31226$, 1, 2),
  ($dbw31227$tq-dbms-sql-10-named-constraints-4$dbw31227$, $dbw31228$pt-dbms-sql-10-named-constraints$dbw31228$,
   $dbw31229$Which constraint type typically CANNOT be given an explicit custom name in standard SQL syntax?$dbw31229$,
   $dbw31230$["CHECK", "UNIQUE", "NOT NULL", "FOREIGN KEY"]$dbw31230$::jsonb,
   2, $dbw31231$Most engines manage NOT NULL by referencing the column directly rather than allowing it a separate custom constraint name, unlike CHECK, UNIQUE, and FOREIGN KEY.$dbw31231$, 1, 3),
  ($dbw31232$tq-dbms-sql-10-named-constraints-5$dbw31232$, $dbw31233$pt-dbms-sql-10-named-constraints$dbw31233$,
   $dbw31234$Which of these follows a common, readable naming convention for a foreign key from orders to customers?$dbw31234$,
   $dbw31235$["fk_orders_customer", "constraint1", "orders_fk_1", "customer_orders_key"]$dbw31235$::jsonb,
   0, $dbw31236$A widely used convention is fk_<table>_<referenced_table>, making the relationship self-documenting at a glance.$dbw31236$, 1, 4),
  ($dbw31237$tq-dbms-sql-10-named-constraints-6$dbw31237$, $dbw31238$pt-dbms-sql-10-named-constraints$dbw31238$,
   $dbw31239$In PostgreSQL, what is generally required to discover the auto-generated name of an unnamed constraint before dropping it?$dbw31239$,
   $dbw31240$["Querying a system catalog like pg_constraint", "Restarting the database server", "Recreating the table", "There is no way to discover it; the table must be dropped and recreated"]$dbw31240$::jsonb,
   0, $dbw31241$PostgreSQL exposes constraint metadata via catalogs such as pg_constraint (or information_schema.table_constraints), which is how you find a generated name to use in DROP CONSTRAINT.$dbw31241$, 1, 5),
  ($dbw31242$tq-dbms-sql-10-named-constraints-7$dbw31242$, $dbw31243$pt-dbms-sql-10-named-constraints$dbw31243$,
   $dbw31244$How does MySQL typically handle 'renaming' an existing constraint, given it lacks a direct RENAME CONSTRAINT for all constraint types?$dbw31244$,
   $dbw31245$["It supports renaming natively with no workaround needed", "The constraint must be dropped and re-added under the new name", "MySQL constraints cannot be renamed or changed at all", "Renaming automatically happens on the next ALTER TABLE"]$dbw31245$::jsonb,
   1, $dbw31246$Unlike PostgreSQL's ALTER TABLE ... RENAME CONSTRAINT, MySQL generally requires dropping the old constraint and adding a new one with the desired name.$dbw31246$, 1, 6),
  ($dbw31247$tq-dbms-sql-10-named-constraints-8$dbw31247$, $dbw31248$pt-dbms-sql-10-named-constraints$dbw31248$,
   $dbw31249$What scoping rule commonly governs constraint name uniqueness in PostgreSQL?$dbw31249$,
   $dbw31250$["Names must be unique across the entire database cluster", "Names must be unique within the schema", "Names must be globally unique across all schemas and databases", "There is no uniqueness requirement for constraint names"]$dbw31250$::jsonb,
   1, $dbw31251$In PostgreSQL, constraint names are typically required to be unique within a schema, which is why namespacing names with the table (e.g. chk_orders_status) helps avoid collisions during bulk migrations.$dbw31251$, 1, 7)
on conflict (id) do nothing;

-- 10.8 Column Constraints
with g as (select id from public.learning_grids where lower(slug) = $dbw31252$dbms-sql-tutorial$dbw31252$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31253$chapter-10-sql-constraints$dbw31253$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31254$Column Constraints$dbw31254$, $dbw31255$column-constraints$dbw31255$, '', 8, 'published', true, true, $dbw31256$dbms_sql_tutorial$dbw31256$, $dbw31257$chapter-10-sql-constraints/column-constraints$dbw31257$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31258$dbms_sql_tutorial$dbw31258$ and source_ref = $dbw31259$chapter-10-sql-constraints/column-constraints$dbw31259$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31260$Column Constraints$dbw31260$, $dbw31261$### Definition

A **column constraint** is written inline, directly as part of a single column's definition within `CREATE TABLE` (or `ALTER TABLE ... ADD COLUMN`). It is visually and logically attached to exactly one column and can only ever govern that one column.

### Syntax Pattern

```sql
CREATE TABLE employees (
    emp_id     INT PRIMARY KEY,
    email      VARCHAR(150) UNIQUE NOT NULL,
    salary     NUMERIC(10,2) CHECK (salary > 0),
    department VARCHAR(50) DEFAULT 'General',
    hire_date  DATE NOT NULL
);
```

Here `PRIMARY KEY`, `UNIQUE`, `NOT NULL`, `CHECK (salary > 0)`, and `DEFAULT 'General'` are all column constraints — each sits right after its one column's type declaration, with no separate clause and no explicit column-name reference needed (the column is implicit: whichever one it's attached to).

### What Column Constraints Can and Cannot Express

They work for any rule that only needs to look at a single column's own value: not-null-ness, a single-column uniqueness rule, a single-column range check, a single-column default, or a single-column foreign key reference.

They **cannot** express a rule that needs to see more than one column at once. `CHECK (salary > 0)` is fine as a column constraint because it only touches `salary`. `CHECK (check_out > check_in)` is impossible to write as a column constraint, because there is no single column to attach it to that also "sees" the other column — the database would have no clear notion of which column definition the rule belongs to. This exact impossibility is what makes table constraints necessary, covered in the next topic.

### Multiple Column Constraints on One Column

You can stack several column constraints on the same column, in any order (though style guides often standardize an order like type → NOT NULL → DEFAULT → CHECK → UNIQUE):

```sql
username VARCHAR(50) NOT NULL UNIQUE DEFAULT 'guest' CHECK (LENGTH(username) >= 3)
```

### Column Constraints in ALTER TABLE ... ADD COLUMN

```sql
ALTER TABLE employees ADD COLUMN bonus NUMERIC(10,2) DEFAULT 0 CHECK (bonus >= 0);
```

The same inline pattern applies when adding a brand-new column to an existing table.

### Edge Cases

- A column constraint can still indirectly involve a **subquery or function call**, e.g. `CHECK (price BETWEEN 0 AND 100000)`, as long as everything it evaluates comes from that one column's value at that row — it's the "how many columns does the *expression* reference," not the "is it syntactically fancy," that determines column- vs table-level necessity.
- Anonymous (unnamed) column constraints are extremely common in casual schema code, but per Topic 10.7, naming them explicitly (`salary NUMERIC(10,2) CONSTRAINT chk_salary_pos CHECK (salary > 0)`) is still fully valid column-level syntax — "column-level" and "named" are independent, orthogonal choices.
- Some engines allow a column constraint to reference the same table's other rows implicitly through `CHECK` — this is **not** portable/reliable and is generally disallowed or ignored by most engines; don't rely on cross-row CHECK logic.

### Key Takeaways / Q&A

**Q: What single test determines whether a constraint MUST be table-level rather than column-level?**
A: Whether the constraint's boolean/rule expression needs to reference more than one column.

**Q: Can a column constraint be named?**
A: Yes — being column-level and being named are independent; you can write `CONSTRAINT name CHECK(...)` inline on a single column.

**Q: Give an example of a rule impossible to express as a column constraint.**
A: `CHECK (check_out > check_in)` — it needs two columns, so it must be a table constraint.$dbw31261$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31262$dbms_sql_tutorial_seed$dbw31262$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31263$dbms_sql_tutorial_seed$dbw31263$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31264$dbms-sql-tutorial$dbw31264$),
     t as (select id from public.learning_topics where source_kind = $dbw31265$dbms_sql_tutorial$dbw31265$ and source_ref = $dbw31266$chapter-10-sql-constraints/column-constraints$dbw31266$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31267$pt-dbms-sql-10-column-constraints$dbw31267$, $dbw31268$Column Constraints - Quick Test$dbw31268$, 'aptitude', 8, 8,
  $dbw31269$8 questions on Column Constraints.$dbw31269$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31270$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31270$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31271$tq-dbms-sql-10-column-constraints-1$dbw31271$, $dbw31272$pt-dbms-sql-10-column-constraints$dbw31272$,
   $dbw31273$What defines a 'column constraint' as opposed to a table constraint?$dbw31273$,
   $dbw31274$["It must always be named explicitly", "It is written inline as part of a single column's definition and can only govern that one column", "It can only be a NOT NULL or DEFAULT clause", "It must be added via ALTER TABLE, never CREATE TABLE"]$dbw31274$::jsonb,
   1, $dbw31275$A column constraint is attached directly to one column's definition and is inherently limited to referencing that single column.$dbw31275$, 1, 0),
  ($dbw31276$tq-dbms-sql-10-column-constraints-2$dbw31276$, $dbw31277$pt-dbms-sql-10-column-constraints$dbw31277$,
   $dbw31278$Which of these CHECK conditions is IMPOSSIBLE to express as a column-level constraint?$dbw31278$,
   $dbw31279$["CHECK (salary > 0)", "CHECK (age >= 18)", "CHECK (check_out > check_in)", "CHECK (price BETWEEN 0 AND 100000)"]$dbw31279$::jsonb,
   2, $dbw31280$CHECK (check_out > check_in) references two different columns, which a column-level constraint attached to a single column cannot express; it requires table-level syntax.$dbw31280$, 1, 1),
  ($dbw31281$tq-dbms-sql-10-column-constraints-3$dbw31281$, $dbw31282$pt-dbms-sql-10-column-constraints$dbw31282$,
   $dbw31283$Can a column constraint be given an explicit name, e.g. `salary NUMERIC(10,2) CONSTRAINT chk_salary_pos CHECK (salary > 0)`?$dbw31283$,
   $dbw31284$["No, only table-level constraints can be named", "Yes, being column-level and being named are independent, orthogonal choices", "Yes, but only for CHECK constraints", "No, naming forces it to become a table constraint"]$dbw31284$::jsonb,
   1, $dbw31285$A column constraint can still carry an explicit CONSTRAINT name inline; whether it's column- or table-level is unrelated to whether it's named.$dbw31285$, 1, 2),
  ($dbw31286$tq-dbms-sql-10-column-constraints-4$dbw31286$, $dbw31287$pt-dbms-sql-10-column-constraints$dbw31287$,
   $dbw31288$In `email VARCHAR(150) UNIQUE NOT NULL`, how many separate column constraints are being applied?$dbw31288$,
   $dbw31289$["One", "Two: UNIQUE and NOT NULL", "Three, including an implicit CHECK", "Zero, because no CONSTRAINT keyword is used"]$dbw31289$::jsonb,
   1, $dbw31290$Multiple column constraints can be stacked on one column; here both UNIQUE and NOT NULL apply to the same email column.$dbw31290$, 1, 3),
  ($dbw31291$tq-dbms-sql-10-column-constraints-5$dbw31291$, $dbw31292$pt-dbms-sql-10-column-constraints$dbw31292$,
   $dbw31293$What is the single determining test for whether a rule must be written as a table constraint rather than a column constraint?$dbw31293$,
   $dbw31294$["Whether the rule involves a function call", "Whether the rule's expression needs to reference more than one column", "Whether the rule is named", "Whether the table has a PRIMARY KEY already"]$dbw31294$::jsonb,
   1, $dbw31295$The deciding factor is purely how many columns the constraint's expression must reference — more than one forces table-level syntax.$dbw31295$, 1, 4),
  ($dbw31296$tq-dbms-sql-10-column-constraints-6$dbw31296$, $dbw31297$pt-dbms-sql-10-column-constraints$dbw31297$,
   $dbw31298$Can a column constraint be added when adding a brand-new column via ALTER TABLE ... ADD COLUMN?$dbw31298$,
   $dbw31299$["No, ALTER TABLE ADD COLUMN cannot carry any constraints", "Yes, e.g. ALTER TABLE employees ADD COLUMN bonus NUMERIC(10,2) DEFAULT 0 CHECK (bonus >= 0);", "Only NOT NULL can be added this way", "Only if the table is empty"]$dbw31299$::jsonb,
   1, $dbw31300$The same inline column-constraint pattern used in CREATE TABLE applies when adding a new column to an existing table via ALTER TABLE ... ADD COLUMN.$dbw31300$, 1, 5),
  ($dbw31301$tq-dbms-sql-10-column-constraints-7$dbw31301$, $dbw31302$pt-dbms-sql-10-column-constraints$dbw31302$,
   $dbw31303$Is it reliable to write a CHECK column constraint whose logic depends on comparing values across different rows of the same table?$dbw31303$,
   $dbw31304$["Yes, this is standard, portable behavior across all engines", "No, cross-row CHECK logic is generally disallowed or unreliable, and not portable", "Yes, but only in PostgreSQL 14+", "Yes, as long as the column is also UNIQUE"]$dbw31304$::jsonb,
   1, $dbw31305$CHECK constraints are meant to validate a single row's own column values; relying on cross-row comparisons is unsupported or unreliable across most engines.$dbw31305$, 1, 6),
  ($dbw31306$tq-dbms-sql-10-column-constraints-8$dbw31306$, $dbw31307$pt-dbms-sql-10-column-constraints$dbw31307$,
   $dbw31308$A PRIMARY KEY spanning two columns (student_id, course_id) — can it be written using column-level syntax?$dbw31308$,
   $dbw31309$["Yes, by attaching PRIMARY KEY to either column", "No, a composite key must use table-level PRIMARY KEY (col1, col2) syntax", "Yes, by attaching PRIMARY KEY to both columns separately", "Yes, if NOT NULL is also applied to both columns"]$dbw31309$::jsonb,
   1, $dbw31310$Column-level syntax can only govern a single column, so any key spanning multiple columns — like a composite primary key — requires the table-level clause.$dbw31310$, 1, 7)
on conflict (id) do nothing;

-- 10.9 Table Constraints
with g as (select id from public.learning_grids where lower(slug) = $dbw31311$dbms-sql-tutorial$dbw31311$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31312$chapter-10-sql-constraints$dbw31312$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31313$Table Constraints$dbw31313$, $dbw31314$table-constraints$dbw31314$, '', 9, 'published', true, true, $dbw31315$dbms_sql_tutorial$dbw31315$, $dbw31316$chapter-10-sql-constraints/table-constraints$dbw31316$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31317$dbms_sql_tutorial$dbw31317$ and source_ref = $dbw31318$chapter-10-sql-constraints/table-constraints$dbw31318$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31319$Table Constraints$dbw31319$, $dbw31320$### Definition

A **table constraint** is written as its own separate clause inside `CREATE TABLE` (or added via a standalone `ALTER TABLE ... ADD CONSTRAINT`), rather than being attached inline to one column's definition. Syntactically it appears at the same level as a column definition, listed among the table's columns, but it names the column(s) it applies to explicitly inside parentheses rather than relying on inline placement.

### Why Table Constraints Exist: The Multi-Column Requirement

The defining reason table-level syntax exists is that some rules inherently span more than one column, and there is no single column to visually "attach" them to:

```sql
CREATE TABLE enrollments (
    student_id INT,
    course_id  INT,
    grade      CHAR(2),
    enrolled_on DATE,
    completed_on DATE,
    PRIMARY KEY (student_id, course_id),          -- composite key: 2 columns
    CHECK (completed_on IS NULL OR completed_on >= enrolled_on),  -- 2 columns
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);
```

The composite `PRIMARY KEY` and the multi-column `CHECK` are **only** expressible this way — there is no column-level equivalent for either.

### Full Syntax Forms

```sql
CREATE TABLE t (
    col1 INT,
    col2 INT,
    CONSTRAINT pk_t PRIMARY KEY (col1, col2),
    CONSTRAINT uq_t UNIQUE (col1),
    CONSTRAINT chk_t CHECK (col1 < col2),
    CONSTRAINT fk_t FOREIGN KEY (col2) REFERENCES other_table(id)
);
```

Every constraint type — `PRIMARY KEY`, `UNIQUE`, `CHECK`, `FOREIGN KEY` — has a valid table-level form. `NOT NULL` is the sole exception: it has **no** table-level form at all, since "not null" is inherently a per-column property with no meaningful multi-column phrasing.

### Table Constraints on Single Columns — Also Legal

A table constraint doesn't strictly require multiple columns; it's legal (if slightly more verbose) to write a single-column rule at table level too:

```sql
CREATE TABLE employees (
    emp_id INT,
    salary NUMERIC(10,2),
    CONSTRAINT chk_salary_positive CHECK (salary > 0)   -- table-level, but only touches 1 column
);
```

This is functionally identical to writing `CHECK (salary > 0)` inline on the `salary` column — the choice here is purely stylistic (some teams standardize on always using table-level clauses grouped at the bottom of the `CREATE TABLE` for readability, even for single-column rules).

### Adding Table Constraints After Creation

```sql
ALTER TABLE enrollments
  ADD CONSTRAINT chk_dates CHECK (completed_on IS NULL OR completed_on >= enrolled_on);
```

`ALTER TABLE ... ADD CONSTRAINT` is inherently a "table constraint" operation — there is no way to retroactively splice a constraint into the middle of an existing column's inline definition; anything added later is structurally a table-level addition even if it only touches one column.

### Edge Cases

- Table constraints are always comma-separated siblings of column definitions inside the `CREATE TABLE` parentheses — order relative to columns doesn't matter for evaluation, only for readability.
- A single `CREATE TABLE` can mix column-level and table-level constraints freely in the same statement.
- Some style guides mandate table-level syntax for **every** constraint (even single-column ones) specifically to keep constraint management centralized and easy to scan/audit in one place near the bottom of the DDL.

### Key Takeaways / Q&A

**Q: Which constraint type has no table-level form at all?**
A: NOT NULL — it is exclusively a column-level, per-column property.

**Q: Is it valid to write a single-column CHECK at table level?**
A: Yes, it's legal and purely a stylistic choice, functionally identical to the column-level version.

**Q: Why is a composite PRIMARY KEY unavoidably a table constraint?**
A: Because it spans two or more columns, and there's no single column definition it could be attached to inline.$dbw31320$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31321$dbms_sql_tutorial_seed$dbw31321$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31322$dbms_sql_tutorial_seed$dbw31322$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31323$dbms-sql-tutorial$dbw31323$),
     t as (select id from public.learning_topics where source_kind = $dbw31324$dbms_sql_tutorial$dbw31324$ and source_ref = $dbw31325$chapter-10-sql-constraints/table-constraints$dbw31325$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31326$pt-dbms-sql-10-table-constraints$dbw31326$, $dbw31327$Table Constraints - Quick Test$dbw31327$, 'aptitude', 8, 8,
  $dbw31328$8 questions on Table Constraints.$dbw31328$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31329$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31329$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31330$tq-dbms-sql-10-table-constraints-1$dbw31330$, $dbw31331$pt-dbms-sql-10-table-constraints$dbw31331$,
   $dbw31332$What structurally distinguishes a table constraint from a column constraint in CREATE TABLE syntax?$dbw31332$,
   $dbw31333$["A table constraint must always be CHECK", "A table constraint is written as its own separate clause naming its target column(s) explicitly, rather than being attached inline to one column's definition", "A table constraint cannot be named", "A table constraint can only be added via ALTER TABLE, never CREATE TABLE"]$dbw31333$::jsonb,
   1, $dbw31334$Table constraints appear as standalone clauses within CREATE TABLE, listing the relevant column(s) in parentheses, unlike column constraints which are embedded in a single column's definition.$dbw31334$, 1, 0),
  ($dbw31335$tq-dbms-sql-10-table-constraints-2$dbw31335$, $dbw31336$pt-dbms-sql-10-table-constraints$dbw31336$,
   $dbw31337$Which constraint type has NO table-level form at all?$dbw31337$,
   $dbw31338$["CHECK", "UNIQUE", "NOT NULL", "PRIMARY KEY"]$dbw31338$::jsonb,
   2, $dbw31339$NOT NULL is inherently a per-column property with no meaningful multi-column phrasing, so unlike CHECK, UNIQUE, PRIMARY KEY, and FOREIGN KEY, it has no table-level clause form.$dbw31339$, 1, 1),
  ($dbw31340$tq-dbms-sql-10-table-constraints-3$dbw31340$, $dbw31341$pt-dbms-sql-10-table-constraints$dbw31341$,
   $dbw31342$Is it valid to write CONSTRAINT chk_salary_positive CHECK (salary > 0) as a table-level clause even though it only references one column?$dbw31342$,
   $dbw31343$["No, table constraints must reference at least two columns", "Yes, it is legal and functionally identical to the column-level equivalent; it's purely a stylistic choice", "Yes, but only in PostgreSQL", "No, this would be rejected as a syntax error"]$dbw31343$::jsonb,
   1, $dbw31344$A table constraint does not strictly require multiple columns — writing a single-column rule at table level is legal and behaves identically to the column-level version.$dbw31344$, 1, 2),
  ($dbw31345$tq-dbms-sql-10-table-constraints-4$dbw31345$, $dbw31346$pt-dbms-sql-10-table-constraints$dbw31346$,
   $dbw31347$Why does a composite PRIMARY KEY on (student_id, course_id) require table-level syntax?$dbw31347$,
   $dbw31348$["Because composite keys are deprecated at column level", "Because it spans two columns and there is no single column definition to attach it to inline", "Because PostgreSQL disallows column-level PRIMARY KEY entirely", "Because composite keys must always be UNIQUE instead"]$dbw31348$::jsonb,
   1, $dbw31349$Any constraint spanning multiple columns, including a composite primary key, cannot be attached to just one column's inline definition and therefore must use the table-level clause.$dbw31349$, 1, 3),
  ($dbw31350$tq-dbms-sql-10-table-constraints-5$dbw31350$, $dbw31351$pt-dbms-sql-10-table-constraints$dbw31351$,
   $dbw31352$When you run ALTER TABLE t ADD CONSTRAINT chk_x CHECK (col1 > 0);, is this structurally a column constraint or a table constraint addition?$dbw31352$,
   $dbw31353$["A column constraint, because it only touches one column", "A table constraint addition, because there is no way to splice a constraint into an existing column's inline definition retroactively", "Neither; ALTER TABLE constraints are a third distinct category", "It depends on whether the column is NOT NULL"]$dbw31353$::jsonb,
   1, $dbw31354$Anything added via ALTER TABLE ... ADD CONSTRAINT is structurally a table-level addition, regardless of how many columns it references, since it can't be spliced into an existing inline column definition.$dbw31354$, 1, 4),
  ($dbw31355$tq-dbms-sql-10-table-constraints-6$dbw31355$, $dbw31356$pt-dbms-sql-10-table-constraints$dbw31356$,
   $dbw31357$Can a single CREATE TABLE statement mix column-level and table-level constraints together?$dbw31357$,
   $dbw31358$["No, a table must use one style exclusively", "Yes, they can be freely mixed in the same statement", "Only if all table-level constraints come first", "Only in Oracle"]$dbw31358$::jsonb,
   1, $dbw31359$There is no restriction against combining column-level constraints (e.g., NOT NULL inline) with table-level constraints (e.g., a composite PRIMARY KEY clause) in the same CREATE TABLE.$dbw31359$, 1, 5),
  ($dbw31360$tq-dbms-sql-10-table-constraints-7$dbw31360$, $dbw31361$pt-dbms-sql-10-table-constraints$dbw31361$,
   $dbw31362$Which of the following requires table-level syntax rather than column-level?$dbw31362$,
   $dbw31363$["email VARCHAR(150) UNIQUE", "salary NUMERIC(10,2) CHECK (salary > 0)", "UNIQUE (student_id, course_id)", "hire_date DATE NOT NULL"]$dbw31363$::jsonb,
   2, $dbw31364$UNIQUE (student_id, course_id) enforces uniqueness across a combination of two columns, which can only be expressed as a table-level clause.$dbw31364$, 1, 6),
  ($dbw31365$tq-dbms-sql-10-table-constraints-8$dbw31365$, $dbw31366$pt-dbms-sql-10-table-constraints$dbw31366$,
   $dbw31367$Why might a style guide mandate that even single-column CHECK constraints always be written at table level?$dbw31367$,
   $dbw31368$["Because column-level CHECK is not supported by any engine", "To keep constraint management centralized and easy to scan/audit near the bottom of the DDL", "Because table-level constraints execute with better performance", "Because column-level constraints cannot be named"]$dbw31368$::jsonb,
   1, $dbw31369$Some teams standardize on always grouping constraints as table-level clauses purely for readability and easier auditing, even though it has no functional difference for single-column rules.$dbw31369$, 1, 7)
on conflict (id) do nothing;

-- 10.10 Constraint Validation
with g as (select id from public.learning_grids where lower(slug) = $dbw31370$dbms-sql-tutorial$dbw31370$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31371$chapter-10-sql-constraints$dbw31371$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31372$Constraint Validation$dbw31372$, $dbw31373$constraint-validation$dbw31373$, '', 10, 'published', true, true, $dbw31374$dbms_sql_tutorial$dbw31374$, $dbw31375$chapter-10-sql-constraints/constraint-validation$dbw31375$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31376$dbms_sql_tutorial$dbw31376$ and source_ref = $dbw31377$chapter-10-sql-constraints/constraint-validation$dbw31377$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31378$Constraint Validation$dbw31378$, $dbw31379$### Two Different Validation Moments

Constraint validation happens at two conceptually distinct times, and understanding the difference is essential for working with real, populated databases:

1. **Statement-time validation** — every ordinary `INSERT` or `UPDATE` is checked against all constraints currently defined on the table, immediately (by default; see Topic 10.11 for the deferred exception).
2. **Constraint-addition-time validation** — when you run `ALTER TABLE ... ADD CONSTRAINT` on a table that already contains rows, the engine must first verify that *every existing row* already satisfies the new rule before the constraint is allowed to attach.

### Statement-Time Validation

```sql
CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    salary NUMERIC(10,2) CHECK (salary > 0)
);

INSERT INTO employees VALUES (1, -500);
-- ERROR: new row violates check constraint "employees_salary_check"
```

Each statement is checked in isolation, at the moment it executes (immediate constraints, the default for every constraint type in every engine unless you explicitly opt into deferred checking).

### Constraint-Addition-Time Validation

```sql
-- Table already has rows, some with salary = -200
ALTER TABLE employees ADD CONSTRAINT chk_salary_positive CHECK (salary > 0);
-- ERROR: check constraint "chk_salary_positive" is violated by some row
```

The engine effectively runs an implicit validation scan equivalent to:

```sql
SELECT COUNT(*) FROM employees WHERE NOT (salary > 0);
```

before it will commit the new constraint. If that count is nonzero, the `ALTER TABLE` is rejected outright.

### Splitting Addition Into "Add Unchecked" + "Validate Later" (PostgreSQL)

For very large tables, scanning every row while holding a lock during `ADD CONSTRAINT` can be disruptive. PostgreSQL offers a two-step pattern:

```sql
-- Step 1: add the constraint but skip validating existing rows (fast, brief lock)
ALTER TABLE employees ADD CONSTRAINT chk_salary_positive CHECK (salary > 0) NOT VALID;

-- Step 2: validate existing rows separately, without blocking concurrent writes as heavily
ALTER TABLE employees VALIDATE CONSTRAINT chk_salary_positive;
```

Critically, even in the `NOT VALID` interim state, the constraint is **already fully enforced for all new INSERT/UPDATE statements** — `NOT VALID` only means "we haven't yet confirmed the pre-existing rows comply," not "this constraint is inactive."

### Edge Cases

- `FOREIGN KEY` validation at add-time requires a full scan of the child table checking every row against the parent — on large tables this can be slow and lock-heavy, which is exactly why the `NOT VALID` / `VALIDATE CONSTRAINT` split exists in PostgreSQL.
- Validating a `UNIQUE` constraint addition is effectively a duplicate-detection scan (`GROUP BY ... HAVING COUNT(*) > 1`), which the engine performs internally.
- Disabling constraint checking temporarily (e.g., MySQL's `SET FOREIGN_KEY_CHECKS=0` or Oracle's `ALTER TABLE ... DISABLE CONSTRAINT`) is sometimes used for bulk data loads, but re-enabling afterward may itself trigger revalidation, and skipped-checking windows can let bad data slip in if not carefully audited afterward.

### Key Takeaways / Q&A

**Q: When is a constraint checked for an ordinary application INSERT?**
A: Immediately, at statement execution time, by default.

**Q: What must happen before ADD CONSTRAINT succeeds on a populated table?**
A: The engine validates every existing row against the new rule; any violation blocks the operation.

**Q: What does PostgreSQL's NOT VALID actually mean?**
A: The constraint is fully enforced going forward for new writes; only the retroactive check of pre-existing rows is deferred to a later VALIDATE CONSTRAINT step.$dbw31379$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31380$dbms_sql_tutorial_seed$dbw31380$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31381$dbms_sql_tutorial_seed$dbw31381$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31382$dbms-sql-tutorial$dbw31382$),
     t as (select id from public.learning_topics where source_kind = $dbw31383$dbms_sql_tutorial$dbw31383$ and source_ref = $dbw31384$chapter-10-sql-constraints/constraint-validation$dbw31384$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31385$pt-dbms-sql-10-constraint-validation$dbw31385$, $dbw31386$Constraint Validation - Quick Test$dbw31386$, 'aptitude', 8, 8,
  $dbw31387$8 questions on Constraint Validation.$dbw31387$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31388$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31388$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31389$tq-dbms-sql-10-constraint-validation-1$dbw31389$, $dbw31390$pt-dbms-sql-10-constraint-validation$dbw31390$,
   $dbw31391$By default, when is a CHECK constraint evaluated for a normal INSERT statement?$dbw31391$,
   $dbw31392$["Only when the table is queried afterward", "Immediately, at the moment the INSERT statement executes", "Only at the end of the transaction, regardless of constraint type", "Only when explicitly requested via VALIDATE CONSTRAINT"]$dbw31392$::jsonb,
   1, $dbw31393$Unless a constraint is explicitly declared deferrable and deferred (see PostgreSQL's DEFERRABLE), every constraint is checked immediately at statement execution time by default.$dbw31393$, 1, 0),
  ($dbw31394$tq-dbms-sql-10-constraint-validation-2$dbw31394$, $dbw31395$pt-dbms-sql-10-constraint-validation$dbw31395$,
   $dbw31396$What must be true before ALTER TABLE ... ADD CONSTRAINT succeeds on a table that already contains rows?$dbw31396$,
   $dbw31397$["The table must first be truncated", "Every existing row must already satisfy the new constraint's rule", "The table must have fewer than 1000 rows", "Nothing; the constraint always applies only to future rows"]$dbw31397$::jsonb,
   1, $dbw31398$Adding a constraint to a populated table triggers an implicit validation scan of existing data; if any row violates the new rule, the ALTER TABLE fails.$dbw31398$, 1, 1),
  ($dbw31399$tq-dbms-sql-10-constraint-validation-3$dbw31399$, $dbw31400$pt-dbms-sql-10-constraint-validation$dbw31400$,
   $dbw31401$In PostgreSQL, what does adding a constraint with the NOT VALID option actually mean?$dbw31401$,
   $dbw31402$["The constraint is completely inactive until manually enabled", "The constraint is fully enforced for all new INSERT/UPDATE statements, but existing rows have not yet been checked", "The constraint only applies to SELECT statements", "NOT VALID constraints are automatically dropped after 24 hours"]$dbw31402$::jsonb,
   1, $dbw31403$NOT VALID skips the initial full-table scan of pre-existing rows for performance, but the constraint immediately governs all new writes; VALIDATE CONSTRAINT later confirms old rows comply.$dbw31403$, 1, 2),
  ($dbw31404$tq-dbms-sql-10-constraint-validation-4$dbw31404$, $dbw31405$pt-dbms-sql-10-constraint-validation$dbw31405$,
   $dbw31406$Why might a large production table use the ADD CONSTRAINT ... NOT VALID followed by VALIDATE CONSTRAINT pattern instead of a plain ADD CONSTRAINT?$dbw31406$,
   $dbw31407$["Because NOT VALID constraints run faster forever", "To avoid a long table lock caused by scanning every existing row in a single blocking operation", "Because plain ADD CONSTRAINT is deprecated", "Because VALIDATE CONSTRAINT is required by the SQL standard"]$dbw31407$::jsonb,
   1, $dbw31408$Splitting the operation lets the initial attach be fast with a brief lock, while the potentially slow full-table validation scan happens separately, reducing disruption on large, busy tables.$dbw31408$, 1, 3),
  ($dbw31409$tq-dbms-sql-10-constraint-validation-5$dbw31409$, $dbw31410$pt-dbms-sql-10-constraint-validation$dbw31410$,
   $dbw31411$What kind of internal check does the engine effectively perform when adding a UNIQUE constraint to a populated table?$dbw31411$,
   $dbw31412$["A full table scan checking for NULLs only", "A duplicate-detection scan, conceptually similar to GROUP BY ... HAVING COUNT(*) > 1", "No check; UNIQUE constraints are never validated against existing data", "A check that the table has an index already"]$dbw31412$::jsonb,
   1, $dbw31413$Adding UNIQUE requires confirming no existing duplicate values are present, which is effectively a group-and-count duplicate detection scan performed internally by the engine.$dbw31413$, 1, 4),
  ($dbw31414$tq-dbms-sql-10-constraint-validation-6$dbw31414$, $dbw31415$pt-dbms-sql-10-constraint-validation$dbw31415$,
   $dbw31416$Adding a FOREIGN KEY constraint to a populated child table requires what kind of validation?$dbw31416$,
   $dbw31417$["No validation is needed for foreign keys", "A scan of every child row checking it has a matching row in the parent table", "Only a check that the parent table is not empty", "A check that the child table has fewer rows than the parent"]$dbw31417$::jsonb,
   1, $dbw31418$The engine must confirm every existing child-table row's foreign key value matches an existing parent row (or is NULL); any orphan causes the ADD CONSTRAINT to fail.$dbw31418$, 1, 5),
  ($dbw31419$tq-dbms-sql-10-constraint-validation-7$dbw31419$, $dbw31420$pt-dbms-sql-10-constraint-validation$dbw31420$,
   $dbw31421$What is a real risk of temporarily disabling constraint checking (e.g., MySQL's SET FOREIGN_KEY_CHECKS=0) during a bulk data load?$dbw31421$,
   $dbw31422$["It permanently disables the constraint even after re-enabling", "Bad or inconsistent data can be inserted during the disabled window and may not be caught unless carefully audited afterward", "It automatically drops all indexes on the table", "It converts all constraints to deferred mode permanently"]$dbw31422$::jsonb,
   1, $dbw31423$While checks are off, violating data can be loaded without error; re-enabling checks does not necessarily retroactively re-scan and catch every issue unless the engine/process explicitly re-validates.$dbw31423$, 1, 6),
  ($dbw31424$tq-dbms-sql-10-constraint-validation-8$dbw31424$, $dbw31425$pt-dbms-sql-10-constraint-validation$dbw31425$,
   $dbw31426$Is constraint validation for an ordinary UPDATE statement any different in timing from an INSERT statement, under default (non-deferred) settings?$dbw31426$,
   $dbw31427$["Yes, UPDATE is always checked at COMMIT while INSERT is checked immediately", "No, both INSERT and UPDATE are validated immediately against all applicable constraints at statement execution time by default", "Yes, UPDATE constraints are only checked once per session", "No, UPDATE statements are exempt from CHECK constraints entirely"]$dbw31427$::jsonb,
   1, $dbw31428$Under the default immediate-checking mode used by every constraint type unless explicitly deferred, both INSERT and UPDATE statements are validated at the moment they execute.$dbw31428$, 1, 7)
on conflict (id) do nothing;

-- 10.11 Deferred Constraint Concepts
with g as (select id from public.learning_grids where lower(slug) = $dbw31429$dbms-sql-tutorial$dbw31429$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31430$chapter-10-sql-constraints$dbw31430$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31431$Deferred Constraint Concepts$dbw31431$, $dbw31432$deferred-constraint-concepts$dbw31432$, '', 11, 'published', true, true, $dbw31433$dbms_sql_tutorial$dbw31433$, $dbw31434$chapter-10-sql-constraints/deferred-constraint-concepts$dbw31434$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31435$dbms_sql_tutorial$dbw31435$ and source_ref = $dbw31436$chapter-10-sql-constraints/deferred-constraint-concepts$dbw31436$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31437$Deferred Constraint Concepts$dbw31437$, $dbw31438$### The Default: Immediate Checking

As established in Topic 10.10, every constraint is checked *immediately*, at the moment each individual statement runs, by default. This is fine for the vast majority of applications, but it creates a real problem for certain multi-statement transactions that are only *temporarily* inconsistent partway through, even though they are perfectly consistent by the time the whole transaction commits.

### The Classic Problem: Circular Foreign Keys

```sql
CREATE TABLE employees (
    emp_id      INT PRIMARY KEY,
    dept_id     INT REFERENCES departments(dept_id)
);

CREATE TABLE departments (
    dept_id     INT PRIMARY KEY,
    manager_id  INT REFERENCES employees(emp_id)
);
```

`employees` references `departments`, and `departments` references `employees` — a genuine circular dependency. Inserting the very first department and its first employee is impossible under strict immediate checking: you can't insert the department without a manager who exists yet, and you can't insert that manager (an employee) without a department that exists yet. Something has to be created first, and whichever one goes first will momentarily violate its foreign key.

### PostgreSQL's Solution: DEFERRABLE INITIALLY DEFERRED

```sql
CREATE TABLE departments (
    dept_id     INT PRIMARY KEY,
    manager_id  INT REFERENCES employees(emp_id)
        DEFERRABLE INITIALLY DEFERRED
);
```

A constraint marked `DEFERRABLE INITIALLY DEFERRED` is not checked after each individual statement — it is checked only once, at `COMMIT` time, for the whole transaction. This lets you do:

```sql
BEGIN;
INSERT INTO departments (dept_id, manager_id) VALUES (1, 101);  -- employee 101 doesn't exist yet!
INSERT INTO employees (emp_id, dept_id) VALUES (101, 1);        -- now it does
COMMIT;   -- constraint is checked NOW, and by this point everything is consistent
```

Without the deferred marking, the first `INSERT` would fail immediately, and this transaction would be impossible to express at all in a single pass.

### The Two Deferrable Variants

```sql
... DEFERRABLE INITIALLY IMMEDIATE   -- default check timing, but can be switched to deferred per-transaction with SET CONSTRAINTS
... DEFERRABLE INITIALLY DEFERRED    -- always deferred to COMMIT unless explicitly overridden
```

`DEFERRABLE INITIALLY IMMEDIATE` gives you the normal immediate-checking behavior by default, but still allows a specific transaction to opt into deferred checking on demand:

```sql
SET CONSTRAINTS fk_departments_manager DEFERRED;
```

A plain constraint with neither `DEFERRABLE` keyword is `NOT DEFERRABLE` — it can never be relaxed, which is the default for constraints that don't specify otherwise.

### Portability Note

Deferred constraint checking (`DEFERRABLE INITIALLY DEFERRED`, `SET CONSTRAINTS`) is a genuine PostgreSQL / Oracle / standard-SQL feature, but **MySQL does not support deferrable constraints at all** — the same circular-reference problem in MySQL is typically worked around by temporarily disabling FK checks (`SET FOREIGN_KEY_CHECKS=0`) for the duration of the batch, inserting all rows, then re-enabling — a much cruder tool than true per-transaction deferral.

### Edge Cases

- Deferred constraints still fire — just later. If the data is genuinely inconsistent by `COMMIT` time, the entire transaction is rolled back, exactly as immediate checking would reject a single bad statement.
- Deferred checking applies to `PRIMARY KEY`, `UNIQUE`, `FOREIGN KEY`, and `CHECK` in PostgreSQL, wherever declared deferrable — it is not exclusive to foreign keys, though FK circularity is the textbook motivating example.
- Overusing deferred constraints can hide bugs that immediate checking would have caught early in a long transaction, so it's applied selectively, not as a default posture.

### Key Takeaways / Q&A

**Q: What real-world scenario motivates DEFERRABLE INITIALLY DEFERRED?**
A: Circular foreign key references (or any multi-statement transaction temporarily inconsistent mid-way) that only become valid by the time the transaction commits.

**Q: When is a DEFERRABLE INITIALLY DEFERRED constraint actually checked?**
A: At COMMIT time for the whole transaction, not after each individual statement.

**Q: Does MySQL support DEFERRABLE constraints?**
A: No — MySQL has no deferred-constraint feature; the common workaround is temporarily disabling FK checks with SET FOREIGN_KEY_CHECKS=0.$dbw31438$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31439$dbms_sql_tutorial_seed$dbw31439$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31440$dbms_sql_tutorial_seed$dbw31440$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31441$dbms-sql-tutorial$dbw31441$),
     t as (select id from public.learning_topics where source_kind = $dbw31442$dbms_sql_tutorial$dbw31442$ and source_ref = $dbw31443$chapter-10-sql-constraints/deferred-constraint-concepts$dbw31443$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31444$pt-dbms-sql-10-deferred-constraint-concepts$dbw31444$, $dbw31445$Deferred Constraint Concepts - Quick Test$dbw31445$, 'aptitude', 8, 8,
  $dbw31446$8 questions on Deferred Constraint Concepts.$dbw31446$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31447$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31447$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31448$tq-dbms-sql-10-deferred-constraint-concepts-1$dbw31448$, $dbw31449$pt-dbms-sql-10-deferred-constraint-concepts$dbw31449$,
   $dbw31450$By default (without any DEFERRABLE clause), when is a constraint checked in PostgreSQL?$dbw31450$,
   $dbw31451$["Only at COMMIT time for the whole transaction", "Immediately, after each individual statement", "Only when explicitly requested via SET CONSTRAINTS", "Never, unless the table is queried afterward"]$dbw31451$::jsonb,
   1, $dbw31452$The default behavior for every constraint, unless explicitly declared DEFERRABLE and deferred, is immediate checking right after each statement executes.$dbw31452$, 1, 0),
  ($dbw31453$tq-dbms-sql-10-deferred-constraint-concepts-2$dbw31453$, $dbw31454$pt-dbms-sql-10-deferred-constraint-concepts$dbw31454$,
   $dbw31455$What real-world scenario is the classic motivating example for DEFERRABLE INITIALLY DEFERRED constraints?$dbw31455$,
   $dbw31456$["Improving SELECT query performance", "Circular foreign key references between two tables, where inserting the first row of either table would otherwise violate the other's FK", "Enforcing uniqueness across two different tables", "Making CHECK constraints run faster on large tables"]$dbw31456$::jsonb,
   1, $dbw31457$A mutual foreign key dependency (e.g., employees referencing departments and departments referencing employees) cannot be populated under strict immediate checking without deferring at least one constraint to COMMIT time.$dbw31457$, 1, 1),
  ($dbw31458$tq-dbms-sql-10-deferred-constraint-concepts-3$dbw31458$, $dbw31459$pt-dbms-sql-10-deferred-constraint-concepts$dbw31459$,
   $dbw31460$When is a constraint declared DEFERRABLE INITIALLY DEFERRED actually validated?$dbw31460$,
   $dbw31461$["After every individual INSERT/UPDATE statement, same as immediate constraints", "Once, at COMMIT time, for the entire transaction", "Only when the table is dropped", "Immediately, but only for the first statement in the transaction"]$dbw31461$::jsonb,
   1, $dbw31462$INITIALLY DEFERRED means the constraint check is postponed until the transaction commits, allowing temporary mid-transaction inconsistency.$dbw31462$, 1, 2),
  ($dbw31463$tq-dbms-sql-10-deferred-constraint-concepts-4$dbw31463$, $dbw31464$pt-dbms-sql-10-deferred-constraint-concepts$dbw31464$,
   $dbw31465$Does MySQL support PostgreSQL-style DEFERRABLE INITIALLY DEFERRED constraints?$dbw31465$,
   $dbw31466$["Yes, identically to PostgreSQL", "No, MySQL does not support deferrable constraints; a common workaround is SET FOREIGN_KEY_CHECKS=0", "Yes, but only for UNIQUE constraints", "Yes, but only in MySQL 8.0.16 and later"]$dbw31466$::jsonb,
   1, $dbw31467$MySQL has no true deferred-constraint mechanism; the typical workaround for circular references or bulk loads is temporarily disabling foreign key checks entirely, which is cruder than per-transaction deferral.$dbw31467$, 1, 3),
  ($dbw31468$tq-dbms-sql-10-deferred-constraint-concepts-5$dbw31468$, $dbw31469$pt-dbms-sql-10-deferred-constraint-concepts$dbw31469$,
   $dbw31470$What is the difference between DEFERRABLE INITIALLY IMMEDIATE and DEFERRABLE INITIALLY DEFERRED?$dbw31470$,
   $dbw31471$["There is no functional difference; both always defer to COMMIT", "INITIALLY IMMEDIATE checks right after each statement by default but can be switched to deferred per-transaction with SET CONSTRAINTS; INITIALLY DEFERRED always defers unless overridden", "INITIALLY IMMEDIATE constraints cannot ever be deferred under any circumstance", "INITIALLY DEFERRED only applies to CHECK constraints"]$dbw31471$::jsonb,
   1, $dbw31472$Both variants are deferrable in principle, but they differ in their default timing: IMMEDIATE checks right away unless a transaction opts into SET CONSTRAINTS ... DEFERRED, while DEFERRED checks at commit unless explicitly switched to immediate.$dbw31472$, 1, 4),
  ($dbw31473$tq-dbms-sql-10-deferred-constraint-concepts-6$dbw31473$, $dbw31474$pt-dbms-sql-10-deferred-constraint-concepts$dbw31474$,
   $dbw31475$If data is still genuinely inconsistent at COMMIT time for a transaction using a deferred constraint, what happens?$dbw31475$,
   $dbw31476$["The commit silently succeeds anyway", "The entire transaction is rolled back, just as immediate checking would reject an individual bad statement", "Only the last statement in the transaction is rolled back", "The constraint is automatically dropped"]$dbw31476$::jsonb,
   1, $dbw31477$Deferred constraints still fire eventually — if the data hasn't become consistent by COMMIT time, the whole transaction fails and rolls back.$dbw31477$, 1, 5),
  ($dbw31478$tq-dbms-sql-10-deferred-constraint-concepts-7$dbw31478$, $dbw31479$pt-dbms-sql-10-deferred-constraint-concepts$dbw31479$,
   $dbw31480$Which constraint types can be declared DEFERRABLE in PostgreSQL?$dbw31480$,
   $dbw31481$["Only FOREIGN KEY", "PRIMARY KEY, UNIQUE, FOREIGN KEY, and CHECK, wherever declared deferrable", "Only NOT NULL and CHECK", "Only PRIMARY KEY"]$dbw31481$::jsonb,
   1, $dbw31482$Deferred checking in PostgreSQL is not exclusive to foreign keys; PRIMARY KEY, UNIQUE, FOREIGN KEY, and CHECK can all be declared deferrable, even though FK circularity is the most common motivating example.$dbw31482$, 1, 6),
  ($dbw31483$tq-dbms-sql-10-deferred-constraint-concepts-8$dbw31483$, $dbw31484$pt-dbms-sql-10-deferred-constraint-concepts$dbw31484$,
   $dbw31485$Why should deferred constraints be applied selectively rather than as a default posture across all constraints?$dbw31485$,
   $dbw31486$["Deferred constraints are always slower to evaluate", "Overusing deferred checking can hide bugs that immediate checking would otherwise catch early within a long transaction", "PostgreSQL limits the number of deferred constraints per table", "Deferred constraints cannot be combined with transactions"]$dbw31486$::jsonb,
   1, $dbw31487$Since a violation isn't surfaced until COMMIT, using deferred checking broadly can let inconsistent intermediate states go unnoticed longer than necessary, delaying error discovery.$dbw31487$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 11: DML and Data Modification
-- ---------------------------------------------------------------------------
-- 11.1 INSERT
with g as (select id from public.learning_grids where lower(slug) = $dbw31488$dbms-sql-tutorial$dbw31488$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31489$chapter-11-dml-and-data-modification$dbw31489$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31490$INSERT$dbw31490$, $dbw31491$insert$dbw31491$, '', 1, 'published', true, true, $dbw31492$dbms_sql_tutorial$dbw31492$, $dbw31493$chapter-11-dml-and-data-modification/insert$dbw31493$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31494$dbms_sql_tutorial$dbw31494$ and source_ref = $dbw31495$chapter-11-dml-and-data-modification/insert$dbw31495$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31496$INSERT$dbw31496$, $dbw31497$### Definition

`INSERT` adds a new row to a table. It's the most basic DML statement, and the entry point for all data that ever ends up in a database.

### How It Works

```sql
INSERT INTO employees (id, name, department, salary)
VALUES (9, 'Farah', 'Engineering', 75000);
```

Naming the columns explicitly (`(id, name, department, salary)`) is a best practice: it makes the statement immune to breaking if the table's column order ever changes, and it lets you omit columns that have a `DEFAULT` or allow `NULL`. Omitting the column list (`INSERT INTO employees VALUES (9, 'Farah', 'Engineering', 75000)`) works too, but relies entirely on positional order matching the table's current physical column order — a fragile assumption once a schema evolves.

### Edge Cases and Pitfalls

- Omitting a column that is `NOT NULL` with no `DEFAULT` causes the `INSERT` to fail — this is intentional (see Chapter 10's constraint topics), not a bug to work around.
- Inserting a value that violates a `UNIQUE`, `CHECK`, or `FOREIGN KEY` constraint fails the entire statement — no partial insert happens.
- `INSERT` triggers (Chapter 30) can fire automatically as a side effect, meaning a single `INSERT` might do more than what's visible in the statement itself — worth knowing when debugging unexpected extra behavior.

### Key Takeaways

- `INSERT INTO table (columns) VALUES (values)` adds one new row.
- Naming columns explicitly is safer than relying on positional order.
- Constraint violations reject the whole `INSERT`, not just the offending value.$dbw31497$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31498$dbms_sql_tutorial_seed$dbw31498$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31499$dbms_sql_tutorial_seed$dbw31499$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31500$dbms-sql-tutorial$dbw31500$),
     t as (select id from public.learning_topics where source_kind = $dbw31501$dbms_sql_tutorial$dbw31501$ and source_ref = $dbw31502$chapter-11-dml-and-data-modification/insert$dbw31502$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31503$pt-dbms-sql-11-insert$dbw31503$, $dbw31504$INSERT - Quick Test$dbw31504$, 'aptitude', 8, 8,
  $dbw31505$8 questions on INSERT.$dbw31505$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31506$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31506$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31507$tq-dbms-sql-11-insert-1$dbw31507$, $dbw31508$pt-dbms-sql-11-insert$dbw31508$,
   $dbw31509$What does the INSERT statement do?$dbw31509$,
   $dbw31510$["Modifies existing rows", "Adds a new row to a table", "Removes a row from a table", "Changes a table's structure"]$dbw31510$::jsonb,
   1, $dbw31511$INSERT is specifically for adding new rows.$dbw31511$, 1, 0),
  ($dbw31512$tq-dbms-sql-11-insert-2$dbw31512$, $dbw31513$pt-dbms-sql-11-insert$dbw31513$,
   $dbw31514$Why is explicitly naming columns in INSERT INTO table (columns) VALUES (...) considered best practice?$dbw31514$,
   $dbw31515$["It is required syntax with no alternative", "It makes the statement immune to breaking if the table's column order changes later, and allows omitting columns with defaults", "It makes the INSERT run faster", "Named columns are mandatory for NOT NULL columns only"]$dbw31515$::jsonb,
   1, $dbw31516$Explicit column lists are robust to schema evolution and let you skip columns that don't need a value.$dbw31516$, 1, 1),
  ($dbw31517$tq-dbms-sql-11-insert-3$dbw31517$, $dbw31518$pt-dbms-sql-11-insert$dbw31518$,
   $dbw31519$What happens if you omit a NOT NULL column with no DEFAULT from an INSERT?$dbw31519$,
   $dbw31520$["The column is set to an empty string automatically", "The INSERT fails", "The column is set to zero", "SQL infers a value automatically"]$dbw31520$::jsonb,
   1, $dbw31521$A NOT NULL column with no default requires an explicit value; omitting it fails the insert by design.$dbw31521$, 1, 2),
  ($dbw31522$tq-dbms-sql-11-insert-4$dbw31522$, $dbw31523$pt-dbms-sql-11-insert$dbw31523$,
   $dbw31524$If a single VALUES row violates a UNIQUE constraint, what happens to the rest of that INSERT statement?$dbw31524$,
   $dbw31525$["Only the violating value is skipped; the rest proceeds", "The entire statement fails \u2014 no partial insert happens for that statement", "The constraint is temporarily disabled", "The row is inserted with a NULL instead"]$dbw31525$::jsonb,
   1, $dbw31526$A constraint violation rejects the whole statement it occurred in.$dbw31526$, 1, 3),
  ($dbw31527$tq-dbms-sql-11-insert-5$dbw31527$, $dbw31528$pt-dbms-sql-11-insert$dbw31528$,
   $dbw31529$Is `INSERT INTO employees VALUES (9, 'Farah', 'Engineering', 75000)` (no column list) as robust as naming columns explicitly?$dbw31529$,
   $dbw31530$["Yes, identically robust", "No \u2014 it relies on positional order matching the table's current column order, which can break if the schema changes", "It is more robust because it's shorter", "This syntax is invalid SQL"]$dbw31530$::jsonb,
   1, $dbw31531$Omitting the column list ties the statement to the table's exact current column order — a fragile assumption.$dbw31531$, 1, 4),
  ($dbw31532$tq-dbms-sql-11-insert-6$dbw31532$, $dbw31533$pt-dbms-sql-11-insert$dbw31533$,
   $dbw31534$Can an INSERT trigger additional automatic behavior beyond adding the row?$dbw31534$,
   $dbw31535$["No, INSERT only ever does exactly what's written", "Yes \u2014 an INSERT trigger (Chapter 30) can fire automatically as a side effect", "Only DELETE statements can have triggers", "Triggers only fire on SELECT statements"]$dbw31535$::jsonb,
   1, $dbw31536$Triggers can attach extra automatic behavior to INSERT, UPDATE, or DELETE.$dbw31536$, 1, 5),
  ($dbw31537$tq-dbms-sql-11-insert-7$dbw31537$, $dbw31538$pt-dbms-sql-11-insert$dbw31538$,
   $dbw31539$Which constraint types can cause an INSERT to fail?$dbw31539$,
   $dbw31540$["Only NOT NULL", "UNIQUE, CHECK, FOREIGN KEY, NOT NULL, and PRIMARY KEY constraints can all reject an INSERT that violates them", "Only PRIMARY KEY", "Constraints never affect INSERT, only UPDATE"]$dbw31540$::jsonb,
   1, $dbw31541$Any violated constraint on the table can cause the INSERT to be rejected.$dbw31541$, 1, 6),
  ($dbw31542$tq-dbms-sql-11-insert-8$dbw31542$, $dbw31543$pt-dbms-sql-11-insert$dbw31543$,
   $dbw31544$What is the relationship between INSERT and the rest of DML (UPDATE, DELETE)?$dbw31544$,
   $dbw31545$["INSERT is unrelated to UPDATE/DELETE", "INSERT is the entry point that creates rows which UPDATE and DELETE later modify or remove", "INSERT can only be used after a DELETE", "UPDATE and DELETE must always precede any INSERT"]$dbw31545$::jsonb,
   1, $dbw31546$INSERT creates the data that subsequent UPDATE/DELETE statements act upon.$dbw31546$, 1, 7)
on conflict (id) do nothing;

-- 11.2 Multi Row INSERT
with g as (select id from public.learning_grids where lower(slug) = $dbw31547$dbms-sql-tutorial$dbw31547$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31548$chapter-11-dml-and-data-modification$dbw31548$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31549$Multi Row INSERT$dbw31549$, $dbw31550$multi-row-insert$dbw31550$, '', 2, 'published', true, true, $dbw31551$dbms_sql_tutorial$dbw31551$, $dbw31552$chapter-11-dml-and-data-modification/multi-row-insert$dbw31552$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31553$dbms_sql_tutorial$dbw31553$ and source_ref = $dbw31554$chapter-11-dml-and-data-modification/multi-row-insert$dbw31554$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31555$Multi Row INSERT$dbw31555$, $dbw31556$### Definition

A **multi-row `INSERT`** adds several rows in a single statement, using a comma-separated list of `VALUES` groups, instead of running one `INSERT` per row.

### How It Works

```sql
INSERT INTO employees (id, name, department, salary) VALUES
(10, 'Karan', 'Marketing', 58000),
(11, 'Divya', 'Marketing', 61000),
(12, 'Aman', 'Sales', 54000);
```

This inserts three rows in one round trip to the database, instead of three separate `INSERT` statements. The performance difference is substantial for bulk data: each individual statement carries network round-trip and transaction-log overhead, so batching many rows into fewer statements (or a proper bulk-load mechanism, 11.9) is significantly faster than looping one-row-at-a-time inserts in application code.

### Edge Cases and Pitfalls

- If ANY row in a multi-row `INSERT` violates a constraint, the entire statement fails (in the default, non-batched-error-tolerant mode) — none of the rows are inserted, not just the bad one. This is the same all-or-nothing behavior as a single-row insert, just applied to the whole batch.
- Very large multi-row `INSERT` statements (thousands of rows in one statement) can hit statement-size limits or become unwieldy — a genuine bulk-load tool or `LOAD DATA`/`COPY`-style mechanism (11.9) scales better than an enormous hand-written multi-row `INSERT`.
- All rows in one multi-row `INSERT` must still individually satisfy every constraint — batching doesn't relax or change any validation rules.

### Key Takeaways

- Multi-row INSERT batches several VALUES groups into one statement, reducing round-trip overhead versus one-row-at-a-time inserts.
- It's all-or-nothing: one bad row fails the whole batch, by default.
- For truly large volumes, a dedicated bulk-loading mechanism (11.9) outperforms even a large hand-written multi-row INSERT.$dbw31556$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31557$dbms_sql_tutorial_seed$dbw31557$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31558$dbms_sql_tutorial_seed$dbw31558$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31559$dbms-sql-tutorial$dbw31559$),
     t as (select id from public.learning_topics where source_kind = $dbw31560$dbms_sql_tutorial$dbw31560$ and source_ref = $dbw31561$chapter-11-dml-and-data-modification/multi-row-insert$dbw31561$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31562$pt-dbms-sql-11-multi-row-insert$dbw31562$, $dbw31563$Multi Row INSERT - Quick Test$dbw31563$, 'aptitude', 8, 8,
  $dbw31564$8 questions on Multi Row INSERT.$dbw31564$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31565$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31565$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31566$tq-dbms-sql-11-multi-row-insert-1$dbw31566$, $dbw31567$pt-dbms-sql-11-multi-row-insert$dbw31567$,
   $dbw31568$What does a multi-row INSERT do?$dbw31568$,
   $dbw31569$["Inserts exactly one row per statement, faster than usual", "Inserts several rows in a single statement using comma-separated VALUES groups", "Updates multiple rows at once", "Deletes multiple rows at once"]$dbw31569$::jsonb,
   1, $dbw31570$Multi-row INSERT batches multiple VALUES groups into one statement.$dbw31570$, 1, 0),
  ($dbw31571$tq-dbms-sql-11-multi-row-insert-2$dbw31571$, $dbw31572$pt-dbms-sql-11-multi-row-insert$dbw31572$,
   $dbw31573$Why is a multi-row INSERT generally faster than the same number of single-row INSERT statements?$dbw31573$,
   $dbw31574$["It uses a different, faster storage engine automatically", "It reduces the number of network round trips and per-statement overhead compared to issuing one INSERT per row", "Multi-row INSERT skips constraint checking", "It is not actually faster in any circumstance"]$dbw31574$::jsonb,
   1, $dbw31575$Batching rows into fewer statements cuts down on repeated round-trip and transaction overhead.$dbw31575$, 1, 1),
  ($dbw31576$tq-dbms-sql-11-multi-row-insert-3$dbw31576$, $dbw31577$pt-dbms-sql-11-multi-row-insert$dbw31577$,
   $dbw31578$If one row in a 100-row multi-row INSERT violates a UNIQUE constraint, what happens by default?$dbw31578$,
   $dbw31579$["Only that one row is skipped; the other 99 are inserted", "The entire statement fails and none of the 100 rows are inserted", "The whole table is dropped", "The duplicate value is automatically renamed"]$dbw31579$::jsonb,
   1, $dbw31580$By default, a multi-row INSERT is all-or-nothing, just like a single-row insert.$dbw31580$, 1, 2),
  ($dbw31581$tq-dbms-sql-11-multi-row-insert-4$dbw31581$, $dbw31582$pt-dbms-sql-11-multi-row-insert$dbw31582$,
   $dbw31583$Does batching rows into a multi-row INSERT relax any constraint checks?$dbw31583$,
   $dbw31584$["Yes, batched rows skip CHECK constraints", "No \u2014 every row must still individually satisfy every constraint, exactly as if inserted alone", "Only NOT NULL is skipped for batched rows", "Constraints only apply to the first row in the batch"]$dbw31584$::jsonb,
   1, $dbw31585$Batching is purely a performance/convenience mechanism; validation rules are unchanged.$dbw31585$, 1, 3),
  ($dbw31586$tq-dbms-sql-11-multi-row-insert-5$dbw31586$, $dbw31587$pt-dbms-sql-11-multi-row-insert$dbw31587$,
   $dbw31588$What is a better option than an enormous hand-written multi-row INSERT for truly large data volumes?$dbw31588$,
   $dbw31589$["Multiple small single-row INSERTs are always better", "A dedicated bulk-loading mechanism (like LOAD DATA or COPY, 11.9), which scales more efficiently", "There is no better alternative", "Using only UPDATE statements instead"]$dbw31589$::jsonb,
   1, $dbw31590$Purpose-built bulk-load tools handle very large volumes more efficiently than a giant multi-row INSERT statement.$dbw31590$, 1, 4),
  ($dbw31591$tq-dbms-sql-11-multi-row-insert-6$dbw31591$, $dbw31592$pt-dbms-sql-11-multi-row-insert$dbw31592$,
   $dbw31593$How many INSERT statements does the example inserting Karan, Divya, and Aman in one multi-row INSERT actually execute?$dbw31593$,
   $dbw31594$["Three separate statements", "One statement containing three VALUES groups", "Zero \u2014 multi-row INSERT is not valid SQL", "It depends on the database engine"]$dbw31594$::jsonb,
   1, $dbw31595$It's a single SQL statement with multiple VALUES tuples, not multiple separate statements.$dbw31595$, 1, 5),
  ($dbw31596$tq-dbms-sql-11-multi-row-insert-7$dbw31596$, $dbw31597$pt-dbms-sql-11-multi-row-insert$dbw31597$,
   $dbw31598$What kind of overhead does batching rows into fewer INSERT statements primarily reduce?$dbw31598$,
   $dbw31599$["Disk space usage per row", "Network round-trip and per-statement transaction/logging overhead", "The number of columns per table", "The complexity of the table's schema"]$dbw31599$::jsonb,
   1, $dbw31600$The main savings come from doing less repeated per-statement work, not from changing how each row itself is stored.$dbw31600$, 1, 6),
  ($dbw31601$tq-dbms-sql-11-multi-row-insert-8$dbw31601$, $dbw31602$pt-dbms-sql-11-multi-row-insert$dbw31602$,
   $dbw31603$Is there a practical limit to how many rows a single multi-row INSERT statement should contain?$dbw31603$,
   $dbw31604$["No practical limit ever applies", "Yes \u2014 very large statements can hit size limits or become unwieldy, which is exactly when a dedicated bulk-load mechanism becomes the better tool", "Exactly 10 rows is the universal limit across all engines", "Multi-row INSERT is limited to 2 rows maximum"]$dbw31604$::jsonb,
   1, $dbw31605$Extremely large statements run into practical/engine limits, motivating dedicated bulk-loading tools instead.$dbw31605$, 1, 7)
on conflict (id) do nothing;

-- 11.3 INSERT SELECT
with g as (select id from public.learning_grids where lower(slug) = $dbw31606$dbms-sql-tutorial$dbw31606$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31607$chapter-11-dml-and-data-modification$dbw31607$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31608$INSERT SELECT$dbw31608$, $dbw31609$insert-select$dbw31609$, '', 3, 'published', true, true, $dbw31610$dbms_sql_tutorial$dbw31610$, $dbw31611$chapter-11-dml-and-data-modification/insert-select$dbw31611$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31612$dbms_sql_tutorial$dbw31612$ and source_ref = $dbw31613$chapter-11-dml-and-data-modification/insert-select$dbw31613$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31614$INSERT SELECT$dbw31614$, $dbw31615$### Definition

`INSERT ... SELECT` inserts rows into a table using the RESULT of a `SELECT` query as the source data, instead of a literal `VALUES` list — it's how you copy or derive data from one place in the database into another, entirely in SQL, with no data ever leaving the database.

### How It Works

```sql
INSERT INTO high_performers (id, name, salary)
SELECT id, name, salary
FROM employees
WHERE salary >= 80000;
```

This copies every employee earning at least 80,000 into a separate `high_performers` table, in one statement — no application code loop, no data round-tripping to a client and back. The `SELECT`'s column list and the target table's column list must line up positionally (same count, compatible types), exactly like a `UNION`'s union-compatibility requirement (7.4).

### Edge Cases and Pitfalls

- `INSERT ... SELECT` is far more efficient than reading rows out with a `SELECT`, then looping in application code to `INSERT` them back one at a time — the entire operation stays inside the database engine, avoiding network round trips entirely.
- If the `SELECT` and the target table's columns don't line up in count or type, the statement fails — just like any other column-count mismatch (see Union, 7.4).
- A useful, common pattern: archiving old rows into a history table (`INSERT INTO orders_archive SELECT * FROM orders WHERE created_at < ...`) followed by a `DELETE` of those same rows from the original table — though be careful to run both inside one transaction (11.11) so a failure between the two steps can't leave data duplicated or lost.

### Key Takeaways

- `INSERT ... SELECT` populates a table from a query's result set, entirely inside the database.
- It's dramatically more efficient than a select-then-loop-insert pattern in application code.
- Source and destination column lists must be compatible in count and type, just like Union.$dbw31615$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31616$dbms_sql_tutorial_seed$dbw31616$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31617$dbms_sql_tutorial_seed$dbw31617$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31618$dbms-sql-tutorial$dbw31618$),
     t as (select id from public.learning_topics where source_kind = $dbw31619$dbms_sql_tutorial$dbw31619$ and source_ref = $dbw31620$chapter-11-dml-and-data-modification/insert-select$dbw31620$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31621$pt-dbms-sql-11-insert-select$dbw31621$, $dbw31622$INSERT SELECT - Quick Test$dbw31622$, 'aptitude', 8, 8,
  $dbw31623$8 questions on INSERT SELECT.$dbw31623$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31624$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31624$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31625$tq-dbms-sql-11-insert-select-1$dbw31625$, $dbw31626$pt-dbms-sql-11-insert-select$dbw31626$,
   $dbw31627$What does INSERT ... SELECT do?$dbw31627$,
   $dbw31628$["Deletes rows matching a SELECT query", "Inserts rows using a SELECT query's result as the source data, instead of a literal VALUES list", "Updates rows based on a SELECT query", "Creates a new table from a SELECT query"]$dbw31628$::jsonb,
   1, $dbw31629$INSERT ... SELECT populates a table with rows computed by a SELECT.$dbw31629$, 1, 0),
  ($dbw31630$tq-dbms-sql-11-insert-select-2$dbw31630$, $dbw31631$pt-dbms-sql-11-insert-select$dbw31631$,
   $dbw31632$Why is INSERT ... SELECT more efficient than a select-then-loop-insert pattern in application code?$dbw31632$,
   $dbw31633$["It uses a completely different, faster storage format", "The entire operation happens inside the database engine, avoiding the network round trips of reading rows out and inserting them back one at a time", "It automatically parallelizes across multiple servers", "It skips all constraint checks"]$dbw31633$::jsonb,
   1, $dbw31634$Keeping the whole operation in the database avoids client-server round-trip overhead entirely.$dbw31634$, 1, 1),
  ($dbw31635$tq-dbms-sql-11-insert-select-3$dbw31635$, $dbw31636$pt-dbms-sql-11-insert-select$dbw31636$,
   $dbw31637$What requirement do the SELECT's columns and the target table's columns share?$dbw31637$,
   $dbw31638$["No requirement \u2014 any mismatch is automatically resolved", "They must be compatible in count and type, similar to Union's union-compatibility requirement", "They must have identical column names", "The SELECT must return exactly one row"]$dbw31638$::jsonb,
   1, $dbw31639$Column count and type compatibility between source and destination is required, mirroring Union's rules.$dbw31639$, 1, 2),
  ($dbw31640$tq-dbms-sql-11-insert-select-4$dbw31640$, $dbw31641$pt-dbms-sql-11-insert-select$dbw31641$,
   $dbw31642$In an archive-then-delete pattern (INSERT INTO archive SELECT ...; DELETE FROM original WHERE ...), why should both statements run in one transaction?$dbw31642$,
   $dbw31643$["It's not necessary; either order is always safe", "So a failure between the two steps can't leave data duplicated (if delete fails) or lost (if insert fails but delete somehow ran)", "Because SQL requires it syntactically", "To make the operation run faster"]$dbw31643$::jsonb,
   1, $dbw31644$Wrapping both steps in one transaction ensures they succeed or fail together, preventing an inconsistent partial state.$dbw31644$, 1, 3),
  ($dbw31645$tq-dbms-sql-11-insert-select-5$dbw31645$, $dbw31646$pt-dbms-sql-11-insert-select$dbw31646$,
   $dbw31647$Does INSERT ... SELECT require the source and destination to be different tables?$dbw31647$,
   $dbw31648$["Yes, always", "No \u2014 INSERT ... SELECT can also read and write the same table, subject to engine-specific rules about self-referencing updates", "This operation is not supported by any SQL engine", "It only works between databases, never within one"]$dbw31648$::jsonb,
   1, $dbw31649$While copying between two different tables is the most common case, some engines support self-referencing INSERT SELECT with care.$dbw31649$, 1, 4),
  ($dbw31650$tq-dbms-sql-11-insert-select-6$dbw31650$, $dbw31651$pt-dbms-sql-11-insert-select$dbw31651$,
   $dbw31652$What happens if the SELECT in an INSERT ... SELECT returns a different number of columns than the target table expects?$dbw31652$,
   $dbw31653$["Extra columns are silently ignored", "The statement fails", "Missing columns are filled with random values", "The target table's schema is automatically altered to match"]$dbw31653$::jsonb,
   1, $dbw31654$A column-count mismatch causes the statement to fail, just as with a literal VALUES list.$dbw31654$, 1, 5),
  ($dbw31655$tq-dbms-sql-11-insert-select-7$dbw31655$, $dbw31656$pt-dbms-sql-11-insert-select$dbw31656$,
   $dbw31657$Is INSERT ... SELECT limited to copying rows verbatim, or can it transform data?$dbw31657$,
   $dbw31658$["Only verbatim copying is possible", "The SELECT can compute, filter, aggregate, or otherwise transform data before it's inserted \u2014 it's a full query, not just a copy", "It can only copy a single column at a time", "Transformation requires a separate UPDATE afterward"]$dbw31658$::jsonb,
   1, $dbw31659$Since the source is a full SELECT query, any expression, filter, or aggregation it supports can shape the inserted data.$dbw31659$, 1, 6),
  ($dbw31660$tq-dbms-sql-11-insert-select-8$dbw31660$, $dbw31661$pt-dbms-sql-11-insert-select$dbw31661$,
   $dbw31662$What real-world task is INSERT ... SELECT especially well suited for?$dbw31662$,
   $dbw31663$["Deleting obsolete rows", "Deriving or copying a filtered/transformed subset of data from one table into another, entirely within the database", "Changing a table's column data types", "Renaming a table"]$dbw31663$::jsonb,
   1, $dbw31664$This is exactly the copy/derive-data use case INSERT ... SELECT is designed for.$dbw31664$, 1, 7)
on conflict (id) do nothing;

-- 11.4 UPDATE
with g as (select id from public.learning_grids where lower(slug) = $dbw31665$dbms-sql-tutorial$dbw31665$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31666$chapter-11-dml-and-data-modification$dbw31666$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31667$UPDATE$dbw31667$, $dbw31668$update$dbw31668$, '', 4, 'published', true, true, $dbw31669$dbms_sql_tutorial$dbw31669$, $dbw31670$chapter-11-dml-and-data-modification/update$dbw31670$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31671$dbms_sql_tutorial$dbw31671$ and source_ref = $dbw31672$chapter-11-dml-and-data-modification/update$dbw31672$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31673$UPDATE$dbw31673$, $dbw31674$### Definition

`UPDATE` modifies the values of existing rows in a table, without changing which rows exist. Like `DELETE`, its `WHERE` clause is what makes it targeted instead of total.

### How It Works

```sql
UPDATE employees
SET salary = FLOOR(salary * 1.1)
WHERE department = 'Engineering';
```

This gives every Engineering employee a 10% raise, computed from their OWN current salary — `SET salary = FLOOR(salary * 1.1)` reads each row's existing value before writing the new one, row by row. Multiple columns can be updated in one statement (`SET salary = ..., department = ...`), and every row matching the `WHERE` clause is updated in a single, atomic statement.

### Edge Cases and Pitfalls

- Running `UPDATE` with NO `WHERE` clause updates EVERY row in the table — exactly the same catastrophic-by-omission risk as `DELETE` with no `WHERE` (11.5). Always double-check the `WHERE` clause, or preview affected rows with an equivalent `SELECT` first.
- `SET column = column + 1`-style updates (referencing the column's own current value) are extremely common and work correctly because the RIGHT-hand side is evaluated using each row's existing value before that row's `SET` takes effect.
- An `UPDATE` can fail partway through a large batch if one row's new value violates a constraint (e.g. a `CHECK` or `UNIQUE` constraint) — like `INSERT`, this rolls back the whole statement's effect by default, not just the offending row.

### Key Takeaways

- `UPDATE table SET col = value WHERE condition` modifies matching rows' values in place.
- Omitting `WHERE` updates every row — the single most damaging accidental SQL mistake, shared with `DELETE`.
- `SET col = col + expr` patterns correctly reference each row's own pre-update value.$dbw31674$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31675$dbms_sql_tutorial_seed$dbw31675$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31676$dbms_sql_tutorial_seed$dbw31676$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31677$dbms-sql-tutorial$dbw31677$),
     t as (select id from public.learning_topics where source_kind = $dbw31678$dbms_sql_tutorial$dbw31678$ and source_ref = $dbw31679$chapter-11-dml-and-data-modification/update$dbw31679$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31680$pt-dbms-sql-11-update$dbw31680$, $dbw31681$UPDATE - Quick Test$dbw31681$, 'aptitude', 8, 8,
  $dbw31682$8 questions on UPDATE.$dbw31682$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31683$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31683$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31684$tq-dbms-sql-11-update-1$dbw31684$, $dbw31685$pt-dbms-sql-11-update$dbw31685$,
   $dbw31686$What does UPDATE do?$dbw31686$,
   $dbw31687$["Removes rows from a table", "Modifies the values of existing rows without changing which rows exist", "Adds new rows to a table", "Changes a table's column structure"]$dbw31687$::jsonb,
   1, $dbw31688$UPDATE changes data in place; it doesn't add or remove rows.$dbw31688$, 1, 0),
  ($dbw31689$tq-dbms-sql-11-update-2$dbw31689$, $dbw31690$pt-dbms-sql-11-update$dbw31690$,
   $dbw31691$What happens if you run UPDATE employees SET salary = 0; with no WHERE clause?$dbw31691$,
   $dbw31692$["Nothing happens without a WHERE clause", "Every row's salary is set to 0", "Only the first row is updated", "An error is raised requiring a WHERE clause"]$dbw31692$::jsonb,
   1, $dbw31693$Without WHERE, UPDATE applies to every row — the same catastrophic risk as DELETE with no WHERE.$dbw31693$, 1, 1),
  ($dbw31694$tq-dbms-sql-11-update-3$dbw31694$, $dbw31695$pt-dbms-sql-11-update$dbw31695$,
   $dbw31696$In `SET salary = FLOOR(salary * 1.1)`, which salary value does the right-hand side use?$dbw31696$,
   $dbw31697$["The final salary after all rows are updated", "Each row's own existing (pre-update) salary value", "A fixed constant unrelated to the row", "The average salary across all rows"]$dbw31697$::jsonb,
   1, $dbw31698$The expression is evaluated per-row against that row's current value before the SET takes effect.$dbw31698$, 1, 2),
  ($dbw31699$tq-dbms-sql-11-update-4$dbw31699$, $dbw31700$pt-dbms-sql-11-update$dbw31700$,
   $dbw31701$Can a single UPDATE statement modify multiple columns at once?$dbw31701$,
   $dbw31702$["No, only one column per statement", "Yes \u2014 SET can list multiple column = value assignments separated by commas", "Only if the columns are the same data type", "Multiple columns require multiple separate UPDATE statements"]$dbw31702$::jsonb,
   1, $dbw31703$SET col1 = val1, col2 = val2 updates several columns in one statement.$dbw31703$, 1, 3),
  ($dbw31704$tq-dbms-sql-11-update-5$dbw31704$, $dbw31705$pt-dbms-sql-11-update$dbw31705$,
   $dbw31706$If one row in a batch UPDATE would violate a CHECK constraint, what happens by default?$dbw31706$,
   $dbw31707$["Only that row is skipped; the rest are updated", "The entire UPDATE statement's effect is rolled back, not just the offending row", "The constraint is temporarily disabled for the update", "The row is set to NULL instead"]$dbw31707$::jsonb,
   1, $dbw31708$Like INSERT, a constraint violation rolls back the whole statement by default.$dbw31708$, 1, 4),
  ($dbw31709$tq-dbms-sql-11-update-6$dbw31709$, $dbw31710$pt-dbms-sql-11-update$dbw31710$,
   $dbw31711$What is the recommended safety practice before running an UPDATE with a WHERE clause you're unsure about?$dbw31711$,
   $dbw31712$["Run it directly with no checks", "Preview which rows would be affected with an equivalent SELECT using the same WHERE clause first", "Always omit the WHERE clause to be safe", "Rename the table first"]$dbw31712$::jsonb,
   1, $dbw31713$Checking affected rows with SELECT first is the standard safety practice, matching the same advice given for DELETE.$dbw31713$, 1, 5),
  ($dbw31714$tq-dbms-sql-11-update-7$dbw31714$, $dbw31715$pt-dbms-sql-11-update$dbw31715$,
   $dbw31716$Does UPDATE change which rows exist in a table?$dbw31716$,
   $dbw31717$["Yes, it can add or remove rows", "No \u2014 UPDATE only changes the values within existing rows; it never adds or removes rows", "Only if a trigger fires", "UPDATE always removes the updated rows"]$dbw31717$::jsonb,
   1, $dbw31718$Row count is unaffected by UPDATE — only the data within already-existing rows changes.$dbw31718$, 1, 6),
  ($dbw31719$tq-dbms-sql-11-update-8$dbw31719$, $dbw31720$pt-dbms-sql-11-update$dbw31720$,
   $dbw31721$Why is 'omitting WHERE' considered equally dangerous for UPDATE as for DELETE?$dbw31721$,
   $dbw31722$["It isn't equally dangerous \u2014 UPDATE without WHERE is harmless", "Both silently apply to every row in the table rather than the intended subset, with no warning", "UPDATE without WHERE always fails with an error, unlike DELETE", "Only DELETE has this risk; UPDATE cannot omit WHERE"]$dbw31722$::jsonb,
   1, $dbw31723$Both statements share the exact same 'affects every row without a filter' risk profile.$dbw31723$, 1, 7)
on conflict (id) do nothing;

-- 11.5 DELETE
with g as (select id from public.learning_grids where lower(slug) = $dbw31724$dbms-sql-tutorial$dbw31724$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31725$chapter-11-dml-and-data-modification$dbw31725$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31726$DELETE$dbw31726$, $dbw31727$delete$dbw31727$, '', 5, 'published', true, true, $dbw31728$dbms_sql_tutorial$dbw31728$, $dbw31729$chapter-11-dml-and-data-modification/delete$dbw31729$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31730$dbms_sql_tutorial$dbw31730$ and source_ref = $dbw31731$chapter-11-dml-and-data-modification/delete$dbw31731$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31732$DELETE$dbw31732$, $dbw31733$### Definition

`DELETE` removes existing rows from a table, without changing the table's structure. Its `WHERE` clause is what makes it targeted instead of total — this is the same statement discussed at a high level in Chapter 9's DDL comparison (DROP vs TRUNCATE vs DELETE); this topic focuses on DELETE's own mechanics in depth.

### How It Works

```sql
DELETE FROM employees WHERE salary < 60000;
```

This removes every employee earning less than 60,000, leaving the rest of the table untouched — the table itself, its columns, indexes, and constraints all remain exactly as they were. `DELETE` is fully transactional: it can be wrapped in a transaction and rolled back before commit (11.11), and it fires any `DELETE` triggers (Chapter 30) row by row.

### Edge Cases and Pitfalls

- `DELETE FROM employees;` with no `WHERE` clause removes EVERY row — this is a genuinely common, genuinely damaging real-world mistake, and the exact reason `SELECT`-first previewing is standard practice.
- `DELETE` respects foreign key constraints: deleting a row that's still referenced by a child table (with no cascading action configured) is rejected, not silently allowed to create orphaned references (see 5.11, 5.12).
- For removing ALL rows from a table (no filtering needed), `TRUNCATE TABLE` (9.6) is typically much faster than `DELETE FROM table` with no `WHERE`, since `TRUNCATE` deallocates the whole data structure at once rather than removing rows one-by-one with full transaction logging — but `TRUNCATE` can't be filtered and, on some engines, is less safely rollback-able.

### Key Takeaways

- `DELETE FROM table WHERE condition` removes matching rows; the table structure is untouched.
- DELETE respects foreign key constraints and is fully transactional/rollback-able.
- For unconditionally emptying a whole table, TRUNCATE is typically faster than a WHERE-less DELETE, at the cost of losing per-row filtering and some rollback guarantees.$dbw31733$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31734$dbms_sql_tutorial_seed$dbw31734$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31735$dbms_sql_tutorial_seed$dbw31735$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31736$dbms-sql-tutorial$dbw31736$),
     t as (select id from public.learning_topics where source_kind = $dbw31737$dbms_sql_tutorial$dbw31737$ and source_ref = $dbw31738$chapter-11-dml-and-data-modification/delete$dbw31738$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31739$pt-dbms-sql-11-delete$dbw31739$, $dbw31740$DELETE - Quick Test$dbw31740$, 'aptitude', 8, 8,
  $dbw31741$8 questions on DELETE.$dbw31741$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31742$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31742$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31743$tq-dbms-sql-11-delete-1$dbw31743$, $dbw31744$pt-dbms-sql-11-delete$dbw31744$,
   $dbw31745$What does DELETE do?$dbw31745$,
   $dbw31746$["Removes a table's structure entirely", "Removes rows matching a condition, leaving the table structure intact", "Modifies existing row values", "Adds new rows"]$dbw31746$::jsonb,
   1, $dbw31747$DELETE removes rows only; the table itself (columns, indexes, constraints) remains.$dbw31747$, 1, 0),
  ($dbw31748$tq-dbms-sql-11-delete-2$dbw31748$, $dbw31749$pt-dbms-sql-11-delete$dbw31749$,
   $dbw31750$What happens if a DELETE targets a row still referenced by a child table's foreign key, with no cascading action configured?$dbw31750$,
   $dbw31751$["The delete succeeds and the child row's reference becomes invalid", "The delete is rejected, preventing an orphaned reference", "The child row is automatically deleted too", "The parent row's key is automatically changed"]$dbw31751$::jsonb,
   1, $dbw31752$Referential integrity blocks a delete that would orphan existing child references, absent a cascading action.$dbw31752$, 1, 1),
  ($dbw31753$tq-dbms-sql-11-delete-3$dbw31753$, $dbw31754$pt-dbms-sql-11-delete$dbw31754$,
   $dbw31755$Why is TRUNCATE typically faster than DELETE FROM table with no WHERE, for emptying an entire table?$dbw31755$,
   $dbw31756$["TRUNCATE and DELETE have identical performance in every engine", "TRUNCATE deallocates the whole data structure at once rather than removing rows one by one with full transaction logging", "DELETE always fails on large tables", "TRUNCATE only works on empty tables"]$dbw31756$::jsonb,
   1, $dbw31757$TRUNCATE's bulk deallocation approach avoids the per-row overhead that DELETE incurs.$dbw31757$, 1, 2),
  ($dbw31758$tq-dbms-sql-11-delete-4$dbw31758$, $dbw31759$pt-dbms-sql-11-delete$dbw31759$,
   $dbw31760$Is DELETE fully transactional (can it be rolled back before commit)?$dbw31760$,
   $dbw31761$["No, DELETE is always immediately permanent", "Yes \u2014 DELETE participates fully in transactions and can be rolled back before COMMIT", "Only on NoSQL databases", "Only if no WHERE clause is used"]$dbw31761$::jsonb,
   1, $dbw31762$Unlike DDL on most engines, DELETE (DML) is transactional and reversible before commit.$dbw31762$, 1, 3),
  ($dbw31763$tq-dbms-sql-11-delete-5$dbw31763$, $dbw31764$pt-dbms-sql-11-delete$dbw31764$,
   $dbw31765$What is the safety practice recommended before running a DELETE with an uncertain WHERE clause?$dbw31765$,
   $dbw31766$["Run it directly and check the result afterward", "Preview the affected rows first with an equivalent SELECT using the same WHERE clause", "Always delete without a WHERE clause to be thorough", "Rename the table before deleting"]$dbw31766$::jsonb,
   1, $dbw31767$Previewing with SELECT is the standard, reliable safety practice.$dbw31767$, 1, 4),
  ($dbw31768$tq-dbms-sql-11-delete-6$dbw31768$, $dbw31769$pt-dbms-sql-11-delete$dbw31769$,
   $dbw31770$Does DELETE change a table's column structure?$dbw31770$,
   $dbw31771$["Yes, it can drop columns", "No \u2014 DELETE only removes rows; columns, indexes, and constraints remain unchanged", "Only if CASCADE is specified", "DELETE always resets the table's AUTO_INCREMENT counter"]$dbw31771$::jsonb,
   1, $dbw31772$DELETE is purely a row-removal operation with no effect on the table's structure.$dbw31772$, 1, 5),
  ($dbw31773$tq-dbms-sql-11-delete-7$dbw31773$, $dbw31774$pt-dbms-sql-11-delete$dbw31774$,
   $dbw31775$Can DELETE be filtered to remove only specific rows?$dbw31775$,
   $dbw31776$["No, DELETE always removes every row", "Yes \u2014 a WHERE clause targets DELETE to only the matching rows", "Only TRUNCATE supports filtering", "DELETE can only remove exactly one row at a time"]$dbw31776$::jsonb,
   1, $dbw31777$WHERE is exactly what makes DELETE selective rather than total.$dbw31777$, 1, 6),
  ($dbw31778$tq-dbms-sql-11-delete-8$dbw31778$, $dbw31779$pt-dbms-sql-11-delete$dbw31779$,
   $dbw31780$What trade-off does choosing TRUNCATE over a WHERE-less DELETE involve?$dbw31780$,
   $dbw31781$["No trade-off \u2014 TRUNCATE is strictly better in every way", "TRUNCATE is typically faster for emptying a whole table, but can't be filtered and, on some engines, offers weaker rollback guarantees", "DELETE is always faster than TRUNCATE", "TRUNCATE always requires a WHERE clause, unlike DELETE"]$dbw31781$::jsonb,
   1, $dbw31782$TRUNCATE's speed advantage comes with reduced flexibility (no filtering) and some transactional caveats.$dbw31782$, 1, 7)
on conflict (id) do nothing;

-- 11.6 MERGE Concept
with g as (select id from public.learning_grids where lower(slug) = $dbw31783$dbms-sql-tutorial$dbw31783$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31784$chapter-11-dml-and-data-modification$dbw31784$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31785$MERGE Concept$dbw31785$, $dbw31786$merge-concept$dbw31786$, '', 6, 'published', true, true, $dbw31787$dbms_sql_tutorial$dbw31787$, $dbw31788$chapter-11-dml-and-data-modification/merge-concept$dbw31788$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31789$dbms_sql_tutorial$dbw31789$ and source_ref = $dbw31790$chapter-11-dml-and-data-modification/merge-concept$dbw31790$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31791$MERGE Concept$dbw31791$, $dbw31792$### Definition

`MERGE` (also called "upsert" in dialects that spell it differently — see 11.7) combines `INSERT`, `UPDATE`, and sometimes `DELETE` into a single statement: given a source of incoming rows, it inserts rows that don't yet exist and updates rows that already do, based on a matching condition — all in one atomic operation.

### How It Works

Standard SQL `MERGE` syntax (supported by SQL Server, Oracle, PostgreSQL 15+):

```sql
MERGE INTO employees AS target
USING new_employee_data AS source
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET target.salary = source.salary
WHEN NOT MATCHED THEN
  INSERT (id, name, department, salary) VALUES (source.id, source.name, source.department, source.salary);
```

For each row in `source`, this checks whether a matching `id` already exists in `target`: if it does (`WHEN MATCHED`), update it; if not (`WHEN NOT MATCHED`), insert it. This solves a genuinely common real problem — syncing a target table with a batch of "here's the current state" data, without knowing in advance which rows are new and which already exist.

### Edge Cases and Pitfalls

- Not every dialect supports the standard `MERGE` syntax — MySQL notably does not have `MERGE`, relying instead on `INSERT ... ON DUPLICATE KEY UPDATE` (11.7) to achieve the same upsert effect with different syntax.
- `MERGE` can optionally include a `WHEN NOT MATCHED BY SOURCE` clause (in some dialects) to `DELETE` target rows that no longer appear in the source at all — turning `MERGE` into a full three-way sync (insert new, update changed, delete removed), not just insert-or-update.
- Doing the same logic manually as two separate statements (an `UPDATE` followed by an `INSERT ... WHERE NOT EXISTS`) works but isn't atomic in the same way — a `MERGE` statement is one indivisible operation, reducing the risk of a race condition between the two steps under concurrent access.

### Key Takeaways

- MERGE combines insert-if-absent and update-if-present logic into one atomic statement, matching source rows against target rows on a condition.
- Not every dialect has MERGE — MySQL uses a different syntax (ON DUPLICATE KEY UPDATE, 11.7) for the same concept.
- MERGE can optionally also delete target rows no longer present in the source, for a full sync operation.$dbw31792$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31793$dbms_sql_tutorial_seed$dbw31793$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31794$dbms_sql_tutorial_seed$dbw31794$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31795$dbms-sql-tutorial$dbw31795$),
     t as (select id from public.learning_topics where source_kind = $dbw31796$dbms_sql_tutorial$dbw31796$ and source_ref = $dbw31797$chapter-11-dml-and-data-modification/merge-concept$dbw31797$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31798$pt-dbms-sql-11-merge-concept$dbw31798$, $dbw31799$MERGE Concept - Quick Test$dbw31799$, 'aptitude', 8, 8,
  $dbw31800$8 questions on MERGE Concept.$dbw31800$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31801$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31801$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31802$tq-dbms-sql-11-merge-concept-1$dbw31802$, $dbw31803$pt-dbms-sql-11-merge-concept$dbw31803$,
   $dbw31804$What does the MERGE statement combine into one operation?$dbw31804$,
   $dbw31805$["Only SELECT and INSERT", "INSERT (for new rows) and UPDATE (for existing rows), based on a matching condition, sometimes DELETE too", "Only CREATE and DROP", "Only two SELECT queries"]$dbw31805$::jsonb,
   1, $dbw31806$MERGE's defining feature is combining insert-if-absent and update-if-present logic in one statement.$dbw31806$, 1, 0),
  ($dbw31807$tq-dbms-sql-11-merge-concept-2$dbw31807$, $dbw31808$pt-dbms-sql-11-merge-concept$dbw31808$,
   $dbw31809$What real-world problem does MERGE solve well?$dbw31809$,
   $dbw31810$["Sorting a table's rows", "Syncing a target table with a batch of incoming data, without knowing in advance which rows are new versus already existing", "Renaming a table's columns", "Compressing a table's storage"]$dbw31810$::jsonb,
   1, $dbw31811$MERGE is designed exactly for this 'sync with unknown new-vs-existing' scenario.$dbw31811$, 1, 1),
  ($dbw31812$tq-dbms-sql-11-merge-concept-3$dbw31812$, $dbw31813$pt-dbms-sql-11-merge-concept$dbw31813$,
   $dbw31814$Does MySQL support the standard SQL MERGE statement?$dbw31814$,
   $dbw31815$["Yes, identically to SQL Server and Oracle", "No \u2014 MySQL uses a different syntax, INSERT ... ON DUPLICATE KEY UPDATE, to achieve the same upsert effect", "MySQL has no way to achieve upsert behavior at all", "MySQL requires a stored procedure for any upsert logic"]$dbw31815$::jsonb,
   1, $dbw31816$MySQL's dialect achieves the same concept with different syntax, a good example of the same idea spelled differently across vendors.$dbw31816$, 1, 2),
  ($dbw31817$tq-dbms-sql-11-merge-concept-4$dbw31817$, $dbw31818$pt-dbms-sql-11-merge-concept$dbw31818$,
   $dbw31819$What does a WHEN NOT MATCHED BY SOURCE clause allow MERGE to do (in dialects that support it)?$dbw31819$,
   $dbw31820$["Nothing \u2014 this clause doesn't exist", "Delete target rows that no longer appear in the source at all, turning MERGE into a full three-way sync", "Insert duplicate rows intentionally", "Skip all update logic entirely"]$dbw31820$::jsonb,
   1, $dbw31821$This clause extends MERGE beyond insert-or-update into a full sync that also removes stale target rows.$dbw31821$, 1, 3),
  ($dbw31822$tq-dbms-sql-11-merge-concept-5$dbw31822$, $dbw31823$pt-dbms-sql-11-merge-concept$dbw31823$,
   $dbw31824$Why is a single MERGE statement preferable to manually running a separate UPDATE and INSERT WHERE NOT EXISTS?$dbw31824$,
   $dbw31825$["There is no real difference between the two approaches", "MERGE is one indivisible atomic operation, reducing the risk of a race condition between the two separate steps under concurrent access", "Manual two-statement approaches are always faster", "MERGE cannot be used with WHERE conditions at all"]$dbw31825$::jsonb,
   1, $dbw31826$Atomicity is the key advantage — MERGE avoids the window of inconsistency that two separate statements could introduce.$dbw31826$, 1, 4),
  ($dbw31827$tq-dbms-sql-11-merge-concept-6$dbw31827$, $dbw31828$pt-dbms-sql-11-merge-concept$dbw31828$,
   $dbw31829$In the standard MERGE syntax, what does the ON clause specify?$dbw31829$,
   $dbw31830$["The final sort order of the result", "The condition used to match source rows against target rows (e.g. matching ids)", "A CHECK constraint to validate", "The name of the resulting merged table"]$dbw31830$::jsonb,
   1, $dbw31831$ON defines how source rows are matched to target rows, determining which branch (MATCHED/NOT MATCHED) applies.$dbw31831$, 1, 5),
  ($dbw31832$tq-dbms-sql-11-merge-concept-7$dbw31832$, $dbw31833$pt-dbms-sql-11-merge-concept$dbw31833$,
   $dbw31834$Which SQL dialects natively support the standard MERGE syntax?$dbw31834$,
   $dbw31835$["Only MySQL", "SQL Server, Oracle, and PostgreSQL 15+ among others", "No real database supports MERGE", "Only SQLite"]$dbw31835$::jsonb,
   1, $dbw31836$These are notable examples of engines with native MERGE support, unlike MySQL's different approach.$dbw31836$, 1, 6),
  ($dbw31837$tq-dbms-sql-11-merge-concept-8$dbw31837$, $dbw31838$pt-dbms-sql-11-merge-concept$dbw31838$,
   $dbw31839$Is 'upsert' a different concept from what MERGE achieves, or another name for a closely related idea?$dbw31839$,
   $dbw31840$["Completely different, unrelated concepts", "Upsert is essentially the insert-or-update half of what MERGE can do, often used as informal/dialect-specific terminology for that pattern", "Upsert only refers to deleting rows", "Upsert is a synonym for TRUNCATE"]$dbw31840$::jsonb,
   1, $dbw31841$Upsert (covered further in 11.7) refers to the same insert-or-update idea, often via dialect-specific syntax rather than full MERGE.$dbw31841$, 1, 7)
on conflict (id) do nothing;

-- 11.7 Upsert Patterns
with g as (select id from public.learning_grids where lower(slug) = $dbw31842$dbms-sql-tutorial$dbw31842$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31843$chapter-11-dml-and-data-modification$dbw31843$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31844$Upsert Patterns$dbw31844$, $dbw31845$upsert-patterns$dbw31845$, '', 7, 'published', true, true, $dbw31846$dbms_sql_tutorial$dbw31846$, $dbw31847$chapter-11-dml-and-data-modification/upsert-patterns$dbw31847$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31848$dbms_sql_tutorial$dbw31848$ and source_ref = $dbw31849$chapter-11-dml-and-data-modification/upsert-patterns$dbw31849$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31850$Upsert Patterns$dbw31850$, $dbw31851$### Definition

An **upsert** is the general pattern of "insert this row, or update it if it already exists" — the concept MERGE (11.6) implements in standard SQL, but which most dialects also offer through their own, often more concise, dedicated syntax.

### How It Works

MySQL's dialect-specific spelling:
```sql
INSERT INTO employees (id, name, department, salary)
VALUES (9, 'Farah', 'Engineering', 75000)
ON DUPLICATE KEY UPDATE salary = VALUES(salary);
```

PostgreSQL's dialect-specific spelling:
```sql
INSERT INTO employees (id, name, department, salary)
VALUES (9, 'Farah', 'Engineering', 75000)
ON CONFLICT (id) DO UPDATE SET salary = EXCLUDED.salary;
```

Both achieve the identical upsert outcome as the full `MERGE` statement from 11.6, just with more compact, INSERT-centric syntax, and both rely on a UNIQUE/PRIMARY KEY constraint existing on the conflicting column(s) to detect "this row already exists."

### Edge Cases and Pitfalls

- The exact keyword and syntax for upsert (`ON DUPLICATE KEY UPDATE` vs `ON CONFLICT ... DO UPDATE` vs full `MERGE`) is one of the most dialect-fragmented areas of SQL — code using one dialect's upsert syntax needs real rewriting, not just minor tweaking, to run on another engine.
- Upsert requires a `UNIQUE` or `PRIMARY KEY` constraint on the column(s) being matched — without one, the database has no defined notion of "duplicate" to trigger the update branch, and the statement behaves like a plain `INSERT` (or fails if uniqueness isn't otherwise guaranteed).
- `VALUES(salary)` (MySQL) and `EXCLUDED.salary` (PostgreSQL) both refer to "the value that WOULD have been inserted" — a slightly unusual but necessary way to reference the incoming row's data inside the UPDATE branch of an upsert.

### Key Takeaways

- Upsert = insert-or-update, achievable via full MERGE (11.6) or a dialect-specific shortcut syntax.
- MySQL: `ON DUPLICATE KEY UPDATE`; PostgreSQL: `ON CONFLICT ... DO UPDATE` — genuinely different syntax for the same concept.
- A UNIQUE/PRIMARY KEY constraint on the matched column(s) is required for the database to detect a "duplicate" and trigger the update path.$dbw31851$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31852$dbms_sql_tutorial_seed$dbw31852$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31853$dbms_sql_tutorial_seed$dbw31853$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31854$dbms-sql-tutorial$dbw31854$),
     t as (select id from public.learning_topics where source_kind = $dbw31855$dbms_sql_tutorial$dbw31855$ and source_ref = $dbw31856$chapter-11-dml-and-data-modification/upsert-patterns$dbw31856$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31857$pt-dbms-sql-11-upsert-patterns$dbw31857$, $dbw31858$Upsert Patterns - Quick Test$dbw31858$, 'aptitude', 8, 8,
  $dbw31859$8 questions on Upsert Patterns.$dbw31859$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31860$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31860$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31861$tq-dbms-sql-11-upsert-patterns-1$dbw31861$, $dbw31862$pt-dbms-sql-11-upsert-patterns$dbw31862$,
   $dbw31863$What does 'upsert' mean?$dbw31863$,
   $dbw31864$["Update only, never insert", "Insert a row, or update it if it already exists \u2014 combining both outcomes into one operation", "A synonym for DELETE", "Insert only, never update"]$dbw31864$::jsonb,
   1, $dbw31865$Upsert is the general insert-or-update pattern.$dbw31865$, 1, 0),
  ($dbw31866$tq-dbms-sql-11-upsert-patterns-2$dbw31866$, $dbw31867$pt-dbms-sql-11-upsert-patterns$dbw31867$,
   $dbw31868$Which syntax does MySQL use for upsert?$dbw31868$,
   $dbw31869$["MERGE INTO", "ON DUPLICATE KEY UPDATE", "ON CONFLICT DO UPDATE", "UPSERT INTO"]$dbw31869$::jsonb,
   1, $dbw31870$MySQL's dialect-specific upsert syntax is INSERT ... ON DUPLICATE KEY UPDATE.$dbw31870$, 1, 1),
  ($dbw31871$tq-dbms-sql-11-upsert-patterns-3$dbw31871$, $dbw31872$pt-dbms-sql-11-upsert-patterns$dbw31872$,
   $dbw31873$Which syntax does PostgreSQL use for upsert?$dbw31873$,
   $dbw31874$["ON DUPLICATE KEY UPDATE", "ON CONFLICT (column) DO UPDATE", "MERGE ON DUPLICATE", "REPLACE INTO"]$dbw31874$::jsonb,
   1, $dbw31875$PostgreSQL's upsert syntax is INSERT ... ON CONFLICT ... DO UPDATE.$dbw31875$, 1, 2),
  ($dbw31876$tq-dbms-sql-11-upsert-patterns-4$dbw31876$, $dbw31877$pt-dbms-sql-11-upsert-patterns$dbw31877$,
   $dbw31878$What must exist on the matched column(s) for an upsert to detect a 'duplicate'?$dbw31878$,
   $dbw31879$["A CHECK constraint", "A UNIQUE or PRIMARY KEY constraint", "A DEFAULT value", "A foreign key constraint"]$dbw31879$::jsonb,
   1, $dbw31880$Without a uniqueness constraint, the database has no way to define what counts as a conflicting duplicate.$dbw31880$, 1, 3),
  ($dbw31881$tq-dbms-sql-11-upsert-patterns-5$dbw31881$, $dbw31882$pt-dbms-sql-11-upsert-patterns$dbw31882$,
   $dbw31883$In MySQL's ON DUPLICATE KEY UPDATE, what does VALUES(salary) refer to?$dbw31883$,
   $dbw31884$["The current salary already stored in the table", "The salary value that would have been inserted by this statement", "A random salary value", "The average salary across all rows"]$dbw31884$::jsonb,
   1, $dbw31885$VALUES(column) references the incoming row's value that the INSERT attempted to write.$dbw31885$, 1, 4),
  ($dbw31886$tq-dbms-sql-11-upsert-patterns-6$dbw31886$, $dbw31887$pt-dbms-sql-11-upsert-patterns$dbw31887$,
   $dbw31888$In PostgreSQL's ON CONFLICT ... DO UPDATE, what does EXCLUDED.salary refer to?$dbw31888$,
   $dbw31889$["The row that was excluded from the result entirely", "The value that would have been inserted, analogous to MySQL's VALUES(salary)", "A column that has been dropped from the table", "The previous salary before any update"]$dbw31889$::jsonb,
   1, $dbw31890$EXCLUDED is PostgreSQL's way of referencing the proposed-but-conflicting incoming row's data.$dbw31890$, 1, 5),
  ($dbw31891$tq-dbms-sql-11-upsert-patterns-7$dbw31891$, $dbw31892$pt-dbms-sql-11-upsert-patterns$dbw31892$,
   $dbw31893$Is upsert syntax portable across different SQL dialects with minimal changes?$dbw31893$,
   $dbw31894$["Yes, it's identical everywhere", "No \u2014 this is one of the most dialect-fragmented areas of SQL, requiring real rewriting (not minor tweaks) to port between engines", "Only the keyword capitalization differs", "Upsert is standardized identically in every engine except SQLite"]$dbw31894$::jsonb,
   1, $dbw31895$The genuinely different keywords and clause structures across MySQL/PostgreSQL/standard MERGE make upsert code non-trivial to port.$dbw31895$, 1, 6),
  ($dbw31896$tq-dbms-sql-11-upsert-patterns-8$dbw31896$, $dbw31897$pt-dbms-sql-11-upsert-patterns$dbw31897$,
   $dbw31898$What happens if you attempt an upsert-style INSERT on a table with no UNIQUE/PRIMARY KEY constraint on the relevant column?$dbw31898$,
   $dbw31899$["It always works exactly like a normal upsert", "There's no defined 'duplicate' to detect, so the statement behaves like a plain INSERT (or fails depending on the dialect/exact syntax)", "The database automatically adds the missing constraint", "It silently deletes all existing rows first"]$dbw31899$::jsonb,
   1, $dbw31900$Upsert fundamentally depends on a uniqueness constraint existing to define what a conflicting duplicate even means.$dbw31900$, 1, 7)
on conflict (id) do nothing;

-- 11.8 Safe Updates
with g as (select id from public.learning_grids where lower(slug) = $dbw31901$dbms-sql-tutorial$dbw31901$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31902$chapter-11-dml-and-data-modification$dbw31902$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31903$Safe Updates$dbw31903$, $dbw31904$safe-updates$dbw31904$, '', 8, 'published', true, true, $dbw31905$dbms_sql_tutorial$dbw31905$, $dbw31906$chapter-11-dml-and-data-modification/safe-updates$dbw31906$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31907$dbms_sql_tutorial$dbw31907$ and source_ref = $dbw31908$chapter-11-dml-and-data-modification/safe-updates$dbw31908$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31909$Safe Updates$dbw31909$, $dbw31910$### Definition

**Safe updates** is the practice (and, in some tools, a literal enforced setting) of protecting against accidentally running an `UPDATE` or `DELETE` with no `WHERE` clause, or with a `WHERE` clause that doesn't actually use a key — a deliberate guard against the single most damaging class of everyday SQL mistake.

### How It Works

MySQL Workbench and the `mysql` CLI both offer a **Safe Updates** mode (`SET SQL_SAFE_UPDATES = 1;`) that refuses to execute an `UPDATE`/`DELETE` unless the `WHERE` clause references a key column (or a `LIMIT` is present) — it's a tool-level safety net specifically designed to catch the "forgot the WHERE clause" mistake before it does damage, not a SQL-standard feature.

Beyond tool settings, the broader safe-update DISCIPLINE includes:
1. Write and run the equivalent `SELECT` with the same `WHERE` clause FIRST, to see exactly which rows would be affected.
2. Wrap the actual `UPDATE`/`DELETE` in a transaction (11.11) so it can be rolled back if the affected rows look wrong.
3. On a large or critical table, consider a `LIMIT` combined with `ORDER BY` for a first small test batch before running the full-scale change.

### Edge Cases and Pitfalls

- Safe Updates mode is a client-tool/session setting, not a database-wide guarantee — a different client, script, or connection without that setting enabled has no such protection, so it should be treated as a personal safety habit, not a substitute for careful `WHERE` clauses and code review.
- Some ORMs (object-relational mapping frameworks) generate `UPDATE`/`DELETE` statements automatically from application code; a bug in application logic can produce an unintentionally unfiltered statement that safe-update discipline at the raw-SQL level wouldn't necessarily catch — reviewing generated SQL, not just hand-written SQL, matters too.
- Testing a risky `UPDATE`/`DELETE` inside an explicit transaction that you can inspect and then `ROLLBACK` (instead of committing) before running it "for real" is one of the safest possible ways to verify a statement's effect on production data without any risk.

### Key Takeaways

- Safe Updates is both a specific tool feature (MySQL's SQL_SAFE_UPDATES) and a general discipline for avoiding catastrophic unfiltered UPDATE/DELETE mistakes.
- SELECT-first previewing, wrapping in a rollback-able transaction, and testing with LIMIT are the core practical techniques.
- Tool-level safety settings protect only that specific client/session — they are not a database-wide guarantee.$dbw31910$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31911$dbms_sql_tutorial_seed$dbw31911$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31912$dbms_sql_tutorial_seed$dbw31912$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31913$dbms-sql-tutorial$dbw31913$),
     t as (select id from public.learning_topics where source_kind = $dbw31914$dbms_sql_tutorial$dbw31914$ and source_ref = $dbw31915$chapter-11-dml-and-data-modification/safe-updates$dbw31915$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31916$pt-dbms-sql-11-safe-updates$dbw31916$, $dbw31917$Safe Updates - Quick Test$dbw31917$, 'aptitude', 8, 8,
  $dbw31918$8 questions on Safe Updates.$dbw31918$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31919$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31919$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31920$tq-dbms-sql-11-safe-updates-1$dbw31920$, $dbw31921$pt-dbms-sql-11-safe-updates$dbw31921$,
   $dbw31922$What is the 'Safe Updates' concept primarily protecting against?$dbw31922$,
   $dbw31923$["Slow query performance", "Accidentally running an UPDATE or DELETE with no WHERE clause, or one that doesn't use a key", "Running out of disk space", "Forgetting to create an index"]$dbw31923$::jsonb,
   1, $dbw31924$Safe Updates specifically targets the unfiltered-UPDATE/DELETE mistake class.$dbw31924$, 1, 0),
  ($dbw31925$tq-dbms-sql-11-safe-updates-2$dbw31925$, $dbw31926$pt-dbms-sql-11-safe-updates$dbw31926$,
   $dbw31927$What does MySQL's SQL_SAFE_UPDATES setting do?$dbw31927$,
   $dbw31928$["Automatically backs up the database before every query", "Refuses to run an UPDATE/DELETE unless the WHERE clause references a key column or a LIMIT is present", "Encrypts all UPDATE statements", "Makes UPDATE statements run faster"]$dbw31928$::jsonb,
   1, $dbw31929$It's a tool-level guard specifically against unfiltered or non-key-based UPDATE/DELETE statements.$dbw31929$, 1, 1),
  ($dbw31930$tq-dbms-sql-11-safe-updates-3$dbw31930$, $dbw31931$pt-dbms-sql-11-safe-updates$dbw31931$,
   $dbw31932$Is Safe Updates mode a database-wide guarantee, or a client/session-level setting?$dbw31932$,
   $dbw31933$["A database-wide guarantee protecting every connection", "A client-tool/session-level setting \u2014 other connections without it enabled have no such protection", "A guarantee enforced by the SQL standard itself", "A setting that only affects SELECT statements"]$dbw31933$::jsonb,
   1, $dbw31934$Since it's session/tool-specific, it must be treated as a personal habit, not a systemic safeguard.$dbw31934$, 1, 2),
  ($dbw31935$tq-dbms-sql-11-safe-updates-4$dbw31935$, $dbw31936$pt-dbms-sql-11-safe-updates$dbw31936$,
   $dbw31937$What is a reliable technique for testing a risky UPDATE/DELETE against production data with zero risk?$dbw31937$,
   $dbw31938$["Running it directly with no safeguards", "Running it inside an explicit transaction, inspecting the result, then ROLLBACK instead of COMMIT if anything looks wrong", "Running it twice to double-check", "Disabling all constraints first"]$dbw31938$::jsonb,
   1, $dbw31939$A transaction that you inspect and then roll back lets you verify effects with no permanent risk.$dbw31939$, 1, 3),
  ($dbw31940$tq-dbms-sql-11-safe-updates-5$dbw31940$, $dbw31941$pt-dbms-sql-11-safe-updates$dbw31941$,
   $dbw31942$Why might an ORM-generated UPDATE/DELETE bypass manual safe-update discipline?$dbw31942$,
   $dbw31943$["ORMs never generate UPDATE/DELETE statements", "A bug in application logic could produce an unintentionally unfiltered statement, which wouldn't be caught by discipline applied only to hand-written SQL", "ORMs always add a WHERE clause automatically with no possible bugs", "This scenario cannot happen with modern frameworks"]$dbw31943$::jsonb,
   1, $dbw31944$Generated SQL needs the same scrutiny as hand-written SQL, since application-level bugs can still produce dangerous statements.$dbw31944$, 1, 4),
  ($dbw31945$tq-dbms-sql-11-safe-updates-6$dbw31945$, $dbw31946$pt-dbms-sql-11-safe-updates$dbw31946$,
   $dbw31947$What is the value of running an equivalent SELECT before a risky UPDATE/DELETE?$dbw31947$,
   $dbw31948$["It has no real value", "It shows exactly which rows would be affected, before any data is actually changed", "It automatically fixes any WHERE clause mistakes", "It permanently locks the affected rows"]$dbw31948$::jsonb,
   1, $dbw31949$Previewing affected rows is one of the most effective, low-cost safety checks available.$dbw31949$, 1, 5),
  ($dbw31950$tq-dbms-sql-11-safe-updates-7$dbw31950$, $dbw31951$pt-dbms-sql-11-safe-updates$dbw31951$,
   $dbw31952$What role does LIMIT + ORDER BY play in a safe-update testing strategy?$dbw31952$,
   $dbw31953$["It has no role in safety testing", "Running a first small, ordered test batch before the full-scale change limits the blast radius while validating the approach", "LIMIT prevents any rows from being affected at all", "ORDER BY is required syntax for every UPDATE"]$dbw31953$::jsonb,
   1, $dbw31954$Testing on a small, controlled batch first is a practical risk-reduction technique for large or critical changes.$dbw31954$, 1, 6),
  ($dbw31955$tq-dbms-sql-11-safe-updates-8$dbw31955$, $dbw31956$pt-dbms-sql-11-safe-updates$dbw31956$,
   $dbw31957$Is enabling a tool's safe-update setting a substitute for careful WHERE clauses and code review?$dbw31957$,
   $dbw31958$["Yes, it fully replaces the need for careful review", "No \u2014 it's a helpful safety net, but careful WHERE clauses and review remain necessary, especially since the setting is session-specific", "It replaces the need for transactions", "It automatically writes correct WHERE clauses for you"]$dbw31958$::jsonb,
   1, $dbw31959$Tool settings are a backstop, not a replacement for the underlying discipline of careful, reviewed SQL.$dbw31959$, 1, 7)
on conflict (id) do nothing;

-- 11.9 Bulk Loading
with g as (select id from public.learning_grids where lower(slug) = $dbw31960$dbms-sql-tutorial$dbw31960$),
     s as (select id from public.learning_sections where lower(slug) = $dbw31961$chapter-11-dml-and-data-modification$dbw31961$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw31962$Bulk Loading$dbw31962$, $dbw31963$bulk-loading$dbw31963$, '', 9, 'published', true, true, $dbw31964$dbms_sql_tutorial$dbw31964$, $dbw31965$chapter-11-dml-and-data-modification/bulk-loading$dbw31965$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw31966$dbms_sql_tutorial$dbw31966$ and source_ref = $dbw31967$chapter-11-dml-and-data-modification/bulk-loading$dbw31967$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw31968$Bulk Loading$dbw31968$, $dbw31969$### Definition

**Bulk loading** is the practice of inserting very large volumes of data (thousands to billions of rows) using a mechanism specifically optimized for that purpose, rather than ordinary row-by-row or even large multi-row `INSERT` statements.

### How It Works

Dedicated bulk-load mechanisms bypass much of the normal per-row overhead of individual `INSERT` statements:

- MySQL: `LOAD DATA INFILE '/path/to/file.csv' INTO TABLE employees FIELDS TERMINATED BY ',';`
- PostgreSQL: `COPY employees FROM '/path/to/file.csv' WITH (FORMAT csv);`
- Most engines also offer a way to temporarily disable non-essential overhead during a bulk load — e.g. dropping/disabling indexes and re-creating them afterward, since maintaining an index on every single row insert is far more expensive than building it once at the end for a huge batch.

The performance difference over row-by-row `INSERT` (even in application-code loops) can be enormous — often one or two orders of magnitude faster for large datasets, because bulk-load paths skip most of the per-statement overhead (parsing, transaction log entries, round trips) that accumulates when repeated millions of times.

### Edge Cases and Pitfalls

- Bulk loading typically does LESS per-row validation than a normal `INSERT` by default in some configurations (for speed) — this trades some safety for performance, so validating data quality BEFORE the load (or immediately after, with a dedicated check query) matters more than with ordinary `INSERT`.
- Disabling/dropping indexes during a bulk load genuinely helps performance, but the table has NO working indexes (beyond the primary key, on some engines) for the duration of the load — this is generally fine for an offline/maintenance-window load, but risky for a table serving live production reads at the same time.
- A bulk load that fails partway through (a malformed row, a disk-full condition) can leave the table in a genuinely inconsistent partial state on some engines/configurations — checking whether the bulk-load mechanism you're using is fully transactional (all-or-nothing) or not is worth confirming before relying on it for critical data.

### Key Takeaways

- Bulk loading (LOAD DATA INFILE, COPY, or equivalent) is dramatically faster than row-by-row or even large multi-row INSERT for genuinely large datasets.
- Temporarily dropping non-essential indexes during a bulk load, then rebuilding them, is a common further optimization.
- Bulk-load mechanisms may validate less and may not always be as atomically all-or-nothing as ordinary DML — confirm the guarantees before trusting it with critical data.$dbw31969$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw31970$dbms_sql_tutorial_seed$dbw31970$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw31971$dbms_sql_tutorial_seed$dbw31971$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw31972$dbms-sql-tutorial$dbw31972$),
     t as (select id from public.learning_topics where source_kind = $dbw31973$dbms_sql_tutorial$dbw31973$ and source_ref = $dbw31974$chapter-11-dml-and-data-modification/bulk-loading$dbw31974$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw31975$pt-dbms-sql-11-bulk-loading$dbw31975$, $dbw31976$Bulk Loading - Quick Test$dbw31976$, 'aptitude', 8, 8,
  $dbw31977$8 questions on Bulk Loading.$dbw31977$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw31978$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw31978$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw31979$tq-dbms-sql-11-bulk-loading-1$dbw31979$, $dbw31980$pt-dbms-sql-11-bulk-loading$dbw31980$,
   $dbw31981$What is bulk loading?$dbw31981$,
   $dbw31982$["Loading exactly one row at a time for safety", "A mechanism specifically optimized for inserting very large volumes of data, bypassing much of ordinary per-row INSERT overhead", "A synonym for a multi-row INSERT statement", "A way to delete large amounts of data quickly"]$dbw31982$::jsonb,
   1, $dbw31983$Bulk loading is purpose-built for large-scale data insertion, distinct from ordinary INSERT mechanisms.$dbw31983$, 1, 0),
  ($dbw31984$tq-dbms-sql-11-bulk-loading-2$dbw31984$, $dbw31985$pt-dbms-sql-11-bulk-loading$dbw31985$,
   $dbw31986$Which MySQL statement is specifically designed for bulk loading from a file?$dbw31986$,
   $dbw31987$["INSERT INTO ... VALUES", "LOAD DATA INFILE", "UPDATE ... SET", "MERGE INTO"]$dbw31987$::jsonb,
   1, $dbw31988$LOAD DATA INFILE is MySQL's dedicated bulk-load mechanism.$dbw31988$, 1, 1),
  ($dbw31989$tq-dbms-sql-11-bulk-loading-3$dbw31989$, $dbw31990$pt-dbms-sql-11-bulk-loading$dbw31990$,
   $dbw31991$Which PostgreSQL command is the equivalent bulk-load mechanism?$dbw31991$,
   $dbw31992$["COPY", "MERGE", "UPSERT", "BULK INSERT"]$dbw31992$::jsonb,
   0, $dbw31993$PostgreSQL's COPY command is its dedicated bulk data loading mechanism.$dbw31993$, 1, 2),
  ($dbw31994$tq-dbms-sql-11-bulk-loading-4$dbw31994$, $dbw31995$pt-dbms-sql-11-bulk-loading$dbw31995$,
   $dbw31996$Why does temporarily dropping indexes before a large bulk load, then rebuilding them afterward, improve performance?$dbw31996$,
   $dbw31997$["Indexes have no effect on insert performance", "Maintaining an index on every single row insert is far more expensive than building the index once after all data has loaded", "Dropping indexes is required by SQL syntax for bulk loads", "This technique never actually improves performance"]$dbw31997$::jsonb,
   1, $dbw31998$Incremental index maintenance during millions of inserts is much costlier than one bulk index build at the end.$dbw31998$, 1, 3),
  ($dbw31999$tq-dbms-sql-11-bulk-loading-5$dbw31999$, $dbw32000$pt-dbms-sql-11-bulk-loading$dbw32000$,
   $dbw32001$What is a real risk of bulk loading compared to ordinary INSERT?$dbw32001$,
   $dbw32002$["There is no risk difference whatsoever", "Bulk loading may perform less per-row validation by default, and may not always be as atomically all-or-nothing on every engine/configuration", "Bulk loading always corrupts the entire database", "Bulk loading cannot be used with any table that has constraints"]$dbw32002$::jsonb,
   1, $dbw32003$Speed optimizations in bulk-load paths can trade off some of the validation/atomicity guarantees ordinary INSERT provides.$dbw32003$, 1, 4),
  ($dbw32004$tq-dbms-sql-11-bulk-loading-6$dbw32004$, $dbw32005$pt-dbms-sql-11-bulk-loading$dbw32005$,
   $dbw32006$Why might disabling indexes during a bulk load be risky for a table serving live production reads at the same time?$dbw32006$,
   $dbw32007$["It's never risky under any circumstances", "The table has no working indexes (beyond possibly the primary key) for the load's duration, which can badly degrade concurrent read performance", "Disabling indexes automatically locks the table from all access", "Read queries always fail outright without indexes"]$dbw32007$::jsonb,
   1, $dbw32008$Concurrent reads relying on those indexes would suffer significantly slower query performance during the load.$dbw32008$, 1, 5),
  ($dbw32009$tq-dbms-sql-11-bulk-loading-7$dbw32009$, $dbw32010$pt-dbms-sql-11-bulk-loading$dbw32010$,
   $dbw32011$Roughly how much faster can bulk loading be compared to row-by-row INSERT for large datasets?$dbw32011$,
   $dbw32012$["No meaningful difference", "Often one or two orders of magnitude faster, due to skipping most per-statement overhead", "Bulk loading is usually slower", "Exactly twice as fast, always"]$dbw32012$::jsonb,
   1, $dbw32013$The overhead savings compound dramatically at scale, often yielding a very large speedup.$dbw32013$, 1, 6),
  ($dbw32014$tq-dbms-sql-11-bulk-loading-8$dbw32014$, $dbw32015$pt-dbms-sql-11-bulk-loading$dbw32015$,
   $dbw32016$What should you confirm before relying on a bulk-load mechanism for critical data?$dbw32016$,
   $dbw32017$["Nothing needs to be confirmed; all bulk-load tools behave identically", "Whether the specific mechanism is fully transactional (all-or-nothing) or can leave a partial, inconsistent state on failure", "That the file being loaded is under 1MB", "That no indexes exist on the table at all, permanently"]$dbw32017$::jsonb,
   1, $dbw32018$Atomicity guarantees vary by tool/engine/configuration, so this is worth verifying explicitly for critical data.$dbw32018$, 1, 7)
on conflict (id) do nothing;

-- 11.10 Data Validation
with g as (select id from public.learning_grids where lower(slug) = $dbw32019$dbms-sql-tutorial$dbw32019$),
     s as (select id from public.learning_sections where lower(slug) = $dbw32020$chapter-11-dml-and-data-modification$dbw32020$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw32021$Data Validation$dbw32021$, $dbw32022$data-validation$dbw32022$, '', 10, 'published', true, true, $dbw32023$dbms_sql_tutorial$dbw32023$, $dbw32024$chapter-11-dml-and-data-modification/data-validation$dbw32024$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw32025$dbms_sql_tutorial$dbw32025$ and source_ref = $dbw32026$chapter-11-dml-and-data-modification/data-validation$dbw32026$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw32027$Data Validation$dbw32027$, $dbw32028$### Definition

**Data validation** in the context of DML is the practice of ensuring data is correct and consistent BEFORE (or as part of) inserting/updating it — through a combination of database-level constraints (Chapter 10) and deliberate checks in the modification process itself.

### How It Works

Validation happens at several layers, each catching different kinds of problems:
1. **Database constraints** (`NOT NULL`, `CHECK`, `FOREIGN KEY`, `UNIQUE`) — the strongest layer, enforced by the engine itself regardless of which application or script writes the data.
2. **Application-level validation** — business logic checks before ever sending SQL to the database (e.g. validating an email format, checking a business rule that spans multiple unrelated tables that a single `CHECK` constraint can't express).
3. **Post-modification verification queries** — running a `SELECT`/`COUNT` after a bulk change to confirm the expected number of rows were affected, or that no unexpected `NULL`s or out-of-range values appeared.

```sql
-- Post-load sanity check: are there any salaries that snuck in as non-positive?
SELECT COUNT(*) FROM employees WHERE salary <= 0;
```

### Edge Cases and Pitfalls

- Relying ONLY on application-level validation (skipping database constraints entirely) is risky: any future script, migration, admin tool, or bug that writes to the table directly bypasses application logic entirely, and only database-level constraints protect against that.
- Relying ONLY on database constraints without any application-level validation can produce a poor user experience — a raw constraint-violation error is often far less helpful to an end user than a clear, specific application-level validation message shown before the data is even submitted.
- Data imported from an external, untrusted, or historically-inconsistent source (bulk loads, legacy system migrations) especially benefits from explicit post-load verification queries, since bulk-load paths (11.9) can validate less strictly by default.

### Key Takeaways

- Data validation is layered: database constraints (strongest, universal), application-level checks (best user experience), and post-modification verification queries (catches what slipped through).
- Skipping database-level constraints in favor of application-only validation leaves data vulnerable to any future direct-write path.
- Bulk-loaded or migrated data specifically benefits from explicit post-load sanity-check queries.$dbw32028$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw32029$dbms_sql_tutorial_seed$dbw32029$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw32030$dbms_sql_tutorial_seed$dbw32030$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw32031$dbms-sql-tutorial$dbw32031$),
     t as (select id from public.learning_topics where source_kind = $dbw32032$dbms_sql_tutorial$dbw32032$ and source_ref = $dbw32033$chapter-11-dml-and-data-modification/data-validation$dbw32033$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw32034$pt-dbms-sql-11-data-validation$dbw32034$, $dbw32035$Data Validation - Quick Test$dbw32035$, 'aptitude', 8, 8,
  $dbw32036$8 questions on Data Validation.$dbw32036$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw32037$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw32037$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw32038$tq-dbms-sql-11-data-validation-1$dbw32038$, $dbw32039$pt-dbms-sql-11-data-validation$dbw32039$,
   $dbw32040$What is the strongest layer of data validation, enforced regardless of which application writes the data?$dbw32040$,
   $dbw32041$["Application-level form validation", "Database-level constraints (NOT NULL, CHECK, FOREIGN KEY, UNIQUE)", "Post-modification verification queries", "Code comments describing the expected data shape"]$dbw32041$::jsonb,
   1, $dbw32042$Database constraints are enforced by the engine itself, regardless of which script or app writes to the table.$dbw32042$, 1, 0),
  ($dbw32043$tq-dbms-sql-11-data-validation-2$dbw32043$, $dbw32044$pt-dbms-sql-11-data-validation$dbw32044$,
   $dbw32045$Why is relying only on application-level validation, with no database constraints, risky?$dbw32045$,
   $dbw32046$["It's not risky at all", "Any future script, migration, or admin tool that writes directly to the database bypasses application logic entirely, leaving no protection", "Application validation is always slower than database constraints", "Database constraints are deprecated in modern SQL"]$dbw32046$::jsonb,
   1, $dbw32047$Only database-level enforcement protects against writes that don't go through the application layer.$dbw32047$, 1, 1),
  ($dbw32048$tq-dbms-sql-11-data-validation-3$dbw32048$, $dbw32049$pt-dbms-sql-11-data-validation$dbw32049$,
   $dbw32050$Why might relying only on database constraints, without any application-level validation, hurt user experience?$dbw32050$,
   $dbw32051$["It never affects user experience", "A raw constraint-violation error is often less helpful to an end user than a clear, specific validation message shown before submission", "Database constraints are always instant, unlike application checks", "Constraints cannot produce any error message at all"]$dbw32051$::jsonb,
   1, $dbw32052$Application-level validation can give friendlier, more specific feedback before ever reaching the database.$dbw32052$, 1, 2),
  ($dbw32053$tq-dbms-sql-11-data-validation-4$dbw32053$, $dbw32054$pt-dbms-sql-11-data-validation$dbw32054$,
   $dbw32055$What is a post-modification verification query useful for?$dbw32055$,
   $dbw32056$["Replacing the need for any database constraints", "Confirming, after a bulk change, that the expected number of rows were affected and no unexpected bad values appeared", "Making an UPDATE statement run faster", "Automatically fixing bad data"]$dbw32056$::jsonb,
   1, $dbw32057$A sanity-check query after a large change catches problems that might have slipped past other validation layers.$dbw32057$, 1, 3),
  ($dbw32058$tq-dbms-sql-11-data-validation-5$dbw32058$, $dbw32059$pt-dbms-sql-11-data-validation$dbw32059$,
   $dbw32060$Why does bulk-loaded or migrated data especially benefit from explicit post-load verification queries?$dbw32060$,
   $dbw32061$["Bulk-loaded data is always perfectly clean by definition", "Bulk-load paths can validate less strictly by default (for performance), making it more likely that bad data slips through unnoticed", "Verification queries are required by SQL syntax for bulk loads", "Migrated data cannot be queried at all"]$dbw32061$::jsonb,
   1, $dbw32062$Since bulk-load mechanisms may trade off some validation for speed, explicit follow-up checks matter more.$dbw32062$, 1, 4),
  ($dbw32063$tq-dbms-sql-11-data-validation-6$dbw32063$, $dbw32064$pt-dbms-sql-11-data-validation$dbw32064$,
   $dbw32065$Which validation layer would catch a business rule spanning multiple unrelated tables that a single CHECK constraint can't express?$dbw32065$,
   $dbw32066$["Only a PRIMARY KEY constraint", "Application-level validation logic, since some cross-table business rules exceed what a single-row CHECK can express", "Only a UNIQUE constraint", "This kind of rule can never be validated anywhere"]$dbw32066$::jsonb,
   1, $dbw32067$Complex, multi-table business logic often needs application-level (or trigger-based) enforcement beyond a simple CHECK.$dbw32067$, 1, 5),
  ($dbw32068$tq-dbms-sql-11-data-validation-7$dbw32068$, $dbw32069$pt-dbms-sql-11-data-validation$dbw32069$,
   $dbw32070$What is the recommended overall approach to data validation, according to this topic?$dbw32070$,
   $dbw32071$["Pick exactly one layer and rely on it exclusively", "A layered combination: strong database constraints, application-level checks for good UX, and post-modification verification for what slips through", "Validation is unnecessary if the schema was designed correctly once", "Only validate data once, at initial table creation"]$dbw32071$::jsonb,
   1, $dbw32072$The layered approach captures the strengths of each validation mechanism.$dbw32072$, 1, 6),
  ($dbw32073$tq-dbms-sql-11-data-validation-8$dbw32073$, $dbw32074$pt-dbms-sql-11-data-validation$dbw32074$,
   $dbw32075$Does having database constraints eliminate the value of application-level validation entirely?$dbw32075$,
   $dbw32076$["Yes, constraints alone are always sufficient", "No \u2014 application-level validation still improves user experience and can express rules constraints can't, even though constraints are the stronger safety net", "Application-level validation is illegal once constraints exist", "Constraints replace the need for any testing"]$dbw32076$::jsonb,
   1, $dbw32077$The two layers serve complementary purposes rather than being redundant with each other.$dbw32077$, 1, 7)
on conflict (id) do nothing;

-- 11.11 Data Modification Transactions
with g as (select id from public.learning_grids where lower(slug) = $dbw32078$dbms-sql-tutorial$dbw32078$),
     s as (select id from public.learning_sections where lower(slug) = $dbw32079$chapter-11-dml-and-data-modification$dbw32079$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbw32080$Data Modification Transactions$dbw32080$, $dbw32081$data-modification-transactions$dbw32081$, '', 11, 'published', true, true, $dbw32082$dbms_sql_tutorial$dbw32082$, $dbw32083$chapter-11-dml-and-data-modification/data-modification-transactions$dbw32083$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbw32084$dbms_sql_tutorial$dbw32084$ and source_ref = $dbw32085$chapter-11-dml-and-data-modification/data-modification-transactions$dbw32085$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbw32086$Data Modification Transactions$dbw32086$, $dbw32087$### Definition

Wrapping DML statements (`INSERT`/`UPDATE`/`DELETE`) in an explicit **transaction** ensures a group of related changes succeed or fail TOGETHER — this ties directly back to TCL (Chapter 8.14: `BEGIN`/`COMMIT`/`ROLLBACK`), applied specifically to real-world data-modification scenarios.

### How It Works

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 500 WHERE id = 1;
  UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;
```

If the second `UPDATE` failed for any reason (a constraint violation, a crash) after the first succeeded, without a transaction the first `UPDATE` would already be permanently applied — money debited from account 1 with nothing credited to account 2. Wrapping both in one transaction guarantees they succeed or fail as a single unit: `COMMIT` only happens if both succeeded; otherwise the whole thing can be `ROLLBACK`-ed, leaving neither change applied.

### Edge Cases and Pitfalls

- Any multi-statement DML sequence where the statements depend on each other for correctness (archive-then-delete from 11.3, transfer-between-accounts above, insert-parent-then-insert-children) should be wrapped in a transaction — treating each statement as independently "fine on its own" ignores the real risk of a partial failure between them.
- Most database clients/drivers default to **auto-commit mode**, where each individual statement commits on its own — an explicit `BEGIN`/`START TRANSACTION` is what turns several statements into one atomic unit instead of independent ones (as covered in 8.14).
- A transaction that's opened but left uncommitted for a long time (while application code does slow, unrelated work in between statements) can hold locks and block other users' work — good practice is to keep transactions as SHORT as possible: open it right before the related statements, commit immediately after, and avoid doing slow unrelated work (like a network call) in the middle.

### Key Takeaways

- Wrapping related INSERT/UPDATE/DELETE statements in a transaction guarantees they succeed or fail together — critical for any multi-statement change where partial completion would be wrong.
- Auto-commit is the default in most clients; explicit BEGIN/COMMIT is what creates a genuine multi-statement atomic unit.
- Keep transactions short — a long-held open transaction can block other work via held locks.$dbw32087$, 'markdown', 0, 'published', jsonb_build_object('source', $dbw32088$dbms_sql_tutorial_seed$dbw32088$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbw32089$dbms_sql_tutorial_seed$dbw32089$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbw32090$dbms-sql-tutorial$dbw32090$),
     t as (select id from public.learning_topics where source_kind = $dbw32091$dbms_sql_tutorial$dbw32091$ and source_ref = $dbw32092$chapter-11-dml-and-data-modification/data-modification-transactions$dbw32092$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbw32093$pt-dbms-sql-11-data-modification-transactions$dbw32093$, $dbw32094$Data Modification Transactions - Quick Test$dbw32094$, 'aptitude', 8, 8,
  $dbw32095$8 questions on Data Modification Transactions.$dbw32095$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbw32096$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbw32096$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbw32097$tq-dbms-sql-11-data-modification-transactions-1$dbw32097$, $dbw32098$pt-dbms-sql-11-data-modification-transactions$dbw32098$,
   $dbw32099$What guarantee does wrapping multiple DML statements in a transaction provide?$dbw32099$,
   $dbw32100$["The statements will run faster", "The statements succeed or fail together as a single atomic unit", "The statements are automatically validated for correctness", "The statements will run in a random order"]$dbw32100$::jsonb,
   1, $dbw32101$Atomicity — all-or-nothing — is exactly what a transaction guarantees for its contained statements.$dbw32101$, 1, 0),
  ($dbw32102$tq-dbms-sql-11-data-modification-transactions-2$dbw32102$, $dbw32103$pt-dbms-sql-11-data-modification-transactions$dbw32103$,
   $dbw32104$In the classic bank-transfer example, why must the debit and credit UPDATEs be in one transaction?$dbw32104$,
   $dbw32105$["To make the two UPDATEs run in parallel", "So that if only one UPDATE succeeds, the whole operation can be rolled back instead of leaving money debited from one account with nothing credited to the other", "Transactions are required syntax for any UPDATE", "To avoid needing a WHERE clause on either UPDATE"]$dbw32105$::jsonb,
   1, $dbw32106$This is the canonical illustration of why atomicity matters for related data changes.$dbw32106$, 1, 1),
  ($dbw32107$tq-dbms-sql-11-data-modification-transactions-3$dbw32107$, $dbw32108$pt-dbms-sql-11-data-modification-transactions$dbw32108$,
   $dbw32109$What is 'auto-commit mode'?$dbw32109$,
   $dbw32110$["A mode where transactions never commit", "The common default where each individual statement is implicitly committed on its own, unless an explicit transaction is started", "A mode exclusive to read-only queries", "A deprecated legacy feature no longer used"]$dbw32110$::jsonb,
   1, $dbw32111$Auto-commit means each statement stands alone as its own transaction by default.$dbw32111$, 1, 2),
  ($dbw32112$tq-dbms-sql-11-data-modification-transactions-4$dbw32112$, $dbw32113$pt-dbms-sql-11-data-modification-transactions$dbw32113$,
   $dbw32114$Why should transactions generally be kept as short as possible?$dbw32114$,
   $dbw32115$["Short transactions are required by the SQL standard", "A long-held open transaction can hold locks and block other users' work for as long as it stays open", "Long transactions always fail automatically after a timeout", "Transaction length has no practical effect on other users"]$dbw32115$::jsonb,
   1, $dbw32116$Held locks from an open transaction can block concurrent work regardless of whether the transaction is actively doing anything.$dbw32116$, 1, 3),
  ($dbw32117$tq-dbms-sql-11-data-modification-transactions-5$dbw32117$, $dbw32118$pt-dbms-sql-11-data-modification-transactions$dbw32118$,
   $dbw32119$Should an archive-then-delete DML sequence (INSERT INTO archive SELECT ...; DELETE FROM original ...) be wrapped in a transaction?$dbw32119$,
   $dbw32120$["No, each statement is independently safe", "Yes \u2014 a failure between the two steps could otherwise leave data duplicated or lost, exactly the kind of multi-statement dependency transactions protect against", "Only if the tables are very large", "Transactions cannot wrap an INSERT and a DELETE together"]$dbw32120$::jsonb,
   1, $dbw32121$This is a direct real-world example of statements that depend on each other for overall correctness.$dbw32121$, 1, 4),
  ($dbw32122$tq-dbms-sql-11-data-modification-transactions-6$dbw32122$, $dbw32123$pt-dbms-sql-11-data-modification-transactions$dbw32123$,
   $dbw32124$What practice helps avoid a transaction holding locks longer than necessary?$dbw32124$,
   $dbw32125$["Opening the transaction as early as possible in the application, regardless of unrelated work in between", "Opening the transaction right before the related statements and committing immediately after, avoiding slow unrelated work in the middle", "Never using COMMIT at all", "Running all application logic inside a single transaction for the entire session"]$dbw32125$::jsonb,
   1, $dbw32126$Minimizing the time a transaction stays open reduces its potential to block other work.$dbw32126$, 1, 5),
  ($dbw32127$tq-dbms-sql-11-data-modification-transactions-7$dbw32127$, $dbw32128$pt-dbms-sql-11-data-modification-transactions$dbw32128$,
   $dbw32129$What SQL keywords does this topic tie back to from Chapter 8 (TCL)?$dbw32129$,
   $dbw32130$["CREATE and DROP", "BEGIN, COMMIT, and ROLLBACK", "GRANT and REVOKE", "SELECT and WHERE"]$dbw32130$::jsonb,
   1, $dbw32131$Data modification transactions apply TCL's BEGIN/COMMIT/ROLLBACK specifically to DML scenarios.$dbw32131$, 1, 6),
  ($dbw32132$tq-dbms-sql-11-data-modification-transactions-8$dbw32132$, $dbw32133$pt-dbms-sql-11-data-modification-transactions$dbw32133$,
   $dbw32134$If a multi-statement DML sequence is only 'fine on its own' for each individual statement, is that sufficient reasoning to skip a transaction?$dbw32134$,
   $dbw32135$["Yes, if each statement individually succeeds there's no risk", "No \u2014 the real risk is a PARTIAL failure between statements, which per-statement soundness doesn't address at all", "Transactions are only needed for single-statement operations", "This reasoning is always correct for read-only statements"]$dbw32135$::jsonb,
   1, $dbw32136$Evaluating each statement in isolation misses the actual risk transactions protect against: inconsistency from partial completion.$dbw32136$, 1, 7)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. CHAPTER TESTS — one per new chapter (3, 4, 5). Pools are LIVE joins via
--    practice_test_pool() (0091/063); no test_questions of their own.
-- ===========================================================================
with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbw32137$chapter-9-ddl-and-schema-design$dbw32137$ and lower(g.slug) = $dbw32138$dbms-sql-tutorial$dbw32138$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbw32139$pt-dbms-sql-ch9-test$dbw32139$, $dbw32140$DDL and Schema Design - Chapter Test$dbw32140$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dbw32141$15 randomly-sampled questions drawn from every DDL and Schema Design topic quiz.$dbw32141$,
  'published', true, true, true, 'Medium', 0,
  $dbw32142$This test randomly samples 15 questions from all of Chapter 9's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dbw32142$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbw32143$chapter-10-sql-constraints$dbw32143$ and lower(g.slug) = $dbw32144$dbms-sql-tutorial$dbw32144$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbw32145$pt-dbms-sql-ch10-test$dbw32145$, $dbw32146$SQL Constraints - Chapter Test$dbw32146$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dbw32147$15 randomly-sampled questions drawn from every SQL Constraints topic quiz.$dbw32147$,
  'published', true, true, true, 'Medium', 0,
  $dbw32148$This test randomly samples 15 questions from all of Chapter 10's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dbw32148$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbw32149$chapter-11-dml-and-data-modification$dbw32149$ and lower(g.slug) = $dbw32150$dbms-sql-tutorial$dbw32150$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbw32151$pt-dbms-sql-ch11-test$dbw32151$, $dbw32152$DML and Data Modification - Chapter Test$dbw32152$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dbw32153$15 randomly-sampled questions drawn from every DML and Data Modification topic quiz.$dbw32153$,
  'published', true, true, true, 'Medium', 0,
  $dbw32154$This test randomly samples 15 questions from all of Chapter 11's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dbw32154$
from sec
on conflict (id) do nothing;

-- ===========================================================================
-- 4. SQL CODING PROBLEMS (Chapter 9 DDL-writing, Chapter 10 constraint-
--    violation-finding, Chapter 11 DML-writing — every problem verified
--    end-to-end against Paiza's live MySQL sandbox, 2026-09).
-- ===========================================================================
-- Create the Products Table (topic chapter-9-ddl-and-schema-design/create-table)
with t as (select id from public.learning_topics where source_kind = $dbw32158$dbms_sql_tutorial$dbw32158$ and source_ref = $dbw32159$chapter-9-ddl-and-schema-design/create-table$dbw32159$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbw32160$cp-dbms-sql-create-the-products-table$dbw32160$, null::text, $dbw32161$Create the Products Table$dbw32161$, $dbw32162$Easy$dbw32162$, $dbw32163$create-the-products-table$dbw32163$,
  $dbw32164$Write a `CREATE TABLE` statement for a table named `products` with exactly these columns, in this order: `id` (INTEGER, primary key), `name` (TEXT, cannot be NULL), `price` (INTEGER, cannot be NULL). No rows exist yet — the checker will insert a row and read it back to confirm your table's shape is correct.$dbw32164$,
  $dbw32155$[{"input": "", "output": "id\tname\tprice\n1\tPen\t10"}]$dbw32155$::jsonb, $dbw32156$[{"hidden": true, "check_sql": "INSERT INTO products (id, name, price) VALUES (2, 'Notebook', 45); SELECT id, name, price FROM products;", "expected": "id\tname\tprice\n2\tNotebook\t45"}]$dbw32156$::jsonb, jsonb_build_object('sql', $dbw32157$-- Write your CREATE TABLE statement here
$dbw32157$),
  $dbw32165$Declare each column with its type and constraint, matching the exact column order given. Reference: `CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL);`$dbw32165$, array['sql'], $dbw32166$$dbw32166$, $dbw32167$$dbw32167$, $dbw32168$INSERT INTO products (id, name, price) VALUES (1, 'Pen', 10); SELECT id, name, price FROM products;$dbw32168$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Add an Email Column (topic chapter-9-ddl-and-schema-design/alter-table)
with t as (select id from public.learning_topics where source_kind = $dbw32172$dbms_sql_tutorial$dbw32172$ and source_ref = $dbw32173$chapter-9-ddl-and-schema-design/alter-table$dbw32173$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbw32174$cp-dbms-sql-add-an-email-column$dbw32174$, null::text, $dbw32175$Add an Email Column$dbw32175$, $dbw32176$Medium$dbw32176$, $dbw32177$add-an-email-column$dbw32177$,
  $dbw32178$The `customers` table currently has only `id` and `name`. Write an `ALTER TABLE` statement that adds a new nullable `email` column of type TEXT. The checker will insert a row using the new column and read the table back to confirm it exists.

```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
```

**Starting data**:

```sql
INSERT INTO customers (id, name) VALUES (1, 'Asha'), (2, 'Rohan');
```
$dbw32178$,
  $dbw32169$[{"input": "", "output": "id\tname\temail\n1\tAsha\tNULL\n2\tRohan\tNULL\n99\tPlaceholder\ttest@x.com"}]$dbw32169$::jsonb, $dbw32170$[{"hidden": true, "seed_sql": "INSERT INTO customers (id, name) VALUES (5, 'Zara'), (6, 'Omar');", "expected": "id\tname\temail\n5\tZara\tNULL\n6\tOmar\tNULL\n99\tPlaceholder\ttest@x.com"}]$dbw32170$::jsonb, jsonb_build_object('sql', $dbw32171$-- Write your ALTER TABLE statement here
$dbw32171$),
  $dbw32179$ALTER TABLE ... ADD COLUMN adds a new column to an existing table without touching existing rows (they get NULL for the new column). Reference: `ALTER TABLE customers ADD COLUMN email TEXT;`$dbw32179$, array['sql'], $dbw32180$CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);$dbw32180$, $dbw32181$INSERT INTO customers (id, name) VALUES (1, 'Asha'), (2, 'Rohan');$dbw32181$, $dbw32182$INSERT INTO customers (id, name, email) VALUES (99, 'Placeholder', 'test@x.com'); SELECT id, name, email FROM customers ORDER BY id;$dbw32182$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Employees Missing a Department (topic chapter-10-sql-constraints/not-null)
with t as (select id from public.learning_topics where source_kind = $dbw32186$dbms_sql_tutorial$dbw32186$ and source_ref = $dbw32187$chapter-10-sql-constraints/not-null$dbw32187$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbw32188$cp-dbms-sql-employees-missing-a-department$dbw32188$, null::text, $dbw32189$Employees Missing a Department$dbw32189$, $dbw32190$Easy$dbw32190$, $dbw32191$employees-missing-a-department$dbw32191$,
  $dbw32192$The `department` column should really be NOT NULL, but the constraint was never added, so some rows slipped through with a missing department. Write a query returning `id` and `name` for every employee whose `department` is NULL, ordered by `id`.

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  salary INTEGER
);
```

**Sample data**:

```sql
INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 85000),
(2, 'Rohan', NULL, 62000),
(3, 'Neha', 'Sales', -500),
(4, 'Vikram', 'Sales', 71000);
```
$dbw32192$,
  $dbw32183$[{"input": "", "output": "id\tname\n2\tRohan"}]$dbw32183$::jsonb, $dbw32184$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Finance', 50000),\n(2, 'Omar', NULL, 60000),\n(3, 'Leo', 'Finance', 0);", "expected": "id\tname\n2\tOmar"}]$dbw32184$::jsonb, jsonb_build_object('sql', $dbw32185$-- Write your SELECT query here
$dbw32185$),
  $dbw32193$IS NULL is the only correct way to test for a missing value. Reference: `SELECT id, name FROM employees WHERE department IS NULL ORDER BY id;`$dbw32193$, array['sql'], $dbw32194$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  salary INTEGER
);$dbw32194$, $dbw32195$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 85000),
(2, 'Rohan', NULL, 62000),
(3, 'Neha', 'Sales', -500),
(4, 'Vikram', 'Sales', 71000);$dbw32195$, $dbw32196$$dbw32196$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Employees With an Invalid Salary (topic chapter-10-sql-constraints/check)
with t as (select id from public.learning_topics where source_kind = $dbw32200$dbms_sql_tutorial$dbw32200$ and source_ref = $dbw32201$chapter-10-sql-constraints/check$dbw32201$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbw32202$cp-dbms-sql-employees-with-an-invalid-salary$dbw32202$, null::text, $dbw32203$Employees With an Invalid Salary$dbw32203$, $dbw32204$Medium$dbw32204$, $dbw32205$employees-with-an-invalid-salary$dbw32205$,
  $dbw32206$A `CHECK (salary > 0)` constraint should exist on `employees` but doesn't yet, so some rows have a zero or negative salary. Write a query returning `id`, `name`, and `salary` for every employee whose `salary` is 0 or less, ordered by `id`.

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  salary INTEGER
);
```

**Sample data**:

```sql
INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 85000),
(2, 'Rohan', NULL, 62000),
(3, 'Neha', 'Sales', -500),
(4, 'Vikram', 'Sales', 71000);
```
$dbw32206$,
  $dbw32197$[{"input": "", "output": "id\tname\tsalary\n3\tNeha\t-500"}]$dbw32197$::jsonb, $dbw32198$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Finance', 50000),\n(2, 'Omar', NULL, 60000),\n(3, 'Leo', 'Finance', 0);", "expected": "id\tname\tsalary\n3\tLeo\t0"}]$dbw32198$::jsonb, jsonb_build_object('sql', $dbw32199$-- Write your SELECT query here
$dbw32199$),
  $dbw32207$This is exactly the kind of violation a CHECK (salary > 0) constraint would have prevented from ever being inserted. Reference: `SELECT id, name, salary FROM employees WHERE salary <= 0 ORDER BY id;`$dbw32207$, array['sql'], $dbw32208$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  salary INTEGER
);$dbw32208$, $dbw32209$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 85000),
(2, 'Rohan', NULL, 62000),
(3, 'Neha', 'Sales', -500),
(4, 'Vikram', 'Sales', 71000);$dbw32209$, $dbw32210$$dbw32210$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Insert a New Employee (topic chapter-11-dml-and-data-modification/insert)
with t as (select id from public.learning_topics where source_kind = $dbw32214$dbms_sql_tutorial$dbw32214$ and source_ref = $dbw32215$chapter-11-dml-and-data-modification/insert$dbw32215$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbw32216$cp-dbms-sql-insert-a-new-employee$dbw32216$, null::text, $dbw32217$Insert a New Employee$dbw32217$, $dbw32218$Easy$dbw32218$, $dbw32219$insert-a-new-employee$dbw32219$,
  $dbw32220$Write an `INSERT` statement that adds a new employee: `id=9`, `name='Farah'`, `department='Engineering'`, `salary=75000`. After your statement, the checker runs `SELECT id, name, department, salary FROM employees ORDER BY id;` to verify the table's full contents.

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);
```

**Sample data** (this is the starting state before your statement runs):

```sql
INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 85000),
(2, 'Rohan', 'Sales', 62000);
```
$dbw32220$,
  $dbw32211$[{"input": "", "output": "id\tname\tdepartment\tsalary\n1\tAsha\tEngineering\t85000\n2\tRohan\tSales\t62000\n9\tFarah\tEngineering\t75000"}]$dbw32211$::jsonb, $dbw32212$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Marketing', 71000);", "expected": "id\tname\tdepartment\tsalary\n1\tZara\tMarketing\t71000\n9\tFarah\tEngineering\t75000"}]$dbw32212$::jsonb, jsonb_build_object('sql', $dbw32213$-- Write your INSERT statement here
$dbw32213$),
  $dbw32221$Name every column explicitly and supply the exact values given. Reference: `INSERT INTO employees (id, name, department, salary) VALUES (9, 'Farah', 'Engineering', 75000);`$dbw32221$, array['sql'], $dbw32222$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);$dbw32222$, $dbw32223$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 85000),
(2, 'Rohan', 'Sales', 62000);$dbw32223$, $dbw32224$SELECT id, name, department, salary FROM employees ORDER BY id;$dbw32224$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Copy High Performers (topic chapter-11-dml-and-data-modification/insert-select)
with t as (select id from public.learning_topics where source_kind = $dbw32228$dbms_sql_tutorial$dbw32228$ and source_ref = $dbw32229$chapter-11-dml-and-data-modification/insert-select$dbw32229$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbw32230$cp-dbms-sql-copy-high-performers$dbw32230$, null::text, $dbw32231$Copy High Performers$dbw32231$, $dbw32232$Medium$dbw32232$, $dbw32233$copy-high-performers$dbw32233$,
  $dbw32234$Copy every employee earning at least 80000 from `employees` into the (initially empty) `high_performers` table, matching columns `id, name, salary`. The checker runs `SELECT id, name, salary FROM high_performers ORDER BY id;` afterward.

```sql
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT NOT NULL, salary INTEGER NOT NULL);
CREATE TABLE high_performers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, salary INTEGER NOT NULL);
```

**Sample data** (this is the starting state before your statement runs):

```sql
INSERT INTO employees (id, name, salary) VALUES
(1, 'Asha', 85000), (2, 'Rohan', 62000), (3, 'Neha', 91000);
```
$dbw32234$,
  $dbw32225$[{"input": "", "output": "id\tname\tsalary\n1\tAsha\t85000\n3\tNeha\t91000"}]$dbw32225$::jsonb, $dbw32226$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, salary) VALUES\n(5, 'Zara', 79000), (6, 'Omar', 88000);", "expected": "id\tname\tsalary\n6\tOmar\t88000"}]$dbw32226$::jsonb, jsonb_build_object('sql', $dbw32227$-- Write your INSERT ... SELECT statement here
$dbw32227$),
  $dbw32235$INSERT ... SELECT copies query results directly into another table. Reference: `INSERT INTO high_performers (id, name, salary) SELECT id, name, salary FROM employees WHERE salary >= 80000;`$dbw32235$, array['sql'], $dbw32236$CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT NOT NULL, salary INTEGER NOT NULL);
CREATE TABLE high_performers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, salary INTEGER NOT NULL);$dbw32236$, $dbw32237$INSERT INTO employees (id, name, salary) VALUES
(1, 'Asha', 85000), (2, 'Rohan', 62000), (3, 'Neha', 91000);$dbw32237$, $dbw32238$SELECT id, name, salary FROM high_performers ORDER BY id;$dbw32238$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Raise Every Engineering Salary by 10% (topic chapter-11-dml-and-data-modification/update)
with t as (select id from public.learning_topics where source_kind = $dbw32242$dbms_sql_tutorial$dbw32242$ and source_ref = $dbw32243$chapter-11-dml-and-data-modification/update$dbw32243$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbw32244$cp-dbms-sql-raise-engineering-salaries$dbw32244$, null::text, $dbw32245$Raise Every Engineering Salary by 10%$dbw32245$, $dbw32246$Medium$dbw32246$, $dbw32247$raise-engineering-salaries$dbw32247$,
  $dbw32248$Write an `UPDATE` that gives every employee in the `'Engineering'` department a 10% raise: new salary = `FLOOR(salary * 1.1)` (rounding down to the nearest whole number). Do not touch employees in other departments. The checker runs `SELECT id, name, salary FROM employees ORDER BY id;` afterward.

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);
```

**Sample data** (this is the starting state before your statement runs):

```sql
INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 80000),
(2, 'Rohan', 'Engineering', 70000),
(3, 'Neha', 'Sales', 60000);
```
$dbw32248$,
  $dbw32239$[{"input": "", "output": "id\tname\tsalary\n1\tAsha\t88000\n2\tRohan\t77000\n3\tNeha\t60000"}]$dbw32239$::jsonb, $dbw32240$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Engineering', 90000),\n(2, 'Omar', 'Finance', 55000);", "expected": "id\tname\tsalary\n1\tZara\t99000\n2\tOmar\t55000"}]$dbw32240$::jsonb, jsonb_build_object('sql', $dbw32241$-- Write your UPDATE statement here
$dbw32241$),
  $dbw32249$Filter with WHERE department = 'Engineering' so only the right rows change. Reference: `UPDATE employees SET salary = FLOOR(salary * 1.1) WHERE department = 'Engineering';`$dbw32249$, array['sql'], $dbw32250$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);$dbw32250$, $dbw32251$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 80000),
(2, 'Rohan', 'Engineering', 70000),
(3, 'Neha', 'Sales', 60000);$dbw32251$, $dbw32252$SELECT id, name, salary FROM employees ORDER BY id;$dbw32252$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Remove Low-Salary Employees (topic chapter-11-dml-and-data-modification/delete)
with t as (select id from public.learning_topics where source_kind = $dbw32256$dbms_sql_tutorial$dbw32256$ and source_ref = $dbw32257$chapter-11-dml-and-data-modification/delete$dbw32257$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbw32258$cp-dbms-sql-remove-low-salary-employees$dbw32258$, null::text, $dbw32259$Remove Low-Salary Employees$dbw32259$, $dbw32260$Medium$dbw32260$, $dbw32261$remove-low-salary-employees$dbw32261$,
  $dbw32262$Write a `DELETE` statement that removes every employee earning less than 60000. The checker runs `SELECT id, name FROM employees ORDER BY id;` afterward to see who remains.

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);
```

**Sample data** (this is the starting state before your statement runs):

```sql
INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 85000),
(2, 'Rohan', 'Sales', 55000),
(3, 'Neha', 'Marketing', 58000),
(4, 'Vikram', 'Engineering', 72000);
```
$dbw32262$,
  $dbw32253$[{"input": "", "output": "id\tname\n1\tAsha\n4\tVikram"}]$dbw32253$::jsonb, $dbw32254$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Finance', 50000),\n(2, 'Omar', 'Finance', 61000);", "expected": "id\tname\n2\tOmar"}]$dbw32254$::jsonb, jsonb_build_object('sql', $dbw32255$-- Write your DELETE statement here
$dbw32255$),
  $dbw32263$A targeted DELETE needs exactly the right WHERE clause. Reference: `DELETE FROM employees WHERE salary < 60000;`$dbw32263$, array['sql'], $dbw32264$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);$dbw32264$, $dbw32265$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 85000),
(2, 'Rohan', 'Sales', 55000),
(3, 'Neha', 'Marketing', 58000),
(4, 'Vikram', 'Engineering', 72000);$dbw32265$, $dbw32266$SELECT id, name FROM employees ORDER BY id;$dbw32266$,
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
  select id into v_grid_id from public.learning_grids where lower(slug) = $dbw32267$dbms-sql-tutorial$dbw32267$;
  if v_grid_id is null then raise exception 'validation: dbms-sql-tutorial grid missing'; end if;

  select count(*) into v_topics from public.learning_topics where grid_id = v_grid_id and source_kind = $dbw32268$dbms_sql_tutorial$dbw32268$;
  if v_topics < 149 then raise exception 'validation: expected at least 149 dbms_sql_tutorial topics (115 from batches 1-3 + 34 from batch 4), found %', v_topics; end if;

  select count(*) into v_questions from public.test_questions tq
    join public.practice_tests pt on pt.id = tq.test_id
    where pt.learning_topic_id in (select id from public.learning_topics where grid_id = v_grid_id and source_kind = $dbw32269$dbms_sql_tutorial$dbw32269$);
  if v_questions < 1192 then raise exception 'validation: expected at least 1192 topic-quiz questions, found %', v_questions; end if;

  select count(*) into v_chtests from public.practice_tests where id in ('pt-dbms-sql-ch9-test','pt-dbms-sql-ch10-test','pt-dbms-sql-ch11-test') and scope = 'chapter';
  if v_chtests <> 3 then raise exception 'validation: expected 3 new chapter tests, found %', v_chtests; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-dbms-sql-%';
  if v_problems < 18 then raise exception 'validation: expected at least 18 SQL coding problems total, found %', v_problems; end if;

  raise notice '0095 OK: % total topics, % total topic-quiz questions, 3 new chapter tests (ch9/ch10/ch11), % total SQL coding problems.', v_topics, v_questions, v_problems;
end $$;

notify pgrst, 'reload schema';
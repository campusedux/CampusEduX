-- mobile-app/supabase/migrations/0097_seed_dbms_sql_tutorial_ch15_ch16_ch17.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/069_seed_dbms_sql_tutorial_ch15_ch16_ch17.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — DBMS & SQL Tutorial: Chapters 15, 16, 17 (batch 6)
-- ============================================================================
-- WHAT / WHY
--   Sixth content batch, on top of 0091/063 (schema) + batches 1-5 (chapters
--   1-14). Adds Chapter 15 (GROUP BY and Aggregation, 9 topics), Chapter 16
--   (Joins, 13 topics — topic 16.7 'Natural Join' uses slug
--   natural-join-sql to avoid colliding with Chapter 7's own 'Natural Join'
--   relational-algebra topic), Chapter 17 (Subqueries, 12 topics) = 34 more
--   topics, 272 more topic-quiz MCQs, 3
--   more Chapter tests, and 11 more SQL coding problems (4 on Chapter 15
--   GROUP BY/HAVING/multi-key-grouping/conditional-aggregation, 5 on
--   Chapter 16 covering inner/left/self/anti/semi join, 2 on Chapter 17
--   covering correlated subqueries and subquery-in-FROM — all verified
--   end-to-end against Paiza's live sandbox).
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
  if not exists (select 1 from public.learning_grids where lower(slug) = $dbu50001$dbms-sql-tutorial$dbu50001$) then
    raise exception '0097/069: dbms-sql-tutorial grid not found — apply 0092_seed_dbms_sql_tutorial_ch1_ch2_ch8.sql (admin 064) first.';
  end if;
  if to_regprocedure('public.practice_test_pool(text)') is null then
    raise exception '0097/069: DBMS-practice RPCs not found — apply 0091_dbms_sql_practice.sql (admin 063) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 1. SECTIONS — re-affirm all 43 (idempotent no-op for rows 0092 already set;
--    harmless if this migration is ever applied to a fresh project before 0092).
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = $dbu50002$dbms-sql-tutorial$dbu50002$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50003$Chapter 1: Database Foundations$dbu50003$, $dbu50004$chapter-1-database-foundations$dbu50004$, 1, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50005$dbms-sql-tutorial$dbu50005$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50006$Chapter 2: DBMS Architecture$dbu50006$, $dbu50007$chapter-2-dbms-architecture$dbu50007$, 2, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50008$dbms-sql-tutorial$dbu50008$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50009$Chapter 3: Data Models$dbu50009$, $dbu50010$chapter-3-data-models$dbu50010$, 3, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50011$dbms-sql-tutorial$dbu50011$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50012$Chapter 4: Relational Model$dbu50012$, $dbu50013$chapter-4-relational-model$dbu50013$, 4, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50014$dbms-sql-tutorial$dbu50014$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50015$Chapter 5: Keys and Integrity$dbu50015$, $dbu50016$chapter-5-keys-and-integrity$dbu50016$, 5, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50017$dbms-sql-tutorial$dbu50017$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50018$Chapter 6: ER and EER Modeling$dbu50018$, $dbu50019$chapter-6-er-and-eer-modeling$dbu50019$, 6, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50020$dbms-sql-tutorial$dbu50020$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50021$Chapter 7: Relational Algebra$dbu50021$, $dbu50022$chapter-7-relational-algebra$dbu50022$, 7, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50023$dbms-sql-tutorial$dbu50023$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50024$Chapter 8: SQL Fundamentals$dbu50024$, $dbu50025$chapter-8-sql-fundamentals$dbu50025$, 8, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50026$dbms-sql-tutorial$dbu50026$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50027$Chapter 9: DDL and Schema Design$dbu50027$, $dbu50028$chapter-9-ddl-and-schema-design$dbu50028$, 9, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50029$dbms-sql-tutorial$dbu50029$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50030$Chapter 10: SQL Constraints$dbu50030$, $dbu50031$chapter-10-sql-constraints$dbu50031$, 10, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50032$dbms-sql-tutorial$dbu50032$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50033$Chapter 11: DML and Data Modification$dbu50033$, $dbu50034$chapter-11-dml-and-data-modification$dbu50034$, 11, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50035$dbms-sql-tutorial$dbu50035$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50036$Chapter 12: SELECT and Filtering$dbu50036$, $dbu50037$chapter-12-select-and-filtering$dbu50037$, 12, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50038$dbms-sql-tutorial$dbu50038$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50039$Chapter 13: Sorting and Pagination$dbu50039$, $dbu50040$chapter-13-sorting-and-pagination$dbu50040$, 13, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50041$dbms-sql-tutorial$dbu50041$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50042$Chapter 14: SQL Functions$dbu50042$, $dbu50043$chapter-14-sql-functions$dbu50043$, 14, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50044$dbms-sql-tutorial$dbu50044$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50045$Chapter 15: GROUP BY and Aggregation$dbu50045$, $dbu50046$chapter-15-group-by-and-aggregation$dbu50046$, 15, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50047$dbms-sql-tutorial$dbu50047$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50048$Chapter 16: Joins$dbu50048$, $dbu50049$chapter-16-joins$dbu50049$, 16, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50050$dbms-sql-tutorial$dbu50050$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50051$Chapter 17: Subqueries$dbu50051$, $dbu50052$chapter-17-subqueries$dbu50052$, 17, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50053$dbms-sql-tutorial$dbu50053$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50054$Chapter 18: Set Operations$dbu50054$, $dbu50055$chapter-18-set-operations$dbu50055$, 18, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50056$dbms-sql-tutorial$dbu50056$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50057$Chapter 19: Views$dbu50057$, $dbu50058$chapter-19-views$dbu50058$, 19, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50059$dbms-sql-tutorial$dbu50059$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50060$Chapter 20: Indexes and Access Paths$dbu50060$, $dbu50061$chapter-20-indexes-and-access-paths$dbu50061$, 20, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50062$dbms-sql-tutorial$dbu50062$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50063$Chapter 21: Normalization and Functional Dependencies$dbu50063$, $dbu50064$chapter-21-normalization-and-functional-dependencies$dbu50064$, 21, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50065$dbms-sql-tutorial$dbu50065$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50066$Chapter 22: Transactions$dbu50066$, $dbu50067$chapter-22-transactions$dbu50067$, 22, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50068$dbms-sql-tutorial$dbu50068$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50069$Chapter 23: Concurrency Control$dbu50069$, $dbu50070$chapter-23-concurrency-control$dbu50070$, 23, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50071$dbms-sql-tutorial$dbu50071$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50072$Chapter 24: Locking Protocols$dbu50072$, $dbu50073$chapter-24-locking-protocols$dbu50073$, 24, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50074$dbms-sql-tutorial$dbu50074$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50075$Chapter 25: Isolation Levels$dbu50075$, $dbu50076$chapter-25-isolation-levels$dbu50076$, 25, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50077$dbms-sql-tutorial$dbu50077$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50078$Chapter 26: Recovery and Logging$dbu50078$, $dbu50079$chapter-26-recovery-and-logging$dbu50079$, 26, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50080$dbms-sql-tutorial$dbu50080$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50081$Chapter 27: Database Security$dbu50081$, $dbu50082$chapter-27-database-security$dbu50082$, 27, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50083$dbms-sql-tutorial$dbu50083$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50084$Chapter 28: Stored Procedures$dbu50084$, $dbu50085$chapter-28-stored-procedures$dbu50085$, 28, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50086$dbms-sql-tutorial$dbu50086$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50087$Chapter 29: Stored Functions$dbu50087$, $dbu50088$chapter-29-stored-functions$dbu50088$, 29, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50089$dbms-sql-tutorial$dbu50089$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50090$Chapter 30: Triggers$dbu50090$, $dbu50091$chapter-30-triggers$dbu50091$, 30, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50092$dbms-sql-tutorial$dbu50092$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50093$Chapter 31: Cursors$dbu50093$, $dbu50094$chapter-31-cursors$dbu50094$, 31, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50095$dbms-sql-tutorial$dbu50095$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50096$Chapter 32: Advanced SQL: CTE$dbu50096$, $dbu50097$chapter-32-advanced-sql-cte$dbu50097$, 32, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50098$dbms-sql-tutorial$dbu50098$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50099$Chapter 33: Advanced SQL: Window Functions$dbu50099$, $dbu50100$chapter-33-advanced-sql-window-functions$dbu50100$, 33, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50101$dbms-sql-tutorial$dbu50101$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50102$Chapter 34: Advanced SQL Patterns$dbu50102$, $dbu50103$chapter-34-advanced-sql-patterns$dbu50103$, 34, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50104$dbms-sql-tutorial$dbu50104$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50105$Chapter 35: Query Processing and Optimization$dbu50105$, $dbu50106$chapter-35-query-processing-and-optimization$dbu50106$, 35, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50107$dbms-sql-tutorial$dbu50107$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50108$Chapter 36: Physical Storage$dbu50108$, $dbu50109$chapter-36-physical-storage$dbu50109$, 36, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50110$dbms-sql-tutorial$dbu50110$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50111$Chapter 37: Advanced Index Structures$dbu50111$, $dbu50112$chapter-37-advanced-index-structures$dbu50112$, 37, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50113$dbms-sql-tutorial$dbu50113$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50114$Chapter 38: Distributed Databases$dbu50114$, $dbu50115$chapter-38-distributed-databases$dbu50115$, 38, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50116$dbms-sql-tutorial$dbu50116$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50117$Chapter 39: NoSQL Databases$dbu50117$, $dbu50118$chapter-39-nosql-databases$dbu50118$, 39, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50119$dbms-sql-tutorial$dbu50119$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50120$Chapter 40: Database Scaling$dbu50120$, $dbu50121$chapter-40-database-scaling$dbu50121$, 40, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50122$dbms-sql-tutorial$dbu50122$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50123$Chapter 41: Data Warehousing$dbu50123$, $dbu50124$chapter-41-data-warehousing$dbu50124$, 41, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50125$dbms-sql-tutorial$dbu50125$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50126$Chapter 42: Database Design Projects$dbu50126$, $dbu50127$chapter-42-database-design-projects$dbu50127$, 42, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50128$dbms-sql-tutorial$dbu50128$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbu50129$Chapter 43: Interview and Placement Preparation$dbu50129$, $dbu50130$chapter-43-interview-and-placement-preparation$dbu50130$, 43, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. TOPICS + NOTES CONTENT + MCQ QUIZ per topic (chapters 3, 4, 5)
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- Chapter 15: GROUP BY and Aggregation
-- ---------------------------------------------------------------------------
-- 15.1 GROUP BY
with g as (select id from public.learning_grids where lower(slug) = $dbu50131$dbms-sql-tutorial$dbu50131$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50132$chapter-15-group-by-and-aggregation$dbu50132$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50133$GROUP BY$dbu50133$, $dbu50134$group-by$dbu50134$, '', 1, 'published', true, true, $dbu50135$dbms_sql_tutorial$dbu50135$, $dbu50136$chapter-15-group-by-and-aggregation/group-by$dbu50136$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50137$dbms_sql_tutorial$dbu50137$ and source_ref = $dbu50138$chapter-15-group-by-and-aggregation/group-by$dbu50138$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50139$GROUP BY$dbu50139$, $dbu50140$### What GROUP BY Does

`GROUP BY` collapses rows that share the same value(s) in one or more columns into a single output row per group. It is almost always paired with an aggregate function (`SUM`, `COUNT`, `AVG`, `MIN`, `MAX` — see Chapter 14) that is computed once per group instead of once per row.

Without `GROUP BY`, an aggregate function collapses the *entire table* into one row. With `GROUP BY`, the table is first partitioned into buckets by the grouping column(s), and the aggregate runs separately inside each bucket.

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### Basic Syntax

```sql
SELECT region, SUM(amount) AS total_amount
FROM orders
GROUP BY region
ORDER BY region;
```

Result:

| region | total_amount |
|--------|---------------|
| East   | 310           |
| North  | 200           |
| West   | 550           |

Three input groups (East, North, West) produce exactly three output rows, no matter how many raw `orders` rows fed into each group (East had 3 rows, North had 2, West had 3).

### The Golden Rule

Every column in the `SELECT` list must be either:
1. Listed in `GROUP BY`, or
2. Wrapped in an aggregate function.

```sql
-- INVALID in standard SQL / PostgreSQL (product is neither grouped nor aggregated)
SELECT region, product, SUM(amount) FROM orders GROUP BY region;
-- ERROR: column "orders.product" must appear in the GROUP BY clause
--        or be used in an aggregate function
```

MySQL historically allowed this (returning an arbitrary, unpredictable `product` value per group) unless `ONLY_FULL_GROUP_BY` mode is enabled — but relying on that behavior is a bug waiting to happen and is disabled by default since MySQL 5.7.

### Adding More Aggregates

```sql
SELECT region,
       COUNT(*)      AS order_count,
       SUM(amount)   AS total_amount,
       AVG(amount)   AS avg_amount
FROM orders
GROUP BY region
ORDER BY region;
```

| region | order_count | total_amount | avg_amount |
|--------|-------------|---------------|------------|
| East   | 3           | 310           | 103.33     |
| North  | 2           | 200           | 100.00     |
| West   | 3           | 550           | 183.33     |

### Execution Order Reminder

Conceptually `GROUP BY` runs **after** `FROM`/`JOIN`/`WHERE` and **before** `HAVING`, `SELECT`'s final projection, `ORDER BY`, and `LIMIT`. This is why you cannot reference a `SELECT`-list alias defined by an aggregate inside the same query's `WHERE` clause — `WHERE` doesn't know about groups yet.

### Edge Cases

- **Grouping on a NULL-containing column**: all `NULL` values in the grouping column are treated as one single group (NULLs are considered "equal" to each other for grouping purposes, unlike in most comparisons).
- **Empty table**: `GROUP BY` on an empty table produces zero rows — not one row of zeros. (Contrast with no `GROUP BY` at all, where `COUNT(*)` on an empty table still returns one row with `0`.)
- **GROUP BY an expression**: you can group by a computed expression, e.g. `GROUP BY EXTRACT(YEAR FROM order_date)`, as long as the same expression (or its alias, in PostgreSQL/MySQL) is used consistently.
- **Grouping by primary key**: if you `GROUP BY id` (a unique column) every group has exactly one row, so aggregates are technically pointless but legal.

### Key Takeaways / Interview Q&A

- **Q: What happens if I select a non-aggregated, non-grouped column?**
  A: Standard SQL and PostgreSQL reject the query at parse time; MySQL (default mode) also rejects it since 5.7's `ONLY_FULL_GROUP_BY`.
- **Q: Does GROUP BY guarantee row order?**
  A: No. Always add `ORDER BY` if you need a specific group order.
- **Q: How many output rows does `GROUP BY region` produce here?**
  A: 3 — one per distinct region value (East, North, West).
- **Q: Can you GROUP BY a column not in SELECT?**
  A: Yes — you can group by columns purely for bucketing without displaying them, as long as the SELECT list rules above are respected for the columns you *do* display.$dbu50140$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50141$dbms_sql_tutorial_seed$dbu50141$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50142$dbms_sql_tutorial_seed$dbu50142$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50143$dbms-sql-tutorial$dbu50143$),
     t as (select id from public.learning_topics where source_kind = $dbu50144$dbms_sql_tutorial$dbu50144$ and source_ref = $dbu50145$chapter-15-group-by-and-aggregation/group-by$dbu50145$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50146$pt-dbms-sql-15-group-by$dbu50146$, $dbu50147$GROUP BY - Quick Test$dbu50147$, 'aptitude', 8, 8,
  $dbu50148$8 questions on GROUP BY.$dbu50148$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50149$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50149$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50150$tq-dbms-sql-15-group-by-1$dbu50150$, $dbu50151$pt-dbms-sql-15-group-by$dbu50151$,
   $dbu50152$What does `GROUP BY` do to a result set before aggregates are applied?$dbu50152$,
   $dbu50153$["It sorts rows alphabetically", "It partitions rows into buckets sharing the same grouping-column value(s)", "It removes duplicate rows entirely", "It filters rows based on a condition"]$dbu50153$::jsonb,
   1, $dbu50154$GROUP BY partitions the rows into groups by the specified column(s); aggregate functions then compute one value per group.$dbu50154$, 1, 0),
  ($dbu50155$tq-dbms-sql-15-group-by-2$dbu50155$, $dbu50156$pt-dbms-sql-15-group-by$dbu50156$,
   $dbu50157$Given the `orders` table (East: 310, West: 550, North: 200 total amount), what does `SELECT region, SUM(amount) FROM orders GROUP BY region ORDER BY region;` return?$dbu50157$,
   $dbu50158$["A single row with 1060", "Three rows: East 310, North 200, West 550", "Eight rows, one per order", "An error because SUM needs HAVING"]$dbu50158$::jsonb,
   1, $dbu50159$GROUP BY region collapses the 8 rows into 3 groups; SUM(amount) is computed per group, giving East=310, North=200, West=550.$dbu50159$, 1, 1),
  ($dbu50160$tq-dbms-sql-15-group-by-3$dbu50160$, $dbu50161$pt-dbms-sql-15-group-by$dbu50161$,
   $dbu50162$Why does `SELECT region, product, SUM(amount) FROM orders GROUP BY region;` raise an error in PostgreSQL?$dbu50162$,
   $dbu50163$["SUM cannot be used with GROUP BY", "product is neither in GROUP BY nor wrapped in an aggregate function", "region must be aggregated too", "GROUP BY requires at least two columns"]$dbu50163$::jsonb,
   1, $dbu50164$Every non-aggregated column in SELECT must appear in GROUP BY. product is unaggregated and ungrouped, which PostgreSQL rejects.$dbu50164$, 1, 2),
  ($dbu50165$tq-dbms-sql-15-group-by-4$dbu50165$, $dbu50166$pt-dbms-sql-15-group-by$dbu50166$,
   $dbu50167$How are NULL values in a grouping column treated by GROUP BY?$dbu50167$,
   $dbu50168$["Each NULL forms its own separate group", "All NULLs are excluded from the result", "All NULLs are grouped together into one group", "NULLs cause a runtime error"]$dbu50168$::jsonb,
   2, $dbu50169$For grouping purposes, all NULL values in a column are treated as equal to each other and collapsed into a single group.$dbu50169$, 1, 3),
  ($dbu50170$tq-dbms-sql-15-group-by-5$dbu50170$, $dbu50171$pt-dbms-sql-15-group-by$dbu50171$,
   $dbu50172$What does `SELECT COUNT(*) FROM orders GROUP BY region;` return if the `orders` table has zero rows?$dbu50172$,
   $dbu50173$["One row with COUNT(*) = 0", "Zero rows", "An error", "One row with COUNT(*) = NULL"]$dbu50173$::jsonb,
   1, $dbu50174$With GROUP BY, an empty table produces zero groups and therefore zero output rows — unlike a plain COUNT(*) with no GROUP BY, which returns one row of 0.$dbu50174$, 1, 4),
  ($dbu50175$tq-dbms-sql-15-group-by-6$dbu50175$, $dbu50176$pt-dbms-sql-15-group-by$dbu50176$,
   $dbu50177$In MySQL prior to enabling `ONLY_FULL_GROUP_BY` (its default is now ON since 5.7), what happened if you selected an ungrouped, non-aggregated column?$dbu50177$,
   $dbu50178$["An immediate syntax error", "The query ran but returned an arbitrary, unpredictable value for that column per group", "The column was automatically added to GROUP BY", "MySQL never allowed this, ever"]$dbu50178$::jsonb,
   1, $dbu50179$Older/relaxed MySQL modes permitted this and silently picked one arbitrary row's value per group, which is why relying on it is dangerous.$dbu50179$, 1, 5),
  ($dbu50180$tq-dbms-sql-15-group-by-7$dbu50180$, $dbu50181$pt-dbms-sql-15-group-by$dbu50181$,
   $dbu50182$Which clause conceptually executes GROUP BY relative to WHERE and HAVING?$dbu50182$,
   $dbu50183$["GROUP BY runs before WHERE", "GROUP BY runs after WHERE and before HAVING", "GROUP BY and WHERE run simultaneously", "GROUP BY runs after HAVING"]$dbu50183$::jsonb,
   1, $dbu50184$Logical query processing order is FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT.$dbu50184$, 1, 6),
  ($dbu50185$tq-dbms-sql-15-group-by-8$dbu50185$, $dbu50186$pt-dbms-sql-15-group-by$dbu50186$,
   $dbu50187$If you `GROUP BY id` where `id` is the orders table's primary key, how many rows end up in each group?$dbu50187$,
   $dbu50188$["Exactly one row per group, since id is unique", "All 8 rows in one group", "Zero rows", "It depends on the region"]$dbu50188$::jsonb,
   0, $dbu50189$Since id is unique per row, grouping by it puts exactly one row in each group — legal, but aggregates become trivial.$dbu50189$, 1, 7)
on conflict (id) do nothing;

-- 15.2 HAVING
with g as (select id from public.learning_grids where lower(slug) = $dbu50190$dbms-sql-tutorial$dbu50190$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50191$chapter-15-group-by-and-aggregation$dbu50191$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50192$HAVING$dbu50192$, $dbu50193$having$dbu50193$, '', 2, 'published', true, true, $dbu50194$dbms_sql_tutorial$dbu50194$, $dbu50195$chapter-15-group-by-and-aggregation/having$dbu50195$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50196$dbms_sql_tutorial$dbu50196$ and source_ref = $dbu50197$chapter-15-group-by-and-aggregation/having$dbu50197$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50198$HAVING$dbu50198$, $dbu50199$### Filtering Groups, Not Rows

`HAVING` filters **groups** produced by `GROUP BY`, evaluated *after* aggregation. This is the key distinction from `WHERE`, which filters individual rows *before* grouping happens (Chapter 8/12 introduced `WHERE`; Topic 15.3 contrasts the two directly).

Because `HAVING` runs after aggregates are computed, it is the only clause allowed to reference an aggregate function directly in its condition.

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### Basic Example

```sql
SELECT region, SUM(amount) AS total_amount
FROM orders
GROUP BY region
HAVING SUM(amount) > 400
ORDER BY region;
```

Per-region totals are East = 310, North = 200, West = 550. Only West clears the 400 bar:

| region | total_amount |
|--------|---------------|
| West   | 550           |

### Multi-Branch (Compound) HAVING

`HAVING` supports `AND` / `OR` just like `WHERE`, combining multiple aggregate conditions:

```sql
SELECT region,
       COUNT(*)    AS order_count,
       SUM(amount) AS total_amount,
       AVG(amount) AS avg_amount
FROM orders
GROUP BY region
HAVING COUNT(*) > 2 AND AVG(amount) > 100
ORDER BY region;
```

Evaluating each group:
- East: count = 3 (>2 ✓), avg = 103.33 (>100 ✓) → **passes**
- North: count = 2 (>2 ✗) → **fails**
- West: count = 3 (>2 ✓), avg = 183.33 (>100 ✓) → **passes**

| region | order_count | total_amount | avg_amount |
|--------|-------------|---------------|------------|
| East   | 3           | 310           | 103.33     |
| West   | 3           | 550           | 183.33     |

North is dropped even though it was a valid group — `HAVING` removes whole groups that fail the condition, the same way `WHERE` removes whole rows.

### HAVING Without GROUP BY

`HAVING` can technically be used without an explicit `GROUP BY` — the entire table is then treated as one implicit group:

```sql
SELECT SUM(amount) AS total_amount
FROM orders
HAVING SUM(amount) > 5000;   -- 1060 is not > 5000, so 0 rows returned
```

### Edge Cases

- **HAVING referencing a non-aggregated, non-grouped column**: rejected for the same reason as in `SELECT` (Topic 15.1) — the column has no single value per group unless it's part of `GROUP BY`.
- **HAVING with an alias**: PostgreSQL and MySQL allow `HAVING total_amount > 400` using the `SELECT`-list alias; strict standard SQL technically does not guarantee this, so `HAVING SUM(amount) > 400` is the more portable form.
- **Using HAVING for row-level filtering**: legal but wasteful — e.g. `HAVING region = 'West'` still works, but the engine aggregates *all* rows first, then discards groups. See 15.3 for why this is inefficient compared to `WHERE`.

### Key Takeaways / Interview Q&A

- **Q: Can HAVING reference an aggregate function?**
  A: Yes — that's its entire purpose; WHERE cannot.
- **Q: In the orders example, which regions pass `HAVING SUM(amount) > 400`?**
  A: Only West (550); East (310) and North (200) do not.
  A: (compound example) East and West pass `HAVING COUNT(*) > 2 AND AVG(amount) > 100`; North fails on COUNT(*).
- **Q: Does HAVING run before or after GROUP BY?**
  A: After — GROUP BY forms the groups and computes aggregates first, then HAVING filters which groups survive.
- **Q: Is `GROUP BY` mandatory to use `HAVING`?**
  A: No, but without it the whole table is one implicit group.$dbu50199$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50200$dbms_sql_tutorial_seed$dbu50200$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50201$dbms_sql_tutorial_seed$dbu50201$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50202$dbms-sql-tutorial$dbu50202$),
     t as (select id from public.learning_topics where source_kind = $dbu50203$dbms_sql_tutorial$dbu50203$ and source_ref = $dbu50204$chapter-15-group-by-and-aggregation/having$dbu50204$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50205$pt-dbms-sql-15-having$dbu50205$, $dbu50206$HAVING - Quick Test$dbu50206$, 'aptitude', 8, 8,
  $dbu50207$8 questions on HAVING.$dbu50207$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50208$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50208$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50209$tq-dbms-sql-15-having-1$dbu50209$, $dbu50210$pt-dbms-sql-15-having$dbu50210$,
   $dbu50211$What does HAVING filter?$dbu50211$,
   $dbu50212$["Individual rows before grouping", "Groups, after aggregation has been computed", "Columns in the SELECT list", "Tables in a JOIN"]$dbu50212$::jsonb,
   1, $dbu50213$HAVING filters the aggregated groups produced by GROUP BY, evaluated after aggregate values are computed.$dbu50213$, 1, 0),
  ($dbu50214$tq-dbms-sql-15-having-2$dbu50214$, $dbu50215$pt-dbms-sql-15-having$dbu50215$,
   $dbu50216$Given per-region totals East=310, North=200, West=550, what does `... GROUP BY region HAVING SUM(amount) > 400` return?$dbu50216$,
   $dbu50217$["All three regions", "Only West", "Only East and West", "No rows"]$dbu50217$::jsonb,
   1, $dbu50218$Only West's total (550) exceeds 400; East (310) and North (200) do not.$dbu50218$, 1, 1),
  ($dbu50219$tq-dbms-sql-15-having-3$dbu50219$, $dbu50220$pt-dbms-sql-15-having$dbu50220$,
   $dbu50221$Why can HAVING reference `SUM(amount)` directly while WHERE cannot?$dbu50221$,
   $dbu50222$["HAVING is just a synonym for WHERE", "HAVING runs after aggregation, when per-group aggregate values already exist; WHERE runs before grouping, when they don't yet exist", "SUM() is disallowed in WHERE due to a syntax restriction with no logical reason", "WHERE can actually reference SUM() too"]$dbu50222$::jsonb,
   1, $dbu50223$At the point WHERE executes, rows haven't been grouped or aggregated yet, so aggregate values don't exist; HAVING executes after aggregation.$dbu50223$, 1, 2),
  ($dbu50224$tq-dbms-sql-15-having-4$dbu50224$, $dbu50225$pt-dbms-sql-15-having$dbu50225$,
   $dbu50226$In the compound example `HAVING COUNT(*) > 2 AND AVG(amount) > 100`, which region(s) fail?$dbu50226$,
   $dbu50227$["East only", "West only", "North only", "All three fail"]$dbu50227$::jsonb,
   2, $dbu50228$North has COUNT(*) = 2, which fails the COUNT(*) > 2 condition, so it's excluded even though its AVG (100.00) is not > 100 either.$dbu50228$, 1, 3),
  ($dbu50229$tq-dbms-sql-15-having-5$dbu50229$, $dbu50230$pt-dbms-sql-15-having$dbu50230$,
   $dbu50231$What does `SELECT SUM(amount) FROM orders HAVING SUM(amount) > 5000;` return, given the total of all orders is 1060?$dbu50231$,
   $dbu50232$["A row showing 1060", "Zero rows", "An error, since GROUP BY is missing", "A row showing 5000"]$dbu50232$::jsonb,
   1, $dbu50233$Without GROUP BY, HAVING treats the entire table as one implicit group. Since 1060 is not greater than 5000, that single group is filtered out, leaving zero rows.$dbu50233$, 1, 4),
  ($dbu50234$tq-dbms-sql-15-having-6$dbu50234$, $dbu50235$pt-dbms-sql-15-having$dbu50235$,
   $dbu50236$Is `SELECT region, product, SUM(amount) FROM orders GROUP BY region HAVING product = 'Widget'` valid in PostgreSQL?$dbu50236$,
   $dbu50237$["Yes, HAVING can reference any column freely", "No \u2014 product is neither grouped nor aggregated, so it can't appear in SELECT or HAVING", "Yes, because HAVING implicitly aggregates it", "No, because HAVING cannot use equality comparisons"]$dbu50237$::jsonb,
   1, $dbu50238$The same GROUP BY column rule applies inside HAVING: an ungrouped, non-aggregated column like product cannot be referenced.$dbu50238$, 1, 5),
  ($dbu50239$tq-dbms-sql-15-having-7$dbu50239$, $dbu50240$pt-dbms-sql-15-having$dbu50240$,
   $dbu50241$Which of these is a legitimate, if inefficient, use of HAVING?$dbu50241$,
   $dbu50242$["HAVING SUM(amount) > 100 (aggregate condition)", "HAVING region = 'West' (row-level condition usable via WHERE instead)", "Both of the above are syntactically legal", "Neither is legal"]$dbu50242$::jsonb,
   2, $dbu50243$Both are syntactically legal; the second is just wasteful since it could be pushed into WHERE before aggregation (see Topic 15.3).$dbu50243$, 1, 6),
  ($dbu50244$tq-dbms-sql-15-having-8$dbu50244$, $dbu50245$pt-dbms-sql-15-having$dbu50245$,
   $dbu50246$In PostgreSQL/MySQL, is `HAVING total_amount > 400` (referring to a SELECT-list alias `total_amount`) generally accepted?$dbu50246$,
   $dbu50247$["Never \u2014 aliases are always rejected in HAVING", "Yes, both commonly allow referencing the SELECT alias, though `HAVING SUM(amount) > 400` is more portable across all SQL dialects", "Only in HAVING, never in WHERE, for any database", "Only if the alias is quoted"]$dbu50247$::jsonb,
   1, $dbu50248$PostgreSQL and MySQL both permit HAVING to reference SELECT-list aliases as a convenience, but strict standard SQL doesn't guarantee it, so writing out the aggregate expression is safer for portability.$dbu50248$, 1, 7)
on conflict (id) do nothing;

-- 15.3 WHERE vs HAVING
with g as (select id from public.learning_grids where lower(slug) = $dbu50249$dbms-sql-tutorial$dbu50249$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50250$chapter-15-group-by-and-aggregation$dbu50250$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50251$WHERE vs HAVING$dbu50251$, $dbu50252$where-vs-having$dbu50252$, '', 3, 'published', true, true, $dbu50253$dbms_sql_tutorial$dbu50253$, $dbu50254$chapter-15-group-by-and-aggregation/where-vs-having$dbu50254$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50255$dbms_sql_tutorial$dbu50255$ and source_ref = $dbu50256$chapter-15-group-by-and-aggregation/where-vs-having$dbu50256$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50257$WHERE vs HAVING$dbu50257$, $dbu50258$### The Core Contrast

| Aspect | WHERE | HAVING |
|--------|-------|--------|
| Filters | Individual rows | Groups (after aggregation) |
| Runs | Before GROUP BY | After GROUP BY |
| Can reference aggregates? | No (`SUM`, `COUNT`, etc. not yet computed) | Yes |
| Can reference raw table columns? | Yes | Only grouped/aggregated columns |
| Cost | Cheap — shrinks the row set early | More expensive — runs after full aggregation |

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### Side-by-Side Example

**Row-level condition → use WHERE.** "Only consider West and East orders, then total by region":

```sql
SELECT region, SUM(amount) AS total_amount
FROM orders
WHERE region IN ('East', 'West')
GROUP BY region
ORDER BY region;
```

`WHERE` discards the 2 North rows *before* grouping — the engine only ever aggregates the remaining 6 rows.

| region | total_amount |
|--------|---------------|
| East   | 310           |
| West   | 550           |

**Group-level condition → use HAVING.** "Only show regions whose total exceeds 300":

```sql
SELECT region, SUM(amount) AS total_amount
FROM orders
GROUP BY region
HAVING SUM(amount) > 300
ORDER BY region;
```

All 8 rows are aggregated into 3 groups first, *then* the 300 threshold is checked against each group's `SUM(amount)`.

| region | total_amount |
|--------|---------------|
| East   | 310           |
| West   | 550           |

Both queries happen to return the same two regions here, but for entirely different reasons: the first physically excluded North's rows before any summing happened; the second summed everything and then discarded the North *group* because its total (200) failed the check.

### Combining Both

They are not mutually exclusive — most real reporting queries use both, each for its own job:

```sql
SELECT region, SUM(amount) AS total_amount
FROM orders
WHERE product = 'Widget'          -- row filter: only Widget orders
GROUP BY region
HAVING SUM(amount) > 100          -- group filter: only regions totaling > 100
ORDER BY region;
```

Widget-only rows: East (100, 60 → 160), West (200, 50 → 250), North (120). All three exceed 100, so all three appear.

### Why WHERE First Is Cheaper

`WHERE` executes before grouping, so rows it eliminates never have to be scanned, bucketed, or summed at all — less data reaches the (more expensive) grouping/aggregation step. `HAVING` conditions, by contrast, force the engine to fully group and aggregate everything first, then throw entire groups away. **Rule of thumb: push every condition you can express in terms of raw row values into WHERE; reserve HAVING strictly for conditions that need an aggregate result** (`SUM`, `COUNT`, `AVG`, etc.) to evaluate.

### Edge Cases

- Writing `WHERE SUM(amount) > 300` is a hard error in every mainstream dialect — aggregates simply don't exist yet at the `WHERE` stage.
- Writing `HAVING region = 'West'` instead of `WHERE region = 'West'` is *not* an error, just wasted work — it aggregates North/East/West and then drops two whole groups instead of never touching their rows.
- A query can have `WHERE`, `GROUP BY`, and `HAVING` together, in that fixed clause order, or any subset of them.

### Key Takeaways / Interview Q&A

- **Q: Can WHERE reference an aggregate function like COUNT(*)?**
  A: No — that always requires HAVING.
- **Q: Which runs first, WHERE or HAVING?**
  A: WHERE, because it filters rows before GROUP BY creates the groups that HAVING later filters.
- **Q: Given the orders table, which is more efficient — `WHERE region = 'West' GROUP BY region` or `GROUP BY region HAVING region = 'West'`?**
  A: The `WHERE` version — it discards non-West rows immediately instead of aggregating all regions first.
- **Q: When is HAVING unavoidable?**
  A: Only when the filter condition itself depends on an aggregate result (e.g., "regions with total sales over 300").$dbu50258$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50259$dbms_sql_tutorial_seed$dbu50259$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50260$dbms_sql_tutorial_seed$dbu50260$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50261$dbms-sql-tutorial$dbu50261$),
     t as (select id from public.learning_topics where source_kind = $dbu50262$dbms_sql_tutorial$dbu50262$ and source_ref = $dbu50263$chapter-15-group-by-and-aggregation/where-vs-having$dbu50263$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50264$pt-dbms-sql-15-where-vs-having$dbu50264$, $dbu50265$WHERE vs HAVING - Quick Test$dbu50265$, 'aptitude', 8, 8,
  $dbu50266$8 questions on WHERE vs HAVING.$dbu50266$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50267$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50267$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50268$tq-dbms-sql-15-where-vs-having-1$dbu50268$, $dbu50269$pt-dbms-sql-15-where-vs-having$dbu50269$,
   $dbu50270$Which clause can reference an aggregate function such as SUM(amount) in its condition?$dbu50270$,
   $dbu50271$["WHERE only", "HAVING only", "Both equally", "Neither"]$dbu50271$::jsonb,
   1, $dbu50272$HAVING runs after aggregation so it can reference aggregate results; WHERE runs before grouping, when aggregates don't exist yet.$dbu50272$, 1, 0),
  ($dbu50273$tq-dbms-sql-15-where-vs-having-2$dbu50273$, $dbu50274$pt-dbms-sql-15-where-vs-having$dbu50274$,
   $dbu50275$To keep only orders where amount > 100 before any grouping happens, which clause should you use?$dbu50275$,
   $dbu50276$["HAVING amount > 100", "WHERE amount > 100", "GROUP BY amount > 100", "ORDER BY amount > 100"]$dbu50276$::jsonb,
   1, $dbu50277$amount > 100 is a row-level condition on raw data, evaluated before grouping — that's exactly what WHERE is for.$dbu50277$, 1, 1),
  ($dbu50278$tq-dbms-sql-15-where-vs-having-3$dbu50278$, $dbu50279$pt-dbms-sql-15-where-vs-having$dbu50279$,
   $dbu50280$`SELECT region, SUM(amount) FROM orders WHERE region IN ('East','West') GROUP BY region;` — why does this only ever aggregate 6 of the 8 rows?$dbu50280$,
   $dbu50281$["GROUP BY silently drops rows with duplicate regions", "WHERE removes the 2 North rows before grouping/aggregation happens", "HAVING is implicitly applied", "SUM() ignores rows outside alphabetical order"]$dbu50281$::jsonb,
   1, $dbu50282$WHERE executes before GROUP BY, physically excluding North's 2 rows so only the remaining 6 (East+West) rows are ever grouped and summed.$dbu50282$, 1, 2),
  ($dbu50283$tq-dbms-sql-15-where-vs-having-4$dbu50283$, $dbu50284$pt-dbms-sql-15-where-vs-having$dbu50284$,
   $dbu50285$Why is `GROUP BY region HAVING region = 'West'` valid but generally worse practice than `WHERE region = 'West' GROUP BY region`?$dbu50285$,
   $dbu50286$["HAVING version is invalid SQL", "The HAVING version aggregates all regions first then discards two whole groups, doing unnecessary work; the WHERE version filters rows before aggregation ever touches them", "They behave completely differently and can give different results", "WHERE cannot use string equality"]$dbu50286$::jsonb,
   1, $dbu50287$Both return the same result here, but HAVING forces full aggregation of North/East/West before discarding non-West groups, while WHERE avoids aggregating the excluded rows at all — a real, if often small, cost difference.$dbu50287$, 1, 3),
  ($dbu50288$tq-dbms-sql-15-where-vs-having-5$dbu50288$, $dbu50289$pt-dbms-sql-15-where-vs-having$dbu50289$,
   $dbu50290$Given East=310, North=200, West=550 in total amount, what does `GROUP BY region HAVING SUM(amount) > 300` return?$dbu50290$,
   $dbu50291$["East and West", "West only", "All three regions", "North only"]$dbu50291$::jsonb,
   0, $dbu50292$East (310) and West (550) both exceed 300; North (200) does not.$dbu50292$, 1, 4),
  ($dbu50293$tq-dbms-sql-15-where-vs-having-6$dbu50293$, $dbu50294$pt-dbms-sql-15-where-vs-having$dbu50294$,
   $dbu50295$Which statement about clause execution order is correct?$dbu50295$,
   $dbu50296$["HAVING always executes before WHERE", "WHERE executes before GROUP BY; HAVING executes after GROUP BY", "WHERE and HAVING execute simultaneously", "GROUP BY executes before WHERE"]$dbu50296$::jsonb,
   1, $dbu50297$Logical processing order is FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY.$dbu50297$, 1, 5),
  ($dbu50298$tq-dbms-sql-15-where-vs-having-7$dbu50298$, $dbu50299$pt-dbms-sql-15-where-vs-having$dbu50299$,
   $dbu50300$Is `WHERE SUM(amount) > 300` valid syntax in standard SQL?$dbu50300$,
   $dbu50301$["Yes, always", "No \u2014 aggregate functions cannot appear in WHERE because grouping/aggregation hasn't happened yet at that stage", "Yes, but only in MySQL", "Yes, but only inside a subquery"]$dbu50301$::jsonb,
   1, $dbu50302$WHERE is evaluated per-row before GROUP BY forms groups and computes aggregates, so aggregate functions are illegal there in every mainstream SQL dialect.$dbu50302$, 1, 6),
  ($dbu50303$tq-dbms-sql-15-where-vs-having-8$dbu50303$, $dbu50304$pt-dbms-sql-15-where-vs-having$dbu50304$,
   $dbu50305$A query needs: (1) only Widget-product orders considered, and (2) only regions whose Widget total exceeds 100. Which combination is correct?$dbu50305$,
   $dbu50306$["HAVING product = 'Widget' ... WHERE SUM(amount) > 100", "WHERE product = 'Widget' ... GROUP BY region ... HAVING SUM(amount) > 100", "WHERE product = 'Widget' AND SUM(amount) > 100", "GROUP BY region ... WHERE SUM(amount) > 100 AND product = 'Widget'"]$dbu50306$::jsonb,
   1, $dbu50307$The row-level condition (product = 'Widget') belongs in WHERE, run before grouping; the aggregate-based condition (SUM(amount) > 100 per region) belongs in HAVING, run after grouping.$dbu50307$, 1, 7)
on conflict (id) do nothing;

-- 15.4 Multiple Grouping Columns
with g as (select id from public.learning_grids where lower(slug) = $dbu50308$dbms-sql-tutorial$dbu50308$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50309$chapter-15-group-by-and-aggregation$dbu50309$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50310$Multiple Grouping Columns$dbu50310$, $dbu50311$multiple-grouping-columns$dbu50311$, '', 4, 'published', true, true, $dbu50312$dbms_sql_tutorial$dbu50312$, $dbu50313$chapter-15-group-by-and-aggregation/multiple-grouping-columns$dbu50313$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50314$dbms_sql_tutorial$dbu50314$ and source_ref = $dbu50315$chapter-15-group-by-and-aggregation/multiple-grouping-columns$dbu50315$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50316$Multiple Grouping Columns$dbu50316$, $dbu50317$### Grouping by More Than One Column

`GROUP BY` accepts a comma-separated list of columns. Instead of one row per distinct value of a single column, you get one row per distinct **combination** of values across all listed columns.

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### Example

```sql
SELECT region, product, SUM(amount) AS total_amount, COUNT(*) AS order_count
FROM orders
GROUP BY region, product
ORDER BY region, product;
```

Every unique `(region, product)` pair present in the data becomes its own group:

| region | product | total_amount | order_count |
|--------|---------|---------------|-------------|
| East   | Gadget  | 150           | 1           |
| East   | Widget  | 160           | 2           |
| North  | Gadget  | 80            | 1           |
| North  | Widget  | 120           | 1           |
| West   | Gadget  | 300           | 1           |
| West   | Widget  | 250           | 2           |

Six output rows for eight input rows — because there happen to be exactly six distinct `(region, product)` combinations in the data (East has both Widget rows 1 and 8 merged into `East/Widget = 160`; West has both Widget rows 3 and 4 merged into `West/Widget = 250`).

### Column Order Matters for Meaning, Not for Grouping Result

`GROUP BY region, product` and `GROUP BY product, region` produce the **same set of groups** (grouping is set-based, unordered), but:
- The column order in `GROUP BY` has no effect on which rows end up together.
- It *can* interact with `ORDER BY` and with hierarchical extensions like `ROLLUP` (Topic 15.7), where column order defines the subtotal hierarchy.

### The SELECT-List Rule, Extended

The same rule from Topic 15.1 applies with multiple columns: every non-aggregated column in `SELECT` must be listed in `GROUP BY`. Here, both `region` and `product` must appear in `GROUP BY` since both appear ungrouped in `SELECT`.

```sql
-- Invalid: 'product' is selected but not grouped and not aggregated
SELECT region, product, SUM(amount) FROM orders GROUP BY region;
```

### Edge Cases

- **More grouping columns → more, smaller groups.** Grouping by `region` alone gave 3 groups; adding `product` splits those into 6 (more granular, but each group has fewer/smaller aggregates — e.g. East's total of 310 splits into Gadget=150 and Widget=160).
- **A combination with no matching rows never appears.** There's no `North/Gadget` row missing here, but in general, `GROUP BY` only ever produces groups for combinations that exist in the data — it will not manufacture a `(region, product)` row for a pairing that has zero matching orders. (Contrast this with `GROUPING SETS`/`CUBE` in 15.6–15.8, which can surface subtotal rows that aggregate *across* one of the dimensions.)
- **NULL combinations**: if either grouping column can be `NULL`, rows with `NULL` in that column form their own group, combined with whatever the other column's value is.
- **Too many columns → too many tiny groups**: grouping by every column in a wide table degenerates toward one group per row, defeating the purpose of aggregation.

### Key Takeaways / Interview Q&A

- **Q: What does `GROUP BY region, product` produce?**
  A: One row per unique (region, product) combination actually present in the data — 6 rows here, not 3×3=9, because not every theoretical pairing exists.
- **Q: Does the order of columns in GROUP BY change the result set?**
  A: No, the set of groups is identical either way; only ORDER BY (and hierarchical extensions like ROLLUP) care about column order.
- **Q: What is East's Widget-only total in this data?**
  A: 160 (orders 1 and 8: 100 + 60).
- **Q: If you add a third grouping column, what happens to group granularity?**
  A: Groups get smaller/more numerous — each additional grouping column can only split existing groups further, never merge them.$dbu50317$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50318$dbms_sql_tutorial_seed$dbu50318$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50319$dbms_sql_tutorial_seed$dbu50319$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50320$dbms-sql-tutorial$dbu50320$),
     t as (select id from public.learning_topics where source_kind = $dbu50321$dbms_sql_tutorial$dbu50321$ and source_ref = $dbu50322$chapter-15-group-by-and-aggregation/multiple-grouping-columns$dbu50322$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50323$pt-dbms-sql-15-multiple-grouping-columns$dbu50323$, $dbu50324$Multiple Grouping Columns - Quick Test$dbu50324$, 'aptitude', 8, 8,
  $dbu50325$8 questions on Multiple Grouping Columns.$dbu50325$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50326$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50326$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50327$tq-dbms-sql-15-multiple-grouping-columns-1$dbu50327$, $dbu50328$pt-dbms-sql-15-multiple-grouping-columns$dbu50328$,
   $dbu50329$What does `GROUP BY region, product` produce?$dbu50329$,
   $dbu50330$["One row per region, ignoring product", "One row per unique combination of region and product present in the data", "One row per product only", "An error, since GROUP BY only accepts one column"]$dbu50330$::jsonb,
   1, $dbu50331$Multiple grouping columns partition rows by the combination of all listed columns' values.$dbu50331$, 1, 0),
  ($dbu50332$tq-dbms-sql-15-multiple-grouping-columns-2$dbu50332$, $dbu50333$pt-dbms-sql-15-multiple-grouping-columns$dbu50333$,
   $dbu50334$How many rows does `SELECT region, product, SUM(amount) FROM orders GROUP BY region, product;` return for the 8-row orders table?$dbu50334$,
   $dbu50335$["3, one per region", "8, one per raw row", "6, one per distinct (region, product) pair present", "9, one per theoretical region x product combination"]$dbu50335$::jsonb,
   2, $dbu50336$There are exactly 6 distinct (region, product) pairs in the data (East/Gadget, East/Widget, North/Gadget, North/Widget, West/Gadget, West/Widget) since East and West each only have Widget+Gadget, not a 9th combination.$dbu50336$, 1, 1),
  ($dbu50337$tq-dbms-sql-15-multiple-grouping-columns-3$dbu50337$, $dbu50338$pt-dbms-sql-15-multiple-grouping-columns$dbu50338$,
   $dbu50339$What is the total amount for the (East, Widget) group, given orders 1 (East, Widget, 100) and 8 (East, Widget, 60)?$dbu50339$,
   $dbu50340$["100", "60", "160", "310"]$dbu50340$::jsonb,
   2, $dbu50341$Both East/Widget rows merge into one group: 100 + 60 = 160.$dbu50341$, 1, 2),
  ($dbu50342$tq-dbms-sql-15-multiple-grouping-columns-4$dbu50342$, $dbu50343$pt-dbms-sql-15-multiple-grouping-columns$dbu50343$,
   $dbu50344$Does `GROUP BY region, product` return a different set of groups than `GROUP BY product, region`?$dbu50344$,
   $dbu50345$["Yes, completely different groups", "No \u2014 the resulting groups are the same set either way; only column order in ORDER BY or ROLLUP is affected", "Yes, but only if there are NULLs", "It depends on the database vendor"]$dbu50345$::jsonb,
   1, $dbu50346$Grouping is a set operation over column combinations; listing columns in a different order does not change which rows end up in which group.$dbu50346$, 1, 3),
  ($dbu50347$tq-dbms-sql-15-multiple-grouping-columns-5$dbu50347$, $dbu50348$pt-dbms-sql-15-multiple-grouping-columns$dbu50348$,
   $dbu50349$In `SELECT region, product, SUM(amount) FROM orders GROUP BY region;` (product NOT in GROUP BY), what happens?$dbu50349$,
   $dbu50350$["product silently returns NULL for every row", "It's an error in PostgreSQL/standard SQL \u2014 product is neither grouped nor aggregated", "It groups by product automatically", "It returns the first product value found per region, silently, everywhere"]$dbu50350$::jsonb,
   1, $dbu50351$Every ungrouped, non-aggregated SELECT column must be in GROUP BY. product violates this here.$dbu50351$, 1, 4),
  ($dbu50352$tq-dbms-sql-15-multiple-grouping-columns-6$dbu50352$, $dbu50353$pt-dbms-sql-15-multiple-grouping-columns$dbu50353$,
   $dbu50354$If a (region, product) combination has zero matching orders rows, does plain GROUP BY produce a row for it?$dbu50354$,
   $dbu50355$["Yes, with SUM shown as 0", "Yes, with SUM shown as NULL", "No \u2014 GROUP BY only ever produces groups for combinations that exist in the underlying data", "Only if HAVING is also used"]$dbu50355$::jsonb,
   2, $dbu50356$Plain GROUP BY never manufactures rows for combinations absent from the data; it only groups rows that actually exist.$dbu50356$, 1, 5),
  ($dbu50357$tq-dbms-sql-15-multiple-grouping-columns-7$dbu50357$, $dbu50358$pt-dbms-sql-15-multiple-grouping-columns$dbu50358$,
   $dbu50359$Compared to grouping by region alone (3 groups), what effect does adding product as a second grouping column have?$dbu50359$,
   $dbu50360$["It merges groups into fewer, larger buckets", "It splits existing groups into more, smaller/finer-grained buckets (6 groups here)", "It has no effect on the number of groups", "It removes the need for aggregate functions"]$dbu50360$::jsonb,
   1, $dbu50361$Adding a grouping column can only further subdivide existing groups, going from 3 region-groups to 6 (region, product)-groups.$dbu50361$, 1, 6),
  ($dbu50362$tq-dbms-sql-15-multiple-grouping-columns-8$dbu50362$, $dbu50363$pt-dbms-sql-15-multiple-grouping-columns$dbu50363$,
   $dbu50364$If the product column could contain NULL values, how would GROUP BY region, product treat rows where product IS NULL for a given region?$dbu50364$,
   $dbu50365$["Those rows are excluded from all results", "Rows with NULL product for the same region form their own group, combined with that region's value", "NULL causes an error during grouping", "Each NULL row becomes its own separate group regardless of region"]$dbu50365$::jsonb,
   1, $dbu50366$NULLs are treated as equal to each other for grouping purposes, so all NULL-product rows sharing the same region value fall into a single (region, NULL) group.$dbu50366$, 1, 7)
on conflict (id) do nothing;

-- 15.5 Conditional Aggregation
with g as (select id from public.learning_grids where lower(slug) = $dbu50367$dbms-sql-tutorial$dbu50367$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50368$chapter-15-group-by-and-aggregation$dbu50368$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50369$Conditional Aggregation$dbu50369$, $dbu50370$conditional-aggregation$dbu50370$, '', 5, 'published', true, true, $dbu50371$dbms_sql_tutorial$dbu50371$, $dbu50372$chapter-15-group-by-and-aggregation/conditional-aggregation$dbu50372$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50373$dbms_sql_tutorial$dbu50373$ and source_ref = $dbu50374$chapter-15-group-by-and-aggregation/conditional-aggregation$dbu50374$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50375$Conditional Aggregation$dbu50375$, $dbu50376$### The Idea: CASE WHEN Inside an Aggregate

Conditional aggregation uses a `CASE WHEN` expression *inside* an aggregate function argument, so a single `GROUP BY` pass can compute several differently-filtered aggregates side by side — one column per condition — instead of running multiple `GROUP BY` queries (one per condition) and stitching results together.

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### Motivating Problem

Without conditional aggregation, getting "revenue from Widget orders" and "revenue from Gadget orders" per region as separate columns would require either two separate queries or a self-join. With `CASE WHEN` inside `SUM`, one query does it:

```sql
SELECT region,
       SUM(CASE WHEN product = 'Widget' THEN amount ELSE 0 END) AS widget_revenue,
       SUM(CASE WHEN product = 'Gadget' THEN amount ELSE 0 END) AS gadget_revenue
FROM orders
GROUP BY region
ORDER BY region;
```

Result:

| region | widget_revenue | gadget_revenue |
|--------|-----------------|-----------------|
| East   | 160             | 150             |
| North  | 120             | 80              |
| West   | 250             | 300             |

Each `SUM(CASE WHEN ...)` scans the *same* group's rows once, but only adds `amount` into the running total when the condition matches (and adds `0` — a neutral value for `SUM` — otherwise). The row-per-region granularity of a plain `GROUP BY region` is preserved; the pivoting into per-product columns happens *inside* each aggregate.

### Conditional COUNT

The same pattern works for counts — omit the `ELSE` (or use `ELSE NULL`, which is the default) so `COUNT` only counts matching rows, since `COUNT(expr)` ignores `NULL`s:

```sql
SELECT region,
       COUNT(CASE WHEN product = 'Widget' THEN 1 END) AS widget_orders,
       COUNT(CASE WHEN product = 'Gadget' THEN 1 END) AS gadget_orders
FROM orders
GROUP BY region
ORDER BY region;
```

| region | widget_orders | gadget_orders |
|--------|----------------|----------------|
| East   | 2              | 1              |
| North  | 1              | 1              |
| West   | 2              | 1              |

Note the `ELSE` branch is *omitted* here on purpose — a `CASE` with no matching `WHEN` and no `ELSE` returns `NULL`, and `COUNT(expr)` never counts `NULL`s. If you had instead used `ELSE 0`, `COUNT` would incorrectly count *every* row (since `0` is not `NULL`), inflating the result — a common bug.

### A Compact Pivot Alternative Style

`FILTER` (PostgreSQL-specific, standard SQL:2003) does the same thing more readably:

```sql
SELECT region,
       SUM(amount) FILTER (WHERE product = 'Widget') AS widget_revenue,
       SUM(amount) FILTER (WHERE product = 'Gadget') AS gadget_revenue
FROM orders
GROUP BY region
ORDER BY region;
```

This gives identical results to the `CASE WHEN` version but reads more clearly; it is not portable to every dialect (e.g., not in standard MySQL), whereas `CASE WHEN` works virtually everywhere.

### Edge Cases

- **SUM's ELSE must be a neutral value (0)**, but **COUNT's "ELSE" should be absent/NULL**, not 0 — mixing these up is the single most common conditional-aggregation bug.
- **AVG with CASE WHEN and ELSE 0 is wrong** — it would count non-matching rows as zeros in the denominator, skewing the average down. Use `AVG(CASE WHEN cond THEN amount END)` with no `ELSE` (defaults to `NULL`, which `AVG` correctly ignores) instead.
- Conditional aggregation composes with `HAVING`: e.g. `HAVING SUM(CASE WHEN product='Widget' THEN amount ELSE 0 END) > 200`.

### Key Takeaways / Interview Q&A

- **Q: Why use CASE WHEN inside SUM instead of running one query per product?**
  A: It computes all conditional totals in a single pass over the data, in one row per group, instead of separate queries that each rescan the table.
- **Q: What is East's widget_revenue here?**
  A: 160 (orders 1 and 8 combined: 100 + 60).
- **Q: What's the bug in `COUNT(CASE WHEN product='Widget' THEN 1 ELSE 0 END)`?**
  A: It counts every row (since ELSE 0 is never NULL), not just Widget rows — omit the ELSE entirely so non-matches become NULL and get skipped by COUNT.
- **Q: What's the PostgreSQL shorthand for conditional aggregation?**
  A: `agg(expr) FILTER (WHERE condition)`.$dbu50376$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50377$dbms_sql_tutorial_seed$dbu50377$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50378$dbms_sql_tutorial_seed$dbu50378$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50379$dbms-sql-tutorial$dbu50379$),
     t as (select id from public.learning_topics where source_kind = $dbu50380$dbms_sql_tutorial$dbu50380$ and source_ref = $dbu50381$chapter-15-group-by-and-aggregation/conditional-aggregation$dbu50381$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50382$pt-dbms-sql-15-conditional-aggregation$dbu50382$, $dbu50383$Conditional Aggregation - Quick Test$dbu50383$, 'aptitude', 8, 8,
  $dbu50384$8 questions on Conditional Aggregation.$dbu50384$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50385$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50385$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50386$tq-dbms-sql-15-conditional-aggregation-1$dbu50386$, $dbu50387$pt-dbms-sql-15-conditional-aggregation$dbu50387$,
   $dbu50388$What is the purpose of putting a CASE WHEN expression inside an aggregate function like SUM?$dbu50388$,
   $dbu50389$["To sort the aggregate results", "To compute multiple differently-conditioned aggregate values in a single GROUP BY pass, one per column", "To filter out NULL rows automatically", "To convert the aggregate to a string"]$dbu50389$::jsonb,
   1, $dbu50390$Conditional aggregation lets one query produce several conditionally-computed aggregate columns per group, avoiding multiple separate queries.$dbu50390$, 1, 0),
  ($dbu50391$tq-dbms-sql-15-conditional-aggregation-2$dbu50391$, $dbu50392$pt-dbms-sql-15-conditional-aggregation$dbu50392$,
   $dbu50393$Given `SUM(CASE WHEN product = 'Widget' THEN amount ELSE 0 END)` grouped by region, what is the East region's result?$dbu50393$,
   $dbu50394$["310 (all East orders)", "160 (East's Widget-only orders: 100 + 60)", "150 (East's Gadget order)", "0"]$dbu50394$::jsonb,
   1, $dbu50395$Only East's two Widget orders (100 and 60) contribute their amount; the Gadget order contributes 0, so the sum is 160.$dbu50395$, 1, 1),
  ($dbu50396$tq-dbms-sql-15-conditional-aggregation-3$dbu50396$, $dbu50397$pt-dbms-sql-15-conditional-aggregation$dbu50397$,
   $dbu50398$Why must the ELSE branch of a CASE inside SUM use 0, not NULL?$dbu50398$,
   $dbu50399$["SUM ignores 0 just like NULL, so it doesn't matter", "SUM ignores NULLs when summing, so using NULL for non-matching rows works too, and either can be defensible \u2014 but 0 makes the additive intent explicit and guarantees a non-NULL result even if a group has zero matches", "NULL would cause a syntax error inside CASE", "0 makes SUM return a string instead of a number"]$dbu50399$::jsonb,
   1, $dbu50400$SUM ignores NULLs during aggregation, so ELSE NULL(default) also works for SUM; ELSE 0 is the conventional choice because it also guarantees SUM never returns NULL for a group with zero matches.$dbu50400$, 1, 2),
  ($dbu50401$tq-dbms-sql-15-conditional-aggregation-4$dbu50401$, $dbu50402$pt-dbms-sql-15-conditional-aggregation$dbu50402$,
   $dbu50403$Why should COUNT(CASE WHEN product='Widget' THEN 1 END) omit the ELSE clause rather than using ELSE 0?$dbu50403$,
   $dbu50404$["ELSE 0 causes a syntax error in COUNT", "COUNT(expr) skips NULLs but counts every non-NULL value including 0, so ELSE 0 would incorrectly count non-matching rows too", "COUNT cannot be used with CASE at all", "Omitting ELSE makes the query run faster with no functional difference"]$dbu50404$::jsonb,
   1, $dbu50405$COUNT(expr) counts all non-NULL values. If ELSE 0 is used, non-matching rows produce 0 (not NULL) and get counted, inflating the result; omitting ELSE defaults to NULL, which COUNT correctly skips.$dbu50405$, 1, 3),
  ($dbu50406$tq-dbms-sql-15-conditional-aggregation-5$dbu50406$, $dbu50407$pt-dbms-sql-15-conditional-aggregation$dbu50407$,
   $dbu50408$What does `COUNT(CASE WHEN product = 'Widget' THEN 1 END)` return for the West region, given West has orders 3 (Widget), 4 (Widget), and 5 (Gadget)?$dbu50408$,
   $dbu50409$["3", "1", "2", "0"]$dbu50409$::jsonb,
   2, $dbu50410$West has exactly 2 Widget orders (id 3 and id 4); the Gadget order (id 5) produces NULL and is skipped by COUNT.$dbu50410$, 1, 4),
  ($dbu50411$tq-dbms-sql-15-conditional-aggregation-6$dbu50411$, $dbu50412$pt-dbms-sql-15-conditional-aggregation$dbu50412$,
   $dbu50413$What is the PostgreSQL-specific shorthand equivalent to `SUM(CASE WHEN product = 'Widget' THEN amount ELSE 0 END)`?$dbu50413$,
   $dbu50414$["SUM(amount) WHERE product = 'Widget'", "SUM(amount) FILTER (WHERE product = 'Widget')", "SUM(amount) GROUP BY product = 'Widget'", "SUM(amount) HAVING product = 'Widget'"]$dbu50414$::jsonb,
   1, $dbu50415$The FILTER clause (standard SQL:2003, well-supported in PostgreSQL) is a more readable alternative to CASE WHEN for conditional aggregation, though it's not portable to every dialect.$dbu50415$, 1, 5),
  ($dbu50416$tq-dbms-sql-15-conditional-aggregation-7$dbu50416$, $dbu50417$pt-dbms-sql-15-conditional-aggregation$dbu50417$,
   $dbu50418$Why is `AVG(CASE WHEN product = 'Widget' THEN amount ELSE 0 END)` typically WRONG for computing 'average Widget order amount'?$dbu50418$,
   $dbu50419$["AVG cannot accept CASE expressions", "The ELSE 0 rows count toward the denominator, dragging the average down artificially for non-matching rows", "AVG always ignores CASE WHEN entirely", "It's actually correct as written"]$dbu50419$::jsonb,
   1, $dbu50420$AVG divides by the count of non-NULL values it sees. Using ELSE 0 makes every non-matching row count as a zero-valued entry in that average, skewing it low; omitting ELSE (defaulting to NULL) correctly excludes non-matching rows from both the sum and the count.$dbu50420$, 1, 6),
  ($dbu50421$tq-dbms-sql-15-conditional-aggregation-8$dbu50421$, $dbu50422$pt-dbms-sql-15-conditional-aggregation$dbu50422$,
   $dbu50423$How many total output rows does the conditional-aggregation query `SELECT region, SUM(CASE...) AS widget_revenue, SUM(CASE...) AS gadget_revenue FROM orders GROUP BY region` produce?$dbu50423$,
   $dbu50424$["8, one per raw order row", "6, one per (region, product) pair", "3, one per region, with both revenue figures as columns", "1, a single grand total row"]$dbu50424$::jsonb,
   2, $dbu50425$The GROUP BY is still just by region (3 groups); conditional aggregation pivots the product breakdown into separate columns within each region's single row, rather than creating extra rows.$dbu50425$, 1, 7)
on conflict (id) do nothing;

-- 15.6 GROUPING SETS Concept
with g as (select id from public.learning_grids where lower(slug) = $dbu50426$dbms-sql-tutorial$dbu50426$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50427$chapter-15-group-by-and-aggregation$dbu50427$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50428$GROUPING SETS Concept$dbu50428$, $dbu50429$grouping-sets-concept$dbu50429$, '', 6, 'published', true, true, $dbu50430$dbms_sql_tutorial$dbu50430$, $dbu50431$chapter-15-group-by-and-aggregation/grouping-sets-concept$dbu50431$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50432$dbms_sql_tutorial$dbu50432$ and source_ref = $dbu50433$chapter-15-group-by-and-aggregation/grouping-sets-concept$dbu50433$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50434$GROUPING SETS Concept$dbu50434$, $dbu50435$### One Query, Multiple Grouping Levels

`GROUPING SETS` lets a single query compute aggregates at **several different grouping levels at once** — e.g., totals by region, totals by product, AND a grand total — instead of writing three separate `GROUP BY` queries and combining them with `UNION ALL`.

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### The "Old Way": Three Queries + UNION ALL

```sql
SELECT region, NULL AS product, SUM(amount) AS total_amount FROM orders GROUP BY region
UNION ALL
SELECT NULL, product, SUM(amount) FROM orders GROUP BY product
UNION ALL
SELECT NULL, NULL, SUM(amount) FROM orders;
```

This works, but it scans the `orders` table three separate times (once per `SELECT`) and is verbose and error-prone to keep in sync.

### The GROUPING SETS Way

```sql
SELECT region, product, SUM(amount) AS total_amount
FROM orders
GROUP BY GROUPING SETS ((region), (product), ())
ORDER BY region, product;
```

This computes all three grouping levels in **one** query, conceptually scanning the base table once:

| region | product | total_amount |
|--------|---------|---------------|
| East   | NULL    | 310           |
| North  | NULL    | 200           |
| West   | NULL    | 550           |
| NULL   | Gadget  | 530           |
| NULL   | Widget  | 530           |
| NULL   | NULL    | 1060          |

- `(region)` → subtotal per region (3 rows), `product` shows `NULL` because that grouping set didn't group by product.
- `(product)` → subtotal per product (2 rows: Widget = 530, Gadget = 530 — coincidentally equal here), `region` shows `NULL`.
- `()` → the empty grouping set = grand total across everything (1 row, both columns `NULL`), amount = 1060.

Six rows total, one query, one logical scan of the base data.

### Distinguishing a Subtotal Row from a Real NULL

A `NULL` appearing in `region` here means "this row is a subtotal that ignored region," **not** "there's an order with an unknown region." If the underlying data can also contain genuine `NULL`s in a grouping column, this becomes ambiguous — that's what the `GROUPING()` function is for: `GROUPING(region) = 1` marks a subtotal row, `GROUPING(region) = 0` marks a real per-region row (even one whose region happens to be an actual `NULL` value).

```sql
SELECT region, product, SUM(amount) AS total_amount,
       GROUPING(region) AS is_region_subtotal
FROM orders
GROUP BY GROUPING SETS ((region), (product), ());
```

### Dialect Support (Important Caveat)

`GROUPING SETS` is standard SQL and well supported in **PostgreSQL, SQL Server, and Oracle**. **MySQL does not support `GROUPING SETS`** (as of mainstream MySQL 8.x) — it only offers the simpler `WITH ROLLUP` modifier (Topic 15.7), which cannot express arbitrary, non-hierarchical combinations like "by region, by product, AND grand total" in one shot. On MySQL, the manual `UNION ALL` approach above is the fallback.

### Edge Cases

- Grouping sets can be arbitrary and non-hierarchical: `GROUPING SETS ((region, product), (region), ())` is valid and different from `ROLLUP`, which always nests strictly left-to-right.
- An empty set `()` always means "grand total across all rows," regardless of how many columns appear elsewhere in the `GROUPING SETS` list.
- Combining `GROUPING SETS` with `HAVING` filters the final combined result set, applied per output row (i.e., per grouping-level row), not per underlying base row.

### Key Takeaways / Interview Q&A

- **Q: What problem does GROUPING SETS solve?**
  A: Computing multiple different grouping levels (e.g., by region, by product, grand total) in one query and one logical table scan, instead of several UNIONed queries.
- **Q: What does an empty grouping set `()` represent?**
  A: The grand total row, with every grouping column shown as NULL.
- **Q: How do you tell a "real" NULL apart from a subtotal NULL?**
  A: Use the `GROUPING()` function, which returns 1 for a subtotal/rollup row and 0 for an actual per-value row.
- **Q: Does MySQL support GROUPING SETS?**
  A: No — MySQL only supports the simpler `WITH ROLLUP`; full GROUPING SETS require PostgreSQL, SQL Server, or Oracle.$dbu50435$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50436$dbms_sql_tutorial_seed$dbu50436$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50437$dbms_sql_tutorial_seed$dbu50437$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50438$dbms-sql-tutorial$dbu50438$),
     t as (select id from public.learning_topics where source_kind = $dbu50439$dbms_sql_tutorial$dbu50439$ and source_ref = $dbu50440$chapter-15-group-by-and-aggregation/grouping-sets-concept$dbu50440$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50441$pt-dbms-sql-15-grouping-sets-concept$dbu50441$, $dbu50442$GROUPING SETS Concept - Quick Test$dbu50442$, 'aptitude', 8, 8,
  $dbu50443$8 questions on GROUPING SETS Concept.$dbu50443$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50444$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50444$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50445$tq-dbms-sql-15-grouping-sets-concept-1$dbu50445$, $dbu50446$pt-dbms-sql-15-grouping-sets-concept$dbu50446$,
   $dbu50447$What does `GROUP BY GROUPING SETS ((region), (product), ())` compute?$dbu50447$,
   $dbu50448$["Only a per-region total", "Per-region totals, per-product totals, and a grand total, all in one query", "A per-(region, product) breakdown only", "An error, since GROUPING SETS requires ROLLUP"]$dbu50448$::jsonb,
   1, $dbu50449$Each set in the list defines one grouping level: (region), (product), and the empty set () for the grand total — all computed together.$dbu50449$, 1, 0),
  ($dbu50450$tq-dbms-sql-15-grouping-sets-concept-2$dbu50450$, $dbu50451$pt-dbms-sql-15-grouping-sets-concept$dbu50451$,
   $dbu50452$In the GROUPING SETS result, what does a row with region = NULL and product = 'Widget' represent?$dbu50452$,
   $dbu50453$["An order whose region field is genuinely unknown", "The subtotal for all Widget orders across every region (530)", "A grand total row", "An error row"]$dbu50453$::jsonb,
   1, $dbu50454$That row comes from the (product) grouping set, which aggregates across all regions for each product — region shows NULL because it wasn't part of that grouping level, and the Widget total is 530.$dbu50454$, 1, 1),
  ($dbu50455$tq-dbms-sql-15-grouping-sets-concept-3$dbu50455$, $dbu50456$pt-dbms-sql-15-grouping-sets-concept$dbu50456$,
   $dbu50457$What does the empty grouping set `()` represent in GROUPING SETS?$dbu50457$,
   $dbu50458$["No output at all", "The grand total across all rows, with every grouping column shown as NULL", "A syntax error", "The same as GROUP BY with no columns, which is disallowed"]$dbu50458$::jsonb,
   1, $dbu50459$() is a valid grouping set representing zero grouping columns — i.e., one row aggregating the entire table, the grand total (1060 here).$dbu50459$, 1, 2),
  ($dbu50460$tq-dbms-sql-15-grouping-sets-concept-4$dbu50460$, $dbu50461$pt-dbms-sql-15-grouping-sets-concept$dbu50461$,
   $dbu50462$How many logical scans of the base `orders` table does `GROUP BY GROUPING SETS ((region), (product), ())` conceptually require, versus three separate GROUP BY queries UNIONed together?$dbu50462$,
   $dbu50463$["Still three scans either way \u2014 no difference", "One scan for GROUPING SETS versus three scans for the UNION ALL approach", "GROUPING SETS requires more scans, not fewer", "Zero scans for GROUPING SETS"]$dbu50463$::jsonb,
   1, $dbu50464$GROUPING SETS lets the engine compute all listed grouping levels from a single pass over the base data, whereas three separate GROUP BY queries combined with UNION ALL each scan the table independently.$dbu50464$, 1, 3),
  ($dbu50465$tq-dbms-sql-15-grouping-sets-concept-5$dbu50465$, $dbu50466$pt-dbms-sql-15-grouping-sets-concept$dbu50466$,
   $dbu50467$How can you distinguish a GROUPING SETS subtotal row's NULL from a genuine NULL value stored in the region column?$dbu50467$,
   $dbu50468$["It's impossible to distinguish them", "Using the GROUPING() function, which returns 1 for a subtotal row and 0 for an actual per-value row", "Subtotal NULLs are always shown as empty string instead", "By checking if product is also NULL"]$dbu50468$::jsonb,
   1, $dbu50469$GROUPING(region) returns 1 when the NULL is a synthesized subtotal/rollup marker and 0 when it reflects a real underlying NULL value in that column.$dbu50469$, 1, 4),
  ($dbu50470$tq-dbms-sql-15-grouping-sets-concept-6$dbu50470$, $dbu50471$pt-dbms-sql-15-grouping-sets-concept$dbu50471$,
   $dbu50472$Does MySQL (mainstream 8.x) support the full GROUPING SETS syntax?$dbu50472$,
   $dbu50473$["Yes, identical to PostgreSQL", "No \u2014 MySQL only supports the simpler WITH ROLLUP modifier, not arbitrary GROUPING SETS", "Yes, but only for two columns", "No, MySQL supports neither GROUPING SETS nor ROLLUP"]$dbu50473$::jsonb,
   1, $dbu50474$MySQL lacks full GROUPING SETS/CUBE support; it offers only WITH ROLLUP, a simpler hierarchical variant. PostgreSQL, SQL Server, and Oracle support full GROUPING SETS.$dbu50474$, 1, 5),
  ($dbu50475$tq-dbms-sql-15-grouping-sets-concept-7$dbu50475$, $dbu50476$pt-dbms-sql-15-grouping-sets-concept$dbu50476$,
   $dbu50477$Is `GROUPING SETS ((region, product), (region), ())` a valid, non-hierarchical set of grouping levels?$dbu50477$,
   $dbu50478$["No, GROUPING SETS must always be strictly hierarchical like ROLLUP", "Yes \u2014 GROUPING SETS can list any arbitrary combination of grouping levels, not just nested/hierarchical ones", "No, this syntax only works inside CUBE", "Yes, but only if columns are listed in reverse order"]$dbu50478$::jsonb,
   1, $dbu50479$Unlike ROLLUP's fixed hierarchy, GROUPING SETS accepts any explicit list of column-set combinations you choose to specify.$dbu50479$, 1, 6),
  ($dbu50480$tq-dbms-sql-15-grouping-sets-concept-8$dbu50480$, $dbu50481$pt-dbms-sql-15-grouping-sets-concept$dbu50481$,
   $dbu50482$What is the grand total row's total_amount value in the GROUPING SETS example over the orders table?$dbu50482$,
   $dbu50483$["530", "1060", "310", "200"]$dbu50483$::jsonb,
   1, $dbu50484$The grand total across all 8 orders (100+150+200+50+300+120+80+60) is 1060.$dbu50484$, 1, 7)
on conflict (id) do nothing;

-- 15.7 ROLLUP Concept
with g as (select id from public.learning_grids where lower(slug) = $dbu50485$dbms-sql-tutorial$dbu50485$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50486$chapter-15-group-by-and-aggregation$dbu50486$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50487$ROLLUP Concept$dbu50487$, $dbu50488$rollup-concept$dbu50488$, '', 7, 'published', true, true, $dbu50489$dbms_sql_tutorial$dbu50489$, $dbu50490$chapter-15-group-by-and-aggregation/rollup-concept$dbu50490$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50491$dbms_sql_tutorial$dbu50491$ and source_ref = $dbu50492$chapter-15-group-by-and-aggregation/rollup-concept$dbu50492$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50493$ROLLUP Concept$dbu50493$, $dbu50494$### ROLLUP: A Hierarchical Shortcut for GROUPING SETS

`ROLLUP` is a special, hierarchical case of `GROUPING SETS` (Topic 15.6). Instead of listing every grouping level explicitly, `ROLLUP(col1, col2, ...)` automatically generates a nested sequence of grouping sets, peeling off one column from the right at a time, ending in the grand total:

`ROLLUP(region, product)` expands to exactly `GROUPING SETS ((region, product), (region), ())`.

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### Example

```sql
SELECT region, product, SUM(amount) AS total_amount
FROM orders
GROUP BY ROLLUP(region, product)
ORDER BY region, product;
```

Result (10 rows: 6 detail + 3 region-subtotals + 1 grand total):

| region | product | total_amount |
|--------|---------|---------------|
| East   | Gadget  | 150           |
| East   | Widget  | 160           |
| East   | NULL    | 310           |
| North  | Gadget  | 80            |
| North  | Widget  | 120           |
| North  | NULL    | 200           |
| West   | Gadget  | 300           |
| West   | Widget  | 250           |
| West   | NULL    | 550           |
| NULL   | NULL    | 1060          |

Reading this:
- The 6 detail rows are the same per-(region, product) breakdown as plain `GROUP BY region, product` (Topic 15.4).
- Each region gets one extra subtotal row (`product = NULL`) summing that region's Widget + Gadget totals — e.g. East: 160 + 150 = 310.
- One final row (`region = NULL, product = NULL`) is the grand total, 1060.

Notice there is **no** product-only subtotal (no row like `region=NULL, product='Widget'`) — that's the key difference from `CUBE` (Topic 15.8). `ROLLUP` only rolls up along the hierarchy from right to left (`region, product` → `region` → nothing); it never produces a "skip the leftmost column" combination.

### Why "Hierarchical"

`ROLLUP` is designed for hierarchies like `(country, state, city)` or `(year, month, day)`, where each subtotal level makes natural sense: totals by city within state within country. Here, `region → product` isn't a "real" hierarchy (products aren't nested inside regions conceptually), so `ROLLUP(region, product)` still works mechanically, but reach for `GROUPING SETS` directly when the grouping levels you want aren't naturally nested.

### Column Order Matters

Unlike plain `GROUP BY`, `ROLLUP`'s column order defines its subtotal hierarchy: `ROLLUP(region, product)` produces region-only subtotals, while `ROLLUP(product, region)` would instead produce product-only subtotals (plus full detail and grand total) — a materially different result set.

### Dialect Support

`ROLLUP` is broadly supported: **PostgreSQL, SQL Server, Oracle** all support the standard `GROUP BY ROLLUP(...)` syntax. **MySQL** supports only the simpler `GROUP BY region, product WITH ROLLUP` syntax (a trailing modifier, not the `ROLLUP(...)` function form), which behaves similarly but has some MySQL-specific quirks (e.g., older MySQL versions show `NULL` labels that can be ambiguous without `GROUPING()`, and it cannot be freely mixed with arbitrary `GROUPING SETS`).

### Edge Cases

- `ROLLUP(region)` with a single column is equivalent to `GROUPING SETS ((region), ())` — per-region totals plus a grand total, no different from adding a manual `UNION ALL` grand-total row.
- Combining with `HAVING` filters the combined output rows (including subtotal/grand-total rows), so `HAVING SUM(amount) > 200` would drop the North subtotal row (200 is not > 200) while keeping East and West's subtotal rows.
- Use `GROUPING(column)` to reliably detect which rows are subtotals versus detail rows, exactly as with `GROUPING SETS`.

### Key Takeaways / Interview Q&A

- **Q: What does ROLLUP(region, product) expand to?**
  A: GROUPING SETS ((region, product), (region), ()) — detail rows, region subtotals, and a grand total.
- **Q: How many rows does GROUP BY ROLLUP(region, product) return here?**
  A: 10 — 6 detail rows + 3 region subtotals + 1 grand total.
- **Q: Does ROLLUP produce a product-only subtotal row?**
  A: No — that's CUBE's job, not ROLLUP's; ROLLUP only rolls up right-to-left along the given column order.
- **Q: Does MySQL support GROUP BY ROLLUP(region, product)?**
  A: Not that exact function syntax — MySQL uses `GROUP BY region, product WITH ROLLUP` instead.$dbu50494$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50495$dbms_sql_tutorial_seed$dbu50495$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50496$dbms_sql_tutorial_seed$dbu50496$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50497$dbms-sql-tutorial$dbu50497$),
     t as (select id from public.learning_topics where source_kind = $dbu50498$dbms_sql_tutorial$dbu50498$ and source_ref = $dbu50499$chapter-15-group-by-and-aggregation/rollup-concept$dbu50499$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50500$pt-dbms-sql-15-rollup-concept$dbu50500$, $dbu50501$ROLLUP Concept - Quick Test$dbu50501$, 'aptitude', 8, 8,
  $dbu50502$8 questions on ROLLUP Concept.$dbu50502$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50503$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50503$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50504$tq-dbms-sql-15-rollup-concept-1$dbu50504$, $dbu50505$pt-dbms-sql-15-rollup-concept$dbu50505$,
   $dbu50506$What grouping sets does `ROLLUP(region, product)` expand to?$dbu50506$,
   $dbu50507$["GROUPING SETS ((region), (product), ())", "GROUPING SETS ((region, product), (region), ())", "GROUPING SETS ((region, product), (product), ())", "GROUPING SETS ((region, product))"]$dbu50507$::jsonb,
   1, $dbu50508$ROLLUP peels off columns from the right, one at a time: full detail (region, product), then (region) alone, then the empty grand-total set — never a product-only set.$dbu50508$, 1, 0),
  ($dbu50509$tq-dbms-sql-15-rollup-concept-2$dbu50509$, $dbu50510$pt-dbms-sql-15-rollup-concept$dbu50510$,
   $dbu50511$How many total rows does `GROUP BY ROLLUP(region, product)` return over the orders table?$dbu50511$,
   $dbu50512$["6", "7", "10", "12"]$dbu50512$::jsonb,
   2, $dbu50513$6 detail rows (per region/product) + 3 region subtotal rows + 1 grand total row = 10.$dbu50513$, 1, 1),
  ($dbu50514$tq-dbms-sql-15-rollup-concept-3$dbu50514$, $dbu50515$pt-dbms-sql-15-rollup-concept$dbu50515$,
   $dbu50516$What is the East region's subtotal row's total_amount in `GROUP BY ROLLUP(region, product)`?$dbu50516$,
   $dbu50517$["160", "150", "310", "1060"]$dbu50517$::jsonb,
   2, $dbu50518$East's subtotal sums its Widget (160) and Gadget (150) totals: 160 + 150 = 310.$dbu50518$, 1, 2),
  ($dbu50519$tq-dbms-sql-15-rollup-concept-4$dbu50519$, $dbu50520$pt-dbms-sql-15-rollup-concept$dbu50520$,
   $dbu50521$Does `GROUP BY ROLLUP(region, product)` produce a row summarizing totals by product alone, ignoring region (e.g., region=NULL, product='Widget')?$dbu50521$,
   $dbu50522$["Yes, always", "No \u2014 ROLLUP only produces subtotals by dropping columns from the right (region-only, then grand total), never a product-only subtotal", "Only if CUBE is also specified", "Only in MySQL"]$dbu50522$::jsonb,
   1, $dbu50523$ROLLUP's hierarchy strictly rolls up right-to-left; a product-only breakdown requires CUBE or an explicit GROUPING SETS entry.$dbu50523$, 1, 3),
  ($dbu50524$tq-dbms-sql-15-rollup-concept-5$dbu50524$, $dbu50525$pt-dbms-sql-15-rollup-concept$dbu50525$,
   $dbu50526$Why does column order matter for ROLLUP but not for plain GROUP BY?$dbu50526$,
   $dbu50527$["It doesn't actually matter for either", "ROLLUP's column order defines which columns get 'peeled off' first for subtotals, so ROLLUP(region, product) and ROLLUP(product, region) produce different subtotal rows; plain GROUP BY just groups by the same combination regardless of listed order", "GROUP BY column order changes which rows are grouped together", "ROLLUP requires columns in reverse alphabetical order"]$dbu50527$::jsonb,
   1, $dbu50528$ROLLUP(a, b) rolls up subtotals as (a,b) -> (a) -> (); reversing to ROLLUP(b, a) instead produces (b,a) -> (b) -> (), a materially different subtotal hierarchy — unlike plain GROUP BY, where grouping is set-based and order-independent.$dbu50528$, 1, 4),
  ($dbu50529$tq-dbms-sql-15-rollup-concept-6$dbu50529$, $dbu50530$pt-dbms-sql-15-rollup-concept$dbu50530$,
   $dbu50531$Which databases support the standard `GROUP BY ROLLUP(region, product)` function syntax?$dbu50531$,
   $dbu50532$["Only MySQL", "PostgreSQL, SQL Server, and Oracle", "No mainstream database supports ROLLUP", "Only SQLite"]$dbu50532$::jsonb,
   1, $dbu50533$PostgreSQL, SQL Server, and Oracle all support the standard ROLLUP(...) function syntax; MySQL instead uses the trailing WITH ROLLUP modifier.$dbu50533$, 1, 5),
  ($dbu50534$tq-dbms-sql-15-rollup-concept-7$dbu50534$, $dbu50535$pt-dbms-sql-15-rollup-concept$dbu50535$,
   $dbu50536$What is MySQL's equivalent syntax for the same rollup behavior, since it lacks ROLLUP(...) as a function?$dbu50536$,
   $dbu50537$["GROUP BY region, product WITH ROLLUP", "GROUP BY ROLLUP region, product", "GROUP BY GROUPING SETS(region, product)", "MySQL has no equivalent at all"]$dbu50537$::jsonb,
   0, $dbu50538$MySQL supports the trailing modifier form, GROUP BY region, product WITH ROLLUP, rather than the ROLLUP(...) function syntax used elsewhere.$dbu50538$, 1, 6),
  ($dbu50539$tq-dbms-sql-15-rollup-concept-8$dbu50539$, $dbu50540$pt-dbms-sql-15-rollup-concept$dbu50540$,
   $dbu50541$If `HAVING SUM(amount) > 200` is applied to `GROUP BY ROLLUP(region, product)`, what happens to the North region's subtotal row (total_amount = 200)?$dbu50541$,
   $dbu50542$["It is kept because 200 is close to 200", "It is dropped, since 200 is not strictly greater than 200", "HAVING cannot be combined with ROLLUP", "It is automatically replaced with the grand total"]$dbu50542$::jsonb,
   1, $dbu50543$HAVING filters every output row from the rollup, including subtotal rows; North's subtotal of exactly 200 fails the strict > 200 condition and is excluded.$dbu50543$, 1, 7)
on conflict (id) do nothing;

-- 15.8 CUBE Concept
with g as (select id from public.learning_grids where lower(slug) = $dbu50544$dbms-sql-tutorial$dbu50544$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50545$chapter-15-group-by-and-aggregation$dbu50545$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50546$CUBE Concept$dbu50546$, $dbu50547$cube-concept$dbu50547$, '', 8, 'published', true, true, $dbu50548$dbms_sql_tutorial$dbu50548$, $dbu50549$chapter-15-group-by-and-aggregation/cube-concept$dbu50549$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50550$dbms_sql_tutorial$dbu50550$ and source_ref = $dbu50551$chapter-15-group-by-and-aggregation/cube-concept$dbu50551$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50552$CUBE Concept$dbu50552$, $dbu50553$### CUBE: Every Possible Combination

`CUBE` is the most exhaustive member of the `GROUPING SETS` family (Topic 15.6). While `ROLLUP` only produces a hierarchical, right-to-left nested sequence of subtotals (Topic 15.7), `CUBE(col1, col2, ...)` produces **every possible combination** of the listed columns — a full power set of grouping levels.

`CUBE(region, product)` expands to `GROUPING SETS ((region, product), (region), (product), ())` — all four possible combinations of "include region," "include product."

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### Example

```sql
SELECT region, product, SUM(amount) AS total_amount
FROM orders
GROUP BY CUBE(region, product)
ORDER BY region, product;
```

Result (12 rows: 6 detail + 3 region subtotals + 2 product subtotals + 1 grand total):

| region | product | total_amount |
|--------|---------|---------------|
| East   | Gadget  | 150           |
| East   | Widget  | 160           |
| East   | NULL    | 310           |
| North  | Gadget  | 80            |
| North  | Widget  | 120           |
| North  | NULL    | 200           |
| West   | Gadget  | 300           |
| West   | Widget  | 250           |
| West   | NULL    | 550           |
| NULL   | Gadget  | 530           |
| NULL   | Widget  | 530           |
| NULL   | NULL    | 1060          |

Compared to `ROLLUP(region, product)`'s 10 rows, `CUBE` adds the two extra product-only subtotal rows (`region=NULL, product='Gadget'` = 530 and `region=NULL, product='Widget'` = 530) that `ROLLUP` never produces.

### CUBE vs ROLLUP, Directly Compared

| | ROLLUP(region, product) | CUBE(region, product) |
|---|---|---|
| Detail rows (region, product) | Yes (6) | Yes (6) |
| Region-only subtotals | Yes (3) | Yes (3) |
| Product-only subtotals | **No** | Yes (2) |
| Grand total | Yes (1) | Yes (1) |
| Total rows | 10 | 12 |

`ROLLUP` assumes a hierarchy (drop columns right-to-left only); `CUBE` makes no such assumption and computes every subset, so it grows combinatorially: with `n` grouping columns, `CUBE` produces `2^n` grouping sets, versus `ROLLUP`'s `n + 1`.

### Why This Beats Manual Queries

Getting this same 12-row result manually would require four separate `GROUP BY` queries (`(region, product)`, `(region)`, `(product)`, and none) combined with `UNION ALL` — four full scans of `orders` instead of one.

### Dialect Support (Important Caveat)

Like `GROUPING SETS`, `CUBE` is supported in **PostgreSQL, SQL Server, and Oracle**. **MySQL does not support `CUBE`** at all (as of mainstream MySQL 8.x) — only the simpler `WITH ROLLUP` modifier exists there. On MySQL, replicating `CUBE`'s output requires manually writing out all `2^n` `GROUP BY`/`UNION ALL` combinations.

### Edge Cases

- `CUBE` with 3+ columns grows fast: `CUBE(a, b, c)` produces `2^3 = 8` grouping sets — every subset from full detail down to the grand total.
- As with `ROLLUP`/`GROUPING SETS`, use `GROUPING(column)` to tell a real stored `NULL` apart from a subtotal-marker `NULL`.
- `CUBE` and `ROLLUP` can technically be combined or mixed with explicit `GROUPING SETS` entries in the same `GROUP BY` clause in dialects that support it (PostgreSQL, SQL Server), for custom combinations.

### Key Takeaways / Interview Q&A

- **Q: What does CUBE(region, product) compute that ROLLUP(region, product) does not?**
  A: The two product-only subtotal rows (Widget=530, Gadget=530 across all regions) — CUBE computes every combination, not just a hierarchical rollup.
- **Q: How many grouping sets does CUBE(a, b, c) produce?**
  A: 2^3 = 8 (every subset of {a, b, c}, including the empty set).
- **Q: How many rows does GROUP BY CUBE(region, product) return here?**
  A: 12 — 6 detail + 3 region subtotals + 2 product subtotals + 1 grand total.
- **Q: Does MySQL support CUBE?**
  A: No — only PostgreSQL, SQL Server, and Oracle support CUBE; MySQL has neither CUBE nor full GROUPING SETS, only WITH ROLLUP.$dbu50553$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50554$dbms_sql_tutorial_seed$dbu50554$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50555$dbms_sql_tutorial_seed$dbu50555$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50556$dbms-sql-tutorial$dbu50556$),
     t as (select id from public.learning_topics where source_kind = $dbu50557$dbms_sql_tutorial$dbu50557$ and source_ref = $dbu50558$chapter-15-group-by-and-aggregation/cube-concept$dbu50558$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50559$pt-dbms-sql-15-cube-concept$dbu50559$, $dbu50560$CUBE Concept - Quick Test$dbu50560$, 'aptitude', 8, 8,
  $dbu50561$8 questions on CUBE Concept.$dbu50561$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50562$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50562$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50563$tq-dbms-sql-15-cube-concept-1$dbu50563$, $dbu50564$pt-dbms-sql-15-cube-concept$dbu50564$,
   $dbu50565$What does `CUBE(region, product)` compute that plain `ROLLUP(region, product)` does not?$dbu50565$,
   $dbu50566$["Nothing extra \u2014 they are identical", "Product-only subtotal rows (ignoring region), in addition to everything ROLLUP produces", "Only the grand total row", "Region-only subtotal rows"]$dbu50566$::jsonb,
   1, $dbu50567$CUBE computes every possible combination of the grouping columns, including product-only subtotals that ROLLUP's strict right-to-left hierarchy never produces.$dbu50567$, 1, 0),
  ($dbu50568$tq-dbms-sql-15-cube-concept-2$dbu50568$, $dbu50569$pt-dbms-sql-15-cube-concept$dbu50569$,
   $dbu50570$How many grouping sets does `CUBE(region, product)` expand to?$dbu50570$,
   $dbu50571$["2: (region), (product)", "3: (region, product), (region), ()", "4: (region, product), (region), (product), ()", "6, one per (region, product) combination"]$dbu50571$::jsonb,
   2, $dbu50572$CUBE produces every subset of its column list: full detail, each single column alone, and the empty set — 4 total for 2 columns (2^2).$dbu50572$, 1, 1),
  ($dbu50573$tq-dbms-sql-15-cube-concept-3$dbu50573$, $dbu50574$pt-dbms-sql-15-cube-concept$dbu50574$,
   $dbu50575$How many total output rows does `GROUP BY CUBE(region, product)` return over the orders table?$dbu50575$,
   $dbu50576$["6", "10", "12", "16"]$dbu50576$::jsonb,
   2, $dbu50577$6 detail rows + 3 region subtotals + 2 product subtotals + 1 grand total = 12.$dbu50577$, 1, 2),
  ($dbu50578$tq-dbms-sql-15-cube-concept-4$dbu50578$, $dbu50579$pt-dbms-sql-15-cube-concept$dbu50579$,
   $dbu50580$What is the value of the product-only subtotal row for Widget (region = NULL, product = 'Widget') under CUBE?$dbu50580$,
   $dbu50581$["160", "250", "530", "1060"]$dbu50581$::jsonb,
   2, $dbu50582$Summing all Widget orders across every region (100+200+50+120+60) gives 530.$dbu50582$, 1, 3),
  ($dbu50583$tq-dbms-sql-15-cube-concept-5$dbu50583$, $dbu50584$pt-dbms-sql-15-cube-concept$dbu50584$,
   $dbu50585$How many grouping sets does `CUBE(a, b, c)` (three columns) produce?$dbu50585$,
   $dbu50586$["3", "4", "6", "8"]$dbu50586$::jsonb,
   3, $dbu50587$CUBE produces 2^n grouping sets for n columns; with 3 columns that's 2^3 = 8, covering every possible subset.$dbu50587$, 1, 4),
  ($dbu50588$tq-dbms-sql-15-cube-concept-6$dbu50588$, $dbu50589$pt-dbms-sql-15-cube-concept$dbu50589$,
   $dbu50590$Which of the following databases support the standard `GROUP BY CUBE(...)` syntax?$dbu50590$,
   $dbu50591$["MySQL only", "PostgreSQL, SQL Server, and Oracle", "SQLite only", "No mainstream database supports it"]$dbu50591$::jsonb,
   1, $dbu50592$PostgreSQL, SQL Server, and Oracle support CUBE natively; MySQL does not support CUBE at all, only the simpler WITH ROLLUP.$dbu50592$, 1, 5),
  ($dbu50593$tq-dbms-sql-15-cube-concept-7$dbu50593$, $dbu50594$pt-dbms-sql-15-cube-concept$dbu50594$,
   $dbu50595$Compared to computing the same 4 grouping levels (detail, region, product, grand total) as 4 separate GROUP BY queries joined with UNION ALL, what is the main advantage of CUBE?$dbu50595$,
   $dbu50596$["CUBE produces fewer rows overall", "CUBE lets the engine compute all combinations from a single logical scan of the base data instead of 4 separate scans", "CUBE is the only way to compute a grand total", "There is no advantage; they are equivalent in every way"]$dbu50596$::jsonb,
   1, $dbu50597$CUBE (like GROUPING SETS and ROLLUP) computes multiple grouping levels from one pass over the data, whereas the UNION ALL approach requires one full scan per separate GROUP BY query.$dbu50597$, 1, 6),
  ($dbu50598$tq-dbms-sql-15-cube-concept-8$dbu50598$, $dbu50599$pt-dbms-sql-15-cube-concept$dbu50599$,
   $dbu50600$In `GROUP BY CUBE(region, product)`, how would you programmatically distinguish the grand total row from a region-only subtotal row?$dbu50600$,
   $dbu50601$["Grand total always sorts first alphabetically", "Check GROUPING(region) and GROUPING(product): the grand total has both equal to 1, while a region-only subtotal has GROUPING(region)=0 and GROUPING(product)=1", "It is impossible to distinguish them", "Check if total_amount is negative"]$dbu50601$::jsonb,
   1, $dbu50602$GROUPING(col) returns 1 when that column was rolled up away (its value is NULL for grouping purposes) for that particular row; the grand total rolls up every column (all GROUPING() = 1), while a region-only subtotal keeps region ungrouped (GROUPING(region)=0) but rolls up product (GROUPING(product)=1).$dbu50602$, 1, 7)
on conflict (id) do nothing;

-- 15.9 Aggregate Query Optimization
with g as (select id from public.learning_grids where lower(slug) = $dbu50603$dbms-sql-tutorial$dbu50603$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50604$chapter-15-group-by-and-aggregation$dbu50604$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50605$Aggregate Query Optimization$dbu50605$, $dbu50606$aggregate-query-optimization$dbu50606$, '', 9, 'published', true, true, $dbu50607$dbms_sql_tutorial$dbu50607$, $dbu50608$chapter-15-group-by-and-aggregation/aggregate-query-optimization$dbu50608$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50609$dbms_sql_tutorial$dbu50609$ and source_ref = $dbu50610$chapter-15-group-by-and-aggregation/aggregate-query-optimization$dbu50610$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50611$Aggregate Query Optimization$dbu50611$, $dbu50612$### Practical Guidance for Faster Aggregate Queries

Aggregate queries (`GROUP BY`, `HAVING`, and their extensions) can become expensive on large tables because they must touch every relevant row before producing a single group's answer. A handful of practical habits keep them fast.

### Running Example

All examples in this chapter use one small `orders` table:

```sql
CREATE TABLE orders (
    id      INT PRIMARY KEY,
    region  VARCHAR(10),
    product VARCHAR(10),
    amount  NUMERIC(8,2)
);
```

| id | region | product | amount |
|----|--------|---------|--------|
| 1  | East   | Widget  | 100    |
| 2  | East   | Gadget  | 150    |
| 3  | West   | Widget  | 200    |
| 4  | West   | Widget  | 50     |
| 5  | West   | Gadget  | 300    |
| 6  | North  | Widget  | 120    |
| 7  | North  | Gadget  | 80     |
| 8  | East   | Widget  | 60     |

Total of all 8 rows: **1060**. Per region: East = 310, West = 550, North = 200. Per product: Widget = 530, Gadget = 530 (100+200+50+120+60 and 150+300+80).

### 1. Filter with WHERE Before Grouping, Whenever Possible

As established in Topic 15.3, `WHERE` runs before `GROUP BY` and eliminates rows that never need to be aggregated at all:

```sql
-- Better: WHERE removes non-West rows before any grouping/aggregation work happens
SELECT region, SUM(amount) FROM orders WHERE region = 'West' GROUP BY region;

-- Worse: aggregates every region, then throws away all but West's group
SELECT region, SUM(amount) FROM orders GROUP BY region HAVING region = 'West';
```

Any condition expressible on raw row values belongs in `WHERE`. Reserve `HAVING` strictly for conditions that genuinely require an aggregate result (e.g., `HAVING SUM(amount) > 400`).

### 2. Index the GROUP BY / WHERE Columns

An index on `region` (or a composite index on `(region, product)` matching your `GROUP BY` column order) can let the database engine either:
- Use an **index scan** to quickly find and skip to the rows for a `WHERE region = 'West'` filter, or
- In some engines, use an ordered index to feed rows into grouping already pre-sorted, avoiding an explicit sort/hash step (a "streaming" aggregate).

Without an index, the engine typically must do a full table scan (reading every row) and then sort or hash all matching rows into groups.

### 3. Aggregate Over Fewer, Narrower Columns

`SELECT region, SUM(amount) FROM orders GROUP BY region` only needs to read `region` and `amount` from each row. A query that instead does `SELECT * , SUM(amount) OVER (...) FROM orders` or otherwise drags every column along costs more I/O and more memory per group, purely from carrying unnecessary data through the aggregation step. Select only the columns you actually need.

### 4. Prefer One GROUPING SETS/ROLLUP/CUBE Query Over Several Separate Ones

As shown in Topics 15.6–15.8, computing multiple grouping levels (by region, by product, grand total) via `GROUPING SETS`/`ROLLUP`/`CUBE` lets the engine read the base table **once** and derive all requested subtotal levels from that single pass. Running three or four separate `GROUP BY` queries and combining them with `UNION ALL` instead re-scans (and often re-sorts) the base table once per query — for a large `orders` table, this difference is the gap between one full scan and several.

```sql
-- One logical scan for 3 grouping levels:
SELECT region, product, SUM(amount)
FROM orders
GROUP BY GROUPING SETS ((region), (product), ());

-- vs. three scans, manually UNIONed — same result, more I/O:
SELECT region, NULL, SUM(amount) FROM orders GROUP BY region
UNION ALL
SELECT NULL, product, SUM(amount) FROM orders GROUP BY product
UNION ALL
SELECT NULL, NULL, SUM(amount) FROM orders;
```

### 5. Watch Out for CUBE's Combinatorial Growth

Because `CUBE(a, b, c, ...)` produces `2^n` grouping sets (Topic 15.8), adding more columns to a `CUBE` can quickly multiply the number of groups the engine must materialize. On a genuinely large table, an unrestrained `CUBE` over many columns can be far more expensive than a targeted `GROUPING SETS` list containing only the specific combinations you actually need.

### Edge Cases

- An index on the `WHERE` column doesn't automatically help `GROUP BY` unless the same (or a covering composite) index also matches the grouping column order.
- `HAVING` conditions can never be sped up by an index, since they run against already-aggregated group results, not raw table rows.
- Adding a `LIMIT` after `GROUP BY`/`HAVING` does not reduce the aggregation work itself — the engine still must compute (or at least partially compute) all groups before it knows which ones to keep, in the general case.

### Key Takeaways / Interview Q&A

- **Q: Why is WHERE generally more efficient than an equivalent HAVING condition on a raw column?**
  A: WHERE discards rows before grouping/aggregation happens, so less data reaches the more expensive grouping step; HAVING discards whole groups after everything has already been aggregated.
- **Q: What kind of index helps a GROUP BY query?**
  A: An index on the grouping column(s) (ideally matching their order), letting the engine scan pre-sorted or quickly skip to relevant rows instead of a full table scan plus sort/hash.
- **Q: Why prefer GROUPING SETS over several separate GROUP BY queries UNIONed together?**
  A: One GROUPING SETS query can compute all requested grouping levels from a single logical scan of the base table, instead of one scan per separate query.
- **Q: What's the risk with CUBE on wide grouping-column lists?**
  A: The number of grouping sets grows as 2^n, so CUBE over many columns can generate and aggregate far more groups than are actually needed.$dbu50612$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50613$dbms_sql_tutorial_seed$dbu50613$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50614$dbms_sql_tutorial_seed$dbu50614$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50615$dbms-sql-tutorial$dbu50615$),
     t as (select id from public.learning_topics where source_kind = $dbu50616$dbms_sql_tutorial$dbu50616$ and source_ref = $dbu50617$chapter-15-group-by-and-aggregation/aggregate-query-optimization$dbu50617$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50618$pt-dbms-sql-15-aggregate-query-optimization$dbu50618$, $dbu50619$Aggregate Query Optimization - Quick Test$dbu50619$, 'aptitude', 8, 8,
  $dbu50620$8 questions on Aggregate Query Optimization.$dbu50620$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50621$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50621$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50622$tq-dbms-sql-15-aggregate-query-optimization-1$dbu50622$, $dbu50623$pt-dbms-sql-15-aggregate-query-optimization$dbu50623$,
   $dbu50624$Which of the following is the single most impactful optimization for an aggregate query with a row-level filter condition?$dbu50624$,
   $dbu50625$["Adding ORDER BY to the result", "Pushing the row-level condition into WHERE instead of HAVING, so it filters rows before grouping/aggregation happens", "Always using CUBE instead of GROUP BY", "Removing all indexes before aggregating"]$dbu50625$::jsonb,
   1, $dbu50626$WHERE eliminates rows before the (more expensive) grouping/aggregation step runs, whereas an equivalent HAVING condition aggregates everything first and then discards groups.$dbu50626$, 1, 0),
  ($dbu50627$tq-dbms-sql-15-aggregate-query-optimization-2$dbu50627$, $dbu50628$pt-dbms-sql-15-aggregate-query-optimization$dbu50628$,
   $dbu50629$How can an index on the GROUP BY column(s) help an aggregate query?$dbu50629$,
   $dbu50630$["It has no effect on GROUP BY performance", "It can let the engine scan rows in an order matching the grouping columns, potentially avoiding a separate sort/hash step, or quickly skip to relevant rows for a matching WHERE filter", "It automatically rewrites HAVING conditions into WHERE conditions", "It only helps ORDER BY, never GROUP BY"]$dbu50630$::jsonb,
   1, $dbu50631$A matching index can let the engine read rows already ordered by the grouping columns (streaming aggregation) or quickly locate rows for a filtered WHERE clause, both of which reduce work versus a full scan plus explicit sort/hash.$dbu50631$, 1, 1),
  ($dbu50632$tq-dbms-sql-15-aggregate-query-optimization-3$dbu50632$, $dbu50633$pt-dbms-sql-15-aggregate-query-optimization$dbu50633$,
   $dbu50634$Why does selecting only the columns actually needed (e.g., region and amount) instead of SELECT * improve an aggregate query's performance?$dbu50634$,
   $dbu50635$["It has no real effect, since aggregation reads the whole table regardless", "It reduces the I/O and memory needed to carry unnecessary column data through the grouping/aggregation step", "It changes the result values returned by SUM", "SELECT * is always forbidden in SQL"]$dbu50635$::jsonb,
   1, $dbu50636$Narrower row reads and less data carried through grouping directly reduce I/O and memory pressure, even though the final aggregate values are unaffected.$dbu50636$, 1, 2),
  ($dbu50637$tq-dbms-sql-15-aggregate-query-optimization-4$dbu50637$, $dbu50638$pt-dbms-sql-15-aggregate-query-optimization$dbu50638$,
   $dbu50639$Why is one GROUP BY GROUPING SETS ((region), (product), ()) query generally more efficient than three separate GROUP BY queries combined with UNION ALL?$dbu50639$,
   $dbu50640$["It returns fewer rows", "It lets the engine compute all requested grouping levels from a single logical scan of the base table, instead of one scan per separate query", "UNION ALL is always disallowed with GROUP BY", "GROUPING SETS uses a completely different, faster aggregate algorithm unrelated to scanning"]$dbu50640$::jsonb,
   1, $dbu50641$GROUPING SETS (and ROLLUP/CUBE) let the engine derive multiple grouping levels from one pass over the base data, avoiding the redundant re-scans that separate UNIONed GROUP BY queries require.$dbu50641$, 1, 3),
  ($dbu50642$tq-dbms-sql-15-aggregate-query-optimization-5$dbu50642$, $dbu50643$pt-dbms-sql-15-aggregate-query-optimization$dbu50643$,
   $dbu50644$Why should CUBE be used cautiously when grouping by many columns?$dbu50644$,
   $dbu50645$["CUBE only works with exactly two columns", "The number of grouping sets grows as 2^n for n columns, so many columns can generate and aggregate a very large number of groups", "CUBE cannot use indexes at all, unlike ROLLUP", "CUBE always returns incorrect totals with more than 2 columns"]$dbu50645$::jsonb,
   1, $dbu50646$CUBE's combinatorial growth (2^n grouping sets) means adding columns can rapidly multiply the number of groups the engine must materialize, which can be wasteful if not all combinations are actually needed.$dbu50646$, 1, 4),
  ($dbu50647$tq-dbms-sql-15-aggregate-query-optimization-6$dbu50647$, $dbu50648$pt-dbms-sql-15-aggregate-query-optimization$dbu50648$,
   $dbu50649$Can an index on the WHERE column speed up a HAVING condition on an aggregate like SUM(amount) > 400?$dbu50649$,
   $dbu50650$["Yes, indexes always speed up HAVING directly", "No \u2014 HAVING conditions run against already-computed group aggregates, not raw table rows, so raw-column indexes cannot speed up the HAVING check itself", "Only if the index is a composite index", "Only in MySQL"]$dbu50650$::jsonb,
   1, $dbu50651$HAVING filters aggregated results after grouping is complete; an index can speed up the underlying scan/grouping (e.g. via WHERE or GROUP BY column ordering) but not the HAVING comparison itself, which operates on already-computed aggregate values.$dbu50651$, 1, 5),
  ($dbu50652$tq-dbms-sql-15-aggregate-query-optimization-7$dbu50652$, $dbu50653$pt-dbms-sql-15-aggregate-query-optimization$dbu50653$,
   $dbu50654$Does adding LIMIT 5 after a GROUP BY ... HAVING clause generally reduce the amount of aggregation work the engine performs, in the general case?$dbu50654$,
   $dbu50655$["Yes, LIMIT always makes the engine skip aggregating unneeded groups entirely", "Not necessarily \u2014 the engine typically still needs to compute (or largely compute) all groups before it can determine which ones satisfy HAVING and rank/limit the output", "LIMIT is disallowed after HAVING", "LIMIT converts HAVING into WHERE automatically"]$dbu50655$::jsonb,
   1, $dbu50656$In general, the engine must aggregate all groups (and evaluate HAVING) before it knows which rows qualify for the final LIMIT, so LIMIT alone doesn't shortcut the aggregation work the way an earlier WHERE filter can.$dbu50656$, 1, 6),
  ($dbu50657$tq-dbms-sql-15-aggregate-query-optimization-8$dbu50657$, $dbu50658$pt-dbms-sql-15-aggregate-query-optimization$dbu50658$,
   $dbu50659$Given the guidance in this topic, which query is the better-optimized way to get 'total amount for West orders only'?$dbu50659$,
   $dbu50660$["SELECT region, SUM(amount) FROM orders GROUP BY region HAVING region = 'West';", "SELECT region, SUM(amount) FROM orders WHERE region = 'West' GROUP BY region;", "Both are equally optimized", "Neither is valid SQL"]$dbu50660$::jsonb,
   1, $dbu50661$The WHERE version filters out non-West rows before any aggregation work happens, avoiding the wasted work of aggregating East/North groups only to discard them via HAVING.$dbu50661$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 16: Joins
-- ---------------------------------------------------------------------------
-- 16.1 INNER JOIN
with g as (select id from public.learning_grids where lower(slug) = $dbu50662$dbms-sql-tutorial$dbu50662$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50663$chapter-16-joins$dbu50663$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50664$INNER JOIN$dbu50664$, $dbu50665$inner-join$dbu50665$, '', 1, 'published', true, true, $dbu50666$dbms_sql_tutorial$dbu50666$, $dbu50667$chapter-16-joins/inner-join$dbu50667$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50668$dbms_sql_tutorial$dbu50668$ and source_ref = $dbu50669$chapter-16-joins/inner-join$dbu50669$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50670$INNER JOIN$dbu50670$, $dbu50671$### Definition

`INNER JOIN` combines rows from two tables, keeping only the rows that have a match on both sides — the most common join type, and the default meaning of a plain `JOIN` with no qualifier.

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
SELECT e.id, e.name, d.name AS department
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;
```

This returns Asha, Rohan, and Neha — each paired with their real department. Vikram is EXCLUDED (his `department_id` is `NULL`, matching nothing), and Marketing never appears (no employee references it). This is exactly the Equi Join concept from relational algebra (7.9), spelled with SQL's `JOIN`/`ON` syntax.

### Edge Cases and Pitfalls

- `INNER JOIN` and plain `JOIN` are exactly the same thing — `INNER` is optional, included only for clarity/explicitness.
- Rows on EITHER side with no match are silently dropped — if you need unmatched rows preserved, that's exactly what `LEFT`/`RIGHT`/`FULL OUTER JOIN` (16.2-16.4) are for.
- Joining on the WRONG column (a common typo, e.g. `ON e.id = d.id` instead of `ON e.department_id = d.id`) doesn't error — it silently produces a wrong, often much smaller or larger, result.

### Key Takeaways

- INNER JOIN keeps only rows matching on both sides; unmatched rows from either table are dropped.
- Plain JOIN defaults to INNER JOIN — the keyword is optional.
- A wrong join column is a silent correctness bug, not an error — double-check join conditions carefully.$dbu50671$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50672$dbms_sql_tutorial_seed$dbu50672$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50673$dbms_sql_tutorial_seed$dbu50673$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50674$dbms-sql-tutorial$dbu50674$),
     t as (select id from public.learning_topics where source_kind = $dbu50675$dbms_sql_tutorial$dbu50675$ and source_ref = $dbu50676$chapter-16-joins/inner-join$dbu50676$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50677$pt-dbms-sql-16-inner-join$dbu50677$, $dbu50678$INNER JOIN - Quick Test$dbu50678$, 'aptitude', 8, 8,
  $dbu50679$8 questions on INNER JOIN.$dbu50679$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50680$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50680$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50681$tq-dbms-sql-16-inner-join-1$dbu50681$, $dbu50682$pt-dbms-sql-16-inner-join$dbu50682$,
   $dbu50683$What does INNER JOIN return?$dbu50683$,
   $dbu50684$["Every row from both tables regardless of match", "Only rows that have a match on both sides", "Only unmatched rows", "Every possible combination of rows"]$dbu50684$::jsonb,
   1, $dbu50685$INNER JOIN keeps only matched rows from both tables.$dbu50685$, 1, 0),
  ($dbu50686$tq-dbms-sql-16-inner-join-2$dbu50686$, $dbu50687$pt-dbms-sql-16-inner-join$dbu50687$,
   $dbu50688$Is plain JOIN (no qualifier) the same as INNER JOIN?$dbu50688$,
   $dbu50689$["No, plain JOIN means something different", "Yes \u2014 INNER is optional and plain JOIN defaults to it", "Plain JOIN means CROSS JOIN", "Plain JOIN is invalid syntax"]$dbu50689$::jsonb,
   1, $dbu50690$INNER is the implicit default when no join type is specified.$dbu50690$, 1, 1),
  ($dbu50691$tq-dbms-sql-16-inner-join-3$dbu50691$, $dbu50692$pt-dbms-sql-16-inner-join$dbu50692$,
   $dbu50693$In the running example, is Vikram included in the INNER JOIN result?$dbu50693$,
   $dbu50694$["Yes, with a NULL department", "No \u2014 his NULL department_id matches nothing in departments, so he's excluded", "Yes, matched to Marketing", "This cannot be determined"]$dbu50694$::jsonb,
   1, $dbu50695$INNER JOIN drops rows with no match, and Vikram has no department_id to match on.$dbu50695$, 1, 2),
  ($dbu50696$tq-dbms-sql-16-inner-join-4$dbu50696$, $dbu50697$pt-dbms-sql-16-inner-join$dbu50697$,
   $dbu50698$Does Marketing appear in the INNER JOIN result?$dbu50698$,
   $dbu50699$["Yes, once", "No \u2014 no employee references department 3, so it has no matching row to join with", "Yes, multiple times", "Only if it has a manager"]$dbu50699$::jsonb,
   1, $dbu50700$With no employees referencing Marketing, INNER JOIN produces no row for it.$dbu50700$, 1, 3),
  ($dbu50701$tq-dbms-sql-16-inner-join-5$dbu50701$, $dbu50702$pt-dbms-sql-16-inner-join$dbu50702$,
   $dbu50703$What happens if a JOIN condition accidentally uses the wrong column (e.g. matching id to id instead of department_id to id)?$dbu50703$,
   $dbu50704$["SQL detects and raises a clear error", "It silently produces a wrong result with no error \u2014 a common, dangerous type of bug", "The join is automatically ignored", "It always returns zero rows"]$dbu50704$::jsonb,
   1, $dbu50705$An incorrect join column is not a syntax error, making it a genuinely dangerous silent-failure class of bug.$dbu50705$, 1, 4),
  ($dbu50706$tq-dbms-sql-16-inner-join-6$dbu50706$, $dbu50707$pt-dbms-sql-16-inner-join$dbu50707$,
   $dbu50708$Which relational algebra concept does INNER JOIN correspond to?$dbu50708$,
   $dbu50709$["Cartesian Product", "Equi Join (a Theta Join restricted to equality)", "Difference", "Projection"]$dbu50709$::jsonb,
   1, $dbu50710$A standard equality-based INNER JOIN is exactly relational algebra's Equi Join.$dbu50710$, 1, 5),
  ($dbu50711$tq-dbms-sql-16-inner-join-7$dbu50711$, $dbu50712$pt-dbms-sql-16-inner-join$dbu50712$,
   $dbu50713$What happens to rows with no match on either side of an INNER JOIN?$dbu50713$,
   $dbu50714$["They're kept with NULLs filled in", "They are silently dropped from the result", "They cause the query to fail", "They're moved to a separate error table"]$dbu50714$::jsonb,
   1, $dbu50715$INNER JOIN's defining behavior is dropping any row lacking a match.$dbu50715$, 1, 6),
  ($dbu50716$tq-dbms-sql-16-inner-join-8$dbu50716$, $dbu50717$pt-dbms-sql-16-inner-join$dbu50717$,
   $dbu50718$Is the INNER keyword required syntax, or purely stylistic?$dbu50718$,
   $dbu50719$["Required \u2014 omitting it is a syntax error", "Purely stylistic/clarifying \u2014 JOIN alone means the same thing", "Required only in PostgreSQL", "INNER changes the join's behavior compared to plain JOIN"]$dbu50719$::jsonb,
   1, $dbu50720$INNER adds clarity but changes nothing about the query's actual behavior.$dbu50720$, 1, 7)
on conflict (id) do nothing;

-- 16.2 LEFT JOIN
with g as (select id from public.learning_grids where lower(slug) = $dbu50721$dbms-sql-tutorial$dbu50721$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50722$chapter-16-joins$dbu50722$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50723$LEFT JOIN$dbu50723$, $dbu50724$left-join$dbu50724$, '', 2, 'published', true, true, $dbu50725$dbms_sql_tutorial$dbu50725$, $dbu50726$chapter-16-joins/left-join$dbu50726$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50727$dbms_sql_tutorial$dbu50727$ and source_ref = $dbu50728$chapter-16-joins/left-join$dbu50728$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50729$LEFT JOIN$dbu50729$, $dbu50730$### Definition

`LEFT JOIN` (or `LEFT OUTER JOIN`) keeps every row from the LEFT table, matching in data from the right table where possible, and filling `NULL` where there's no match.

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
SELECT e.id, e.name, d.name AS department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;
```

Now Vikram DOES appear, with `department = NULL` — his row from `employees` (the "left" table) is preserved regardless of whether a match exists. This is the standard way to answer "show me everything from A, plus whatever matches from B" — and, combined with `WHERE d.id IS NULL`, the anti-join pattern (16.12) for finding exactly the unmatched rows.

### Edge Cases and Pitfalls

- The table order matters: `employees LEFT JOIN departments` preserves employees; swapping to `departments LEFT JOIN employees` would instead preserve departments (and would show Marketing with `NULL` employee columns) — this is a completely different query despite looking superficially similar.
- Filtering on the RIGHT table's column in `WHERE` (instead of `ON`) can silently undo the LEFT JOIN's purpose (already covered in 7.11) — a genuinely common real mistake worth repeating here in the SQL-syntax context specifically.
- `LEFT JOIN` combined with an aggregate (`COUNT`, `SUM`) needs care: `COUNT(d.id)` counts only matched rows (skipping the NULLs from unmatched left rows), while `COUNT(*)` counts every left row regardless — choosing the wrong one silently changes what's being measured.

### Key Takeaways

- LEFT JOIN preserves every row from the left table, filling NULL for unmatched right-side columns.
- Table order determines which side is preserved — swapping tables changes the query's meaning entirely.
- Combined with WHERE right.col IS NULL, LEFT JOIN becomes the anti-join pattern for finding unmatched rows.$dbu50730$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50731$dbms_sql_tutorial_seed$dbu50731$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50732$dbms_sql_tutorial_seed$dbu50732$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50733$dbms-sql-tutorial$dbu50733$),
     t as (select id from public.learning_topics where source_kind = $dbu50734$dbms_sql_tutorial$dbu50734$ and source_ref = $dbu50735$chapter-16-joins/left-join$dbu50735$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50736$pt-dbms-sql-16-left-join$dbu50736$, $dbu50737$LEFT JOIN - Quick Test$dbu50737$, 'aptitude', 8, 8,
  $dbu50738$8 questions on LEFT JOIN.$dbu50738$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50739$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50739$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50740$tq-dbms-sql-16-left-join-1$dbu50740$, $dbu50741$pt-dbms-sql-16-left-join$dbu50741$,
   $dbu50742$What does LEFT JOIN guarantee about the left table's rows?$dbu50742$,
   $dbu50743$["Only matched left rows appear", "Every row from the left table appears, regardless of whether a match exists on the right", "Only unmatched left rows appear", "Left table rows are duplicated for each match"]$dbu50743$::jsonb,
   1, $dbu50744$LEFT JOIN's defining trait is preserving every left-table row.$dbu50744$, 1, 0),
  ($dbu50745$tq-dbms-sql-16-left-join-2$dbu50745$, $dbu50746$pt-dbms-sql-16-left-join$dbu50746$,
   $dbu50747$In the running example, what does Vikram's department show under LEFT JOIN?$dbu50747$,
   $dbu50748$["He is excluded entirely", "NULL, since he has no matching department", "Marketing, by default", "Engineering, by default"]$dbu50748$::jsonb,
   1, $dbu50749$Vikram's row is preserved with NULL filled in for the unmatched department column.$dbu50749$, 1, 1),
  ($dbu50750$tq-dbms-sql-16-left-join-3$dbu50750$, $dbu50751$pt-dbms-sql-16-left-join$dbu50751$,
   $dbu50752$Does swapping the table order (departments LEFT JOIN employees instead of employees LEFT JOIN departments) produce the same result?$dbu50752$,
   $dbu50753$["Yes, LEFT JOIN is symmetric", "No \u2014 swapping changes which table's rows are guaranteed to be preserved, producing a fundamentally different query", "Only the column order changes, not the rows", "This causes a syntax error"]$dbu50753$::jsonb,
   1, $dbu50754$Table order directly determines which side's unmatched rows are kept.$dbu50754$, 1, 2),
  ($dbu50755$tq-dbms-sql-16-left-join-4$dbu50755$, $dbu50756$pt-dbms-sql-16-left-join$dbu50756$,
   $dbu50757$What mistake can silently undo a LEFT JOIN's purpose?$dbu50757$,
   $dbu50758$["Using an alias for the tables", "Filtering the right table's column in WHERE instead of ON, which discards the very NULL rows LEFT JOIN was meant to preserve", "Selecting specific columns instead of *", "Adding an ORDER BY clause"]$dbu50758$::jsonb,
   1, $dbu50759$A WHERE-clause filter on the outer side runs after the join and excludes NULL rows, behaving like an inner join.$dbu50759$, 1, 3),
  ($dbu50760$tq-dbms-sql-16-left-join-5$dbu50760$, $dbu50761$pt-dbms-sql-16-left-join$dbu50761$,
   $dbu50762$In a LEFT JOIN, what's the difference between COUNT(d.id) and COUNT(*)?$dbu50762$,
   $dbu50763$["No difference", "COUNT(d.id) counts only matched right-side rows (skipping NULLs); COUNT(*) counts every left row regardless of match", "COUNT(*) is always smaller", "COUNT(d.id) requires a GROUP BY to work at all"]$dbu50763$::jsonb,
   1, $dbu50764$COUNT of a specific column skips NULLs; COUNT(*) counts rows unconditionally.$dbu50764$, 1, 4),
  ($dbu50765$tq-dbms-sql-16-left-join-6$dbu50765$, $dbu50766$pt-dbms-sql-16-left-join$dbu50766$,
   $dbu50767$What is the standard way to find rows in the left table with NO match in the right table?$dbu50767$,
   $dbu50768$["INNER JOIN with no WHERE clause", "LEFT JOIN combined with WHERE right_table.column IS NULL", "CROSS JOIN with GROUP BY", "RIGHT JOIN alone"]$dbu50768$::jsonb,
   1, $dbu50769$This is the anti-join pattern used throughout the course.$dbu50769$, 1, 5),
  ($dbu50770$tq-dbms-sql-16-left-join-7$dbu50770$, $dbu50771$pt-dbms-sql-16-left-join$dbu50771$,
   $dbu50772$Is LEFT OUTER JOIN different from LEFT JOIN?$dbu50772$,
   $dbu50773$["Yes, they behave completely differently", "No \u2014 OUTER is optional; LEFT JOIN and LEFT OUTER JOIN mean the same thing", "LEFT OUTER JOIN is deprecated", "LEFT OUTER JOIN only works with three or more tables"]$dbu50773$::jsonb,
   1, $dbu50774$The OUTER keyword is optional for LEFT/RIGHT joins, matching how INNER is optional for INNER JOIN.$dbu50774$, 1, 6),
  ($dbu50775$tq-dbms-sql-16-left-join-8$dbu50775$, $dbu50776$pt-dbms-sql-16-left-join$dbu50776$,
   $dbu50777$Does Marketing (a department with no employees) appear in `employees LEFT JOIN departments`?$dbu50777$,
   $dbu50778$["Yes, once with NULL employee columns", "No \u2014 LEFT JOIN preserves the LEFT table's (employees') rows, not unmatched right-table rows", "Yes, once for each employee", "This depends on the ON condition only"]$dbu50778$::jsonb,
   1, $dbu50779$Since departments is the right table here, its unmatched rows (like Marketing) are not preserved by a LEFT JOIN.$dbu50779$, 1, 7)
on conflict (id) do nothing;

-- 16.3 RIGHT JOIN
with g as (select id from public.learning_grids where lower(slug) = $dbu50780$dbms-sql-tutorial$dbu50780$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50781$chapter-16-joins$dbu50781$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50782$RIGHT JOIN$dbu50782$, $dbu50783$right-join$dbu50783$, '', 3, 'published', true, true, $dbu50784$dbms_sql_tutorial$dbu50784$, $dbu50785$chapter-16-joins/right-join$dbu50785$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50786$dbms_sql_tutorial$dbu50786$ and source_ref = $dbu50787$chapter-16-joins/right-join$dbu50787$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50788$RIGHT JOIN$dbu50788$, $dbu50789$### Definition

`RIGHT JOIN` (or `RIGHT OUTER JOIN`) keeps every row from the RIGHT table, matching in data from the left where possible, and filling `NULL` where there's no match — the mirror image of `LEFT JOIN` (16.2).

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
SELECT e.name, d.name AS department
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;
```

This preserves every department, including Marketing (which shows `NULL` for `e.name`, since no employee belongs to it) — while Vikram (no department) is excluded, since `employees` is now the non-preserved side.

### Edge Cases and Pitfalls

- `A RIGHT JOIN B` is exactly equivalent to `B LEFT JOIN A` (with the column order preserved as written) — many style guides recommend always writing `LEFT JOIN` and simply reordering the tables, rather than mixing `LEFT` and `RIGHT` in the same codebase, purely for consistency and readability.
- `RIGHT JOIN` is fully standard SQL and supported everywhere `LEFT JOIN` is — it's not a niche or deprecated feature, just less commonly used in practice since most people default to phrasing queries as `LEFT JOIN`.
- The same WHERE-clause-filters-the-preserved-side pitfall from `LEFT JOIN` (16.2) applies identically here, just mirrored: filtering the LEFT table's column in `WHERE` can undo a `RIGHT JOIN`'s purpose.

### Key Takeaways

- RIGHT JOIN preserves every row from the right table — the mirror image of LEFT JOIN.
- A RIGHT JOIN B is always rewritable as B LEFT JOIN A — many teams standardize on LEFT JOIN for consistency.
- RIGHT JOIN is standard, fully-supported SQL, just less commonly reached for in practice.$dbu50789$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50790$dbms_sql_tutorial_seed$dbu50790$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50791$dbms_sql_tutorial_seed$dbu50791$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50792$dbms-sql-tutorial$dbu50792$),
     t as (select id from public.learning_topics where source_kind = $dbu50793$dbms_sql_tutorial$dbu50793$ and source_ref = $dbu50794$chapter-16-joins/right-join$dbu50794$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50795$pt-dbms-sql-16-right-join$dbu50795$, $dbu50796$RIGHT JOIN - Quick Test$dbu50796$, 'aptitude', 8, 8,
  $dbu50797$8 questions on RIGHT JOIN.$dbu50797$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50798$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50798$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50799$tq-dbms-sql-16-right-join-1$dbu50799$, $dbu50800$pt-dbms-sql-16-right-join$dbu50800$,
   $dbu50801$What does RIGHT JOIN guarantee?$dbu50801$,
   $dbu50802$["Every row from the left table is preserved", "Every row from the right table is preserved, regardless of a left-side match", "Only matched rows from both sides appear", "Every possible row combination appears"]$dbu50802$::jsonb,
   1, $dbu50803$RIGHT JOIN mirrors LEFT JOIN, preserving the right table's rows instead.$dbu50803$, 1, 0),
  ($dbu50804$tq-dbms-sql-16-right-join-2$dbu50804$, $dbu50805$pt-dbms-sql-16-right-join$dbu50805$,
   $dbu50806$Is `employees RIGHT JOIN departments` equivalent to `departments LEFT JOIN employees`?$dbu50806$,
   $dbu50807$["No, they are unrelated queries", "Yes \u2014 RIGHT JOIN can always be rewritten as a LEFT JOIN with the table order swapped", "Only if both tables have the same number of rows", "This equivalence only holds for INNER JOIN"]$dbu50807$::jsonb,
   1, $dbu50808$This is the direct mirror-image relationship between LEFT and RIGHT JOIN.$dbu50808$, 1, 1),
  ($dbu50809$tq-dbms-sql-16-right-join-3$dbu50809$, $dbu50810$pt-dbms-sql-16-right-join$dbu50810$,
   $dbu50811$In the running example, does Marketing appear under a RIGHT JOIN from employees to departments?$dbu50811$,
   $dbu50812$["No, it's excluded since it has no employees", "Yes \u2014 with NULL employee columns, since departments is the preserved (right) side", "Yes, but only if it has a manager", "This cannot be determined without more data"]$dbu50812$::jsonb,
   1, $dbu50813$RIGHT JOIN preserves every department row, including ones with no matching employees.$dbu50813$, 1, 2),
  ($dbu50814$tq-dbms-sql-16-right-join-4$dbu50814$, $dbu50815$pt-dbms-sql-16-right-join$dbu50815$,
   $dbu50816$Why might a team choose to standardize on LEFT JOIN and avoid RIGHT JOIN entirely in their codebase?$dbu50816$,
   $dbu50817$["RIGHT JOIN doesn't actually work in most databases", "For consistency and readability \u2014 since any RIGHT JOIN can be rewritten as an equivalent LEFT JOIN with reordered tables", "RIGHT JOIN is always slower to execute", "RIGHT JOIN cannot be combined with WHERE clauses"]$dbu50817$::jsonb,
   1, $dbu50818$This is a stylistic consistency choice, not a technical limitation of RIGHT JOIN.$dbu50818$, 1, 3),
  ($dbu50819$tq-dbms-sql-16-right-join-5$dbu50819$, $dbu50820$pt-dbms-sql-16-right-join$dbu50820$,
   $dbu50821$Is RIGHT JOIN a deprecated or non-standard SQL feature?$dbu50821$,
   $dbu50822$["Yes, it's non-standard and rarely supported", "No \u2014 it's fully standard SQL, just used less often in practice than LEFT JOIN", "RIGHT JOIN only exists in MySQL", "RIGHT JOIN was removed from modern SQL standards"]$dbu50822$::jsonb,
   1, $dbu50823$RIGHT JOIN is standard and broadly supported; it's simply a less common stylistic choice.$dbu50823$, 1, 4),
  ($dbu50824$tq-dbms-sql-16-right-join-6$dbu50824$, $dbu50825$pt-dbms-sql-16-right-join$dbu50825$,
   $dbu50826$In a RIGHT JOIN, which table's unmatched rows are excluded?$dbu50826$,
   $dbu50827$["The right table's", "The left table's", "Both tables' unmatched rows are excluded", "Neither \u2014 RIGHT JOIN never excludes any rows"]$dbu50827$::jsonb,
   1, $dbu50828$Since the right side is preserved, unmatched left-side rows are the ones dropped.$dbu50828$, 1, 5),
  ($dbu50829$tq-dbms-sql-16-right-join-7$dbu50829$, $dbu50830$pt-dbms-sql-16-right-join$dbu50830$,
   $dbu50831$Can filtering the LEFT table's column in WHERE (instead of ON) silently undo a RIGHT JOIN's purpose?$dbu50831$,
   $dbu50832$["No, this issue only affects LEFT JOIN", "Yes \u2014 the same WHERE-vs-ON pitfall applies, mirrored to the non-preserved (left) side", "RIGHT JOIN cannot be combined with WHERE at all", "This only happens with CROSS JOIN"]$dbu50832$::jsonb,
   1, $dbu50833$The underlying mechanism (WHERE running after the join, excluding NULL rows) applies symmetrically.$dbu50833$, 1, 6),
  ($dbu50834$tq-dbms-sql-16-right-join-8$dbu50834$, $dbu50835$pt-dbms-sql-16-right-join$dbu50835$,
   $dbu50836$Does RIGHT JOIN require the OUTER keyword to function as described?$dbu50836$,
   $dbu50837$["Yes, OUTER is mandatory", "No \u2014 OUTER is optional, just like with LEFT JOIN", "RIGHT JOIN and RIGHT OUTER JOIN are different operations", "OUTER is only needed for CROSS JOIN"]$dbu50837$::jsonb,
   1, $dbu50838$RIGHT OUTER JOIN and RIGHT JOIN are the same thing, exactly mirroring LEFT JOIN's optional OUTER.$dbu50838$, 1, 7)
on conflict (id) do nothing;

-- 16.4 FULL OUTER JOIN
with g as (select id from public.learning_grids where lower(slug) = $dbu50839$dbms-sql-tutorial$dbu50839$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50840$chapter-16-joins$dbu50840$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50841$FULL OUTER JOIN$dbu50841$, $dbu50842$full-outer-join$dbu50842$, '', 4, 'published', true, true, $dbu50843$dbms_sql_tutorial$dbu50843$, $dbu50844$chapter-16-joins/full-outer-join$dbu50844$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50845$dbms_sql_tutorial$dbu50845$ and source_ref = $dbu50846$chapter-16-joins/full-outer-join$dbu50846$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50847$FULL OUTER JOIN$dbu50847$, $dbu50848$### Definition

`FULL OUTER JOIN` keeps every row from BOTH tables, matching where possible and filling `NULL` on whichever side lacks a match — the union of what `LEFT JOIN` and `RIGHT JOIN` each preserve.

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
SELECT e.name, d.name AS department
FROM employees e
FULL OUTER JOIN departments d ON e.department_id = d.id;
```

This returns every employee (including Vikram, with `NULL` department) AND every department (including Marketing, with `NULL` employee name) — nothing from either side is ever dropped.

### Edge Cases and Pitfalls

- As covered in 7.11: `FULL OUTER JOIN` is NOT supported by every dialect — notably, MySQL has no native `FULL OUTER JOIN` (added only in much more recent versions in limited form) and it must be simulated with `LEFT JOIN UNION RIGHT JOIN`.
- The simulated version needs care: `(A LEFT JOIN B) UNION (A RIGHT JOIN B)` correctly captures every row from both sides, with matched rows appearing once (since `UNION` de-duplicates identical rows) — using `UNION ALL` instead would incorrectly double-count every matched row.
- `FULL OUTER JOIN` combined with `WHERE a.id IS NULL OR b.id IS NULL` is a way to find ALL unmatched rows from EITHER side in one query — a "full anti-join," useful for a two-way reconciliation check between two related tables.

### Key Takeaways

- FULL OUTER JOIN preserves every row from both tables, filling NULL wherever a match is missing on either side.
- Not universally supported (MySQL notably lacks native support) — simulate with LEFT JOIN UNION RIGHT JOIN where needed.
- Combined with an IS NULL check on either side, it becomes a two-way reconciliation/anti-join across both tables.$dbu50848$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50849$dbms_sql_tutorial_seed$dbu50849$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50850$dbms_sql_tutorial_seed$dbu50850$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50851$dbms-sql-tutorial$dbu50851$),
     t as (select id from public.learning_topics where source_kind = $dbu50852$dbms_sql_tutorial$dbu50852$ and source_ref = $dbu50853$chapter-16-joins/full-outer-join$dbu50853$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50854$pt-dbms-sql-16-full-outer-join$dbu50854$, $dbu50855$FULL OUTER JOIN - Quick Test$dbu50855$, 'aptitude', 8, 8,
  $dbu50856$8 questions on FULL OUTER JOIN.$dbu50856$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50857$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50857$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50858$tq-dbms-sql-16-full-outer-join-1$dbu50858$, $dbu50859$pt-dbms-sql-16-full-outer-join$dbu50859$,
   $dbu50860$What does FULL OUTER JOIN preserve?$dbu50860$,
   $dbu50861$["Only matched rows from both tables", "Every row from BOTH tables, filling NULL where a match is missing on either side", "Only the left table's rows", "Only the right table's rows"]$dbu50861$::jsonb,
   1, $dbu50862$FULL OUTER JOIN is the union of what LEFT and RIGHT JOIN each individually preserve.$dbu50862$, 1, 0),
  ($dbu50863$tq-dbms-sql-16-full-outer-join-2$dbu50863$, $dbu50864$pt-dbms-sql-16-full-outer-join$dbu50864$,
   $dbu50865$In the running example, does FULL OUTER JOIN include both Vikram (no department) and Marketing (no employees)?$dbu50865$,
   $dbu50866$["No, only one of them", "Yes \u2014 both unmatched rows are preserved, one from each side", "Neither is included", "This depends on which table is listed first"]$dbu50866$::jsonb,
   1, $dbu50867$FULL OUTER JOIN keeps unmatched rows from both sides simultaneously.$dbu50867$, 1, 1),
  ($dbu50868$tq-dbms-sql-16-full-outer-join-3$dbu50868$, $dbu50869$pt-dbms-sql-16-full-outer-join$dbu50869$,
   $dbu50870$Does MySQL natively support FULL OUTER JOIN in the same way PostgreSQL and SQL Server do?$dbu50870$,
   $dbu50871$["Yes, identically", "No \u2014 MySQL historically lacks native FULL OUTER JOIN and requires simulating it with LEFT JOIN UNION RIGHT JOIN", "MySQL only supports FULL OUTER JOIN for two tables, never more", "No database supports FULL OUTER JOIN"]$dbu50871$::jsonb,
   1, $dbu50872$This is a real, practically important dialect limitation.$dbu50872$, 1, 2),
  ($dbu50873$tq-dbms-sql-16-full-outer-join-4$dbu50873$, $dbu50874$pt-dbms-sql-16-full-outer-join$dbu50874$,
   $dbu50875$When simulating FULL OUTER JOIN with (A LEFT JOIN B) UNION (A RIGHT JOIN B), why must UNION (not UNION ALL) be used?$dbu50875$,
   $dbu50876$["UNION ALL is not valid syntax here", "UNION ALL would double-count every matched row, since it would appear once from each side's join; UNION deduplicates it back to one row", "UNION is faster in every case", "There's no difference between UNION and UNION ALL here"]$dbu50876$::jsonb,
   1, $dbu50877$Matched rows appear in both the LEFT and RIGHT JOIN halves, so deduplication via UNION prevents double-counting.$dbu50877$, 1, 3),
  ($dbu50878$tq-dbms-sql-16-full-outer-join-5$dbu50878$, $dbu50879$pt-dbms-sql-16-full-outer-join$dbu50879$,
   $dbu50880$What does FULL OUTER JOIN combined with `WHERE a.id IS NULL OR b.id IS NULL` accomplish?$dbu50880$,
   $dbu50881$["Finds only fully matched rows", "Finds every unmatched row from EITHER side \u2014 a two-way reconciliation/anti-join between the two tables", "Causes a syntax error", "Returns the same result as INNER JOIN"]$dbu50881$::jsonb,
   1, $dbu50882$This combines FULL OUTER JOIN's completeness with an anti-join-style filter, checking both sides at once.$dbu50882$, 1, 4),
  ($dbu50883$tq-dbms-sql-16-full-outer-join-6$dbu50883$, $dbu50884$pt-dbms-sql-16-full-outer-join$dbu50884$,
   $dbu50885$Is FULL OUTER JOIN's use of the OUTER keyword optional, like with LEFT/RIGHT JOIN?$dbu50885$,
   $dbu50886$["No, OUTER is mandatory for FULL JOIN", "Yes \u2014 FULL JOIN and FULL OUTER JOIN mean the same thing", "FULL JOIN and FULL OUTER JOIN are different operations entirely", "OUTER changes FULL JOIN into an INNER JOIN"]$dbu50886$::jsonb,
   1, $dbu50887$Consistent with LEFT/RIGHT, OUTER is optional and FULL JOIN behaves identically to FULL OUTER JOIN.$dbu50887$, 1, 5),
  ($dbu50888$tq-dbms-sql-16-full-outer-join-7$dbu50888$, $dbu50889$pt-dbms-sql-16-full-outer-join$dbu50889$,
   $dbu50890$How many total rows would you expect from a FULL OUTER JOIN if there are 4 employees (1 unmatched) and 3 departments (1 unmatched)?$dbu50890$,
   $dbu50891$["7 rows: 2 matched pairs, plus 1 unmatched employee, plus 1 unmatched department \u2014 wait, this needs the actual match count, but the key idea is: unmatched rows from BOTH sides are included alongside matched pairs", "Always exactly 4 rows", "Always exactly 3 rows", "Always exactly 12 rows (a full cartesian product)"]$dbu50891$::jsonb,
   0, $dbu50892$The exact count depends on how many rows actually match, but critically, every unmatched row from EITHER table is included in addition to the matched pairs — unlike INNER JOIN which would drop them.$dbu50892$, 1, 6),
  ($dbu50893$tq-dbms-sql-16-full-outer-join-8$dbu50893$, $dbu50894$pt-dbms-sql-16-full-outer-join$dbu50894$,
   $dbu50895$What relationship does FULL OUTER JOIN have to LEFT JOIN and RIGHT JOIN?$dbu50895$,
   $dbu50896$["It is unrelated to both", "It effectively combines what LEFT JOIN and RIGHT JOIN each preserve, into a single result", "It is a stricter version of INNER JOIN", "It only works when LEFT and RIGHT JOIN both return zero rows"]$dbu50896$::jsonb,
   1, $dbu50897$FULL OUTER JOIN can be understood as the union of LEFT JOIN's and RIGHT JOIN's preserved rows.$dbu50897$, 1, 7)
on conflict (id) do nothing;

-- 16.5 CROSS JOIN
with g as (select id from public.learning_grids where lower(slug) = $dbu50898$dbms-sql-tutorial$dbu50898$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50899$chapter-16-joins$dbu50899$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50900$CROSS JOIN$dbu50900$, $dbu50901$cross-join$dbu50901$, '', 5, 'published', true, true, $dbu50902$dbms_sql_tutorial$dbu50902$, $dbu50903$chapter-16-joins/cross-join$dbu50903$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50904$dbms_sql_tutorial$dbu50904$ and source_ref = $dbu50905$chapter-16-joins/cross-join$dbu50905$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50906$CROSS JOIN$dbu50906$, $dbu50907$### Definition

`CROSS JOIN` explicitly requests a Cartesian Product (7.7) — every row of one table paired with every row of the other, with no matching condition at all.

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
SELECT e.name, d.name AS department
FROM employees e
CROSS JOIN departments d;
```

With 4 employees and 3 departments, this produces 12 rows — every employee paired with every department, regardless of who actually works where. `CROSS JOIN` is rarely what you want as a FINAL answer, but it's a genuinely useful building block for generating combinations: e.g. a calendar table crossed with a list of stores to produce "every store, every day" as a base for a reporting query, before joining in actual sales data.

### Edge Cases and Pitfalls

- Writing `FROM a, b` (comma-separated, old-style syntax) with NO `WHERE` condition also produces a `CROSS JOIN` — this is exactly the "accidentally forgot the join condition" bug from 7.7, now seen in its literal SQL form; explicit `CROSS JOIN` syntax makes the intent to produce every combination clear and deliberate, rather than an oversight.
- `CROSS JOIN` needs no `ON` clause at all (there's nothing to match) — adding one is a syntax error for a true `CROSS JOIN`; if you find yourself wanting an `ON` condition, you actually want `INNER JOIN`.
- Row-count explosion is a real, immediate risk: crossing two even moderately-sized tables (1,000 x 1,000) produces a million rows — always double check this is genuinely intended before running on large tables.

### Key Takeaways

- CROSS JOIN explicitly produces every row-combination between two tables — no matching condition at all.
- Old-style comma-separated FROM with no WHERE is an implicit, easy-to-miss CROSS JOIN.
- Genuinely useful for deliberately generating combinations (e.g. dates x stores), but a row-count risk on large tables.$dbu50907$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50908$dbms_sql_tutorial_seed$dbu50908$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50909$dbms_sql_tutorial_seed$dbu50909$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50910$dbms-sql-tutorial$dbu50910$),
     t as (select id from public.learning_topics where source_kind = $dbu50911$dbms_sql_tutorial$dbu50911$ and source_ref = $dbu50912$chapter-16-joins/cross-join$dbu50912$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50913$pt-dbms-sql-16-cross-join$dbu50913$, $dbu50914$CROSS JOIN - Quick Test$dbu50914$, 'aptitude', 8, 8,
  $dbu50915$8 questions on CROSS JOIN.$dbu50915$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50916$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50916$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50917$tq-dbms-sql-16-cross-join-1$dbu50917$, $dbu50918$pt-dbms-sql-16-cross-join$dbu50918$,
   $dbu50919$What does CROSS JOIN produce?$dbu50919$,
   $dbu50920$["Only matched rows between two tables", "Every possible combination of rows from both tables (a Cartesian Product)", "Only rows from the first table", "An error, since no join condition is given"]$dbu50920$::jsonb,
   1, $dbu50921$CROSS JOIN explicitly requests the full Cartesian Product.$dbu50921$, 1, 0),
  ($dbu50922$tq-dbms-sql-16-cross-join-2$dbu50922$, $dbu50923$pt-dbms-sql-16-cross-join$dbu50923$,
   $dbu50924$With 4 employees and 3 departments, how many rows does CROSS JOIN produce?$dbu50924$,
   $dbu50925$["7", "12", "4", "3"]$dbu50925$::jsonb,
   1, $dbu50926$The row count is the product of the two table sizes: 4 x 3 = 12.$dbu50926$, 1, 1),
  ($dbu50927$tq-dbms-sql-16-cross-join-3$dbu50927$, $dbu50928$pt-dbms-sql-16-cross-join$dbu50928$,
   $dbu50929$Does CROSS JOIN require an ON clause?$dbu50929$,
   $dbu50930$["Yes, always", "No \u2014 there's nothing to match, so an ON clause would be a syntax error for a true CROSS JOIN", "Only if the tables share a column name", "ON is optional but recommended"]$dbu50930$::jsonb,
   1, $dbu50931$CROSS JOIN by definition has no matching condition; wanting one signals you actually need INNER JOIN.$dbu50931$, 1, 2),
  ($dbu50932$tq-dbms-sql-16-cross-join-4$dbu50932$, $dbu50933$pt-dbms-sql-16-cross-join$dbu50933$,
   $dbu50934$What old-style SQL syntax also implicitly produces a CROSS JOIN?$dbu50934$,
   $dbu50935$["SELECT * FROM a JOIN b", "FROM a, b (comma-separated) with no WHERE condition", "SELECT * FROM a UNION b", "FROM a INTERSECT b"]$dbu50935$::jsonb,
   1, $dbu50936$This is the classic 'forgot the join condition' bug, producing an accidental CROSS JOIN.$dbu50936$, 1, 3),
  ($dbu50937$tq-dbms-sql-16-cross-join-5$dbu50937$, $dbu50938$pt-dbms-sql-16-cross-join$dbu50938$,
   $dbu50939$What is a genuinely useful, deliberate application of CROSS JOIN?$dbu50939$,
   $dbu50940$["Finding matching rows between two tables", "Generating combinations, like every date crossed with every store, as a base for a reporting query", "Removing duplicate rows", "Sorting a table's rows"]$dbu50940$::jsonb,
   1, $dbu50941$Deliberately generating a full combination set is a real, common use case, unlike the accidental version.$dbu50941$, 1, 4),
  ($dbu50942$tq-dbms-sql-16-cross-join-6$dbu50942$, $dbu50943$pt-dbms-sql-16-cross-join$dbu50943$,
   $dbu50944$What is a real risk of using CROSS JOIN on two large tables?$dbu50944$,
   $dbu50945$["No risk \u2014 CROSS JOIN is always efficient", "The row count explosion (product of both sizes) can produce an enormous, resource-exhausting result even from moderately sized tables", "CROSS JOIN always fails on tables larger than 100 rows", "CROSS JOIN automatically limits its own output"]$dbu50945$::jsonb,
   1, $dbu50946$This mirrors the same row-count risk covered for Cartesian Product in relational algebra (7.7).$dbu50946$, 1, 5),
  ($dbu50947$tq-dbms-sql-16-cross-join-7$dbu50947$, $dbu50948$pt-dbms-sql-16-cross-join$dbu50948$,
   $dbu50949$Is explicit CROSS JOIN syntax generally considered better practice than the old comma-separated FROM style?$dbu50949$,
   $dbu50950$["No, they are equally good", "Yes \u2014 explicit CROSS JOIN makes the intent to produce every combination clear and deliberate, rather than looking like a forgotten join condition", "The comma-separated style is always preferred", "Both styles are deprecated in modern SQL"]$dbu50950$::jsonb,
   1, $dbu50951$Explicitness about intent is exactly why CROSS JOIN is favored over the ambiguous old-style comma syntax.$dbu50951$, 1, 6),
  ($dbu50952$tq-dbms-sql-16-cross-join-8$dbu50952$, $dbu50953$pt-dbms-sql-16-cross-join$dbu50953$,
   $dbu50954$Can CROSS JOIN be combined with a WHERE clause afterward?$dbu50954$,
   $dbu50955$["No, WHERE cannot follow CROSS JOIN", "Yes \u2014 the full combination is produced first, and WHERE can then filter it down, effectively building a Theta Join manually", "WHERE automatically converts CROSS JOIN into INNER JOIN with no visible syntax change", "CROSS JOIN ignores any WHERE clause"]$dbu50955$::jsonb,
   1, $dbu50956$A CROSS JOIN followed by a filtering WHERE is exactly the formal Cartesian-Product-plus-Selection definition of a Theta Join.$dbu50956$, 1, 7)
on conflict (id) do nothing;

-- 16.6 SELF JOIN
with g as (select id from public.learning_grids where lower(slug) = $dbu50957$dbms-sql-tutorial$dbu50957$),
     s as (select id from public.learning_sections where lower(slug) = $dbu50958$chapter-16-joins$dbu50958$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu50959$SELF JOIN$dbu50959$, $dbu50960$self-join$dbu50960$, '', 6, 'published', true, true, $dbu50961$dbms_sql_tutorial$dbu50961$, $dbu50962$chapter-16-joins/self-join$dbu50962$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu50963$dbms_sql_tutorial$dbu50963$ and source_ref = $dbu50964$chapter-16-joins/self-join$dbu50964$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu50965$SELF JOIN$dbu50965$, $dbu50966$### Definition

A **self join** joins a table to ITSELF, treating it as if it were two separate tables — necessary whenever a row needs to be related to another row in the SAME table, like an employee and their manager (who is also an employee).

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
SELECT e.id, e.name, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

Here, `employees` is joined to itself via two ALIASES, `e` (the employee) and `m` (their manager) — Rename (7.3, 12's aliasing) is genuinely REQUIRED here, not just stylistic, since SQL needs some way to distinguish "the employee row" from "the manager row" even though both come from the same table. A `LEFT JOIN` (not `INNER`) is used here specifically so Asha — who has no manager (`manager_id IS NULL`) — still appears, with `manager = NULL`, rather than being dropped.

### Edge Cases and Pitfalls

- Without aliasing, `SELECT name FROM employees JOIN employees ON manager_id = id` is ambiguous nonsense — every column reference would be unclear about which "copy" of the table it means.
- Self joins commonly appear for hierarchical/recursive relationships (this exact "who reports to whom" example is the "recursive relationship" concept from ER modeling, 6.15) — though a self join alone can only show ONE level of the hierarchy at a time (employee-to-direct-manager); walking an ARBITRARY number of levels up a management chain needs a recursive CTE (Chapter 32).
- A self join can also find pairs within a table for comparison purposes — e.g. "employees in the same department" (`e1.department_id = e2.department_id AND e1.id <> e2.id`, using `<>` to avoid pairing a row with itself).

### Key Takeaways

- A self join relates a table's rows to other rows in the SAME table, using two aliases to distinguish the two "copies."
- Aliasing is functionally required here, not just stylistic — SQL cannot otherwise distinguish which occurrence a column reference means.
- Self joins handle one hierarchy level at a time; arbitrary-depth traversal needs a recursive CTE (Chapter 32).$dbu50966$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu50967$dbms_sql_tutorial_seed$dbu50967$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu50968$dbms_sql_tutorial_seed$dbu50968$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu50969$dbms-sql-tutorial$dbu50969$),
     t as (select id from public.learning_topics where source_kind = $dbu50970$dbms_sql_tutorial$dbu50970$ and source_ref = $dbu50971$chapter-16-joins/self-join$dbu50971$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu50972$pt-dbms-sql-16-self-join$dbu50972$, $dbu50973$SELF JOIN - Quick Test$dbu50973$, 'aptitude', 8, 8,
  $dbu50974$8 questions on SELF JOIN.$dbu50974$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu50975$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu50975$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu50976$tq-dbms-sql-16-self-join-1$dbu50976$, $dbu50977$pt-dbms-sql-16-self-join$dbu50977$,
   $dbu50978$What is a self join?$dbu50978$,
   $dbu50979$["A join between two completely unrelated tables", "A join of a table to itself, using aliases to distinguish the two roles", "A join that requires no ON condition", "A synonym for CROSS JOIN"]$dbu50979$::jsonb,
   1, $dbu50980$Self joins relate rows within the same table by treating it as two aliased copies.$dbu50980$, 1, 0),
  ($dbu50981$tq-dbms-sql-16-self-join-2$dbu50981$, $dbu50982$pt-dbms-sql-16-self-join$dbu50982$,
   $dbu50983$Why is aliasing functionally REQUIRED for a self join, not just stylistic?$dbu50983$,
   $dbu50984$["It isn't required \u2014 self joins work fine without aliases", "SQL has no way to distinguish 'the employee row' from 'the manager row' when both come from the same table, without two distinct names", "Aliasing changes the actual data returned", "Self joins are illegal without an alias, by syntax rule unrelated to ambiguity"]$dbu50984$::jsonb,
   1, $dbu50985$Without two distinct aliases, column references to the same table would be genuinely ambiguous.$dbu50985$, 1, 1),
  ($dbu50986$tq-dbms-sql-16-self-join-3$dbu50986$, $dbu50987$pt-dbms-sql-16-self-join$dbu50987$,
   $dbu50988$Why is LEFT JOIN (not INNER JOIN) used in the employee-manager self join example?$dbu50988$,
   $dbu50989$["LEFT JOIN is always required for self joins", "So employees with no manager (like Asha) still appear, with manager = NULL, instead of being dropped", "INNER JOIN cannot be used on the same table twice", "LEFT JOIN is faster for self joins specifically"]$dbu50989$::jsonb,
   1, $dbu50990$An INNER self join would drop any employee whose manager_id is NULL, which LEFT JOIN avoids.$dbu50990$, 1, 2),
  ($dbu50991$tq-dbms-sql-16-self-join-4$dbu50991$, $dbu50992$pt-dbms-sql-16-self-join$dbu50992$,
   $dbu50993$Can a single self join walk an arbitrary number of levels up a management hierarchy (e.g. manager's manager's manager)?$dbu50993$,
   $dbu50994$["Yes, self joins handle any depth automatically", "No \u2014 a self join handles one level at a time; arbitrary-depth traversal needs a recursive CTE (Chapter 32)", "Self joins can only find direct reports, never managers", "This requires a UNION of many self joins, and only that"]$dbu50994$::jsonb,
   1, $dbu50995$Multi-level hierarchy traversal is exactly what recursive CTEs are designed for, beyond a single self join's reach.$dbu50995$, 1, 3),
  ($dbu50996$tq-dbms-sql-16-self-join-5$dbu50996$, $dbu50997$pt-dbms-sql-16-self-join$dbu50997$,
   $dbu50998$What ER-modeling concept does the employee-manager self join relate to?$dbu50998$,
   $dbu50999$["Weak entity", "Recursive relationship (6.15)", "Generalization", "Composite attribute"]$dbu50999$::jsonb,
   1, $dbu51000$A recursive relationship connects an entity set to itself, exactly like manager/employee within the same table.$dbu51000$, 1, 4),
  ($dbu51001$tq-dbms-sql-16-self-join-6$dbu51001$, $dbu51002$pt-dbms-sql-16-self-join$dbu51002$,
   $dbu51003$In `e1.department_id = e2.department_id AND e1.id <> e2.id`, why is the `<>` condition needed?$dbu51003$,
   $dbu51004$["It isn't needed", "To avoid pairing a row with itself, since otherwise every row would trivially match its own department", "To ensure only managers are matched", "To sort the results"]$dbu51004$::jsonb,
   1, $dbu51005$Without excluding self-pairs, every employee would match themselves as being 'in the same department as' themselves.$dbu51005$, 1, 5),
  ($dbu51006$tq-dbms-sql-16-self-join-7$dbu51006$, $dbu51007$pt-dbms-sql-16-self-join$dbu51007$,
   $dbu51008$Can a self join use INNER JOIN instead of LEFT JOIN in some scenarios?$dbu51008$,
   $dbu51009$["No, self joins must always use LEFT JOIN", "Yes \u2014 if you specifically only want rows that DO have a matching related row (e.g. only employees who DO have a manager)", "INNER JOIN is invalid syntax for self joins", "Self joins do not support any join type other than LEFT JOIN"]$dbu51009$::jsonb,
   1, $dbu51010$The choice between INNER and LEFT (or other join types) for a self join depends on whether unmatched rows should be kept, exactly like any other join.$dbu51010$, 1, 6),
  ($dbu51011$tq-dbms-sql-16-self-join-8$dbu51011$, $dbu51012$pt-dbms-sql-16-self-join$dbu51012$,
   $dbu51013$Is a self join a distinct SQL syntax feature, or just a regular join applied to the same table twice?$dbu51013$,
   $dbu51014$["A completely separate, dedicated syntax construct", "Just a regular join (INNER, LEFT, etc.) where both sides happen to reference the same table via different aliases", "Only supported in specific specialized databases", "A deprecated legacy feature"]$dbu51014$::jsonb,
   1, $dbu51015$There's no special self-join keyword — it's ordinary JOIN syntax applied with the same table aliased twice.$dbu51015$, 1, 7)
on conflict (id) do nothing;

-- 16.7 Natural Join
with g as (select id from public.learning_grids where lower(slug) = $dbu51016$dbms-sql-tutorial$dbu51016$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51017$chapter-16-joins$dbu51017$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51018$Natural Join$dbu51018$, $dbu51019$natural-join-sql$dbu51019$, '', 7, 'published', true, true, $dbu51020$dbms_sql_tutorial$dbu51020$, $dbu51021$chapter-16-joins/natural-join-sql$dbu51021$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51022$dbms_sql_tutorial$dbu51022$ and source_ref = $dbu51023$chapter-16-joins/natural-join-sql$dbu51023$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51024$Natural Join$dbu51024$, $dbu51025$### Definition

This topic revisits **`NATURAL JOIN`** — already introduced conceptually in relational algebra (7.10) — specifically as one of the concrete SQL join syntaxes alongside `INNER`/`LEFT`/`RIGHT`/`FULL`/`CROSS`/`SELF` covered in this chapter. As a reminder: it automatically joins on ALL identically-named columns shared by two tables, with no explicit `ON` clause.

### How It Works

```sql
-- Assume employees(id, department_id, name) and departments(department_id, name)
-- sharing the exact column name department_id:
SELECT * FROM employees NATURAL JOIN departments;
```

Since both tables share `department_id`, `NATURAL JOIN` matches on it automatically — equivalent to `... JOIN departments ON employees.department_id = departments.department_id`, but without writing the condition explicitly.

### Edge Cases and Pitfalls

- As covered in 7.10, this convenience is also a real danger: if the two tables happen to ALSO share another column name (e.g. both have an unrelated `notes` or `created_at` column), `NATURAL JOIN` silently requires THAT to match too, which can silently break the query the moment a schema changes to add a coincidentally-matching column name.
- In THIS chapter's running example, `employees` and `departments` do NOT share an identically-named column for their relationship (`employees.department_id` vs `departments.id` — different names) — so a plain `NATURAL JOIN` between them would find NO common column names at all, and degenerate into a `CROSS JOIN` (16.5) rather than the intended relationship. This is a genuinely realistic scenario worth noticing: natural join's automatic behavior depends entirely on the schema's naming choices lining up.
- Given this fragility, most real-world schemas and query style guides prefer an explicit `JOIN ... ON` (16.9's join predicate) over `NATURAL JOIN`, precisely so the join logic doesn't silently depend on incidental column-naming choices.

### Key Takeaways

- NATURAL JOIN automatically matches on every identically-named shared column, with no ON clause needed.
- It's fragile: an unexpected shared column name changes what it matches on, and NO shared names at all silently degenerates it into a Cartesian Product.
- Explicit JOIN ... ON is generally the safer, more maintainable real-world choice.$dbu51025$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51026$dbms_sql_tutorial_seed$dbu51026$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51027$dbms_sql_tutorial_seed$dbu51027$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51028$dbms-sql-tutorial$dbu51028$),
     t as (select id from public.learning_topics where source_kind = $dbu51029$dbms_sql_tutorial$dbu51029$ and source_ref = $dbu51030$chapter-16-joins/natural-join-sql$dbu51030$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51031$pt-dbms-sql-16-natural-join-sql$dbu51031$, $dbu51032$Natural Join - Quick Test$dbu51032$, 'aptitude', 8, 8,
  $dbu51033$8 questions on Natural Join.$dbu51033$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51034$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51034$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51035$tq-dbms-sql-16-natural-join-sql-1$dbu51035$, $dbu51036$pt-dbms-sql-16-natural-join-sql$dbu51036$,
   $dbu51037$How does NATURAL JOIN decide what to match on?$dbu51037$,
   $dbu51038$["You must specify columns explicitly", "Automatically, based on every identically-named column shared by both tables", "It always matches on the primary key only", "It requires a CROSS JOIN first"]$dbu51038$::jsonb,
   1, $dbu51039$NATURAL JOIN infers its match condition purely from shared column names.$dbu51039$, 1, 0),
  ($dbu51040$tq-dbms-sql-16-natural-join-sql-2$dbu51040$, $dbu51041$pt-dbms-sql-16-natural-join-sql$dbu51041$,
   $dbu51042$If employees.department_id and departments.id have DIFFERENT names, what happens with a plain NATURAL JOIN between them?$dbu51042$,
   $dbu51043$["It automatically detects the relationship anyway", "With no identically-named shared column, NATURAL JOIN finds nothing to match on and degenerates into a CROSS JOIN", "It raises a clear error explaining the naming mismatch", "It matches on the first column of each table by position"]$dbu51043$::jsonb,
   1, $dbu51044$NATURAL JOIN relies entirely on matching column NAMES — different names mean nothing to match on.$dbu51044$, 1, 1),
  ($dbu51045$tq-dbms-sql-16-natural-join-sql-3$dbu51045$, $dbu51046$pt-dbms-sql-16-natural-join-sql$dbu51046$,
   $dbu51047$Why is NATURAL JOIN considered risky if two tables happen to share an unrelated column name?$dbu51047$,
   $dbu51048$["It isn't risky in that case", "NATURAL JOIN would silently require that unrelated column to also match, potentially breaking the intended relationship", "Shared unrelated column names cause a guaranteed syntax error", "NATURAL JOIN ignores all but the first shared column name"]$dbu51048$::jsonb,
   1, $dbu51049$Every shared name becomes part of the automatic match condition, intended or not.$dbu51049$, 1, 2),
  ($dbu51050$tq-dbms-sql-16-natural-join-sql-4$dbu51050$, $dbu51051$pt-dbms-sql-16-natural-join-sql$dbu51051$,
   $dbu51052$Why do many real-world style guides prefer explicit JOIN ... ON over NATURAL JOIN?$dbu51052$,
   $dbu51053$["JOIN ... ON is always faster to execute", "Explicit conditions don't silently depend on incidental column-naming choices that could change later", "NATURAL JOIN is not valid SQL syntax", "JOIN ... ON requires fewer keystrokes"]$dbu51053$::jsonb,
   1, $dbu51054$Robustness to schema evolution is the main argument for explicit join conditions.$dbu51054$, 1, 3),
  ($dbu51055$tq-dbms-sql-16-natural-join-sql-5$dbu51055$, $dbu51056$pt-dbms-sql-16-natural-join-sql$dbu51056$,
   $dbu51057$Does NATURAL JOIN require writing an ON or USING clause?$dbu51057$,
   $dbu51058$["Yes, always", "No \u2014 that's the defining feature of NATURAL JOIN; the match is inferred automatically", "Only USING is required, never ON", "Only for more than two tables"]$dbu51058$::jsonb,
   1, $dbu51059$The absence of an explicit condition is exactly what makes it a 'natural' join.$dbu51059$, 1, 4),
  ($dbu51060$tq-dbms-sql-16-natural-join-sql-6$dbu51060$, $dbu51061$pt-dbms-sql-16-natural-join-sql$dbu51061$,
   $dbu51062$Is this chapter's coverage of NATURAL JOIN a different concept from the relational algebra Rename operation covered in Chapter 7?$dbu51062$,
   $dbu51063$["Yes \u2014 Natural Join (7.10) is a join concept; Rename (7.3) is an unrelated naming operation", "No, they are the same operation", "Natural Join is a special case of Rename", "Rename is required before NATURAL JOIN can be used at all"]$dbu51063$::jsonb,
   0, $dbu51064$These are genuinely distinct relational algebra operations — the exact source of the slug collision this course had to resolve when both a Chapter 7 'Rename' topic and this chapter's SQL 'NATURAL JOIN' topic exist alongside each other.$dbu51064$, 1, 5),
  ($dbu51065$tq-dbms-sql-16-natural-join-sql-7$dbu51065$, $dbu51066$pt-dbms-sql-16-natural-join-sql$dbu51066$,
   $dbu51067$What real consequence follows from NATURAL JOIN degenerating into a CROSS JOIN when no shared column names exist?$dbu51067$,
   $dbu51068$["The query simply returns zero rows safely", "A likely unintended, potentially very large row-count explosion, with no error to flag the problem", "SQL automatically raises a warning in this exact case", "The query is automatically converted to an INNER JOIN instead"]$dbu51068$::jsonb,
   1, $dbu51069$The lack of an error, combined with the Cartesian-Product row-count risk from 16.5, makes this a genuinely dangerous silent failure mode.$dbu51069$, 1, 6),
  ($dbu51070$tq-dbms-sql-16-natural-join-sql-8$dbu51070$, $dbu51071$pt-dbms-sql-16-natural-join-sql$dbu51071$,
   $dbu51072$Which of these is equivalent to `SELECT * FROM employees NATURAL JOIN departments` when both share column department_id?$dbu51072$,
   $dbu51073$["SELECT * FROM employees CROSS JOIN departments", "SELECT * FROM employees JOIN departments ON employees.department_id = departments.department_id", "SELECT * FROM employees LEFT JOIN departments ON 1=1", "SELECT * FROM employees, departments"]$dbu51073$::jsonb,
   1, $dbu51074$NATURAL JOIN is shorthand for exactly this explicit equality join on the shared column.$dbu51074$, 1, 7)
on conflict (id) do nothing;

-- 16.8 Multi Table Joins
with g as (select id from public.learning_grids where lower(slug) = $dbu51075$dbms-sql-tutorial$dbu51075$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51076$chapter-16-joins$dbu51076$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51077$Multi Table Joins$dbu51077$, $dbu51078$multi-table-joins$dbu51078$, '', 8, 'published', true, true, $dbu51079$dbms_sql_tutorial$dbu51079$, $dbu51080$chapter-16-joins/multi-table-joins$dbu51080$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51081$dbms_sql_tutorial$dbu51081$ and source_ref = $dbu51082$chapter-16-joins/multi-table-joins$dbu51082$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51083$Multi Table Joins$dbu51083$, $dbu51084$### Definition

A **multi-table join** chains three or more tables together in a single query, each pair connected by its own join condition — the natural extension of a two-table join to real-world questions that span several related tables.

### How It Works

```sql
-- employees(id, name, department_id), departments(id, name), companies(id, name)
-- (imagine departments belongs to a company via company_id)
SELECT e.name, d.name AS department, c.name AS company
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN companies c ON d.company_id = c.id;
```

Each `JOIN` adds one more table, matched against whatever's already been joined so far — conceptually, the engine builds up the combined result step by step (though the actual EXECUTION order chosen by the optimizer, Chapter 35, may differ from the written order for performance).

### Edge Cases and Pitfalls

- Mixing join types across a chain (e.g. `employees JOIN departments ... LEFT JOIN companies ...`) is common and meaningful — each join's type is evaluated independently for what it should preserve/drop at that step.
- The MORE tables chained together, the more important correct join conditions become — a single wrong or missing condition anywhere in the chain can silently turn part of it into an accidental Cartesian Product (16.5), inflating the row count dramatically without any error.
- Very long join chains (many tables) can become hard to read and reason about — breaking a complex multi-table query into named CTEs (Chapter 32) or views (Chapter 19) for intermediate steps often improves clarity without changing the final result.

### Key Takeaways

- Multi-table joins chain several JOIN clauses together, each with its own condition, to combine data from 3+ tables.
- Written join order doesn't necessarily match execution order — the optimizer decides that.
- A missing/wrong condition anywhere in a long chain risks an accidental Cartesian-Product-style row explosion.$dbu51084$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51085$dbms_sql_tutorial_seed$dbu51085$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51086$dbms_sql_tutorial_seed$dbu51086$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51087$dbms-sql-tutorial$dbu51087$),
     t as (select id from public.learning_topics where source_kind = $dbu51088$dbms_sql_tutorial$dbu51088$ and source_ref = $dbu51089$chapter-16-joins/multi-table-joins$dbu51089$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51090$pt-dbms-sql-16-multi-table-joins$dbu51090$, $dbu51091$Multi Table Joins - Quick Test$dbu51091$, 'aptitude', 8, 8,
  $dbu51092$8 questions on Multi Table Joins.$dbu51092$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51093$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51093$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51094$tq-dbms-sql-16-multi-table-joins-1$dbu51094$, $dbu51095$pt-dbms-sql-16-multi-table-joins$dbu51095$,
   $dbu51096$What is a multi-table join?$dbu51096$,
   $dbu51097$["A join limited to exactly two tables", "A query chaining three or more tables together, each pair connected by its own join condition", "A join that requires no conditions at all", "A synonym for UNION of multiple tables"]$dbu51097$::jsonb,
   1, $dbu51098$Multi-table joins extend the two-table join pattern to more tables.$dbu51098$, 1, 0),
  ($dbu51099$tq-dbms-sql-16-multi-table-joins-2$dbu51099$, $dbu51100$pt-dbms-sql-16-multi-table-joins$dbu51100$,
   $dbu51101$Can different join types (INNER, LEFT, etc.) be mixed within one multi-table join chain?$dbu51101$,
   $dbu51102$["No, every join in a chain must be the same type", "Yes \u2014 each join's type is evaluated independently for what it preserves or drops at that step", "Mixing join types always causes an error", "Only the first join's type matters; the rest are ignored"]$dbu51102$::jsonb,
   1, $dbu51103$Each JOIN clause in a chain can independently be INNER, LEFT, etc., based on what that specific relationship needs.$dbu51103$, 1, 1),
  ($dbu51104$tq-dbms-sql-16-multi-table-joins-3$dbu51104$, $dbu51105$pt-dbms-sql-16-multi-table-joins$dbu51105$,
   $dbu51106$What risk grows as more tables are chained together in a join?$dbu51106$,
   $dbu51107$["No additional risk \u2014 more tables is always safer", "A single wrong or missing join condition anywhere in the chain can silently produce an accidental Cartesian-Product-style row explosion", "The query automatically becomes read-only", "SQL limits joins to at most 3 tables"]$dbu51107$::jsonb,
   1, $dbu51108$More join conditions mean more opportunities for one of them to be wrong, with the same silent-failure risk as a two-table join.$dbu51108$, 1, 2),
  ($dbu51109$tq-dbms-sql-16-multi-table-joins-4$dbu51109$, $dbu51110$pt-dbms-sql-16-multi-table-joins$dbu51110$,
   $dbu51111$Does the written order of JOIN clauses guarantee the actual execution order?$dbu51111$,
   $dbu51112$["Yes, always executed exactly as written", "No \u2014 the query optimizer may choose a different execution order for performance while preserving the same logical result", "Execution order is random", "Only the last JOIN clause is actually executed"]$dbu51112$::jsonb,
   1, $dbu51113$Optimizers frequently reorder joins internally; this is covered further in Chapter 35.$dbu51113$, 1, 3),
  ($dbu51114$tq-dbms-sql-16-multi-table-joins-5$dbu51114$, $dbu51115$pt-dbms-sql-16-multi-table-joins$dbu51115$,
   $dbu51116$What technique can improve readability of a very long, complex multi-table join?$dbu51116$,
   $dbu51117$["Removing all WHERE clauses", "Breaking it into named CTEs or views for intermediate steps", "Always using CROSS JOIN instead of INNER JOIN", "Combining every table into one via UNION first"]$dbu51117$::jsonb,
   1, $dbu51118$CTEs and views can decompose complex joins into more readable, named intermediate steps.$dbu51118$, 1, 4),
  ($dbu51119$tq-dbms-sql-16-multi-table-joins-6$dbu51119$, $dbu51120$pt-dbms-sql-16-multi-table-joins$dbu51120$,
   $dbu51121$In a chain of employees JOIN departments JOIN companies, what determines what data is available for the final SELECT?$dbu51121$,
   $dbu51122$["Only the first table's columns", "The combined columns from all successfully joined tables, subject to each join's matching conditions", "Only the last table's columns", "SQL automatically picks one representative table"]$dbu51122$::jsonb,
   1, $dbu51123$A multi-table join's final result draws from all tables in the chain, per their join conditions.$dbu51123$, 1, 5),
  ($dbu51124$tq-dbms-sql-16-multi-table-joins-7$dbu51124$, $dbu51125$pt-dbms-sql-16-multi-table-joins$dbu51125$,
   $dbu51126$Is it meaningful to have a LEFT JOIN followed by an INNER JOIN later in the same chain?$dbu51126$,
   $dbu51127$["No, this combination is illegal", "Yes \u2014 but care is needed, since a later INNER JOIN can effectively cancel out an earlier LEFT JOIN's NULL-preserving rows if it filters on a NULL-producing column", "This always produces identical results to two LEFT JOINs", "SQL automatically converts the later INNER JOIN into a LEFT JOIN"]$dbu51127$::jsonb,
   1, $dbu51128$An INNER JOIN later in the chain can require non-NULL values from an earlier LEFT JOIN's preserved rows, effectively undoing the outer preservation for those rows — a subtle multi-join interaction worth understanding.$dbu51128$, 1, 6),
  ($dbu51129$tq-dbms-sql-16-multi-table-joins-8$dbu51129$, $dbu51130$pt-dbms-sql-16-multi-table-joins$dbu51130$,
   $dbu51131$Why might correct join conditions matter MORE in a multi-table join than in a simple two-table join?$dbu51131$,
   $dbu51132$["They matter equally regardless of table count", "There are more conditions overall, so more opportunities for any single one to be wrong and silently corrupt the whole result", "Multi-table joins don't actually use join conditions", "Join conditions only matter for the very last table in the chain"]$dbu51132$::jsonb,
   1, $dbu51133$Each additional join condition is another potential point of failure in an otherwise correct chain.$dbu51133$, 1, 7)
on conflict (id) do nothing;

-- 16.9 Join Predicate
with g as (select id from public.learning_grids where lower(slug) = $dbu51134$dbms-sql-tutorial$dbu51134$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51135$chapter-16-joins$dbu51135$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51136$Join Predicate$dbu51136$, $dbu51137$join-predicate$dbu51137$, '', 9, 'published', true, true, $dbu51138$dbms_sql_tutorial$dbu51138$, $dbu51139$chapter-16-joins/join-predicate$dbu51139$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51140$dbms_sql_tutorial$dbu51140$ and source_ref = $dbu51141$chapter-16-joins/join-predicate$dbu51141$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51142$Join Predicate$dbu51142$, $dbu51143$### Definition

The **join predicate** is the condition (after `ON`) that determines whether two rows are considered a match — the heart of any join, regardless of join type.

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
... JOIN departments d ON e.department_id = d.id           -- equality predicate (most common)
... JOIN salary_bands s ON e.salary BETWEEN s.min AND s.max  -- range predicate (a Theta Join, 7.8)
... JOIN events a JOIN events b ON a.end_time < b.start_time -- inequality predicate
```

Most join predicates are equality (matching a foreign key to a primary key), but ANY boolean condition is valid — this is exactly the Theta Join generality from relational algebra (7.8), expressed via SQL's `ON` clause.

### Edge Cases and Pitfalls

- A join predicate can combine multiple conditions with `AND`/`OR`, just like a `WHERE` clause: `ON e.department_id = d.id AND e.status = 'active'` restricts the JOIN itself, which behaves differently from putting `e.status = 'active'` in `WHERE` instead, especially for outer joins (an `ON`-clause condition on the non-preserved side filters BEFORE outer-NULL-filling; a `WHERE`-clause condition filters AFTER, potentially discarding preserved NULL rows).
- A join predicate referencing columns from MORE than the two tables directly being joined (referencing a third, not-yet-joined table) is invalid — a predicate can only reference tables already available at that point in the query.
- Choosing a join predicate that ISN'T selective (matches almost every row, like `ON 1=1`) technically works but effectively produces a Cartesian Product — the predicate exists specifically to narrow matches down meaningfully.

### Key Takeaways

- The join predicate (the ON condition) determines what counts as a match — equality is most common, but any boolean condition is valid (a Theta Join).
- Putting an extra condition in ON vs WHERE matters for outer joins — ON filters before NULL-filling, WHERE filters after.
- A non-selective predicate (like 1=1) effectively degenerates a join into a Cartesian Product.$dbu51143$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51144$dbms_sql_tutorial_seed$dbu51144$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51145$dbms_sql_tutorial_seed$dbu51145$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51146$dbms-sql-tutorial$dbu51146$),
     t as (select id from public.learning_topics where source_kind = $dbu51147$dbms_sql_tutorial$dbu51147$ and source_ref = $dbu51148$chapter-16-joins/join-predicate$dbu51148$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51149$pt-dbms-sql-16-join-predicate$dbu51149$, $dbu51150$Join Predicate - Quick Test$dbu51150$, 'aptitude', 8, 8,
  $dbu51151$8 questions on Join Predicate.$dbu51151$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51152$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51152$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51153$tq-dbms-sql-16-join-predicate-1$dbu51153$, $dbu51154$pt-dbms-sql-16-join-predicate$dbu51154$,
   $dbu51155$What is a join predicate?$dbu51155$,
   $dbu51156$["The list of columns selected", "The condition (after ON) that determines whether two rows count as a match", "A synonym for ORDER BY", "The name given to a joined table"]$dbu51156$::jsonb,
   1, $dbu51157$The predicate is the actual matching condition driving the join.$dbu51157$, 1, 0),
  ($dbu51158$tq-dbms-sql-16-join-predicate-2$dbu51158$, $dbu51159$pt-dbms-sql-16-join-predicate$dbu51159$,
   $dbu51160$Are join predicates limited to equality comparisons?$dbu51160$,
   $dbu51161$["Yes, only = is allowed in ON clauses", "No \u2014 any boolean condition is valid, including ranges and inequalities, matching the Theta Join concept", "Only BETWEEN and = are allowed", "Join predicates cannot reference more than one column"]$dbu51161$::jsonb,
   1, $dbu51162$ON conditions support the full generality of Theta Join, not just equality.$dbu51162$, 1, 1),
  ($dbu51163$tq-dbms-sql-16-join-predicate-3$dbu51163$, $dbu51164$pt-dbms-sql-16-join-predicate$dbu51164$,
   $dbu51165$For an OUTER join, does putting an extra condition in ON versus WHERE make a difference?$dbu51165$,
   $dbu51166$["No difference at all", "Yes \u2014 an ON-clause condition filters before NULL-filling the non-preserved side, while a WHERE-clause condition filters after, potentially discarding preserved NULL rows", "WHERE can never be used with outer joins", "ON conditions are always evaluated after WHERE conditions"]$dbu51166$::jsonb,
   1, $dbu51167$This ON-vs-WHERE timing difference is exactly the subtlety already flagged for LEFT JOIN filtering in earlier chapters.$dbu51167$, 1, 2),
  ($dbu51168$tq-dbms-sql-16-join-predicate-4$dbu51168$, $dbu51169$pt-dbms-sql-16-join-predicate$dbu51169$,
   $dbu51170$Can a join predicate reference a table that hasn't been joined yet at that point in the query?$dbu51170$,
   $dbu51171$["Yes, always", "No \u2014 a predicate can only reference tables already available at that point in the join chain", "Only in subqueries", "Only for LEFT JOIN"]$dbu51171$::jsonb,
   1, $dbu51172$Join predicates are scoped to the tables already introduced by that point in the FROM/JOIN chain.$dbu51172$, 1, 3),
  ($dbu51173$tq-dbms-sql-16-join-predicate-5$dbu51173$, $dbu51174$pt-dbms-sql-16-join-predicate$dbu51174$,
   $dbu51175$What happens if a join predicate is non-selective, like ON 1=1?$dbu51175$,
   $dbu51176$["The join fails with an error", "It technically works but effectively produces a Cartesian Product, since every row 'matches'", "It automatically becomes a CROSS JOIN keyword", "SQL rejects this as invalid syntax"]$dbu51176$::jsonb,
   1, $dbu51177$A trivially-true predicate matches everything, degenerating the join into a full Cartesian Product.$dbu51177$, 1, 4),
  ($dbu51178$tq-dbms-sql-16-join-predicate-6$dbu51178$, $dbu51179$pt-dbms-sql-16-join-predicate$dbu51179$,
   $dbu51180$Can a join predicate combine multiple conditions with AND/OR?$dbu51180$,
   $dbu51181$["No, only one condition is allowed", "Yes \u2014 exactly like a WHERE clause, multiple conditions can be combined", "Only AND is allowed, never OR", "Combining conditions requires a subquery instead"]$dbu51181$::jsonb,
   1, $dbu51182$ON clauses support the same compound-condition logic as WHERE.$dbu51182$, 1, 5),
  ($dbu51183$tq-dbms-sql-16-join-predicate-7$dbu51183$, $dbu51184$pt-dbms-sql-16-join-predicate$dbu51184$,
   $dbu51185$Which relational algebra concept does a general (non-equality) join predicate correspond to?$dbu51185$,
   $dbu51186$["Projection", "Theta Join", "Union", "Rename"]$dbu51186$::jsonb,
   1, $dbu51187$A join predicate using any comparison, not just equality, is exactly Theta Join's generality.$dbu51187$, 1, 6),
  ($dbu51188$tq-dbms-sql-16-join-predicate-8$dbu51188$, $dbu51189$pt-dbms-sql-16-join-predicate$dbu51189$,
   $dbu51190$Is the most common real-world join predicate an equality or a range comparison?$dbu51190$,
   $dbu51191$["Range comparisons are most common", "Equality (matching foreign key to primary key) is by far the most common", "Both are equally common", "Neither \u2014 most real joins use no predicate at all"]$dbu51191$::jsonb,
   1, $dbu51192$Foreign-key-to-primary-key equality dominates real-world join usage, consistent with Equi Join being the common case.$dbu51192$, 1, 7)
on conflict (id) do nothing;

-- 16.10 Join Cardinality
with g as (select id from public.learning_grids where lower(slug) = $dbu51193$dbms-sql-tutorial$dbu51193$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51194$chapter-16-joins$dbu51194$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51195$Join Cardinality$dbu51195$, $dbu51196$join-cardinality$dbu51196$, '', 10, 'published', true, true, $dbu51197$dbms_sql_tutorial$dbu51197$, $dbu51198$chapter-16-joins/join-cardinality$dbu51198$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51199$dbms_sql_tutorial$dbu51199$ and source_ref = $dbu51200$chapter-16-joins/join-cardinality$dbu51200$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51201$Join Cardinality$dbu51201$, $dbu51202$### Definition

**Join cardinality** describes the numerical RELATIONSHIP between two joined tables — one-to-one, one-to-many, or many-to-many — and directly determines how many rows the join produces relative to its inputs.

### How It Works

- **One-to-one**: each row in A matches AT MOST one row in B (e.g. each employee has at most one passport record) — the join's row count stays close to the smaller/filtered table's size.
- **One-to-many**: each row in A can match MANY rows in B (e.g. each department has many employees) — joining departments to employees multiplies rows: the result has one row PER EMPLOYEE, not per department, because each department row is repeated once for every matching employee.
- **Many-to-many**: rows in A can match many rows in B AND VICE VERSA (e.g. students and courses, via an enrollments junction table) — typically implemented via an intermediate junction/bridge table with two one-to-many relationships, rather than a direct many-to-many join.

### Edge Cases and Pitfalls

- A one-to-many join's row-count multiplication is easy to forget when computing an aggregate afterward: `SUM(d.budget)` after joining departments to employees would incorrectly sum a department's budget once PER EMPLOYEE (since the department row is duplicated per matching employee row) rather than once per department — a classic "fan-out" bug (already flagged conceptually in 7.1/DQL).
- Understanding which side of a relationship is the "many" side is essential for predicting a join's row count BEFORE running it — a genuinely useful sanity check when a query returns a suspiciously large or small number of rows.
- Enforcing intended cardinality at the schema level (e.g. a UNIQUE constraint to guarantee a true one-to-one relationship) prevents data-quality drift into an accidental one-to-many that the application logic didn't expect.

### Key Takeaways

- Join cardinality (1:1, 1:N, N:M) describes how many matches to expect on each side, and directly predicts the joined result's row count.
- A one-to-many join multiplies the "one" side's rows — aggregating afterward without accounting for this is the classic "fan-out" bug.
- Many-to-many relationships are typically implemented via a junction table with two one-to-many relationships, not a direct join.$dbu51202$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51203$dbms_sql_tutorial_seed$dbu51203$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51204$dbms_sql_tutorial_seed$dbu51204$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51205$dbms-sql-tutorial$dbu51205$),
     t as (select id from public.learning_topics where source_kind = $dbu51206$dbms_sql_tutorial$dbu51206$ and source_ref = $dbu51207$chapter-16-joins/join-cardinality$dbu51207$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51208$pt-dbms-sql-16-join-cardinality$dbu51208$, $dbu51209$Join Cardinality - Quick Test$dbu51209$, 'aptitude', 8, 8,
  $dbu51210$8 questions on Join Cardinality.$dbu51210$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51211$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51211$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51212$tq-dbms-sql-16-join-cardinality-1$dbu51212$, $dbu51213$pt-dbms-sql-16-join-cardinality$dbu51213$,
   $dbu51214$What does join cardinality describe?$dbu51214$,
   $dbu51215$["The order columns appear in the result", "The numerical relationship (one-to-one, one-to-many, many-to-many) between two joined tables", "The number of columns in a table", "Whether a join uses INNER or OUTER"]$dbu51215$::jsonb,
   1, $dbu51216$Cardinality describes the matching relationship's shape between two tables.$dbu51216$, 1, 0),
  ($dbu51217$tq-dbms-sql-16-join-cardinality-2$dbu51217$, $dbu51218$pt-dbms-sql-16-join-cardinality$dbu51218$,
   $dbu51219$In a one-to-many join between departments and employees, how many result rows does one department with 5 employees produce?$dbu51219$,
   $dbu51220$["1 row", "5 rows \u2014 the department row is repeated once per matching employee", "0 rows", "This cannot be determined"]$dbu51220$::jsonb,
   1, $dbu51221$One-to-many joins duplicate the 'one' side's row for every match on the 'many' side.$dbu51221$, 1, 1),
  ($dbu51222$tq-dbms-sql-16-join-cardinality-3$dbu51222$, $dbu51223$pt-dbms-sql-16-join-cardinality$dbu51223$,
   $dbu51224$Why does summing a department's budget after joining to employees produce a wrong total?$dbu51224$,
   $dbu51225$["SUM() cannot be used after a join", "The department's budget value is duplicated once per employee row, so SUM() would add it multiple times instead of once", "Budget is always NULL after a join", "This actually produces the correct total"]$dbu51225$::jsonb,
   1, $dbu51226$This is the classic 'fan-out' aggregate bug caused by not accounting for one-to-many row multiplication.$dbu51226$, 1, 2),
  ($dbu51227$tq-dbms-sql-16-join-cardinality-4$dbu51227$, $dbu51228$pt-dbms-sql-16-join-cardinality$dbu51228$,
   $dbu51229$How is a many-to-many relationship typically implemented in a relational schema?$dbu51229$,
   $dbu51230$["Via a single direct join with no intermediate table", "Via an intermediate junction/bridge table, itself involved in two one-to-many relationships", "Many-to-many relationships cannot be represented relationally", "By duplicating both tables"]$dbu51230$::jsonb,
   1, $dbu51231$A junction table (like enrollments between students and courses) is the standard relational solution for many-to-many.$dbu51231$, 1, 3),
  ($dbu51232$tq-dbms-sql-16-join-cardinality-5$dbu51232$, $dbu51233$pt-dbms-sql-16-join-cardinality$dbu51233$,
   $dbu51234$What schema-level mechanism helps enforce an intended one-to-one relationship?$dbu51234$,
   $dbu51235$["A CHECK constraint on unrelated columns", "A UNIQUE constraint on the foreign key column, preventing more than one match per row", "Using CROSS JOIN in every query", "There is no way to enforce this"]$dbu51235$::jsonb,
   1, $dbu51236$A UNIQUE constraint on the referencing column guarantees at most one match, enforcing true one-to-one cardinality.$dbu51236$, 1, 4),
  ($dbu51237$tq-dbms-sql-16-join-cardinality-6$dbu51237$, $dbu51238$pt-dbms-sql-16-join-cardinality$dbu51238$,
   $dbu51239$Why is knowing the expected cardinality useful BEFORE running a join?$dbu51239$,
   $dbu51240$["It has no practical use", "It lets you predict roughly how many rows the join should produce, serving as a sanity check against surprising results", "It determines which JOIN keyword to use exclusively", "Cardinality only matters after the query has already run"]$dbu51240$::jsonb,
   1, $dbu51241$Predicting expected row counts is a valuable sanity check for catching join bugs early.$dbu51241$, 1, 5),
  ($dbu51242$tq-dbms-sql-16-join-cardinality-7$dbu51242$, $dbu51243$pt-dbms-sql-16-join-cardinality$dbu51243$,
   $dbu51244$In a one-to-one relationship, how many rows in B can a single row in A match at most?$dbu51244$,
   $dbu51245$["Unlimited", "At most one", "Exactly zero", "Exactly two"]$dbu51245$::jsonb,
   1, $dbu51246$One-to-one means each side matches at most a single row on the other side.$dbu51246$, 1, 6),
  ($dbu51247$tq-dbms-sql-16-join-cardinality-8$dbu51247$, $dbu51248$pt-dbms-sql-16-join-cardinality$dbu51248$,
   $dbu51249$Is the students-courses relationship (via an enrollments table) best described as one-to-many or many-to-many?$dbu51249$,
   $dbu51250$["One-to-many", "Many-to-many \u2014 a student can take many courses, and a course can have many students", "One-to-one", "None of these apply"]$dbu51250$::jsonb,
   1, $dbu51251$Both directions of the relationship allow multiple matches, making this a classic many-to-many case.$dbu51251$, 1, 7)
on conflict (id) do nothing;

-- 16.11 Duplicate Rows
with g as (select id from public.learning_grids where lower(slug) = $dbu51252$dbms-sql-tutorial$dbu51252$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51253$chapter-16-joins$dbu51253$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51254$Duplicate Rows$dbu51254$, $dbu51255$duplicate-rows$dbu51255$, '', 11, 'published', true, true, $dbu51256$dbms_sql_tutorial$dbu51256$, $dbu51257$chapter-16-joins/duplicate-rows$dbu51257$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51258$dbms_sql_tutorial$dbu51258$ and source_ref = $dbu51259$chapter-16-joins/duplicate-rows$dbu51259$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51260$Duplicate Rows$dbu51260$, $dbu51261$### Definition

Joins can introduce **duplicate-looking rows** into a result — not literal duplicate rows in the stored data, but repeated values from one side of a one-to-many (or fan-out) relationship, which is a direct, expected consequence of join cardinality (16.10), not a bug in the join itself.

### How It Works

```sql
SELECT d.name AS department, e.name AS employee
FROM departments d
JOIN employees e ON e.department_id = d.id;
```

If Engineering has two employees (Asha, Rohan), "Engineering" appears TWICE in the result — once per matching employee. This is entirely correct and expected: each output ROW represents one (department, employee) PAIR, and there are genuinely two such pairs for Engineering.

### Edge Cases and Pitfalls

- Seeing a repeated value in a join's output is not automatically a bug — check whether the REPETITION makes sense given the relationship's cardinality before assuming something is wrong.
- If TRUE duplicate rows (identical across every selected column) are the actual problem — e.g. because a join predicate unintentionally matched more broadly than intended — `DISTINCT` (12.2) removes them, but treating the symptom with `DISTINCT` without understanding WHY duplicates appeared risks papering over an actual join-condition bug rather than fixing it.
- A join predicate that's supposed to be one-to-one but isn't (due to a data-quality issue, like two rows in the "one" side accidentally sharing the same key) can silently produce more rows than expected — this looks identical to intended one-to-many duplication but is actually a data integrity problem worth investigating rather than a normal join outcome.

### Key Takeaways

- Repeated-looking values in a join's output are usually the expected, correct consequence of one-to-many cardinality, not a bug.
- DISTINCT can remove genuine duplicate rows, but should follow understanding WHY they appeared, not replace that understanding.
- Unexpected duplication can also signal a real data-quality problem (an unintended one-to-many where one-to-one was assumed) — worth investigating rather than blindly de-duplicating.$dbu51261$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51262$dbms_sql_tutorial_seed$dbu51262$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51263$dbms_sql_tutorial_seed$dbu51263$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51264$dbms-sql-tutorial$dbu51264$),
     t as (select id from public.learning_topics where source_kind = $dbu51265$dbms_sql_tutorial$dbu51265$ and source_ref = $dbu51266$chapter-16-joins/duplicate-rows$dbu51266$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51267$pt-dbms-sql-16-duplicate-rows$dbu51267$, $dbu51268$Duplicate Rows - Quick Test$dbu51268$, 'aptitude', 8, 8,
  $dbu51269$8 questions on Duplicate Rows.$dbu51269$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51270$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51270$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51271$tq-dbms-sql-16-duplicate-rows-1$dbu51271$, $dbu51272$pt-dbms-sql-16-duplicate-rows$dbu51272$,
   $dbu51273$When Engineering appears twice in a departments-to-employees join result, is this a bug?$dbu51273$,
   $dbu51274$["Yes, always a bug requiring DISTINCT", "No \u2014 it's the expected consequence of Engineering having two employees, an intended result of one-to-many cardinality", "Yes, because department names should never repeat", "This can only be determined by running EXPLAIN"]$dbu51274$::jsonb,
   1, $dbu51275$Repeated values reflecting a genuine one-to-many relationship are correct, not duplicated data.$dbu51275$, 1, 0),
  ($dbu51276$tq-dbms-sql-16-duplicate-rows-2$dbu51276$, $dbu51277$pt-dbms-sql-16-duplicate-rows$dbu51277$,
   $dbu51278$What does each output row represent in a one-to-many join like departments to employees?$dbu51278$,
   $dbu51279$["One unique department", "One (department, employee) PAIR \u2014 there are as many rows as there are matching pairs", "One unique employee, ignoring department", "A random sample of the relationship"]$dbu51279$::jsonb,
   1, $dbu51280$Each row is a pairing, so a department with multiple employees naturally produces multiple rows.$dbu51280$, 1, 1),
  ($dbu51281$tq-dbms-sql-16-duplicate-rows-3$dbu51281$, $dbu51282$pt-dbms-sql-16-duplicate-rows$dbu51282$,
   $dbu51283$Should DISTINCT be applied automatically whenever a join produces repeated-looking values?$dbu51283$,
   $dbu51284$["Yes, always apply DISTINCT to be safe", "Not necessarily \u2014 first understand WHY the repetition occurs; blindly applying DISTINCT can mask an actual join-condition bug", "DISTINCT has no effect on join results", "DISTINCT should only be used with CROSS JOIN"]$dbu51284$::jsonb,
   1, $dbu51285$Understanding the cause of duplication should precede reaching for DISTINCT as a fix.$dbu51285$, 1, 2),
  ($dbu51286$tq-dbms-sql-16-duplicate-rows-4$dbu51286$, $dbu51287$pt-dbms-sql-16-duplicate-rows$dbu51287$,
   $dbu51288$What could cause TRUE unintended duplicate rows in a join meant to be one-to-one?$dbu51288$,
   $dbu51289$["This can never happen if the join syntax is correct", "A data-quality issue, like two rows on the 'one' side accidentally sharing the same key value", "Using INNER JOIN instead of LEFT JOIN", "Selecting too many columns"]$dbu51289$::jsonb,
   1, $dbu51290$A broken uniqueness assumption in the data itself can silently produce more matches than the intended one-to-one relationship allows.$dbu51290$, 1, 3),
  ($dbu51291$tq-dbms-sql-16-duplicate-rows-5$dbu51291$, $dbu51292$pt-dbms-sql-16-duplicate-rows$dbu51292$,
   $dbu51293$Is repeated data in a join result always identical to the underlying stored rows being duplicated in the table?$dbu51293$,
   $dbu51294$["Yes, always", "No \u2014 the repetition happens in the JOIN's output, not because the stored table itself contains duplicate rows", "The stored table is always modified by a SELECT with a join", "This distinction doesn't matter in practice"]$dbu51294$::jsonb,
   1, $dbu51295$The base tables remain unchanged; only the joined result exhibits value repetition reflecting the relationship.$dbu51295$, 1, 4),
  ($dbu51296$tq-dbms-sql-16-duplicate-rows-6$dbu51296$, $dbu51297$pt-dbms-sql-16-duplicate-rows$dbu51297$,
   $dbu51298$What is the relationship between this topic and join cardinality (16.10)?$dbu51298$,
   $dbu51299$["They are unrelated", "Duplicate-looking rows are a direct, expected consequence of one-to-many join cardinality", "Duplicate rows only occur with many-to-many cardinality, never one-to-many", "Cardinality only affects column count, not row repetition"]$dbu51299$::jsonb,
   1, $dbu51300$Understanding cardinality directly explains why and how much repetition to expect.$dbu51300$, 1, 5),
  ($dbu51301$tq-dbms-sql-16-duplicate-rows-7$dbu51301$, $dbu51302$pt-dbms-sql-16-duplicate-rows$dbu51302$,
   $dbu51303$If a one-to-one relationship unexpectedly produces duplicated rows, what should be investigated?$dbu51303$,
   $dbu51304$["Nothing \u2014 this is normal for one-to-one joins", "Whether a data-quality problem broke the intended uniqueness on the 'one' side", "Whether DISTINCT was used correctly, and nothing else", "Whether the SELECT statement used too many columns"]$dbu51304$::jsonb,
   1, $dbu51305$Unexpected duplication in a supposedly one-to-one relationship points to a genuine data integrity issue worth investigating.$dbu51305$, 1, 6),
  ($dbu51306$tq-dbms-sql-16-duplicate-rows-8$dbu51306$, $dbu51307$pt-dbms-sql-16-duplicate-rows$dbu51307$,
   $dbu51308$Does understanding expected cardinality help distinguish 'normal repetition' from 'a real bug'?$dbu51308$,
   $dbu51309$["No, cardinality is unrelated to this judgment", "Yes \u2014 knowing the expected relationship shape helps determine whether observed repetition is expected or a red flag", "Only DISTINCT can make this determination", "This can only be verified by contacting the database vendor"]$dbu51309$::jsonb,
   1, $dbu51310$Cardinality expectations are exactly the tool for judging whether repeated values are legitimate or a symptom of a problem.$dbu51310$, 1, 7)
on conflict (id) do nothing;

-- 16.12 Anti Join
with g as (select id from public.learning_grids where lower(slug) = $dbu51311$dbms-sql-tutorial$dbu51311$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51312$chapter-16-joins$dbu51312$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51313$Anti Join$dbu51313$, $dbu51314$anti-join$dbu51314$, '', 12, 'published', true, true, $dbu51315$dbms_sql_tutorial$dbu51315$, $dbu51316$chapter-16-joins/anti-join$dbu51316$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51317$dbms_sql_tutorial$dbu51317$ and source_ref = $dbu51318$chapter-16-joins/anti-join$dbu51318$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51319$Anti Join$dbu51319$, $dbu51320$### Definition

An **anti join** returns rows from one table that have NO matching row in another — the formal name for the `LEFT JOIN ... WHERE right.key IS NULL` pattern used repeatedly throughout this course (5.11, 7.11, 12.10).

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
SELECT d.id, d.name
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
WHERE e.id IS NULL;
```

This returns Marketing — the one department with zero employees. An anti join can also be expressed with `NOT EXISTS` (17.6), which is often preferred for correctness (it avoids the `NOT IN` + NULL gotcha from Chapter 7) and can be at least as efficient, since the engine can stop checking as soon as it confirms no match exists.

### Edge Cases and Pitfalls

- The `WHERE e.id IS NULL` MUST check a column that's actually `NULL` only when unmatched — using a column that could ALSO be genuinely `NULL` in a matched row (rather than a `NOT NULL` column like a primary key) would incorrectly include matched-but-NULL rows as if they were unmatched.
- `NOT IN (subquery)` is a tempting-looking alternative to an anti join, but suffers the well-known NULL-poisoning gotcha (Chapter 7) — `NOT EXISTS` or the `LEFT JOIN ... IS NULL` pattern are the safe choices.
- Anti joins answer "which X have NONE of Y" — the conceptual opposite of a semi join (16.13), which answers "which X have AT LEAST ONE of Y."

### Key Takeaways

- Anti join finds rows with no match in another table — implemented via LEFT JOIN + IS NULL, or NOT EXISTS.
- Always check a column guaranteed non-NULL when matched (like a primary key), or the IS NULL test can misfire.
- Prefer NOT EXISTS/anti join over NOT IN with a subquery, due to NOT IN's NULL-related gotcha.$dbu51320$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51321$dbms_sql_tutorial_seed$dbu51321$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51322$dbms_sql_tutorial_seed$dbu51322$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51323$dbms-sql-tutorial$dbu51323$),
     t as (select id from public.learning_topics where source_kind = $dbu51324$dbms_sql_tutorial$dbu51324$ and source_ref = $dbu51325$chapter-16-joins/anti-join$dbu51325$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51326$pt-dbms-sql-16-anti-join$dbu51326$, $dbu51327$Anti Join - Quick Test$dbu51327$, 'aptitude', 8, 8,
  $dbu51328$8 questions on Anti Join.$dbu51328$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51329$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51329$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51330$tq-dbms-sql-16-anti-join-1$dbu51330$, $dbu51331$pt-dbms-sql-16-anti-join$dbu51331$,
   $dbu51332$What does an anti join return?$dbu51332$,
   $dbu51333$["Rows that match on both sides", "Rows from one table that have NO matching row in another table", "Every possible row combination", "Only rows with NULL values"]$dbu51333$::jsonb,
   1, $dbu51334$Anti join is specifically about finding unmatched rows.$dbu51334$, 1, 0),
  ($dbu51335$tq-dbms-sql-16-anti-join-2$dbu51335$, $dbu51336$pt-dbms-sql-16-anti-join$dbu51336$,
   $dbu51337$Which pattern implements an anti join using LEFT JOIN?$dbu51337$,
   $dbu51338$["LEFT JOIN ... WHERE right.key = left.key", "LEFT JOIN ... WHERE right.key IS NULL", "LEFT JOIN ... WHERE left.key IS NOT NULL", "LEFT JOIN ... ORDER BY right.key"]$dbu51338$::jsonb,
   1, $dbu51339$Filtering to rows where the right side's key is NULL after a LEFT JOIN finds exactly the unmatched rows.$dbu51339$, 1, 1),
  ($dbu51340$tq-dbms-sql-16-anti-join-3$dbu51340$, $dbu51341$pt-dbms-sql-16-anti-join$dbu51341$,
   $dbu51342$Why must the column checked with IS NULL be one that's guaranteed non-NULL when a match DOES exist (like a primary key)?$dbu51342$,
   $dbu51343$["It doesn't matter which column is checked", "Using a column that could be NULL even in a matched row would incorrectly treat matched-but-NULL rows as unmatched", "IS NULL only works on primary key columns", "This is a syntax requirement, not a correctness one"]$dbu51343$::jsonb,
   1, $dbu51344$The correctness of the anti-join pattern depends on the checked column reliably signaling 'no match' only when truly unmatched.$dbu51344$, 1, 2),
  ($dbu51345$tq-dbms-sql-16-anti-join-4$dbu51345$, $dbu51346$pt-dbms-sql-16-anti-join$dbu51346$,
   $dbu51347$Why is NOT EXISTS often preferred over LEFT JOIN + IS NULL or NOT IN for expressing an anti join?$dbu51347$,
   $dbu51348$["NOT EXISTS is not actually equivalent", "It avoids NOT IN's NULL-poisoning gotcha and can be efficient since the engine can stop at the first potential match found", "NOT EXISTS always returns more rows", "NOT EXISTS cannot be used with correlated conditions"]$dbu51348$::jsonb,
   1, $dbu51349$NOT EXISTS sidesteps the classic NULL-related NOT IN bug while remaining an efficient way to check for absence of a match.$dbu51349$, 1, 3),
  ($dbu51350$tq-dbms-sql-16-anti-join-5$dbu51350$, $dbu51351$pt-dbms-sql-16-anti-join$dbu51351$,
   $dbu51352$What is the conceptual opposite of an anti join?$dbu51352$,
   $dbu51353$["INNER JOIN", "A semi join, which finds rows with AT LEAST ONE match", "CROSS JOIN", "A self join"]$dbu51353$::jsonb,
   1, $dbu51354$Anti join (no matches) and semi join (at least one match) are direct conceptual opposites.$dbu51354$, 1, 4),
  ($dbu51355$tq-dbms-sql-16-anti-join-6$dbu51355$, $dbu51356$pt-dbms-sql-16-anti-join$dbu51356$,
   $dbu51357$In the running example, which department does the anti join query return?$dbu51357$,
   $dbu51358$["Engineering", "Marketing \u2014 the department with zero employees", "Sales", "All three departments"]$dbu51358$::jsonb,
   1, $dbu51359$Only Marketing has no matching employee rows.$dbu51359$, 1, 5),
  ($dbu51360$tq-dbms-sql-16-anti-join-7$dbu51360$, $dbu51361$pt-dbms-sql-16-anti-join$dbu51361$,
   $dbu51362$Why is NOT IN (subquery) considered risky compared to a proper anti join?$dbu51362$,
   $dbu51363$["NOT IN is always slower", "If the subquery's result contains any NULL, the entire NOT IN condition can evaluate to UNKNOWN for every row, silently returning zero results", "NOT IN cannot be used with SELECT statements", "NOT IN is deprecated in modern SQL"]$dbu51363$::jsonb,
   1, $dbu51364$This is the exact NULL-in-list gotcha from Chapter 7, which anti-join patterns (LEFT JOIN + IS NULL, or NOT EXISTS) avoid.$dbu51364$, 1, 6),
  ($dbu51365$tq-dbms-sql-16-anti-join-8$dbu51365$, $dbu51366$pt-dbms-sql-16-anti-join$dbu51366$,
   $dbu51367$Is 'anti join' a distinct SQL keyword, or a named pattern built from existing SQL features?$dbu51367$,
   $dbu51368$["A distinct SQL keyword (ANTI JOIN)", "A named pattern, typically implemented via LEFT JOIN + IS NULL or NOT EXISTS \u2014 there's no dedicated ANTI JOIN keyword in standard SQL", "Only available via a stored procedure", "A NoSQL-only concept"]$dbu51368$::jsonb,
   1, $dbu51369$Anti join describes a query PATTERN, not a specific SQL syntax keyword.$dbu51369$, 1, 7)
on conflict (id) do nothing;

-- 16.13 Semi Join
with g as (select id from public.learning_grids where lower(slug) = $dbu51370$dbms-sql-tutorial$dbu51370$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51371$chapter-16-joins$dbu51371$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51372$Semi Join$dbu51372$, $dbu51373$semi-join$dbu51373$, '', 13, 'published', true, true, $dbu51374$dbms_sql_tutorial$dbu51374$, $dbu51375$chapter-16-joins/semi-join$dbu51375$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51376$dbms_sql_tutorial$dbu51376$ and source_ref = $dbu51377$chapter-16-joins/semi-join$dbu51377$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51378$Semi Join$dbu51378$, $dbu51379$### Definition

A **semi join** returns rows from one table that have AT LEAST ONE matching row in another — WITHOUT duplicating the row for each match, and without pulling in any columns from the other table. It answers "does a match exist?" not "what does the match look like?"

Running example — `departments(id, name)` and `employees(id, name, department_id, manager_id, salary)`, where `department_id`/`manager_id` can be `NULL`:

**departments**: (1, Engineering), (2, Sales), (3, Marketing)

**employees**: (1, Asha, dept=1, mgr=NULL, 90000), (2, Rohan, dept=1, mgr=1, 70000), (3, Neha, dept=2, mgr=1, 65000), (4, Vikram, dept=NULL, mgr=1, 50000)

Note: Marketing (dept 3) has no employees; Vikram has no department; Asha has no manager.

```sql
SELECT d.id, d.name
FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id);
```

This returns Engineering and Sales (each has at least one employee) — each appearing EXACTLY ONCE, regardless of how many employees they actually have. Contrast this with an ordinary `JOIN`, which would duplicate Engineering once per employee (16.10, 16.11) — a semi join specifically avoids that duplication, since it only cares about existence, not the matched rows' data.

### Edge Cases and Pitfalls

- `EXISTS` is the standard way to express a semi join in SQL — there's no dedicated `SEMI JOIN` keyword in mainstream SQL, similar to how anti join has no dedicated keyword either.
- `IN (subquery)` can also express a semi join (`WHERE d.id IN (SELECT department_id FROM employees)`), but `EXISTS` is often preferred: it's immune to the `IN`+NULL gotcha in certain formulations, and can stop scanning as soon as one match is confirmed rather than necessarily building a full list of matching values first.
- Semi join is exactly the technique to use INSTEAD OF `JOIN ... DISTINCT` when the goal is "which X have at least one related Y" — using an ordinary join plus `DISTINCT` to remove duplicates WORKS, but does more work than necessary (matching every row, then deduplicating) compared to a semi join's "stop at first match" efficiency.

### Key Takeaways

- Semi join finds rows with at least one match elsewhere, returning each qualifying row exactly once, with no columns pulled from the other table.
- EXISTS is the standard way to express it; no dedicated SEMI JOIN keyword exists.
- Prefer semi join (EXISTS) over JOIN + DISTINCT for pure "does a match exist" questions — it's a more direct, efficient expression of the actual question.$dbu51379$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51380$dbms_sql_tutorial_seed$dbu51380$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51381$dbms_sql_tutorial_seed$dbu51381$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51382$dbms-sql-tutorial$dbu51382$),
     t as (select id from public.learning_topics where source_kind = $dbu51383$dbms_sql_tutorial$dbu51383$ and source_ref = $dbu51384$chapter-16-joins/semi-join$dbu51384$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51385$pt-dbms-sql-16-semi-join$dbu51385$, $dbu51386$Semi Join - Quick Test$dbu51386$, 'aptitude', 8, 8,
  $dbu51387$8 questions on Semi Join.$dbu51387$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51388$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51388$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51389$tq-dbms-sql-16-semi-join-1$dbu51389$, $dbu51390$pt-dbms-sql-16-semi-join$dbu51390$,
   $dbu51391$What does a semi join return?$dbu51391$,
   $dbu51392$["Rows with no match in another table", "Rows with AT LEAST ONE match in another table, each returned exactly once, with no columns from the matched table", "Every row combination between two tables", "Only rows with exactly one match"]$dbu51392$::jsonb,
   1, $dbu51393$Semi join answers 'does a match exist' without duplicating or pulling in the other table's columns.$dbu51393$, 1, 0),
  ($dbu51394$tq-dbms-sql-16-semi-join-2$dbu51394$, $dbu51395$pt-dbms-sql-16-semi-join$dbu51395$,
   $dbu51396$In the running example, how many times does Engineering appear in the semi join result, regardless of its employee count?$dbu51396$,
   $dbu51397$["Once per employee", "Exactly once", "Zero times", "Twice, always"]$dbu51397$::jsonb,
   1, $dbu51398$Semi join returns each qualifying row exactly once, unlike an ordinary join which would duplicate per match.$dbu51398$, 1, 1),
  ($dbu51399$tq-dbms-sql-16-semi-join-3$dbu51399$, $dbu51400$pt-dbms-sql-16-semi-join$dbu51400$,
   $dbu51401$Which SQL construct is the standard way to express a semi join?$dbu51401$,
   $dbu51402$["SEMI JOIN keyword", "EXISTS (correlated subquery)", "CROSS JOIN", "UNION"]$dbu51402$::jsonb,
   1, $dbu51403$EXISTS is the idiomatic way to express 'has at least one match' semantics.$dbu51403$, 1, 2),
  ($dbu51404$tq-dbms-sql-16-semi-join-4$dbu51404$, $dbu51405$pt-dbms-sql-16-semi-join$dbu51405$,
   $dbu51406$How does a semi join (via EXISTS) compare to JOIN + DISTINCT for the same 'which departments have any employees' question?$dbu51406$,
   $dbu51407$["They are identical in every way with no practical difference", "Semi join is a more direct expression of the actual question and can be more efficient, since it can stop at the first match rather than matching everything then deduplicating", "JOIN + DISTINCT is always faster", "Semi join cannot answer this question at all"]$dbu51407$::jsonb,
   1, $dbu51408$Semi join's 'stop at first match' nature avoids the extra work of full matching plus deduplication.$dbu51408$, 1, 3),
  ($dbu51409$tq-dbms-sql-16-semi-join-5$dbu51409$, $dbu51410$pt-dbms-sql-16-semi-join$dbu51410$,
   $dbu51411$Can IN (subquery) also express a semi join?$dbu51411$,
   $dbu51412$["No, only EXISTS can express a semi join", "Yes \u2014 WHERE d.id IN (SELECT department_id FROM employees) expresses the same semi-join logic, though EXISTS is often preferred", "IN can only be used for anti joins", "IN requires a JOIN to be present first"]$dbu51412$::jsonb,
   1, $dbu51413$Both IN and EXISTS can express semi-join semantics, with EXISTS generally favored for its efficiency and NULL-safety characteristics.$dbu51413$, 1, 4),
  ($dbu51414$tq-dbms-sql-16-semi-join-6$dbu51414$, $dbu51415$pt-dbms-sql-16-semi-join$dbu51415$,
   $dbu51416$Does a semi join pull in any columns from the table being checked for a match?$dbu51416$,
   $dbu51417$["Yes, all matched columns are included", "No \u2014 a semi join only checks for existence; no columns from the other table appear in the result", "Only the primary key is included", "This depends on the SELECT clause"]$dbu51417$::jsonb,
   1, $dbu51418$This is a defining trait distinguishing semi join from an ordinary JOIN — it's purely an existence check.$dbu51418$, 1, 5),
  ($dbu51419$tq-dbms-sql-16-semi-join-7$dbu51419$, $dbu51420$pt-dbms-sql-16-semi-join$dbu51420$,
   $dbu51421$Is there a dedicated SEMI JOIN keyword in mainstream SQL?$dbu51421$,
   $dbu51422$["Yes, SEMI JOIN is standard syntax", "No \u2014 like anti join, semi join is a named pattern (typically via EXISTS), not a distinct keyword", "Only PostgreSQL has a SEMI JOIN keyword", "SEMI JOIN was removed from the SQL standard"]$dbu51422$::jsonb,
   1, $dbu51423$Semi join describes a query pattern rather than a specific piece of SQL syntax.$dbu51423$, 1, 6),
  ($dbu51424$tq-dbms-sql-16-semi-join-8$dbu51424$, $dbu51425$pt-dbms-sql-16-semi-join$dbu51425$,
   $dbu51426$What kind of real-world question is a semi join best suited to answer?$dbu51426$,
   $dbu51427$["What is the total of a related value?", "Does at least one related row exist? (e.g. which departments have any employees at all)", "What is the earliest related date?", "How many related rows exist exactly?"]$dbu51427$::jsonb,
   1, $dbu51428$Semi join is specifically optimized for a yes/no existence question, not for retrieving or counting related data.$dbu51428$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 17: Subqueries
-- ---------------------------------------------------------------------------
-- 17.1 Scalar Subquery
with g as (select id from public.learning_grids where lower(slug) = $dbu51429$dbms-sql-tutorial$dbu51429$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51430$chapter-17-subqueries$dbu51430$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51431$Scalar Subquery$dbu51431$, $dbu51432$scalar-subquery$dbu51432$, '', 1, 'published', true, true, $dbu51433$dbms_sql_tutorial$dbu51433$, $dbu51434$chapter-17-subqueries/scalar-subquery$dbu51434$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51435$dbms_sql_tutorial$dbu51435$ and source_ref = $dbu51436$chapter-17-subqueries/scalar-subquery$dbu51436$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51437$Scalar Subquery$dbu51437$, $dbu51438$### What Is a Scalar Subquery?

A **scalar subquery** is a subquery that is guaranteed to return exactly one row and exactly one column — a single value. Because it collapses to one value, SQL lets you use it anywhere a literal value, column reference, or expression would be legal: in the SELECT list, in a WHERE comparison, in an ORDER BY, even as a default value.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### Basic Example

```sql
SELECT name, salary, (SELECT AVG(salary) FROM employees) AS company_avg
FROM employees;
```

Result (the company average is 71250.00, the same for every row since this particular subquery is uncorrelated):

| name  | salary | company_avg |
|-------|--------|--------------|
| Alice | 95000  | 71250.00 |
| Bob   | 72000  | 71250.00 |
| Carol | 68000  | 71250.00 |
| Dave  | 60000  | 71250.00 |
| Eve   | 88000  | 71250.00 |
| Frank | 55000  | 71250.00 |
| Grace | 70000  | 71250.00 |
| Heidi | 62000  | 71250.00 |

### Using It in a Comparison

```sql
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```

Result: Alice (95000), Bob (72000), Eve (88000), Grace (70000) — everyone above 71250.

### What Happens If It Doesn't Return Exactly One Value?

- If the inner query returns **zero rows**, a scalar subquery evaluates to `NULL` (not an error) — e.g. `(SELECT salary FROM employees WHERE name = 'Zack')` yields NULL, and any comparison against it (`> NULL`) also evaluates to UNKNOWN, so rows are silently excluded rather than erroring.
- If it returns **more than one row**, most engines raise a runtime error ("more than one row returned by a subquery used as an expression") — see 17.2 for the full gotcha.
- It must also return exactly one **column** — `(SELECT name, salary FROM ...)` used where a scalar is expected is a syntax/type error.

### Aggregates Make This Safe

Aggregate functions (`AVG`, `COUNT`, `SUM`, `MAX`, `MIN`) always collapse to a single row when there's no `GROUP BY`, which is why scalar subqueries are almost always built around an aggregate with no `GROUP BY`, or a query filtered down to a unique key (like a primary key lookup).

### Key Takeaways / Q&A

**Q: Can a scalar subquery appear in an ORDER BY?**
A: Yes — anywhere a single-value expression is legal.

**Q: What's the difference between a scalar subquery and a single-row subquery?**
A: They're closely related; "scalar" emphasizes it returns one value used as data (e.g., in SELECT), while "single-row" (17.2) emphasizes the *guarantee* needed for a WHERE comparison. In practice they're the same underlying shape.

**Q: Is a scalar subquery in SELECT correlated or uncorrelated?**
A: It can be either — `(SELECT AVG(salary) FROM employees)` above is uncorrelated (same value for every row); a correlated version is shown in 17.9.

**Edge case:** a scalar subquery returning zero rows gives `NULL`, not an error — easy to mistake for "no such employee" logic breaking silently rather than failing loudly.
$dbu51438$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51439$dbms_sql_tutorial_seed$dbu51439$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51440$dbms_sql_tutorial_seed$dbu51440$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51441$dbms-sql-tutorial$dbu51441$),
     t as (select id from public.learning_topics where source_kind = $dbu51442$dbms_sql_tutorial$dbu51442$ and source_ref = $dbu51443$chapter-17-subqueries/scalar-subquery$dbu51443$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51444$pt-dbms-sql-17-scalar-subquery$dbu51444$, $dbu51445$Scalar Subquery - Quick Test$dbu51445$, 'aptitude', 8, 8,
  $dbu51446$8 questions on Scalar Subquery.$dbu51446$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51447$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51447$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51448$tq-dbms-sql-17-scalar-subquery-1$dbu51448$, $dbu51449$pt-dbms-sql-17-scalar-subquery$dbu51449$,
   $dbu51450$What must a scalar subquery return?$dbu51450$,
   $dbu51451$["Exactly one row and one column", "Any number of rows", "Exactly one row, any number of columns", "A boolean value"]$dbu51451$::jsonb,
   0, $dbu51452$A scalar subquery must collapse to a single value: one row, one column.$dbu51452$, 1, 0),
  ($dbu51453$tq-dbms-sql-17-scalar-subquery-2$dbu51453$, $dbu51454$pt-dbms-sql-17-scalar-subquery$dbu51454$,
   $dbu51455$Where can a scalar subquery legally be used?$dbu51455$,
   $dbu51456$["Only in WHERE", "Only in FROM", "Anywhere a single value/expression is expected (SELECT, WHERE, ORDER BY, etc.)", "Only in HAVING"]$dbu51456$::jsonb,
   2, $dbu51457$Because it resolves to one value, it can stand in anywhere an expression is legal.$dbu51457$, 1, 1),
  ($dbu51458$tq-dbms-sql-17-scalar-subquery-3$dbu51458$, $dbu51459$pt-dbms-sql-17-scalar-subquery$dbu51459$,
   $dbu51460$What does `(SELECT salary FROM employees WHERE name='Zack')` evaluate to if no employee named Zack exists?$dbu51460$,
   $dbu51461$["An error", "0", "NULL", "An empty string"]$dbu51461$::jsonb,
   2, $dbu51462$Zero rows returned by a scalar subquery yields NULL, not an error.$dbu51462$, 1, 2),
  ($dbu51463$tq-dbms-sql-17-scalar-subquery-4$dbu51463$, $dbu51464$pt-dbms-sql-17-scalar-subquery$dbu51464$,
   $dbu51465$`SELECT name, salary, (SELECT AVG(salary) FROM employees) AS company_avg FROM employees;` — what does the company_avg column look like across all 8 rows?$dbu51465$,
   $dbu51466$["A different value per row, matching that employee's department", "The same value, 71250.00, repeated in every row", "NULL in every row", "It errors because a subquery cannot appear in SELECT"]$dbu51466$::jsonb,
   1, $dbu51467$The subquery is uncorrelated, so it is the same single company-wide average for every outer row.$dbu51467$, 1, 3),
  ($dbu51468$tq-dbms-sql-17-scalar-subquery-5$dbu51468$, $dbu51469$pt-dbms-sql-17-scalar-subquery$dbu51469$,
   $dbu51470$Which of these would be safely usable as a scalar subquery expression?$dbu51470$,
   $dbu51471$["(SELECT name, salary FROM employees LIMIT 1)", "(SELECT department FROM employees) which can return 8 rows", "(SELECT MAX(salary) FROM employees)", "(SELECT * FROM employees WHERE id=1)"]$dbu51471$::jsonb,
   2, $dbu51472$MAX with no GROUP BY always collapses to one row, one column — a safe scalar shape. The others have multiple columns or an unbounded row count.$dbu51472$, 1, 4),
  ($dbu51473$tq-dbms-sql-17-scalar-subquery-6$dbu51473$, $dbu51474$pt-dbms-sql-17-scalar-subquery$dbu51474$,
   $dbu51475$Which SQL clause is a scalar subquery for a company-wide average salary most naturally used in?$dbu51475$,
   $dbu51476$["GROUP BY", "The SELECT list, as a computed column", "The FROM clause as a table", "A JOIN condition"]$dbu51476$::jsonb,
   1, $dbu51477$A common use of scalar subqueries is as a computed column alongside real columns.$dbu51477$, 1, 5),
  ($dbu51478$tq-dbms-sql-17-scalar-subquery-7$dbu51478$, $dbu51479$pt-dbms-sql-17-scalar-subquery$dbu51479$,
   $dbu51480$A scalar subquery must return at most:$dbu51480$,
   $dbu51481$["1 row, unlimited columns", "Unlimited rows, 1 column", "1 row and 1 column", "1 row per outer row group"]$dbu51481$::jsonb,
   2, $dbu51482$Both the row count and column count must be exactly one (or zero rows, which yields NULL).$dbu51482$, 1, 6),
  ($dbu51483$tq-dbms-sql-17-scalar-subquery-8$dbu51483$, $dbu51484$pt-dbms-sql-17-scalar-subquery$dbu51484$,
   $dbu51485$Why do aggregate functions like AVG/COUNT/SUM make excellent scalar subqueries?$dbu51485$,
   $dbu51486$["They are always faster than joins", "They collapse to a single row automatically when there is no GROUP BY, guaranteeing the scalar shape", "They can only be used inside subqueries", "They automatically ignore rows with NULL department"]$dbu51486$::jsonb,
   1, $dbu51487$With no GROUP BY, an aggregate function always produces exactly one row, which is exactly what a scalar subquery needs.$dbu51487$, 1, 7)
on conflict (id) do nothing;

-- 17.2 Single Row Subquery
with g as (select id from public.learning_grids where lower(slug) = $dbu51488$dbms-sql-tutorial$dbu51488$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51489$chapter-17-subqueries$dbu51489$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51490$Single Row Subquery$dbu51490$, $dbu51491$single-row-subquery$dbu51491$, '', 2, 'published', true, true, $dbu51492$dbms_sql_tutorial$dbu51492$, $dbu51493$chapter-17-subqueries/single-row-subquery$dbu51493$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51494$dbms_sql_tutorial$dbu51494$ and source_ref = $dbu51495$chapter-17-subqueries/single-row-subquery$dbu51495$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51496$Single Row Subquery$dbu51496$, $dbu51497$### What Is a Single-Row Subquery?

A single-row subquery is a subquery you *intend and expect* to return at most one row, so it can be safely used with single-row comparison operators: `=`, `<`, `>`, `<=`, `>=`, `<>`. It's the WHERE-clause cousin of the scalar subquery (17.1) — same shape requirement, framed from the "is it safe to compare against?" angle.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### A Correct Example

```sql
SELECT name, salary
FROM employees
WHERE salary > (SELECT salary FROM employees WHERE name = 'Eve');
```

`name = 'Eve'` matches exactly one row, so the subquery safely returns one value: 88000. Result:

| name  | salary |
|-------|--------|
| Alice | 95000 |

Only Alice earns more than Eve.

### The Runtime-Error Gotcha

This pattern is a trap the moment the "obviously unique" filter isn't actually unique:

```sql
SELECT name
FROM employees
WHERE department = (SELECT department FROM employees WHERE manager_id = 5);
```

`manager_id = 5` matches **two** rows — Dave and Frank both report to Eve (employee id 5) — so the subquery returns two rows. This raises a **runtime error**: `more than one row returned by a subquery used as an expression`.

This is important: it is NOT a silent wrong answer. The query fails outright, loudly, the moment it runs against data where the assumption ("only one row will match") turns out to be false. It's a genuine gotcha because the exact same query text can succeed on one day's data and fail on the next, purely because the underlying data changed shape — nothing about the SQL itself changed.

Note also: even if both matching rows happened to have the *identical* value (say both were 'Sales'), most engines (including PostgreSQL) still raise the error — the check is on **row count**, not on whether the values are distinct.

### How to Avoid It

- Add more filtering conditions to guarantee uniqueness (e.g., filter by a primary key or a column with a UNIQUE constraint).
- Force one row with an aggregate: `(SELECT MIN(department) FROM employees WHERE manager_id = 5)`.
- Or accept the subquery is genuinely multi-row and switch to `IN` / `ANY` / `ALL` / `EXISTS` (17.3, 17.7, 17.8).

### Key Takeaways / Q&A

**Q: Is "subquery returns more than one row" a compile-time or runtime error?**
A: Runtime — the query is syntactically valid; the engine only discovers the violation while executing it against actual data.

**Q: Does `=` ever tolerate multiple rows?**
A: No. `=`, `<`, `>`, `<=`, `>=`, `<>` all require single-row subqueries; use `IN` / `ANY` / `ALL` for a subquery that legitimately returns many rows.

**Q: Is a single-row subquery always a scalar subquery?**
A: Effectively yes — one row, one column — but "single-row" frames the WHERE-clause safety guarantee, while "scalar" (17.1) frames it as a value used as data.

**Edge case:** a single-row subquery that returns **zero** rows does NOT error — the comparison becomes `x > NULL`, which is UNKNOWN, and the outer row is simply excluded. Zero rows is safe; two-or-more rows is fatal.
$dbu51497$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51498$dbms_sql_tutorial_seed$dbu51498$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51499$dbms_sql_tutorial_seed$dbu51499$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51500$dbms-sql-tutorial$dbu51500$),
     t as (select id from public.learning_topics where source_kind = $dbu51501$dbms_sql_tutorial$dbu51501$ and source_ref = $dbu51502$chapter-17-subqueries/single-row-subquery$dbu51502$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51503$pt-dbms-sql-17-single-row-subquery$dbu51503$, $dbu51504$Single Row Subquery - Quick Test$dbu51504$, 'aptitude', 8, 8,
  $dbu51505$8 questions on Single Row Subquery.$dbu51505$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51506$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51506$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51507$tq-dbms-sql-17-single-row-subquery-1$dbu51507$, $dbu51508$pt-dbms-sql-17-single-row-subquery$dbu51508$,
   $dbu51509$A single-row subquery is intended to be used with which operators?$dbu51509$,
   $dbu51510$["IN only", "=, <, >, and similar comparison operators", "EXISTS only", "UNION"]$dbu51510$::jsonb,
   1, $dbu51511$Single-row subqueries pair with plain comparison operators because exactly one value is expected.$dbu51511$, 1, 0),
  ($dbu51512$tq-dbms-sql-17-single-row-subquery-2$dbu51512$, $dbu51513$pt-dbms-sql-17-single-row-subquery$dbu51513$,
   $dbu51514$What happens at runtime if a subquery used with `=` unexpectedly returns 3 rows?$dbu51514$,
   $dbu51515$["The database picks the first row automatically", "The database raises a runtime error", "The comparison silently becomes FALSE", "The query returns NULL for all rows"]$dbu51515$::jsonb,
   1, $dbu51516$Comparison operators like `=` require at most one row; more than one row is a runtime error, not a silent fallback.$dbu51516$, 1, 1),
  ($dbu51517$tq-dbms-sql-17-single-row-subquery-3$dbu51517$, $dbu51518$pt-dbms-sql-17-single-row-subquery$dbu51518$,
   $dbu51519$What happens if a single-row subquery used with `>` returns ZERO rows?$dbu51519$,
   $dbu51520$["A runtime error", "The comparison evaluates to UNKNOWN, excluding the row", "The comparison evaluates to TRUE", "A syntax error"]$dbu51520$::jsonb,
   1, $dbu51521$Zero rows makes the subquery NULL, and any comparison against NULL is UNKNOWN, so the row is excluded — no error.$dbu51521$, 1, 2),
  ($dbu51522$tq-dbms-sql-17-single-row-subquery-4$dbu51522$, $dbu51523$pt-dbms-sql-17-single-row-subquery$dbu51523$,
   $dbu51524$Given `WHERE department = (SELECT department FROM employees WHERE manager_id = 5)`, where manager_id=5 matches both Dave and Frank, what is the outcome?$dbu51524$,
   $dbu51525$["It returns rows for whichever department appears first", "Runtime error: subquery returns more than one row", "It silently returns zero rows", "It automatically converts to IN"]$dbu51525$::jsonb,
   1, $dbu51526$Two rows come back from the subquery, which `=` cannot handle, so the engine raises the more-than-one-row error.$dbu51526$, 1, 3),
  ($dbu51527$tq-dbms-sql-17-single-row-subquery-5$dbu51527$, $dbu51528$pt-dbms-sql-17-single-row-subquery$dbu51528$,
   $dbu51529$Which best describes the relationship between a scalar subquery and a single-row subquery?$dbu51529$,
   $dbu51530$["Completely unrelated concepts", "Same underlying shape (one row, one column); \"single-row\" emphasizes safety for comparison operators", "Single-row subqueries can return multiple columns", "Scalar subqueries can never be used in WHERE"]$dbu51530$::jsonb,
   1, $dbu51531$Both require exactly one row and one column; the terms just emphasize different use contexts.$dbu51531$, 1, 4),
  ($dbu51532$tq-dbms-sql-17-single-row-subquery-6$dbu51532$, $dbu51533$pt-dbms-sql-17-single-row-subquery$dbu51533$,
   $dbu51534$If a subquery returns two rows with the identical value (e.g., both 'Sales'), and it's compared with `=`, what happens in engines like PostgreSQL?$dbu51534$,
   $dbu51535$["It succeeds because the values are identical", "It still raises \"more than one row\" \u2014 the check is on row count, not distinct values", "It automatically deduplicates first", "It returns 'Sales' twice as the result"]$dbu51535$::jsonb,
   1, $dbu51536$The engine checks how many rows came back, not whether their values happen to match — two rows is still an error.$dbu51536$, 1, 5),
  ($dbu51537$tq-dbms-sql-17-single-row-subquery-7$dbu51537$, $dbu51538$pt-dbms-sql-17-single-row-subquery$dbu51538$,
   $dbu51539$Which technique guarantees a single-row result even when multiple matching rows exist?$dbu51539$,
   $dbu51540$["Adding DISTINCT only", "Wrapping the column in an aggregate like MIN or MAX", "Using SELECT *", "Adding ORDER BY"]$dbu51540$::jsonb,
   1, $dbu51541$An aggregate with no GROUP BY always collapses multiple candidate rows down to one.$dbu51541$, 1, 6),
  ($dbu51542$tq-dbms-sql-17-single-row-subquery-8$dbu51542$, $dbu51543$pt-dbms-sql-17-single-row-subquery$dbu51543$,
   $dbu51544$Why is "subquery returns more than one row" considered a good failure mode compared to many SQL bugs?$dbu51544$,
   $dbu51545$["Because it silently returns wrong data", "Because the database fails loudly instead of guessing which row to use", "Because it prevents the query from ever running again", "Because it converts the query to a join automatically"]$dbu51545$::jsonb,
   1, $dbu51546$Rather than arbitrarily picking one of several rows and risking a wrong answer, the engine refuses to guess and errors instead.$dbu51546$, 1, 7)
on conflict (id) do nothing;

-- 17.3 Multiple Row Subquery
with g as (select id from public.learning_grids where lower(slug) = $dbu51547$dbms-sql-tutorial$dbu51547$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51548$chapter-17-subqueries$dbu51548$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51549$Multiple Row Subquery$dbu51549$, $dbu51550$multiple-row-subquery$dbu51550$, '', 3, 'published', true, true, $dbu51551$dbms_sql_tutorial$dbu51551$, $dbu51552$chapter-17-subqueries/multiple-row-subquery$dbu51552$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51553$dbms_sql_tutorial$dbu51553$ and source_ref = $dbu51554$chapter-17-subqueries/multiple-row-subquery$dbu51554$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51555$Multiple Row Subquery$dbu51555$, $dbu51556$### What Is a Multiple-Row Subquery?

A multiple-row subquery is a subquery whose result set may legitimately contain more than one row. Because plain comparison operators (`=`, `>`, etc.) demand a single value, a multi-row subquery must be paired with an operator built for sets: `IN`, `NOT IN`, `ANY`, `ALL`, or wrapped in `EXISTS` / `NOT EXISTS`.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### IN — the Most Common Pairing

```sql
SELECT name
FROM employees
WHERE department IN (SELECT name FROM departments WHERE budget > 150000);
```

Departments with budget > 150000: Engineering (300000) and Sales (200000). The subquery returns 2 rows — exactly what `IN` is designed for.

Result: Alice, Bob, Carol, Dave, Eve, Frank (everyone in Engineering or Sales — 6 rows). Grace and Heidi (Marketing) are excluded since Marketing's budget is exactly 150000, not greater than it.

### Why `=` Would Break Here

```sql
-- WRONG — will raise a runtime error
SELECT name
FROM employees
WHERE department = (SELECT name FROM departments WHERE budget > 150000);
```

Because the inner query returns 2 rows ('Engineering', 'Sales'), this raises the same "more than one row" runtime error described in 17.2. `=` can never safely stand in for `IN`.

### The Full Toolkit for Multi-Row Subqueries

| Operator | Meaning |
|---|---|
| `IN` | value equals ANY row returned |
| `NOT IN` | value equals NONE of the rows (careful with NULLs — see 17.6) |
| `ANY` / `SOME` | comparison true for at least one row (17.7) |
| `ALL` | comparison true for every row (17.8) |
| `EXISTS` | at least one row exists at all, ignoring values (17.5) |

### Edge Cases

- If the multi-row subquery returns **zero** rows, `IN (...)` simply matches nothing (empty result) — no error.
- If it returns **duplicate** values, `IN` doesn't care — duplicates don't cause double-counting of outer rows, since `IN` is a membership test, not a join.
- `IN` subqueries (barring row-value syntax) must still return a single **column** — a subquery returning multiple columns is a different error than "multiple rows."

### Key Takeaways / Q&A

**Q: Is `IN (subquery)` the same as `= ANY (subquery)`?**
A: Yes — `IN` and `= ANY` are equivalent for multi-row subqueries.

**Q: Can `NOT IN` with a multi-row subquery ever behave unexpectedly?**
A: Yes, dangerously so — if any returned row is NULL, `NOT IN` can silently return zero rows for the entire outer query. Prefer `NOT EXISTS` when NULLs are possible (17.6).

**Q: Does a multiple-row subquery always come from a GROUP BY?**
A: No — any subquery without a uniqueness guarantee (no aggregate, no unique-column filter) can return multiple rows, including a simple `SELECT column FROM table WHERE ...` against a non-unique predicate.
$dbu51556$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51557$dbms_sql_tutorial_seed$dbu51557$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51558$dbms_sql_tutorial_seed$dbu51558$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51559$dbms-sql-tutorial$dbu51559$),
     t as (select id from public.learning_topics where source_kind = $dbu51560$dbms_sql_tutorial$dbu51560$ and source_ref = $dbu51561$chapter-17-subqueries/multiple-row-subquery$dbu51561$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51562$pt-dbms-sql-17-multiple-row-subquery$dbu51562$, $dbu51563$Multiple Row Subquery - Quick Test$dbu51563$, 'aptitude', 8, 8,
  $dbu51564$8 questions on Multiple Row Subquery.$dbu51564$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51565$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51565$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51566$tq-dbms-sql-17-multiple-row-subquery-1$dbu51566$, $dbu51567$pt-dbms-sql-17-multiple-row-subquery$dbu51567$,
   $dbu51568$A subquery that can return several rows must be paired with which of these?$dbu51568$,
   $dbu51569$["= only", "IN, ANY, ALL, or EXISTS", "ORDER BY", "GROUP BY only"]$dbu51569$::jsonb,
   1, $dbu51570$Multi-row subqueries need set-aware operators; plain `=` cannot handle more than one returned row.$dbu51570$, 1, 0),
  ($dbu51571$tq-dbms-sql-17-multiple-row-subquery-2$dbu51571$, $dbu51572$pt-dbms-sql-17-multiple-row-subquery$dbu51572$,
   $dbu51573$What happens if you use `=` instead of `IN` against a subquery that returns 2 rows?$dbu51573$,
   $dbu51574$["The database picks the first row", "A runtime \"more than one row\" error", "It automatically becomes IN", "It returns NULL"]$dbu51574$::jsonb,
   1, $dbu51575$`=` requires a single-row subquery; two rows triggers the same runtime error described in 17.2.$dbu51575$, 1, 1),
  ($dbu51576$tq-dbms-sql-17-multiple-row-subquery-3$dbu51576$, $dbu51577$pt-dbms-sql-17-multiple-row-subquery$dbu51577$,
   $dbu51578$`WHERE department IN (SELECT name FROM departments WHERE budget > 150000)` — with Engineering (300000) and Sales (200000) qualifying, how many distinct department names does the subquery return?$dbu51578$,
   $dbu51579$["1", "2", "3", "0"]$dbu51579$::jsonb,
   1, $dbu51580$Only Engineering and Sales exceed a budget of 150000, so the subquery returns those two names.$dbu51580$, 1, 2),
  ($dbu51581$tq-dbms-sql-17-multiple-row-subquery-4$dbu51581$, $dbu51582$pt-dbms-sql-17-multiple-row-subquery$dbu51582$,
   $dbu51583$What happens if a multi-row subquery used with IN returns duplicate values?$dbu51583$,
   $dbu51584$["The outer query errors", "Duplicates are irrelevant \u2014 IN is a membership test", "Outer rows get counted twice per duplicate", "The query silently returns nothing"]$dbu51584$::jsonb,
   1, $dbu51585$IN only checks whether a value appears in the set at all; repeated values in the subquery don't change the outcome.$dbu51585$, 1, 3),
  ($dbu51586$tq-dbms-sql-17-multiple-row-subquery-5$dbu51586$, $dbu51587$pt-dbms-sql-17-multiple-row-subquery$dbu51587$,
   $dbu51588$What happens if an IN-subquery returns zero rows?$dbu51588$,
   $dbu51589$["Runtime error", "The IN condition matches nothing \u2014 empty result, no error", "It matches everything", "NULL is returned for every row"]$dbu51589$::jsonb,
   1, $dbu51590$An empty set for IN just means nothing can match; this is a normal, error-free outcome.$dbu51590$, 1, 4),
  ($dbu51591$tq-dbms-sql-17-multiple-row-subquery-6$dbu51591$, $dbu51592$pt-dbms-sql-17-multiple-row-subquery$dbu51592$,
   $dbu51593$Which statement about NOT IN with a multi-row subquery is TRUE?$dbu51593$,
   $dbu51594$["It always behaves identically to NOT EXISTS", "If any subquery row is NULL, NOT IN can silently return zero rows overall", "NOT IN never has NULL-related issues", "NOT IN requires exactly one row"]$dbu51594$::jsonb,
   1, $dbu51595$A single NULL in the subquery's results can poison the entire NOT IN comparison to UNKNOWN for every outer row.$dbu51595$, 1, 5),
  ($dbu51596$tq-dbms-sql-17-multiple-row-subquery-7$dbu51596$, $dbu51597$pt-dbms-sql-17-multiple-row-subquery$dbu51597$,
   $dbu51598$`IN (subquery)` is logically equivalent to which comparison form?$dbu51598$,
   $dbu51599$["`> ALL`", "`= ANY`", "`< ANY`", "`<> ALL`"]$dbu51599$::jsonb,
   1, $dbu51600$`IN` and `= ANY` both mean "equal to at least one row returned by the subquery."$dbu51600$, 1, 6),
  ($dbu51601$tq-dbms-sql-17-multiple-row-subquery-8$dbu51601$, $dbu51602$pt-dbms-sql-17-multiple-row-subquery$dbu51602$,
   $dbu51603$A multi-row subquery used with a plain comparison operator like `<` will:$dbu51603$,
   $dbu51604$["Never error, always pick the smallest value", "Risk a \"more than one row\" runtime error whenever it returns 2+ rows", "Automatically be treated as ALL", "Only work if ORDER BY is added"]$dbu51604$::jsonb,
   1, $dbu51605$Plain comparison operators require a single-row subquery; multiple rows trigger a runtime error.$dbu51605$, 1, 7)
on conflict (id) do nothing;

-- 17.4 Correlated Subquery
with g as (select id from public.learning_grids where lower(slug) = $dbu51606$dbms-sql-tutorial$dbu51606$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51607$chapter-17-subqueries$dbu51607$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51608$Correlated Subquery$dbu51608$, $dbu51609$correlated-subquery$dbu51609$, '', 4, 'published', true, true, $dbu51610$dbms_sql_tutorial$dbu51610$, $dbu51611$chapter-17-subqueries/correlated-subquery$dbu51611$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51612$dbms_sql_tutorial$dbu51612$ and source_ref = $dbu51613$chapter-17-subqueries/correlated-subquery$dbu51613$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51614$Correlated Subquery$dbu51614$, $dbu51615$### What Makes a Subquery "Correlated"?

A correlated subquery references a column from the **outer** query inside its own WHERE clause (or SELECT list). Because that outer column's value changes for every outer row, the subquery can't be evaluated once and reused — conceptually, the engine re-runs it once per outer row, using that row's value each time. This contrasts with an **uncorrelated** subquery (like those in 17.1–17.3), which references nothing from the outer query and can be evaluated exactly once, its single result reused for every row.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### Classic Example: Above Your Own Department's Average

```sql
SELECT name, department, salary
FROM employees e
WHERE salary > (
  SELECT AVG(salary)
  FROM employees
  WHERE department = e.department   -- references the outer row e
);
```

Walk through it per department:
- Engineering avg = (95000+72000+68000)/3 = 78333.33 → only Alice (95000) beats it.
- Sales avg = (60000+88000+55000)/3 = 67666.67 → only Eve (88000) beats it.
- Marketing avg = (70000+62000)/2 = 66000.00 → only Grace (70000) beats it.

Result:

| name  | department  | salary |
|-------|-------------|--------|
| Alice | Engineering | 95000 |
| Eve   | Sales       | 88000 |
| Grace | Marketing   | 70000 |

Notice the inner `AVG(salary)` is computed **differently for each outer row**, because `e.department` changes each time — that's correlation.

### Why "Once Per Outer Row" Matters for Performance

Conceptually (and in a naive execution plan), the database evaluates the inner query separately for each of the 8 outer rows — 8 little aggregate scans instead of 1. On a small table this is invisible; on a table with millions of rows, a naively-executed correlated subquery can be dramatically slower than an equivalent JOIN (see 17.12), because the work scales as outer-rows × inner-query-cost. In practice, modern optimizers (PostgreSQL, SQL Server, Oracle) are often smart enough to **rewrite** a correlated subquery into a join or semi-join internally, avoiding the literal per-row re-execution — but this isn't guaranteed for every shape of query, so the "naive" cost model is still worth understanding.

### Uncorrelated vs Correlated, Side by Side

- Uncorrelated: `(SELECT AVG(salary) FROM employees)` — no outer reference, one number, reused everywhere.
- Correlated: `(SELECT AVG(salary) FROM employees WHERE department = e.department)` — outer reference `e.department`, a potentially different number per row.

### Key Takeaways / Q&A

**Q: How do you spot a correlated subquery just by reading it?**
A: Look for a column inside the subquery's WHERE clause that belongs to a table declared in the *outer* query, not the subquery's own FROM.

**Q: Can a correlated subquery appear anywhere besides WHERE?**
A: Yes — SELECT (17.9) and EXISTS (17.5) are the two other very common homes for correlation.

**Q: Is correlation itself a performance problem?**
A: Not inherently — it's a *shape*, not a guarantee of slowness. EXISTS-based correlated subqueries are often *fast* because the engine can stop at the first match. The real risk is a correlated **scalar** subquery in SELECT over a very large outer table with no optimizer rewrite available.
$dbu51615$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51616$dbms_sql_tutorial_seed$dbu51616$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51617$dbms_sql_tutorial_seed$dbu51617$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51618$dbms-sql-tutorial$dbu51618$),
     t as (select id from public.learning_topics where source_kind = $dbu51619$dbms_sql_tutorial$dbu51619$ and source_ref = $dbu51620$chapter-17-subqueries/correlated-subquery$dbu51620$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51621$pt-dbms-sql-17-correlated-subquery$dbu51621$, $dbu51622$Correlated Subquery - Quick Test$dbu51622$, 'aptitude', 8, 8,
  $dbu51623$8 questions on Correlated Subquery.$dbu51623$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51624$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51624$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51625$tq-dbms-sql-17-correlated-subquery-1$dbu51625$, $dbu51626$pt-dbms-sql-17-correlated-subquery$dbu51626$,
   $dbu51627$What defines a correlated subquery?$dbu51627$,
   $dbu51628$["It uses GROUP BY", "It references a column from the outer query", "It always returns multiple rows", "It must use EXISTS"]$dbu51628$::jsonb,
   1, $dbu51629$Correlation means the subquery reaches out to a column belonging to the outer query.$dbu51629$, 1, 0),
  ($dbu51630$tq-dbms-sql-17-correlated-subquery-2$dbu51630$, $dbu51631$pt-dbms-sql-17-correlated-subquery$dbu51631$,
   $dbu51632$In `WHERE salary > (SELECT AVG(salary) FROM employees WHERE department = e.department)`, conceptually how many times is the inner AVG computed for 8 outer rows (naive execution)?$dbu51632$,
   $dbu51633$["Once total", "Once per distinct department only", "Once per outer row (8 times)", "Never \u2014 it's a syntax error"]$dbu51633$::jsonb,
   2, $dbu51634$A naive execution model re-evaluates the correlated subquery separately for each outer row.$dbu51634$, 1, 1),
  ($dbu51635$tq-dbms-sql-17-correlated-subquery-3$dbu51635$, $dbu51636$pt-dbms-sql-17-correlated-subquery$dbu51636$,
   $dbu51637$An uncorrelated subquery differs from a correlated one because it:$dbu51637$,
   $dbu51638$["Always uses IN", "References nothing from the outer query, so it can be evaluated once and reused", "Can never appear in WHERE", "Always returns zero rows"]$dbu51638$::jsonb,
   1, $dbu51639$With no outer reference, the same single result applies to every outer row.$dbu51639$, 1, 2),
  ($dbu51640$tq-dbms-sql-17-correlated-subquery-4$dbu51640$, $dbu51641$pt-dbms-sql-17-correlated-subquery$dbu51641$,
   $dbu51642$Why can naive execution of a correlated subquery be slower than an equivalent JOIN on large tables?$dbu51642$,
   $dbu51643$["Correlated subqueries always use more disk space", "Work scales as outer-rows \u00d7 inner-query-cost when re-run per row", "JOINs are not allowed to appear alongside subqueries", "Correlated subqueries can't use indexes at all"]$dbu51643$::jsonb,
   1, $dbu51644$Re-running the inner query for every outer row multiplies cost by the outer row count.$dbu51644$, 1, 3),
  ($dbu51645$tq-dbms-sql-17-correlated-subquery-5$dbu51645$, $dbu51646$pt-dbms-sql-17-correlated-subquery$dbu51646$,
   $dbu51647$Do modern query optimizers always execute correlated subqueries literally once per outer row?$dbu51647$,
   $dbu51648$["Yes, always, with no exceptions", "No \u2014 they often rewrite them into joins/semi-joins internally, though not guaranteed for every case", "No, they refuse to run them", "Yes, and this is unfixable"]$dbu51648$::jsonb,
   1, $dbu51649$Optimizers frequently transform correlated subqueries into more efficient join plans, though this isn't universal.$dbu51649$, 1, 4),
  ($dbu51650$tq-dbms-sql-17-correlated-subquery-6$dbu51650$, $dbu51651$pt-dbms-sql-17-correlated-subquery$dbu51651$,
   $dbu51652$Using the sample data, which employees earn more than their own department's average (Engineering avg 78333.33, Sales avg 67666.67, Marketing avg 66000)?$dbu51652$,
   $dbu51653$["All 8 employees", "Alice, Eve, Grace", "Bob, Dave, Heidi", "Only Alice"]$dbu51653$::jsonb,
   1, $dbu51654$Only Alice, Eve, and Grace individually beat their respective department averages.$dbu51654$, 1, 5),
  ($dbu51655$tq-dbms-sql-17-correlated-subquery-7$dbu51655$, $dbu51656$pt-dbms-sql-17-correlated-subquery$dbu51656$,
   $dbu51657$Where else, besides WHERE, do correlated subqueries commonly appear?$dbu51657$,
   $dbu51658$["Only in ORDER BY", "The SELECT list and EXISTS clauses", "Only in table names", "Never anywhere else"]$dbu51658$::jsonb,
   1, $dbu51659$Correlated subqueries are also very common as computed SELECT columns (17.9) and inside EXISTS (17.5).$dbu51659$, 1, 6),
  ($dbu51660$tq-dbms-sql-17-correlated-subquery-8$dbu51660$, $dbu51661$pt-dbms-sql-17-correlated-subquery$dbu51661$,
   $dbu51662$Which statement most accurately reflects the performance nuance of correlation?$dbu51662$,
   $dbu51663$["Correlation always means slow queries", "Correlation is a shape, not a guarantee of slowness \u2014 EXISTS-based correlated subqueries can be fast since they stop at the first match", "Correlated subqueries can never be optimized", "Only uncorrelated subqueries can use indexes"]$dbu51663$::jsonb,
   1, $dbu51664$Correlation by itself isn't inherently slow; EXISTS in particular benefits from short-circuiting on the first match.$dbu51664$, 1, 7)
on conflict (id) do nothing;

-- 17.5 EXISTS
with g as (select id from public.learning_grids where lower(slug) = $dbu51665$dbms-sql-tutorial$dbu51665$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51666$chapter-17-subqueries$dbu51666$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51667$EXISTS$dbu51667$, $dbu51668$exists$dbu51668$, '', 5, 'published', true, true, $dbu51669$dbms_sql_tutorial$dbu51669$, $dbu51670$chapter-17-subqueries/exists$dbu51670$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51671$dbms_sql_tutorial$dbu51671$ and source_ref = $dbu51672$chapter-17-subqueries/exists$dbu51672$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51673$EXISTS$dbu51673$, $dbu51674$### What EXISTS Actually Tests

`EXISTS (subquery)` returns a plain boolean: **TRUE** if the subquery produces at least one row, **FALSE** if it produces zero rows. Crucially, EXISTS does not care *what* the row's column values are — it could `SELECT 1`, `SELECT *`, or `SELECT anything`; only row *presence* matters. This is why `SELECT 1` inside an EXISTS subquery is conventional — the optimizer never needs the actual values.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### A Correlated EXISTS Example

```sql
SELECT d.name
FROM departments d
WHERE EXISTS (
  SELECT 1 FROM employees e WHERE e.department = d.name
);
```

Walk through each department:
- Engineering → Alice/Bob/Carol match → EXISTS = TRUE
- Sales → Dave/Eve/Frank match → TRUE
- Marketing → Grace/Heidi match → TRUE
- HR → no employees at all → EXISTS = FALSE

Result:

| name |
|------|
| Engineering |
| Sales |
| Marketing |

HR is correctly excluded since no employee has `department = 'HR'`.

### Why EXISTS Can Beat IN with a Subquery

`IN (SELECT department FROM employees)` has to (conceptually) build the *entire* set of matching values before testing membership. `EXISTS`, on the other hand, can short-circuit: as soon as the engine finds **one** matching employee row for a department, it stops scanning and reports TRUE — it never needs to find all of them. For a department with thousands of matching employees, EXISTS only needs to locate the first one; a naive `IN` set-construction doesn't have that luxury in the same way, though modern optimizers often narrow this gap by rewriting `IN` into a semi-join too.

### EXISTS Is (Almost Always) Correlated

While `EXISTS (SELECT 1 FROM some_table)` with no outer reference is syntactically legal, it's rarely useful — it just answers "is this table non-empty?" once for the whole query. The real power of EXISTS comes from correlation: testing, per outer row, whether a related row exists somewhere else.

### Edge Cases

- `EXISTS` never returns NULL — it's always definitively TRUE or FALSE, unlike scalar/IN comparisons that can produce UNKNOWN when NULLs are involved.
- Selecting more columns inside an EXISTS subquery (`SELECT * FROM ...`) costs nothing extra in practice — engines recognize EXISTS and skip fetching column data; `SELECT 1` is a style convention, not a strict performance requirement in most modern databases.
- An EXISTS subquery can contain its own WHERE, GROUP BY, HAVING — any valid query shape; only the row-count-nonzero result matters in the end.

### Key Takeaways / Q&A

**Q: Does EXISTS ever error out due to "too many rows," like `=` would?**
A: No — EXISTS is happy with any number of matching rows, from 1 to millions; it only asks whether that number is zero or not.

**Q: Is `SELECT 1` required inside EXISTS?**
A: No, it's a convention signaling "we only care about row existence"; `SELECT *` or any column list works identically.

**Q: When is EXISTS clearer than IN?**
A: When the real question is "does at least one related row exist?" rather than "does this specific value appear in that list?"
$dbu51674$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51675$dbms_sql_tutorial_seed$dbu51675$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51676$dbms_sql_tutorial_seed$dbu51676$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51677$dbms-sql-tutorial$dbu51677$),
     t as (select id from public.learning_topics where source_kind = $dbu51678$dbms_sql_tutorial$dbu51678$ and source_ref = $dbu51679$chapter-17-subqueries/exists$dbu51679$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51680$pt-dbms-sql-17-exists$dbu51680$, $dbu51681$EXISTS - Quick Test$dbu51681$, 'aptitude', 8, 8,
  $dbu51682$8 questions on EXISTS.$dbu51682$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51683$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51683$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51684$tq-dbms-sql-17-exists-1$dbu51684$, $dbu51685$pt-dbms-sql-17-exists$dbu51685$,
   $dbu51686$What does EXISTS(subquery) evaluate to?$dbu51686$,
   $dbu51687$["The first row of the subquery", "TRUE or FALSE based on whether any row is returned", "NULL if zero rows are returned", "The count of matching rows"]$dbu51687$::jsonb,
   1, $dbu51688$EXISTS is a pure boolean test of row presence.$dbu51688$, 1, 0),
  ($dbu51689$tq-dbms-sql-17-exists-2$dbu51689$, $dbu51690$pt-dbms-sql-17-exists$dbu51690$,
   $dbu51691$Inside an EXISTS subquery, what do the selected columns matter for?$dbu51691$,
   $dbu51692$["They determine the final output columns", "Nothing \u2014 only row existence matters, so SELECT 1 or SELECT * behave the same", "They must match the outer SELECT list", "They must be aggregates"]$dbu51692$::jsonb,
   1, $dbu51693$EXISTS discards the actual selected values; it only checks whether any row came back.$dbu51693$, 1, 1),
  ($dbu51694$tq-dbms-sql-17-exists-3$dbu51694$, $dbu51695$pt-dbms-sql-17-exists$dbu51695$,
   $dbu51696$Using the sample data, why does the department 'HR' get excluded from `WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department = d.name)`?$dbu51696$,
   $dbu51697$["HR has no budget", "No employee has department = 'HR', so the subquery returns zero rows there", "HR is spelled differently in the departments table", "EXISTS always excludes the last row"]$dbu51697$::jsonb,
   1, $dbu51698$No employee row matches department 'HR', so the correlated subquery is empty and EXISTS is FALSE.$dbu51698$, 1, 2),
  ($dbu51699$tq-dbms-sql-17-exists-4$dbu51699$, $dbu51700$pt-dbms-sql-17-exists$dbu51700$,
   $dbu51701$Why can EXISTS be more efficient than IN with a large multi-row subquery?$dbu51701$,
   $dbu51702$["EXISTS can short-circuit and stop at the first matching row", "EXISTS always uses fewer joins", "IN cannot use correlated columns", "EXISTS is always evaluated at compile time"]$dbu51702$::jsonb,
   0, $dbu51703$EXISTS only needs to find one matching row to be satisfied, unlike building a full membership set.$dbu51703$, 1, 3),
  ($dbu51704$tq-dbms-sql-17-exists-5$dbu51704$, $dbu51705$pt-dbms-sql-17-exists$dbu51705$,
   $dbu51706$Can EXISTS ever evaluate to NULL or UNKNOWN?$dbu51706$,
   $dbu51707$["Yes, when the subquery has NULLs", "No \u2014 EXISTS is always definitively TRUE or FALSE", "Yes, when the subquery returns zero rows", "Only with NOT EXISTS"]$dbu51707$::jsonb,
   1, $dbu51708$Unlike value comparisons, EXISTS only checks row presence, so it never produces UNKNOWN.$dbu51708$, 1, 4),
  ($dbu51709$tq-dbms-sql-17-exists-6$dbu51709$, $dbu51710$pt-dbms-sql-17-exists$dbu51710$,
   $dbu51711$Is `EXISTS (SELECT 1 FROM employees)` with no outer reference a valid, if usually not very useful, query?$dbu51711$,
   $dbu51712$["No, it's a syntax error", "Yes \u2014 it's valid, it just answers \"is the table non-empty\" once for the whole query", "It always returns FALSE", "It requires GROUP BY"]$dbu51712$::jsonb,
   1, $dbu51713$An uncorrelated EXISTS is legal SQL, just a less powerful use of the construct.$dbu51713$, 1, 5),
  ($dbu51714$tq-dbms-sql-17-exists-7$dbu51714$, $dbu51715$pt-dbms-sql-17-exists$dbu51715$,
   $dbu51716$What is the real power of EXISTS most associated with?$dbu51716$,
   $dbu51717$["Sorting large tables", "Correlation \u2014 testing per outer row whether a related row exists", "Replacing all JOINs", "Aggregating data"]$dbu51717$::jsonb,
   1, $dbu51718$EXISTS shines when correlated, checking existence per outer row against related data.$dbu51718$, 1, 6),
  ($dbu51719$tq-dbms-sql-17-exists-8$dbu51719$, $dbu51720$pt-dbms-sql-17-exists$dbu51720$,
   $dbu51721$Which best describes why `SELECT 1` is conventional inside EXISTS rather than `SELECT column`?$dbu51721$,
   $dbu51722$["It's required by the SQL standard", "It's a style signal that only row presence matters; engines typically skip fetching data for EXISTS regardless", "It runs faster because 1 is an integer", "`SELECT column` is illegal inside EXISTS"]$dbu51722$::jsonb,
   1, $dbu51723$It's a readability convention, not a hard requirement — the actual selected values are irrelevant to EXISTS.$dbu51723$, 1, 7)
on conflict (id) do nothing;

-- 17.6 NOT EXISTS
with g as (select id from public.learning_grids where lower(slug) = $dbu51724$dbms-sql-tutorial$dbu51724$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51725$chapter-17-subqueries$dbu51725$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51726$NOT EXISTS$dbu51726$, $dbu51727$not-exists$dbu51727$, '', 6, 'published', true, true, $dbu51728$dbms_sql_tutorial$dbu51728$, $dbu51729$chapter-17-subqueries/not-exists$dbu51729$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51730$dbms_sql_tutorial$dbu51730$ and source_ref = $dbu51731$chapter-17-subqueries/not-exists$dbu51731$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51732$NOT EXISTS$dbu51732$, $dbu51733$### The Negation of EXISTS

`NOT EXISTS (subquery)` is TRUE exactly when the subquery returns **zero** rows — the mirror image of EXISTS. Like EXISTS, it only cares about row presence, never about the actual returned values, and it never produces NULL/UNKNOWN — always a clean TRUE or FALSE.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### Example: Departments With No Employees

```sql
SELECT d.name
FROM departments d
WHERE NOT EXISTS (
  SELECT 1 FROM employees e WHERE e.department = d.name
);
```

Engineering, Sales, and Marketing all have at least one employee, so `NOT EXISTS` is FALSE for them. HR has zero matching employees, so `NOT EXISTS` is TRUE.

Result:

| name |
|------|
| HR |

### Why NOT EXISTS Is Safer Than NOT IN

This is one of the most important gotchas in SQL, carried over from Chapter 7's discussion of `NOT IN` and NULLs. Suppose `employees.department` could contain a `NULL` (say, an unassigned new hire):

```sql
-- Dangerous if the subquery can return a NULL:
SELECT d.name
FROM departments d
WHERE d.name NOT IN (SELECT department FROM employees);
```

If even **one** row in `employees.department` is NULL, then for every candidate `d.name`, the comparison `d.name = NULL` evaluates to UNKNOWN rather than FALSE. Because `NOT IN` is internally a chain of `<> ALL`, a single UNKNOWN anywhere in that chain poisons the whole condition to UNKNOWN — so **the entire query silently returns zero rows**, even though the "obviously correct" answer (departments with no matching employee) is non-empty. No error, no warning — just a wrong, empty result set.

`NOT EXISTS` sidesteps this completely:

```sql
SELECT d.name
FROM departments d
WHERE NOT EXISTS (
  SELECT 1 FROM employees e WHERE e.department = d.name
);
```

Here, a NULL `e.department` on some unrelated employee row simply fails to match `e.department = d.name` for that one comparison, but it doesn't corrupt the *entire* subquery's TRUE/FALSE outcome the way `NOT IN`'s implicit `<> ALL` chain does. `NOT EXISTS` only asks "did any row match at all?" — a NULL just fails to be a match, like any other non-match.

### Rule of Thumb

Whenever there is *any* chance the subquery's column can contain NULL — and in real schemas, that's often — prefer `NOT EXISTS` over `NOT IN`. If you must use `NOT IN`, guard it explicitly: `... NOT IN (SELECT department FROM employees WHERE department IS NOT NULL)`.

### Edge Cases

- `NOT EXISTS` on a subquery with no outer correlation just asks "is this table (or filtered subset) definitely empty?"
- Double negatives (`NOT EXISTS` wrapping a subquery that itself uses `NOT EXISTS`) implement "for all" logic — a classic, if less common, relational-division-style pattern.

### Key Takeaways / Q&A

**Q: Is NOT EXISTS ever affected by NULLs in the subquery's columns the way NOT IN is?**
A: No — that's precisely its advantage; it only checks row existence, not value equality against a list that could include NULL.

**Q: When should you default to NOT EXISTS over NOT IN?**
A: Essentially always, unless you can 100% guarantee the subquery's column is NOT NULL — and it costs nothing to just always prefer NOT EXISTS for this pattern.
$dbu51733$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51734$dbms_sql_tutorial_seed$dbu51734$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51735$dbms_sql_tutorial_seed$dbu51735$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51736$dbms-sql-tutorial$dbu51736$),
     t as (select id from public.learning_topics where source_kind = $dbu51737$dbms_sql_tutorial$dbu51737$ and source_ref = $dbu51738$chapter-17-subqueries/not-exists$dbu51738$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51739$pt-dbms-sql-17-not-exists$dbu51739$, $dbu51740$NOT EXISTS - Quick Test$dbu51740$, 'aptitude', 8, 8,
  $dbu51741$8 questions on NOT EXISTS.$dbu51741$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51742$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51742$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51743$tq-dbms-sql-17-not-exists-1$dbu51743$, $dbu51744$pt-dbms-sql-17-not-exists$dbu51744$,
   $dbu51745$NOT EXISTS(subquery) is TRUE when:$dbu51745$,
   $dbu51746$["The subquery returns at least one row", "The subquery returns zero rows", "The subquery returns NULL", "The subquery errors"]$dbu51746$::jsonb,
   1, $dbu51747$NOT EXISTS is the mirror of EXISTS: TRUE only when no rows come back.$dbu51747$, 1, 0),
  ($dbu51748$tq-dbms-sql-17-not-exists-2$dbu51748$, $dbu51749$pt-dbms-sql-17-not-exists$dbu51749$,
   $dbu51750$Why is NOT IN dangerous when the subquery's column can contain NULL?$dbu51750$,
   $dbu51751$["It causes a runtime error immediately", "A single NULL among the subquery's rows can make the whole NOT IN condition evaluate to UNKNOWN, silently returning zero rows", "NULL values are automatically skipped, so there's no effect", "NOT IN converts NULLs to zero"]$dbu51751$::jsonb,
   1, $dbu51752$NOT IN is internally `<> ALL`, and one UNKNOWN comparison poisons the entire chain to UNKNOWN.$dbu51752$, 1, 1),
  ($dbu51753$tq-dbms-sql-17-not-exists-3$dbu51753$, $dbu51754$pt-dbms-sql-17-not-exists$dbu51754$,
   $dbu51755$Why is NOT EXISTS immune to the NULL problem that affects NOT IN?$dbu51755$,
   $dbu51756$["NOT EXISTS only checks row existence per correlated comparison, not equality against a list that could include NULL", "NOT EXISTS ignores NULLs by deleting them first", "NOT EXISTS cannot be used with correlated subqueries", "NOT EXISTS always returns TRUE"]$dbu51756$::jsonb,
   0, $dbu51757$A NULL just fails to match in one comparison; it doesn't corrupt the whole existence test.$dbu51757$, 1, 2),
  ($dbu51758$tq-dbms-sql-17-not-exists-4$dbu51758$, $dbu51759$pt-dbms-sql-17-not-exists$dbu51759$,
   $dbu51760$Using the sample data, which single department has NOT EXISTS(matching employees) = TRUE?$dbu51760$,
   $dbu51761$["Engineering", "Sales", "Marketing", "HR"]$dbu51761$::jsonb,
   3, $dbu51762$HR has zero employees, so it's the only department with no matching row.$dbu51762$, 1, 3),
  ($dbu51763$tq-dbms-sql-17-not-exists-5$dbu51763$, $dbu51764$pt-dbms-sql-17-not-exists$dbu51764$,
   $dbu51765$What is a safer alternative if you must use NOT IN with a possibly-NULL column?$dbu51765$,
   $dbu51766$["Nothing can be done", "Filter the subquery's column with IS NOT NULL", "Use ORDER BY in the subquery", "Add DISTINCT to the subquery"]$dbu51766$::jsonb,
   1, $dbu51767$Explicitly excluding NULLs from the subquery's result removes the poisoning risk.$dbu51767$, 1, 4),
  ($dbu51768$tq-dbms-sql-17-not-exists-6$dbu51768$, $dbu51769$pt-dbms-sql-17-not-exists$dbu51769$,
   $dbu51770$Does NOT EXISTS ever produce NULL or UNKNOWN as a result?$dbu51770$,
   $dbu51771$["Yes, whenever the subquery has NULLs", "No \u2014 it's always a clean TRUE or FALSE", "Only with correlated subqueries", "Only when combined with NOT IN"]$dbu51771$::jsonb,
   1, $dbu51772$Like EXISTS, NOT EXISTS is a pure existence test and never yields UNKNOWN.$dbu51772$, 1, 5),
  ($dbu51773$tq-dbms-sql-17-not-exists-7$dbu51773$, $dbu51774$pt-dbms-sql-17-not-exists$dbu51774$,
   $dbu51775$A NOT EXISTS subquery that itself contains another NOT EXISTS implements which classic pattern?$dbu51775$,
   $dbu51776$["A simple join", "A \"for all\" / relational-division style pattern", "A cartesian product", "An aggregate function"]$dbu51776$::jsonb,
   1, $dbu51777$Nested NOT EXISTS clauses are the classic way to express universal ("for all") conditions in SQL.$dbu51777$, 1, 6),
  ($dbu51778$tq-dbms-sql-17-not-exists-8$dbu51778$, $dbu51779$pt-dbms-sql-17-not-exists$dbu51779$,
   $dbu51780$Which statement correctly contrasts NOT IN and NOT EXISTS?$dbu51780$,
   $dbu51781$["They are always 100% interchangeable regardless of NULLs", "NOT IN is safer with NULLs than NOT EXISTS", "NOT EXISTS is generally safer with NULLs; NOT IN can silently return an empty result set if the subquery yields any NULL", "Both always error on NULLs"]$dbu51781$::jsonb,
   2, $dbu51782$NOT EXISTS avoids the NULL-poisoning trap that NOT IN is vulnerable to.$dbu51782$, 1, 7)
on conflict (id) do nothing;

-- 17.7 ANY
with g as (select id from public.learning_grids where lower(slug) = $dbu51783$dbms-sql-tutorial$dbu51783$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51784$chapter-17-subqueries$dbu51784$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51785$ANY$dbu51785$, $dbu51786$any$dbu51786$, '', 7, 'published', true, true, $dbu51787$dbms_sql_tutorial$dbu51787$, $dbu51788$chapter-17-subqueries/any$dbu51788$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51789$dbms_sql_tutorial$dbu51789$ and source_ref = $dbu51790$chapter-17-subqueries/any$dbu51790$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51791$ANY$dbu51791$, $dbu51792$### What ANY (and Its Alias SOME) Really Means

`x > ANY (subquery)` is TRUE if `x` is greater than **at least one** row from the subquery — equivalently, greater than the subquery's **minimum** value. `ANY` and `SOME` are exact synonyms in standard SQL. This is a weak, permissive comparison: only one match anywhere in the set is enough.

This is the single most commonly *misread* operator in this chapter — many people expect `ANY` to behave like "for any/all of them," implying a strict, universal condition. It's actually the opposite: it's satisfied by clearing just the lowest bar.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### Worked Example

```sql
SELECT name, salary
FROM employees
WHERE salary > ANY (SELECT salary FROM employees WHERE department = 'Marketing');
```

Marketing salaries are 70000 (Grace) and 62000 (Heidi); the **minimum** is 62000. `salary > ANY (...)` is equivalent to `salary > 62000`.

Checking all 8 employees against 62000:

| name | salary | > 62000? |
|------|--------|----------|
| Alice | 95000 | yes |
| Bob | 72000 | yes |
| Carol | 68000 | yes |
| Dave | 60000 | no |
| Eve | 88000 | yes |
| Frank | 55000 | no |
| Grace | 70000 | yes |
| Heidi | 62000 | no (not strictly greater) |

Result: Alice, Bob, Carol, Eve, Grace (5 rows).

### Translating ANY to Plain English

| Form | Plain-English equivalent |
|---|---|
| `x = ANY (subq)` | same as `x IN (subq)` |
| `x > ANY (subq)` | `x` > MIN(subq) |
| `x < ANY (subq)` | `x` < MAX(subq) |
| `x >= ANY (subq)` | `x` >= MIN(subq) |

### Edge Cases

- If the subquery returns **zero rows**, `x > ANY (...)` is always FALSE — there's nothing to be greater than "at least one of," so the condition can never be satisfied.
- `= ANY` is exactly equivalent to `IN` — a good sanity check if you ever forget which way ANY leans.
- Don't confuse `> ANY` with `> ALL` (17.8) — they compare against opposite ends of the subquery's value range (MIN vs MAX) and can produce very different result sets.

### Key Takeaways / Q&A

**Q: Is `salary > ANY (subquery)` a strict or permissive condition?**
A: Permissive/weak — it only needs to beat the smallest value in the subquery's result set.

**Q: What is `x > ANY (subquery)` equivalent to?**
A: `x > MIN(subquery)` (assuming the subquery returns at least one row).

**Q: What if someone reads "ANY" as meaning "must satisfy every row"?**
A: That's the classic misreading — that behavior is what `ALL` (17.8) actually provides, not `ANY`.

**Q: What happens with `> ANY` against an empty subquery result?**
A: Always FALSE — there is no row to be "greater than at least one of."
$dbu51792$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51793$dbms_sql_tutorial_seed$dbu51793$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51794$dbms_sql_tutorial_seed$dbu51794$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51795$dbms-sql-tutorial$dbu51795$),
     t as (select id from public.learning_topics where source_kind = $dbu51796$dbms_sql_tutorial$dbu51796$ and source_ref = $dbu51797$chapter-17-subqueries/any$dbu51797$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51798$pt-dbms-sql-17-any$dbu51798$, $dbu51799$ANY - Quick Test$dbu51799$, 'aptitude', 8, 8,
  $dbu51800$8 questions on ANY.$dbu51800$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51801$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51801$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51802$tq-dbms-sql-17-any-1$dbu51802$, $dbu51803$pt-dbms-sql-17-any$dbu51803$,
   $dbu51804$`salary > ANY (subquery)` means salary is greater than:$dbu51804$,
   $dbu51805$["Every row in the subquery (i.e., the maximum)", "At least one row in the subquery (i.e., the minimum)", "The average of the subquery", "Exactly one specific row"]$dbu51805$::jsonb,
   1, $dbu51806$ANY is satisfied by beating just the smallest qualifying value.$dbu51806$, 1, 0),
  ($dbu51807$tq-dbms-sql-17-any-2$dbu51807$, $dbu51808$pt-dbms-sql-17-any$dbu51808$,
   $dbu51809$Using Marketing salaries {70000, 62000}, what is `salary > ANY (SELECT salary FROM employees WHERE department='Marketing')` equivalent to?$dbu51809$,
   $dbu51810$["salary > 70000", "salary > 62000", "salary > 66000", "salary >= 70000"]$dbu51810$::jsonb,
   1, $dbu51811$ANY compares against the minimum of the subquery's results, which is 62000.$dbu51811$, 1, 1),
  ($dbu51812$tq-dbms-sql-17-any-3$dbu51812$, $dbu51813$pt-dbms-sql-17-any$dbu51813$,
   $dbu51814$`x = ANY (subquery)` is exactly equivalent to which operator?$dbu51814$,
   $dbu51815$["EXISTS", "IN", "ALL", "NOT IN"]$dbu51815$::jsonb,
   1, $dbu51816$`= ANY` and `IN` both mean the value matches at least one row from the subquery.$dbu51816$, 1, 2),
  ($dbu51817$tq-dbms-sql-17-any-4$dbu51817$, $dbu51818$pt-dbms-sql-17-any$dbu51818$,
   $dbu51819$A common misconception about ANY is that people expect it to mean:$dbu51819$,
   $dbu51820$["\"greater than the minimum\" (the correct meaning)", "A universal condition, like \"for every row\" \u2014 which is actually what ALL means", "It always returns a boolean", "It requires GROUP BY"]$dbu51820$::jsonb,
   1, $dbu51821$The word "any" sounds like it should be strict/universal, but it's actually the weak, permissive operator.$dbu51821$, 1, 3),
  ($dbu51822$tq-dbms-sql-17-any-5$dbu51822$, $dbu51823$pt-dbms-sql-17-any$dbu51823$,
   $dbu51824$If a subquery used with `> ANY` returns zero rows, the condition is:$dbu51824$,
   $dbu51825$["Always TRUE", "Always FALSE", "NULL/UNKNOWN", "A runtime error"]$dbu51825$::jsonb,
   1, $dbu51826$With nothing to compare against, there is no way to satisfy "greater than at least one," so it's FALSE.$dbu51826$, 1, 4),
  ($dbu51827$tq-dbms-sql-17-any-6$dbu51827$, $dbu51828$pt-dbms-sql-17-any$dbu51828$,
   $dbu51829$Using the sample data, which employees satisfy `salary > ANY (SELECT salary FROM employees WHERE department = 'Marketing')`?$dbu51829$,
   $dbu51830$["All 8 employees", "Alice, Bob, Carol, Eve, Grace", "Only Alice", "Dave, Frank, Heidi"]$dbu51830$::jsonb,
   1, $dbu51831$These five employees all earn more than 62000, the minimum Marketing salary.$dbu51831$, 1, 5),
  ($dbu51832$tq-dbms-sql-17-any-7$dbu51832$, $dbu51833$pt-dbms-sql-17-any$dbu51833$,
   $dbu51834$Which pair correctly contrasts ANY and ALL?$dbu51834$,
   $dbu51835$["`> ANY` compares to the maximum; `> ALL` compares to the minimum", "`> ANY` compares to the minimum; `> ALL` compares to the maximum", "They are always identical", "Neither can be thought of via aggregates"]$dbu51835$::jsonb,
   1, $dbu51836$ANY only needs to beat the weakest value (minimum); ALL must beat the strongest value (maximum).$dbu51836$, 1, 6),
  ($dbu51837$tq-dbms-sql-17-any-8$dbu51837$, $dbu51838$pt-dbms-sql-17-any$dbu51838$,
   $dbu51839$`SOME` in standard SQL is:$dbu51839$,
   $dbu51840$["A stricter version of ALL", "An exact synonym for ANY", "Only valid with EXISTS", "A deprecated keyword with no effect"]$dbu51840$::jsonb,
   1, $dbu51841$SOME and ANY behave identically in standard SQL.$dbu51841$, 1, 7)
on conflict (id) do nothing;

-- 17.8 ALL
with g as (select id from public.learning_grids where lower(slug) = $dbu51842$dbms-sql-tutorial$dbu51842$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51843$chapter-17-subqueries$dbu51843$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51844$ALL$dbu51844$, $dbu51845$all$dbu51845$, '', 8, 'published', true, true, $dbu51846$dbms_sql_tutorial$dbu51846$, $dbu51847$chapter-17-subqueries/all$dbu51847$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51848$dbms_sql_tutorial$dbu51848$ and source_ref = $dbu51849$chapter-17-subqueries/all$dbu51849$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51850$ALL$dbu51850$, $dbu51851$### What ALL Really Means

`x > ALL (subquery)` is TRUE only if `x` is greater than **every single row** the subquery returns — equivalently, greater than the subquery's **maximum** value. This is a strict, demanding comparison: `x` has to clear the highest bar in the set, not just any bar.

This is the direct contrast to ANY (17.7): ANY is satisfied by beating the weakest competitor; ALL requires beating the strongest one.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### Worked Example

```sql
SELECT name, salary
FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE department = 'Marketing');
```

Marketing salaries are 70000 (Grace) and 62000 (Heidi); the **maximum** is 70000. `salary > ALL (...)` is equivalent to `salary > 70000`.

Checking all 8 employees against 70000:

| name | salary | > 70000? |
|------|--------|----------|
| Alice | 95000 | yes |
| Bob | 72000 | yes |
| Carol | 68000 | no |
| Dave | 60000 | no |
| Eve | 88000 | yes |
| Frank | 55000 | no |
| Grace | 70000 | no (not strictly greater than itself) |
| Heidi | 62000 | no |

Result, ordered by salary descending: Alice (95000), Eve (88000), Bob (72000) — 3 rows.

### ANY vs ALL, Side by Side

Same subquery (Marketing salaries), same outer comparison direction, wildly different result sizes:
- `salary > ANY (...)` → 5 rows (beats the weakest Marketing salary, 62000)
- `salary > ALL (...)` → 3 rows (beats the strongest Marketing salary, 70000)

This is exactly why mixing them up is a real bug, not just a style choice — swapping `ANY` for `ALL` (or vice versa) silently changes which rows qualify, with no error to warn you.

### Translating ALL to Plain English

| Form | Plain-English equivalent |
|---|---|
| `x = ALL (subq)` | true only if the subquery returns one row (or zero) equal to x — rarely useful with = |
| `x > ALL (subq)` | `x` > MAX(subq) |
| `x < ALL (subq)` | `x` < MIN(subq) |
| `x <> ALL (subq)` | same as `x NOT IN (subq)` |

### Edge Cases

- If the subquery returns **zero rows**, `x > ALL (...)` is always **TRUE** — vacuously true, since there's no row that fails to satisfy the condition ("greater than every one of zero rows" is trivially satisfied). This is the mirror opposite of `> ANY`'s behavior on an empty set (always FALSE) — an easy point to mix up.
- `<> ALL` is equivalent to `NOT IN`, and inherits the exact same NULL danger discussed in 17.6 — a NULL in the subquery can make the whole thing UNKNOWN.

### Key Takeaways / Q&A

**Q: Is `salary > ALL (subquery)` a strict or permissive condition?**
A: Strict — it must beat every row, i.e., the maximum.

**Q: What does `> ALL` reduce to?**
A: `> MAX(subquery)`.

**Q: What happens when the ALL subquery is empty?**
A: The condition becomes vacuously TRUE — the opposite of ANY's FALSE-on-empty behavior.

**Q: Someone says "ANY means it just has to match anything, so it should be the stricter one." Correct this.**
A: Backwards — ANY is the weak/permissive one (beats the minimum); ALL is the strict one (beats the maximum).
$dbu51851$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51852$dbms_sql_tutorial_seed$dbu51852$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51853$dbms_sql_tutorial_seed$dbu51853$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51854$dbms-sql-tutorial$dbu51854$),
     t as (select id from public.learning_topics where source_kind = $dbu51855$dbms_sql_tutorial$dbu51855$ and source_ref = $dbu51856$chapter-17-subqueries/all$dbu51856$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51857$pt-dbms-sql-17-all$dbu51857$, $dbu51858$ALL - Quick Test$dbu51858$, 'aptitude', 8, 8,
  $dbu51859$8 questions on ALL.$dbu51859$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51860$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51860$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51861$tq-dbms-sql-17-all-1$dbu51861$, $dbu51862$pt-dbms-sql-17-all$dbu51862$,
   $dbu51863$`salary > ALL (subquery)` means salary is greater than:$dbu51863$,
   $dbu51864$["At least one row (the minimum) \u2014 this is ANY's meaning", "Every row (the maximum)", "The average", "Exactly the first row returned"]$dbu51864$::jsonb,
   1, $dbu51865$ALL demands beating the strongest value in the set, i.e., the maximum.$dbu51865$, 1, 0),
  ($dbu51866$tq-dbms-sql-17-all-2$dbu51866$, $dbu51867$pt-dbms-sql-17-all$dbu51867$,
   $dbu51868$Using Marketing salaries {70000, 62000}, what is `salary > ALL (SELECT salary FROM employees WHERE department='Marketing')` equivalent to?$dbu51868$,
   $dbu51869$["salary > 62000", "salary > 70000", "salary > 66000", "salary >= 62000"]$dbu51869$::jsonb,
   1, $dbu51870$ALL compares against the maximum of the subquery's results, which is 70000.$dbu51870$, 1, 1),
  ($dbu51871$tq-dbms-sql-17-all-3$dbu51871$, $dbu51872$pt-dbms-sql-17-all$dbu51872$,
   $dbu51873$If a subquery used with `> ALL` returns ZERO rows, the condition is:$dbu51873$,
   $dbu51874$["Always FALSE", "Always TRUE (vacuously)", "NULL/UNKNOWN", "A runtime error"]$dbu51874$::jsonb,
   1, $dbu51875$With no rows to fail against, "greater than every one of them" is trivially, vacuously true.$dbu51875$, 1, 2),
  ($dbu51876$tq-dbms-sql-17-all-4$dbu51876$, $dbu51877$pt-dbms-sql-17-all$dbu51877$,
   $dbu51878$Using the sample data, which employees satisfy `salary > ALL (SELECT salary FROM employees WHERE department = 'Marketing')`?$dbu51878$,
   $dbu51879$["All 8 employees", "Alice, Eve, Bob", "Only Alice", "Grace, Heidi"]$dbu51879$::jsonb,
   1, $dbu51880$These three employees all earn more than 70000, the maximum Marketing salary.$dbu51880$, 1, 3),
  ($dbu51881$tq-dbms-sql-17-all-5$dbu51881$, $dbu51882$pt-dbms-sql-17-all$dbu51882$,
   $dbu51883$`x <> ALL (subquery)` is equivalent to:$dbu51883$,
   $dbu51884$["x IN (subquery)", "x NOT IN (subquery)", "EXISTS (subquery)", "x = ANY (subquery)"]$dbu51884$::jsonb,
   1, $dbu51885$Being not-equal to every returned row is exactly the meaning of NOT IN.$dbu51885$, 1, 4),
  ($dbu51886$tq-dbms-sql-17-all-6$dbu51886$, $dbu51887$pt-dbms-sql-17-all$dbu51887$,
   $dbu51888$Which correctly distinguishes ANY from ALL?$dbu51888$,
   $dbu51889$["ANY requires beating every row (max); ALL requires beating at least one (min)", "ANY requires beating at least one row (min); ALL requires beating every row (max)", "They behave identically on non-empty subqueries", "ALL cannot be used with numeric columns"]$dbu51889$::jsonb,
   1, $dbu51890$ANY is the permissive operator (beats the minimum); ALL is the strict operator (beats the maximum).$dbu51890$, 1, 5),
  ($dbu51891$tq-dbms-sql-17-all-7$dbu51891$, $dbu51892$pt-dbms-sql-17-all$dbu51892$,
   $dbu51893$A colleague mixes up ANY and ALL in `salary > ANY(...)` vs `salary > ALL(...)` over the same subquery. What's the practical consequence?$dbu51893$,
   $dbu51894$["No difference, both return identical rows always", "The result set size can differ significantly since one compares to MIN and the other to MAX", "One of them is always a syntax error", "ALL always returns more rows than ANY"]$dbu51894$::jsonb,
   1, $dbu51895$Since ANY and ALL compare against opposite ends of the value range, swapping them can drastically change the result.$dbu51895$, 1, 6),
  ($dbu51896$tq-dbms-sql-17-all-8$dbu51896$, $dbu51897$pt-dbms-sql-17-all$dbu51897$,
   $dbu51898$On an empty subquery, how do `> ANY` and `> ALL` differ?$dbu51898$,
   $dbu51899$["Both are always TRUE", "Both are always FALSE", "`> ANY` is FALSE, `> ALL` is TRUE (vacuously)", "`> ANY` is TRUE, `> ALL` is FALSE"]$dbu51899$::jsonb,
   2, $dbu51900$ANY needs at least one row to beat (impossible when empty, so FALSE); ALL is vacuously satisfied when there's nothing to fail against.$dbu51900$, 1, 7)
on conflict (id) do nothing;

-- 17.9 Subquery in SELECT
with g as (select id from public.learning_grids where lower(slug) = $dbu51901$dbms-sql-tutorial$dbu51901$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51902$chapter-17-subqueries$dbu51902$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51903$Subquery in SELECT$dbu51903$, $dbu51904$subquery-in-select$dbu51904$, '', 9, 'published', true, true, $dbu51905$dbms_sql_tutorial$dbu51905$, $dbu51906$chapter-17-subqueries/subquery-in-select$dbu51906$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51907$dbms_sql_tutorial$dbu51907$ and source_ref = $dbu51908$chapter-17-subqueries/subquery-in-select$dbu51908$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51909$Subquery in SELECT$dbu51909$, $dbu51910$### The Pattern: a Computed Column

Placing a scalar subquery (17.1) directly in the SELECT list turns it into a computed, per-row column. Unlike an uncorrelated scalar subquery (same value repeated for every row), a **correlated** scalar subquery in SELECT can compute something genuinely different for each outer row — that's the more interesting and more common real-world use.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### Example: Department Headcount Per Employee

```sql
SELECT e.name, e.department, e.salary,
       (SELECT COUNT(*) FROM employees e2 WHERE e2.department = e.department) AS dept_headcount
FROM employees e;
```

Result:

| name | department | salary | dept_headcount |
|------|------------|--------|-----------------|
| Alice | Engineering | 95000 | 3 |
| Bob | Engineering | 72000 | 3 |
| Carol | Engineering | 68000 | 3 |
| Dave | Sales | 60000 | 3 |
| Eve | Sales | 88000 | 3 |
| Frank | Sales | 55000 | 3 |
| Grace | Marketing | 70000 | 2 |
| Heidi | Marketing | 62000 | 2 |

Note the inner table is aliased `e2` specifically so it doesn't collide with the outer alias `e` — the correlation `e2.department = e.department` needs both names distinguishable.

### Why This Executes Once Per Outer Row

Because the inner `COUNT(*)` depends on `e.department`, which changes for every outer row, the engine conceptually re-evaluates the subquery for each of the 8 rows returned. This is the SELECT-list version of the same "once per outer row" cost model discussed for correlated WHERE subqueries in 17.4 — and it's a real performance consideration: if `employees` had 5 million rows instead of 8, this naive per-row `COUNT(*)` could mean 5 million small aggregate scans unless the optimizer rewrites it (e.g., into a window function or a pre-aggregated join).

### A Better Alternative for Large Tables

The same headcount result can be produced without any correlated subquery, using a window function:

```sql
SELECT name, department, salary,
       COUNT(*) OVER (PARTITION BY department) AS dept_headcount
FROM employees;
```

This is typically far more efficient at scale because the engine computes all the per-partition counts in a single pass, rather than one subquery execution per row.

### Edge Cases

- A SELECT-list subquery **must** be scalar (17.1) — one row, one column — or it's a runtime error the moment more than one row comes back for some outer row.
- If the correlated condition matches zero rows for a given outer row, the subquery returns NULL for that row specifically — it doesn't kill the whole query.
- Multiple subqueries can appear in the same SELECT list, each independently correlated or not.

### Key Takeaways / Q&A

**Q: Must a subquery in SELECT be scalar?**
A: Yes — always one row, one column, per outer row it's evaluated against.

**Q: Is a SELECT-list subquery always correlated?**
A: No — it can be uncorrelated (17.1's company-average example) or correlated (this topic's headcount example); only the correlated form varies per row.

**Q: What's the main performance risk?**
A: On large tables, a correlated scalar subquery in SELECT can mean the inner query effectively runs once per output row — window functions or a pre-aggregated JOIN are usually faster alternatives.
$dbu51910$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51911$dbms_sql_tutorial_seed$dbu51911$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51912$dbms_sql_tutorial_seed$dbu51912$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51913$dbms-sql-tutorial$dbu51913$),
     t as (select id from public.learning_topics where source_kind = $dbu51914$dbms_sql_tutorial$dbu51914$ and source_ref = $dbu51915$chapter-17-subqueries/subquery-in-select$dbu51915$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51916$pt-dbms-sql-17-subquery-in-select$dbu51916$, $dbu51917$Subquery in SELECT - Quick Test$dbu51917$, 'aptitude', 8, 8,
  $dbu51918$8 questions on Subquery in SELECT.$dbu51918$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51919$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51919$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51920$tq-dbms-sql-17-subquery-in-select-1$dbu51920$, $dbu51921$pt-dbms-sql-17-subquery-in-select$dbu51921$,
   $dbu51922$A subquery placed in the SELECT list must be:$dbu51922$,
   $dbu51923$["Multi-row", "Scalar (one row, one column)", "Always uncorrelated", "Always an aggregate with GROUP BY"]$dbu51923$::jsonb,
   1, $dbu51924$SELECT-list subqueries fill in a single computed value per outer row, so they must be scalar.$dbu51924$, 1, 0),
  ($dbu51925$tq-dbms-sql-17-subquery-in-select-2$dbu51925$, $dbu51926$pt-dbms-sql-17-subquery-in-select$dbu51926$,
   $dbu51927$In the headcount example, why is the inner table aliased `e2` instead of reusing `e`?$dbu51927$,
   $dbu51928$["SQL requires all subqueries to use the alias e2", "To distinguish it from the outer alias `e` so the correlation `e2.department = e.department` isn't ambiguous", "`e2` executes faster than `e`", "It's purely cosmetic and has no effect on correctness"]$dbu51928$::jsonb,
   1, $dbu51929$Without distinct aliases, the correlated reference to the outer row's department would be ambiguous.$dbu51929$, 1, 1),
  ($dbu51930$tq-dbms-sql-17-subquery-in-select-3$dbu51930$, $dbu51931$pt-dbms-sql-17-subquery-in-select$dbu51931$,
   $dbu51932$Using the sample data, what dept_headcount value is shown for Grace and Heidi (Marketing)?$dbu51932$,
   $dbu51933$["3", "2", "8", "1"]$dbu51933$::jsonb,
   1, $dbu51934$Marketing has exactly two employees: Grace and Heidi.$dbu51934$, 1, 2),
  ($dbu51935$tq-dbms-sql-17-subquery-in-select-4$dbu51935$, $dbu51936$pt-dbms-sql-17-subquery-in-select$dbu51936$,
   $dbu51937$Why can a correlated scalar subquery in SELECT be a performance concern on large tables?$dbu51937$,
   $dbu51938$["It can't use indexes ever", "It conceptually runs once per outer row, scaling with table size", "SELECT subqueries are always disallowed in production", "It always returns NULL on large tables"]$dbu51938$::jsonb,
   1, $dbu51939$Naive execution re-runs the inner aggregate once per output row, which scales poorly as the table grows.$dbu51939$, 1, 3),
  ($dbu51940$tq-dbms-sql-17-subquery-in-select-5$dbu51940$, $dbu51941$pt-dbms-sql-17-subquery-in-select$dbu51941$,
   $dbu51942$What is a commonly recommended alternative to a correlated per-row COUNT(*) subquery in SELECT, for better performance?$dbu51942$,
   $dbu51943$["A window function like COUNT(*) OVER (PARTITION BY ...)", "Removing the SELECT list entirely", "Using ANY instead", "Wrapping it in NOT EXISTS"]$dbu51943$::jsonb,
   0, $dbu51944$A window function computes all per-partition counts in a single pass instead of once per row.$dbu51944$, 1, 4),
  ($dbu51945$tq-dbms-sql-17-subquery-in-select-6$dbu51945$, $dbu51946$pt-dbms-sql-17-subquery-in-select$dbu51946$,
   $dbu51947$What happens if a SELECT-list subquery returns more than one row for some outer row?$dbu51947$,
   $dbu51948$["It silently picks the first row", "A runtime error", "It returns NULL", "It returns a comma-separated list"]$dbu51948$::jsonb,
   1, $dbu51949$Just like any scalar subquery, exceeding one row triggers a runtime error.$dbu51949$, 1, 5),
  ($dbu51950$tq-dbms-sql-17-subquery-in-select-7$dbu51950$, $dbu51951$pt-dbms-sql-17-subquery-in-select$dbu51951$,
   $dbu51952$Can multiple independent subqueries appear in the same SELECT list?$dbu51952$,
   $dbu51953$["No, only one per query", "Yes, each can be independently correlated or uncorrelated", "Only if they're identical", "Only in the WHERE clause, not SELECT"]$dbu51953$::jsonb,
   1, $dbu51954$SQL allows any number of scalar subqueries as separate computed columns.$dbu51954$, 1, 6),
  ($dbu51955$tq-dbms-sql-17-subquery-in-select-8$dbu51955$, $dbu51956$pt-dbms-sql-17-subquery-in-select$dbu51956$,
   $dbu51957$If a correlated SELECT subquery finds zero matching rows for one particular outer row, what happens to that row's result?$dbu51957$,
   $dbu51958$["The whole query fails", "That row's computed column is NULL, other rows are unaffected", "That entire row is dropped from the output", "It defaults to 0 always"]$dbu51958$::jsonb,
   1, $dbu51959$A zero-row scalar subquery result is NULL for that specific row, not a query-wide failure.$dbu51959$, 1, 7)
on conflict (id) do nothing;

-- 17.10 Subquery in FROM
with g as (select id from public.learning_grids where lower(slug) = $dbu51960$dbms-sql-tutorial$dbu51960$),
     s as (select id from public.learning_sections where lower(slug) = $dbu51961$chapter-17-subqueries$dbu51961$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu51962$Subquery in FROM$dbu51962$, $dbu51963$subquery-in-from$dbu51963$, '', 10, 'published', true, true, $dbu51964$dbms_sql_tutorial$dbu51964$, $dbu51965$chapter-17-subqueries/subquery-in-from$dbu51965$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu51966$dbms_sql_tutorial$dbu51966$ and source_ref = $dbu51967$chapter-17-subqueries/subquery-in-from$dbu51967$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu51968$Subquery in FROM$dbu51968$, $dbu51969$### The Pattern: a Derived Table

A subquery placed in the FROM clause acts as a temporary, on-the-fly table — often called a **derived table**. The outer query can select from it, join it, filter it, exactly like any real table. The one non-negotiable rule: a derived table **must be given an alias** — most SQL engines will reject an un-aliased subquery in FROM with a syntax error, since every reference to a table needs a name to hang column references off (this is the same aliasing/renaming necessity introduced back in Chapter 7).

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### Example

```sql
SELECT dept_totals.department, dept_totals.total
FROM (
  SELECT department, SUM(salary) AS total
  FROM employees
  GROUP BY department
) AS dept_totals
WHERE dept_totals.total > 100000;
```

The inner query first computes:

| department | total |
|------------|-------|
| Engineering | 235000 |
| Sales | 203000 |
| Marketing | 132000 |

All three totals exceed 100000, so the outer filter passes all of them through unchanged here — every department qualifies.

### Making the Filter Actually Exclude Something

Raise the bar to see the filtering do real work:

```sql
SELECT dept_totals.department, dept_totals.total
FROM (
  SELECT department, SUM(salary) AS total
  FROM employees
  GROUP BY department
) AS dept_totals
WHERE dept_totals.total > 150000;
```

Now only Engineering (235000) and Sales (203000) pass; Marketing (132000) is filtered out.

### Why the Alias Is Mandatory

Without `AS dept_totals`, the outer query has no name to prefix `department` and `total` with, and most engines simply refuse to parse the statement (`ERROR: subquery in FROM must have an alias`). This mirrors why Chapter 7 insists on aliasing joined/renamed columns and tables — SQL's binding rules need every row source to have an addressable name, whether it's a real table or a derived one.

### Why Use a Derived Table At All?

- It lets you apply a `WHERE` filter to an *aggregated* result (`HAVING` does this too, but a derived table is more flexible for multi-step logic, chained aggregates, or reusing the same aggregate in multiple places).
- It can be joined to other real tables: `... FROM (subquery) AS dept_totals JOIN departments d ON d.name = dept_totals.department`.
- It makes complex queries readable by breaking them into named, self-contained steps — similar in spirit to a CTE (`WITH ... AS (...)`), which many modern engines treat almost interchangeably with a FROM-subquery.

### Edge Cases

- Column names inside the derived table must be unambiguous — an unaliased expression like `SUM(salary)` needs an alias (`AS total`) so the outer query has something to refer to.
- A derived table is (usually) materialized fresh each time the outer query runs — it is not a stored object; nothing persists after the query finishes.
- Nesting derived tables (a subquery in FROM whose own FROM contains another subquery) is legal but can quickly hurt readability — a CTE is often clearer for 2+ levels.

### Key Takeaways / Q&A

**Q: What is the one mandatory rule for a FROM-clause subquery?**
A: It must be aliased — an un-aliased derived table is a syntax error in most engines.

**Q: How does this relate to Chapter 7's aliasing rules?**
A: Same underlying reason — SQL needs a name for every row source so columns can be unambiguously addressed; Chapter 7 covered this for renamed columns/joined tables, and a derived table is just another row source needing that name.

**Q: Is a derived table the same as a CTE?**
A: Similar in purpose (both create a named, temporary result set), different syntax (`FROM (subquery) AS alias` vs `WITH alias AS (subquery)`); many engines optimize them similarly today.
$dbu51969$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu51970$dbms_sql_tutorial_seed$dbu51970$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu51971$dbms_sql_tutorial_seed$dbu51971$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu51972$dbms-sql-tutorial$dbu51972$),
     t as (select id from public.learning_topics where source_kind = $dbu51973$dbms_sql_tutorial$dbu51973$ and source_ref = $dbu51974$chapter-17-subqueries/subquery-in-from$dbu51974$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu51975$pt-dbms-sql-17-subquery-in-from$dbu51975$, $dbu51976$Subquery in FROM - Quick Test$dbu51976$, 'aptitude', 8, 8,
  $dbu51977$8 questions on Subquery in FROM.$dbu51977$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu51978$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu51978$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu51979$tq-dbms-sql-17-subquery-in-from-1$dbu51979$, $dbu51980$pt-dbms-sql-17-subquery-in-from$dbu51980$,
   $dbu51981$A subquery in the FROM clause is commonly called a:$dbu51981$,
   $dbu51982$["Correlated subquery", "Derived table", "Scalar subquery", "Window function"]$dbu51982$::jsonb,
   1, $dbu51983$A subquery used as a row source in FROM is called a derived table.$dbu51983$, 1, 0),
  ($dbu51984$tq-dbms-sql-17-subquery-in-from-2$dbu51984$, $dbu51985$pt-dbms-sql-17-subquery-in-from$dbu51985$,
   $dbu51986$What is mandatory for a subquery used in FROM?$dbu51986$,
   $dbu51987$["It must use GROUP BY", "It must be aliased", "It must be correlated", "It must return exactly one row"]$dbu51987$::jsonb,
   1, $dbu51988$Every derived table needs an alias so the outer query can address its columns.$dbu51988$, 1, 1),
  ($dbu51989$tq-dbms-sql-17-subquery-in-from-3$dbu51989$, $dbu51990$pt-dbms-sql-17-subquery-in-from$dbu51990$,
   $dbu51991$What error typically occurs if you omit the alias on a FROM-clause subquery?$dbu51991$,
   $dbu51992$["No error, it works fine", "A syntax error like \"subquery in FROM must have an alias\"", "A runtime \"too many rows\" error", "It silently returns zero rows"]$dbu51992$::jsonb,
   1, $dbu51993$Most engines require an alias on a derived table and will refuse to parse the query without one.$dbu51993$, 1, 2),
  ($dbu51994$tq-dbms-sql-17-subquery-in-from-4$dbu51994$, $dbu51995$pt-dbms-sql-17-subquery-in-from$dbu51995$,
   $dbu51996$Using department totals Engineering=235000, Sales=203000, Marketing=132000, how many departments pass `WHERE dept_totals.total > 150000`?$dbu51996$,
   $dbu51997$["3", "2", "1", "0"]$dbu51997$::jsonb,
   1, $dbu51998$Only Engineering and Sales exceed 150000; Marketing's 132000 does not.$dbu51998$, 1, 3),
  ($dbu51999$tq-dbms-sql-17-subquery-in-from-5$dbu51999$, $dbu52000$pt-dbms-sql-17-subquery-in-from$dbu52000$,
   $dbu52001$Why does the aliasing requirement for derived tables mirror the aliasing rules from Chapter 7?$dbu52001$,
   $dbu52002$["It doesn't relate at all", "SQL needs an addressable name for every row source, whether a real or derived table, to resolve column references unambiguously", "Aliases are only cosmetic in both cases", "Chapter 7's aliasing only applies to columns, never tables"]$dbu52002$::jsonb,
   1, $dbu52003$Both cases stem from the same underlying binding rule: every row source needs a name.$dbu52003$, 1, 4),
  ($dbu52004$tq-dbms-sql-17-subquery-in-from-6$dbu52004$, $dbu52005$pt-dbms-sql-17-subquery-in-from$dbu52005$,
   $dbu52006$A derived table can be:$dbu52006$,
   $dbu52007$["Only selected from, never joined", "Joined to real tables just like any other table", "Only used with SELECT *", "Only used once per database"]$dbu52007$::jsonb,
   1, $dbu52008$Derived tables behave like ordinary tables for join purposes.$dbu52008$, 1, 5),
  ($dbu52009$tq-dbms-sql-17-subquery-in-from-7$dbu52009$, $dbu52010$pt-dbms-sql-17-subquery-in-from$dbu52010$,
   $dbu52011$What SQL feature is most similar in purpose to a FROM-clause subquery?$dbu52011$,
   $dbu52012$["A trigger", "A common table expression (CTE / WITH clause)", "An index", "A stored procedure"]$dbu52012$::jsonb,
   1, $dbu52013$CTEs and derived tables both create named, temporary result sets for a query.$dbu52013$, 1, 6),
  ($dbu52014$tq-dbms-sql-17-subquery-in-from-8$dbu52014$, $dbu52015$pt-dbms-sql-17-subquery-in-from$dbu52015$,
   $dbu52016$Which of these correctly describes materialization of a derived table?$dbu52016$,
   $dbu52017$["It's permanently stored as a new table", "It's typically computed fresh each time the outer query runs; nothing persists afterward", "It replaces the original table permanently", "It requires a separate CREATE TABLE statement"]$dbu52017$::jsonb,
   1, $dbu52018$A derived table is a temporary result computed during query execution, not a stored object.$dbu52018$, 1, 7)
on conflict (id) do nothing;

-- 17.11 Subquery in WHERE
with g as (select id from public.learning_grids where lower(slug) = $dbu52019$dbms-sql-tutorial$dbu52019$),
     s as (select id from public.learning_sections where lower(slug) = $dbu52020$chapter-17-subqueries$dbu52020$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu52021$Subquery in WHERE$dbu52021$, $dbu52022$subquery-in-where$dbu52022$, '', 11, 'published', true, true, $dbu52023$dbms_sql_tutorial$dbu52023$, $dbu52024$chapter-17-subqueries/subquery-in-where$dbu52024$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu52025$dbms_sql_tutorial$dbu52025$ and source_ref = $dbu52026$chapter-17-subqueries/subquery-in-where$dbu52026$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu52027$Subquery in WHERE$dbu52027$, $dbu52028$### Tying the Chapter Together

Every WHERE-clause pattern seen so far in this chapter — single-row comparisons (17.2), multi-row `IN` (17.3), correlated comparisons (17.4), `EXISTS`/`NOT EXISTS` (17.5/17.6), and `ANY`/`ALL` (17.7/17.8) — is really one big family: **a subquery used inside a WHERE clause to filter outer rows**. This topic is the "umbrella" view of that family, plus a composite example showing them working together.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### The Filtering Toolkit, All in One Place

| Goal | Pattern |
|---|---|
| Compare against a single guaranteed value | `col = (SELECT ... )` — 17.2 |
| Compare against a set of values | `col IN (SELECT ... )` — 17.3 |
| Compare per-outer-row against a related aggregate | `col > (SELECT AVG(...) WHERE dep = e.dep)` — 17.4 |
| Test "does a related row exist" | `EXISTS (SELECT 1 WHERE ...)` — 17.5 |
| Test "does NO related row exist" | `NOT EXISTS (SELECT 1 WHERE ...)` — 17.6 |
| Beat at least one row in a set | `col > ANY (SELECT ...)` — 17.7 |
| Beat every row in a set | `col > ALL (SELECT ...)` — 17.8 |

### A Composite Example

Find employees who work in a department whose total budget is at least 200000, AND who earn more than that department's average salary:

```sql
SELECT name, department, salary
FROM employees e
WHERE department IN (SELECT name FROM departments WHERE budget >= 200000)
  AND salary > (SELECT AVG(salary) FROM employees WHERE department = e.department);
```

Departments with budget >= 200000: Engineering (300000), Sales (200000). Within those, above their own department average: Alice (Engineering, 95000 > 78333.33) and Eve (Sales, 88000 > 67666.67).

Result: Alice, Eve.

This single query stacks an uncorrelated multi-row `IN` subquery with a correlated single-row comparison subquery — both living in the same WHERE clause, combined with `AND`.

### Choosing the Right Operator Is the Real Skill

The syntax of "put a subquery in WHERE" is trivial; the actual skill covered across 17.2–17.8 is picking the *right comparison operator* for the subquery's guaranteed row-count and the question being asked:
- Guaranteed one row? Plain `=`/`>`/`<` is fine, but never assume — verify it's truly unique.
- Could be many rows, and you want "any match"? `IN` or `EXISTS`.
- Could be many rows, and you want "beats the weakest" or "beats the strongest"? `ANY` / `ALL`.
- Care only about presence, not values, possibly with NULL risk? `EXISTS` / `NOT EXISTS`.

### Edge Cases

- Multiple WHERE-clause subqueries can be combined with `AND`/`OR`, each independently correlated or not, as shown above.
- A WHERE-clause subquery can itself contain a nested subquery (in its own WHERE or FROM), to any depth the engine supports — readability suffers fast beyond 2–3 levels.
- Precedence matters: parenthesize combinations of subqueries and `AND`/`OR`/`NOT` carefully, exactly as with any other boolean expression.

### Key Takeaways / Q&A

**Q: Are IN, ANY, ALL, EXISTS, and plain comparison operators competitors, or a toolkit?**
A: A toolkit — each is right for a different guarantee about the subquery's row count and a different question being asked.

**Q: Can you mix multiple different subquery styles in one WHERE clause?**
A: Yes, freely, combined with AND/OR, as the composite example shows.

**Q: What's the single biggest mistake in this whole family?**
A: Using a plain comparison operator (`=`, `>`) against a subquery that isn't actually guaranteed to return one row — fine until the data changes and it suddenly throws a runtime error (17.2).
$dbu52028$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu52029$dbms_sql_tutorial_seed$dbu52029$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu52030$dbms_sql_tutorial_seed$dbu52030$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu52031$dbms-sql-tutorial$dbu52031$),
     t as (select id from public.learning_topics where source_kind = $dbu52032$dbms_sql_tutorial$dbu52032$ and source_ref = $dbu52033$chapter-17-subqueries/subquery-in-where$dbu52033$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu52034$pt-dbms-sql-17-subquery-in-where$dbu52034$, $dbu52035$Subquery in WHERE - Quick Test$dbu52035$, 'aptitude', 8, 8,
  $dbu52036$8 questions on Subquery in WHERE.$dbu52036$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu52037$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu52037$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu52038$tq-dbms-sql-17-subquery-in-where-1$dbu52038$, $dbu52039$pt-dbms-sql-17-subquery-in-where$dbu52039$,
   $dbu52040$What do IN, EXISTS, ANY, ALL, and plain `=` have in common in this chapter?$dbu52040$,
   $dbu52041$["They are all identical", "They are all ways of using a subquery to filter rows in a WHERE clause", "They can only be used in SELECT", "None of them can be correlated"]$dbu52041$::jsonb,
   1, $dbu52042$All of them are operators for combining a subquery's result with a WHERE-clause filter.$dbu52042$, 1, 0),
  ($dbu52043$tq-dbms-sql-17-subquery-in-where-2$dbu52043$, $dbu52044$pt-dbms-sql-17-subquery-in-where$dbu52044$,
   $dbu52045$In the composite example, which two conditions are combined with AND?$dbu52045$,
   $dbu52046$["Two EXISTS clauses", "An IN subquery (department budget) and a correlated comparison subquery (above department average)", "Two ALL subqueries", "A JOIN and a GROUP BY"]$dbu52046$::jsonb,
   1, $dbu52047$The example combines a multi-row IN filter with a correlated per-row average comparison.$dbu52047$, 1, 1),
  ($dbu52048$tq-dbms-sql-17-subquery-in-where-3$dbu52048$, $dbu52049$pt-dbms-sql-17-subquery-in-where$dbu52049$,
   $dbu52050$Which operator is safest when you only care whether a related row exists, ignoring its values, with possible NULLs involved?$dbu52050$,
   $dbu52051$["IN", "=", "EXISTS / NOT EXISTS", "ALL"]$dbu52051$::jsonb,
   2, $dbu52052$EXISTS/NOT EXISTS are immune to the NULL pitfalls that affect IN/NOT IN.$dbu52052$, 1, 2),
  ($dbu52053$tq-dbms-sql-17-subquery-in-where-4$dbu52053$, $dbu52054$pt-dbms-sql-17-subquery-in-where$dbu52054$,
   $dbu52055$Using the sample data and a budget threshold of >= 200000 (Engineering 300000, Sales 200000), which employees satisfy the composite example's full condition (department qualifies AND salary above own department average)?$dbu52055$,
   $dbu52056$["All employees in Engineering and Sales", "Alice and Eve only", "Alice, Bob, Dave, Eve, Frank", "Only Grace"]$dbu52056$::jsonb,
   1, $dbu52057$Only Alice and Eve individually beat their own department's average within the qualifying departments.$dbu52057$, 1, 3),
  ($dbu52058$tq-dbms-sql-17-subquery-in-where-5$dbu52058$, $dbu52059$pt-dbms-sql-17-subquery-in-where$dbu52059$,
   $dbu52060$What is the single biggest practical mistake described across the WHERE-subquery family?$dbu52060$,
   $dbu52061$["Using EXISTS too often", "Using a plain comparison operator against a subquery that isn't actually guaranteed to return exactly one row", "Using too many JOINs", "Forgetting to use GROUP BY"]$dbu52061$::jsonb,
   1, $dbu52062$This is the exact runtime-error gotcha detailed in 17.2 — data can change and break an assumption of uniqueness.$dbu52062$, 1, 4),
  ($dbu52063$tq-dbms-sql-17-subquery-in-where-6$dbu52063$, $dbu52064$pt-dbms-sql-17-subquery-in-where$dbu52064$,
   $dbu52065$Can multiple different subquery-based conditions be combined in one WHERE clause?$dbu52065$,
   $dbu52066$["No, only one subquery per WHERE clause is allowed", "Yes, using AND/OR like any boolean expressions", "Only if they use the same operator", "Only EXISTS can be combined with others"]$dbu52066$::jsonb,
   1, $dbu52067$WHERE-clause subqueries are ordinary boolean expressions and can be freely combined.$dbu52067$, 1, 5),
  ($dbu52068$tq-dbms-sql-17-subquery-in-where-7$dbu52068$, $dbu52069$pt-dbms-sql-17-subquery-in-where$dbu52069$,
   $dbu52070$Which choice correctly matches "compare per-row against a related aggregate" to its pattern?$dbu52070$,
   $dbu52071$["`col IN (SELECT ...)`", "A correlated subquery like `col > (SELECT AVG(...) WHERE dep = e.dep)`", "`EXISTS (SELECT 1 ...)`", "A derived table in FROM"]$dbu52071$::jsonb,
   1, $dbu52072$This is the correlated comparison pattern from 17.4, reused here as part of the toolkit.$dbu52072$, 1, 6),
  ($dbu52073$tq-dbms-sql-17-subquery-in-where-8$dbu52073$, $dbu52074$pt-dbms-sql-17-subquery-in-where$dbu52074$,
   $dbu52075$Why should deeply nested WHERE-clause subqueries (3+ levels) be used cautiously?$dbu52075$,
   $dbu52076$["SQL doesn't support more than 2 levels", "They are always slower than joins with no exceptions", "Readability degrades quickly, even though the engine may support arbitrary nesting", "They cannot use correlation past the first level"]$dbu52076$::jsonb,
   2, $dbu52077$Nesting is technically allowed to any depth an engine supports, but human readability suffers well before any technical limit.$dbu52077$, 1, 7)
on conflict (id) do nothing;

-- 17.12 Subquery vs Join
with g as (select id from public.learning_grids where lower(slug) = $dbu52078$dbms-sql-tutorial$dbu52078$),
     s as (select id from public.learning_sections where lower(slug) = $dbu52079$chapter-17-subqueries$dbu52079$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbu52080$Subquery vs Join$dbu52080$, $dbu52081$subquery-vs-join$dbu52081$, '', 12, 'published', true, true, $dbu52082$dbms_sql_tutorial$dbu52082$, $dbu52083$chapter-17-subqueries/subquery-vs-join$dbu52083$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbu52084$dbms_sql_tutorial$dbu52084$ and source_ref = $dbu52085$chapter-17-subqueries/subquery-vs-join$dbu52085$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbu52086$Subquery vs Join$dbu52086$, $dbu52087$### Two Tools, Overlapping Jobs

Many questions answerable with a subquery can also be answered with a JOIN, and vice versa. Neither is universally "correct" — the right choice depends on what you're asking, how the optimizer handles it, and how readable the result is to the next person.

**Sample data used throughout this chapter:**

`employees`

| id | name  | department  | salary | manager_id |
|----|-------|-------------|--------|------------|
| 1  | Alice | Engineering | 95000  | NULL |
| 2  | Bob   | Engineering | 72000  | 1 |
| 3  | Carol | Engineering | 68000  | 1 |
| 4  | Dave  | Sales       | 60000  | 5 |
| 5  | Eve   | Sales       | 88000  | NULL |
| 6  | Frank | Sales       | 55000  | 5 |
| 7  | Grace | Marketing   | 70000  | NULL |
| 8  | Heidi | Marketing   | 62000  | 7 |

`departments`

| id | name        | budget |
|----|-------------|--------|
| 1  | Engineering | 300000 |
| 2  | Sales       | 200000 |
| 3  | Marketing   | 150000 |
| 4  | HR          | 100000 |


### Case 1: EXISTS vs JOIN + DISTINCT

"Which departments have at least one employee?"

```sql
-- EXISTS version
SELECT d.name
FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department = d.name);

-- JOIN version
SELECT DISTINCT d.name
FROM departments d
JOIN employees e ON e.department = d.name;
```

Both return the same 3 rows (Engineering, Sales, Marketing). But the JOIN version has a subtle trap: since every department here has *multiple* matching employees, the join produces one output row **per matching employee**, and `DISTINCT` has to clean up the resulting duplicates afterward. `EXISTS` never produces duplicates in the first place — it's a pure existence test, not a row-multiplying operation. For "does a match exist" questions, EXISTS is usually both clearer and avoids relying on `DISTINCT` to paper over a row explosion.

### Case 2: Correlated Subquery vs Join

"Employees earning more than their own department average" (17.4) can be rewritten as a join against a pre-aggregated derived table (17.10):

```sql
-- Correlated subquery version
SELECT name, department, salary
FROM employees e
WHERE salary > (SELECT AVG(salary) FROM employees WHERE department = e.department);

-- JOIN version
SELECT e.name, e.department, e.salary
FROM employees e
JOIN (
  SELECT department, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY department
) AS dept_avg ON dept_avg.department = e.department
WHERE e.salary > dept_avg.avg_salary;
```

Both return Alice, Eve, Grace. The join version computes each department's average **once** (one GROUP BY pass), then joins it back — generally cheaper at scale than a naive per-row re-evaluation of the correlated subquery, though a good optimizer may rewrite the subquery version into essentially the same plan anyway.

### General Guidance

- **Joins are often (not always) more efficient** for combining/filtering row sets, because modern query optimizers have decades of tuning specifically for join algorithms (hash join, merge join, nested loop) and their cost estimation.
- **EXISTS/NOT EXISTS are often clearer** than an equivalent join+DISTINCT for pure "does a match exist / does no match exist" questions — they say what you mean without needing a cleanup step.
- **Correlated scalar subqueries in SELECT (17.9) are a hidden performance trap at scale** — they look innocent (a single extra computed column) but can force a per-row re-evaluation that a window function or joined pre-aggregate would avoid.
- **Not everything converts cleanly** — some correlated logic is often *more* naturally expressed as a subquery or window function than as a join.

### Edge Cases

- A JOIN can silently change row counts (duplicating outer rows) in ways a subquery never does, since subqueries used in WHERE only filter, never multiply, the outer row set.
- `NOT EXISTS` has no clean JOIN-only equivalent without an `IS NULL` anti-join trick (`LEFT JOIN ... WHERE right.key IS NULL`), which is less obviously correct at a glance than `NOT EXISTS`.

### Key Takeaways / Q&A

**Q: Is a JOIN always faster than a subquery?**
A: Often, but not always — it depends on the optimizer, indexes, and data distribution; measure, don't assume.

**Q: When is EXISTS clearly better than JOIN+DISTINCT?**
A: When the question is really "does at least one related row exist" — EXISTS answers that directly without ever creating duplicate rows to clean up.

**Q: What's the anti-join trick for NOT EXISTS using only JOIN syntax?**
A: `LEFT JOIN ... ON ... WHERE right_table.key IS NULL` — finds left rows with no matching right row, but it's less readable than `NOT EXISTS`.
$dbu52087$, 'markdown', 0, 'published', jsonb_build_object('source', $dbu52088$dbms_sql_tutorial_seed$dbu52088$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbu52089$dbms_sql_tutorial_seed$dbu52089$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbu52090$dbms-sql-tutorial$dbu52090$),
     t as (select id from public.learning_topics where source_kind = $dbu52091$dbms_sql_tutorial$dbu52091$ and source_ref = $dbu52092$chapter-17-subqueries/subquery-vs-join$dbu52092$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbu52093$pt-dbms-sql-17-subquery-vs-join$dbu52093$, $dbu52094$Subquery vs Join - Quick Test$dbu52094$, 'aptitude', 8, 8,
  $dbu52095$8 questions on Subquery vs Join.$dbu52095$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbu52096$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbu52096$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbu52097$tq-dbms-sql-17-subquery-vs-join-1$dbu52097$, $dbu52098$pt-dbms-sql-17-subquery-vs-join$dbu52098$,
   $dbu52099$Which is generally true about joins vs subqueries?$dbu52099$,
   $dbu52100$["Joins are always faster, no exceptions", "Joins are often, but not always, more efficient thanks to mature optimizer support", "Subqueries are always faster", "They can never produce the same result"]$dbu52100$::jsonb,
   1, $dbu52101$Optimizers are heavily tuned for joins, but this is a tendency, not an absolute rule.$dbu52101$, 1, 0),
  ($dbu52102$tq-dbms-sql-17-subquery-vs-join-2$dbu52102$, $dbu52103$pt-dbms-sql-17-subquery-vs-join$dbu52103$,
   $dbu52104$Why can a JOIN+DISTINCT version of "which departments have employees" be less ideal than EXISTS?$dbu52104$,
   $dbu52105$["JOIN cannot be used with the departments/employees tables", "The join can produce one row per matching employee, requiring DISTINCT to clean up duplicates that EXISTS never creates", "EXISTS is always a syntax error", "JOIN always returns fewer rows than EXISTS"]$dbu52105$::jsonb,
   1, $dbu52106$A join multiplies rows per match, needing DISTINCT to dedupe, whereas EXISTS is a pure yes/no test.$dbu52106$, 1, 1),
  ($dbu52107$tq-dbms-sql-17-subquery-vs-join-3$dbu52107$, $dbu52108$pt-dbms-sql-17-subquery-vs-join$dbu52108$,
   $dbu52109$What is the JOIN-only equivalent trick for NOT EXISTS?$dbu52109$,
   $dbu52110$["INNER JOIN with DISTINCT", "LEFT JOIN ... WHERE right_table.key IS NULL", "CROSS JOIN", "A subquery in ORDER BY"]$dbu52110$::jsonb,
   1, $dbu52111$The classic anti-join pattern finds unmatched left rows via a LEFT JOIN plus an IS NULL filter.$dbu52111$, 1, 2),
  ($dbu52112$tq-dbms-sql-17-subquery-vs-join-4$dbu52112$, $dbu52113$pt-dbms-sql-17-subquery-vs-join$dbu52113$,
   $dbu52114$What is a "hidden performance trap at scale" mentioned for subqueries in SELECT?$dbu52114$,
   $dbu52115$["They can never be indexed", "A correlated scalar subquery in SELECT can force per-row re-evaluation, unlike a window function or joined pre-aggregate", "They always return NULL", "They cannot be combined with WHERE"]$dbu52115$::jsonb,
   1, $dbu52116$This callback to 17.9 highlights the per-row cost of correlated SELECT subqueries at scale.$dbu52116$, 1, 3),
  ($dbu52117$tq-dbms-sql-17-subquery-vs-join-5$dbu52117$, $dbu52118$pt-dbms-sql-17-subquery-vs-join$dbu52118$,
   $dbu52119$In the correlated-subquery-vs-join rewrite for "above department average," what does the JOIN version compute differently?$dbu52119$,
   $dbu52120$["Nothing, it's identical execution always", "It computes each department's average once via GROUP BY, then joins it back, versus a naive per-row re-evaluation in the subquery version", "It ignores department boundaries", "It requires a scalar subquery still"]$dbu52120$::jsonb,
   1, $dbu52121$The join pre-aggregates averages once, avoiding repeated per-row computation in the naive subquery approach.$dbu52121$, 1, 4),
  ($dbu52122$tq-dbms-sql-17-subquery-vs-join-6$dbu52122$, $dbu52123$pt-dbms-sql-17-subquery-vs-join$dbu52123$,
   $dbu52124$Which subquery type is often considered clearer than an equivalent join for "does a match exist" questions?$dbu52124$,
   $dbu52125$["Scalar subquery in SELECT", "EXISTS / NOT EXISTS", "Subquery in FROM", "ALL"]$dbu52125$::jsonb,
   1, $dbu52126$EXISTS directly expresses "does a related row exist" without needing a join plus DISTINCT.$dbu52126$, 1, 5),
  ($dbu52127$tq-dbms-sql-17-subquery-vs-join-7$dbu52127$, $dbu52128$pt-dbms-sql-17-subquery-vs-join$dbu52128$,
   $dbu52129$Which statement about row counts is accurate?$dbu52129$,
   $dbu52130$["A WHERE-clause subquery can multiply outer rows just like a JOIN can", "A WHERE-clause subquery only filters the outer row set; it never multiplies rows the way a JOIN can", "JOINs never change row counts", "Subqueries and joins always produce identical row counts"]$dbu52130$::jsonb,
   1, $dbu52131$Subqueries used as WHERE filters can only include or exclude outer rows, never duplicate them.$dbu52131$, 1, 6),
  ($dbu52132$tq-dbms-sql-17-subquery-vs-join-8$dbu52132$, $dbu52133$pt-dbms-sql-17-subquery-vs-join$dbu52133$,
   $dbu52134$What is the recommended general approach when deciding between a subquery and a join?$dbu52134$,
   $dbu52135$["Always prefer subqueries for correctness", "Always prefer joins for readability", "Consider the specific question, likely optimizer behavior, and readability \u2014 measure rather than assume one is universally better", "Never use EXISTS in production"]$dbu52135$::jsonb,
   2, $dbu52136$There's no universal winner; the right choice depends on the query's intent, the optimizer, and clarity.$dbu52136$, 1, 7)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. CHAPTER TESTS — one per new chapter (3, 4, 5). Pools are LIVE joins via
--    practice_test_pool() (0091/063); no test_questions of their own.
-- ===========================================================================
with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbu52137$chapter-15-group-by-and-aggregation$dbu52137$ and lower(g.slug) = $dbu52138$dbms-sql-tutorial$dbu52138$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbu52139$pt-dbms-sql-ch15-test$dbu52139$, $dbu52140$GROUP BY and Aggregation - Chapter Test$dbu52140$, 'aptitude', sec.id, 'chapter', true, 10,
  15,
  $dbu52141$10 randomly-sampled questions drawn from every GROUP BY and Aggregation topic quiz.$dbu52141$,
  'published', true, true, true, 'Medium', 0,
  $dbu52142$This test randomly samples 10 questions from all of Chapter 15's topic quizzes. Each carries 1 mark. No negative marking. You have 15 minutes.$dbu52142$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbu52143$chapter-16-joins$dbu52143$ and lower(g.slug) = $dbu52144$dbms-sql-tutorial$dbu52144$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbu52145$pt-dbms-sql-ch16-test$dbu52145$, $dbu52146$Joins - Chapter Test$dbu52146$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dbu52147$15 randomly-sampled questions drawn from every Joins topic quiz.$dbu52147$,
  'published', true, true, true, 'Medium', 0,
  $dbu52148$This test randomly samples 15 questions from all of Chapter 16's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dbu52148$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbu52149$chapter-17-subqueries$dbu52149$ and lower(g.slug) = $dbu52150$dbms-sql-tutorial$dbu52150$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbu52151$pt-dbms-sql-ch17-test$dbu52151$, $dbu52152$Subqueries - Chapter Test$dbu52152$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dbu52153$15 randomly-sampled questions drawn from every Subqueries topic quiz.$dbu52153$,
  'published', true, true, true, 'Medium', 0,
  $dbu52154$This test randomly samples 15 questions from all of Chapter 17's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dbu52154$
from sec
on conflict (id) do nothing;

-- ===========================================================================
-- 4. SQL CODING PROBLEMS (Chapter 9 DDL-writing, Chapter 10 constraint-
--    violation-finding, Chapter 11 DML-writing — every problem verified
--    end-to-end against Paiza's live MySQL sandbox, 2026-09).
-- ===========================================================================
-- Total Revenue by Region (topic chapter-15-group-by-and-aggregation/group-by)
with t as (select id from public.learning_topics where source_kind = $dbu52158$dbms_sql_tutorial$dbu52158$ and source_ref = $dbu52159$chapter-15-group-by-and-aggregation/group-by$dbu52159$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52160$cp-dbms-sql-total-revenue-by-region$dbu52160$, null::text, $dbu52161$Total Revenue by Region$dbu52161$, $dbu52162$Easy$dbu52162$, $dbu52163$total-revenue-by-region$dbu52163$,
  $dbu52164$Write a query returning `region` and `total` (sum of `amount`) for each region, ordered by `region`.

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO orders (id, region, product, amount) VALUES
(1, 'North', 'Widget', 200),
(2, 'North', 'Gadget', 150),
(3, 'South', 'Widget', 100),
(4, 'South', 'Gadget', 50),
(5, 'North', 'Widget', 300),
(6, 'East', 'Widget', 400);
```
$dbu52164$,
  $dbu52155$[{"input": "", "output": "region\ttotal\nEast\t400\nNorth\t650\nSouth\t150"}]$dbu52155$::jsonb, $dbu52156$[{"hidden": true, "seed_sql": "INSERT INTO orders (id, region, product, amount) VALUES\n(1, 'West', 'Widget', 500),\n(2, 'West', 'Gadget', 200),\n(3, 'East', 'Widget', 100),\n(4, 'East', 'Gadget', 300);", "expected": "region\ttotal\nEast\t400\nWest\t700"}]$dbu52156$::jsonb, jsonb_build_object('sql', $dbu52157$-- Write your SELECT query here
$dbu52157$),
  $dbu52165$GROUP BY collapses rows into one per region, and SUM aggregates within each group. Reference: `SELECT region, SUM(amount) AS total FROM orders GROUP BY region ORDER BY region;`$dbu52165$, array['sql'], $dbu52166$CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);$dbu52166$, $dbu52167$INSERT INTO orders (id, region, product, amount) VALUES
(1, 'North', 'Widget', 200),
(2, 'North', 'Gadget', 150),
(3, 'South', 'Widget', 100),
(4, 'South', 'Gadget', 50),
(5, 'North', 'Widget', 300),
(6, 'East', 'Widget', 400);$dbu52167$, $dbu52168$$dbu52168$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- High-Revenue Regions Only (topic chapter-15-group-by-and-aggregation/having)
with t as (select id from public.learning_topics where source_kind = $dbu52172$dbms_sql_tutorial$dbu52172$ and source_ref = $dbu52173$chapter-15-group-by-and-aggregation/having$dbu52173$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52174$cp-dbms-sql-high-revenue-regions-only$dbu52174$, null::text, $dbu52175$High-Revenue Regions Only$dbu52175$, $dbu52176$Medium$dbu52176$, $dbu52177$high-revenue-regions-only$dbu52177$,
  $dbu52178$Write a query returning `region` and `total` (sum of `amount`) only for regions whose total revenue exceeds 500, ordered by `region`.

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO orders (id, region, product, amount) VALUES
(1, 'North', 'Widget', 200),
(2, 'North', 'Gadget', 150),
(3, 'South', 'Widget', 100),
(4, 'South', 'Gadget', 50),
(5, 'North', 'Widget', 300),
(6, 'East', 'Widget', 400);
```
$dbu52178$,
  $dbu52169$[{"input": "", "output": "region\ttotal\nNorth\t650"}]$dbu52169$::jsonb, $dbu52170$[{"hidden": true, "seed_sql": "INSERT INTO orders (id, region, product, amount) VALUES\n(1, 'West', 'Widget', 500),\n(2, 'West', 'Gadget', 200),\n(3, 'East', 'Widget', 100),\n(4, 'East', 'Gadget', 300);", "expected": "region\ttotal\nWest\t700"}]$dbu52170$::jsonb, jsonb_build_object('sql', $dbu52171$-- Write your SELECT query here
$dbu52171$),
  $dbu52179$HAVING filters groups by an aggregate condition, after GROUP BY has run. Reference: `SELECT region, SUM(amount) AS total FROM orders GROUP BY region HAVING SUM(amount) > 500 ORDER BY region;`$dbu52179$, array['sql'], $dbu52180$CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);$dbu52180$, $dbu52181$INSERT INTO orders (id, region, product, amount) VALUES
(1, 'North', 'Widget', 200),
(2, 'North', 'Gadget', 150),
(3, 'South', 'Widget', 100),
(4, 'South', 'Gadget', 50),
(5, 'North', 'Widget', 300),
(6, 'East', 'Widget', 400);$dbu52181$, $dbu52182$$dbu52182$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Revenue by Region and Product (topic chapter-15-group-by-and-aggregation/multiple-grouping-columns)
with t as (select id from public.learning_topics where source_kind = $dbu52186$dbms_sql_tutorial$dbu52186$ and source_ref = $dbu52187$chapter-15-group-by-and-aggregation/multiple-grouping-columns$dbu52187$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52188$cp-dbms-sql-revenue-by-region-and-product$dbu52188$, null::text, $dbu52189$Revenue by Region and Product$dbu52189$, $dbu52190$Medium$dbu52190$, $dbu52191$revenue-by-region-and-product$dbu52191$,
  $dbu52192$Write a query returning `region`, `product`, and `total` (sum of `amount`) for each region+product combination, ordered by `region` then `product`.

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO orders (id, region, product, amount) VALUES
(1, 'North', 'Widget', 200),
(2, 'North', 'Gadget', 150),
(3, 'South', 'Widget', 100),
(4, 'South', 'Gadget', 50),
(5, 'North', 'Widget', 300),
(6, 'East', 'Widget', 400);
```
$dbu52192$,
  $dbu52183$[{"input": "", "output": "region\tproduct\ttotal\nEast\tWidget\t400\nNorth\tGadget\t150\nNorth\tWidget\t500\nSouth\tGadget\t50\nSouth\tWidget\t100"}]$dbu52183$::jsonb, $dbu52184$[{"hidden": true, "seed_sql": "INSERT INTO orders (id, region, product, amount) VALUES\n(1, 'West', 'Widget', 500),\n(2, 'West', 'Gadget', 200),\n(3, 'East', 'Widget', 100),\n(4, 'East', 'Gadget', 300);", "expected": "region\tproduct\ttotal\nEast\tGadget\t300\nEast\tWidget\t100\nWest\tGadget\t200\nWest\tWidget\t500"}]$dbu52184$::jsonb, jsonb_build_object('sql', $dbu52185$-- Write your SELECT query here
$dbu52185$),
  $dbu52193$Grouping by two columns produces one row per unique combination. Reference: `SELECT region, product, SUM(amount) AS total FROM orders GROUP BY region, product ORDER BY region, product;`$dbu52193$, array['sql'], $dbu52194$CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);$dbu52194$, $dbu52195$INSERT INTO orders (id, region, product, amount) VALUES
(1, 'North', 'Widget', 200),
(2, 'North', 'Gadget', 150),
(3, 'South', 'Widget', 100),
(4, 'South', 'Gadget', 50),
(5, 'North', 'Widget', 300),
(6, 'East', 'Widget', 400);$dbu52195$, $dbu52196$$dbu52196$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Widget vs Gadget Revenue by Region (topic chapter-15-group-by-and-aggregation/conditional-aggregation)
with t as (select id from public.learning_topics where source_kind = $dbu52200$dbms_sql_tutorial$dbu52200$ and source_ref = $dbu52201$chapter-15-group-by-and-aggregation/conditional-aggregation$dbu52201$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52202$cp-dbms-sql-widget-vs-gadget-revenue-by-region$dbu52202$, null::text, $dbu52203$Widget vs Gadget Revenue by Region$dbu52203$, $dbu52204$Hard$dbu52204$, $dbu52205$widget-vs-gadget-revenue-by-region$dbu52205$,
  $dbu52206$Write a query returning `region`, `widget_total` (sum of amount where product is 'Widget', else 0), and `gadget_total` (sum of amount where product is 'Gadget', else 0) — one row per region, ordered by `region`.

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO orders (id, region, product, amount) VALUES
(1, 'North', 'Widget', 200),
(2, 'North', 'Gadget', 150),
(3, 'South', 'Widget', 100),
(4, 'South', 'Gadget', 50),
(5, 'North', 'Widget', 300),
(6, 'East', 'Widget', 400);
```
$dbu52206$,
  $dbu52197$[{"input": "", "output": "region\twidget_total\tgadget_total\nEast\t400\t0\nNorth\t500\t150\nSouth\t100\t50"}]$dbu52197$::jsonb, $dbu52198$[{"hidden": true, "seed_sql": "INSERT INTO orders (id, region, product, amount) VALUES\n(1, 'West', 'Widget', 500),\n(2, 'West', 'Gadget', 200),\n(3, 'East', 'Widget', 100),\n(4, 'East', 'Gadget', 300);", "expected": "region\twidget_total\tgadget_total\nEast\t100\t300\nWest\t500\t200"}]$dbu52198$::jsonb, jsonb_build_object('sql', $dbu52199$-- Write your SELECT query here
$dbu52199$),
  $dbu52207$A CASE expression inside SUM computes a conditional total without needing separate queries. Reference: `SELECT region, SUM(CASE WHEN product = 'Widget' THEN amount ELSE 0 END) AS widget_total, SUM(CASE WHEN product = 'Gadget' THEN amount ELSE 0 END) AS gadget_total FROM orders GROUP BY region ORDER BY region;`$dbu52207$, array['sql'], $dbu52208$CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  region TEXT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL
);$dbu52208$, $dbu52209$INSERT INTO orders (id, region, product, amount) VALUES
(1, 'North', 'Widget', 200),
(2, 'North', 'Gadget', 150),
(3, 'South', 'Widget', 100),
(4, 'South', 'Gadget', 50),
(5, 'North', 'Widget', 300),
(6, 'East', 'Widget', 400);$dbu52209$, $dbu52210$$dbu52210$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Employees With Real Departments (topic chapter-16-joins/inner-join)
with t as (select id from public.learning_topics where source_kind = $dbu52214$dbms_sql_tutorial$dbu52214$ and source_ref = $dbu52215$chapter-16-joins/inner-join$dbu52215$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52216$cp-dbms-sql-employees-with-real-departments$dbu52216$, null::text, $dbu52217$Employees With Real Departments$dbu52217$, $dbu52218$Easy$dbu52218$, $dbu52219$employees-with-real-departments$dbu52219$,
  $dbu52220$Write a query returning `id`, `name` (employee), and `department` (department's name) for every employee who has a real department assigned, ordered by employee `id`. Employees with no department should NOT appear.

```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);
```
$dbu52220$,
  $dbu52211$[{"input": "", "output": "id\tname\tdepartment\n1\tAsha\tEngineering\n2\tRohan\tEngineering\n3\tNeha\tSales"}]$dbu52211$::jsonb, $dbu52212$[{"hidden": true, "seed_sql": "INSERT INTO departments (id, name) VALUES (10, 'Finance'), (20, 'Legal'), (30, 'HR');\nINSERT INTO employees (id, name, department_id, manager_id, salary) VALUES\n(1, 'Zara', 10, NULL, 95000),\n(2, 'Omar', 10, 1, 60000),\n(3, 'Leo', NULL, 1, 40000);", "expected": "id\tname\tdepartment\n1\tZara\tFinance\n2\tOmar\tFinance"}]$dbu52212$::jsonb, jsonb_build_object('sql', $dbu52213$-- Write your SELECT query here
$dbu52213$),
  $dbu52221$INNER JOIN naturally excludes employees with no matching department. Reference: `SELECT e.id, e.name, d.name AS department FROM employees e INNER JOIN departments d ON e.department_id = d.id ORDER BY e.id;`$dbu52221$, array['sql'], $dbu52222$CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);$dbu52222$, $dbu52223$INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);$dbu52223$, $dbu52224$$dbu52224$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Every Employee, Department or Not (topic chapter-16-joins/left-join)
with t as (select id from public.learning_topics where source_kind = $dbu52228$dbms_sql_tutorial$dbu52228$ and source_ref = $dbu52229$chapter-16-joins/left-join$dbu52229$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52230$cp-dbms-sql-every-employee-department-or-not$dbu52230$, null::text, $dbu52231$Every Employee, Department or Not$dbu52231$, $dbu52232$Easy$dbu52232$, $dbu52233$every-employee-department-or-not$dbu52233$,
  $dbu52234$Write a query returning `id`, `name` (employee), and `department` for EVERY employee, showing `NULL` for employees with no department, ordered by employee `id`.

```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);
```
$dbu52234$,
  $dbu52225$[{"input": "", "output": "id\tname\tdepartment\n1\tAsha\tEngineering\n2\tRohan\tEngineering\n3\tNeha\tSales\n4\tVikram\tNULL"}]$dbu52225$::jsonb, $dbu52226$[{"hidden": true, "seed_sql": "INSERT INTO departments (id, name) VALUES (10, 'Finance'), (20, 'Legal'), (30, 'HR');\nINSERT INTO employees (id, name, department_id, manager_id, salary) VALUES\n(1, 'Zara', 10, NULL, 95000),\n(2, 'Omar', 10, 1, 60000),\n(3, 'Leo', NULL, 1, 40000);", "expected": "id\tname\tdepartment\n1\tZara\tFinance\n2\tOmar\tFinance\n3\tLeo\tNULL"}]$dbu52226$::jsonb, jsonb_build_object('sql', $dbu52227$-- Write your SELECT query here
$dbu52227$),
  $dbu52235$LEFT JOIN preserves every employee row regardless of match. Reference: `SELECT e.id, e.name, d.name AS department FROM employees e LEFT JOIN departments d ON e.department_id = d.id ORDER BY e.id;`$dbu52235$, array['sql'], $dbu52236$CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);$dbu52236$, $dbu52237$INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);$dbu52237$, $dbu52238$$dbu52238$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Employees and Their Managers (topic chapter-16-joins/self-join)
with t as (select id from public.learning_topics where source_kind = $dbu52242$dbms_sql_tutorial$dbu52242$ and source_ref = $dbu52243$chapter-16-joins/self-join$dbu52243$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52244$cp-dbms-sql-employees-and-their-managers$dbu52244$, null::text, $dbu52245$Employees and Their Managers$dbu52245$, $dbu52246$Medium$dbu52246$, $dbu52247$employees-and-their-managers$dbu52247$,
  $dbu52248$Write a self-join query returning `id`, `name` (employee), and `manager` (their manager's name, or NULL if they have none), ordered by employee `id`.

```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);
```
$dbu52248$,
  $dbu52239$[{"input": "", "output": "id\tname\tmanager\n1\tAsha\tNULL\n2\tRohan\tAsha\n3\tNeha\tAsha\n4\tVikram\tAsha"}]$dbu52239$::jsonb, $dbu52240$[{"hidden": true, "seed_sql": "INSERT INTO departments (id, name) VALUES (10, 'Finance'), (20, 'Legal'), (30, 'HR');\nINSERT INTO employees (id, name, department_id, manager_id, salary) VALUES\n(1, 'Zara', 10, NULL, 95000),\n(2, 'Omar', 10, 1, 60000),\n(3, 'Leo', NULL, 1, 40000);", "expected": "id\tname\tmanager\n1\tZara\tNULL\n2\tOmar\tZara\n3\tLeo\tZara"}]$dbu52240$::jsonb, jsonb_build_object('sql', $dbu52241$-- Write your SELECT query here
$dbu52241$),
  $dbu52249$Join employees to itself with two aliases, one for the employee and one for the manager. Reference: `SELECT e.id, e.name, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id ORDER BY e.id;`$dbu52249$, array['sql'], $dbu52250$CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);$dbu52250$, $dbu52251$INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);$dbu52251$, $dbu52252$$dbu52252$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Departments With No Employees (topic chapter-16-joins/anti-join)
with t as (select id from public.learning_topics where source_kind = $dbu52256$dbms_sql_tutorial$dbu52256$ and source_ref = $dbu52257$chapter-16-joins/anti-join$dbu52257$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52258$cp-dbms-sql-departments-with-no-employees$dbu52258$, null::text, $dbu52259$Departments With No Employees$dbu52259$, $dbu52260$Medium$dbu52260$, $dbu52261$departments-with-no-employees$dbu52261$,
  $dbu52262$Write an anti-join query returning `id`, `name` for every department that has NO employees, ordered by `id`.

```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);
```
$dbu52262$,
  $dbu52253$[{"input": "", "output": "id\tname\n3\tMarketing"}]$dbu52253$::jsonb, $dbu52254$[{"hidden": true, "seed_sql": "INSERT INTO departments (id, name) VALUES (10, 'Finance'), (20, 'Legal'), (30, 'HR');\nINSERT INTO employees (id, name, department_id, manager_id, salary) VALUES\n(1, 'Zara', 10, NULL, 95000),\n(2, 'Omar', 10, 1, 60000),\n(3, 'Leo', NULL, 1, 40000);", "expected": "id\tname\n20\tLegal\n30\tHR"}]$dbu52254$::jsonb, jsonb_build_object('sql', $dbu52255$-- Write your SELECT query here
$dbu52255$),
  $dbu52263$LEFT JOIN then filter to rows where the employee side is NULL. Reference: `SELECT d.id, d.name FROM departments d LEFT JOIN employees e ON e.department_id = d.id WHERE e.id IS NULL ORDER BY d.id;`$dbu52263$, array['sql'], $dbu52264$CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);$dbu52264$, $dbu52265$INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);$dbu52265$, $dbu52266$$dbu52266$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Departments With At Least One Employee (topic chapter-16-joins/semi-join)
with t as (select id from public.learning_topics where source_kind = $dbu52270$dbms_sql_tutorial$dbu52270$ and source_ref = $dbu52271$chapter-16-joins/semi-join$dbu52271$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52272$cp-dbms-sql-departments-with-at-least-one-employee$dbu52272$, null::text, $dbu52273$Departments With At Least One Employee$dbu52273$, $dbu52274$Medium$dbu52274$, $dbu52275$departments-with-at-least-one-employee$dbu52275$,
  $dbu52276$Write a semi-join query returning `id`, `name` for every department that has at least one employee — each department appearing exactly once regardless of how many employees it has. Order by `id`.

```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);
```
$dbu52276$,
  $dbu52267$[{"input": "", "output": "id\tname\n1\tEngineering\n2\tSales"}]$dbu52267$::jsonb, $dbu52268$[{"hidden": true, "seed_sql": "INSERT INTO departments (id, name) VALUES (10, 'Finance'), (20, 'Legal'), (30, 'HR');\nINSERT INTO employees (id, name, department_id, manager_id, salary) VALUES\n(1, 'Zara', 10, NULL, 95000),\n(2, 'Omar', 10, 1, 60000),\n(3, 'Leo', NULL, 1, 40000);", "expected": "id\tname\n10\tFinance"}]$dbu52268$::jsonb, jsonb_build_object('sql', $dbu52269$-- Write your SELECT query here
$dbu52269$),
  $dbu52277$EXISTS checks for a match without duplicating rows or pulling in columns from the matched table. Reference: `SELECT d.id, d.name FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id) ORDER BY d.id;`$dbu52277$, array['sql'], $dbu52278$CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  salary INTEGER NOT NULL
);$dbu52278$, $dbu52279$INSERT INTO departments (id, name) VALUES (1, 'Engineering'), (2, 'Sales'), (3, 'Marketing');
INSERT INTO employees (id, name, department_id, manager_id, salary) VALUES
(1, 'Asha', 1, NULL, 90000),
(2, 'Rohan', 1, 1, 70000),
(3, 'Neha', 2, 1, 65000),
(4, 'Vikram', NULL, 1, 50000);$dbu52279$, $dbu52280$$dbu52280$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Above Their Department's Average (topic chapter-17-subqueries/correlated-subquery)
with t as (select id from public.learning_topics where source_kind = $dbu52284$dbms_sql_tutorial$dbu52284$ and source_ref = $dbu52285$chapter-17-subqueries/correlated-subquery$dbu52285$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52286$cp-dbms-sql-above-their-departments-average$dbu52286$, null::text, $dbu52287$Above Their Department's Average$dbu52287$, $dbu52288$Medium$dbu52288$, $dbu52289$above-their-departments-average$dbu52289$,
  $dbu52290$Write a query returning `id`, `name`, `salary` for every employee whose salary is above the AVERAGE salary of their own department, ordered by `id`.

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 90000),
(2, 'Rohan', 'Engineering', 60000),
(3, 'Neha', 'Sales', 70000),
(4, 'Vikram', 'Sales', 50000),
(5, 'Priya', 'Engineering', 75000);
```
$dbu52290$,
  $dbu52281$[{"input": "", "output": "id\tname\tsalary\n1\tAsha\t90000\n3\tNeha\t70000"}]$dbu52281$::jsonb, $dbu52282$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Finance', 80000),\n(2, 'Omar', 'Finance', 40000),\n(3, 'Leo', 'Finance', 90000);", "expected": "id\tname\tsalary\n1\tZara\t80000\n3\tLeo\t90000"}]$dbu52282$::jsonb, jsonb_build_object('sql', $dbu52283$-- Write your SELECT query here
$dbu52283$),
  $dbu52291$A correlated subquery references the outer row's department, re-evaluating AVG per employee. Reference: `SELECT id, name, salary FROM employees e1 WHERE salary > (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e1.department) ORDER BY id;`$dbu52291$, array['sql'], $dbu52292$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);$dbu52292$, $dbu52293$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 90000),
(2, 'Rohan', 'Engineering', 60000),
(3, 'Neha', 'Sales', 70000),
(4, 'Vikram', 'Sales', 50000),
(5, 'Priya', 'Engineering', 75000);$dbu52293$, $dbu52294$$dbu52294$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Departments With High Total Payroll (topic chapter-17-subqueries/subquery-in-from)
with t as (select id from public.learning_topics where source_kind = $dbu52298$dbms_sql_tutorial$dbu52298$ and source_ref = $dbu52299$chapter-17-subqueries/subquery-in-from$dbu52299$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbu52300$cp-dbms-sql-departments-with-high-total-payroll$dbu52300$, null::text, $dbu52301$Departments With High Total Payroll$dbu52301$, $dbu52302$Medium$dbu52302$, $dbu52303$departments-with-high-total-payroll$dbu52303$,
  $dbu52304$Using a subquery in the FROM clause, write a query returning `department` and `total` (sum of salaries) only for departments whose total payroll exceeds 100000, ordered by `department`.

```sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);
```

**Sample data**:

```sql
INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 90000),
(2, 'Rohan', 'Engineering', 60000),
(3, 'Neha', 'Sales', 70000),
(4, 'Vikram', 'Sales', 50000),
(5, 'Priya', 'Engineering', 75000);
```
$dbu52304$,
  $dbu52295$[{"input": "", "output": "department\ttotal\nEngineering\t225000\nSales\t120000"}]$dbu52295$::jsonb, $dbu52296$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Finance', 80000),\n(2, 'Omar', 'Finance', 40000),\n(3, 'Leo', 'Finance', 90000);", "expected": "department\ttotal\nFinance\t210000"}]$dbu52296$::jsonb, jsonb_build_object('sql', $dbu52297$-- Write your SELECT query here
$dbu52297$),
  $dbu52305$A derived table (subquery in FROM) must be aliased, then queried like any other table. Reference: `SELECT department, total FROM (SELECT department, SUM(salary) AS total FROM employees GROUP BY department) AS dept_totals WHERE total > 100000 ORDER BY department;`$dbu52305$, array['sql'], $dbu52306$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);$dbu52306$, $dbu52307$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 90000),
(2, 'Rohan', 'Engineering', 60000),
(3, 'Neha', 'Sales', 70000),
(4, 'Vikram', 'Sales', 50000),
(5, 'Priya', 'Engineering', 75000);$dbu52307$, $dbu52308$$dbu52308$,
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
  select id into v_grid_id from public.learning_grids where lower(slug) = $dbu52309$dbms-sql-tutorial$dbu52309$;
  if v_grid_id is null then raise exception 'validation: dbms-sql-tutorial grid missing'; end if;

  select count(*) into v_topics from public.learning_topics where grid_id = v_grid_id and source_kind = $dbu52310$dbms_sql_tutorial$dbu52310$;
  if v_topics < 220 then raise exception 'validation: expected at least 220 dbms_sql_tutorial topics (186 from batches 1-5 + 34 from batch 6), found %', v_topics; end if;

  select count(*) into v_questions from public.test_questions tq
    join public.practice_tests pt on pt.id = tq.test_id
    where pt.learning_topic_id in (select id from public.learning_topics where grid_id = v_grid_id and source_kind = $dbu52311$dbms_sql_tutorial$dbu52311$);
  if v_questions < 1760 then raise exception 'validation: expected at least 1760 topic-quiz questions, found %', v_questions; end if;

  select count(*) into v_chtests from public.practice_tests where id in ('pt-dbms-sql-ch15-test','pt-dbms-sql-ch16-test','pt-dbms-sql-ch17-test') and scope = 'chapter';
  if v_chtests <> 3 then raise exception 'validation: expected 3 new chapter tests, found %', v_chtests; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-dbms-sql-%';
  if v_problems < 41 then raise exception 'validation: expected at least 41 SQL coding problems total, found %', v_problems; end if;

  raise notice '0097 OK: % total topics, % total topic-quiz questions, 3 new chapter tests (ch15/ch16/ch17), % total SQL coding problems.', v_topics, v_questions, v_problems;
end $$;

notify pgrst, 'reload schema';
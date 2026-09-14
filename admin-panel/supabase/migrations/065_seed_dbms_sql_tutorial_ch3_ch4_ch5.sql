-- admin-panel/supabase/migrations/065_seed_dbms_sql_tutorial_ch3_ch4_ch5.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0093_seed_dbms_sql_tutorial_ch3_ch4_ch5.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — DBMS & SQL Tutorial: Chapters 3, 4, 5 (batch 2)
-- ============================================================================
-- WHAT / WHY
--   Second content batch on top of 0091/063 (schema) + 0092/064 (batch 1:
--   chapters 1, 2, 8). Adds Chapter 3 (Data Models, 11 topics), Chapter 4
--   (Relational Model, 13 topics), Chapter 5 (Keys and Integrity, 13 topics)
--   = 37 more topics, 296 more topic-quiz MCQs, 3 more Chapter tests (one
--   per new chapter), and 3 more SQL coding problems (Chapter 5 — keys/
--   integrity map naturally onto real SELECT-based SQL problems: finding
--   duplicate/orphaned rows that violate an intended key or FK).
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
  if not exists (select 1 from public.learning_grids where lower(slug) = $dby10001$dbms-sql-tutorial$dby10001$) then
    raise exception '0093/065: dbms-sql-tutorial grid not found — apply 0092_seed_dbms_sql_tutorial_ch1_ch2_ch8.sql (admin 064) first.';
  end if;
  if to_regprocedure('public.practice_test_pool(text)') is null then
    raise exception '0093/065: DBMS-practice RPCs not found — apply 0091_dbms_sql_practice.sql (admin 063) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 1. SECTIONS — re-affirm all 43 (idempotent no-op for rows 0092 already set;
--    harmless if this migration is ever applied to a fresh project before 0092).
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = $dby10002$dbms-sql-tutorial$dby10002$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10003$Chapter 1: Database Foundations$dby10003$, $dby10004$chapter-1-database-foundations$dby10004$, 1, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10005$dbms-sql-tutorial$dby10005$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10006$Chapter 2: DBMS Architecture$dby10006$, $dby10007$chapter-2-dbms-architecture$dby10007$, 2, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10008$dbms-sql-tutorial$dby10008$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10009$Chapter 3: Data Models$dby10009$, $dby10010$chapter-3-data-models$dby10010$, 3, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10011$dbms-sql-tutorial$dby10011$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10012$Chapter 4: Relational Model$dby10012$, $dby10013$chapter-4-relational-model$dby10013$, 4, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10014$dbms-sql-tutorial$dby10014$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10015$Chapter 5: Keys and Integrity$dby10015$, $dby10016$chapter-5-keys-and-integrity$dby10016$, 5, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10017$dbms-sql-tutorial$dby10017$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10018$Chapter 6: ER and EER Modeling$dby10018$, $dby10019$chapter-6-er-and-eer-modeling$dby10019$, 6, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10020$dbms-sql-tutorial$dby10020$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10021$Chapter 7: Relational Algebra$dby10021$, $dby10022$chapter-7-relational-algebra$dby10022$, 7, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10023$dbms-sql-tutorial$dby10023$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10024$Chapter 8: SQL Fundamentals$dby10024$, $dby10025$chapter-8-sql-fundamentals$dby10025$, 8, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10026$dbms-sql-tutorial$dby10026$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10027$Chapter 9: DDL and Schema Design$dby10027$, $dby10028$chapter-9-ddl-and-schema-design$dby10028$, 9, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10029$dbms-sql-tutorial$dby10029$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10030$Chapter 10: SQL Constraints$dby10030$, $dby10031$chapter-10-sql-constraints$dby10031$, 10, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10032$dbms-sql-tutorial$dby10032$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10033$Chapter 11: DML and Data Modification$dby10033$, $dby10034$chapter-11-dml-and-data-modification$dby10034$, 11, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10035$dbms-sql-tutorial$dby10035$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10036$Chapter 12: SELECT and Filtering$dby10036$, $dby10037$chapter-12-select-and-filtering$dby10037$, 12, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10038$dbms-sql-tutorial$dby10038$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10039$Chapter 13: Sorting and Pagination$dby10039$, $dby10040$chapter-13-sorting-and-pagination$dby10040$, 13, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10041$dbms-sql-tutorial$dby10041$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10042$Chapter 14: SQL Functions$dby10042$, $dby10043$chapter-14-sql-functions$dby10043$, 14, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10044$dbms-sql-tutorial$dby10044$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10045$Chapter 15: GROUP BY and Aggregation$dby10045$, $dby10046$chapter-15-group-by-and-aggregation$dby10046$, 15, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10047$dbms-sql-tutorial$dby10047$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10048$Chapter 16: Joins$dby10048$, $dby10049$chapter-16-joins$dby10049$, 16, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10050$dbms-sql-tutorial$dby10050$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10051$Chapter 17: Subqueries$dby10051$, $dby10052$chapter-17-subqueries$dby10052$, 17, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10053$dbms-sql-tutorial$dby10053$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10054$Chapter 18: Set Operations$dby10054$, $dby10055$chapter-18-set-operations$dby10055$, 18, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10056$dbms-sql-tutorial$dby10056$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10057$Chapter 19: Views$dby10057$, $dby10058$chapter-19-views$dby10058$, 19, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10059$dbms-sql-tutorial$dby10059$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10060$Chapter 20: Indexes and Access Paths$dby10060$, $dby10061$chapter-20-indexes-and-access-paths$dby10061$, 20, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10062$dbms-sql-tutorial$dby10062$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10063$Chapter 21: Normalization and Functional Dependencies$dby10063$, $dby10064$chapter-21-normalization-and-functional-dependencies$dby10064$, 21, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10065$dbms-sql-tutorial$dby10065$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10066$Chapter 22: Transactions$dby10066$, $dby10067$chapter-22-transactions$dby10067$, 22, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10068$dbms-sql-tutorial$dby10068$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10069$Chapter 23: Concurrency Control$dby10069$, $dby10070$chapter-23-concurrency-control$dby10070$, 23, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10071$dbms-sql-tutorial$dby10071$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10072$Chapter 24: Locking Protocols$dby10072$, $dby10073$chapter-24-locking-protocols$dby10073$, 24, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10074$dbms-sql-tutorial$dby10074$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10075$Chapter 25: Isolation Levels$dby10075$, $dby10076$chapter-25-isolation-levels$dby10076$, 25, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10077$dbms-sql-tutorial$dby10077$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10078$Chapter 26: Recovery and Logging$dby10078$, $dby10079$chapter-26-recovery-and-logging$dby10079$, 26, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10080$dbms-sql-tutorial$dby10080$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10081$Chapter 27: Database Security$dby10081$, $dby10082$chapter-27-database-security$dby10082$, 27, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10083$dbms-sql-tutorial$dby10083$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10084$Chapter 28: Stored Procedures$dby10084$, $dby10085$chapter-28-stored-procedures$dby10085$, 28, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10086$dbms-sql-tutorial$dby10086$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10087$Chapter 29: Stored Functions$dby10087$, $dby10088$chapter-29-stored-functions$dby10088$, 29, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10089$dbms-sql-tutorial$dby10089$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10090$Chapter 30: Triggers$dby10090$, $dby10091$chapter-30-triggers$dby10091$, 30, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10092$dbms-sql-tutorial$dby10092$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10093$Chapter 31: Cursors$dby10093$, $dby10094$chapter-31-cursors$dby10094$, 31, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10095$dbms-sql-tutorial$dby10095$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10096$Chapter 32: Advanced SQL: CTE$dby10096$, $dby10097$chapter-32-advanced-sql-cte$dby10097$, 32, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10098$dbms-sql-tutorial$dby10098$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10099$Chapter 33: Advanced SQL: Window Functions$dby10099$, $dby10100$chapter-33-advanced-sql-window-functions$dby10100$, 33, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10101$dbms-sql-tutorial$dby10101$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10102$Chapter 34: Advanced SQL Patterns$dby10102$, $dby10103$chapter-34-advanced-sql-patterns$dby10103$, 34, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10104$dbms-sql-tutorial$dby10104$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10105$Chapter 35: Query Processing and Optimization$dby10105$, $dby10106$chapter-35-query-processing-and-optimization$dby10106$, 35, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10107$dbms-sql-tutorial$dby10107$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10108$Chapter 36: Physical Storage$dby10108$, $dby10109$chapter-36-physical-storage$dby10109$, 36, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10110$dbms-sql-tutorial$dby10110$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10111$Chapter 37: Advanced Index Structures$dby10111$, $dby10112$chapter-37-advanced-index-structures$dby10112$, 37, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10113$dbms-sql-tutorial$dby10113$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10114$Chapter 38: Distributed Databases$dby10114$, $dby10115$chapter-38-distributed-databases$dby10115$, 38, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10116$dbms-sql-tutorial$dby10116$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10117$Chapter 39: NoSQL Databases$dby10117$, $dby10118$chapter-39-nosql-databases$dby10118$, 39, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10119$dbms-sql-tutorial$dby10119$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10120$Chapter 40: Database Scaling$dby10120$, $dby10121$chapter-40-database-scaling$dby10121$, 40, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10122$dbms-sql-tutorial$dby10122$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10123$Chapter 41: Data Warehousing$dby10123$, $dby10124$chapter-41-data-warehousing$dby10124$, 41, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10125$dbms-sql-tutorial$dby10125$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10126$Chapter 42: Database Design Projects$dby10126$, $dby10127$chapter-42-database-design-projects$dby10127$, 42, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10128$dbms-sql-tutorial$dby10128$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dby10129$Chapter 43: Interview and Placement Preparation$dby10129$, $dby10130$chapter-43-interview-and-placement-preparation$dby10130$, 43, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. TOPICS + NOTES CONTENT + MCQ QUIZ per topic (chapters 3, 4, 5)
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- Chapter 3: Data Models
-- ---------------------------------------------------------------------------
-- 3.1 Hierarchical Model
with g as (select id from public.learning_grids where lower(slug) = $dby10131$dbms-sql-tutorial$dby10131$),
     s as (select id from public.learning_sections where lower(slug) = $dby10132$chapter-3-data-models$dby10132$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10133$Hierarchical Model$dby10133$, $dby10134$hierarchical-model$dby10134$, '', 1, 'published', true, true, $dby10135$dbms_sql_tutorial$dby10135$, $dby10136$chapter-3-data-models/hierarchical-model$dby10136$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10137$dbms_sql_tutorial$dby10137$ and source_ref = $dby10138$chapter-3-data-models/hierarchical-model$dby10138$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10139$Hierarchical Model$dby10139$, $dby10140$### Overview

The hierarchical data model organizes data as a **tree of records**: every record (called a *node* or *segment*) has exactly one parent, except a single root segment which has none. A parent can have many children, but a child can have only one parent — this is a strict **1:N** relationship enforced by the structure itself, not by a constraint you declare.

This was the dominant model of the 1960s-70s, most famously implemented in **IBM's Information Management System (IMS)**, which is still in production today for large mainframe banking and airline systems because it is extremely fast for the access patterns it was designed for.

### How it works — a worked example

Think of a university's structure as a tree:

```
University
 └── College of Engineering
      ├── Dept: Computer Science
      │     ├── Course: DBMS
      │     └── Course: Operating Systems
      └── Dept: Electrical Engineering
            └── Course: Circuits
```

To fetch "all courses in Computer Science," you start at the root and **navigate down** parent→child pointers: University → College → Dept("CS") → Courses. This is called *navigational access* — there is no independent query language like SQL; the application program walks the tree using calls like `GET UNIQUE` / `GET NEXT WITHIN PARENT` (IMS's DL/I language).

A filesystem (directories containing files, each file in exactly one directory) is a hierarchical model you use every day.

### Edge cases and trade-offs

- **Many-to-many is the real killer.** A course like "DBMS" might logically belong to both CS and Information Systems departments, but a tree cannot have one child under two parents. The classic workaround is **duplicating the segment** under each parent, which causes update anomalies (fix the course description in one place, forget the copy).
- **Deletion is destructive by structure**: deleting a parent record conventionally deletes its entire subtree (deleting a department deletes all its courses), so applications must be written carefully.
- **Blazing fast for hierarchy-shaped, read-heavy workloads** (e.g., an insurance policy → its claims → each claim's line items) because a child is physically stored near its parent on disk — no join is ever needed.
- **Rigid**: adding a new kind of relationship after the fact usually requires restructuring the tree and rewriting navigational code, not just adding a table.

### Key takeaways / interview Q&A

**Q: Why can't the hierarchical model natively represent an employee who reports to two managers (a matrix org)?**
A: Because every non-root node must have exactly one parent; a second reporting line would require a second parent pointer, which the tree structure disallows. You'd have to duplicate the employee record under each manager.

**Q: What replaced the hierarchical model, and why?**
A: The relational model (Section 3.3), because it decouples logical queries from physical navigation and handles many-to-many relationships cleanly through join tables — at some cost in raw navigational speed.
$dby10140$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10141$dbms_sql_tutorial_seed$dby10141$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10142$dbms_sql_tutorial_seed$dby10142$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10143$dbms-sql-tutorial$dby10143$),
     t as (select id from public.learning_topics where source_kind = $dby10144$dbms_sql_tutorial$dby10144$ and source_ref = $dby10145$chapter-3-data-models/hierarchical-model$dby10145$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10146$pt-dbms-sql-3-hierarchical-model$dby10146$, $dby10147$Hierarchical Model - Quick Test$dby10147$, 'aptitude', 8, 8,
  $dby10148$8 questions on Hierarchical Model.$dby10148$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10149$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10149$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10150$tq-dbms-sql-3-hierarchical-model-1$dby10150$, $dby10151$pt-dbms-sql-3-hierarchical-model$dby10151$,
   $dby10152$In the hierarchical data model, what is the maximum number of parents a non-root record (segment) can have?$dby10152$,
   $dby10153$["Zero", "Exactly one", "Up to two", "Unlimited"]$dby10153$::jsonb,
   1, $dby10154$Every non-root segment in a hierarchical model has exactly one parent, forming a strict tree structure.$dby10154$, 1, 0),
  ($dby10155$tq-dbms-sql-3-hierarchical-model-2$dby10155$, $dby10156$pt-dbms-sql-3-hierarchical-model$dby10156$,
   $dby10157$Which well-known database system is the classic industrial implementation of the hierarchical model?$dby10157$,
   $dby10158$["IBM IMS", "MongoDB", "PostgreSQL", "Neo4j"]$dby10158$::jsonb,
   0, $dby10159$IBM's Information Management System (IMS) is the canonical hierarchical database, still used in mainframe environments.$dby10159$, 1, 1),
  ($dby10160$tq-dbms-sql-3-hierarchical-model-3$dby10160$, $dby10161$pt-dbms-sql-3-hierarchical-model$dby10161$,
   $dby10162$How is data typically accessed in a hierarchical database?$dby10162$,
   $dby10163$["Declarative SQL queries", "Navigational traversal from parent to child via program calls", "Graph traversal using index-free adjacency", "Key-based hashing"]$dby10163$::jsonb,
   1, $dby10164$Hierarchical systems like IMS use navigational access (e.g., DL/I calls such as GET NEXT WITHIN PARENT) rather than a declarative query language.$dby10164$, 1, 2),
  ($dby10165$tq-dbms-sql-3-hierarchical-model-4$dby10165$, $dby10166$pt-dbms-sql-3-hierarchical-model$dby10166$,
   $dby10167$A common everyday example of a hierarchical structure is:$dby10167$,
   $dby10168$["A social media friend graph", "A filesystem's directories and files", "A Redis cache", "A wide column-family table"]$dby10168$::jsonb,
   1, $dby10169$A filesystem is hierarchical: each file lives in exactly one directory, and directories nest into a tree.$dby10169$, 1, 3),
  ($dby10170$tq-dbms-sql-3-hierarchical-model-5$dby10170$, $dby10171$pt-dbms-sql-3-hierarchical-model$dby10171$,
   $dby10172$Why is representing many-to-many relationships problematic in the hierarchical model?$dby10172$,
   $dby10173$["The model doesn't support relationships at all", "A child segment can only be attached under one parent, so shared entities must be duplicated", "It requires foreign keys, which hierarchical databases lack", "Many-to-many requires a graph traversal engine"]$dby10173$::jsonb,
   1, $dby10174$Since a node can have only one parent, an entity related to two parents (e.g., a course in two departments) must be duplicated, risking inconsistency.$dby10174$, 1, 4),
  ($dby10175$tq-dbms-sql-3-hierarchical-model-6$dby10175$, $dby10176$pt-dbms-sql-3-hierarchical-model$dby10176$,
   $dby10177$What typically happens when a parent record is deleted in a hierarchical database?$dby10177$,
   $dby10178$["Nothing; children become orphaned root nodes automatically", "The delete is rejected unless children are manually detached", "Its entire subtree of child records is conventionally deleted along with it", "Children are automatically re-parented to the grandparent"]$dby10178$::jsonb,
   2, $dby10179$Because children are structurally bound to their parent, deleting a parent segment conventionally cascades and removes its entire subtree.$dby10179$, 1, 5),
  ($dby10180$tq-dbms-sql-3-hierarchical-model-7$dby10180$, $dby10181$pt-dbms-sql-3-hierarchical-model$dby10181$,
   $dby10182$Why can hierarchical databases like IMS still outperform relational databases for certain workloads?$dby10182$,
   $dby10183$["They use SQL more efficiently", "Child records are physically stored near their parent, avoiding the need for joins on hierarchy-shaped access patterns", "They automatically shard across clusters", "They support ACID transactions better"]$dby10183$::jsonb,
   1, $dby10184$Physical co-location of parent and child data lets hierarchical systems retrieve deeply nested records without performing joins, which is very fast for tree-shaped access.$dby10184$, 1, 6),
  ($dby10185$tq-dbms-sql-3-hierarchical-model-8$dby10185$, $dby10186$pt-dbms-sql-3-hierarchical-model$dby10186$,
   $dby10187$What is the fundamental limitation that eventually drove the industry from the hierarchical model toward the relational model?$dby10187$,
   $dby10188$["Hierarchical databases could not store text data", "The tight coupling of logical structure to physical navigation made ad-hoc queries and evolving relationships (especially many-to-many) very difficult", "Hierarchical databases could not run on mainframes", "SQL was invented before the hierarchical model existed"]$dby10188$::jsonb,
   1, $dby10189$The relational model decoupled logical queries from physical storage/navigation and handled many-to-many relationships via join tables, which the rigid hierarchical tree could not do cleanly.$dby10189$, 1, 7)
on conflict (id) do nothing;

-- 3.2 Network Model
with g as (select id from public.learning_grids where lower(slug) = $dby10190$dbms-sql-tutorial$dby10190$),
     s as (select id from public.learning_sections where lower(slug) = $dby10191$chapter-3-data-models$dby10191$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10192$Network Model$dby10192$, $dby10193$network-model$dby10193$, '', 2, 'published', true, true, $dby10194$dbms_sql_tutorial$dby10194$, $dby10195$chapter-3-data-models/network-model$dby10195$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10196$dbms_sql_tutorial$dby10196$ and source_ref = $dby10197$chapter-3-data-models/network-model$dby10197$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10198$Network Model$dby10198$, $dby10199$### Overview

The network model generalizes the hierarchical model by letting a record have **multiple parents**, turning the strict tree into a more flexible **graph of records**. It was standardized by **CODASYL (Conference on Data Systems Languages)** in the late 1960s, so it's often called the *CODASYL model*. Products like **IDMS (Integrated Database Management System)** implemented it and were widely used in enterprise mainframe systems.

### How it works — sets and owners/members

The core building block is the **set**: a named relationship between one *owner* record type and one or more *member* record types (a 1:N relationship). Crucially, a member record can belong to **multiple sets**, meaning it can have multiple owners — this is exactly what a tree can't do.

Worked example — a parts/suppliers system:

```
Supplier ──(supplies set)──> Part
Warehouse ──(stocks set)───> Part
```

Here, `Part` is a member of both the `supplies` set (owned by `Supplier`) and the `stocks` set (owned by `Warehouse`). In the hierarchical model this would force duplicating `Part` under each parent; in the network model, `Part` genuinely has two owners connected via distinct pointer chains.

Access is still **navigational**, using a language like CODASYL's DML: you `FIND` an owner record, then `FIND NEXT WITHIN <set-name>` to walk member records — the application programmer must know the set structure and write explicit traversal code, there's no declarative query language.

### Edge cases and trade-offs

- **Solves the many-to-many problem** the hierarchical model struggled with, by allowing multiple owner pointers per record — a genuine structural advance.
- **Still navigational and schema-rigid**: every possible traversal path (every "set") must be designed into the schema up front. An unanticipated query (walk from Part to Supplier when no set was defined that way) may require a full schema/program redesign.
- **High programming complexity**: application code is tightly coupled to the physical set structure; changing the schema often means rewriting application logic that walked those pointers — this brittleness is precisely what Codd's relational model (1970) was invented to fix.
- **Performance**: like the hierarchical model, pointer-chasing is very fast because there's no query optimizer overhead — but that speed comes at the cost of flexibility and higher development cost.

### How this differs from a modern graph database (Section 3.9)

Don't confuse the network model with modern graph databases like Neo4j. Both use "nodes and connections," but the network model's sets are **rigid, schema-defined, application-navigated pointer structures** from the 1970s with no declarative query language, whereas modern graph databases expose a flexible property graph with a declarative traversal language (e.g., Cypher) and can add new relationship types at runtime without a schema redesign.

### Key takeaways / interview Q&A

**Q: What is the key structural advantage of the network model over the hierarchical model?**
A: A member record can participate in multiple sets, i.e., have multiple owners — natively representing many-to-many relationships that hierarchical trees can only fake via duplication.

**Q: Why did the network model still get replaced by the relational model?**
A: Because it required all access paths to be predefined as sets and navigated procedurally in application code, making schema evolution and ad-hoc queries costly — problems the relational model solved with declarative query languages and physical data independence.
$dby10199$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10200$dbms_sql_tutorial_seed$dby10200$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10201$dbms_sql_tutorial_seed$dby10201$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10202$dbms-sql-tutorial$dby10202$),
     t as (select id from public.learning_topics where source_kind = $dby10203$dbms_sql_tutorial$dby10203$ and source_ref = $dby10204$chapter-3-data-models/network-model$dby10204$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10205$pt-dbms-sql-3-network-model$dby10205$, $dby10206$Network Model - Quick Test$dby10206$, 'aptitude', 8, 8,
  $dby10207$8 questions on Network Model.$dby10207$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10208$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10208$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10209$tq-dbms-sql-3-network-model-1$dby10209$, $dby10210$pt-dbms-sql-3-network-model$dby10210$,
   $dby10211$What CODASYL-defined construct represents a relationship between an owner record type and member record types in the network model?$dby10211$,
   $dby10212$["A join table", "A set", "A collection", "An index"]$dby10212$::jsonb,
   1, $dby10213$The CODASYL network model organizes relationships into named 'sets', each with one owner record type and one or more member record types.$dby10213$, 1, 0),
  ($dby10214$tq-dbms-sql-3-network-model-2$dby10214$, $dby10215$pt-dbms-sql-3-network-model$dby10215$,
   $dby10216$What is the key structural improvement the network model offers over the hierarchical model?$dby10216$,
   $dby10217$["It eliminates the need for pointers", "A member record can belong to multiple sets, i.e., have more than one owner", "It uses SQL for querying", "It requires no schema design at all"]$dby10217$::jsonb,
   1, $dby10218$Unlike hierarchical trees where each record has exactly one parent, network model records can be members of multiple sets, natively supporting many-to-many relationships.$dby10218$, 1, 1),
  ($dby10219$tq-dbms-sql-3-network-model-3$dby10219$, $dby10220$pt-dbms-sql-3-network-model$dby10220$,
   $dby10221$Which system is a well-known industrial implementation of the CODASYL network model?$dby10221$,
   $dby10222$["IDMS", "MongoDB", "Neo4j", "Cassandra"]$dby10222$::jsonb,
   0, $dby10223$IDMS (Integrated Database Management System) was a widely deployed CODASYL network-model database used in enterprise mainframe systems.$dby10223$, 1, 2),
  ($dby10224$tq-dbms-sql-3-network-model-4$dby10224$, $dby10225$pt-dbms-sql-3-network-model$dby10225$,
   $dby10226$How does an application typically retrieve data from a CODASYL network database?$dby10226$,
   $dby10227$["Declarative SQL SELECT statements", "Procedural navigation using DML calls like FIND and FIND NEXT WITHIN a named set", "Automatic schema-free document queries", "REST API calls"]$dby10227$::jsonb,
   1, $dby10228$CODASYL databases use navigational DML where the program explicitly finds owner records and walks member chains within named sets.$dby10228$, 1, 3),
  ($dby10229$tq-dbms-sql-3-network-model-5$dby10229$, $dby10230$pt-dbms-sql-3-network-model$dby10230$,
   $dby10231$In a network model schema where Part is a member of both a 'supplies' set (owned by Supplier) and a 'stocks' set (owned by Warehouse), what does this demonstrate?$dby10231$,
   $dby10232$["Parts cannot be shared between sets", "A record can have multiple owners, solving the many-to-many limitation of hierarchical trees", "This is only possible in relational databases", "Sets can only have one member record type"]$dby10232$::jsonb,
   1, $dby10233$Part participating in two sets shows the network model's core advantage: a member record can be linked to multiple distinct owners.$dby10233$, 1, 4),
  ($dby10234$tq-dbms-sql-3-network-model-6$dby10234$, $dby10235$pt-dbms-sql-3-network-model$dby10235$,
   $dby10236$What is a major drawback of the network model that ultimately motivated the shift to the relational model?$dby10236$,
   $dby10237$["It could not represent one-to-many relationships", "All access paths (sets) must be predefined in the schema, and application code is tightly coupled to that pointer structure", "It could not run on mainframes", "It required a graph query language that didn't exist yet"]$dby10237$::jsonb,
   1, $dby10238$Because traversal paths are hard-coded as sets and navigated procedurally, unanticipated queries or schema changes required redesigning both schema and application code.$dby10238$, 1, 5),
  ($dby10239$tq-dbms-sql-3-network-model-7$dby10239$, $dby10240$pt-dbms-sql-3-network-model$dby10240$,
   $dby10241$How does the CODASYL network model fundamentally differ from a modern graph database like Neo4j, despite both using 'nodes and connections'?$dby10241$,
   $dby10242$["They are actually identical in every respect", "The network model uses rigid, schema-predefined sets navigated procedurally, while modern graph databases use a flexible property graph with declarative query languages", "Modern graph databases cannot represent many-to-many relationships", "The network model uses SQL while graph databases do not"]$dby10242$::jsonb,
   1, $dby10243$Network model sets are fixed at schema design time and walked with procedural code, whereas graph databases allow new relationship types at runtime and support declarative traversal languages like Cypher.$dby10243$, 1, 6),
  ($dby10244$tq-dbms-sql-3-network-model-8$dby10244$, $dby10245$pt-dbms-sql-3-network-model$dby10245$,
   $dby10246$Which organization standardized the network data model in the late 1960s?$dby10246$,
   $dby10247$["ANSI", "ISO", "CODASYL", "W3C"]$dby10247$::jsonb,
   2, $dby10248$CODASYL (Conference on Data Systems Languages) produced the specification that defined the network data model, hence it is often called the CODASYL model.$dby10248$, 1, 7)
on conflict (id) do nothing;

-- 3.3 Relational Model
with g as (select id from public.learning_grids where lower(slug) = $dby10249$dbms-sql-tutorial$dby10249$),
     s as (select id from public.learning_sections where lower(slug) = $dby10250$chapter-3-data-models$dby10250$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10251$Relational Model$dby10251$, $dby10252$relational-model$dby10252$, '', 3, 'published', true, true, $dby10253$dbms_sql_tutorial$dby10253$, $dby10254$chapter-3-data-models/relational-model$dby10254$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10255$dbms_sql_tutorial$dby10255$ and source_ref = $dby10256$chapter-3-data-models/relational-model$dby10256$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10257$Relational Model$dby10257$, $dby10258$### Overview

The relational model, introduced by **Edgar F. Codd in his 1970 paper "A Relational Model of Data for Large Shared Data Banks,"** represents data as a collection of **relations (tables)** — each relation is a set of **tuples (rows)** with a fixed set of **attributes (columns)**. Its foundational idea is **data independence**: you describe data logically (what tables and constraints exist) and query it declaratively, while the DBMS decides *how* to physically store and access it. This is a direct rejection of the hierarchical and network models' navigational, pointer-chasing approach.

### How it works — a worked example

```
Students(student_id PK, name, dept_id FK)
Courses(course_id PK, title, credits)
Enrollments(student_id FK, course_id FK, grade, PRIMARY KEY(student_id, course_id))
```

To answer "which courses did Alice take, and what grades did she get," you don't navigate pointers — you write a declarative query:

```sql
SELECT c.title, e.grade
FROM Students s
JOIN Enrollments e ON s.student_id = e.student_id
JOIN Courses c ON e.course_id = c.course_id
WHERE s.name = 'Alice';
```

The optimizer decides the join strategy and access path; you only state *what* you want. **Foreign keys** enforce referential integrity, and **normalization** (1NF/2NF/3NF/BCNF) eliminates redundancy: a student's name is stored once, not duplicated in every enrollment row (unlike the duplication problem in the hierarchical model).

### Edge cases and trade-offs

- **Many-to-many is trivial and clean**: a junction/associative table like `Enrollments` naturally represents it — no duplication, no rigid predefined "sets" like the network model required.
- **ACID transactions** (Atomicity, Consistency, Isolation, Durability) are a hallmark strength, making relational databases the default choice for financial and transactional systems.
- **Impedance mismatch**: application code is usually written in object-oriented languages, but relational tables don't map 1:1 to objects/classes (an object's list-valued field needs a separate table + join). This mismatch is exactly what the Object-Relational (3.5) and Document (3.6) models try to reduce.
- **Rigid schema, vertical scaling bias**: adding a column to a huge table can be an expensive migration, and traditional RDBMS scale primarily by adding more powerful hardware (vertical scaling) rather than easily sharding across many cheap servers — a major reason NoSQL models emerged for very large, distributed workloads (see 3.10).
- **Over-normalization can hurt performance**: many joins across normalized tables can be slower than a single denormalized document read, which is one reason document databases exist for read-heavy, deeply nested data.

### Key takeaways / interview Q&A

**Q: What is the single biggest conceptual shift the relational model introduced over hierarchical/network models?**
A: Data independence — separating the logical query (declarative, set-based) from the physical storage and access path, so applications don't break when internal storage structures change.

**Q: Why is a junction table needed for many-to-many relationships in the relational model?**
A: Because a relation can't directly hold a "many" value that references multiple rows of another table in a normalized way; a junction table (like `Enrollments`) stores each pairing as its own row, referencing both sides via foreign keys.
$dby10258$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10259$dbms_sql_tutorial_seed$dby10259$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10260$dbms_sql_tutorial_seed$dby10260$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10261$dbms-sql-tutorial$dby10261$),
     t as (select id from public.learning_topics where source_kind = $dby10262$dbms_sql_tutorial$dby10262$ and source_ref = $dby10263$chapter-3-data-models/relational-model$dby10263$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10264$pt-dbms-sql-3-relational-model$dby10264$, $dby10265$Relational Model - Quick Test$dby10265$, 'aptitude', 8, 8,
  $dby10266$8 questions on Relational Model.$dby10266$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10267$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10267$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10268$tq-dbms-sql-3-relational-model-1$dby10268$, $dby10269$pt-dbms-sql-3-relational-model$dby10269$,
   $dby10270$Who introduced the relational model and in what year?$dby10270$,
   $dby10271$["Edgar F. Codd, 1970", "Charles Bachman, 1969", "Michael Stonebraker, 1980", "Ted Codd, 1985"]$dby10271$::jsonb,
   0, $dby10272$E. F. Codd published the foundational relational model paper in 1970 while at IBM.$dby10272$, 1, 0),
  ($dby10273$tq-dbms-sql-3-relational-model-2$dby10273$, $dby10274$pt-dbms-sql-3-relational-model$dby10274$,
   $dby10275$In the relational model, what is a 'tuple'?$dby10275$,
   $dby10276$["A column name", "A single row in a table", "A database index", "A stored procedure"]$dby10276$::jsonb,
   1, $dby10277$A tuple corresponds to a single row of a relation (table), representing one record with values for each attribute.$dby10277$, 1, 1),
  ($dby10278$tq-dbms-sql-3-relational-model-3$dby10278$, $dby10279$pt-dbms-sql-3-relational-model$dby10279$,
   $dby10280$What core principle distinguishes the relational model from the navigational hierarchical and network models?$dby10280$,
   $dby10281$["It requires more storage space", "Data independence: queries are declarative and separate from physical storage/access paths", "It cannot represent one-to-many relationships", "It does not support keys or constraints"]$dby10281$::jsonb,
   1, $dby10282$The relational model's hallmark is data independence: you write declarative queries and the DBMS decides the physical access strategy, unlike navigational pointer-chasing models.$dby10282$, 1, 2),
  ($dby10283$tq-dbms-sql-3-relational-model-4$dby10283$, $dby10284$pt-dbms-sql-3-relational-model$dby10284$,
   $dby10285$How does the relational model represent a many-to-many relationship, such as students enrolling in multiple courses?$dby10285$,
   $dby10286$["By duplicating student records under each course", "Using a junction/associative table with foreign keys to both related tables", "By nesting course documents inside student documents", "It cannot represent many-to-many relationships"]$dby10286$::jsonb,
   1, $dby10287$A junction table like Enrollments(student_id, course_id) cleanly represents many-to-many relationships without duplication, unlike hierarchical trees.$dby10287$, 1, 3),
  ($dby10288$tq-dbms-sql-3-relational-model-5$dby10288$, $dby10289$pt-dbms-sql-3-relational-model$dby10289$,
   $dby10290$What does 'ACID' stand for in the context of relational database transactions?$dby10290$,
   $dby10291$["Atomicity, Consistency, Isolation, Durability", "Access, Concurrency, Indexing, Distribution", "Aggregation, Caching, Integrity, Denormalization", "Availability, Consistency, Idempotency, Durability"]$dby10291$::jsonb,
   0, $dby10292$ACID properties (Atomicity, Consistency, Isolation, Durability) are the transactional guarantees traditionally associated with relational databases.$dby10292$, 1, 4),
  ($dby10293$tq-dbms-sql-3-relational-model-6$dby10293$, $dby10294$pt-dbms-sql-3-relational-model$dby10294$,
   $dby10295$What is the 'impedance mismatch' problem often cited as a drawback of the relational model?$dby10295$,
   $dby10296$["SQL queries run too slowly on large tables", "Object-oriented application code doesn't map cleanly onto flat, normalized tables, requiring extra translation logic", "Relational databases cannot store numeric data", "Tables cannot have more than one primary key column"]$dby10296$::jsonb,
   1, $dby10297$Since application objects often have nested or list-valued attributes, mapping them to normalized relational tables requires extra joins/translation, motivating ORMs and alternative models like document stores.$dby10297$, 1, 5),
  ($dby10298$tq-dbms-sql-3-relational-model-7$dby10298$, $dby10299$pt-dbms-sql-3-relational-model$dby10299$,
   $dby10300$Why might a highly normalized relational schema underperform a document database for certain read-heavy workloads?$dby10300$,
   $dby10301$["Relational databases cannot use indexes", "Retrieving a full logical entity may require joining many normalized tables, whereas a document store can return one denormalized document in a single read", "SQL cannot filter on multiple conditions", "Relational tables cannot store text fields"]$dby10301$::jsonb,
   1, $dby10302$Normalization spreads related data across multiple tables, so reconstructing a full entity requires joins; a document model keeps a denormalized nested structure that can be fetched in one read.$dby10302$, 1, 6),
  ($dby10303$tq-dbms-sql-3-relational-model-8$dby10303$, $dby10304$pt-dbms-sql-3-relational-model$dby10304$,
   $dby10305$What is a common scaling limitation traditionally associated with relational databases compared to many NoSQL systems?$dby10305$,
   $dby10306$["They cannot enforce data integrity", "They typically scale vertically (more powerful single-server hardware) rather than easily horizontally across many commodity servers", "They cannot support transactions", "They cannot store more than one table"]$dby10306$::jsonb,
   1, $dby10307$Traditional RDBMSs are often scaled up (bigger machines) rather than out, whereas many NoSQL models were designed from the start for horizontal, distributed scaling.$dby10307$, 1, 7)
on conflict (id) do nothing;

-- 3.4 Object-Oriented Model
with g as (select id from public.learning_grids where lower(slug) = $dby10308$dbms-sql-tutorial$dby10308$),
     s as (select id from public.learning_sections where lower(slug) = $dby10309$chapter-3-data-models$dby10309$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10310$Object-Oriented Model$dby10310$, $dby10311$object-oriented-model$dby10311$, '', 4, 'published', true, true, $dby10312$dbms_sql_tutorial$dby10312$, $dby10313$chapter-3-data-models/object-oriented-model$dby10313$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10314$dbms_sql_tutorial$dby10314$ and source_ref = $dby10315$chapter-3-data-models/object-oriented-model$dby10315$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10316$Object-Oriented Model$dby10316$, $dby10317$### Overview

The object-oriented (OO) data model stores data as **objects** — instances of classes that bundle **state (attributes)** together with **behavior (methods)**, directly mirroring object-oriented programming languages like C++, Java, or Smalltalk. Each object has a unique **Object Identifier (OID)** that exists independently of its attribute values (unlike a relational primary key, which is *derived from* data). This model supports **encapsulation, inheritance, and polymorphism** as first-class database features, not just application-layer constructs.

Object databases like **db4o**, **ObjectDB**, and **Versant** implement this model, and it saw real adoption in domains with deeply nested, complex structures: CAD/CAM systems, telecom network configuration, and multimedia repositories.

### How it works — a worked example

In an OO database for a CAD system, you might define a class hierarchy directly in the database:

```
class Shape { color; draw(); area(); }
class Circle extends Shape { radius; }
class Rectangle extends Shape { width; height; }
```

A `Circle` object is stored *as an object* — its data and its `area()` method travel together — and can reference other objects directly by OID (e.g., a `Drawing` object holding a list of `Shape` object references), no join needed. Because inheritance is native, querying "all Shapes" naturally polymorphically returns Circles and Rectangles alike.

### Edge cases and trade-offs

- **No impedance mismatch**: this is the OO model's core selling point — application objects are persisted directly, with no translation layer between in-memory objects and stored records (contrast with the relational model's ORM layer).
- **Complex objects are natural**: nested, recursive, or graph-like object structures (a `Drawing` containing `Shapes` containing sub-`Shapes`) are stored and traversed directly via object references, without joins.
- **Weak ad-hoc querying**: unlike SQL's universally adopted declarative query language, OO databases never converged on a single standard query language (ODMG's OQL existed but never gained the traction SQL did), making ad-hoc reporting and cross-cutting queries harder.
- **Tight coupling to application code**: because the schema is literally the class definitions, changing a class definition can require careful schema migration of already-persisted objects — and swapping programming languages is much harder than with a relational database.
- **Niche adoption**: OO databases never displaced relational databases for mainstream business applications, largely because SQL tooling, reporting ecosystems, and DBA familiarity with relational systems were (and remain) far more mature.

### How this differs from the Object-Relational Model (3.5)

Don't conflate this with the Object-Relational model: the OO model is a *from-scratch* database paradigm where objects (with methods and inheritance) are the fundamental storage unit and there is no underlying table structure. The Object-Relational model, by contrast, is fundamentally still **relational** (tables, SQL, tuples) but *extended* with OO features like user-defined types and inheritance — it's evolution, not replacement.

### Key takeaways / interview Q&A

**Q: What is an Object Identifier (OID) and how does it differ from a relational primary key?**
A: An OID is a system-generated identity for an object that is independent of its attribute values and never changes, even if all the object's data changes — a relational primary key, by contrast, is a data value (or combination of values) drawn from the attributes themselves.

**Q: Why didn't the object-oriented model replace the relational model for mainstream applications?**
A: Lack of a universally adopted declarative query language, weaker ad-hoc/reporting tooling, and tight coupling between schema and application class definitions made it less practical for general business use, despite eliminating the impedance mismatch.
$dby10317$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10318$dbms_sql_tutorial_seed$dby10318$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10319$dbms_sql_tutorial_seed$dby10319$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10320$dbms-sql-tutorial$dby10320$),
     t as (select id from public.learning_topics where source_kind = $dby10321$dbms_sql_tutorial$dby10321$ and source_ref = $dby10322$chapter-3-data-models/object-oriented-model$dby10322$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10323$pt-dbms-sql-3-object-oriented-model$dby10323$, $dby10324$Object-Oriented Model - Quick Test$dby10324$, 'aptitude', 8, 8,
  $dby10325$8 questions on Object-Oriented Model.$dby10325$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10326$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10326$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10327$tq-dbms-sql-3-object-oriented-model-1$dby10327$, $dby10328$pt-dbms-sql-3-object-oriented-model$dby10328$,
   $dby10329$In the object-oriented data model, what bundles together in a single object?$dby10329$,
   $dby10330$["Only attributes (state)", "Only methods (behavior)", "Both state (attributes) and behavior (methods)", "Only foreign keys"]$dby10330$::jsonb,
   2, $dby10331$The defining feature of the OO model is that an object bundles state and behavior together, mirroring object-oriented programming languages.$dby10331$, 1, 0),
  ($dby10332$tq-dbms-sql-3-object-oriented-model-2$dby10332$, $dby10333$pt-dbms-sql-3-object-oriented-model$dby10333$,
   $dby10334$What is an Object Identifier (OID)?$dby10334$,
   $dby10335$["A value derived from an object's attributes, like a relational primary key", "A system-generated identity independent of the object's attribute values", "A foreign key referencing another table", "A hash of the object's class name"]$dby10335$::jsonb,
   1, $dby10336$Unlike a relational primary key (derived from data), an OID is assigned by the system and remains stable even if all attribute values change.$dby10336$, 1, 1),
  ($dby10337$tq-dbms-sql-3-object-oriented-model-3$dby10337$, $dby10338$pt-dbms-sql-3-object-oriented-model$dby10338$,
   $dby10339$Which of these is a real-world domain where object-oriented databases saw practical adoption?$dby10339$,
   $dby10340$["Simple two-column lookup tables", "CAD/CAM systems with deeply nested complex objects", "Basic key-value session caching", "Flat CSV file storage"]$dby10340$::jsonb,
   1, $dby10341$CAD/CAM, telecom configuration, and multimedia repositories are classic domains where OO databases' native support for complex, nested objects proved useful.$dby10341$, 1, 2),
  ($dby10342$tq-dbms-sql-3-object-oriented-model-4$dby10342$, $dby10343$pt-dbms-sql-3-object-oriented-model$dby10343$,
   $dby10344$What major advantage does the object-oriented model claim over the relational model?$dby10344$,
   $dby10345$["Better support for SQL reporting", "Elimination of the impedance mismatch, since application objects are persisted directly without translation", "Simpler horizontal scaling across clusters", "Stronger support for ad-hoc declarative queries"]$dby10345$::jsonb,
   1, $dby10346$Because objects are stored directly as objects (with methods and inheritance intact), there is no translation layer between in-memory application objects and stored data.$dby10346$, 1, 3),
  ($dby10347$tq-dbms-sql-3-object-oriented-model-5$dby10347$, $dby10348$pt-dbms-sql-3-object-oriented-model$dby10348$,
   $dby10349$What has historically limited mainstream adoption of object-oriented databases?$dby10349$,
   $dby10350$["They cannot represent inheritance", "Lack of a universally adopted declarative query language comparable to SQL, weakening ad-hoc querying and reporting", "They cannot store any attribute data", "They require no schema at all, making them insecure"]$dby10350$::jsonb,
   1, $dby10351$Unlike SQL, no OO query language (e.g., ODMG's OQL) achieved comparable industry-wide adoption, which hurt tooling, reporting, and general practicality.$dby10351$, 1, 4),
  ($dby10352$tq-dbms-sql-3-object-oriented-model-6$dby10352$, $dby10353$pt-dbms-sql-3-object-oriented-model$dby10353$,
   $dby10354$In an object-oriented database, how would a Drawing object typically reference a collection of Shape objects it contains?$dby10354$,
   $dby10355$["Via a separate junction table with foreign keys", "Via direct object references (OIDs) to the Shape objects, with no join required", "Only through a document embedded as JSON", "Through a column-family wide row"]$dby10355$::jsonb,
   1, $dby10356$OO databases store direct object-to-object references via OIDs, allowing navigation without performing relational joins.$dby10356$, 1, 5),
  ($dby10357$tq-dbms-sql-3-object-oriented-model-7$dby10357$, $dby10358$pt-dbms-sql-3-object-oriented-model$dby10358$,
   $dby10359$How does the Object-Oriented model fundamentally differ from the Object-Relational model?$dby10359$,
   $dby10360$["They are the same model with different names", "The OO model has no underlying table structure at all (objects are the fundamental unit), while the Object-Relational model is still table/SQL-based but extended with OO features", "The Object-Relational model cannot support inheritance", "The OO model always requires a schema-free document store"]$dby10360$::jsonb,
   1, $dby10361$The OO model is a from-scratch paradigm built around objects, whereas the Object-Relational model remains fundamentally relational (tables, SQL) with added OO extensions like user-defined types.$dby10361$, 1, 6),
  ($dby10362$tq-dbms-sql-3-object-oriented-model-8$dby10362$, $dby10363$pt-dbms-sql-3-object-oriented-model$dby10363$,
   $dby10364$Why can querying 'all Shapes' in an OO database naturally return both Circle and Rectangle objects?$dby10364$,
   $dby10365$["Because SQL UNION is used behind the scenes", "Because inheritance is a native database feature, so subclasses are polymorphically included when querying the superclass", "Because Circle and Rectangle are stored in the same table with a type column", "Because OO databases ignore class hierarchies"]$dby10365$::jsonb,
   1, $dby10366$Since class inheritance is a first-class feature of the OO model, querying a superclass polymorphically includes instances of its subclasses.$dby10366$, 1, 7)
on conflict (id) do nothing;

-- 3.5 Object-Relational Model
with g as (select id from public.learning_grids where lower(slug) = $dby10367$dbms-sql-tutorial$dby10367$),
     s as (select id from public.learning_sections where lower(slug) = $dby10368$chapter-3-data-models$dby10368$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10369$Object-Relational Model$dby10369$, $dby10370$object-relational-model$dby10370$, '', 5, 'published', true, true, $dby10371$dbms_sql_tutorial$dby10371$, $dby10372$chapter-3-data-models/object-relational-model$dby10372$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10373$dbms_sql_tutorial$dby10373$ and source_ref = $dby10374$chapter-3-data-models/object-relational-model$dby10374$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10375$Object-Relational Model$dby10375$, $dby10376$### Overview

The Object-Relational (OR) model takes the relational model as its foundation — tables, tuples, SQL, ACID transactions — and **extends it with object-oriented features**: user-defined composite types, arrays, inheritance between tables, and methods/functions attached to types. It's an evolutionary bridge, not a replacement: you keep everything the relational model does well and add expressiveness for complex data. **PostgreSQL** is the textbook example (it was literally born from the Berkeley POSTGRES research project explicitly designed to add object-oriented concepts to relational databases); **Oracle** also has substantial object-relational extensions (object types, VARRAYs, nested tables).

### How it works — a worked example

In PostgreSQL, you can define a composite (structured) type and use it as a column, plus use arrays and table inheritance directly in SQL:

```sql
CREATE TYPE address AS (street text, city text, zip text);

CREATE TABLE customers (
  id serial PRIMARY KEY,
  name text,
  home_address address,           -- structured/composite column
  phone_numbers text[]            -- array column, not a separate join table
);

CREATE TABLE premium_customers (
  loyalty_tier text
) INHERITS (customers);           -- table inheritance
```

A query can now do `SELECT (home_address).city FROM customers;` or `SELECT * FROM customers WHERE 'billing' = ANY(phone_numbers);` — nested and multi-valued data live directly in a row without a separate normalized join table, while you still get full SQL, indexes, and transactions.

### Edge cases and trade-offs

- **Reduces (but doesn't eliminate) the impedance mismatch**: composite types and arrays let a row look more like an application object, but you're still fundamentally working within SQL and tables — not full object semantics like OIDs or arbitrary method dispatch as in the pure OO model (3.4).
- **Table inheritance has real query implications**: a query on the parent `customers` table by default also returns rows from `premium_customers` (unless you use `ONLY customers`), which can surprise developers used to purely relational semantics.
- **Array/composite columns can violate normalization on purpose**: storing `phone_numbers text[]` directly in a row is a deliberate denormalization for convenience/performance, trading strict 1NF purity for fewer joins — a call to make carefully, since indexing and querying inside arrays is less mature than plain columns.
- **Not the same as adding a JSON column**: object-relational extensibility (custom types, inheritance, user-defined functions/operators) is a schema-level feature designed and typed up front, distinct from a semi-structured JSON/JSONB column bolted onto a table for flexible, evolving structure (which is closer in spirit to the Document model, 3.6, even though PostgreSQL supports JSONB too).

### Key takeaways / interview Q&A

**Q: How does the Object-Relational model differ from the pure Object-Oriented model?**
A: OR databases are still fundamentally relational — tables, SQL, ACID — merely extended with OO-flavored features like composite types, arrays, and inheritance; OO databases discard tables entirely in favor of objects with OIDs and native method dispatch as the storage unit.

**Q: Give a concrete PostgreSQL feature that makes it "object-relational" rather than purely relational.**
A: User-defined composite types, array-typed columns, and table inheritance (`CREATE TABLE ... INHERITS (...)`) — all layered on top of standard relational tables and SQL.
$dby10376$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10377$dbms_sql_tutorial_seed$dby10377$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10378$dbms_sql_tutorial_seed$dby10378$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10379$dbms-sql-tutorial$dby10379$),
     t as (select id from public.learning_topics where source_kind = $dby10380$dbms_sql_tutorial$dby10380$ and source_ref = $dby10381$chapter-3-data-models/object-relational-model$dby10381$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10382$pt-dbms-sql-3-object-relational-model$dby10382$, $dby10383$Object-Relational Model - Quick Test$dby10383$, 'aptitude', 8, 8,
  $dby10384$8 questions on Object-Relational Model.$dby10384$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10385$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10385$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10386$tq-dbms-sql-3-object-relational-model-1$dby10386$, $dby10387$pt-dbms-sql-3-object-relational-model$dby10387$,
   $dby10388$What is the fundamental relationship between the Object-Relational model and the pure relational model?$dby10388$,
   $dby10389$["They are unrelated, competing paradigms", "The Object-Relational model extends the relational model with OO features while keeping tables, SQL, and ACID transactions", "The Object-Relational model has no tables at all", "The Object-Relational model replaced SQL with OQL"]$dby10389$::jsonb,
   1, $dby10390$The object-relational model is an evolutionary extension of the relational model, adding features like composite types and inheritance while retaining tables and SQL.$dby10390$, 1, 0),
  ($dby10391$tq-dbms-sql-3-object-relational-model-2$dby10391$, $dby10392$pt-dbms-sql-3-object-relational-model$dby10392$,
   $dby10393$Which database system is most commonly cited as the textbook example of an object-relational database?$dby10393$,
   $dby10394$["MongoDB", "Redis", "PostgreSQL", "Neo4j"]$dby10394$::jsonb,
   2, $dby10395$PostgreSQL originated from the Berkeley POSTGRES project explicitly built to add object-oriented concepts to relational databases.$dby10395$, 1, 1),
  ($dby10396$tq-dbms-sql-3-object-relational-model-3$dby10396$, $dby10397$pt-dbms-sql-3-object-relational-model$dby10397$,
   $dby10398$In PostgreSQL, what does 'CREATE TABLE premium_customers (...) INHERITS (customers)' demonstrate?$dby10398$,
   $dby10399$["A foreign key relationship", "Table inheritance, an object-relational extension to the pure relational model", "A many-to-many junction table", "A materialized view"]$dby10399$::jsonb,
   1, $dby10400$INHERITS creates a table inheritance relationship, an OO-style feature layered onto the relational model.$dby10400$, 1, 2),
  ($dby10401$tq-dbms-sql-3-object-relational-model-4$dby10401$, $dby10402$pt-dbms-sql-3-object-relational-model$dby10402$,
   $dby10403$What is a key behavioral quirk of table inheritance in PostgreSQL that can surprise developers?$dby10403$,
   $dby10404$["Child tables cannot have any additional columns", "A query on the parent table by default also returns rows from child tables unless ONLY is specified", "Inherited tables cannot be indexed", "Parent table queries never include child rows"]$dby10404$::jsonb,
   1, $dby10405$By default, querying the parent table includes rows from all its child tables; using ONLY customers restricts the query to just the parent table's own rows.$dby10405$, 1, 3),
  ($dby10406$tq-dbms-sql-3-object-relational-model-5$dby10406$, $dby10407$pt-dbms-sql-3-object-relational-model$dby10407$,
   $dby10408$How does storing a 'phone_numbers text[]' array column directly in a customers table relate to normalization?$dby10408$,
   $dby10409$["It strictly enforces First Normal Form (1NF)", "It is a deliberate denormalization, trading strict atomicity of values for fewer joins", "It has no relationship to normalization concepts", "It automatically creates a separate join table behind the scenes"]$dby10409$::jsonb,
   1, $dby10410$Storing multiple values in one array column is a deliberate deviation from strict 1NF (atomic values only) for convenience and fewer joins.$dby10410$, 1, 4),
  ($dby10411$tq-dbms-sql-3-object-relational-model-6$dby10411$, $dby10412$pt-dbms-sql-3-object-relational-model$dby10412$,
   $dby10413$How does the Object-Relational model differ from the pure Object-Oriented model (3.4)?$dby10413$,
   $dby10414$["They are identical; OR is just a marketing term for OO databases", "OR databases remain fundamentally table/SQL-based with OO extensions, while OO databases use objects with OIDs as the fundamental storage unit with no underlying tables", "OO databases always run on top of relational engines", "OR databases cannot support user-defined types"]$dby10414$::jsonb,
   1, $dby10415$The Object-Relational model keeps the relational foundation (tables, SQL) and adds OO features, whereas the pure OO model discards tables in favor of objects and OIDs as the storage unit.$dby10415$, 1, 5),
  ($dby10416$tq-dbms-sql-3-object-relational-model-7$dby10416$, $dby10417$pt-dbms-sql-3-object-relational-model$dby10417$,
   $dby10418$What SQL object-relational feature lets you define a structured column type, such as an 'address' with street, city, and zip fields?$dby10418$,
   $dby10419$["A composite (user-defined) type", "A materialized view", "A stored procedure", "A trigger"]$dby10419$::jsonb,
   0, $dby10420$User-defined composite types let a single column hold a structured value, an object-relational extension to plain scalar columns.$dby10420$, 1, 6),
  ($dby10421$tq-dbms-sql-3-object-relational-model-8$dby10421$, $dby10422$pt-dbms-sql-3-object-relational-model$dby10422$,
   $dby10423$Is adding a JSONB column to a PostgreSQL table the same thing as using its object-relational features like composite types and table inheritance?$dby10423$,
   $dby10424$["Yes, they are identical mechanisms", "No \u2014 JSONB is a semi-structured, schema-flexible column closer in spirit to the document model, while composite types/inheritance are schema-level, typed object-relational features", "No, because PostgreSQL does not actually support JSONB", "Yes, because both eliminate the need for SQL entirely"]$dby10424$::jsonb,
   1, $dby10425$JSONB provides flexible, semi-structured storage (conceptually closer to the document model), whereas true object-relational features like composite types and inheritance are strongly typed and defined at the schema level.$dby10425$, 1, 7)
on conflict (id) do nothing;

-- 3.6 Document Model
with g as (select id from public.learning_grids where lower(slug) = $dby10426$dbms-sql-tutorial$dby10426$),
     s as (select id from public.learning_sections where lower(slug) = $dby10427$chapter-3-data-models$dby10427$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10428$Document Model$dby10428$, $dby10429$document-model$dby10429$, '', 6, 'published', true, true, $dby10430$dbms_sql_tutorial$dby10430$, $dby10431$chapter-3-data-models/document-model$dby10431$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10432$dbms_sql_tutorial$dby10432$ and source_ref = $dby10433$chapter-3-data-models/document-model$dby10433$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10434$Document Model$dby10434$, $dby10435$### Overview

The document model stores data as self-contained, semi-structured **documents** — typically JSON or BSON (binary JSON) — where each document can have nested objects and arrays, and different documents in the same collection are **not required to share an identical schema** (schema-on-read rather than schema-on-write). This is a member of the broader NoSQL family, popularized by **MongoDB** and **CouchDB**.

### How it works — a worked example

A user profile in a document database might look like:

```json
{
  "_id": "u123",
  "name": "Priya",
  "email": "priya@example.com",
  "addresses": [
    { "type": "home", "city": "Pune", "zip": "411001" },
    { "type": "work", "city": "Mumbai", "zip": "400001" }
  ],
  "preferences": { "newsletter": true, "theme": "dark" }
}
```

Everything about this user — including multiple addresses and nested preferences — lives in **one document**, retrievable in a single read with no joins. A different document in the same `users` collection could omit `preferences` entirely or add a new field like `loyaltyTier`, and that's perfectly valid — the collection has no rigid, enforced schema the way a relational table does.

### Edge cases and trade-offs

- **Denormalization is the norm, not the exception**: data that would be normalized into separate relational tables (addresses, preferences) is embedded directly, which is fast for reads but means updating a piece of data duplicated across many documents requires updating every copy.
- **Rich internal query support**: unlike key-value stores, document databases can query *into* the nested structure — e.g., "find all users whose `addresses.city` is 'Pune'" — because the database understands the document's internal fields and can index them.
- **Multi-document transactions exist but are costlier**: MongoDB added ACID multi-document transactions in version 4.0+, but the model's natural strength is single-document atomicity, not cross-document joins/transactions.
- **Schema flexibility is a double-edged sword**: it speeds up iteration (no migrations to add a field) but pushes data-integrity responsibility onto the application layer — there's no built-in foreign key enforcement between collections the way relational databases enforce it between tables.

### Differentiating from Key-Value (3.7) and Column-Family (3.8) models

This is the most commonly confused trio in NoSQL, so be precise:
- **Document vs. Key-Value**: a key-value store treats its value as an **opaque blob** — the database cannot see or query fields inside it, only fetch/store by key. A document store *understands the internal structure* of the document and can query, index, and filter on nested fields (like `addresses.city` above). Every document store is technically retrievable by a key (`_id`), but the querying power inside the value is what sets it apart.
- **Document vs. Column-Family**: a column-family store (Cassandra, HBase) organizes data into rows identified by a key, where each row can have a different sparse set of columns grouped into families — optimized for very high write throughput and horizontal scale across huge clusters, with a data model still structured around static column families rather than freeform nested JSON. Document stores optimize for flexible, deeply nested, application-object-shaped data, not primarily raw write-throughput at Cassandra's scale.

### Key takeaways / interview Q&A

**Q: Why is "schema-on-read" a defining trait of document databases?**
A: Because the database doesn't enforce a fixed structure at write time (schema-on-write, as relational tables do) — each document can have its own shape, and the application interprets/validates structure when it reads the data.

**Q: What's the single clearest test to distinguish a document database from a key-value store?**
A: Can the database query and index *fields inside* the stored value? If yes (e.g., filter by a nested `addresses.city`), it's a document store; if the value is opaque and only retrievable whole by its key, it's a key-value store.
$dby10435$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10436$dbms_sql_tutorial_seed$dby10436$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10437$dbms_sql_tutorial_seed$dby10437$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10438$dbms-sql-tutorial$dby10438$),
     t as (select id from public.learning_topics where source_kind = $dby10439$dbms_sql_tutorial$dby10439$ and source_ref = $dby10440$chapter-3-data-models/document-model$dby10440$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10441$pt-dbms-sql-3-document-model$dby10441$, $dby10442$Document Model - Quick Test$dby10442$, 'aptitude', 8, 8,
  $dby10443$8 questions on Document Model.$dby10443$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10444$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10444$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10445$tq-dbms-sql-3-document-model-1$dby10445$, $dby10446$pt-dbms-sql-3-document-model$dby10446$,
   $dby10447$What is the defining storage unit of the document model?$dby10447$,
   $dby10448$["A fixed-schema table row", "A self-contained, semi-structured document (e.g., JSON/BSON) that can nest objects and arrays", "An opaque binary blob addressable only by key", "A wide sparse column family"]$dby10448$::jsonb,
   1, $dby10449$Document databases store data as self-contained documents, typically JSON or BSON, which can include nested objects and arrays.$dby10449$, 1, 0),
  ($dby10450$tq-dbms-sql-3-document-model-2$dby10450$, $dby10451$pt-dbms-sql-3-document-model$dby10451$,
   $dby10452$What does 'schema-on-read' mean in the context of document databases?$dby10452$,
   $dby10453$["The schema is enforced strictly at write time by the database", "Documents in the same collection are not required to share an identical structure; the application interprets structure when reading", "Every document must be validated against a fixed schema before insertion", "Reads are not permitted until a schema is defined"]$dby10453$::jsonb,
   1, $dby10454$Schema-on-read means the database does not enforce a rigid structure at write time; different documents in a collection can have different shapes, with structure interpreted at read/query time.$dby10454$, 1, 1),
  ($dby10455$tq-dbms-sql-3-document-model-3$dby10455$, $dby10456$pt-dbms-sql-3-document-model$dby10456$,
   $dby10457$Which of these databases is a well-known document-model implementation?$dby10457$,
   $dby10458$["MongoDB", "Redis", "Cassandra", "Neo4j"]$dby10458$::jsonb,
   0, $dby10459$MongoDB is one of the most widely used document databases, storing data as BSON documents.$dby10459$, 1, 2),
  ($dby10460$tq-dbms-sql-3-document-model-4$dby10460$, $dby10461$pt-dbms-sql-3-document-model$dby10461$,
   $dby10462$What is the clearest distinguishing test between a document database and a key-value store?$dby10462$,
   $dby10463$["Whether the database uses a network connection", "Whether the database can query and index fields inside the stored value, not just retrieve it whole by key", "Whether the database supports replication", "Whether the database is open source"]$dby10463$::jsonb,
   1, $dby10464$A key-value store treats its value as an opaque blob; a document store understands and can query the internal structure of the document.$dby10464$, 1, 3),
  ($dby10465$tq-dbms-sql-3-document-model-5$dby10465$, $dby10466$pt-dbms-sql-3-document-model$dby10466$,
   $dby10467$In the example user document with an embedded 'addresses' array, why is this considered denormalization compared to a relational design?$dby10467$,
   $dby10468$["Because arrays are not allowed in relational databases", "Because data that would normally be split into a separate 'addresses' table is embedded directly inside the parent document", "Because the document has no _id field", "Because JSON cannot represent arrays"]$dby10468$::jsonb,
   1, $dby10469$In a relational design, addresses would typically live in a separate normalized table joined by a foreign key; the document model embeds them directly in the same document.$dby10469$, 1, 4),
  ($dby10470$tq-dbms-sql-3-document-model-6$dby10470$, $dby10471$pt-dbms-sql-3-document-model$dby10471$,
   $dby10472$What is a key trade-off of embedding denormalized data (like duplicated address info) across many documents?$dby10472$,
   $dby10473$["There are no trade-offs; it is strictly better", "Updating a piece of duplicated data requires updating every document copy, risking inconsistency", "It makes single-document reads slower", "It requires a JOIN operation for every query"]$dby10473$::jsonb,
   1, $dby10474$Because data is duplicated across documents rather than normalized once, updates must be propagated to every copy, which can introduce inconsistency if missed.$dby10474$, 1, 5),
  ($dby10475$tq-dbms-sql-3-document-model-7$dby10475$, $dby10476$pt-dbms-sql-3-document-model$dby10476$,
   $dby10477$How does a document database differ from a column-family database like Cassandra?$dby10477$,
   $dby10478$["They are functionally identical", "Document stores optimize for flexible, deeply nested JSON-like data, while column-family stores organize sparse columns grouped into families optimized for very high write throughput at massive scale", "Column-family databases cannot store more than one row", "Document databases cannot be distributed across servers"]$dby10478$::jsonb,
   1, $dby10479$Column-family stores like Cassandra structure data around static column families for extreme write scalability, whereas document stores focus on flexible nested structures resembling application objects.$dby10479$, 1, 6),
  ($dby10480$tq-dbms-sql-3-document-model-8$dby10480$, $dby10481$pt-dbms-sql-3-document-model$dby10481$,
   $dby10482$As of MongoDB 4.0+, what transactional capability was added beyond the model's natural single-document atomicity?$dby10482$,
   $dby10483$["Multi-document ACID transactions", "Support for SQL joins across collections", "Automatic schema enforcement", "Elimination of the _id field"]$dby10483$::jsonb,
   0, $dby10484$MongoDB introduced multi-document ACID transactions starting in version 4.0, though single-document atomicity remains the model's natural strength.$dby10484$, 1, 7)
on conflict (id) do nothing;

-- 3.7 Key Value Model
with g as (select id from public.learning_grids where lower(slug) = $dby10485$dbms-sql-tutorial$dby10485$),
     s as (select id from public.learning_sections where lower(slug) = $dby10486$chapter-3-data-models$dby10486$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10487$Key Value Model$dby10487$, $dby10488$key-value-model$dby10488$, '', 7, 'published', true, true, $dby10489$dbms_sql_tutorial$dby10489$, $dby10490$chapter-3-data-models/key-value-model$dby10490$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10491$dbms_sql_tutorial$dby10491$ and source_ref = $dby10492$chapter-3-data-models/key-value-model$dby10492$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10493$Key Value Model$dby10493$, $dby10494$### Overview

The key-value model is the **simplest possible data model**: every piece of data is stored as a pair — a unique **key** and an associated **value** — and the database treats the value as an **opaque blob** it does not interpret, parse, or query into. All you can do is `GET(key)`, `PUT(key, value)`, and `DELETE(key)`. This simplicity is precisely the point: it enables extremely fast, predictable, horizontally scalable performance. Classic implementations include **Redis**, **Amazon DynamoDB**, **Riak**, and **Memcached**.

### How it works — a worked example

A web application storing user session data in Redis:

```
SET session:abc123 "{ \"userId\": 42, \"loggedInAt\": 1694600000 }"
GET session:abc123
DEL session:abc123
EXPIRE session:abc123 3600
```

Even though the value happens to look like JSON here, **Redis has no idea and doesn't care** — to the database, it's just a string of bytes attached to the key `session:abc123`. You cannot ask Redis "give me all sessions where `userId = 42`" without scanning every key yourself; the database provides no index into the value's internal structure (Redis does offer richer types like hashes, lists, and sets as values, which blurs this slightly, but the *core* KV operations remain key-addressed, not content-queryable).

### Edge cases and trade-offs

- **O(1) lookups by design**: because access is always by exact key (typically backed by a hash table), key-value stores achieve extremely predictable, low-latency reads/writes — ideal for caching (Redis/Memcached) and session storage.
- **No secondary indexes on value content** (in the pure model): if you need to query "all users in Pune," a plain key-value store cannot do this without you maintaining your own secondary index structure manually — this is exactly the capability the document model adds.
- **Extremely horizontally scalable**: since there are no cross-key relationships or joins to maintain, keys can be partitioned (sharded) across many nodes trivially via consistent hashing — DynamoDB and Riak are built around this property for massive, low-latency, globally distributed workloads.
- **Value structure is entirely the application's responsibility**: if you store a value as JSON, YOU must parse it, validate it, and handle schema evolution — the database offers zero help, unlike a document store's native understanding of the value's shape.

### Differentiating from Document and Column-Family models

- **vs. Document (3.6)**: the defining line is queryability into the value. A document database can index and filter on nested fields inside the value (`WHERE addresses.city = 'Pune'`); a key-value store fundamentally cannot — you retrieve the *entire* value by key or nothing.
- **vs. Column-Family (3.8)**: column-family stores are also accessed by a row key, but the value isn't opaque — it's structured into named columns grouped into column families, and columns can be queried/scanned by name and range even though the value as a whole is still keyed. Key-value stores have no such internal column structure at all.

### Key takeaways / interview Q&A

**Q: Why are key-value stores the fastest NoSQL model for simple lookups?**
A: Because access is always a direct key lookup (O(1) via hashing) with no query planning, joins, or interpretation of the value's contents — the database does the absolute minimum work possible.

**Q: What is the biggest practical limitation of a pure key-value store?**
A: You cannot query by anything other than the exact key — no filtering, sorting, or searching on the value's internal fields without building your own secondary indexing scheme in the application.
$dby10494$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10495$dbms_sql_tutorial_seed$dby10495$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10496$dbms_sql_tutorial_seed$dby10496$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10497$dbms-sql-tutorial$dby10497$),
     t as (select id from public.learning_topics where source_kind = $dby10498$dbms_sql_tutorial$dby10498$ and source_ref = $dby10499$chapter-3-data-models/key-value-model$dby10499$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10500$pt-dbms-sql-3-key-value-model$dby10500$, $dby10501$Key Value Model - Quick Test$dby10501$, 'aptitude', 8, 8,
  $dby10502$8 questions on Key Value Model.$dby10502$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10503$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10503$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10504$tq-dbms-sql-3-key-value-model-1$dby10504$, $dby10505$pt-dbms-sql-3-key-value-model$dby10505$,
   $dby10506$What defines the key-value data model?$dby10506$,
   $dby10507$["Data is stored as tables with rows and columns", "Every piece of data is a key paired with an opaque value the database does not interpret", "Data is organized as nodes and edges", "Data is stored as nested JSON documents that are queryable by field"]$dby10507$::jsonb,
   1, $dby10508$The key-value model's core idea is a simple key-to-value mapping where the value is treated as an opaque blob, not parsed or queried by the database.$dby10508$, 1, 0),
  ($dby10509$tq-dbms-sql-3-key-value-model-2$dby10509$, $dby10510$pt-dbms-sql-3-key-value-model$dby10510$,
   $dby10511$Which of these operations is fundamental to a pure key-value store?$dby10511$,
   $dby10512$["JOIN two keys together", "GET(key), PUT(key, value), DELETE(key)", "SELECT * WHERE value.field = x", "CREATE TABLE"]$dby10512$::jsonb,
   1, $dby10513$Key-value stores expose a minimal API: get, put, and delete operations addressed by key.$dby10513$, 1, 1),
  ($dby10514$tq-dbms-sql-3-key-value-model-3$dby10514$, $dby10515$pt-dbms-sql-3-key-value-model$dby10515$,
   $dby10516$Which of these is a widely used key-value database?$dby10516$,
   $dby10517$["Redis", "Neo4j", "PostgreSQL", "Cassandra"]$dby10517$::jsonb,
   0, $dby10518$Redis is a classic key-value store commonly used for caching and session storage.$dby10518$, 1, 2),
  ($dby10519$tq-dbms-sql-3-key-value-model-4$dby10519$, $dby10520$pt-dbms-sql-3-key-value-model$dby10520$,
   $dby10521$Why do key-value stores achieve such fast, predictable lookup performance?$dby10521$,
   $dby10522$["They pre-compute all possible queries in advance", "Access is always by exact key (typically via hashing), avoiding query planning or joins", "They store all data in memory only", "They use a graph traversal algorithm"]$dby10522$::jsonb,
   1, $dby10523$Direct key-based lookup via a hash table gives O(1) predictable access with no need for query optimization or join processing.$dby10523$, 1, 3),
  ($dby10524$tq-dbms-sql-3-key-value-model-5$dby10524$, $dby10525$pt-dbms-sql-3-key-value-model$dby10525$,
   $dby10526$What is the biggest limitation of a pure key-value store compared to a document database?$dby10526$,
   $dby10527$["It cannot store any binary data", "It cannot query or index fields inside the value; only the exact key can be used to retrieve data", "It requires a fixed schema for every key", "It cannot scale horizontally"]$dby10527$::jsonb,
   1, $dby10528$A document database can query nested fields inside a value, while a pure key-value store can only fetch the entire value by its key.$dby10528$, 1, 4),
  ($dby10529$tq-dbms-sql-3-key-value-model-6$dby10529$, $dby10530$pt-dbms-sql-3-key-value-model$dby10530$,
   $dby10531$If a Redis value is stored as a JSON string, who is responsible for parsing and validating its structure?$dby10531$,
   $dby10532$["Redis parses and validates it automatically", "The application, since Redis treats the value as an opaque string regardless of its content", "The operating system", "The key itself encodes the schema"]$dby10532$::jsonb,
   1, $dby10533$Because the database does not interpret the value's contents, the application must handle parsing, validation, and schema evolution itself.$dby10533$, 1, 5),
  ($dby10534$tq-dbms-sql-3-key-value-model-7$dby10534$, $dby10535$pt-dbms-sql-3-key-value-model$dby10535$,
   $dby10536$Why are key-value stores like DynamoDB and Riak well suited to massive horizontal scaling?$dby10536$,
   $dby10537$["Because they enforce strict cross-key relationships that simplify sharding", "Because there are no cross-key relationships or joins to maintain, so keys can be partitioned across nodes via consistent hashing", "Because they only support a single server", "Because they require all data to fit on one machine"]$dby10537$::jsonb,
   1, $dby10538$The absence of joins or relationships between keys makes it trivial to distribute (shard) keys across many nodes using techniques like consistent hashing.$dby10538$, 1, 6),
  ($dby10539$tq-dbms-sql-3-key-value-model-8$dby10539$, $dby10540$pt-dbms-sql-3-key-value-model$dby10540$,
   $dby10541$How does a column-family store's value differ from a pure key-value store's value?$dby10541$,
   $dby10542$["They are identical opaque blobs in both models", "A column-family store's value is structured into named columns grouped into families that can be queried/scanned by name, unlike a key-value store's fully opaque value", "A key-value store's value can be queried by nested field but a column-family store's cannot", "Column-family stores do not use keys at all"]$dby10542$::jsonb,
   1, $dby10543$Column-family stores organize each row's value into named columns/families that support range and name-based access, whereas key-value stores treat the entire value as opaque.$dby10543$, 1, 7)
on conflict (id) do nothing;

-- 3.8 Column Family Model
with g as (select id from public.learning_grids where lower(slug) = $dby10544$dbms-sql-tutorial$dby10544$),
     s as (select id from public.learning_sections where lower(slug) = $dby10545$chapter-3-data-models$dby10545$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10546$Column Family Model$dby10546$, $dby10547$column-family-model$dby10547$, '', 8, 'published', true, true, $dby10548$dbms_sql_tutorial$dby10548$, $dby10549$chapter-3-data-models/column-family-model$dby10549$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10550$dbms_sql_tutorial$dby10550$ and source_ref = $dby10551$chapter-3-data-models/column-family-model$dby10551$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10552$Column Family Model$dby10552$, $dby10553$### Overview

The column-family (also called "wide-column") model organizes data into **rows identified by a row key**, where each row's data is grouped into **column families** — and critically, different rows can have **completely different sets of columns** within the same family (the model is inherently **sparse**). This design, pioneered by Google's **Bigtable** paper (2006) and implemented in **Apache Cassandra** and **Apache HBase**, is optimized for **very high write throughput and horizontal scalability** across massive, distributed clusters — think petabytes of data across hundreds of commodity nodes.

### How it works — a worked example

Consider sensor telemetry data in Cassandra, partitioned by sensor ID and time:

```
Row key: sensor-042
Column family "readings":
  2026-09-14T10:00 -> "22.5C"
  2026-09-14T10:05 -> "22.7C"
  2026-09-14T10:10 -> "22.6C"

Row key: sensor-099
Column family "readings":
  2026-09-14T09:00 -> "18.1C"
  (only one reading so far — a totally different set of columns than sensor-042)
```

Each row can have a wildly different number of columns (sensor-042 has three timestamped readings, sensor-099 has one) — there's no requirement that all rows share the same columns, unlike a relational table where every row has the same fixed set of columns (even if NULL). Cassandra's actual query model (CQL) looks SQL-like but is deliberately restricted: you must generally query by the partition/row key (and optionally a clustering column range), not by arbitrary predicates on any column, because the physical data layout is optimized around fast, sequential writes and range scans by key, not ad-hoc filtering.

### Edge cases and trade-offs

- **Write-optimized architecture**: Cassandra's log-structured merge-tree (LSM-tree) storage engine appends writes sequentially and compacts data in the background, giving it very high sustained write throughput — the reason it's a default choice for time-series, IoT telemetry, and logging/event data at huge scale.
- **No joins, limited ad-hoc queries by design**: you must design your table schema around your query patterns up front ("query-first design") — denormalizing and duplicating data across multiple tables shaped for each specific query is standard practice, a very different mindset from relational normalization.
- **Tunable consistency, not strict ACID by default**: Cassandra offers "eventual consistency" with tunable read/write consistency levels (e.g., `QUORUM`, `ONE`) rather than defaulting to the strict ACID guarantees of relational databases — trading strict consistency for availability and partition tolerance (see CAP theorem in 3.10).
- **Sparse columns save space at scale**: since rows don't need to declare unused columns as NULL (unlike relational tables), you avoid the storage overhead of millions of NULL cells when most rows only populate a handful of a family's possible columns.

### Differentiating from Document and Key-Value models

- **vs. Key-Value (3.7)**: a key-value store's value is a single opaque blob; a column-family row's value is internally structured into named, independently addressable columns that the database can scan and range-query by column name — a genuine intermediate point of structure.
- **vs. Document (3.6)**: document databases favor deeply nested, arbitrarily structured JSON optimized for flexible application-object modeling and read convenience; column-family stores favor a flatter, wide-row structure explicitly optimized for massive write throughput and horizontal scale, with queries deliberately restricted to key-based/range access rather than free-form nested-field filtering.

### Key takeaways / interview Q&A

**Q: Why is the column-family model described as "sparse"?**
A: Because different rows in the same table/column-family can have entirely different sets of populated columns — there's no requirement (or storage cost) for declaring columns a row doesn't use, unlike relational tables where every row has the same fixed columns.

**Q: Why does Cassandra require "query-first" schema design instead of normalization?**
A: Because its storage engine and query model are optimized for fast key/range-based access, not arbitrary joins — so you must denormalize and design a table per query pattern up front rather than normalizing data and joining at query time.
$dby10553$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10554$dbms_sql_tutorial_seed$dby10554$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10555$dbms_sql_tutorial_seed$dby10555$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10556$dbms-sql-tutorial$dby10556$),
     t as (select id from public.learning_topics where source_kind = $dby10557$dbms_sql_tutorial$dby10557$ and source_ref = $dby10558$chapter-3-data-models/column-family-model$dby10558$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10559$pt-dbms-sql-3-column-family-model$dby10559$, $dby10560$Column Family Model - Quick Test$dby10560$, 'aptitude', 8, 8,
  $dby10561$8 questions on Column Family Model.$dby10561$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10562$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10562$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10563$tq-dbms-sql-3-column-family-model-1$dby10563$, $dby10564$pt-dbms-sql-3-column-family-model$dby10564$,
   $dby10565$What is the fundamental organizing structure of the column-family model?$dby10565$,
   $dby10566$["Rows identified by a row key, with columns grouped into families, where different rows can have different sets of populated columns", "A fixed schema table where every row has identical columns", "Nodes connected by labeled edges", "A single opaque value per key"]$dby10566$::jsonb,
   0, $dby10567$Column-family databases organize data as rows (keyed by a row key) whose columns are grouped into families, and rows are sparse — they need not share the same columns.$dby10567$, 1, 0),
  ($dby10568$tq-dbms-sql-3-column-family-model-2$dby10568$, $dby10569$pt-dbms-sql-3-column-family-model$dby10569$,
   $dby10570$Which research paper/system pioneered the column-family (wide-column) model?$dby10570$,
   $dby10571$["Google's Bigtable", "IBM's IMS", "CODASYL's network model spec", "Codd's relational model paper"]$dby10571$::jsonb,
   0, $dby10572$Google's 2006 Bigtable paper introduced the wide-column storage design later implemented in systems like Cassandra and HBase.$dby10572$, 1, 1),
  ($dby10573$tq-dbms-sql-3-column-family-model-3$dby10573$, $dby10574$pt-dbms-sql-3-column-family-model$dby10574$,
   $dby10575$What does it mean for the column-family model to be 'sparse'?$dby10575$,
   $dby10576$["It stores very little data overall", "Different rows can have entirely different sets of populated columns, with no need to store unused columns as NULL", "Only one column family is allowed per database", "Rows cannot contain more than one column"]$dby10576$::jsonb,
   1, $dby10577$Sparseness means rows aren't required to share identical columns; a row simply omits columns it doesn't use, avoiding the overhead of storing NULLs.$dby10577$, 1, 2),
  ($dby10578$tq-dbms-sql-3-column-family-model-4$dby10578$, $dby10579$pt-dbms-sql-3-column-family-model$dby10579$,
   $dby10580$Which of these systems is a widely used column-family database?$dby10580$,
   $dby10581$["Apache Cassandra", "Redis", "Neo4j", "MongoDB"]$dby10581$::jsonb,
   0, $dby10582$Apache Cassandra, along with Apache HBase, is a well-known column-family (wide-column) database implementing Bigtable-style concepts.$dby10582$, 1, 3),
  ($dby10583$tq-dbms-sql-3-column-family-model-5$dby10583$, $dby10584$pt-dbms-sql-3-column-family-model$dby10584$,
   $dby10585$Why is Cassandra typically queried by partition/row key rather than arbitrary column predicates?$dby10585$,
   $dby10586$["Because Cassandra has no query language at all", "Because its storage engine and physical data layout are optimized for fast key-based/range access, requiring query-first schema design", "Because arbitrary predicates are faster than key-based lookups in Cassandra", "Because Cassandra enforces strict relational normalization"]$dby10586$::jsonb,
   1, $dby10587$Cassandra's architecture is optimized around efficient key/range access; ad-hoc filtering on arbitrary columns isn't efficient, so schemas are designed per query pattern (denormalized) rather than normalized.$dby10587$, 1, 4),
  ($dby10588$tq-dbms-sql-3-column-family-model-6$dby10588$, $dby10589$pt-dbms-sql-3-column-family-model$dby10589$,
   $dby10590$What consistency model does Cassandra typically offer by default, in contrast to strict relational ACID guarantees?$dby10590$,
   $dby10591$["Strict serializability with no configuration options", "Tunable eventual consistency with configurable levels like QUORUM or ONE", "No consistency guarantees whatsoever", "Full two-phase commit across all nodes for every write"]$dby10591$::jsonb,
   1, $dby10592$Cassandra offers tunable consistency levels (e.g., ONE, QUORUM, ALL) rather than defaulting to strict ACID transactions, trading strict consistency for availability and scale.$dby10592$, 1, 5),
  ($dby10593$tq-dbms-sql-3-column-family-model-7$dby10593$, $dby10594$pt-dbms-sql-3-column-family-model$dby10594$,
   $dby10595$How does a column-family row's value differ structurally from a key-value store's value?$dby10595$,
   $dby10596$["They are functionally identical opaque blobs", "A column-family row's value is internally structured into named, independently addressable columns that can be scanned by name/range, unlike a key-value store's fully opaque blob", "A key-value store's value supports nested JSON while column-family values do not", "Column-family stores do not use any key to identify rows"]$dby10596$::jsonb,
   1, $dby10597$Column-family values have internal named-column structure that the database can address and range-scan, which is a level of structure a pure key-value store's opaque blob lacks.$dby10597$, 1, 6),
  ($dby10598$tq-dbms-sql-3-column-family-model-8$dby10598$, $dby10599$pt-dbms-sql-3-column-family-model$dby10599$,
   $dby10600$Why is the column-family model well suited to time-series/IoT telemetry data, such as sensor readings keyed by sensor ID and timestamp?$dby10600$,
   $dby10601$["Because it enforces a fixed schema across all sensors", "Because its LSM-tree-based storage engine gives very high sustained write throughput and rows can sparsely accumulate timestamped columns as new readings arrive", "Because it requires normalizing readings into a separate join table", "Because it does not support horizontal scaling"]$dby10601$::jsonb,
   1, $dby10602$The LSM-tree write path gives high write throughput, and sparse rows let each sensor accumulate only the timestamped columns it actually has readings for.$dby10602$, 1, 7)
on conflict (id) do nothing;

-- 3.9 Graph Model
with g as (select id from public.learning_grids where lower(slug) = $dby10603$dbms-sql-tutorial$dby10603$),
     s as (select id from public.learning_sections where lower(slug) = $dby10604$chapter-3-data-models$dby10604$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10605$Graph Model$dby10605$, $dby10606$graph-model$dby10606$, '', 9, 'published', true, true, $dby10607$dbms_sql_tutorial$dby10607$, $dby10608$chapter-3-data-models/graph-model$dby10608$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10609$dbms_sql_tutorial$dby10609$ and source_ref = $dby10610$chapter-3-data-models/graph-model$dby10610$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10611$Graph Model$dby10611$, $dby10612$### Overview

The graph data model represents data as **nodes (vertices)** and **edges (relationships)** connecting them, where both nodes and edges can carry their own **properties** (this specific variant is called a **property graph**, the model used by **Neo4j**, Amazon Neptune, and others). Unlike every other model in this chapter, relationships here are treated as **first-class citizens** with equal importance to the entities they connect — not an afterthought expressed via foreign keys or embedding.

### How it works — a worked example

A social network fragment:

```
(Alice:Person {age: 29}) -[:FRIENDS_WITH {since: 2019}]-> (Bob:Person {age: 31})
(Bob:Person) -[:FRIENDS_WITH {since: 2021}]-> (Carol:Person {age: 27})
(Alice:Person) -[:WORKS_AT]-> (Acme:Company {industry: "Tech"})
```

To find "friends of Alice's friends who don't already know Alice" (a classic recommendation query), Neo4j's **Cypher** query language expresses it declaratively and efficiently:

```cypher
MATCH (a:Person {name:"Alice"})-[:FRIENDS_WITH]->()-[:FRIENDS_WITH]->(fof)
WHERE NOT (a)-[:FRIENDS_WITH]->(fof) AND fof <> a
RETURN fof
```

The key architectural reason this is fast is **index-free adjacency**: each node physically stores direct pointers to its adjacent edges, so traversing "friend of a friend" is a constant-time pointer hop per edge, regardless of total database size — a relational database would need an expensive multi-way self-join on a `friendships` table that gets slower as the table grows.

### Edge cases and trade-offs

- **Multi-hop traversals are the graph model's superpower**: queries like "shortest path between two people," "friend of a friend of a friend" (arbitrary-depth traversal), or fraud-ring detection (cycles of suspicious transactions) are natural and fast in a graph database but require increasingly expensive recursive joins in a relational database.
- **Poor fit for simple aggregate/tabular reporting**: "total sales per region last quarter" is a trivial `GROUP BY` in SQL but awkward and unnatural to express as a graph traversal — graph databases are not a general replacement for OLAP-style rollups.
- **Schema flexibility**: new node labels, relationship types, and properties can be added at any time without a migration, similar to the document model's flexibility, but structured around connections rather than nested documents.
- **Scaling graph databases horizontally is genuinely harder** than scaling key-value or column-family stores, because a highly interconnected graph resists clean partitioning (a "cut" across the graph inevitably severs some edges, forcing cross-node traversal); this is an active area of engineering trade-offs.

### How this differs from the legacy Network Model (3.2)

Both use "nodes and connections," but they are not the same thing:
- The **network model** (CODASYL, 1970s) requires relationships ("sets") to be **predefined in a rigid schema** and traversed with **procedural DML code** written by the programmer.
- The **modern graph model** (property graphs) lets you add new relationship *types* on the fly with no schema migration, and is queried with a **declarative** language (Cypher, Gremlin) where you describe the pattern you want matched, not the step-by-step pointer-chasing to get there — plus it natively attaches properties to both nodes and edges, which CODASYL sets do not support.

### Key takeaways / interview Q&A

**Q: What is "index-free adjacency" and why does it matter?**
A: Each node stores direct references to its connected edges/nodes, so traversing a relationship is a cheap, constant-time pointer hop rather than an index lookup or join — this is what makes multi-hop graph traversals fast regardless of overall database size.

**Q: When would you explicitly choose a graph database over a relational database?**
A: When the core value of your queries comes from traversing relationships of variable/unknown depth — social networks, recommendation engines, fraud detection, knowledge graphs — rather than from tabular aggregation or simple lookups.
$dby10612$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10613$dbms_sql_tutorial_seed$dby10613$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10614$dbms_sql_tutorial_seed$dby10614$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10615$dbms-sql-tutorial$dby10615$),
     t as (select id from public.learning_topics where source_kind = $dby10616$dbms_sql_tutorial$dby10616$ and source_ref = $dby10617$chapter-3-data-models/graph-model$dby10617$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10618$pt-dbms-sql-3-graph-model$dby10618$, $dby10619$Graph Model - Quick Test$dby10619$, 'aptitude', 8, 8,
  $dby10620$8 questions on Graph Model.$dby10620$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10621$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10621$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10622$tq-dbms-sql-3-graph-model-1$dby10622$, $dby10623$pt-dbms-sql-3-graph-model$dby10623$,
   $dby10624$What are the two fundamental building blocks of the graph data model?$dby10624$,
   $dby10625$["Tables and rows", "Nodes (vertices) and edges (relationships)", "Documents and collections", "Keys and opaque values"]$dby10625$::jsonb,
   1, $dby10626$The graph model represents data as nodes (entities) connected by edges (relationships), both of which can carry properties in a property graph.$dby10626$, 1, 0),
  ($dby10627$tq-dbms-sql-3-graph-model-2$dby10627$, $dby10628$pt-dbms-sql-3-graph-model$dby10628$,
   $dby10629$What is a 'property graph', as implemented by databases like Neo4j?$dby10629$,
   $dby10630$["A graph where only nodes can have properties, never edges", "A graph model where both nodes and edges can carry their own key-value properties", "A graph stored entirely as a relational table", "A graph with no labels or types at all"]$dby10630$::jsonb,
   1, $dby10631$In a property graph, both nodes and relationships can have attached properties, unlike a plain mathematical graph with unlabeled edges.$dby10631$, 1, 1),
  ($dby10632$tq-dbms-sql-3-graph-model-3$dby10632$, $dby10633$pt-dbms-sql-3-graph-model$dby10633$,
   $dby10634$What architectural feature makes multi-hop graph traversals fast regardless of overall database size?$dby10634$,
   $dby10635$["Index-free adjacency, where each node stores direct pointers to its adjacent edges", "Full table scans optimized by the query planner", "Automatic denormalization of all connected data into one row", "In-memory caching of the entire dataset"]$dby10635$::jsonb,
   0, $dby10636$Index-free adjacency means traversing a relationship is a constant-time pointer hop rather than requiring an index lookup or join, keeping multi-hop traversals fast at any scale.$dby10636$, 1, 2),
  ($dby10637$tq-dbms-sql-3-graph-model-4$dby10637$, $dby10638$pt-dbms-sql-3-graph-model$dby10638$,
   $dby10639$Why would a query like 'friends of Alice's friends' become increasingly expensive in a relational database as the friendships table grows?$dby10639$,
   $dby10640$["Because relational databases cannot store friendship data", "Because it requires a multi-way self-join whose cost grows with table size, unlike a graph database's constant-time pointer hops per edge", "Because SQL cannot express WHERE clauses", "Because relational databases do not support recursive queries at all"]$dby10640$::jsonb,
   1, $dby10641$Relational databases must perform expensive self-joins to traverse relationships, and this cost scales with data size, whereas graph databases traverse via direct pointers.$dby10641$, 1, 3),
  ($dby10642$tq-dbms-sql-3-graph-model-5$dby10642$, $dby10643$pt-dbms-sql-3-graph-model$dby10643$,
   $dby10644$Which query language is commonly associated with Neo4j for declaratively describing graph patterns?$dby10644$,
   $dby10645$["Cypher", "OQL", "DL/I", "CQL"]$dby10645$::jsonb,
   0, $dby10646$Cypher is Neo4j's declarative graph query language, used to describe node/relationship patterns to match.$dby10646$, 1, 4),
  ($dby10647$tq-dbms-sql-3-graph-model-6$dby10647$, $dby10648$pt-dbms-sql-3-graph-model$dby10648$,
   $dby10649$For what type of query is the graph model generally a poor fit compared to a relational database?$dby10649$,
   $dby10650$["Multi-hop relationship traversal like friend-of-a-friend", "Shortest-path finding between two entities", "Simple tabular aggregation, such as total sales per region for a quarter", "Fraud-ring detection via cycles of transactions"]$dby10650$::jsonb,
   2, $dby10651$Simple GROUP BY-style aggregate reporting is trivial in SQL but awkward to express as a graph traversal; graph databases excel at relationship-heavy queries, not general OLAP rollups.$dby10651$, 1, 5),
  ($dby10652$tq-dbms-sql-3-graph-model-7$dby10652$, $dby10653$pt-dbms-sql-3-graph-model$dby10653$,
   $dby10654$How does the modern property graph model differ from the legacy CODASYL network model, despite both using 'nodes and connections'?$dby10654$,
   $dby10655$["They are functionally identical", "The network model requires relationships to be predefined as rigid schema 'sets' navigated procedurally, while the property graph model allows new relationship types at runtime and is queried declaratively", "The network model supports declarative queries while the graph model does not", "Property graphs cannot attach properties to relationships"]$dby10655$::jsonb,
   1, $dby10656$CODASYL's network model requires schema-defined sets navigated with procedural DML, whereas modern property graphs support flexible schema evolution and declarative pattern-matching query languages like Cypher.$dby10656$, 1, 6),
  ($dby10657$tq-dbms-sql-3-graph-model-8$dby10657$, $dby10658$pt-dbms-sql-3-graph-model$dby10658$,
   $dby10659$Why is horizontally scaling a graph database generally considered harder than scaling a key-value or column-family store?$dby10659$,
   $dby10660$["Graph databases cannot be distributed at all", "A highly interconnected graph resists clean partitioning, since any partition cut is likely to sever edges and force cross-node traversal", "Graph databases have no concept of nodes or edges to partition", "Key-value stores also cannot be partitioned, so the comparison is invalid"]$dby10660$::jsonb,
   1, $dby10661$Because graphs are highly interconnected, splitting them across nodes tends to cut across edges, requiring costly cross-partition traversal — unlike key-value/column-family data, which partitions cleanly by key.$dby10661$, 1, 7)
on conflict (id) do nothing;

-- 3.10 Relational vs NoSQL
with g as (select id from public.learning_grids where lower(slug) = $dby10662$dbms-sql-tutorial$dby10662$),
     s as (select id from public.learning_sections where lower(slug) = $dby10663$chapter-3-data-models$dby10663$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10664$Relational vs NoSQL$dby10664$, $dby10665$relational-vs-nosql$dby10665$, '', 10, 'published', true, true, $dby10666$dbms_sql_tutorial$dby10666$, $dby10667$chapter-3-data-models/relational-vs-nosql$dby10667$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10668$dbms_sql_tutorial$dby10668$ and source_ref = $dby10669$chapter-3-data-models/relational-vs-nosql$dby10669$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10670$Relational vs NoSQL$dby10670$, $dby10671$### Overview

"NoSQL" is an umbrella term (loosely: "Not Only SQL") covering every non-relational model in this chapter — document, key-value, column-family, and graph. There is no single NoSQL model; the real comparison is **relational databases vs. this whole family of alternatives**, each of which made different trade-offs to solve problems relational databases handle less well at extreme scale or with rapidly evolving, semi-structured data.

### The core dimensions of comparison

**Schema.** Relational databases are **schema-on-write**: the table structure is defined and enforced before you insert data, and changing it later requires a migration (`ALTER TABLE`). Most NoSQL models are **schema-on-read** (particularly document stores): structure is flexible at write time, and the application interprets/validates shape when reading — great for rapid iteration, riskier for data integrity guarantees.

**Consistency model.** Relational databases default to strict **ACID** transactions (Atomicity, Consistency, Isolation, Durability) — a write either fully commits with all its guarantees or doesn't happen at all, and once committed, every subsequent read sees it. Many distributed NoSQL databases instead favor **BASE** (Basically Available, Soft state, Eventual consistency) — a deliberate trade where the system stays available and responsive even during network partitions, at the cost of readers possibly seeing slightly stale data for a short window.

**The CAP theorem** formalizes why this trade exists: in a distributed system experiencing a network **P**artition, you must choose between **C**onsistency (every node sees the same data) and **A**vailability (every request gets a response) — you cannot have both during the partition. Relational databases (traditionally single-node or tightly-coupled clusters) tend to prioritize consistency; many NoSQL systems (Cassandra, DynamoDB) are explicitly engineered to prioritize availability and tune consistency as a dial (e.g., Cassandra's `QUORUM` level), not a fixed guarantee.

**Scaling direction.** Relational databases traditionally scale **vertically** (a bigger, more powerful single server) because joins and ACID transactions across a normalized schema are hard to distribute correctly. NoSQL models were largely designed from day one for **horizontal scaling** — sharding data by key across many commodity servers — which is why Cassandra, DynamoDB, and MongoDB can absorb petabyte-scale, globally distributed workloads more naturally.

**Query power vs. flexibility trade-off.** SQL gives you a mature, declarative, ad-hoc query language that can join arbitrary tables and aggregate flexibly — a huge advantage for evolving business-intelligence needs. NoSQL databases generally trade away some of that ad-hoc query flexibility (Cassandra's query-first schema design, key-value's key-only access) in exchange for predictable performance at scale.

### When to choose which

- **Choose relational** when you need strong consistency guarantees and complex, evolving ad-hoc queries across normalized relationships (banking ledgers, ERP systems, most transactional business applications).
- **Choose document** for flexible, application-object-shaped data with moderate scale needs (content management, product catalogs).
- **Choose key-value** for simple, extremely fast lookups (caching, session stores).
- **Choose column-family** for massive write throughput and time-series/event data (IoT telemetry, logging at petabyte scale).
- **Choose graph** when relationships/traversals are the primary query pattern (social networks, fraud detection, recommendations).

### Key takeaways / interview Q&A

**Q: Does "NoSQL" mean a database can't use SQL-like syntax at all?**
A: No — it's an umbrella term for non-relational data models; some NoSQL systems (like Cassandra's CQL) even offer SQL-like syntax, but the underlying data model and consistency guarantees are what actually differ from relational databases.

**Q: Per the CAP theorem, why can't a distributed database guarantee both perfect consistency and 100% availability?**
A: Because during a network partition, a node cut off from its peers must either refuse to answer (sacrificing availability) to avoid returning possibly stale data, or answer anyway with whatever it has locally (sacrificing strict consistency) — it cannot do both simultaneously while the partition persists.
$dby10671$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10672$dbms_sql_tutorial_seed$dby10672$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10673$dbms_sql_tutorial_seed$dby10673$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10674$dbms-sql-tutorial$dby10674$),
     t as (select id from public.learning_topics where source_kind = $dby10675$dbms_sql_tutorial$dby10675$ and source_ref = $dby10676$chapter-3-data-models/relational-vs-nosql$dby10676$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10677$pt-dbms-sql-3-relational-vs-nosql$dby10677$, $dby10678$Relational vs NoSQL - Quick Test$dby10678$, 'aptitude', 8, 8,
  $dby10679$8 questions on Relational vs NoSQL.$dby10679$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10680$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10680$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10681$tq-dbms-sql-3-relational-vs-nosql-1$dby10681$, $dby10682$pt-dbms-sql-3-relational-vs-nosql$dby10682$,
   $dby10683$What does the term 'NoSQL' most accurately refer to?$dby10683$,
   $dby10684$["A single specific database product", "An umbrella term for the family of non-relational data models: document, key-value, column-family, and graph", "A query language that replaced SQL entirely", "A model that only stores numeric data"]$dby10684$::jsonb,
   1, $dby10685$NoSQL is not one model but an umbrella covering multiple distinct non-relational paradigms, each with different trade-offs.$dby10685$, 1, 0),
  ($dby10686$tq-dbms-sql-3-relational-vs-nosql-2$dby10686$, $dby10687$pt-dbms-sql-3-relational-vs-nosql$dby10687$,
   $dby10688$What does 'schema-on-write' mean, as typically practiced by relational databases?$dby10688$,
   $dby10689$["The schema is only checked when data is read", "The table structure is defined and enforced before data is inserted", "There is no schema at all", "Schema changes never require a migration"]$dby10689$::jsonb,
   1, $dby10690$Schema-on-write means the structure must be defined and validated at write/insert time, contrasting with schema-on-read used by many NoSQL document stores.$dby10690$, 1, 1),
  ($dby10691$tq-dbms-sql-3-relational-vs-nosql-3$dby10691$, $dby10692$pt-dbms-sql-3-relational-vs-nosql$dby10692$,
   $dby10693$What does the BASE consistency model (often associated with distributed NoSQL systems) stand for?$dby10693$,
   $dby10694$["Basically Available, Soft state, Eventual consistency", "Binary Atomic Strict Execution", "Backup Available, Synchronized, Encrypted", "Batch Access, Single Endpoint"]$dby10694$::jsonb,
   0, $dby10695$BASE stands for Basically Available, Soft state, Eventual consistency — a deliberate trade favoring availability over the strict guarantees of ACID.$dby10695$, 1, 2),
  ($dby10696$tq-dbms-sql-3-relational-vs-nosql-4$dby10696$, $dby10697$pt-dbms-sql-3-relational-vs-nosql$dby10697$,
   $dby10698$According to the CAP theorem, what must a distributed system choose between when a network partition occurs?$dby10698$,
   $dby10699$["Consistency and Availability", "Cost and Performance", "Schema and Storage", "Security and Speed"]$dby10699$::jsonb,
   0, $dby10700$CAP theorem states that during a network partition, a distributed system must choose between Consistency (all nodes see the same data) and Availability (every request gets a response) — it cannot guarantee both.$dby10700$, 1, 3),
  ($dby10701$tq-dbms-sql-3-relational-vs-nosql-5$dby10701$, $dby10702$pt-dbms-sql-3-relational-vs-nosql$dby10702$,
   $dby10703$Why do relational databases traditionally scale vertically rather than horizontally?$dby10703$,
   $dby10704$["Because SQL cannot run on multiple servers under any circumstances", "Because joins and ACID transactions across a normalized schema are hard to distribute correctly across many independent nodes", "Because relational databases are always faster on a single machine regardless of workload", "Because horizontal scaling was not invented until after SQL"]$dby10704$::jsonb,
   1, $dby10705$Maintaining ACID guarantees and efficient joins across a normalized schema is difficult to distribute cleanly, which historically pushed relational systems toward scaling up rather than out.$dby10705$, 1, 4),
  ($dby10706$tq-dbms-sql-3-relational-vs-nosql-6$dby10706$, $dby10707$pt-dbms-sql-3-relational-vs-nosql$dby10707$,
   $dby10708$Which of the following is a scenario where a relational database is generally the better choice over NoSQL alternatives?$dby10708$,
   $dby10709$["Petabyte-scale IoT sensor telemetry ingestion", "A banking ledger requiring strong ACID consistency and complex ad-hoc joins", "A simple session cache needing sub-millisecond key lookups", "A social network requiring deep friend-of-friend traversal"]$dby10709$::jsonb,
   1, $dby10710$Banking ledgers need strong consistency and support complex evolving queries across normalized data, which plays to the relational model's strengths.$dby10710$, 1, 5),
  ($dby10711$tq-dbms-sql-3-relational-vs-nosql-7$dby10711$, $dby10712$pt-dbms-sql-3-relational-vs-nosql$dby10712$,
   $dby10713$Does a NoSQL system like Cassandra's CQL using SQL-like syntax mean it behaves like a relational database?$dby10713$,
   $dby10714$["Yes, CQL syntax guarantees identical consistency and query capabilities to SQL", "No \u2014 the underlying data model (column-family) and consistency guarantees (tunable, often eventual) still differ fundamentally from a relational database, regardless of syntax similarity", "Yes, because CQL supports arbitrary multi-table joins just like SQL", "No, because CQL cannot filter data at all"]$dby10714$::jsonb,
   1, $dby10715$Syntax resemblance does not change the underlying architecture; Cassandra's column-family model and tunable/eventual consistency remain fundamentally different from relational ACID semantics.$dby10715$, 1, 6),
  ($dby10716$tq-dbms-sql-3-relational-vs-nosql-8$dby10716$, $dby10717$pt-dbms-sql-3-relational-vs-nosql$dby10717$,
   $dby10718$Which database model would be the best fit for an application whose primary need is massive write throughput for time-series IoT sensor data?$dby10718$,
   $dby10719$["Column-family model", "Pure hierarchical model", "Object-oriented model", "Graph model"]$dby10719$::jsonb,
   0, $dby10720$Column-family stores like Cassandra are specifically optimized for very high write throughput and horizontal scale, making them well suited to time-series/IoT telemetry.$dby10720$, 1, 7)
on conflict (id) do nothing;

-- 3.11 Polyglot Persistence
with g as (select id from public.learning_grids where lower(slug) = $dby10721$dbms-sql-tutorial$dby10721$),
     s as (select id from public.learning_sections where lower(slug) = $dby10722$chapter-3-data-models$dby10722$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10723$Polyglot Persistence$dby10723$, $dby10724$polyglot-persistence$dby10724$, '', 11, 'published', true, true, $dby10725$dbms_sql_tutorial$dby10725$, $dby10726$chapter-3-data-models/polyglot-persistence$dby10726$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10727$dbms_sql_tutorial$dby10727$ and source_ref = $dby10728$chapter-3-data-models/polyglot-persistence$dby10728$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10729$Polyglot Persistence$dby10729$, $dby10730$### Overview

**Polyglot persistence** is the architectural practice of using **multiple different data models/databases within a single application**, each chosen specifically because it is the best fit for one part of the system's workload — rather than forcing every kind of data into one "one-size-fits-all" database. The term draws an analogy to "polyglot programming" (using different programming languages for different parts of a system). This is a natural consequence of everything covered earlier in this chapter: once you accept that relational, document, key-value, column-family, and graph models each have genuine, different strengths (3.10), the logical architectural conclusion is to use several of them together.

### How it works — a worked example

Consider a realistic e-commerce platform's backend, and notice how each choice maps directly back to a earlier section's strengths:

- **PostgreSQL (Relational, 3.3)** — orders, payments, inventory counts: needs ACID transactions so a payment and an inventory decrement either both succeed or both roll back together.
- **Redis (Key-Value, 3.7)** — session tokens and a "cart" cache: needs sub-millisecond GET/SET by session key, no complex querying required.
- **MongoDB (Document, 3.6)** — the product catalog: each product category has wildly different attributes (a laptop has RAM/CPU specs, a t-shirt has size/color) — a flexible schema avoids a table with hundreds of mostly-NULL columns.
- **Elasticsearch (a search-specialized, document-adjacent model)** — full-text product search with typo tolerance and relevance ranking, a query pattern relational `LIKE '%...%'` handles poorly at scale.
- **Neo4j (Graph, 3.9)** — the "customers who bought this also bought..." recommendation engine, which is fundamentally a multi-hop relationship traversal.
- **Cassandra (Column-Family, 3.8)** — clickstream/event logging at massive write volume for analytics, where write throughput matters far more than complex querying.

A single "add to cart, then checkout" user action might touch four or five of these systems in sequence — this is polyglot persistence in practice, not a theoretical idea.

### Edge cases and trade-offs

- **Operational complexity multiplies**: instead of one database to back up, monitor, secure, and scale, you now have five or six, each with its own operational runbook, failure modes, monitoring dashboards, and specialized on-call expertise required.
- **Cross-database consistency is genuinely hard**: if an order is written to PostgreSQL but the corresponding event fails to reach Cassandra, or the product catalog update in MongoDB doesn't propagate to Elasticsearch's search index, you get silent data drift between systems — since there's no single transaction spanning multiple different database engines. Teams handle this with patterns like the **outbox pattern**, change-data-capture (CDC) pipelines (e.g., Debezium), or event-driven architectures that asynchronously sync data across stores, accepting eventual consistency between them.
- **Team cognitive overhead**: developers need working knowledge of multiple query languages and data models (SQL, MongoDB's query API, Cypher, CQL) instead of just one, which raises onboarding cost and increases the chance of misusing a given database against its strengths.
- **Not free of cost — this must be justified per system**: polyglot persistence is a legitimate trade of operational complexity for fit-for-purpose performance/flexibility; a small application with modest scale needs is usually better served by one well-chosen relational (or single NoSQL) database rather than prematurely adopting five systems it doesn't yet need.

### Key takeaways / interview Q&A

**Q: What problem does polyglot persistence actually solve?**
A: It avoids forcing fundamentally different workloads (ACID transactions, full-text search, graph traversal, high-volume event logging, simple caching) into a single database whose design is a poor fit for most of them — trading a single point of operational simplicity for several fit-for-purpose systems.

**Q: What is the biggest engineering risk polyglot persistence introduces, and how is it typically mitigated?**
A: Cross-database consistency drift, since no single ACID transaction can span multiple different database engines; it's typically mitigated with asynchronous synchronization patterns like change-data-capture (CDC) pipelines or the outbox pattern, accepting eventual consistency between the systems involved.
$dby10730$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10731$dbms_sql_tutorial_seed$dby10731$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10732$dbms_sql_tutorial_seed$dby10732$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10733$dbms-sql-tutorial$dby10733$),
     t as (select id from public.learning_topics where source_kind = $dby10734$dbms_sql_tutorial$dby10734$ and source_ref = $dby10735$chapter-3-data-models/polyglot-persistence$dby10735$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10736$pt-dbms-sql-3-polyglot-persistence$dby10736$, $dby10737$Polyglot Persistence - Quick Test$dby10737$, 'aptitude', 8, 8,
  $dby10738$8 questions on Polyglot Persistence.$dby10738$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10739$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10739$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10740$tq-dbms-sql-3-polyglot-persistence-1$dby10740$, $dby10741$pt-dbms-sql-3-polyglot-persistence$dby10741$,
   $dby10742$What does the term 'polyglot persistence' describe?$dby10742$,
   $dby10743$["Using a single database that supports multiple query languages", "Using multiple different databases/data models within one application, each chosen for its best-fit workload", "Translating a database's stored data into multiple human languages", "Storing all data as plain text files"]$dby10743$::jsonb,
   1, $dby10744$Polyglot persistence means deliberately using several different databases/data models in one system, each matched to the part of the workload it handles best.$dby10744$, 1, 0),
  ($dby10745$tq-dbms-sql-3-polyglot-persistence-2$dby10745$, $dby10746$pt-dbms-sql-3-polyglot-persistence$dby10746$,
   $dby10747$In the e-commerce example, why would PostgreSQL (relational) be chosen for orders and payments rather than a document or key-value store?$dby10747$,
   $dby10748$["Because relational databases are always the cheapest option", "Because ACID transactions ensure a payment and an inventory decrement either both succeed or both roll back together", "Because PostgreSQL has the fastest raw key lookups of any database", "Because orders cannot be represented as rows and columns"]$dby10748$::jsonb,
   1, $dby10749$Financial operations like payments typically need strong ACID guarantees so related updates (payment + inventory) commit or fail together, which is the relational model's strength.$dby10749$, 1, 1),
  ($dby10750$tq-dbms-sql-3-polyglot-persistence-3$dby10750$, $dby10751$pt-dbms-sql-3-polyglot-persistence$dby10751$,
   $dby10752$Why might a product catalog with highly varied attributes across categories (laptops vs. t-shirts) be a good fit for a document database rather than a single relational table?$dby10752$,
   $dby10753$["Because document databases cannot store text", "Because the document model's flexible, per-document schema avoids a table with hundreds of mostly-NULL columns for attributes that don't apply to every product", "Because relational tables cannot store product names", "Because document databases automatically translate currencies"]$dby10753$::jsonb,
   1, $dby10754$Document databases allow each product document to have only the attributes relevant to it, avoiding the sparse, mostly-NULL columns a single rigid relational table would require.$dby10754$, 1, 2),
  ($dby10755$tq-dbms-sql-3-polyglot-persistence-4$dby10755$, $dby10756$pt-dbms-sql-3-polyglot-persistence$dby10756$,
   $dby10757$Why is a graph database like Neo4j a natural fit for a 'customers who bought this also bought...' recommendation feature?$dby10757$,
   $dby10758$["Because graph databases are the fastest at simple key lookups", "Because the feature is fundamentally a multi-hop relationship traversal, which graph databases handle efficiently via index-free adjacency", "Because graph databases enforce the strictest schema of any model", "Because recommendations require full-text search capability only"]$dby10758$::jsonb,
   1, $dby10759$Recommendation queries like this rely on traversing purchase/co-purchase relationships, which is exactly the graph model's core strength.$dby10759$, 1, 3),
  ($dby10760$tq-dbms-sql-3-polyglot-persistence-5$dby10760$, $dby10761$pt-dbms-sql-3-polyglot-persistence$dby10761$,
   $dby10762$What is the biggest engineering risk introduced by polyglot persistence?$dby10762$,
   $dby10763$["Databases becoming too fast for applications to handle", "Cross-database consistency drift, since no single ACID transaction can span multiple different database engines", "The complete inability to use SQL anywhere in the system", "Every database in the architecture must use the same query language"]$dby10763$::jsonb,
   1, $dby10764$Because different databases can't share a single transaction, an update succeeding in one store while failing to propagate to another can cause silent data drift.$dby10764$, 1, 4),
  ($dby10765$tq-dbms-sql-3-polyglot-persistence-6$dby10765$, $dby10766$pt-dbms-sql-3-polyglot-persistence$dby10766$,
   $dby10767$What is a common technique used to mitigate cross-database consistency drift in a polyglot persistence architecture?$dby10767$,
   $dby10768$["Disabling transactions entirely in all databases", "Change-data-capture (CDC) pipelines or the outbox pattern to asynchronously synchronize data across stores", "Storing all data redundantly in every database at all times", "Only allowing reads, never writes, in secondary databases"]$dby10768$::jsonb,
   1, $dby10769$CDC pipelines (e.g., Debezium) and the outbox pattern are standard patterns for asynchronously propagating changes across separate databases, accepting eventual consistency.$dby10769$, 1, 5),
  ($dby10770$tq-dbms-sql-3-polyglot-persistence-7$dby10770$, $dby10771$pt-dbms-sql-3-polyglot-persistence$dby10771$,
   $dby10772$What operational cost does polyglot persistence introduce compared to using a single database?$dby10772$,
   $dby10773$["None; it is always operationally simpler", "Multiple systems to back up, monitor, secure, and scale, each requiring its own specialized expertise", "The complete elimination of the need for monitoring", "A guaranteed reduction in team headcount"]$dby10773$::jsonb,
   1, $dby10774$Each additional database in a polyglot architecture adds its own operational burden: backups, monitoring, security, scaling, and specialized team knowledge.$dby10774$, 1, 6),
  ($dby10775$tq-dbms-sql-3-polyglot-persistence-8$dby10775$, $dby10776$pt-dbms-sql-3-polyglot-persistence$dby10776$,
   $dby10777$When is polyglot persistence generally NOT justified?$dby10777$,
   $dby10778$["When an application has massive, clearly distinct workloads like search, graph traversal, and high-volume logging", "For a small application with modest scale needs, where a single well-chosen database is usually simpler and sufficient", "When a company has dedicated database administration teams for each system", "When the application already needs ACID transactions"]$dby10778$::jsonb,
   1, $dby10779$For small or simple applications, the operational overhead of multiple databases usually outweighs the fit-for-purpose benefits; a single well-chosen database is typically the better trade-off.$dby10779$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 4: Relational Model
-- ---------------------------------------------------------------------------
-- 4.1 Relation
with g as (select id from public.learning_grids where lower(slug) = $dby10780$dbms-sql-tutorial$dby10780$),
     s as (select id from public.learning_sections where lower(slug) = $dby10781$chapter-4-relational-model$dby10781$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10782$Relation$dby10782$, $dby10783$relation$dby10783$, '', 1, 'published', true, true, $dby10784$dbms_sql_tutorial$dby10784$, $dby10785$chapter-4-relational-model/relation$dby10785$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10786$dbms_sql_tutorial$dby10786$ and source_ref = $dby10787$chapter-4-relational-model/relation$dby10787$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10788$Relation$dby10788$, $dby10789$### Definition
A **relation** is a set of tuples that conform to a **relation schema**. Formally, given a schema R(A1:D1, A2:D2, ..., An:Dn), a relation *r* on R is a finite subset of the Cartesian product D1 × D2 × ... × Dn. Because a relation is mathematically a **set**, it has two defining properties: no duplicate tuples, and no significance to the ordering of tuples.

### Example
Using the running-example schema `Students(id, name, department, gpa)`, one relation (a snapshot of data) might be the set:

`{ (1,Asha,CS,8.7), (2,Ravi,ECE,7.9), (3,Meera,CS,9.1), (4,Karan,ME,6.8) }`

This set of 4 tuples IS the relation on the Students schema at this moment.

### How this differs from "Relation Schema" and "Table"
- **Relation Schema** is the structure/blueprint (attribute names + domains) — fixed, like a class definition. A Relation is the actual data conforming to it — like an object/instance of that class.
- A SQL **table** is the practical implementation, but SQL tables may allow duplicate rows and have an implementation-defined physical row order, so a table is not a pure relation in the strict mathematical sense unless duplicates are prevented (e.g., a key constraint) and ordering is never relied upon.

### Edge Cases
- Two relations written with tuples listed in different orders are the *identical* relation — order carries no meaning.
- Inserting a tuple that is already present does not create a "new" relation — it's still the same set (though SQL would physically add a duplicate row unless a uniqueness constraint blocks it).
- The empty set (zero tuples) is a perfectly valid relation — it has zero cardinality, but its schema and degree still exist.

### Key Takeaways / Q&A
**Q: Is a relation the same as a table?**
A: Practically, yes, in everyday usage — but formally a relation is duplicate-free and unordered, while a SQL table is not guaranteed to be either unless constrained.

**Q: What determines whether two tuples belong to the same relation?**
A: They must conform to the same relation schema (same attributes, same domains).$dby10789$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10790$dbms_sql_tutorial_seed$dby10790$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10791$dbms_sql_tutorial_seed$dby10791$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10792$dbms-sql-tutorial$dby10792$),
     t as (select id from public.learning_topics where source_kind = $dby10793$dbms_sql_tutorial$dby10793$ and source_ref = $dby10794$chapter-4-relational-model/relation$dby10794$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10795$pt-dbms-sql-4-relation$dby10795$, $dby10796$Relation - Quick Test$dby10796$, 'aptitude', 8, 8,
  $dby10797$8 questions on Relation.$dby10797$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10798$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10798$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10799$tq-dbms-sql-4-relation-1$dby10799$, $dby10800$pt-dbms-sql-4-relation$dby10800$,
   $dby10801$Which of the following best defines a relation in the relational model?$dby10801$,
   $dby10802$["A named collection of columns and their data types", "A set of tuples conforming to a relation schema", "A physical file stored on disk", "An ordered list of rows with a fixed sequence"]$dby10802$::jsonb,
   1, $dby10803$A relation is formally a set of tuples that conform to a relation schema, i.e. a subset of the Cartesian product of the attribute domains.$dby10803$, 1, 0),
  ($dby10804$tq-dbms-sql-4-relation-2$dby10804$, $dby10805$pt-dbms-sql-4-relation$dby10805$,
   $dby10806$Because a relation is mathematically a set, which property must it have?$dby10806$,
   $dby10807$["Tuples must be sorted by primary key", "Duplicate tuples are not allowed", "Every attribute must be numeric", "Tuples must be stored contiguously on disk"]$dby10807$::jsonb,
   1, $dby10808$Sets cannot contain duplicate elements, so a strict relation cannot contain two identical tuples.$dby10808$, 1, 1),
  ($dby10809$tq-dbms-sql-4-relation-3$dby10809$, $dby10810$pt-dbms-sql-4-relation$dby10810$,
   $dby10811$In {(1,Asha,CS,8.7),(2,Ravi,ECE,7.9)}, does swapping the order of the two tuples produce a different relation?$dby10811$,
   $dby10812$["Yes, order defines a new relation", "No, because relations are unordered sets", "Only if the primary key changes", "Only in SQL, not in relational theory"]$dby10812$::jsonb,
   1, $dby10813$Tuple order has no significance in a relation since it is a set; reordering gives the same relation.$dby10813$, 1, 2),
  ($dby10814$tq-dbms-sql-4-relation-4$dby10814$, $dby10815$pt-dbms-sql-4-relation$dby10815$,
   $dby10816$What is the key structural difference between a relation and a relation schema?$dby10816$,
   $dby10817$["A relation schema stores data; a relation stores only names", "A relation is the actual data (a set of tuples); a relation schema is the structural blueprint", "There is no difference, the terms are interchangeable", "A relation schema can change every time a row is added"]$dby10817$::jsonb,
   1, $dby10818$The schema is the fixed structure (attributes/domains); the relation is the data instance conforming to it.$dby10818$, 1, 3),
  ($dby10819$tq-dbms-sql-4-relation-5$dby10819$, $dby10820$pt-dbms-sql-4-relation$dby10820$,
   $dby10821$Why is a plain SQL table not always a pure relation in the strict mathematical sense?$dby10821$,
   $dby10822$["SQL tables cannot have more than one attribute", "SQL tables may permit duplicate rows and have a physical row order", "SQL tables cannot store NULL values", "SQL tables always enforce set semantics automatically"]$dby10822$::jsonb,
   1, $dby10823$Unless a key/unique constraint is defined, SQL allows duplicate rows, and rows have a storage order — both violate pure set semantics.$dby10823$, 1, 4),
  ($dby10824$tq-dbms-sql-4-relation-6$dby10824$, $dby10825$pt-dbms-sql-4-relation$dby10825$,
   $dby10826$Is an empty set of tuples (zero rows) a valid relation on a given schema?$dby10826$,
   $dby10827$["No, a relation must contain at least one tuple", "Yes, a relation with zero tuples is valid; it simply has zero cardinality", "No, only after the first INSERT does a relation exist", "Yes, but only for schemas with a single attribute"]$dby10827$::jsonb,
   1, $dby10828$A relation with no tuples is a legitimate subset of the Cartesian product (the empty subset), so it is a valid relation.$dby10828$, 1, 5),
  ($dby10829$tq-dbms-sql-4-relation-7$dby10829$, $dby10830$pt-dbms-sql-4-relation$dby10830$,
   $dby10831$Attempting to insert a tuple that is an exact duplicate of an existing tuple into a strict relation:$dby10831$,
   $dby10832$["Always doubles the cardinality", "Does not change the relation, since sets cannot hold duplicate elements", "Automatically changes the relation schema", "Is impossible to represent conceptually"]$dby10832$::jsonb,
   1, $dby10833$Since a relation is a set, adding an element already present does not change the set at all.$dby10833$, 1, 6),
  ($dby10834$tq-dbms-sql-4-relation-8$dby10834$, $dby10835$pt-dbms-sql-4-relation$dby10835$,
   $dby10836$A relation r is formally defined as a subset of which construct?$dby10836$,
   $dby10837$["The union of all attribute names", "The Cartesian product of the attribute domains D1 x D2 x ... x Dn", "The intersection of all candidate keys", "The power set of the tuple count"]$dby10837$::jsonb,
   1, $dby10838$A relation is a finite subset of the Cartesian product of the domains of its attributes, as defined by its schema.$dby10838$, 1, 7)
on conflict (id) do nothing;

-- 4.2 Tuple
with g as (select id from public.learning_grids where lower(slug) = $dby10839$dbms-sql-tutorial$dby10839$),
     s as (select id from public.learning_sections where lower(slug) = $dby10840$chapter-4-relational-model$dby10840$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10841$Tuple$dby10841$, $dby10842$tuple$dby10842$, '', 2, 'published', true, true, $dby10843$dbms_sql_tutorial$dby10843$, $dby10844$chapter-4-relational-model/tuple$dby10844$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10845$dbms_sql_tutorial$dby10845$ and source_ref = $dby10846$chapter-4-relational-model/tuple$dby10846$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10847$Tuple$dby10847$, $dby10848$### Definition
A **tuple** is a single ordered n-tuple of values — one value per attribute of the relation's schema — representing one entity or fact within a relation. If the schema has degree n, every tuple in that relation is an n-tuple: (v1, v2, ..., vn) where each vi belongs to the domain Di of its attribute.

### Example
In `Students(id, name, department, gpa)`, the tuple `(3, Meera, CS, 9.1)` represents one student's data. The relation is the entire set of such tuples; a tuple is just one element (one row) of that set.

### How this differs from Relation / Attribute
- A **Relation** is the whole set of tuples; a **Tuple** is a single member of that set — the relationship is set-to-element, not two views of the same thing.
- An **Attribute** is a column name/role (e.g., "gpa"); a **Tuple** is a complete row of values spanning ALL attributes (e.g., 9.1 is the value the "gpa" attribute takes inside one specific tuple).

### Edge Cases
- Duplicate tuples are disallowed in a strict relation: `(3,Meera,CS,9.1)` can logically appear only once, no matter how many times an application tries to add it.
- A tuple containing NULLs, e.g. `(5, Ganesh, NULL, NULL)`, is still a single, well-formed tuple — but see *Null Values* for how NULLs complicate the "no duplicate tuples" guarantee.
- The order of tuples within a relation carries no meaning: `{(1,...),(2,...)}` and `{(2,...),(1,...)}` are the same relation.

### Key Takeaways / Q&A
**Q: How many values does one tuple hold?**
A: Exactly as many as the degree of the relation — one value per attribute.

**Q: Can two distinct tuples in the same relation have every corresponding value equal?**
A: No — if all values match, they are the same set element, meaning it is one tuple, not two.$dby10848$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10849$dbms_sql_tutorial_seed$dby10849$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10850$dbms_sql_tutorial_seed$dby10850$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10851$dbms-sql-tutorial$dby10851$),
     t as (select id from public.learning_topics where source_kind = $dby10852$dbms_sql_tutorial$dby10852$ and source_ref = $dby10853$chapter-4-relational-model/tuple$dby10853$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10854$pt-dbms-sql-4-tuple$dby10854$, $dby10855$Tuple - Quick Test$dby10855$, 'aptitude', 8, 8,
  $dby10856$8 questions on Tuple.$dby10856$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10857$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10857$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10858$tq-dbms-sql-4-tuple-1$dby10858$, $dby10859$pt-dbms-sql-4-tuple$dby10859$,
   $dby10860$What does a tuple represent within a relation?$dby10860$,
   $dby10861$["A single column definition", "One row: an ordered set of values, one per attribute, describing one entity/fact", "The name of the relation", "The total count of rows in the relation"]$dby10861$::jsonb,
   1, $dby10862$A tuple is one row of the relation, holding one value for each attribute in the schema.$dby10862$, 1, 0),
  ($dby10863$tq-dbms-sql-4-tuple-2$dby10863$, $dby10864$pt-dbms-sql-4-tuple$dby10864$,
   $dby10865$In Students(id, name, department, gpa), how many values does each tuple contain?$dby10865$,
   $dby10866$["1", "2", "4, one for each attribute", "It varies from tuple to tuple"]$dby10866$::jsonb,
   2, $dby10867$Every tuple in a relation has exactly as many values as the relation's degree (number of attributes) — here, 4.$dby10867$, 1, 1),
  ($dby10868$tq-dbms-sql-4-tuple-3$dby10868$, $dby10869$pt-dbms-sql-4-tuple$dby10869$,
   $dby10870$Which statement correctly distinguishes a Tuple from a Relation?$dby10870$,
   $dby10871$["A tuple is a whole table; a relation is one row", "A relation is the entire set of tuples; a tuple is one element (row) of that set", "They are exactly the same concept", "A tuple contains multiple relations"]$dby10871$::jsonb,
   1, $dby10872$A relation is the set; a tuple is a single member (row) belonging to that set.$dby10872$, 1, 2),
  ($dby10873$tq-dbms-sql-4-tuple-4$dby10873$, $dby10874$pt-dbms-sql-4-tuple$dby10874$,
   $dby10875$Can the same relation legally contain two tuples with identical values in every attribute?$dby10875$,
   $dby10876$["Yes, always", "No, because a relation is a set and cannot contain duplicate elements", "Only if the primary key is NULL", "Only for relations of degree 1"]$dby10876$::jsonb,
   1, $dby10877$Since a relation is a set, two tuples with identical values in every attribute would be the same set element, not two distinct tuples.$dby10877$, 1, 3),
  ($dby10878$tq-dbms-sql-4-tuple-5$dby10878$, $dby10879$pt-dbms-sql-4-tuple$dby10879$,
   $dby10880$In the tuple (3, Meera, CS, 9.1), what does the value 9.1 represent?$dby10880$,
   $dby10881$["The degree of the tuple", "The value the 'gpa' attribute takes for this specific tuple", "A separate relation", "The cardinality of the relation"]$dby10881$::jsonb,
   1, $dby10882$9.1 is simply the value bound to the 'gpa' attribute within this one tuple/row.$dby10882$, 1, 4),
  ($dby10883$tq-dbms-sql-4-tuple-6$dby10883$, $dby10884$pt-dbms-sql-4-tuple$dby10884$,
   $dby10885$Does the physical position of a tuple among other tuples in a relation carry logical meaning?$dby10885$,
   $dby10886$["Yes, tuple order determines its identity", "No, tuple order is meaningless since a relation is an unordered set", "Only for the first tuple inserted", "Only in relations with a primary key"]$dby10886$::jsonb,
   1, $dby10887$Because relations are sets, no ordering among tuples is logically significant.$dby10887$, 1, 5),
  ($dby10888$tq-dbms-sql-4-tuple-7$dby10888$, $dby10889$pt-dbms-sql-4-tuple$dby10889$,
   $dby10890$A tuple (5, Ganesh, NULL, NULL) is inserted into Students. Is this a valid single tuple?$dby10890$,
   $dby10891$["No, tuples cannot contain more than one NULL", "Yes, it is one well-formed tuple even though two of its values are NULL", "No, NULL values are not permitted in tuples at all", "Yes, but it counts as two tuples"]$dby10891$::jsonb,
   1, $dby10892$A tuple with NULLs in some positions is still a single, valid tuple; NULL merely marks missing values.$dby10892$, 1, 6),
  ($dby10893$tq-dbms-sql-4-tuple-8$dby10893$, $dby10894$pt-dbms-sql-4-tuple$dby10894$,
   $dby10895$If a relation's degree is n, what can you say about every tuple belonging to that relation?$dby10895$,
   $dby10896$["Each tuple has exactly n values, one per attribute", "Each tuple has at most n values", "Tuples may vary in size up to n", "n refers to the number of tuples, not values per tuple"]$dby10896$::jsonb,
   0, $dby10897$Degree fixes how many attributes the schema has, and every tuple must supply exactly that many values.$dby10897$, 1, 7)
on conflict (id) do nothing;

-- 4.3 Attribute
with g as (select id from public.learning_grids where lower(slug) = $dby10898$dbms-sql-tutorial$dby10898$),
     s as (select id from public.learning_sections where lower(slug) = $dby10899$chapter-4-relational-model$dby10899$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10900$Attribute$dby10900$, $dby10901$attribute$dby10901$, '', 3, 'published', true, true, $dby10902$dbms_sql_tutorial$dby10902$, $dby10903$chapter-4-relational-model/attribute$dby10903$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10904$dbms_sql_tutorial$dby10904$ and source_ref = $dby10905$chapter-4-relational-model/attribute$dby10905$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10906$Attribute$dby10906$, $dby10907$### Definition
An **attribute** is a named column or property of a relation schema — it labels a role that a domain of values plays within the relation. An attribute is not a value itself; it is the *name* (e.g., "gpa") bound to a domain of legal values and to one fixed position within every tuple of the relation.

### Example
`Students(id, name, department, gpa)` has 4 attributes: `id`, `name`, `department`, `gpa`. In the tuple `(3, Meera, CS, 9.1)`, the attribute `gpa` takes the value `9.1` for this particular tuple.

### How this differs from Tuple / Domain
- A **Tuple** is a full row of values; an **Attribute** is a single column/label shared by every tuple.
- A **Domain** is the set of legal values an attribute may take (e.g., gpa's domain could be decimal values in [0.0, 10.0]). The Attribute is the *name/role*; the Domain is the *pool of allowed values* behind it.

### Edge Cases
- Two different attributes can share the same domain — e.g., "advisor_id" and "id" might both draw from the integer-ID domain — yet remain distinct attributes with different meanings. This is exactly why foreign keys work: same domain, different attribute, deliberately linked.
- Attribute names must be unique *within one relation schema*, but the same name can be reused across different relations (e.g., "id" appears in both Students and Courses) without conflict.
- Renaming an attribute (the rename operator, ρ, in relational algebra) changes only the schema's labeling — the underlying values are untouched.

### Key Takeaways / Q&A
**Q: Is "gpa" a value or an attribute?**
A: It is an attribute name; `9.1` is the value that attribute holds in a given tuple.

**Q: Can an attribute's domain change without changing the relation schema?**
A: No — the domain is part of the schema definition for that attribute, so changing it (e.g., widening a numeric range) is itself a schema change.$dby10907$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10908$dbms_sql_tutorial_seed$dby10908$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10909$dbms_sql_tutorial_seed$dby10909$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10910$dbms-sql-tutorial$dby10910$),
     t as (select id from public.learning_topics where source_kind = $dby10911$dbms_sql_tutorial$dby10911$ and source_ref = $dby10912$chapter-4-relational-model/attribute$dby10912$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10913$pt-dbms-sql-4-attribute$dby10913$, $dby10914$Attribute - Quick Test$dby10914$, 'aptitude', 8, 8,
  $dby10915$8 questions on Attribute.$dby10915$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10916$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10916$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10917$tq-dbms-sql-4-attribute-1$dby10917$, $dby10918$pt-dbms-sql-4-attribute$dby10918$,
   $dby10919$What is an attribute in the relational model?$dby10919$,
   $dby10920$["A single row of data", "A named column of a relation schema, bound to a domain of legal values", "The total number of rows in a relation", "A synonym for 'relation'"]$dby10920$::jsonb,
   1, $dby10921$An attribute is a named property/column of the schema, not a data value or a row.$dby10921$, 1, 0),
  ($dby10922$tq-dbms-sql-4-attribute-2$dby10922$, $dby10923$pt-dbms-sql-4-attribute$dby10923$,
   $dby10924$How many attributes does Students(id, name, department, gpa) have?$dby10924$,
   $dby10925$["1", "2", "4", "It depends on the number of rows"]$dby10925$::jsonb,
   2, $dby10926$There are four named columns: id, name, department, gpa.$dby10926$, 1, 1),
  ($dby10927$tq-dbms-sql-4-attribute-3$dby10927$, $dby10928$pt-dbms-sql-4-attribute$dby10928$,
   $dby10929$In the tuple (3, Meera, CS, 9.1), what role does 'gpa' play with respect to the value 9.1?$dby10929$,
   $dby10930$["'gpa' is the tuple and 9.1 is the attribute", "'gpa' is the attribute name that holds the value 9.1 in this tuple", "'gpa' and 9.1 are both attributes", "'gpa' is a domain and 9.1 is a relation"]$dby10930$::jsonb,
   1, $dby10931$The attribute 'gpa' is the label; 9.1 is the actual value that attribute takes in this particular tuple.$dby10931$, 1, 2),
  ($dby10932$tq-dbms-sql-4-attribute-4$dby10932$, $dby10933$pt-dbms-sql-4-attribute$dby10933$,
   $dby10934$Which best distinguishes an Attribute from a Domain?$dby10934$,
   $dby10935$["An attribute is the named role/column; a domain is the pool of legal values it may take", "A domain is the row; an attribute is the table", "They are identical concepts with different names", "An attribute always has a larger set of values than its domain"]$dby10935$::jsonb,
   0, $dby10936$The attribute names a column; the domain defines what values are legally allowed for that column.$dby10936$, 1, 3),
  ($dby10937$tq-dbms-sql-4-attribute-5$dby10937$, $dby10938$pt-dbms-sql-4-attribute$dby10938$,
   $dby10939$Can two distinct attributes in different relations share the exact same name, such as 'id' in both Students and Courses?$dby10939$,
   $dby10940$["No, attribute names must be globally unique across the entire database", "Yes, attribute names only need to be unique within a single relation schema", "No, this would violate domain integrity", "Yes, but only if both relations have the same degree"]$dby10940$::jsonb,
   1, $dby10941$Uniqueness of attribute names is required only within one relation schema, not across the whole database.$dby10941$, 1, 4),
  ($dby10942$tq-dbms-sql-4-attribute-6$dby10942$, $dby10943$pt-dbms-sql-4-attribute$dby10943$,
   $dby10944$If 'id' (student id) and 'advisor_id' both draw from the integer domain, what does this illustrate?$dby10944$,
   $dby10945$["Two attributes can share a domain while remaining distinct, differently-named attributes", "They must actually be the same attribute", "This is disallowed in the relational model", "Domains can only be used by one attribute at a time"]$dby10945$::jsonb,
   0, $dby10946$Multiple attributes may be defined over the same domain (e.g., integer IDs) yet represent different, independently named roles.$dby10946$, 1, 5),
  ($dby10947$tq-dbms-sql-4-attribute-7$dby10947$, $dby10948$pt-dbms-sql-4-attribute$dby10948$,
   $dby10949$Renaming an attribute using the relational-algebra rename operator affects:$dby10949$,
   $dby10950$["Only the schema's labeling; the underlying values in tuples are unchanged", "The actual stored data values", "The domain's set of legal values", "The cardinality of the relation"]$dby10950$::jsonb,
   0, $dby10951$Rename is a purely structural/labeling operation; it does not alter any stored values.$dby10951$, 1, 6),
  ($dby10952$tq-dbms-sql-4-attribute-8$dby10952$, $dby10953$pt-dbms-sql-4-attribute$dby10953$,
   $dby10954$Why is 'gpa' considered an attribute rather than a value?$dby10954$,
   $dby10955$["Because it appears in every tuple as the same fixed column label bound to a domain, not as a data item itself", "Because it is numeric", "Because it changes with every INSERT", "Because it uniquely identifies each tuple"]$dby10955$::jsonb,
   0, $dby10956$'gpa' is the constant column name across all tuples; the values it holds (like 9.1) vary per tuple, but the attribute name/role does not.$dby10956$, 1, 7)
on conflict (id) do nothing;

-- 4.4 Domain
with g as (select id from public.learning_grids where lower(slug) = $dby10957$dbms-sql-tutorial$dby10957$),
     s as (select id from public.learning_sections where lower(slug) = $dby10958$chapter-4-relational-model$dby10958$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby10959$Domain$dby10959$, $dby10960$domain$dby10960$, '', 4, 'published', true, true, $dby10961$dbms_sql_tutorial$dby10961$, $dby10962$chapter-4-relational-model/domain$dby10962$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby10963$dbms_sql_tutorial$dby10963$ and source_ref = $dby10964$chapter-4-relational-model/domain$dby10964$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby10965$Domain$dby10965$, $dby10966$### Definition
A **domain** is the set of all atomic (indivisible), legal values that an attribute is permitted to take. It defines both an underlying data type and, often, a further constraint restricting the allowed range or enumerated set of values. Domains give relations their "type safety" by bounding what each attribute may legitimately store.

### Example
For `Students(id, name, department, gpa)`:
- domain(id) = positive integers
- domain(name) = character strings of length ≤ 50
- domain(department) = { CS, ECE, ME, EEE, CE, ... } (an enumerated set of valid department codes)
- domain(gpa) = decimal values in the range [0.0, 10.0]

### How this differs from Attribute
The **domain** is the pool of legal values (a type plus optional constraints); the **attribute** is the named role bound to that pool within a specific schema. Multiple attributes can draw from the same domain (e.g., "gpa" and "min_gpa_required" might both be `decimal(0.0,10.0)`) while remaining distinct, separately-named attributes.

### Edge Cases
- Two attributes sharing a domain are not automatically comparable or joinable in a *meaningful* sense — comparing "id" (student-id domain) with "course_credits" (an integer domain) is type-compatible but semantically nonsensical.
- **Atomicity assumption**: the classical relational model requires domains to be atomic — no internal structure (e.g., no domain of "list of phone numbers" as a single value). This atomicity requirement is the basis for **First Normal Form (1NF)**.
- **NULL is not a member of any domain.** NULL represents the absence of a value, not a value drawn from the domain — this is precisely why NULL needs special-case handling in comparisons, aggregates, and constraints throughout the relational model.

### Key Takeaways / Q&A
**Q: Is 9.1 a legal value in the domain of "department"?**
A: No — 9.1 is a decimal number, not a member of the enumerated department-code domain; storing it there would violate domain integrity.

**Q: Why must domains be atomic in the classical relational model?**
A: To guarantee First Normal Form and to keep relational-algebra operations (comparison, join, selection) well-defined over single, indivisible values.$dby10966$, 'markdown', 0, 'published', jsonb_build_object('source', $dby10967$dbms_sql_tutorial_seed$dby10967$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby10968$dbms_sql_tutorial_seed$dby10968$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby10969$dbms-sql-tutorial$dby10969$),
     t as (select id from public.learning_topics where source_kind = $dby10970$dbms_sql_tutorial$dby10970$ and source_ref = $dby10971$chapter-4-relational-model/domain$dby10971$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby10972$pt-dbms-sql-4-domain$dby10972$, $dby10973$Domain - Quick Test$dby10973$, 'aptitude', 8, 8,
  $dby10974$8 questions on Domain.$dby10974$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby10975$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby10975$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby10976$tq-dbms-sql-4-domain-1$dby10976$, $dby10977$pt-dbms-sql-4-domain$dby10977$,
   $dby10978$What is a domain in the relational model?$dby10978$,
   $dby10979$["The set of all legal, atomic values an attribute may take", "A synonym for relation schema", "The number of tuples in a relation", "The physical storage location of a table"]$dby10979$::jsonb,
   0, $dby10980$A domain defines the pool of legal atomic values permitted for an attribute.$dby10980$, 1, 0),
  ($dby10981$tq-dbms-sql-4-domain-2$dby10981$, $dby10982$pt-dbms-sql-4-domain$dby10982$,
   $dby10983$What is the domain of the 'gpa' attribute in the running example likely to be?$dby10983$,
   $dby10984$["Any string of text", "Decimal values in the range [0.0, 10.0]", "Only the integers 0 through 10", "An enumerated set of department codes"]$dby10984$::jsonb,
   1, $dby10985$GPA is naturally modeled as a bounded decimal value, e.g. between 0.0 and 10.0.$dby10985$, 1, 1),
  ($dby10986$tq-dbms-sql-4-domain-3$dby10986$, $dby10987$pt-dbms-sql-4-domain$dby10987$,
   $dby10988$Which of these values would violate the domain of the 'department' attribute if its domain is {CS, ECE, ME, EEE, CE}?$dby10988$,
   $dby10989$["'CS'", "'ME'", "9.1", "'ECE'"]$dby10989$::jsonb,
   2, $dby10990$9.1 is a decimal number, not one of the valid enumerated department codes, so it violates the domain constraint.$dby10990$, 1, 2),
  ($dby10991$tq-dbms-sql-4-domain-4$dby10991$, $dby10992$pt-dbms-sql-4-domain$dby10992$,
   $dby10993$How does a Domain differ from an Attribute?$dby10993$,
   $dby10994$["A domain is the pool of legal values; an attribute is the named role/column bound to that pool", "A domain is a row; an attribute is a table", "They are the same thing", "A domain always has fewer values than its attribute"]$dby10994$::jsonb,
   0, $dby10995$The attribute names the column; the domain defines what values that column may legally contain.$dby10995$, 1, 3),
  ($dby10996$tq-dbms-sql-4-domain-5$dby10996$, $dby10997$pt-dbms-sql-4-domain$dby10997$,
   $dby10998$Can two different attributes in the same schema share the identical domain?$dby10998$,
   $dby10999$["No, each attribute must have a unique domain", "Yes \u2014 e.g., 'id' and 'advisor_id' can both be integer-domain attributes while remaining distinct attributes", "Yes, but only within the same relation schema they must merge into one attribute", "No, this would violate entity integrity"]$dby10999$::jsonb,
   1, $dby11000$Multiple attributes may share a domain (like integer IDs) yet remain separately named, distinct attributes.$dby11000$, 1, 4),
  ($dby11001$tq-dbms-sql-4-domain-6$dby11001$, $dby11002$pt-dbms-sql-4-domain$dby11002$,
   $dby11003$Why does the classical relational model require domains to be atomic?$dby11003$,
   $dby11004$["To reduce storage space", "To guarantee First Normal Form and keep operations like comparison and join well-defined on indivisible values", "To allow attributes to store lists of values", "Atomicity is not actually required in the relational model"]$dby11004$::jsonb,
   1, $dby11005$Atomic domains are the foundation of 1NF and ensure relational-algebra operations behave predictably on single values.$dby11005$, 1, 5),
  ($dby11006$tq-dbms-sql-4-domain-7$dby11006$, $dby11007$pt-dbms-sql-4-domain$dby11007$,
   $dby11008$Is NULL considered a member of an attribute's domain?$dby11008$,
   $dby11009$["Yes, NULL is just another value drawn from the domain", "No, NULL represents the absence of a value and is not part of any domain", "Only for numeric domains", "Only if the domain is explicitly defined to include it"]$dby11009$::jsonb,
   1, $dby11010$NULL is a special marker for missing/unknown data, distinct from and not a member of any regular domain.$dby11010$, 1, 6),
  ($dby11011$tq-dbms-sql-4-domain-8$dby11011$, $dby11012$pt-dbms-sql-4-domain$dby11012$,
   $dby11013$Comparing 'id' (student-id domain) with 'course_credits' (an integer domain) in a query is:$dby11013$,
   $dby11014$["Meaningless in practice, even though both are integer-typed, because they represent unrelated concepts", "Always meaningful since both are integers", "Impossible for the DBMS to execute", "Only valid if they share the exact same attribute name"]$dby11014$::jsonb,
   0, $dby11015$Sharing a domain (type-compatibility) does not imply the values are semantically comparable in a meaningful way.$dby11015$, 1, 7)
on conflict (id) do nothing;

-- 4.5 Relation Schema
with g as (select id from public.learning_grids where lower(slug) = $dby11016$dbms-sql-tutorial$dby11016$),
     s as (select id from public.learning_sections where lower(slug) = $dby11017$chapter-4-relational-model$dby11017$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11018$Relation Schema$dby11018$, $dby11019$relation-schema$dby11019$, '', 5, 'published', true, true, $dby11020$dbms_sql_tutorial$dby11020$, $dby11021$chapter-4-relational-model/relation-schema$dby11021$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11022$dbms_sql_tutorial$dby11022$ and source_ref = $dby11023$chapter-4-relational-model/relation-schema$dby11023$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11024$Relation Schema$dby11024$, $dby11025$### Definition
A **relation schema** is the intensional (structural) description of a relation: its name, its attributes, and the domain of each attribute — e.g., `Students(id: integer, name: varchar(50), department: varchar(10), gpa: decimal(3,1))`. It is the "blueprint," analogous to a `CREATE TABLE` definition, and it contains no actual data.

### Example
Relation Schema: `Students(id, name, department, gpa)`

This tells us nothing about which students currently exist — it only states that any valid relation on this schema must have exactly these 4 attributes, each drawing from its declared domain.

### How this differs from Relation / Database Schema
- **Relation Schema** is the structure for ONE relation; a **Relation** is the actual data (a set of tuples) conforming to that structure at a given moment. The same schema can have infinitely many different valid relations (instances) over time as the data changes.
- A **Database Schema** is the collection of ALL relation schemas in the database (e.g., the Students schema + Courses schema + Enrollments schema, together with cross-relation constraints). A Relation Schema is one component piece of the larger Database Schema.

### Edge Cases
- A schema can exist validly with zero relations having been populated yet — an empty instance is perfectly legal under a defined schema.
- Changing a relation schema (e.g., `ALTER TABLE ADD COLUMN`) produces a new version of the schema; all future instances follow the new schema. Schema changes are structural and infrequent — unlike relations, which change with every INSERT/UPDATE/DELETE.
- A relation schema can also declare constraints (primary key, NOT NULL, CHECK) as part of its intensional definition — these are structural rules, not data.

### Key Takeaways / Q&A
**Q: If I add a new student row, does the relation schema change?**
A: No — only the relation (instance) changes; the schema (attributes/domains/constraints) is unaffected by ordinary data changes.

**Q: What is the relationship between Relation Schema and Database Schema?**
A: A database schema is the union of all relation schemas (plus any inter-relation constraints, like foreign keys) that make up the database.$dby11025$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11026$dbms_sql_tutorial_seed$dby11026$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11027$dbms_sql_tutorial_seed$dby11027$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11028$dbms-sql-tutorial$dby11028$),
     t as (select id from public.learning_topics where source_kind = $dby11029$dbms_sql_tutorial$dby11029$ and source_ref = $dby11030$chapter-4-relational-model/relation-schema$dby11030$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11031$pt-dbms-sql-4-relation-schema$dby11031$, $dby11032$Relation Schema - Quick Test$dby11032$, 'aptitude', 8, 8,
  $dby11033$8 questions on Relation Schema.$dby11033$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11034$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11034$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11035$tq-dbms-sql-4-relation-schema-1$dby11035$, $dby11036$pt-dbms-sql-4-relation-schema$dby11036$,
   $dby11037$What does a relation schema describe?$dby11037$,
   $dby11038$["The actual current rows stored in a relation", "The structural blueprint: the relation's name, attributes, and their domains", "The number of tuples currently present", "The physical disk location of the data"]$dby11038$::jsonb,
   1, $dby11039$A relation schema is the intensional/structural definition, not the data itself.$dby11039$, 1, 0),
  ($dby11040$tq-dbms-sql-4-relation-schema-2$dby11040$, $dby11041$pt-dbms-sql-4-relation-schema$dby11041$,
   $dby11042$Which of these is an example of a relation schema?$dby11042$,
   $dby11043$["{(1,Asha,CS,8.7),(2,Ravi,ECE,7.9)}", "Students(id, name, department, gpa)", "4 tuples with a cardinality of 4", "SELECT * FROM Students"]$dby11043$::jsonb,
   1, $dby11044$'Students(id, name, department, gpa)' names the relation and lists its attributes — that is exactly a relation schema.$dby11044$, 1, 1),
  ($dby11045$tq-dbms-sql-4-relation-schema-3$dby11045$, $dby11046$pt-dbms-sql-4-relation-schema$dby11046$,
   $dby11047$If 5 new student rows are inserted into the Students table, what happens to the relation schema?$dby11047$,
   $dby11048$["It changes to reflect the 5 new rows", "It stays exactly the same; only the relation (instance/data) changes", "Its degree increases by 5", "It is deleted and recreated"]$dby11048$::jsonb,
   1, $dby11049$Inserting rows only changes the data (the relation/instance); the schema (attributes and domains) is untouched.$dby11049$, 1, 2),
  ($dby11050$tq-dbms-sql-4-relation-schema-4$dby11050$, $dby11051$pt-dbms-sql-4-relation-schema$dby11051$,
   $dby11052$How does a Relation Schema differ from a Relation?$dby11052$,
   $dby11053$["A relation schema is the structural blueprint; a relation is the actual set of tuples conforming to it", "They are exactly the same thing", "A relation is fixed, but a relation schema changes with every insert", "A relation schema stores values; a relation stores attribute names"]$dby11053$::jsonb,
   0, $dby11054$The schema defines structure (attributes/domains); the relation is the data instance that conforms to that structure.$dby11054$, 1, 3),
  ($dby11055$tq-dbms-sql-4-relation-schema-5$dby11055$, $dby11056$pt-dbms-sql-4-relation-schema$dby11056$,
   $dby11057$How does a Relation Schema relate to a Database Schema?$dby11057$,
   $dby11058$["They are unrelated concepts", "A database schema is the collection of all relation schemas (plus cross-relation constraints) in the database", "A relation schema contains many database schemas", "A database schema only applies to a single relation"]$dby11058$::jsonb,
   1, $dby11059$The database schema aggregates every relation schema in the system along with constraints spanning them.$dby11059$, 1, 4),
  ($dby11060$tq-dbms-sql-4-relation-schema-6$dby11060$, $dby11061$pt-dbms-sql-4-relation-schema$dby11061$,
   $dby11062$Which of the following counts as a change to the relation schema (not just the relation)?$dby11062$,
   $dby11063$["Deleting a row where gpa < 5.0", "Running ALTER TABLE Students ADD COLUMN email varchar(100)", "Updating Karan's gpa from 6.8 to 7.0", "Inserting a new student tuple"]$dby11063$::jsonb,
   1, $dby11064$Adding a new column changes the schema's attribute list; the other options only affect the data (the relation).$dby11064$, 1, 5),
  ($dby11065$tq-dbms-sql-4-relation-schema-7$dby11065$, $dby11066$pt-dbms-sql-4-relation-schema$dby11066$,
   $dby11067$Can a relation schema be constrained (e.g., declare a primary key) as part of its own definition?$dby11067$,
   $dby11068$["No, constraints can only exist at the database schema level", "Yes, constraints like primary key or NOT NULL are part of the relation schema's intensional definition", "No, constraints are data, not structure", "Only referential (foreign key) constraints belong to a relation schema"]$dby11068$::jsonb,
   1, $dby11069$Constraints such as PRIMARY KEY and NOT NULL are structural rules declared as part of the relation schema.$dby11069$, 1, 6),
  ($dby11070$tq-dbms-sql-4-relation-schema-8$dby11070$, $dby11071$pt-dbms-sql-4-relation-schema$dby11071$,
   $dby11072$Is it valid for a relation schema to exist with no relation (instance) populated under it yet?$dby11072$,
   $dby11073$["No, a schema requires at least one tuple to be considered defined", "Yes \u2014 a schema can be validly defined with an empty (zero-tuple) instance", "Only if the schema has degree 0", "No, this would violate entity integrity"]$dby11073$::jsonb,
   1, $dby11074$A freshly created schema with no rows yet inserted still has a valid (empty) relation instance.$dby11074$, 1, 7)
on conflict (id) do nothing;

-- 4.6 Database Schema
with g as (select id from public.learning_grids where lower(slug) = $dby11075$dbms-sql-tutorial$dby11075$),
     s as (select id from public.learning_sections where lower(slug) = $dby11076$chapter-4-relational-model$dby11076$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11077$Database Schema$dby11077$, $dby11078$database-schema$dby11078$, '', 6, 'published', true, true, $dby11079$dbms_sql_tutorial$dby11079$, $dby11080$chapter-4-relational-model/database-schema$dby11080$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11081$dbms_sql_tutorial$dby11081$ and source_ref = $dby11082$chapter-4-relational-model/database-schema$dby11082$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11083$Database Schema$dby11083$, $dby11084$### Definition
A **database schema** is the complete structural design of an entire database: the set of ALL relation schemas it contains, together with the constraints that hold across them (primary keys, foreign keys, domain constraints, etc.). It is the intensional description of the whole database, independent of whatever data currently happens to be stored.

### Example
A college database schema might include:
- `Students(id, name, department, gpa)`
- `Courses(course_id, title, credits)`
- `Enrollments(student_id → Students.id, course_id → Courses.id, grade)`

The database schema is all three relation schemas *plus* the two foreign-key relationships that link Enrollments to Students and Courses.

### How this differs from Relation Schema / Database Instance
- A **Relation Schema** describes one relation; a **Database Schema** aggregates every relation schema in the system plus cross-relation constraints (foreign keys) that no single relation schema can express alone.
- **Database Schema** is "the design" (rarely changes); **Database Instance** is "the current data" (changes constantly with every transaction). This mirrors the Relation Schema vs. Relation distinction, just scaled up to the whole database.

### Edge Cases
- A database schema is valid and complete even when every relation in it is empty (no instance data yet) — e.g., immediately after running all the `CREATE TABLE` statements.
- A migration (adding/dropping a table, adding a column, adding a foreign key) changes the database schema. Such changes are typically versioned and infrequent, unlike everyday CRUD operations, which only affect the instance.
- Circular foreign keys between two relation schemas (e.g., Departments.head_id → Employees.id and Employees.dept_id → Departments.id) are part of the database schema design and must be validated together, not per relation schema in isolation.

### Key Takeaways / Q&A
**Q: Does inserting 1,000 new student rows change the database schema?**
A: No — that changes the database instance; the schema (structure + constraints) stays exactly the same.

**Q: Where do foreign key constraints conceptually "live" — in one relation schema, or the database schema?**
A: They are declared syntactically on a relation schema, but they express a relationship BETWEEN two relation schemas, so conceptually they belong to the overall database schema.$dby11084$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11085$dbms_sql_tutorial_seed$dby11085$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11086$dbms_sql_tutorial_seed$dby11086$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11087$dbms-sql-tutorial$dby11087$),
     t as (select id from public.learning_topics where source_kind = $dby11088$dbms_sql_tutorial$dby11088$ and source_ref = $dby11089$chapter-4-relational-model/database-schema$dby11089$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11090$pt-dbms-sql-4-database-schema$dby11090$, $dby11091$Database Schema - Quick Test$dby11091$, 'aptitude', 8, 8,
  $dby11092$8 questions on Database Schema.$dby11092$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11093$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11093$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11094$tq-dbms-sql-4-database-schema-1$dby11094$, $dby11095$pt-dbms-sql-4-database-schema$dby11095$,
   $dby11096$What does a database schema represent?$dby11096$,
   $dby11097$["The data currently stored in one table", "The complete structural design of the entire database: all relation schemas plus cross-relation constraints", "A single relation's set of tuples", "The physical hard-disk layout of the DBMS"]$dby11097$::jsonb,
   1, $dby11098$The database schema is the full structural blueprint spanning every relation and the constraints between them.$dby11098$, 1, 0),
  ($dby11099$tq-dbms-sql-4-database-schema-2$dby11099$, $dby11100$pt-dbms-sql-4-database-schema$dby11100$,
   $dby11101$Which of the following would be part of the database schema for a college database?$dby11101$,
   $dby11102$["The specific 4 rows currently in Students", "The Students, Courses, and Enrollments relation schemas plus their foreign-key links", "Today's date", "The number of students who enrolled last semester"]$dby11102$::jsonb,
   1, $dby11103$The relation schemas and the constraints (including foreign keys) linking them together constitute the database schema.$dby11103$, 1, 1),
  ($dby11104$tq-dbms-sql-4-database-schema-3$dby11104$, $dby11105$pt-dbms-sql-4-database-schema$dby11105$,
   $dby11106$How does a Database Schema differ from a single Relation Schema?$dby11106$,
   $dby11107$["A database schema is one relation's structure; a relation schema covers the whole database", "A database schema aggregates ALL relation schemas plus inter-relation constraints; a relation schema describes just one relation", "They are identical terms for the same concept", "A relation schema always has more attributes than a database schema"]$dby11107$::jsonb,
   1, $dby11108$The database schema is the union of every relation schema in the system, plus constraints spanning them, such as foreign keys.$dby11108$, 1, 2),
  ($dby11109$tq-dbms-sql-4-database-schema-4$dby11109$, $dby11110$pt-dbms-sql-4-database-schema$dby11110$,
   $dby11111$A foreign key linking Enrollments.student_id to Students.id is best understood as part of:$dby11111$,
   $dby11112$["Only the Enrollments relation schema, with no bearing on the database schema", "The overall database schema, since it expresses a relationship BETWEEN two relation schemas", "The database instance, since it involves actual ID values", "Neither the relation schema nor the database schema"]$dby11112$::jsonb,
   1, $dby11113$Although declared syntactically inside one table's definition, a foreign key constraint expresses a cross-relation relationship and is conceptually part of the database schema.$dby11113$, 1, 3),
  ($dby11114$tq-dbms-sql-4-database-schema-5$dby11114$, $dby11115$pt-dbms-sql-4-database-schema$dby11115$,
   $dby11116$Is it valid for a database schema to be considered complete even if all its relations currently hold zero rows?$dby11116$,
   $dby11117$["No, a database schema requires at least some data to be valid", "Yes \u2014 the schema (structure + constraints) is complete as soon as it is defined, regardless of whether data has been inserted", "Only if there is exactly one relation in the schema", "No, this would violate referential integrity"]$dby11117$::jsonb,
   1, $dby11118$A database schema is a structural definition; it can be fully valid with every relation instance still empty.$dby11118$, 1, 4),
  ($dby11119$tq-dbms-sql-4-database-schema-6$dby11119$, $dby11120$pt-dbms-sql-4-database-schema$dby11120$,
   $dby11121$Adding a brand-new table 'Instructors' to the college database is an example of a change to:$dby11121$,
   $dby11122$["The database instance only", "The database schema, since a new relation schema is being introduced", "Neither the schema nor the instance", "Only the Students relation schema"]$dby11122$::jsonb,
   1, $dby11123$Introducing a new relation schema changes the overall structural design, i.e., the database schema.$dby11123$, 1, 5),
  ($dby11124$tq-dbms-sql-4-database-schema-7$dby11124$, $dby11125$pt-dbms-sql-4-database-schema$dby11125$,
   $dby11126$Circular foreign keys between two relations (each referencing the other) must be validated:$dby11126$,
   $dby11127$["Independently, one relation schema at a time, ignoring the other", "Together, as part of the overall database schema design, since neither constraint makes sense in isolation", "Only at the database instance level, never at schema design time", "They are not allowed to exist in any relational database schema"]$dby11127$::jsonb,
   1, $dby11128$Circular references span two relation schemas and must be reasoned about jointly as part of the whole database schema.$dby11128$, 1, 6),
  ($dby11129$tq-dbms-sql-4-database-schema-8$dby11129$, $dby11130$pt-dbms-sql-4-database-schema$dby11130$,
   $dby11131$Which pair of terms mirrors the Relation Schema vs. Relation distinction, but at the whole-database level?$dby11131$,
   $dby11132$["Attribute vs. Domain", "Database Schema vs. Database Instance", "Degree vs. Cardinality", "Tuple vs. Attribute"]$dby11132$::jsonb,
   1, $dby11133$Just as Relation Schema (structure) contrasts with Relation (data), Database Schema (structure) contrasts with Database Instance (data), scaled to the entire database.$dby11133$, 1, 7)
on conflict (id) do nothing;

-- 4.7 Database Instance
with g as (select id from public.learning_grids where lower(slug) = $dby11134$dbms-sql-tutorial$dby11134$),
     s as (select id from public.learning_sections where lower(slug) = $dby11135$chapter-4-relational-model$dby11135$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11136$Database Instance$dby11136$, $dby11137$database-instance$dby11137$, '', 7, 'published', true, true, $dby11138$dbms_sql_tutorial$dby11138$, $dby11139$chapter-4-relational-model/database-instance$dby11139$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11140$dbms_sql_tutorial$dby11140$ and source_ref = $dby11141$chapter-4-relational-model/database-instance$dby11141$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11142$Database Instance$dby11142$, $dby11143$### Definition
A **database instance** is the actual data stored in the database at a specific point in time — the collection of all current relations (one relation instance per relation schema) that together conform to the database schema. If the schema is the blueprint, the instance is the live snapshot of real data right now.

### Example
At 10:00 AM, the database instance might have `Students` with 4 tuples, `Courses` with 12 tuples, and `Enrollments` with 30 tuples. At 10:05 AM, after a new admission, `Students` gains a 5th tuple — this is now a *new* database instance, even though the database schema has not changed at all.

### How this differs from Database Schema / Relation
- **Database Schema** = structure, (mostly) time-invariant; **Database Instance** = the full set of data across ALL relations at one moment, changing on every transaction.
- A **Relation** is the data for ONE relation schema; a **Database Instance** is the union of the current relations for EVERY relation schema in the database — i.e., "the whole database's state" versus "one table's state."

### Edge Cases
- Every valid database instance must satisfy all integrity constraints declared in the schema (keys, foreign keys, domain constraints) — an instance that violates a foreign key is not a *legal* instance.
- Backup snapshots and "time-travel" queries are, literally, different database instances captured at different times under the same schema.
- Concurrent transactions can each observe or produce different intermediate instances (depending on the isolation level) even though exactly one schema governs all of them.

### Key Takeaways / Q&A
**Q: If I run `DROP TABLE Enrollments`, am I changing the instance or the schema?**
A: The schema — you are removing a relation schema entirely, which also destroys its instance data; that is a structural change, not merely a data change.

**Q: Can two different databases share the same schema but have different instances?**
A: Yes — a "staging" and a "production" database can be created from an identical schema yet hold completely different data (different instances) at any given time.$dby11143$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11144$dbms_sql_tutorial_seed$dby11144$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11145$dbms_sql_tutorial_seed$dby11145$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11146$dbms-sql-tutorial$dby11146$),
     t as (select id from public.learning_topics where source_kind = $dby11147$dbms_sql_tutorial$dby11147$ and source_ref = $dby11148$chapter-4-relational-model/database-instance$dby11148$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11149$pt-dbms-sql-4-database-instance$dby11149$, $dby11150$Database Instance - Quick Test$dby11150$, 'aptitude', 8, 8,
  $dby11151$8 questions on Database Instance.$dby11151$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11152$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11152$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11153$tq-dbms-sql-4-database-instance-1$dby11153$, $dby11154$pt-dbms-sql-4-database-instance$dby11154$,
   $dby11155$What is a database instance?$dby11155$,
   $dby11156$["The structural design of the database", "The actual data (all current relations) stored in the database at a given point in time", "The name of the database", "A single attribute's domain"]$dby11156$::jsonb,
   1, $dby11157$A database instance is the real, current data across every relation, as opposed to the structural schema.$dby11157$, 1, 0),
  ($dby11158$tq-dbms-sql-4-database-instance-2$dby11158$, $dby11159$pt-dbms-sql-4-database-instance$dby11159$,
   $dby11160$If Students goes from 4 rows to 5 rows after a new admission, what has changed?$dby11160$,
   $dby11161$["The database schema", "The database instance (the data), while the schema stays the same", "The relation schema's degree", "Nothing has changed"]$dby11161$::jsonb,
   1, $dby11162$Adding a row changes only the current data (the instance); the underlying structure (schema) is unaffected.$dby11162$, 1, 1),
  ($dby11163$tq-dbms-sql-4-database-instance-3$dby11163$, $dby11164$pt-dbms-sql-4-database-instance$dby11164$,
   $dby11165$Which of these best captures the difference between Database Schema and Database Instance?$dby11165$,
   $dby11166$["Schema = structure (mostly fixed); Instance = actual data at a moment (changes constantly)", "Schema = data; Instance = structure", "They mean the same thing", "Instance only applies to a single table, schema applies to the whole database"]$dby11166$::jsonb,
   0, $dby11167$This is exactly the structure-vs-data distinction, scaled to the whole database.$dby11167$, 1, 2),
  ($dby11168$tq-dbms-sql-4-database-instance-4$dby11168$, $dby11169$pt-dbms-sql-4-database-instance$dby11169$,
   $dby11170$How does a Database Instance relate to individual Relations?$dby11170$,
   $dby11171$["A database instance is smaller than any single relation", "A database instance is the union of the current relation (data) for every relation schema in the database", "A relation contains many database instances", "They are unrelated concepts"]$dby11171$::jsonb,
   1, $dby11172$The database instance is the combined current state of ALL the individual relations together.$dby11172$, 1, 3),
  ($dby11173$tq-dbms-sql-4-database-instance-5$dby11173$, $dby11174$pt-dbms-sql-4-database-instance$dby11174$,
   $dby11175$Which action changes the database instance without changing the database schema?$dby11175$,
   $dby11176$["Adding a new column to Students", "Deleting a graduated student's row from Students", "Dropping the Enrollments table", "Adding a new foreign key constraint"]$dby11176$::jsonb,
   1, $dby11177$Deleting a row only changes the current data (instance); the other options are structural (schema) changes.$dby11177$, 1, 4),
  ($dby11178$tq-dbms-sql-4-database-instance-6$dby11178$, $dby11179$pt-dbms-sql-4-database-instance$dby11179$,
   $dby11180$For a database instance to be considered legal/valid, what must it satisfy?$dby11180$,
   $dby11181$["It must have at least 1000 rows in every relation", "All integrity constraints declared in the database schema (keys, foreign keys, domain constraints)", "It must be identical to some prior backup", "It must contain no NULL values anywhere"]$dby11181$::jsonb,
   1, $dby11182$A legal instance is one that conforms to every constraint the schema defines; violating any constraint makes it an illegal instance.$dby11182$, 1, 5),
  ($dby11183$tq-dbms-sql-4-database-instance-7$dby11183$, $dby11184$pt-dbms-sql-4-database-instance$dby11184$,
   $dby11185$Can a 'staging' database and a 'production' database share an identical database schema but hold different database instances?$dby11185$,
   $dby11186$["No, identical schemas always imply identical data", "Yes \u2014 the same schema can be populated with completely different data in each environment", "Only if both databases are read-only", "No, this would violate referential integrity"]$dby11186$::jsonb,
   1, $dby11187$Schema and instance are independent: the same structural design can be filled with entirely different data sets.$dby11187$, 1, 6),
  ($dby11188$tq-dbms-sql-4-database-instance-8$dby11188$, $dby11189$pt-dbms-sql-4-database-instance$dby11189$,
   $dby11190$Running DROP TABLE Enrollments affects:$dby11190$,
   $dby11191$["Only the database instance, since data is removed", "Both the database schema (the relation schema is removed) and, consequently, its instance data", "Neither the schema nor the instance", "Only the Courses relation schema"]$dby11191$::jsonb,
   1, $dby11192$Dropping a table removes its relation schema entirely (a structural/schema change), which necessarily also wipes out its data (instance).$dby11192$, 1, 7)
on conflict (id) do nothing;

-- 4.8 Degree
with g as (select id from public.learning_grids where lower(slug) = $dby11193$dbms-sql-tutorial$dby11193$),
     s as (select id from public.learning_sections where lower(slug) = $dby11194$chapter-4-relational-model$dby11194$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11195$Degree$dby11195$, $dby11196$degree$dby11196$, '', 8, 'published', true, true, $dby11197$dbms_sql_tutorial$dby11197$, $dby11198$chapter-4-relational-model/degree$dby11198$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11199$dbms_sql_tutorial$dby11199$ and source_ref = $dby11200$chapter-4-relational-model/degree$dby11200$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11201$Degree$dby11201$, $dby11202$### Definition
The **degree** (or arity) of a relation is the number of attributes in its relation schema. It is a property of the SCHEMA, and therefore fixed — it does not change unless the schema itself changes (e.g., adding or dropping a column).

### Example
`Students(id, name, department, gpa)` has degree **4** (four attributes). A relation with a single attribute, e.g. `DistinctDepartments(department)`, has degree 1 ("unary"); two attributes = "binary"; three = "ternary"; n attributes = "n-ary."

### How this differs from Cardinality (its closest sibling)
- **Degree** counts COLUMNS (attributes) — a schema-level, structural property.
- **Cardinality** counts ROWS (tuples) — an instance-level, data property.
- Degree is stable over the relation's lifetime (until a schema change); cardinality fluctuates with every INSERT/DELETE. This is the single most commonly confused pair of terms in relational-model vocabulary — always map "**Degree → columns/schema/fixed**" and "**Cardinality → rows/data/changing**."

### Edge Cases
- A relation with degree 0 is a theoretical curiosity (a schema with no attributes at all) — practically never used, but valid in relational algebra (e.g., the DUM/DEE relations used in some formalisms to represent TRUE/FALSE).
- Running `ALTER TABLE ... ADD COLUMN` increases the degree by 1 for ALL existing and future tuples — every existing row must now conform to the new degree, typically receiving NULL for the new attribute.
- Degree is completely unaffected by how many rows exist — an empty relation and a million-row relation on the identical schema have identical degree.

### Key Takeaways / Q&A
**Q: If a table has 4 columns and 10,000 rows, what is its degree?**
A: 4 — degree only counts columns; it never counts rows.

**Q: Does degree change when data is inserted or deleted?**
A: No — only schema changes (adding or removing attributes) change the degree.$dby11202$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11203$dbms_sql_tutorial_seed$dby11203$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11204$dbms_sql_tutorial_seed$dby11204$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11205$dbms-sql-tutorial$dby11205$),
     t as (select id from public.learning_topics where source_kind = $dby11206$dbms_sql_tutorial$dby11206$ and source_ref = $dby11207$chapter-4-relational-model/degree$dby11207$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11208$pt-dbms-sql-4-degree$dby11208$, $dby11209$Degree - Quick Test$dby11209$, 'aptitude', 8, 8,
  $dby11210$8 questions on Degree.$dby11210$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11211$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11211$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11212$tq-dbms-sql-4-degree-1$dby11212$, $dby11213$pt-dbms-sql-4-degree$dby11213$,
   $dby11214$What does the degree of a relation measure?$dby11214$,
   $dby11215$["The number of tuples currently stored", "The number of attributes in the relation's schema", "The number of foreign keys", "The number of distinct values in the primary key"]$dby11215$::jsonb,
   1, $dby11216$Degree is defined as the count of attributes (columns) in the relation schema.$dby11216$, 1, 0),
  ($dby11217$tq-dbms-sql-4-degree-2$dby11217$, $dby11218$pt-dbms-sql-4-degree$dby11218$,
   $dby11219$What is the degree of Students(id, name, department, gpa)?$dby11219$,
   $dby11220$["1", "3", "4", "It depends on the number of rows"]$dby11220$::jsonb,
   2, $dby11221$There are 4 attributes (id, name, department, gpa), so the degree is 4.$dby11221$, 1, 1),
  ($dby11222$tq-dbms-sql-4-degree-3$dby11222$, $dby11223$pt-dbms-sql-4-degree$dby11223$,
   $dby11224$A relation with exactly one attribute is called:$dby11224$,
   $dby11225$["Binary", "Unary", "Ternary", "Null"]$dby11225$::jsonb,
   1, $dby11226$A relation of degree 1 (one attribute) is called unary.$dby11226$, 1, 2),
  ($dby11227$tq-dbms-sql-4-degree-4$dby11227$, $dby11228$pt-dbms-sql-4-degree$dby11228$,
   $dby11229$If Students currently holds 4 rows and later grows to 10,000 rows, what happens to its degree?$dby11229$,
   $dby11230$["It grows proportionally with the number of rows", "It stays exactly the same, since degree only depends on the schema's attribute count", "It becomes undefined", "It doubles every time rows double"]$dby11230$::jsonb,
   1, $dby11231$Degree is a schema-level property (attribute count) and is completely unaffected by how many rows exist.$dby11231$, 1, 3),
  ($dby11232$tq-dbms-sql-4-degree-5$dby11232$, $dby11233$pt-dbms-sql-4-degree$dby11233$,
   $dby11234$Which action changes the degree of a relation?$dby11234$,
   $dby11235$["Inserting a new tuple", "Deleting a tuple", "Running ALTER TABLE Students ADD COLUMN email varchar(100)", "Updating a gpa value"]$dby11235$::jsonb,
   2, $dby11236$Adding a new attribute (column) increases the degree by one; row-level operations never change degree.$dby11236$, 1, 4),
  ($dby11237$tq-dbms-sql-4-degree-6$dby11237$, $dby11238$pt-dbms-sql-4-degree$dby11238$,
   $dby11239$Which of the following correctly distinguishes Degree from its closest sibling concept, Cardinality?$dby11239$,
   $dby11240$["Degree counts rows; Cardinality counts columns", "Degree counts columns (schema-level, fixed); Cardinality counts rows (instance-level, changes with data)", "They are the same measurement expressed differently", "Degree changes with every INSERT; Cardinality never changes"]$dby11240$::jsonb,
   1, $dby11241$This is precisely the schema-vs-instance, columns-vs-rows distinction between Degree and Cardinality.$dby11241$, 1, 5),
  ($dby11242$tq-dbms-sql-4-degree-7$dby11242$, $dby11243$pt-dbms-sql-4-degree$dby11243$,
   $dby11244$After ALTER TABLE Students ADD COLUMN email varchar(100), what happens to existing rows with respect to the new attribute?$dby11244$,
   $dby11245$["They are deleted", "They typically receive NULL for the new 'email' attribute, since the degree increased for all tuples", "They automatically get a randomly generated email", "The table becomes invalid until every row supplies an email"]$dby11245$::jsonb,
   1, $dby11246$When a column is added, existing rows conform to the new degree by receiving NULL (or a default) for the new attribute.$dby11246$, 1, 6),
  ($dby11247$tq-dbms-sql-4-degree-8$dby11247$, $dby11248$pt-dbms-sql-4-degree$dby11248$,
   $dby11249$Is a relation of degree 0 (a schema with zero attributes) theoretically valid in relational algebra?$dby11249$,
   $dby11250$["No, every relation must have at least one attribute", "Yes, degree-0 relations are a valid theoretical construct (e.g., used to represent TRUE/FALSE in some formalisms), even though they are practically never used", "No, degree 0 is only valid for cardinality, not for relations", "Yes, but only if cardinality is also 0"]$dby11250$::jsonb,
   1, $dby11251$While unusual in practice, degree-0 relations are a recognized theoretical construct in relational algebra.$dby11251$, 1, 7)
on conflict (id) do nothing;

-- 4.9 Cardinality
with g as (select id from public.learning_grids where lower(slug) = $dby11252$dbms-sql-tutorial$dby11252$),
     s as (select id from public.learning_sections where lower(slug) = $dby11253$chapter-4-relational-model$dby11253$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11254$Cardinality$dby11254$, $dby11255$cardinality$dby11255$, '', 9, 'published', true, true, $dby11256$dbms_sql_tutorial$dby11256$, $dby11257$chapter-4-relational-model/cardinality$dby11257$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11258$dbms_sql_tutorial$dby11258$ and source_ref = $dby11259$chapter-4-relational-model/cardinality$dby11259$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11260$Cardinality$dby11260$, $dby11261$### Definition
The **cardinality** of a relation is the number of tuples (rows) it currently contains. Unlike degree, cardinality is a property of the INSTANCE (the data), not the schema — so it is inherently dynamic, changing with every successful INSERT or DELETE.

### Example
If `Students` currently holds tuples for Asha, Ravi, Meera, and Karan, its cardinality is **4**. After a 5th student, Priya, is admitted, cardinality becomes **5** — with absolutely no change to the schema or the degree (still 4 attributes).

### How this differs from Degree (its closest sibling)
- **Cardinality** = number of rows = instance-level = changes constantly.
- **Degree** = number of columns = schema-level = fixed until a schema migration.

A relation can have cardinality 0 (an empty table, e.g., right after `CREATE TABLE`) while still having a well-defined, non-zero degree — the two quantities are completely independent of each other.

Cardinality of a relation should also not be confused with "cardinality" in the **ER-diagram / relationship sense** (one-to-many, many-to-many). That is a different, related use of the same word, describing relationship *multiplicity* between entity sets — not a row count of a relation.

### Edge Cases
- Cardinality 0 is valid and common — a freshly created or fully truncated table.
- Bulk operations (`TRUNCATE`, batch inserts) can change cardinality drastically in a single step, without any schema change whatsoever.
- Because a relation is a SET, inserting a tuple that is an exact duplicate of an existing one does not increase cardinality in the pure mathematical model — though in practice, SQL without a uniqueness constraint would physically add the duplicate row and increase the row count, which is one place SQL tables deviate from strict relation semantics.

### Key Takeaways / Q&A
**Q: A table starts with 100 rows; after some deletes and inserts it has 87 rows. What changed — degree, cardinality, or both?**
A: Only cardinality — degree is untouched unless columns were added or removed.

**Q: Can cardinality exceed the size of the Cartesian product of the attribute domains?**
A: No — cardinality is bounded above by |D1| × |D2| × ... × |Dn|, since a relation is, by definition, a subset of that Cartesian product.$dby11261$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11262$dbms_sql_tutorial_seed$dby11262$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11263$dbms_sql_tutorial_seed$dby11263$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11264$dbms-sql-tutorial$dby11264$),
     t as (select id from public.learning_topics where source_kind = $dby11265$dbms_sql_tutorial$dby11265$ and source_ref = $dby11266$chapter-4-relational-model/cardinality$dby11266$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11267$pt-dbms-sql-4-cardinality$dby11267$, $dby11268$Cardinality - Quick Test$dby11268$, 'aptitude', 8, 8,
  $dby11269$8 questions on Cardinality.$dby11269$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11270$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11270$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11271$tq-dbms-sql-4-cardinality-1$dby11271$, $dby11272$pt-dbms-sql-4-cardinality$dby11272$,
   $dby11273$What does the cardinality of a relation measure?$dby11273$,
   $dby11274$["The number of attributes in the schema", "The number of tuples (rows) currently in the relation", "The number of distinct relations in the database", "The number of foreign keys pointing to it"]$dby11274$::jsonb,
   1, $dby11275$Cardinality is the count of tuples (rows) currently present in the relation.$dby11275$, 1, 0),
  ($dby11276$tq-dbms-sql-4-cardinality-2$dby11276$, $dby11277$pt-dbms-sql-4-cardinality$dby11277$,
   $dby11278$If Students holds tuples for Asha, Ravi, Meera, and Karan, what is its current cardinality?$dby11278$,
   $dby11279$["1", "4", "It equals the degree", "It cannot be determined"]$dby11279$::jsonb,
   1, $dby11280$There are 4 tuples currently in the relation, so cardinality is 4.$dby11280$, 1, 1),
  ($dby11281$tq-dbms-sql-4-cardinality-3$dby11281$, $dby11282$pt-dbms-sql-4-cardinality$dby11282$,
   $dby11283$After a 5th student, Priya, is admitted and inserted into Students, what happens to the relation's degree?$dby11283$,
   $dby11284$["It increases by 1, to 5", "It stays exactly the same, since inserting a row never changes degree", "It becomes undefined", "It doubles"]$dby11284$::jsonb,
   1, $dby11285$Degree depends only on the number of attributes, which is unaffected by inserting a new row (which changes cardinality instead).$dby11285$, 1, 2),
  ($dby11286$tq-dbms-sql-4-cardinality-4$dby11286$, $dby11287$pt-dbms-sql-4-cardinality$dby11287$,
   $dby11288$Which value changes every time a row is inserted or deleted — Degree or Cardinality?$dby11288$,
   $dby11289$["Degree", "Cardinality", "Both change equally", "Neither changes"]$dby11289$::jsonb,
   1, $dby11290$Cardinality (row count) changes with every insert/delete, while degree (column count) stays fixed.$dby11290$, 1, 3),
  ($dby11291$tq-dbms-sql-4-cardinality-5$dby11291$, $dby11292$pt-dbms-sql-4-cardinality$dby11292$,
   $dby11293$Can a relation have cardinality 0 while still having a well-defined, non-zero degree?$dby11293$,
   $dby11294$["No, cardinality and degree must always be equal", "Yes \u2014 an empty table (e.g., right after CREATE TABLE) has cardinality 0 but a fixed, non-zero degree", "No, a relation with cardinality 0 has no schema", "Yes, but only if the primary key is NULL"]$dby11294$::jsonb,
   1, $dby11295$Degree and cardinality are independent measures; a freshly created empty table has 0 cardinality but its full degree from the schema.$dby11295$, 1, 4),
  ($dby11296$tq-dbms-sql-4-cardinality-6$dby11296$, $dby11297$pt-dbms-sql-4-cardinality$dby11297$,
   $dby11298$In pure relational-set semantics, what is the upper bound on a relation's cardinality?$dby11298$,
   $dby11299$["There is no upper bound at all", "It is bounded by the size of the Cartesian product of the attribute domains, |D1| x |D2| x ... x |Dn|", "It equals the degree", "It is always exactly 2^degree"]$dby11299$::jsonb,
   1, $dby11300$Since a relation is a subset of the Cartesian product of its attribute domains, its cardinality cannot exceed that product's size.$dby11300$, 1, 5),
  ($dby11301$tq-dbms-sql-4-cardinality-7$dby11301$, $dby11302$pt-dbms-sql-4-cardinality$dby11302$,
   $dby11303$In the pure mathematical relational model, does inserting an exact duplicate of an existing tuple increase cardinality?$dby11303$,
   $dby11304$["Yes, cardinality always increases by 1 on every insert attempt", "No \u2014 since a relation is a set, an exact duplicate tuple does not add a new element, so cardinality is unchanged", "Only if the primary key allows duplicates", "Cardinality decreases instead"]$dby11304$::jsonb,
   1, $dby11305$Because relations are sets, adding an already-present element does not change the set (though SQL without a uniqueness constraint would physically add a duplicate row).$dby11305$, 1, 6),
  ($dby11306$tq-dbms-sql-4-cardinality-8$dby11306$, $dby11307$pt-dbms-sql-4-cardinality$dby11307$,
   $dby11308$The term 'cardinality' used in ER-diagram relationship notation (e.g., one-to-many) refers to:$dby11308$,
   $dby11309$["The exact same concept as relation cardinality (row count)", "A related but distinct concept describing relationship multiplicity between entity sets, not a row count", "The degree of the relation", "A synonym for the primary key"]$dby11309$::jsonb,
   1, $dby11310$ER-diagram cardinality describes multiplicity of relationships (1:1, 1:N, M:N), which is a different, though related, use of the term from a relation's row count.$dby11310$, 1, 7)
on conflict (id) do nothing;

-- 4.10 Null Values
with g as (select id from public.learning_grids where lower(slug) = $dby11311$dbms-sql-tutorial$dby11311$),
     s as (select id from public.learning_sections where lower(slug) = $dby11312$chapter-4-relational-model$dby11312$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11313$Null Values$dby11313$, $dby11314$null-values$dby11314$, '', 10, 'published', true, true, $dby11315$dbms_sql_tutorial$dby11315$, $dby11316$chapter-4-relational-model/null-values$dby11316$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11317$dbms_sql_tutorial$dby11317$ and source_ref = $dby11318$chapter-4-relational-model/null-values$dby11318$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11319$Null Values$dby11319$, $dby11320$### Definition
A **NULL** value represents a missing, unknown, inapplicable, or not-yet-recorded value for an attribute in a tuple. Formally, NULL is **not a member of any domain** — it is a special marker denoting the absence of a value, distinct from zero, an empty string, or any other "real" value.

### Example
If Karan hasn't declared a department yet, his tuple might be `(4, Karan, NULL, 6.8)`. If a newly enrolled student has no GPA yet (no exams taken), `(5, Priya, CS, NULL)` is a valid tuple — the `gpa` attribute simply has no value recorded.

### How NULL breaks relation purity
Strict relational theory defines a relation as a SET of tuples, meaning duplicates are impossible and tuple equality is always well-defined. NULL undermines this cleanliness:
- Two tuples that both contain NULL in the same attribute position cannot be reliably compared for equality. Under three-valued logic, `NULL = NULL` evaluates to **UNKNOWN**, not TRUE. This means the very notion of "duplicate tuple" — which underpins the definition of a relation as a set — becomes ambiguous whenever NULLs are involved. Two "identical-looking" tuples that each carry NULL in different (or the same) attribute positions are still treated as logically distinct rows by most systems, precisely because equality can't be established.
- This is why relational purists (e.g., C. J. Date) criticize NULL as inconsistent with the clean set-theoretic foundation of the relational model — even though virtually every real-world DBMS supports it.

### Kinds of NULL (conceptually)
- **Missing but applicable**: the value exists in reality but just hasn't been recorded yet (e.g., gpa before the first exam).
- **Missing and inapplicable**: the value doesn't make sense for this tuple (e.g., a "spouse_name" attribute for an unmarried person).
Most DBMSs do not distinguish these kinds internally — both are stored using the same single NULL marker.

### Edge Cases
- Aggregate functions such as `SUM`, `AVG`, and `COUNT(column)` **skip** NULLs rather than treating them as zero — this can silently produce misleading averages if not accounted for.
- A `UNIQUE` constraint typically allows *multiple* NULLs in the same column, because NULL is not considered equal to another NULL for uniqueness-checking purposes — another practical departure from pure set semantics.
- A primary-key attribute may **never** be NULL (the entity integrity rule) — precisely because keys must reliably distinguish every tuple, which NULL's ambiguous equality would undermine.

### Key Takeaways / Q&A
**Q: Does `WHERE gpa = NULL` ever return true?**
A: No — NULL comparisons always yield UNKNOWN; you must use `IS NULL` instead.

**Q: Why can't a primary key column contain NULL?**
A: Because a key's entire purpose is to uniquely identify each tuple, and NULL's ambiguous equality semantics would make uniqueness/identity undecidable.$dby11320$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11321$dbms_sql_tutorial_seed$dby11321$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11322$dbms_sql_tutorial_seed$dby11322$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11323$dbms-sql-tutorial$dby11323$),
     t as (select id from public.learning_topics where source_kind = $dby11324$dbms_sql_tutorial$dby11324$ and source_ref = $dby11325$chapter-4-relational-model/null-values$dby11325$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11326$pt-dbms-sql-4-null-values$dby11326$, $dby11327$Null Values - Quick Test$dby11327$, 'aptitude', 8, 8,
  $dby11328$8 questions on Null Values.$dby11328$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11329$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11329$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11330$tq-dbms-sql-4-null-values-1$dby11330$, $dby11331$pt-dbms-sql-4-null-values$dby11331$,
   $dby11332$What does a NULL value represent in a relation?$dby11332$,
   $dby11333$["The number zero", "A missing, unknown, or inapplicable value \u2014 not a member of any domain", "An empty string", "The average of all other values in that column"]$dby11333$::jsonb,
   1, $dby11334$NULL is a special marker for absent/unknown data, distinct from any real domain value including 0 or an empty string.$dby11334$, 1, 0),
  ($dby11335$tq-dbms-sql-4-null-values-2$dby11335$, $dby11336$pt-dbms-sql-4-null-values$dby11336$,
   $dby11337$Is NULL considered a value drawn from an attribute's domain?$dby11337$,
   $dby11338$["Yes, every domain implicitly includes NULL", "No, NULL is not a member of any domain \u2014 it marks the absence of a value", "Only for numeric domains", "Only if explicitly declared NOT NULL"]$dby11338$::jsonb,
   1, $dby11339$NULL sits outside all domains; it denotes missing data rather than a legitimate domain value.$dby11339$, 1, 1),
  ($dby11340$tq-dbms-sql-4-null-values-3$dby11340$, $dby11341$pt-dbms-sql-4-null-values$dby11341$,
   $dby11342$What does the expression WHERE gpa = NULL evaluate to in SQL, regardless of actual data?$dby11342$,
   $dby11343$["TRUE for rows where gpa is NULL", "UNKNOWN, so it never matches any row (IS NULL must be used instead)", "FALSE always", "A syntax error that halts the query"]$dby11343$::jsonb,
   1, $dby11344$Comparisons with NULL yield UNKNOWN under three-valued logic, so '= NULL' never returns rows; 'IS NULL' is the correct construct.$dby11344$, 1, 2),
  ($dby11345$tq-dbms-sql-4-null-values-4$dby11345$, $dby11346$pt-dbms-sql-4-null-values$dby11346$,
   $dby11347$How does NULL complicate the classical definition of a relation as a 'set of tuples with no duplicates'?$dby11347$,
   $dby11348$["It doesn't; NULL has no effect on set semantics", "Because NULL = NULL evaluates to UNKNOWN rather than TRUE, equality between tuples containing NULLs becomes ambiguous, undermining clean duplicate detection", "Because NULL always forces two tuples to be treated as identical", "Because NULL increases cardinality automatically"]$dby11348$::jsonb,
   1, $dby11349$Since NULL never compares as definitively equal to another NULL, the notion of 'duplicate tuple' (central to the set-based relation definition) becomes ambiguous.$dby11349$, 1, 3),
  ($dby11350$tq-dbms-sql-4-null-values-5$dby11350$, $dby11351$pt-dbms-sql-4-null-values$dby11351$,
   $dby11352$Why can a primary key attribute never be NULL (entity integrity)?$dby11352$,
   $dby11353$["Because NULL takes up more storage space", "Because a key must uniquely and reliably identify every tuple, and NULL's ambiguous equality would undermine that guarantee", "Because SQL syntax forbids it for performance reasons only", "Primary keys actually CAN be NULL in the relational model"]$dby11353$::jsonb,
   1, $dby11354$Entity integrity requires that primary keys always uniquely identify tuples; NULL's undecidable equality would break that guarantee.$dby11354$, 1, 4),
  ($dby11355$tq-dbms-sql-4-null-values-6$dby11355$, $dby11356$pt-dbms-sql-4-null-values$dby11356$,
   $dby11357$How do aggregate functions like SUM and AVG typically treat NULL values in a column?$dby11357$,
   $dby11358$["They treat NULL as zero", "They skip/ignore NULLs entirely when computing the aggregate", "They cause the query to fail", "They convert NULL to the column's maximum value"]$dby11358$::jsonb,
   1, $dby11359$Standard SQL aggregate functions ignore NULLs, which can affect results like AVG in ways that surprise users expecting NULL to count as 0.$dby11359$, 1, 5),
  ($dby11360$tq-dbms-sql-4-null-values-7$dby11360$, $dby11361$pt-dbms-sql-4-null-values$dby11361$,
   $dby11362$Does a UNIQUE constraint in most SQL databases typically allow more than one NULL in the same column?$dby11362$,
   $dby11363$["No, UNIQUE forbids any NULLs at all", "Yes, because NULL is not considered equal to another NULL for uniqueness checks, multiple NULLs are usually allowed", "No, only exactly one NULL is ever allowed", "Yes, but only if the column is also the primary key"]$dby11363$::jsonb,
   1, $dby11364$Since NULL <> NULL under three-valued logic, most DBMSs permit multiple NULLs in a UNIQUE column — a practical departure from pure set semantics.$dby11364$, 1, 6),
  ($dby11365$tq-dbms-sql-4-null-values-8$dby11365$, $dby11366$pt-dbms-sql-4-null-values$dby11366$,
   $dby11367$Which of these best distinguishes 'missing but applicable' from 'missing and inapplicable' NULLs?$dby11367$,
   $dby11368$["SQL stores them using two different NULL markers", "Conceptually, one means the value exists in reality but isn't recorded yet, while the other means the attribute doesn't apply at all to this tuple \u2014 though most DBMSs store both identically as one NULL marker", "Missing but applicable NULLs are never allowed in primary keys, while inapplicable NULLs are", "There is no conceptual difference between the two"]$dby11368$::jsonb,
   1, $dby11369$The two are a useful conceptual distinction, but nearly all real DBMSs represent both cases with the same single NULL marker internally.$dby11369$, 1, 7)
on conflict (id) do nothing;

-- 4.11 Relational Integrity
with g as (select id from public.learning_grids where lower(slug) = $dby11370$dbms-sql-tutorial$dby11370$),
     s as (select id from public.learning_sections where lower(slug) = $dby11371$chapter-4-relational-model$dby11371$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11372$Relational Integrity$dby11372$, $dby11373$relational-integrity$dby11373$, '', 11, 'published', true, true, $dby11374$dbms_sql_tutorial$dby11374$, $dby11375$chapter-4-relational-model/relational-integrity$dby11375$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11376$dbms_sql_tutorial$dby11376$ and source_ref = $dby11377$chapter-4-relational-model/relational-integrity$dby11377$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11378$Relational Integrity$dby11378$, $dby11379$### Definition
**Relational integrity** refers to the set of rules (integrity constraints) that a legal database instance must always satisfy so that the data remains accurate, consistent, and meaningful. The three foundational rules in the classical relational model are **Domain Integrity**, **Entity Integrity**, and **Referential Integrity** (additional user-defined/business constraints may also apply).

### The Core Rules, using the running example
- **Domain Integrity**: every attribute value must belong to its declared domain — e.g., `gpa` must be a decimal in [0.0, 10.0]; storing `"A+"` in `gpa` would violate domain integrity.
- **Entity Integrity**: no attribute that is part of a primary key may be NULL, and every tuple must be uniquely identifiable — e.g., `id` in Students can never be NULL or duplicated.
- **Referential Integrity**: a foreign key value must either be NULL (if permitted) or match an existing primary key value in the referenced relation — e.g., if `Enrollments.student_id` references `Students.id`, every enrollment must point to a genuinely existing student.

### How this differs from "Relational Model Rules" (its closest sibling)
**Relational Integrity** is specifically about the constraint rules that keep DATA VALID (domain/entity/referential integrity plus optional business rules). **Relational Model Rules** (Codd's 12 Rules, the next topic) is a much broader term describing what makes an entire DBMS "truly relational" — integrity is just one piece (roughly Codd's Rule 10) of that larger checklist, which also covers things like systematic NULL treatment, catalog access, view updating, and distribution independence.

### Edge Cases
- Referential integrity violations are commonly handled via `ON DELETE` / `ON UPDATE` actions (`CASCADE`, `SET NULL`, `RESTRICT`) — the *rule itself* is always enforced, but its *resolution strategy* is configurable by the schema designer.
- Domain integrity failures are usually caught automatically at insert/update time by the DBMS's type system (e.g., inserting a string into an integer column), but business-level domain restrictions (like "gpa must be ≥ 0") often require an explicit `CHECK` constraint.
- A self-referencing foreign key (e.g., an `advisor_id` in Students that references `Students.id`) still must satisfy referential integrity — against the very same table.

### Key Takeaways / Q&A
**Q: Which integrity rule is violated if an Enrollments row has `student_id = 999` but no student with id 999 exists?**
A: Referential integrity.

**Q: Which integrity rule is violated if a Students row has `id = NULL`?**
A: Entity integrity (the primary key can never be NULL).$dby11379$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11380$dbms_sql_tutorial_seed$dby11380$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11381$dbms_sql_tutorial_seed$dby11381$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11382$dbms-sql-tutorial$dby11382$),
     t as (select id from public.learning_topics where source_kind = $dby11383$dbms_sql_tutorial$dby11383$ and source_ref = $dby11384$chapter-4-relational-model/relational-integrity$dby11384$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11385$pt-dbms-sql-4-relational-integrity$dby11385$, $dby11386$Relational Integrity - Quick Test$dby11386$, 'aptitude', 8, 8,
  $dby11387$8 questions on Relational Integrity.$dby11387$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11388$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11388$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11389$tq-dbms-sql-4-relational-integrity-1$dby11389$, $dby11390$pt-dbms-sql-4-relational-integrity$dby11390$,
   $dby11391$What is relational integrity?$dby11391$,
   $dby11392$["A performance-tuning technique", "The set of rules (domain, entity, referential, and business constraints) that a legal database instance must satisfy", "A synonym for relation schema", "A method for compressing table storage"]$dby11392$::jsonb,
   1, $dby11393$Relational integrity is the collection of constraint rules ensuring data remains accurate and consistent.$dby11393$, 1, 0),
  ($dby11394$tq-dbms-sql-4-relational-integrity-2$dby11394$, $dby11395$pt-dbms-sql-4-relational-integrity$dby11395$,
   $dby11396$Which integrity rule requires that every attribute value belong to its declared type/range of legal values?$dby11396$,
   $dby11397$["Entity integrity", "Referential integrity", "Domain integrity", "Codd's Rule 12"]$dby11397$::jsonb,
   2, $dby11398$Domain integrity ensures values stored in an attribute always come from its declared domain.$dby11398$, 1, 1),
  ($dby11399$tq-dbms-sql-4-relational-integrity-3$dby11399$, $dby11400$pt-dbms-sql-4-relational-integrity$dby11400$,
   $dby11401$Which integrity rule specifically forbids NULL in a primary key column?$dby11401$,
   $dby11402$["Domain integrity", "Entity integrity", "Referential integrity", "Business-rule integrity"]$dby11402$::jsonb,
   1, $dby11403$Entity integrity guarantees every tuple is uniquely identifiable, which requires primary key attributes to never be NULL.$dby11403$, 1, 2),
  ($dby11404$tq-dbms-sql-4-relational-integrity-4$dby11404$, $dby11405$pt-dbms-sql-4-relational-integrity$dby11405$,
   $dby11406$An Enrollments row references student_id = 999, but no such student exists in Students. Which integrity rule is violated?$dby11406$,
   $dby11407$["Domain integrity", "Entity integrity", "Referential integrity", "None, this is allowed"]$dby11407$::jsonb,
   2, $dby11408$Referential integrity requires foreign key values to match an existing primary key (or be NULL if allowed); a dangling reference violates it.$dby11408$, 1, 3),
  ($dby11409$tq-dbms-sql-4-relational-integrity-5$dby11409$, $dby11410$pt-dbms-sql-4-relational-integrity$dby11410$,
   $dby11411$Storing the string 'A+' in the gpa column (declared as decimal(3,1)) would violate which rule?$dby11411$,
   $dby11412$["Referential integrity", "Domain integrity", "Entity integrity", "Codd's Rule 6"]$dby11412$::jsonb,
   1, $dby11413$The value doesn't belong to gpa's declared decimal domain, so this is a domain integrity violation.$dby11413$, 1, 4),
  ($dby11414$tq-dbms-sql-4-relational-integrity-6$dby11414$, $dby11415$pt-dbms-sql-4-relational-integrity$dby11415$,
   $dby11416$How does Relational Integrity differ from Relational Model Rules (Codd's 12 Rules)?$dby11416$,
   $dby11417$["They are identical concepts with different names", "Relational Integrity is specifically about data-validity rules (domain/entity/referential); Relational Model Rules is the much broader checklist for what makes a whole DBMS 'truly relational'", "Relational Model Rules only apply to NULL handling", "Relational Integrity covers catalog and view-updating behavior, while Relational Model Rules covers only keys"]$dby11417$::jsonb,
   1, $dby11418$Integrity is a narrow, data-focused concern; Codd's Rules is a comprehensive DBMS-evaluation framework that integrity is only one part of.$dby11418$, 1, 5),
  ($dby11419$tq-dbms-sql-4-relational-integrity-7$dby11419$, $dby11420$pt-dbms-sql-4-relational-integrity$dby11420$,
   $dby11421$ON DELETE CASCADE configured on a foreign key relates to which integrity concept?$dby11421$,
   $dby11422$["It is one possible resolution strategy for maintaining referential integrity when a referenced row is deleted", "It enforces domain integrity", "It has nothing to do with integrity, only performance", "It removes the need for a primary key"]$dby11422$::jsonb,
   0, $dby11423$CASCADE, SET NULL, and RESTRICT are configurable strategies for how the DBMS maintains referential integrity on deletes/updates.$dby11423$, 1, 6),
  ($dby11424$tq-dbms-sql-4-relational-integrity-8$dby11424$, $dby11425$pt-dbms-sql-4-relational-integrity$dby11425$,
   $dby11426$A self-referencing foreign key, such as advisor_id in Students pointing to Students.id, must satisfy:$dby11426$,
   $dby11427$["No integrity rules, since it references the same table", "Referential integrity against the same Students table it belongs to", "Only entity integrity, not referential integrity", "Domain integrity only, since it's an integer"]$dby11427$::jsonb,
   1, $dby11428$Even a self-referencing foreign key must still point to an existing (or NULL) value in the referenced table's primary key — referential integrity applies regardless of whether the two relations are the same table.$dby11428$, 1, 7)
on conflict (id) do nothing;

-- 4.12 Relational Model Rules
with g as (select id from public.learning_grids where lower(slug) = $dby11429$dbms-sql-tutorial$dby11429$),
     s as (select id from public.learning_sections where lower(slug) = $dby11430$chapter-4-relational-model$dby11430$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11431$Relational Model Rules$dby11431$, $dby11432$relational-model-rules$dby11432$, '', 12, 'published', true, true, $dby11433$dbms_sql_tutorial$dby11433$, $dby11434$chapter-4-relational-model/relational-model-rules$dby11434$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11435$dbms_sql_tutorial$dby11435$ and source_ref = $dby11436$chapter-4-relational-model/relational-model-rules$dby11436$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11437$Relational Model Rules$dby11437$, $dby11438$### Definition
"Relational Model Rules" most commonly refers to **Codd's 12 Rules** (numbered 0 through 12), proposed by Dr. E. F. Codd in 1985 as a benchmark for how "truly relational" a database management system is. **Rule 0** is the foundational requirement that a system must manage data exclusively through its relational capabilities; **Rules 1-12** elaborate specific, testable requirements built on that foundation.

### The 12 Rules (summary)
0. **Foundation Rule** — the system must use only relational means to manage data.
1. **Information Rule** — all data is represented as values in tables (relations), nothing else.
2. **Guaranteed Access Rule** — every value must be accessible via table name + primary key value + column name.
3. **Systematic Treatment of Null Values** — NULLs must be handled consistently and distinctly from all other values, regardless of data type.
4. **Active/Dynamic Online Catalog** — the database's own structure (metadata) must itself be stored as relations, queryable with the same language.
5. **Comprehensive Data Sublanguage Rule** — one well-defined language must support data definition, manipulation, integrity, and transaction control.
6. **View Updating Rule** — all theoretically updatable views must be updatable by the system.
7. **High-level Insert/Update/Delete** — set-at-a-time operations must be supported, not just row-at-a-time.
8. **Physical Data Independence** — applications/queries are unaffected by changes to physical storage.
9. **Logical Data Independence** — applications/queries are unaffected by certain logical schema changes (e.g., splitting a table).
10. **Integrity Independence** — integrity constraints are defined in the data sublanguage/catalog, not embedded in application code.
11. **Distribution Independence** — data distribution across multiple sites is invisible to users.
12. **Non-subversion Rule** — if a low-level/record-at-a-time interface exists, it cannot bypass the integrity rules enforced at the relational level.

### How this differs from Relational Integrity (its closest sibling)
**Relational Integrity** is just one narrow slice (rooted mainly in Rule 3 and Rule 10) about keeping data valid via domain/entity/referential rules. **Relational Model Rules** (Codd's 12 Rules) is the full, much broader checklist for evaluating whether an ENTIRE DBMS PRODUCT correctly and completely implements the relational model — covering query language, catalog, views, physical/logical independence, and distribution, not just data validity.

### Edge Cases
- No commercial DBMS, including major SQL products, fully satisfies all 12 rules to the letter — they are treated as an ideal benchmark, not a strict pass/fail certification.
- **Rule 3** (systematic NULL treatment) directly underpins the *Null Values* topic — it would be a rule violation if a system treated NULL inconsistently across data types (e.g., allowing NULL for integers but silently coercing it to `0` for strings).
- SQL's "row-at-a-time" cursor operations coexist peacefully with **Rule 7** (set-at-a-time), because SQL also fully supports set-based statements. Codd's rule requires that the set-based capability *exist*, not that row-based access be banned outright.

### Key Takeaways / Q&A
**Q: Is Rule 0 the same as Rule 1?**
A: No — Rule 0 is the overarching foundation ("the system must be relational"), while Rule 1 specifically requires all data to be represented as values within tables.

**Q: Which rule most directly overlaps with the topic of Relational Integrity?**
A: Rule 10, Integrity Independence, which requires that integrity constraints be definable and enforceable independently of application programs.$dby11438$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11439$dbms_sql_tutorial_seed$dby11439$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11440$dbms_sql_tutorial_seed$dby11440$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11441$dbms-sql-tutorial$dby11441$),
     t as (select id from public.learning_topics where source_kind = $dby11442$dbms_sql_tutorial$dby11442$ and source_ref = $dby11443$chapter-4-relational-model/relational-model-rules$dby11443$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11444$pt-dbms-sql-4-relational-model-rules$dby11444$, $dby11445$Relational Model Rules - Quick Test$dby11445$, 'aptitude', 8, 8,
  $dby11446$8 questions on Relational Model Rules.$dby11446$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11447$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11447$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11448$tq-dbms-sql-4-relational-model-rules-1$dby11448$, $dby11449$pt-dbms-sql-4-relational-model-rules$dby11449$,
   $dby11450$What are 'Relational Model Rules' most commonly a reference to?$dby11450$,
   $dby11451$["The SQL-92 standard syntax", "Codd's 12 Rules (numbered 0-12), a benchmark for how relational a DBMS truly is", "A list of NULL-handling functions", "The set of ANSI-approved data types"]$dby11451$::jsonb,
   1, $dby11452$This term refers to E. F. Codd's 12 Rules proposed in 1985 to evaluate whether a DBMS is genuinely relational.$dby11452$, 1, 0),
  ($dby11453$tq-dbms-sql-4-relational-model-rules-2$dby11453$, $dby11454$pt-dbms-sql-4-relational-model-rules$dby11454$,
   $dby11455$What does Rule 1 (the Information Rule) require?$dby11455$,
   $dby11456$["All data must be represented as values within tables (relations), and nothing else", "Every query must run in under 1 second", "NULLs must never be used", "Foreign keys are mandatory on every table"]$dby11456$::jsonb,
   0, $dby11457$The Information Rule states that all information in a relational database is represented explicitly as values in relations.$dby11457$, 1, 1),
  ($dby11458$tq-dbms-sql-4-relational-model-rules-3$dby11458$, $dby11459$pt-dbms-sql-4-relational-model-rules$dby11459$,
   $dby11460$Which rule requires that NULL values be handled consistently, distinct from all other values, regardless of data type?$dby11460$,
   $dby11461$["Rule 1", "Rule 3, Systematic Treatment of Null Values", "Rule 8", "Rule 11"]$dby11461$::jsonb,
   1, $dby11462$Rule 3 specifically mandates uniform, type-independent treatment of NULLs across the DBMS.$dby11462$, 1, 2),
  ($dby11463$tq-dbms-sql-4-relational-model-rules-4$dby11463$, $dby11464$pt-dbms-sql-4-relational-model-rules$dby11464$,
   $dby11465$How does Relational Integrity differ from Relational Model Rules (Codd's 12 Rules)?$dby11465$,
   $dby11466$["They are the same list under different names", "Relational Integrity is a narrow set of data-validity rules; Relational Model Rules is a much broader checklist evaluating an entire DBMS's relational completeness", "Relational Model Rules apply only to NULL handling", "Relational Integrity is broader and includes catalog and distribution rules"]$dby11466$::jsonb,
   1, $dby11467$Integrity (domain/entity/referential) is only a small part of the much larger 12-rule DBMS evaluation framework.$dby11467$, 1, 3),
  ($dby11468$tq-dbms-sql-4-relational-model-rules-5$dby11468$, $dby11469$pt-dbms-sql-4-relational-model-rules$dby11469$,
   $dby11470$Which rule requires that the database's own structural metadata (its catalog) be stored and queryable as relations, using the same query language?$dby11470$,
   $dby11471$["Rule 2, Guaranteed Access", "Rule 4, Active/Dynamic Online Catalog", "Rule 6, View Updating", "Rule 9, Logical Data Independence"]$dby11471$::jsonb,
   1, $dby11472$Rule 4 requires the catalog (schema metadata) to be represented relationally and queried the same way as ordinary data.$dby11472$, 1, 4),
  ($dby11473$tq-dbms-sql-4-relational-model-rules-6$dby11473$, $dby11474$pt-dbms-sql-4-relational-model-rules$dby11474$,
   $dby11475$Does any major commercial SQL DBMS fully satisfy all 12 of Codd's Rules to the letter?$dby11475$,
   $dby11476$["Yes, all ANSI-SQL-compliant databases satisfy every rule perfectly", "No \u2014 the rules are treated as an ideal benchmark, and no commercial product fully satisfies all of them", "Only NoSQL databases satisfy all 12 rules", "Only Rule 0 is ever satisfied by any DBMS"]$dby11476$::jsonb,
   1, $dby11477$Codd's 12 Rules are widely regarded as an aspirational benchmark; in practice no commercial DBMS meets every rule completely.$dby11477$, 1, 5),
  ($dby11478$tq-dbms-sql-4-relational-model-rules-7$dby11478$, $dby11479$pt-dbms-sql-4-relational-model-rules$dby11479$,
   $dby11480$Rule 7 requires support for high-level, set-at-a-time insert/update/delete operations. Does this mean row-at-a-time cursor processing is forbidden?$dby11480$,
   $dby11481$["Yes, cursors violate Rule 7 and cannot exist in a relational DBMS", "No \u2014 Rule 7 only requires that set-based operations be SUPPORTED; it does not forbid also offering row-at-a-time access", "Rule 7 has nothing to do with insert/update/delete", "Rule 7 only applies to SELECT statements"]$dby11481$::jsonb,
   1, $dby11482$Codd's Rule 7 mandates the availability of set-based operations; it doesn't prohibit additionally supporting row-at-a-time mechanisms like cursors.$dby11482$, 1, 6),
  ($dby11483$tq-dbms-sql-4-relational-model-rules-8$dby11483$, $dby11484$pt-dbms-sql-4-relational-model-rules$dby11484$,
   $dby11485$Which rule most directly overlaps with the concept of Relational Integrity (defining constraints independently of application code)?$dby11485$,
   $dby11486$["Rule 5, Comprehensive Data Sublanguage", "Rule 10, Integrity Independence", "Rule 12, Non-subversion", "Rule 8, Physical Data Independence"]$dby11486$::jsonb,
   1, $dby11487$Rule 10 specifically requires that integrity constraints be definable in the data sublanguage/catalog rather than hard-coded into application programs.$dby11487$, 1, 7)
on conflict (id) do nothing;

-- 4.13 Keys in the Relational Model
with g as (select id from public.learning_grids where lower(slug) = $dby11488$dbms-sql-tutorial$dby11488$),
     s as (select id from public.learning_sections where lower(slug) = $dby11489$chapter-4-relational-model$dby11489$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11490$Keys in the Relational Model$dby11490$, $dby11491$keys-in-the-relational-model$dby11491$, '', 13, 'published', true, true, $dby11492$dbms_sql_tutorial$dby11492$, $dby11493$chapter-4-relational-model/keys-in-the-relational-model$dby11493$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11494$dbms_sql_tutorial$dby11494$ and source_ref = $dby11495$chapter-4-relational-model/keys-in-the-relational-model$dby11495$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11496$Keys in the Relational Model$dby11496$, $dby11497$### Definition
A **key** is one attribute or a minimal set of attributes whose values uniquely identify each tuple in a relation. Different key types serve different roles:
- **Super Key**: any set of attributes that uniquely identifies a tuple (may contain extra, unnecessary attributes).
- **Candidate Key**: a MINIMAL super key — no attribute can be removed from it without losing the uniqueness guarantee.
- **Primary Key**: the candidate key chosen by the designer as the main identifier; it can never be NULL (entity integrity).
- **Alternate Key**: any candidate key that was NOT chosen as the primary key.
- **Foreign Key**: an attribute (or set) in one relation that references the primary key of another (possibly the same) relation, enforcing referential integrity.
- **Composite Key**: a key made of two or more attributes together (needed only when no single attribute is unique on its own).

### Example
In `Students(id, name, department, gpa)`:
- `{id}` is a candidate key (assuming ids are unique and never NULL) — and since it's the smallest such set, it's minimal.
- `{id, name}` is a super key (it also uniquely identifies tuples) but NOT a candidate key, because it isn't minimal — `{id}` alone already suffices.
- If `email` is also unique per student, `{email}` is another candidate key → `{id}` is chosen as **Primary Key**, and `{email}` becomes an **Alternate Key**.
- In `Enrollments(student_id, course_id, grade)`, `{student_id, course_id}` is a **Composite Key** (neither attribute alone is unique, but the pair is), and `student_id` is also a **Foreign Key** referencing `Students.id`.

### How this differs from Relational Integrity (its closest sibling)
Keys are the STRUCTURAL MECHANISM — which attributes get special uniqueness/reference status. Relational Integrity is the RULE that USES that mechanism: entity integrity requires primary keys to be non-NULL and unique; referential integrity requires foreign key values to match existing primary keys. You cannot state or enforce entity/referential integrity without first having defined keys — keys are the "nouns," integrity rules are the "verbs" that act on them.

### Edge Cases
- A relation can lack a *declared* candidate key only in a loose, practical sense — since a relation is a set (no duplicate tuples by definition), the full set of ALL its attributes is always trivially a super key. A "keyless" table one sees in practice (e.g., raw log data with genuinely duplicate SQL rows) is technically not a pure relation.
- A composite key's individual attributes may repeat across many rows (`student_id` repeats across many enrollments) — only the COMBINATION must be unique.
- A foreign key MAY be NULL (e.g., an optional `advisor_id`), even though the primary key it references can never be NULL — these follow different integrity rules (referential vs. entity integrity).

### Key Takeaways / Q&A
**Q: Is every candidate key also a super key?**
A: Yes — every candidate key is a super key, but not every super key is a candidate key (only minimal ones qualify as candidate keys).

**Q: Can a table have more than one candidate key but only one primary key?**
A: Yes — all unchosen candidate keys become alternate keys; exactly one candidate key is designated as the primary key.$dby11497$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11498$dbms_sql_tutorial_seed$dby11498$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11499$dbms_sql_tutorial_seed$dby11499$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11500$dbms-sql-tutorial$dby11500$),
     t as (select id from public.learning_topics where source_kind = $dby11501$dbms_sql_tutorial$dby11501$ and source_ref = $dby11502$chapter-4-relational-model/keys-in-the-relational-model$dby11502$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11503$pt-dbms-sql-4-keys-in-the-relational-model$dby11503$, $dby11504$Keys in the Relational Model - Quick Test$dby11504$, 'aptitude', 8, 8,
  $dby11505$8 questions on Keys in the Relational Model.$dby11505$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11506$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11506$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11507$tq-dbms-sql-4-keys-in-the-relational-model-1$dby11507$, $dby11508$pt-dbms-sql-4-keys-in-the-relational-model$dby11508$,
   $dby11509$What is a key in the relational model?$dby11509$,
   $dby11510$["Any attribute with a numeric domain", "An attribute or minimal set of attributes whose values uniquely identify each tuple in a relation", "The first column defined in a CREATE TABLE statement", "A synonym for attribute"]$dby11510$::jsonb,
   1, $dby11511$A key is defined by its ability to uniquely identify tuples, using a minimal set of attributes.$dby11511$, 1, 0),
  ($dby11512$tq-dbms-sql-4-keys-in-the-relational-model-2$dby11512$, $dby11513$pt-dbms-sql-4-keys-in-the-relational-model$dby11513$,
   $dby11514$In Students(id, name, department, gpa), assuming id values are unique and never NULL, what kind of key is {id}?$dby11514$,
   $dby11515$["A foreign key", "A candidate key", "A composite key only", "Not a key at all"]$dby11515$::jsonb,
   1, $dby11516${id} uniquely identifies every tuple and is minimal (no attribute can be removed), making it a candidate key.$dby11516$, 1, 1),
  ($dby11517$tq-dbms-sql-4-keys-in-the-relational-model-3$dby11517$, $dby11518$pt-dbms-sql-4-keys-in-the-relational-model$dby11518$,
   $dby11519$What distinguishes a Super Key from a Candidate Key?$dby11519$,
   $dby11520$["A super key must contain exactly one attribute; a candidate key can contain many", "A super key is any uniquely-identifying set of attributes (possibly with extras); a candidate key is a MINIMAL such set", "They are the same thing", "A candidate key can allow duplicate values; a super key cannot"]$dby11520$::jsonb,
   1, $dby11521$Every candidate key is a super key, but a candidate key additionally must be minimal — no attribute can be dropped without losing uniqueness.$dby11521$, 1, 2),
  ($dby11522$tq-dbms-sql-4-keys-in-the-relational-model-4$dby11522$, $dby11523$pt-dbms-sql-4-keys-in-the-relational-model$dby11523$,
   $dby11524$If {email} is also unique per student in addition to {id}, and {id} is chosen as the primary key, what does {email} become?$dby11524$,
   $dby11525$["A foreign key", "An alternate key", "A composite key", "It is no longer a valid key"]$dby11525$::jsonb,
   1, $dby11526$A candidate key not selected as the primary key is called an alternate key.$dby11526$, 1, 3),
  ($dby11527$tq-dbms-sql-4-keys-in-the-relational-model-5$dby11527$, $dby11528$pt-dbms-sql-4-keys-in-the-relational-model$dby11528$,
   $dby11529$In Enrollments(student_id, course_id, grade), where neither student_id nor course_id alone is unique but the pair is, {student_id, course_id} is an example of:$dby11529$,
   $dby11530$["A candidate key that happens to be a composite key", "A foreign key only, not a key at all", "A domain constraint", "An attribute"]$dby11530$::jsonb,
   0, $dby11531$Since the combination is minimal and uniquely identifies each enrollment tuple, it is a candidate key that is composite (made of more than one attribute).$dby11531$, 1, 4),
  ($dby11532$tq-dbms-sql-4-keys-in-the-relational-model-6$dby11532$, $dby11533$pt-dbms-sql-4-keys-in-the-relational-model$dby11533$,
   $dby11534$How do Keys differ conceptually from Relational Integrity rules?$dby11534$,
   $dby11535$["They are identical concepts", "Keys are the structural mechanism (which attributes provide uniqueness/reference); integrity rules (entity/referential) are the constraints that act upon those keys", "Integrity rules define which attributes are keys", "Keys only matter for foreign key relationships, never for primary keys"]$dby11535$::jsonb,
   1, $dby11536$Keys are the structural building blocks; integrity rules (entity, referential) are the enforcement rules built on top of keys.$dby11536$, 1, 5),
  ($dby11537$tq-dbms-sql-4-keys-in-the-relational-model-7$dby11537$, $dby11538$pt-dbms-sql-4-keys-in-the-relational-model$dby11538$,
   $dby11539$Can a foreign key attribute contain NULL even though the primary key it references cannot?$dby11539$,
   $dby11540$["No, foreign keys follow the exact same NULL restriction as primary keys", "Yes \u2014 an optional foreign key like advisor_id can be NULL, since referential integrity and entity integrity are different rules with different NULL requirements", "No, this would always violate referential integrity", "Yes, but only if the foreign key is also composite"]$dby11540$::jsonb,
   1, $dby11541$Entity integrity forbids NULL primary keys, but referential integrity typically permits a NULL foreign key (meaning 'no reference'), unless declared NOT NULL.$dby11541$, 1, 6),
  ($dby11542$tq-dbms-sql-4-keys-in-the-relational-model-8$dby11542$, $dby11543$pt-dbms-sql-4-keys-in-the-relational-model$dby11543$,
   $dby11544$Is {id, name} a candidate key for Students, given that {id} alone already uniquely identifies each tuple?$dby11544$,
   $dby11545$["Yes, because it also uniquely identifies tuples", "No \u2014 it is a super key but not a candidate key, since it is not minimal ({id} alone already suffices)", "No, it isn't even a super key", "Yes, and it is the only candidate key possible"]$dby11545$::jsonb,
   1, $dby11546${id, name} does identify tuples uniquely, but since {id} alone is sufficient, adding 'name' violates minimality, so {id, name} is a super key, not a candidate key.$dby11546$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 5: Keys and Integrity
-- ---------------------------------------------------------------------------
-- 5.1 Super Key
with g as (select id from public.learning_grids where lower(slug) = $dby11547$dbms-sql-tutorial$dby11547$),
     s as (select id from public.learning_sections where lower(slug) = $dby11548$chapter-5-keys-and-integrity$dby11548$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11549$Super Key$dby11549$, $dby11550$super-key$dby11550$, '', 1, 'published', true, true, $dby11551$dbms_sql_tutorial$dby11551$, $dby11552$chapter-5-keys-and-integrity/super-key$dby11552$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11553$dbms_sql_tutorial$dby11553$ and source_ref = $dby11554$chapter-5-keys-and-integrity/super-key$dby11554$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11555$Super Key$dby11555$, $dby11556$### Definition

A **super key** is any set of one or more attributes that, together, uniquely identify every tuple (row) in a relation. It is the loosest, most permissive notion of "uniqueness" in the relational model — every other kind of key in this chapter is a specific, more disciplined *kind* of super key.

### How It Works

Running example used throughout this chapter — a `students(id, name, email, department_id)` table:

| id | name  | email           | department_id |
|----|-------|-----------------|----------------|
| 1  | Asha  | asha@co.com     | 1              |
| 2  | Rohan | rohan@co.com    | 1              |
| 3  | Neha  | neha@co.com     | 2              |

For the `students` table, all of the following are valid super keys:
- `{id}` — uniquely identifies every row.
- `{email}` — also uniquely identifies every row (assuming emails are distinct).
- `{id, name}` — still uniquely identifies every row (adding an extra column to an already-unique set can never break uniqueness).
- `{id, name, email, department_id}` — the entire row, trivially a super key (a full row is always unique unless the table allows exact duplicate rows).

Note that `{id, name}` is a super key but it is **not minimal** — `name` is redundant, since `{id}` alone already does the job. This is exactly the property that separates a super key from a candidate key (5.2): a candidate key is a super key with no redundant attribute.

### Edge Cases and Pitfalls

- Every relation has at least one super key — in the worst case, the set of *all* its attributes always qualifies (assuming no fully duplicate rows are allowed, which the relational model assumes by definition of a "set" of tuples).
- Adding ANY attribute to an existing super key always produces another, larger super key — this is why super keys are not unique by themselves; a table can have unboundedly many of them once you start combining.
- Confusing "a super key" with "the key" is a common beginner error — in casual conversation people usually mean *primary key* when they say "key," but formally, super key is the broadest category that primary key, candidate key, etc. all live inside.

### Key Takeaways

- A super key uniquely identifies rows, but may contain unnecessary extra attributes.
- Every candidate key, primary key, and alternate key is ALSO a super key — the reverse is not true.
- Super key is the umbrella concept; the rest of this chapter narrows it down.$dby11556$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11557$dbms_sql_tutorial_seed$dby11557$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11558$dbms_sql_tutorial_seed$dby11558$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11559$dbms-sql-tutorial$dby11559$),
     t as (select id from public.learning_topics where source_kind = $dby11560$dbms_sql_tutorial$dby11560$ and source_ref = $dby11561$chapter-5-keys-and-integrity/super-key$dby11561$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11562$pt-dbms-sql-5-super-key$dby11562$, $dby11563$Super Key - Quick Test$dby11563$, 'aptitude', 8, 8,
  $dby11564$8 questions on Super Key.$dby11564$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11565$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11565$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11566$tq-dbms-sql-5-super-key-1$dby11566$, $dby11567$pt-dbms-sql-5-super-key$dby11567$,
   $dby11568$What is a super key?$dby11568$,
   $dby11569$["Any set of attributes that uniquely identifies every row in a relation", "A key that is always exactly one column", "A key used only for foreign key relationships", "A key that can never be a primary key"]$dby11569$::jsonb,
   0, $dby11570$A super key is any attribute set — however large — that uniquely identifies each tuple.$dby11570$, 1, 0),
  ($dby11571$tq-dbms-sql-5-super-key-2$dby11571$, $dby11572$pt-dbms-sql-5-super-key$dby11572$,
   $dby11573$In students(id, name, email, department_id), is {id, name} a super key?$dby11573$,
   $dby11574$["No, because it contains two columns", "Yes \u2014 since {id} alone is already unique, adding name keeps it unique", "Only if name is also unique on its own", "It is a super key but never a candidate key... this is undecidable"]$dby11574$::jsonb,
   1, $dby11575$Adding any attribute to an already-unique set cannot break uniqueness, so {id, name} remains a super key.$dby11575$, 1, 1),
  ($dby11576$tq-dbms-sql-5-super-key-3$dby11576$, $dby11577$pt-dbms-sql-5-super-key$dby11577$,
   $dby11578$Why is {id, name} NOT considered minimal?$dby11578$,
   $dby11579$["Because id is redundant", "Because name is redundant \u2014 {id} alone is already sufficient to uniquely identify rows", "Because it has too few attributes", "Minimality doesn't apply to super keys"]$dby11579$::jsonb,
   1, $dby11580$Since id alone uniquely identifies rows, including name adds nothing — making the set non-minimal.$dby11580$, 1, 2),
  ($dby11581$tq-dbms-sql-5-super-key-4$dby11581$, $dby11582$pt-dbms-sql-5-super-key$dby11582$,
   $dby11583$Does every relation have at least one super key?$dby11583$,
   $dby11584$["No, some relations have none", "Yes \u2014 in the worst case, the set of all attributes qualifies", "Only relations with a declared PRIMARY KEY have one", "Only relations with fewer than 5 columns have one"]$dby11584$::jsonb,
   1, $dby11585$The full attribute set is always a valid (if not minimal) super key, assuming no duplicate rows.$dby11585$, 1, 3),
  ($dby11586$tq-dbms-sql-5-super-key-5$dby11586$, $dby11587$pt-dbms-sql-5-super-key$dby11587$,
   $dby11588$How many super keys can a single relation have?$dby11588$,
   $dby11589$["Always exactly one", "Always exactly two", "Potentially many \u2014 any superset of an existing super key is also one", "Zero, unless a PRIMARY KEY is declared"]$dby11589$::jsonb,
   2, $dby11590$Because adding attributes to a super key produces another super key, relations generally have many possible super keys.$dby11590$, 1, 4),
  ($dby11591$tq-dbms-sql-5-super-key-6$dby11591$, $dby11592$pt-dbms-sql-5-super-key$dby11592$,
   $dby11593$What is the relationship between a candidate key and a super key?$dby11593$,
   $dby11594$["They are unrelated concepts", "Every candidate key is a super key, but not every super key is a candidate key (it may not be minimal)", "Every super key is a candidate key", "Candidate keys can never be super keys"]$dby11594$::jsonb,
   1, $dby11595$A candidate key is specifically a MINIMAL super key — so the candidate-key set is a subset of the super-key set.$dby11595$, 1, 5),
  ($dby11596$tq-dbms-sql-5-super-key-7$dby11596$, $dby11597$pt-dbms-sql-5-super-key$dby11597$,
   $dby11598$In casual conversation, when someone says 'the key' of a table, what do they usually mean?$dby11598$,
   $dby11599$["A super key", "Formally this is ambiguous, but they usually mean the primary key specifically, not the broader super key concept", "They always mean every possible super key at once", "They mean a foreign key"]$dby11599$::jsonb,
   1, $dby11600$Casual usage of 'key' almost always refers to the primary key, even though formally 'key' concepts are broader (super key is the widest category).$dby11600$, 1, 6),
  ($dby11601$tq-dbms-sql-5-super-key-8$dby11601$, $dby11602$pt-dbms-sql-5-super-key$dby11602$,
   $dby11603$If {email} uniquely identifies every row in students, is {email, department_id} also a super key?$dby11603$,
   $dby11604$["No, adding department_id breaks uniqueness", "Yes, since {email} alone is already unique, any superset of it is also a super key", "Only if department_id is also independently unique", "This cannot be determined without seeing the data"]$dby11604$::jsonb,
   1, $dby11605$Once a set is unique, any superset remains unique — a direct consequence of the super key definition.$dby11605$, 1, 7)
on conflict (id) do nothing;

-- 5.2 Candidate Key
with g as (select id from public.learning_grids where lower(slug) = $dby11606$dbms-sql-tutorial$dby11606$),
     s as (select id from public.learning_sections where lower(slug) = $dby11607$chapter-5-keys-and-integrity$dby11607$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11608$Candidate Key$dby11608$, $dby11609$candidate-key$dby11609$, '', 2, 'published', true, true, $dby11610$dbms_sql_tutorial$dby11610$, $dby11611$chapter-5-keys-and-integrity/candidate-key$dby11611$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11612$dbms_sql_tutorial$dby11612$ and source_ref = $dby11613$chapter-5-keys-and-integrity/candidate-key$dby11613$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11614$Candidate Key$dby11614$, $dby11615$### Definition

A **candidate key** is a **minimal** super key — a set of attributes that uniquely identifies every row, where removing even one attribute from the set would destroy that uniqueness. A relation can have more than one candidate key; each one is a genuine "candidate" to become the table's primary key.

Running example used throughout this chapter — a `students(id, name, email, department_id)` table:

| id | name  | email           | department_id |
|----|-------|-----------------|----------------|
| 1  | Asha  | asha@co.com     | 1              |
| 2  | Rohan | rohan@co.com    | 1              |
| 3  | Neha  | neha@co.com     | 2              |

### How It Works

For `students(id, name, email, department_id)`, assuming both `id` and `email` are independently unique:
- `{id}` — a candidate key (minimal, unique).
- `{email}` — also a candidate key (minimal, unique) — a completely separate one from `{id}`.
- `{id, name}` — NOT a candidate key: it's a super key, but not minimal, since `{id}` alone already suffices.

When a table has more than one candidate key (here, `{id}` and `{email}`), the database designer picks ONE to be the actual **primary key** (5.3); the others remain candidate keys that didn't get chosen — these are sometimes specifically called **alternate keys** (5.4).

### Edge Cases and Pitfalls

- Minimality is checked attribute-by-attribute: `{student_id, course_id}` is minimal for an enrollments table only if neither `{student_id}` alone nor `{course_id}` alone is unique on its own — if either sub-part IS already unique by itself, the pair isn't minimal.
- A table can have zero natural candidate keys if the real-world data has no attribute or combination that's guaranteed unique — this is exactly the situation that motivates introducing a **surrogate key** (5.8) like an auto-incrementing id.
- Multiple candidate keys existing side by side is completely normal and often desirable (e.g. both an internal `id` and a business `email`/`SSN`/`ISBN` can each independently identify a row) — it's not a design smell.

### Key Takeaways

- Candidate key = minimal super key; a table can have several.
- Exactly one candidate key is chosen as the primary key; the rest are alternate keys.
- Minimality must be verified for every attribute in the set, not assumed.$dby11615$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11616$dbms_sql_tutorial_seed$dby11616$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11617$dbms_sql_tutorial_seed$dby11617$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11618$dbms-sql-tutorial$dby11618$),
     t as (select id from public.learning_topics where source_kind = $dby11619$dbms_sql_tutorial$dby11619$ and source_ref = $dby11620$chapter-5-keys-and-integrity/candidate-key$dby11620$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11621$pt-dbms-sql-5-candidate-key$dby11621$, $dby11622$Candidate Key - Quick Test$dby11622$, 'aptitude', 8, 8,
  $dby11623$8 questions on Candidate Key.$dby11623$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11624$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11624$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11625$tq-dbms-sql-5-candidate-key-1$dby11625$, $dby11626$pt-dbms-sql-5-candidate-key$dby11626$,
   $dby11627$What distinguishes a candidate key from a general super key?$dby11627$,
   $dby11628$["A candidate key must be exactly one column", "A candidate key is a MINIMAL super key \u2014 no attribute can be removed without losing uniqueness", "A candidate key can never be chosen as the primary key", "There is no difference"]$dby11628$::jsonb,
   1, $dby11629$Candidate key adds the minimality requirement on top of the super key's basic uniqueness requirement.$dby11629$, 1, 0),
  ($dby11630$tq-dbms-sql-5-candidate-key-2$dby11630$, $dby11631$pt-dbms-sql-5-candidate-key$dby11631$,
   $dby11632$If both {id} and {email} independently and uniquely identify rows in students, how many candidate keys does the table have?$dby11632$,
   $dby11633$["Zero", "Exactly one \u2014 you must pick just one", "Two \u2014 {id} and {email} are both separate candidate keys", "It depends on which one is declared PRIMARY KEY"]$dby11633$::jsonb,
   2, $dby11634$Both {id} and {email} are independently minimal and unique, so both qualify as candidate keys, regardless of which is later chosen as primary.$dby11634$, 1, 1),
  ($dby11635$tq-dbms-sql-5-candidate-key-3$dby11635$, $dby11636$pt-dbms-sql-5-candidate-key$dby11636$,
   $dby11637$What happens to candidate keys that are NOT chosen as the primary key?$dby11637$,
   $dby11638$["They cease to exist", "They remain valid candidate keys, often called alternate keys", "They automatically become foreign keys", "The database deletes those columns"]$dby11638$::jsonb,
   1, $dby11639$An unchosen candidate key doesn't disappear — it's simply referred to as an alternate key (topic 5.4).$dby11639$, 1, 2),
  ($dby11640$tq-dbms-sql-5-candidate-key-4$dby11640$, $dby11641$pt-dbms-sql-5-candidate-key$dby11641$,
   $dby11642$For {student_id, course_id} to be a minimal candidate key in an enrollments table, what must be true?$dby11642$,
   $dby11643$["Both student_id and course_id must be unique on their own", "Neither student_id alone nor course_id alone can already be unique by itself", "The table must have no other columns", "Enrollments must have exactly two rows"]$dby11643$::jsonb,
   1, $dby11644$Minimality requires that no proper subset of the key (here, neither single column) is already sufficient for uniqueness.$dby11644$, 1, 3),
  ($dby11645$tq-dbms-sql-5-candidate-key-5$dby11645$, $dby11646$pt-dbms-sql-5-candidate-key$dby11646$,
   $dby11647$What is a 'surrogate key' most directly motivated by?$dby11647$,
   $dby11648$["A legal requirement", "A situation where no natural attribute or combination is guaranteed to be a candidate key", "A performance optimization with no relation to uniqueness", "A requirement that every table have exactly two candidate keys"]$dby11648$::jsonb,
   1, $dby11649$When real-world data offers no reliable natural candidate key, an artificial surrogate key (like an auto-increment id) fills that role.$dby11649$, 1, 4),
  ($dby11650$tq-dbms-sql-5-candidate-key-6$dby11650$, $dby11651$pt-dbms-sql-5-candidate-key$dby11651$,
   $dby11652$Is having multiple candidate keys in one table considered a design flaw?$dby11652$,
   $dby11653$["Yes, always", "No \u2014 it's common and often desirable, e.g. an internal id plus a natural identifier like email or ISBN", "Only if there are more than 3", "Only for tables representing people"]$dby11653$::jsonb,
   1, $dby11654$Multiple legitimate ways to uniquely identify a row is normal and frequently useful, not a design problem.$dby11654$, 1, 5),
  ($dby11655$tq-dbms-sql-5-candidate-key-7$dby11655$, $dby11656$pt-dbms-sql-5-candidate-key$dby11656$,
   $dby11657$Which statement correctly relates candidate keys and super keys?$dby11657$,
   $dby11658$["All super keys are candidate keys", "All candidate keys are super keys, but only the minimal ones qualify as candidate keys", "Candidate keys and super keys are unrelated categories", "A table can have super keys but never candidate keys"]$dby11658$::jsonb,
   1, $dby11659$Candidate key is a strict, minimal subset of the broader super key category.$dby11659$, 1, 6),
  ($dby11660$tq-dbms-sql-5-candidate-key-8$dby11660$, $dby11661$pt-dbms-sql-5-candidate-key$dby11661$,
   $dby11662$Why might a table end up with ZERO natural candidate keys?$dby11662$,
   $dby11663$["This is mathematically impossible for any table", "Because no single attribute or combination of the real-world data happens to be guaranteed unique", "Because SQL forbids more than one candidate key", "Because the table has too few rows"]$dby11663$::jsonb,
   1, $dby11664$If the actual business data has no attribute combination that's inherently guaranteed unique, no natural candidate key exists — motivating a surrogate key instead.$dby11664$, 1, 7)
on conflict (id) do nothing;

-- 5.3 Primary Key
with g as (select id from public.learning_grids where lower(slug) = $dby11665$dbms-sql-tutorial$dby11665$),
     s as (select id from public.learning_sections where lower(slug) = $dby11666$chapter-5-keys-and-integrity$dby11666$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11667$Primary Key$dby11667$, $dby11668$primary-key$dby11668$, '', 3, 'published', true, true, $dby11669$dbms_sql_tutorial$dby11669$, $dby11670$chapter-5-keys-and-integrity/primary-key$dby11670$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11671$dbms_sql_tutorial$dby11671$ and source_ref = $dby11672$chapter-5-keys-and-integrity/primary-key$dby11672$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11673$Primary Key$dby11673$, $dby11674$### Definition

A **primary key** is the ONE candidate key that a database designer formally chooses to be a table's main, authoritative identifier. Once chosen, the DBMS enforces two rules on it automatically: values must be **unique**, and values must be **`NOT NULL`**.

Running example used throughout this chapter — a `students(id, name, email, department_id)` table:

| id | name  | email           | department_id |
|----|-------|-----------------|----------------|
| 1  | Asha  | asha@co.com     | 1              |
| 2  | Rohan | rohan@co.com    | 1              |
| 3  | Neha  | neha@co.com     | 2              |

### How It Works

```sql
CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  department_id INT
);
```

Declaring `id INT PRIMARY KEY` does two things automatically, with no extra syntax needed: it forbids duplicate `id` values (uniqueness) AND forbids `id` from ever being `NULL` (this second rule is called **entity integrity**, covered in 5.10). This is the one meaningful difference between `PRIMARY KEY` and a plain `UNIQUE` constraint (5.9) — `UNIQUE` alone still permits `NULL`.

Most engines also automatically create an index on the primary key column(s), since the primary key is the column most frequently used to look up individual rows — this makes primary-key lookups fast by default, as a side effect rather than something you have to configure separately.

### Edge Cases and Pitfalls

- A table can have only ONE primary key (though that one primary key can span multiple columns — a **composite primary key**, 5.6).
- Declaring `PRIMARY KEY` twice on the same table is a schema error, not a way to have "two primary keys."
- Once other tables reference this table via foreign keys (5.5), changing the primary key's values (or dropping the column) becomes a much bigger operation, since every referencing row would become invalid — this is a real practical reason to prefer a stable **surrogate key** (5.8) as primary key over a natural value that might need to change.

### Key Takeaways

- Primary key = the one chosen candidate key; automatically UNIQUE + NOT NULL.
- A table has exactly one primary key, which may be composite (multiple columns).
- Changing primary key values later is risky once foreign keys reference it — favor stable values.$dby11674$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11675$dbms_sql_tutorial_seed$dby11675$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11676$dbms_sql_tutorial_seed$dby11676$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11677$dbms-sql-tutorial$dby11677$),
     t as (select id from public.learning_topics where source_kind = $dby11678$dbms_sql_tutorial$dby11678$ and source_ref = $dby11679$chapter-5-keys-and-integrity/primary-key$dby11679$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11680$pt-dbms-sql-5-primary-key$dby11680$, $dby11681$Primary Key - Quick Test$dby11681$, 'aptitude', 8, 8,
  $dby11682$8 questions on Primary Key.$dby11682$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11683$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11683$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11684$tq-dbms-sql-5-primary-key-1$dby11684$, $dby11685$pt-dbms-sql-5-primary-key$dby11685$,
   $dby11686$What two constraints does declaring a column PRIMARY KEY enforce automatically?$dby11686$,
   $dby11687$["UNIQUE and NOT NULL", "CHECK and DEFAULT", "FOREIGN KEY and CASCADE", "INDEX and TRIGGER"]$dby11687$::jsonb,
   0, $dby11688$PRIMARY KEY bundles uniqueness with a mandatory NOT NULL requirement.$dby11688$, 1, 0),
  ($dby11689$tq-dbms-sql-5-primary-key-2$dby11689$, $dby11690$pt-dbms-sql-5-primary-key$dby11690$,
   $dby11691$How many primary keys can a single table have?$dby11691$,
   $dby11692$["As many as needed", "Exactly one (though it may span multiple columns)", "Exactly two", "Zero, unless UNIQUE is also declared"]$dby11692$::jsonb,
   1, $dby11693$A table has exactly one primary key; it can be composite (multi-column) but there is still only one.$dby11693$, 1, 1),
  ($dby11694$tq-dbms-sql-5-primary-key-3$dby11694$, $dby11695$pt-dbms-sql-5-primary-key$dby11695$,
   $dby11696$What is the key difference between PRIMARY KEY and a plain UNIQUE constraint?$dby11696$,
   $dby11697$["There is no real difference", "PRIMARY KEY additionally forbids NULL values, while plain UNIQUE still permits NULL", "UNIQUE is enforced faster than PRIMARY KEY", "PRIMARY KEY can only apply to text columns"]$dby11697$::jsonb,
   1, $dby11698$Both enforce uniqueness, but PRIMARY KEY also mandates NOT NULL — UNIQUE alone does not.$dby11698$, 1, 2),
  ($dby11699$tq-dbms-sql-5-primary-key-4$dby11699$, $dby11700$pt-dbms-sql-5-primary-key$dby11700$,
   $dby11701$What commonly happens automatically when a column is declared PRIMARY KEY?$dby11701$,
   $dby11702$["The column is encrypted", "The engine typically creates an index on it, speeding up lookups by that key", "The column is automatically converted to text", "All other columns become NOT NULL too"]$dby11702$::jsonb,
   1, $dby11703$Most engines auto-index the primary key since it's the most common lookup path — a helpful side effect, not something manually configured.$dby11703$, 1, 3),
  ($dby11704$tq-dbms-sql-5-primary-key-5$dby11704$, $dby11705$pt-dbms-sql-5-primary-key$dby11705$,
   $dby11706$Why is changing a primary key's values risky once other tables reference it via foreign keys?$dby11706$,
   $dby11707$["It is never actually risky", "Every referencing row's foreign key value would become invalid/orphaned unless carefully coordinated", "Foreign keys automatically update themselves with zero configuration in every engine", "Primary keys cannot be referenced by foreign keys in the first place"]$dby11707$::jsonb,
   1, $dby11708$Referencing rows depend on the primary key's exact value; changing it breaks that link unless a cascading update is explicitly set up.$dby11708$, 1, 4),
  ($dby11709$tq-dbms-sql-5-primary-key-6$dby11709$, $dby11710$pt-dbms-sql-5-primary-key$dby11710$,
   $dby11711$Why might a surrogate key be preferred as the primary key over a natural value like email?$dby11711$,
   $dby11712$["Surrogate keys are always shorter to type", "A surrogate key's value never needs to change for business reasons, making it a more stable long-term identifier", "Natural keys are illegal as primary keys", "There is no real reason; it's purely arbitrary"]$dby11712$::jsonb,
   1, $dby11713$A natural value can change (e.g. a person changes their email); a surrogate key's value has no business meaning and so never needs to change.$dby11713$, 1, 5),
  ($dby11714$tq-dbms-sql-5-primary-key-7$dby11714$, $dby11715$pt-dbms-sql-5-primary-key$dby11715$,
   $dby11716$Can a table have a composite primary key spanning two columns and still be considered to have 'one' primary key?$dby11716$,
   $dby11717$["No, that would count as two primary keys", "Yes \u2014 a composite primary key spanning multiple columns is still exactly one primary key constraint", "Only if both columns are of the same data type", "Composite primary keys are not allowed in SQL"]$dby11717$::jsonb,
   1, $dby11718$A composite primary key is one single constraint that happens to involve more than one column.$dby11718$, 1, 6),
  ($dby11719$tq-dbms-sql-5-primary-key-8$dby11719$, $dby11720$pt-dbms-sql-5-primary-key$dby11720$,
   $dby11721$What happens if you try to declare PRIMARY KEY on two different columns of the same table separately?$dby11721$,
   $dby11722$["The table gets two independent primary keys", "This is a schema error \u2014 a table can only have one PRIMARY KEY constraint (use a composite key if multiple columns are needed together)", "The first declaration silently wins with no error", "SQL automatically merges them into a UNIQUE constraint instead"]$dby11722$::jsonb,
   1, $dby11723$You cannot have two separate PRIMARY KEY constraints on one table; a genuinely multi-column key must be declared as one composite PRIMARY KEY.$dby11723$, 1, 7)
on conflict (id) do nothing;

-- 5.4 Alternate Key
with g as (select id from public.learning_grids where lower(slug) = $dby11724$dbms-sql-tutorial$dby11724$),
     s as (select id from public.learning_sections where lower(slug) = $dby11725$chapter-5-keys-and-integrity$dby11725$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11726$Alternate Key$dby11726$, $dby11727$alternate-key$dby11727$, '', 4, 'published', true, true, $dby11728$dbms_sql_tutorial$dby11728$, $dby11729$chapter-5-keys-and-integrity/alternate-key$dby11729$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11730$dbms_sql_tutorial$dby11730$ and source_ref = $dby11731$chapter-5-keys-and-integrity/alternate-key$dby11731$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11732$Alternate Key$dby11732$, $dby11733$### Definition

An **alternate key** is any candidate key that was NOT chosen to be the primary key. If a table has candidate keys `{id}` and `{email}`, and `{id}` is chosen as primary key, then `{email}` becomes an alternate key.

### How It Works

```sql
CREATE TABLE students (
  id INT PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,  -- alternate key: enforced with UNIQUE, not PRIMARY KEY
  name VARCHAR(100) NOT NULL
);
```

In SQL, an alternate key is implemented with a `UNIQUE` constraint (optionally combined with `NOT NULL` if the business rule requires a value to always be present) rather than `PRIMARY KEY` — SQL reserves the `PRIMARY KEY` keyword specifically for the one chosen key. The alternate key still fully enforces uniqueness; it's a real, enforced key, just not the table's "headline" identifier used for foreign-key relationships elsewhere.

### Edge Cases and Pitfalls

- Unlike `PRIMARY KEY`, a plain `UNIQUE` constraint (used for alternate keys) does NOT automatically forbid `NULL` — most engines allow multiple `NULL`s in a `UNIQUE` column (NULL is not considered "equal" to another NULL), which is a common source of confusion if you expected `UNIQUE` to behave exactly like `PRIMARY KEY`.
- A table can have several alternate keys at once (if it has several unchosen candidate keys) — there's no limit of one, unlike the primary key.
- Foreign keys in OTHER tables typically reference the primary key, not an alternate key — though most SQL dialects technically allow a foreign key to reference any `UNIQUE` column, doing so is less common and can be more error-prone to maintain.

### Key Takeaways

- Alternate key = a candidate key that lost out to the primary key, implemented via `UNIQUE`.
- A table can have zero, one, or many alternate keys.
- `UNIQUE` allows NULLs (usually multiple); `PRIMARY KEY` never does — this is the practical SQL-level difference.$dby11733$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11734$dbms_sql_tutorial_seed$dby11734$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11735$dbms_sql_tutorial_seed$dby11735$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11736$dbms-sql-tutorial$dby11736$),
     t as (select id from public.learning_topics where source_kind = $dby11737$dbms_sql_tutorial$dby11737$ and source_ref = $dby11738$chapter-5-keys-and-integrity/alternate-key$dby11738$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11739$pt-dbms-sql-5-alternate-key$dby11739$, $dby11740$Alternate Key - Quick Test$dby11740$, 'aptitude', 8, 8,
  $dby11741$8 questions on Alternate Key.$dby11741$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11742$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11742$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11743$tq-dbms-sql-5-alternate-key-1$dby11743$, $dby11744$pt-dbms-sql-5-alternate-key$dby11744$,
   $dby11745$What is an alternate key?$dby11745$,
   $dby11746$["A foreign key that references a different table", "A candidate key that was not chosen as the primary key", "A key made of alternating data types", "A key that changes value periodically"]$dby11746$::jsonb,
   1, $dby11747$Alternate key = candidate key minus whichever one became the primary key.$dby11747$, 1, 0),
  ($dby11748$tq-dbms-sql-5-alternate-key-2$dby11748$, $dby11749$pt-dbms-sql-5-alternate-key$dby11749$,
   $dby11750$How is an alternate key typically implemented in SQL?$dby11750$,
   $dby11751$["With the PRIMARY KEY keyword", "With a UNIQUE constraint", "With a FOREIGN KEY constraint", "It cannot be enforced in SQL at all"]$dby11751$::jsonb,
   1, $dby11752$SQL reserves PRIMARY KEY for the chosen key; alternate keys are enforced with UNIQUE.$dby11752$, 1, 1),
  ($dby11753$tq-dbms-sql-5-alternate-key-3$dby11753$, $dby11754$pt-dbms-sql-5-alternate-key$dby11754$,
   $dby11755$Does a UNIQUE constraint by itself forbid NULL values the same way PRIMARY KEY does?$dby11755$,
   $dby11756$["Yes, identically", "No \u2014 most engines allow multiple NULLs in a UNIQUE column, since NULL is not considered equal to another NULL", "UNIQUE forbids exactly one NULL value", "UNIQUE converts NULLs to zero automatically"]$dby11756$::jsonb,
   1, $dby11757$This is the key SQL-level difference: UNIQUE alone doesn't imply NOT NULL, and NULLs aren't compared as duplicates of each other.$dby11757$, 1, 2),
  ($dby11758$tq-dbms-sql-5-alternate-key-4$dby11758$, $dby11759$pt-dbms-sql-5-alternate-key$dby11759$,
   $dby11760$How many alternate keys can a table have?$dby11760$,
   $dby11761$["Exactly one, always", "Zero, one, or many, depending on how many unchosen candidate keys exist", "Exactly the same number as foreign keys", "Alternate keys are not allowed in SQL"]$dby11761$::jsonb,
   1, $dby11762$Unlike primary key (always exactly one), a table can have any number of alternate keys, including zero.$dby11762$, 1, 3),
  ($dby11763$tq-dbms-sql-5-alternate-key-5$dby11763$, $dby11764$pt-dbms-sql-5-alternate-key$dby11764$,
   $dby11765$Can a foreign key in another table reference an alternate key instead of the primary key?$dby11765$,
   $dby11766$["Never, under any circumstances", "Most SQL dialects technically allow referencing any UNIQUE column, though referencing the primary key is far more common", "Only if the alternate key is also the primary key", "Only in NoSQL databases"]$dby11766$::jsonb,
   1, $dby11767$It's technically possible in most dialects, though primary-key references are the conventional, more maintainable default.$dby11767$, 1, 4),
  ($dby11768$tq-dbms-sql-5-alternate-key-6$dby11768$, $dby11769$pt-dbms-sql-5-alternate-key$dby11769$,
   $dby11770$If students has candidate keys {id} and {email}, and {id} is the primary key, what is {email}?$dby11770$,
   $dby11771$["A foreign key", "An alternate key", "A super key only, not a candidate key", "An invalid key with no formal name"]$dby11771$::jsonb,
   1, $dby11772$Since {email} was a candidate key that wasn't chosen as primary, it's specifically an alternate key.$dby11772$, 1, 5),
  ($dby11773$tq-dbms-sql-5-alternate-key-7$dby11773$, $dby11774$pt-dbms-sql-5-alternate-key$dby11774$,
   $dby11775$Why might allowing multiple NULLs in a UNIQUE alternate-key column actually make business sense?$dby11775$,
   $dby11776$["It never makes sense and is always a bug", "Some rows may legitimately not have that optional value yet (e.g. an email not yet collected), while any values that ARE present must still be distinct", "NULL values are required by the SQL standard for all UNIQUE columns", "UNIQUE columns cannot hold real data at all"]$dby11776$::jsonb,
   1, $dby11777$For an optional-but-must-be-distinct-when-present attribute, allowing multiple NULLs (absent values) while still enforcing distinctness among the real values is exactly the desired behavior.$dby11777$, 1, 6),
  ($dby11778$tq-dbms-sql-5-alternate-key-8$dby11778$, $dby11779$pt-dbms-sql-5-alternate-key$dby11779$,
   $dby11780$Is it accurate to say an alternate key is 'less enforced' than a primary key?$dby11780$,
   $dby11781$["Yes, alternate keys are only a suggestion, not enforced", "No \u2014 a UNIQUE constraint is fully enforced by the database; it's simply not the table's designated primary/foreign-key-target identifier", "Alternate keys are enforced only during INSERT, never UPDATE", "Alternate keys are enforced only in application code, never the database"]$dby11781$::jsonb,
   1, $dby11782$UNIQUE constraints are just as strictly enforced by the database as PRIMARY KEY's uniqueness aspect — the difference is role, not enforcement strength.$dby11782$, 1, 7)
on conflict (id) do nothing;

-- 5.5 Foreign Key
with g as (select id from public.learning_grids where lower(slug) = $dby11783$dbms-sql-tutorial$dby11783$),
     s as (select id from public.learning_sections where lower(slug) = $dby11784$chapter-5-keys-and-integrity$dby11784$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11785$Foreign Key$dby11785$, $dby11786$foreign-key$dby11786$, '', 5, 'published', true, true, $dby11787$dbms_sql_tutorial$dby11787$, $dby11788$chapter-5-keys-and-integrity/foreign-key$dby11788$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11789$dbms_sql_tutorial$dby11789$ and source_ref = $dby11790$chapter-5-keys-and-integrity/foreign-key$dby11790$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11791$Foreign Key$dby11791$, $dby11792$### Definition

A **foreign key** is a column (or set of columns) in one table that references the primary key (or a unique key) of another table, establishing a link between the two and enforcing that the referenced value actually exists.

### How It Works

```sql
CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

This constraint means: `employees.department_id` may only ever contain a value that actually exists as an `id` in `departments` (or be `NULL`, if the column allows it — an employee not yet assigned to a department, for example). Trying to `INSERT` an employee with `department_id = 999` when no department `999` exists is rejected by the database itself — this guarantee is called **referential integrity** (5.11), and the foreign key constraint is the SQL mechanism that enforces it.

The table containing the foreign key (`employees`) is the "child"/"referencing" table; the table being pointed at (`departments`) is the "parent"/"referenced" table.

### Edge Cases and Pitfalls

- Deleting a department that still has employees pointing at it raises a constraint violation by default — this is exactly why **cascading actions** (5.12, `ON DELETE CASCADE`/`SET NULL`/`RESTRICT`) exist, to say explicitly what should happen in that case instead of just failing.
- A foreign key column allowing `NULL` means "not yet assigned / not applicable" is a valid state — but this only works if the column doesn't ALSO need `NOT NULL` for business reasons (an order without a customer might be nonsensical, in which case the foreign key column should be `NOT NULL` too).
- A common bug class is having "orphaned" rows in a real production system that never actually had a foreign key constraint enforced (e.g. added after data already existed, or enforced only in application code) — a row's `department_id` value can silently point at nothing, and only an explicit query (an anti-join / `LEFT JOIN ... WHERE ... IS NULL`) will reveal it.

### Key Takeaways

- Foreign key = a column referencing another table's primary/unique key, enforcing that the reference is valid.
- The referencing table is the child; the referenced table is the parent.
- NULL in a foreign key column (when allowed) means "no reference," not "an invalid reference."$dby11792$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11793$dbms_sql_tutorial_seed$dby11793$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11794$dbms_sql_tutorial_seed$dby11794$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11795$dbms-sql-tutorial$dby11795$),
     t as (select id from public.learning_topics where source_kind = $dby11796$dbms_sql_tutorial$dby11796$ and source_ref = $dby11797$chapter-5-keys-and-integrity/foreign-key$dby11797$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11798$pt-dbms-sql-5-foreign-key$dby11798$, $dby11799$Foreign Key - Quick Test$dby11799$, 'aptitude', 8, 8,
  $dby11800$8 questions on Foreign Key.$dby11800$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11801$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11801$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11802$tq-dbms-sql-5-foreign-key-1$dby11802$, $dby11803$pt-dbms-sql-5-foreign-key$dby11803$,
   $dby11804$What does a foreign key do?$dby11804$,
   $dby11805$["It makes a column impossible to update", "It references the primary/unique key of another table, ensuring the referenced value actually exists", "It automatically encrypts a column", "It creates a new primary key in the same table"]$dby11805$::jsonb,
   1, $dby11806$A foreign key links to another table's key, enforcing that referenced values are valid.$dby11806$, 1, 0),
  ($dby11807$tq-dbms-sql-5-foreign-key-2$dby11807$, $dby11808$pt-dbms-sql-5-foreign-key$dby11808$,
   $dby11809$In a departments/employees relationship where employees.department_id references departments.id, which table is the 'child' table?$dby11809$,
   $dby11810$["departments", "employees", "Both are children of each other", "Neither \u2014 this terminology doesn't apply"]$dby11810$::jsonb,
   1, $dby11811$employees holds the foreign key and depends on departments, making it the child/referencing table.$dby11811$, 1, 1),
  ($dby11812$tq-dbms-sql-5-foreign-key-3$dby11812$, $dby11813$pt-dbms-sql-5-foreign-key$dby11813$,
   $dby11814$What happens by default if you try to DELETE a department row that still has employees referencing it?$dby11814$,
   $dby11815$["The department is deleted and employees.department_id becomes NULL automatically", "The delete is rejected with a constraint violation, unless a cascading action is configured", "All the referencing employees are silently deleted too", "Nothing \u2014 foreign keys don't affect DELETE"]$dby11815$::jsonb,
   1, $dby11816$The default foreign-key behavior blocks a delete that would orphan referencing rows, unless ON DELETE CASCADE/SET NULL is explicitly configured.$dby11816$, 1, 2),
  ($dby11817$tq-dbms-sql-5-foreign-key-4$dby11817$, $dby11818$pt-dbms-sql-5-foreign-key$dby11818$,
   $dby11819$Can a foreign key column contain NULL?$dby11819$,
   $dby11820$["Never, under any circumstances", "Yes, if the column allows NULL \u2014 it means 'no reference yet,' which is different from an invalid reference", "Only if the column is also the primary key", "Only in NoSQL databases"]$dby11820$::jsonb,
   1, $dby11821$A NULL foreign key value simply means the relationship isn't set (e.g. not yet assigned), and is a perfectly valid, integrity-preserving state.$dby11821$, 1, 3),
  ($dby11822$tq-dbms-sql-5-foreign-key-5$dby11822$, $dby11823$pt-dbms-sql-5-foreign-key$dby11823$,
   $dby11824$How can you detect 'orphaned' rows whose foreign key value doesn't match anything in the parent table (e.g. if the constraint was never actually enforced)?$dby11824$,
   $dby11825$["This can never be detected", "With an anti-join query, e.g. a LEFT JOIN to the parent table filtered to WHERE parent.id IS NULL", "Only by manually inspecting every row", "By running VACUUM on the table"]$dby11825$::jsonb,
   1, $dby11826$A LEFT JOIN from child to parent, filtered to rows where the parent side is NULL, reveals exactly the orphaned rows — a standard integrity-check query.$dby11826$, 1, 4),
  ($dby11827$tq-dbms-sql-5-foreign-key-6$dby11827$, $dby11828$pt-dbms-sql-5-foreign-key$dby11828$,
   $dby11829$What is 'referential integrity' most directly enforced by?$dby11829$,
   $dby11830$["The UNIQUE constraint", "The foreign key constraint", "The NOT NULL constraint", "The CHECK constraint"]$dby11830$::jsonb,
   1, $dby11831$Referential integrity — the guarantee that references point to real, existing rows — is exactly what the foreign key constraint enforces.$dby11831$, 1, 5),
  ($dby11832$tq-dbms-sql-5-foreign-key-7$dby11832$, $dby11833$pt-dbms-sql-5-foreign-key$dby11833$,
   $dby11834$Why might a real production database end up with orphaned foreign-key-style references despite no error being thrown?$dby11834$,
   $dby11835$["This is impossible if any foreign key constraint exists anywhere in the schema", "The constraint may have been added after data already existed, or the relationship enforced only in application code rather than as a real database-level FOREIGN KEY", "Orphaned rows are automatically cleaned up nightly by every database", "Foreign keys are enforced retroactively by SQL automatically"]$dby11835$::jsonb,
   1, $dby11836$A relationship not backed by an actual enforced FOREIGN KEY constraint can silently accumulate invalid references over time.$dby11836$, 1, 6),
  ($dby11837$tq-dbms-sql-5-foreign-key-8$dby11837$, $dby11838$pt-dbms-sql-5-foreign-key$dby11838$,
   $dby11839$Which key does a foreign key most commonly reference in the parent table?$dby11839$,
   $dby11840$["Any arbitrary column, chosen at random", "The parent table's primary key (or occasionally a unique/alternate key)", "The parent table's foreign key", "A column that doesn't exist yet"]$dby11840$::jsonb,
   1, $dby11841$Foreign keys conventionally reference the parent's primary key, and can technically reference any UNIQUE column.$dby11841$, 1, 7)
on conflict (id) do nothing;

-- 5.6 Composite Key
with g as (select id from public.learning_grids where lower(slug) = $dby11842$dbms-sql-tutorial$dby11842$),
     s as (select id from public.learning_sections where lower(slug) = $dby11843$chapter-5-keys-and-integrity$dby11843$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11844$Composite Key$dby11844$, $dby11845$composite-key$dby11845$, '', 6, 'published', true, true, $dby11846$dbms_sql_tutorial$dby11846$, $dby11847$chapter-5-keys-and-integrity/composite-key$dby11847$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11848$dbms_sql_tutorial$dby11848$ and source_ref = $dby11849$chapter-5-keys-and-integrity/composite-key$dby11849$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11850$Composite Key$dby11850$, $dby11851$### Definition

A **composite key** is a key — candidate, primary, or foreign — made up of **two or more columns together**, where no single one of those columns is unique on its own, but the *combination* is.

### How It Works

```sql
CREATE TABLE enrollments (
  student_id INT NOT NULL,
  course_id  INT NOT NULL,
  semester   VARCHAR(20) NOT NULL,
  grade      CHAR(2),
  PRIMARY KEY (student_id, course_id, semester)
);
```

Here, no single column is unique — many rows share the same `student_id` (one student takes many courses), many share the same `course_id` (many students take one course), and many share the same `semester`. But the **combination** `(student_id, course_id, semester)` is unique: a specific student cannot be enrolled in the same course in the same semester more than once. That combination is a natural composite candidate key — declared here as the composite primary key.

### Edge Cases and Pitfalls

- Detecting duplicate rows against an *intended* but unenforced composite key is a real, common data-quality task: `SELECT student_id, course_id, semester, COUNT(*) FROM enrollments GROUP BY student_id, course_id, semester HAVING COUNT(*) > 1` finds exactly the violations — useful both for auditing existing data and for verifying a proposed composite key really is unique before declaring it as a constraint.
- Column ORDER in a composite key declaration matters for indexing performance (most engines build one combined index following the declared column order, which affects which queries can use it efficiently) even though it doesn't matter for the logical uniqueness guarantee itself.
- A composite key is not automatically "more correct" than a surrogate key for the same table — many real designs use a simple surrogate `id` as the actual primary key while still enforcing the natural composite combination as a separate `UNIQUE` constraint, getting the benefits of both.

### Key Takeaways

- Composite key = a key spanning multiple columns where the combination, not any single column, is what's unique.
- `GROUP BY <the composite columns> HAVING COUNT(*) > 1` is the standard way to find rows that violate an intended composite key.
- A composite key can still be enforced as PRIMARY KEY, or kept as a separate UNIQUE constraint alongside a surrogate primary key.$dby11851$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11852$dbms_sql_tutorial_seed$dby11852$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11853$dbms_sql_tutorial_seed$dby11853$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11854$dbms-sql-tutorial$dby11854$),
     t as (select id from public.learning_topics where source_kind = $dby11855$dbms_sql_tutorial$dby11855$ and source_ref = $dby11856$chapter-5-keys-and-integrity/composite-key$dby11856$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11857$pt-dbms-sql-5-composite-key$dby11857$, $dby11858$Composite Key - Quick Test$dby11858$, 'aptitude', 8, 8,
  $dby11859$8 questions on Composite Key.$dby11859$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11860$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11860$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11861$tq-dbms-sql-5-composite-key-1$dby11861$, $dby11862$pt-dbms-sql-5-composite-key$dby11862$,
   $dby11863$What is a composite key?$dby11863$,
   $dby11864$["A key made of encrypted values", "A key made of two or more columns where the combination (not any single column) is unique", "A foreign key that references two tables at once", "A deprecated kind of key no longer used"]$dby11864$::jsonb,
   1, $dby11865$Composite key = multi-column key where uniqueness comes from the combination.$dby11865$, 1, 0),
  ($dby11866$tq-dbms-sql-5-composite-key-2$dby11866$, $dby11867$pt-dbms-sql-5-composite-key$dby11867$,
   $dby11868$In enrollments(student_id, course_id, semester) with PRIMARY KEY (student_id, course_id, semester), is student_id alone unique?$dby11868$,
   $dby11869$["Yes, always", "No \u2014 a student enrolls in many courses, so student_id repeats; only the full combination is unique", "Only if the table has fewer than 10 rows", "This cannot be determined from the schema"]$dby11869$::jsonb,
   1, $dby11870$The whole point of this composite key is that no single column is unique on its own — only the combination is.$dby11870$, 1, 1),
  ($dby11871$tq-dbms-sql-5-composite-key-3$dby11871$, $dby11872$pt-dbms-sql-5-composite-key$dby11872$,
   $dby11873$Which query correctly finds rows that would violate an intended composite key on (student_id, course_id, semester)?$dby11873$,
   $dby11874$["SELECT * FROM enrollments WHERE student_id IS NULL", "SELECT student_id, course_id, semester, COUNT(*) FROM enrollments GROUP BY student_id, course_id, semester HAVING COUNT(*) > 1", "SELECT DISTINCT student_id FROM enrollments", "SELECT * FROM enrollments ORDER BY student_id"]$dby11874$::jsonb,
   1, $dby11875$Grouping by exactly the composite key's columns and filtering groups with more than one row finds exactly the duplicate/violating combinations.$dby11875$, 1, 2),
  ($dby11876$tq-dbms-sql-5-composite-key-4$dby11876$, $dby11877$pt-dbms-sql-5-composite-key$dby11877$,
   $dby11878$Does the ORDER of columns in a composite key declaration affect its logical uniqueness guarantee?$dby11878$,
   $dby11879$["Yes, reordering changes which rows are considered duplicates", "No \u2014 logical uniqueness is unaffected by order, though column order can affect which queries an underlying composite index serves efficiently", "Order only matters for foreign keys, never primary keys", "Composite keys must always be declared in alphabetical order"]$dby11879$::jsonb,
   1, $dby11880$The uniqueness guarantee is order-independent, but the physical index built from a composite key is typically order-sensitive for performance purposes.$dby11880$, 1, 3),
  ($dby11881$tq-dbms-sql-5-composite-key-5$dby11881$, $dby11882$pt-dbms-sql-5-composite-key$dby11882$,
   $dby11883$Is it required to use a composite key as the actual PRIMARY KEY, rather than a surrogate key?$dby11883$,
   $dby11884$["Yes, composite keys must always be the primary key", "No \u2014 a common pattern is a surrogate id as primary key, with the natural composite combination enforced as a separate UNIQUE constraint instead", "Composite keys cannot be enforced as UNIQUE, only as PRIMARY KEY", "SQL does not support composite UNIQUE constraints"]$dby11884$::jsonb,
   1, $dby11885$Both approaches are valid and common; a surrogate primary key plus a composite UNIQUE constraint is a frequently used pattern.$dby11885$, 1, 4),
  ($dby11886$tq-dbms-sql-5-composite-key-6$dby11886$, $dby11887$pt-dbms-sql-5-composite-key$dby11887$,
   $dby11888$Can a foreign key also be composite?$dby11888$,
   $dby11889$["No, foreign keys must always be a single column", "Yes \u2014 a composite foreign key references a composite primary/unique key in another table using multiple columns together", "Only in NoSQL databases", "Only if the referenced table has no primary key"]$dby11889$::jsonb,
   1, $dby11890$Just like primary keys, foreign keys can span multiple columns when they reference a composite key elsewhere.$dby11890$, 1, 5),
  ($dby11891$tq-dbms-sql-5-composite-key-7$dby11891$, $dby11892$pt-dbms-sql-5-composite-key$dby11892$,
   $dby11893$Why might auditing a proposed composite key (before actually declaring it as a constraint) be valuable?$dby11893$,
   $dby11894$["It's never valuable \u2014 you should always just declare the constraint directly", "Running the GROUP BY/HAVING check first reveals existing duplicate data that would make the constraint fail to apply, letting you clean it up first", "Auditing is required by the SQL standard before any CREATE TABLE", "SQL automatically performs this audit for you"]$dby11894$::jsonb,
   1, $dby11895$Attempting to add a uniqueness constraint over existing dirty data will fail; checking first with GROUP BY/HAVING lets you find and fix violations proactively.$dby11895$, 1, 6),
  ($dby11896$tq-dbms-sql-5-composite-key-8$dby11896$, $dby11897$pt-dbms-sql-5-composite-key$dby11897$,
   $dby11898$In enrollments(student_id, course_id, semester), why is student_id alone NOT a valid single-column candidate key?$dby11898$,
   $dby11899$["Because student_id is never stored as an integer", "Because a single student legitimately appears in multiple rows (once per course/semester), so student_id alone repeats", "Because student_id must always be NULL", "Because SQL forbids single-column candidate keys"]$dby11899$::jsonb,
   1, $dby11900$Repetition of student_id across multiple enrollments is exactly why it can't serve as a standalone unique identifier here.$dby11900$, 1, 7)
on conflict (id) do nothing;

-- 5.7 Natural Key
with g as (select id from public.learning_grids where lower(slug) = $dby11901$dbms-sql-tutorial$dby11901$),
     s as (select id from public.learning_sections where lower(slug) = $dby11902$chapter-5-keys-and-integrity$dby11902$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11903$Natural Key$dby11903$, $dby11904$natural-key$dby11904$, '', 7, 'published', true, true, $dby11905$dbms_sql_tutorial$dby11905$, $dby11906$chapter-5-keys-and-integrity/natural-key$dby11906$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11907$dbms_sql_tutorial$dby11907$ and source_ref = $dby11908$chapter-5-keys-and-integrity/natural-key$dby11908$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11909$Natural Key$dby11909$, $dby11910$### Definition

A **natural key** is a candidate key made from an attribute (or attributes) that already has real-world, business meaning — an email address, a national ID number, an ISBN, a vehicle registration number — as opposed to a value invented purely for database bookkeeping.

### How It Works

Example: a `books` table might use `isbn` as its natural key — ISBNs are already globally unique by design (assigned by an external standards body), so the database doesn't need to invent anything; it can simply rely on a value that already carries real meaning to users.

```sql
CREATE TABLE books (
  isbn VARCHAR(13) PRIMARY KEY,   -- natural key
  title VARCHAR(200) NOT NULL,
  author VARCHAR(200)
);
```

The appeal of a natural key is that it's meaningful outside the database too — a person can look at `isbn = '9780134685991'` and, with an external lookup, know exactly which book that is, without needing to consult this specific database first.

### Edge Cases and Pitfalls

- Natural keys can change: a person's email, phone number, or even (rarely) national ID can be reissued or corrected — a primary key value that needs to change later is operationally painful, especially once other tables have foreign keys pointing at it (see 5.3, 5.5).
- Natural keys are sometimes not actually as unique as assumed in practice: two people can share a name, some legacy systems reused ID numbers, and data-entry errors can create accidental duplicates that only surface once the constraint is actually enforced.
- Natural keys can be long, composite, or of an inconvenient data type (e.g. a compound business code) — this can make foreign keys that reference them wider and slower to index than a compact surrogate integer would be.

### Key Takeaways

- Natural key = a real-world-meaningful attribute used as a key, as opposed to an artificial one.
- Advantage: no invented value needed, and it's independently meaningful.
- Disadvantage: real-world values can change or turn out to be less unique than assumed — this is exactly the trade-off against a surrogate key (5.8).$dby11910$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11911$dbms_sql_tutorial_seed$dby11911$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11912$dbms_sql_tutorial_seed$dby11912$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11913$dbms-sql-tutorial$dby11913$),
     t as (select id from public.learning_topics where source_kind = $dby11914$dbms_sql_tutorial$dby11914$ and source_ref = $dby11915$chapter-5-keys-and-integrity/natural-key$dby11915$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11916$pt-dbms-sql-5-natural-key$dby11916$, $dby11917$Natural Key - Quick Test$dby11917$, 'aptitude', 8, 8,
  $dby11918$8 questions on Natural Key.$dby11918$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11919$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11919$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11920$tq-dbms-sql-5-natural-key-1$dby11920$, $dby11921$pt-dbms-sql-5-natural-key$dby11921$,
   $dby11922$What is a natural key?$dby11922$,
   $dby11923$["A key value chosen by a random number generator", "A candidate key based on an attribute that already has real-world business meaning", "A key that is always numeric", "A key with no formal database definition"]$dby11923$::jsonb,
   1, $dby11924$Natural keys derive from meaningful real-world attributes, like an ISBN or national ID.$dby11924$, 1, 0),
  ($dby11925$tq-dbms-sql-5-natural-key-2$dby11925$, $dby11926$pt-dbms-sql-5-natural-key$dby11926$,
   $dby11927$Which of these is the best example of a natural key?$dby11927$,
   $dby11928$["An auto-incrementing integer id with no external meaning", "A book's ISBN", "A randomly generated UUID", "A row's internal storage address"]$dby11928$::jsonb,
   1, $dby11929$ISBN is a real-world, externally meaningful identifier, making it a natural key.$dby11929$, 1, 1),
  ($dby11930$tq-dbms-sql-5-natural-key-3$dby11930$, $dby11931$pt-dbms-sql-5-natural-key$dby11931$,
   $dby11932$What is a genuine operational risk of using a natural key as a primary key?$dby11932$,
   $dby11933$["Natural keys are always slower to compare than any other data type", "The real-world value might need to change later (e.g. a corrected ID), which is painful once other tables have foreign keys pointing at it", "Natural keys cannot be indexed", "SQL does not allow natural keys as PRIMARY KEY"]$dby11933$::jsonb,
   1, $dby11934$Unlike a surrogate key with no business meaning, a natural key's value can legitimately need correction or reissue, creating downstream update problems.$dby11934$, 1, 2),
  ($dby11935$tq-dbms-sql-5-natural-key-4$dby11935$, $dby11936$pt-dbms-sql-5-natural-key$dby11936$,
   $dby11937$Why might an assumed natural key turn out to not actually be unique in practice?$dby11937$,
   $dby11938$["This never happens with natural keys", "Real-world data-entry errors, legacy ID reuse, or coincidental duplicate values can violate an assumption that seemed safe on paper", "Natural keys are unique by mathematical law", "Only surrogate keys can ever have duplicates"]$dby11938$::jsonb,
   1, $dby11939$Real-world data is messier than assumptions — natural keys can have unexpected duplicates that only surface once actually checked or enforced.$dby11939$, 1, 3),
  ($dby11940$tq-dbms-sql-5-natural-key-5$dby11940$, $dby11941$pt-dbms-sql-5-natural-key$dby11941$,
   $dby11942$What is one advantage of a natural key over a surrogate key?$dby11942$,
   $dby11943$["It requires no design effort and doesn't need to be independently meaningful", "It's independently meaningful outside the database, without needing an extra lookup to understand it", "It is always shorter to store", "It never changes over time"]$dby11943$::jsonb,
   1, $dby11944$A natural key already carries real-world meaning, unlike an arbitrary surrogate value.$dby11944$, 1, 4),
  ($dby11945$tq-dbms-sql-5-natural-key-6$dby11945$, $dby11946$pt-dbms-sql-5-natural-key$dby11946$,
   $dby11947$How can a natural key negatively affect foreign key performance?$dby11947$,
   $dby11948$["Natural keys can never be referenced by foreign keys", "If the natural key is long, composite, or an inconvenient type, foreign keys referencing it become wider and potentially slower to index than a compact surrogate integer", "Foreign keys referencing natural keys are always faster", "This is purely a hypothetical concern with no real basis"]$dby11948$::jsonb,
   1, $dby11949$A wide or complex natural key propagates that width/complexity into every referencing foreign key column and its index.$dby11949$, 1, 5),
  ($dby11950$tq-dbms-sql-5-natural-key-7$dby11950$, $dby11951$pt-dbms-sql-5-natural-key$dby11951$,
   $dby11952$Is 'a person's full name' generally considered a reliable natural key?$dby11952$,
   $dby11953$["Yes, names are always unique", "No \u2014 multiple people can share the same name, making it an unreliable choice for uniqueness", "Only for people whose names start with a vowel", "Names are never allowed as database columns"]$dby11953$::jsonb,
   1, $dby11954$Name collisions are common in the real world, making plain name a poor natural-key candidate.$dby11954$, 1, 6),
  ($dby11955$tq-dbms-sql-5-natural-key-8$dby11955$, $dby11956$pt-dbms-sql-5-natural-key$dby11956$,
   $dby11957$What is the fundamental trade-off between natural keys and surrogate keys?$dby11957$,
   $dby11958$["There is no trade-off; one is strictly better in every case", "Natural keys are meaningful but can change or prove less unique than assumed; surrogate keys are stable and simple but carry no external meaning", "Surrogate keys are always slower to generate", "Natural keys can never be used in a WHERE clause"]$dby11958$::jsonb,
   1, $dby11959$This exact trade-off — meaning and no invented value vs. stability and simplicity — is the core design decision covered further in 5.8.$dby11959$, 1, 7)
on conflict (id) do nothing;

-- 5.8 Surrogate Key
with g as (select id from public.learning_grids where lower(slug) = $dby11960$dbms-sql-tutorial$dby11960$),
     s as (select id from public.learning_sections where lower(slug) = $dby11961$chapter-5-keys-and-integrity$dby11961$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby11962$Surrogate Key$dby11962$, $dby11963$surrogate-key$dby11963$, '', 8, 'published', true, true, $dby11964$dbms_sql_tutorial$dby11964$, $dby11965$chapter-5-keys-and-integrity/surrogate-key$dby11965$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby11966$dbms_sql_tutorial$dby11966$ and source_ref = $dby11967$chapter-5-keys-and-integrity/surrogate-key$dby11967$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby11968$Surrogate Key$dby11968$, $dby11969$### Definition

A **surrogate key** is an artificial identifier — most commonly an auto-incrementing integer or a generated UUID — with **no business meaning whatsoever**, created purely so the database has a simple, stable way to uniquely identify each row.

### How It Works

```sql
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,   -- surrogate key: means nothing outside this table
  email VARCHAR(150) UNIQUE NOT NULL,  -- natural candidate key, kept as an alternate key
  name VARCHAR(150) NOT NULL
);
```

`id` here carries no meaning a human would recognize — customer `id = 4821` tells you nothing about who that customer is. That's precisely the point: because it has no business meaning, it never NEEDS to change for business reasons (unlike an email, which might). It becomes the table's stable primary key, while a genuinely meaningful natural key (like `email`) can still be kept and enforced as a `UNIQUE` alternate key.

### Edge Cases and Pitfalls

- A surrogate key does not remove the need to ALSO enforce uniqueness on the real natural key — skipping that (relying only on the surrogate id) can let two rows for "the same real-world entity" (e.g. the same email registered twice) slip in as if they were different customers.
- Auto-incrementing integer surrogate keys can leak information (an increasing `id` reveals roughly how many rows/orders/customers exist and in what order they were created) — some systems deliberately use randomly-generated UUIDs instead specifically to avoid this.
- Surrogate keys generated independently on multiple systems (e.g. offline mobile clients each generating their own new customer id) can collide unless a globally-unique generation scheme (like a proper UUID, not a simple counter) is used.

### Key Takeaways

- Surrogate key = an artificial, meaningless identifier chosen purely for database convenience and stability.
- It should typically be paired with a UNIQUE constraint on any real natural key, not used as a replacement for one.
- Trade-off vs. natural key (5.7): stability and simplicity, at the cost of having no meaning outside the database.$dby11969$, 'markdown', 0, 'published', jsonb_build_object('source', $dby11970$dbms_sql_tutorial_seed$dby11970$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby11971$dbms_sql_tutorial_seed$dby11971$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby11972$dbms-sql-tutorial$dby11972$),
     t as (select id from public.learning_topics where source_kind = $dby11973$dbms_sql_tutorial$dby11973$ and source_ref = $dby11974$chapter-5-keys-and-integrity/surrogate-key$dby11974$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby11975$pt-dbms-sql-5-surrogate-key$dby11975$, $dby11976$Surrogate Key - Quick Test$dby11976$, 'aptitude', 8, 8,
  $dby11977$8 questions on Surrogate Key.$dby11977$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby11978$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby11978$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby11979$tq-dbms-sql-5-surrogate-key-1$dby11979$, $dby11980$pt-dbms-sql-5-surrogate-key$dby11980$,
   $dby11981$What defines a surrogate key?$dby11981$,
   $dby11982$["A key with deep real-world business meaning", "An artificial identifier (e.g. auto-increment integer or UUID) with no business meaning, created purely for database convenience", "A key that must always be a UUID specifically", "A backup key used only when the primary key fails"]$dby11982$::jsonb,
   1, $dby11983$Surrogate keys are deliberately meaningless outside the database — that's their defining trait.$dby11983$, 1, 0),
  ($dby11984$tq-dbms-sql-5-surrogate-key-2$dby11984$, $dby11985$pt-dbms-sql-5-surrogate-key$dby11985$,
   $dby11986$Why does a surrogate key never need to change for business reasons?$dby11986$,
   $dby11987$["Because it is encrypted", "Because it has no real-world meaning to begin with, so there's nothing about the real world that could require it to be corrected", "Because SQL forbids updating surrogate keys", "Because surrogate keys are always the same value for every row"]$dby11987$::jsonb,
   1, $dby11988$Since the value carries no business meaning, there's no real-world event that would ever necessitate changing it.$dby11988$, 1, 1),
  ($dby11989$tq-dbms-sql-5-surrogate-key-3$dby11989$, $dby11990$pt-dbms-sql-5-surrogate-key$dby11990$,
   $dby11991$If a table uses a surrogate id as its primary key, should the natural key (e.g. email) still be constrained?$dby11991$,
   $dby11992$["No, the surrogate key makes that unnecessary", "Yes \u2014 it should still be enforced with a UNIQUE constraint, or duplicate real-world entities could be inserted as if they were different rows", "Only if the table has fewer than 100 rows", "Natural keys cannot coexist with surrogate keys in the same table"]$dby11992$::jsonb,
   1, $dby11993$Skipping the natural-key uniqueness check lets true real-world duplicates slip in, since the surrogate id alone doesn't prevent that.$dby11993$, 1, 2),
  ($dby11994$tq-dbms-sql-5-surrogate-key-4$dby11994$, $dby11995$pt-dbms-sql-5-surrogate-key$dby11995$,
   $dby11996$What potential downside does a simple auto-incrementing integer surrogate key have?$dby11996$,
   $dby11997$["It cannot be indexed", "It can leak information \u2014 e.g. the approximate row count or creation order \u2014 just by observing the id values", "It always takes more storage than a UUID", "It cannot be used as a primary key"]$dby11997$::jsonb,
   1, $dby11998$Sequential ids reveal relative ordering and volume, which is why some systems prefer non-sequential UUIDs for sensitive entities.$dby11998$, 1, 3),
  ($dby11999$tq-dbms-sql-5-surrogate-key-5$dby11999$, $dby12000$pt-dbms-sql-5-surrogate-key$dby12000$,
   $dby12001$Why might a distributed system (e.g. offline mobile clients generating their own new-record ids) avoid a simple incrementing counter as the surrogate key scheme?$dby12001$,
   $dby12002$["Incrementing counters are illegal in distributed systems", "Independently-generated counters on different clients can collide; a properly-designed UUID avoids that collision risk", "Distributed systems cannot use surrogate keys at all", "This scenario has no real bearing on key design"]$dby12002$::jsonb,
   1, $dby12003$Without central coordination, simple counters from independent sources can produce duplicate values; UUIDs are designed to avoid this even without coordination.$dby12003$, 1, 4),
  ($dby12004$tq-dbms-sql-5-surrogate-key-6$dby12004$, $dby12005$pt-dbms-sql-5-surrogate-key$dby12005$,
   $dby12006$What is the main trade-off of choosing a surrogate key over a natural key?$dby12006$,
   $dby12007$["No trade-off exists", "Gaining stability/simplicity at the cost of the key having no meaning outside the database", "Surrogate keys are always slower for every operation", "Surrogate keys cannot be used with foreign keys"]$dby12007$::jsonb,
   1, $dby12008$This mirrors the natural-key trade-off from the other direction: stability and simplicity vs. real-world meaningfulness.$dby12008$, 1, 5),
  ($dby12009$tq-dbms-sql-5-surrogate-key-7$dby12009$, $dby12010$pt-dbms-sql-5-surrogate-key$dby12010$,
   $dby12011$Is `customer_id = 4821` on its own informative to a human reading it?$dby12011$,
   $dby12012$["Yes, it reveals the customer's name", "No \u2014 a surrogate key value is deliberately meaningless without looking the row up", "It reveals the customer's registration date exactly", "It reveals the customer's email address"]$dby12012$::jsonb,
   1, $dby12013$A surrogate key is opaque by design; it requires a lookup to learn anything about the entity it identifies.$dby12013$, 1, 6),
  ($dby12014$tq-dbms-sql-5-surrogate-key-8$dby12014$, $dby12015$pt-dbms-sql-5-surrogate-key$dby12015$,
   $dby12016$Which pairing is a common, recommended real-world pattern?$dby12016$,
   $dby12017$["Using only a natural key with no surrogate key ever", "A surrogate key as PRIMARY KEY, with a natural key still enforced as a UNIQUE alternate key", "Never enforcing uniqueness on either kind of key", "Two separate surrogate keys with no natural key at all"]$dby12017$::jsonb,
   1, $dby12018$This combination gets the stability of a surrogate primary key while still preventing real-world duplicate entities via a UNIQUE natural key.$dby12018$, 1, 7)
on conflict (id) do nothing;

-- 5.9 Unique Constraint
with g as (select id from public.learning_grids where lower(slug) = $dby12019$dbms-sql-tutorial$dby12019$),
     s as (select id from public.learning_sections where lower(slug) = $dby12020$chapter-5-keys-and-integrity$dby12020$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby12021$Unique Constraint$dby12021$, $dby12022$unique-constraint$dby12022$, '', 9, 'published', true, true, $dby12023$dbms_sql_tutorial$dby12023$, $dby12024$chapter-5-keys-and-integrity/unique-constraint$dby12024$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby12025$dbms_sql_tutorial$dby12025$ and source_ref = $dby12026$chapter-5-keys-and-integrity/unique-constraint$dby12026$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby12027$Unique Constraint$dby12027$, $dby12028$### Definition

A **`UNIQUE` constraint** forbids duplicate values in a column (or set of columns), without the extra `NOT NULL` requirement that `PRIMARY KEY` bundles in. It is the SQL mechanism used to enforce alternate keys (5.4) and any other "must be distinct" business rule that isn't the table's main identifier.

### How It Works

```sql
CREATE TABLE employees (
  id INT PRIMARY KEY,
  email VARCHAR(150) UNIQUE,
  badge_number VARCHAR(20) UNIQUE
);
```

Both `email` and `badge_number` must each individually contain no duplicate values among non-NULL entries. A `UNIQUE` constraint can also span multiple columns, exactly like a composite key: `UNIQUE (student_id, course_id, semester)` enforces that the *combination* is distinct, not each column separately.

Finding violations of an intended-but-not-yet-declared `UNIQUE` constraint is a common real task:
```sql
SELECT email, COUNT(*) AS cnt
FROM employees
GROUP BY email
HAVING COUNT(*) > 1;
```
This reveals every email value that appears more than once — exactly the rows that would block adding `UNIQUE` until cleaned up.

### Edge Cases and Pitfalls

- As covered in 5.4: most engines treat multiple `NULL`s in a `UNIQUE` column as NOT duplicates of each other — `NULL` is never considered "equal" to another `NULL`, so several rows can all have `NULL` in a `UNIQUE` column simultaneously.
- Attempting to add a `UNIQUE` constraint to a column that already contains duplicate values fails immediately — the existing data must be cleaned up (using a query like the one above to find the offending rows) before the constraint can be applied.
- A `UNIQUE` constraint is checked on every `INSERT` and `UPDATE`, not just at table-creation time — this has a small but real performance cost on write-heavy tables, which is a genuine (if usually acceptable) trade-off against the correctness it buys.

### Key Takeaways

- `UNIQUE` forbids duplicates but allows (typically multiple) NULLs, unlike PRIMARY KEY.
- `GROUP BY <column(s)> HAVING COUNT(*) > 1` is the standard way to find existing duplicate values before adding the constraint.
- UNIQUE can be single-column or composite, just like a key.$dby12028$, 'markdown', 0, 'published', jsonb_build_object('source', $dby12029$dbms_sql_tutorial_seed$dby12029$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby12030$dbms_sql_tutorial_seed$dby12030$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby12031$dbms-sql-tutorial$dby12031$),
     t as (select id from public.learning_topics where source_kind = $dby12032$dbms_sql_tutorial$dby12032$ and source_ref = $dby12033$chapter-5-keys-and-integrity/unique-constraint$dby12033$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby12034$pt-dbms-sql-5-unique-constraint$dby12034$, $dby12035$Unique Constraint - Quick Test$dby12035$, 'aptitude', 8, 8,
  $dby12036$8 questions on Unique Constraint.$dby12036$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby12037$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby12037$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby12038$tq-dbms-sql-5-unique-constraint-1$dby12038$, $dby12039$pt-dbms-sql-5-unique-constraint$dby12039$,
   $dby12040$What does a UNIQUE constraint enforce?$dby12040$,
   $dby12041$["That a column can never be NULL", "That a column's (non-NULL) values contain no duplicates", "That a column must be numeric", "That a table has at most 100 rows"]$dby12041$::jsonb,
   1, $dby12042$UNIQUE forbids duplicate values among the non-NULL entries in a column.$dby12042$, 1, 0),
  ($dby12043$tq-dbms-sql-5-unique-constraint-2$dby12043$, $dby12044$pt-dbms-sql-5-unique-constraint$dby12044$,
   $dby12045$Which query finds email values that currently violate an intended UNIQUE constraint?$dby12045$,
   $dby12046$["SELECT * FROM employees WHERE email IS NULL", "SELECT email, COUNT(*) FROM employees GROUP BY email HAVING COUNT(*) > 1", "SELECT DISTINCT email FROM employees", "SELECT email FROM employees ORDER BY email"]$dby12046$::jsonb,
   1, $dby12047$Grouping by the target column and filtering for groups with more than one row reveals exactly the duplicate values.$dby12047$, 1, 1),
  ($dby12048$tq-dbms-sql-5-unique-constraint-3$dby12048$, $dby12049$pt-dbms-sql-5-unique-constraint$dby12049$,
   $dby12050$Can a UNIQUE column contain multiple NULL values in most SQL engines?$dby12050$,
   $dby12051$["No, at most one NULL is ever allowed", "Yes \u2014 NULL is not treated as equal to another NULL, so multiple rows can each have NULL", "Only if the column is also PRIMARY KEY", "UNIQUE columns cannot be NULL under any circumstances"]$dby12051$::jsonb,
   1, $dby12052$This NULL-handling behavior is the key practical difference between UNIQUE and PRIMARY KEY.$dby12052$, 1, 2),
  ($dby12053$tq-dbms-sql-5-unique-constraint-4$dby12053$, $dby12054$pt-dbms-sql-5-unique-constraint$dby12054$,
   $dby12055$What happens if you try to add a UNIQUE constraint to a column that already has duplicate values?$dby12055$,
   $dby12056$["The duplicates are silently deleted", "The constraint addition fails until the existing duplicates are resolved", "Only the first duplicate is kept automatically", "SQL renames the duplicates to make them unique"]$dby12056$::jsonb,
   1, $dby12057$The database refuses to apply a constraint the current data already violates — cleanup must happen first.$dby12057$, 1, 3),
  ($dby12058$tq-dbms-sql-5-unique-constraint-5$dby12058$, $dby12059$pt-dbms-sql-5-unique-constraint$dby12059$,
   $dby12060$Can a UNIQUE constraint span multiple columns?$dby12060$,
   $dby12061$["No, UNIQUE only ever applies to a single column", "Yes \u2014 a composite UNIQUE constraint enforces that the combination of columns is distinct, similar to a composite key", "Only PRIMARY KEY can be composite", "Composite UNIQUE constraints are deprecated"]$dby12061$::jsonb,
   1, $dby12062$UNIQUE (col1, col2, ...) enforces uniqueness of the combination, exactly like a composite key.$dby12062$, 1, 4),
  ($dby12063$tq-dbms-sql-5-unique-constraint-6$dby12063$, $dby12064$pt-dbms-sql-5-unique-constraint$dby12064$,
   $dby12065$When is a UNIQUE constraint actually checked by the database?$dby12065$,
   $dby12066$["Only once, when the table is first created", "On every INSERT and UPDATE that could affect the constrained column(s)", "Only during a nightly maintenance job", "Only when explicitly requested via a CHECK command"]$dby12066$::jsonb,
   1, $dby12067$UNIQUE is enforced continuously at write time, not just at schema-creation time.$dby12067$, 1, 5),
  ($dby12068$tq-dbms-sql-5-unique-constraint-7$dby12068$, $dby12069$pt-dbms-sql-5-unique-constraint$dby12069$,
   $dby12070$What real trade-off does enforcing a UNIQUE constraint introduce?$dby12070$,
   $dby12071$["None \u2014 there is no cost to enforcing UNIQUE", "A small but real performance cost on writes, since every INSERT/UPDATE must be checked against existing values", "UNIQUE constraints make SELECT queries slower, never writes", "UNIQUE constraints prevent all future schema changes"]$dby12071$::jsonb,
   1, $dby12072$The correctness guarantee comes with a modest write-time overhead, which is usually an acceptable trade-off.$dby12072$, 1, 6),
  ($dby12073$tq-dbms-sql-5-unique-constraint-8$dby12073$, $dby12074$pt-dbms-sql-5-unique-constraint$dby12074$,
   $dby12075$Is UNIQUE the correct mechanism to enforce an alternate key (5.4)?$dby12075$,
   $dby12076$["No, alternate keys cannot be enforced in SQL", "Yes \u2014 UNIQUE is exactly the SQL mechanism used to enforce alternate keys and other non-primary distinctness rules", "Only PRIMARY KEY can enforce any kind of key", "Alternate keys require a CHECK constraint instead"]$dby12076$::jsonb,
   1, $dby12077$UNIQUE is precisely how a candidate key that isn't the primary key gets enforced at the database level.$dby12077$, 1, 7)
on conflict (id) do nothing;

-- 5.10 Entity Integrity
with g as (select id from public.learning_grids where lower(slug) = $dby12078$dbms-sql-tutorial$dby12078$),
     s as (select id from public.learning_sections where lower(slug) = $dby12079$chapter-5-keys-and-integrity$dby12079$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby12080$Entity Integrity$dby12080$, $dby12081$entity-integrity$dby12081$, '', 10, 'published', true, true, $dby12082$dbms_sql_tutorial$dby12082$, $dby12083$chapter-5-keys-and-integrity/entity-integrity$dby12083$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby12084$dbms_sql_tutorial$dby12084$ and source_ref = $dby12085$chapter-5-keys-and-integrity/entity-integrity$dby12085$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby12086$Entity Integrity$dby12086$, $dby12087$### Definition

**Entity integrity** is the rule that every table's primary key value must be unique AND never `NULL`. It guarantees that every row represents one distinct, identifiable, real "entity" — you can never have a row whose identity is unknown or shared with another row.

### How It Works

Declaring `PRIMARY KEY` in SQL directly implements entity integrity — both halves (uniqueness and `NOT NULL`) are enforced automatically the moment you write `id INT PRIMARY KEY`, with no extra keywords needed:

```sql
CREATE TABLE students (
  id INT PRIMARY KEY,   -- entity integrity: id is both UNIQUE and NOT NULL, automatically
  name VARCHAR(100) NOT NULL
);
```

Without entity integrity, two serious problems become possible: (1) a row with `id = NULL` — a row that exists but has no identity, which the relational model has no coherent way to talk about ("which row do you mean?"); and (2) two rows both claiming `id = 7` — an ambiguous reference, since any query or foreign key pointing at "the row with id 7" would no longer know which one is meant.

### Edge Cases and Pitfalls

- Entity integrity applies specifically to the PRIMARY KEY — a `UNIQUE` alternate-key column is NOT subject to entity integrity's NOT-NULL half (as covered in 5.9, `UNIQUE` still permits NULLs).
- Entity integrity is a NECESSARY condition for a working relational database, but it is not SUFFICIENT on its own for overall data correctness — a row can perfectly satisfy entity integrity (a valid, unique, non-null id) while still containing wrong or nonsensical data in its other columns.
- Composite primary keys must satisfy entity integrity as a whole combination — no single component column of the composite key is allowed to be `NULL` either, since a `NULL` in any part of the key breaks the guarantee that the row's identity is fully known.

### Key Takeaways

- Entity integrity = primary key values are always unique and never NULL.
- It's automatically enforced by declaring PRIMARY KEY — no extra syntax required.
- It guarantees every row has a well-defined, unambiguous identity, but says nothing about the correctness of the row's other data.$dby12087$, 'markdown', 0, 'published', jsonb_build_object('source', $dby12088$dbms_sql_tutorial_seed$dby12088$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby12089$dbms_sql_tutorial_seed$dby12089$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby12090$dbms-sql-tutorial$dby12090$),
     t as (select id from public.learning_topics where source_kind = $dby12091$dbms_sql_tutorial$dby12091$ and source_ref = $dby12092$chapter-5-keys-and-integrity/entity-integrity$dby12092$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby12093$pt-dbms-sql-5-entity-integrity$dby12093$, $dby12094$Entity Integrity - Quick Test$dby12094$, 'aptitude', 8, 8,
  $dby12095$8 questions on Entity Integrity.$dby12095$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby12096$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby12096$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby12097$tq-dbms-sql-5-entity-integrity-1$dby12097$, $dby12098$pt-dbms-sql-5-entity-integrity$dby12098$,
   $dby12099$What does entity integrity guarantee?$dby12099$,
   $dby12100$["That every column value is unique", "That the primary key is always unique and never NULL", "That every table has at least 10 rows", "That foreign keys always match a parent row"]$dby12100$::jsonb,
   1, $dby12101$Entity integrity is specifically about the primary key's uniqueness and non-nullability.$dby12101$, 1, 0),
  ($dby12102$tq-dbms-sql-5-entity-integrity-2$dby12102$, $dby12103$pt-dbms-sql-5-entity-integrity$dby12103$,
   $dby12104$How is entity integrity enforced in SQL?$dby12104$,
   $dby12105$["By writing a custom trigger for every table", "Automatically, simply by declaring a column PRIMARY KEY", "By adding a CHECK constraint manually", "Entity integrity cannot be enforced by SQL"]$dby12105$::jsonb,
   1, $dby12106$PRIMARY KEY bundles both the uniqueness and NOT NULL requirements automatically.$dby12106$, 1, 1),
  ($dby12107$tq-dbms-sql-5-entity-integrity-3$dby12107$, $dby12108$pt-dbms-sql-5-entity-integrity$dby12108$,
   $dby12109$Why is a NULL primary key value considered a serious problem?$dby12109$,
   $dby12110$["It merely wastes a small amount of storage", "It would create a row with no well-defined identity, making it impossible to reliably reference or distinguish from other rows", "NULL values take longer to compare than other values", "It is not actually a problem in modern databases"]$dby12110$::jsonb,
   1, $dby12111$A NULL identity breaks the fundamental guarantee that every row can be uniquely and unambiguously referred to.$dby12111$, 1, 2),
  ($dby12112$tq-dbms-sql-5-entity-integrity-4$dby12112$, $dby12113$pt-dbms-sql-5-entity-integrity$dby12113$,
   $dby12114$Does entity integrity apply to alternate keys enforced via UNIQUE?$dby12114$,
   $dby12115$["Yes, identically to primary keys", "No \u2014 entity integrity specifically concerns the PRIMARY KEY; a UNIQUE alternate key can still permit NULLs", "Only if the alternate key is also composite", "Entity integrity applies to every column in the table"]$dby12115$::jsonb,
   1, $dby12116$Entity integrity is a primary-key-specific rule; UNIQUE alone doesn't carry the same NOT-NULL guarantee.$dby12116$, 1, 3),
  ($dby12117$tq-dbms-sql-5-entity-integrity-5$dby12117$, $dby12118$pt-dbms-sql-5-entity-integrity$dby12118$,
   $dby12119$For a composite primary key, what does entity integrity require about its individual component columns?$dby12119$,
   $dby12120$["Only the first column needs to be NOT NULL", "None of the component columns may be NULL \u2014 a NULL in any part breaks the row's overall identity guarantee", "At least one component column must be NULL", "Composite keys are exempt from entity integrity"]$dby12120$::jsonb,
   1, $dby12121$Since the full combination defines the row's identity, every component column must be non-null for that identity to be complete and known.$dby12121$, 1, 4),
  ($dby12122$tq-dbms-sql-5-entity-integrity-6$dby12122$, $dby12123$pt-dbms-sql-5-entity-integrity$dby12123$,
   $dby12124$Does satisfying entity integrity guarantee that a row's data is otherwise correct?$dby12124$,
   $dby12125$["Yes, entity integrity guarantees full data correctness", "No \u2014 entity integrity only guarantees the row has a valid, unique, non-null identity; other columns could still contain wrong or nonsensical values", "Entity integrity guarantees correctness only for numeric columns", "This question doesn't apply to entity integrity"]$dby12125$::jsonb,
   1, $dby12126$Entity integrity is necessary but not sufficient — it says nothing about whether the rest of the row's data is accurate.$dby12126$, 1, 5),
  ($dby12127$tq-dbms-sql-5-entity-integrity-7$dby12127$, $dby12128$pt-dbms-sql-5-entity-integrity$dby12128$,
   $dby12129$What real ambiguity would arise from two rows both having primary key value 7?$dby12129$,
   $dby12130$["No ambiguity \u2014 the database would simply pick one at random consistently", "Any query or foreign key referencing 'the row with id 7' would have no way to know which of the two rows was meant", "SQL would automatically rename one of the rows", "This scenario is impossible to describe in relational terms, but has no practical consequence"]$dby12130$::jsonb,
   1, $dby12131$Duplicate primary key values destroy the ability to unambiguously reference a specific row, which is exactly what entity integrity prevents.$dby12131$, 1, 6),
  ($dby12132$tq-dbms-sql-5-entity-integrity-8$dby12132$, $dby12133$pt-dbms-sql-5-entity-integrity$dby12133$,
   $dby12134$Is entity integrity a relational-model concept, a SQL-specific feature, or both?$dby12134$,
   $dby12135$["A relational-model concept, which SQL happens to implement via the PRIMARY KEY constraint", "A SQL-only feature with no theoretical basis", "A NoSQL-only concept", "A concept that applies only to foreign keys"]$dby12135$::jsonb,
   0, $dby12136$Entity integrity is one of the relational model's foundational integrity rules; PRIMARY KEY is simply how SQL implements it.$dby12136$, 1, 7)
on conflict (id) do nothing;

-- 5.11 Referential Integrity
with g as (select id from public.learning_grids where lower(slug) = $dby12137$dbms-sql-tutorial$dby12137$),
     s as (select id from public.learning_sections where lower(slug) = $dby12138$chapter-5-keys-and-integrity$dby12138$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby12139$Referential Integrity$dby12139$, $dby12140$referential-integrity$dby12140$, '', 11, 'published', true, true, $dby12141$dbms_sql_tutorial$dby12141$, $dby12142$chapter-5-keys-and-integrity/referential-integrity$dby12142$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby12143$dbms_sql_tutorial$dby12143$ and source_ref = $dby12144$chapter-5-keys-and-integrity/referential-integrity$dby12144$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby12145$Referential Integrity$dby12145$, $dby12146$### Definition

**Referential integrity** is the rule that a foreign key value must either match an existing value in the referenced (parent) table's key, or be `NULL` (if permitted) — a foreign key can never point at a row that doesn't exist. It's the relational-model concept; the `FOREIGN KEY` constraint (5.5) is the SQL mechanism that enforces it.

### How It Works

```sql
CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(100));
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

If referential integrity is properly enforced, `employees.department_id` can only ever be a value that genuinely exists in `departments.id`, or `NULL`. Finding rows that would violate this — useful both as a data-quality audit and to understand what the constraint is actually protecting against — is a classic anti-join:

```sql
SELECT e.id, e.name, e.department_id
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
WHERE d.id IS NULL;
```
Any row returned here has a `department_id` that doesn't correspond to any real department — exactly what a real `FOREIGN KEY` constraint would have prevented from ever being inserted in the first place.

### Edge Cases and Pitfalls

- Referential integrity is commonly violated in real systems specifically where a `FOREIGN KEY` constraint was never actually declared (e.g. the relationship is only "known" by convention or enforced in application code) — the anti-join query above is the standard way to discover such violations after the fact.
- Deleting or updating a referenced parent row is the main operation referential integrity restricts — this is exactly why **cascading actions** (5.12) exist, to specify what should happen to the child rows instead of simply failing the operation.
- Referential integrity says nothing about whether the reference is *semantically* sensible (e.g. an employee correctly pointing at a real department that happens to be the wrong one for their actual job) — it only guarantees the reference points at something that exists, not that it's the right something.

### Key Takeaways

- Referential integrity = every foreign key value matches a real parent row, or is NULL.
- `FOREIGN KEY` is how SQL enforces it; an anti-join (`LEFT JOIN ... WHERE parent.id IS NULL`) is how you detect violations if it wasn't enforced.
- It guarantees existence of the reference, not semantic correctness of it.$dby12146$, 'markdown', 0, 'published', jsonb_build_object('source', $dby12147$dbms_sql_tutorial_seed$dby12147$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby12148$dbms_sql_tutorial_seed$dby12148$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby12149$dbms-sql-tutorial$dby12149$),
     t as (select id from public.learning_topics where source_kind = $dby12150$dbms_sql_tutorial$dby12150$ and source_ref = $dby12151$chapter-5-keys-and-integrity/referential-integrity$dby12151$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby12152$pt-dbms-sql-5-referential-integrity$dby12152$, $dby12153$Referential Integrity - Quick Test$dby12153$, 'aptitude', 8, 8,
  $dby12154$8 questions on Referential Integrity.$dby12154$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby12155$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby12155$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby12156$tq-dbms-sql-5-referential-integrity-1$dby12156$, $dby12157$pt-dbms-sql-5-referential-integrity$dby12157$,
   $dby12158$What does referential integrity guarantee?$dby12158$,
   $dby12159$["That every column has a default value", "That a foreign key value matches an existing parent row, or is NULL", "That every table has a foreign key", "That primary keys are always integers"]$dby12159$::jsonb,
   1, $dby12160$Referential integrity is specifically about foreign key values always corresponding to a real (or absent) parent row.$dby12160$, 1, 0),
  ($dby12161$tq-dbms-sql-5-referential-integrity-2$dby12161$, $dby12162$pt-dbms-sql-5-referential-integrity$dby12162$,
   $dby12163$Which SQL mechanism directly enforces referential integrity?$dby12163$,
   $dby12164$["UNIQUE constraint", "FOREIGN KEY constraint", "CHECK constraint", "DEFAULT clause"]$dby12164$::jsonb,
   1, $dby12165$The FOREIGN KEY constraint is SQL's implementation of the referential integrity rule.$dby12165$, 1, 1),
  ($dby12166$tq-dbms-sql-5-referential-integrity-3$dby12166$, $dby12167$pt-dbms-sql-5-referential-integrity$dby12167$,
   $dby12168$Which query correctly finds employees whose department_id doesn't correspond to any real department?$dby12168$,
   $dby12169$["SELECT * FROM employees WHERE department_id IS NOT NULL", "SELECT e.* FROM employees e LEFT JOIN departments d ON d.id = e.department_id WHERE d.id IS NULL", "SELECT * FROM departments WHERE id IS NULL", "SELECT * FROM employees INNER JOIN departments ON employees.department_id = departments.id"]$dby12169$::jsonb,
   1, $dby12170$A LEFT JOIN followed by filtering for a NULL on the parent side is the standard anti-join pattern for finding orphaned references.$dby12170$, 1, 2),
  ($dby12171$tq-dbms-sql-5-referential-integrity-4$dby12171$, $dby12172$pt-dbms-sql-5-referential-integrity$dby12172$,
   $dby12173$Does referential integrity guarantee that a foreign key reference is semantically correct, not just that it exists?$dby12173$,
   $dby12174$["Yes, it guarantees full semantic correctness", "No \u2014 it only guarantees the referenced row exists, not that it's the 'right' one for the business situation", "It guarantees correctness only for numeric foreign keys", "This distinction doesn't apply to referential integrity"]$dby12174$::jsonb,
   1, $dby12175$Referential integrity is purely about existence of the reference, not about whether it makes business sense.$dby12175$, 1, 3),
  ($dby12176$tq-dbms-sql-5-referential-integrity-5$dby12176$, $dby12177$pt-dbms-sql-5-referential-integrity$dby12177$,
   $dby12178$In real systems, why is referential integrity sometimes violated despite the concept being well understood?$dby12178$,
   $dby12179$["It's impossible for this to happen in any real system", "A FOREIGN KEY constraint may never have actually been declared, letting invalid references accumulate silently over time", "Referential integrity is disabled by default in every SQL engine", "SQL databases automatically ignore referential integrity after 1 million rows"]$dby12179$::jsonb,
   1, $dby12180$Without an actual enforced constraint, the relationship exists only by convention, and violations can silently accumulate.$dby12180$, 1, 4),
  ($dby12181$tq-dbms-sql-5-referential-integrity-6$dby12181$, $dby12182$pt-dbms-sql-5-referential-integrity$dby12182$,
   $dby12183$What operation on a parent row does referential integrity most directly restrict?$dby12183$,
   $dby12184$["SELECT queries on the parent table", "Deleting or updating a parent row that child rows still reference", "Creating new columns on the parent table", "Renaming the parent table"]$dby12184$::jsonb,
   1, $dby12185$Referential integrity blocks operations that would orphan existing child references, unless a cascading action is configured.$dby12185$, 1, 5),
  ($dby12186$tq-dbms-sql-5-referential-integrity-7$dby12186$, $dby12187$pt-dbms-sql-5-referential-integrity$dby12187$,
   $dby12188$What is the relationship between referential integrity and the foreign key constraint?$dby12188$,
   $dby12189$["They are unrelated", "Referential integrity is the conceptual/relational-model rule; FOREIGN KEY is the concrete SQL mechanism that enforces it", "FOREIGN KEY is a stricter, unrelated concept", "Referential integrity only applies to composite keys"]$dby12189$::jsonb,
   1, $dby12190$This mirrors the pattern of entity integrity/PRIMARY KEY — a theoretical rule paired with its concrete SQL enforcement mechanism.$dby12190$, 1, 6),
  ($dby12191$tq-dbms-sql-5-referential-integrity-8$dby12191$, $dby12192$pt-dbms-sql-5-referential-integrity$dby12192$,
   $dby12193$If department_id is NULL for an employee row, does this violate referential integrity?$dby12193$,
   $dby12194$["Yes, always", "No \u2014 NULL is a valid state (no reference yet) as long as the column allows it; only a non-NULL value pointing at a non-existent row would violate it", "Only if department_id is also the primary key", "This cannot be determined without more information about NULL handling in general"]$dby12194$::jsonb,
   1, $dby12195$A NULL foreign key simply means 'not referencing anything yet,' which is compatible with referential integrity, not a violation of it.$dby12195$, 1, 7)
on conflict (id) do nothing;

-- 5.12 Cascading Actions
with g as (select id from public.learning_grids where lower(slug) = $dby12196$dbms-sql-tutorial$dby12196$),
     s as (select id from public.learning_sections where lower(slug) = $dby12197$chapter-5-keys-and-integrity$dby12197$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby12198$Cascading Actions$dby12198$, $dby12199$cascading-actions$dby12199$, '', 12, 'published', true, true, $dby12200$dbms_sql_tutorial$dby12200$, $dby12201$chapter-5-keys-and-integrity/cascading-actions$dby12201$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby12202$dbms_sql_tutorial$dby12202$ and source_ref = $dby12203$chapter-5-keys-and-integrity/cascading-actions$dby12203$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby12204$Cascading Actions$dby12204$, $dby12205$### Definition

**Cascading actions** tell the database what to do to child rows automatically when a referenced parent row is updated or deleted, instead of simply rejecting the operation. They're specified as part of a `FOREIGN KEY` declaration using `ON DELETE` / `ON UPDATE` clauses.

### How It Works

```sql
CREATE TABLE departments (id INT PRIMARY KEY, name VARCHAR(100));

CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  department_id INT,
  FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE CASCADE       -- deleting a department deletes its employees too
    ON UPDATE CASCADE       -- if a department's id ever changes, employees follow automatically
);
```

The main options, and what each means for `employees` when the referenced `departments` row is deleted:
- **`RESTRICT`** (often the default) — refuse the delete outright if any employees still reference this department.
- **`CASCADE`** — delete the referencing employees too, automatically.
- **`SET NULL`** — set `employees.department_id` to `NULL` for those rows (the column must allow NULL).
- **`NO ACTION`** — similar to `RESTRICT` in most engines (the exact timing difference is a subtle, engine-specific detail).

### Edge Cases and Pitfalls

- `ON DELETE CASCADE` is powerful and genuinely convenient, but also genuinely dangerous: deleting one department row can silently delete an entire tree of dependent data (employees, and anything THOSE rows cascade to in turn) — always confirm the intended blast radius before relying on it, especially in a chain of several cascading tables.
- `SET NULL` requires the foreign key column to actually allow `NULL` — declaring `ON DELETE SET NULL` on a `NOT NULL` foreign key column is a contradiction that will fail as soon as the cascading action is actually triggered.
- Choosing `RESTRICT` (the safe default in many systems) means the application must handle the failure explicitly (e.g. "you must reassign or remove these employees before deleting this department") — it's more manual work, but far less likely to destroy data by accident.

### Key Takeaways

- Cascading actions (`RESTRICT`/`CASCADE`/`SET NULL`/`NO ACTION`) decide what happens to child rows when a parent row is deleted or updated.
- `CASCADE` is convenient but can propagate deletes far further than expected — verify the full dependency chain.
- `SET NULL` only works if the foreign key column permits NULL values.$dby12205$, 'markdown', 0, 'published', jsonb_build_object('source', $dby12206$dbms_sql_tutorial_seed$dby12206$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby12207$dbms_sql_tutorial_seed$dby12207$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby12208$dbms-sql-tutorial$dby12208$),
     t as (select id from public.learning_topics where source_kind = $dby12209$dbms_sql_tutorial$dby12209$ and source_ref = $dby12210$chapter-5-keys-and-integrity/cascading-actions$dby12210$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby12211$pt-dbms-sql-5-cascading-actions$dby12211$, $dby12212$Cascading Actions - Quick Test$dby12212$, 'aptitude', 8, 8,
  $dby12213$8 questions on Cascading Actions.$dby12213$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby12214$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby12214$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby12215$tq-dbms-sql-5-cascading-actions-1$dby12215$, $dby12216$pt-dbms-sql-5-cascading-actions$dby12216$,
   $dby12217$What are cascading actions used for?$dby12217$,
   $dby12218$["Encrypting foreign key values", "Specifying what happens to child rows when a referenced parent row is updated or deleted", "Automatically creating new indexes", "Renaming columns automatically"]$dby12218$::jsonb,
   1, $dby12219$ON DELETE/ON UPDATE cascading actions define the automatic response to changes on the parent side of a foreign key.$dby12219$, 1, 0),
  ($dby12220$tq-dbms-sql-5-cascading-actions-2$dby12220$, $dby12221$pt-dbms-sql-5-cascading-actions$dby12221$,
   $dby12222$What does ON DELETE CASCADE do?$dby12222$,
   $dby12223$["Refuses the delete if any child rows exist", "Automatically deletes the child rows that reference the deleted parent row", "Sets the child rows' foreign key to NULL", "Renames the child rows"]$dby12223$::jsonb,
   1, $dby12224$CASCADE propagates the delete to referencing child rows automatically.$dby12224$, 1, 1),
  ($dby12225$tq-dbms-sql-5-cascading-actions-3$dby12225$, $dby12226$pt-dbms-sql-5-cascading-actions$dby12226$,
   $dby12227$What must be true of a foreign key column for ON DELETE SET NULL to work?$dby12227$,
   $dby12228$["It must be the primary key", "The column must allow NULL values", "It must be a composite key", "It must reference exactly one other table"]$dby12228$::jsonb,
   1, $dby12229$SET NULL requires the column to permit NULL — attempting it on a NOT NULL foreign key column fails.$dby12229$, 1, 2),
  ($dby12230$tq-dbms-sql-5-cascading-actions-4$dby12230$, $dby12231$pt-dbms-sql-5-cascading-actions$dby12231$,
   $dby12232$What is the main risk of using ON DELETE CASCADE broadly?$dby12232$,
   $dby12233$["It has no risk and should always be used", "Deleting one row can silently trigger a much larger chain of deletions than expected, especially across multiple cascading tables", "CASCADE always requires manual confirmation before running", "CASCADE only works on SELECT statements"]$dby12233$::jsonb,
   1, $dby12234$Cascades can chain through multiple foreign key relationships, deleting far more data than a developer might initially expect.$dby12234$, 1, 3),
  ($dby12235$tq-dbms-sql-5-cascading-actions-5$dby12235$, $dby12236$pt-dbms-sql-5-cascading-actions$dby12236$,
   $dby12237$What does RESTRICT do when a delete is attempted on a referenced parent row?$dby12237$,
   $dby12238$["Deletes the child rows automatically", "Rejects/blocks the delete if any child rows still reference the parent", "Sets the parent row to NULL", "Silently ignores the delete request with no error"]$dby12238$::jsonb,
   1, $dby12239$RESTRICT is the 'safe' option that refuses to orphan or cascade — the operation must be handled explicitly instead.$dby12239$, 1, 4),
  ($dby12240$tq-dbms-sql-5-cascading-actions-6$dby12240$, $dby12241$pt-dbms-sql-5-cascading-actions$dby12241$,
   $dby12242$Why might a team deliberately choose RESTRICT over CASCADE, despite the extra manual work?$dby12242$,
   $dby12243$["RESTRICT is always faster to execute", "It forces an explicit decision about dependent rows rather than risking accidental, far-reaching automatic deletion", "RESTRICT is required by the SQL standard in every case", "CASCADE is not supported by any real database"]$dby12243$::jsonb,
   1, $dby12244$Trading convenience for safety is a deliberate, common design choice, especially for high-stakes parent tables.$dby12244$, 1, 5),
  ($dby12245$tq-dbms-sql-5-cascading-actions-7$dby12245$, $dby12246$pt-dbms-sql-5-cascading-actions$dby12246$,
   $dby12247$Where is a cascading action specified in SQL?$dby12247$,
   $dby12248$["As a separate CASCADE statement run after CREATE TABLE", "As part of the FOREIGN KEY declaration, via ON DELETE / ON UPDATE clauses", "As a comment in the schema", "In a separate configuration file outside SQL entirely"]$dby12248$::jsonb,
   1, $dby12249$Cascading behavior is declared directly on the FOREIGN KEY constraint itself.$dby12249$, 1, 6),
  ($dby12250$tq-dbms-sql-5-cascading-actions-8$dby12250$, $dby12251$pt-dbms-sql-5-cascading-actions$dby12251$,
   $dby12252$In a three-level chain (A referenced by B, B referenced by C, both with ON DELETE CASCADE), what happens when a row in A is deleted?$dby12252$,
   $dby12253$["Only B's matching rows are affected; C is never touched", "The cascade can propagate through B into C as well, potentially deleting rows in both dependent tables", "Nothing happens unless C is also directly referenced from A", "This configuration is not allowed by SQL"]$dby12253$::jsonb,
   1, $dby12254$Cascades chain across multiple foreign key relationships, which is exactly why the 'blast radius' of CASCADE needs careful attention in deep dependency chains.$dby12254$, 1, 7)
on conflict (id) do nothing;

-- 5.13 Business Constraints
with g as (select id from public.learning_grids where lower(slug) = $dby12255$dbms-sql-tutorial$dby12255$),
     s as (select id from public.learning_sections where lower(slug) = $dby12256$chapter-5-keys-and-integrity$dby12256$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dby12257$Business Constraints$dby12257$, $dby12258$business-constraints$dby12258$, '', 13, 'published', true, true, $dby12259$dbms_sql_tutorial$dby12259$, $dby12260$chapter-5-keys-and-integrity/business-constraints$dby12260$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dby12261$dbms_sql_tutorial$dby12261$ and source_ref = $dby12262$chapter-5-keys-and-integrity/business-constraints$dby12262$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dby12263$Business Constraints$dby12263$, $dby12264$### Definition

**Business constraints** (also called semantic or domain-specific constraints) are integrity rules that come from the real-world rules of the business itself, rather than from the structural relational-model rules covered elsewhere in this chapter (entity integrity, referential integrity). SQL's `CHECK` constraint is the main mechanism used to enforce them directly in the schema.

### How It Works

```sql
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  salary INT CHECK (salary > 0),
  hire_date DATE,
  termination_date DATE,
  CHECK (termination_date IS NULL OR termination_date >= hire_date)
);
```

Neither of these rules comes from the relational model itself — nothing about "being a valid relation" requires salary to be positive or termination to come after hiring. They come from the *business domain*: a negative salary is nonsensical, and someone can't be terminated before they were hired. `CHECK` constraints let the database itself refuse to store data that violates these business-specific rules, rather than relying entirely on application code to catch them (which every calling application would then need to duplicate correctly).

### Edge Cases and Pitfalls

- Business rules are the most likely category of constraint to CHANGE over time as the actual business changes (e.g. a minimum-salary rule changing when regulations change) — unlike entity/referential integrity, which are stable, timeless properties of the relational model itself.
- Overly strict `CHECK` constraints can block legitimate edge cases the designer didn't anticipate (e.g. a `CHECK (age >= 18)` on a "customer" table breaks the moment the business decides to support minors with a guardian) — business constraints need periodic review, not "set once and forget."
- Complex business rules that span MULTIPLE rows or tables (e.g. "the total of all order line items must equal the order's stated total") generally can't be expressed as a simple single-row `CHECK` constraint — those require triggers (covered in Chapter 30) or careful application-level enforcement instead.

### Key Takeaways

- Business constraints encode real-world domain rules, not structural relational-model requirements.
- `CHECK` is SQL's direct mechanism for enforcing single-row business rules.
- Business rules change more often than structural integrity rules, and some (multi-row rules) need triggers rather than a plain CHECK.$dby12264$, 'markdown', 0, 'published', jsonb_build_object('source', $dby12265$dbms_sql_tutorial_seed$dby12265$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dby12266$dbms_sql_tutorial_seed$dby12266$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dby12267$dbms-sql-tutorial$dby12267$),
     t as (select id from public.learning_topics where source_kind = $dby12268$dbms_sql_tutorial$dby12268$ and source_ref = $dby12269$chapter-5-keys-and-integrity/business-constraints$dby12269$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dby12270$pt-dbms-sql-5-business-constraints$dby12270$, $dby12271$Business Constraints - Quick Test$dby12271$, 'aptitude', 8, 8,
  $dby12272$8 questions on Business Constraints.$dby12272$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dby12273$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dby12273$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dby12274$tq-dbms-sql-5-business-constraints-1$dby12274$, $dby12275$pt-dbms-sql-5-business-constraints$dby12275$,
   $dby12276$What are business constraints?$dby12276$,
   $dby12277$["Rules automatically generated by the SQL standard", "Integrity rules coming from the real-world domain/business rather than the structural relational model", "A synonym for foreign key constraints", "Constraints that only apply to financial data"]$dby12277$::jsonb,
   1, $dby12278$Business constraints encode domain-specific rules like 'salary must be positive,' not structural rules like uniqueness.$dby12278$, 1, 0),
  ($dby12279$tq-dbms-sql-5-business-constraints-2$dby12279$, $dby12280$pt-dbms-sql-5-business-constraints$dby12280$,
   $dby12281$Which SQL mechanism is primarily used to enforce single-row business constraints?$dby12281$,
   $dby12282$["FOREIGN KEY", "CHECK", "UNIQUE", "PRIMARY KEY"]$dby12282$::jsonb,
   1, $dby12283$CHECK constraints directly express arbitrary boolean conditions a row's data must satisfy.$dby12283$, 1, 1),
  ($dby12284$tq-dbms-sql-5-business-constraints-3$dby12284$, $dby12285$pt-dbms-sql-5-business-constraints$dby12285$,
   $dby12286$Why is `CHECK (salary > 0)` considered a business constraint rather than a structural one?$dby12286$,
   $dby12287$["Because CHECK constraints are always structural", "Because nothing about the relational model itself requires salary to be positive \u2014 this rule comes from real-world business logic", "Because it references another table", "Because it involves a NULL comparison"]$dby12287$::jsonb,
   1, $dby12288$The rule reflects a domain fact (salaries can't be negative), not a requirement of relational theory.$dby12288$, 1, 2),
  ($dby12289$tq-dbms-sql-5-business-constraints-4$dby12289$, $dby12290$pt-dbms-sql-5-business-constraints$dby12290$,
   $dby12291$Why might a CHECK constraint need to be revisited over time more often than a PRIMARY KEY constraint?$dby12291$,
   $dby12292$["CHECK constraints expire automatically after a year", "Business rules change as the actual business changes, while structural integrity rules like entity integrity are stable and timeless", "PRIMARY KEY constraints are also frequently revised for the same reasons", "CHECK constraints are deprecated and always being phased out"]$dby12292$::jsonb,
   1, $dby12293$Business logic evolves with real-world policy/regulation changes, unlike the timeless structural rules of the relational model.$dby12293$, 1, 3),
  ($dby12294$tq-dbms-sql-5-business-constraints-5$dby12294$, $dby12295$pt-dbms-sql-5-business-constraints$dby12295$,
   $dby12296$Can a simple single-table CHECK constraint enforce a rule like 'the sum of an order's line items must equal the order's total'?$dby12296$,
   $dby12297$["Yes, easily, with a single CHECK clause", "Generally no \u2014 multi-row/multi-table rules like this typically require triggers or application-level enforcement instead", "Only if the order has exactly one line item", "CHECK constraints can only be used on numeric columns"]$dby12297$::jsonb,
   1, $dby12298$CHECK constraints evaluate a single row's own columns; enforcing a rule that spans multiple rows needs a trigger or equivalent mechanism.$dby12298$, 1, 4),
  ($dby12299$tq-dbms-sql-5-business-constraints-6$dby12299$, $dby12300$pt-dbms-sql-5-business-constraints$dby12300$,
   $dby12301$What is a real risk of an overly strict CHECK constraint?$dby12301$,
   $dby12302$["It has no risk if written correctly", "It can block legitimate real-world edge cases the designer didn't originally anticipate", "CHECK constraints can never be too strict", "It will automatically loosen itself over time"]$dby12302$::jsonb,
   1, $dby12303$A rule that seemed universally true at design time can turn out to have legitimate exceptions later, requiring the constraint to be revisited.$dby12303$, 1, 5),
  ($dby12304$tq-dbms-sql-5-business-constraints-7$dby12304$, $dby12305$pt-dbms-sql-5-business-constraints$dby12305$,
   $dby12306$Why is relying only on application code (and not a database CHECK constraint) to enforce a business rule considered risky?$dby12306$,
   $dby12307$["Application code is always slower than CHECK constraints", "Every application/service that writes to the table would need to correctly duplicate and maintain the same validation logic, and any one that misses it can insert bad data", "Application code cannot access business rules at all", "This is not actually risky in any way"]$dby12307$::jsonb,
   1, $dby12308$A database-level constraint is enforced centrally for every writer, whereas application-only validation must be correctly replicated everywhere data is written.$dby12308$, 1, 6),
  ($dby12309$tq-dbms-sql-5-business-constraints-8$dby12309$, $dby12310$pt-dbms-sql-5-business-constraints$dby12310$,
   $dby12311$Which of these is a structural (relational-model) rule rather than a business constraint?$dby12311$,
   $dby12312$["Salary must be positive", "Entity integrity (primary key uniqueness and non-nullability)", "Termination date must be after hire date", "A discount code must not exceed 50%"]$dby12312$::jsonb,
   1, $dby12313$Entity integrity is a foundational relational-model rule, independent of any specific business domain — unlike the other, domain-specific examples.$dby12313$, 1, 7)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. CHAPTER TESTS — one per new chapter (3, 4, 5). Pools are LIVE joins via
--    practice_test_pool() (0091/063); no test_questions of their own.
-- ===========================================================================
with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dby12314$chapter-3-data-models$dby12314$ and lower(g.slug) = $dby12315$dbms-sql-tutorial$dby12315$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dby12316$pt-dbms-sql-ch3-test$dby12316$, $dby12317$Data Models - Chapter Test$dby12317$, 'aptitude', sec.id, 'chapter', true, 12,
  17,
  $dby12318$12 randomly-sampled questions drawn from every Data Models topic quiz.$dby12318$,
  'published', true, true, true, 'Medium', 0,
  $dby12319$This test randomly samples 12 questions from all of Chapter 3's topic quizzes. Each carries 1 mark. No negative marking. You have 17 minutes.$dby12319$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dby12320$chapter-4-relational-model$dby12320$ and lower(g.slug) = $dby12321$dbms-sql-tutorial$dby12321$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dby12322$pt-dbms-sql-ch4-test$dby12322$, $dby12323$Relational Model - Chapter Test$dby12323$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dby12324$15 randomly-sampled questions drawn from every Relational Model topic quiz.$dby12324$,
  'published', true, true, true, 'Medium', 0,
  $dby12325$This test randomly samples 15 questions from all of Chapter 4's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dby12325$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dby12326$chapter-5-keys-and-integrity$dby12326$ and lower(g.slug) = $dby12327$dbms-sql-tutorial$dby12327$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dby12328$pt-dbms-sql-ch5-test$dby12328$, $dby12329$Keys and Integrity - Chapter Test$dby12329$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dby12330$15 randomly-sampled questions drawn from every Keys and Integrity topic quiz.$dby12330$,
  'published', true, true, true, 'Medium', 0,
  $dby12331$This test randomly samples 15 questions from all of Chapter 5's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dby12331$
from sec
on conflict (id) do nothing;

-- ===========================================================================
-- 4. SQL CODING PROBLEMS (Chapter 5 — keys/integrity map onto real SELECT-
--    based problems: finding rows that violate an intended key or FK).
--    Verified end-to-end against Paiza's live MySQL sandbox (2026-09).
-- ===========================================================================
-- Duplicate Enrollments (topic chapter-5-keys-and-integrity/composite-key)
with t as (select id from public.learning_topics where source_kind = $dby12335$dbms_sql_tutorial$dby12335$ and source_ref = $dby12336$chapter-5-keys-and-integrity/composite-key$dby12336$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dby12337$cp-dbms-sql-duplicate-enrollments$dby12337$, null::text, $dby12338$Duplicate Enrollments$dby12338$, $dby12339$Medium$dby12339$, $dby12340$duplicate-enrollments$dby12340$,
  $dby12341$A student should not be able to enroll in the same course in the same semester twice — `(student_id, course_id, semester)` is meant to be a composite candidate key on `enrollments`, but it isn't enforced yet. Write a query returning `student_id`, `course_id`, `semester`, and a `cnt` column, for every combination that appears more than once.

```sql
CREATE TABLE enrollments (
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  semester TEXT NOT NULL
);
```

**Sample data** (this is what your query runs against when you press Run):

```sql
INSERT INTO enrollments (student_id, course_id, semester) VALUES
(1, 101, 'Fall2025'),
(1, 102, 'Fall2025'),
(2, 101, 'Fall2025'),
(1, 101, 'Fall2025'),
(2, 102, 'Spring2026'),
(3, 101, 'Fall2025');
```
$dby12341$,
  $dby12332$[{"input": "", "output": "student_id\tcourse_id\tsemester\tcnt\n1\t101\tFall2025\t2"}]$dby12332$::jsonb, $dby12333$[{"hidden": true, "seed_sql": "INSERT INTO enrollments (student_id, course_id, semester) VALUES\n(5, 201, 'Fall2025'),\n(5, 201, 'Fall2025'),\n(6, 202, 'Fall2025'),\n(6, 202, 'Spring2026'),\n(7, 201, 'Fall2025');", "expected": "student_id\tcourse_id\tsemester\tcnt\n5\t201\tFall2025\t2"}]$dby12333$::jsonb, jsonb_build_object('sql', $dby12334$-- Write your SELECT query here
$dby12334$),
  $dby12342$Group by all three columns that together form the intended composite key, then keep groups with more than one row. Reference: `SELECT student_id, course_id, semester, COUNT(*) AS cnt FROM enrollments GROUP BY student_id, course_id, semester HAVING COUNT(*) > 1;`$dby12342$, array['sql'], $dby12343$CREATE TABLE enrollments (
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  semester TEXT NOT NULL
);$dby12343$, $dby12344$INSERT INTO enrollments (student_id, course_id, semester) VALUES
(1, 101, 'Fall2025'),
(1, 102, 'Fall2025'),
(2, 101, 'Fall2025'),
(1, 101, 'Fall2025'),
(2, 102, 'Spring2026'),
(3, 101, 'Fall2025');$dby12344$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Duplicate Emails (topic chapter-5-keys-and-integrity/unique-constraint)
with t as (select id from public.learning_topics where source_kind = $dby12348$dbms_sql_tutorial$dby12348$ and source_ref = $dby12349$chapter-5-keys-and-integrity/unique-constraint$dby12349$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dby12350$cp-dbms-sql-duplicate-emails$dby12350$, null::text, $dby12351$Duplicate Emails$dby12351$, $dby12352$Easy$dby12352$, $dby12353$duplicate-emails$dby12353$,
  $dby12354$The `email` column in `employees` should be unique, but isn't currently enforced. Write a query returning every `email` that appears more than once, along with a `cnt` column showing how many times it appears, ordered by `email`.

```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id INTEGER
);
```

**Sample data** (this is what your query runs against when you press Run):

```sql
INSERT INTO departments (id, name) VALUES
(1, 'Engineering'),
(2, 'Sales'),
(3, 'Marketing');

INSERT INTO employees (id, name, email, department_id) VALUES
(1, 'Asha', 'asha@co.com', 1),
(2, 'Rohan', 'rohan@co.com', 1),
(3, 'Neha', 'neha@co.com', 2),
(4, 'Vikram', 'asha@co.com', 2),
(5, 'Priya', 'priya@co.com', 99),
(6, 'Karan', 'karan@co.com', 3),
(7, 'Divya', 'karan@co.com', 3),
(8, 'Aman', 'aman@co.com', 88);
```
$dby12354$,
  $dby12345$[{"input": "", "output": "email\tcnt\nasha@co.com\t2\nkaran@co.com\t2"}]$dby12345$::jsonb, $dby12346$[{"hidden": true, "seed_sql": "INSERT INTO departments (id, name) VALUES\n(10, 'Finance'),\n(20, 'Legal');\n\nINSERT INTO employees (id, name, email, department_id) VALUES\n(1, 'Zara', 'zara@co.com', 10),\n(2, 'Omar', 'omar@co.com', 20),\n(3, 'Leo', 'zara@co.com', 10),\n(4, 'Mia', 'mia@co.com', 77),\n(5, 'Sam', 'sam@co.com', 20);", "expected": "email\tcnt\nzara@co.com\t2"}]$dby12346$::jsonb, jsonb_build_object('sql', $dby12347$-- Write your SELECT query here
$dby12347$),
  $dby12355$Group by the column that should be unique, then keep only groups with more than one row. Reference: `SELECT email, COUNT(*) AS cnt FROM employees GROUP BY email HAVING COUNT(*) > 1 ORDER BY email;`$dby12355$, array['sql'], $dby12356$CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id INTEGER
);$dby12356$, $dby12357$INSERT INTO departments (id, name) VALUES
(1, 'Engineering'),
(2, 'Sales'),
(3, 'Marketing');

INSERT INTO employees (id, name, email, department_id) VALUES
(1, 'Asha', 'asha@co.com', 1),
(2, 'Rohan', 'rohan@co.com', 1),
(3, 'Neha', 'neha@co.com', 2),
(4, 'Vikram', 'asha@co.com', 2),
(5, 'Priya', 'priya@co.com', 99),
(6, 'Karan', 'karan@co.com', 3),
(7, 'Divya', 'karan@co.com', 3),
(8, 'Aman', 'aman@co.com', 88);$dby12357$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Employees With No Real Department (topic chapter-5-keys-and-integrity/referential-integrity)
with t as (select id from public.learning_topics where source_kind = $dby12361$dbms_sql_tutorial$dby12361$ and source_ref = $dby12362$chapter-5-keys-and-integrity/referential-integrity$dby12362$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dby12363$cp-dbms-sql-employees-with-no-real-department$dby12363$, null::text, $dby12364$Employees With No Real Department$dby12364$, $dby12365$Medium$dby12365$, $dby12366$employees-with-no-real-department$dby12366$,
  $dby12367$Some rows in `employees` have a `department_id` that does not correspond to any row in `departments` — a referential-integrity violation. Write a query returning `id`, `name`, and `department_id` for every such orphaned employee, ordered by `id`.

```sql
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id INTEGER
);
```

**Sample data** (this is what your query runs against when you press Run):

```sql
INSERT INTO departments (id, name) VALUES
(1, 'Engineering'),
(2, 'Sales'),
(3, 'Marketing');

INSERT INTO employees (id, name, email, department_id) VALUES
(1, 'Asha', 'asha@co.com', 1),
(2, 'Rohan', 'rohan@co.com', 1),
(3, 'Neha', 'neha@co.com', 2),
(4, 'Vikram', 'asha@co.com', 2),
(5, 'Priya', 'priya@co.com', 99),
(6, 'Karan', 'karan@co.com', 3),
(7, 'Divya', 'karan@co.com', 3),
(8, 'Aman', 'aman@co.com', 88);
```
$dby12367$,
  $dby12358$[{"input": "", "output": "id\tname\tdepartment_id\n5\tPriya\t99\n8\tAman\t88"}]$dby12358$::jsonb, $dby12359$[{"hidden": true, "seed_sql": "INSERT INTO departments (id, name) VALUES\n(10, 'Finance'),\n(20, 'Legal');\n\nINSERT INTO employees (id, name, email, department_id) VALUES\n(1, 'Zara', 'zara@co.com', 10),\n(2, 'Omar', 'omar@co.com', 20),\n(3, 'Leo', 'zara@co.com', 10),\n(4, 'Mia', 'mia@co.com', 77),\n(5, 'Sam', 'sam@co.com', 20);", "expected": "id\tname\tdepartment_id\n4\tMia\t77"}]$dby12359$::jsonb, jsonb_build_object('sql', $dby12360$-- Write your SELECT query here
$dby12360$),
  $dby12368$A LEFT JOIN to departments, filtered to rows where the department side is NULL, finds exactly the orphaned references. Reference: `SELECT e.id, e.name, e.department_id FROM employees e LEFT JOIN departments d ON d.id = e.department_id WHERE d.id IS NULL ORDER BY e.id;`$dby12368$, array['sql'], $dby12369$CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id INTEGER
);$dby12369$, $dby12370$INSERT INTO departments (id, name) VALUES
(1, 'Engineering'),
(2, 'Sales'),
(3, 'Marketing');

INSERT INTO employees (id, name, email, department_id) VALUES
(1, 'Asha', 'asha@co.com', 1),
(2, 'Rohan', 'rohan@co.com', 1),
(3, 'Neha', 'neha@co.com', 2),
(4, 'Vikram', 'asha@co.com', 2),
(5, 'Priya', 'priya@co.com', 99),
(6, 'Karan', 'karan@co.com', 3),
(7, 'Divya', 'karan@co.com', 3),
(8, 'Aman', 'aman@co.com', 88);$dby12370$,
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
  select id into v_grid_id from public.learning_grids where lower(slug) = $dby12371$dbms-sql-tutorial$dby12371$;
  if v_grid_id is null then raise exception 'validation: dbms-sql-tutorial grid missing'; end if;

  select count(*) into v_topics from public.learning_topics where grid_id = v_grid_id and source_kind = $dby12372$dbms_sql_tutorial$dby12372$;
  if v_topics < 80 then raise exception 'validation: expected at least 80 dbms_sql_tutorial topics (43 from batch 1 + 37 from batch 2), found %', v_topics; end if;

  select count(*) into v_questions from public.test_questions tq
    join public.practice_tests pt on pt.id = tq.test_id
    where pt.learning_topic_id in (select id from public.learning_topics where grid_id = v_grid_id and source_kind = $dby12373$dbms_sql_tutorial$dby12373$);
  if v_questions < 640 then raise exception 'validation: expected at least 640 topic-quiz questions, found %', v_questions; end if;

  select count(*) into v_chtests from public.practice_tests where id in ('pt-dbms-sql-ch3-test','pt-dbms-sql-ch4-test','pt-dbms-sql-ch5-test') and scope = 'chapter';
  if v_chtests <> 3 then raise exception 'validation: expected 3 new chapter tests, found %', v_chtests; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-dbms-sql-%';
  if v_problems < 6 then raise exception 'validation: expected at least 6 SQL coding problems total, found %', v_problems; end if;

  raise notice '0093 OK: % total topics, % total topic-quiz questions, 3 new chapter tests (ch3/ch4/ch5), % total SQL coding problems.', v_topics, v_questions, v_problems;
end $$;

notify pgrst, 'reload schema';
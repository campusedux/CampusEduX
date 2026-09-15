-- admin-panel/supabase/migrations/070_seed_dbms_sql_tutorial_ch18_ch19_ch20.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0098_seed_dbms_sql_tutorial_ch18_ch19_ch20.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — DBMS & SQL Tutorial: Chapters 18, 19, 20 (batch 7)
-- ============================================================================
-- WHAT / WHY
--   Seventh content batch, on top of 0091/063 (schema) + batches 1-6
--   (chapters 1-17). Adds Chapter 18 (Set Operations, 7 topics — SQL syntax
--   for concepts Chapter 7 covered in relational algebra; topic 18.1 'UNION'
--   uses slug union-sql to avoid colliding with Chapter 7's own 'Union'
--   topic), Chapter 19 (Views, 8 topics), Chapter 20 (Indexes and Access
--   Paths, 15 topics — conceptual/architectural, no coding problems; topic
--   20.13 'Cardinality' uses slug index-cardinality to avoid colliding with
--   the three earlier, different uses of 'cardinality' in this course) = 30
--   more topics, 240 more topic-quiz MCQs, 3 more Chapter tests, and 5 more
--   SQL coding problems (3 on Chapter 18's UNION/INTERSECT/EXCEPT, 2 on
--   Chapter 19's CREATE VIEW — all verified end-to-end against Paiza's live
--   sandbox, including confirming MySQL 8.0.44 natively supports INTERSECT/
--   EXCEPT).
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
  if not exists (select 1 from public.learning_grids where lower(slug) = $dbt60001$dbms-sql-tutorial$dbt60001$) then
    raise exception '0098/070: dbms-sql-tutorial grid not found — apply 0092_seed_dbms_sql_tutorial_ch1_ch2_ch8.sql (admin 064) first.';
  end if;
  if to_regprocedure('public.practice_test_pool(text)') is null then
    raise exception '0098/070: DBMS-practice RPCs not found — apply 0091_dbms_sql_practice.sql (admin 063) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 1. SECTIONS — re-affirm all 43 (idempotent no-op for rows 0092 already set;
--    harmless if this migration is ever applied to a fresh project before 0092).
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = $dbt60002$dbms-sql-tutorial$dbt60002$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60003$Chapter 1: Database Foundations$dbt60003$, $dbt60004$chapter-1-database-foundations$dbt60004$, 1, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60005$dbms-sql-tutorial$dbt60005$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60006$Chapter 2: DBMS Architecture$dbt60006$, $dbt60007$chapter-2-dbms-architecture$dbt60007$, 2, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60008$dbms-sql-tutorial$dbt60008$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60009$Chapter 3: Data Models$dbt60009$, $dbt60010$chapter-3-data-models$dbt60010$, 3, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60011$dbms-sql-tutorial$dbt60011$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60012$Chapter 4: Relational Model$dbt60012$, $dbt60013$chapter-4-relational-model$dbt60013$, 4, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60014$dbms-sql-tutorial$dbt60014$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60015$Chapter 5: Keys and Integrity$dbt60015$, $dbt60016$chapter-5-keys-and-integrity$dbt60016$, 5, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60017$dbms-sql-tutorial$dbt60017$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60018$Chapter 6: ER and EER Modeling$dbt60018$, $dbt60019$chapter-6-er-and-eer-modeling$dbt60019$, 6, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60020$dbms-sql-tutorial$dbt60020$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60021$Chapter 7: Relational Algebra$dbt60021$, $dbt60022$chapter-7-relational-algebra$dbt60022$, 7, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60023$dbms-sql-tutorial$dbt60023$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60024$Chapter 8: SQL Fundamentals$dbt60024$, $dbt60025$chapter-8-sql-fundamentals$dbt60025$, 8, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60026$dbms-sql-tutorial$dbt60026$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60027$Chapter 9: DDL and Schema Design$dbt60027$, $dbt60028$chapter-9-ddl-and-schema-design$dbt60028$, 9, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60029$dbms-sql-tutorial$dbt60029$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60030$Chapter 10: SQL Constraints$dbt60030$, $dbt60031$chapter-10-sql-constraints$dbt60031$, 10, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60032$dbms-sql-tutorial$dbt60032$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60033$Chapter 11: DML and Data Modification$dbt60033$, $dbt60034$chapter-11-dml-and-data-modification$dbt60034$, 11, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60035$dbms-sql-tutorial$dbt60035$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60036$Chapter 12: SELECT and Filtering$dbt60036$, $dbt60037$chapter-12-select-and-filtering$dbt60037$, 12, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60038$dbms-sql-tutorial$dbt60038$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60039$Chapter 13: Sorting and Pagination$dbt60039$, $dbt60040$chapter-13-sorting-and-pagination$dbt60040$, 13, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60041$dbms-sql-tutorial$dbt60041$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60042$Chapter 14: SQL Functions$dbt60042$, $dbt60043$chapter-14-sql-functions$dbt60043$, 14, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60044$dbms-sql-tutorial$dbt60044$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60045$Chapter 15: GROUP BY and Aggregation$dbt60045$, $dbt60046$chapter-15-group-by-and-aggregation$dbt60046$, 15, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60047$dbms-sql-tutorial$dbt60047$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60048$Chapter 16: Joins$dbt60048$, $dbt60049$chapter-16-joins$dbt60049$, 16, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60050$dbms-sql-tutorial$dbt60050$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60051$Chapter 17: Subqueries$dbt60051$, $dbt60052$chapter-17-subqueries$dbt60052$, 17, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60053$dbms-sql-tutorial$dbt60053$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60054$Chapter 18: Set Operations$dbt60054$, $dbt60055$chapter-18-set-operations$dbt60055$, 18, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60056$dbms-sql-tutorial$dbt60056$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60057$Chapter 19: Views$dbt60057$, $dbt60058$chapter-19-views$dbt60058$, 19, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60059$dbms-sql-tutorial$dbt60059$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60060$Chapter 20: Indexes and Access Paths$dbt60060$, $dbt60061$chapter-20-indexes-and-access-paths$dbt60061$, 20, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60062$dbms-sql-tutorial$dbt60062$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60063$Chapter 21: Normalization and Functional Dependencies$dbt60063$, $dbt60064$chapter-21-normalization-and-functional-dependencies$dbt60064$, 21, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60065$dbms-sql-tutorial$dbt60065$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60066$Chapter 22: Transactions$dbt60066$, $dbt60067$chapter-22-transactions$dbt60067$, 22, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60068$dbms-sql-tutorial$dbt60068$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60069$Chapter 23: Concurrency Control$dbt60069$, $dbt60070$chapter-23-concurrency-control$dbt60070$, 23, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60071$dbms-sql-tutorial$dbt60071$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60072$Chapter 24: Locking Protocols$dbt60072$, $dbt60073$chapter-24-locking-protocols$dbt60073$, 24, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60074$dbms-sql-tutorial$dbt60074$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60075$Chapter 25: Isolation Levels$dbt60075$, $dbt60076$chapter-25-isolation-levels$dbt60076$, 25, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60077$dbms-sql-tutorial$dbt60077$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60078$Chapter 26: Recovery and Logging$dbt60078$, $dbt60079$chapter-26-recovery-and-logging$dbt60079$, 26, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60080$dbms-sql-tutorial$dbt60080$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60081$Chapter 27: Database Security$dbt60081$, $dbt60082$chapter-27-database-security$dbt60082$, 27, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60083$dbms-sql-tutorial$dbt60083$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60084$Chapter 28: Stored Procedures$dbt60084$, $dbt60085$chapter-28-stored-procedures$dbt60085$, 28, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60086$dbms-sql-tutorial$dbt60086$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60087$Chapter 29: Stored Functions$dbt60087$, $dbt60088$chapter-29-stored-functions$dbt60088$, 29, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60089$dbms-sql-tutorial$dbt60089$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60090$Chapter 30: Triggers$dbt60090$, $dbt60091$chapter-30-triggers$dbt60091$, 30, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60092$dbms-sql-tutorial$dbt60092$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60093$Chapter 31: Cursors$dbt60093$, $dbt60094$chapter-31-cursors$dbt60094$, 31, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60095$dbms-sql-tutorial$dbt60095$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60096$Chapter 32: Advanced SQL: CTE$dbt60096$, $dbt60097$chapter-32-advanced-sql-cte$dbt60097$, 32, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60098$dbms-sql-tutorial$dbt60098$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60099$Chapter 33: Advanced SQL: Window Functions$dbt60099$, $dbt60100$chapter-33-advanced-sql-window-functions$dbt60100$, 33, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60101$dbms-sql-tutorial$dbt60101$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60102$Chapter 34: Advanced SQL Patterns$dbt60102$, $dbt60103$chapter-34-advanced-sql-patterns$dbt60103$, 34, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60104$dbms-sql-tutorial$dbt60104$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60105$Chapter 35: Query Processing and Optimization$dbt60105$, $dbt60106$chapter-35-query-processing-and-optimization$dbt60106$, 35, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60107$dbms-sql-tutorial$dbt60107$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60108$Chapter 36: Physical Storage$dbt60108$, $dbt60109$chapter-36-physical-storage$dbt60109$, 36, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60110$dbms-sql-tutorial$dbt60110$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60111$Chapter 37: Advanced Index Structures$dbt60111$, $dbt60112$chapter-37-advanced-index-structures$dbt60112$, 37, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60113$dbms-sql-tutorial$dbt60113$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60114$Chapter 38: Distributed Databases$dbt60114$, $dbt60115$chapter-38-distributed-databases$dbt60115$, 38, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60116$dbms-sql-tutorial$dbt60116$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60117$Chapter 39: NoSQL Databases$dbt60117$, $dbt60118$chapter-39-nosql-databases$dbt60118$, 39, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60119$dbms-sql-tutorial$dbt60119$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60120$Chapter 40: Database Scaling$dbt60120$, $dbt60121$chapter-40-database-scaling$dbt60121$, 40, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60122$dbms-sql-tutorial$dbt60122$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60123$Chapter 41: Data Warehousing$dbt60123$, $dbt60124$chapter-41-data-warehousing$dbt60124$, 41, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60125$dbms-sql-tutorial$dbt60125$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60126$Chapter 42: Database Design Projects$dbt60126$, $dbt60127$chapter-42-database-design-projects$dbt60127$, 42, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60128$dbms-sql-tutorial$dbt60128$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt60129$Chapter 43: Interview and Placement Preparation$dbt60129$, $dbt60130$chapter-43-interview-and-placement-preparation$dbt60130$, 43, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. TOPICS + NOTES CONTENT + MCQ QUIZ per topic (chapters 3, 4, 5)
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- Chapter 18: Set Operations
-- ---------------------------------------------------------------------------
-- 18.1 UNION
with g as (select id from public.learning_grids where lower(slug) = $dbt60131$dbms-sql-tutorial$dbt60131$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60132$chapter-18-set-operations$dbt60132$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60133$UNION$dbt60133$, $dbt60134$union-sql$dbt60134$, '', 1, 'published', true, true, $dbt60135$dbms_sql_tutorial$dbt60135$, $dbt60136$chapter-18-set-operations/union-sql$dbt60136$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60137$dbms_sql_tutorial$dbt60137$ and source_ref = $dbt60138$chapter-18-set-operations/union-sql$dbt60138$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60139$UNION$dbt60139$, $dbt60140$### Definition

This topic revisits **`UNION`** — already introduced conceptually in relational algebra (7.4) — as a concrete SQL set operation: combining the rows of two queries into one result, keeping every DISTINCT row from either.

Running example — `enrolled_2025(student_id)` and `enrolled_2026(student_id)`, tracking which students were enrolled each year:

**enrolled_2025**: 1, 2, 3, 4
**enrolled_2026**: 2, 3, 5

(Students 2 and 3 stayed enrolled both years; 1 and 4 left after 2025; 5 is a new student in 2026.)

```sql
SELECT student_id FROM enrolled_2025
UNION
SELECT student_id FROM enrolled_2026
ORDER BY student_id;
```

This returns every student enrolled in EITHER year — 1, 2, 3, 4, 5 — with automatic de-duplication (students 2 and 3, present in both tables, appear only once each).

### Edge Cases and Pitfalls

- `ORDER BY` can only appear ONCE, at the very end of the whole `UNION`ed statement — it sorts the FINAL combined result, not either query individually; you cannot `ORDER BY` inside one of the two `SELECT`s that make up the union (with rare dialect-specific exceptions for a subquery wrapped in parentheses).
- Both queries combined by `UNION` must return the same number of columns with compatible types (union-compatibility, 18.5) — this is checked before any row-level de-duplication happens.
- `UNION`'s automatic de-duplication (18.6) has a real computational cost — if you know duplicates can't occur, or don't care about them, `UNION ALL` (18.2) skips that cost entirely.

### Key Takeaways

- UNION combines two queries' rows, keeping the DISTINCT set from either.
- A single ORDER BY at the very end sorts the combined result — it cannot apply to just one side.
- De-duplication has a real cost; UNION ALL (18.2) skips it when duplicates aren't a concern.$dbt60140$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60141$dbms_sql_tutorial_seed$dbt60141$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60142$dbms_sql_tutorial_seed$dbt60142$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60143$dbms-sql-tutorial$dbt60143$),
     t as (select id from public.learning_topics where source_kind = $dbt60144$dbms_sql_tutorial$dbt60144$ and source_ref = $dbt60145$chapter-18-set-operations/union-sql$dbt60145$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60146$pt-dbms-sql-18-union-sql$dbt60146$, $dbt60147$UNION - Quick Test$dbt60147$, 'aptitude', 8, 8,
  $dbt60148$8 questions on UNION.$dbt60148$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60149$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60149$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60150$tq-dbms-sql-18-union-sql-1$dbt60150$, $dbt60151$pt-dbms-sql-18-union-sql$dbt60151$,
   $dbt60152$What does UNION do?$dbt60152$,
   $dbt60153$["Returns rows common to two queries", "Combines the rows of two queries, keeping the distinct set from either", "Returns rows in the first query but not the second", "Joins two tables on a shared column"]$dbt60153$::jsonb,
   1, $dbt60154$UNION merges two result sets, removing duplicates.$dbt60154$, 1, 0),
  ($dbt60155$tq-dbms-sql-18-union-sql-2$dbt60155$, $dbt60156$pt-dbms-sql-18-union-sql$dbt60156$,
   $dbt60157$In the running example, does UNION include student 2 (enrolled in both years) once or twice?$dbt60157$,
   $dbt60158$["Twice", "Once \u2014 UNION removes duplicate rows automatically", "Zero times", "This depends on ORDER BY"]$dbt60158$::jsonb,
   1, $dbt60159$Automatic de-duplication means a student present in both source queries appears only once.$dbt60159$, 1, 1),
  ($dbt60160$tq-dbms-sql-18-union-sql-3$dbt60160$, $dbt60161$pt-dbms-sql-18-union-sql$dbt60161$,
   $dbt60162$Where can ORDER BY be placed in a UNION query?$dbt60162$,
   $dbt60163$["After each individual SELECT that makes up the union", "Only once, at the very end of the whole UNION statement, sorting the combined result", "ORDER BY cannot be used with UNION at all", "Before the first SELECT"]$dbt60163$::jsonb,
   1, $dbt60164$A single trailing ORDER BY sorts the final combined output.$dbt60164$, 1, 2),
  ($dbt60165$tq-dbms-sql-18-union-sql-4$dbt60165$, $dbt60166$pt-dbms-sql-18-union-sql$dbt60166$,
   $dbt60167$What must be true of the two queries combined by UNION?$dbt60167$,
   $dbt60168$["They must query the same table", "They must return the same number of columns with compatible types", "They must both include an ORDER BY", "They must both return at least 10 rows"]$dbt60168$::jsonb,
   1, $dbt60169$Union-compatibility (matching column count/types) is a hard requirement, checked before deduplication.$dbt60169$, 1, 3),
  ($dbt60170$tq-dbms-sql-18-union-sql-5$dbt60170$, $dbt60171$pt-dbms-sql-18-union-sql$dbt60171$,
   $dbt60172$What is the performance implication of UNION's automatic de-duplication?$dbt60172$,
   $dbt60173$["It has no performance cost", "It has a real computational cost \u2014 comparing rows to remove duplicates \u2014 that UNION ALL avoids", "De-duplication is always instantaneous regardless of data size", "It only costs time on the second query, never the first"]$dbt60173$::jsonb,
   1, $dbt60174$De-duplication requires real comparison work, motivating UNION ALL when duplicates aren't a concern.$dbt60174$, 1, 4),
  ($dbt60175$tq-dbms-sql-18-union-sql-6$dbt60175$, $dbt60176$pt-dbms-sql-18-union-sql$dbt60176$,
   $dbt60177$If enrolled_2025 has 4 students and enrolled_2026 has 3, with 2 students in both, how many rows does UNION return?$dbt60177$,
   $dbt60178$["7", "5", "2", "3"]$dbt60178$::jsonb,
   1, $dbt60179$4 + 3 - 2 (removing the double-counted overlap) = 5 distinct students.$dbt60179$, 1, 5),
  ($dbt60180$tq-dbms-sql-18-union-sql-7$dbt60180$, $dbt60181$pt-dbms-sql-18-union-sql$dbt60181$,
   $dbt60182$Is UNION a relational-algebra concept, a SQL-specific feature, or both?$dbt60182$,
   $dbt60183$["A SQL-only feature with no theoretical basis", "Both \u2014 Union is a foundational relational algebra operation (7.4), and SQL's UNION keyword implements it directly", "A relational-algebra-only concept with no SQL equivalent", "Exclusive to NoSQL query languages"]$dbt60183$::jsonb,
   1, $dbt60184$This chapter revisits the SQL syntax for a concept already introduced theoretically in Chapter 7.$dbt60184$, 1, 6),
  ($dbt60185$tq-dbms-sql-18-union-sql-8$dbt60185$, $dbt60186$pt-dbms-sql-18-union-sql$dbt60186$,
   $dbt60187$Can more than two queries be combined with UNION in a single statement?$dbt60187$,
   $dbt60188$["No, exactly two queries maximum", "Yes \u2014 any number of SELECT queries can be chained with UNION between each pair", "Only three queries maximum", "Only if they all query the same table"]$dbt60188$::jsonb,
   1, $dbt60189$UNION can chain any number of union-compatible queries together.$dbt60189$, 1, 7)
on conflict (id) do nothing;

-- 18.2 UNION ALL
with g as (select id from public.learning_grids where lower(slug) = $dbt60190$dbms-sql-tutorial$dbt60190$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60191$chapter-18-set-operations$dbt60191$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60192$UNION ALL$dbt60192$, $dbt60193$union-all$dbt60193$, '', 2, 'published', true, true, $dbt60194$dbms_sql_tutorial$dbt60194$, $dbt60195$chapter-18-set-operations/union-all$dbt60195$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60196$dbms_sql_tutorial$dbt60196$ and source_ref = $dbt60197$chapter-18-set-operations/union-all$dbt60197$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60198$UNION ALL$dbt60198$, $dbt60199$### Definition

`UNION ALL` combines the rows of two queries WITHOUT removing duplicates — every row from both sides appears in the result, including exact repeats.

Running example — `enrolled_2025(student_id)` and `enrolled_2026(student_id)`, tracking which students were enrolled each year:

**enrolled_2025**: 1, 2, 3, 4
**enrolled_2026**: 2, 3, 5

(Students 2 and 3 stayed enrolled both years; 1 and 4 left after 2025; 5 is a new student in 2026.)

```sql
SELECT student_id FROM enrolled_2025
UNION ALL
SELECT student_id FROM enrolled_2026
ORDER BY student_id;
```

This returns 1, 2, 2, 3, 3, 4, 5 — students 2 and 3 (enrolled both years) each appear TWICE, once from each source query. This is the direct trade-off against plain `UNION` (18.1): faster (no de-duplication work) but includes repeats.

### Edge Cases and Pitfalls

- `UNION ALL` is the right choice whenever duplicates are IMPOSSIBLE by construction (e.g. combining data you already know comes from non-overlapping sources) or when you specifically WANT to preserve and count repeats — using plain `UNION` in that situation wastes effort de-duplicating something that either can't have duplicates or shouldn't lose them.
- A common mistake is defaulting to `UNION` out of habit even when duplicates genuinely can't occur — this silently costs performance for a de-duplication guarantee nobody needed.
- `UNION ALL` has no equivalent as a basic operation in the classic set-based relational algebra (7.4's Union assumes set/duplicate-free semantics) — it's a SQL-specific, "bag semantics" extension, reflecting that real SQL tables behave like multisets, not pure sets.

### Key Takeaways

- UNION ALL combines rows from two queries with no de-duplication — faster, but keeps repeats.
- Use it whenever duplicates are impossible or don't matter — it avoids UNION's unnecessary de-duplication cost.
- It has no classic relational-algebra equivalent — a SQL-specific extension reflecting SQL's bag (not pure set) semantics.$dbt60199$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60200$dbms_sql_tutorial_seed$dbt60200$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60201$dbms_sql_tutorial_seed$dbt60201$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60202$dbms-sql-tutorial$dbt60202$),
     t as (select id from public.learning_topics where source_kind = $dbt60203$dbms_sql_tutorial$dbt60203$ and source_ref = $dbt60204$chapter-18-set-operations/union-all$dbt60204$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60205$pt-dbms-sql-18-union-all$dbt60205$, $dbt60206$UNION ALL - Quick Test$dbt60206$, 'aptitude', 8, 8,
  $dbt60207$8 questions on UNION ALL.$dbt60207$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60208$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60208$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60209$tq-dbms-sql-18-union-all-1$dbt60209$, $dbt60210$pt-dbms-sql-18-union-all$dbt60210$,
   $dbt60211$What does UNION ALL do differently from plain UNION?$dbt60211$,
   $dbt60212$["It sorts the result automatically", "It keeps every row from both queries, including duplicates, with no de-duplication", "It only returns rows common to both queries", "It requires exactly matching column names"]$dbt60212$::jsonb,
   1, $dbt60213$UNION ALL skips the de-duplication step that plain UNION performs.$dbt60213$, 1, 0),
  ($dbt60214$tq-dbms-sql-18-union-all-2$dbt60214$, $dbt60215$pt-dbms-sql-18-union-all$dbt60215$,
   $dbt60216$In the running example, how many times does student 2 appear under UNION ALL?$dbt60216$,
   $dbt60217$["Once", "Twice \u2014 once from each source query, since UNION ALL doesn't deduplicate", "Zero times", "Three times"]$dbt60217$::jsonb,
   1, $dbt60218$Without deduplication, a student present in both tables is counted from each source.$dbt60218$, 1, 1),
  ($dbt60219$tq-dbms-sql-18-union-all-3$dbt60219$, $dbt60220$pt-dbms-sql-18-union-all$dbt60220$,
   $dbt60221$When is UNION ALL the better choice over plain UNION?$dbt60221$,
   $dbt60222$["Never \u2014 UNION is always preferable", "When duplicates are impossible by construction, or when repeats should be preserved/counted rather than removed", "Only when the two queries have different column counts", "Only for numeric columns"]$dbt60222$::jsonb,
   1, $dbt60223$Avoiding unnecessary de-duplication work is the direct performance benefit when duplicates aren't a concern.$dbt60223$, 1, 2),
  ($dbt60224$tq-dbms-sql-18-union-all-4$dbt60224$, $dbt60225$pt-dbms-sql-18-union-all$dbt60225$,
   $dbt60226$Does classic relational algebra (as covered in Chapter 7) have a direct equivalent to UNION ALL?$dbt60226$,
   $dbt60227$["Yes, it's the primary form of Union in the algebra", "No \u2014 classic relational algebra's Union assumes set (duplicate-free) semantics; UNION ALL is a SQL-specific bag-semantics extension", "UNION ALL and relational Union are identical concepts", "Relational algebra has no Union operation at all"]$dbt60227$::jsonb,
   1, $dbt60228$UNION ALL's duplicate-preserving nature doesn't map onto the classic set-based Union operation.$dbt60228$, 1, 3),
  ($dbt60229$tq-dbms-sql-18-union-all-5$dbt60229$, $dbt60230$pt-dbms-sql-18-union-all$dbt60230$,
   $dbt60231$What common mistake wastes performance unnecessarily?$dbt60231$,
   $dbt60232$["Using UNION ALL when duplicates matter", "Defaulting to plain UNION out of habit even when duplicates genuinely can't occur", "Using ORDER BY with UNION ALL", "Combining more than two queries"]$dbt60232$::jsonb,
   1, $dbt60233$Unneeded de-duplication work is a real, avoidable cost when duplicates are already known to be impossible.$dbt60233$, 1, 4),
  ($dbt60234$tq-dbms-sql-18-union-all-6$dbt60234$, $dbt60235$pt-dbms-sql-18-union-all$dbt60235$,
   $dbt60236$If enrolled_2025 has 4 rows and enrolled_2026 has 3 rows, how many rows does UNION ALL return?$dbt60236$,
   $dbt60237$["5 (deduplicated)", "7 (4 + 3, no deduplication)", "2 (only the overlap)", "This cannot be determined"]$dbt60237$::jsonb,
   1, $dbt60238$UNION ALL simply concatenates both result sets without removing any rows.$dbt60238$, 1, 5),
  ($dbt60239$tq-dbms-sql-18-union-all-7$dbt60239$, $dbt60240$pt-dbms-sql-18-union-all$dbt60240$,
   $dbt60241$Do the column-count and type compatibility requirements (union-compatibility) still apply to UNION ALL?$dbt60241$,
   $dbt60242$["No, only plain UNION has this requirement", "Yes \u2014 the same union-compatibility rules apply to UNION ALL as to UNION", "Only the type requirement applies, not column count", "UNION ALL has no requirements at all"]$dbt60242$::jsonb,
   1, $dbt60243$Union-compatibility is a structural requirement independent of whether deduplication happens.$dbt60243$, 1, 6),
  ($dbt60244$tq-dbms-sql-18-union-all-8$dbt60244$, $dbt60245$pt-dbms-sql-18-union-all$dbt60245$,
   $dbt60246$Why is SQL described as having 'bag semantics' rather than pure set semantics?$dbt60246$,
   $dbt60247$["SQL tables never contain duplicate rows", "SQL tables and query results can contain duplicate rows by default, unlike the pure-set relations of classic relational algebra", "Bag semantics only applies to UNION ALL, nowhere else in SQL", "This is purely a theoretical distinction with no practical SQL consequence"]$dbt60247$::jsonb,
   1, $dbt60248$SQL's tolerance of duplicate rows throughout (not just in UNION ALL) is exactly what 'bag semantics' refers to.$dbt60248$, 1, 7)
on conflict (id) do nothing;

-- 18.3 INTERSECT
with g as (select id from public.learning_grids where lower(slug) = $dbt60249$dbms-sql-tutorial$dbt60249$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60250$chapter-18-set-operations$dbt60250$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60251$INTERSECT$dbt60251$, $dbt60252$intersect$dbt60252$, '', 3, 'published', true, true, $dbt60253$dbms_sql_tutorial$dbt60253$, $dbt60254$chapter-18-set-operations/intersect$dbt60254$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60255$dbms_sql_tutorial$dbt60255$ and source_ref = $dbt60256$chapter-18-set-operations/intersect$dbt60256$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60257$INTERSECT$dbt60257$, $dbt60258$### Definition

This topic revisits **`INTERSECT`** — already introduced conceptually in relational algebra (7.5) — as concrete SQL syntax: returning only the rows present in BOTH of two queries.

Running example — `enrolled_2025(student_id)` and `enrolled_2026(student_id)`, tracking which students were enrolled each year:

**enrolled_2025**: 1, 2, 3, 4
**enrolled_2026**: 2, 3, 5

(Students 2 and 3 stayed enrolled both years; 1 and 4 left after 2025; 5 is a new student in 2026.)

```sql
SELECT student_id FROM enrolled_2025
INTERSECT
SELECT student_id FROM enrolled_2026
ORDER BY student_id;
```

This returns 2 and 3 — the students enrolled in BOTH years. `INTERSECT` is standard SQL; MySQL added native support in version 8.0.31 (2022) — older MySQL installations lack it and need the `WHERE ... IN (subquery)` workaround from Chapter 7 instead.

### Edge Cases and Pitfalls

- Like `UNION`, `INTERSECT` removes duplicates from its result by default (standard set semantics) — a dialect-specific `INTERSECT ALL` (bag semantics, keeping duplicates present in both sides) exists in some engines but is far less commonly used.
- The same union-compatibility rules (18.5) apply: both queries need matching column counts and compatible types.
- `INTERSECT` binds with the same general precedence considerations as `UNION`/`EXCEPT` when multiple set operations are chained in one statement without parentheses — being explicit with parentheses avoids ambiguity about which operations group together.

### Key Takeaways

- INTERSECT returns rows common to both queries — the SQL syntax for relational algebra's Intersection (7.5).
- Native support requires MySQL 8.0.31+; older versions need an IN-subquery workaround.
- INTERSECT deduplicates by default, mirroring UNION's set semantics.$dbt60258$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60259$dbms_sql_tutorial_seed$dbt60259$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60260$dbms_sql_tutorial_seed$dbt60260$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60261$dbms-sql-tutorial$dbt60261$),
     t as (select id from public.learning_topics where source_kind = $dbt60262$dbms_sql_tutorial$dbt60262$ and source_ref = $dbt60263$chapter-18-set-operations/intersect$dbt60263$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60264$pt-dbms-sql-18-intersect$dbt60264$, $dbt60265$INTERSECT - Quick Test$dbt60265$, 'aptitude', 8, 8,
  $dbt60266$8 questions on INTERSECT.$dbt60266$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60267$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60267$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60268$tq-dbms-sql-18-intersect-1$dbt60268$, $dbt60269$pt-dbms-sql-18-intersect$dbt60269$,
   $dbt60270$What does INTERSECT return?$dbt60270$,
   $dbt60271$["Rows in either query", "Rows present in BOTH queries", "Rows in the first query only", "All rows from both queries including duplicates"]$dbt60271$::jsonb,
   1, $dbt60272$INTERSECT returns exactly the overlap between two result sets.$dbt60272$, 1, 0),
  ($dbt60273$tq-dbms-sql-18-intersect-2$dbt60273$, $dbt60274$pt-dbms-sql-18-intersect$dbt60274$,
   $dbt60275$In the running example, what does INTERSECT return?$dbt60275$,
   $dbt60276$["1, 4", "2, 3", "1, 2, 3, 4, 5", "5 only"]$dbt60276$::jsonb,
   1, $dbt60277$Students 2 and 3 are the only ones enrolled in both 2025 and 2026.$dbt60277$, 1, 1),
  ($dbt60278$tq-dbms-sql-18-intersect-3$dbt60278$, $dbt60279$pt-dbms-sql-18-intersect$dbt60279$,
   $dbt60280$Since which MySQL version has native INTERSECT support been available?$dbt60280$,
   $dbt60281$["MySQL has never supported INTERSECT natively", "MySQL 8.0.31 (2022)", "MySQL 5.7", "MySQL 4.0"]$dbt60281$::jsonb,
   1, $dbt60282$Native INTERSECT/EXCEPT support was added to MySQL relatively recently, in 8.0.31.$dbt60282$, 1, 2),
  ($dbt60283$tq-dbms-sql-18-intersect-4$dbt60283$, $dbt60284$pt-dbms-sql-18-intersect$dbt60284$,
   $dbt60285$What workaround does older MySQL (pre-8.0.31) need for INTERSECT-like behavior?$dbt60285$,
   $dbt60286$["There is no workaround; it's simply impossible", "A WHERE ... IN (subquery) pattern, as covered in Chapter 7", "Using UNION instead, which behaves identically", "Using CROSS JOIN"]$dbt60286$::jsonb,
   1, $dbt60287$The IN-subquery pattern simulates INTERSECT's logic where native support is missing.$dbt60287$, 1, 3),
  ($dbt60288$tq-dbms-sql-18-intersect-5$dbt60288$, $dbt60289$pt-dbms-sql-18-intersect$dbt60289$,
   $dbt60290$Does INTERSECT remove duplicate rows from its result by default?$dbt60290$,
   $dbt60291$["No, it preserves all duplicates", "Yes \u2014 like UNION, INTERSECT deduplicates by default, following set semantics", "Only if ORDER BY is used", "INTERSECT cannot produce duplicates in any case"]$dbt60291$::jsonb,
   1, $dbt60292$Default set semantics apply consistently across UNION, INTERSECT, and EXCEPT.$dbt60292$, 1, 4),
  ($dbt60293$tq-dbms-sql-18-intersect-6$dbt60293$, $dbt60294$pt-dbms-sql-18-intersect$dbt60294$,
   $dbt60295$What requirement do the two queries combined with INTERSECT share with UNION?$dbt60295$,
   $dbt60296$["They must be union-compatible: same column count, compatible types", "They must both include a WHERE clause", "They must query the same table", "There is no shared requirement"]$dbt60296$::jsonb,
   0, $dbt60297$Union-compatibility applies uniformly across all the set operations in this chapter.$dbt60297$, 1, 5),
  ($dbt60298$tq-dbms-sql-18-intersect-7$dbt60298$, $dbt60299$pt-dbms-sql-18-intersect$dbt60299$,
   $dbt60300$Why might explicit parentheses matter when chaining INTERSECT with UNION/EXCEPT in one statement?$dbt60300$,
   $dbt60301$["Parentheses have no effect on set operation queries", "Without them, precedence/grouping ambiguity can make it unclear which operations combine first", "INTERSECT cannot be combined with other set operations under any circumstances", "Parentheses are required syntax and their absence always causes an error"]$dbt60301$::jsonb,
   1, $dbt60302$Clarifying grouping with parentheses avoids ambiguity when multiple set operations are chained together.$dbt60302$, 1, 6),
  ($dbt60303$tq-dbms-sql-18-intersect-8$dbt60303$, $dbt60304$pt-dbms-sql-18-intersect$dbt60304$,
   $dbt60305$Which relational algebra chapter first introduced the concept INTERSECT implements?$dbt60305$,
   $dbt60306$["Chapter 5 (Keys and Integrity)", "Chapter 7 (Relational Algebra)", "Chapter 12 (SELECT and Filtering)", "Chapter 16 (Joins)"]$dbt60306$::jsonb,
   1, $dbt60307$Chapter 7.5 introduced Intersection conceptually; this chapter covers its concrete SQL syntax.$dbt60307$, 1, 7)
on conflict (id) do nothing;

-- 18.4 EXCEPT
with g as (select id from public.learning_grids where lower(slug) = $dbt60308$dbms-sql-tutorial$dbt60308$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60309$chapter-18-set-operations$dbt60309$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60310$EXCEPT$dbt60310$, $dbt60311$except$dbt60311$, '', 4, 'published', true, true, $dbt60312$dbms_sql_tutorial$dbt60312$, $dbt60313$chapter-18-set-operations/except$dbt60313$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60314$dbms_sql_tutorial$dbt60314$ and source_ref = $dbt60315$chapter-18-set-operations/except$dbt60315$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60316$EXCEPT$dbt60316$, $dbt60317$### Definition

This topic revisits **`EXCEPT`** — already introduced conceptually in relational algebra as Difference (7.6) — as concrete SQL syntax: returning rows in the FIRST query but NOT the second. Operand order matters.

Running example — `enrolled_2025(student_id)` and `enrolled_2026(student_id)`, tracking which students were enrolled each year:

**enrolled_2025**: 1, 2, 3, 4
**enrolled_2026**: 2, 3, 5

(Students 2 and 3 stayed enrolled both years; 1 and 4 left after 2025; 5 is a new student in 2026.)

```sql
SELECT student_id FROM enrolled_2025
EXCEPT
SELECT student_id FROM enrolled_2026
ORDER BY student_id;
```

This returns 1 and 4 — students enrolled in 2025 who did NOT return in 2026. Reversing the order (`enrolled_2026 EXCEPT enrolled_2025`) would instead return just 5 — the new student who wasn't enrolled the year before — a completely different, equally valid question.

### Edge Cases and Pitfalls

- As covered in 7.6, Oracle historically spells this operation `MINUS` instead of `EXCEPT` — same concept, different keyword, a classic example of dialect fragmentation for an otherwise-standard operation.
- `EXCEPT` also deduplicates by default, and requires the same union-compatibility as `UNION`/`INTERSECT`.
- A very common real use: finding "what's missing" by taking a full reference set `EXCEPT` an actual/completed set — e.g. `all_required_courses EXCEPT completed_courses` finds exactly the courses still needed (this exact pattern was introduced in Chapter 7 and connects directly to relational Division, 7.12, for more complex per-group versions of the same question).

### Key Takeaways

- EXCEPT returns rows in the first query but not the second — the SQL syntax for relational algebra's Difference (7.6).
- Operand order changes the result entirely — A EXCEPT B is not the same as B EXCEPT A.
- Oracle spells the same operation MINUS — same concept, different vendor keyword.$dbt60317$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60318$dbms_sql_tutorial_seed$dbt60318$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60319$dbms_sql_tutorial_seed$dbt60319$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60320$dbms-sql-tutorial$dbt60320$),
     t as (select id from public.learning_topics where source_kind = $dbt60321$dbms_sql_tutorial$dbt60321$ and source_ref = $dbt60322$chapter-18-set-operations/except$dbt60322$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60323$pt-dbms-sql-18-except$dbt60323$, $dbt60324$EXCEPT - Quick Test$dbt60324$, 'aptitude', 8, 8,
  $dbt60325$8 questions on EXCEPT.$dbt60325$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60326$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60326$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60327$tq-dbms-sql-18-except-1$dbt60327$, $dbt60328$pt-dbms-sql-18-except$dbt60328$,
   $dbt60329$What does A EXCEPT B return?$dbt60329$,
   $dbt60330$["Rows in B but not A", "Rows in A but not B", "Rows in both A and B", "Rows in either A or B"]$dbt60330$::jsonb,
   1, $dbt60331$EXCEPT returns rows from the first query that don't appear in the second.$dbt60331$, 1, 0),
  ($dbt60332$tq-dbms-sql-18-except-2$dbt60332$, $dbt60333$pt-dbms-sql-18-except$dbt60333$,
   $dbt60334$In the running example, what does enrolled_2025 EXCEPT enrolled_2026 return?$dbt60334$,
   $dbt60335$["2, 3", "1, 4", "5", "1, 2, 3, 4"]$dbt60335$::jsonb,
   1, $dbt60336$Students 1 and 4 were enrolled in 2025 but did not appear in 2026.$dbt60336$, 1, 1),
  ($dbt60337$tq-dbms-sql-18-except-3$dbt60337$, $dbt60338$pt-dbms-sql-18-except$dbt60338$,
   $dbt60339$What would enrolled_2026 EXCEPT enrolled_2025 return instead?$dbt60339$,
   $dbt60340$["1, 4 \u2014 the same as before", "5 \u2014 the new student not present in 2025", "2, 3", "Nothing; EXCEPT is symmetric"]$dbt60340$::jsonb,
   1, $dbt60341$Reversing operand order answers a completely different question — who's new in 2026.$dbt60341$, 1, 2),
  ($dbt60342$tq-dbms-sql-18-except-4$dbt60342$, $dbt60343$pt-dbms-sql-18-except$dbt60343$,
   $dbt60344$Which vendor uses MINUS instead of EXCEPT for the same operation?$dbt60344$,
   $dbt60345$["PostgreSQL", "Oracle", "MySQL", "SQLite"]$dbt60345$::jsonb,
   1, $dbt60346$Oracle's MINUS keyword is the same relational Difference operation, just a different name.$dbt60346$, 1, 3),
  ($dbt60347$tq-dbms-sql-18-except-5$dbt60347$, $dbt60348$pt-dbms-sql-18-except$dbt60348$,
   $dbt60349$Does EXCEPT deduplicate its result by default?$dbt60349$,
   $dbt60350$["No, it preserves duplicates", "Yes, following the same set semantics as UNION and INTERSECT", "Only for numeric columns", "EXCEPT cannot produce duplicate rows regardless"]$dbt60350$::jsonb,
   1, $dbt60351$Default deduplication is consistent across all three SQL set operations in this chapter.$dbt60351$, 1, 4),
  ($dbt60352$tq-dbms-sql-18-except-6$dbt60352$, $dbt60353$pt-dbms-sql-18-except$dbt60353$,
   $dbt60354$What real-world pattern does `all_required_courses EXCEPT completed_courses` express?$dbt60354$,
   $dbt60355$["Which courses were completed", "Which required courses are still missing", "The total number of courses offered", "Which courses have prerequisites"]$dbt60355$::jsonb,
   1, $dbt60356$This is the classic 'what's missing' pattern EXCEPT is well suited for.$dbt60356$, 1, 5),
  ($dbt60357$tq-dbms-sql-18-except-7$dbt60357$, $dbt60358$pt-dbms-sql-18-except$dbt60358$,
   $dbt60359$Is EXCEPT's order-sensitivity shared with UNION and INTERSECT?$dbt60359$,
   $dbt60360$["Yes, all three set operations are order-sensitive", "No \u2014 UNION and INTERSECT don't care about operand order, but EXCEPT does", "No, none of the three set operations care about order", "Only INTERSECT is order-sensitive"]$dbt60360$::jsonb,
   1, $dbt60361$EXCEPT is uniquely order-sensitive among these three set operations, since 'A minus B' differs from 'B minus A.'$dbt60361$, 1, 6),
  ($dbt60362$tq-dbms-sql-18-except-8$dbt60362$, $dbt60363$pt-dbms-sql-18-except$dbt60363$,
   $dbt60364$How does EXCEPT relate to the relational Division operation (7.12)?$dbt60364$,
   $dbt60365$["They are unrelated", "Both are used for 'what's missing/satisfies relative to a full set' style questions, though Division extends this to a per-group version", "Division is a simpler synonym for EXCEPT", "EXCEPT can only be used inside a Division query"]$dbt60365$::jsonb,
   1, $dbt60366$Difference (EXCEPT) finds simple set gaps; Division generalizes this to a per-group 'has ALL of' question.$dbt60366$, 1, 7)
on conflict (id) do nothing;

-- 18.5 Set Compatibility
with g as (select id from public.learning_grids where lower(slug) = $dbt60367$dbms-sql-tutorial$dbt60367$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60368$chapter-18-set-operations$dbt60368$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60369$Set Compatibility$dbt60369$, $dbt60370$set-compatibility$dbt60370$, '', 5, 'published', true, true, $dbt60371$dbms_sql_tutorial$dbt60371$, $dbt60372$chapter-18-set-operations/set-compatibility$dbt60372$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60373$dbms_sql_tutorial$dbt60373$ and source_ref = $dbt60374$chapter-18-set-operations/set-compatibility$dbt60374$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60375$Set Compatibility$dbt60375$, $dbt60376$### Definition

**Set compatibility** (also called union-compatibility) is the structural requirement that two queries combined by `UNION`/`INTERSECT`/`EXCEPT` must share: the same NUMBER of columns, with each corresponding column pair being a compatible TYPE.

### How It Works

```sql
-- Compatible: both queries return (integer, text)
SELECT id, name FROM students
UNION
SELECT id, title FROM books;   -- works, though "name" and "title" are conceptually different

-- Incompatible: different column counts
SELECT id, name FROM students
UNION
SELECT id, name, email FROM students;   -- ERROR: column count mismatch
```

Column NAMES don't need to match — only count and type-compatibility matter structurally; the FIRST query's column names/aliases determine the final result's output names (already noted for `UNION`, 18.1, and equally true for `INTERSECT`/`EXCEPT`).

### Edge Cases and Pitfalls

- "Compatible types" doesn't always mean "identical types" — many engines allow combining, say, an `INT` and a `DECIMAL` column (implicitly converting one), but combining genuinely incompatible types (like a number and a non-numeric string) either errors or produces confusing implicit-conversion results depending on the dialect.
- Set compatibility is checked BEFORE any row-level comparison (deduplication, intersection matching, etc.) happens — a structural mismatch is caught immediately, regardless of what the actual data looks like.
- Being STRUCTURALLY compatible (right column count/types) doesn't mean the combination is SEMANTICALLY meaningful — `SELECT id, name FROM students UNION SELECT id, name FROM books` runs without error even though mixing student names and book titles under one column is probably nonsensical for the actual use case; the database only checks structure, not intent.

### Key Takeaways

- Set compatibility requires matching column COUNT and compatible TYPES between combined queries — not matching column names.
- The first query's column names/aliases name the final combined result.
- Structural compatibility is checked before any data comparison — but passing that check doesn't guarantee the combination is semantically sensible.$dbt60376$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60377$dbms_sql_tutorial_seed$dbt60377$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60378$dbms_sql_tutorial_seed$dbt60378$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60379$dbms-sql-tutorial$dbt60379$),
     t as (select id from public.learning_topics where source_kind = $dbt60380$dbms_sql_tutorial$dbt60380$ and source_ref = $dbt60381$chapter-18-set-operations/set-compatibility$dbt60381$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60382$pt-dbms-sql-18-set-compatibility$dbt60382$, $dbt60383$Set Compatibility - Quick Test$dbt60383$, 'aptitude', 8, 8,
  $dbt60384$8 questions on Set Compatibility.$dbt60384$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60385$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60385$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60386$tq-dbms-sql-18-set-compatibility-1$dbt60386$, $dbt60387$pt-dbms-sql-18-set-compatibility$dbt60387$,
   $dbt60388$What does set (union) compatibility require of two queries combined with UNION/INTERSECT/EXCEPT?$dbt60388$,
   $dbt60389$["Identical column names", "The same number of columns, with compatible types in corresponding positions", "Both queries must reference the same table", "Both queries must return the same number of rows"]$dbt60389$::jsonb,
   1, $dbt60390$Column count and type compatibility are the structural requirements — not matching names.$dbt60390$, 1, 0),
  ($dbt60391$tq-dbms-sql-18-set-compatibility-2$dbt60391$, $dbt60392$pt-dbms-sql-18-set-compatibility$dbt60392$,
   $dbt60393$Do the column names in the two queries combined by UNION need to match?$dbt60393$,
   $dbt60394$["Yes, they must be identical", "No \u2014 only column count and type compatibility matter; names don't need to match", "Only the first column's name must match", "Names must be different, never the same"]$dbt60394$::jsonb,
   1, $dbt60395$Structural compatibility is about count/type, not naming.$dbt60395$, 1, 1),
  ($dbt60396$tq-dbms-sql-18-set-compatibility-3$dbt60396$, $dbt60397$pt-dbms-sql-18-set-compatibility$dbt60397$,
   $dbt60398$Where do the final output column names in a UNION/INTERSECT/EXCEPT result come from?$dbt60398$,
   $dbt60399$["Always auto-generated as col1, col2, etc.", "The FIRST query's column names/aliases", "The LAST query's column names/aliases", "Alphabetically sorted across both queries"]$dbt60399$::jsonb,
   1, $dbt60400$The first query's naming determines the combined result's output names.$dbt60400$, 1, 2),
  ($dbt60401$tq-dbms-sql-18-set-compatibility-4$dbt60401$, $dbt60402$pt-dbms-sql-18-set-compatibility$dbt60402$,
   $dbt60403$Is passing the set-compatibility check (right column count/types) a guarantee that the combination is semantically meaningful?$dbt60403$,
   $dbt60404$["Yes, structural compatibility guarantees semantic correctness", "No \u2014 the database only checks structure, not whether combining the data actually makes sense for the use case", "Semantic meaning is checked automatically by every SQL engine", "This distinction doesn't apply to set operations"]$dbt60404$::jsonb,
   1, $dbt60405$Structural compatibility and semantic sensibility are separate concerns — SQL only enforces the former.$dbt60405$, 1, 3),
  ($dbt60406$tq-dbms-sql-18-set-compatibility-5$dbt60406$, $dbt60407$pt-dbms-sql-18-set-compatibility$dbt60407$,
   $dbt60408$What happens if two queries combined with UNION have a different number of columns?$dbt60408$,
   $dbt60409$["Extra columns are silently dropped", "This is a hard error \u2014 column counts must match", "Missing columns are automatically filled with NULL", "The queries run separately and results are concatenated"]$dbt60409$::jsonb,
   1, $dbt60410$Mismatched column counts are a straightforward structural error, not silently resolved.$dbt60410$, 1, 4),
  ($dbt60411$tq-dbms-sql-18-set-compatibility-6$dbt60411$, $dbt60412$pt-dbms-sql-18-set-compatibility$dbt60412$,
   $dbt60413$Can an INT column and a DECIMAL column generally be combined via UNION?$dbt60413$,
   $dbt60414$["Never, this always causes an error", "Often yes, via implicit type conversion, though genuinely incompatible types (like numbers and non-numeric text) may error or convert unpredictably", "Only if both columns contain exactly the same values", "Only in NoSQL databases"]$dbt60414$::jsonb,
   1, $dbt60415$Reasonably compatible numeric types are often implicitly converted, unlike fundamentally mismatched types.$dbt60415$, 1, 5),
  ($dbt60416$tq-dbms-sql-18-set-compatibility-7$dbt60416$, $dbt60417$pt-dbms-sql-18-set-compatibility$dbt60417$,
   $dbt60418$When is set compatibility checked relative to row-level operations like deduplication?$dbt60418$,
   $dbt60419$["After deduplication has already happened", "Before any row-level comparison \u2014 a structural mismatch is caught immediately regardless of the data", "Simultaneously, with no defined order", "Only if ORDER BY is present"]$dbt60419$::jsonb,
   1, $dbt60420$Structural validation happens first, independent of the actual row data.$dbt60420$, 1, 6),
  ($dbt60421$tq-dbms-sql-18-set-compatibility-8$dbt60421$, $dbt60422$pt-dbms-sql-18-set-compatibility$dbt60422$,
   $dbt60423$Does set compatibility apply equally to UNION, INTERSECT, and EXCEPT?$dbt60423$,
   $dbt60424$["No, only UNION requires it", "Yes \u2014 all three set operations share the same union-compatibility requirement", "Only EXCEPT requires it", "Set compatibility is unrelated to any of these operations"]$dbt60424$::jsonb,
   1, $dbt60425$The structural requirement is uniform across all set operations covered in this chapter.$dbt60425$, 1, 7)
on conflict (id) do nothing;

-- 18.6 Duplicate Handling
with g as (select id from public.learning_grids where lower(slug) = $dbt60426$dbms-sql-tutorial$dbt60426$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60427$chapter-18-set-operations$dbt60427$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60428$Duplicate Handling$dbt60428$, $dbt60429$duplicate-handling$dbt60429$, '', 6, 'published', true, true, $dbt60430$dbms_sql_tutorial$dbt60430$, $dbt60431$chapter-18-set-operations/duplicate-handling$dbt60431$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60432$dbms_sql_tutorial$dbt60432$ and source_ref = $dbt60433$chapter-18-set-operations/duplicate-handling$dbt60433$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60434$Duplicate Handling$dbt60434$, $dbt60435$### Definition

**Duplicate handling** describes exactly HOW each set operation treats repeated rows — the unifying theme tying together `UNION`/`UNION ALL`'s contrast (18.1, 18.2) and `INTERSECT`/`EXCEPT`'s default behavior (18.3, 18.4).

### How It Works

| Operation | Duplicate behavior |
|---|---|
| `UNION` | Removes duplicates (set semantics) |
| `UNION ALL` | Keeps all duplicates (bag semantics) |
| `INTERSECT` | Removes duplicates by default |
| `EXCEPT` | Removes duplicates by default |

Only `UNION` has a widely-used, universally-available "ALL" bag-semantics variant; `INTERSECT ALL`/`EXCEPT ALL` (keeping duplicate-aware counts) exist in some dialects (notably PostgreSQL) but are far less commonly needed or supported than `UNION ALL`.

### Edge Cases and Pitfalls

- The DEFAULT for every one of these operations (`UNION`, `INTERSECT`, `EXCEPT`) is to deduplicate — you have to explicitly opt INTO keeping duplicates (`UNION ALL`), never opt out of a "keeps duplicates by default" behavior.
- Understanding duplicate handling matters for correctness, not just neatness: if you're counting results afterward (`SELECT COUNT(*) FROM (... UNION ...) x`), whether duplicates were removed directly changes the count you get.
- Since deduplication has a real cost (18.1, 18.7), always ask "do I actually need duplicates removed here" before defaulting to the plain (deduplicating) form of an operation.

### Key Takeaways

- UNION/INTERSECT/EXCEPT all deduplicate by default; only UNION ALL is a universally-available way to opt into keeping duplicates.
- Deduplication default vs. opt-in duplicates is uniform: you always explicitly ask to KEEP duplicates, never to remove them beyond the default.
- Duplicate handling directly affects any downstream COUNT or other calculation on the combined result.$dbt60435$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60436$dbms_sql_tutorial_seed$dbt60436$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60437$dbms_sql_tutorial_seed$dbt60437$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60438$dbms-sql-tutorial$dbt60438$),
     t as (select id from public.learning_topics where source_kind = $dbt60439$dbms_sql_tutorial$dbt60439$ and source_ref = $dbt60440$chapter-18-set-operations/duplicate-handling$dbt60440$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60441$pt-dbms-sql-18-duplicate-handling$dbt60441$, $dbt60442$Duplicate Handling - Quick Test$dbt60442$, 'aptitude', 8, 8,
  $dbt60443$8 questions on Duplicate Handling.$dbt60443$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60444$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60444$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60445$tq-dbms-sql-18-duplicate-handling-1$dbt60445$, $dbt60446$pt-dbms-sql-18-duplicate-handling$dbt60446$,
   $dbt60447$What is the default duplicate-handling behavior of UNION, INTERSECT, and EXCEPT?$dbt60447$,
   $dbt60448$["All three keep every duplicate by default", "All three remove duplicates by default (set semantics)", "UNION keeps duplicates, but INTERSECT and EXCEPT remove them", "Duplicate handling is undefined and varies randomly"]$dbt60448$::jsonb,
   1, $dbt60449$Every one of these three operations deduplicates by default.$dbt60449$, 1, 0),
  ($dbt60450$tq-dbms-sql-18-duplicate-handling-2$dbt60450$, $dbt60451$pt-dbms-sql-18-duplicate-handling$dbt60451$,
   $dbt60452$Which set operation has a universally-available 'ALL' variant to keep duplicates?$dbt60452$,
   $dbt60453$["INTERSECT ALL", "EXCEPT ALL", "UNION ALL", "None of them support an ALL variant"]$dbt60453$::jsonb,
   2, $dbt60454$UNION ALL is the widely-supported, commonly-used bag-semantics variant.$dbt60454$, 1, 1),
  ($dbt60455$tq-dbms-sql-18-duplicate-handling-3$dbt60455$, $dbt60456$pt-dbms-sql-18-duplicate-handling$dbt60456$,
   $dbt60457$Are INTERSECT ALL and EXCEPT ALL as widely supported as UNION ALL?$dbt60457$,
   $dbt60458$["Yes, identically supported everywhere", "No \u2014 they exist in some dialects (like PostgreSQL) but are far less commonly available or needed", "No dialect supports INTERSECT ALL or EXCEPT ALL", "They are more widely supported than UNION ALL"]$dbt60458$::jsonb,
   1, $dbt60459$UNION ALL is the dominant, most broadly available bag-semantics variant among the three operations.$dbt60459$, 1, 2),
  ($dbt60460$tq-dbms-sql-18-duplicate-handling-4$dbt60460$, $dbt60461$pt-dbms-sql-18-duplicate-handling$dbt60461$,
   $dbt60462$Do you ever need to explicitly opt OUT of deduplication to get the default deduplicating behavior?$dbt60462$,
   $dbt60463$["Yes, deduplication must always be explicitly requested", "No \u2014 deduplication IS the default; you explicitly opt INTO keeping duplicates instead (e.g. via ALL)", "Deduplication cannot be controlled at all", "This varies unpredictably by query"]$dbt60463$::jsonb,
   1, $dbt60464$The direction of the opt-in/opt-out is consistent: plain forms deduplicate, ALL variants keep duplicates.$dbt60464$, 1, 3),
  ($dbt60465$tq-dbms-sql-18-duplicate-handling-5$dbt60465$, $dbt60466$pt-dbms-sql-18-duplicate-handling$dbt60466$,
   $dbt60467$Why does duplicate handling matter for a downstream COUNT(*) on a combined result?$dbt60467$,
   $dbt60468$["COUNT(*) is unaffected by whether duplicates were removed", "Whether duplicates were removed directly changes how many rows COUNT(*) sees", "COUNT(*) automatically ignores duplicates regardless of the set operation used", "This only matters for INTERSECT, never UNION"]$dbt60468$::jsonb,
   1, $dbt60469$The actual row count of the combined result depends directly on whether deduplication happened.$dbt60469$, 1, 4),
  ($dbt60470$tq-dbms-sql-18-duplicate-handling-6$dbt60470$, $dbt60471$pt-dbms-sql-18-duplicate-handling$dbt60471$,
   $dbt60472$What practical question should precede choosing between a plain set operation and its ALL variant?$dbt60472$,
   $dbt60473$["Whether the tables have the same name", "Whether duplicates actually need to be removed for this specific use case", "Whether ORDER BY will be used", "Whether the query involves more than one table"]$dbt60473$::jsonb,
   1, $dbt60474$This is the core cost/correctness trade-off to consider before defaulting to the deduplicating form.$dbt60474$, 1, 5),
  ($dbt60475$tq-dbms-sql-18-duplicate-handling-7$dbt60475$, $dbt60476$pt-dbms-sql-18-duplicate-handling$dbt60476$,
   $dbt60477$Is deduplication free from a performance standpoint?$dbt60477$,
   $dbt60478$["Yes, it costs nothing", "No \u2014 comparing and removing duplicate rows requires real computational work", "It only costs time for INTERSECT, not UNION or EXCEPT", "Deduplication cost only applies to very large tables"]$dbt60478$::jsonb,
   1, $dbt60479$Deduplication always requires real comparison work, regardless of table size.$dbt60479$, 1, 6),
  ($dbt60480$tq-dbms-sql-18-duplicate-handling-8$dbt60480$, $dbt60481$pt-dbms-sql-18-duplicate-handling$dbt60481$,
   $dbt60482$If you know two data sources genuinely cannot overlap, is deduplication via plain UNION still useful?$dbt60482$,
   $dbt60483$["Yes, it's always beneficial regardless", "No \u2014 if overlap is impossible, UNION ALL produces the identical result faster, since there's nothing to deduplicate", "Deduplication becomes mandatory in this case", "This scenario cannot occur in practice"]$dbt60483$::jsonb,
   1, $dbt60484$When duplicates are provably impossible, UNION ALL gives the same correct result without paying the deduplication cost.$dbt60484$, 1, 7)
on conflict (id) do nothing;

-- 18.7 Set Operation Performance
with g as (select id from public.learning_grids where lower(slug) = $dbt60485$dbms-sql-tutorial$dbt60485$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60486$chapter-18-set-operations$dbt60486$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60487$Set Operation Performance$dbt60487$, $dbt60488$set-operation-performance$dbt60488$, '', 7, 'published', true, true, $dbt60489$dbms_sql_tutorial$dbt60489$, $dbt60490$chapter-18-set-operations/set-operation-performance$dbt60490$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60491$dbms_sql_tutorial$dbt60491$ and source_ref = $dbt60492$chapter-18-set-operations/set-operation-performance$dbt60492$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60493$Set Operation Performance$dbt60493$, $dbt60494$### Definition

**Set operation performance** covers the practical cost considerations of `UNION`/`INTERSECT`/`EXCEPT` — chiefly, the real cost of deduplication (18.6), and how set operations compare to equivalent joins or subqueries for the same task.

### How It Works

Deduplicating requires comparing rows against each other — conceptually similar to a sort-and-scan or hash-based grouping operation over the FULL combined result, an inherently more expensive step than simply concatenating rows (`UNION ALL`). For large result sets, this comparison cost is genuinely significant, not just theoretical.

Practical guidance:
1. Use `UNION ALL` instead of `UNION` whenever duplicates are impossible or don't matter (18.6) — the single most impactful, easy optimization in this area.
2. For `INTERSECT`/`EXCEPT`-style questions, compare against an equivalent `EXISTS`/`NOT EXISTS` or `JOIN` formulation (7.12, 17.12) — modern query optimizers are often very good at rewriting these into efficient plans, but which formulation is fastest can genuinely vary by engine and by the specific data/indexes involved.
3. Indexes on the columns involved in the set operation's comparison can significantly speed up the deduplication/matching step, exactly as they would for an equivalent `JOIN` or `GROUP BY`.

### Edge Cases and Pitfalls

- There's no universal "always faster" answer between a set operation and an equivalent join/subquery formulation — the right choice can depend on data size, existing indexes, and the specific engine's optimizer; when performance genuinely matters, comparing actual execution plans (Chapter 35) for the realistic alternatives is more reliable than assuming based on general rules of thumb.
- A common, low-effort performance win that's easy to overlook: check whether a query actually NEEDS a plain (deduplicating) `UNION` before assuming it does — many real queries reach for `UNION` out of habit when `UNION ALL` would give an identical, faster result.
- Combining several large `UNION`s (not `UNION ALL`) in a single big query can be a genuine hidden cost source in reporting/analytics queries — worth auditing specifically when such a query is slower than expected.

### Key Takeaways

- Deduplication in UNION/INTERSECT/EXCEPT has a real computational cost, roughly comparable to a sort/hash-based grouping pass over the combined data.
- Defaulting to UNION ALL whenever duplicates aren't a concern is the single easiest performance win in this area.
- No universal answer exists for "set operation vs. equivalent join/subquery" — compare actual execution plans when performance genuinely matters (Chapter 35).$dbt60494$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60495$dbms_sql_tutorial_seed$dbt60495$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60496$dbms_sql_tutorial_seed$dbt60496$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60497$dbms-sql-tutorial$dbt60497$),
     t as (select id from public.learning_topics where source_kind = $dbt60498$dbms_sql_tutorial$dbt60498$ and source_ref = $dbt60499$chapter-18-set-operations/set-operation-performance$dbt60499$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60500$pt-dbms-sql-18-set-operation-performance$dbt60500$, $dbt60501$Set Operation Performance - Quick Test$dbt60501$, 'aptitude', 8, 8,
  $dbt60502$8 questions on Set Operation Performance.$dbt60502$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60503$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60503$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60504$tq-dbms-sql-18-set-operation-performance-1$dbt60504$, $dbt60505$pt-dbms-sql-18-set-operation-performance$dbt60505$,
   $dbt60506$What is the main performance cost specific to plain UNION (versus UNION ALL)?$dbt60506$,
   $dbt60507$["Sorting the final result", "The deduplication step, requiring rows to be compared against each other", "Checking union-compatibility", "Parsing the SQL syntax"]$dbt60507$::jsonb,
   1, $dbt60508$Comparing rows to remove duplicates is UNION's distinctive extra cost over UNION ALL.$dbt60508$, 1, 0),
  ($dbt60509$tq-dbms-sql-18-set-operation-performance-2$dbt60509$, $dbt60510$pt-dbms-sql-18-set-operation-performance$dbt60510$,
   $dbt60511$What is the single most impactful, easy optimization mentioned for set operations?$dbt60511$,
   $dbt60512$["Always adding an ORDER BY", "Using UNION ALL instead of UNION whenever duplicates are impossible or don't matter", "Combining as many queries as possible into one UNION", "Avoiding indexes on set-operation columns"]$dbt60512$::jsonb,
   1, $dbt60513$This single substitution avoids unnecessary deduplication cost in the common case where it isn't needed.$dbt60513$, 1, 1),
  ($dbt60514$tq-dbms-sql-18-set-operation-performance-3$dbt60514$, $dbt60515$pt-dbms-sql-18-set-operation-performance$dbt60515$,
   $dbt60516$Is there a universal rule for whether a set operation or an equivalent join/subquery performs better?$dbt60516$,
   $dbt60517$["Yes, joins are always faster", "No \u2014 it depends on data size, indexes, and the specific engine's optimizer; comparing actual execution plans is more reliable than a general rule", "Yes, set operations are always faster", "Set operations and joins always have identical performance"]$dbt60517$::jsonb,
   1, $dbt60518$Performance comparisons here are genuinely context-dependent, not governed by a universal rule.$dbt60518$, 1, 2),
  ($dbt60519$tq-dbms-sql-18-set-operation-performance-4$dbt60519$, $dbt60520$pt-dbms-sql-18-set-operation-performance$dbt60520$,
   $dbt60521$Can indexes help speed up a set operation's deduplication/matching step?$dbt60521$,
   $dbt60522$["No, indexes only help WHERE clauses", "Yes \u2014 indexes on the relevant columns can speed up the comparison work, similar to their effect on JOIN or GROUP BY", "Indexes make set operations slower", "Only INTERSECT can benefit from indexes, not UNION or EXCEPT"]$dbt60522$::jsonb,
   1, $dbt60523$The underlying comparison/matching work benefits from indexing just as similar operations (joins, grouping) do.$dbt60523$, 1, 3),
  ($dbt60524$tq-dbms-sql-18-set-operation-performance-5$dbt60524$, $dbt60525$pt-dbms-sql-18-set-operation-performance$dbt60525$,
   $dbt60526$What common, low-effort audit is worth doing on a slow query using plain UNION?$dbt60526$,
   $dbt60527$["Checking whether UNION could be replaced with UNION ALL if duplicates genuinely can't occur or don't matter", "Removing all WHERE clauses", "Adding more UNION statements", "Switching to a NoSQL database"]$dbt60527$::jsonb,
   0, $dbt60528$This is a frequently overlooked, easy performance check.$dbt60528$, 1, 4),
  ($dbt60529$tq-dbms-sql-18-set-operation-performance-6$dbt60529$, $dbt60530$pt-dbms-sql-18-set-operation-performance$dbt60530$,
   $dbt60531$Where should you look to make a reliable performance comparison between competing query formulations?$dbt60531$,
   $dbt60532$["General online rules of thumb only", "Actual execution plans for the realistic alternatives (Chapter 35)", "The query's character count", "The number of tables referenced"]$dbt60532$::jsonb,
   1, $dbt60533$Concrete execution plan comparison is the reliable way to settle performance questions, as covered further in Chapter 35.$dbt60533$, 1, 5),
  ($dbt60534$tq-dbms-sql-18-set-operation-performance-7$dbt60534$, $dbt60535$pt-dbms-sql-18-set-operation-performance$dbt60535$,
   $dbt60536$Is deduplication's cost purely theoretical, or does it matter in practice for large result sets?$dbt60536$,
   $dbt60537$["Purely theoretical, with no real practical impact", "It's a genuine, significant cost for large result sets, not just a theoretical concern", "It only matters for INTERSECT, not UNION", "It only matters when ORDER BY is also used"]$dbt60537$::jsonb,
   1, $dbt60538$The cost is real and scales with the size of the data being deduplicated.$dbt60538$, 1, 6),
  ($dbt60539$tq-dbms-sql-18-set-operation-performance-8$dbt60539$, $dbt60540$pt-dbms-sql-18-set-operation-performance$dbt60540$,
   $dbt60541$Can combining several large plain UNIONs in one analytics query create a hidden performance problem?$dbt60541$,
   $dbt60542$["No, UNION has no cumulative cost across multiple uses", "Yes \u2014 repeated deduplication passes across several large UNIONed queries can be a genuine, easy-to-overlook cost source", "This only happens with UNION ALL, never plain UNION", "Combining UNIONs always improves performance"]$dbt60542$::jsonb,
   1, $dbt60543$Multiple deduplication passes compound, making this a real, worth-auditing performance concern in complex reporting queries.$dbt60543$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 19: Views
-- ---------------------------------------------------------------------------
-- 19.1 Simple Views
with g as (select id from public.learning_grids where lower(slug) = $dbt60544$dbms-sql-tutorial$dbt60544$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60545$chapter-19-views$dbt60545$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60546$Simple Views$dbt60546$, $dbt60547$simple-views$dbt60547$, '', 1, 'published', true, true, $dbt60548$dbms_sql_tutorial$dbt60548$, $dbt60549$chapter-19-views/simple-views$dbt60549$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60550$dbms_sql_tutorial$dbt60550$ and source_ref = $dbt60551$chapter-19-views/simple-views$dbt60551$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60552$Simple Views$dbt60552$, $dbt60553$### What Is a Simple View?

A **view** is a named, stored query that behaves like a virtual table. A *simple view* is the most basic kind: it draws from a **single base table**, has **no joins, no aggregation, no GROUP BY, and no DISTINCT**. It is essentially a saved `SELECT` statement wearing a table's clothes.

```sql
CREATE VIEW high_earners AS
SELECT id, name, salary
FROM employees
WHERE salary > 80000;
```

Once created, you query the view exactly like a table:

```sql
SELECT * FROM high_earners
ORDER BY salary DESC;
```

The database re-executes the underlying `SELECT` against `employees` every time `high_earners` is queried (unless it has been materialized — see 19.6). No data is duplicated; the view is just a lens on `employees`.

### Why Bother?

- **Readability** — `SELECT * FROM high_earners` is clearer than repeating the `WHERE salary > 80000` predicate in every application query.
- **Reuse** — the filter logic lives in one place. If "high earner" is redefined as `salary > 90000`, you change the view once instead of hunting down every copy of the query.
- **Abstraction** — application code and analysts can depend on a stable name (`high_earners`) even if the underlying table's structure evolves slightly (see 19.7).
- **A stepping stone to security** — a simple view that selects only some columns is the classic way to hide sensitive data (see 19.4).

### Column Subsetting

A simple view can also just narrow columns, with no filter at all:

```sql
CREATE VIEW employee_directory AS
SELECT id, name, department
FROM employees;
```

This exposes `id`, `name`, and `department` while completely hiding `salary` from anyone who only has access to `employee_directory`.

### Edge Cases

- **The view has no storage of its own.** `SELECT * FROM high_earners` and `SELECT id, name, salary FROM employees WHERE salary > 80000` produce identical query plans in most optimizers (the view is "inlined").
- **Simple views are (usually) updatable.** Because there's a one-to-one mapping between a view row and an underlying table row, `INSERT`/`UPDATE`/`DELETE` through `high_earners` is normally allowed — details in 19.5.
- **A row can silently disappear from view results** when it's updated to no longer satisfy the view's `WHERE` clause (e.g., someone's salary is updated below 80000 through the view itself) — this is sometimes called the view "losing" a row it just inserted, unless `WITH CHECK OPTION` is used to forbid it.
- **Naming collisions**: a view cannot share a name with an existing table or view in the same schema.

### Key Takeaways / Interview Q&A

**Q: Does a simple view store data?**
A: No — it stores only the query definition. Data is fetched fresh from `employees` on every access.

**Q: What makes a view "simple" rather than "complex"?**
A: Single base table, no joins, no aggregate functions, no GROUP BY/DISTINCT — a straightforward projection/selection.

**Q: If I `ALTER TABLE employees ADD COLUMN bonus`, does `high_earners` automatically show it?**
A: No — `SELECT id, name, salary` is an explicit column list, so `bonus` won't appear unless the view is redefined with `CREATE OR REPLACE VIEW`. (A view defined with `SELECT *` would pick up new columns automatically in most engines, which is one reason explicit column lists are recommended.)
$dbt60553$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60554$dbms_sql_tutorial_seed$dbt60554$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60555$dbms_sql_tutorial_seed$dbt60555$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60556$dbms-sql-tutorial$dbt60556$),
     t as (select id from public.learning_topics where source_kind = $dbt60557$dbms_sql_tutorial$dbt60557$ and source_ref = $dbt60558$chapter-19-views/simple-views$dbt60558$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60559$pt-dbms-sql-19-simple-views$dbt60559$, $dbt60560$Simple Views - Quick Test$dbt60560$, 'aptitude', 8, 8,
  $dbt60561$8 questions on Simple Views.$dbt60561$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60562$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60562$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60563$tq-dbms-sql-19-simple-views-1$dbt60563$, $dbt60564$pt-dbms-sql-19-simple-views$dbt60564$,
   $dbt60565$What defines a 'simple view' as opposed to a 'complex view'?$dbt60565$,
   $dbt60566$["It uses fewer than 100 rows", "It is based on a single table with no joins, aggregation, GROUP BY, or DISTINCT", "It is read-only", "It has no WHERE clause"]$dbt60566$::jsonb,
   1, $dbt60567$A simple view draws from one base table and performs no joins, aggregation, GROUP BY, or DISTINCT — essentially a filtered/projected view of one table.$dbt60567$, 1, 0),
  ($dbt60568$tq-dbms-sql-19-simple-views-2$dbt60568$, $dbt60569$pt-dbms-sql-19-simple-views$dbt60569$,
   $dbt60570$When you run `SELECT * FROM high_earners`, where does the data actually come from?$dbt60570$,
   $dbt60571$["A cached copy stored inside the view", "The underlying employees table, queried fresh at that moment", "A snapshot taken when the view was created", "The database's system catalog"]$dbt60571$::jsonb,
   1, $dbt60572$A plain (non-materialized) view has no storage of its own; it re-runs its defining query against the base table each time it is queried.$dbt60572$, 1, 1),
  ($dbt60573$tq-dbms-sql-19-simple-views-3$dbt60573$, $dbt60574$pt-dbms-sql-19-simple-views$dbt60574$,
   $dbt60575$Given `CREATE VIEW high_earners AS SELECT id, name, salary FROM employees WHERE salary > 80000;`, what happens if an employee's salary is updated through the view from 85000 down to 70000?$dbt60575$,
   $dbt60576$["The update is rejected outright", "The row disappears from subsequent queries on the view because it no longer matches the WHERE clause", "The view definition is automatically changed", "The underlying table is unaffected"]$dbt60576$::jsonb,
   1, $dbt60577$Since the row no longer satisfies salary > 80000, it will no longer appear when the view is queried again — unless WITH CHECK OPTION is used to prevent such updates.$dbt60577$, 1, 2),
  ($dbt60578$tq-dbms-sql-19-simple-views-4$dbt60578$, $dbt60579$pt-dbms-sql-19-simple-views$dbt60579$,
   $dbt60580$Which of the following is a valid simple view definition?$dbt60580$,
   $dbt60581$["CREATE VIEW v AS SELECT department, AVG(salary) FROM employees GROUP BY department;", "CREATE VIEW v AS SELECT e.name, d.name FROM employees e JOIN departments d ON e.department = d.id;", "CREATE VIEW v AS SELECT id, name, department FROM employees;", "CREATE VIEW v AS SELECT DISTINCT department FROM employees;"]$dbt60581$::jsonb,
   2, $dbt60582$This is a single-table projection with no joins, aggregation, GROUP BY, or DISTINCT — the hallmark of a simple view. The others involve GROUP BY, a JOIN, or DISTINCT, making them complex views.$dbt60582$, 1, 3),
  ($dbt60583$tq-dbms-sql-19-simple-views-5$dbt60583$, $dbt60584$pt-dbms-sql-19-simple-views$dbt60584$,
   $dbt60585$Why might a team create `employee_directory AS SELECT id, name, department FROM employees` instead of letting everyone query employees directly?$dbt60585$,
   $dbt60586$["Views run faster than tables in every case", "To hide the salary column from users who only need directory information", "Views are required by SQL syntax rules", "It reduces the number of rows in the employees table"]$dbt60586$::jsonb,
   1, $dbt60587$Restricting the column list in a view is a common technique to expose only non-sensitive columns to a broader audience — an early example of view-based security (Chapter 19.4).$dbt60587$, 1, 4),
  ($dbt60588$tq-dbms-sql-19-simple-views-6$dbt60588$, $dbt60589$pt-dbms-sql-19-simple-views$dbt60589$,
   $dbt60590$If the employees table gains a new column `bonus` after `high_earners` (defined with an explicit column list, not SELECT *) was created, what happens?$dbt60590$,
   $dbt60591$["high_earners immediately shows the new bonus column", "high_earners still only returns id, name, salary since its column list is fixed", "The view is automatically dropped", "An error occurs the next time the view is queried"]$dbt60591$::jsonb,
   1, $dbt60592$A view with an explicit column list is unaffected by new columns added to the base table; only CREATE OR REPLACE VIEW can add the new column to its output.$dbt60592$, 1, 5),
  ($dbt60593$tq-dbms-sql-19-simple-views-7$dbt60593$, $dbt60594$pt-dbms-sql-19-simple-views$dbt60594$,
   $dbt60595$Can two views in the same schema share the same name?$dbt60595$,
   $dbt60596$["Yes, as long as their definitions differ", "No \u2014 a view name must be unique among tables and views in that schema", "Yes, if one is simple and the other complex", "Only in materialized views"]$dbt60596$::jsonb,
   1, $dbt60597$A view occupies the same namespace as tables in its schema, so its name must be unique among both tables and views.$dbt60597$, 1, 6),
  ($dbt60598$tq-dbms-sql-19-simple-views-8$dbt60598$, $dbt60599$pt-dbms-sql-19-simple-views$dbt60599$,
   $dbt60600$In terms of query execution, what typically happens to `SELECT * FROM high_earners ORDER BY salary DESC` under the hood?$dbt60600$,
   $dbt60601$["The optimizer materializes the view permanently the first time it runs", "The optimizer typically inlines/expands the view definition into the outer query and optimizes as one query", "It always creates a temporary table", "It bypasses the query optimizer entirely"]$dbt60601$::jsonb,
   1, $dbt60602$Most relational optimizers merge (inline) a non-materialized view's defining query into the outer query for planning purposes, rather than executing it as a separate, opaque step.$dbt60602$, 1, 7)
on conflict (id) do nothing;

-- 19.2 Complex Views
with g as (select id from public.learning_grids where lower(slug) = $dbt60603$dbms-sql-tutorial$dbt60603$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60604$chapter-19-views$dbt60604$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60605$Complex Views$dbt60605$, $dbt60606$complex-views$dbt60606$, '', 2, 'published', true, true, $dbt60607$dbms_sql_tutorial$dbt60607$, $dbt60608$chapter-19-views/complex-views$dbt60608$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60609$dbms_sql_tutorial$dbt60609$ and source_ref = $dbt60610$chapter-19-views/complex-views$dbt60610$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60611$Complex Views$dbt60611$, $dbt60612$### From Simple to Complex

Where a **simple view** (19.1) is a filter/projection over one table, a **complex view** draws its result from **multiple tables via joins**, uses **aggregate functions**, **GROUP BY**, **DISTINCT**, `UNION`, or **subqueries**. The syntax is identical — `CREATE VIEW ... AS <query>` — but the query behind it is a full-fledged, multi-table report.

### Example: Department Summary View

```sql
CREATE VIEW department_summary AS
SELECT
    d.id                    AS department_id,
    d.name                  AS department_name,
    COUNT(e.id)             AS headcount,
    AVG(e.salary)           AS avg_salary,
    d.budget
FROM departments d
LEFT JOIN employees e ON e.department = d.id
GROUP BY d.id, d.name, d.budget;
```

Querying it is still simple for the consumer:

```sql
SELECT department_name, headcount, avg_salary
FROM department_summary
WHERE avg_salary > 60000;
```

The complexity — the `JOIN`, the `GROUP BY`, the aggregate functions — is hidden entirely behind the view name. This is the real value proposition of complex views: they let analysts and applications ask simple questions ("which departments have average salary over 60000?") without knowing anything about how `employees` and `departments` relate.

### Subqueries and Set Operations

Complex views can also embed correlated subqueries or `UNION`:

```sql
CREATE VIEW above_avg_earners AS
SELECT e.id, e.name, e.department, e.salary
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.department = e.department
);
```

This view lists employees earning more than their own department's average — a computation that would be awkward to inline in every consuming query, but trivial to reuse once wrapped in a view.

### The Contrast With Simple Views

| | Simple View | Complex View |
|---|---|---|
| Base tables | 1 | 1+ (joins) |
| Aggregation | No | Often (GROUP BY, COUNT, AVG, ...) |
| DISTINCT/UNION | No | Sometimes |
| Row-to-source mapping | 1:1 | Often many:1 or ambiguous |
| Updatable? | Usually yes | Usually no (see 19.5) |

That last row is the practical consequence that matters most: once a view aggregates or joins, the database can no longer trace a single output row back to a single, unambiguous underlying row, which is precisely why complex views are generally **not directly updatable**.

### Edge Cases

- **NULLs from outer joins**: `department_summary` uses a `LEFT JOIN`, so a department with zero employees still appears with `headcount = 0` (via `COUNT(e.id)`, which ignores NULLs) rather than being dropped, as an `INNER JOIN` would do.
- **Performance**: every query against a complex view re-executes the full join/aggregation. Querying `department_summary` for one department still computes the aggregate for all departments internally unless the optimizer can push the `WHERE` predicate down — this is a common reason to consider a materialized view (19.6) for expensive complex views that are queried often but change rarely.
- **Nested complex views** (a complex view built on another view) can compound this cost — see 19.8.

### Key Takeaways / Interview Q&A

**Q: Give a one-line definition of a complex view.**
A: A stored query spanning multiple tables and/or using aggregation, GROUP BY, DISTINCT, or set operations.

**Q: Why is a LEFT JOIN often preferred over INNER JOIN in a summary view like department_summary?**
A: So that rows with no matching child records (e.g., departments with no employees) are still represented, typically with 0/NULL aggregate values, instead of silently vanishing.

**Q: Can a complex view itself be joined with another table in a query?**
A: Yes — a view can be used anywhere a table can, including as one side of a JOIN in an outer query.
$dbt60612$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60613$dbms_sql_tutorial_seed$dbt60613$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60614$dbms_sql_tutorial_seed$dbt60614$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60615$dbms-sql-tutorial$dbt60615$),
     t as (select id from public.learning_topics where source_kind = $dbt60616$dbms_sql_tutorial$dbt60616$ and source_ref = $dbt60617$chapter-19-views/complex-views$dbt60617$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60618$pt-dbms-sql-19-complex-views$dbt60618$, $dbt60619$Complex Views - Quick Test$dbt60619$, 'aptitude', 8, 8,
  $dbt60620$8 questions on Complex Views.$dbt60620$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60621$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60621$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60622$tq-dbms-sql-19-complex-views-1$dbt60622$, $dbt60623$pt-dbms-sql-19-complex-views$dbt60623$,
   $dbt60624$Which characteristic distinguishes a complex view from a simple view?$dbt60624$,
   $dbt60625$["It must be materialized", "It involves joins, aggregation, GROUP BY, DISTINCT, or set operations", "It cannot be queried with WHERE", "It is stored as a physical table"]$dbt60625$::jsonb,
   1, $dbt60626$Complex views combine multiple tables and/or use aggregate functions, GROUP BY, DISTINCT, or UNION — unlike the single-table, non-aggregating simple view.$dbt60626$, 1, 0),
  ($dbt60627$tq-dbms-sql-19-complex-views-2$dbt60627$, $dbt60628$pt-dbms-sql-19-complex-views$dbt60628$,
   $dbt60629$In `department_summary` (LEFT JOIN departments to employees, GROUP BY department, COUNT(e.id) AS headcount), what happens to a department with zero employees?$dbt60629$,
   $dbt60630$["It is excluded from the view's results", "It appears with headcount = 0 because COUNT ignores the NULLs produced by the LEFT JOIN", "It causes an error", "It appears with headcount = NULL"]$dbt60630$::jsonb,
   1, $dbt60631$LEFT JOIN preserves departments with no matching employees (producing NULL employee columns), and COUNT(e.id) counts only non-NULL values, yielding 0 rather than excluding the department.$dbt60631$, 1, 1),
  ($dbt60632$tq-dbms-sql-19-complex-views-3$dbt60632$, $dbt60633$pt-dbms-sql-19-complex-views$dbt60633$,
   $dbt60634$Why can't the database unambiguously map an aggregated view row back to a single underlying table row?$dbt60634$,
   $dbt60635$["Because aggregation functions are deprecated in modern SQL", "Because one aggregated output row (e.g., a department's average salary) summarizes many underlying employee rows, with no unique 1:1 correspondence", "Because views cannot contain GROUP BY at all", "Because aggregate columns are always NULL"]$dbt60635$::jsonb,
   1, $dbt60636$An aggregate row represents a summary of potentially many base rows, so there is no single row to target for an update — this is the core reason complex/aggregate views are not directly updatable.$dbt60636$, 1, 2),
  ($dbt60637$tq-dbms-sql-19-complex-views-4$dbt60637$, $dbt60638$pt-dbms-sql-19-complex-views$dbt60638$,
   $dbt60639$Which of these views would be classified as complex?$dbt60639$,
   $dbt60640$["CREATE VIEW v AS SELECT id, name FROM employees WHERE department = 'Sales';", "CREATE VIEW v AS SELECT id, name, salary FROM employees;", "CREATE VIEW v AS SELECT department, COUNT(*) FROM employees GROUP BY department;", "CREATE VIEW v AS SELECT * FROM employees WHERE salary > 50000;"]$dbt60640$::jsonb,
   2, $dbt60641$This view uses GROUP BY and an aggregate function (COUNT), making it a complex view; the others are single-table filters/projections with no aggregation.$dbt60641$, 1, 3),
  ($dbt60642$tq-dbms-sql-19-complex-views-5$dbt60642$, $dbt60643$pt-dbms-sql-19-complex-views$dbt60643$,
   $dbt60644$What is the main practical benefit of wrapping a multi-join, aggregated query in a complex view?$dbt60644$,
   $dbt60645$["It permanently speeds up the underlying tables", "It hides the join/aggregation complexity so consumers can query a simple, stable interface", "It removes the need for indexes", "It converts the query into a stored procedure"]$dbt60645$::jsonb,
   1, $dbt60646$The main value is abstraction: consumers write simple SELECTs against the view without needing to know how the underlying tables relate or how the aggregation is computed.$dbt60646$, 1, 4),
  ($dbt60647$tq-dbms-sql-19-complex-views-6$dbt60647$, $dbt60648$pt-dbms-sql-19-complex-views$dbt60648$,
   $dbt60649$A correlated subquery view (`above_avg_earners`) compares each employee's salary to the AVG salary of their own department. What SQL feature makes this 'correlated'?$dbt60649$,
   $dbt60650$["The subquery references a column (e2.department = e.department) from the outer query", "The subquery uses UNION", "The subquery has no WHERE clause", "The subquery selects from a different database"]$dbt60650$::jsonb,
   0, $dbt60651$A correlated subquery references a column from the enclosing query (here, e.department from the outer employees alias e), so it is re-evaluated per outer row.$dbt60651$, 1, 5),
  ($dbt60652$tq-dbms-sql-19-complex-views-7$dbt60652$, $dbt60653$pt-dbms-sql-19-complex-views$dbt60653$,
   $dbt60654$Why might querying a single department's data through department_summary be less efficient than querying employees directly for that department?$dbt60654$,
   $dbt60655$["Views always create a full physical copy of the data first", "Depending on the optimizer, the aggregation for all departments may be computed before the WHERE filter narrows results, unless the predicate can be pushed down", "Views cannot accept WHERE clauses", "GROUP BY is not allowed in views"]$dbt60655$::jsonb,
   1, $dbt60656$Unless the optimizer can push the outer WHERE predicate into the view's grouping, the full aggregation across all groups may be computed before filtering — a common motivation to consider a materialized view.$dbt60656$, 1, 6),
  ($dbt60657$tq-dbms-sql-19-complex-views-8$dbt60657$, $dbt60658$pt-dbms-sql-19-complex-views$dbt60658$,
   $dbt60659$Can a complex view be used as one table in a JOIN within another query?$dbt60659$,
   $dbt60660$["No, views can only be queried standalone", "Yes, a view can be referenced anywhere a base table can, including as a JOIN operand", "Only simple views can be joined", "Only if the view is materialized"]$dbt60660$::jsonb,
   1, $dbt60661$Views are queried like tables in every respect, including being joined to other tables or views in a larger query.$dbt60661$, 1, 7)
on conflict (id) do nothing;

-- 19.3 CREATE VIEW
with g as (select id from public.learning_grids where lower(slug) = $dbt60662$dbms-sql-tutorial$dbt60662$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60663$chapter-19-views$dbt60663$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60664$CREATE VIEW$dbt60664$, $dbt60665$create-view$dbt60665$, '', 3, 'published', true, true, $dbt60666$dbms_sql_tutorial$dbt60666$, $dbt60667$chapter-19-views/create-view$dbt60667$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60668$dbms_sql_tutorial$dbt60668$ and source_ref = $dbt60669$chapter-19-views/create-view$dbt60669$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60670$CREATE VIEW$dbt60670$, $dbt60671$### The Syntax In Depth

The basic form:

```sql
CREATE VIEW view_name [(column_alias1, column_alias2, ...)] AS
<select_statement>
[WITH [CASCADED | LOCAL] CHECK OPTION];
```

Example with explicit column aliases:

```sql
CREATE VIEW dept_headcount (dept_name, num_employees) AS
SELECT d.name, COUNT(e.id)
FROM departments d
LEFT JOIN employees e ON e.department = d.id
GROUP BY d.name;
```

The optional column-alias list lets you rename output columns at the view level, independent of the underlying `SELECT`'s own aliases — useful when the query's expressions don't naturally produce clean names (e.g., `COUNT(e.id)` becomes `num_employees`).

### CREATE OR REPLACE VIEW

Dropping and recreating a view is often undesirable because it can wipe out permissions (`GRANT`s) that were attached to it. Most engines (PostgreSQL, MySQL, Oracle) support an in-place redefinition:

```sql
CREATE OR REPLACE VIEW high_earners AS
SELECT id, name, salary, department
FROM employees
WHERE salary > 85000;
```

This updates the view's stored query definition without dropping the view object itself — existing grants, and (in most engines) the view's identity for dependent views, remain intact. There are limits: some engines disallow changing the *number or order* of output columns with `CREATE OR REPLACE` (you'd need to `DROP` and recreate, or add new columns only at the end).

### DROP VIEW

```sql
DROP VIEW high_earners;
DROP VIEW IF EXISTS high_earners;          -- safe if it may not exist
DROP VIEW high_earners CASCADE;            -- also drops dependent views (PostgreSQL)
```

Dropping a view removes only the stored query definition — the underlying base tables and their data are completely untouched, since the view never held any data to begin with.

### The View Stores a Definition, Not Data

This is the single most important fact about views: `CREATE VIEW` does not run the `SELECT` and save its output. It parses and stores the *query text/plan*, catalogs it in the system tables (e.g., `information_schema.views` in most SQL engines), and re-executes that query **every single time** the view is referenced — always reflecting the current state of the base tables. Compare:

```sql
-- Ordinary view: always current, always re-computed
CREATE VIEW high_earners AS SELECT id, name, salary FROM employees WHERE salary > 80000;

-- Materialized view: computed once, stored physically, goes stale until refreshed
CREATE MATERIALIZED VIEW high_earners_mv AS SELECT id, name, salary FROM employees WHERE salary > 80000;
```

See 19.6 for the full materialized-view trade-off.

### Edge Cases

- **Forward references**: a view's `SELECT` can reference another view, but not a table/view that doesn't exist yet — dependency order matters at creation time.
- **`CREATE OR REPLACE VIEW` and column count**: in PostgreSQL, you cannot remove or reorder existing output columns this way — only append new ones at the end or change their defining expressions; violating this raises an error, forcing a `DROP`/`CREATE`.
- **Dropping a view others depend on**: `DROP VIEW` fails by default (in engines with `RESTRICT` semantics) if other views select from it, unless `CASCADE` is used.
- **Naming/schema**: a view lives in a schema just like a table and is subject to the same uniqueness rule.

### Key Takeaways / Interview Q&A

**Q: What's the difference between DROP VIEW and CREATE OR REPLACE VIEW when you need to change a view's definition?**
A: `DROP` + `CREATE` destroys the view object (and often its grants) before recreating it; `CREATE OR REPLACE VIEW` updates the definition of the existing object in place, generally preserving permissions.

**Q: Does DROP VIEW delete any data?**
A: No — it only removes the stored query definition; the base tables are unaffected.

**Q: If I `CREATE OR REPLACE VIEW v AS SELECT id, name FROM employees;` and v was previously `SELECT id, name, salary FROM employees;`, does that work?**
A: In most engines, no — removing an existing output column via replace is rejected; you'd need to DROP and recreate the view instead.
$dbt60671$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60672$dbms_sql_tutorial_seed$dbt60672$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60673$dbms_sql_tutorial_seed$dbt60673$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60674$dbms-sql-tutorial$dbt60674$),
     t as (select id from public.learning_topics where source_kind = $dbt60675$dbms_sql_tutorial$dbt60675$ and source_ref = $dbt60676$chapter-19-views/create-view$dbt60676$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60677$pt-dbms-sql-19-create-view$dbt60677$, $dbt60678$CREATE VIEW - Quick Test$dbt60678$, 'aptitude', 8, 8,
  $dbt60679$8 questions on CREATE VIEW.$dbt60679$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60680$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60680$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60681$tq-dbms-sql-19-create-view-1$dbt60681$, $dbt60682$pt-dbms-sql-19-create-view$dbt60682$,
   $dbt60683$What does CREATE VIEW actually store?$dbt60683$,
   $dbt60684$["A physical copy of the query's result rows", "The text/plan of the defining SELECT statement, re-executed on each access", "An index over the base table", "A compressed snapshot refreshed nightly"]$dbt60684$::jsonb,
   1, $dbt60685$CREATE VIEW catalogs the query definition; it does not execute and persist the result. Each access re-runs the query (unless the view is materialized).$dbt60685$, 1, 0),
  ($dbt60686$tq-dbms-sql-19-create-view-2$dbt60686$, $dbt60687$pt-dbms-sql-19-create-view$dbt60687$,
   $dbt60688$What is a key practical advantage of CREATE OR REPLACE VIEW over DROP VIEW followed by CREATE VIEW?$dbt60688$,
   $dbt60689$["It runs faster on large tables", "It generally preserves existing GRANT permissions attached to the view object", "It allows removing columns freely", "It converts the view into a materialized view"]$dbt60689$::jsonb,
   1, $dbt60690$Dropping a view can also drop its associated grants; CREATE OR REPLACE VIEW updates the definition in place, typically preserving permissions granted on the view.$dbt60690$, 1, 1),
  ($dbt60691$tq-dbms-sql-19-create-view-3$dbt60691$, $dbt60692$pt-dbms-sql-19-create-view$dbt60692$,
   $dbt60693$In PostgreSQL, which change is typically REJECTED when using CREATE OR REPLACE VIEW?$dbt60693$,
   $dbt60694$["Changing the WHERE clause's filter value", "Adding a new column at the end of the SELECT list", "Removing or reordering existing output columns", "Renaming the view's internal query comment"]$dbt60694$::jsonb,
   2, $dbt60695$PostgreSQL (and similar engines) disallow removing or reordering existing output columns via CREATE OR REPLACE VIEW; only appending new columns at the end is allowed. Removing a column requires DROP and recreate.$dbt60695$, 1, 2),
  ($dbt60696$tq-dbms-sql-19-create-view-4$dbt60696$, $dbt60697$pt-dbms-sql-19-create-view$dbt60697$,
   $dbt60698$What does DROP VIEW high_earners; do to the employees table?$dbt60698$,
   $dbt60699$["Deletes all rows matching the view's WHERE clause", "Deletes the employees table entirely", "Nothing \u2014 the base table and its data are untouched", "Locks the employees table for writes"]$dbt60699$::jsonb,
   2, $dbt60700$A view never holds data, so dropping it only removes the stored query definition; the underlying employees table is completely unaffected.$dbt60700$, 1, 3),
  ($dbt60701$tq-dbms-sql-19-create-view-5$dbt60701$, $dbt60702$pt-dbms-sql-19-create-view$dbt60702$,
   $dbt60703$What is the purpose of the optional column-alias list in `CREATE VIEW dept_headcount (dept_name, num_employees) AS ...`?$dbt60703$,
   $dbt60704$["It restricts which rows are visible", "It renames the view's output columns independently of the underlying SELECT's own expressions/aliases", "It creates an index on those columns", "It is required syntax with no functional effect"]$dbt60704$::jsonb,
   1, $dbt60705$The column-alias list lets you give clean, explicit names to the view's output columns, which is especially useful when the underlying SELECT includes expressions like COUNT(e.id) that don't have natural names.$dbt60705$, 1, 4),
  ($dbt60706$tq-dbms-sql-19-create-view-6$dbt60706$, $dbt60707$pt-dbms-sql-19-create-view$dbt60707$,
   $dbt60708$What happens when you run `DROP VIEW dept_summary;` if another view selects from dept_summary, and the engine defaults to RESTRICT semantics?$dbt60708$,
   $dbt60709$["Both views are dropped automatically", "The drop fails unless CASCADE is specified", "Only dept_summary's data is dropped, not its dependents", "The dependent view is automatically rewritten to bypass dept_summary"]$dbt60709$::jsonb,
   1, $dbt60710$Under RESTRICT (the typical default), dropping an object that other objects depend on fails; CASCADE must be used to also drop the dependents.$dbt60710$, 1, 5),
  ($dbt60711$tq-dbms-sql-19-create-view-7$dbt60711$, $dbt60712$pt-dbms-sql-19-create-view$dbt60712$,
   $dbt60713$Can a view's defining query reference another view?$dbt60713$,
   $dbt60714$["No, only base tables can be referenced", "Yes, as long as the referenced view already exists at creation time", "Yes, but only materialized views can be referenced", "Only in Oracle"]$dbt60714$::jsonb,
   1, $dbt60715$A view's SELECT can reference other views (nested views), but the referenced view must already exist, since view creation validates the query against the current catalog.$dbt60715$, 1, 6),
  ($dbt60716$tq-dbms-sql-19-create-view-8$dbt60716$, $dbt60717$pt-dbms-sql-19-create-view$dbt60717$,
   $dbt60718$Which statement correctly contrasts an ordinary view with a materialized view in terms of CREATE VIEW semantics?$dbt60718$,
   $dbt60719$["Both store the result physically and require REFRESH", "An ordinary view re-runs its query on every access; a materialized view computes and stores results, requiring REFRESH to update", "An ordinary view is faster in every case", "A materialized view cannot be created with CREATE VIEW syntax variants at all"]$dbt60719$::jsonb,
   1, $dbt60720$The defining trade-off is: plain views always reflect live data by re-running the query, while materialized views trade that freshness for stored, faster-to-read results that must be explicitly refreshed (see 19.6).$dbt60720$, 1, 7)
on conflict (id) do nothing;

-- 19.4 View Security
with g as (select id from public.learning_grids where lower(slug) = $dbt60721$dbms-sql-tutorial$dbt60721$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60722$chapter-19-views$dbt60722$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60723$View Security$dbt60723$, $dbt60724$view-security$dbt60724$, '', 4, 'published', true, true, $dbt60725$dbms_sql_tutorial$dbt60725$, $dbt60726$chapter-19-views/view-security$dbt60726$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60727$dbms_sql_tutorial$dbt60727$ and source_ref = $dbt60728$chapter-19-views/view-security$dbt60728$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60729$View Security$dbt60729$, $dbt60730$### Views as an Access-Control Layer

Beyond convenience, views are one of the oldest and most reliable tools for enforcing **column-level and row-level security** in SQL databases. Rather than granting a user direct access to a sensitive table, you grant them access only to a view that exposes a restricted slice of it.

### Hiding Columns

Suppose `employees(id, name, department, salary)` should be visible to general staff, but `salary` should be restricted to HR and the DBA.

```sql
CREATE VIEW employee_public AS
SELECT id, name, department
FROM employees;

GRANT SELECT ON employee_public TO staff_role;
-- staff_role is NEVER granted SELECT on employees directly
GRANT SELECT ON employees TO hr_role, dba_role;
```

A member of `staff_role` who tries `SELECT salary FROM employees` gets a permission-denied error, because they were never granted access to the base table at all — only to `employee_public`, which simply doesn't expose that column.

### Hiding Rows

Views can restrict rows as well as columns, layering a `WHERE` clause as a security filter:

```sql
CREATE VIEW own_department_employees AS
SELECT id, name, department, salary
FROM employees
WHERE department = CURRENT_ROLE_DEPARTMENT();  -- illustrative; real impl varies by engine
```

A department manager granted access only to this view sees just their own department's rows, even though the view's column list is otherwise unrestricted.

### Combining Both

```sql
CREATE VIEW manager_view AS
SELECT id, name, department
FROM employees
WHERE department = 'Engineering';

GRANT SELECT ON manager_view TO engineering_manager;
```

This combines a column restriction (no `salary`) with a row restriction (only `Engineering`), all through one `GRANT` on one view — the manager never needs, and never receives, any privilege on `employees` itself.

### Relationship to GRANT (Chapter 10) and Database Security (Chapter 27)

View-based security works *in combination with* `GRANT`/`REVOKE`: the view defines *what slice of data exists*, while `GRANT` defines *who may see that slice*. This two-layer model — restrict the shape of the data via a view, then restrict access to that view via privileges — is the standard pattern used before more advanced mechanisms like row-level security (RLS) policies, which some modern engines (PostgreSQL, Oracle VPD) provide as a first-class alternative. Chapter 27 covers the broader database-security picture (encryption, auditing, roles) that view-based restriction fits into.

### Edge Cases

- **The base-table grant must NOT be given** to the restricted role — if a user has direct `SELECT` on `employees` in addition to the view, the view provides no protection at all; the two grants must be managed carefully (usually via `REVOKE` on the base table).
- **View owner's privileges matter**: in most engines, a view executes with the *privileges of its owner/definer* (not the querying user), which is exactly what allows a low-privilege user to query a view over a table they can't access directly. This is sometimes called "definer's rights."
- **Column-level GRANT** (`GRANT SELECT (id, name) ON employees TO staff_role;`) is a lighter-weight alternative some engines support directly, without needing a view — but views remain more portable and support row filtering too, which column-level grants alone cannot do.
- **Views don't stop indirect leakage**: if a view exposes `salary` indirectly through, say, a computed `salary_band` column, a determined user could infer bounds — security-by-view still requires careful design.

### Key Takeaways / Interview Q&A

**Q: How do you hide a sensitive column from a group of users using views?**
A: Create a view that excludes the sensitive column, grant SELECT on the view (not the table) to that group, and never grant them direct table access.

**Q: Why does a view-based restriction still work even though the querying user has no privilege on the base table?**
A: Because the view typically runs with the privileges of its owner ("definer's rights"), not the querying user — the user only needs privilege on the view itself.

**Q: What's the difference between view-based security and row-level security (RLS) policies?**
A: Views require creating and granting a separate object per access pattern; RLS policies attach filtering rules directly to the base table so the *same* table automatically filters rows per user/role without needing multiple views.
$dbt60730$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60731$dbms_sql_tutorial_seed$dbt60731$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60732$dbms_sql_tutorial_seed$dbt60732$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60733$dbms-sql-tutorial$dbt60733$),
     t as (select id from public.learning_topics where source_kind = $dbt60734$dbms_sql_tutorial$dbt60734$ and source_ref = $dbt60735$chapter-19-views/view-security$dbt60735$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60736$pt-dbms-sql-19-view-security$dbt60736$, $dbt60737$View Security - Quick Test$dbt60737$, 'aptitude', 8, 8,
  $dbt60738$8 questions on View Security.$dbt60738$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60739$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60739$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60740$tq-dbms-sql-19-view-security-1$dbt60740$, $dbt60741$pt-dbms-sql-19-view-security$dbt60741$,
   $dbt60742$How can a view be used to hide the salary column from general staff while allowing HR full access?$dbt60742$,
   $dbt60743$["Encrypt the salary column so only HR has the decryption key", "Create a view that omits salary, grant staff SELECT only on that view, and grant HR direct SELECT on the base table", "Rename the salary column so staff can't find it", "Set salary to NULL for all staff logins"]$dbt60743$::jsonb,
   1, $dbt60744$The standard pattern is a restricted view (excluding salary) granted to staff, with the base table's full access reserved for HR/DBA roles.$dbt60744$, 1, 0),
  ($dbt60745$tq-dbms-sql-19-view-security-2$dbt60745$, $dbt60746$pt-dbms-sql-19-view-security$dbt60746$,
   $dbt60747$Why is it critical that staff_role NOT also be granted SELECT directly on the employees table?$dbt60747$,
   $dbt60748$["Because views cannot coexist with table grants", "Because a direct grant on employees would let staff bypass the view and see the hidden salary column", "Because it would slow down queries", "Because it violates SQL standard syntax"]$dbt60748$::jsonb,
   1, $dbt60749$If a role has direct access to the base table in addition to the restrictive view, they can simply query the table directly and see everything the view was meant to hide — the view provides no protection.$dbt60749$, 1, 1),
  ($dbt60750$tq-dbms-sql-19-view-security-3$dbt60750$, $dbt60751$pt-dbms-sql-19-view-security$dbt60751$,
   $dbt60752$What allows a user with no privileges on employees to successfully query a view built on top of it?$dbt60752$,
   $dbt60753$["SQL always grants implicit access to tables referenced in any view", "The view typically executes with the privileges of its owner/definer, not the querying user", "Views ignore all privilege checks", "The user must always be a superuser"]$dbt60753$::jsonb,
   1, $dbt60754$Views commonly run under 'definer's rights' — the owner's privileges are used to resolve the underlying table access, which is precisely what lets a lower-privileged user query the view.$dbt60754$, 1, 2),
  ($dbt60755$tq-dbms-sql-19-view-security-4$dbt60755$, $dbt60756$pt-dbms-sql-19-view-security$dbt60756$,
   $dbt60757$What kind of restriction does `WHERE department = 'Engineering'` add to a security view?$dbt60757$,
   $dbt60758$["Column-level security", "Row-level security, limiting which rows are visible", "Index-level security", "It has no security effect"]$dbt60758$::jsonb,
   1, $dbt60759$Filtering rows in the view's WHERE clause restricts which rows a grantee can see — a form of row-level security implemented via a view.$dbt60759$, 1, 3),
  ($dbt60760$tq-dbms-sql-19-view-security-5$dbt60760$, $dbt60761$pt-dbms-sql-19-view-security$dbt60761$,
   $dbt60762$Which combination correctly describes the two-layer model of view-based security?$dbt60762$,
   $dbt60763$["Views define who can log in; GRANT defines what tables exist", "Views define what slice of data exists; GRANT/REVOKE defines who may access that slice", "GRANT creates the view; views issue the GRANT", "Both layers are handled entirely by encryption"]$dbt60763$::jsonb,
   1, $dbt60764$A view shapes the data (which columns/rows are exposed), while GRANT/REVOKE controls which roles/users may query that shaped object.$dbt60764$, 1, 4),
  ($dbt60765$tq-dbms-sql-19-view-security-6$dbt60765$, $dbt60766$pt-dbms-sql-19-view-security$dbt60766$,
   $dbt60767$What is a limitation of column-level GRANT (e.g., GRANT SELECT (id, name) ON employees TO role) compared to a security view?$dbt60767$,
   $dbt60768$["Column-level GRANT cannot exist in SQL at all", "Column-level GRANT alone cannot restrict which rows are visible, unlike a view with a WHERE clause", "Column-level GRANT is faster in all engines", "Column-level GRANT requires materialized views"]$dbt60768$::jsonb,
   1, $dbt60769$Column-level GRANT restricts visible columns but not rows; a view can restrict both columns and rows in one object.$dbt60769$, 1, 5),
  ($dbt60770$tq-dbms-sql-19-view-security-7$dbt60770$, $dbt60771$pt-dbms-sql-19-view-security$dbt60771$,
   $dbt60772$A view exposes a computed column `salary_band` (e.g., 'Low'/'Medium'/'High') instead of the raw salary. What is a realistic security caveat here?$dbt60772$,
   $dbt60773$["There is none \u2014 computed columns are always fully safe", "A determined user could still infer salary bounds from the band value, so view design must be careful about indirect leakage", "salary_band cannot be computed in a view", "This automatically encrypts the value"]$dbt60773$::jsonb,
   1, $dbt60774$Even indirect exposure like a coarse band can leak information about the underlying sensitive value if not designed carefully; view-based security is not automatically airtight.$dbt60774$, 1, 6),
  ($dbt60775$tq-dbms-sql-19-view-security-8$dbt60775$, $dbt60776$pt-dbms-sql-19-view-security$dbt60776$,
   $dbt60777$How does row-level security (RLS), as offered natively by some engines, differ from using multiple hand-built views for the same purpose?$dbt60777$,
   $dbt60778$["RLS requires no privileges at all", "RLS attaches filtering policies directly to the base table so a single table auto-filters rows per user/role, without needing a separate view per access pattern", "RLS and views are functionally identical with no differences", "RLS only works on materialized views"]$dbt60778$::jsonb,
   1, $dbt60779$RLS policies (e.g., PostgreSQL row security policies, Oracle VPD) filter rows automatically at the table level based on the current user/role, reducing the need to maintain many separate views for different audiences.$dbt60779$, 1, 7)
on conflict (id) do nothing;

-- 19.5 Updatable Views
with g as (select id from public.learning_grids where lower(slug) = $dbt60780$dbms-sql-tutorial$dbt60780$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60781$chapter-19-views$dbt60781$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60782$Updatable Views$dbt60782$, $dbt60783$updatable-views$dbt60783$, '', 5, 'published', true, true, $dbt60784$dbms_sql_tutorial$dbt60784$, $dbt60785$chapter-19-views/updatable-views$dbt60785$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60786$dbms_sql_tutorial$dbt60786$ and source_ref = $dbt60787$chapter-19-views/updatable-views$dbt60787$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60788$Updatable Views$dbt60788$, $dbt60789$### What Makes a View Updatable?

An **updatable view** is one through which you can run `INSERT`, `UPDATE`, or `DELETE`, and have the change reflected in the underlying base table — as if you had written directly against the table.

```sql
CREATE VIEW high_earners AS
SELECT id, name, salary, department
FROM employees
WHERE salary > 80000;

UPDATE high_earners
SET salary = salary * 1.05
WHERE id = 101;
-- This actually updates the employees table's row where id = 101
```

```sql
INSERT INTO high_earners (id, name, salary, department)
VALUES (250, 'Priya Rao', 95000, 'Engineering');
-- Inserts a new row directly into employees
```

### The Requirements

A view is generally updatable only when the SQL standard's (and each engine's) conditions hold, most importantly:

1. **Single base table** — no joins.
2. **No aggregate functions** (`SUM`, `COUNT`, `AVG`, etc.).
3. **No `GROUP BY` or `HAVING`.**
4. **No `DISTINCT`.**
5. **No set operations** (`UNION`, `INTERSECT`, `EXCEPT`).
6. Every **NOT NULL column without a default** in the base table must be included in the view's column list (for `INSERT` to succeed).

`high_earners` satisfies all of these: it's a straight `SELECT` from one table with a simple `WHERE` filter, so each view row maps to exactly one `employees` row.

### Why Complex Views Usually Can't Be Updated

Consider `department_summary` from 19.2:

```sql
CREATE VIEW department_summary AS
SELECT d.name, COUNT(e.id) AS headcount, AVG(e.salary) AS avg_salary
FROM departments d LEFT JOIN employees e ON e.department = d.id
GROUP BY d.name;
```

```sql
UPDATE department_summary SET avg_salary = 75000 WHERE name = 'Sales';
-- ERROR: cannot update a view with aggregate functions
```

This fails for a fundamental reason, not a syntactic one: **"the Sales department's average salary" is not a single stored value** — it's derived from potentially dozens of employee rows. Setting it to 75000 doesn't tell the database *which* employees' salaries to change, or by how much each one should move, to make the average come out to 75000. The mapping from one view row to underlying rows is one-to-many and ambiguous, so there's no well-defined way to push the update down. The same logic applies to joins: updating a joined view row might logically need to touch two different tables at once, and the engine has no reliable way to know how to split the change (unless it's a `WITH CHECK OPTION`-style single-table-affecting join, which some engines like PostgreSQL support with restrictions via `INSTEAD OF` triggers).

### WITH CHECK OPTION

```sql
CREATE VIEW high_earners AS
SELECT id, name, salary, department
FROM employees
WHERE salary > 80000
WITH CHECK OPTION;
```

This prevents `INSERT`/`UPDATE` operations through the view from creating a row that *wouldn't* satisfy the view's own `WHERE` clause — e.g., you can no longer `UPDATE high_earners SET salary = 50000` and silently push a row out of the view's visibility; the statement is rejected instead.

### INSTEAD OF Triggers: Making Complex Views "Updatable" Anyway

Some engines let you attach an `INSTEAD OF` trigger to a non-updatable view, letting you write custom procedural logic that decides how an update should be distributed across underlying tables:

```sql
CREATE TRIGGER dept_summary_update
INSTEAD OF UPDATE ON department_summary
FOR EACH ROW
BEGIN
    -- custom logic to decide what an "average salary" update even means
END;
```

This doesn't make the view natively updatable — it substitutes your own procedural interpretation for the ambiguous case.

### Edge Cases

- A simple view with a `WHERE` clause referencing a column **not included** in the view's own SELECT list can still be updatable in some engines but not others — behavior varies.
- A view over a single table that includes a computed/expression column (e.g., `salary * 1.1 AS projected_salary`) is typically NOT updatable through that specific column, since there's no direct underlying column to write to.
- MySQL, PostgreSQL, and Oracle all differ slightly in exactly which single-table view shapes they consider updatable — always check engine documentation for edge conditions.

### Key Takeaways / Interview Q&A

**Q: Is every simple (single-table) view automatically updatable?**
A: Not necessarily — additional conditions apply (no aggregation, GROUP BY, DISTINCT, and required NOT NULL columns present), but most straightforward single-table filtered views are updatable.

**Q: Why can't you UPDATE a view containing AVG(salary)?**
A: Because the aggregate value doesn't correspond to any single underlying row — there's no unambiguous way to translate "set the average to X" into concrete row-level changes.

**Q: What does WITH CHECK OPTION protect against?**
A: It prevents INSERT/UPDATE through a view from producing a row that the view's own WHERE clause would then exclude.
$dbt60789$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60790$dbms_sql_tutorial_seed$dbt60790$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60791$dbms_sql_tutorial_seed$dbt60791$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60792$dbms-sql-tutorial$dbt60792$),
     t as (select id from public.learning_topics where source_kind = $dbt60793$dbms_sql_tutorial$dbt60793$ and source_ref = $dbt60794$chapter-19-views/updatable-views$dbt60794$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60795$pt-dbms-sql-19-updatable-views$dbt60795$, $dbt60796$Updatable Views - Quick Test$dbt60796$, 'aptitude', 8, 8,
  $dbt60797$8 questions on Updatable Views.$dbt60797$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60798$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60798$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60799$tq-dbms-sql-19-updatable-views-1$dbt60799$, $dbt60800$pt-dbms-sql-19-updatable-views$dbt60800$,
   $dbt60801$Which of the following views is most likely to be directly updatable?$dbt60801$,
   $dbt60802$["A view with GROUP BY and COUNT(*)", "A view joining two tables", "A single-table view with a simple WHERE filter and no aggregation", "A view using UNION of two SELECTs"]$dbt60802$::jsonb,
   2, $dbt60803$Simple, single-table views without aggregation, GROUP BY, DISTINCT, or set operations are the classic case of an updatable view.$dbt60803$, 1, 0),
  ($dbt60804$tq-dbms-sql-19-updatable-views-2$dbt60804$, $dbt60805$pt-dbms-sql-19-updatable-views$dbt60805$,
   $dbt60806$Why can't `UPDATE department_summary SET avg_salary = 75000 WHERE name = 'Sales';` be executed, given department_summary uses AVG(salary) GROUP BY department?$dbt60806$,
   $dbt60807$["Because UPDATE statements are never allowed on views", "Because the average is derived from many employee rows, so there's no unambiguous way to determine which underlying rows to change and by how much", "Because department_summary has no WHERE clause", "Because AVG() columns are read-only by SQL syntax rule with no underlying reason"]$dbt60807$::jsonb,
   1, $dbt60808$The fundamental issue is semantic ambiguity: an aggregate value maps to many underlying rows, so there's no defined way to push a single new value back down to specific row changes.$dbt60808$, 1, 1),
  ($dbt60809$tq-dbms-sql-19-updatable-views-3$dbt60809$, $dbt60810$pt-dbms-sql-19-updatable-views$dbt60810$,
   $dbt60811$What does WITH CHECK OPTION do on an updatable view?$dbt60811$,
   $dbt60812$["It makes a non-updatable view updatable", "It prevents INSERT/UPDATE operations from creating a row that would violate the view's own WHERE clause", "It automatically refreshes materialized data", "It restricts which columns can be selected"]$dbt60812$::jsonb,
   1, $dbt60813$WITH CHECK OPTION ensures any row inserted or updated through the view still satisfies the view's defining WHERE clause, rejecting changes that would 'escape' the view's visibility.$dbt60813$, 1, 2),
  ($dbt60814$tq-dbms-sql-19-updatable-views-4$dbt60814$, $dbt60815$pt-dbms-sql-19-updatable-views$dbt60815$,
   $dbt60816$Which of these is generally NOT a requirement for a view to be updatable?$dbt60816$,
   $dbt60817$["No aggregate functions in the SELECT list", "No GROUP BY or DISTINCT", "The view must be based on a single base table", "The view must include an ORDER BY clause"]$dbt60817$::jsonb,
   3, $dbt60818$ORDER BY has no bearing on updatability; the real requirements involve single-table sourcing and absence of aggregation/GROUP BY/DISTINCT/set operations.$dbt60818$, 1, 3),
  ($dbt60819$tq-dbms-sql-19-updatable-views-5$dbt60819$, $dbt60820$pt-dbms-sql-19-updatable-views$dbt60820$,
   $dbt60821$Why is a view joining employees and departments typically NOT directly updatable?$dbt60821$,
   $dbt60822$["Joins are forbidden in SQL views entirely", "An update to a joined row might logically need to change two different underlying tables at once, and the engine has no reliable default way to split that change", "Joined views cannot be queried with SELECT", "Because JOIN always implies DISTINCT"]$dbt60822$::jsonb,
   1, $dbt60823$A row from a joined view combines data from multiple tables; there's ambiguity in how an UPDATE should be distributed across them, so most engines disallow direct updates on such views by default.$dbt60823$, 1, 4),
  ($dbt60824$tq-dbms-sql-19-updatable-views-6$dbt60824$, $dbt60825$pt-dbms-sql-19-updatable-views$dbt60825$,
   $dbt60826$What mechanism lets a database administrator define custom logic for how an UPDATE against a non-updatable (e.g., aggregated) view should be handled?$dbt60826$,
   $dbt60827$["WITH CHECK OPTION", "An INSTEAD OF trigger", "A materialized view REFRESH", "GRANT UPDATE ON view"]$dbt60827$::jsonb,
   1, $dbt60828$INSTEAD OF triggers let you intercept DML against a view and substitute your own procedural logic for how it should affect the underlying tables — used precisely because the default mapping is ambiguous or unsupported.$dbt60828$, 1, 5),
  ($dbt60829$tq-dbms-sql-19-updatable-views-7$dbt60829$, $dbt60830$pt-dbms-sql-19-updatable-views$dbt60830$,
   $dbt60831$A view selects `salary * 1.1 AS projected_salary` from employees. Can you directly UPDATE the projected_salary column through this view?$dbt60831$,
   $dbt60832$["Yes, it maps directly to the salary column", "No, because it's a computed expression with no single underlying column to write to", "Yes, but only for values above 80000", "Only if WITH CHECK OPTION is used"]$dbt60832$::jsonb,
   1, $dbt60833$A computed/expression column has no direct 1:1 mapping to an underlying stored column, so it typically cannot be the target of a direct UPDATE through the view.$dbt60833$, 1, 6),
  ($dbt60834$tq-dbms-sql-19-updatable-views-8$dbt60834$, $dbt60835$pt-dbms-sql-19-updatable-views$dbt60835$,
   $dbt60836$Does updatability behavior for single-table views with edge-case shapes (e.g., WHERE referencing non-selected columns) vary across database engines?$dbt60836$,
   $dbt60837$["No, the SQL standard makes this fully uniform across all engines", "Yes, MySQL, PostgreSQL, and Oracle differ on some edge conditions, so engine documentation should be consulted", "Updatability is identical because it's determined only by the CREATE VIEW keyword", "This only matters for materialized views"]$dbt60837$::jsonb,
   1, $dbt60838$While the broad rules (no joins/aggregation/GROUP BY/DISTINCT) are widely shared, specific engines differ on some edge cases of what counts as updatable, making per-engine verification important.$dbt60838$, 1, 7)
on conflict (id) do nothing;

-- 19.6 Materialized Views
with g as (select id from public.learning_grids where lower(slug) = $dbt60839$dbms-sql-tutorial$dbt60839$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60840$chapter-19-views$dbt60840$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60841$Materialized Views$dbt60841$, $dbt60842$materialized-views$dbt60842$, '', 6, 'published', true, true, $dbt60843$dbms_sql_tutorial$dbt60843$, $dbt60844$chapter-19-views/materialized-views$dbt60844$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60845$dbms_sql_tutorial$dbt60845$ and source_ref = $dbt60846$chapter-19-views/materialized-views$dbt60846$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60847$Materialized Views$dbt60847$, $dbt60848$### Storing the Result Instead of Re-Running It

A regular view (19.1–19.3) stores only a query definition and re-executes it on every access. A **materialized view** flips that trade-off: it **computes the query once and physically stores the result**, like a real table. Subsequent reads hit the stored data directly — fast, but potentially **stale** until an explicit refresh happens.

### PostgreSQL / Oracle Syntax

```sql
CREATE MATERIALIZED VIEW department_summary_mv AS
SELECT
    d.id AS department_id,
    d.name AS department_name,
    COUNT(e.id) AS headcount,
    AVG(e.salary) AS avg_salary
FROM departments d
LEFT JOIN employees e ON e.department = d.id
GROUP BY d.id, d.name;
```

Reading it is a plain, fast table scan:

```sql
SELECT * FROM department_summary_mv WHERE avg_salary > 60000;
```

But it does **not** automatically pick up changes to `employees`/`departments`. You must explicitly refresh it:

```sql
REFRESH MATERIALIZED VIEW department_summary_mv;                 -- PostgreSQL: blocks reads during refresh (by default)
REFRESH MATERIALIZED VIEW CONCURRENTLY department_summary_mv;    -- requires a unique index; allows concurrent reads
```

In Oracle, materialized views additionally support automatic refresh scheduling (`REFRESH FAST ON COMMIT`, `REFRESH COMPLETE ON DEMAND`, etc.) tied to the underlying tables' change logs.

### The Trade-off

| | Regular View | Materialized View |
|---|---|---|
| Storage | None — query only | Physical, like a table |
| Freshness | Always current | Stale until refreshed |
| Read speed | Depends on underlying query cost every time | Fast — just reads stored rows |
| Write overhead | None | Refresh cost (can be expensive for large aggregations) |
| Indexable | No (the view itself) | Yes — you can index the materialized view directly (see 19.8) |

Materialized views make sense when: the underlying query is expensive (heavy joins/aggregation), it's queried far more often than the base data changes, and some staleness (seconds, minutes, or even a day) is acceptable for the use case — dashboards, reports, analytics rollups are classic examples.

### MySQL Has No Native Materialized Views

Unlike PostgreSQL and Oracle, **MySQL does not support `CREATE MATERIALIZED VIEW`** at all. To get the same effect in MySQL, you simulate it manually:

```sql
-- Simulated "materialized view" in MySQL:
CREATE TABLE department_summary_snapshot AS
SELECT d.id AS department_id, d.name, COUNT(e.id) AS headcount, AVG(e.salary) AS avg_salary
FROM departments d LEFT JOIN employees e ON e.department = d.id
GROUP BY d.id, d.name;

-- "Refresh" job (e.g., run by a scheduled EVENT or external cron):
TRUNCATE TABLE department_summary_snapshot;
INSERT INTO department_summary_snapshot
SELECT d.id, d.name, COUNT(e.id), AVG(e.salary)
FROM departments d LEFT JOIN employees e ON e.department = d.id
GROUP BY d.id, d.name;
```

MySQL can automate the refresh with a scheduled `EVENT`:

```sql
CREATE EVENT refresh_department_summary
ON SCHEDULE EVERY 1 HOUR
DO
  CALL refresh_department_summary_proc();
```

This is functionally a hand-rolled materialized view — a real table plus a scheduled job — with none of the engine-level bookkeeping (like `CONCURRENTLY` refresh or dependency tracking) that PostgreSQL/Oracle provide natively.

### Edge Cases

- **Staleness risk**: a report built on a materialized view refreshed nightly can show numbers that don't match a "live" query against the base tables — this must be communicated to users (e.g., "as of last refresh: ...").
- **Refresh cost**: a full `REFRESH` recomputes the entire result; for very large aggregations this can be as expensive as the original query, and may lock the materialized view against reads unless `CONCURRENTLY` (or an engine's incremental/fast-refresh mode) is used.
- **`REFRESH ... CONCURRENTLY` requires a unique index** on the materialized view in PostgreSQL — without one, only the blocking refresh is available.

### Key Takeaways / Interview Q&A

**Q: What is the core difference between a view and a materialized view?**
A: A view re-runs its query live on every access and stores no data; a materialized view computes and physically stores the result once, requiring an explicit REFRESH to stay current.

**Q: Does MySQL support materialized views natively?**
A: No — MySQL has no CREATE MATERIALIZED VIEW; you simulate one with a real table populated by a scheduled refresh job (e.g., an EVENT or external cron).

**Q: When would you choose a materialized view over a regular view?**
A: When the underlying query is expensive, read far more often than the data changes, and some staleness is acceptable in exchange for much faster reads.
$dbt60848$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60849$dbms_sql_tutorial_seed$dbt60849$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60850$dbms_sql_tutorial_seed$dbt60850$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60851$dbms-sql-tutorial$dbt60851$),
     t as (select id from public.learning_topics where source_kind = $dbt60852$dbms_sql_tutorial$dbt60852$ and source_ref = $dbt60853$chapter-19-views/materialized-views$dbt60853$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60854$pt-dbms-sql-19-materialized-views$dbt60854$, $dbt60855$Materialized Views - Quick Test$dbt60855$, 'aptitude', 8, 8,
  $dbt60856$8 questions on Materialized Views.$dbt60856$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60857$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60857$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60858$tq-dbms-sql-19-materialized-views-1$dbt60858$, $dbt60859$pt-dbms-sql-19-materialized-views$dbt60859$,
   $dbt60860$What is the fundamental difference between a regular view and a materialized view?$dbt60860$,
   $dbt60861$["Materialized views cannot use joins", "A regular view re-runs its query live on each access; a materialized view stores the computed result physically and needs an explicit refresh", "Regular views are always faster", "Materialized views are only for single-table queries"]$dbt60861$::jsonb,
   1, $dbt60862$This is the defining trade-off: plain views compute on demand with no storage, while materialized views trade freshness for storage and read speed, requiring REFRESH to stay current.$dbt60862$, 1, 0),
  ($dbt60863$tq-dbms-sql-19-materialized-views-2$dbt60863$, $dbt60864$pt-dbms-sql-19-materialized-views$dbt60864$,
   $dbt60865$Does MySQL support CREATE MATERIALIZED VIEW natively?$dbt60865$,
   $dbt60866$["Yes, identically to PostgreSQL", "No \u2014 MySQL has no native materialized view feature and it must be simulated with a real table plus a scheduled refresh job", "Yes, but only in MySQL 8 Enterprise", "No, and MySQL has no workaround at all"]$dbt60866$::jsonb,
   1, $dbt60867$MySQL lacks native materialized view support; the common workaround is a regular table populated by a scheduled job (e.g., an EVENT) that periodically re-runs the defining query.$dbt60867$, 1, 1),
  ($dbt60868$tq-dbms-sql-19-materialized-views-3$dbt60868$, $dbt60869$pt-dbms-sql-19-materialized-views$dbt60869$,
   $dbt60870$After data changes in the base tables, when does a materialized view's data reflect those changes?$dbt60870$,
   $dbt60871$["Immediately and automatically, just like a regular view", "Only after an explicit REFRESH MATERIALIZED VIEW (or engine-equivalent) is run", "Never \u2014 materialized views are permanently frozen at creation time", "Only if the base table is dropped and recreated"]$dbt60871$::jsonb,
   1, $dbt60872$A materialized view's stored data goes stale after base-table changes and only updates when explicitly refreshed (or on an automatic schedule/trigger configured by the DBA).$dbt60872$, 1, 2),
  ($dbt60873$tq-dbms-sql-19-materialized-views-4$dbt60873$, $dbt60874$pt-dbms-sql-19-materialized-views$dbt60874$,
   $dbt60875$What does `REFRESH MATERIALIZED VIEW CONCURRENTLY` require in PostgreSQL?$dbt60875$,
   $dbt60876$["A foreign key on the materialized view", "A unique index on the materialized view", "That the view be based on a single table", "Nothing extra beyond a normal refresh"]$dbt60876$::jsonb,
   1, $dbt60877$PostgreSQL requires a unique index on a materialized view before CONCURRENTLY refresh can be used, since it needs a way to match old and new rows for a non-locking update.$dbt60877$, 1, 3),
  ($dbt60878$tq-dbms-sql-19-materialized-views-5$dbt60878$, $dbt60879$pt-dbms-sql-19-materialized-views$dbt60879$,
   $dbt60880$Which scenario is the best candidate for a materialized view rather than a regular view?$dbt60880$,
   $dbt60881$["A cheap single-row lookup queried once a day", "An expensive multi-join aggregation queried frequently by a dashboard, where slight staleness is acceptable", "A view that must always reflect the absolute latest data with zero staleness", "A view with no aggregation at all"]$dbt60881$::jsonb,
   1, $dbt60882$Materialized views shine when an expensive query is read often relative to how often the underlying data changes, and some staleness is tolerable — classic dashboard/reporting use case.$dbt60882$, 1, 4),
  ($dbt60883$tq-dbms-sql-19-materialized-views-6$dbt60883$, $dbt60884$pt-dbms-sql-19-materialized-views$dbt60884$,
   $dbt60885$Can a materialized view be indexed?$dbt60885$,
   $dbt60886$["No, indexing is impossible on any kind of view", "Yes \u2014 because it physically stores data like a table, it can be indexed directly, unlike a regular (non-materialized) view", "Only in MySQL", "Only if it has no aggregate columns"]$dbt60886$::jsonb,
   1, $dbt60887$Since a materialized view physically stores rows, it can have indexes built on it directly, which is one of its major performance advantages over a plain view (see also 19.8).$dbt60887$, 1, 5),
  ($dbt60888$tq-dbms-sql-19-materialized-views-7$dbt60888$, $dbt60889$pt-dbms-sql-19-materialized-views$dbt60889$,
   $dbt60890$In MySQL's simulated materialized-view pattern, what commonly triggers the periodic refresh?$dbt60890$,
   $dbt60891$["A UNIQUE constraint violation", "A scheduled MySQL EVENT (or external cron job) that re-runs the aggregation and repopulates the snapshot table", "The MySQL query optimizer automatically", "A foreign key cascade"]$dbt60891$::jsonb,
   1, $dbt60892$Since MySQL lacks native materialized views, teams typically use a scheduled EVENT or an external cron job to periodically TRUNCATE/re-INSERT (or otherwise repopulate) a snapshot table.$dbt60892$, 1, 6),
  ($dbt60893$tq-dbms-sql-19-materialized-views-8$dbt60893$, $dbt60894$pt-dbms-sql-19-materialized-views$dbt60894$,
   $dbt60895$What risk does a nightly-refreshed materialized view introduce for reporting?$dbt60895$,
   $dbt60896$["It always corrupts the base tables", "Users may see numbers that don't match a live query against the base tables, since the materialized data can be stale until the next refresh", "It prevents any further writes to the base tables", "It removes the need for any GRANT permissions"]$dbt60896$::jsonb,
   1, $dbt60897$Because materialized views are only as fresh as their last refresh, reports built on them can diverge from the live base-table state — a trade-off that must be communicated to consumers.$dbt60897$, 1, 7)
on conflict (id) do nothing;

-- 19.7 View Maintenance
with g as (select id from public.learning_grids where lower(slug) = $dbt60898$dbms-sql-tutorial$dbt60898$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60899$chapter-19-views$dbt60899$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60900$View Maintenance$dbt60900$, $dbt60901$view-maintenance$dbt60901$, '', 7, 'published', true, true, $dbt60902$dbms_sql_tutorial$dbt60902$, $dbt60903$chapter-19-views/view-maintenance$dbt60903$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60904$dbms_sql_tutorial$dbt60904$ and source_ref = $dbt60905$chapter-19-views/view-maintenance$dbt60905$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60906$View Maintenance$dbt60906$, $dbt60907$### Views Are Fragile to Schema Drift

A view is only as stable as the base table(s) it depends on. Because a view stores a *query*, not data, any change to the underlying schema that the query relies on can silently or loudly break it.

### Dropped or Renamed Columns

```sql
CREATE VIEW high_earners AS
SELECT id, name, salary FROM employees WHERE salary > 80000;
```

If someone later runs:

```sql
ALTER TABLE employees RENAME COLUMN salary TO base_salary;
```

what happens to `high_earners` depends on the engine:

- **PostgreSQL** raises an error immediately at rename time if a view depends on the column (`ERROR: cannot rename column salary ... because other objects depend on it` — unless you `CASCADE`, which is not offered for renames the same way as drops, so PostgreSQL actually blocks this by default and requires the view to be handled first).
- Some engines instead let the rename succeed silently, and the view only breaks **the next time it's queried**, producing a runtime error like `column "salary" does not exist` — a much more dangerous failure mode because the break isn't discovered until a report runs (potentially days later) or, worse, a monitoring job silently starts returning errors that get swallowed.
- A **dropped** column referenced by a view is similarly caught immediately by some engines (dependency tracking) and deferred to query time by others.

### CREATE OR REPLACE VIEW for Safe Redefinition

When a schema change is planned, the correct maintenance pattern is to update the view's definition *before or alongside* the schema change, using `CREATE OR REPLACE VIEW` rather than `DROP VIEW` + `CREATE VIEW`:

```sql
-- Step 1: base table renamed salary -> base_salary
ALTER TABLE employees RENAME COLUMN salary TO base_salary;

-- Step 2: fix the view definition without losing its grants
CREATE OR REPLACE VIEW high_earners AS
SELECT id, name, base_salary AS salary   -- keep the view's external contract stable
FROM employees
WHERE base_salary > 80000;
```

Aliasing `base_salary AS salary` here preserves the view's *external contract* — client applications that expect a `salary` column keep working — even though the underlying physical column was renamed. This is a key reason views are valuable for maintenance: they can absorb schema churn on the base table without forcing every consumer to change.

### Why CREATE OR REPLACE Beats DROP + CREATE for Maintenance

If a view has been granted to a dozen roles (`GRANT SELECT ON high_earners TO staff_role, hr_role, dashboard_role, ...`), running `DROP VIEW high_earners;` typically **removes all of those grants**, since they were attached to the view object which no longer exists. Recreating the view means someone must remember to re-run every `GRANT` — an easy step to miss, potentially leaving a formerly-granted role locked out (or, if grants are re-run carelessly, opening access more broadly than intended). `CREATE OR REPLACE VIEW` sidesteps this entirely by updating the same object in place.

### Dependency Tracking

Well-behaved engines maintain a dependency graph (e.g., PostgreSQL's `pg_depend`) so that:

- Attempting to `DROP TABLE employees` fails if `high_earners` depends on it, unless `CASCADE` is specified (which would also drop the view).
- Tools can query system catalogs (`information_schema.view_table_usage`, `pg_depend`, etc.) to find every view impacted before making a risky schema change — a critical step in real-world schema migrations.

### Edge Cases

- **`SELECT *` views are especially fragile-in-a-different-way**: adding a column to the base table changes the view's output shape unexpectedly (extra column appears), while removing one breaks it — explicit column lists are safer for long-term maintenance even though they require updating the view when new columns should be exposed.
- **Nested views compound the blast radius** of a schema change — a change to `employees` can break `high_earners`, which breaks any view built on `high_earners`, and so on (see 19.8).
- **Testing before schema changes**: mature teams run a "what depends on this column/table" query against the catalog before any `ALTER TABLE`/`DROP COLUMN` in production.

### Key Takeaways / Interview Q&A

**Q: What's the danger of a base table column being dropped when a view references it, in engines without eager dependency checks?**
A: The view can continue to exist without error until it's actually queried, at which point it fails — a silent, delayed failure that's easy to miss until a report or job breaks in production.

**Q: Why prefer CREATE OR REPLACE VIEW over DROP VIEW + CREATE VIEW when fixing a broken view?**
A: DROP VIEW typically removes grants attached to the view object; CREATE OR REPLACE VIEW updates the definition in place and preserves those grants.

**Q: How can a view help absorb a column rename without breaking client applications?**
A: By aliasing the renamed column back to its old name in the view's SELECT list (e.g., `base_salary AS salary`), keeping the view's external contract stable even as the physical schema changes underneath it.
$dbt60907$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60908$dbms_sql_tutorial_seed$dbt60908$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60909$dbms_sql_tutorial_seed$dbt60909$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60910$dbms-sql-tutorial$dbt60910$),
     t as (select id from public.learning_topics where source_kind = $dbt60911$dbms_sql_tutorial$dbt60911$ and source_ref = $dbt60912$chapter-19-views/view-maintenance$dbt60912$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60913$pt-dbms-sql-19-view-maintenance$dbt60913$, $dbt60914$View Maintenance - Quick Test$dbt60914$, 'aptitude', 8, 8,
  $dbt60915$8 questions on View Maintenance.$dbt60915$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60916$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60916$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60917$tq-dbms-sql-19-view-maintenance-1$dbt60917$, $dbt60918$pt-dbms-sql-19-view-maintenance$dbt60918$,
   $dbt60919$What can happen if a column referenced by a view is dropped from the base table, in an engine that doesn't eagerly check view dependencies?$dbt60919$,
   $dbt60920$["The view is automatically updated to remove the reference", "Nothing changes until the view is queried, at which point it fails with an error like 'column does not exist'", "The database refuses to start", "The view silently returns zero rows forever"]$dbt60920$::jsonb,
   1, $dbt60921$Without eager dependency checking, the break is deferred until query time, producing a delayed and easy-to-miss failure — a dangerous maintenance trap.$dbt60921$, 1, 0),
  ($dbt60922$tq-dbms-sql-19-view-maintenance-2$dbt60922$, $dbt60923$pt-dbms-sql-19-view-maintenance$dbt60923$,
   $dbt60924$Why is CREATE OR REPLACE VIEW generally preferred over DROP VIEW + CREATE VIEW when fixing a view's definition?$dbt60924$,
   $dbt60925$["It runs faster on large tables", "DROP VIEW typically removes the grants attached to the view object, which must then be manually re-issued; CREATE OR REPLACE VIEW preserves them", "DROP VIEW is not valid SQL syntax", "CREATE OR REPLACE VIEW automatically updates all dependent views too"]$dbt60925$::jsonb,
   1, $dbt60926$Dropping a view destroys the object and its associated permissions; replacing it in place keeps the same object identity and its grants intact, avoiding the risk of forgetting to reissue GRANTs.$dbt60926$, 1, 1),
  ($dbt60927$tq-dbms-sql-19-view-maintenance-3$dbt60927$, $dbt60928$pt-dbms-sql-19-view-maintenance$dbt60928$,
   $dbt60929$A column `salary` is renamed to `base_salary`. How can a view preserve its external `salary` column name for existing client applications?$dbt60929$,
   $dbt60930$["By using SELECT * so all columns pass through automatically", "By redefining the view with `base_salary AS salary` in the SELECT list via CREATE OR REPLACE VIEW", "It is impossible to preserve the old column name in a view", "By creating a synonym table"]$dbt60930$::jsonb,
   1, $dbt60931$Aliasing the renamed physical column back to the original name in the view definition keeps the view's output contract stable for consumers, even though the underlying column name changed.$dbt60931$, 1, 2),
  ($dbt60932$tq-dbms-sql-19-view-maintenance-4$dbt60932$, $dbt60933$pt-dbms-sql-19-view-maintenance$dbt60933$,
   $dbt60934$Why are views defined with SELECT * considered more fragile for long-term maintenance than views with an explicit column list?$dbt60934$,
   $dbt60935$["SELECT * views cannot be dropped", "SELECT * views' output shape silently changes when columns are added to or removed from the base table", "SELECT * is not valid inside a view definition", "SELECT * views always run slower"]$dbt60935$::jsonb,
   1, $dbt60936$A SELECT * view's output automatically reflects any base-table column additions/removals, which can unexpectedly change downstream consumers' results or break them — explicit column lists avoid this surprise.$dbt60936$, 1, 3),
  ($dbt60937$tq-dbms-sql-19-view-maintenance-5$dbt60937$, $dbt60938$pt-dbms-sql-19-view-maintenance$dbt60938$,
   $dbt60939$What does a dependency-tracking system (e.g., PostgreSQL's pg_depend) prevent by default?$dbt60939$,
   $dbt60940$["Creating any new view", "Dropping a table that a view depends on, unless CASCADE is specified", "Granting SELECT on a view", "Renaming any column in the database"]$dbt60940$::jsonb,
   1, $dbt60941$Dependency tracking blocks a DROP TABLE (or similar) that would break a dependent view, unless the operation is explicitly forced with CASCADE, protecting against accidental breakage.$dbt60941$, 1, 4),
  ($dbt60942$tq-dbms-sql-19-view-maintenance-6$dbt60942$, $dbt60943$pt-dbms-sql-19-view-maintenance$dbt60943$,
   $dbt60944$Why should a team query the system catalog for view dependencies before running ALTER TABLE ... DROP COLUMN in production?$dbt60944$,
   $dbt60945$["It's not necessary since SQL always warns automatically", "To identify every view that could break from the change and fix/update them proactively rather than discovering failures later", "Because ALTER TABLE requires listing dependent views by law of SQL syntax", "To automatically drop all dependent views"]$dbt60945$::jsonb,
   1, $dbt60946$Proactively checking dependencies (via information_schema.view_table_usage, pg_depend, etc.) lets a team fix or update all impacted views before the breaking change ships, avoiding delayed production failures.$dbt60946$, 1, 5),
  ($dbt60947$tq-dbms-sql-19-view-maintenance-7$dbt60947$, $dbt60948$pt-dbms-sql-19-view-maintenance$dbt60948$,
   $dbt60949$What compounding risk do nested views (a view built on another view) introduce for schema maintenance?$dbt60949$,
   $dbt60950$["None \u2014 nested views are fully isolated from each other", "A single base-table schema change can cascade through multiple layers of dependent views, widening the blast radius of a break", "Nested views cannot be created at all", "Nested views automatically fix themselves"]$dbt60950$::jsonb,
   1, $dbt60951$If view B is built on view A, a break in A (from a base-table change) propagates to B and anything built on B — increasing the scope of what must be checked and fixed.$dbt60951$, 1, 6),
  ($dbt60952$tq-dbms-sql-19-view-maintenance-8$dbt60952$, $dbt60953$pt-dbms-sql-19-view-maintenance$dbt60953$,
   $dbt60954$In PostgreSQL, what commonly happens if you try to RENAME a column that an existing view depends on?$dbt60954$,
   $dbt60955$["It always succeeds silently with no warning", "It typically raises an error blocking the rename because other objects (the view) depend on that column", "It automatically updates the view's definition to match", "It converts the view into a materialized view"]$dbt60955$::jsonb,
   1, $dbt60956$PostgreSQL's dependency tracking generally blocks a column rename when a view depends on it, forcing the view to be handled (e.g., via CREATE OR REPLACE VIEW) as part of the schema change.$dbt60956$, 1, 7)
on conflict (id) do nothing;

-- 19.8 View Limitations
with g as (select id from public.learning_grids where lower(slug) = $dbt60957$dbms-sql-tutorial$dbt60957$),
     s as (select id from public.learning_sections where lower(slug) = $dbt60958$chapter-19-views$dbt60958$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt60959$View Limitations$dbt60959$, $dbt60960$view-limitations$dbt60960$, '', 8, 'published', true, true, $dbt60961$dbms_sql_tutorial$dbt60961$, $dbt60962$chapter-19-views/view-limitations$dbt60962$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt60963$dbms_sql_tutorial$dbt60963$ and source_ref = $dbt60964$chapter-19-views/view-limitations$dbt60964$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt60965$View Limitations$dbt60965$, $dbt60966$### Views Are Convenient, Not Magic

Views solve real problems — abstraction, security, reuse — but they come with structural limitations that every SQL developer needs to know before relying on them too heavily.

### 1. Ordinary Views Cannot Be Indexed Directly

Because a plain view has no physical storage, you cannot create an index *on the view itself*:

```sql
CREATE VIEW high_earners AS
SELECT id, name, salary FROM employees WHERE salary > 80000;

CREATE INDEX idx_he_salary ON high_earners (salary);  -- ERROR in most engines
```

Any indexing must happen on the **base table** (`CREATE INDEX ON employees (salary)`), which the view's query can then take advantage of when the optimizer inlines the view definition. The one major exception: **materialized views can be indexed directly** (19.6), since they are physically stored, real objects — this is one of the biggest reasons to materialize an expensive view in the first place.

### 2. Nested Views Are Hard to Reason About

A view can be built on top of another view:

```sql
CREATE VIEW engineering_high_earners AS
SELECT * FROM high_earners WHERE department = 'Engineering';
```

This works, but as nesting grows deeper (`view_c` on `view_b` on `view_a` on a table), two problems compound:

- **Debugging performance** becomes difficult — `EXPLAIN` output on the outermost view can turn into a large, hard-to-read plan spanning several inlined query fragments, making it unclear which layer is responsible for a slow scan or a missing index opportunity.
- **Reasoning about correctness** becomes difficult — understanding what `view_c` actually returns requires mentally unwinding three layers of `WHERE`/`JOIN`/`GROUP BY` logic, and a change to any middle layer (`view_b`) can have non-obvious effects on `view_c`'s results.

As a practical guideline, teams typically cap view nesting depth (e.g., no more than one or two layers) and prefer flattening a chain of views back into a single well-documented view when it grows unwieldy.

### 3. Engine-Specific Restrictions on Updatable Views

Beyond the general rules in 19.5 (no joins, no aggregation, no GROUP BY/DISTINCT), specific engines impose their own additional constraints on what counts as an updatable view — for example, restrictions around:

- Views containing window functions.
- Views with certain subquery forms in the `WHERE` clause.
- Views combining a `LIMIT`/`TOP` clause with `INSERT`/`UPDATE`.

These vary enough between MySQL, PostgreSQL, and Oracle that "is this view updatable?" often needs to be verified against the specific engine's documentation (or its `information_schema.views.is_updatable` column, where offered) rather than assumed from general SQL knowledge.

### 4. Views Don't Improve Performance By Themselves

A common misconception: wrapping a slow query in a view makes it fast. It does not — a plain view is just a stored alias for the same query, with the same execution cost. (Only a *materialized* view changes the performance characteristics, by trading freshness for stored results — 19.6.)

### 5. Permissions Complexity Can Grow

As seen in 19.4 and 19.7, views used heavily for security create their own maintenance burden: many narrow, purpose-built views (`staff_view`, `manager_view`, `hr_view`, `audit_view`, ...) each need their own grants tracked and kept in sync as roles or requirements evolve — a form of security-configuration sprawl that needs its own governance.

### Edge Cases

- **Circular view references are impossible** — a view cannot (directly or indirectly) reference itself, since it must exist before being referenced.
- **A materialized view built on a nested chain of ordinary views** still recomputes the entire chain on each `REFRESH`, so nesting doesn't disappear just because the outer object is materialized — only the *read* path becomes fast.
- **`information_schema.views`** and engine-specific catalogs are the authoritative way to check whether a specific view, in a specific engine, is currently classified as updatable, indexable, etc. — don't assume from general rules alone.

### Key Takeaways / Interview Q&A

**Q: Can you put an index directly on a regular (non-materialized) view?**
A: No — indexes go on the base table (or on a materialized view, since that one is physically stored).

**Q: What's the main risk of deeply nested views?**
A: Difficulty reasoning about correctness and debugging performance, since understanding the outermost view requires unwinding every layer beneath it, and changes to a middle layer can have non-obvious downstream effects.

**Q: Does wrapping a slow query in a plain view make it faster?**
A: No — a plain view has the same execution cost as its underlying query every time it's queried; only materializing it changes that.
$dbt60966$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt60967$dbms_sql_tutorial_seed$dbt60967$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt60968$dbms_sql_tutorial_seed$dbt60968$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt60969$dbms-sql-tutorial$dbt60969$),
     t as (select id from public.learning_topics where source_kind = $dbt60970$dbms_sql_tutorial$dbt60970$ and source_ref = $dbt60971$chapter-19-views/view-limitations$dbt60971$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt60972$pt-dbms-sql-19-view-limitations$dbt60972$, $dbt60973$View Limitations - Quick Test$dbt60973$, 'aptitude', 8, 8,
  $dbt60974$8 questions on View Limitations.$dbt60974$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt60975$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt60975$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt60976$tq-dbms-sql-19-view-limitations-1$dbt60976$, $dbt60977$pt-dbms-sql-19-view-limitations$dbt60977$,
   $dbt60978$Can you directly create an index on a regular (non-materialized) view?$dbt60978$,
   $dbt60979$["Yes, always, just like a table", "No \u2014 indexing must be done on the base table(s); only materialized views can be indexed directly", "Yes, but only for simple views", "Yes, but only in Oracle"]$dbt60979$::jsonb,
   1, $dbt60980$A regular view has no physical storage of its own, so it cannot be indexed; indexes must be created on the underlying base tables. Materialized views, being physically stored, are the exception.$dbt60980$, 1, 0),
  ($dbt60981$tq-dbms-sql-19-view-limitations-2$dbt60981$, $dbt60982$pt-dbms-sql-19-view-limitations$dbt60982$,
   $dbt60983$What is a primary risk of deeply nested views (a view built on a view built on a view)?$dbt60983$,
   $dbt60984$["SQL syntax forbids more than two levels of nesting", "It becomes hard to reason about correctness and to debug performance, since the outermost view's behavior depends on unwinding every layer beneath it", "Nested views always run faster than flat views", "Nested views cannot be granted permissions"]$dbt60984$::jsonb,
   1, $dbt60985$As nesting deepens, both correctness reasoning and performance debugging (e.g., reading EXPLAIN output) become significantly harder, since each layer's logic compounds.$dbt60985$, 1, 1),
  ($dbt60986$tq-dbms-sql-19-view-limitations-3$dbt60986$, $dbt60987$pt-dbms-sql-19-view-limitations$dbt60987$,
   $dbt60988$Does wrapping a slow, expensive query in a plain (non-materialized) view make it run faster?$dbt60988$,
   $dbt60989$["Yes, views are always optimized automatically", "No \u2014 a plain view has the same execution cost as its underlying query each time it's accessed; only materializing it changes performance", "Yes, because views are cached in memory by default", "No, views always make queries slower"]$dbt60989$::jsonb,
   1, $dbt60990$A plain view is just a stored alias for a query; it does not change the cost of executing that query. Only a materialized view changes performance characteristics, by storing precomputed results.$dbt60990$, 1, 2),
  ($dbt60991$tq-dbms-sql-19-view-limitations-4$dbt60991$, $dbt60992$pt-dbms-sql-19-view-limitations$dbt60992$,
   $dbt60993$Why might heavy use of many narrow security views (staff_view, manager_view, hr_view, ...) become a maintenance burden?$dbt60993$,
   $dbt60994$["Because SQL limits databases to 10 views total", "Because each view's grants must be individually tracked and kept in sync as roles/requirements evolve, creating security-configuration sprawl", "Because views automatically expire after 30 days", "Because only one view can be granted per role"]$dbt60994$::jsonb,
   1, $dbt60995$A proliferation of purpose-built views each carries its own set of grants to maintain, and keeping all of them correctly synchronized with evolving access requirements is its own governance challenge.$dbt60995$, 1, 3),
  ($dbt60996$tq-dbms-sql-19-view-limitations-5$dbt60996$, $dbt60997$pt-dbms-sql-19-view-limitations$dbt60997$,
   $dbt60998$Is it possible for a view to directly or indirectly reference itself (a circular view reference)?$dbt60998$,
   $dbt60999$["Yes, common in recursive reporting views", "No \u2014 a view must exist before it can be referenced by another view's definition, making true circular references impossible", "Yes, but only in PostgreSQL", "Only materialized views can be circular"]$dbt60999$::jsonb,
   1, $dbt61000$Since a view's defining query is validated against objects that already exist at creation time, a view cannot reference itself, directly or through a chain, at creation.$dbt61000$, 1, 4),
  ($dbt61001$tq-dbms-sql-19-view-limitations-6$dbt61001$, $dbt61002$pt-dbms-sql-19-view-limitations$dbt61002$,
   $dbt61003$If a materialized view is built on top of a chain of ordinary (non-materialized) nested views, what happens on REFRESH?$dbt61003$,
   $dbt61004$["Only the outermost layer is recomputed; inner views are skipped", "The entire nested chain is recomputed as part of running the REFRESH, since materialization only affects the stored read path, not the underlying query cost", "REFRESH is not allowed on views built on nested views", "The nested views are automatically flattened permanently"]$dbt61004$::jsonb,
   1, $dbt61005$Materializing the outer object doesn't remove the underlying computational chain — REFRESH still executes the full nested query; only subsequent reads of the materialized result are fast.$dbt61005$, 1, 5),
  ($dbt61006$tq-dbms-sql-19-view-limitations-7$dbt61006$, $dbt61007$pt-dbms-sql-19-view-limitations$dbt61007$,
   $dbt61008$Where should you check whether a specific view in a specific engine is currently classified as updatable?$dbt61008$,
   $dbt61009$["Always assume it based on the general single-table rule alone", "Consult the engine's catalog (e.g., information_schema.views.is_updatable) or documentation, since engine-specific restrictions vary", "It's always shown in the CREATE VIEW statement's output", "Updatability is identical in every SQL engine with no exceptions"]$dbt61009$::jsonb,
   1, $dbt61010$Because MySQL, PostgreSQL, and Oracle differ on specific edge-case restrictions (window functions, certain subqueries, LIMIT combined with DML, etc.), the authoritative answer comes from the engine's own catalog/documentation.$dbt61010$, 1, 6),
  ($dbt61011$tq-dbms-sql-19-view-limitations-8$dbt61011$, $dbt61012$pt-dbms-sql-19-view-limitations$dbt61012$,
   $dbt61013$Which statement best summarizes the relationship between view nesting depth and system maintainability, as a practical guideline?$dbt61013$,
   $dbt61014$["Deeper nesting is always better for modularity with no downside", "Teams typically cap nesting depth and flatten chains of views that grow unwieldy, to keep correctness and performance reasoning tractable", "Nesting depth has no effect on maintainability", "Nesting is banned by the SQL standard"]$dbt61014$::jsonb,
   1, $dbt61015$While some nesting is fine, excessive depth makes both correctness and performance harder to reason about, so a common practical guideline is to limit nesting and flatten overly deep chains.$dbt61015$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 20: Indexes and Access Paths
-- ---------------------------------------------------------------------------
-- 20.1 Why Indexes Exist
with g as (select id from public.learning_grids where lower(slug) = $dbt61016$dbms-sql-tutorial$dbt61016$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61017$chapter-20-indexes-and-access-paths$dbt61017$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61018$Why Indexes Exist$dbt61018$, $dbt61019$why-indexes-exist$dbt61019$, '', 1, 'published', true, true, $dbt61020$dbms_sql_tutorial$dbt61020$, $dbt61021$chapter-20-indexes-and-access-paths/why-indexes-exist$dbt61021$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61022$dbms_sql_tutorial$dbt61022$ and source_ref = $dbt61023$chapter-20-indexes-and-access-paths/why-indexes-exist$dbt61023$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61024$Why Indexes Exist$dbt61024$, $dbt61025$### The problem: finding a needle in a haystack

Imagine a `students(id, name, department, gpa, email)` table with **1,000,000 rows**. Now run:

```sql
SELECT * FROM students WHERE email = 'jane.doe@example.com';
```

Without any extra help, the database engine has exactly one option: a **full table scan**. It reads every single row, one at a time, checks whether `email` matches, and moves on. On average it has to inspect around 500,000 rows before finding the match (and if no row matches, it must read all 1,000,000 to be sure). For a table this size, that could mean reading gigabytes of data from disk for a single lookup.

### What an index actually is

An **index** is a separate, auxiliary data structure that the database maintains alongside the table. Conceptually, it stores the indexed column's values in **sorted (or otherwise organized) order**, with each value pointing back to the physical location of the corresponding row(s) in the table. It is very similar to the index at the back of a textbook: instead of flipping through every page to find "transactions," you look up "transactions" in the alphabetically sorted index and jump straight to page 214.

If `students.email` has an index, the same query becomes: look up `'jane.doe@example.com'` in the sorted structure (which takes only a handful of comparisons, not a million), find the pointer, and jump directly to that row. What was an O(n) operation becomes something close to O(log n) or better.

### The trade-off

Indexes are not free lunches:

- **Extra storage**: the index itself is a data structure that must be stored on disk, potentially doubling the space used by that column's data (plus pointers).
- **Slower writes**: every `INSERT`, `UPDATE`, or `DELETE` that touches an indexed column must also update the index structure, not just the table. More indexes mean more work per write (this is explored fully in 20.14).
- **Maintenance overhead**: indexes can become fragmented over time and may need periodic reorganizing.

In exchange, you get dramatically faster reads on the indexed column(s) — often the difference between a query taking milliseconds versus seconds or minutes on a large table.

### Edge cases

- A table with only a handful of rows (say, 50) gains almost nothing from an index — a full scan of 50 rows is already essentially instant, and the index's overhead may make writes net-negative (see 20.15).
- An index only helps queries that actually use the indexed column in a way the index supports (equality, range, sorting, depending on index type) — an index on `email` does nothing for a query filtering on `department` alone.
- Indexes speed up reads but the engine's query optimizer ultimately *decides* whether to use an index at all, based on statistics like selectivity (20.12) and cardinality (20.13) — having an index doesn't guarantee it will be used.

### Interview-style Q&A

**Q: Why not just index every column to be safe?**
A: Because every index adds storage cost and write overhead. Indexing indiscriminately can make bulk inserts and updates painfully slow while providing no benefit to queries that never filter on those columns.

**Q: What's the fundamental trade-off an index makes?**
A: It trades write speed and storage for read speed — data is duplicated into an organized side-structure so that lookups avoid touching (most of) the actual table.

**Key takeaway:** an index exists to let the engine skip past irrelevant rows instead of examining every one — the classic full-scan-vs-lookup trade-off that underlies every other topic in this chapter.$dbt61025$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61026$dbms_sql_tutorial_seed$dbt61026$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61027$dbms_sql_tutorial_seed$dbt61027$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61028$dbms-sql-tutorial$dbt61028$),
     t as (select id from public.learning_topics where source_kind = $dbt61029$dbms_sql_tutorial$dbt61029$ and source_ref = $dbt61030$chapter-20-indexes-and-access-paths/why-indexes-exist$dbt61030$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61031$pt-dbms-sql-20-why-indexes-exist$dbt61031$, $dbt61032$Why Indexes Exist - Quick Test$dbt61032$, 'aptitude', 8, 8,
  $dbt61033$8 questions on Why Indexes Exist.$dbt61033$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61034$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61034$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61035$tq-dbms-sql-20-why-indexes-exist-1$dbt61035$, $dbt61036$pt-dbms-sql-20-why-indexes-exist$dbt61036$,
   $dbt61037$On a `students` table with 1,000,000 rows and no index on `email`, what must the engine do to find a row matching a specific email?$dbt61037$,
   $dbt61038$["Perform a binary search on the table file", "Perform a full table scan, checking rows one by one", "Automatically build a temporary index", "Reject the query as unsupported"]$dbt61038$::jsonb,
   1, $dbt61039$Without an index, the only way to guarantee correctness is to examine every row — a full table scan.$dbt61039$, 1, 0),
  ($dbt61040$tq-dbms-sql-20-why-indexes-exist-2$dbt61040$, $dbt61041$pt-dbms-sql-20-why-indexes-exist$dbt61041$,
   $dbt61042$What is the best conceptual description of a database index?$dbt61042$,
   $dbt61043$["A cached copy of the entire table", "A compressed version of the table stored in memory only", "A separate, organized structure mapping column values to row locations", "A rule that prevents duplicate values"]$dbt61043$::jsonb,
   2, $dbt61044$An index is an auxiliary structure — separate from the table itself — that maps indexed values to where the matching rows live.$dbt61044$, 1, 1),
  ($dbt61045$tq-dbms-sql-20-why-indexes-exist-3$dbt61045$, $dbt61046$pt-dbms-sql-20-why-indexes-exist$dbt61046$,
   $dbt61047$Which of the following is a genuine cost of adding an index?$dbt61047$,
   $dbt61048$["Reads become slower", "Writes (INSERT/UPDATE/DELETE) become slower because the index must also be updated", "The table can no longer be queried without the index", "SELECT * queries stop working"]$dbt61048$::jsonb,
   1, $dbt61049$Every write that touches an indexed column must also update the index structure, adding overhead to writes.$dbt61049$, 1, 2),
  ($dbt61050$tq-dbms-sql-20-why-indexes-exist-4$dbt61050$, $dbt61051$pt-dbms-sql-20-why-indexes-exist$dbt61051$,
   $dbt61052$A full table scan on a 1,000,000-row table looking for a single matching email averages how many row checks (assuming exactly one match exists)?$dbt61052$,
   $dbt61053$["log2(1,000,000) \u2248 20", "About 500,000", "Exactly 1", "1,000,000 always, no matter what"]$dbt61053$::jsonb,
   1, $dbt61054$On average, a linear scan finds a single match halfway through, so roughly half the rows (500,000) are checked before it's found.$dbt61054$, 1, 3),
  ($dbt61055$tq-dbms-sql-20-why-indexes-exist-5$dbt61055$, $dbt61056$pt-dbms-sql-20-why-indexes-exist$dbt61056$,
   $dbt61057$Which analogy best captures how an index helps a query?$dbt61057$,
   $dbt61058$["Like memorizing the entire textbook", "Like the index at the back of a textbook, letting you jump straight to the right page instead of reading every page", "Like removing pages from the textbook you don't need", "Like translating the textbook into another language"]$dbt61058$::jsonb,
   1, $dbt61059$A book index maps terms to page numbers so you skip irrelevant pages — exactly analogous to a DB index mapping values to row locations.$dbt61059$, 1, 4),
  ($dbt61060$tq-dbms-sql-20-why-indexes-exist-6$dbt61060$, $dbt61061$pt-dbms-sql-20-why-indexes-exist$dbt61061$,
   $dbt61062$Why might indexing every single column of a table be a bad idea?$dbt61062$,
   $dbt61063$["Databases technically cap the number of indexes at 2", "Each index adds storage and slows down every write, even if many indexes are rarely used for reads", "Indexes make SELECT queries return wrong results", "It is not possible to index more than one column total"]$dbt61063$::jsonb,
   1, $dbt61064$Indiscriminate indexing multiplies write overhead and storage cost without necessarily providing matching read benefit.$dbt61064$, 1, 5),
  ($dbt61065$tq-dbms-sql-20-why-indexes-exist-7$dbt61065$, $dbt61066$pt-dbms-sql-20-why-indexes-exist$dbt61066$,
   $dbt61067$For a tiny lookup table with only 20 rows, what is the expected impact of adding an index?$dbt61067$,
   $dbt61068$["Reads become dramatically faster, from seconds to microseconds", "Negligible benefit, since a full scan of 20 rows is already essentially instant", "The table becomes read-only", "The index eliminates the need for a primary key"]$dbt61068$::jsonb,
   1, $dbt61069$With so few rows, a scan is already trivially fast, so the index's overhead may not be worth it — this foreshadows 20.15.$dbt61069$, 1, 6),
  ($dbt61070$tq-dbms-sql-20-why-indexes-exist-8$dbt61070$, $dbt61071$pt-dbms-sql-20-why-indexes-exist$dbt61071$,
   $dbt61072$True or false: having an index on a column guarantees the query optimizer will use it for every query touching that column.$dbt61072$,
   $dbt61073$["True, indexes are always used if they exist", "False, the optimizer decides whether to use an index based on factors like selectivity and cardinality", "True, but only for SELECT * queries", "False, indexes can only be used by UPDATE statements"]$dbt61073$::jsonb,
   1, $dbt61074$The presence of an index doesn't force its use; the optimizer weighs statistics to decide if using it is actually cheaper than a scan.$dbt61074$, 1, 7)
on conflict (id) do nothing;

-- 20.2 B Tree
with g as (select id from public.learning_grids where lower(slug) = $dbt61075$dbms-sql-tutorial$dbt61075$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61076$chapter-20-indexes-and-access-paths$dbt61076$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61077$B Tree$dbt61077$, $dbt61078$b-tree$dbt61078$, '', 2, 'published', true, true, $dbt61079$dbms_sql_tutorial$dbt61079$, $dbt61080$chapter-20-indexes-and-access-paths/b-tree$dbt61080$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61081$dbms_sql_tutorial$dbt61081$ and source_ref = $dbt61082$chapter-20-indexes-and-access-paths/b-tree$dbt61082$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61083$B Tree$dbt61083$, $dbt61084$### The workhorse structure behind most indexes

A **B-Tree** (balanced tree) is the classic data structure most database indexes are conceptually built on. It is not a binary tree — each node can hold many sorted keys and have many children, which is exactly what makes it efficient for disk-backed databases.

### The shape

A B-Tree has three kinds of nodes:

- **Root node**: the single entry point at the top.
- **Internal nodes**: hold sorted keys that act as signposts, directing a search toward the correct child subtree.
- **Leaf nodes**: the bottom level, where the actual keys (and, in a plain B-Tree, their associated data or pointers) live.

Imagine indexing `students.gpa` (values 0.0–4.0) conceptually. The root might hold a key like `2.5`: anything less goes left, anything greater-or-equal goes right. Each of those children further splits its range with its own sorted keys, and so on, until you reach a leaf node holding the specific GPA value you're searching for along with a pointer to the matching row(s).

### Why log(n) depth matters at scale

Because each node holds many keys (not just one, like a binary tree), a B-Tree stays very "flat" (shallow) even for huge tables. If each node can hold, say, 100 keys/children, then a B-Tree over 1,000,000 rows needs only about log₁₀₀(1,000,000) ≈ 3 levels to reach any leaf. Compare that to a full table scan needing up to 1,000,000 comparisons — a B-Tree lookup on the same data needs only a handful of node reads (traversing 3 levels), each of which is a fast comparison against sorted keys.

This shallow depth is precisely why B-Trees scale so well: doubling the table size barely increases the tree's depth (logarithmic growth), so lookup time grows extremely slowly compared to the data size.

### Balance

"Balanced" means every path from the root to a leaf has the same length — the tree doesn't become lopsided as data is inserted and deleted. The structure automatically splits and merges nodes to maintain this balance, which is what guarantees consistent, predictable lookup performance regardless of insertion order.

### Edge cases

- A B-Tree built on a column with very few distinct values (e.g., a boolean flag) still works correctly, but is a poor index candidate in practice — see Selectivity (20.12).
- As rows are inserted, nodes can fill up and must **split**, and as rows are deleted, nodes can become underfull and may **merge** — these rebalancing operations are the source of the "index maintenance" overhead discussed in 20.14.
- A plain B-Tree (as opposed to the B+ Tree variant covered next in 20.3) can store data pointers in internal nodes too, which actually makes range scans less efficient — this is the key motivation for the B+ Tree refinement.

### Interview-style Q&A

**Q: Why is a B-Tree preferred over a plain binary search tree for database indexes?**
A: A B-Tree's wide, shallow shape means far fewer node reads are needed to reach a leaf, which matters enormously when each node read is a disk I/O operation — minimizing I/O is critical for performance.

**Q: What does "balanced" mean in B-Tree?**
A: Every leaf is at the same depth from the root; the tree rebalances itself (via node splits/merges) as data changes, so lookup cost stays predictable.

**Key takeaway:** the B-Tree's wide/shallow shape is what turns a linear, million-row search into a handful of comparisons — the foundational reason indexes are fast.$dbt61084$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61085$dbms_sql_tutorial_seed$dbt61085$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61086$dbms_sql_tutorial_seed$dbt61086$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61087$dbms-sql-tutorial$dbt61087$),
     t as (select id from public.learning_topics where source_kind = $dbt61088$dbms_sql_tutorial$dbt61088$ and source_ref = $dbt61089$chapter-20-indexes-and-access-paths/b-tree$dbt61089$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61090$pt-dbms-sql-20-b-tree$dbt61090$, $dbt61091$B Tree - Quick Test$dbt61091$, 'aptitude', 8, 8,
  $dbt61092$8 questions on B Tree.$dbt61092$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61093$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61093$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61094$tq-dbms-sql-20-b-tree-1$dbt61094$, $dbt61095$pt-dbms-sql-20-b-tree$dbt61095$,
   $dbt61096$In a B-Tree index, where do sorted keys act as signposts directing a search toward the correct subtree?$dbt61096$,
   $dbt61097$["Only in leaf nodes", "In internal (and root) nodes", "Nowhere; B-Trees are unsorted", "Only in a separate lookup table"]$dbt61097$::jsonb,
   1, $dbt61098$Internal nodes (including the root) hold sorted keys used purely to navigate toward the correct child during a search.$dbt61098$, 1, 0),
  ($dbt61099$tq-dbms-sql-20-b-tree-2$dbt61099$, $dbt61100$pt-dbms-sql-20-b-tree$dbt61100$,
   $dbt61101$Why does a B-Tree remain 'shallow' even over a table with a million rows?$dbt61101$,
   $dbt61102$["Because it only stores 100 rows total", "Because each node can hold many keys/children, so tree depth grows logarithmically with data size", "Because it stores data in RAM only", "Because it deletes old rows automatically"]$dbt61102$::jsonb,
   1, $dbt61103$High branching factor per node means the tree needs only a few levels (roughly log base branching-factor of n) to index huge amounts of data.$dbt61103$, 1, 1),
  ($dbt61104$tq-dbms-sql-20-b-tree-3$dbt61104$, $dbt61105$pt-dbms-sql-20-b-tree$dbt61105$,
   $dbt61106$What does 'balanced' mean in the context of a B-Tree?$dbt61106$,
   $dbt61107$["Every node has exactly two children", "Every path from root to a leaf has the same length", "The tree never needs to be updated", "Keys are stored in random, not sorted, order"]$dbt61107$::jsonb,
   1, $dbt61108$Balance means uniform depth across all leaves, which the tree maintains via splitting/merging as data changes.$dbt61108$, 1, 2),
  ($dbt61109$tq-dbms-sql-20-b-tree-4$dbt61109$, $dbt61110$pt-dbms-sql-20-b-tree$dbt61110$,
   $dbt61111$Roughly how many levels would a B-Tree need to index 1,000,000 rows if each node holds about 100 keys/children?$dbt61111$,
   $dbt61112$["About 1,000,000", "About 500,000", "About 3", "Exactly 1"]$dbt61112$::jsonb,
   2, $dbt61113$log base 100 of 1,000,000 is about 3 — a wide branching factor keeps the tree very shallow even for large tables.$dbt61113$, 1, 3),
  ($dbt61114$tq-dbms-sql-20-b-tree-5$dbt61114$, $dbt61115$pt-dbms-sql-20-b-tree$dbt61115$,
   $dbt61116$What operation keeps a B-Tree balanced as rows are inserted and it grows too full at a node?$dbt61116$,
   $dbt61117$["Node splitting", "Deleting random rows", "Converting to a hash index", "Sorting the whole table"]$dbt61117$::jsonb,
   0, $dbt61118$When a node exceeds its capacity, it splits into two nodes, propagating a new key upward, which keeps the tree balanced.$dbt61118$, 1, 4),
  ($dbt61119$tq-dbms-sql-20-b-tree-6$dbt61119$, $dbt61120$pt-dbms-sql-20-b-tree$dbt61120$,
   $dbt61121$Why is minimizing node reads (tree depth) especially important for disk-backed database indexes?$dbt61121$,
   $dbt61122$["Because RAM cannot store trees at all", "Because each node read can correspond to a disk I/O operation, and disk I/O is comparatively slow", "Because SQL syntax forbids reading more than 3 nodes", "It isn't important; depth is irrelevant to performance"]$dbt61122$::jsonb,
   1, $dbt61123$Disk I/O is orders of magnitude slower than in-memory comparisons, so a shallow tree that needs few node reads dramatically improves real-world performance.$dbt61123$, 1, 5),
  ($dbt61124$tq-dbms-sql-20-b-tree-7$dbt61124$, $dbt61125$pt-dbms-sql-20-b-tree$dbt61125$,
   $dbt61126$Compared to a plain binary search tree, why is a B-Tree generally better suited to database indexing?$dbt61126$,
   $dbt61127$["A B-Tree cannot be balanced, which simplifies coding", "A B-Tree's high branching factor per node yields a much shallower tree, reducing the number of node accesses needed", "A binary search tree cannot store sorted keys", "A B-Tree stores keys in reverse order"]$dbt61127$::jsonb,
   1, $dbt61128$Wider nodes (many keys/children each) mean fewer levels overall compared to a binary tree, where every node has at most 2 children.$dbt61128$, 1, 6),
  ($dbt61129$tq-dbms-sql-20-b-tree-8$dbt61129$, $dbt61130$pt-dbms-sql-20-b-tree$dbt61130$,
   $dbt61131$What happens to a B-Tree node when too many rows are deleted, leaving it underfull?$dbt61131$,
   $dbt61132$["Nothing; underfull nodes are ignored forever", "It may merge with a sibling node to maintain balance and structure", "The entire tree is rebuilt from scratch on every delete", "The table becomes unqueryable"]$dbt61132$::jsonb,
   1, $dbt61133$Underfull nodes can merge with siblings as part of ongoing rebalancing, which is part of the index maintenance overhead (20.14).$dbt61133$, 1, 7)
on conflict (id) do nothing;

-- 20.3 B Plus Tree
with g as (select id from public.learning_grids where lower(slug) = $dbt61134$dbms-sql-tutorial$dbt61134$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61135$chapter-20-indexes-and-access-paths$dbt61135$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61136$B Plus Tree$dbt61136$, $dbt61137$b-plus-tree$dbt61137$, '', 3, 'published', true, true, $dbt61138$dbms_sql_tutorial$dbt61138$, $dbt61139$chapter-20-indexes-and-access-paths/b-plus-tree$dbt61139$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61140$dbms_sql_tutorial$dbt61140$ and source_ref = $dbt61141$chapter-20-indexes-and-access-paths/b-plus-tree$dbt61141$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61142$B Plus Tree$dbt61142$, $dbt61143$### The variant almost every real index actually uses

While 20.2 described the conceptual B-Tree, most production databases (PostgreSQL's default `btree` index, MySQL's `InnoDB` indexes, SQL Server's clustered/non-clustered indexes) actually implement a refinement called the **B+ Tree**. The name is confusingly similar, but the internal shape differs in one crucial way.

### The key difference: where the data lives

- In a plain B-Tree, data pointers (or the actual row data) can live in **any** node — root, internal, or leaf.
- In a **B+ Tree**, internal nodes (including the root) hold **only keys**, used purely for navigation. **All** actual data pointers/values live exclusively in the **leaf nodes**.

For our `students` table, imagine a B+ Tree index on `gpa`. The internal nodes contain only signpost values like `2.0`, `2.5`, `3.0`, `3.5` to guide the search downward — none of them point to actual student rows. Only when you reach a leaf node do you find an actual `gpa` value paired with a pointer back to the matching row(s) in the table.

### The second key feature: linked leaves

B+ Tree leaf nodes are **linked together in a chain** (typically a doubly linked list), in sorted key order. This is the feature that makes B+ Trees so good at **range queries**.

Consider:

```sql
SELECT * FROM students WHERE gpa BETWEEN 3.0 AND 3.5;
```

With a B+ Tree index on `gpa`, the engine navigates down through internal nodes once to find the leaf containing `3.0`, then simply **walks along the linked leaf chain** — collecting every subsequent key up to `3.5` — without ever needing to re-traverse the tree from the root. This sequential leaf-walk is very cheap.

With a plain B-Tree (where matching data could be scattered across internal and leaf nodes at different depths), satisfying the same range query would require a more complex in-order traversal jumping between different levels of the tree — much less efficient.

### Why this matters practically

- Equality lookups (`WHERE gpa = 3.5`) are still fast in both structures — O(log n) tree descent.
- Range lookups (`BETWEEN`, `>`, `<`, `ORDER BY`) are where the B+ Tree's leaf-chain genuinely shines, which is why it's the near-universal choice for general-purpose database indexes.

### Edge cases

- Because internal nodes hold no data, they can be more compact and fit more keys per node (higher branching factor), which can make the tree even shallower than an equivalent plain B-Tree.
- A key stored in an internal node for navigation is often *duplicated* in a leaf node too — this redundancy is intentional and part of what enables the leaf chain to be self-sufficient for range scans.
- `ORDER BY gpa` can sometimes be satisfied "for free" by simply walking the leaf chain in order, avoiding a separate sort step entirely.

### Interview-style Q&A

**Q: What's the single structural difference that defines a B+ Tree versus a plain B-Tree?**
A: In a B+ Tree, only leaf nodes hold actual data pointers; internal nodes exist purely for navigation via keys, and the leaves are linked together for efficient sequential access.

**Q: Why are B+ Trees especially good for range queries?**
A: Because once the starting leaf is found, the linked leaf chain can simply be walked in sorted order to collect the rest of the range — no repeated tree traversal needed.

**Key takeaway:** B+ Tree = B-Tree navigation (fast equality) + linked, data-only leaves (fast ranges) — which is exactly why it, not the plain B-Tree, is the default index structure in virtually every real database engine.$dbt61143$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61144$dbms_sql_tutorial_seed$dbt61144$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61145$dbms_sql_tutorial_seed$dbt61145$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61146$dbms-sql-tutorial$dbt61146$),
     t as (select id from public.learning_topics where source_kind = $dbt61147$dbms_sql_tutorial$dbt61147$ and source_ref = $dbt61148$chapter-20-indexes-and-access-paths/b-plus-tree$dbt61148$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61149$pt-dbms-sql-20-b-plus-tree$dbt61149$, $dbt61150$B Plus Tree - Quick Test$dbt61150$, 'aptitude', 8, 8,
  $dbt61151$8 questions on B Plus Tree.$dbt61151$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61152$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61152$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61153$tq-dbms-sql-20-b-plus-tree-1$dbt61153$, $dbt61154$pt-dbms-sql-20-b-plus-tree$dbt61154$,
   $dbt61155$What is the defining structural difference between a B+ Tree and a plain B-Tree?$dbt61155$,
   $dbt61156$["A B+ Tree has no root node", "In a B+ Tree, all data pointers live only in leaf nodes, while internal nodes hold keys purely for navigation", "A B+ Tree cannot be balanced", "A B+ Tree stores data in random order"]$dbt61156$::jsonb,
   1, $dbt61157$This is the core distinction: B+ Tree internal nodes are pure navigation aids, while ALL data pointers live in leaves.$dbt61157$, 1, 0),
  ($dbt61158$tq-dbms-sql-20-b-plus-tree-2$dbt61158$, $dbt61159$pt-dbms-sql-20-b-plus-tree$dbt61159$,
   $dbt61160$What additional feature do B+ Tree leaf nodes have that plain B-Tree leaves typically do not?$dbt61160$,
   $dbt61161$["They are compressed using a hash function", "They are linked together in a chain (e.g., a linked list) in sorted order", "They store data out of order", "They are duplicated across every level of the tree"]$dbt61161$::jsonb,
   1, $dbt61162$B+ Tree leaves are linked together, letting the engine walk sequentially across them for range scans.$dbt61162$, 1, 1),
  ($dbt61163$tq-dbms-sql-20-b-plus-tree-3$dbt61163$, $dbt61164$pt-dbms-sql-20-b-plus-tree$dbt61164$,
   $dbt61165$Why is a B+ Tree particularly efficient for a query like `WHERE gpa BETWEEN 3.0 AND 3.5`?$dbt61165$,
   $dbt61166$["Because BETWEEN queries never use indexes", "Because after locating the starting leaf, the engine can walk the linked leaf chain to collect the rest of the range without re-traversing the tree", "Because B+ Trees convert ranges into hash lookups", "Because internal nodes store the full row data for ranges"]$dbt61166$::jsonb,
   1, $dbt61167$The linked leaf chain lets a range scan proceed sequentially once the start point is found, avoiding repeated top-down traversals.$dbt61167$, 1, 2),
  ($dbt61168$tq-dbms-sql-20-b-plus-tree-4$dbt61168$, $dbt61169$pt-dbms-sql-20-b-plus-tree$dbt61169$,
   $dbt61170$In a B+ Tree, what do internal (non-leaf) nodes contain?$dbt61170$,
   $dbt61171$["Only keys used for navigation, no actual data pointers", "The full row data for every record", "A random sample of leaf keys", "Nothing; internal nodes are empty placeholders"]$dbt61171$::jsonb,
   0, $dbt61172$Internal nodes in a B+ Tree hold only navigational keys; actual data pointers are confined to leaves.$dbt61172$, 1, 3),
  ($dbt61173$tq-dbms-sql-20-b-plus-tree-5$dbt61173$, $dbt61174$pt-dbms-sql-20-b-plus-tree$dbt61174$,
   $dbt61175$Which database index structure is more commonly used in practice for general-purpose indexing: plain B-Tree or B+ Tree?$dbt61175$,
   $dbt61176$["Plain B-Tree, because it is simpler", "B+ Tree, because its linked leaves make range scans efficient in addition to fast equality lookups", "Neither; hash indexes are always used instead", "They are used with exactly equal frequency in all engines"]$dbt61176$::jsonb,
   1, $dbt61177$Nearly every mainstream relational database's default index (PostgreSQL btree, MySQL InnoDB, SQL Server) is actually a B+ Tree variant.$dbt61177$, 1, 4),
  ($dbt61178$tq-dbms-sql-20-b-plus-tree-6$dbt61178$, $dbt61179$pt-dbms-sql-20-b-plus-tree$dbt61179$,
   $dbt61180$Why might a B+ Tree end up shallower than an equivalent plain B-Tree over the same data?$dbt61180$,
   $dbt61181$["Because B+ Tree leaves store no data at all", "Because internal nodes hold only keys (no data pointers), so they can be more compact and fit more keys per node, increasing branching factor", "Because B+ Trees are always stored entirely in RAM", "Because B+ Trees skip the balancing step"]$dbt61181$::jsonb,
   1, $dbt61182$Lighter internal nodes (keys only) can pack in more entries per node, which can increase the branching factor and reduce overall depth.$dbt61182$, 1, 5),
  ($dbt61183$tq-dbms-sql-20-b-plus-tree-7$dbt61183$, $dbt61184$pt-dbms-sql-20-b-plus-tree$dbt61184$,
   $dbt61185$A query needs `ORDER BY gpa` with no other filter. How can a B+ Tree index on gpa help?$dbt61185$,
   $dbt61186$["It cannot help with ORDER BY at all", "Walking the linked leaf chain in order can satisfy the sort without a separate sorting step", "It requires converting the index to a hash index first", "ORDER BY always ignores indexes"]$dbt61186$::jsonb,
   1, $dbt61187$Since B+ Tree leaves are linked in sorted key order, an in-order leaf walk directly produces sorted output.$dbt61187$, 1, 6),
  ($dbt61188$tq-dbms-sql-20-b-plus-tree-8$dbt61188$, $dbt61189$pt-dbms-sql-20-b-plus-tree$dbt61189$,
   $dbt61190$True or false: in a B+ Tree, a key value used for navigation in an internal node is often also duplicated in a leaf node.$dbt61190$,
   $dbt61191$["False, keys never repeat across levels", "True, this redundancy is intentional and supports the self-sufficient leaf chain", "False, internal nodes and leaf nodes never share any keys", "True, but only in hash indexes"]$dbt61191$::jsonb,
   1, $dbt61192$It's normal and by design for a signpost key in an internal node to also appear in a leaf, since leaves must independently hold the full sorted data.$dbt61192$, 1, 7)
on conflict (id) do nothing;

-- 20.4 Hash Index
with g as (select id from public.learning_grids where lower(slug) = $dbt61193$dbms-sql-tutorial$dbt61193$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61194$chapter-20-indexes-and-access-paths$dbt61194$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61195$Hash Index$dbt61195$, $dbt61196$hash-index$dbt61196$, '', 4, 'published', true, true, $dbt61197$dbms_sql_tutorial$dbt61197$, $dbt61198$chapter-20-indexes-and-access-paths/hash-index$dbt61198$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61199$dbms_sql_tutorial$dbt61199$ and source_ref = $dbt61200$chapter-20-indexes-and-access-paths/hash-index$dbt61200$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61201$Hash Index$dbt61201$, $dbt61202$### A fundamentally different approach

Unlike B-Tree/B+ Tree indexes (20.2, 20.3), which organize data by sorted key order, a **hash index** takes a completely different approach: it runs the indexed value through a **hash function**, which produces a number that directly identifies a **bucket** (a storage location). The engine stores the row's pointer in that bucket, and to look it up later, it simply re-computes the hash and jumps straight there.

### Example

Suppose `students.email` has a hash index. Looking up:

```sql
SELECT * FROM students WHERE email = 'jane.doe@example.com';
```

The engine computes `hash('jane.doe@example.com')`, gets (say) bucket #4821, jumps directly to that bucket, and finds the pointer to the matching row. There is no tree to descend, no sorted comparisons — just one hash computation and one direct jump. This gives **O(1) average-case lookup** for exact equality matches, which can be even faster than a B+ Tree's O(log n) tree traversal.

### The critical limitation

The catch is significant: a hash function scrambles values into essentially unpredictable bucket numbers. Two values that are "close" to each other (like `3.49` and `3.50`) can hash to completely unrelated, far-apart buckets. This means a hash index **cannot support**:

- Range queries: `WHERE gpa BETWEEN 3.0 AND 3.5`
- Comparison queries: `WHERE gpa > 3.0`
- Sorting: `ORDER BY gpa`
- Prefix/pattern matching: `WHERE name LIKE 'Jo%'`

None of these can be served by a hash index at all, because there is no notion of "nearby" values being stored near each other — only exact equality lookups are supported.

### When to reach for a hash index

A hash index is the right tool specifically when a column is used **only** for exact-match lookups and never for ranges or sorting — for example, indexing an opaque session token, an exact status-code match, or (as above) an exact email lookup, provided the engine's query patterns never need `>` or `ORDER BY` on that column.

### Edge cases

- Many real-world engines (e.g., PostgreSQL) support hash indexes but default to B-Tree/B+ Tree for most columns, precisely because most real query workloads eventually need a range or sort on the same column too.
- Hash collisions (two different values hashing to the same bucket) must be handled internally by the engine (e.g., chaining within a bucket), which can slightly degrade the "average O(1)" guarantee in pathological cases.
- A composite index (20.7) built as a hash index over multiple columns typically only supports equality on **all** the columns together — it generally cannot serve a leftmost-prefix-style partial match the way a composite B+ Tree index can.

### Interview-style Q&A

**Q: Why can't a hash index support `WHERE gpa > 3.0`?**
A: Because the hash function destroys the ordering relationship between values — `3.0` and `3.1` could hash to wildly different, non-adjacent buckets, so there's no way to walk from "greater than 3.0" without scanning everything.

**Q: When would you choose a hash index over a B+ Tree index?**
A: When the column is used strictly for exact-match equality lookups and never needs range queries, comparisons, or sorting — a hash index can then offer faster average-case lookup.

**Key takeaway:** hash indexes trade away all ordering capability for potentially faster exact-match lookups — a narrow but sometimes valuable specialization compared to the general-purpose B+ Tree.$dbt61202$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61203$dbms_sql_tutorial_seed$dbt61203$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61204$dbms_sql_tutorial_seed$dbt61204$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61205$dbms-sql-tutorial$dbt61205$),
     t as (select id from public.learning_topics where source_kind = $dbt61206$dbms_sql_tutorial$dbt61206$ and source_ref = $dbt61207$chapter-20-indexes-and-access-paths/hash-index$dbt61207$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61208$pt-dbms-sql-20-hash-index$dbt61208$, $dbt61209$Hash Index - Quick Test$dbt61209$, 'aptitude', 8, 8,
  $dbt61210$8 questions on Hash Index.$dbt61210$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61211$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61211$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61212$tq-dbms-sql-20-hash-index-1$dbt61212$, $dbt61213$pt-dbms-sql-20-hash-index$dbt61213$,
   $dbt61214$What does a hash index use to determine where a value's pointer is stored?$dbt61214$,
   $dbt61215$["A sorted comparison against other keys", "A hash function that maps the value directly to a bucket/location", "The physical order of the table's rows", "The value's alphabetical position"]$dbt61215$::jsonb,
   1, $dbt61216$A hash function computes a bucket number directly from the value, without any sorted comparisons.$dbt61216$, 1, 0),
  ($dbt61217$tq-dbms-sql-20-hash-index-2$dbt61217$, $dbt61218$pt-dbms-sql-20-hash-index$dbt61218$,
   $dbt61219$What is the average-case lookup complexity of a hash index for an exact equality match?$dbt61219$,
   $dbt61220$["O(n)", "O(log n)", "O(1)", "O(n^2)"]$dbt61220$::jsonb,
   2, $dbt61221$A hash index computes the bucket directly, giving O(1) average-case lookup for equality — better than a B+ Tree's O(log n) in principle.$dbt61221$, 1, 1),
  ($dbt61222$tq-dbms-sql-20-hash-index-3$dbt61222$, $dbt61223$pt-dbms-sql-20-hash-index$dbt61223$,
   $dbt61224$Which of the following queries can a hash index on `gpa` NOT support?$dbt61224$,
   $dbt61225$["WHERE gpa = 3.5", "WHERE gpa BETWEEN 3.0 AND 3.5", "Both A and B cannot be supported", "Only A cannot be supported"]$dbt61225$::jsonb,
   1, $dbt61226$Hash indexes support exact equality (A) but cannot support range queries like BETWEEN (B), since hashing destroys value ordering.$dbt61226$, 1, 2),
  ($dbt61227$tq-dbms-sql-20-hash-index-4$dbt61227$, $dbt61228$pt-dbms-sql-20-hash-index$dbt61228$,
   $dbt61229$Why can't a hash index support `ORDER BY` on the indexed column?$dbt61229$,
   $dbt61230$["ORDER BY is not valid SQL syntax", "The hash function scrambles values so that similar values do not end up stored near each other", "Hash indexes do not allow duplicate values", "Hash indexes are always slower than B+ Trees"]$dbt61230$::jsonb,
   1, $dbt61231$Since hashing intentionally destroys any relationship between nearby values, there's no way to derive sorted order from bucket positions.$dbt61231$, 1, 3),
  ($dbt61232$tq-dbms-sql-20-hash-index-5$dbt61232$, $dbt61233$pt-dbms-sql-20-hash-index$dbt61233$,
   $dbt61234$Which scenario is the best candidate for a hash index?$dbt61234$,
   $dbt61235$["A column frequently queried with ORDER BY", "A column used exclusively for exact-match lookups, like an opaque session token, never for ranges or sorting", "A column used mainly in BETWEEN range filters", "A column that needs to support LIKE 'prefix%' matching"]$dbt61235$::jsonb,
   1, $dbt61236$Hash indexes are best suited to pure equality lookup workloads with no range or sort requirements.$dbt61236$, 1, 4),
  ($dbt61237$tq-dbms-sql-20-hash-index-6$dbt61237$, $dbt61238$pt-dbms-sql-20-hash-index$dbt61238$,
   $dbt61239$What must a hash index's implementation handle when two different values hash to the same bucket?$dbt61239$,
   $dbt61240$["Nothing; this situation is impossible by design", "Hash collisions, typically via chaining within a bucket", "The database automatically drops one of the values", "The table becomes locked permanently"]$dbt61240$::jsonb,
   1, $dbt61241$Collisions are a normal part of hashing and are handled internally (e.g., via chained entries within a bucket).$dbt61241$, 1, 5),
  ($dbt61242$tq-dbms-sql-20-hash-index-7$dbt61242$, $dbt61243$pt-dbms-sql-20-hash-index$dbt61243$,
   $dbt61244$Why do many database engines default to B-Tree/B+ Tree indexes rather than hash indexes for general-purpose columns?$dbt61244$,
   $dbt61245$["Because hash indexes are always slower for equality lookups too", "Because most real query workloads eventually need range queries or sorting on the same column, which hash indexes cannot serve", "Because hash indexes cannot be created at all in most engines", "Because B-Trees use less storage than hash indexes in every case"]$dbt61245$::jsonb,
   1, $dbt61246$General-purpose flexibility (supporting both equality and ranges/sorting) usually outweighs the narrower speed edge a hash index offers for pure equality.$dbt61246$, 1, 6),
  ($dbt61247$tq-dbms-sql-20-hash-index-8$dbt61247$, $dbt61248$pt-dbms-sql-20-hash-index$dbt61248$,
   $dbt61249$A composite hash index is built over (department, gpa). What kind of query can it typically serve?$dbt61249$,
   $dbt61250$["A range query on department alone", "An exact-match query specifying both department and gpa together", "A sort by gpa within each department", "A prefix match on department"]$dbt61250$::jsonb,
   1, $dbt61251$Hash indexes over multiple columns generally only support exact-match equality on the full combination, unlike a composite B+ Tree index's leftmost-prefix support.$dbt61251$, 1, 7)
on conflict (id) do nothing;

-- 20.5 Clustered Index
with g as (select id from public.learning_grids where lower(slug) = $dbt61252$dbms-sql-tutorial$dbt61252$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61253$chapter-20-indexes-and-access-paths$dbt61253$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61254$Clustered Index$dbt61254$, $dbt61255$clustered-index$dbt61255$, '', 5, 'published', true, true, $dbt61256$dbms_sql_tutorial$dbt61256$, $dbt61257$chapter-20-indexes-and-access-paths/clustered-index$dbt61257$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61258$dbms_sql_tutorial$dbt61258$ and source_ref = $dbt61259$chapter-20-indexes-and-access-paths/clustered-index$dbt61259$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61260$Clustered Index$dbt61260$, $dbt61261$### The index that IS the table's physical order

A **clustered index** is special: it determines the **physical storage order** of the table's rows on disk. Rather than being a separate structure that merely points to rows stored elsewhere, the table's data itself is physically arranged according to the clustered index's key.

Imagine `students` has a clustered index on `id`. This means the actual rows are stored on disk sorted by `id` — row with `id=1` physically precedes `id=2`, which precedes `id=3`, and so on. When you query `WHERE id = 500000`, the engine can navigate the B+ Tree structure of the clustered index and land directly on the physical page containing that row's actual data — no extra pointer-following step needed, because the leaf level of a clustered index *is* the table data itself.

### The "at most one" rule

Because a clustered index physically reorders the table's rows, and rows can only be arranged in **one** physical sequence at a time, **a table can have at most one clustered index**. You cannot simultaneously store `students` physically sorted by both `id` and by `gpa` — you have to pick one ordering (or none, leaving the table as an unordered "heap").

In practice, the primary key is very often chosen as the clustered index, since primary-key lookups and joins are extremely common and benefit the most from this direct, no-extra-step access.

### Why it's fast

Because the clustered index's leaves store the actual row data (not just a pointer to it), a lookup or range scan via the clustered key touches only the index structure — there's no second "hop" to a separate row storage location. This makes clustered-index range scans (e.g., `WHERE id BETWEEN 1000 AND 2000`) especially efficient, since the matching rows are also physically adjacent on disk.

### Edge cases

- If a table has no explicit clustered index, most engines still store rows in some physical order — often insertion order in an unordered "heap," or automatically clustered by a hidden row identifier (behavior varies by engine, e.g., MySQL's InnoDB clusters by primary key by default, while some engines default to a heap).
- Choosing a clustered key that changes frequently (like a `gpa` that gets updated often) is problematic, since updating the key can require physically moving the row to maintain sort order — an expensive operation. A stable, rarely-changing key (like an auto-incrementing `id`) is a much better clustered-index choice.
- Inserting rows with non-sequential clustered-key values (e.g., random UUIDs as a clustered primary key) can cause frequent, expensive page reordering — a well-known real-world performance pitfall.

### Interview-style Q&A

**Q: Why can a table have only one clustered index?**
A: Because the clustered index defines the physical row order on disk, and rows can physically exist in only one order at a time.

**Q: Why is a rarely-changing key a better choice for a clustered index than a frequently-updated one?**
A: Because updating a clustered key value can force the engine to physically relocate the row to preserve sort order — an expensive operation compared to updating a non-key column.

**Key takeaway:** a clustered index isn't a separate lookup structure pointing elsewhere — it IS the table's row storage, arranged in key order, which is why there can only ever be one per table.$dbt61261$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61262$dbms_sql_tutorial_seed$dbt61262$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61263$dbms_sql_tutorial_seed$dbt61263$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61264$dbms-sql-tutorial$dbt61264$),
     t as (select id from public.learning_topics where source_kind = $dbt61265$dbms_sql_tutorial$dbt61265$ and source_ref = $dbt61266$chapter-20-indexes-and-access-paths/clustered-index$dbt61266$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61267$pt-dbms-sql-20-clustered-index$dbt61267$, $dbt61268$Clustered Index - Quick Test$dbt61268$, 'aptitude', 8, 8,
  $dbt61269$8 questions on Clustered Index.$dbt61269$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61270$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61270$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61271$tq-dbms-sql-20-clustered-index-1$dbt61271$, $dbt61272$pt-dbms-sql-20-clustered-index$dbt61272$,
   $dbt61273$What does a clustered index determine that a non-clustered index does not?$dbt61273$,
   $dbt61274$["The number of columns a table can have", "The physical storage order of the table's rows on disk", "Whether NULL values are allowed", "The table's primary key name"]$dbt61274$::jsonb,
   1, $dbt61275$A clustered index physically arranges the table's rows in key order; it is not a separate pointer structure.$dbt61275$, 1, 0),
  ($dbt61276$tq-dbms-sql-20-clustered-index-2$dbt61276$, $dbt61277$pt-dbms-sql-20-clustered-index$dbt61277$,
   $dbt61278$How many clustered indexes can a single table have?$dbt61278$,
   $dbt61279$["Unlimited", "Exactly two", "At most one", "Exactly zero, always"]$dbt61279$::jsonb,
   2, $dbt61280$Since a clustered index defines physical row order, and rows can only be arranged one way at a time, a table can have at most one.$dbt61280$, 1, 1),
  ($dbt61281$tq-dbms-sql-20-clustered-index-3$dbt61281$, $dbt61282$pt-dbms-sql-20-clustered-index$dbt61282$,
   $dbt61283$Why is the primary key often chosen as a table's clustered index?$dbt61283$,
   $dbt61284$["Because primary keys cannot be indexed any other way", "Because primary-key lookups and joins are extremely common and benefit most from direct, no-extra-hop access to row data", "Because clustered indexes are required by the SQL standard to be on the primary key", "Because it reduces the table to zero rows"]$dbt61284$::jsonb,
   1, $dbt61285$Given how frequently primary keys are used for lookups and joins, clustering on them maximizes the benefit of avoiding an extra pointer-following step.$dbt61285$, 1, 2),
  ($dbt61286$tq-dbms-sql-20-clustered-index-4$dbt61286$, $dbt61287$pt-dbms-sql-20-clustered-index$dbt61287$,
   $dbt61288$Why is updating a clustered-index key value potentially expensive?$dbt61288$,
   $dbt61289$["It is never expensive; clustered keys can't be updated", "It may require physically relocating the row on disk to maintain sorted order", "It always deletes the row permanently", "It automatically creates a new non-clustered index"]$dbt61289$::jsonb,
   1, $dbt61290$Since row order reflects the clustered key, changing that key can force the engine to physically move the row to keep the table sorted.$dbt61290$, 1, 3),
  ($dbt61291$tq-dbms-sql-20-clustered-index-5$dbt61291$, $dbt61292$pt-dbms-sql-20-clustered-index$dbt61292$,
   $dbt61293$In a clustered index's B+ Tree structure, what do the leaf nodes contain?$dbt61293$,
   $dbt61294$["Pointers to a separate location where row data lives", "The actual row data itself", "Only column names", "Nothing; leaves are empty in a clustered index"]$dbt61294$::jsonb,
   1, $dbt61295$Unlike a non-clustered index, a clustered index's leaves ARE the actual table rows, not pointers to them elsewhere.$dbt61295$, 1, 4),
  ($dbt61296$tq-dbms-sql-20-clustered-index-6$dbt61296$, $dbt61297$pt-dbms-sql-20-clustered-index$dbt61297$,
   $dbt61298$Why might using a random UUID as a clustered primary key cause performance problems?$dbt61298$,
   $dbt61299$["UUIDs cannot be stored in a database", "Random insert order relative to sort order can cause frequent, expensive page reordering", "UUIDs are always duplicated", "It removes the need for any index at all"]$dbt61299$::jsonb,
   1, $dbt61300$Since a clustered index enforces physical sort order, inserting non-sequential keys scattered across the sorted range causes costly page splits/reordering.$dbt61300$, 1, 5),
  ($dbt61301$tq-dbms-sql-20-clustered-index-7$dbt61301$, $dbt61302$pt-dbms-sql-20-clustered-index$dbt61302$,
   $dbt61303$What happens to a table's physical row order if it has NO clustered index defined?$dbt61303$,
   $dbt61304$["The table cannot store any rows", "Rows are typically stored in an unordered heap or some engine-specific default order", "Rows are automatically sorted alphabetically by every column", "The table becomes read-only"]$dbt61304$::jsonb,
   1, $dbt61305$Without a clustered index, many engines store rows in an unordered heap (behavior varies by engine/default configuration).$dbt61305$, 1, 6),
  ($dbt61306$tq-dbms-sql-20-clustered-index-8$dbt61306$, $dbt61307$pt-dbms-sql-20-clustered-index$dbt61307$,
   $dbt61308$Which query benefits most directly from a clustered index on `id` when scanning a contiguous range?$dbt61308$,
   $dbt61309$["WHERE department = 'CS'", "WHERE id BETWEEN 1000 AND 2000, since matching rows are also physically adjacent on disk", "WHERE gpa > 3.5, unrelated to id", "SELECT COUNT(*) FROM students with no WHERE clause"]$dbt61309$::jsonb,
   1, $dbt61310$Because clustered-index order matches physical disk order, a range scan on the clustered key reads physically adjacent, contiguous data.$dbt61310$, 1, 7)
on conflict (id) do nothing;

-- 20.6 Non Clustered Index
with g as (select id from public.learning_grids where lower(slug) = $dbt61311$dbms-sql-tutorial$dbt61311$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61312$chapter-20-indexes-and-access-paths$dbt61312$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61313$Non Clustered Index$dbt61313$, $dbt61314$non-clustered-index$dbt61314$, '', 6, 'published', true, true, $dbt61315$dbms_sql_tutorial$dbt61315$, $dbt61316$chapter-20-indexes-and-access-paths/non-clustered-index$dbt61316$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61317$dbms_sql_tutorial$dbt61317$ and source_ref = $dbt61318$chapter-20-indexes-and-access-paths/non-clustered-index$dbt61318$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61319$Non Clustered Index$dbt61319$, $dbt61320$### A separate structure pointing back to the real data

A **non-clustered index** is a distinct data structure, separate from the table's actual physical row storage. It holds the indexed column's values (sorted, typically as a B+ Tree) plus, for each value, a **pointer/reference** back to where the actual full row lives — either in the clustered index (if one exists) or in the raw heap storage (if the table has no clustered index).

Imagine `students` is clustered on `id`, and you add a non-clustered index on `department`. The non-clustered index is a separate B+ Tree whose leaves hold `department` values in sorted order, each paired with a reference back to the corresponding row's location (often the clustered key value, e.g., `id`).

### The lookup has an extra "hop"

Consider:

```sql
SELECT * FROM students WHERE department = 'Computer Science';
```

The engine first searches the non-clustered index's B+ Tree to find matching `department` entries — this gives it a list of pointers (e.g., `id` values). It then must take a **second step**: using each pointer, it looks up the actual row (via the clustered index, or heap location) to retrieve the other columns (`name`, `gpa`, `email`). This two-step process (index lookup, then row lookup) is often called a "bookmark lookup" or "key lookup," and it's inherently one extra hop compared to a clustered index's single-step access.

### Why you'd want many of them

Since a table can have only **one** clustered index (20.5), but real applications query on many different columns, non-clustered indexes fill that gap: **a table can have many non-clustered indexes** — one on `department`, another on `gpa`, another on `email`, etc. — each optimized for a different query pattern, without touching the table's physical storage order.

### Edge cases

- If the extra "hop" to fetch full row data is expensive (e.g., a query needs many columns not in the index), a **covering index** (20.8) can eliminate that second step entirely by including all needed columns directly in the non-clustered index itself.
- Every non-clustered index adds its own write overhead (20.14) — a table with 10 non-clustered indexes means every INSERT must update 10 separate structures in addition to the table itself.
- On a heap table (no clustered index at all), the non-clustered index's pointer is typically a direct physical row identifier rather than a clustered key — the exact mechanism is engine-specific.

### Interview-style Q&A

**Q: What's the key structural difference between a clustered and a non-clustered index?**
A: A clustered index physically IS the row-ordered table data; a non-clustered index is a separate structure that stores indexed values plus a pointer back to the actual row stored elsewhere.

**Q: Why can a table have many non-clustered indexes but only one clustered index?**
A: Because non-clustered indexes are independent side structures that don't affect physical row order, so you can build as many as you want; the clustered index dictates the one-and-only physical row order.

**Key takeaway:** a non-clustered index trades one extra lookup "hop" (from index entry to actual row) for the flexibility of supporting many different query patterns on the same table simultaneously.$dbt61320$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61321$dbms_sql_tutorial_seed$dbt61321$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61322$dbms_sql_tutorial_seed$dbt61322$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61323$dbms-sql-tutorial$dbt61323$),
     t as (select id from public.learning_topics where source_kind = $dbt61324$dbms_sql_tutorial$dbt61324$ and source_ref = $dbt61325$chapter-20-indexes-and-access-paths/non-clustered-index$dbt61325$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61326$pt-dbms-sql-20-non-clustered-index$dbt61326$, $dbt61327$Non Clustered Index - Quick Test$dbt61327$, 'aptitude', 8, 8,
  $dbt61328$8 questions on Non Clustered Index.$dbt61328$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61329$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61329$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61330$tq-dbms-sql-20-non-clustered-index-1$dbt61330$, $dbt61331$pt-dbms-sql-20-non-clustered-index$dbt61331$,
   $dbt61332$What does a non-clustered index's leaf entry actually contain?$dbt61332$,
   $dbt61333$["The complete row data for every column", "The indexed value plus a pointer/reference back to the actual row stored elsewhere", "Nothing; it is an empty placeholder", "A duplicate of the clustered index"]$dbt61333$::jsonb,
   1, $dbt61334$Unlike a clustered index, a non-clustered index's leaves hold the indexed value and a pointer back to where the full row actually lives.$dbt61334$, 1, 0),
  ($dbt61335$tq-dbms-sql-20-non-clustered-index-2$dbt61335$, $dbt61336$pt-dbms-sql-20-non-clustered-index$dbt61336$,
   $dbt61337$How many non-clustered indexes can a single table have?$dbt61337$,
   $dbt61338$["At most one, same as a clustered index", "Zero only", "Many \u2014 there is no 'one per table' restriction like there is for clustered indexes", "Exactly the same number as columns in the table, no more no less"]$dbt61338$::jsonb,
   2, $dbt61339$Because non-clustered indexes are separate structures that don't dictate physical row order, a table can have many of them.$dbt61339$, 1, 1),
  ($dbt61340$tq-dbms-sql-20-non-clustered-index-3$dbt61340$, $dbt61341$pt-dbms-sql-20-non-clustered-index$dbt61341$,
   $dbt61342$Why does looking up a row via a non-clustered index typically require an extra step compared to a clustered index?$dbt61342$,
   $dbt61343$["It doesn't; both are equally direct", "Because the non-clustered index only gives a pointer, requiring a second lookup to fetch the actual row from wherever it's stored", "Because non-clustered indexes are always unsorted", "Because non-clustered indexes cannot use B+ Trees"]$dbt61343$::jsonb,
   1, $dbt61344$The non-clustered index search yields a pointer, and a second 'bookmark lookup' step is needed to retrieve the actual row.$dbt61344$, 1, 2),
  ($dbt61345$tq-dbms-sql-20-non-clustered-index-4$dbt61345$, $dbt61346$pt-dbms-sql-20-non-clustered-index$dbt61346$,
   $dbt61347$What is this extra step (finding the pointer, then fetching the actual row) commonly called?$dbt61347$,
   $dbt61348$["A hash collision", "A bookmark lookup (or key lookup)", "A table scan", "A page split"]$dbt61348$::jsonb,
   1, $dbt61349$This two-step access pattern is commonly referred to as a bookmark or key lookup.$dbt61349$, 1, 3),
  ($dbt61350$tq-dbms-sql-20-non-clustered-index-5$dbt61350$, $dbt61351$pt-dbms-sql-20-non-clustered-index$dbt61351$,
   $dbt61352$If `students` is clustered on `id` and has a non-clustered index on `department`, what does the non-clustered index's pointer typically reference?$dbt61352$,
   $dbt61353$["Nothing; it stores full rows directly", "The clustered key value (e.g., the id), used to then find the full row via the clustered index", "A random row in the table", "Another non-clustered index"]$dbt61353$::jsonb,
   1, $dbt61354$On a clustered table, non-clustered index entries typically point via the clustered key, which is then used to locate the actual row.$dbt61354$, 1, 4),
  ($dbt61355$tq-dbms-sql-20-non-clustered-index-6$dbt61355$, $dbt61356$pt-dbms-sql-20-non-clustered-index$dbt61356$,
   $dbt61357$Why might a table have non-clustered indexes on department, gpa, AND email simultaneously?$dbt61357$,
   $dbt61358$["Because only one index total is allowed per table", "Because each non-clustered index optimizes a different query pattern without affecting the single physical row order", "Because non-clustered indexes replace the need for a table entirely", "Because SQL requires every column to be indexed"]$dbt61358$::jsonb,
   1, $dbt61359$Multiple non-clustered indexes let different queries each get fast lookups on their respective filter columns, all independent of physical storage order.$dbt61359$, 1, 5),
  ($dbt61360$tq-dbms-sql-20-non-clustered-index-7$dbt61360$, $dbt61361$pt-dbms-sql-20-non-clustered-index$dbt61361$,
   $dbt61362$What is a real cost of adding many non-clustered indexes to a table?$dbt61362$,
   $dbt61363$["The table can no longer be read from", "Every INSERT/UPDATE/DELETE must update every additional non-clustered index, increasing write overhead", "Non-clustered indexes make the clustered index disappear", "Reads become slower with more non-clustered indexes"]$dbt61363$::jsonb,
   1, $dbt61364$Each non-clustered index is a separate structure that must be maintained on every write, compounding write overhead as more are added.$dbt61364$, 1, 6),
  ($dbt61365$tq-dbms-sql-20-non-clustered-index-8$dbt61365$, $dbt61366$pt-dbms-sql-20-non-clustered-index$dbt61366$,
   $dbt61367$How can the extra 'bookmark lookup' hop of a non-clustered index be avoided for a specific query?$dbt61367$,
   $dbt61368$["It cannot ever be avoided", "By using a covering index that includes all columns the query needs, directly in the index itself", "By deleting the clustered index", "By converting the non-clustered index into a hash index"]$dbt61368$::jsonb,
   1, $dbt61369$A covering index (20.8) includes every column the query needs so the engine never has to hop back to the actual row.$dbt61369$, 1, 7)
on conflict (id) do nothing;

-- 20.7 Composite Index
with g as (select id from public.learning_grids where lower(slug) = $dbt61370$dbms-sql-tutorial$dbt61370$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61371$chapter-20-indexes-and-access-paths$dbt61371$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61372$Composite Index$dbt61372$, $dbt61373$composite-index$dbt61373$, '', 7, 'published', true, true, $dbt61374$dbms_sql_tutorial$dbt61374$, $dbt61375$chapter-20-indexes-and-access-paths/composite-index$dbt61375$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61376$dbms_sql_tutorial$dbt61376$ and source_ref = $dbt61377$chapter-20-indexes-and-access-paths/composite-index$dbt61377$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61378$Composite Index$dbt61378$, $dbt61379$### An index on more than one column

A **composite index** (also called a multi-column or compound index) indexes **multiple columns together** as a single structure, rather than indexing each column separately. For example:

```sql
CREATE INDEX idx_dept_gpa ON students (department, gpa);
```

This builds a single B+ Tree where entries are sorted **first by `department`, then by `gpa` within each department**. Conceptually, it's like a phone book sorted by last name, then first name within each last name — not two separate indexes, but one combined ordering.

### Column order is everything: the leftmost-prefix rule

This is the single most important fact about composite indexes: **the order the columns are declared in matters critically**. An index on `(department, gpa)` is sorted by department first. That means:

- `WHERE department = 'CS'` — **can** use this index efficiently (it's a prefix of the indexed columns).
- `WHERE department = 'CS' AND gpa > 3.5` — **can** use this index efficiently (both columns, in order).
- `WHERE gpa > 3.5` (alone, no department filter) — **generally cannot** efficiently use this index, because the index is sorted by department first; without knowing the department, GPA values for different departments are scattered throughout the structure, not grouped together.

This is known as the **leftmost-prefix rule**: a composite index on `(A, B, C)` can serve queries filtering on `A`, or `(A, B)`, or `(A, B, C)`, but generally cannot efficiently serve a query filtering on `B` alone, or `C` alone, or `(B, C)` without `A`.

### Why order matters conceptually

Think of the phone-book analogy again: sorted by (last name, first name), you can easily find "everyone with last name Smith," or "Smith, John" specifically. But finding "everyone whose first name is John," regardless of last name, requires scanning the *entire* book, because first names are not grouped together independently of last name.

### Edge cases

- If your application always filters by `department` alone, or by `department` AND `gpa` together, but never by `gpa` alone, then `(department, gpa)` is the right column order. If you sometimes need `gpa` alone, you may need a **separate** index on `gpa`, or reconsider the order.
- A composite index can also satisfy `ORDER BY department, gpa` for free (no extra sort step), because the leaf entries are already in that exact order.
- Composite indexes are a common way to build a **covering index** (20.8) — by adding extra "included" columns beyond the filter columns.

### Interview-style Q&A

**Q: What is the leftmost-prefix rule?**
A: A composite index on columns (A, B, C) can efficiently serve queries filtering on A, or A+B, or A+B+C, but generally not B alone, C alone, or B+C without A — because the index is physically sorted starting with A.

**Q: Why can't `(department, gpa)` efficiently serve `WHERE gpa > 3.5` alone?**
A: Because the index is sorted by department first — gpa values are only sorted *within* each department group, so gpa values across different departments are scattered, not contiguous.

**Key takeaway:** composite index column order should match how your queries actually filter — put the most commonly filtered-alone (or leftmost-used) column first.$dbt61379$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61380$dbms_sql_tutorial_seed$dbt61380$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61381$dbms_sql_tutorial_seed$dbt61381$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61382$dbms-sql-tutorial$dbt61382$),
     t as (select id from public.learning_topics where source_kind = $dbt61383$dbms_sql_tutorial$dbt61383$ and source_ref = $dbt61384$chapter-20-indexes-and-access-paths/composite-index$dbt61384$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61385$pt-dbms-sql-20-composite-index$dbt61385$, $dbt61386$Composite Index - Quick Test$dbt61386$, 'aptitude', 8, 8,
  $dbt61387$8 questions on Composite Index.$dbt61387$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61388$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61388$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61389$tq-dbms-sql-20-composite-index-1$dbt61389$, $dbt61390$pt-dbms-sql-20-composite-index$dbt61390$,
   $dbt61391$In a composite index on (department, gpa), which column determines the primary sort order?$dbt61391$,
   $dbt61392$["gpa, always sorted first", "department, since it is listed first", "Whichever column has more distinct values", "Neither; both are sorted independently"]$dbt61392$::jsonb,
   1, $dbt61393$Composite index entries are sorted by the first declared column, then by the second within groups of the first.$dbt61393$, 1, 0),
  ($dbt61394$tq-dbms-sql-20-composite-index-2$dbt61394$, $dbt61395$pt-dbms-sql-20-composite-index$dbt61395$,
   $dbt61396$What is the 'leftmost-prefix rule' for composite indexes?$dbt61396$,
   $dbt61397$["Only the rightmost column in the index can be used in a WHERE clause", "A composite index on (A, B, C) can efficiently serve queries on A, or A+B, or A+B+C, but generally not B alone or C alone", "Composite indexes can only have exactly 2 columns", "All columns in a composite index must be used together, always"]$dbt61397$::jsonb,
   1, $dbt61398$The leftmost-prefix rule states that usable query patterns must start from the leftmost column(s) of the index in order.$dbt61398$, 1, 1),
  ($dbt61399$tq-dbms-sql-20-composite-index-3$dbt61399$, $dbt61400$pt-dbms-sql-20-composite-index$dbt61400$,
   $dbt61401$Given an index on (department, gpa), which query can efficiently use this index?$dbt61401$,
   $dbt61402$["WHERE gpa > 3.5 (alone)", "WHERE department = 'CS' AND gpa > 3.5", "WHERE email = 'x@example.com'", "WHERE name LIKE '%Doe%'"]$dbt61402$::jsonb,
   1, $dbt61403$This query filters on department first, then gpa — matching the leftmost-prefix order of the composite index.$dbt61403$, 1, 2),
  ($dbt61404$tq-dbms-sql-20-composite-index-4$dbt61404$, $dbt61405$pt-dbms-sql-20-composite-index$dbt61405$,
   $dbt61406$Why does an index on (department, gpa) generally NOT help a query filtering on gpa alone?$dbt61406$,
   $dbt61407$["Because gpa is a floating point number", "Because the index is sorted by department first, so gpa values are only sorted within each department group, not across the whole table", "Because composite indexes never store gpa values", "Because gpa cannot be indexed under any circumstances"]$dbt61407$::jsonb,
   1, $dbt61408$Without knowing the department, matching gpa values are scattered across many department groups rather than contiguous.$dbt61408$, 1, 3),
  ($dbt61409$tq-dbms-sql-20-composite-index-5$dbt61409$, $dbt61410$pt-dbms-sql-20-composite-index$dbt61410$,
   $dbt61411$What analogy best explains the leftmost-prefix behavior of composite indexes?$dbt61411$,
   $dbt61412$["A dictionary sorted randomly", "A phone book sorted by last name then first name \u2014 easy to find by last name, but finding by first name alone requires scanning the whole book", "A single-column list sorted numerically", "A hash table with no ordering at all"]$dbt61412$::jsonb,
   1, $dbt61413$This classic analogy captures why leading-column filters are efficient but trailing-column-only filters are not.$dbt61413$, 1, 4),
  ($dbt61414$tq-dbms-sql-20-composite-index-6$dbt61414$, $dbt61415$pt-dbms-sql-20-composite-index$dbt61415$,
   $dbt61416$Can a composite index on (department, gpa) help satisfy `ORDER BY department, gpa` without an extra sort step?$dbt61416$,
   $dbt61417$["No, composite indexes never help with sorting", "Yes, because the index's leaf entries are already physically ordered exactly that way", "Only if a separate index also exists on gpa alone", "Only for tables smaller than 1000 rows"]$dbt61417$::jsonb,
   1, $dbt61418$Since the index already stores entries sorted by (department, gpa), that exact ORDER BY can be satisfied directly from the index order.$dbt61418$, 1, 5),
  ($dbt61419$tq-dbms-sql-20-composite-index-7$dbt61419$, $dbt61420$pt-dbms-sql-20-composite-index$dbt61420$,
   $dbt61421$An application frequently filters by gpa alone but rarely by department alone or together. What's the implication for index design?$dbt61421$,
   $dbt61422$["An index on (department, gpa) is still the best choice regardless of query patterns", "A separate index with gpa as the leading column (or gpa alone) would better match this query pattern", "Composite indexes cannot ever include gpa", "No index is needed since gpa is a decimal"]$dbt61422$::jsonb,
   1, $dbt61423$Column order should reflect actual query filter patterns; if gpa-alone filtering dominates, gpa should lead (or have its own index).$dbt61423$, 1, 6),
  ($dbt61424$tq-dbms-sql-20-composite-index-8$dbt61424$, $dbt61425$pt-dbms-sql-20-composite-index$dbt61425$,
   $dbt61426$Which of these is a legitimate reason to add extra 'included' columns to a composite index beyond the filter columns?$dbt61426$,
   $dbt61427$["To make the index unusable for any query", "To turn the composite index into a covering index that can answer a query without a separate row lookup", "To force the table to become a heap", "To remove the leftmost-prefix restriction entirely"]$dbt61427$::jsonb,
   1, $dbt61428$Adding needed output columns to an index (beyond the filter columns) is exactly how a covering index (20.8) is built.$dbt61428$, 1, 7)
on conflict (id) do nothing;

-- 20.8 Covering Index
with g as (select id from public.learning_grids where lower(slug) = $dbt61429$dbms-sql-tutorial$dbt61429$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61430$chapter-20-indexes-and-access-paths$dbt61430$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61431$Covering Index$dbt61431$, $dbt61432$covering-index$dbt61432$, '', 8, 'published', true, true, $dbt61433$dbms_sql_tutorial$dbt61433$, $dbt61434$chapter-20-indexes-and-access-paths/covering-index$dbt61434$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61435$dbms_sql_tutorial$dbt61435$ and source_ref = $dbt61436$chapter-20-indexes-and-access-paths/covering-index$dbt61436$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61437$Covering Index$dbt61437$, $dbt61438$### An index that answers the whole query by itself

A **covering index** is a composite/multi-column index that happens to include **every column a specific query needs** — both the columns used for filtering AND the columns being selected/returned. When this is true, the database engine can answer the entire query directly from the index structure itself, **without ever touching the actual table rows**.

### A concrete example

Suppose you frequently run:

```sql
SELECT id, department FROM students WHERE department = 'CS';
```

If you create:

```sql
CREATE INDEX idx_dept_covering ON students (department, id);
```

This index contains both `department` (the filter column) and `id` (the selected column). When this query runs, the engine finds the matching `department = 'CS'` entries in the index — and since `id` is *also* sitting right there in the same index leaf, it can return the result **directly from the index**, skipping the "bookmark lookup" back to the actual table row entirely (recall 20.6's extra hop for non-clustered indexes).

This is sometimes described as an "index-only scan" — the engine literally never touches the table's heap/clustered storage for this query.

### Why this is a real performance win

Without covering, a non-clustered index lookup requires: (1) search the index for matching keys, then (2) for *each* match, hop back to the actual row to fetch any additional needed columns. That second step means extra I/O — potentially one additional page read per matching row. A covering index eliminates step (2) entirely for that specific query shape, which can be a dramatic speedup, especially when many rows match.

### It's query-specific, not universal

A covering index only "covers" queries whose exact combination of filtered and selected columns are all present in the index. The same table might need `SELECT *` elsewhere, which a narrow covering index (with only 2-3 columns) obviously cannot satisfy — that query would still need the full row.

### Edge cases

- Adding many columns to make an index "cover" more queries increases the index's size and write-maintenance cost (20.14) — covering is a targeted optimization for known, important, frequently-run query shapes, not something to apply indiscriminately.
- Some engines support explicitly "included" (non-key) columns in an index — columns stored in the index for covering purposes but not used for sorting/filtering, which can be more storage-efficient than making them full key columns.
- If even one selected or filtered column is missing from the index, the engine falls back to the bookmark-lookup approach (or a full scan) for that query — covering is all-or-nothing per query.

### Interview-style Q&A

**Q: What makes an index a "covering index" for a given query?**
A: The index contains every column that query filters on AND every column it selects/returns, so the engine can answer entirely from the index without touching the table's row storage.

**Q: What specific overhead does a covering index eliminate?**
A: The extra "bookmark lookup" hop back from a non-clustered index entry to the actual table row, which a covering index makes unnecessary since all needed data is already in the index.

**Key takeaway:** a covering index is a targeted trade — bigger index (more columns) in exchange for eliminating an entire step of I/O for a specific, important query pattern.$dbt61438$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61439$dbms_sql_tutorial_seed$dbt61439$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61440$dbms_sql_tutorial_seed$dbt61440$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61441$dbms-sql-tutorial$dbt61441$),
     t as (select id from public.learning_topics where source_kind = $dbt61442$dbms_sql_tutorial$dbt61442$ and source_ref = $dbt61443$chapter-20-indexes-and-access-paths/covering-index$dbt61443$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61444$pt-dbms-sql-20-covering-index$dbt61444$, $dbt61445$Covering Index - Quick Test$dbt61445$, 'aptitude', 8, 8,
  $dbt61446$8 questions on Covering Index.$dbt61446$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61447$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61447$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61448$tq-dbms-sql-20-covering-index-1$dbt61448$, $dbt61449$pt-dbms-sql-20-covering-index$dbt61449$,
   $dbt61450$What defines a covering index for a specific query?$dbt61450$,
   $dbt61451$["Any index on the primary key", "An index that contains every column the query filters on AND every column it selects, so the query can be answered entirely from the index", "An index that spans the entire table's storage", "A hash index used for exact matches only"]$dbt61451$::jsonb,
   1, $dbt61452$A covering index must include all filter and output columns for that particular query so the engine never needs the actual row.$dbt61452$, 1, 0),
  ($dbt61453$tq-dbms-sql-20-covering-index-2$dbt61453$, $dbt61454$pt-dbms-sql-20-covering-index$dbt61454$,
   $dbt61455$What is the performance benefit of a covering index compared to a regular non-clustered index for a matching query?$dbt61455$,
   $dbt61456$["It removes the need for a WHERE clause", "It eliminates the extra bookmark lookup back to the actual table row, since all needed data is in the index", "It converts the table into a hash table", "It automatically doubles storage space with no benefit"]$dbt61456$::jsonb,
   1, $dbt61457$Since all needed columns are present in the index, the engine can skip the second lookup step (fetching the row) entirely.$dbt61457$, 1, 1),
  ($dbt61458$tq-dbms-sql-20-covering-index-3$dbt61458$, $dbt61459$pt-dbms-sql-20-covering-index$dbt61459$,
   $dbt61460$What is this scenario, where a query is answered purely from an index without touching the table, commonly called?$dbt61460$,
   $dbt61461$["A full table scan", "An index-only scan", "A hash collision", "A clustered rebuild"]$dbt61461$::jsonb,
   1, $dbt61462$When the engine can satisfy a query entirely from the index without visiting the base table, it's called an index-only scan.$dbt61462$, 1, 2),
  ($dbt61463$tq-dbms-sql-20-covering-index-4$dbt61463$, $dbt61464$pt-dbms-sql-20-covering-index$dbt61464$,
   $dbt61465$Given index (department, id) and query `SELECT id, department FROM students WHERE department = 'CS'`, why is this index covering for this query?$dbt61465$,
   $dbt61466$["Because it includes gpa and email too", "Because both the filter column (department) and the selected column (id) are present in the index", "Because the index is a hash index", "Because it is the table's clustered index"]$dbt61466$::jsonb,
   1, $dbt61467$Since department (filter) and id (select) are both in the index, the query never needs to visit the actual row.$dbt61467$, 1, 3),
  ($dbt61468$tq-dbms-sql-20-covering-index-5$dbt61468$, $dbt61469$pt-dbms-sql-20-covering-index$dbt61469$,
   $dbt61470$Would the same index (department, id) be covering for `SELECT * FROM students WHERE department = 'CS'`?$dbt61470$,
   $dbt61471$["Yes, because department is in the index", "No, because SELECT * needs columns like gpa, name, email that aren't in this index", "Yes, because id is the primary key", "No index can ever cover a SELECT * query"]$dbt61471$::jsonb,
   1, $dbt61472$Covering is query-specific: since SELECT * needs all columns and this index only has department and id, it cannot cover this broader query.$dbt61472$, 1, 4),
  ($dbt61473$tq-dbms-sql-20-covering-index-6$dbt61473$, $dbt61474$pt-dbms-sql-20-covering-index$dbt61474$,
   $dbt61475$What is a real cost of designing an index specifically to cover more query shapes?$dbt61475$,
   $dbt61476$["No cost; covering indexes are always free", "The index grows larger (more columns) and incurs more write-maintenance overhead", "It disables the primary key", "It forces the table to lose its clustered index"]$dbt61476$::jsonb,
   1, $dbt61477$Adding more columns to an index for covering purposes increases its storage footprint and the cost of maintaining it on writes.$dbt61477$, 1, 5),
  ($dbt61478$tq-dbms-sql-20-covering-index-7$dbt61478$, $dbt61479$pt-dbms-sql-20-covering-index$dbt61479$,
   $dbt61480$What happens if a query needs one column that is NOT present in an otherwise-matching covering index?$dbt61480$,
   $dbt61481$["The query fails with an error", "The engine falls back to a bookmark lookup (or full scan) to fetch the missing column from the actual row", "The missing column is silently returned as NULL", "The index is automatically expanded on the fly"]$dbt61481$::jsonb,
   1, $dbt61482$Covering is all-or-nothing per query — if even one needed column is missing, the engine must go back to the row (or scan) to get it.$dbt61482$, 1, 6),
  ($dbt61483$tq-dbms-sql-20-covering-index-8$dbt61483$, $dbt61484$pt-dbms-sql-20-covering-index$dbt61484$,
   $dbt61485$What feature do some engines offer to add columns to an index purely for covering, without making them part of the sort key?$dbt61485$,
   $dbt61486$["Partial indexes", "Included (non-key) columns", "Hash buckets", "Composite primary keys"]$dbt61486$::jsonb,
   1, $dbt61487$Some engines let you attach extra 'included' columns to an index for covering purposes without affecting the index's sort/key structure.$dbt61487$, 1, 7)
on conflict (id) do nothing;

-- 20.9 Unique Index
with g as (select id from public.learning_grids where lower(slug) = $dbt61488$dbms-sql-tutorial$dbt61488$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61489$chapter-20-indexes-and-access-paths$dbt61489$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61490$Unique Index$dbt61490$, $dbt61491$unique-index$dbt61491$, '', 9, 'published', true, true, $dbt61492$dbms_sql_tutorial$dbt61492$, $dbt61493$chapter-20-indexes-and-access-paths/unique-index$dbt61493$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61494$dbms_sql_tutorial$dbt61494$ and source_ref = $dbt61495$chapter-20-indexes-and-access-paths/unique-index$dbt61495$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61496$Unique Index$dbt61496$, $dbt61497$### Two jobs in one structure

A **unique index** does double duty: it **enforces uniqueness** on the indexed column(s) — no two rows may share the same value — while *also* functioning as a regular index, speeding up lookups on that column exactly like any other index would.

```sql
CREATE UNIQUE INDEX idx_email_unique ON students (email);
```

This guarantees no two students can share the same email address (attempting to `INSERT` or `UPDATE` a duplicate raises a constraint violation), while simultaneously making `WHERE email = '...'` lookups fast, since the underlying structure is typically a B+ Tree just like a regular index.

### The connection to constraints you already know

You may recall the `UNIQUE` constraint from an earlier chapter on constraints (Chapter 10). In most database engines, declaring a column `UNIQUE` — or declaring it a `PRIMARY KEY` — **automatically creates a unique index behind the scenes** to enforce that guarantee efficiently. The engine needs *some* fast way to check "does this value already exist?" on every insert/update, and a unique index is exactly the mechanism used to make that check efficient rather than requiring a full table scan on every write.

So `PRIMARY KEY` and `UNIQUE` aren't really separate from indexing — they are, in effect, a request for the engine to build and maintain a unique index automatically.

### Why enforcing uniqueness via an index (not just application logic) matters

If uniqueness were only checked in application code (e.g., "check no student has this email before inserting"), a race condition between two simultaneous inserts could still let two duplicate rows slip through. A unique index enforces the constraint at the database level, atomically, closing that race condition — the database itself refuses the second conflicting write, no matter what the application code did or didn't check.

### Composite unique indexes

A unique index can also span multiple columns, e.g., `UNIQUE (department, id)` would allow the same `id` to repeat across different departments but not within the same department — the uniqueness guarantee applies to the **combination** of columns, not each column individually.

### Edge cases

- Most engines allow **multiple** `NULL` values in a unique-indexed column even though every non-NULL value must be distinct — because `NULL` is treated as "unknown," and two unknowns are not considered "equal" to each other (behavior can vary slightly by engine).
- A unique index still incurs the same write-overhead trade-off as any other index (20.14) — every insert/update must check the structure for a duplicate before proceeding.
- Declaring `UNIQUE` on a column that already has significant duplicate data will fail to create the index (or the constraint) until the duplicates are resolved.

### Interview-style Q&A

**Q: What are the two things a unique index does simultaneously?**
A: It enforces that no two rows share the same value (or combination of values) in the indexed column(s), and it also functions as a normal index for fast lookups.

**Q: What's the relationship between a PRIMARY KEY/UNIQUE constraint and a unique index?**
A: Declaring a column PRIMARY KEY or UNIQUE typically causes the engine to automatically create a unique index behind the scenes to enforce and efficiently check that constraint.

**Key takeaway:** a unique index is not a separate concept from the UNIQUE/PRIMARY KEY constraints you already know — it's the actual mechanism the engine uses to enforce and efficiently check them.$dbt61497$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61498$dbms_sql_tutorial_seed$dbt61498$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61499$dbms_sql_tutorial_seed$dbt61499$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61500$dbms-sql-tutorial$dbt61500$),
     t as (select id from public.learning_topics where source_kind = $dbt61501$dbms_sql_tutorial$dbt61501$ and source_ref = $dbt61502$chapter-20-indexes-and-access-paths/unique-index$dbt61502$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61503$pt-dbms-sql-20-unique-index$dbt61503$, $dbt61504$Unique Index - Quick Test$dbt61504$, 'aptitude', 8, 8,
  $dbt61505$8 questions on Unique Index.$dbt61505$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61506$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61506$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61507$tq-dbms-sql-20-unique-index-1$dbt61507$, $dbt61508$pt-dbms-sql-20-unique-index$dbt61508$,
   $dbt61509$What two things does a unique index do at the same time?$dbt61509$,
   $dbt61510$["It compresses the table and encrypts data", "It enforces that indexed values are not duplicated AND functions as a regular index for fast lookups", "It deletes duplicate rows automatically", "It converts the table into a hash table only"]$dbt61510$::jsonb,
   1, $dbt61511$A unique index both enforces the uniqueness constraint and serves as a normal, fast-lookup index simultaneously.$dbt61511$, 1, 0),
  ($dbt61512$tq-dbms-sql-20-unique-index-2$dbt61512$, $dbt61513$pt-dbms-sql-20-unique-index$dbt61513$,
   $dbt61514$When you declare a column as PRIMARY KEY, what typically happens behind the scenes in most engines?$dbt61514$,
   $dbt61515$["Nothing extra happens; no index is created", "The engine automatically creates a unique index to enforce and efficiently check the primary key constraint", "The engine converts the table into a view", "The column becomes unindexable"]$dbt61515$::jsonb,
   1, $dbt61516$PRIMARY KEY (and UNIQUE) constraints are typically implemented via an automatically created unique index.$dbt61516$, 1, 1),
  ($dbt61517$tq-dbms-sql-20-unique-index-3$dbt61517$, $dbt61518$pt-dbms-sql-20-unique-index$dbt61518$,
   $dbt61519$Why is enforcing uniqueness via a database-level unique index better than only checking it in application code?$dbt61519$,
   $dbt61520$["Application-level checks are always faster", "A unique index atomically prevents race conditions where two simultaneous inserts could otherwise both succeed with duplicate values", "Unique indexes remove the need for a primary key", "Application code cannot check for duplicates at all"]$dbt61520$::jsonb,
   1, $dbt61521$Database-enforced uniqueness closes the race-condition window that application-only checks are vulnerable to under concurrent writes.$dbt61521$, 1, 2),
  ($dbt61522$tq-dbms-sql-20-unique-index-4$dbt61522$, $dbt61523$pt-dbms-sql-20-unique-index$dbt61523$,
   $dbt61524$What does UNIQUE (department, id) actually guarantee?$dbt61524$,
   $dbt61525$["Every id value must be globally unique across the whole table regardless of department", "The same id can repeat across different departments, but not more than once within the same department", "department values must all be unique", "Nothing; composite unique constraints are not supported"]$dbt61525$::jsonb,
   1, $dbt61526$A composite unique constraint applies to the combination of columns together, not to each column independently.$dbt61526$, 1, 3),
  ($dbt61527$tq-dbms-sql-20-unique-index-5$dbt61527$, $dbt61528$pt-dbms-sql-20-unique-index$dbt61528$,
   $dbt61529$In most engines, how many NULL values are typically allowed in a column with a unique index?$dbt61529$,
   $dbt61530$["Zero; NULL is treated as a duplicate value", "Multiple NULLs are usually allowed, since NULL represents 'unknown' and unknowns aren't considered equal to each other", "Exactly one NULL is allowed", "Unique indexes reject NULL entirely and the column becomes NOT NULL automatically"]$dbt61530$::jsonb,
   1, $dbt61531$Most engines allow multiple NULLs in a unique index because NULL is not considered equal to another NULL for uniqueness purposes.$dbt61531$, 1, 4),
  ($dbt61532$tq-dbms-sql-20-unique-index-6$dbt61532$, $dbt61533$pt-dbms-sql-20-unique-index$dbt61533$,
   $dbt61534$What underlying structure does a unique index typically use, similar to a regular index?$dbt61534$,
   $dbt61535$["A B+ Tree", "A flat unsorted array only", "Plain text files", "A view"]$dbt61535$::jsonb,
   0, $dbt61536$A unique index is typically implemented as a B+ Tree (or similar ordered structure), just like a regular index, with an added uniqueness check.$dbt61536$, 1, 5),
  ($dbt61537$tq-dbms-sql-20-unique-index-7$dbt61537$, $dbt61538$pt-dbms-sql-20-unique-index$dbt61538$,
   $dbt61539$What happens if you try to declare UNIQUE on a column that already contains duplicate values?$dbt61539$,
   $dbt61540$["The duplicates are silently deleted", "The constraint/index creation fails until the duplicates are resolved", "The database ignores the UNIQUE keyword", "All future inserts on that column are blocked forever"]$dbt61540$::jsonb,
   1, $dbt61541$A unique index cannot be created over data that already violates the uniqueness rule; existing duplicates must be resolved first.$dbt61541$, 1, 6),
  ($dbt61542$tq-dbms-sql-20-unique-index-8$dbt61542$, $dbt61543$pt-dbms-sql-20-unique-index$dbt61543$,
   $dbt61544$Does a unique index add any write overhead compared to a non-unique index?$dbt61544$,
   $dbt61545$["No, unique indexes have zero overhead", "Yes, similar overhead to any index, since every insert/update must be checked against the structure for a duplicate before proceeding", "Unique indexes make writes faster than no index at all with no downside", "Unique indexes eliminate the need to update the index on writes"]$dbt61545$::jsonb,
   1, $dbt61546$Like any index, a unique index must be maintained and checked on every relevant write, contributing to overall write overhead (20.14).$dbt61546$, 1, 7)
on conflict (id) do nothing;

-- 20.10 Partial Index Concept
with g as (select id from public.learning_grids where lower(slug) = $dbt61547$dbms-sql-tutorial$dbt61547$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61548$chapter-20-indexes-and-access-paths$dbt61548$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61549$Partial Index Concept$dbt61549$, $dbt61550$partial-index-concept$dbt61550$, '', 10, 'published', true, true, $dbt61551$dbms_sql_tutorial$dbt61551$, $dbt61552$chapter-20-indexes-and-access-paths/partial-index-concept$dbt61552$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61553$dbms_sql_tutorial$dbt61553$ and source_ref = $dbt61554$chapter-20-indexes-and-access-paths/partial-index-concept$dbt61554$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61555$Partial Index Concept$dbt61555$, $dbt61556$### An index over only some of the rows

A **partial index** (sometimes called a "filtered index") is an index that covers only a **subset** of a table's rows — those matching a specified condition — rather than every row in the table.

```sql
CREATE INDEX idx_active_students ON students (department) WHERE gpa >= 2.0;
```

Suppose in our 1,000,000-row `students` table, 950,000 students have `gpa >= 2.0` ("in good standing") and 50,000 do not. If the application very frequently runs queries like:

```sql
SELECT * FROM students WHERE department = 'CS' AND gpa >= 2.0;
```

...a partial index built with the `WHERE gpa >= 2.0` condition only ever needs to store entries for the 950,000 qualifying rows relevant to that condition — wait, actually the *more valuable* scenario is the reverse: if only a **small** subset of rows commonly matter (e.g., `WHERE status = 'pending'` on a mostly-`'completed'` orders table), the partial index would be tiny and fast compared to indexing the entire table.

### Why smaller can be better

A partial index restricted to a condition that only a fraction of rows satisfy is:

- **Smaller** — less disk space, since only qualifying rows have entries.
- **Faster to scan** — fewer entries to search through even in the index itself.
- **Cheaper to maintain** — writes to rows that *don't* match the partial condition never touch this index at all, reducing write overhead (20.14) compared to a full index on the same column.

This makes partial indexes ideal when queries consistently filter on the same subset — e.g., "active" records, "pending" orders, non-deleted rows in a soft-delete scheme — rather than needing the whole table indexed.

### Not universally supported

Dialect support varies significantly:

- **PostgreSQL**: full native support via the `WHERE` clause on `CREATE INDEX`.
- **SQL Server**: supports a similar concept called "filtered indexes."
- **MySQL**: as of most versions, has **no native support** for partial/filtered indexes — this is a real, practical dialect gap developers must work around (e.g., using generated/virtual columns or restructuring the schema).

### Edge cases

- A query must match the partial index's condition (or a subset of it) for the optimizer to even consider using it — `WHERE gpa >= 2.0` doesn't help a query filtering `WHERE gpa < 2.0`, since none of the required rows are in the index at all.
- Partial indexes are commonly used to enforce a uniqueness rule over only "active" rows in soft-delete schemes (e.g., `UNIQUE (email) WHERE deleted_at IS NULL`), which combines the ideas from 20.9 and 20.10.
- If application query patterns shift and the filtered condition no longer matches common queries, the partial index quietly becomes useless without any error — it just stops being chosen by the optimizer.

### Interview-style Q&A

**Q: What is a partial index, and why would you use one?**
A: It's an index built over only the rows matching a specific condition, useful when queries consistently filter to that same subset — it's smaller, faster to scan, and cheaper to maintain than indexing the whole table.

**Q: Does every SQL dialect support partial indexes?**
A: No — PostgreSQL and SQL Server support the concept (partial/filtered indexes), but MySQL has no native equivalent.

**Key takeaway:** a partial index narrows the "index everything" trade-off down to just the rows that matter for a known, consistent query pattern.$dbt61556$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61557$dbms_sql_tutorial_seed$dbt61557$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61558$dbms_sql_tutorial_seed$dbt61558$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61559$dbms-sql-tutorial$dbt61559$),
     t as (select id from public.learning_topics where source_kind = $dbt61560$dbms_sql_tutorial$dbt61560$ and source_ref = $dbt61561$chapter-20-indexes-and-access-paths/partial-index-concept$dbt61561$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61562$pt-dbms-sql-20-partial-index-concept$dbt61562$, $dbt61563$Partial Index Concept - Quick Test$dbt61563$, 'aptitude', 8, 8,
  $dbt61564$8 questions on Partial Index Concept.$dbt61564$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61565$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61565$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61566$tq-dbms-sql-20-partial-index-concept-1$dbt61566$, $dbt61567$pt-dbms-sql-20-partial-index-concept$dbt61567$,
   $dbt61568$What is a partial index?$dbt61568$,
   $dbt61569$["An index that only stores half of each row's data", "An index that covers only a subset of a table's rows matching a specified condition", "An index that is deleted automatically after a week", "An index that can only be built on numeric columns"]$dbt61569$::jsonb,
   1, $dbt61570$A partial (filtered) index restricts its entries to rows that satisfy a WHERE condition, rather than covering the entire table.$dbt61570$, 1, 0),
  ($dbt61571$tq-dbms-sql-20-partial-index-concept-2$dbt61571$, $dbt61572$pt-dbms-sql-20-partial-index-concept$dbt61572$,
   $dbt61573$Which SQL dialect has NO native support for partial/filtered indexes?$dbt61573$,
   $dbt61574$["PostgreSQL", "SQL Server", "MySQL", "All of the above lack support"]$dbt61574$::jsonb,
   2, $dbt61575$MySQL has no native partial/filtered index feature, unlike PostgreSQL (WHERE clause on CREATE INDEX) and SQL Server (filtered indexes).$dbt61575$, 1, 1),
  ($dbt61576$tq-dbms-sql-20-partial-index-concept-3$dbt61576$, $dbt61577$pt-dbms-sql-20-partial-index-concept$dbt61577$,
   $dbt61578$What is the main benefit of a partial index over a full index on the same column?$dbt61578$,
   $dbt61579$["It always covers more rows than a full index", "It is smaller, faster to scan, and cheaper to maintain since it only stores entries for qualifying rows", "It removes the need for a WHERE clause in queries", "It automatically becomes a clustered index"]$dbt61579$::jsonb,
   1, $dbt61580$By covering only a targeted subset, a partial index reduces size, scan cost, and write-maintenance overhead compared to a full index.$dbt61580$, 1, 2),
  ($dbt61581$tq-dbms-sql-20-partial-index-concept-4$dbt61581$, $dbt61582$pt-dbms-sql-20-partial-index-concept$dbt61582$,
   $dbt61583$A partial index is built with `WHERE status = 'pending'`. Can it help a query filtering `WHERE status = 'completed'`?$dbt61583$,
   $dbt61584$["Yes, partial indexes cover all possible values regardless of condition", "No, since 'completed' rows were never included in this partial index", "Yes, but only for status values starting with 'p'", "It depends only on the table's clustered index"]$dbt61584$::jsonb,
   1, $dbt61585$A partial index only contains entries for rows matching its defining condition; rows outside that condition simply aren't indexed at all.$dbt61585$, 1, 3),
  ($dbt61586$tq-dbms-sql-20-partial-index-concept-5$dbt61586$, $dbt61587$pt-dbms-sql-20-partial-index-concept$dbt61587$,
   $dbt61588$What is a common real-world use case for combining a partial index with a uniqueness rule?$dbt61588$,
   $dbt61589$["Enforcing global uniqueness across every row in the table, always", "Enforcing uniqueness only among 'active' (non-soft-deleted) rows, e.g., UNIQUE(email) WHERE deleted_at IS NULL", "Preventing any INSERT statements from ever running", "Making every column in the table NOT NULL"]$dbt61589$::jsonb,
   1, $dbt61590$A very common pattern is a partial unique index that enforces uniqueness only among active rows, allowing reused values among soft-deleted rows.$dbt61590$, 1, 4),
  ($dbt61591$tq-dbms-sql-20-partial-index-concept-6$dbt61591$, $dbt61592$pt-dbms-sql-20-partial-index-concept$dbt61592$,
   $dbt61593$Why does a partial index reduce write overhead compared to a full index on the same column?$dbt61593$,
   $dbt61594$["It doesn't; write overhead is identical to a full index", "Writes to rows that don't match the partial index's condition never touch that index at all", "Partial indexes disable all writes to the table", "Partial indexes are read-only and cannot be written to"]$dbt61594$::jsonb,
   1, $dbt61595$Only rows satisfying the partial condition are tracked by the index, so non-matching row writes skip updating it entirely.$dbt61595$, 1, 5),
  ($dbt61596$tq-dbms-sql-20-partial-index-concept-7$dbt61596$, $dbt61597$pt-dbms-sql-20-partial-index-concept$dbt61597$,
   $dbt61598$What happens if application query patterns shift so that the partial index's condition no longer matches common queries?$dbt61598$,
   $dbt61599$["The database throws a fatal error", "The partial index quietly stops being useful/chosen by the optimizer, without any error", "The partial index automatically updates its own condition", "All queries against the table stop working"]$dbt61599$::jsonb,
   1, $dbt61600$A partial index simply becomes irrelevant to new query patterns silently; there's no automatic detection or alert for this.$dbt61600$, 1, 6),
  ($dbt61601$tq-dbms-sql-20-partial-index-concept-8$dbt61601$, $dbt61602$pt-dbms-sql-20-partial-index-concept$dbt61602$,
   $dbt61603$In PostgreSQL, how is a partial index typically defined?$dbt61603$,
   $dbt61604$["Using a WHERE clause appended to CREATE INDEX", "Using a special PARTIAL keyword before INDEX", "By creating two separate tables", "Partial indexes cannot be defined via SQL syntax at all"]$dbt61604$::jsonb,
   0, $dbt61605$PostgreSQL supports partial indexes natively via a WHERE clause at the end of the CREATE INDEX statement.$dbt61605$, 1, 7)
on conflict (id) do nothing;

-- 20.11 Function Based Index Concept
with g as (select id from public.learning_grids where lower(slug) = $dbt61606$dbms-sql-tutorial$dbt61606$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61607$chapter-20-indexes-and-access-paths$dbt61607$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61608$Function Based Index Concept$dbt61608$, $dbt61609$function-based-index-concept$dbt61609$, '', 11, 'published', true, true, $dbt61610$dbms_sql_tutorial$dbt61610$, $dbt61611$chapter-20-indexes-and-access-paths/function-based-index-concept$dbt61611$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61612$dbms_sql_tutorial$dbt61612$ and source_ref = $dbt61613$chapter-20-indexes-and-access-paths/function-based-index-concept$dbt61613$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61614$Function Based Index Concept$dbt61614$, $dbt61615$### Indexing a computed expression, not the raw column

A **function-based index** (also called an "expression index") is built on the **result of applying a function or expression** to a column, rather than on the raw column value itself.

```sql
CREATE INDEX idx_email_lower ON students (LOWER(email));
```

### Why you'd need this

Suppose your application does case-insensitive email lookups:

```sql
SELECT * FROM students WHERE LOWER(email) = 'jane.doe@example.com';
```

Even if a perfectly good regular index exists on the raw `email` column, this query **cannot use it**. Why? Because a regular index on `email` is sorted by the *raw stored values* of `email` (e.g., `Jane.Doe@Example.com`), not by their lowercased forms. The optimizer has no way to know that `LOWER(email) = 'jane.doe@example.com'` corresponds to any particular position in an index sorted by raw, mixed-case values — so it falls back to a full table scan, checking `LOWER(email)` against every single row.

A function-based index solves this directly: it builds the index on the **already-computed** `LOWER(email)` values. Now the index is sorted by lowercased email, and the query's `LOWER(email) = '...'` filter matches the index's actual stored (function-applied) values exactly — allowing a fast index lookup instead of a full scan.

### The general principle

Any time a query consistently wraps an indexed column in a function or expression in its `WHERE` clause — `UPPER(name)`, `YEAR(created_at)`, `price * quantity`, `SUBSTRING(code, 1, 3)` — a regular index on the raw column **cannot help**, because the stored, sorted index values don't match what the query is actually comparing against. A function-based index on that exact expression bridges the gap.

### Edge cases

- The expression in the query must match the expression used to build the index **exactly** (or in a way the optimizer can recognize as equivalent) — `WHERE LOWER(email) = ...` will use an index on `LOWER(email)`, but `WHERE UPPER(email) = ...` will not, since it's a different expression.
- Not every dialect supports this identically — PostgreSQL supports arbitrary expression indexes; MySQL (from version 8.0+) supports "functional key parts"; older MySQL versions required a workaround using a generated/virtual column plus a regular index on that column.
- Function-based indexes carry the same write overhead as any index — the function must be re-evaluated and the index updated on every relevant write, which can add computational (not just I/O) cost if the function is expensive.

### Interview-style Q&A

**Q: Why can't a regular index on `email` serve a query filtering on `LOWER(email)`?**
A: Because the regular index is sorted by the raw, unmodified email values, while the query is comparing against a *computed* lowercase form — the sort orders don't align, so the optimizer can't use the index for that comparison.

**Q: What's the general rule for when you need a function-based index?**
A: Whenever a query consistently applies the same function/expression to a column in its filter condition, and you want that filter to use an index rather than fall back to a full scan.

**Key takeaway:** an index is only useful if it's sorted the way the query actually compares values — a function-based index re-aligns the index's sort order with the query's real comparison expression.$dbt61615$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61616$dbms_sql_tutorial_seed$dbt61616$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61617$dbms_sql_tutorial_seed$dbt61617$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61618$dbms-sql-tutorial$dbt61618$),
     t as (select id from public.learning_topics where source_kind = $dbt61619$dbms_sql_tutorial$dbt61619$ and source_ref = $dbt61620$chapter-20-indexes-and-access-paths/function-based-index-concept$dbt61620$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61621$pt-dbms-sql-20-function-based-index-concept$dbt61621$, $dbt61622$Function Based Index Concept - Quick Test$dbt61622$, 'aptitude', 8, 8,
  $dbt61623$8 questions on Function Based Index Concept.$dbt61623$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61624$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61624$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61625$tq-dbms-sql-20-function-based-index-concept-1$dbt61625$, $dbt61626$pt-dbms-sql-20-function-based-index-concept$dbt61626$,
   $dbt61627$What does a function-based (expression) index actually index?$dbt61627$,
   $dbt61628$["The raw, unmodified column value only", "The result of applying a function or expression to a column", "A randomly selected sample of rows", "The table's row count"]$dbt61628$::jsonb,
   1, $dbt61629$A function-based index stores entries sorted by the computed result of an expression, not the raw underlying column value.$dbt61629$, 1, 0),
  ($dbt61630$tq-dbms-sql-20-function-based-index-concept-2$dbt61630$, $dbt61631$pt-dbms-sql-20-function-based-index-concept$dbt61631$,
   $dbt61632$Why can't a regular index on `email` serve a query filtering `WHERE LOWER(email) = 'x'`?$dbt61632$,
   $dbt61633$["Because LOWER() is not valid SQL", "Because the regular index is sorted by raw email values, which don't align with the lowercased comparison the query is making", "Because email columns cannot be indexed at all", "Because LOWER() always returns NULL"]$dbt61633$::jsonb,
   1, $dbt61634$The index's sort order (raw values) doesn't correspond to the computed values (lowercased) the query is actually comparing, so it can't be used.$dbt61634$, 1, 1),
  ($dbt61635$tq-dbms-sql-20-function-based-index-concept-3$dbt61635$, $dbt61636$pt-dbms-sql-20-function-based-index-concept$dbt61636$,
   $dbt61637$What is the correct way to make `WHERE LOWER(email) = 'x'` use an index?$dbt61637$,
   $dbt61638$["Create a regular index on the raw email column", "Create a function-based index on LOWER(email)", "Remove the email column from the table", "Convert the table to use a hash index automatically"]$dbt61638$::jsonb,
   1, $dbt61639$A function-based index built directly on LOWER(email) aligns the index's stored values with what the query is comparing, enabling index use.$dbt61639$, 1, 2),
  ($dbt61640$tq-dbms-sql-20-function-based-index-concept-4$dbt61640$, $dbt61641$pt-dbms-sql-20-function-based-index-concept$dbt61641$,
   $dbt61642$If a function-based index is built on LOWER(email), can a query filtering on UPPER(email) use it?$dbt61642$,
   $dbt61643$["Yes, LOWER and UPPER are treated as equivalent by all engines", "Generally no, since UPPER(email) is a different expression than LOWER(email)", "Yes, but only for numeric columns", "It depends solely on the table's primary key"]$dbt61643$::jsonb,
   1, $dbt61644$The query's expression must match (or be recognized as equivalent to) the indexed expression; UPPER and LOWER are different functions.$dbt61644$, 1, 3),
  ($dbt61645$tq-dbms-sql-20-function-based-index-concept-5$dbt61645$, $dbt61646$pt-dbms-sql-20-function-based-index-concept$dbt61646$,
   $dbt61647$Which of these WHERE clauses would benefit from a function-based index, assuming it's run frequently?$dbt61647$,
   $dbt61648$["WHERE id = 5", "WHERE YEAR(created_at) = 2024", "WHERE gpa BETWEEN 3.0 AND 4.0", "WHERE department = 'CS'"]$dbt61648$::jsonb,
   1, $dbt61649$YEAR(created_at) applies a function to a column in the filter, which a regular index on created_at cannot serve — a function-based index on YEAR(created_at) would help.$dbt61649$, 1, 4),
  ($dbt61650$tq-dbms-sql-20-function-based-index-concept-6$dbt61650$, $dbt61651$pt-dbms-sql-20-function-based-index-concept$dbt61651$,
   $dbt61652$How did older versions of MySQL (before 8.0) typically work around the lack of native function-based indexes?$dbt61652$,
   $dbt61653$["They didn't support any workaround at all", "Using a generated/virtual column storing the expression's result, plus a regular index on that generated column", "By disabling all WHERE clauses", "By converting all tables to NoSQL"]$dbt61653$::jsonb,
   1, $dbt61654$A common pre-8.0 MySQL workaround was adding a generated column for the expression and indexing that column normally.$dbt61654$, 1, 5),
  ($dbt61655$tq-dbms-sql-20-function-based-index-concept-7$dbt61655$, $dbt61656$pt-dbms-sql-20-function-based-index-concept$dbt61656$,
   $dbt61657$What is a cost specific to function-based indexes beyond the usual index write overhead?$dbt61657$,
   $dbt61658$["None; they have zero additional cost", "The function must be computed on every relevant write, which can add computational cost if the function is expensive", "They can never be dropped once created", "They automatically disable all other indexes on the table"]$dbt61658$::jsonb,
   1, $dbt61659$Because the index tracks a computed expression, the function must be re-evaluated on every write that touches the underlying column(s), adding compute cost beyond typical index maintenance.$dbt61659$, 1, 6),
  ($dbt61660$tq-dbms-sql-20-function-based-index-concept-8$dbt61660$, $dbt61661$pt-dbms-sql-20-function-based-index-concept$dbt61661$,
   $dbt61662$Does PostgreSQL support arbitrary expression indexes?$dbt61662$,
   $dbt61663$["No, PostgreSQL has no support for this feature at all", "Yes, PostgreSQL supports indexing arbitrary expressions directly", "Only for expressions involving dates", "Only in a special NoSQL mode"]$dbt61663$::jsonb,
   1, $dbt61664$PostgreSQL has robust native support for building indexes on arbitrary expressions, not just plain columns.$dbt61664$, 1, 7)
on conflict (id) do nothing;

-- 20.12 Selectivity
with g as (select id from public.learning_grids where lower(slug) = $dbt61665$dbms-sql-tutorial$dbt61665$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61666$chapter-20-indexes-and-access-paths$dbt61666$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61667$Selectivity$dbt61667$, $dbt61668$selectivity$dbt61668$, '', 12, 'published', true, true, $dbt61669$dbms_sql_tutorial$dbt61669$, $dbt61670$chapter-20-indexes-and-access-paths/selectivity$dbt61670$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61671$dbms_sql_tutorial$dbt61671$ and source_ref = $dbt61672$chapter-20-indexes-and-access-paths/selectivity$dbt61672$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61673$Selectivity$dbt61673$, $dbt61674$### How well a column narrows down the search

**Selectivity** measures the fraction of rows that a given indexed value distinguishes — in other words, how effectively filtering on that column narrows down the result set. It is typically expressed as:

```
selectivity = number of distinct values / total number of rows
```

A selectivity close to **1** (high selectivity) means most values are unique or nearly unique — filtering on that column narrows the search down to very few rows. A selectivity close to **0** (low selectivity) means there are only a handful of distinct values shared by many rows — filtering on that column barely narrows anything down.

### Concrete example

In our 1,000,000-row `students` table:

- `email`: essentially every student has a unique email → close to 1,000,000 distinct values → selectivity ≈ 1,000,000 / 1,000,000 = **1.0** — **very high selectivity**. An index on `email` is excellent, since `WHERE email = '...'` narrows the search from a million rows down to essentially one.
- `is_active` (a boolean flag): only 2 possible values (`true`/`false`) → selectivity ≈ 2 / 1,000,000 = **0.000002** — **extremely low selectivity**. An index on `is_active` barely helps: `WHERE is_active = true` might still match 700,000 rows out of 1,000,000 — the index would need to return most of the table anyway, so the engine may as well just scan the table directly.
- `department` (say, 20 possible departments): selectivity ≈ 20 / 1,000,000 = **0.00002** — still low, though each department's ~50,000 rows is a real improvement over scanning all 1,000,000; not as dramatic as `email` but potentially still useful depending on the query.

### Why this matters for index design

A high-selectivity column is an excellent index candidate: the index does real work, narrowing a huge table down to a tiny handful of matching rows. A low-selectivity column makes a poor index candidate, because even after using the index, the engine still has to retrieve (and likely bookmark-lookup, 20.6) a large fraction of the table — at that point, a plain full table scan can actually be *cheaper* than the index-plus-many-lookups approach, since sequential scanning avoids the scattered random-access I/O pattern of following many index pointers.

### Edge cases

- Selectivity can vary across a **skewed** distribution: a `department` column might have 19 departments with ~1,000 students each and one department ("Computer Science") with 800,000 — the *overall* selectivity number can be misleading, since filtering to the huge department is low-value even though filtering to a small one is very high-value. Real query optimizers use more detailed statistics (histograms) beyond a single selectivity ratio to handle this.
- Selectivity is directly related to (and often computed from) **cardinality** (20.13, the next topic) — selectivity = cardinality / total rows.
- A composite index's effective selectivity is evaluated across the combination of its leading columns, not each column in isolation.

### Interview-style Q&A

**Q: What does high selectivity mean, and why is it good for indexing?**
A: High selectivity means a value narrows the result set down to very few matching rows (close to unique) — it's good because the index actually does meaningful work reducing the search space.

**Q: Why is a boolean flag column a poor index candidate?**
A: Because it only has 2 distinct values, so filtering on it still leaves a huge fraction of the table matching — the index barely narrows anything down, giving low selectivity.

**Key takeaway:** selectivity quantifies "how much does filtering on this column actually help" — the higher, the more valuable an index on that column is.$dbt61674$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61675$dbms_sql_tutorial_seed$dbt61675$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61676$dbms_sql_tutorial_seed$dbt61676$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61677$dbms-sql-tutorial$dbt61677$),
     t as (select id from public.learning_topics where source_kind = $dbt61678$dbms_sql_tutorial$dbt61678$ and source_ref = $dbt61679$chapter-20-indexes-and-access-paths/selectivity$dbt61679$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61680$pt-dbms-sql-20-selectivity$dbt61680$, $dbt61681$Selectivity - Quick Test$dbt61681$, 'aptitude', 8, 8,
  $dbt61682$8 questions on Selectivity.$dbt61682$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61683$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61683$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61684$tq-dbms-sql-20-selectivity-1$dbt61684$, $dbt61685$pt-dbms-sql-20-selectivity$dbt61685$,
   $dbt61686$How is selectivity typically calculated?$dbt61686$,
   $dbt61687$["Total number of rows divided by number of distinct values", "Number of distinct values divided by total number of rows", "Number of indexes divided by number of tables", "Number of columns divided by number of rows"]$dbt61687$::jsonb,
   1, $dbt61688$Selectivity = distinct values / total rows — a ratio describing how much a value narrows down the search.$dbt61688$, 1, 0),
  ($dbt61689$tq-dbms-sql-20-selectivity-2$dbt61689$, $dbt61690$pt-dbms-sql-20-selectivity$dbt61690$,
   $dbt61691$Which column in the 1,000,000-row students table has the HIGHEST selectivity?$dbt61691$,
   $dbt61692$["is_active (boolean, 2 values)", "department (20 distinct values)", "email (nearly all unique values)", "A constant column with only 1 possible value"]$dbt61692$::jsonb,
   2, $dbt61693$email, being nearly unique per row, has selectivity close to 1.0 — the highest among these options.$dbt61693$, 1, 1),
  ($dbt61694$tq-dbms-sql-20-selectivity-3$dbt61694$, $dbt61695$pt-dbms-sql-20-selectivity$dbt61695$,
   $dbt61696$Why is a boolean column like is_active generally a poor index candidate?$dbt61696$,
   $dbt61697$["Booleans cannot be stored in indexes", "It has only 2 distinct values, so filtering on it still leaves a large fraction of rows matching, providing low selectivity", "Boolean indexes are always corrupted", "Booleans require a hash index specifically"]$dbt61697$::jsonb,
   1, $dbt61698$With only 2 possible values, an index on a boolean rarely narrows the search meaningfully — low selectivity.$dbt61698$, 1, 2),
  ($dbt61699$tq-dbms-sql-20-selectivity-4$dbt61699$, $dbt61700$pt-dbms-sql-20-selectivity$dbt61700$,
   $dbt61701$In a scenario where a WHERE clause on an indexed column still matches 70% of the table's rows, what is the likely consequence?$dbt61701$,
   $dbt61702$["The index will always be dramatically faster than a full scan", "A full table scan may actually be cheaper, since the index-plus-lookups approach would still touch most of the table via scattered I/O", "The query will fail to execute", "The column's data type is invalid for indexing"]$dbt61702$::jsonb,
   1, $dbt61703$When selectivity is low and most rows match, following many index pointers (random I/O) can be more expensive than a straightforward sequential full scan.$dbt61703$, 1, 3),
  ($dbt61704$tq-dbms-sql-20-selectivity-5$dbt61704$, $dbt61705$pt-dbms-sql-20-selectivity$dbt61705$,
   $dbt61706$What does it mean if a column has selectivity close to 1.0?$dbt61706$,
   $dbt61707$["Almost all rows have the same value", "Most values are unique or near-unique, so filtering on that column narrows results down sharply", "The column cannot be indexed", "The column has exactly one distinct value"]$dbt61707$::jsonb,
   1, $dbt61708$Selectivity near 1.0 indicates values are close to unique across rows, meaning filtering narrows the result set dramatically.$dbt61708$, 1, 4),
  ($dbt61709$tq-dbms-sql-20-selectivity-6$dbt61709$, $dbt61710$pt-dbms-sql-20-selectivity$dbt61710$,
   $dbt61711$Why can a single overall selectivity number for `department` be misleading if the data distribution is skewed?$dbt61711$,
   $dbt61712$["Selectivity is never misleading under any circumstances", "If one department has 80% of all rows and 19 others share the rest, filtering to the big department is low-value even though the average selectivity number looks reasonable", "Skewed data makes selectivity impossible to calculate at all", "Selectivity can only be computed for numeric columns"]$dbt61712$::jsonb,
   1, $dbt61713$A skewed distribution means the overall average selectivity doesn't reflect the very different real selectivity of filtering to a huge group versus a tiny one — this is why optimizers use histograms for more nuance.$dbt61713$, 1, 5),
  ($dbt61714$tq-dbms-sql-20-selectivity-7$dbt61714$, $dbt61715$pt-dbms-sql-20-selectivity$dbt61715$,
   $dbt61716$What statistical tool do real query optimizers often use beyond a single selectivity ratio to handle skewed data distributions?$dbt61716$,
   $dbt61717$["Histograms of value frequency distribution", "A random number generator", "A separate hash index just for statistics", "They ignore skew entirely and always trust the average ratio"]$dbt61717$::jsonb,
   0, $dbt61718$Optimizers commonly maintain histograms capturing how values are distributed, which handles skew better than one single average ratio.$dbt61718$, 1, 6),
  ($dbt61719$tq-dbms-sql-20-selectivity-8$dbt61719$, $dbt61720$pt-dbms-sql-20-selectivity$dbt61720$,
   $dbt61721$How is selectivity mathematically related to cardinality (covered in 20.13)?$dbt61721$,
   $dbt61722$["They are unrelated concepts", "Selectivity = cardinality (distinct values) divided by total number of rows", "Cardinality = selectivity multiplied by the number of indexes", "Selectivity and cardinality are always equal to each other"]$dbt61722$::jsonb,
   1, $dbt61723$Selectivity is directly derived from cardinality: selectivity = cardinality / total rows, tying the two concepts together.$dbt61723$, 1, 7)
on conflict (id) do nothing;

-- 20.13 Cardinality
with g as (select id from public.learning_grids where lower(slug) = $dbt61724$dbms-sql-tutorial$dbt61724$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61725$chapter-20-indexes-and-access-paths$dbt61725$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61726$Cardinality$dbt61726$, $dbt61727$index-cardinality$dbt61727$, '', 13, 'published', true, true, $dbt61728$dbms_sql_tutorial$dbt61728$, $dbt61729$chapter-20-indexes-and-access-paths/index-cardinality$dbt61729$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61730$dbms_sql_tutorial$dbt61730$ and source_ref = $dbt61731$chapter-20-indexes-and-access-paths/index-cardinality$dbt61731$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61732$Cardinality$dbt61732$, $dbt61733$### A word this course has already used three different ways — here's the fourth

The word "cardinality" has shown up in this course before, meaning something **different** each time, and it is essential to keep them straight:

- **Chapter 4 (relational model) Cardinality**: the number of **rows** (tuples) in a relation — e.g., "the `students` relation has a cardinality of 1,000,000" simply means it has 1,000,000 rows.
- **Chapter 6 (ER modeling) Cardinality Ratio**: describes the **shape** of a relationship between two entities — 1:1, 1:N, or M:N (deliberately slugged `cardinality-ratio` there specifically to avoid collision with this different meaning).
- **Chapter 16 (joins) Join Cardinality**: an estimate of how many rows a **join** between two tables will produce.
- **Chapter 20.13 — Index Cardinality (this topic)**: the number of **distinct values** present in a particular column, considered specifically in relation to indexing decisions.

These are genuinely different concepts that happen to share the English word "cardinality" because they all relate to "counting something." **Index cardinality** is about counting **distinct values within one column** — not row totals, not relationship shape, not join output size.

### What index cardinality actually is

For a column in a table, index cardinality = **the number of unique/distinct values that column contains**. In our 1,000,000-row `students` table:

- `email` has index cardinality ≈ 1,000,000 (nearly every value is distinct).
- `department` has index cardinality ≈ 20 (only 20 distinct department names exist, no matter how many rows there are).
- `is_active` has index cardinality = 2 (`true`/`false`, regardless of row count).

### The direct link to Selectivity (20.12)

Index cardinality and selectivity are two sides of the same coin:

```
selectivity = index cardinality / total rows
```

`email`'s high index cardinality (≈1,000,000) relative to the table's 1,000,000 rows gives it a selectivity near 1.0. `is_active`'s low index cardinality (2) relative to 1,000,000 rows gives it a selectivity near 0. Cardinality is the raw count; selectivity is that count normalized against the table size, expressed as a ratio the optimizer can compare consistently across differently-sized tables.

### Why the optimizer cares

The query optimizer maintains statistics — including a column's cardinality — specifically to estimate, for a given query, how many rows a filter on that column is likely to return, and therefore whether using an index (versus a full scan) is worth the cost. A column with high cardinality relative to its table size is very likely to be worth indexing; extremely low cardinality (like `is_active`) usually is not, echoing 20.12's conclusion from the opposite angle.

### Edge cases

- Cardinality is a **raw count** (independent of table size), while selectivity is a **ratio** (cardinality relative to table size) — a column with cardinality 1,000 could be highly selective on a 1,000-row table (selectivity = 1.0) but not selective at all on a 1,000,000,000-row table (selectivity = 0.000001). Always consider them together, not in isolation.
- Database engines periodically recompute/refresh these statistics (e.g., via `ANALYZE` commands), because cardinality can drift as data changes — stale statistics can lead the optimizer to make poor indexing decisions.
- Do not confuse this topic's "index cardinality" (distinct values in a column) with Chapter 4's relational cardinality (total row count of a relation) — despite the shared word, they measure entirely different things, which is exactly why this topic uses the slug `index-cardinality` rather than the bare `cardinality` already used elsewhere in this course.

### Interview-style Q&A

**Q: How does index cardinality differ from the relational-model cardinality covered in Chapter 4?**
A: Chapter 4's cardinality is the total row count of a relation; index cardinality is the count of distinct values within one specific column — a completely different measurement despite sharing the word.

**Q: How do index cardinality and selectivity relate mathematically?**
A: Selectivity = index cardinality ÷ total rows — cardinality is the raw distinct-value count, selectivity normalizes it into a ratio the optimizer can use consistently.

**Key takeaway:** index cardinality (distinct values in a column) is the raw ingredient that produces selectivity (that count normalized by row total) — and it is a distinct concept from every other "cardinality" this course has used, hence its unique slug here.$dbt61733$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61734$dbms_sql_tutorial_seed$dbt61734$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61735$dbms_sql_tutorial_seed$dbt61735$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61736$dbms-sql-tutorial$dbt61736$),
     t as (select id from public.learning_topics where source_kind = $dbt61737$dbms_sql_tutorial$dbt61737$ and source_ref = $dbt61738$chapter-20-indexes-and-access-paths/index-cardinality$dbt61738$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61739$pt-dbms-sql-20-index-cardinality$dbt61739$, $dbt61740$Cardinality - Quick Test$dbt61740$, 'aptitude', 8, 8,
  $dbt61741$8 questions on Cardinality.$dbt61741$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61742$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61742$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61743$tq-dbms-sql-20-index-cardinality-1$dbt61743$, $dbt61744$pt-dbms-sql-20-index-cardinality$dbt61744$,
   $dbt61745$In the context of this topic (20.13), what does 'index cardinality' specifically measure?$dbt61745$,
   $dbt61746$["The total number of rows in the table", "The number of distinct values present in a particular column", "The shape of a relationship (1:1, 1:N, M:N) between two entities", "The estimated row count produced by a join"]$dbt61746$::jsonb,
   1, $dbt61747$Index cardinality specifically refers to the count of unique/distinct values within one column, used for indexing decisions.$dbt61747$, 1, 0),
  ($dbt61748$tq-dbms-sql-20-index-cardinality-2$dbt61748$, $dbt61749$pt-dbms-sql-20-index-cardinality$dbt61749$,
   $dbt61750$How does index cardinality (20.13) differ from the relational-model Cardinality covered in Chapter 4?$dbt61750$,
   $dbt61751$["They are exactly the same concept with different names", "Chapter 4's cardinality is the total row count of a relation; index cardinality is the distinct-value count of one column", "Index cardinality only applies to primary keys", "Chapter 4's cardinality only applies to indexed columns"]$dbt61751$::jsonb,
   1, $dbt61752$These are genuinely different measurements that happen to share the word 'cardinality' — row count vs. distinct-value count.$dbt61752$, 1, 1),
  ($dbt61753$tq-dbms-sql-20-index-cardinality-3$dbt61753$, $dbt61754$pt-dbms-sql-20-index-cardinality$dbt61754$,
   $dbt61755$What is the mathematical relationship between index cardinality and selectivity?$dbt61755$,
   $dbt61756$["Selectivity = index cardinality / total number of rows", "Index cardinality = selectivity / total number of rows", "They are unrelated and computed independently", "Selectivity = index cardinality squared"]$dbt61756$::jsonb,
   0, $dbt61757$Selectivity is derived by dividing the distinct-value count (cardinality) by the total row count.$dbt61757$, 1, 2),
  ($dbt61758$tq-dbms-sql-20-index-cardinality-4$dbt61758$, $dbt61759$pt-dbms-sql-20-index-cardinality$dbt61759$,
   $dbt61760$In the 1,000,000-row students table, what is the approximate index cardinality of the `is_active` boolean column?$dbt61760$,
   $dbt61761$["1,000,000", "500,000", "2", "0"]$dbt61761$::jsonb,
   2, $dbt61762$A boolean column has only 2 possible distinct values (true/false), regardless of how many rows the table has.$dbt61762$, 1, 3),
  ($dbt61763$tq-dbms-sql-20-index-cardinality-5$dbt61763$, $dbt61764$pt-dbms-sql-20-index-cardinality$dbt61764$,
   $dbt61765$Why is a high-cardinality column like `email` (relative to table size) generally a good index candidate?$dbt61765$,
   $dbt61766$["Because high cardinality guarantees fast writes", "Because it results in high selectivity, meaning the index narrows the search space down significantly", "Because high cardinality columns can never contain NULLs", "Because it means the column is the primary key automatically"]$dbt61766$::jsonb,
   1, $dbt61767$High cardinality relative to row count directly produces high selectivity, which is exactly what makes a column a strong index candidate.$dbt61767$, 1, 4),
  ($dbt61768$tq-dbms-sql-20-index-cardinality-6$dbt61768$, $dbt61769$pt-dbms-sql-20-index-cardinality$dbt61769$,
   $dbt61770$A column has cardinality 1,000. On a 1,000-row table, its selectivity is 1.0. What happens to its selectivity if the table instead has 1,000,000,000 rows but cardinality stays 1,000?$dbt61770$,
   $dbt61771$["Selectivity stays 1.0 regardless of table size", "Selectivity drops dramatically, since selectivity = cardinality / total rows, and the ratio becomes tiny", "Selectivity becomes undefined", "Cardinality and selectivity are unrelated so nothing changes about selectivity"]$dbt61771$::jsonb,
   1, $dbt61772$Since selectivity is a ratio relative to table size, the same raw cardinality yields wildly different selectivity depending on total row count — this is why cardinality and selectivity must be considered together.$dbt61772$, 1, 5),
  ($dbt61773$tq-dbms-sql-20-index-cardinality-7$dbt61773$, $dbt61774$pt-dbms-sql-20-index-cardinality$dbt61774$,
   $dbt61775$Why does the query optimizer need to know a column's cardinality?$dbt61775$,
   $dbt61776$["To decide the table's column order in CREATE TABLE", "To estimate how many rows a filter on that column will likely return, informing whether using an index is worthwhile", "To determine the table's clustered index automatically without any configuration", "Cardinality is purely academic and optimizers never use it"]$dbt61776$::jsonb,
   1, $dbt61777$Cardinality (and the selectivity derived from it) feeds directly into the optimizer's cost estimates for whether an index is worth using for a given query.$dbt61777$, 1, 6),
  ($dbt61778$tq-dbms-sql-20-index-cardinality-8$dbt61778$, $dbt61779$pt-dbms-sql-20-index-cardinality$dbt61779$,
   $dbt61780$Why can stale cardinality statistics cause problems for the query optimizer?$dbt61780$,
   $dbt61781$["Stale statistics have no effect on optimizer decisions", "If cardinality has drifted since statistics were last computed (e.g., via ANALYZE), the optimizer may make poor indexing/scan decisions based on outdated information", "Stale statistics automatically trigger a full table rebuild", "The database refuses to run any queries until statistics are refreshed"]$dbt61781$::jsonb,
   1, $dbt61782$Cardinality can drift as data changes; if the optimizer's stored statistics aren't refreshed (e.g., via ANALYZE), its cost-based decisions can become inaccurate.$dbt61782$, 1, 7)
on conflict (id) do nothing;

-- 20.14 Index Maintenance
with g as (select id from public.learning_grids where lower(slug) = $dbt61783$dbms-sql-tutorial$dbt61783$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61784$chapter-20-indexes-and-access-paths$dbt61784$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61785$Index Maintenance$dbt61785$, $dbt61786$index-maintenance$dbt61786$, '', 14, 'published', true, true, $dbt61787$dbms_sql_tutorial$dbt61787$, $dbt61788$chapter-20-indexes-and-access-paths/index-maintenance$dbt61788$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61789$dbms_sql_tutorial$dbt61789$ and source_ref = $dbt61790$chapter-20-indexes-and-access-paths/index-maintenance$dbt61790$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61791$Index Maintenance$dbt61791$, $dbt61792$### Every write has to update every relevant index too

Indexes don't just sit passively waiting to be read — they must be actively **maintained** every time the underlying data changes. This is the concrete, ongoing cost side of the fundamental read/write trade-off introduced back in 20.1.

### What happens on a write

Consider `students` with a clustered index on `id`, plus non-clustered indexes on `email`, `department`, and `gpa`. Now run:

```sql
INSERT INTO students (id, name, department, gpa, email)
VALUES (1000001, 'New Student', 'CS', 3.2, 'new.student@example.com');
```

This single `INSERT` isn't just "add one row to the table." The engine must also:

1. Insert the new row into the clustered index structure (in `id`-sorted position).
2. Insert a new entry into the `email` non-clustered index (in sorted position, possibly triggering a node split — recall 20.2's B-Tree rebalancing).
3. Insert a new entry into the `department` non-clustered index.
4. Insert a new entry into the `gpa` non-clustered index.

That's **four** structures updated for one row insert. If this table instead had 10 non-clustered indexes, every single insert, update, or delete touching any indexed column would need to update up to 10 separate structures — the write cost scales directly with the number of indexes.

### The fundamental trade-off, restated concretely

This is exactly why "just add more indexes" is not a free performance win: each additional index on a table makes every future `INSERT`/`UPDATE`/`DELETE` slightly (or, with many indexes, significantly) slower. A read-heavy table with rare writes can comfortably carry many indexes; a write-heavy table (e.g., a high-volume logging or transaction table) needs to be much more conservative about how many indexes it carries.

### Fragmentation and rebuilding

Beyond the per-write cost, indexes can develop **fragmentation** over time: as rows are inserted, updated, and deleted, B+ Tree nodes split, merge, and can end up with wasted space or a less-than-optimal physical layout on disk (e.g., logically adjacent leaf pages no longer being physically adjacent). This degrades read performance gradually. Database administrators periodically run **rebuild** or **reorganize** operations (e.g., `REINDEX` in PostgreSQL, `ALTER INDEX ... REBUILD` in SQL Server) to restore an index to a compact, efficient layout.

### Edge cases

- Bulk-loading a large amount of data is often faster with indexes **temporarily dropped**, then rebuilt fresh afterward in one pass — rather than paying the per-row index-update cost thousands/millions of times during the load.
- An index on a column that is updated extremely frequently (like a "last modified" timestamp touched on every write) pays this maintenance cost constantly, even if that column is rarely used in `WHERE` clauses — a case where the ongoing cost may outweigh any real read benefit.
- Some engines defer or batch certain index-maintenance work (e.g., using a small unindexed "insert buffer" merged periodically) as an internal optimization, but the conceptual cost — every index must eventually reflect every write — still applies.

### Interview-style Q&A

**Q: Why does adding more indexes to a table slow down writes?**
A: Because every INSERT/UPDATE/DELETE touching an indexed column must update every one of those index structures, not just the table itself — more indexes means more structures to keep in sync on every write.

**Q: What is index fragmentation, and why does it matter?**
A: Fragmentation is the gradual degradation of an index's physical layout efficiency from ongoing inserts/updates/deletes; it can slow down reads over time and is fixed via periodic rebuild/reorganize operations.

**Key takeaway:** every index is a recurring, ongoing cost on every relevant write, not just a one-time setup cost — this is the direct, mechanical reason behind the read/write trade-off from 20.1.$dbt61792$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61793$dbms_sql_tutorial_seed$dbt61793$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61794$dbms_sql_tutorial_seed$dbt61794$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61795$dbms-sql-tutorial$dbt61795$),
     t as (select id from public.learning_topics where source_kind = $dbt61796$dbms_sql_tutorial$dbt61796$ and source_ref = $dbt61797$chapter-20-indexes-and-access-paths/index-maintenance$dbt61797$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61798$pt-dbms-sql-20-index-maintenance$dbt61798$, $dbt61799$Index Maintenance - Quick Test$dbt61799$, 'aptitude', 8, 8,
  $dbt61800$8 questions on Index Maintenance.$dbt61800$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61801$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61801$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61802$tq-dbms-sql-20-index-maintenance-1$dbt61802$, $dbt61803$pt-dbms-sql-20-index-maintenance$dbt61803$,
   $dbt61804$When a row is inserted into a table with 3 non-clustered indexes plus a clustered index, how many structures typically need updating?$dbt61804$,
   $dbt61805$["Just the table itself, no indexes", "Only 1 structure, whichever is queried most", "All 4 structures \u2014 the clustered index/table plus each of the 3 non-clustered indexes", "Exactly 2, chosen at random"]$dbt61805$::jsonb,
   2, $dbt61806$Every relevant index (plus the clustered index/table itself) must reflect the new row, so all 4 structures need updating.$dbt61806$, 1, 0),
  ($dbt61807$tq-dbms-sql-20-index-maintenance-2$dbt61807$, $dbt61808$pt-dbms-sql-20-index-maintenance$dbt61808$,
   $dbt61809$Why does adding more indexes to a table increase the cost of writes?$dbt61809$,
   $dbt61810$["It doesn't; indexes have zero write cost", "Because each additional index is a separate structure that must also be updated on every relevant INSERT/UPDATE/DELETE", "Because more indexes reduce the table's storage capacity to zero", "Because indexes convert all writes into reads"]$dbt61810$::jsonb,
   1, $dbt61811$Every index the write touches must be kept in sync, so more indexes directly means more work per write.$dbt61811$, 1, 1),
  ($dbt61812$tq-dbms-sql-20-index-maintenance-3$dbt61812$, $dbt61813$pt-dbms-sql-20-index-maintenance$dbt61813$,
   $dbt61814$What is index fragmentation?$dbt61814$,
   $dbt61815$["A security vulnerability unique to hash indexes", "The gradual degradation of an index's physical layout efficiency due to ongoing inserts, updates, and deletes", "A type of index that only covers half the columns", "An error that occurs when a query has no WHERE clause"]$dbt61815$::jsonb,
   1, $dbt61816$Fragmentation refers to the index's physical storage becoming less optimally organized over time as data changes accumulate.$dbt61816$, 1, 2),
  ($dbt61817$tq-dbms-sql-20-index-maintenance-4$dbt61817$, $dbt61818$pt-dbms-sql-20-index-maintenance$dbt61818$,
   $dbt61819$What operation do database administrators run to fix a fragmented index?$dbt61819$,
   $dbt61820$["DROP TABLE", "A rebuild/reorganize operation (e.g., REINDEX or ALTER INDEX REBUILD)", "SELECT * FROM the table", "Disabling all foreign keys"]$dbt61820$::jsonb,
   1, $dbt61821$Rebuild/reorganize commands restore an index's efficient physical layout after it has become fragmented.$dbt61821$, 1, 3),
  ($dbt61822$tq-dbms-sql-20-index-maintenance-5$dbt61822$, $dbt61823$pt-dbms-sql-20-index-maintenance$dbt61823$,
   $dbt61824$Why might it be faster to temporarily drop indexes before a large bulk data load, then rebuild them afterward?$dbt61824$,
   $dbt61825$["Because dropping indexes deletes the table's data", "Because it avoids paying the per-row index-update cost repeatedly during the load, instead rebuilding once in a single efficient pass", "Because indexes are required to be dropped before any INSERT statement", "Because bulk loads always fail if any index exists"]$dbt61825$::jsonb,
   1, $dbt61826$Rebuilding an index once after bulk loading is typically far more efficient than maintaining it incrementally on every single inserted row.$dbt61826$, 1, 4),
  ($dbt61827$tq-dbms-sql-20-index-maintenance-6$dbt61827$, $dbt61828$pt-dbms-sql-20-index-maintenance$dbt61828$,
   $dbt61829$Which type of table generally needs to be MORE conservative about how many indexes it carries?$dbt61829$,
   $dbt61830$["A read-heavy, rarely-written reporting table", "A write-heavy table like a high-volume transaction log", "Tables with fewer than 10 rows", "Tables that use only a clustered index"]$dbt61830$::jsonb,
   1, $dbt61831$Write-heavy tables pay the index-maintenance cost far more often, so they benefit from carrying fewer indexes than read-heavy tables.$dbt61831$, 1, 5),
  ($dbt61832$tq-dbms-sql-20-index-maintenance-7$dbt61832$, $dbt61833$pt-dbms-sql-20-index-maintenance$dbt61833$,
   $dbt61834$What is a real downside of indexing a column that is updated on nearly every write but rarely used in WHERE clauses (e.g., a 'last modified' timestamp)?$dbt61834$,
   $dbt61835$["No downside; such columns should always be indexed", "The index pays constant maintenance cost on every write while providing little read benefit, since it's rarely queried", "It automatically becomes the table's clustered index", "It prevents the column from ever being updated again"]$dbt61835$::jsonb,
   1, $dbt61836$An index on a frequently-written, rarely-queried column accrues ongoing maintenance cost without a matching read payoff.$dbt61836$, 1, 6),
  ($dbt61837$tq-dbms-sql-20-index-maintenance-8$dbt61837$, $dbt61838$pt-dbms-sql-20-index-maintenance$dbt61838$,
   $dbt61839$Which of the following best summarizes the fundamental trade-off illustrated by index maintenance?$dbt61839$,
   $dbt61840$["Indexes are a one-time setup cost with no ongoing cost afterward", "Every index represents a recurring cost paid on every relevant write, in exchange for faster reads", "Index maintenance only matters for hash indexes, not B+ Trees", "Maintenance cost decreases as more indexes are added"]$dbt61840$::jsonb,
   1, $dbt61841$This topic reinforces that indexes are an ongoing, per-write cost — not a one-time cost — which is the mechanical basis of the classic read/write trade-off.$dbt61841$, 1, 7)
on conflict (id) do nothing;

-- 20.15 When Not to Index
with g as (select id from public.learning_grids where lower(slug) = $dbt61842$dbms-sql-tutorial$dbt61842$),
     s as (select id from public.learning_sections where lower(slug) = $dbt61843$chapter-20-indexes-and-access-paths$dbt61843$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt61844$When Not to Index$dbt61844$, $dbt61845$when-not-to-index$dbt61845$, '', 15, 'published', true, true, $dbt61846$dbms_sql_tutorial$dbt61846$, $dbt61847$chapter-20-indexes-and-access-paths/when-not-to-index$dbt61847$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt61848$dbms_sql_tutorial$dbt61848$ and source_ref = $dbt61849$chapter-20-indexes-and-access-paths/when-not-to-index$dbt61849$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt61850$When Not to Index$dbt61850$, $dbt61851$### Indexing is not automatically a win — knowing when to skip it matters just as much

After 14 topics building the case for indexes, it's equally important to recognize situations where adding an index provides **little or no benefit**, while still incurring its very real costs (storage, and the write overhead from 20.14). Over-indexing is a common, real-world performance mistake.

### Case 1: small tables

If a table has only a few hundred rows (unlike our 1,000,000-row `students` example), a full table scan is already extremely fast — reading a few hundred rows takes microseconds to low milliseconds. An index adds overhead (storage, write cost, and even a small amount of optimizer decision-making overhead) without meaningfully speeding up a scan that was already fast. A lookup table of, say, 50 `department` records doesn't need an index on `department_name`.

### Case 2: low-selectivity columns

As established in 20.12, a column like `is_active` (2 distinct values) provides almost no narrowing benefit. Indexing it wastes storage and write overhead for a structure the optimizer will likely ignore in favor of a full scan anyway, since even after using the index, most of the table's rows would still match.

### Case 3: columns rarely used in WHERE / JOIN / ORDER BY

An index that's never actually referenced by any query's filter, join condition, or sort clause provides zero read benefit while still costing storage and write overhead on every relevant change. Before adding an index, it's worth confirming the column is actually queried in a way that would use it (e.g., checking real query patterns or execution plans) — indexing "just in case" is a common source of index bloat.

### Case 4: write-heavy tables

On a table dominated by high-frequency `INSERT`/`UPDATE`/`DELETE` traffic (e.g., an event log, a high-throughput orders table), the cumulative write-overhead cost from 20.14 can outweigh the read benefit, especially if reads against that table are rare or non-critical-path. Each additional index compounds this cost.

### Case 5: over-indexing in general

Perhaps the most important general lesson: **each additional index is a real, ongoing cost, not just an upfront one.** It's tempting to add an index "to be safe" whenever a new query pattern appears, but a table accumulating dozens of rarely-used indexes over time pays a steep, compounding write-performance tax for benefits that may only apply to a handful of infrequent queries. Periodically auditing and removing genuinely unused indexes (many engines expose usage statistics for this) is a legitimate maintenance practice.

### Edge cases

- Sometimes an index that looks "unnecessary" by usage statistics is actually enforcing a constraint (like a unique index backing a `UNIQUE`/`PRIMARY KEY` declaration, 20.9) — removing it would remove the constraint too, so usage-based cleanup must be done carefully.
- A column can be low-selectivity overall (20.12/20.13) yet still worth indexing as part of a composite index's leading column, if paired with a more selective trailing column and the combined filter is common — the isolated-column analysis in this topic doesn't automatically apply to composite scenarios.
- What counts as "small" or "write-heavy enough to skip indexing" isn't a fixed universal number — it depends on actual query latency requirements, table growth trajectory, and the specific engine's behavior; these guidelines are heuristics, not hard rules.

### Interview-style Q&A

**Q: Give two concrete reasons you might deliberately choose NOT to index a column.**
A: (1) The column has low selectivity (few distinct values, so the index barely narrows the search), and (2) the table is small enough that a full scan is already fast, making the index's overhead pure cost with no real benefit.

**Q: Why is "just add an index to be safe" a risky default habit?**
A: Because every index carries a real, ongoing write-maintenance cost (20.14), so indexes added for rarely-used or low-value query patterns accumulate into a compounding tax on every write, without matching read benefit.

**Key takeaway:** this whole chapter's message is not "index everything" but "index deliberately" — every index is a considered trade-off, and the right answer is sometimes to skip it.$dbt61851$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt61852$dbms_sql_tutorial_seed$dbt61852$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt61853$dbms_sql_tutorial_seed$dbt61853$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt61854$dbms-sql-tutorial$dbt61854$),
     t as (select id from public.learning_topics where source_kind = $dbt61855$dbms_sql_tutorial$dbt61855$ and source_ref = $dbt61856$chapter-20-indexes-and-access-paths/when-not-to-index$dbt61856$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt61857$pt-dbms-sql-20-when-not-to-index$dbt61857$, $dbt61858$When Not to Index - Quick Test$dbt61858$, 'aptitude', 8, 8,
  $dbt61859$8 questions on When Not to Index.$dbt61859$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt61860$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt61860$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt61861$tq-dbms-sql-20-when-not-to-index-1$dbt61861$, $dbt61862$pt-dbms-sql-20-when-not-to-index$dbt61862$,
   $dbt61863$Why might a small table (a few hundred rows) not benefit meaningfully from an index?$dbt61863$,
   $dbt61864$["Small tables cannot technically support indexes", "A full table scan of a few hundred rows is already extremely fast, so an index adds overhead without meaningful speedup", "Small tables always use hash indexes automatically", "Indexes only work on tables larger than 1,000,000 rows"]$dbt61864$::jsonb,
   1, $dbt61865$When a scan is already fast due to small size, the added storage and write overhead of an index isn't justified by the read speedup.$dbt61865$, 1, 0),
  ($dbt61866$tq-dbms-sql-20-when-not-to-index-2$dbt61866$, $dbt61867$pt-dbms-sql-20-when-not-to-index$dbt61867$,
   $dbt61868$Why is a low-selectivity column (like a boolean flag) generally a poor indexing candidate, revisited from 20.12?$dbt61868$,
   $dbt61869$["Because boolean columns cannot be stored in a database", "Because it barely narrows the search space, so the optimizer often ignores the index anyway in favor of a full scan", "Because boolean columns always contain NULL", "Because it is illegal to index boolean columns in SQL"]$dbt61869$::jsonb,
   1, $dbt61870$Low selectivity means filtering on the column still leaves most rows matching, so an index provides little real read benefit.$dbt61870$, 1, 1),
  ($dbt61871$tq-dbms-sql-20-when-not-to-index-3$dbt61871$, $dbt61872$pt-dbms-sql-20-when-not-to-index$dbt61872$,
   $dbt61873$What is a red flag suggesting a column should NOT be indexed?$dbt61873$,
   $dbt61874$["It is frequently used in WHERE clauses", "It is rarely or never referenced in any query's filter, join, or ORDER BY clause", "It has high selectivity", "It is part of the table's primary key"]$dbt61874$::jsonb,
   1, $dbt61875$An index that's never actually used by any query provides zero read benefit while still incurring storage and write costs.$dbt61875$, 1, 2),
  ($dbt61876$tq-dbms-sql-20-when-not-to-index-4$dbt61876$, $dbt61877$pt-dbms-sql-20-when-not-to-index$dbt61877$,
   $dbt61878$Why might a write-heavy table (like a high-volume event log) be a poor candidate for many indexes?$dbt61878$,
   $dbt61879$["Write-heavy tables cannot have any indexes by definition", "The cumulative write-overhead cost of maintaining many indexes can outweigh the benefit if reads against that table are rare or non-critical", "Indexes make writes faster on write-heavy tables, so more is always better", "Event logs never have any columns worth filtering on"]$dbt61879$::jsonb,
   1, $dbt61880$On write-dominated tables, the per-write index-maintenance cost (20.14) compounds and can exceed any read-side gain from having the index.$dbt61880$, 1, 3),
  ($dbt61881$tq-dbms-sql-20-when-not-to-index-5$dbt61881$, $dbt61882$pt-dbms-sql-20-when-not-to-index$dbt61882$,
   $dbt61883$What is the risk of adding indexes 'just in case' for every new query pattern that appears?$dbt61883$,
   $dbt61884$["There is no risk; more indexes are always strictly beneficial", "The table can accumulate many rarely-used indexes, each adding an ongoing write-performance cost, compounding over time", "It automatically converts the table into a view", "It removes the table's clustered index"]$dbt61884$::jsonb,
   1, $dbt61885$Indiscriminate 'just in case' indexing leads to index bloat — many indexes rarely used for reads but still costing on every write.$dbt61885$, 1, 4),
  ($dbt61886$tq-dbms-sql-20-when-not-to-index-6$dbt61886$, $dbt61887$pt-dbms-sql-20-when-not-to-index$dbt61887$,
   $dbt61888$Why must you be careful before dropping an index that usage statistics show as 'rarely used'?$dbt61888$,
   $dbt61889$["Usage statistics are always fabricated and should be ignored", "The index might be backing a UNIQUE or PRIMARY KEY constraint, so dropping it would also remove that constraint", "Dropping any index always deletes the underlying table", "Rarely-used indexes cannot technically be dropped by any engine"]$dbt61889$::jsonb,
   1, $dbt61890$A unique index (20.9) often enforces a real constraint; removing it for being 'unused' as a lookup structure would also remove the uniqueness guarantee.$dbt61890$, 1, 5),
  ($dbt61891$tq-dbms-sql-20-when-not-to-index-7$dbt61891$, $dbt61892$pt-dbms-sql-20-when-not-to-index$dbt61892$,
   $dbt61893$Can a low-selectivity column ever still be worth including in an index?$dbt61893$,
   $dbt61894$["No, low-selectivity columns should never appear in any index under any circumstances", "Yes, as the leading column of a composite index paired with a more selective trailing column, if that combined filter pattern is common", "Yes, but only if the column is renamed first", "No, because low-selectivity columns cannot be part of a B+ Tree"]$dbt61894$::jsonb,
   1, $dbt61895$Composite index design (20.7) can still justify a low-selectivity leading column if it matches real, common query filter combinations.$dbt61895$, 1, 6),
  ($dbt61896$tq-dbms-sql-20-when-not-to-index-8$dbt61896$, $dbt61897$pt-dbms-sql-20-when-not-to-index$dbt61897$,
   $dbt61898$What is the overall lesson of this topic (20.15), tying together the whole chapter?$dbt61898$,
   $dbt61899$["Every column in every table should always be indexed to maximize performance", "Indexing should be a deliberate, considered trade-off \u2014 sometimes the correct choice is not to index at all", "Indexes have no real cost and should be added liberally", "Only primary keys should ever be indexed, and nothing else"]$dbt61899$::jsonb,
   1, $dbt61900$The chapter's throughline is that indexing is a deliberate trade-off decision (read speed vs. storage/write cost), not a default that should always be applied.$dbt61900$, 1, 7)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. CHAPTER TESTS — one per new chapter (3, 4, 5). Pools are LIVE joins via
--    practice_test_pool() (0091/063); no test_questions of their own.
-- ===========================================================================
with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbt61901$chapter-18-set-operations$dbt61901$ and lower(g.slug) = $dbt61902$dbms-sql-tutorial$dbt61902$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbt61903$pt-dbms-sql-ch18-test$dbt61903$, $dbt61904$Set Operations - Chapter Test$dbt61904$, 'aptitude', sec.id, 'chapter', true, 8,
  13,
  $dbt61905$8 randomly-sampled questions drawn from every Set Operations topic quiz.$dbt61905$,
  'published', true, true, true, 'Medium', 0,
  $dbt61906$This test randomly samples 8 questions from all of Chapter 18's topic quizzes. Each carries 1 mark. No negative marking. You have 13 minutes.$dbt61906$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbt61907$chapter-19-views$dbt61907$ and lower(g.slug) = $dbt61908$dbms-sql-tutorial$dbt61908$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbt61909$pt-dbms-sql-ch19-test$dbt61909$, $dbt61910$Views - Chapter Test$dbt61910$, 'aptitude', sec.id, 'chapter', true, 10,
  15,
  $dbt61911$10 randomly-sampled questions drawn from every Views topic quiz.$dbt61911$,
  'published', true, true, true, 'Medium', 0,
  $dbt61912$This test randomly samples 10 questions from all of Chapter 19's topic quizzes. Each carries 1 mark. No negative marking. You have 15 minutes.$dbt61912$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbt61913$chapter-20-indexes-and-access-paths$dbt61913$ and lower(g.slug) = $dbt61914$dbms-sql-tutorial$dbt61914$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbt61915$pt-dbms-sql-ch20-test$dbt61915$, $dbt61916$Indexes and Access Paths - Chapter Test$dbt61916$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dbt61917$15 randomly-sampled questions drawn from every Indexes and Access Paths topic quiz.$dbt61917$,
  'published', true, true, true, 'Medium', 0,
  $dbt61918$This test randomly samples 15 questions from all of Chapter 20's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dbt61918$
from sec
on conflict (id) do nothing;

-- ===========================================================================
-- 4. SQL CODING PROBLEMS (Chapter 9 DDL-writing, Chapter 10 constraint-
--    violation-finding, Chapter 11 DML-writing — every problem verified
--    end-to-end against Paiza's live MySQL sandbox, 2026-09).
-- ===========================================================================
-- Ever Enrolled (topic chapter-18-set-operations/union-sql)
with t as (select id from public.learning_topics where source_kind = $dbt61922$dbms_sql_tutorial$dbt61922$ and source_ref = $dbt61923$chapter-18-set-operations/union-sql$dbt61923$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbt61924$cp-dbms-sql-ever-enrolled$dbt61924$, null::text, $dbt61925$Ever Enrolled$dbt61925$, $dbt61926$Easy$dbt61926$, $dbt61927$ever-enrolled$dbt61927$,
  $dbt61928$Write a query returning every distinct `student_id` who was enrolled in 2025, 2026, or both, ordered ascending.

```sql
CREATE TABLE enrolled_2025 (student_id INTEGER NOT NULL);
CREATE TABLE enrolled_2026 (student_id INTEGER NOT NULL);
```

**Sample data**:

```sql
INSERT INTO enrolled_2025 (student_id) VALUES (1), (2), (3), (4);
INSERT INTO enrolled_2026 (student_id) VALUES (2), (3), (5);
```
$dbt61928$,
  $dbt61919$[{"input": "", "output": "student_id\n1\n2\n3\n4\n5"}]$dbt61919$::jsonb, $dbt61920$[{"hidden": true, "seed_sql": "INSERT INTO enrolled_2025 (student_id) VALUES (10), (20), (30);\nINSERT INTO enrolled_2026 (student_id) VALUES (20), (40);", "expected": "student_id\n10\n20\n30\n40"}]$dbt61920$::jsonb, jsonb_build_object('sql', $dbt61921$-- Write your SELECT query here
$dbt61921$),
  $dbt61929$UNION combines both years and removes duplicate student ids. Reference: `SELECT student_id FROM enrolled_2025 UNION SELECT student_id FROM enrolled_2026 ORDER BY student_id;`$dbt61929$, array['sql'], $dbt61930$CREATE TABLE enrolled_2025 (student_id INTEGER NOT NULL);
CREATE TABLE enrolled_2026 (student_id INTEGER NOT NULL);$dbt61930$, $dbt61931$INSERT INTO enrolled_2025 (student_id) VALUES (1), (2), (3), (4);
INSERT INTO enrolled_2026 (student_id) VALUES (2), (3), (5);$dbt61931$, $dbt61932$$dbt61932$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Enrolled Both Years (topic chapter-18-set-operations/intersect)
with t as (select id from public.learning_topics where source_kind = $dbt61936$dbms_sql_tutorial$dbt61936$ and source_ref = $dbt61937$chapter-18-set-operations/intersect$dbt61937$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbt61938$cp-dbms-sql-enrolled-both-years$dbt61938$, null::text, $dbt61939$Enrolled Both Years$dbt61939$, $dbt61940$Easy$dbt61940$, $dbt61941$enrolled-both-years$dbt61941$,
  $dbt61942$Write a query returning every `student_id` enrolled in BOTH 2025 and 2026, ordered ascending.

```sql
CREATE TABLE enrolled_2025 (student_id INTEGER NOT NULL);
CREATE TABLE enrolled_2026 (student_id INTEGER NOT NULL);
```

**Sample data**:

```sql
INSERT INTO enrolled_2025 (student_id) VALUES (1), (2), (3), (4);
INSERT INTO enrolled_2026 (student_id) VALUES (2), (3), (5);
```
$dbt61942$,
  $dbt61933$[{"input": "", "output": "student_id\n2\n3"}]$dbt61933$::jsonb, $dbt61934$[{"hidden": true, "seed_sql": "INSERT INTO enrolled_2025 (student_id) VALUES (10), (20), (30);\nINSERT INTO enrolled_2026 (student_id) VALUES (20), (40);", "expected": "student_id\n20"}]$dbt61934$::jsonb, jsonb_build_object('sql', $dbt61935$-- Write your SELECT query here
$dbt61935$),
  $dbt61943$INTERSECT returns only rows present in both queries. Reference: `SELECT student_id FROM enrolled_2025 INTERSECT SELECT student_id FROM enrolled_2026 ORDER BY student_id;`$dbt61943$, array['sql'], $dbt61944$CREATE TABLE enrolled_2025 (student_id INTEGER NOT NULL);
CREATE TABLE enrolled_2026 (student_id INTEGER NOT NULL);$dbt61944$, $dbt61945$INSERT INTO enrolled_2025 (student_id) VALUES (1), (2), (3), (4);
INSERT INTO enrolled_2026 (student_id) VALUES (2), (3), (5);$dbt61945$, $dbt61946$$dbt61946$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Left After 2025 (topic chapter-18-set-operations/except)
with t as (select id from public.learning_topics where source_kind = $dbt61950$dbms_sql_tutorial$dbt61950$ and source_ref = $dbt61951$chapter-18-set-operations/except$dbt61951$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbt61952$cp-dbms-sql-left-after-2025$dbt61952$, null::text, $dbt61953$Left After 2025$dbt61953$, $dbt61954$Medium$dbt61954$, $dbt61955$left-after-2025$dbt61955$,
  $dbt61956$Write a query returning every `student_id` who was enrolled in 2025 but did NOT return in 2026, ordered ascending.

```sql
CREATE TABLE enrolled_2025 (student_id INTEGER NOT NULL);
CREATE TABLE enrolled_2026 (student_id INTEGER NOT NULL);
```

**Sample data**:

```sql
INSERT INTO enrolled_2025 (student_id) VALUES (1), (2), (3), (4);
INSERT INTO enrolled_2026 (student_id) VALUES (2), (3), (5);
```
$dbt61956$,
  $dbt61947$[{"input": "", "output": "student_id\n1\n4"}]$dbt61947$::jsonb, $dbt61948$[{"hidden": true, "seed_sql": "INSERT INTO enrolled_2025 (student_id) VALUES (10), (20), (30);\nINSERT INTO enrolled_2026 (student_id) VALUES (20), (40);", "expected": "student_id\n10\n30"}]$dbt61948$::jsonb, jsonb_build_object('sql', $dbt61949$-- Write your SELECT query here
$dbt61949$),
  $dbt61957$EXCEPT returns rows in the first query that don't appear in the second — order matters. Reference: `SELECT student_id FROM enrolled_2025 EXCEPT SELECT student_id FROM enrolled_2026 ORDER BY student_id;`$dbt61957$, array['sql'], $dbt61958$CREATE TABLE enrolled_2025 (student_id INTEGER NOT NULL);
CREATE TABLE enrolled_2026 (student_id INTEGER NOT NULL);$dbt61958$, $dbt61959$INSERT INTO enrolled_2025 (student_id) VALUES (1), (2), (3), (4);
INSERT INTO enrolled_2026 (student_id) VALUES (2), (3), (5);$dbt61959$, $dbt61960$$dbt61960$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Create a High Earners View (topic chapter-19-views/simple-views)
with t as (select id from public.learning_topics where source_kind = $dbt61964$dbms_sql_tutorial$dbt61964$ and source_ref = $dbt61965$chapter-19-views/simple-views$dbt61965$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbt61966$cp-dbms-sql-create-a-high-earners-view$dbt61966$, null::text, $dbt61967$Create a High Earners View$dbt61967$, $dbt61968$Easy$dbt61968$, $dbt61969$create-a-high-earners-view$dbt61969$,
  $dbt61970$Write a `CREATE VIEW` statement named `high_earners` that exposes `id`, `name`, `salary` for every employee earning more than 80000. The checker will query your view afterward.

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
(4, 'Vikram', 'Sales', 50000);
```
$dbt61970$,
  $dbt61961$[{"input": "", "output": "id\tname\tsalary\n1\tAsha\t90000"}]$dbt61961$::jsonb, $dbt61962$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Finance', 95000),\n(2, 'Omar', 'Finance', 40000),\n(3, 'Leo', 'Marketing', 60000);", "expected": "id\tname\tsalary\n1\tZara\t95000"}]$dbt61962$::jsonb, jsonb_build_object('sql', $dbt61963$-- Write your CREATE VIEW statement here
$dbt61963$),
  $dbt61971$A simple view stores a query definition over a single table with no joins/aggregation. Reference: `CREATE VIEW high_earners AS SELECT id, name, salary FROM employees WHERE salary > 80000;`$dbt61971$, array['sql'], $dbt61972$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);$dbt61972$, $dbt61973$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 90000),
(2, 'Rohan', 'Engineering', 60000),
(3, 'Neha', 'Sales', 70000),
(4, 'Vikram', 'Sales', 50000);$dbt61973$, $dbt61974$SELECT id, name, salary FROM high_earners ORDER BY id;$dbt61974$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Create a Department Summary View (topic chapter-19-views/complex-views)
with t as (select id from public.learning_topics where source_kind = $dbt61978$dbms_sql_tutorial$dbt61978$ and source_ref = $dbt61979$chapter-19-views/complex-views$dbt61979$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbt61980$cp-dbms-sql-create-a-department-summary-view$dbt61980$, null::text, $dbt61981$Create a Department Summary View$dbt61981$, $dbt61982$Medium$dbt61982$, $dbt61983$create-a-department-summary-view$dbt61983$,
  $dbt61984$Write a `CREATE VIEW` statement named `department_summary` with columns `department`, `headcount` (employee count), and `avg_salary` (integer average salary, using `SUM(salary) DIV COUNT(*)`), one row per department. The checker will query your view afterward.

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
(4, 'Vikram', 'Sales', 50000);
```
$dbt61984$,
  $dbt61975$[{"input": "", "output": "department\theadcount\tavg_salary\nEngineering\t2\t75000\nSales\t2\t60000"}]$dbt61975$::jsonb, $dbt61976$[{"hidden": true, "seed_sql": "INSERT INTO employees (id, name, department, salary) VALUES\n(1, 'Zara', 'Finance', 95000),\n(2, 'Omar', 'Finance', 40000),\n(3, 'Leo', 'Marketing', 60000);", "expected": "department\theadcount\tavg_salary\nFinance\t2\t67500\nMarketing\t1\t60000"}]$dbt61976$::jsonb, jsonb_build_object('sql', $dbt61977$-- Write your CREATE VIEW statement here
$dbt61977$),
  $dbt61985$A complex view can involve GROUP BY and aggregate functions, unlike a simple single-table view. Reference: `CREATE VIEW department_summary AS SELECT department, COUNT(*) AS headcount, SUM(salary) DIV COUNT(*) AS avg_salary FROM employees GROUP BY department;`$dbt61985$, array['sql'], $dbt61986$CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary INTEGER NOT NULL
);$dbt61986$, $dbt61987$INSERT INTO employees (id, name, department, salary) VALUES
(1, 'Asha', 'Engineering', 90000),
(2, 'Rohan', 'Engineering', 60000),
(3, 'Neha', 'Sales', 70000),
(4, 'Vikram', 'Sales', 50000);$dbt61987$, $dbt61988$SELECT department, headcount, avg_salary FROM department_summary ORDER BY department;$dbt61988$,
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
  select id into v_grid_id from public.learning_grids where lower(slug) = $dbt61989$dbms-sql-tutorial$dbt61989$;
  if v_grid_id is null then raise exception 'validation: dbms-sql-tutorial grid missing'; end if;

  select count(*) into v_topics from public.learning_topics where grid_id = v_grid_id and source_kind = $dbt61990$dbms_sql_tutorial$dbt61990$;
  if v_topics < 250 then raise exception 'validation: expected at least 250 dbms_sql_tutorial topics (220 from batches 1-6 + 30 from batch 7), found %', v_topics; end if;

  select count(*) into v_questions from public.test_questions tq
    join public.practice_tests pt on pt.id = tq.test_id
    where pt.learning_topic_id in (select id from public.learning_topics where grid_id = v_grid_id and source_kind = $dbt61991$dbms_sql_tutorial$dbt61991$);
  if v_questions < 2000 then raise exception 'validation: expected at least 2000 topic-quiz questions, found %', v_questions; end if;

  select count(*) into v_chtests from public.practice_tests where id in ('pt-dbms-sql-ch18-test','pt-dbms-sql-ch19-test','pt-dbms-sql-ch20-test') and scope = 'chapter';
  if v_chtests <> 3 then raise exception 'validation: expected 3 new chapter tests, found %', v_chtests; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-dbms-sql-%';
  if v_problems < 46 then raise exception 'validation: expected at least 46 SQL coding problems total, found %', v_problems; end if;

  raise notice '0098 OK: % total topics, % total topic-quiz questions, 3 new chapter tests (ch18/ch19/ch20), % total SQL coding problems.', v_topics, v_questions, v_problems;
end $$;

notify pgrst, 'reload schema';
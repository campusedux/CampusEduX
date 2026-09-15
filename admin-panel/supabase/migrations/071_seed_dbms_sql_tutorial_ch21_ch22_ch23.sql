-- admin-panel/supabase/migrations/071_seed_dbms_sql_tutorial_ch21_ch22_ch23.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0099_seed_dbms_sql_tutorial_ch21_ch22_ch23.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — DBMS & SQL Tutorial: Chapters 21, 22, 23 (batch 8)
-- ============================================================================
-- WHAT / WHY
--   Eighth content batch, on top of 0091/063 (schema) + batches 1-7
--   (chapters 1-20, 250 topics). Adds Chapter 21 (Normalization and
--   Functional Dependencies, 18 topics — redundancy/anomalies, FD theory
--   incl. closures/candidate-key derivation/minimal cover, 1NF-5NF,
--   denormalization; conceptual, no coding problems), Chapter 22
--   (Transactions, 13 topics — transaction concept/boundaries/states, all
--   four ACID properties individually, COMMIT/ROLLBACK/SAVEPOINT with 3
--   verified SQL coding problems, autocommit, nested-transaction concepts),
--   Chapter 23 (Concurrency Control, 13 topics — schedules, conflict/view
--   serializability, recoverability hierarchy, lost-update/dirty-read/
--   non-repeatable-read/phantom-read anomalies; conceptual, no coding
--   problems) = 44 more topics, 352 more topic-quiz MCQs, 3 more Chapter
--   tests, and 3 more SQL coding problems (COMMIT/ROLLBACK/SAVEPOINT on
--   Chapter 22, all verified end-to-end against Paiza's live MySQL sandbox —
--   these are the first transaction-semantics coding problems in this
--   course, and required discovering that Paiza's guest MySQL defaults to
--   the non-transactional MyISAM engine; ENGINE=InnoDB is declared
--   explicitly in their schema so ROLLBACK/SAVEPOINT actually take effect).
--
--   Same content policy as batch 1: original, accurate DBMS content authored
--   from real subject knowledge, using the source file's chapter/topic
--   TITLES as the curriculum outline (its body text is unusable boilerplate).
--
--   The full-course test (pt-dbms-sql-course-test, 0092) needs NO changes —
--   its pool is computed live via practice_test_pool() (0091/063) and
--   automatically grows to include these 44 topics' questions.
--
-- IDEMPOTENT. Same guarantees as 0092/064: never duplicates, never
-- overwrites an admin's later publish/premium/visibility edits.
-- ----------------------------------------------------------------------------

-- ---- ordering guard ---------------------------------------------------------
do $guard$
begin
  if not exists (select 1 from public.learning_grids where lower(slug) = $dbt70001$dbms-sql-tutorial$dbt70001$) then
    raise exception '0099/071: dbms-sql-tutorial grid not found — apply 0092_seed_dbms_sql_tutorial_ch1_ch2_ch8.sql (admin 064) first.';
  end if;
  if to_regprocedure('public.practice_test_pool(text)') is null then
    raise exception '0099/071: DBMS-practice RPCs not found — apply 0091_dbms_sql_practice.sql (admin 063) first.';
  end if;
end
$guard$;

-- ===========================================================================
-- 1. SECTIONS — re-affirm all 43 (idempotent no-op for rows 0092 already set;
--    harmless if this migration is ever applied to a fresh project before 0092).
-- ===========================================================================
with g as (select id from public.learning_grids where lower(slug) = $dbt70002$dbms-sql-tutorial$dbt70002$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70003$Chapter 1: Database Foundations$dbt70003$, $dbt70004$chapter-1-database-foundations$dbt70004$, 1, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70005$dbms-sql-tutorial$dbt70005$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70006$Chapter 2: DBMS Architecture$dbt70006$, $dbt70007$chapter-2-dbms-architecture$dbt70007$, 2, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70008$dbms-sql-tutorial$dbt70008$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70009$Chapter 3: Data Models$dbt70009$, $dbt70010$chapter-3-data-models$dbt70010$, 3, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70011$dbms-sql-tutorial$dbt70011$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70012$Chapter 4: Relational Model$dbt70012$, $dbt70013$chapter-4-relational-model$dbt70013$, 4, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70014$dbms-sql-tutorial$dbt70014$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70015$Chapter 5: Keys and Integrity$dbt70015$, $dbt70016$chapter-5-keys-and-integrity$dbt70016$, 5, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70017$dbms-sql-tutorial$dbt70017$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70018$Chapter 6: ER and EER Modeling$dbt70018$, $dbt70019$chapter-6-er-and-eer-modeling$dbt70019$, 6, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70020$dbms-sql-tutorial$dbt70020$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70021$Chapter 7: Relational Algebra$dbt70021$, $dbt70022$chapter-7-relational-algebra$dbt70022$, 7, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70023$dbms-sql-tutorial$dbt70023$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70024$Chapter 8: SQL Fundamentals$dbt70024$, $dbt70025$chapter-8-sql-fundamentals$dbt70025$, 8, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70026$dbms-sql-tutorial$dbt70026$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70027$Chapter 9: DDL and Schema Design$dbt70027$, $dbt70028$chapter-9-ddl-and-schema-design$dbt70028$, 9, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70029$dbms-sql-tutorial$dbt70029$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70030$Chapter 10: SQL Constraints$dbt70030$, $dbt70031$chapter-10-sql-constraints$dbt70031$, 10, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70032$dbms-sql-tutorial$dbt70032$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70033$Chapter 11: DML and Data Modification$dbt70033$, $dbt70034$chapter-11-dml-and-data-modification$dbt70034$, 11, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70035$dbms-sql-tutorial$dbt70035$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70036$Chapter 12: SELECT and Filtering$dbt70036$, $dbt70037$chapter-12-select-and-filtering$dbt70037$, 12, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70038$dbms-sql-tutorial$dbt70038$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70039$Chapter 13: Sorting and Pagination$dbt70039$, $dbt70040$chapter-13-sorting-and-pagination$dbt70040$, 13, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70041$dbms-sql-tutorial$dbt70041$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70042$Chapter 14: SQL Functions$dbt70042$, $dbt70043$chapter-14-sql-functions$dbt70043$, 14, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70044$dbms-sql-tutorial$dbt70044$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70045$Chapter 15: GROUP BY and Aggregation$dbt70045$, $dbt70046$chapter-15-group-by-and-aggregation$dbt70046$, 15, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70047$dbms-sql-tutorial$dbt70047$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70048$Chapter 16: Joins$dbt70048$, $dbt70049$chapter-16-joins$dbt70049$, 16, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70050$dbms-sql-tutorial$dbt70050$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70051$Chapter 17: Subqueries$dbt70051$, $dbt70052$chapter-17-subqueries$dbt70052$, 17, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70053$dbms-sql-tutorial$dbt70053$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70054$Chapter 18: Set Operations$dbt70054$, $dbt70055$chapter-18-set-operations$dbt70055$, 18, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70056$dbms-sql-tutorial$dbt70056$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70057$Chapter 19: Views$dbt70057$, $dbt70058$chapter-19-views$dbt70058$, 19, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70059$dbms-sql-tutorial$dbt70059$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70060$Chapter 20: Indexes and Access Paths$dbt70060$, $dbt70061$chapter-20-indexes-and-access-paths$dbt70061$, 20, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70062$dbms-sql-tutorial$dbt70062$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70063$Chapter 21: Normalization and Functional Dependencies$dbt70063$, $dbt70064$chapter-21-normalization-and-functional-dependencies$dbt70064$, 21, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70065$dbms-sql-tutorial$dbt70065$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70066$Chapter 22: Transactions$dbt70066$, $dbt70067$chapter-22-transactions$dbt70067$, 22, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70068$dbms-sql-tutorial$dbt70068$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70069$Chapter 23: Concurrency Control$dbt70069$, $dbt70070$chapter-23-concurrency-control$dbt70070$, 23, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70071$dbms-sql-tutorial$dbt70071$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70072$Chapter 24: Locking Protocols$dbt70072$, $dbt70073$chapter-24-locking-protocols$dbt70073$, 24, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70074$dbms-sql-tutorial$dbt70074$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70075$Chapter 25: Isolation Levels$dbt70075$, $dbt70076$chapter-25-isolation-levels$dbt70076$, 25, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70077$dbms-sql-tutorial$dbt70077$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70078$Chapter 26: Recovery and Logging$dbt70078$, $dbt70079$chapter-26-recovery-and-logging$dbt70079$, 26, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70080$dbms-sql-tutorial$dbt70080$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70081$Chapter 27: Database Security$dbt70081$, $dbt70082$chapter-27-database-security$dbt70082$, 27, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70083$dbms-sql-tutorial$dbt70083$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70084$Chapter 28: Stored Procedures$dbt70084$, $dbt70085$chapter-28-stored-procedures$dbt70085$, 28, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70086$dbms-sql-tutorial$dbt70086$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70087$Chapter 29: Stored Functions$dbt70087$, $dbt70088$chapter-29-stored-functions$dbt70088$, 29, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70089$dbms-sql-tutorial$dbt70089$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70090$Chapter 30: Triggers$dbt70090$, $dbt70091$chapter-30-triggers$dbt70091$, 30, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70092$dbms-sql-tutorial$dbt70092$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70093$Chapter 31: Cursors$dbt70093$, $dbt70094$chapter-31-cursors$dbt70094$, 31, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70095$dbms-sql-tutorial$dbt70095$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70096$Chapter 32: Advanced SQL: CTE$dbt70096$, $dbt70097$chapter-32-advanced-sql-cte$dbt70097$, 32, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70098$dbms-sql-tutorial$dbt70098$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70099$Chapter 33: Advanced SQL: Window Functions$dbt70099$, $dbt70100$chapter-33-advanced-sql-window-functions$dbt70100$, 33, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70101$dbms-sql-tutorial$dbt70101$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70102$Chapter 34: Advanced SQL Patterns$dbt70102$, $dbt70103$chapter-34-advanced-sql-patterns$dbt70103$, 34, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70104$dbms-sql-tutorial$dbt70104$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70105$Chapter 35: Query Processing and Optimization$dbt70105$, $dbt70106$chapter-35-query-processing-and-optimization$dbt70106$, 35, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70107$dbms-sql-tutorial$dbt70107$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70108$Chapter 36: Physical Storage$dbt70108$, $dbt70109$chapter-36-physical-storage$dbt70109$, 36, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70110$dbms-sql-tutorial$dbt70110$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70111$Chapter 37: Advanced Index Structures$dbt70111$, $dbt70112$chapter-37-advanced-index-structures$dbt70112$, 37, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70113$dbms-sql-tutorial$dbt70113$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70114$Chapter 38: Distributed Databases$dbt70114$, $dbt70115$chapter-38-distributed-databases$dbt70115$, 38, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70116$dbms-sql-tutorial$dbt70116$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70117$Chapter 39: NoSQL Databases$dbt70117$, $dbt70118$chapter-39-nosql-databases$dbt70118$, 39, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70119$dbms-sql-tutorial$dbt70119$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70120$Chapter 40: Database Scaling$dbt70120$, $dbt70121$chapter-40-database-scaling$dbt70121$, 40, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70122$dbms-sql-tutorial$dbt70122$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70123$Chapter 41: Data Warehousing$dbt70123$, $dbt70124$chapter-41-data-warehousing$dbt70124$, 41, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70125$dbms-sql-tutorial$dbt70125$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70126$Chapter 42: Database Design Projects$dbt70126$, $dbt70127$chapter-42-database-design-projects$dbt70127$, 42, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70128$dbms-sql-tutorial$dbt70128$)
insert into public.learning_sections (grid_id, name, slug, sort_order, status, show_on_website, show_on_mobile)
select g.id, $dbt70129$Chapter 43: Interview and Placement Preparation$dbt70129$, $dbt70130$chapter-43-interview-and-placement-preparation$dbt70130$, 43, 'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. TOPICS + NOTES CONTENT + MCQ QUIZ per topic (chapters 21, 22, 23)
-- ===========================================================================
-- ---------------------------------------------------------------------------
-- Chapter 21: Normalization and Functional Dependencies
-- ---------------------------------------------------------------------------
-- 21.1 Data Redundancy
with g as (select id from public.learning_grids where lower(slug) = $dbt70131$dbms-sql-tutorial$dbt70131$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70132$chapter-21-normalization-and-functional-dependencies$dbt70132$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70133$Data Redundancy$dbt70133$, $dbt70134$data-redundancy$dbt70134$, '', 1, 'published', true, true, $dbt70135$dbms_sql_tutorial$dbt70135$, $dbt70136$chapter-21-normalization-and-functional-dependencies/data-redundancy$dbt70136$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70137$dbms_sql_tutorial$dbt70137$ and source_ref = $dbt70138$chapter-21-normalization-and-functional-dependencies/data-redundancy$dbt70138$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70139$Data Redundancy$dbt70139$, $dbt70140$### The Running Example

Every topic in this chapter uses the same badly-designed table, so keep it in mind — you will watch it get fixed step by step over the next 17 topics:

```
StudentCourse(StudentID, StudentName, CourseID, CourseName,
              InstructorID, InstructorName, InstructorOffice, EnrollmentDate)
```

One row per (student, course) enrollment. Sample data:

| StudentID | StudentName | CourseID | CourseName        | InstructorID | InstructorName | InstructorOffice | EnrollmentDate |
|-----------|-------------|----------|--------------------|--------------|-----------------|-------------------|----------------|
| S1        | Asha        | C1       | Database Systems   | I1           | Dr. Rao         | Room 204          | 2026-01-10     |
| S1        | Asha        | C2       | Operating Systems  | I2           | Dr. Mehta       | Room 310          | 2026-01-10     |
| S2        | Ravi        | C1       | Database Systems   | I1           | Dr. Rao         | Room 204          | 2026-01-11     |
| S2        | Ravi        | C3       | Computer Networks  | I3           | Dr. Singh       | Room 118          | 2026-01-11     |
| S3        | Kiran       | C1       | Database Systems   | I1           | Dr. Rao         | Room 204          | 2026-01-12     |
| S3        | Kiran       | C2       | Operating Systems  | I2           | Dr. Mehta       | Room 310          | 2026-01-12     |

### What Redundancy Looks Like Here

Look at the values, not just the schema:

- **"Asha"** appears twice (once for C1, once for C2) — every course she takes repeats her full name.
- **"Dr. Rao" / "Room 204"** appears three times, once per student enrolled in C1. If 200 students take Database Systems, "Dr. Rao, Room 204" is stored 200 times.
- **"Database Systems"** is stored once per enrolled student, not once per course.

This is data redundancy: the same fact (a student's name, an instructor's office) is physically stored in more places than the number of times that fact actually needs to exist. The fact "InstructorID I1 sits in Room 204" is a single real-world fact, but this schema stores it once per enrollment row that happens to touch I1.

### Why It's a Problem

1. **Wasted storage** — at scale (thousands of students, hundreds of courses) the repeated strings dwarf the actual unique information. A table that should hold ~500 distinct facts (150 students + 20 courses + 15 instructors) instead holds tens of thousands of duplicated field values.
2. **Inconsistency risk** — because the same fact is stored in multiple physical locations, nothing stops those copies from drifting apart. If "Dr. Rao" is corrected to "Dr. K. Rao" in the C1/S1 row but not the C1/S2 and C1/S3 rows, the database now contains contradictory answers to "what is I1's name?" depending on which row you read.
3. **It is the root cause of anomalies** — the insertion, update, and deletion anomalies (next three topics) are not separate problems; they are the direct *symptoms* of this redundancy. Fix the redundancy and the anomalies disappear.

### Edge Cases

- Redundancy caused by a **derived/computed column** (e.g., storing `AgeAtEnrollment` alongside `DateOfBirth`) is a different, sometimes-acceptable kind of redundancy — it's a deliberate denormalization (see 21.18), not an unnoticed design flaw.
- Not all repetition is redundancy — a foreign key value like `CourseID` appearing in every enrollment row is expected and necessary; it's the *dependent, non-key* attributes riding along with it (CourseName, InstructorName, InstructorOffice) that constitute the problem.

### Key Takeaways / Interview Angle

- **Q: Is redundancy the same thing as duplication of a primary key?** No — a key value must be repeated so rows can be linked (that's normal). Redundancy specifically means a *non-key, functionally-dependent fact* is duplicated unnecessarily.
- **Q: Why does normalization exist?** Its entire purpose is to organize attributes into relations such that each fact is stored exactly once, eliminating this redundancy and the anomalies it causes.
- **Q: Can redundancy ever be "zero"?** Fully normalized (BCNF/higher) schemas minimize but don't always reduce redundancy to mathematically zero in every case — but for this chapter's purposes, normalization is the redundancy-elimination process.$dbt70140$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70141$dbms_sql_tutorial_seed$dbt70141$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70142$dbms_sql_tutorial_seed$dbt70142$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70143$dbms-sql-tutorial$dbt70143$),
     t as (select id from public.learning_topics where source_kind = $dbt70144$dbms_sql_tutorial$dbt70144$ and source_ref = $dbt70145$chapter-21-normalization-and-functional-dependencies/data-redundancy$dbt70145$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70146$pt-dbms-sql-21-data-redundancy$dbt70146$, $dbt70147$Data Redundancy - Quick Test$dbt70147$, 'aptitude', 8, 8,
  $dbt70148$8 questions on Data Redundancy.$dbt70148$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70149$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70149$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70150$tq-dbms-sql-21-data-redundancy-1$dbt70150$, $dbt70151$pt-dbms-sql-21-data-redundancy$dbt70151$,
   $dbt70152$In the unnormalized StudentCourse table, why does 'Dr. Rao, Room 204' appear three times in the sample data?$dbt70152$,
   $dbt70153$["Because InstructorID is a multi-valued attribute", "Because three different students (S1, S2, S3) each enrolled in course C1, taught by instructor I1", "Because the table has a data-entry bug", "Because InstructorOffice is the primary key"]$dbt70153$::jsonb,
   1, $dbt70154$Each row is one (student, course) enrollment; since three students enrolled in C1 (taught by I1/Dr. Rao), his name and office are copied into all three rows — this is the redundancy.$dbt70154$, 1, 0),
  ($dbt70155$tq-dbms-sql-21-data-redundancy-2$dbt70155$, $dbt70156$pt-dbms-sql-21-data-redundancy$dbt70156$,
   $dbt70157$What single real-world fact does the repeated value 'Room 204' actually represent across the three C1 rows?$dbt70157$,
   $dbt70158$["Three separate facts, one per student", "One fact \u2014 instructor I1's office location \u2014 stored three times", "The room number of course C1 itself, unrelated to the instructor", "A fact that changes per enrollment date"]$dbt70158$::jsonb,
   1, $dbt70159$InstructorOffice is functionally dependent on InstructorID alone. It is one fact about I1, duplicated once for every enrollment row that happens to reference I1.$dbt70159$, 1, 1),
  ($dbt70160$tq-dbms-sql-21-data-redundancy-3$dbt70160$, $dbt70161$pt-dbms-sql-21-data-redundancy$dbt70161$,
   $dbt70162$Which of the following is the best definition of data redundancy in this context?$dbt70162$,
   $dbt70163$["Any attribute value that appears in more than one row of any table", "The same non-key fact being physically stored more times than the number of times it needs to exist", "The presence of a composite primary key", "Storing a foreign key in a child table"]$dbt70163$::jsonb,
   1, $dbt70164$Redundancy specifically refers to unnecessary duplication of non-key, dependent facts — not to key repetition, which is a normal and necessary part of relational linking.$dbt70164$, 1, 2),
  ($dbt70165$tq-dbms-sql-21-data-redundancy-4$dbt70165$, $dbt70166$pt-dbms-sql-21-data-redundancy$dbt70166$,
   $dbt70167$Which repeated value in the sample data is NOT an example of harmful redundancy?$dbt70167$,
   $dbt70168$["'Asha' appearing in both the S1/C1 and S1/C2 rows", "'Database Systems' appearing in the S1/C1, S2/C1, and S3/C1 rows", "'C1' appearing in the S1/C1, S2/C1, and S3/C1 rows as the CourseID value", "'Dr. Mehta' appearing in both the S1/C2 and S3/C2 rows"]$dbt70168$::jsonb,
   2, $dbt70169$CourseID is the key/linking attribute connecting enrollments to a course; its repetition is expected and necessary for the relationship, unlike the dependent non-key attributes (StudentName, CourseName, InstructorName) which are true redundancy.$dbt70169$, 1, 3),
  ($dbt70170$tq-dbms-sql-21-data-redundancy-5$dbt70170$, $dbt70171$pt-dbms-sql-21-data-redundancy$dbt70171$,
   $dbt70172$At scale (thousands of enrollments), what is the primary storage consequence of the unnormalized StudentCourse design?$dbt70172$,
   $dbt70173$["The table becomes impossible to query", "Facts about a small number of distinct students/courses/instructors get duplicated across many enrollment rows, inflating storage far beyond the unique information content", "Storage usage stays constant regardless of enrollment count", "Only the primary key columns grow in size"]$dbt70173$::jsonb,
   1, $dbt70174$A handful of unique instructor/course/student facts gets copied into every relevant enrollment row, so storage grows with the number of enrollments rather than the number of distinct facts.$dbt70174$, 1, 4),
  ($dbt70175$tq-dbms-sql-21-data-redundancy-6$dbt70175$, $dbt70176$pt-dbms-sql-21-data-redundancy$dbt70176$,
   $dbt70177$Which statement correctly relates redundancy to the anomalies covered in the next three topics?$dbt70177$,
   $dbt70178$["Anomalies and redundancy are unrelated database concepts", "Redundancy is a minor cosmetic issue that anomalies happen to co-occur with", "The insertion, update, and deletion anomalies are direct symptoms caused by the same underlying redundancy", "Anomalies only occur in tables with no redundancy"]$dbt70178$::jsonb,
   2, $dbt70179$Redundancy is the root cause; once the same fact is stored in multiple places, inserting, updating, or deleting rows can create the specific failure scenarios called anomalies.$dbt70179$, 1, 5),
  ($dbt70180$tq-dbms-sql-21-data-redundancy-7$dbt70180$, $dbt70181$pt-dbms-sql-21-data-redundancy$dbt70181$,
   $dbt70182$A table stores `AgeAtEnrollment` alongside `DateOfBirth` as a deliberately precomputed convenience column. How should this repetition/dependency be classified?$dbt70182$,
   $dbt70183$["It is unnoticed harmful redundancy exactly like the InstructorOffice case", "It is a deliberate denormalization decision, a different (and sometimes acceptable) category discussed later in this chapter", "It violates 1NF", "It is required by every normal form"]$dbt70183$::jsonb,
   1, $dbt70184$Deliberately storing a derived value for performance is denormalization (topic 21.18) — a conscious trade-off, distinct from the unplanned redundancy normalization aims to remove.$dbt70184$, 1, 6),
  ($dbt70185$tq-dbms-sql-21-data-redundancy-8$dbt70185$, $dbt70186$pt-dbms-sql-21-data-redundancy$dbt70186$,
   $dbt70187$Why is it misleading to say 'redundancy just means a value appears more than once in a table'?$dbt70187$,
   $dbt70188$["Because values never legitimately repeat in a relational table", "Because necessary repetition of key/foreign-key values (needed to express relationships) must be distinguished from unnecessary duplication of dependent, non-key facts", "Because redundancy only applies to numeric columns", "Because it is not misleading \u2014 that is the exact correct definition"]$dbt70188$::jsonb,
   1, $dbt70189$Foreign keys must repeat to represent relationships; that is not redundancy. Redundancy specifically means dependent facts (like an instructor's office) are copied more times than necessary.$dbt70189$, 1, 7)
on conflict (id) do nothing;

-- 21.2 Insertion Anomaly
with g as (select id from public.learning_grids where lower(slug) = $dbt70190$dbms-sql-tutorial$dbt70190$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70191$chapter-21-normalization-and-functional-dependencies$dbt70191$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70192$Insertion Anomaly$dbt70192$, $dbt70193$insertion-anomaly$dbt70193$, '', 2, 'published', true, true, $dbt70194$dbms_sql_tutorial$dbt70194$, $dbt70195$chapter-21-normalization-and-functional-dependencies/insertion-anomaly$dbt70195$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70196$dbms_sql_tutorial$dbt70196$ and source_ref = $dbt70197$chapter-21-normalization-and-functional-dependencies/insertion-anomaly$dbt70197$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70198$Insertion Anomaly$dbt70198$, $dbt70199$### Setting the Scene

Recall the running table:

```
StudentCourse(StudentID, StudentName, CourseID, CourseName,
              InstructorID, InstructorName, InstructorOffice, EnrollmentDate)
```

Every row exists only because a specific student enrolled in a specific course. That is the problem.

### The Failure Scenario

The university hires a new instructor, **Dr. Fernandez (I4)**, assigned to **Room 402**, who will start teaching **next semester** but has not yet been assigned any course, and — critically — no student has enrolled in anything he will teach yet.

Try to insert his information:

```
INSERT INTO StudentCourse (StudentID, StudentName, CourseID, CourseName,
                            InstructorID, InstructorName, InstructorOffice, EnrollmentDate)
VALUES (???, ???, ???, ???, 'I4', 'Dr. Fernandez', 'Room 402', ???)
```

There is no `StudentID`, no `CourseID`, no `EnrollmentDate` to put in this row — those columns are (part of) the table's primary key, and a relational table cannot hold a row with a null/missing primary key. You are forced into one of two bad choices:

1. **Refuse to record Dr. Fernandez at all** until some student enrolls in a course he teaches — but that means the database simply cannot represent a true, current fact ("Dr. Fernandez works here, office 402") that the university needs today (e.g., for payroll, or an internal directory).
2. **Invent fake placeholder values** (`StudentID = 'PENDING'`, `CourseID = 'TBD'`) — which corrupts the key and pollutes every future query ("how many students are enrolled?" now needs to filter out fake rows).

This inability to insert a fact about one entity (an instructor) without also having a fact about an unrelated entity (an enrollment) is the **insertion anomaly**.

### Why This Happens

The root cause is exactly the redundancy from 21.1: instructor facts (`InstructorName`, `InstructorOffice`) are not stored in their own table keyed by `InstructorID` — they are riding along inside a table whose key is `(StudentID, CourseID)`. Any fact that logically belongs to instructors alone gets trapped behind the requirement to also supply a student and a course.

The same problem strikes a brand-new **course with no students yet** (`CourseID = 'C5'`, `CourseName = 'Cloud Computing'`, assigned to `I2`, but zero enrollments so far) — you cannot record the course exists until someone enrolls.

### Edge Cases

- This is different from *not being allowed to insert a duplicate row* (a candidate-key violation) — the insertion anomaly is about being unable to insert *any* row representing a true fact, because the schema forces unrelated facts to travel together.
- A table that already has NULLs allowed in non-key columns does **not** fix this — the missing values here are in what would need to be the *key*, which by definition (entity integrity) cannot be null.

### Key Takeaways / Interview Angle

- **Q: Define insertion anomaly in one sentence.** You cannot insert a fact about one entity without artificially also having data for another, unrelated entity, because both are crammed into one table.
- **Q: How is it fixed?** By decomposing the table so each entity (Student, Course, Instructor) has its own relation with its own key — exactly what 2NF/3NF do later in this chapter (see 21.13, 21.14): an `Instructor(InstructorID, InstructorName, InstructorOffice)` table lets you insert Dr. Fernandez immediately, with no course or student required.
- **Q: Is this only about instructors?** No — the same anomaly applies to any entity subordinate to the composite key: e.g., a new `Course` with no enrollments yet.$dbt70199$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70200$dbms_sql_tutorial_seed$dbt70200$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70201$dbms_sql_tutorial_seed$dbt70201$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70202$dbms-sql-tutorial$dbt70202$),
     t as (select id from public.learning_topics where source_kind = $dbt70203$dbms_sql_tutorial$dbt70203$ and source_ref = $dbt70204$chapter-21-normalization-and-functional-dependencies/insertion-anomaly$dbt70204$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70205$pt-dbms-sql-21-insertion-anomaly$dbt70205$, $dbt70206$Insertion Anomaly - Quick Test$dbt70206$, 'aptitude', 8, 8,
  $dbt70207$8 questions on Insertion Anomaly.$dbt70207$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70208$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70208$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70209$tq-dbms-sql-21-insertion-anomaly-1$dbt70209$, $dbt70210$pt-dbms-sql-21-insertion-anomaly$dbt70210$,
   $dbt70211$Why can't Dr. Fernandez's details be inserted into the unnormalized StudentCourse table before he is assigned a course?$dbt70211$,
   $dbt70212$["Because InstructorName does not allow duplicate values", "Because StudentID and CourseID are part of the table's key and cannot be left null, but no enrollment exists yet to supply them", "Because the table has a maximum row limit", "Because InstructorOffice must always match an existing CourseName"]$dbt70212$::jsonb,
   1, $dbt70213$Since (StudentID, CourseID) forms the primary key, entity integrity forbids null key values — so a row with no student and no course cannot be inserted, even though it's the instructor's data that needs recording.$dbt70213$, 1, 0),
  ($dbt70214$tq-dbms-sql-21-insertion-anomaly-2$dbt70214$, $dbt70215$pt-dbms-sql-21-insertion-anomaly$dbt70215$,
   $dbt70216$What is the insertion anomaly, precisely?$dbt70216$,
   $dbt70217$["The inability to insert two rows with the same primary key", "The inability to insert a fact about one entity without also having unrelated data required by the key of another entity", "A performance slowdown when inserting many rows at once", "An error thrown when inserting NULL into a non-key column"]$dbt70217$::jsonb,
   1, $dbt70218$It specifically describes being blocked from recording a valid fact (like a new instructor) because the schema forces an unrelated fact (an enrollment) to exist first.$dbt70218$, 1, 1),
  ($dbt70219$tq-dbms-sql-21-insertion-anomaly-3$dbt70219$, $dbt70220$pt-dbms-sql-21-insertion-anomaly$dbt70220$,
   $dbt70221$A new course 'Cloud Computing' (C5) has been approved and assigned instructor I2, but no student has enrolled yet. What happens in the unnormalized schema?$dbt70221$,
   $dbt70222$["The course can be inserted normally with StudentID left blank", "The course's existence cannot be recorded until at least one student enrolls, because StudentID is part of the required key", "The course is automatically assigned a placeholder student", "This scenario cannot occur because CourseID is not part of the key"]$dbt70222$::jsonb,
   1, $dbt70223$Just like the instructor case, a course's own facts (CourseName, its instructor) are trapped behind the need for an enrollment row, so it can't be inserted independently.$dbt70223$, 1, 2),
  ($dbt70224$tq-dbms-sql-21-insertion-anomaly-4$dbt70224$, $dbt70225$pt-dbms-sql-21-insertion-anomaly$dbt70225$,
   $dbt70226$Which of the following is a commonly attempted but flawed workaround for the insertion anomaly?$dbt70226$,
   $dbt70227$["Adding a foreign key constraint", "Inserting placeholder/fake values like StudentID='PENDING' to satisfy the key requirement", "Normalizing the table into Student, Course, and Instructor relations", "Adding an index on InstructorID"]$dbt70227$::jsonb,
   1, $dbt70228$Using fake placeholder key values avoids the immediate error but corrupts the key's meaning and pollutes future queries — it's a workaround, not a real fix; the real fix is decomposition (2NF/3NF).$dbt70228$, 1, 3),
  ($dbt70229$tq-dbms-sql-21-insertion-anomaly-5$dbt70229$, $dbt70230$pt-dbms-sql-21-insertion-anomaly$dbt70230$,
   $dbt70231$Which schema change genuinely eliminates the insertion anomaly for instructor data?$dbt70231$,
   $dbt70232$["Making InstructorOffice nullable", "Creating a separate Instructor(InstructorID, InstructorName, InstructorOffice) relation so instructor facts can be inserted independent of any enrollment", "Adding a unique constraint on InstructorName", "Removing the EnrollmentDate column"]$dbt70232$::jsonb,
   1, $dbt70233$Once Instructor is its own relation keyed by InstructorID, a new instructor row can be inserted with no dependency on StudentID/CourseID at all — this is exactly the 3NF decomposition covered later.$dbt70233$, 1, 4),
  ($dbt70234$tq-dbms-sql-21-insertion-anomaly-6$dbt70234$, $dbt70235$pt-dbms-sql-21-insertion-anomaly$dbt70235$,
   $dbt70236$Is 'rejecting a duplicate primary key insert' the same thing as an insertion anomaly?$dbt70236$,
   $dbt70237$["Yes, they are identical concepts", "No \u2014 a duplicate-key rejection is a normal integrity constraint working correctly; the insertion anomaly is about being unable to record a valid, non-duplicate fact at all", "Yes, because both involve the INSERT statement", "No \u2014 insertion anomalies only happen with UPDATE statements"]$dbt70237$::jsonb,
   1, $dbt70238$A duplicate-key rejection is the database correctly enforcing uniqueness. The insertion anomaly is a design flaw that blocks a legitimate, unique fact from being stored because of an unrelated missing key component.$dbt70238$, 1, 5),
  ($dbt70239$tq-dbms-sql-21-insertion-anomaly-7$dbt70239$, $dbt70240$pt-dbms-sql-21-insertion-anomaly$dbt70240$,
   $dbt70241$Why does adding NULL-ability to InstructorOffice NOT fix the insertion anomaly?$dbt70241$,
   $dbt70242$["Because InstructorOffice was never nullable in any schema", "Because the blocking columns (StudentID, CourseID) are part of the primary key, and entity integrity forbids null primary key components regardless of other columns' nullability", "Because NULL values are illegal in all relational databases", "Because it would violate 3NF"]$dbt70242$::jsonb,
   1, $dbt70243$The problem isn't that InstructorOffice can't be null — it's that the *key* columns (StudentID, CourseID) can't be null, and those are exactly the values missing when only instructor data is known.$dbt70243$, 1, 6),
  ($dbt70244$tq-dbms-sql-21-insertion-anomaly-8$dbt70244$, $dbt70245$pt-dbms-sql-21-insertion-anomaly$dbt70245$,
   $dbt70246$In terms of root cause, the insertion anomaly is best described as:$dbt70246$,
   $dbt70247$["An unrelated, independent flaw from data redundancy", "A direct symptom of storing multiple entities' facts (student, course, instructor) in one table keyed by an unrelated composite key", "A hardware limitation of the database engine", "A consequence of using auto-incrementing keys"]$dbt70247$::jsonb,
   1, $dbt70248$Because instructor and course facts are riding along in a table keyed by (StudentID, CourseID), any entity's data that isn't yet tied to an enrollment cannot be inserted — the same redundancy from 21.1 causes this.$dbt70248$, 1, 7)
on conflict (id) do nothing;

-- 21.3 Update Anomaly
with g as (select id from public.learning_grids where lower(slug) = $dbt70249$dbms-sql-tutorial$dbt70249$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70250$chapter-21-normalization-and-functional-dependencies$dbt70250$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70251$Update Anomaly$dbt70251$, $dbt70252$update-anomaly$dbt70252$, '', 3, 'published', true, true, $dbt70253$dbms_sql_tutorial$dbt70253$, $dbt70254$chapter-21-normalization-and-functional-dependencies/update-anomaly$dbt70254$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70255$dbms_sql_tutorial$dbt70255$ and source_ref = $dbt70256$chapter-21-normalization-and-functional-dependencies/update-anomaly$dbt70256$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70257$Update Anomaly$dbt70257$, $dbt70258$### Setting the Scene

The same `StudentCourse` table, same rows as before. Dr. Rao (I1) currently sits in **Room 204**, and three rows reference him — the enrollments of S1, S2, and S3, all in course C1.

### The Failure Scenario

Dr. Rao moves to **Room 210**. This is *one* real-world fact changing. But because `InstructorOffice` is duplicated across every row that mentions I1, fixing it correctly requires updating **all three rows**:

```
UPDATE StudentCourse SET InstructorOffice = 'Room 210' WHERE InstructorID = 'I1';
```

If the application (or a careless analyst running manual SQL) instead does something narrower — say it updates only the row for S1 because that's the row visible on the current screen:

```
UPDATE StudentCourse SET InstructorOffice = 'Room 210'
WHERE StudentID = 'S1' AND CourseID = 'C1';
```

...the table now says Dr. Rao's office is **Room 210** in S1's row, but still **Room 204** in the S2 and S3 rows. The database cannot answer "what is I1's office?" with one consistent value — it depends entirely on which row happens to be read. This is the **update anomaly**: a single logical fact requires updating multiple physical rows, and any partial update leaves the data self-contradictory.

### Why This Happens

Because `InstructorOffice` is functionally dependent on `InstructorID` alone (see 21.5), but it is stored inside a table keyed by `(StudentID, CourseID)`, the same InstructorID value appears in N rows — one per enrolled student — so the same office value is physically copied N times. Updating "the fact" really means updating "all N copies of the fact," and a system correctness property (atomicity of *one* fact) has been turned into an operational multi-row synchronization problem.

### Edge Cases

- Even a "correct," fully-qualified `UPDATE ... WHERE InstructorID = 'I1'` that *does* update all matching rows is still doing more physical work than necessary (3 row rewrites for 1 logical change) — a properly normalized `Instructor` table would need exactly 1 row updated.
- This is distinct from the **insertion** anomaly (which blocks a valid insert) and the **deletion** anomaly (which causes accidental information loss on delete) — the update anomaly is specifically about *inconsistency risk during a modification* of an existing fact.
- Concurrent updates make it worse: if two different transactions each update a subset of I1's rows around the same time, a race condition can leave the office value in a genuinely ambiguous state even with correct application logic.

### Key Takeaways / Interview Angle

- **Q: Define the update anomaly in one line.** A single real-world fact change requires updating multiple duplicated rows, and any missed row creates inconsistent, contradictory data.
- **Q: How do you tell it apart from data redundancy itself?** Redundancy (21.1) is the *static* condition — the fact is stored many times. The update anomaly is the *dynamic* consequence — what goes wrong when you try to change that fact later.
- **Q: What is the permanent fix?** Move `InstructorOffice` into an `Instructor(InstructorID, InstructorName, InstructorOffice)` table (3NF, see 21.14), so moving Dr. Rao's office is a single-row `UPDATE` by `InstructorID`, with zero risk of partial-update inconsistency.$dbt70258$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70259$dbms_sql_tutorial_seed$dbt70259$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70260$dbms_sql_tutorial_seed$dbt70260$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70261$dbms-sql-tutorial$dbt70261$),
     t as (select id from public.learning_topics where source_kind = $dbt70262$dbms_sql_tutorial$dbt70262$ and source_ref = $dbt70263$chapter-21-normalization-and-functional-dependencies/update-anomaly$dbt70263$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70264$pt-dbms-sql-21-update-anomaly$dbt70264$, $dbt70265$Update Anomaly - Quick Test$dbt70265$, 'aptitude', 8, 8,
  $dbt70266$8 questions on Update Anomaly.$dbt70266$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70267$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70267$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70268$tq-dbms-sql-21-update-anomaly-1$dbt70268$, $dbt70269$pt-dbms-sql-21-update-anomaly$dbt70269$,
   $dbt70270$Dr. Rao moves from Room 204 to Room 210. In the unnormalized StudentCourse table, how many rows must be updated to reflect this correctly?$dbt70270$,
   $dbt70271$["Exactly one, since InstructorID is unique", "All rows referencing InstructorID = 'I1' (three rows in the sample data)", "Zero, since InstructorOffice is a derived value", "All rows in the table regardless of instructor"]$dbt70271$::jsonb,
   1, $dbt70272$InstructorOffice is duplicated in every row where InstructorID = 'I1', so all three (S1/C1, S2/C1, S3/C1) rows carry the value and all three must change together.$dbt70272$, 1, 0),
  ($dbt70273$tq-dbms-sql-21-update-anomaly-2$dbt70273$, $dbt70274$pt-dbms-sql-21-update-anomaly$dbt70274$,
   $dbt70275$What specifically defines an update anomaly?$dbt70275$,
   $dbt70276$["A query returning stale cached results", "A single logical fact being duplicated across multiple rows, such that updating it correctly requires touching every copy, and a partial update leaves the data inconsistent", "A failed INSERT due to a missing key value", "A row being permanently locked during a transaction"]$dbt70276$::jsonb,
   1, $dbt70277$The defining feature is the multi-row duplication of one fact combined with the risk that not all copies get updated, producing contradictory data.$dbt70277$, 1, 1),
  ($dbt70278$tq-dbms-sql-21-update-anomaly-3$dbt70278$, $dbt70279$pt-dbms-sql-21-update-anomaly$dbt70279$,
   $dbt70280$An UPDATE statement changes InstructorOffice only for the S1/C1 row, missing S2/C1 and S3/C1. What is the resulting state of the data?$dbt70280$,
   $dbt70281$["The table becomes invalid and rejects further queries", "The table now gives two different answers ('Room 210' and 'Room 204') for the same instructor I1's office, depending on which row is read", "The database automatically propagates the change to the other rows", "No inconsistency occurs since InstructorID is a foreign key"]$dbt70281$::jsonb,
   1, $dbt70282$This is exactly the anomaly: the same fact (I1's office) now has contradictory stored values across rows, because it was redundantly stored to begin with.$dbt70282$, 1, 2),
  ($dbt70283$tq-dbms-sql-21-update-anomaly-4$dbt70283$, $dbt70284$pt-dbms-sql-21-update-anomaly$dbt70284$,
   $dbt70285$Which of these correctly distinguishes the update anomaly from the insertion anomaly?$dbt70285$,
   $dbt70286$["They are the same anomaly with different names", "Insertion anomaly blocks adding a new valid fact; update anomaly risks inconsistency when changing an existing duplicated fact", "Update anomaly only applies to DELETE statements", "Insertion anomaly only occurs in normalized tables"]$dbt70286$::jsonb,
   1, $dbt70287$Insertion anomaly (21.2) is about being unable to insert a fact independently; update anomaly is about the risk of partial, inconsistent propagation of a change to an already-duplicated fact.$dbt70287$, 1, 3),
  ($dbt70288$tq-dbms-sql-21-update-anomaly-5$dbt70288$, $dbt70289$pt-dbms-sql-21-update-anomaly$dbt70289$,
   $dbt70290$Even if `UPDATE StudentCourse SET InstructorOffice = 'Room 210' WHERE InstructorID = 'I1'` correctly updates all matching rows, why is this still considered a symptom of poor design?$dbt70290$,
   $dbt70291$["Because WHERE clauses are inefficient in SQL", "Because it requires rewriting three physical rows for what is logically a single fact change, whereas a normalized Instructor table would need exactly one row updated", "Because it violates referential integrity", "Because InstructorID cannot appear in a WHERE clause"]$dbt70291$::jsonb,
   1, $dbt70292$Even a 'correct' broad update still does unnecessary work (N row rewrites for 1 logical fact) and still carries residual risk versus a normalized design where the fact lives in exactly one row.$dbt70292$, 1, 4),
  ($dbt70293$tq-dbms-sql-21-update-anomaly-6$dbt70293$, $dbt70294$pt-dbms-sql-21-update-anomaly$dbt70294$,
   $dbt70295$What makes the update anomaly worse under concurrent transactions?$dbt70295$,
   $dbt70296$["Concurrency has no effect on this anomaly", "Two transactions updating different subsets of the duplicated rows around the same time can leave the office value in a genuinely inconsistent state even with correct per-statement logic", "Concurrency automatically prevents anomalies via locking", "Update anomalies cannot occur in multi-user systems"]$dbt70296$::jsonb,
   1, $dbt70297$Because the fact exists in multiple rows, concurrent partial updates from different transactions can interleave and leave copies out of sync, compounding the anomaly.$dbt70297$, 1, 5),
  ($dbt70298$tq-dbms-sql-21-update-anomaly-7$dbt70298$, $dbt70299$pt-dbms-sql-21-update-anomaly$dbt70299$,
   $dbt70300$Which schema change permanently eliminates the update anomaly for instructor office changes?$dbt70300$,
   $dbt70301$["Adding a trigger that logs every UPDATE", "Moving InstructorOffice into its own Instructor(InstructorID, InstructorName, InstructorOffice) relation, so the fact exists in exactly one row per instructor", "Making InstructorOffice a computed column", "Removing the WHERE clause from all UPDATE statements"]$dbt70301$::jsonb,
   1, $dbt70302$Once InstructorOffice lives in a table keyed by InstructorID alone, changing an instructor's office is a single-row update with no duplicate copies to keep in sync.$dbt70302$, 1, 6),
  ($dbt70303$tq-dbms-sql-21-update-anomaly-8$dbt70303$, $dbt70304$pt-dbms-sql-21-update-anomaly$dbt70304$,
   $dbt70305$Which of the following changes to the StudentCourse table would NOT trigger an update anomaly risk?$dbt70305$,
   $dbt70306$["Changing InstructorOffice for instructor I1", "Changing CourseName for course C1", "Changing the EnrollmentDate of a single specific (StudentID, CourseID) enrollment", "Changing InstructorName for instructor I2"]$dbt70306$::jsonb,
   2, $dbt70307$EnrollmentDate depends on the whole composite key (StudentID, CourseID) and is unique to that one enrollment row — it isn't duplicated elsewhere, so changing it touches exactly one row and carries no update-anomaly risk.$dbt70307$, 1, 7)
on conflict (id) do nothing;

-- 21.4 Deletion Anomaly
with g as (select id from public.learning_grids where lower(slug) = $dbt70308$dbms-sql-tutorial$dbt70308$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70309$chapter-21-normalization-and-functional-dependencies$dbt70309$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70310$Deletion Anomaly$dbt70310$, $dbt70311$deletion-anomaly$dbt70311$, '', 4, 'published', true, true, $dbt70312$dbms_sql_tutorial$dbt70312$, $dbt70313$chapter-21-normalization-and-functional-dependencies/deletion-anomaly$dbt70313$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70314$dbms_sql_tutorial$dbt70314$ and source_ref = $dbt70315$chapter-21-normalization-and-functional-dependencies/deletion-anomaly$dbt70315$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70316$Deletion Anomaly$dbt70316$, $dbt70317$### Setting the Scene

Look again at the S2 row for course C3:

| StudentID | StudentName | CourseID | CourseName        | InstructorID | InstructorName | InstructorOffice | EnrollmentDate |
|-----------|-------------|----------|--------------------|--------------|-----------------|-------------------|----------------|
| S2        | Ravi        | C3       | Computer Networks  | I3           | Dr. Singh       | Room 118          | 2026-01-11     |

Ravi (S2) is the **only** student currently enrolled in Computer Networks (C3), taught by Dr. Singh (I3).

### The Failure Scenario

Suppose Ravi drops the course:

```
DELETE FROM StudentCourse WHERE StudentID = 'S2' AND CourseID = 'C3';
```

This single `DELETE` was meant to record one fact: "Ravi is no longer enrolled in C3." But because that row was the *only* row mentioning C3, the delete also silently erases:

- The fact that course **C3 ("Computer Networks") exists at all**.
- The fact that **I3 ("Dr. Singh") teaches**, and that his office is **Room 118**.

The database has no other row anywhere that stores "Computer Networks" or "Dr. Singh, Room 118," so once this row is gone, so is that information — even though Computer Networks the course and Dr. Singh the instructor both still exist in the real world. This is the **deletion anomaly**: removing one legitimate fact (an enrollment) accidentally destroys other, unrelated facts (a course's and an instructor's existence) purely because they happened to be stored in the same row.

### Why This Happens

The table conflates three logically independent facts into one row: "this student is enrolled," "this course exists," and "this instructor exists/works here." Deleting an enrollment is a normal, frequent operation (students drop courses constantly); it should never have the power to erase course or instructor master data. That power only exists because course/instructor data isn't kept in its own relation with its own lifecycle.

### Edge Cases

- The anomaly only manifests when the deleted row is the **last** row referencing that CourseID/InstructorID. If two other students were still enrolled in C3, deleting Ravi's row would just remove his enrollment and C3/Dr. Singh's data would survive in the other rows — but this is fragile: the schema's correctness *by accident* depends on there always being at least one other row, which is not guaranteed.
- This is different from an intentional `DELETE FROM Course WHERE CourseID = 'C3'` in a properly normalized design — that is a deliberate, explicit operation on the Course entity, not a side effect of an unrelated enrollment deletion.
- Cascading deletes (`ON DELETE CASCADE`) in a normalized design are a *controlled, explicit* version of "deleting one thing removes related things" — the anomaly here is the opposite: an *uncontrolled, implicit* loss of unrelated master data.

### Key Takeaways / Interview Angle

- **Q: Define the deletion anomaly in one line.** Deleting a row that represents one fact (an enrollment) unintentionally destroys other, independent facts (course/instructor existence) because they were never given their own table.
- **Q: How is it different from the insertion anomaly?** Insertion anomaly blocks you from *adding* an independent fact; deletion anomaly *destroys* an independent fact as an unwanted side effect of removing something else.
- **Q: What's the permanent fix?** Separate `Course` and `Instructor` into their own relations (2NF/3NF, see 21.13/21.14) so that deleting an `Enrollment` row can never touch `Course` or `Instructor` rows — each entity's lifecycle is now independent.$dbt70317$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70318$dbms_sql_tutorial_seed$dbt70318$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70319$dbms_sql_tutorial_seed$dbt70319$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70320$dbms-sql-tutorial$dbt70320$),
     t as (select id from public.learning_topics where source_kind = $dbt70321$dbms_sql_tutorial$dbt70321$ and source_ref = $dbt70322$chapter-21-normalization-and-functional-dependencies/deletion-anomaly$dbt70322$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70323$pt-dbms-sql-21-deletion-anomaly$dbt70323$, $dbt70324$Deletion Anomaly - Quick Test$dbt70324$, 'aptitude', 8, 8,
  $dbt70325$8 questions on Deletion Anomaly.$dbt70325$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70326$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70326$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70327$tq-dbms-sql-21-deletion-anomaly-1$dbt70327$, $dbt70328$pt-dbms-sql-21-deletion-anomaly$dbt70328$,
   $dbt70329$Ravi (S2) is the only student enrolled in C3. What happens if his enrollment row is deleted from the unnormalized StudentCourse table?$dbt70329$,
   $dbt70330$["Only the enrollment fact is removed; course and instructor data are preserved elsewhere", "The course (Computer Networks) and instructor (Dr. Singh, Room 118) facts are also lost, since no other row stores them", "The delete is rejected by the database automatically", "Only the CourseName field is deleted, InstructorID remains"]$dbt70330$::jsonb,
   1, $dbt70331$Since C3 and I3 only ever appear in that one row, deleting it erases the only record of the course's and instructor's existence — the deletion anomaly.$dbt70331$, 1, 0),
  ($dbt70332$tq-dbms-sql-21-deletion-anomaly-2$dbt70332$, $dbt70333$pt-dbms-sql-21-deletion-anomaly$dbt70333$,
   $dbt70334$What is the deletion anomaly, precisely?$dbt70334$,
   $dbt70335$["A DELETE statement running slower than expected", "The loss of independent, unrelated facts as an unintended side effect of deleting a row that represents a different fact", "A foreign key constraint blocking a DELETE", "The automatic cascading of deletes to child tables"]$dbt70335$::jsonb,
   1, $dbt70336$It specifically describes accidentally destroying facts (like course/instructor existence) that have nothing to do with the fact actually being deleted (an enrollment).$dbt70336$, 1, 1),
  ($dbt70337$tq-dbms-sql-21-deletion-anomaly-3$dbt70337$, $dbt70338$pt-dbms-sql-21-deletion-anomaly$dbt70338$,
   $dbt70339$If two other students besides Ravi were also enrolled in C3, and Ravi's enrollment row is deleted, what happens to the Computer Networks / Dr. Singh data?$dbt70339$,
   $dbt70340$["It is lost regardless of the other enrollments", "It survives, because it is still present in the other students' C3 rows \u2014 but this correctness is accidental, not guaranteed by the schema", "The database throws a referential integrity error", "It moves automatically to a backup table"]$dbt70340$::jsonb,
   1, $dbt70341$With other rows still referencing C3/I3, the data happens to survive — but this is fragile: nothing in the schema guarantees at least one other row will always exist.$dbt70341$, 1, 2),
  ($dbt70342$tq-dbms-sql-21-deletion-anomaly-4$dbt70342$, $dbt70343$pt-dbms-sql-21-deletion-anomaly$dbt70343$,
   $dbt70344$Which of the following best explains WHY the deletion anomaly occurs in this schema?$dbt70344$,
   $dbt70345$["Because DELETE statements are inherently unsafe in SQL", "Because three logically independent facts (enrollment, course existence, instructor existence) are conflated into a single row instead of separate relations", "Because CourseID is not indexed", "Because InstructorOffice is a nullable column"]$dbt70345$::jsonb,
   1, $dbt70346$The root cause is the same design flaw as the other anomalies: unrelated entities' facts are packed into one row, so removing one fact can take the others down with it.$dbt70346$, 1, 3),
  ($dbt70347$tq-dbms-sql-21-deletion-anomaly-5$dbt70347$, $dbt70348$pt-dbms-sql-21-deletion-anomaly$dbt70348$,
   $dbt70349$How does the deletion anomaly differ from a deliberate `DELETE FROM Course WHERE CourseID = 'C3'` in a properly normalized schema?$dbt70349$,
   $dbt70350$["They are functionally identical in every way", "The normalized delete is an explicit, intentional operation on the Course entity itself; the anomaly is an implicit, unintended loss of Course data as a side effect of deleting an Enrollment row", "The anomaly only happens in normalized schemas", "There is no difference \u2014 both always cascade to child tables"]$dbt70350$::jsonb,
   1, $dbt70351$In a normalized design, deleting a course is a conscious act on the Course table. The anomaly is specifically about losing course data unintentionally via an unrelated enrollment deletion.$dbt70351$, 1, 4),
  ($dbt70352$tq-dbms-sql-21-deletion-anomaly-6$dbt70352$, $dbt70353$pt-dbms-sql-21-deletion-anomaly$dbt70353$,
   $dbt70354$Is an `ON DELETE CASCADE` foreign key in a normalized schema the same problem as the deletion anomaly?$dbt70354$,
   $dbt70355$["Yes, both are unwanted and equally harmful", "No \u2014 CASCADE is a controlled, explicit, intentional rule about related-row cleanup; the deletion anomaly is an uncontrolled, implicit loss of unrelated master data", "Yes, because both involve DELETE statements", "No, because CASCADE never actually deletes any rows"]$dbt70355$::jsonb,
   1, $dbt70356$CASCADE is a deliberate design decision about how related child rows should behave; the anomaly is the accidental destruction of independent facts due to poor table design, which is a very different situation.$dbt70356$, 1, 5),
  ($dbt70357$tq-dbms-sql-21-deletion-anomaly-7$dbt70357$, $dbt70358$pt-dbms-sql-21-deletion-anomaly$dbt70358$,
   $dbt70359$Which decomposition eliminates the deletion anomaly for course and instructor data?$dbt70359$,
   $dbt70360$["Adding a NOT NULL constraint to CourseName", "Splitting Course and Instructor into their own relations, separate from Enrollment, so deleting an enrollment row can never remove course or instructor data", "Adding a composite index on (StudentID, CourseID)", "Renaming the CourseID column"]$dbt70360$::jsonb,
   1, $dbt70361$Once Course and Instructor exist as independent relations, an Enrollment delete only ever removes enrollment facts — course and instructor rows persist independently, as they should.$dbt70361$, 1, 6),
  ($dbt70362$tq-dbms-sql-21-deletion-anomaly-8$dbt70362$, $dbt70363$pt-dbms-sql-21-deletion-anomaly$dbt70363$,
   $dbt70364$A student's enrollment row is the last reference to a given CourseID. In the unnormalized design, what is the underlying reason this is even possible?$dbt70364$,
   $dbt70365$["Because CourseID is a foreign key with no ON DELETE rule", "Because CourseName and instructor data are stored redundantly inside the Enrollment-level row rather than in an independent Course relation with its own lifecycle", "Because the database engine automatically purges orphaned data", "Because StudentID is nullable"]$dbt70365$::jsonb,
   1, $dbt70366$The course/instructor facts have no independent existence in this schema — they only exist as attributes riding along on enrollment rows, so the last such row's deletion takes them with it.$dbt70366$, 1, 7)
on conflict (id) do nothing;

-- 21.5 Functional Dependency
with g as (select id from public.learning_grids where lower(slug) = $dbt70367$dbms-sql-tutorial$dbt70367$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70368$chapter-21-normalization-and-functional-dependencies$dbt70368$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70369$Functional Dependency$dbt70369$, $dbt70370$functional-dependency$dbt70370$, '', 5, 'published', true, true, $dbt70371$dbms_sql_tutorial$dbt70371$, $dbt70372$chapter-21-normalization-and-functional-dependencies/functional-dependency$dbt70372$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70373$dbms_sql_tutorial$dbt70373$ and source_ref = $dbt70374$chapter-21-normalization-and-functional-dependencies/functional-dependency$dbt70374$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70375$Functional Dependency$dbt70375$, $dbt70376$### Definition

A **functional dependency (FD)** X -> Y means: for any two rows in a valid instance of the relation, if they agree on X, they must also agree on Y. In other words, knowing the value of X always tells you the exact value of Y — X *determines* Y. X is called the **determinant**.

This is a statement about the *business rule/schema*, holding for every possible valid state of the data — not a coincidence that happens to be true in today's snapshot.

### The FDs in the Running Example

Look again at `StudentCourse(StudentID, StudentName, CourseID, CourseName, InstructorID, InstructorName, InstructorOffice, EnrollmentDate)` with the sample rows (S1 Asha, S2 Ravi, S3 Kiran; C1 Database Systems/I1 Dr. Rao/Room 204; C2 Operating Systems/I2 Dr. Mehta/Room 310; C3 Computer Networks/I3 Dr. Singh/Room 118).

The genuine functional dependencies that hold here are:

1. `StudentID -> StudentName` — every StudentID always maps to exactly one name (S1 always means Asha).
2. `CourseID -> CourseName` — C1 always means Database Systems.
3. `CourseID -> InstructorID` — C1 is always taught by I1 (one instructor of record per course, in this simplified model).
4. `InstructorID -> InstructorName` — I1 always means Dr. Rao.
5. `InstructorID -> InstructorOffice` — I1 always means Room 204.
6. `{StudentID, CourseID} -> EnrollmentDate` — the date a *specific* student enrolled in a *specific* course (this needs the whole pair; see 21.6).

Notice what is **not** a functional dependency: `StudentName -> StudentID` does **not** hold, even if every name in today's data happens to be unique — two different students could both be named "Asha" tomorrow. An FD must hold for every valid instance, not just be an accident of the current rows.

### Trivial vs. Non-Trivial

X -> Y is **trivial** if Y is a subset of X (e.g., `{StudentID, CourseID} -> StudentID` is trivially always true and tells you nothing new). All six FDs listed above are **non-trivial** — Y is not contained in X — which is why they carry real informational content and are the ones worth reasoning about.

### Edge Cases

- FDs are declared by understanding the *real-world business rule*, not discovered purely by eyeballing sample data — three sample rows can never prove an FD holds in general (they can only disprove one, by showing a counter-example).
- A composite determinant like `{StudentID, CourseID}` is still just "X" in the X -> Y notation — the FD concept doesn't care how many attributes are on the left, only that agreement on all of them forces agreement on Y.
- If `CourseID -> InstructorID` didn't hold — e.g., a course could be co-taught and its "instructor" varied by section — you would need a different, more granular key design; the FD is only valid because of the (simplified) business rule "one instructor of record per course."

### Key Takeaways / Interview Angle

- **Q: What's the difference between a functional dependency and just noticing repeated values?** Repeated values are a symptom (see 21.1). A functional dependency is the underlying *rule* that determines when values must repeat — normalization theory is built entirely on reasoning about these rules, not the specific data.
- **Q: Give an FD from the running example and say why it holds.** `InstructorID -> InstructorOffice` holds because, by policy, each instructor has exactly one assigned office — knowing I1 always tells you Room 204.
- **Q: Why does it matter that FDs must hold for ALL valid instances, not just current data?** Because schema design decisions (keys, normal forms) must be correct forever, not just for today's rows — a coincidental uniqueness in three sample rows is not a foundation for a database constraint.$dbt70376$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70377$dbms_sql_tutorial_seed$dbt70377$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70378$dbms_sql_tutorial_seed$dbt70378$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70379$dbms-sql-tutorial$dbt70379$),
     t as (select id from public.learning_topics where source_kind = $dbt70380$dbms_sql_tutorial$dbt70380$ and source_ref = $dbt70381$chapter-21-normalization-and-functional-dependencies/functional-dependency$dbt70381$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70382$pt-dbms-sql-21-functional-dependency$dbt70382$, $dbt70383$Functional Dependency - Quick Test$dbt70383$, 'aptitude', 8, 8,
  $dbt70384$8 questions on Functional Dependency.$dbt70384$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70385$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70385$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70386$tq-dbms-sql-21-functional-dependency-1$dbt70386$, $dbt70387$pt-dbms-sql-21-functional-dependency$dbt70387$,
   $dbt70388$Which of the following correctly states what the functional dependency InstructorID -> InstructorOffice means?$dbt70388$,
   $dbt70389$["Every office has exactly one instructor assigned to it", "For any given InstructorID value, the InstructorOffice value is always the same, in every valid instance of the table", "InstructorOffice values must be unique across all instructors", "InstructorID can be derived from InstructorOffice"]$dbt70389$::jsonb,
   1, $dbt70390$X -> Y means X determines Y: knowing InstructorID always tells you the same InstructorOffice value. It says nothing about the reverse direction.$dbt70390$, 1, 0),
  ($dbt70391$tq-dbms-sql-21-functional-dependency-2$dbt70391$, $dbt70392$pt-dbms-sql-21-functional-dependency$dbt70392$,
   $dbt70393$In the sample data, why does CourseID -> InstructorID hold?$dbt70393$,
   $dbt70394$["Because every course has a unique CourseName", "Because, under the simplified 'one instructor of record per course' rule, a given CourseID always maps to the same InstructorID (e.g., C1 always means I1)", "Because InstructorID values are alphabetically ordered", "Because EnrollmentDate depends on CourseID"]$dbt70394$::jsonb,
   1, $dbt70395$The FD holds because the business rule fixes exactly one instructor per course; every row with CourseID='C1' has InstructorID='I1'.$dbt70395$, 1, 1),
  ($dbt70396$tq-dbms-sql-21-functional-dependency-3$dbt70396$, $dbt70397$pt-dbms-sql-21-functional-dependency$dbt70397$,
   $dbt70398$Why does StudentName -> StudentID NOT hold as a functional dependency, even though today's sample data shows unique names (Asha, Ravi, Kiran)?$dbt70398$,
   $dbt70399$["Because StudentName is a numeric column", "Because an FD must hold for every valid instance of the data, and two different students could share the same name in the future, breaking the determination", "Because functional dependencies only apply to primary keys", "Because StudentName is a derived attribute"]$dbt70399$::jsonb,
   1, $dbt70400$A functional dependency is a permanent schema-level rule, not an accident of the current snapshot; name uniqueness today doesn't guarantee it always holds, so the FD is invalid.$dbt70400$, 1, 2),
  ($dbt70401$tq-dbms-sql-21-functional-dependency-4$dbt70401$, $dbt70402$pt-dbms-sql-21-functional-dependency$dbt70402$,
   $dbt70403$Which of the following is a trivial functional dependency?$dbt70403$,
   $dbt70404$["CourseID -> CourseName", "{StudentID, CourseID} -> StudentID", "InstructorID -> InstructorName", "StudentID -> StudentName"]$dbt70404$::jsonb,
   1, $dbt70405${StudentID, CourseID} -> StudentID is trivial because StudentID is already part of the left-hand side (Y is a subset of X) — it holds automatically and adds no new information.$dbt70405$, 1, 3),
  ($dbt70406$tq-dbms-sql-21-functional-dependency-5$dbt70406$, $dbt70407$pt-dbms-sql-21-functional-dependency$dbt70407$,
   $dbt70408$What is the determinant in the functional dependency {StudentID, CourseID} -> EnrollmentDate?$dbt70408$,
   $dbt70409$["EnrollmentDate", "StudentID alone", "{StudentID, CourseID} together, as a composite", "CourseID alone"]$dbt70409$::jsonb,
   2, $dbt70410$The determinant (the X side) is the whole composite {StudentID, CourseID} — the FD notation treats a multi-attribute left-hand side as a single determinant.$dbt70410$, 1, 4),
  ($dbt70411$tq-dbms-sql-21-functional-dependency-6$dbt70411$, $dbt70412$pt-dbms-sql-21-functional-dependency$dbt70412$,
   $dbt70413$Can a functional dependency ever be established just by inspecting three sample rows and finding no contradiction?$dbt70413$,
   $dbt70414$["Yes, three rows with no contradiction always prove the FD holds", "No \u2014 sample rows can disprove an FD (by showing a counter-example) but can never fully prove one holds for all future valid instances; that requires understanding the real-world business rule", "Yes, but only if the rows are sorted", "No, functional dependencies can never be verified by data at all"]$dbt70414$::jsonb,
   1, $dbt70415$FDs are asserted based on business rules that must hold universally; a finite sample can only ever falsify an FD, never conclusively prove it holds forever.$dbt70415$, 1, 5),
  ($dbt70416$tq-dbms-sql-21-functional-dependency-7$dbt70416$, $dbt70417$pt-dbms-sql-21-functional-dependency$dbt70417$,
   $dbt70418$If a university later allowed courses to be co-taught by multiple instructors of record, which FD from the running example would break?$dbt70418$,
   $dbt70419$["StudentID -> StudentName", "CourseID -> InstructorID (a single CourseID could now map to more than one InstructorID)", "InstructorID -> InstructorOffice", "{StudentID, CourseID} -> EnrollmentDate"]$dbt70419$::jsonb,
   1, $dbt70420$If a course could have multiple instructors, CourseID would no longer determine a single InstructorID value, invalidating that specific FD and requiring a schema redesign.$dbt70420$, 1, 6),
  ($dbt70421$tq-dbms-sql-21-functional-dependency-8$dbt70421$, $dbt70422$pt-dbms-sql-21-functional-dependency$dbt70422$,
   $dbt70423$Which statement best distinguishes a functional dependency from the redundancy discussed in 21.1?$dbt70423$,
   $dbt70424$["They are the same thing under two different names", "A functional dependency is the underlying business rule (X determines Y); redundancy is the physical symptom of storing Y's value multiple times when that rule is combined with an unrelated composite key", "Functional dependencies only exist in normalized tables", "Redundancy causes functional dependencies, not the other way around"]$dbt70424$::jsonb,
   1, $dbt70425$The FD is the abstract rule; redundancy is what happens when a table's key doesn't match that rule's determinant, forcing dependent values to be physically duplicated.$dbt70425$, 1, 7)
on conflict (id) do nothing;

-- 21.6 Full Functional Dependency
with g as (select id from public.learning_grids where lower(slug) = $dbt70426$dbms-sql-tutorial$dbt70426$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70427$chapter-21-normalization-and-functional-dependencies$dbt70427$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70428$Full Functional Dependency$dbt70428$, $dbt70429$full-functional-dependency$dbt70429$, '', 6, 'published', true, true, $dbt70430$dbms_sql_tutorial$dbt70430$, $dbt70431$chapter-21-normalization-and-functional-dependencies/full-functional-dependency$dbt70431$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70432$dbms_sql_tutorial$dbt70432$ and source_ref = $dbt70433$chapter-21-normalization-and-functional-dependencies/full-functional-dependency$dbt70433$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70434$Full Functional Dependency$dbt70434$, $dbt70435$### Definition

An attribute Y is **fully functionally dependent** on a composite determinant X if Y depends on the *entire* X, but not on any *proper subset* of X. Formally: X -> Y holds, and for every proper subset X' of X, X' -> Y does **not** hold.

This concept only becomes interesting when the determinant is composite (more than one attribute) — it's about whether you truly need *all* of the columns in the key to pin down Y, or whether some of them are dead weight.

### In the Running Example

The composite key of `StudentCourse` is `{StudentID, CourseID}`. Consider `EnrollmentDate`:

- Does `StudentID` alone determine `EnrollmentDate`? No — Asha (S1) has two different enrollment dates recorded conceptually depending on which course you mean (both happen to be 2026-01-10 here, but in general a student enrolls in different courses on different days). `StudentID` alone cannot tell you *which* course's enrollment date you're asking about.
- Does `CourseID` alone determine `EnrollmentDate`? No — for C1, S1 enrolled 2026-01-10, S2 enrolled 2026-01-11, and S3 enrolled 2026-01-12 — three different dates for the same course, so `CourseID` alone clearly doesn't fix the date.
- Does the full pair `{StudentID, CourseID}` determine `EnrollmentDate`? Yes — exactly one enrollment date exists for "Asha in Database Systems."

Since neither proper subset (`StudentID` alone, or `CourseID` alone) determines `EnrollmentDate`, but the full composite does, **`{StudentID, CourseID} -> EnrollmentDate` is a full functional dependency**.

### Contrast with 21.7 (Partial Dependency)

This is the mirror image of the next topic. `CourseName` is determined by `CourseID` *alone* — a proper subset of the key — so `{StudentID, CourseID} -> CourseName`, while technically true, is **not** a full functional dependency; it's a *partial* one, because you didn't need `StudentID` at all to pin down `CourseName`. Full functional dependency is exactly the property that 2NF requires every non-key attribute to have.

### Edge Cases

- Full functional dependency is only a meaningful question for **composite** keys. If the key were a single surrogate column (e.g., `EnrollmentID`), every non-key attribute is trivially "fully" dependent on it (there's no proper non-empty subset of a single-attribute key to compare against).
- Watch for accidental composite keys where one attribute is actually redundant for determining Y but *is* needed for uniqueness of the row itself (that's a normal, expected reason to keep both attributes in the key — full dependency is evaluated per non-key attribute, not for the key's own uniqueness requirement).

### Key Takeaways / Interview Angle

- **Q: What makes a dependency "full" rather than "partial"?** Full dependency requires the *entire* composite key — dropping any single attribute from the key breaks the determination. Partial dependency means some proper subset of the key already determines the attribute.
- **Q: Give a full functional dependency from the running example.** `{StudentID, CourseID} -> EnrollmentDate` — you need both the specific student and the specific course to know the enrollment date.
- **Q: Why does this matter for normalization?** 2NF (21.13) is defined precisely as: every non-key attribute must be fully functionally dependent on the whole key. Attributes that are only partially dependent (like `CourseName`) get moved out into their own relation.$dbt70435$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70436$dbms_sql_tutorial_seed$dbt70436$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70437$dbms_sql_tutorial_seed$dbt70437$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70438$dbms-sql-tutorial$dbt70438$),
     t as (select id from public.learning_topics where source_kind = $dbt70439$dbms_sql_tutorial$dbt70439$ and source_ref = $dbt70440$chapter-21-normalization-and-functional-dependencies/full-functional-dependency$dbt70440$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70441$pt-dbms-sql-21-full-functional-dependency$dbt70441$, $dbt70442$Full Functional Dependency - Quick Test$dbt70442$, 'aptitude', 8, 8,
  $dbt70443$8 questions on Full Functional Dependency.$dbt70443$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70444$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70444$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70445$tq-dbms-sql-21-full-functional-dependency-1$dbt70445$, $dbt70446$pt-dbms-sql-21-full-functional-dependency$dbt70446$,
   $dbt70447$Why is {StudentID, CourseID} -> EnrollmentDate classified as a FULL functional dependency?$dbt70447$,
   $dbt70448$["Because EnrollmentDate is a date data type", "Because neither StudentID alone nor CourseID alone determines EnrollmentDate \u2014 the entire composite key is required", "Because EnrollmentDate is part of the primary key", "Because CourseID alone already determines EnrollmentDate"]$dbt70448$::jsonb,
   1, $dbt70449$Full functional dependency means no proper subset of the composite key determines the attribute; here both StudentID alone and CourseID alone fail to pin down EnrollmentDate, only the pair does.$dbt70449$, 1, 0),
  ($dbt70450$tq-dbms-sql-21-full-functional-dependency-2$dbt70450$, $dbt70451$pt-dbms-sql-21-full-functional-dependency$dbt70451$,
   $dbt70452$In the sample data, C1 (Database Systems) has three different EnrollmentDate values (2026-01-10, 2026-01-11, 2026-01-12) across S1, S2, and S3. What does this prove?$dbt70452$,
   $dbt70453$["That CourseID alone determines EnrollmentDate", "That CourseID alone does NOT determine EnrollmentDate, ruling out CourseID as a sufficient determinant by itself", "That EnrollmentDate is not a valid attribute", "That StudentID alone determines EnrollmentDate"]$dbt70453$::jsonb,
   1, $dbt70454$If the same CourseID value corresponds to different EnrollmentDate values across rows, CourseID alone cannot be a determinant of EnrollmentDate — confirming the dependency needs the full composite key.$dbt70454$, 1, 1),
  ($dbt70455$tq-dbms-sql-21-full-functional-dependency-3$dbt70455$, $dbt70456$pt-dbms-sql-21-full-functional-dependency$dbt70456$,
   $dbt70457$For a full functional dependency to exist on a composite key X = {A, B}, what must be true?$dbt70457$,
   $dbt70458$["Both A -> Y and B -> Y must hold individually", "X -> Y must hold, AND neither A alone nor B alone may determine Y", "Y must be part of the key itself", "A and B must both be foreign keys"]$dbt70458$::jsonb,
   1, $dbt70459$Full functional dependency requires the whole composite determinant, with no proper subset (here, A alone or B alone) sufficient to determine Y on its own.$dbt70459$, 1, 2),
  ($dbt70460$tq-dbms-sql-21-full-functional-dependency-4$dbt70460$, $dbt70461$pt-dbms-sql-21-full-functional-dependency$dbt70461$,
   $dbt70462$Why is full functional dependency only a meaningful question when the key is composite (more than one attribute)?$dbt70462$,
   $dbt70463$["Because single-attribute keys never have functional dependencies", "Because with a single-attribute key there is no non-empty proper subset to compare against, so every dependency on it is trivially 'full'", "Because composite keys are always artificial/surrogate", "Because full functional dependency requires exactly two attributes in the key"]$dbt70463$::jsonb,
   1, $dbt70464$The 'full vs partial' distinction only makes sense when you can ask 'does some smaller subset of the key already determine this?' — a single-attribute key has no smaller non-empty subset to test.$dbt70464$, 1, 3),
  ($dbt70465$tq-dbms-sql-21-full-functional-dependency-5$dbt70465$, $dbt70466$pt-dbms-sql-21-full-functional-dependency$dbt70466$,
   $dbt70467$Which attribute in the running example is NOT fully dependent on {StudentID, CourseID} (i.e., is only partially dependent)?$dbt70467$,
   $dbt70468$["EnrollmentDate", "CourseName, since CourseID alone already determines it", "There are no partially dependent attributes in this table", "StudentID itself"]$dbt70468$::jsonb,
   1, $dbt70469$CourseName depends on CourseID alone, a proper subset of the composite key — that's a partial dependency (21.7), the opposite of full functional dependency.$dbt70469$, 1, 4),
  ($dbt70470$tq-dbms-sql-21-full-functional-dependency-6$dbt70470$, $dbt70471$pt-dbms-sql-21-full-functional-dependency$dbt70471$,
   $dbt70472$A table has key {OrderID, ProductID} and an attribute ShipDate that is the same for every ProductID within a given OrderID (the whole order ships together). Is ShipDate fully dependent on {OrderID, ProductID}?$dbt70472$,
   $dbt70473$["Yes, because it depends on the composite key", "No \u2014 since ShipDate is determined by OrderID alone (a proper subset), it is only partially dependent, not fully dependent, on the composite key", "Yes, because ShipDate is a date type", "No, because ShipDate cannot be functionally dependent on anything"]$dbt70473$::jsonb,
   1, $dbt70474$If OrderID alone already fixes ShipDate, the composite key is not fully necessary — this is a partial dependency, structurally identical to the CourseName situation in the running example.$dbt70474$, 1, 5),
  ($dbt70475$tq-dbms-sql-21-full-functional-dependency-7$dbt70475$, $dbt70476$pt-dbms-sql-21-full-functional-dependency$dbt70476$,
   $dbt70477$Why does full functional dependency matter for schema design, specifically for 2NF?$dbt70477$,
   $dbt70478$["It has no connection to normal forms", "2NF requires every non-key attribute to be fully functionally dependent on the whole key; attributes that are only partially dependent must be moved to a different relation", "Full functional dependency is only relevant to BCNF", "It determines whether a table needs a foreign key"]$dbt70478$::jsonb,
   1, $dbt70479$2NF is defined exactly in terms of full functional dependency — any attribute that is only partially dependent on the key violates 2NF and must be relocated.$dbt70479$, 1, 6),
  ($dbt70480$tq-dbms-sql-21-full-functional-dependency-8$dbt70480$, $dbt70481$pt-dbms-sql-21-full-functional-dependency$dbt70481$,
   $dbt70482$Is {StudentID, CourseID} -> StudentName a full functional dependency?$dbt70482$,
   $dbt70483$["Yes, because StudentID is part of the composite key", "No \u2014 StudentID alone already determines StudentName, so it is a partial dependency, not a full one", "Yes, because CourseID is required to determine StudentName", "There is not enough information to decide"]$dbt70483$::jsonb,
   1, $dbt70484$Since StudentID by itself (a proper subset of the composite key) determines StudentName, the dependency is partial, not full — CourseID adds nothing to the determination.$dbt70484$, 1, 7)
on conflict (id) do nothing;

-- 21.7 Partial Dependency
with g as (select id from public.learning_grids where lower(slug) = $dbt70485$dbms-sql-tutorial$dbt70485$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70486$chapter-21-normalization-and-functional-dependencies$dbt70486$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70487$Partial Dependency$dbt70487$, $dbt70488$partial-dependency$dbt70488$, '', 7, 'published', true, true, $dbt70489$dbms_sql_tutorial$dbt70489$, $dbt70490$chapter-21-normalization-and-functional-dependencies/partial-dependency$dbt70490$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70491$dbms_sql_tutorial$dbt70491$ and source_ref = $dbt70492$chapter-21-normalization-and-functional-dependencies/partial-dependency$dbt70492$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70493$Partial Dependency$dbt70493$, $dbt70494$### Definition

A **partial dependency** exists when a non-key attribute Y is functionally dependent on only *part* of a composite candidate key, rather than the whole key. It is the direct opposite of a full functional dependency (21.6).

### In the Running Example

The candidate key of `StudentCourse` is `{StudentID, CourseID}`. Two non-key attributes exhibit partial dependency:

- **`CourseName`**: does `CourseID` alone determine it? Yes — C1 always means "Database Systems," regardless of which student is looking at it. So `CourseID -> CourseName` holds even without `StudentID`. Since `CourseID` is a proper subset of the full key, `CourseName`'s dependency on `{StudentID, CourseID}` is *partial* — `StudentID` is irrelevant baggage.
- **`StudentName`**: symmetrically, `StudentID` alone determines it (`StudentID -> StudentName`). `CourseID` is irrelevant to knowing Asha's name.

Contrast with `EnrollmentDate` from 21.6: neither `StudentID` nor `CourseID` alone determines it — only the pair does — which is why `EnrollmentDate` is *fully* dependent, not partially.

### Why Partial Dependency Is a Problem

Partial dependency is exactly what causes the redundancy from 21.1. Because `CourseName` only actually needs `CourseID` to be determined, but it's stored in a table keyed by the *bigger* `{StudentID, CourseID}`, "Database Systems" ends up physically repeated once per enrolled student (three times for C1's three students) instead of once per course. The same happens to `StudentName`, `InstructorID`, `InstructorName`, and `InstructorOffice` — every non-key column here is partially dependent on the key except `EnrollmentDate`.

### The Fix (Preview of 21.13)

2NF eliminates partial dependency by relocating each partially-dependent attribute into a relation keyed by exactly the subset it truly depends on:

- `CourseName` (and the instructor chain) moves into `Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice)`.
- `StudentName` moves into `Student(StudentID, StudentName)`.
- Only the genuinely fully-dependent `EnrollmentDate` stays with the composite key, in `Enrollment(StudentID, CourseID, EnrollmentDate)`.

### Edge Cases

- Partial dependency is **only possible when the key is composite**. A table with a single-attribute primary key (e.g., a surrogate `EnrollmentID`) cannot have partial dependencies by definition — there's no proper non-empty subset of a one-attribute key.
- Don't confuse "partial dependency" with "partial/incomplete data" (nulls) — it is purely a statement about which subset of the key functionally determines an attribute, unrelated to missing values.
- If a relation has **multiple** candidate keys, partial dependency must be checked against every candidate key, not just the one chosen as primary key.

### Key Takeaways / Interview Angle

- **Q: Define partial dependency in one line.** A non-key attribute depends on only part of a composite key, not the whole thing.
- **Q: Which normal form specifically targets and removes partial dependency?** 2NF (21.13) — its entire definition is "1NF, plus no partial dependency."
- **Q: Name a partially-dependent attribute in the running example and its true determinant.** `CourseName` is partially dependent on `{StudentID, CourseID}` — its true, minimal determinant is `CourseID` alone.$dbt70494$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70495$dbms_sql_tutorial_seed$dbt70495$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70496$dbms_sql_tutorial_seed$dbt70496$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70497$dbms-sql-tutorial$dbt70497$),
     t as (select id from public.learning_topics where source_kind = $dbt70498$dbms_sql_tutorial$dbt70498$ and source_ref = $dbt70499$chapter-21-normalization-and-functional-dependencies/partial-dependency$dbt70499$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70500$pt-dbms-sql-21-partial-dependency$dbt70500$, $dbt70501$Partial Dependency - Quick Test$dbt70501$, 'aptitude', 8, 8,
  $dbt70502$8 questions on Partial Dependency.$dbt70502$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70503$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70503$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70504$tq-dbms-sql-21-partial-dependency-1$dbt70504$, $dbt70505$pt-dbms-sql-21-partial-dependency$dbt70505$,
   $dbt70506$Why is CourseName considered partially dependent on the key {StudentID, CourseID}?$dbt70506$,
   $dbt70507$["Because CourseName is a text field", "Because CourseID alone (a proper subset of the key) already determines CourseName, making StudentID unnecessary for that determination", "Because CourseName changes over time", "Because StudentID alone determines CourseName"]$dbt70507$::jsonb,
   1, $dbt70508$Partial dependency means the attribute only needs part of the composite key. CourseID alone fixes CourseName; StudentID contributes nothing to that determination.$dbt70508$, 1, 0),
  ($dbt70509$tq-dbms-sql-21-partial-dependency-2$dbt70509$, $dbt70510$pt-dbms-sql-21-partial-dependency$dbt70510$,
   $dbt70511$Which attribute in the running example is the ONLY one that is fully (not partially) dependent on {StudentID, CourseID}?$dbt70511$,
   $dbt70512$["StudentName", "CourseName", "EnrollmentDate", "InstructorOffice"]$dbt70512$::jsonb,
   2, $dbt70513$EnrollmentDate genuinely requires both StudentID and CourseID together; every other non-key attribute (StudentName, CourseName, InstructorID/Name/Office) is determined by just one part of the key.$dbt70513$, 1, 1),
  ($dbt70514$tq-dbms-sql-21-partial-dependency-3$dbt70514$, $dbt70515$pt-dbms-sql-21-partial-dependency$dbt70515$,
   $dbt70516$Why can a table with a single-attribute primary key (e.g., a surrogate EnrollmentID) never have a partial dependency?$dbt70516$,
   $dbt70517$["Because surrogate keys are always unique", "Because partial dependency requires a composite key with a proper non-empty subset to compare against, which a single-attribute key does not have", "Because surrogate keys are never referenced by foreign keys", "Because single-attribute keys are always non-numeric"]$dbt70517$::jsonb,
   1, $dbt70518$Partial dependency is defined relative to a composite key's proper subsets. A single-attribute key has no smaller non-empty subset, so the condition can never apply.$dbt70518$, 1, 2),
  ($dbt70519$tq-dbms-sql-21-partial-dependency-4$dbt70519$, $dbt70520$pt-dbms-sql-21-partial-dependency$dbt70520$,
   $dbt70521$What is the direct consequence of CourseName being partially dependent on the key, as seen in the sample data?$dbt70521$,
   $dbt70522$["CourseName cannot be queried", "'Database Systems' is physically repeated once per student enrolled in C1, instead of being stored once per course \u2014 the redundancy from topic 21.1", "CourseName becomes a foreign key", "The table automatically splits into two tables"]$dbt70522$::jsonb,
   1, $dbt70523$Because CourseName only needs CourseID but is stored in a table keyed by the bigger composite key, its value is duplicated across every row sharing that CourseID.$dbt70523$, 1, 3),
  ($dbt70524$tq-dbms-sql-21-partial-dependency-5$dbt70524$, $dbt70525$pt-dbms-sql-21-partial-dependency$dbt70525$,
   $dbt70526$Which of these statements about partial dependency is TRUE?$dbt70526$,
   $dbt70527$["It is unrelated to which normal form a table satisfies", "2NF is defined as 1NF plus the elimination of all partial dependencies on every candidate key", "Partial dependency can occur even with a single-attribute key", "Partial dependency refers to missing (NULL) values in a row"]$dbt70527$::jsonb,
   1, $dbt70528$2NF's definition is precisely: already in 1NF, and every non-key attribute is fully (not partially) dependent on each candidate key.$dbt70528$, 1, 4),
  ($dbt70529$tq-dbms-sql-21-partial-dependency-6$dbt70529$, $dbt70530$pt-dbms-sql-21-partial-dependency$dbt70530$,
   $dbt70531$If StudentCourse had TWO candidate keys instead of one, how should partial dependency be checked?$dbt70531$,
   $dbt70532$["Only against the chosen primary key", "Against every candidate key, since an attribute could be partially dependent on one candidate key even if fully dependent on another", "Partial dependency does not apply when there are multiple candidate keys", "Only against the candidate key with the fewest attributes"]$dbt70532$::jsonb,
   1, $dbt70533$2NF requires checking full/partial dependency against every candidate key of the relation, not just whichever one was designated primary.$dbt70533$, 1, 5),
  ($dbt70534$tq-dbms-sql-21-partial-dependency-7$dbt70534$, $dbt70535$pt-dbms-sql-21-partial-dependency$dbt70535$,
   $dbt70536$In the 2NF fix previewed for this table, which relation does CourseName end up in?$dbt70536$,
   $dbt70537$["Enrollment(StudentID, CourseID, EnrollmentDate)", "Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice)", "Student(StudentID, StudentName)", "It remains in the original composite-keyed table"]$dbt70537$::jsonb,
   1, $dbt70538$Since CourseName's true determinant is CourseID alone, it is relocated to a Course relation keyed by CourseID, removing the partial dependency.$dbt70538$, 1, 6),
  ($dbt70539$tq-dbms-sql-21-partial-dependency-8$dbt70539$, $dbt70540$pt-dbms-sql-21-partial-dependency$dbt70540$,
   $dbt70541$Which pair of attributes both exhibit partial dependency on {StudentID, CourseID} in the running example?$dbt70541$,
   $dbt70542$["EnrollmentDate and CourseName", "StudentName and CourseName", "StudentID and CourseID themselves", "EnrollmentDate and InstructorOffice"]$dbt70542$::jsonb,
   1, $dbt70543$StudentName depends on StudentID alone and CourseName depends on CourseID alone — both are determined by only part of the composite key, making both partial dependencies.$dbt70543$, 1, 7)
on conflict (id) do nothing;

-- 21.8 Transitive Dependency
with g as (select id from public.learning_grids where lower(slug) = $dbt70544$dbms-sql-tutorial$dbt70544$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70545$chapter-21-normalization-and-functional-dependencies$dbt70545$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70546$Transitive Dependency$dbt70546$, $dbt70547$transitive-dependency$dbt70547$, '', 8, 'published', true, true, $dbt70548$dbms_sql_tutorial$dbt70548$, $dbt70549$chapter-21-normalization-and-functional-dependencies/transitive-dependency$dbt70549$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70550$dbms_sql_tutorial$dbt70550$ and source_ref = $dbt70551$chapter-21-normalization-and-functional-dependencies/transitive-dependency$dbt70551$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70552$Transitive Dependency$dbt70552$, $dbt70553$### Definition

A **transitive dependency** exists when X -> Y and Y -> Z hold, and Z is not directly dependent on X except *through* Y (Y is not a candidate key, so this isn't just a normal key-to-key chain). In that situation, Z is said to be transitively dependent on X: X determines Z only indirectly, by way of Y.

### In the Running Example

Consider the chain, restricted to the `Course`-side attributes:

```
CourseID -> InstructorID -> InstructorOffice
```

- `CourseID -> InstructorID` holds (C1 is taught by I1).
- `InstructorID -> InstructorOffice` holds (I1 sits in Room 204).
- Therefore `CourseID -> InstructorOffice` also holds, but only *transitively* — there is no direct, independent business rule "a course determines an office"; it's true purely because the course determines its instructor, and the instructor determines the office. `InstructorID` is not itself a candidate key of the whole relation (it doesn't determine the students or enrollment dates), so this qualifies as a genuine transitive dependency, not just a chain of keys.

The same applies to `CourseID -> InstructorID -> InstructorName`.

### Why This Still Causes Anomalies (Even After 2NF)

Suppose the table had already been fixed for partial dependency (21.7) and instructor data was already moved into a `Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice)` relation (2NF). Even in *this* new table, `InstructorOffice` is still only there because of `InstructorID`, which is only there because of `CourseID` — it's fully dependent on the whole key `CourseID` (a single-attribute key here, so 2NF is trivially satisfied), yet the transitive chain still causes:

- **Update anomaly**: changing Dr. Rao's office still means updating every course row he teaches (if he teaches C1 and, hypothetically, another course too).
- **Insertion anomaly**: still can't add Dr. Fernandez without a course.
- **Redundancy**: his office is still repeated once per course he teaches.

This is precisely why 3NF exists as a *further* refinement beyond 2NF — 2NF only removes partial dependency on the key; it says nothing about chains of dependency among the non-key attributes themselves.

### The Fix (Preview of 21.14)

Split `InstructorName` and `InstructorOffice` out into their own `Instructor(InstructorID, InstructorName, InstructorOffice)` relation, leaving `Course(CourseID, CourseName, InstructorID)` with just a foreign key reference. Now `InstructorOffice` depends directly (non-transitively) on the key of the table it lives in.

### Edge Cases

- A transitive dependency requires the middle attribute (Y, here `InstructorID`) to be a **non-key** (or at least, not a candidate key of the relation being examined) — if Y itself were a candidate key, X -> Y -> Z would just be a normal, harmless chain through an alternate key (this exact nuance is what separates 3NF from the stricter BCNF, see 21.15).
- Transitive dependency is about non-key -> non-key chains ultimately rooted in the key; it says nothing about the key-to-immediate-attribute FDs themselves.

### Key Takeaways / Interview Angle

- **Q: Define transitive dependency in one line.** X determines Z only indirectly, via an intermediate non-key attribute Y (X -> Y -> Z), rather than directly.
- **Q: Give the exact transitive dependency from the running example.** `CourseID -> InstructorID -> InstructorOffice`, so `InstructorOffice` is transitively dependent on `CourseID`.
- **Q: Which normal form removes it?** 3NF (21.14) — defined as 2NF plus no transitive dependency on the key.$dbt70553$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70554$dbms_sql_tutorial_seed$dbt70554$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70555$dbms_sql_tutorial_seed$dbt70555$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70556$dbms-sql-tutorial$dbt70556$),
     t as (select id from public.learning_topics where source_kind = $dbt70557$dbms_sql_tutorial$dbt70557$ and source_ref = $dbt70558$chapter-21-normalization-and-functional-dependencies/transitive-dependency$dbt70558$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70559$pt-dbms-sql-21-transitive-dependency$dbt70559$, $dbt70560$Transitive Dependency - Quick Test$dbt70560$, 'aptitude', 8, 8,
  $dbt70561$8 questions on Transitive Dependency.$dbt70561$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70562$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70562$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70563$tq-dbms-sql-21-transitive-dependency-1$dbt70563$, $dbt70564$pt-dbms-sql-21-transitive-dependency$dbt70564$,
   $dbt70565$Which chain of functional dependencies demonstrates the transitive dependency in the running example?$dbt70565$,
   $dbt70566$["StudentID -> StudentName -> EnrollmentDate", "CourseID -> InstructorID -> InstructorOffice", "StudentID -> CourseID -> CourseName", "InstructorOffice -> InstructorID -> CourseID"]$dbt70566$::jsonb,
   1, $dbt70567$CourseID determines InstructorID, and InstructorID determines InstructorOffice, so InstructorOffice is only indirectly (transitively) dependent on CourseID.$dbt70567$, 1, 0),
  ($dbt70568$tq-dbms-sql-21-transitive-dependency-2$dbt70568$, $dbt70569$pt-dbms-sql-21-transitive-dependency$dbt70569$,
   $dbt70570$Why is InstructorOffice's dependency on CourseID called 'transitive' rather than 'direct'?$dbt70570$,
   $dbt70571$["Because InstructorOffice is a text field", "Because there is no independent business rule linking a course directly to an office \u2014 the link only exists because the course determines its instructor, and the instructor determines the office", "Because CourseID is a foreign key", "Because InstructorOffice values are numeric"]$dbt70571$::jsonb,
   1, $dbt70572$The dependency CourseID -> InstructorOffice is only true because it passes through the intermediate attribute InstructorID; there's no direct rule connecting courses to offices.$dbt70572$, 1, 1),
  ($dbt70573$tq-dbms-sql-21-transitive-dependency-3$dbt70573$, $dbt70574$pt-dbms-sql-21-transitive-dependency$dbt70574$,
   $dbt70575$What is required of the intermediate attribute Y (here, InstructorID) for X -> Y -> Z to count as a genuine transitive dependency (rather than a harmless key chain)?$dbt70575$,
   $dbt70576$["Y must be a foreign key referencing another table", "Y must NOT itself be a candidate key of the relation being examined", "Y must be nullable", "Y must be the same data type as Z"]$dbt70576$::jsonb,
   1, $dbt70577$If Y were itself a candidate key, X -> Y -> Z would just be a normal chain through an alternate key, not a problematic transitive dependency — this distinction is central to the 3NF/BCNF boundary.$dbt70577$, 1, 2),
  ($dbt70578$tq-dbms-sql-21-transitive-dependency-4$dbt70578$, $dbt70579$pt-dbms-sql-21-transitive-dependency$dbt70579$,
   $dbt70580$Suppose a table is already in 2NF (no partial dependency) but still has the chain CourseID -> InstructorID -> InstructorOffice. Which anomaly can STILL occur?$dbt70580$,
   $dbt70581$["None \u2014 2NF eliminates all anomalies", "An update anomaly: changing an instructor's office still requires updating every course row taught by that instructor", "An insertion anomaly for enrolling new students", "A deletion anomaly when dropping a single enrollment"]$dbt70581$::jsonb,
   1, $dbt70582$2NF only fixes partial dependency on the key; it does not address chains among non-key attributes, so the update anomaly for InstructorOffice can persist until 3NF removes the transitive dependency.$dbt70582$, 1, 3),
  ($dbt70583$tq-dbms-sql-21-transitive-dependency-5$dbt70583$, $dbt70584$pt-dbms-sql-21-transitive-dependency$dbt70584$,
   $dbt70585$Which decomposition removes the transitive dependency CourseID -> InstructorID -> InstructorOffice?$dbt70585$,
   $dbt70586$["Merging Course and Instructor into one wider table", "Splitting out Instructor(InstructorID, InstructorName, InstructorOffice) from Course, leaving Course(CourseID, CourseName, InstructorID) with just the foreign key", "Adding a unique index on InstructorOffice", "Removing InstructorID from the Course table entirely"]$dbt70586$::jsonb,
   1, $dbt70587$Once InstructorOffice lives in its own Instructor relation keyed directly by InstructorID, it is no longer transitively reached through CourseID.$dbt70587$, 1, 4),
  ($dbt70588$tq-dbms-sql-21-transitive-dependency-6$dbt70588$, $dbt70589$pt-dbms-sql-21-transitive-dependency$dbt70589$,
   $dbt70590$Which is the best one-line definition of transitive dependency?$dbt70590$,
   $dbt70591$["Any dependency involving three or more attributes", "A non-key attribute Z depends on the key only indirectly, through another non-key attribute Y, rather than directly", "A dependency that changes over time", "Two attributes that are both foreign keys"]$dbt70591$::jsonb,
   1, $dbt70592$Transitive dependency specifically describes an indirect chain (X -> Y -> Z) where Z's dependency on X passes through an intermediate non-key attribute Y.$dbt70592$, 1, 5),
  ($dbt70593$tq-dbms-sql-21-transitive-dependency-7$dbt70593$, $dbt70594$pt-dbms-sql-21-transitive-dependency$dbt70594$,
   $dbt70595$Which normal form is defined as '2NF plus no transitive dependency on the key'?$dbt70595$,
   $dbt70596$["1NF", "2NF", "3NF", "BCNF"]$dbt70596$::jsonb,
   2, $dbt70597$3NF's definition builds directly on 2NF by additionally requiring that no non-key attribute be transitively dependent on the key.$dbt70597$, 1, 6),
  ($dbt70598$tq-dbms-sql-21-transitive-dependency-8$dbt70598$, $dbt70599$pt-dbms-sql-21-transitive-dependency$dbt70599$,
   $dbt70600$In the fully-normalized schema (Student / Course / Instructor / Enrollment), why does Course(CourseID, CourseName, InstructorID) no longer have a transitive dependency problem for InstructorName or InstructorOffice?$dbt70600$,
   $dbt70601$["Because those attributes are deleted entirely", "Because InstructorName and InstructorOffice no longer live in the Course table at all \u2014 they now depend directly on InstructorID inside the separate Instructor table", "Because CourseID now directly determines InstructorOffice by rule", "Because Course now has a composite key"]$dbt70601$::jsonb,
   1, $dbt70602$Moving InstructorName/InstructorOffice into their own Instructor relation removes the transitive chain entirely — Course only keeps the foreign key InstructorID, with no dependent attribute traveling further.$dbt70602$, 1, 7)
on conflict (id) do nothing;

-- 21.9 Closure of Attributes
with g as (select id from public.learning_grids where lower(slug) = $dbt70603$dbms-sql-tutorial$dbt70603$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70604$chapter-21-normalization-and-functional-dependencies$dbt70604$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70605$Closure of Attributes$dbt70605$, $dbt70606$closure-of-attributes$dbt70606$, '', 9, 'published', true, true, $dbt70607$dbms_sql_tutorial$dbt70607$, $dbt70608$chapter-21-normalization-and-functional-dependencies/closure-of-attributes$dbt70608$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70609$dbms_sql_tutorial$dbt70609$ and source_ref = $dbt70610$chapter-21-normalization-and-functional-dependencies/closure-of-attributes$dbt70610$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70611$Closure of Attributes$dbt70611$, $dbt70612$### Definition

The **closure** of an attribute set X, written X+, is the set of *all* attributes functionally determined by X — directly or transitively — given a set of functional dependencies F. Computing closures is the core mechanical tool used to derive candidate keys (21.10) and minimal covers (21.11).

**Algorithm:** Start with `result = X`. Repeatedly scan the FD set: whenever some FD's left-hand side is already a subset of `result`, add its right-hand side to `result`. Stop when a full pass adds nothing new.

### The FD Set for the Running Example

```
F1: StudentID -> StudentName
F2: CourseID -> CourseName
F3: CourseID -> InstructorID
F4: InstructorID -> InstructorName
F5: InstructorID -> InstructorOffice
F6: {StudentID, CourseID} -> EnrollmentDate
```

### Worked Computation 1: {CourseID}+

- Start: `result = {CourseID}`
- F2 applies (CourseID subset of result) -> add CourseName: `result = {CourseID, CourseName}`
- F3 applies -> add InstructorID: `result = {CourseID, CourseName, InstructorID}`
- F4 applies (InstructorID now in result) -> add InstructorName: `result = {CourseID, CourseName, InstructorID, InstructorName}`
- F5 applies -> add InstructorOffice: `result = {CourseID, CourseName, InstructorID, InstructorName, InstructorOffice}`
- No more FDs apply (F1 needs StudentID, F6 needs StudentID too). **Stop.**

`{CourseID}+ = {CourseID, CourseName, InstructorID, InstructorName, InstructorOffice}` — five attributes, missing `StudentID`, `StudentName`, `EnrollmentDate`. Not all eight attributes, so `CourseID` alone does **not** determine everything.

### Worked Computation 2: {StudentID, CourseID}+

- Start: `result = {StudentID, CourseID}`
- F1 applies -> add StudentName
- F2 applies -> add CourseName
- F3 applies -> add InstructorID
- F4 applies -> add InstructorName
- F5 applies -> add InstructorOffice
- F6 applies (both StudentID and CourseID now in result) -> add EnrollmentDate
- `result = {StudentID, CourseID, StudentName, CourseName, InstructorID, InstructorName, InstructorOffice, EnrollmentDate}` — **all eight attributes.**

`{StudentID, CourseID}+ = ` the entire attribute set of the relation.

### Worked Computation 3: {StudentID, InstructorID}+

- Start: `result = {StudentID, InstructorID}`
- F1 applies -> add StudentName
- F4 applies -> add InstructorName
- F5 applies -> add InstructorOffice
- No FD has a left-hand side that is a subset of `{StudentID, InstructorID, StudentName, InstructorName, InstructorOffice}` and yields something new — `CourseID` is never produced because nothing in F determines CourseID from InstructorID (one instructor can teach multiple courses in general; only F3 goes CourseID -> InstructorID, not the reverse). **Stop.**

`{StudentID, InstructorID}+ = {StudentID, InstructorID, StudentName, InstructorName, InstructorOffice}` — missing `CourseID`, `CourseName`, `EnrollmentDate`. Not all attributes.

### Why This Matters

Closure computation is exactly how you *prove*, rather than guess, whether an attribute set is a candidate key (21.10): X is a candidate key if and only if X+ equals the full attribute set, and no proper subset of X also has that property.

### Edge Cases

- Order of applying FDs during the scan doesn't affect the final result — closure is deterministic regardless of the sequence in which applicable FDs are triggered, only requiring you repeat passes until nothing new is added.
- A common mistake is stopping too early — you must keep re-scanning the *entire* FD list on every pass, because an FD that didn't apply initially (like F4, F5 needing InstructorID) may become applicable only after an earlier FD (F3) adds `InstructorID` to the result.

### Key Takeaways / Interview Angle

- **Q: What is X+?** The complete set of attributes functionally determined by X, directly or transitively, under a given FD set.
- **Q: What does it mean if X+ equals all attributes of the relation?** X is a *superkey* — enough to identify every attribute in the relation uniquely (candidate-key status additionally requires minimality, see 21.10).
- **Q: Compute {CourseID}+ for the running example.** `{CourseID, CourseName, InstructorID, InstructorName, InstructorOffice}` — it reaches the instructor chain transitively but never reaches StudentID/StudentName/EnrollmentDate.$dbt70612$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70613$dbms_sql_tutorial_seed$dbt70613$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70614$dbms_sql_tutorial_seed$dbt70614$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70615$dbms-sql-tutorial$dbt70615$),
     t as (select id from public.learning_topics where source_kind = $dbt70616$dbms_sql_tutorial$dbt70616$ and source_ref = $dbt70617$chapter-21-normalization-and-functional-dependencies/closure-of-attributes$dbt70617$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70618$pt-dbms-sql-21-closure-of-attributes$dbt70618$, $dbt70619$Closure of Attributes - Quick Test$dbt70619$, 'aptitude', 8, 8,
  $dbt70620$8 questions on Closure of Attributes.$dbt70620$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70621$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70621$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70622$tq-dbms-sql-21-closure-of-attributes-1$dbt70622$, $dbt70623$pt-dbms-sql-21-closure-of-attributes$dbt70623$,
   $dbt70624$What does computing {CourseID}+ over the running example's FD set yield?$dbt70624$,
   $dbt70625$["All eight attributes of the relation", "{CourseID, CourseName, InstructorID, InstructorName, InstructorOffice} \u2014 five attributes, missing the student-side and EnrollmentDate", "Just {CourseID, CourseName}", "{CourseID, StudentID, StudentName}"]$dbt70625$::jsonb,
   1, $dbt70626$CourseID reaches CourseName and InstructorID directly, then InstructorName and InstructorOffice transitively via InstructorID — but nothing determines StudentID, StudentName, or EnrollmentDate from CourseID alone.$dbt70626$, 1, 0),
  ($dbt70627$tq-dbms-sql-21-closure-of-attributes-2$dbt70627$, $dbt70628$pt-dbms-sql-21-closure-of-attributes$dbt70628$,
   $dbt70629$Why does {StudentID, CourseID}+ equal the entire set of eight attributes?$dbt70629$,
   $dbt70630$["Because StudentID and CourseID are alphabetically first", "Because starting from both together, every FD in the set can eventually be applied: StudentName and CourseName directly, InstructorID/Name/Office via the transitive chain, and EnrollmentDate via the composite-key FD", "Because closures always equal all attributes", "Because CourseID alone already reaches everything"]$dbt70630$::jsonb,
   1, $dbt70631$Every attribute is reachable: F1, F2, F3 apply immediately, F4/F5 apply once InstructorID is added, and F6 applies since both StudentID and CourseID are present from the start.$dbt70631$, 1, 1),
  ($dbt70632$tq-dbms-sql-21-closure-of-attributes-3$dbt70632$, $dbt70633$pt-dbms-sql-21-closure-of-attributes$dbt70633$,
   $dbt70634$In computing {StudentID, InstructorID}+, why does the closure NOT include CourseID?$dbt70634$,
   $dbt70635$["Because CourseID is not part of any functional dependency", "Because no FD in the set has a left-hand side reachable from {StudentID, InstructorID} that produces CourseID \u2014 InstructorID determines InstructorName/Office, not CourseID, since one instructor can teach multiple courses", "Because StudentID and InstructorID are incompatible data types", "Because CourseID must always be listed first in a closure"]$dbt70635$::jsonb,
   1, $dbt70636$The FD set only has CourseID -> InstructorID, never the reverse; nothing derives CourseID from InstructorID, so the closure of {StudentID, InstructorID} stops short of including it.$dbt70636$, 1, 2),
  ($dbt70637$tq-dbms-sql-21-closure-of-attributes-4$dbt70637$, $dbt70638$pt-dbms-sql-21-closure-of-attributes$dbt70638$,
   $dbt70639$What is the correct general algorithm for computing X+?$dbt70639$,
   $dbt70640$["List every attribute in the relation regardless of FDs", "Start with result = X; repeatedly scan all FDs and add an FD's right-hand side whenever its left-hand side is already a subset of result, until a pass adds nothing new", "Apply only the first matching FD once and stop", "Compute it by counting the number of candidate keys"]$dbt70640$::jsonb,
   1, $dbt70641$Closure computation is an iterative fixed-point process: keep re-scanning the whole FD set, adding newly-determined attributes, until no more can be added.$dbt70641$, 1, 3),
  ($dbt70642$tq-dbms-sql-21-closure-of-attributes-5$dbt70642$, $dbt70643$pt-dbms-sql-21-closure-of-attributes$dbt70643$,
   $dbt70644$Why is it a mistake to stop the closure computation for {CourseID}+ right after applying F2 and F3 (before checking F4 and F5)?$dbt70644$,
   $dbt70645$["It is not a mistake \u2014 F4 and F5 never apply to CourseID's closure", "F4 and F5 only become applicable AFTER InstructorID (added by F3) is already in the result, so stopping early would incorrectly omit InstructorName and InstructorOffice", "Because F4 and F5 must always be applied before F2 and F3", "Because closure computations must process FDs in numerical order only"]$dbt70645$::jsonb,
   1, $dbt70646$Closure requires repeated passes: F4 (InstructorID -> InstructorName) can't fire until InstructorID has been added to the result by F3, so an early stop would miss transitively reachable attributes.$dbt70646$, 1, 4),
  ($dbt70647$tq-dbms-sql-21-closure-of-attributes-6$dbt70647$, $dbt70648$pt-dbms-sql-21-closure-of-attributes$dbt70648$,
   $dbt70649$If X+ turns out to equal the full set of attributes of the relation, what can be concluded about X?$dbt70649$,
   $dbt70650$["X is definitely a minimal candidate key", "X is a superkey (it functionally determines every attribute), though it may or may not be minimal", "X must be a foreign key", "X cannot contain more than two attributes"]$dbt70650$::jsonb,
   1, $dbt70651$X+ = all attributes proves X is a superkey. Whether X is a candidate key additionally requires checking that no proper subset of X also has this property (21.10).$dbt70651$, 1, 5),
  ($dbt70652$tq-dbms-sql-21-closure-of-attributes-7$dbt70652$, $dbt70653$pt-dbms-sql-21-closure-of-attributes$dbt70653$,
   $dbt70654$Does the order in which applicable functional dependencies are applied during closure computation change the final result of X+?$dbt70654$,
   $dbt70655$["Yes, applying FDs in a different order can yield a different final closure", "No \u2014 as long as every applicable FD is eventually applied across repeated passes, the final closure is the same regardless of order", "Yes, but only for composite determinants", "No, because only one FD can ever apply to a given attribute set"]$dbt70655$::jsonb,
   1, $dbt70656$Closure is a deterministic fixed point; the order of applying applicable FDs doesn't matter, only that the process continues until no pass adds anything new.$dbt70656$, 1, 6),
  ($dbt70657$tq-dbms-sql-21-closure-of-attributes-8$dbt70657$, $dbt70658$pt-dbms-sql-21-closure-of-attributes$dbt70658$,
   $dbt70659$What is {StudentID}+ alone (ignoring CourseID) over the running example's FD set?$dbt70659$,
   $dbt70660$["All eight attributes", "{StudentID, StudentName} only, since no other FD has StudentID alone (without CourseID) on its left-hand side", "{StudentID, CourseID, StudentName}", "The empty set"]$dbt70660$::jsonb,
   1, $dbt70661$Only F1 (StudentID -> StudentName) has StudentID as a subset of its left-hand side without needing CourseID; F6 requires the composite {StudentID, CourseID}, which isn't available here.$dbt70661$, 1, 7)
on conflict (id) do nothing;

-- 21.10 Candidate Key Derivation
with g as (select id from public.learning_grids where lower(slug) = $dbt70662$dbms-sql-tutorial$dbt70662$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70663$chapter-21-normalization-and-functional-dependencies$dbt70663$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70664$Candidate Key Derivation$dbt70664$, $dbt70665$candidate-key-derivation$dbt70665$, '', 10, 'published', true, true, $dbt70666$dbms_sql_tutorial$dbt70666$, $dbt70667$chapter-21-normalization-and-functional-dependencies/candidate-key-derivation$dbt70667$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70668$dbms_sql_tutorial$dbt70668$ and source_ref = $dbt70669$chapter-21-normalization-and-functional-dependencies/candidate-key-derivation$dbt70669$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70670$Candidate Key Derivation$dbt70670$, $dbt70671$### Definition

An attribute set K is a **candidate key** of a relation if and only if:

1. `K+` (the closure of K) equals the **entire** set of attributes of the relation (K is a *superkey*), **and**
2. **No proper subset** of K also has this property (K is *minimal* / irreducible).

This turns "what is the key?" from a guess into a formal, checkable computation using closures (21.9).

### Deriving the Candidate Key of StudentCourse

The relation is `StudentCourse(StudentID, StudentName, CourseID, CourseName, InstructorID, InstructorName, InstructorOffice, EnrollmentDate)` — 8 attributes — with the FD set from 21.9 (F1-F6).

**Step 1 — test single attributes.** From 21.9's computations: `{CourseID}+` has only 5 attributes, and `{StudentID}+` has only 2 (`{StudentID, StudentName}`). Neither reaches all 8, so no single attribute is a superkey. `InstructorID+` similarly only reaches `{InstructorID, InstructorName, InstructorOffice}` — 3 attributes. No single-attribute superkey exists.

**Step 2 — test the composite pair {StudentID, CourseID}.** From 21.9: `{StudentID, CourseID}+` = all 8 attributes. So this pair **is** a superkey.

**Step 3 — check minimality.** Is either proper subset also a superkey? `{StudentID}+` (2 attributes) and `{CourseID}+` (5 attributes) both fall short of all 8. Neither subset works alone, so `{StudentID, CourseID}` cannot be reduced further.

**Conclusion:** `{StudentID, CourseID}` satisfies both conditions — it is a **candidate key**.

**Step 4 — check for other candidate keys.** Could `{StudentID, InstructorID}` also be one? From 21.9, `{StudentID, InstructorID}+ = {StudentID, InstructorID, StudentName, InstructorName, InstructorOffice}` — only 5 attributes, missing `CourseID`, `CourseName`, `EnrollmentDate`. Not a superkey, so it's not a candidate key. Systematically testing every other combination of the 8 attributes turns up no other superkey smaller than or unrelated to `{StudentID, CourseID}`, so **`{StudentID, CourseID}` is the unique candidate key** of this (unnormalized/1NF) relation.

### Why This Formal Process Matters

Guessing a key by "it looks unique in the sample data" is unreliable (see 21.5's warning about coincidental uniqueness). Closure-based derivation is the only way to be *certain*, because it's grounded in the declared functional dependencies (the actual business rules), not the accidental contents of a few sample rows.

### Edge Cases

- A relation can have **multiple** candidate keys (e.g., if `StudentName` were guaranteed globally unique by policy, `{StudentName, CourseID}` might also become a superkey — though minimality would still need checking). This relation happens to have exactly one.
- **Prime attributes** are those that belong to *at least one* candidate key (`StudentID` and `CourseID` here). This distinction becomes essential for the subtle difference between 3NF and BCNF (21.15).
- Testing every subset of a relation with many attributes is exponential in the worst case; in practice, schema designers use the known FDs to prune obviously-insufficient candidates quickly (as done in Steps 1-2 above) rather than brute-forcing all 2^n subsets.

### Key Takeaways / Interview Angle

- **Q: State the two-part formal definition of a candidate key.** Its closure must equal all attributes (superkey), and no proper subset may also satisfy that (minimality).
- **Q: Why isn't {StudentID, InstructorID} a candidate key even though it contains "enough" attributes to feel key-like?** Its closure only reaches 5 of the 8 attributes — it never determines CourseID, CourseName, or EnrollmentDate, so it fails the superkey requirement outright.
- **Q: Why not just eyeball the sample data to find the key?** Because uniqueness in a handful of sample rows can be coincidental; only computing closures from the declared FDs guarantees correctness for all valid data, forever.$dbt70671$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70672$dbms_sql_tutorial_seed$dbt70672$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70673$dbms_sql_tutorial_seed$dbt70673$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70674$dbms-sql-tutorial$dbt70674$),
     t as (select id from public.learning_topics where source_kind = $dbt70675$dbms_sql_tutorial$dbt70675$ and source_ref = $dbt70676$chapter-21-normalization-and-functional-dependencies/candidate-key-derivation$dbt70676$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70677$pt-dbms-sql-21-candidate-key-derivation$dbt70677$, $dbt70678$Candidate Key Derivation - Quick Test$dbt70678$, 'aptitude', 8, 8,
  $dbt70679$8 questions on Candidate Key Derivation.$dbt70679$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70680$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70680$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70681$tq-dbms-sql-21-candidate-key-derivation-1$dbt70681$, $dbt70682$pt-dbms-sql-21-candidate-key-derivation$dbt70682$,
   $dbt70683$What two conditions must an attribute set K satisfy to be a candidate key?$dbt70683$,
   $dbt70684$["K must be a single attribute, and it must be numeric", "K+ must equal all attributes of the relation (superkey), and no proper subset of K may also satisfy that (minimality)", "K must appear first in the CREATE TABLE statement", "K must have no NULL values ever inserted"]$dbt70684$::jsonb,
   1, $dbt70685$Candidate key status requires both being a superkey (closure reaches everything) and being minimal (no smaller subset also works).$dbt70685$, 1, 0),
  ($dbt70686$tq-dbms-sql-21-candidate-key-derivation-2$dbt70686$, $dbt70687$pt-dbms-sql-21-candidate-key-derivation$dbt70687$,
   $dbt70688$Why does {CourseID} alone fail to be a candidate key of StudentCourse?$dbt70688$,
   $dbt70689$["Because CourseID is a foreign key by convention", "Because {CourseID}+ only reaches 5 of the 8 attributes, never determining StudentID, StudentName, or EnrollmentDate", "Because CourseID values are not unique in the sample data", "Because CourseID must always be paired with InstructorID"]$dbt70689$::jsonb,
   1, $dbt70690$Its closure {CourseID, CourseName, InstructorID, InstructorName, InstructorOffice} falls short of all 8 attributes, so CourseID alone is not even a superkey, let alone a candidate key.$dbt70690$, 1, 1),
  ($dbt70691$tq-dbms-sql-21-candidate-key-derivation-3$dbt70691$, $dbt70692$pt-dbms-sql-21-candidate-key-derivation$dbt70692$,
   $dbt70693$Why is {StudentID, CourseID} confirmed as a candidate key rather than merely a superkey?$dbt70693$,
   $dbt70694$["Because its closure reaches all 8 attributes AND neither {StudentID} alone nor {CourseID} alone also reaches all 8 (minimality holds)", "Because it was the first pair tested", "Because StudentID and CourseID are both integers", "Because it is listed first in the schema"]$dbt70694$::jsonb,
   0, $dbt70695$Superkey status alone isn't enough — minimality must also be verified by checking that no proper subset shares the same closure-reaches-everything property, which holds here.$dbt70695$, 1, 2),
  ($dbt70696$tq-dbms-sql-21-candidate-key-derivation-4$dbt70696$, $dbt70697$pt-dbms-sql-21-candidate-key-derivation$dbt70697$,
   $dbt70698$Why does {StudentID, InstructorID} fail to qualify as a candidate key?$dbt70698$,
   $dbt70699$["Because it contains too many attributes", "Because its closure only reaches 5 attributes (missing CourseID, CourseName, EnrollmentDate) \u2014 it is not even a superkey", "Because InstructorID is never part of any candidate key", "Because StudentID cannot be combined with InstructorID in any FD"]$dbt70699$::jsonb,
   1, $dbt70700$No FD lets you derive CourseID from InstructorID (one instructor can teach several courses), so this pair's closure stops well short of all attributes and fails the superkey test outright.$dbt70700$, 1, 3),
  ($dbt70701$tq-dbms-sql-21-candidate-key-derivation-5$dbt70701$, $dbt70702$pt-dbms-sql-21-candidate-key-derivation$dbt70702$,
   $dbt70703$What is a 'prime attribute'?$dbt70703$,
   $dbt70704$["Any attribute with a numeric data type", "An attribute that belongs to at least one candidate key of the relation", "An attribute that is never null", "The first attribute listed in the CREATE TABLE statement"]$dbt70704$::jsonb,
   1, $dbt70705$Prime attributes are those participating in some candidate key — here, StudentID and CourseID are prime, and this classification matters later for the 3NF/BCNF distinction.$dbt70705$, 1, 4),
  ($dbt70706$tq-dbms-sql-21-candidate-key-derivation-6$dbt70706$, $dbt70707$pt-dbms-sql-21-candidate-key-derivation$dbt70707$,
   $dbt70708$Why is deriving a candidate key via closure computation more reliable than eyeballing sample data for uniqueness?$dbt70708$,
   $dbt70709$["It isn't more reliable \u2014 sample data is always sufficient", "Sample data uniqueness could be coincidental to the current rows, while closure computation is grounded in the declared functional dependencies (business rules) that must hold for all valid data", "Closure computation is faster to perform by hand", "Eyeballing data always produces the same answer as closure computation"]$dbt70709$::jsonb,
   1, $dbt70710$A few rows might show unique values purely by chance; only reasoning from the actual FDs (permanent business rules) guarantees the key holds for every possible valid instance.$dbt70710$, 1, 5),
  ($dbt70711$tq-dbms-sql-21-candidate-key-derivation-7$dbt70711$, $dbt70712$pt-dbms-sql-21-candidate-key-derivation$dbt70712$,
   $dbt70713$In the worst case, why can brute-force candidate key derivation become expensive for a relation with many attributes?$dbt70713$,
   $dbt70714$["Because closures cannot be computed for more than 3 attributes", "Because testing every possible subset of n attributes is exponential (2^n combinations) in the worst case, though known FDs let designers prune obviously-insufficient candidates quickly in practice", "Because SQL does not support composite keys", "Because functional dependencies expire after a fixed number of rows"]$dbt70714$::jsonb,
   1, $dbt70715$Exhaustively checking every subset scales exponentially with attribute count, but in practice you can eliminate subsets quickly once their closures are seen to fall short, as shown in the worked steps.$dbt70715$, 1, 6),
  ($dbt70716$tq-dbms-sql-21-candidate-key-derivation-8$dbt70716$, $dbt70717$pt-dbms-sql-21-candidate-key-derivation$dbt70717$,
   $dbt70718$For the StudentCourse relation, how many distinct candidate keys are there?$dbt70718$,
   $dbt70719$["Three: {StudentID}, {CourseID}, and {InstructorID}", "Exactly one: {StudentID, CourseID}", "Two: {StudentID, CourseID} and {StudentID, InstructorID}", "None \u2014 the relation has no candidate key"]$dbt70719$::jsonb,
   1, $dbt70720$Systematic closure testing shows only {StudentID, CourseID} reaches all 8 attributes with no smaller subset also doing so — it is the unique candidate key of this relation.$dbt70720$, 1, 7)
on conflict (id) do nothing;

-- 21.11 Minimal Cover
with g as (select id from public.learning_grids where lower(slug) = $dbt70721$dbms-sql-tutorial$dbt70721$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70722$chapter-21-normalization-and-functional-dependencies$dbt70722$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70723$Minimal Cover$dbt70723$, $dbt70724$minimal-cover$dbt70724$, '', 11, 'published', true, true, $dbt70725$dbms_sql_tutorial$dbt70725$, $dbt70726$chapter-21-normalization-and-functional-dependencies/minimal-cover$dbt70726$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70727$dbms_sql_tutorial$dbt70727$ and source_ref = $dbt70728$chapter-21-normalization-and-functional-dependencies/minimal-cover$dbt70728$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70729$Minimal Cover$dbt70729$, $dbt70730$### Definition

A **minimal cover** (also called a canonical cover) of a set of functional dependencies F is an equivalent set F_min such that:

1. Every FD in F_min has a **single attribute** on the right-hand side.
2. No FD in F_min has an **extraneous attribute** on the left-hand side (removing any LHS attribute would change what the FD determines).
3. No FD in F_min is **redundant** (removable without changing the closure of the whole set — i.e., it's already implied by the others).

F_min is equivalent to F (same overall closure behavior) but contains no wasted or derivable information — every FD in it is necessary.

### A Naive (Non-Minimal) Starting Set

Suppose a junior designer, working from the running example, wrote down these "obvious-looking" dependencies instead of the clean set from 21.5:

```
G1: StudentID -> StudentName
G2: CourseID -> CourseName
G3: CourseID -> InstructorID
G4: InstructorID -> InstructorName
G5: InstructorID -> InstructorOffice
G6: CourseID -> InstructorName          (added because "C1 always implies Dr. Rao")
G7: CourseID -> InstructorOffice        (added because "C1 always implies Room 204")
G8: {StudentID, CourseID} -> EnrollmentDate
G9: {StudentID, CourseID} -> StudentName (added out of habit, thinking "the whole key determines everything")
```

### Reducing G to Its Minimal Cover

**Step 1 — check for extraneous left-hand-side attributes.** Look at G9: `{StudentID, CourseID} -> StudentName`. Does `StudentID` alone already determine `StudentName`? Yes (G1). So `CourseID` is extraneous in G9 — it reduces to `StudentID -> StudentName`, which is now a duplicate of G1. **Drop G9.**

**Step 2 — check for redundant FDs (right-hand side already derivable from the rest).** Is G6 (`CourseID -> InstructorName`) implied by the remaining set? Compute `{CourseID}+` using only G2, G3, G4, G5, G8: it reaches `InstructorID` (via G3) then `InstructorName` (via G4) — so `CourseID -> InstructorName` is already derivable transitively. **G6 is redundant — drop it.** By identical reasoning, `{CourseID}+` also reaches `InstructorOffice` via G5, so **G7 is redundant too — drop it.**

**Step 3 — confirm single-attribute RHS.** All remaining FDs (G1-G5, G8) already have single-attribute right-hand sides — no splitting needed.

**Result — the minimal cover:**

```
StudentID -> StudentName
CourseID -> CourseName
CourseID -> InstructorID
InstructorID -> InstructorName
InstructorID -> InstructorOffice
{StudentID, CourseID} -> EnrollmentDate
```

This is exactly the clean FD set (F1-F6) used throughout 21.5-21.10 — it was the minimal cover all along; G6, G7, and G9 were noise that added no new information.

### Why Minimal Cover Matters

Schema-design algorithms (like the standard 3NF synthesis algorithm) operate directly on a minimal cover — feeding them a redundant FD set can produce extra, unnecessary tables or miss the true dependency structure. Minimal cover is also what makes candidate-key derivation (21.10) and normal-form checking tractable: reasoning about 6 necessary FDs is far easier than reasoning about 9 FDs, three of which say nothing new.

### Edge Cases

- A relation can have **more than one** valid minimal cover (the reduction order can matter in more complex FD sets) — but all valid minimal covers are equivalent in the total closure they produce, even if they look syntactically different.
- Removing an FD is only valid if the closure of the *entire remaining set* is unchanged — you must recompute closures after each removal, not just visually guess "this looks redundant."

### Key Takeaways / Interview Angle

- **Q: List the three properties a minimal cover must have.** Singleton right-hand sides, no extraneous left-hand-side attributes, no redundant (derivable) FDs.
- **Q: Why was CourseID -> InstructorName dropped from the naive set?** Because it's already implied transitively by CourseID -> InstructorID and InstructorID -> InstructorName — keeping it added no new information.
- **Q: What is minimal cover used for in practice?** As the clean input to normalization algorithms (3NF synthesis, candidate key finding) — garbage (redundant/extraneous) FDs in, garbage schemas out.$dbt70730$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70731$dbms_sql_tutorial_seed$dbt70731$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70732$dbms_sql_tutorial_seed$dbt70732$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70733$dbms-sql-tutorial$dbt70733$),
     t as (select id from public.learning_topics where source_kind = $dbt70734$dbms_sql_tutorial$dbt70734$ and source_ref = $dbt70735$chapter-21-normalization-and-functional-dependencies/minimal-cover$dbt70735$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70736$pt-dbms-sql-21-minimal-cover$dbt70736$, $dbt70737$Minimal Cover - Quick Test$dbt70737$, 'aptitude', 8, 8,
  $dbt70738$8 questions on Minimal Cover.$dbt70738$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70739$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70739$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70740$tq-dbms-sql-21-minimal-cover-1$dbt70740$, $dbt70741$pt-dbms-sql-21-minimal-cover$dbt70741$,
   $dbt70742$Why is CourseID -> InstructorName dropped when reducing the naive FD set G to its minimal cover?$dbt70742$,
   $dbt70743$["Because InstructorName is not a real attribute", "Because it is already implied transitively: CourseID -> InstructorID (G3) and InstructorID -> InstructorName (G4) together already establish it", "Because CourseID cannot determine text attributes", "Because it has more than one attribute on the right-hand side"]$dbt70743$::jsonb,
   1, $dbt70744$A minimal cover excludes any FD derivable from the rest of the set; since the two-step chain already implies it, keeping G6 as a separate FD is redundant.$dbt70744$, 1, 0),
  ($dbt70745$tq-dbms-sql-21-minimal-cover-2$dbt70745$, $dbt70746$pt-dbms-sql-21-minimal-cover$dbt70746$,
   $dbt70747$Why does {StudentID, CourseID} -> StudentName (G9) get reduced/removed during minimal cover derivation?$dbt70747$,
   $dbt70748$["Because StudentName is never functionally dependent on anything", "Because CourseID is an extraneous attribute on the left-hand side \u2014 StudentID alone already determines StudentName, making G9 a duplicate of G1 once reduced", "Because composite left-hand sides are always invalid", "Because StudentName must be on the left-hand side, not the right"]$dbt70748$::jsonb,
   1, $dbt70749$Testing for extraneous LHS attributes shows CourseID contributes nothing here since StudentID alone suffices; after removing the extraneous attribute, G9 collapses into the already-present G1.$dbt70749$, 1, 1),
  ($dbt70750$tq-dbms-sql-21-minimal-cover-3$dbt70750$, $dbt70751$pt-dbms-sql-21-minimal-cover$dbt70751$,
   $dbt70752$Which of the three formal properties must every FD in a minimal cover satisfy regarding its right-hand side?$dbt70752$,
   $dbt70753$["It must reference at least two attributes", "It must consist of exactly a single attribute", "It must always be a foreign key", "It must match the primary key exactly"]$dbt70753$::jsonb,
   1, $dbt70754$One of minimal cover's defining conditions is that every FD's right-hand side contains a single attribute — composite right-hand sides must be split into separate single-attribute FDs first.$dbt70754$, 1, 2),
  ($dbt70755$tq-dbms-sql-21-minimal-cover-4$dbt70755$, $dbt70756$pt-dbms-sql-21-minimal-cover$dbt70756$,
   $dbt70757$What does it mean for an FD in a candidate minimal cover to be 'redundant'?$dbt70757$,
   $dbt70758$["It uses lowercase attribute names", "It can be removed from the set without changing the overall closure behavior, because it is already implied by the remaining FDs", "It has been used more than once in a query", "It refers to a column that is nullable"]$dbt70758$::jsonb,
   1, $dbt70759$Redundant means derivable — removing it doesn't lose any information because the rest of the FD set already implies it, as shown with G6 and G7.$dbt70759$, 1, 3),
  ($dbt70760$tq-dbms-sql-21-minimal-cover-5$dbt70760$, $dbt70761$pt-dbms-sql-21-minimal-cover$dbt70761$,
   $dbt70762$After fully reducing the naive 9-FD set G, how many FDs remain in the minimal cover for the running example?$dbt70762$,
   $dbt70763$["9, all of them are necessary", "6 \u2014 the same clean FD set (F1-F6) used throughout this chapter", "3, only the single-attribute-key FDs", "0, the relation has no functional dependencies"]$dbt70763$::jsonb,
   1, $dbt70764$After dropping G6, G7 (redundant/transitively implied) and G9 (extraneous-LHS duplicate of G1), exactly 6 necessary FDs remain — matching F1-F6 from 21.5.$dbt70764$, 1, 4),
  ($dbt70765$tq-dbms-sql-21-minimal-cover-6$dbt70765$, $dbt70766$pt-dbms-sql-21-minimal-cover$dbt70766$,
   $dbt70767$Why must you recompute closures after each removal step when deriving a minimal cover, rather than just visually judging 'this FD looks redundant'?$dbt70767$,
   $dbt70768$["Because visual judgment is always faster and equally correct", "Because whether an FD is truly redundant depends on the exact remaining set of FDs, and an incorrect removal changes the closure/meaning of the FD set", "Because closures are irrelevant to minimal cover derivation", "Because SQL requires closures to be recomputed automatically"]$dbt70768$::jsonb,
   1, $dbt70769$Redundancy is a formal property verified by recomputing closures with the FD removed; a mistaken 'looks redundant' judgment could accidentally change what the FD set actually implies.$dbt70769$, 1, 5),
  ($dbt70770$tq-dbms-sql-21-minimal-cover-7$dbt70770$, $dbt70771$pt-dbms-sql-21-minimal-cover$dbt70771$,
   $dbt70772$Why do schema-design algorithms (like 3NF synthesis) require a minimal cover as input rather than an arbitrary FD set?$dbt70772$,
   $dbt70773$["Because arbitrary FD sets are always syntactically invalid", "Because redundant or extraneous FDs can cause the algorithm to produce unnecessary extra tables or miss the true underlying dependency structure", "Because minimal covers are required by SQL syntax", "Because algorithms cannot process composite left-hand sides at all"]$dbt70773$::jsonb,
   1, $dbt70774$Feeding redundant/extraneous FDs into a synthesis algorithm can distort its output; a minimal cover ensures the algorithm reasons only about genuinely necessary dependencies.$dbt70774$, 1, 6),
  ($dbt70775$tq-dbms-sql-21-minimal-cover-8$dbt70775$, $dbt70776$pt-dbms-sql-21-minimal-cover$dbt70776$,
   $dbt70777$Can a single relation have more than one valid minimal cover?$dbt70777$,
   $dbt70778$["No, minimal cover is always perfectly unique", "Yes \u2014 depending on reduction order in more complex FD sets, different but equivalent minimal covers can result, though they all produce the same overall closure behavior", "No, because minimal cover only applies to relations with a single candidate key", "Yes, but only if the relation violates 1NF"]$dbt70778$::jsonb,
   1, $dbt70779$Minimal covers aren't always syntactically unique; different valid reduction paths can yield different-looking but functionally equivalent minimal FD sets.$dbt70779$, 1, 7)
on conflict (id) do nothing;

-- 21.12 1NF
with g as (select id from public.learning_grids where lower(slug) = $dbt70780$dbms-sql-tutorial$dbt70780$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70781$chapter-21-normalization-and-functional-dependencies$dbt70781$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70782$1NF$dbt70782$, $dbt70783$1nf$dbt70783$, '', 12, 'published', true, true, $dbt70784$dbms_sql_tutorial$dbt70784$, $dbt70785$chapter-21-normalization-and-functional-dependencies/1nf$dbt70785$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70786$dbms_sql_tutorial$dbt70786$ and source_ref = $dbt70787$chapter-21-normalization-and-functional-dependencies/1nf$dbt70787$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70788$1NF$dbt70788$, $dbt70789$### Definition

A relation is in **First Normal Form (1NF)** if every attribute holds a single, atomic value per row — no repeating groups, no multi-valued cells, no nested tables. Every cell must contain exactly one value of the declared type.

### The BEFORE Picture (Violates 1NF)

Imagine the registrar's office keeps a spreadsheet-style record per student instead of one row per enrollment:

| StudentID | StudentName | Courses                                                    |
|-----------|-------------|-------------------------------------------------------------|
| S1        | Asha        | C1:Database Systems, C2:Operating Systems                   |
| S2        | Ravi        | C1:Database Systems, C3:Computer Networks                   |
| S3        | Kiran       | C1:Database Systems, C2:Operating Systems                   |

The `Courses` column holds a **comma-separated list** — a repeating group crammed into one cell. This violates 1NF: you cannot ask "which students are in C1?" with a simple `WHERE Courses = 'C1'`, you cannot index individual course memberships, and you cannot enforce that a `CourseID` inside the string actually exists in a real Course table (no foreign key is possible into free text).

### The AFTER Picture (1NF Achieved)

Split the multi-valued cell so each (student, course) pairing becomes its own atomic row — this is exactly the `StudentCourse` table this entire chapter has been using:

| StudentID | StudentName | CourseID | CourseName        |
|-----------|-------------|----------|--------------------|
| S1        | Asha        | C1       | Database Systems   |
| S1        | Asha        | C2       | Operating Systems  |
| S2        | Ravi        | C1       | Database Systems   |
| S2        | Ravi        | C3       | Computer Networks  |
| S3        | Kiran       | C1       | Database Systems   |
| S3        | Kiran       | C2       | Operating Systems  |

Every cell now holds exactly one atomic value. `CourseID` can be a proper foreign key, `WHERE CourseID = 'C1'` works with a plain index, and standard relational operators (joins, aggregates) apply normally.

### An Important Realization for This Chapter

The `StudentCourse` table used throughout 21.1-21.11 has **always been in 1NF** — every attribute in every row is already atomic. And yet it still suffered from redundancy and all three anomalies! This is the key lesson of 1NF: **it is necessary but nowhere near sufficient.** Being in 1NF only guarantees atomicity; it says nothing about *which* key each attribute is properly dependent on. That is exactly what 2NF (21.13) and 3NF (21.14) go on to fix.

### Edge Cases

- A comma-separated list is the classic 1NF violation, but so is a JSON blob or XML fragment stuffed into a single column to represent multiple values — same underlying problem, different syntax.
- Splitting a name into `FirstName`/`LastName` is a *design choice* about granularity, not a 1NF requirement — 1NF only forbids *multiple values of the same conceptual attribute* in one cell (e.g., two course memberships), not a single compound value like a full name.
- A repeating group implemented as `Course1, Course2, Course3` columns (instead of a comma-separated string) is *also* a 1NF violation — it just disguises the multi-valued nature as several fixed columns instead of one delimited cell, and still can't handle a student with a fourth course.

### Key Takeaways / Interview Angle

- **Q: State 1NF in one sentence.** Every attribute value must be atomic (single-valued) — no repeating groups or multi-valued cells.
- **Q: Is the StudentCourse table used throughout this chapter in 1NF?** Yes — it always has been; its problems (redundancy, anomalies) come from 2NF/3NF violations, not 1NF violations.
- **Q: Why is `Course1, Course2, Course3` columns just as bad as a comma-separated list?** Both encode a variable-length, multi-valued fact using a fixed, non-atomic structure — one just spreads it across columns instead of packing it into a delimiter-separated string; neither is queryable/indexable the relational way.$dbt70789$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70790$dbms_sql_tutorial_seed$dbt70790$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70791$dbms_sql_tutorial_seed$dbt70791$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70792$dbms-sql-tutorial$dbt70792$),
     t as (select id from public.learning_topics where source_kind = $dbt70793$dbms_sql_tutorial$dbt70793$ and source_ref = $dbt70794$chapter-21-normalization-and-functional-dependencies/1nf$dbt70794$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70795$pt-dbms-sql-21-1nf$dbt70795$, $dbt70796$1NF - Quick Test$dbt70796$, 'aptitude', 8, 8,
  $dbt70797$8 questions on 1NF.$dbt70797$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70798$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70798$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70799$tq-dbms-sql-21-1nf-1$dbt70799$, $dbt70800$pt-dbms-sql-21-1nf$dbt70800$,
   $dbt70801$Why does storing 'C1:Database Systems, C2:Operating Systems' in a single Courses cell violate 1NF?$dbt70801$,
   $dbt70802$["Because the cell contains a colon character", "Because the cell holds multiple values (a repeating group) instead of one atomic value per attribute", "Because CourseName should never appear alongside CourseID", "Because the cell is too long"]$dbt70802$::jsonb,
   1, $dbt70803$1NF requires each cell to hold exactly one atomic value; packing multiple course memberships into one delimited string is a repeating group, the classic 1NF violation.$dbt70803$, 1, 0),
  ($dbt70804$tq-dbms-sql-21-1nf-2$dbt70804$, $dbt70805$pt-dbms-sql-21-1nf$dbt70805$,
   $dbt70806$What is the correct 1NF transformation of the BEFORE table with the comma-separated Courses column?$dbt70806$,
   $dbt70807$["Delete the Courses column entirely", "Split each student's course list into separate rows, one per (StudentID, CourseID) pairing, as done in the StudentCourse table used throughout this chapter", "Store the list as a single JSON array in the same cell", "Add more columns like Course1, Course2, Course3"]$dbt70807$::jsonb,
   1, $dbt70808$1NF is achieved by giving each (student, course) fact its own atomic row rather than packing multiple courses into one cell — exactly how StudentCourse is structured.$dbt70808$, 1, 1),
  ($dbt70809$tq-dbms-sql-21-1nf-3$dbt70809$, $dbt70810$pt-dbms-sql-21-1nf$dbt70810$,
   $dbt70811$Has the StudentCourse table used throughout topics 21.1-21.11 ever violated 1NF?$dbt70811$,
   $dbt70812$["Yes, because it has a composite key", "No \u2014 every attribute in every row has always held a single atomic value; its redundancy and anomaly problems come from partial/transitive dependency issues (2NF/3NF), not atomicity", "Yes, because InstructorOffice repeats across rows", "No, but only after topic 21.13's decomposition"]$dbt70812$::jsonb,
   1, $dbt70813$1NF is only about atomicity of values, which StudentCourse always satisfied. Its problems were caused by violations of 2NF and 3NF, which are separate, stricter conditions.$dbt70813$, 1, 2),
  ($dbt70814$tq-dbms-sql-21-1nf-4$dbt70814$, $dbt70815$pt-dbms-sql-21-1nf$dbt70815$,
   $dbt70816$Why is a fixed set of columns like Course1, Course2, Course3 (instead of a comma-separated string) still considered a 1NF violation?$dbt70816$,
   $dbt70817$["Because it isn't a violation at all \u2014 fixed columns always satisfy 1NF", "Because it still encodes a variable-length, multi-valued fact using a rigid structure, and can't handle a student with more courses than there are columns, nor be queried/indexed the relational way", "Because column names cannot include numbers", "Because it uses more storage than a comma-separated string"]$dbt70817$::jsonb,
   1, $dbt70818$Spreading a repeating group across multiple fixed columns is just a different disguise for the same underlying multi-valued-attribute problem that 1NF forbids.$dbt70818$, 1, 3),
  ($dbt70819$tq-dbms-sql-21-1nf-5$dbt70819$, $dbt70820$pt-dbms-sql-21-1nf$dbt70820$,
   $dbt70821$Which of the following is NOT a 1NF violation?$dbt70821$,
   $dbt70822$["A single cell holding 'Python, Java, SQL' for a Skills attribute", "A StudentName column split into separate FirstName and LastName columns", "A single cell holding a JSON array of multiple phone numbers", "Three columns Hobby1, Hobby2, Hobby3 used to store a variable number of hobbies"]$dbt70822$::jsonb,
   1, $dbt70823$Splitting a name into FirstName/LastName is a granularity design choice, not a 1NF issue — each of those columns still holds one atomic value. The other three options all encode multiple values of one conceptual attribute.$dbt70823$, 1, 4),
  ($dbt70824$tq-dbms-sql-21-1nf-6$dbt70824$, $dbt70825$pt-dbms-sql-21-1nf$dbt70825$,
   $dbt70826$Why can't a foreign key constraint be enforced on the CourseID values embedded inside a comma-separated Courses string?$dbt70826$,
   $dbt70827$["Foreign keys can be enforced on any text pattern", "A foreign key constraint requires a column value to reference a specific row in another table, which is impossible when the value is buried inside free-form delimited text rather than being its own atomic column value", "Because CourseID must always be numeric for foreign keys to work", "Because foreign keys are incompatible with 1NF"]$dbt70827$::jsonb,
   1, $dbt70828$Relational integrity constraints operate on discrete column values; text embedded inside a larger string isn't a distinct value the database engine can validate against another table.$dbt70828$, 1, 5),
  ($dbt70829$tq-dbms-sql-21-1nf-7$dbt70829$, $dbt70830$pt-dbms-sql-21-1nf$dbt70830$,
   $dbt70831$What is the core requirement of First Normal Form?$dbt70831$,
   $dbt70832$["Every non-key attribute must depend on the whole key", "Every attribute value in every row must be atomic (single-valued), with no repeating groups", "Every determinant must be a candidate key", "There must be no transitive dependencies"]$dbt70832$::jsonb,
   1, $dbt70833$1NF's sole concern is atomicity of values — the whole-key and transitive-dependency conditions belong to 2NF and 3NF respectively, which are separate, additional requirements.$dbt70833$, 1, 6),
  ($dbt70834$tq-dbms-sql-21-1nf-8$dbt70834$, $dbt70835$pt-dbms-sql-21-1nf$dbt70835$,
   $dbt70836$After converting the BEFORE table (one row per student, comma-separated courses) into the AFTER table (one row per student-course pair), what new capability is gained?$dbt70836$,
   $dbt70837$["The ability to store more students", "The ability to run a simple, indexable query like WHERE CourseID = 'C1' to find all students in that course, and to enforce a real foreign key into a Course table", "Automatic removal of all update anomalies", "The elimination of the need for a primary key"]$dbt70837$::jsonb,
   1, $dbt70838$Achieving 1NF makes each course membership an atomic, queryable, indexable, and foreign-key-able value — but it does NOT by itself remove the update/insertion/deletion anomalies, which need 2NF/3NF.$dbt70838$, 1, 7)
on conflict (id) do nothing;

-- 21.13 2NF
with g as (select id from public.learning_grids where lower(slug) = $dbt70839$dbms-sql-tutorial$dbt70839$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70840$chapter-21-normalization-and-functional-dependencies$dbt70840$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70841$2NF$dbt70841$, $dbt70842$2nf$dbt70842$, '', 13, 'published', true, true, $dbt70843$dbms_sql_tutorial$dbt70843$, $dbt70844$chapter-21-normalization-and-functional-dependencies/2nf$dbt70844$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70845$dbms_sql_tutorial$dbt70845$ and source_ref = $dbt70846$chapter-21-normalization-and-functional-dependencies/2nf$dbt70846$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70847$2NF$dbt70847$, $dbt70848$### Definition

A relation is in **Second Normal Form (2NF)** if it is already in 1NF, **and** every non-key attribute is *fully* functionally dependent on the *entire* candidate key — i.e., no partial dependency (21.7) exists.

2NF is only a meaningful concern for relations with a **composite** candidate key. A relation with a single-attribute key is automatically in 2NF once it's in 1NF (there's no proper subset of a one-attribute key to be partially dependent on).

### Diagnosing the Violation

`StudentCourse(StudentID, StudentName, CourseID, CourseName, InstructorID, InstructorName, InstructorOffice, EnrollmentDate)` is in 1NF (21.12) but **not** in 2NF, because its candidate key is the composite `{StudentID, CourseID}` (21.10), and several non-key attributes are only partially dependent on it (21.7):

- `StudentName` depends on `StudentID` alone.
- `CourseName`, `InstructorID`, `InstructorName`, `InstructorOffice` all depend on `CourseID` alone.

Only `EnrollmentDate` is fully dependent on the whole pair (21.6).

### The Decomposition

Split the table into three relations, each keyed by exactly the attribute(s) its content truly depends on:

```
Student(StudentID, StudentName)
Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice)
Enrollment(StudentID, CourseID, EnrollmentDate)
```

with `Enrollment.StudentID` a foreign key into `Student`, and `Enrollment.CourseID` a foreign key into `Course`.

**Result:**

- `StudentName` ("Asha") is now stored **once**, in one `Student` row, regardless of how many courses she takes.
- `CourseName`/`InstructorID`/`InstructorName`/`InstructorOffice` ("Database Systems", "Dr. Rao", "Room 204") are now stored **once**, in one `Course` row, regardless of how many students enroll.
- `Enrollment` keeps only the genuinely fully-key-dependent fact, `EnrollmentDate`.

This directly fixes the insertion anomaly (Dr. Fernandez can now be inserted into `Course` with no enrollment needed — though note: this is only fully solved once `Instructor` is split out too, see 21.14) and the redundancy of `StudentName`/`CourseName` from 21.1.

### What 2NF Does NOT Fix Yet

Look closely at the new `Course` relation: `InstructorName` and `InstructorOffice` are fully dependent on `CourseID` (2NF is satisfied — `CourseID` is a single-attribute key here, so there's no partial dependency possible). But they are only reached *transitively*, through `InstructorID` (`CourseID -> InstructorID -> InstructorOffice`, see 21.8). The update anomaly for changing an instructor's office (across all their courses) and the insertion anomaly for a courseless instructor **still exist** inside this `Course` table. 2NF is a real improvement, but it is not the end of the story — that's exactly what 3NF (21.14) addresses next.

### Edge Cases

- 2NF must be checked against **every** candidate key of the relation, not just the primary key, if multiple candidate keys exist.
- A relation already keyed by a single surrogate attribute (e.g., an `EnrollmentID` primary key with `{StudentID, CourseID}` merely a unique constraint) is automatically in 2NF with respect to that surrogate key — but if `{StudentID, CourseID}` is *also* a candidate key, partial dependency must still be checked against it too.

### Key Takeaways / Interview Angle

- **Q: State 2NF in one sentence.** 1NF, plus no non-key attribute is partially dependent on any candidate key.
- **Q: Why is 2NF only relevant with composite keys?** Because partial dependency, by definition, requires a proper subset of the key to exist — impossible with a single-attribute key.
- **Q: What decomposition achieves 2NF here?** Splitting into `Student(StudentID, StudentName)`, `Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice)`, and `Enrollment(StudentID, CourseID, EnrollmentDate)`.$dbt70848$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70849$dbms_sql_tutorial_seed$dbt70849$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70850$dbms_sql_tutorial_seed$dbt70850$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70851$dbms-sql-tutorial$dbt70851$),
     t as (select id from public.learning_topics where source_kind = $dbt70852$dbms_sql_tutorial$dbt70852$ and source_ref = $dbt70853$chapter-21-normalization-and-functional-dependencies/2nf$dbt70853$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70854$pt-dbms-sql-21-2nf$dbt70854$, $dbt70855$2NF - Quick Test$dbt70855$, 'aptitude', 8, 8,
  $dbt70856$8 questions on 2NF.$dbt70856$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70857$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70857$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70858$tq-dbms-sql-21-2nf-1$dbt70858$, $dbt70859$pt-dbms-sql-21-2nf$dbt70859$,
   $dbt70860$Why is the original StudentCourse table NOT in 2NF?$dbt70860$,
   $dbt70861$["Because it contains a comma-separated list", "Because non-key attributes like StudentName and CourseName are only partially dependent on the composite key {StudentID, CourseID}, not fully dependent on the whole key", "Because it lacks a primary key entirely", "Because InstructorOffice is nullable"]$dbt70861$::jsonb,
   1, $dbt70862$2NF requires every non-key attribute to be fully dependent on the whole key; here, StudentName depends on StudentID alone and CourseName on CourseID alone, both partial dependencies.$dbt70862$, 1, 0),
  ($dbt70863$tq-dbms-sql-21-2nf-2$dbt70863$, $dbt70864$pt-dbms-sql-21-2nf$dbt70864$,
   $dbt70865$Which decomposition correctly achieves 2NF for StudentCourse?$dbt70865$,
   $dbt70866$["Merging all attributes into one wider table with more indexes", "Student(StudentID, StudentName), Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice), Enrollment(StudentID, CourseID, EnrollmentDate)", "Simply removing the EnrollmentDate column", "Sorting the table by StudentID"]$dbt70866$::jsonb,
   1, $dbt70867$Each partially-dependent attribute is relocated to a relation keyed by exactly the subset of the key it truly depends on, leaving only the fully-dependent EnrollmentDate with the composite key.$dbt70867$, 1, 1),
  ($dbt70868$tq-dbms-sql-21-2nf-3$dbt70868$, $dbt70869$pt-dbms-sql-21-2nf$dbt70869$,
   $dbt70870$Why is a relation with a single-attribute primary key automatically in 2NF once it satisfies 1NF?$dbt70870$,
   $dbt70871$["Because single-attribute keys never have functional dependencies", "Because partial dependency requires a proper non-empty subset of the key to test against, which a single-attribute key does not have", "Because 2NF only applies to relations with more than 5 attributes", "Because single-attribute keys are always surrogate keys"]$dbt70871$::jsonb,
   1, $dbt70872$Partial dependency is only possible relative to a composite key's subsets; with just one key attribute, there is nothing smaller to be 'partially' dependent on.$dbt70872$, 1, 2),
  ($dbt70873$tq-dbms-sql-21-2nf-4$dbt70873$, $dbt70874$pt-dbms-sql-21-2nf$dbt70874$,
   $dbt70875$After the 2NF decomposition, is the new Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice) relation itself in 2NF?$dbt70875$,
   $dbt70876$["No, because InstructorOffice still causes a partial dependency", "Yes \u2014 CourseID is a single-attribute key here, so partial dependency is impossible; but it still has a transitive dependency issue that 2NF doesn't address", "No, because it now has too many attributes", "Yes, and it has no remaining design issues of any kind"]$dbt70876$::jsonb,
   1, $dbt70877$2NF is satisfied since the key is single-attribute (no partial dependency possible), but InstructorName/InstructorOffice are reached transitively through InstructorID — a separate issue that 3NF targets.$dbt70877$, 1, 3),
  ($dbt70878$tq-dbms-sql-21-2nf-5$dbt70878$, $dbt70879$pt-dbms-sql-21-2nf$dbt70879$,
   $dbt70880$Which anomaly from earlier topics does the 2NF decomposition directly fix regarding StudentName?$dbt70880$,
   $dbt70881$["It has no effect on any anomaly", "The redundancy of storing 'Asha' multiple times is fixed \u2014 StudentName is now stored once per student in the Student table regardless of how many courses she takes", "It fixes the deletion anomaly for instructor data", "It prevents students from enrolling in more than one course"]$dbt70881$::jsonb,
   1, $dbt70882$Once StudentName lives in its own Student(StudentID, StudentName) relation, it is stored exactly once per student, eliminating the redundancy caused by its earlier partial dependency.$dbt70882$, 1, 4),
  ($dbt70883$tq-dbms-sql-21-2nf-6$dbt70883$, $dbt70884$pt-dbms-sql-21-2nf$dbt70884$,
   $dbt70885$Does achieving 2NF fully eliminate the update anomaly for InstructorOffice (e.g., when Dr. Rao changes offices)?$dbt70885$,
   $dbt70886$["Yes, 2NF fully resolves all anomalies related to instructors", "No \u2014 InstructorOffice is still reached transitively through InstructorID within the Course table, so changing an instructor's office still requires updating every course row they teach, until 3NF fixes it", "Yes, because InstructorOffice is now a foreign key", "No, because 2NF only applies to StudentName"]$dbt70886$::jsonb,
   1, $dbt70887$2NF removes partial dependency, but the transitive chain CourseID -> InstructorID -> InstructorOffice remains inside the Course relation, so the update anomaly persists until 3NF's further decomposition.$dbt70887$, 1, 5),
  ($dbt70888$tq-dbms-sql-21-2nf-7$dbt70888$, $dbt70889$pt-dbms-sql-21-2nf$dbt70889$,
   $dbt70890$If a relation has two different candidate keys, how should 2NF be checked?$dbt70890$,
   $dbt70891$["Only against whichever key is declared PRIMARY KEY in SQL", "Against every candidate key \u2014 an attribute could be partially dependent on one candidate key even while fully dependent on another", "2NF cannot be defined for relations with multiple candidate keys", "Only against the candidate key with the most attributes"]$dbt70891$::jsonb,
   1, $dbt70892$2NF's definition requires checking full/partial dependency against every candidate key of the relation, not just an arbitrarily chosen primary key.$dbt70892$, 1, 6),
  ($dbt70893$tq-dbms-sql-21-2nf-8$dbt70893$, $dbt70894$pt-dbms-sql-21-2nf$dbt70894$,
   $dbt70895$What is the precise formal definition of 2NF?$dbt70895$,
   $dbt70896$["Every determinant in the relation must be a candidate key", "The relation is in 1NF, and every non-key attribute is fully functionally dependent on every candidate key (no partial dependency)", "There are no multi-valued dependencies", "Every attribute value must be atomic"]$dbt70896$::jsonb,
   1, $dbt70897$2NF builds directly on 1NF by additionally eliminating partial dependency — this is the textbook definition distinguishing it from both 1NF (atomicity only) and 3NF (which also removes transitive dependency).$dbt70897$, 1, 7)
on conflict (id) do nothing;

-- 21.14 3NF
with g as (select id from public.learning_grids where lower(slug) = $dbt70898$dbms-sql-tutorial$dbt70898$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70899$chapter-21-normalization-and-functional-dependencies$dbt70899$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70900$3NF$dbt70900$, $dbt70901$3nf$dbt70901$, '', 14, 'published', true, true, $dbt70902$dbms_sql_tutorial$dbt70902$, $dbt70903$chapter-21-normalization-and-functional-dependencies/3nf$dbt70903$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70904$dbms_sql_tutorial$dbt70904$ and source_ref = $dbt70905$chapter-21-normalization-and-functional-dependencies/3nf$dbt70905$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70906$3NF$dbt70906$, $dbt70907$### Definition

A relation is in **Third Normal Form (3NF)** if it is already in 2NF, **and** it has no transitive dependency (21.8) — every non-key attribute must depend **directly** on a candidate key, not indirectly through another non-key attribute.

Formally, for every non-trivial FD `X -> Y` in the relation, at least one of these must hold: (a) `X` is a superkey, or (b) `Y` consists only of prime attributes (attributes belonging to some candidate key). This "(b)" escape clause is the exact detail that separates 3NF from the stricter BCNF (21.15).

### Diagnosing the Violation

After the 2NF decomposition (21.13), `Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice)` is in 2NF (its key, `CourseID`, is single-attribute, so no partial dependency is possible) but **not** in 3NF, because of the transitive chain:

```
CourseID -> InstructorID -> InstructorName
CourseID -> InstructorID -> InstructorOffice
```

`InstructorID` is not a superkey of `Course` (it doesn't determine `CourseName`, since one instructor can — in general — teach multiple courses), and `InstructorName`/`InstructorOffice` are not prime attributes. So condition (a) and (b) both fail: this is a genuine 3NF violation.

### The Decomposition

Split `Instructor` out of `Course`:

```
Instructor(InstructorID, InstructorName, InstructorOffice)
Course(CourseID, CourseName, InstructorID)
```

with `Course.InstructorID` now a foreign key into `Instructor`.

### The Final Schema

Combining this with the 2NF split from 21.13, the fully 3NF-normalized schema is:

```
Student(StudentID, StudentName)
Instructor(InstructorID, InstructorName, InstructorOffice)
Course(CourseID, CourseName, InstructorID)
Enrollment(StudentID, CourseID, EnrollmentDate)
```

Now: Dr. Fernandez (I4, Room 402) can be inserted into `Instructor` with zero dependency on any course or enrollment — the insertion anomaly is gone. Changing Dr. Rao's office is a single `UPDATE` on one row of `Instructor` — the update anomaly is gone. Dropping the sole enrollment in a course no longer erases the course's or instructor's row, since they live independently — the deletion anomaly is gone. All three anomalies from 21.2-21.4, and the redundancy from 21.1, are now fully resolved for this schema.

### Why 3NF Is Usually "Enough" in Practice

3NF is the normal form most real-world production schemas target, because it eliminates all three classic anomalies while remaining simple to reason about and query (a handful of clean joins rather than a large number of hyper-fragmented tables). BCNF, 4NF, and 5NF close increasingly rare, subtler loopholes that most everyday schemas never encounter.

### Edge Cases

- 3NF's "prime attribute" escape clause (condition b) is deliberate — it exists so that certain schemas with overlapping candidate keys don't get needlessly over-decomposed. This is exactly the case explored in the next topic, BCNF.
- Check 3NF against every candidate key of the relation, exactly as with 2NF.

### Key Takeaways / Interview Angle

- **Q: State 3NF in one sentence.** 2NF, plus no transitive dependency — every non-key attribute must depend directly on a candidate key, not through another non-key attribute.
- **Q: What decomposition achieves 3NF here?** Splitting Instructor(InstructorID, InstructorName, InstructorOffice) out of Course, leaving Course(CourseID, CourseName, InstructorID).
- **Q: Why does 3NF include the "or Y is prime" escape clause that BCNF removes?** It's a deliberate relaxation that avoids over-decomposing schemas with overlapping candidate keys — a nuance made concrete in the BCNF discussion (21.15).$dbt70907$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70908$dbms_sql_tutorial_seed$dbt70908$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70909$dbms_sql_tutorial_seed$dbt70909$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70910$dbms-sql-tutorial$dbt70910$),
     t as (select id from public.learning_topics where source_kind = $dbt70911$dbms_sql_tutorial$dbt70911$ and source_ref = $dbt70912$chapter-21-normalization-and-functional-dependencies/3nf$dbt70912$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70913$pt-dbms-sql-21-3nf$dbt70913$, $dbt70914$3NF - Quick Test$dbt70914$, 'aptitude', 8, 8,
  $dbt70915$8 questions on 3NF.$dbt70915$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70916$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70916$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70917$tq-dbms-sql-21-3nf-1$dbt70917$, $dbt70918$pt-dbms-sql-21-3nf$dbt70918$,
   $dbt70919$Why is Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice) NOT in 3NF, even though it is in 2NF?$dbt70919$,
   $dbt70920$["Because CourseID is not unique", "Because InstructorName and InstructorOffice are transitively dependent on CourseID via the non-key attribute InstructorID", "Because it has too many columns", "Because CourseName is nullable"]$dbt70920$::jsonb,
   1, $dbt70921$2NF only rules out partial dependency; the transitive chain CourseID -> InstructorID -> InstructorOffice remains, which specifically violates 3NF.$dbt70921$, 1, 0),
  ($dbt70922$tq-dbms-sql-21-3nf-2$dbt70922$, $dbt70923$pt-dbms-sql-21-3nf$dbt70923$,
   $dbt70924$Which decomposition brings the Course relation into 3NF?$dbt70924$,
   $dbt70925$["Merging Course and Enrollment into one table", "Splitting out Instructor(InstructorID, InstructorName, InstructorOffice), leaving Course(CourseID, CourseName, InstructorID) as a foreign key reference", "Removing InstructorID from Course entirely with no replacement", "Adding a composite key of CourseID and InstructorID to Course"]$dbt70925$::jsonb,
   1, $dbt70926$Relocating InstructorName/InstructorOffice into their own Instructor relation, keyed directly by InstructorID, removes the transitive chain from Course.$dbt70926$, 1, 1),
  ($dbt70927$tq-dbms-sql-21-3nf-3$dbt70927$, $dbt70928$pt-dbms-sql-21-3nf$dbt70928$,
   $dbt70929$In the formal 3NF condition 'for every FD X -> Y, X is a superkey OR Y consists only of prime attributes,' what is the second clause specifically meant to permit?$dbt70929$,
   $dbt70930$["Any transitive dependency whatsoever", "Certain FDs to a prime (candidate-key-participating) attribute to be allowed even when X is not a superkey, avoiding unnecessary over-decomposition in schemas with overlapping candidate keys", "Composite keys to be split into single attributes", "All non-key attributes to be treated as if they were keys"]$dbt70930$::jsonb,
   1, $dbt70931$This escape clause is precisely what 3NF relaxes compared to BCNF — it tolerates certain dependencies into prime attributes that BCNF would still flag as violations.$dbt70931$, 1, 2),
  ($dbt70932$tq-dbms-sql-21-3nf-4$dbt70932$, $dbt70933$pt-dbms-sql-21-3nf$dbt70933$,
   $dbt70934$After achieving 3NF with the final schema (Student, Instructor, Course, Enrollment), what happens when Dr. Fernandez (a new instructor with no assigned course yet) needs to be recorded?$dbt70934$,
   $dbt70935$["It is still impossible, since Course requires an InstructorID", "He can be inserted directly into the Instructor table with no dependency on any Course or Enrollment row \u2014 the insertion anomaly is resolved", "He must first be added as a placeholder student", "He can only be added by an administrator with special privileges"]$dbt70935$::jsonb,
   1, $dbt70936$Since Instructor is now its own independent relation keyed by InstructorID, a new instructor can be recorded with zero need for a course or enrollment to exist first.$dbt70936$, 1, 3),
  ($dbt70937$tq-dbms-sql-21-3nf-5$dbt70937$, $dbt70938$pt-dbms-sql-21-3nf$dbt70938$,
   $dbt70939$Why is 3NF often considered 'good enough' for most real-world production schemas?$dbt70939$,
   $dbt70940$["Because it is the only normal form that actually exists in practice", "Because it eliminates all three classic anomalies (insertion, update, deletion) while staying practical to query, whereas BCNF/4NF/5NF address increasingly rare edge cases", "Because SQL databases cannot enforce normal forms beyond 3NF", "Because 3NF requires fewer tables than 1NF"]$dbt70940$::jsonb,
   1, $dbt70941$3NF resolves the anomalies that matter for everyday design; the stricter forms close narrower, less commonly encountered loopholes at the cost of more fragmented schemas.$dbt70941$, 1, 4),
  ($dbt70942$tq-dbms-sql-21-3nf-6$dbt70942$, $dbt70943$pt-dbms-sql-21-3nf$dbt70943$,
   $dbt70944$In the fully 3NF-normalized schema, updating Dr. Rao's office requires touching how many rows?$dbt70944$,
   $dbt70945$["One row, in the Instructor table", "Three rows, one per course he teaches", "Zero rows, since offices cannot be changed", "All rows in the Enrollment table"]$dbt70945$::jsonb,
   0, $dbt70946$Because InstructorOffice now lives in a single Instructor row keyed by InstructorID, exactly one row needs to change — the update anomaly is fully resolved.$dbt70946$, 1, 5),
  ($dbt70947$tq-dbms-sql-21-3nf-7$dbt70947$, $dbt70948$pt-dbms-sql-21-3nf$dbt70948$,
   $dbt70949$Which of the following anomalies, if any, still remains after reaching the 3NF schema described (Student, Instructor, Course, Enrollment)?$dbt70949$,
   $dbt70950$["All three anomalies (insertion, update, deletion) from 21.2-21.4 still remain", "None of the three classic anomalies from 21.2-21.4 remain for this schema", "Only the deletion anomaly remains", "Only the insertion anomaly remains"]$dbt70950$::jsonb,
   1, $dbt70951$The full decomposition through 2NF and 3NF resolves the insertion, update, and deletion anomalies illustrated earlier in the chapter for this particular table's dependency structure.$dbt70951$, 1, 6),
  ($dbt70952$tq-dbms-sql-21-3nf-8$dbt70952$, $dbt70953$pt-dbms-sql-21-3nf$dbt70953$,
   $dbt70954$Is InstructorID a superkey of the pre-decomposition Course(CourseID, CourseName, InstructorID, InstructorName, InstructorOffice) relation?$dbt70954$,
   $dbt70955$["Yes, because it determines InstructorName and InstructorOffice", "No \u2014 its closure only reaches {InstructorID, InstructorName, InstructorOffice}, never CourseID or CourseName, so it does not determine every attribute of Course", "Yes, because it is a foreign key", "No, because InstructorID is never functionally dependent on anything"]$dbt70955$::jsonb,
   1, $dbt70956$A superkey's closure must reach every attribute of the relation. InstructorID never determines CourseID/CourseName (an instructor can teach multiple courses), so it fails as a superkey — confirming the transitive dependency is a genuine 3NF violation.$dbt70956$, 1, 7)
on conflict (id) do nothing;

-- 21.15 BCNF
with g as (select id from public.learning_grids where lower(slug) = $dbt70957$dbms-sql-tutorial$dbt70957$),
     s as (select id from public.learning_sections where lower(slug) = $dbt70958$chapter-21-normalization-and-functional-dependencies$dbt70958$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt70959$BCNF$dbt70959$, $dbt70960$bcnf$dbt70960$, '', 15, 'published', true, true, $dbt70961$dbms_sql_tutorial$dbt70961$, $dbt70962$chapter-21-normalization-and-functional-dependencies/bcnf$dbt70962$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt70963$dbms_sql_tutorial$dbt70963$ and source_ref = $dbt70964$chapter-21-normalization-and-functional-dependencies/bcnf$dbt70964$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt70965$BCNF$dbt70965$, $dbt70966$### Definition

**Boyce-Codd Normal Form (BCNF)** is a stricter version of 3NF: for **every** non-trivial functional dependency `X -> Y` in the relation, `X` must be a superkey — full stop, no exceptions. It removes the "or Y is prime" escape clause that 3NF allows (21.14). Every relation in BCNF is automatically in 3NF, but not every 3NF relation is in BCNF.

### Why the Main Schema Doesn't Show the Difference

The clean 3NF schema from 21.14 — `Student`, `Instructor`, `Course(CourseID, CourseName, InstructorID)`, `Enrollment` — happens to already be in BCNF too, because each relation has a single, simple candidate key and every determinant is that key. To see the 3NF/BCNF gap, we need a relation with **overlapping candidate keys**, so zoom into a closely related scenario.

### The BCNF-Violating Example

Suppose the department also tracks, for auditing, **which specific instructor's section** each student attends per course — some large courses run multiple sections, each with a different instructor, but as a firm departmental policy, **each instructor is assigned to teach sections of only one course** (no instructor splits time across courses). Model this as:

```
SectionAssignment(StudentID, CourseID, InstructorID)
```

with these FDs:
- `{StudentID, CourseID} -> InstructorID` (a student in a course attends exactly one section/instructor)
- `InstructorID -> CourseID` (by policy, each instructor belongs to exactly one course)

**Candidate keys:** `{StudentID, CourseID}` (closure reaches InstructorID, hence everything) and also `{StudentID, InstructorID}` (since InstructorID -> CourseID, its closure also reaches everything). Both `CourseID` and `InstructorID` are therefore **prime attributes** — each belongs to some candidate key.

**Is this in 3NF?** Check `InstructorID -> CourseID`: is `InstructorID` a superkey? No — its closure alone only reaches `{InstructorID, CourseID}`, missing `StudentID`. But is `CourseID` (the right-hand side) prime? Yes — it's part of the candidate key `{StudentID, CourseID}`. So condition (b) of 3NF is satisfied, and **this relation IS in 3NF.**

**Is this in BCNF?** Check the same FD, `InstructorID -> CourseID`, against BCNF's rule: `InstructorID` must be a superkey. It is **not** (shown above). BCNF has no "prime attribute" escape clause, so **this relation VIOLATES BCNF.**

This is the concrete gap: a schema can be in 3NF but not BCNF exactly when a non-superkey determinant happens to determine a *prime* attribute.

### The BCNF Fix

Decompose along the violating FD:

```
InstructorCourse(InstructorID, CourseID)   -- InstructorID is now a proper key
StudentInstructor(StudentID, InstructorID)  -- records which section a student attends
```

Now every determinant (`InstructorID` in the first, `{StudentID, InstructorID}` in the second) is a superkey of its own relation.

### Edge Cases

- BCNF decomposition can occasionally **not preserve all original functional dependencies** without an extra join to re-check them (a known trade-off called "dependency preservation" loss) — this is a rare, advanced caveat, unlike simple 3NF decompositions which usually preserve dependencies cleanly.
- Most everyday schemas (like the chapter's main Student/Instructor/Course/Enrollment design) reach BCNF "for free" once they reach 3NF — the 3NF/BCNF gap specifically requires overlapping candidate keys, which is a comparatively rare situation.

### Key Takeaways / Interview Angle

- **Q: State the one-sentence difference between 3NF and BCNF.** 3NF allows a non-superkey determinant if what it determines is a prime attribute; BCNF forbids this entirely — every determinant must be a superkey, no exceptions.
- **Q: Give the concrete violating FD from this topic.** `InstructorID -> CourseID` in `SectionAssignment(StudentID, CourseID, InstructorID)` — InstructorID is not a superkey, yet it determines CourseID.
- **Q: Why doesn't the chapter's main 4-table schema need a further BCNF step?** Because none of its relations have overlapping candidate keys — each already has every determinant as a superkey once 3NF is reached.$dbt70966$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt70967$dbms_sql_tutorial_seed$dbt70967$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt70968$dbms_sql_tutorial_seed$dbt70968$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt70969$dbms-sql-tutorial$dbt70969$),
     t as (select id from public.learning_topics where source_kind = $dbt70970$dbms_sql_tutorial$dbt70970$ and source_ref = $dbt70971$chapter-21-normalization-and-functional-dependencies/bcnf$dbt70971$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt70972$pt-dbms-sql-21-bcnf$dbt70972$, $dbt70973$BCNF - Quick Test$dbt70973$, 'aptitude', 8, 8,
  $dbt70974$8 questions on BCNF.$dbt70974$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt70975$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt70975$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt70976$tq-dbms-sql-21-bcnf-1$dbt70976$, $dbt70977$pt-dbms-sql-21-bcnf$dbt70977$,
   $dbt70978$What is the single defining difference between 3NF and BCNF?$dbt70978$,
   $dbt70979$["BCNF requires 1NF but 3NF does not", "3NF allows a non-superkey determinant if the attribute it determines is prime; BCNF requires every determinant to be a superkey with no exceptions", "BCNF only applies to relations with a single attribute", "3NF is stricter than BCNF"]$dbt70979$::jsonb,
   1, $dbt70980$This 'prime attribute' escape clause is precisely what 3NF relaxes and BCNF removes — BCNF has zero tolerance for non-superkey determinants.$dbt70980$, 1, 0),
  ($dbt70981$tq-dbms-sql-21-bcnf-2$dbt70981$, $dbt70982$pt-dbms-sql-21-bcnf$dbt70982$,
   $dbt70983$In SectionAssignment(StudentID, CourseID, InstructorID) with FDs {StudentID,CourseID}->InstructorID and InstructorID->CourseID, why does InstructorID->CourseID violate BCNF?$dbt70983$,
   $dbt70984$["Because InstructorID is never functionally dependent on anything", "Because InstructorID's closure alone does not reach StudentID, so InstructorID is not a superkey, yet it determines CourseID", "Because CourseID cannot appear on the right-hand side of any FD", "Because InstructorID and CourseID have the same data type"]$dbt70984$::jsonb,
   1, $dbt70985$BCNF requires every determinant to be a superkey. InstructorID alone only determines {InstructorID, CourseID}, missing StudentID, so it fails the superkey test outright.$dbt70985$, 1, 1),
  ($dbt70986$tq-dbms-sql-21-bcnf-3$dbt70986$, $dbt70987$pt-dbms-sql-21-bcnf$dbt70987$,
   $dbt70988$Why does the SAME functional dependency (InstructorID -> CourseID) NOT violate 3NF in this relation?$dbt70988$,
   $dbt70989$["Because 3NF ignores functional dependencies entirely", "Because CourseID is a prime attribute (it belongs to the candidate key {StudentID, CourseID}), satisfying 3NF's escape clause even though InstructorID is not a superkey", "Because InstructorID happens to be a superkey after all", "Because 3NF only checks composite determinants"]$dbt70989$::jsonb,
   1, $dbt70990$3NF's condition (b) — the right-hand side consists only of prime attributes — is satisfied here since CourseID participates in a candidate key, letting this FD pass 3NF despite failing BCNF.$dbt70990$, 1, 2),
  ($dbt70991$tq-dbms-sql-21-bcnf-4$dbt70991$, $dbt70992$pt-dbms-sql-21-bcnf$dbt70992$,
   $dbt70993$What are the two candidate keys of SectionAssignment(StudentID, CourseID, InstructorID)?$dbt70993$,
   $dbt70994$["{StudentID} and {CourseID} individually", "{StudentID, CourseID} and {StudentID, InstructorID}", "{CourseID} and {InstructorID} individually", "{StudentID, CourseID, InstructorID} is the only candidate key"]$dbt70994$::jsonb,
   1, $dbt70995$Both pairs' closures reach all three attributes: {StudentID,CourseID} directly determines InstructorID, and {StudentID,InstructorID} reaches CourseID via InstructorID->CourseID — and neither can be reduced further.$dbt70995$, 1, 3),
  ($dbt70996$tq-dbms-sql-21-bcnf-5$dbt70996$, $dbt70997$pt-dbms-sql-21-bcnf$dbt70997$,
   $dbt70998$Which decomposition brings SectionAssignment into BCNF?$dbt70998$,
   $dbt70999$["Merging it with the Enrollment table", "InstructorCourse(InstructorID, CourseID) and StudentInstructor(StudentID, InstructorID), so InstructorID is a proper superkey in the first relation", "Adding a fourth candidate key", "Removing InstructorID from the relation entirely"]$dbt70999$::jsonb,
   1, $dbt71000$Splitting along the violating FD makes InstructorID a full key of its own relation (InstructorCourse), and the remaining relation's determinant is also a superkey — both now satisfy BCNF.$dbt71000$, 1, 4),
  ($dbt71001$tq-dbms-sql-21-bcnf-6$dbt71001$, $dbt71002$pt-dbms-sql-21-bcnf$dbt71002$,
   $dbt71003$Why does the chapter's main 4-table 3NF schema (Student, Instructor, Course, Enrollment) not require any further decomposition to reach BCNF?$dbt71003$,
   $dbt71004$["Because BCNF does not apply to schemas with foreign keys", "Because none of those relations have overlapping candidate keys \u2014 each already has every determinant as a superkey once 3NF is achieved", "Because BCNF only applies to relations with three or more attributes", "Because the schema was never actually in 3NF to begin with"]$dbt71004$::jsonb,
   1, $dbt71005$The 3NF/BCNF gap specifically arises from overlapping candidate keys, a situation the simple Student/Instructor/Course/Enrollment relations don't have — so 3NF and BCNF coincide for them.$dbt71005$, 1, 5),
  ($dbt71006$tq-dbms-sql-21-bcnf-7$dbt71006$, $dbt71007$pt-dbms-sql-21-bcnf$dbt71007$,
   $dbt71008$What is a known trade-off/caveat when decomposing a relation into BCNF?$dbt71008$,
   $dbt71009$["BCNF decomposition always increases redundancy", "BCNF decomposition can sometimes fail to preserve all original functional dependencies without needing an extra join to re-check them", "BCNF decomposition is illegal in SQL", "BCNF relations can never have foreign keys"]$dbt71009$::jsonb,
   1, $dbt71010$Unlike most 3NF decompositions, some BCNF decompositions lose the ability to check certain original FDs without joining tables back together — a recognized, if uncommon, trade-off.$dbt71010$, 1, 6),
  ($dbt71011$tq-dbms-sql-21-bcnf-8$dbt71011$, $dbt71012$pt-dbms-sql-21-bcnf$dbt71012$,
   $dbt71013$Which statement about the relationship between BCNF and 3NF is correct?$dbt71013$,
   $dbt71014$["Every 3NF relation is automatically in BCNF", "Every BCNF relation is automatically in 3NF, but not every 3NF relation is in BCNF", "BCNF and 3NF are entirely unrelated conditions", "A relation can be in BCNF without being in 1NF"]$dbt71014$::jsonb,
   1, $dbt71015$BCNF is strictly stronger than 3NF — satisfying BCNF's superkey-only rule automatically satisfies 3NF's looser rule, but the reverse doesn't hold, as the SectionAssignment example shows.$dbt71015$, 1, 7)
on conflict (id) do nothing;

-- 21.16 4NF
with g as (select id from public.learning_grids where lower(slug) = $dbt71016$dbms-sql-tutorial$dbt71016$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71017$chapter-21-normalization-and-functional-dependencies$dbt71017$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71018$4NF$dbt71018$, $dbt71019$4nf$dbt71019$, '', 16, 'published', true, true, $dbt71020$dbms_sql_tutorial$dbt71020$, $dbt71021$chapter-21-normalization-and-functional-dependencies/4nf$dbt71021$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71022$dbms_sql_tutorial$dbt71022$ and source_ref = $dbt71023$chapter-21-normalization-and-functional-dependencies/4nf$dbt71023$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71024$4NF$dbt71024$, $dbt71025$### Definition

**Fourth Normal Form (4NF)** requires a relation to be in BCNF **and** free of non-trivial **multi-valued dependencies (MVDs)** other than ones implied by a candidate key. An MVD, written `X ->> Y`, means: for a given value of X, the set of Y values associated with it is independent of any other attribute in the relation — and when two such independent multi-valued facts about the same X get combined into one table, they generate a spurious cross-product of unrelated combinations.

### The Classic 4NF Problem, Applied to a Student

Step outside the enrollment table for a moment and consider a poorly-designed `StudentContact` relation tracking two independent multi-valued facts about a student: their hobbies and their phone numbers.

```
StudentContact(StudentID, Hobby, PhoneNumber)
```

Say Asha (S1) has two hobbies (Chess, Painting) and two phone numbers (555-0101, 555-0102). Since neither list has anything to do with the other, a naive table combining them must record **every combination** to avoid implying a false pairing:

| StudentID | Hobby    | PhoneNumber |
|-----------|----------|-------------|
| S1        | Chess    | 555-0101    |
| S1        | Chess    | 555-0102    |
| S1        | Painting | 555-0101    |
| S1        | Painting | 555-0102    |

Four rows for two independent facts (2 hobbies x 2 phone numbers = 4). This is the **spurious cross-product**: nothing about "Chess" is actually linked to "555-0101" specifically — the table is forced to fabricate that pairing just to satisfy the relational requirement that every row be a complete, meaningful tuple. Note this relation is already in BCNF (its only key is the full `{StudentID, Hobby, PhoneNumber}`, trivially a superkey) — yet it's still badly designed. This is exactly the gap 4NF closes, one level beyond BCNF.

### Why This Is Broken

- **Insertion anomaly**: adding a third hobby ("Reading") for S1 requires inserting *two* new rows (one per existing phone number), or the data model becomes inconsistent about which hobbies pair with which numbers.
- **Update anomaly**: changing one phone number to a new one requires updating it in every hobby-paired row.
- **Meaningless correlation**: a query grouping by `PhoneNumber` to "count hobbies per phone" would return nonsense, since the pairing was never a real fact to begin with.

### The 4NF Fix

Split the two independent multi-valued facts into two separate relations, each with its own natural key:

```
StudentHobby(StudentID, Hobby)
StudentPhone(StudentID, PhoneNumber)
```

Now Asha's two hobbies are two rows in `StudentHobby`, her two phone numbers are two rows in `StudentPhone`, and no fabricated cross-product exists anywhere.

### Edge Cases

- 4NF violations require **two or more independent** multi-valued facts about the same entity stored in one table. A single multi-valued fact alone (just `StudentHobby(StudentID, Hobby)`) is not a 4NF problem — it's a normal one-to-many relationship, already fine.
- If the two facts are *not* actually independent (e.g., "which hobby is practiced at which phone-registered location" is a real, tracked business fact), then the combination isn't a spurious MVD at all — it's a genuine three-way relationship, and forcing it apart into two tables would actually lose information.

### Key Takeaways / Interview Angle

- **Q: State 4NF in one sentence.** BCNF, plus no non-trivial multi-valued dependency other than one implied by a candidate key.
- **Q: What's the telltale symptom of a 4NF violation?** A spurious cross-product — the row count multiplies (2 hobbies x 2 phones = 4 rows) to represent two facts that have nothing to do with each other.
- **Q: How do you fix it?** Split each independent multi-valued fact into its own relation, keyed by the entity plus that one fact.$dbt71025$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71026$dbms_sql_tutorial_seed$dbt71026$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71027$dbms_sql_tutorial_seed$dbt71027$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71028$dbms-sql-tutorial$dbt71028$),
     t as (select id from public.learning_topics where source_kind = $dbt71029$dbms_sql_tutorial$dbt71029$ and source_ref = $dbt71030$chapter-21-normalization-and-functional-dependencies/4nf$dbt71030$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71031$pt-dbms-sql-21-4nf$dbt71031$, $dbt71032$4NF - Quick Test$dbt71032$, 'aptitude', 8, 8,
  $dbt71033$8 questions on 4NF.$dbt71033$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71034$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71034$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71035$tq-dbms-sql-21-4nf-1$dbt71035$, $dbt71036$pt-dbms-sql-21-4nf$dbt71036$,
   $dbt71037$Why does StudentContact(StudentID, Hobby, PhoneNumber) require 4 rows for a student with 2 hobbies and 2 phone numbers?$dbt71037$,
   $dbt71038$["Because the database engine requires at least 4 rows per student", "Because combining two independent multi-valued facts in one table forces a spurious cross-product of every hobby with every phone number, even though they have no real connection", "Because Hobby and PhoneNumber must always be paired one-to-one", "Because StudentID is not unique"]$dbt71038$::jsonb,
   1, $dbt71039$Since hobbies and phone numbers are independent facts about the student, the relational model is forced to enumerate every combination to represent 'both facts are true,' producing a spurious cross-product.$dbt71039$, 1, 0),
  ($dbt71040$tq-dbms-sql-21-4nf-2$dbt71040$, $dbt71041$pt-dbms-sql-21-4nf$dbt71041$,
   $dbt71042$Is StudentContact(StudentID, Hobby, PhoneNumber) in BCNF?$dbt71042$,
   $dbt71043$["No, because its only key is not a superkey", "Yes \u2014 its only candidate key is the full {StudentID, Hobby, PhoneNumber}, which is trivially a superkey, yet the design is still badly flawed", "No, because it has a transitive dependency", "Yes, but only because it has no functional dependencies at all"]$dbt71043$::jsonb,
   1, $dbt71044$Since every attribute is needed to uniquely identify a row, the whole-attribute set is the only key, trivially satisfying BCNF — this shows that BCNF alone does not catch multi-valued dependency problems; that requires 4NF.$dbt71044$, 1, 1),
  ($dbt71045$tq-dbms-sql-21-4nf-3$dbt71045$, $dbt71046$pt-dbms-sql-21-4nf$dbt71046$,
   $dbt71047$What is the correct 4NF decomposition of StudentContact?$dbt71047$,
   $dbt71048$["Keep it as one table but add a UNIQUE constraint", "Split into StudentHobby(StudentID, Hobby) and StudentPhone(StudentID, PhoneNumber), separating the two independent multi-valued facts", "Merge Hobby and PhoneNumber into a single combined column", "Add a fourth attribute to disambiguate the pairing"]$dbt71048$::jsonb,
   1, $dbt71049$Since hobbies and phone numbers are independent facts about a student, each gets its own relation keyed by StudentID plus that one fact, eliminating the spurious cross-product.$dbt71049$, 1, 2),
  ($dbt71050$tq-dbms-sql-21-4nf-4$dbt71050$, $dbt71051$pt-dbms-sql-21-4nf$dbt71051$,
   $dbt71052$What insertion anomaly occurs in the unsplit StudentContact table when Asha (S1) gains a third hobby, 'Reading'?$dbt71052$,
   $dbt71053$["Nothing unusual happens \u2014 one row is simply added", "Two new rows must be inserted (one per existing phone number) just to represent one new fact (a new hobby), or the data becomes inconsistent", "The insert is rejected automatically", "The PhoneNumber column is deleted"]$dbt71053$::jsonb,
   1, $dbt71054$Because the design forces a cross-product, adding one new independent fact (a hobby) requires duplicating it across every existing value of the other independent fact (phone numbers) to keep the (meaningless) pairing consistent.$dbt71054$, 1, 3),
  ($dbt71055$tq-dbms-sql-21-4nf-5$dbt71055$, $dbt71056$pt-dbms-sql-21-4nf$dbt71056$,
   $dbt71057$What formally defines a multi-valued dependency X ->> Y?$dbt71057$,
   $dbt71058$["X and Y must always be the same data type", "For a given value of X, the set of Y values associated with it is independent of any other attribute in the relation", "X must be a foreign key referencing Y", "Y must always be a single atomic value"]$dbt71058$::jsonb,
   1, $dbt71059$An MVD captures that Y's multiple values for a given X don't depend on any other attribute present — which is exactly what causes the spurious cross-product when two such MVDs are combined in one table.$dbt71059$, 1, 4),
  ($dbt71060$tq-dbms-sql-21-4nf-6$dbt71060$, $dbt71061$pt-dbms-sql-21-4nf$dbt71061$,
   $dbt71062$Would StudentHobby(StudentID, Hobby) alone, with no PhoneNumber column, be a 4NF violation?$dbt71062$,
   $dbt71063$["Yes, any multi-valued attribute always violates 4NF", "No \u2014 a single multi-valued fact about an entity is just a normal one-to-many relationship; 4NF violations require two or more INDEPENDENT multi-valued facts combined in the same table", "Yes, because Hobby is not atomic", "No, because 4NF only applies to numeric attributes"]$dbt71063$::jsonb,
   1, $dbt71064$4NF's concern is specifically about combining multiple independent multi-valued facts, causing a cross-product; a single multi-valued attribute in its own table is unproblematic and normal.$dbt71064$, 1, 5),
  ($dbt71065$tq-dbms-sql-21-4nf-7$dbt71065$, $dbt71066$pt-dbms-sql-21-4nf$dbt71066$,
   $dbt71067$Suppose, contrary to the chapter's assumption, the school actually DOES track which specific phone number is used to discuss which specific hobby (a real business rule linking the two). What does this imply?$dbt71067$,
   $dbt71068$["The original combined table was correctly designed, and splitting it would lose real information", "The two facts are still independent and should always be split", "This scenario is impossible in a relational database", "It would require adding a fourth normal form violation"]$dbt71068$::jsonb,
   0, $dbt71069$If the hobby-phone pairing is a genuine tracked fact rather than an artifact of independent lists, then it isn't a spurious MVD at all — forcing a 4NF-style split in that case would actually destroy real, meaningful information.$dbt71069$, 1, 6),
  ($dbt71070$tq-dbms-sql-21-4nf-8$dbt71070$, $dbt71071$pt-dbms-sql-21-4nf$dbt71071$,
   $dbt71072$Which of the following best summarizes the telltale symptom that signals a 4NF violation?$dbt71072$,
   $dbt71073$["The table has a composite primary key", "The row count for an entity multiplies as the cross-product of two or more independent multi-valued facts, even though those facts have no real connection to each other", "The table contains a NULL value", "The table has more than three columns"]$dbt71073$::jsonb,
   1, $dbt71074$The defining red flag is the cross-product row explosion (e.g., 2 hobbies x 2 phones = 4 rows) representing facts that are logically unrelated to each other.$dbt71074$, 1, 7)
on conflict (id) do nothing;

-- 21.17 5NF
with g as (select id from public.learning_grids where lower(slug) = $dbt71075$dbms-sql-tutorial$dbt71075$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71076$chapter-21-normalization-and-functional-dependencies$dbt71076$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71077$5NF$dbt71077$, $dbt71078$5nf$dbt71078$, '', 17, 'published', true, true, $dbt71079$dbms_sql_tutorial$dbt71079$, $dbt71080$chapter-21-normalization-and-functional-dependencies/5nf$dbt71080$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71081$dbms_sql_tutorial$dbt71081$ and source_ref = $dbt71082$chapter-21-normalization-and-functional-dependencies/5nf$dbt71082$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71083$5NF$dbt71083$, $dbt71084$### Definition

**Fifth Normal Form (5NF)**, also called **Project-Join Normal Form (PJ/NF)**, requires a relation to be in 4NF **and** free of non-trivial **join dependencies** that are not implied by its candidate keys. A join dependency means the relation can be losslessly decomposed into three or more smaller relations, such that rejoining all of them via natural join reconstructs the original exactly — and critically, no smaller (two-way) decomposition would have worked.

### An Honest Framing First

5NF is the most advanced and, in real-world practice, by far the **least frequently needed** normal form covered in this chapter. The vast majority of production schemas — including everything built from the running `Student`/`Instructor`/`Course`/`Enrollment` example — never encounter a genuine 5NF violation, because 5NF problems require a very specific three-way (or higher) interdependency between facts that a normal binary relationship or foreign-key structure doesn't produce. Treat this topic as "know it exists and recognize the shape," not as something you'll routinely apply.

### The General Shape of the Problem

The classic textbook illustration (adapted to a schooling context): suppose the department wants to track, in one table, "which instructor can teach which course, for which classroom" — call it `Capability(InstructorID, CourseID, Classroom)`. If the *only* real business rule is a genuine three-way constraint — "instructor I teaches course C in room R, specifically because I is qualified for C, room R is equipped for C, and I happens to be assigned to room R" — with **no** simpler pairwise rule fully capturing it (i.e., you truly cannot reconstruct valid triples just by combining any two of the three pairwise relationships), then the relation has a genuine join dependency and needs all three of:

```
InstructorCourse(InstructorID, CourseID)
CourseClassroom(CourseID, Classroom)
InstructorClassroom(InstructorID, Classroom)
```

joined together (all three, not just two) to reconstruct the valid triples correctly — no two-way split suffices.

### The Crucial Test: Is It Really a 5NF Case?

Most of the time, what looks like a three-way relationship actually **does** decompose losslessly into just two binary relations (e.g., if "instructor teaches course" and "course meets in classroom" together fully determine "instructor uses classroom," you don't have a genuine join dependency — a 2-way decomposition already works, and forcing a spurious 3-way analysis is unnecessary). Real, irreducible 5NF cases — where you provably need three-plus relations rejoined together and no smaller combination reconstructs the data correctly — are rare enough that many working database professionals go entire careers without deliberately designing for 5NF; it mostly matters for people building schema-normalization theory or academic algorithms.

### Edge Cases

- Don't confuse a 5NF join dependency with a simple three-column junction/bridge table used to model a straightforward ternary relationship (e.g., `Enrollment(StudentID, CourseID, Semester)`) — those are completely normal and usually don't imply any hidden join dependency at all.
- If you ever suspect a 5NF issue, the practical fix is almost always to decompose and *test*: rejoin the candidate smaller tables and verify no spurious rows are produced and no valid combinations are lost.

### Key Takeaways / Interview Angle

- **Q: State 5NF in one sentence.** 4NF, plus no join dependency exists that isn't already implied by the relation's candidate keys — the relation cannot be losslessly split into three or more smaller pieces that a two-way split would miss.
- **Q: How common is a genuine 5NF violation in practice?** Very rare — most schemas never need it; it's included for theoretical completeness more than daily design work.
- **Q: What's the practical takeaway from 5NF, even if you never formally apply it?** Be alert to constraints that are genuinely three-way (not reducible to pairwise rules) before assuming any junction table needs no further scrutiny.$dbt71084$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71085$dbms_sql_tutorial_seed$dbt71085$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71086$dbms_sql_tutorial_seed$dbt71086$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71087$dbms-sql-tutorial$dbt71087$),
     t as (select id from public.learning_topics where source_kind = $dbt71088$dbms_sql_tutorial$dbt71088$ and source_ref = $dbt71089$chapter-21-normalization-and-functional-dependencies/5nf$dbt71089$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71090$pt-dbms-sql-21-5nf$dbt71090$, $dbt71091$5NF - Quick Test$dbt71091$, 'aptitude', 8, 8,
  $dbt71092$8 questions on 5NF.$dbt71092$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71093$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71093$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71094$tq-dbms-sql-21-5nf-1$dbt71094$, $dbt71095$pt-dbms-sql-21-5nf$dbt71095$,
   $dbt71096$What does 5NF (Project-Join Normal Form) specifically require beyond 4NF?$dbt71096$,
   $dbt71097$["That every attribute be numeric", "That the relation have no non-trivial join dependency that isn't already implied by its candidate keys \u2014 it cannot require three or more relations rejoined to reconstruct it losslessly, beyond what keys already guarantee", "That every table have exactly three columns", "That all foreign keys be nullable"]$dbt71097$::jsonb,
   1, $dbt71098$5NF's defining concern is join dependency: whether a relation must be split into three-plus pieces (not just two) to eliminate redundancy without losing information, beyond what candidate keys already imply.$dbt71098$, 1, 0),
  ($dbt71099$tq-dbms-sql-21-5nf-2$dbt71099$, $dbt71100$pt-dbms-sql-21-5nf$dbt71100$,
   $dbt71101$How commonly do real-world production schemas encounter a genuine 5NF violation, according to standard practice?$dbt71101$,
   $dbt71102$["Extremely commonly \u2014 nearly every schema needs a 5NF pass", "Very rarely \u2014 5NF issues require a specific irreducible three-way interdependency that most everyday schemas never produce", "Only in schemas without foreign keys", "5NF violations are more common than 1NF violations"]$dbt71102$::jsonb,
   1, $dbt71103$5NF is the most advanced and least frequently needed normal form; genuine irreducible three-way join dependencies are uncommon in typical business schemas.$dbt71103$, 1, 1),
  ($dbt71104$tq-dbms-sql-21-5nf-3$dbt71104$, $dbt71105$pt-dbms-sql-21-5nf$dbt71105$,
   $dbt71106$In the Capability(InstructorID, CourseID, Classroom) example, what would indicate the relation does NOT actually need a full 5NF three-way decomposition?$dbt71106$,
   $dbt71107$["If the table has fewer than 10 rows", "If two of the pairwise relationships (e.g., 'instructor teaches course' and 'course meets in classroom') already fully determine the third, valid triples can be reconstructed from just a two-way decomposition, meaning there's no genuine irreducible join dependency", "If InstructorID is a foreign key", "If Classroom values are alphabetically sorted"]$dbt71107$::jsonb,
   1, $dbt71108$A real 5NF/join-dependency case specifically requires that NO combination of two smaller relations can reconstruct the valid data — if two pairwise facts suffice, it's not a genuine 5NF situation.$dbt71108$, 1, 2),
  ($dbt71109$tq-dbms-sql-21-5nf-4$dbt71109$, $dbt71110$pt-dbms-sql-21-5nf$dbt71110$,
   $dbt71111$What is a join dependency, in plain terms?$dbt71111$,
   $dbt71112$["A rule that a table must always have a primary key", "A property where a relation can be losslessly split into three or more smaller relations such that rejoining all of them exactly reconstructs the original, with no smaller (two-way) split able to do so", "A constraint requiring all joins to use INNER JOIN syntax", "A dependency between two tables linked by a single foreign key"]$dbt71112$::jsonb,
   1, $dbt71113$Join dependency is specifically about needing three-plus pieces (not fewer) rejoined to reconstruct the data losslessly — this is exactly what 5NF checks for and eliminates when not implied by keys.$dbt71113$, 1, 3),
  ($dbt71114$tq-dbms-sql-21-5nf-5$dbt71114$, $dbt71115$pt-dbms-sql-21-5nf$dbt71115$,
   $dbt71116$Should a standard three-column junction table like Enrollment(StudentID, CourseID, Semester), modeling a normal ternary relationship, be assumed to have a hidden 5NF join dependency?$dbt71116$,
   $dbt71117$["Yes, all three-column tables automatically violate 5NF", "No \u2014 most such junction/bridge tables model a straightforward relationship with no hidden join dependency at all; genuine 5NF cases are a distinct, much rarer situation", "Yes, but only if StudentID is the primary key", "No, because 5NF never applies to tables with a composite key"]$dbt71117$::jsonb,
   1, $dbt71118$A simple ternary relationship table is normal and typically fine; conflating it with a genuine (and rare) join-dependency violation is a common misunderstanding of 5NF.$dbt71118$, 1, 4),
  ($dbt71119$tq-dbms-sql-21-5nf-6$dbt71119$, $dbt71120$pt-dbms-sql-21-5nf$dbt71120$,
   $dbt71121$What is the practical, hands-on way to test whether a suspected three-way relationship genuinely needs a 5NF-style decomposition?$dbt71121$,
   $dbt71122$["Count the number of columns in the table", "Decompose it into candidate smaller relations and rejoin them, verifying no spurious extra rows appear and no valid combinations are lost", "Check whether the table has a foreign key", "Assume every ternary relationship always needs a 5NF fix"]$dbt71122$::jsonb,
   1, $dbt71123$Since 5NF cases are subtle and rare, the practical validation is empirical: decompose, rejoin, and confirm the join reconstructs exactly the original valid data with nothing spurious or missing.$dbt71123$, 1, 5),
  ($dbt71124$tq-dbms-sql-21-5nf-7$dbt71124$, $dbt71125$pt-dbms-sql-21-5nf$dbt71125$,
   $dbt71126$Which best describes who, in practice, most needs to deeply master 5NF as a working, everyday design tool?$dbt71126$,
   $dbt71127$["Every application developer writing basic CRUD schemas", "Primarily those working on schema-normalization theory or academic/algorithmic database design, rather than typical day-to-day application schema design", "Only mobile app developers", "Anyone who uses a composite primary key"]$dbt71127$::jsonb,
   1, $dbt71128$5NF is largely a theoretical completeness tool; most working engineers rarely, if ever, need to deliberately design for it in ordinary application schemas.$dbt71128$, 1, 6),
  ($dbt71129$tq-dbms-sql-21-5nf-8$dbt71129$, $dbt71130$pt-dbms-sql-21-5nf$dbt71130$,
   $dbt71131$What is the relationship between 5NF and the normal forms preceding it (1NF through 4NF) in terms of strictness?$dbt71131$,
   $dbt71132$["5NF is less strict than 4NF", "5NF is at least as strict as 4NF \u2014 every 5NF relation is also in 4NF, BCNF, 3NF, 2NF, and 1NF, but not every 4NF relation is in 5NF", "5NF and 4NF are unrelated, independent conditions", "5NF only applies to relations that are NOT in 1NF"]$dbt71132$::jsonb,
   1, $dbt71133$Normal forms form a strictly increasing hierarchy of requirements; 5NF sits at the top, requiring everything the lower forms require plus freedom from non-trivial join dependencies.$dbt71133$, 1, 7)
on conflict (id) do nothing;

-- 21.18 Denormalization
with g as (select id from public.learning_grids where lower(slug) = $dbt71134$dbms-sql-tutorial$dbt71134$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71135$chapter-21-normalization-and-functional-dependencies$dbt71135$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71136$Denormalization$dbt71136$, $dbt71137$denormalization$dbt71137$, '', 18, 'published', true, true, $dbt71138$dbms_sql_tutorial$dbt71138$, $dbt71139$chapter-21-normalization-and-functional-dependencies/denormalization$dbt71139$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71140$dbms_sql_tutorial$dbt71140$ and source_ref = $dbt71141$chapter-21-normalization-and-functional-dependencies/denormalization$dbt71141$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71142$Denormalization$dbt71142$, $dbt71143$### Definition

**Denormalization** is the deliberate, informed decision to reintroduce some controlled redundancy into a normalized schema — typically to reduce the number of joins needed for a specific, known, performance-critical read pattern. It is not a mistake or a return to the unnormalized mess of 21.1; it is a conscious trade-off made *after* fully understanding what full normalization requires, in exchange for read speed.

### The Scenario

The final normalized schema from this chapter is:

```
Student(StudentID, StudentName)
Instructor(InstructorID, InstructorName, InstructorOffice)
Course(CourseID, CourseName, InstructorID)
Enrollment(StudentID, CourseID, EnrollmentDate)
```

Now imagine the university's reporting dashboard needs to show, for **every enrollment**, a flat row with `StudentName`, `CourseName`, and `InstructorName` together — refreshed once per day, viewed by hundreds of staff, and queried thousands of times daily with heavy filtering and sorting. In the fully normalized schema, every single one of those queries requires a 4-table join:

```sql
SELECT s.StudentName, c.CourseName, i.InstructorName, e.EnrollmentDate
FROM Enrollment e
JOIN Student s ON e.StudentID = s.StudentID
JOIN Course c ON e.CourseID = c.CourseID
JOIN Instructor i ON c.InstructorID = i.InstructorID;
```

At small scale this is fine. At large scale — hundreds of thousands of enrollments, dashboards refreshed on every page load, complex filter/sort combinations — the repeated join cost becomes a real, measured performance problem.

### The Denormalized Solution

Build a dedicated, deliberately redundant **reporting table**:

```
EnrollmentReport(StudentID, StudentName, CourseID, CourseName,
                 InstructorID, InstructorName, EnrollmentDate)
```

populated by a scheduled job (or a trigger, or a materialized view) that runs the join **once** and flattens the result. Now the dashboard reads directly from `EnrollmentReport` with **zero joins**, at the cost of reintroducing exactly the same kind of redundancy this whole chapter has been eliminating — `StudentName` and `CourseName`/`InstructorName` are once again duplicated per enrollment row, just like the original 21.1 table.

### Why This Is Not "Undoing" Normalization

The critical difference from the original design flaw is that this redundancy is:

1. **Deliberate and scoped** — it exists only in `EnrollmentReport`, a read-optimized copy; the normalized tables (`Student`, `Course`, `Instructor`, `Enrollment`) remain the single source of truth and are still where all writes happen.
2. **Managed, not organic** — a refresh job (or trigger) owns keeping `EnrollmentReport` in sync; application code never writes directly into it, so the update-anomaly risk from 21.3 is contained to one well-understood, automated process instead of scattered manual updates.
3. **Justified by a specific, known access pattern** — high-volume, read-heavy, join-heavy reporting queries where the normalized joins are a measured bottleneck, not a hypothetical one.

### Edge Cases

- Denormalization done *without* first understanding the normalized design and its trade-offs is not a deliberate decision — it's just the same old redundancy problem, undocumented and unmanaged.
- A common middle ground is a **materialized view**, which looks like a denormalized table to readers but is refreshed automatically by the database engine — combining query simplicity with an engine-managed consistency guarantee.
- Denormalization should be reversible and localized: if the reporting requirement changes, `EnrollmentReport` can be dropped and rebuilt without touching the authoritative normalized schema at all.

### Key Takeaways / Interview Angle

- **Q: Define denormalization in one sentence.** The deliberate reintroduction of controlled redundancy into a normalized schema to optimize a specific, known read pattern, usually at the cost of write complexity.
- **Q: How is it different from simply never normalizing in the first place?** It's applied on top of a fully understood normalized design, scoped to a specific derived table, and kept in sync by a managed process — not an unplanned, organically-grown mess touching the system of record.
- **Q: What's the trade-off being made?** Faster reads (fewer/no joins) in exchange for either extra storage plus a synchronization process, or (with materialized views) engine-managed refresh overhead.$dbt71143$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71144$dbms_sql_tutorial_seed$dbt71144$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71145$dbms_sql_tutorial_seed$dbt71145$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71146$dbms-sql-tutorial$dbt71146$),
     t as (select id from public.learning_topics where source_kind = $dbt71147$dbms_sql_tutorial$dbt71147$ and source_ref = $dbt71148$chapter-21-normalization-and-functional-dependencies/denormalization$dbt71148$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71149$pt-dbms-sql-21-denormalization$dbt71149$, $dbt71150$Denormalization - Quick Test$dbt71150$, 'aptitude', 8, 8,
  $dbt71151$8 questions on Denormalization.$dbt71151$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71152$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71152$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71153$tq-dbms-sql-21-denormalization-1$dbt71153$, $dbt71154$pt-dbms-sql-21-denormalization$dbt71154$,
   $dbt71155$What is denormalization, precisely?$dbt71155$,
   $dbt71156$["Forgetting to normalize a schema during initial design", "The deliberate reintroduction of controlled redundancy into an already-normalized schema, to optimize a specific known read-heavy access pattern", "A synonym for reaching 1NF", "Removing all foreign keys from a schema"]$dbt71156$::jsonb,
   1, $dbt71157$Denormalization is a conscious, informed trade-off made after understanding the fully normalized design — not an accident or a shortcut taken instead of normalizing.$dbt71157$, 1, 0),
  ($dbt71158$tq-dbms-sql-21-denormalization-2$dbt71158$, $dbt71159$pt-dbms-sql-21-denormalization$dbt71159$,
   $dbt71160$In the EnrollmentReport example, why is a 4-table join avoided for the reporting dashboard?$dbt71160$,
   $dbt71161$["Because joins are illegal in reporting queries", "Because at large scale, with thousands of daily queries, the repeated join cost becomes a measured performance bottleneck that a flat, pre-joined reporting table eliminates", "Because Student, Course, and Instructor tables are deleted once EnrollmentReport is built", "Because EnrollmentReport uses a different database engine"]$dbt71161$::jsonb,
   1, $dbt71162$The redundant flat table is built specifically to avoid repeating an expensive join on every single dashboard query, given the known heavy read volume.$dbt71162$, 1, 1),
  ($dbt71163$tq-dbms-sql-21-denormalization-3$dbt71163$, $dbt71164$pt-dbms-sql-21-denormalization$dbt71164$,
   $dbt71165$What critically distinguishes the redundancy in EnrollmentReport from the harmful redundancy discussed in topic 21.1?$dbt71165$,
   $dbt71166$["There is no real difference \u2014 both are equally harmful design flaws", "The EnrollmentReport redundancy is deliberate, scoped to a read-optimized copy, and kept in sync by a managed process, while the normalized tables remain the single source of truth for writes", "EnrollmentReport redundancy only exists temporarily during backups", "The redundancy in 21.1 was intentional, while EnrollmentReport's is accidental"]$dbt71166$::jsonb,
   1, $dbt71167$The key differentiator is intentionality and management: denormalization is a conscious, contained decision built on top of a normalized system of record, unlike the original organic redundancy problem.$dbt71167$, 1, 2),
  ($dbt71168$tq-dbms-sql-21-denormalization-4$dbt71168$, $dbt71169$pt-dbms-sql-21-denormalization$dbt71169$,
   $dbt71170$Who or what should be responsible for keeping a denormalized reporting table like EnrollmentReport in sync with the normalized source tables?$dbt71170$,
   $dbt71171$["Individual application developers manually running UPDATE statements whenever they remember to", "A dedicated, automated refresh process (scheduled job, trigger, or materialized view) that owns synchronization, rather than scattered manual updates", "No synchronization is needed once a table is denormalized", "The end users viewing the dashboard"]$dbt71171$::jsonb,
   1, $dbt71172$A managed, automated sync process contains the update-anomaly risk to one well-understood mechanism, rather than reintroducing the same manual-update inconsistency risk from topic 21.3.$dbt71172$, 1, 3),
  ($dbt71173$tq-dbms-sql-21-denormalization-5$dbt71173$, $dbt71174$pt-dbms-sql-21-denormalization$dbt71174$,
   $dbt71175$What is a materialized view, in the context of denormalization?$dbt71175$,
   $dbt71176$["A type of index that speeds up INSERT statements", "A database-engine-managed object that looks like a denormalized flat table to readers but is refreshed automatically by the engine, combining query simplicity with managed consistency", "A synonym for a normalized relation", "A view that can never be queried directly"]$dbt71176$::jsonb,
   1, $dbt71177$Materialized views offer a middle ground: they provide the query simplicity of a denormalized table while the database engine (rather than application code) manages keeping the data current.$dbt71177$, 1, 4),
  ($dbt71178$tq-dbms-sql-21-denormalization-6$dbt71178$, $dbt71179$pt-dbms-sql-21-denormalization$dbt71179$,
   $dbt71180$Why is denormalization applied 'without first understanding the normalized design' considered a red flag rather than a valid trade-off?$dbt71180$,
   $dbt71181$["Because denormalization always requires deleting the normalized tables first", "Because without first understanding what full normalization would require and why, the resulting redundancy is just the same old unmanaged design flaw from 21.1, not an informed, scoped optimization", "Because SQL syntax prevents denormalization without prior normalization", "Because it is technically impossible to denormalize an unnormalized schema"]$dbt71181$::jsonb,
   1, $dbt71182$The entire justification for calling something 'denormalization' rather than 'bad design' rests on it being a deliberate choice made with full knowledge of the normalized alternative and its trade-offs.$dbt71182$, 1, 5),
  ($dbt71183$tq-dbms-sql-21-denormalization-7$dbt71183$, $dbt71184$pt-dbms-sql-21-denormalization$dbt71184$,
   $dbt71185$In the denormalized EnrollmentReport design, where should application writes (e.g., a new enrollment) actually be directed?$dbt71185$,
   $dbt71186$["Directly into EnrollmentReport, bypassing the normalized tables", "Into the normalized tables (Student, Course, Instructor, Enrollment), with EnrollmentReport updated only by the separate managed refresh process", "Into both EnrollmentReport and the normalized tables simultaneously by the application code", "Writes should be disabled entirely once denormalization is introduced"]$dbt71186$::jsonb,
   1, $dbt71187$The normalized tables remain the authoritative system of record for writes; EnrollmentReport is a derived, read-optimized copy that the refresh process — not application write logic — keeps current.$dbt71187$, 1, 6),
  ($dbt71188$tq-dbms-sql-21-denormalization-8$dbt71188$, $dbt71189$pt-dbms-sql-21-denormalization$dbt71189$,
   $dbt71190$What is the fundamental trade-off being made when a team chooses to denormalize a reporting table?$dbt71190$,
   $dbt71191$["Slower reads in exchange for simpler writes", "Faster reads (fewer or no joins) in exchange for extra storage and a synchronization process (or engine-managed refresh overhead)", "Reduced storage in exchange for slower reads", "No trade-off exists; denormalization has zero costs"]$dbt71191$::jsonb,
   1, $dbt71192$Denormalization explicitly accepts additional storage and synchronization complexity (or materialized-view refresh cost) as the price paid for eliminating expensive joins on frequent reads.$dbt71192$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 22: Transactions
-- ---------------------------------------------------------------------------
-- 22.1 Transaction Concept
with g as (select id from public.learning_grids where lower(slug) = $dbt71193$dbms-sql-tutorial$dbt71193$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71194$chapter-22-transactions$dbt71194$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71195$Transaction Concept$dbt71195$, $dbt71196$transaction-concept$dbt71196$, '', 1, 'published', true, true, $dbt71197$dbms_sql_tutorial$dbt71197$, $dbt71198$chapter-22-transactions/transaction-concept$dbt71198$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71199$dbms_sql_tutorial$dbt71199$ and source_ref = $dbt71200$chapter-22-transactions/transaction-concept$dbt71200$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71201$Transaction Concept$dbt71201$, $dbt71202$### Definition

A **transaction** is a sequence of one or more database operations (reads and writes) that must be treated as a single, indivisible logical unit of work — it either completes entirely or has no effect at all. This concept was introduced practically in Chapter 8 (TCL) and Chapter 11 (Data Modification Transactions); this chapter goes deeper into the formal model behind it.

### How It Works

The canonical example remains a bank transfer: debiting one account and crediting another are two separate SQL statements, but they represent ONE real-world action ("transfer money"). A transaction groups them so the database guarantees: either both statements' effects become permanent, or neither does — there is no possible outcome where money leaves one account without arriving at the other.

### Edge Cases and Pitfalls

- A transaction can consist of a SINGLE statement — every individual `INSERT`/`UPDATE`/`DELETE` is technically its own transaction when running in autocommit mode (22.12), even though multi-statement transactions are what most people picture when they hear the word.
- The "logical unit of work" boundary is a business/application decision, not something the database infers automatically — the database only enforces atomicity/consistency for whatever statements you explicitly group; grouping the WRONG set of statements (too few, missing a related update) is a design mistake the database can't catch.
- A transaction's guarantees (the ACID properties, 22.4) apply regardless of how many statements it contains or how long it takes — but see 22.13 for why VERY long-running transactions have real practical costs even though they remain technically correct.

### Key Takeaways

- A transaction groups operations into one indivisible logical unit — all-or-nothing.
- Even a single statement is technically its own transaction under autocommit.
- Choosing which operations belong in one transaction is a design decision the database doesn't make for you.$dbt71202$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71203$dbms_sql_tutorial_seed$dbt71203$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71204$dbms_sql_tutorial_seed$dbt71204$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71205$dbms-sql-tutorial$dbt71205$),
     t as (select id from public.learning_topics where source_kind = $dbt71206$dbms_sql_tutorial$dbt71206$ and source_ref = $dbt71207$chapter-22-transactions/transaction-concept$dbt71207$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71208$pt-dbms-sql-22-transaction-concept$dbt71208$, $dbt71209$Transaction Concept - Quick Test$dbt71209$, 'aptitude', 8, 8,
  $dbt71210$8 questions on Transaction Concept.$dbt71210$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71211$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71211$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71212$tq-dbms-sql-22-transaction-concept-1$dbt71212$, $dbt71213$pt-dbms-sql-22-transaction-concept$dbt71213$,
   $dbt71214$What is a transaction?$dbt71214$,
   $dbt71215$["A single SQL keyword", "A sequence of operations treated as a single, indivisible logical unit of work", "A synonym for a database table", "A type of index"]$dbt71215$::jsonb,
   1, $dbt71216$A transaction bundles operations so they succeed or fail together.$dbt71216$, 1, 0),
  ($dbt71217$tq-dbms-sql-22-transaction-concept-2$dbt71217$, $dbt71218$pt-dbms-sql-22-transaction-concept$dbt71218$,
   $dbt71219$In the bank transfer example, why must debit and credit be in the same transaction?$dbt71219$,
   $dbt71220$["To make the two statements run faster", "So money can never leave one account without arriving at the other, even if something fails partway through", "Because SQL requires exactly two statements per transaction", "To avoid needing a WHERE clause"]$dbt71220$::jsonb,
   1, $dbt71221$Grouping guarantees the all-or-nothing outcome the business logic actually requires.$dbt71221$, 1, 1),
  ($dbt71222$tq-dbms-sql-22-transaction-concept-3$dbt71222$, $dbt71223$pt-dbms-sql-22-transaction-concept$dbt71223$,
   $dbt71224$Is a single INSERT statement running in autocommit mode still technically a transaction?$dbt71224$,
   $dbt71225$["No, transactions always need multiple statements", "Yes \u2014 it's a one-statement transaction that commits immediately", "Only SELECT statements can be single-statement transactions", "This depends on the table's engine"]$dbt71225$::jsonb,
   1, $dbt71226$Every statement runs within some transaction, even a trivial one-statement transaction under autocommit.$dbt71226$, 1, 2),
  ($dbt71227$tq-dbms-sql-22-transaction-concept-4$dbt71227$, $dbt71228$pt-dbms-sql-22-transaction-concept$dbt71228$,
   $dbt71229$Does the database automatically figure out which operations should be grouped into one transaction?$dbt71229$,
   $dbt71230$["Yes, it infers this from the schema", "No \u2014 this is a business/application design decision; the database only enforces guarantees for whatever you explicitly group", "Only for foreign-key-related operations", "The database groups every statement in a session automatically"]$dbt71230$::jsonb,
   1, $dbt71231$Transaction boundaries must be deliberately chosen by whoever writes the application logic.$dbt71231$, 1, 3),
  ($dbt71232$tq-dbms-sql-22-transaction-concept-5$dbt71232$, $dbt71233$pt-dbms-sql-22-transaction-concept$dbt71233$,
   $dbt71234$If a developer forgets to include a related update inside a transaction, will the database catch this mistake?$dbt71234$,
   $dbt71235$["Yes, it always detects missing related operations", "No \u2014 this is a design error the database has no way to catch, since it only knows about statements you actually group together", "Only if foreign keys are involved", "The database automatically adds the missing statement"]$dbt71235$::jsonb,
   1, $dbt71236$The database can't know your intent beyond the statements you actually wrap in a transaction.$dbt71236$, 1, 4),
  ($dbt71237$tq-dbms-sql-22-transaction-concept-6$dbt71237$, $dbt71238$pt-dbms-sql-22-transaction-concept$dbt71238$,
   $dbt71239$Do a transaction's correctness guarantees depend on how many statements it contains?$dbt71239$,
   $dbt71240$["Yes, guarantees only apply to exactly two-statement transactions", "No \u2014 the guarantees apply regardless of statement count, though very long transactions have separate practical costs", "Guarantees only apply to single-statement transactions", "Transactions with more than 5 statements are not supported"]$dbt71240$::jsonb,
   1, $dbt71241$Atomicity/consistency guarantees are independent of transaction size, though performance considerations (22.13) are a separate concern.$dbt71241$, 1, 5),
  ($dbt71242$tq-dbms-sql-22-transaction-concept-7$dbt71242$, $dbt71243$pt-dbms-sql-22-transaction-concept$dbt71243$,
   $dbt71244$Where was the transaction concept first introduced practically in this course?$dbt71244$,
   $dbt71245$["Chapter 20 (Indexes)", "Chapter 8 (TCL) and Chapter 11 (Data Modification Transactions)", "Chapter 1 (Database Foundations)", "Chapter 16 (Joins)"]$dbt71245$::jsonb,
   1, $dbt71246$This chapter builds on the practical TCL introduction from earlier chapters.$dbt71246$, 1, 6),
  ($dbt71247$tq-dbms-sql-22-transaction-concept-8$dbt71247$, $dbt71248$pt-dbms-sql-22-transaction-concept$dbt71248$,
   $dbt71249$What does 'all-or-nothing' mean for a transaction's real-world effect?$dbt71249$,
   $dbt71250$["At least half the statements must succeed", "Either every statement's effect becomes permanent, or none of them do", "The first statement always succeeds regardless of the rest", "Statements are applied in random order"]$dbt71250$::jsonb,
   1, $dbt71251$This is the essence of atomicity — no partial completion is a valid outcome.$dbt71251$, 1, 7)
on conflict (id) do nothing;

-- 22.2 Transaction Boundaries
with g as (select id from public.learning_grids where lower(slug) = $dbt71252$dbms-sql-tutorial$dbt71252$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71253$chapter-22-transactions$dbt71253$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71254$Transaction Boundaries$dbt71254$, $dbt71255$transaction-boundaries$dbt71255$, '', 2, 'published', true, true, $dbt71256$dbms_sql_tutorial$dbt71256$, $dbt71257$chapter-22-transactions/transaction-boundaries$dbt71257$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71258$dbms_sql_tutorial$dbt71258$ and source_ref = $dbt71259$chapter-22-transactions/transaction-boundaries$dbt71259$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71260$Transaction Boundaries$dbt71260$, $dbt71261$### Definition

**Transaction boundaries** are the explicit start and end points of a transaction — where it begins (`BEGIN`/`START TRANSACTION`) and where it ends, either successfully (`COMMIT`) or unsuccessfully (`ROLLBACK`).

### How It Works

```sql
START TRANSACTION;      -- boundary: start
UPDATE accounts SET balance = balance - 200 WHERE id = 1;
UPDATE accounts SET balance = balance + 200 WHERE id = 2;
COMMIT;                 -- boundary: successful end
```

Everything between `START TRANSACTION` and `COMMIT`/`ROLLBACK` is inside the transaction's boundary — a single logical unit. Under autocommit mode (22.12), every individual statement has its OWN implicit boundary (start and commit happen automatically around each statement) unless an explicit `START TRANSACTION` overrides that default.

### Edge Cases and Pitfalls

- Forgetting the closing boundary (`COMMIT`/`ROLLBACK`) leaves a transaction OPEN indefinitely — holding locks and blocking other work (as covered in 11.11) — a genuinely common operational mistake, especially in interactive database sessions where someone runs `START TRANSACTION`, gets distracted, and never finishes it.
- Some dialects auto-commit a transaction implicitly when a DDL statement (`CREATE TABLE`, etc.) is executed inside it — meaning a boundary can end EARLIER than the explicit `COMMIT`/`ROLLBACK` you wrote, without warning (this connects back to Chapter 9's note that DDL auto-commits on most engines).
- Nesting `START TRANSACTION` inside an already-open transaction behaves differently across dialects — some implicitly commit the first transaction before starting a "new" one, rather than truly nesting (see 22.13).

### Key Takeaways

- Transaction boundaries are the explicit start (BEGIN/START TRANSACTION) and end (COMMIT/ROLLBACK) points marking one logical unit.
- Autocommit gives every statement an implicit boundary unless explicitly overridden.
- Forgetting to close a boundary leaves a transaction open, risking held locks — a genuinely common real mistake.$dbt71261$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71262$dbms_sql_tutorial_seed$dbt71262$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71263$dbms_sql_tutorial_seed$dbt71263$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71264$dbms-sql-tutorial$dbt71264$),
     t as (select id from public.learning_topics where source_kind = $dbt71265$dbms_sql_tutorial$dbt71265$ and source_ref = $dbt71266$chapter-22-transactions/transaction-boundaries$dbt71266$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71267$pt-dbms-sql-22-transaction-boundaries$dbt71267$, $dbt71268$Transaction Boundaries - Quick Test$dbt71268$, 'aptitude', 8, 8,
  $dbt71269$8 questions on Transaction Boundaries.$dbt71269$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71270$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71270$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71271$tq-dbms-sql-22-transaction-boundaries-1$dbt71271$, $dbt71272$pt-dbms-sql-22-transaction-boundaries$dbt71272$,
   $dbt71273$What marks the start of an explicit transaction?$dbt71273$,
   $dbt71274$["SELECT", "START TRANSACTION (or BEGIN)", "CREATE TABLE", "WHERE"]$dbt71274$::jsonb,
   1, $dbt71275$START TRANSACTION/BEGIN explicitly opens a transaction boundary.$dbt71275$, 1, 0),
  ($dbt71276$tq-dbms-sql-22-transaction-boundaries-2$dbt71276$, $dbt71277$pt-dbms-sql-22-transaction-boundaries$dbt71277$,
   $dbt71278$What are the two ways a transaction boundary can successfully or unsuccessfully close?$dbt71278$,
   $dbt71279$["SELECT and INSERT", "COMMIT (success) and ROLLBACK (failure/undo)", "CREATE and DROP", "GRANT and REVOKE"]$dbt71279$::jsonb,
   1, $dbt71280$COMMIT finalizes the transaction; ROLLBACK undoes it — the two ways to close a boundary.$dbt71280$, 1, 1),
  ($dbt71281$tq-dbms-sql-22-transaction-boundaries-3$dbt71281$, $dbt71282$pt-dbms-sql-22-transaction-boundaries$dbt71282$,
   $dbt71283$What happens under autocommit mode without an explicit START TRANSACTION?$dbt71283$,
   $dbt71284$["No transaction boundary exists at all", "Each individual statement gets its own implicit start-and-commit boundary", "All statements share one boundary for the entire session", "Autocommit disables all transactions"]$dbt71284$::jsonb,
   1, $dbt71285$Autocommit wraps each statement in its own tiny implicit transaction.$dbt71285$, 1, 2),
  ($dbt71286$tq-dbms-sql-22-transaction-boundaries-4$dbt71286$, $dbt71287$pt-dbms-sql-22-transaction-boundaries$dbt71287$,
   $dbt71288$What real operational risk comes from forgetting to COMMIT or ROLLBACK an open transaction?$dbt71288$,
   $dbt71289$["No risk \u2014 it closes automatically after a few seconds", "The transaction stays open indefinitely, holding locks and blocking other work", "The database automatically deletes the affected rows", "This only affects SELECT statements"]$dbt71289$::jsonb,
   1, $dbt71290$An unclosed transaction can hold locks for as long as it remains open, a genuinely common real mistake.$dbt71290$, 1, 3),
  ($dbt71291$tq-dbms-sql-22-transaction-boundaries-5$dbt71291$, $dbt71292$pt-dbms-sql-22-transaction-boundaries$dbt71292$,
   $dbt71293$Can a DDL statement executed inside a transaction end that transaction's boundary early, on some engines?$dbt71293$,
   $dbt71294$["No, only explicit COMMIT/ROLLBACK can end a transaction", "Yes \u2014 DDL auto-commits on most engines, closing the boundary earlier than the explicit COMMIT/ROLLBACK you wrote", "DDL statements cannot be executed inside any transaction", "This only happens with SELECT statements"]$dbt71294$::jsonb,
   1, $dbt71295$This connects back to Chapter 9's DDL auto-commit behavior — a genuine cross-cutting gotcha.$dbt71295$, 1, 4),
  ($dbt71296$tq-dbms-sql-22-transaction-boundaries-6$dbt71296$, $dbt71297$pt-dbms-sql-22-transaction-boundaries$dbt71297$,
   $dbt71298$Does starting a new transaction while one is already open behave identically across all SQL dialects?$dbt71298$,
   $dbt71299$["Yes, universally identical behavior", "No \u2014 some dialects implicitly commit the first transaction rather than truly nesting, a dialect-dependent behavior", "This always raises a hard error everywhere", "Nested START TRANSACTION is illegal syntax everywhere"]$dbt71299$::jsonb,
   1, $dbt71300$True nested transactions are not universally supported — behavior varies by dialect (see 22.13).$dbt71300$, 1, 5),
  ($dbt71301$tq-dbms-sql-22-transaction-boundaries-7$dbt71301$, $dbt71302$pt-dbms-sql-22-transaction-boundaries$dbt71302$,
   $dbt71303$What is inside a transaction's boundary?$dbt71303$,
   $dbt71304$["Only the first statement after START TRANSACTION", "Every statement between START TRANSACTION and the closing COMMIT/ROLLBACK", "Only SELECT statements", "Nothing \u2014 boundaries are purely conceptual with no real statements inside them"]$dbt71304$::jsonb,
   1, $dbt71305$All statements executed between the opening and closing boundary belong to that one transaction.$dbt71305$, 1, 6),
  ($dbt71306$tq-dbms-sql-22-transaction-boundaries-8$dbt71306$, $dbt71307$pt-dbms-sql-22-transaction-boundaries$dbt71307$,
   $dbt71308$Why might an interactive database session be especially prone to leaving a transaction boundary open by mistake?$dbt71308$,
   $dbt71309$["Interactive sessions cannot open transactions", "A person might run START TRANSACTION, get interrupted, and never issue the closing COMMIT/ROLLBACK", "Interactive sessions always auto-close transactions after each command", "This risk only applies to automated scripts, not interactive use"]$dbt71309$::jsonb,
   1, $dbt71310$Human interruption during an interactive session is a realistic, common way for a transaction to be left open.$dbt71310$, 1, 7)
on conflict (id) do nothing;

-- 22.3 Transaction States
with g as (select id from public.learning_grids where lower(slug) = $dbt71311$dbms-sql-tutorial$dbt71311$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71312$chapter-22-transactions$dbt71312$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71313$Transaction States$dbt71313$, $dbt71314$transaction-states$dbt71314$, '', 3, 'published', true, true, $dbt71315$dbms_sql_tutorial$dbt71315$, $dbt71316$chapter-22-transactions/transaction-states$dbt71316$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71317$dbms_sql_tutorial$dbt71317$ and source_ref = $dbt71318$chapter-22-transactions/transaction-states$dbt71318$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71319$Transaction States$dbt71319$, $dbt71320$### Definition

A transaction moves through a well-defined sequence of **states** during its lifetime: **Active** → **Partially Committed** → **Committed**, or, if something goes wrong: **Active** → **Failed** → **Aborted**.

### How It Works

- **Active**: the transaction is executing its operations — the normal, initial state.
- **Partially Committed**: the transaction's final operation has executed, but the changes aren't yet guaranteed durable on disk — a brief transitional state before the engine confirms the write is safe.
- **Committed**: the transaction has successfully completed, and its changes are now permanent (durable, 22.8) — this is a terminal state; a committed transaction cannot be undone by a later `ROLLBACK`.
- **Failed**: something went wrong (a constraint violation, a system crash, a deadlock) after the transaction started but before it could commit — execution cannot continue normally.
- **Aborted**: the transaction has been rolled back after failing, restoring the database to its state before the transaction began — also a terminal state; from here, the transaction might be retried as an entirely NEW transaction (not resumed).

### Edge Cases and Pitfalls

- Once a transaction reaches **Committed**, there is no way back — a mistake discovered after commit requires a NEW, separate transaction (perhaps a compensating one) to fix, not a rollback of the already-committed one.
- The transition from Active to Failed can be triggered by things entirely OUTSIDE the application's control (a server crash, a deadlock the database itself detects and resolves by aborting one of the involved transactions) — application code needs to handle "my transaction was aborted for reasons I didn't cause" as a real, expected scenario, not just self-inflicted rollbacks.
- "Partially committed" is a genuinely brief, often invisible state in practice — most discussions of transaction states simplify to Active/Committed/Aborted for everyday purposes, but the full five-state model matters for understanding exactly when durability (22.8) actually kicks in.

### Key Takeaways

- The transaction state machine: Active -> Partially Committed -> Committed (success path), or Active -> Failed -> Aborted (failure path).
- Committed is a terminal, irreversible state — fixing a mistake after commit needs a new transaction.
- A transaction can fail for reasons outside the application's control (crashes, deadlocks) — this must be handled as a normal case.$dbt71320$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71321$dbms_sql_tutorial_seed$dbt71321$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71322$dbms_sql_tutorial_seed$dbt71322$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71323$dbms-sql-tutorial$dbt71323$),
     t as (select id from public.learning_topics where source_kind = $dbt71324$dbms_sql_tutorial$dbt71324$ and source_ref = $dbt71325$chapter-22-transactions/transaction-states$dbt71325$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71326$pt-dbms-sql-22-transaction-states$dbt71326$, $dbt71327$Transaction States - Quick Test$dbt71327$, 'aptitude', 8, 8,
  $dbt71328$8 questions on Transaction States.$dbt71328$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71329$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71329$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71330$tq-dbms-sql-22-transaction-states-1$dbt71330$, $dbt71331$pt-dbms-sql-22-transaction-states$dbt71331$,
   $dbt71332$What is the initial state of a transaction when it begins executing?$dbt71332$,
   $dbt71333$["Committed", "Active", "Aborted", "Failed"]$dbt71333$::jsonb,
   1, $dbt71334$Active is the starting state while operations are executing.$dbt71334$, 1, 0),
  ($dbt71335$tq-dbms-sql-22-transaction-states-2$dbt71335$, $dbt71336$pt-dbms-sql-22-transaction-states$dbt71336$,
   $dbt71337$What state does a transaction reach after successfully executing its final operation, just before durability is fully confirmed?$dbt71337$,
   $dbt71338$["Aborted", "Partially Committed", "Failed", "Active"]$dbt71338$::jsonb,
   1, $dbt71339$Partially Committed is the brief transitional state before full commit confirmation.$dbt71339$, 1, 1),
  ($dbt71340$tq-dbms-sql-22-transaction-states-3$dbt71340$, $dbt71341$pt-dbms-sql-22-transaction-states$dbt71341$,
   $dbt71342$Can a Committed transaction be undone with a later ROLLBACK?$dbt71342$,
   $dbt71343$["Yes, ROLLBACK can undo any past transaction", "No \u2014 Committed is a terminal state; undoing a mistake requires a new, separate transaction", "Only within the same database session", "Only if no other transactions have run since"]$dbt71343$::jsonb,
   1, $dbt71344$Once committed, changes are permanent — no rollback can reach back into an already-committed transaction.$dbt71344$, 1, 2),
  ($dbt71345$tq-dbms-sql-22-transaction-states-4$dbt71345$, $dbt71346$pt-dbms-sql-22-transaction-states$dbt71346$,
   $dbt71347$What is the failure path through the transaction state machine?$dbt71347$,
   $dbt71348$["Active -> Committed -> Aborted", "Active -> Failed -> Aborted", "Failed -> Active -> Committed", "Aborted -> Failed -> Active"]$dbt71348$::jsonb,
   1, $dbt71349$A problem moves the transaction from Active to Failed, and it's then rolled back into the Aborted state.$dbt71349$, 1, 3),
  ($dbt71350$tq-dbms-sql-22-transaction-states-5$dbt71350$, $dbt71351$pt-dbms-sql-22-transaction-states$dbt71351$,
   $dbt71352$Can a transaction move to the Failed state for reasons outside the application's own logic?$dbt71352$,
   $dbt71353$["No, only application bugs cause failure", "Yes \u2014 a server crash or a deadlock the database detects and resolves can abort a transaction with no application-level cause", "Failure can only be triggered by an explicit ROLLBACK statement", "Failed transactions are always the application's fault"]$dbt71353$::jsonb,
   1, $dbt71354$External factors like crashes and deadlock resolution are real, expected causes of transaction failure.$dbt71354$, 1, 4),
  ($dbt71355$tq-dbms-sql-22-transaction-states-6$dbt71355$, $dbt71356$pt-dbms-sql-22-transaction-states$dbt71356$,
   $dbt71357$After a transaction reaches the Aborted state, can it be 'resumed' from where it left off?$dbt71357$,
   $dbt71358$["Yes, it resumes automatically", "No \u2014 it must be retried as an entirely new transaction, not resumed", "It resumes from the Partially Committed state", "Aborted transactions cannot ever be retried"]$dbt71358$::jsonb,
   1, $dbt71359$Aborted is terminal; recovery means starting over with a new transaction, not resuming the old one.$dbt71359$, 1, 5),
  ($dbt71360$tq-dbms-sql-22-transaction-states-7$dbt71360$, $dbt71361$pt-dbms-sql-22-transaction-states$dbt71361$,
   $dbt71362$Why is the 'Partially Committed' state often omitted from simplified discussions of transactions?$dbt71362$,
   $dbt71363$["It doesn't actually exist", "It's typically a very brief, often invisible transitional state, so Active/Committed/Aborted covers most everyday purposes", "It only applies to SELECT statements", "It is identical to the Active state"]$dbt71363$::jsonb,
   1, $dbt71364$The full five-state model is more precise, but the brief transitional state is often elided in everyday explanations.$dbt71364$, 1, 6),
  ($dbt71365$tq-dbms-sql-22-transaction-states-8$dbt71365$, $dbt71366$pt-dbms-sql-22-transaction-states$dbt71366$,
   $dbt71367$Is 'Aborted' the same state as 'Failed'?$dbt71367$,
   $dbt71368$["Yes, they are synonyms", "No \u2014 Failed means something went wrong and execution cannot continue; Aborted is the terminal state reached after the rollback that follows a failure", "Aborted happens before Failed in the sequence", "Failed is a terminal state, and Aborted precedes it"]$dbt71368$::jsonb,
   1, $dbt71369$Failed is the trigger state; Aborted is the resulting terminal state after rollback completes.$dbt71369$, 1, 7)
on conflict (id) do nothing;

-- 22.4 ACID
with g as (select id from public.learning_grids where lower(slug) = $dbt71370$dbms-sql-tutorial$dbt71370$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71371$chapter-22-transactions$dbt71371$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71372$ACID$dbt71372$, $dbt71373$acid$dbt71373$, '', 4, 'published', true, true, $dbt71374$dbms_sql_tutorial$dbt71374$, $dbt71375$chapter-22-transactions/acid$dbt71375$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71376$dbms_sql_tutorial$dbt71376$ and source_ref = $dbt71377$chapter-22-transactions/acid$dbt71377$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71378$ACID$dbt71378$, $dbt71379$### Definition

**ACID** is the acronym for the four properties a reliable transaction must guarantee: **Atomicity**, **Consistency**, **Isolation**, **Durability**. Each is covered in depth in its own topic (22.5-22.8); this topic introduces them together as a unified framework.

### How It Works

| Letter | Property | One-line meaning |
|---|---|---|
| A | Atomicity | All-or-nothing — no partial completion |
| C | Consistency | The database moves from one valid state to another valid state |
| I | Isolation | Concurrent transactions don't interfere with each other's intermediate state |
| D | Durability | Once committed, changes survive even a crash |

These four properties together are WHY a transaction can be trusted as a reliable building block for correct application logic, even in the presence of concurrent users, hardware failures, and bugs.

### Edge Cases and Pitfalls

- The four letters are often taught as if they're independent, but they interact: Atomicity is partly what makes Consistency achievable (an incomplete update could leave data inconsistent), and Isolation exists specifically to prevent concurrent transactions from seeing each other's not-yet-atomic, in-progress state.
- Not every storage engine provides full ACID guarantees — as discovered practically in this course, MySQL's default `MyISAM` engine does NOT support transactions at all (no real Atomicity/Isolation/Durability for multi-statement operations), while `InnoDB` does; choosing a transactional storage engine is a prerequisite for ACID to mean anything.
- "Consistency" in ACID is sometimes confused with the "C" in the CAP theorem (a distributed-systems concept covered in Chapter 38) — they are related but NOT the same concept; ACID's Consistency is about respecting the database's own constraints/rules, while CAP's Consistency is about all nodes seeing the same data at the same time in a distributed system.

### Key Takeaways

- ACID = Atomicity, Consistency, Isolation, Durability — the four guarantees a reliable transaction provides.
- These properties depend on the storage engine actually supporting transactions (e.g. InnoDB, not MyISAM).
- ACID's "Consistency" and the CAP theorem's "Consistency" (Chapter 38) are related but distinct concepts — don't conflate them.$dbt71379$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71380$dbms_sql_tutorial_seed$dbt71380$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71381$dbms_sql_tutorial_seed$dbt71381$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71382$dbms-sql-tutorial$dbt71382$),
     t as (select id from public.learning_topics where source_kind = $dbt71383$dbms_sql_tutorial$dbt71383$ and source_ref = $dbt71384$chapter-22-transactions/acid$dbt71384$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71385$pt-dbms-sql-22-acid$dbt71385$, $dbt71386$ACID - Quick Test$dbt71386$, 'aptitude', 8, 8,
  $dbt71387$8 questions on ACID.$dbt71387$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71388$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71388$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71389$tq-dbms-sql-22-acid-1$dbt71389$, $dbt71390$pt-dbms-sql-22-acid$dbt71390$,
   $dbt71391$What does the A in ACID stand for?$dbt71391$,
   $dbt71392$["Availability", "Atomicity", "Accuracy", "Asynchrony"]$dbt71392$::jsonb,
   1, $dbt71393$Atomicity is the all-or-nothing guarantee.$dbt71393$, 1, 0),
  ($dbt71394$tq-dbms-sql-22-acid-2$dbt71394$, $dbt71395$pt-dbms-sql-22-acid$dbt71395$,
   $dbt71396$What does the D in ACID stand for?$dbt71396$,
   $dbt71397$["Deletion", "Durability", "Decomposition", "Dependency"]$dbt71397$::jsonb,
   1, $dbt71398$Durability guarantees committed changes survive crashes.$dbt71398$, 1, 1),
  ($dbt71399$tq-dbms-sql-22-acid-3$dbt71399$, $dbt71400$pt-dbms-sql-22-acid$dbt71400$,
   $dbt71401$Which storage engine, as discovered practically in this course, does NOT support real transactions?$dbt71401$,
   $dbt71402$["InnoDB", "MyISAM", "Both support transactions identically", "Neither supports transactions"]$dbt71402$::jsonb,
   1, $dbt71403$MyISAM lacks transaction support entirely — ROLLBACK silently does nothing on MyISAM tables.$dbt71403$, 1, 2),
  ($dbt71404$tq-dbms-sql-22-acid-4$dbt71404$, $dbt71405$pt-dbms-sql-22-acid$dbt71405$,
   $dbt71406$Is ACID's 'Consistency' the same concept as the 'Consistency' in the CAP theorem?$dbt71406$,
   $dbt71407$["Yes, identical concepts", "No \u2014 they are related but distinct: ACID Consistency is about respecting database constraints/rules, CAP Consistency is about all distributed nodes agreeing on data", "CAP theorem doesn't have a Consistency concept", "ACID Consistency only applies to distributed databases"]$dbt71407$::jsonb,
   1, $dbt71408$This is a classic point of confusion worth explicitly distinguishing, as covered further in Chapter 38.$dbt71408$, 1, 3),
  ($dbt71409$tq-dbms-sql-22-acid-5$dbt71409$, $dbt71410$pt-dbms-sql-22-acid$dbt71410$,
   $dbt71411$Why is choosing a transactional storage engine a prerequisite for ACID guarantees?$dbt71411$,
   $dbt71412$["It isn't actually required", "Without transaction support, there is no real Atomicity/Isolation/Durability for multi-statement operations \u2014 ACID guarantees only apply where the engine actually implements them", "ACID guarantees are provided by the SQL language itself, independent of storage engine", "Only Consistency requires a transactional engine"]$dbt71412$::jsonb,
   1, $dbt71413$ACID is only meaningful when the underlying engine actually implements transaction support.$dbt71413$, 1, 4),
  ($dbt71414$tq-dbms-sql-22-acid-6$dbt71414$, $dbt71415$pt-dbms-sql-22-acid$dbt71415$,
   $dbt71416$How do Atomicity and Consistency interact?$dbt71416$,
   $dbt71417$["They are completely unrelated", "Atomicity partly enables Consistency \u2014 an incomplete (non-atomic) update could leave the database in an invalid, inconsistent state", "Consistency makes Atomicity unnecessary", "They are exact synonyms"]$dbt71417$::jsonb,
   1, $dbt71418$The four ACID properties aren't fully independent — atomicity helps guarantee consistency is achievable.$dbt71418$, 1, 5),
  ($dbt71419$tq-dbms-sql-22-acid-7$dbt71419$, $dbt71420$pt-dbms-sql-22-acid$dbt71420$,
   $dbt71421$What role does Isolation play among the four ACID properties?$dbt71421$,
   $dbt71422$["It has no relationship to the other three", "It prevents concurrent transactions from seeing each other's not-yet-complete, in-progress state, which could otherwise violate atomicity's guarantees from an outside observer's perspective", "It only matters for single-user databases", "It replaces the need for Atomicity entirely"]$dbt71422$::jsonb,
   1, $dbt71423$Isolation protects the illusion of atomicity when multiple transactions run concurrently.$dbt71423$, 1, 6),
  ($dbt71424$tq-dbms-sql-22-acid-8$dbt71424$, $dbt71425$pt-dbms-sql-22-acid$dbt71425$,
   $dbt71426$What is the overall purpose of the ACID guarantees together?$dbt71426$,
   $dbt71427$["To make queries run faster", "To make transactions a reliable building block for correct application logic despite concurrency, failures, and bugs", "To reduce the amount of disk storage used", "To simplify SQL syntax"]$dbt71427$::jsonb,
   1, $dbt71428$ACID's combined purpose is trustworthiness of transactions under real-world conditions.$dbt71428$, 1, 7)
on conflict (id) do nothing;

-- 22.5 Atomicity
with g as (select id from public.learning_grids where lower(slug) = $dbt71429$dbms-sql-tutorial$dbt71429$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71430$chapter-22-transactions$dbt71430$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71431$Atomicity$dbt71431$, $dbt71432$atomicity$dbt71432$, '', 5, 'published', true, true, $dbt71433$dbms_sql_tutorial$dbt71433$, $dbt71434$chapter-22-transactions/atomicity$dbt71434$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71435$dbms_sql_tutorial$dbt71435$ and source_ref = $dbt71436$chapter-22-transactions/atomicity$dbt71436$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71437$Atomicity$dbt71437$, $dbt71438$### Definition

**Atomicity** guarantees that a transaction's operations are treated as one indivisible unit: either ALL of them take effect, or NONE do — there is no possible outcome where only some of a transaction's statements succeeded.

### How It Works

```sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 200 WHERE id = 1;  -- succeeds
UPDATE accounts SET balance = balance + 200 WHERE id = 2;  -- suppose this fails (e.g. a crash)
COMMIT;
```

If the second `UPDATE` fails for any reason before `COMMIT`, atomicity guarantees the FIRST `UPDATE`'s effect is also undone — the database automatically rolls back the entire transaction rather than leaving the debit applied with no matching credit. This is what makes the bank-transfer example safe: a partial transfer is never a real, visible outcome.

### Edge Cases and Pitfalls

- Atomicity is about the TRANSACTION's own statements — it says nothing about coordinating with something OUTSIDE the database (like also calling an external payment API) — a transaction that commits successfully in the database but where a related external call fails is a real, harder problem (distributed transactions/sagas) beyond plain ACID atomicity's scope.
- A `CHECK`/`FOREIGN KEY`/`UNIQUE` constraint violation partway through a multi-statement transaction triggers exactly this atomicity guarantee — the whole transaction rolls back, not just the offending statement.
- Atomicity requires the storage engine to actually support it — as verified practically, MyISAM tables have NO atomicity guarantee across multiple statements; only a transactional engine like InnoDB provides it.

### Key Takeaways

- Atomicity = all transaction statements succeed together, or none do — no partial completion is ever a visible outcome.
- A failure anywhere before COMMIT triggers automatic rollback of everything already done in that transaction.
- Atomicity only covers the database's own operations — coordinating with external systems needs additional patterns beyond plain ACID.$dbt71438$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71439$dbms_sql_tutorial_seed$dbt71439$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71440$dbms_sql_tutorial_seed$dbt71440$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71441$dbms-sql-tutorial$dbt71441$),
     t as (select id from public.learning_topics where source_kind = $dbt71442$dbms_sql_tutorial$dbt71442$ and source_ref = $dbt71443$chapter-22-transactions/atomicity$dbt71443$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71444$pt-dbms-sql-22-atomicity$dbt71444$, $dbt71445$Atomicity - Quick Test$dbt71445$, 'aptitude', 8, 8,
  $dbt71446$8 questions on Atomicity.$dbt71446$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71447$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71447$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71448$tq-dbms-sql-22-atomicity-1$dbt71448$, $dbt71449$pt-dbms-sql-22-atomicity$dbt71449$,
   $dbt71450$What does Atomicity guarantee?$dbt71450$,
   $dbt71451$["Fast query execution", "All of a transaction's statements succeed together, or none do", "Data is always encrypted", "Only one user can access the database at a time"]$dbt71451$::jsonb,
   1, $dbt71452$Atomicity is specifically the all-or-nothing guarantee.$dbt71452$, 1, 0),
  ($dbt71453$tq-dbms-sql-22-atomicity-2$dbt71453$, $dbt71454$pt-dbms-sql-22-atomicity$dbt71454$,
   $dbt71455$In the bank transfer example, what does atomicity prevent?$dbt71455$,
   $dbt71456$["The transfer from ever succeeding", "A partial transfer \u2014 money debited from one account with no corresponding credit to the other", "The need for a WHERE clause", "Multiple transfers happening in the same session"]$dbt71456$::jsonb,
   1, $dbt71457$This is exactly the scenario atomicity is designed to prevent.$dbt71457$, 1, 1),
  ($dbt71458$tq-dbms-sql-22-atomicity-3$dbt71458$, $dbt71459$pt-dbms-sql-22-atomicity$dbt71459$,
   $dbt71460$If a CHECK constraint is violated partway through a multi-statement transaction, what does atomicity guarantee?$dbt71460$,
   $dbt71461$["Only the violating statement is rolled back; earlier statements remain applied", "The entire transaction rolls back, undoing everything already done in it", "The constraint is temporarily disabled to let the transaction proceed", "Nothing \u2014 constraints don't interact with atomicity"]$dbt71461$::jsonb,
   1, $dbt71462$A constraint violation anywhere in the transaction triggers the same whole-transaction rollback atomicity guarantees.$dbt71462$, 1, 2),
  ($dbt71463$tq-dbms-sql-22-atomicity-4$dbt71463$, $dbt71464$pt-dbms-sql-22-atomicity$dbt71464$,
   $dbt71465$Does atomicity cover coordination with systems OUTSIDE the database, like an external payment API call?$dbt71465$,
   $dbt71466$["Yes, atomicity automatically covers any external system involved", "No \u2014 atomicity only covers the database's own operations; external coordination needs additional patterns beyond plain ACID", "Only if the external call is made from a stored procedure", "This scenario is impossible in practice"]$dbt71466$::jsonb,
   1, $dbt71467$Plain ACID atomicity is scoped to the database transaction itself, not external side effects.$dbt71467$, 1, 3),
  ($dbt71468$tq-dbms-sql-22-atomicity-5$dbt71468$, $dbt71469$pt-dbms-sql-22-atomicity$dbt71469$,
   $dbt71470$Does atomicity work on a MyISAM table?$dbt71470$,
   $dbt71471$["Yes, identically to InnoDB", "No \u2014 MyISAM has no real atomicity guarantee across multiple statements, as verified practically in this course", "Atomicity only matters for SELECT statements, so engine choice is irrelevant", "MyISAM provides stronger atomicity than InnoDB"]$dbt71471$::jsonb,
   1, $dbt71472$Atomicity requires actual transaction support from the storage engine, which MyISAM lacks.$dbt71472$, 1, 4),
  ($dbt71473$tq-dbms-sql-22-atomicity-6$dbt71473$, $dbt71474$pt-dbms-sql-22-atomicity$dbt71474$,
   $dbt71475$What triggers an automatic rollback under atomicity?$dbt71475$,
   $dbt71476$["Only an explicit ROLLBACK statement", "Any failure occurring before COMMIT, such as a constraint violation or a crash", "Only a SELECT statement returning zero rows", "Atomicity never triggers automatic rollback"]$dbt71476$::jsonb,
   1, $dbt71477$Various failure types before commit all trigger atomicity's automatic undo behavior.$dbt71477$, 1, 5),
  ($dbt71478$tq-dbms-sql-22-atomicity-7$dbt71478$, $dbt71479$pt-dbms-sql-22-atomicity$dbt71479$,
   $dbt71480$Is a 'partial transfer' (debit without credit) ever a valid, visible outcome under atomicity?$dbt71480$,
   $dbt71481$["Yes, in rare edge cases", "No \u2014 atomicity specifically guarantees this can never be a real, visible outcome", "Only if the transaction is very long", "Only on weekends, due to batch processing windows"]$dbt71481$::jsonb,
   1, $dbt71482$Preventing exactly this outcome is atomicity's defining purpose.$dbt71482$, 1, 6),
  ($dbt71483$tq-dbms-sql-22-atomicity-8$dbt71483$, $dbt71484$pt-dbms-sql-22-atomicity$dbt71484$,
   $dbt71485$What real-world problem class extends beyond plain ACID atomicity when a transaction needs to coordinate with an external, non-database system?$dbt71485$,
   $dbt71486$["Normalization", "Distributed transactions/sagas", "Indexing strategy", "Query optimization"]$dbt71486$::jsonb,
   1, $dbt71487$Coordinating a database transaction with an external side effect is the domain of distributed transaction patterns, beyond single-database ACID.$dbt71487$, 1, 7)
on conflict (id) do nothing;

-- 22.6 Consistency
with g as (select id from public.learning_grids where lower(slug) = $dbt71488$dbms-sql-tutorial$dbt71488$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71489$chapter-22-transactions$dbt71489$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71490$Consistency$dbt71490$, $dbt71491$consistency$dbt71491$, '', 6, 'published', true, true, $dbt71492$dbms_sql_tutorial$dbt71492$, $dbt71493$chapter-22-transactions/consistency$dbt71493$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71494$dbms_sql_tutorial$dbt71494$ and source_ref = $dbt71495$chapter-22-transactions/consistency$dbt71495$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71496$Consistency$dbt71496$, $dbt71497$### Definition

**Consistency** (the C in ACID) guarantees that a transaction takes the database from one VALID state to another valid state — every constraint (`NOT NULL`, `CHECK`, `FOREIGN KEY`, `UNIQUE`) that held true before the transaction still holds true after it, whether the transaction commits or rolls back.

### How It Works

If a `CHECK (balance >= 0)` constraint exists on `accounts`, a transaction that would leave any account with a negative balance is rejected — the database refuses to move into that invalid state, preserving consistency. The transaction either completes while respecting every constraint, or it doesn't complete at all (tying back to Atomicity, 22.5, which is part of what makes this possible).

### Edge Cases and Pitfalls

- Consistency in the ACID sense is about respecting the database's OWN declared rules (constraints) — it does NOT mean the data is necessarily "correct" in a real-world business sense beyond what's actually encoded as a constraint; a transaction that's technically ACID-consistent can still represent a business logic mistake the database has no way to detect (see Chapter 10's Business Constraints — only what's actually declared as a CHECK/constraint is enforced).
- Don't confuse this with the CAP theorem's "Consistency" (Chapter 38), a distributed-systems concept about multiple nodes agreeing on the same data — a completely different, if related-sounding, idea.
- Consistency is really a joint responsibility: the database enforces whatever constraints you've DECLARED, but designing the RIGHT constraints (matching your actual business rules) is the schema designer's job, not something the database can infer on its own.

### Key Takeaways

- ACID Consistency means every declared constraint holds both before and after a transaction, whether it commits or rolls back.
- It doesn't guarantee "correctness" beyond whatever constraints are actually declared — undeclared business rules aren't protected.
- ACID Consistency is a different concept from CAP theorem Consistency, despite the shared name.$dbt71497$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71498$dbms_sql_tutorial_seed$dbt71498$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71499$dbms_sql_tutorial_seed$dbt71499$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71500$dbms-sql-tutorial$dbt71500$),
     t as (select id from public.learning_topics where source_kind = $dbt71501$dbms_sql_tutorial$dbt71501$ and source_ref = $dbt71502$chapter-22-transactions/consistency$dbt71502$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71503$pt-dbms-sql-22-consistency$dbt71503$, $dbt71504$Consistency - Quick Test$dbt71504$, 'aptitude', 8, 8,
  $dbt71505$8 questions on Consistency.$dbt71505$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71506$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71506$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71507$tq-dbms-sql-22-consistency-1$dbt71507$, $dbt71508$pt-dbms-sql-22-consistency$dbt71508$,
   $dbt71509$What does ACID Consistency guarantee?$dbt71509$,
   $dbt71510$["Fast transaction execution", "The database moves from one valid state (respecting all constraints) to another valid state", "All users see the same query results", "Data is never deleted"]$dbt71510$::jsonb,
   1, $dbt71511$Consistency is about preserving the validity of declared constraints across a transaction.$dbt71511$, 1, 0),
  ($dbt71512$tq-dbms-sql-22-consistency-2$dbt71512$, $dbt71513$pt-dbms-sql-22-consistency$dbt71513$,
   $dbt71514$If a transaction would violate a CHECK (balance >= 0) constraint, what does Consistency guarantee?$dbt71514$,
   $dbt71515$["The constraint is temporarily relaxed to let the transaction succeed", "The transaction is rejected, preventing the database from ever entering that invalid state", "Only a warning is logged, but the transaction proceeds", "The balance is automatically set to 0 instead"]$dbt71515$::jsonb,
   1, $dbt71516$Consistency means the database refuses to complete a transaction that would violate a declared constraint.$dbt71516$, 1, 1),
  ($dbt71517$tq-dbms-sql-22-consistency-3$dbt71517$, $dbt71518$pt-dbms-sql-22-consistency$dbt71518$,
   $dbt71519$Does ACID Consistency guarantee that data is 'correct' in every real-world business sense?$dbt71519$,
   $dbt71520$["Yes, it guarantees full business correctness", "No \u2014 it only guarantees adherence to constraints actually DECLARED in the schema; undeclared business rules aren't protected", "It guarantees correctness only for numeric columns", "Consistency has nothing to do with correctness at all"]$dbt71520$::jsonb,
   1, $dbt71521$Only explicitly declared constraints are enforced — Consistency doesn't cover business rules the schema doesn't express.$dbt71521$, 1, 2),
  ($dbt71522$tq-dbms-sql-22-consistency-4$dbt71522$, $dbt71523$pt-dbms-sql-22-consistency$dbt71523$,
   $dbt71524$Is ACID Consistency the same concept as CAP theorem Consistency?$dbt71524$,
   $dbt71525$["Yes, they are identical", "No \u2014 ACID Consistency is about respecting a single database's own constraints; CAP Consistency is about distributed nodes agreeing on data", "CAP theorem doesn't apply to databases", "ACID Consistency only exists in distributed databases"]$dbt71525$::jsonb,
   1, $dbt71526$These are genuinely different concepts that happen to share a name — a classic point of confusion.$dbt71526$, 1, 3),
  ($dbt71527$tq-dbms-sql-22-consistency-5$dbt71527$, $dbt71528$pt-dbms-sql-22-consistency$dbt71528$,
   $dbt71529$Whose responsibility is it to design the RIGHT constraints matching actual business rules?$dbt71529$,
   $dbt71530$["The database automatically infers this", "The schema designer \u2014 the database only enforces whatever constraints are actually declared", "This is not possible to do with ACID Consistency", "Only the DBA can declare constraints, never a schema designer"]$dbt71530$::jsonb,
   1, $dbt71531$Consistency enforcement is a joint responsibility — the database enforces, but a human must design the right rules.$dbt71531$, 1, 4),
  ($dbt71532$tq-dbms-sql-22-consistency-6$dbt71532$, $dbt71533$pt-dbms-sql-22-consistency$dbt71533$,
   $dbt71534$Does Consistency apply whether a transaction commits or rolls back?$dbt71534$,
   $dbt71535$["Only when it commits", "Yes \u2014 the database remains in a valid state whether the transaction commits successfully or rolls back entirely", "Only when it rolls back", "Consistency only matters for SELECT statements"]$dbt71535$::jsonb,
   1, $dbt71536$Both outcomes (commit and rollback) must leave the database in a state respecting all constraints.$dbt71536$, 1, 5),
  ($dbt71537$tq-dbms-sql-22-consistency-7$dbt71537$, $dbt71538$pt-dbms-sql-22-consistency$dbt71538$,
   $dbt71539$Which chapter covers CAP theorem Consistency, to contrast with ACID Consistency?$dbt71539$,
   $dbt71540$["Chapter 10", "Chapter 38 (Distributed Databases)", "Chapter 5", "Chapter 14"]$dbt71540$::jsonb,
   1, $dbt71541$The distributed-systems CAP theorem is covered later, in Chapter 38.$dbt71541$, 1, 6),
  ($dbt71542$tq-dbms-sql-22-consistency-8$dbt71542$, $dbt71543$pt-dbms-sql-22-consistency$dbt71543$,
   $dbt71544$How does Atomicity relate to enabling Consistency?$dbt71544$,
   $dbt71545$["They are unrelated", "Atomicity's all-or-nothing guarantee is part of what makes it possible to never leave the database in a partially-updated, invalid state", "Consistency makes Atomicity redundant", "Atomicity only applies to SELECT statements, unlike Consistency"]$dbt71545$::jsonb,
   1, $dbt71546$Without atomicity, a partially-completed transaction could leave constraints violated — the two properties work together.$dbt71546$, 1, 7)
on conflict (id) do nothing;

-- 22.7 Isolation
with g as (select id from public.learning_grids where lower(slug) = $dbt71547$dbms-sql-tutorial$dbt71547$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71548$chapter-22-transactions$dbt71548$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71549$Isolation$dbt71549$, $dbt71550$isolation$dbt71550$, '', 7, 'published', true, true, $dbt71551$dbms_sql_tutorial$dbt71551$, $dbt71552$chapter-22-transactions/isolation$dbt71552$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71553$dbms_sql_tutorial$dbt71553$ and source_ref = $dbt71554$chapter-22-transactions/isolation$dbt71554$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71555$Isolation$dbt71555$, $dbt71556$### Definition

**Isolation** (the I in ACID) guarantees that concurrent transactions don't see each other's INTERMEDIATE, not-yet-committed state — from any one transaction's point of view, it appears as though it's running alone, even when others are executing at the same time.

### How It Works

Without isolation, if T1 is mid-way through updating several rows, T2 could read some ALREADY-updated rows and some NOT-YET-updated rows — an inconsistent, confusing mixed view that never actually existed as a real, complete state. Isolation prevents this by controlling exactly what one transaction can see of another's in-progress work.

### Edge Cases and Pitfalls

- Perfect isolation (as if every transaction ran one at a time, serially) is the theoretical ideal, but it sacrifices ALL the performance benefits of concurrency (23.1) — real databases offer configurable ISOLATION LEVELS (Chapter 25) that trade some isolation strength for better throughput, each preventing a different subset of the concurrency anomalies covered in Chapter 23 (dirty reads, non-repeatable reads, phantom reads).
- Isolation is specifically about transactions not observing EACH OTHER's uncommitted intermediate state — it's a distinct concern from Atomicity (which is about a single transaction's own all-or-nothing completion) and Consistency (about constraint validity), even though all three properties work together.
- The word "isolation" here should not be confused with process/container isolation in operating systems or virtualization — this is specifically about transaction visibility rules within the database.

### Key Takeaways

- Isolation ensures each transaction appears to run alone, even when others execute concurrently — no seeing another transaction's half-finished work.
- Perfect isolation (fully serial execution) is the theoretical ideal but sacrifices concurrency performance — real systems use configurable isolation levels (Chapter 25) as a practical trade-off.
- Isolation specifically addresses inter-transaction visibility, distinct from Atomicity (intra-transaction completeness) and Consistency (constraint validity).$dbt71556$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71557$dbms_sql_tutorial_seed$dbt71557$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71558$dbms_sql_tutorial_seed$dbt71558$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71559$dbms-sql-tutorial$dbt71559$),
     t as (select id from public.learning_topics where source_kind = $dbt71560$dbms_sql_tutorial$dbt71560$ and source_ref = $dbt71561$chapter-22-transactions/isolation$dbt71561$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71562$pt-dbms-sql-22-isolation$dbt71562$, $dbt71563$Isolation - Quick Test$dbt71563$, 'aptitude', 8, 8,
  $dbt71564$8 questions on Isolation.$dbt71564$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71565$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71565$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71566$tq-dbms-sql-22-isolation-1$dbt71566$, $dbt71567$pt-dbms-sql-22-isolation$dbt71567$,
   $dbt71568$What does Isolation guarantee?$dbt71568$,
   $dbt71569$["Data is permanently stored", "Concurrent transactions don't see each other's uncommitted, intermediate state", "Every transaction runs faster", "All constraints are automatically enforced"]$dbt71569$::jsonb,
   1, $dbt71570$Isolation controls what one transaction can observe of another's in-progress work.$dbt71570$, 1, 0),
  ($dbt71571$tq-dbms-sql-22-isolation-2$dbt71571$, $dbt71572$pt-dbms-sql-22-isolation$dbt71572$,
   $dbt71573$Without isolation, what problem could occur if T2 reads while T1 is mid-update?$dbt71573$,
   $dbt71574$["T2 would always see a clean, fully consistent snapshot", "T2 could see a confusing mix of some already-updated and some not-yet-updated rows, a state that never really existed", "T2 would be blocked from reading entirely", "T1 would automatically pause until T2 finishes"]$dbt71574$::jsonb,
   1, $dbt71575$This inconsistent mixed view is exactly what isolation is designed to prevent.$dbt71575$, 1, 1),
  ($dbt71576$tq-dbms-sql-22-isolation-3$dbt71576$, $dbt71577$pt-dbms-sql-22-isolation$dbt71577$,
   $dbt71578$Does perfect isolation (fully serial execution) come with a cost?$dbt71578$,
   $dbt71579$["No, it's free", "Yes \u2014 it sacrifices all the throughput benefits of running transactions concurrently", "Perfect isolation is always faster than any concurrent execution", "There is no such thing as perfect isolation"]$dbt71579$::jsonb,
   1, $dbt71580$The theoretical ideal of full serial execution trades away concurrency's performance benefits entirely.$dbt71580$, 1, 2),
  ($dbt71581$tq-dbms-sql-22-isolation-4$dbt71581$, $dbt71582$pt-dbms-sql-22-isolation$dbt71582$,
   $dbt71583$How do real database systems typically balance isolation strength against performance?$dbt71583$,
   $dbt71584$["They always use perfect (fully serial) isolation", "They offer configurable isolation levels (Chapter 25) that trade some isolation strength for better throughput", "They disable isolation entirely by default", "Isolation cannot be configured in any real system"]$dbt71584$::jsonb,
   1, $dbt71585$Configurable isolation levels are the practical real-world compromise, covered in depth in Chapter 25.$dbt71585$, 1, 3),
  ($dbt71586$tq-dbms-sql-22-isolation-5$dbt71586$, $dbt71587$pt-dbms-sql-22-isolation$dbt71587$,
   $dbt71588$Is Isolation the same concern as Atomicity?$dbt71588$,
   $dbt71589$["Yes, they are synonyms", "No \u2014 Atomicity is about one transaction's own all-or-nothing completion; Isolation is about transactions not observing each other's in-progress state", "Isolation only applies to single-statement transactions", "Atomicity is a stricter version of Isolation"]$dbt71589$::jsonb,
   1, $dbt71590$These are related but distinct ACID properties addressing different concerns.$dbt71590$, 1, 4),
  ($dbt71591$tq-dbms-sql-22-isolation-6$dbt71591$, $dbt71592$pt-dbms-sql-22-isolation$dbt71592$,
   $dbt71593$What kinds of anomalies does Isolation (at varying strength) aim to prevent?$dbt71593$,
   $dbt71594$["Syntax errors", "Concurrency anomalies like dirty reads, non-repeatable reads, and phantom reads (Chapter 23)", "Disk space exhaustion", "Slow query performance"]$dbt71594$::jsonb,
   1, $dbt71595$Isolation levels are specifically calibrated against these named concurrency anomalies.$dbt71595$, 1, 5),
  ($dbt71596$tq-dbms-sql-22-isolation-7$dbt71596$, $dbt71597$pt-dbms-sql-22-isolation$dbt71597$,
   $dbt71598$Does 'isolation' in ACID refer to operating-system process isolation?$dbt71598$,
   $dbt71599$["Yes, they are the same concept", "No \u2014 ACID Isolation is specifically about transaction visibility rules within the database, unrelated to OS/container isolation", "ACID Isolation is implemented using OS process isolation exclusively", "This is an interchangeable term across all contexts"]$dbt71599$::jsonb,
   1, $dbt71600$Despite the shared word, these are unrelated concepts in different domains.$dbt71600$, 1, 6),
  ($dbt71601$tq-dbms-sql-22-isolation-8$dbt71601$, $dbt71602$pt-dbms-sql-22-isolation$dbt71602$,
   $dbt71603$From a single transaction's own point of view under proper isolation, how does concurrent execution appear?$dbt71603$,
   $dbt71604$["As if many other transactions are visibly interleaved with it", "As if it were running alone, even though other transactions may be executing concurrently", "As a series of random errors", "Isolation provides no particular appearance guarantee"]$dbt71604$::jsonb,
   1, $dbt71605$This 'as if alone' illusion is exactly what isolation aims to provide to each transaction.$dbt71605$, 1, 7)
on conflict (id) do nothing;

-- 22.8 Durability
with g as (select id from public.learning_grids where lower(slug) = $dbt71606$dbms-sql-tutorial$dbt71606$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71607$chapter-22-transactions$dbt71607$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71608$Durability$dbt71608$, $dbt71609$durability$dbt71609$, '', 8, 'published', true, true, $dbt71610$dbms_sql_tutorial$dbt71610$, $dbt71611$chapter-22-transactions/durability$dbt71611$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71612$dbms_sql_tutorial$dbt71612$ and source_ref = $dbt71613$chapter-22-transactions/durability$dbt71613$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71614$Durability$dbt71614$, $dbt71615$### Definition

**Durability** (the D in ACID) guarantees that once a transaction COMMITS, its changes are permanent — they survive any subsequent crash, power failure, or restart, with no risk of silently reverting.

### How It Works

The moment `COMMIT` returns successfully, the database has typically written the change to durable storage (disk) — often via a write-ahead log (Chapter 26, Recovery and Logging) — so that even if the server crashes one millisecond later, the committed change can be recovered and is not lost. This is the property that makes "the transaction succeeded" a statement you can actually rely on.

### Edge Cases and Pitfalls

- Durability is specifically about COMMITTED changes — a transaction that crashes BEFORE reaching commit has no durability guarantee for its (necessarily rolled-back, per Atomicity) partial work; there's nothing to "keep" since it never completed.
- Some systems offer a deliberately WEAKER durability mode (trading some durability guarantee for higher write throughput, e.g. delaying the disk write slightly) as an explicit performance trade-off — this is a genuine configuration choice in some engines/settings, not a universal constant, and should be understood as an explicit risk when enabled.
- Durability relies on the actual physical storage medium behaving as expected — a genuinely faulty disk or a misconfigured/lying storage layer (claiming a write succeeded when it didn't) can violate durability despite the database doing everything correctly on its end; this is why real systems often add extra safeguards (replication, checksums) beyond what a single disk's guarantee alone provides.

### Key Takeaways

- Durability guarantees committed changes survive crashes and restarts — commit is a reliable, permanent promise.
- Durability only applies to what actually reached COMMIT; a crash before commit has nothing to preserve (that work is rolled back per Atomicity).
- Some systems offer configurable, weaker durability trade-offs for performance — a genuine, explicit risk when chosen, not a given.$dbt71615$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71616$dbms_sql_tutorial_seed$dbt71616$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71617$dbms_sql_tutorial_seed$dbt71617$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71618$dbms-sql-tutorial$dbt71618$),
     t as (select id from public.learning_topics where source_kind = $dbt71619$dbms_sql_tutorial$dbt71619$ and source_ref = $dbt71620$chapter-22-transactions/durability$dbt71620$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71621$pt-dbms-sql-22-durability$dbt71621$, $dbt71622$Durability - Quick Test$dbt71622$, 'aptitude', 8, 8,
  $dbt71623$8 questions on Durability.$dbt71623$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71624$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71624$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71625$tq-dbms-sql-22-durability-1$dbt71625$, $dbt71626$pt-dbms-sql-22-durability$dbt71626$,
   $dbt71627$What does Durability guarantee?$dbt71627$,
   $dbt71628$["Fast transaction commits", "Once a transaction commits, its changes survive crashes and restarts permanently", "Transactions never fail", "Data is always encrypted at rest"]$dbt71628$::jsonb,
   1, $dbt71629$Durability is the permanence guarantee for committed changes specifically.$dbt71629$, 1, 0),
  ($dbt71630$tq-dbms-sql-22-durability-2$dbt71630$, $dbt71631$pt-dbms-sql-22-durability$dbt71631$,
   $dbt71632$Does Durability guarantee anything about a transaction that crashes BEFORE reaching commit?$dbt71632$,
   $dbt71633$["Yes, its partial changes are preserved", "No \u2014 durability only applies to committed changes; a pre-commit crash has nothing to preserve, since that work is rolled back per Atomicity", "It guarantees the transaction will automatically retry", "Durability guarantees the crash never happened"]$dbt71633$::jsonb,
   1, $dbt71634$Durability's scope is strictly limited to changes that actually reached the committed state.$dbt71634$, 1, 1),
  ($dbt71635$tq-dbms-sql-22-durability-3$dbt71635$, $dbt71636$pt-dbms-sql-22-durability$dbt71636$,
   $dbt71637$What mechanism typically helps provide durability?$dbt71637$,
   $dbt71638$["An in-memory cache with no disk involvement", "A write-ahead log (Chapter 26) that records changes durably before/alongside the commit", "Deleting old data to save space", "Running the database in read-only mode"]$dbt71638$::jsonb,
   1, $dbt71639$Write-ahead logging is the standard mechanism for achieving durable commits, covered further in Chapter 26.$dbt71639$, 1, 2),
  ($dbt71640$tq-dbms-sql-22-durability-4$dbt71640$, $dbt71641$pt-dbms-sql-22-durability$dbt71641$,
   $dbt71642$Can a database be configured to trade away some durability for higher write performance?$dbt71642$,
   $dbt71643$["No, durability is always absolute with no configuration", "Yes \u2014 some systems offer weaker durability modes as an explicit performance trade-off, a genuine configuration risk when enabled", "This would violate the SQL standard and is never possible", "Durability can only be strengthened, never weakened"]$dbt71643$::jsonb,
   1, $dbt71644$Configurable durability trade-offs exist in some real systems, worth understanding as an explicit choice.$dbt71644$, 1, 3),
  ($dbt71645$tq-dbms-sql-22-durability-5$dbt71645$, $dbt71646$pt-dbms-sql-22-durability$dbt71646$,
   $dbt71647$Can durability be violated even if the database software behaves correctly?$dbt71647$,
   $dbt71648$["No, durability is guaranteed purely by database software logic", "Yes \u2014 a genuinely faulty disk or a storage layer that lies about a write succeeding can violate durability despite correct database behavior", "Only a database bug can violate durability", "Durability is guaranteed regardless of the physical storage medium"]$dbt71648$::jsonb,
   1, $dbt71649$Durability ultimately depends on the physical storage actually behaving as promised, which is outside the database's own control.$dbt71649$, 1, 4),
  ($dbt71650$tq-dbms-sql-22-durability-6$dbt71650$, $dbt71651$pt-dbms-sql-22-durability$dbt71651$,
   $dbt71652$Why do some real systems add replication or checksums beyond a single disk's guarantees?$dbt71652$,
   $dbt71653$["These have nothing to do with durability", "As extra safeguards against physical storage failures that could otherwise violate durability", "To make transactions commit faster", "To reduce the need for isolation"]$dbt71653$::jsonb,
   1, $dbt71654$Extra redundancy compensates for the risk that a single storage medium's own guarantee might not hold.$dbt71654$, 1, 5),
  ($dbt71655$tq-dbms-sql-22-durability-7$dbt71655$, $dbt71656$pt-dbms-sql-22-durability$dbt71656$,
   $dbt71657$What makes 'the transaction succeeded' (after COMMIT) a statement you can actually rely on?$dbt71657$,
   $dbt71658$["Nothing \u2014 commits can be silently undone at any time", "Durability \u2014 the guarantee that committed changes survive subsequent failures", "Atomicity alone, without needing Durability", "The absence of any storage medium involvement"]$dbt71658$::jsonb,
   1, $dbt71659$Durability is specifically what makes a successful commit a trustworthy, permanent outcome.$dbt71659$, 1, 6),
  ($dbt71660$tq-dbms-sql-22-durability-8$dbt71660$, $dbt71661$pt-dbms-sql-22-durability$dbt71661$,
   $dbt71662$Is durability a guarantee about IN-PROGRESS (uncommitted) transaction state?$dbt71662$,
   $dbt71663$["Yes, all in-progress state is durable", "No \u2014 durability specifically concerns state AFTER a successful commit, not in-progress uncommitted work", "Durability applies equally to both committed and uncommitted state", "In-progress state is irrelevant to any ACID property"]$dbt71663$::jsonb,
   1, $dbt71664$Durability's guarantee is scoped strictly to the post-commit state.$dbt71664$, 1, 7)
on conflict (id) do nothing;

-- 22.9 COMMIT
with g as (select id from public.learning_grids where lower(slug) = $dbt71665$dbms-sql-tutorial$dbt71665$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71666$chapter-22-transactions$dbt71666$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71667$COMMIT$dbt71667$, $dbt71668$commit$dbt71668$, '', 9, 'published', true, true, $dbt71669$dbms_sql_tutorial$dbt71669$, $dbt71670$chapter-22-transactions/commit$dbt71670$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71671$dbms_sql_tutorial$dbt71671$ and source_ref = $dbt71672$chapter-22-transactions/commit$dbt71672$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71673$COMMIT$dbt71673$, $dbt71674$### Definition

`COMMIT` is the statement that ends a transaction SUCCESSFULLY, making all of its changes permanent (Durability, 22.8) and visible to other transactions.

### How It Works

```sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 200 WHERE id = 1;
UPDATE accounts SET balance = balance + 200 WHERE id = 2;
COMMIT;
```

Before `COMMIT` runs, both updates exist only within this transaction's own view (Isolation, 22.7) — other transactions still see the old balances. The instant `COMMIT` succeeds, the changes become permanent and visible to everyone. There is no way to undo a transaction after `COMMIT` has completed — any correction from that point on requires a NEW transaction with compensating statements.

### Edge Cases and Pitfalls

- `COMMIT` can itself fail (e.g. a deferred constraint check that only runs at commit time in some databases) — code that assumes `COMMIT` always succeeds without checking for an error is a real class of application bug.
- Under `autocommit` mode (22.12), every individual statement is implicitly followed by its own automatic commit — an explicit `COMMIT` is only meaningful once you've explicitly opened a multi-statement transaction with `START TRANSACTION`.
- On the specific SQL judge platform used in this course, `COMMIT` only behaves correctly on a transactional storage engine (`InnoDB`) — on the default `MyISAM` engine, statements are effectively auto-committed regardless, so `COMMIT`/`ROLLBACK` have no observable difference.

### Key Takeaways

- COMMIT ends a transaction successfully, making its changes permanent and visible to all other transactions.
- Once committed, a transaction cannot be undone — only a new, compensating transaction can adjust the data further.
- COMMIT is meaningless without an explicit transaction boundary if autocommit mode already committed each statement individually.$dbt71674$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71675$dbms_sql_tutorial_seed$dbt71675$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71676$dbms_sql_tutorial_seed$dbt71676$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71677$dbms-sql-tutorial$dbt71677$),
     t as (select id from public.learning_topics where source_kind = $dbt71678$dbms_sql_tutorial$dbt71678$ and source_ref = $dbt71679$chapter-22-transactions/commit$dbt71679$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71680$pt-dbms-sql-22-commit$dbt71680$, $dbt71681$COMMIT - Quick Test$dbt71681$, 'aptitude', 8, 8,
  $dbt71682$8 questions on COMMIT.$dbt71682$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71683$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71683$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71684$tq-dbms-sql-22-commit-1$dbt71684$, $dbt71685$pt-dbms-sql-22-commit$dbt71685$,
   $dbt71686$What does COMMIT do?$dbt71686$,
   $dbt71687$["Cancels the transaction", "Ends the transaction successfully, making its changes permanent and visible to others", "Pauses the transaction", "Deletes the transaction log"]$dbt71687$::jsonb,
   1, $dbt71688$COMMIT is the successful, permanent conclusion of a transaction.$dbt71688$, 1, 0),
  ($dbt71689$tq-dbms-sql-22-commit-2$dbt71689$, $dbt71690$pt-dbms-sql-22-commit$dbt71690$,
   $dbt71691$Before COMMIT runs, can other transactions see the changes made so far?$dbt71691$,
   $dbt71692$["Yes, always immediately", "No \u2014 under proper isolation, other transactions still see the old values until COMMIT succeeds", "Only if isolation is disabled entirely", "Only SELECT statements can see uncommitted changes"]$dbt71692$::jsonb,
   1, $dbt71693$Isolation (22.7) keeps uncommitted changes invisible to other transactions until commit.$dbt71693$, 1, 1),
  ($dbt71694$tq-dbms-sql-22-commit-3$dbt71694$, $dbt71695$pt-dbms-sql-22-commit$dbt71695$,
   $dbt71696$Can a transaction be undone after COMMIT has completed?$dbt71696$,
   $dbt71697$["Yes, using ROLLBACK", "No \u2014 once committed, changes are permanent; correcting them requires a new, separate transaction", "Yes, but only within the same session", "Yes, automatically after 24 hours"]$dbt71697$::jsonb,
   1, $dbt71698$COMMIT is a one-way, irreversible boundary — ROLLBACK cannot undo an already-committed transaction.$dbt71698$, 1, 2),
  ($dbt71699$tq-dbms-sql-22-commit-4$dbt71699$, $dbt71700$pt-dbms-sql-22-commit$dbt71700$,
   $dbt71701$Can a COMMIT itself fail?$dbt71701$,
   $dbt71702$["No, COMMIT always succeeds unconditionally", "Yes \u2014 e.g. a deferred constraint check that only runs at commit time can cause it to fail, a real class of application bug if unhandled", "Only network failures can cause COMMIT to fail", "COMMIT failures are impossible in SQL databases"]$dbt71702$::jsonb,
   1, $dbt71703$Some constraint checks are deferred to commit time in certain databases, so COMMIT failure is a real scenario to handle.$dbt71703$, 1, 3),
  ($dbt71704$tq-dbms-sql-22-commit-5$dbt71704$, $dbt71705$pt-dbms-sql-22-commit$dbt71705$,
   $dbt71706$Under autocommit mode, when does an explicit COMMIT become meaningful?$dbt71706$,
   $dbt71707$["It's always meaningless under autocommit", "Only once you've explicitly opened a multi-statement transaction with START TRANSACTION, overriding the per-statement autocommit behavior", "Only on Mondays", "Autocommit and explicit COMMIT cannot coexist in any database"]$dbt71707$::jsonb,
   1, $dbt71708$Explicitly starting a transaction is what makes a later explicit COMMIT meaningful, distinct from autocommit's implicit per-statement commits.$dbt71708$, 1, 4),
  ($dbt71709$tq-dbms-sql-22-commit-6$dbt71709$, $dbt71710$pt-dbms-sql-22-commit$dbt71710$,
   $dbt71711$On the SQL judge platform used in this course, why does COMMIT have no observable effect difference from ROLLBACK on a MyISAM table?$dbt71711$,
   $dbt71712$["MyISAM doesn't support SQL at all", "MyISAM is non-transactional, so statements are effectively auto-committed regardless of an explicit COMMIT or ROLLBACK", "COMMIT is disabled entirely on MyISAM", "MyISAM only supports SELECT statements"]$dbt71712$::jsonb,
   1, $dbt71713$This is the platform-specific gotcha discovered while verifying this chapter's coding problems — ENGINE=InnoDB is required for real transactional behavior.$dbt71713$, 1, 5),
  ($dbt71714$tq-dbms-sql-22-commit-7$dbt71714$, $dbt71715$pt-dbms-sql-22-commit$dbt71715$,
   $dbt71716$What ACID property does COMMIT primarily activate for a transaction's changes?$dbt71716$,
   $dbt71717$["Only Isolation", "Durability \u2014 the guarantee that committed changes survive subsequent crashes", "Only Atomicity", "None of the ACID properties relate to COMMIT"]$dbt71717$::jsonb,
   1, $dbt71718$The moment COMMIT succeeds, Durability's crash-survival guarantee applies to those changes.$dbt71718$, 1, 6),
  ($dbt71719$tq-dbms-sql-22-commit-8$dbt71719$, $dbt71720$pt-dbms-sql-22-commit$dbt71720$,
   $dbt71721$In the two-account transfer example, what happens to the debit and credit updates once COMMIT succeeds?$dbt71721$,
   $dbt71722$["They remain private to the transaction forever", "They become permanent and immediately visible to all other transactions", "Only the debit becomes visible", "COMMIT reverses both updates"]$dbt71722$::jsonb,
   1, $dbt71723$COMMIT finalizes and publishes both updates as a single successful unit.$dbt71723$, 1, 7)
on conflict (id) do nothing;

-- 22.10 ROLLBACK
with g as (select id from public.learning_grids where lower(slug) = $dbt71724$dbms-sql-tutorial$dbt71724$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71725$chapter-22-transactions$dbt71725$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71726$ROLLBACK$dbt71726$, $dbt71727$rollback$dbt71727$, '', 10, 'published', true, true, $dbt71728$dbms_sql_tutorial$dbt71728$, $dbt71729$chapter-22-transactions/rollback$dbt71729$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71730$dbms_sql_tutorial$dbt71730$ and source_ref = $dbt71731$chapter-22-transactions/rollback$dbt71731$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71732$ROLLBACK$dbt71732$, $dbt71733$### Definition

`ROLLBACK` is the statement that ends a transaction UNSUCCESSFULLY, undoing every change it made so far and returning the database to the state before the transaction began.

### How It Works

```sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 300 WHERE id = 1;
UPDATE accounts SET balance = balance + 300 WHERE id = 2;
ROLLBACK;
```

After `ROLLBACK`, both balances are exactly as they were before the transaction started — as if none of the statements inside it ever ran. This is Atomicity (22.5) in action: an incomplete or unwanted transaction leaves absolutely no trace.

### Edge Cases and Pitfalls

- `ROLLBACK` is also what the database does AUTOMATICALLY on certain failures (a constraint violation, a deadlock the database chooses to abort, a crash) — you don't always have to write `ROLLBACK` explicitly for it to happen; application code should still be prepared to catch such errors and treat the transaction as rolled back.
- On the SQL judge platform used in this course, `ROLLBACK` only actually undoes anything on a transactional engine (`InnoDB`); the same script against a default `MyISAM` table would silently leave the changes applied, verified empirically while preparing this chapter's material.
- A common real-world mistake: forgetting to `ROLLBACK` (or `COMMIT`) an interactive session's open transaction, leaving it "hanging" and potentially holding locks — most tools/drivers auto-rollback on disconnect, but relying on that rather than closing transactions explicitly is fragile practice.

### Key Takeaways

- ROLLBACK undoes every statement in the current transaction, returning the database to its pre-transaction state.
- ROLLBACK can happen automatically (constraint violations, deadlocks, crashes), not only via an explicit statement.
- ROLLBACK requires a transactional storage engine to have any real effect — a non-transactional engine like MyISAM ignores it.$dbt71733$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71734$dbms_sql_tutorial_seed$dbt71734$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71735$dbms_sql_tutorial_seed$dbt71735$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71736$dbms-sql-tutorial$dbt71736$),
     t as (select id from public.learning_topics where source_kind = $dbt71737$dbms_sql_tutorial$dbt71737$ and source_ref = $dbt71738$chapter-22-transactions/rollback$dbt71738$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71739$pt-dbms-sql-22-rollback$dbt71739$, $dbt71740$ROLLBACK - Quick Test$dbt71740$, 'aptitude', 8, 8,
  $dbt71741$8 questions on ROLLBACK.$dbt71741$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71742$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71742$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71743$tq-dbms-sql-22-rollback-1$dbt71743$, $dbt71744$pt-dbms-sql-22-rollback$dbt71744$,
   $dbt71745$What does ROLLBACK do?$dbt71745$,
   $dbt71746$["Makes changes permanent", "Undoes every change made in the current transaction, restoring the pre-transaction state", "Speeds up the transaction", "Deletes the entire table"]$dbt71746$::jsonb,
   1, $dbt71747$ROLLBACK is the undo mechanism for an in-progress transaction.$dbt71747$, 1, 0),
  ($dbt71748$tq-dbms-sql-22-rollback-2$dbt71748$, $dbt71749$pt-dbms-sql-22-rollback$dbt71749$,
   $dbt71750$After a ROLLBACK, what state are the affected rows left in?$dbt71750$,
   $dbt71751$["Exactly as they were before the transaction started, as if it never ran", "Partially updated", "Deleted", "Locked permanently"]$dbt71751$::jsonb,
   0, $dbt71752$ROLLBACK fully reverses the transaction's effects, leaving no trace.$dbt71752$, 1, 1),
  ($dbt71753$tq-dbms-sql-22-rollback-3$dbt71753$, $dbt71754$pt-dbms-sql-22-rollback$dbt71754$,
   $dbt71755$Can ROLLBACK happen automatically, without an explicit ROLLBACK statement?$dbt71755$,
   $dbt71756$["No, only an explicit statement triggers it", "Yes \u2014 a constraint violation, a deadlock, or a crash can all trigger an automatic rollback", "Only COMMIT can be automatic, never ROLLBACK", "Automatic rollback only exists in theory, never in real systems"]$dbt71756$::jsonb,
   1, $dbt71757$Various failure conditions trigger automatic rollback without the application writing ROLLBACK itself.$dbt71757$, 1, 2),
  ($dbt71758$tq-dbms-sql-22-rollback-4$dbt71758$, $dbt71759$pt-dbms-sql-22-rollback$dbt71759$,
   $dbt71760$On the SQL judge platform used in this course, what happens if you run a ROLLBACK against a default MyISAM table?$dbt71760$,
   $dbt71761$["It works identically to InnoDB", "It silently does nothing \u2014 the changes remain applied, since MyISAM is non-transactional", "It raises a syntax error", "It deletes the table"]$dbt71761$::jsonb,
   1, $dbt71762$This was verified empirically — MyISAM ignores ROLLBACK entirely, a genuine platform-specific gotcha.$dbt71762$, 1, 3),
  ($dbt71763$tq-dbms-sql-22-rollback-5$dbt71763$, $dbt71764$pt-dbms-sql-22-rollback$dbt71764$,
   $dbt71765$What is a common real-world mistake related to ROLLBACK/COMMIT?$dbt71765$,
   $dbt71766$["Using ROLLBACK too often", "Forgetting to explicitly ROLLBACK or COMMIT an open transaction, leaving it hanging and potentially holding locks", "Using COMMIT instead of ROLLBACK by mistake is impossible", "ROLLBACK cannot be misused"]$dbt71766$::jsonb,
   1, $dbt71767$Relying on driver auto-rollback-on-disconnect rather than explicitly closing transactions is fragile, real-world practice.$dbt71767$, 1, 4),
  ($dbt71768$tq-dbms-sql-22-rollback-6$dbt71768$, $dbt71769$pt-dbms-sql-22-rollback$dbt71769$,
   $dbt71770$Which ACID property is most directly demonstrated by ROLLBACK leaving no trace of an incomplete transaction?$dbt71770$,
   $dbt71771$["Durability", "Atomicity", "Isolation only", "None of them"]$dbt71771$::jsonb,
   1, $dbt71772$Atomicity's all-or-nothing guarantee is exactly what ROLLBACK enforces when a transaction doesn't complete.$dbt71772$, 1, 5),
  ($dbt71773$tq-dbms-sql-22-rollback-7$dbt71773$, $dbt71774$pt-dbms-sql-22-rollback$dbt71774$,
   $dbt71775$In the transfer example, if ROLLBACK is issued after both UPDATE statements, what is account 1's final balance?$dbt71775$,
   $dbt71776$["300 less than before", "Exactly what it was before the transaction started", "300 more than before", "Zero"]$dbt71776$::jsonb,
   1, $dbt71777$ROLLBACK undoes both updates completely, restoring the original balance.$dbt71777$, 1, 6),
  ($dbt71778$tq-dbms-sql-22-rollback-8$dbt71778$, $dbt71779$pt-dbms-sql-22-rollback$dbt71779$,
   $dbt71780$Should application code assume a transaction rollback never needs explicit error handling?$dbt71780$,
   $dbt71781$["Yes, rollback never needs handling", "No \u2014 application code should be prepared to catch failures that trigger automatic rollback and treat the transaction as rolled back", "Only network errors need handling", "Rollback errors are impossible to detect"]$dbt71781$::jsonb,
   1, $dbt71782$Automatic rollbacks from underlying failures still need to be handled correctly by the calling application.$dbt71782$, 1, 7)
on conflict (id) do nothing;

-- 22.11 SAVEPOINT
with g as (select id from public.learning_grids where lower(slug) = $dbt71783$dbms-sql-tutorial$dbt71783$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71784$chapter-22-transactions$dbt71784$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71785$SAVEPOINT$dbt71785$, $dbt71786$savepoint$dbt71786$, '', 11, 'published', true, true, $dbt71787$dbms_sql_tutorial$dbt71787$, $dbt71788$chapter-22-transactions/savepoint$dbt71788$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71789$dbms_sql_tutorial$dbt71789$ and source_ref = $dbt71790$chapter-22-transactions/savepoint$dbt71790$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71791$SAVEPOINT$dbt71791$, $dbt71792$### Definition

A `SAVEPOINT` marks a named point WITHIN a transaction that you can roll back to, without discarding the entire transaction — `ROLLBACK TO <savepoint>` undoes only the statements after that point, leaving earlier work in the same transaction intact and still uncommitted.

### How It Works

```sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 200 WHERE id = 1;
SAVEPOINT sp1;
UPDATE accounts SET balance = balance + 9999 WHERE id = 2;  -- oops, wrong amount
ROLLBACK TO sp1;                                              -- undo just that mistake
UPDATE accounts SET balance = balance + 200 WHERE id = 2;    -- redo correctly
COMMIT;
```

`ROLLBACK TO sp1` undoes only the erroneous `+9999` update, but the earlier `-200` debit (before the savepoint) remains part of the still-open transaction. The corrected `+200` update then runs, and the whole thing commits with the correct final result — fine-grained error recovery without restarting the whole transaction from scratch.

### Edge Cases and Pitfalls

- `ROLLBACK TO <savepoint>` does NOT end the transaction — you must still explicitly `COMMIT` or fully `ROLLBACK` afterward; forgetting this leaves the transaction still open.
- Rolling back to a savepoint that doesn't exist raises an explicit error (verified empirically: `ROLLBACK TO nonexistent_sp` → `ERROR 1305: SAVEPOINT nonexistent_sp does not exist`) rather than silently doing nothing — useful proof that the database is genuinely tracking savepoint state, not just ignoring the statement.
- Like `COMMIT`/`ROLLBACK`, `SAVEPOINT` semantics only apply on a genuinely transactional storage engine; on this course's judge platform, `ENGINE=InnoDB` must be declared for savepoints to have any real effect.
- A savepoint can be released early with `RELEASE SAVEPOINT <name>` if you no longer need to roll back to it (frees the resources tracking it, without affecting the transaction's data).

### Key Takeaways

- SAVEPOINT creates a named intermediate point in a transaction that ROLLBACK TO can return to without discarding the whole transaction.
- After ROLLBACK TO a savepoint, the transaction is still open — an explicit COMMIT or ROLLBACK is still required to finish it.
- SAVEPOINT gives fine-grained error recovery within a single transaction, useful for multi-step operations where only part might need correcting.$dbt71792$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71793$dbms_sql_tutorial_seed$dbt71793$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71794$dbms_sql_tutorial_seed$dbt71794$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71795$dbms-sql-tutorial$dbt71795$),
     t as (select id from public.learning_topics where source_kind = $dbt71796$dbms_sql_tutorial$dbt71796$ and source_ref = $dbt71797$chapter-22-transactions/savepoint$dbt71797$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71798$pt-dbms-sql-22-savepoint$dbt71798$, $dbt71799$SAVEPOINT - Quick Test$dbt71799$, 'aptitude', 8, 8,
  $dbt71800$8 questions on SAVEPOINT.$dbt71800$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71801$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71801$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71802$tq-dbms-sql-22-savepoint-1$dbt71802$, $dbt71803$pt-dbms-sql-22-savepoint$dbt71803$,
   $dbt71804$What does a SAVEPOINT allow you to do?$dbt71804$,
   $dbt71805$["Commit part of a transaction early", "Roll back only the statements after a named point, without discarding the whole transaction", "Create a backup of the entire database", "Skip writing a WHERE clause"]$dbt71805$::jsonb,
   1, $dbt71806$SAVEPOINT enables fine-grained, partial rollback within an open transaction.$dbt71806$, 1, 0),
  ($dbt71807$tq-dbms-sql-22-savepoint-2$dbt71807$, $dbt71808$pt-dbms-sql-22-savepoint$dbt71808$,
   $dbt71809$After ROLLBACK TO a savepoint, is the transaction finished?$dbt71809$,
   $dbt71810$["Yes, it automatically commits", "No \u2014 the transaction is still open; you must still explicitly COMMIT or ROLLBACK afterward", "Yes, it automatically rolls back completely", "ROLLBACK TO always raises an error"]$dbt71810$::jsonb,
   1, $dbt71811$ROLLBACK TO only undoes statements after the savepoint — the transaction itself remains open.$dbt71811$, 1, 1),
  ($dbt71812$tq-dbms-sql-22-savepoint-3$dbt71812$, $dbt71813$pt-dbms-sql-22-savepoint$dbt71813$,
   $dbt71814$What happens to statements BEFORE the savepoint when you ROLLBACK TO it?$dbt71814$,
   $dbt71815$["They are also undone", "They remain part of the still-open, still-uncommitted transaction", "They are immediately committed", "They cause an error"]$dbt71815$::jsonb,
   1, $dbt71816$Only statements after the named savepoint are undone; earlier work in the transaction is preserved.$dbt71816$, 1, 2),
  ($dbt71817$tq-dbms-sql-22-savepoint-4$dbt71817$, $dbt71818$pt-dbms-sql-22-savepoint$dbt71818$,
   $dbt71819$What happens if you ROLLBACK TO a savepoint name that was never created?$dbt71819$,
   $dbt71820$["It silently does nothing", "It raises an explicit error (e.g. 'SAVEPOINT ... does not exist'), proving the database genuinely tracks savepoint state", "It rolls back the entire transaction instead", "It creates the savepoint retroactively"]$dbt71820$::jsonb,
   1, $dbt71821$This was verified empirically — a nonexistent savepoint reference raises a real error rather than being ignored.$dbt71821$, 1, 3),
  ($dbt71822$tq-dbms-sql-22-savepoint-5$dbt71822$, $dbt71823$pt-dbms-sql-22-savepoint$dbt71823$,
   $dbt71824$On this course's SQL judge platform, what is required for SAVEPOINT to have any real effect?$dbt71824$,
   $dbt71825$["Nothing special \u2014 it always works", "The table must be declared with ENGINE=InnoDB, since savepoints require a transactional storage engine", "SAVEPOINT never works on this platform", "Only SELECT statements need InnoDB"]$dbt71825$::jsonb,
   1, $dbt71826$Like COMMIT/ROLLBACK, SAVEPOINT semantics depend on a genuinely transactional engine.$dbt71826$, 1, 4),
  ($dbt71827$tq-dbms-sql-22-savepoint-6$dbt71827$, $dbt71828$pt-dbms-sql-22-savepoint$dbt71828$,
   $dbt71829$What does RELEASE SAVEPOINT do?$dbt71829$,
   $dbt71830$["Commits the entire transaction", "Removes a savepoint you no longer need to roll back to, without affecting the transaction's data", "Rolls back to that savepoint immediately", "Deletes the underlying table"]$dbt71830$::jsonb,
   1, $dbt71831$RELEASE SAVEPOINT frees the bookkeeping for a savepoint without changing any data.$dbt71831$, 1, 5),
  ($dbt71832$tq-dbms-sql-22-savepoint-7$dbt71832$, $dbt71833$pt-dbms-sql-22-savepoint$dbt71833$,
   $dbt71834$In the worked example, why does the final committed result match what a simple correct COMMIT would have produced?$dbt71834$,
   $dbt71835$["It doesn't match \u2014 SAVEPOINT changes the final outcome", "Because the erroneous +9999 update was fully undone by ROLLBACK TO sp1, leaving only the correct +200 update to take effect", "Because SAVEPOINT ignores all UPDATE statements", "Because COMMIT overrides any prior UPDATE"]$dbt71835$::jsonb,
   1, $dbt71836$The savepoint mechanism correctly isolates and removes just the erroneous step, leaving the intended final state.$dbt71836$, 1, 6),
  ($dbt71837$tq-dbms-sql-22-savepoint-8$dbt71837$, $dbt71838$pt-dbms-sql-22-savepoint$dbt71838$,
   $dbt71839$Why is SAVEPOINT useful for multi-step transactions?$dbt71839$,
   $dbt71840$["It makes transactions run faster", "It allows correcting a mistake partway through a transaction without restarting the whole transaction from scratch", "It removes the need for COMMIT entirely", "It automatically validates all business rules"]$dbt71840$::jsonb,
   1, $dbt71841$Fine-grained error recovery within one transaction is SAVEPOINT's core value.$dbt71841$, 1, 7)
on conflict (id) do nothing;

-- 22.12 Autocommit
with g as (select id from public.learning_grids where lower(slug) = $dbt71842$dbms-sql-tutorial$dbt71842$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71843$chapter-22-transactions$dbt71843$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71844$Autocommit$dbt71844$, $dbt71845$autocommit$dbt71845$, '', 12, 'published', true, true, $dbt71846$dbms_sql_tutorial$dbt71846$, $dbt71847$chapter-22-transactions/autocommit$dbt71847$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71848$dbms_sql_tutorial$dbt71848$ and source_ref = $dbt71849$chapter-22-transactions/autocommit$dbt71849$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71850$Autocommit$dbt71850$, $dbt71851$### Definition

**Autocommit** is a connection/session mode in which EVERY individual SQL statement is automatically wrapped in its own implicit transaction and committed immediately after it runs — no explicit `START TRANSACTION`/`COMMIT` needed, but also no way to group multiple statements into one atomic unit unless autocommit is turned off (or explicitly overridden with `START TRANSACTION`).

### How It Works

With autocommit ON (the default in most client tools/drivers):
```sql
UPDATE accounts SET balance = balance - 200 WHERE id = 1;  -- committed immediately
UPDATE accounts SET balance = balance + 200 WHERE id = 2;  -- committed immediately, separately
```
If a crash happens between these two statements, the debit is permanently committed with NO corresponding credit — exactly the partial-transfer problem Atomicity (22.5) exists to prevent. Issuing an explicit `START TRANSACTION` temporarily suspends autocommit for that transaction's duration, regardless of the session's default mode, restoring the all-or-nothing grouping.

### Edge Cases and Pitfalls

- Autocommit being ON by default is precisely WHY explicit transaction boundaries (22.2) matter — any sequence of related statements that must succeed or fail together needs an explicit `START TRANSACTION` wrapped around them, or autocommit will commit each one independently.
- Some client libraries/ORMs turn autocommit OFF by default and require an explicit `commit()` call — behavior is driver/library-specific, not a universal SQL-language guarantee, so it's important to know your specific tool's default.
- Turning autocommit off entirely (a session-level setting in some databases) means EVERY statement, even a single `SELECT`, runs inside an implicitly-open transaction that must eventually be explicitly committed or rolled back — forgetting this can leave long-running open transactions that hold resources.

### Key Takeaways

- Autocommit ON means each statement is its own automatically-committed transaction — no explicit COMMIT is needed, but also no implicit grouping across statements.
- Explicit START TRANSACTION overrides autocommit for that transaction's duration, enabling multi-statement atomicity.
- Autocommit defaults vary by client/driver/ORM — always confirm your specific environment's behavior rather than assuming.$dbt71851$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71852$dbms_sql_tutorial_seed$dbt71852$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71853$dbms_sql_tutorial_seed$dbt71853$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71854$dbms-sql-tutorial$dbt71854$),
     t as (select id from public.learning_topics where source_kind = $dbt71855$dbms_sql_tutorial$dbt71855$ and source_ref = $dbt71856$chapter-22-transactions/autocommit$dbt71856$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71857$pt-dbms-sql-22-autocommit$dbt71857$, $dbt71858$Autocommit - Quick Test$dbt71858$, 'aptitude', 8, 8,
  $dbt71859$8 questions on Autocommit.$dbt71859$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71860$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71860$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71861$tq-dbms-sql-22-autocommit-1$dbt71861$, $dbt71862$pt-dbms-sql-22-autocommit$dbt71862$,
   $dbt71863$What does autocommit mode do?$dbt71863$,
   $dbt71864$["Groups all statements in a session into one transaction", "Automatically wraps and commits every individual statement in its own implicit transaction", "Disables all COMMIT statements", "Prevents any transaction from ever failing"]$dbt71864$::jsonb,
   1, $dbt71865$Autocommit treats each statement as its own separately-committed unit.$dbt71865$, 1, 0),
  ($dbt71866$tq-dbms-sql-22-autocommit-2$dbt71866$, $dbt71867$pt-dbms-sql-22-autocommit$dbt71867$,
   $dbt71868$Under autocommit, if a crash happens between two related UPDATE statements, what is the result?$dbt71868$,
   $dbt71869$["Both updates are automatically rolled back together", "The first statement's change is permanently committed with no corresponding second change \u2014 exactly the partial-transfer problem", "Neither statement ever executes", "The crash is impossible under autocommit"]$dbt71869$::jsonb,
   1, $dbt71870$This is exactly why relying on autocommit alone for related multi-statement operations is dangerous.$dbt71870$, 1, 1),
  ($dbt71871$tq-dbms-sql-22-autocommit-3$dbt71871$, $dbt71872$pt-dbms-sql-22-autocommit$dbt71872$,
   $dbt71873$How can you override autocommit for a group of related statements?$dbt71873$,
   $dbt71874$["It cannot be overridden", "By issuing an explicit START TRANSACTION, which suspends autocommit for that transaction's duration", "By running the statements twice", "By using SELECT instead of UPDATE"]$dbt71874$::jsonb,
   1, $dbt71875$Explicit transaction boundaries take precedence over the session's autocommit default.$dbt71875$, 1, 2),
  ($dbt71876$tq-dbms-sql-22-autocommit-4$dbt71876$, $dbt71877$pt-dbms-sql-22-autocommit$dbt71877$,
   $dbt71878$Is autocommit's default behavior (ON vs OFF) guaranteed to be the same across all client libraries/ORMs?$dbt71878$,
   $dbt71879$["Yes, it's a universal SQL-language guarantee", "No \u2014 some client libraries/ORMs turn it off by default and require an explicit commit() call; behavior is driver/library-specific", "Autocommit doesn't exist outside of raw SQL clients", "ORMs never support autocommit at all"]$dbt71879$::jsonb,
   1, $dbt71880$Autocommit defaults vary by environment — this is an important practical caveat, not a spec guarantee.$dbt71880$, 1, 3),
  ($dbt71881$tq-dbms-sql-22-autocommit-5$dbt71881$, $dbt71882$pt-dbms-sql-22-autocommit$dbt71882$,
   $dbt71883$If autocommit is turned off entirely at the session level, what happens with a single SELECT statement?$dbt71883$,
   $dbt71884$["SELECT statements are unaffected by autocommit settings", "It still runs inside an implicitly-open transaction that must eventually be explicitly committed or rolled back", "SELECT statements are disabled", "The session immediately crashes"]$dbt71884$::jsonb,
   1, $dbt71885$With autocommit off, every statement including SELECT opens an implicit transaction needing explicit closure.$dbt71885$, 1, 4),
  ($dbt71886$tq-dbms-sql-22-autocommit-6$dbt71886$, $dbt71887$pt-dbms-sql-22-autocommit$dbt71887$,
   $dbt71888$Why does autocommit being ON by default make explicit transaction boundaries important?$dbt71888$,
   $dbt71889$["It doesn't \u2014 boundaries are irrelevant under autocommit", "Because any related statements that must succeed/fail together need an explicit START TRANSACTION, or autocommit commits each one independently", "Autocommit makes boundaries unnecessary in all cases", "Boundaries only matter when autocommit is off"]$dbt71889$::jsonb,
   1, $dbt71890$This directly connects autocommit back to the transaction-boundaries topic (22.2).$dbt71890$, 1, 5),
  ($dbt71891$tq-dbms-sql-22-autocommit-7$dbt71891$, $dbt71892$pt-dbms-sql-22-autocommit$dbt71892$,
   $dbt71893$Does an explicit COMMIT need to be written for each statement when autocommit is ON?$dbt71893$,
   $dbt71894$["Yes, always required", "No \u2014 autocommit ON means each statement is automatically committed without an explicit COMMIT", "Only for UPDATE statements, not SELECT", "COMMIT is disabled entirely under autocommit"]$dbt71894$::jsonb,
   1, $dbt71895$The whole point of autocommit is that no explicit COMMIT statement is needed per-statement.$dbt71895$, 1, 6),
  ($dbt71896$tq-dbms-sql-22-autocommit-8$dbt71896$, $dbt71897$pt-dbms-sql-22-autocommit$dbt71897$,
   $dbt71898$What is the practical risk of forgetting that a session has autocommit turned OFF?$dbt71898$,
   $dbt71899$["No risk at all", "Leaving long-running, implicitly-open transactions unclosed, which can hold resources/locks", "Statements will fail to execute", "The database will refuse all future connections"]$dbt71899$::jsonb,
   1, $dbt71900$An open transaction that's never committed or rolled back can hold locks and resources indefinitely.$dbt71900$, 1, 7)
on conflict (id) do nothing;

-- 22.13 Nested Transaction Concepts
with g as (select id from public.learning_grids where lower(slug) = $dbt71901$dbms-sql-tutorial$dbt71901$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71902$chapter-22-transactions$dbt71902$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71903$Nested Transaction Concepts$dbt71903$, $dbt71904$nested-transaction-concepts$dbt71904$, '', 13, 'published', true, true, $dbt71905$dbms_sql_tutorial$dbt71905$, $dbt71906$chapter-22-transactions/nested-transaction-concepts$dbt71906$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71907$dbms_sql_tutorial$dbt71907$ and source_ref = $dbt71908$chapter-22-transactions/nested-transaction-concepts$dbt71908$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71909$Nested Transaction Concepts$dbt71909$, $dbt71910$### Definition

A **nested transaction** would mean starting a new transaction WHILE another is already open — most SQL databases don't support TRUE nested transactions; instead, `SAVEPOINT` (22.11) provides most of the practical benefit, and a second `START TRANSACTION` while one is already open is typically handled by dialect-specific rules rather than genuine nesting.

### How It Works

In most databases (including the platform used in this course), issuing `START TRANSACTION` while a transaction is already open does NOT create an independent nested transaction — common behaviors include: implicitly committing the current transaction first, raising a warning/error, or simply being a no-op that continues the existing transaction. None of these give you genuine "commit the inner transaction without affecting the outer one" semantics.

`SAVEPOINT` is the practical substitute: it gives you an inner "checkpoint" you can roll back to without discarding the outer transaction, covering the most common real use case (isolate and undo just a portion of a larger transaction) without needing true nesting.

### Edge Cases and Pitfalls

- Application frameworks/ORMs that expose a "nested transaction" API to their users are usually implementing it via `SAVEPOINT` under the hood, not via genuine database-level nested transactions — knowing this helps explain their actual behavior (e.g. why an "inner transaction" rollback doesn't undo the outer one, but also doesn't provide fully independent commit semantics either).
- The behavior of a second `START TRANSACTION` while one is open is genuinely dialect-specific — some databases raise a warning and implicitly commit the previous transaction first (which can silently commit work you thought was still pending), a subtle correctness trap for code that assumes "starting a transaction is always safe."
- True nested transactions (with fully independent inner commit/rollback) exist in some other database systems' proprietary extensions but are not part of the SQL standard's common core — don't assume portability of this feature across databases.

### Key Takeaways

- Most SQL databases do not support true nested transactions — SAVEPOINT is the practical, widely-supported substitute for isolating and undoing part of a larger transaction.
- A second START TRANSACTION while one is already open is dialect-specific and can silently commit the outer transaction in some databases — a real correctness trap.
- "Nested transaction" APIs in ORMs/frameworks are typically SAVOEPOINT-based implementations, not genuine independent nested database transactions.$dbt71910$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71911$dbms_sql_tutorial_seed$dbt71911$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71912$dbms_sql_tutorial_seed$dbt71912$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71913$dbms-sql-tutorial$dbt71913$),
     t as (select id from public.learning_topics where source_kind = $dbt71914$dbms_sql_tutorial$dbt71914$ and source_ref = $dbt71915$chapter-22-transactions/nested-transaction-concepts$dbt71915$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71916$pt-dbms-sql-22-nested-transaction-concepts$dbt71916$, $dbt71917$Nested Transaction Concepts - Quick Test$dbt71917$, 'aptitude', 8, 8,
  $dbt71918$8 questions on Nested Transaction Concepts.$dbt71918$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71919$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71919$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71920$tq-dbms-sql-22-nested-transaction-concepts-1$dbt71920$, $dbt71921$pt-dbms-sql-22-nested-transaction-concepts$dbt71921$,
   $dbt71922$Do most SQL databases support true nested transactions?$dbt71922$,
   $dbt71923$["Yes, universally and identically", "No \u2014 most don't; SAVEPOINT provides the practical substitute for the most common use case", "Only NoSQL databases support this", "Nested transactions are part of the core SQL standard, always supported"]$dbt71923$::jsonb,
   1, $dbt71924$True independent nested transactions are not commonly supported — SAVEPOINT covers the practical need instead.$dbt71924$, 1, 0),
  ($dbt71925$tq-dbms-sql-22-nested-transaction-concepts-2$dbt71925$, $dbt71926$pt-dbms-sql-22-nested-transaction-concepts$dbt71926$,
   $dbt71927$What commonly happens if you issue START TRANSACTION while a transaction is already open?$dbt71927$,
   $dbt71928$["It always creates a fully independent nested transaction", "Dialect-specific behavior \u2014 commonly an implicit commit of the current transaction, a warning/error, or a no-op continuing the existing transaction", "It always raises a fatal, unrecoverable error", "It automatically converts to a SAVEPOINT"]$dbt71928$::jsonb,
   1, $dbt71929$This behavior varies by database and is not genuine nesting in any case.$dbt71929$, 1, 1),
  ($dbt71930$tq-dbms-sql-22-nested-transaction-concepts-3$dbt71930$, $dbt71931$pt-dbms-sql-22-nested-transaction-concepts$dbt71931$,
   $dbt71932$How do ORMs/frameworks typically implement a 'nested transaction' API?$dbt71932$,
   $dbt71933$["Using genuine database-level independent nested transactions", "Usually via SAVEPOINT under the hood, not true database-level nesting", "By opening a separate database connection for each nested call", "Nested transaction APIs don't exist in any framework"]$dbt71933$::jsonb,
   1, $dbt71934$Framework 'nested transactions' are typically SAVEPOINT-based wrappers, which explains their actual (non-independent) behavior.$dbt71934$, 1, 2),
  ($dbt71935$tq-dbms-sql-22-nested-transaction-concepts-4$dbt71935$, $dbt71936$pt-dbms-sql-22-nested-transaction-concepts$dbt71936$,
   $dbt71937$What is the real correctness trap with issuing a second START TRANSACTION while one is open?$dbt71937$,
   $dbt71938$["There is no trap \u2014 it's always safe", "Some databases implicitly commit the outer transaction first, silently committing work the caller thought was still pending", "It always throws a compile-time error", "It permanently locks the database"]$dbt71938$::jsonb,
   1, $dbt71939$Silent implicit-commit behavior on a second START TRANSACTION is a genuine, dialect-specific correctness hazard.$dbt71939$, 1, 3),
  ($dbt71940$tq-dbms-sql-22-nested-transaction-concepts-5$dbt71940$, $dbt71941$pt-dbms-sql-22-nested-transaction-concepts$dbt71941$,
   $dbt71942$What practical benefit does SAVEPOINT provide as a substitute for true nested transactions?$dbt71942$,
   $dbt71943$["Fully independent commit of an inner unit without affecting the outer transaction", "The ability to isolate and undo just a portion of a larger transaction, without discarding the whole thing", "Automatic conflict resolution between concurrent transactions", "Encryption of transaction data"]$dbt71943$::jsonb,
   1, $dbt71944$SAVEPOINT covers the most common real use case for 'nesting' — partial rollback — without requiring true nested transaction support.$dbt71944$, 1, 4),
  ($dbt71945$tq-dbms-sql-22-nested-transaction-concepts-6$dbt71945$, $dbt71946$pt-dbms-sql-22-nested-transaction-concepts$dbt71946$,
   $dbt71947$Are true nested transactions (independent inner commit/rollback) part of the SQL standard's common core?$dbt71947$,
   $dbt71948$["Yes, universally standardized", "No \u2014 where they exist at all, they're typically proprietary extensions in specific database systems, not portable", "They are only available in NoSQL systems", "SAVEPOINT and true nested transactions are the exact same feature"]$dbt71948$::jsonb,
   1, $dbt71949$True nested transaction support, where it exists, is not a portable, standard SQL feature.$dbt71949$, 1, 5),
  ($dbt71950$tq-dbms-sql-22-nested-transaction-concepts-7$dbt71950$, $dbt71951$pt-dbms-sql-22-nested-transaction-concepts$dbt71951$,
   $dbt71952$Does rolling back an 'inner transaction' (SAVEPOINT-based) undo the outer transaction's earlier work?$dbt71952$,
   $dbt71953$["Yes, always", "No \u2014 SAVEPOINT-based rollback only undoes statements after that savepoint, leaving the outer transaction's earlier work intact and still open", "It undoes the entire session", "It commits the outer transaction instead"]$dbt71953$::jsonb,
   1, $dbt71954$This mirrors SAVEPOINT's actual behavior (22.11) — only the inner portion is undone.$dbt71954$, 1, 6),
  ($dbt71955$tq-dbms-sql-22-nested-transaction-concepts-8$dbt71955$, $dbt71956$pt-dbms-sql-22-nested-transaction-concepts$dbt71956$,
   $dbt71957$Why is it risky for application code to assume 'starting a transaction is always safe' regardless of current state?$dbt71957$,
   $dbt71958$["It's never risky", "Because a second START TRANSACTION's behavior is dialect-specific and can silently commit an already-open outer transaction", "Because START TRANSACTION always fails the second time", "Because transactions can only be started once per database lifetime"]$dbt71958$::jsonb,
   1, $dbt71959$This dialect-specific silent-commit risk is exactly why understanding your specific database's behavior matters here.$dbt71959$, 1, 7)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Chapter 23: Concurrency Control
-- ---------------------------------------------------------------------------
-- 23.1 Concurrent Execution
with g as (select id from public.learning_grids where lower(slug) = $dbt71960$dbms-sql-tutorial$dbt71960$),
     s as (select id from public.learning_sections where lower(slug) = $dbt71961$chapter-23-concurrency-control$dbt71961$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt71962$Concurrent Execution$dbt71962$, $dbt71963$concurrent-execution$dbt71963$, '', 1, 'published', true, true, $dbt71964$dbms_sql_tutorial$dbt71964$, $dbt71965$chapter-23-concurrency-control/concurrent-execution$dbt71965$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt71966$dbms_sql_tutorial$dbt71966$ and source_ref = $dbt71967$chapter-23-concurrency-control/concurrent-execution$dbt71967$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt71968$Concurrent Execution$dbt71968$, $dbt71969$### The Running Example for This Chapter

Every topic in Chapter 23 reuses the same two transactions on the same two bank balances, `A` and `B` (say A = ₹1000, B = ₹2000):

```
T1 (transfer ₹100 from A to B):        T2 (credit 10% interest on A and B):
1. R(A)                                1. R(A)
2. A = A - 100                         2. A = A * 1.10
3. W(A)                                3. W(A)
4. R(B)                                4. R(B)
5. B = B + 100                         5. B = B * 1.10
6. W(B)                                6. W(B)
7. COMMIT                              7. COMMIT
```

Keep this pair in mind for the rest of the chapter — every schedule, anomaly, and protocol below is just a different way of interleaving (or not interleaving) these fourteen operations.

### Why Interleave at All?

A DBMS could, in principle, run T1 fully to completion and only then start T2 — no interleaving, no risk. But real workloads have hundreds or thousands of transactions arriving per second, and most transactions spend a large fraction of their time **waiting** — on disk I/O, on a network round trip, on a lock held by someone else. If the system executed transactions strictly one-at-a-time, the CPU would sit idle every time the current transaction blocked on I/O, and every other waiting transaction would be stuck behind it even though nothing but a disk read was in progress.

**Concurrent execution** means the DBMS interleaves the operations of multiple transactions — executing a few steps of T1, then switching to a few steps of T2, then back to T1, and so on — so that while T1 is waiting on disk, T2's CPU-bound work can proceed. This dramatically improves **throughput** (transactions completed per second) and **average response time**, which is why every production database interleaves transactions by default.

### The Correctness Challenge

Interleaving is not free. If the DBMS interleaves T1's and T2's operations arbitrarily, the *order* in which reads and writes land can change the final values of `A` and `B` compared to running T1 and T2 one after another. For example, if T2's `R(A)` sneaks in between T1's `R(A)` and T1's `W(A)`, T2 may compute interest on a *stale* value of A that T1 was about to overwrite anyway — producing a database state that no serial (one-at-a-time) execution of T1 and T2 could ever have produced.

This is the central problem concurrency control exists to solve: **how do we get the performance benefit of interleaving while still guaranteeing the result is as correct as if the transactions had run one at a time?** The rest of this chapter — serial vs. non-serial schedules, serializability, precedence graphs, and the recoverability hierarchy — is the formal machinery for answering exactly that question.

### Edge Cases

- A single-user embedded database with no concurrent connections has no need for concurrency control at all — the problem only exists once two or more transactions can be "in flight" at once.
- Two transactions that touch completely disjoint data (T1 only touches `A`, T2 only touches `C`) can be interleaved in any order with zero risk — concurrency control machinery is only needed when transactions' data accesses *overlap*.
- Concurrency (interleaving) is not the same as parallelism (simultaneous execution on multiple cores) — even a single-core system interleaves transactions via time-slicing, and all the correctness issues in this chapter apply equally there.

### Key Takeaways / Interview Angle

- **Q: Why not just run every transaction serially and avoid this whole chapter?** Because I/O-bound workloads would leave the CPU idle constantly, collapsing throughput and making every user wait far longer — concurrency is a performance necessity, not a convenience.
- **Q: What is the DBMS actually trying to guarantee?** That the observable result of any interleaved (concurrent) execution is *equivalent* to some serial execution of the same transactions — this property is called serializability, covered next.$dbt71969$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt71970$dbms_sql_tutorial_seed$dbt71970$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt71971$dbms_sql_tutorial_seed$dbt71971$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt71972$dbms-sql-tutorial$dbt71972$),
     t as (select id from public.learning_topics where source_kind = $dbt71973$dbms_sql_tutorial$dbt71973$ and source_ref = $dbt71974$chapter-23-concurrency-control/concurrent-execution$dbt71974$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt71975$pt-dbms-sql-23-concurrent-execution$dbt71975$, $dbt71976$Concurrent Execution - Quick Test$dbt71976$, 'aptitude', 8, 8,
  $dbt71977$8 questions on Concurrent Execution.$dbt71977$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt71978$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt71978$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt71979$tq-dbms-sql-23-concurrent-execution-1$dbt71979$, $dbt71980$pt-dbms-sql-23-concurrent-execution$dbt71980$,
   $dbt71981$In the running example, what is T2 computing when it executes step 2 (`A = A * 1.10`)?$dbt71981$,
   $dbt71982$["A withdrawal of \u20b9100 from A", "10% interest credited on A's balance", "A transfer from A to B", "A rollback of T1's change"]$dbt71982$::jsonb,
   1, $dbt71983$T2 is defined as crediting 10% interest to both A and B; step 2 multiplies A's current value by 1.10.$dbt71983$, 1, 0),
  ($dbt71984$tq-dbms-sql-23-concurrent-execution-2$dbt71984$, $dbt71985$pt-dbms-sql-23-concurrent-execution$dbt71985$,
   $dbt71986$Why do database systems interleave the operations of multiple transactions instead of running them strictly one at a time?$dbt71986$,
   $dbt71987$["Interleaving is required by the SQL standard", "It improves throughput and response time by keeping the CPU busy while other transactions wait on I/O", "It is the only way to prevent transactions from reading each other's data", "It guarantees correctness automatically"]$dbt71987$::jsonb,
   1, $dbt71988$Transactions spend much of their time waiting on I/O; interleaving lets the CPU do useful work for other transactions during that wait, boosting throughput and responsiveness.$dbt71988$, 1, 1),
  ($dbt71989$tq-dbms-sql-23-concurrent-execution-3$dbt71989$, $dbt71990$pt-dbms-sql-23-concurrent-execution$dbt71990$,
   $dbt71991$What is the 'correctness challenge' that concurrent execution introduces?$dbt71991$,
   $dbt71992$["Concurrent transactions might use different SQL dialects", "Interleaved operations may produce a database state that no serial execution of the same transactions could have produced", "Concurrent execution always corrupts the database", "Concurrent execution is slower than serial execution"]$dbt71992$::jsonb,
   1, $dbt71993$Arbitrary interleaving can cause one transaction to read a stale value the other was about to overwrite, yielding a result impossible under any one-at-a-time ordering — that's the problem serializability theory addresses.$dbt71993$, 1, 2),
  ($dbt71994$tq-dbms-sql-23-concurrent-execution-4$dbt71994$, $dbt71995$pt-dbms-sql-23-concurrent-execution$dbt71995$,
   $dbt71996$If T2's R(A) executes between T1's R(A) and T1's W(A) in the running example, what risk does this create?$dbt71996$,
   $dbt71997$["No risk \u2014 A is never touched by both transactions", "T2 may compute its 10% interest using a value of A that T1 is about to overwrite, producing a result inconsistent with any serial order", "T1 will automatically abort", "The database will refuse to allow this interleaving"]$dbt71997$::jsonb,
   1, $dbt71998$T2 reading A before T1's write means T2's computation is based on a value T1 is mid-way through changing — exactly the kind of interference that motivates serializability checks.$dbt71998$, 1, 3),
  ($dbt71999$tq-dbms-sql-23-concurrent-execution-5$dbt71999$, $dbt72000$pt-dbms-sql-23-concurrent-execution$dbt72000$,
   $dbt72001$Which pair of transactions could safely be interleaved in ANY order with zero correctness risk?$dbt72001$,
   $dbt72002$["Two transactions that both read and write the same account balance", "Two transactions that touch completely disjoint data items", "T1 and T2 as defined in the running example", "Any two transactions, as long as both eventually commit"]$dbt72002$::jsonb,
   1, $dbt72003$Concurrency control issues only arise when transactions' data accesses overlap; disjoint data means no conflicting operations exist, so any interleaving is safe.$dbt72003$, 1, 4),
  ($dbt72004$tq-dbms-sql-23-concurrent-execution-6$dbt72004$, $dbt72005$pt-dbms-sql-23-concurrent-execution$dbt72005$,
   $dbt72006$What is the key distinction between 'concurrency' and 'parallelism' as used in this chapter?$dbt72006$,
   $dbt72007$["They are exactly the same thing", "Concurrency means simultaneous execution on multiple cores; parallelism means interleaving on one core", "Concurrency means interleaving execution (even on a single core via time-slicing); parallelism means literally simultaneous execution on multiple cores \u2014 both raise the same correctness issues", "Parallelism only applies to read-only transactions"]$dbt72007$::jsonb,
   2, $dbt72008$Even a single-core system interleaving transactions via time-slicing faces the same correctness questions this chapter covers; parallelism (true simultaneity) is a separate, additional case.$dbt72008$, 1, 5),
  ($dbt72009$tq-dbms-sql-23-concurrent-execution-7$dbt72009$, $dbt72010$pt-dbms-sql-23-concurrent-execution$dbt72010$,
   $dbt72011$A single-user embedded database that never has two connections open at once needs which of the following?$dbt72011$,
   $dbt72012$["Full concurrency control machinery, just in case", "No concurrency control at all, since no two transactions are ever 'in flight' simultaneously", "Only view serializability checking", "Precedence graphs for every query"]$dbt72012$::jsonb,
   1, $dbt72013$Concurrency control exists to manage interleaving between multiple in-flight transactions; with only one transaction ever active, the problem this chapter addresses simply doesn't arise.$dbt72013$, 1, 6),
  ($dbt72014$tq-dbms-sql-23-concurrent-execution-8$dbt72014$, $dbt72015$pt-dbms-sql-23-concurrent-execution$dbt72015$,
   $dbt72016$What is the ultimate correctness property the DBMS wants to guarantee under concurrent execution?$dbt72016$,
   $dbt72017$["That every transaction runs faster than it would serially", "That the result of any interleaved execution is equivalent to the result of some serial execution of the same transactions", "That no transaction ever waits for another", "That all transactions read the same values"]$dbt72017$::jsonb,
   1, $dbt72018$This is the definition of serializability — the formal goal that lets the DBMS gain interleaving's performance benefits without sacrificing the illusion that transactions ran one at a time.$dbt72018$, 1, 7)
on conflict (id) do nothing;

-- 23.2 Serial Schedule
with g as (select id from public.learning_grids where lower(slug) = $dbt72019$dbms-sql-tutorial$dbt72019$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72020$chapter-23-concurrency-control$dbt72020$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72021$Serial Schedule$dbt72021$, $dbt72022$serial-schedule$dbt72022$, '', 2, 'published', true, true, $dbt72023$dbms_sql_tutorial$dbt72023$, $dbt72024$chapter-23-concurrency-control/serial-schedule$dbt72024$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72025$dbms_sql_tutorial$dbt72025$ and source_ref = $dbt72026$chapter-23-concurrency-control/serial-schedule$dbt72026$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72027$Serial Schedule$dbt72027$, $dbt72028$### Definition

A **serial schedule** executes one transaction completely (all its operations, in order, ending with COMMIT or ABORT) before the next transaction begins even its first operation. There is **zero interleaving** — the transactions' operations never interleave in time.

Using the running example (T1 transfers ₹100 from A to B; T2 credits 10% interest on A and B; A=1000, B=2000 initially), there are exactly two possible serial schedules:

**Serial schedule `<T1, T2>`:**
```
R1(A) W1(A) R1(B) W1(B) COMMIT1   R2(A) W2(A) R2(B) W2(B) COMMIT2
```
Trace: A=1000→900 (withdraw 100), B=2000→2100 (deposit 100), T1 commits.
Then T2 reads A=900→990 (×1.10), reads B=2100→2310 (×1.10), commits.
**Final: A=990, B=2310.**

**Serial schedule `<T2, T1>`:**
```
R2(A) W2(A) R2(B) W2(B) COMMIT2   R1(A) W1(A) R1(B) W1(B) COMMIT1
```
Trace: A=1000→1100 (interest), B=2000→2200 (interest), T2 commits.
Then T1 reads A=1100→1000 (withdraw 100), reads B=2200→2300 (deposit 100), commits.
**Final: A=1000, B=2300.**

Notice the two serial schedules produce **different final results** (990/2310 vs. 1000/2300) — that is expected and fine. Serializability never claims all serial orders give the same answer; it only claims each serial order is, by definition, correct on its own terms, because it is exactly what you'd get if the transactions ran with no concurrency at all.

### Why a Serial Schedule Is Always "Correct"

A serial schedule is correct by definition: since each transaction is assumed to be correct in isolation (it transforms a consistent database state into another consistent state when run alone), running transactions back-to-back with no interference trivially preserves that guarantee. There is no possibility of one transaction reading a partial, in-progress result of another, because no two transactions are ever "in progress" at the same instant.

### The Cost

The price of this guaranteed correctness is that **all concurrency benefits are given up**. While T1 runs, T2 (and every other waiting transaction) sits completely idle even if T2 doesn't touch any data T1 is using. On a system with many short transactions and I/O waits, forcing serial execution can reduce throughput drastically — which is precisely the motivation, from 23.1, for wanting interleaved (non-serial) schedules that are still equivalent to some serial order.

### Edge Cases

- With `n` transactions, there are `n!` possible serial schedules (orderings), and in general each can leave the database in a different final state — "serial" says nothing about *which* order is best, only that whichever order is chosen is internally consistent.
- A schedule can be serial even if the transactions do not touch the same data at all — seriality is purely about *time* (no overlap), not about *data overlap*.
- Systems occasionally fall back to serial (or near-serial) execution deliberately — e.g., taking an exclusive table-level lock for a bulk operation — trading concurrency for simplicity/safety in a narrow case.

### Key Takeaways / Interview Angle

- **Q: Are all serial schedules equivalent to each other?** No — different serial orders can (and often do) produce different final database states, as shown above; each is simply *self-consistent*, not identical to the others.
- **Q: What is a serial schedule used for in serializability theory?** It is the reference/gold-standard against which non-serial schedules are judged: a non-serial schedule is "correct" precisely when it is equivalent to *some* serial schedule.$dbt72028$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72029$dbms_sql_tutorial_seed$dbt72029$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72030$dbms_sql_tutorial_seed$dbt72030$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72031$dbms-sql-tutorial$dbt72031$),
     t as (select id from public.learning_topics where source_kind = $dbt72032$dbms_sql_tutorial$dbt72032$ and source_ref = $dbt72033$chapter-23-concurrency-control/serial-schedule$dbt72033$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72034$pt-dbms-sql-23-serial-schedule$dbt72034$, $dbt72035$Serial Schedule - Quick Test$dbt72035$, 'aptitude', 8, 8,
  $dbt72036$8 questions on Serial Schedule.$dbt72036$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72037$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72037$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72038$tq-dbms-sql-23-serial-schedule-1$dbt72038$, $dbt72039$pt-dbms-sql-23-serial-schedule$dbt72039$,
   $dbt72040$What defines a serial schedule of T1 and T2?$dbt72040$,
   $dbt72041$["T1 and T2 execute simultaneously on different CPU cores", "One transaction's operations all complete before the other transaction's first operation begins \u2014 no interleaving at all", "T1 and T2 both commit at exactly the same time", "T1 and T2 read the same initial values"]$dbt72041$::jsonb,
   1, $dbt72042$A serial schedule has zero overlap in time between transactions — one runs to completion (commit or abort) before the next starts.$dbt72042$, 1, 0),
  ($dbt72043$tq-dbms-sql-23-serial-schedule-2$dbt72043$, $dbt72044$pt-dbms-sql-23-serial-schedule$dbt72044$,
   $dbt72045$Using the running example (A=1000, B=2000), what is the final value of A after the serial schedule <T1, T2>?$dbt72045$,
   $dbt72046$["1000", "900", "990", "1100"]$dbt72046$::jsonb,
   2, $dbt72047$T1 first reduces A to 900 (1000-100) and commits; T2 then applies 10% interest to 900, giving 990.$dbt72047$, 1, 1),
  ($dbt72048$tq-dbms-sql-23-serial-schedule-3$dbt72048$, $dbt72049$pt-dbms-sql-23-serial-schedule$dbt72049$,
   $dbt72050$Why do the serial schedules <T1, T2> and <T2, T1> produce different final balances for A and B?$dbt72050$,
   $dbt72051$["One of the two schedules must be incorrect", "Because the order of operations changes what value each transaction's calculation is based on \u2014 T2's interest is computed on a different base depending on whether T1 already withdrew \u20b9100", "Serial schedules never actually change any values", "Because COMMIT changes the semantics of R and W"]$dbt72051$::jsonb,
   1, $dbt72052$Whichever transaction runs second operates on the value left behind by the first, so different orders legitimately yield different (but each individually correct) final states.$dbt72052$, 1, 2),
  ($dbt72053$tq-dbms-sql-23-serial-schedule-4$dbt72053$, $dbt72054$pt-dbms-sql-23-serial-schedule$dbt72054$,
   $dbt72055$Why is a serial schedule always considered 'correct' by definition?$dbt72055$,
   $dbt72056$["Because it always produces the highest final balance", "Because with no transactions ever overlapping in time, no transaction can ever read another's partial/in-progress result, so each transaction's own correctness-in-isolation guarantee is preserved", "Because serial schedules use fewer CPU cycles", "Because the DBMS validates serial schedules with a precedence graph"]$dbt72056$::jsonb,
   1, $dbt72057$Correctness-in-isolation of each transaction, combined with zero overlap, trivially guarantees the composed execution is also correct — there's no interference possible.$dbt72057$, 1, 3),
  ($dbt72058$tq-dbms-sql-23-serial-schedule-5$dbt72058$, $dbt72059$pt-dbms-sql-23-serial-schedule$dbt72059$,
   $dbt72060$What is the main drawback of always using serial schedules in a production DBMS?$dbt72060$,
   $dbt72061$["They are mathematically impossible to construct", "They produce incorrect results", "They give up all the throughput/response-time benefits of interleaving, since every other transaction must wait idle even if it touches unrelated data", "They cannot be logged for recovery"]$dbt72061$::jsonb,
   2, $dbt72062$Forcing transactions to run strictly one-at-a-time means the system can never overlap one transaction's I/O wait with another's useful work, badly hurting throughput.$dbt72062$, 1, 4),
  ($dbt72063$tq-dbms-sql-23-serial-schedule-6$dbt72063$, $dbt72064$pt-dbms-sql-23-serial-schedule$dbt72064$,
   $dbt72065$With 3 transactions T1, T2, T3, how many distinct serial schedules (orderings) are possible?$dbt72065$,
   $dbt72066$["3", "6", "9", "1"]$dbt72066$::jsonb,
   1, $dbt72067$The number of serial schedules of n transactions is n! — for 3 transactions, 3! = 6.$dbt72067$, 1, 5),
  ($dbt72068$tq-dbms-sql-23-serial-schedule-7$dbt72068$, $dbt72069$pt-dbms-sql-23-serial-schedule$dbt72069$,
   $dbt72070$Is a schedule where T1 and T2 touch completely disjoint data items, but interleave in time, considered a serial schedule?$dbt72070$,
   $dbt72071$["Yes, because there's no risk of interference", "No \u2014 'serial' is defined purely by timing (no overlap), regardless of whether the data accessed overlaps", "Yes, because disjoint data always implies seriality", "It depends on which data items are involved"]$dbt72071$::jsonb,
   1, $dbt72072$Seriality is about time ordering, not data overlap — if operations interleave in time at all, the schedule is non-serial even if perfectly safe.$dbt72072$, 1, 6),
  ($dbt72073$tq-dbms-sql-23-serial-schedule-8$dbt72073$, $dbt72074$pt-dbms-sql-23-serial-schedule$dbt72074$,
   $dbt72075$In serializability theory, what role does a serial schedule play?$dbt72075$,
   $dbt72076$["It is irrelevant \u2014 only non-serial schedules matter", "It serves as the reference standard: a non-serial schedule is judged correct precisely when it is equivalent to some serial schedule", "It is used only for deadlock detection", "It replaces the need for a precedence graph"]$dbt72076$::jsonb,
   1, $dbt72077$The entire theory of serializability (conflict and view) is about comparing an interleaved schedule against the gold-standard of some serial ordering of the same transactions.$dbt72077$, 1, 7)
on conflict (id) do nothing;

-- 23.3 Non Serial Schedule
with g as (select id from public.learning_grids where lower(slug) = $dbt72078$dbms-sql-tutorial$dbt72078$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72079$chapter-23-concurrency-control$dbt72079$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72080$Non Serial Schedule$dbt72080$, $dbt72081$non-serial-schedule$dbt72081$, '', 3, 'published', true, true, $dbt72082$dbms_sql_tutorial$dbt72082$, $dbt72083$chapter-23-concurrency-control/non-serial-schedule$dbt72083$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72084$dbms_sql_tutorial$dbt72084$ and source_ref = $dbt72085$chapter-23-concurrency-control/non-serial-schedule$dbt72085$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72086$Non Serial Schedule$dbt72086$, $dbt72087$### Definition

A **non-serial schedule** interleaves the operations of two or more transactions in time — at least one operation of T2 executes between two operations of T1 (or vice versa). This is what actually happens whenever a DBMS runs multiple transactions concurrently, as motivated in 23.1.

Using the running example (T1 transfers ₹100 from A to B; T2 credits 10% interest on A and B), here is one possible non-serial schedule `S1`:

```
1. R1(A)
2. W1(A)
3. R2(A)
4. R1(B)
5. W2(A)
6. W1(B)
7. R2(B)
8. W2(B)
```

T1's and T2's operations are genuinely interleaved: T2's `R2(A)` and `W2(A)` land in the middle of T1's sequence (between T1's B-operations). This is *not* a serial schedule — neither transaction fully finishes before the other starts.

### The Key Open Question

Unlike a serial schedule, which is correct by definition, a non-serial schedule's correctness is **not automatic**. It might still leave the database in a state that some serial execution of T1 and T2 could have produced (in which case it's just as good as a serial schedule, but faster) — or it might produce a state that **no** serial execution could ever produce, meaning the interleaving actually corrupted the logical result.

Determining which case a given non-serial schedule falls into is exactly what **serializability** (conflict serializability, 23.4, and view serializability, 23.5) is for. A non-serial schedule that is equivalent to some serial schedule is called **serializable**; the DBMS's concurrency control protocols (locking, timestamp ordering, etc.) exist specifically to only ever allow serializable non-serial schedules to occur, so the system gets interleaving's speed with serial execution's guarantees.

### Worked Intuition on Schedule S1

Trace S1 with A=1000, B=2000: R1(A)=1000, W1(A)=900 (T1's withdrawal already applied), R2(A)=900 (T2 reads T1's *already-updated* A — not stale), R1(B)=2000, W2(A)=990 (T2 applies interest to 900), W1(B)=2100 (T1's deposit), R2(B)=2100 (T2 reads T1's *already-updated* B), W2(B)=2310 (T2 applies interest to 2100). Final: A=990, B=2310 — identical to serial `<T1, T2>`! Even though the operations interleaved in real time, the *effective* result matches a serial order because T2's reads of A and B always happened to land after T1 had already finished writing that particular item. This schedule turns out to be serializable — Topic 23.4 formalizes exactly why.

### Edge Cases

- Not every interleaving is dangerous — as S1 shows, many non-serial schedules are perfectly safe and equivalent to a serial order; only some interleavings actually break correctness.
- A non-serial schedule can involve more than two transactions interleaving simultaneously; the analysis techniques (conflict/view serializability, precedence graphs) generalize to any number of transactions.
- The DBMS never has to "know" the semantics of the operations (e.g., that `W(A)` means "apply interest") to check serializability — it only needs to track which data items are read/written and in what order, which is what makes the theory purely operation-based rather than application-specific.

### Key Takeaways / Interview Angle

- **Q: Is a non-serial schedule always wrong or unsafe?** No — many non-serial schedules are just as correct as a serial one; "non-serial" only describes the *timing* of operations, not correctness.
- **Q: What decides whether a specific non-serial schedule is acceptable?** Whether it is *serializable* — equivalent to some serial order of the same transactions — which is checked via conflict serializability (practical, used by real systems) or the more general view serializability (theoretical).$dbt72087$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72088$dbms_sql_tutorial_seed$dbt72088$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72089$dbms_sql_tutorial_seed$dbt72089$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72090$dbms-sql-tutorial$dbt72090$),
     t as (select id from public.learning_topics where source_kind = $dbt72091$dbms_sql_tutorial$dbt72091$ and source_ref = $dbt72092$chapter-23-concurrency-control/non-serial-schedule$dbt72092$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72093$pt-dbms-sql-23-non-serial-schedule$dbt72093$, $dbt72094$Non Serial Schedule - Quick Test$dbt72094$, 'aptitude', 8, 8,
  $dbt72095$8 questions on Non Serial Schedule.$dbt72095$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72096$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72096$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72097$tq-dbms-sql-23-non-serial-schedule-1$dbt72097$, $dbt72098$pt-dbms-sql-23-non-serial-schedule$dbt72098$,
   $dbt72099$What makes a schedule 'non-serial'?$dbt72099$,
   $dbt72100$["It involves more than 5 transactions", "At least one operation of one transaction is interleaved between operations of another transaction \u2014 no transaction fully completes before the next begins", "It always ends in an abort", "It never involves a COMMIT"]$dbt72100$::jsonb,
   1, $dbt72101$Non-serial simply means the operations of the transactions overlap in time, unlike a serial schedule where one transaction fully finishes before the next starts.$dbt72101$, 1, 0),
  ($dbt72102$tq-dbms-sql-23-non-serial-schedule-2$dbt72102$, $dbt72103$pt-dbms-sql-23-non-serial-schedule$dbt72103$,
   $dbt72104$In worked schedule S1 in this topic, is the final state (A=990, B=2310) the same as some serial schedule's result?$dbt72104$,
   $dbt72105$["No, it is a completely unique result impossible under any serial order", "Yes \u2014 it matches the result of the serial schedule <T1, T2>, even though the operations were interleaved", "It cannot be determined without running the schedule twice", "Yes, it matches <T2, T1>"]$dbt72105$::jsonb,
   1, $dbt72106$Tracing S1 shows the final balances exactly match the serial schedule <T1, T2>, because T2's reads always land after T1 has already updated the relevant item.$dbt72106$, 1, 1),
  ($dbt72107$tq-dbms-sql-23-non-serial-schedule-3$dbt72107$, $dbt72108$pt-dbms-sql-23-non-serial-schedule$dbt72108$,
   $dbt72109$What is the key open question a non-serial schedule raises that a serial schedule never does?$dbt72109$,
   $dbt72110$["Whether the transactions will ever commit", "Whether the interleaved result is equivalent to some serial execution, or whether it produces a state no serial order could ever produce", "Whether the schedule uses SQL correctly", "Whether the transactions touch the same table"]$dbt72110$::jsonb,
   1, $dbt72111$A serial schedule is correct by definition; a non-serial schedule's correctness must be checked via serializability, since interleaving may or may not preserve the same effective result as some serial order.$dbt72111$, 1, 2),
  ($dbt72112$tq-dbms-sql-23-non-serial-schedule-4$dbt72112$, $dbt72113$pt-dbms-sql-23-non-serial-schedule$dbt72113$,
   $dbt72114$Which theoretical tools determine whether a given non-serial schedule is 'safe' (serializable)?$dbt72114$,
   $dbt72115$["Only the DBMS's query optimizer", "Conflict serializability and view serializability", "The number of tables involved", "The transaction isolation level configured by the DBA"]$dbt72115$::jsonb,
   1, $dbt72116$Conflict serializability (practical, used by real concurrency control protocols) and view serializability (a broader, more theoretical notion) are exactly the tools used to judge non-serial schedule correctness.$dbt72116$, 1, 3),
  ($dbt72117$tq-dbms-sql-23-non-serial-schedule-5$dbt72117$, $dbt72118$pt-dbms-sql-23-non-serial-schedule$dbt72118$,
   $dbt72119$Why does the DBMS's concurrency control protocol (e.g., locking) exist, in relation to non-serial schedules?$dbt72119$,
   $dbt72120$["To prevent any non-serial schedule from ever occurring", "To ensure that only serializable non-serial schedules are allowed to execute, combining interleaving's speed with serial execution's correctness guarantee", "To force every schedule to become serial", "To speed up disk I/O directly"]$dbt72120$::jsonb,
   1, $dbt72121$Concurrency control mechanisms restrict which interleavings are permitted so that whatever non-serial schedule actually runs is guaranteed to be serializable.$dbt72121$, 1, 4),
  ($dbt72122$tq-dbms-sql-23-non-serial-schedule-6$dbt72122$, $dbt72123$pt-dbms-sql-23-non-serial-schedule$dbt72123$,
   $dbt72124$Does checking serializability require the DBMS to understand what a transaction's operations mean semantically (e.g., that a write represents 'applying interest')?$dbt72124$,
   $dbt72125$["Yes, semantic understanding is required", "No \u2014 serializability analysis only needs to know which data items are read/written and their relative order, regardless of what the operations 'mean'", "Only for financial applications", "Only if the transaction spans multiple tables"]$dbt72125$::jsonb,
   1, $dbt72126$Serializability theory is purely operation-based (tracking reads/writes on data items and their order), which is what makes it generally applicable without any application-specific logic.$dbt72126$, 1, 5),
  ($dbt72127$tq-dbms-sql-23-non-serial-schedule-7$dbt72127$, $dbt72128$pt-dbms-sql-23-non-serial-schedule$dbt72128$,
   $dbt72129$Is it possible for more than two transactions to interleave in a single non-serial schedule?$dbt72129$,
   $dbt72130$["No, non-serial schedules are limited to exactly two transactions", "Yes \u2014 the same serializability analysis techniques generalize to any number of concurrently interleaved transactions", "Only if all transactions are read-only", "Only in distributed databases"]$dbt72130$::jsonb,
   1, $dbt72131$Non-serial schedules and the tools to analyze them (precedence graphs, etc.) work for any number of transactions, not just two.$dbt72131$, 1, 6),
  ($dbt72132$tq-dbms-sql-23-non-serial-schedule-8$dbt72132$, $dbt72133$pt-dbms-sql-23-non-serial-schedule$dbt72133$,
   $dbt72134$Which statement correctly summarizes the relationship between 'non-serial' and 'incorrect'?$dbt72134$,
   $dbt72135$["Non-serial and incorrect mean the same thing", "A non-serial schedule may or may not be correct \u2014 it depends on whether it is serializable, not on the mere fact that it's interleaved", "All non-serial schedules are incorrect by definition", "Only serial schedules can ever be interleaved"]$dbt72135$::jsonb,
   1, $dbt72136$Being non-serial only describes timing/interleaving; whether the result is correct depends entirely on whether the schedule is serializable.$dbt72136$, 1, 7)
on conflict (id) do nothing;

-- 23.4 Conflict Serializability
with g as (select id from public.learning_grids where lower(slug) = $dbt72137$dbms-sql-tutorial$dbt72137$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72138$chapter-23-concurrency-control$dbt72138$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72139$Conflict Serializability$dbt72139$, $dbt72140$conflict-serializability$dbt72140$, '', 4, 'published', true, true, $dbt72141$dbms_sql_tutorial$dbt72141$, $dbt72142$chapter-23-concurrency-control/conflict-serializability$dbt72142$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72143$dbms_sql_tutorial$dbt72143$ and source_ref = $dbt72144$chapter-23-concurrency-control/conflict-serializability$dbt72144$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72145$Conflict Serializability$dbt72145$, $dbt72146$### What Counts as a "Conflict"

Two operations from *different* transactions **conflict** if they satisfy all three conditions: (1) they belong to different transactions, (2) they act on the **same data item**, and (3) **at least one of them is a write**. So: R-R is never a conflict (two reads never interfere); R-W, W-R, and W-W on the same item are all conflicts. Two operations that don't conflict can be **swapped** (their relative order exchanged) without changing the effect of the schedule — either they touch different data items, or they're both reads.

### Definition

A schedule is **conflict-serializable** if you can transform it into some serial schedule purely by repeatedly swapping *adjacent, non-conflicting* operations (never touching conflicting pairs). If such a sequence of swaps exists, the schedule is guaranteed to produce the same result as that serial schedule.

### Worked Example — Conflict-Serializable

Recall schedule `S1` from 23.3:
```
1. R1(A)  2. W1(A)  3. R2(A)  4. R1(B)  5. W2(A)  6. W1(B)  7. R2(B)  8. W2(B)
```
Swap step 3 `R2(A)` and step 4 `R1(B)` — different data items (A vs. B), non-conflicting:
```
R1(A) W1(A) R1(B) R2(A) W2(A) W1(B) R2(B) W2(B)
```
Swap `W2(A)` (now after R1(B)) and `W1(B)` — different items, non-conflicting:
```
R1(A) W1(A) R1(B) R2(A) W1(B) W2(A) R2(B) W2(B)
```
Swap `R2(A)` and `W1(B)` — different items, non-conflicting:
```
R1(A) W1(A) R1(B) W1(B) R2(A) W2(A) R2(B) W2(B)
```
This is exactly the serial schedule `<T1, T2>`! Three legal swaps (each between non-conflicting operations on different items) transformed S1 into a serial order, proving **S1 is conflict-serializable**.

### Worked Example — NOT Conflict-Serializable

Consider a smaller schedule `S2` where T1 does `R(A), W(B)` and T2 does `R(B), W(A)`:
```
1. R1(A)  2. R2(B)  3. W1(B)  4. W2(A)
```
Check conflicts: `R2(B)` (step 2) and `W1(B)` (step 3) conflict on B, and R2 comes before W1 — so T2 must logically precede T1 for B. But `R1(A)` (step 1) and `W2(A)` (step 4) conflict on A, and R1 comes before W2 — so T1 must logically precede T2 for A. These two requirements contradict each other (T2 before T1, and T1 before T2), so **no sequence of valid swaps can ever turn S2 into a serial schedule** — S2 is **not conflict-serializable**.

### Edge Cases

- Swapping is only ever valid between **adjacent** operations at each step — you cannot jump an operation past a conflicting one, even indirectly; every intermediate swap must itself be non-conflicting.
- A schedule with zero conflicting pairs at all (transactions touch fully disjoint data) is trivially conflict-serializable — every interleaving is equivalent to every serial order.
- Conflict serializability only cares about the *existence* of a legal reordering; it says nothing about which serial order the DBMS should prefer or how many swaps are needed.

### Key Takeaways / Interview Angle

- **Q: Why is R-R never a conflict?** Because two reads never change any data, so their relative order can never affect the final result — swapping them is always safe.
- **Q: How does a real DBMS use this concept?** It doesn't run the swap algorithm live — instead, locking protocols (e.g., two-phase locking) are designed so that any schedule they *permit* is automatically guaranteed to be conflict-serializable, without ever having to construct or check swaps at runtime.
- **Q: Is conflict serializability the only kind of serializability?** No — it is the practical, easy-to-test standard used by real systems, but 23.5 introduces the broader (and less commonly implemented) view serializability.$dbt72146$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72147$dbms_sql_tutorial_seed$dbt72147$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72148$dbms_sql_tutorial_seed$dbt72148$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72149$dbms-sql-tutorial$dbt72149$),
     t as (select id from public.learning_topics where source_kind = $dbt72150$dbms_sql_tutorial$dbt72150$ and source_ref = $dbt72151$chapter-23-concurrency-control/conflict-serializability$dbt72151$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72152$pt-dbms-sql-23-conflict-serializability$dbt72152$, $dbt72153$Conflict Serializability - Quick Test$dbt72153$, 'aptitude', 8, 8,
  $dbt72154$8 questions on Conflict Serializability.$dbt72154$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72155$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72155$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72156$tq-dbms-sql-23-conflict-serializability-1$dbt72156$, $dbt72157$pt-dbms-sql-23-conflict-serializability$dbt72157$,
   $dbt72158$Which pair of operations on the same data item A, from different transactions, does NOT count as a conflict?$dbt72158$,
   $dbt72159$["R(A) and W(A)", "W(A) and W(A)", "R(A) and R(A)", "W(A) and R(A)"]$dbt72159$::jsonb,
   2, $dbt72160$Two reads never interfere with each other since neither changes data — R-R is the only pairing on the same item that is not a conflict.$dbt72160$, 1, 0),
  ($dbt72161$tq-dbms-sql-23-conflict-serializability-2$dbt72161$, $dbt72162$pt-dbms-sql-23-conflict-serializability$dbt72162$,
   $dbt72163$What are the three conditions required for two operations to 'conflict'?$dbt72163$,
   $dbt72164$["Same transaction, same data item, same timestamp", "Different transactions, same data item, at least one is a write", "Different transactions, different data items, both are writes", "Same transaction, different data items, at least one is a read"]$dbt72164$::jsonb,
   1, $dbt72165$Conflict requires operations from two different transactions, touching the same data item, with at least one of the two being a write.$dbt72165$, 1, 1),
  ($dbt72166$tq-dbms-sql-23-conflict-serializability-3$dbt72166$, $dbt72167$pt-dbms-sql-23-conflict-serializability$dbt72167$,
   $dbt72168$In the worked example, schedule S1 was shown to be conflict-serializable by transforming it into which serial schedule?$dbt72168$,
   $dbt72169$["<T2, T1>", "<T1, T2>", "No serial schedule \u2014 S1 is not conflict-serializable", "A schedule involving a third transaction T3"]$dbt72169$::jsonb,
   1, $dbt72170$Three legal adjacent swaps of non-conflicting operations transform S1 into exactly the serial schedule <T1, T2>.$dbt72170$, 1, 2),
  ($dbt72171$tq-dbms-sql-23-conflict-serializability-4$dbt72171$, $dbt72172$pt-dbms-sql-23-conflict-serializability$dbt72172$,
   $dbt72173$In schedule S2 (T1: R(A), W(B); T2: R(B), W(A) interleaved as R1(A) R2(B) W1(B) W2(A)), why is it NOT conflict-serializable?$dbt72173$,
   $dbt72174$["Because R1(A) and R2(B) conflict", "Because the conflicts force T2 to precede T1 (on B) and simultaneously force T1 to precede T2 (on A) \u2014 a contradiction no swap sequence can resolve", "Because it has more than 4 operations", "Because neither transaction ever commits"]$dbt72174$::jsonb,
   1, $dbt72175$The B-conflict (R2 before W1) demands T2 before T1, while the A-conflict (R1 before W2) demands T1 before T2 — contradictory ordering requirements mean no serial-equivalent order exists.$dbt72175$, 1, 3),
  ($dbt72176$tq-dbms-sql-23-conflict-serializability-5$dbt72176$, $dbt72177$pt-dbms-sql-23-conflict-serializability$dbt72177$,
   $dbt72178$What operation is legal when checking conflict serializability by swapping?$dbt72178$,
   $dbt72179$["Swapping any two operations anywhere in the schedule, conflicting or not", "Swapping adjacent operations that do NOT conflict with each other", "Swapping only operations belonging to the same transaction", "Swapping conflicting operations as long as they are on different data items"]$dbt72179$::jsonb,
   1, $dbt72180$Only adjacent, non-conflicting operations may be swapped; conflicting operations must keep their relative order, since swapping them could change the result.$dbt72180$, 1, 4),
  ($dbt72181$tq-dbms-sql-23-conflict-serializability-6$dbt72181$, $dbt72182$pt-dbms-sql-23-conflict-serializability$dbt72182$,
   $dbt72183$If two transactions access completely disjoint sets of data items, what can be said about any schedule interleaving them?$dbt72183$,
   $dbt72184$["It can never be conflict-serializable", "It is trivially conflict-serializable, since there are no conflicting operations to worry about", "It depends on the isolation level", "It is only serializable if run serially"]$dbt72184$::jsonb,
   1, $dbt72185$With zero conflicting operation pairs, every interleaving is automatically equivalent to any serial order, making the schedule trivially conflict-serializable.$dbt72185$, 1, 5),
  ($dbt72186$tq-dbms-sql-23-conflict-serializability-7$dbt72186$, $dbt72187$pt-dbms-sql-23-conflict-serializability$dbt72187$,
   $dbt72188$How does a real DBMS typically guarantee conflict serializability at runtime?$dbt72188$,
   $dbt72189$["It runs the full swap-checking algorithm on every schedule before executing it", "It uses locking protocols (like two-phase locking) designed so that any schedule they permit is automatically conflict-serializable, without explicitly computing swaps", "It disallows all non-serial schedules", "It only allows read-only transactions to run concurrently"]$dbt72189$::jsonb,
   1, $dbt72190$Practical systems don't test serializability after the fact; they use protocols engineered to only ever produce conflict-serializable schedules by construction.$dbt72190$, 1, 6),
  ($dbt72191$tq-dbms-sql-23-conflict-serializability-8$dbt72191$, $dbt72192$pt-dbms-sql-23-conflict-serializability$dbt72192$,
   $dbt72193$Which statement about swap validity is correct?$dbt72193$,
   $dbt72194$["Any two operations that are far apart in the schedule can be swapped directly in one step", "Swaps must be performed one adjacent pair at a time, and every intermediate swap in the sequence must itself involve non-conflicting operations", "Only the first and last operations of a schedule can ever be swapped", "Swapping is unrelated to whether a schedule is conflict-serializable"]$dbt72194$::jsonb,
   1, $dbt72195$Conflict serializability is checked by a sequence of adjacent swaps, each individually valid (non-conflicting) — you cannot 'jump' an operation past a conflicting one even indirectly.$dbt72195$, 1, 7)
on conflict (id) do nothing;

-- 23.5 View Serializability
with g as (select id from public.learning_grids where lower(slug) = $dbt72196$dbms-sql-tutorial$dbt72196$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72197$chapter-23-concurrency-control$dbt72197$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72198$View Serializability$dbt72198$, $dbt72199$view-serializability$dbt72199$, '', 5, 'published', true, true, $dbt72200$dbms_sql_tutorial$dbt72200$, $dbt72201$chapter-23-concurrency-control/view-serializability$dbt72201$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72202$dbms_sql_tutorial$dbt72202$ and source_ref = $dbt72203$chapter-23-concurrency-control/view-serializability$dbt72203$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72204$View Serializability$dbt72204$, $dbt72205$### Definition

Two schedules are **view equivalent** if all three of these hold:

1. **Same initial reads**: for each data item, if some transaction reads its *initial* (pre-schedule) value in one schedule, the same transaction reads the initial value of that item in the other schedule.
2. **Same read-from relationships**: if transaction Tj reads a value of item X that was written by Ti in one schedule, then Tj must read the value of X written by that same Ti in the other schedule too.
3. **Same final writes**: for each data item, the transaction that performs the *last* write to it must be the same in both schedules.

A schedule is **view-serializable** if it is view-equivalent to some serial schedule.

### Every Conflict-Serializable Schedule Is View-Serializable — But Not Vice Versa

Conflict serializability is a stricter (narrower) test than view serializability: reordering via non-conflicting swaps always preserves the same initial-reads/read-from/final-writes structure, so every conflict-serializable schedule automatically qualifies as view-serializable. The interesting case is the reverse: schedules that are view-serializable but **not** conflict-serializable. These always involve **blind writes** — a write to an item with no read of that item by the same transaction beforehand.

### Worked Example — View-Serializable but NOT Conflict-Serializable

Consider three transactions all touching data item A: T1 does `R(A)` then later `W(A)`; T2 does only `W(A)` (a blind write); T3 does only `W(A)` (a blind write). Schedule:
```
1. R1(A)   2. W2(A)   3. W1(A)   4. W3(A)
```
**Conflict analysis**: R1(A) before W2(A) → T1→T2. W2(A) before W1(A) → T2→T1. That's already a cycle (T1→T2 and T2→T1), so this schedule is **NOT conflict-serializable**.

**View analysis**: Compare against serial schedule `<T1, T2, T3>`.
- Initial reads: in both schedules, only T1 reads A, and it reads the pre-schedule initial value (nobody writes A before R1(A) in either). ✓ Match.
- Read-from: no transaction reads a value written by another transaction in either schedule (T1's only read is the initial value; T2 and T3 never read at all). ✓ Match (vacuously).
- Final write: in the original schedule, the last write is `W3(A)` — T3. In `<T1, T2, T3>`, the last write is also T3's. ✓ Match.

All three conditions hold, so the schedule **is view-equivalent to `<T1, T2, T3>`** — it is view-serializable, despite failing the conflict-serializability test. Intuitively: since nobody ever reads the *intermediate* values written by T2 or T1, the actual order of those blind writes doesn't matter to any observer — only the final writer (T3) matters, and that matches.

### Why Real Systems Still Check Conflict Serializability

View serializability is strictly more permissive (a larger class of "safe" schedules) but testing it in general is computationally much harder (NP-complete) than testing conflict serializability (which reduces to cycle-detection on a precedence graph, 23.6 — polynomial time). Because of this, virtually every production DBMS's concurrency control protocol enforces the narrower, cheaper-to-guarantee conflict serializability, quietly giving up the extra (rare, blind-write-dependent) concurrency that view serializability would technically allow.

### Edge Cases

- If a schedule has no blind writes at all, conflict serializability and view serializability coincide exactly — the distinction only matters when blind writes are present.
- View serializability is about the netresult being indistinguishable, not about the physical order of operations — this is why it's the "true" theoretical notion of correctness, even though it's impractical to test directly at scale.

### Key Takeaways / Interview Angle

- **Q: Is view serializability strictly broader than conflict serializability?** Yes — every conflict-serializable schedule is view-serializable, but some view-serializable schedules are not conflict-serializable (always involving blind writes).
- **Q: Why don't production databases test view serializability directly?** Because it's NP-complete to test in general, versus conflict serializability's efficient polynomial-time (precedence-graph cycle) test.$dbt72205$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72206$dbms_sql_tutorial_seed$dbt72206$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72207$dbms_sql_tutorial_seed$dbt72207$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72208$dbms-sql-tutorial$dbt72208$),
     t as (select id from public.learning_topics where source_kind = $dbt72209$dbms_sql_tutorial$dbt72209$ and source_ref = $dbt72210$chapter-23-concurrency-control/view-serializability$dbt72210$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72211$pt-dbms-sql-23-view-serializability$dbt72211$, $dbt72212$View Serializability - Quick Test$dbt72212$, 'aptitude', 8, 8,
  $dbt72213$8 questions on View Serializability.$dbt72213$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72214$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72214$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72215$tq-dbms-sql-23-view-serializability-1$dbt72215$, $dbt72216$pt-dbms-sql-23-view-serializability$dbt72216$,
   $dbt72217$What are the three conditions for two schedules to be 'view equivalent'?$dbt72217$,
   $dbt72218$["Same number of transactions, same number of commits, same number of aborts", "Same initial reads, same read-from relationships between transactions, and the same transaction performing the final write to each item", "Same total execution time and same lock table state", "Same set of data items accessed, regardless of order"]$dbt72218$::jsonb,
   1, $dbt72219$View equivalence requires matching initial reads, matching read-from pairs, and matching final writers per data item — nothing about timing or locks.$dbt72219$, 1, 0),
  ($dbt72220$tq-dbms-sql-23-view-serializability-2$dbt72220$, $dbt72221$pt-dbms-sql-23-view-serializability$dbt72221$,
   $dbt72222$In the worked example (R1(A), W2(A), W1(A), W3(A)), why does this schedule fail the conflict-serializability test?$dbt72222$,
   $dbt72223$["Because R1(A) and W3(A) don't conflict", "Because the conflicts create a cycle: R1(A) before W2(A) implies T1\u2192T2, but W2(A) before W1(A) implies T2\u2192T1", "Because it involves three transactions instead of two", "Because W3(A) is a blind write"]$dbt72223$::jsonb,
   1, $dbt72224$The precedence graph has both a T1→T2 edge and a T2→T1 edge, forming a 2-node cycle — which means no serial reordering via legal swaps is possible.$dbt72224$, 1, 1),
  ($dbt72225$tq-dbms-sql-23-view-serializability-3$dbt72225$, $dbt72226$pt-dbms-sql-23-view-serializability$dbt72226$,
   $dbt72227$Despite failing conflict serializability, why is that same schedule view-serializable (equivalent to <T1, T2, T3>)?$dbt72227$,
   $dbt72228$["Because T2 and T3's writes are blind (no read), so nobody observes their relative order \u2014 only the final writer (T3) and T1's initial read matter, and both match the serial order", "Because view serializability ignores write operations entirely", "Because the schedule has no conflicts at all", "Because T1 commits first in both schedules"]$dbt72228$::jsonb,
   0, $dbt72229$Since T2 and T3 never read A, reordering their blind writes has no observable effect as long as the final writer and the sole read (T1's initial read) stay consistent with the serial order — which they do here.$dbt72229$, 1, 2),
  ($dbt72230$tq-dbms-sql-23-view-serializability-4$dbt72230$, $dbt72231$pt-dbms-sql-23-view-serializability$dbt72231$,
   $dbt72232$What kind of operation is essential for a schedule to be view-serializable but NOT conflict-serializable?$dbt72232$,
   $dbt72233$["A blind write \u2014 a write to an item with no preceding read of it by the same transaction", "A dirty read", "A phantom insert", "A two-phase commit"]$dbt72233$::jsonb,
   0, $dbt72234$Without blind writes, conflict and view serializability coincide; the extra permissiveness of view serializability specifically comes from ignoring the order of writes nobody ever reads.$dbt72234$, 1, 3),
  ($dbt72235$tq-dbms-sql-23-view-serializability-5$dbt72235$, $dbt72236$pt-dbms-sql-23-view-serializability$dbt72236$,
   $dbt72237$Is every conflict-serializable schedule also view-serializable?$dbt72237$,
   $dbt72238$["No, they are unrelated properties", "Yes \u2014 conflict serializability is strictly narrower, so anything satisfying it automatically satisfies the broader view-serializability definition too", "Only if the schedule has no blind writes", "Only for schedules with exactly two transactions"]$dbt72238$::jsonb,
   1, $dbt72239$Reordering by non-conflicting swaps always preserves initial reads, read-from relationships, and final writes, so conflict-serializable schedules are always a subset of view-serializable ones.$dbt72239$, 1, 4),
  ($dbt72240$tq-dbms-sql-23-view-serializability-6$dbt72240$, $dbt72241$pt-dbms-sql-23-view-serializability$dbt72241$,
   $dbt72242$Why do real production DBMS concurrency control protocols enforce conflict serializability rather than the more general view serializability?$dbt72242$,
   $dbt72243$["View serializability is not a real academic concept", "Testing view serializability in general is NP-complete, while conflict serializability can be tested efficiently (polynomial time) via a precedence graph", "View serializability only applies to read-only transactions", "Conflict serializability produces higher final account balances"]$dbt72243$::jsonb,
   1, $dbt72244$The practical cost of testing/enforcing view serializability is prohibitive at scale, so systems accept the narrower but efficiently-checkable conflict serializability standard.$dbt72244$, 1, 5),
  ($dbt72245$tq-dbms-sql-23-view-serializability-7$dbt72245$, $dbt72246$pt-dbms-sql-23-view-serializability$dbt72246$,
   $dbt72247$When does conflict serializability and view serializability coincide exactly (produce the same verdict)?$dbt72247$,
   $dbt72248$["Always, they are identical definitions", "Never \u2014 they always disagree", "When the schedule contains no blind writes", "Only when there are exactly 2 transactions"]$dbt72248$::jsonb,
   2, $dbt72249$The gap between the two notions only opens up in the presence of blind writes; without them, every view-serializable schedule is also conflict-serializable.$dbt72249$, 1, 6),
  ($dbt72250$tq-dbms-sql-23-view-serializability-8$dbt72250$, $dbt72251$pt-dbms-sql-23-view-serializability$dbt72251$,
   $dbt72252$What does the 'final write' condition of view equivalence require?$dbt72252$,
   $dbt72253$["Every transaction must write every data item", "For each data item, the same transaction must perform the last write to it in both schedules being compared", "The last operation of the schedule must be a COMMIT", "All writes must happen before all reads"]$dbt72253$::jsonb,
   1, $dbt72254$Final-write matching ensures that whichever value a subsequent reader (or the database state itself) ultimately sees for that item is attributable to the same transaction in both schedules.$dbt72254$, 1, 7)
on conflict (id) do nothing;

-- 23.6 Precedence Graph
with g as (select id from public.learning_grids where lower(slug) = $dbt72255$dbms-sql-tutorial$dbt72255$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72256$chapter-23-concurrency-control$dbt72256$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72257$Precedence Graph$dbt72257$, $dbt72258$precedence-graph$dbt72258$, '', 6, 'published', true, true, $dbt72259$dbms_sql_tutorial$dbt72259$, $dbt72260$chapter-23-concurrency-control/precedence-graph$dbt72260$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72261$dbms_sql_tutorial$dbt72261$ and source_ref = $dbt72262$chapter-23-concurrency-control/precedence-graph$dbt72262$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72263$Precedence Graph$dbt72263$, $dbt72264$### Definition

A **precedence graph** (also called a serializability graph) is the standard tool used to *test* conflict serializability without manually trying every possible sequence of swaps. Build it as follows:

1. Create one **node** per transaction in the schedule.
2. For every pair of conflicting operations (different transactions, same data item, at least one is a write) where transaction Ti's operation comes **before** transaction Tj's operation in the schedule, draw a directed **edge Ti → Tj**.

**Theorem**: a schedule is conflict-serializable **if and only if** its precedence graph has **no cycles**. If the graph is acyclic, any topological sort of the nodes gives a valid equivalent serial order; if it has even one cycle, no equivalent serial order can exist.

### Worked Example 1 — Acyclic Graph (Conflict-Serializable)

Recall schedule `S1` from 23.3/23.4:
```
1. R1(A)  2. W1(A)  3. R2(A)  4. R1(B)  5. W2(A)  6. W1(B)  7. R2(B)  8. W2(B)
```
Check every conflicting pair:
- On A: R1(A)@1 & W2(A)@5 → T1→T2. W1(A)@2 & R2(A)@3 → T1→T2. W1(A)@2 & W2(A)@5 → T1→T2.
- On B: R1(B)@4 & W2(B)@8 → T1→T2. W1(B)@6 & R2(B)@7 → T1→T2. W1(B)@6 & W2(B)@8 → T1→T2.

Every single conflict produces the **same direction**, T1→T2. The graph is: one node T1, one node T2, one edge T1→T2. No cycle exists (impossible with only 2 nodes and edges all one direction) → **S1 is conflict-serializable**, and the only topological order is `<T1, T2>` — matching exactly what the swap-based proof in 23.4 found.

### Worked Example 2 — Cyclic Graph (NOT Conflict-Serializable)

Recall schedule `S2` from 23.4 (T1: R(A), W(B); T2: R(B), W(A)):
```
1. R1(A)  2. R2(B)  3. W1(B)  4. W2(A)
```
Conflicts: R2(B)@2 & W1(B)@3 → T2→T1 (T2's read precedes T1's write on B). R1(A)@1 & W2(A)@4 → T1→T2 (T1's read precedes T2's write on A).

The graph has nodes {T1, T2} and **both** edges T1→T2 and T2→T1 — a 2-node cycle. Since the graph has a cycle, **S2 is not conflict-serializable**, confirming the earlier swap-based conclusion.

### Reading a Larger Graph

With 3+ transactions the same rule applies: draw every conflict edge, then look for *any* cycle (not just 2-node cycles — a 3-node cycle T1→T2→T3→T1 is just as disqualifying). If the graph is a DAG (directed acyclic graph), a topological sort exists (possibly more than one, if the DAG isn't a total order) — each valid topological sort is an equivalent serial schedule.

### Edge Cases

- Multiple conflicting operation pairs between the same two transactions on different items only ever add a **duplicate** edge in the same direction (as seen in Worked Example 1) or, if directions genuinely differ across items, immediately create a 2-node cycle (as in Worked Example 2) — there's no in-between state for two nodes.
- A precedence graph with no edges at all (transactions share no conflicting operations) is trivially acyclic — the schedule is conflict-serializable in every possible order.
- The precedence graph only encodes *conflict* relationships — it deliberately throws away non-conflicting operations (like blind writes' relative order), which is exactly why it tests conflict serializability and not the broader view serializability.

### Key Takeaways / Interview Angle

- **Q: What is the precedence graph test, in one line?** Build a node per transaction, an edge Ti→Tj per conflict where Ti's operation precedes Tj's on the same item — acyclic means conflict-serializable, cyclic means it is not.
- **Q: Why is this more practical than the swap-based definition?** Cycle detection in a directed graph is a well-known, efficient (linear-time) algorithm, whereas exhaustively searching for a valid swap sequence would be far more expensive to implement as a live concurrency control check.$dbt72264$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72265$dbms_sql_tutorial_seed$dbt72265$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72266$dbms_sql_tutorial_seed$dbt72266$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72267$dbms-sql-tutorial$dbt72267$),
     t as (select id from public.learning_topics where source_kind = $dbt72268$dbms_sql_tutorial$dbt72268$ and source_ref = $dbt72269$chapter-23-concurrency-control/precedence-graph$dbt72269$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72270$pt-dbms-sql-23-precedence-graph$dbt72270$, $dbt72271$Precedence Graph - Quick Test$dbt72271$, 'aptitude', 8, 8,
  $dbt72272$8 questions on Precedence Graph.$dbt72272$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72273$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72273$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72274$tq-dbms-sql-23-precedence-graph-1$dbt72274$, $dbt72275$pt-dbms-sql-23-precedence-graph$dbt72275$,
   $dbt72276$How is an edge added to a precedence graph?$dbt72276$,
   $dbt72277$["One edge per transaction, regardless of conflicts", "A directed edge Ti \u2192 Tj is added whenever Ti has an operation that conflicts with, and precedes, an operation of Tj on the same data item", "An edge is added for every pair of transactions, whether or not they conflict", "Edges are added only for COMMIT operations"]$dbt72277$::jsonb,
   1, $dbt72278$Edges represent conflict-based ordering requirements: Ti→Tj means some conflicting operation of Ti had to happen before Tj's corresponding operation.$dbt72278$, 1, 0),
  ($dbt72279$tq-dbms-sql-23-precedence-graph-2$dbt72279$, $dbt72280$pt-dbms-sql-23-precedence-graph$dbt72280$,
   $dbt72281$What is the precedence graph theorem for conflict serializability?$dbt72281$,
   $dbt72282$["A schedule is conflict-serializable if and only if its precedence graph has no cycles", "A schedule is conflict-serializable if and only if its precedence graph has at least one cycle", "A schedule is always conflict-serializable regardless of the graph's shape", "The precedence graph determines view serializability, not conflict serializability"]$dbt72282$::jsonb,
   0, $dbt72283$This is the fundamental theorem: acyclic precedence graph implies conflict-serializable (with a topological sort giving the equivalent serial order); any cycle implies it is not.$dbt72283$, 1, 1),
  ($dbt72284$tq-dbms-sql-23-precedence-graph-3$dbt72284$, $dbt72285$pt-dbms-sql-23-precedence-graph$dbt72285$,
   $dbt72286$In Worked Example 1 (schedule S1), why did every single conflicting pair produce an edge in the same direction (T1→T2)?$dbt72286$,
   $dbt72287$["Because T1 and T2 never actually conflict", "Because in S1, all of T1's operations on both A and B happen to occur before the corresponding conflicting operations of T2 that touch the same items", "Because the graph algorithm forces all edges to point the same way", "Because T1 committed before T2 started"]$dbt72287$::jsonb,
   1, $dbt72288$Tracing S1's timeline shows T1's reads/writes on A and B consistently precede T2's conflicting operations on those same items, so every conflict contributes a T1→T2 edge, never the reverse.$dbt72288$, 1, 2),
  ($dbt72289$tq-dbms-sql-23-precedence-graph-4$dbt72289$, $dbt72290$pt-dbms-sql-23-precedence-graph$dbt72290$,
   $dbt72291$In Worked Example 2 (schedule S2), what specifically causes the precedence graph to contain a cycle?$dbt72291$,
   $dbt72292$["R2(B) precedes W1(B) (giving T2\u2192T1) while R1(A) precedes W2(A) (giving T1\u2192T2), producing edges in both directions between the same two nodes", "S2 has more than two transactions", "Neither transaction ever writes any data", "The schedule includes a blind write"]$dbt72292$::jsonb,
   0, $dbt72293$The two conflicts impose contradictory ordering requirements (T2 before T1 on B, T1 before T2 on A), which manifests as a 2-node cycle in the graph.$dbt72293$, 1, 3),
  ($dbt72294$tq-dbms-sql-23-precedence-graph-5$dbt72294$, $dbt72295$pt-dbms-sql-23-precedence-graph$dbt72295$,
   $dbt72296$If a precedence graph is acyclic (a DAG) with multiple valid topological sorts, what does that mean?$dbt72296$,
   $dbt72297$["The schedule is not conflict-serializable", "More than one serial schedule is equivalent to the given schedule \u2014 any of the valid topological orders works", "The schedule must be re-executed", "Only the alphabetically-first order is valid"]$dbt72297$::jsonb,
   1, $dbt72298$A DAG can admit multiple topological sorts when it isn't a total order; each one represents an equally valid equivalent serial schedule.$dbt72298$, 1, 4),
  ($dbt72299$tq-dbms-sql-23-precedence-graph-6$dbt72299$, $dbt72300$pt-dbms-sql-23-precedence-graph$dbt72300$,
   $dbt72301$What happens to a precedence graph when two transactions share no conflicting operations at all?$dbt72301$,
   $dbt72302$["The graph is undefined", "No edge is drawn between them; if this holds for all pairs, the graph is trivially acyclic and every interleaving is conflict-serializable", "An edge is drawn in both directions by default", "The schedule is automatically non-serializable"]$dbt72302$::jsonb,
   1, $dbt72303$With zero conflicts, there is no ordering constraint between the transactions, so the graph has no edges connecting them and remains (or stays) acyclic.$dbt72303$, 1, 5),
  ($dbt72304$tq-dbms-sql-23-precedence-graph-7$dbt72304$, $dbt72305$pt-dbms-sql-23-precedence-graph$dbt72305$,
   $dbt72306$Why does the precedence graph test conflict serializability specifically, rather than view serializability?$dbt72306$,
   $dbt72307$["Because it only encodes conflict relationships and deliberately ignores non-conflicting operations like the relative order of blind writes, which is exactly what view serializability additionally permits", "Because view serializability doesn't involve transactions", "Because the precedence graph can only have 2 nodes", "Because conflict serializability doesn't use graphs at all"]$dbt72307$::jsonb,
   0, $dbt72308$The graph is built strictly from conflicting operation pairs; blind-write reordering (the source of extra view-serializable schedules) produces no conflict edges to distinguish it, so the graph can't capture that broader notion.$dbt72308$, 1, 6),
  ($dbt72309$tq-dbms-sql-23-precedence-graph-8$dbt72309$, $dbt72310$pt-dbms-sql-23-precedence-graph$dbt72310$,
   $dbt72311$Why is the precedence-graph approach preferred over manually searching for a valid sequence of swaps to test conflict serializability?$dbt72311$,
   $dbt72312$["It always gives a different answer than the swap method", "Cycle detection in a directed graph is an efficient, well-known algorithm, making it far more practical than exhaustively searching for a swap sequence", "Swaps are mathematically undefined", "It requires fewer transactions"]$dbt72312$::jsonb,
   1, $dbt72313$Both methods are provably equivalent in their verdict, but cycle detection is computationally efficient and systematic, unlike manually trying every possible reordering.$dbt72313$, 1, 7)
on conflict (id) do nothing;

-- 23.7 Recoverable Schedule
with g as (select id from public.learning_grids where lower(slug) = $dbt72314$dbms-sql-tutorial$dbt72314$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72315$chapter-23-concurrency-control$dbt72315$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72316$Recoverable Schedule$dbt72316$, $dbt72317$recoverable-schedule$dbt72317$, '', 7, 'published', true, true, $dbt72318$dbms_sql_tutorial$dbt72318$, $dbt72319$chapter-23-concurrency-control/recoverable-schedule$dbt72319$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72320$dbms_sql_tutorial$dbt72320$ and source_ref = $dbt72321$chapter-23-concurrency-control/recoverable-schedule$dbt72321$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72322$Recoverable Schedule$dbt72322$, $dbt72323$### Why This Matters Beyond Serializability

Serializability (23.4/23.5) only asks "does this schedule's *result* match some serial order?" It says nothing about what happens when a transaction **aborts**. Real transactions can and do abort — a constraint violation, a deadlock victim, an explicit `ROLLBACK`. Recoverability, cascadelessness, and strictness (this topic and the next two) form a separate hierarchy that governs how safely a schedule can handle aborts.

### Definition

A schedule is **recoverable** if, whenever a transaction Tj reads a data item previously written by transaction Ti, **Ti must commit before Tj commits**. Equivalently: no transaction is allowed to commit until every transaction it "depends on" (read dirty data from) has already committed.

### Worked Example — Recoverable (T1 commits before T2)

Using A = 1000 (T1 withdraws ₹100, T2 later reads A):
```
1. R1(A)          -> A=1000
2. A = 1000-100
3. W1(A)          -> A=900 (uncommitted)
4. R2(A)          -> T2 reads 900 (T1's uncommitted write)
5. COMMIT1        -> T1 commits
6. COMMIT2        -> T2 commits, AFTER T1 committed
```
T2 read a value written by T1 (step 4), and T1 committed (step 5) *before* T2 committed (step 6) — this satisfies recoverability. Even though T2 read T1's data before T1 committed, by the time T2 itself commits, T1's fate is already sealed (committed), so T2's commit is never "invalidated" retroactively.

### Worked Example — NOT Recoverable

Now suppose T1 **aborts** instead of committing, after T2 already committed:
```
1. W1(A)          -> A=900 (uncommitted)
2. R2(A)          -> T2 reads 900
3. COMMIT2        -> T2 commits, based on T1's uncommitted value
4. ABORT1         -> T1 rolls back; A reverts to 1000
```
T2 already committed at step 3, believing A=900 is a permanent value. When T1 aborts at step 4, the value T2's commit was based on turns out to never have existed. Because T2 has already committed, it **cannot be undone** — this makes the whole schedule **irrecoverable**. The database is now in an inconsistent, unrepairable state: T2's committed result depended on data that logically never existed.

### The Practical Consequence

An irrecoverable schedule is unacceptable in any real system — once a transaction commits, its effects must be permanent (durability), so if the value it committed on is later discovered to be phantom (because the source transaction aborted), there's no way to fix it without violating durability. This is why every serious DBMS's concurrency control (usually via locking, delaying a transaction's commit until its "dependencies" have resolved) **enforces recoverability** as a bare minimum requirement — separate from, and in addition to, enforcing serializability.

### Edge Cases

- Recoverability says nothing about *when* Tj reads Ti's data (before or after Ti's commit) — only about the relative order of their **commits**. This is what distinguishes it from the stricter cascadeless property (23.8).
- A schedule where Ti never commits at all (it eventually aborts) and Tj never reads anything Ti wrote is trivially recoverable — recoverability constraints only kick in when an actual read-from dependency exists.
- If Ti aborts before Tj ever reads its dirty data, there's no dependency to worry about — Tj simply never sees the uncommitted value.

### Key Takeaways / Interview Angle

- **Q: What specifically makes a schedule irrecoverable?** A transaction Tj commits after reading data from Ti, but Ti later aborts — Tj's already-permanent commit is now based on data that was rolled back.
- **Q: Is recoverability a stronger or weaker guarantee than serializability?** They are orthogonal/independent concerns — a schedule can be conflict-serializable yet irrecoverable, or recoverable yet not serializable; production systems must guarantee both.$dbt72323$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72324$dbms_sql_tutorial_seed$dbt72324$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72325$dbms_sql_tutorial_seed$dbt72325$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72326$dbms-sql-tutorial$dbt72326$),
     t as (select id from public.learning_topics where source_kind = $dbt72327$dbms_sql_tutorial$dbt72327$ and source_ref = $dbt72328$chapter-23-concurrency-control/recoverable-schedule$dbt72328$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72329$pt-dbms-sql-23-recoverable-schedule$dbt72329$, $dbt72330$Recoverable Schedule - Quick Test$dbt72330$, 'aptitude', 8, 8,
  $dbt72331$8 questions on Recoverable Schedule.$dbt72331$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72332$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72332$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72333$tq-dbms-sql-23-recoverable-schedule-1$dbt72333$, $dbt72334$pt-dbms-sql-23-recoverable-schedule$dbt72334$,
   $dbt72335$What is the defining condition for a schedule to be 'recoverable'?$dbt72335$,
   $dbt72336$["No transaction is ever allowed to abort", "If Tj reads a data item written by Ti, then Ti must commit before Tj commits", "All transactions must commit at the same instant", "Tj must never read any data written by Ti"]$dbt72336$::jsonb,
   1, $dbt72337$Recoverability requires that a transaction's commit never depends on the outcome of another transaction that hasn't yet committed — Ti must commit first.$dbt72337$, 1, 0),
  ($dbt72338$tq-dbms-sql-23-recoverable-schedule-2$dbt72338$, $dbt72339$pt-dbms-sql-23-recoverable-schedule$dbt72339$,
   $dbt72340$In the 'NOT Recoverable' worked example, what specifically makes the schedule irrecoverable?$dbt72340$,
   $dbt72341$["T2 read a value from T1 before T1 committed, and then T2 committed before T1's eventual abort \u2014 leaving T2's commit based on data that was rolled back", "T1 never wrote any data", "T2 aborted before T1", "Both transactions committed at the same time"]$dbt72341$::jsonb,
   0, $dbt72342$T2 committed (step 3) based on T1's uncommitted write, and T1 then aborted (step 4); since T2 already committed, it cannot be undone, even though the data it relied on turned out to be rolled back.$dbt72342$, 1, 1),
  ($dbt72343$tq-dbms-sql-23-recoverable-schedule-3$dbt72343$, $dbt72344$pt-dbms-sql-23-recoverable-schedule$dbt72344$,
   $dbt72345$Why is an irrecoverable schedule considered unacceptable in a real DBMS?$dbt72345$,
   $dbt72346$["It uses too much disk space", "Once a transaction commits, durability requires its effects to be permanent, but an irrecoverable schedule can leave a committed transaction's result based on data that never truly existed, with no way to fix it", "It always causes a deadlock", "It is slower than a recoverable schedule"]$dbt72346$::jsonb,
   1, $dbt72347$Durability guarantees a commit is permanent; if the committed value is discovered to have come from an aborted source transaction, there is no valid way to reconcile this without breaking that guarantee.$dbt72347$, 1, 2),
  ($dbt72348$tq-dbms-sql-23-recoverable-schedule-4$dbt72348$, $dbt72349$pt-dbms-sql-23-recoverable-schedule$dbt72349$,
   $dbt72350$In the 'Recoverable' worked example, T2 read T1's uncommitted write at step 4, yet the schedule is still recoverable. Why?$dbt72350$,
   $dbt72351$["Because T2 never actually committed", "Because T1 committed at step 5, BEFORE T2 committed at step 6 \u2014 satisfying the requirement that Ti commits before Tj commits", "Because T2's read happened after T1's commit", "Because recoverability doesn't care about reads at all"]$dbt72351$::jsonb,
   1, $dbt72352$Recoverability only requires the correct ORDER OF COMMITS (Ti before Tj), regardless of when the read itself happened relative to Ti's commit.$dbt72352$, 1, 3),
  ($dbt72353$tq-dbms-sql-23-recoverable-schedule-5$dbt72353$, $dbt72354$pt-dbms-sql-23-recoverable-schedule$dbt72354$,
   $dbt72355$Does recoverability restrict WHEN Tj is allowed to read data written by an uncommitted Ti?$dbt72355$,
   $dbt72356$["Yes, Tj can never read uncommitted data under a recoverable schedule", "No \u2014 recoverability only constrains the relative order of COMMITS (Ti before Tj), not when the read itself occurs", "Yes, Tj must always wait for Ti to abort", "Recoverability only applies to write operations, never reads"]$dbt72356$::jsonb,
   1, $dbt72357$Recoverability is a commit-ordering constraint; it permits Tj to read Ti's uncommitted (dirty) data, as long as Ti commits before Tj does. This is what separates it from the stricter cascadeless property.$dbt72357$, 1, 4),
  ($dbt72358$tq-dbms-sql-23-recoverable-schedule-6$dbt72358$, $dbt72359$pt-dbms-sql-23-recoverable-schedule$dbt72359$,
   $dbt72360$Is a schedule where Ti eventually aborts, and Tj never reads any data Ti wrote, automatically recoverable?$dbt72360$,
   $dbt72361$["No, any abort automatically makes a schedule irrecoverable", "Yes \u2014 recoverability constraints only apply when an actual read-from dependency exists between transactions", "Only if Tj also aborts", "Only if Ti aborts before Tj starts"]$dbt72361$::jsonb,
   1, $dbt72362$With no read-from dependency, there's nothing for recoverability to enforce — the schedule is trivially recoverable regardless of Ti's outcome.$dbt72362$, 1, 5),
  ($dbt72363$tq-dbms-sql-23-recoverable-schedule-7$dbt72363$, $dbt72364$pt-dbms-sql-23-recoverable-schedule$dbt72364$,
   $dbt72365$Is it possible for a schedule to be conflict-serializable but irrecoverable?$dbt72365$,
   $dbt72366$["No, serializability guarantees recoverability", "Yes \u2014 serializability and recoverability are independent properties; a schedule can satisfy one without the other", "No, they are the exact same concept", "Only view-serializable schedules can be irrecoverable"]$dbt72366$::jsonb,
   1, $dbt72367$Serializability is about the equivalence of the schedule's result to a serial order; recoverability is about safe handling of commits/aborts. A schedule can pass one test and fail the other.$dbt72367$, 1, 6),
  ($dbt72368$tq-dbms-sql-23-recoverable-schedule-8$dbt72368$, $dbt72369$pt-dbms-sql-23-recoverable-schedule$dbt72369$,
   $dbt72370$What mechanism do real DBMSs typically use to enforce recoverability?$dbt72370$,
   $dbt72371$["They forbid all transactions from ever reading data another transaction wrote", "Concurrency control (often via locking) delays a transaction's commit until the transactions it depends on (read dirty data from) have already committed", "They only run one transaction at a time", "They disable rollback entirely"]$dbt72371$::jsonb,
   1, $dbt72372$By holding a transaction's commit until its dependencies resolve (commit), the DBMS guarantees the recoverability ordering requirement is never violated.$dbt72372$, 1, 7)
on conflict (id) do nothing;

-- 23.8 Cascadeless Schedule
with g as (select id from public.learning_grids where lower(slug) = $dbt72373$dbms-sql-tutorial$dbt72373$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72374$chapter-23-concurrency-control$dbt72374$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72375$Cascadeless Schedule$dbt72375$, $dbt72376$cascadeless-schedule$dbt72376$, '', 8, 'published', true, true, $dbt72377$dbms_sql_tutorial$dbt72377$, $dbt72378$chapter-23-concurrency-control/cascadeless-schedule$dbt72378$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72379$dbms_sql_tutorial$dbt72379$ and source_ref = $dbt72380$chapter-23-concurrency-control/cascadeless-schedule$dbt72380$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72381$Cascadeless Schedule$dbt72381$, $dbt72382$### Motivation: What Recoverability Alone Doesn't Prevent

A schedule can be perfectly recoverable (23.7) and still cause a painful chain reaction if a transaction aborts. Consider three transactions, all reading a chain of uncommitted writes: T1 writes A (uncommitted), T2 reads T1's dirty A and writes B (uncommitted), T3 reads T2's dirty B. If T1 now aborts, T2's write was based on invalid data, so T2 must also abort — and now T3's read was based on T2's invalid data, so T3 must abort too. This chain reaction of forced rollbacks is called **cascading rollback (cascading abort)**, and while it doesn't violate recoverability by itself, it is expensive and something stronger schedules avoid entirely.

### Definition

A schedule is **cascadeless** (avoids cascading rollback) if every transaction is only allowed to **read** a data item **after** the transaction that last wrote it has already **committed** — not merely before the reader itself commits (which is all recoverability requires), but before the reader even performs the *read*. In other words: **no dirty reads are permitted at all.**

### Worked Example — Recoverable but NOT Cascadeless

```
1. W1(A)          -> A=900 (uncommitted)
2. R2(A)          -> T2 reads 900 -- BEFORE T1 has committed (a dirty read)
3. COMMIT1        -> T1 commits
4. COMMIT2        -> T2 commits, after T1 (satisfies recoverability)
```
This schedule **is recoverable** (T1 commits at step 3, before T2 commits at step 4). But it is **not cascadeless**, because T2's read at step 2 happened *before* T1's commit at step 3 — T2 performed a dirty read. If T1 had aborted instead of committing at step 3, T2 (already having read the dirty value, though not yet committed) would be forced to also abort — a cascading rollback. The schedule got lucky that T1 committed, but the *schedule structure itself* permitted the dangerous dependency.

### Worked Example — Cascadeless

```
1. W1(A)          -> A=900 (uncommitted)
2. COMMIT1        -> T1 commits FIRST
3. R2(A)          -> T2 reads 900, only AFTER T1 already committed
4. COMMIT2        -> T2 commits
```
Now T2's read (step 3) only happens after T1's commit (step 2) — there is no window in which T2 could read a value that might later be rolled back. Even if some other transaction later aborts, T2 can never be forced to cascade, because it never read anything uncommitted.

### Every Cascadeless Schedule Is Recoverable

Notice cascadelessness is strictly **stronger** than recoverability: if Tj only ever reads Ti's data after Ti commits, then trivially Ti commits before Tj even reads (let alone commits) — satisfying recoverability automatically. But the reverse doesn't hold, as the first worked example shows (recoverable, not cascadeless).

### Edge Cases

- Cascadelessness only restricts **reads**; it says nothing about two transactions **both writing** the same item before either commits (a blind-write scenario) — that additional restriction is what the even-stronger strict schedule (23.9) adds.
- A cascading rollback can, in the worst case, ripple through many transactions (T3 depends on T2 depends on T1...); cascadelessness prevents the *entire chain* by cutting it off at the very first link (no dirty reads permitted anywhere).
- Cascadelessness does not eliminate transactions waiting — T2 may simply have to *block* until T1 commits, which is exactly how lock-based protocols implement it (holding read locks until the writer's commit).

### Key Takeaways / Interview Angle

- **Q: What extra guarantee does cascadeless add over merely recoverable?** It moves the "must happen after Ti commits" requirement from Tj's *commit* (recoverable) to Tj's *read* itself (cascadeless) — eliminating dirty reads entirely, not just eventually recovering from them.
- **Q: Why do we care about cascading rollback if the schedule is already recoverable?** Recoverability only guarantees the database *can* eventually be fixed; it doesn't prevent an expensive, unpredictable chain of forced aborts across many transactions in the meantime — cascadelessness avoids the mess altogether.$dbt72382$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72383$dbms_sql_tutorial_seed$dbt72383$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72384$dbms_sql_tutorial_seed$dbt72384$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72385$dbms-sql-tutorial$dbt72385$),
     t as (select id from public.learning_topics where source_kind = $dbt72386$dbms_sql_tutorial$dbt72386$ and source_ref = $dbt72387$chapter-23-concurrency-control/cascadeless-schedule$dbt72387$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72388$pt-dbms-sql-23-cascadeless-schedule$dbt72388$, $dbt72389$Cascadeless Schedule - Quick Test$dbt72389$, 'aptitude', 8, 8,
  $dbt72390$8 questions on Cascadeless Schedule.$dbt72390$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72391$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72391$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72392$tq-dbms-sql-23-cascadeless-schedule-1$dbt72392$, $dbt72393$pt-dbms-sql-23-cascadeless-schedule$dbt72393$,
   $dbt72394$What additional problem does a merely-recoverable (but not cascadeless) schedule risk that a cascadeless schedule avoids?$dbt72394$,
   $dbt72395$["Deadlock", "Cascading rollback \u2014 a chain reaction where one transaction's abort forces other transactions (that read its dirty data) to also abort", "Data type mismatch errors", "Running out of disk space"]$dbt72395$::jsonb,
   1, $dbt72396$Recoverability only guarantees the schedule CAN eventually be reconciled; it doesn't prevent a costly chain reaction of forced rollbacks if a transaction that others read dirty data from ends up aborting.$dbt72396$, 1, 0),
  ($dbt72397$tq-dbms-sql-23-cascadeless-schedule-2$dbt72397$, $dbt72398$pt-dbms-sql-23-cascadeless-schedule$dbt72398$,
   $dbt72399$What is the precise definition of a cascadeless schedule?$dbt72399$,
   $dbt72400$["No transaction may ever abort", "A transaction may only read a data item after the transaction that last wrote it has already committed \u2014 dirty reads are never permitted", "All transactions must commit in the order they started", "Two transactions may never touch the same data item"]$dbt72400$::jsonb,
   1, $dbt72401$Cascadelessness requires the read itself (not just the reader's eventual commit) to happen only after the writer commits, eliminating dirty reads entirely.$dbt72401$, 1, 1),
  ($dbt72402$tq-dbms-sql-23-cascadeless-schedule-3$dbt72402$, $dbt72403$pt-dbms-sql-23-cascadeless-schedule$dbt72403$,
   $dbt72404$In the 'Recoverable but NOT Cascadeless' worked example, T2 reads A at step 2 before T1 commits at step 3, yet the overall schedule commits successfully. Why is this schedule still classified as NOT cascadeless?$dbt72404$,
   $dbt72405$["Because T2 eventually committed after T1", "Because the schedule's STRUCTURE permitted a dirty read (T2 read before T1's commit) \u2014 had T1 aborted instead, T2 would have been forced into a cascading rollback, regardless of what actually happened", "Because T1 never wrote anything", "Because cascadelessness only applies to writes, not reads"]$dbt72405$::jsonb,
   1, $dbt72406$Cascadelessness is about whether the schedule's structure ever ALLOWS a dirty read to occur — it did here — not about whether things happened to work out because T1 committed rather than aborted.$dbt72406$, 1, 2),
  ($dbt72407$tq-dbms-sql-23-cascadeless-schedule-4$dbt72407$, $dbt72408$pt-dbms-sql-23-cascadeless-schedule$dbt72408$,
   $dbt72409$Is every cascadeless schedule also recoverable?$dbt72409$,
   $dbt72410$["No, they are unrelated properties", "Yes \u2014 if reads only ever happen after the writer commits, the writer trivially commits before the reader even reads, let alone commits, satisfying recoverability automatically", "Only if there are exactly two transactions", "Only for read-only transactions"]$dbt72410$::jsonb,
   1, $dbt72411$Cascadelessness is strictly stronger than recoverability: enforcing 'commit before read' automatically satisfies the weaker 'commit before commit' requirement of recoverability.$dbt72411$, 1, 3),
  ($dbt72412$tq-dbms-sql-23-cascadeless-schedule-5$dbt72412$, $dbt72413$pt-dbms-sql-23-cascadeless-schedule$dbt72413$,
   $dbt72414$Is every recoverable schedule also cascadeless?$dbt72414$,
   $dbt72415$["Yes, they are equivalent definitions", "No \u2014 a schedule can be recoverable (correct commit order) while still permitting dirty reads that would trigger cascading rollback if the writer aborted", "Yes, but only for schedules with fewer than 3 transactions", "No such recoverable-but-not-cascadeless schedule can exist"]$dbt72415$::jsonb,
   1, $dbt72416$Recoverability only fixes the commit ORDER; it doesn't forbid dirty reads outright, which is exactly the gap cascadelessness closes.$dbt72416$, 1, 4),
  ($dbt72417$tq-dbms-sql-23-cascadeless-schedule-6$dbt72417$, $dbt72418$pt-dbms-sql-23-cascadeless-schedule$dbt72418$,
   $dbt72419$How do lock-based concurrency control protocols typically implement cascadelessness?$dbt72419$,
   $dbt72420$["By disallowing all locks", "By holding a transaction's read locks (or delaying its reads) on data written by another transaction until that writer has committed", "By running all transactions serially", "By allowing dirty reads but flagging them for later cleanup"]$dbt72420$::jsonb,
   1, $dbt72421$To guarantee no dirty reads occur, the DBMS makes a reader wait/block until the last writer of the data item has committed, which is exactly what cascadelessness requires structurally.$dbt72421$, 1, 5),
  ($dbt72422$tq-dbms-sql-23-cascadeless-schedule-7$dbt72422$, $dbt72423$pt-dbms-sql-23-cascadeless-schedule$dbt72423$,
   $dbt72424$What does cascadelessness explicitly NOT restrict, which the even-stronger strict schedule property (23.9) adds?$dbt72424$,
   $dbt72425$["It doesn't restrict reads at all", "It doesn't restrict two transactions both writing the same uncommitted item (a blind-write scenario) before either commits", "It doesn't allow any transaction to ever abort", "It doesn't apply to bank account examples"]$dbt72425$::jsonb,
   1, $dbt72426$Cascadelessness is purely about avoiding dirty READS; it says nothing about a second transaction overwriting an uncommitted write, which strict schedules additionally forbid.$dbt72426$, 1, 6),
  ($dbt72427$tq-dbms-sql-23-cascadeless-schedule-8$dbt72427$, $dbt72428$pt-dbms-sql-23-cascadeless-schedule$dbt72428$,
   $dbt72429$In a worst-case cascading rollback scenario where T3 reads dirty data from T2, which in turn read dirty data from T1, what happens if T1 aborts?$dbt72429$,
   $dbt72430$["Only T1 is affected", "T2 must abort (it read invalid data from T1), and T3 must also abort (it read invalid data from the now-aborted T2) \u2014 a rollback chain reaction", "T3 is unaffected because it never touched T1's data directly", "The database automatically repairs itself without any rollbacks"]$dbt72430$::jsonb,
   1, $dbt72431$Cascading rollback ripples through every transaction in the dependency chain: T1's abort invalidates T2, which invalidates T3, and so on for however long the chain of dirty reads extends.$dbt72431$, 1, 7)
on conflict (id) do nothing;

-- 23.9 Strict Schedule
with g as (select id from public.learning_grids where lower(slug) = $dbt72432$dbms-sql-tutorial$dbt72432$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72433$chapter-23-concurrency-control$dbt72433$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72434$Strict Schedule$dbt72434$, $dbt72435$strict-schedule$dbt72435$, '', 9, 'published', true, true, $dbt72436$dbms_sql_tutorial$dbt72436$, $dbt72437$chapter-23-concurrency-control/strict-schedule$dbt72437$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72438$dbms_sql_tutorial$dbt72438$ and source_ref = $dbt72439$chapter-23-concurrency-control/strict-schedule$dbt72439$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72440$Strict Schedule$dbt72440$, $dbt72441$### Definition

A schedule is **strict** if a transaction Tj is not permitted to **read or write** a data item that was written by another transaction Ti, until Ti has either **committed or aborted**. This is the strictest of the three properties in this mini-hierarchy: strict ⟹ cascadeless ⟹ recoverable (each implies the one after it, but not the reverse).

The key extra restriction beyond cascadeless: cascadelessness only cares about **reads** of dirty data; strictness also blocks **writes** to a data item another uncommitted transaction has already written (a blind-write-style conflict, "WW").

### Worked Example — Cascadeless but NOT Strict

```
1. W1(A)          -> A=900 (uncommitted)
2. W2(A)          -> T2 OVERWRITES A to, say, 950 -- BEFORE T1 has committed or aborted
3. COMMIT1
4. COMMIT2
```
There is no dirty *read* here (T2 never reads A at all — it's a blind write), so this schedule is technically cascadeless (no reader depends on unresolved data). But it is **not strict**, because T2's write at step 2 happened while T1's write to the same item was still uncommitted. This matters most for **recovery**: if the DBMS needs to `UNDO` T1 (say T1 later aborts) by restoring A's *before-image* (its value before T1 wrote it), that undo would blindly stomp on T2's write too — because the system's undo logic doesn't "know" T2 already wrote a newer value on top. Recovering from failures becomes far more delicate when writes interleave like this.

### Worked Example — Strict

```
1. W1(A)          -> A=900 (uncommitted)
2. COMMIT1        -> T1 commits (or could ABORT — either way, T1's fate is now settled)
3. W2(A)          -> T2 writes A only NOW, after T1's outcome is settled
4. COMMIT2
```
T2's write waits until T1 has fully committed (step 2) before touching A at all (step 3). If T1 had aborted instead, the DBMS would restore A to its pre-T1 value *before* T2 ever touches it — no ambiguity, no risk of stomping on someone else's uncommitted write.

### Why Strict Is What Most Real Systems Provide

Strict schedules make **recovery trivially simple**: to undo an aborted transaction, the DBMS just restores the before-image of every item it wrote, with an ironclad guarantee that no other transaction has touched that item in the meantime (since strictness blocked them from doing so until the abort/commit was resolved). This is exactly what standard **two-phase locking with exclusive locks held until commit/abort** naturally provides: a transaction that writes A takes an exclusive lock on A and holds it until it commits or aborts, so nobody else can even read or write A during that window. Because it's both the easiest property to implement correctly via locking and gives the strongest safety guarantee, strictness is the de facto standard in production relational databases.

### The Full Hierarchy

`Strict ⊂ Cascadeless ⊂ Recoverable ⊂ (all schedules)` — every strict schedule is cascadeless, every cascadeless schedule is recoverable, but the containments are all strict (proper) subsets, as the worked "X but not Y" examples across 23.7-23.9 demonstrate.

### Edge Cases

- Strictness is orthogonal to serializability, exactly like recoverability and cascadelessness — a schedule can be strict yet not conflict-serializable, or conflict-serializable yet not strict; real systems (e.g., via strict two-phase locking) aim to guarantee both simultaneously.
- "Strict" here has nothing to do with SQL's "strict mode" settings — it's a formal scheduling property, a common point of confusion for learners encountering the term for the first time.

### Key Takeaways / Interview Angle

- **Q: What's the one extra thing strict adds over cascadeless?** Blocking WRITES (not just reads) to a data item until the previous writer has committed or aborted — this closes the "blind write during someone else's uncommitted write" gap.
- **Q: Why do most production DBMSs implement strict schedules rather than merely recoverable or cascadeless ones?** Because strict schedules make crash recovery trivial (before-images can always be safely restored) and map naturally onto exclusive locks held until commit/abort — simplicity and safety together.$dbt72441$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72442$dbms_sql_tutorial_seed$dbt72442$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72443$dbms_sql_tutorial_seed$dbt72443$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72444$dbms-sql-tutorial$dbt72444$),
     t as (select id from public.learning_topics where source_kind = $dbt72445$dbms_sql_tutorial$dbt72445$ and source_ref = $dbt72446$chapter-23-concurrency-control/strict-schedule$dbt72446$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72447$pt-dbms-sql-23-strict-schedule$dbt72447$, $dbt72448$Strict Schedule - Quick Test$dbt72448$, 'aptitude', 8, 8,
  $dbt72449$8 questions on Strict Schedule.$dbt72449$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72450$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72450$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72451$tq-dbms-sql-23-strict-schedule-1$dbt72451$, $dbt72452$pt-dbms-sql-23-strict-schedule$dbt72452$,
   $dbt72453$What is the defining rule of a strict schedule?$dbt72453$,
   $dbt72454$["No transaction may ever write the same item twice", "A transaction may not read OR write a data item written by another transaction until that other transaction has committed or aborted", "All transactions must be read-only", "Every schedule must be serial"]$dbt72454$::jsonb,
   1, $dbt72455$Strictness extends cascadelessness's read restriction to also cover writes: nobody may touch an item another uncommitted transaction wrote, until that transaction resolves (commits or aborts).$dbt72455$, 1, 0),
  ($dbt72456$tq-dbms-sql-23-strict-schedule-2$dbt72456$, $dbt72457$pt-dbms-sql-23-strict-schedule$dbt72457$,
   $dbt72458$In the 'Cascadeless but NOT Strict' worked example, why is that schedule considered cascadeless despite T2 writing A before T1 commits?$dbt72458$,
   $dbt72459$["Because T2 never actually writes A", "Because T2's operation is a blind write (no read), so there is no dirty READ for another transaction to depend on \u2014 cascadelessness only restricts reads, not writes", "Because T1 commits immediately after", "Because cascadelessness doesn't apply to numeric data"]$dbt72459$::jsonb,
   1, $dbt72460$Cascadelessness is purely about preventing dirty reads; since T2 never reads A, there's no read-based dependency chain, so the schedule passes the cascadeless test even though it fails the stricter write-based test.$dbt72460$, 1, 1),
  ($dbt72461$tq-dbms-sql-23-strict-schedule-3$dbt72461$, $dbt72462$pt-dbms-sql-23-strict-schedule$dbt72462$,
   $dbt72463$Why does the WW (write-write) interleaving in the 'Cascadeless but NOT Strict' example create a problem specifically for crash recovery?$dbt72463$,
   $dbt72464$["It doesn't cause any real problem", "If T1 later aborts and the DBMS restores A's before-image to undo T1's write, that undo would also stomp on T2's already-applied write, since the undo logic can't distinguish that a newer write happened on top", "It causes a syntax error", "It only matters if T2 also aborts"]$dbt72464$::jsonb,
   1, $dbt72465$Standard undo-by-before-image recovery assumes no other transaction has touched the item since the write being undone; a WW conflict before commit/abort breaks that assumption.$dbt72465$, 1, 2),
  ($dbt72466$tq-dbms-sql-23-strict-schedule-4$dbt72466$, $dbt72467$pt-dbms-sql-23-strict-schedule$dbt72467$,
   $dbt72468$What is the correct ordering of strictness among the three properties in this mini-hierarchy?$dbt72468$,
   $dbt72469$["Recoverable is strictest, then cascadeless, then strict", "Strict implies cascadeless, and cascadeless implies recoverable (strict is the strongest guarantee, recoverable the weakest)", "All three properties are exactly equivalent", "Cascadeless is strictest, then strict, then recoverable"]$dbt72469$::jsonb,
   1, $dbt72470$The hierarchy is Strict ⊂ Cascadeless ⊂ Recoverable — every strict schedule is cascadeless, and every cascadeless schedule is recoverable, but not vice versa.$dbt72470$, 1, 3),
  ($dbt72471$tq-dbms-sql-23-strict-schedule-5$dbt72471$, $dbt72472$pt-dbms-sql-23-strict-schedule$dbt72472$,
   $dbt72473$Which real-world locking technique naturally produces strict schedules?$dbt72473$,
   $dbt72474$["Shared locks released immediately after a read", "Exclusive locks on written items held until the transaction commits or aborts (as in strict two-phase locking)", "No locking at all", "Locks that expire after a fixed timer, regardless of commit status"]$dbt72474$::jsonb,
   1, $dbt72475$Holding an exclusive lock on a written item until commit/abort ensures no other transaction can read or write that item in the meantime, which is exactly the strict schedule guarantee.$dbt72475$, 1, 4),
  ($dbt72476$tq-dbms-sql-23-strict-schedule-6$dbt72476$, $dbt72477$pt-dbms-sql-23-strict-schedule$dbt72477$,
   $dbt72478$Why do most production relational databases implement strict schedules rather than settling for merely cascadeless or recoverable ones?$dbt72478$,
   $dbt72479$["Strict schedules run faster in every case", "Strict schedules make crash recovery simple and safe (before-images can always be restored without risk) and map naturally onto standard exclusive locking", "Strict schedules eliminate the need for a precedence graph", "Cascadeless and recoverable schedules are illegal under the SQL standard"]$dbt72479$::jsonb,
   1, $dbt72480$The combination of recovery simplicity and a natural fit with exclusive-lock-until-commit locking makes strict schedules the practical default, even though weaker properties would technically also prevent inconsistency.$dbt72480$, 1, 5),
  ($dbt72481$tq-dbms-sql-23-strict-schedule-7$dbt72481$, $dbt72482$pt-dbms-sql-23-strict-schedule$dbt72482$,
   $dbt72483$Is strictness related to whether a schedule is conflict-serializable?$dbt72483$,
   $dbt72484$["Strictness guarantees conflict serializability automatically", "They are orthogonal/independent properties \u2014 a schedule can be strict but not conflict-serializable, or conflict-serializable but not strict; real systems aim to guarantee both", "Conflict serializability guarantees strictness automatically", "They are the exact same property under different names"]$dbt72484$::jsonb,
   1, $dbt72485$Serializability concerns the equivalence of results to a serial order; strictness concerns safe handling of commits/aborts for recovery — the two are independent axes a schedule can satisfy or fail separately.$dbt72485$, 1, 6),
  ($dbt72486$tq-dbms-sql-23-strict-schedule-8$dbt72486$, $dbt72487$pt-dbms-sql-23-strict-schedule$dbt72487$,
   $dbt72488$What does the term 'strict' refer to in 'strict schedule'?$dbt72488$,
   $dbt72489$["A SQL engine configuration setting like strict mode for data types", "A formal scheduling property about blocking reads and writes to data written by an uncommitted transaction until it resolves", "A requirement that the schedule be serial", "A rule that transactions must strictly alternate operations one at a time"]$dbt72489$::jsonb,
   1, $dbt72490$This is a common point of confusion — 'strict' here is unrelated to SQL strict mode; it's purely a concurrency-control scheduling property.$dbt72490$, 1, 7)
on conflict (id) do nothing;

-- 23.10 Lost Update
with g as (select id from public.learning_grids where lower(slug) = $dbt72491$dbms-sql-tutorial$dbt72491$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72492$chapter-23-concurrency-control$dbt72492$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72493$Lost Update$dbt72493$, $dbt72494$lost-update$dbt72494$, '', 10, 'published', true, true, $dbt72495$dbms_sql_tutorial$dbt72495$, $dbt72496$chapter-23-concurrency-control/lost-update$dbt72496$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72497$dbms_sql_tutorial$dbt72497$ and source_ref = $dbt72498$chapter-23-concurrency-control/lost-update$dbt72498$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72499$Lost Update$dbt72499$, $dbt72500$### What It Is

A **lost update** happens when two transactions both read the same data item, both compute a new value based on that (now possibly stale) read, and both write back their result — with the second write silently **overwriting and erasing** the effect of the first, as if the first transaction's update never happened at all. No error is raised; the database simply ends up with a wrong final value.

### Concrete Example — Bank Balance

Account `A` starts at **₹1000**. T1 withdraws ₹100. T2 deposits ₹500. Run correctly (serially, in either order), the final balance should be **₹1400** (1000 − 100 + 500). Now interleave them:

```
Time  Operation                          A's value / effect
1     R1(A)                              T1 reads A = 1000
2     R2(A)                              T2 reads A = 1000  (before T1 writes anything!)
3     T1 computes: A_new = 1000-100=900
4     W1(A)                              A is now written to 900
5     T2 computes: A_new = 1000+500=1500  <- based on T2's STALE read from step 2
6     W2(A)                              A is now written to 1500, OVERWRITING T1's 900
7     COMMIT1
8     COMMIT2
```
**Final A = 1500**, not the correct 1400. T1's ₹100 withdrawal was completely erased — as far as the database is concerned, it's as if T1 never ran at all, even though T1 committed successfully. This is the lost update: T2 read A *before* T1's write landed, computed its result from that stale value, and its write blindly clobbered T1's update.

### Why This Slips Past Naive Checks

Both T1 and T2 individually did everything "correctly" — each read A, computed a valid new value, wrote it back, and committed without error. The bug is entirely in the *interleaving*: neither transaction was aware the other had also read (and was about to write) the same item. No constraint violation, no exception — just a silently wrong final balance that could easily go unnoticed until an audit reveals ₹100 unaccounted for.

### How It's Prevented

Lost updates are prevented by ensuring T2's read-then-write on A cannot be interrupted by another transaction's write in between — i.e., by making the read+write into A an atomic unit with respect to other transactions. Locking protocols achieve this by having T1 hold an exclusive (write) lock on A from its first touch until commit, forcing T2's read to block until T1 finishes (and vice versa) — this is exactly the concurrency control problem introduced in 23.1, and lost update is one of the concrete anomalies serializability (and stricter locking) protects against.

### Edge Cases

- A lost update can also occur between two writes with **no intervening read** by the second transaction (a "blind write" scenario) — e.g., two `UPDATE stock SET qty = 50` statements from two different sessions, where the second simply overwrites the first's target value regardless of the current row state; this is arguably an even more silent variant.
- Lost update is a genuine **serializability violation** — the precedence graph for the schedule above would show a cycle (T2's read precedes T1's write giving one edge, T1's read precedes T2's write giving the opposite edge), confirming it is not conflict-serializable.
- This is different from a **dirty read** (23.11) — here, both T1's and T2's writes are eventually committed; the issue is that T2's write silently overwrites T1's, not that T2 read something that got rolled back.

### Key Takeaways / Interview Angle

- **Q: What is the root cause of a lost update?** Two transactions performing a "read, compute, write" cycle on the same item concurrently, where the second transaction's read happens before the first transaction's write, so the second write is based on stale data and destroys the first update.
- **Q: How would you explain lost update to a non-technical stakeholder?** "Two people updated the same account balance at almost the same time; whichever save happened last won, and the other person's change silently vanished — even though both operations reported success."$dbt72500$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72501$dbms_sql_tutorial_seed$dbt72501$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72502$dbms_sql_tutorial_seed$dbt72502$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72503$dbms-sql-tutorial$dbt72503$),
     t as (select id from public.learning_topics where source_kind = $dbt72504$dbms_sql_tutorial$dbt72504$ and source_ref = $dbt72505$chapter-23-concurrency-control/lost-update$dbt72505$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72506$pt-dbms-sql-23-lost-update$dbt72506$, $dbt72507$Lost Update - Quick Test$dbt72507$, 'aptitude', 8, 8,
  $dbt72508$8 questions on Lost Update.$dbt72508$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72509$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72509$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72510$tq-dbms-sql-23-lost-update-1$dbt72510$, $dbt72511$pt-dbms-sql-23-lost-update$dbt72511$,
   $dbt72512$In the worked lost-update example, what is the correct final balance of A if T1's withdrawal and T2's deposit both apply, run in either serial order?$dbt72512$,
   $dbt72513$["1000", "1500", "1400", "900"]$dbt72513$::jsonb,
   2, $dbt72514$1000 - 100 (T1's withdrawal) + 500 (T2's deposit) = 1400, regardless of which order the two operations are applied in serially.$dbt72514$, 1, 0),
  ($dbt72515$tq-dbms-sql-23-lost-update-2$dbt72515$, $dbt72516$pt-dbms-sql-23-lost-update$dbt72516$,
   $dbt72517$In the interleaved schedule shown, why does T1's withdrawal end up 'lost'?$dbt72517$,
   $dbt72518$["T1 never actually committed", "T2 read A's stale value (1000) before T1's write landed, so T2 computed 1500 from the stale value and its write overwrote T1's 900", "T1's write caused a constraint violation", "The database automatically reverted T1's change"]$dbt72518$::jsonb,
   1, $dbt72519$T2's read at step 2 happened before T1's write at step 4, so T2's subsequent write is based on outdated data and blindly overwrites T1's already-applied change.$dbt72519$, 1, 1),
  ($dbt72520$tq-dbms-sql-23-lost-update-3$dbt72520$, $dbt72521$pt-dbms-sql-23-lost-update$dbt72521$,
   $dbt72522$Does a lost update raise any error or exception in the database?$dbt72522$,
   $dbt72523$["Yes, it always triggers a constraint violation", "No \u2014 both transactions complete and commit successfully; the database ends up with a silently wrong final value with no error raised", "Yes, it always causes a deadlock", "Only if the isolation level is set to SERIALIZABLE"]$dbt72523$::jsonb,
   1, $dbt72524$This is what makes lost update dangerous — nothing fails visibly; the anomaly is purely in the silently incorrect final data value.$dbt72524$, 1, 2),
  ($dbt72525$tq-dbms-sql-23-lost-update-4$dbt72525$, $dbt72526$pt-dbms-sql-23-lost-update$dbt72526$,
   $dbt72527$What is the fundamental pattern that causes a lost update?$dbt72527$,
   $dbt72528$["A transaction reads a value, and another transaction later reads the same original (stale) value and writes back a result computed from it, overwriting the first transaction's write", "A transaction commits before another transaction starts", "Two transactions read the same value but neither ever writes", "A transaction rolls back after writing"]$dbt72528$::jsonb,
   0, $dbt72529$The classic read-compute-write race: both transactions base their computed write on the same original read, so the later write erases the earlier one's effect.$dbt72529$, 1, 3),
  ($dbt72530$tq-dbms-sql-23-lost-update-5$dbt72530$, $dbt72531$pt-dbms-sql-23-lost-update$dbt72531$,
   $dbt72532$How does locking (e.g., holding an exclusive lock on A from first touch until commit) prevent lost updates?$dbt72532$,
   $dbt72533$["It prevents any transaction from ever reading A", "It forces a competing transaction's read (and thus its whole read-compute-write cycle) to block until the lock holder commits, so the second transaction always reads the FIRST transaction's already-applied result rather than a stale value", "It automatically merges both transactions' updates", "It converts the schedule into a non-serial schedule"]$dbt72533$::jsonb,
   1, $dbt72534$By making T1's entire read-write sequence atomic with respect to others, T2 is forced to wait, so its eventual read reflects T1's committed change rather than the stale pre-update value.$dbt72534$, 1, 4),
  ($dbt72535$tq-dbms-sql-23-lost-update-6$dbt72535$, $dbt72536$pt-dbms-sql-23-lost-update$dbt72536$,
   $dbt72537$What does the precedence graph of the interleaved lost-update schedule reveal?$dbt72537$,
   $dbt72538$["It has no edges at all", "It contains a cycle \u2014 T2's read precedes T1's write (one edge) while T1's read precedes T2's write (the opposite edge) \u2014 confirming the schedule is not conflict-serializable", "It proves the schedule is conflict-serializable", "Precedence graphs cannot be built for lost-update schedules"]$dbt72538$::jsonb,
   1, $dbt72539$The conflicting read/write pairs impose contradictory orderings between T1 and T2, producing a 2-node cycle — exactly the signature of a non-conflict-serializable (and here, incorrect) schedule.$dbt72539$, 1, 5),
  ($dbt72540$tq-dbms-sql-23-lost-update-7$dbt72540$, $dbt72541$pt-dbms-sql-23-lost-update$dbt72541$,
   $dbt72542$How does a lost update differ from a dirty read?$dbt72542$,
   $dbt72543$["They are the same phenomenon", "In a lost update, both transactions' writes are eventually committed, but the second silently overwrites the first's effect; a dirty read involves reading a value from a transaction that has NOT yet committed (and may later abort)", "A lost update always involves an abort, but a dirty read never does", "A dirty read only happens with SELECT statements, lost update only with UPDATE"]$dbt72543$::jsonb,
   1, $dbt72544$Lost update is about two committed writes racing (the second erasing the first's effect); dirty read is about reading uncommitted data that might later be rolled back — different mechanisms entirely.$dbt72544$, 1, 6),
  ($dbt72545$tq-dbms-sql-23-lost-update-8$dbt72545$, $dbt72546$pt-dbms-sql-23-lost-update$dbt72546$,
   $dbt72547$Which scenario is a 'blind write' variant of lost update?$dbt72547$,
   $dbt72548$["Two sessions both run UPDATE stock SET qty = 50 without reading the current value first, so the second UPDATE simply overwrites the first's result regardless of the row's actual state", "A transaction that only ever reads data, never writes", "A transaction that commits immediately after starting", "A transaction that reads the same value twice"]$dbt72548$::jsonb,
   0, $dbt72549$Even without an explicit prior read, two competing blind writes to the same item produce the same 'last write wins, earlier write silently vanishes' effect as the classic read-compute-write lost update.$dbt72549$, 1, 7)
on conflict (id) do nothing;

-- 23.11 Dirty Read
with g as (select id from public.learning_grids where lower(slug) = $dbt72550$dbms-sql-tutorial$dbt72550$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72551$chapter-23-concurrency-control$dbt72551$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72552$Dirty Read$dbt72552$, $dbt72553$dirty-read$dbt72553$, '', 11, 'published', true, true, $dbt72554$dbms_sql_tutorial$dbt72554$, $dbt72555$chapter-23-concurrency-control/dirty-read$dbt72555$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72556$dbms_sql_tutorial$dbt72556$ and source_ref = $dbt72557$chapter-23-concurrency-control/dirty-read$dbt72557$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72558$Dirty Read$dbt72558$, $dbt72559$### What It Is

A **dirty read** (also called an "uncommitted dependency" or "reading uncommitted data") occurs when a transaction Tj reads a value that another transaction Ti has written but **not yet committed**. If Ti subsequently **rolls back (aborts)**, the value Tj read never actually became a permanent part of the database — Tj based its logic on data that, from the database's final point of view, never truly existed.

### Concrete Example — Bank Balance

Account `A` starts at **₹1000**. T1 attempts a withdrawal of ₹100 but will end up aborting (say, a later step in T1 fails a business-rule check). T2 reads A in the middle of T1's uncommitted work.

```
Time  Operation                Effect
1     R1(A)                    T1 reads A = 1000
2     A = 1000 - 100
3     W1(A)                    A is now 900 -- UNCOMMITTED
4     R2(A)                    T2 reads A = 900  <- a DIRTY READ (T1 hasn't committed)
5     T2 uses 900 to compute, say, a loan-eligibility check, and COMMITs its own result
6     ABORT1 / ROLLBACK1       T1 rolls back; A reverts to 1000
```
At step 6, the database restores A to 1000 — the ₹100 withdrawal never really happened. But T2 already read and acted on (and committed based on) the value 900 at step 4-5. T2's decision was made using a number that, in the database's final consistent history, **never existed**. If T2's action was something irreversible (e.g., approving a loan, sending a notification, writing an audit log entry), that side effect cannot be undone even though the data it was based on has vanished.

### Why It's Dangerous

Unlike a lost update (where at least the final committed values are self-consistent, just wrong), a dirty read can corrupt a transaction's *decision-making* with a value that is later proven to have never been real. The reading transaction (T2) has no way of knowing, at the time it reads, whether the writer (T1) will ultimately commit or abort — it's the concurrency control's job to prevent it from being exposed to that uncertainty at all.

### How It's Prevented

A **cascadeless schedule** (23.8) is defined exactly to rule this out: it requires that a transaction may only read a data item after the writer has already committed. In practice, this is enforced by the reader taking a (shared) lock request on A that is blocked until T1's exclusive lock on A is released at commit/abort — under strict two-phase locking, this happens automatically, since T1 holds its write lock until it commits or aborts.

### Edge Cases

- If T1 aborts *before* T2 ever reads A, there is no dirty read — T2 would simply see the restored, pre-T1 value (or block until it's available, depending on locking).
- A dirty read is different from a **lost update** (23.10): in a lost update, both transactions' writes are ultimately *committed*, and the issue is the second silently overwriting the first; in a dirty read, the issue is a transaction observing data from a write that is *never committed at all*.
- Some systems deliberately allow dirty reads under a weak isolation level (`READ UNCOMMITTED`) for performance-critical, tolerance-of-imprecision use cases (e.g., an approximate row-count estimate) — this anomaly is precisely what Chapter 25 (Isolation Levels) formalizes as the first anomaly each isolation level either does or doesn't prevent.

### Key Takeaways / Interview Angle

- **Q: What is the single condition that defines a dirty read?** A transaction reads a value written by another transaction that has not yet committed (and might still abort).
- **Q: How is a dirty read prevented at the schedule level?** By enforcing cascadelessness — never letting a read happen until the last writer of that item has committed.
- **Q: Why is this topic a setup for Chapter 25?** Isolation levels are literally *defined* by which of dirty read, non-repeatable read (23.12), and phantom read (23.13) they prevent — dirty read is the most severe of the three and is the first one every isolation level above the weakest is designed to eliminate.$dbt72559$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72560$dbms_sql_tutorial_seed$dbt72560$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72561$dbms_sql_tutorial_seed$dbt72561$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72562$dbms-sql-tutorial$dbt72562$),
     t as (select id from public.learning_topics where source_kind = $dbt72563$dbms_sql_tutorial$dbt72563$ and source_ref = $dbt72564$chapter-23-concurrency-control/dirty-read$dbt72564$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72565$pt-dbms-sql-23-dirty-read$dbt72565$, $dbt72566$Dirty Read - Quick Test$dbt72566$, 'aptitude', 8, 8,
  $dbt72567$8 questions on Dirty Read.$dbt72567$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72568$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72568$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72569$tq-dbms-sql-23-dirty-read-1$dbt72569$, $dbt72570$pt-dbms-sql-23-dirty-read$dbt72570$,
   $dbt72571$What is the defining condition of a dirty read?$dbt72571$,
   $dbt72572$["A transaction reads a value that was written by another transaction which has not yet committed", "A transaction reads the same value twice and gets different results", "A transaction reads a row that doesn't exist yet", "A transaction fails to read any data at all"]$dbt72572$::jsonb,
   0, $dbt72573$A dirty read is specifically about reading uncommitted (possibly-to-be-rolled-back) data from another in-progress transaction.$dbt72573$, 1, 0),
  ($dbt72574$tq-dbms-sql-23-dirty-read-2$dbt72574$, $dbt72575$pt-dbms-sql-23-dirty-read$dbt72575$,
   $dbt72576$In the worked example, why is T2's read of A=900 at step 4 problematic?$dbt72576$,
   $dbt72577$["Because 900 is a negative number", "Because T1 had not yet committed its write of 900 at that point, and T1 later aborts, meaning A never actually settled at 900 in the database's committed history", "Because T2 read the value twice", "Because T2's transaction ID is higher than T1's"]$dbt72577$::jsonb,
   1, $dbt72578$T1's write was still uncommitted when T2 read it; T1's subsequent abort means the value T2 based its logic on never became a real, permanent database fact.$dbt72578$, 1, 1),
  ($dbt72579$tq-dbms-sql-23-dirty-read-3$dbt72579$, $dbt72580$pt-dbms-sql-23-dirty-read$dbt72580$,
   $dbt72581$What makes a dirty read potentially more dangerous than a lost update?$dbt72581$,
   $dbt72582$["It always causes the database server to crash", "A dirty read can corrupt a transaction's DECISION-MAKING (e.g., an irreversible side effect like approving a loan) based on data that turns out to have never been committed, whereas a lost update at least leaves self-consistent (if wrong) committed values", "It is impossible to prevent", "It only affects read-only transactions"]$dbt72582$::jsonb,
   1, $dbt72583$In a lost update both writes are committed (just one overwrites the other); in a dirty read, the reading transaction may act irreversibly on data that is later proven to have never existed in the database's history.$dbt72583$, 1, 2),
  ($dbt72584$tq-dbms-sql-23-dirty-read-4$dbt72584$, $dbt72585$pt-dbms-sql-23-dirty-read$dbt72585$,
   $dbt72586$Which schedule property, if enforced, directly rules out dirty reads?$dbt72586$,
   $dbt72587$["Seriality", "Cascadelessness \u2014 requiring a transaction to only read data after its writer has already committed", "View serializability", "Conflict serializability alone, with no other property needed"]$dbt72587$::jsonb,
   1, $dbt72588$Cascadelessness (23.8) is defined precisely to forbid reading data from an uncommitted writer, which is exactly what prevents dirty reads.$dbt72588$, 1, 3),
  ($dbt72589$tq-dbms-sql-23-dirty-read-5$dbt72589$, $dbt72590$pt-dbms-sql-23-dirty-read$dbt72590$,
   $dbt72591$If T1 aborts BEFORE T2 ever attempts to read A, does a dirty read occur?$dbt72591$,
   $dbt72592$["Yes, aborts always cause dirty reads", "No \u2014 T2 would simply see the restored pre-T1 value (or block, depending on locking); there is no dirty read since T2 never read the uncommitted value", "Only if T2 also aborts", "Only under READ UNCOMMITTED isolation"]$dbt72592$::jsonb,
   1, $dbt72593$A dirty read requires the reader to actually observe an uncommitted value; if the writer aborts before that read occurs, there's nothing dirty for the reader to see.$dbt72593$, 1, 4),
  ($dbt72594$tq-dbms-sql-23-dirty-read-6$dbt72594$, $dbt72595$pt-dbms-sql-23-dirty-read$dbt72595$,
   $dbt72596$How does a dirty read differ from a lost update?$dbt72596$,
   $dbt72597$["They are identical phenomena", "In a dirty read, the value read comes from a transaction that never actually commits (it aborts); in a lost update, both transactions' writes ARE committed, but the second overwrites/erases the first's effect", "A dirty read only happens with DELETE statements", "A lost update always involves three or more transactions"]$dbt72597$::jsonb,
   1, $dbt72598$The mechanisms are distinct: dirty read = observing data from an eventually-aborted write; lost update = a committed write being silently clobbered by another committed write.$dbt72598$, 1, 5),
  ($dbt72599$tq-dbms-sql-23-dirty-read-7$dbt72599$, $dbt72600$pt-dbms-sql-23-dirty-read$dbt72600$,
   $dbt72601$How is strict two-phase locking able to prevent dirty reads automatically?$dbt72601$,
   $dbt72602$["It disallows all read operations", "T1 holds its exclusive write lock on A until it commits or aborts, so T2's read request on A is blocked until that lock is released, ensuring T2 never sees the uncommitted value", "It uses timestamps instead of locks", "It only applies to write operations, not reads"]$dbt72602$::jsonb,
   1, $dbt72603$Because the writer's exclusive lock isn't released until commit/abort, any reader requesting access to that same item is forced to wait, so it can never observe the dirty (uncommitted) value.$dbt72603$, 1, 6),
  ($dbt72604$tq-dbms-sql-23-dirty-read-8$dbt72604$, $dbt72605$pt-dbms-sql-23-dirty-read$dbt72605$,
   $dbt72606$Which isolation level (covered in the next chapter) is specifically associated with deliberately PERMITTING dirty reads for performance reasons?$dbt72606$,
   $dbt72607$["SERIALIZABLE", "READ UNCOMMITTED", "REPEATABLE READ", "READ COMMITTED"]$dbt72607$::jsonb,
   1, $dbt72608$READ UNCOMMITTED is the weakest isolation level and is the only one that allows a transaction to see another transaction's uncommitted (dirty) writes, trading correctness for performance.$dbt72608$, 1, 7)
on conflict (id) do nothing;

-- 23.12 Non Repeatable Read
with g as (select id from public.learning_grids where lower(slug) = $dbt72609$dbms-sql-tutorial$dbt72609$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72610$chapter-23-concurrency-control$dbt72610$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72611$Non Repeatable Read$dbt72611$, $dbt72612$non-repeatable-read$dbt72612$, '', 12, 'published', true, true, $dbt72613$dbms_sql_tutorial$dbt72613$, $dbt72614$chapter-23-concurrency-control/non-repeatable-read$dbt72614$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72615$dbms_sql_tutorial$dbt72615$ and source_ref = $dbt72616$chapter-23-concurrency-control/non-repeatable-read$dbt72616$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72617$Non Repeatable Read$dbt72617$, $dbt72618$### What It Is

A **non-repeatable read** occurs when a transaction reads the **same data item twice** within its own lifetime, and gets **two different values**, because another transaction **committed** a change to that item in between the two reads. Crucially — unlike a dirty read — the value seen the second time came from a transaction that *did* commit; there's nothing "dirty" about either read individually. The problem is purely that T1's own view of the data changed mid-transaction, which it never expects if it's supposed to be looking at one consistent snapshot.

### Concrete Example — Bank Balance

Account `A` starts at **₹1000**. T1 is a long-running transaction that reads A twice (e.g., to compare a value before and after some other check). T2 deposits ₹500 and commits in between T1's two reads.

```
Time  Operation             Effect
1     R1(A)                 T1 reads A = 1000   (first read)
2     R2(A)                 T2 reads A = 1000
3     A = 1000 + 500
4     W2(A)                 A is now 1500
5     COMMIT2               T2 commits -- this is a real, permanent, committed change
6     R1(A)                 T1 reads A = 1500 AGAIN, within the SAME transaction   (second read)
```
T1 read A as **1000** at step 1 and as **1500** at step 6 — two different values for the same item, in the same transaction, with no write to A by T1 itself in between. From T1's point of view, the ground shifted under it mid-transaction, even though nothing "wrong" happened at the database level — T2's update was perfectly legitimate and committed.

### Why It's Not a Dirty Read

This is a common point of confusion. In a dirty read, T2 would be reading data from T1 *before* T1 committed (or vice versa) — the danger is the source transaction *might* abort. Here, T2's write and commit happened cleanly and completely *between* T1's two reads; T1 never saw an uncommitted value. The anomaly is entirely about **T1's own two reads disagreeing with each other**, not about anyone reading data that could later vanish.

### Why It Can Still Be a Problem

A transaction that reads the same value twice usually does so because it assumes that value is stable for the duration of its own logic (e.g., "check the balance, do some computation, check the balance again to confirm nothing else changed before finalizing"). If the value can silently shift between those two checks due to another committed transaction, T1's internal logic — built on an assumption of a stable snapshot — can produce an inconsistent or incorrect result, even though every individual read/write/commit involved was itself perfectly valid.

### How It's Prevented

Non-repeatable reads are prevented by an isolation level that holds **read locks** on a data item for the *entire* duration of the reading transaction (not released immediately after each read), so no other transaction can write to (and commit a change to) that item until the reader finishes. This is a stronger guarantee than merely avoiding dirty reads — Chapter 25 formalizes this as the `REPEATABLE READ` isolation level and above.

### Edge Cases

- If T1 only reads A **once** in its lifetime, non-repeatable read cannot occur by definition — it specifically requires **two reads of the same item** within one transaction.
- Non-repeatable read is about an **existing row's value changing**; it is explicitly distinct from a **phantom read** (23.13), where the *set of rows* matching a query condition changes because of a new row being inserted (or an old one removed) — not because an existing row's value was updated.

### Key Takeaways / Interview Angle

- **Q: What are the two hallmarks of a non-repeatable read?** (1) The same transaction reads the same data item twice, and (2) another transaction's *committed* write lands in between the two reads, causing the values to differ.
- **Q: How do you distinguish dirty read from non-repeatable read in an interview?** Dirty read = reading a value from an *uncommitted* transaction (danger: it might abort). Non-repeatable read = reading a value that changed because of a *committed* transaction, observed via two reads within one transaction.$dbt72618$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72619$dbms_sql_tutorial_seed$dbt72619$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72620$dbms_sql_tutorial_seed$dbt72620$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72621$dbms-sql-tutorial$dbt72621$),
     t as (select id from public.learning_topics where source_kind = $dbt72622$dbms_sql_tutorial$dbt72622$ and source_ref = $dbt72623$chapter-23-concurrency-control/non-repeatable-read$dbt72623$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72624$pt-dbms-sql-23-non-repeatable-read$dbt72624$, $dbt72625$Non Repeatable Read - Quick Test$dbt72625$, 'aptitude', 8, 8,
  $dbt72626$8 questions on Non Repeatable Read.$dbt72626$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72627$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72627$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72628$tq-dbms-sql-23-non-repeatable-read-1$dbt72628$, $dbt72629$pt-dbms-sql-23-non-repeatable-read$dbt72629$,
   $dbt72630$What is the defining condition of a non-repeatable read?$dbt72630$,
   $dbt72631$["A transaction reads uncommitted data from another transaction", "A transaction reads the same data item twice within its own lifetime and gets two different values, because another transaction committed a change to that item in between", "A transaction inserts a duplicate row", "A transaction reads a row that was deleted"]$dbt72631$::jsonb,
   1, $dbt72632$Non-repeatable read specifically requires two reads of the SAME item within one transaction returning different values due to an intervening committed change from another transaction.$dbt72632$, 1, 0),
  ($dbt72633$tq-dbms-sql-23-non-repeatable-read-2$dbt72633$, $dbt72634$pt-dbms-sql-23-non-repeatable-read$dbt72634$,
   $dbt72635$In the worked example, what two values does T1 read for A across its two reads, and why do they differ?$dbt72635$,
   $dbt72636$["1000 both times, because T2 didn't affect T1", "1000 then 1500, because T2 deposited 500 and COMMITTED in between T1's two reads", "1500 then 1000, because T1's own write reduced the balance", "0 then 1000, because T1's first read failed"]$dbt72636$::jsonb,
   1, $dbt72637$T1 first reads 1000, then T2 deposits 500 and commits, and T1's second read sees the new, committed value 1500 — two different values for the same item within one transaction.$dbt72637$, 1, 1),
  ($dbt72638$tq-dbms-sql-23-non-repeatable-read-3$dbt72638$, $dbt72639$pt-dbms-sql-23-non-repeatable-read$dbt72639$,
   $dbt72640$Why is the example in this topic NOT classified as a dirty read?$dbt72640$,
   $dbt72641$["Because T1 never actually commits", "Because T2's write to A was fully committed BEFORE T1's second read \u2014 T1 never observed an uncommitted (dirty) value at any point", "Because dirty reads only apply to DELETE statements", "Because T1 only read A once"]$dbt72641$::jsonb,
   1, $dbt72642$The key distinguishing fact is that T2 committed cleanly before T1's second read; T1 never saw data that might later be rolled back, which is what would make it a dirty read.$dbt72642$, 1, 2),
  ($dbt72643$tq-dbms-sql-23-non-repeatable-read-4$dbt72643$, $dbt72644$pt-dbms-sql-23-non-repeatable-read$dbt72644$,
   $dbt72645$Can a non-repeatable read occur if a transaction reads a given data item only ONCE during its lifetime?$dbt72645$,
   $dbt72646$["Yes, a single read is enough to trigger it", "No \u2014 by definition, non-repeatable read requires the SAME transaction to read the same item at least twice, with the values differing between reads", "Yes, if the item was inserted after the transaction started", "Only if the transaction is read-only"]$dbt72646$::jsonb,
   1, $dbt72647$The anomaly is inherently about disagreement BETWEEN two reads of the same item in one transaction; with only one read, there is nothing to compare, so it cannot occur.$dbt72647$, 1, 3),
  ($dbt72648$tq-dbms-sql-23-non-repeatable-read-5$dbt72648$, $dbt72649$pt-dbms-sql-23-non-repeatable-read$dbt72649$,
   $dbt72650$What isolation-level mechanism prevents non-repeatable reads?$dbt72650$,
   $dbt72651$["Disallowing all write operations globally", "Holding read locks on a data item for the ENTIRE duration of the reading transaction, so no other transaction can commit a change to it until the reader finishes", "Allowing dirty reads to compensate", "Running every transaction serially with no exceptions"]$dbt72651$::jsonb,
   1, $dbt72652$By holding the read lock beyond the individual read statement and through the whole transaction, other transactions are blocked from writing/committing changes to that item until the reader is done — this is the REPEATABLE READ guarantee.$dbt72652$, 1, 4),
  ($dbt72653$tq-dbms-sql-23-non-repeatable-read-6$dbt72653$, $dbt72654$pt-dbms-sql-23-non-repeatable-read$dbt72654$,
   $dbt72655$How does non-repeatable read differ from a lost update?$dbt72655$,
   $dbt72656$["They are the same anomaly under different names", "A lost update involves TWO transactions both writing based on stale reads, with one write silently erasing the other; non-repeatable read involves ONE transaction reading the same item twice and observing a legitimately committed change made by another transaction", "Non-repeatable read only occurs with INSERT statements", "A lost update requires at least three transactions"]$dbt72656$::jsonb,
   1, $dbt72657$These are distinct mechanisms: lost update is about a write being clobbered; non-repeatable read is about a reading transaction's own view of a value shifting between two of its own reads.$dbt72657$, 1, 5),
  ($dbt72658$tq-dbms-sql-23-non-repeatable-read-7$dbt72658$, $dbt72659$pt-dbms-sql-23-non-repeatable-read$dbt72659$,
   $dbt72660$Which of these scenarios is explicitly distinguished from non-repeatable read, and covered separately in the next topic?$dbt72660$,
   $dbt72661$["Phantom read \u2014 where a NEW row appears (or an old one disappears) matching a query's WHERE condition between two executions of that query, rather than an existing row's value changing", "Dirty read", "Lost update", "Serial schedule"]$dbt72661$::jsonb,
   0, $dbt72662$Phantom read (23.13) is about the SET of matching rows changing due to insert/delete, which is explicitly a different anomaly from an existing row's VALUE changing (non-repeatable read).$dbt72662$, 1, 6),
  ($dbt72663$tq-dbms-sql-23-non-repeatable-read-8$dbt72663$, $dbt72664$pt-dbms-sql-23-non-repeatable-read$dbt72664$,
   $dbt72665$Why can a non-repeatable read cause problems even though every individual operation involved (T1's reads, T2's write, T2's commit) was itself perfectly valid?$dbt72665$,
   $dbt72666$["It cannot cause any real problem", "Because T1's internal logic may assume the value is stable across its own two reads (e.g., a 'check, compute, re-check' pattern), and a silent mid-transaction change can break that assumption, producing an inconsistent result", "Because SQL forbids reading the same column twice", "Because T2's commit is technically invalid"]$dbt72666$::jsonb,
   1, $dbt72667$Even with no rule violated by any single operation, a transaction relying on a stable snapshot across multiple reads can be led into an incorrect conclusion if that snapshot silently shifts underneath it.$dbt72667$, 1, 7)
on conflict (id) do nothing;

-- 23.13 Phantom Read
with g as (select id from public.learning_grids where lower(slug) = $dbt72668$dbms-sql-tutorial$dbt72668$),
     s as (select id from public.learning_sections where lower(slug) = $dbt72669$chapter-23-concurrency-control$dbt72669$ and grid_id = (select id from g))
insert into public.learning_topics
  (section_id, grid_id, title, slug, short_description, sort_order, status, show_on_website, show_on_mobile, source_kind, source_ref)
select s.id, g.id, $dbt72670$Phantom Read$dbt72670$, $dbt72671$phantom-read$dbt72671$, '', 13, 'published', true, true, $dbt72672$dbms_sql_tutorial$dbt72672$, $dbt72673$chapter-23-concurrency-control/phantom-read$dbt72673$
from g, s
on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null do update set
  title = excluded.title, sort_order = excluded.sort_order, updated_at = now();

with t as (select id from public.learning_topics where source_kind = $dbt72674$dbms_sql_tutorial$dbt72674$ and source_ref = $dbt72675$chapter-23-concurrency-control/phantom-read$dbt72675$)
insert into public.learning_contents (topic_id, heading, body, content_format, sort_order, status, metadata)
select t.id, $dbt72676$Phantom Read$dbt72676$, $dbt72677$### What It Is

A **phantom read** occurs when a transaction executes the **same query with a `WHERE` condition twice**, and the **set of rows** returned differs between the two executions — not because any existing row's value changed, but because another transaction **inserted a new row** (or deleted an existing one) that matches the condition, in between the two query executions. The "phantom" is the extra row that mysteriously appears (or the row that mysteriously vanishes) the second time.

### Concrete Example — Inventory / Accounts Table

Suppose an `accounts` table currently has:

| id | name  | balance |
|----|-------|---------|
| A  | Alice | 1000    |
| B  | Bob   | 2000    |

T1 runs a report query twice within one transaction, looking for high-value accounts:

```
Time  Operation                                                Result
1     T1: SELECT * FROM accounts WHERE balance > 1000;          {B: 2000}   (first execution)
2     T2: INSERT INTO accounts VALUES ('C', 'Carol', 1500);
3     T2: COMMIT;
4     T1: SELECT * FROM accounts WHERE balance > 1000;          {B: 2000, C: 1500}  (second execution)
```
T1's first query (step 1) returns only Bob's row. T2 then inserts and commits a brand-new row for Carol with balance 1500, which also satisfies `balance > 1000`. T1's second, identical query (step 4) now returns **an extra row** — Carol's — that simply did not exist the first time. Bob's row itself never changed at all; the "phantom" is Carol's entirely new row suddenly matching the same condition.

### Distinguishing Phantom Read from Non-Repeatable Read — the Most Commonly Confused Pair

This distinction is a favorite interview/exam question, so state it precisely:

- **Non-repeatable read (23.12)**: the same *existing* row is read twice, and its **value changed** (due to another transaction's committed `UPDATE`) — the row identity is the same both times, only its data differs.
- **Phantom read**: the same *query/condition* is run twice, and the **set of rows** matching it changed — because a new row was **inserted** (or an old one **deleted**) by another transaction, not because any existing row's value was updated. Bob's row above is completely untouched; it's Carol's newly-inserted row that's the phantom.

A useful mental shortcut: non-repeatable read = "a value I already had changed under me"; phantom read = "new data appeared (or vanished) that wasn't there before, matching my filter."

### Why It's Subtle to Prevent

Locking every row a query returns (which is how `REPEATABLE READ` prevents non-repeatable reads) does nothing to stop phantom reads — a *new* row didn't exist yet at the time of the first query, so there was no row to lock! Preventing phantoms requires locking the *range/condition* itself (a "range lock" or "predicate lock" on `balance > 1000`), so that no new row can be inserted into that range until T1 finishes. This extra mechanism is exactly why phantom-read prevention is associated with the strongest isolation level, `SERIALIZABLE`, in the isolation-level hierarchy covered next in Chapter 25.

### Edge Cases

- A phantom can also occur via **deletion**: if T1's first query returns 3 rows and T2 deletes one of them (matching T1's condition) and commits, T1's second identical query now returns only 2 rows — a "reverse phantom," equally covered by the same definition (the *set* of matching rows changed due to another transaction's committed insert/delete).
- Phantom read requires the two queries to use the **same condition** — if T1 runs two genuinely different queries, differing results are expected and not an anomaly at all.
- Some textbooks treat phantom read as a special case of "read skew" affecting aggregate queries (e.g., `COUNT(*) WHERE balance > 1000` returning 1 then 2) — same root cause, just observed through an aggregate rather than a row list.

### Key Takeaways / Interview Angle

- **Q: In one sentence, what's the difference between non-repeatable read and phantom read?** Non-repeatable read = an existing row's value changes between two reads; phantom read = the set of rows matching a condition changes (via insert/delete) between two identical queries.
- **Q: Why can't ordinary row-level locking prevent phantom reads?** Because the phantom row doesn't exist at the time of the first query, so there is nothing to lock yet — preventing phantoms requires locking the query's predicate/range itself, not just the rows already returned.
- **Q: How does this set up Chapter 25?** Isolation levels are formally defined by exactly which of these three anomalies (dirty read, non-repeatable read, phantom read) they permit vs. prevent — phantom read is the last and hardest anomaly, eliminated only at the strictest (`SERIALIZABLE`) level.$dbt72677$, 'markdown', 0, 'published', jsonb_build_object('source', $dbt72678$dbms_sql_tutorial_seed$dbt72678$)
from t
on conflict (topic_id) where (metadata ->> 'source') = $dbt72679$dbms_sql_tutorial_seed$dbt72679$ do update set
  heading = excluded.heading, body = excluded.body, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = $dbt72680$dbms-sql-tutorial$dbt72680$),
     t as (select id from public.learning_topics where source_kind = $dbt72681$dbms_sql_tutorial$dbt72681$ and source_ref = $dbt72682$chapter-23-concurrency-control/phantom-read$dbt72682$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description, total_marks, pass_marks,
   is_published, difficulty, learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  $dbt72683$pt-dbms-sql-23-phantom-read$dbt72683$, $dbt72684$Phantom Read - Quick Test$dbt72684$, 'aptitude', 8, 8,
  $dbt72685$8 questions on Phantom Read.$dbt72685$,
  8, 3, true, 'Medium',
  g.id, t.id, 'published', false,
  0, $dbt72686$Answer all 8 questions. Each carries 1 mark. No negative marking. You have 8 minutes to complete this test.$dbt72686$,
  true, true
from g, t
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ($dbt72687$tq-dbms-sql-23-phantom-read-1$dbt72687$, $dbt72688$pt-dbms-sql-23-phantom-read$dbt72688$,
   $dbt72689$What is the defining condition of a phantom read?$dbt72689$,
   $dbt72690$["An existing row's value changes between two reads within the same transaction", "The set of rows returned by the same query/condition, run twice within one transaction, differs because another transaction inserted or deleted a matching row in between", "A transaction reads uncommitted data", "A transaction's write is silently overwritten by another transaction"]$dbt72690$::jsonb,
   1, $dbt72691$Phantom read is specifically about the ROW SET matching a repeated query changing due to another transaction's committed insert/delete — not any existing row's value being updated.$dbt72691$, 1, 0),
  ($dbt72692$tq-dbms-sql-23-phantom-read-2$dbt72692$, $dbt72693$pt-dbms-sql-23-phantom-read$dbt72693$,
   $dbt72694$In the worked example, why does T1's second query return Carol's row when the first query didn't?$dbt72694$,
   $dbt72695$["Because Bob's balance changed", "Because T2 inserted a new row for Carol with balance 1500 and committed it in between T1's two identical query executions", "Because T1's query had a syntax error the first time", "Because Alice's row was updated to match the condition"]$dbt72695$::jsonb,
   1, $dbt72696$Carol's row didn't exist at the time of T1's first query; T2's committed insert created it in between, so it appears — as a 'phantom' — only in the second execution of the identical query.$dbt72696$, 1, 1),
  ($dbt72697$tq-dbms-sql-23-phantom-read-3$dbt72697$, $dbt72698$pt-dbms-sql-23-phantom-read$dbt72698$,
   $dbt72699$What is the precise distinction between a non-repeatable read and a phantom read?$dbt72699$,
   $dbt72700$["They are the same anomaly with different names", "Non-repeatable read: an EXISTING row's value changes between two reads. Phantom read: the SET of rows matching a condition changes because a new row was inserted (or an old one deleted), not because an existing row's value changed", "Non-repeatable read only applies to numeric columns; phantom read applies to text columns", "Phantom read requires three or more transactions; non-repeatable read requires only two"]$dbt72700$::jsonb,
   1, $dbt72701$This is the core distinguishing fact examiners test: non-repeatable read = same row, different value; phantom read = different set of rows entirely, via insert/delete.$dbt72701$, 1, 2),
  ($dbt72702$tq-dbms-sql-23-phantom-read-4$dbt72702$, $dbt72703$pt-dbms-sql-23-phantom-read$dbt72703$,
   $dbt72704$Why doesn't ordinary row-level locking (locking every row returned by a query) prevent phantom reads?$dbt72704$,
   $dbt72705$["Row-level locking is too slow to matter", "The phantom row does not exist yet at the time of the first query, so there is no row available to lock \u2014 preventing this requires locking the query's condition/range itself, not just already-returned rows", "Row-level locking only works for UPDATE statements", "Phantom reads never involve row locks of any kind"]$dbt72705$::jsonb,
   1, $dbt72706$Since the inserted row is brand new, no lock could have been placed on it before it existed; only a range/predicate lock on the condition itself can block new matching inserts.$dbt72706$, 1, 3),
  ($dbt72707$tq-dbms-sql-23-phantom-read-5$dbt72707$, $dbt72708$pt-dbms-sql-23-phantom-read$dbt72708$,
   $dbt72709$Which of the following is a 'reverse phantom' scenario?$dbt72709$,
   $dbt72710$["T1's first query returns 3 rows; T2 deletes one of those matching rows and commits; T1's second identical query now returns only 2 rows", "T1 reads the same row's balance twice and gets different values", "T1 reads a value written by T2 before T2 commits", "T1's write is overwritten by T2's write"]$dbt72710$::jsonb,
   0, $dbt72711$A phantom can occur via deletion just as easily as insertion — the matching row SET shrinks instead of growing, but it's the same underlying anomaly (set of matching rows changed due to a committed operation from another transaction).$dbt72711$, 1, 4),
  ($dbt72712$tq-dbms-sql-23-phantom-read-6$dbt72712$, $dbt72713$pt-dbms-sql-23-phantom-read$dbt72713$,
   $dbt72714$Which isolation level is typically required to fully prevent phantom reads?$dbt72714$,
   $dbt72715$["READ UNCOMMITTED", "READ COMMITTED", "SERIALIZABLE (the strictest level, using range/predicate locking)", "Phantom reads cannot be prevented by any isolation level"]$dbt72715$::jsonb,
   2, $dbt72716$Because preventing phantoms requires locking the query's predicate/range (not just existing rows), this guarantee is associated with the strongest, SERIALIZABLE isolation level.$dbt72716$, 1, 5),
  ($dbt72717$tq-dbms-sql-23-phantom-read-7$dbt72717$, $dbt72718$pt-dbms-sql-23-phantom-read$dbt72718$,
   $dbt72719$If T1 runs two genuinely DIFFERENT queries (different WHERE conditions) and gets different row sets, is this a phantom read?$dbt72719$,
   $dbt72720$["Yes, any differing result between two queries is a phantom read", "No \u2014 phantom read specifically requires the SAME query/condition to be run twice; differing results from genuinely different queries are expected and not an anomaly", "Only if the queries touch the same table", "Only if T1 is a read-only transaction"]$dbt72720$::jsonb,
   1, $dbt72721$The anomaly requires comparing two executions of the identical condition; if the conditions differ, differing results are simply expected behavior, not a concurrency anomaly.$dbt72721$, 1, 6),
  ($dbt72722$tq-dbms-sql-23-phantom-read-8$dbt72722$, $dbt72723$pt-dbms-sql-23-phantom-read$dbt72723$,
   $dbt72724$How can a phantom read manifest through an aggregate query rather than a row list?$dbt72724$,
   $dbt72725$["It cannot \u2014 phantom reads only ever affect SELECT * queries", "A repeated COUNT(*) WHERE balance > 1000 could return 1 the first time and 2 the second time, reflecting the same underlying row-set change even though no individual row list was compared", "Aggregate queries are immune to all concurrency anomalies", "Only SUM() queries can exhibit phantom reads"]$dbt72725$::jsonb,
   1, $dbt72726$The same root cause (a new matching row committed in between two query executions) can be observed through a changing aggregate count/sum just as easily as through a changing row list.$dbt72726$, 1, 7)
on conflict (id) do nothing;

-- ===========================================================================
-- 3. CHAPTER TESTS — one per new chapter (21, 22, 23). Pools are LIVE joins via
--    practice_test_pool() (0091/063); no test_questions of their own.
-- ===========================================================================
with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbt72727$chapter-21-normalization-and-functional-dependencies$dbt72727$ and lower(g.slug) = $dbt72728$dbms-sql-tutorial$dbt72728$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbt72729$pt-dbms-sql-ch21-test$dbt72729$, $dbt72730$Normalization and Functional Dependencies - Chapter Test$dbt72730$, 'aptitude', sec.id, 'chapter', true, 15,
  20,
  $dbt72731$15 randomly-sampled questions drawn from every Normalization and Functional Dependencies topic quiz.$dbt72731$,
  'published', true, true, true, 'Medium', 0,
  $dbt72732$This test randomly samples 15 questions from all of Chapter 21's topic quizzes. Each carries 1 mark. No negative marking. You have 20 minutes.$dbt72732$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbt72733$chapter-22-transactions$dbt72733$ and lower(g.slug) = $dbt72734$dbms-sql-tutorial$dbt72734$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbt72735$pt-dbms-sql-ch22-test$dbt72735$, $dbt72736$Transactions - Chapter Test$dbt72736$, 'aptitude', sec.id, 'chapter', true, 10,
  15,
  $dbt72737$10 randomly-sampled questions drawn from every Transactions topic quiz.$dbt72737$,
  'published', true, true, true, 'Medium', 0,
  $dbt72738$This test randomly samples 10 questions from all of Chapter 22's topic quizzes. Each carries 1 mark. No negative marking. You have 15 minutes.$dbt72738$
from sec
on conflict (id) do nothing;

with sec as (select s.id from public.learning_sections s join public.learning_grids g on g.id = s.grid_id
             where lower(s.slug) = $dbt72739$chapter-23-concurrency-control$dbt72739$ and lower(g.slug) = $dbt72740$dbms-sql-tutorial$dbt72740$)
insert into public.practice_tests
  (id, title, category, learning_section_id, scope, randomize, question_limit,
   duration_minutes, description, status, show_on_website, show_on_mobile,
   is_published, difficulty, negative_marking, instructions)
select
  $dbt72741$pt-dbms-sql-ch23-test$dbt72741$, $dbt72742$Concurrency Control - Chapter Test$dbt72742$, 'aptitude', sec.id, 'chapter', true, 10,
  15,
  $dbt72743$10 randomly-sampled questions drawn from every Concurrency Control topic quiz.$dbt72743$,
  'published', true, true, true, 'Medium', 0,
  $dbt72744$This test randomly samples 10 questions from all of Chapter 23's topic quizzes. Each carries 1 mark. No negative marking. You have 15 minutes.$dbt72744$
from sec
on conflict (id) do nothing;

-- ===========================================================================
-- 4. SQL CODING PROBLEMS (Chapter 22 COMMIT/ROLLBACK/SAVEPOINT — every
--    problem verified end-to-end against Paiza's live MySQL sandbox, with
--    ENGINE=InnoDB explicitly declared so transaction semantics apply,
--    2026-09).
-- ===========================================================================
-- Commit a Fund Transfer (topic chapter-22-transactions/commit)
with t as (select id from public.learning_topics where source_kind = $dbt72748$dbms_sql_tutorial$dbt72748$ and source_ref = $dbt72749$chapter-22-transactions/commit$dbt72749$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbt72750$cp-dbms-sql-commit-a-fund-transfer$dbt72750$, null::text, $dbt72751$Commit a Fund Transfer$dbt72751$, $dbt72752$Easy$dbt72752$, $dbt72753$commit-a-fund-transfer$dbt72753$,
  $dbt72754$Write a transaction that transfers 200 from account id 1 to account id 2 and commits it. Debit account 1 by 200, credit account 2 by 200, then `COMMIT`.

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL
) ENGINE=InnoDB;
```

**Sample data**:

```sql
INSERT INTO accounts (id, balance) VALUES (1, 1000), (2, 500);
```
$dbt72754$,
  $dbt72745$[{"input": "", "output": "id\tbalance\n1\t800\n2\t700"}]$dbt72745$::jsonb, $dbt72746$[{"hidden": true, "seed_sql": "INSERT INTO accounts (id, balance) VALUES (1, 5000), (2, 2000);", "expected": "id\tbalance\n1\t4800\n2\t2200"}]$dbt72746$::jsonb, jsonb_build_object('sql', $dbt72747$-- Write your transaction here
$dbt72747$),
  $dbt72755$Reference: `START TRANSACTION; UPDATE accounts SET balance = balance - 200 WHERE id = 1; UPDATE accounts SET balance = balance + 200 WHERE id = 2; COMMIT;` — ENGINE=InnoDB is required for this platform's transaction support to actually apply.$dbt72755$, array['sql'], $dbt72756$CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL
) ENGINE=InnoDB;$dbt72756$, $dbt72757$INSERT INTO accounts (id, balance) VALUES (1, 1000), (2, 500);$dbt72757$, $dbt72758$SELECT id, balance FROM accounts ORDER BY id;$dbt72758$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Rollback a Failed Transfer (topic chapter-22-transactions/rollback)
with t as (select id from public.learning_topics where source_kind = $dbt72762$dbms_sql_tutorial$dbt72762$ and source_ref = $dbt72763$chapter-22-transactions/rollback$dbt72763$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbt72764$cp-dbms-sql-rollback-a-failed-transfer$dbt72764$, null::text, $dbt72765$Rollback a Failed Transfer$dbt72765$, $dbt72766$Easy$dbt72766$, $dbt72767$rollback-a-failed-transfer$dbt72767$,
  $dbt72768$Write a transaction that attempts to transfer 300 from account id 1 to account id 2, but then rolls it back instead of committing. Debit account 1 by 300, credit account 2 by 300, then `ROLLBACK`.

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL
) ENGINE=InnoDB;
```

**Sample data**:

```sql
INSERT INTO accounts (id, balance) VALUES (1, 1000), (2, 500);
```
$dbt72768$,
  $dbt72759$[{"input": "", "output": "id\tbalance\n1\t1000\n2\t500"}]$dbt72759$::jsonb, $dbt72760$[{"hidden": true, "seed_sql": "INSERT INTO accounts (id, balance) VALUES (1, 5000), (2, 2000);", "expected": "id\tbalance\n1\t5000\n2\t2000"}]$dbt72760$::jsonb, jsonb_build_object('sql', $dbt72761$-- Write your transaction here
$dbt72761$),
  $dbt72769$Reference: `START TRANSACTION; UPDATE accounts SET balance = balance - 300 WHERE id = 1; UPDATE accounts SET balance = balance + 300 WHERE id = 2; ROLLBACK;` — the balances must equal the original seed values exactly, proving the transaction left no trace.$dbt72769$, array['sql'], $dbt72770$CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL
) ENGINE=InnoDB;$dbt72770$, $dbt72771$INSERT INTO accounts (id, balance) VALUES (1, 1000), (2, 500);$dbt72771$, $dbt72772$SELECT id, balance FROM accounts ORDER BY id;$dbt72772$,
  t.id, 'published', false, true, true, 1
from t
on conflict (id) do nothing;

-- Correct a Mistake with a Savepoint (topic chapter-22-transactions/savepoint)
with t as (select id from public.learning_topics where source_kind = $dbt72776$dbms_sql_tutorial$dbt72776$ and source_ref = $dbt72777$chapter-22-transactions/savepoint$dbt72777$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description, examples, test_cases, starter_code,
   editorial, supported_languages, sql_schema_sql, sql_seed_sql, sql_check_sql, learning_topic_id, status,
   is_premium, show_on_website, show_on_mobile, sort_order)
select
  $dbt72778$cp-dbms-sql-correct-a-mistake-with-a-savepoint$dbt72778$, null::text, $dbt72779$Correct a Mistake with a Savepoint$dbt72779$, $dbt72780$Medium$dbt72780$, $dbt72781$correct-a-mistake-with-a-savepoint$dbt72781$,
  $dbt72782$Write a transaction that: debits account 1 by 200, sets a savepoint named `sp1`, mistakenly credits account 2 by 9999, rolls back to `sp1` to undo that mistake, then correctly credits account 2 by 200, and commits.

```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL
) ENGINE=InnoDB;
```

**Sample data**:

```sql
INSERT INTO accounts (id, balance) VALUES (1, 1000), (2, 500);
```
$dbt72782$,
  $dbt72773$[{"input": "", "output": "id\tbalance\n1\t800\n2\t700"}]$dbt72773$::jsonb, $dbt72774$[{"hidden": true, "seed_sql": "INSERT INTO accounts (id, balance) VALUES (1, 5000), (2, 2000);", "expected": "id\tbalance\n1\t4800\n2\t2200"}]$dbt72774$::jsonb, jsonb_build_object('sql', $dbt72775$-- Write your transaction here
$dbt72775$),
  $dbt72783$Reference: `START TRANSACTION; UPDATE accounts SET balance = balance - 200 WHERE id = 1; SAVEPOINT sp1; UPDATE accounts SET balance = balance + 9999 WHERE id = 2; ROLLBACK TO sp1; UPDATE accounts SET balance = balance + 200 WHERE id = 2; COMMIT;` — verified end-to-end against the real judge sandbox with ENGINE=InnoDB.$dbt72783$, array['sql'], $dbt72784$CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL
) ENGINE=InnoDB;$dbt72784$, $dbt72785$INSERT INTO accounts (id, balance) VALUES (1, 1000), (2, 500);$dbt72785$, $dbt72786$SELECT id, balance FROM accounts ORDER BY id;$dbt72786$,
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
  select id into v_grid_id from public.learning_grids where lower(slug) = $dbt72787$dbms-sql-tutorial$dbt72787$;
  if v_grid_id is null then raise exception 'validation: dbms-sql-tutorial grid missing'; end if;

  select count(*) into v_topics from public.learning_topics where grid_id = v_grid_id and source_kind = $dbt72788$dbms_sql_tutorial$dbt72788$;
  if v_topics < 294 then raise exception 'validation: expected at least 294 dbms_sql_tutorial topics (250 from batches 1-7 + 44 from batch 8), found %', v_topics; end if;

  select count(*) into v_questions from public.test_questions tq
    join public.practice_tests pt on pt.id = tq.test_id
    where pt.learning_topic_id in (select id from public.learning_topics where grid_id = v_grid_id and source_kind = $dbt72789$dbms_sql_tutorial$dbt72789$);
  if v_questions < 2352 then raise exception 'validation: expected at least 2352 topic-quiz questions, found %', v_questions; end if;

  select count(*) into v_chtests from public.practice_tests where id in ('pt-dbms-sql-ch21-test','pt-dbms-sql-ch22-test','pt-dbms-sql-ch23-test') and scope = 'chapter';
  if v_chtests <> 3 then raise exception 'validation: expected 3 new chapter tests, found %', v_chtests; end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-dbms-sql-%';
  if v_problems < 49 then raise exception 'validation: expected at least 49 SQL coding problems total, found %', v_problems; end if;

  raise notice '0099 OK: % total topics, % total topic-quiz questions, 3 new chapter tests (ch21/ch22/ch23), % total SQL coding problems.', v_topics, v_questions, v_problems;
end $$;

notify pgrst, 'reload schema';
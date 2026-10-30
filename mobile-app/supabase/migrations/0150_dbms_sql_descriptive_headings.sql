-- mobile-app/supabase/migrations/0150_dbms_sql_descriptive_headings.sql
-- CANONICAL PAIR; twin: admin 120
-- BODY
-- Content-only: replace the 43 canonical numbered group titles with their
-- descriptive names. Preserve IDs, slugs, notes, assessments, progress,
-- publish/platform/premium settings, and admin-customized group names.
-- The second twin and subsequent runs are no-ops. No production execution
-- is authorized by preparing this migration. No topic freshness is changed.
-- Rollback: reverse old_name/new_name below, matching the current name exactly.
with names(slug, old_name, new_name) as (values
  ('chapter-1-database-foundations', 'Chapter 1: Database Foundations', 'Database Foundations'),
  ('chapter-2-dbms-architecture', 'Chapter 2: DBMS Architecture', 'DBMS Architecture'),
  ('chapter-3-data-models', 'Chapter 3: Data Models', 'Data Models'),
  ('chapter-4-relational-model', 'Chapter 4: Relational Model', 'Relational Model'),
  ('chapter-5-keys-and-integrity', 'Chapter 5: Keys and Integrity', 'Keys and Integrity'),
  ('chapter-6-er-and-eer-modeling', 'Chapter 6: ER and EER Modeling', 'ER and EER Modeling'),
  ('chapter-7-relational-algebra', 'Chapter 7: Relational Algebra', 'Relational Algebra'),
  ('chapter-8-sql-fundamentals', 'Chapter 8: SQL Fundamentals', 'SQL Fundamentals'),
  ('chapter-9-ddl-and-schema-design', 'Chapter 9: DDL and Schema Design', 'DDL and Schema Design'),
  ('chapter-10-sql-constraints', 'Chapter 10: SQL Constraints', 'SQL Constraints'),
  ('chapter-11-dml-and-data-modification', 'Chapter 11: DML and Data Modification', 'DML and Data Modification'),
  ('chapter-12-select-and-filtering', 'Chapter 12: SELECT and Filtering', 'SELECT and Filtering'),
  ('chapter-13-sorting-and-pagination', 'Chapter 13: Sorting and Pagination', 'Sorting and Pagination'),
  ('chapter-14-sql-functions', 'Chapter 14: SQL Functions', 'SQL Functions'),
  ('chapter-15-group-by-and-aggregation', 'Chapter 15: GROUP BY and Aggregation', 'GROUP BY and Aggregation'),
  ('chapter-16-joins', 'Chapter 16: Joins', 'Joins'),
  ('chapter-17-subqueries', 'Chapter 17: Subqueries', 'Subqueries'),
  ('chapter-18-set-operations', 'Chapter 18: Set Operations', 'Set Operations'),
  ('chapter-19-views', 'Chapter 19: Views', 'Views'),
  ('chapter-20-indexes-and-access-paths', 'Chapter 20: Indexes and Access Paths', 'Indexes and Access Paths'),
  ('chapter-21-normalization-and-functional-dependencies', 'Chapter 21: Normalization and Functional Dependencies', 'Normalization and Functional Dependencies'),
  ('chapter-22-transactions', 'Chapter 22: Transactions', 'Transactions'),
  ('chapter-23-concurrency-control', 'Chapter 23: Concurrency Control', 'Concurrency Control'),
  ('chapter-24-locking-protocols', 'Chapter 24: Locking Protocols', 'Locking Protocols'),
  ('chapter-25-isolation-levels', 'Chapter 25: Isolation Levels', 'Isolation Levels'),
  ('chapter-26-recovery-and-logging', 'Chapter 26: Recovery and Logging', 'Recovery and Logging'),
  ('chapter-27-database-security', 'Chapter 27: Database Security', 'Database Security'),
  ('chapter-28-stored-procedures', 'Chapter 28: Stored Procedures', 'Stored Procedures'),
  ('chapter-29-stored-functions', 'Chapter 29: Stored Functions', 'Stored Functions'),
  ('chapter-30-triggers', 'Chapter 30: Triggers', 'Triggers'),
  ('chapter-31-cursors', 'Chapter 31: Cursors', 'Cursors'),
  ('chapter-32-advanced-sql-cte', 'Chapter 32: Advanced SQL: CTE', 'Advanced SQL: CTE'),
  ('chapter-33-advanced-sql-window-functions', 'Chapter 33: Advanced SQL: Window Functions', 'Advanced SQL: Window Functions'),
  ('chapter-34-advanced-sql-patterns', 'Chapter 34: Advanced SQL Patterns', 'Advanced SQL Patterns'),
  ('chapter-35-query-processing-and-optimization', 'Chapter 35: Query Processing and Optimization', 'Query Processing and Optimization'),
  ('chapter-36-physical-storage', 'Chapter 36: Physical Storage', 'Physical Storage'),
  ('chapter-37-advanced-index-structures', 'Chapter 37: Advanced Index Structures', 'Advanced Index Structures'),
  ('chapter-38-distributed-databases', 'Chapter 38: Distributed Databases', 'Distributed Databases'),
  ('chapter-39-nosql-databases', 'Chapter 39: NoSQL Databases', 'NoSQL Databases'),
  ('chapter-40-database-scaling', 'Chapter 40: Database Scaling', 'Database Scaling'),
  ('chapter-41-data-warehousing', 'Chapter 41: Data Warehousing', 'Data Warehousing'),
  ('chapter-42-database-design-projects', 'Chapter 42: Database Design Projects', 'Database Design Projects'),
  ('chapter-43-interview-and-placement-preparation', 'Chapter 43: Interview and Placement Preparation', 'Interview and Placement Preparation')
)
update public.learning_sections as target
set name = names.new_name, updated_at = now()
from names, public.learning_grids as course
where course.id = target.grid_id
  and lower(course.slug) = 'dbms-sql-tutorial'
  and lower(target.slug) = names.slug
  and target.name = names.old_name;

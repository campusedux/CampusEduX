-- mobile-app/supabase/checks/spring_boot_hidden_check.sql
-- READ-ONLY check, run by the owner after applying 0124 to 0137. Proves that the Spring Boot
-- Tutorial rows exist but stay HIDDEN from anon and from a signed-in (non-admin) student, through every
-- Learning RPC and every table they could read directly.
--
-- Run with psql, or paste into the Supabase SQL editor. It writes nothing to any real table: this session
-- is switched to read-only transactions before anything else runs, and Postgres would refuse any write to
-- a non-temporary table from that point on even if this script had a bug. The only table it writes to is
-- its own throw-away temp table, which exists for this session only.
--
-- The SQL editor shows only the LAST statement's result, so every check is collected into one temp table
-- and the final statement is a single SELECT of all of them — sorted so any failing row (ok = false) sorts
-- first, right under the header. Every row should read ok = true.
--
-- Safe to run more than once in the same connection (the same psql session, or the same SQL editor tab
-- without reloading it): it reuses its temp table and clears it first, rather than erroring or doubling
-- up rows. Each run still starts from a clean slate.
--
-- Side effect: this session (this one SQL editor tab, or this one psql connection) is left in read-only
-- mode afterward. That is harmless — open a new tab, or a new psql connection, for anything else.
--
-- The temp table itself must be created (the first time only) before the session switches to read-only:
-- creating a table is a schema change (DDL), which read-only mode blocks even for a temp table. Writing
-- rows into it — inserting or clearing — is a plain data change (DML) on a temp table, which read-only
-- mode allows even after the switch; that is the one exception Postgres makes, and it is exactly what the
-- rest of this script relies on. Both branches use dynamic SQL so this block never fails when the table
-- does not exist yet.
do $$
begin
  if to_regclass('pg_temp.sb_check_results') is null then
    execute 'create temp table sb_check_results (actor text, check_name text, actual text, expected text, ok boolean)';
    -- the anon/authenticated checks below insert into this table too, so they need write access to it —
    -- it exists only for this session and holds nothing but the pass/fail rows this script itself computes
    execute 'grant insert on sb_check_results to public';
  else
    execute 'delete from sb_check_results';
  end if;
end
$$;
set session characteristics as transaction read only;

-- ===== A. owner view (the connecting role, which bypasses RLS): the rows are there, and hidden =====
insert into sb_check_results
select 'owner' as actor, check_name, actual, expected, actual = expected as ok
from (values
  ('grid exists',                     (select count(*) from public.learning_grids where slug = 'spring-boot-tutorial')::text, '1'),
  ('grid hidden on website + mobile', (select (not show_on_website and not show_on_mobile)::text from public.learning_grids where slug = 'spring-boot-tutorial'), 'true'),
  -- update these five counts alongside each new batch (95 topics / 186 blocks / 95 tests / 475 MCQs as of batch 14)
  ('topics',                          (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial')::text, '95'),
  ('content blocks',                  (select count(*) from public.learning_contents where metadata ->> 'source' = 'spring_boot_seed')::text, '186'),
  ('mock tests',                      (select count(*) from public.practice_tests where id like 'pt-sb-%')::text, '95'),
  ('mock tests hidden',               (select count(*) from public.practice_tests where id like 'pt-sb-%' and not show_on_website and not show_on_mobile)::text, '95'),
  ('MCQs',                            (select count(*) from public.test_questions where test_id like 'pt-sb-%')::text, '475')
) as t(check_name, actual, expected);

-- ===== B. anon =====
-- Expected: nothing visible anywhere, through any Learning RPC or a direct table read.
set role anon;
insert into sb_check_results
select 'anon' as actor, check_name, actual, '0' as expected, actual = '0' as ok
from (values
  ('grids_list website',   (select count(*) from public.learning_grids_list('website') g where g.slug = 'spring-boot-tutorial')::text),
  ('grids_list mobile',    (select count(*) from public.learning_grids_list('mobile') g where g.slug = 'spring-boot-tutorial')::text),
  ('learning_tree',        (select count(*) from (select public.learning_tree('spring-boot-tutorial', 'website') as j) x where j is not null)::text),
  ('topic content (web+mobile, 95 topics)', (select count(*) from unnest(array['what-is-spring-boot','spring-vs-spring-boot','installing-jdk-and-ide-for-spring-boot','creating-a-project-with-spring-initializr','spring-boot-project-structure','maven-pom-xml-explained','spring-boot-starters','auto-configuration','running-a-spring-boot-application','spring-boot-devtools','inversion-of-control','dependency-injection','spring-beans','bean-scopes','bean-lifecycle','component-scan','configuration-and-bean','constructor-vs-setter-vs-field-injection','autowired-and-qualifier','primary-annotation','spring-profiles','application-properties-vs-application-yml','value-annotation','configuration-properties','externalized-configuration','logging-in-spring-boot','spring-boot-actuator','spring-mvc-architecture','controller-vs-rest-controller','request-mapping','get-post-put-delete-mapping','path-variable','request-param','request-body','responseentity','http-status-codes-in-spring-boot','dto-pattern','building-a-complete-crud-rest-api','pagination-and-sorting','file-upload-and-download','resttemplate','webclient-in-spring-boot','cors-in-spring-boot','bean-validation','custom-validation-annotation','exception-handling-in-spring-boot','controller-advice-and-exception-handler','custom-exception-classes','standard-api-error-response','jdbc-vs-jpa-vs-hibernate','connecting-spring-boot-to-mysql','connecting-spring-boot-to-postgresql','h2-in-memory-database','jpa-entity','primary-key-generation-strategies','jparepository','derived-query-methods','query-with-jpql-and-native-sql','one-to-one-mapping','one-to-many-and-many-to-one-mapping','many-to-many-mapping','lazy-vs-eager-loading','n-plus-1-problem','transactional','auditing-with-created-date','database-migration-with-flyway','soft-delete','spring-security-basics','authentication-vs-authorization','password-encoding-with-bcrypt','jwt-authentication','role-based-authorization','method-level-security','refresh-token','unit-testing-with-junit-5','mockito-in-spring-boot','spring-boot-test','web-mvc-test-and-mockmvc','data-jpa-test','testcontainers-basics','caching-in-spring-boot','scheduling-with-scheduled','async-processing-with-async','spring-events','sending-email','swagger-and-openapi-documentation','spring-aop','interceptors-and-filters','rate-limiting','introduction-to-microservices-with-spring-boot','kafka-with-spring-boot','docker-for-spring-boot','deploying-spring-boot-application','spring-boot-interview-questions','spring-boot-mini-project']) s, unnest(array['website','mobile']) p where public.learning_topic_content('spring-boot-tutorial', s, p) is not null)::text),
  ('topic practice listings', (select coalesce(sum(jsonb_array_length(coalesce(public.learning_topic_practice('spring-boot-tutorial', s, 'website') -> 'mock_tests', '[]'::jsonb))), 0) from unnest(array['what-is-spring-boot','spring-vs-spring-boot','installing-jdk-and-ide-for-spring-boot','creating-a-project-with-spring-initializr','spring-boot-project-structure','maven-pom-xml-explained','spring-boot-starters','auto-configuration','running-a-spring-boot-application','spring-boot-devtools','inversion-of-control','dependency-injection','spring-beans','bean-scopes','bean-lifecycle','component-scan','configuration-and-bean','constructor-vs-setter-vs-field-injection','autowired-and-qualifier','primary-annotation','spring-profiles','application-properties-vs-application-yml','value-annotation','configuration-properties','externalized-configuration','logging-in-spring-boot','spring-boot-actuator','spring-mvc-architecture','controller-vs-rest-controller','request-mapping','get-post-put-delete-mapping','path-variable','request-param','request-body','responseentity','http-status-codes-in-spring-boot','dto-pattern','building-a-complete-crud-rest-api','pagination-and-sorting','file-upload-and-download','resttemplate','webclient-in-spring-boot','cors-in-spring-boot','bean-validation','custom-validation-annotation','exception-handling-in-spring-boot','controller-advice-and-exception-handler','custom-exception-classes','standard-api-error-response','jdbc-vs-jpa-vs-hibernate','connecting-spring-boot-to-mysql','connecting-spring-boot-to-postgresql','h2-in-memory-database','jpa-entity','primary-key-generation-strategies','jparepository','derived-query-methods','query-with-jpql-and-native-sql','one-to-one-mapping','one-to-many-and-many-to-one-mapping','many-to-many-mapping','lazy-vs-eager-loading','n-plus-1-problem','transactional','auditing-with-created-date','database-migration-with-flyway','soft-delete','spring-security-basics','authentication-vs-authorization','password-encoding-with-bcrypt','jwt-authentication','role-based-authorization','method-level-security','refresh-token','unit-testing-with-junit-5','mockito-in-spring-boot','spring-boot-test','web-mvc-test-and-mockmvc','data-jpa-test','testcontainers-basics','caching-in-spring-boot','scheduling-with-scheduled','async-processing-with-async','spring-events','sending-email','swagger-and-openapi-documentation','spring-aop','interceptors-and-filters','rate-limiting','introduction-to-microservices-with-spring-boot','kafka-with-spring-boot','docker-for-spring-boot','deploying-spring-boot-application','spring-boot-interview-questions','spring-boot-mini-project']) s)::text),
  ('mock_test_detail',     (select count(*) from unnest(array['what-is-spring-boot','spring-vs-spring-boot','installing-jdk-and-ide-for-spring-boot','creating-a-project-with-spring-initializr','spring-boot-project-structure','maven-pom-xml-explained','spring-boot-starters','auto-configuration','running-a-spring-boot-application','spring-boot-devtools','inversion-of-control','dependency-injection','spring-beans','bean-scopes','bean-lifecycle','component-scan','configuration-and-bean','constructor-vs-setter-vs-field-injection','autowired-and-qualifier','primary-annotation','spring-profiles','application-properties-vs-application-yml','value-annotation','configuration-properties','externalized-configuration','logging-in-spring-boot','spring-boot-actuator','spring-mvc-architecture','controller-vs-rest-controller','request-mapping','get-post-put-delete-mapping','path-variable','request-param','request-body','responseentity','http-status-codes-in-spring-boot','dto-pattern','building-a-complete-crud-rest-api','pagination-and-sorting','file-upload-and-download','resttemplate','webclient-in-spring-boot','cors-in-spring-boot','bean-validation','custom-validation-annotation','exception-handling-in-spring-boot','controller-advice-and-exception-handler','custom-exception-classes','standard-api-error-response','jdbc-vs-jpa-vs-hibernate','connecting-spring-boot-to-mysql','connecting-spring-boot-to-postgresql','h2-in-memory-database','jpa-entity','primary-key-generation-strategies','jparepository','derived-query-methods','query-with-jpql-and-native-sql','one-to-one-mapping','one-to-many-and-many-to-one-mapping','many-to-many-mapping','lazy-vs-eager-loading','n-plus-1-problem','transactional','auditing-with-created-date','database-migration-with-flyway','soft-delete','spring-security-basics','authentication-vs-authorization','password-encoding-with-bcrypt','jwt-authentication','role-based-authorization','method-level-security','refresh-token','unit-testing-with-junit-5','mockito-in-spring-boot','spring-boot-test','web-mvc-test-and-mockmvc','data-jpa-test','testcontainers-basics','caching-in-spring-boot','scheduling-with-scheduled','async-processing-with-async','spring-events','sending-email','swagger-and-openapi-documentation','spring-aop','interceptors-and-filters','rate-limiting','introduction-to-microservices-with-spring-boot','kafka-with-spring-boot','docker-for-spring-boot','deploying-spring-boot-application','spring-boot-interview-questions','spring-boot-mini-project']) s where public.mock_test_detail('pt-sb-' || s, 'website') is not null)::text),
  ('sitemap rows',         (select count(*) from public.learning_sitemap('website') m where m.grid_slug = 'spring-boot-tutorial')::text),
  ('search hits',          (select count(*) from public.learning_search('spring boot', 'website', 50) h where h.grid_slug = 'spring-boot-tutorial')::text),
  ('table: grid',          (select count(*) from public.learning_grids where slug = 'spring-boot-tutorial')::text),
  ('table: topics',        (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial')::text),
  ('table: content',       (select count(*) from public.learning_contents where metadata ->> 'source' = 'spring_boot_seed')::text),
  ('table: mock tests',    (select count(*) from public.practice_tests where id like 'pt-sb-%')::text),
  ('table: MCQs',          (select count(*) from public.test_questions where test_id like 'pt-sb-%')::text)
) as t(check_name, actual);
reset role;

-- ===== C. a signed-in student (the oldest non-admin profile, or a fabricated id if none exists) =====
-- These settings are session-level (not `local`), so they survive past this block into the next statement
-- — there is no explicit transaction wrapping them together, unlike role B above where a single `set role`
-- already persists for the rest of the session. They are cleared again right after this block.
--
-- `set_config()` returns the value it just set, so calling it from a plain SELECT would print the
-- student's real id as that statement's result. A `do` block runs `perform set_config(...)` instead, which
-- discards the return value and prints nothing — the id genuinely never appears in any output here.
do $$
declare v_student_id uuid;
begin
  select coalesce(
    (select p.id from public.profiles p where not public.is_admin(p.id) order by p.created_at limit 1),
    gen_random_uuid())
  into v_student_id;
  perform set_config('request.jwt.claim.sub', v_student_id::text, false);
  perform set_config('request.jwt.claims', json_build_object('sub', v_student_id, 'role', 'authenticated')::text, false);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
end
$$;
set role authenticated;
insert into sb_check_results
select 'student' as actor, check_name, actual, '0' as expected, actual = '0' as ok
from (values
  ('grids_list website',   (select count(*) from public.learning_grids_list('website') g where g.slug = 'spring-boot-tutorial')::text),
  ('grids_list mobile',    (select count(*) from public.learning_grids_list('mobile') g where g.slug = 'spring-boot-tutorial')::text),
  ('learning_tree',        (select count(*) from (select public.learning_tree('spring-boot-tutorial', 'mobile') as j) x where j is not null)::text),
  ('topic content (web+mobile, 95 topics)', (select count(*) from unnest(array['what-is-spring-boot','spring-vs-spring-boot','installing-jdk-and-ide-for-spring-boot','creating-a-project-with-spring-initializr','spring-boot-project-structure','maven-pom-xml-explained','spring-boot-starters','auto-configuration','running-a-spring-boot-application','spring-boot-devtools','inversion-of-control','dependency-injection','spring-beans','bean-scopes','bean-lifecycle','component-scan','configuration-and-bean','constructor-vs-setter-vs-field-injection','autowired-and-qualifier','primary-annotation','spring-profiles','application-properties-vs-application-yml','value-annotation','configuration-properties','externalized-configuration','logging-in-spring-boot','spring-boot-actuator','spring-mvc-architecture','controller-vs-rest-controller','request-mapping','get-post-put-delete-mapping','path-variable','request-param','request-body','responseentity','http-status-codes-in-spring-boot','dto-pattern','building-a-complete-crud-rest-api','pagination-and-sorting','file-upload-and-download','resttemplate','webclient-in-spring-boot','cors-in-spring-boot','bean-validation','custom-validation-annotation','exception-handling-in-spring-boot','controller-advice-and-exception-handler','custom-exception-classes','standard-api-error-response','jdbc-vs-jpa-vs-hibernate','connecting-spring-boot-to-mysql','connecting-spring-boot-to-postgresql','h2-in-memory-database','jpa-entity','primary-key-generation-strategies','jparepository','derived-query-methods','query-with-jpql-and-native-sql','one-to-one-mapping','one-to-many-and-many-to-one-mapping','many-to-many-mapping','lazy-vs-eager-loading','n-plus-1-problem','transactional','auditing-with-created-date','database-migration-with-flyway','soft-delete','spring-security-basics','authentication-vs-authorization','password-encoding-with-bcrypt','jwt-authentication','role-based-authorization','method-level-security','refresh-token','unit-testing-with-junit-5','mockito-in-spring-boot','spring-boot-test','web-mvc-test-and-mockmvc','data-jpa-test','testcontainers-basics','caching-in-spring-boot','scheduling-with-scheduled','async-processing-with-async','spring-events','sending-email','swagger-and-openapi-documentation','spring-aop','interceptors-and-filters','rate-limiting','introduction-to-microservices-with-spring-boot','kafka-with-spring-boot','docker-for-spring-boot','deploying-spring-boot-application','spring-boot-interview-questions','spring-boot-mini-project']) s, unnest(array['website','mobile']) p where public.learning_topic_content('spring-boot-tutorial', s, p) is not null)::text),
  ('topic practice listings', (select coalesce(sum(jsonb_array_length(coalesce(public.learning_topic_practice('spring-boot-tutorial', s, 'mobile') -> 'mock_tests', '[]'::jsonb))), 0) from unnest(array['what-is-spring-boot','spring-vs-spring-boot','installing-jdk-and-ide-for-spring-boot','creating-a-project-with-spring-initializr','spring-boot-project-structure','maven-pom-xml-explained','spring-boot-starters','auto-configuration','running-a-spring-boot-application','spring-boot-devtools','inversion-of-control','dependency-injection','spring-beans','bean-scopes','bean-lifecycle','component-scan','configuration-and-bean','constructor-vs-setter-vs-field-injection','autowired-and-qualifier','primary-annotation','spring-profiles','application-properties-vs-application-yml','value-annotation','configuration-properties','externalized-configuration','logging-in-spring-boot','spring-boot-actuator','spring-mvc-architecture','controller-vs-rest-controller','request-mapping','get-post-put-delete-mapping','path-variable','request-param','request-body','responseentity','http-status-codes-in-spring-boot','dto-pattern','building-a-complete-crud-rest-api','pagination-and-sorting','file-upload-and-download','resttemplate','webclient-in-spring-boot','cors-in-spring-boot','bean-validation','custom-validation-annotation','exception-handling-in-spring-boot','controller-advice-and-exception-handler','custom-exception-classes','standard-api-error-response','jdbc-vs-jpa-vs-hibernate','connecting-spring-boot-to-mysql','connecting-spring-boot-to-postgresql','h2-in-memory-database','jpa-entity','primary-key-generation-strategies','jparepository','derived-query-methods','query-with-jpql-and-native-sql','one-to-one-mapping','one-to-many-and-many-to-one-mapping','many-to-many-mapping','lazy-vs-eager-loading','n-plus-1-problem','transactional','auditing-with-created-date','database-migration-with-flyway','soft-delete','spring-security-basics','authentication-vs-authorization','password-encoding-with-bcrypt','jwt-authentication','role-based-authorization','method-level-security','refresh-token','unit-testing-with-junit-5','mockito-in-spring-boot','spring-boot-test','web-mvc-test-and-mockmvc','data-jpa-test','testcontainers-basics','caching-in-spring-boot','scheduling-with-scheduled','async-processing-with-async','spring-events','sending-email','swagger-and-openapi-documentation','spring-aop','interceptors-and-filters','rate-limiting','introduction-to-microservices-with-spring-boot','kafka-with-spring-boot','docker-for-spring-boot','deploying-spring-boot-application','spring-boot-interview-questions','spring-boot-mini-project']) s)::text),
  ('mock_test_detail',     (select count(*) from unnest(array['what-is-spring-boot','spring-vs-spring-boot','installing-jdk-and-ide-for-spring-boot','creating-a-project-with-spring-initializr','spring-boot-project-structure','maven-pom-xml-explained','spring-boot-starters','auto-configuration','running-a-spring-boot-application','spring-boot-devtools','inversion-of-control','dependency-injection','spring-beans','bean-scopes','bean-lifecycle','component-scan','configuration-and-bean','constructor-vs-setter-vs-field-injection','autowired-and-qualifier','primary-annotation','spring-profiles','application-properties-vs-application-yml','value-annotation','configuration-properties','externalized-configuration','logging-in-spring-boot','spring-boot-actuator','spring-mvc-architecture','controller-vs-rest-controller','request-mapping','get-post-put-delete-mapping','path-variable','request-param','request-body','responseentity','http-status-codes-in-spring-boot','dto-pattern','building-a-complete-crud-rest-api','pagination-and-sorting','file-upload-and-download','resttemplate','webclient-in-spring-boot','cors-in-spring-boot','bean-validation','custom-validation-annotation','exception-handling-in-spring-boot','controller-advice-and-exception-handler','custom-exception-classes','standard-api-error-response','jdbc-vs-jpa-vs-hibernate','connecting-spring-boot-to-mysql','connecting-spring-boot-to-postgresql','h2-in-memory-database','jpa-entity','primary-key-generation-strategies','jparepository','derived-query-methods','query-with-jpql-and-native-sql','one-to-one-mapping','one-to-many-and-many-to-one-mapping','many-to-many-mapping','lazy-vs-eager-loading','n-plus-1-problem','transactional','auditing-with-created-date','database-migration-with-flyway','soft-delete','spring-security-basics','authentication-vs-authorization','password-encoding-with-bcrypt','jwt-authentication','role-based-authorization','method-level-security','refresh-token','unit-testing-with-junit-5','mockito-in-spring-boot','spring-boot-test','web-mvc-test-and-mockmvc','data-jpa-test','testcontainers-basics','caching-in-spring-boot','scheduling-with-scheduled','async-processing-with-async','spring-events','sending-email','swagger-and-openapi-documentation','spring-aop','interceptors-and-filters','rate-limiting','introduction-to-microservices-with-spring-boot','kafka-with-spring-boot','docker-for-spring-boot','deploying-spring-boot-application','spring-boot-interview-questions','spring-boot-mini-project']) s where public.mock_test_detail('pt-sb-' || s, 'mobile') is not null)::text),
  ('sitemap rows',         (select count(*) from public.learning_sitemap('website') m where m.grid_slug = 'spring-boot-tutorial')::text),
  ('search hits',          (select count(*) from public.learning_search('spring boot', 'mobile', 50) h where h.grid_slug = 'spring-boot-tutorial')::text),
  ('table: grid',          (select count(*) from public.learning_grids where slug = 'spring-boot-tutorial')::text),
  ('table: topics',        (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial')::text),
  ('table: content',       (select count(*) from public.learning_contents where metadata ->> 'source' = 'spring_boot_seed')::text),
  ('table: mock tests',    (select count(*) from public.practice_tests where id like 'pt-sb-%')::text),
  ('table: MCQs',          (select count(*) from public.test_questions where test_id like 'pt-sb-%')::text)
) as t(check_name, actual);
reset role;
do $$
begin
  perform set_config('request.jwt.claim.sub', '', false);
  perform set_config('request.jwt.claims', '', false);
  perform set_config('request.jwt.claim.role', '', false);
end
$$;

-- ===== the ONLY result worth looking at — every check, any failure sorted straight to the top =====
select actor, check_name, actual, expected, ok
from sb_check_results
order by (not ok) desc, (actor <> 'owner'), actor, check_name;

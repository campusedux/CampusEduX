# Spring Boot Tutorial: progress

Course grid `spring-boot-tutorial`, 95 topics in 9 groups. Source of truth: `manifest.json` + `lessons/`.
The course teaches **Spring Boot 4.1 with Java 21** (owner decision 2026-09-26: start.spring.io only offers
4.x, and 3.5.16 of June 2026 was the last 3.x release). It is created **hidden**
(`show_on_website = false`, `show_on_mobile = false`) and stays hidden until the first 10 topics are approved.

## Workflow per batch

1. Write `lessons/<slug>.md`, `<slug>.practice.md` (practical topics), `<slug>.quiz.json`; set the manifest entry
   (`status: written`, `batch`, `description`, `practical`, `er`, `related`) and `batches["N"]` numbers.
2. Compile and run every code block that has a `**File:**` label (JDK 21 + Maven, Spring Boot 4.1.1).
   Labels: `` **File:** `pom.xml` ``, `` **File:** `Name.java` in package `com.x.y` ``,
   `` **File:** `name.ext` in `src/main/resources[/static]` ``.
3. `node scripts/verify-spring-boot-lessons.mjs --batch N`
4. `node scripts/build-spring-boot-seed.mjs --batch N` writes the mobile/admin twin migrations, the rollback
   file in `mobile-app/supabase/rollbacks/`, and appends `chain_order.txt`.
5. Local Postgres only: dry run (apply x2 + twin, re-apply is a byte-level no-op, rollback x2 back to the
   baseline, re-apply) and `mobile-app/supabase/tests/harness/run_tests.sh`.
6. Website: `npm run typecheck && npm run lint && npm test && npm run build`; phone-width check at 390/360 px.
7. Owner applies the SQL. Nothing is ever applied to the linked database from this workflow.

## Status

| # | Group | Topic | Slug | Batch | Words | Status |
|---|---|---|---|---|---|---|
| 1 | Getting Started | What is Spring Boot | `what-is-spring-boot` | 1 | 1488 | Style approved; SQL not applied |
| 2 | Getting Started | Spring vs Spring Boot | `spring-vs-spring-boot` | 2 | 1318 | Written, awaiting review |
| 3 | Getting Started | Installing JDK and IDE for Spring Boot | `installing-jdk-and-ide-for-spring-boot` | 2 | 1317 | Written, awaiting review |
| 4 | Getting Started | Creating a Project with Spring Initializr | `creating-a-project-with-spring-initializr` | 2 | 1309 | Written, awaiting review |
| 5 | Getting Started | Spring Boot Project Structure | `spring-boot-project-structure` | 2 | 1281 | Written, awaiting review |
| 6 | Getting Started | Maven pom.xml Explained | `maven-pom-xml-explained` | 2 | 1271 | Written, awaiting review |
| 7 | Getting Started | Spring Boot Starters | `spring-boot-starters` | 3 | 1257 | Written, awaiting review |
| 8 | Getting Started | Auto Configuration | `auto-configuration` | 3 | 1205 | Written, awaiting review |
| 9 | Getting Started | Running a Spring Boot Application | `running-a-spring-boot-application` | 3 | 1206 | Written, awaiting review |
| 10 | Getting Started | Spring Boot DevTools | `spring-boot-devtools` | 3 | 1213 | Written, awaiting review |
| 11 | Core Concepts | Inversion of Control | `inversion-of-control` | 4 | 1406 | Written and verified; SQL not applied |
| 12 | Core Concepts | Dependency Injection | `dependency-injection` | 4 | 1386 | Written and verified; SQL not applied |
| 13 | Core Concepts | Spring Beans | `spring-beans` | 4 | 1391 | Written and verified; SQL not applied |
| 14 | Core Concepts | Bean Scopes | `bean-scopes` | 4 | 1408 | Written and verified; SQL not applied |
| 15 | Core Concepts | Bean Lifecycle | `bean-lifecycle` | 4 | 1322 | Written and verified; SQL not applied |
| 16 | Core Concepts | Component Scan | `component-scan` | 4 | 1347 | Written and verified; SQL not applied |
| 17 | Core Concepts | @Configuration and @Bean | `configuration-and-bean` | 4 | 1374 | Written and verified; SQL not applied |
| 18 | Core Concepts | Constructor vs Setter vs Field Injection | `constructor-vs-setter-vs-field-injection` | 4 | 1411 | Written and verified; SQL not applied |
| 19 | Core Concepts | @Autowired and @Qualifier | `autowired-and-qualifier` | 4 | 1344 | Written and verified; SQL not applied |
| 20 | Core Concepts | @Primary Annotation | `primary-annotation` | 4 | 1245 | Written and verified; SQL not applied |
| 21 | Core Concepts | Spring Profiles | `spring-profiles` | 4 | 1343 | Written and verified; SQL not applied |
| 22 | Configuration | application.properties vs application.yml | `application-properties-vs-application-yml` | 5 | 1305 | Written and verified; SQL not applied |
| 23 | Configuration | @Value Annotation | `value-annotation` | 5 | 1242 | Written and verified; SQL not applied |
| 24 | Configuration | @ConfigurationProperties | `configuration-properties` | 5 | 1255 | Written and verified; SQL not applied |
| 25 | Configuration | Externalized Configuration | `externalized-configuration` | 5 | 1277 | Written and verified; SQL not applied |
| 26 | Configuration | Logging in Spring Boot | `logging-in-spring-boot` | 5 | 1336 | Written and verified; SQL not applied |
| 27 | Configuration | Spring Boot Actuator | `spring-boot-actuator` | 5 | 1253 | Written and verified; SQL not applied |
| 28 | REST API | Spring MVC Architecture | `spring-mvc-architecture` | 6 | 1300 | Written and verified; SQL not applied |
| 29 | REST API | @Controller vs @RestController | `controller-vs-rest-controller` | 6 | 1217 | Written and verified; SQL not applied |
| 30 | REST API | @RequestMapping | `request-mapping` | 6 | 1224 | Written and verified; SQL not applied |
| 31 | REST API | GET POST PUT DELETE Mapping | `get-post-put-delete-mapping` | 6 | 1305 | Written and verified; SQL not applied |
| 32 | REST API | @PathVariable | `path-variable` | 6 | 1252 | Written and verified; SQL not applied |
| 33 | REST API | @RequestParam | `request-param` | 6 | 1251 | Written and verified; SQL not applied |
| 34 | REST API | @RequestBody | `request-body` | 6 | 1211 | Written and verified; SQL not applied |
| 35 | REST API | ResponseEntity | `responseentity` | 6 | 1210 | Written and verified; SQL not applied |
| 36 | REST API | HTTP Status Codes in Spring Boot | `http-status-codes-in-spring-boot` | 6 | 1482 | Written and verified; SQL not applied |
| 37 | REST API | DTO Pattern | `dto-pattern` | 6 | 1458 | Written and verified; SQL not applied |
| 38 | REST API | Building a Complete CRUD REST API | `building-a-complete-crud-rest-api` | 6 | 1286 | Written and verified; SQL not applied |
| 39 | REST API | Pagination and Sorting | `pagination-and-sorting` | 7 | 1492 | Written and verified; SQL not applied |
| 40 | REST API | File Upload and Download | `file-upload-and-download` | 7 | 1449 | Written and verified; SQL not applied |
| 41 | REST API | RestTemplate | `resttemplate` | 7 | 1393 | Written and verified; SQL not applied |
| 42 | REST API | WebClient in Spring Boot | `webclient-in-spring-boot` | 7 | 1380 | Written and verified; SQL not applied |
| 43 | REST API | CORS in Spring Boot | `cors-in-spring-boot` | 7 | 1289 | Written and verified; SQL not applied |
| 44 | Validation and Errors | Bean Validation | `bean-validation` | 8 | 1358 | Written and verified; SQL not applied |
| 45 | Validation and Errors | Custom Validation Annotation | `custom-validation-annotation` | 8 | 1281 | Written and verified; SQL not applied |
| 46 | Validation and Errors | Exception Handling in Spring Boot | `exception-handling-in-spring-boot` | 8 | 1412 | Written and verified; SQL not applied |
| 47 | Validation and Errors | @ControllerAdvice and @ExceptionHandler | `controller-advice-and-exception-handler` | 8 | 1294 | Written and verified; SQL not applied |
| 48 | Validation and Errors | Custom Exception Classes | `custom-exception-classes` | 8 | 1379 | Written and verified; SQL not applied |
| 49 | Validation and Errors | Standard API Error Response | `standard-api-error-response` | 8 | 1473 | Written and verified; SQL not applied |
| 50 | Database | JDBC vs JPA vs Hibernate | `jdbc-vs-jpa-vs-hibernate` | 9 | 1477 | Written and verified; SQL not applied |
| 51 | Database | Connecting Spring Boot to MySQL | `connecting-spring-boot-to-mysql` | 9 | 1430 | Written and verified; SQL not applied |
| 52 | Database | Connecting Spring Boot to PostgreSQL | `connecting-spring-boot-to-postgresql` | 9 | 1384 | Written and verified; SQL not applied |
| 53 | Database | H2 In-Memory Database | `h2-in-memory-database` | 9 | 1318 | Written and verified; SQL not applied |
| 54 | Database | JPA Entity and @Entity | `jpa-entity` | 9 | 1312 | Written and verified; SQL not applied |
| 55 | Database | Primary Key Generation Strategies | `primary-key-generation-strategies` | 9 | 1408 | Written and verified; SQL not applied |
| 56 | Database | JpaRepository | `jparepository` | 9 | 1236 | Written and verified; SQL not applied |
| 57 | Database | Derived Query Methods | `derived-query-methods` | 9 | 1286 | Written and verified; SQL not applied |
| 58 | Database | @Query with JPQL and Native SQL | `query-with-jpql-and-native-sql` | 9 | 1301 | Written and verified; SQL not applied |
| 59 | Database | One to One Mapping | `one-to-one-mapping` | 10 | 1389 | Written and verified; SQL not applied |
| 60 | Database | One to Many and Many to One Mapping | `one-to-many-and-many-to-one-mapping` | 10 | 1353 | Written and verified; SQL not applied |
| 61 | Database | Many to Many Mapping | `many-to-many-mapping` | 10 | 1355 | Written and verified; SQL not applied |
| 62 | Database | Lazy vs Eager Loading | `lazy-vs-eager-loading` | 10 | 1340 | Written and verified; SQL not applied |
| 63 | Database | N+1 Problem | `n-plus-1-problem` | 10 | 1376 | Written and verified; SQL not applied |
| 64 | Database | @Transactional | `transactional` | 10 | 1282 | Written and verified; SQL not applied |
| 65 | Database | Auditing with @CreatedDate | `auditing-with-created-date` | 10 | 1225 | Written and verified; SQL not applied |
| 66 | Database | Database Migration with Flyway | `database-migration-with-flyway` | 10 | 1369 | Written and verified; SQL not applied |
| 67 | Database | Soft Delete | `soft-delete` | 10 | 1216 | Written and verified; SQL not applied |
| 68 | Security | Spring Security Basics | `spring-security-basics` | 11 | 1304 | Written and verified; SQL not applied |
| 69 | Security | Authentication vs Authorization | `authentication-vs-authorization` | 11 | 1297 | Written and verified; SQL not applied |
| 70 | Security | Password Encoding with BCrypt | `password-encoding-with-bcrypt` | 11 | 1488 | Written and verified; SQL not applied |
| 71 | Security | JWT Authentication | `jwt-authentication` | 11 | 1425 | Written and verified; SQL not applied |
| 72 | Security | Role Based Authorization | `role-based-authorization` | 11 | 1457 | Written and verified; SQL not applied |
| 73 | Security | Method Level Security | `method-level-security` | 11 | 1300 | Written and verified; SQL not applied |
| 74 | Security | Refresh Token | `refresh-token` | 11 | 1403 | Written and verified; SQL not applied |
| 75 | Testing | Unit Testing with JUnit 5 | `unit-testing-with-junit-5` | 12 | 1210 | Written and verified; SQL not applied |
| 76 | Testing | Mockito in Spring Boot | `mockito-in-spring-boot` | 12 | 1267 | Written and verified; SQL not applied |
| 77 | Testing | @SpringBootTest | `spring-boot-test` | 12 | 1280 | Written and verified; SQL not applied |
| 78 | Testing | @WebMvcTest and MockMvc | `web-mvc-test-and-mockmvc` | 12 | 1239 | Written and verified; SQL not applied |
| 79 | Testing | @DataJpaTest | `data-jpa-test` | 12 | 1206 | Written and verified; SQL not applied |
| 80 | Testing | Testcontainers Basics | `testcontainers-basics` | 12 | 1218 | Written and verified; SQL not applied |
| 81 | Production | Caching in Spring Boot | `caching-in-spring-boot` | 13 | 1293 | Written and verified; SQL not applied |
| 82 | Production | Scheduling with @Scheduled | `scheduling-with-scheduled` | 13 | 1365 | Written and verified; SQL not applied |
| 83 | Production | Async Processing with @Async | `async-processing-with-async` | 13 | 1268 | Written and verified; SQL not applied |
| 84 | Production | Spring Events | `spring-events` | 13 | 1225 | Written and verified; SQL not applied |
| 85 | Production | Sending Email | `sending-email` | 13 | 1215 | Written and verified; SQL not applied |
| 86 | Production | Swagger and OpenAPI Documentation | `swagger-and-openapi-documentation` | 13 | 1266 | Written and verified; SQL not applied |
| 87 | Production | Spring AOP | `spring-aop` | 13 | 1371 | Written and verified; SQL not applied |
| 88 | Production | Interceptors and Filters | `interceptors-and-filters` | 13 | 1295 | Written and verified; SQL not applied |
| 89 | Production | Rate Limiting | `rate-limiting` | 14 | 1414 | Written and verified; SQL not applied |
| 90 | Production | Introduction to Microservices with Spring Boot | `introduction-to-microservices-with-spring-boot` | 14 | 1432 | Written and verified; SQL not applied |
| 91 | Production | Kafka with Spring Boot | `kafka-with-spring-boot` | 14 | 1410 | Written and verified; SQL not applied |
| 92 | Production | Docker for Spring Boot | `docker-for-spring-boot` | 14 | 1460 | Written and verified; SQL not applied |
| 93 | Production | Deploying Spring Boot Application | `deploying-spring-boot-application` | 14 | 1498 | Written and verified; SQL not applied |
| 94 | Production | Spring Boot Interview Questions | `spring-boot-interview-questions` | 14 | 1424 | Written and verified; SQL not applied |
| 95 | Production | Spring Boot Mini Project | `spring-boot-mini-project` | 14 | 1493 | Written and verified; SQL not applied |

All 95 topics are written. Topics 11-95 were written in one pass (2026-09-27) and every Java, XML and properties block was compiled with JDK 21 + Boot 4.1.1; outputs come from real runs unless a lesson marks them "typical" (Docker, MySQL, Testcontainers, Kafka broker cases).

## Batches

| Batch | Mobile / admin migration | Rollback | Topics | Applied to production |
|---|---|---|---|---|
| 1 | `0124_seed_spring_boot_tutorial_batch01.sql` / `096_…` | `rollbacks/0124_…_rollback.sql` (removes the whole course) | 1-1 (1) | No |
| 2 | `0125_seed_spring_boot_tutorial_batch02.sql` / `097_…` | `rollbacks/0125_…_rollback.sql` (removes only batch 02) | 2-6 (5) | No |
| 3 | `0126_seed_spring_boot_tutorial_batch03.sql` / `098_…` | `rollbacks/0126_…_rollback.sql` (removes only batch 03) | 7-10 (4) | No |
| 4 | `0127_seed_spring_boot_tutorial_batch04.sql` / `099_…` | `rollbacks/0127_…_rollback.sql` (removes only batch 04) | 11-21 (11) | No |
| 5 | `0128_seed_spring_boot_tutorial_batch05.sql` / `100_…` | `rollbacks/0128_…_rollback.sql` (removes only batch 05) | 22-27 (6) | No |
| 6 | `0129_seed_spring_boot_tutorial_batch06.sql` / `101_…` | `rollbacks/0129_…_rollback.sql` (removes only batch 06) | 28-38 (11) | No |
| 7 | `0130_seed_spring_boot_tutorial_batch07.sql` / `102_…` | `rollbacks/0130_…_rollback.sql` (removes only batch 07) | 39-43 (5) | No |
| 8 | `0131_seed_spring_boot_tutorial_batch08.sql` / `103_…` | `rollbacks/0131_…_rollback.sql` (removes only batch 08) | 44-49 (6) | No |
| 9 | `0132_seed_spring_boot_tutorial_batch09.sql` / `104_…` | `rollbacks/0132_…_rollback.sql` (removes only batch 09) | 50-58 (9) | No |
| 10 | `0133_seed_spring_boot_tutorial_batch10.sql` / `105_…` | `rollbacks/0133_…_rollback.sql` (removes only batch 10) | 59-67 (9) | No |
| 11 | `0134_seed_spring_boot_tutorial_batch11.sql` / `106_…` | `rollbacks/0134_…_rollback.sql` (removes only batch 11) | 68-74 (7) | No |
| 12 | `0135_seed_spring_boot_tutorial_batch12.sql` / `107_…` | `rollbacks/0135_…_rollback.sql` (removes only batch 12) | 75-80 (6) | No |
| 13 | `0136_seed_spring_boot_tutorial_batch13.sql` / `108_…` | `rollbacks/0136_…_rollback.sql` (removes only batch 13) | 81-88 (8) | No |
| 14 | `0137_seed_spring_boot_tutorial_batch14.sql` / `109_…` | `rollbacks/0137_…_rollback.sql` (removes only batch 14) | 89-95 (7) | No |

Apply in numeric order (0124 to 0137), mobile files only, each in one transaction. Roll back in reverse.
After applying, run `mobile-app/supabase/checks/spring_boot_hidden_check.sql` (read-only): all 33 rows must say ok = true (expects 95 topics / 186 blocks / 95 tests / 475 MCQs).
Local evidence (2026-09-27): all 14 batches applied twice + admin twins gave identical rows, rollback x2 returned 8 tables byte for byte to baseline, re-apply restored; harness green.

## Before making the course visible

- All 95 topics written; the owner has reviewed them and applied 0124 to 0137 with every check row ok = true.
- All Related Topics links now resolve (verify shows 0 broken-link warnings).
- Switch on the grid **and** its mock tests together. The test table's RLS does not follow the grid, so
  each `pt-sb-*` test copies the grid's hidden flags when it is created.

## Run button rule (website + mobile, 2026-09-26)

Java code shows Run only when every import starts with `java.`, it uses no annotations other than the JDK's
own, and no fully-qualified third-party names (comments, strings and the snippet's own `package` line are
ignored). Other languages are unchanged. A JDK-only block without `main()` (for example a lone record) still
shows Run, exactly as Java course fragments always have.

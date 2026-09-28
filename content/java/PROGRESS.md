# Java Tutorials lesson rewrite: progress

This rewrites the thin lessons of the existing `java-tutorial` course, seeded by 0047/024, in the Spring Boot teacher
style. The rules are in `STYLE_GUIDE.md`, and the source of truth is `manifest.json` plus `lessons/`. Topic ids,
slugs, titles, sections, order and publish state never change. Only the lesson body and `short_description` are
updated in place. New rows are a Practice Problems block (`java_practice_seed`, `origin: java_lesson_rewrite`) and
a topic mock test `pt-java-<slug>`.

## Workflow per batch

1. Write `lessons/<slug>.md`, `.meta.json` (description + related), `.practice.md` and `.quiz.json` (as the manifest
   flags say), and add the batch's migration numbers to `manifest.batches`.
2. `node scripts/verify-java-lessons.mjs --batch N`: content rules, plus every program compiled with
   `javac --release 11`, run, and its quoted output diffed against real stdout.
3. `node scripts/build-java-seed.mjs --batch N` writes the mobile/admin twin migrations, the rollback in
   `mobile-app/supabase/rollbacks/` and the read-only pre-check in `mobile-app/supabase/checks/`, and appends
   `chain_order.txt`.
4. Local Postgres only:
   - Dry run: apply x2 plus the twin, check that a re-apply is a byte-level no-op and that the guard refuses an
     edited body, run the rollback x2 back to the baseline, then re-apply.
   - `tests/harness/make_template.sh` + `run_tests.sh`.
   - A render check of every page at 390/360 px against the local DB.
5. The owner runs the pre-check (every row must say `ok = true`), then applies the migration. Nothing is applied
   to the linked database from this workflow. The website picks up the change through ISR (`revalidate = 300`),
   and the sitemap lastmod follows `learning_topics.updated_at`.

## Status

Words = prose words outside code fences (target 1200-1500).

| # | Topic | Slug | Batch | Words | Practice | Test | Status |
|---|---|---|---|---|---|---|---|
| 1 | HashMap | `hashmap` | 1 | 1457 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 2 | ArrayList | `arraylist` | 1 | 1257 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 3 | Collection Framework | `collection-framework` | 1 | 1254 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 4 | Stream API | `stream-api` | 1 | 1291 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 5 | Lambda Expressions | `lambda-expressions` | 1 | 1331 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 6 | Constructors | `constructors` | 1 | 1396 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 7 | Inheritance | `inheritance` | 1 | 1424 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 8 | Polymorphism | `polymorphism` | 1 | 1286 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 9 | Abstraction | `abstraction` | 1 | 1314 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 10 | Interface | `interface` | 1 | 1225 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 11 | Abstract Class | `abstract-class` | 1 | 1362 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 12 | static Keyword | `static-keyword` | 1 | 1290 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 13 | this Keyword | `this-keyword` | 1 | 1254 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 14 | Method Overloading | `method-overloading` | 1 | 1264 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 15 | Method Overriding | `method-overriding` | 1 | 1273 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 16 | String | `string` | 1 | 1415 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 17 | Exception | `exception` | 1 | 1424 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 18 | try-catch | `try-catch` | 1 | 1252 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 19 | Thread | `thread` | 1 | 1339 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 20 | JDK, JRE and JVM | `jdk-jre-and-jvm` | 1 | 1488 | existing (0070) | existing (0070) | Written and verified; SQL not applied |
| 21 | LinkedList | `linkedlist` | 2 | 1439 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 22 | HashSet | `hashset` | 2 | 1304 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 23 | TreeMap | `treemap` | 2 | 1350 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 24 | TreeSet | `treeset` | 2 | 1309 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 25 | Iterator | `iterator` | 2 | 1283 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 26 | Comparable | `comparable` | 2 | 1396 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 27 | Comparator | `comparator` | 2 | 1362 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 28 | Generics | `generics` | 2 | 1316 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 29 | Wrapper Classes | `wrapper-classes` | 2 | 1285 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 30 | Enum | `enum` | 2 | 1302 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 31 | Access Modifiers | `access-modifiers` | 2 | 1484 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 32 | Encapsulation | `encapsulation` | 2 | 1421 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 33 | final Keyword | `final-keyword` | 2 | 1439 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 34 | super Keyword | `super-keyword` | 2 | 1388 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 35 | StringBuilder | `stringbuilder` | 2 | 1443 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 36 | String Pool | `string-pool` | 2 | 1458 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 37 | Synchronization | `synchronization` | 2 | 1398 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 38 | Executor Framework | `executor-framework` | 2 | 1332 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 39 | Garbage Collection | `garbage-collection` | 2 | 1455 | 2 problems | 10 MCQs | Written and verified; SQL not applied |
| 40 | JDBC | `jdbc` | 2 | 1319 | 2 problems | 10 MCQs | Written and verified; SQL not applied |

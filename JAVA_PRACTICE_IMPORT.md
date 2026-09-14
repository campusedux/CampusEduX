# Java Tutorials — MCQ tests + coding / practice problems

Adds topic-level **Mock Tests**, **Coding Problems** and **Practice Problems** to
the existing **Java Tutorials** Learning grid (`java-tutorial`, 14 sections /
150 topics, seeded by `admin 024 / mobile 0047`). **No application code changed** —
this is a series of guarded, idempotent DB seed migration **pairs**, one per
section, that reuse the `learning_*` tables plus `practice_tests` /
`test_questions` (topic Mock Tests) and `dsa_problems` (topic Coding Problems)
from migration `admin 025 / mobile 0048`.

Each Java topic renders, with the *existing* Learning topic page, as:

**Notes → Practice Problems (theory topics only) → 10-question Mock Test →
4 Coding Problems (coding topics)**

using the existing `<Markdown>` renderer, `<TopicPractice>` block, mock-test
engine (`MockTestRunner` + `submit_test_attempt`), coding-problem route
(`/coding-problems/[slug]` — Run via `/api/compiler/run`, Run Tests via
`/api/coding-problems/judge`), admin `PracticeManager`, mobile read-only screens,
global search (`learning_search`) and `sitemap.ts`. **Zero new components,
routes, tables, RLS or RPCs.**

## Model

| Item | Where it lives | Notes |
|---|---|---|
| Mock Test (per topic) | `practice_tests` row, `learning_topic_id` set, `category='aptitude'`, 10 Q / 10 min | id `pt-java-<topic-slug>` |
| MCQ | `test_questions` row | id `tq-java-<topic-slug>-<1..10>`, `options` = 4-string JSON array, `correct_index` 0..3, `explanation` filled |
| Coding Problem | `dsa_problems` row, `topic_id IS NULL` + `learning_topic_id` set, `supported_languages = ['java']` | id `cp-java-<topic-slug>-<1..4>`, global slug `java-<topic-slug>-<name>` |
| Practice Problem set (theory topics) | 2nd `learning_contents` block, `heading='Practice Problems'`, `metadata.source='java_practice_seed'`, `sort_order=1` | renders under the notes; 4 written exercises + answers |

All rows: `status='published'`, `is_premium=false`, shown on website + mobile.
Coding problems are authored to **Java 11** (`javac --release 11`); every
reference solution + example + test case is compiled and executed with a real
JDK before it ships. I/O is prompt-free `Scanner`/stdout, exact-match under the
judge's `normalizeOutput`.

## Idempotency & safety

- Deterministic string ids + `on conflict (id) do nothing` for tests / questions
  / problems — re-running never duplicates and never changes an admin's later
  publish / premium / visibility edits.
- Coding-problem `slug` insert is skipped if the slug is already taken by any
  `dsa_problems` row.
- The Practice-Problem content block is keyed by the partial unique index
  `learning_contents_java_practice_key` (created `if not exists`); a re-run
  refreshes only that block's body — it never touches migration 024's notes
  block (`metadata.source='java_tutorial_seed'`).
- 100% additive: no schema / RLS / function / app-code change. Guarded so it is
  safe to run before or after its twin and safe to re-run. Each pair's final
  `do $val$` block raises if the expected counts are not met.

## Apply order (owner)

For each pair below, apply **either** the `admin` file **or** the `mobile` twin
**once** (identical body), via Supabase SQL Editor / `supabase db push`, after
the Learning chain (`0042/019 → 0045/022`), the topic-practice pair
(`0048/025`) **and** the Java Tutorials content seed (`0047/024`).

## Sections

| Pair (admin / mobile) | Section | Topics | Mock Tests · MCQs | Coding Problems | Practice Problems | Status |
|---|---|---|---|---|---|---|
| `042` / `0070` | Introduction to Java | 14 | 14 · 140 | 28 (7 coding topics) | 28 (7 theory topics) | **done** |
| `043` / `0071` | Operators & Input | 9 | 9 · 90 | 32 (8 coding topics) | 4 (1 theory topic — command-line-arguments) | **done** |
| `044` / `0072` | Control Flow | 12 | — | — | — | pending |
| `045` / `0073` | Arrays & Strings | 9 | — | — | — | pending |
| `046` / `0074` | Object-Oriented Programming | 18 | — | — | — | pending |
| `047` / `0075` | Packages & Exception Handling | 9 | — | — | — | pending |
| `048` / `0076` | Collections Framework | 16 | — | — | — | pending |
| `049` / `0077` | Advanced Java | 10 | — | — | — | pending |
| `050` / `0078` | Multithreading | 8 | — | — | — | pending |
| `051` / `0079` | File Handling & JDBC | 12 | — | — | — | pending |
| `052` / `0080` | JVM Internals & Memory | 7 | — | — | — | pending |
| `053` / `0081` | Real-World Java & Best Practices | 7 | — | — | — | pending |
| `054` / `0082` | Practice Programs | 10 | — | — | — | pending |
| `055` / `0083` | Interview Preparation | 9 | — | — | — | pending |
| **Total (planned)** | | **150** | **150 · 1500** | **~480** | **~120** | |

### `042` / `0070` — Introduction to Java (`*_seed_java_practice_introduction_to_java.sql`)

- **Coding topics (4 problems each):** first-java-program, variables, data-types,
  type-casting, constants, keywords-and-identifiers, comments.
- **Theory topics (4 practice problems each):** introduction-to-java,
  features-of-java, java-vs-c-c, jdk-jre-and-jvm, how-java-works, installing-java,
  java-program-structure.
- Verified: `javac --release 11` + `java` on every reference solution against
  every example and test case; PG17 dry-run (apply ×2 + twin) stable at
  14 / 140 / 28 / 7; website · admin · mobile gate suites green (no app code
  touched).

### `043` / `0071` — Operators & Input (`*_seed_java_practice_operators_and_input.sql`)

- **Coding topics (4 problems each):** arithmetic-operators, relational-operators,
  logical-operators, assignment-operators, unary-operators, ternary-operator,
  bitwise-operators, user-input.
- **Theory topic (4 practice problems):** command-line-arguments (values arrive
  via `String[] args`, which the stdin-only judge cannot supply — so it is a
  written-exercise topic, not runnable).
- Verified: `javac --release 11` + `java` on all 32 reference solutions against
  every example and test case; PG17 dry-run (apply ×2 + twin, and applied
  alongside `042`) stable at 9 / 90 / 32 / 1, no id/slug collisions with `042`.

# Global "Practice → Coding Problems"

A **new, global** coding-practice section on the website, kept **separate from
Learning** (`Learning = Tutorials + Notes + MCQ Tests`; `Practice = Coding
Problems + Online Compiler + Submissions`). It **reuses** the existing execution
stack (`/api/compiler/run` → the Paiza / Judge0 / Piston provider), the
coding-problem workspace UI (`coding-problems/[problemSlug]/_components/*`),
Supabase RLS patterns, auth, and the admin panel. The standalone `/compiler` and
the Learning topic-practice route `/coding-problems/<slug>` are **unchanged**.

## Model

| Item | Where it lives | Notes |
|---|---|---|
| Practice **category** | `dsa_topics` row, **`kind='practice'`** + `slug` / `description` / `status` / `show_on_*` | id `dt-practice-<slug>`. Pre-existing `dsa_topics` rows are set to `kind='legacy'` by the migration. |
| Practice **problem** | `dsa_problems` row, **`learning_topic_id IS NULL`** + `topic_id` → a `kind='practice'` category | id `cp-practice-<cat>-<n>`, global slug e.g. `find-the-largest-element`. Satisfies the existing `dsa_problems_home_chk` with **no `dsa_problems` schema change**. Partial unique index `dsa_problems_practice_slug_key` on `lower(slug)` for exactly these rows (coexists with `dsa_problems_cp_slug_key`). |
| **Submission** | **NEW** table `coding_submissions` (owner-only RLS) | one row per "Submit" — `verdict`, `passed`/`total`, `runtime_ms`, `memory_kb`. |
| Solved / Unsolved | existing `user_dsa_progress` (`status in ('solved','attempted')`) — **no change** | the judge/submit route upserts it (`solved` on all-pass, never downgraded). |

All seeded rows: `status='published'`, `is_premium=false`, `supported_languages =
['java','python','c','cpp','javascript']`. Every problem statement is rewritten
to **explicit stdin → stdout** (language-independent), and **every reference
solution + example + hidden test was compiled and executed** in Java 11 / Python
3 / C (gcc `-std=c11`) / C++ (g++ `-std=c++17`) / Node.js before shipping, then
re-verified from the values as stored in the database.

## Migrations (canonical pairs — apply **either** file of a pair, once)

| mobile / admin | What | Status |
|---|---|---|
| `0072_practice_coding.sql` / `044_practice_coding.sql` | Schema — `dsa_topics.kind` + `slug`/`show_on_*`, `coding_submissions` + RLS, 2 slug indexes, 5 read RPCs (`practice_categories`, `practice_problems_list`, `practice_problem_detail`, `practice_problem_run_cases`, `practice_problems_sitemap`). 100% additive, guarded, idempotent. | **done** |
| `0073` / `045` — `arrays` | **Arrays** (20) | **done** |
| `0074` / `046` — `strings` | **Strings** (10) | **done** |
| `0075` / `047` — `searching-and-sorting` | **Searching & Sorting** (15) | **done** |
| `0076` / `048` — `hashing` | **Hashing** (10) | **done** |
| `0077` / `049` — `two-pointer-and-sliding-window` | **Two Pointer & Sliding Window** (5) | **done** |
| `0078` / `050` — `linked-list` | **Linked List** (15) | **done** |
| `0079` / `051` — `stack-and-queue` | **Stack & Queue** (10) | **done** |
| `0080` / `052` — `recursion-and-backtracking` | **Recursion & Backtracking** (10) | **done** |
| `0081` / `053` — `binary-tree` | **Binary Tree** (15) | **done** |
| `0082` / `054` — `binary-search-tree` | **Binary Search Tree** (5) | **done** |
| `0083` / `055` — `heap-and-priority-queue` | **Heap & Priority Queue** (5) | **done** |
| `0084` / `056` — `graph` | **Graph** (10) | **done** |
| `0085` / `057` — `greedy` | **Greedy Algorithms** (5) | **done** |
| `0086` / `058` — `dynamic-programming` | **Dynamic Programming** (5) | **done** |
| `0087` / `059` — `trie` | **Trie** (2) | **done** |
| `0088` / `060` — `bit-manipulation` | **Bit Manipulation** (3) | **done** |
| `0089` / `061` — `math-and-number-theory` | **Math & Number Theory** (5) | **done** |

**17 categories, 150 problems, all shipped.** Each seed pair seeds its own
category row (`dsa_topics`, `kind='practice'`) then its problems — so a pair can
be applied on its own.

## Status — APPLIED TO PRODUCTION (2026-09-08)

The full chain (`0072` schema/RPCs + `0073…0089` seeds) is **applied to the
linked Supabase project `oqwjooaapsotnncmhvtk`** via `supabase db push`.
Live verification: 17 `kind='practice'` categories · 150 practice problems
(81 Easy / 60 Medium / 9 Hard) · per-category counts
`20·10·15·10·5·15·10·10·15·5·5·10·5·5·2·3·5` · 0 duplicate practice slugs · all
5 RPCs resolve (`practice_categories` → 17, `practice_problems_list` total 150,
Hard 9, `graph` 10) · `practice_problems_list` / `practice_problem_detail` never
emit `test_cases` · the 7 pre-existing legacy DSA rows (`p-two-sum`,
`p-best-time`, …, `topic_id='dsa-arrays'`, `learning_topic_id=NULL`) are
**untouched**.

**Slug-index scoping fix (in every seed pair).** `0072`'s
`dsa_problems_practice_slug_key` predicate (`learning_topic_id IS NULL AND
topic_id IS NOT NULL AND slug IS NOT NULL`) also covered those orphaned legacy
DSA rows, so a first push failed on the shared slugs
`best-time-to-buy-and-sell-stock` / `product-of-array-except-self`. Every seed
pair now opens with an idempotent
`drop index if exists public.dsa_problems_practice_slug_key; create unique index
… where … AND id like 'cp-practice-%'` — the predicate is re-scoped to real
practice rows only. `0072`/`044` on disk keep the original (broad) form so their
checksum in `supabase_migrations` is unchanged; the seed corrective narrows it
forward on every environment (fresh or existing). Legacy and practice rows may
now share a slug (`{cp-practice-arrays-17, p-best-time}` etc.).

## Apply order (owner) — already done on the linked project

Apply after the Learning chain (`0042/019 → 0045/022`) and the topic-practice
pair (`0048/025`), via Supabase SQL Editor / `supabase db push`:

```
0072_practice_coding.sql   (admin 044)   -- schema + RPCs, once
0073 .. 0089               (admin 045 .. 061)   -- one seed pair per category, in order
```

Apply **either** file of each pair (the twin is a guarded no-op). Re-running the
whole chain is safe (idempotent) — the seed corrective + `on conflict do
nothing` make it a no-op on an already-seeded database.

## Idempotency & safety

- Deterministic string ids + `on conflict (id) do nothing` for categories and
  problems — re-running never duplicates and never changes an admin's later
  publish / premium / visibility edits.
- `dsa_topics.kind` defaults **existing** rows to `'legacy'`, then flips the
  column default to `'practice'` for new inserts — a historical DSA topic can
  never be mistaken for a practice category.
- 100% additive: no `DROP` of anything holding data, no FK removed. (The seed
  corrective `DROP INDEX` only ever drops/recreates the empty-at-that-point
  partial index `dsa_problems_practice_slug_key` — no data.) Every pair's final
  `do $val$` block raises if the expected counts are not met.
- Hidden judge cases (`dsa_problems.test_cases`) are **never** returned by
  `practice_problem_detail`; only the server-side `/api/practice/judge` and
  `/api/practice/submit` routes read them (via `practice_problem_run_cases`,
  premium-gated) and strip hidden inputs/outputs from the HTTP response.

## Website

New under `/practice/*` (existing routes untouched):

- `/practice` — hub (Coding Problems / Online Compiler / Submissions + topic chips).
- `/practice/problems` — paginated, filterable list (difficulty · topic · language · name · Solved/Unsolved). Filter + pagination are **server-side** (`practice_problems_list` RPC); the browser never holds the whole catalogue or any hidden test case.
- `/practice/problems/<slug>` — the same IDE workspace as `/coding-problems/<slug>` (`CodingProblemBody` reused), with a **Submit** action that persists the attempt. One problem, all 5 languages.
- `/practice/compiler` — renders the existing `CompilerWorkspace` unchanged.
- `/practice/submissions` — the signed-in user's own history (owner-only RLS).
- `/api/practice/judge` (Run Tests, no persistence) and `/api/practice/submit`
  (auth-gated; writes `coding_submissions` + upserts `user_dsa_progress`).

Shared-component changes are additive and backward-compatible: an optional
`memoryKb` on `NormalizedRun` (Judge0 fills it), and optional `nav` /
`judgeEndpoint` / `submitEndpoint` props on `CodingProblemBody` /
`CodingProblemWorkspace` / `CompilerPanel` / `CompilerToolbar` /
`ProblemPanel` — the Learning route passes none and behaves exactly as before.

Nav: **Practice** added to the desktop header (after Learning) and the mobile
drawer. Sitemap + `POST /api/revalidate` (`"practice"` tag) updated.

## Admin

Managed inside the existing **Learning** permission module (no new admin
system):

- `/learning/practice` — problem list + filters + a **Categories** manager.
- `/learning/practice/new` and `/learning/practice/<id>` — the same
  `CodingProblemFields` set as the topic-practice editor, plus a category select.
- A "Coding Practice" card on the `/learning` dashboard.

## Verification (all 150)

- **150 problems × 5 languages = 750 reference solutions**, **~4000 test-case
  runs**, all green — first from the JSON specs (`scratchpad/practice/verify.mjs`),
  then re-verified from the values **as stored in the database** (SQL round-trip).
- Every reference solution compiled + executed under `javac --release 11` + `java`,
  `python3`, `gcc -O2 -std=c11`, `g++ -O2 -std=c++17`, `node`.
- Local PG17 dry run: shim + `0072` + all 17 seed pairs applied **twice**
  (idempotent) — 17 categories / **150 problems** (81 Easy · 60 Medium · 9 Hard),
  per-category counts 20·10·15·10·5·15·10·10·15·5·5·10·5·5·2·3·5, all 5 RPCs
  resolve. Applying **only the admin twins** (044–061) yields the identical result.
- No `dsa_problems` schema change; `dsa_problems_home_chk` and all FKs intact;
  no existing data touched.
- `website/`: `typecheck` + `lint` + `vitest` + `build` green (no app code
  changed by batches 2–5 — migration files only).
- `admin-panel/`: `typecheck` + `lint` + `vitest` + `build` green.

Every problem statement is rewritten to **explicit stdin → stdout**
(language-independent). Data-structure problems (linked list, stack/queue, trees,
BST, heap, graph, trie) are expressed as batch stdin→stdout: read the structure
(e.g. a linked list as `N` + values, a tree in LeetCode level-order form, a graph
as `V E` + edges), apply the operation, print the result. Where an ordering is
otherwise ambiguous the statement pins it (e.g. topological sort = the
lexicographically smallest order; DFS/BFS visit neighbours in ascending order).

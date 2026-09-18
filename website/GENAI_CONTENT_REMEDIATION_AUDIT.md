# CampusEduX — Stage 4B: Generative AI Content & Indexation Remediation

Date: 2026-09-18
Scope: `website/` (Next.js 14), backing content in `mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql` (twin `admin-panel/supabase/migrations/041_...`) and `0068_seed_ai_ml_notes_content.sql` (twin `040_...`). No database migration was created or applied. No content was rewritten, deleted, or fabricated. No AdSense code was added.

Builds on `ADSENSE_READINESS_AUDIT.md` / `CONTENT_SEO_AUDIT_STAGE2.md` / `CONTENT_PROVENANCE_AUDIT.md` / `PRODUCTION_AUDIT_STAGE3_FINAL.md`. This stage independently re-inspected the actual seed SQL and live-queried the real backing Supabase project (via the repo's own `.env.local` anon credentials) rather than assuming those prior reports still hold.

---

## A. Before state

| Cluster | Count | Prior indexability | Prior sitemap status |
|---|---|---|---|
| GenAI tutorial topics | 207 | Indexable (no `robots` logic existed on the topic page at all) | Included unconditionally via `learning_sitemap` |
| GenAI mock tests | 206 | `noindex,nofollow` (hardcoded `export const metadata`, unconditional) | Never included (route absent from `sitemap.ts`) |
| GenAI coding problems | 336 | `noindex,follow` when thin (Stage 3 fix, confirmed still correct) | **Included unconditionally** via `coding_problems_sitemap` — the noindex page-metadata fix and the sitemap were out of sync |

Indexability problems discovered this stage:
1. The Learning topic page (`/learning/[gridSlug]/[topicSlug]`) had no content-quality gate of any kind — every one of the 207 GenAI topics was fully indexable regardless of content.
2. `sitemap.ts` never excluded a page it (or its own route) had separately marked `noindex` — true for both the GenAI coding problems (Stage 3's fix) and, once added, the newly-noindexed GenAI topics. A `noindex` page that's still in `sitemap.xml` actively invites the crawl it's trying to avoid.
3. (New finding, not previously reported) The 196 **AI/ML Notes** coding problems (a different, previously "PASS, not independently reverified" cluster per Stage 2) share the *exact same* empty-field defect as the 336 GenAI ones — see §D.

---

## B. Tutorial classification

Method: read the actual seed SQL verbatim (not the rendered page), then confirmed the same conclusion via a live query against the real backing database. `mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql` inserts a `learning_topics`/`learning_contents` row per topic; grepping for the two most repeated worked-example/filler sentences ("The important lesson is that the technique is a component of a larger system", "Suppose a student is building an AI learning assistant") shows they appear **verbatim, byte-for-byte, in 206 of the file's 207 topic-content inserts**, regardless of the topic's actual subject (confirmed by reading three widely-separated samples: "What is Generative AI," "AI vs ML vs Deep Learning vs Generative AI," and a units-3/17 spread — same skeleton, same sentences, only the topic noun swapped in via `### What Does {Title} Mean?` / `### Why Do We Need {Title}?` headings).

```text
Indexable:            1   (0.5%)
Noindex — thin:               0
Noindex — template/generic: 206  (99.5%)
Noindex — incomplete:          0
Review required:               0
```

**The 1 indexable exception**: `Unit 17 ▸ Course Summary & Project Roadmap` (`/learning/generative-ai/course-summary-and-project-roadmap`) is genuinely original synthesis — a real architecture walkthrough (`User → UI → Backend → … → Monitoring`), a RAG-vs-fine-tuning-vs-prompting-vs-agents comparison, an evaluation checklist, a security checklist, a 7-stage project roadmap, and a 21-item exam checklist. It contains neither marker sentence. This is exactly the kind of subset the brief warned not to lump in with the rest — it is left indexable.

**The 206 template pages**: every one of them follows an identical 13-heading skeleton (`What Does X Mean? / Why Do We Need X? / How It Works / Real-World Examples / Key Characteristics / Advantages and Limitations / Common Misunderstandings / Practical Use / Exam and Viva Preparation / Practice / Quick Revision / Practice task / Quick revision`) where only the topic noun changes. The "real-world example" (a student building an "AI learning assistant") and the closing "important lesson" sentence are word-for-word identical across all 206, confirming this is mail-merge, not differentiated writing. This is unambiguous — not a borderline call — so no topic in this group was marked "Review required."

**Remedy applied**: `generateMetadata()` in `src/app/learning/[gridSlug]/[topicSlug]/page.tsx` now checks the assembled body text for both marker phrases (`isTemplatedGenerativeAiBody()` in the new `src/lib/contentQuality.ts`) and sets `robots: { index: false, follow: true }` when both are present. This is a **content check, not a grid check** — it would stop firing automatically the moment a given topic's body is genuinely rewritten, with no code change needed, and it already correctly leaves the one non-template topic indexable. The database rows, the topic pages themselves, and normal in-product navigation (bookmarks, prev/next, the Learning tree sidebar) are completely unchanged — a logged-in visitor sees the exact same page as before; only the `<meta name="robots">` tag and sitemap membership change.

---

## C. Mock tests

- **Total**: 206 (all Generative AI mock tests, ~2,060 MCQs).
- **Current indexability**: confirmed unchanged and already correct. `src/app/mock-tests/[testId]/page.tsx` line 8 is a **static, unconditional** `export const metadata: Metadata = { robots: { index: false, follow: false } }` plus `export const dynamic = "force-dynamic"` — this applies to every `testId`, before any database call happens, with no code path that could ever miss it. There is no `/mock-tests` index/listing route, no alternate URL that surfaces MCQ content, and the topic-page "Mock Test" card (`_components/TopicPractice.tsx`) only ever renders a title/description/count/duration/difficulty CTA card — never actual question text.
- **Sitemap status**: confirmed absent — `sitemap.ts` has never had a mock-test entry generator.
- **Changes required**: **none.** Verified correct exactly as Stage 1/2 reported; this stage did not touch this cluster's code.

---

## D. Coding problems

- **Total inspected this stage**: all 4 clusters sharing `dsa_problems` — topic-linked Java/Python/DBMS-SQL (~207), AI/ML Notes (196), standalone Practice (150), Generative AI (336).
- **Genuinely useful/indexable**: Java/Python/DBMS-SQL (~207) — confirmed by reading `0050_seed_python_tutorial_content.sql` directly: these rows insert **real per-problem values** (`v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code`) from an actual per-problem data literal, not a fixed empty placeholder. Standalone Practice (150) also has real examples/constraints/starter+solution code (only `hints`/`editorial`/`complexity` are empty — a real gap, not a fabrication risk, and not thin enough to noindex per the existing convention).
- **Thin/noindex (missing-content pattern)**: **532 total**, not 336. Reading `0069_seed_generative_ai_tutorial_content.sql` and `0068_seed_ai_ml_notes_content.sql` directly shows **both** files insert every one of their coding-problem rows with the identical hardcoded literal `'[]'::jsonb, '[]'::jsonb, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, '', '{}'::jsonb` for `examples, constraints, starter_code, hints, test_cases, editorial, solution_code` — confirmed by an exact grep match count: 84 insert blocks × 4 problems in `0069` (336) and 49 × 4 in `0068` (196) = **532**, and a live query against the production database (`dsa_problems` where `topic_id is null and learning_topic_id is not null`) independently returns exactly 532 rows matching this empty-field signature. This resolves Stage 2's open item ("AI/ML Notes coding problems — not independently re-verified this pass") as **FAIL, same pattern as GenAI** — a new finding this stage, not previously reported as confirmed.
- **Missing-content pattern**: every one of the 532 thin rows is missing `examples`, `constraints`, `starter_code`, `hints`, `test_cases`, and `solution_code`; only a generic templated `description` (e.g. *"Write a small Python program that demonstrates the main idea of **Sequence-to-Sequence Models** using a simple example dataset or input."*) and a generic title (*"Sequence-to-Sequence Models — Coding Problem 1"*) are present.
- **Sitemap status**: this was the real, present-tense bug this stage found and fixed. `sitemap.ts` included every `dsa_problems` row returned by `coding_problems_sitemap` (742 total) with **no exclusion**, so all 532 thin rows (not just the 336 GenAI ones) were live-indexable in the sitemap despite the 336 GenAI ones already being marked `noindex` at the page level by Stage 3's fix. Fixed in this stage (§E).

**Stage 3 noindex verification (STEP 2 of this brief)**: the existing per-page fix in `src/app/coding-problems/[problemSlug]/page.tsx` (`isThin = !locked && examples.length===0 && constraints.length===0 && Object.keys(starter_code).length===0`, setting `robots: { index: false, follow: true }`) is **correct and was retained unchanged**:
1. The logic exists, exactly as described in `PRODUCTION_AUDIT_STAGE3_FINAL.md` §13.
2. It triggers on emptiness of `examples`/`constraints`/`starter_code` — the exact three fields confirmed empty on all 532 thin rows.
3. It applies to all 336 GenAI problems (verified: the identical empty-literal insert means every one trips the condition) — and, as a byproduct of being field-based rather than grid-based, correctly also applies to the 196 AI/ML Notes problems, which share the identical defect. This is not scope creep — it is the same check already in production code, now confirmed to behave consistently rather than being GenAI-specific by accident.
4. No indexable problem is misclassified: the ~207 topic-linked (Java/Python/DBMS-SQL) and 150 standalone Practice problems all have at least one of the three fields genuinely populated (confirmed by reading their seed SQL directly, §above), so none of them trip this condition.
5. Canonical URLs are untouched — `alternates.canonical` is set unconditionally from `problem.slug` regardless of the `isThin` branch.
6. `robots.ts` does not disallow `/coding-problems/*`; the per-page metadata is the only (and correct) indexation gate.
7. Metadata (`title`, `description`, OG/Twitter) is emitted correctly in both branches — the thin case still gets a valid (if generic) title/description, never blank tags.
8. Safe for missing/empty records: `getCodingProblem()` returns `null` on any DB error, and the function's own guard (`if (!detail) return { ... robots: { index:false, follow:false } }`) already covers that case.

**No fix, no rewrite** was made to this file. **The only fix this stage made was to `sitemap.ts`**, so it stops listing what this already-correct page logic is telling search engines not to index — see §E.

---

## E. Changes made

| File | Change | Why |
|---|---|---|
| `website/src/lib/contentQuality.ts` (new) | Two small, pure functions: `isTemplatedGenerativeAiBody()` (checks a page's assembled body text for two verbatim marker phrases confirmed, by repo-wide grep, to exist only in the GenAI tutorial seed) and `isThinCodingProblemRow()` (mirrors the Stage-3 `isThin` check on `examples`/`constraints`/`starter_code`/`is_premium`). Shared by both the page-level `generateMetadata()` and `sitemap.ts` so the two can never drift apart — a page marked `noindex` is now guaranteed to also be absent from the sitemap, and vice versa. |
| `website/src/app/learning/[gridSlug]/[topicSlug]/page.tsx` | `generateMetadata()` now sets `robots: { index: false, follow: true }` when the topic's assembled body content matches the GenAI template markers. No other change to this file — content rendering, bookmarks, prev/next nav, and the Mock Test/Coding Problem practice cards are all untouched. | Closes the P0 finding (206 mail-merged GenAI tutorial pages were fully indexable with no gate at all). |
| `website/src/app/sitemap.ts` | Added two read-only lookups: (1) queries `dsa_problems` for the same topic-linked population `coding_problems_sitemap` starts from, applies `isThinCodingProblemRow()`, and skips those slugs when emitting `/coding-problems/*` entries; (2) queries `learning_contents` for the Generative AI grid's topics, applies `isTemplatedGenerativeAiBody()`, and skips those topic slugs when emitting `/learning/generative-ai/*` entries (the grid's own landing page is unaffected). No other sitemap logic changed. | Closes STEP 7's stated principle — a deliberately-`noindex` page must not also be promoted through `sitemap.xml`. This was a real, present-tense gap for the coding-problem cluster (confirmed live: sitemap included all 742 coding-problem URLs, 532 of which are pages that already set `noindex` at the page level) and a preventative fix for the newly-added topic noindex. |
| `website/tests/app/seo-phase3-batch6-shouldfix.test.ts` | Extended that test's hand-rolled fake Supabase client with `.is()`/`.not()` stub methods (returning empty data), matching the new query shape `sitemap.ts` now uses. | The existing test's fixture only stubbed the exact chain shapes `sitemap.ts` used before this stage; it needed extending, not weakening — the test's actual assertion (category `lastModified` correctness) is untouched and still fully enforced. |

**A real production-scale bug found and fixed during implementation, not just design**: an initial version of the `sitemap.ts` fix used `.in("slug", codingProblemSlugs)` with the full ~742-slug list. Tested directly against the live database, this failed with `HeadersOverflowError` (PostgREST/undici reject an ~22.7 KB request URL — anything past a few hundred `.in()` values at this codebase's typical slug length). The final implementation instead queries `dsa_problems` by the same `topic_id is null` condition the RPC itself starts from (a tiny, fixed-shape query, independent of row count), confirmed against the live database to return the correct 532-row thin set with no size ceiling risk as the content grows.

---

## F. Deliberately untouched areas

Confirmed not touched in this stage, by design and by diff review:
- Authentication (Supabase Auth, login/register/session) — no file touched.
- RLS — no migration created or applied; every new query in `sitemap.ts` relies on the *existing* `dsa_problems_select_public` / `learning_contents_select_public` policies (already-published, already-public-facing read patterns identical to what other parts of the codebase already do), reading only non-secret fields for a build-time/request-time boolean decision, never rendering the fetched values to any browser response.
- Payments/Razorpay, wallet, premium logic, custom-project pricing — no file touched.
- User accounts, compiler execution, mobile app, admin authentication — no file touched.
- Unrelated Learning/Practice sections (Java/Python/DBMS/AI-ML-Notes tutorial *content* itself, interview questions) — no seed data, no rendering logic for these clusters changed. (Only their coding-problem *indexation*, where the AI/ML Notes cluster happened to share GenAI's exact empty-field defect, was affected — see §D; no tutorial *prose* for AI/ML Notes was touched or judged.)
- Legal pages, provenance audit, analytics implementation — no file touched.
- AdSense integration — no script, publisher ID, `ads.txt`, or CSP domain was added.
- No Supabase migration was created or applied in this stage.

---

## G. Remaining work

**Content that still needs genuine human/original authoring:**
- 206 of 207 GenAI tutorial topics remain mail-merged template content. They are now safely `noindex,follow` rather than deleted — the underlying `learning_contents` rows are completely untouched, so a future rewrite (topic-by-topic, real explanation of what a transformer/diffusion model/embedding/etc. actually is, per the brief's own framing) simply needs its `body` updated; the noindex gate in `contentQuality.ts` will stop firing automatically for any topic whose body no longer contains the two marker phrases, no code change required.
- 336 of those topics' GenAI coding problems, plus the 196 AI/ML Notes coding problems (532 total), have no real starter code, examples, constraints, or tests. Same remedy path: fill in real per-problem content, or leave as-is (they stay noindex, functional, and retained).
- Standalone Practice's 150 problems still have empty `hints`/`editorial`/`solution_approach` (a P1 quality item from prior stages, unrelated to indexation — untouched this stage).

**Provenance**: unchanged from `CONTENT_PROVENANCE_AUDIT.md` — the GenAI tutorial's source file (`Generative_AI_Full_Syllabus_Detailed_Notes.md`) still has no recorded author or license anywhere in the repo. This stage did not (and could not) resolve that; it's a separate question from the content-quality remediation done here, and only the site owner can answer it.

**Legal owner input**: unrelated to this stage's scope; still open per `LEGAL_OWNER_INPUT_REQUIRED.md` / prior audits (registered address, grievance officer name, governing state).

**Production deployment**: none of this stage's changes are live. `robots`/`sitemap.ts` changes only take effect once deployed and rebuilt (the sitemap is a Next.js static route — regenerated at `next build` time, not per-request — confirmed by inspecting `.next/server/app/sitemap.xml.body` directly; the owner's next deploy is what actually changes the public `sitemap.xml`).

**Other remaining SEO work**: none identified specific to the GenAI cluster beyond what's listed above. General site-wide items (CWV measurement, CSP-for-AdSense, etc.) are out of scope for this stage and unchanged from `PRODUCTION_AUDIT_STAGE3_FINAL.md`.

---

## Confirmation

No content, schema, or seed data was modified to produce this remediation. The only files changed are listed in §E. No AdSense code, `ads.txt`, or publisher ID was added. No deployment was performed.

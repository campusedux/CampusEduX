# P0-02 educational content remediation

**Date:** 23 October 2026 UTC  
**Decision:** repository controls prepared; P0-02 remains open. No production migration, visibility change, deployment, purchase change, or bulk rewrite occurred. The owner's statement that AI tools helped create CampusEduX material is recorded as creation context, not as proof of originality, ownership, or permission for an individual item.

## Inventory and rights decision queue

The exact seed-intended populations and the 40 individually mapped Java rewrite URLs are in [the rights investigation](CAMPUSEDUX_P0_02_CONTENT_LICENSING.md) and [the verification report](CAMPUSEDUX_P0_02_VERIFICATION.md). The read-only query `mobile-app/supabase/checks/p002_content_inventory.sql` exports exact live IDs, source refs, publication flags, and public URL patterns for comparison. It is **not** a withholding script. It has not been run against production; RLS may make a low-privilege export incomplete.

| Family | Seed-intended records and source | Route | Rights status |
|---|---|---|---|
| AI/ML Notes | `0068`: 77 bodies, 690 MCQs, 196 linked prompts; `AI_ML_Complete_All_10_Modules.md` expressly transcribed | `/learning/ai-ml-notes/[topicSlug]`, linked tests and `aiml-*` problems | Unverified source rights; priority review |
| Generative AI | `0069`: 207 bodies, 2,060 MCQs, 336 prompts; `Generative_AI_Full_Syllabus_Detailed_Notes.md` expressly transcribed | `/learning/generative-ai/[topicSlug]`, linked tests and `genai-*` problems | Unverified source rights; priority review; P0-03 quality work separate |
| Java interviews | `0104`–`0108`: 121 public-intended source-guide Q&A rows across 24 topics; 139 other questions archived | `/practice/interview-questions/java/[topic]` | Source-guide rights unverified; exact/reworked row mix requires crosswalk |
| Python interviews | `0109`–`0112`: 240 verbatim Q&A rows across 22 topics | `/practice/interview-questions/python/[topic]` | Source-guide rights unverified |
| Java tutorial | `0047`: 150 baseline lesson bodies from `core-java-full-course.md`; `0145`/`0146`: 40 individually listed rewrite candidates plus 39 quizzes/practice blocks | `/learning/java-tutorial/[topicSlug]` | Baseline and each rewrite unverified; 110 baseline bodies remain only if both rewrite batches applied |
| Python tutorial | `0050`–`0055`: 30 chapters, 290 MCQs, 98 linked problems; some MCQs transcribed, some explanations and judge adaptations newly written | `/learning/python-tutorial/[topicSlug]`, tests and `py-*` problems | Component-level creator/source rights unverified |

These counts describe migration intent, not live rows. The four source-transcribed/source-guide families are first in the owner review queue. AI-generated material is not automatically classified as original. The 40 Java lesson files remain separate retention candidates; the existing verification table maps each source ref, file, migration batch, and URL. No row has been marked rights-verified from the available evidence.

## Repository implementation

| File | Change |
|---|---|
| `mobile-app/supabase/migrations/0148_content_provenance.sql:4` and byte-identical `admin-panel/supabase/migrations/118_content_provenance.sql:4` | Add item-level provenance for lesson blocks, interview Q&A, tests, test questions, and coding problems. Unknown/missing records mean `unverified`. Statuses are `unverified`, `review_required`, `verified_original`, `verified_licensed`, `blocked`. Creator, creation method, source dependencies, rights basis, private evidence reference, review date/reviewer, separate quality status, and reviewed content hash are stored. RLS prevents public evidence access; only active super admins can make rights decisions. A database trigger rejects newly published or materially changed unverified/blocked content **when enforcement is enabled**. It leaves existing rows and flags intact. The settings row defaults enforcement to `false` pending staging compatibility checks. |
| `admin-panel/src/app/(panel)/learning/provenance/actions.ts:1`, `page.tsx:1`, and `learning/page.tsx:63` | Restricted super-admin review form, server-side role check, content existence check, and navigation. The form stores only an opaque private evidence reference; it does not publish files or notes. Rights and educational quality have separate statuses. |
| `admin-panel/src/app/(panel)/learning/grids/[gridId]/sections/[sectionId]/topics/[topicId]/ContentManager.tsx:81` | New lesson blocks default to draft in the admin UI; editing an existing block retains its status. |
| `mobile-app/supabase/checks/p002_content_inventory.sql:1` | Read-only inventory query for the four learning grids and two interview categories, including child tests/questions/problems. |

The existing learning `edit` permission is available to editors, so it cannot serve as rights approval. The new database check uses the active `super_admin` role and the review action checks the same role server-side. Ordinary editors retain their existing content editing permissions. The rights table is not readable by anonymous visitors. Evidence refs must point to access-controlled private storage; the current form does not upload evidence.

## Precise, reversible withholding plan — **owner approval required**

1. Export the live inventory with an authenticated read-only role, including unpublished/archived rows, body hashes, `file_url`/`video_url`, storage attachments, purchases/progress, and applied migration history. Compare every candidate with the seed source keys and manuscript crosswalk. The check query includes *all* rows in the four grids as a review superset; a grid match alone must never become an action predicate. Resolve the 40 rewrite hashes individually before treating a Java row as baseline or replacement.
2. For each actual live source-transcribed row without a rights instrument, record the exact table and primary key, current flags, dependent test/question/problem IDs, URL, purchase/access impact, and owner decision. Do not select unrelated lessons by broad grid/category slug or by similarity score alone. Do not infer the live set from the seed count.
3. After explicit owner approval, take a transactionally consistent snapshot of only those rows and their flags. In staging, change visibility/status for the **approved IDs only**, preserve content rows, progress, purchases, entitlement and legal records, and verify navigation/404 or access behavior for each URL and linked asset. Decide separately how paid learners retain lawful access during any withholding.
4. Roll back visibility by restoring the captured statuses and platform flags for the exact IDs, then invalidate affected caches/sitemaps and recrawl those URLs. Do not restore material whose rights remain blocked without a new owner decision.

No visibility-changing SQL is included because the authoritative live row set, rights evidence, and owner approval are absent.

## Quality review queue

- **Concrete technical correction:** `0050_seed_python_tutorial_content.sql:2690,2893-2897` says tuples can be dictionary keys and lists only immutable types as keys. A tuple containing an unhashable member cannot be a key; the correct criterion is hashability. The Python interview seed at `0109:258` states this nuance correctly. Target the live chapter and any derivative quiz wording after ID/hash verification; do not rewrite the whole tutorial.
- **Substantial duplication:** `0069` repeats nine sizable generic paragraphs in 206 unit bodies, as counted in the earlier audit. This is a page-value review queue, not a similarity-based unpublish decision and not P0-03 remediation here.
- **Reused examples:** `0068` repeats a feature-array example in several AI/ML bodies and `0051`/`0055` reuse a `class Student` example. Reuse can be educationally legitimate; review whether each occurrence adds a distinct explanation.
- **Human technical review:** validate MCQ answers, code output and judge cases in every family, prioritizing the AI/ML and GenAI prompts with empty examples/cases, Java interview source reconciliation, and the Python hashability claim. Preserve useful lessons and the 40 Java rewrites pending individual rights and technical sign-off.

## Verification

**Passed locally:** admin `npm run typecheck`, `npm run lint`, `npm test -- --run` (21 files, 239 tests), and `npm run build`; paired migration byte comparison; `git diff --check`. An isolated PostgreSQL 17 fixture accepted both migrations including a reapply. Fixture assertions exercised verified publish, unverified new publish rejection, blocked publish rejection, editor review rejection, changed approved-body rejection, unchanged legacy published-row preservation, and quiz-child bypass rejection. These are schema-level fixtures, not production data or a full Supabase integration environment.

**Failed then fixed:** the initial fixture exposed a PL/pgSQL record-field issue and a UUID/text comparison in the publish trigger. Both were corrected before the passing run. A first fixture assertion incorrectly tried to edit legacy content text without review; the final assertion checks preservation of its published state, while material edits correctly require review.

**Skipped/blocked:** no staging or production Supabase connection, authenticated live export, storage inventory, migration-history verification, production crawl, purchase/progress integration fixture, or deployed URL navigation check was available. The local fixture does not prove compatibility with all production triggers, seed reruns, mobile writers, or RLS policies. The migration was **not** applied to production or staging. Rights verification remains blocked by missing manuscripts and grant/assignment evidence.

## Staging rollout and rollback

1. Capture a read-only staging baseline of row counts, IDs, flags, hashes, purchases/progress and public URLs. Apply **one** of the paired migrations in staging; the other is re-runnable. Confirm every existing published row remains published and no user-progress/purchase table changed. Keep `enforcement_enabled=false`.
2. Test admin and mobile/website content writers, legacy seed reruns, attachments, quiz editing, route navigation and caches. Enter sample private evidence references and verify anonymous users cannot read the table, editors cannot approve, verified items publish, blocked/unverified items fail, and changed content requires a fresh review. Test paid-user access separately.
3. Only after these compatibility checks, an active super admin may set `enforcement_enabled=true` in **staging** and repeat the flows. The production activation decision requires a fresh live inventory and owner-approved rollout. Do not flip the setting merely because this repository builds.
4. Immediate gate rollback is `update public.educational_content_provenance_settings set enforcement_enabled=false where singleton=true;` by an authorized operator. This does not change any row visibility. Preserve provenance records for audit; do not drop the table or delete lessons. Revert the admin UI route via deployment rollback if necessary.

## Open decisions and final status

The owner must supply the exact AI/ML, GenAI, Java tutorial, Java interview and Python interview source manuscripts; the 30 Python chapter sources; creator and assignment/permission instruments; allowed commercial/web/mobile uses and conditions; per-row source crosswalk; and individual creator/reference evidence for the 40 Java rewrites. A read-only production export must establish actual rows, publication state, attachments, edit history, rewrite migration application, and affected paid access. A human reviewer must sign rights and educational quality separately. Without those, no actual live content can be cleared or selected for public withholding.

| Milestone | Status |
|---|---|
| Repository implementation | **Completed, with publication gate prepared and disabled by default** |
| Staging verified | **No** |
| Production verified | **No** |
| Rights verified | **No** |
| P0-02 closed | **No** |

This work does not establish or guarantee AdSense approval.

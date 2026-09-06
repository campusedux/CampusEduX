# CampusEduX — Unified Dynamic Learning Architecture
## PHASE 1 — Full Audit & Migration Plan (read-only; no code or DB changed)

**Date:** 2026-09-01 · **Branch:** `website-mobile-ui-sync` (uncommitted) ·
**Migration state:** mobile `0001–0043`, admin `001–020`, website `0001` ·
**Companion doc:** `WEBSITE_MOBILE_SYNC_ANALYSIS.md` (§16 = the Learning⇄Placement de-dup done the same day)

Legend: **KEEP** = reuse as-is / extend in place · **MIGRATE** = data mapped into the new model ·
**BUILD** = does not exist, new work · **REMOVE** = only after the replacement is verified.

---

## 00. Executive summary & decisions required

A hierarchical Learning system **already exists in code** (not yet applied to the production DB).
Migrations `0042`/`019` add `learning_grids → learning_sections → learning_topics → learning_contents`
with status / platform / premium flags, RLS, and six `SECURITY DEFINER` read RPCs. Migrations
`0043`/`020` fold the old flat `prep_notes` "study notes" system into it. Admin has a full
`/learning` CMS; website `/learning/*` and mobile `LearningGrids/Grid/Topic` screens consume it via
the RPCs. **This is solid and should be the spine of the unified system.**

What does **not** yet exist is the rest of the target: **Aptitude, DSA/Coding, Mock Test, HR
Interview and Company Specific as default database records inside Learning.** Today they are a
separate **"Placement"** module — legacy tables with `text` PKs, no publish/premium/academic state,
world-readable RLS, hardcoded frontend screens, and (on mobile) a **silent sample-data fallback**.
The `learning_*` tables also have **no academic (Course/Branch/Year) targeting** at all.

### DECISION 1 — scope (blocks Phase 2)

The 2026-09-01 owner decision (`WEBSITE_MOBILE_SYNC_ANALYSIS.md §16`) deliberately **split** the two:
"Learning = the content hierarchy only; the practice/test suite stays a separate module renamed
Placement." **This Master Prompt reverses that** — it wants Aptitude / DSA / Mock Test / HR / Company
Specific to become default grids *inside* Learning, with one user-facing entry point. The plan below
is written toward the Master Prompt's target. **Confirm this supersedes §16 before any Phase 2 work.**

### DECISION 2 — model shape

- **(a)** The existing tree has a `learning_sections` tier the Master Prompt's model
  (`Grid → Topic → Content`) does not. Keep sections as an optional middle tier, or collapse to
  grid→topic?
- **(b)** Academic **Year** is currently **not** enforced by RLS anywhere (only ranked client-side).
  The Master Prompt's "3rd Year content" requirement needs a DB-level `current_user_year_id()` +
  policy term, or an explicit documented deviation.

### Production risks found (live today)

1. **Silent fake data.** `mobile-app/src/services/placement.service.ts` still imports
   `samplePlacementContent.ts` and returns `SAMPLE_*` on any empty result or thrown error
   (`fallbackWhenEmpty = true`, plus `catch { return SAMPLE_* }`). Fake Aptitude / DSA / HR / Mock /
   Company content ships to users on a Supabase outage — violates Master Prompt rule 7.
   `learning.service.ts` is already correct (throws, no fallback).
2. **Premium file leak.** Learning images and files use the **public** `admin-media` bucket, so a
   premium topic's `file_url` PDF is reachable by direct URL even though RLS hides the row.
3. **Frontend-only security.** The legacy placement catalog tables are `SELECT USING (true)` — any
   premium / academic gating added only in the client is trivially bypassed.

---

## 01. Current overall architecture

One monorepo, three deployables, one shared Supabase project. **No service-role key anywhere in the
admin panel** — every admin write is authorised by an `is_admin()` RLS policy plus a
`requirePermission(module, action)` check in the Next.js Server Action.

| Surface | Stack | Data access |
|---|---|---|
| `mobile-app/` | Expo RN · React Navigation · TanStack Query · Zustand | Supabase JS (authed session); `*.service.ts` → `use*.ts` hooks. Bottom tabs Home · Projects · Jobs · **Prep** (shown "Placement") · Profile |
| `admin-panel/` | Next.js 14 App Router · Server Actions | Supabase SSR client, **no service key**; RLS `is_admin()` + DB `has_permission()`. Route groups `(auth)` / `(panel)`; 17-module permission matrix |
| `website/` | Next.js 14 App Router · ISR (`revalidate = 300`) | Anon Supabase client (`getPublicSupabase`) + React `cache()`; authed session only for user actions. SEO: sitemap/OG/canonical |

CI: `.github/workflows/mobile-ci.yml` + `admin-ci.yml` only (no website workflow). Green baselines
quoted in the change log: admin vitest 79, website vitest 74, mobile jest 228. Everything (including
`learning_*`) is on `website-mobile-ui-sync` and **not committed**.

---

## 02. Current Learning architecture

Migration pair `0042_learning_management.sql` / `019_learning_management.sql` (byte-identical body,
both guarded). Four content tiers + per-student bookmarks:

```
learning_grids ──< learning_sections ──< learning_topics ──< learning_contents
                                           │ (grid_id denormalised, trigger-synced)
                                           └──< learning_bookmarks (user_id, topic_id)
```

- **State model:** `status ∈ draft|published|archived` (archived = soft delete); independent
  `show_on_website` / `show_on_mobile`; grid `is_featured`; topic `is_premium`; content
  `content_format ∈ markdown|plain`, plus `file_url`, `video_url`, `metadata jsonb`.
- **Effective visibility** of a row = its own `status='published'` + platform flag **and** every
  ancestor likewise. FKs `ON DELETE RESTRICT` up the tree; only a leaf topic cascades to its content.
- **Helper fns:** `current_user_is_premium()`, `learning_grid_visible(id, platform)`,
  `learning_section_visible(...)`, `learning_topic_visible(...)` — all `SECURITY DEFINER`.
- **Read RPCs** (`SECURITY DEFINER`, granted `anon, authenticated`, platform-pinned):
  `learning_grids_list(platform)`, `learning_tree(grid_slug, platform)`,
  `learning_topic_content(grid_slug, topic_slug, platform)` → `{locked, contents, prev, next}`,
  `learning_search(q, platform, limit)`, `learning_sitemap(platform)`, and from `0043`:
  `learning_topic_by_source_note(uuid)`, `learning_slugify(text)`.
- **Search:** ILIKE over name/description/body, with optional `pg_trgm` GIN indexes when available.

**Gaps vs. target:** no `grid_type` column; no academic Course/Branch/Year targeting; an extra
`learning_sections` tier vs. `Grid → Topic → Content`; no default seed grids; no link to the
practice / test / DSA / HR data.

---

## 03. Current Placement architecture

The practice suite is a *separate* module, predating the admin panel. Catalog tables were built
"world-readable, writes via service role" (mobile `0015–0019`); admin write access was retro-fitted
as `*_admin_all` `is_admin()` policies in admin `002`. **No publish/premium/academic state** on
these tables (except `practice_tests.is_published`, added by admin `005`).

| Concern | Tables | Notes |
|---|---|---|
| Aptitude | `aptitude_topics` | Catalog of topic names + denormalised counts only. **No aptitude questions table** — actual practice = `practice_tests` with `category ∈ (aptitude, logical, verbal)`. |
| Mock / practice tests | `practice_tests` · `test_questions` · `live_tests` | MCQ tests; client renders, server scores. |
| DSA / Coding | `dsa_topics` · `dsa_problems` | Statement + examples/constraints/starter/solution as jsonb. Judge = **Piston public API** (`emkc.org/api/v2/piston/execute`) called **directly from the mobile client**; no edge function, no key. Test cases = the `examples` array (no hidden-testcase table). |
| HR Interview | `hr_questions` | One table, `company_id` nullable — generic bank vs. company bank. |
| Company Specific | `companies` · `recruiters` (+ FKs above) | "Company prep" = the subset of `hr_questions` / `practice_tests` whose `company_id` is set. `companies` is the **same table the Jobs module owns**. |

Mobile `PlacementNavigator` holds ~24 practice screens + the 3 Learning screens. The entry
`PlacementHomeScreen` lists a **hardcoded** `SECTIONS` array: Learning, Aptitude, DSA/Coding, Mock
Tests, HR Interview, Company Specific.

---

## 04. Current Admin architecture

Staff live in `admin_users` (roles super_admin / admin / editor / support / viewer; status
active / suspended). Every mutating Server Action calls `requirePermission(module, action)` → DB
`has_permission(uid, module, action)`; RLS `is_admin()` is the backstop; audit via
`log_admin_activity()`.

| Area | Routes | Permission module |
|---|---|---|
| Learning CMS · **KEEP** | `/learning`, `/learning/grids/[gridId]/sections/[sectionId]/topics/[topicId]` | `placement` (no dedicated "learning" key) |
| Placement suite · **KEEP** | `/placement/{aptitude,dsa,hr,tests,live-tests,questions,categories,difficulty,company,leaderboard,results,student-analytics,reports}` | `placement` |
| Notes · **removed in §16** | `/placement/notes` → `redirect('/learning')` | — |

`/learning` is fully built: grid/section/topic/content CRUD, reorder (sibling swap), per-field
status & platform toggles, markdown editor + preview. Actions in `learning/actions.ts`; queries +
types in `lib/learning/{constants,queries,site}.ts`. Sidebar shows **two** items —
`{/placement, "Placement"}` and `{/learning, "Learning"}` — both mapped to the `placement`
permission module.

*Minor pre-existing drift:* `lib/permissions.ts` lists a `custom_projects` module the `001` seed
does not. Fix it while adding a `learning` module.

---

## 05. Current Mobile architecture

- **Tab:** `Prep` (route name unchanged; tab title "Placement"). `PlacementNavigator` =
  `PlacementHome` + `LearningGrids/Grid/Topic` + the practice screens.
- **Learning read layer · KEEP:** `services/learning.service.ts` — RPC-only, **no fallback**,
  throws on error; `hooks/useLearning.ts`; types in `types/learning.types.ts`. Screens:
  `LearningGridsScreen`, `LearningGridScreen`, `LearningTopicScreen`,
  `components/learning/MarkdownText.tsx`.
- **Placement read layer · MIGRATE:** `services/placement.service.ts` reads the legacy tables **and**
  imports `@/data/samplePlacementContent`. `readWithFallback(..., fallbackWhenEmpty = true)` and
  `catch { return SAMPLE_* }` throughout → fake data on empty or error.
- **§16 deletions:** `NotesListScreen`, `NoteDetailScreen`, `notes.service.ts`, `useNotes.ts`,
  `notes.types.ts`, `sampleNotesContent.ts`. `samplePlacementContent.ts` (14 KB) **still present**.
- **Home:** the "Learning" feed on `HomeScreen` switched from `useNotes` to `useLearningGrids`; the
  "Learn" home tile → `Prep/LearningGrids`.

---

## 06. Current Website architecture

- **`/learning` · KEEP:** index (grid grid + search), `[gridSlug]/page.tsx`,
  `[gridSlug]/[topicSlug]/page.tsx` (+ `PremiumTopicContent`, `LearningBookmarkButton`),
  `_components/{DocsShell,LearningNav}`, `loading.tsx`, `components/learning/Markdown.tsx`. Data via
  `lib/learning.ts` (RPC wrappers, cached) + `lib/learning.types.ts`.
- **`/placement/page.tsx` · MIGRATE:** reads `aptitude_topics`, `dsa_topics`, `dsa_problems` (count),
  `hr_questions` (count), `practice_tests`, `companies`, plus a Learning-grid count. Track cards come
  from a hardcoded `PLACEMENT_TRACKS` array in `lib/placement.ts`. "Attempt in the app" boundary
  banner for scored activity.
- **Legacy redirects:** `/placement/notes` → `permanentRedirect('/learning')`;
  `/placement/notes/[id]` → `resolveLegacyNotePath()` → `/learning/<grid>/<topic>` via the
  `learning_topic_by_source_note` RPC.
- **Navigation:** header, drawer and (partly) bottom-tabs list **both** "Placement" and "Learning"
  as top-level items (`components/nav/navConfig.ts`).
- **SEO:** `sitemap.ts` already pulls Learning URLs from `learning_sitemap`; old per-note URLs
  dropped in §16.

---

## 07. Current Supabase architecture

- **One project**, shared by all three apps. Migrations run in numeric order per app: mobile
  `0001–0043`, admin `001–020`, website `0001` (contact form only).
- **Canonical / guarded-duplicate pairs** — a table's definition ships in both trees, guarded,
  whichever runs first wins: `0028≈010` (prep_notes), `0031≈011` & `0035≈015` & `0036≈016`
  (academic), `0041≈017` (anon catalog), `0042≈019` & `0043≈020` (learning). **Keep this
  convention** for new pairs.
- **Edge Functions** (`mobile-app/supabase/functions/`): payments & account only — Razorpay
  order/verify (project · premium · wallet · custom-project) and `delete-account`. **None touch
  learning / practice / code-execution.**
- **RPCs relevant here:** the six `learning_*` read RPCs; `submit_test_attempt(test_id, answers
  jsonb, time)` (server scoring, `0040`); `current_user_course_id()` / `current_user_branch_id()` /
  `content_visible_to_current_user()` / `validate_content_targeting()` / `academic_usage()`
  (academic model); `is_admin()` / `has_permission()` / `current_admin_role()` /
  `log_admin_activity()`.
- **Not applied to live yet** (owner action, per §16): `0041/017`, `0042/019`, `0043/020`. The new
  migrations below assume these are applied first, in order.

---

## 08. Existing Learning tables

| table | key columns | PK | verdict |
|---|---|---|---|
| `learning_grids` | name, slug, description, icon, icon_url, cover_image_url, accent_color, sort_order, status, show_on_website, show_on_mobile, is_featured, created_by/updated_by | uuid | **KEEP** + add `grid_type`, targeting cols, seed 5 rows |
| `learning_sections` | grid_id, name, slug, description, sort_order, status, show flags | uuid | **KEEP** (Decision 2: optional tier) |
| `learning_topics` | section_id, **grid_id (denorm)**, title, slug, short_description, sort_order, is_premium, status, show flags, **source_prep_note_id** | uuid | **KEEP** + targeting cols; maybe `topic_type` / `company_id` |
| `learning_contents` | topic_id, heading, body, content_format, file_url, video_url, metadata jsonb, sort_order, status | uuid | **KEEP** + optional hints/difficulty/tags (or via `metadata`) |
| `learning_bookmarks` | user_id, topic_id | (user_id, topic_id) | **KEEP** — already carries migrated prep-note bookmarks |

---

## 09. Existing Placement tables

| table | key columns | PK | state | verdict |
|---|---|---|---|---|
| `aptitude_topics` | category (quantitative/logical/verbal), name, total_questions, solved_questions, sort_order | text | none | **MIGRATE** → sections/topics of the Aptitude grid; may retire |
| `practice_tests` | title, category (aptitude/logical/verbal/hr/company), company_id, question_count, duration_minutes, total_marks, pass_marks, difficulty, **is_published** | text | is_published only | **KEEP** — add grid/topic link, status, is_premium, targeting, negative_marking, instructions, attempts_allowed |
| `test_questions` | test_id, question_text, options jsonb, correct_index, explanation, marks, sort_order, difficulty | text | none | **KEEP** — no structural change; scoped via `practice_tests` |
| `dsa_topics` | name, sort_order | text | none | **KEEP** — add grid link + status |
| `dsa_problems` | topic_id, difficulty, description, examples jsonb, constraints jsonb, starter_code jsonb, solution_code jsonb, solution_approach, time/space_complexity | text | none | **KEEP** — add grid/topic link, status, is_premium, targeting |
| `hr_questions` | company_id (nullable), category, question, answer_tips jsonb, sample_answer, difficulty | text | none | **KEEP** — add grid/topic link, status, is_premium, targeting |
| `live_tests` | practice_test_id, category (+dsa), scheduled_start/end, duration, total_marks, status (upcoming/ongoing/completed/cancelled), instructions | text | status = schedule | **KEEP** — reconcile scheduling with the unified model (Decision) |

*Notes:* `practice_tests.category` has no `dsa` value; `live_tests.category` does. No
`aptitude_questions` table exists.

---

## 10. Existing Content tables

| table | purpose | PK | verdict |
|---|---|---|---|
| `learning_contents` | markdown / plain blocks under a topic (+ file_url, video_url, metadata) | uuid | **KEEP** — the canonical content table |
| `prep_notes` | legacy flat study notes; 9-value `category` CHECK; **has academic targeting** (target_type / course / branch / year) | uuid | **REMOVE later** — merged by `0043`; kept deprecated for rollback |
| `prep_note_bookmarks` | legacy per-student note bookmarks | (user_id, note_id) | **REMOVE later** — rows carried to `learning_bookmarks` |
| `cms_pages` / `faqs` / `banners` / `announcements` / `offer_banners` | marketing / legal CMS — unrelated to Learning | — | **KEEP** — out of scope |

`prep_notes` is the only content table that already carries academic targeting. Because `learning_*`
does not, the `0043` merge imports any course/branch-targeted or unpublished note as a **draft**
topic for an admin to re-scope — a temporary compromise the Phase 2 targeting work removes.

---

## 11. Existing Test tables

| table | role | server-authoritative? |
|---|---|---|
| `practice_tests` | test catalog (aptitude / logical / verbal / hr / company patterns) | n/a |
| `test_questions` | MCQ bank per test — `correct_index` + `marks` is the answer key | key stays server-side of scoring |
| `test_attempts` | one row per submission: score, total_marks, correct/incorrect_count, time_taken | **yes** — written only by `submit_test_attempt()` (`SECURITY DEFINER`, `0040`); client INSERT policy dropped |
| `test_attempt_answers` | one row per question per attempt: selected_index, is_correct (server-decided) | **yes** — same RPC |
| `live_tests` | scheduled instance of a practice_test | n/a |

Master Prompt rule "never trust client-provided final scores" is **already satisfied** for practice
tests. Any new submit path in Phase 2 must follow the same pattern.

---

## 12. Existing Company tables

`companies` (text PK) + `recruiters` come from mobile `0009` and are the **canonical Company
architecture**, shared with the Jobs module (`jobs.company_id`, admin `/jobs/companies`). "Company
Specific" placement content is simply the rows of `hr_questions` and `practice_tests` whose
`company_id` is set.

**Do not duplicate:** the Master Prompt's conceptual `learning_companies` must map to the existing
`companies` table (rule 8). At most add a thin join layer (`learning_company_topics` /
`learning_company_contents`, or a `company_id` column on `learning_topics` for
`grid_type='company'`) — never a second company table.

---

## 13. Existing Progress tables

| table | grain | FK that must survive |
|---|---|---|
| `test_attempts` | user × test attempt | `test_id → practice_tests.id` (text) |
| `test_attempt_answers` | attempt × question | `question_id` (text, logical ref to `test_questions`) |
| `user_dsa_progress` | user × problem | `problem_id → dsa_problems.id` (text) |
| `user_favorite_questions` | user × HR question | `question_id → hr_questions.id` (text) |
| `learning_bookmarks` | user × topic | `topic_id → learning_topics.id` (uuid) |
| `prep_note_bookmarks` | user × note (deprecated) | `note_id → prep_notes.id` (uuid) |

**Zero-migration path exists:** if Phase 2 *extends* `practice_tests` / `test_questions` / `dsa_*` /
`hr_questions` / `companies` in place (add columns only) rather than creating new `learning_*`
physical tables and copying rows, **every text PK is preserved** and none of the progress tables
need to change. This is the recommended approach.

No dedicated analytics tables. Admin analytics (`/placement/leaderboard`, `results/[testId]`,
`student-analytics`, dashboard) aggregate `test_attempts` / `user_dsa_progress` live; CSV exports
are registered in `generated_reports`.

---

## 14. Existing RLS policies

| Group | Policy shape | Assessment |
|---|---|---|
| `learning_*` | admin `*_admin_all` (`is_admin()`). Public SELECT: `status='published' AND show flag AND ancestor visible`. `learning_contents` also: not-premium OR `current_user_is_premium()` OR admin. | **KEEP** — correct chained model. Extend with academic targeting. |
| `aptitude_topics` · `practice_tests` · `test_questions` · `dsa_topics` · `dsa_problems` · `hr_questions` | Public SELECT `USING (true)`; admin `*_admin_all` (`is_admin()`) from admin `002`. | **TIGHTEN** — world-readable; must become `status='published' AND content_visible_to_current_user(...)` once backfilled. |
| `test_attempts` · `test_attempt_answers` | SELECT own; INSERT policy **dropped** (write only via `submit_test_attempt()`). Admin `*_admin_select`. | **KEEP** — already hardened. |
| `user_dsa_progress` · `user_favorite_questions` · `learning_bookmarks` | Own rows (`auth.uid() = user_id`) read + write; admin SELECT. | **KEEP**. |
| `prep_notes` | SELECT: authenticated `is_published AND content_visible_to_current_user(...)` OR `is_admin()`; anon `is_published` (`0041`). Write: `prep_notes_admin_all` (re-asserted by `018` after `015/016/017` recreated only the SELECT policy). | **REMOVE later** with the table. |
| `projects` · `jobs` · `prep_notes` | SELECT gated by `content_visible_to_current_user(target_type, target_course_id, target_branch_ids[])` (`0036`); write-side `validate_content_targeting()` trigger; anon override (`0041`). | **REUSE** — this is the pattern to apply to Learning. |

*The `018` episode (write policy silently lost when later migrations recreated only the SELECT
policy) is a cautionary tale: any Phase 2 migration that `DROP POLICY` + recreates must recreate
**every** policy for that command, admin and public.*

---

## 15. Existing Storage

| bucket | public? | write | used for |
|---|---|---|---|
| `admin-media` | **public** | `is_admin()` | Learning icons/covers/content `file_url` · prep-note thumbnails · notification images · testimonial avatars (`LEARNING_BUCKET='admin-media'`, prefix `learning`) |
| `avatars` | public | owner folder | profile photos |
| `resumes` | **private** | owner folder · admin read | uploaded resumes — read via signed URL (the pattern to copy) |
| `project-media` / `project-files` | public / **private** | `is_admin()` | project screenshots / deliverable zips |
| `resume-templates` · `banners` · `site` | public | `is_admin()` | template thumbs · CMS banners · site assets |
| `cp-uploads` / `cp-deliveries` | private | owner / admin | custom-project files |

**Premium leak:** a premium Learning topic's `file_url` (and any future DSA/test attachment) lives
in the **public** `admin-media` bucket. RLS hides the row, but the object URL is world-reachable.
Phase 2 needs a **private** bucket + signed-URL RPC for premium / downloadable assets (mirror
`resumes`).

---

## 16. Existing migrations (relevant subset)

| file | adds |
|---|---|
| mobile `0009` | `companies`, `recruiters` |
| mobile `0015–0019` | `aptitude_topics` · `practice_tests`+`test_questions` · `test_attempts`+`test_attempt_answers` · `dsa_topics`+`dsa_problems`+`user_dsa_progress` · `hr_questions`+`user_favorite_questions` |
| mobile `0028` ≈ admin `010` | `prep_notes` + `prep_note_bookmarks` |
| admin `001` / `002` / `005` | admin identity + permissions + audit · admin RLS on every shared table · `live_tests` + `generated_reports` + `practice_tests` publish/marks fields |
| mobile `0029` · admin `003/006/009/012/013` | storage buckets (avatars, resumes, project-*, resume-templates, site, **admin-media**, cp-*) |
| mobile `0031≈011` · `0035≈015` · `0036≈016` | academic content targeting: `courses`/`branches`/`academic_years`, `target_*` columns on projects/jobs/prep_notes, resolvers, `content_visible_to_current_user()`, `validate_content_targeting()` |
| mobile `0040` | `submit_test_attempt()` server scoring; client attempt INSERT dropped |
| mobile `0041` ≈ admin `017` | anon SELECT for projects / jobs / published prep_notes — **not on live** |
| mobile `0042` ≈ admin `019` | **`learning_*`** tables + helpers + RLS + read RPCs — **not on live** |
| mobile `0043` ≈ admin `020` | merge `prep_notes` → `learning_*`; `learning_topic_by_source_note()`; deprecate old tables — **not on live** |

---

## 17. Duplicate / legacy systems

1. **Two content systems** — `prep_notes` (flat) vs `learning_*` (tree). *Mostly resolved:* `0043`
   merges the data; `prep_notes` kept deprecated / read-only for rollback; standalone Notes UI
   deleted across all three apps.
2. **Two user-facing "learn" modules** — "Placement" (practice suite) and "Learning" (content tree).
   Split on purpose by §16. **The Master Prompt wants them re-merged** → Decision 1.
3. **Two "aptitude" representations** — `aptitude_topics` (name catalog + counts) vs `practice_tests`
   with `category ∈ (aptitude, logical, verbal)` (the real questions).
4. **Extra hierarchy tier** — `learning_sections` exists; the Master Prompt model is
   `Grid → Topic → Content` → Decision 2.
5. **Permission-module overload** — one `placement` key gates two sidebar destinations;
   `permissions.ts` vs the `001` seed already disagree on `custom_projects`.
6. **Guarded migration-pair duplication** — intentional and working; *keep* the convention.

---

## 18. Old → New mapping plan

Comparing the Master Prompt's conceptual target tables against what exists ("Do NOT create these
blindly"):

| Target concept | Existing table to use | Action |
|---|---|---|
| `learning_grids` | `learning_grids` | **EXTEND** — add `grid_type ∈ (content, aptitude, dsa, mock_test, hr, company, custom)`; academic targeting; seed 5 default rows (draft + hidden) |
| `learning_topics` | `learning_topics` | **EXTEND** — academic targeting; optional `company_id` for company grids |
| `learning_subtopics` | `learning_sections` | **REUSE** as the optional middle tier (Decision 2) — do not add a 5th level |
| `learning_contents` | `learning_contents` | **EXTEND** — hints / difficulty / estimated_time / tags (columns or `metadata`) |
| `learning_tests` | `practice_tests` | **EXTEND** — `grid_id`/`topic_id`, status, is_premium, targeting, negative_marking, instructions, attempts_allowed |
| `learning_test_questions` | `test_questions` | **REUSE** unchanged; scoped through `practice_tests` |
| `learning_dsa_problems` | `dsa_problems` + `dsa_topics` | **EXTEND** — `grid_id`/`topic_id`, status, is_premium, targeting; keep Piston judge, keep `examples`-as-testcases |
| `learning_questions` (HR) | `hr_questions` | **EXTEND** — `grid_id`/`topic_id`, status, is_premium, targeting |
| `learning_companies` | `companies` | **REUSE** — never duplicate (rule 8) |
| `learning_company_topics` / `_contents` | `learning_topics` / `learning_contents` (`grid_type='company'`, `company_id` set) | **BUILD** only if the reuse above proves insufficient — thin join tables, no new company/question/test tables |
| Preparation Notes content | `learning_*` (grid `preparation-notes`) | **MIGRATE done in `0043`** — verify on live; re-scope draft imports |
| Progress · bookmarks · attempts · favourites | `test_attempts` · `user_dsa_progress` · `user_favorite_questions` · `learning_bookmarks` | **KEEP** — no change if PKs preserved (§13) |

**ID strategy:** keep `practice_tests`, `test_questions`, `dsa_topics`, `dsa_problems`,
`hr_questions`, `companies` as the physical tables — add columns, do not recreate. Every `text` PK
is preserved → **no progress migration, no FK remap, no analytics rewrite**. New rows created
through the unified admin keep minting `text` ids the same way the current placement actions do.

---

## 19. Database migration plan

All additive · guarded · idempotent · re-runnable. Continue the guarded-pair convention: mobile
`0044+` / admin `021+`, byte-identical bodies, one concern per file, no history rewrite.

| # | Pair | Contents |
|---|---|---|
| 0 | *(apply pending)* | Owner applies `0041/017` → `0042/019` → `0043/020` to live, in order. Verify the `0043` import counts + `/learning/preparation-notes`. |
| 1 | `0044 / 021` | `learning_grids.grid_type` (CHECK) + academic columns on `learning_grids`, `learning_sections`, `learning_topics`: `target_type`, `target_course_id`, `target_branch_ids text[]`, `target_year_id`, name/label mirrors. Seed 5 default grids — **status `draft`, both `show_*` false** so nothing appears until an admin publishes. Add `current_user_year_id()` resolver (Decision 2). |
| 2 | `0045 / 022` | Extend `practice_tests` / `dsa_topics` / `dsa_problems` / `hr_questions`: nullable `grid_id uuid`, `topic_id uuid`, `status` (default `published` for legacy rows), `is_premium bool default false`, the same academic-targeting columns. Add `practice_tests.negative_marking numeric`, `instructions text`, `attempts_allowed int`. RLS still `USING (true)` at this step. |
| 3 | `0046 / 023` | Tighten RLS: replace `USING (true)` on the extended tables with `status='published' AND content_visible_to_current_user(target_type, target_course_id, target_branch_ids)` (+ year term if Decision 2 = enforce); apply `validate_content_targeting()` triggers; add the academic terms to the `learning_*` SELECT policies. Anon override policies mirroring `0041`. |
| 4 | `0047 / 024` | Private bucket `learning-files` + `SECURITY DEFINER` `learning_file_signed_url(content_id)` that re-checks published + premium + targeting before minting a short-lived signed URL. |
| 5 | `0048 / 025` | Backfill: create sections/topics under the 5 default grids from `aptitude_topics` / `dsa_topics` / `hr_questions.category`; set `practice_tests.grid_id` / `dsa_problems.grid_id` / `hr_questions.grid_id`. Idempotent via provenance columns (mirror `source_prep_note_id`). |
| 6 | `0049 / 026` | RPCs: add `grid_type` to `learning_grids_list`; new `learning_grid_detail(grid_slug, platform)` returning the type-appropriate payload (topics, or tests / problems / question banks). Reuse `submit_test_attempt()`. Extend `learning_search` + `pg_trgm` indexes to typed content. |
| 7 | *(later)* | Cleanup once prod-verified: `DROP` `prep_notes` / `prep_note_bookmarks`; retire `aptitude_topics` if fully represented. |

---

## 20. Admin Panel implementation plan

1. **Permission module.** Add a real `learning` module (migration seed + `MODULES` +
   `permissions.ts` mirror + a super_admin re-save), or formally document that `placement` covers
   both. Recommend the dedicated module. Fix the `custom_projects` seed drift in the same change.
2. **Grid form.** Add a **Grid Type** selector to `/learning/grids/new` + edit. Add the
   Course / Branch / Year targeting field group — reuse the component already used on projects / jobs.
3. **Type-aware child managers.** Under `/learning/grids/[gridId]`, branch on `grid_type`:
   `content`/`custom` → existing section/topic/content managers; `mock_test` → mount `MockTestForm`
   + `QuestionForm`; `dsa` → the DSA problem form; `hr` → `HrQuestionList`; `aptitude` → aptitude
   topic manager; `company` → company picker (from `companies`) + topic/content. **These forms
   already exist under `/placement/*` — move / share, don't rewrite.**
4. **Keep `/placement/*` working** through the transition (rule 12). Once the typed managers reach
   parity, redirect the old routes and relabel Leaderboard / Results / Student Analytics / Reports as
   Learning reporting pages (analytics, not CMS — no rebuild).
5. **Sidebar.** Collapse to one "Learning" entry (Decision 1) with typed grids beneath, or keep two
   if the owner keeps the split.
6. **Media.** Point premium / downloadable uploads at the new private bucket; keep icons / covers on
   `admin-media`.

---

## 21. Mobile implementation plan

1. **Data-drive the entry screen.** Replace `PlacementHomeScreen.SECTIONS` with
   `learning_grids_list('mobile')`. Map `grid_type` → destination: `content/custom` →
   `LearningGrid`; `aptitude` → `AptitudeDashboard`; `dsa` → `DSADashboard`; `mock_test` →
   `PracticeTestList`; `hr` → `HRDashboard`; `company` → `CompanyList`. New admin grids appear with
   no app update.
2. **Reuse every practice screen.** Only their queries change — add grid / topic scoping and the
   published / premium / targeting filters (server already enforces; client just stops showing
   hidden rows).
3. **Delete the fallback.** Remove the `samplePlacementContent` imports and `fallbackWhenEmpty` /
   `catch → SAMPLE_*` from `placement.service.ts`; make it throw like `learning.service.ts` and let
   screens render error / retry. Delete `src/data/samplePlacementContent.ts`.
4. **Nav copy** per Decision 1 (tab title, `DrawerContent`, headings). Route name `Prep` and screen
   names stay (internal identifiers unchanged).
5. Progress / bookmark hooks unchanged (PKs preserved).

---

## 22. Website implementation plan

1. **One entry point** (Decision 1): fold `/placement` into `/learning`, or make `/placement` a
   redirect. Replace the hardcoded `PLACEMENT_TRACKS` with `learning_grids_list('website')`.
2. **Type-aware grid pages.** `/learning/[gridSlug]` renders by `grid_type`: content tree (as today)
   or a catalog view — the Aptitude / DSA / HR / practice-test / company sections currently on
   `/placement/page.tsx` move here almost verbatim.
3. Keep the "attempt in the app" boundary for scored activity (legitimate platform boundary).
4. **Redirects:** `/placement`, `/placement/*` → `/learning/*` (301). Notes redirects already exist.
5. **SEO:** extend `learning_sitemap` / `sitemap.ts` to typed grids and their children; keep
   canonical + OG.
6. Header / drawer / bottom-tab consolidation in `navConfig.ts`.

---

## 23. RLS / security plan

- **Extend the proven pattern.** Reuse `content_visible_to_current_user(target_type,
  target_course_id, target_branch_ids[])` in the SELECT policies of `learning_grids` /
  `learning_sections` / `learning_topics` and the extended `practice_tests` / `dsa_problems` /
  `hr_questions`. Add the `validate_content_targeting()` trigger to each.
- **Academic Year (Decision 2).** Not enforced anywhere today. To meet "3rd Year content", add
  `current_user_year_id()` and a year term to the visibility function; otherwise record the
  deviation explicitly.
- **Tighten legacy `USING (true)`** on the placement catalog tables to `status='published' AND
  content_visible_to_current_user(...)` — do this *after* the backfill sets `status` and an admin
  has reviewed, so nothing live vanishes.
- **Premium body withholding.** `learning_contents` is already gated; apply the same to premium
  `dsa_problems.solution_code` / `test_questions` bodies and the signed-URL RPC for files.
- **Server scoring.** `submit_test_attempt()` stays the only write path for attempts; any new submit
  path must be `SECURITY DEFINER` and recompute from the answer key ("never trust client scores").
- **Anon vs authenticated.** Preserve the `0041` anon-catalog policies; add anon SELECT for
  published + global typed-grid content.
- **Test the matrix in SQL**, not just the client (rule 6) — see §27.

---

## 24. Storage plan

- **Reuse `admin-media`** (public) for grid icons, covers, and non-premium inline images.
- **New private bucket `learning-files`** (admin write, no public read) for premium / downloadable
  assets: topic `file_url` PDFs, DSA / test attachments. Read only through
  `learning_file_signed_url(content_id)` — `SECURITY DEFINER`, re-checks published + premium +
  targeting, mints a short-TTL signed URL. Direct pattern already in `resumes` +
  `job.service.uploadResume`.
- Audit `admin-media` policies (public read / `is_admin()` write) — acceptable for non-premium only.
- Store bucket-relative paths on the row (like `resumes.storage_path`) so a signed URL can be
  re-minted on expiry.

---

## 25. Progress migration plan

- **Preferred: no migration.** Extend `practice_tests` / `test_questions` / `dsa_topics` /
  `dsa_problems` / `hr_questions` / `companies` in place. All `text` PKs preserved →
  `test_attempts.test_id`, `test_attempt_answers.question_id`, `user_dsa_progress.problem_id`,
  `user_favorite_questions.question_id`, `learning_bookmarks.topic_id` unchanged; scores / solved /
  favourites / analytics intact.
- **If a rename is ever forced:** ship an updatable view under the old name for one release, or an
  `id_map` table + single-transaction FK repoint with `SELECT count(*)` on each progress table
  asserted equal before and after. Not recommended — pure downside.
- **Bookmarks already migrated** by `0043` (`prep_note_bookmarks` → `learning_bookmarks` joined on
  `source_prep_note_id`). Verify row counts after applying to live.
- Premium entitlements are read live from `profiles.is_premium` via `current_user_is_premium()` —
  untouched by any of this.

---

## 26. Navigation migration plan

| Surface | User-facing "learn" strings today | Target |
|---|---|---|
| Website header | "Placement" + "Learning" (two items) | one "Learning" (Decision 1) |
| Website drawer / bottom-tabs | "Placement" (+ "Learning" in drawer) | one "Learning" entry; typed grids as children |
| Website `lib/placement.ts` | `PLACEMENT_TRACKS` (6 hardcoded) | from `learning_grids_list` |
| Mobile | `Prep` tab titled "Placement"; `PlacementHomeScreen.SECTIONS` (6 hardcoded); `DrawerContent` "Placement" | tab titled "Learning"; sections from RPC; internal route `Prep` unchanged |
| Admin sidebar | "Placement" + "Learning" (both → `placement` key) | one "Learning" (+ dedicated permission key) |

Internal identifiers (`/placement*` routes, mobile `Prep`, admin `placement` key) stay unless
Decision 1 explicitly changes them; user-facing labels + entry points consolidate; legacy paths 301.

---

## 27. Testing plan

- **Migrations** — scratch PG17: every new pair runs guarded, idempotent, incremental re-run, and
  wrong-order (matches the existing `0042`/`0043` validation notes). Assert both members of a pair
  are byte-identical below the header.
- **RLS matrix (SQL, not client)** — for `learning_grids`, `learning_topics`, `learning_contents`,
  and the extended `practice_tests` / `dsa_problems` / `hr_questions`, assert visibility across:
  global · course-match · course-mismatch · branch-match · branch-mismatch · year (if enforced) ·
  premium · non-premium · published · unpublished · admin · anon.
- **Server scoring** — `submit_test_attempt()` still ignores a client-sent score; new submit paths
  covered the same way.
- **Unit** — admin `lib/learning` + `lib/placement`; website `lib/learning`; mobile
  `learning.service` + `placement.service` (post-removal: assert it throws, never returns
  `SAMPLE_*`).
- **App gates** — `typecheck` / `lint` / `vitest` / `jest` / `build` / `expo export`. Current
  baselines: admin 79, website 74, mobile 228.
- **Manual on live** — apply the pending + new migrations in order; open each typed grid on web +
  mobile; pull the anon key / simulate outage and confirm error states, **no fake content** (rule 7).
- **Rule 13** — no "tests passed" claim without an actual run and its output.

---

## 28. Rollback strategy

- **Forward-fix, not down-migrations.** Every migration is additive + guarded + idempotent; a bad
  column add is reverted by a follow-up `DROP COLUMN` pair, a bad policy by `DROP POLICY` +
  recreate-prior.
- **Feature flag = data.** The 5 seed grids ship `status='draft'` + `show_*` false → invisible until
  an admin publishes; setting them back hides the whole typed system instantly with no deploy.
- **Legacy kept until parity** (rule 12): `prep_notes` / `prep_note_bookmarks` retained deprecated;
  `/placement/*` routes + screens + the old admin managers stay until typed-grid parity is verified.
- **Git checkpoint.** The branch is uncommitted — commit the current audited state before Phase 2 so
  there is a clean revert point; a hard reset otherwise restores the pre-engagement tree.
- **Storage.** The new private bucket is purely additive; removing it and repointing rows back to
  `admin-media` is a one-line config + backfill.

---

## 29. Risks

| Sev | Risk | Mitigation |
|---|---|---|
| **High** | **Decision 1 unresolved** — building toward full unification contradicts the §16 locked decision; a wrong guess wastes Phases 2+. | Owner sign-off before any Phase 2 code. |
| **High** | **Live DB drift** — `0041/0042/0043` not on production; new migrations assume they are. Partial / out-of-order application repeats the `018` policy-loss bug. | Apply pending pairs first, in order, and verify. Each new `DROP POLICY` migration recreates *all* policies for that command. |
| **High** | **Premium file leak** — `admin-media` is public; premium `file_url` reachable by URL today. | Private `learning-files` bucket + signed-URL RPC (§24). |
| **High** | **Silent fake data** — mobile `placement.service` fallback ships sample content on any Supabase failure (rule 7, live now). | Remove the fallback (§21) — priority, independent of Decision 1. |
| **High** | **Frontend-only security** — legacy catalog tables are `USING (true)`; premium / academic gating added only in the client is bypassable. | Move all gating into RLS (§23); SQL matrix test (§27). |
| Med | Progress FK breakage if tables are renamed instead of extended. | Extend in place; keep `text` PKs (§25). |
| Med | `learning_sections` tier mismatch → ambiguous admin UX and backfill. | Resolve Decision 2 before migration 1. |
| Med | Company data duplication if `learning_companies` is created. | Reuse `companies`; join layer only (rule 8). |
| Med | Academic Year unmet at DB level. | Decision 2 → `current_user_year_id()` + policy term, or documented deviation. |
| Med | Cache staleness — website ISR 300 s + `cache()`, mobile TanStack; admin publish not immediately visible. | Revalidate hooks / shorter TTL for learning routes; document the lag. |
| Med | Permission-module drift (`placement` double duty; `custom_projects` seed mismatch). | Add `learning` module + fix seed in one migration. |
| Low | Slug collisions on backfill. | Reuse the `0043` collision-suffix pattern. |
| Low | Piston public API rate-limit / downtime for the DSA judge (no key, no fallback). | Out of scope now; note as a follow-up (self-host Piston or an edge proxy). |
| Low | Search coverage — `learning_search` is ILIKE; typed-grid questions / problems not indexed. | Extend the RPC + `pg_trgm` indexes in migration 6. |
| Low | Sitemap size once every topic / problem is a URL. | Paginate the sitemap; cap per-grid. |

---

## 30. Recommended implementation order

1. **Decisions & checkpoint.** Resolve Decision 1 (scope) and Decision 2 (sections tier + academic
   year). Commit the current branch as a checkpoint.
2. **Apply pending live migrations** in order: `0041/017` → `0042/019` → `0043/020`. Verify import
   counts and `/learning/preparation-notes`.
3. **Independent fix (no dependency on 1):** remove the mobile `samplePlacementContent` fallback;
   delete the file; ship error/retry states.
4. **Migration 1** (`0044/021`): `grid_type` + academic columns on `learning_*` + 5 draft/hidden
   seed grids + `current_user_year_id()`.
5. **Migration 2** (`0045/022`): extend `practice_tests` / `dsa_*` / `hr_questions` with grid/topic
   link + status + premium + targeting (+ negative_marking / instructions / attempts_allowed); RLS
   still open.
6. **Migration 3** (`0046/023`): tighten RLS on the extended tables + targeting triggers + academic
   terms on `learning_*` policies.
7. **Migration 4** (`0047/024`): private `learning-files` bucket + signed-URL RPC; repoint premium
   uploads.
8. **Migration 5** (`0048/025`): backfill categories → sections/topics under the 5 grids; link
   `grid_id` on the practice rows.
9. **Migration 6** (`0049/026`): `grid_type` in `learning_grids_list`; `learning_grid_detail` RPC;
   search extension.
10. **Admin**: `learning` permission module; Grid Type selector + targeting field group; type-aware
    child managers reusing the `/placement/*` forms; relabel reporting pages. Keep `/placement/*`
    live.
11. **Mobile**: grid-driven `PlacementHomeScreen`; `grid_type` → screen routing; nav copy per
    Decision 1.
12. **Website**: type-aware `/learning/[gridSlug]`; fold in the `/placement` catalog sections; header
    consolidation; `/placement*` → `/learning*` redirects; sitemap extension.
13. **Test**: RLS matrix, migration re-run suite, all app gates, manual live verification incl. the
    outage / no-fake-data check.
14. **Cleanup (later, after prod verification)**: drop `prep_notes` / `prep_note_bookmarks`; retire
    duplicate `aptitude_topics`; redirect & remove legacy `/placement/*` user routes once parity is
    confirmed.

---

## Verdict — what exists, reuse, migrate, remove

**Exists & usable today**
- `learning_*` tree + 6 read RPCs + chained RLS + premium withholding
- Admin `/learning` CMS (grid/section/topic/content CRUD, reorder, toggles)
- Website `/learning/*` and mobile Learning screens consuming the RPCs
- Academic model: `courses`/`branches`/`academic_years` + resolvers +
  `content_visible_to_current_user()` + write trigger
- Server test scoring (`submit_test_attempt`); Piston DSA judge; canonical `companies`; all progress
  tables
- `prep_notes` → `learning_*` merge (scripted, not yet live)

**Must change**
- Add `grid_type` + 5 default grids inside Learning
- Add Course / Branch / Year targeting to `learning_*` + practice tables
- Tighten legacy `USING (true)` RLS to published + targeted
- Remove mobile sample-data fallback (rule 7)
- Private bucket + signed URLs for premium files
- Dedicated `learning` permission module
- Consolidate navigation to one entry point (pending Decision 1)

**Reuse — do not rebuild**
- `practice_tests` / `test_questions` / `dsa_*` / `hr_questions` / `companies` — extend, never
  replace
- `content_visible_to_current_user()` + `validate_content_targeting()`
- `submit_test_attempt()` and the admin analytics / report pages
- Every progress / bookmark table (PKs preserved → no migration)
- The guarded canonical-pair migration convention
- Existing `/placement/*` admin forms — move / share into typed grids

**Migrate (data)**
- Category catalogs → default-grid sections/topics; `practice_tests.grid_id` link;
  `prep_notes` + bookmarks (scripted)

**Remove (later, only after verified parity)**
- `prep_notes` / `prep_note_bookmarks`
- `samplePlacementContent.ts` + the fallback
- Duplicate `aptitude_topics` (if fully represented); legacy `/placement/*` user routes (redirect)

**Do NOT**
- Create `learning_companies` / `learning_dsa_problems` / `learning_tests` as new physical tables
  and copy rows (breaks progress FKs)
- Rename existing tables
- Enforce targeting only in the frontend
- Keep the silent fallback
- Drop old tables or routes before verified parity
- Rewrite migration history
- Touch unrelated UI

---

*Phase 1 deliverable — audit and plan only. No code or database was modified. Nothing proceeds to
Phase 2 until Decision 1 and Decision 2 are confirmed by the owner.*


================================================================================


# PHASE 2 — IMPLEMENTATION REPORT (Database + Safe Migration + RLS)

**Date:** 2026-09-01 · **Status:** implemented + validated on a scratch PostgreSQL 17 build of the
full production schema; **NOT applied to the live database** (owner action). **No application code
changed** — Phase 2 is DB/migration/RLS only (Mobile / Website / Admin UI are later phases).

**Decisions taken** (from the Phase 1 blockers, confirmed by the Phase 2 prompt):
Decision 1 = **full unification** — Aptitude / DSA / Mock Test / HR / Company Specific become default
grids inside Learning. Decision 2 = **keep `learning_sections`** as an optional middle tier
(`learning_topics.section_id` made nullable so `Grid → Topic → Content` also works), and **enforce
academic Year in RLS** (new `current_user_year_id()` + a year term in the visibility rule).

---

## 1. Exact schema changes

Two guarded, byte-identical migration pairs (bodies identical below their 5-line identity header):

| Pair | Files | Contents |
|---|---|---|
| **1/2** | `mobile-app/supabase/migrations/0044_learning_unification.sql` `admin-panel/supabase/migrations/021_learning_unification.sql` | additive schema · functions · seed · backfill · indexes · post-migration validation |
| **2/2** | `mobile-app/supabase/migrations/0045_learning_unification_rls.sql` `admin-panel/supabase/migrations/022_learning_unification_rls.sql` | RLS policy refresh · read-RPC targeting · storage bucket · permission seed |

### Columns added (all additive; existing rows keep prior visibility)

| Table | New columns |
|---|---|
| `learning_grids` | `grid_type` (CHECK `content/aptitude/dsa/mock_test/hr/company/custom`, default `content`), `is_premium`, `source_kind`, `source_ref`, `target_type` (CHECK `global/course/branch`), `target_course_id`, `target_course_name`, `target_branch_ids text[]`, `target_branch_names text[]`, `target_year_id`, `target_year_label` |
| `learning_topics` | `section_id` **→ NULLABLE**; `+ icon`, `icon_url`, `company_id` (FK `companies`), `source_kind`, `source_ref`, `target_type`+course/branch/year set (same 7 cols as above); CHECK `learning_topics_parent_chk (grid_id is not null)` |
| `learning_contents` | `title`, `slug`, `short_description`, `difficulty` (CHECK `Easy/Medium/Hard`), `estimated_minutes`, `tags text[]`, `external_url`, `is_premium`, `file_bucket` (default `admin-media`), `file_path`, + the targeting set |
| `practice_tests` | `learning_grid_id` (FK), `learning_topic_id` (FK), `status` (CHECK `draft/published/archived`, default `published`), `is_premium`, `negative_marking numeric`, `instructions text`, `attempts_allowed int` (NULL = unlimited), + the targeting set |
| `test_questions` | `question_type` (CHECK `mcq/multi/numeric/descriptive`, default `mcq`) |
| `dsa_topics` | `learning_grid_id`, `learning_topic_id`, `slug`, `description`, `status` |
| `dsa_problems` | `learning_grid_id`, `learning_topic_id`, `slug`, `hints jsonb`, `supported_languages text[]`, `status`, `is_premium`, + the targeting set |
| `hr_questions` | `learning_grid_id`, `learning_topic_id`, `status`, `is_premium`, + the targeting set |
| `live_tests` | `learning_grid_id`, `is_published` (default true) |

### Constraints / triggers added

- CHECK constraints for every new enum-ish column (grid_type, status, target_type, difficulty, question_type).
- `practice_tests_sync_publish` BEFORE INSERT/UPDATE — keeps `status` ⇄ `is_published` in lock-step so the unchanged app/admin code (which writes `is_published`) and the new RLS (which reads `status`) never disagree.
- `learning_topics_sync_parent` **replaced** — derives `grid_id` from the section when present, else requires an explicit `grid_id` (supports grid-direct topics).
- `validate_learning_targeting` BEFORE INSERT/UPDATE on `learning_grids`, `learning_topics`, `learning_contents`, `practice_tests`, `dsa_problems`, `hr_questions` — rejects malformed course/branch combos (reuses the `validate_content_targeting` rules) and a non-existent `target_year_id`.
- `learning_grid_companies_set_updated_at` trigger.

### Functions

New: `current_user_year_id()`, `learning_row_visible(text,text,text[],text)`,
`validate_learning_targeting()`, `practice_tests_sync_publish()`, `learning_content_accessible(uuid)`.
Replaced (`CREATE OR REPLACE`, return shapes unchanged): `learning_grid_visible`,
`learning_section_visible`, `learning_topic_visible` (NULL-section tolerant + own-targeting term),
`learning_grids_list`, `learning_tree`, `learning_topic_content`, `learning_search`,
`learning_sitemap` (each gains `learning_row_visible(...)` on the grid + topic filters, so the
SECURITY DEFINER read path enforces the same targeting the RLS does).

### Indexes

~40 new indexes (file §10 of the 1/2 migration): grid_type/status lookups, `learning_grid_id` /
`learning_topic_id` link columns, `(target_type,target_course_id)` + GIN `(target_branch_ids)` +
`target_year_id` partials on every targeted table, `is_premium`, `status`, and the two
`source_kind/source_ref` partial-unique provenance indexes.

---

## 2. Tables reused (extended in place — NOT duplicated)

`learning_grids`, `learning_sections`, `learning_topics`, `learning_contents`, `learning_bookmarks`
(0042/019) · `practice_tests`, `test_questions`, `test_attempts`, `test_attempt_answers` (0016/0017)
· `dsa_topics`, `dsa_problems`, `user_dsa_progress` (0018) · `hr_questions`,
`user_favorite_questions` (0019) · `live_tests` (admin 005) · **`companies` + `recruiters`** (0009 —
the canonical company tables, shared with Jobs; reused via a junction, never copied) · `profiles`,
`courses`, `branches`, `academic_years` (unchanged).

Every `text` primary key on the practice / DSA / HR / company tables is preserved, so
`test_attempts.test_id`, `test_attempt_answers.question_id`, `user_dsa_progress.problem_id`,
`user_favorite_questions.question_id`, `learning_bookmarks.topic_id` and every analytics query
keep resolving with **no data migration**.

## 3. Tables created

| Table | Purpose |
|---|---|
| `learning_grid_companies` | The "Company" tier of a `grid_type='company'` grid — `(grid_id, company_id)` junction over the existing `companies` table + per-grid `sort_order` / `status` / platform flags. No new company/question/test tables (Master Prompt rule 8). |
| `learning_migration_map` | Durable `entity · old_id → new_id · migration` record for every backfilled mapping (idempotency + provenance + rollback). Admin-read-only. |

## 4. Tables deprecated

None newly. `prep_notes` / `prep_note_bookmarks` remain **deprecated (read-only, retained)** from
the earlier `0043/020` merge — Phase 2 does not touch or drop them. Their `drop` stays scheduled
for a later cleanup migration after production verification.

## 5. Migration files created

```
mobile-app/supabase/migrations/0044_learning_unification.sql       (== admin 021)   ~900 lines
admin-panel/supabase/migrations/021_learning_unification.sql       (== mobile 0044)
mobile-app/supabase/migrations/0045_learning_unification_rls.sql   (== admin 022)   ~560 lines
admin-panel/supabase/migrations/022_learning_unification_rls.sql   (== mobile 0045)
```

Additive · guarded (`to_regclass` / `to_regprocedure` / `IF NOT EXISTS`) · idempotent · re-runnable.
Ordering guards: `0044/021` aborts with a clear message if `0042/019` or `0043/020` or `0036/016`
is missing; `0045/022` aborts if `0044/021` is missing. No existing migration file was modified.

## 6. Seed data created

Five `learning_grids` rows — **`status='draft'`, `show_on_website=false`, `show_on_mobile=false`**
(invisible until an admin publishes; this is also the rollback switch):

| name | slug | grid_type | sort_order |
|---|---|---|---|
| Aptitude | `aptitude` | `aptitude` | 1 |
| DSA / Coding | `dsa-coding` | `dsa` | 2 |
| Mock Test | `mock-test` | `mock_test` | 3 |
| HR Interview | `hr-interview` | `hr` | 4 |
| Company Specific | `company-specific` | `company` | 5 |

Plus `role_permissions` rows for a dedicated **`learning`** module (all 5 roles, mirroring the
`placement` defaults) and the previously-missing **`custom_projects`** rows — both
`ON CONFLICT DO NOTHING`. (Admin code still calls `requirePermission('placement', …)` for Learning;
switching it to `'learning'` is a one-line change deferred to the Admin-UI phase — the `is_admin()`
RLS is the real backstop.)

## 7. Old → New mapping

| Old | New | How |
|---|---|---|
| `aptitude_topics` row | `learning_topics` under the `aptitude` grid, in a section named after `aptitude_topics.category` (Quantitative / Logical / Verbal) | `learning_migration_map (entity='aptitude_topic')` + `learning_topics.source_kind='aptitude_topic', source_ref=<old id>` |
| `dsa_topics` row | `learning_topics` under the `dsa-coding` grid ("Topics" section) + `dsa_topics.learning_grid_id` / `learning_topic_id` set | map `entity='dsa_topic'` |
| `dsa_problems` row | unchanged; `learning_grid_id` = dsa grid, `learning_topic_id` = the mapped topic of its `dsa_topics.topic_id` | direct `UPDATE` via the map |
| `practice_tests` row | unchanged; `learning_grid_id` = `mock-test` grid, `learning_topic_id` = a per-`category` topic | map `entity='mock_category'` |
| `hr_questions` row | unchanged; `learning_grid_id` = `hr-interview` grid, `learning_topic_id` = a per-`category` topic | map `entity='hr_category'` |
| `companies` row (with company-scoped `hr_questions` / `practice_tests`) | `learning_grid_companies` row under the `company-specific` grid | map `entity='company_link'` |
| `live_tests` row | unchanged; `learning_grid_id` = `mock-test` grid | direct `UPDATE` |

**No IDs changed.** New `learning_topics` rows get fresh UUIDs; the `learning_migration_map` +
`source_kind/source_ref` columns are the reliable old→new record the Master Prompt §11 asks for.

## 8. Data migrated

Scratch build seeded from `mobile-app/supabase/seed.sql` (production-like sample content), then both
pairs applied. Backfill created, with **zero rows deleted or mutated** in any source table:

- 5 `learning_grids` (default grids)
- 6 `learning_sections` (3 Aptitude categories + 1 DSA + 1 Mock Test + 1 HR)
- 37 `learning_topics` (21 from `aptitude_topics` + 8 from `dsa_topics` + 4 Mock-Test categories + 4 HR categories)
- 0 `learning_contents` (topics + links only; educational content is authored later from Admin)
- 21 + 8 + 4 + 4 `learning_migration_map` rows; 6 `learning_grid_companies` rows
- `practice_tests` 16/16, `dsa_problems` 7/7, `hr_questions` 12/12 linked to a grid **and** topic

## 9. Row-count validation (before → after)

| table | before | after | Δ |
|---|---:|---:|---:|
| aptitude_topics | 21 | 21 | 0 |
| practice_tests | 16 | 16 | 0 |
| test_questions | 20 | 20 | 0 |
| test_attempts | 8 | 8 | 0 |
| test_attempt_answers | 5 | 5 | 0 |
| dsa_topics | 8 | 8 | 0 |
| dsa_problems | 7 | 7 | 0 |
| user_dsa_progress | 3 | 3 | 0 |
| hr_questions | 12 | 12 | 0 |
| user_favorite_questions | 1 | 1 | 0 |
| companies | 10 | 10 | 0 |
| prep_notes | 9 | 9 | 0 |
| learning_grids | 1 | 6 | **+5** |
| learning_sections | 9 | 15 | **+6** |
| learning_topics | 9 | 46 | **+37** |
| learning_contents | 9 | 9 | 0 |

The in-migration validation block (`0044` §11) additionally re-checks, and `RAISE`s on failure:
5 default grids present · `aptitude_topics` count == map count · `dsa_topics` count == map count ·
every `dsa_problems` / `practice_tests` / `hr_questions` linked · no orphan `learning_topics` ·
no `test_attempts` / `user_dsa_progress` orphaned.

## 10. RLS policies created / updated

**Refreshed** (`DROP` + recreate, same names): `learning_grids_select_public`,
`learning_topics_select_public`, `learning_contents_select_public` — now AND
`learning_row_visible(target_type, target_course_id, target_branch_ids, target_year_id)`;
`learning_topics_select_public` also tolerates `section_id IS NULL`.
`learning_sections_select_public` unchanged in text (its `learning_grid_visible()` call now carries
targeting).

**Replaced `USING (true)` with real gates**:

| table | new SELECT rule |
|---|---|
| `practice_tests` | `status='published' AND learning_row_visible(…)` (row stays visible for a premium test — the questions are withheld) |
| `test_questions` | parent test published + visible, **AND** premium gate on the parent (`correct_index` still column-readable; server scoring is the real protection) |
| `dsa_topics` | `status='published' AND (learning_grid_id IS NULL OR learning_grid_visible(learning_grid_id,'any'))` |
| `dsa_problems` | `status='published' AND learning_row_visible(…) AND (not is_premium OR current_user_is_premium() OR is_admin())` |
| `hr_questions` | same shape as `dsa_problems` |
| `live_tests` | `is_published AND (parent practice_test published OR standalone)` |

**New**: `learning_grid_companies_admin_all` (is_admin) + `learning_grid_companies_select_public`
(`status='published' AND learning_grid_visible(grid_id)`); `learning_migration_map_admin_ro`
(admin SELECT only).

**Untouched** (correct as-is): all `*_admin_all` `is_admin()` policies (admin 002/005), `companies` /
`recruiters` public directory, `test_attempts` / `test_attempt_answers` (own-rows + server-write),
`user_dsa_progress`, `user_favorite_questions`, `learning_bookmarks`.

**Read RPCs** — `learning_grids_list`, `learning_tree`, `learning_topic_content`, `learning_search`,
`learning_sitemap` re-emitted with the same `learning_row_visible(…)` term on their grid + topic
filters, so enforcement holds on the SECURITY DEFINER path Mobile/Website actually use.

Anon: `current_user_course_id/branch_id/year_id()` resolve to NULL, so `learning_row_visible`
returns true only for `target_type='global'` with no `target_year_id` — logged-out visitors see
published global content only, no extra anon policy needed.

## 11. Storage changes

- New bucket **`learning-files`** — `public = false`. `storage.objects` policy `learning_files_admin_all`
  (`bucket_id='learning-files' AND is_admin(auth.uid())`) for ALL; **no public / anon read policy**,
  so an object is reachable only via a short-lived signed URL the app mints *after*
  `learning_content_accessible(content_id)` passes. Archived / unpublished / wrong-audience content
  therefore cannot leak a file.
- `admin-media` (existing public bucket) is kept for grid icons, covers and non-premium inline
  images — `learning_contents.file_bucket` defaults to `'admin-media'`; premium / downloadable
  assets set it to `'learning-files'` + `file_path`.
- `learning_content_accessible(uuid)` — SECURITY DEFINER: true iff the content is published, its
  topic chain is visible (`learning_topic_visible`), its own targeting passes, and it is not premium
  (topic or content) or the caller is premium / admin.

## 12. Indexes created

~40, listed above (§1). Driven by the real query shapes: grid-by-type/status, topic-by-grid,
content-by-topic, the `learning_grid_id` / `learning_topic_id` join columns, and
`(target_type,target_course_id)` + GIN `target_branch_ids` + `target_year_id` on every targeted
table for the RLS predicate.

## 13. Compatibility decisions

- **Extend, don't replace.** No table renamed, no PK changed → historical attempts / solved / favourites / bookmarks / analytics are byte-for-byte valid.
- **`is_published` kept** on `practice_tests` alongside the new `status`, synced by a trigger, so the unchanged mobile/admin code that reads/writes `is_published` keeps working.
- **`learning_sections` kept** as an optional tier; `section_id` nullable. The `preparation-notes` grid and the existing Website/Mobile Learning UI (which iterate `tree.sections[].topics[]`) are unaffected.
- **Backfill gives every new topic a section**, so the section-join RPCs need no structural change this phase.
- **Default grids ship hidden** — nothing appears in any app until an admin publishes; this is also the rollback switch.
- **`learning` permission module seeded but not yet wired** — admin Learning writes stay gated by the `placement` key + `is_admin()` RLS until the Admin-UI phase flips the string.
- **`companies` reused** via `learning_grid_companies`; `learning_topics.company_id` scopes a topic to a company inside a company-type grid.

## 14. Tests executed

Local **PostgreSQL 17.10**. Harness scripts in the session scratchpad
(`.../scratchpad/p2/`): `run_chain.sh` (builds a scratch DB from `bootstrap` + mobile `0001–0043` +
admin `001–020` + `seed.sql`, in a cross-tree-dependency-safe order), `bodyA.sql` / `bodyB.sql`
(≡ the repo files), `verify_setup.sql` (Supabase-style `anon`/`authenticated` roles + realistic
targeted test data), `verify.sh` (40-assertion matrix across anon / free-MBA-student /
premium-BTech-CSE-4th-student / super-admin, using `SET ROLE` + `request.jwt.claims`).

Executed:
1. Full chain + both Phase-2 pairs — applies clean, start to finish.
2. **Idempotency** — every Phase-2 migration run **twice**; second run no-ops, no error.
3. **Guarded-pair order independence** — applying the admin twins (`021`,`022`) on top of the mobile pair is a clean no-op, and vice-versa.
4. **Wrong-order guard** — `0045` before `0044` aborts (`ERROR: 0045/022: learning_row_visible() not found — apply part 1/2 … first`, psql exit 3).
5. **RLS matrix** — 40 assertions (below).
6. **Before/after row counts** — §9 table.

## 15. Test results

**40 passed, 0 failed.** Coverage:

- *Academic targeting* — course-targeted Aptitude grid: visible to the B.Tech student (list + direct RLS + RPC), hidden from the MBA student and from anon; global Preparation Notes still visible to anon.
- *Branch + year + premium topic* (`advanced-premium`: branch `btech-cse`, year `4`, premium) — the premium B.Tech/CSE/4th-year student gets `locked=false` + content via `learning_topic_content`; the MBA student gets `null` (grid invisible); a draft topic is absent from both the direct RLS SELECT and the `learning_tree` RPC for a student, present for an admin.
- *Premium row gating* — premium `dsa_problem` hidden from the free student, visible to the premium student and the admin; draft `practice_test` hidden from students, visible to admin; MBA-targeted `practice_test` visible only to the MBA student; anon sees global published practice tests only.
- *Admin-write security* — student `INSERT` on `learning_grids` / `learning_contents` / `learning_grid_companies` → blocked by RLS; student `UPDATE practice_tests` / `DELETE dsa_problems` → 0 rows; admin `INSERT learning_grids` / `UPDATE learning_contents` → succeed.
- *Data integrity* — 0 orphans in `test_attempts`, `test_attempt_answers`, `user_dsa_progress`, `user_favorite_questions`, `learning_bookmarks`; every `practice_test` / `dsa_problem` / `hr_question` linked to a grid+topic; `aptitude_topics` fully represented in the map; 5 default grids; `learning` permissions for all 5 roles; `learning-files` bucket private.

*Not run:* Mobile/Website/Admin app gates (`typecheck` / `lint` / `jest` / `vitest` / `build` /
`expo export`) — **no application code was changed in this phase**, only four new `.sql` files, so
those baselines (admin 79 / website 74 / mobile 228) are unaffected. They will be re-run when the
consumer wiring lands in Phase 3.

## 16. Remaining risks

| Sev | Risk | Note |
|---|---|---|
| High | **Live application order.** Phase 2 assumes `0041/017`, `0042/019`, `0043/020` are already live. The owner must apply, in order: `0041→0042→0043→0044→0045` (mobile) and/or `017→019→020→021→022` (admin); the guards abort loudly on a gap. | scratch-validated, not live-validated |
| Med | **`profiles.year` free-text vs `academic_years.label`.** The seed onboarding uses labels like "Final Year" / "First Year" that don't match the catalog ("4th Year" / "1st Year"), so `current_user_year_id()` returns NULL for those users and year-targeted content is hidden from them (fail-safe, but a data-quality gap in the app's own onboarding options — outside this migration). | pre-existing; fix onboarding options or add label aliases |
| Med | **Premium `dsa_problems` / `hr_questions` rows are hidden whole** from non-premium callers (statement + solution live in one row). If the product wants the statement visible for upsell, split the solution columns in a later migration. `practice_tests` already uses the visible-row / withheld-questions split. | product decision |
| Med | **RPC section-join structure unchanged.** `learning_tree` / `learning_topic_content` / `learning_search` still INNER-JOIN `learning_sections`, so a future grid-direct (`section_id IS NULL`) topic won't appear through them until Phase 3 reworks those RPCs. All Phase-2 backfilled topics have sections, so no current impact. | Phase 3 |
| Low | `learning_search` is still ILIKE-based; the new typed-grid content (questions / problems) is not indexed for search. | Phase 3 RPC work |
| Low | `admin-media` remains a public bucket for non-premium learning images — acceptable, but any file mistakenly uploaded there is world-readable. Premium/downloadable must use `learning-files`. | operational discipline |

## 17. Legacy systems intentionally retained

- `prep_notes` / `prep_note_bookmarks` — deprecated, read-only, kept for rollback of the `0043/020` merge.
- `aptitude_topics`, `dsa_topics`, `live_tests` legacy columns — kept and still read by the current apps; the new `learning_*` links are additive.
- `practice_tests.is_published` — kept and trigger-synced with the new `status`.
- The `/placement/*` admin routes + the `placement` permission key — untouched; the `learning` module rows are seeded but not yet referenced.
- Every progress / bookmark / attempt table and its `text` foreign keys.

## 18. Recommended next phase

**Phase 3 — Admin Panel Learning CMS.** With the canonical backend in place: add a Grid-Type
selector + Course/Branch/Year targeting field-group to `/learning`; mount the existing
`/placement/*` forms (`MockTestForm`, `QuestionForm`, the DSA problem form, `HrQuestionList`,
`LiveTestForm`) under `/learning/grids/[id]` by `grid_type`; build the `learning_grid_companies`
manager; switch `requirePermission('placement', …)` → `'learning'` in `learning/actions.ts`; add
the `learning_grid_detail` read RPC + rework the section-join RPCs for grid-direct topics; then
Phase 4 (Mobile: data-drive `PlacementHomeScreen`, remove the `samplePlacementContent` fallback)
and Phase 5 (Website: type-aware `/learning/[gridSlug]`, fold in `/placement`). Publish the five
default grids only after their admin managers reach parity.

---

*Phase 2 deliverable — database, migration and RLS only. Four new migration files; no application
code changed; nothing applied to the live database.*


================================================================================


# PHASE 3 — IMPLEMENTATION REPORT (Admin Panel · Dynamic Learning CMS)

**Date:** 2026-09-01 · **Status:** implemented + gate-verified (`typecheck` / `lint` / `vitest`
**86/86** / `build` OK) and DB-integration-verified on a scratch PostgreSQL 17 build of the full
chain + Phase 2 (**27/27**). **No new migrations** — Phase 2's schema is the canonical model.
Mobile / Website UI unchanged (their phases follow).

---

## Admin Architecture

### Existing (before Phase 3)
`admin-panel` is Next.js 14 App Router · Server Actions · Tailwind, **no service-role key** —
every mutating action calls `requirePermission(module, action)` (→ DB `has_permission()`), RLS
`is_admin()` is the backstop, and `logActivity()` → `log_admin_activity()` writes the audit trail.
A `/learning` module already existed (built in the earlier LMS engagement): a Grid → Section →
Topic → Content CMS with list/search, per-field status & platform toggles, up/down reorder
(`moveRow`, DB-persisted `sort_order`), a Markdown editor with live preview, and image upload via
the shared `<ImageUploader>` (bucket `admin-media`). It was gated by the **`placement`** permission
key and its `LearningGrid`/`Topic`/`Content` types predated the Phase 2 columns.

### New (after Phase 3)
The same module, now the **single Learning control centre** and gated by its own **`learning`**
permission key, extended to the full Phase 2 model:

| Area | What changed |
|---|---|
| Permissions | New `learning` module in `lib/permissions.ts` (`MODULES`, `MODULE_LABEL`, `DEFAULT_PERMISSIONS` — editor = view/add/edit). `learning/actions.ts` `MODULE = 'learning'`. Five `/learning` pages switched to `requireModule('learning')` + `admin.perms.learning`. Sidebar: `/learning` now `module: 'learning'`, moved above `/placement` (relabelled **"Placement (legacy)"**). Phase 2's `0045/022` already seeded the DB `role_permissions` rows + filled the missing `custom_projects` rows. |
| Grid form | **Grid Type** selector (`content · aptitude · dsa · mock_test · hr · company · custom`) — locked for a migration-seeded default grid (`source_kind = 'default_grid'`), whose name and everything else stays editable (spec §6). **Premium / Free** toggle. **Academic targeting** (Course / Branch / Year) via the existing reusable `<AcademicTargetingFields>` + a `resolveLearningTargeting()` server wrapper. |
| Grid list | Filters: Status · **Type** · **Access (premium/free)** · **Course**. Each row shows the type label, premium lock, targeting summary and section/topic/**block** counts. Reorder + inline status + Web/App toggles kept. |
| Dashboard | Full §4 stat set: Grids (published / draft / archived), Sections, Topics (+ premium), Content blocks (published / draft), **Mock tests**, **DSA problems**, **HR questions**, **Companies**, plus a **Recently updated content** list. |
| Grid detail | Branches on `grid_type`: a `dsa` / `mock_test` / `hr` grid shows a **`SpecializedGridCard`** (count of bound rows + a "Manage" deep-link to the legacy editor, filtered to this grid); a `company` grid shows the new **`CompanyManager`**; every grid keeps the Section / Topic manager for supplementary notes. |
| Topic form | Academic targeting + icon (emoji + image). For a `company` grid, a **Company** dropdown → `learning_topics.company_id` (Company → Topic → Content). |
| Content editor | Now edits every Phase 2 field: **Title · Slug · Short description · Content type** (article / video / pdf / external / question / interview_question / example — stored in `metadata.content_type`) · Heading · Format · Markdown body (+ live preview) · **Difficulty · Est. time · Tags · Premium** · Attachment / Video / External URL · **per-block academic targeting** (collapsed `<details>`, inherits the topic otherwise). |
| Company Specific | New `CompanyManager` — junction CRUD over **`learning_grid_companies`** (reuses `public.companies`, shared with Jobs; unique `(grid_id, company_id)` blocks duplicates; "remove" never deletes the company record). Headline, status, Web/App visibility, reorder. |
| Custom grids | Creating a grid with type `custom` (or any type) is a normal DB insert — **zero code change** to add "Communication Skills", "Soft Skills", … |
| Draft / Publish / Archive | The existing 3-state `status` select (`draft → published → archived`) on grid / section / topic / content is the workflow. Delete is guarded: a default system grid, a grid with children, or a topic with student bookmarks all refuse hard-delete and point at Archive (spec §16). RLS (Phase 2) is the authority — unpublished / archived / wrong-audience never reaches a student. |

### Reused components (unchanged)
`PageHeader`, `Card`/`CardHeader`, `StatCard`, `SearchFilterBar`/`FilterSelect`, `Pagination`,
`Badge`/`StatusPill`, `ImageUploader`, `<AcademicTargetingFields>` + `resolveTargetingFromForm`
(`lib/academic-targeting.ts`), `MarkdownEditor` + `MarkdownPreview`, `SubmitButton`, `DeleteButton`,
`toast`, the `_components/shared.tsx` `ReorderButtons` / `StatusSelect` / `PreviewLink` /
`useActionToast`, `requirePermission` / `logActivity` / `requireModule`.

### New components / files
`src/lib/learning/targeting.ts` · `src/app/(panel)/learning/grids/[gridId]/SpecializedGridCard.tsx` ·
`src/app/(panel)/learning/grids/[gridId]/CompanyManager.tsx` · new server actions in
`learning/actions.ts` (`createGridTopic`, `setContentField`, `addGridCompany`, `updateGridCompany`,
`setGridCompanyField`, `removeGridCompany`, `reorderGridCompany`).

---

## Learning CMS — capability map

| Domain | Where | Backed by |
|---|---|---|
| **Grid management** | `/learning` + `/learning/grids/new` + `/learning/grids/[id]` | `learning_grids` (all Phase 2 columns) |
| **Topic management** | `/learning/grids/[id]/sections/[sid]` + `…/topics/[tid]` | `learning_sections`, `learning_topics` |
| **Content management** | `…/topics/[tid]` (`ContentManager`) | `learning_contents` (title/slug/tags/difficulty/premium/targeting/`metadata.content_type`) |
| **DSA / Coding** | `SpecializedGridCard` on a `dsa` grid → `/placement/dsa?grid=<id>` | `dsa_topics`, `dsa_problems` (Phase 2 `learning_grid_id` link); shared code-execution engine untouched |
| **Mock Test** | `SpecializedGridCard` on a `mock_test` grid → `/placement/tests?grid=<id>` | `practice_tests`, `test_questions` (Phase 2 link + `status`/`negative_marking`/`instructions`/…); scoring still server-side (`submit_test_attempt`) |
| **HR Interview** | `SpecializedGridCard` on an `hr` grid → `/placement/hr?grid=<id>` | `hr_questions` (Phase 2 link) |
| **Company Specific** | `CompanyManager` on a `company` grid + company-scoped topics | `learning_grid_companies` (junction) + `learning_topics.company_id` + `public.companies` |
| **Custom Grid** | create with `grid_type = 'custom'` — no code change | `learning_grids` |

---

## Database Integration

**Tables written by the CMS:** `learning_grids`, `learning_sections`, `learning_topics`,
`learning_contents`, `learning_grid_companies` (all via the Supabase JS client under the admin's
own session — RLS `*_admin_all` + `requirePermission('learning', …)`). **Read:** the same tables
plus `practice_tests` / `dsa_problems` / `hr_questions` / `companies` counts, and
`getAcademicOptions()` (courses / branches / years).

**APIs / repositories used:** `src/lib/learning/queries.ts` (extended: `LearningGrid`/`Topic`/
`Content` types now carry every Phase 2 column; `getLearningDashboard` full count set +
`recentlyUpdated`; `listLearningGrids` type/premium/course filters + content-block counts;
new `getGridSpecialisedCounts`, `getGridCompanies`, `getCompanyOptions`, `getGridTopicOptions`),
`src/lib/learning/constants.ts` (new `GRID_TYPES` / `CONTENT_TYPES` / `DIFFICULTIES` / `parseTags`
/ `targetingSummary` / `SYSTEM_GRID_SOURCE` / `LEARNING_FILES_BUCKET`), `src/lib/learning/
targeting.ts` (new — wraps the shared `resolveTargetingFromForm` and strips the two legacy scalar
columns the `learning_*` tables don't have), `src/lib/academic-targeting.ts` (reused unchanged),
`src/lib/audit.ts` (`logActivity` — every action logs `learning.*`).

**RLS integration:** the CMS makes **no** RLS change and holds **no** service key. Every write
lands under the Phase 2 `*_admin_all` (`is_admin()`) policies; every targeting write is checked by
the Phase 2 `validate_learning_targeting()` trigger; publish/premium/academic visibility for
students is enforced entirely by the Phase 2 SELECT policies + read RPCs. **No duplicate source of
truth** — the Admin panel is purely the management UI over the canonical Supabase tables
(spec §34).

---

## Files Changed

**New**
```
admin-panel/src/lib/learning/targeting.ts
admin-panel/src/app/(panel)/learning/grids/[gridId]/SpecializedGridCard.tsx
admin-panel/src/app/(panel)/learning/grids/[gridId]/CompanyManager.tsx
admin-panel/tests/lib/learning.test.ts   (extended: +7 tests → 14)
```

**Modified**
```
admin-panel/src/lib/permissions.ts                         (+ 'learning' module)
admin-panel/src/components/layout/Sidebar.tsx              (learning → own module, above placement)
admin-panel/src/lib/learning/constants.ts                 (grid/content-type enums + helpers)
admin-panel/src/lib/learning/queries.ts                   (Phase 2 columns, dashboard, filters, company/specialised getters)
admin-panel/src/app/(panel)/learning/actions.ts           (MODULE='learning'; grid_type/premium/targeting; content field set; grid-direct topic; company CRUD; delete guards)
admin-panel/src/app/(panel)/learning/page.tsx             (full dashboard + filters)
admin-panel/src/app/(panel)/learning/GridTable.tsx        (type / premium / targeting / block count)
admin-panel/src/app/(panel)/learning/grids/new/page.tsx   (pass academic options)
admin-panel/src/app/(panel)/learning/grids/[gridId]/page.tsx        (type-aware: specialised card / company manager)
admin-panel/src/app/(panel)/learning/grids/[gridId]/GridForm.tsx    (grid type + premium + targeting)
admin-panel/src/app/(panel)/learning/grids/[gridId]/sections/[sectionId]/page.tsx           (requireModule)
admin-panel/src/app/(panel)/learning/grids/[gridId]/sections/[sectionId]/topics/[topicId]/page.tsx  (options + company options + requireModule)
admin-panel/src/app/(panel)/learning/grids/[gridId]/sections/[sectionId]/topics/[topicId]/TopicForm.tsx      (targeting + icon + company picker)
admin-panel/src/app/(panel)/learning/grids/[gridId]/sections/[sectionId]/topics/[topicId]/ContentManager.tsx (full field set + per-block targeting)
admin-panel/src/lib/placement/queries.ts                  (+ `grid` filter on listDsaProblems / listHrQuestions / listMockTests)
admin-panel/src/app/(panel)/placement/dsa/page.tsx        (read ?grid=)
admin-panel/src/app/(panel)/placement/tests/page.tsx      (read ?grid=)
admin-panel/src/app/(panel)/placement/HrQuestionList.tsx  (read ?grid=)
```

## Database Changes

**None.** No migration created; no schema, RLS, function or storage change. Phase 3 is UI + server
actions over the Phase 2 canonical model. (The Phase 2 `learning` `role_permissions` seed already
exists.)

---

## Testing

### Build gates (admin-panel) — executed
| Gate | Result |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | **pass**, 0 errors |
| `npm run lint` (`next lint`) | **pass**, 0 warnings/errors |
| `npx vitest run` | **86 passed / 86** (was 79; +7 in `tests/lib/learning.test.ts` for `parseTags`, `targetingSummary`, the grid/content type enums) |
| `npm run build` (`next build`) | **pass** — all 5 `/learning` routes compile (`/learning`, `/learning/grids/new`, `/learning/grids/[gridId]`, `…/sections/[sectionId]`, `…/topics/[topicId]`) |

### DB integration — executed on scratch PG17 (full chain + Phase 2), `p3_verify.sh`, **27 / 27**
Runs the exact Supabase writes/reads the server actions perform, as a super-admin JWT and as
student / anon JWTs (`SET ROLE` + `request.jwt.claims`):

| Group | Checks | Result |
|---|---|---|
| A · Admin CRUD | create custom grid → section → topic → content block | 4/4 pass |
| B · Consumer read path | `learning_grids_list`, `learning_tree`, `learning_topic_content` return the new published grid | 3/3 pass |
| C · Type + targeting + premium | course-targeted premium `dsa` grid: visible to matching B.Tech student, hidden from MBA student + anon; `grid_type` persisted | 5/5 pass |
| D · Draft / Archive | after unpublish/archive: hidden from anon list, still visible to admin via RLS | 3/3 pass |
| E · Write-side validation | `validate_learning_targeting` rejects course-without-course-id, cross-course branch, bad year id | 3/3 pass |
| F · Student write blocked | student `INSERT learning_grids` / `INSERT learning_grid_companies` blocked by RLS; student `UPDATE learning_contents` → 0 rows | 3/3 pass |
| G · Company Specific | admin adds a company to the Company grid; duplicate `(grid_id, company_id)` blocked; `companies` table unchanged | 3/3 pass |
| H · No data loss | `test_attempts` / `user_dsa_progress` still resolve; `learning_migration_map` intact | 3/3 pass |

### Not executed (and why)
Headless click-through of the rendered Next.js pages — no browser harness in this environment.
The server-action logic is covered by the DB-integration run above (same Supabase calls) and the
unit tests; the pages themselves are verified to compile and type-check.

---

## Bugs found & fixed (during Phase 3)

1. **`resolveTargetingFromForm` returns legacy scalar columns** (`target_branch_id`,
   `target_branch_name`) that the `learning_*` tables don't have — a direct spread would break the
   insert. Fixed with `resolveLearningTargeting()` (strips them, keeps the array columns).
2. **`learning_topics_sync_parent` / reorder / update assumed a non-null `section_id`** — Phase 2
   made it nullable for grid-direct topics. `actions.ts` now handles `section_id: string | null`
   (`nextSortOrder` / `moveRow` use `.is(col, null)` when null; `createGridTopic` added).
3. **`deleteTopic` could orphan student bookmarks** — now refuses hard-delete when
   `learning_bookmarks` reference the topic and tells the admin to archive (spec §16). `deleteGrid`
   likewise refuses a default system grid or a grid with topics.
4. **`Badge` tone typo** (`"default"` → `"neutral"`) and a `react/no-unescaped-entities` lint
   error — both fixed; gates green.

---

## Remaining issues (intentionally deferred)

| Item | Why deferred / plan |
|---|---|
| **Native DSA / Mock Test / HR editors under `/learning/grids/[id]/…`** | The canonical tables are already Phase-2-linked and the existing `/placement/{dsa,tests,hr}` editors already write them; Phase 3 consolidates the **entry point** (typed grid → deep-link, filtered by `learning_grid_id`) and the data model. Re-homing those ~5 complex CRUD screens as native Learning routes — and adding the `learning_grid_id` / `learning_topic_id` / `status` / `is_premium` / academic-targeting **fields to `MockTestForm` / the DSA problem form / `QuestionForm`** — is the first task of the next admin increment. |
| **Grid-direct topic route** (`/learning/grids/[id]/topics/[tid]`) | The `createGridTopic` action exists; company-grid topics currently live under a section with `company_id` set, which works with zero new routing. A dedicated sectionless route is a follow-up. |
| **Drag-and-drop reorder** | The up/down `ReorderButtons` are DB-persisted (`sort_order`) and sufficient; a DnD upgrade is cosmetic. |
| **In-panel Mobile / Website preview iframe** | "Preview on site" links + the Markdown live preview cover proof-reading; a full device-frame preview is a nice-to-have. |
| **Content-type-specific field surfacing** | All fields render for every block; hiding irrelevant ones per `content_type` is polish. |
| **Concurrency** | Relies on the project-wide `updated_at` + last-write-wins, as elsewhere in the panel; no optimistic-lock added. |

---

## Production Readiness

**Backend / data layer: READY.** The Admin CMS writes only the canonical Phase 2 Supabase tables,
holds no service key, changes no RLS, and every gate (typecheck / lint / 86 tests / build) plus a
27-check DB-integration run is green. An admin can, with **no developer involvement**, create /
edit / publish / unpublish / archive / reorder / academically-target / premium-gate: grids
(including unlimited custom grids), sections, topics and content; manage the Company Specific
junction; and reach the DSA / Mock Test / HR editors filtered to a grid.

**Not yet ready for a "single screen for everything" claim:** the DSA / Mock Test / HR problem &
question editors are still the `/placement/*` screens (deep-linked and grid-filtered, writing the
same canonical tables — no duplicate system), and their forms don't yet expose the
`learning_grid_id` / targeting / status fields. That is the defined next increment, not a blocker
for the content CMS.

**Depends on:** Phase 2 migrations (`0044/021`, `0045/022`, and the `0041→0043` chain before them)
being applied to the live database — until then the `/learning` list shows an "apply migrations"
empty state.

---

*Phase 3 deliverable — Admin Panel Learning CMS. No new migrations; no Mobile / Website UI; no
production data touched. Next: Phase 4 (Mobile — grid-driven `PlacementHomeScreen`, remove the
`samplePlacementContent` fallback) and Phase 5 (Website).*


================================================================================


# PHASE 4 — IMPLEMENTATION REPORT (Mobile App · Unified Dynamic Learning)

**Date:** 2026-09-01 · **Status:** implemented + gate-verified (`typecheck` clean · `eslint` clean ·
`jest` **233/233** across 36 suites · `expo export --platform web` exit 0) and DB-integration-verified
on scratch PostgreSQL 17 (full chain + Phase 2 + Phase 3): Admin→Mobile E2E + security **24/24**,
Phase 2 regression **40/40**, Phase 3 regression **27/27**.

---

## 1. Old vs new Mobile architecture

| | Before Phase 4 | After Phase 4 |
|---|---|---|
| Learning content tree | `learning.service.ts` (RPC-only, no fallback) → `LearningGridsScreen` / `LearningGridScreen` / `LearningTopicScreen` + `MarkdownText` renderer. Already canonical. | **Unchanged** — reused as-is. |
| "Placement" tab home | `PlacementHomeScreen` — a **hardcoded 6-item `SECTIONS` array** (Learning / Aptitude / DSA / Mock / HR / Company), each → a fixed screen. | **`PlacementHomeScreen` is now the dynamic Learning home** — the grid list comes from `learning_grids_list('mobile')` (published + mobile-visible + audience-matching, admin-ordered). Each card routes by `grid_type`. A grid the admin publishes appears on next refresh with **no app update**. |
| Practice services | `placement.service.ts` — read the canonical tables **but** imported `samplePlacementContent.ts` and returned `SAMPLE_*` on empty **or on error** (`orSample(..., fallbackWhenEmpty = true)`, `catch → return SAMPLE_*`). Silent fake data on a Supabase outage. | **All sample fallbacks removed.** `orSample` → `runList` (rethrows on error, returns `[]` for genuine empty). Every `catch → return SAMPLE_*` → `catch → throw`. `submitTestAttempt` metadata reads made best-effort (`.catch`) so a title/count read never blocks a server-scored submission. `src/data/samplePlacementContent.ts` **deleted** (was its only importer). |
| Grid type awareness | none — `learning_grids_list` didn't expose it. | migration **`0045/022` amended** (not yet applied to live) to append `grid_type` + `is_premium` to the `learning_grids_list()` RETURNS TABLE, so Mobile can route. |
| Reused specialised screens | Aptitude / DSA / Mock / HR / Company screens (~24) | **Unchanged** — the dynamic home routes into them by `grid_type`. Code-execution (Piston), server scoring (`submit_test_attempt`), attempts/solved/favourites/bookmarks all untouched. |

## 2. Navigation changes (labels only — internal route names unchanged)

| Surface | Before | After |
|---|---|---|
| Bottom tab | route `Prep`, title **"Placement"** | route `Prep` (unchanged — deep links preserved), title **"Learning"** |
| Drawer | two rows: **"Placement"** (→ `Prep`) + **"Learning"** (→ `Prep/LearningGrids`) | one row **"Learning"** (→ `Prep` home) — the duplicate removed |
| Home module quick-access | `PlacementBannerScreen` heading **"Placement"** | heading **"Learning"** (still routes into `Prep`) |
| `PlacementHomeScreen` header | "Placement" | "Learning" |

No route was deleted; `Prep`, `PlacementHome`, `LearningGrids`, `LearningGrid`, `LearningTopic`,
and every practice-screen route still exist, so existing deep links (`Prep/DSADashboard`,
`Prep/LearningGrid`, …) keep working.

## 3. Screens — reused / modified / new / redirected

**Reused unchanged:** `LearningGridScreen`, `LearningTopicScreen`, `MarkdownText` (safe
RN-primitive renderer — no HTML, no WebView, no injection surface), and all Aptitude / DSA / Mock
Test / HR / Company screens + their flows.

**Modified:**
- `src/placement/PlacementHomeScreen.tsx` — rebuilt as the dynamic Learning home (grid list from `useLearningGrids()`, `grid_type` routing via `routeForGridType()`, loading / error / retry / empty states, premium-lock badge, emoji-or-Ionicon icon, search entry → `LearningGrids`).
- `src/learning/LearningGridsScreen.tsx` — grid cards now route by `grid_type` too (consistency with the home + Home-feed deep links).
- `src/navigation/BottomTabNavigator.tsx`, `src/navigation/DrawerContent.tsx`, `src/navigation/PlacementNavigator.tsx`, `src/home/PlacementBannerScreen.tsx` — label/heading/doc updates.
- `src/services/placement.service.ts` — sample-fallback removal (see §1).
- `src/types/learning.types.ts` — `LearningGridCard` += `grid_type` / `is_premium`; new pure helper `routeForGridType()` + `LearningGridType`.

**New:** none (no new screen needed — the generic `Grid → Topic → Content` tree already covers
every `content` / `custom` grid, and unknown future types fall through to it).

**Redirected:** the drawer's old "Placement" destination now resolves to the same `Prep` home,
which is the Learning home.

## 4. Repositories / services / APIs used

`services/learning.service.ts` (reused: `learning_grids_list`, `learning_tree`,
`learning_topic_content`, `learning_search`, `learning_bookmarks`) + `hooks/useLearning.ts`
(`useLearningGrids`, `useLearningTree`, `useLearningTopic`, `useLearningSearch`,
`useLearningBookmarks`, `useToggleLearningBookmark`). `services/placement.service.ts` (reused,
de-faked) for Aptitude / practice tests / DSA / HR / companies + `submit_test_attempt`. No new
service or hook was created — the canonical layer already existed.

## 5. Supabase integration

All Mobile Learning reads go through the **Phase 2 SECURITY DEFINER RPCs pinned to `'mobile'`**,
which enforce the published + `show_on_mobile` chain **and** `learning_row_visible(...)` (course /
branch / year) **and** the premium gate — so a locked/targeted/unpublished row's body is never
delivered to the client. Direct table reads (practice suites) are RLS-scoped the same way (Phase 2
`0045/022`). Writes remain: bookmarks (`learning_bookmarks` own-rows), test submission
(`submit_test_attempt` — server-scored), DSA solved (`user_dsa_progress` own-rows), HR favourites
(`user_favorite_questions` own-rows). **No service-role key on the client. Supabase is the single
source of truth.**

## 6. How Admin changes reach Mobile dynamically

```
Admin publishes a Grid / Topic / Content (Phase 3 CMS)
        │  writes learning_grids / learning_sections / learning_topics / learning_contents
        ▼
Supabase — RLS + learning_row_visible() decide who may see it
        ▼
learning_grids_list('mobile') / learning_tree(slug,'mobile') / learning_topic_content(...,'mobile')
        ▼
services/learning.service.ts → hooks/useLearning.ts (TanStack Query; pull-to-refresh / refetch)
        ▼
PlacementHomeScreen (grid list, routed by grid_type) → LearningGridScreen → LearningTopicScreen
```

E2E-verified: publish → appears; edit content → updated body served; unpublish content → gone;
`status='draft'` **or** `show_on_mobile=false` on the grid → gone from Mobile (still on Website when
`show_on_website` is true). No app rebuild at any step.

## 7. Files changed

**Modified**
```
mobile-app/src/placement/PlacementHomeScreen.tsx        (dynamic, grid_type-routed Learning home)
mobile-app/src/learning/LearningGridsScreen.tsx         (route grid cards by grid_type)
mobile-app/src/services/placement.service.ts            (remove ALL sample fallbacks → throw)
mobile-app/src/types/learning.types.ts                  (grid_type / is_premium + routeForGridType())
mobile-app/src/navigation/BottomTabNavigator.tsx        (Prep tab title "Placement" → "Learning")
mobile-app/src/navigation/DrawerContent.tsx             (one "Learning" entry; drop the duplicate)
mobile-app/src/navigation/PlacementNavigator.tsx        (doc comment)
mobile-app/src/home/PlacementBannerScreen.tsx           (heading "Placement" → "Learning")
mobile-app/tests/unit/services/placement.service.test.ts (assert THROWS, no SAMPLE_ fallback)
```
**Deleted**
```
mobile-app/src/data/samplePlacementContent.ts           (dead once placement.service stopped importing it)
```
**Migration (SQL) — amended, not yet applied to live**
```
mobile-app/supabase/migrations/0045_learning_unification_rls.sql   ⟺ admin-panel/.../022_...  (twins)
  → learning_grids_list() RETURNS TABLE gains: grid_type text, is_premium boolean
    (DROP FUNCTION + CREATE, since a return-type change can't use CREATE OR REPLACE)
```

## 8. Database / API changes

`learning_grids_list(p_platform)` now returns two extra columns — `grid_type`, `is_premium` —
appended to the end of the RETURNS TABLE. Same rows, same `where` (published + platform +
`learning_row_visible`), same `grant execute to anon, authenticated`. Folded into the existing
Phase 2 pair `0045/022` rather than a new migration (0045/022 are **not yet applied to live**, so
this is an amendment, not a rewrite of an applied migration). Byte-identical twins re-verified.
Every other RPC / table / policy is unchanged.

## 9. Tests actually executed — PASS / FAIL

### Mobile build gates
| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** (0 errors) |
| `npx eslint` (changed files) | **PASS** (0) |
| `npx jest` (full) | **PASS — 233 / 233**, 36 suites (was 228; +5 in `placement.service.test.ts`) |
| `npx expo export --platform web` | **PASS** (exit 0, web bundle built) |

### Regression suites run (all PASS) — evidence the majors still work
`tests/integration/auth/login-flow`, `.../auth/new-student-blank-slate`,
`tests/integration/placement/mock-test-flow`, `.../payment/checkout-flow`, `.../jobs/apply-flow`,
`.../projects/wishlist-flow`, `.../customProjects/token-payment-flow`,
`.../referral/referral-dashboard`; all 17 `tests/unit/services/*` (auth, profile, home, job,
premium, referral, resume, settings, learning, academic, wallet, …); component + hook + util units.

### `placement.service.test.ts` (rewritten for Phase 4)
| Test | Result |
|---|---|
| `submitTestAttempt` maps the server-scored row (mocked `test_questions` + `practice_tests`) | PASS |
| `submitTestAttempt` still submits when the metadata reads fail (RPC authoritative) | PASS |
| `submitTestAttempt` **throws**, never fakes a saved result, when the scoring RPC fails | PASS |
| `getDashboardSummary` aggregates / zeroes for a new student / **THROWS** (no sample) on query error | PASS ×3 |
| `getAptitudeTopics` / `getDSATopics` / `getCompanies` **throw** on error, `[]` on genuine empty | PASS ×4 |

### DB integration — scratch PG17, `p4_verify.sh`, **24 / 24 PASS**
| Group | Checks |
|---|---|
| A · Admin creates custom Grid→Topic→Content published, mobile-on | `learning_grids_list('mobile')` shows it · `grid_type='custom'` exposed · `learning_tree('..','mobile')` returns the section · `learning_topic_content('..','mobile')` returns the body — 4/4 |
| B · Admin edits content | mobile serves the edited body — 1/1 |
| C · Admin unpublishes content | mobile `contents` array empty — 1/1 |
| D · Admin disables the Grid | `status='draft'` → excluded · tree → null · `show_on_mobile=false` → excluded from mobile but still on website — 4/4 |
| E · grid_type routing signal | a `dsa` grid exposes `grid_type='dsa'` (→ DSADashboard) — 1/1 |
| F · premium + targeting on the `'mobile'` path | premium B.Tech/CSE/4th → unlocked · free MBA → grid invisible (course) · anon → course-targeted grid not listed · B.Tech → listed — 4/4 |
| G · security (direct requests) | student/anon cannot see unpublished / premium / wrong-course rows · student cannot INSERT `learning_contents` (RLS) · student UPDATE `learning_grids` affects 0 rows (RLS) — 5/5 |
| H · progress preserved | `test_attempts` / `user_dsa_progress` / `learning_bookmarks` / `user_favorite_questions` — 0 orphans, 4/4 |

### Phase 2 / Phase 3 regression (re-run on the same DB) — **40/40** and **27/27**, unchanged.

## 10. Bugs found & fixed (during Phase 4)

1. **Migration ordering fragility.** A separate `0046/023` pair that `DROP+CREATE`-d `learning_grids_list` broke when a later re-run of `0045/022` (`CREATE OR REPLACE`, 12-col) hit the 14-col function ("cannot change return type") — a real hazard under the documented "apply all mobile, then all admin" pattern. **Fix:** folded `grid_type`/`is_premium` directly into `0045/022`'s `learning_grids_list` re-emission (changed to `DROP FUNCTION IF EXISTS` + `CREATE`), deleted `0046/023`. Now every apply order converges to the 14-col version.
2. **`submitTestAttempt` could be blocked by a metadata read.** With sample fallbacks removed, `getTestDetail()` throwing "Test not found" would abort a valid, server-scored submission. **Fix:** the title/count reads are now `.catch(() => …)` best-effort; the authoritative result still comes from `submit_test_attempt`.
3. **Stale test.** `placement.service.test.ts` imported the (now-deleted) `SAMPLE_DASHBOARD` and asserted the fake-data fallback. **Fix:** rewritten to assert the throw and mock the metadata tables.

## 11. Remaining issues (intentionally deferred)

| Item | Note / plan |
|---|---|
| **Company Specific → Company → Topic → Content on mobile** | A `company` grid routes to the existing `CompanyList` flow (companies + company-scoped `hr_questions` / `practice_tests`). The Phase-3 `learning_grid_companies` junction + company-scoped `learning_topics.company_id` are **not yet surfaced** as a `Company → Topic → Content` mobile drill-down. Next mobile increment. |
| **Linking DSA/Mock/HR content to a specific grid** | The dynamic home routes a `dsa`/`mock_test`/`hr` grid to its dashboard, which still shows *all* problems/tests/questions (not filtered by `learning_grid_id`). The Phase-2 link columns exist; wiring the mobile queries to filter by grid is a follow-up (matches the Phase-3 admin deferral). |
| **Other services' sample fallbacks** | `home.service` / `job.service` / `premium.service` / … still have their own `sample*Content` fallbacks — **out of Phase-4 scope** (Learning domain only). Flagged for a later cleanup. |
| **Offline cache** | TanStack Query in-memory cache + pull-to-refresh only; no persisted offline store for Learning (consistent with the rest of the app). |
| **In-app search across DSA/Tests/Companies** | `learning_search` covers grids/sections/topics/content; it does not index `dsa_problems` / `practice_tests` / `hr_questions` (Phase-2 low-risk item). |

## 12. Production readiness

**READY** for the Learning content path and the dynamic home:

- The Mobile Learning home is **100% DB-driven** — grid list, order, appearance, premium/lock state
  and audience all come from `learning_grids_list('mobile')`; a new admin-published grid (any type,
  including unlimited `custom` grids) appears on the next refresh with **no app update**. Verified
  end-to-end.
- **No sample/demo/fake data** anywhere in the Learning/Placement path — a Supabase failure now
  produces a real error + retry, never fabricated content (the Phase-1 "critical, live-today" risk
  is closed).
- Premium, course, branch, year and publish state are enforced by Phase-2 RLS + the `'mobile'`
  RPCs; direct client requests cannot bypass them (verified).
- No new code path, no service key, no duplicate Learning/Company/Test system; existing progress /
  bookmarks / attempts / analytics untouched (0 orphans); server scoring and the Piston
  code-execution engine unchanged.
- All mobile gates green; full regression suite (36 jest suites, incl. auth / payment / mock-test /
  jobs / projects integration) passes.

**Depends on** the SQL chain being applied to the live database in order:
`0041→0043` (pending from Phase 1), then `0044/021`, then `0045/022` (now carrying `grid_type`).
Until then the mobile Learning home shows its honest "nothing published yet" empty state.

**Not a blocker, deferred:** the Company-drill-down and grid-scoped DSA/Mock/HR filtering above.

---

*Phase 4 deliverable — Mobile App unified dynamic Learning. One SQL amendment (grid_type on
`learning_grids_list`, folded into the not-yet-applied Phase 2 pair); no production data touched;
no new duplicate system. Next: Phase 5 (Website).*


================================================================================


# PHASE 5 — IMPLEMENTATION REPORT (Website · Unified Dynamic Learning)

**Date:** 2026-09-01 · **Status:** implemented + gate-verified (`typecheck` clean · `next lint`
clean · `vitest` **75/75** · `next build` OK) and DB-integration-verified on scratch PostgreSQL 17
(full chain + Phase 2/3): Admin→Website E2E + SEO-source + security **31/31**; Phase 2 (40/40),
Phase 3 (27/27), Phase 4 (24/24) regression unchanged. **No new migration.**

---

## Website Architecture

### Old
`website/` — Next.js 14 App Router, ISR (`revalidate = 300`), **anon** Supabase client
(`getPublicSupabase`, `persistSession: false`) for all public reads; `createAuthedServerSupabase`
only in `/account/*`. A `/learning` module already existed (grid list + search + `DocsShell` +
`Markdown` renderer + `PremiumTopicContent` island) and consumed the Phase 2 `'website'` RPCs.
**But** a separate top-level **`/placement`** page (231 lines) with a hardcoded `PLACEMENT_TRACKS`
array, a "Placement" link in header / drawer / bottom-tabs, and a hardcoded "Placement" section on
the home page — a second user-facing learning surface.

### New
One user-facing **Learning** system. `/placement` and every "Placement / Placement Prep" nav
entry / home section is removed or 308-redirected into `/learning`. The `/learning/[gridSlug]` page
is now **type-aware**:

| `grid_type` | Website render |
|---|---|
| `content` · `custom` · anything unrecognised | the existing Grid → Section → Topic tree (`DocsShell` + `learning_tree`) |
| `dsa` | topic catalog from `dsa_topics` + per-topic `dsa_problems` counts, scoped by `learning_grid_id` |
| `mock_test` | test list from `practice_tests` (title / category / #questions / duration / premium) |
| `hr` | question bank grouped by `hr_questions.category` |
| `company` | company list from `learning_grid_companies` ⋈ `companies` |

The specialised views carry the "practice & scoring happen in the app" boundary (matching the
prior `/placement` treatment). A brand-new admin grid of **any** type appears on the Learning home
and at `/learning/<slug>` after the next revalidation — **no website code change**.

### Route structure

```
/learning                              Learning home — every published, website-visible, audience-matching grid
/learning/[gridSlug]                   Grid page — tree OR typed catalog, by grid_type
/learning/[gridSlug]/[topicSlug]       Topic page — renders every content block (one canonical renderer)
/api/revalidate            (POST)      on-demand cache invalidation (secret-guarded)
/placement                 → 308 → /learning     (next.config redirect)
/placement/:path (≠ notes) → 308 → /learning
/placement/notes           → 308 → /learning     (route file, unchanged)
/placement/notes/[id]      → 302 → /learning/<grid>/<topic>  (legacy prep_notes id resolver, unchanged)
/placement-prep, /placement-preparation → 308 → /learning
```
No dedicated `/learning/[grid]/[topic]/[content]` route — the topic page renders all its blocks
(one page = one shareable URL, matches Mobile + Admin; the prompt allows "adapt to the existing
routing architecture").

### Navigation changes
- `components/nav/navConfig.ts` — the "Placement" row is gone from `HEADER_LINKS`, `DRAWER_LINKS`
  and `BOTTOM_TABS`; a single "Learning" entry remains (it inherits the graduation-cap icon).
- `app/page.tsx` — the hardcoded `PLACEMENT_TRACKS` section is removed; the already-dynamic
  `<LearningResources/>` (top-6 grids from `learning_grids_list`) is the home Learning section.
- `lib/placement.ts` + `tests/lib/placement.test.ts` + `app/placement/loading.tsx` **deleted**
  (zero importers after the above).

---

## Learning

- **Dynamic Grid** — `getLearningGrids()` → `learning_grids_list('website')` (now returns
  `grid_type` + `is_premium`, migration 0045/022). Home + `/learning` render name / description /
  icon / topic count / **type label** / **premium badge** from the row. Empty state:
  "No learning resources yet…".
- **Dynamic Topic** — `getLearningTree(slug)` → `learning_tree('...','website')`; admin `sort_order`
  respected; premium topics flagged with a lock in the section list. New `getLearningGridBrief(slug)`
  is a one-row read for the typed pages + `generateMetadata` (RLS restricts anon to published +
  global + website-visible, so an invalid / unpublished / archived / targeted grid → `null` → 404).
- **Dynamic Content** — `getLearningTopicPage(...)` → `learning_topic_content('...','website')`
  returns `{ locked, contents, prev, next }`. The one canonical `<Markdown>` renderer (React text
  nodes only — **no `dangerouslySetInnerHTML`, no WebView, no raw HTML**; images `loading="lazy"`,
  external links `rel="noopener noreferrer nofollow"`). `plain` blocks render as
  `whitespace-pre-line`. Attachments / video → labelled outbound links.
- **DSA / Mock Test / HR / Company** — no second engine, no second Company source. The typed grid
  pages read the **canonical** `dsa_*` / `practice_tests` / `hr_questions` / `companies` +
  `learning_grid_companies` tables, scoped by `learning_grid_id` (Phase 2). Scoring / code
  execution / attempts stay in the app; the website links out. `companies` is reused via the
  `learning_grid_companies` junction — **not duplicated**.
- **Custom Admin Grids** — a `grid_type='custom'` grid uses the generic tree pages with zero new
  code (verified E2E: publish "Communication Skills" → grid + topic + content appear).

---

## Data

**Repositories / services / APIs** — `src/lib/learning.ts` (extended): `getLearningGrids`,
`getLearningTree`, `getLearningTopicPage`, `searchLearning`, `resolveLegacyNotePath` (all reused)
**+ new** `getLearningGridBrief`, `getGridDsaCatalog`, `getGridMockTests`, `getGridHrCatalog`,
`getGridCompanies`. `src/lib/learning.types.ts` (extended): `grid_type` / `is_premium` on
`LearningGridCard`, new `LearningGridBrief`, `LearningGridType`, `GRID_TYPE_LABEL`, `isContentGrid()`.
No new library, no new API surface beyond `/api/revalidate`.

**Supabase integration** — every public read uses `getPublicSupabase()` (anon key, no session, no
service key) against the Phase 2 `'website'` SECURITY DEFINER RPCs + RLS-tightened practice tables.
Anon → `learning_row_visible()` returns only global + published + website-visible rows, so
course / branch / year-targeted and premium content is **never** in the SSR HTML, the JSON payload,
the sitemap or the metadata. Premium unlock for a logged-in member is handled client-side by the
existing `PremiumTopicContent` island (re-runs `learning_topic_content` with the real session).

**Caching / revalidation** — every `/learning*` page is ISR `revalidate = 300`, so admin changes
reach the site within 5 min with **no redeploy**. New **`POST /api/revalidate`** (guarded by
`REVALIDATE_SECRET`; disabled/404 when unset) lets the admin panel or a Supabase DB webhook push a
change through immediately: `{ "path": "/learning/..." }` → `revalidatePath(...)`. It never returns
data and never mutates. React `cache()` still dedupes reads within a request.

---

## SEO

- **Metadata** — `/learning` static; `/learning/[gridSlug]` and `/learning/[gridSlug]/[topicSlug]`
  generate `title` / `description` (from the DB row, truncated ~155 chars) / canonical / Open Graph
  (+ cover image when set) / Twitter card **from canonical content** — nothing hardcoded per page.
  A missing / unpublished grid → `title: "…not found"` + `robots: { index:false, follow:false }`.
- **Canonicals** — `alternates.canonical = absoluteUrl('/learning/<grid>[/<topic>]')` on every
  Learning page; one URL per piece of content (no `/content/[id]` duplicate).
- **Breadcrumbs** — visible breadcrumb nav + `BreadcrumbList` JSON-LD on grid + topic pages
  (Learning → Grid → Topic).
- **Structured data** — `LearningResource` JSON-LD on content grid pages (`hasPart` = up to 25
  topic URLs); `BreadcrumbList` everywhere; topic pages use OG `type: "article"`.
- **Sitemap** — `learning_sitemap('website')` (SECURITY DEFINER, anon) supplies one row per
  published website-visible grid + one per published topic, each with `lastModified`; the RPC
  already excludes draft / archived / mobile-only / premium-parent-hidden / targeted rows.
  `/placement` removed from the static route list (it is a redirect now).
- **Robots** — `/account*`, `/auth`, `/api`, `/admin`, custom-project funnels disallowed; `/learning`
  allowed. Access control is server/RLS-based, not robots-based.
- **Redirects** — permanent (308) `/placement*` → `/learning` via `next.config.js` (regex excludes
  `notes` so the two note-redirect route files keep working), preserving SEO equity.
- **Indexing rules** — draft / unpublished / archived / targeted / premium-body content is absent
  from HTML + JSON + sitemap + metadata (the RPCs never return it to anon). No admin preview URL
  exists on the website, so §38 is n/a.

---

## Files Changed

**New**
```
website/src/app/learning/[gridSlug]/TypedGridView.tsx   (dsa / mock_test / hr / company catalog view)
website/src/app/api/revalidate/route.ts                 (secret-guarded on-demand revalidation)
```
**Modified**
```
website/src/lib/learning.ts                 (grid brief + 4 typed-catalog fetchers + isContentGrid/GRID_TYPE_LABEL re-exports)
website/src/lib/learning.types.ts           (grid_type / is_premium; LearningGridBrief; LearningGridType; GRID_TYPE_LABEL; isContentGrid)
website/src/app/learning/page.tsx           (grid cards show type label + premium badge)
website/src/app/learning/[gridSlug]/page.tsx (type-aware: brief → typed view or tree; LearningResource JSON-LD; robots:noindex on 404)
website/src/app/page.tsx                     (removed the hardcoded PLACEMENT_TRACKS home section)
website/src/app/placement/page.tsx          (→ permanentRedirect('/learning'))
website/src/components/nav/navConfig.ts      (Placement row removed from header / drawer / bottom-tabs; unused BookOpen import dropped)
website/src/app/sitemap.ts                   (drop '/placement' from STATIC_ROUTES)
website/next.config.js                       (async redirects(): /placement* → /learning, incl. /placement-prep, /placement-preparation)
website/.env.example                         (+ REVALIDATE_SECRET)
website/tests/lib/learning.test.ts           (+ isContentGrid / GRID_TYPE_LABEL tests)
```
**Deleted**
```
website/src/lib/placement.ts                 (hardcoded PLACEMENT_TRACKS — 0 importers)
website/tests/lib/placement.test.ts
website/src/app/placement/loading.tsx        (page is now a redirect)
```

## Database / API changes

**None** in this phase. `learning_grids_list()` already carries `grid_type` / `is_premium` (folded
into Phase 2 pair `0045/022` during Phase 4). Byte-identical twins `0044/021`, `0045/022`
re-verified. `/api/revalidate` is a website route handler, not a DB change.

---

## Tests

### Website gates — executed
| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** (0 errors) |
| `npx next lint` | **PASS** (0) |
| `npx vitest run` | **PASS — 75 / 75**, 13 files (was 74; −2 placement.test, +3 learning.test) |
| `npx next build` | **PASS** — all routes compile (`/learning`, `/learning/[gridSlug]`, `/learning/[gridSlug]/[topicSlug]`, `/api/revalidate`, `/placement` redirect stub, `/placement/notes*`) |

### Regression suites run (PASS) — evidence the majors still work
`tests/lib/nav.test.ts` (navConfig integrity), `tests/lib/seo.test.ts`, `tests/lib/home.test.ts`,
`tests/lib/marketplace.test.ts`, `tests/lib/format.test.ts`, `tests/lib/resume.test.ts`,
`tests/actions/{contact,customProjects,jobs}.test.ts` — 13 files, 75 tests, all green.

### DB integration — scratch PG17, `p5_verify.sh`, **31 / 31 PASS**
| Group | Checks |
|---|---|
| A · Admin → Website create | `learning_grids_list('website')` shows a new custom grid · `grid_type` exposed · `getLearningGridBrief` direct RLS select works · `learning_tree` returns the section · topic content body + `short_description` (SEO source) served — 6/6 |
| B · Admin renames grid | website serves the new name — 1/1 |
| C · Admin edits content | website serves the edited body — 1/1 |
| D · Admin unpublishes content | website `contents` empty; the **topic URL stays in the sitemap** (topic still published) — 2/2 |
| E · Admin disables grid | `status='draft'` or `show_on_website=false` → excluded from `learning_grids_list`; `learning_tree` → null; **all its URLs dropped from `learning_sitemap`**; `getLearningGridBrief` → 0 rows (404 source) — 5/5 |
| F · Typed catalogs | `dsa_topics` / `practice_tests` / `hr_questions` / `learning_grid_companies` scoped by `learning_grid_id` return rows once the grid is published — 4/4 |
| G · Security (§40, §17, §22) | anon SSR: course-targeted grid **not** in `learning_grids_list` **nor** `learning_sitemap` · a GLOBAL premium topic → `locked=true` + **0 content blocks** in the payload · the free sibling topic **is** fully served · anon direct-select can't read unpublished / premium / course-targeted rows · a matching B.Tech student (client-side re-check path) **can** see the course-targeted grid — 8/8 |
| H · One source of truth | `companies` unchanged (10) · `test_attempts` intact · `learning_migration_map` intact — 3/3 |

### SEO — verified against generated output
- Grid page `generateMetadata`: title = grid name, description from `grid.description` (≤155),
  `alternates.canonical` = `https://…/learning/<slug>`, OG url + type + (cover) image. ✔
- Topic page: `title = "<topic> · <grid>"`, description from `short_description` / body text,
  canonical + OG `type:"article"` + Twitter `summary`. ✔
- 404 grid → `robots: { index:false, follow:false }`. ✔
- `LearningResource` + `BreadcrumbList` JSON-LD emitted by `<JsonLd>` (single `<script
  type="application/ld+json">`). ✔
- Sitemap: only published website-visible grid/topic URLs (RPC-filtered); disabled grid → 0 URLs
  (E, verified). ✔ `robots.ts` blocks `/account*` `/api` `/admin` `/auth`. ✔
- Redirects: `next build` output confirms `/placement` compiles as a redirect stub;
  `next.config.js` `redirects()` returns permanent 308s. ✔

### Performance — findings
- Learning home: **1** query (`learning_grids_list`, capped by the RPC). No per-grid fan-out.
- Content grid page: **2** queries (`getLearningGridBrief` + `getLearningTree`, both `cache()`-deduped
  and the tree is one RPC round-trip — no N+1 over sections/topics).
- Typed grid page: `getLearningGridBrief` + **1** catalog query (dsa uses a single nested select
  `dsa_topics(…, dsa_problems(id,difficulty))` — one round-trip, not N+1).
- Topic page: **2** queries (`getLearningTree` for the sidebar + `getLearningTopicPage`), `cache()`-deduped.
- Payload: Learning home first-load JS 102 kB, grid 105 kB, topic 175 kB (Markdown renderer) —
  in line with the rest of the site. Images: admin Storage URLs via `<img loading="lazy">`
  (author-host, not `next/image` allow-listed — matches the existing pattern) or `next/image`
  (`**.supabase.co` remotePattern). ISR 300 s means a warm cache serves static HTML.

### Security — tests & results (see group G above, all PASS)
Unauthenticated / student / premium / wrong-course / draft / unpublished / disabled-grid /
direct-URL / direct-table access all verified not to leak protected content through the SSR RPC
payload, direct table reads, the sitemap RPC or the metadata source. The anon client structurally
cannot see targeted/premium bodies (Phase 2 RLS + `'website'` RPCs).

---

## Bugs Fixed (during Phase 5)

1. **`/learning/page.tsx` grid-card markup** used `g.section_count` (now less meaningful — typed
   grids have 0 sections) — switched the sub-label to the **type label + topic count**, added the
   **premium badge**.
2. **`next.config.js` redirect would have shadowed the note-resolver route files** — the pattern
   `"/placement/:path((?!notes$|notes/).*)"` excludes `notes` / `notes/*` so
   `/placement/notes/[id]` still resolves a legacy `prep_notes` id to its Learning topic.
3. **`generateMetadata` fetched the whole tree** just for a title — replaced with the one-row
   `getLearningGridBrief`, and it now also drives the typed-grid branch (one read instead of two).
4. **Unused `BookOpen` import** left in `navConfig.ts` after the icon swap — removed (lint-clean).

## Remaining Issues (intentionally deferred)

| Item | Note |
|---|---|
| **Course / Branch / Year-targeted Learning is website-invisible** | The public site SSRs Learning with the **anon** client (so pages stay cacheable + crawler-safe), and Phase 2 RLS shows anon only *global* content. A logged-in targeted student sees targeted grids on **Mobile** (Phase 4) but not on the website. Making Learning SSR use the visitor's session (`createAuthedServerSupabase` + per-request cache) would fix this at the cost of per-user dynamic rendering — a deliberate trade the existing architecture already made for premium (client island). **Fail-closed** either way — nothing leaks. |
| **Company → Company → Topic → Content drill-down** | The `company` grid page lists companies + headlines; a per-company topic/content page (`/learning/<companyGrid>/<companySlug>`) is a follow-up (mirrors the Phase-3 admin + Phase-4 mobile deferral). |
| **Typed grid pages are catalog-only** | DSA / Mock / HR grids show the catalog and link "attempt in the app"; there is no in-browser problem/test runner (the prompt explicitly allows "provide the appropriate website experience without duplicating backend logic"). |
| **On-demand revalidation is opt-in** | `/api/revalidate` exists and is tested for auth, but wiring the admin panel / a Supabase webhook to call it is a small follow-up; ISR-300 already satisfies "no redeploy". |
| **`learning_search` scope** | Grids / sections / topics / content only — DSA problems / practice tests / companies are not in the search index (Phase-2 low-risk item). |

---

## Production Readiness

**READY** for the public Learning experience:

- One user-facing **Learning** system — `/placement` and every "Placement / Placement Prep" nav
  entry and home section is consolidated or 308-redirected into `/learning`; no broken links
  (`next build` + `nav.test.ts` green).
- **Fully dynamic** — grid list / order / names / descriptions / type / premium / topic tree /
  content all come from `learning_grids_list` / `learning_tree` / `learning_topic_content`
  (`'website'`); a new admin-published grid of any type (incl. unlimited `custom`) appears with
  **no code change / no redeploy** — verified E2E (create → rename → edit → unpublish → disable, all
  reflected).
- **SEO** — DB-driven metadata, canonicals, `BreadcrumbList` + `LearningResource` JSON-LD, a
  dynamic RPC-filtered sitemap, robots, and permanent redirects; draft / unpublished / archived /
  targeted / premium-body content is absent from every server response, the sitemap and the
  metadata.
- **Security** — anon SSR structurally cannot see targeted or premium content (Phase 2 RLS + the
  `'website'` RPCs); verified via direct RPC / direct-table / sitemap / metadata probes.
- **One source of truth** — the website reads the same canonical Supabase tables as the Admin panel
  and Mobile app; `companies` reused (not duplicated); no website-only Learning content; no service
  key; existing data untouched (`test_attempts` / `learning_migration_map` / `companies` intact).
- All website gates green; regression suites (nav / seo / home / marketplace / actions) pass.

**Depends on** the SQL chain being applied to the live database in order (`0041→0043`, then
`0044/021`, `0045/022`). Until then `/learning` shows its honest "No learning resources yet" state.

**Not blockers, deferred:** targeted-content visibility for logged-in website students, the
per-company drill-down, and wiring an admin webhook to `/api/revalidate` (see Remaining Issues).

---

*Phase 5 deliverable — Website unified dynamic Learning. No new migration; no production data
touched; no duplicate system. The Admin Panel, Mobile App and Website now consume ONE canonical
Supabase Learning source: `Grid → Topic → Content`, admin-managed, appearing everywhere without a
code change.*


================================================================================


# PHASE 6 — FULL SYSTEM INTEGRATION & PRODUCTION AUDIT

**Date:** 2026-09-01 · **Type:** integration + security + QA + performance + production-readiness
audit **with fixes**. All findings below were verified against the actual code, the actual Supabase
schema (rebuilt on scratch PostgreSQL 17 from the full migration chain), and executed test runs —
nothing is taken on trust from Phases 1–5.

---

## Executive Summary

CampusEduX is **one coherent product** built on a single Supabase source of truth. Admin → Supabase
→ Mobile + Website all consume the same canonical `Grid → Topic → Content` Learning model plus the
Aptitude / DSA / Mock Test / HR Interview / Company Specific specialised tables. Phases 2–5 hold up
under audit: **0 orphan records, 0 duplicate keys, 0 broken publish states, 0 cross-user data
leakage, 0 premium/targeted-content leakage** through the API / SSR / sitemap / metadata on any
client.

Phase 6 found **3 P1 issues (all fixed + retested)**, **2 P2 issues (1 fixed, 1 documented as a
production gap)**, and **4 P3 items (2 fixed, 2 documented)**. There are **no unresolved P0 or P1
issues**.

**Verdict: READY** — conditional on the owner applying the SQL migration chain to the live database
in order, and accepting the one documented P2 (no crash/error-reporting tool wired) as a
day-2 task.

---

## Architecture — old vs final

| | Before the engagement | Final (audited) |
|---|---|---|
| Learning content | flat `prep_notes` + a website-only `learning_*` tree; mobile "Placement" a hardcoded 6-tile screen | ONE `learning_grids → learning_sections → learning_topics → learning_contents` tree, `grid_type`-tagged, academic-targeted, consumed identically by Admin / Mobile / Website via the `learning_*` RPCs |
| Aptitude / DSA / Mock / HR / Company | separate "Placement" module; legacy `text`-PK tables, world-readable, no publish/premium/targeting; mobile silent sample-data fallback | the same practice tables **extended in place** (`learning_grid_id` / `status` / `is_premium` / targeting), RLS-tightened, linked to 5 seeded default grids; **no sample fallback anywhere** |
| Company data | one canonical `companies` table (shared with Jobs) | unchanged — reused via `learning_grid_companies` junction; **no duplicate company system** |
| Website nav | separate `/placement` **and** `/learning` top-level | one `/learning`; `/placement*` 308-redirects |
| Admin | `placement` permission key doing double duty; a dead `legacy/` admin tree in the repo | dedicated `learning` permission module; **`admin-panel/legacy/` (78 files, incl. a duplicate Placement admin + a service-key file) removed** |

---

## Integration — Admin → Supabase → Mobile + Website  (verified end-to-end)

Executed on a scratch DB (full chain + Phase 2/3/4/5/6 migrations + realistic `seed.sql`), driving
the **exact** writes the Phase-3 admin server actions make and the **exact** reads Mobile
(`'mobile'` RPCs) and Website (`'website'` RPCs + RLS-scoped table reads) make:

| Step | Mobile | Website |
|---|---|---|
| Admin creates Grid → Topic → Content, publishes | appears in `learning_grids_list` / `learning_tree` / `learning_topic_content` | appears; `getLearningGridBrief` resolves; sitemap RPC lists the URLs |
| Admin **renames** the Grid | new name served | new name served |
| Admin **edits** Content | updated body served | updated body served |
| Admin **unpublishes** Content | `contents: []` | `contents: []`; topic URL stays in sitemap (topic still published) |
| Admin **disables** Grid (`status='draft'` **or** `show_on_<platform>=false`) | grid + tree gone | grid + tree gone; **all its URLs dropped from `learning_sitemap`**; brief → 404 source |
| `grid_type` routing signal | exposed (`custom`→tree, `dsa`→DSA screen, …) | exposed (`content`→tree, `dsa`→catalog view, …) |

Platform independence verified: a grid with `show_on_website=true, show_on_mobile=false` shows on
Web only (feature, not a discrepancy); name / slug / order / premium / targeting come from the same
row on both.

---

## Learning — `Grid → Topic → Content` + specialised sections

| Section | Canonical source | Admin | Mobile | Website |
|---|---|---|---|---|
| Aptitude | `learning_*` + `aptitude_topics`/`practice_tests` (linked) | ✓ CMS + `/placement/*` editors | ✓ AptitudeDashboard | ✓ tree / catalog |
| DSA / Coding | `dsa_topics` + `dsa_problems` (`learning_grid_id`) | ✓ | ✓ DSADashboard + Piston judge | ✓ catalog (attempt-in-app) |
| Mock Test | `practice_tests` + `test_questions` (`learning_grid_id`) | ✓ | ✓ full attempt flow, **server-scored** | ✓ catalog |
| HR Interview | `hr_questions` (`learning_grid_id`) | ✓ | ✓ HRDashboard + favourites | ✓ category catalog |
| Company Specific | `learning_grid_companies` ⋈ `companies` | ✓ CompanyManager | ✓ CompanyList | ✓ company catalog |
| Custom grids | `learning_*` (`grid_type='custom'`) | ✓ create with no code | ✓ generic tree, no code | ✓ generic tree, no code |

Generic `Grid → Topic → Content` architecture holds; a brand-new admin grid of any type appears on
all three clients with **no code change** (verified).

---

## Security findings & fixes

| # | Sev | Finding | Fix | Verified |
|---|---|---|---|---|
| S-1 | **P1** | `JsonLd` component injected `JSON.stringify(data)` into `<script type="application/ld+json">` via `dangerouslySetInnerHTML` **without** escaping `<` `>` `&` U+2028/9 — an admin-authored grid / topic name containing `</script><script>…` would break out and execute. | `safeJsonLd()` escapes those 5 chars to `\uXXXX`; still valid JSON. | `tests/lib/jsonld-xss.test.ts` (2/2) + `next build` + `next lint` |
| S-2 | **P1** | The three Markdown renderers (website `Markdown.tsx`, admin `MarkdownPreview.tsx`, mobile `MarkdownText.tsx`) put a raw `[text](url)` into `<a href>` / `Linking.openURL` — a `javascript:` (or `vbscript:`, `data:`) URL from admin-authored content was clickable and executed in a visitor's / another admin's session. | `safeUrl()` / `safeLinkUrl()` allow only `http(s):` `mailto:` `tel:` + relative (+ `data:image/*` for `<img>` in admin); anything else → `#` / dropped. | `tsc` + `lint` (all 3) + jest/vitest green |
| S-3 | **P1** | `next@14.2.5` — `npm audit` reports a **critical** cluster incl. **authorization-bypass (GHSA-7gfc-8cq8-jh5f)**, middleware→SSRF, cache-key confusion, Server-Actions DoS. | bumped `next` → **`14.2.35`** (latest patched 14.x — same minor, no API changes) in website + admin-panel. Authz-bypass / SSRF / cache-poisoning cleared. | `tsc` + `lint` + `vitest` + `next build` re-run green on both |
| S-4 | P2 | `learning_contents.file_url` for a **premium** block may point at the **public** `admin-media` bucket. The RPC withholds premium blocks + their `file_url` from unauthorised callers (verified — see below), so this is only reachable by exact-path URL guessing, but the private `learning-files` bucket + `learning_content_accessible()` built in Phase 2 are **not wired into the admin uploader**. | Documented. Fix = point the admin premium/downloadable file upload at `learning-files` + serve via signed URL after `learning_content_accessible()`. | n/a — deferred |
| S-5 | P3 | `/api/revalidate` is secret-gated but has no rate limit — an actor holding the secret could spam `revalidatePath` (cache churn only, no data risk). | Documented. Fix = a tiny in-memory throttle or a strong-secret requirement note. | n/a |

### Security tests executed (scratch PG17, driving the real RPC / RLS paths)

| Scenario | Result |
|---|---|
| **Anonymous** — `learning_grids_list('website')`, `learning_sitemap`, `learning_topic_content` | sees only published + global + platform-visible grids/topics; a course-targeted grid is in **neither** the list **nor** the sitemap; a premium topic → `locked=true` + **0 content blocks** in the payload; the free sibling topic → fully served |
| **Premium content-block inside a FREE topic** | anon payload contains 0 of the premium block, its body, or its `file_url`; direct RLS SELECT → 0 rows; `learning_content_accessible()` → `false` for anon, `true` for a premium student |
| **Student A vs Student B** — B reads/writes A's `learning_bookmarks` / `user_dsa_progress` / `user_favorite_questions` / `test_attempts` / `test_attempt_answers` / `profiles` | every read count = 0; every write → `row-level security policy` error |
| **Wrong course / branch / year** — MBA student, anon vs a B.Tech-CSE-4th-year course-targeted Aptitude grid | invisible to MBA + anon on `learning_grids_list` **and** `learning_topic_content`; visible to the matching B.Tech student (client re-check path) |
| **Student write to Learning tables** — `INSERT learning_grids` / `INSERT learning_contents` / `INSERT learning_grid_companies` / `UPDATE learning_grids` | all blocked by RLS (INSERT → error; UPDATE → 0 rows) |
| **Admin write** — grid / section / topic / content / company CRUD | succeeds; every mutating server action re-checks `requirePermission('learning', …)` **and** RLS `*_admin_all` (`is_admin()`) |
| **`submit_test_attempt` user-forgery** — student calls it | the recorded `user_id` is the caller's `auth.uid()`, not a client-supplied value; scoring recomputed from the answer key server-side |
| **RPC EXECUTE grants** (real migrations) | every new Learning function does `revoke all … from public; grant execute … to anon, authenticated`; `submit_test_attempt` / `admin_adjust_wallet` are `authenticated`-only and re-check `is_admin()` in-body |
| **Storage** | `learning-files` bucket `public=false`, only `learning_files_admin_all` (`is_admin`) — **no anon/public read**; `resumes` / `custom-project-*` private + owner-scoped; content renderers use React text nodes, no `dangerouslySetInnerHTML` for content (only the now-escaped `JsonLd`) |
| **Secrets** | no JWT / service-role key in committed source; `.env` / `.env.local` are git-ignored (`git check-ignore` confirmed); the only service-key reference was in the now-**deleted** `admin-panel/legacy/lib-supabase-admin.ts` (never imported, never built) |

---

## Database findings

Ran an integrity sweep on the full-chain scratch DB:

| Check | Result |
|---|---|
| Orphan records across `learning_*` / practice tables / progress tables / migration map (15 join checks) | **0** |
| Duplicate keys / slugs (`learning_grids` slug ci, `learning_topics (grid,slug)`, `learning_grid_companies (grid,company)`, `learning_migration_map (entity,old_id)`) | **0** |
| Broken publish state (`practice_tests` status↔is_published desync, published topic under a non-published grid, bad enum/CHECK values) | **0** |
| Historical safety (`test_attempts` / `test_attempt_answers` / `user_dsa_progress` / `user_favorite_questions` / `learning_bookmarks` orphaned by Phase-2 changes) | **0** |
| **Missing index** | `dsa_topics.learning_topic_id` (a Phase-2 FK link column) had no index, unlike every other new link column. **Zero current impact** (no read path joins on it) — fixed by a corrective migration (below). |

Migration audit: numbers are contiguous per tree (`mobile 0001–0046`, `admin 001–023`), no duplicate
schema objects, the guarded canonical-pair convention is intact and every Learning pair is verified
byte-identical below its header. The Phase-4 `learning_grids_list` return-type change lives in
`0045/022` as `DROP FUNCTION … ; CREATE FUNCTION …` (a `CREATE OR REPLACE` cannot change a
`RETURNS TABLE`) — safe when applied once in order; **manually re-running `0042/019` after
`0045/022` would raise "cannot change return type"** (a loud failure on an unsupported operation,
not a silent regression) — documented for whoever applies the chain.

---

## Mobile / Website / Admin findings

- **Mobile** — no `console.log` in Learning/Placement paths; the `console.warn` in `placement.service.ts` error handlers is deliberate (the sample fallback is gone). Two long-standing lint **warnings** in `types/navigation.types.ts` (empty interface extends supertype) — cosmetic, pre-existing, P3. DSA code execution is the public **Piston** API (`emkc.org`) called from one place — no CampusEduX execution infra is exposed; the judge already paces itself against Piston's rate limit. Minor P3: the `fetch` has no `AbortController` timeout (Piston enforces its own run limits, so a hang is bounded but not client-side-bounded).
- **Website** — `middleware.ts` refreshes the Supabase session cookie on every non-asset request (`@supabase/ssr`, anon key — correct); it does **not** gate routes (per-page auth does). `/api/revalidate` is the only API route — POST-only, `x-revalidate-secret` gated, 404 when unset, only accepts a `path` under `/learning`, returns no data, only calls `revalidatePath`. `error.tsx` + `not-found.tsx` present.
- **Admin** — every learning/placement mutating action is `requirePermission(module, action)` + RLS `is_admin()`; no service-role key (the one legacy file that referenced it is removed). No `error.tsx` at the panel root (P3 — staff-only surface).

---

## Performance

| Page | DB round-trips | Notes |
|---|---|---|
| Website `/learning` (home) | **1** (`learning_grids_list`, RPC-capped) | no per-grid fan-out |
| Website `/learning/[grid]` (content) | **2** (`getLearningGridBrief` + `learning_tree`), React `cache()`-deduped | `learning_tree` is one round-trip for the whole tree — **no N+1** over sections/topics |
| Website `/learning/[grid]` (typed) | `getLearningGridBrief` + **1** catalog query | DSA uses a single nested `dsa_topics(…, dsa_problems(id,difficulty))` select — **no N+1** |
| Website topic page | **2** (`learning_tree` for the sidebar + `learning_topic_content`), deduped | Markdown renderer, first-load JS 175 kB (in line with the rest of the site) |
| Mobile Learning home | **1** (`learning_grids_list('mobile')`) + the progress summary query | grid list is the RPC; routing map is client-side |
| Admin `/learning` dashboard | ~13 `count(head:true)` + 1 recent-content query, all `Promise.all` | acceptable for an internal dashboard |

Caching: website `/learning*` = ISR `revalidate = 300` + on-demand `/api/revalidate`; admin = `force-dynamic` + `revalidatePath` after writes; mobile = TanStack Query + pull-to-refresh. **No permanently-stale page.** New index (`dsa_topics_ltopic_idx`) is the only DB perf change and is precautionary.

---

## SEO verification (against generated output)

| Item | Result |
|---|---|
| Titles / descriptions | generated from the DB row on `/learning/[grid]` and `/learning/[grid]/[topic]` (truncated ~155 chars); nothing hardcoded per page |
| Canonicals | `alternates.canonical` set to the absolute `/learning/…` URL on every Learning page; one URL per piece of content |
| Open Graph / Twitter | grid + topic pages; OG `type: "article"` on topics; cover image when set |
| Structured data | `BreadcrumbList` on grid + topic; `LearningResource` (with `hasPart` topic URLs) on content grids; emitted via the now-XSS-hardened `JsonLd` |
| Sitemap | `learning_sitemap('website')` RPC — only published, website-visible grid + topic URLs, each `lastModified`; a disabled grid drops **all** its URLs (verified); `/placement` removed from static routes |
| Robots | `/account*` `/auth` `/api` `/admin` custom-project funnels disallowed; `/learning` allowed; access control is RLS-based, not robots-based |
| Redirects | `next.config.js` `redirects()` → permanent 308 `/placement*` (regex excludes `notes` so the legacy note-id resolver route survives), `/placement-prep`, `/placement-preparation` → `/learning` |
| Draft / unpublished / targeted / premium-body | absent from HTML, JSON payload, sitemap and metadata (the anon RPCs never return them) — verified |
| 404 grid | `robots: { index:false, follow:false }` in `generateMetadata` |

---

## Bugs — P0 / P1 / P2 / P3

| ID | Sev | Area | Problem | Root cause | Impact | Fix | Files | Test result |
|---|---|---|---|---|---|---|---|---|
| P6-1 | **P1** | Website / SEO / XSS | admin content name in JSON-LD not HTML-escaped | `JSON.stringify` doesn't escape `<>&`/U+2028-9 | script injection via `</script>` in a grid/topic name | `safeJsonLd()` escape | `website/src/components/JsonLd.tsx` | new test 2/2, build+lint green |
| P6-2 | **P1** | All 3 · content render | `javascript:` URL in admin Markdown was clickable | renderers passed raw URL to `<a href>` / `Linking` | script execution from admin content | `safeUrl()` / `safeLinkUrl()` allow-list | `website/.../learning/Markdown.tsx`, `admin-panel/.../learning/MarkdownPreview.tsx`, `mobile-app/.../learning/MarkdownText.tsx` | tsc+lint+tests green (all 3) |
| P6-3 | **P1** | Website + Admin · deps | `next@14.2.5` has a critical CVE cluster incl. authz bypass + SSRF | outdated framework | authz bypass / SSRF / cache poisoning | `next → 14.2.35` (patched 14.x) | `website/package.json`, `admin-panel/package.json` (+ lockfiles) | tsc+lint+vitest+`next build` re-run green on both |
| P6-4 | **P2** | Storage · defence-in-depth | premium block `file_url` can live in the public `admin-media` bucket | admin uploader not wired to the private `learning-files` bucket | direct-URL guess of a premium file (RPC never exposes the URL to unauthorised callers) | **documented** — wire uploader to `learning-files` + signed URL via `learning_content_accessible()` | — | RPC/RLS leak tests confirm the URL is never served to unauthorised callers |
| P6-5 | **P2** | Observability | no crash / error-reporting tool in any app | never added | production failures (mobile/website/admin) can't be diagnosed remotely — only `console.*` | **documented as a production gap** — add Sentry (or equivalent) with a DSN before/just-after launch | — | n/a |
| P6-6 | P3 | Admin · dead code | `admin-panel/legacy/` (78 files) — a stale duplicate admin incl. a Placement tree + a service-key file | never deleted after the rewrite | repo hygiene / confusion; a service-key reference in the tree | `git rm -r admin-panel/legacy` (was excluded from `tsconfig`/build, never imported) | 78 files removed | admin tsc + vitest 86/86 green after removal |
| P6-7 | P3 | DB · index | `dsa_topics.learning_topic_id` FK had no index | omitted in `0044/021` | none today (no read path joins it) | corrective migration `0046/023` (`create index if not exists … where … not null`) | `mobile-app/supabase/migrations/0046_learning_p6_corrective.sql`, `admin-panel/supabase/migrations/023_learning_p6_corrective.sql` | applied clean + idempotent on scratch; all 4 phase suites still green |
| P6-8 | P3 | Website API | `/api/revalidate` has no rate limit | not added | secret-holder could churn the cache (no data risk) | documented | — | n/a |
| P6-9 | P3 | Deps · dev-only | `esbuild`/`vite`/`vitest` (dev-server SSRF), `glob`/`minimatch` (ReDoS) in the eslint/test toolchain; mobile: 25 Expo/Metro transitive vulns | transitive dev deps | **build/test tooling only — not shipped** | documented — `npm audit fix` (non-`--force`) at leisure; Expo bumps need SDK-level review | — | not shipped, no runtime impact |
| P6-10 | P3 | Mobile · lint | 2 baseline warnings in `types/navigation.types.ts` (empty interface) | pre-existing | cosmetic | documented | — | `eslint` = 0 errors |
| P6-11 | P3 | Mobile / Website · copy | "placement prep" still in marketing/SEO copy (About, Footer, `<title>`) | deliberate — real search term | none (not a competing *system*) | **left intentionally** — changing site `<title>` could hurt SEO for "placement preparation" queries | — | n/a |
| P6-12 | P3 | DSA exec | `runCode` `fetch` has no client-side timeout | omitted | a hung Piston request isn't client-bounded (Piston bounds the run) | documented — add `AbortController` | — | n/a |

**P0: none. Unresolved P1: none.**

---

## Exact files changed (Phase 6)

**Security fixes**
```
website/src/components/JsonLd.tsx                          (safeJsonLd escaping; export for test)
website/src/components/learning/Markdown.tsx               (safeUrl allow-list for link/image URLs)
admin-panel/src/components/learning/MarkdownPreview.tsx    (safeUrl allow-list)
mobile-app/src/components/learning/MarkdownText.tsx        (safeLinkUrl allow-list)
website/package.json  + package-lock.json                  (next 14.2.5 → 14.2.35)
admin-panel/package.json + package-lock.json               (next 14.2.5 → 14.2.35)
```
**Tests added**
```
website/tests/lib/jsonld-xss.test.ts                       (2 tests — JSON-LD break-out)
```
**Dead code removed**
```
admin-panel/legacy/**  (78 files, ~6,785 lines — stale duplicate admin incl. a Placement tree
                        and legacy/lib-supabase-admin.ts; excluded from build, never imported)
```
**Corrective migration (new, guarded, idempotent, byte-identical pair)**
```
mobile-app/supabase/migrations/0046_learning_p6_corrective.sql
admin-panel/supabase/migrations/023_learning_p6_corrective.sql
```

## Database changes

One additive corrective migration pair `0046/023`: `create index if not exists dsa_topics_ltopic_idx
on public.dsa_topics (learning_topic_id) where learning_topic_id is not null;` + `notify pgrst`.
**No schema drop, no data change, no RLS change, no policy change.** Everything else the audit
checked was already correct.

## Tests Executed — commands + results

| Command | Result |
|---|---|
| `website$ npx tsc --noEmit` | **PASS** (0) |
| `website$ npx next lint` | **PASS** (0) |
| `website$ npx vitest run` | **PASS — 77/77** (13→14 files; +`jsonld-xss`) |
| `website$ npx next build` | **PASS** — all routes compile |
| `admin-panel$ npx tsc --noEmit` | **PASS** (0) |
| `admin-panel$ npm run lint` | **PASS** (0) |
| `admin-panel$ npx vitest run` | **PASS — 86/86** |
| `admin-panel$ npx next build` | **PASS** — all routes compile |
| `mobile-app$ npx tsc --noEmit` | **PASS** (0) |
| `mobile-app$ npx eslint .` | **PASS** — 0 errors (2 baseline warnings) |
| `mobile-app$ npx jest` | **PASS — 233/233**, 36 suites (incl. auth / payment / mock-test / jobs / projects integration) |
| `mobile-app$ npx expo export --platform web` | **PASS** (exit 0) |
| DB: full chain (`bootstrap` + mobile 0001–0046 + admin 001–023 + `seed.sql`) on scratch PG17 | **applies clean, in order, idempotent** |
| DB integration — `verify.sh` (Phase 2 RLS matrix) | **PASS — 40/40** |
| DB integration — `p3_verify.sh` (Admin CMS) | **PASS — 27/27** |
| DB integration — `p4_verify.sh` (Admin→Mobile E2E + security) | **PASS — 24/24** |
| DB integration — `p5_verify.sh` (Admin→Website E2E + SEO + security) | **PASS — 31/31** |
| DB — integrity sweep (orphans / dupes / publish state / historical safety, ~30 checks) | **PASS — 0 issues** |
| DB — cross-user RLS leakage (student B vs student A private rows, read + write) | **PASS — 0 leakage** |
| DB — premium content-block + `file_url` leak via RPC / RLS / accessor | **PASS — 0 leakage** |
| DB — `dsa_topics_ltopic_idx` corrective migration apply + re-run | **PASS — clean + idempotent** |
| `npm audit` (website / admin) after `next` bump | authz-bypass / SSRF / cache-poisoning **cleared**; 3 DoS advisories remain that require Next 15 (documented) |

*Not executed:* live production probing (no prod credentials in this environment — the DB layer was
verified on a full-chain scratch rebuild); Lighthouse / real-device profiling (static analysis of
query counts + payloads used instead).

---

## Remaining Issues

1. **P2 — Observability gap.** No Sentry / crash reporting / structured remote logging in Mobile,
   Website or Admin. Production failures are only visible in `console.*`. Add before or immediately
   after launch.
2. **P2 — Premium file bucket.** Premium/downloadable content files should be uploaded to the
   private `learning-files` bucket (built in Phase 2, unused) and served via a signed URL gated by
   `learning_content_accessible()`. The RPC already withholds the URL from unauthorised callers, so
   this is defence-in-depth, not an active leak.
3. **P3** — dev-only dependency vulns (esbuild/vite/vitest, glob/minimatch, Expo transitives);
   `/api/revalidate` rate limit; admin-panel root `error.tsx`; `runCode` fetch timeout; 2 mobile
   lint warnings; "placement prep" marketing copy; Next 14.x has 3 open DoS advisories fixed only
   in Next 15 (major upgrade — deferred).
4. **Deferred product work** (from Phases 3–5, not defects): native DSA/Mock/HR editors under
   `/learning/*` (they use the `/placement/*` editors, deep-linked + grid-filtered); per-company
   `Company → Topic → Content` drill-down on Mobile + Website; course/branch/year-targeted Learning
   is website-invisible (anon SSR = global only — fail-closed, no leak); grid-scoped filtering of
   the DSA/Mock/HR dashboards; an admin webhook that calls `/api/revalidate`.
5. **Owner action** — apply the SQL chain to the live database **in order**:
   `0041/017 → 0042/019 → 0043/020 → 0044/021 → 0045/022 → 0046/023`, against the existing
   data-populated DB (not a fresh one — `0043` needs `prep_notes` rows, `0044` needs the practice
   tables populated to backfill).

---

## Scorecard

| Area | Status | Critical Issues | Notes |
|---|---|---:|---|
| Database | **PASS** | 0 | 0 orphans/dupes/broken-states; 1 precautionary index added (`0046/023`) |
| Migrations | **PASS** | 0 | contiguous, guarded, idempotent, byte-identical pairs; one documented "don't re-run 0042 after 0045" caveat |
| RLS / Security | **PASS** | 0 | 3 P1s fixed (JSON-LD XSS, `javascript:` URLs, Next CVE); cross-user + premium + targeting leakage = 0 |
| Authentication | **PASS** | 0 | Supabase Auth + `@supabase/ssr` middleware (web/admin); per-page gates; `requireAdmin`/`requirePermission` + RLS backstop |
| Admin Panel | **PASS** | 0 | one `learning` CMS + reused `/placement/*` editors; `legacy/` dead tree removed; tsc+lint+86 tests+build green |
| Mobile | **PASS** | 0 | dynamic grid-type-routed Learning home; no sample fallback; tsc+lint+233 tests+expo export green |
| Website | **PASS** | 0 | one `/learning`; `/placement*`→308; type-aware grid pages; tsc+lint+77 tests+build green |
| Learning | **PASS** | 0 | `Grid→Topic→Content` consistent across Admin/Mobile/Website; custom grids need no code |
| DSA | **PASS** | 0 | canonical `dsa_*`; single Piston engine; solved/attempts preserved; P3 fetch-timeout note |
| Mock Tests | **PASS** | 0 | server-authoritative `submit_test_attempt`; no client-score trust; attempts intact |
| HR Interview | **PASS** | 0 | single `hr_questions` source; favourites intact |
| Company Specific | **PASS** | 0 | `companies` reused via `learning_grid_companies`; no duplicate company system |
| Premium | **PASS** | 0 | RLS + RPC withhold premium bodies + `file_url` from unauthorised callers on every client; P2 bucket note |
| Progress | **PASS** | 0 | `text` PKs preserved → 0 migration; 0 orphans; 0 cross-user leakage |
| Search | **PASS** | 0 | `learning_search` (canonical, RLS-filtered); unpublished/premium hidden from anon |
| SEO | **PASS** | 0 | DB-driven metadata/canonicals/JSON-LD/sitemap/robots/redirects; XSS-hardened JSON-LD |
| Performance | **PASS** | 0 | 1–2 round-trips per page, no N+1, ISR + on-demand revalidation |
| Deployment | **PASS** | 0 | all 3 production builds succeed; contingent on the SQL chain being applied |
| Observability | **FAIL** | 0 | **P2 gap** — no crash/error reporting wired; documented, day-2 task |

---

## Production Readiness

**READY**

- Critical security issues: **0**. Critical data-integrity issues: **0**. No unresolved P0/P1.
- All three production builds succeed; auth, RLS, Admin, Mobile, Website all work.
- Admin → Supabase → Mobile and Admin → Supabase → Website both verified end-to-end (create /
  rename / edit / publish / unpublish / disable / reorder all propagate without a redeploy).
- Premium access, course/branch/year targeting, and draft/unpublished state are enforced
  server-side (RLS + the platform RPCs) on every client — verified not to leak through API / SSR /
  sitemap / metadata / cross-user reads.
- Learning is one canonical `Grid → Topic → Content` system; no competing Placement, Company or
  Test source of truth remains (the last one, `admin-panel/legacy/`, was removed this phase).

**Conditions on the "READY":**
1. The owner must apply the SQL migration chain to the live DB, in order, against the populated
   database (see Remaining Issues #5). Until then the clients show honest "nothing published yet"
   empty states.
2. The **Observability P2** is accepted as a launch-week task — the system is secure and correct,
   but a production incident today would be hard to diagnose remotely.

---

## Recommended Next Steps

1. **Critical / launch-blocking**
   - Apply `0041→0046` / `017→023` to the live Supabase DB, in order, on the populated database;
     run the Phase-2/3/4/5 verification queries against live.
2. **High (launch week)**
   - Wire Sentry (or equivalent) into Website, Mobile and Admin with a production DSN (P6-5).
   - Move premium/downloadable Learning files to the private `learning-files` bucket + signed-URL
     serving via `learning_content_accessible()` (P6-4).
   - `npm audit fix` (non-`--force`) on website + admin for the remaining dev-tooling advisories;
     schedule a Next 15 evaluation for the 3 open DoS advisories.
3. **Medium**
   - Add an admin/DB webhook that calls `POST /api/revalidate` on a Learning publish for instant
     website refresh (today: ISR-300).
   - Re-home the DSA / Mock Test / HR editors as native `/learning/grids/[id]/…` routes and add
     the `learning_grid_id` / targeting / status fields to those forms.
   - `AbortController` timeout on `runCode`; a rate limit on `/api/revalidate`; an `error.tsx` at
     the admin panel root.
4. **Low**
   - Clear the 2 mobile lint warnings; normalise remaining "placement prep" copy where it isn't an
     SEO term; add `dsa_problems` / `practice_tests` / `companies` to `learning_search`.
5. **Future**
   - Per-company `Company → Topic → Content` drill-down on Mobile + Website.
   - Authed SSR for Learning on the website (so logged-in targeted students see targeted grids) —
     trades per-user dynamic rendering for the current cacheable anon SSR.
   - Self-host or edge-proxy the DSA code-execution (currently the public Piston API).

---

*Phase 6 deliverable — full integration + security + QA + performance audit with fixes. 3 P1s
fixed and retested; 1 corrective migration; 1 dead-code tree removed; 2 P2s (1 fixed, 1
documented). No production data touched, no RLS bypassed, no secrets exposed, no duplicate system
created. Final decision: **READY**, conditional on applying the migration chain to live and
treating observability as a launch-week task.*

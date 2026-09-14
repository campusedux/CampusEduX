# Generative AI tutorial — content import

Imports `Generative_AI_Full_Syllabus_Detailed_Notes.md` into the existing
**Learning** system as a DB seed. **No application code changed** — this is one
guarded, idempotent migration pair that reuses the `learning_*` tables plus
`practice_tests` / `test_questions` (topic Mock Tests) and `dsa_problems`
(topic Coding Problems) from migration 0048/025.

| File | |
|---|---|
| `mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql` | canonical |
| `admin-panel/supabase/migrations/041_seed_generative_ai_tutorial_content.sql` | byte-identical twin (only lines 1 & 3 — the self/twin path comments — differ) |

Apply **either one** once (Supabase SQL Editor or `supabase db push`), after the
Learning chain (0042/019 → 0045/022) **and** the topic-practice pair (0048/025).
Re-running is safe — see *Idempotency* below. The other file is then a guarded
no-op.

## Final structure

```
Learning
  └── Generative AI                 (grid, slug 'generative-ai', grid_type 'content', sort_order 70, icon 🧠)
        ├── Unit 1: Introduction to Generative AI          12 topics
        ├── Unit 2: Machine Learning & Deep Learning Basics 12 topics
        ├── Unit 3: Transformers & Attention               11 topics
        ├── Unit 4: Large Language Models (LLMs)           16 topics
        ├── Unit 5: Prompt Engineering                     14 topics
        ├── Unit 6: Generative AI Models                   15 topics
        ├── Unit 7: Generative AI for Images               11 topics
        ├── Unit 8: Generative AI for Audio & Video         8 topics
        ├── Unit 9: Embeddings & Vector Databases          13 topics
        ├── Unit 10: RAG – Retrieval Augmented Generation  16 topics
        ├── Unit 11: Fine-Tuning & Model Adaptation        11 topics
        ├── Unit 12: AI Agents                             14 topics
        ├── Unit 13: Generative AI Development             12 topics
        ├── Unit 14: Generative AI Applications            11 topics
        ├── Unit 15: Security, Ethics & Responsible AI     13 topics
        ├── Unit 16: Deployment & MLOps                    17 topics
        └── Unit 17: Course Summary & Project Roadmap       1 topic   (notes only)
```

Each unit topic renders as: **Detailed Notes → 10-question Mock Test → 4 Coding
Problems (coding topics) / 4 Practice Problems (theory topics) → Next topic** —
using the *existing* Learning topic page, `<Markdown>` renderer, `<TopicPractice>`
block, mock-test engine (`MockTestRunner` + `submit_test_attempt`), coding-problem
route (`/coding-problems/[slug]`), `DocsShell` sidebar navigation, global search
(`learning_search`) and SEO/`generateMetadata`. **Zero new components, routes,
tables, RLS or RPCs.**

## What was imported — nothing rewritten, nothing invented

| Thing | Count | Notes |
|---|---:|---|
| Grid | 1 | `generative-ai` / "Generative AI" |
| Sections | **17** | Unit 1 … Unit 16 verbatim from the `# Unit N:` headings, plus a synthetic "Unit 17: Course Summary & Project Roadmap" |
| Topics | **207** | 206 unit topics (source order, one per `## N.M Title — Detailed Notes`) + 1 summary topic |
| Notes blocks | **207** | each unit topic's *Detailed Notes* section copied **verbatim** (only the `## N.M Title — Detailed Notes` line and the boundary `---` rules removed; the title is kept as `learning_topics.title`). For the 122 theory topics the 4 *Practice Problems* are appended under a `## Practice Problems` heading (they are discussion prompts, not runnable code — kept in the notes, not turned into coding problems). |
| Topic Mock Tests | **206** | one per unit topic — 10 questions, 10 minutes, `category = 'aptitude'` (DB CHECK enum; hidden on topic-attached tests). The Unit 17 summary topic has notes only. |
| MCQ questions | **2060** | every MCQ verbatim: `question_text`, the four `A. …/B. …/C. …/D. …` options (prefix kept), `correct_index` from the source `**Answer:** X.` letter. The source gives no per-question rationale, so `explanation` is left `''`. |
| Topic Coding Problems | **336** | the 84 "coding" topics × 4 problems — full prompt copied **verbatim** into `description`. |

The source ships **no** starter code, judge test-cases or reference solutions for
its coding problems, so none were fabricated — `examples` / `constraints` /
`starter_code` / `test_cases` / `editorial` / `solution_code` are left empty and
`supported_languages = {python}` (every prompt is a Python task). On the website
the **Run** button works in the sandbox; **Run Tests** has no cases by design
— identical behaviour to the AI/ML Notes import.

**Unit 17 (summary topic).** The 6 course-wide appendix chapters that sit between
topic 16.17's notes and its assessment in the source — *Connecting the Full
Generative AI Stack*, *RAG vs Fine-Tuning vs Prompting vs Agents*, *Evaluation of
Generative AI Systems*, *Production Security Checklist*, *Generative AI Project
Roadmap*, *Final Master Checklist* — are real source content with no per-topic
home, so they are imported as one **notes-only** topic (no test, no coding
problems), following the Python-seed topic-30 precedent. Nothing about them was
edited or invented.

**Slug de-duplication.** Topic slugs are unique per grid (`learning_topics_grid_slug_key`).
One source collision — *Text-to-Video* (6.13) and *Text-to-video* (8.5) both
slugify to `text-to-video` — is resolved deterministically by suffixing the
second with its unit number: `text-to-video` (6.13) and `text-to-video-u8` (8.5).

## Verification performed

**1. Structural parse.** The generator asserted 16 `# Unit N:` headings, 206
`## N.M … — Detailed Notes` headers, 206 `— 10 MCQs` blocks, 206 `— 4 (Coding|Practice)
Problems` blocks (84 coding + 122 practice), exactly 10 MCQs with 4 options and a
valid `**Answer:**` letter per block, exactly 4 problems per block. Every topic
body is bounded at the first `## Topic Assessment` **or** `# ` line, so interleaved
`# Unit N` / appendix headings never leak into a body.

**2. Dry-run on PostgreSQL 17** (throwaway TCP cluster, stub schema mirroring the
real column types / CHECK constraints / partial-unique indexes / guarded
functions). Applied 0069 → `17 sections, 207 topics, 207 contents, 206 tests,
2060 questions, 336 problems`. Applied it a **2nd** time (idempotency) and then
the admin twin **041** (cross-apply) → identical counts, no duplicates, no
errors. Spot-checked: `correct_index` maps to the right option letter, every MCQ
has 4 options, all 336 coding-problem slugs are globally unique, no topic body
leaks a `## Topic Assessment` section, all 122 theory bodies carry the
`## Practice Problems` heading, coding topics carry their 4 problems only in
`dsa_problems` (not in the body), the en-dash in "Unit 10: RAG – …" is preserved.

**3. Twin byte-exactness.** `diff` confirms `0069_…` and `041_…` are identical
from line 4 onward; only line 1 (self path) and line 3 (twin path) differ.

**4. App gates — untouched.** No `.ts` / `.tsx` / component / route / RPC / RLS
was added or changed, so website / admin / mobile `tsc` / `lint` / test results
are exactly the pre-existing baseline.

## Idempotency

Re-running never duplicates and never overrides an admin's later edits:

* **Grid** — `on conflict (lower(slug)) do nothing` (an existing `generative-ai`
  grid is left exactly as configured; created only if absent).
* **Sections** — `on conflict (grid_id, lower(slug)) do update` refreshes only
  `name` / `description` / `sort_order`.
* **Topics** — keyed on `(source_kind, source_ref) = ('generative_ai_tutorial',
  'unit-<N>/<slug>')`. Re-run refreshes canonical `title` / `short_description` /
  `section_id` / `sort_order`, but **leaves `status` / `show_on_website` /
  `show_on_mobile` / `is_premium` untouched**. First insert = published + visible.
* **Content** — partial unique index `learning_contents_genai_seed_key`; re-run
  refreshes the body only.
* **Mock tests / questions / coding problems** — deterministic text ids
  (`mt-genai-…` / `tq-genai-…-N` / `cp-genai-…-N`), `on conflict (id) do nothing`;
  coding problems also skip any global slug already taken by another row.
* A final `do $val$` block **raises** (never silently passes) if any count is short.

## Owner action

1. Confirm the Learning chain (0042/019 … 0045/022) **and** 0048/025 are applied
   to the live Supabase project — the migration's guard raises a clear message
   if any prerequisite is missing.
2. Run **`mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql`**
   *or* its admin twin `041_…` once.
3. In Admin ▸ Learning ▸ **Generative AI**, confirm the grid is Published and
   shown on web + mobile (it is by default). Everything after that is managed
   from the admin CMS — no code change, no redeploy. Website ISR is
   `revalidate = 300` (or `POST /api/revalidate`).

## Known display notes (not defects, not content loss)

* The source *Detailed Notes* text is heavily templated (most topics share the
  same `###` sub-section skeleton with the topic name substituted in). It is
  imported **exactly as written** — improving the source prose is out of scope
  for a content import.
* MCQ `explanation` is empty because the source only repeats the answer text
  rather than explaining it. The mock-test result page simply shows no
  explanation for these questions — no code change needed.

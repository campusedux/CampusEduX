# AI/ML Notes — content import

Imports `AI_ML_Complete_All_10_Modules.md` into the existing **Learning** system
as a DB seed. **No application code changed** — this is one guarded, idempotent
migration pair that reuses the `learning_*` tables plus `practice_tests` /
`test_questions` (topic Mock Tests) and `dsa_problems` (topic Coding Problems)
from migration 0048/025.

| File | |
|---|---|
| `mobile-app/supabase/migrations/0068_seed_ai_ml_notes_content.sql` | canonical |
| `admin-panel/supabase/migrations/040_seed_ai_ml_notes_content.sql` | byte-identical twin |

Apply **either one** once (Supabase SQL Editor or `supabase db push`), after the
Learning chain (0042/019 → 0045/022) **and** the topic-practice pair (0048/025).
Re-running is safe — see *Idempotency* below.

## Final structure (exactly as requested)

```
Learning
  └── AI/ML Notes            (grid, grid_type='content', flat)
        └── All Topics       (one generic section — no module cards, no module picker)
              ├── Python Basics                    Notes · Test (10 MCQ) · Problems (4)
              ├── Variables, Data Types, Loops     Notes · Test (10 MCQ) · Problems (4)
              ├── … 75 more …
              └── MLOps Basics                     Notes · Test (10 MCQ)
```

The 10 source "Modules" are used **only** to order the topics. Their heading
blocks + numbered topic-lists are navigation scaffolding and are **not** imported
(your choice: *"Drop all module-level text"* — this also drops the three italic
module notes in Modules 8/9/10). No module information appears anywhere in the UI.

## What was imported — nothing rewritten, nothing invented

| Thing | Count | Notes |
|---|---:|---|
| Grid | 1 | `ai-ml-notes` / "AI/ML Notes" |
| Section | 1 | `all-topics` / "All Topics" |
| Topics | **77** | 69 lesson topics + 8 Module‑9 project write‑ups, in source order |
| Notes blocks | **77** | each topic body copied **verbatim** (only the `## Topic N — Title` line and the boundary `---` rules removed; the title is kept as the topic title) |
| Topic Mock Tests | **69** | one per topic that has an MCQ set — 10 questions, 10 minutes. The 8 Module‑9 projects have no MCQs in the source, so they get Notes only. |
| MCQ questions | **690** | every MCQ verbatim: question text (incl. the 3 with code blocks), the four `A) …/B) …/C) …/D) …` options (prefixes kept), `correct_index` from the source **Correct Answer:** letter, and the explanation |
| Topic Coding Problems | **196** | every "Coding Practice Problem" — full text (Problem Description, Input, Output, Constraints, Example Input/Output, Concepts Covered) copied **verbatim** into `description` |

The source ships **no** starter code, judge test-cases or solutions for its
coding problems, so none were fabricated — `examples` / `constraints` /
`starter_code` / `test_cases` / `solution_code` are left empty and
`supported_languages = {python}` (every problem says *"Write a Python program"*).
On the website the **Run** button works in the sandbox; **Run Tests** has no
cases by design.

Topics with **no** coding problems (28): all 10 of Module 2, all 8 Module‑9
projects, all 10 of Module 10 — matching the source exactly.

## Verification performed

**1. Byte-exactness (`verify.py`).** Every stored string — each notes body, each
MCQ question, all four options, each explanation, each coding-problem body — was
asserted to be a **verbatim contiguous slice of the source Markdown** (so nothing
was reworded, reordered, summarised or injected). Every `### MCQ n` and
`### Problem n:` block and every `## Topic/## Project` header in the source is
accounted for; MCQ order and every `Correct Answer:` letter cross-checked
1‑for‑1 against an independent re-parse. All test/question/problem ids and all
global coding-problem slugs are unique. The two twin files are byte-identical
below the 4-line header.

**2. Source coverage.** 98.7 % of source characters are imported or are consumed
structural headers. The remaining ~1.3 % is **exactly** the 100 lines of module
scaffolding you chose to drop: 10 `# Module` headings, 10 `**Complete Notes…**`
lines, 77 numbered topic-list items, 3 italic module notes. Nothing else.

**3. Dry-run on PostgreSQL 17** (throwaway DB, stub schema mirroring the real
column types / constraints / triggers). Applied the migration → `1 section,
77 topics, 77 contents, 69 tests, 690 questions, 196 problems`. Applied a 2nd
time (idempotency) and then the admin twin (cross-apply) → identical counts, no
duplicates, no errors. Spot-checked: `correct_index` maps to the right option
letter, notes bodies have no leading/trailing `---` and no MCQ/problem leakage,
Module‑9 projects have 0 tests, the one coding-section preamble (Jupyter
Notebook) is preserved.

**4. App gates — unchanged, still green** (no source touched):
website `tsc` / `lint` / 290 tests · admin `tsc` / `lint` / 121 tests ·
mobile `tsc` / `lint` / 288 tests.

## Idempotency

Re-running never duplicates and never overrides an admin's later edits:

* Grid — `on conflict (lower(slug)) do nothing` (an existing `ai-ml-notes` grid
  is left exactly as configured; created only if absent).
* Topics — keyed on `(source_kind,source_ref) = ('ai_ml_notes','m<module>/<slug>')`.
  Re-run refreshes canonical `title` / `short_description` / `section_id` /
  `sort_order` / body, but **leaves `status` / `show_on_website` /
  `show_on_mobile` / `is_premium` untouched**. First insert = published + visible.
* Content — partial unique index `learning_contents_aiml_seed_key`.
* Mock tests / questions / coding problems — deterministic text ids
  (`mt-aiml-…` / `tq-aiml-…-N` / `cp-aiml-…-N`), `on conflict (id) do nothing`;
  coding problems also skip any global slug already taken by another row.
* A final validation block **raises** (never silently passes) if the counts are
  short.

## Owner action

1. Confirm the Learning chain (0042/019 … 0045/022) **and** 0048/025 are applied
   to the live Supabase project — the migration's guard raises a clear message
   if any prerequisite is missing.
2. Run **`mobile-app/supabase/migrations/0068_seed_ai_ml_notes_content.sql`**
   *or* its admin twin `040_…` once.
3. In Admin ▸ Learning ▸ **AI/ML Notes**, confirm the grid is Published and shown
   on web + mobile (it is by default). Everything after that is managed from the
   admin CMS — no code change, no redeploy. Website ISR is `revalidate = 300`
   (or `POST /api/revalidate`).

## Known display notes (not defects, not content loss)

* The flat grid still renders one section header ("All Topics") and a "1 section"
  counter — the Learning schema requires every topic to have a section and the
  website/mobile have no sectionless render path. It is not a module and needs no
  selection; all 77 topics show at once.
* 3 of 690 MCQ questions embed a fenced Python snippet. It is stored verbatim;
  the website quiz renders `question_text` as plain text, so those three collapse
  onto one line during an attempt (all characters preserved). A one-class
  `whitespace-pre-wrap` tweak on the quiz + result question `<p>` would fix the
  rendering for all multi-line questions — offered, not applied (no app code was
  in scope).

# CampusEduX — Content Provenance Audit

Date: 2026-09-18

## Purpose

Document the known source/provenance status of educational content before AdSense submission. This is a factual trace of what the repository itself says about where each content cluster came from — seed migration headers, in-repo audit files, and record counts — not a legal opinion on whether any of it is safe to monetize. Where the repository is silent, that silence is reported as-is rather than resolved by assumption.

Method: read the seed-migration SQL comments verbatim (they are the only place authorship/source claims are recorded in this repo), cross-checked against `git log --all` for the named source markdown files, and against the two prior audit-stage documents in this repo (`ADSENSE_READINESS_AUDIT.md`, `CONTENT_SEO_AUDIT_STAGE2.md`). No content, schema, or seed data was modified to produce this report.

**Correction to the prior audit stages**: Stage 1/2 described the Java Interview Questions bank as "original" content. Migration `0108_interview_questions_source_reconciliation.sql` (already committed, applied after the batches Stage 1/2 sampled) shows this was found to be inaccurate and was reconciled — the published Java Interview Questions bank is now verbatim-sourced from a named external guide, the same category of provenance question as Python Interview Questions. See §6 below.

---

## 1. Java Tutorial

**Source**: `core-java-full-course.md`, named in the seed migration's own header comment. This file does not exist anywhere in the current repository tree, and `git log --all --diff-filter=A` finds no commit that ever added a file by this name — it was a local file the seed content was prepared from, off-repo, and never committed alongside the SQL that imports it.

**Seed migrations**: `mobile-app/supabase/migrations/0047_seed_java_tutorial_content.sql` (canonical twin: `admin-panel/supabase/migrations/024_seed_java_tutorial_content.sql`, byte-identical).

**Destination**: `learning_grids` (`java-tutorial`) → `learning_sections` (14 modules) → `learning_topics` → `learning_contents` (one markdown block per topic).

**Approximate records**: 150 topics across 14 sections.

**Ownership/license evidence**: The migration header states this "imports the Core Java course" from the named file and describes an idempotent, structure-preserving import — it does not assert the site owner authored the underlying course prose, nor does it name a license or grant of permission from a third party. No author name, license identifier, or permission statement appears anywhere in the migration.

**Status**: **UNVERIFIED** — a source file is named and its import mechanics are fully documented, but nothing in the repository establishes who originally wrote `core-java-full-course.md` or under what terms, if any, CampusEduX may republish it at scale.

---

## 2. Python Tutorial

**Source**: an unnamed "Python course" — the migration headers describe importing "chapter files" ("each chapter already comes with its own complete 10-question MCQ set and 4 coding problems") but, unlike the Java and AI/ML imports, no single source filename is given in any of the six migration headers. No such file exists in the current repo tree or in `git log --all` history.

**Seed migrations**: `mobile-app/supabase/migrations/0050`–`0055` (`_seed_python_tutorial_content.sql`, `_seed_python_tutorial_functions_oop.sql`, `_seed_python_tutorial_advanced.sql`, `_seed_python_tutorial_real_world.sql`, `_seed_python_tutorial_automation_ai.sql`, `_seed_python_tutorial_advanced_career.sql`) — canonical twins `admin-panel/supabase/migrations/027`–`032`.

**Destination**: `learning_grids` (`python-tutorial`) → `learning_sections` (6 batches) → `learning_topics` (30 chapters) → `learning_contents`, plus linked `practice_tests`/`test_questions` (one 10-question mock test per chapter) and `dsa_problems` (0–4 coding problems per chapter).

**Approximate records**: 30 chapters, 30 mock tests (~300 MCQs), up to ~100 linked coding problems.

**Ownership/license evidence**: None. No source filename, author, or license is named anywhere in these six migrations.

**Status**: **UNVERIFIED** — even less documented than the Java Tutorial, since not even a source filename is recorded in-repo.

---

## 3. AI/ML Notes

**Source**: `AI_ML_Complete_All_10_Modules.md`, named explicitly in the migration header. Does not exist in the current repo tree; `git log --all` finds no commit ever adding it.

**Seed migrations**: `mobile-app/supabase/migrations/0068_seed_ai_ml_notes_content.sql` (canonical twin: `admin-panel/supabase/migrations/040_seed_ai_ml_notes_content.sql`).

**Destination**: `learning_grids` (`ai-ml-notes`, one flat "All Topics" section) → `learning_topics` (77) → `learning_contents`, plus 69 linked `practice_tests` (Module-9 project write-ups have none).

**Approximate records**: 77 topics (69 lesson topics + 8 Module-9 project notes), 69 mock tests.

**Ownership/license evidence**: The migration header is explicit and self-incriminating in the useful sense — it states each topic body is "copied VERBATIM from the source" markdown, with only heading/boundary lines removed, and explicitly says "nothing invented — the Markdown is the source of truth." This confirms verbatim transcription as a documented fact, but does not say who wrote the original file or under what permission it is being republished.

**Status**: **UNVERIFIED** — provenance of the transcription itself is the clearest of any cluster (explicitly verbatim, explicitly documented), but authorship/license of the original file is not recorded anywhere in the repo.

---

## 4. DBMS/SQL

**Source**: an unnamed "source notes file," referenced only in the first migration's header. That migration is explicit that this file was **not** used as transcription source: *"Content is ORIGINAL — authored from real DBMS/SQL subject knowledge, NOT extracted from the source notes file, which was found to be templated boilerplate (521/521 topics shared byte-identical filler text) with no genuine per-topic content to import. The source file's chapter/topic TITLES and STRUCTURE are what's preserved."* This disclosure is repeated verbatim ("same content policy as batch 1") through migrations covering chapters 1–20; the remaining batches (chapters 15–23) don't repeat the sentence but continue the same numbering/structure with no contradicting language found.

**Seed migrations**: `mobile-app/supabase/migrations/0091`–`0099`, `0101` (schema + 8 content batches by chapter range); canonical twins `admin-panel/supabase/migrations/063`–`071`, `073`.

**Destination**: `learning_grids` (`dbms-sql-tutorial`) → `learning_sections` (43 chapter slots, 23 populated) → `learning_topics` → `learning_contents`, plus per-topic MCQs (`practice_tests`/`test_questions`) and SQL-judged `dsa_problems`.

**Approximate records**: 23 of 43 planned chapters seeded; several hundred topics (e.g. batch 8 alone reports reaching "294 topics" cumulative after chapters 1–23), thousands of MCQs, several dozen SQL coding problems.

**Ownership/license evidence**: The only cluster where the migration itself makes an explicit originality claim (authored from subject knowledge, not extracted) rather than describing a verbatim import. This is a documentation claim made in the migration's own commit message/comment, not an independently verifiable authorship record (no author name, no timestamp of authoring, no external corroboration) — but it is a materially different, more favorable claim than the other clusters' silence.

**Status**: **UNVERIFIED**, with a caveat that distinguishes it from the rest: the repository's own record explicitly disclaims verbatim extraction and asserts original authorship from subject knowledge. This is not proof of ownership in the same sense as a signed work-for-hire or an explicit "written by CampusEduX" byline, but it is a stronger, more specific claim than any other cluster in this audit and should not be conflated with the verbatim-import clusters above.

---

## 5. Generative AI

**Source**: `Generative_AI_Full_Syllabus_Detailed_Notes.md`, named explicitly in the migration header. Does not exist in the current repo tree; `git log --all` finds no commit ever adding it.

**Seed migrations**: `mobile-app/supabase/migrations/0069_seed_generative_ai_tutorial_content.sql` (canonical twin: `admin-panel/supabase/migrations/041_seed_generative_ai_tutorial_content.sql`).

**Destination**: `learning_grids` (`generative-ai`) → `learning_sections` (17 units) → `learning_topics` (207) → `learning_contents`, plus 206 `practice_tests` and 336 `dsa_problems`.

**Approximate records**: 207 topics, 206 mock tests (~2,060 MCQs), 336 coding problems.

**Ownership/license evidence**: Same pattern as AI/ML Notes — the migration header states topic bodies are copied "VERBATIM" from the named source file, "nothing invented." No author or license is named.

**Status**: **UNVERIFIED** on provenance grounds, same as Java/AI-ML/Python — a named source file with documented verbatim transcription but no recorded authorship or license. **Separately** (out of scope for this stage per the brief, noted here only for completeness since it's the same underlying source file): this cluster's *content quality*, not its provenance, was already flagged FAIL by Stage 1/2 of this engagement (verbatim-duplicated boilerplate paragraphs across unrelated topics) — that is a distinct, content-quality finding this stage does not re-litigate or fix, per the explicit instruction not to touch GenAI content in Stage 4A.

---

## 6. Java Interview Questions

**Source**: named explicitly, only in a later reconciliation migration — the **"Java Interview Master Guide"** (240 numbered entries, 121 unique questions; entries 122–240 are the guide's own restated "variations" of a 30-question subset). This file does not exist in the current repo tree and no commit ever added it.

**Seed migrations**: `mobile-app/supabase/migrations/0103_interview_questions.sql` (schema) → `0104`–`0107_seed_interview_java_batch{1-4}.sql` (initial content, each batch's own header describes the content as *"an original, technically accurate set of Question/Answer/Example/Important Point rows"*, no source named) → **`0108_interview_questions_source_reconciliation.sql`**, which supersedes that description: an audit found the batch-1–4 content had "drifted" from "its real source of truth — the original 240-entry 'Java Interview Master Guide'" (only 81 of 121 unique source questions were represented correctly; 137 of 216 rows were non-source original content; some rows silently merged two source questions). `0108` rewrites the public bank to be exactly the 121 unique source questions, verbatim, and archives (not deletes) the 137 non-source rows plus 2 retired duplicates. Canonical twins: `admin-panel/supabase/migrations/075`–`080`.

**Destination**: `interview_categories`/`interview_topics`/`interview_questions`, category `java`.

**Approximate records**: **121 published questions** across 24 published topics (19 original + 5 added during reconciliation), plus 139 archived (non-public) rows retained for reversibility. A full source-question → DB-row trace exists at repo root: `JAVA_INTERVIEW_RECONCILIATION_AUDIT.md`.

**Ownership/license evidence**: None for the underlying "Java Interview Master Guide" itself — no author, publisher, or license is named anywhere in the repo. The migration explicitly documents that the *public-facing* content is verbatim transcription of this named external work, not original authoring (superseding the batch-1–4 migrations' own "original" description, which the reconciliation migration itself treats as having been an inaccurate characterization at the time).

**Status**: **ORIGINALITY CONCERN** — repository evidence (the reconciliation migration's own text) directly states the published content is a verbatim transcription of a named external guide, with no license or permission documented. This corrects Stage 1/2's PASS/"original content" characterization, which predates or did not account for migration `0108`.

---

## 7. Python Interview Questions

**Source**: named explicitly and consistently across all four seed migrations — the **"Python Interview Master Guide — 240 Questions"** (240 numbered entries, all unique — the migration comments specifically note this guide has no duplicate/merged entries, "unlike the Java source guide"). Does not exist in the current repo tree; no commit ever added it.

**Seed migrations**: `mobile-app/supabase/migrations/0109`–`0112_seed_interview_python_batch{1-4}.sql`; canonical twins `admin-panel/supabase/migrations/081`–`084`.

**Destination**: `interview_categories`/`interview_topics`/`interview_questions`, category `python`.

**Approximate records**: 240 published questions across 22 topics.

**Ownership/license evidence**: Each migration states explicitly: *"Every question/answer/example/important-point below is the source text verbatim, with only whitespace re-flowing... and markdown-escaping artifacts undone... No question content was reworded, and no question was invented."* No author, publisher, or license for the guide itself is named or documented anywhere in the repo.

**Status**: **ORIGINALITY CONCERN** — the clearest case in this audit: the repository's own migration comments state, in the seed data's own words, that this is a verbatim transcription of a named external guide, with no license or permission on record. This matches Stage 1/2's existing flag; this stage adds the parallel Java finding (§6) to the same bucket.

---

## 8. Required Owner Confirmation

Everything below cannot be resolved from repository evidence alone — only the site owner can supply it:

1. **Java Tutorial** (`core-java-full-course.md`) — who wrote this file, and under what license (if any) is CampusEduX republishing it? Was it self-authored, adapted with permission, or used under a license (e.g. open-license course material) that permits redistribution at this scale?
2. **Python Tutorial** — the same question, plus: what file/source was actually used? No filename is even recorded in the repo for this cluster.
3. **AI/ML Notes** (`AI_ML_Complete_All_10_Modules.md`) — same authorship/license question; transcription is confirmed verbatim by the repo's own migration comment.
4. **DBMS/SQL** — lower urgency than the others (the repo's own record disclaims verbatim extraction and asserts original authoring from subject knowledge), but confirm who performed that original authoring and whether any of it drew on a specific external reference beyond the disclaimed "source notes file" structure/titles.
5. **Generative AI** (`Generative_AI_Full_Syllabus_Detailed_Notes.md`) — same authorship/license question as Java/AI-ML; content-quality remediation (separate issue) is explicitly out of scope for this stage.
6. **Java Interview Questions** — what is the actual title, author, publisher, and license (if any) of the "Java Interview Master Guide"? Was permission obtained to transcribe and republish 121 of its questions? This is now the same open question as item 7.
7. **Python Interview Questions** — what is the actual title, author, publisher, and license (if any) of the "Python Interview Master Guide — 240 Questions"? Was permission obtained to transcribe and republish all 240 questions verbatim?

No source URLs, authors, licenses, or permissions have been fabricated anywhere in this report. Where the repository is silent, that silence is reported as UNVERIFIED or ORIGINALITY CONCERN rather than resolved either way.

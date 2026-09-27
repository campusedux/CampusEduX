# CampusEduX — Duplicate & Thin Content SEO Report

_Agent 3 of the 5-agent SEO engagement · generated 2026-09-27 · **report only** — no content, DB row, migration, config or app code was changed. The only repo file created is this report._

## Executive summary

**Population measured (live production, crawled 2026-09-27):** 1791 content pages — 853 lessons, 742 topic coding problems, 150 practice problems, 46 interview-question pages. Every page returned HTTP 200 with a self-referencing canonical.

**Sitemap composition:** the live `sitemap.xml` lists **1114 URLs**; 647 lessons, 210 coding problems, 150 practice problems, 46 interview pages, and 61 hub/static pages. The 738 noindexed pages (206 templated GenAI lessons + 532 thin AI coding problems) are correctly **absent** from the sitemap — the existing `contentQuality.ts` filters work as intended.

**Why pages are "Crawled/Discovered – currently not indexed":**

1. **Most of what the sitemap asks Google to index is thin.** Of the 1053 indexable content URLs, **799 (75%) have under 600 words of main content even counting code**, and **549 (52%) have under 300**. That is **71% of every URL in the sitemap**. The thin mass is concentrated in exactly five places: Java Tutorial (150/150 lessons < 600; median 164 prose / 214 incl. code), DBMS & SQL (261/294 < 600 incl. code), all 210 indexable topic coding problems (median 77–207 prose words by course), all 150 practice problems (median 98 prose words), and 28/46 interview pages.
2. **Pages that are noindexed do not cause this status.** The 206 templated GenAI lessons and 532 thin AI coding problems carry `noindex, follow` and are out of the sitemap; in Search Console they belong under "Excluded by 'noindex' tag", not "Crawled – currently not indexed". They still consume crawl budget because the GenAI course page/sidebar links all 206 GenAI lessons and every AI/ML Notes and GenAI lesson links its 4 thin coding problems (≈ 740 URLs Googlebot keeps fetching and discarding).
3. **Template duplication is extreme where it exists.** The Generative AI course is one near-duplicate cluster: **98.9% of all GenAI lesson pairs have ≥ 0.6 shingled-Jaccard body similarity** and a median of 86% of each lesson's words sit in sentences repeated verbatim on ≥ 20 other lessons. All 336 GenAI coding problems are one-sentence prompts from only **32 title-substituted templates**. This is already contained by `noindex`; it becomes a sitewide quality signal only if someone lifts the noindex before rewriting.
4. **True duplicate URLs are few.** Only 1 byte-identical lesson pair (`text-to-video` / `text-to-video-u8`) and 7 more same-intent GenAI lesson pairs were found — all already noindex. Among **indexable** pages there are no body duplicates (no indexable lesson pair reaches 0.6 body Jaccard — the highest among slug/title-flagged indexable lesson pairs is 0.03; only two practice-problem pairs reach 0.62–0.65, from shared I/O boilerplate); the issues there are **duplicate `<title>`s** (6 DBMS groups, 13 URLs) and **thin same-intent siblings** (`garbage-collection`/`garbage-collector`, `attribute`/`attributes`).

**Prioritized actions**

| # | Action | Pages affected | Effort | Risk |
|---|---|---|---|---|
| 1 | Expand or consolidate the Java Tutorial lessons (all 150 are < 600 words; median 164 prose). Highest-impact single fix: it is the thinnest course on the site and covers high-volume beginner queries. Until rewritten, consider noindexing the < 200-word ones rather than asking Google to index them. | 150 indexable | High (content) | Low |
| 2 | Enrich the 210 indexable topic coding problems and 150 practice problems (add a written approach/explanation, complexity analysis, a second worked example) — or noindex those under ~150 words and keep them as app features. Pages consisting of a one-paragraph statement + an editor are the classic "crawled – not indexed" pattern. | 360 indexable | Medium–High | Low |
| 3 | Fix the 6 duplicate DBMS `<title>`/H1 groups (retitle: "Union (Relational Algebra)" vs "UNION in SQL", etc.) and retitle `attribute`/`attributes`. Title-only data change, no redirects needed. | 15 indexable | Low | Low |
| 4 | Expand DBMS lessons (median 392 prose words; 282/294 < 600 prose) — prioritize the 42 under 300 words incl. code (59 under 300 prose). | 261–282 indexable | High | Low |
| 5 | Approve and apply the Tier-1 redirects (section d) together with archiving the duplicate topic rows; Tier-2 when the GenAI rewrite happens. | 2 lessons + 4 problems (Tier 1) | Low | Low (all already noindex) |
| 6 | Reduce crawl waste to noindexed pages: the GenAI curriculum links every templated lesson and each AI/ML Notes / GenAI lesson links its 4 thin problems. Keep `noindex, follow`, but consider not linking the 532 thin problems from indexable AI/ML lessons until they're rewritten. | 738 noindex | Low | Low |
| 7 | GenAI rewrite: merge the same-intent topics listed in section (a)-A before rewriting, then rewrite the survivors; do **not** lift the noindex before the rewrite. | 207 + 336 | High | — |

## Method, counting rule and data access

- **Source of truth:** the live site (`https://www.campusedux.com`), crawled read-only with a stdlib Python fetcher at concurrency 4. Population = every lesson / coding-problem / practice-problem / interview URL in the live `sitemap.xml` **plus** every lesson URL linked from the 6 course landing pages and every `/coding-problems/*` URL linked from any lesson page (this is how the 206 noindexed GenAI lessons and 532 noindexed coding problems were found — they are not in the sitemap). 1,797 pages fetched, all HTTP 200, 0 redirects, 0 non-self canonicals.
- **Supabase REST was not used.** Reading `website/.env.local` is blocked by the project's safety hook, and the Supabase MCP connector is not authorized in this session, so no database query was made. Consequence: content is measured exactly as Googlebot receives it in the server HTML (which is arguably the right population for an indexing report), but anything rendered only client-side (none observed) or hidden behind premium (no locked pages were found in the crawl) is not counted.
- **Main-content extraction:** lessons = the `<article id="lesson-article">` element **minus** its `<header>` (title, lede, reading time, badges). Problems and interview pages = `<main>` text **up to** the first of "Related Problems" / "Previous Topic" / "Next Problem" / "Continue Your Preparation" (i.e., the statement, examples, constraints, editorial/Q&A — excluding related-links rails and the code-editor workspace). In both cases `<nav>`, `<button>`, `<svg>`, `<script>`, `<style>` text is dropped.
- **Word counting rule:** a word is a token matching `[A-Za-z0-9][A-Za-z0-9'’+#.\-_]*`. **prose** = words outside `<pre>` blocks; **incl. code** = prose + words inside `<pre>` (code samples, SQL, sample I/O). Both are reported. For reference, Java `garbage-collection` = 186 prose / 249 incl. code (the prior audit's "Java median ~246 words" matches the incl.-code figure).
- **Similarity:** 5-word shingles over prose + code (lower-cased alphanumerics), Jaccard = |A∩B| / |A∪B|. "Title-masked" Jaccard replaces the page's own title words with a placeholder first, which exposes mail-merge templates. Candidates were generated three ways and unioned: (1) normalized slug key (strip `-u8`/`-N` suffixes and course prefixes, remove stop-words, light stemming: plural/-ion/-or/-er/-ing/-e), (2) stemmed title-token Jaccard ≥ 0.75, (3) body Jaccard ≥ 0.6 across all 1,791 content pages (all-pairs, cross-course included). 22,554 raw candidate pairs → 21,070 GenAI lesson pairs whose similarity disappears once cross-page boilerplate is removed (reported as one cluster in (c)), 798 same-topic `-1..-4` problem siblings (also (c)), 585 lesson↔problem / lesson↔interview pairs that merely share a topic word (different page types, distinct intent), and **101 pairs reviewed by hand** — the meaningful ones are tabled below.
- **Index status** = presence of `<meta name="robots" content="noindex…">` in the live HTML + presence in the live sitemap. The two always agree today (no indexable page is missing from the sitemap and no noindexed page is in it).
- **Not measured:** Search Console data itself (no GSC access), mock-test pages (`/mock-tests/*` are hard-coded `noindex, nofollow`), blog/projects/jobs (out of scope). DBMS "chapters 24–43 empty" produce **no** lesson URLs (no empty-body lesson page was found live), so they are not a thin-page source.

## (a) Near-duplicate slugs / pages

Columns: words = prose / incl. code. Jaccard = raw 5-shingle body similarity. Index = today's live status.

**Owner's examples at a glance**

| Owner example | Finding | Recommendation |
|---|---|---|
| structured-output vs structured-outputs | GenAI Unit 5 vs Unit 13, Jaccard 0.85 (0.93 title-masked), both noindex | merge + 301 structured-outputs → structured-output (Tier 1) |
| text-to-video vs text-to-video-u8 | GenAI Unit 6 vs Unit 8, **byte-identical** (Jaccard 1.0), identical `<title>`, both noindex | merge + 301 text-to-video-u8 → text-to-video (Tier 1) |
| attribute vs attributes | DBMS: relational-model attribute vs ER-model attributes, Jaccard 0.0, both indexable & thin (A 307 / 307, B 377 / 377 words prose/incl. code) | keep both, retitle to make the model explicit; expand |
| garbage-collection vs garbage-collector | Java: overlapping intent, Jaccard 0.0, both indexable & thin (A 186 / 249, B 148 / 212 words prose/incl. code) | Option A: repurpose collector page (GC algorithms) + expand; Option B: 301 collector → collection |
| ai-ml-notes vs generative-ai overlap | 7 same-intent topic pairs; AI/ML side is original (1,100–1,500 words, indexable), GenAI side is template (noindex); body Jaccard ≈ 0 (different text) | keep AI/ML pages; resolve on GenAI rewrite (differentiate, or drop + 301 to AI/ML) — Tier 3 |

### A. Exact / near-exact duplicates inside Generative AI (both noindex today)

| Page A | Page B | Words A | Words B | Jaccard | Index A | Index B | Stronger | Recommendation | Reason |
|---|---|---|---|---|---|---|---|---|---|
| `/learning/generative-ai/text-to-video` | `/learning/generative-ai/text-to-video-u8` | 948 / 948 | 948 / 948 | 1.0 | noindex, not in sitemap | noindex, not in sitemap | text-to-video (Unit 6, earlier) | merge + 301 (text-to-video-u8 → text-to-video) | Byte-identical body (Jaccard 1.00) and identical <title>; the `-u8` slug is a seed-collision suffix for the Unit 8 copy. |
| `/learning/generative-ai/structured-output` | `/learning/generative-ai/structured-outputs` | 901 / 901 | 901 / 901 | 0.85 | noindex, not in sitemap | noindex, not in sitemap | structured-output (Unit 5, earlier) | merge + 301 (structured-outputs → structured-output) | Singular/plural of one concept; 0.93 Jaccard once the title word is masked. Also redirect its 4 coding problems. |
| `/learning/generative-ai/model-quantization` | `/learning/generative-ai/quantization` | 898 / 898 | 882 / 882 | 0.85 | noindex, not in sitemap | noindex, not in sitemap | model-quantization (Unit 11, earlier) | merge + 301 (quantization → model-quantization) | Same concept, same template; 0.85 Jaccard. Also redirect its 4 coding problems. |
| `/learning/generative-ai/fine-tuning` | `/learning/generative-ai/fine-tuning-concepts` | 887 / 887 | 903 / 903 | 0.85 | noindex, not in sitemap | noindex, not in sitemap | fine-tuning (Unit 4, earlier) | merge + 301 (fine-tuning-concepts → fine-tuning) | Identical text once the title is masked (1.00); same search intent. Also redirect its 4 coding problems. |
| `/learning/generative-ai/embeddings` | `/learning/generative-ai/what-are-embeddings` | 881 / 881 | 913 / 913 | 0.84 | noindex, not in sitemap | noindex, not in sitemap | embeddings (Unit 3, earlier) | merge + 301 (what-are-embeddings → embeddings) | "What are embeddings" is the definitional intent of "Embeddings"; 0.84 Jaccard. Also redirect its 4 coding problems. |
| `/learning/generative-ai/function-calling` | `/learning/generative-ai/tools-and-function-calling` | 914 / 914 | 946 / 946 | 0.84 | noindex, not in sitemap | noindex, not in sitemap | tools-and-function-calling (Unit 12, earlier and broader) | merge + 301 (function-calling → tools-and-function-calling) | Function calling is a subset of the broader page; 0.84 Jaccard. Also redirect its 4 coding problems. |
| `/learning/generative-ai/text-to-image` | `/learning/generative-ai/text-to-image-generation` | 952 / 952 | 972 / 972 | 0.84 | noindex, not in sitemap | noindex, not in sitemap | text-to-image (Unit 6, earlier) | merge + 301 (text-to-image-generation → text-to-image) | Same task, two units; 0.84 Jaccard (0.95 title-masked). |
| `/learning/generative-ai/encoder-and-decoder` | `/learning/generative-ai/encoder-only-decoder-only-and-encoder-decoder-models` | 900 / 900 | 930 / 930 | 0.8 | noindex, not in sitemap | noindex, not in sitemap | encoder-only-… (superset topic) | rel=canonical is not appropriate (noindex); merge on rewrite + 301 (encoder-and-decoder → encoder-only-decoder-only-and-encoder-decoder-models) | Same unit; the longer page subsumes the shorter one; 0.98 title-masked. |
| `/learning/generative-ai/embeddings` | `/learning/generative-ai/text-embeddings` | 881 / 881 | 897 / 897 | 0.85 | noindex, not in sitemap | noindex, not in sitemap | — | keep both (distinct intent) — rewrite | Text embeddings vs the general concept is a legitimate sub-topic; the 0.85 similarity comes only from the shared template. |
| `/learning/generative-ai/embeddings` | `/learning/generative-ai/embedding-generation` | 881 / 881 | 897 / 897 | 0.82 | noindex, not in sitemap | noindex, not in sitemap | — | keep both (distinct intent) — rewrite | Generation pipeline vs concept; similarity is the template. |
| `/learning/generative-ai/fine-tuning` | `/learning/generative-ai/full-fine-tuning` | 887 / 887 | 903 / 903 | 0.85 | noindex, not in sitemap | noindex, not in sitemap | — | keep both (distinct intent) — rewrite | Full fine-tuning vs PEFT/LoRA is a real distinction; similarity is the template. |
| `/learning/generative-ai/image-to-text` | `/learning/generative-ai/text-to-image` | 952 / 952 | 952 / 952 | 0.75 | noindex, not in sitemap | noindex, not in sitemap | — | keep both (distinct intent) — rewrite | Opposite tasks; 1.00 title-masked similarity shows the body is pure template. |
| `/learning/generative-ai/text` | `/learning/generative-ai/text-to-text` | 950 / 950 | 950 / 950 | 0.85 | noindex, not in sitemap | noindex, not in sitemap | — | keep both (distinct intent) — rewrite | Modality vs task; similarity is the template. |

### B. AI/ML Notes (original, indexable) vs Generative AI (templated, noindex) topic overlap

| Page A | Page B | Words A | Words B | Jaccard | Index A | Index B | Stronger | Recommendation | Reason |
|---|---|---|---|---|---|---|---|---|---|
| `/learning/ai-ml-notes/ai-vs-ml-vs-deep-learning` | `/learning/generative-ai/ai-vs-ml-vs-deep-learning-vs-generative-ai` | 1118 / 1118 | 1104 / 1104 | 0.0 | index, in sitemap | noindex, not in sitemap | ai-ml-notes (original, indexable) | keep AI/ML page; on GenAI rewrite either add a GenAI-specific angle or drop from GenAI + 301 → AI/ML page | Same comparison intent; different text (Jaccard ≈0) so no canonical — GenAI copy is template. |
| `/learning/ai-ml-notes/generative-ai` | `/learning/generative-ai/what-is-generative-ai` | 1325 / 1325 | 1015 / 1015 | 0.0 | index, in sitemap | noindex, not in sitemap | ai-ml-notes today (original); GenAI after rewrite | keep both for now; GenAI course intro should be the canonical 'what is GenAI' page after rewrite; then 301 ai-ml-notes/generative-ai → generative-ai/what-is-generative-ai is optional | Identical head query ("what is generative AI"). |
| `/learning/ai-ml-notes/llm-basics` | `/learning/generative-ai/what-is-an-llm` | 1413 / 1413 | 1021 / 1021 | 0.0 | index, in sitemap | noindex, not in sitemap | ai-ml-notes | keep AI/ML page; on GenAI rewrite differentiate or 301 GenAI → AI/ML | Same intent ("what is an LLM"). |
| `/learning/ai-ml-notes/model-deployment` | `/learning/generative-ai/model-deployment` | 1369 / 1446 | 898 / 898 | 0.0 | index, in sitemap | noindex, not in sitemap | ai-ml-notes | keep AI/ML page; on GenAI rewrite differentiate (LLM serving) or 301 GenAI → AI/ML | Same slug and title. |
| `/learning/ai-ml-notes/neural-networks` | `/learning/generative-ai/neural-networks` | 1505 / 1505 | 970 / 970 | 0.0 | index, in sitemap | noindex, not in sitemap | ai-ml-notes | keep AI/ML page; 301 GenAI → AI/ML if the GenAI topic is dropped | Same slug and title; GenAI copy is a template prerequisite recap. |
| `/learning/ai-ml-notes/overfitting-underfitting` | `/learning/generative-ai/overfitting-and-underfitting` | 1077 / 1205 | 990 / 990 | 0.0 | index, in sitemap | noindex, not in sitemap | ai-ml-notes | keep AI/ML page; 301 GenAI → AI/ML if dropped | Same concept, classic-ML topic that belongs in AI/ML Notes. |
| `/learning/ai-ml-notes/training-validation-testing` | `/learning/generative-ai/training-validation-and-testing` | 1155 / 1265 | 1010 / 1010 | 0.0 | index, in sitemap | noindex, not in sitemap | ai-ml-notes | keep AI/ML page; 301 GenAI → AI/ML if dropped | Same concept, classic-ML topic. |

### C. Indexable near-duplicates inside one course

| Page A | Page B | Words A | Words B | Jaccard | Index A | Index B | Stronger | Recommendation | Reason |
|---|---|---|---|---|---|---|---|---|---|
| `/learning/java-tutorial/garbage-collection` | `/learning/java-tutorial/garbage-collector` | 186 / 249 | 148 / 212 | 0.0 | index, in sitemap | index, in sitemap | garbage-collection (longer, broader head term) | Option A (preferred, keeps slugs frozen): keep both, repurpose garbage-collector as "Garbage Collectors in Java (Serial, Parallel, G1, ZGC)" and expand both ≥600 words. Option B: merge + 301 (garbage-collector → garbage-collection) | Both thin (<250 words); the collector page explicitly re-describes "the process described in the previous topic". |
| `/learning/dbms-sql-tutorial/attribute` | `/learning/dbms-sql-tutorial/attributes` | 307 / 307 | 377 / 377 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) + retitle: "Attribute (Relational Model)" / "Attributes in the ER Model" | Relational-schema column vs ER-model property; text overlap ≈0, but slug/title differ only by an 's'. |
| `/learning/dbms-sql-tutorial/select` | `/learning/dbms-sql-tutorial/selection` | 230 / 251 | 262 / 276 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) + retitle selection → "Selection (σ) in Relational Algebra" | SQL SELECT statement vs relational-algebra σ. |
| `/learning/dbms-sql-tutorial/intersect` | `/learning/dbms-sql-tutorial/intersection` | 233 / 246 | 256 / 269 | 0.01 | index, in sitemap | index, in sitemap | — | keep both + retitle ("INTERSECT in SQL" / "Intersection (∩) in Relational Algebra") | SQL syntax vs algebra; the SQL page itself says it 'revisits' the algebra page. |
| `/learning/dbms-sql-tutorial/union` | `/learning/dbms-sql-tutorial/union-sql` | 288 / 301 | 259 / 272 | 0.02 | index, in sitemap | index, in sitemap | — | keep both + fix duplicate <title> (both are "Union · DBMS & SQL Tutorial") | Algebra vs SQL; identical titles today. |
| `/learning/dbms-sql-tutorial/natural-join` | `/learning/dbms-sql-tutorial/natural-join-sql` | 301 / 308 | 296 / 318 | 0.01 | index, in sitemap | index, in sitemap | — | keep both + fix duplicate <title> | Algebra vs SQL; identical titles today. |
| `/learning/dbms-sql-tutorial/rename` | `/learning/dbms-sql-tutorial/rename-statement` | 261 / 296 | 392 / 491 | 0.0 | index, in sitemap | index, in sitemap | — | keep both + fix duplicate <title> | Algebra ρ vs ALTER … RENAME; identical titles today. |
| `/learning/dbms-sql-tutorial/primary-key` | `/learning/dbms-sql-tutorial/primary-key-constraint-syntax` | 326 / 345 | 411 / 491 | 0.01 | index, in sitemap | index, in sitemap | — | keep both + fix duplicate <title> | Concept vs DDL syntax; identical titles today. |
| `/learning/dbms-sql-tutorial/foreign-key` | `/learning/dbms-sql-tutorial/foreign-key-constraint-syntax` | 343 / 376 | 356 / 478 | 0.0 | index, in sitemap | index, in sitemap | — | keep both + fix duplicate <title> | Concept vs DDL syntax; identical titles today. |
| `/learning/dbms-sql-tutorial/cardinality` | `/learning/dbms-sql-tutorial/cardinality-ratio` | 341 / 341 | 484 / 484 | 0.0 | index, in sitemap | index, in sitemap | — | keep both + fix duplicate <title> (3 pages titled "Cardinality") | Relation cardinality vs ER cardinality ratio. |
| `/learning/dbms-sql-tutorial/cardinality` | `/learning/dbms-sql-tutorial/index-cardinality` | 341 / 341 | 676 / 681 | 0.0 | index, in sitemap | index, in sitemap | — | keep both + retitle "Index Cardinality" | The index page itself explains the term's different meanings. |
| `/learning/java-tutorial/throw` | `/learning/java-tutorial/throws` | 143 / 193 | 155 / 197 | 0.02 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Separate keywords with separate search demand. |
| `/learning/java-tutorial/if-else` | `/learning/java-tutorial/else-if` | 127 / 163 | 172 / 240 | 0.03 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Separate constructs; low similarity (0.03). |

### D. Same slug across different courses (language-specific intent)

| Page A | Page B | Words A | Words B | Jaccard | Index A | Index B | Stronger | Recommendation | Reason |
|---|---|---|---|---|---|---|---|---|---|
| `/learning/java-tutorial/string` | `/learning/python-tutorial/strings` | 160 / 185 | 1710 / 2195 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Language-specific; the course name is in both titles. |
| `/learning/java-tutorial/file-handling` | `/learning/python-tutorial/file-handling` | 191 / 224 | 1570 / 2131 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Language-specific. |
| `/learning/java-tutorial/regular-expressions` | `/learning/python-tutorial/regular-expressions` | 159 / 195 | 1222 / 1628 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Language-specific. |
| `/learning/dbms-sql-tutorial/comments` | `/learning/java-tutorial/comments` | 261 / 296 | 171 / 221 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | SQL vs Java comments. |
| `/learning/dbms-sql-tutorial/data-types` | `/learning/java-tutorial/data-types` | 346 / 346 | 182 / 229 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | SQL vs Java types. |
| `/learning/dbms-sql-tutorial/logical-operators` | `/learning/java-tutorial/logical-operators` | 279 / 308 | 147 / 202 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | SQL vs Java operators. |
| `/learning/ai-ml-notes/functions` | `/learning/python-tutorial/functions` | 1120 / 1305 | 2534 / 3206 | 0.01 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) — optionally retitle AI/ML one "Python Functions for ML" | Same language, different depth/audience; Jaccard 0.01. |

### E. Coding problems / practice problems / interview pages

| Page A | Page B | Words A | Words B | Jaccard | Index A | Index B | Stronger | Recommendation | Reason |
|---|---|---|---|---|---|---|---|---|---|
| `/coding-problems/py-loops-prime-number-checker` | `/practice/problems/check-prime-number` | 217 / 223 | 77 / 79 | 0.02 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) — differentiate titles | Python-loop exercise vs 5-language judge problem; Jaccard 0.02. |
| `/coding-problems/py-strings-anagram-checker` | `/practice/problems/check-anagram` | 167 / 172 | 90 / 93 | 0.03 | index, in sitemap | index, in sitemap | — | keep both — differentiate titles | Same as above. |
| `/coding-problems/py-strings-palindrome-checker` | `/practice/problems/check-palindrome` | 157 / 162 | 82 / 84 | 0.04 | index, in sitemap | index, in sitemap | — | keep both — differentiate titles | Same as above. |
| `/coding-problems/java-logical-operators-leap-year` | `/coding-problems/py-conditionals-leap-year-checker` | 116 / 121 | 190 / 196 | 0.03 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Java vs Python. |
| `/coding-problems/py-datastructures-word-frequency-counter` | `/coding-problems/py-modules-packages-word-frequency-with-counter` | 211 / 232 | 202 / 214 | 0.05 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | dict-based vs collections.Counter technique; Jaccard 0.05. |
| `/coding-problems/natural-join-students-and-enrollments` | `/coding-problems/py-database-programming-join-students-and-enrollments` | 91 / 157 | 202 / 220 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | SQL vs Python-DB-API. |
| `/coding-problems/java-type-casting-char-code` | `/coding-problems/java-type-casting-code-to-char` | 119 / 123 | 110 / 114 | 0.06 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Inverse conversions. |
| `/coding-problems/aiml-cross-validation-2` | `/coding-problems/aiml-k-nearest-neighbors-2` | 74 / 97 | 87 / 118 | 0.06 | noindex, not in sitemap | noindex, not in sitemap | — | fix duplicate <title> (both "Problem 2: Compare Different Values of K"); both already noindex | Different topics, same title. |
| `/practice/problems/first-occurrence-in-sorted-array` | `/practice/problems/last-occurrence-in-sorted-array` | 97 / 105 | 98 / 106 | 0.65 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Highest practice similarity (0.65) is shared I/O boilerplate; separate classic problems. |
| `/practice/problems/preorder-traversal` | `/practice/problems/postorder-traversal` | 113 / 120 | 108 / 115 | 0.62 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | 0.62, shared tree I/O boilerplate. |
| `/practice/problems/queue-using-two-stacks` | `/practice/problems/stack-using-two-queues` | 101 / 110 | 119 / 126 | 0.27 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Mirror problems. |
| `/practice/interview-questions/java/abstract-classes` | `/practice/interview-questions/java/abstraction` | 133 / 167 | 86 / 107 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Jaccard ≈0. |
| `/practice/interview-questions/java/spring` | `/practice/interview-questions/java/spring-boot` | 134 / 160 | 129 / 153 | 0.0 | index, in sitemap | index, in sitemap | — | keep both (distinct intent) | Jaccard ≈0; both thin (160/153 words). |

## (b) Pages with < 600 words of main content

Rule: a page is listed if **prose < 600 OR incl.-code < 600** (prose is always ≤ incl.-code, so this equals prose < 600). Sorted ascending by prose words. "index" = indexable and in sitemap; "noindex" = `noindex, follow`, not in sitemap. "tmpl" = share of the page's 5-shingles that also occur on ≥ 15 other pages (boilerplate indicator).

### Summary per course

| Course / type | Pages | Median prose | Median incl. code | < 600 prose | < 600 incl. code | < 300 incl. code | Indexable < 600 incl. code | Already noindex |
|---|---|---|---|---|---|---|---|---|
| Lessons — AI/ML Notes | 77 | 1176 | 1287 | 0 | 0 | 0 | 0 | 0 |
| Lessons — DBMS & SQL Tutorial | 294 | 391.5 | 429.5 | 282 | 261 | 42 | 261 | 0 |
| Lessons — Generative AI | 207 | 950 | 950 | 0 | 0 | 0 | 0 | 206 |
| Lessons — Java Tutorial | 150 | 163.5 | 213.5 | 150 | 150 | 139 | 150 | 0 |
| Lessons — Python Tutorial | 30 | 1949.5 | 2452.5 | 0 | 0 | 0 | 0 | 0 |
| Lessons — Spring Boot Tutorial | 95 | 1636 | 2372 | 0 | 0 | 0 | 0 | 0 |
| Coding problems — AI/ML Notes (aiml-*) | 196 | 77 | 96 | 196 | 196 | 196 | 0 | 196 |
| Coding problems — DBMS & SQL (SQL slugs) | 52 | 76.5 | 140 | 52 | 52 | 52 | 52 | 0 |
| Coding problems — Generative AI (genai-*) | 336 | 29 | 29 | 336 | 336 | 336 | 0 | 336 |
| Coding problems — Java Tutorial (java-*) | 60 | 116.5 | 123 | 60 | 60 | 60 | 60 | 0 |
| Coding problems — Python Tutorial (py-*) | 98 | 207 | 217 | 98 | 98 | 92 | 98 | 0 |
| Interview questions — Java | 24 | 359.5 | 398.5 | 18 | 17 | 11 | 17 | 0 |
| Interview questions — Python | 22 | 484 | 610 | 14 | 11 | 3 | 11 | 0 |
| Practice problems (/practice/problems) | 150 | 98 | 106.5 | 150 | 150 | 150 | 150 | 0 |
| **Total** | **1791** | | | **1356** | **1331** | **1081** | **799** | **738** |

Courses with **zero** pages under 600 words: AI/ML Notes lessons (median 1,176 prose), Python Tutorial (median 1,950), Spring Boot (median 1,636), Generative AI lessons (950 — but templated, see (c)).

### Per-page lists

<details><summary><b>Lessons — DBMS & SQL Tutorial</b> — 282 pages under 600 prose words (282 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/learning/dbms-sql-tutorial/insert` | 224 | 237 | index | 0.02 |
| 2 | `/learning/dbms-sql-tutorial/distinct` | 225 | 231 | index | 0.08 |
| 3 | `/learning/dbms-sql-tutorial/difference` | 225 | 238 | index | 0.00 |
| 4 | `/learning/dbms-sql-tutorial/order-by` | 225 | 381 | index | 0.00 |
| 5 | `/learning/dbms-sql-tutorial/like` | 227 | 264 | index | 0.07 |
| 6 | `/learning/dbms-sql-tutorial/select` | 230 | 251 | index | 0.07 |
| 7 | `/learning/dbms-sql-tutorial/intersect` | 233 | 246 | index | 0.00 |
| 8 | `/learning/dbms-sql-tutorial/multi-row-insert` | 238 | 259 | index | 0.01 |
| 9 | `/learning/dbms-sql-tutorial/duplicate-handling` | 243 | 243 | index | 0.00 |
| 10 | `/learning/dbms-sql-tutorial/commit` | 243 | 265 | index | 0.00 |
| 11 | `/learning/dbms-sql-tutorial/transaction-boundaries` | 244 | 271 | index | 0.00 |
| 12 | `/learning/dbms-sql-tutorial/update` | 246 | 257 | index | 0.00 |
| 13 | `/learning/dbms-sql-tutorial/ddl` | 247 | 290 | index | 0.00 |
| 14 | `/learning/dbms-sql-tutorial/between` | 249 | 275 | index | 0.07 |
| 15 | `/learning/dbms-sql-tutorial/multi-table-joins` | 251 | 293 | index | 0.01 |
| 16 | `/learning/dbms-sql-tutorial/set-compatibility` | 251 | 297 | index | 0.00 |
| 17 | `/learning/dbms-sql-tutorial/rollback` | 254 | 276 | index | 0.00 |
| 18 | `/learning/dbms-sql-tutorial/intersection` | 256 | 269 | index | 0.00 |
| 19 | `/learning/dbms-sql-tutorial/atomicity` | 256 | 285 | index | 0.00 |
| 20 | `/learning/dbms-sql-tutorial/coalesce` | 257 | 267 | index | 0.07 |
| 21 | `/learning/dbms-sql-tutorial/union-sql` | 259 | 272 | index | 0.00 |
| 22 | `/learning/dbms-sql-tutorial/comparison-operators` | 261 | 276 | index | 0.07 |
| 23 | `/learning/dbms-sql-tutorial/comments` | 261 | 296 | index | 0.00 |
| 24 | `/learning/dbms-sql-tutorial/rename` | 261 | 296 | index | 0.00 |
| 25 | `/learning/dbms-sql-tutorial/selection` | 262 | 276 | index | 0.00 |
| 26 | `/learning/dbms-sql-tutorial/except` | 263 | 276 | index | 0.00 |
| 27 | `/learning/dbms-sql-tutorial/is-null` | 266 | 275 | index | 0.07 |
| 28 | `/learning/dbms-sql-tutorial/where` | 267 | 279 | index | 0.07 |
| 29 | `/learning/dbms-sql-tutorial/alternate-key` | 271 | 298 | index | 0.00 |
| 30 | `/learning/dbms-sql-tutorial/theta-join` | 272 | 290 | index | 0.00 |
| 31 | `/learning/dbms-sql-tutorial/insert-select` | 275 | 291 | index | 0.00 |
| 32 | `/learning/dbms-sql-tutorial/inner-join` | 275 | 292 | index | 0.01 |
| 33 | `/learning/dbms-sql-tutorial/operator-precedence` | 275 | 296 | index | 0.00 |
| 34 | `/learning/dbms-sql-tutorial/upsert-patterns` | 275 | 316 | index | 0.02 |
| 35 | `/learning/dbms-sql-tutorial/sql-statement-structure` | 275 | 333 | index | 0.00 |
| 36 | `/learning/dbms-sql-tutorial/is-not-null` | 276 | 287 | index | 0.07 |
| 37 | `/learning/dbms-sql-tutorial/union-all` | 276 | 290 | index | 0.00 |
| 38 | `/learning/dbms-sql-tutorial/multiple-sort-keys` | 277 | 379 | index | 0.00 |
| 39 | `/learning/dbms-sql-tutorial/logical-operators` | 279 | 308 | index | 0.06 |
| 40 | `/learning/dbms-sql-tutorial/sql-dialects` | 280 | 280 | index | 0.00 |
| 41 | `/learning/dbms-sql-tutorial/pattern-matching` | 280 | 301 | index | 0.07 |
| 42 | `/learning/dbms-sql-tutorial/isolation` | 284 | 284 | index | 0.00 |
| 43 | `/learning/dbms-sql-tutorial/delete` | 284 | 291 | index | 0.00 |
| 44 | `/learning/dbms-sql-tutorial/degree` | 286 | 286 | index | 0.00 |
| 45 | `/learning/dbms-sql-tutorial/autocommit` | 287 | 311 | index | 0.00 |
| 46 | `/learning/dbms-sql-tutorial/union` | 288 | 301 | index | 0.00 |
| 47 | `/learning/dbms-sql-tutorial/duplicate-rows` | 288 | 305 | index | 0.00 |
| 48 | `/learning/dbms-sql-tutorial/surrogate-key` | 288 | 323 | index | 0.00 |
| 49 | `/learning/dbms-sql-tutorial/projection` | 289 | 295 | index | 0.00 |
| 50 | `/learning/dbms-sql-tutorial/in` | 289 | 314 | index | 0.06 |
| 51 | `/learning/dbms-sql-tutorial/savepoint` | 289 | 334 | index | 0.00 |
| 52 | `/learning/dbms-sql-tutorial/nullif` | 291 | 301 | index | 0.00 |
| 53 | `/learning/dbms-sql-tutorial/transaction-concept` | 294 | 294 | index | 0.00 |
| 54 | `/learning/dbms-sql-tutorial/tuple` | 295 | 295 | index | 0.00 |
| 55 | `/learning/dbms-sql-tutorial/unique-constraint` | 295 | 325 | index | 0.00 |
| 56 | `/learning/dbms-sql-tutorial/case` | 296 | 318 | index | 0.06 |
| 57 | `/learning/dbms-sql-tutorial/natural-join-sql` | 296 | 318 | index | 0.00 |
| 58 | `/learning/dbms-sql-tutorial/consistency` | 298 | 298 | index | 0.00 |
| 59 | `/learning/dbms-sql-tutorial/right-join` | 299 | 315 | index | 0.01 |
| 60 | `/learning/dbms-sql-tutorial/durability` | 301 | 301 | index | 0.00 |
| 61 | `/learning/dbms-sql-tutorial/natural-join` | 301 | 308 | index | 0.00 |
| 62 | `/learning/dbms-sql-tutorial/cascading-actions` | 304 | 355 | index | 0.00 |
| 63 | `/learning/dbms-sql-tutorial/max` | 305 | 398 | index | 0.01 |
| 64 | `/learning/dbms-sql-tutorial/attribute` | 307 | 307 | index | 0.00 |
| 65 | `/learning/dbms-sql-tutorial/equi-join` | 308 | 323 | index | 0.00 |
| 66 | `/learning/dbms-sql-tutorial/data-validation` | 308 | 328 | index | 0.00 |
| 67 | `/learning/dbms-sql-tutorial/natural-key` | 309 | 328 | index | 0.00 |
| 68 | `/learning/dbms-sql-tutorial/sql-overview` | 310 | 310 | index | 0.00 |
| 69 | `/learning/dbms-sql-tutorial/acid` | 311 | 311 | index | 0.00 |
| 70 | `/learning/dbms-sql-tutorial/sql-standards` | 311 | 311 | index | 0.00 |
| 71 | `/learning/dbms-sql-tutorial/dml` | 311 | 338 | index | 0.02 |
| 72 | `/learning/dbms-sql-tutorial/full-outer-join` | 313 | 330 | index | 0.01 |
| 73 | `/learning/dbms-sql-tutorial/merge-concept` | 313 | 347 | index | 0.00 |
| 74 | `/learning/dbms-sql-tutorial/null-ordering` | 313 | 397 | index | 0.00 |
| 75 | `/learning/dbms-sql-tutorial/business-constraints` | 315 | 344 | index | 0.00 |
| 76 | `/learning/dbms-sql-tutorial/entity-integrity` | 316 | 339 | index | 0.00 |
| 77 | `/learning/dbms-sql-tutorial/left-join` | 320 | 337 | index | 0.01 |
| 78 | `/learning/dbms-sql-tutorial/data-modification-transactions` | 322 | 343 | index | 0.00 |
| 79 | `/learning/dbms-sql-tutorial/division` | 322 | 345 | index | 0.00 |
| 80 | `/learning/dbms-sql-tutorial/offset` | 322 | 429 | index | 0.00 |
| 81 | `/learning/dbms-sql-tutorial/composite-key` | 323 | 348 | index | 0.00 |
| 82 | `/learning/dbms-sql-tutorial/join-predicate` | 323 | 360 | index | 0.01 |
| 83 | `/learning/dbms-sql-tutorial/referential-integrity` | 324 | 372 | index | 0.00 |
| 84 | `/learning/dbms-sql-tutorial/domain` | 325 | 325 | index | 0.00 |
| 85 | `/learning/dbms-sql-tutorial/primary-key` | 326 | 345 | index | 0.00 |
| 86 | `/learning/dbms-sql-tutorial/null-semantics` | 326 | 365 | index | 0.00 |
| 87 | `/learning/dbms-sql-tutorial/database-instance` | 331 | 331 | index | 0.00 |
| 88 | `/learning/dbms-sql-tutorial/candidate-key` | 332 | 332 | index | 0.00 |
| 89 | `/learning/dbms-sql-tutorial/anti-join` | 332 | 350 | index | 0.01 |
| 90 | `/learning/dbms-sql-tutorial/dql` | 334 | 360 | index | 0.01 |
| 91 | `/learning/dbms-sql-tutorial/relation-schema` | 335 | 335 | index | 0.00 |
| 92 | `/learning/dbms-sql-tutorial/limit` | 335 | 424 | index | 0.01 |
| 93 | `/learning/dbms-sql-tutorial/database-schema` | 336 | 336 | index | 0.00 |
| 94 | `/learning/dbms-sql-tutorial/identifiers` | 336 | 336 | index | 0.00 |
| 95 | `/learning/dbms-sql-tutorial/relation` | 337 | 337 | index | 0.00 |
| 96 | `/learning/dbms-sql-tutorial/dcl` | 338 | 359 | index | 0.00 |
| 97 | `/learning/dbms-sql-tutorial/join-cardinality` | 340 | 340 | index | 0.00 |
| 98 | `/learning/dbms-sql-tutorial/cardinality` | 341 | 341 | index | 0.00 |
| 99 | `/learning/dbms-sql-tutorial/cross-join` | 341 | 354 | index | 0.01 |
| 100 | `/learning/dbms-sql-tutorial/foreign-key` | 343 | 376 | index | 0.00 |
| 101 | `/learning/dbms-sql-tutorial/data-types` | 346 | 346 | index | 0.00 |
| 102 | `/learning/dbms-sql-tutorial/transaction-states` | 347 | 347 | index | 0.00 |
| 103 | `/learning/dbms-sql-tutorial/literals` | 348 | 348 | index | 0.00 |
| 104 | `/learning/dbms-sql-tutorial/relational-algebra-expressions` | 348 | 359 | index | 0.00 |
| 105 | `/learning/dbms-sql-tutorial/create-database` | 348 | 406 | index | 0.00 |
| 106 | `/learning/dbms-sql-tutorial/external-schema` | 352 | 352 | index | 0.00 |
| 107 | `/learning/dbms-sql-tutorial/database-middleware` | 354 | 354 | index | 0.00 |
| 108 | `/learning/dbms-sql-tutorial/tcl` | 355 | 378 | index | 0.00 |
| 109 | `/learning/dbms-sql-tutorial/keyset-pagination` | 356 | 465 | index | 0.00 |
| 110 | `/learning/dbms-sql-tutorial/foreign-key-constraint-syntax` | 356 | 478 | index | 0.00 |
| 111 | `/learning/dbms-sql-tutorial/logical-data-independence` | 358 | 358 | index | 0.00 |
| 112 | `/learning/dbms-sql-tutorial/single-valued-attribute` | 358 | 358 | index | 0.01 |
| 113 | `/learning/dbms-sql-tutorial/cartesian-product` | 360 | 367 | index | 0.00 |
| 114 | `/learning/dbms-sql-tutorial/three-schema-architecture` | 365 | 365 | index | 0.00 |
| 115 | `/learning/dbms-sql-tutorial/top-n-queries` | 367 | 442 | index | 0.00 |
| 116 | `/learning/dbms-sql-tutorial/data-abstraction` | 368 | 368 | index | 0.00 |
| 117 | `/learning/dbms-sql-tutorial/outer-join` | 368 | 384 | index | 0.00 |
| 118 | `/learning/dbms-sql-tutorial/relationship` | 370 | 370 | index | 0.01 |
| 119 | `/learning/dbms-sql-tutorial/self-join` | 371 | 388 | index | 0.01 |
| 120 | `/learning/dbms-sql-tutorial/database-drivers` | 372 | 372 | index | 0.00 |
| 121 | `/learning/dbms-sql-tutorial/database-apis` | 373 | 384 | index | 0.00 |
| 122 | `/learning/dbms-sql-tutorial/conceptual-schema` | 374 | 374 | index | 0.00 |
| 123 | `/learning/dbms-sql-tutorial/super-key` | 374 | 374 | index | 0.00 |
| 124 | `/learning/dbms-sql-tutorial/create-table` | 374 | 430 | index | 0.01 |
| 125 | `/learning/dbms-sql-tutorial/create-schema` | 374 | 448 | index | 0.00 |
| 126 | `/learning/dbms-sql-tutorial/nested-transaction-concepts` | 375 | 375 | index | 0.00 |
| 127 | `/learning/dbms-sql-tutorial/generated-columns` | 375 | 496 | index | 0.00 |
| 128 | `/learning/dbms-sql-tutorial/safe-updates` | 376 | 376 | index | 0.00 |
| 129 | `/learning/dbms-sql-tutorial/attributes` | 377 | 377 | index | 0.01 |
| 130 | `/learning/dbms-sql-tutorial/alter-table` | 379 | 489 | index | 0.00 |
| 131 | `/learning/dbms-sql-tutorial/simple-attribute` | 380 | 380 | index | 0.01 |
| 132 | `/learning/dbms-sql-tutorial/semi-join` | 380 | 397 | index | 0.01 |
| 133 | `/learning/dbms-sql-tutorial/relational-integrity` | 382 | 382 | index | 0.00 |
| 134 | `/learning/dbms-sql-tutorial/set-operation-performance` | 383 | 383 | index | 0.00 |
| 135 | `/learning/dbms-sql-tutorial/date-functions` | 384 | 532 | index | 0.00 |
| 136 | `/learning/dbms-sql-tutorial/string-functions` | 386 | 496 | index | 0.01 |
| 137 | `/learning/dbms-sql-tutorial/bulk-loading` | 387 | 387 | index | 0.00 |
| 138 | `/learning/dbms-sql-tutorial/strong-entity` | 387 | 387 | index | 0.01 |
| 139 | `/learning/dbms-sql-tutorial/two-tier-architecture` | 387 | 387 | index | 0.00 |
| 140 | `/learning/dbms-sql-tutorial/named-constraints` | 387 | 477 | index | 0.01 |
| 141 | `/learning/dbms-sql-tutorial/drop-table` | 388 | 475 | index | 0.00 |
| 142 | `/learning/dbms-sql-tutorial/relational-algebra-practice` | 389 | 389 | index | 0.00 |
| 143 | `/learning/dbms-sql-tutorial/three-tier-architecture` | 389 | 389 | index | 0.00 |
| 144 | `/learning/dbms-sql-tutorial/physical-data-independence` | 390 | 390 | index | 0.00 |
| 145 | `/learning/dbms-sql-tutorial/client-server-architecture` | 390 | 397 | index | 0.00 |
| 146 | `/learning/dbms-sql-tutorial/unique` | 391 | 464 | index | 0.00 |
| 147 | `/learning/dbms-sql-tutorial/default` | 391 | 503 | index | 0.00 |
| 148 | `/learning/dbms-sql-tutorial/entity-set` | 392 | 392 | index | 0.01 |
| 149 | `/learning/dbms-sql-tutorial/count` | 392 | 487 | index | 0.01 |
| 150 | `/learning/dbms-sql-tutorial/rename-statement` | 392 | 491 | index | 0.00 |
| 151 | `/learning/dbms-sql-tutorial/internal-schema` | 393 | 393 | index | 0.00 |
| 152 | `/learning/dbms-sql-tutorial/entity` | 396 | 396 | index | 0.01 |
| 153 | `/learning/dbms-sql-tutorial/avg` | 399 | 471 | index | 0.01 |
| 154 | `/learning/dbms-sql-tutorial/sum` | 400 | 470 | index | 0.00 |
| 155 | `/learning/dbms-sql-tutorial/connection-pooling` | 405 | 405 | index | 0.00 |
| 156 | `/learning/dbms-sql-tutorial/derived-attribute` | 406 | 406 | index | 0.01 |
| 157 | `/learning/dbms-sql-tutorial/not-null` | 406 | 542 | index | 0.00 |
| 158 | `/learning/dbms-sql-tutorial/constraint-validation` | 409 | 516 | index | 0.00 |
| 159 | `/learning/dbms-sql-tutorial/primary-key-constraint-syntax` | 411 | 491 | index | 0.00 |
| 160 | `/learning/dbms-sql-tutorial/recursive-relationship` | 415 | 415 | index | 0.01 |
| 161 | `/learning/dbms-sql-tutorial/identity-columns` | 416 | 492 | index | 0.00 |
| 162 | `/learning/dbms-sql-tutorial/specialization` | 420 | 420 | index | 0.01 |
| 163 | `/learning/dbms-sql-tutorial/multi-valued-attribute` | 424 | 424 | index | 0.00 |
| 164 | `/learning/dbms-sql-tutorial/composite-attribute` | 425 | 425 | index | 0.01 |
| 165 | `/learning/dbms-sql-tutorial/relationship-degree` | 425 | 425 | index | 0.01 |
| 166 | `/learning/dbms-sql-tutorial/temporary-tables` | 425 | 544 | index | 0.00 |
| 167 | `/learning/dbms-sql-tutorial/generalization` | 427 | 427 | index | 0.01 |
| 168 | `/learning/dbms-sql-tutorial/identifying-relationship` | 429 | 429 | index | 0.01 |
| 169 | `/learning/dbms-sql-tutorial/weak-entity` | 429 | 429 | index | 0.01 |
| 170 | `/learning/dbms-sql-tutorial/conversion-functions` | 429 | 545 | index | 0.01 |
| 171 | `/learning/dbms-sql-tutorial/min` | 430 | 478 | index | 0.01 |
| 172 | `/learning/dbms-sql-tutorial/hierarchical-model` | 431 | 448 | index | 0.00 |
| 173 | `/learning/dbms-sql-tutorial/multiple-row-subquery` | 435 | 470 | index | 0.01 |
| 174 | `/learning/dbms-sql-tutorial/null-values` | 436 | 436 | index | 0.00 |
| 175 | `/learning/dbms-sql-tutorial/numeric-functions` | 436 | 531 | index | 0.01 |
| 176 | `/learning/dbms-sql-tutorial/check` | 437 | 478 | index | 0.00 |
| 177 | `/learning/dbms-sql-tutorial/truncate-table` | 438 | 480 | index | 0.00 |
| 178 | `/learning/dbms-sql-tutorial/eer-diagram` | 440 | 440 | index | 0.01 |
| 179 | `/learning/dbms-sql-tutorial/any` | 440 | 456 | index | 0.01 |
| 180 | `/learning/dbms-sql-tutorial/relational-model` | 441 | 484 | index | 0.01 |
| 181 | `/learning/dbms-sql-tutorial/table-constraints` | 441 | 545 | index | 0.00 |
| 182 | `/learning/dbms-sql-tutorial/object-relational-model` | 445 | 488 | index | 0.00 |
| 183 | `/learning/dbms-sql-tutorial/participation` | 447 | 447 | index | 0.01 |
| 184 | `/learning/dbms-sql-tutorial/partial-dependency` | 449 | 449 | index | 0.00 |
| 185 | `/learning/dbms-sql-tutorial/stable-sorting` | 449 | 499 | index | 0.00 |
| 186 | `/learning/dbms-sql-tutorial/sequences` | 452 | 524 | index | 0.00 |
| 187 | `/learning/dbms-sql-tutorial/conditional-functions` | 455 | 552 | index | 0.01 |
| 188 | `/learning/dbms-sql-tutorial/having` | 459 | 545 | index | 0.01 |
| 189 | `/learning/dbms-sql-tutorial/pagination-performance` | 464 | 520 | index | 0.00 |
| 190 | `/learning/dbms-sql-tutorial/aggregate-functions` | 465 | 541 | index | 0.01 |
| 191 | `/learning/dbms-sql-tutorial/dbms-advantages-and-trade-offs` | 469 | 469 | index | 0.00 |
| 192 | `/learning/dbms-sql-tutorial/complex-views` | 469 | 539 | index | 0.00 |
| 193 | `/learning/dbms-sql-tutorial/time-functions` | 469 | 590 | index | 0.01 |
| 194 | `/learning/dbms-sql-tutorial/update-anomaly` | 471 | 492 | index | 0.00 |
| 195 | `/learning/dbms-sql-tutorial/schema-evolution` | 472 | 596 | index | 0.00 |
| 196 | `/learning/dbms-sql-tutorial/simple-views` | 476 | 509 | index | 0.01 |
| 197 | `/learning/dbms-sql-tutorial/storage-manager` | 477 | 477 | index | 0.01 |
| 198 | `/learning/dbms-sql-tutorial/3nf` | 478 | 507 | index | 0.00 |
| 199 | `/learning/dbms-sql-tutorial/query-processor` | 480 | 480 | index | 0.01 |
| 200 | `/learning/dbms-sql-tutorial/cardinality-ratio` | 484 | 484 | index | 0.00 |
| 201 | `/learning/dbms-sql-tutorial/deferred-constraint-concepts` | 485 | 596 | index | 0.00 |
| 202 | `/learning/dbms-sql-tutorial/create-view` | 485 | 607 | index | 0.01 |
| 203 | `/learning/dbms-sql-tutorial/scalar-subquery` | 486 | 512 | index | 0.01 |
| 204 | `/learning/dbms-sql-tutorial/database-engine` | 489 | 489 | index | 0.01 |
| 205 | `/learning/dbms-sql-tutorial/database-users-and-roles` | 489 | 489 | index | 0.01 |
| 206 | `/learning/dbms-sql-tutorial/column-constraints` | 490 | 548 | index | 0.00 |
| 207 | `/learning/dbms-sql-tutorial/composite-index` | 492 | 500 | index | 0.01 |
| 208 | `/learning/dbms-sql-tutorial/single-row-subquery` | 497 | 526 | index | 0.01 |
| 209 | `/learning/dbms-sql-tutorial/subquery-in-select` | 498 | 530 | index | 0.01 |
| 210 | `/learning/dbms-sql-tutorial/aggregation` | 502 | 502 | index | 0.00 |
| 211 | `/learning/dbms-sql-tutorial/non-clustered-index` | 502 | 510 | index | 0.00 |
| 212 | `/learning/dbms-sql-tutorial/not-exists` | 502 | 558 | index | 0.01 |
| 213 | `/learning/dbms-sql-tutorial/dbms-goals` | 503 | 503 | index | 0.01 |
| 214 | `/learning/dbms-sql-tutorial/full-functional-dependency` | 503 | 503 | index | 0.00 |
| 215 | `/learning/dbms-sql-tutorial/function-based-index-concept` | 504 | 521 | index | 0.00 |
| 216 | `/learning/dbms-sql-tutorial/insertion-anomaly` | 504 | 530 | index | 0.00 |
| 217 | `/learning/dbms-sql-tutorial/correlated-subquery` | 505 | 528 | index | 0.01 |
| 218 | `/learning/dbms-sql-tutorial/recoverable-schedule` | 505 | 569 | index | 0.00 |
| 219 | `/learning/dbms-sql-tutorial/all` | 506 | 522 | index | 0.01 |
| 220 | `/learning/dbms-sql-tutorial/materialized-views` | 506 | 659 | index | 0.01 |
| 221 | `/learning/dbms-sql-tutorial/2nf` | 507 | 520 | index | 0.00 |
| 222 | `/learning/dbms-sql-tutorial/deletion-anomaly` | 508 | 517 | index | 0.00 |
| 223 | `/learning/dbms-sql-tutorial/relational-model-rules` | 509 | 509 | index | 0.00 |
| 224 | `/learning/dbms-sql-tutorial/transitive-dependency` | 509 | 512 | index | 0.00 |
| 225 | `/learning/dbms-sql-tutorial/database-and-dbms` | 511 | 511 | index | 0.01 |
| 226 | `/learning/dbms-sql-tutorial/keys-in-the-relational-model` | 511 | 511 | index | 0.00 |
| 227 | `/learning/dbms-sql-tutorial/covering-index` | 511 | 528 | index | 0.00 |
| 228 | `/learning/dbms-sql-tutorial/data-information-metadata-and-knowledge` | 513 | 513 | index | 0.00 |
| 229 | `/learning/dbms-sql-tutorial/network-model` | 515 | 523 | index | 0.01 |
| 230 | `/learning/dbms-sql-tutorial/partial-index-concept` | 515 | 535 | index | 0.00 |
| 231 | `/learning/dbms-sql-tutorial/minimal-cover` | 516 | 582 | index | 0.00 |
| 232 | `/learning/dbms-sql-tutorial/conflict-serializability` | 516 | 600 | index | 0.00 |
| 233 | `/learning/dbms-sql-tutorial/exists` | 519 | 535 | index | 0.01 |
| 234 | `/learning/dbms-sql-tutorial/transaction-manager` | 522 | 522 | index | 0.01 |
| 235 | `/learning/dbms-sql-tutorial/serial-schedule` | 524 | 560 | index | 0.00 |
| 236 | `/learning/dbms-sql-tutorial/hash-index` | 526 | 534 | index | 0.00 |
| 237 | `/learning/dbms-sql-tutorial/object-oriented-model` | 531 | 547 | index | 0.01 |
| 238 | `/learning/dbms-sql-tutorial/closure-of-attributes` | 533 | 552 | index | 0.00 |
| 239 | `/learning/dbms-sql-tutorial/key-value-model` | 536 | 553 | index | 0.00 |
| 240 | `/learning/dbms-sql-tutorial/graph-model` | 538 | 584 | index | 0.01 |
| 241 | `/learning/dbms-sql-tutorial/clustered-index` | 539 | 539 | index | 0.00 |
| 242 | `/learning/dbms-sql-tutorial/unique-index` | 539 | 547 | index | 0.00 |
| 243 | `/learning/dbms-sql-tutorial/1nf` | 545 | 545 | index | 0.00 |
| 244 | `/learning/dbms-sql-tutorial/denormalization` | 547 | 597 | index | 0.00 |
| 245 | `/learning/dbms-sql-tutorial/non-serial-schedule` | 548 | 572 | index | 0.00 |
| 246 | `/learning/dbms-sql-tutorial/where-vs-having` | 548 | 638 | index | 0.01 |
| 247 | `/learning/dbms-sql-tutorial/candidate-key-derivation` | 549 | 549 | index | 0.00 |
| 248 | `/learning/dbms-sql-tutorial/4nf` | 549 | 559 | index | 0.00 |
| 249 | `/learning/dbms-sql-tutorial/document-model` | 549 | 575 | index | 0.00 |
| 250 | `/learning/dbms-sql-tutorial/data-redundancy` | 555 | 564 | index | 0.00 |
| 251 | `/learning/dbms-sql-tutorial/bcnf` | 555 | 577 | index | 0.00 |
| 252 | `/learning/dbms-sql-tutorial/cascadeless-schedule` | 555 | 612 | index | 0.00 |
| 253 | `/learning/dbms-sql-tutorial/b-plus-tree` | 560 | 570 | index | 0.00 |
| 254 | `/learning/dbms-sql-tutorial/lost-update` | 562 | 630 | index | 0.00 |
| 255 | `/learning/dbms-sql-tutorial/subquery-in-where` | 563 | 591 | index | 0.01 |
| 256 | `/learning/dbms-sql-tutorial/selectivity` | 565 | 574 | index | 0.00 |
| 257 | `/learning/dbms-sql-tutorial/buffer-manager` | 567 | 567 | index | 0.01 |
| 258 | `/learning/dbms-sql-tutorial/concurrent-execution` | 567 | 626 | index | 0.00 |
| 259 | `/learning/dbms-sql-tutorial/b-tree` | 571 | 571 | index | 0.00 |
| 260 | `/learning/dbms-sql-tutorial/dbms-components` | 571 | 571 | index | 0.00 |
| 261 | `/learning/dbms-sql-tutorial/group-by` | 571 | 665 | index | 0.01 |
| 262 | `/learning/dbms-sql-tutorial/conditional-aggregation` | 572 | 683 | index | 0.00 |
| 263 | `/learning/dbms-sql-tutorial/why-indexes-exist` | 573 | 581 | index | 0.00 |
| 264 | `/learning/dbms-sql-tutorial/index-maintenance` | 574 | 591 | index | 0.00 |
| 265 | `/learning/dbms-sql-tutorial/subquery-vs-join` | 574 | 656 | index | 0.01 |
| 266 | `/learning/dbms-sql-tutorial/functional-dependency` | 575 | 575 | index | 0.00 |
| 267 | `/learning/dbms-sql-tutorial/column-family-model` | 575 | 612 | index | 0.00 |
| 268 | `/learning/dbms-sql-tutorial/updatable-views` | 577 | 720 | index | 0.00 |
| 269 | `/learning/dbms-sql-tutorial/database-administrator` | 580 | 580 | index | 0.01 |
| 270 | `/learning/dbms-sql-tutorial/strict-schedule` | 582 | 642 | index | 0.00 |
| 271 | `/learning/dbms-sql-tutorial/grouping-sets-concept` | 582 | 676 | index | 0.01 |
| 272 | `/learning/dbms-sql-tutorial/cube-concept` | 584 | 621 | index | 0.01 |
| 273 | `/learning/dbms-sql-tutorial/view-security` | 585 | 658 | index | 0.01 |
| 274 | `/learning/dbms-sql-tutorial/subquery-in-from` | 587 | 629 | index | 0.01 |
| 275 | `/learning/dbms-sql-tutorial/database-designer` | 589 | 589 | index | 0.01 |
| 276 | `/learning/dbms-sql-tutorial/5nf` | 590 | 599 | index | 0.00 |
| 277 | `/learning/dbms-sql-tutorial/dirty-read` | 591 | 651 | index | 0.00 |
| 278 | `/learning/dbms-sql-tutorial/precedence-graph` | 592 | 628 | index | 0.00 |
| 279 | `/learning/dbms-sql-tutorial/application-developer` | 593 | 593 | index | 0.01 |
| 280 | `/learning/dbms-sql-tutorial/relational-vs-nosql` | 593 | 593 | index | 0.00 |
| 281 | `/learning/dbms-sql-tutorial/multiple-grouping-columns` | 593 | 653 | index | 0.01 |
| 282 | `/learning/dbms-sql-tutorial/view-serializability` | 595 | 607 | index | 0.00 |

</details>

<details><summary><b>Lessons — Java Tutorial</b> — 150 pages under 600 prose words (150 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/learning/java-tutorial/jdbc-programs` | 86 | 160 | index | 0.01 |
| 2 | `/learning/java-tutorial/array-programs` | 89 | 189 | index | 0.02 |
| 3 | `/learning/java-tutorial/oop-programs` | 89 | 207 | index | 0.01 |
| 4 | `/learning/java-tutorial/multithreading-programs` | 90 | 168 | index | 0.01 |
| 5 | `/learning/java-tutorial/pattern-programs` | 93 | 191 | index | 0.02 |
| 6 | `/learning/java-tutorial/exception-handling-programs` | 93 | 209 | index | 0.01 |
| 7 | `/learning/java-tutorial/string-programs` | 99 | 206 | index | 0.01 |
| 8 | `/learning/java-tutorial/collection-programs` | 99 | 207 | index | 0.01 |
| 9 | `/learning/java-tutorial/beginner-java-programs` | 102 | 213 | index | 0.01 |
| 10 | `/learning/java-tutorial/java-coding-interview-questions` | 104 | 211 | index | 0.01 |
| 11 | `/learning/java-tutorial/if-else` | 127 | 163 | index | 0.05 |
| 12 | `/learning/java-tutorial/hashset` | 135 | 169 | index | 0.04 |
| 13 | `/learning/java-tutorial/linkedhashset` | 138 | 173 | index | 0.05 |
| 14 | `/learning/java-tutorial/final-keyword` | 140 | 180 | index | 0.05 |
| 15 | `/learning/java-tutorial/continue` | 141 | 182 | index | 0.04 |
| 16 | `/learning/java-tutorial/treemap` | 142 | 179 | index | 0.05 |
| 17 | `/learning/java-tutorial/abstraction` | 142 | 190 | index | 0.04 |
| 18 | `/learning/java-tutorial/mini-projects` | 142 | 259 | index | 0.01 |
| 19 | `/learning/java-tutorial/throw` | 143 | 193 | index | 0.04 |
| 20 | `/learning/java-tutorial/two-dimensional-array` | 144 | 186 | index | 0.06 |
| 21 | `/learning/java-tutorial/exception` | 144 | 190 | index | 0.05 |
| 22 | `/learning/java-tutorial/vector` | 145 | 176 | index | 0.04 |
| 23 | `/learning/java-tutorial/map` | 146 | 186 | index | 0.05 |
| 24 | `/learning/java-tutorial/unary-operators` | 147 | 199 | index | 0.04 |
| 25 | `/learning/java-tutorial/logical-operators` | 147 | 202 | index | 0.04 |
| 26 | `/learning/java-tutorial/garbage-collector` | 148 | 212 | index | 0.03 |
| 27 | `/learning/java-tutorial/arithmetic-operators` | 149 | 215 | index | 0.04 |
| 28 | `/learning/java-tutorial/break` | 150 | 186 | index | 0.04 |
| 29 | `/learning/java-tutorial/constants` | 151 | 185 | index | 0.04 |
| 30 | `/learning/java-tutorial/linkedhashmap` | 151 | 188 | index | 0.05 |
| 31 | `/learning/java-tutorial/set` | 151 | 188 | index | 0.04 |
| 32 | `/learning/java-tutorial/java-coding-standards` | 151 | 205 | index | 0.04 |
| 33 | `/learning/java-tutorial/one-dimensional-array` | 151 | 208 | index | 0.05 |
| 34 | `/learning/java-tutorial/relational-operators` | 151 | 216 | index | 0.04 |
| 35 | `/learning/java-tutorial/list` | 152 | 194 | index | 0.04 |
| 36 | `/learning/java-tutorial/assignment-operators` | 152 | 214 | index | 0.04 |
| 37 | `/learning/java-tutorial/method-references` | 153 | 183 | index | 0.04 |
| 38 | `/learning/java-tutorial/treeset` | 153 | 187 | index | 0.05 |
| 39 | `/learning/java-tutorial/hashmap` | 153 | 190 | index | 0.02 |
| 40 | `/learning/java-tutorial/return` | 153 | 192 | index | 0.04 |
| 41 | `/learning/java-tutorial/super-keyword` | 153 | 195 | index | 0.04 |
| 42 | `/learning/java-tutorial/deserialization` | 153 | 218 | index | 0.01 |
| 43 | `/learning/java-tutorial/nested-loops` | 153 | 224 | index | 0.04 |
| 44 | `/learning/java-tutorial/crud-operations` | 154 | 231 | index | 0.03 |
| 45 | `/learning/java-tutorial/throws` | 155 | 197 | index | 0.04 |
| 46 | `/learning/java-tutorial/clean-code-basics` | 155 | 198 | index | 0.04 |
| 47 | `/learning/java-tutorial/arraylist` | 156 | 188 | index | 0.04 |
| 48 | `/learning/java-tutorial/database-connection` | 156 | 205 | index | 0.03 |
| 49 | `/learning/java-tutorial/custom-exceptions` | 156 | 220 | index | 0.04 |
| 50 | `/learning/java-tutorial/for-loop` | 157 | 195 | index | 0.05 |
| 51 | `/learning/java-tutorial/thread-methods` | 157 | 201 | index | 0.04 |
| 52 | `/learning/java-tutorial/reader-and-writer` | 157 | 218 | index | 0.03 |
| 53 | `/learning/java-tutorial/preparedstatement` | 158 | 219 | index | 0.02 |
| 54 | `/learning/java-tutorial/regular-expressions` | 159 | 195 | index | 0.04 |
| 55 | `/learning/java-tutorial/functional-interfaces` | 159 | 201 | index | 0.04 |
| 56 | `/learning/java-tutorial/comparable` | 159 | 238 | index | 0.03 |
| 57 | `/learning/java-tutorial/string` | 160 | 185 | index | 0.04 |
| 58 | `/learning/java-tutorial/object` | 160 | 192 | index | 0.04 |
| 59 | `/learning/java-tutorial/nested-if` | 160 | 209 | index | 0.04 |
| 60 | `/learning/java-tutorial/runnable` | 160 | 211 | index | 0.03 |
| 61 | `/learning/java-tutorial/serialization` | 160 | 229 | index | 0.03 |
| 62 | `/learning/java-tutorial/if-statement` | 161 | 192 | index | 0.05 |
| 63 | `/learning/java-tutorial/do-while-loop` | 161 | 197 | index | 0.05 |
| 64 | `/learning/java-tutorial/multidimensional-arrays` | 161 | 199 | index | 0.04 |
| 65 | `/learning/java-tutorial/finally` | 161 | 202 | index | 0.03 |
| 66 | `/learning/java-tutorial/inputstream-and-outputstream` | 161 | 215 | index | 0.04 |
| 67 | `/learning/java-tutorial/types-of-inheritance` | 161 | 236 | index | 0.01 |
| 68 | `/learning/java-tutorial/first-java-program` | 162 | 193 | index | 0.04 |
| 69 | `/learning/java-tutorial/string-methods` | 162 | 205 | index | 0.04 |
| 70 | `/learning/java-tutorial/statement` | 162 | 215 | index | 0.02 |
| 71 | `/learning/java-tutorial/abstract-class` | 162 | 223 | index | 0.04 |
| 72 | `/learning/java-tutorial/this-keyword` | 163 | 199 | index | 0.04 |
| 73 | `/learning/java-tutorial/stream-api` | 163 | 211 | index | 0.05 |
| 74 | `/learning/java-tutorial/interface` | 163 | 215 | index | 0.04 |
| 75 | `/learning/java-tutorial/callable-and-future` | 163 | 217 | index | 0.03 |
| 76 | `/learning/java-tutorial/optional` | 164 | 200 | index | 0.04 |
| 77 | `/learning/java-tutorial/try-catch` | 164 | 203 | index | 0.04 |
| 78 | `/learning/java-tutorial/switch` | 164 | 215 | index | 0.04 |
| 79 | `/learning/java-tutorial/packages` | 165 | 189 | index | 0.04 |
| 80 | `/learning/java-tutorial/ternary-operator` | 165 | 194 | index | 0.05 |
| 81 | `/learning/java-tutorial/arrays` | 165 | 203 | index | 0.04 |
| 82 | `/learning/java-tutorial/constructors` | 165 | 207 | index | 0.03 |
| 83 | `/learning/java-tutorial/access-modifiers` | 165 | 211 | index | 0.03 |
| 84 | `/learning/java-tutorial/jdbc` | 165 | 212 | index | 0.02 |
| 85 | `/learning/java-tutorial/wrapper-classes` | 165 | 214 | index | 0.03 |
| 86 | `/learning/java-tutorial/class-loading` | 165 | 236 | index | 0.04 |
| 87 | `/learning/java-tutorial/stringbuffer` | 166 | 198 | index | 0.04 |
| 88 | `/learning/java-tutorial/executor-framework` | 166 | 209 | index | 0.04 |
| 89 | `/learning/java-tutorial/polymorphism` | 166 | 222 | index | 0.04 |
| 90 | `/learning/java-tutorial/thread-lifecycle` | 166 | 225 | index | 0.03 |
| 91 | `/learning/java-tutorial/methods` | 167 | 203 | index | 0.04 |
| 92 | `/learning/java-tutorial/import` | 167 | 210 | index | 0.03 |
| 93 | `/learning/java-tutorial/comparator` | 168 | 247 | index | 0.03 |
| 94 | `/learning/java-tutorial/variables` | 169 | 198 | index | 0.04 |
| 95 | `/learning/java-tutorial/enum` | 170 | 201 | index | 0.03 |
| 96 | `/learning/java-tutorial/stack` | 170 | 220 | index | 0.04 |
| 97 | `/learning/java-tutorial/exception-handling-best-practices` | 170 | 223 | index | 0.04 |
| 98 | `/learning/java-tutorial/bitwise-operators` | 170 | 247 | index | 0.04 |
| 99 | `/learning/java-tutorial/stringbuilder` | 171 | 203 | index | 0.03 |
| 100 | `/learning/java-tutorial/lambda-expressions` | 171 | 204 | index | 0.03 |
| 101 | `/learning/java-tutorial/collection-framework` | 171 | 206 | index | 0.04 |
| 102 | `/learning/java-tutorial/comments` | 171 | 221 | index | 0.03 |
| 103 | `/learning/java-tutorial/method-overriding` | 172 | 218 | index | 0.04 |
| 104 | `/learning/java-tutorial/generics` | 172 | 222 | index | 0.04 |
| 105 | `/learning/java-tutorial/else-if` | 172 | 240 | index | 0.04 |
| 106 | `/learning/java-tutorial/synchronization` | 172 | 241 | index | 0.04 |
| 107 | `/learning/java-tutorial/common-java-mistakes` | 173 | 239 | index | 0.03 |
| 108 | `/learning/java-tutorial/while-loop` | 174 | 215 | index | 0.04 |
| 109 | `/learning/java-tutorial/heap` | 174 | 216 | index | 0.04 |
| 110 | `/learning/java-tutorial/method-overloading` | 174 | 233 | index | 0.04 |
| 111 | `/learning/java-tutorial/iterator` | 175 | 218 | index | 0.03 |
| 112 | `/learning/java-tutorial/user-input` | 175 | 226 | index | 0.03 |
| 113 | `/learning/java-tutorial/encapsulation` | 175 | 234 | index | 0.03 |
| 114 | `/learning/java-tutorial/static-keyword` | 176 | 216 | index | 0.04 |
| 115 | `/learning/java-tutorial/java-project-structure` | 176 | 217 | index | 0.04 |
| 116 | `/learning/java-tutorial/checked-vs-unchecked-exceptions` | 176 | 231 | index | 0.03 |
| 117 | `/learning/java-tutorial/linkedlist` | 178 | 209 | index | 0.04 |
| 118 | `/learning/java-tutorial/inheritance` | 178 | 227 | index | 0.04 |
| 119 | `/learning/java-tutorial/debugging` | 179 | 246 | index | 0.04 |
| 120 | `/learning/java-tutorial/transactions` | 181 | 261 | index | 0.03 |
| 121 | `/learning/java-tutorial/data-types` | 182 | 229 | index | 0.03 |
| 122 | `/learning/java-tutorial/class` | 183 | 218 | index | 0.04 |
| 123 | `/learning/java-tutorial/thread` | 183 | 226 | index | 0.04 |
| 124 | `/learning/java-tutorial/keywords-and-identifiers` | 183 | 230 | index | 0.04 |
| 125 | `/learning/java-tutorial/memory-management` | 183 | 233 | index | 0.03 |
| 126 | `/learning/java-tutorial/resultset` | 183 | 243 | index | 0.01 |
| 127 | `/learning/java-tutorial/date-and-time-api` | 184 | 223 | index | 0.02 |
| 128 | `/learning/java-tutorial/maven` | 184 | 225 | index | 0.01 |
| 129 | `/learning/java-tutorial/garbage-collection` | 186 | 249 | index | 0.02 |
| 130 | `/learning/java-tutorial/jvm-architecture` | 187 | 242 | index | 0.04 |
| 131 | `/learning/java-tutorial/type-casting` | 187 | 243 | index | 0.03 |
| 132 | `/learning/java-tutorial/file-handling` | 191 | 224 | index | 0.02 |
| 133 | `/learning/java-tutorial/string-pool` | 193 | 263 | index | 0.03 |
| 134 | `/learning/java-tutorial/deadlock` | 194 | 288 | index | 0.01 |
| 135 | `/learning/java-tutorial/jvm-interview-questions` | 250 | 250 | index | 0.01 |
| 136 | `/learning/java-tutorial/collections-interview-questions` | 270 | 270 | index | 0.01 |
| 137 | `/learning/java-tutorial/core-java-mcqs` | 273 | 273 | index | 0.00 |
| 138 | `/learning/java-tutorial/exception-handling-interview-questions` | 284 | 284 | index | 0.01 |
| 139 | `/learning/java-tutorial/multithreading-interview-questions` | 286 | 286 | index | 0.02 |
| 140 | `/learning/java-tutorial/interview-revision-notes` | 313 | 313 | index | 0.00 |
| 141 | `/learning/java-tutorial/oop-interview-questions` | 313 | 313 | index | 0.00 |
| 142 | `/learning/java-tutorial/java-program-structure` | 313 | 375 | index | 0.03 |
| 143 | `/learning/java-tutorial/how-java-works` | 323 | 387 | index | 0.02 |
| 144 | `/learning/java-tutorial/features-of-java` | 328 | 382 | index | 0.02 |
| 145 | `/learning/java-tutorial/installing-java` | 343 | 400 | index | 0.01 |
| 146 | `/learning/java-tutorial/introduction-to-java` | 366 | 424 | index | 0.02 |
| 147 | `/learning/java-tutorial/jdk-jre-and-jvm` | 368 | 419 | index | 0.03 |
| 148 | `/learning/java-tutorial/command-line-arguments` | 393 | 459 | index | 0.01 |
| 149 | `/learning/java-tutorial/core-java-interview-questions` | 394 | 394 | index | 0.01 |
| 150 | `/learning/java-tutorial/java-vs-c-c` | 413 | 463 | index | 0.02 |

</details>

<details><summary><b>Coding problems — AI/ML Notes (aiml-*)</b> — 196 pages under 600 prose words (0 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/coding-problems/aiml-confusion-matrix-2` | 55 | 77 | noindex | 0.12 |
| 2 | `/coding-problems/aiml-removing-duplicates-1` | 56 | 71 | noindex | 0.13 |
| 3 | `/coding-problems/aiml-hierarchical-clustering-1` | 57 | 79 | noindex | 0.08 |
| 4 | `/coding-problems/aiml-logistic-regression-2` | 60 | 80 | noindex | 0.14 |
| 5 | `/coding-problems/aiml-encoding-categorical-data-3` | 61 | 76 | noindex | 0.10 |
| 6 | `/coding-problems/aiml-accuracy-precision-recall-f1-score-4` | 62 | 70 | noindex | 0.07 |
| 7 | `/coding-problems/aiml-cross-validation-1` | 62 | 82 | noindex | 0.07 |
| 8 | `/coding-problems/aiml-feature-selection-1` | 62 | 91 | noindex | 0.07 |
| 9 | `/coding-problems/aiml-data-cleaning-2` | 63 | 73 | noindex | 0.07 |
| 10 | `/coding-problems/aiml-pandas-condensed-reference-1` | 63 | 77 | noindex | 0.07 |
| 11 | `/coding-problems/aiml-removing-duplicates-2` | 63 | 83 | noindex | 0.10 |
| 12 | `/coding-problems/aiml-functions-2` | 64 | 68 | noindex | 0.03 |
| 13 | `/coding-problems/aiml-feature-engineering-3` | 64 | 77 | noindex | 0.07 |
| 14 | `/coding-problems/aiml-numpy-condensed-reference-2` | 64 | 81 | noindex | 0.07 |
| 15 | `/coding-problems/aiml-pandas-condensed-reference-2` | 64 | 93 | noindex | 0.05 |
| 16 | `/coding-problems/aiml-confusion-matrix-1` | 65 | 83 | noindex | 0.07 |
| 17 | `/coding-problems/aiml-hierarchical-clustering-3` | 65 | 83 | noindex | 0.08 |
| 18 | `/coding-problems/aiml-matplotlib-condensed-reference-2` | 65 | 86 | noindex | 0.11 |
| 19 | `/coding-problems/aiml-naive-bayes-2` | 65 | 89 | noindex | 0.12 |
| 20 | `/coding-problems/aiml-functions-3` | 66 | 74 | noindex | 0.03 |
| 21 | `/coding-problems/aiml-dbscan-2` | 66 | 80 | noindex | 0.07 |
| 22 | `/coding-problems/aiml-linear-regression-3` | 66 | 83 | noindex | 0.11 |
| 23 | `/coding-problems/aiml-cross-validation-3` | 66 | 91 | noindex | 0.05 |
| 24 | `/coding-problems/aiml-feature-engineering-1` | 66 | 91 | noindex | 0.11 |
| 25 | `/coding-problems/aiml-ensemble-techniques-1` | 66 | 99 | noindex | 0.10 |
| 26 | `/coding-problems/aiml-scikit-learn-1` | 67 | 77 | noindex | 0.08 |
| 27 | `/coding-problems/aiml-linear-algebra-basics-2` | 67 | 80 | noindex | 0.05 |
| 28 | `/coding-problems/aiml-roc-auc-curve-2` | 67 | 82 | noindex | 0.08 |
| 29 | `/coding-problems/aiml-hierarchical-clustering-2` | 67 | 89 | noindex | 0.09 |
| 30 | `/coding-problems/aiml-python-basics-1` | 68 | 77 | noindex | 0.07 |
| 31 | `/coding-problems/aiml-k-means-clustering-3` | 68 | 80 | noindex | 0.07 |
| 32 | `/coding-problems/aiml-loading-datasets-2` | 68 | 82 | noindex | 0.06 |
| 33 | `/coding-problems/aiml-handling-missing-values-2` | 68 | 86 | noindex | 0.10 |
| 34 | `/coding-problems/aiml-linear-regression-2` | 68 | 88 | noindex | 0.12 |
| 35 | `/coding-problems/aiml-pca-principal-component-analysis-2` | 68 | 89 | noindex | 0.06 |
| 36 | `/coding-problems/aiml-linear-regression-4` | 68 | 93 | noindex | 0.08 |
| 37 | `/coding-problems/aiml-support-vector-machines-4` | 68 | 98 | noindex | 0.08 |
| 38 | `/coding-problems/aiml-seaborn-3` | 68 | 101 | noindex | 0.07 |
| 39 | `/coding-problems/aiml-ensemble-techniques-2` | 69 | 78 | noindex | 0.08 |
| 40 | `/coding-problems/aiml-basic-statistics-3` | 69 | 79 | noindex | 0.07 |
| 41 | `/coding-problems/aiml-handling-missing-values-1` | 69 | 85 | noindex | 0.07 |
| 42 | `/coding-problems/aiml-removing-duplicates-4` | 69 | 87 | noindex | 0.10 |
| 43 | `/coding-problems/aiml-feature-engineering-4` | 69 | 90 | noindex | 0.05 |
| 44 | `/coding-problems/aiml-seaborn-1` | 69 | 95 | noindex | 0.05 |
| 45 | `/coding-problems/aiml-seaborn-2` | 69 | 97 | noindex | 0.05 |
| 46 | `/coding-problems/aiml-scikit-learn-2` | 70 | 84 | noindex | 0.09 |
| 47 | `/coding-problems/aiml-feature-engineering-2` | 70 | 86 | noindex | 0.05 |
| 48 | `/coding-problems/aiml-numpy-condensed-reference-3` | 70 | 86 | noindex | 0.06 |
| 49 | `/coding-problems/aiml-naive-bayes-1` | 70 | 91 | noindex | 0.12 |
| 50 | `/coding-problems/aiml-feature-scaling-1` | 70 | 93 | noindex | 0.06 |
| 51 | `/coding-problems/aiml-decision-trees-4` | 70 | 103 | noindex | 0.08 |
| 52 | `/coding-problems/aiml-data-cleaning-1` | 71 | 79 | noindex | 0.08 |
| 53 | `/coding-problems/aiml-variables-data-types-loops-1` | 71 | 80 | noindex | 0.07 |
| 54 | `/coding-problems/aiml-numpy-condensed-reference-1` | 71 | 91 | noindex | 0.05 |
| 55 | `/coding-problems/aiml-oop-basics-1` | 71 | 91 | noindex | 0.02 |
| 56 | `/coding-problems/aiml-train-test-split-1` | 71 | 91 | noindex | 0.05 |
| 57 | `/coding-problems/aiml-regression-metrics-mae-mse-rmse-r-1` | 71 | 92 | noindex | 0.05 |
| 58 | `/coding-problems/aiml-regularization-l1-l2-3` | 71 | 93 | noindex | 0.07 |
| 59 | `/coding-problems/aiml-ensemble-techniques-3` | 71 | 94 | noindex | 0.07 |
| 60 | `/coding-problems/aiml-pandas-condensed-reference-3` | 71 | 101 | noindex | 0.07 |
| 61 | `/coding-problems/aiml-roc-auc-curve-1` | 71 | 103 | noindex | 0.11 |
| 62 | `/coding-problems/aiml-oop-basics-3` | 72 | 82 | noindex | 0.03 |
| 63 | `/coding-problems/aiml-train-test-split-2` | 72 | 82 | noindex | 0.06 |
| 64 | `/coding-problems/aiml-python-basics-2` | 72 | 84 | noindex | 0.07 |
| 65 | `/coding-problems/aiml-handling-missing-values-3` | 72 | 85 | noindex | 0.06 |
| 66 | `/coding-problems/aiml-pandas-2` | 72 | 90 | noindex | 0.08 |
| 67 | `/coding-problems/aiml-clustering-2` | 72 | 92 | noindex | 0.07 |
| 68 | `/coding-problems/aiml-decision-trees-1` | 72 | 93 | noindex | 0.10 |
| 69 | `/coding-problems/aiml-support-vector-machines-1` | 72 | 93 | noindex | 0.10 |
| 70 | `/coding-problems/aiml-confusion-matrix-4` | 72 | 104 | noindex | 0.05 |
| 71 | `/coding-problems/aiml-random-forest-1` | 72 | 105 | noindex | 0.10 |
| 72 | `/coding-problems/aiml-removing-duplicates-3` | 73 | 92 | noindex | 0.09 |
| 73 | `/coding-problems/aiml-cross-validation-4` | 73 | 93 | noindex | 0.06 |
| 74 | `/coding-problems/aiml-multiple-linear-regression-2` | 73 | 94 | noindex | 0.11 |
| 75 | `/coding-problems/aiml-pandas-condensed-reference-4` | 73 | 94 | noindex | 0.09 |
| 76 | `/coding-problems/aiml-functions-1` | 74 | 85 | noindex | 0.02 |
| 77 | `/coding-problems/aiml-numpy-1` | 74 | 90 | noindex | 0.04 |
| 78 | `/coding-problems/aiml-clustering-4` | 74 | 95 | noindex | 0.09 |
| 79 | `/coding-problems/aiml-k-nearest-neighbors-1` | 74 | 95 | noindex | 0.10 |
| 80 | `/coding-problems/aiml-accuracy-precision-recall-f1-score-1` | 74 | 96 | noindex | 0.05 |
| 81 | `/coding-problems/aiml-matplotlib-condensed-reference-3` | 74 | 96 | noindex | 0.10 |
| 82 | `/coding-problems/aiml-cross-validation-2` | 74 | 97 | noindex | 0.05 |
| 83 | `/coding-problems/aiml-support-vector-machines-3` | 74 | 108 | noindex | 0.09 |
| 84 | `/coding-problems/aiml-basic-statistics-1` | 75 | 86 | noindex | 0.06 |
| 85 | `/coding-problems/aiml-data-cleaning-4` | 75 | 91 | noindex | 0.07 |
| 86 | `/coding-problems/aiml-linear-regression-1` | 75 | 93 | noindex | 0.08 |
| 87 | `/coding-problems/aiml-loading-datasets-1` | 76 | 90 | noindex | 0.06 |
| 88 | `/coding-problems/aiml-overfitting-underfitting-2` | 76 | 90 | noindex | 0.07 |
| 89 | `/coding-problems/aiml-basic-statistics-2` | 76 | 91 | noindex | 0.06 |
| 90 | `/coding-problems/aiml-jupyter-notebook-3` | 76 | 92 | noindex | 0.02 |
| 91 | `/coding-problems/aiml-feature-scaling-2` | 76 | 97 | noindex | 0.05 |
| 92 | `/coding-problems/aiml-confusion-matrix-3` | 76 | 98 | noindex | 0.07 |
| 93 | `/coding-problems/aiml-encoding-categorical-data-1` | 76 | 102 | noindex | 0.07 |
| 94 | `/coding-problems/aiml-k-means-clustering-2` | 76 | 103 | noindex | 0.06 |
| 95 | `/coding-problems/aiml-seaborn-4` | 76 | 108 | noindex | 0.06 |
| 96 | `/coding-problems/aiml-outlier-detection-2` | 77 | 87 | noindex | 0.06 |
| 97 | `/coding-problems/aiml-regularization-l1-l2-1` | 77 | 90 | noindex | 0.07 |
| 98 | `/coding-problems/aiml-dbscan-3` | 77 | 95 | noindex | 0.08 |
| 99 | `/coding-problems/aiml-hyperparameter-tuning-1` | 77 | 95 | noindex | 0.07 |
| 100 | `/coding-problems/aiml-overfitting-underfitting-1` | 77 | 95 | noindex | 0.07 |
| 101 | `/coding-problems/aiml-encoding-categorical-data-2` | 77 | 96 | noindex | 0.05 |
| 102 | `/coding-problems/aiml-feature-selection-3` | 77 | 97 | noindex | 0.05 |
| 103 | `/coding-problems/aiml-hyperparameter-tuning-2` | 77 | 99 | noindex | 0.06 |
| 104 | `/coding-problems/aiml-matplotlib-4` | 77 | 100 | noindex | 0.07 |
| 105 | `/coding-problems/aiml-random-forest-2` | 77 | 107 | noindex | 0.10 |
| 106 | `/coding-problems/aiml-k-means-clustering-1` | 77 | 110 | noindex | 0.06 |
| 107 | `/coding-problems/aiml-loading-datasets-3` | 78 | 86 | noindex | 0.06 |
| 108 | `/coding-problems/aiml-python-basics-3` | 78 | 87 | noindex | 0.07 |
| 109 | `/coding-problems/aiml-regression-metrics-mae-mse-rmse-r-2` | 78 | 92 | noindex | 0.06 |
| 110 | `/coding-problems/aiml-outlier-detection-1` | 78 | 94 | noindex | 0.05 |
| 111 | `/coding-problems/aiml-roc-auc-curve-3` | 78 | 96 | noindex | 0.05 |
| 112 | `/coding-problems/aiml-logistic-regression-4` | 78 | 101 | noindex | 0.11 |
| 113 | `/coding-problems/aiml-k-means-clustering-4` | 78 | 108 | noindex | 0.06 |
| 114 | `/coding-problems/aiml-naive-bayes-4` | 78 | 111 | noindex | 0.08 |
| 115 | `/coding-problems/aiml-k-nearest-neighbors-3` | 78 | 114 | noindex | 0.08 |
| 116 | `/coding-problems/aiml-decision-trees-3` | 79 | 86 | noindex | 0.06 |
| 117 | `/coding-problems/aiml-hyperparameter-tuning-4` | 79 | 96 | noindex | 0.06 |
| 118 | `/coding-problems/aiml-pca-principal-component-analysis-1` | 79 | 96 | noindex | 0.05 |
| 119 | `/coding-problems/aiml-feature-selection-2` | 79 | 99 | noindex | 0.05 |
| 120 | `/coding-problems/aiml-matplotlib-2` | 79 | 104 | noindex | 0.07 |
| 121 | `/coding-problems/aiml-roc-auc-curve-4` | 80 | 100 | noindex | 0.07 |
| 122 | `/coding-problems/aiml-support-vector-machines-2` | 80 | 113 | noindex | 0.08 |
| 123 | `/coding-problems/aiml-basic-statistics-4` | 81 | 91 | noindex | 0.06 |
| 124 | `/coding-problems/aiml-logistic-regression-3` | 81 | 95 | noindex | 0.08 |
| 125 | `/coding-problems/aiml-pandas-3` | 81 | 98 | noindex | 0.08 |
| 126 | `/coding-problems/aiml-outlier-detection-3` | 81 | 99 | noindex | 0.05 |
| 127 | `/coding-problems/aiml-regression-metrics-mae-mse-rmse-r-4` | 81 | 99 | noindex | 0.07 |
| 128 | `/coding-problems/aiml-accuracy-precision-recall-f1-score-2` | 81 | 103 | noindex | 0.05 |
| 129 | `/coding-problems/aiml-outlier-detection-4` | 81 | 104 | noindex | 0.07 |
| 130 | `/coding-problems/aiml-multiple-linear-regression-1` | 81 | 106 | noindex | 0.06 |
| 131 | `/coding-problems/aiml-probability-basics-2` | 82 | 91 | noindex | 0.06 |
| 132 | `/coding-problems/aiml-loading-datasets-4` | 82 | 94 | noindex | 0.05 |
| 133 | `/coding-problems/aiml-random-forest-3` | 82 | 94 | noindex | 0.08 |
| 134 | `/coding-problems/aiml-numpy-2` | 82 | 95 | noindex | 0.07 |
| 135 | `/coding-problems/aiml-scikit-learn-3` | 82 | 96 | noindex | 0.05 |
| 136 | `/coding-problems/aiml-ensemble-techniques-4` | 82 | 99 | noindex | 0.07 |
| 137 | `/coding-problems/aiml-pca-principal-component-analysis-3` | 82 | 100 | noindex | 0.05 |
| 138 | `/coding-problems/aiml-logistic-regression-1` | 82 | 104 | noindex | 0.10 |
| 139 | `/coding-problems/aiml-feature-scaling-4` | 82 | 108 | noindex | 0.04 |
| 140 | `/coding-problems/aiml-decision-trees-2` | 82 | 113 | noindex | 0.09 |
| 141 | `/coding-problems/aiml-variables-data-types-loops-3` | 83 | 94 | noindex | 0.05 |
| 142 | `/coding-problems/aiml-matplotlib-condensed-reference-1` | 83 | 115 | noindex | 0.06 |
| 143 | `/coding-problems/aiml-functions-4` | 84 | 92 | noindex | 0.02 |
| 144 | `/coding-problems/aiml-k-nearest-neighbors-4` | 84 | 104 | noindex | 0.05 |
| 145 | `/coding-problems/aiml-multiple-linear-regression-3` | 84 | 108 | noindex | 0.07 |
| 146 | `/coding-problems/aiml-dbscan-1` | 84 | 109 | noindex | 0.06 |
| 147 | `/coding-problems/aiml-matplotlib-condensed-reference-4` | 84 | 109 | noindex | 0.06 |
| 148 | `/coding-problems/aiml-pca-principal-component-analysis-4` | 84 | 111 | noindex | 0.04 |
| 149 | `/coding-problems/aiml-variables-data-types-loops-2` | 85 | 96 | noindex | 0.07 |
| 150 | `/coding-problems/aiml-encoding-categorical-data-4` | 85 | 102 | noindex | 0.06 |
| 151 | `/coding-problems/aiml-scikit-learn-4` | 85 | 102 | noindex | 0.07 |
| 152 | `/coding-problems/aiml-clustering-1` | 85 | 112 | noindex | 0.07 |
| 153 | `/coding-problems/aiml-matplotlib-3` | 85 | 114 | noindex | 0.08 |
| 154 | `/coding-problems/aiml-random-forest-4` | 85 | 116 | noindex | 0.09 |
| 155 | `/coding-problems/aiml-probability-basics-1` | 86 | 94 | noindex | 0.05 |
| 156 | `/coding-problems/aiml-numpy-condensed-reference-4` | 86 | 105 | noindex | 0.04 |
| 157 | `/coding-problems/aiml-hierarchical-clustering-4` | 87 | 104 | noindex | 0.06 |
| 158 | `/coding-problems/aiml-bias-variance-tradeoff-1` | 87 | 106 | noindex | 0.06 |
| 159 | `/coding-problems/aiml-multiple-linear-regression-4` | 87 | 115 | noindex | 0.07 |
| 160 | `/coding-problems/aiml-k-nearest-neighbors-2` | 87 | 118 | noindex | 0.09 |
| 161 | `/coding-problems/aiml-data-cleaning-3` | 88 | 98 | noindex | 0.06 |
| 162 | `/coding-problems/aiml-clustering-3` | 88 | 113 | noindex | 0.05 |
| 163 | `/coding-problems/aiml-train-test-split-4` | 88 | 113 | noindex | 0.07 |
| 164 | `/coding-problems/aiml-hyperparameter-tuning-3` | 88 | 114 | noindex | 0.08 |
| 165 | `/coding-problems/aiml-matplotlib-1` | 88 | 121 | noindex | 0.04 |
| 166 | `/coding-problems/aiml-train-test-split-3` | 89 | 106 | noindex | 0.05 |
| 167 | `/coding-problems/aiml-regularization-l1-l2-2` | 89 | 108 | noindex | 0.07 |
| 168 | `/coding-problems/aiml-regularization-l1-l2-4` | 89 | 109 | noindex | 0.06 |
| 169 | `/coding-problems/aiml-overfitting-underfitting-3` | 89 | 114 | noindex | 0.04 |
| 170 | `/coding-problems/aiml-dbscan-4` | 89 | 116 | noindex | 0.07 |
| 171 | `/coding-problems/aiml-pandas-1` | 89 | 120 | noindex | 0.06 |
| 172 | `/coding-problems/aiml-bias-variance-tradeoff-3` | 89 | 122 | noindex | 0.05 |
| 173 | `/coding-problems/aiml-overfitting-underfitting-4` | 90 | 98 | noindex | 0.06 |
| 174 | `/coding-problems/aiml-regression-metrics-mae-mse-rmse-r-3` | 91 | 109 | noindex | 0.04 |
| 175 | `/coding-problems/aiml-linear-algebra-basics-1` | 91 | 113 | noindex | 0.04 |
| 176 | `/coding-problems/aiml-naive-bayes-3` | 91 | 129 | noindex | 0.04 |
| 177 | `/coding-problems/aiml-bias-variance-tradeoff-2` | 93 | 107 | noindex | 0.07 |
| 178 | `/coding-problems/aiml-numpy-4` | 95 | 111 | noindex | 0.06 |
| 179 | `/coding-problems/aiml-feature-selection-4` | 95 | 119 | noindex | 0.04 |
| 180 | `/coding-problems/aiml-numpy-3` | 95 | 126 | noindex | 0.08 |
| 181 | `/coding-problems/aiml-probability-basics-3` | 99 | 111 | noindex | 0.06 |
| 182 | `/coding-problems/aiml-probability-basics-4` | 99 | 113 | noindex | 0.05 |
| 183 | `/coding-problems/aiml-linear-algebra-basics-4` | 99 | 117 | noindex | 0.05 |
| 184 | `/coding-problems/aiml-jupyter-notebook-2` | 100 | 122 | noindex | 0.02 |
| 185 | `/coding-problems/aiml-oop-basics-4` | 101 | 111 | noindex | 0.02 |
| 186 | `/coding-problems/aiml-bias-variance-tradeoff-4` | 101 | 123 | noindex | 0.05 |
| 187 | `/coding-problems/aiml-handling-missing-values-4` | 101 | 124 | noindex | 0.04 |
| 188 | `/coding-problems/aiml-oop-basics-2` | 102 | 125 | noindex | 0.02 |
| 189 | `/coding-problems/aiml-pandas-4` | 102 | 130 | noindex | 0.06 |
| 190 | `/coding-problems/aiml-linear-algebra-basics-3` | 104 | 121 | noindex | 0.05 |
| 191 | `/coding-problems/aiml-jupyter-notebook-4` | 106 | 129 | noindex | 0.02 |
| 192 | `/coding-problems/aiml-accuracy-precision-recall-f1-score-3` | 106 | 140 | noindex | 0.04 |
| 193 | `/coding-problems/aiml-feature-scaling-3` | 107 | 134 | noindex | 0.04 |
| 194 | `/coding-problems/aiml-variables-data-types-loops-4` | 114 | 122 | noindex | 0.04 |
| 195 | `/coding-problems/aiml-python-basics-4` | 124 | 175 | noindex | 0.01 |
| 196 | `/coding-problems/aiml-jupyter-notebook-1` | 128 | 149 | noindex | 0.01 |

</details>

<details><summary><b>Coding problems — DBMS & SQL (SQL slugs)</b> — 52 pages under 600 prose words (52 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/coding-problems/enrolled-both-years` | 49 | 86 | index | 0.04 |
| 2 | `/coding-problems/ever-enrolled` | 52 | 92 | index | 0.05 |
| 3 | `/coding-problems/mid-range-prices` | 54 | 133 | index | 0.20 |
| 4 | `/coding-problems/names-starting-with-pro` | 55 | 126 | index | 0.21 |
| 5 | `/coding-problems/electronics-or-books` | 59 | 140 | index | 0.19 |
| 6 | `/coding-problems/left-after-2025` | 61 | 98 | index | 0.04 |
| 7 | `/coding-problems/total-revenue-by-region` | 61 | 123 | index | 0.04 |
| 8 | `/coding-problems/high-revenue-regions-only` | 66 | 124 | index | 0.04 |
| 9 | `/coding-problems/revenue-by-region-and-product` | 66 | 138 | index | 0.04 |
| 10 | `/coding-problems/departments-with-no-employees` | 66 | 144 | index | 0.12 |
| 11 | `/coding-problems/remove-low-salary-employees` | 67 | 119 | index | 0.13 |
| 12 | `/coding-problems/stock-with-a-default` | 67 | 155 | index | 0.17 |
| 13 | `/coding-problems/uppercase-names-and-lengths` | 68 | 129 | index | 0.03 |
| 14 | `/coding-problems/add-two-numbers` | 69 | 75 | index | 0.14 |
| 15 | `/coding-problems/expensive-electronics` | 69 | 140 | index | 0.19 |
| 16 | `/coding-problems/every-employee-department-or-not` | 69 | 158 | index | 0.12 |
| 17 | `/coding-problems/sort-by-category-then-price-descending` | 71 | 165 | index | 0.07 |
| 18 | `/coding-problems/create-a-high-earners-view` | 72 | 124 | index | 0.15 |
| 19 | `/coding-problems/next-page-after-id-3` | 73 | 142 | index | 0.07 |
| 20 | `/coding-problems/print-hello-world` | 74 | 79 | index | 0.08 |
| 21 | `/coding-problems/order-summary-stats` | 74 | 126 | index | 0.03 |
| 22 | `/coding-problems/above-their-departments-average` | 74 | 133 | index | 0.13 |
| 23 | `/coding-problems/selection-high-gpa-students` | 75 | 143 | index | 0.04 |
| 24 | `/coding-problems/employees-and-their-managers` | 75 | 164 | index | 0.10 |
| 25 | `/coding-problems/check-even-or-odd` | 76 | 80 | index | 0.14 |
| 26 | `/coding-problems/employees-with-real-departments` | 76 | 162 | index | 0.11 |
| 27 | `/coding-problems/top-3-most-expensive-products` | 77 | 149 | index | 0.07 |
| 28 | `/coding-problems/commit-a-fund-transfer` | 78 | 110 | index | 0.02 |
| 29 | `/coding-problems/engineering-team-by-salary` | 78 | 163 | index | 0.10 |
| 30 | `/coding-problems/price-tiers` | 79 | 167 | index | 0.16 |
| 31 | `/coding-problems/employees-missing-a-department` | 82 | 128 | index | 0.13 |
| 32 | `/coding-problems/copy-high-performers` | 82 | 140 | index | 0.10 |
| 33 | `/coding-problems/union-honors-or-deans-list` | 85 | 122 | index | 0.01 |
| 34 | `/coding-problems/departments-with-high-total-payroll` | 85 | 141 | index | 0.12 |
| 35 | `/coding-problems/departments-with-at-least-one-employee` | 85 | 165 | index | 0.11 |
| 36 | `/coding-problems/insert-a-new-employee` | 86 | 140 | index | 0.12 |
| 37 | `/coding-problems/create-a-department-summary-view` | 87 | 142 | index | 0.12 |
| 38 | `/coding-problems/rollback-a-failed-transfer` | 88 | 120 | index | 0.02 |
| 39 | `/coding-problems/employees-with-an-invalid-salary` | 89 | 137 | index | 0.13 |
| 40 | `/coding-problems/add-an-email-column` | 90 | 127 | index | 0.05 |
| 41 | `/coding-problems/orders-placed-in-march-2026` | 90 | 148 | index | 0.03 |
| 42 | `/coding-problems/natural-join-students-and-enrollments` | 91 | 157 | index | 0.03 |
| 43 | `/coding-problems/raise-engineering-salaries` | 94 | 148 | index | 0.10 |
| 44 | `/coding-problems/create-the-products-table` | 96 | 103 | index | 0.04 |
| 45 | `/coding-problems/duplicate-emails` | 96 | 195 | index | 0.05 |
| 46 | `/coding-problems/widget-vs-gadget-revenue-by-region` | 99 | 165 | index | 0.03 |
| 47 | `/coding-problems/correct-a-mistake-with-a-savepoint` | 100 | 132 | index | 0.02 |
| 48 | `/coding-problems/employees-with-no-real-department` | 104 | 204 | index | 0.05 |
| 49 | `/coding-problems/employees-without-a-manager` | 108 | 189 | index | 0.08 |
| 50 | `/coding-problems/average-salary-by-department` | 112 | 193 | index | 0.08 |
| 51 | `/coding-problems/duplicate-enrollments` | 117 | 168 | index | 0.01 |
| 52 | `/coding-problems/division-completed-all-required-courses` | 120 | 176 | index | 0.01 |

</details>

<details><summary><b>Coding problems — Generative AI (genai-*)</b> — 336 pages under 600 prose words (0 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/coding-problems/genai-apis-2` | 22 | 22 | noindex | 0.17 |
| 2 | `/coding-problems/genai-logging-1` | 22 | 22 | noindex | 0.17 |
| 3 | `/coding-problems/genai-monitoring-1` | 22 | 22 | noindex | 0.17 |
| 4 | `/coding-problems/genai-quantization-1` | 22 | 22 | noindex | 0.17 |
| 5 | `/coding-problems/genai-chroma-2` | 23 | 23 | noindex | 0.15 |
| 6 | `/coding-problems/genai-embeddings-2` | 23 | 23 | noindex | 0.15 |
| 7 | `/coding-problems/genai-faiss-2` | 23 | 23 | noindex | 0.15 |
| 8 | `/coding-problems/genai-pinecone-2` | 23 | 23 | noindex | 0.15 |
| 9 | `/coding-problems/genai-weaviate-2` | 23 | 23 | noindex | 0.15 |
| 10 | `/coding-problems/genai-apis-3` | 24 | 24 | noindex | 0.15 |
| 11 | `/coding-problems/genai-autoencoders-4` | 24 | 24 | noindex | 0.45 |
| 12 | `/coding-problems/genai-chroma-1` | 24 | 24 | noindex | 0.15 |
| 13 | `/coding-problems/genai-chroma-3` | 24 | 24 | noindex | 0.14 |
| 14 | `/coding-problems/genai-code-4` | 24 | 24 | noindex | 0.45 |
| 15 | `/coding-problems/genai-embeddings-1` | 24 | 24 | noindex | 0.15 |
| 16 | `/coding-problems/genai-embeddings-3` | 24 | 24 | noindex | 0.14 |
| 17 | `/coding-problems/genai-faiss-1` | 24 | 24 | noindex | 0.15 |
| 18 | `/coding-problems/genai-faiss-3` | 24 | 24 | noindex | 0.14 |
| 19 | `/coding-problems/genai-fine-tuning-4` | 24 | 24 | noindex | 0.39 |
| 20 | `/coding-problems/genai-llamaindex-4` | 24 | 24 | noindex | 0.45 |
| 21 | `/coding-problems/genai-logging-2` | 24 | 24 | noindex | 0.15 |
| 22 | `/coding-problems/genai-logging-4` | 24 | 24 | noindex | 0.15 |
| 23 | `/coding-problems/genai-lora-4` | 24 | 24 | noindex | 0.45 |
| 24 | `/coding-problems/genai-monitoring-2` | 24 | 24 | noindex | 0.15 |
| 25 | `/coding-problems/genai-monitoring-4` | 24 | 24 | noindex | 0.15 |
| 26 | `/coding-problems/genai-pinecone-1` | 24 | 24 | noindex | 0.15 |
| 27 | `/coding-problems/genai-pinecone-3` | 24 | 24 | noindex | 0.14 |
| 28 | `/coding-problems/genai-qlora-4` | 24 | 24 | noindex | 0.45 |
| 29 | `/coding-problems/genai-quantization-2` | 24 | 24 | noindex | 0.15 |
| 30 | `/coding-problems/genai-quantization-4` | 24 | 24 | noindex | 0.15 |
| 31 | `/coding-problems/genai-weaviate-1` | 24 | 24 | noindex | 0.15 |
| 32 | `/coding-problems/genai-weaviate-3` | 24 | 24 | noindex | 0.14 |
| 33 | `/coding-problems/genai-autoencoders-3` | 25 | 25 | noindex | 0.48 |
| 34 | `/coding-problems/genai-chroma-4` | 25 | 25 | noindex | 0.14 |
| 35 | `/coding-problems/genai-cloud-deployment-1` | 25 | 25 | noindex | 0.14 |
| 36 | `/coding-problems/genai-code-3` | 25 | 25 | noindex | 0.48 |
| 37 | `/coding-problems/genai-docker-basics-1` | 25 | 25 | noindex | 0.14 |
| 38 | `/coding-problems/genai-embeddings-4` | 25 | 25 | noindex | 0.14 |
| 39 | `/coding-problems/genai-faiss-4` | 25 | 25 | noindex | 0.14 |
| 40 | `/coding-problems/genai-few-shot-prompting-2` | 25 | 25 | noindex | 0.35 |
| 41 | `/coding-problems/genai-fine-tuning-3` | 25 | 25 | noindex | 0.42 |
| 42 | `/coding-problems/genai-image-prompting-2` | 25 | 25 | noindex | 0.39 |
| 43 | `/coding-problems/genai-json-prompting-2` | 25 | 25 | noindex | 0.39 |
| 44 | `/coding-problems/genai-latency-optimization-1` | 25 | 25 | noindex | 0.14 |
| 45 | `/coding-problems/genai-llamaindex-3` | 25 | 25 | noindex | 0.48 |
| 46 | `/coding-problems/genai-lora-3` | 25 | 25 | noindex | 0.48 |
| 47 | `/coding-problems/genai-model-deployment-1` | 25 | 25 | noindex | 0.19 |
| 48 | `/coding-problems/genai-model-inference-2` | 25 | 25 | noindex | 0.19 |
| 49 | `/coding-problems/genai-model-quantization-1` | 25 | 25 | noindex | 0.19 |
| 50 | `/coding-problems/genai-negative-prompts-2` | 25 | 25 | noindex | 0.39 |
| 51 | `/coding-problems/genai-one-shot-prompting-2` | 25 | 25 | noindex | 0.35 |
| 52 | `/coding-problems/genai-openai-compatible-apis-2` | 25 | 25 | noindex | 0.12 |
| 53 | `/coding-problems/genai-pinecone-4` | 25 | 25 | noindex | 0.14 |
| 54 | `/coding-problems/genai-prompt-injection-2` | 25 | 25 | noindex | 0.43 |
| 55 | `/coding-problems/genai-prompt-optimization-2` | 25 | 25 | noindex | 0.43 |
| 56 | `/coding-problems/genai-prompt-structure-2` | 25 | 25 | noindex | 0.43 |
| 57 | `/coding-problems/genai-prompt-templates-2` | 25 | 25 | noindex | 0.43 |
| 58 | `/coding-problems/genai-qlora-3` | 25 | 25 | noindex | 0.48 |
| 59 | `/coding-problems/genai-react-prompting-2` | 25 | 25 | noindex | 0.39 |
| 60 | `/coding-problems/genai-role-prompting-2` | 25 | 25 | noindex | 0.39 |
| 61 | `/coding-problems/genai-streaming-responses-2` | 25 | 25 | noindex | 0.14 |
| 62 | `/coding-problems/genai-structured-output-2` | 25 | 25 | noindex | 0.39 |
| 63 | `/coding-problems/genai-structured-outputs-2` | 25 | 25 | noindex | 0.39 |
| 64 | `/coding-problems/genai-weaviate-4` | 25 | 25 | noindex | 0.14 |
| 65 | `/coding-problems/genai-zero-shot-prompting-2` | 25 | 25 | noindex | 0.35 |
| 66 | `/coding-problems/genai-apis-4` | 26 | 26 | noindex | 0.14 |
| 67 | `/coding-problems/genai-autoencoders-2` | 26 | 26 | noindex | 0.50 |
| 68 | `/coding-problems/genai-code-2` | 26 | 26 | noindex | 0.50 |
| 69 | `/coding-problems/genai-embedding-generation-2` | 26 | 26 | noindex | 0.13 |
| 70 | `/coding-problems/genai-fine-tuning-2` | 26 | 26 | noindex | 0.44 |
| 71 | `/coding-problems/genai-llamaindex-2` | 26 | 26 | noindex | 0.50 |
| 72 | `/coding-problems/genai-logging-3` | 26 | 26 | noindex | 0.14 |
| 73 | `/coding-problems/genai-lora-2` | 26 | 26 | noindex | 0.50 |
| 74 | `/coding-problems/genai-monitoring-3` | 26 | 26 | noindex | 0.14 |
| 75 | `/coding-problems/genai-qlora-2` | 26 | 26 | noindex | 0.50 |
| 76 | `/coding-problems/genai-quantization-3` | 26 | 26 | noindex | 0.14 |
| 77 | `/coding-problems/genai-retrieval-4` | 26 | 26 | noindex | 0.14 |
| 78 | `/coding-problems/genai-text-embeddings-2` | 26 | 26 | noindex | 0.13 |
| 79 | `/coding-problems/genai-vector-databases-2` | 26 | 26 | noindex | 0.13 |
| 80 | `/coding-problems/genai-vector-search-2` | 26 | 26 | noindex | 0.13 |
| 81 | `/coding-problems/genai-cloud-deployment-2` | 27 | 27 | noindex | 0.13 |
| 82 | `/coding-problems/genai-cloud-deployment-4` | 27 | 27 | noindex | 0.13 |
| 83 | `/coding-problems/genai-diffusion-models-4` | 27 | 27 | noindex | 0.39 |
| 84 | `/coding-problems/genai-docker-basics-2` | 27 | 27 | noindex | 0.13 |
| 85 | `/coding-problems/genai-docker-basics-4` | 27 | 27 | noindex | 0.13 |
| 86 | `/coding-problems/genai-embedding-generation-1` | 27 | 27 | noindex | 0.13 |
| 87 | `/coding-problems/genai-embedding-generation-3` | 27 | 27 | noindex | 0.12 |
| 88 | `/coding-problems/genai-fine-tuning-concepts-4` | 27 | 27 | noindex | 0.35 |
| 89 | `/coding-problems/genai-full-fine-tuning-4` | 27 | 27 | noindex | 0.35 |
| 90 | `/coding-problems/genai-latency-optimization-2` | 27 | 27 | noindex | 0.13 |
| 91 | `/coding-problems/genai-latency-optimization-4` | 27 | 27 | noindex | 0.13 |
| 92 | `/coding-problems/genai-model-deployment-2` | 27 | 27 | noindex | 0.17 |
| 93 | `/coding-problems/genai-model-deployment-4` | 27 | 27 | noindex | 0.17 |
| 94 | `/coding-problems/genai-model-evaluation-4` | 27 | 27 | noindex | 0.43 |
| 95 | `/coding-problems/genai-model-inference-3` | 27 | 27 | noindex | 0.17 |
| 96 | `/coding-problems/genai-model-optimization-4` | 27 | 27 | noindex | 0.43 |
| 97 | `/coding-problems/genai-model-quantization-2` | 27 | 27 | noindex | 0.17 |
| 98 | `/coding-problems/genai-model-quantization-4` | 27 | 27 | noindex | 0.17 |
| 99 | `/coding-problems/genai-model-security-4` | 27 | 27 | noindex | 0.43 |
| 100 | `/coding-problems/genai-multimodal-models-4` | 27 | 27 | noindex | 0.39 |
| 101 | `/coding-problems/genai-openai-compatible-apis-3` | 27 | 27 | noindex | 0.12 |
| 102 | `/coding-problems/genai-parameter-efficient-fine-tuning-4` | 27 | 27 | noindex | 0.31 |
| 103 | `/coding-problems/genai-retrieval-3` | 27 | 27 | noindex | 0.13 |
| 104 | `/coding-problems/genai-sequence-to-sequence-models-4` | 27 | 27 | noindex | 0.31 |
| 105 | `/coding-problems/genai-streaming-responses-3` | 27 | 27 | noindex | 0.13 |
| 106 | `/coding-problems/genai-text-embeddings-1` | 27 | 27 | noindex | 0.13 |
| 107 | `/coding-problems/genai-text-embeddings-3` | 27 | 27 | noindex | 0.12 |
| 108 | `/coding-problems/genai-vector-databases-1` | 27 | 27 | noindex | 0.13 |
| 109 | `/coding-problems/genai-vector-databases-3` | 27 | 27 | noindex | 0.12 |
| 110 | `/coding-problems/genai-vector-search-1` | 27 | 27 | noindex | 0.13 |
| 111 | `/coding-problems/genai-vector-search-3` | 27 | 27 | noindex | 0.12 |
| 112 | `/coding-problems/genai-apis-1` | 28 | 28 | noindex | 0.17 |
| 113 | `/coding-problems/genai-authentication-api-keys-2` | 28 | 28 | noindex | 0.12 |
| 114 | `/coding-problems/genai-autoencoders-1` | 28 | 28 | noindex | 0.54 |
| 115 | `/coding-problems/genai-code-1` | 28 | 28 | noindex | 0.54 |
| 116 | `/coding-problems/genai-common-prompting-mistakes-2` | 28 | 28 | noindex | 0.35 |
| 117 | `/coding-problems/genai-diffusion-models-3` | 28 | 28 | noindex | 0.42 |
| 118 | `/coding-problems/genai-embedding-generation-4` | 28 | 28 | noindex | 0.12 |
| 119 | `/coding-problems/genai-few-shot-prompting-3` | 28 | 28 | noindex | 0.37 |
| 120 | `/coding-problems/genai-fine-tuning-1` | 28 | 28 | noindex | 0.48 |
| 121 | `/coding-problems/genai-fine-tuning-concepts-3` | 28 | 28 | noindex | 0.37 |
| 122 | `/coding-problems/genai-full-fine-tuning-3` | 28 | 28 | noindex | 0.37 |
| 123 | `/coding-problems/genai-image-prompting-3` | 28 | 28 | noindex | 0.42 |
| 124 | `/coding-problems/genai-json-prompting-3` | 28 | 28 | noindex | 0.42 |
| 125 | `/coding-problems/genai-langchain-1` | 28 | 28 | noindex | 0.12 |
| 126 | `/coding-problems/genai-langchain-2` | 28 | 28 | noindex | 0.12 |
| 127 | `/coding-problems/genai-langchain-3` | 28 | 28 | noindex | 0.12 |
| 128 | `/coding-problems/genai-langgraph-1` | 28 | 28 | noindex | 0.12 |
| 129 | `/coding-problems/genai-langgraph-2` | 28 | 28 | noindex | 0.12 |
| 130 | `/coding-problems/genai-langgraph-3` | 28 | 28 | noindex | 0.12 |
| 131 | `/coding-problems/genai-llamaindex-1` | 28 | 28 | noindex | 0.54 |
| 132 | `/coding-problems/genai-lora-1` | 28 | 28 | noindex | 0.54 |
| 133 | `/coding-problems/genai-model-evaluation-3` | 28 | 28 | noindex | 0.46 |
| 134 | `/coding-problems/genai-model-optimization-3` | 28 | 28 | noindex | 0.46 |
| 135 | `/coding-problems/genai-model-security-3` | 28 | 28 | noindex | 0.46 |
| 136 | `/coding-problems/genai-multimodal-models-3` | 28 | 28 | noindex | 0.42 |
| 137 | `/coding-problems/genai-negative-prompts-3` | 28 | 28 | noindex | 0.42 |
| 138 | `/coding-problems/genai-one-shot-prompting-3` | 28 | 28 | noindex | 0.37 |
| 139 | `/coding-problems/genai-parameter-efficient-fine-tuning-3` | 28 | 28 | noindex | 0.33 |
| 140 | `/coding-problems/genai-prompt-injection-3` | 28 | 28 | noindex | 0.46 |
| 141 | `/coding-problems/genai-prompt-optimization-3` | 28 | 28 | noindex | 0.46 |
| 142 | `/coding-problems/genai-prompt-structure-3` | 28 | 28 | noindex | 0.46 |
| 143 | `/coding-problems/genai-prompt-templates-3` | 28 | 28 | noindex | 0.46 |
| 144 | `/coding-problems/genai-qlora-1` | 28 | 28 | noindex | 0.54 |
| 145 | `/coding-problems/genai-react-prompting-3` | 28 | 28 | noindex | 0.42 |
| 146 | `/coding-problems/genai-role-prompting-3` | 28 | 28 | noindex | 0.42 |
| 147 | `/coding-problems/genai-sequence-to-sequence-models-3` | 28 | 28 | noindex | 0.33 |
| 148 | `/coding-problems/genai-structured-output-3` | 28 | 28 | noindex | 0.42 |
| 149 | `/coding-problems/genai-structured-outputs-3` | 28 | 28 | noindex | 0.42 |
| 150 | `/coding-problems/genai-text-embeddings-4` | 28 | 28 | noindex | 0.12 |
| 151 | `/coding-problems/genai-vector-databases-4` | 28 | 28 | noindex | 0.12 |
| 152 | `/coding-problems/genai-vector-search-4` | 28 | 28 | noindex | 0.12 |
| 153 | `/coding-problems/genai-zero-shot-prompting-3` | 28 | 28 | noindex | 0.37 |
| 154 | `/coding-problems/genai-advanced-rag-4` | 29 | 29 | noindex | 0.12 |
| 155 | `/coding-problems/genai-basic-rag-4` | 29 | 29 | noindex | 0.12 |
| 156 | `/coding-problems/genai-cloud-deployment-3` | 29 | 29 | noindex | 0.12 |
| 157 | `/coding-problems/genai-diffusion-models-2` | 29 | 29 | noindex | 0.44 |
| 158 | `/coding-problems/genai-docker-basics-3` | 29 | 29 | noindex | 0.12 |
| 159 | `/coding-problems/genai-few-shot-prompting-1` | 29 | 29 | noindex | 0.39 |
| 160 | `/coding-problems/genai-fine-tuning-concepts-2` | 29 | 29 | noindex | 0.39 |
| 161 | `/coding-problems/genai-full-fine-tuning-2` | 29 | 29 | noindex | 0.39 |
| 162 | `/coding-problems/genai-image-prompting-1` | 29 | 29 | noindex | 0.44 |
| 163 | `/coding-problems/genai-json-prompting-1` | 29 | 29 | noindex | 0.44 |
| 164 | `/coding-problems/genai-latency-optimization-3` | 29 | 29 | noindex | 0.12 |
| 165 | `/coding-problems/genai-model-deployment-3` | 29 | 29 | noindex | 0.16 |
| 166 | `/coding-problems/genai-model-evaluation-2` | 29 | 29 | noindex | 0.48 |
| 167 | `/coding-problems/genai-model-inference-4` | 29 | 29 | noindex | 0.16 |
| 168 | `/coding-problems/genai-model-optimization-2` | 29 | 29 | noindex | 0.48 |
| 169 | `/coding-problems/genai-model-quantization-3` | 29 | 29 | noindex | 0.16 |
| 170 | `/coding-problems/genai-model-security-2` | 29 | 29 | noindex | 0.48 |
| 171 | `/coding-problems/genai-multimodal-models-2` | 29 | 29 | noindex | 0.44 |
| 172 | `/coding-problems/genai-negative-prompts-1` | 29 | 29 | noindex | 0.44 |
| 173 | `/coding-problems/genai-one-shot-prompting-1` | 29 | 29 | noindex | 0.39 |
| 174 | `/coding-problems/genai-openai-compatible-apis-4` | 29 | 29 | noindex | 0.11 |
| 175 | `/coding-problems/genai-parameter-efficient-fine-tuning-2` | 29 | 29 | noindex | 0.35 |
| 176 | `/coding-problems/genai-prompt-injection-1` | 29 | 29 | noindex | 0.48 |
| 177 | `/coding-problems/genai-prompt-optimization-1` | 29 | 29 | noindex | 0.48 |
| 178 | `/coding-problems/genai-prompt-structure-1` | 29 | 29 | noindex | 0.48 |
| 179 | `/coding-problems/genai-prompt-templates-1` | 29 | 29 | noindex | 0.48 |
| 180 | `/coding-problems/genai-rag-architecture-4` | 29 | 29 | noindex | 0.12 |
| 181 | `/coding-problems/genai-rag-evaluation-4` | 29 | 29 | noindex | 0.12 |
| 182 | `/coding-problems/genai-react-prompting-1` | 29 | 29 | noindex | 0.44 |
| 183 | `/coding-problems/genai-retrieval-1` | 29 | 29 | noindex | 0.12 |
| 184 | `/coding-problems/genai-retrieval-2` | 29 | 29 | noindex | 0.12 |
| 185 | `/coding-problems/genai-role-prompting-1` | 29 | 29 | noindex | 0.44 |
| 186 | `/coding-problems/genai-sequence-to-sequence-models-2` | 29 | 29 | noindex | 0.35 |
| 187 | `/coding-problems/genai-streaming-responses-4` | 29 | 29 | noindex | 0.12 |
| 188 | `/coding-problems/genai-structured-output-1` | 29 | 29 | noindex | 0.44 |
| 189 | `/coding-problems/genai-structured-outputs-1` | 29 | 29 | noindex | 0.44 |
| 190 | `/coding-problems/genai-text-chunking-4` | 29 | 29 | noindex | 0.12 |
| 191 | `/coding-problems/genai-vector-storage-4` | 29 | 29 | noindex | 0.12 |
| 192 | `/coding-problems/genai-what-are-embeddings-2` | 29 | 29 | noindex | 0.15 |
| 193 | `/coding-problems/genai-zero-shot-prompting-1` | 29 | 29 | noindex | 0.39 |
| 194 | `/coding-problems/genai-advanced-rag-3` | 30 | 30 | noindex | 0.12 |
| 195 | `/coding-problems/genai-authentication-api-keys-3` | 30 | 30 | noindex | 0.12 |
| 196 | `/coding-problems/genai-basic-rag-3` | 30 | 30 | noindex | 0.12 |
| 197 | `/coding-problems/genai-encoder-and-decoder-4` | 30 | 30 | noindex | 0.35 |
| 198 | `/coding-problems/genai-langchain-4` | 30 | 30 | noindex | 0.12 |
| 199 | `/coding-problems/genai-langgraph-4` | 30 | 30 | noindex | 0.12 |
| 200 | `/coding-problems/genai-rag-architecture-3` | 30 | 30 | noindex | 0.12 |
| 201 | `/coding-problems/genai-rag-evaluation-3` | 30 | 30 | noindex | 0.12 |
| 202 | `/coding-problems/genai-text-chunking-3` | 30 | 30 | noindex | 0.12 |
| 203 | `/coding-problems/genai-variational-autoencoders-vae-4` | 30 | 30 | noindex | 0.35 |
| 204 | `/coding-problems/genai-vector-storage-3` | 30 | 30 | noindex | 0.12 |
| 205 | `/coding-problems/genai-what-are-embeddings-1` | 30 | 30 | noindex | 0.15 |
| 206 | `/coding-problems/genai-what-are-embeddings-3` | 30 | 30 | noindex | 0.15 |
| 207 | `/coding-problems/genai-agent-architecture-1` | 31 | 31 | noindex | 0.11 |
| 208 | `/coding-problems/genai-agent-architecture-2` | 31 | 31 | noindex | 0.11 |
| 209 | `/coding-problems/genai-agent-architecture-3` | 31 | 31 | noindex | 0.11 |
| 210 | `/coding-problems/genai-agent-evaluation-1` | 31 | 31 | noindex | 0.11 |
| 211 | `/coding-problems/genai-agent-evaluation-2` | 31 | 31 | noindex | 0.11 |
| 212 | `/coding-problems/genai-agent-evaluation-3` | 31 | 31 | noindex | 0.11 |
| 213 | `/coding-problems/genai-agent-workflows-1` | 31 | 31 | noindex | 0.11 |
| 214 | `/coding-problems/genai-agent-workflows-2` | 31 | 31 | noindex | 0.11 |
| 215 | `/coding-problems/genai-agent-workflows-3` | 31 | 31 | noindex | 0.11 |
| 216 | `/coding-problems/genai-apis-and-backend-integration-2` | 31 | 31 | noindex | 0.11 |
| 217 | `/coding-problems/genai-autonomous-agents-1` | 31 | 31 | noindex | 0.11 |
| 218 | `/coding-problems/genai-autonomous-agents-2` | 31 | 31 | noindex | 0.11 |
| 219 | `/coding-problems/genai-autonomous-agents-3` | 31 | 31 | noindex | 0.11 |
| 220 | `/coding-problems/genai-common-prompting-mistakes-3` | 31 | 31 | noindex | 0.37 |
| 221 | `/coding-problems/genai-crewai-concepts-1` | 31 | 31 | noindex | 0.11 |
| 222 | `/coding-problems/genai-crewai-concepts-2` | 31 | 31 | noindex | 0.11 |
| 223 | `/coding-problems/genai-crewai-concepts-3` | 31 | 31 | noindex | 0.11 |
| 224 | `/coding-problems/genai-diffusion-models-1` | 31 | 31 | noindex | 0.48 |
| 225 | `/coding-problems/genai-encoder-and-decoder-3` | 31 | 31 | noindex | 0.37 |
| 226 | `/coding-problems/genai-fine-tuning-concepts-1` | 31 | 31 | noindex | 0.43 |
| 227 | `/coding-problems/genai-full-fine-tuning-1` | 31 | 31 | noindex | 0.43 |
| 228 | `/coding-problems/genai-function-calling-1` | 31 | 31 | noindex | 0.11 |
| 229 | `/coding-problems/genai-function-calling-2` | 31 | 31 | noindex | 0.11 |
| 230 | `/coding-problems/genai-function-calling-3` | 31 | 31 | noindex | 0.11 |
| 231 | `/coding-problems/genai-gpu-vs-cpu-inference-2` | 31 | 31 | noindex | 0.11 |
| 232 | `/coding-problems/genai-model-evaluation-1` | 31 | 31 | noindex | 0.52 |
| 233 | `/coding-problems/genai-model-inference-1` | 31 | 31 | noindex | 0.18 |
| 234 | `/coding-problems/genai-model-optimization-1` | 31 | 31 | noindex | 0.52 |
| 235 | `/coding-problems/genai-model-security-1` | 31 | 31 | noindex | 0.52 |
| 236 | `/coding-problems/genai-multi-agent-systems-1` | 31 | 31 | noindex | 0.10 |
| 237 | `/coding-problems/genai-multi-agent-systems-2` | 31 | 31 | noindex | 0.10 |
| 238 | `/coding-problems/genai-multi-agent-systems-3` | 31 | 31 | noindex | 0.10 |
| 239 | `/coding-problems/genai-multimodal-models-1` | 31 | 31 | noindex | 0.48 |
| 240 | `/coding-problems/genai-openai-compatible-apis-1` | 31 | 31 | noindex | 0.13 |
| 241 | `/coding-problems/genai-parameter-efficient-fine-tuning-1` | 31 | 31 | noindex | 0.39 |
| 242 | `/coding-problems/genai-react-agents-1` | 31 | 31 | noindex | 0.11 |
| 243 | `/coding-problems/genai-react-agents-2` | 31 | 31 | noindex | 0.11 |
| 244 | `/coding-problems/genai-react-agents-3` | 31 | 31 | noindex | 0.11 |
| 245 | `/coding-problems/genai-sequence-to-sequence-models-1` | 31 | 31 | noindex | 0.39 |
| 246 | `/coding-problems/genai-streaming-responses-1` | 31 | 31 | noindex | 0.15 |
| 247 | `/coding-problems/genai-variational-autoencoders-vae-3` | 31 | 31 | noindex | 0.37 |
| 248 | `/coding-problems/genai-what-are-embeddings-4` | 31 | 31 | noindex | 0.15 |
| 249 | `/coding-problems/genai-what-is-prompt-engineering-2` | 31 | 31 | noindex | 0.34 |
| 250 | `/coding-problems/genai-advanced-rag-1` | 32 | 32 | noindex | 0.10 |
| 251 | `/coding-problems/genai-advanced-rag-2` | 32 | 32 | noindex | 0.11 |
| 252 | `/coding-problems/genai-authentication-api-keys-4` | 32 | 32 | noindex | 0.11 |
| 253 | `/coding-problems/genai-basic-rag-1` | 32 | 32 | noindex | 0.10 |
| 254 | `/coding-problems/genai-basic-rag-2` | 32 | 32 | noindex | 0.11 |
| 255 | `/coding-problems/genai-common-prompting-mistakes-1` | 32 | 32 | noindex | 0.39 |
| 256 | `/coding-problems/genai-encoder-and-decoder-2` | 32 | 32 | noindex | 0.39 |
| 257 | `/coding-problems/genai-few-shot-prompting-4` | 32 | 32 | noindex | 0.47 |
| 258 | `/coding-problems/genai-image-prompting-4` | 32 | 32 | noindex | 0.52 |
| 259 | `/coding-problems/genai-json-prompting-4` | 32 | 32 | noindex | 0.52 |
| 260 | `/coding-problems/genai-negative-prompts-4` | 32 | 32 | noindex | 0.52 |
| 261 | `/coding-problems/genai-one-shot-prompting-4` | 32 | 32 | noindex | 0.47 |
| 262 | `/coding-problems/genai-prompt-injection-4` | 32 | 32 | noindex | 0.55 |
| 263 | `/coding-problems/genai-prompt-optimization-4` | 32 | 32 | noindex | 0.55 |
| 264 | `/coding-problems/genai-prompt-structure-4` | 32 | 32 | noindex | 0.55 |
| 265 | `/coding-problems/genai-prompt-templates-4` | 32 | 32 | noindex | 0.55 |
| 266 | `/coding-problems/genai-rag-architecture-1` | 32 | 32 | noindex | 0.10 |
| 267 | `/coding-problems/genai-rag-architecture-2` | 32 | 32 | noindex | 0.11 |
| 268 | `/coding-problems/genai-rag-evaluation-1` | 32 | 32 | noindex | 0.10 |
| 269 | `/coding-problems/genai-rag-evaluation-2` | 32 | 32 | noindex | 0.11 |
| 270 | `/coding-problems/genai-rag-vs-fine-tuning-4` | 32 | 32 | noindex | 0.10 |
| 271 | `/coding-problems/genai-react-prompting-4` | 32 | 32 | noindex | 0.52 |
| 272 | `/coding-problems/genai-role-prompting-4` | 32 | 32 | noindex | 0.52 |
| 273 | `/coding-problems/genai-structured-output-4` | 32 | 32 | noindex | 0.52 |
| 274 | `/coding-problems/genai-structured-outputs-4` | 32 | 32 | noindex | 0.52 |
| 275 | `/coding-problems/genai-text-chunking-1` | 32 | 32 | noindex | 0.10 |
| 276 | `/coding-problems/genai-text-chunking-2` | 32 | 32 | noindex | 0.11 |
| 277 | `/coding-problems/genai-variational-autoencoders-vae-2` | 32 | 32 | noindex | 0.39 |
| 278 | `/coding-problems/genai-vector-storage-1` | 32 | 32 | noindex | 0.10 |
| 279 | `/coding-problems/genai-vector-storage-2` | 32 | 32 | noindex | 0.11 |
| 280 | `/coding-problems/genai-what-is-rag-4` | 32 | 32 | noindex | 0.14 |
| 281 | `/coding-problems/genai-zero-shot-prompting-4` | 32 | 32 | noindex | 0.47 |
| 282 | `/coding-problems/genai-agent-architecture-4` | 33 | 33 | noindex | 0.10 |
| 283 | `/coding-problems/genai-agent-evaluation-4` | 33 | 33 | noindex | 0.10 |
| 284 | `/coding-problems/genai-agent-workflows-4` | 33 | 33 | noindex | 0.10 |
| 285 | `/coding-problems/genai-apis-and-backend-integration-3` | 33 | 33 | noindex | 0.10 |
| 286 | `/coding-problems/genai-autonomous-agents-4` | 33 | 33 | noindex | 0.10 |
| 287 | `/coding-problems/genai-crewai-concepts-4` | 33 | 33 | noindex | 0.10 |
| 288 | `/coding-problems/genai-function-calling-4` | 33 | 33 | noindex | 0.10 |
| 289 | `/coding-problems/genai-generative-vs-discriminative-models-4` | 33 | 33 | noindex | 0.31 |
| 290 | `/coding-problems/genai-gpu-vs-cpu-inference-3` | 33 | 33 | noindex | 0.10 |
| 291 | `/coding-problems/genai-multi-agent-systems-4` | 33 | 33 | noindex | 0.09 |
| 292 | `/coding-problems/genai-python-for-generative-ai-3` | 33 | 33 | noindex | 0.10 |
| 293 | `/coding-problems/genai-rag-vs-fine-tuning-3` | 33 | 33 | noindex | 0.09 |
| 294 | `/coding-problems/genai-react-agents-4` | 33 | 33 | noindex | 0.10 |
| 295 | `/coding-problems/genai-what-is-rag-3` | 33 | 33 | noindex | 0.14 |
| 296 | `/coding-problems/genai-authentication-api-keys-1` | 34 | 34 | noindex | 0.13 |
| 297 | `/coding-problems/genai-encoder-and-decoder-1` | 34 | 34 | noindex | 0.43 |
| 298 | `/coding-problems/genai-generative-vs-discriminative-models-3` | 34 | 34 | noindex | 0.33 |
| 299 | `/coding-problems/genai-python-for-generative-ai-4` | 34 | 34 | noindex | 0.10 |
| 300 | `/coding-problems/genai-system-user-and-assistant-prompts-2` | 34 | 34 | noindex | 0.30 |
| 301 | `/coding-problems/genai-variational-autoencoders-vae-1` | 34 | 34 | noindex | 0.43 |
| 302 | `/coding-problems/genai-what-is-prompt-engineering-3` | 34 | 34 | noindex | 0.37 |
| 303 | `/coding-problems/genai-apis-and-backend-integration-4` | 35 | 35 | noindex | 0.10 |
| 304 | `/coding-problems/genai-common-prompting-mistakes-4` | 35 | 35 | noindex | 0.47 |
| 305 | `/coding-problems/genai-generative-vs-discriminative-models-2` | 35 | 35 | noindex | 0.35 |
| 306 | `/coding-problems/genai-gpu-vs-cpu-inference-4` | 35 | 35 | noindex | 0.10 |
| 307 | `/coding-problems/genai-python-for-generative-ai-2` | 35 | 35 | noindex | 0.10 |
| 308 | `/coding-problems/genai-rag-vs-fine-tuning-1` | 35 | 35 | noindex | 0.09 |
| 309 | `/coding-problems/genai-rag-vs-fine-tuning-2` | 35 | 35 | noindex | 0.09 |
| 310 | `/coding-problems/genai-what-is-prompt-engineering-1` | 35 | 35 | noindex | 0.39 |
| 311 | `/coding-problems/genai-what-is-rag-1` | 35 | 35 | noindex | 0.12 |
| 312 | `/coding-problems/genai-what-is-rag-2` | 35 | 35 | noindex | 0.13 |
| 313 | `/coding-problems/genai-why-rag-is-required-4` | 35 | 35 | noindex | 0.10 |
| 314 | `/coding-problems/genai-encoder-only-decoder-only-and-encoder-decoder-models-4` | 36 | 36 | noindex | 0.27 |
| 315 | `/coding-problems/genai-why-rag-is-required-3` | 36 | 36 | noindex | 0.09 |
| 316 | `/coding-problems/genai-apis-and-backend-integration-1` | 37 | 37 | noindex | 0.12 |
| 317 | `/coding-problems/genai-encoder-only-decoder-only-and-encoder-decoder-models-3` | 37 | 37 | noindex | 0.29 |
| 318 | `/coding-problems/genai-generative-vs-discriminative-models-1` | 37 | 37 | noindex | 0.39 |
| 319 | `/coding-problems/genai-gpu-vs-cpu-inference-1` | 37 | 37 | noindex | 0.12 |
| 320 | `/coding-problems/genai-system-user-and-assistant-prompts-3` | 37 | 37 | noindex | 0.32 |
| 321 | `/coding-problems/genai-tools-and-function-calling-1` | 37 | 37 | noindex | 0.09 |
| 322 | `/coding-problems/genai-tools-and-function-calling-2` | 37 | 37 | noindex | 0.09 |
| 323 | `/coding-problems/genai-tools-and-function-calling-3` | 37 | 37 | noindex | 0.09 |
| 324 | `/coding-problems/genai-encoder-only-decoder-only-and-encoder-decoder-models-2` | 38 | 38 | noindex | 0.31 |
| 325 | `/coding-problems/genai-system-user-and-assistant-prompts-1` | 38 | 38 | noindex | 0.34 |
| 326 | `/coding-problems/genai-what-is-prompt-engineering-4` | 38 | 38 | noindex | 0.46 |
| 327 | `/coding-problems/genai-why-rag-is-required-1` | 38 | 38 | noindex | 0.09 |
| 328 | `/coding-problems/genai-why-rag-is-required-2` | 38 | 38 | noindex | 0.09 |
| 329 | `/coding-problems/genai-python-for-generative-ai-1` | 39 | 39 | noindex | 0.09 |
| 330 | `/coding-problems/genai-tools-and-function-calling-4` | 39 | 39 | noindex | 0.09 |
| 331 | `/coding-problems/genai-encoder-only-decoder-only-and-encoder-decoder-models-1` | 40 | 40 | noindex | 0.35 |
| 332 | `/coding-problems/genai-what-is-an-ai-agent-1` | 40 | 40 | noindex | 0.12 |
| 333 | `/coding-problems/genai-what-is-an-ai-agent-2` | 40 | 40 | noindex | 0.12 |
| 334 | `/coding-problems/genai-what-is-an-ai-agent-3` | 40 | 40 | noindex | 0.11 |
| 335 | `/coding-problems/genai-system-user-and-assistant-prompts-4` | 41 | 41 | noindex | 0.42 |
| 336 | `/coding-problems/genai-what-is-an-ai-agent-4` | 42 | 42 | noindex | 0.11 |

</details>

<details><summary><b>Coding problems — Java Tutorial (java-*)</b> — 60 pages under 600 prose words (60 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/coding-problems/java-first-java-program-hello-two-lines` | 86 | 99 | index | 0.06 |
| 2 | `/coding-problems/java-unary-operators-negate` | 89 | 93 | index | 0.13 |
| 3 | `/coding-problems/java-user-input-echo-age` | 91 | 96 | index | 0.07 |
| 4 | `/coding-problems/java-ternary-operator-even-odd` | 93 | 97 | index | 0.12 |
| 5 | `/coding-problems/java-constants-weeks-to-days` | 94 | 96 | index | 0.08 |
| 6 | `/coding-problems/java-relational-operators-sign` | 98 | 102 | index | 0.11 |
| 7 | `/coding-problems/java-ternary-operator-pass-fail` | 98 | 102 | index | 0.10 |
| 8 | `/coding-problems/java-arithmetic-operators-five-results` | 98 | 123 | index | 0.05 |
| 9 | `/coding-problems/java-variables-rectangle-area` | 99 | 102 | index | 0.08 |
| 10 | `/coding-problems/java-relational-operators-compare-two` | 99 | 113 | index | 0.06 |
| 11 | `/coding-problems/java-arithmetic-operators-split-last-digit` | 100 | 103 | index | 0.07 |
| 12 | `/coding-problems/java-ternary-operator-max-ternary` | 100 | 106 | index | 0.10 |
| 13 | `/coding-problems/java-bitwise-operators-four-ops` | 100 | 124 | index | 0.06 |
| 14 | `/coding-problems/java-first-java-program-greet-user` | 101 | 104 | index | 0.06 |
| 15 | `/coding-problems/java-ternary-operator-abs-value` | 102 | 106 | index | 0.10 |
| 16 | `/coding-problems/java-logical-operators-login-check` | 103 | 109 | index | 0.06 |
| 17 | `/coding-problems/java-relational-operators-max-of-two` | 103 | 109 | index | 0.10 |
| 18 | `/coding-problems/java-variables-swap-values` | 103 | 109 | index | 0.06 |
| 19 | `/coding-problems/java-constants-seconds-in-days` | 107 | 109 | index | 0.06 |
| 20 | `/coding-problems/java-arithmetic-operators-seconds-to-hms` | 108 | 112 | index | 0.06 |
| 21 | `/coding-problems/java-first-java-program-print-sum` | 108 | 114 | index | 0.09 |
| 22 | `/coding-problems/java-data-types-primitive-ranges` | 108 | 127 | index | 0.04 |
| 23 | `/coding-problems/java-type-casting-code-to-char` | 110 | 114 | index | 0.09 |
| 24 | `/coding-problems/java-type-casting-truncate-to-int` | 111 | 115 | index | 0.09 |
| 25 | `/coding-problems/java-unary-operators-countdown` | 112 | 118 | index | 0.08 |
| 26 | `/coding-problems/java-variables-profile-string` | 112 | 118 | index | 0.06 |
| 27 | `/coding-problems/java-user-input-sum-n` | 113 | 118 | index | 0.08 |
| 28 | `/coding-problems/java-variables-running-total` | 114 | 119 | index | 0.05 |
| 29 | `/coding-problems/java-data-types-is-greater` | 114 | 120 | index | 0.10 |
| 30 | `/coding-problems/java-logical-operators-leap-year` | 116 | 121 | index | 0.09 |
| 31 | `/coding-problems/java-constants-price-with-tax` | 117 | 119 | index | 0.06 |
| 32 | `/coding-problems/java-bitwise-operators-xor-swap` | 117 | 123 | index | 0.06 |
| 33 | `/coding-problems/java-unary-operators-counter-sum` | 118 | 120 | index | 0.08 |
| 34 | `/coding-problems/java-type-casting-char-code` | 119 | 123 | index | 0.08 |
| 35 | `/coding-problems/java-user-input-read-mixed` | 119 | 125 | index | 0.06 |
| 36 | `/coding-problems/java-first-java-program-about-me` | 119 | 139 | index | 0.04 |
| 37 | `/coding-problems/java-bitwise-operators-kth-bit` | 120 | 126 | index | 0.08 |
| 38 | `/coding-problems/java-constants-circle-area` | 122 | 124 | index | 0.06 |
| 39 | `/coding-problems/java-logical-operators-exam-eligible` | 122 | 125 | index | 0.06 |
| 40 | `/coding-problems/java-user-input-name-age` | 123 | 129 | index | 0.06 |
| 41 | `/coding-problems/java-arithmetic-operators-average-two` | 124 | 127 | index | 0.05 |
| 42 | `/coding-problems/java-assignment-operators-running-bill` | 124 | 130 | index | 0.06 |
| 43 | `/coding-problems/java-logical-operators-de-morgan` | 125 | 129 | index | 0.05 |
| 44 | `/coding-problems/java-relational-operators-in-range` | 126 | 134 | index | 0.09 |
| 45 | `/coding-problems/java-keywords-and-identifiers-to-constant-case` | 127 | 129 | index | 0.05 |
| 46 | `/coding-problems/java-type-casting-parse-int-strings` | 127 | 130 | index | 0.05 |
| 47 | `/coding-problems/java-data-types-average-three` | 130 | 138 | index | 0.07 |
| 48 | `/coding-problems/java-comments-count-comment-lines` | 130 | 141 | index | 0.06 |
| 49 | `/coding-problems/java-keywords-and-identifiers-snake-to-camel` | 134 | 136 | index | 0.05 |
| 50 | `/coding-problems/java-assignment-operators-string-build` | 134 | 141 | index | 0.08 |
| 51 | `/coding-problems/java-data-types-print-mixed-types` | 138 | 146 | index | 0.04 |
| 52 | `/coding-problems/java-assignment-operators-apply-ops` | 140 | 149 | index | 0.04 |
| 53 | `/coding-problems/java-bitwise-operators-power-of-two` | 143 | 147 | index | 0.07 |
| 54 | `/coding-problems/java-unary-operators-pre-vs-post` | 143 | 152 | index | 0.04 |
| 55 | `/coding-problems/java-assignment-operators-double-until` | 145 | 149 | index | 0.06 |
| 56 | `/coding-problems/java-comments-remove-block-comment` | 159 | 168 | index | 0.04 |
| 57 | `/coding-problems/java-keywords-and-identifiers-count-keywords` | 167 | 172 | index | 0.04 |
| 58 | `/coding-problems/java-comments-javadoc-summary` | 168 | 185 | index | 0.05 |
| 59 | `/coding-problems/java-keywords-and-identifiers-is-valid-identifier` | 170 | 174 | index | 0.06 |
| 60 | `/coding-problems/java-comments-strip-line-comments` | 173 | 191 | index | 0.05 |

</details>

<details><summary><b>Coding problems — Python Tutorial (py-*)</b> — 98 pages under 600 prose words (98 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/coding-problems/py-regular-expressions-hashtag-extractor` | 129 | 136 | index | 0.06 |
| 2 | `/coding-problems/py-loops-multiplication-table-generator` | 137 | 178 | index | 0.04 |
| 3 | `/coding-problems/py-strings-vowel-counter` | 149 | 155 | index | 0.05 |
| 4 | `/coding-problems/py-conditionals-grade-calculator` | 153 | 156 | index | 0.04 |
| 5 | `/coding-problems/py-strings-palindrome-checker` | 157 | 162 | index | 0.04 |
| 6 | `/coding-problems/py-data-analysis-numpy-statistics` | 157 | 174 | index | 0.03 |
| 7 | `/coding-problems/py-web-scraping-extract-all-links` | 162 | 171 | index | 0.06 |
| 8 | `/coding-problems/py-conditionals-traffic-light-simulator` | 164 | 167 | index | 0.04 |
| 9 | `/coding-problems/py-loops-sum-of-digits` | 165 | 170 | index | 0.04 |
| 10 | `/coding-problems/py-regular-expressions-phone-number-validator` | 166 | 168 | index | 0.04 |
| 11 | `/coding-problems/py-modules-packages-age-calculator` | 167 | 171 | index | 0.04 |
| 12 | `/coding-problems/py-strings-anagram-checker` | 167 | 172 | index | 0.04 |
| 13 | `/coding-problems/py-intermediate-python-temperature-property-class` | 171 | 173 | index | 0.03 |
| 14 | `/coding-problems/py-machine-learning-pass-fail-classifier` | 171 | 174 | index | 0.03 |
| 15 | `/coding-problems/py-oop-rectangle-class` | 171 | 177 | index | 0.04 |
| 16 | `/coding-problems/py-strings-title-case-without-builtin` | 171 | 179 | index | 0.04 |
| 17 | `/coding-problems/py-security-signup-input-validation` | 173 | 177 | index | 0.03 |
| 18 | `/coding-problems/py-loops-star-pyramid-pattern` | 174 | 175 | index | 0.05 |
| 19 | `/coding-problems/py-regular-expressions-password-strength-validator` | 177 | 180 | index | 0.04 |
| 20 | `/coding-problems/py-ai-generative-ai-cosine-similarity-function` | 179 | 186 | index | 0.03 |
| 21 | `/coding-problems/py-regular-expressions-email-extractor` | 180 | 192 | index | 0.04 |
| 22 | `/coding-problems/py-advanced-python-decorator-with-functools-wraps` | 181 | 187 | index | 0.03 |
| 23 | `/coding-problems/py-database-programming-group-and-count-by-category` | 181 | 196 | index | 0.06 |
| 24 | `/coding-problems/py-advanced-python-generator-pipeline` | 183 | 191 | index | 0.05 |
| 25 | `/coding-problems/py-modules-packages-math-module-practice` | 183 | 191 | index | 0.04 |
| 26 | `/coding-problems/py-conditionals-triangle-type-classifier` | 184 | 189 | index | 0.04 |
| 27 | `/coding-problems/py-fundamentals-simple-interest-calculator` | 184 | 193 | index | 0.04 |
| 28 | `/coding-problems/py-deep-learning-mse-loss-from-scratch` | 185 | 192 | index | 0.04 |
| 29 | `/coding-problems/py-intermediate-python-sort-students-by-marks` | 185 | 198 | index | 0.06 |
| 30 | `/coding-problems/py-data-analysis-group-sales-by-region` | 186 | 197 | index | 0.06 |
| 31 | `/coding-problems/py-apis-http-status-code-classifier` | 188 | 191 | index | 0.03 |
| 32 | `/coding-problems/py-conditionals-leap-year-checker` | 190 | 196 | index | 0.04 |
| 33 | `/coding-problems/py-web-scraping-save-scraped-data-to-csv` | 190 | 203 | index | 0.05 |
| 34 | `/coding-problems/py-database-programming-products-table-crud` | 191 | 207 | index | 0.05 |
| 35 | `/coding-problems/py-advanced-python-custom-validating-descriptor` | 199 | 203 | index | 0.03 |
| 36 | `/coding-problems/py-machine-learning-train-test-split-linear-regression` | 200 | 202 | index | 0.04 |
| 37 | `/coding-problems/py-fundamentals-swap-two-numbers` | 200 | 214 | index | 0.03 |
| 38 | `/coding-problems/py-deep-learning-single-neuron-forward-pass` | 201 | 209 | index | 0.04 |
| 39 | `/coding-problems/py-web-scraping-extract-titles-from-html` | 201 | 212 | index | 0.05 |
| 40 | `/coding-problems/py-modules-packages-word-frequency-with-counter` | 202 | 214 | index | 0.03 |
| 41 | `/coding-problems/py-data-analysis-filter-and-sort-dataframe` | 202 | 218 | index | 0.05 |
| 42 | `/coding-problems/py-database-programming-join-students-and-enrollments` | 202 | 220 | index | 0.04 |
| 43 | `/coding-problems/py-exception-handling-safe-division-calculator` | 203 | 209 | index | 0.03 |
| 44 | `/coding-problems/py-security-password-hashing-verification` | 204 | 215 | index | 0.03 |
| 45 | `/coding-problems/py-datastructures-merge-two-dictionaries` | 205 | 219 | index | 0.03 |
| 46 | `/coding-problems/py-oop-employee-and-manager` | 206 | 209 | index | 0.03 |
| 47 | `/coding-problems/py-apis-http-build-a-rest-url` | 206 | 212 | index | 0.03 |
| 48 | `/coding-problems/py-machine-learning-decision-tree-vs-random-forest` | 206 | 214 | index | 0.03 |
| 49 | `/coding-problems/py-security-environment-variable-loader` | 207 | 209 | index | 0.03 |
| 50 | `/coding-problems/py-functions-flexible-sum-function` | 207 | 212 | index | 0.03 |
| 51 | `/coding-problems/py-concurrency-performance-parallel-square-calculation-multiprocessing` | 209 | 221 | index | 0.04 |
| 52 | `/coding-problems/py-ai-generative-ai-conversation-history-builder` | 209 | 229 | index | 0.03 |
| 53 | `/coding-problems/py-oop-abstract-shape-hierarchy` | 210 | 214 | index | 0.04 |
| 54 | `/coding-problems/py-database-programming-update-and-delete-by-id` | 210 | 226 | index | 0.05 |
| 55 | `/coding-problems/py-datastructures-word-frequency-counter` | 211 | 232 | index | 0.03 |
| 56 | `/coding-problems/py-automation-bulk-file-renamer` | 212 | 216 | index | 0.04 |
| 57 | `/coding-problems/py-file-handling-json-settings-saver` | 214 | 220 | index | 0.03 |
| 58 | `/coding-problems/py-file-handling-line-counter` | 214 | 221 | index | 0.05 |
| 59 | `/coding-problems/py-testing-fixture-based-list-tests` | 214 | 223 | index | 0.03 |
| 60 | `/coding-problems/py-automation-excel-report-from-a-list` | 214 | 225 | index | 0.04 |
| 61 | `/coding-problems/py-apis-http-first-5-titles-from-post-list` | 215 | 232 | index | 0.03 |
| 62 | `/coding-problems/py-functions-prime-checker-function` | 217 | 219 | index | 0.04 |
| 63 | `/coding-problems/py-loops-prime-number-checker` | 217 | 223 | index | 0.04 |
| 64 | `/coding-problems/py-data-analysis-average-marks-by-subject` | 217 | 239 | index | 0.05 |
| 65 | `/coding-problems/py-debugging-logging-logging-enhanced-divide-function` | 218 | 226 | index | 0.03 |
| 66 | `/coding-problems/py-testing-test-exception-raising` | 218 | 226 | index | 0.03 |
| 67 | `/coding-problems/py-testing-mocked-api-test` | 221 | 228 | index | 0.03 |
| 68 | `/coding-problems/py-functions-filter-and-transform-pipeline` | 222 | 231 | index | 0.04 |
| 69 | `/coding-problems/py-datastructures-common-and-unique-students` | 223 | 235 | index | 0.03 |
| 70 | `/coding-problems/py-automation-file-organizer-by-extension` | 224 | 234 | index | 0.04 |
| 71 | `/coding-problems/py-concurrency-performance-concurrent-async-tasks` | 225 | 230 | index | 0.04 |
| 72 | `/coding-problems/py-intermediate-python-even-number-generator` | 227 | 233 | index | 0.03 |
| 73 | `/coding-problems/py-apis-http-parse-github-style-response` | 229 | 234 | index | 0.02 |
| 74 | `/coding-problems/py-concurrency-performance-cache-slow-fibonacci-lru-cache` | 230 | 244 | index | 0.02 |
| 75 | `/coding-problems/py-fundamentals-temperature-converter` | 234 | 240 | index | 0.03 |
| 76 | `/coding-problems/py-exception-handling-custom-exception-negative-numbers` | 234 | 244 | index | 0.03 |
| 77 | `/coding-problems/py-web-scraping-paginated-title-collector` | 234 | 244 | index | 0.02 |
| 78 | `/coding-problems/py-ai-generative-ai-keyword-based-faq-matcher` | 235 | 279 | index | 0.04 |
| 79 | `/coding-problems/py-deep-learning-manual-max-pooling` | 237 | 257 | index | 0.02 |
| 80 | `/coding-problems/py-file-handling-csv-report-generator` | 238 | 256 | index | 0.02 |
| 81 | `/coding-problems/py-advanced-python-convert-class-to-dataclass` | 239 | 248 | index | 0.02 |
| 82 | `/coding-problems/py-testing-test-a-square-function` | 242 | 248 | index | 0.03 |
| 83 | `/coding-problems/py-functions-factorial-recursive-and-iterative` | 246 | 251 | index | 0.03 |
| 84 | `/coding-problems/py-concurrency-performance-concurrent-downloads-threading` | 247 | 252 | index | 0.03 |
| 85 | `/coding-problems/py-oop-encapsulated-bank-account` | 248 | 253 | index | 0.03 |
| 86 | `/coding-problems/py-file-handling-word-search-in-file` | 252 | 269 | index | 0.04 |
| 87 | `/coding-problems/py-fundamentals-personal-details-formatter` | 255 | 267 | index | 0.02 |
| 88 | `/coding-problems/py-datastructures-remove-duplicates-preserve-order` | 257 | 267 | index | 0.03 |
| 89 | `/coding-problems/py-deep-learning-activation-functions-from-scratch` | 266 | 278 | index | 0.03 |
| 90 | `/coding-problems/py-modules-packages-dice-roll-coverage` | 275 | 277 | index | 0.02 |
| 91 | `/coding-problems/py-ai-generative-ai-robust-llm-api-wrapper` | 279 | 285 | index | 0.02 |
| 92 | `/coding-problems/py-exception-handling-validated-age-input` | 279 | 289 | index | 0.02 |
| 93 | `/coding-problems/py-intermediate-python-call-counter-decorator` | 290 | 310 | index | 0.03 |
| 94 | `/coding-problems/py-exception-handling-multi-exception-file-reader` | 294 | 302 | index | 0.02 |
| 95 | `/coding-problems/py-machine-learning-customer-segmentation-kmeans` | 296 | 305 | index | 0.03 |
| 96 | `/coding-problems/py-security-jwt-creation-expiry-check` | 299 | 311 | index | 0.02 |
| 97 | `/coding-problems/py-debugging-logging-configured-file-logger` | 306 | 316 | index | 0.02 |
| 98 | `/coding-problems/py-automation-pdf-merger` | 317 | 323 | index | 0.02 |

</details>

<details><summary><b>Interview questions — Java</b> — 18 pages under 600 prose words (18 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/practice/interview-questions/java/rest-api` | 72 | 80 | index | 0.00 |
| 2 | `/practice/interview-questions/java/abstraction` | 86 | 107 | index | 0.00 |
| 3 | `/practice/interview-questions/java/spring-boot` | 129 | 153 | index | 0.03 |
| 4 | `/practice/interview-questions/java/abstract-classes` | 133 | 167 | index | 0.00 |
| 5 | `/practice/interview-questions/java/spring` | 134 | 160 | index | 0.00 |
| 6 | `/practice/interview-questions/java/jpa-hibernate` | 139 | 160 | index | 0.01 |
| 7 | `/practice/interview-questions/java/arrays` | 157 | 187 | index | 0.01 |
| 8 | `/practice/interview-questions/java/jdbc` | 179 | 205 | index | 0.01 |
| 9 | `/practice/interview-questions/java/encapsulation` | 180 | 219 | index | 0.00 |
| 10 | `/practice/interview-questions/java/interfaces` | 190 | 223 | index | 0.00 |
| 11 | `/practice/interview-questions/java/oop` | 228 | 249 | index | 0.00 |
| 12 | `/practice/interview-questions/java/inheritance` | 356 | 391 | index | 0.00 |
| 13 | `/practice/interview-questions/java/strings` | 363 | 443 | index | 0.00 |
| 14 | `/practice/interview-questions/java/constructors` | 366 | 406 | index | 0.00 |
| 15 | `/practice/interview-questions/java/generics` | 396 | 500 | index | 0.00 |
| 16 | `/practice/interview-questions/java/classes-objects` | 400 | 461 | index | 0.00 |
| 17 | `/practice/interview-questions/java/exception-handling` | 489 | 589 | index | 0.00 |
| 18 | `/practice/interview-questions/java/jvm` | 595 | 678 | index | 0.00 |

</details>

<details><summary><b>Interview questions — Python</b> — 14 pages under 600 prose words (14 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/practice/interview-questions/python/file-handling` | 143 | 178 | index | 0.00 |
| 2 | `/practice/interview-questions/python/runtime-internals` | 156 | 170 | index | 0.01 |
| 3 | `/practice/interview-questions/python/serialization` | 194 | 243 | index | 0.00 |
| 4 | `/practice/interview-questions/python/testing-tooling` | 292 | 360 | index | 0.00 |
| 5 | `/practice/interview-questions/python/basics` | 296 | 331 | index | 0.00 |
| 6 | `/practice/interview-questions/python/type-checking-abstract-classes` | 297 | 356 | index | 0.00 |
| 7 | `/practice/interview-questions/python/exception-handling` | 342 | 435 | index | 0.00 |
| 8 | `/practice/interview-questions/python/strings` | 362 | 433 | index | 0.00 |
| 9 | `/practice/interview-questions/python/modules-packages` | 405 | 484 | index | 0.00 |
| 10 | `/practice/interview-questions/python/concurrency` | 432 | 552 | index | 0.00 |
| 11 | `/practice/interview-questions/python/special-methods-operator-overloading` | 479 | 635 | index | 0.00 |
| 12 | `/practice/interview-questions/python/data-types-variables` | 489 | 585 | index | 0.00 |
| 13 | `/practice/interview-questions/python/typing-modern-syntax` | 522 | 681 | index | 0.00 |
| 14 | `/practice/interview-questions/python/iterators-generators-functional` | 588 | 770 | index | 0.00 |

</details>

<details><summary><b>Practice problems (/practice/problems)</b> — 150 pages under 600 prose words (150 indexable)</summary>

| # | URL | Prose | Incl. code | Status | tmpl |
|---|---|---|---|---|---|
| 1 | `/practice/problems/factorial-using-recursion` | 60 | 62 | index | 0.19 |
| 2 | `/practice/problems/greatest-common-divisor` | 64 | 67 | index | 0.14 |
| 3 | `/practice/problems/power-using-recursion` | 64 | 67 | index | 0.16 |
| 4 | `/practice/problems/count-set-bits` | 65 | 67 | index | 0.16 |
| 5 | `/practice/problems/fibonacci-number` | 67 | 69 | index | 0.18 |
| 6 | `/practice/problems/palindrome-number` | 70 | 72 | index | 0.20 |
| 7 | `/practice/problems/count-digits-and-digit-sum` | 70 | 75 | index | 0.14 |
| 8 | `/practice/problems/check-odd-or-even-using-bits` | 72 | 74 | index | 0.17 |
| 9 | `/practice/problems/integer-square-root` | 72 | 74 | index | 0.14 |
| 10 | `/practice/problems/maximum-subarray-sum` | 73 | 80 | index | 0.42 |
| 11 | `/practice/problems/least-common-multiple` | 75 | 78 | index | 0.12 |
| 12 | `/practice/problems/check-linked-list-palindrome` | 75 | 82 | index | 0.39 |
| 13 | `/practice/problems/find-the-smallest-element` | 75 | 82 | index | 0.39 |
| 14 | `/practice/problems/climbing-stairs` | 76 | 78 | index | 0.15 |
| 15 | `/practice/problems/find-the-largest-element` | 76 | 83 | index | 0.39 |
| 16 | `/practice/problems/zero-sum-subarray` | 76 | 83 | index | 0.44 |
| 17 | `/practice/problems/generate-balanced-parentheses` | 77 | 78 | index | 0.15 |
| 18 | `/practice/problems/check-prime-number` | 77 | 79 | index | 0.19 |
| 19 | `/practice/problems/remove-duplicate-characters` | 78 | 80 | index | 0.13 |
| 20 | `/practice/problems/reverse-a-string` | 78 | 80 | index | 0.14 |
| 21 | `/practice/problems/kth-smallest-element` | 78 | 87 | index | 0.33 |
| 22 | `/practice/problems/two-sum-exists` | 79 | 86 | index | 0.33 |
| 23 | `/practice/problems/connected-components` | 79 | 88 | index | 0.15 |
| 24 | `/practice/problems/kth-largest-element` | 79 | 88 | index | 0.33 |
| 25 | `/practice/problems/reverse-an-array` | 79 | 88 | index | 0.41 |
| 26 | `/practice/problems/k-largest-elements` | 79 | 90 | index | 0.39 |
| 27 | `/practice/problems/k-smallest-elements` | 79 | 90 | index | 0.39 |
| 28 | `/practice/problems/n-queens` | 80 | 82 | index | 0.14 |
| 29 | `/practice/problems/find-middle-node` | 81 | 88 | index | 0.33 |
| 30 | `/practice/problems/check-palindrome` | 82 | 84 | index | 0.17 |
| 31 | `/practice/problems/check-if-array-is-sorted` | 82 | 89 | index | 0.40 |
| 32 | `/practice/problems/balanced-parentheses` | 83 | 84 | index | 0.17 |
| 33 | `/practice/problems/longest-substring-without-repeating-characters` | 83 | 85 | index | 0.13 |
| 34 | `/practice/problems/find-duplicate-values` | 83 | 93 | index | 0.38 |
| 35 | `/practice/problems/generate-all-permutations` | 83 | 105 | index | 0.23 |
| 36 | `/practice/problems/maximum-product-of-two-elements` | 84 | 90 | index | 0.30 |
| 37 | `/practice/problems/linear-search` | 84 | 91 | index | 0.29 |
| 38 | `/practice/problems/pair-with-given-difference` | 84 | 93 | index | 0.32 |
| 39 | `/practice/problems/longest-increasing-subsequence` | 84 | 94 | index | 0.34 |
| 40 | `/practice/problems/create-and-traverse-linked-list` | 85 | 92 | index | 0.36 |
| 41 | `/practice/problems/house-robber` | 85 | 92 | index | 0.27 |
| 42 | `/practice/problems/count-occurrences-in-sorted-array` | 85 | 94 | index | 0.20 |
| 43 | `/practice/problems/remove-duplicates-from-sorted-linked-list` | 85 | 94 | index | 0.29 |
| 44 | `/practice/problems/first-non-repeating-character` | 86 | 88 | index | 0.11 |
| 45 | `/practice/problems/minimum-and-maximum-in-bst` | 86 | 98 | index | 0.25 |
| 46 | `/practice/problems/count-leaf-nodes` | 87 | 94 | index | 0.28 |
| 47 | `/practice/problems/find-the-unique-element` | 87 | 94 | index | 0.28 |
| 48 | `/practice/problems/longest-consecutive-sequence` | 87 | 95 | index | 0.36 |
| 49 | `/practice/problems/nth-node-from-end` | 87 | 95 | index | 0.26 |
| 50 | `/practice/problems/rotate-linked-list` | 87 | 99 | index | 0.31 |
| 51 | `/practice/problems/reverse-words-in-a-sentence` | 88 | 94 | index | 0.16 |
| 52 | `/practice/problems/detect-cycle-in-directed-graph` | 89 | 98 | index | 0.17 |
| 53 | `/practice/problems/check-anagram` | 90 | 93 | index | 0.15 |
| 54 | `/practice/problems/rotate-array-by-k` | 90 | 102 | index | 0.29 |
| 55 | `/practice/problems/longest-common-subsequence` | 91 | 94 | index | 0.10 |
| 56 | `/practice/problems/maximum-sum-of-k-consecutive-elements` | 91 | 100 | index | 0.30 |
| 57 | `/practice/problems/reverse-a-stack` | 91 | 100 | index | 0.29 |
| 58 | `/practice/problems/find-the-majority-element` | 92 | 97 | index | 0.27 |
| 59 | `/practice/problems/find-the-missing-number` | 92 | 98 | index | 0.20 |
| 60 | `/practice/problems/subarray-with-given-sum` | 92 | 101 | index | 0.22 |
| 61 | `/practice/problems/second-largest-element` | 93 | 100 | index | 0.25 |
| 62 | `/practice/problems/detect-cycle-in-undirected-graph` | 93 | 102 | index | 0.17 |
| 63 | `/practice/problems/merge-sort` | 93 | 104 | index | 0.34 |
| 64 | `/practice/problems/move-all-zeros-to-the-end` | 93 | 104 | index | 0.24 |
| 65 | `/practice/problems/binary-search` | 94 | 102 | index | 0.19 |
| 66 | `/practice/problems/maximum-in-every-window` | 94 | 110 | index | 0.29 |
| 67 | `/practice/problems/height-of-binary-tree` | 95 | 102 | index | 0.27 |
| 68 | `/practice/problems/tower-of-hanoi` | 95 | 102 | index | 0.10 |
| 69 | `/practice/problems/next-greater-element` | 95 | 104 | index | 0.35 |
| 70 | `/practice/problems/reverse-a-linked-list` | 95 | 104 | index | 0.23 |
| 71 | `/practice/problems/count-even-and-odd-numbers` | 96 | 106 | index | 0.30 |
| 72 | `/practice/problems/two-sum-in-sorted-array` | 96 | 106 | index | 0.22 |
| 73 | `/practice/problems/first-occurrence-in-sorted-array` | 97 | 105 | index | 0.18 |
| 74 | `/practice/problems/last-occurrence-in-sorted-array` | 98 | 106 | index | 0.19 |
| 75 | `/practice/problems/longest-subarray-with-sum-k` | 98 | 107 | index | 0.25 |
| 76 | `/practice/problems/kth-smallest-in-bst` | 98 | 108 | index | 0.24 |
| 77 | `/practice/problems/minimum-spanning-tree` | 98 | 116 | index | 0.12 |
| 78 | `/practice/problems/merge-k-sorted-arrays` | 98 | 120 | index | 0.17 |
| 79 | `/practice/problems/evaluate-postfix-expression` | 99 | 104 | index | 0.18 |
| 80 | `/practice/problems/diameter-of-binary-tree` | 99 | 106 | index | 0.25 |
| 81 | `/practice/problems/insert-at-beginning-of-linked-list` | 99 | 108 | index | 0.26 |
| 82 | `/practice/problems/selection-sort` | 99 | 110 | index | 0.33 |
| 83 | `/practice/problems/implement-max-heap` | 100 | 109 | index | 0.14 |
| 84 | `/practice/problems/quick-sort` | 100 | 113 | index | 0.31 |
| 85 | `/practice/problems/bubble-sort` | 101 | 110 | index | 0.32 |
| 86 | `/practice/problems/queue-using-two-stacks` | 101 | 110 | index | 0.14 |
| 87 | `/practice/problems/insertion-sort` | 101 | 112 | index | 0.31 |
| 88 | `/practice/problems/next-smaller-element` | 101 | 112 | index | 0.33 |
| 89 | `/practice/problems/count-vowels-and-consonants` | 102 | 108 | index | 0.11 |
| 90 | `/practice/problems/remove-duplicates-from-sorted-array` | 102 | 114 | index | 0.23 |
| 91 | `/practice/problems/remove-duplicates-two-pointers` | 102 | 114 | index | 0.22 |
| 92 | `/practice/problems/frequency-map` | 102 | 115 | index | 0.27 |
| 93 | `/practice/problems/sudoku-solver` | 102 | 264 | index | 0.03 |
| 94 | `/practice/problems/missing-number-using-xor` | 103 | 108 | index | 0.17 |
| 95 | `/practice/problems/insert-at-end-of-linked-list` | 103 | 112 | index | 0.25 |
| 96 | `/practice/problems/search-in-rotated-sorted-array` | 103 | 113 | index | 0.17 |
| 97 | `/practice/problems/check-balanced-binary-tree` | 104 | 113 | index | 0.26 |
| 98 | `/practice/problems/elements-more-than-n-over-k` | 104 | 113 | index | 0.27 |
| 99 | `/practice/problems/union-of-two-arrays` | 105 | 120 | index | 0.27 |
| 100 | `/practice/problems/subarray-with-equal-zeros-and-ones` | 106 | 114 | index | 0.20 |
| 101 | `/practice/problems/best-time-to-buy-and-sell-stock` | 107 | 115 | index | 0.21 |
| 102 | `/practice/problems/bfs-traversal` | 107 | 123 | index | 0.13 |
| 103 | `/practice/problems/character-frequency` | 108 | 115 | index | 0.09 |
| 104 | `/practice/problems/postorder-traversal` | 108 | 115 | index | 0.23 |
| 105 | `/practice/problems/boundary-traversal` | 109 | 124 | index | 0.24 |
| 106 | `/practice/problems/zigzag-level-order-traversal` | 110 | 123 | index | 0.19 |
| 107 | `/practice/problems/first-negative-in-every-window` | 110 | 126 | index | 0.25 |
| 108 | `/practice/problems/longest-common-prefix` | 111 | 116 | index | 0.12 |
| 109 | `/practice/problems/delete-node-by-value` | 111 | 120 | index | 0.19 |
| 110 | `/practice/problems/min-stack` | 111 | 120 | index | 0.12 |
| 111 | `/practice/problems/activity-selection` | 111 | 123 | index | 0.12 |
| 112 | `/practice/problems/minimum-number-of-coins` | 112 | 119 | index | 0.15 |
| 113 | `/practice/problems/product-of-array-except-self` | 112 | 121 | index | 0.20 |
| 114 | `/practice/problems/vertical-order-traversal` | 112 | 125 | index | 0.24 |
| 115 | `/practice/problems/dfs-traversal` | 112 | 128 | index | 0.13 |
| 116 | `/practice/problems/generate-all-subsets` | 113 | 120 | index | 0.22 |
| 117 | `/practice/problems/preorder-traversal` | 113 | 120 | index | 0.22 |
| 118 | `/practice/problems/search-in-bst` | 113 | 123 | index | 0.22 |
| 119 | `/practice/problems/common-elements-in-three-arrays` | 113 | 136 | index | 0.08 |
| 120 | `/practice/problems/maximum-path-sum-in-binary-tree` | 114 | 123 | index | 0.21 |
| 121 | `/practice/problems/level-order-traversal` | 115 | 128 | index | 0.20 |
| 122 | `/practice/problems/merge-overlapping-intervals` | 115 | 128 | index | 0.11 |
| 123 | `/practice/problems/group-anagrams` | 116 | 129 | index | 0.10 |
| 124 | `/practice/problems/implement-min-heap` | 117 | 126 | index | 0.13 |
| 125 | `/practice/problems/shortest-path-in-unweighted-graph` | 117 | 132 | index | 0.09 |
| 126 | `/practice/problems/check-identical-trees` | 118 | 127 | index | 0.14 |
| 127 | `/practice/problems/minimum-platforms` | 118 | 132 | index | 0.18 |
| 128 | `/practice/problems/graph-using-adjacency-list` | 118 | 136 | index | 0.09 |
| 129 | `/practice/problems/stack-using-two-queues` | 119 | 126 | index | 0.12 |
| 130 | `/practice/problems/intersection-of-two-arrays` | 119 | 131 | index | 0.22 |
| 131 | `/practice/problems/zero-one-knapsack` | 120 | 129 | index | 0.17 |
| 132 | `/practice/problems/rat-in-a-maze` | 121 | 132 | index | 0.14 |
| 133 | `/practice/problems/merge-two-sorted-linked-lists` | 123 | 137 | index | 0.21 |
| 134 | `/practice/problems/implement-queue` | 125 | 134 | index | 0.11 |
| 135 | `/practice/problems/serialize-and-deserialize-binary-tree` | 125 | 140 | index | 0.19 |
| 136 | `/practice/problems/fractional-knapsack` | 126 | 135 | index | 0.17 |
| 137 | `/practice/problems/job-sequencing-with-deadlines` | 127 | 139 | index | 0.10 |
| 138 | `/practice/problems/word-search-in-grid` | 130 | 137 | index | 0.13 |
| 139 | `/practice/problems/dijkstra-shortest-path` | 131 | 150 | index | 0.09 |
| 140 | `/practice/problems/implement-trie` | 132 | 141 | index | 0.10 |
| 141 | `/practice/problems/topological-sort` | 132 | 146 | index | 0.11 |
| 142 | `/practice/problems/inorder-traversal` | 133 | 141 | index | 0.18 |
| 143 | `/practice/problems/implement-stack` | 134 | 143 | index | 0.10 |
| 144 | `/practice/problems/lowest-common-ancestor` | 135 | 146 | index | 0.16 |
| 145 | `/practice/problems/detect-cycle-in-linked-list` | 137 | 144 | index | 0.18 |
| 146 | `/practice/problems/insert-into-bst` | 147 | 157 | index | 0.14 |
| 147 | `/practice/problems/remove-cycle-from-linked-list` | 147 | 157 | index | 0.17 |
| 148 | `/practice/problems/add-two-numbers-linked-lists` | 161 | 172 | index | 0.14 |
| 149 | `/practice/problems/intersection-point-of-two-linked-lists` | 161 | 174 | index | 0.09 |
| 150 | `/practice/problems/delete-from-bst` | 167 | 183 | index | 0.12 |

</details>

## (c) Templated page sets

| Cluster | Pages | Status today | Evidence | Recommendation |
|---|---|---|---|---|
| Generative AI lessons (`/learning/generative-ai/*`) | 207 (206 templated + 1 original) | 206 noindex, not in sitemap; `course-summary-and-project-roadmap` (original) indexable + in sitemap | 98.9% of all 21,321 lesson pairs ≥ 0.6 Jaccard (median 0.69); median 86% of each page's words are sentences repeated on ≥ 20 GenAI pages; 58 sentences appear on ≥ 100 pages (most on all 206) | Keep noindex (correct). Before rewriting, collapse the same-intent topics in (a)-A (≈ 7 fewer pages), then rewrite; lift noindex per-page only after the rewritten body no longer trips `isTemplatedGenerativeAiBody`. |
| GenAI coding problems (`/coding-problems/genai-<topic>-1..4`) | 336 (84 topics × 4) | noindex, not in sitemap | 32 distinct one-sentence templates with the topic name substituted (8 template families × 4 numbered prompts); median 29 words; no examples/constraints/starter code | Consolidate: one "Practice tasks" list on the lesson page instead of 4 separate URLs per topic, or keep as noindex app-only pages. Rewriting 336 of these as real problems is not a good use of effort. |
| AI/ML coding problems (`/coding-problems/aiml-<topic>-1..4`) | 196 (49 topics × 4) | noindex, not in sitemap | Not text-duplicates (title-masked median Jaccard 0.05 — each has its own short spec), but every one is thin (median 77 prose words) with empty examples/constraints/starter code, generic "Problem N: …" titles, and one duplicate title pair | Rewrite selectively (add examples + starter code, which also auto-lifts the noindex via `isThinCodingProblemRow`) for the ~20 highest-demand topics; leave the rest noindex. Fix the "Problem N:" title prefix. |
| Practice problems (`/practice/problems/*`) | 150 | indexable, in sitemap | Mean boilerplate share 0.21 (shared "Input Format / Output Format" phrasing); no pair above 0.65; all < 600 words (median 98 prose) | Not a template problem — a thinness problem. See action #2. |
| DBMS "revisits" pairs (algebra vs SQL) | 13 URLs in 6 title groups | indexable | Different text (Jaccard ≤ 0.02) but duplicate `<title>`/H1 | Retitle only (action #3). |

**Shared GenAI lesson template (sentences present on all 206 templated lessons, `{TOPIC}` = page title):**

```text
The important lesson is that the technique is a component of a larger system.
Suppose a student is building an AI learning assistant …
The application validates the request, prepares the model input, runs the relevant AI component, checks the returned structure, and displays the answer.
It then selects the smallest reasonable technique that can solve the problem reliably.
If the answer must be grounded in a supplied knowledge base, the application should retrieve supporting material rather than relying only on the model's internal knowledge.
When a numerical representation is involved, always ask what information that representation preserves and what it loses.
Validate input before expensive model calls. Use a small representative test set. Measure quality, latency and cost separately.
Keep a small regression test set so that an improvement on one example does not silently break earlier cases.
Self-check … Practice task: Take a small college problem and design a solution using {TOPIC}.
Write: Problem → Input → Processing → Output → Evaluation → Failure case → Safety measure.
Remember: problem first, technique second, evaluation always.
```

**GenAI coding-problem templates (example family; 32 such strings cover all 336 pages):**

```text
-1  Write a Python example that sends a clear prompt for {TOPIC} and requests a predictable output format.
-2  Create three prompts for {TOPIC}: basic, few-shot, and constraint-based. Compare their expected outputs.
-3  Write code that parses and validates the structured result returned for {TOPIC} and handles invalid output.
-4  Build a small prompt-testing script for {TOPIC} that runs the same task with three prompt versions and records the results.

(generic family, 19 topics)
-1  Write a small Python program that demonstrates the main idea of {TOPIC} using a simple example dataset or input.
-2  Implement one core operation from {TOPIC} as a reusable Python function and test it with three cases.
-3  Create a mini demo for {TOPIC} that prints intermediate results as well as the final result.
-4  Add input validation and error handling to your {TOPIC} implementation, then test one failure case.
```

## (d) Proposed redirects — PENDING OWNER APPROVAL — not implemented

> **Nothing below has been applied.** `next.config.js` was not edited. Every source and destination URL was verified to return HTTP 200 on production today.

**Tiers:** 1 = safe now (exact/near-exact duplicate, both pages already noindex). 2 = apply as part of the GenAI rewrite (same-intent merges). 3 = conditional — only if the stated owner decision is taken.

**Required alongside each redirect (DB change → needs separate approval):** archive/unpublish the source `learning_topics` row (and its `dsa_problems` rows) — otherwise the course sidebar, curriculum and Prev/Next keep linking to a URL that now redirects, and for an indexable source the `learning_sitemap` RPC would keep listing it. Note the Java slug-freeze decision from the lesson-content audit (ids/slugs/order frozen) — Tier 3 Java redirect conflicts with it. Without the redirect, archiving a topic makes the page fall through to `redirect('/learning/<grid>')` in `page.tsx`, which is a **307 temporary** redirect to the course page (a soft-404 signal), so the explicit permanent redirect is the better pairing. `permanent: true` in Next.js emits **308**, which Google treats the same as 301.

| Tier | Source path | Destination path | Reason |
|---|---|---|---|
| 1 | `/learning/generative-ai/text-to-video-u8` | `/learning/generative-ai/text-to-video` | identical body + identical title |
| 1 | `/learning/generative-ai/structured-outputs` | `/learning/generative-ai/structured-output` | plural duplicate (0.93) |
| 1 | `/coding-problems/genai-structured-outputs-:n([1-4])` | `/coding-problems/genai-structured-output-:n` | problems of the removed duplicate topic (prompts differ; alternative: send all 4 to the surviving lesson URL) |
| 2 | `/learning/generative-ai/quantization` | `/learning/generative-ai/model-quantization` | same concept (0.85) |
| 2 | `/coding-problems/genai-quantization-:n([1-4])` | `/coding-problems/genai-model-quantization-:n` | problems of the removed duplicate topic |
| 2 | `/learning/generative-ai/fine-tuning-concepts` | `/learning/generative-ai/fine-tuning` | same concept (1.00 title-masked) |
| 2 | `/coding-problems/genai-fine-tuning-concepts-:n([1-4])` | `/coding-problems/genai-fine-tuning-:n` | problems of the removed duplicate topic |
| 2 | `/learning/generative-ai/what-are-embeddings` | `/learning/generative-ai/embeddings` | same definitional intent |
| 2 | `/coding-problems/genai-what-are-embeddings-:n([1-4])` | `/coding-problems/genai-embeddings-:n` | problems of the removed duplicate topic |
| 2 | `/learning/generative-ai/function-calling` | `/learning/generative-ai/tools-and-function-calling` | subset of broader page |
| 2 | `/coding-problems/genai-function-calling-:n([1-4])` | `/coding-problems/genai-tools-and-function-calling-:n` | problems of the removed duplicate topic |
| 2 | `/learning/generative-ai/text-to-image-generation` | `/learning/generative-ai/text-to-image` | same task, two units |
| 2 | `/learning/generative-ai/encoder-and-decoder` | `/learning/generative-ai/encoder-only-decoder-only-and-encoder-decoder-models` | superset page, same unit |
| 3 | `/learning/java-tutorial/garbage-collector` | `/learning/java-tutorial/garbage-collection` | ONLY if Option B chosen (conflicts with frozen-slug decision) |
| 3 | `/learning/generative-ai/neural-networks` | `/learning/ai-ml-notes/neural-networks` | ONLY if the GenAI topic is dropped on rewrite |
| 3 | `/learning/generative-ai/overfitting-and-underfitting` | `/learning/ai-ml-notes/overfitting-underfitting` | ONLY if dropped on rewrite |
| 3 | `/learning/generative-ai/training-validation-and-testing` | `/learning/ai-ml-notes/training-validation-testing` | ONLY if dropped on rewrite |
| 3 | `/learning/generative-ai/model-deployment` | `/learning/ai-ml-notes/model-deployment` | ONLY if dropped on rewrite |
| 3 | `/learning/generative-ai/ai-vs-ml-vs-deep-learning-vs-generative-ai` | `/learning/ai-ml-notes/ai-vs-ml-vs-deep-learning` | ONLY if dropped on rewrite |
| 3 | `/learning/generative-ai/what-is-an-llm` | `/learning/ai-ml-notes/llm-basics` | ONLY if dropped on rewrite |

Paste-ready (for later, into the array returned by `redirects()` in `website/next.config.js`):

```js
      // SEO dedupe — Tier 1 (safe now; both sides already noindex)
      { source: "/learning/generative-ai/text-to-video-u8", destination: "/learning/generative-ai/text-to-video", permanent: true }, // identical body + identical title
      { source: "/learning/generative-ai/structured-outputs", destination: "/learning/generative-ai/structured-output", permanent: true }, // plural duplicate (0.93)
      { source: "/coding-problems/genai-structured-outputs-:n([1-4])", destination: "/coding-problems/genai-structured-output-:n", permanent: true }, // problems of the removed duplicate topic (prompts differ; alternative: send all 4 to the surviving lesson URL)
      // SEO dedupe — Tier 2 (apply with the Generative AI rewrite)
      { source: "/learning/generative-ai/quantization", destination: "/learning/generative-ai/model-quantization", permanent: true }, // same concept (0.85)
      { source: "/coding-problems/genai-quantization-:n([1-4])", destination: "/coding-problems/genai-model-quantization-:n", permanent: true }, // problems of the removed duplicate topic
      { source: "/learning/generative-ai/fine-tuning-concepts", destination: "/learning/generative-ai/fine-tuning", permanent: true }, // same concept (1.00 title-masked)
      { source: "/coding-problems/genai-fine-tuning-concepts-:n([1-4])", destination: "/coding-problems/genai-fine-tuning-:n", permanent: true }, // problems of the removed duplicate topic
      { source: "/learning/generative-ai/what-are-embeddings", destination: "/learning/generative-ai/embeddings", permanent: true }, // same definitional intent
      { source: "/coding-problems/genai-what-are-embeddings-:n([1-4])", destination: "/coding-problems/genai-embeddings-:n", permanent: true }, // problems of the removed duplicate topic
      { source: "/learning/generative-ai/function-calling", destination: "/learning/generative-ai/tools-and-function-calling", permanent: true }, // subset of broader page
      { source: "/coding-problems/genai-function-calling-:n([1-4])", destination: "/coding-problems/genai-tools-and-function-calling-:n", permanent: true }, // problems of the removed duplicate topic
      { source: "/learning/generative-ai/text-to-image-generation", destination: "/learning/generative-ai/text-to-image", permanent: true }, // same task, two units
      { source: "/learning/generative-ai/encoder-and-decoder", destination: "/learning/generative-ai/encoder-only-decoder-only-and-encoder-decoder-models", permanent: true }, // superset page, same unit
      // SEO dedupe — Tier 3 (CONDITIONAL — only after the owner decision noted)
      { source: "/learning/java-tutorial/garbage-collector", destination: "/learning/java-tutorial/garbage-collection", permanent: true }, // ONLY if Option B chosen (conflicts with frozen-slug decision)
      { source: "/learning/generative-ai/neural-networks", destination: "/learning/ai-ml-notes/neural-networks", permanent: true }, // ONLY if the GenAI topic is dropped on rewrite
      { source: "/learning/generative-ai/overfitting-and-underfitting", destination: "/learning/ai-ml-notes/overfitting-underfitting", permanent: true }, // ONLY if dropped on rewrite
      { source: "/learning/generative-ai/training-validation-and-testing", destination: "/learning/ai-ml-notes/training-validation-testing", permanent: true }, // ONLY if dropped on rewrite
      { source: "/learning/generative-ai/model-deployment", destination: "/learning/ai-ml-notes/model-deployment", permanent: true }, // ONLY if dropped on rewrite
      { source: "/learning/generative-ai/ai-vs-ml-vs-deep-learning-vs-generative-ai", destination: "/learning/ai-ml-notes/ai-vs-ml-vs-deep-learning", permanent: true }, // ONLY if dropped on rewrite
      { source: "/learning/generative-ai/what-is-an-llm", destination: "/learning/ai-ml-notes/llm-basics", permanent: true }, // ONLY if dropped on rewrite
```

## Appendix — duplicate `<title>` tags across content pages

| `<title>` | URLs |
|---|---|
| Cardinality · DBMS & SQL Tutorial \| CampusEduX | `/learning/dbms-sql-tutorial/cardinality`<br>`/learning/dbms-sql-tutorial/cardinality-ratio`<br>`/learning/dbms-sql-tutorial/index-cardinality` |
| Foreign Key · DBMS & SQL Tutorial \| CampusEduX | `/learning/dbms-sql-tutorial/foreign-key`<br>`/learning/dbms-sql-tutorial/foreign-key-constraint-syntax` |
| Natural Join · DBMS & SQL Tutorial \| CampusEduX | `/learning/dbms-sql-tutorial/natural-join`<br>`/learning/dbms-sql-tutorial/natural-join-sql` |
| Primary Key · DBMS & SQL Tutorial \| CampusEduX | `/learning/dbms-sql-tutorial/primary-key`<br>`/learning/dbms-sql-tutorial/primary-key-constraint-syntax` |
| Rename · DBMS & SQL Tutorial \| CampusEduX | `/learning/dbms-sql-tutorial/rename`<br>`/learning/dbms-sql-tutorial/rename-statement` |
| Union · DBMS & SQL Tutorial \| CampusEduX | `/learning/dbms-sql-tutorial/union`<br>`/learning/dbms-sql-tutorial/union-sql` |
| Problem 2: Compare Different Values of k · Coding Problem \| CampusEduX | `/coding-problems/aiml-cross-validation-2`<br>`/coding-problems/aiml-k-nearest-neighbors-2` |
| Text-to-Video · Generative AI \| CampusEduX | `/learning/generative-ai/text-to-video`<br>`/learning/generative-ai/text-to-video-u8` |

_Reproducibility: crawler + analysis scripts and raw per-page metrics were kept in the session scratchpad (`agent3/crawl.py`, `analyze.py`, `report.py`, `pages.jsonl`), not in the repo._

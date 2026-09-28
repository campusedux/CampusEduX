# Java Tutorials: lesson rewrite style guide

Rules for every rewritten lesson in `content/java/`. `scripts/verify-java-lessons.mjs` enforces the ones
marked **(checked)**. The rewrite expands the thin lessons of the existing `java-tutorial` course, which
0047/024 seeded, in the same teacher style as `content/spring-boot/`.

## What stays fixed

- Topic `id`, `slug`, `title`, section and `sort_order` never change. URLs stay the same. The page H1 is the
  topic title, so the body never has a `#` heading **(checked)**.
- Only the lesson body and `short_description` are updated in place. New rows are a "Practice Problems" block
  and a topic mock test (`pt-java-<slug>`), and only when the manifest says so.

## Files per lesson

- `lessons/<slug>.md` is the lesson body.
- `lessons/<slug>.meta.json` holds `{ "description": "...", "related": ["slug", ...] }`.
- `lessons/<slug>.practice.md` is needed when the manifest has `practice: true`.
- `lessons/<slug>.quiz.json` is needed when the manifest has `quiz: true`.

## Content

- Original writing in simple English, in a human teacher's voice. Never copy or paraphrase GeeksforGeeks,
  W3Schools, JavaTpoint or any other site. Use your own examples and domains (cinema, clinic, library,
  bakery, food delivery, railway, cricket scoreboard, …), never Student/Employee.
- Prose is 1200-1500 words **(checked)**. Prose means every word outside fenced code blocks.
- There are no "unit / chapter / lesson / module / part" labels, no numbered headings, and no banned AI
  phrases **(checked)**.
- Sections in this order, with `##` headings exactly as below **(checked)**:
  1. An opening hook paragraph (no heading).
  2. `## What is <Topic>?`, with a `> **Definition:**` callout.
  3. `## Why is <Topic> used?` (any heading starting with "Why").
  4. `## Real-Life Example`: one analogy mapped back to the concept.
  5. `## Syntax`: a `java` fence with the general form, then a line-by-line explanation.
  6. `## How <Topic> Works` (any heading starting with "How"): internal working, with a `text` flow diagram
     and a plain explanation paragraph under it **(checked)**. Examples: HashMap hashing and buckets,
     ArrayList growth, the JVM loading classes.
  7. `## Example Programs`: 2-3 `###` examples. Each has one complete `java` program with `main`, then
     `**Output:**`, then a `text` fence with the exact output, then 1-3 sentences on what it shows
     **(checked)**.
  8. A comparison section with a Markdown table, when the manifest has `table: true` (for example
     `## ArrayList vs LinkedList`) **(checked)**. Optional otherwise.
  9. `## Common Mistakes`: at least one `> **Warning:**` or `> **Common mistake:**` callout and 3-5 bullets.
  10. `## Interview Questions`: exactly 5 **(checked)**. Each is its own paragraph: a bold question ending in
      `?` on one line, and the answer on the next line (2-4 sentences). No "Ans:" label; the site adds it.
  11. `## Summary`: 5-7 bullet points.
  12. `## Related Topics`: 2-4 links, `- [Title](/learning/java-tutorial/<slug>): why it helps.`, pointing
      to existing Java topics **(checked)**, listed in the same order as `meta.json` `related`.

## Code

- Allowed fence languages are `java`, `text` and `bash` **(checked)**.
- Every `java` fence that has `static void main` is compiled with `javac --release 11` and run, and its
  `**Output:**` block must match the real stdout exactly **(checked)**. Output must be deterministic, so no
  timestamps, random numbers or thread races. Join threads and print in a fixed order.
- Imports are only `java.*` (the site's Run button needs it) **(checked)**. One public class per program.
  Class names are unique inside a lesson.
- Java 11 features only. The online judge is older than 21, so avoid records, `instanceof` patterns,
  switch expressions and `Stream.toList()`.
- Keep code lines at 70 characters or fewer where possible (warned over 80).

## Phone widths

- Every line of a `text` block (diagram or output) is at most 34 characters **(checked)**.
- The longest run without spaces in inline code is at most 30 characters **(checked)**.

## Practice Problems (`.practice.md`)

- Open with one short line such as "Try each problem on your own first, then compare with the solution."
- Exactly 2 problems: `### Easy: <name>` then `### Medium: <name>` **(checked)**. Each has a task statement
  (with sample input values fixed in the code and the expected output), `> **Hint:**`, `**Answer:**` (one or
  two sentences on the idea), a full `java` solution with `main`, and `**Output:**` with a `text` fence
  **(checked, and run)**.

## MCQ test (`.quiz.json`)

- `{ "questions": [ ... ] }` with exactly 10 questions **(checked)**. Each question is
  `{ "kind": "concept|output|bug", "question": "...", "options": [4 distinct], "answer": 0-3, "explanation": "one line, 220 chars max" }`.
- Mix all three kinds, with at least 3 `output` or `bug` questions. Spread the correct answers over the
  options (each index 0-3 used at least once) **(checked)**. Code in a question goes inline in the question
  text; keep it short.

## SEO

- `description` is 140-155 characters, unique, and a plain sentence that says what the reader learns
  **(checked)**. It becomes `short_description`: the lede under the H1 and the meta description.

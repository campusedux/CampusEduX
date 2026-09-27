/**
 * Question → "Ans:" detection for Learning Markdown — pure, unit-tested.
 *
 * Survey of the seeded content (2026-09-27): interview / self-check Q&A is
 * authored as a bold question with the answer on the NEXT line of the same
 * paragraph (Spring Boot, Java `**Q2. …?**`, Python `Answer: …`, DBMS
 * `**Q: …?**` + `A: …`) or, less often, on the same line. The paragraph
 * renderer joins a paragraph's lines with a space, so both shapes rendered as
 * one run-on line. This detects them so the question renders on its own line
 * and the answer below it behind a single "Ans:" label. The stored content is
 * never modified.
 */

export interface DetectedQnA {
  /** The question exactly as authored, including its bold markers. */
  question: string;
  /** The answer text with any authored `A:` / `Ans:` / `Answer:` label removed. */
  answer: string;
}

/** A paragraph that OPENS with a fully bold span ending in "?". */
const BOLD_QUESTION = /^(\*\*([^*]+?\?)\*\*|__([^_]+?\?)__)(.*)$/s;

/** Authored answer labels — replaced by the one rendered "Ans:" label. */
const ANSWER_LABEL = /^(?:\*\*(?:A|Ans|Answer)\s*:\s*\*\*|__(?:A|Ans|Answer)\s*:\s*__|(?:A|Ans|Answer)\s*:)\s*/;

/** A multiple-choice option (`a) true`, `(B) …`, `C. …`) — the text after the question is options, not an answer. */
const MCQ_OPTION = /^\(?[a-dA-D][).]\s/;

function split(text: string): DetectedQnA | null {
  const m = text.match(BOLD_QUESTION);
  if (!m || MCQ_OPTION.test(m[4].trim())) return null;
  const answer = m[4].trim().replace(ANSWER_LABEL, "").trim();
  return answer ? { question: m[1], answer } : null;
}

/**
 * Paragraph lines (raw, as buffered by the renderer) → Q&A pairs, or `null`.
 * Pairs written back to back without a blank line share one paragraph, so the
 * paragraph is split at every line that opens with a bold question; a segment
 * that is not a valid pair stays part of the previous answer.
 */
export function detectQnA(rawLines: string[]): DetectedQnA[] | null {
  const segments: string[][] = [];
  for (const line of rawLines.map((l) => l.trim()).filter(Boolean)) {
    if (segments.length === 0 || BOLD_QUESTION.test(line)) segments.push([line]);
    else segments[segments.length - 1].push(line);
  }
  const pairs: DetectedQnA[] = [];
  for (const seg of segments) {
    const hit = split(seg.join(" "));
    if (hit) pairs.push(hit);
    else if (pairs.length) pairs[pairs.length - 1].answer += ` ${seg.join(" ")}`;
    else return null;
  }
  return pairs.length ? pairs : null;
}

/**
 * List items are far more often bold-labelled checklists ("**What goes in?**
 * Identify the input…") than Q&A, so a list item only qualifies when its bold
 * question carries an explicit `Q:` / `Q1.` marker (the DBMS self-check
 * bullets: `- **Q: …?** answer`).
 */
export function detectListItemQnA(text: string): DetectedQnA | null {
  const hit = split(text.trim());
  if (!hit) return null;
  return /^(\*\*|__)Q\d*\s*[:.)]/.test(hit.question) ? hit : null;
}

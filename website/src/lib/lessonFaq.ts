/**
 * Visible Q&A pairs of a lesson, for FAQPage JSON-LD — pure, unit-tested
 * (tests/lib/seoDescriptions.test.ts).
 *
 * Walks each Markdown block the same way `components/learning/Markdown.tsx`
 * splits it (fenced code, headings, blockquotes, tables, list runs,
 * paragraphs) and applies the very same detectors from `lib/qna.ts` the
 * renderer uses — paragraphs via `detectQnA`, list items via
 * `detectListItemQnA` — so structured data only ever describes a question and
 * answer that the page actually renders as one. Plain-format blocks are
 * rendered verbatim (no Q&A layout) and are skipped. Callers must pass only
 * rendered content (never a locked premium lesson's withheld body).
 */
import { detectListItemQnA, detectQnA, type DetectedQnA } from "@/lib/qna";
import { cleanText } from "@/lib/metaDescription";

export interface FaqPair {
  question: string;
  answer: string;
}

const UL = /^(\s*)[-*+]\s+(.*)$/;
const OL = /^(\s*)(\d+)[.)]\s+(.*)$/;

function pairsInMarkdown(source: string): DetectedQnA[] {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  const out: DetectedQnA[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (/^```/.test(line)) {
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) i += 1;
      i += 1;
      continue;
    }
    if (/^#{1,6}\s/.test(line) || /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      i += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      while (i < lines.length && /^>\s?/.test(lines[i])) i += 1;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) i += 1;
      continue;
    }
    const ordered = OL.test(line);
    if (UL.test(line) || ordered) {
      while (i < lines.length) {
        const um = lines[i].match(UL);
        const om = lines[i].match(OL);
        if (ordered ? !om : !um) break;
        const hit = detectListItemQnA(ordered ? om![3] : um![2]);
        if (hit) out.push(hit);
        i += 1;
      }
      continue;
    }
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !UL.test(lines[i]) &&
      !OL.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    // A practice-card "**Answer:** …" paragraph is not a question.
    if (/^\*\*Answer\s*:\s*\*\*/.test(buf.join(" "))) continue;
    const pairs = detectQnA(buf);
    if (pairs) out.push(...pairs);
  }
  return out;
}

/** Q&A pairs visible in a lesson's rendered Markdown blocks, as plain text, de-duplicated, at most `limit`. */
export function lessonFaqPairs(
  blocks: { body?: string | null; content_format?: string | null }[],
  limit = 20,
): FaqPair[] {
  const seen = new Set<string>();
  const out: FaqPair[] = [];
  for (const block of blocks) {
    if (block.content_format === "plain") continue;
    for (const pair of pairsInMarkdown(String(block.body ?? ""))) {
      // "Q2. What is …?" → "What is …?" — the number/label is presentation, not the question.
      const question = cleanText(pair.question).replace(/^Q\d*\s*[:.)]\s*/i, "");
      const answer = cleanText(pair.answer);
      const key = question.toLowerCase();
      if (!question || !answer || seen.has(key)) continue;
      seen.add(key);
      out.push({ question, answer });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

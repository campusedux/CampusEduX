/**
 * Callout detection for Learning lesson blockquotes — pure, unit-tested.
 *
 * Survey of the live content (2026-09-24, 766 blocks / 269 blockquotes): there
 * are NO "Tip:" / "Note:" / "Warning:" labels today. Blockquotes open with a
 * bold label — `> **Definition:** …` (60) and `> **Teacher's simple view:** …`
 * (206). So a blockquote becomes a styled callout only when it OPENS with a
 * whitelisted label (bold `**Label:**` / `**Label**:` or plain `Label:`); any
 * other blockquote keeps the ordinary quote style. Paragraphs are never
 * touched, and the stored content is never modified.
 */
export type CalloutVariant = "tip" | "note" | "warning" | "definition" | "simple" | "key";

const LABELS: [RegExp, CalloutVariant][] = [
  [/^(pro tip|tip|hint)$/, "tip"],
  [/^(note|info|nb)$/, "note"],
  [/^(warning|caution|important|common mistakes?|edge case|watch out)$/, "warning"],
  [/^(definition|simple definition)$/, "definition"],
  [/^(teacher'?s simple view|in simple words|simple view|simply put)$/, "simple"],
  [/^(remember|key takeaway|key point|takeaway)$/, "key"],
];

export interface DetectedCallout {
  variant: CalloutVariant;
  /** Lighter treatment (left rule + label, no box) — paragraph "Remember" / "Key takeaway". */
  subtle?: boolean;
  /** The label exactly as authored, e.g. "Teacher's simple view". */
  label: string;
  /** The blockquote text after the label. */
  body: string;
}

export function detectCallout(text: string): DetectedCallout | null {
  const t = text.trim();
  const m =
    t.match(/^\*\*([^*]{1,40}?)\s*:\s*\*\*\s*(.*)$/s) ?? // **Label:** body
    t.match(/^\*\*([^*]{1,40}?)\*\*\s*:\s*(.*)$/s) ?? // **Label**: body
    t.match(/^([A-Za-z][A-Za-z' ]{1,30}?)\s*:\s+(.*)$/s); // Label: body
  if (!m) return null;
  const label = m[1].trim();
  const key = label.toLowerCase().replace(/[’]/g, "'");
  const hit = LABELS.find(([re]) => re.test(key));
  return hit ? { variant: hit[1], label, body: m[2].trim() } : null;
}

/**
 * Paragraph-level callouts — owner-approved 2026-09-24, deliberately narrower
 * than blockquotes: only a paragraph that OPENS with bold `**Remember:**`,
 * `**Key takeaway:**` (subtle style — they sit beside "Teacher's simple view"
 * boxes in the same lessons) or `**Common Mistake(s):**` (warning style).
 * Everything else stays an ordinary paragraph.
 */
const PARAGRAPH_LABELS: [RegExp, CalloutVariant, boolean][] = [
  [/^(remember|key takeaway)$/, "key", true],
  [/^common mistakes?$/, "warning", false],
];

export function detectParagraphCallout(text: string): DetectedCallout | null {
  const m = text.trim().match(/^\*\*([^*]{1,30}?)\s*:\s*\*\*\s*(.+)$/s);
  if (!m) return null;
  const label = m[1].trim();
  const hit = PARAGRAPH_LABELS.find(([re]) => re.test(label.toLowerCase()));
  return hit ? { variant: hit[1], subtle: hit[2] || undefined, label, body: m[2].trim() } : null;
}

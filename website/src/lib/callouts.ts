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

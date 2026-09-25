/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Reader callouts — the ONE place that decides which section headings become
 *  a styled box. Edit the lists below to add/rename labels; nothing else needs
 *  to change. A heading that matches NONE of these renders as a normal heading.
 *
 *  Matching is on the heading text after `normalizeLabel`: lower-cased, leading
 *  numbering ("2.", "3)") and emoji removed, trailing "?" ":" "." removed, dashes
 *  and spaces collapsed. So "## 2. Why is it used?" matches "why is it used".
 *  A heading is matched EXACTLY against `labels`, or by any `patterns` regex.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type CalloutKind = "definition" | "why" | "example" | "warning" | "key";

export interface CalloutRule {
  kind: CalloutKind;
  /** Emoji shown in the box header. */
  icon: string;
  /** Exact normalized labels. */
  labels: string[];
  /** Extra regexes tested against the normalized label. */
  patterns?: RegExp[];
}

export const CALLOUT_RULES: CalloutRule[] = [
  {
    kind: "definition", // indigo · 📘
    icon: "📘",
    labels: ["what is it", "definition", "what is this"],
  },
  {
    kind: "why", // blue · 💡
    icon: "💡",
    labels: ["why do we use it", "why is it used", "why use it", "why is it important"],
  },
  {
    kind: "example", // green · 🌍
    icon: "🌍",
    labels: [
      "real world example",
      "real life example",
      "how it works",
      "how does it work",
      "example",
      "simple example",
      "example program",
      "python example",
      "technical example",
    ],
    patterns: [/^example \d+$/],
  },
  {
    kind: "warning", // amber · ⚠️
    icon: "⚠️",
    labels: ["edge cases and pitfalls", "common mistakes", "common beginner mistakes", "pitfalls", "common pitfalls", "warning", "limitations"],
    patterns: [/^common (beginner )?mistakes\b/],
  },
  {
    kind: "key", // purple · ⭐
    icon: "⭐",
    labels: [
      "key points",
      "key points to remember",
      "important points",
      "summary",
      "interview tip",
      "interview tips",
      "quick revision",
      "interview oriented points",
      "exam oriented points",
    ],
  },
];

/** "## 2. Why is it used?" → "why is it used". */
export function normalizeLabel(text: string): string {
  return text
    .toLowerCase()
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/^\s*\d+\s*[.)]\s*/, "")
    .replace(/[-–—‐]+/g, " ")
    .replace(/[?:.!]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchCallout(headingText: string): CalloutRule | null {
  const label = normalizeLabel(headingText);
  if (!label) return null;
  return CALLOUT_RULES.find((r) => r.labels.includes(label) || r.patterns?.some((p) => p.test(label))) ?? null;
}

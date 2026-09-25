/**
 * Lesson section detection — pure, unit-tested. Render-only: stored lesson
 * Markdown is never modified; this only decides how a heading (and the
 * content under it) is presented.
 *
 * Survey of the live content (2026-09-25, 766 blocks): the lesson template is
 * the same idea in five vocabularies —
 *   Java    `## 1. What is X?` / Why is it used? / Real-Life Example / Syntax /
 *           Example Program / Key Points to Remember, plus a separate
 *           "Practice Problems" block (block heading, `### 1. …` questions)
 *   Python  `### What is it?` / Why do we use it? / Simple Example / Common
 *           Mistakes / Important Points / Practice (under `## N. Chapter`)
 *   AI/ML   `### 1. Introduction` … Python Example / Common Mistakes /
 *           Interview-Oriented Points / Quick Revision
 *   GenAI   `### 12. Practice task` / `## Practice Problems` / Quick revision,
 *           most prefixed with the topic ("Model deployment: Practice",
 *           "What is RAG: Practice" — see `topicHeadingPrefixes`)
 *   DBMS    `### Definition` / How It Works / Edge Cases and Pitfalls / Key Takeaways
 * A block only gets the section treatment when at least two of its headings
 * are recognised; anything else renders exactly as before.
 */
export type LessonSectionKind =
  | "intro"
  | "why"
  | "example"
  | "code"
  | "keypoints"
  | "practice"
  | "mistakes"
  | "interview"
  | "revision";

/** Examples that are code in some courses (Python "Simple Example") and prose in others (DBMS "Worked example"). */
const GENERIC_EXAMPLE = /^(simple examples?|basic examples?|worked example|running example|technical example|examples?)$/;

/** Order matters: first match wins. Tested against the normalised title. */
const KINDS: [RegExp, LessonSectionKind][] = [
  [/^(practice|practice (problems?|questions?|tasks?|exercises?)|exercises?|try it yourself)$/, "practice"],
  [/^(key points( to remember)?|important points|points to remember|key takeaways?)( \/ .*)?$/, "keypoints"],
  [/^(common (beginner )?mistakes|edge cases( and (pitfalls|trade-offs))?|common problems)$/, "mistakes"],
  [/^quick revision$/, "revision"],
  [/^(interview( questions| \/ viva questions| and viva|-oriented points|-style q&a| takeaways)?|exam-(ready answer|oriented points))$/, "interview"],
  [/^(syntax|example programs?|python example|complete code|code example|sample program)$/, "code"],
  [/^real[- ](life|world) examples?$/, "example"],
  [GENERIC_EXAMPLE, "example"],
  [/^why\b/, "why"],
  [/^(what (is|are|does)\b.*|introduction|overview|definition|what it is|what it means)$/, "intro"],
];

/** `"6. Key Points to Remember"` → `{ number: "6", title: "Key Points to Remember" }`. */
export function splitHeadingNumber(raw: string): { number: string | null; title: string } {
  const m = raw.trim().match(/^(\d{1,3})[.)]\s+(.+)$/);
  return m ? { number: m[1], title: m[2] } : { number: null, title: raw.trim() };
}

/** Heading text → the lower-case title the patterns test (no number, emphasis or trailing `?:.`). */
function normalise(raw: string): string {
  return splitHeadingNumber(raw.replace(/\*\*|__|`/g, ""))
    .title.toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[?:.]+$/, "")
    .trim();
}

const match = (t: string) => KINDS.find(([re]) => re.test(t))?.[1] ?? null;

function classifyTitle(t: string): LessonSectionKind | null {
  const direct = match(t);
  if (direct) return direct;
  // "Model deployment: Practice" — a topic-name prefix before the section name.
  const colon = t.lastIndexOf(": ");
  return colon > 0 ? match(t.slice(colon + 2)) : null;
}

/**
 * The `Prefix: ` (normalised) that two or more headings of one block share —
 * GenAI names every section "<Topic>: <Section>", so a repeated prefix is the
 * topic's name, not part of the section's. A one-off colon ("Why Table
 * Constraints Exist: The Multi-Column Requirement") is a subtitle.
 */
export function topicHeadingPrefixes(src: string): Set<string> {
  const counts = new Map<string, number>();
  let inFence = false;
  for (const line of src.replace(/\r\n/g, "\n").split("\n")) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    const h = inFence ? null : line.match(/^#{1,6}\s+(.*)$/);
    if (!h) continue;
    const t = normalise(h[1]);
    const colon = t.indexOf(": ");
    if (colon > 0) counts.set(t.slice(0, colon), (counts.get(t.slice(0, colon)) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n >= 2).map(([p]) => p));
}

/**
 * The section kind a heading's text announces, or null for any other heading.
 * Behind a topic-name prefix (`topicPrefixes`) only the section part counts,
 * so a topic titled "What is RAG" / "Why RAG is required" doesn't turn every
 * "What is RAG: Practice" into an intro / "why" heading.
 */
export function classifyLessonHeading(raw: string, topicPrefixes?: ReadonlySet<string>): LessonSectionKind | null {
  const t = normalise(raw);
  const colon = t.indexOf(": ");
  if (colon > 0 && topicPrefixes?.has(t.slice(0, colon))) return classifyTitle(t.slice(colon + 2));
  return classifyTitle(t);
}

/**
 * The kind to render a section as, given its body lines: a generic "Example"
 * section that holds a code fence is shown as code (Python's "Simple Example"
 * is always a program); real-life examples and prose examples stay "example".
 */
export function lessonSectionKind(
  raw: string,
  body: string[],
  topicPrefixes?: ReadonlySet<string>,
): LessonSectionKind | null {
  const kind = classifyLessonHeading(raw, topicPrefixes);
  if (kind !== "example") return kind;
  const t = normalise(raw);
  const title = t.slice(t.lastIndexOf(": ") + 1).trim();
  return GENERIC_EXAMPLE.test(title) && body.some((l) => /^```/.test(l)) ? "code" : "example";
}

/** Kinds whose content is wrapped with the heading into one visual unit. */
export type LessonSectionFrame = "card" | "band" | null;

export function sectionFrame(kind: LessonSectionKind | null): LessonSectionFrame {
  if (kind === "keypoints" || kind === "practice") return "card";
  if (kind === "code") return "band";
  return null;
}

export interface LessonStructure {
  /** Source heading level (`##` = 2) that carries the section headings. */
  level: number;
}

/**
 * Whether a Markdown block follows the lesson template (≥2 recognised
 * headings outside code fences) and, if so, the heading level its sections
 * use — the most common level among the recognised headings (Python nests
 * `### What is it?` under `## 1. NumPy`, so chapters stay plain headings).
 */
export function detectLessonStructure(
  src: string,
  topicPrefixes: ReadonlySet<string> = topicHeadingPrefixes(src),
): LessonStructure | null {
  const counts = new Map<number, number>();
  let recognised = 0;
  let inFence = false;
  for (const line of src.replace(/\r\n/g, "\n").split("\n")) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (!h || !classifyLessonHeading(h[2], topicPrefixes)) continue;
    recognised += 1;
    counts.set(h[1].length, (counts.get(h[1].length) ?? 0) + 1);
  }
  if (recognised < 2) return null;
  let level = 0;
  let best = 0;
  for (const [l, n] of counts) {
    if (n > best || (n === best && l < level)) {
      level = l;
      best = n;
    }
  }
  return { level };
}

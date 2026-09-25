/**
 * Meta descriptions for Learning lessons — pure, unit-tested. A lesson's
 * authored `short_description` wins; without one, the first prose of its body
 * stands in (headings, code, tables, rules and images skipped, so the snippet
 * never opens with "Definition" or a code sample).
 */
import { stripMarkdown } from "@/lib/blogText";

export const META_DESCRIPTION_MAX = 155;

/** `text` in at most `max` characters, cut at a word boundary with "…" when shortened. */
export function clampAtWord(text: string, max = META_DESCRIPTION_MAX): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  // A single very long word is cut mid-word rather than dropped.
  const head = space > max * 0.6 ? cut.slice(0, space) : cut;
  return `${head.replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** The opening prose of a Markdown body, as plain text (at least `max` characters of it when available). */
export function leadingProse(markdown: string, max = META_DESCRIPTION_MAX): string {
  const parts: string[] = [];
  let length = 0;
  let inFence = false;
  for (const line of String(markdown || "").replace(/\r\n/g, "\n").split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || /^\s*(#{1,6}\s|\||(-{3,}|\*{3,}|_{3,})\s*$|!\[)/.test(line)) continue;
    const text = stripMarkdown(line);
    if (!text) continue;
    parts.push(text);
    length += text.length + 1;
    if (length > max) break;
  }
  return parts.join(" ");
}

/** A lesson's meta description: `short_description`, else the body's opening prose, else `fallback`. */
export function lessonMetaDescription(shortDescription: string | null | undefined, bodies: string[], fallback: string): string {
  const summary = (shortDescription ?? "").trim();
  if (summary) return clampAtWord(summary);
  for (const body of bodies) {
    const prose = leadingProse(body);
    if (prose) return clampAtWord(prose);
  }
  return clampAtWord(fallback);
}

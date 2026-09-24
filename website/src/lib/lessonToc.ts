import { readingTimeFromMarkdown, slugId, type TocItem } from "@/lib/blogText";

interface Block {
  heading: string;
  body: string;
  content_format: "markdown" | "plain";
}

const TOC_MAX = 24;

/**
 * Table of contents for a lesson, built from the same anchors the page
 * renders: each content block's own heading (rendered as <h2>), then the
 * Markdown `##` / `###` headings inside it. Ids use `slugId(rawText)` exactly
 * as `Markdown.tsx` stamps them, so every link lands. Duplicates are skipped
 * (the first anchor on the page wins, as the browser would).
 */
export function lessonToc(blocks: Block[]): TocItem[] {
  const out: TocItem[] = [];
  const seen = new Set<string>();
  const push = (raw: string, level: number) => {
    const id = slugId(raw);
    // Strip emphasis/code markers only — a lone `_` inside `snake_case` is content.
    const text = raw.replace(/\*\*|__|`/g, "").trim();
    if (!id || !text || seen.has(id)) return;
    seen.add(id);
    out.push({ id, text, level });
  };
  for (const b of blocks) {
    if (b.heading) push(b.heading, 2);
    if (b.content_format !== "markdown") continue;
    let inFence = false;
    for (const line of b.body.replace(/\r\n/g, "\n").split("\n")) {
      if (/^```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      const m = line.match(/^(#{2,3})\s+(.*)$/);
      if (!m) continue;
      // Under a block heading, `##` reads as a sub-section.
      push(m[2], b.heading ? 3 : m[1].length);
    }
  }
  return out.slice(0, TOC_MAX);
}

/** Minutes to read the whole lesson (~200 wpm, code excluded, min 1). */
export function lessonReadingMinutes(blocks: Block[]): number {
  return readingTimeFromMarkdown(blocks.map((b) => `${b.heading}\n${b.body}`).join("\n\n"));
}

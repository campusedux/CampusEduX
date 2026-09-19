import type { LearningContentBlock } from "@/types";
import { matchCallout, type CalloutKind } from "./calloutConfig";
import { inlineToText, parseInline, parseMarkdown, type Block } from "./markdownParser";

/**
 * Turns a topic's content blocks into what the reader renders:
 *   1. hides a leading heading that just repeats the topic title,
 *   2. wraps callout-labelled sections in callout nodes (content is only ever
 *      wrapped — never dropped, reordered or edited),
 *   3. collects the "In this topic" outline and a real word-count read time.
 */

export interface CalloutNode {
  t: "callout";
  /** "box" = tinted box; "heading" = heading with the callout icon + accent bar, no box. */
  variant: "box" | "heading";
  id: string;
  kind: CalloutKind;
  icon: string;
  /** The heading text, verbatim. */
  label: string;
  level: number;
  children: ReaderNode[];
}
export type HeadingNode = Extract<Block, { t: "heading" }> & { id: string };
export type ReaderNode = HeadingNode | CalloutNode | Exclude<Block, { t: "heading" }>;

export interface PreparedBlock {
  id: string;
  nodes: ReaderNode[];
  fileUrl: string | null;
  videoUrl: string | null;
}

export interface TocItem {
  id: string;
  text: string;
  /** 0 = main section, 1 = sub-section. */
  depth: 0 | 1;
}

export interface PreparedTopic {
  blocks: PreparedBlock[];
  toc: TocItem[];
  readingMinutes: number;
}

/** Reading speed for the estimate. */
export const WORDS_PER_MINUTE = 200;
/** Fewer headings than this → no "In this topic" outline. */
export const MIN_TOC_ITEMS = 3;

export const normalizeTitle = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

export function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** A matching section is only boxed when it is shorter than this many words… */
export const BOX_MAX_WORDS = 120;

/** …and holds no code block or table (those stay full-width, un-boxed). */
function measure(nodes: ReaderNode[]): { words: number; heavy: boolean } {
  let words = 0;
  let heavy = false;
  for (const n of nodes) {
    if (n.t === "code" || n.t === "table") heavy = true;
    else if (n.t === "callout") {
      const m = measure(n.children);
      words += countWords(n.label) + m.words;
      heavy = heavy || m.heavy;
    } else if (n.t === "heading") words += countWords(n.text);
    else if (n.t === "paragraph" || n.t === "quote") words += countWords(inlineToText(n.inline));
    else if (n.t === "list") words += n.items.reduce((a, it) => a + countWords(inlineToText(it.inline)), 0);
  }
  return { words, heavy };
}

/** Carried across blocks so "no two boxes adjacent" also holds at block boundaries. */
interface GroupState {
  prevWasBox: boolean;
}

type FlatNode = HeadingNode | Exclude<Block, { t: "heading" }>;

/**
 * Wrap callout-labelled sections. A callout owns everything up to the next heading of the same or
 * higher level. It is drawn as a tinted BOX only when it is short (< BOX_MAX_WORDS words), has no code
 * block or table, is not inside another box, and does not directly follow another box; otherwise it is
 * the "heading" variant (icon + accent bar, no tint). Content is only ever wrapped, never changed.
 */
function groupCallouts(nodes: FlatNode[], state: GroupState, insideBox = false): ReaderNode[] {
  const out: ReaderNode[] = [];
  let i = 0;
  while (i < nodes.length) {
    const n = nodes[i];
    const rule = n.t === "heading" ? matchCallout(n.text) : null;
    if (n.t === "heading" && rule) {
      let j = i + 1;
      while (j < nodes.length) {
        const m = nodes[j];
        if (m.t === "heading" && m.level <= n.level) break;
        j += 1;
      }
      const slice = nodes.slice(i + 1, j);
      // Decide the variant from a provisional (all-heading-variant) build so nested callouts count their own content.
      const provisional = groupCallouts(slice, { prevWasBox: false }, true);
      const { words, heavy } = measure(provisional);
      const box = !insideBox && !state.prevWasBox && !heavy && words + countWords(n.text) < BOX_MAX_WORDS;
      // Children of a box are never boxes themselves; children of a heading-variant callout may be.
      const children = box ? provisional : groupCallouts(slice, { prevWasBox: false }, false);
      out.push({ t: "callout", variant: box ? "box" : "heading", id: n.id, kind: rule.kind, icon: rule.icon, label: n.text, level: n.level, children });
      state.prevWasBox = box;
      i = j;
    } else {
      out.push(n);
      state.prevWasBox = false;
      i += 1;
    }
  }
  return out;
}

function collectToc(nodes: ReaderNode[], acc: TocItem[] = []): TocItem[] {
  for (const n of nodes) {
    if (n.t === "heading" && n.level <= 3) acc.push({ id: n.id, text: n.text, depth: n.level <= 2 ? 0 : 1 });
    else if (n.t === "callout") {
      if (n.level <= 3) acc.push({ id: n.id, text: n.label, depth: n.level <= 2 ? 0 : 1 });
      collectToc(n.children, acc);
    }
  }
  return acc;
}

export function prepareTopic(contents: LearningContentBlock[], topicTitle: string): PreparedTopic {
  let counter = 0;
  const nextId = () => `h${counter++}`;

  // 1. flatten every block to nodes (a block's own heading becomes a level-2 heading node)
  const perBlock = contents.map((c) => {
    const flat: FlatNode[] = [];
    if (c.heading?.trim()) {
      flat.push({ t: "heading", level: 2, text: c.heading.trim(), inline: parseInline(c.heading.trim()), id: nextId() });
    }
    const body = c.body ?? "";
    const parsed: Block[] =
      c.content_format === "plain"
        ? body.split(/\n{2,}/).filter((p) => p.trim()).map((p) => ({ t: "paragraph" as const, inline: [{ t: "text" as const, v: p.trim() }] }))
        : parseMarkdown(body);
    for (const b of parsed) flat.push(b.t === "heading" ? { ...b, id: nextId() } : b);
    return { c, flat };
  });

  // 2. hide the first heading in the document if it merely repeats the topic title
  //    (and an immediately repeated one right after it)
  const title = normalizeTitle(topicTitle);
  const firstBlockWithHeading = perBlock.findIndex((b) => b.flat.some((n) => n.t === "heading"));
  if (firstBlockWithHeading >= 0 && title) {
    const flat = perBlock[firstBlockWithHeading].flat;
    const idx = flat.findIndex((n) => n.t === "heading");
    const first = flat[idx];
    if (first.t === "heading" && normalizeTitle(first.text) === title) {
      const dropNext = flat[idx + 1]?.t === "heading" && normalizeTitle((flat[idx + 1] as HeadingNode).text) === title;
      flat.splice(idx, dropNext ? 2 : 1);
    }
  }

  // 3. group callouts + build outline + word count
  const state: GroupState = { prevWasBox: false };
  const blocks: PreparedBlock[] = perBlock.map(({ c, flat }) => ({
    id: c.id,
    nodes: groupCallouts(flat, state),
    fileUrl: c.file_url,
    videoUrl: c.video_url,
  }));
  const toc = blocks.reduce<TocItem[]>((acc, b) => collectToc(b.nodes, acc), []);
  const words = contents.reduce((n, c) => n + countWords(`${c.heading ?? ""} ${c.body ?? ""}`), 0);
  return { blocks, toc, readingMinutes: readingMinutes(words) };
}

/** Plain text of every node in document order — used by tests to prove nothing is lost or reordered. */
export function flattenText(nodes: ReaderNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.t === "callout") {
      out.push(`[${n.kind}${n.variant === "box" ? "" : ":heading"}] ${n.label}`, ...flattenText(n.children));
    } else if (n.t === "heading") out.push(n.text);
    else if (n.t === "paragraph" || n.t === "quote") out.push(inlineToText(n.inline));
    else if (n.t === "code") out.push(n.code);
    else if (n.t === "list") n.items.forEach((it) => out.push(inlineToText(it.inline)));
    else if (n.t === "table") {
      n.header.forEach((c) => out.push(inlineToText(c)));
      n.rows.forEach((r) => r.forEach((c) => out.push(inlineToText(c))));
    }
  }
  return out;
}

const GAP = { paragraph: 16, block: 20, afterHeading: 10, h2Top: 32, h3Top: 20, h4Top: 16 } as const;

/** Vertical space (px) above a node, given the node before it (null = first in its container). Spec: 32 above H2, 20 above H3, 16 between paragraphs. */
export function nodeGap(prev: ReaderNode | null, cur: ReaderNode): number {
  if (!prev) return 0;
  if (cur.t === "heading") return cur.level <= 2 ? GAP.h2Top : cur.level === 3 ? GAP.h3Top : GAP.h4Top;
  if (cur.t === "callout") {
    if (prev.t === "heading") return GAP.afterHeading; // "### 9.1 Linear Regression" → "### What is it?" reads as one unit
    if (cur.variant === "box") return cur.level <= 2 ? GAP.h2Top : GAP.block;
    return cur.level <= 2 ? GAP.h2Top : cur.level === 3 ? GAP.h3Top : GAP.h4Top; // heading-style, like a heading
  }
  if (prev.t === "heading") return GAP.afterHeading;
  if (cur.t === "paragraph" || cur.t === "quote") return GAP.paragraph;
  if (cur.t === "hr") return 28;
  return GAP.block;
}

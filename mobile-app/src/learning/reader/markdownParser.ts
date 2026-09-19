/**
 * Pure Markdown → AST for the Learning reader (no React). Same documentation
 * subset the old renderer handled — headings, paragraphs, bold/italic, inline +
 * fenced code, ordered/unordered lists, blockquotes, GFM tables, links, hr — so
 * existing content renders the same, plus a few fixes noted inline.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; c: Inline[] }
  | { t: "italic"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string | null; v: string };

export interface ListItem {
  /** 0 = top level; indented items nest (max 3). */
  level: number;
  /** Source number for ordered lists (so "2." renders 2, not a restarted 1). */
  n: number;
  inline: Inline[];
}

export type Block =
  | { t: "heading"; level: number; text: string; inline: Inline[] }
  | { t: "paragraph"; inline: Inline[] }
  | { t: "list"; ordered: boolean; items: ListItem[] }
  | { t: "code"; lang: string; code: string }
  | { t: "table"; header: Inline[][]; rows: Inline[][][] }
  | { t: "quote"; inline: Inline[] }
  | { t: "hr" };

/** Only http/https/mailto/tel + relative links are allowed (blocks javascript:, data:, file:). */
export function safeLinkUrl(raw: string): string | null {
  const u = (raw || "").trim();
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^(\/|#|\.)/.test(u)) return u;
  return null;
}

// Fix vs the old renderer: `_italic_` / `__bold__` only at word edges, so snake_case_names in prose
// aren't italicised; `*` emphasis needs non-space inside, so "2 * 3 * 4" stays literal.
const INLINE_RE =
  /(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*(?!\s)([^*]+?)(?<!\s)\*\*|(?<![\w])__(?!\s)([^_]+?)(?<!\s)__(?![\w]))|(\*(?![\s*])([^*\n]+?)(?<![\s*])\*|(?<![\w])_(?![\s_])([^_\n]+?)(?<![\s_])_(?![\w]))/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(INLINE_RE.source, "g");
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    if (m[1]) out.push({ t: "link", href: safeLinkUrl(m[3]), v: m[2] });
    else if (m[4]) out.push({ t: "code", v: m[5] });
    else if (m[6]) out.push({ t: "bold", c: parseInline(m[7] ?? m[8]) });
    else if (m[9]) out.push({ t: "italic", c: parseInline(m[10] ?? m[11]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

/** Plain text of inline nodes (for matching / TOC labels). */
export function inlineToText(nodes: Inline[]): string {
  return nodes.map((n) => (n.t === "text" || n.t === "code" ? n.v : n.t === "link" ? n.v : inlineToText(n.c))).join("");
}

const UL = /^(\s*)[-*+]\s+(.*)$/;
const OL = /^(\s*)(\d+)[.)]\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

const indentLevel = (ws: string) => Math.min(3, Math.floor(ws.replace(/\t/g, "    ").length / 2));

export function parseMarkdown(src: string): Block[] {
  const lines = (src ?? "").replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const fence = line.match(/^\s*```\s*([\w+#.-]*)\s*$/);
    if (fence) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push({ t: "code", lang: fence[1].toLowerCase(), code: buf.join("\n") });
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (h) {
      out.push({ t: "heading", level: h[1].length, text: h[2], inline: parseInline(h[2]) });
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push({ t: "hr" });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      out.push({ t: "quote", inline: parseInline(buf.join(" ")) });
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("-") && TABLE_SEP.test(lines[i + 1]) && lines[i + 1].includes("|")) {
      // Split on UNESCAPED pipes only; `\|` inside a cell is a literal pipe (e.g. "a \|\| b", "\|error\|").
      const parseRow = (r: string) =>
        r
          .replace(/^\s*\|/, "")
          .replace(/(?<!\\)\|\s*$/, "")
          .split(/(?<!\\)\|/)
          .map((c) => parseInline(c.trim().replace(/\\\|/g, "|")));
      const header = parseRow(line);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      out.push({ t: "table", header, rows });
      continue;
    }

    const ul = line.match(UL);
    const ol = line.match(OL);
    if (ul || ol) {
      const ordered = Boolean(ol);
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m = ordered ? lines[i].match(OL) : lines[i].match(UL);
        if (!m) break;
        items.push({
          level: indentLevel(m[1]),
          n: ordered ? Number(m[2]) : 0,
          inline: parseInline(ordered ? m[3] : m[2]),
        });
        i += 1;
      }
      out.push({ t: "list", ordered, items });
      continue;
    }

    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !UL.test(lines[i]) &&
      !OL.test(lines[i])
    ) {
      buf.push(lines[i].trim());
      i += 1;
    }
    out.push({ t: "paragraph", inline: parseInline(buf.join(" ")) });
  }
  return out;
}

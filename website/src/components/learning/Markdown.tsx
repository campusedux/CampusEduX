import type { ReactNode } from "react";
import Link from "next/link";
import { CodeBlock } from "./CodeBlock";
import { slugId } from "@/lib/blogText";
import { createTopicLinkState, type TopicLinkEntry, type TopicLinkState } from "@/lib/topicLinks";
import { detectCallout, detectParagraphCallout, detectQuickRevision } from "@/lib/callouts";
import { Callout, QuickRevision } from "./Callout";

export { slugId } from "@/lib/blogText";
export { createTopicLinkState } from "@/lib/topicLinks";

/** Allow only safe URL schemes for admin-authored Markdown links / images.
 *  Blocks `javascript:`, `vbscript:`, `data:` (except images), unknown schemes.
 *  Relative and fragment URLs pass through. */
function safeUrl(raw: string, kind: "link" | "image"): string {
  const url = (raw || "").trim();
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (/^(\/|#|\.|\?)/.test(url)) return url;
  if (kind === "image" && /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i.test(url)) return url;
  return kind === "image" ? "" : "#";
}

/**
 * Dependency-free Markdown → React renderer for Learning content. Renders a
 * documentation subset — headings, paragraphs, bold/italic, inline + fenced
 * code, ordered/unordered lists, blockquotes, GFM pipe tables, links, images,
 * hr. Every node is a React text node (no `dangerouslySetInnerHTML`), so admin
 * content is displayed exactly as authored with no HTML-injection surface.
 * The admin panel ships the same subset in its editor preview, so what an
 * author sees there is what ships here.
 */
export function Markdown({
  source,
  className,
  headingLevelOffset = 1,
  topicLinks,
  linkState,
  callouts = false,
}: {
  source: string;
  className?: string;
  /**
   * How much to bump each source heading level when rendering. Default `1`
   * (Learning: `##` → `<h3>` under the page's own `<h2>` block heading). Long-
   * form pages that own the `<h1>` and want `##` to render as a real `<h2>`
   * section (e.g. the blog article body) pass `0`.
   */
  headingLevelOffset?: number;
  /**
   * Internal-linking glossary (see `buildTopicLinkIndex` in `@/lib/topicLinks`).
   * When provided, the FIRST mention of another topic's title in paragraph /
   * list-item text (never headings, never inside an existing link/code span)
   * becomes a link to that topic's canonical page. Omitted by every existing
   * caller (blog body, problem statement/editorial) — behavior there is
   * unchanged.
   */
  topicLinks?: TopicLinkEntry[];
  /**
   * Shared, mutable dedup/cap state across MULTIPLE `<Markdown>` calls that
   * together make up one page (e.g. one call per content block) — a topic
   * page passes the SAME state object to every block's `<Markdown>` so a
   * given topic is linked at most once, and the total link count is capped,
   * across the whole page rather than per block. Defaults to a fresh
   * (per-call) state when omitted.
   */
  linkState?: TopicLinkState;
  /**
   * Render blockquotes that open with a known label (Tip / Note / Warning /
   * Definition / …, see `@/lib/callouts`) as styled callouts. Opt-in — only
   * Learning lessons pass it; blog / problem statements are unchanged.
   */
  callouts?: boolean;
}) {
  const linkCtx = buildLinkCtx(topicLinks, linkState);
  return <div className={className}>{renderBlocks(source ?? "", headingLevelOffset, linkCtx, callouts)}</div>;
}

// --- topic auto-linking ----------------------------------------------------
interface LinkCtx {
  regex: RegExp;
  termToEntry: Map<string, TopicLinkEntry>;
  state: TopicLinkState;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildLinkCtx(entries: TopicLinkEntry[] | undefined, state: TopicLinkState | undefined): LinkCtx | null {
  if (!entries?.length) return null;
  const termToEntry = new Map<string, TopicLinkEntry>();
  const allTerms: string[] = [];
  for (const entry of entries) {
    for (const term of entry.terms) {
      if (termToEntry.has(term)) continue;
      termToEntry.set(term, entry);
      allTerms.push(term);
    }
  }
  if (allTerms.length === 0) return null;
  // Longest term first, so multi-word phrases win over a shorter overlapping term.
  allTerms.sort((a, b) => b.length - a.length);
  const pattern = allTerms.map(escapeRegExp).join("|");
  return { regex: new RegExp(`\\b(?:${pattern})\\b`, "gi"), termToEntry, state: state ?? createTopicLinkState() };
}

/** Splits the PLAIN STRING nodes of an already-tokenized `renderInline()`
 *  result on glossary terms, turning the first unused mention of each topic
 *  into a link. Never touches non-string nodes (existing links/code/bold/
 *  italic/images), so it can never nest inside them or corrupt a code span. */
function applyTopicLinks(nodes: ReactNode[], ctx: LinkCtx | null, keyBase: string): ReactNode[] {
  if (!ctx || ctx.state.linksLeft <= 0) return nodes;
  const out: ReactNode[] = [];
  let idx = 0;
  for (const node of nodes) {
    if (typeof node !== "string") {
      out.push(node);
      continue;
    }
    let last = 0;
    ctx.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while (ctx.state.linksLeft > 0 && (m = ctx.regex.exec(node))) {
      const matched = m[0];
      const entry = ctx.termToEntry.get(matched.toLowerCase());
      if (!entry || ctx.state.usedTopics.has(entry.topicKey)) continue;
      if (m.index > last) out.push(node.slice(last, m.index));
      out.push(
        <Link
          key={`${keyBase}-tl${idx++}`}
          href={entry.href}
          className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        >
          {matched}
        </Link>,
      );
      ctx.state.usedTopics.add(entry.topicKey);
      ctx.state.linksLeft -= 1;
      last = m.index + matched.length;
    }
    if (last < node.length) out.push(node.slice(last));
  }
  return out;
}

// --- inline ----------------------------------------------------------------
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re =
    /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*|__([^_]+)__)|(\*([^*]+)\*|_([^_]+)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-i${i++}`;
    if (m[1]) {
      // eslint-disable-next-line @next/next/no-img-element -- author-supplied host, not allow-listed for next/image
      if (safeUrl(m[3], "image")) nodes.push(<img key={key} src={safeUrl(m[3], "image")} alt={m[2]} loading="lazy" className="my-3 max-w-full rounded-xl border border-line" />);
    } else if (m[4]) {
      const safe = safeUrl(m[6], "link");
      const external = /^https?:\/\//i.test(safe);
      nodes.push(
        <a
          key={key}
          href={safe}
          {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
          className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        >
          {m[5]}
        </a>,
      );
    } else if (m[7]) {
      nodes.push(
        <code key={key} className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
          {m[8]}
        </code>,
      );
    } else if (m[9]) {
      nodes.push(<strong key={key} className="font-semibold text-ink">{m[10] ?? m[11]}</strong>);
    } else if (m[12]) {
      nodes.push(<em key={key}>{m[13] ?? m[14]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// --- blocks --------------------------------------------------------------
function renderBlocks(
  src: string,
  headingLevelOffset = 1,
  linkCtx: LinkCtx | null = null,
  callouts = false,
): ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    const fence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(<CodeBlock key={`b${k++}`} code={buf.join("\n")} lang={lang} />);
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const Tag = `h${Math.min(Math.max(level + headingLevelOffset, 1), 6)}` as unknown as keyof JSX.IntrinsicElements;
      const cls = [
        "mt-8 mb-3 text-2xl font-bold text-ink",
        "mt-7 mb-2.5 text-xl font-bold text-ink",
        "mt-6 mb-2 text-lg font-semibold text-ink",
        "mt-5 mb-2 text-base font-semibold text-ink",
        "mt-4 mb-1.5 text-sm font-semibold text-ink",
        "mt-4 mb-1.5 text-sm font-semibold text-ink-muted",
      ][level - 1];
      out.push(
        <Tag key={`b${k++}`} id={slugId(h[2])} className={`scroll-mt-24 ${cls}`}>
          {renderInline(h[2], `b${k}`)}
        </Tag>,
      );
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push(<hr key={`b${k++}`} className="my-6 border-line" />);
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      const callout = callouts ? detectCallout(buf.join(" ")) : null;
      if (callout) {
        out.push(
          <Callout key={`b${k++}`} variant={callout.variant} label={callout.label}>
            {/* No topic auto-links here — plain blockquotes never had them either. */}
            {renderInline(callout.body, `b${k}`)}
          </Callout>,
        );
        continue;
      }
      out.push(
        <blockquote key={`b${k++}`} className="my-4 border-l-4 border-primary/30 bg-primary-50/40 py-2 pl-4 pr-3 text-ink-muted">
          {renderInline(buf.join(" "), `b${k}`)}
        </blockquote>,
      );
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const parseRow = (r: string) =>
        r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
      const header = parseRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      out.push(
        <div key={`b${k++}`} className="my-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {header.map((c, ci) => (
                  <th key={ci} className="border-b border-line bg-primary-50/50 px-3 py-2 text-left font-semibold text-ink">
                    {renderInline(c, `th${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="odd:bg-card even:bg-surface/60">
                  {r.map((c, ci) => (
                    <td key={ci} className="border-b border-line px-3 py-2 text-ink-muted last:border-r-0">
                      {renderInline(c, `td${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    const olMatch = line.match(/^(\s*)\d+[.)]\s+(.*)$/);
    if (ulMatch || olMatch) {
      const ordered = Boolean(olMatch);
      const items: ReactNode[] = [];
      while (i < lines.length) {
        const um = lines[i].match(/^(\s*)[-*+]\s+(.*)$/);
        const om = lines[i].match(/^(\s*)\d+[.)]\s+(.*)$/);
        const item = ordered ? om : um;
        if (!item) break;
        items.push(
          <li key={`li${i}`} className="py-0.5 leading-relaxed">
            {applyTopicLinks(renderInline(item[2], `li${i}`), linkCtx, `li${i}`)}
          </li>,
        );
        i += 1;
      }
      out.push(
        ordered ? (
          <ol key={`b${k++}`} className="my-3 ml-5 list-decimal space-y-1 text-ink-muted marker:text-ink-faint">
            {items}
          </ol>
        ) : (
          <ul key={`b${k++}`} className="my-3 ml-5 list-disc space-y-1 text-ink-muted marker:text-ink-faint">
            {items}
          </ul>
        ),
      );
      continue;
    }

    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(\s*)[-*+]\s+/.test(lines[i]) &&
      !/^(\s*)\d+[.)]\s+/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    const revision = callouts ? detectQuickRevision(buf) : null;
    if (revision) {
      out.push(
        <QuickRevision key={`b${k++}`} lines={revision.map((r, ri) => ({ label: r.label, body: renderInline(r.body, `b${k}-r${ri}`) }))} />,
      );
      continue;
    }
    const paraCallout = callouts ? detectParagraphCallout(buf.join(" ")) : null;
    if (paraCallout) {
      out.push(
        <Callout key={`b${k++}`} variant={paraCallout.variant} label={paraCallout.label} subtle={paraCallout.subtle}>
          {/* Was a paragraph → keeps the paragraph's topic auto-linking. */}
          {applyTopicLinks(renderInline(paraCallout.body, `b${k}`), linkCtx, `b${k}`)}
        </Callout>,
      );
      continue;
    }
    out.push(
      <p key={`b${k++}`} className="my-3 leading-7 text-ink-muted">
        {applyTopicLinks(renderInline(buf.join(" "), `b${k}`), linkCtx, `b${k}`)}
      </p>,
    );
  }

  return out;
}


export default Markdown;

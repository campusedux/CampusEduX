import type { ReactNode } from "react";
import Link from "next/link";
import { CodeBlock } from "./CodeBlock";
import { slugId } from "@/lib/blogText";
import { createTopicLinkState, type TopicLinkEntry, type TopicLinkState } from "@/lib/topicLinks";
import { detectCallout, detectParagraphCallout, detectQuickRevision } from "@/lib/callouts";
import { Callout, QuickRevision } from "./Callout";
import { detectLessonStructure, lessonSectionKind, sectionFrame, splitHeadingNumber, topicHeadingPrefixes, type LessonSectionKind, type LessonStructure } from "@/lib/lessonSections";
import { KeyPointItem, LessonHeading, LessonSectionFrame, NumberChip, PracticeAnswer, PracticeQuestion } from "./LessonSection";

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
  sections = false,
  sectionBody,
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
  /**
   * Lesson section treatment (see `@/lib/lessonSections`): when the source
   * follows the lesson template (≥2 recognised headings), headings get a kind
   * icon chip, and Key Points / Practice / code sections are framed. Any other
   * source renders exactly as without it. Opt-in — lesson pages only.
   */
  sections?: boolean;
  /** Render the whole source as the body of that card (a block whose own heading is "Practice Problems"). */
  sectionBody?: "practice" | "keypoints";
}) {
  const linkCtx = buildLinkCtx(topicLinks, linkState);
  const src = source ?? "";
  const topicPrefixes = sections && !sectionBody ? topicHeadingPrefixes(src) : undefined;
  const structure = topicPrefixes ? detectLessonStructure(src, topicPrefixes) : null;
  // Outside the lesson template, a "Key Points" / "Practice" heading still gets its card.
  const loneCards = sections && !sectionBody && !structure;
  return (
    <div className={className}>
      {renderBlocks(src, { headingLevelOffset, linkCtx, callouts, structure, topicPrefixes, loneCards, body: sectionBody })}
    </div>
  );
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
interface BlockOpts {
  headingLevelOffset: number;
  linkCtx: LinkCtx | null;
  callouts: boolean;
  /** Set when the source follows the lesson template — enables section headings / frames. */
  structure: LessonStructure | null;
  /** Topic-name heading prefixes of the whole source (see `topicHeadingPrefixes`). */
  topicPrefixes?: ReadonlySet<string>;
  /** No lesson template, but still frame Key Points / Practice sections as cards. */
  loneCards: boolean;
  /** Rendering inside a Practice / Key Points card. */
  body?: "practice" | "keypoints";
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const CHAPTER_KINDS = new Set<LessonSectionKind>(["practice", "keypoints", "mistakes", "interview", "revision"]);
const HR = /^(-{3,}|\*{3,}|_{3,})$/;

/** Index of the next heading at `level` or shallower (outside code fences), or `lines.length`. */
function sectionEnd(lines: string[], from: number, level: number): number {
  let inFence = false;
  for (let j = from; j < lines.length; j += 1) {
    if (/^```/.test(lines[j])) inFence = !inFence;
    else if (!inFence) {
      const h = lines[j].match(HEADING);
      if (h && h[1].length <= level) return j;
    }
  }
  return lines.length;
}

function renderBlocks(src: string, opts: BlockOpts): ReactNode[] {
  const { headingLevelOffset, linkCtx, callouts } = opts;
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

    const h = line.match(HEADING);
    if (h) {
      const level = h[1].length;
      const Tag = `h${Math.min(Math.max(level + headingLevelOffset, 1), 6)}` as unknown as keyof JSX.IntrinsicElements;
      const { number, title } = splitHeadingNumber(h[2]);

      // Inside a Practice card, "### 1. Question" + its body = one numbered question.
      if (opts.body === "practice" && number) {
        const end = sectionEnd(lines, i + 1, level);
        out.push(
          <PracticeQuestion key={`b${k++}`} number={number}>
            <Tag id={slugId(h[2])} className="scroll-mt-24 text-base font-semibold text-ink">
              {renderInline(title, `b${k}`)}
            </Tag>
            {renderBlocks(lines.slice(i + 1, end).join("\n"), opts)}
          </PracticeQuestion>,
        );
        i = end;
        continue;
      }

      if (opts.structure || opts.loneCards) {
        const { structure } = opts;
        const end = sectionEnd(lines, i + 1, level);
        let kind = lessonSectionKind(h[2], lines.slice(i + 1, end), opts.topicPrefixes);
        if (!structure && sectionFrame(kind) !== "card") kind = null;
        // Above the section level (Python's `## 1. What are Loops?` chapters) only the
        // end-of-chapter kinds keep their treatment; the rest are chapter headings.
        const chapter = structure ? level < structure.level : false;
        if (chapter && kind && !CHAPTER_KINDS.has(kind)) kind = null;
        if (chapter && !kind) {
          out.push(
            <LessonHeading key={`b${k++}`} as={Tag} id={slugId(h[2])} kind={null} number={number} chapter>
              {renderInline(title, `b${k}`)}
            </LessonHeading>,
          );
          i += 1;
          continue;
        }
        if (kind || (structure && level === structure.level)) {
          const frame = sectionFrame(kind);
          const heading = (
            <LessonHeading key={`b${k++}`} as={Tag} id={slugId(h[2])} kind={kind} number={number} framed={Boolean(frame)}>
              {renderInline(title, `b${k}`)}
            </LessonHeading>
          );
          if (!frame || !kind) {
            out.push(heading);
            i += 1;
            continue;
          }
          // A trailing `---` separates this section from the next: keep it, but outside the frame.
          let bodyEnd = end;
          let trailingHr = false;
          while (bodyEnd > i + 1 && (!lines[bodyEnd - 1].trim() || HR.test(lines[bodyEnd - 1].trim()))) {
            if (lines[bodyEnd - 1].trim()) trailingHr = true;
            bodyEnd -= 1;
          }
          out.push(
            <LessonSectionFrame key={`b${k++}`} kind={kind}>
              {heading}
              {renderBlocks(lines.slice(i + 1, bodyEnd).join("\n"), {
                ...opts,
                structure: null,
                loneCards: false,
                body: kind === "practice" ? "practice" : kind === "keypoints" ? "keypoints" : undefined,
              })}
            </LessonSectionFrame>,
          );
          if (trailingHr) out.push(<hr key={`b${k++}`} className="my-6 border-line" />);
          i = end;
          continue;
        }
      }

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

    if (HR.test(line.trim())) {
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
    const olMatch = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (ulMatch || olMatch) {
      const ordered = Boolean(olMatch);
      // Practice card: numbered questions get number chips; Key Points card: bullets become ticks.
      const chips = ordered && opts.body === "practice";
      const ticks = !ordered && opts.body === "keypoints";
      const items: ReactNode[] = [];
      while (i < lines.length) {
        const um = lines[i].match(/^(\s*)[-*+]\s+(.*)$/);
        const om = lines[i].match(/^(\s*)(\d+)[.)]\s+(.*)$/);
        if (ordered ? !om : !um) break;
        const text = ordered ? om![3] : um![2];
        const content = applyTopicLinks(renderInline(text, `li${i}`), linkCtx, `li${i}`);
        items.push(
          chips ? (
            <li key={`li${i}`} className="flex items-start gap-3 leading-relaxed">
              <NumberChip n={om![2]} />
              <span className="min-w-0 pt-1 text-ink">{content}</span>
            </li>
          ) : ticks ? (
            <KeyPointItem key={`li${i}`}>{content}</KeyPointItem>
          ) : (
            <li key={`li${i}`} className="py-0.5 leading-relaxed">
              {content}
            </li>
          ),
        );
        i += 1;
      }
      if (chips || ticks) {
        out.push(
          chips ? (
            <ol key={`b${k++}`} className="my-4 space-y-3">
              {items}
            </ol>
          ) : (
            <ul key={`b${k++}`} className="my-3 space-y-2.5">
              {items}
            </ul>
          ),
        );
        continue;
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
    const answer = opts.body === "practice" ? buf.join(" ").match(/^\*\*Answer\s*:\s*\*\*\s*(.+)$/s) : null;
    if (answer) {
      out.push(
        <PracticeAnswer key={`b${k++}`}>{applyTopicLinks(renderInline(answer[1], `b${k}`), linkCtx, `b${k}`)}</PracticeAnswer>,
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

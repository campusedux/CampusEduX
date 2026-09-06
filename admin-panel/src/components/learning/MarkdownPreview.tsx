import type { ReactNode } from 'react';

/**
 * Dependency-free Markdown → React renderer for the admin content editor's live
 * preview. Renders a documentation subset (headings, paragraphs, bold/italic,
 * inline + fenced code, ordered/unordered lists, blockquotes, GFM pipe tables,
 * links, images, hr). Everything is a React text node — no `dangerouslySetInnerHTML`,
 * so there is no HTML-injection surface. The website ships a fuller renderer
 * (react-markdown + remark-gfm); this one only has to be faithful enough to
 * proof-read against.
 */
/** Only allow safe URL schemes in admin-authored Markdown links / images.
 *  Blocks javascript:, vbscript:, data: (except images), unknown schemes. */
function safeUrl(raw: string, kind: 'link' | 'image'): string {
  const u = (raw || '').trim();
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^(\/|#|\.|\?)/.test(u)) return u;
  if (kind === 'image' && /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i.test(u)) return u;
  return kind === 'image' ? '' : '#';
}

export function MarkdownPreview({ source, className }: { source: string; className?: string }) {
  return <div className={className}>{renderBlocks(source ?? '')}</div>;
}

// --- inline -----------------------------------------------------------------
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // order matters: images before links, code spans are literal
  const re =
    /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*|__([^_]+)__)|(\*([^*]+)\*|_([^_]+)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-i${i++}`;
    if (m[1]) {
      nodes.push(
        // Admin-authored Markdown can reference an image on any host; next/image
        // needs each host allow-listed, so a plain <img> is correct here.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key} src={safeUrl(m[3], 'image')} alt={m[2]} className="my-2 max-w-full rounded-lg border border-border" />,
      );
    } else if (m[4]) {
      nodes.push(
        <a key={key} href={safeUrl(m[6], 'link')} target="_blank" rel="noopener noreferrer nofollow" className="text-brand underline">
          {m[5]}
        </a>,
      );
    } else if (m[7]) {
      nodes.push(
        <code key={key} className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[0.85em] text-ink">
          {m[8]}
        </code>,
      );
    } else if (m[9]) {
      nodes.push(<strong key={key}>{m[10] ?? m[11]}</strong>);
    } else if (m[12]) {
      nodes.push(<em key={key}>{m[13] ?? m[14]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// --- blocks ---------------------------------------------------------------
function renderBlocks(src: string): ReactNode[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    let line = lines[i];

    // fenced code
    const fence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      out.push(
        <pre
          key={`b${k++}`}
          className="my-3 overflow-x-auto rounded-lg border border-border bg-[#0f172a] p-3 text-[13px] leading-relaxed text-slate-100"
        >
          {lang ? <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">{lang}</div> : null}
          <code className="font-mono">{buf.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // blank
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const Tag = (`h${Math.min(level + 1, 6)}` as unknown) as keyof JSX.IntrinsicElements;
      const size = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm', 'text-sm'][level - 1];
      out.push(
        <Tag key={`b${k++}`} className={`mt-4 mb-2 font-semibold text-ink ${size}`}>
          {renderInline(h[2], `b${k}`)}
        </Tag>,
      );
      i += 1;
      continue;
    }

    // hr
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push(<hr key={`b${k++}`} className="my-4 border-border" />);
      i += 1;
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(
        <blockquote key={`b${k++}`} className="my-3 border-l-4 border-brand/40 pl-4 text-ink-muted">
          {renderInline(buf.join(' '), `b${k}`)}
        </blockquote>,
      );
      continue;
    }

    // table (GFM pipe) — header row + delimiter row + body
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const parseRow = (r: string) =>
        r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
      const header = parseRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      out.push(
        <div key={`b${k++}`} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {header.map((c, ci) => (
                  <th key={ci} className="border border-border bg-surface-subtle px-2 py-1 text-left font-semibold">
                    {renderInline(c, `th${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className="border border-border px-2 py-1">
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

    // unordered / ordered list
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
          <li key={`li${i}`} className="ml-5 list-outside py-0.5">
            {renderInline(item[2], `li${i}`)}
          </li>,
        );
        i += 1;
      }
      out.push(
        ordered ? (
          <ol key={`b${k++}`} className="my-2 list-decimal space-y-0.5 text-ink-muted">
            {items}
          </ol>
        ) : (
          <ul key={`b${k++}`} className="my-2 list-disc space-y-0.5 text-ink-muted">
            {items}
          </ul>
        ),
      );
      continue;
    }

    // paragraph (gather consecutive non-blank, non-special lines)
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
    out.push(
      <p key={`b${k++}`} className="my-2 leading-relaxed text-ink-muted">
        {renderInline(buf.join(' '), `b${k}`)}
      </p>,
    );
  }

  return out;
}

export default MarkdownPreview;

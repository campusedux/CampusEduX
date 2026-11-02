import type { LegalDocument, LegalSection } from "./types";

/**
 * Renders an already-interpolated `LegalDocument` body (intro + sections +
 * subsections + bullets) with the site's ink/‑muted typography. Plain text
 * only — never dangerouslySetInnerHTML; the content files hold no markup.
 */

/** Policy URLs remain usable links; content is still rendered as escaped text. */
function LegalText({ text }: { text: string }) {
  return <>{text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
    if (!/^https?:\/\//.test(part)) return part;
    const href = part.replace(/[.,;]+$/, "");
    return <span key={i}><a href={href} className="text-primary underline underline-offset-2">{href}</a>{part.slice(href.length)}</span>;
  })}</>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-muted">
      {items.map((item, i) => (
        <li key={i}><LegalText text={item} /></li>
      ))}
    </ul>
  );
}

function Section({ section }: { section: LegalSection }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold tracking-tight text-ink">{section.heading}</h2>
      {section.body?.map((p, i) => (
        <p key={i} className="mt-2 text-[15px] leading-relaxed text-ink-muted">
          <LegalText text={p} />
        </p>
      ))}
      {section.bullets && <Bullets items={section.bullets} />}
      {section.subsections?.map((sub, i) => (
        <div key={i} className="mt-4">
          <h3 className="text-[15px] font-semibold text-ink">{sub.heading}</h3>
          {sub.body?.map((p, j) => (
            <p key={j} className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
              <LegalText text={p} />
            </p>
          ))}
          {sub.bullets && <Bullets items={sub.bullets} />}
        </div>
      ))}
    </section>
  );
}

/** Just the numbered sections — no intro / divider. Used where a page puts its
 *  own content (e.g. the Contact form) between the intro and the sections. */
export function LegalSections({ doc }: { doc: LegalDocument }) {
  return (
    <>
      {doc.sections.map((section, i) => (
        <Section key={i} section={section} />
      ))}
    </>
  );
}

export function LegalProse({ doc }: { doc: LegalDocument }) {
  return (
    <div>
      {doc.intro.map((p, i) => (
        <p key={i} className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          <LegalText text={p} />
        </p>
      ))}
      <hr className="mt-6 border-line" />
      <LegalSections doc={doc} />
    </div>
  );
}

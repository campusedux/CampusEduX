import type { CSSProperties } from "react";
import type { ResumeRenderModel, ResumeRenderBlock, RenderEntry } from "@/lib/resumeBuilder/renderModel";
import type { TemplateSpec } from "@/lib/resumeBuilder/templateSpecs";

/**
 * THE resume renderer. One component, four visually distinct designs driven
 * entirely by `spec` (lib/resumeBuilder/templateSpecs.ts). Every HTML surface
 * that shows a resume uses this exact component:
 *   - the editor's live preview
 *   - the public /r/[token] share page
 *   - the gallery thumbnail (scaled down)
 *   - the full-screen template preview modal
 * so what you see in the editor is what gets shared and what the PDF/DOCX
 * exporters (which read the same `spec`) aim to match.
 *
 * Pure and server-safe: no "use client", no hooks, no browser APIs. It always
 * renders at a fixed 794px width (A4 @ 96dpi); callers scale it to fit.
 */

export const SHEET_WIDTH_PX = 794;
export const SHEET_MIN_HEIGHT_PX = 1123; // one A4 page @ 96dpi

export interface ResumeDocumentViewProps {
  model: ResumeRenderModel;
  spec: TemplateSpec;
  accentColor: string;
  /** `screen` = a little more breathing room; `print` = tighter, closer to the PDF. */
  density?: "screen" | "print";
  className?: string;
  style?: CSSProperties;
}

const INK = "#111827";
const INK_MUTED = "#374151";
const INK_FAINT = "#6B7280";
const HAIRLINE = "#E5E7EB";

const BULLET_RE = /^\s*[•\-–*·]\s+/;

export function ResumeDocumentView({ model, spec, accentColor, density = "screen", className, style }: ResumeDocumentViewProps) {
  const t = spec.type;
  const showAccent = spec.accent !== "none";
  const accent = showAccent ? accentColor : INK_MUTED;
  const pad = spec.header === "accent-band" ? 0 : t.padding + (density === "screen" ? 4 : 0);

  const sheetStyle: CSSProperties = {
    width: SHEET_WIDTH_PX,
    minHeight: SHEET_MIN_HEIGHT_PX,
    background: "#fff",
    color: INK,
    fontFamily: spec.fontFamily,
    fontSize: t.body,
    lineHeight: t.lineHeight,
    padding: pad,
    boxSizing: "border-box",
    ...style,
  };

  return (
    <div className={className ? `theme-light ${className}` : "theme-light"} style={sheetStyle}>
      <Header model={model} spec={spec} accent={accent} showAccent={showAccent} />
      <div style={{ padding: spec.header === "accent-band" ? `${t.padding + 4}px ${t.padding + 8}px` : 0 }}>
        {model.blocks.map((block) => (
          <Section key={block.id} block={block} spec={spec} accent={accent} showAccent={showAccent} />
        ))}
      </div>
    </div>
  );
}

function Header({ model, spec, accent, showAccent }: { model: ResumeRenderModel; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  const t = spec.type;
  const name = (
    <div style={{ fontSize: t.name, fontWeight: spec.header === "left-plain" ? 400 : 700, letterSpacing: spec.header === "centered-serif" ? 0.5 : -0.2 }}>
      {model.fullName}
    </div>
  );
  const title = model.jobTitle ? (
    <div
      style={{
        fontSize: t.title,
        fontWeight: 500,
        marginTop: 3,
        color: spec.header === "accent-band" ? "rgba(255,255,255,0.92)" : showAccent && spec.accent === "bold" ? accent : INK_MUTED,
        letterSpacing: spec.header === "centered-serif" ? 1.2 : 0,
        textTransform: spec.header === "centered-serif" ? "uppercase" : "none",
      }}
    >
      {model.jobTitle}
    </div>
  ) : null;
  const contact = model.contactLine ? (
    <div style={{ fontSize: t.small, marginTop: 6, color: spec.header === "accent-band" ? "rgba(255,255,255,0.8)" : INK_FAINT }}>
      {model.contactLine}
    </div>
  ) : null;

  if (spec.header === "accent-band") {
    return (
      <div style={{ background: accent, color: "#fff", padding: `${t.padding}px ${t.padding + 8}px` }}>
        {name}
        {title}
        {contact}
      </div>
    );
  }
  if (spec.header === "centered-serif") {
    return (
      <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: `1.5px solid ${INK}`, marginBottom: t.sectionGap }}>
        {name}
        {title}
        {contact}
      </div>
    );
  }
  return (
    <div
      style={{
        paddingBottom: 12,
        borderBottom: spec.header === "left-accent" ? `2px solid ${accent}` : `1px solid ${HAIRLINE}`,
        marginBottom: t.sectionGap,
      }}
    >
      {name}
      {title}
      {contact}
    </div>
  );
}

function Heading({ text, spec, accent, showAccent }: { text: string; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  const t = spec.type;
  const common: CSSProperties = {
    fontSize: t.heading,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: spec.heading === "plain-caps" ? "0.14em" : "0.06em",
    marginBottom: 6,
  };
  if (spec.heading === "full-underline") {
    return <div style={{ ...common, color: showAccent && spec.accent === "bold" ? accent : "#000", borderBottom: `1.5px solid #000`, paddingBottom: 3 }}>{text}</div>;
  }
  if (spec.heading === "plain-caps") {
    return <div style={{ ...common, fontWeight: 600, color: INK_FAINT }}>{text}</div>;
  }
  if (spec.heading === "bar") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ display: "inline-block", width: 4, height: t.heading + 2, background: accent, borderRadius: 2 }} />
        <span style={{ ...common, marginBottom: 0, color: INK }}>{text}</span>
      </div>
    );
  }
  return <div style={{ ...common, color: showAccent ? accent : INK, borderBottom: `1px solid ${showAccent ? `${accent}55` : HAIRLINE}`, paddingBottom: 3 }}>{text}</div>;
}

function BulletText({ line, spec, accent, showAccent }: { line: string; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  if (BULLET_RE.test(line)) {
    return (
      <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
        <span style={{ color: showAccent ? accent : INK_FAINT, flexShrink: 0 }}>{spec.bulletChar || "•"}</span>
        <span style={{ color: INK_MUTED }}>{line.replace(BULLET_RE, "")}</span>
      </div>
    );
  }
  return <p style={{ margin: "0 0 2px", color: INK_MUTED }}>{line}</p>;
}

function Entry({ entry, spec, accent, showAccent }: { entry: RenderEntry; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  const t = spec.type;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <span style={{ fontWeight: 700, color: INK }}>
          {entry.title}
          {entry.subtitle ? <span style={{ fontWeight: 500, color: INK_MUTED }}> — {entry.subtitle}</span> : null}
        </span>
        {entry.meta ? <span style={{ fontSize: t.small, color: INK_FAINT, whiteSpace: "nowrap", flexShrink: 0 }}>{entry.meta}</span> : null}
      </div>
      {entry.bullets.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginTop: 1 }}>
          <span style={{ color: showAccent ? accent : INK_FAINT, flexShrink: 0 }}>{spec.bulletChar || "•"}</span>
          <span style={{ color: INK_MUTED }}>{b}</span>
        </div>
      ))}
      {entry.tags.length > 0 ? <div style={{ marginTop: 2, fontSize: t.small, color: INK_FAINT }}>{entry.tags.join(" · ")}</div> : null}
      {entry.url ? <div style={{ marginTop: 1, fontSize: t.small, color: showAccent ? accent : INK_FAINT }}>{entry.url}</div> : null}
    </div>
  );
}

function TagChips({ chips, spec, accent, showAccent }: { chips: string[]; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {chips.map((item, i) => (
        <span
          key={i}
          style={{
            fontSize: spec.type.small,
            padding: "2px 8px",
            borderRadius: 6,
            background: showAccent ? `${accent}14` : "#F3F4F6",
            color: showAccent ? accent : INK_MUTED,
            border: showAccent ? `1px solid ${accent}33` : `1px solid ${HAIRLINE}`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({ block, spec, accent, showAccent }: { block: ResumeRenderBlock; spec: TemplateSpec; accent: string; showAccent: boolean }) {
  const t = spec.type;
  return (
    <section style={{ marginTop: t.sectionGap }}>
      <Heading text={block.heading} spec={spec} accent={accent} showAccent={showAccent} />

      {block.variant === "entries" && block.entries ? (
        block.entries.map((entry, i) => <Entry key={i} entry={entry} spec={spec} accent={accent} showAccent={showAccent} />)
      ) : block.variant === "tags" && block.chips ? (
        spec.skills === "chips" ? (
          <TagChips chips={block.chips} spec={spec} accent={accent} showAccent={showAccent} />
        ) : (
          block.lines.map((line, i) => (
            <p key={i} style={{ margin: "0 0 2px", color: INK_MUTED }}>
              {line}
            </p>
          ))
        )
      ) : block.variant === "links" && block.links ? (
        block.links.map((l, i) => (
          <p key={i} style={{ margin: "0 0 2px", color: INK_MUTED }}>
            {l.label ? <span style={{ fontWeight: 600, color: INK }}>{l.label}: </span> : null}
            <span style={{ color: showAccent ? accent : INK_MUTED }}>{l.url}</span>
          </p>
        ))
      ) : (
        block.lines.map((line, i) => <BulletText key={i} line={line} spec={spec} accent={accent} showAccent={showAccent} />)
      )}
    </section>
  );
}

export default ResumeDocumentView;

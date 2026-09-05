import { buildResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import type { ResumeLayout } from "@/lib/resumeBuilder/sections";
import type { ResumeDocument } from "@/lib/resumeBuilder/types";

/**
 * Read-only rendered preview, live-updating from the same state the editor
 * mutates. Renders from buildResumeRenderModel() — the same model the PDF
 * and DOCX exports (Phase 5) render from — so this preview can't drift out
 * of sync with what gets downloaded.
 */
export default function ResumePreview({
  resume,
  layout,
  accentColor,
}: {
  resume: ResumeDocument;
  layout: ResumeLayout;
  accentColor: string;
}) {
  const model = buildResumeRenderModel(resume, layout);

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-card" style={{ borderTop: `4px solid ${accentColor}` }}>
      <h2 className="text-xl font-bold text-ink">{model.fullName}</h2>
      {model.jobTitle && (
        <p className="text-sm font-medium" style={{ color: accentColor }}>
          {model.jobTitle}
        </p>
      )}
      {model.contactLine && <p className="mt-1 text-xs text-ink-faint">{model.contactLine}</p>}

      <div className="mt-4 space-y-4">
        {model.blocks.map((block) => (
          <div key={block.key}>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: accentColor }}>
              {block.heading}
            </h3>
            {block.lines.map((line, index) => (
              <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

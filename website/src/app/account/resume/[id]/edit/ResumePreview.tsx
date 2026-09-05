import { SECTION_LABELS, type ManageableSectionKey, type ResumeLayout } from "@/lib/resumeBuilder/sections";
import type { ResumeDocument, ResumeFreeformSectionKey } from "@/lib/resumeBuilder/types";

const FREEFORM_KEYS = new Set<ManageableSectionKey>(["summary", "experience", "projects", "certifications", "achievements", "languages", "references"]);

/**
 * Read-only rendered preview, live-updating from the same state the editor
 * mutates. This is the "source of truth" the PDF/DOCX renderers (Phase 5)
 * must visually match.
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
  const p = resume.personalDetails;
  const contactLine = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(" · ");
  const visible = layout.order.filter((key) => !layout.hidden.includes(key));

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-card" style={{ borderTop: `4px solid ${accentColor}` }}>
      <h2 className="text-xl font-bold text-ink">{p.fullName || "Your Name"}</h2>
      {p.jobTitle && (
        <p className="text-sm font-medium" style={{ color: accentColor }}>
          {p.jobTitle}
        </p>
      )}
      {contactLine && <p className="mt-1 text-xs text-ink-faint">{contactLine}</p>}

      <div className="mt-4 space-y-4">
        {visible.map((key) => (
          <PreviewSection key={key} sectionKey={key} resume={resume} accentColor={accentColor} />
        ))}
      </div>
    </div>
  );
}

function PreviewSection({ sectionKey, resume, accentColor }: { sectionKey: ManageableSectionKey; resume: ResumeDocument; accentColor: string }) {
  const heading = (
    <h3 className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: accentColor }}>
      {SECTION_LABELS[sectionKey]}
    </h3>
  );

  if (sectionKey === "education") {
    if (resume.education.length === 0) return null;
    return (
      <div>
        {heading}
        {resume.education.map((e) => (
          <p key={e.id} className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">{e.degree}</span> — {e.institution} ({e.startYear}-{e.endYear})
            {e.percentage ? `, ${e.percentage}%` : ""}
          </p>
        ))}
      </div>
    );
  }

  if (sectionKey === "skills") {
    const all = [...resume.skills.technical, ...resume.skills.soft];
    if (all.length === 0) return null;
    return (
      <div>
        {heading}
        <p className="text-sm text-ink-muted">{all.join(", ")}</p>
      </div>
    );
  }

  if (FREEFORM_KEYS.has(sectionKey)) {
    const content = resume.sections[sectionKey as ResumeFreeformSectionKey];
    if (!content?.trim()) return null;
    return (
      <div>
        {heading}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">{content}</p>
      </div>
    );
  }

  return null;
}

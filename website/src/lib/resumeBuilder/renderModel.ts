import { SECTION_LABELS, normalizeLayout, type ManageableSectionKey, type ResumeLayout } from "./sections";
import type { ResumeDocument, ResumeFreeformSectionKey } from "./types";

export interface ResumeRenderBlock {
  key: ManageableSectionKey;
  heading: string;
  /** Already-formatted plain-text lines, one per row — no markup, so every renderer (HTML/PDF/DOCX) escapes/wraps it its own way. */
  lines: string[];
}

export interface ResumeRenderModel {
  fullName: string;
  jobTitle: string;
  contactLine: string;
  blocks: ResumeRenderBlock[];
}

/**
 * The single source of truth for "what does this resume actually contain,
 * in what order" — the HTML live preview, the PDF export and the DOCX
 * export all render from this same model instead of each re-implementing
 * section iteration/formatting, so they can't silently drift apart.
 *
 * `layoutOverride` lets the live editor pass its in-memory (not-yet-saved)
 * section order/visibility instead of the last-persisted `resume.layout` —
 * exports and any other read-only consumer just omit it and get the
 * persisted layout normalized automatically.
 */
export function buildResumeRenderModel(resume: ResumeDocument, layoutOverride?: ResumeLayout): ResumeRenderModel {
  const p = resume.personalDetails;
  const contactLine = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(" · ");
  const layout = layoutOverride ?? normalizeLayout(resume.layout);
  const visible = layout.order.filter((key) => !layout.hidden.includes(key));

  const blocks: ResumeRenderBlock[] = [];
  for (const key of visible) {
    if (key === "education") {
      if (resume.education.length === 0) continue;
      blocks.push({
        key,
        heading: SECTION_LABELS.education,
        lines: resume.education.map(
          (e) => `${e.degree} — ${e.institution} (${e.startYear}-${e.endYear})${e.percentage ? `, ${e.percentage}%` : ""}`,
        ),
      });
      continue;
    }

    if (key === "skills") {
      const all = [...resume.skills.technical, ...resume.skills.soft];
      if (all.length === 0) continue;
      blocks.push({ key, heading: SECTION_LABELS.skills, lines: [all.join(", ")] });
      continue;
    }

    const content = resume.sections[key as ResumeFreeformSectionKey];
    if (!content?.trim()) continue;
    blocks.push({ key, heading: SECTION_LABELS[key], lines: content.split("\n") });
  }

  return { fullName: p.fullName || "Your Name", jobTitle: p.jobTitle, contactLine, blocks };
}

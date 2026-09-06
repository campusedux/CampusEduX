// The single source of truth for how each resume template LOOKS. Every
// surface that renders a resume reads its design decisions from here:
//   - the HTML renderer  <ResumeDocumentView>  (editor preview, share page,
//     gallery thumbnail, full-screen preview modal)
//   - the PDF export      lib/resumeBuilder/pdfDocument.tsx
//   - the DOCX export     lib/resumeBuilder/docxBuilder.ts
// so the four templates can't silently collapse back into "one layout, four
// accent colours" (which is exactly what they were before this file existed).

export type TemplateId = "modern" | "professional" | "minimal" | "creative";

export const TEMPLATE_IDS: TemplateId[] = ["modern", "professional", "minimal", "creative"];

export interface TemplateSpec {
  id: TemplateId;
  label: string;
  /** Shown on the gallery filter + preview modal, and drives the "ATS Friendly" filter. */
  atsFriendly: boolean;
  blurb: string;
  /** CSS font stack for the HTML renderer. */
  fontFamily: string;
  /** Standard @react-pdf font family — must be one PDF ships without registration. */
  pdfFont: "Helvetica" | "Times-Roman";
  /** Header block treatment. */
  header: "left-accent" | "centered-serif" | "left-plain" | "accent-band";
  /** Section-heading treatment. */
  heading: "rule" | "full-underline" | "plain-caps" | "bar";
  /** How much the accent colour is used. `none` ignores accentColor entirely. */
  accent: "bold" | "minimal" | "none" | "band";
  /** Skills presentation. */
  skills: "inline" | "chips";
  /** Whether entry bullet lines get a leading "• ". */
  bulletChar: "•" | "–" | "";
  /**
   * Typographic scale in px, calibrated for the HTML renderer at 100% zoom
   * where the A4 sheet is 794px wide (210mm @ 96dpi). The PDF/DOCX builders
   * scale these to their own units.
   */
  type: {
    name: number;
    title: number;
    heading: number;
    body: number;
    small: number;
    lineHeight: number;
    /** px of vertical space before each section. */
    sectionGap: number;
    /** px of page padding on the A4 sheet. */
    padding: number;
  };
}

const SANS = '"Inter", "Helvetica Neue", Arial, system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", Times, serif';

export const TEMPLATE_SPECS: Record<TemplateId, TemplateSpec> = {
  modern: {
    id: "modern",
    label: "Modern",
    atsFriendly: true,
    blurb: "Strong visual hierarchy with a clean accent header — a safe, contemporary default.",
    fontFamily: SANS,
    pdfFont: "Helvetica",
    header: "left-accent",
    heading: "rule",
    accent: "bold",
    skills: "chips",
    bulletChar: "•",
    type: { name: 30, title: 13.5, heading: 11.5, body: 10.5, small: 9, lineHeight: 1.5, sectionGap: 20, padding: 44 },
  },
  professional: {
    id: "professional",
    label: "Professional",
    atsFriendly: true,
    blurb: "Traditional single-column corporate layout — conservative, recruiter-familiar, ATS-safe.",
    fontFamily: SERIF,
    pdfFont: "Times-Roman",
    header: "centered-serif",
    heading: "full-underline",
    accent: "minimal",
    skills: "inline",
    bulletChar: "–",
    type: { name: 26, title: 12.5, heading: 11, body: 10.5, small: 9, lineHeight: 1.5, sectionGap: 18, padding: 48 },
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    atsFriendly: true,
    blurb: "Typography-first with generous whitespace and no decoration — maximum readability.",
    fontFamily: SANS,
    pdfFont: "Helvetica",
    header: "left-plain",
    heading: "plain-caps",
    accent: "none",
    skills: "inline",
    bulletChar: "–",
    type: { name: 27, title: 12.5, heading: 10, body: 10.5, small: 9, lineHeight: 1.6, sectionGap: 24, padding: 52 },
  },
  creative: {
    id: "creative",
    label: "Creative",
    atsFriendly: false,
    blurb: "A controlled accent band and bar headings — modern and expressive, still single-column.",
    fontFamily: SANS,
    pdfFont: "Helvetica",
    header: "accent-band",
    heading: "bar",
    accent: "band",
    skills: "chips",
    bulletChar: "•",
    type: { name: 28, title: 13, heading: 11, body: 10.5, small: 9, lineHeight: 1.5, sectionGap: 20, padding: 0 },
  },
};

/** Never throws — an unknown / admin-added template id falls back to Modern. */
export function templateSpec(id: string | null | undefined): TemplateSpec {
  return TEMPLATE_SPECS[(id ?? "") as TemplateId] ?? TEMPLATE_SPECS.modern;
}

/** Merges the design spec with the row the admin actually published (name / accent / premium). */
export interface ResolvedTemplate extends TemplateSpec {
  accentColor: string;
  isPremium: boolean;
  /** admin-authored description if present, else the spec blurb. */
  description: string;
}

const DEFAULT_ACCENTS: Record<TemplateId, string> = {
  modern: "#4F39F6",
  professional: "#1E3A8A",
  minimal: "#374151",
  creative: "#DB2777",
};

export function resolveTemplate(row: {
  id: string;
  name?: string | null;
  description?: string | null;
  accent_color?: string | null;
  is_premium?: boolean | null;
}): ResolvedTemplate {
  const spec = templateSpec(row.id);
  return {
    ...spec,
    label: row.name?.trim() || spec.label,
    accentColor: row.accent_color?.trim() || DEFAULT_ACCENTS[spec.id],
    isPremium: Boolean(row.is_premium),
    description: row.description?.trim() || spec.blurb,
  };
}

/** The 4 built-in templates as ResolvedTemplate — used when the DB catalog is unreachable/empty. */
export const DEFAULT_RESOLVED_TEMPLATES: ResolvedTemplate[] = TEMPLATE_IDS.map((id) =>
  resolveTemplate({ id, accent_color: DEFAULT_ACCENTS[id] }),
);

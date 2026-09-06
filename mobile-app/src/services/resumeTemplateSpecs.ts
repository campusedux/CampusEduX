// Structural port of website/src/lib/resumeBuilder/templateSpecs.ts — the two
// platforms MUST keep identical design decisions so the mobile A4 preview,
// the on-device PDF and the website all render the same résumé the same way.
// The only mobile-specific bit is `rnFont` (React Native takes one family
// name, not a CSS stack); `fontFamily` (the CSS stack) still drives the PDF
// HTML.

import { Platform } from "react-native";

export type TemplateId = "modern" | "professional" | "minimal" | "creative";
export const TEMPLATE_IDS: TemplateId[] = ["modern", "professional", "minimal", "creative"];

export interface TemplateSpec {
  id: TemplateId;
  label: string;
  atsFriendly: boolean;
  blurb: string;
  /** CSS font stack — used by the PDF HTML. */
  fontFamily: string;
  /** RN font family (or undefined = system sans). */
  rnFont?: string;
  pdfFont: "Helvetica" | "Times-Roman";
  header: "left-accent" | "centered-serif" | "left-plain" | "accent-band";
  heading: "rule" | "full-underline" | "plain-caps" | "bar";
  accent: "bold" | "minimal" | "none" | "band";
  skills: "inline" | "chips";
  bulletChar: "•" | "–" | "";
  type: {
    name: number;
    title: number;
    heading: number;
    body: number;
    small: number;
    lineHeight: number;
    sectionGap: number;
    padding: number;
  };
}

const SANS = '"Inter", "Helvetica Neue", Arial, system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", Times, serif';
const RN_SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

export const TEMPLATE_SPECS: Record<TemplateId, TemplateSpec> = {
  modern: {
    id: "modern",
    label: "Modern",
    atsFriendly: true,
    blurb: "Strong visual hierarchy with a clean accent header — a safe, contemporary default.",
    fontFamily: SANS,
    rnFont: undefined,
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
    rnFont: RN_SERIF,
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
    rnFont: undefined,
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
    rnFont: undefined,
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

export interface ResolvedTemplate extends TemplateSpec {
  accentColor: string;
  isPremium: boolean;
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
  accentColor?: string | null;
  is_premium?: boolean | null;
}): ResolvedTemplate {
  const spec = templateSpec(row.id);
  return {
    ...spec,
    label: row.name?.trim() || spec.label,
    accentColor: (row.accent_color ?? row.accentColor)?.trim() || DEFAULT_ACCENTS[spec.id],
    isPremium: Boolean(row.is_premium),
    description: row.description?.trim() || spec.blurb,
  };
}

export const DEFAULT_RESOLVED_TEMPLATES: ResolvedTemplate[] = TEMPLATE_IDS.map((id) =>
  resolveTemplate({ id, accent_color: DEFAULT_ACCENTS[id] }),
);

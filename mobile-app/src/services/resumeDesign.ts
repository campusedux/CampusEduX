// Structural port of website/src/lib/resumeBuilder/design.ts — keep the
// clamps identical so a résumé's design renders the same on both platforms
// (and in the PDF). `ResumeDesign` itself lives in src/types/resume.types.ts.

import { Platform } from "react-native";
import type { ResumeDesign } from "@/types";
import type { TemplateSpec } from "@/services/resumeTemplateSpecs";

export type DesignFontFamily = "sans" | "serif" | "slab";
export type DesignSize = "s" | "m" | "l";
export type DesignSpacing = "compact" | "normal" | "relaxed";
export type DesignMargin = "narrow" | "normal" | "wide";
export type DesignHeading = "template" | "rule" | "full-underline" | "plain-caps" | "bar";

export const DESIGN_FONT_LABELS: Record<DesignFontFamily, string> = { sans: "Sans", serif: "Serif", slab: "Slab serif" };
export const DESIGN_SIZE_LABELS: Record<DesignSize, string> = { s: "Small", m: "Medium", l: "Large" };
export const DESIGN_SPACING_LABELS: Record<DesignSpacing, string> = { compact: "Compact", normal: "Normal", relaxed: "Relaxed" };
export const DESIGN_MARGIN_LABELS: Record<DesignMargin, string> = { narrow: "Narrow", normal: "Normal", wide: "Wide" };
export const DESIGN_HEADING_LABELS: Record<DesignHeading, string> = {
  template: "Template default",
  rule: "Accent rule",
  "full-underline": "Underline",
  "plain-caps": "Plain caps",
  bar: "Accent bar",
};

export const ACCENT_SWATCHES = ["#4F39F6", "#1E3A8A", "#0F766E", "#B45309", "#BE123C", "#7C3AED", "#374151", "#DB2777"];

const RN_SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });
const RN_FONT: Record<DesignFontFamily, string | undefined> = { sans: undefined, serif: RN_SERIF, slab: RN_SERIF };
const CSS_FONT: Record<DesignFontFamily, string> = {
  sans: '"Inter", "Helvetica Neue", Arial, system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  slab: '"Roboto Slab", Rockwell, Georgia, "Times New Roman", serif',
};
const SIZE_SCALE: Record<DesignSize, number> = { s: 0.94, m: 1, l: 1.08 };
const SPACING_SCALE: Record<DesignSpacing, number> = { compact: 0.8, normal: 1, relaxed: 1.28 };
const MARGIN_PX: Record<DesignMargin, number> = { narrow: 34, normal: 44, wide: 62 };

const FONTS: DesignFontFamily[] = ["sans", "serif", "slab"];
const SIZES: DesignSize[] = ["s", "m", "l"];
const SPACINGS: DesignSpacing[] = ["compact", "normal", "relaxed"];
const MARGINS: DesignMargin[] = ["narrow", "normal", "wide"];
const HEADINGS: DesignHeading[] = ["template", "rule", "full-underline", "plain-caps", "bar"];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function sanitizeDesign(raw: unknown): ResumeDesign {
  const r = (raw ?? {}) as Record<string, unknown>;
  const d: ResumeDesign = {};
  if (typeof r.accentColor === "string" && HEX_RE.test(r.accentColor)) d.accentColor = r.accentColor;
  if (FONTS.includes(r.fontFamily as DesignFontFamily)) d.fontFamily = r.fontFamily as DesignFontFamily;
  if (SIZES.includes(r.size as DesignSize)) d.size = r.size as DesignSize;
  if (SPACINGS.includes(r.spacing as DesignSpacing)) d.spacing = r.spacing as DesignSpacing;
  if (MARGINS.includes(r.margin as DesignMargin)) d.margin = r.margin as DesignMargin;
  if (HEADINGS.includes(r.headingStyle as DesignHeading)) d.headingStyle = r.headingStyle as DesignHeading;
  return d;
}

export function isEmptyDesign(d: ResumeDesign | null | undefined): boolean {
  return !d || Object.values(d).every((v) => v == null || v === "");
}

export function effectiveAccent(templateAccent: string, design: ResumeDesign | null | undefined): string {
  return design?.accentColor && HEX_RE.test(design.accentColor) ? design.accentColor : templateAccent;
}

/** A NEW TemplateSpec with the (clamped) design overrides applied. Never returns an unreadable spec. */
export function resolveDesign(spec: TemplateSpec, design: ResumeDesign | null | undefined): TemplateSpec {
  const d = sanitizeDesign(design);
  if (isEmptyDesign(d)) return spec;

  const sizeMul = SIZE_SCALE[d.size ?? "m"];
  const spaceMul = SPACING_SCALE[d.spacing ?? "normal"];
  const isBand = spec.header === "accent-band";
  const basePad = d.margin ? MARGIN_PX[d.margin] : spec.type.padding;

  return {
    ...spec,
    fontFamily: d.fontFamily ? CSS_FONT[d.fontFamily] : spec.fontFamily,
    rnFont: d.fontFamily ? RN_FONT[d.fontFamily] : spec.rnFont,
    pdfFont: d.fontFamily === "serif" || d.fontFamily === "slab" ? "Times-Roman" : d.fontFamily === "sans" ? "Helvetica" : spec.pdfFont,
    heading: d.headingStyle && d.headingStyle !== "template" ? d.headingStyle : spec.heading,
    accent: d.accentColor && spec.accent === "none" ? "minimal" : spec.accent,
    type: {
      ...spec.type,
      name: Math.round(spec.type.name * sizeMul),
      title: +(spec.type.title * sizeMul).toFixed(1),
      heading: +(spec.type.heading * sizeMul).toFixed(1),
      body: Math.max(9.5, +(spec.type.body * sizeMul).toFixed(1)),
      small: Math.max(8, +(spec.type.small * sizeMul).toFixed(1)),
      sectionGap: Math.max(10, Math.round(spec.type.sectionGap * spaceMul)),
      padding: isBand ? 0 : Math.max(28, Math.round(basePad)),
    },
  };
}

// Mirrors mobile-app/src/types/resume.types.ts exactly — both platforms read
// and write the same resumes_builder jsonb columns, so the field names here
// must match mobile's camelCase shape byte-for-byte.

import { normalizeContent, type ResumeContent } from "./content";
import { sanitizeDesign, type ResumeDesign } from "./design";

export type { ResumeContent, ResumeDesign };
export type ResumeTemplate = string;

export interface ResumePersonalDetails {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  photoUrl: string | null;
}

export interface ResumeEducationEntry {
  id: string;
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  percentage: string;
}

export interface ResumeSkills {
  technical: string[];
  soft: string[];
}

export const RESUME_FREEFORM_SECTIONS = [
  "summary",
  "experience",
  "projects",
  "certifications",
  "achievements",
  "languages",
  "references",
] as const;
export type ResumeFreeformSectionKey = (typeof RESUME_FREEFORM_SECTIONS)[number];

export interface ATSTip {
  ruleId: string | null;
  section: string;
  problem: string;
  why: string;
  importance: "low" | "medium" | "high" | "critical";
  checked: boolean;
}

export interface ATSBreakdown {
  overall: number;
  content: number;
  formatting: number;
  skills: number;
  keywords: number;
  /** share of the core sections a recruiter expects that are actually filled in. */
  completeness: number;
  /** heuristic: bullet usage, line length, wall-of-text penalty. */
  readability: number;
  tips: ATSTip[];
}

export interface ResumeDocument {
  id: string;
  title: string;
  template: ResumeTemplate;
  personalDetails: ResumePersonalDetails;
  /** the structured section model — the source of truth (see content.ts). */
  content: ResumeContent;
  /** true right after creation from a template — holds that template's demo persona. */
  isDemo: boolean;
  /** per-résumé design overrides on top of the template spec (see design.ts). */
  design: ResumeDesign;
  // --- legacy columns, still populated by mapResumeRow() for anything mid-rollout ---
  education: ResumeEducationEntry[];
  skills: ResumeSkills;
  sections: Record<ResumeFreeformSectionKey, string>;
  atsScore: number;
  layout: { order: string[]; hidden: string[] };
  updatedAt: string;
}

export const FREEFORM_PLACEHOLDERS: Record<ResumeFreeformSectionKey, string> = {
  summary: "A short 2-3 sentence pitch about who you are and what you're looking for.",
  experience:
    "e.g. Frontend Intern at Acme Corp (Jun 2025 - Aug 2025)\n- Built responsive UI components with React\n- Improved page load time by 30%",
  projects: "e.g. E-Commerce Website — React, Node.js, MongoDB\n- Built a full-stack shopping app with cart & checkout",
  certifications: "e.g. AWS Certified Cloud Practitioner (2025)",
  achievements: "e.g. Winner, Smart India Hackathon 2025",
  languages: "e.g. English (Fluent), Hindi (Native)",
  references: "Available upon request.",
};

export const EMPTY_PERSONAL: ResumePersonalDetails = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  website: "",
  photoUrl: null,
};

/** Maps a raw resumes_builder row (snake_case jsonb columns) into a ResumeDocument. Upgrades a legacy (content-less) row on read. */
export function mapResumeRow(row: {
  id: string;
  title: string;
  template: string;
  personal_details: unknown;
  content?: unknown;
  is_demo?: boolean | null;
  design?: unknown;
  education: unknown;
  skills: unknown;
  sections: unknown;
  ats_score: number | null;
  layout: unknown;
  updated_at: string;
}): ResumeDocument {
  const rawSections = (row.sections ?? {}) as Record<string, string>;
  const sections = RESUME_FREEFORM_SECTIONS.reduce(
    (acc, key) => {
      acc[key] = rawSections[key] ?? "";
      return acc;
    },
    {} as Record<ResumeFreeformSectionKey, string>,
  );

  return {
    id: row.id,
    title: row.title,
    template: row.template,
    personalDetails: { ...EMPTY_PERSONAL, ...((row.personal_details ?? {}) as Partial<ResumePersonalDetails>) },
    content: normalizeContent(row.content, {
      sections: row.sections,
      education: row.education,
      skills: row.skills,
      layout: row.layout,
    }),
    isDemo: row.is_demo === true,
    design: sanitizeDesign(row.design),
    education: (row.education ?? []) as ResumeEducationEntry[],
    skills: (row.skills ?? { technical: [], soft: [] }) as ResumeSkills,
    sections,
    atsScore: row.ats_score ?? 0,
    layout: (row.layout ?? {}) as { order: string[]; hidden: string[] },
    updatedAt: row.updated_at,
  };
}

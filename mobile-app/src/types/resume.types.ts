/**
 * A resume_templates.id — admin-managed since migration 006_resume_admin.sql
 * dropped the fixed-id CHECK constraint, so this is intentionally `string`
 * rather than a closed union: admins can add templates beyond the 4 seeded
 * defaults (modern/professional/minimal/creative) and mobile must render
 * whatever the catalog actually contains.
 */
export type ResumeTemplate = string;

export interface ResumeTemplateCatalogEntry {
  id: ResumeTemplate;
  name: string;
  accentColor: string;
}

export interface ResumePersonalDetails {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
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

/** Free-form sections edited inline within the Resume Editor screen. */
export const RESUME_FREEFORM_SECTIONS = [
  "experience",
  "projects",
  "certifications",
  "achievements",
  "languages",
  "references",
  "summary",
] as const;
export type ResumeFreeformSectionKey = (typeof RESUME_FREEFORM_SECTIONS)[number];

/**
 * The 9 sections a user can reorder/hide (matches website's
 * lib/resumeBuilder/sections.ts MANAGEABLE_SECTIONS exactly) — Personal
 * Details isn't part of this list on either platform; it's always shown
 * first and isn't reorderable/hideable.
 */
export const MANAGEABLE_RESUME_SECTIONS = [
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "certifications",
  "achievements",
  "languages",
  "references",
] as const;
export type ManageableResumeSectionKey = (typeof MANAGEABLE_RESUME_SECTIONS)[number];

export interface ResumeLayout {
  order: ManageableResumeSectionKey[];
  hidden: ManageableResumeSectionKey[];
}

export interface ResumeSummary {
  id: string;
  title: string;
  template: ResumeTemplate;
  atsScore: number;
  updatedAt: string;
}

export interface ResumeDocument {
  id: string;
  title: string;
  template: ResumeTemplate;
  personalDetails: ResumePersonalDetails;
  education: ResumeEducationEntry[];
  skills: ResumeSkills;
  sections: Record<ResumeFreeformSectionKey, string>;
  atsScore: number;
  layout: ResumeLayout;
  updatedAt: string;
}

/** One admin-configured ATS guideline, evaluated against the resume's real content by compute_ats_breakdown(). */
export interface ATSTip {
  ruleId: string | null;
  section: string;
  problem: string;
  why: string;
  importance: "low" | "medium" | "high" | "critical";
  /** true when this rule was mechanically checked against the resume; false means it's general, unautomatable guidance. */
  checked: boolean;
}

export interface ATSBreakdown {
  overall: number;
  content: number;
  formatting: number;
  skills: number;
  keywords: number;
  tips: ATSTip[];
}

export interface ResumeDownloadRecord {
  id: string;
  resumeId: string;
  resumeTitle: string;
  fileUrl: string;
  downloadedAt: string;
}

/** A finished Custom Project Builder request the user can add to a resume's Projects section. */
export interface ResumeProjectCandidate {
  id: string;
  title: string;
  description: string;
  technologyPreference: string;
}

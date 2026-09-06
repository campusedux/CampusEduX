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
  github: string;
  website: string;
  photoUrl: string | null;
}

// ---------------------------------------------------------------------------
// Structured section model — mirrors website lib/resumeBuilder/content.ts.
// `resumes_builder.content` is the source of truth; the legacy columns
// (sections/education/skills/layout) are kept only for the upgrade-on-read
// path (see resume.service.ts normalizeResumeContent()).
// ---------------------------------------------------------------------------
export type ResumeSectionType =
  | "summary"
  | "objective"
  | "experience"
  | "internships"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "awards"
  | "publications"
  | "research"
  | "volunteer"
  | "leadership"
  | "languages"
  | "interests"
  | "coding_profiles"
  | "social_links"
  | "references"
  | "custom";

export type ResumeSectionVariant = "text" | "entries" | "tags" | "links";

export interface ResumeSectionEntry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  url: string;
  tags: string[];
}

export interface ResumeTagGroup {
  id: string;
  label: string;
  items: string[];
}

export interface ResumeSectionLink {
  id: string;
  label: string;
  url: string;
}

export interface ResumeSectionBlock {
  id: string;
  type: ResumeSectionType;
  heading: string;
  variant: ResumeSectionVariant;
  hidden: boolean;
  text?: string;
  entries?: ResumeSectionEntry[];
  groups?: ResumeTagGroup[];
  links?: ResumeSectionLink[];
}

export type ResumeContent = ResumeSectionBlock[];

/** Per-résumé design overrides (mirrors website lib/resumeBuilder/design.ts). Mobile currently edits accent + size only. */
export interface ResumeDesign {
  accentColor?: string;
  fontFamily?: "sans" | "serif" | "slab";
  size?: "s" | "m" | "l";
  spacing?: "compact" | "normal" | "relaxed";
  margin?: "narrow" | "normal" | "wide";
  headingStyle?: "template" | "rule" | "full-underline" | "plain-caps" | "bar";
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
  /** structured section model — the source of truth. */
  content: ResumeContent;
  /** true right after creation from a template — holds that template's demo persona. */
  isDemo: boolean;
  /** per-résumé design overrides (see ResumeDesign). */
  design: ResumeDesign;
  // legacy columns, still populated by mapRow() for anything mid-rollout
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
  /** share of the core sections a recruiter expects that are filled in (0-100). */
  completeness: number;
  /** heuristic readability score (bullet usage, line length, wall-of-text penalty). */
  readability: number;
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

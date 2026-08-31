export type ResumeTemplate = "modern" | "professional" | "minimal" | "creative";

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
  updatedAt: string;
}

export interface ATSBreakdown {
  overall: number;
  content: number;
  formatting: number;
  skills: number;
  keywords: number;
  tips: string[];
}

export interface ResumeDownloadRecord {
  id: string;
  resumeId: string;
  resumeTitle: string;
  fileUrl: string;
  downloadedAt: string;
}

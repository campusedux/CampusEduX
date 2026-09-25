export type WorkMode = "Remote" | "Hybrid" | "On-site";
export type ExperienceLevel = "Fresher" | "Experienced";

export interface Job {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  salaryRange: string;
  postedAt: string;
  jobType: "Full Time" | "Part Time" | "Internship" | "Contract";
  isNew: boolean;
  /** Normalised category (migration 0114); undefined/null until backfilled. */
  category?: string | null;
  /** null = not set by the admin — the UI never guesses. */
  workMode?: WorkMode | null;
  experienceLevel?: ExperienceLevel | null;
  applyUrl?: string | null;
}

export interface JobCategoryCount {
  category: string;
  jobCount: number;
}

export interface JobDashboardStats {
  activeJobs: number;
  companyCount: number;
  fresherJobs: number;
}

export interface JobDetail extends Job {
  description: string;
  requirements: string[];
  skills: string[];
  experience: string;
  summary: string;
  responsibilities: string[];
  qualification: string;
  shift: string;
  benefits: string[];
  category: string;
  requisitionId: string;
  applyUrl: string | null;
  /** ISO timestamp; null = no deadline. */
  applicationDeadline: string | null;
  candidateNote: string;
  companyRating: number;
  companyReviewCount: number;
  isSaved: boolean;
  hasApplied: boolean;
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  employeeCount: string;
  about: string;
  openJobsCount: number;
}

export interface Recruiter {
  id: string;
  name: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  rating: number;
  reviewCount: number;
  email: string;
  phone: string;
  location: string;
  about: string;
}

export type ApplicationStageStatus = "completed" | "in_progress" | "pending";

export interface ApplicationStage {
  label: string;
  status: ApplicationStageStatus;
  date: string | null;
}

export interface JobApplication {
  id: string;
  job: Job;
  appliedAt: string;
  resumeFileName: string;
  overallStatus: "in_review" | "shortlisted" | "rejected" | "hired";
  stages: ApplicationStage[];
}

export interface JobFilters {
  jobType: "All" | Job["jobType"];
  experience: string | null;
  location: string | null;
  minSalaryLPA: number;
  maxSalaryLPA: number;
  sortBy: "relevance" | "latest" | "salary";
  /**
   * Free-text title search. Composed in at the call site (SearchJobsScreen)
   * from its own local text-input state — never held in useJobFilterStore —
   * so tapping "Reset" in the filter modal can't silently wipe search text
   * the user can still see on the previous screen.
   */
  query?: string;
  /** Exact match on jobs.category (one of the fixed set or "Other"). */
  category?: string | null;
  workMode?: WorkMode | null;
  experienceLevel?: ExperienceLevel | null;
}

export const DEFAULT_JOB_FILTERS: JobFilters = {
  jobType: "All",
  experience: null,
  location: null,
  minSalaryLPA: 0,
  maxSalaryLPA: 50,
  sortBy: "relevance",
};

export interface JobAlertPreferences {
  enabled: boolean;
  jobRole: string;
  location: string;
  experience: string;
  salaryRange: string;
  jobType: "All" | Job["jobType"];
}

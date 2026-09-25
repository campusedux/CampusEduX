/** Pure constants — safe to import from client components (no server deps). */

export const JOB_PAGE_SIZE = 20;
export const COMPANY_PAGE_SIZE = 20;
export const APPLICATION_PAGE_SIZE = 20;

export const JOB_TYPES = ['Full Time', 'Part Time', 'Internship', 'Contract'] as const;

/** DB application status → the spec's pill vocabulary. */
export const APP_STATUS_LABEL: Record<string, string> = {
  in_review: 'New',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
};

export const WORK_MODES = ['Remote', 'Hybrid', 'On-site'] as const;
export const EXPERIENCE_LEVELS = ['Fresher', 'Experienced'] as const;
/** Mirrors migration 086 `job_canonical_category()`. */
export const JOB_CATEGORIES = [
  'IT & Software',
  'Core Engineering',
  'Data/AI',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'HR',
  'Other',
] as const;

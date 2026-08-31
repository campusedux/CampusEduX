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

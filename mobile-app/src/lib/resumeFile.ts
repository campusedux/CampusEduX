/**
 * Résumé upload limit shared by EVERY résumé path (job-apply upload, parse/import) and the UI copy.
 * Must equal the `resumes` bucket file_size_limit (migration 0117/089) and the website's
 * RESUME_MAX_MB - tests/unit/lib/uploadLimits.test.ts fails when they diverge.
 */
export const MAX_RESUME_MB = 5;
export const MAX_RESUME_BYTES = MAX_RESUME_MB * 1024 * 1024;
export const MAX_RESUME_LABEL = `${MAX_RESUME_MB}MB`;

/** Throws a friendly error when a picked file is over the limit (unknown size passes). */
export function assertResumeSize(sizeBytes: number | null | undefined): void {
  if (typeof sizeBytes === "number" && sizeBytes > MAX_RESUME_BYTES) {
    throw new Error(`That file is too large. Please choose a résumé of ${MAX_RESUME_LABEL} or less.`);
  }
}

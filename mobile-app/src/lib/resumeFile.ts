/** Résumé upload limits shared by the picker and the UI copy. */
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const MAX_RESUME_LABEL = "5MB";

/** Throws a friendly error when a picked file is over the limit (unknown size passes). */
export function assertResumeSize(sizeBytes: number | null | undefined): void {
  if (typeof sizeBytes === "number" && sizeBytes > MAX_RESUME_BYTES) {
    throw new Error(`That file is too large. Please choose a résumé of ${MAX_RESUME_LABEL} or less.`);
  }
}

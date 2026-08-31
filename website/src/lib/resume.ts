// Resume file rules for the website's "apply to a job" upload. These mirror
// what the mobile app accepts in usePickAndUploadResume() /
// mobile-app/src/hooks/useJobs.ts — PDF / DOC / DOCX — so a resume uploaded on
// the web behaves identically to one uploaded in the app. The size cap is a
// website-only guard (the mobile flow has none); 10 MB is generous for a
// resume and well under the Supabase Storage object limit.
export const RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

export const RESUME_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const RESUME_MAX_MB = 10;

export const RESUME_STORAGE_BUCKET = "resumes"; // private bucket, migration 0029
export const RESUME_SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year, matches job.service.uploadResume

/** Lower-cased extension including the dot, or "" when there is none. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export function hasAllowedResumeExtension(name: string): boolean {
  return (RESUME_EXTENSIONS as readonly string[]).includes(fileExtension(name));
}

/**
 * Storage object key: `<userId>/<timestamp>_<safe name>` — the first path
 * segment MUST be the user's id so the `resumes_owner_all` Storage RLS policy
 * (migration 0029) allows the write. Matches job.service.uploadResume()'s
 * `${userId}/${Date.now()}_${fileName}` shape.
 */
export function resumeStoragePath(userId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  return `${userId}/${Date.now()}_${safe}`;
}

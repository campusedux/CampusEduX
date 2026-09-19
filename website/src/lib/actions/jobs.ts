"use server";

import { z } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getPublicSupabase } from "@/lib/supabase/server";
import { onlyActiveJobs } from "@/lib/jobsActive";
import {
  RESUME_STORAGE_BUCKET,
  RESUME_SIGNED_URL_TTL,
  hasAllowedResumeExtension,
} from "@/lib/resume";

// ---------------------------------------------------------------------------
// Server-side counterparts of mobile-app/src/services/job.service.ts's
// toggleSavedJob() / uploadResume() + applyToJob(). Every write runs through
// the signed-in student's own session (RLS still enforced) and the user id
// comes from the session cookie — never from the client payload.
// ---------------------------------------------------------------------------

type ActionError = { error: string };

const jobIdSchema = z.string().trim().min(1).max(200);

/** `activeOnly`: applying needs an open, unexpired job; saving/unsaving only needs a non-draft one. */
async function jobExists(jobId: string, activeOnly = false): Promise<boolean> {
  const supabase = getPublicSupabase();
  if (!supabase) return false;
  const base = supabase.from("jobs").select("id");
  const { data } = await (activeOnly ? onlyActiveJobs(base) : base.neq("status", "draft")).eq("id", jobId).maybeSingle();
  return !!data;
}

/**
 * Toggle a saved job (saved_jobs is insert/delete-own — RLS from
 * mobile-app migration 0013). Returns the new saved state.
 */
export async function toggleSaveJobAction(rawJobId: string): Promise<{ saved: boolean } | ActionError> {
  const parsed = jobIdSchema.safeParse(rawJobId);
  if (!parsed.success) return { error: "Invalid job." };
  const jobId = parsed.data;

  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again to save this job." };

  const supabase = createAuthedServerSupabase();

  const { data: existing, error: readError } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("job_id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) return { error: "Could not update your saved jobs. Please try again." };

  if (existing) {
    const { error } = await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("user_id", user.id);
    if (error) return { error: "Could not remove the saved job. Please try again." };
    return { saved: false };
  }

  if (!(await jobExists(jobId))) return { error: "That job is no longer listed." };

  const { error } = await supabase.from("saved_jobs").insert({ job_id: jobId, user_id: user.id });
  if (error) {
    // 23505 = already saved (raced with another tab) — treat as success.
    if ((error as { code?: string }).code === "23505") return { saved: true };
    return { error: "Could not save this job. Please try again." };
  }
  return { saved: true };
}

const applySchema = z
  .object({
    jobId: jobIdSchema,
    resumeId: z.string().uuid().optional(),
    newResume: z
      .object({
        storagePath: z.string().trim().min(3).max(400),
        fileName: z.string().trim().min(1).max(200),
      })
      .optional(),
  })
  .refine((d) => (d.resumeId ? 1 : 0) + (d.newResume ? 1 : 0) === 1, {
    message: "Choose exactly one resume — an existing one or a new upload.",
  });

export type ApplyToJobInput = z.infer<typeof applySchema>;

/**
 * Attach a resume (an existing `resumes` row, or one whose file the client has
 * just uploaded to the private `resumes` bucket) and insert an `applications`
 * row. Mirrors job.service.applyToJob(): the unique(user_id, job_id)
 * constraint means a repeat apply is a real error, surfaced as such.
 */
export async function applyToJobAction(input: ApplyToJobInput): Promise<{ applicationId: string } | ActionError> {
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid application." };
  }
  const { jobId, resumeId, newResume } = parsed.data;

  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again to apply." };

  if (!(await jobExists(jobId, true))) return { error: "That job is no longer accepting applications." };

  const supabase = createAuthedServerSupabase();

  // 1. Resolve the resume_id to attach.
  let finalResumeId: string;

  if (newResume) {
    // The uploaded object must live in THIS user's folder (Storage RLS would
    // have rejected anything else, but re-check before we mint a signed URL).
    if (!newResume.storagePath.startsWith(`${user.id}/`)) {
      return { error: "That upload could not be verified. Please try again." };
    }
    if (!hasAllowedResumeExtension(newResume.storagePath) || !hasAllowedResumeExtension(newResume.fileName)) {
      return { error: "Resumes must be a PDF, DOC or DOCX file." };
    }

    // Mint the signed URL server-side (also fails if the object isn't there),
    // so the stored file_url is never attacker-supplied.
    const { data: signed, error: signError } = await supabase.storage
      .from(RESUME_STORAGE_BUCKET)
      .createSignedUrl(newResume.storagePath, RESUME_SIGNED_URL_TTL);
    if (signError || !signed?.signedUrl) {
      return { error: "We couldn't read the uploaded file. Please try uploading it again." };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: newResume.fileName,
        file_url: signed.signedUrl,
        storage_path: newResume.storagePath,
      })
      .select("id")
      .single();
    if (insertError || !inserted) return { error: "Could not save the uploaded resume. Please try again." };
    finalResumeId = inserted.id;
  } else {
    // Existing resume — confirm it is this user's (RLS enforces it too).
    const { data: row, error } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", resumeId!)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !row) return { error: "That resume could not be found. Pick another, or upload a new one." };
    finalResumeId = row.id;
  }

  // 2. Insert the application.
  const { data: application, error: applyError } = await supabase
    .from("applications")
    .insert({ user_id: user.id, job_id: jobId, resume_id: finalResumeId })
    .select("id")
    .single();

  if (applyError || !application) {
    const code = (applyError as { code?: string } | null)?.code;
    if (code === "23505") return { error: "You've already applied to this job." };
    if (code === "23503") return { error: "That job is no longer available." };
    return { error: "Could not submit your application. Please try again." };
  }

  return { applicationId: application.id };
}

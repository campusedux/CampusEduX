"use server";

import { z } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import type { CustomProjectStatus } from "@/lib/customProjects";
import { formatProjectSnippet, appendToFreeformContent } from "@/lib/resumeBuilder/formatting";
import { RESUME_FREEFORM_SECTIONS, type ResumeFreeformSectionKey } from "@/lib/resumeBuilder/types";
import { normalizeLayout, type ResumeLayout } from "@/lib/resumeBuilder/sections";

// ---------------------------------------------------------------------------
// Server-side counterpart of mobile-app's resume.service.ts
// listMyCustomProjects()/appendProjectToResume() (Phase 2 of the Advanced
// Resume & Career Profile System engagement). Both platforms write the same
// resumes_builder.sections.projects text, so a project added on one shows up
// on the other with no extra sync step.
// ---------------------------------------------------------------------------

type ActionError = { error: string };

const READY_STATUSES: CustomProjectStatus[] = ["ready", "delivered"];

export interface ResumeProjectCandidate {
  id: string;
  title: string;
  description: string;
  technologyPreference: string;
}

/** The signed-in user's finished (ready/delivered) Custom Project Builder requests. */
export async function listMyResumeProjectCandidatesAction(): Promise<ResumeProjectCandidate[] | ActionError> {
  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again." };

  const supabase = createAuthedServerSupabase();
  const { data, error } = await supabase
    .from("custom_project_requests")
    .select("id, title, description, technology_preference, status")
    .eq("user_id", user.id)
    .in("status", READY_STATUSES)
    .order("updated_at", { ascending: false });
  if (error) return { error: "Could not load your projects. Please try again." };

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title ?? "Untitled project",
    description: row.description ?? "",
    technologyPreference: row.technology_preference ?? "",
  }));
}

const resumeIdSchema = z.string().uuid();
const projectIdSchema = z.string().trim().min(1).max(200);

/**
 * Appends a finished project as a formatted snippet to the resume's Projects
 * section — never replaces existing content. Both the resume and the project
 * are re-checked against the caller's own user_id here (not just RLS), so a
 * forged id from either side fails with a clear error rather than an RLS 0-row
 * update that would look like a silent no-op.
 */
export async function appendCustomProjectToResumeAction(
  rawResumeId: string,
  rawProjectId: string,
): Promise<{ content: string } | ActionError> {
  const resumeParsed = resumeIdSchema.safeParse(rawResumeId);
  const projectParsed = projectIdSchema.safeParse(rawProjectId);
  if (!resumeParsed.success || !projectParsed.success) return { error: "Invalid request." };
  const resumeId = resumeParsed.data;
  const projectId = projectParsed.data;

  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again." };

  const supabase = createAuthedServerSupabase();

  const [{ data: resume, error: resumeError }, { data: project, error: projectError }] = await Promise.all([
    supabase.from("resumes_builder").select("id, sections").eq("id", resumeId).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("custom_project_requests")
      .select("id, title, description, technology_preference, status")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (resumeError || !resume) return { error: "That resume could not be found." };
  if (projectError || !project) return { error: "That project could not be found." };
  if (!READY_STATUSES.includes(project.status)) {
    return { error: "Only finished projects (ready or delivered) can be added to a resume." };
  }

  const currentSections = (resume.sections ?? {}) as Record<string, string>;
  const snippet = formatProjectSnippet({
    title: project.title ?? "Untitled project",
    description: project.description ?? "",
    technologyPreference: project.technology_preference ?? "",
  });
  const nextContent = appendToFreeformContent(currentSections.projects ?? "", snippet);

  const { error: updateError } = await supabase
    .from("resumes_builder")
    .update({ sections: { ...currentSections, projects: nextContent }, updated_at: new Date().toISOString() })
    .eq("id", resumeId)
    .eq("user_id", user.id);
  if (updateError) return { error: "Could not update the resume. Please try again." };

  return { content: nextContent };
}

// ---------------------------------------------------------------------------
// Phase 4 — the website Resume Editor. One Server Action per field group,
// mirroring mobile-app's resume.service.ts update* granularity exactly, so
// both platforms write the same columns the same way and stay in sync.
//
// Every action re-scopes its update to `.eq("user_id", user.id)` and reads
// back `.select("id").maybeSingle()` in the same round trip — a resume that
// doesn't exist or isn't the caller's own comes back as a clear error rather
// than a silent 0-row update.
// ---------------------------------------------------------------------------

type OkResult = { ok: true } | ActionError;

async function updateOwnResume(resumeId: string, patch: Record<string, unknown>): Promise<OkResult> {
  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again." };

  const supabase = createAuthedServerSupabase();
  const { data, error } = await supabase
    .from("resumes_builder")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return { error: "Could not save. Please try again." };
  if (!data) return { error: "That resume could not be found." };
  return { ok: true };
}

const templateSchema = z.string().trim().min(1).max(100);

export async function updateResumeTemplateAction(rawResumeId: string, rawTemplate: string): Promise<OkResult> {
  const resumeParsed = resumeIdSchema.safeParse(rawResumeId);
  const templateParsed = templateSchema.safeParse(rawTemplate);
  if (!resumeParsed.success || !templateParsed.success) return { error: "Invalid request." };
  return updateOwnResume(resumeParsed.data, { template: templateParsed.data });
}

const personalDetailsSchema = z.object({
  fullName: z.string().trim().max(200),
  jobTitle: z.string().trim().max(200),
  email: z.string().trim().max(200),
  phone: z.string().trim().max(50),
  location: z.string().trim().max(200),
  linkedin: z.string().trim().max(300),
  website: z.string().trim().max(300),
  photoUrl: z.string().trim().max(2000).nullable(),
});

export async function updateResumePersonalDetailsAction(rawResumeId: string, rawDetails: unknown): Promise<OkResult> {
  const resumeParsed = resumeIdSchema.safeParse(rawResumeId);
  const detailsParsed = personalDetailsSchema.safeParse(rawDetails);
  if (!resumeParsed.success || !detailsParsed.success) return { error: "Invalid request." };
  const details = detailsParsed.data;
  return updateOwnResume(resumeParsed.data, {
    personal_details: details,
    title: details.fullName ? `${details.fullName}'s Resume` : "Untitled Resume",
  });
}

const educationSchema = z
  .array(
    z.object({
      id: z.string().trim().min(1).max(100),
      degree: z.string().trim().max(200),
      institution: z.string().trim().max(200),
      startYear: z.string().trim().max(20),
      endYear: z.string().trim().max(20),
      percentage: z.string().trim().max(20),
    }),
  )
  .max(20);

export async function updateResumeEducationAction(rawResumeId: string, rawEducation: unknown): Promise<OkResult> {
  const resumeParsed = resumeIdSchema.safeParse(rawResumeId);
  const educationParsed = educationSchema.safeParse(rawEducation);
  if (!resumeParsed.success || !educationParsed.success) return { error: "Invalid request." };
  return updateOwnResume(resumeParsed.data, { education: educationParsed.data });
}

const skillsSchema = z.object({
  technical: z.array(z.string().trim().max(100)).max(50),
  soft: z.array(z.string().trim().max(100)).max(50),
});

export async function updateResumeSkillsAction(rawResumeId: string, rawSkills: unknown): Promise<OkResult> {
  const resumeParsed = resumeIdSchema.safeParse(rawResumeId);
  const skillsParsed = skillsSchema.safeParse(rawSkills);
  if (!resumeParsed.success || !skillsParsed.success) return { error: "Invalid request." };
  return updateOwnResume(resumeParsed.data, { skills: skillsParsed.data });
}

const freeformKeySchema = z.enum(RESUME_FREEFORM_SECTIONS);
const freeformContentSchema = z.string().max(20_000);
const currentSectionsSchema = z.record(z.string());

export async function updateResumeFreeformSectionAction(
  rawResumeId: string,
  rawKey: string,
  rawContent: string,
  rawCurrentSections: unknown,
): Promise<OkResult> {
  const resumeParsed = resumeIdSchema.safeParse(rawResumeId);
  const keyParsed = freeformKeySchema.safeParse(rawKey);
  const contentParsed = freeformContentSchema.safeParse(rawContent);
  const currentParsed = currentSectionsSchema.safeParse(rawCurrentSections ?? {});
  if (!resumeParsed.success || !keyParsed.success || !contentParsed.success || !currentParsed.success) {
    return { error: "Invalid request." };
  }
  const key: ResumeFreeformSectionKey = keyParsed.data;
  return updateOwnResume(resumeParsed.data, { sections: { ...currentParsed.data, [key]: contentParsed.data } });
}

const layoutSchema = z.object({
  order: z.array(z.string()).max(50),
  hidden: z.array(z.string()).max(50),
});

/** Persists a section order/visibility change. Normalizes server-side too, so a stale/partial client layout never corrupts the stored value. */
export async function updateResumeLayoutAction(rawResumeId: string, rawLayout: unknown): Promise<OkResult> {
  const resumeParsed = resumeIdSchema.safeParse(rawResumeId);
  const layoutParsed = layoutSchema.safeParse(rawLayout);
  if (!resumeParsed.success || !layoutParsed.success) return { error: "Invalid request." };
  const normalized: ResumeLayout = normalizeLayout(layoutParsed.data);
  return updateOwnResume(resumeParsed.data, { layout: normalized });
}

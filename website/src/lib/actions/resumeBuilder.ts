"use server";

import { z } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import type { CustomProjectStatus } from "@/lib/customProjects";
import { formatProjectSnippet, appendToFreeformContent } from "@/lib/resumeBuilder/formatting";

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

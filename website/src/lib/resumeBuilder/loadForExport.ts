import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getOptionalUser } from "@/lib/auth";
import { mapResumeRow, type ResumeDocument } from "./types";

export type LoadResumeResult = { resume: ResumeDocument; accentColor: string; userId: string } | { error: string; status: number };

/** Loads a resume the caller owns, plus its template's accent color — the shared read path for the PDF/DOCX export routes. */
export async function loadOwnResumeForExport(resumeId: string): Promise<LoadResumeResult> {
  const user = await getOptionalUser();
  if (!user) return { error: "Please sign in again.", status: 401 };

  const supabase = createAuthedServerSupabase();
  const { data: row } = await supabase
    .from("resumes_builder")
    .select("id, title, template, personal_details, education, skills, sections, ats_score, layout, updated_at")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) return { error: "That resume could not be found.", status: 404 };

  const resume = mapResumeRow(row);
  const { data: templateRow } = await supabase.from("resume_templates").select("accent_color").eq("id", resume.template).maybeSingle();
  const accentColor = templateRow?.accent_color ?? "#4F39F6";

  return { resume, accentColor, userId: user.id };
}

export async function recordResumeDownload(userId: string, resume: ResumeDocument, fileName: string): Promise<void> {
  const supabase = createAuthedServerSupabase();
  await supabase.from("resume_downloads").insert({ user_id: userId, resume_id: resume.id, resume_title: resume.title, file_url: fileName });
}

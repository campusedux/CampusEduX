import { supabase } from "@/lib/supabase";
import * as Print from "expo-print";
import type {
  ResumeSummary,
  ResumeDocument,
  ResumePersonalDetails,
  ResumeEducationEntry,
  ResumeSkills,
  ResumeFreeformSectionKey,
  ResumeTemplate,
  ATSBreakdown,
  ResumeDownloadRecord,
} from "@/types";
import { RESUME_FREEFORM_SECTIONS } from "@/types";
import {
  SAMPLE_RESUME_LIST,
  sampleResumeDetail,
  sampleATSBreakdown,
  sampleResumeDownloadHistory,
} from "@/data/sampleResumeContent";

const EMPTY_PERSONAL: ResumePersonalDetails = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  photoUrl: null,
};

const TEMPLATE_ACCENTS: Record<ResumeTemplate, string> = {
  modern: "#4F39F6",
  professional: "#1E3A8A",
  minimal: "#374151",
  creative: "#DB2777",
};

function mapRow(row: any): ResumeDocument {
  const sections = RESUME_FREEFORM_SECTIONS.reduce((acc, key) => {
    acc[key] = row.sections?.[key] ?? "";
    return acc;
  }, {} as Record<ResumeFreeformSectionKey, string>);

  return {
    id: row.id,
    title: row.title,
    template: row.template,
    personalDetails: { ...EMPTY_PERSONAL, ...(row.personal_details ?? {}) },
    education: row.education ?? [],
    skills: row.skills ?? { technical: [], soft: [] },
    sections,
    atsScore: row.ats_score ?? 0,
    updatedAt: row.updated_at,
  };
}

/**
 * Deterministic ATS-style scoring based on how complete/keyword-rich the
 * resume actually is — no external service, no randomness, fully
 * recomputed from the resume's real content every time it's requested.
 */
function computeATSBreakdown(doc: ResumeDocument): ATSBreakdown {
  const p = doc.personalDetails;
  const filledPersonalFields = [p.fullName, p.jobTitle, p.email, p.phone, p.location].filter(Boolean).length;
  const contentSections = [doc.sections.summary, doc.sections.experience, doc.sections.projects].filter(
    (s) => s.trim().length > 20
  ).length;
  const content = Math.round((filledPersonalFields / 5) * 40 + (contentSections / 3) * 60);

  const formatting = doc.template ? 80 : 60;

  const totalSkills = doc.skills.technical.length + doc.skills.soft.length;
  const skills = Math.min(100, Math.round((totalSkills / 10) * 100));

  const combinedText = `${doc.sections.summary} ${doc.sections.experience} ${doc.sections.projects}`.toLowerCase();
  const KEYWORDS = ["developed", "built", "led", "designed", "implemented", "improved", "team", "project", "api", "database"];
  const keywordHits = KEYWORDS.filter((k) => combinedText.includes(k)).length;
  const keywords = Math.min(100, Math.round((keywordHits / KEYWORDS.length) * 100) + (doc.education.length > 0 ? 10 : 0));

  const overall = Math.round(content * 0.35 + formatting * 0.15 + skills * 0.25 + keywords * 0.25);

  const tips: string[] = [];
  if (filledPersonalFields < 5) tips.push("Complete all personal detail fields (LinkedIn and website help too).");
  if (contentSections < 3) tips.push("Add a summary, work experience, and at least one project.");
  if (totalSkills < 6) tips.push("List at least 6-8 relevant technical and soft skills.");
  if (keywordHits < 4) tips.push("Use action verbs like 'developed', 'led', or 'implemented' in your descriptions.");
  if (tips.length === 0) tips.push("Great! Your resume has a high chance of passing ATS screening.");

  return { overall: Math.min(100, overall), content, formatting, skills, keywords, tips };
}

function renderResumeHtml(doc: ResumeDocument): string {
  const accent = TEMPLATE_ACCENTS[doc.template] ?? "#4F39F6";
  const p = doc.personalDetails;
  const section = (title: string, body: string) =>
    body?.trim() ? `<h3 style="color:${accent};margin:18px 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">${title}</h3><p style="margin:0;white-space:pre-wrap;font-size:13px;line-height:1.5;">${body}</p>` : "";

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family:Helvetica,Arial,sans-serif;color:#111827;padding:32px;">
        <h1 style="margin:0;font-size:24px;">${p.fullName || "Your Name"}</h1>
        <p style="margin:2px 0 12px;color:${accent};font-size:14px;">${p.jobTitle || ""}</p>
        <p style="margin:0 0 16px;font-size:12px;color:#6B7280;">
          ${[p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean).join(" · ")}
        </p>
        <hr style="border:none;border-top:2px solid ${accent};" />
        ${section("Summary", doc.sections.summary)}
        ${section("Experience", doc.sections.experience)}
        ${section("Projects", doc.sections.projects)}
        ${
          doc.education.length
            ? `<h3 style="color:${accent};margin:18px 0 6px;font-size:14px;text-transform:uppercase;">Education</h3>` +
              doc.education
                .map(
                  (e) =>
                    `<p style="margin:0 0 6px;font-size:13px;"><b>${e.degree}</b> — ${e.institution} (${e.startYear}-${e.endYear})${e.percentage ? `, ${e.percentage}%` : ""}</p>`
                )
                .join("")
            : ""
        }
        ${
          doc.skills.technical.length || doc.skills.soft.length
            ? `<h3 style="color:${accent};margin:18px 0 6px;font-size:14px;text-transform:uppercase;">Skills</h3><p style="margin:0;font-size:13px;">${[...doc.skills.technical, ...doc.skills.soft].join(", ")}</p>`
            : ""
        }
        ${section("Certifications", doc.sections.certifications)}
        ${section("Achievements", doc.sections.achievements)}
        ${section("Languages", doc.sections.languages)}
        ${section("References", doc.sections.references)}
      </body>
    </html>
  `;
}

/**
 * Runs a Supabase write and swallows failures (e.g. the table has not been
 * created yet). Resume edits then stay local — the screens still work against
 * the sample content — instead of surfacing an error on every save.
 */
async function persist(label: string, run: () => PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  try {
    const { error } = await run();
    if (error) throw new Error(error.message);
  } catch (error) {
    console.info(`[resume.service] ${label}: not persisted (${(error as Error).message})`);
  }
}

export const resumeService = {
  async getResumes(userId: string): Promise<ResumeSummary[]> {
    try {
      const { data, error } = await supabase
        .from("resumes_builder")
        .select("id, title, template, ats_score, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      // a new student has not built a résumé yet — an empty list is the correct
      // state; SAMPLE_RESUME_LIST is only for when the table/query fails.
      return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        template: row.template as ResumeTemplate,
        atsScore: row.ats_score ?? 0,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.info(`[resume.service] getResumes: using sample content (${(error as Error).message})`);
      return SAMPLE_RESUME_LIST;
    }
  },

  async createResume(userId: string, template: ResumeTemplate): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("resumes_builder")
        .insert({ user_id: userId, title: "Untitled Resume", template, personal_details: EMPTY_PERSONAL, education: [], skills: { technical: [], soft: [] }, sections: {} })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Could not create resume.");
      return data.id;
    } catch (error) {
      console.info(`[resume.service] createResume: not persisted (${(error as Error).message})`);
      return `res-local-${Date.now()}`;
    }
  },

  async getResumeDetail(resumeId: string): Promise<ResumeDocument> {
    try {
      const { data, error } = await supabase.from("resumes_builder").select("*").eq("id", resumeId).single();
      if (error || !data) throw new Error("Resume not found.");
      return mapRow(data);
    } catch (error) {
      console.info(`[resume.service] getResumeDetail: using sample content (${(error as Error).message})`);
      return sampleResumeDetail(resumeId);
    }
  },

  async updateTemplate(resumeId: string, template: ResumeTemplate): Promise<void> {
    await persist("updateTemplate", () =>
      supabase.from("resumes_builder").update({ template, updated_at: new Date().toISOString() }).eq("id", resumeId)
    );
  },

  async updatePersonalDetails(resumeId: string, details: ResumePersonalDetails): Promise<void> {
    await persist("updatePersonalDetails", () =>
      supabase
        .from("resumes_builder")
        .update({ personal_details: details, title: details.fullName ? `${details.fullName}'s Resume` : "Untitled Resume", updated_at: new Date().toISOString() })
        .eq("id", resumeId)
    );
  },

  async updateEducation(resumeId: string, education: ResumeEducationEntry[]): Promise<void> {
    await persist("updateEducation", () =>
      supabase.from("resumes_builder").update({ education, updated_at: new Date().toISOString() }).eq("id", resumeId)
    );
  },

  async updateSkills(resumeId: string, skills: ResumeSkills): Promise<void> {
    await persist("updateSkills", () =>
      supabase.from("resumes_builder").update({ skills, updated_at: new Date().toISOString() }).eq("id", resumeId)
    );
  },

  async updateFreeformSection(resumeId: string, key: ResumeFreeformSectionKey, content: string, currentSections: Record<string, string>): Promise<void> {
    await persist("updateFreeformSection", () =>
      supabase
        .from("resumes_builder")
        .update({ sections: { ...currentSections, [key]: content }, updated_at: new Date().toISOString() })
        .eq("id", resumeId)
    );
  },

  async deleteResume(resumeId: string): Promise<void> {
    await persist("deleteResume", () => supabase.from("resumes_builder").delete().eq("id", resumeId));
  },

  async getATSBreakdown(resumeId: string): Promise<ATSBreakdown> {
    try {
      const doc = await resumeService.getResumeDetail(resumeId);
      const breakdown = computeATSBreakdown(doc);
      await supabase.from("resumes_builder").update({ ats_score: breakdown.overall }).eq("id", resumeId);
      return breakdown;
    } catch (error) {
      console.info(`[resume.service] getATSBreakdown: using sample content (${(error as Error).message})`);
      return sampleATSBreakdown(resumeId);
    }
  },

  /** Renders the resume as real HTML and generates an actual PDF file on-device via expo-print. */
  async generatePdf(resumeId: string): Promise<{ uri: string; title: string }> {
    const doc = await resumeService.getResumeDetail(resumeId);
    const html = renderResumeHtml(doc);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    return { uri, title: doc.title };
  },

  async recordDownload(userId: string, resumeId: string, resumeTitle: string, fileUrl: string): Promise<void> {
    await persist("recordDownload", () =>
      supabase
        .from("resume_downloads")
        .insert({ user_id: userId, resume_id: resumeId, resume_title: resumeTitle, file_url: fileUrl })
    );
  },

  async getDownloadHistory(userId: string): Promise<ResumeDownloadRecord[]> {
    try {
      const { data, error } = await supabase
        .from("resume_downloads")
        .select("*")
        .eq("user_id", userId)
        .order("downloaded_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: row.id,
        resumeId: row.resume_id,
        resumeTitle: row.resume_title,
        fileUrl: row.file_url,
        downloadedAt: row.downloaded_at,
      }));
    } catch (error) {
      console.info(`[resume.service] getDownloadHistory: using sample content (${(error as Error).message})`);
      return sampleResumeDownloadHistory();
    }
  },
};

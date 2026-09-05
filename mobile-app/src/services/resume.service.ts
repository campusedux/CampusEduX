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
  ResumeTemplateCatalogEntry,
  ATSBreakdown,
  ResumeDownloadRecord,
  ResumeProjectCandidate,
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

/**
 * Used only when resume_templates hasn't been migrated/seeded yet — the
 * real, admin-editable catalog (see getTemplateCatalog()) is otherwise the
 * single source of truth for template names/colours.
 */
const DEFAULT_TEMPLATE_CATALOG: ResumeTemplateCatalogEntry[] = [
  { id: "modern", name: "Modern", accentColor: "#4F39F6" },
  { id: "professional", name: "Professional", accentColor: "#1E3A8A" },
  { id: "minimal", name: "Minimal", accentColor: "#374151" },
  { id: "creative", name: "Creative", accentColor: "#DB2777" },
];

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

/** Formats a finished custom project as a resume-ready snippet. Exported for unit testing. */
export function formatProjectSnippet(project: Pick<ResumeProjectCandidate, "title" | "description" | "technologyPreference">): string {
  const techSuffix = project.technologyPreference.trim() ? ` — ${project.technologyPreference.trim()}` : "";
  const description = project.description.trim();
  return `${project.title}${techSuffix}${description ? `\n${description}` : ""}`;
}

/** Appends a snippet to a freeform section's existing content, never replacing it. Exported for unit testing. */
export function appendToFreeformContent(current: string, snippet: string): string {
  const trimmed = current.trim();
  return trimmed ? `${trimmed}\n\n${snippet}` : snippet;
}

function renderResumeHtml(doc: ResumeDocument, accent: string): string {
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
    // Best-effort prefill from the user's profile — a lookup failure here
    // should never block resume creation, so it's isolated from the insert.
    let linkedin = "";
    let website = "";
    try {
      const { data: profile } = await supabase.from("profiles").select("linkedin_url, portfolio_url").eq("id", userId).maybeSingle();
      linkedin = profile?.linkedin_url ?? "";
      website = profile?.portfolio_url ?? "";
    } catch {
      // no profile data to prefill with — the form simply starts blank for these fields
    }

    try {
      const { data, error } = await supabase
        .from("resumes_builder")
        .insert({
          user_id: userId,
          title: "Untitled Resume",
          template,
          personal_details: { ...EMPTY_PERSONAL, linkedin, website },
          education: [],
          skills: { technical: [], soft: [] },
          sections: {},
        })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Could not create resume.");
      return data.id;
    } catch (error) {
      console.info(`[resume.service] createResume: not persisted (${(error as Error).message})`);
      return `res-local-${Date.now()}`;
    }
  },

  /** The admin-managed template catalog (resume_templates) — falls back to the 4 built-in defaults if unmigrated/empty. */
  async getTemplateCatalog(): Promise<ResumeTemplateCatalogEntry[]> {
    try {
      const { data, error } = await supabase.from("resume_templates").select("id, name, accent_color").order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return DEFAULT_TEMPLATE_CATALOG;
      return data.map((row: any) => ({ id: row.id, name: row.name, accentColor: row.accent_color }));
    } catch (error) {
      console.info(`[resume.service] getTemplateCatalog: using default catalog (${(error as Error).message})`);
      return DEFAULT_TEMPLATE_CATALOG;
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

  /** Finished (ready/delivered) Custom Project Builder requests the user can add to a resume. */
  async listMyCustomProjects(userId: string): Promise<ResumeProjectCandidate[]> {
    try {
      const { data, error } = await supabase
        .from("custom_project_requests")
        .select("id, title, description, technology_preference, status")
        .eq("user_id", userId)
        .in("status", ["ready", "delivered"])
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? "Untitled project",
        description: row.description ?? "",
        technologyPreference: row.technology_preference ?? "",
      }));
    } catch (error) {
      console.info(`[resume.service] listMyCustomProjects: unavailable (${(error as Error).message})`);
      return [];
    }
  },

  /** Appends a finished project as a formatted snippet to the resume's Projects section — never replaces existing content. */
  async appendProjectToResume(
    resumeId: string,
    project: ResumeProjectCandidate,
    currentSections: Record<string, string>
  ): Promise<string> {
    const nextContent = appendToFreeformContent(currentSections.projects ?? "", formatProjectSnippet(project));
    await resumeService.updateFreeformSection(resumeId, "projects", nextContent, currentSections);
    return nextContent;
  },

  /** Delegates to the shared compute_ats_breakdown() Postgres function (see migration 0057) so scoring and its admin-configured guidance are identical across every client. */
  async getATSBreakdown(resumeId: string): Promise<ATSBreakdown> {
    try {
      const { data, error } = await supabase.rpc("compute_ats_breakdown", { p_resume_id: resumeId });
      if (error || !data) throw new Error(error?.message ?? "Could not analyze this resume.");
      return data as ATSBreakdown;
    } catch (error) {
      console.info(`[resume.service] getATSBreakdown: using sample content (${(error as Error).message})`);
      return sampleATSBreakdown(resumeId);
    }
  },

  /** Renders the resume as real HTML and generates an actual PDF file on-device via expo-print. */
  async generatePdf(resumeId: string): Promise<{ uri: string; title: string }> {
    const doc = await resumeService.getResumeDetail(resumeId);
    const catalog = await resumeService.getTemplateCatalog();
    const accent = catalog.find((t) => t.id === doc.template)?.accentColor ?? DEFAULT_TEMPLATE_CATALOG[0].accentColor;
    const html = renderResumeHtml(doc, accent);
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

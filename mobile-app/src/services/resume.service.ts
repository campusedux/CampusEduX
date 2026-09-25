import { supabase } from "@/lib/supabase";
import { mimeFromName } from "@/lib/uploadMime";
import * as Print from "expo-print";
import { BRAND } from "@/constants/brand";
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
  ResumeLayout,
  ManageableResumeSectionKey,
  ResumeContent,
} from "@/types";
import { RESUME_FREEFORM_SECTIONS, MANAGEABLE_RESUME_SECTIONS } from "@/types";
import {
  SAMPLE_RESUME_LIST,
  sampleResumeDetail,
  sampleATSBreakdown,
  sampleResumeDownloadHistory,
} from "@/data/sampleResumeContent";
import {
  normalizeResumeContent,
  contentToLegacyColumns,
  defaultStarterContent,
  buildResumeRenderModel,
  applyLegacyTextSection,
  applyLegacyEducation,
  applyLegacySkills,
} from "@/services/resumeContent";
import { templateSpec } from "@/services/resumeTemplateSpecs";
import { resolveDesign, effectiveAccent } from "@/services/resumeDesign";

/** Shape returned by the website's /api/resume/parse route (lib/resumeBuilder/parser.ts ParsedResumeResult). */
export interface ParsedResumeUpload {
  contact: { fullName: string | null; email: string | null; phone: string | null; linkedin: string | null; github: string | null; website: string | null };
  sections: Record<string, string>;
  education: ResumeEducationEntry[];
  skills: string[];
  unrecognizedText: string;
}

const EMPTY_PERSONAL: ResumePersonalDetails = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
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

/**
 * Turns whatever is stored in resumes_builder.layout (`{}` for a resume
 * created before this column existed, or missing a section added to
 * MANAGEABLE_RESUME_SECTIONS since the resume was last saved) into a
 * complete, valid layout. Mirrors website's lib/resumeBuilder/sections.ts
 * normalizeLayout() exactly, so both platforms agree on the default order.
 * Exported for unit testing.
 */
export function normalizeResumeLayout(raw: unknown): ResumeLayout {
  const isManageable = (key: unknown): key is ManageableResumeSectionKey =>
    typeof key === "string" && (MANAGEABLE_RESUME_SECTIONS as readonly string[]).includes(key);

  const source = (raw ?? {}) as { order?: unknown; hidden?: unknown };
  const rawOrder = Array.isArray(source.order) ? source.order.filter(isManageable) : [];
  const order = [...rawOrder, ...MANAGEABLE_RESUME_SECTIONS.filter((key) => !rawOrder.includes(key))];
  const hidden = Array.isArray(source.hidden) ? source.hidden.filter(isManageable) : [];
  return { order, hidden };
}

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
    content: normalizeResumeContent(row.content, {
      sections: row.sections,
      education: row.education,
      skills: row.skills,
      layout: row.layout,
    }),
    isDemo: row.is_demo === true,
    design: (row.design ?? {}) as ResumeDocument["design"],
    education: row.education ?? [],
    skills: row.skills ?? { technical: [], soft: [] },
    sections,
    atsScore: row.ats_score ?? 0,
    layout: normalizeResumeLayout(row.layout),
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Renders the résumé as print HTML from the structured `content` model,
 * styled from the SAME TemplateSpec + design overrides as the on-screen
 * <ResumeDocument> (resumeTemplateSpecs.ts / resumeDesign.ts) — header
 * alignment, heading rule, accent usage, font family and margins all track
 * the chosen template, so the on-device PDF matches the live preview.
 */
function renderResumeHtml(doc: ResumeDocument, templateAccent: string): string {
  const spec = resolveDesign(templateSpec(doc.template), doc.design);
  const accent = effectiveAccent(templateAccent, doc.design);
  const t = spec.type;
  const showAccent = spec.accent !== "none";
  const centered = spec.header === "centered-serif";
  const band = spec.header === "accent-band";
  const model = buildResumeRenderModel({ personalDetails: doc.personalDetails, content: doc.content });
  const bullet = spec.bulletChar || "•";
  const pad = band ? 0 : Math.max(24, Math.round(t.padding * 0.7));

  const headingHtml = (txt: string) => {
    const base = `margin:${t.sectionGap}px 0 6px;font-size:${t.heading}px;text-transform:uppercase;font-weight:700;`;
    if (spec.heading === "full-underline")
      return `<h3 style="${base}color:#000;letter-spacing:0.5px;border-bottom:1.5px solid #000;padding-bottom:3px;">${escapeHtml(txt)}</h3>`;
    if (spec.heading === "plain-caps")
      return `<h3 style="${base}color:#6B7280;font-weight:600;letter-spacing:1.4px;">${escapeHtml(txt)}</h3>`;
    if (spec.heading === "bar")
      return `<h3 style="${base}color:#111827;border-left:4px solid ${accent};padding-left:8px;">${escapeHtml(txt)}</h3>`;
    return `<h3 style="${base}color:${showAccent ? accent : "#111827"};border-bottom:1px solid ${showAccent ? accent + "55" : "#E5E7EB"};padding-bottom:3px;">${escapeHtml(txt)}</h3>`;
  };

  const body = model.blocks
    .map((block) => {
      if (block.variant === "entries" && block.entries) {
        const rows = block.entries
          .map((e) => {
            const head = `<div style="display:flex;justify-content:space-between;"><span style="font-weight:700;">${escapeHtml(e.title)}${e.subtitle ? ` &mdash; <span style="font-weight:500;color:#374151;">${escapeHtml(e.subtitle)}</span>` : ""}</span>${e.meta ? `<span style="font-size:${t.small}px;color:#6B7280;white-space:nowrap;">${escapeHtml(e.meta)}</span>` : ""}</div>`;
            const bullets = e.bullets.map((b) => `<div style="margin:1px 0 0 10px;"><span style="color:${showAccent ? accent : "#6B7280"};">${bullet}</span> ${escapeHtml(b)}</div>`).join("");
            const tags = e.tags.length ? `<div style="margin-top:2px;font-size:${t.small}px;color:#6B7280;">${escapeHtml(e.tags.join(" · "))}</div>` : "";
            const url = e.url ? `<div style="margin-top:1px;font-size:${t.small}px;color:${showAccent ? accent : "#6B7280"};">${escapeHtml(e.url)}</div>` : "";
            return `<div style="margin-bottom:8px;">${head}${bullets}${tags}${url}</div>`;
          })
          .join("");
        return headingHtml(block.heading) + rows;
      }
      if (block.variant === "tags" && block.chips && spec.skills === "chips") {
        const chips = block.chips
          .map(
            (c) =>
              `<span style="display:inline-block;font-size:${t.small}px;padding:2px 8px;margin:0 6px 6px 0;border-radius:6px;background:${showAccent ? accent + "14" : "#F3F4F6"};color:${showAccent ? accent : "#374151"};border:1px solid ${showAccent ? accent + "33" : "#E5E7EB"};">${escapeHtml(c)}</span>`,
          )
          .join("");
        return headingHtml(block.heading) + `<div>${chips}</div>`;
      }
      const lines = block.lines.map((l) => `<div style="margin:0 0 2px;color:#374151;white-space:pre-wrap;">${escapeHtml(l)}</div>`).join("");
      return headingHtml(block.heading) + lines;
    })
    .join("");

  const align = centered ? "center" : "left";
  const nameSize = Math.round(t.name * 0.7);
  const header = band
    ? `<div style="background:${accent};color:#fff;padding:${t.padding}px ${t.padding + 8}px;">
         <div style="font-size:${nameSize}px;font-weight:700;">${escapeHtml(model.fullName)}</div>
         ${model.jobTitle ? `<div style="font-size:${t.title}px;opacity:.92;margin-top:3px;">${escapeHtml(model.jobTitle)}</div>` : ""}
         ${model.contactLine ? `<div style="font-size:${t.small}px;opacity:.8;margin-top:6px;">${escapeHtml(model.contactLine)}</div>` : ""}
       </div>`
    : `<div style="text-align:${align};padding-bottom:10px;margin-bottom:${t.sectionGap}px;border-bottom:${centered ? "1.5px solid #000" : spec.header === "left-accent" ? `2px solid ${accent}` : "1px solid #E5E7EB"};">
         <div style="font-size:${nameSize}px;font-weight:${spec.header === "left-plain" ? 400 : 700};">${escapeHtml(model.fullName)}</div>
         ${model.jobTitle ? `<div style="font-size:${t.title}px;margin-top:3px;color:${showAccent && spec.accent === "bold" ? accent : "#374151"};${centered ? "text-transform:uppercase;letter-spacing:1.2px;" : ""}">${escapeHtml(model.jobTitle)}</div>` : ""}
         ${model.contactLine ? `<div style="font-size:${t.small}px;color:#6B7280;margin-top:6px;">${escapeHtml(model.contactLine)}</div>` : ""}
       </div>`;

  return `<html><head><meta charset="utf-8" /></head>
    <body style="font-family:${spec.fontFamily};color:#111827;font-size:${t.body}px;line-height:${t.lineHeight};margin:0;padding:${band ? 0 : pad}px;">
      ${header}
      <div style="${band ? `padding:${t.padding}px ${t.padding + 8}px 0;` : ""}">${body}</div>
    </body></html>`;
}

/**
 * Runs a Supabase write and swallows failures (e.g. the table has not been
 * created yet). Resume edits then stay local — the screens still work against
 * the sample content — instead of surfacing an error on every save.
 */
/**
 * Applies a change to the structured `content` model of a resume and writes
 * it back alongside the re-derived legacy columns. The mobile editor screens
 * still edit the legacy shapes; this keeps `content` (the source of truth,
 * shared with the website) in sync without discarding any structured section
 * the website may have added.
 */
async function patchContent(
  resumeId: string,
  patch: (content: ResumeContent) => ResumeContent,
  extra: Record<string, unknown> = {},
): Promise<{ error: { message: string } | null }> {
  const { data: row } = await supabase
    .from("resumes_builder")
    .select("content, sections, education, skills, layout")
    .eq("id", resumeId)
    .maybeSingle();
  const current = normalizeResumeContent(row?.content, {
    sections: row?.sections,
    education: row?.education,
    skills: row?.skills,
    layout: row?.layout,
  });
  const next = patch(current);
  const legacy = contentToLegacyColumns(next);
  return supabase
    .from("resumes_builder")
    .update({
      content: next,
      sections: legacy.sections,
      education: legacy.education,
      skills: legacy.skills,
      layout: legacy.layout,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", resumeId);
}

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
      // state; SAMPLE_RESUME_LIST is a __DEV__-only stand-in when the table/query fails.
      return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        template: row.template as ResumeTemplate,
        atsScore: row.ats_score ?? 0,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      // A failure must surface as ErrorState — never a sample list a student could mistake for their own résumés.
      if (__DEV__) {
        console.info(`[resume.service] getResumes: using sample content in dev (${(error as Error).message})`);
        return SAMPLE_RESUME_LIST;
      }
      throw error instanceof Error ? error : new Error(String(error));
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

    const content = defaultStarterContent();
    const legacy = contentToLegacyColumns(content);
    try {
      const { data, error } = await supabase
        .from("resumes_builder")
        .insert({
          user_id: userId,
          title: "Untitled Resume",
          template,
          personal_details: { ...EMPTY_PERSONAL, linkedin, website },
          content,
          education: legacy.education,
          skills: legacy.skills,
          sections: legacy.sections,
          layout: legacy.layout,
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
    await persist("updateEducation", () => patchContent(resumeId, (c) => applyLegacyEducation(c, education)));
  },

  async updateSkills(resumeId: string, skills: ResumeSkills): Promise<void> {
    await persist("updateSkills", () => patchContent(resumeId, (c) => applyLegacySkills(c, skills)));
  },

  async updateFreeformSection(resumeId: string, key: ResumeFreeformSectionKey, content: string, _currentSections: Record<string, string>): Promise<void> {
    void _currentSections; // kept for call-site compatibility; the section text is now applied onto `content`
    await persist("updateFreeformSection", () => patchContent(resumeId, (c) => applyLegacyTextSection(c, key, content)));
  },

  /** Saves the whole structured `content` model in one write (+ mirrored legacy columns). The block-list editor's autosave. */
  async updateContent(resumeId: string, content: ResumeContent): Promise<void> {
    const normalized = normalizeResumeContent(content);
    await persist("updateContent", () => patchContent(resumeId, () => normalized));
  },

  /** Create a résumé pre-filled with a template's demo persona (flagged is_demo). */
  async createResumeFromDemo(userId: string, template: ResumeTemplate, demo: { personalDetails: ResumePersonalDetails; content: ResumeContent }): Promise<string> {
    const content = normalizeResumeContent(demo.content);
    const legacy = contentToLegacyColumns(content);
    try {
      const { data, error } = await supabase
        .from("resumes_builder")
        .insert({
          user_id: userId,
          title: `${demo.personalDetails.jobTitle || "New"} résumé (demo)`,
          template,
          is_demo: true,
          personal_details: demo.personalDetails,
          content,
          education: legacy.education,
          skills: legacy.skills,
          sections: legacy.sections,
          layout: legacy.layout,
        })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Could not create resume.");
      return data.id;
    } catch (error) {
      console.info(`[resume.service] createResumeFromDemo: not persisted (${(error as Error).message})`);
      return `res-local-${Date.now()}`;
    }
  },

  async setDemoFlag(resumeId: string, isDemo: boolean): Promise<void> {
    await persist("setDemoFlag", () =>
      supabase.from("resumes_builder").update({ is_demo: isDemo, updated_at: new Date().toISOString() }).eq("id", resumeId),
    );
  },

  /** Wipes a résumé back to the empty starter set and drops the demo flag. */
  async clearContent(resumeId: string): Promise<void> {
    const content = defaultStarterContent();
    await persist("clearContent", () =>
      patchContent(
        resumeId,
        () => content,
        {
          is_demo: false,
          personal_details: {
            fullName: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", photoUrl: null,
          },
        },
      ),
    );
  },

  /**
   * Uploads a PDF/DOCX to the website's /api/resume/parse (bearer JWT — same
   * dual-auth route the AI-assist call uses) and returns the heuristic parse
   * result. Nothing is saved until the caller reviews + imports it.
   */
  async parseUploadedResume(file: { uri: string; name: string; mimeType?: string | null }): Promise<ParsedResumeUpload> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Please sign in again.");

    const form = new FormData();
    // React Native's fetch understands this { uri, name, type } shape for file parts.
    form.append("file", { uri: file.uri, name: file.name, type: mimeFromName(file.name) ?? file.mimeType ?? "application/octet-stream" } as unknown as Blob);

    const res = await fetch(`${BRAND.website.replace(/\/$/, "")}/api/resume/parse`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error ?? "Couldn't read that file. Try a text-based PDF or DOCX.");
    return body.parsed as ParsedResumeUpload;
  },

  /** Creates a NEW résumé from a reviewed parse result — never overwrites an existing one. */
  async createResumeFromParsed(userId: string, parsed: ParsedResumeUpload): Promise<string> {
    const personal: ResumePersonalDetails = {
      fullName: parsed.contact.fullName ?? "",
      jobTitle: "",
      email: parsed.contact.email ?? "",
      phone: parsed.contact.phone ?? "",
      location: "",
      linkedin: parsed.contact.linkedin ?? "",
      github: parsed.contact.github ?? "",
      website: parsed.contact.website ?? "",
      photoUrl: null,
    };
    const legacy = {
      sections: parsed.sections ?? {},
      education: parsed.education ?? [],
      skills: { technical: parsed.skills ?? [], soft: [] as string[] },
      layout: { order: [] as string[], hidden: [] as string[] },
    };
    const content = normalizeResumeContent(undefined, legacy);
    const cols = contentToLegacyColumns(content);
    const { data, error } = await supabase
      .from("resumes_builder")
      .insert({
        user_id: userId,
        title: personal.fullName ? `${personal.fullName}'s Resume` : "Imported Resume",
        template: "modern",
        is_demo: false,
        personal_details: personal,
        content,
        education: cols.education,
        skills: cols.skills,
        sections: cols.sections,
        layout: cols.layout,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not create the résumé.");
    return data.id;
  },

  /** Deterministic JD keyword match — delegates to the shared match_resume_to_jd() Postgres function. */
  async matchJd(resumeId: string, jdText: string): Promise<{ matchPercent: number; matched: string[]; missing: string[]; jdKeywordCount: number }> {
    const { data, error } = await supabase.rpc("match_resume_to_jd", { p_resume_id: resumeId, p_jd_text: jdText });
    if (error || !data) throw new Error(error?.message ?? "Couldn't match this résumé against that job description.");
    return data as { matchPercent: number; matched: string[]; missing: string[]; jdKeywordCount: number };
  },

  async updateDesign(resumeId: string, design: ResumeDocument["design"]): Promise<void> {
    await persist("updateDesign", () =>
      supabase.from("resumes_builder").update({ design, updated_at: new Date().toISOString() }).eq("id", resumeId),
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

  /** Creates a new public share link (owner-RLS insert — resume_shares.token defaults server-side) and returns its full public URL. */
  async createShareLink(userId: string, resumeId: string): Promise<string> {
    const { data, error } = await supabase
      .from("resume_shares")
      .insert({ user_id: userId, resume_id: resumeId })
      .select("token")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not create a share link.");
    return `${BRAND.website.replace(/\/$/, "")}/r/${data.token}`;
  },
};

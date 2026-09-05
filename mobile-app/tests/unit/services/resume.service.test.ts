jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("expo-print", () => ({ printToFileAsync: jest.fn(() => Promise.resolve({ uri: "file:///tmp/resume.pdf" })) }));

import { resumeService, formatProjectSnippet, appendToFreeformContent, normalizeResumeLayout } from "@/services/resume.service";
import { resetSupabaseMock, setTableResult, setRpcResult, supabase } from "../../mocks/supabase.mock";
import { SAMPLE_RESUME_LIST } from "@/data/sampleResumeContent";

beforeEach(() => resetSupabaseMock());

const resumeRow = {
  id: "res-1",
  title: "Rohan's Resume",
  template: "modern",
  personal_details: { fullName: "Rohan Verma", jobTitle: "SDE Intern", email: "r@x.com", phone: "9", location: "Blr" },
  education: [{ degree: "B.Tech", institution: "IIT", startYear: 2021, endYear: 2025 }],
  skills: { technical: ["React", "TypeScript", "Node"], soft: ["Communication"] },
  sections: { summary: "Built and led several production projects with a strong team.", experience: "Developed APIs and improved database performance.", projects: "Implemented a full-stack marketplace." },
  ats_score: 72,
  updated_at: "2025-06-01T00:00:00.000Z",
};

describe("resumeService.getResumes", () => {
  it("maps the summary rows for a student who has resumes", async () => {
    setTableResult("resumes_builder", { data: [{ id: "res-1", title: "My CV", template: "modern", ats_score: 80, updated_at: "2025-06-01" }] });

    const list = await resumeService.getResumes("u-1");

    expect(list).toEqual([{ id: "res-1", title: "My CV", template: "modern", atsScore: 80, updatedAt: "2025-06-01" }]);
  });

  it("returns an empty list (not the sample) for a student with no resumes", async () => {
    setTableResult("resumes_builder", { data: [] });
    expect(await resumeService.getResumes("u-1")).toEqual([]);
  });

  it("falls back to SAMPLE_RESUME_LIST when the query fails", async () => {
    setTableResult("resumes_builder", { error: { message: "relation does not exist" } });
    expect(await resumeService.getResumes("u-1")).toEqual(SAMPLE_RESUME_LIST);
  });
});

describe("resumeService.createResume", () => {
  it("returns the new row id on success", async () => {
    setTableResult("resumes_builder", { data: [{ id: "res-new" }] });
    expect(await resumeService.createResume("u-1", "professional")).toBe("res-new");
  });

  it("returns a local id when the insert fails so the builder still works offline", async () => {
    setTableResult("resumes_builder", { error: { message: "no table" } });
    const id = await resumeService.createResume("u-1", "modern");
    expect(id).toMatch(/^res-local-/);
  });

  it("prefills LinkedIn/website from the user's profile", async () => {
    setTableResult("profiles", { data: [{ linkedin_url: "linkedin.com/in/rohan", portfolio_url: "rohan.dev" }] });
    setTableResult("resumes_builder", { data: [{ id: "res-new" }] });

    await resumeService.createResume("u-1", "modern");

    const fromMock = supabase.from as jest.Mock;
    const resumesBuilderIndex = fromMock.mock.calls.findIndex((c) => c[0] === "resumes_builder");
    const builder = fromMock.mock.results[resumesBuilderIndex].value;
    const insertPayload = (builder.insert as jest.Mock).mock.calls[0][0];

    expect(insertPayload.personal_details).toMatchObject({ linkedin: "linkedin.com/in/rohan", website: "rohan.dev" });
  });
});

describe("resumeService.getResumeDetail", () => {
  it("maps a stored row into a ResumeDocument", async () => {
    setTableResult("resumes_builder", { data: [resumeRow] });

    const doc = await resumeService.getResumeDetail("res-1");

    expect(doc.title).toBe("Rohan's Resume");
    expect(doc.personalDetails.fullName).toBe("Rohan Verma");
    expect(doc.sections.certifications).toBe(""); // freeform keys are backfilled
    expect(doc.education).toHaveLength(1);
  });

  it("falls back to sample content when the row is missing", async () => {
    setTableResult("resumes_builder", { data: [] });
    const doc = await resumeService.getResumeDetail("missing");
    expect(doc.id).toBe("missing");
  });
});

describe("resumeService write helpers", () => {
  it("updateTemplate swallows a persistence failure (edits stay local)", async () => {
    setTableResult("resumes_builder", { error: { message: "no table" } });
    await expect(resumeService.updateTemplate("res-1", "creative")).resolves.toBeUndefined();
  });

  it("deleteResume does not throw when the delete fails", async () => {
    setTableResult("resumes_builder", { error: { message: "no table" } });
    await expect(resumeService.deleteResume("res-1")).resolves.toBeUndefined();
  });
});

describe("resumeService.getATSBreakdown", () => {
  const rpcBreakdown = {
    overall: 82,
    content: 90,
    formatting: 80,
    skills: 70,
    keywords: 85,
    tips: [{ ruleId: "gen-1", section: "general", problem: "Match keywords from the job description", why: "Mirror the exact phrasing.", importance: "high", checked: false }],
  };

  it("delegates to the shared compute_ats_breakdown RPC", async () => {
    setRpcResult("compute_ats_breakdown", { data: rpcBreakdown, error: null });

    const result = await resumeService.getATSBreakdown("res-1");

    expect(supabase.rpc).toHaveBeenCalledWith("compute_ats_breakdown", { p_resume_id: "res-1" });
    expect(result).toEqual(rpcBreakdown);
  });

  it("falls back to sample content when the RPC is unavailable", async () => {
    setRpcResult("compute_ats_breakdown", { data: null, error: { message: "function does not exist" } });
    const result = await resumeService.getATSBreakdown("res-1");
    expect(result.tips.length).toBeGreaterThan(0);
  });
});

describe("resumeService.getTemplateCatalog", () => {
  it("maps the admin-managed catalog", async () => {
    setTableResult("resume_templates", { data: [{ id: "fresher-blue", name: "Fresher Blue", accent_color: "#2563EB" }] });
    const catalog = await resumeService.getTemplateCatalog();
    expect(catalog).toEqual([{ id: "fresher-blue", name: "Fresher Blue", accentColor: "#2563EB" }]);
  });

  it("falls back to the built-in defaults when the catalog is empty or unmigrated", async () => {
    setTableResult("resume_templates", { data: [] });
    const catalog = await resumeService.getTemplateCatalog();
    expect(catalog.map((t) => t.id)).toEqual(["modern", "professional", "minimal", "creative"]);
  });
});

describe("resumeService.generatePdf", () => {
  it("renders the resume to HTML and returns the generated file uri + title", async () => {
    setTableResult("resumes_builder", { data: [resumeRow] });
    const Print = require("expo-print");

    const result = await resumeService.generatePdf("res-1");

    expect(Print.printToFileAsync).toHaveBeenCalledWith(expect.objectContaining({ base64: false }));
    const html = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain("Rohan Verma");
    expect(result).toEqual({ uri: "file:///tmp/resume.pdf", title: "Rohan's Resume" });
  });
});

describe("formatProjectSnippet", () => {
  it("includes the tech line and description when both are present", () => {
    const snippet = formatProjectSnippet({ title: "Campus Marketplace", description: "A full-stack store for student sellers.", technologyPreference: "React, Node.js" });
    expect(snippet).toBe("Campus Marketplace — React, Node.js\nA full-stack store for student sellers.");
  });

  it("omits the tech suffix and description line when they're blank", () => {
    expect(formatProjectSnippet({ title: "Portfolio Site", description: "  ", technologyPreference: "" })).toBe("Portfolio Site");
  });
});

describe("appendToFreeformContent", () => {
  it("appends with a blank-line separator when there is existing content", () => {
    expect(appendToFreeformContent("Existing project one.", "New Project — React")).toBe("Existing project one.\n\nNew Project — React");
  });

  it("returns just the snippet when the section was empty", () => {
    expect(appendToFreeformContent("   ", "New Project — React")).toBe("New Project — React");
  });
});

describe("resumeService.listMyCustomProjects", () => {
  it("maps ready/delivered custom projects into resume-ready candidates", async () => {
    setTableResult("custom_project_requests", {
      data: [{ id: "cp-1", title: "Campus Marketplace", description: "A store for student sellers.", technology_preference: "React, Node.js", status: "delivered" }],
    });
    const projects = await resumeService.listMyCustomProjects("u-1");
    expect(projects).toEqual([{ id: "cp-1", title: "Campus Marketplace", description: "A store for student sellers.", technologyPreference: "React, Node.js" }]);
  });

  it("returns an empty list (not a throw) when the query fails", async () => {
    setTableResult("custom_project_requests", { error: { message: "no table" } });
    expect(await resumeService.listMyCustomProjects("u-1")).toEqual([]);
  });
});

describe("resumeService.appendProjectToResume", () => {
  it("appends a formatted project snippet to the projects section without touching other sections", async () => {
    setTableResult("resumes_builder", { error: null });
    const currentSections = { summary: "My summary.", experience: "My experience.", projects: "Old Project — Python" };
    const project = { id: "cp-1", title: "Campus Marketplace", description: "A store for student sellers.", technologyPreference: "React, Node.js" };

    const result = await resumeService.appendProjectToResume("res-1", project, currentSections);

    expect(result).toBe("Old Project — Python\n\nCampus Marketplace — React, Node.js\nA store for student sellers.");
    expect(supabase.from).toHaveBeenCalledWith("resumes_builder");
  });
});

describe("resumeService.getDownloadHistory", () => {
  it("maps download rows", async () => {
    setTableResult("resume_downloads", { data: [{ id: "d1", resume_id: "res-1", resume_title: "CV", file_url: "u", downloaded_at: "2025-06-01" }] });

    const history = await resumeService.getDownloadHistory("u-1");

    expect(history).toEqual([{ id: "d1", resumeId: "res-1", resumeTitle: "CV", fileUrl: "u", downloadedAt: "2025-06-01" }]);
  });

  it("falls back to sample download history on error", async () => {
    setTableResult("resume_downloads", { error: { message: "no table" } });
    expect((await resumeService.getDownloadHistory("u-1")).length).toBeGreaterThan(0);
  });

  it("records a download without throwing when the table is absent", async () => {
    setTableResult("resume_downloads", { error: { message: "no table" } });
    await expect(resumeService.recordDownload("u-1", "res-1", "CV", "https://f")).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith("resume_downloads");
  });
});

describe("resumeService.createShareLink", () => {
  it("returns the full public share URL from the created token", async () => {
    setTableResult("resume_shares", { data: [{ token: "abc123" }] });
    const url = await resumeService.createShareLink("u-1", "res-1");
    expect(url).toBe("https://campusedux.app/r/abc123");
    const insertCall = (supabase.from as jest.Mock).mock.calls.findIndex((c) => c[0] === "resume_shares");
    const builder = (supabase.from as jest.Mock).mock.results[insertCall].value;
    expect((builder.insert as jest.Mock).mock.calls[0][0]).toEqual({ user_id: "u-1", resume_id: "res-1" });
  });

  it("throws a clear error when the insert fails", async () => {
    setTableResult("resume_shares", { error: { message: "network down" } });
    await expect(resumeService.createShareLink("u-1", "res-1")).rejects.toThrow("network down");
  });
});

describe("normalizeResumeLayout", () => {
  it("returns the full default order for an empty/missing layout", () => {
    const result = normalizeResumeLayout({});
    expect(result.order).toEqual(["summary", "education", "skills", "experience", "projects", "certifications", "achievements", "languages", "references"]);
    expect(result.hidden).toEqual([]);
  });

  it("preserves a stored order and appends any section missing from it", () => {
    const result = normalizeResumeLayout({ order: ["skills", "summary"], hidden: ["skills"] });
    expect(result.order.slice(0, 2)).toEqual(["skills", "summary"]);
    expect(result.order).toHaveLength(9);
    expect(result.hidden).toEqual(["skills"]);
  });

  it("drops unrecognised keys instead of trusting arbitrary stored strings", () => {
    const result = normalizeResumeLayout({ order: ["summary", "not-a-real-section"], hidden: ["also-fake"] });
    expect(result.order).not.toContain("not-a-real-section");
    expect(result.hidden).toEqual([]);
  });

  it("maps a stored resumes_builder row's layout into the returned ResumeDocument", async () => {
    setTableResult("resumes_builder", { data: [{ id: "res-1", title: "t", template: "modern", layout: { order: ["skills"], hidden: [] } }] });
    const doc = await resumeService.getResumeDetail("res-1");
    expect(doc.layout.order[0]).toBe("skills");
    expect(doc.layout.order).toHaveLength(9);
  });
});

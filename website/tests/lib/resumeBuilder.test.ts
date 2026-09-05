import { describe, it, expect, vi, beforeEach } from "vitest";

import { supabase, resetSupabaseMock, setUser, setTableResult, callsFor } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import { formatProjectSnippet, appendToFreeformContent } from "@/lib/resumeBuilder/formatting";
import {
  listMyResumeProjectCandidatesAction,
  appendCustomProjectToResumeAction,
  updateResumeTemplateAction,
  updateResumePersonalDetailsAction,
  updateResumeEducationAction,
  updateResumeSkillsAction,
  updateResumeFreeformSectionAction,
  updateResumeLayoutAction,
} from "@/lib/actions/resumeBuilder";

const USER = { id: "user-1", email: "s@campusedux.app" };
const RESUME_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  resetSupabaseMock();
});

describe("formatProjectSnippet", () => {
  it("includes the tech line and description when both are present", () => {
    const snippet = formatProjectSnippet({
      title: "Campus Marketplace",
      description: "A full-stack store for student sellers.",
      technologyPreference: "React, Node.js",
    });
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

describe("listMyResumeProjectCandidatesAction", () => {
  it("rejects when signed out", async () => {
    setUser(null);
    const result = await listMyResumeProjectCandidatesAction();
    expect(result).toEqual({ error: expect.stringMatching(/sign in/i) });
  });

  it("maps ready/delivered projects into candidates", async () => {
    setUser(USER);
    setTableResult("custom_project_requests", {
      data: [{ id: "cp-1", title: "Campus Marketplace", description: "A store for student sellers.", technology_preference: "React, Node.js", status: "delivered" }],
    });
    const result = await listMyResumeProjectCandidatesAction();
    expect(result).toEqual([{ id: "cp-1", title: "Campus Marketplace", description: "A store for student sellers.", technologyPreference: "React, Node.js" }]);
    expect(callsFor("custom_project_requests").some((c) => c.verb === "eq" && c.args[0] === "user_id" && c.args[1] === "user-1")).toBe(true);
  });
});

describe("appendCustomProjectToResumeAction", () => {
  it("rejects an invalid resume id", async () => {
    setUser(USER);
    const result = await appendCustomProjectToResumeAction("not-a-uuid", "cp-1");
    expect(result).toEqual({ error: "Invalid request." });
  });

  it("rejects when signed out", async () => {
    setUser(null);
    const result = await appendCustomProjectToResumeAction(RESUME_ID, "cp-1");
    expect(result).toEqual({ error: expect.stringMatching(/sign in/i) });
  });

  it("rejects when the resume does not belong to the caller", async () => {
    setUser(USER);
    setTableResult("resumes_builder", { data: null });
    setTableResult("custom_project_requests", { data: { id: "cp-1", status: "ready" } });
    const result = await appendCustomProjectToResumeAction(RESUME_ID, "cp-1");
    expect(result).toEqual({ error: "That resume could not be found." });
  });

  it("rejects a project that is not ready/delivered", async () => {
    setUser(USER);
    setTableResult("resumes_builder", { data: { id: RESUME_ID, sections: {} } });
    setTableResult("custom_project_requests", { data: { id: "cp-1", title: "WIP", description: "", technology_preference: "", status: "in_development" } });
    const result = await appendCustomProjectToResumeAction(RESUME_ID, "cp-1");
    expect(result).toEqual({ error: "Only finished projects (ready or delivered) can be added to a resume." });
  });

  it("appends the project to an existing projects section without touching other sections", async () => {
    setUser(USER);
    setTableResult("resumes_builder", {
      data: { id: RESUME_ID, sections: { summary: "My summary.", projects: "Old Project — Python" } },
    });
    setTableResult("custom_project_requests", {
      data: { id: "cp-1", title: "Campus Marketplace", description: "A store for student sellers.", technology_preference: "React, Node.js", status: "delivered" },
    });

    const result = await appendCustomProjectToResumeAction(RESUME_ID, "cp-1");

    expect(result).toEqual({ content: "Old Project — Python\n\nCampus Marketplace — React, Node.js\nA store for student sellers." });
    const update = callsFor("resumes_builder").find((c) => c.verb === "update");
    const updatedSections = (update?.args[0] as { sections: Record<string, string> }).sections;
    expect(updatedSections.summary).toBe("My summary.");
    expect(updatedSections.projects).toBe("Old Project — Python\n\nCampus Marketplace — React, Node.js\nA store for student sellers.");
  });
});

const VALID_PERSONAL = {
  fullName: "Rohan Verma",
  jobTitle: "SDE Intern",
  email: "r@x.com",
  phone: "9999999999",
  location: "Bengaluru",
  linkedin: "linkedin.com/in/rohan",
  website: "rohan.dev",
  photoUrl: null,
};

describe("Phase 4 editor actions", () => {
  beforeEach(() => {
    setUser(USER);
    setTableResult("resumes_builder", { data: { id: RESUME_ID } }); // the .select("id").maybeSingle() re-read
  });

  it("updateResumeTemplateAction rejects when signed out", async () => {
    setUser(null);
    const result = await updateResumeTemplateAction(RESUME_ID, "modern");
    expect(result).toEqual({ error: expect.stringMatching(/sign in/i) });
  });

  it("updateResumeTemplateAction rejects an invalid resume id", async () => {
    const result = await updateResumeTemplateAction("not-a-uuid", "modern");
    expect(result).toEqual({ error: "Invalid request." });
  });

  it("updateResumeTemplateAction saves a valid template scoped to the caller", async () => {
    const result = await updateResumeTemplateAction(RESUME_ID, "professional");
    expect(result).toEqual({ ok: true });
    const update = callsFor("resumes_builder").find((c) => c.verb === "update");
    expect(update?.args[0]).toMatchObject({ template: "professional" });
    const eqArgs = callsFor("resumes_builder")
      .filter((c) => c.verb === "eq")
      .map((c) => c.args);
    expect(eqArgs).toEqual(
      expect.arrayContaining([
        ["id", RESUME_ID],
        ["user_id", "user-1"],
      ]),
    );
  });

  it("updateResumeTemplateAction reports not-found when 0 rows match (wrong owner/missing resume)", async () => {
    setTableResult("resumes_builder", { data: null });
    const result = await updateResumeTemplateAction(RESUME_ID, "modern");
    expect(result).toEqual({ error: "That resume could not be found." });
  });

  it("updateResumePersonalDetailsAction validates and derives the title from fullName", async () => {
    const result = await updateResumePersonalDetailsAction(RESUME_ID, VALID_PERSONAL);
    expect(result).toEqual({ ok: true });
    const update = callsFor("resumes_builder").find((c) => c.verb === "update");
    expect(update?.args[0]).toMatchObject({ personal_details: VALID_PERSONAL, title: "Rohan Verma's Resume" });
  });

  it("updateResumePersonalDetailsAction rejects a malformed payload", async () => {
    const result = await updateResumePersonalDetailsAction(RESUME_ID, { fullName: "x" });
    expect(result).toEqual({ error: "Invalid request." });
  });

  it("updateResumeEducationAction saves a valid list", async () => {
    const education = [{ id: "e1", degree: "B.Tech", institution: "XYZ", startYear: "2020", endYear: "2024", percentage: "85" }];
    const result = await updateResumeEducationAction(RESUME_ID, education);
    expect(result).toEqual({ ok: true });
    const update = callsFor("resumes_builder").find((c) => c.verb === "update");
    expect(update?.args[0]).toMatchObject({ education });
  });

  it("updateResumeSkillsAction saves technical/soft lists", async () => {
    const skills = { technical: ["React", "Node.js"], soft: ["Communication"] };
    const result = await updateResumeSkillsAction(RESUME_ID, skills);
    expect(result).toEqual({ ok: true });
    const update = callsFor("resumes_builder").find((c) => c.verb === "update");
    expect(update?.args[0]).toMatchObject({ skills });
  });

  it("updateResumeFreeformSectionAction merges into the existing sections without touching others", async () => {
    const result = await updateResumeFreeformSectionAction(RESUME_ID, "summary", "New summary.", { summary: "Old.", experience: "Kept." });
    expect(result).toEqual({ ok: true });
    const update = callsFor("resumes_builder").find((c) => c.verb === "update");
    expect(update?.args[0]).toMatchObject({ sections: { summary: "New summary.", experience: "Kept." } });
  });

  it("updateResumeFreeformSectionAction rejects an unknown section key", async () => {
    const result = await updateResumeFreeformSectionAction(RESUME_ID, "not-a-section", "x", {});
    expect(result).toEqual({ error: "Invalid request." });
  });

  it("updateResumeLayoutAction normalizes before saving (drops unknown keys, fills in missing sections)", async () => {
    const result = await updateResumeLayoutAction(RESUME_ID, { order: ["skills", "summary"], hidden: ["skills", "bogus"] });
    expect(result).toEqual({ ok: true });
    const update = callsFor("resumes_builder").find((c) => c.verb === "update");
    const savedLayout = (update?.args[0] as { layout: { order: string[]; hidden: string[] } }).layout;
    expect(savedLayout.order.slice(0, 2)).toEqual(["skills", "summary"]);
    expect(savedLayout.order).toHaveLength(9);
    expect(savedLayout.hidden).toEqual(["skills"]);
  });
});

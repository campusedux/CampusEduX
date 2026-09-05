import { describe, it, expect, vi, beforeEach } from "vitest";

import { supabase, resetSupabaseMock, setUser, setTableResult, callsFor } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import { formatProjectSnippet, appendToFreeformContent } from "@/lib/resumeBuilder/formatting";
import { listMyResumeProjectCandidatesAction, appendCustomProjectToResumeAction } from "@/lib/actions/resumeBuilder";

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

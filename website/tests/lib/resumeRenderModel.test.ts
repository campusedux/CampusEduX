import { describe, it, expect } from "vitest";
import { buildResumeRenderModel } from "@/lib/resumeBuilder/renderModel";
import { EMPTY_PERSONAL, type ResumeDocument } from "@/lib/resumeBuilder/types";

function fixtureResume(overrides: Partial<ResumeDocument> = {}): ResumeDocument {
  return {
    id: "res-1",
    title: "Test Resume",
    template: "modern",
    personalDetails: { ...EMPTY_PERSONAL, fullName: "Rohan Verma", jobTitle: "SDE Intern", email: "r@x.com" },
    education: [{ id: "e1", degree: "B.Tech", institution: "IIT", startYear: "2020", endYear: "2024", percentage: "85" }],
    skills: { technical: ["React", "Node.js"], soft: ["Communication"] },
    sections: {
      summary: "A short pitch.",
      experience: "Line one\nLine two",
      projects: "",
      certifications: "",
      achievements: "",
      languages: "",
      references: "",
    },
    atsScore: 0,
    layout: { order: [], hidden: [] },
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildResumeRenderModel", () => {
  it("builds the contact line from filled personal fields only", () => {
    const model = buildResumeRenderModel(fixtureResume());
    expect(model.fullName).toBe("Rohan Verma");
    expect(model.contactLine).toBe("r@x.com");
  });

  it("skips empty sections and empty education/skills", () => {
    const model = buildResumeRenderModel(fixtureResume({ education: [], skills: { technical: [], soft: [] } }));
    expect(model.blocks.map((b) => b.key)).not.toContain("education");
    expect(model.blocks.map((b) => b.key)).not.toContain("skills");
    expect(model.blocks.map((b) => b.key)).not.toContain("projects");
  });

  it("follows the stored layout order and respects hidden sections", () => {
    const model = buildResumeRenderModel(
      fixtureResume({ layout: { order: ["experience", "summary", "education", "skills"], hidden: ["summary"] } }),
    );
    expect(model.blocks.map((b) => b.key)).toEqual(["experience", "education", "skills"]);
  });

  it("formats education as one line per entry", () => {
    const model = buildResumeRenderModel(fixtureResume());
    const eduBlock = model.blocks.find((b) => b.key === "education");
    expect(eduBlock?.lines).toEqual(["B.Tech — IIT (2020-2024), 85%"]);
  });

  it("joins technical + soft skills into a single line", () => {
    const model = buildResumeRenderModel(fixtureResume());
    const skillsBlock = model.blocks.find((b) => b.key === "skills");
    expect(skillsBlock?.lines).toEqual(["React, Node.js, Communication"]);
  });

  it("splits freeform section content into one line per newline", () => {
    const model = buildResumeRenderModel(fixtureResume());
    const expBlock = model.blocks.find((b) => b.key === "experience");
    expect(expBlock?.lines).toEqual(["Line one", "Line two"]);
  });
});

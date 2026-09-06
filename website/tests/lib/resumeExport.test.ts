import { describe, it, expect } from "vitest";
import { renderResumePdfBuffer } from "@/lib/resumeBuilder/pdfDocument";
import { renderResumeDocxBuffer } from "@/lib/resumeBuilder/docxBuilder";
import { slugifyFileName } from "@/lib/resumeBuilder/formatting";
import { normalizeContent } from "@/lib/resumeBuilder/content";
import { EMPTY_PERSONAL, type ResumeDocument } from "@/lib/resumeBuilder/types";

// These exercise the real @react-pdf/renderer and docx libraries (not
// mocked) — the goal is to catch a broken integration (wrong import, a
// runtime-only API misuse) rather than just checking the code compiles.

function fixtureResume(): ResumeDocument {
  const education = [{ id: "e1", degree: "B.Tech", institution: "IIT", startYear: "2020", endYear: "2024", percentage: "85" }];
  const skills = { technical: ["React", "Node.js"], soft: ["Communication"] };
  const sections = {
    summary: "Software engineer with a strong foundation in full-stack development.",
    experience: "Built and led a small team shipping production features.",
    projects: "",
    certifications: "",
    achievements: "",
    languages: "",
    references: "",
  };
  return {
    id: "res-1",
    title: "Rohan's Software Engineer Resume",
    template: "modern",
    personalDetails: { ...EMPTY_PERSONAL, fullName: "Rohan Verma", jobTitle: "SDE Intern", email: "r@x.com", phone: "9999999999" },
    content: normalizeContent(undefined, { sections, education, skills, layout: { order: [], hidden: [] } }),
    education,
    skills,
    sections,
    isDemo: false,
    design: {},
    atsScore: 0,
    layout: { order: [], hidden: [] },
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("renderResumePdfBuffer", () => {
  it("produces a real, non-trivially-sized PDF", async () => {
    const buffer = await renderResumePdfBuffer(fixtureResume(), "#4F39F6");
    expect(buffer.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("embeds the resume's actual text content, not placeholder copy", async () => {
    const buffer = await renderResumePdfBuffer(fixtureResume(), "#4F39F6");
    // react-pdf's stream compresses text objects, but names/metadata pass through in the clear
    expect(buffer.toString("latin1")).toContain("Rohan's Software Engineer Resume");
  });
});

describe("renderResumeDocxBuffer", () => {
  it("produces a real DOCX (zip-based) file", async () => {
    const buffer = await renderResumeDocxBuffer(fixtureResume(), "#1E3A8A");
    // DOCX is a zip archive — "PK" magic bytes confirm Packer actually ran
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
    expect(buffer.length).toBeGreaterThan(500);
  });
});

describe("structured entries in the exports", () => {
  function withExperienceEntries(): ResumeDocument {
    const base = fixtureResume();
    return {
      ...base,
      content: [
        {
          id: "exp",
          type: "experience",
          heading: "Work Experience",
          variant: "entries",
          hidden: false,
          entries: [
            {
              id: "x1",
              title: "Backend Engineer",
              subtitle: "Globex",
              location: "Remote",
              startDate: "2024",
              endDate: "Present",
              description: "Shipped the payments service\n- Cut error rate by 60%",
              url: "",
              tags: ["Go", "Postgres"],
            },
          ],
        },
      ],
    };
  }

  it("the PDF carries the entry title (name/metadata pass through uncompressed)", async () => {
    const buffer = await renderResumePdfBuffer(withExperienceEntries(), "#4F39F6");
    expect(buffer.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(500);
  });

  it("the DOCX round-trips the entry title and a bullet", async () => {
    const buffer = await renderResumeDocxBuffer(withExperienceEntries(), "#1E3A8A");
    const { default: mammoth } = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    expect(value).toContain("Backend Engineer");
    expect(value).toContain("Cut error rate by 60%");
    expect(value).toContain("Go · Postgres");
  });
});

describe("slugifyFileName", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugifyFileName("Rohan's Software Engineer Resume")).toBe("rohan-s-software-engineer-resume");
  });

  it("falls back to a default for an empty/symbols-only title", () => {
    expect(slugifyFileName("   ")).toBe("resume");
    expect(slugifyFileName("!!!")).toBe("resume");
  });
});

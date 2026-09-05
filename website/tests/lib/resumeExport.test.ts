import { describe, it, expect } from "vitest";
import { renderResumePdfBuffer } from "@/lib/resumeBuilder/pdfDocument";
import { renderResumeDocxBuffer } from "@/lib/resumeBuilder/docxBuilder";
import { slugifyFileName } from "@/lib/resumeBuilder/formatting";
import { EMPTY_PERSONAL, type ResumeDocument } from "@/lib/resumeBuilder/types";

// These exercise the real @react-pdf/renderer and docx libraries (not
// mocked) — the goal is to catch a broken integration (wrong import, a
// runtime-only API misuse) rather than just checking the code compiles.

function fixtureResume(): ResumeDocument {
  return {
    id: "res-1",
    title: "Rohan's Software Engineer Resume",
    template: "modern",
    personalDetails: { ...EMPTY_PERSONAL, fullName: "Rohan Verma", jobTitle: "SDE Intern", email: "r@x.com", phone: "9999999999" },
    education: [{ id: "e1", degree: "B.Tech", institution: "IIT", startYear: "2020", endYear: "2024", percentage: "85" }],
    skills: { technical: ["React", "Node.js"], soft: ["Communication"] },
    sections: {
      summary: "Software engineer with a strong foundation in full-stack development.",
      experience: "Built and led a small team shipping production features.",
      projects: "",
      certifications: "",
      achievements: "",
      languages: "",
      references: "",
    },
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

describe("slugifyFileName", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugifyFileName("Rohan's Software Engineer Resume")).toBe("rohan-s-software-engineer-resume");
  });

  it("falls back to a default for an empty/symbols-only title", () => {
    expect(slugifyFileName("   ")).toBe("resume");
    expect(slugifyFileName("!!!")).toBe("resume");
  });
});

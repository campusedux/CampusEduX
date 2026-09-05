import { describe, it, expect } from "vitest";
import { renderResumePdfBuffer } from "@/lib/resumeBuilder/pdfDocument";
import { renderResumeDocxBuffer } from "@/lib/resumeBuilder/docxBuilder";
import { extractTextFromPdf, extractTextFromDocx, detectFileType } from "@/lib/resumeBuilder/fileExtraction";
import { parseResumeText } from "@/lib/resumeBuilder/parser";
import { EMPTY_PERSONAL, type ResumeDocument } from "@/lib/resumeBuilder/types";

// Full round-trip against the REAL pdf-parse/mammoth libraries: generate an
// actual PDF/DOCX with our own exporter, then parse it back. This is the
// strongest available check that the parser integration genuinely works —
// not just against hand-typed fixture text.

function fixtureResume(): ResumeDocument {
  return {
    id: "res-1",
    title: "Priya Sharma Resume",
    template: "modern",
    personalDetails: { ...EMPTY_PERSONAL, fullName: "Priya Sharma", jobTitle: "Data Analyst", email: "priya.sharma@example.com" },
    education: [{ id: "e1", degree: "B.Sc Statistics", institution: "Delhi University", startYear: "2019", endYear: "2022", percentage: "78" }],
    skills: { technical: ["Python", "SQL"], soft: [] },
    sections: {
      summary: "Data analyst experienced in building dashboards and statistical models.",
      experience: "",
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

describe("PDF round-trip: export -> extract -> parse", () => {
  it("recovers the resume's own text from a PDF it just generated", async () => {
    const pdfBuffer = await renderResumePdfBuffer(fixtureResume(), "#4F39F6");

    const text = await extractTextFromPdf(pdfBuffer);
    expect(text).toContain("Priya Sharma");
    expect(text).toContain("Data analyst experienced in building dashboards");

    const parsed = parseResumeText(text);
    expect(parsed.contact.email).toBe("priya.sharma@example.com");
  }, 15_000);
});

describe("DOCX round-trip: export -> extract -> parse", () => {
  it("recovers the resume's own text from a DOCX it just generated", async () => {
    const docxBuffer = await renderResumeDocxBuffer(fixtureResume(), "#1E3A8A");

    const text = await extractTextFromDocx(docxBuffer);
    expect(text).toContain("Priya Sharma");
    expect(text).toContain("Data analyst experienced in building dashboards");

    const parsed = parseResumeText(text);
    expect(parsed.contact.email).toBe("priya.sharma@example.com");
  });
});

describe("detectFileType", () => {
  it("recognizes PDF by extension and mime type", () => {
    expect(detectFileType("resume.pdf", "application/pdf")).toBe("pdf");
    expect(detectFileType("resume.PDF", "")).toBe("pdf");
  });

  it("recognizes DOCX by extension and mime type", () => {
    expect(detectFileType("resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("docx");
    expect(detectFileType("resume.DOCX", "")).toBe("docx");
  });

  it("rejects unsupported file types", () => {
    expect(detectFileType("resume.txt", "text/plain")).toBeNull();
    expect(detectFileType("resume.doc", "application/msword")).toBeNull();
  });
});

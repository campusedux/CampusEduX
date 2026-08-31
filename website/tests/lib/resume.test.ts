import { describe, it, expect } from "vitest";
import {
  RESUME_MAX_BYTES,
  fileExtension,
  hasAllowedResumeExtension,
  resumeStoragePath,
} from "@/lib/resume";

describe("fileExtension", () => {
  it("returns the lower-cased extension with the dot", () => {
    expect(fileExtension("Resume.PDF")).toBe(".pdf");
    expect(fileExtension("my.cv.DocX")).toBe(".docx");
  });
  it("returns '' when there is no extension", () => {
    expect(fileExtension("resume")).toBe("");
  });
});

describe("hasAllowedResumeExtension", () => {
  it("accepts pdf / doc / docx (matching the mobile picker)", () => {
    expect(hasAllowedResumeExtension("a.pdf")).toBe(true);
    expect(hasAllowedResumeExtension("a.doc")).toBe(true);
    expect(hasAllowedResumeExtension("a.docx")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(hasAllowedResumeExtension("a.exe")).toBe(false);
    expect(hasAllowedResumeExtension("a.png")).toBe(false);
    expect(hasAllowedResumeExtension("a.pdf.exe")).toBe(false);
    expect(hasAllowedResumeExtension("noext")).toBe(false);
  });
});

describe("resumeStoragePath", () => {
  it("puts the file in the user's own folder (required by resumes_owner_all RLS)", () => {
    const path = resumeStoragePath("user-123", "My Résumé (v2).pdf");
    expect(path.startsWith("user-123/")).toBe(true);
  });
  it("sanitises the filename to a safe charset", () => {
    const path = resumeStoragePath("u1", "we ird/na::me.pdf");
    const name = path.split("/").pop()!;
    expect(name).toMatch(/^\d+_[a-zA-Z0-9._-]+$/);
    expect(name.endsWith(".pdf")).toBe(true);
  });
});

describe("RESUME_MAX_BYTES", () => {
  it("is a 10 MB cap", () => {
    expect(RESUME_MAX_BYTES).toBe(10 * 1024 * 1024);
  });
});

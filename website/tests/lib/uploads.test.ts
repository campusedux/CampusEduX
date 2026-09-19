import { describe, it, expect } from "vitest";
import { mimeFromFileName, resolveUploadContentType, withContentType } from "@/lib/uploads";
import { RESUME_MIME_TYPES } from "@/lib/resume";
import { CP_DOC_TYPES, CP_IMAGE_TYPES } from "@/lib/customProjects";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("resolveUploadContentType", () => {
  it("keeps a browser type that is allowed", () => {
    expect(resolveUploadContentType({ name: "cv.pdf", type: "application/pdf" }, RESUME_MIME_TYPES)).toBe("application/pdf");
  });
  it("derives the type from the extension when the browser gives none (docx on Windows)", () => {
    expect(resolveUploadContentType({ name: "My CV.DOCX", type: "" }, RESUME_MIME_TYPES)).toBe(DOCX);
  });
  it("replaces application/octet-stream with the extension type", () => {
    expect(resolveUploadContentType({ name: "cv.pdf", type: "application/octet-stream" }, RESUME_MIME_TYPES)).toBe("application/pdf");
  });
  it("rejects types outside the allow-list", () => {
    expect(resolveUploadContentType({ name: "cv.exe", type: "" }, RESUME_MIME_TYPES)).toBeNull();
    expect(resolveUploadContentType({ name: "a.zip", type: "application/zip" }, RESUME_MIME_TYPES)).toBeNull();
    expect(resolveUploadContentType({ name: "a.gif", type: "image/gif" }, CP_IMAGE_TYPES)).toBeNull();
  });
  it("zip without a type resolves for the builder reference files", () => {
    expect(resolveUploadContentType({ name: "src.zip", type: "" }, CP_DOC_TYPES)).toBe("application/zip");
  });
  it("mimeFromFileName is null for unknown extensions", () => {
    expect(mimeFromFileName("noext")).toBeNull();
    expect(mimeFromFileName("a.jpeg")).toBe("image/jpeg");
  });
});

describe("withContentType", () => {
  it("re-types the blob (storage-js sends the Blob's own type, not the option)", () => {
    const f = new File(["x"], "cv.docx", { type: "" });
    expect(withContentType(f, DOCX).type).toBe(DOCX);
    const same = new File(["x"], "cv.pdf", { type: "application/pdf" });
    expect(withContentType(same, "application/pdf")).toBe(same);
  });
});

import { readFileSync } from "fs";
import { resolve } from "path";
import { MAX_RESUME_BYTES, MAX_RESUME_MB } from "@/lib/resumeFile";
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  CUSTOM_UPLOAD_MAX_MB,
  CUSTOM_UPLOAD_MIME_TYPES,
  RESUME_MIME_TYPES,
  resolveContentType,
  mimeFromName,
  extensionForImageMime,
} from "@/lib/uploadMime";

// Bucket limits live in migration 0117/089 (single source of truth). These tests read the SQL by
// regexp and fail when a client constant drifts from it.
const SQL = readFileSync(resolve(__dirname, "../../../supabase/migrations/0117_project_files_private_check.sql"), "utf8");

function bucket(id: string): { bytes: number; mimes: string[] } {
  const re = new RegExp(
    `file_size_limit\\s*=\\s*(\\d+)\\s*\\*\\s*1024\\s*\\*\\s*1024\\s*,\\s*allowed_mime_types\\s*=\\s*array\\[([^\\]]*)\\]\\s*where id\\s*=\\s*'${id}'`
  );
  const m = SQL.match(re);
  if (!m) throw new Error(`bucket ${id} statement not found in 0117 (shape changed?)`);
  return { bytes: Number(m[1]) * 1024 * 1024, mimes: [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]) };
}
const sorted = (a: readonly string[]) => [...a].sort();

describe("mobile upload constants match the storage buckets (0117/089)", () => {
  it("resumes: one limit + exact MIME allow-list", () => {
    expect(MAX_RESUME_BYTES).toBe(bucket("resumes").bytes);
    expect(MAX_RESUME_MB * 1024 * 1024).toBe(MAX_RESUME_BYTES);
    expect(sorted(RESUME_MIME_TYPES)).toEqual(sorted(bucket("resumes").mimes));
  });
  it("avatars: 2 MB + jpeg/png/webp", () => {
    expect(AVATAR_MAX_BYTES).toBe(bucket("avatars").bytes);
    expect(sorted(AVATAR_MIME_TYPES)).toEqual(sorted(bucket("avatars").mimes));
  });
  it("custom-project-uploads: 15 MB + MIME allow-list (screen uses the shared constant)", () => {
    expect(CUSTOM_UPLOAD_MAX_MB * 1024 * 1024).toBe(bucket("custom-project-uploads").bytes);
    expect(sorted(CUSTOM_UPLOAD_MIME_TYPES)).toEqual(sorted(bucket("custom-project-uploads").mimes));
    const screen = readFileSync(resolve(__dirname, "../../../src/customProjects/BuilderUploadsScreen.tsx"), "utf8");
    expect(screen).toContain("CUSTOM_UPLOAD_MAX_MB");
    expect(screen).not.toMatch(/MAX_FILE_MB\s*=\s*\d/);
  });
  it("no bucket allows application/octet-stream", () => {
    for (const id of ["avatars", "resumes", "custom-project-uploads"]) expect(bucket(id).mimes).not.toContain("application/octet-stream");
  });
});

describe("resolveContentType", () => {
  const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  it("uses the picker mime when allowed", () => {
    expect(resolveContentType({ name: "a.pdf", mimeType: "application/pdf" }, RESUME_MIME_TYPES)).toBe("application/pdf");
  });
  it("falls back to the extension when the picker gives undefined or octet-stream", () => {
    expect(resolveContentType({ name: "cv.docx", mimeType: undefined }, RESUME_MIME_TYPES)).toBe(DOCX);
    expect(resolveContentType({ name: "cv.PDF", mimeType: "application/octet-stream", hintType: "application/octet-stream" }, RESUME_MIME_TYPES)).toBe("application/pdf");
    expect(resolveContentType({ uri: "file:///cache/x.zip?y=1", mimeType: null }, CUSTOM_UPLOAD_MIME_TYPES)).toBe("application/zip");
  });
  it("returns null for types outside the allow-list", () => {
    expect(resolveContentType({ name: "x.exe" }, RESUME_MIME_TYPES)).toBeNull();
    expect(resolveContentType({ name: "x.heic", mimeType: "image/heic" }, AVATAR_MIME_TYPES)).toBeNull();
  });
  it("helpers", () => {
    expect(mimeFromName("a.jpeg")).toBe("image/jpeg");
    expect(extensionForImageMime("image/webp")).toBe("webp");
  });
});

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { profileService } from "@/services/profile.service";
import { jobService } from "@/services/job.service";
import { customProjectsService } from "@/services/customProjects.service";
import { supabase, resetSupabaseMock } from "../../mocks/supabase.mock";

let uploads: { bucket: string; path: string; body: unknown; opts: { contentType: string } }[];

function mockFetchBytes(n: number, contentType = "") {
  (global as any).fetch = jest.fn(async () => ({
    arrayBuffer: async () => new ArrayBuffer(n),
    headers: { get: () => contentType },
  }));
}

beforeEach(() => {
  resetSupabaseMock();
  uploads = [];
  (supabase.storage.from as jest.Mock).mockImplementation((bucket: string) => ({
    upload: jest.fn(async (path: string, body: unknown, opts: { contentType: string }) => {
      uploads.push({ bucket, path, body, opts });
      return { data: { path }, error: null };
    }),
    getPublicUrl: (p: string) => ({ data: { publicUrl: `https://cdn.test/${p}` } }),
    createSignedUrl: async (p: string) => ({ data: { signedUrl: `https://cdn.test/signed/${p}` }, error: null }),
  }));
});

describe("avatar upload content type", () => {
  it("sends an ArrayBuffer with an explicit allowed type (jpeg default from the picker)", async () => {
    mockFetchBytes(1000);
    await profileService.uploadAvatar("u1", "file:///a/photo", null);
    expect(uploads[0].body).toBeInstanceOf(ArrayBuffer);
    expect(uploads[0].opts.contentType).toBe("image/jpeg");
    expect(uploads[0].path).toMatch(/^u1\/avatar_\d+\.jpg$/);
  });
  it("keeps png/webp and names the file by the real type", async () => {
    mockFetchBytes(1000);
    await profileService.uploadAvatar("u1", "file:///a/photo.png", "image/png");
    expect(uploads[0].opts.contentType).toBe("image/png");
    expect(uploads[0].path).toMatch(/\.png$/);
  });
  it("rejects heic/gif and >2MB files before uploading", async () => {
    mockFetchBytes(1000);
    await expect(profileService.uploadAvatar("u1", "file:///a/p.heic", "image/heic")).rejects.toThrow(/JPEG, PNG or WebP/);
    mockFetchBytes(2 * 1024 * 1024 + 1);
    await expect(profileService.uploadAvatar("u1", "file:///a/p.jpg", "image/jpeg")).rejects.toThrow(/under 2MB/);
    expect(uploads).toHaveLength(0);
  });
});

describe("résumé upload content type + size", () => {
  it("derives docx from the extension when the picker/blob type is missing or octet-stream", async () => {
    mockFetchBytes(1000, "application/octet-stream");
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: "r1" }, error: null }) }) }) }));
    await jobService.uploadResume("u1", "file:///c/cv.docx", "cv.docx", "application/octet-stream");
    expect(uploads[0].opts.contentType).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(uploads[0].body).toBeInstanceOf(ArrayBuffer);
  });
  it("rejects a file over 5MB and an unsupported extension without uploading", async () => {
    mockFetchBytes(5 * 1024 * 1024 + 1);
    await expect(jobService.uploadResume("u1", "file:///c/cv.pdf", "cv.pdf", "application/pdf")).rejects.toThrow(/5MB or less/);
    mockFetchBytes(10);
    await expect(jobService.uploadResume("u1", "file:///c/cv.exe", "cv.exe", null)).rejects.toThrow(/PDF, DOC or DOCX/);
    expect(uploads).toHaveLength(0);
  });
});

describe("custom project uploads", () => {
  it("reference files always carry a real allowed type (zip from extension when picker gives none)", async () => {
    mockFetchBytes(2048);
    const r = await customProjectsService.uploadReferenceFile("u1", "file:///c/src.zip", "src.zip", undefined);
    expect(uploads[0].opts.contentType).toBe("application/zip");
    expect(r.sizeMb).toBeCloseTo(0, 1);
    await expect(customProjectsService.uploadReferenceFile("u1", "file:///c/x.exe", "x.exe", "application/octet-stream")).rejects.toThrow(/isn't accepted/);
  });
  it("project image: jpeg default, png kept", async () => {
    mockFetchBytes(10);
    await customProjectsService.uploadProjectImage("u1", "file:///c/i", null);
    await customProjectsService.uploadProjectImage("u1", "file:///c/i.png", "image/png");
    expect(uploads.map((u) => u.opts.contentType)).toEqual(["image/jpeg", "image/png"]);
    expect(uploads[1].path).toMatch(/\.png$/);
  });
});

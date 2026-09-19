jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { compactRows } from "@/lib/safeRows";
import { jobService, mapJobRow } from "@/services/job.service";
import { projectService } from "@/services/project.service";
import { myProjectsService } from "@/services/myProjects.service";
import { supabase, resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";
import { jobRow } from "../../mocks/jobs.mock";
import { projectRows } from "../../mocks/projects.mock";

beforeEach(() => resetSupabaseMock());

describe("compactRows", () => {
  it("drops rows whose embedded join is null/missing and tolerates null input", () => {
    expect(compactRows([{ job: { id: 1 } }, { job: null }, {}, null as any], "job")).toEqual([{ job: { id: 1 } }]);
    expect(compactRows(null, "job")).toEqual([]);
  });
});

describe("mapJobRow", () => {
  it("does not throw on a null row", () => {
    expect(() => mapJobRow(null)).not.toThrow();
    expect(mapJobRow(null).id).toBe("");
  });
});

describe("MOB-09 null embedded joins", () => {
  it("getSavedJobs skips a saved job whose embedded job is null (hidden by RLS)", async () => {
    setTableResult("saved_jobs", { data: [{ job: null }, { job: jobRow }] });
    const jobs = await jobService.getSavedJobs("u-1");
    expect(jobs.map((j) => j.id)).toEqual([jobRow.id]);
  });

  it("getAppliedJobs skips applications whose job is null", async () => {
    setTableResult("applications", {
      data: [
        { id: "a1", job: null, created_at: "2025-01-01", status: "applied" },
        { id: "a2", job: jobRow, created_at: "2025-01-02", status: "applied", resume: null },
      ],
    });
    const apps = await jobService.getAppliedJobs("u-1");
    expect(apps.map((a) => a.id)).toEqual(["a2"]);
  });

  it("getApplicationDetail throws a clear error when the job is gone", async () => {
    setTableResult("applications", { data: [{ id: "a1", job: null, created_at: "2025-01-01", status: "applied" }] });
    const dev = (global as any).__DEV__;
    (global as any).__DEV__ = false; // production behaviour: no sample fallback
    try {
      await expect(jobService.getApplicationDetail("a1")).rejects.toThrow(/no longer available/);
    } finally {
      (global as any).__DEV__ = dev;
    }
  });

  it("getWishlist skips a null embedded project", async () => {
    setTableResult("wishlists", { data: [{ project: null }, { project: projectRows[0] }] });
    const list = await projectService.getWishlist("u-1");
    expect(list).toHaveLength(1);
  });

  it("getPurchasedProjects skips purchases whose project is null", async () => {
    setTableResult("purchases", {
      data: [
        { id: "o1", created_at: "2025-01-01", project: null },
        { id: "o2", created_at: "2025-01-02", project: projectRows[0] },
      ],
    });
    const list = await projectService.getPurchasedProjects("u-1");
    expect(list.map((p) => p.orderId)).toEqual(["o2"]);
  });

  it("getOwnedProjectDetail throws a friendly error instead of a TypeError when project is null", async () => {
    setTableResult("purchases", { data: [{ id: "o1", created_at: "2025-01-01", purchased_version: "1.0", project: null }] });
    await expect(myProjectsService.getOwnedProjectDetail("o1", "u-1")).rejects.toThrow(/no longer available/);
  });
});

describe("MOB-12/27 downloadable files", () => {
  it("skips files whose signed URL could not be created and reads the installation guide size", async () => {
    (supabase.storage.from as jest.Mock).mockImplementationOnce(() => ({
      createSignedUrl: jest.fn((p: string) =>
        Promise.resolve(p.endsWith("documentation.pdf") ? { data: null, error: { message: "Object not found" } } : { data: { signedUrl: `https://cdn.test/${p}` }, error: null })
      ),
    }));
    // each bucket() call re-enters storage.from(); reuse the same impl for all three
    (supabase.storage.from as jest.Mock).mockImplementation((supabase.storage.from as jest.Mock).getMockImplementation());
    setTableResult("project_files", { data: [{ file_name: "installation-guide.pdf", size_mb: 0.4 }] });

    const files = await projectService.getDownloadableFiles("pr-1", { sourceCodeSizeMB: 5, documentationSizeMB: 1 });

    expect(files.map((f) => f.fileName)).toContain("source-code.zip");
    expect(files.every((f) => f.url !== "")).toBe(true);
    expect(files.find((f) => f.fileName === "installation-guide.pdf")?.sizeMB).not.toBe(1.2);
  });
});

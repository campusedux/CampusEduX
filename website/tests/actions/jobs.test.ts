import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { supabase, resetSupabaseMock, setUser, setTableResult, setSignedUrlResult, callsFor } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));
vi.mock("@/lib/supabase/server", () => ({ getPublicSupabase: () => supabase }));

import { applyToJobAction, toggleSaveJobAction } from "@/lib/actions/jobs";

const USER = { id: "user-1", email: "s@campusedux.app" };

beforeEach(() => {
  resetSupabaseMock();
  setTableResult("jobs", { data: { id: "job-1" } }); // job exists by default
});

describe("applyToJobAction", () => {
  it("rejects when signed out", async () => {
    setUser(null);
    const r = await applyToJobAction({ jobId: "job-1", resumeId: "11111111-1111-1111-1111-111111111111" });
    expect(r).toEqual({ error: expect.stringMatching(/sign in/i) });
  });

  it("rejects when neither resumeId nor newResume is given", async () => {
    setUser(USER);
    const r = await applyToJobAction({ jobId: "job-1" } as never);
    expect("error" in r).toBe(true);
  });

  it("rejects when the job does not exist", async () => {
    setUser(USER);
    setTableResult("jobs", { data: null });
    const r = await applyToJobAction({ jobId: "ghost", newResume: { storagePath: "user-1/x.pdf", fileName: "x.pdf" } });
    expect(r).toEqual({ error: expect.stringMatching(/no longer accepting applications/i) });
  });

  it("rejects an uploaded file that is not in the caller's own storage folder", async () => {
    setUser(USER);
    const r = await applyToJobAction({ jobId: "job-1", newResume: { storagePath: "someone-else/x.pdf", fileName: "x.pdf" } });
    expect(r).toEqual({ error: expect.stringMatching(/could not be verified/i) });
  });

  it("rejects a non-PDF/DOC/DOCX upload", async () => {
    setUser(USER);
    const r = await applyToJobAction({ jobId: "job-1", newResume: { storagePath: "user-1/x.exe", fileName: "x.exe" } });
    expect(r).toEqual({ error: expect.stringMatching(/PDF, DOC or DOCX/i) });
  });

  it("maps a unique-constraint violation to 'already applied'", async () => {
    setUser(USER);
    setTableResult("resumes", { data: { id: "resume-1" } });
    setTableResult("applications", { data: null, error: { code: "23505" } });
    const r = await applyToJobAction({ jobId: "job-1", newResume: { storagePath: "user-1/cv.pdf", fileName: "cv.pdf" } });
    expect(r).toEqual({ error: "You've already applied to this job." });
  });

  it("uploads + applies on the happy path and never trusts a client file_url", async () => {
    setUser(USER);
    setSignedUrlResult({ data: { signedUrl: "https://proj.supabase.co/storage/v1/object/sign/resumes/user-1/cv.pdf?token=abc" }, error: null });
    setTableResult("resumes", { data: { id: "resume-9" } });
    setTableResult("applications", { data: { id: "app-9" } });

    const r = await applyToJobAction({ jobId: "job-1", newResume: { storagePath: "user-1/cv.pdf", fileName: "cv.pdf" } });
    expect(r).toEqual({ applicationId: "app-9" });

    // resume row was inserted with the server-minted signed URL, not a client value
    const insert = callsFor("resumes").find((c) => c.verb === "insert");
    expect(insert?.args?.[0]).toMatchObject({
      user_id: "user-1",
      file_name: "cv.pdf",
      storage_path: "user-1/cv.pdf",
      file_url: "https://proj.supabase.co/storage/v1/object/sign/resumes/user-1/cv.pdf?token=abc",
    });
    // application bound to the session user id, not anything from the payload
    const appInsert = callsFor("applications").find((c) => c.verb === "insert");
    expect(appInsert?.args?.[0]).toMatchObject({ user_id: "user-1", job_id: "job-1", resume_id: "resume-9" });
  });

  it("uses an existing resume only after confirming it belongs to the caller", async () => {
    setUser(USER);
    setTableResult("resumes", { data: { id: "resume-owned" } }); // ownership lookup hit
    setTableResult("applications", { data: { id: "app-2" } });
    const r = await applyToJobAction({ jobId: "job-1", resumeId: "22222222-2222-2222-2222-222222222222" });
    expect(r).toEqual({ applicationId: "app-2" });
  });

  it("rejects an existing resumeId that is not the caller's", async () => {
    setUser(USER);
    setTableResult("resumes", { data: null }); // ownership lookup misses
    const r = await applyToJobAction({ jobId: "job-1", resumeId: "33333333-3333-3333-3333-333333333333" });
    expect(r).toEqual({ error: expect.stringMatching(/could not be found/i) });
  });
});

describe("toggleSaveJobAction", () => {
  it("rejects when signed out", async () => {
    setUser(null);
    const r = await toggleSaveJobAction("job-1");
    expect("error" in r).toBe(true);
  });

  it("inserts when the job is not yet saved", async () => {
    setUser(USER);
    setTableResult("saved_jobs", { data: null });
    const r = await toggleSaveJobAction("job-1");
    expect(r).toEqual({ saved: true });
    expect(callsFor("saved_jobs").some((c) => c.verb === "insert")).toBe(true);
  });

  it("deletes when the job is already saved", async () => {
    setUser(USER);
    setTableResult("saved_jobs", { data: { job_id: "job-1" } });
    const r = await toggleSaveJobAction("job-1");
    expect(r).toEqual({ saved: false });
    expect(callsFor("saved_jobs").some((c) => c.verb === "delete")).toBe(true);
  });
});

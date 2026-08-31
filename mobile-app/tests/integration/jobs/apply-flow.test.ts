jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { jobService } from "@/services/job.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";
import { jobRow, jobRows } from "../../mocks/jobs.mock";

beforeEach(() => resetSupabaseMock());

describe("integration: browse -> view -> save -> apply", () => {
  it("lists jobs, opens one, toggles saved, and submits an application", async () => {
    // 1. dashboard list
    setTableResult("jobs", { data: jobRows });
    const { jobs } = await jobService.getAllJobs({}, 0);
    expect(jobs).toHaveLength(2);

    // 2. job detail (jobs + saved_jobs + applications lookups)
    setTableResult("jobs", { data: [jobRow] });
    setTableResult("saved_jobs", { data: null });
    setTableResult("applications", { data: null });
    const detail = await jobService.getJobDetail("job-1", "u-1");
    expect(detail.title).toBe("Full Stack Developer");
    expect(detail.skills).toContain("React");
    expect(detail.isSaved).toBe(false);
    expect(detail.hasApplied).toBe(false);

    // 3. save the job
    setTableResult("saved_jobs", { data: null });
    await expect(jobService.toggleSavedJob("job-1", "u-1", false)).resolves.toBeUndefined();

    // 4. apply
    setTableResult("resumes", { data: [{ id: "r-1", file_name: "My Resume.pdf", file_url: "", uploaded_at: "2025-05-01" }] });
    const resumes = await jobService.getResumes("u-1");
    expect(resumes[0].id).toBe("r-1");

    setTableResult("applications", { data: [{ id: "app-42" }] });
    const applicationId = await jobService.applyToJob("u-1", "job-1", "r-1");
    expect(applicationId).toBe("app-42");
  });

  it("reads back the applied job with its overall status", async () => {
    setTableResult("applications", {
      data: [
        {
          id: "app-42",
          job: jobRow,
          created_at: "2025-05-10T00:00:00.000Z",
          resume: { file_name: "My Resume.pdf" },
          status: "shortlisted",
        },
      ],
    });

    const applied = await jobService.getAppliedJobs("u-1");

    expect(applied).toHaveLength(1);
    expect(applied[0].overallStatus).toBe("shortlisted");
    expect(applied[0].job.companyName).toBe("Infosys");
  });
});

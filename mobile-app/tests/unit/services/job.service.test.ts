jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { jobService } from "@/services/job.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";
import { jobRows, savedJobRows } from "../../mocks/jobs.mock";
import { companyRows } from "../../mocks/companies.mock";
import { SAMPLE_JOBS } from "@/data/sampleJobContent";

beforeEach(() => resetSupabaseMock());

describe("jobService.getAllJobs", () => {
  it("maps job rows including the embedded company", async () => {
    setTableResult("jobs", { data: jobRows });

    const { jobs } = await jobService.getAllJobs({}, 0);

    expect(jobs).toHaveLength(2);
    expect(jobs[0].companyName).toBe("Infosys");
    expect(jobs[0].jobType).toBe("Full Time");
  });

  it("falls back to SAMPLE_JOBS on error", async () => {
    setTableResult("jobs", { error: { message: "no table" } });

    const { jobs, hasMore } = await jobService.getAllJobs({}, 0);

    expect(jobs).toEqual(SAMPLE_JOBS);
    expect(hasMore).toBe(false);
  });
});

describe("jobService.getCompanies", () => {
  it("maps company rows", async () => {
    setTableResult("companies", { data: companyRows });

    const companies = await jobService.getCompanies();

    expect(companies.map((c) => c.name)).toEqual(["Google", "TCS"]);
    expect(companies[0].openJobsCount).toBe(123);
  });
});

describe("jobService.getSavedJobs", () => {
  it("unwraps the nested job resource", async () => {
    setTableResult("saved_jobs", { data: savedJobRows });

    const jobs = await jobService.getSavedJobs("u-1");

    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe("job-1");
  });
});

describe("jobService.applyToJob", () => {
  it("returns the new application id on success", async () => {
    setTableResult("applications", { data: [{ id: "app-new" }] });

    const id = await jobService.applyToJob("u-1", "job-1", "resume-1");

    expect(id).toBe("app-new");
  });
});

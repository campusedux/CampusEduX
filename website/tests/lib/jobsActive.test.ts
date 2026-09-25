import { describe, expect, it } from "vitest";
import { activeDeadlineFilter, jobAvailability, onlyActiveJobs } from "@/lib/jobsActive";

const NOW = new Date("2026-09-19T12:00:00Z");

describe("jobAvailability", () => {
  it("open with no deadline or a future deadline", () => {
    expect(jobAvailability({ status: "open", application_deadline: null }, NOW)).toBe("open");
    expect(jobAvailability({ status: "open", application_deadline: "2026-09-22T18:29:59Z" }, NOW)).toBe("open");
  });
  it("closed when status closed or deadline passed", () => {
    expect(jobAvailability({ status: "closed" }, NOW)).toBe("closed");
    expect(jobAvailability({ status: "open", application_deadline: "2026-09-18T00:00:00Z" }, NOW)).toBe("closed");
  });
  it("draft is its own bucket (→ 404)", () => {
    expect(jobAvailability({ status: "draft" }, NOW)).toBe("draft");
  });
});

describe("onlyActiveJobs", () => {
  it("applies status=open and the deadline OR filter", () => {
    const calls: unknown[][] = [];
    const b: any = {
      eq: (...a: unknown[]) => (calls.push(["eq", ...a]), b),
      or: (...a: unknown[]) => (calls.push(["or", ...a]), b),
    };
    onlyActiveJobs(b);
    expect(calls[0]).toEqual(["eq", "status", "open"]);
    expect(calls[1][0]).toBe("or");
    expect(String(calls[1][1])).toContain("application_deadline.is.null,application_deadline.gte.");
  });
  it("uses the provided clock", () => {
    expect(activeDeadlineFilter(NOW)).toBe("application_deadline.is.null,application_deadline.gte.2026-09-19T12:00:00.000Z");
  });
});

describe("jobAvailability legacy rows", () => {
  it("treats a missing status as open", () => {
    expect(jobAvailability({ application_deadline: null }, NOW)).toBe("open");
  });
});

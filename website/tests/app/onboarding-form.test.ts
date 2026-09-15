import { describe, it, expect, beforeEach } from "vitest";

import { supabase, resetSupabaseMock, setTableResult, callsFor } from "../helpers/supabase.mock";

import { branchesForCourse, isOnboardingComplete, saveOnboardingProfile } from "@/app/onboarding/OnboardingForm";

beforeEach(() => resetSupabaseMock());

const CATALOG = {
  courses: [
    { id: "btech", name: "B.Tech" },
    { id: "mca", name: "MCA" },
  ],
  branches: [
    { id: "btech-cse", name: "CSE", course_id: "btech" },
    { id: "btech-it", name: "IT", course_id: "btech" },
    { id: "mca-gen", name: "General", course_id: "mca" },
  ],
};

describe("branchesForCourse (Course -> Branch cascading)", () => {
  it("returns only the branches belonging to the selected course", () => {
    expect(branchesForCourse(CATALOG, "B.Tech")).toEqual([
      { id: "btech-cse", name: "CSE", course_id: "btech" },
      { id: "btech-it", name: "IT", course_id: "btech" },
    ]);
    expect(branchesForCourse(CATALOG, "MCA")).toEqual([{ id: "mca-gen", name: "General", course_id: "mca" }]);
  });

  it("matches the course name case-insensitively (profiles store free text, not catalog ids)", () => {
    expect(branchesForCourse(CATALOG, "b.tech")).toHaveLength(2);
  });

  it("falls back to the full branch list before a course is chosen", () => {
    expect(branchesForCourse(CATALOG, "")).toEqual(CATALOG.branches);
  });

  it("falls back to the full branch list for a course not in the catalog", () => {
    expect(branchesForCourse(CATALOG, "Unlisted Course")).toEqual(CATALOG.branches);
  });
});

describe("isOnboardingComplete (Continue button gate)", () => {
  it("is false until course, branch and year are all chosen", () => {
    expect(isOnboardingComplete("", "", "")).toBe(false);
    expect(isOnboardingComplete("B.Tech", "", "")).toBe(false);
    expect(isOnboardingComplete("B.Tech", "CSE", "")).toBe(false);
  });

  it("is true only once all three are chosen", () => {
    expect(isOnboardingComplete("B.Tech", "CSE", "1st Year")).toBe(true);
  });
});

describe("saveOnboardingProfile", () => {
  it("writes course/branch/year to the caller's own profiles row and reports no error", async () => {
    setTableResult("profiles", { data: { id: "u-1" }, error: null });

    const result = await saveOnboardingProfile(supabase as never, "u-1", {
      course: "B.Tech",
      branch: "CSE",
      year: "1st Year",
    });

    expect(result.error).toBeNull();
    const calls = callsFor("profiles");
    expect(calls).toContainEqual({
      table: "profiles",
      verb: "update",
      args: [{ course: "B.Tech", branch: "CSE", year: "1st Year" }],
    });
    expect(calls).toContainEqual({ table: "profiles", verb: "eq", args: ["id", "u-1"] });
  });

  it("surfaces the Supabase error message instead of throwing", async () => {
    setTableResult("profiles", { data: null, error: { message: "permission denied" } });

    const result = await saveOnboardingProfile(supabase as never, "u-1", {
      course: "B.Tech",
      branch: "CSE",
      year: "1st Year",
    });

    expect(result.error).toBe("permission denied");
  });
});

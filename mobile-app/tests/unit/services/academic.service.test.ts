jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { academicService } from "@/services/academic.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";
import { COURSES, BRANCHES } from "@/constants";

beforeEach(() => resetSupabaseMock());

describe("academicService", () => {
  it("returns admin-managed course names when the courses table has rows", async () => {
    setTableResult("courses", {
      data: [
        { id: "be", name: "B.E.", status: "active", sort_order: 1 },
        { id: "bpharm", name: "B.Pharm", status: "active", sort_order: 2 },
      ],
    });
    const courses = await academicService.getCourses();
    expect(courses.map((c) => c.label)).toEqual(["B.E.", "B.Pharm"]);
  });

  it("falls back to the bundled list when the table errors", async () => {
    setTableResult("branches", { data: null, error: { message: 'relation "branches" does not exist' } });
    const branches = await academicService.getBranches();
    expect(branches.map((b) => b.label)).toEqual([...BRANCHES]);
  });

  it("falls back to the bundled list when the table is empty", async () => {
    setTableResult("courses", { data: [] });
    const courses = await academicService.getCourses();
    expect(courses.map((c) => c.label)).toEqual(COURSES.map((c) => c.label));
  });

  it("narrows branches to the given course when the catalog carries course_id", async () => {
    setTableResult("branches", {
      data: [
        { id: "btech-cse", name: "Computer Science Engineering", course_id: "btech", status: "active", sort_order: 1 },
        { id: "btech-it", name: "Information Technology", course_id: "btech", status: "active", sort_order: 2 },
        { id: "mba-fin", name: "Finance", course_id: "mba", status: "active", sort_order: 1 },
      ],
    });
    const branches = await academicService.getBranches("btech");
    expect(branches.map((b) => b.label)).toEqual(["Computer Science Engineering", "Information Technology"]);
    expect(branches.every((b) => b.courseId === "btech")).toBe(true);
  });

  it("ignores the course filter when the catalog is the bundled fallback (no course_id)", async () => {
    setTableResult("branches", { data: null, error: { message: "offline" } });
    const branches = await academicService.getBranches("btech");
    expect(branches.map((b) => b.label)).toEqual([...BRANCHES]);
  });

  it("drops rows with a blank label", async () => {
    setTableResult("academic_years", {
      data: [
        { id: "1", label: "1st Year", status: "active", sort_order: 1 },
        { id: "x", label: "   ", status: "active", sort_order: 2 },
      ],
    });
    const years = await academicService.getYears();
    expect(years.map((y) => y.label)).toEqual(["1st Year"]);
  });
});

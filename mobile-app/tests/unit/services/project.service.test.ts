jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { projectService } from "@/services/project.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";
import { projectDetailRow, projectRows, reviewRows } from "../../mocks/projects.mock";

beforeEach(() => resetSupabaseMock());

describe("projectService.getProjectDetail", () => {
  it("merges the project row with its wishlist state", async () => {
    setTableResult("projects", { data: [projectDetailRow] });
    setTableResult("wishlists", { data: { project_id: "tr-1" } });

    const detail = await projectService.getProjectDetail("tr-1", "u-1");

    expect(detail.id).toBe("tr-1");
    expect(detail.liveDemoUrl).toBe("https://demo.campusedux.app/ecommerce");
    expect(detail.platformFeePercent).toBe(2);
    expect(detail.isWishlisted).toBe(true);
  });

  it("throws when the project is missing — no sample detail, even in __DEV__", async () => {
    setTableResult("projects", { data: [] });

    await expect(projectService.getProjectDetail("does-not-exist")).rejects.toThrow("Project not found.");
  });

  it("throws on a query error — no sample detail, even in __DEV__", async () => {
    setTableResult("projects", { error: { message: "boom" } });

    await expect(projectService.getProjectDetail("tr-1")).rejects.toThrow();
  });
});

describe("projectService.getReviews", () => {
  it("builds the rating breakdown from live rows", async () => {
    setTableResult("reviews", { data: reviewRows });

    const { reviews, breakdown } = await projectService.getReviews("tr-1");

    expect(reviews).toHaveLength(2);
    expect(reviews[0].userName).toBe("Rahul Sharma");
    expect(breakdown.totalReviews).toBe(2);
    expect(breakdown.counts[5]).toBe(1);
    expect(breakdown.counts[4]).toBe(1);
    expect(breakdown.average).toBeCloseTo(4.5);
  });
});

describe("projectService.getAllProjects", () => {
  it("returns mapped rows and a hasMore flag", async () => {
    setTableResult("projects", { data: projectRows });

    const { projects, hasMore } = await projectService.getAllProjects({}, 0);

    expect(projects.map((p) => p.id)).toEqual(["tr-1", "pr-3"]);
    expect(hasMore).toBe(false); // fewer than PAGE_SIZE rows
  });
});

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { homeService } from "@/services/home.service";
import { projectService } from "@/services/project.service";
import { resumeService } from "@/services/resume.service";
import { resetSupabaseMock, setTableResult, setRpcResult } from "../../mocks/supabase.mock";

/** jest-expo sets __DEV__ = true; these tests exercise the release-build paths. */
const g = globalThis as unknown as { __DEV__: boolean };
let originalDev: boolean;
beforeAll(() => {
  originalDev = g.__DEV__;
});
beforeEach(() => {
  resetSupabaseMock();
  g.__DEV__ = false;
});
afterAll(() => {
  g.__DEV__ = originalDev;
});

const boom = { error: { message: "boom" } };

describe("production build: catalog errors throw, empty stays empty", () => {
  it.each([
    ["categories", "categories", () => homeService.getCategories()],
    ["premium", "projects", () => homeService.getPremiumProjects()],
    ["best sellers", "projects", () => homeService.getBestSellers()],
    ["new arrivals", "projects", () => homeService.getNewArrivals()],
    ["offers", "offer_banners", () => homeService.getOfferBanners()],
    ["notifications", "notifications", () => homeService.getNotifications()],
  ])("home %s", async (_l, table, call) => {
    setTableResult(table, { data: [] });
    expect(await call()).toEqual([]);
    setTableResult(table, boom);
    await expect(call()).rejects.toThrow("boom");
  });

  it("project browse / category / similar / wishlist / purchases / downloads", async () => {
    const calls: [string, () => Promise<unknown>][] = [
      ["projects", () => projectService.getAllProjects()],
      ["projects", () => projectService.getCategoryProjects("c1")],
      ["projects", () => projectService.getSimilarProjects("p1", "c1")],
      ["purchases", () => projectService.getPurchasedProjects("u1")],
      ["downloads", () => projectService.getDownloadHistory("u1")],
    ];
    for (const [table, call] of calls) {
      setTableResult(table, boom);
      await expect(call()).rejects.toThrow("boom");
    }
    setRpcResult("my_wishlist", boom);
    await expect(projectService.getWishlist("u1")).rejects.toThrow("boom");
    setTableResult("projects", { data: [] });
    expect(await projectService.getAllProjects()).toEqual({ projects: [], hasMore: false });
    expect(await projectService.getCategoryProjects("c1")).toEqual([]);
  });

  it("reviews and resumes throw instead of returning sample rows", async () => {
    setTableResult("reviews", boom);
    await expect(projectService.getReviews("p1")).rejects.toThrow("boom");
    setTableResult("resumes_builder", boom);
    await expect(resumeService.getResumes("u1")).rejects.toThrow("boom");
    setTableResult("resumes_builder", { data: [] });
    expect(await resumeService.getResumes("u1")).toEqual([]);
  });
});

describe("search never returns sample projects", () => {
  it("home searchAll: no match → empty result", async () => {
    setTableResult("projects", { data: [] });
    setTableResult("jobs", { data: [] });
    expect(await homeService.searchAll("zzzz-no-match")).toEqual({ projects: [], jobs: [] });
  });

  it("home searchAll: error → throws (also in __DEV__)", async () => {
    setTableResult("projects", boom);
    setTableResult("jobs", { data: [] });
    await expect(homeService.searchAll("react")).rejects.toThrow("boom");
    g.__DEV__ = true;
    await expect(homeService.searchAll("react")).rejects.toThrow("boom");
  });

  it("projectService.searchProjects: no match → [], error → throws (also in __DEV__)", async () => {
    setTableResult("projects", { data: [] });
    expect(await projectService.searchProjects("zzzz-no-match")).toEqual([]);
    setTableResult("projects", boom);
    await expect(projectService.searchProjects("react")).rejects.toThrow("boom");
    g.__DEV__ = true;
    await expect(projectService.searchProjects("react")).rejects.toThrow("boom");
  });
});

describe("project detail is never fabricated (checkout safety)", () => {
  it("throws on error and on a missing row in both prod and dev", async () => {
    for (const dev of [false, true]) {
      g.__DEV__ = dev;
      setTableResult("projects", boom);
      await expect(projectService.getProjectDetail("p1")).rejects.toThrow();
      setTableResult("projects", { data: [] });
      await expect(projectService.getProjectDetail("p1")).rejects.toThrow("Project not found.");
    }
  });
});

describe("referral summary never borrows a code", () => {
  it("throws on error in prod and dev", async () => {
    for (const dev of [false, true]) {
      g.__DEV__ = dev;
      setTableResult("referral_codes", boom);
      await expect(homeService.getReferralSummary("u1")).rejects.toThrow("boom");
    }
  });
});

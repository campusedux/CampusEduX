jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { homeService } from "@/services/home.service";
import {
  resetSupabaseMock,
  setTableResult,
} from "../../mocks/supabase.mock";
import { categoryRows, projectRows } from "../../mocks/projects.mock";
import { SAMPLE_CATEGORIES } from "@/data/sampleHomeContent";

beforeEach(() => resetSupabaseMock());

describe("homeService.getCategories", () => {
  it("maps live category rows to ProjectCategory", async () => {
    setTableResult("categories", { data: categoryRows });

    const result = await homeService.getCategories();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "web-development",
      name: "Web Development",
      icon: "globe-outline",
      projectCount: 1200,
    });
  });

  it("falls back to SAMPLE_CATEGORIES when the table errors", async () => {
    setTableResult("categories", { error: { message: "relation does not exist", code: "PGRST205" } });

    const result = await homeService.getCategories();

    expect(result).toEqual(SAMPLE_CATEGORIES);
  });

  it("falls back to SAMPLE_CATEGORIES when the table is empty", async () => {
    setTableResult("categories", { data: [] });

    const result = await homeService.getCategories();

    expect(result).toEqual(SAMPLE_CATEGORIES);
  });
});

describe("homeService.getTrendingProjects", () => {
  it("maps rows via the category embed and honours the limit arg", async () => {
    setTableResult("projects", { data: projectRows });

    const result = await homeService.getTrendingProjects(5);

    expect(result[0].title).toBe("E-Commerce Website");
    expect(result[0].categoryName).toBe("Web Development");
    expect(result[1].isPremium).toBe(true);
  });
});

describe("homeService.getReferralSummary (Home referral card)", () => {
  it("shows the new student's real code with 0 referrals / ₹0 (not the sample)", async () => {
    setTableResult("referral_codes", { data: { code: "FRESH42", total_referrals: 0, total_earned: 0 } });

    const summary = await homeService.getReferralSummary("new-user");

    expect(summary.code).toBe("FRESH42");
    expect(summary.shareLink).toBe("https://campusedux.app/ref/FRESH42");
    expect(summary.totalReferrals).toBe(0);
    expect(summary.totalEarned).toBe(0);
    expect(summary.referrerBonus).toBe(100);
  });

  it("falls back to SAMPLE_REFERRAL only when the query errors", async () => {
    setTableResult("referral_codes", { error: { message: "schema cache" } });

    const summary = await homeService.getReferralSummary("new-user");

    expect(summary.code).toBe("ROHAN21"); // SAMPLE_REFERRAL
  });
});

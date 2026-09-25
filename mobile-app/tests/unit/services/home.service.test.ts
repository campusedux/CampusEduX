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

  it("falls back to SAMPLE_CATEGORIES on error in __DEV__ only", async () => {
    setTableResult("categories", { error: { message: "relation does not exist", code: "PGRST205" } });

    const result = await homeService.getCategories();

    expect(result).toEqual(SAMPLE_CATEGORIES);
  });

  it("returns [] (real empty) when the table is empty — no sample rows", async () => {
    setTableResult("categories", { data: [] });

    expect(await homeService.getCategories()).toEqual([]);
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

  it("returns [] (never sample data) when the table is empty", async () => {
    setTableResult("projects", { data: [] });
    expect(await homeService.getTrendingProjects(5)).toEqual([]);
  });

  it("propagates query errors instead of falling back to sample data", async () => {
    setTableResult("projects", { error: { message: "boom" } });
    await expect(homeService.getTrendingProjects(5)).rejects.toThrow("boom");
  });

  it("drops rows with an empty title", async () => {
    setTableResult("projects", { data: [{ ...projectRows[0], title: "  " }, projectRows[1]] });
    const result = await homeService.getTrendingProjects(5);
    expect(result).toHaveLength(1);
  });
});

describe("homeService.getLatestJobs", () => {
  it("returns [] when empty and throws on error (no sample jobs)", async () => {
    setTableResult("jobs", { data: [] });
    expect(await homeService.getLatestJobs(10)).toEqual([]);
    setTableResult("jobs", { error: { message: "nope" } });
    await expect(homeService.getLatestJobs(10)).rejects.toThrow("nope");
  });

  it("cleans fields and drops rows without title/company", async () => {
    setTableResult("jobs", {
      data: [
        { id: "j1", title: "<b>Dev</b>", company_name: "Acme", location: "null", salary_range: "6-10 LPA", posted_at: new Date().toISOString(), job_type: "Full Time" },
        { id: "j2", title: "", company_name: "X", posted_at: new Date().toISOString() },
      ],
    });
    const jobs = await homeService.getLatestJobs(10);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ title: "Dev", location: "", salaryRange: "₹6-10 LPA", postedAt: "Today" });
  });
});

describe("homeService.getReferralSummary (Home referral card)", () => {
  it("shows the new student's real code with 0 referrals / ₹0 and reward_settings amounts", async () => {
    setTableResult("referral_codes", { data: { code: "FRESH42", total_referrals: 0, total_earned: 0 } });
    setTableResult("reward_settings", {
      data: { bonus_type: "flat", bonus_value: 150, reward_on_signup: false, reward_on_first_purchase: true },
    });

    const summary = await homeService.getReferralSummary("new-user");

    expect(summary.code).toBe("FRESH42");
    expect(summary.shareLink).toBe("https://www.campusedux.com/register?ref=FRESH42");
    expect(summary.totalReferrals).toBe(0);
    expect(summary.totalEarned).toBe(0);
    expect(summary.referrerBonus).toBe(150);
    expect(summary.referrerBonusPercent).toBeNull();
  });

  it("hides amounts (null, not defaults) when reward_settings can't be read", async () => {
    setTableResult("referral_codes", { data: { code: "FRESH42", total_referrals: 0, total_earned: 0 } });
    setTableResult("reward_settings", { error: { message: "denied" } });

    const summary = await homeService.getReferralSummary("new-user");

    expect(summary.code).toBe("FRESH42");
    expect(summary.referrerBonus).toBeNull();
    expect(summary.referrerBonusPercent).toBeNull();
    expect(summary.rewardOnFirstPurchase).toBeNull();
  });

  it("throws on a query error — never a sample code (even in __DEV__)", async () => {
    setTableResult("referral_codes", { error: { message: "schema cache" } });

    await expect(homeService.getReferralSummary("new-user")).rejects.toThrow("schema cache");
  });
});

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("react-native-razorpay", () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock("expo-print", () => ({ printToFileAsync: jest.fn() }));

import { walletService } from "@/services/wallet.service";
import { referralService } from "@/services/referral.service";
import { projectService } from "@/services/project.service";
import { jobService } from "@/services/job.service";
import { resumeService } from "@/services/resume.service";
import { placementService } from "@/services/placement.service";
import { profileService } from "@/services/profile.service";
import { homeService } from "@/services/home.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";

/**
 * A student who just registered: every table exists (migrations applied) but
 * they own no rows yet. Their activity screens must be genuinely blank / zero —
 * NOT filled with src/data/sample*.ts content.
 *
 * The one row a new profile DOES get is referral_codes (created by the
 * ensure_referral_code trigger in migration 0021), so the referral overview
 * shows their own code with 0 / 0.
 */
beforeEach(() => {
  resetSupabaseMock();
  // every per-user table: exists, zero rows for this user
  for (const t of [
    "wallet_transactions", "referrals", "wishlists", "purchases", "downloads",
    "saved_jobs", "applications", "resumes", "resumes_builder", "resume_downloads",
    "test_attempts", "user_dsa_progress", "user_favorite_questions", "notifications",
  ]) {
    setTableResult(t, { data: [] });
  }
  setTableResult("user_dsa_progress", { count: 0 });
});

it("wallet is empty and ₹0", async () => {
  const summary = await walletService.getWalletSummary("new-user");
  expect(summary.balance).toBe(0);
  expect(summary.totalAdded).toBe(0);
  expect(summary.recentTransactions).toEqual([]);
  expect(await walletService.getAllTransactions("new-user")).toEqual([]);
});

it("referral overview shows the student's own fresh code with 0 referrals / ₹0", async () => {
  // referral_codes row exists (trigger) with zeroed totals
  setTableResult("referral_codes", { data: { code: "NEWB12", total_referrals: 0, total_earned: 0 } });

  const overview = await referralService.getOverview("new-user");
  expect(overview.code).toBe("NEWB12");
  expect(overview.totalReferrals).toBe(0);
  expect(overview.totalEarned).toBe(0);
  expect(overview.successfulReferrals).toBe(0);

  expect(await referralService.getReferralHistory("new-user", "all")).toEqual([]);

  const earnings = await referralService.getEarningsSummary("new-user");
  expect(earnings.totalEarnings).toBe(0);
  expect(earnings.totalReferrals).toBe(0);
  expect(earnings.recentEarnings).toEqual([]);
});

it("marketplace activity (wishlist / purchases / downloads) is empty", async () => {
  expect(await projectService.getWishlist("new-user")).toEqual([]);
  expect(await projectService.getPurchasedProjects("new-user")).toEqual([]);
  expect(await projectService.getDownloadHistory("new-user")).toEqual([]);
  expect(await profileService.getPurchaseHistory("new-user")).toEqual([]);
});

it("jobs activity (saved / applied / résumés) is empty and alerts are off", async () => {
  expect(await jobService.getSavedJobs("new-user")).toEqual([]);
  expect(await jobService.getAppliedJobs("new-user")).toEqual([]);
  expect(await jobService.getResumes("new-user")).toEqual([]);

  setTableResult("job_alerts", { data: null });
  const alerts = await jobService.getJobAlertPreferences("new-user");
  expect(alerts.enabled).toBe(false);
  expect(alerts.jobRole).toBe("");
});

it("résumé builder has no documents", async () => {
  expect(await resumeService.getResumes("new-user")).toEqual([]);
  expect(await resumeService.getDownloadHistory("new-user")).toEqual([]);
});

it("placement dashboard and analytics are zeroed", async () => {
  const dash = await placementService.getDashboardSummary("new-user");
  expect(dash).toEqual({ testsTaken: 0, questionsSolved: 0, accuracyPercent: 0, overallProgressPercent: 0 });

  const perf = await placementService.getPerformanceAnalysis("new-user");
  expect(perf.testsTaken).toBe(0);
  expect(perf.trend).toEqual([]);

  expect(await placementService.getFavoriteQuestions("new-user")).toEqual([]);
});

it("notifications are empty", async () => {
  expect(await homeService.getNotifications()).toEqual([]);
});

it("shared catalog still renders (categories fall back to sample when unseeded)", async () => {
  setTableResult("categories", { data: [] });
  const categories = await homeService.getCategories();
  expect(categories.length).toBeGreaterThan(0); // catalog keeps its sample fallback
});

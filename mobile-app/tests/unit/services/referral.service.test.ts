jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { referralService } from "@/services/referral.service";
import { resetSupabaseMock, setTableResult, setRpcResult } from "../../mocks/supabase.mock";
import { supabase } from "@/lib/supabase";
import { referralRows } from "../../mocks/users.mock";
import { SAMPLE_REFERRAL_OVERVIEW } from "@/data/sampleReferralContent";

beforeEach(() => resetSupabaseMock());

describe("referralService.getOverview", () => {
  it("combines the referral_codes row with per-status counts", async () => {
    setTableResult("referral_codes", { data: { code: "ROHAN21", total_referrals: 25, total_earned: 1250 } });
    setTableResult("referrals", { data: referralRows.map((r) => ({ status: r.status })) });

    const overview = await referralService.getOverview("u-1");

    expect(overview.code).toBe("ROHAN21");
    expect(overview.shareLink).toContain("ROHAN21");
    expect(overview.totalReferrals).toBe(25);
    expect(overview.totalEarned).toBe(1250);
    expect(overview.successfulReferrals).toBe(2);
    expect(overview.pendingReferrals).toBe(1);
  });

  it("returns a real zero-state for a new student (query OK, no referrals, real code)", async () => {
    // referral_codes row exists (ensure_referral_code trigger) with zeroed totals
    setTableResult("referral_codes", { data: { code: "FRESH42", total_referrals: 0, total_earned: 0 } });
    setTableResult("referrals", { data: [] });

    const overview = await referralService.getOverview("u-1");

    expect(overview.code).toBe("FRESH42");
    expect(overview.shareLink).toBe("https://www.campusedux.com/register?ref=FRESH42");
    expect(overview.totalReferrals).toBe(0);
    expect(overview.totalEarned).toBe(0);
    expect(overview.successfulReferrals).toBe(0);
    expect(overview.pendingReferrals).toBe(0);
    expect(overview.cancelledReferrals).toBe(0);
  });

  it("does NOT borrow a sample code when the referral_codes row is somehow absent", async () => {
    setTableResult("referral_codes", { data: null }); // query succeeded, 0 rows
    setTableResult("referrals", { data: [] });

    const overview = await referralService.getOverview("u-1");

    expect(overview).not.toEqual(SAMPLE_REFERRAL_OVERVIEW);
    expect(overview.code).toBe("");
    expect(overview.totalReferrals).toBe(0);
    expect(overview.totalEarned).toBe(0);
  });

  it("falls back to SAMPLE_REFERRAL_OVERVIEW only when the query itself errors", async () => {
    setTableResult("referral_codes", { error: { message: "relation \"referral_codes\" does not exist" } });
    setTableResult("referrals", { data: [] });

    expect(await referralService.getOverview("u-1")).toEqual(SAMPLE_REFERRAL_OVERVIEW);
  });
});

describe("referralService.getEarningsSummary", () => {
  it("sums rewards from successful referrals and counts each status", async () => {
    setTableResult("referrals", { data: referralRows });

    const summary = await referralService.getEarningsSummary("u-1");

    expect(summary.totalReferrals).toBe(3);
    expect(summary.successfulReferrals).toBe(2);
    expect(summary.pendingReferrals).toBe(1);
    expect(summary.totalEarnings).toBe(200); // 2 x 100
    expect(summary.monthlyTrend).toHaveLength(6);
  });
});

describe("referralService.getLeaderboard", () => {
  it("maps the aggregated referral_leaderboard RPC rows (no other users' ids/emails)", async () => {
    setRpcResult("referral_leaderboard", {
      data: [
        { rank: 1, user_id: null, display_name: "A", total_referrals: 2, total_earned: 200, is_current_user: false },
        { rank: 2, user_id: "b", display_name: "B", total_referrals: 1, total_earned: 100, is_current_user: true },
      ],
    });

    const board = await referralService.getLeaderboard("all_time", "b");

    expect(supabase.rpc).toHaveBeenCalledWith("referral_leaderboard", { p_period: "all_time" });
    expect(board[0].rank).toBe(1);
    expect(board[0].userName).toBe("A");
    expect(board[0].userEmail).toBe("");
    expect(board[0].totalEarned).toBe(200);
    expect(board[1].userId).toBe("b");
    expect(board[1].isCurrentUser).toBe(true);
  });

  it("returns an honest empty list when nobody has referred yet", async () => {
    setRpcResult("referral_leaderboard", { data: [] });
    expect(await referralService.getLeaderboard("this_month", "u")).toEqual([]);
  });
});

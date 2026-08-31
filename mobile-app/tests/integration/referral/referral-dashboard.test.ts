jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { referralService } from "@/services/referral.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";
import { referralRows } from "../../mocks/users.mock";

beforeEach(() => resetSupabaseMock());

const codeRow = { code: "ROHAN21", total_referrals: 25, total_earned: 1250 };

describe("integration: referral dashboard is internally consistent", () => {
  it("overview, history and earnings agree on the status counts", async () => {
    // overview: referral_codes then referrals(status)
    setTableResult("referral_codes", { data: codeRow });
    setTableResult("referrals", { data: referralRows.map((r) => ({ status: r.status })) });
    const overview = await referralService.getOverview("u-1");

    expect(overview.code).toBe("ROHAN21");
    expect(overview.totalReferrals).toBe(25);
    expect(overview.successfulReferrals).toBe(2);
    expect(overview.pendingReferrals).toBe(1);
    expect(overview.cancelledReferrals).toBe(0);

    // history (full rows)
    setTableResult("referrals", { data: referralRows });
    const history = await referralService.getReferralHistory("u-1", "all");
    expect(history).toHaveLength(3);
    expect(history[0].referredUserName).toBe("Amit Kumar");

    // history filtered
    setTableResult("referrals", { data: referralRows.filter((r) => r.status === "successful") });
    const successful = await referralService.getReferralHistory("u-1", "successful");
    expect(successful.every((e) => e.status === "successful")).toBe(true);

    // earnings
    setTableResult("referrals", { data: referralRows });
    const earnings = await referralService.getEarningsSummary("u-1");
    expect(earnings.successfulReferrals).toBe(overview.successfulReferrals);
    expect(earnings.pendingReferrals).toBe(overview.pendingReferrals);
    expect(earnings.totalEarnings).toBe(200); // 2 successful x ₹100
    expect(earnings.recentEarnings.length).toBeGreaterThan(0);
  });

  it("falls back to sample content when the referrals table is missing", async () => {
    setTableResult("referral_codes", { error: { message: "relation does not exist" } });
    setTableResult("referrals", { error: { message: "relation does not exist" } });

    const overview = await referralService.getOverview("u-1");
    expect(overview.code).toBeTruthy();
    expect(typeof overview.totalEarned).toBe("number");
  });
});

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { referralService, DEFAULT_REWARD_RULE } from "@/services/referral.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";

const g = globalThis as unknown as { __DEV__: boolean };
let originalDev: boolean;
beforeAll(() => {
  originalDev = g.__DEV__;
});
afterAll(() => {
  g.__DEV__ = originalDev;
});
beforeEach(() => {
  resetSupabaseMock();
  g.__DEV__ = false;
});

const goodRule = { bonus_type: "flat", bonus_value: 250, max_payout: 900, reward_on_signup: false, reward_on_first_purchase: true };

describe("referralService.getRewardRule (production)", () => {
  it("returns the real rule from reward_settings", async () => {
    setTableResult("reward_settings", { data: goodRule });
    expect(await referralService.getRewardRule()).toMatchObject({ bonusType: "flat", bonusValue: 250, maxPayout: 900, rewardOnFirstPurchase: true });
  });

  it("returns null (not DEFAULT_REWARD_RULE) on error, missing row, or unusable value", async () => {
    setTableResult("reward_settings", { error: { message: "denied" } });
    expect(await referralService.getRewardRule()).toBeNull();
    setTableResult("reward_settings", { data: null });
    expect(await referralService.getRewardRule()).toBeNull();
    setTableResult("reward_settings", { data: { ...goodRule, bonus_value: null } });
    expect(await referralService.getRewardRule()).toBeNull();
  });

  it("only __DEV__ gets DEFAULT_REWARD_RULE", async () => {
    setTableResult("reward_settings", { error: { message: "denied" } });
    g.__DEV__ = true;
    expect(await referralService.getRewardRule()).toEqual(DEFAULT_REWARD_RULE);
  });
});

describe("rule unknown → no amounts computed", () => {
  it("getOverview: rewardRule and pendingRewards are null even with pending referrals", async () => {
    setTableResult("referral_codes", { data: { code: "REAL1", total_referrals: 1, total_earned: 0 } });
    setTableResult("referrals", { data: [{ status: "pending" }] });
    setTableResult("reward_settings", { error: { message: "denied" } });
    const o = await referralService.getOverview("u1");
    expect(o.code).toBe("REAL1");
    expect(o.rewardRule).toBeNull();
    expect(o.pendingRewards).toBeNull();
  });

  it("getEarningsSummary: pendingEarnings is null", async () => {
    setTableResult("referrals", { data: [{ id: "1", status: "pending", reward_amount: 0, created_at: new Date().toISOString(), completed_at: null }] });
    setTableResult("reward_settings", { error: { message: "denied" } });
    const e = await referralService.getEarningsSummary("u1");
    expect(e.pendingEarnings).toBeNull();
    expect(e.pendingReferrals).toBe(1);
  });

  it("with a real rule the estimate is computed from it", async () => {
    setTableResult("referral_codes", { data: { code: "REAL1", total_referrals: 2, total_earned: 0 } });
    setTableResult("referrals", { data: [{ status: "pending" }, { status: "pending" }] });
    setTableResult("reward_settings", { data: goodRule });
    expect((await referralService.getOverview("u1")).pendingRewards).toBe(500);
  });
});

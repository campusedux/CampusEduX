jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));

const mockOverview = jest.fn();
const mockEarnings = jest.fn();
jest.mock("@/hooks/useReferral", () => ({
  useReferralOverview: () => mockOverview(),
  useEarningsSummary: () => mockEarnings(),
}));

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, Share } from "react-native";
import { ReferralDashboardScreen } from "@/referral/ReferralDashboardScreen";
import { EarningsScreen } from "@/referral/EarningsScreen";
import { ShareReferralScreen } from "@/referral/ShareReferralScreen";

const mounted: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  mounted.splice(0).forEach((r) => act(() => r.unmount()));
});
function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  mounted.push(r);
  return r;
}
const texts = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map((t) => (Array.isArray(t.props.children) ? t.props.children.join("") : String(t.props.children)));
const q = (data: unknown) => ({ data, isLoading: false, isError: false, refetch: jest.fn() }) as any;

const overview = (over: object = {}) => ({
  code: "REAL1",
  shareLink: "https://www.campusedux.com/register?ref=REAL1",
  totalReferrals: 2,
  totalEarned: 0,
  successfulReferrals: 0,
  pendingReferrals: 2,
  cancelledReferrals: 0,
  pendingRewards: null,
  rewardRule: null,
  ...over,
});
const rule = { bonusType: "flat", bonusValue: 250, maxPayout: 900, rewardOnSignup: false, rewardOnFirstPurchase: true };

describe("rule unknown (null) hides every amount", () => {
  it("ReferralDashboard: no 'Earn ₹', no 'Pending Rewards', code still shown", () => {
    mockOverview.mockReturnValue(q(overview()));
    const t = texts(render(<ReferralDashboardScreen />));
    expect(t).toContain("REAL1");
    expect(t.some((x) => x.includes("Earn ₹") || x.includes("Pending Rewards") || /₹\d+ for every/.test(x))).toBe(false);
    expect(t).not.toContain("₹100");
  });

  it("ReferralDashboard: with a real rule the amounts show", () => {
    mockOverview.mockReturnValue(q(overview({ rewardRule: rule, pendingRewards: 500 })));
    const t = texts(render(<ReferralDashboardScreen />));
    expect(t.some((x) => x.includes("Earn ₹250"))).toBe(true);
    expect(t).toContain("Pending Rewards");
  });

  it("Earnings: Pending Earnings hidden when null, shown when known", () => {
    const data = { totalEarnings: 0, totalReferrals: 2, pendingEarnings: null, successfulReferrals: 0, pendingReferrals: 2, cancelledReferrals: 0, monthlyTrend: [], recentEarnings: [] };
    mockEarnings.mockReturnValue(q(data));
    expect(texts(render(<EarningsScreen />))).not.toContain("Pending Earnings");
    mockEarnings.mockReturnValue(q({ ...data, pendingEarnings: 500 }));
    expect(texts(render(<EarningsScreen />))).toContain("Pending Earnings");
  });

  it("ShareReferral: outgoing message has the code + link and no amount when the rule is null", () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "dismissedAction" } as any);
    mockOverview.mockReturnValue(q(overview()));
    const r = render(<ShareReferralScreen />);
    const channel = r.root.findAll((n) => typeof n.props.onPress === "function" && n.props.style?.width === "28%")[0];
    act(() => {
      channel.props.onPress();
    });
    const { message } = share.mock.calls[0][0] as { message: string };
    expect(message).toBe("Join me on CampusEduX using my code REAL1: https://www.campusedux.com/register?ref=REAL1");
    expect(message).not.toMatch(/₹|%|earn/i);
    share.mockRestore();
  });

  it("ShareReferral: a known real rule may be described in the message", () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "dismissedAction" } as any);
    mockOverview.mockReturnValue(q(overview({ rewardRule: rule })));
    const r = render(<ShareReferralScreen />);
    const channel = r.root.findAll((n) => typeof n.props.onPress === "function" && n.props.style?.width === "28%")[0];
    act(() => {
      channel.props.onPress();
    });
    expect((share.mock.calls[0][0] as { message: string }).message).toContain("₹250");
    share.mockRestore();
  });
});

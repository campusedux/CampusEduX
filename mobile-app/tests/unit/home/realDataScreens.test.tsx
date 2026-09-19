jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack, getParent: () => ({ navigate: jest.fn() }) }),
  useRoute: () => ({ params: { projectId: "p1" } }),
}));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));

const mockOffers = jest.fn();
const mockReferral = jest.fn();
jest.mock("@/hooks/useHomeData", () => ({
  useOfferBanners: () => mockOffers(),
  useReferralSummary: () => mockReferral(),
  useSearchAll: () => ({ data: { projects: [], jobs: [] }, isLoading: false, isError: false, refetch: jest.fn() }),
}));
const mockDetail = jest.fn();
jest.mock("@/hooks/useProjects", () => ({ useProjectDetail: () => mockDetail() }));
jest.mock("@/hooks/usePayment", () => ({ usePurchaseFlow: () => ({ purchase: jest.fn(), isProcessing: false }) }));

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { OfferBannerScreen } from "@/home/OfferBannerScreen";
import { ReferralBannerScreen } from "@/home/ReferralBannerScreen";
import { SearchResultScreen } from "@/home/SearchResultScreen";
import { BuyNowScreen } from "@/project/BuyNowScreen";
import { PaymentScreen } from "@/project/PaymentScreen";

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r;
}
const texts = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map((t) => (Array.isArray(t.props.children) ? t.props.children.join("") : String(t.props.children)));
const q = (over: object) => ({ data: undefined, isLoading: false, isError: false, refetch: jest.fn(), ...over }) as any;

describe("project detail error → no Buy / Payment path", () => {
  it.each([
    ["BuyNowScreen", BuyNowScreen, "Proceed to Payment"],
    ["PaymentScreen", PaymentScreen, "Pay"],
  ])("%s shows ErrorState with retry and no purchase button", (_n, Screen, buyLabel) => {
    const refetch = jest.fn();
    mockDetail.mockReturnValue(q({ isError: true, refetch }));
    const r = render(<Screen />);
    const t = texts(r);
    expect(t).toContain("Couldn't load project.");
    expect(t).toContain("Tap to retry");
    expect(t.some((x) => x.includes(buyLabel))).toBe(false);
    expect(r.root.findAll((n) => typeof n.props.label === "string" && n.props.label.includes(buyLabel))).toHaveLength(0);
    act(() => r.root.findAllByType(Text).find((x) => x.props.children === "Tap to retry")!.props.onPress());
    expect(refetch).toHaveBeenCalled();
  });
});

describe("search", () => {
  it("no match → EmptyState 'No results for \"<query>\"'", () => {
    const r = render(<SearchResultScreen />);
    // query is empty until typed; drive the SearchBar
    const input = r.root.find((n) => n.props.placeholder === "Search projects and jobs..." && typeof n.props.onChangeText === "function");
    act(() => input.props.onChangeText("zzzz-no-match"));
    expect(texts(r)).toContain('No results for "zzzz-no-match"');
  });
});

describe("Special Offers", () => {
  it("no active offers → EmptyState, no hero, no coupon", () => {
    mockOffers.mockReturnValue(q({ data: [] }));
    const t = texts(render(<OfferBannerScreen />));
    expect(t).toContain("No active offers right now");
    expect(t.some((x) => x.includes("Limited Time Offer") || x.includes("Use Code") || x.includes("50%"))).toBe(false);
  });

  it("hero and rows come only from real offer data", () => {
    mockOffers.mockReturnValue(
      q({
        data: [
          { id: "1", title: "Diwali Sale", description: "On premium", discountLabel: "25%", couponCode: "DIWALI25" },
          { id: "2", title: "Welcome", description: "New users", discountLabel: "10%", couponCode: "WELCOME10" },
        ],
      }),
    );
    const t = texts(render(<OfferBannerScreen />));
    expect(t).toEqual(expect.arrayContaining(["Diwali Sale", "Use Code: DIWALI25", "Welcome", "Use Code: WELCOME10"]));
    expect(t.some((x) => x.includes("Limited Time Offer") || x.includes("Up to 50%"))).toBe(false);
  });
});

describe("Referral", () => {
  it("error → ErrorState with retry and no code/link at all", () => {
    mockReferral.mockReturnValue(q({ isError: true }));
    const t = texts(render(<ReferralBannerScreen />));
    expect(t).toContain("Couldn't load referral details.");
    expect(t).toContain("Tap to retry");
    expect(t.some((x) => /ROHAN21|campusedux\.com\/register/.test(x))).toBe(false);
  });

  it("amounts unreadable → benefits (amount) hidden, real code still shown", () => {
    mockReferral.mockReturnValue(
      q({ data: { code: "REAL1", shareLink: "https://x/register?ref=REAL1", totalReferrals: 0, totalEarned: 0, referrerBonus: null, referrerBonusPercent: null, rewardOnSignup: null, rewardOnFirstPurchase: null } }),
    );
    const t = texts(render(<ReferralBannerScreen />));
    expect(t).toContain("REAL1");
    expect(t.some((x) => x.includes("Benefits") || x.includes("₹") || x.includes("% OFF"))).toBe(false);
  });

  it("shows the reward_settings amount when known", () => {
    mockReferral.mockReturnValue(
      q({ data: { code: "REAL1", shareLink: "l", totalReferrals: 0, totalEarned: 0, referrerBonus: 150, referrerBonusPercent: null, rewardOnSignup: false, rewardOnFirstPurchase: true } }),
    );
    expect(texts(render(<ReferralBannerScreen />))).toContain("₹150");
  });
});

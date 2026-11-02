jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import {
  customProjectsService,
  calculateEstimate,
  getFeaturesFor,
  splitFeaturesFor,
  mapAmounts,
} from "@/services/customProjects.service";
import { CUSTOM_PROJECT_TOKENS } from "@/types";
import { resetSupabaseMock, setTableResult, setFunctionResult, setRpcResult, supabase } from "../../mocks/supabase.mock";
import type { CustomFeature, CustomPlatformPricing, CustomProjectPricing } from "@/types";

beforeEach(() => resetSupabaseMock());

const PRICING: CustomProjectPricing[] = [
  { projectType: "academic", projectLevel: "standard", basePrice: 7999, tokenAmount: 1500, pricingVersion: 1 },
  { projectType: "academic", projectLevel: "advanced", basePrice: 9999, tokenAmount: 1500, pricingVersion: 1 },
  { projectType: "personal", projectLevel: "standard", basePrice: 15999, tokenAmount: 3000, pricingVersion: 1 },
  { projectType: "personal", projectLevel: "advanced", basePrice: 19999, tokenAmount: 3000, pricingVersion: 1 },
  { projectType: "business", projectLevel: "standard", basePrice: 29999, tokenAmount: 6000, pricingVersion: 1 },
  { projectType: "business", projectLevel: "advanced", basePrice: 39999, tokenAmount: 6000, pricingVersion: 1 },
];

const PLATFORMS: CustomPlatformPricing[] = [
  { platform: "web", label: "Web", charge: 0, sortOrder: 1 },
  { platform: "web_android", label: "Web + Android", charge: 3000, sortOrder: 4 },
];

const FEATURES: CustomFeature[] = [
  { id: "ai", name: "AI chatbot", description: "", category: "AI", projectTypes: ["personal", "business"], projectLevels: ["advanced"], price: 4000, sortOrder: 2 },
  { id: "chat", name: "Live chat", description: "", category: "Real-Time", projectTypes: ["personal", "business"], projectLevels: ["standard", "advanced"], price: 3000, sortOrder: 1 },
  { id: "razorpay", name: "Razorpay", description: "", category: "Payments", projectTypes: ["academic", "personal", "business"], projectLevels: ["advanced"], price: 2000, sortOrder: 3 },
  { id: "analytics", name: "Advanced analytics", description: "", category: "Analytics", projectTypes: ["personal", "business"], projectLevels: ["standard", "advanced"], price: 4000, sortOrder: 4 },
  { id: "srs", name: "SRS document", description: "", category: "Documentation", projectTypes: ["academic"], projectLevels: ["standard", "advanced"], price: 1000, sortOrder: 5 },
];

describe("CUSTOM_PROJECT_TOKENS (spec §2 / §41)", () => {
  it("is exactly 1500 / 3000 / 6000", () => {
    expect(CUSTOM_PROJECT_TOKENS).toEqual({ academic: 1500, personal: 3000, business: 6000 });
  });
});

describe("calculateEstimate", () => {
  it('uses edited catalog prices and tokens for both levels', () => {
    const pricing = PRICING.map((row) => ({ ...row, basePrice: 12345, tokenAmount: 2123.45 }));
    for (const projectLevel of ['standard', 'advanced'] as const) {
      const estimate = calculateEstimate({ projectType: 'personal', projectLevel, platform: 'web', featureIds: [] }, pricing, PLATFORMS, []);
      expect(estimate.basePrice).toBe(12345);
      expect(estimate.token).toBe(2123.45);
    }
  });

  it("matches the spec §10 worked example (Personal Advanced = ₹32,999)", () => {
    const est = calculateEstimate(
      { projectType: "personal", projectLevel: "advanced", platform: "web", featureIds: ["ai", "chat", "razorpay", "analytics"] },
      PRICING,
      PLATFORMS,
      FEATURES
    );
    // 19,999 base + (4000 + 3000 + 2000 + 4000) features + 0 platform
    expect(est.basePrice).toBe(19999);
    expect(est.addOnsTotal).toBe(13000);
    expect(est.platformCharges).toBe(0);
    expect(est.total).toBe(32999);
    expect(est.token).toBe(3000);
  });

  it("adds the platform charge on top", () => {
    const est = calculateEstimate(
      { projectType: "personal", projectLevel: "advanced", platform: "web_android", featureIds: [] },
      PRICING,
      PLATFORMS,
      FEATURES
    );
    expect(est.total).toBe(19999 + 3000);
  });

  it("token is the same for Standard and Advanced and is independent of feature count", () => {
    const std = calculateEstimate({ projectType: "personal", projectLevel: "standard", platform: "web", featureIds: [] }, PRICING, PLATFORMS, FEATURES);
    const adv = calculateEstimate({ projectType: "personal", projectLevel: "advanced", platform: "web", featureIds: ["chat", "analytics"] }, PRICING, PLATFORMS, FEATURES);
    expect(std.token).toBe(3000);
    expect(adv.token).toBe(3000);
    expect(std.basePrice).not.toBe(adv.basePrice); // base price DID change
  });

  it("ignores feature ids not available for the chosen type/level", () => {
    // 'ai' is advanced-only; ask for it on a Standard build
    const est = calculateEstimate(
      { projectType: "personal", projectLevel: "standard", platform: "web", featureIds: ["ai", "chat"] },
      PRICING,
      PLATFORMS,
      FEATURES
    );
    expect(est.addOns.map((f) => f.id)).toEqual(["chat"]);
    expect(est.addOnsTotal).toBe(3000);
  });

  it("prices Personal above Academic and Business above Personal (spec §41)", () => {
    const a = calculateEstimate({ projectType: "academic", projectLevel: "advanced", platform: "web", featureIds: [] }, PRICING, PLATFORMS, FEATURES);
    const p = calculateEstimate({ projectType: "personal", projectLevel: "advanced", platform: "web", featureIds: [] }, PRICING, PLATFORMS, FEATURES);
    const b = calculateEstimate({ projectType: "business", projectLevel: "advanced", platform: "web", featureIds: [] }, PRICING, PLATFORMS, FEATURES);
    expect(p.total).toBeGreaterThan(a.total);
    expect(b.total).toBeGreaterThan(p.total);
  });
});

describe("calculateEstimate — included features & balance", () => {
  const INCL: CustomFeature[] = [
    { id: "login", name: "Login", description: "", category: "Auth", projectTypes: ["academic"], projectLevels: ["standard", "advanced"], price: 800, sortOrder: 1, includedInLevels: ["academic:standard", "academic:advanced"] },
    { id: "search-filters", name: "Filters", description: "", category: "Search", projectTypes: ["academic"], projectLevels: ["standard", "advanced"], price: 800, sortOrder: 2, includedInLevels: ["academic:advanced"] },
  ];
  const cfg = (level: "standard" | "advanced", featureIds: string[]) =>
    ({ projectType: "academic", projectLevel: level, platform: "web", featureIds }) as const;

  it("never charges an included feature, even when its id is selected", () => {
    const est = calculateEstimate(cfg("standard", ["login"]), PRICING, PLATFORMS, INCL);
    expect(est.addOns).toEqual([]);
    expect(est.addOnsTotal).toBe(0);
    expect(est.total).toBe(7999);
    expect(est.includedFeatures).toEqual([]);
  });

  it("switching Standard -> Advanced moves a feature from add-on to included", () => {
    const std = calculateEstimate(cfg("standard", ["search-filters"]), PRICING, PLATFORMS, INCL);
    expect(std.addOns).toEqual([]);
    expect(std.addOnsTotal).toBe(0);
    expect(std.total).toBe(7999);

    const adv = calculateEstimate(cfg("advanced", ["search-filters"]), PRICING, PLATFORMS, INCL);
    expect(adv.addOns).toEqual([]);
    expect(adv.includedFeatures).toEqual([]);
    expect(adv.total).toBe(9999);
  });

  it("balanceAfterToken is total - token and never negative", () => {
    const est = calculateEstimate(cfg("standard", []), PRICING, PLATFORMS, INCL);
    expect(est.token).toBe(1500);
    expect(est.balanceAfterToken).toBe(7999 - 1500);
    const none = calculateEstimate({ projectType: null, projectLevel: null, platform: null, featureIds: [] }, [], [], []);
    expect(none.balanceAfterToken).toBe(0);
  });

  it("splitFeaturesFor keeps included out of the add-on catalog", () => {
    const { included, addOnCatalog } = splitFeaturesFor("academic", "standard", INCL);
    expect(included.map((f) => f.id)).toEqual(["login"]);
    expect(addOnCatalog.map((f) => f.id)).toEqual(["search-filters"]);
  });
});

describe("getFeaturesFor", () => {
  it("returns only features whose type + level match, sorted by sortOrder", () => {
    const out = getFeaturesFor("personal", "advanced", FEATURES);
    expect(out.map((f) => f.id)).toEqual(["chat", "ai", "razorpay", "analytics"]);
  });

  it("hides academic-only docs from a business build", () => {
    const out = getFeaturesFor("business", "advanced", FEATURES);
    expect(out.some((f) => f.id === "srs")).toBe(false);
  });

  it("returns [] until both type and level are chosen", () => {
    expect(getFeaturesFor(null, "advanced", FEATURES)).toEqual([]);
    expect(getFeaturesFor("personal", null, FEATURES)).toEqual([]);
  });
});

describe("customProjectsService reads throw on error (money/owned data)", () => {
  it("getPricing throws when the pricing table errors", async () => {
    setTableResult("custom_project_pricing", { error: { message: "relation missing" } });
    setTableResult("custom_project_platform_pricing", { data: [] });
    await expect(customProjectsService.getPricing()).rejects.toThrow("relation missing");
  });

  it("getFeatures throws on error", async () => {
    setTableResult("custom_project_features", { error: { message: "boom" } });
    await expect(customProjectsService.getFeatures()).rejects.toThrow("boom");
  });

  it("getMyRequests throws on error rather than faking a list", async () => {
    setTableResult("custom_project_requests", { error: { message: "rls" } });
    await expect(customProjectsService.getMyRequests("u-1")).rejects.toThrow("rls");
  });

  it("getMyRequests filters by the caller's user_id (admins can read every row via RLS)", async () => {
    setTableResult("custom_project_requests", { data: [] });
    await customProjectsService.getMyRequests("u-1");
    const builder = (supabase.from as jest.Mock).mock.results[0].value;
    expect(builder.eq).toHaveBeenCalledWith("user_id", "u-1");
  });

  it("getRequestDetail filters the request by user_id, so another user's id reads as not found", async () => {
    setTableResult("custom_project_requests", { data: null });
    await expect(customProjectsService.getRequestDetail("r-1", "u-2")).rejects.toThrow("Request not found");
    const reqCall = (supabase.from as jest.Mock).mock.calls.findIndex((c) => c[0] === "custom_project_requests");
    const builder = (supabase.from as jest.Mock).mock.results[reqCall].value;
    expect(builder.eq).toHaveBeenCalledWith("id", "r-1");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "u-2");
  });

  it("maps a paid request row", async () => {
    setTableResult("custom_project_requests", {
      data: [
        {
          id: "r-1",
          request_code: "CPR-2026-000001",
          title: "My CRM",
          project_type: "personal",
          project_level: "advanced",
          platform: "web_android",
          estimated_total: 32999,
          token_amount: 3000,
          token_payment_status: "paid",
          status: "in_development",
          created_at: "2026-08-29T00:00:00.000Z",
        },
      ],
    });
    const rows = await customProjectsService.getMyRequests("u-1");
    expect(rows).toHaveLength(1);
    expect(rows[0].requestCode).toBe("CPR-2026-000001");
    expect(rows[0].tokenAmount).toBe(3000);
    expect(rows[0].status).toBe("in_development");
  });
});

describe("customProjectsService.verifyPayment", () => {
  it("throws when the Edge Function returns an error payload", async () => {
    setFunctionResult("verify-custom-project-payment", { data: { error: "Payment signature verification failed." } });
    await expect(
      customProjectsService.verifyPayment({
        requestId: "r-1",
        razorpayOrderId: "order_x",
        razorpayPaymentId: "pay_x",
        razorpaySignature: "sig_x",
      })
    ).rejects.toThrow("verification failed");
  });

  it("returns the mapped request on success", async () => {
    setFunctionResult("verify-custom-project-payment", {
      data: {
        id: "r-1",
        request_code: "CPR-2026-000009",
        title: "Shop",
        project_type: "business",
        project_level: "standard",
        platform: "web",
        token_amount: 6000,
        token_payment_status: "paid",
        status: "new",
        created_at: "2026-08-29T00:00:00.000Z",
      },
    });
    const req = await customProjectsService.verifyPayment({
      requestId: "r-1",
      razorpayOrderId: "order_x",
      razorpayPaymentId: "pay_x",
      razorpaySignature: "sig_x",
    });
    expect(req.requestCode).toBe("CPR-2026-000009");
    expect(req.tokenPaymentStatus).toBe("paid");
  });
});

describe("mapAmounts (custom_project_amounts RPC, migration 0128)", () => {
  const row = {
    request_id: "r-1", base_value: 10000.5, addons_total: 1500, project_value: 11500.5,
    payments_total: "4734.81", credits_total: 0, settled_total: 4734.81, due: 6765.69,
    payment_status: "partially_paid", pending_addons: 1, priced_addons: 0,
  };

  it("maps the DB figures as-is (paise kept, numeric strings accepted)", () => {
    expect(mapAmounts(row)).toEqual({
      baseValue: 10000.5, addonsTotal: 1500, projectValue: 11500.5, paymentsTotal: 4734.81, creditsTotal: 0,
      settledTotal: 4734.81, due: 6765.69, paymentStatus: "partially_paid", pendingAddons: 1, pricedAddons: 0,
    });
  });

  it("never shows a negative due", () => {
    expect(mapAmounts({ ...row, due: -1, payment_status: "paid" })?.due).toBe(0);
  });

  it("returns null instead of guessing when the result is missing or malformed", () => {
    expect(mapAmounts(null)).toBeNull();
    expect(mapAmounts({ ...row, payment_status: "?" })).toBeNull();
  });
});

describe("customProjectsService edits + extra features (migration 0128)", () => {
  it("updateRequest sends the changes to custom_project_update_request", async () => {
    setRpcResult("custom_project_update_request", { data: { changed: ["title"] } });
    await customProjectsService.updateRequest("r-1", { title: "New" });
    expect(supabase.rpc).toHaveBeenCalledWith("custom_project_update_request", { p_request_id: "r-1", p_changes: { title: "New" } });
  });

  it("surfaces the DB lock message when work has started", async () => {
    setRpcResult("custom_project_update_request", {
      data: null,
      error: { message: "This request can no longer be edited because work has started." },
    });
    await expect(customProjectsService.updateRequest("r-1", { title: "x" })).rejects.toThrow("no longer be edited");
  });

  it("create / accept / delete add-ons go through their RPCs (no price is ever sent)", async () => {
    await customProjectsService.createAddon("r-1", "Dark mode", "Toggle");
    await customProjectsService.acceptAddon("ad-1");
    await customProjectsService.deleteAddon("ad-2");
    expect(supabase.rpc).toHaveBeenCalledWith("custom_project_addon_create", { p_project_id: "r-1", p_title: "Dark mode", p_description: "Toggle" });
    expect(supabase.rpc).toHaveBeenCalledWith("custom_project_addon_accept", { p_addon_id: "ad-1" });
    expect(supabase.rpc).toHaveBeenCalledWith("custom_project_addon_delete", { p_addon_id: "ad-2" });
  });
});

describe("customProjectsService balance payment (Bug 3)", () => {
  it("createBalanceOrder throws on an error payload", async () => {
    setFunctionResult("create-custom-project-balance-order", { data: { error: "There is nothing left to pay on this request." } });
    await expect(customProjectsService.createBalanceOrder("r-1")).rejects.toThrow("nothing left to pay");
  });

  it("createBalanceOrder returns the order on success", async () => {
    setFunctionResult("create-custom-project-balance-order", {
      data: { paymentId: "p-1", razorpayOrderId: "order_bal", razorpayKeyId: "rzp_test_x", amount: 500000, currency: "INR", remaining: 5000 },
    });
    const order = await customProjectsService.createBalanceOrder("r-1");
    expect(order.paymentId).toBe("p-1");
    expect(order.remaining).toBe(5000);
  });

  it("verifyBalancePayment throws when the Edge Function returns an error payload", async () => {
    setFunctionResult("verify-custom-project-balance-payment", { data: { error: "Payment signature verification failed." } });
    await expect(
      customProjectsService.verifyBalancePayment({
        paymentId: "p-1",
        razorpayOrderId: "order_bal",
        razorpayPaymentId: "pay_x",
        razorpaySignature: "sig_x",
      })
    ).rejects.toThrow("verification failed");
  });

  it("verifyBalancePayment returns the mapped, updated request on success", async () => {
    setFunctionResult("verify-custom-project-balance-payment", {
      data: {
        id: "r-1", request_code: "CPR-2026-000001", title: "My CRM", project_type: "personal", project_level: "advanced",
        platform: "web_android", estimated_total: 32999, final_price: 30000, amount_paid: 30000, token_amount: 3000,
        token_payment_status: "paid", status: "delivered", created_at: "2026-08-29T00:00:00.000Z",
      },
    });
    const req = await customProjectsService.verifyBalancePayment({
      paymentId: "p-1", razorpayOrderId: "order_bal", razorpayPaymentId: "pay_x", razorpaySignature: "sig_x",
    });
    expect(req.finalPrice).toBe(30000);
    expect(req.amountPaid).toBe(30000);
  });
});

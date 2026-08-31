jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import {
  customProjectsService,
  estimatePrice,
  getFeaturesFor,
} from "@/services/customProjects.service";
import { CUSTOM_PROJECT_TOKENS } from "@/types";
import { resetSupabaseMock, setTableResult, setFunctionResult } from "../../mocks/supabase.mock";
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

describe("estimatePrice", () => {
  it("matches the spec §10 worked example (Personal Advanced = ₹32,999)", () => {
    const est = estimatePrice(
      { projectType: "personal", projectLevel: "advanced", platform: "web", featureIds: ["ai", "chat", "razorpay", "analytics"] },
      PRICING,
      PLATFORMS,
      FEATURES
    );
    // 19,999 base + (4000 + 3000 + 2000 + 4000) features + 0 platform
    expect(est.basePrice).toBe(19999);
    expect(est.featureTotal).toBe(13000);
    expect(est.platformCharge).toBe(0);
    expect(est.estimatedTotal).toBe(32999);
    expect(est.tokenAmount).toBe(3000);
  });

  it("adds the platform charge on top", () => {
    const est = estimatePrice(
      { projectType: "personal", projectLevel: "advanced", platform: "web_android", featureIds: [] },
      PRICING,
      PLATFORMS,
      FEATURES
    );
    expect(est.estimatedTotal).toBe(19999 + 3000);
  });

  it("token is the same for Standard and Advanced and is independent of feature count", () => {
    const std = estimatePrice({ projectType: "personal", projectLevel: "standard", platform: "web", featureIds: [] }, PRICING, PLATFORMS, FEATURES);
    const adv = estimatePrice({ projectType: "personal", projectLevel: "advanced", platform: "web", featureIds: ["chat", "analytics"] }, PRICING, PLATFORMS, FEATURES);
    expect(std.tokenAmount).toBe(3000);
    expect(adv.tokenAmount).toBe(3000);
    expect(std.basePrice).not.toBe(adv.basePrice); // base price DID change
  });

  it("ignores feature ids not available for the chosen type/level", () => {
    // 'ai' is advanced-only; ask for it on a Standard build
    const est = estimatePrice(
      { projectType: "personal", projectLevel: "standard", platform: "web", featureIds: ["ai", "chat"] },
      PRICING,
      PLATFORMS,
      FEATURES
    );
    expect(est.selectedFeatures.map((f) => f.id)).toEqual(["chat"]);
    expect(est.featureTotal).toBe(3000);
  });

  it("prices Personal above Academic and Business above Personal (spec §41)", () => {
    const a = estimatePrice({ projectType: "academic", projectLevel: "advanced", platform: "web", featureIds: [] }, PRICING, PLATFORMS, FEATURES);
    const p = estimatePrice({ projectType: "personal", projectLevel: "advanced", platform: "web", featureIds: [] }, PRICING, PLATFORMS, FEATURES);
    const b = estimatePrice({ projectType: "business", projectLevel: "advanced", platform: "web", featureIds: [] }, PRICING, PLATFORMS, FEATURES);
    expect(p.estimatedTotal).toBeGreaterThan(a.estimatedTotal);
    expect(b.estimatedTotal).toBeGreaterThan(p.estimatedTotal);
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

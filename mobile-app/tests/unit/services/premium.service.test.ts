jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { premiumService } from "@/services/premium.service";
import { resetSupabaseMock, setTableResult, setFunctionResult, supabase } from "../../mocks/supabase.mock";
import { SAMPLE_PREMIUM_PLANS, SAMPLE_PREMIUM_FEATURES } from "@/data/samplePremiumContent";

beforeEach(() => resetSupabaseMock());

describe("premiumService.getPlans", () => {
  it("maps live plan rows", async () => {
    setTableResult("premium_plans", {
      data: [
        { id: "pl-1", name: "Pro", tier: "pro", monthly_price: 199, yearly_price: 1999, yearly_discount_percent: 16, is_popular: true, features: ["a", "b"] },
      ],
    });

    const plans = await premiumService.getPlans();

    expect(plans[0]).toEqual({
      id: "pl-1", name: "Pro", tier: "pro", monthlyPrice: 199, yearlyPrice: 1999, yearlyDiscountPercent: 16, isPopular: true, features: ["a", "b"],
    });
  });

  it("returns an honest empty catalog when the table is empty (never a fake planId a real Subscribe tap could send)", async () => {
    setTableResult("premium_plans", { data: [] });
    expect(await premiumService.getPlans()).toEqual([]);
  });

  it("falls back to sample plans when the query fails", async () => {
    setTableResult("premium_plans", { error: { message: "no table" } });
    expect(await premiumService.getPlans()).toEqual(SAMPLE_PREMIUM_PLANS);
  });
});

describe("premiumService.getFeatures", () => {
  it("falls back to sample features on error", async () => {
    setTableResult("premium_features", { error: { message: "no table" } });
    expect(await premiumService.getFeatures()).toEqual(SAMPLE_PREMIUM_FEATURES);
  });
});

describe("premiumService.getMembership", () => {
  it("maps an active subscription row", async () => {
    setTableResult("premium_subscriptions", {
      data: [
        {
          id: "sub-1",
          billing_cycle: "yearly",
          price: 1999,
          status: "active",
          started_at: "2025-01-01",
          current_period_end: "2026-01-01",
          payment_method: "UPI",
          auto_renew: true,
          plan: { name: "Pro", features: ["All projects"] },
        },
      ],
    });

    const membership = await premiumService.getMembership("u-1");

    expect(membership).toEqual({
      subscriptionId: "sub-1",
      planName: "Pro",
      billingCycle: "yearly",
      price: 1999,
      status: "active",
      memberSince: "2025-01-01",
      nextBillingDate: "2026-01-01",
      paymentMethod: "UPI",
      autoRenew: true,
      includedFeatures: ["All projects"],
    });
  });

  it("returns null (a valid 'no membership' state) when there is no active row", async () => {
    setTableResult("premium_subscriptions", { data: [] });
    expect(await premiumService.getMembership("u-1")).toBeNull();
  });

  it("throws instead of fabricating an active membership when the query fails (money-safety)", async () => {
    setTableResult("premium_subscriptions", { error: { message: "relation does not exist" } });
    await expect(premiumService.getMembership("u-1")).rejects.toThrow("relation does not exist");
  });
});

describe("premiumService.createOrder", () => {
  it("invokes the Edge Function and returns the order fields", async () => {
    setFunctionResult("create-premium-order", {
      data: {
        orderId: "o-1", razorpayOrderId: "rzp_1", razorpayKeyId: "key_1", amount: 199900, currency: "INR",
        planPrice: 1999, gst: 360, totalAmount: 2359, planName: "Pro", billingCycle: "yearly",
      },
    });

    const order = await premiumService.createOrder("pl-1", "yearly");

    expect(supabase.functions.invoke).toHaveBeenCalledWith("create-premium-order", { body: { planId: "pl-1", billingCycle: "yearly" } });
    expect(order.totalAmount).toBe(2359);
    expect(order.planName).toBe("Pro");
  });

  it("throws when the Edge Function errors", async () => {
    setFunctionResult("create-premium-order", { error: { message: "plan not found" } });
    await expect(premiumService.createOrder("bad", "monthly")).rejects.toThrow("plan not found");
  });
});

describe("premiumService.verifyPayment", () => {
  it("returns the new subscription id", async () => {
    setFunctionResult("verify-premium-payment", { data: { subscriptionId: "sub-9" } });

    const result = await premiumService.verifyPayment({ orderId: "o", razorpayOrderId: "ro", razorpayPaymentId: "rp", razorpaySignature: "sig" });

    expect(result).toEqual({ subscriptionId: "sub-9" });
  });

  it("throws on a signature mismatch reported by the server", async () => {
    setFunctionResult("verify-premium-payment", { error: { message: "signature mismatch" } });
    await expect(
      premiumService.verifyPayment({ orderId: "o", razorpayOrderId: "ro", razorpayPaymentId: "rp", razorpaySignature: "bad" })
    ).rejects.toThrow("signature mismatch");
  });
});

describe("premiumService.cancelSubscription", () => {
  it("turns off auto-renew", async () => {
    setTableResult("premium_subscriptions", { data: null });
    await expect(premiumService.cancelSubscription("sub-1")).resolves.toBeUndefined();
  });

  it("throws a friendly error when the update fails", async () => {
    setTableResult("premium_subscriptions", { error: { message: "rls" } });
    await expect(premiumService.cancelSubscription("sub-1")).rejects.toThrow("Couldn't cancel auto-renewal: rls");
  });
});

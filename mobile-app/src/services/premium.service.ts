import { supabase } from "@/lib/supabase";
import type { PremiumPlan, PremiumFeature, MembershipDetails, PremiumOrder, BillingCycle } from "@/types";
import {
  SAMPLE_PREMIUM_PLANS,
  SAMPLE_PREMIUM_FEATURES,
} from "@/data/samplePremiumContent";

function mapPlanRow(row: any): PremiumPlan {
  return {
    id: row.id,
    name: row.name,
    tier: row.tier,
    monthlyPrice: row.monthly_price,
    yearlyPrice: row.yearly_price,
    yearlyDiscountPercent: row.yearly_discount_percent,
    isPopular: row.is_popular,
    features: row.features ?? [],
  };
}

export const premiumService = {
  async getPlans(): Promise<PremiumPlan[]> {
    // An empty catalog is a real, honest state — never substitute sample
    // plans a real "Subscribe" tap could pass to create-premium-order as a
    // non-existent planId. Sample data is a __DEV__-only stand-in for a
    // genuine query failure.
    try {
      const { data, error } = await supabase.from("premium_plans").select("*").order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapPlanRow);
    } catch (error) {
      if (__DEV__) {
        console.info(`[premium.service] getPlans: using sample content in dev (${(error as Error).message})`);
        return SAMPLE_PREMIUM_PLANS;
      }
      throw error;
    }
  },

  async getFeatures(): Promise<PremiumFeature[]> {
    try {
      const { data, error } = await supabase.from("premium_features").select("*").order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({ id: row.id, icon: row.icon, title: row.title, subtitle: row.subtitle }));
    } catch (error) {
      if (__DEV__) {
        console.info(`[premium.service] getFeatures: using sample content in dev (${(error as Error).message})`);
        return SAMPLE_PREMIUM_FEATURES;
      }
      throw error;
    }
  },

  async getMembership(userId: string): Promise<MembershipDetails | null> {
    // A failed fetch must surface as an error to the hook rather than
    // fabricate an "active" membership — otherwise a non-subscriber sees a
    // fake "Premium Member / Amount Paid ₹…" card. `null` (no active row) is
    // a real, valid state: the screen shows its "No active membership" empty
    // state, not the sample.
    const res = await supabase
      .from("premium_subscriptions")
      .select("*, plan:premium_plans(name, features)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (res.error) throw new Error(res.error.message);
    const data = res.data;
    if (!data) return null;

    return {
      subscriptionId: data.id,
      planName: data.plan?.name ?? "Premium",
      billingCycle: data.billing_cycle,
      price: data.price,
      status: data.status,
      memberSince: data.started_at,
      nextBillingDate: data.current_period_end,
      paymentMethod: data.payment_method ?? "UPI",
      autoRenew: data.auto_renew,
      includedFeatures: data.plan?.features ?? [],
    };
  },

  /** Creates a Razorpay order for a plan purchase (server-side, via Edge Function). */
  async createOrder(planId: string, billingCycle: BillingCycle): Promise<PremiumOrder> {
    const { data, error } = await supabase.functions.invoke("create-premium-order", { body: { planId, billingCycle } });
    if (error) throw new Error(error.message);
    if (!data || data.error || !data.orderId || !data.razorpayOrderId) throw new Error(data?.error || "Could not create payment order.");
    return {
      orderId: data.orderId,
      razorpayOrderId: data.razorpayOrderId,
      razorpayKeyId: data.razorpayKeyId,
      amount: data.amount,
      currency: data.currency,
      planPrice: data.planPrice,
      gst: data.gst,
      totalAmount: data.totalAmount,
      planName: data.planName,
      billingCycle: data.billingCycle,
    };
  },

  /** Verifies the Razorpay payment server-side before activating the subscription. */
  async verifyPayment(params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ subscriptionId: string }> {
    const { data, error } = await supabase.functions.invoke("verify-premium-payment", { body: params });
    if (error) throw new Error(error.message);
    if (!data || data.error || !data.subscriptionId) throw new Error(data?.error || "Payment verification pending.");
    return { subscriptionId: data.subscriptionId };
  },

  /**
   * Cancelling stops auto-renewal but keeps the plan active until
   * current_period_end (standard subscription behavior) — no partial
   * refund is issued, matching how Razorpay/App Store subscriptions work.
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from("premium_subscriptions")
      .update({ auto_renew: false })
      .eq("id", subscriptionId);
    if (error) throw new Error(`Couldn't cancel auto-renewal: ${error.message}`);
  },
};

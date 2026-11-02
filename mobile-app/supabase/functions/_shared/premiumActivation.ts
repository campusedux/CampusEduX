import type { adminClient } from "./client.ts";
import { premiumPaymentAmountPaise } from "./razorpay.ts";

/** Call only after SEC-02 authoritative capture verification against these terms. */
export async function activatePremiumSubscription(
  db: ReturnType<typeof adminClient>,
  subscription: { id: string; user_id: string; razorpay_order_id: string; price: unknown; plan_id: string; billing_cycle: string },
  paymentId: string,
): Promise<{ alreadyActive: boolean }> {
  const { data, error } = await db.rpc("activate_premium_subscription", {
    p_subscription_id: subscription.id,
    p_user_id: subscription.user_id,
    p_provider_order_id: subscription.razorpay_order_id,
    p_payment_id: paymentId,
    p_plan_id: subscription.plan_id,
    p_billing_cycle: subscription.billing_cycle,
    p_amount_paise: premiumPaymentAmountPaise(subscription.price),
    p_currency: "INR",
  });
  if (error) throw error;
  const result = data?.subscription;
  const start = typeof result?.started_at === "string" ? Date.parse(result.started_at) : NaN;
  const end = typeof result?.current_period_end === "string" ? Date.parse(result.current_period_end) : NaN;
  if (typeof data?.alreadyActive !== "boolean" || result?.id !== subscription.id ||
    result?.user_id !== subscription.user_id || result?.status !== "active" ||
    result?.razorpay_order_id !== subscription.razorpay_order_id || result?.razorpay_payment_id !== paymentId ||
    result?.plan_id !== subscription.plan_id || result?.billing_cycle !== subscription.billing_cycle ||
    Number(result?.price) !== Number(subscription.price) ||
    !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("Premium activation could not be confirmed. Please retry.");
  }
  return { alreadyActive: data.alreadyActive };
}

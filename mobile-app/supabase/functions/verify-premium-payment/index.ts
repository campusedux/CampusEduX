// POST verify-premium-payment
//
// Called by src/services/premium.service.ts -> verifyPayment(params)
//
// Request  body : {
//   orderId: string,            // premium_subscriptions.id
//   razorpayOrderId: string,
//   razorpayPaymentId: string,
//   razorpaySignature: string
// }
// Response body : { subscriptionId: string }
//
// Real HMAC-SHA256 verification. On success the subscription row flips
// pending -> active, its period dates are set, and profiles.is_premium is kept
// in sync by the DB trigger from migration 0022. Idempotent.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { razorpayConfigured, verifyRazorpaySignature } from "../_shared/razorpay.ts";

function periodEnd(from: Date, billingCycle: string): Date {
  const end = new Date(from);
  if (billingCycle === "yearly") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) return json({ error: "Payments are not configured." }, 503);

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req
      .json()
      .catch(() => ({}));
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return json({ error: "orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required." }, 400);
    }

    const db = adminClient();

    const { data: sub, error: fetchError } = await db
      .from("premium_subscriptions")
      .select("id, user_id, status, billing_cycle, razorpay_order_id")
      .eq("id", orderId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!sub) return json({ error: "Subscription order not found." }, 404);
    if (sub.user_id !== user.id) return json({ error: "This order is not yours." }, 403);
    if (sub.razorpay_order_id && sub.razorpay_order_id !== razorpayOrderId) {
      return json({ error: "Razorpay order id does not match this order." }, 400);
    }

    if (sub.status === "active") return json({ subscriptionId: sub.id });

    const valid = await verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) return json({ error: "Payment signature verification failed." }, 400);

    const now = new Date();
    const { error: updateError } = await db
      .from("premium_subscriptions")
      .update({
        status: "active",
        started_at: now.toISOString(),
        current_period_end: periodEnd(now, sub.billing_cycle).toISOString(),
        razorpay_payment_id: razorpayPaymentId,
        payment_method: "Razorpay",
      })
      .eq("id", sub.id);
    if (updateError) throw updateError;

    return json({ subscriptionId: sub.id });
  } catch (err) {
    console.error("verify-premium-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

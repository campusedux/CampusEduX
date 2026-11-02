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
// HMAC-SHA256 plus authoritative capture verification. The shared SEC-05 RPC
// commits active status and period dates together. The existing DB trigger keeps
// profiles.is_premium in sync. Retries preserve the established billing period.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { nonEmptyString, orderBindingMatches, paymentIsAvailable } from "../_shared/paymentBinding.ts";
import { activatePremiumSubscription } from "../_shared/premiumActivation.ts";
import { PaymentVerificationError, premiumPaymentAmountPaise, razorpayConfigured, verifyCapturedRazorpayPayment, verifyRazorpaySignature } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) return json({ error: "Payments are not configured." }, 503);

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req
      .json()
      .catch(() => ({})) ?? {};
    if (![orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature].every(nonEmptyString)) {
      return json({ error: "orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required." }, 400);
    }

    const db = adminClient();

    const { data: sub, error: fetchError } = await db
      .from("premium_subscriptions")
      .select("id, user_id, status, plan_id, billing_cycle, price, razorpay_order_id, razorpay_payment_id")
      .eq("id", orderId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!sub) return json({ error: "Subscription order not found." }, 404);
    if (sub.user_id !== user.id) return json({ error: "This order is not yours." }, 403);
    if (!orderBindingMatches(sub.razorpay_order_id, razorpayOrderId)) {
      return json({ error: "Razorpay order id does not match this order." }, 400);
    }

    const valid = await verifyRazorpaySignature(sub.razorpay_order_id, razorpayPaymentId, razorpaySignature);
    if (!valid) return json({ error: "Payment signature verification failed." }, 400);

    if (sub.status === "active" && sub.razorpay_payment_id !== razorpayPaymentId) {
      return json({ error: "Payment id does not match the settled order." }, 400);
    }
    if (!await paymentIsAvailable(db, razorpayPaymentId, sub.razorpay_order_id, { type: "premium", id: sub.id })) {
      return json({ error: "Payment id is already bound to another order." }, 400);
    }

    await verifyCapturedRazorpayPayment({
      paymentId: razorpayPaymentId,
      orderId: sub.razorpay_order_id,
      amountPaise: premiumPaymentAmountPaise(sub.price),
      currency: "INR",
    });

    await activatePremiumSubscription(db, sub, razorpayPaymentId);

    return json({ subscriptionId: sub.id });
  } catch (err) {
    console.error("verify-premium-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, err instanceof PaymentVerificationError ? err.status : 500);
  }
});

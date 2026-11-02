// POST verify-razorpay-payment
//
// Called by src/services/payment.service.ts -> verifyPayment(payload)
//
// Request  body : {
//   orderId: string,            // our purchases.id
//   razorpayOrderId: string,
//   razorpayPaymentId: string,
//   razorpaySignature: string
// }
// Response body : a purchases row shaped for mapOrderRow():
//   { id, project_id, project: { title }, price, platform_fee, discount,
//     total_amount, status, razorpay_order_id, razorpay_payment_id,
//     failure_reason, created_at }
//
// Real HMAC-SHA256 verification of `${razorpayOrderId}|${razorpayPaymentId}`
// with RAZORPAY_KEY_SECRET. A failed check marks the order "failed"; a passing
// check plus authoritative capture verification settles through one transaction.
// Database triggers include sales, spend, coupon and referral effects exactly once.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { nonEmptyString, orderBindingMatches, paymentIsAvailable } from "../_shared/paymentBinding.ts";
import { PaymentVerificationError, paymentAmountPaise, razorpayConfigured, verifyCapturedRazorpayPayment, verifyRazorpaySignature } from "../_shared/razorpay.ts";
import { settleProjectPurchase } from "../_shared/purchaseSettlement.ts";

const PURCHASE_SELECT =
  "id, project_id, price, platform_fee, discount, total_amount, status, razorpay_order_id, razorpay_payment_id, failure_reason, created_at, project:projects(title)";

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

    const { data: purchase, error: fetchError } = await db
      .from("purchases")
      .select(PURCHASE_SELECT)
      .eq("id", orderId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!purchase) return json({ error: "Order not found." }, 404);

    // ownership + order-id binding
    const { data: owner, error: ownerError } = await db
      .from("purchases")
      .select("user_id")
      .eq("id", orderId)
      .single();
    if (ownerError) throw ownerError;
    if (!owner || owner.user_id !== user.id) return json({ error: "This order is not yours." }, 403);
    if (!orderBindingMatches(purchase.razorpay_order_id, razorpayOrderId)) {
      return json({ error: "Razorpay order id does not match this order." }, 400);
    }

    const valid = await verifyRazorpaySignature(
      purchase.razorpay_order_id,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!valid) {
      if (purchase.status === "success") return json({ error: "Payment signature verification failed." }, 400);
      const { data: failed, error: failureError } = await db
        .from("purchases")
        .update({ status: "failed", failure_reason: "Signature verification failed." })
        .eq("id", orderId).eq("razorpay_order_id", purchase.razorpay_order_id)
        .eq("user_id", user.id).in("status", ["pending", "failed"])
        .select(PURCHASE_SELECT)
        .maybeSingle();
      if (failureError) throw failureError;
      return json({ error: "Payment signature verification failed.", order: failed }, 400);
    }

    if (purchase.status === "success" && purchase.razorpay_payment_id !== razorpayPaymentId) {
      return json({ error: "Payment id does not match the settled order." }, 400);
    }
    if (!await paymentIsAvailable(db, razorpayPaymentId, purchase.razorpay_order_id, { type: "purchase", id: purchase.id })) {
      return json({ error: "Payment id is already bound to another order." }, 400);
    }

    await verifyCapturedRazorpayPayment({
      paymentId: razorpayPaymentId,
      orderId: purchase.razorpay_order_id,
      amountPaise: paymentAmountPaise(purchase.total_amount),
      currency: "INR",
    });

    const settlement = await settleProjectPurchase(db, { ...purchase, user_id: user.id }, razorpayPaymentId);
    return json(settlement.purchase);
  } catch (err) {
    console.error("verify-razorpay-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, err instanceof PaymentVerificationError ? err.status : 500);
  }
});

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
// check marks it "success", bumps projects.sales_count and logs the spend on
// the wallet ledger. Idempotent — a repeat call on an already-successful order
// just returns the row.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { razorpayConfigured, verifyRazorpaySignature } from "../_shared/razorpay.ts";

const PURCHASE_SELECT =
  "id, project_id, price, platform_fee, discount, total_amount, status, " +
  "razorpay_order_id, razorpay_payment_id, failure_reason, created_at, " +
  "project:projects(title)";

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

    const { data: purchase, error: fetchError } = await db
      .from("purchases")
      .select(PURCHASE_SELECT)
      .eq("id", orderId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!purchase) return json({ error: "Order not found." }, 404);

    // ownership + order-id binding
    const { data: owner } = await db
      .from("purchases")
      .select("user_id")
      .eq("id", orderId)
      .single();
    if (!owner || owner.user_id !== user.id) return json({ error: "This order is not yours." }, 403);
    if (purchase.razorpay_order_id && purchase.razorpay_order_id !== razorpayOrderId) {
      return json({ error: "Razorpay order id does not match this order." }, 400);
    }

    // already settled -> return as-is (idempotent)
    if (purchase.status === "success") return json(purchase);

    const valid = await verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!valid) {
      const { data: failed } = await db
        .from("purchases")
        .update({ status: "failed", failure_reason: "Signature verification failed." })
        .eq("id", orderId)
        .select(PURCHASE_SELECT)
        .single();
      return json({ error: "Payment signature verification failed.", order: failed }, 400);
    }

    // mark paid
    const { data: updated, error: updateError } = await db
      .from("purchases")
      .update({
        status: "success",
        razorpay_payment_id: razorpayPaymentId,
        failure_reason: null,
      })
      .eq("id", orderId)
      .select(PURCHASE_SELECT)
      .single();
    if (updateError) throw updateError;

    // dependent side effects
    await db.rpc("increment_project_sales_count", { p_project_id: updated.project_id });
    await db.from("wallet_transactions").insert({
      user_id: user.id,
      type: "debit",
      category: "project_purchase",
      amount: updated.total_amount,
      description: `Purchased "${updated.project?.title ?? "project"}"`,
    });

    return json(updated);
  } catch (err) {
    console.error("verify-razorpay-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

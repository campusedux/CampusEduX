// POST verify-wallet-topup-payment
//
// Called by src/services/wallet.service.ts -> verifyTopUp(params)
//
// Request  body : {
//   orderId: string,            // wallet_topup_orders.id
//   razorpayOrderId: string,
//   razorpayPaymentId: string,
//   razorpaySignature: string
// }
// Response body : { ok: true, amount: number }   // client ignores the body
//
// Real HMAC-SHA256 verification. Only a passing check flips the top-up order to
// "paid" and writes the settled credit into wallet_transactions (which is what
// the wallet balance is computed from). Idempotent — a repeat call does not
// double-credit.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { razorpayConfigured, verifyRazorpaySignature } from "../_shared/razorpay.ts";

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

    const { data: order, error: fetchError } = await db
      .from("wallet_topup_orders")
      .select("id, user_id, amount, status, razorpay_order_id")
      .eq("id", orderId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!order) return json({ error: "Top-up order not found." }, 404);
    if (order.user_id !== user.id) return json({ error: "This order is not yours." }, 403);
    if (order.razorpay_order_id && order.razorpay_order_id !== razorpayOrderId) {
      return json({ error: "Razorpay order id does not match this order." }, 400);
    }

    if (order.status === "paid") return json({ ok: true, amount: Number(order.amount) });

    const valid = await verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) {
      await db.from("wallet_topup_orders").update({ status: "failed" }).eq("id", order.id).neq("status", "paid");
      return json({ error: "Payment signature verification failed." }, 400);
    }

    // Atomic conditional update: only the caller that actually flips
    // status away from "paid" gets a row back and credits the wallet.
    // The Razorpay webhook can race this same order to "paid" (see
    // razorpay-webhook/index.ts) — Postgres row-level locking on this
    // UPDATE serializes the two, so exactly one of them ever inserts the
    // wallet_transactions credit below.
    const { data: updatedOrder, error: updateError } = await db
      .from("wallet_topup_orders")
      .update({ status: "paid", razorpay_payment_id: razorpayPaymentId })
      .eq("id", order.id)
      .neq("status", "paid")
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;

    if (updatedOrder) {
      const { error: creditError } = await db.from("wallet_transactions").insert({
        user_id: user.id,
        type: "credit",
        category: "added_money",
        amount: Number(order.amount),
        description: "Added Money",
      });
      if (creditError) throw creditError;
    }

    return json({ ok: true, amount: Number(order.amount) });
  } catch (err) {
    console.error("verify-wallet-topup-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

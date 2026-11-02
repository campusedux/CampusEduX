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
// HMAC-SHA256 and authoritative capture verification precede a single database
// transaction committing the paid order and its unique wallet credit. A retry
// succeeds only when the matching financial credit exists.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { nonEmptyString, orderBindingMatches, paymentIsAvailable } from "../_shared/paymentBinding.ts";
import { PaymentVerificationError, paymentAmountPaise, razorpayConfigured, verifyCapturedRazorpayPayment, verifyRazorpaySignature } from "../_shared/razorpay.ts";
import { settleWalletTopup } from "../_shared/walletSettlement.ts";

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

    const { data: order, error: fetchError } = await db
      .from("wallet_topup_orders")
      .select("id, user_id, amount, currency, status, razorpay_order_id, razorpay_payment_id")
      .eq("id", orderId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!order) return json({ error: "Top-up order not found." }, 404);
    if (order.user_id !== user.id) return json({ error: "This order is not yours." }, 403);
    if (!orderBindingMatches(order.razorpay_order_id, razorpayOrderId)) {
      return json({ error: "Razorpay order id does not match this order." }, 400);
    }

    const valid = await verifyRazorpaySignature(order.razorpay_order_id, razorpayPaymentId, razorpaySignature);
    if (!valid) {
      if (order.status === "paid") return json({ error: "Payment signature verification failed." }, 400);
      await db.from("wallet_topup_orders").update({ status: "failed" }).eq("id", order.id).eq("razorpay_order_id", order.razorpay_order_id).neq("status", "paid");
      return json({ error: "Payment signature verification failed." }, 400);
    }

    if (order.status === "paid" && order.razorpay_payment_id !== razorpayPaymentId) {
      return json({ error: "Payment id does not match the settled order." }, 400);
    }
    if (!await paymentIsAvailable(db, razorpayPaymentId, order.razorpay_order_id, { type: "wallet", id: order.id })) {
      return json({ error: "Payment id is already bound to another order." }, 400);
    }

    await verifyCapturedRazorpayPayment({
      paymentId: razorpayPaymentId,
      orderId: order.razorpay_order_id,
      amountPaise: paymentAmountPaise(order.amount),
      currency: order.currency,
    });

    const settlement = await settleWalletTopup(db, order, razorpayPaymentId);
    return json({ ok: true, amount: settlement.amount });
  } catch (err) {
    console.error("verify-wallet-topup-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, err instanceof PaymentVerificationError ? err.status : 500);
  }
});

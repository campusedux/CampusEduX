// POST create-wallet-topup-order
//
// Called by src/services/wallet.service.ts -> createTopUpOrder(amount)
//
// Request  body : { amount: number }   // rupees
// Response body : {
//   orderId: string,          // wallet_topup_orders.id (status "created")
//   razorpayOrderId: string,
//   razorpayKeyId: string,
//   amount: number,           // paise (what RazorpayCheckout.open expects)
//   currency: string          // "INR"
// }
//
// No wallet_transactions row is created here on purpose — the client sums every
// transaction row it receives, so an unpaid top-up must not appear until
// verify-wallet-topup-payment has checked the signature.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";
import {
  createRazorpayOrder,
  razorpayConfigured,
  razorpayKeyId,
} from "../_shared/razorpay.ts";

const MIN_TOPUP_RUPEES = 10;
const MAX_TOPUP_RUPEES = 100_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) return json({ error: "Payments are not configured." }, 503);

    const db = adminClient();

    try {
      await enforceRateLimit(db, user.id, "create-wallet-topup-order", { limit: 8, windowSeconds: 60 });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return json({ error: e.message, retryAfterSeconds: e.retryAfterSeconds }, 429);
      }
      throw e;
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < MIN_TOPUP_RUPEES || amount > MAX_TOPUP_RUPEES) {
      return json({ error: `amount must be between ₹${MIN_TOPUP_RUPEES} and ₹${MAX_TOPUP_RUPEES}.` }, 400);
    }
    const rupees = Math.round(amount * 100) / 100;
    const amountPaise = Math.round(rupees * 100);

    const { data: order, error: insertError } = await db
      .from("wallet_topup_orders")
      .insert({ user_id: user.id, amount: rupees, currency: "INR", status: "created" })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt: order.id,
      notes: { topup_order_id: order.id, user_id: user.id },
    });

    const { error: linkError } = await db
      .from("wallet_topup_orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", order.id)
      .is("razorpay_order_id", null)
      .select("id")
      .single();
    if (linkError) throw linkError;

    return json({
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId,
      amount: amountPaise,
      currency: "INR",
    });
  } catch (err) {
    console.error("create-wallet-topup-order:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

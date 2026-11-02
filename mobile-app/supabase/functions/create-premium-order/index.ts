// POST create-premium-order
//
// Called by src/services/premium.service.ts -> createOrder(planId, billingCycle)
//
// Request  body : { planId: string, billingCycle: "monthly" | "yearly" }
// Response body : {
//   orderId: string,           // premium_subscriptions.id (status "pending")
//   razorpayOrderId: string,
//   razorpayKeyId: string,
//   amount: number,            // paise
//   currency: string,          // "INR"
//   planPrice: number,         // rupees (before GST)
//   gst: number,               // rupees (18%)
//   totalAmount: number,       // rupees (planPrice + gst)
//   planName: string,
//   billingCycle: "monthly" | "yearly"
// }

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";
import {
  createRazorpayOrder,
  razorpayConfigured,
  razorpayKeyId,
} from "../_shared/razorpay.ts";

const GST_RATE = 0.18;
const round2 = (n: number) => Math.round(n * 100) / 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) return json({ error: "Payments are not configured." }, 503);

    const db = adminClient();

    try {
      await enforceRateLimit(db, user.id, "create-premium-order", { limit: 8, windowSeconds: 60 });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return json({ error: e.message, retryAfterSeconds: e.retryAfterSeconds }, 429);
      }
      throw e;
    }

    const { planId, billingCycle } = await req.json().catch(() => ({}));
    if (!planId || (billingCycle !== "monthly" && billingCycle !== "yearly")) {
      return json({ error: "planId and billingCycle ('monthly'|'yearly') are required." }, 400);
    }

    const { data: plan, error: planError } = await db
      .from("premium_plans")
      .select("id, name, monthly_price, yearly_price")
      .eq("id", planId)
      .maybeSingle();
    if (planError) throw planError;
    if (!plan) return json({ error: "Plan not found." }, 404);

    const planPrice = Number(billingCycle === "yearly" ? plan.yearly_price : plan.monthly_price) || 0;
    const gst = round2(planPrice * GST_RATE);
    const totalAmount = round2(planPrice + gst);
    const amountPaise = Math.round(totalAmount * 100);

    const { data: sub, error: insertError } = await db
      .from("premium_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: "pending",
        billing_cycle: billingCycle,
        price: planPrice,
        payment_method: "Razorpay",
        auto_renew: true,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt: sub.id,
      notes: { subscription_id: sub.id, user_id: user.id, plan_id: plan.id, billing_cycle: billingCycle },
    });

    const { error: linkError } = await db
      .from("premium_subscriptions")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", sub.id)
      .is("razorpay_order_id", null)
      .select("id")
      .single();
    if (linkError) throw linkError;

    return json({
      orderId: sub.id,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId,
      amount: amountPaise,
      currency: "INR",
      planPrice,
      gst,
      totalAmount,
      planName: plan.name,
      billingCycle,
    });
  } catch (err) {
    console.error("create-premium-order:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

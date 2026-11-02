// POST create-razorpay-order
//
// Called by src/services/payment.service.ts -> createOrder(projectId, couponCode)
//
// Request  body : { projectId: string, couponCode?: string }
// Response body : {
//   orderId: string,          // our purchases.id (status "pending")
//   razorpayOrderId: string,
//   razorpayKeyId: string,     // public key id, safe on the client
//   amount: number,            // in paise, what Razorpay Checkout expects
//   currency: string,          // "INR"
//   price: number,             // rupees
//   platformFee: number,       // rupees
//   discount: number,          // rupees
//   totalAmount: number        // rupees  (price + platformFee - discount)
// }
//
// The Razorpay key secret never touches the client: the order is created here
// and only the key *id* is returned.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";
import {
  createRazorpayOrder,
  razorpayConfigured,
  razorpayKeyId,
} from "../_shared/razorpay.ts";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** "Flat 40% OFF" / "40%" / "40" -> 40 */
function percentFromLabel(label: string | null | undefined): number {
  const match = String(label ?? "").match(/(\d+(?:\.\d+)?)\s*%?/);
  const pct = match ? Number(match[1]) : 0;
  return pct > 0 && pct <= 90 ? pct : 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);

    if (!razorpayConfigured()) {
      return json(
        { error: "Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
        503,
      );
    }

    const db = adminClient();

    try {
      await enforceRateLimit(db, user.id, "create-razorpay-order", { limit: 8, windowSeconds: 60 });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return json({ error: e.message, retryAfterSeconds: e.retryAfterSeconds }, 429);
      }
      throw e;
    }

    const { projectId, couponCode } = await req.json().catch(() => ({}));
    if (!projectId || typeof projectId !== "string") {
      return json({ error: "projectId is required." }, 400);
    }

    const { data: project, error: projectError } = await db
      .from("projects")
      .select("id, title, price, platform_fee_percent")
      .eq("id", projectId)
      .maybeSingle();
    if (projectError) throw projectError;
    if (!project) return json({ error: "Project not found." }, 404);

    // Block a duplicate purchase of something already owned.
    const { data: owned } = await db
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .eq("status", "success")
      .maybeSingle();
    if (owned) return json({ error: "You already own this project." }, 409);

    const price = Number(project.price) || 0;
    const platformFee = round2((price * (Number(project.platform_fee_percent) || 0)) / 100);

    let discount = 0;
    const coupon = String(couponCode ?? "").trim().toUpperCase();
    if (coupon) {
      const { data: offer } = await db
        .from("offer_banners")
        .select("discount_label")
        .eq("coupon_code", coupon)
        .eq("is_active", true)
        .maybeSingle();
      if (offer) discount = round2((price * percentFromLabel(offer.discount_label)) / 100);
    }

    const totalAmount = Math.max(0, round2(price + platformFee - discount));
    const amountPaise = Math.round(totalAmount * 100);

    // 1. our pending order row
    const { data: purchase, error: insertError } = await db
      .from("purchases")
      .insert({
        user_id: user.id,
        project_id: projectId,
        status: "pending",
        price,
        platform_fee: platformFee,
        discount,
        total_amount: totalAmount,
        coupon_code: coupon || null,
      })
      .select("id, created_at")
      .single();
    if (insertError) throw insertError;

    // 2. the matching Razorpay order
    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt: purchase.id,
      notes: { purchase_id: purchase.id, user_id: user.id, project_id: projectId },
    });

    // 3. link them
    const { error: linkError } = await db
      .from("purchases")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", purchase.id)
      .is("razorpay_order_id", null)
      .select("id")
      .single();
    if (linkError) throw linkError;

    return json({
      orderId: purchase.id,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId,
      amount: amountPaise,
      currency: "INR",
      price,
      platformFee,
      discount,
      totalAmount,
    });
  } catch (err) {
    console.error("create-razorpay-order:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

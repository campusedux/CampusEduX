// POST create-custom-project-balance-order
//
// Called by website's CustomProjectBalanceButton and mobile's
// useCustomProjectBalance -> customProjectsService.createBalanceOrder(requestId)
//
// Request body : { requestId: string }
// Response body :
//   {
//     paymentId: string,          // custom_project_payments.id (kind "balance", status "created")
//     razorpayOrderId: string,
//     razorpayKeyId: string,
//     amount: number,             // paise — the remaining balance, recomputed server-side
//     currency: "INR",
//     remaining: number           // rupees, informational
//   }
//
// SECURITY (Bug 3): the remaining balance is ALWAYS
//   coalesce(final_price, estimated_total) - amount_paid
// computed here from the DB. The client never sends, and this function never
// trusts, an amount. Refuses when the token isn't paid yet, the request is
// cancelled, the balance is already 0, or a balance checkout is already open
// (migration 0124's admin RPC guard mirrors that same "open checkout" window).

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { enforceRateLimit, RateLimitError } from "../_shared/rateLimit.ts";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "../_shared/razorpay.ts";

const round2 = (n: number) => Math.round(n * 100) / 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) {
      return json({ error: "Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." }, 503);
    }

    const db = adminClient();

    try {
      await enforceRateLimit(db, user.id, "create-custom-project-balance-order", { limit: 8, windowSeconds: 60 });
    } catch (e) {
      if (e instanceof RateLimitError) {
        return json({ error: e.message, retryAfterSeconds: e.retryAfterSeconds }, 429);
      }
      throw e;
    }

    const { requestId } = await req.json().catch(() => ({}));
    if (!requestId || typeof requestId !== "string") {
      return json({ error: "requestId is required." }, 400);
    }

    const { data: request, error: reqError } = await db
      .from("custom_project_requests")
      .select("id, user_id, request_code, title, project_type, estimated_total, final_price, amount_paid, token_payment_status, status")
      .eq("id", requestId)
      .maybeSingle();
    if (reqError) throw reqError;
    if (!request || request.user_id !== user.id) return json({ error: "Request not found." }, 404);
    if (request.token_payment_status !== "paid") return json({ error: "The token has not been paid yet." }, 400);
    if (request.status === "cancelled") return json({ error: "This request was cancelled." }, 400);

    // Block a second concurrent balance checkout for the same request (mirrors the admin
    // final-price RPC's "checkout open" guard — one attempt at a time, no double orders).
    const { data: open } = await db
      .from("custom_project_payments")
      .select("id")
      .eq("request_id", requestId)
      .eq("kind", "balance")
      .eq("status", "created")
      .gt("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .maybeSingle();
    if (open) return json({ error: "A payment for this request is already in progress. Please wait a few minutes." }, 409);

    const total = request.final_price != null ? Number(request.final_price) : Number(request.estimated_total) || 0;
    const remaining = round2(total - (Number(request.amount_paid) || 0));
    if (remaining <= 0) return json({ error: "There is nothing left to pay on this request." }, 400);

    const amountPaise = Math.round(remaining * 100);

    const rzpOrder = await createRazorpayOrder({
      amountPaise,
      currency: "INR",
      receipt: `${request.id}-bal-${Date.now()}`,
      notes: {
        request_id: request.id,
        request_code: request.request_code,
        user_id: user.id,
        kind: "balance",
      },
    });

    const { data: payment, error: payError } = await db
      .from("custom_project_payments")
      .insert({
        request_id: request.id,
        user_id: user.id,
        project_type: request.project_type,
        amount: remaining,
        currency: "INR",
        status: "created",
        kind: "balance",
        razorpay_order_id: rzpOrder.id,
      })
      .select("id")
      .single();
    if (payError) throw payError;

    return json({
      paymentId: payment.id,
      razorpayOrderId: rzpOrder.id,
      razorpayKeyId,
      amount: amountPaise,
      currency: "INR",
      remaining,
    });
  } catch (err) {
    console.error("create-custom-project-balance-order:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

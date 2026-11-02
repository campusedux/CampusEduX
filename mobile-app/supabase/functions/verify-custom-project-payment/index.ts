// POST verify-custom-project-payment
//
// Called by src/services/customProjects.service.ts -> verifyPayment(payload)
//
// Request body :
//   {
//     requestId: string,            // custom_project_requests.id
//     razorpayOrderId: string,
//     razorpayPaymentId: string,
//     razorpaySignature: string
//   }
// Response body : a custom_project_requests row shaped for the client mapper
//   { id, request_code, user_id, title, project_type, project_level, platform,
//     base_price, platform_charge, feature_total, estimated_total, token_amount,
//     token_payment_status, payment_id, payment_order_id, status, created_at }
//
// Real HMAC-SHA256 verification of `${razorpayOrderId}|${razorpayPaymentId}` with
// RAZORPAY_KEY_SECRET (spec §13 / §14). A client-reported "success" is never
// trusted. A failed check marks the token failed and creates NO paid request
// (§39). A passing check plus authoritative capture verification flips the token to "paid", writes a history
// row + student notifications + an admin-inbox row (§32). Idempotent — a repeat
// call on an already-paid request just returns the row.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { nonEmptyString, orderBindingMatches, paymentIsAvailable } from "../_shared/paymentBinding.ts";
import { PaymentVerificationError, paymentAmountPaise, razorpayConfigured, verifyCapturedRazorpayPayment, verifyRazorpaySignature } from "../_shared/razorpay.ts";

const CPR_SELECT =
  "id, request_code, user_id, title, project_type, project_level, platform, base_price, platform_charge, feature_total, estimated_total, token_amount, token_payment_status, payment_id, payment_order_id, status, created_at";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) return json({ error: "Payments are not configured." }, 503);

    const { requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req
      .json()
      .catch(() => ({})) ?? {};
    if (![requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature].every(nonEmptyString)) {
      return json(
        { error: "requestId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required." },
        400,
      );
    }

    const db = adminClient();

    const { data: request, error: fetchError } = await db
      .from("custom_project_requests")
      .select(CPR_SELECT)
      .eq("id", requestId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!request) return json({ error: "Request not found." }, 404);

    // ownership + order-id binding
    if (request.user_id !== user.id) return json({ error: "This request is not yours." }, 403);
    if (!orderBindingMatches(request.payment_order_id, razorpayOrderId)) {
      return json({ error: "Razorpay order id does not match this request." }, 400);
    }

    const { data: tokenPayment, error: tokenError } = await db
      .from("custom_project_payments")
      .select("id, razorpay_payment_id, status, amount, currency")
      .eq("request_id", request.id)
      .eq("user_id", user.id)
      .eq("kind", "token")
      .eq("razorpay_order_id", request.payment_order_id)
      .maybeSingle();
    if (tokenError) throw tokenError;
    if (!tokenPayment) return json({ error: "Token payment order is not bound to this request." }, 400);
    if (tokenPayment.status === "paid" && tokenPayment.razorpay_payment_id !== razorpayPaymentId) {
      return json({ error: "Payment id does not match the settled order." }, 400);
    }

    const valid = await verifyRazorpaySignature(request.payment_order_id, razorpayPaymentId, razorpaySignature);

    if (!valid) {
      if (request.token_payment_status === "paid") return json({ error: "Payment signature verification failed." }, 400);
      const { data: failed } = await db
        .from("custom_project_requests")
        .update({ token_payment_status: "failed" })
        .eq("id", requestId).eq("payment_order_id", request.payment_order_id)
        .neq("token_payment_status", "paid")
        .select(CPR_SELECT)
        .single();
      await db
        .from("custom_project_payments")
        .update({ status: "failed" })
        .eq("request_id", requestId).eq("kind", "token").eq("razorpay_order_id", request.payment_order_id)
        .in("status", ["created", "failed"]);
      return json({ error: "Payment signature verification failed.", request: failed }, 400);
    }

    if (request.token_payment_status === "paid" && request.payment_id !== razorpayPaymentId) {
      return json({ error: "Payment id does not match the settled order." }, 400);
    }
    if (!await paymentIsAvailable(db, razorpayPaymentId, request.payment_order_id, { type: "token", id: request.id })) {
      return json({ error: "Payment id is already bound to another order." }, 400);
    }

    // The token request and its ledger must describe the same INR charge.
    if (paymentAmountPaise(tokenPayment.amount) !== paymentAmountPaise(request.token_amount) || tokenPayment.currency !== "INR") {
      throw new PaymentVerificationError("Token payment amount or currency does not match this request.");
    }

    await verifyCapturedRazorpayPayment({
      paymentId: razorpayPaymentId,
      orderId: request.payment_order_id,
      amountPaise: paymentAmountPaise(request.token_amount),
      currency: tokenPayment.currency,
    });

    // Migration 0128 settles the request, amount_paid, history and notifications
    // in the payment UPDATE transaction. Never pre-commit the request separately.
    const { error: paymentError } = await db
      .from("custom_project_payments")
      .update({ status: "paid", razorpay_payment_id: razorpayPaymentId })
      .eq("id", tokenPayment.id)
      .eq("user_id", user.id)
      .eq("amount", tokenPayment.amount).eq("currency", tokenPayment.currency)
      .eq("request_id", requestId).eq("kind", "token").eq("razorpay_order_id", request.payment_order_id)
      .in("status", ["created", "failed"])
      .select("id")
      .maybeSingle();
    if (paymentError) throw paymentError;

    // Also confirm retries and a competing webhook's committed result. This
    // repairs a legacy request-first partial write when its ledger is still open.
    const { data: settledPayment, error: settledError } = await db
      .from("custom_project_payments")
      .select("status, razorpay_payment_id")
      .eq("id", tokenPayment.id)
      .eq("razorpay_order_id", request.payment_order_id)
      .single();
    if (settledError) throw settledError;
    const { data: updated, error: reReadError } = await db
      .from("custom_project_requests")
      .select(CPR_SELECT)
      .eq("id", requestId)
      .eq("user_id", user.id)
      .eq("payment_order_id", request.payment_order_id)
      .single();
    if (reReadError) throw reReadError;
    if (settledPayment?.status !== "paid" || settledPayment.razorpay_payment_id !== razorpayPaymentId ||
      updated?.token_payment_status !== "paid" || updated.payment_id !== razorpayPaymentId) {
      throw new Error("Token settlement could not be confirmed. Please retry.");
    }

    return json(updated);
  } catch (err) {
    console.error("verify-custom-project-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, err instanceof PaymentVerificationError ? err.status : 500);
  }
});

// POST verify-custom-project-balance-payment
//
// Called by src/services/customProjects.service.ts -> verifyBalancePayment(payload)
//
// Request body :
//   {
//     paymentId: string,            // custom_project_payments.id returned by create-custom-project-balance-order
//     razorpayOrderId: string,
//     razorpayPaymentId: string,
//     razorpaySignature: string
//   }
// Response body : the updated custom_project_requests row (same shape as verify-custom-project-payment)
//
// SECURITY: HMAC-SHA256 plus authoritative capture verification, like verify-custom-project-payment. This function
// never decides the amount or applies it directly — it only flips custom_project_payments.status to
// 'paid' (or 'failed'), and migration 0124's custom_project_apply_balance_payment trigger is the ONLY
// place that credits amount_paid, atomically and only once, refusing anything that overshoots the
// remaining balance (-> 'refund_due' instead). Idempotent: an already-settled row just returns the
// current request. The Razorpay webhook (razorpay-webhook/index.ts) can also settle this same ledger
// row for a payment that completes without the browser returning to this call; both paths hit the
// same trigger, so a race between them can't double-credit.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { nonEmptyString, orderBindingMatches, paymentIsAvailable } from "../_shared/paymentBinding.ts";
import { PaymentVerificationError, paymentAmountPaise, razorpayConfigured, verifyCapturedRazorpayPayment, verifyRazorpaySignature } from "../_shared/razorpay.ts";

const CPR_SELECT =
  "id, request_code, user_id, title, project_type, project_level, platform, " +
  "base_price, platform_charge, feature_total, estimated_total, final_price, amount_paid, " +
  "token_amount, token_payment_status, payment_id, payment_order_id, status, created_at";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) return json({ error: "Payments are not configured." }, 503);

    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req
      .json()
      .catch(() => ({})) ?? {};
    if (![paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature].every(nonEmptyString)) {
      return json(
        { error: "paymentId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required." },
        400,
      );
    }

    const db = adminClient();

    const { data: payment, error: payFetchError } = await db
      .from("custom_project_payments")
      .select("id, request_id, user_id, kind, status, amount, currency, razorpay_order_id, razorpay_payment_id")
      .eq("id", paymentId)
      .maybeSingle();
    if (payFetchError) throw payFetchError;
    if (!payment || payment.kind !== "balance") return json({ error: "Payment not found." }, 404);
    if (payment.user_id !== user.id) return json({ error: "This payment is not yours." }, 403);
    if (!orderBindingMatches(payment.razorpay_order_id, razorpayOrderId)) {
      return json({ error: "Razorpay order id does not match this payment." }, 400);
    }

    const { data: request, error: reqFetchError } = await db
      .from("custom_project_requests")
      .select(CPR_SELECT)
      .eq("id", payment.request_id)
      .maybeSingle();
    if (reqFetchError) throw reqFetchError;
    if (!request) return json({ error: "Request not found." }, 404);

    const valid = await verifyRazorpaySignature(payment.razorpay_order_id, razorpayPaymentId, razorpaySignature);

    if (!valid) {
      if (payment.status === "paid" || payment.status === "refund_due") return json({ error: "Payment signature verification failed." }, 400);
      await db.from("custom_project_payments").update({ status: "failed" }).eq("id", paymentId).eq("razorpay_order_id", payment.razorpay_order_id).eq("status", "created");
      return json({ error: "Payment signature verification failed.", request }, 400);
    }
    if ((payment.status === "paid" || payment.status === "refund_due") && payment.razorpay_payment_id !== razorpayPaymentId) {
      return json({ error: "Payment id does not match the settled order." }, 400);
    }
    if (!await paymentIsAvailable(db, razorpayPaymentId, payment.razorpay_order_id, { type: "balance", id: payment.id })) {
      return json({ error: "Payment id is already bound to another order." }, 400);
    }

    await verifyCapturedRazorpayPayment({
      paymentId: razorpayPaymentId,
      orderId: payment.razorpay_order_id,
      amountPaise: paymentAmountPaise(payment.amount),
      currency: payment.currency,
    });

    if (payment.status === "refund_due") return json({
      error: "Your payment was verified, but it no longer matches the remaining balance. Support has been notified for a refund.",
      request,
    }, 409);
    if (payment.status === "paid") return json(request);

    // A 'failed' row is still settled here: Razorpay lets the customer retry inside the same order, and the
    // webhook's payment.failed for the first attempt must not swallow the successful retry that this
    // (signature-verified) call proves.

    // The trigger (custom_project_apply_balance_payment) does the crediting; this call only settles
    // the ledger row. Re-read the request afterwards so the response reflects the real amount_paid.
    const { error: settleError } = await db
      .from("custom_project_payments")
      .update({ status: "paid", razorpay_payment_id: razorpayPaymentId })
      .eq("id", paymentId)
      .eq("razorpay_order_id", payment.razorpay_order_id)
      .eq("user_id", user.id)
      .eq("amount", payment.amount)
      .eq("currency", payment.currency)
      .in("status", ["created", "failed"])
      .select("id")
      .single();
    if (settleError) throw settleError;

    const { data: updated, error: reReadError } = await db
      .from("custom_project_requests")
      .select(CPR_SELECT)
      .eq("id", payment.request_id)
      .single();
    if (reReadError) throw reReadError;

    // custom_project_apply_balance_payment (migration 0124) already did every side effect of
    // settling this row — crediting amount_paid, the history row, the user notification, and (on
    // the "doesn't fit" branch) the ONE admin-inbox row — atomically inside the UPDATE above, so
    // this function must not duplicate any of them. It only re-reads the outcome to answer the caller.
    const { data: settledPayment, error: settledReadError } = await db
      .from("custom_project_payments")
      .select("status, amount")
      .eq("id", paymentId)
      .eq("razorpay_order_id", payment.razorpay_order_id)
      .eq("user_id", user.id)
      .single();
    if (settledReadError) throw settledReadError;
    if (!settledPayment || !["paid", "refund_due"].includes(settledPayment.status)) {
      throw new Error("Balance settlement could not be confirmed. Please retry.");
    }

    if (settledPayment?.status === "refund_due") {
      return json({
        error: "Your payment was verified, but it no longer matches the remaining balance. Support has been notified for a refund.",
        request: updated,
      }, 409);
    }

    return json(updated);
  } catch (err) {
    console.error("verify-custom-project-balance-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, err instanceof PaymentVerificationError ? err.status : 500);
  }
});

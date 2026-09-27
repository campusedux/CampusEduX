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
// SECURITY: real HMAC-SHA256 verification, exactly like verify-custom-project-payment. This function
// never decides the amount or applies it directly — it only flips custom_project_payments.status to
// 'paid' (or 'failed'), and migration 0124's custom_project_apply_balance_payment trigger is the ONLY
// place that credits amount_paid, atomically and only once, refusing anything that overshoots the
// remaining balance (-> 'refund_due' instead). Idempotent: an already-settled row just returns the
// current request. The Razorpay webhook (razorpay-webhook/index.ts) can also settle this same ledger
// row for a payment that completes without the browser returning to this call; both paths hit the
// same trigger, so a race between them can't double-credit.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { verifyRazorpaySignature } from "../_shared/razorpay.ts";

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

    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req
      .json()
      .catch(() => ({}));
    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return json(
        { error: "paymentId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required." },
        400,
      );
    }

    const db = adminClient();

    const { data: payment, error: payFetchError } = await db
      .from("custom_project_payments")
      .select("id, request_id, user_id, kind, status, razorpay_order_id")
      .eq("id", paymentId)
      .maybeSingle();
    if (payFetchError) throw payFetchError;
    if (!payment || payment.kind !== "balance") return json({ error: "Payment not found." }, 404);
    if (payment.user_id !== user.id) return json({ error: "This payment is not yours." }, 403);
    if (payment.razorpay_order_id !== razorpayOrderId) {
      return json({ error: "Razorpay order id does not match this payment." }, 400);
    }

    const { data: request, error: reqFetchError } = await db
      .from("custom_project_requests")
      .select(CPR_SELECT)
      .eq("id", payment.request_id)
      .maybeSingle();
    if (reqFetchError) throw reqFetchError;
    if (!request) return json({ error: "Request not found." }, 404);

    // already settled (success or the manual-refund path) -> idempotent
    if (payment.status !== "created") return json(request);

    const valid = await verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!valid) {
      await db.from("custom_project_payments").update({ status: "failed" }).eq("id", paymentId);
      return json({ error: "Payment signature verification failed.", request }, 400);
    }

    // The trigger (custom_project_apply_balance_payment) does the crediting; this call only settles
    // the ledger row. Re-read the request afterwards so the response reflects the real amount_paid.
    const { error: settleError } = await db
      .from("custom_project_payments")
      .update({ status: "paid", razorpay_payment_id: razorpayPaymentId })
      .eq("id", paymentId);
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
    const { data: settledPayment } = await db
      .from("custom_project_payments")
      .select("status, amount")
      .eq("id", paymentId)
      .single();

    if (settledPayment?.status === "refund_due") {
      return json({
        error: "Your payment was verified, but it no longer matches the remaining balance. Support has been notified for a refund.",
        request: updated,
      }, 409);
    }

    return json(updated);
  } catch (err) {
    console.error("verify-custom-project-balance-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

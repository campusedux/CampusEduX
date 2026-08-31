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
// (§39). A passing check flips token_payment_status to "paid", writes a history
// row + student notifications + an admin-inbox row (§32). Idempotent — a repeat
// call on an already-paid request just returns the row.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/client.ts";
import { razorpayConfigured, verifyRazorpaySignature } from "../_shared/razorpay.ts";

const CPR_SELECT =
  "id, request_code, user_id, title, project_type, project_level, platform, " +
  "base_price, platform_charge, feature_total, estimated_total, token_amount, " +
  "token_payment_status, payment_id, payment_order_id, status, created_at";

const inr = (n: unknown) => `₹${Number(n) || 0}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: "Not authenticated." }, 401);
    if (!razorpayConfigured()) return json({ error: "Payments are not configured." }, 503);

    const { requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req
      .json()
      .catch(() => ({}));
    if (!requestId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
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
    if (request.payment_order_id && request.payment_order_id !== razorpayOrderId) {
      return json({ error: "Razorpay order id does not match this request." }, 400);
    }

    // already settled -> return as-is (idempotent)
    if (request.token_payment_status === "paid") return json(request);

    const valid = await verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!valid) {
      const { data: failed } = await db
        .from("custom_project_requests")
        .update({ token_payment_status: "failed" })
        .eq("id", requestId)
        .select(CPR_SELECT)
        .single();
      await db
        .from("custom_project_payments")
        .update({ status: "failed" })
        .eq("razorpay_order_id", razorpayOrderId);
      return json({ error: "Payment signature verification failed.", request: failed }, 400);
    }

    // mark the token paid — the request is now a real, admin-visible request
    const { data: updated, error: updateError } = await db
      .from("custom_project_requests")
      .update({ token_payment_status: "paid", payment_id: razorpayPaymentId })
      .eq("id", requestId)
      .select(CPR_SELECT)
      .single();
    if (updateError) throw updateError;

    await db
      .from("custom_project_payments")
      .update({ status: "paid", razorpay_payment_id: razorpayPaymentId })
      .eq("razorpay_order_id", razorpayOrderId);

    // history + notifications — best effort, never fail the verified payment
    await db.from("custom_project_request_history").insert({
      request_id: requestId,
      old_status: null,
      new_status: "new",
      changed_by: user.id,
      changed_by_role: "system",
      note: "Token paid",
    });

    await db.from("notifications").insert([
      {
        user_id: user.id,
        title: "Token payment successful",
        body: `${inr(updated.token_amount)} token paid for "${updated.title}".`,
        category: "updates",
      },
      {
        user_id: user.id,
        title: "Request created",
        body: `Your custom project request ${updated.request_code} has been created.`,
        category: "updates",
      },
    ]);

    await db.from("custom_project_admin_inbox").insert({
      request_id: requestId,
      title: "New Paid Custom Project Request",
      body:
        `${updated.request_code} · ${updated.project_type}/${updated.project_level} · ` +
        `Est ${inr(updated.estimated_total)} · Token ${inr(updated.token_amount)}`,
    });

    return json(updated);
  } catch (err) {
    console.error("verify-custom-project-payment:", err);
    return json({ error: (err as Error).message ?? "Unexpected error." }, 500);
  }
});

// supabase/functions/razorpay-webhook/index.ts
//
// Razorpay -> Supabase webhook
//
// Purpose:
// - Verify Razorpay webhook signature using RAZORPAY_WEBHOOK_SECRET
// - Reconcile payment status in Supabase
// - Keep the webhook idempotent
// - Never trust client-side payment data
//
// IMPORTANT:
// RAZORPAY_WEBHOOK_SECRET is different from RAZORPAY_KEY_SECRET.

import { json, preflight } from "../_shared/cors.ts";
import { adminClient } from "../_shared/client.ts";
import { nonEmptyString, paymentIsAvailable } from "../_shared/paymentBinding.ts";
import { assertCapturedRazorpayPayment, paymentAmountPaise, PaymentVerificationError, premiumPaymentAmountPaise } from "../_shared/razorpay.ts";
import { settleWalletTopup } from "../_shared/walletSettlement.ts";
import { settleProjectPurchase } from "../_shared/purchaseSettlement.ts";
import { activatePremiumSubscription } from "../_shared/premiumActivation.ts";

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";

function hexFromBytes(bytes: Uint8Array): string {
  return [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;

  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Razorpay webhook signature:
 *
 * HMAC-SHA256(raw request body, RAZORPAY_WEBHOOK_SECRET)
 *
 * IMPORTANT:
 * The raw body must be used.
 * Do not JSON.stringify(parsedBody) for signature verification.
 */
async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  if (!WEBHOOK_SECRET || !signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WEBHOOK_SECRET),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );

  const expected = hexFromBytes(new Uint8Array(signatureBytes));

  return timingSafeEqual(
    expected,
    signature.trim().toLowerCase(),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflight();
  }

  if (req.method !== "POST") {
    return json(
      { error: "Method not allowed" },
      405,
    );
  }

  try {
    if (!WEBHOOK_SECRET) {
      console.error(
        "RAZORPAY_WEBHOOK_SECRET is not configured.",
      );

      return json(
        { error: "Webhook is not configured." },
        503,
      );
    }

    const signature =
      req.headers.get("x-razorpay-signature") ?? "";

    if (!signature) {
      console.warn(
        "Razorpay webhook request missing x-razorpay-signature.",
      );

      return json(
        { error: "Missing webhook signature." },
        400,
      );
    }

    /*
     * IMPORTANT:
     * Read the raw body exactly once.
     */
    const rawBody = await req.text();

    const validSignature = await verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!validSignature) {
      console.warn(
        "Invalid Razorpay webhook signature.",
      );

      return json(
        { error: "Invalid webhook signature." },
        401,
      );
    }

    let payload: {
      event?: unknown;
      payload?: { payment?: { entity?: {
        order_id?: unknown; id?: unknown; status?: unknown;
        entity?: unknown; captured?: unknown; amount?: unknown; currency?: unknown;
        error_description?: string; error_reason?: string;
      } } };
    } | null;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json(
        { error: "Invalid JSON payload." },
        400,
      );
    }

    const event =
      typeof payload?.event === "string"
        ? payload.event
        : "";

    const paymentEntity =
      payload?.payload?.payment?.entity ?? null;

    const orderId =
      paymentEntity?.order_id ?? null;

    const paymentId =
      paymentEntity?.id ?? null;

    const paymentStatus =
      paymentEntity?.status ?? null;

    const webhookEventId =
      req.headers.get("x-razorpay-event-id") ?? null;

    console.log(
      JSON.stringify({
        event,
        orderId,
        paymentId,
        paymentStatus,
        webhookEventId,
      }),
    );

    /*
     * We currently reconcile only payment events.
     *
     * Supported:
     * - payment.captured
     * - payment.failed
     *
     * Other Razorpay events receive 200 so Razorpay does not
     * repeatedly retry events that CampusEduX does not need.
     */
    if (
      event !== "payment.captured" &&
      event !== "payment.failed"
    ) {
      return json({
        received: true,
        handled: false,
        event,
      });
    }

    if (!nonEmptyString(orderId) || !nonEmptyString(paymentId)) {
      console.warn(
        "Webhook payment event does not contain order_id/payment id.",
      );

      return json(
        {
          received: true,
          handled: false,
          reason: "Missing payment order/payment id.",
        },
        200,
      );
    }

    const db = adminClient();

    /*
     * ---------------------------------------------------------
     * 1. purchases
     * ---------------------------------------------------------
     *
     * This is the main project purchase flow.
     *
     * Capture shares the callback's transactional settlement boundary.
     */
    const { data: purchase, error: purchaseFetchError } = await db
      .from("purchases")
      .select(
        "id, user_id, project_id, total_amount, status, razorpay_order_id, razorpay_payment_id, project:projects(title)",
      )
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (purchaseFetchError) throw purchaseFetchError;

    if (purchase) {
      if (event === "payment.captured") {
        assertCapturedRazorpayPayment(paymentEntity, {
          paymentId: purchase.status === "success" ? purchase.razorpay_payment_id : paymentId,
          orderId: purchase.razorpay_order_id,
          amountPaise: paymentAmountPaise(purchase.total_amount),
          currency: "INR",
        });
      }
      if (!await paymentIsAvailable(db, paymentId, orderId, { type: "purchase", id: purchase.id })) {
        return json({ error: "Payment id is already bound to another order." }, 400);
      }
      if (event === "payment.failed") {
        // The database rechecks this predicate after waiting on any concurrent
        // settlement/refund. Delayed failure events cannot revoke entitlements.
        const { data: failed, error } = await db
          .from("purchases")
          .update({
            status: "failed",
            razorpay_payment_id: paymentId,
            failure_reason: paymentEntity?.error_description ?? paymentEntity?.error_reason ?? "Razorpay payment failed.",
          })
          .eq("id", purchase.id)
          .eq("razorpay_order_id", orderId)
          .in("status", ["pending", "failed"])
          .select("status")
          .maybeSingle();
        if (error) throw error;
        if (!failed) {
          const { data: current, error: currentError } = await db.from("purchases")
            .select("status").eq("id", purchase.id).single();
          if (currentError) throw currentError;
          if (current.status === "success") {
            return json({
              received: true, handled: true, alreadySettled: true, orderType: "purchase", orderId,
            });
          }
          return json({
            received: true, handled: true, alreadySettled: false,
            orderType: "purchase", status: current.status, orderId, paymentId,
          });
        }
        return json({
          received: true, handled: true, orderType: "purchase", status: "failed", orderId, paymentId,
        });
      }

      const settlement = await settleProjectPurchase(db, purchase, paymentId);
      if (settlement.alreadySettled) {
        return json({
          received: true, handled: true, alreadySettled: true, orderType: "purchase", orderId, paymentId,
        });
      }
      return json({
        received: true, handled: true, orderType: "purchase", status: "success", orderId, paymentId,
      });
    }

    /*
     * ---------------------------------------------------------
     * 2. wallet_topup_orders
     * ---------------------------------------------------------
     *
     * Capture uses the same atomic settlement RPC as the client callback.
     */
    const { data: walletOrder, error: walletFetchError } = await db
      .from("wallet_topup_orders")
      .select(
        "id, user_id, amount, currency, status, razorpay_order_id, razorpay_payment_id",
      )
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (walletFetchError) throw walletFetchError;

    if (walletOrder) {
      if (event === "payment.captured") {
        assertCapturedRazorpayPayment(paymentEntity, {
          paymentId: walletOrder.status === "paid" ? walletOrder.razorpay_payment_id : paymentId,
          orderId: walletOrder.razorpay_order_id,
          amountPaise: paymentAmountPaise(walletOrder.amount),
          currency: walletOrder.currency,
        });
      }
      if (!await paymentIsAvailable(db, paymentId, orderId, { type: "wallet", id: walletOrder.id })) {
        return json({ error: "Payment id is already bound to another order." }, 400);
      }
      if (event === "payment.failed") {
        const { error } = await db
          .from("wallet_topup_orders")
          .update({
            status: "failed",
            razorpay_payment_id: paymentId,
          })
          .eq("id", walletOrder.id)
          .eq("razorpay_order_id", orderId)
          .neq("status", "paid");
        if (error) throw error;

        return json({
          received: true,
          handled: true,
          orderType: "wallet_topup",
          status: "failed",
          orderId,
          paymentId,
        });
      }

      const settlement = await settleWalletTopup(db, walletOrder, paymentId);

      return json({
        received: true,
        handled: true,
        orderType: "wallet_topup",
        status: settlement.alreadySettled ? "already_settled" : "paid",
        orderId,
        paymentId,
      });
    }

    /*
     * ---------------------------------------------------------
     * 3. premium_subscriptions
     * ---------------------------------------------------------
     */
    const { data: premium, error: premiumFetchError } = await db
      .from("premium_subscriptions")
      .select(
        "id, user_id, status, plan_id, billing_cycle, price, razorpay_order_id, razorpay_payment_id",
      )
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (premiumFetchError) throw premiumFetchError;
    if (premium) {
      if (event === "payment.captured") {
        assertCapturedRazorpayPayment(paymentEntity, {
          paymentId: premium.status === "active" ? premium.razorpay_payment_id : paymentId,
          orderId: premium.razorpay_order_id,
          amountPaise: premiumPaymentAmountPaise(premium.price),
          currency: "INR",
        });
      }
      if (!await paymentIsAvailable(db, paymentId, orderId, { type: "premium", id: premium.id })) {
        return json({ error: "Payment id is already bound to another order." }, 400);
      }
      if (event === "payment.failed") {
        const { error: failureError } = await db
          .from("premium_subscriptions")
          .update({
            status: "expired",
            razorpay_payment_id: paymentId,
          })
          .eq("id", premium.id)
          .eq("razorpay_order_id", orderId)
          .eq("status", "pending");
        if (failureError) throw failureError;

        return json({
          received: true,
          handled: true,
          orderType: "premium",
          status: "failed",
          orderId,
          paymentId,
        });
      }

      const activation = await activatePremiumSubscription(db, premium, paymentId);

      return json({
        received: true,
        handled: true,
        orderType: "premium",
        status: activation.alreadyActive ? "already_active" : "active",
        orderId,
        paymentId,
      });
    }

    /*
     * ---------------------------------------------------------
     * 4. custom_project_payments
     * ---------------------------------------------------------
     */
    const { data: customProjectPayment, error: customPaymentFetchError } = await db
      .from("custom_project_payments")
      .select(
        "id, request_id, user_id, kind, status, amount, currency, razorpay_order_id, razorpay_payment_id",
      )
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (customPaymentFetchError) throw customPaymentFetchError;

    if (customProjectPayment) {
      if (event === "payment.captured") {
        // Token settlement also grants the request's token amount through a DB trigger.
        if (customProjectPayment.kind === "token") {
          const { data: tokenRequest, error: tokenError } = await db
            .from("custom_project_requests")
            .select("id, token_amount, token_payment_status, payment_id")
            .eq("id", customProjectPayment.request_id)
            .eq("user_id", customProjectPayment.user_id)
            .eq("payment_order_id", customProjectPayment.razorpay_order_id)
            .maybeSingle();
          if (tokenError) throw tokenError;
          if (!tokenRequest || customProjectPayment.currency !== "INR" ||
            paymentAmountPaise(tokenRequest.token_amount) !== paymentAmountPaise(customProjectPayment.amount) ||
            (tokenRequest.token_payment_status === "paid" && tokenRequest.payment_id !== paymentId)) {
            throw new PaymentVerificationError("Token payment does not match this request.");
          }
        }
        assertCapturedRazorpayPayment(paymentEntity, {
          paymentId: ["paid", "refund_due"].includes(customProjectPayment.status)
            ? customProjectPayment.razorpay_payment_id : paymentId,
          orderId: customProjectPayment.razorpay_order_id,
          amountPaise: paymentAmountPaise(customProjectPayment.amount),
          currency: customProjectPayment.currency,
        });
      }
      if (!await paymentIsAvailable(db, paymentId, orderId, { type: customProjectPayment.kind, id: customProjectPayment.kind === "token" ? customProjectPayment.request_id : customProjectPayment.id })) {
        return json({ error: "Payment id is already bound to another order." }, 400);
      }
      const newStatus =
        event === "payment.captured"
          ? "paid"
          : "failed";

      // captured: settle an open or previously-failed attempt (DB triggers credit the token/balance);
      // failed: only an open row. A 'paid' or 'refund_due' row is final and never touched here.
      const { data: updatedCustomPayment, error: customPaymentUpdateError } = await db
        .from("custom_project_payments")
        .update({
          status: newStatus,
          razorpay_payment_id: paymentId,
        })
        .eq("id", customProjectPayment.id)
        .eq("razorpay_order_id", orderId)
        .eq("amount", customProjectPayment.amount)
        .eq("currency", customProjectPayment.currency)
        .in("status", newStatus === "paid" ? ["created", "failed"] : ["created"])
        .select(
          "id, request_id, kind, status, razorpay_order_id, razorpay_payment_id",
        )
        .maybeSingle();
      if (customPaymentUpdateError) throw customPaymentUpdateError;

      // A concurrent delivery may have won the conditional update. Confirm its
      // committed outcome before acknowledging; zero rows alone proves nothing.
      if (!updatedCustomPayment) {
        const { data: current, error: currentError } = await db
          .from("custom_project_payments")
          .select("id, status, razorpay_order_id, razorpay_payment_id")
          .eq("id", customProjectPayment.id)
          .eq("razorpay_order_id", orderId)
          .single();
        if (currentError) throw currentError;
        if (!current || (event === "payment.captured" &&
          (!["paid", "refund_due"].includes(current.status) || current.razorpay_payment_id !== paymentId))) {
          throw new Error("Custom project settlement could not be confirmed. Please retry.");
        }
      }

      return json({
        received: true,
        handled: true,
        orderType: "custom_project",
        status: updatedCustomPayment
          ? updatedCustomPayment.status
          : "already_settled",
        orderId,
        paymentId,
      });
    }

    /*
     * ---------------------------------------------------------
     * Unknown order
     * ---------------------------------------------------------
     */
    console.warn(
      `Razorpay webhook received an unknown order: ${orderId}`,
    );

    return json({
      received: true,
      handled: false,
      reason: "Order not found in CampusEduX.",
      orderId,
      paymentId,
    });
  } catch (err) {
    console.error(
      "razorpay-webhook:",
      err,
    );

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unexpected webhook error.",
      },
      err instanceof PaymentVerificationError ? err.status : 500,
    );
  }
});

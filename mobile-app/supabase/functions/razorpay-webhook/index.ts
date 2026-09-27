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

    let payload: any;

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

    if (!orderId || !paymentId) {
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
     * We update only rows whose current status is pending.
     * This makes the update idempotent and prevents the same
     * webhook from repeatedly settling the same purchase.
     */
    const { data: purchase } = await db
      .from("purchases")
      .select(
        "id, user_id, project_id, total_amount, status, razorpay_order_id, razorpay_payment_id, project:projects(title)",
      )
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (purchase) {
      /*
       * payment.failed
       */
      if (event === "payment.failed") {
        if (purchase.status === "success") {
          return json({
            received: true,
            handled: true,
            alreadySettled: true,
            orderType: "purchase",
            orderId,
          });
        }

        const { error } = await db
          .from("purchases")
          .update({
            status: "failed",
            razorpay_payment_id: paymentId,
            failure_reason:
              paymentEntity?.error_description ??
              paymentEntity?.error_reason ??
              "Razorpay payment failed.",
          })
          .eq("id", purchase.id)
          .neq("status", "success");

        if (error) throw error;

        return json({
          received: true,
          handled: true,
          orderType: "purchase",
          status: "failed",
          orderId,
          paymentId,
        });
      }

      /*
       * payment.captured
       *
       * Atomic transition:
       * pending -> success
       *
       * Only the request which successfully changes the row
       * from pending to success performs the dependent actions.
       */
      const { data: updatedPurchase, error } = await db
        .from("purchases")
        .update({
          status: "success",
          razorpay_payment_id: paymentId,
          failure_reason: null,
        })
        .eq("id", purchase.id)
        .neq("status", "success")
        .select(
          "id, user_id, project_id, total_amount, status, razorpay_order_id, razorpay_payment_id, project:projects(title)",
        )
        .maybeSingle();

      if (error) throw error;

      /*
       * If no row was returned, another request already settled
       * this purchase. This is the idempotency protection.
       */
      if (!updatedPurchase) {
        return json({
          received: true,
          handled: true,
          alreadySettled: true,
          orderType: "purchase",
          orderId,
          paymentId,
        });
      }

      /*
       * Existing business side effects from
       * verify-razorpay-payment.
       */
      const { error: salesError } = await db.rpc(
        "increment_project_sales_count",
        {
          p_project_id: updatedPurchase.project_id,
        },
      );

      if (salesError) {
        console.error(
          "Failed to increment project sales count:",
          salesError,
        );
      }

      // Untyped client: supabase-js infers the embed as an array, but PostgREST returns a single object
      // for this many-to-one join (purchases.project_id -> projects.id). Accept either shape.
      const embeddedProject = updatedPurchase.project as unknown as
        | { title?: string | null }
        | { title?: string | null }[]
        | null;
      const projectTitle =
        (Array.isArray(embeddedProject) ? embeddedProject[0]?.title : embeddedProject?.title) ?? "project";

      const { error: ledgerError } = await db
        .from("wallet_transactions")
        .insert({
          user_id: updatedPurchase.user_id,
          type: "debit",
          category: "project_purchase",
          amount: updatedPurchase.total_amount,
          description: `Purchased "${projectTitle}"`,
        });

      if (ledgerError) {
        console.error(
          "Failed to create wallet transaction:",
          ledgerError,
        );
      }

      return json({
        received: true,
        handled: true,
        orderType: "purchase",
        status: "success",
        orderId,
        paymentId,
      });
    }

    /*
     * ---------------------------------------------------------
     * 2. wallet_topup_orders
     * ---------------------------------------------------------
     *
     * Webhook marks the payment state only.
     *
     * The existing verify-wallet-topup-payment function remains
     * the primary client callback flow.
     */
    const { data: walletOrder } = await db
      .from("wallet_topup_orders")
      .select(
        "id, user_id, amount, status, razorpay_order_id, razorpay_payment_id",
      )
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (walletOrder) {
      if (event === "payment.failed") {
        await db
          .from("wallet_topup_orders")
          .update({
            status: "failed",
            razorpay_payment_id: paymentId,
          })
          .eq("id", walletOrder.id)
          .neq("status", "paid");

        return json({
          received: true,
          handled: true,
          orderType: "wallet_topup",
          status: "failed",
          orderId,
          paymentId,
        });
      }

      const { data: updatedWalletOrder } = await db
        .from("wallet_topup_orders")
        .update({
          status: "paid",
          razorpay_payment_id: paymentId,
        })
        .eq("id", walletOrder.id)
        .neq("status", "paid")
        .select(
          "id, user_id, amount, status, razorpay_order_id, razorpay_payment_id",
        )
        .maybeSingle();

      // This webhook is a fallback credit path: if the browser never
      // completes its call to verify-wallet-topup-payment (closed tab,
      // network failure, blocked request) after Razorpay actually captured
      // the payment, the wallet must still get credited. The .neq("status",
      // "paid") guard above means only one of the two paths ever wins this
      // race for a given order, so this insert can't double-credit a top-up
      // that verify-wallet-topup-payment already settled.
      if (updatedWalletOrder) {
        const { error: creditError } = await db.from("wallet_transactions").insert({
          user_id: updatedWalletOrder.user_id,
          type: "credit",
          category: "added_money",
          amount: updatedWalletOrder.amount,
          description: "Added Money",
        });
        if (creditError) {
          console.error("Failed to create wallet top-up credit:", creditError);
        }
      }

      return json({
        received: true,
        handled: true,
        orderType: "wallet_topup",
        status: updatedWalletOrder
          ? "paid"
          : "already_settled",
        orderId,
        paymentId,
      });
    }

    /*
     * ---------------------------------------------------------
     * 3. premium_subscriptions
     * ---------------------------------------------------------
     */
    const { data: premium } = await db
      .from("premium_subscriptions")
      .select(
        "id, user_id, status, razorpay_order_id, razorpay_payment_id",
      )
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (premium) {
      if (event === "payment.failed") {
        await db
          .from("premium_subscriptions")
          .update({
            status: "expired",
            razorpay_payment_id: paymentId,
          })
          .eq("id", premium.id)
          .neq("status", "active");

        return json({
          received: true,
          handled: true,
          orderType: "premium",
          status: "failed",
          orderId,
          paymentId,
        });
      }

      const { data: updatedPremium } = await db
        .from("premium_subscriptions")
        .update({
          status: "active",
          razorpay_payment_id: paymentId,
        })
        .eq("id", premium.id)
        .neq("status", "active")
        .select(
          "id, user_id, status, razorpay_order_id, razorpay_payment_id",
        )
        .maybeSingle();

      return json({
        received: true,
        handled: true,
        orderType: "premium",
        status: updatedPremium
          ? "active"
          : "already_active",
        orderId,
        paymentId,
      });
    }

    /*
     * ---------------------------------------------------------
     * 4. custom_project_payments
     * ---------------------------------------------------------
     */
    const { data: customProjectPayment } = await db
      .from("custom_project_payments")
      .select(
        "id, status, razorpay_order_id, razorpay_payment_id",
      )
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (customProjectPayment) {
      const newStatus =
        event === "payment.captured"
          ? "paid"
          : "failed";

      // captured: settle an open or previously-failed attempt (DB triggers credit the token/balance);
      // failed: only an open row. A 'paid' or 'refund_due' row is final and never touched here.
      const { data: updatedCustomPayment } = await db
        .from("custom_project_payments")
        .update({
          status: newStatus,
          razorpay_payment_id: paymentId,
        })
        .eq("id", customProjectPayment.id)
        .in("status", newStatus === "paid" ? ["created", "failed"] : ["created"])
        .select(
          "id, status, razorpay_order_id, razorpay_payment_id",
        )
        .maybeSingle();

      return json({
        received: true,
        handled: true,
        orderType: "custom_project",
        status: updatedCustomPayment
          ? newStatus
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
      500,
    );
  }
});

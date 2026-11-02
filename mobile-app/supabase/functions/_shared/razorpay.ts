// Razorpay helpers shared by every payment-related Edge Function.
//
// Secrets (set once with `supabase secrets set ...`):
//   RAZORPAY_KEY_ID       rzp_test_xxx / rzp_live_xxx  — safe to hand to the client
//   RAZORPAY_KEY_SECRET   server-only; NEVER sent to the client or logged

import { nonEmptyString } from "./paymentBinding.ts";

const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

export const razorpayKeyId = KEY_ID;

/** Both secrets present — payment functions 503 when this is false. */
export function razorpayConfigured(): boolean {
  return KEY_ID.length > 0 && KEY_SECRET.length > 0;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/** Creates a real Razorpay order via the Orders API (Basic auth, key never leaves the server). */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes ?? {},
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Razorpay order creation failed (${res.status}): ${detail}`);
  }
  const order = (await res.json()) as RazorpayOrder;
  if (!order || !nonEmptyString(order.id)) {
    throw new Error("Razorpay returned an order without an identifier.");
  }
  return order;
}

/**
 * Real HMAC-SHA256 verification of the `${order_id}|${payment_id}` pair against
 * RAZORPAY_KEY_SECRET, per Razorpay's docs. A client-reported "success" is never
 * trusted. Settlement also requires authoritative captured-payment verification.
 */
export async function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): Promise<boolean> {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(KEY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${razorpayOrderId}|${razorpayPaymentId}`),
  );
  const expected = [...new Uint8Array(signatureBytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqualHex(expected, razorpaySignature.trim().toLowerCase());
}

export class PaymentVerificationError extends Error {
  constructor(message = "Payment capture verification failed.", public readonly status = 400) {
    super(message);
    this.name = "PaymentVerificationError";
  }
}

/** Stored INR amounts are numeric(10,2) rupees; provider amounts are integer paise. */
export function paymentAmountPaise(value: unknown): number {
  const amount = typeof value === "number" || (typeof value === "string" && value.trim() !== "")
    ? Number(value)
    : NaN;
  const paise = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(paise) || paise <= 0 ||
    Math.abs(amount * 100 - paise) > 0.000001) {
    throw new PaymentVerificationError("Invalid stored payment amount.");
  }
  return paise;
}

/** Match create-premium-order's snapshotted price + rounded 18% GST, not today's plan. */
export function premiumPaymentAmountPaise(price: unknown): number {
  paymentAmountPaise(price);
  const base = Number(price);
  const gst = Math.round(base * 0.18 * 100) / 100;
  return paymentAmountPaise(Math.round((base + gst) * 100) / 100);
}

type ExpectedPayment = {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
};

function validateExpectedPayment(expected: ExpectedPayment): void {
  if (!nonEmptyString(expected.paymentId) || !nonEmptyString(expected.orderId) ||
    !Number.isSafeInteger(expected.amountPaise) || expected.amountPaise <= 0 ||
    typeof expected.currency !== "string" || !/^[A-Z]{3}$/.test(expected.currency)) {
    throw new PaymentVerificationError("Invalid stored payment expectations.");
  }
}

/** Only call with an authenticated API response or a raw-body signature-verified webhook. */
export function assertCapturedRazorpayPayment(value: unknown, expected: ExpectedPayment): void {
  validateExpectedPayment(expected);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PaymentVerificationError();
  }
  const payment = value as Record<string, unknown>;
  if (payment.entity !== "payment" || payment.status !== "captured" || payment.captured !== true ||
    payment.id !== expected.paymentId || payment.order_id !== expected.orderId ||
    !Number.isSafeInteger(payment.amount) || payment.amount !== expected.amountPaise ||
    payment.currency !== expected.currency) {
    throw new PaymentVerificationError();
  }
}

/**
 * Checkout HMAC proves identity, not capture. Fetch the specific payment from Razorpay
 * before settlement AND before returning retry success. Never expose provider bodies.
 * https://razorpay.com/docs/api/payments/fetch-with-id/
 */
export async function verifyCapturedRazorpayPayment(expected: ExpectedPayment): Promise<void> {
  validateExpectedPayment(expected);
  if (!razorpayConfigured()) {
    throw new PaymentVerificationError("Payments are not configured.", 503);
  }
  const controller = new AbortController();
  // Covers both the HTTP request and response-body parsing; no settlement on timeout.
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(expected.paymentId)}`,
      {
        method: "GET",
        headers: { Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`, Accept: "application/json" },
        redirect: "error",
        signal: controller.signal,
      },
    );
    if (response.status !== 200 || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw new PaymentVerificationError("Payment could not be verified. Please retry.", 503);
    }
    const payment: unknown = await response.json();
    if (controller.signal.aborted) throw new PaymentVerificationError("Payment could not be verified. Please retry.", 503);
    assertCapturedRazorpayPayment(payment, expected);
  } catch (error) {
    if (error instanceof PaymentVerificationError) throw error;
    throw new PaymentVerificationError("Payment could not be verified. Please retry.", 503);
  } finally {
    clearTimeout(timeout);
  }
}

/** Constant-time compare so a bad signature can't be probed byte-by-byte. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

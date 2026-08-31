// Razorpay helpers shared by every payment-related Edge Function.
//
// Secrets (set once with `supabase secrets set ...`):
//   RAZORPAY_KEY_ID       rzp_test_xxx / rzp_live_xxx  — safe to hand to the client
//   RAZORPAY_KEY_SECRET   server-only; NEVER sent to the client or logged

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
  return (await res.json()) as RazorpayOrder;
}

/**
 * Real HMAC-SHA256 verification of the `${order_id}|${payment_id}` pair against
 * RAZORPAY_KEY_SECRET, per Razorpay's docs. A client-reported "success" is never
 * trusted — only this check flips a row to paid/active.
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

/** Constant-time compare so a bad signature can't be probed byte-by-byte. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

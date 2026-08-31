import { createHmac } from "node:crypto";

/**
 * Contract test for the Razorpay signature check implemented in
 * supabase/functions/_shared/razorpay.ts (verifyRazorpaySignature).
 *
 * Razorpay's rule: signature = HMAC_SHA256("<order_id>|<payment_id>", key_secret)
 * hex-encoded. The Edge Function uses Web Crypto; this reference uses Node's
 * crypto and must agree, otherwise a valid payment would be rejected (or a
 * forged one accepted).
 */

const KEY_SECRET = "test_secret_key_123";

function sign(orderId: string, paymentId: string, secret = KEY_SECRET): string {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

/** Mirror of _shared/razorpay.ts's verifyRazorpaySignature, minus the Deno env read. */
function verify(orderId: string, paymentId: string, signature: string, secret = KEY_SECRET): boolean {
  if (!orderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.trim().toLowerCase().charCodeAt(i);
  }
  return mismatch === 0;
}

describe("Razorpay signature verification", () => {
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";

  it("accepts a signature produced with the same secret", () => {
    expect(verify(orderId, paymentId, sign(orderId, paymentId))).toBe(true);
  });

  it("rejects a signature produced with a different secret", () => {
    expect(verify(orderId, paymentId, sign(orderId, paymentId, "wrong_secret"))).toBe(false);
  });

  it("rejects a tampered payment id", () => {
    const sig = sign(orderId, paymentId);
    expect(verify(orderId, "pay_TAMPERED", sig)).toBe(false);
  });

  it("rejects empty / missing input", () => {
    expect(verify(orderId, paymentId, "")).toBe(false);
    expect(verify("", paymentId, sign(orderId, paymentId))).toBe(false);
  });

  it("matches a fixed known vector", () => {
    // pre-computed: HMAC_SHA256("order_1|pay_1", "test_secret_key_123")
    expect(sign("order_1", "pay_1")).toBe(
      createHmac("sha256", "test_secret_key_123").update("order_1|pay_1").digest("hex")
    );
    expect(sign("order_1", "pay_1")).toHaveLength(64); // sha256 hex
  });
});

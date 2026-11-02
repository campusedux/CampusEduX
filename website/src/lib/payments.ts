// The single gate every checkout flow (wallet top-up, Premium, custom
// project) routes its Razorpay Edge Function responses through. A flow may
// NEVER reach a "success" state on a transport error or on an { error: ... }
// body — the pass/fail and the amount are the server's to decide, never the
// client's.

export type InvokeResult<T = unknown> = {
  data: T | null;
  error: { message?: string } | null;
};

export type Verdict =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string };

/**
 * Turn a `supabase.functions.invoke(...)` result into a pass/fail verdict.
 * `ok` is true only when the call had no transport error AND the returned
 * body carries the existing endpoint's settlement acknowledgement. Anything else — no body, a string
 * body, `{ error }`, a thrown transport error — is a failure.
 */
export function interpretVerifyResponse(
  result: InvokeResult,
  fallbackMessage = "Payment verification failed.",
): Verdict {
  const { data, error } = result;
  if (error) return { ok: false, message: error.message || fallbackMessage };
  if (!data || typeof data !== "object" || Array.isArray(data)) return { ok: false, message: fallbackMessage };
  const bodyError = (data as { error?: unknown }).error;
  if (bodyError) return { ok: false, message: String(bodyError) || fallbackMessage };
  const body = data as Record<string, unknown>;
  const settled = body.ok === true || body.status === "success" ||
    (typeof body.subscriptionId === "string" && body.subscriptionId.length > 0) ||
    body.token_payment_status === "paid";
  if (!settled) return { ok: false, message: fallbackMessage };
  return { ok: true, data: body };
}

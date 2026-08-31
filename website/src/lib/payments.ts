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
 * body is an object with no `error` field. Anything else — no body, a string
 * body, `{ error }`, a thrown transport error — is a failure.
 */
export function interpretVerifyResponse(
  result: InvokeResult,
  fallbackMessage = "Payment verification failed.",
): Verdict {
  const { data, error } = result;
  if (error) return { ok: false, message: error.message || fallbackMessage };
  if (!data || typeof data !== "object") return { ok: false, message: fallbackMessage };
  const bodyError = (data as { error?: unknown }).error;
  if (bodyError) return { ok: false, message: String(bodyError) || fallbackMessage };
  return { ok: true, data: data as Record<string, unknown> };
}

/**
 * ONE place that turns a failed sandbox call (compiler / judge / submit) into
 * user-facing copy. Used by the /compiler and coding-problem IDE UIs.
 * Never surfaces internal details for 5xx.
 */
export type RunFailureKind = "auth" | "rate_limited" | "unavailable" | "other";

export interface RunFailure {
  kind: RunFailureKind;
  message: string;
  /** Seconds to wait (429 only). */
  retryAfter?: number;
}

export const SIGN_IN_TO_RUN_LABEL = "Sign in to run code";
export const SIGN_IN_BANNER_TEXT = "Sign in to run and submit code — it's free.";

function parseSeconds(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v.trim()) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.ceil(n), 3600) : undefined;
}

/**
 * @param status HTTP status
 * @param body parsed JSON body (may be null/garbage)
 * @param retryAfterHeader raw `Retry-After` header value, if any
 */
export function describeRunFailure(status: number, body?: unknown, retryAfterHeader?: string | null): RunFailure {
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (status === 401) {
    return { kind: "auth", message: SIGN_IN_BANNER_TEXT };
  }
  if (status === 429) {
    const retryAfter = parseSeconds(o.retry_after) ?? parseSeconds(o.retryAfter) ?? parseSeconds(retryAfterHeader);
    return {
      kind: "rate_limited",
      retryAfter,
      message: retryAfter
        ? `You're running code too fast — try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.`
        : "You're running code too fast — try again in a few seconds.",
    };
  }
  if (status === 503 || status === 502 || status === 504) {
    return { kind: "unavailable", message: "Code execution is temporarily unavailable." };
  }
  const own = typeof o.error === "string" && o.error.trim() && status < 500 ? o.error : null;
  return { kind: "other", message: own ?? `The request failed (${status}). Please try again.` };
}

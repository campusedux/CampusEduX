/**
 * Best-effort in-memory fixed-window rate limiter for `/api/compiler/run`.
 *
 * This project has no Redis / durable KV, so the counter lives in the module
 * scope of one server instance: it resets on redeploy and is not shared across
 * lambdas. It still blunts a single client hammering the endpoint from one
 * process; the execution provider's own quota is the real backstop, and
 * `COMPILER_REQUIRE_AUTH=true` is available when stricter control is needed.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateResult {
  ok: boolean;
  /** Seconds until the window resets (for a Retry-After header). */
  retryAfter: number;
}

export function checkRateLimit(key: string, max: number, windowMs: number, now = Date.now()): RateResult {
  // Opportunistic sweep so the map can't grow without bound.
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (existing.count >= max) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Test-only reset. */
export function __resetRateLimit() {
  buckets.clear();
}

// Per-user rate limiting for the order-creation functions.
//
// Backed by public.check_rate_limit() (migration 0030). Called through the
// service-role client. Fails OPEN on an infrastructure error (function not
// deployed yet, transient DB issue) so a hiccup in the limiter can never block
// a legitimate purchase — the limiter is a spam guard, not an auth check.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("Too many attempts. Please wait a moment and try again.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface RateLimitOptions {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/**
 * Throws `RateLimitError` when `userId` has exceeded `limit` calls to `action`
 * in the last `windowSeconds`. Resolves normally otherwise.
 */
export async function enforceRateLimit(
  db: SupabaseClient,
  userId: string,
  action: string,
  { limit, windowSeconds }: RateLimitOptions,
): Promise<void> {
  const { data, error } = await db.rpc("check_rate_limit", {
    p_user_id: userId,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.warn(`[rateLimit] ${action}: check skipped (${error.message})`);
    return; // fail open
  }

  if (data === false) {
    throw new RateLimitError(windowSeconds);
  }
}

/**
 * Maps a failed website code-execution call (compile / judge / submit) to
 * user-facing copy. Wording mirrors the website's `describeRunFailure`
 * (website/src/lib/runErrors.ts). Never leaks internal 5xx details.
 */
export type RunFailureKind = "rate_limit" | "auth" | "server";

export interface RunFailure {
  kind: RunFailureKind;
  message: string;
  retryAfter?: number;
}

function parseSeconds(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v.trim()) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.ceil(n), 3600) : undefined;
}

export function describeRunFailure(status: number, body?: unknown, retryAfterHeader?: string | null): RunFailure {
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (status === 401) return { kind: "auth", message: "Your session expired — sign in again." };
  if (status === 429) {
    const retryAfter = parseSeconds(o.retry_after) ?? parseSeconds(retryAfterHeader);
    return {
      kind: "rate_limit",
      retryAfter,
      message: retryAfter
        ? `You're running code too fast — try again in ${retryAfter} second${retryAfter === 1 ? "" : "s"}.`
        : "You're running code too fast — try again in a few seconds.",
    };
  }
  if (status === 502 || status === 503 || status === 504) {
    return { kind: "server", message: "Code execution is temporarily unavailable." };
  }
  const own = typeof o.error === "string" && o.error.trim() && status < 500 ? o.error : null;
  return { kind: "server", message: own ?? "Something went wrong. Please try again." };
}

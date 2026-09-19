/**
 * Durable, Postgres-backed rate limiting + per-user AI budget.
 *
 * Replaces the old in-memory limiter (per-lambda, reset on redeploy). Both RPCs
 * are SECURITY DEFINER and key on `auth.uid()`, so they MUST be called with the
 * caller's OWN session client (cookie session or Bearer-scoped), never the anon
 * or a service-role client:
 *
 *   public.rl_hit(p_bucket text, p_max int, p_window_seconds int) -> jsonb
 *       {"allowed":bool,"remaining":int,"retry_after_seconds":int}
 *   public.ai_budget_take(p_kind text, p_daily_limit int) -> jsonb
 *       {"allowed":bool,"used":int,"limit":int}
 *
 * rl_hit consumes ONE hit per call. Sandbox routes therefore cap *requests* per
 * window (a judge request fans out to up to MAX_JUDGE_CASES sandbox runs, so the
 * judge request cap is sized ~1/MAX_JUDGE_CASES of the raw-run cap).
 *
 * Every function FAILS CLOSED: an RPC error / malformed reply returns
 * `{ allowed: false, unavailable: true }` and callers answer 503.
 */
import { NextResponse } from "next/server";

/** The slice of a Supabase client this module needs (injectable for tests). */
export interface RpcClient {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}

export interface HitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  /** True when the limiter itself failed (fail-closed). */
  unavailable?: boolean;
}

export interface BudgetResult {
  allowed: boolean;
  used: number;
  limit: number;
  unavailable?: boolean;
}

function asObj(data: unknown): Record<string, unknown> | null {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
}

export async function rlHit(client: RpcClient, bucket: string, max: number, windowSeconds: number): Promise<HitResult> {
  try {
    const { data, error } = await client.rpc("rl_hit", {
      p_bucket: bucket,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    const o = asObj(data);
    if (error || !o || typeof o.allowed !== "boolean") {
      return { allowed: false, remaining: 0, retryAfter: 5, unavailable: true };
    }
    return {
      allowed: o.allowed,
      remaining: Number(o.remaining ?? 0),
      retryAfter: Math.max(1, Number(o.retry_after_seconds ?? 1)),
    };
  } catch {
    return { allowed: false, remaining: 0, retryAfter: 5, unavailable: true };
  }
}

export async function aiBudgetTake(client: RpcClient, kind: string, dailyLimit: number): Promise<BudgetResult> {
  try {
    const { data, error } = await client.rpc("ai_budget_take", { p_kind: kind, p_daily_limit: dailyLimit });
    const o = asObj(data);
    if (error || !o || typeof o.allowed !== "boolean") {
      return { allowed: false, used: 0, limit: dailyLimit, unavailable: true };
    }
    return { allowed: o.allowed, used: Number(o.used ?? 0), limit: Number(o.limit ?? dailyLimit) };
  } catch {
    return { allowed: false, used: 0, limit: dailyLimit, unavailable: true };
  }
}

/** Read a positive-int env var with default + clamp. */
export function envInt(name: string, fallback: number, min = 1, max = 100_000): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const AI_DAILY_LIMIT_ASSIST = () => envInt("AI_DAILY_LIMIT_RESUME_ASSIST", 30);
export const AI_DAILY_LIMIT_UNDERSTAND = () => envInt("AI_DAILY_LIMIT_PROJECT_UNDERSTAND", 20);

/** Sandbox request cap shared by the judge/submit routes (each request = up to 12 sandbox runs). */
export const JUDGE_BUCKET = "judge";
export const judgeMax = () => envInt("JUDGE_RATE_LIMIT_MAX", 6, 1, 1_000);
export const judgeWindowSeconds = () => envInt("JUDGE_RATE_LIMIT_WINDOW_SECONDS", 60, 1, 3_600);

/**
 * Turn a failed limiter result into the standard error response (or null when allowed).
 * `shape` lets routes keep their existing `{ok:false,error}` vs `{error}` body.
 */
export function limitResponse(
  r: HitResult,
  opts: { message: string; withOk?: boolean; headers?: Record<string, string> },
): NextResponse | null {
  if (r.allowed) return null;
  const body = (error: string) => (opts.withOk === false ? { error } : { ok: false, error });
  if (r.unavailable) {
    return NextResponse.json(body("Service temporarily unavailable. Please try again shortly."), {
      status: 503,
      headers: { ...opts.headers, "Retry-After": "5" },
    });
  }
  return NextResponse.json(body(opts.message), {
    status: 429,
    headers: { ...opts.headers, "Retry-After": String(r.retryAfter) },
  });
}

export function budgetResponse(
  b: BudgetResult,
  opts: { message: string; headers?: Record<string, string> },
): NextResponse | null {
  if (b.allowed) return null;
  if (b.unavailable) {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { ...opts.headers, "Retry-After": "5" } },
    );
  }
  return NextResponse.json({ error: opts.message }, { status: 429, headers: opts.headers });
}

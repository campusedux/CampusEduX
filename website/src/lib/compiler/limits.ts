/**
 * Size + time limits for the online compiler. Every value has a safe default
 * and can be tuned per-environment without a code change. Read once at module
 * load — these are not secrets and never reach the browser.
 */

function intFromEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** Max source length accepted by `/api/compiler/run`, in bytes (UTF-8). */
export const MAX_CODE_BYTES = intFromEnv("COMPILER_MAX_CODE_BYTES", 64_000, 1_000, 500_000);

/** Max stdin length accepted by `/api/compiler/run`, in bytes (UTF-8). */
export const MAX_STDIN_BYTES = intFromEnv("COMPILER_MAX_STDIN_BYTES", 16_000, 0, 200_000);

/** Wall-clock budget for one run before the server aborts the provider call. */
export const RUN_TIMEOUT_MS = intFromEnv("COMPILER_TIMEOUT_MS", 12_000, 2_000, 30_000);

/** Best-effort per-instance rate limit: max runs per client key per window. */
export const RATE_LIMIT_MAX = intFromEnv("COMPILER_RATE_LIMIT_MAX", 20, 1, 1_000);
export const RATE_LIMIT_WINDOW_MS = intFromEnv("COMPILER_RATE_LIMIT_WINDOW_MS", 60_000, 1_000, 3_600_000);

/** UTF-8 byte length without pulling in Buffer on the client bundle. */
export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

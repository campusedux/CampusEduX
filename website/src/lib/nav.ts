/**
 * A `?next=` / `?redirect=` value is attacker-controllable, so it must never be
 * fed straight into `router.push`. This returns the value only when it is a
 * same-origin relative path; anything else (absolute URL, protocol-relative
 * `//host`, `/\host`, a non-path) falls back to `/account`.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value) return fallback;
  // Must start with a single slash and not be a scheme-relative or backslash trick.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // No control chars, no whitespace-embedded scheme.
  if (/[\x00-\x1f]/.test(value)) return fallback;
  return value;
}

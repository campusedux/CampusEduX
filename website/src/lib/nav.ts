/**
 * A `?next=` / `?redirect=` value is attacker-controllable, so it must never be
 * fed straight into `router.push`. This returns the value only when it is a
 * same-origin relative path; anything else (absolute URL, protocol-relative
 * `//host`, `/\host`, a non-path) falls back to `/` — opening /login directly
 * (no `next`) or with a rejected one lands on the home page, not /account.
 */
export function safeInternalPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  // Must start with a single slash and not be a scheme-relative or backslash trick.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // No control chars, no whitespace-embedded scheme.
  if (/[\x00-\x1f]/.test(value)) return fallback;
  return value;
}

/** Path prefixes where offering to "sign in and return here" doesn't make sense. */
const NO_RETURN_PATHS = ["/login", "/register"];

/**
 * Builds the header / drawer "Sign in" link, carrying the current page as
 * `next` so a successful login lands back where the user started (see
 * src/components/nav/AuthMenu.tsx and MobileNav.tsx) — never appends `next`
 * from /login or /register themselves.
 */
export function loginHrefFor(pathname: string): string {
  if (NO_RETURN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return "/login";
  return `/login?next=${encodeURIComponent(pathname)}`;
}

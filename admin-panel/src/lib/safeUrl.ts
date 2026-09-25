/**
 * Server-side URL validation for every admin action that stores a link / image
 * URL (ADM-03). Accepts ONLY:
 *   - absolute http(s) URLs, or
 *   - internal paths starting with a single "/".
 * Rejects javascript:, data:, vbscript:, file:, protocol-relative "//host",
 * backslash tricks, control characters and bare hosts.
 *
 * Pure (no server-only imports) so it is unit-testable and safe anywhere.
 */
// eslint-disable-next-line no-control-regex
const BAD_CHARS = /[\u0000-\u001f\u007f\\]/;

export function isSafeUrl(raw: string | null | undefined): boolean {
  if (typeof raw !== 'string') return false;
  const v = raw.trim();
  if (!v || BAD_CHARS.test(v)) return false;
  if (v.startsWith('/')) return !v.startsWith('//');
  if (!/^https?:\/\//i.test(v)) return false;
  try {
    const u = new URL(v);
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname;
  } catch {
    return false;
  }
}

/** Blank is allowed (optional field). */
export function isSafeUrlOrEmpty(raw: string | null | undefined): boolean {
  return !raw || !raw.trim() || isSafeUrl(raw);
}

/**
 * Validate optional URL form fields. `fields` maps FormData key -> human label.
 * Returns the first field-level error ("Apply URL: must be ...") or null.
 */
export function urlFieldError(fd: FormData, fields: Record<string, string>): string | null {
  for (const [key, label] of Object.entries(fields)) {
    const v = String(fd.get(key) ?? '');
    if (!isSafeUrlOrEmpty(v)) {
      return `${label}: must be a full http(s):// URL or a path starting with a single "/" (javascript:, data: and similar are not allowed).`;
    }
  }
  return null;
}

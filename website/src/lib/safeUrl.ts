/**
 * Render-time URL guard for admin / user supplied links (WEB-08 / ADM-03 defence in depth).
 * Accepts only absolute http(s) URLs or same-site paths that start with a single "/".
 * Everything else (javascript:, data:, vbscript:, protocol-relative "//", control
 * characters, backslash tricks, bare hosts) yields null so callers skip the link.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_OR_SPACE_INSIDE = /[\u0000-\u001f\u007f\\]/;

export function safeHref(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (!v || CONTROL_OR_SPACE_INSIDE.test(v)) return null;
  if (v.startsWith("/")) return v.startsWith("//") ? null : v;
  if (!/^https?:\/\//i.test(v)) return null;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? v : null;
  } catch {
    return null;
  }
}

/** Display helpers for Home cards: turn raw DB values into clean, user-facing text. */

const NULLISH = new Set(["null", "undefined", "nan"]);

/** Strips HTML tags/entities and markdown syntax, collapses whitespace. Returns "" for null/empty. */
export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  s = s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/(\*\*|__|~~|`)/g, "")
    .replace(/(^|\s)[*_]+|[*_]+(?=\s|$)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return NULLISH.has(s.toLowerCase()) ? "" : s;
}

/** 1499 → "₹1,499" (Indian digit grouping). Returns "" when the value is missing/invalid. */
export function formatINR(amount: unknown): string {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return "";
  const [int, frac] = String(Math.round(n * 100) / 100).split(".");
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return `₹${grouped}${frac ? `.${frac.padEnd(2, "0")}` : ""}`;
}

/** Cleans a salary string; prefixes ₹ to bare numeric ranges. Returns "" when missing. */
export function formatSalary(raw: unknown): string {
  const s = cleanText(raw);
  if (!s) return "";
  return /^\d/.test(s) ? `₹${s}` : s;
}

/** ISO date → "Today", "Yesterday", "3 days ago", "2 weeks ago", "4 months ago". "" if invalid. */
export function timeAgo(iso: unknown, now: number = Date.now()): string {
  if (!iso) return "";
  const t = new Date(iso as string).getTime();
  if (!Number.isFinite(t)) return "";
  const days = Math.max(0, Math.floor((now - t) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w > 1 ? "s" : ""} ago`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `${m} month${m > 1 ? "s" : ""} ago`;
  }
  const y = Math.floor(days / 365);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

/** True for an http(s) URL — anything else is treated as a missing image. */
export function isUsableImageUrl(url: unknown): url is string {
  return typeof url === "string" && /^https?:\/\/\S+$/i.test(url.trim());
}

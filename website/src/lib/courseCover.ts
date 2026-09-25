/**
 * Colours + glyph for a course's generated cover — pure, unit-tested.
 *
 * Live data (2026-09-25): all 5 courses have `cover_image_url = null` and 3 of
 * 5 have no `accent_color`, so the generated cover is the normal case. Every
 * value is derived at render time from the course's own fields; nothing is
 * stored.
 */

/** Tailwind `accent.*` set + brand indigo. Picked by slug when a course has no accent. */
const FALLBACK_PALETTE = ["#4F39F6", "#16A34A", "#7C3AED", "#EC4899", "#0D9488", "#3B82F6"] as const;

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

/** The admin accent when it's a plain 6-digit hex, else a stable pick from the palette by slug. */
export function courseAccent(accent: string | null | undefined, slug: string): string {
  if (accent && HEX6.test(accent)) return accent.toUpperCase();
  return FALLBACK_PALETTE[hashSlug(slug) % FALLBACK_PALETTE.length];
}

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

const hsl = (h: number, s: number, l: number, a = 1) =>
  `hsl(${((h % 360) + 360) % 360} ${Math.min(100, Math.max(0, s))}% ${Math.min(100, Math.max(0, l))}% / ${a})`;

/**
 * Layered mesh background for a generated cover: a deep base in the accent's
 * hue, the accent itself, and two soft blobs in neighbouring hues. Saturation
 * is floored so a grey-ish accent still reads as a colourful cover; the base
 * stays dark enough for white text in both themes.
 */
export function coverBackground(accent: string): string {
  const [h, s0] = hexToHsl(accent);
  const s = Math.max(s0, 55);
  // Every cover fades into the same deep brand indigo, so the set reads as one family.
  return [
    `radial-gradient(90% 100% at 100% 0%, ${hsl(h + 12, s, 66, 0.55)}, transparent 60%)`,
    `radial-gradient(70% 90% at 0% 100%, ${hsl(h - 18, s, 52, 0.5)}, transparent 65%)`,
    `linear-gradient(125deg, ${hsl(h, s, 46)} 0%, ${hsl(h, s * 0.85, 34)} 45%, hsl(248 50% 14%) 100%)`,
  ].join(", ");
}

export type CoverGlyph = "coffee" | "database" | "brain" | "sparkles" | "code" | "book";

/**
 * Glyph for a course with no emoji icon, from its name. Visual only — a miss
 * just falls back to the book glyph.
 */
export function coverGlyph(name: string): CoverGlyph {
  const n = name.toLowerCase();
  if (/\bjava\b/.test(n)) return "coffee";
  if (/\b(sql|dbms|database)\b/.test(n)) return "database";
  if (/\bgenerative\b|\bgen ?ai\b|\bllm/.test(n)) return "sparkles";
  if (/\b(ai|ml|machine learning|deep learning)\b/.test(n)) return "brain";
  if (/\b(python|javascript|c\+\+|coding|programming|dsa)\b/.test(n)) return "code";
  return "book";
}

export const isEmojiIcon = (s: string | null | undefined): s is string => !!s && /\p{Extended_Pictographic}/u.test(s);

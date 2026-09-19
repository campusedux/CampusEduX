/** Tiny, dependency-free colour maths for the design system (hex only). */

export type RGB = readonly [number, number, number];

export function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  const n = parseInt(h, 16);
  if (!/^[0-9a-f]{6}$/i.test(h) || Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/** Linear blend: t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

export const darken = (hex: string, t: number) => mix(hex, "#000000", t);
export const lighten = (hex: string, t: number) => mix(hex, "#FFFFFF", t);

/** #RRGGBB + alpha (0–1) → 8-digit hex (works on RN and RN-web). */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `${rgbToHex([r, g, b])}${Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const lin = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio (1–21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Nudge `color` towards black (on light grounds) or white (on dark grounds)
 * until it reaches `min` contrast against `ground`. Used to derive readable
 * accent *text* colours from any admin-supplied accent hex.
 */
export function ensureContrast(color: string, ground: string, min = 4.5): string {
  const towards = luminance(ground) > 0.5 ? "#000000" : "#FFFFFF";
  let out = color;
  for (let i = 1; i <= 20 && contrast(out, ground) < min; i++) out = mix(color, towards, i * 0.05);
  return out;
}

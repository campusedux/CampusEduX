export const COLORS = {
  primary: "#4F39F6",
  primaryDark: "#3730A3",
  primaryLight: "#EEF0FF",
  /** Brand secondary (teal) — already used for the NEW badge on Home. */
  secondary: "#0D9488",
  background: "#FFFFFF",
  /** Page ground behind white cards. */
  canvas: "#F5F6FB",
  surface: "#F8F9FC",
  border: "#E5E7EB",
  borderSoft: "#F1F2F6",
  textPrimary: "#111827",
  /** 7.6:1 on white. */
  textSecondary: "#4B5563",
  /** 4.8:1 on white — the lightest text that still meets AA. */
  textMuted: "#6B7280",
  /** Placeholders / disabled only — below AA, never for real content. */
  textDisabled: "#9CA3AF",
  textOnPrimary: "#FFFFFF",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
  info: "#2563EB",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const SPACING = { "2xs": 2, xs: 4, sm: 8, xxs: 12, md: 16, gutter: 20, lg: 24, xl: 32, "2xl": 40 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, card: 20, full: 9999 } as const;

/** Minimum touch target (px) — WCAG / platform guidance. */
export const MIN_TOUCH = 44;

/** #RRGGBB + alpha (0-1) → 8-digit hex. */
export function withAlpha(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

/** Soft, low-contrast status tints for badges / banners. */
export const STATUS = {
  success: { base: "#16A34A", soft: "#DCFCE7", strong: "#166534" },
  warning: { base: "#F59E0B", soft: "#FEF3C7", strong: "#92400E" },
  danger: { base: "#DC2626", soft: "#FEE2E2", strong: "#991B1B" },
  info: { base: "#2563EB", soft: "#DBEAFE", strong: "#1E40AF" },
} as const;

export type StatusTone = keyof typeof STATUS;

/**
 * Feature-identity accents, taken from the Home screen. `base` is the flat
 * colour, `colors` the diagonal gradient (light → dark, dark enough end for
 * white text). Derive tints with `accentTint()` so every screen uses the same
 * 7% fill / 15% border recipe as the Home category tiles.
 */
export const ACCENTS = {
  violet: { base: "#8B5CF6", colors: ["#8B5CF6", "#5B21B6"] },
  blue: { base: "#2563EB", colors: ["#2563EB", "#1E3A8A"] },
  orange: { base: "#F97316", colors: ["#F97316", "#C2410C"] },
  emerald: { base: "#10B981", colors: ["#10B981", "#047857"] },
  teal: { base: "#0D9488", colors: ["#0D9488", "#115E59"] },
  rose: { base: "#F43F5E", colors: ["#F43F5E", "#9F1239"] },
  amber: { base: "#F59E0B", colors: ["#F59E0B", "#B45309"] },
  indigo: { base: "#6366F1", colors: ["#6366F1", "#4338CA"] },
} as const;

export type AccentName = keyof typeof ACCENTS;
export type GradientColors = readonly [string, string];

/** Soft tint recipe used by Home category tiles: 7% fill, 15% border. */
export function accentTint(accent: AccentName) {
  const { base, colors } = ACCENTS[accent];
  return { base, colors: colors as unknown as [string, string], soft: withAlpha(base, 0.07), border: withAlpha(base, 0.15) };
}

/** Type scale. Spread into a Text `style`; sizes scale with the system font. */
export const TYPOGRAPHY = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "800" },
  h1: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  h2: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
  h3: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
} as const;

/**
 * Subtle card elevation used across the white UI — a soft, low shadow on iOS +
 * a matching Android elevation. Kept gentle so the page still reads as flat and
 * clean (spec: "subtle shadow/elevation, rounded corners").
 */
export const CARD_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 2,
} as const;

/** A slightly stronger lift for hero / feature cards. */
export const CARD_SHADOW_LG = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 20,
  elevation: 4,
} as const;

/** Shadow levels. `CARD_SHADOW` / `CARD_SHADOW_LG` above are `sm` / `lg`-ish and stay for existing callers. */
export const SHADOWS = {
  none: { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  sm: CARD_SHADOW,
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  lg: CARD_SHADOW_LG,
} as const;

export type ShadowLevel = keyof typeof SHADOWS;

/** Coloured, soft, wide shadow used under gradient cards and icon squares. */
export function coloredShadow(color: string, strength: "sm" | "md" | "lg" = "md") {
  const s = { sm: [4, 8, 0.25, 3], md: [10, 18, 0.3, 6], lg: [14, 26, 0.35, 10] }[strength];
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: s[0] },
    shadowRadius: s[1],
    shadowOpacity: s[2],
    elevation: s[3],
  } as const;
}

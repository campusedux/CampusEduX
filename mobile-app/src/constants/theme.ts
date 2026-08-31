export const COLORS = {
  primary: "#4F39F6",
  primaryDark: "#3730A3",
  primaryLight: "#EEF0FF",
  background: "#FFFFFF",
  surface: "#F8F9FC",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 } as const;

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

import { alpha } from "./colorUtils";

/**
 * Semantic colour tokens for the Learning UI. Components NEVER hard-code a hex:
 * they read `useTheme().colors` (light / dark / AMOLED variants below).
 *
 * Contrast (verified in tests/unit/theme/theme.test.ts, WCAG AA):
 *   text on bg/surface ≥ 4.5, textSecondary ≥ 4.5, textMuted ≥ 4.5,
 *   callout text on its tint ≥ 4.5, on-gradient white ≥ 3 (large text only).
 */
export type ThemeScheme = "light" | "dark";

export interface CalloutTone {
  /** Tinted box background. */
  bg: string;
  /** 4px left accent border. */
  border: string;
  /** Label + icon colour (AA on `bg`). */
  label: string;
}

export interface ThemeColors {
  scheme: ThemeScheme;
  // grounds
  bg: string;
  /** Page ground behind cards. */
  canvas: string;
  surface: string;
  surfaceRaised: string;
  surfacePressed: string;
  border: string;
  borderSoft: string;
  divider: string;
  // text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;
  // brand
  primary: string;
  primaryText: string;
  primarySoft: string;
  link: string;
  // status
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  // inline code (pill)
  inlineCodeBg: string;
  inlineCodeText: string;
  // code block card — dark in BOTH themes
  codeBg: string;
  codeBorder: string;
  codeHeader: string;
  codeText: string;
  codeMuted: string;
  codeLineNumber: string;
  // syntax highlighting (tuned for `codeBg`)
  syntax: { keyword: string; string: string; number: string; comment: string; fn: string; type: string; operator: string };
  // reader callouts
  callout: { definition: CalloutTone; why: CalloutTone; example: CalloutTone; warning: CalloutTone; key: CalloutTone };
  // loaders / overlays
  skeleton: string;
  skeletonHighlight: string;
  overlay: string;
  shadow: string;
  /** Streak / fire accent. */
  streak: string;
}

const SYNTAX = {
  keyword: "#C4B5FD",
  string: "#86EFAC",
  number: "#FCD34D",
  comment: "#7C8AA5",
  fn: "#7DD3FC",
  type: "#F9A8D4",
  operator: "#CBD5E1",
};

const CODE = {
  codeBg: "#0F172A",
  codeBorder: "#1E293B",
  codeHeader: "#172033",
  codeText: "#E2E8F0",
  codeMuted: "#94A3B8",
  codeLineNumber: "#64748B",
  syntax: SYNTAX,
};

export const LIGHT_COLORS: ThemeColors = {
  scheme: "light",
  bg: "#FFFFFF",
  canvas: "#F5F6FB",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfacePressed: "#F1F2F9",
  border: "#E3E6EF",
  borderSoft: "#EEF0F6",
  divider: "#ECEEF5",
  text: "#1F2937",
  textSecondary: "#4B5563",
  textMuted: "#5F6B7A",
  textOnAccent: "#FFFFFF",
  primary: "#4F46E5",
  primaryText: "#4338CA",
  primarySoft: "#EEF0FF",
  link: "#4338CA",
  success: "#15803D",
  successSoft: "#DCFCE7",
  danger: "#B91C1C",
  dangerSoft: "#FEE2E2",
  warning: "#B45309",
  inlineCodeBg: "#EEF0FF",
  inlineCodeText: "#4338CA",
  ...CODE,
  callout: {
    definition: { bg: "#EEF2FF", border: "#6366F1", label: "#4338CA" },
    why: { bg: "#EFF6FF", border: "#3B82F6", label: "#1D4ED8" },
    example: { bg: "#ECFDF5", border: "#10B981", label: "#047857" },
    warning: { bg: "#FFFBEB", border: "#F59E0B", label: "#92400E" },
    key: { bg: "#F5F3FF", border: "#8B5CF6", label: "#6D28D9" },
  },
  skeleton: "#E9ECF3",
  skeletonHighlight: "#F7F8FC",
  overlay: alpha("#0F172A", 0.5),
  shadow: "#0F172A",
  streak: "#EA580C",
};

export const DARK_COLORS: ThemeColors = {
  scheme: "dark",
  bg: "#0B0F19",
  canvas: "#080B12",
  surface: "#131A29",
  surfaceRaised: "#1A2233",
  surfacePressed: "#1F2940",
  border: "#27314A",
  borderSoft: "#1D263B",
  divider: "#1F283D",
  text: "#E5E7EB",
  textSecondary: "#B4BCCB",
  textMuted: "#98A2B3",
  textOnAccent: "#FFFFFF",
  primary: "#818CF8",
  primaryText: "#A5B4FC",
  primarySoft: alpha("#818CF8", 0.16),
  link: "#A5B4FC",
  success: "#4ADE80",
  successSoft: alpha("#4ADE80", 0.16),
  danger: "#F87171",
  dangerSoft: alpha("#F87171", 0.16),
  warning: "#FBBF24",
  inlineCodeBg: alpha("#818CF8", 0.2),
  inlineCodeText: "#C7D2FE",
  ...CODE,
  codeBg: "#070B14",
  codeBorder: "#1E2A44",
  callout: {
    definition: { bg: alpha("#6366F1", 0.16), border: "#818CF8", label: "#C7D2FE" },
    why: { bg: alpha("#3B82F6", 0.16), border: "#60A5FA", label: "#BFDBFE" },
    example: { bg: alpha("#10B981", 0.16), border: "#34D399", label: "#A7F3D0" },
    warning: { bg: alpha("#F59E0B", 0.16), border: "#FBBF24", label: "#FDE68A" },
    key: { bg: alpha("#8B5CF6", 0.18), border: "#A78BFA", label: "#DDD6FE" },
  },
  skeleton: "#1B2438",
  skeletonHighlight: "#26314B",
  overlay: alpha("#000000", 0.65),
  shadow: "#000000",
  streak: "#FB923C",
};

/** True-black variant for OLED, applied when `preferences.useAmoledDark` is on. */
export const AMOLED_COLORS: ThemeColors = {
  ...DARK_COLORS,
  bg: "#000000",
  canvas: "#000000",
  surface: "#0B0F19",
  surfaceRaised: "#131A29",
  codeBg: "#04070D",
};

export function getColors(scheme: ThemeScheme, amoled = false): ThemeColors {
  if (scheme === "light") return LIGHT_COLORS;
  return amoled ? AMOLED_COLORS : DARK_COLORS;
}

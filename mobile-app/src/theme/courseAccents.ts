import type { Ionicons } from "@expo/vector-icons";
import { alpha, darken, ensureContrast, lighten } from "./colorUtils";
import type { ThemeScheme } from "./colors";

/**
 * Per-course identity. Each course keeps ONE accent used on its card, hero,
 * progress bars, reader number badges, bold terms and table headers.
 * Gradient stops are dark enough for white text (≥ 3:1, large/bold text);
 * `text.*` are AA (≥ 4.5:1) accent colours for body-size text on the surface
 * in each scheme.
 */
export type CourseKey = "dbms" | "java" | "aiml" | "python" | "genai" | "default";

export interface CourseAccent {
  key: CourseKey;
  base: string;
  gradient: readonly [string, string];
  text: { light: string; dark: string };
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
}

export const COURSE_ACCENTS: Record<CourseKey, CourseAccent> = {
  dbms: {
    key: "dbms",
    base: "#2563EB",
    gradient: ["#2563EB", "#1E40AF"],
    text: { light: "#1D4ED8", dark: "#93C5FD" },
    icon: "server-outline",
    emoji: "🗄️",
  },
  java: {
    key: "java",
    base: "#EA580C",
    gradient: ["#EA580C", "#B45309"],
    text: { light: "#C2410C", dark: "#FDBA74" },
    icon: "cafe-outline",
    emoji: "☕",
  },
  aiml: {
    key: "aiml",
    base: "#0D9488",
    gradient: ["#0D9488", "#115E59"],
    text: { light: "#0F766E", dark: "#5EEAD4" },
    icon: "hardware-chip-outline",
    emoji: "🤖",
  },
  python: {
    key: "python",
    base: "#16A34A",
    gradient: ["#15803D", "#A16207"],
    text: { light: "#15803D", dark: "#86EFAC" },
    icon: "logo-python",
    emoji: "🐍",
  },
  genai: {
    key: "genai",
    base: "#9333EA",
    gradient: ["#7C3AED", "#BE185D"],
    text: { light: "#6D28D9", dark: "#D8B4FE" },
    icon: "sparkles-outline",
    emoji: "✨",
  },
  default: {
    key: "default",
    base: "#4F46E5",
    gradient: ["#4F46E5", "#3730A3"],
    text: { light: "#4338CA", dark: "#A5B4FC" },
    icon: "book-outline",
    emoji: "📚",
  },
};

/** Order matters: "Generative AI" must win over the generic AI/ML rule. */
const RULES: readonly { key: CourseKey; re: RegExp }[] = [
  { key: "genai", re: /gen(erative)?[\s_-]*ai|\bllms?\b|prompt[\s_-]*engineering|chatgpt/i },
  { key: "aiml", re: /\bai\b|\bml\b|machine[\s_-]*learning|deep[\s_-]*learning|artificial/i },
  { key: "dbms", re: /dbms|\bsql\b|database|mysql|postgres/i },
  { key: "java", re: /\bjava\b/i },
  { key: "python", re: /python/i },
];

export function courseKeyFor(input: { slug?: string | null; name?: string | null }): CourseKey | null {
  const hay = `${input.slug ?? ""} ${input.name ?? ""}`;
  return RULES.find((r) => r.re.test(hay))?.key ?? null;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Build an accent from an arbitrary admin-supplied hex (future courses). */
export function deriveAccent(hex: string): CourseAccent {
  return {
    key: "default",
    base: hex,
    gradient: [ensureContrast(hex, "#FFFFFF", 4.5), darken(ensureContrast(hex, "#FFFFFF", 4.5), 0.35)],
    text: { light: ensureContrast(hex, "#FFFFFF", 4.5), dark: ensureContrast(lighten(hex, 0.45), "#131A29", 4.5) },
    icon: "book-outline",
    emoji: "📚",
  };
}

/**
 * Known course (by slug/name) → its fixed identity. Unknown course → the
 * admin's `accent_color` if it is a valid hex (derived, AA-safe), else brand indigo.
 */
export function resolveCourseAccent(input: {
  slug?: string | null;
  name?: string | null;
  accentColor?: string | null;
}): CourseAccent {
  const key = courseKeyFor(input);
  if (key) return COURSE_ACCENTS[key];
  if (input.accentColor && HEX.test(input.accentColor.trim())) return deriveAccent(input.accentColor.trim());
  return COURSE_ACCENTS.default;
}

export interface AccentTokens {
  key: CourseKey;
  base: string;
  gradient: readonly [string, string];
  /** Accent for text/icons on the page surface (AA). */
  text: string;
  /** Soft tinted fill (chips, icon tiles, table header, callout-less accents). */
  soft: string;
  /** Subtle accent border. */
  border: string;
  /** Text colour on top of the gradient. */
  onGradient: string;
  icon: CourseAccent["icon"];
  emoji: string;
}

/** Scheme-specific tokens for an accent. */
export function accentTokens(accent: CourseAccent, scheme: ThemeScheme): AccentTokens {
  const dark = scheme === "dark";
  return {
    key: accent.key,
    base: accent.base,
    gradient: accent.gradient,
    text: dark ? accent.text.dark : accent.text.light,
    soft: alpha(accent.base, dark ? 0.2 : 0.1),
    border: alpha(accent.base, dark ? 0.4 : 0.22),
    onGradient: "#FFFFFF",
    icon: accent.icon,
    emoji: accent.emoji,
  };
}

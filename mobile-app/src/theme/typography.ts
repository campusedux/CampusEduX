import { Platform, type TextStyle } from "react-native";
import { BREAKPOINTS } from "./spacing";

/**
 * Learning type system. Inter for UI + reading text, JetBrains Mono for code.
 * Custom fonts on Android/iOS are selected by *family name per weight* (a
 * `fontWeight` on a custom family is ignored on Android), so each weight maps
 * to its own family. Until the fonts finish loading (or if they fail) the
 * system font stack is used — see `useLearningFonts` in ./fonts.
 */
export const FONT_FAMILY = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;

export type FontKey = keyof typeof FONT_FAMILY;

const WEB_UI_FALLBACK = `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
const WEB_MONO_FALLBACK = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

/** Resolve a font key to a `fontFamily`. On web we append a CSS fallback stack; native falls back to system automatically. */
export function fontFamily(key: FontKey, loaded = true): string | undefined {
  const isMono = key === "mono" || key === "monoMedium";
  if (Platform.OS === "web") {
    return `${loaded ? `${FONT_FAMILY[key]}, ` : ""}${isMono ? WEB_MONO_FALLBACK : WEB_UI_FALLBACK}`;
  }
  if (!loaded) return isMono ? Platform.select({ ios: "Menlo", default: "monospace" }) : undefined;
  return FONT_FAMILY[key];
}

export type TypeVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "bodyStrong"
  | "title"
  | "label"
  | "button"
  | "small"
  | "caption"
  | "overline"
  | "code"
  | "codeInline";

interface Spec {
  font: FontKey;
  /** [phone, wide(≥768)] font size */
  size: readonly [number, number];
  /** [phone, wide] line height */
  line: readonly [number, number];
  tracking?: number;
  upper?: boolean;
}

/**
 * The scale. Phone values are the spec (Display 28/36, H1 26/34, H2 21/30,
 * H3 18/26, Body 17/28, Small 13/18, Code 14.5/22); wide values lift reading
 * text to 18 and the topic title to 32. `title`/`label`/`button` are the UI
 * (non-reading) sizes used in cards, rows and chips.
 */
export const TYPE_SCALE: Record<TypeVariant, Spec> = {
  display: { font: "bold", size: [28, 34], line: [36, 42], tracking: -0.4 },
  h1: { font: "bold", size: [26, 32], line: [34, 40], tracking: -0.3 },
  h2: { font: "semibold", size: [21, 24], line: [30, 34], tracking: -0.2 },
  h3: { font: "semibold", size: [18, 20], line: [26, 28] },
  h4: { font: "semibold", size: [16, 17], line: [24, 26] },
  body: { font: "regular", size: [17, 18], line: [28, 30] },
  bodyStrong: { font: "semibold", size: [17, 18], line: [28, 30] },
  title: { font: "semibold", size: [16, 17], line: [22, 24] },
  label: { font: "medium", size: [14, 14], line: [20, 20] },
  button: { font: "semibold", size: [15, 16], line: [20, 22] },
  small: { font: "regular", size: [13, 14], line: [18, 20] },
  caption: { font: "medium", size: [12, 12], line: [16, 16] },
  overline: { font: "bold", size: [11, 12], line: [14, 16], tracking: 0.7, upper: true },
  code: { font: "mono", size: [14.5, 15], line: [22, 23] },
  codeInline: { font: "mono", size: [14.5, 15], line: [22, 23] },
};

/** Variants that scale with the reader "Aa" control (reading text only — not UI chrome). */
const READER_VARIANTS: ReadonlySet<TypeVariant> = new Set(["h1", "h2", "h3", "h4", "body", "bodyStrong", "code", "codeInline"]);

export type ReaderFontSize = "small" | "medium" | "large";

/** Multipliers for the reader font-size control. `small` still keeps body ≥ 16px (17 × 0.95). */
export const READER_FONT_SCALE: Record<ReaderFontSize, number> = { small: 0.95, medium: 1, large: 1.15 };

/** Cap OS font scaling so extreme accessibility sizes don't break the layout (still generous). */
export const MAX_FONT_SCALE = 1.4;

export interface TypeOptions {
  /** Viewport width; ≥ 768 uses the wide column of the scale. */
  width?: number;
  reader?: ReaderFontSize;
  fontsLoaded?: boolean;
}

/** Pure: variant → RN text style. */
export function typeStyle(variant: TypeVariant, opts: TypeOptions = {}): TextStyle {
  const { width = 0, reader = "medium", fontsLoaded = true } = opts;
  const spec = TYPE_SCALE[variant];
  const i = width >= BREAKPOINTS.wide ? 1 : 0;
  const k = READER_VARIANTS.has(variant) ? READER_FONT_SCALE[reader] : 1;
  const style: TextStyle = {
    fontFamily: fontFamily(spec.font, fontsLoaded),
    fontSize: Math.round(spec.size[i] * k * 2) / 2,
    lineHeight: Math.round(spec.line[i] * k),
  };
  if (spec.tracking) style.letterSpacing = spec.tracking;
  if (spec.upper) style.textTransform = "uppercase";
  return style;
}

/** Pure: a full map of styles for a viewport, memo-friendly. */
export function buildTypography(opts: TypeOptions = {}): Record<TypeVariant, TextStyle> {
  const out = {} as Record<TypeVariant, TextStyle>;
  (Object.keys(TYPE_SCALE) as TypeVariant[]).forEach((v) => {
    out[v] = typeStyle(v, opts);
  });
  return out;
}

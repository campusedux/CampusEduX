import { createContext, useContext, useMemo } from "react";
import { Platform, useColorScheme, useWindowDimensions, type TextStyle, type ViewStyle } from "react-native";
import { useSettingsStore } from "@/store/settingsStore";
import { getColors, type ThemeColors, type ThemeScheme } from "./colors";
import { resolveScheme } from "./scheme";
import { accentTokens, resolveCourseAccent, type AccentTokens } from "./courseAccents";
import { gridColumns, isWide, LAYOUT } from "./spacing";
import { buildTypography, type ReaderFontSize, type TypeVariant } from "./typography";
import { useLearningFonts } from "./fonts";

/** Provided by the Topic Reader so every descendant's `useTheme()` picks up the "Aa" size without prop drilling. */
export const ReaderSizeContext = createContext<ReaderFontSize>("medium");

export interface Theme {
  scheme: ThemeScheme;
  isDark: boolean;
  colors: ThemeColors;
  /** Text styles keyed by variant, already sized for the current viewport. */
  type: Record<TypeVariant, TextStyle>;
  width: number;
  wide: boolean;
  columns: 1 | 2 | 3;
  /** Horizontal page gutter for the current viewport. */
  gutter: number;
  fontsLoaded: boolean;
  /** Elevation for cards: soft shadow in light, hairline-border-only in dark. */
  shadow: (level?: "sm" | "md" | "lg") => ViewStyle;
  /** Accent tokens for a course, in the active scheme. */
  accentFor: (course: { slug?: string | null; name?: string | null; accentColor?: string | null }) => AccentTokens;
}

/**
 * The single hook every Learning component uses. Resolves light/dark from the
 * app's Theme preference (light | dark | system, + AMOLED) and the OS scheme,
 * and the type scale from the viewport width + the reader font-size choice.
 */
export function useTheme(options: { reader?: ReaderFontSize } = {}): Theme {
  const system = useColorScheme();
  const pref = useSettingsStore((s) => s.preferences.theme);
  const amoled = useSettingsStore((s) => s.preferences.useAmoledDark);
  const { width } = useWindowDimensions();
  const fontsLoaded = useLearningFonts();
  const contextReader = useContext(ReaderSizeContext);
  const reader = options.reader ?? contextReader;

  const scheme: ThemeScheme = resolveScheme(pref, system);

  return useMemo<Theme>(() => {
    const colors = getColors(scheme, amoled);
    const wide = isWide(width);
    return {
      scheme,
      isDark: scheme === "dark",
      colors,
      type: buildTypography({ width, reader, fontsLoaded }),
      width,
      wide,
      columns: gridColumns(width),
      gutter: wide ? LAYOUT.gutter.wide : LAYOUT.gutter.phone,
      fontsLoaded,
      shadow: (level = "sm") => {
        if (scheme === "dark") return { borderWidth: 1, borderColor: colors.border };
        const s = { sm: [4, 12, 0.06, 2], md: [8, 20, 0.09, 4], lg: [14, 30, 0.13, 8] }[level];
        return Platform.select<ViewStyle>({
          web: { boxShadow: `0 ${s[0]}px ${s[1]}px rgba(15,23,42,${s[2]})` } as ViewStyle,
          default: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: s[0] },
            shadowRadius: s[1],
            shadowOpacity: s[2],
            elevation: s[3],
          },
        }) as ViewStyle;
      },
      accentFor: (course) => accentTokens(resolveCourseAccent(course), scheme),
    };
  }, [scheme, amoled, width, reader, fontsLoaded]);
}

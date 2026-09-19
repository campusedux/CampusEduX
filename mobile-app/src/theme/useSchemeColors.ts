import { useColorScheme } from "react-native";
import { useSettingsStore } from "@/store/settingsStore";
import { getColors, type ThemeColors, type ThemeScheme } from "./colors";
import { resolveScheme } from "./scheme";

/**
 * Colours + scheme only — no fonts, no viewport. Cheap enough for shared chrome
 * (Screen, tab bar, drawer). Honours the Light / Dark / System preference and AMOLED.
 */
export function useSchemeColors(): { scheme: ThemeScheme; isDark: boolean; colors: ThemeColors } {
  const system = useColorScheme();
  const pref = useSettingsStore((s) => s.preferences.theme);
  const amoled = useSettingsStore((s) => s.preferences.useAmoledDark);
  const scheme = resolveScheme(pref, system);
  return { scheme, isDark: scheme === "dark", colors: getColors(scheme, amoled) };
}

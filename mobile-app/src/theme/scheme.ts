import type { AppTheme } from "@/types";
import type { ThemeScheme } from "./colors";

/**
 * Where dark mode is applied.
 *  - "learning": only screens/chrome that have been migrated to the theme (the Learning flow, tab bar on the
 *    Learning tab, drawer). Every other screen keeps its light look even when the app is set to Dark — those
 *    screens hard-code dark-gray text and would be unreadable on a dark ground.
 *  - "all": every `Screen` and the whole tab bar follow the theme (flip once the rest of the app is migrated).
 */
export const DARK_MODE_SCOPE: "learning" | "all" = "learning";

/** Light / Dark / System preference + OS scheme → the scheme to render. */
export function resolveScheme(pref: AppTheme | undefined, system: string | null | undefined): ThemeScheme {
  if (pref === "dark") return "dark";
  if (pref === "system") return system === "dark" ? "dark" : "light";
  return "light";
}

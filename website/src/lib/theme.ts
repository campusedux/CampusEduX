/**
 * Light / dark / system theme. The choice lives in localStorage (a per-device
 * display preference — nothing to sync); "system" follows
 * `prefers-color-scheme` live. The resolved theme is a `dark` class on <html>.
 */
export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "cex-theme";

/**
 * Inline, render-blocking script for <head>: applies the stored/system theme
 * before first paint so there is no light→dark flash. Kept tiny and
 * dependency-free; the CSP already allows inline scripts.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||((p===null||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export function readThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Persist a preference and apply it to <html> without animating every colour. */
export function applyThemePreference(pref: ThemePreference): void {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage blocked — still apply for this page view */
  }
  const root = document.documentElement;
  const dark = pref === "dark" || (pref === "system" && systemPrefersDark());
  root.classList.add("theme-switching");
  root.classList.toggle("dark", dark);
  // Two frames: let the new colours paint before re-enabling transitions.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}

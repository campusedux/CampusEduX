/**
 * Persisted panel geometry for the `/coding-problems/[slug]` IDE workspace.
 *
 * One `localStorage` key holds every resizable split on the page as a single
 * JSON blob, so a reload restores the whole layout at once. Each value is the
 * first pane's size as a percentage of its container:
 *
 *   left   — Problem panel  ↔ Compiler panel   (vertical divider)
 *   editor — Code editor    ↔ Input/Output row  (horizontal divider)
 *   io     — Input panel    ↔ Output panel      (vertical divider)
 *
 * Framework-free and defensive: every read/write is wrapped so a disabled or
 * full storage (private window, quota) never breaks the page — the workspace
 * just falls back to the defaults below.
 */

export const CODING_LAYOUT_STORAGE_KEY = "campusedux-coding-layout";
export const CODING_EDITOR_THEME_STORAGE_KEY = "campusedux-coding-editor-theme";

export type CodingLayoutKey = "left" | "editor" | "io";

/** Sensible starting split when nothing is stored yet. */
export const CODING_LAYOUT_DEFAULTS: Record<CodingLayoutKey, number> = {
  left: 40, // Problem 40% / Compiler 60%
  editor: 65, // Editor 65% / Input+Output 35%
  io: 50, // Input 50% / Output 50%
};

type StoredLayout = Partial<Record<CodingLayoutKey, number>>;

function readAll(): StoredLayout {
  try {
    const raw = window.localStorage.getItem(CODING_LAYOUT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: StoredLayout = {};
    for (const key of ["left", "editor", "io"] as const) {
      const v = (parsed as Record<string, unknown>)[key];
      if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Current stored size for one split, or `undefined` to use the default. */
export function loadCodingLayout(key: CodingLayoutKey): number | undefined {
  return readAll()[key];
}

/** Merge one split's new size into the stored blob. */
export function saveCodingLayout(key: CodingLayoutKey, pct: number): void {
  if (!Number.isFinite(pct)) return;
  try {
    const next = { ...readAll(), [key]: Math.round(pct * 100) / 100 };
    window.localStorage.setItem(CODING_LAYOUT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage disabled / full — layout just won't persist */
  }
}

export type CodingEditorTheme = "dark" | "light";

export function loadCodingEditorTheme(): CodingEditorTheme {
  try {
    return window.localStorage.getItem(CODING_EDITOR_THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function saveCodingEditorTheme(theme: CodingEditorTheme): void {
  try {
    window.localStorage.setItem(CODING_EDITOR_THEME_STORAGE_KEY, theme);
  } catch {
    /* non-fatal */
  }
}

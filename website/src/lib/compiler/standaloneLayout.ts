/**
 * Persisted panel geometry + editor theme for the standalone Online Compiler
 * (`/compiler`, `/practice/compiler`, and the tutorial "Run Code" hand-off — all
 * one shared `CompilerWorkspace`).
 *
 * Deliberately separate from `codingLayout.ts` (the `/coding-problems/[slug]`
 * IDE): the two workspaces are different contexts and must be free to diverge,
 * so they keep their own `localStorage` keys and their own defaults.
 *
 *   editor — Code editor ↔ Input/Output row   (horizontal divider, %)
 *   io     — Input panel ↔ Output panel        (vertical divider, %)
 *
 * Every read/write is wrapped so a disabled or full storage (private window,
 * quota) can never break the page — it just falls back to the defaults below.
 */

export const COMPILER_LAYOUT_STORAGE_KEY = "campusedux-compiler-layout";
export const COMPILER_EDITOR_THEME_STORAGE_KEY = "campusedux-compiler-editor-theme";

export type CompilerLayoutKey = "editor" | "io";

/** Sensible starting split when nothing is stored yet. */
export const COMPILER_LAYOUT_DEFAULTS: Record<CompilerLayoutKey, number> = {
  editor: 62, // Editor 62% / Input+Output 38%
  io: 50, // Input 50% / Output 50%
};

type StoredLayout = Partial<Record<CompilerLayoutKey, number>>;

function readAll(): StoredLayout {
  try {
    const raw = window.localStorage.getItem(COMPILER_LAYOUT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: StoredLayout = {};
    for (const key of ["editor", "io"] as const) {
      const v = (parsed as Record<string, unknown>)[key];
      if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Current stored size for one split, or `undefined` to use the default. */
export function loadCompilerLayout(key: CompilerLayoutKey): number | undefined {
  return readAll()[key];
}

/** Merge one split's new size into the stored blob. */
export function saveCompilerLayout(key: CompilerLayoutKey, pct: number): void {
  if (!Number.isFinite(pct)) return;
  try {
    const next = { ...readAll(), [key]: Math.round(pct * 100) / 100 };
    window.localStorage.setItem(COMPILER_LAYOUT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage disabled / full — layout just won't persist */
  }
}

export type CompilerEditorTheme = "dark" | "light";

export function loadCompilerEditorTheme(): CompilerEditorTheme {
  try {
    return window.localStorage.getItem(COMPILER_EDITOR_THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function saveCompilerEditorTheme(theme: CompilerEditorTheme): void {
  try {
    window.localStorage.setItem(COMPILER_EDITOR_THEME_STORAGE_KEY, theme);
  } catch {
    /* non-fatal */
  }
}

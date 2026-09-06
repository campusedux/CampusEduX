import { resolveLanguage, DEFAULT_LANGUAGE_ID } from "./languages";

/**
 * How a runnable code block on a tutorial page hands its code to `/compiler`.
 *
 * Small snippets ride in the URL (`?code=`), which keeps deep links shareable.
 * Anything larger than `INLINE_CODE_LIMIT` would make an unwieldy URL, so the
 * caller stashes it in `sessionStorage` under `HANDOFF_STORAGE_KEY` and the
 * compiler picks it up via `?from=handoff`. Pure + framework-free so it is
 * unit-testable and safe on both server and client.
 */
export const HANDOFF_STORAGE_KEY = "campusedux:compiler:handoff";
export const DRAFT_STORAGE_PREFIX = "campusedux:compiler:draft:";

/** Above this many characters, pass code via sessionStorage instead of the URL. */
export const INLINE_CODE_LIMIT = 1_500;

export interface HandoffPayload {
  language: string;
  code: string;
}

export interface BuildHrefOptions {
  language: string | null | undefined;
  code?: string;
  autorun?: boolean;
}

export interface BuildHrefResult {
  href: string;
  /** When set, the caller must `sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(handoff))` before navigating. */
  handoff: HandoffPayload | null;
}

export function buildCompilerHref({ language, code, autorun }: BuildHrefOptions): BuildHrefResult {
  const lang = resolveLanguage(language)?.id ?? DEFAULT_LANGUAGE_ID;
  const params = new URLSearchParams({ language: lang });
  const trimmed = (code ?? "").length > 0 ? code! : "";

  let handoff: HandoffPayload | null = null;
  if (trimmed) {
    if (trimmed.length <= INLINE_CODE_LIMIT) {
      params.set("code", trimmed);
    } else {
      params.set("from", "handoff");
      handoff = { language: lang, code: trimmed };
    }
  }
  if (autorun) params.set("autorun", "1");

  return { href: `/compiler?${params.toString()}`, handoff };
}

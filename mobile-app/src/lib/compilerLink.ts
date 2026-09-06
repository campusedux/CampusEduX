import { BRAND } from "@/constants/brand";

/**
 * The CampusEduX online code compiler lives on the WEBSITE only. The mobile app
 * never bundles an editor or an execution engine — where a programming tutorial
 * shows runnable code, it links out to the website compiler instead.
 *
 * Keep the small language table here in sync with the website's canonical
 * registry (`website/src/lib/compiler/languages.ts`).
 */
const CANONICAL_BY_ALIAS: Record<string, string> = {
  java: "java",
  javascript: "javascript",
  js: "javascript",
  node: "javascript",
  nodejs: "javascript",
  python: "python",
  python3: "python",
  py: "python",
  c: "c",
  gcc: "c",
  cpp: "cpp",
  "c++": "cpp",
  cc: "cpp",
  cplusplus: "cpp",
  "g++": "cpp",
};

/** Above this many characters, open the compiler with the language only (it
 *  falls back to starter code) rather than stuffing a huge program into a URL. */
const INLINE_CODE_LIMIT = 1200;

/** Canonical compiler language id for a markdown fence tag, or `null` if the
 *  website compiler can't run it. */
export function resolveCompilerLanguage(tag: string | null | undefined): string | null {
  if (!tag) return null;
  return CANONICAL_BY_ALIAS[tag.trim().toLowerCase()] ?? null;
}

export function isRunnableLang(tag: string | null | undefined): boolean {
  return resolveCompilerLanguage(tag) !== null;
}

/** Reusable base URL for the website compiler — real domain, from BRAND config. */
export const COMPILER_URL = `${BRAND.website.replace(/\/$/, "")}/compiler`;

/**
 * Absolute website URL that opens the compiler for `langTag`, preloading `code`
 * when it's small enough to travel in the query string.
 */
export function compilerUrl(langTag: string | null | undefined, code?: string): string {
  const language = resolveCompilerLanguage(langTag) ?? "java";
  // Built by hand (not URLSearchParams) — React Native's URL polyfill has
  // historically been unreliable at percent-encoding query values.
  let query = `language=${encodeURIComponent(language)}`;
  const raw = code ?? "";
  if (raw.trim() && raw.length <= INLINE_CODE_LIMIT) {
    query += `&code=${encodeURIComponent(raw)}&autorun=1`;
  }
  return `${COMPILER_URL}?${query}`;
}

/**
 * Absolute website URL for a topic Coding Problem's full page (statement +
 * editor + compiler). The mobile app shows the problem read-only and hands this
 * URL to the browser via a "Solve on Website" action — code execution is
 * website-only (master prompt §4, §15). `slug` is the stable global slug from
 * `dsa_problems.slug` (migration 0048/025).
 */
export function codingProblemUrl(slug: string): string {
  const base = BRAND.website.replace(/\/$/, "");
  return `${base}/coding-problems/${encodeURIComponent(slug)}`;
}

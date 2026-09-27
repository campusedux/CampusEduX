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

/** JDK annotations usable without an import (java.lang and the java.lang.annotation meta-annotations). */
const JDK_ANNOTATIONS = new Set([
  "Override", "FunctionalInterface", "SuppressWarnings", "Deprecated", "SafeVarargs",
  "Retention", "Target", "Documented", "Inherited", "Repeatable", "Native",
]);
/** One left-to-right pass, so `"/*"` in a string or a `'"'` char literal is read the way javac reads it. */
const COMMENTS_AND_LITERALS = /"""[\s\S]*?"""|\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g;
const IMPORT = /\bimport\s+(?:static\s+)?([\w.*]+)\s*;/g;
/** A third-party package name used in code, not preceded by a dot (so `java.net.http` is fine). */
const THIRD_PARTY_NAME = /(?:^|[^\w.])(?:org|com|jakarta|javax|io|net|lombok|tools)\.[a-z_]\w*\./;

/**
 * Whether a Java snippet needs nothing beyond the JDK — the website compiler
 * runs one file with no other library. Every import must start with `java.`;
 * no annotation other than the JDK's own, and no fully-qualified third-party
 * name. Comments and string literals are ignored. Same rule as the website's
 * `usesOnlyJdk` (`website/src/lib/compiler/languages.ts`).
 */
export function usesOnlyJdk(code: string): boolean {
  const src = code
    .replace(COMMENTS_AND_LITERALS, " ")
    .replace(/^\s*package\s+[\w.]+\s*;/gm, " "); // the snippet's own package is not a dependency
  const imports = Array.from(src.matchAll(IMPORT), (m) => m[1]);
  if (!imports.every((name) => name.startsWith("java."))) return false;
  const body = src.replace(IMPORT, " ");
  const declared = new Set(Array.from(body.matchAll(/@\s*interface\s+([A-Za-z_]\w*)/g), (m) => m[1]));
  const annotationOk = (name: string) =>
    name === "interface" || (name.includes(".") ? name.startsWith("java.") : JDK_ANNOTATIONS.has(name) || declared.has(name));
  if (!Array.from(body.matchAll(/@\s*([A-Za-z_][\w.]*)/g), (m) => m[1]).every(annotationOk)) return false;
  return !THIRD_PARTY_NAME.test(body);
}

/** Whether a fenced snippet can run on the website compiler: a supported language, and for Java, JDK-only code. */
export function canRunInCompiler(tag: string | null | undefined, code: string): boolean {
  const language = resolveCompilerLanguage(tag);
  if (!language) return false;
  return language !== "java" || usesOnlyJdk(code);
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

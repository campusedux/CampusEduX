/**
 * Language registry for the CampusEduX online compiler.
 *
 * Pure data + helpers — no React, no server imports — so it is safe to import
 * from client components, the API route and unit tests alike.
 *
 * Adding a language is one entry in `LANGUAGES` below: give it a provider
 * mapping (Paiza / Judge0 CE / Piston), a Prism grammar for the editor, and
 * some starter code. Nothing else in the compiler stack hard-codes a language.
 */

export interface LanguageDef {
  /** Canonical id — also the value sent to `/api/compiler/run` and used in `?language=`. */
  id: string;
  /** Human label for the language `<select>`. */
  label: string;
  /** Extra fence tags / spellings that resolve to this language (lower-case). */
  aliases: string[];
  /** Prism grammar name for editor highlighting (`prismjs/components/prism-<x>`). */
  prism: string;
  /** Monaco-style comment token, used when generating a placeholder file. */
  commentToken: string;
  /** Virtual file name handed to the execution provider. */
  filename: string;
  /** Paiza.IO runner language name (keyless guest sandbox — the default provider). */
  paiza: string;
  /** Judge0 CE `language_id` (stable across the public CE image + RapidAPI). */
  judge0Id: number;
  /** Piston runtime: `language` name + a semver range (`*` = latest installed). */
  piston: { language: string; version: string };
  /** Sensible "hello world" shown when the editor opens with no preloaded code. */
  starter: string;
}

const JAVA_STARTER = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CampusEduX!");
    }
}
`;

const JS_STARTER = `// JavaScript runs on Node.js
console.log("Hello, CampusEduX!");
`;

const PY_STARTER = `print("Hello, CampusEduX!")
`;

const C_STARTER = `#include <stdio.h>

int main(void) {
    printf("Hello, CampusEduX!\\n");
    return 0;
}
`;

const CPP_STARTER = `#include <iostream>

int main() {
    std::cout << "Hello, CampusEduX!" << std::endl;
    return 0;
}
`;

const SQL_STARTER = `-- Write your SQL query here
SELECT 1;
`;

export const LANGUAGES: LanguageDef[] = [
  {
    id: "java",
    label: "Java",
    aliases: ["java"],
    prism: "java",
    commentToken: "//",
    filename: "Main.java",
    paiza: "java",
    judge0Id: 62, // OpenJDK 13.0.1
    piston: { language: "java", version: "*" },
    starter: JAVA_STARTER,
  },
  {
    id: "javascript",
    label: "JavaScript",
    aliases: ["javascript", "js", "node", "nodejs"],
    prism: "javascript",
    commentToken: "//",
    filename: "main.js",
    paiza: "javascript",
    judge0Id: 63, // Node.js 12.14.0
    piston: { language: "javascript", version: "*" },
    starter: JS_STARTER,
  },
  {
    id: "python",
    label: "Python 3",
    aliases: ["python", "python3", "py"],
    prism: "python",
    commentToken: "#",
    filename: "main.py",
    paiza: "python3",
    judge0Id: 71, // Python 3.8.1
    piston: { language: "python", version: "*" },
    starter: PY_STARTER,
  },
  {
    id: "c",
    label: "C",
    aliases: ["c", "gcc"],
    prism: "c",
    commentToken: "//",
    filename: "main.c",
    paiza: "c",
    judge0Id: 50, // GCC 9.2.0
    piston: { language: "c", version: "*" },
    starter: C_STARTER,
  },
  {
    id: "cpp",
    label: "C++",
    aliases: ["cpp", "c++", "cc", "cplusplus", "g++"],
    prism: "cpp",
    commentToken: "//",
    filename: "main.cpp",
    paiza: "cpp",
    judge0Id: 54, // GCC 9.2.0
    piston: { language: "c++", version: "*" },
    starter: CPP_STARTER,
  },
  {
    // SQL coding problems (Learning topic-practice) compose their own script
    // server-side — schema + seed data + the student's query — rather than
    // sending the raw editor contents; see coding_problem_run_cases() and
    // /api/coding-problems/judge. Empirically verified against Paiza's guest
    // sandbox (2026-09): its "mysql" runtime runs the whole script as MySQL
    // and prints a header row + tab-separated values with no configuration
    // needed. Judge0 CE has no MySQL language — its closest is
    // `language_id 82`, "SQL (SQLite 3.27.2)", a DIFFERENT dialect and output
    // shape (no header, pipe-separated). Because COMPILER_PROVIDER is one
    // global choice for every language, SQL problems authored against the
    // default Paiza/MySQL target will not judge correctly if the deployment
    // ever switches to `judge0` — fixing that needs a per-language provider
    // override, which is out of scope here. Piston's "sqlite3" runtime is
    // unverified (piston needs a self-hosted PISTON_URL to use at all).
    id: "sql",
    label: "SQL",
    aliases: ["sql", "mysql"],
    prism: "sql",
    commentToken: "--",
    filename: "main.sql",
    paiza: "mysql",
    judge0Id: 82, // SQL (SQLite 3.27.2) — different dialect/output shape, see note above
    piston: { language: "sqlite3", version: "*" },
    starter: SQL_STARTER,
  },
];

const BY_KEY: Map<string, LanguageDef> = (() => {
  const m = new Map<string, LanguageDef>();
  for (const lang of LANGUAGES) {
    m.set(lang.id, lang);
    for (const alias of lang.aliases) m.set(alias, lang);
  }
  return m;
})();

/** The canonical language ids, in menu order. */
export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id);

/** The default language when a deep link omits `?language=`. */
export const DEFAULT_LANGUAGE_ID = "java";

/**
 * Resolve a fence tag / spelling / alias (case-insensitive) to its
 * `LanguageDef`, or `null` when the compiler does not support it.
 */
export function resolveLanguage(tag: string | null | undefined): LanguageDef | null {
  if (!tag) return null;
  return BY_KEY.get(tag.trim().toLowerCase()) ?? null;
}

/** True when a markdown fence tag maps to a language the compiler can run. */
export function isRunnableLanguage(tag: string | null | undefined): boolean {
  return resolveLanguage(tag) !== null;
}

/** Starter code for a language id/alias, falling back to the default language. */
export function starterFor(tag: string | null | undefined): string {
  return (resolveLanguage(tag) ?? BY_KEY.get(DEFAULT_LANGUAGE_ID)!).starter;
}

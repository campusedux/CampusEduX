import {
  compilerUrl,
  codingProblemUrl,
  isRunnableLang,
  resolveCompilerLanguage,
  COMPILER_URL,
} from "@/lib/compilerLink";
import { BRAND } from "@/constants/brand";

/**
 * The compiler is website-only. These guard the URL the mobile app hands to the
 * browser — it must point at the real site, carry a canonical language, and
 * only inline small snippets.
 */
describe("resolveCompilerLanguage", () => {
  it.each([
    ["java", "java"],
    ["JS", "javascript"],
    ["py", "python"],
    ["c++", "cpp"],
    ["  Java  ", "java"],
  ])("%s -> %s", (input, expected) => {
    expect(resolveCompilerLanguage(input)).toBe(expected);
  });

  it("returns null for languages the website compiler can't run", () => {
    for (const t of ["bash", "sql", "kotlin", "", null, undefined]) {
      expect(resolveCompilerLanguage(t as string)).toBeNull();
    }
  });
});

describe("isRunnableLang", () => {
  it("mirrors resolveCompilerLanguage", () => {
    expect(isRunnableLang("python")).toBe(true);
    expect(isRunnableLang("text")).toBe(false);
  });
});

describe("compilerUrl", () => {
  it("points at the real website compiler route", () => {
    expect(COMPILER_URL).toBe(`${BRAND.website}/compiler`);
    expect(compilerUrl("java")).toContain("https://");
    expect(compilerUrl("java").startsWith(`${BRAND.website}/compiler?`)).toBe(true);
  });

  it("uses the canonical language and defaults unknown tags to java", () => {
    expect(compilerUrl("js")).toContain("language=javascript");
    expect(compilerUrl("brainfuck")).toContain("language=java");
  });

  it("inlines a small snippet with autorun", () => {
    const url = compilerUrl("python", "print('hi')");
    const q = new URLSearchParams(url.split("?")[1]);
    expect(q.get("code")).toBe("print('hi')");
    expect(q.get("autorun")).toBe("1");
  });

  it("omits code (and autorun) for a large snippet", () => {
    const url = compilerUrl("java", "x".repeat(5000));
    const q = new URLSearchParams(url.split("?")[1]);
    expect(q.get("code")).toBeNull();
    expect(q.get("autorun")).toBeNull();
    expect(q.get("language")).toBe("java");
  });
});

describe("codingProblemUrl", () => {
  it("points at the public website /coding-problems/<slug> route", () => {
    expect(codingProblemUrl("print-hello-world")).toBe(`${BRAND.website}/coding-problems/print-hello-world`);
  });
  it("percent-encodes the slug", () => {
    expect(codingProblemUrl("a b/c")).toBe(`${BRAND.website}/coding-problems/a%20b%2Fc`);
  });
});

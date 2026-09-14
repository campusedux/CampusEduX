import { describe, it, expect } from "vitest";
import {
  LANGUAGES,
  LANGUAGE_IDS,
  DEFAULT_LANGUAGE_ID,
  resolveLanguage,
  isRunnableLanguage,
  starterFor,
} from "@/lib/compiler/languages";

describe("language registry", () => {
  it("covers the promised seed set", () => {
    expect(LANGUAGE_IDS).toEqual(expect.arrayContaining(["java", "javascript", "python", "c", "cpp"]));
  });

  it("every entry is fully specified for every provider", () => {
    for (const l of LANGUAGES) {
      expect(l.starter.trim().length).toBeGreaterThan(0);
      expect(l.paiza.length).toBeGreaterThan(0);
      expect(typeof l.judge0Id).toBe("number");
      expect(l.judge0Id).toBeGreaterThan(0);
      expect(l.piston.language.length).toBeGreaterThan(0);
      expect(l.piston.version.length).toBeGreaterThan(0);
      expect(l.prism.length).toBeGreaterThan(0);
      expect(l.filename).toMatch(/\.\w+$/);
    }
  });

  it("the default language exists", () => {
    expect(resolveLanguage(DEFAULT_LANGUAGE_ID)).not.toBeNull();
  });
});

describe("resolveLanguage / alias handling", () => {
  it.each([
    ["js", "javascript"],
    ["JS", "javascript"],
    ["node", "javascript"],
    ["py", "python"],
    ["python3", "python"],
    ["c++", "cpp"],
    ["G++", "cpp"],
    ["  java  ", "java"],
    ["mysql", "sql"],
    ["SQL", "sql"],
  ])("%s resolves to %s", (input, expected) => {
    expect(resolveLanguage(input)?.id).toBe(expected);
  });

  it("returns null for unknown / empty tags", () => {
    for (const v of ["", " ", "ruby", "go", "rust", null, undefined]) {
      expect(resolveLanguage(v as string)).toBeNull();
    }
  });
});

describe("isRunnableLanguage", () => {
  it("true for supported fence tags, false otherwise", () => {
    expect(isRunnableLanguage("java")).toBe(true);
    expect(isRunnableLanguage("py")).toBe(true);
    expect(isRunnableLanguage("bash")).toBe(false);
    expect(isRunnableLanguage("text")).toBe(false);
    expect(isRunnableLanguage(undefined)).toBe(false);
  });
});

describe("starterFor", () => {
  it("returns the language's starter, or the default's for an unknown tag", () => {
    expect(starterFor("python")).toBe(resolveLanguage("python")!.starter);
    expect(starterFor("nonsense")).toBe(resolveLanguage(DEFAULT_LANGUAGE_ID)!.starter);
  });
});

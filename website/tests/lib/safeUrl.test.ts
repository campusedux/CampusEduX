import { describe, it, expect } from "vitest";
import { safeHref } from "@/lib/safeUrl";

describe("safeHref", () => {
  it.each(["https://example.com/a?b=1", "http://example.com", "/projects", "/a/b#c", "  https://x.io  "])("accepts %s", (u) => {
    expect(safeHref(u)).toBe(u.trim());
  });
  it.each([
    "javascript:alert(1)",
    " JaVaScRiPt:alert(1)",
    "data:text/html;base64,AAAA",
    "vbscript:x",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "https://exa\nmple.com",
    "java\tscript:alert(1)",
    "example.com",
    "mailto:a@b.c",
    "ftp://x",
    "https://",
    "",
    "   ",
    null,
    undefined,
  ])("rejects %j", (u) => {
    expect(safeHref(u as string | null | undefined)).toBeNull();
  });
});

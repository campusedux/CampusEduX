import { describe, it, expect } from "vitest";
import { safeInternalPath } from "@/lib/nav";

describe("safeInternalPath", () => {
  it("keeps a same-origin relative path", () => {
    expect(safeInternalPath("/account/wallet")).toBe("/account/wallet");
    expect(safeInternalPath("/projects/abc?x=1")).toBe("/projects/abc?x=1");
  });
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/account");
    expect(safeInternalPath("//evil.com")).toBe("/account");
    expect(safeInternalPath("/\\evil.com")).toBe("/account");
    expect(safeInternalPath("http:/x")).toBe("/account");
  });
  it("rejects empty / non-path / control chars, honours custom fallback", () => {
    expect(safeInternalPath(null)).toBe("/account");
    expect(safeInternalPath("")).toBe("/account");
    expect(safeInternalPath("account")).toBe("/account");
    expect(safeInternalPath("/a\nb")).toBe("/account");
    expect(safeInternalPath(undefined, "/login")).toBe("/login");
  });
});

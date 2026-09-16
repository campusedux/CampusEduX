import { describe, it, expect } from "vitest";
import { safeInternalPath, loginHrefFor } from "@/lib/nav";

describe("safeInternalPath", () => {
  it("keeps a same-origin relative path", () => {
    expect(safeInternalPath("/account/wallet")).toBe("/account/wallet");
    expect(safeInternalPath("/projects/abc?x=1")).toBe("/projects/abc?x=1");
  });
  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/");
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("/\\evil.com")).toBe("/");
    expect(safeInternalPath("http:/x")).toBe("/");
  });
  it("rejects empty / non-path / control chars, honours custom fallback", () => {
    expect(safeInternalPath(null)).toBe("/");
    expect(safeInternalPath("")).toBe("/");
    expect(safeInternalPath("account")).toBe("/");
    expect(safeInternalPath("/a\nb")).toBe("/");
    expect(safeInternalPath(undefined, "/login")).toBe("/login");
  });
});

describe("loginHrefFor", () => {
  it("carries the current page as `next` so login can return to it", () => {
    expect(loginHrefFor("/projects")).toBe("/login?next=%2Fprojects");
    expect(loginHrefFor("/learning/java")).toBe("/login?next=%2Flearning%2Fjava");
    expect(loginHrefFor("/jobs")).toBe("/login?next=%2Fjobs");
  });
  it("does not append `next` when already on /login or /register", () => {
    expect(loginHrefFor("/login")).toBe("/login");
    expect(loginHrefFor("/register")).toBe("/login");
  });
});

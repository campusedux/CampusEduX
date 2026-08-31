import { describe, it, expect } from "vitest";
import { inWindow } from "@/lib/home";

describe("inWindow", () => {
  const now = Date.parse("2026-06-15T12:00:00Z");
  it("is open when both bounds are null", () => {
    expect(inWindow(null, null, now)).toBe(true);
  });
  it("respects a future start", () => {
    expect(inWindow("2026-07-01T00:00:00Z", null, now)).toBe(false);
    expect(inWindow("2026-06-01T00:00:00Z", null, now)).toBe(true);
  });
  it("respects a past end", () => {
    expect(inWindow(null, "2026-06-01T00:00:00Z", now)).toBe(false);
    expect(inWindow(null, "2026-07-01T00:00:00Z", now)).toBe(true);
  });
  it("needs both bounds satisfied", () => {
    expect(inWindow("2026-06-01T00:00:00Z", "2026-07-01T00:00:00Z", now)).toBe(true);
    expect(inWindow("2026-06-20T00:00:00Z", "2026-07-01T00:00:00Z", now)).toBe(false);
  });
});

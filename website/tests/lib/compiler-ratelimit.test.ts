import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, __resetRateLimit } from "@/lib/compiler/rateLimit";

beforeEach(() => __resetRateLimit());

describe("checkRateLimit", () => {
  it("allows up to `max` in a window, then blocks with a Retry-After", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("ip:1.2.3.4", 3, 60_000, now).ok).toBe(true);
    }
    const blocked = checkRateLimit("ip:1.2.3.4", 3, 60_000, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("keeps separate counters per key", () => {
    const now = 2_000_000;
    expect(checkRateLimit("ip:a", 1, 60_000, now).ok).toBe(true);
    expect(checkRateLimit("ip:a", 1, 60_000, now).ok).toBe(false);
    expect(checkRateLimit("ip:b", 1, 60_000, now).ok).toBe(true);
  });

  it("resets once the window has elapsed", () => {
    const start = 3_000_000;
    expect(checkRateLimit("ip:x", 1, 10_000, start).ok).toBe(true);
    expect(checkRateLimit("ip:x", 1, 10_000, start + 5_000).ok).toBe(false);
    expect(checkRateLimit("ip:x", 1, 10_000, start + 10_001).ok).toBe(true);
  });

  it("defaults `now` to Date.now() when omitted", () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    expect(checkRateLimit("ip:clock", 1, 60_000).ok).toBe(true);
    expect(checkRateLimit("ip:clock", 1, 60_000).ok).toBe(false);
    vi.useRealTimers();
  });
});

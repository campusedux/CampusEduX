import { describe, it, expect } from "vitest";
import { formatINR, timeAgo } from "@/lib/format";

describe("formatINR", () => {
  it("formats rupees with the ₹ symbol and no paise", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(1500)).toBe("₹1,500");
    expect(formatINR(29999.5)).toBe("₹30,000");
  });
});

describe("timeAgo", () => {
  it("says 'today' for a very recent date", () => {
    expect(timeAgo(new Date().toISOString())).toBe("today");
  });
  it("pluralises days and months", () => {
    const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
    expect(timeAgo(daysAgo(1))).toBe("1 day ago");
    expect(timeAgo(daysAgo(3))).toBe("3 days ago");
    expect(timeAgo(daysAgo(45))).toBe("1 month ago");
    expect(timeAgo(daysAgo(75))).toBe("2 months ago");
  });
});

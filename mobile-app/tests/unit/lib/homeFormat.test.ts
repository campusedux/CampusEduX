import { cleanText, formatINR, formatSalary, timeAgo, isUsableImageUrl } from "@/lib/homeFormat";

describe("homeFormat", () => {
  it("cleanText strips html/markdown and nullish strings", () => {
    expect(cleanText("<p>Hello <b>world</b></p>")).toBe("Hello world");
    expect(cleanText("## **Bold** [link](http://x.y)")).toBe("Bold link");
    expect(cleanText(null)).toBe("");
    expect(cleanText("undefined")).toBe("");
  });
  it("formatINR uses Indian grouping and hides invalid", () => {
    expect(formatINR(499)).toBe("₹499");
    expect(formatINR(1499)).toBe("₹1,499");
    expect(formatINR(1234567)).toBe("₹12,34,567");
    expect(formatINR(null)).toBe("");
    expect(formatINR(undefined)).toBe("");
  });
  it("formatSalary prefixes bare ranges and hides empties", () => {
    expect(formatSalary("6-10 LPA")).toBe("₹6-10 LPA");
    expect(formatSalary("₹5 LPA")).toBe("₹5 LPA");
    expect(formatSalary("")).toBe("");
  });
  it("timeAgo is relative", () => {
    const now = Date.parse("2026-09-19T00:00:00Z");
    expect(timeAgo("2026-09-19T00:00:00Z", now)).toBe("Today");
    expect(timeAgo("2026-09-17T00:00:00Z", now)).toBe("2 days ago");
    expect(timeAgo("2026-09-01T00:00:00Z", now)).toBe("2 weeks ago");
    expect(timeAgo("bad", now)).toBe("");
  });
  it("isUsableImageUrl", () => {
    expect(isUsableImageUrl("https://a.b/c.png")).toBe(true);
    expect(isUsableImageUrl("")).toBe(false);
    expect(isUsableImageUrl(null)).toBe(false);
  });
});

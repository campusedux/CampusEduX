import { describe, it, expect } from "vitest";
import { safeJsonLd } from "@/components/JsonLd";

describe("safeJsonLd — admin content cannot break out of the <script> tag", () => {
  it("escapes </script>, <, >, & and U+2028/U+2029", () => {
    const out = safeJsonLd({ "@type": "Thing", name: "</script><script>alert(1)</script> & x\u2028y\u2029z" });
    expect(out).not.toContain("</script>");
    expect(out).not.toMatch(/[<>&]/);
    expect(out).not.toMatch(/[\u2028\u2029]/);
    expect(out).toContain("\\u003c/script\\u003e");
    expect(out).toContain("\\u2028");
    // round-trips to valid JSON once un-escaped
    const decoded = out
      .replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&")
      .replace(/\\u2028/g, "\u2028").replace(/\\u2029/g, "\u2029");
    expect(JSON.parse(decoded).name).toContain("alert(1)");
  });
  it("leaves safe content untouched", () => {
    expect(safeJsonLd({ name: "Quantitative Aptitude — Percentage" })).toBe(
      '{"name":"Quantitative Aptitude — Percentage"}',
    );
  });
});

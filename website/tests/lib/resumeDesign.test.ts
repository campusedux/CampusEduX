import { describe, it, expect } from "vitest";
import { sanitizeDesign, resolveDesign, effectiveAccent, isEmptyDesign } from "@/lib/resumeBuilder/design";
import { templateSpec } from "@/lib/resumeBuilder/templateSpecs";

describe("sanitizeDesign", () => {
  it("keeps valid keys and drops unknown / malformed ones", () => {
    expect(
      sanitizeDesign({ accentColor: "#123456", fontFamily: "serif", size: "l", spacing: "relaxed", margin: "wide", headingStyle: "bar", junk: 1 }),
    ).toEqual({ accentColor: "#123456", fontFamily: "serif", size: "l", spacing: "relaxed", margin: "wide", headingStyle: "bar" });
    expect(sanitizeDesign({ accentColor: "red", fontFamily: "comic", size: "xl" })).toEqual({});
    expect(sanitizeDesign(null)).toEqual({});
  });
});

describe("resolveDesign", () => {
  const modern = templateSpec("modern");

  it("returns the base spec unchanged for an empty design", () => {
    expect(resolveDesign(modern, {})).toBe(modern);
    expect(isEmptyDesign({})).toBe(true);
  });

  it("applies font + heading overrides", () => {
    const out = resolveDesign(modern, { fontFamily: "serif", headingStyle: "full-underline" });
    expect(out.fontFamily).toMatch(/Georgia/);
    expect(out.pdfFont).toBe("Times-Roman");
    expect(out.heading).toBe("full-underline");
  });

  it("clamps font size and margins to an ATS-safe floor", () => {
    const tiny = resolveDesign(modern, { size: "s", margin: "narrow", spacing: "compact" });
    expect(tiny.type.body).toBeGreaterThanOrEqual(9.5);
    expect(tiny.type.padding).toBeGreaterThanOrEqual(28);
    expect(tiny.type.sectionGap).toBeGreaterThanOrEqual(10);
  });

  it("lets a custom accent light up an otherwise no-accent template", () => {
    expect(templateSpec("minimal").accent).toBe("none");
    expect(resolveDesign(templateSpec("minimal"), { accentColor: "#0F766E" }).accent).toBe("minimal");
  });

  it("heading 'template' means keep the template's own heading style", () => {
    expect(resolveDesign(modern, { headingStyle: "template" }).heading).toBe(modern.heading);
  });
});

describe("effectiveAccent", () => {
  it("prefers the design override, falls back to the template accent", () => {
    expect(effectiveAccent("#111111", { accentColor: "#abcdef" })).toBe("#abcdef");
    expect(effectiveAccent("#111111", {})).toBe("#111111");
    expect(effectiveAccent("#111111", { accentColor: "not-hex" })).toBe("#111111");
  });
});

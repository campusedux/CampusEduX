import { sanitizeDesign, resolveDesign, effectiveAccent, isEmptyDesign } from "@/services/resumeDesign";
import { templateSpec } from "@/services/resumeTemplateSpecs";

describe("sanitizeDesign (mobile)", () => {
  it("keeps valid keys, drops junk", () => {
    expect(sanitizeDesign({ accentColor: "#112233", size: "l", spacing: "relaxed", junk: 1 })).toEqual({
      accentColor: "#112233",
      size: "l",
      spacing: "relaxed",
    });
    expect(sanitizeDesign({ accentColor: "blue", size: "xxl" })).toEqual({});
    expect(sanitizeDesign(null)).toEqual({});
  });
});

describe("resolveDesign (mobile) — must match the website clamps", () => {
  const modern = templateSpec("modern");

  it("empty design returns the base spec", () => {
    expect(resolveDesign(modern, {})).toBe(modern);
    expect(isEmptyDesign({})).toBe(true);
  });

  it("clamps font size and margin to an ATS-safe floor", () => {
    const tiny = resolveDesign(templateSpec("minimal"), { size: "s", margin: "narrow", spacing: "compact" });
    expect(tiny.type.body).toBeGreaterThanOrEqual(9.5);
    expect(tiny.type.padding).toBeGreaterThanOrEqual(28);
    expect(tiny.type.sectionGap).toBeGreaterThanOrEqual(10);
  });

  it("font + heading overrides apply", () => {
    const out = resolveDesign(modern, { fontFamily: "serif", headingStyle: "full-underline" });
    expect(out.pdfFont).toBe("Times-Roman");
    expect(out.heading).toBe("full-underline");
    expect(out.fontFamily).toMatch(/Georgia/);
  });

  it("custom accent lights up the no-accent template", () => {
    expect(templateSpec("minimal").accent).toBe("none");
    expect(resolveDesign(templateSpec("minimal"), { accentColor: "#0F766E" }).accent).toBe("minimal");
  });
});

describe("effectiveAccent (mobile)", () => {
  it("design override wins, else template accent", () => {
    expect(effectiveAccent("#111111", { accentColor: "#abcdef" })).toBe("#abcdef");
    expect(effectiveAccent("#111111", {})).toBe("#111111");
    expect(effectiveAccent("#111111", { accentColor: "nope" })).toBe("#111111");
  });
});

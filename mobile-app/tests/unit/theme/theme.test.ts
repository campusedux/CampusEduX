import { AMOLED_COLORS, DARK_COLORS, LIGHT_COLORS, type ThemeColors } from "@/theme/colors";
import { contrast, darken, ensureContrast } from "@/theme/colorUtils";
import { COURSE_ACCENTS, GRADIENT_SCRIM_OPACITY, accentTokens, courseKeyFor, resolveCourseAccent, type CourseKey } from "@/theme/courseAccents";
import { gridColumns } from "@/theme/spacing";
import { typeStyle } from "@/theme/typography";

const AA = 4.5;

describe.each([
  ["light", LIGHT_COLORS],
  ["dark", DARK_COLORS],
  ["amoled", AMOLED_COLORS],
] as [string, ThemeColors][])("colour tokens (%s) meet WCAG AA", (_n, c) => {
  it("text tiers on bg + surface + canvas", () => {
    for (const ground of [c.bg, c.surface, c.canvas]) {
      expect(contrast(c.text, ground)).toBeGreaterThanOrEqual(7);
      expect(contrast(c.textSecondary, ground)).toBeGreaterThanOrEqual(AA);
      expect(contrast(c.textMuted, ground)).toBeGreaterThanOrEqual(AA);
      expect(contrast(c.primaryText, ground)).toBeGreaterThanOrEqual(AA);
    }
  });

  it("callout labels on their tinted background", () => {
    for (const [name, tone] of Object.entries(c.callout)) {
      // tint is translucent in dark mode → composite is approximated on the surface
      const ground = c.scheme === "light" ? tone.bg : c.surface;
      expect(`${name}:${contrast(tone.label, ground) >= AA}`).toBe(`${name}:true`);
    }
  });

  it("code text + muted on code card", () => {
    expect(contrast(c.codeText, c.codeBg)).toBeGreaterThanOrEqual(7);
    expect(contrast(c.codeMuted, c.codeBg)).toBeGreaterThanOrEqual(AA);
    for (const v of Object.values(c.syntax)) expect(contrast(v, c.codeBg)).toBeGreaterThanOrEqual(AA);
  });
});

it("light body text is the spec's #1F2937 and dark is #E5E7EB", () => {
  expect(LIGHT_COLORS.text).toBe("#1F2937");
  expect(DARK_COLORS.text).toBe("#E5E7EB");
});

describe("course accents", () => {
  const keys = Object.keys(COURSE_ACCENTS) as CourseKey[];

  it.each(keys)("%s: white on both gradient stops ≥ 3:1 (large text) and text accent ≥ AA in both schemes", (k) => {
    const a = COURSE_ACCENTS[k];
    for (const stop of a.gradient) expect(contrast("#FFFFFF", stop)).toBeGreaterThanOrEqual(3);
    expect(contrast(a.text.light, LIGHT_COLORS.surface)).toBeGreaterThanOrEqual(AA);
    expect(contrast(a.text.light, LIGHT_COLORS.canvas)).toBeGreaterThanOrEqual(AA);
    expect(contrast(a.text.dark, DARK_COLORS.surface)).toBeGreaterThanOrEqual(AA);
    expect(contrast(a.text.dark, AMOLED_COLORS.bg)).toBeGreaterThanOrEqual(AA);
  });

  it.each(keys)("%s: small white text is AA on the scrimmed gradient", (k) => {
    for (const stop of COURSE_ACCENTS[k].gradient) {
      expect(contrast("#FFFFFF", darken(stop, GRADIENT_SCRIM_OPACITY))).toBeGreaterThanOrEqual(AA);
    }
  });

  it("maps the five known courses", () => {
    expect(courseKeyFor({ slug: "dbms-sql", name: "DBMS & SQL" })).toBe("dbms");
    expect(courseKeyFor({ name: "Java Tutorials" })).toBe("java");
    expect(courseKeyFor({ slug: "ai-ml-notes", name: "AI/ML Notes" })).toBe("aiml");
    expect(courseKeyFor({ name: "Python Tutorial" })).toBe("python");
    expect(courseKeyFor({ name: "Generative AI" })).toBe("genai");
    expect(courseKeyFor({ name: "JavaScript Basics" })).toBeNull();
  });

  it("unknown course uses a valid admin accent (AA-safe) else indigo", () => {
    const d = resolveCourseAccent({ name: "Rust", accentColor: "#F59E0B" });
    expect(contrast(d.text.light, "#FFFFFF")).toBeGreaterThanOrEqual(AA);
    expect(resolveCourseAccent({ name: "Rust", accentColor: "nope" }).key).toBe("default");
    expect(accentTokens(COURSE_ACCENTS.java, "dark").text).toBe(COURSE_ACCENTS.java.text.dark);
  });

  it("ensureContrast darkens/lightens until AA", () => {
    expect(contrast(ensureContrast("#FBBF24", "#FFFFFF"), "#FFFFFF")).toBeGreaterThanOrEqual(AA);
    expect(contrast(ensureContrast("#1E3A8A", "#0B0F19"), "#0B0F19")).toBeGreaterThanOrEqual(AA);
  });
});

describe("type scale", () => {
  it("matches the phone spec", () => {
    const t = (v: Parameters<typeof typeStyle>[0]) => typeStyle(v, { width: 390 });
    expect([t("display").fontSize, t("display").lineHeight]).toEqual([28, 36]);
    expect([t("h1").fontSize, t("h1").lineHeight]).toEqual([26, 34]);
    expect([t("h2").fontSize, t("h2").lineHeight]).toEqual([21, 30]);
    expect([t("h3").fontSize, t("h3").lineHeight]).toEqual([18, 26]);
    expect([t("body").fontSize, t("body").lineHeight]).toEqual([17, 28]);
    expect([t("small").fontSize, t("small").lineHeight]).toEqual([13, 18]);
    expect([t("code").fontSize, t("code").lineHeight]).toEqual([14.5, 22]);
  });

  it("wide screens lift body to 18 and H1 to 32", () => {
    expect(typeStyle("body", { width: 1920 }).fontSize).toBe(18);
    expect(typeStyle("h1", { width: 1920 }).fontSize).toBe(32);
  });

  it("reading text is never below 16px, even on Small", () => {
    expect(typeStyle("body", { width: 360, reader: "small" }).fontSize as number).toBeGreaterThanOrEqual(16);
  });

  it("reader size scales reading text but not UI chrome", () => {
    expect(typeStyle("body", { width: 390, reader: "large" }).fontSize).toBeGreaterThan(17);
    expect(typeStyle("label", { width: 390, reader: "large" }).fontSize).toBe(14);
  });
});

it("grid columns: 1 small phone, 2 phones/tablets, 3 wide web", () => {
  expect([360, 379, 380, 430, 820, 1023, 1024, 1920].map(gridColumns)).toEqual([1, 1, 2, 2, 2, 2, 3, 3]);
});

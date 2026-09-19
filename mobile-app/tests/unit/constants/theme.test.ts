import { ACCENTS, COLORS, STATUS, accentTint, coloredShadow, withAlpha } from "@/constants/theme";

const tailwind = require("../../../tailwind.config.js");

describe("theme tokens", () => {
  it("withAlpha appends a two-digit hex alpha", () => {
    expect(withAlpha("#4F39F6", 0.07)).toBe("#4F39F612");
    expect(withAlpha("#4F39F6", 1)).toBe("#4F39F6ff");
    expect(withAlpha("#4F39F6", 0)).toBe("#4F39F600");
  });

  it("accentTint uses the Home 7% fill / 15% border recipe", () => {
    const t = accentTint("violet");
    expect(t.soft).toBe(withAlpha(ACCENTS.violet.base, 0.07));
    expect(t.border).toBe(withAlpha(ACCENTS.violet.base, 0.15));
    expect(t.colors).toEqual(["#8B5CF6", "#5B21B6"]);
  });

  it("every accent is a 6-digit hex with a 2-stop gradient", () => {
    Object.values(ACCENTS).forEach((a) => {
      expect(a.base).toMatch(/^#[0-9A-F]{6}$/i);
      expect(a.colors).toHaveLength(2);
    });
  });

  it("coloredShadow tints the shadow", () => {
    expect(coloredShadow("#8B5CF6").shadowColor).toBe("#8B5CF6");
  });

  it("keeps tailwind colours in sync with COLORS / STATUS", () => {
    const c = tailwind.theme.extend.colors;
    expect(c.primary.DEFAULT).toBe(COLORS.primary);
    expect(c.surface).toBe(COLORS.surface);
    expect(c.canvas).toBe(COLORS.canvas);
    expect(c.secondary).toBe(COLORS.secondary);
    expect(c.success).toBe(STATUS.success.base);
    expect(c.danger).toBe(STATUS.danger.base);
    expect(c.warning).toBe(STATUS.warning.base);
    expect(c.info).toBe(STATUS.info.base);
  });
});

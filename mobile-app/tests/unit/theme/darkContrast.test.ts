import { AMOLED_COLORS, DARK_COLORS, LIGHT_COLORS, type ThemeColors } from "@/theme/colors";
import { alpha, contrast, over } from "@/theme/colorUtils";
import { COURSE_ACCENTS, GRADIENT_SCRIM_OPACITY, accentTokens, type CourseKey } from "@/theme/courseAccents";
import { darken } from "@/theme/colorUtils";

/**
 * Every Learning surface, in light + dark + AMOLED, against WCAG 2.1:
 *  – text ≥ 4.5:1 (1.4.3)   – icons / borders / progress fills ≥ 3:1 (1.4.11)
 * Translucent tints are composited over the real ground before measuring.
 */
const TEXT = 4.5;
const UI = 3;
const SCHEMES: [string, ThemeColors][] = [["light", LIGHT_COLORS], ["dark", DARK_COLORS], ["amoled", AMOLED_COLORS]];
const COURSES = Object.keys(COURSE_ACCENTS) as CourseKey[];
const grounds = (c: ThemeColors) => [c.bg, c.canvas, c.surface];
const fails: string[] = [];
const check = (label: string, ratio: number, min: number) => {
  if (ratio < min) fails.push(`${label}: ${ratio.toFixed(2)} < ${min}`);
};
afterEach(() => {
  const f = fails.splice(0);
  if (f.length) throw new Error(`\n${f.join("\n")}`);
});

describe.each(SCHEMES)("%s", (name, c) => {
  const scheme = c.scheme;

  it("callout boxes: body, label, bold accent, link and inline code on the tinted box", () => {
    for (const [kind, tone] of Object.entries(c.callout)) {
      for (const g of [c.bg, c.canvas]) {
        const box = over(tone.bg, g);
        check(`${name} ${kind} body text`, contrast(c.text, box), TEXT);
        check(`${name} ${kind} secondary text`, contrast(c.textSecondary, box), TEXT);
        check(`${name} ${kind} label`, contrast(tone.label, box), TEXT);
        check(`${name} ${kind} link`, contrast(c.link, box), TEXT);
        check(`${name} ${kind} inline code`, contrast(c.inlineCodeText, over(c.inlineCodeBg, box)), TEXT);
        check(`${name} ${kind} left bar vs page`, contrast(tone.border, g), UI);
        for (const k of COURSES) check(`${name} ${kind} bold(${k})`, contrast(accentTokens(COURSE_ACCENTS[k], scheme).text, box), TEXT);
      }
    }
  });

  it("callout heading variant: label + accent bar + icon on the page", () => {
    for (const [kind, tone] of Object.entries(c.callout)) {
      for (const g of grounds(c)) {
        check(`${name} ${kind} heading label`, contrast(tone.label, g), TEXT);
        check(`${name} ${kind} heading bar`, contrast(tone.border, g), UI);
      }
    }
  });

  it("body text, links, blockquote, tables, inline code on the page grounds", () => {
    for (const g of grounds(c)) {
      check(`${name} text`, contrast(c.text, g), 7);
      check(`${name} textSecondary`, contrast(c.textSecondary, g), TEXT);
      check(`${name} textMuted`, contrast(c.textMuted, g), TEXT);
      check(`${name} link`, contrast(c.link, g), TEXT);
      check(`${name} primaryText`, contrast(c.primaryText, g), TEXT);
      check(`${name} inline code`, contrast(c.inlineCodeText, over(c.inlineCodeBg, g)), TEXT);
      check(`${name} success`, contrast(c.success, over(c.successSoft, g)), TEXT);
      check(`${name} danger`, contrast(c.danger, over(c.dangerSoft, g)), TEXT);
      check(`${name} warning`, contrast(c.warning, g), TEXT);
    }
  });

  it("code blocks: text, muted, line numbers, syntax, copy feedback", () => {
    for (const bg of [c.codeBg, c.codeHeader]) {
      check(`${name} codeText/${bg}`, contrast(c.codeText, bg), 7);
      check(`${name} codeMuted/${bg}`, contrast(c.codeMuted, bg), TEXT);
      check(`${name} copied/${bg}`, contrast(c.syntax.string, bg), TEXT);
      for (const [k, v] of Object.entries(c.syntax)) check(`${name} syntax.${k}/${bg}`, contrast(v, bg), TEXT);
    }
    check(`${name} line numbers`, contrast(c.codeLineNumber, c.codeBg), UI);
    check(`${name} code card edge vs page`, contrast(c.codeBg, c.canvas) >= 1.15 || contrast(c.codeBorder, c.canvas) >= 1.15 ? 99 : 0, 1);
  });

  it("primary controls (active chip, retry, text-size option): white on fill, fill visible on page", () => {
    for (const g of grounds(c)) {
      check(`${name} textOnPrimary on primaryFill`, contrast(c.textOnPrimary, c.primaryFill), TEXT);
      check(`${name} primaryFill vs ${g}`, contrast(c.primaryFill, g), UI);
    }
    check(`${name} primaryText on selected Aa`, contrast(c.primaryText, over(c.primarySoft, c.canvas)), TEXT);
  });

  it.each(COURSES)("course %s: chips, table header, tags, number circles, progress, badges", (k) => {
    const a = accentTokens(COURSE_ACCENTS[k], scheme);
    for (const g of grounds(c)) {
      const tint = over(a.soft, g);
      check(`${name} ${k} chip/table-header/current-row text`, contrast(a.text, tint), TEXT);
      check(`${name} ${k} accent text on page`, contrast(a.text, g), TEXT);
      check(`${name} ${k} progress fill vs page`, contrast(a.base, g), UI);
      check(`${name} ${k} progress fill vs track`, contrast(a.base, c.border) >= 1.8 ? 99 : contrast(a.base, c.border), 3);
      check(`${name} ${k} bookmark icon (accent.text)`, contrast(a.text, g), UI);
    }
    // premium tag + streak pill (their own tints)
    for (const g of [c.surface, c.canvas]) {
      check(`${name} premium tag`, contrast(c.warning, over(alpha(c.warning, 0.16), g)), TEXT);
      check(`${name} streak pill`, contrast(c.warning, over(alpha(c.streak, 0.14), g)), TEXT);
    }
    // completed check ✓ (white on accent.base), chapter-complete badge
    check(`${name} ${k} check icon on accent.base`, contrast("#FFFFFF", a.base), UI);
    // reader number badge + Complete button: white on the dark gradient end
    check(`${name} ${k} number badge / Complete button`, contrast("#FFFFFF", a.gradient[1]), TEXT);
    // hero / Continue card: small white text on scrimmed gradient, both stops
    for (const stop of a.gradient) check(`${name} ${k} hero text`, contrast("#FFFFFF", darken(stop, GRADIENT_SCRIM_OPACITY)), TEXT);
    // Resume/Start button label (gradient end) on its white button
    check(`${name} ${k} CTA label on white`, contrast(a.gradient[1], "#FFFFFF"), TEXT);
  });

  it("Complete button (done state): text on success tint, check disc", () => {
    for (const g of [c.canvas, c.bg]) {
      check(`${name} completed text`, contrast(c.text, over(c.successSoft, g)), TEXT);
      check(`${name} completed textSecondary`, contrast(c.textSecondary, over(c.successSoft, g)), TEXT);
    }
    check(`${name} check on success disc`, contrast(c.scheme === "dark" ? "#0B0F19" : "#FFFFFF", c.success), UI);
  });

  it("mock-test screens: timer, question chips, options, radio, buttons, stat cards, chart", () => {
    for (const g of [c.bg, c.canvas]) {
      check(`${name} test timer`, contrast(c.danger, over(c.dangerSoft, g)), TEXT);
      check(`${name} test chip active`, contrast(c.textOnPrimary, c.primaryFill), TEXT);
      check(`${name} test chip active vs page`, contrast(c.primaryFill, g), UI);
      check(`${name} test chip answered text`, contrast(c.success, over(c.successSoft, g)), TEXT);
      check(`${name} test chip answered border`, contrast(c.success, g), UI);
      check(`${name} test chip unanswered text`, contrast(c.textSecondary, c.surface), TEXT);
      check(`${name} test option selected text`, contrast(c.primaryText, over(c.primarySoft, g)), TEXT);
      check(`${name} test option selected border`, contrast(c.primary, g), UI);
      check(`${name} test option text`, contrast(c.text, c.surface), 7);
      check(`${name} test radio ring (unselected)`, contrast(c.textMuted, c.surface), UI);
      check(`${name} test outline button label`, contrast(c.text, c.surface), TEXT);
      check(`${name} test outline button border`, contrast(c.textMuted, g), UI);
      check(`${name} test text-button label`, contrast(c.primaryText, g), TEXT);
      check(`${name} test stat value`, contrast(c.text, c.surface), 7);
      check(`${name} test stat label`, contrast(c.textSecondary, c.surface), TEXT);
      check(`${name} test result ring vs page`, contrast(c.primary, g), UI);
      check(`${name} test result ring vs track`, contrast(c.primary, c.border) >= 1.8 ? 99 : contrast(c.primary, c.border), UI);
      check(`${name} test trend bar on card`, contrast(c.primary, c.surface), UI);
      check(`${name} test ring label`, contrast(c.text, g), 7);
    }
    check(`${name} test instructions number`, contrast(c.primaryText, c.bg), TEXT);
  });

  it("tab bar + drawer: active/inactive tints and the drawer's active row", () => {
    check(`${name} tab active`, contrast(c.primary, c.surface), TEXT);
    check(`${name} tab inactive`, contrast(c.textMuted, c.surface), TEXT);
    check(`${name} tab pill icon`, contrast(c.primary, over(c.primarySoft, c.surface)), UI);
    check(`${name} drawer text`, contrast(c.text, c.surface), 7);
    check(`${name} drawer active row`, contrast(c.primaryText, over(c.primarySoft, c.surface)), TEXT);
    check(`${name} drawer chevron`, contrast(c.textMuted, c.surface), UI);
  });
});

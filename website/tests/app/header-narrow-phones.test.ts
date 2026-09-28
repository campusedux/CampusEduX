import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandMark } from "@/components/nav/BrandMark";

/**
 * The signed-out header (logo · search · Log in · menu) used to be ~382px wide, so on
 * 320-360px phones the menu button slid past the screen edge. The header now uses the
 * compact wordmark: smaller below `sm`, hidden below 360px (the logo tile stays).
 * Real widths are checked in a browser at 320 / 360 / 390px; this pins the classes.
 */
describe("BrandMark on narrow phones", () => {
  const wordmark = (html: string) => html.match(/<span class="([^"]*)">Campus<span/)?.[1] ?? "";

  it("compact (header): smaller wordmark below sm, hidden below 360px, logo tile always shown", () => {
    const html = renderToStaticMarkup(createElement(BrandMark, { compact: true }));
    const cls = wordmark(html);
    expect(cls).toContain("max-[359px]:hidden");
    expect(cls).toContain("text-[0.95rem]");
    expect(cls).toContain("sm:text-[1.05rem]");
    expect(html).toContain(">C</span>");
    expect(html).toMatch(/class="flex items-center gap-2 sm:gap-2.5"/);
  });

  it("default (footer): unchanged, full-size wordmark that never hides", () => {
    const html = renderToStaticMarkup(createElement(BrandMark));
    const cls = wordmark(html);
    expect(cls).toContain("text-[1.05rem]");
    expect(cls).not.toContain("hidden");
    expect(html).toMatch(/class="flex items-center gap-2.5"/);
  });
});

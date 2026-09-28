import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandMark } from "@/components/nav/BrandMark";

/**
 * The signed-out header (logo · search · Log in · menu) used to be ~382px wide, so on
 * 320-360px phones the menu button slid past the screen edge. The header now uses the
 * compact logo: smaller below `sm`, and only the CX mark below 360px.
 * Real widths are checked in a browser at 320 / 360 / 390px; this pins the classes.
 */
describe("BrandMark on narrow phones", () => {
  const imgs = (html: string) => [...html.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
  const cls = (img: string) => img.match(/class="([^"]*)"/)?.[1] ?? "";

  it("compact (header): smaller logo below sm, CX mark only below 360px", () => {
    const html = renderToStaticMarkup(createElement(BrandMark, { compact: true }));
    const [horizontal, mark] = imgs(html);
    expect(horizontal).toContain("logo-wordmark-horizontal");
    expect(horizontal).toContain('alt="CampusEduX"');
    expect(cls(horizontal)).toContain("h-7");
    expect(cls(horizontal)).toContain("sm:h-8");
    expect(cls(horizontal)).toContain("max-[359px]:hidden");
    expect(mark).toContain("logo-mark");
    expect(cls(mark)).toContain("hidden");
    expect(cls(mark)).toContain("max-[359px]:block");
  });

  it("default (footer): full-size horizontal logo that never hides, no mark", () => {
    const html = renderToStaticMarkup(createElement(BrandMark));
    const all = imgs(html);
    expect(all).toHaveLength(1);
    expect(all[0]).toContain("logo-wordmark-horizontal");
    expect(cls(all[0])).toContain("h-9");
    expect(cls(all[0])).not.toContain("hidden");
  });

  it("dark mode puts the logo on a white pill instead of recolouring it", () => {
    const html = renderToStaticMarkup(createElement(BrandMark, { compact: true }));
    expect(html).toMatch(/<span class="[^"]*dark:bg-white[^"]*"/);
  });
});

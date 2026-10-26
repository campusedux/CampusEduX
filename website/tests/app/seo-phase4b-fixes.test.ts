import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 4B: production SEO/performance audit follow-ups.
 *
 *   1. /favicon.ico previously 404'd — browsers/crawlers that request it
 *      directly (instead of following the <link rel="icon">) got nothing.
 *      It is now a static src/app/favicon.ico (16/32/48px) generated from
 *      the CampusEduX logo mark by scripts/generate-logos.mjs, alongside
 *      app/icon.png, so both paths show the same mark.
 *   2. /about and /faq previously fell through to the root layout's default
 *      description and were byte-identical. Both now set their own
 *      page-specific `description`.
 */

// The root layout's sitewide default description — /about and /faq used to
// silently inherit this (which is how they ended up identical). Both must
// now override it with something page-specific.
const ROOT_LAYOUT_DEFAULT_DESCRIPTION =
  "CampusEduX is a student platform for the project marketplace, jobs & internships, placement preparation, resume building and custom project development.";

describe("Phase 4B: /favicon.ico compatibility path", () => {
  const appDir = (...p: string[]) => resolve(__dirname, "..", "..", "src", "app", ...p);

  it("is a static app/favicon.ico file (Next serves it at /favicon.ico), not a route folder", () => {
    expect(statSync(appDir("favicon.ico")).isFile()).toBe(true);
    expect(existsSync(appDir("favicon.ico", "route.tsx"))).toBe(false);
  });

  it("is a valid multi-size .ico built from the same logo mark as app/icon.png", () => {
    const buf = readFileSync(appDir("favicon.ico"));
    expect(buf.readUInt16LE(0)).toBe(0);
    expect(buf.readUInt16LE(2)).toBe(1);
    expect(buf.readUInt16LE(4)).toBeGreaterThanOrEqual(3);
    expect(existsSync(appDir("icon.png"))).toBe(true);
  });
});

describe("Phase 4B: /about and /faq have distinct, page-specific meta descriptions", () => {
  it("/about description is set, non-empty, and not the sitewide default", async () => {
    const { metadata } = await import("@/app/about/page");
    expect(metadata.description).toBeTruthy();
    expect(metadata.description).not.toBe(ROOT_LAYOUT_DEFAULT_DESCRIPTION);
    expect(metadata.title).toEqual({ absolute: "About CampusEduX: Tools for Indian Students" });
  });

  it("/faq description is set, non-empty, and not the sitewide default", async () => {
    const { generateMetadata } = await import("@/app/faq/page");
    const metadata = await generateMetadata();
    expect(metadata.description).toBeTruthy();
    expect(metadata.description).not.toBe(ROOT_LAYOUT_DEFAULT_DESCRIPTION);
    // Title unchanged by this fix.
    expect(metadata.title).toBe("Frequently Asked Questions");
  });

  it("/about and /faq descriptions differ from each other", async () => {
    const { metadata: aboutMetadata } = await import("@/app/about/page");
    const { generateMetadata } = await import("@/app/faq/page");
    const faqMetadata = await generateMetadata();
    expect(aboutMetadata.description).not.toBe(faqMetadata.description);
  });
});

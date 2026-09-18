import { describe, it, expect } from "vitest";

/**
 * Phase 4B: production SEO/performance audit follow-ups.
 *
 *   1. /favicon.ico previously 404'd — browsers/crawlers that request it
 *      directly (instead of following the <link rel="icon"> app/icon.tsx
 *      generates) got nothing. Fixed with a route handler at
 *      src/app/favicon.ico/route.tsx that renders the same shared brand
 *      mark (src/lib/brandIcon.tsx) as /icon, so there is exactly one mark
 *      defined and both paths stay in sync.
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
  it("renders the same brand mark and size as /icon", async () => {
    const { size: iconSize, contentType: iconContentType } = await import("@/app/icon");
    const { BRAND_ICON_SIZE } = await import("@/lib/brandIcon");
    expect(iconSize).toEqual(BRAND_ICON_SIZE);
    expect(iconContentType).toBe("image/png");
  });

  it("GET /favicon.ico returns a 200 PNG image", async () => {
    const { GET } = await import("@/app/favicon.ico/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
  });
});

describe("Phase 4B: /about and /faq have distinct, page-specific meta descriptions", () => {
  it("/about description is set, non-empty, and not the sitewide default", async () => {
    const { metadata } = await import("@/app/about/page");
    expect(metadata.description).toBeTruthy();
    expect(metadata.description).not.toBe(ROOT_LAYOUT_DEFAULT_DESCRIPTION);
    // Title unchanged by this fix.
    expect(metadata.title).toBe("About CampusEduX");
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

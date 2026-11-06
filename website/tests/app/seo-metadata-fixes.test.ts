import { describe, it, expect, vi, afterEach } from "vitest";
import { fakeSitemapSupabase, loadSitemapRoutes, locs, unloadSitemapRoutes } from "../helpers/sitemapFakes";

// The five fixed static-metadata pages import UI/data modules that touch
// Supabase only inside functions (never at module top-level), so importing
// them for their `metadata` export is safe without mocking.
// /projects, /jobs and /jobs/companies now noindex an empty result set (see
// the "dynamic page safety" tests below), so their `metadata` export became
// an async `generateMetadata()`. Supabase env vars are unset under Vitest, so
// `getPublicSupabase()` returns null and these resolve with no DB round-trip.
describe("static page metadata (canonical + description + OG)", () => {
  it("/projects has a self-referencing canonical, description and OG copy", async () => {
    const { generateMetadata } = await import("@/app/projects/page");
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/projects");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();
    expect(metadata.openGraph?.url).toBe("https://www.campusedux.com/projects");
  });

  it("/jobs has a self-referencing canonical, description and OG copy", async () => {
    const { generateMetadata } = await import("@/app/jobs/page");
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) });
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/jobs");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();
    expect(metadata.openGraph?.url).toBe("https://www.campusedux.com/jobs");
  });

  it("/resume has a self-referencing canonical, description and OG copy", async () => {
    const { metadata } = await import("@/app/resume/page");
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/resume");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();
    expect(metadata.openGraph?.url).toBe("https://www.campusedux.com/resume");
  });

  it("/jobs/companies has a self-referencing canonical, description and OG copy", async () => {
    const { generateMetadata } = await import("@/app/jobs/companies/page");
    const metadata = await generateMetadata();
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/jobs/companies");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();
    expect(metadata.openGraph?.url).toBe("https://www.campusedux.com/jobs/companies");
  });

  it("/resume/templates has a self-referencing canonical, description and OG copy", async () => {
    const { metadata } = await import("@/app/resume/templates/page");
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/resume/templates");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();
    expect(metadata.openGraph?.url).toBe("https://www.campusedux.com/resume/templates");
  });

  it("none of the five pages point their canonical at the homepage anymore", async () => {
    const [projects, jobs, resume, companies, resumeTemplates] = await Promise.all([
      import("@/app/projects/page").then((m) => m.generateMetadata({ searchParams: Promise.resolve({}) })),
      import("@/app/jobs/page").then((m) => m.generateMetadata({ searchParams: Promise.resolve({}) })),
      import("@/app/resume/page").then((m) => m.metadata),
      import("@/app/jobs/companies/page").then((m) => m.generateMetadata()),
      import("@/app/resume/templates/page").then((m) => m.metadata),
    ]);
    for (const metadata of [projects, jobs, resume, companies, resumeTemplates]) {
      expect(metadata.alternates?.canonical).not.toBe("https://www.campusedux.com/");
      expect(metadata.alternates?.canonical).not.toBe("/");
    }
  });

  it("descriptions are unique across the five fixed pages (no duplicate-meta-description regression)", async () => {
    const [projects, jobs, resume, companies, resumeTemplates] = await Promise.all([
      import("@/app/projects/page").then((m) => m.generateMetadata({ searchParams: Promise.resolve({}) })),
      import("@/app/jobs/page").then((m) => m.generateMetadata({ searchParams: Promise.resolve({}) })),
      import("@/app/resume/page").then((m) => m.metadata),
      import("@/app/jobs/companies/page").then((m) => m.generateMetadata()),
      import("@/app/resume/templates/page").then((m) => m.metadata),
    ]);
    const descriptions = [projects, jobs, resume, companies, resumeTemplates].map((m) => m.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    // None should equal the generic root-layout fallback description that was
    // previously being inherited.
    const rootDescription =
      "CampusEduX is a student platform for the project marketplace, jobs & internships, placement preparation, resume building and custom project development.";
    for (const d of descriptions) expect(d).not.toBe(rootDescription);
  });
});

// The category page builds metadata dynamically from a category id, and must
// URL-encode that id into the canonical/OG url. Mock the cache layer so the
// test never touches Supabase.
// `getCachedProjectsPage` / `getCachedJobsPage` wrap `next/cache`'s
// `unstable_cache`, which needs a real Next.js request context and throws
// ("incrementalCache missing") under plain Vitest — stub them like the
// category-preview helpers below rather than calling through to `actual`.
vi.mock("@/lib/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cache")>();
  return {
    ...actual,
    getCachedCategoryPreview: vi.fn(async () => ({ name: "Web & Mobile", projects: [], found: true })),
    getCachedCategoryIds: vi.fn(async () => []),
    getCachedProjectsPage: vi.fn(async () => ({ projects: [], count: 5 })),
    getCachedJobsPage: vi.fn(async () => ({ jobs: [], count: 5 })),
  };
});

// `react`'s `cache()` (used to memoize the per-request fetch) is only
// available on the canary build Next.js aliases "react" to at build time;
// under plain Vitest the published 18.3.1 package doesn't export it. Shim it
// as a no-op wrapper here, same as Next's own runtime does functionally.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});

describe("/projects/category/[category] dynamic metadata", () => {
  it("builds an encoded, self-referencing canonical and dynamic OG/description", async () => {
    const { generateMetadata } = await import("@/app/projects/category/[category]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ category: "web & mobile" }) });

    expect(metadata.title).toBe("Web & Mobile projects");
    expect(metadata.description).toContain("Web & Mobile");
    expect(metadata.alternates?.canonical).toBe(
      "https://www.campusedux.com/projects/category/web%20%26%20mobile",
    );
    expect(metadata.openGraph?.title).toBe("Web & Mobile projects | CampusEduX");
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
  });
});

// robots.ts / the sitemap routes read NEXT_PUBLIC_SITE_URL once at module load, so
// each fallback-domain assertion needs a fresh module instance.
describe("robots.ts / sitemap.ts fallback domain", () => {
  const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (ORIGINAL_SITE_URL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
    vi.resetModules();
  });

  it("robots.ts falls back to https://www.campusedux.com (not campusedux.app) when NEXT_PUBLIC_SITE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    const { default: robots } = await import("@/app/robots");
    const result = robots();
    expect(result.sitemap).toBe("https://www.campusedux.com/sitemap.xml");
  });

  it("robots.ts still honors NEXT_PUBLIC_SITE_URL when set", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
    vi.resetModules();
    const { default: robots } = await import("@/app/robots");
    const result = robots();
    expect(result.sitemap).toBe("https://example.test/sitemap.xml");
  });

  // sitemap.ts was replaced by the /sitemap.xml index + /sitemaps/<section>.xml routes.
  it("the sitemap falls back to https://www.campusedux.com (not campusedux.app) when NEXT_PUBLIC_SITE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const r = await loadSitemapRoutes(fakeSitemapSupabase());
    const urls = [...locs(await r.indexXml()), ...(await r.allLocs())];
    expect(locs(await r.sectionXml("static"))[0]).toBe("https://www.campusedux.com");
    expect(urls.every((u) => u.startsWith("https://www.campusedux.com"))).toBe(true);
    unloadSitemapRoutes();
  });

  it("the sitemap still honors NEXT_PUBLIC_SITE_URL when set", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
    const r = await loadSitemapRoutes(fakeSitemapSupabase());
    const urls = [...locs(await r.indexXml()), ...(await r.allLocs())];
    expect(urls.length).toBeGreaterThan(7);
    expect(urls.every((u) => u.startsWith("https://example.test"))).toBe(true);
    unloadSitemapRoutes();
  });
});

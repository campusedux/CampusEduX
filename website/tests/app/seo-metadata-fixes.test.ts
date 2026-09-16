import { describe, it, expect, vi, afterEach } from "vitest";

// The five fixed static-metadata pages import UI/data modules that touch
// Supabase only inside functions (never at module top-level), so importing
// them for their `metadata` export is safe without mocking.
describe("static page metadata (canonical + description + OG)", () => {
  it("/projects has a self-referencing canonical, description and OG copy", async () => {
    const { metadata } = await import("@/app/projects/page");
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/projects");
    expect(metadata.openGraph?.title).toBeTruthy();
    expect(metadata.openGraph?.description).toBeTruthy();
    expect(metadata.openGraph?.url).toBe("https://www.campusedux.com/projects");
  });

  it("/jobs has a self-referencing canonical, description and OG copy", async () => {
    const { metadata } = await import("@/app/jobs/page");
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
    const { metadata } = await import("@/app/jobs/companies/page");
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
    const modules = await Promise.all([
      import("@/app/projects/page"),
      import("@/app/jobs/page"),
      import("@/app/resume/page"),
      import("@/app/jobs/companies/page"),
      import("@/app/resume/templates/page"),
    ]);
    for (const { metadata } of modules) {
      expect(metadata.alternates?.canonical).not.toBe("https://www.campusedux.com/");
      expect(metadata.alternates?.canonical).not.toBe("/");
    }
  });

  it("descriptions are unique across the five fixed pages (no duplicate-meta-description regression)", async () => {
    const modules = await Promise.all([
      import("@/app/projects/page"),
      import("@/app/jobs/page"),
      import("@/app/resume/page"),
      import("@/app/jobs/companies/page"),
      import("@/app/resume/templates/page"),
    ]);
    const descriptions = modules.map((m) => m.metadata.description);
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
vi.mock("@/lib/cache", () => ({
  getCachedCategoryPreview: vi.fn(async () => ({ name: "Web & Mobile", projects: [] })),
  getCachedCategoryIds: vi.fn(async () => []),
}));

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
    const metadata = await generateMetadata({ params: { category: "web & mobile" } });

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

// robots.ts / sitemap.ts read NEXT_PUBLIC_SITE_URL once at module load, so
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

  it("sitemap.ts falls back to https://www.campusedux.com (not campusedux.app) when NEXT_PUBLIC_SITE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    vi.doMock("@/lib/supabase/server", () => ({ getPublicSupabase: () => null }));
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    expect(entries[0].url).toBe("https://www.campusedux.com");
    expect(entries.every((e) => e.url.startsWith("https://www.campusedux.com"))).toBe(true);
    vi.doUnmock("@/lib/supabase/server");
  });

  it("sitemap.ts still honors NEXT_PUBLIC_SITE_URL when set", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
    vi.resetModules();
    vi.doMock("@/lib/supabase/server", () => ({ getPublicSupabase: () => null }));
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    expect(entries.every((e) => e.url.startsWith("https://example.test"))).toBe(true);
    vi.doUnmock("@/lib/supabase/server");
  });
});

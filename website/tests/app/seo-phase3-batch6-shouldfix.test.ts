import { describe, it, expect, vi } from "vitest";
import { fakeSitemapSupabase, loadSitemapRoutes, unloadSitemapRoutes, urlEntries } from "../helpers/sitemapFakes";

/**
 * Phase 3 Batch 6: verified SHOULD-FIX items from the final SEO audit.
 *
 *   1. The legacy `/placement/notes/[id]` -> `/learning/...` redirect now
 *      uses `permanentRedirect()` (308) instead of `redirect()` (307), since
 *      the target is permanent (migration 0043/020 merged prep_notes into
 *      Learning for good, not temporarily).
 *   2. `sitemap.ts` category entries carry a real `lastModified` sourced
 *      from `categories.updated_at` instead of defaulting to "now" on every
 *      build.
 *   3. Five dynamic detail routes (jobs/[id], jobs/companies/[id],
 *      projects/[id], learning/[gridSlug]/[topicSlug], blog/[slug]) return
 *      an explicit `robots: { index: false, follow: false }` in their
 *      not-found metadata fallback, so a 404'd URL is never left indexable
 *      by omission.
 */

// ---------------------------------------------------------------------------
// 1. /placement/notes/[id] uses permanentRedirect, not redirect
// ---------------------------------------------------------------------------
const { permanentRedirect, redirect } = vi.hoisted(() => ({
  permanentRedirect: vi.fn((url: string) => {
    throw { digest: "NEXT_REDIRECT", url };
  }),
  redirect: vi.fn((url: string) => {
    throw { digest: "NEXT_REDIRECT", url };
  }),
}));
vi.mock("next/navigation", () => ({ permanentRedirect, redirect }));
vi.mock("@/lib/learning", () => ({
  resolveLegacyNotePath: vi.fn(async () => "/learning/java-tutorial/intro-to-java"),
}));

describe("Phase 3 Batch 6: /placement/notes/[id] legacy redirect", () => {
  it("calls permanentRedirect (not redirect) with the resolver's path", async () => {
    const { default: LegacyNoteRedirect } = await import("@/app/placement/notes/[id]/page");
    await expect(LegacyNoteRedirect({ params: Promise.resolve({ id: "note-1" }) })).rejects.toMatchObject({
      url: "/learning/java-tutorial/intro-to-java",
    });
    expect(permanentRedirect).toHaveBeenCalledWith("/learning/java-tutorial/intro-to-java");
    expect(redirect).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. sitemap.ts category lastModified
// ---------------------------------------------------------------------------
// (sitemap.ts was replaced by the /sitemap.xml index + /sitemaps/<section>.xml
// route handlers; the guarantee is unchanged — a category page's lastmod is a
// real content date, now the newest of categories.updated_at and its listed
// projects' updated_at, never the build time.)
describe("Phase 3 Batch 6: sitemap category entries carry a real lastModified", () => {
  it("uses categories.updated_at, not the build-time default", async () => {
    const categoryUpdatedAt = "2020-01-01T00:00:00.000Z";
    const r = await loadSitemapRoutes(
      fakeSitemapSupabase({
        tables: {
          categories: [{ id: "web-development", updated_at: categoryUpdatedAt }],
          // a category page is only listed when it has a project (empty ones are noindex)
          projects: [{ id: "p1", category_id: "web-development", updated_at: "2019-06-01T00:00:00.000Z" }],
        },
      }),
    );
    const entries = urlEntries(await r.sectionXml("projects"));
    const categoryEntry = entries.find((e) => e.loc === "https://www.campusedux.com/projects/category/web-development");

    expect(categoryEntry).toBeDefined();
    expect(categoryEntry!.lastmod).toBe(categoryUpdatedAt);
    unloadSitemapRoutes();
  });
});

// ---------------------------------------------------------------------------
// 3. Not-found metadata fallbacks are explicitly noindex, nofollow
// ---------------------------------------------------------------------------
vi.mock("@/lib/cache", () => ({
  getCachedJobDetail: vi.fn(async () => null),
  getCachedRecentJobIds: vi.fn(async () => []),
  getCachedCompanyDetail: vi.fn(async () => null),
  getCachedCompanyIds: vi.fn(async () => []),
  getCachedProjectDetail: vi.fn(async () => null),
  getCachedTopProjectIds: vi.fn(async () => []),
}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});

describe("Phase 3 Batch 6: not-found metadata is explicitly noindex, nofollow", () => {
  it("/jobs/[id]", async () => {
    const { generateMetadata } = await import("@/app/jobs/[id]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ id: "missing" }) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("/jobs/companies/[id]", async () => {
    const { generateMetadata } = await import("@/app/jobs/companies/[id]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ id: "missing" }) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("/projects/[id]", async () => {
    const { generateMetadata } = await import("@/app/projects/[id]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ id: "missing" }) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("/learning/[gridSlug]/[topicSlug]", async () => {
    vi.doMock("@/lib/learning", () => ({
      getLearningTopicPage: vi.fn(async () => null),
      getLearningTree: vi.fn(async () => null),
    }));
    const { generateMetadata } = await import("@/app/learning/[gridSlug]/[topicSlug]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ gridSlug: "missing", topicSlug: "missing" }) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    vi.doUnmock("@/lib/learning");
  });

  it("/blog/[slug]", async () => {
    vi.doMock("@/lib/blog", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/lib/blog")>();
      return { ...actual, getBlogPost: vi.fn(async () => null) };
    });
    const { generateMetadata } = await import("@/app/blog/[slug]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "missing" }) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    vi.doUnmock("@/lib/blog");
  });
});

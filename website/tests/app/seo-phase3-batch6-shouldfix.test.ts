import { describe, it, expect, vi } from "vitest";

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
    await expect(LegacyNoteRedirect({ params: { id: "note-1" } })).rejects.toMatchObject({
      url: "/learning/java-tutorial/intro-to-java",
    });
    expect(permanentRedirect).toHaveBeenCalledWith("/learning/java-tutorial/intro-to-java");
    expect(redirect).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. sitemap.ts category lastModified
// ---------------------------------------------------------------------------
describe("Phase 3 Batch 6: sitemap.ts category entries carry a real lastModified", () => {
  it("uses categories.updated_at, not the build-time default", async () => {
    vi.resetModules();
    const categoryUpdatedAt = "2020-01-01T00:00:00.000Z";
    vi.doMock("@/lib/supabase/server", () => ({
      getPublicSupabase: () => ({
        from: (table: string) => ({
          select: () => ({
            limit: async () => {
              if (table === "categories") {
                return { data: [{ id: "web-development", updated_at: categoryUpdatedAt }] };
              }
              return { data: [] };
            },
            eq: () => ({ limit: async () => ({ data: [] }), or: () => ({ limit: async () => ({ data: [] }) }) }),
            is: () => ({ not: () => ({ limit: async () => ({ data: [] }) }) }),
          }),
        }),
        rpc: async () => ({ data: [] }),
      }),
    }));

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap();
    const categoryEntry = entries.find((e) => e.url === "https://www.campusedux.com/projects/category/web-development");

    expect(categoryEntry).toBeDefined();
    expect(categoryEntry!.lastModified).toEqual(new Date(categoryUpdatedAt));
    vi.doUnmock("@/lib/supabase/server");
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
    const metadata = await generateMetadata({ params: { id: "missing" } });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("/jobs/companies/[id]", async () => {
    const { generateMetadata } = await import("@/app/jobs/companies/[id]/page");
    const metadata = await generateMetadata({ params: { id: "missing" } });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("/projects/[id]", async () => {
    const { generateMetadata } = await import("@/app/projects/[id]/page");
    const metadata = await generateMetadata({ params: { id: "missing" } });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("/learning/[gridSlug]/[topicSlug]", async () => {
    vi.doMock("@/lib/learning", () => ({
      getLearningTopicPage: vi.fn(async () => null),
      getLearningTree: vi.fn(async () => null),
    }));
    const { generateMetadata } = await import("@/app/learning/[gridSlug]/[topicSlug]/page");
    const metadata = await generateMetadata({ params: { gridSlug: "missing", topicSlug: "missing" } });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    vi.doUnmock("@/lib/learning");
  });

  it("/blog/[slug]", async () => {
    vi.doMock("@/lib/blog", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/lib/blog")>();
      return { ...actual, getBlogPost: vi.fn(async () => null) };
    });
    const { generateMetadata } = await import("@/app/blog/[slug]/page");
    const metadata = await generateMetadata({ params: { slug: "missing" } });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    vi.doUnmock("@/lib/blog");
  });
});

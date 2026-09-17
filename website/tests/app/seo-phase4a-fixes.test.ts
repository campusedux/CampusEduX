import { describe, it, expect, vi } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase 4A: production SEO fixes from the Phase 4 verification audit.
 *
 *   1. Sitewide favicon (`src/app/icon.tsx`) and default OG image
 *      (`src/app/opengraph-image.tsx`) exist and render.
 *   2. /login and /register carry page-specific titles instead of falling
 *      through to the root layout's default title.
 *   3. /projects/[id], /jobs/[id], /jobs/companies/[id] and
 *      /learning/[gridSlug]/[topicSlug] call notFound() for a missing
 *      record (already true before this batch) — regression-guarded here
 *      because the real HTTP 404 status also depends on point 4.
 *   4. The root-cause fix for the "soft 404" (HTTP 200 + noindex instead of
 *      a real 404): each of those four routes previously sat under a
 *      `loading.tsx` ancestor, which makes Next.js start streaming a 200
 *      response before the page can determine it's a 404 (reproduced
 *      locally against a production build/server, independent of ISR vs.
 *      force-dynamic). Removing every `loading.tsx` in each route's
 *      ancestor chain fixed the status in that same local verification.
 *      This is a file-absence regression guard, not a full Next.js
 *      streaming-pipeline test — Vitest doesn't run the real HTTP layer.
 */

const appDir = (...segments: string[]) => resolve(__dirname, "..", "..", "src", "app", ...segments);

// ---------------------------------------------------------------------------
// 1. Favicon + default OG image
// ---------------------------------------------------------------------------
describe("Phase 4A: sitewide favicon and default OG image", () => {
  it("src/app/icon.tsx renders a 32x32 PNG", async () => {
    const { default: Icon, size, contentType } = await import("@/app/icon");
    expect(contentType).toBe("image/png");
    expect(size).toEqual({ width: 32, height: 32 });
    const res = Icon();
    expect(res.status).toBe(200);
  });

  it("src/app/opengraph-image.tsx renders a 1200x630 PNG", async () => {
    const { default: OpengraphImage, size, contentType } = await import("@/app/opengraph-image");
    expect(contentType).toBe("image/png");
    expect(size).toEqual({ width: 1200, height: 630 });
    const res = OpengraphImage();
    expect(res.status).toBe(200);
  });

  it("blog posts still define their own openGraph.images (unaffected by the default)", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync(appDir("blog", "[slug]", "page.tsx"), "utf8")
    );
    expect(source).toContain("images");
  });
});

// ---------------------------------------------------------------------------
// 2. /login and /register page-specific titles
// ---------------------------------------------------------------------------
describe("Phase 4A: /login and /register have page-specific titles", () => {
  it("/login", async () => {
    const { metadata } = await import("@/app/login/page");
    expect(metadata.title).toBe("Log In");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("/register", async () => {
    const { metadata } = await import("@/app/register/page");
    expect(metadata.title).toBe("Create Account");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

// ---------------------------------------------------------------------------
// 3 + 4. Real 404: notFound() is called, and the loading.tsx ancestors that
// broke its HTTP status are gone.
// ---------------------------------------------------------------------------
const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw { digest: "NEXT_NOT_FOUND" };
  }),
}));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/cache", () => ({
  getCachedJobDetail: vi.fn(async () => null),
  getCachedCompanyDetail: vi.fn(async () => null),
  getCachedProjectDetail: vi.fn(async () => null),
}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});

describe("Phase 4A: page components call notFound() for a missing record", () => {
  it("/projects/[id]", async () => {
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");
    await expect(ProjectDetailPage({ params: { id: "missing" } })).rejects.toMatchObject({
      digest: "NEXT_NOT_FOUND",
    });
    expect(notFound).toHaveBeenCalled();
  });

  it("/jobs/[id]", async () => {
    const { default: JobDetailPage } = await import("@/app/jobs/[id]/page");
    await expect(JobDetailPage({ params: { id: "missing" } })).rejects.toMatchObject({
      digest: "NEXT_NOT_FOUND",
    });
  });

  it("/jobs/companies/[id]", async () => {
    const { default: CompanyDetailPage } = await import("@/app/jobs/companies/[id]/page");
    await expect(CompanyDetailPage({ params: { id: "missing" } })).rejects.toMatchObject({
      digest: "NEXT_NOT_FOUND",
    });
  });

  it("/learning/[gridSlug]/[topicSlug]", async () => {
    vi.doMock("@/lib/learning", () => ({
      getLearningTopicPage: vi.fn(async () => null),
      getLearningTree: vi.fn(async () => null),
    }));
    const { default: TopicPage } = await import("@/app/learning/[gridSlug]/[topicSlug]/page");
    await expect(TopicPage({ params: { gridSlug: "missing", topicSlug: "missing" } })).rejects.toMatchObject({
      digest: "NEXT_NOT_FOUND",
    });
    vi.doUnmock("@/lib/learning");
  });
});

describe("Phase 4A: loading.tsx ancestors that broke the 404 status are removed", () => {
  const removedLoadingFiles = [
    "projects/loading.tsx",
    "projects/[id]/loading.tsx",
    "jobs/loading.tsx",
    "jobs/[id]/loading.tsx",
    "jobs/companies/[id]/loading.tsx",
    "learning/loading.tsx",
  ];

  it.each(removedLoadingFiles)("%s", (relativePath) => {
    expect(existsSync(appDir(...relativePath.split("/"))), `${relativePath} should not exist`).toBe(false);
  });
});

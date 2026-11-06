import { describe, it, expect, vi } from "vitest";
import { fakeSitemapSupabase, loadSitemapRoutes, unloadSitemapRoutes } from "../helpers/sitemapFakes";

/**
 * Phase 3 Batch 5: compiler URL consolidation.
 *
 * `/practice/compiler` rendered the exact same `CompilerWorkspace` as
 * `/compiler` (zero logic duplication) but with weaker metadata (no
 * OpenGraph/Twitter tags, no `WebApplication` JSON-LD) and far fewer
 * internal links pointing at it. `/compiler` is the primary URL — it's the
 * one linked from the drawer nav, the footer, the Learning "Other
 * Tutorials" discovery block, and the hardcoded tutorial "Run this code"
 * hand-off (`buildCompilerHref` in `src/lib/compiler/handoff.ts`).
 *
 * This pins the one-directional consolidation:
 *   1. next.config.js permanently redirects /practice/compiler -> /compiler
 *      (never the reverse).
 *   2. The standalone /practice/compiler page file no longer exists.
 *   3. The sitemap drops /practice/compiler but keeps /compiler.
 *   4. The /practice hub page's "Online Compiler" tile now links to
 *      /compiler instead of /practice/compiler.
 *   5. /compiler itself — page, metadata, JSON-LD — is untouched.
 */

async function getConfiguredRedirects() {
  const { default: nextConfig } = await import("../../next.config.js");
  return nextConfig.redirects?.() ?? [];
}

/** Import via a widened `string` (not a literal) so `tsc` doesn't try to resolve a module that's deliberately deleted. */
async function expectPageRemoved(specifier: string) {
  await expect(import(specifier)).rejects.toBeTruthy();
}

describe("Phase 3 Batch 5: /practice/compiler -> /compiler redirect", () => {
  it("next.config.js redirects /practice/compiler to /compiler, permanently", async () => {
    const redirects = await getConfiguredRedirects();
    expect(redirects).toContainEqual({
      source: "/practice/compiler",
      destination: "/compiler",
      permanent: true,
    });
  });

  it("never redirects the reverse direction (/compiler -> /practice/compiler)", async () => {
    const redirects = await getConfiguredRedirects();
    const reversed = redirects.find(
      (r: { source: string }) => r.source === "/compiler",
    );
    expect(reversed).toBeUndefined();
  });

  it("the standalone /practice/compiler page file no longer exists", async () => {
    await expectPageRemoved("@/app/practice/compiler/page");
  });
});

describe("Phase 3 Batch 5: sitemap", () => {
  it("no longer lists /practice/compiler, but keeps /compiler", async () => {
    const r = await loadSitemapRoutes(fakeSitemapSupabase());
    const urls = await r.allLocs();
    expect(urls).not.toContain("https://www.campusedux.com/practice/compiler");
    expect(urls).toContain("https://www.campusedux.com/compiler");
    unloadSitemapRoutes();
  });
});

// ---------------------------------------------------------------------------
// /practice hub tile: render the server component (with @/lib/practice
// stubbed, same pattern as tests/app/coding-problem-breadcrumb.test.ts) and
// walk the React tree for every <Link>, asserting none point at the
// removed /practice/compiler URL and that /compiler is now linked instead.
// ---------------------------------------------------------------------------
vi.mock("@/lib/practice", () => ({
  getPracticeCategories: vi.fn(async () => []),
}));

/** Recursively finds every element of the given component type in a React element tree (mirrors tests/app/onboarding.test.ts). */
function findAllByType(node: unknown, type: unknown, out: { props: Record<string, unknown> }[] = []) {
  if (!node || typeof node !== "object") return out;
  const el = node as { type?: unknown; props?: { children?: unknown } };
  if (el.type === type) out.push(el as { props: Record<string, unknown> });
  const children = el.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) findAllByType(child, type, out);
  } else if (children) {
    findAllByType(children, type, out);
  }
  return out;
}

describe("Phase 3 Batch 5: /practice hub tile", () => {
  it("no longer links to /practice/compiler, and links to /compiler instead", async () => {
    const { default: Link } = await import("next/link");
    const { default: PracticeHubPage } = await import("@/app/practice/page");

    const result = await PracticeHubPage();
    const links = findAllByType(result, Link);
    const hrefs = links.map((l) => l.props.href);

    expect(hrefs).not.toContain("/practice/compiler");
    expect(hrefs).toContain("/compiler");
  });
});

// ---------------------------------------------------------------------------
// /compiler itself must be byte-for-byte untouched by this consolidation.
// ---------------------------------------------------------------------------
describe("Phase 3 Batch 5: /compiler route is untouched", () => {
  it("keeps its existing title, description and self-referencing canonical", async () => {
    const { metadata } = await import("@/app/compiler/page");
    expect(metadata.title).toBe("Online Code Compiler");
    expect(metadata.description).toBe(
      "Write, run and practise programming code online with CampusEduX — Java, Python, JavaScript, C and C++ in a secure sandbox, straight from your browser.",
    );
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/compiler");
  });

  it("keeps its OpenGraph/Twitter tags", async () => {
    const { metadata } = await import("@/app/compiler/page");
    expect(metadata.openGraph?.title).toBe("Online Code Compiler | CampusEduX");
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: "summary",
        title: "Online Code Compiler | CampusEduX",
      }),
    );
  });

  it("still renders CompilerWorkspace inside a Suspense boundary with the WebApplication + breadcrumb JSON-LD", async () => {
    const { default: JsonLd } = await import("@/components/JsonLd");
    const { default: CompilerPage } = await import("@/app/compiler/page");

    const result = CompilerPage();
    const jsonLdNodes = findAllByType(result, JsonLd);
    expect(jsonLdNodes).toHaveLength(2);
    expect(jsonLdNodes[0].props.data).toEqual(
      expect.objectContaining({ "@type": "WebApplication", url: "https://www.campusedux.com/compiler" }),
    );
  });
});

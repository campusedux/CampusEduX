import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../src/middleware";
import { getBlogPost } from "@/lib/blog";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it("allows a public page when its current anonymous content remains available despite a transient revision failure", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://merge-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "unit-test-anon");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "true");
  vi.spyOn(console, "error").mockImplementation(() => {});
  let revisionDown = false;
  const row = { id: "p1", slug: "published", status: "published", title: "Still public",
    content: "Public fixture content", excerpt: "Public", tags: [], category: null,
    published_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" };
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("public_content_revision")) return new Response(JSON.stringify(
      revisionDown ? { code: "08006", message: "Synthetic transient revision failure" }
        : "00000000-0000-4000-8000-000000000001"), {
      status: revisionDown ? 400 : 200, headers: { "content-type": "application/json" },
    });
    if (url.pathname.endsWith("blog_posts")) {
      const headers = new Headers(init?.headers);
      return new Response(JSON.stringify(headers.get("accept")?.includes("object+json") ? row : [row]), {
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error("Unexpected synthetic query");
  }));
  expect(await getBlogPost("published")).toMatchObject({ title: "Still public" });
  revisionDown = true;
  expect(await getBlogPost("published")).toMatchObject({ title: "Still public" });
  const response = await middleware(new NextRequest("https://website-fixture.invalid/blog/published"));
  const body = await response.text();
  console.info("MERGE_AVAILABILITY_PROBE", JSON.stringify({ anonymousContentReadable: true,
    middlewareStatus: response.status, noindex: body.includes('content="noindex"') }));
  expect(response.status).toBe(200);
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// Model independent renders while retaining the real public payload cache.
const render = vi.hoisted(() => ({ memo: new Map<unknown, Map<string, unknown>>() }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  cache: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => {
    if (!render.memo.has(fn)) render.memo.set(fn, new Map());
    const memo = render.memo.get(fn)!;
    const key = JSON.stringify(args);
    if (!memo.has(key)) memo.set(key, fn(...args));
    return memo.get(key);
  },
}));

import { middleware } from "../../src/middleware";
import { getBlogPost } from "@/lib/blog";
import { generateMetadata } from "@/app/blog/[slug]/page";

let serial = 0;
let revisionCode: string | undefined;
let invalidToken: boolean;
let contentDown: boolean;
let hidden: boolean;
let title: string;
let payloadCalls: number;
let revisionCalls: number;
const newRender = () => render.memo.clear();
const request = () => new NextRequest("https://website-fixture.invalid/blog/published", { headers: { "x-nonce": "forged" } });

beforeEach(() => {
  newRender(); serial++;
  revisionCode = undefined; invalidToken = contentDown = hidden = false;
  title = "Published article"; payloadCalls = revisionCalls = 0;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://revision-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "unit-test-anon");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "true");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    expect(url.host).toBe("revision-fixture.invalid");
    expect(init?.cache).toBe("no-store");
    if (url.pathname.endsWith("public_content_revision")) {
      revisionCalls++;
      return new Response(JSON.stringify(revisionCode ? { code: revisionCode, message: "PRIVATE upstream details" }
        : invalidToken ? "invalid" : `00000000-0000-4000-8000-${String(serial).padStart(12, "0")}`), {
        status: revisionCode ? (revisionCode === "42501" || revisionCode.startsWith("28") ? 403 : 400) : 200,
      });
    }
    if (!url.pathname.endsWith("blog_posts")) throw new Error("Unexpected synthetic query");
    payloadCalls++;
    if (contentDown) return new Response(JSON.stringify({ code: "08006" }), { status: 500 });
    const row = { id: "p1", slug: "published", title, content: "Published public content", excerpt: "Public article",
      status: "published", tags: [], category: null, published_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-01T00:00:00Z" };
    const single = new Headers(init?.headers).get("accept")?.includes("object+json");
    return new Response(JSON.stringify(single ? hidden ? null : row : hidden ? [] : [row]));
  }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("middleware and authoritative public reader", () => {
  it("allows fresh content and indexable metadata during a transient revision outage", async () => {
    await getBlogPost("published");
    title = "Fresh during revision outage"; revisionCode = "08006"; newRender();
    const response = middleware(request());
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("noindex");
    expect(response.headers.get("cache-control")).toContain("no-store");
    const nonce = response.headers.get("x-middleware-request-x-nonce");
    expect(nonce).not.toBe("forged");
    expect(response.headers.get("content-security-policy")).toContain(`'nonce-${nonce}'`);
    payloadCalls = 0;
    expect(await getBlogPost("published")).toMatchObject({ title });
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "published" }) });
    expect(metadata.title).toEqual({ absolute: `${title} | CampusEduX` });
    expect(metadata.robots).toBeUndefined();
    expect(payloadCalls).toBe(1);
  });

  it.each(["42501", "28000"])("keeps denied revisions (%s) closed even with a warm public payload", async code => {
    await getBlogPost("published");
    revisionCode = code; newRender(); payloadCalls = 0;
    expect(middleware(request()).status).toBe(200); // continuation, not a rendered document
    await expect(generateMetadata({ params: Promise.resolve({ slug: "published" }) })).rejects.toThrow("revision is unavailable");
    expect(payloadCalls).toBe(0);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("PRIVATE");
  });

  it("rejects malformed revisions without reading or reusing content", async () => {
    await getBlogPost("published");
    invalidToken = true; newRender(); payloadCalls = 0;
    middleware(request());
    await expect(getBlogPost("published")).rejects.toThrow("revision is unavailable");
    expect(payloadCalls).toBe(0);
  });

  it("observes withdrawal during revision failure rather than serving the warm article", async () => {
    await getBlogPost("published");
    revisionCode = "08006"; hidden = true; newRender();
    middleware(request());
    expect(await getBlogPost("published")).toBeNull();
    expect((await generateMetadata({ params: Promise.resolve({ slug: "published" }) })).robots).toMatchObject({ index: false });
  });

  it("rejects a simultaneous revision and anonymous-content failure", async () => {
    await getBlogPost("published");
    revisionCode = "08006"; contentDown = true; newRender();
    middleware(request());
    await expect(generateMetadata({ params: Promise.resolve({ slug: "published" }) })).rejects.toThrow("unavailable");
  });

  it("bounds a hung revision at 2.5 seconds per attempt and then reads fresh content", async () => {
    vi.useFakeTimers();
    const upstream = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
      String(input).includes("/rpc/public_content_revision") ? new Promise<Response>(() => {}) : upstream(input, init)));
    middleware(request());
    const pending = getBlogPost("published");
    await vi.advanceTimersByTimeAsync(4999);
    expect(payloadCalls).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toMatchObject({ title });
    expect(payloadCalls).toBe(1);
  });

  it.each(["true", "false"])("middleware adds no revision round trips with ads=%s", ads => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", ads);
    for (const path of ["/", "/learning", "/blog", "/jobs", "/projects", "/login", "/api/session"]) {
      expect(middleware(new NextRequest(`https://website-fixture.invalid${path}`)).status).toBe(200);
    }
    expect(revisionCalls).toBe(0);
    expect(payloadCalls).toBe(0);
  });
});

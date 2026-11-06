import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import ts from "typescript";
import { NextRequest } from "next/server";
import { middleware } from "../../src/middleware";

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
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));

import { getPublicSupabase } from "@/lib/supabase/server";
import { revisionedPublicRead as activeRead } from "@/lib/revisionedPublicRead";

let scratch: string;
let blog: typeof import("@/lib/blog");
let learning: typeof import("@/lib/learning");
let home: typeof import("@/lib/cache");
let denied: boolean;
let revisionCalls: number;
let payloadCalls: number;
let title: string;
let hidden: boolean;
let failed: boolean;

beforeAll(async () => {
  scratch = mkdtempSync(join(tmpdir(), "cx-phase2-app-rollback-"));
  const root = resolve("..");
  const target = join(scratch, "website/src/lib/revisionedPublicRead.ts");
  mkdirSync(resolve(target, ".."), { recursive: true });
  writeFileSync(target, readFileSync(join(root, "website/src/lib/revisionedPublicRead.ts")));
  const patch = join(root, "website/rollbacks/phase-2-public-cache.patch");
  // Apply only to a scratch tree, independent of uncommitted Git history.
  execFileSync("git", ["apply", "--check", patch], { cwd: scratch });
  execFileSync("git", ["apply", patch], { cwd: scratch });
  const source = readFileSync(target, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const react = await import("react");
  const exports: Record<string, unknown> = {};
  new Function("require", "exports", code)((name: string) => {
    if (name === "react") return react;
    if (name === "@/lib/supabase/server") return { getPublicSupabase };
    throw new Error(`Unexpected rollback dependency: ${name}`);
  }, exports);
  // Fresh module graph models restarting after the app-only patch, without
  // modifying or restarting the actual shared staging development process.
  vi.doMock("@/lib/revisionedPublicRead", () => exports);
  blog = await import("@/lib/blog");
  learning = await import("@/lib/learning");
  home = await import("@/lib/cache");
});

beforeEach(() => {
  render.memo.clear(); denied = false; revisionCalls = 0; payloadCalls = 0;
  title = "Public article"; hidden = false; failed = false;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://rollback-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "unit-test-anon");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "true");
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    expect(url.host).toBe("rollback-fixture.invalid");
    expect(init?.cache).toBe("no-store");
    const name = url.pathname.split("/").at(-1)!;
    if (name === "public_content_revision") {
      revisionCalls++;
      return new Response(JSON.stringify(denied ? { code: "42501", message: "permission denied" }
        : "00000000-0000-4000-8000-000000000001"), { status: denied ? 403 : 200 });
    }
    payloadCalls++;
    if (failed) return new Response(JSON.stringify({ code: "08006", message: "upstream failed" }), { status: 500 });
    let data: unknown = [];
    if (name === "learning_tree") data = hidden ? null : { grid: { slug: "java" }, sections: [{ topics: [{ slug: "intro" }] }] };
    else if (name === "learning_topic_content") data = hidden ? null : { locked: false, contents: [{ body: title }] };
    else if (name === "blog_posts") {
      const rows = hidden ? [] : [{ id: "p1", title, slug: "article", status: "published", tags: [], category: null }];
      data = new Headers(init?.headers).get("accept")?.includes("object+json") ? rows[0] ?? null : rows;
    }
    return new Response(JSON.stringify(data), { headers: { "content-type": "application/json", "content-range": "0-0/1" } });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
afterAll(() => { vi.doUnmock("@/lib/revisionedPublicRead"); if (scratch) rmSync(scratch, { recursive: true, force: true }); });

describe("durable app-first rollback patch", () => {
  it("restores fresh public reads before and after SQL permission removal", async () => {
    const oldProcess = activeRead("blog", "rollback-order-fixture", async client => {
      const { data, error } = await client.from("blog_posts").select("title");
      if (error) throw error;
      return data;
    });
    await oldProcess(); // represents the cached process that must be drained
    revisionCalls = 0;
    expect((await blog.getBlogPost("article"))?.title).toBe("Public article");
    denied = true; title = "Edited after SQL rollback"; render.memo.clear();
    // An undrained old process fails closed; permission errors are not fallback.
    await expect(oldProcess()).rejects.toThrow("revision is unavailable");
    revisionCalls = 0;
    const response = await middleware(new NextRequest("https://website-fixture.invalid/blog/article"));
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("noindex");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect((await blog.getBlogPost("article"))?.title).toBe("Edited after SQL rollback");
    hidden = true; render.memo.clear();
    expect(await blog.getBlogPost("article")).toBeNull();
    expect(revisionCalls).toBe(0);
  });

  it("keeps Phase 1 Blog sharing/payloads and fresh Home/course navigation", async () => {
    denied = true;
    const [a, b] = await Promise.all([blog.getBlogPage({ page: 1 }), blog.getBlogPage({ page: 1 })]);
    expect(a).toBe(b); expect(payloadCalls).toBe(1);
    const tree = await learning.getLearningTree("java");
    expect(tree?.sections[0].topics[0].slug).toBe("intro");
    const before = payloadCalls;
    await home.getCachedHomeData();
    expect(payloadCalls - before).toBe(5);
    render.memo.clear();
    await home.getCachedHomeData();
    expect(payloadCalls - before).toBe(10);
    hidden = true; render.memo.clear();
    expect(await learning.getLearningTree("java")).toBeNull();
    expect(await learning.getLearningTopicPage("java", "intro")).toBeNull();
    expect(revisionCalls).toBe(0);
  });

  it("keeps upstream failures distinct from absence and retries the next render", async () => {
    denied = true; failed = true;
    await expect(blog.getBlogPost("article")).rejects.toThrow("unavailable");
    failed = false; render.memo.clear();
    expect(await blog.getBlogPost("article")).not.toBeNull();
    expect(revisionCalls).toBe(0);
  });
});

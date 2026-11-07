import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { register } from "@/instrumentation";
import { getBlogPost, getBlogPage, getBlogCategories, getLatestPosts } from "@/lib/blog";
import { getCachedHomeData } from "@/lib/cache";
import { getLearningGrids } from "@/lib/learning";
import { warmPublicContent } from "@/lib/publicContentWarmup";
import { publicReadRuntime as runtime } from "@/lib/publicReadRuntime";
import { RevisionCache } from "@/lib/revisionCache";
import { getPublicSupabase } from "@/lib/supabase/server";

let revisionCalls: number;
let payloadCalls: string[];
let revisionMode: "ok" | "hang" | "slow" | "once" | "denied" | "missing";
let payloadDown: boolean;
let hidden: boolean;
const token = "00000000-0000-4000-8000-000000000001";
const logs = (method: "error" | "info") => vi.mocked(console[method]).mock.calls.map(([line]) => JSON.parse(line));

beforeEach(() => {
  render.memo.clear();
  Object.assign(runtime, { payloads: new RevisionCache(), revisionStarted: false, checkCount: 0, failureCount: 0, warmup: undefined });
  revisionCalls = 0; payloadCalls = []; revisionMode = "ok"; payloadDown = hidden = false;
  vi.useFakeTimers();
  vi.spyOn(process, "uptime").mockReturnValue(10);
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://startup-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "unit-test-anon");
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PHASE", "phase-production-server");
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const name = new URL(String(input)).pathname.split("/").at(-1)!;
    expect(init?.cache).toBe("no-store");
    if (name === "public_content_revision") {
      revisionCalls++;
      if (revisionMode === "hang") return new Promise<Response>(() => {});
      if (revisionMode === "slow" && revisionCalls === 1) await new Promise(resolve => setTimeout(resolve, 3000));
      const denied = revisionMode === "denied";
      const failed = revisionMode === "once" && revisionCalls === 1;
      const missing = revisionMode === "missing";
      return new Response(JSON.stringify(denied || failed || missing
        ? { code: denied ? "42501" : missing ? "PGRST202" : "08006", message: "PRIVATE upstream https://private.invalid" } : token),
      { status: denied ? 403 : failed ? 500 : missing ? 404 : 200 });
    }
    payloadCalls.push(name);
    if (payloadDown) return new Response(JSON.stringify({ code: "08006", message: "PRIVATE upstream" }), { status: 500 });
    let data: unknown = [];
    if (name === "blog_posts") {
      const rows = hidden ? [] : [{ id: "p1", slug: "published", title: "Published article", content: "Public body", tags: [], category: null }];
      data = new Headers(init?.headers).get("accept")?.includes("object+json") ? rows[0] ?? null : rows;
    }
    if (name === "learning_grids_list") data = [{ id: "g1", slug: "java", name: "Java" }];
    return new Response(JSON.stringify(data), { headers: { "content-range": "0-0/1" } });
  }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("process revision deadlines and diagnostics", () => {
  it("allows the first read to finish after 2.5s, then uses the steady deadline", async () => {
    revisionMode = "slow";
    const pending = getBlogPost("published");
    await vi.advanceTimersByTimeAsync(2999);
    expect(payloadCalls).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toMatchObject({ title: "Published article" });
    const checked = logs("info");
    expect(checked[0]).toMatchObject({ first_read: true, deadline_ms: 5000, duration_ms: 3000, attempt: 1, cold_start: true });
    expect(checked[1]).toMatchObject({ first_read: false, deadline_ms: 2500, phase: "verification" });
  });

  it("bounds the first hung read at 5s plus one 2.5s retry before a fresh projection", async () => {
    revisionMode = "hang";
    const pending = getBlogPost("published");
    await vi.advanceTimersByTimeAsync(4999);
    expect(revisionCalls).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(revisionCalls).toBe(2);
    expect(payloadCalls).toEqual([]);
    await vi.advanceTimersByTimeAsync(2499);
    expect(payloadCalls).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toMatchObject({ title: "Published article" });
    expect(logs("error")).toMatchObject([
      { event: "public_content_revision_failed", attempt: 1, duration_ms: 5000, deadline_ms: 5000, timed_out: true },
      { event: "public_content_revision_failed", attempt: 2, duration_ms: 2500, deadline_ms: 2500, timed_out: true },
    ]);
    expect(JSON.stringify(logs("error"))).not.toMatch(/https:|PRIVATE|unit-test-anon/);
  });

  it("uses 2.5s for both later attempts, even within the first 60 seconds", async () => {
    await getBlogPost("published");
    render.memo.clear(); revisionMode = "hang"; hidden = true; payloadCalls = [];
    const pending = getBlogPost("published");
    await vi.advanceTimersByTimeAsync(4999);
    expect(payloadCalls).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toBeNull(); // A withdrawn article cannot use the warm payload.
    expect(logs("error").every(entry => entry.deadline_ms === 2500 && entry.cold_start)).toBe(true);
  });

  it.each([59.999, 60, 120])("classifies process age %s seconds independently of first-read allowance", async age => {
    vi.mocked(process.uptime).mockReturnValue(age);
    await getBlogPost("published");
    expect(logs("info")[0]).toMatchObject({ first_read: true, cold_start: age < 60, deadline_ms: 5000 });
  });

  it("claims the longer deadline only once for concurrent reads", async () => {
    revisionMode = "hang";
    const pending = Promise.all([getBlogPost("published"), getLearningGrids()]);
    await vi.advanceTimersByTimeAsync(7500);
    await pending;
    const checks = logs("info");
    expect(checks.filter(entry => entry.deadline_ms === 5000)).toHaveLength(1);
    expect(checks.filter(entry => entry.attempt === 2)).toHaveLength(2);
  });

  it("recovers on exactly one retry without an unverified payload", async () => {
    revisionMode = "once";
    expect(await getBlogPost("published")).toMatchObject({ title: "Published article" });
    expect(revisionCalls).toBe(3); // failure, retry, post-fill verification
    expect(logs("error")).toHaveLength(1);
  });

  it("never retries denied revisions or falls back to a payload", async () => {
    revisionMode = "denied";
    await expect(getBlogPost("published")).rejects.toThrow("revision is unavailable");
    expect(revisionCalls).toBe(1);
    expect(payloadCalls).toEqual([]);
    expect(JSON.stringify(logs("error"))).not.toMatch(/https:|PRIVATE|unit-test-anon/);
  });

  it("identifies a payload deadline separately from a revision timeout", async () => {
    const upstream = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
      String(input).includes("/blog_posts") ? new Promise<Response>(() => {}) : upstream(input, init)));
    const pending = expect(getBlogPost("published")).rejects.toThrow("temporarily unavailable");
    await vi.advanceTimersByTimeAsync(10_000);
    await pending;
    expect(logs("error")).toMatchObject([{ event: "public_content_refresh_failed", phase: "verified-fill", timed_out: true, deadline_ms: 10_000 }]);
  });
});

describe("Next startup warm-up", () => {
  it("warms verified Home, Learning and Blog payloads once, while visitors verify current revisions", async () => {
    const first = warmPublicContent();
    expect(warmPublicContent()).toBe(first);
    await first;
    expect(logs("info").at(-1)).toMatchObject({ event: "public_content_warmup", outcome: "completed", failed: 0 });
    expect(new Set(payloadCalls)).toEqual(new Set(["projects", "testimonials", "faqs", "banners", "jobs", "learning_grids_list", "blog_posts", "blog_categories"]));
    expect(payloadCalls.filter(name => name === "blog_posts")).toHaveLength(2); // Listing plus Home's three cards.
    render.memo.clear(); payloadCalls = []; const before = revisionCalls;
    await Promise.all([getCachedHomeData(), getLearningGrids(), getBlogPage({ page: 1 }), getBlogCategories(), getLatestPosts(3)]);
    expect(payloadCalls).toEqual(["jobs"]); // Jobs always stay fresh.
    expect(revisionCalls - before).toBe(3);
    await register();
    expect(logs("info").filter(entry => entry.event === "public_content_warmup")).toHaveLength(1);
  });

  it("shares warmed payloads and the first-read claim across separately loaded server bundles", async () => {
    await warmPublicContent();
    vi.resetModules(); render.memo.clear(); payloadCalls = [];
    const routeBlog = await import("@/lib/blog");
    await routeBlog.getBlogPage({ page: 1 });
    expect(payloadCalls).toEqual([]);
    expect(logs("info").at(-1)).toMatchObject({ first_read: false, deadline_ms: 2500 });
  });

  it("does not admit warm-up fallback payloads when revision support is missing", async () => {
    revisionMode = "missing";
    await register();
    render.memo.clear(); payloadCalls = [];
    await getBlogPage({ page: 1 });
    expect(payloadCalls).toEqual(["blog_posts"]);
  });

  it("continues startup when all warm-up payloads fail, and lets the next visitor recover", async () => {
    payloadDown = true;
    await expect(register()).resolves.toBeUndefined();
    expect(logs("info").at(-1)).toMatchObject({ event: "public_content_warmup", outcome: "partial", failed: 5 });
    payloadDown = false; render.memo.clear();
    expect(await getBlogPage({ page: 1 })).toMatchObject({ posts: [{ title: "Published article" }] });
  });

  it("bounds a warm-up whose revision transport never settles without crashing startup", async () => {
    revisionMode = "hang";
    const pending = register();
    await vi.advanceTimersByTimeAsync(7500);
    await expect(pending).resolves.toBeUndefined();
    expect(logs("info").at(-1)).toMatchObject({ event: "public_content_warmup", outcome: "completed" });
  });

  it("contains an unexpected warm-up module failure without logging its message", async () => {
    const warmup = await import("@/lib/publicContentWarmup");
    vi.spyOn(warmup, "warmPublicContent").mockRejectedValueOnce(new Error("PRIVATE https://private.invalid"));
    await expect(register()).resolves.toBeUndefined();
    expect(logs("error")).toEqual([{ event: "public_content_warmup", outcome: "failed" }]);
  });

  it("starts after 20 seconds when Home's Jobs transport ignores abort", async () => {
    const upstream = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
      new URL(String(input)).pathname.endsWith("/jobs") ? new Promise<Response>(() => {}) : upstream(input, init)));
    let settled = false;
    const pending = register().then(() => { settled = true; });
    await vi.advanceTimersByTimeAsync(19_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(logs("error").find(entry => entry.event === "public_content_warmup"))
      .toMatchObject({ outcome: "failed", timed_out: true, duration_ms: 20_000, deadline_ms: 20_000 });
    vi.stubGlobal("fetch", upstream); render.memo.clear();
    expect(await getBlogPage({ page: 1 })).toMatchObject({ posts: [{ title: "Published article" }] });
  });

  it.each(["edge", "build", "unconfigured"])("skips upstream work for %s", async mode => {
    if (mode === "edge") vi.stubEnv("NEXT_RUNTIME", "edge");
    if (mode === "build") vi.stubEnv("NEXT_PHASE", "phase-production-build");
    if (mode === "unconfigured") vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    await register();
    expect(revisionCalls).toBe(0);
    expect(payloadCalls).toEqual([]);
  });
});

describe("public client lifecycle", () => {
  it("reuses one anonymous client per fetch policy without capturing a stale fetch implementation", async () => {
    const fresh = getPublicSupabase({ fresh: true })!;
    expect(getPublicSupabase({ fresh: true })).toBe(fresh);
    const catalog = getPublicSupabase()!;
    expect(getPublicSupabase()).toBe(catalog);
    expect(catalog).not.toBe(fresh);
    expect((await fresh.auth.getSession()).data.session).toBeNull();
    const replacement = vi.fn(async () => new Response(JSON.stringify(token)));
    vi.stubGlobal("fetch", replacement);
    await fresh.rpc("public_content_revision", { p_scope: "blog" });
    expect(replacement).toHaveBeenCalledOnce();
  });

  it("replaces clients when anonymous configuration changes and never reuses them when unconfigured", () => {
    const first = getPublicSupabase({ fresh: true });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "other-unit-test-anon");
    expect(getPublicSupabase({ fresh: true })).not.toBe(first);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(getPublicSupabase({ fresh: true })).toBeNull();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";

// Run the installed Next cache implementation with an in-memory storage adapter.
// No Next server, HTTP listener, source snapshot or remote service is involved.
await vi.hoisted(async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  vi.stubGlobal("AsyncLocalStorage", AsyncLocalStorage);
});
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
vi.mock("@/app/projects/[id]/ProjectPurchasePanel", () => ({ default: () => null }));

import { getCachedProjectDetail } from "@/lib/cache";
import ProjectDetailPage, { generateMetadata } from "@/app/projects/[id]/page";
import ProjectsError from "@/app/projects/error";
import { workAsyncStorage, type WorkStore } from "next/dist/server/app-render/work-async-storage.external";

const safeMessage = "Project data is temporarily unavailable. Please try again.";
const privateDetail = "fabricated-private-provider-detail";
const project = {
  id: "published-fixture", title: "Public fixture project", category_id: "category-fixture", category_name: "Examples",
  tech_stack: ["TypeScript"], price: 100, rating: 0, review_count: 0, thumbnail_url: null, is_premium: false,
  is_best_seller: false, description: "Fabricated public description", images: [], license: "Regular License", platform_fee_percent: 2,
};
const props = (id = project.id) => ({ params: Promise.resolve({ id }) });
type Value = { kind: string; data: { body: string }; revalidate: number };
const entries = new Map<string, { value: Value; isStale: boolean }>();
const storage = {
  generateSimpleCacheKey: async (key: string) => createHash("sha256").update(key).digest("hex"),
  get: vi.fn(async (key: string, _options?: { revalidate: number; tags?: string[] }) => entries.get(key) ?? null),
  set: vi.fn(async (key: string, value: Value) => { entries.set(key, { value, isStale: false }); }),
};
type Mode = "ok" | "query" | "outage" | "denied" | "timeout" | "network" | "ambiguous" | "malformed";
let mode: Mode;
let failedPart: "detail" | "reviews" | "related";
let category: string | null;
let calls: { part: string; id: string | null; select: string | null; signal?: AbortSignal | null }[];

function trackReadDeadlines() {
  const timers = vi.spyOn(globalThis, "setTimeout");
  const cleared = vi.spyOn(globalThis, "clearTimeout");
  return () => {
    // The real SDK also schedules auth timers; check the loader's deadlines.
    const handles = timers.mock.calls.flatMap((args, index) => args[1] === 10_000 ? [timers.mock.results[index].value] : []);
    expect(handles).toHaveLength(2); // failed fill and successful retry
    for (const handle of handles) expect(cleared).toHaveBeenCalledWith(handle);
  };
}

beforeEach(() => {
  render.memo.clear(); entries.clear(); mode = "ok"; failedPart = "detail"; category = project.category_id; calls = [];
  storage.get.mockClear(); storage.set.mockClear();
  vi.stubGlobal("__incrementalCache", storage);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "fabricated-anonymous-key");
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    expect(url.host).toBe("project-fixture.invalid");
    expect(init?.cache).toBe("no-store");
    const table = url.pathname.split("/").at(-1);
    const part = table === "reviews" ? "reviews" : url.searchParams.has("category_id") ? "related" : "detail";
    calls.push({ part, id: url.searchParams.get("id"), select: url.searchParams.get("select"), signal: init?.signal });
    if (part === failedPart && mode !== "ok") {
      if (mode === "timeout") return new Promise<Response>(() => {}); // deliberately ignores abort
      if (mode === "network") throw new TypeError(privateDetail);
      if (mode === "malformed") return new Response("null", { status: 200 });
      return new Response(JSON.stringify({
        code: mode === "denied" ? "42501" : mode === "ambiguous" ? "PGRST116" : "08006",
        message: privateDetail, details: "fabricated hidden row", hint: "fabricated internal hint",
      }), { status: mode === "denied" ? 403 : mode === "ambiguous" ? 406 : mode === "outage" ? 503 : 400 });
    }
    // Fabricated RLS-filtered results: anonymous reads cannot distinguish a
    // hidden/unpublished record from an identifier that never existed.
    const id = url.searchParams.get("id");
    const rows = part === "detail" ? id === `eq.${project.id}` ? [{ ...project, category_id: category }] : [] : [];
    return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
  }));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("project detail public read, metadata and cache", () => {
  it("shares published metadata/page reads and retains bounded, five-minute tagged payload caching", async () => {
    const [metadata, page] = await Promise.all([generateMetadata(props()), ProjectDetailPage(props())]);
    expect(metadata.title).toEqual({ absolute: `${project.title} | CampusEduX` });
    expect(metadata.alternates?.canonical).toBe(`https://www.campusedux.com/projects/${project.id}`);
    expect(metadata.robots).toBeUndefined();
    const html = renderToStaticMarkup(page);
    expect(html).toContain(project.title);
    expect(html).toContain(project.description);
    expect(calls.map(c => c.part).sort()).toEqual(["detail", "related", "reviews"]);
    expect(calls[0].select).not.toContain("*");
    expect(calls.every(c => c.signal instanceof AbortSignal)).toBe(true);
    expect(storage.set).toHaveBeenCalledOnce();
    expect(storage.set.mock.calls[0][1].revalidate).toBe(300);
    expect(storage.get.mock.calls[0][1]).toMatchObject({ revalidate: 300, tags: ["projects"] });
    render.memo.clear();
    mode = "query";
    await expect(generateMetadata(props())).resolves.toEqual(metadata);
    expect(calls).toHaveLength(3);
  });

  it.each(["nonexistent-fixture", "unpublished-fixture", "private-fixture"])(
    "preserves genuine missing metadata and Next's actual 404 signal for %s", async id => {
      expect(await generateMetadata(props(id))).toEqual({ title: "Project not found", robots: { index: false, follow: false } });
      await expect(ProjectDetailPage(props(id))).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
      expect(calls).toHaveLength(1);
      expect(await getCachedProjectDetail(id)).toEqual({ project: null, reviews: [], related: [] });
      expect(storage.set).toHaveBeenCalledOnce();
      expect(JSON.stringify([...entries.values()])).not.toContain(privateDetail);
    },
  );

  it("keeps empty reviews/related valid and skips the related query without a category", async () => {
    category = null;
    expect(await getCachedProjectDetail(project.id)).toMatchObject({ project: { id: project.id }, reviews: [], related: [] });
    expect(calls.map(c => c.part)).toEqual(["detail", "reviews"]);
  });

  it.each(["query", "denied", "ambiguous"] as const)(
    "propagates %s failures through actual Next caching, metadata and page without a false 404", async failure => {
      mode = failure;
      const results = await Promise.allSettled([generateMetadata(props()), ProjectDetailPage(props())]);
      for (const result of results) {
        expect(result.status).toBe("rejected");
        if (result.status === "rejected") {
          expect(result.reason).toBeInstanceOf(Error);
          expect(result.reason.message).toBe(safeMessage);
          expect(result.reason.digest).toBeUndefined();
          expect(result.reason.cause).toBeUndefined();
          expect(JSON.stringify(result.reason)).not.toContain(privateDetail);
        }
      }
      expect(calls).toHaveLength(1);
      expect(storage.set).not.toHaveBeenCalled();
      expect(entries.size).toBe(0);
      // A rejected render memo stays failed for that render; Retry begins a new one.
      mode = "ok";
      await expect(generateMetadata(props())).rejects.toThrow(safeMessage);
      render.memo.clear();
      expect((await generateMetadata(props())).title).toEqual({ absolute: `${project.title} | CampusEduX` });
      expect(calls).toHaveLength(4);
      expect(storage.set).toHaveBeenCalledOnce();
    },
  );

  it("does not cache missing configuration as a confirmed miss", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    await expect(generateMetadata(props())).rejects.toThrow(safeMessage);
    expect(calls).toHaveLength(0);
    expect(storage.set).not.toHaveBeenCalled();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project-fixture.invalid"); render.memo.clear();
    await expect(ProjectDetailPage(props())).resolves.toBeDefined();
  });

  it.each(["detail", "reviews", "related"] as const)("bounds a stalled %s read, aborts and recovers without a cached miss", async part => {
    vi.useFakeTimers(); mode = "timeout"; failedPart = part;
    const deadlinesCleared = trackReadDeadlines();
    const result = Promise.allSettled([generateMetadata(props()), ProjectDetailPage(props())]);
    await vi.advanceTimersByTimeAsync(10_000);
    for (const item of await result) {
      expect(item.status).toBe("rejected");
      if (item.status === "rejected") expect(item.reason.message).toBe(safeMessage);
    }
    expect(calls.every(c => c.signal?.aborted)).toBe(true);
    expect(storage.set).not.toHaveBeenCalled();
    mode = "ok"; render.memo.clear();
    expect((await generateMetadata(props())).robots).toBeUndefined();
    deadlinesCleared();
  });

  it.each(["network", "outage"] as const)("normalizes %s failures, including SDK retries, and recovers", async failure => {
    vi.useFakeTimers(); mode = failure;
    const deadlinesCleared = trackReadDeadlines();
    const result = Promise.allSettled([generateMetadata(props()), ProjectDetailPage(props())]);
    await vi.advanceTimersByTimeAsync(10_000);
    for (const item of await result) {
      expect(item.status).toBe("rejected");
      if (item.status === "rejected") expect(item.reason.message).toBe(safeMessage);
    }
    expect(storage.set).not.toHaveBeenCalled();
    mode = "ok"; render.memo.clear();
    await expect(ProjectDetailPage(props())).resolves.toBeDefined();
    deadlinesCleared();
  });

  it.each(["reviews", "related"] as const)("does not cache a partial successful detail after %s fails", async part => {
    mode = "query"; failedPart = part;
    await expect(generateMetadata(props())).rejects.toThrow(safeMessage);
    expect(storage.set).not.toHaveBeenCalled();
    mode = "ok"; render.memo.clear();
    await expect(ProjectDetailPage(props())).resolves.toBeDefined();
    expect(storage.set).toHaveBeenCalledOnce();
  });

  it.each(["reviews", "related"] as const)("rejects malformed null %s arrays rather than caching empty data", async part => {
    mode = "malformed"; failedPart = part;
    await expect(getCachedProjectDetail(project.id)).rejects.toThrow(safeMessage);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it("keeps concurrent public and hidden identifiers isolated", async () => {
    const [published, hidden] = await Promise.all([generateMetadata(props()), generateMetadata(props("private-fixture"))]);
    expect(published.title).toEqual({ absolute: `${project.title} | CampusEduX` });
    expect(hidden).toEqual({ title: "Project not found", robots: { index: false, follow: false } });
    expect(calls.filter(c => c.part === "detail")).toHaveLength(2);
    expect(JSON.stringify(hidden)).not.toContain(project.title);
  });

  it("retains the last successful payload on Next's failed background revalidation", async () => {
    const first = await getCachedProjectDetail(project.id);
    for (const entry of entries.values()) entry.isStale = true;
    mode = "query";
    const store = { route: "/projects/[id]", page: "/projects/[id]/page", incrementalCache: storage } as unknown as WorkStore;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await workAsyncStorage.run(store, () => getCachedProjectDetail(project.id))).toEqual(first);
    await Promise.all(Object.values(store.pendingRevalidates ?? {}));
    expect(log).toHaveBeenCalled();
    expect(storage.set).toHaveBeenCalledOnce();
    expect(JSON.parse([...entries.values()][0].value.data.body)).toEqual(first);
    mode = "ok";
    await expect(getCachedProjectDetail(project.id)).resolves.toEqual(first);
    expect(storage.set).toHaveBeenCalledTimes(2);
  });

  it("uses the existing safe Projects boundary and wires its Retry to Next reset", () => {
    const reset = vi.fn();
    const tree = ProjectsError({ error: new Error(privateDetail), reset });
    const html = renderToStaticMarkup(createElement(ProjectsError, { error: new Error(privateDetail), reset }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Projects are temporarily unavailable.");
    expect(html).toContain("Retry");
    expect(html).not.toContain(privateDetail);
    function retry(node: ReactNode): boolean {
      if (!isValidElement(node)) return false;
      const element = node as ReactElement<{ onRetry?: () => void; children?: ReactNode }>;
      if (element.props.onRetry) { element.props.onRetry(); return true; }
      return (Array.isArray(element.props.children) ? element.props.children : [element.props.children]).some(retry);
    }
    expect(retry(tree)).toBe(true);
    expect(reset).toHaveBeenCalledOnce();
  });
});

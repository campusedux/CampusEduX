import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ projects: vi.fn(), jobs: vi.fn(), memo: new Map<unknown, Map<string, unknown>>() }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  cache: (fn: (key: string) => unknown) => (key: string) => {
    if (!api.memo.has(fn)) api.memo.set(fn, new Map());
    const memo = api.memo.get(fn)!;
    if (!memo.has(key)) memo.set(key, fn(key));
    return memo.get(key);
  },
}));
vi.mock("@/lib/cache", () => ({ getCachedProjectsPage: api.projects, getCachedJobsPage: api.jobs }));
import { getJobsCatalogState, getProjectsCatalogState } from "@/lib/catalogState";

const args = { from: 0, size: 24, sortColumn: "posted_at", sortAscending: false };
beforeEach(() => {
  api.memo.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe("catalog state across metadata, page and outages", () => {
  it("shares the exact count and rows across equivalent request arguments", async () => {
    api.jobs.mockResolvedValue({ jobs: [{ id: "public-job" }], count: 1 });
    const [a, b] = await Promise.all([getJobsCatalogState(args), getJobsCatalogState({ ...args })]);
    expect(a).toEqual({ state: "items", data: { jobs: [{ id: "public-job" }], count: 1 } });
    expect(b).toEqual(a);
    expect(api.jobs).toHaveBeenCalledTimes(1);
  });

  it("remembers only counts during an outage, never old rows that may now be hidden", async () => {
    api.jobs.mockResolvedValue({ jobs: [{ id: "formerly-public" }], count: 7 });
    await getJobsCatalogState({ ...args, q: "count-only" });
    api.memo.clear();
    api.jobs.mockRejectedValue(new Error("private upstream details"));
    const state = await getJobsCatalogState({ ...args, q: "count-only" });
    expect(state).toEqual({ state: "unavailable", data: null, lastKnownCount: 7 });
    expect(JSON.stringify(state)).not.toContain("formerly-public");
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private upstream details");
  });

  it("distinguishes a confirmed empty catalog from a cold failure and subsequent recovery", async () => {
    const projectArgs = { ...args, page: 1, q: "recovery" };
    api.projects.mockRejectedValue(new Error("offline"));
    expect(await getProjectsCatalogState(projectArgs)).toEqual({ state: "unavailable", data: null, lastKnownCount: null });
    api.memo.clear();
    api.projects.mockResolvedValue({ projects: [], count: 0 });
    expect(await getProjectsCatalogState(projectArgs)).toMatchObject({ state: "empty", data: { count: 0 } });
    api.memo.clear();
    api.projects.mockRejectedValue(new Error("offline"));
    expect(await getProjectsCatalogState(projectArgs)).toEqual({ state: "unavailable", data: null, lastKnownCount: 0 });
  });

  it("bounds a hung catalog query without inventing an empty result", async () => {
    vi.useFakeTimers();
    api.jobs.mockImplementation(() => new Promise(() => {}));
    const result = getJobsCatalogState({ ...args, q: "timeout" });
    await vi.advanceTimersByTimeAsync(2000);
    expect(await result).toEqual({ state: "unavailable", data: null, lastKnownCount: null });
  });
});

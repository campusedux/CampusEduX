import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicContentOverload, RevisionCache } from "@/lib/revisionCache";

afterEach(() => vi.useRealTimers());

describe("bounded revision payload storage", () => {
  it("shares a concurrent fill and isolates returned objects", async () => {
    const cache = new RevisionCache();
    const load = vi.fn(async () => ({ body: "public" }));
    const [a, b] = await Promise.all([cache.read("a", load), cache.read("a", load)]);
    a.body = "mutated";
    expect(b.body).toBe("public");
    expect(await cache.read("a", load)).toEqual({ body: "public" });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("retries failed fills and never substitutes empty content", async () => {
    const cache = new RevisionCache();
    const load = vi.fn().mockRejectedValueOnce(new Error("upstream")).mockResolvedValue(null);
    await expect(cache.read("a", load)).rejects.toThrow("upstream");
    expect(await cache.read("a", load)).toBeNull();
    expect(await cache.read("a", load)).toBeNull();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("evicts least recently used entries at the entry limit", async () => {
    const cache = new RevisionCache(2);
    const load = vi.fn(async () => "body");
    await cache.read("a", load); await cache.read("b", load);
    await cache.read("a", load); await cache.read("c", load);
    await cache.read("a", load);
    expect(load).toHaveBeenCalledTimes(3);
    await cache.read("b", load);
    expect(load).toHaveBeenCalledTimes(4);
  });

  it("bounds serialized storage including keys and declines oversized payloads", async () => {
    const cache = new RevisionCache(10, 16);
    const load = vi.fn(async () => "123456"); // 8 bytes JSON + 1 key
    await cache.read("a", load); await cache.read("b", load); await cache.read("a", load);
    expect(load).toHaveBeenCalledTimes(3);
    const huge = vi.fn(async () => "x".repeat(30));
    await cache.read("huge", huge); await cache.read("huge", huge);
    expect(huge).toHaveBeenCalledTimes(2);
  });

  it("bounds concurrent fills and still joins an existing key at capacity", async () => {
    const cache = new RevisionCache(2, 1024, 1, 0);
    let finish!: (value: string) => void;
    const load = vi.fn(() => new Promise<string>(resolve => { finish = resolve; }));
    const a = cache.read("a", load);
    const joined = cache.read("a", load);
    await expect(cache.read("b", async () => "other")).rejects.toThrow("busy");
    finish("done");
    expect(await Promise.all([a, joined])).toEqual(["done", "done"]);
    expect(await cache.read("b", async () => "other")).toBe("other");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("admits FIFO queued fills and joins active/queued keys even when full", async () => {
    vi.useFakeTimers();
    const cache = new RevisionCache(4, 1024, 1, 2);
    let release!: (value: string) => void;
    const order: string[] = [];
    const a = cache.read("a", () => new Promise<string>(ok => { release = ok; }));
    const bLoad = vi.fn(async () => { order.push("b"); return "B"; });
    const b = cache.read("b", bLoad);
    const c = cache.read("c", async () => { order.push("c"); return "C"; });
    const joinA = cache.read("a", async () => "wrong");
    const joinB = cache.read("b", async () => "wrong");
    const done = Promise.all([a, b, c, joinA, joinB]);
    await Promise.resolve();
    expect(bLoad).not.toHaveBeenCalled();
    release("A");
    expect(await done).toEqual(["A", "B", "C", "A", "B"]);
    expect(order).toEqual(["b", "c"]);
    expect(bLoad).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects overflow without starting uncached work and recovers capacity", async () => {
    const cache = new RevisionCache(4, 1024, 1, 1);
    let release!: (value: string) => void;
    const a = cache.read("a", () => new Promise<string>(ok => { release = ok; }));
    const b = cache.read("b", async () => "B");
    const overflow = vi.fn(async () => "C");
    await expect(cache.read("c", overflow)).rejects.toMatchObject({
      name: "PublicContentOverload", reason: "queue-full",
    });
    expect(overflow).not.toHaveBeenCalled();
    release("A");
    await Promise.all([a, b]);
    expect(await cache.read("c", overflow)).toBe("C");
  });

  it("expires queued fills and all joiners, clears their slot and permits a retry", async () => {
    vi.useFakeTimers();
    const cache = new RevisionCache(4, 1024, 1, 1, 20);
    let release!: (value: string) => void;
    const a = cache.read("a", () => new Promise<string>(ok => { release = ok; }));
    const abandoned = vi.fn(async () => "never");
    const b = cache.read("b", abandoned);
    const join = cache.read("b", abandoned);
    const outcomes = Promise.allSettled([b, join]);
    await vi.advanceTimersByTimeAsync(20);
    for (const result of await outcomes) {
      expect(result.status).toBe("rejected");
      if (result.status === "rejected") expect(result.reason).toMatchObject({ reason: "deadline" });
    }
    const retry = cache.read("b", async () => "recovered");
    release("A");
    expect(await Promise.all([a, retry])).toEqual(["A", "recovered"]);
    expect(abandoned).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects overdue queued work even if its timer has not run yet", async () => {
    vi.useFakeTimers();
    const cache = new RevisionCache(4, 1024, 1, 1, 20);
    let release!: (value: string) => void;
    const a = cache.read("a", () => new Promise<string>(ok => { release = ok; }));
    const expired = vi.fn(async () => "never");
    const b = cache.read("b", expired);
    const outcome = expect(b).rejects.toBeInstanceOf(PublicContentOverload);
    await Promise.resolve();
    vi.setSystemTime(Date.now() + 21);
    release("A");
    await a; await outcome;
    expect(expired).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(await cache.read("b", async () => "retry")).toBe("retry");
  });

  it("releases active slots on failed fills, drains failures, and recovers", async () => {
    vi.useFakeTimers();
    const cache = new RevisionCache(4, 1024, 1, 2);
    let fail!: (error: Error) => void;
    const a = cache.read("a", () => new Promise<string>((_, reject) => { fail = reject; }));
    const b = cache.read("b", () => { throw new Error("queued upstream failed"); });
    const c = cache.read("c", async () => "C");
    const outcomes = Promise.allSettled([a, b, c]);
    await Promise.resolve();
    fail(new Error("active upstream failed"));
    expect((await outcomes).map(r => r.status)).toEqual(["rejected", "rejected", "fulfilled"]);
    expect(await cache.read("a", async () => "A")).toBe("A");
    expect(await cache.read("b", async () => "B")).toBe("B");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds the default admission window to 32 active plus 64 queued for 2 seconds", async () => {
    vi.useFakeTimers();
    const cache = new RevisionCache();
    const release: ((value: string) => void)[] = [];
    const loads = vi.fn(() => new Promise<string>(ok => { release.push(ok); }));
    const pending = Array.from({ length: 96 }, (_, i) => cache.read(`key-${i}`, loads));
    const outcomes = Promise.allSettled(pending);
    await expect(cache.read("overflow", loads)).rejects.toMatchObject({ reason: "queue-full" });
    expect(loads).toHaveBeenCalledTimes(32);
    await vi.advanceTimersByTimeAsync(2000);
    expect(loads).toHaveBeenCalledTimes(32); // Expired work never starts.
    release.forEach(ok => ok("done"));
    const results = await outcomes;
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(32);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(64);
    expect(vi.getTimerCount()).toBe(0);
    expect(await cache.read("overflow", async () => "recovered")).toBe("recovered");
  });
});

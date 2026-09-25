import { describe, it, expect, vi, afterEach } from "vitest";
import { rlHit, aiBudgetTake, limitResponse, budgetResponse, envInt, type RpcClient } from "@/lib/rateLimitDb";

const client = (data: unknown, error: unknown = null): RpcClient & { rpc: ReturnType<typeof vi.fn> } => ({
  rpc: vi.fn(async () => ({ data, error })),
});

afterEach(() => vi.unstubAllEnvs());

describe("rlHit", () => {
  it("maps the RPC reply and passes the bucket args", async () => {
    const c = client({ allowed: true, remaining: 4, retry_after_seconds: 0 });
    const r = await rlHit(c, "judge", 6, 60);
    expect(c.rpc).toHaveBeenCalledWith("rl_hit", { p_bucket: "judge", p_max: 6, p_window_seconds: 60 });
    expect(r).toMatchObject({ allowed: true, remaining: 4 });
  });
  it("reports a denial with retry-after", async () => {
    const r = await rlHit(client({ allowed: false, remaining: 0, retry_after_seconds: 17 }), "b", 1, 60);
    expect(r).toMatchObject({ allowed: false, retryAfter: 17 });
    expect(r.unavailable).toBeUndefined();
  });
  it("fails closed on RPC error, bad shape, or a thrown call", async () => {
    expect((await rlHit(client(null, { message: "x" }), "b", 1, 1)).unavailable).toBe(true);
    expect((await rlHit(client({ nope: 1 }), "b", 1, 1)).allowed).toBe(false);
    const throwing: RpcClient = { rpc: () => Promise.reject(new Error("net")) };
    expect(await rlHit(throwing, "b", 1, 1)).toMatchObject({ allowed: false, unavailable: true });
  });
});

describe("aiBudgetTake", () => {
  it("passes kind + limit and maps the reply", async () => {
    const c = client({ allowed: true, used: 3, limit: 30 });
    expect(await aiBudgetTake(c, "resume_assist", 30)).toMatchObject({ allowed: true, used: 3, limit: 30 });
    expect(c.rpc).toHaveBeenCalledWith("ai_budget_take", { p_kind: "resume_assist", p_daily_limit: 30 });
  });
  it("fails closed on error", async () => {
    expect(await aiBudgetTake(client(null, { message: "x" }), "k", 5)).toMatchObject({ allowed: false, unavailable: true });
  });
});

describe("responses", () => {
  it("429 with Retry-After when denied, 503 when the limiter is down, null when allowed", async () => {
    expect(limitResponse({ allowed: true, remaining: 1, retryAfter: 1 }, { message: "m" })).toBeNull();
    const denied = limitResponse({ allowed: false, remaining: 0, retryAfter: 9 }, { message: "slow" })!;
    expect(denied.status).toBe(429);
    expect(denied.headers.get("Retry-After")).toBe("9");
    expect(await denied.json()).toEqual({ ok: false, error: "slow" });
    const down = limitResponse({ allowed: false, remaining: 0, retryAfter: 5, unavailable: true }, { message: "m", withOk: false })!;
    expect(down.status).toBe(503);
    expect(await down.json()).not.toHaveProperty("ok");
  });
  it("budgetResponse 429 / 503", () => {
    expect(budgetResponse({ allowed: true, used: 1, limit: 2 }, { message: "m" })).toBeNull();
    expect(budgetResponse({ allowed: false, used: 2, limit: 2 }, { message: "m" })!.status).toBe(429);
    expect(budgetResponse({ allowed: false, used: 0, limit: 2, unavailable: true }, { message: "m" })!.status).toBe(503);
  });
});

describe("envInt", () => {
  it("defaults, parses and clamps", () => {
    expect(envInt("NOPE_X", 7)).toBe(7);
    vi.stubEnv("T_X", "12");
    expect(envInt("T_X", 7)).toBe(12);
    vi.stubEnv("T_X", "-5");
    expect(envInt("T_X", 7)).toBe(1);
  });
});

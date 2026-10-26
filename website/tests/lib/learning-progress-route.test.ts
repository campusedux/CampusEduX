import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
const getUser = vi.fn();
vi.mock("@/lib/supabase/authed-server", () => ({
  createAuthedServerSupabase: () => ({ auth: { getUser }, rpc }),
}));

const load = () => import("../../src/app/api/learning/progress/route");
const get = (qs: string, extraHeaders: Record<string, string> = {}) =>
  new Request(`http://x/api/learning/progress${qs}`, { headers: extraHeaders });

beforeEach(() => {
  rpc.mockReset();
  getUser.mockReset();
});

describe("GET /api/learning/progress", () => {
  it("anonymous request gets no user data, no RPC call, and is not cacheable", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await load();
    const res = await GET(get("?grid=java"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ topics: [] });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("ignores any user id supplied by the client and only forwards the grid slug", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "session-user" } } });
    rpc.mockResolvedValue({ data: { topics: [{ topic_id: "t1" }] } });
    const { GET } = await load();
    const res = await GET(get("?grid=java&user_id=someone-else&uid=x", { "x-user-id": "someone-else" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ topics: [{ topic_id: "t1" }] });
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("learning_progress_summary", { p_grid_slug: "java", p_platform: "website" });
  });

  it("rejects malformed grid slugs before touching auth or the database", async () => {
    const { GET } = await load();
    for (const qs of ["", "?grid=", "?grid=a%20b", "?grid=../x", "?grid=" + "a".repeat(101)]) {
      const res = await GET(get(qs));
      expect(res.status).toBe(400);
      expect(res.headers.get("cache-control")).toBe("private, no-store");
    }
    expect(getUser).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns a private 503 when the progress RPC fails", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u" } } });
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { GET } = await load();
    const res = await GET(get("?grid=java"));
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(await res.json()).toEqual({ error: "Progress is unavailable. Please retry." });
  });
});

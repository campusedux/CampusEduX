import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetSupabaseMock, setRpcResult, setTableResult, setUser, supabase } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));
import { GET } from "@/app/api/session/route";

beforeEach(() => resetSupabaseMock());

describe("session premium entitlement", () => {
  it("returns no profile and performs no entitlement lookup without authentication", async () => {
    const response = await GET();
    expect(await response.json()).toEqual({ profile: null });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it.each([false, null, "true"])("ignores the stale mirror when entitlement is %j", async (data) => {
    setUser({ id: "u-1" });
    setTableResult("profiles", { data: { is_premium: true } });
    setRpcResult("current_user_is_premium", { data });
    const response = await GET();
    expect((await response.json()).profile.isPremium).toBe(false);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("refreshes entitlement on each request without requiring a profile write", async () => {
    setUser({ id: "u-1" });
    setTableResult("profiles", { data: { is_premium: true } });
    setRpcResult("current_user_is_premium", { data: true });
    expect((await (await GET()).json()).profile.isPremium).toBe(true);
    setRpcResult("current_user_is_premium", { data: false });
    expect((await (await GET()).json()).profile.isPremium).toBe(false);
  });

  it("fails closed on entitlement lookup errors", async () => {
    setUser({ id: "u-1" });
    setTableResult("profiles", { data: { is_premium: true } });
    setRpcResult("current_user_is_premium", { data: true, error: { message: "unavailable" } });
    expect((await (await GET()).json()).profile.isPremium).toBe(false);
  });

  it("preserves the profile-unavailable response", async () => {
    setUser({ id: "u-1" });
    setTableResult("profiles", { error: { message: "unavailable" } });
    expect((await GET()).status).toBe(503);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { supabase, resetSupabaseMock, setUser, setTableResult, callsFor } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import { removeFromWishlistAction } from "@/lib/actions/wishlist";

beforeEach(() => resetSupabaseMock());

describe("removeFromWishlistAction", () => {
  it("rejects when signed out", async () => {
    setUser(null);
    expect(await removeFromWishlistAction("p1")).toEqual({ error: expect.stringMatching(/sign in/i) });
  });
  it("deletes only the caller's own row", async () => {
    setUser({ id: "u1" });
    setTableResult("wishlists", { data: null, error: null });
    expect(await removeFromWishlistAction("p1")).toEqual({ ok: true });
    const eqs = callsFor("wishlists").filter((c) => c.verb === "eq").map((c) => c.args);
    expect(eqs).toContainEqual(["project_id", "p1"]);
    expect(eqs).toContainEqual(["user_id", "u1"]);
  });
  it("rejects an empty id", async () => {
    setUser({ id: "u1" });
    expect(await removeFromWishlistAction("  ")).toEqual({ error: expect.any(String) });
  });
});

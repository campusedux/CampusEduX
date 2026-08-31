import { describe, it, expect, vi, beforeEach } from "vitest";

// redirect() throws to halt rendering — capture the target url like admin-panel does.
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw { digest: "NEXT_REDIRECT", url };
  }),
}));
vi.mock("next/navigation", () => ({ redirect }));

import { supabase, resetSupabaseMock, setUser, setTableResult } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import { requireUser, getOptionalUser } from "@/lib/auth";

beforeEach(() => resetSupabaseMock());

describe("requireUser", () => {
  it("redirects to /login when there is no session", async () => {
    setUser(null);
    await expect(requireUser()).rejects.toMatchObject({ url: "/login" });
  });

  it("maps the profiles row for a signed-in user", async () => {
    setUser({ id: "u-1", email: "auth@campusedux.app" });
    setTableResult("profiles", {
      data: {
        id: "u-1",
        email: "profile@campusedux.app",
        full_name: "Riya",
        mobile_number: "9000000000",
        avatar_url: null,
        course: "B.Tech",
        branch: "CSE",
        year: "3",
        is_premium: true,
        referral_code: "RIYA10",
      },
    });

    const user = await requireUser();
    expect(user).toMatchObject({
      id: "u-1",
      email: "profile@campusedux.app",
      fullName: "Riya",
      isPremium: true,
      referralCode: "RIYA10",
    });
  });

  it("does not crash when the profiles row is missing — falls back to auth email", async () => {
    setUser({ id: "u-2", email: "only-auth@campusedux.app" });
    setTableResult("profiles", { data: null });

    const user = await requireUser();
    expect(user.id).toBe("u-2");
    expect(user.email).toBe("only-auth@campusedux.app");
    expect(user.fullName).toBe("");
    expect(user.isPremium).toBe(false);
  });
});

describe("getOptionalUser", () => {
  it("returns null when signed out (no redirect)", async () => {
    setUser(null);
    await expect(getOptionalUser()).resolves.toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns id + email when signed in", async () => {
    setUser({ id: "u-9", email: "x@y.com" });
    await expect(getOptionalUser()).resolves.toEqual({ id: "u-9", email: "x@y.com" });
  });
});

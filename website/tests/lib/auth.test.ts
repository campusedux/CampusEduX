import { describe, it, expect, vi, beforeEach } from "vitest";

// redirect() throws to halt rendering — capture the target url like admin-panel does.
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw { digest: "NEXT_REDIRECT", url };
  }),
}));
vi.mock("next/navigation", () => ({ redirect }));

import { supabase, resetSupabaseMock, setUser, setTableResult, setRpcResult } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import { requireUser, getOptionalUser, getAccountUser, isAcademicComplete, postLoginDestination } from "@/lib/auth";

beforeEach(() => resetSupabaseMock());

describe("isAcademicComplete", () => {
  it("is true only when course, branch and year are all present", () => {
    expect(isAcademicComplete({ course: "B.Tech", branch: "CSE", year: "3" })).toBe(true);
    expect(isAcademicComplete({ course: "B.Tech", branch: "CSE", year: null })).toBe(false);
    expect(isAcademicComplete({ course: "B.Tech", branch: null, year: "3" })).toBe(false);
    expect(isAcademicComplete({ course: null, branch: null, year: null })).toBe(false);
  });
});

describe("requireUser", () => {
  it("redirects to /login when there is no session", async () => {
    setUser(null);
    await expect(requireUser()).rejects.toMatchObject({ url: "/login" });
  });

  it("returns the account directly (no redirect) for a complete existing profile", async () => {
    setRpcResult("current_user_is_premium", { data: true });
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
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /onboarding when course/branch/year are not all set", async () => {
    setUser({ id: "u-3", email: "new@campusedux.app" });
    setTableResult("profiles", {
      data: {
        id: "u-3",
        email: "new@campusedux.app",
        full_name: "New Student",
        mobile_number: "9111111111",
        avatar_url: null,
        course: "B.Tech",
        branch: null,
        year: null,
        is_premium: false,
        referral_code: null,
      },
    });

    await expect(requireUser()).rejects.toMatchObject({ url: "/onboarding" });
  });

  it("redirects to /onboarding when the profiles row is missing entirely (brand-new Google user)", async () => {
    setUser({ id: "u-2", email: "only-auth@campusedux.app" });
    setTableResult("profiles", { data: null });

    await expect(requireUser()).rejects.toMatchObject({ url: "/onboarding" });
  });
});

describe("getAccountUser", () => {
  it.each([false, null, "true", { error: true }])("denies stale-flag access for entitlement response %j", async (data) => {
    setUser({ id: "u-1" });
    setTableResult("profiles", { data: { id: "u-1", is_premium: true } });
    setRpcResult("current_user_is_premium", { data });
    expect((await getAccountUser())?.isPremium).toBe(false);
    expect(supabase.rpc).toHaveBeenCalledWith("current_user_is_premium");
  });

  it("fails closed on entitlement errors even with a stale flag and true data", async () => {
    setUser({ id: "u-1" });
    setTableResult("profiles", { data: { is_premium: true } });
    setRpcResult("current_user_is_premium", { data: true, error: { message: "unavailable" } });
    expect((await getAccountUser())?.isPremium).toBe(false);
  });

  it("accepts a valid entitlement even when the display mirror is false", async () => {
    setUser({ id: "u-1" });
    setTableResult("profiles", { data: { is_premium: false } });
    setRpcResult("current_user_is_premium", { data: true });
    expect((await getAccountUser())?.isPremium).toBe(true);
  });

  it("does not crash when the profiles row is missing — falls back to auth email", async () => {
    setUser({ id: "u-2", email: "only-auth@campusedux.app" });
    setTableResult("profiles", { data: null });

    const user = await getAccountUser();
    expect(user?.id).toBe("u-2");
    expect(user?.email).toBe("only-auth@campusedux.app");
    expect(user?.fullName).toBe("");
    expect(user?.isPremium).toBe(false);
    expect(user?.course).toBeNull();
    expect(user?.branch).toBeNull();
    expect(user?.year).toBeNull();
  });

  it("returns null when signed out", async () => {
    setUser(null);
    await expect(getAccountUser()).resolves.toBeNull();
  });
});

describe("postLoginDestination", () => {
  it("routes an incomplete profile to /onboarding, ignoring next", async () => {
    setUser({ id: "u-1", email: "new@campusedux.app" });
    setTableResult("profiles", { data: { id: "u-1", course: "B.Tech", branch: null, year: null } });

    await expect(postLoginDestination("/account/wallet")).resolves.toBe("/onboarding");
  });

  it("returns next unchanged for a complete profile", async () => {
    setUser({ id: "u-2", email: "done@campusedux.app" });
    setTableResult("profiles", { data: { id: "u-2", course: "B.Tech", branch: "CSE", year: "3" } });

    await expect(postLoginDestination("/projects")).resolves.toBe("/projects");
  });

  it("returns next unchanged when there is no session", async () => {
    setUser(null);
    await expect(postLoginDestination("/jobs")).resolves.toBe("/jobs");
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

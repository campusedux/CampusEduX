import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

import { supabase, resetSupabaseMock, setExchangeCodeForSessionResult, setUser, setTableResult } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import { GET } from "@/app/auth/callback/route";

beforeEach(() => resetSupabaseMock());

function req(query: string) {
  return new NextRequest(`https://www.campusedux.com/auth/callback${query}`);
}

describe("GET /auth/callback", () => {
  it("exchanges a valid code and redirects to a safe next path", async () => {
    const res = await GET(req("?code=abc123&next=%2Faccount%2Fwallet"));
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(res.headers.get("location")).toBe("https://www.campusedux.com/account/wallet");
  });

  it("defaults to / when next is missing", async () => {
    const res = await GET(req("?code=abc123"));
    expect(res.headers.get("location")).toBe("https://www.campusedux.com/");
  });

  it("rejects an absolute/external next and falls back to /", async () => {
    const res = await GET(req("?code=abc123&next=https%3A%2F%2Fevil.com"));
    expect(res.headers.get("location")).toBe("https://www.campusedux.com/");
  });

  it("rejects a protocol-relative next and falls back to /", async () => {
    const res = await GET(req("?code=abc123&next=%2F%2Fevil.com"));
    expect(res.headers.get("location")).toBe("https://www.campusedux.com/");
  });

  it("sends a new/incomplete Google profile to /onboarding, ignoring next", async () => {
    setUser({ id: "u-1", email: "new@campusedux.app" });
    setTableResult("profiles", { data: { id: "u-1", course: "B.Tech", branch: null, year: null } });

    const res = await GET(req("?code=abc123&next=%2Faccount%2Fwallet"));
    expect(res.headers.get("location")).toBe("https://www.campusedux.com/onboarding");
  });

  it("returns an existing complete profile to the originally requested next path", async () => {
    setUser({ id: "u-2", email: "done@campusedux.app" });
    setTableResult("profiles", { data: { id: "u-2", course: "B.Tech", branch: "CSE", year: "3" } });

    const res = await GET(req("?code=abc123&next=%2Fprojects"));
    expect(res.headers.get("location")).toBe("https://www.campusedux.com/projects");
  });

  it("redirects to /login?error=oauth without exchanging when code is missing", async () => {
    const res = await GET(req("?next=%2Faccount"));
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("https://www.campusedux.com/login?error=oauth");
  });

  it("redirects to /login?error=oauth when the code exchange fails", async () => {
    setExchangeCodeForSessionResult({ data: null, error: { message: "invalid grant", code: "bad_code" } });
    const res = await GET(req("?code=expired-or-reused"));
    expect(res.headers.get("location")).toBe("https://www.campusedux.com/login?error=oauth");
  });
});

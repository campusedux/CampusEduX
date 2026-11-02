import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

const state = vi.hoisted(() => ({ create: vi.fn(), getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: state.create }));
import { middleware } from "../../middleware";

beforeEach(() => {
  vi.resetAllMocks();
  state.create.mockReturnValue({ auth: { getUser: state.getUser } });
  state.getUser.mockResolvedValue({ data: { user: null } });
});

describe("Next.js middleware session boundary", () => {
  it.each(["GET", "HEAD"])("keeps anonymous public %s requests free of auth calls", async method => {
    const response = await middleware(new NextRequest("https://website-fixture.invalid/projects", { method }));
    expect(response.status).toBe(200);
    expect(state.create).not.toHaveBeenCalled();
  });

  it.each([
    ["GET", "/account/wallet"],
    ["GET", "/auth/callback"],
    ["POST", "/projects"],
    ["POST", "/contact"],
  ])("refreshes the session for %s %s", async (method, path) => {
    const request = new NextRequest(`https://website-fixture.invalid${path}`, {
      method, headers: { cookie: "session=previous" },
    });
    state.getUser.mockImplementation(async () => {
      const options = state.create.mock.calls[0][2] as {
        cookies: { get(name: string): string | undefined; set(name: string, value: string, options: CookieOptions): void };
      };
      expect(options.cookies.get("session")).toBe("previous");
      options.cookies.set("session", "refreshed", { path: "/", httpOnly: true, secure: true, sameSite: "lax" });
      return { data: { user: { id: "fixture-user" } } };
    });
    const response = await middleware(request);
    expect(state.getUser).toHaveBeenCalledTimes(1);
    expect(request.cookies.get("session")?.value).toBe("refreshed");
    expect(response.cookies.get("session")).toMatchObject({ value: "refreshed", httpOnly: true, secure: true });
    expect(response.headers.get("x-middleware-request-cookie")).toContain("session=refreshed");
  });
});

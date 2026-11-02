import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CookieOptions } from "@supabase/ssr";

const mocks = vi.hoisted(() => ({ cookies: vi.fn(), createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));

import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

type Store = { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
type Adapter = {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
};
const adapter = () => (mocks.createServerClient.mock.calls.at(-1)![2] as { cookies: Adapter }).cookies;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-placeholder");
  mocks.createServerClient.mockReturnValue({ auth: {} });
});
afterEach(() => vi.unstubAllEnvs());

describe("async cookie-bound Supabase client", () => {
  it("waits for the request cookie store before constructing the client", async () => {
    let resolve!: (store: Store) => void;
    mocks.cookies.mockReturnValue(new Promise<Store>(done => { resolve = done; }));
    const client = createAuthedServerSupabase();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
    resolve({ get: vi.fn(() => ({ value: "request-session" })), set: vi.fn() });
    await client;
    expect(adapter().get("session")).toBe("request-session");
    expect(adapter().get("session")).toBe("request-session");
    expect(mocks.createServerClient).toHaveBeenCalledTimes(1);
  });

  it("keeps separate requests' cookies isolated", async () => {
    mocks.cookies.mockResolvedValueOnce({ get: () => ({ value: "first-session" }), set: vi.fn() });
    await createAuthedServerSupabase();
    const first = adapter();
    mocks.cookies.mockResolvedValueOnce({ get: () => ({ value: "second-session" }), set: vi.fn() });
    await createAuthedServerSupabase();
    expect(first.get("session")).toBe("first-session");
    expect(adapter().get("session")).toBe("second-session");
  });

  it("preserves refresh and sign-out cookie writes and their options", async () => {
    const set = vi.fn();
    mocks.cookies.mockResolvedValue({ get: vi.fn(), set });
    await createAuthedServerSupabase();
    expect(adapter().get("missing")).toBeUndefined();
    adapter().set("session", "refreshed", { path: "/", sameSite: "lax", secure: true });
    adapter().remove("session", { path: "/", maxAge: 0 });
    expect(set.mock.calls).toEqual([
      [{ name: "session", value: "refreshed", path: "/", sameSite: "lax", secure: true }],
      [{ name: "session", value: "", path: "/", maxAge: 0 }],
    ]);
  });

  it("retains the read-only Server Component fallback for cookie writes", async () => {
    mocks.cookies.mockResolvedValue({ get: vi.fn(), set: () => { throw new Error("read-only"); } });
    await createAuthedServerSupabase();
    expect(() => adapter().set("session", "value", {})).not.toThrow();
    expect(() => adapter().remove("session", {})).not.toThrow();
  });

  it("does not construct a client when the request API rejects", async () => {
    mocks.cookies.mockRejectedValue(new Error("request unavailable"));
    await expect(createAuthedServerSupabase()).rejects.toThrow("request unavailable");
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});

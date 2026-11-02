import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { canLoadAdvertising, isAdContentRoute } from "@/lib/advertising";
import { buildCsp } from "@/lib/csp";
import { middleware } from "../../src/middleware";
import { AdSlot } from "@/components/ads/AdSlot";

const cookieState = vi.hoisted(() => ({ names: [] as string[], consent: "a0d1" }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  getAll: () => cookieState.names.map(name => ({ name })),
  get: () => ({ value: cookieState.consent }),
}) }));

vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) }));
afterEach(() => vi.unstubAllEnvs());

const eligible = { enabled: true, consent: { analytics: false, ads: true }, anonymousVerified: true,
  page: { path: "/blog/real-article", hasContent: true, access: "public" as const, status: 200 } };

describe("advertising boundaries", () => {
  it("rejects signed-in requests before mounting the client gate", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "true");
    cookieState.names = ["sb-fixture-auth-token.0"];
    expect(await AdSlot({ page: eligible.page })).toBeNull();
    cookieState.names = [];
    expect(await AdSlot({ page: { ...eligible.page, access: "protected" } })).toBeNull();
    expect(await AdSlot({ page: { ...eligible.page, path: "/login" } })).toBeNull();
    expect(await AdSlot({ page: eligible.page })).not.toBeNull();
  });
  it("requires every eligibility condition", () => {
    expect(canLoadAdvertising(eligible)).toBe(true);
    for (const patch of [{ enabled: false }, { consent: null }, { consent: { analytics: true, ads: false } }, { anonymousVerified: false }])
      expect(canLoadAdvertising({ ...eligible, ...patch })).toBe(false);
    for (const patch of [{ hasContent: false }, { access: "protected" as const }, { status: 404 }, { status: 500 }])
      expect(canLoadAdvertising({ ...eligible, page: { ...eligible.page, ...patch } })).toBe(false);
  });
  it.each(["/login", "/register", "/auth/callback", "/custom-projects/checkout", "/account", "/faq", "/projects", "/jobs", "/blog", "/404", "/compiler", "/blog/category", "/blog/tag", "/learning/a/b/editor"])("excludes %s", path => {
    expect(isAdContentRoute(path)).toBe(false);
  });
  it.each(["/blog/article", "/learning/python", "/learning/python/intro", "/practice/interview-questions/java/basics"])("allows content template %s", path => {
    expect(isAdContentRoute(path)).toBe(true);
  });
});

describe("enforced request nonce CSP", () => {
  it.each(["/learning/python/intro", "/blog", "/projects", "/account", "/login", "/auth/callback"])("sets CSP and forwards its nonce on %s", async path => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "true");
    const make = () => middleware(new NextRequest(`https://website-fixture.invalid${path}`, { headers: { "x-nonce": "attacker", "content-security-policy": "attacker" } }));
    const first = await make();
    const second = await make();
    const csp = first.headers.get("content-security-policy")!;
    const nonce = first.headers.get("x-middleware-request-x-nonce")!;
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(nonce).not.toBe("attacker");
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("'strict-dynamic'");
    expect(csp.split(";").find(part => part.trim().startsWith("script-src"))).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
    expect(second.headers.get("x-middleware-request-x-nonce")).not.toBe(nonce);
    expect(first.headers.get("cache-control")).toBe("private, no-store");
  });
  it("allows ad resource hosts only when enabled", () => {
    expect(buildCsp()).not.toMatch(/googlesyndication|doubleclick|googleadservices|googletagservices/);
    expect(() => buildCsp({ adsEnabled: true })).toThrow();
    expect(buildCsp({ adsEnabled: true, nonce: "random" })).toContain("https://*.doubleclick.net");
  });
});

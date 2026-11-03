import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../src/middleware";
import { getPublicSupabase } from "@/lib/supabase/server";
import { readPublicContentRevision } from "@/lib/publicContentRevision";

const TOKEN = "00000000-0000-4000-8000-000000000001";
let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://revision-fixture.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "unit-test-anon");
  vi.stubEnv("NEXT_PUBLIC_ADSENSE_ENABLED", "true");
  log = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
const reply = (ok: boolean) => new Response(JSON.stringify(ok ? TOKEN : { code: "42501", message: "SECRET upstream details" }), { status: ok ? 200 : 403 });

describe("revision response boundary", () => {
  it.each(["/", "/learning", "/learning/java/intro", "/blog", "/blog/article", "/coding-problems/example", "/mock-tests/example"])("returns retryable, uncached 503 for %s", async path => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(false)));
    const response = await middleware(new NextRequest(`https://website-fixture.invalid${path}`));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("5");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain("'strict-dynamic'");
    expect(await response.text()).toContain("<h1>Temporarily unavailable</h1>");
    expect(JSON.stringify(log.mock.calls)).not.toContain("SECRET");
    expect(JSON.parse(String(log.mock.calls[0][0]))).toMatchObject({ route: path, attempt: 1, code: "42501", duration_ms: expect.any(Number) });
  });
  it("retries once then proceeds with a fresh nonce and an overwritten route header", async () => {
    const fetcher = vi.fn().mockImplementationOnce(async () => reply(false)).mockImplementation(async () => reply(true));
    vi.stubGlobal("fetch", fetcher);
    const response = await middleware(new NextRequest("https://website-fixture.invalid/blog", { headers: { "x-public-content-route": "forged", "x-nonce": "forged" } }));
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(response.headers.get("x-middleware-request-x-public-content-route")).toBe("/blog");
    const nonce = response.headers.get("x-middleware-request-x-nonce");
    expect(nonce).not.toBe("forged");
    expect(response.headers.get("content-security-policy")).toContain(`'nonce-${nonce}'`);
  });
  it("bounds both attempts even when the transport ignores cancellation", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetcher);
    const pending = readPublicContentRevision(getPublicSupabase({ fresh: true })!, "blog", "/blog");
    const rejected = expect(pending).rejects.toThrow("revision is unavailable");
    await vi.advanceTimersByTimeAsync(5000);
    await rejected;
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(log.mock.calls[1][0]))).toMatchObject({ attempt: 2, duration_ms: 2500 });
  });
  it("does not gate auth, APIs or unrelated catalog pages on the revision RPC", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    for (const path of ["/login", "/api/session", "/jobs", "/projects"]) {
      expect((await middleware(new NextRequest(`https://website-fixture.invalid${path}`))).status).toBe(200);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("HEAD failures have no response body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(false)));
    const response = await middleware(new NextRequest("https://website-fixture.invalid/blog", { method: "HEAD" }));
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("");
  });
});

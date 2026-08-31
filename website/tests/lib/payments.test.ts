import { describe, it, expect } from "vitest";
import { interpretVerifyResponse } from "@/lib/payments";

/**
 * The prompt's hard rule: a checkout flow must NEVER reach "success" without
 * a verified server response. Every wallet / premium / custom-project flow
 * routes its verify call through interpretVerifyResponse — so this is the
 * whole gate under test.
 */
describe("interpretVerifyResponse", () => {
  it("passes only on a clean object body with no error", () => {
    const v = interpretVerifyResponse({ data: { balance: 500, status: "success" }, error: null });
    expect(v.ok).toBe(true);
  });

  it("fails on a transport error (Edge Function unreachable / threw)", () => {
    const v = interpretVerifyResponse({ data: null, error: { message: "Failed to fetch" } });
    expect(v).toEqual({ ok: false, message: "Failed to fetch" });
  });

  it("fails when the Edge Function body carries an { error }", () => {
    const v = interpretVerifyResponse({ data: { error: "Payment signature verification failed." }, error: null });
    expect(v).toEqual({ ok: false, message: "Payment signature verification failed." });
  });

  it("fails on a null / non-object body even with no transport error", () => {
    expect(interpretVerifyResponse({ data: null, error: null }).ok).toBe(false);
    expect(interpretVerifyResponse({ data: "ok" as unknown as null, error: null }).ok).toBe(false);
  });

  it("never treats a missing body as success", () => {
    // e.g. a 204 / empty response — must not fall through to 'success'
    const v = interpretVerifyResponse({ data: undefined as unknown as null, error: null });
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.message).toBeTruthy();
  });

  it("uses the fallback message when nothing more specific is available", () => {
    const v = interpretVerifyResponse({ data: null, error: null }, "Could not verify.");
    expect(v).toEqual({ ok: false, message: "Could not verify." });
  });
});

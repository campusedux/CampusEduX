import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { ReactElement, ReactNode } from "react";

const hooks = vi.hoisted(() => ({ values: [] as unknown[], index: 0, started: { current: false }, query: new URLSearchParams() }));
const browserAuth = vi.hoisted(() => ({ updateUser: vi.fn(), signOut: vi.fn(), signal: vi.fn(), replace: vi.fn() }));
const serverAuth = vi.hoisted(() => ({ verifyOtp: vi.fn(), getUser: vi.fn() }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], (value: unknown) => { hooks.values[index] = value; }];
  },
  useRef: () => hooks.started,
}));
vi.mock("next/navigation", () => ({ useSearchParams: () => hooks.query, useRouter: () => ({ replace: browserAuth.replace }) }));
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => ({ auth: serverAuth }) }));
vi.mock("@/lib/supabase/browser", () => ({ createBrowserSupabase: () => ({ auth: browserAuth }) }));
vi.mock("@/lib/sessionSignal", () => ({ emitSessionChange: browserAuth.signal }));
vi.mock("@/components/ui", () => ({ Field: "field", Input: "input" }));

import ResetPasswordView from "@/app/reset-password/ResetPasswordView";
import ConfirmEmailPage from "@/app/auth/confirm/page";
import { GET as verifyRecovery } from "@/app/api/auth/verify-recovery/route";
import { GET as verifyEmail } from "@/app/api/auth/verify-email/route";

type Element = ReactElement<Record<string, unknown>>;
function find(node: ReactNode, predicate: (element: Element) => boolean): Element | undefined {
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
  if (!node || typeof node !== "object" || !("props" in node)) return;
  const element = node as Element;
  return predicate(element) ? element : find(element.props.children as ReactNode, predicate);
}
function renderForm(component = ResetPasswordView) {
  hooks.index = 0;
  const view = component() as Element;
  const form = view.props.children as ReactElement;
  return (form.type as () => ReactNode)();
}

beforeEach(() => {
  serverAuth.verifyOtp.mockReset().mockResolvedValue({ error: null });
  serverAuth.getUser.mockReset().mockResolvedValue({ data: { user: null } });
  hooks.values = [];
  hooks.index = 0;
  hooks.started.current = false;
  hooks.query = new URLSearchParams("token_hash=fabricated-sec08-recovery&type=recovery");
  browserAuth.updateUser.mockReset().mockResolvedValue({ error: null });
  browserAuth.signOut.mockReset().mockResolvedValue({ error: null });
  browserAuth.signal.mockReset();
  browserAuth.replace.mockReset();
  vi.stubGlobal("fetch", vi.fn(async (url: string) => verifyRecovery(new NextRequest(`https://website-fixture.invalid${url}`))));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("password recovery remains independent of analytics", () => {
  it("waits for Continue, verifies once, updates the password and signs out", async () => {
    const initial = renderForm();
    expect(fetch).not.toHaveBeenCalled();
    expect(serverAuth.verifyOtp).not.toHaveBeenCalled();
    const button = find(initial, element => element.type === "button")!;
    (button.props.onClick as () => void)();
    (button.props.onClick as () => void)();
    await vi.waitFor(() => expect(hooks.values[0]).toBe("ready"));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(serverAuth.verifyOtp).toHaveBeenCalledWith({ token_hash: "fabricated-sec08-recovery", type: "recovery" });
    const ready = renderForm();
    for (const id of ["password", "confirmPassword"]) {
      const input = find(ready, element => element.props.id === id)!;
      (input.props.onChange as (event: unknown) => void)({ target: { value: "fabricated-password-only" } });
    }
    const form = find(renderForm(), element => element.type === "form")!;
    await (form.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault() {} });
    expect(browserAuth.updateUser).toHaveBeenCalledWith({ password: "fabricated-password-only" });
    expect(browserAuth.signOut).toHaveBeenCalledOnce();
    expect(browserAuth.signal).toHaveBeenCalledOnce();
    expect(hooks.values[0]).toBe("success");
  });

  it("does not verify an invalid recovery link", () => {
    hooks.query = new URLSearchParams("token_hash=fabricated-sec08-recovery&type=email");
    renderForm();
    expect(hooks.values[0]).toBe("invalid");
    expect(fetch).not.toHaveBeenCalled();
    expect(serverAuth.verifyOtp).not.toHaveBeenCalled();
  });

  it("shows an invalid link when recovery verification fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    serverAuth.verifyOtp.mockResolvedValue({ error: { code: "otp_expired" } });
    const button = find(renderForm(), element => element.type === "button")!;
    (button.props.onClick as () => void)();
    await vi.waitFor(() => expect(hooks.values[0]).toBe("invalid"));
    expect(browserAuth.updateUser).not.toHaveBeenCalled();
  });

  it("does not update the password when recovery transport fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("fabricated transport failure"));
    const button = find(renderForm(), element => element.type === "button")!;
    (button.props.onClick as () => void)();
    await vi.waitFor(() => expect(hooks.values[0]).toBe("invalid"));
    expect(browserAuth.updateUser).not.toHaveBeenCalled();
  });

  it("retains password confirmation validation", async () => {
    hooks.values = ["ready", "fabricated-password-only", "different-fabricated-password", null, false];
    const form = find(renderForm(), element => element.type === "form")!;
    await (form.props.onSubmit as (event: unknown) => Promise<void>)({ preventDefault() {} });
    expect(browserAuth.updateUser).not.toHaveBeenCalled();
    expect(hooks.values[3]).toBe("Passwords do not match.");
  });

  it.each(["/api/auth/verify-recovery?type=recovery", "/api/auth/verify-recovery?token_hash=fabricated-only&type=email"])("rejects malformed recovery request %s", async path => {
    const response = await verifyRecovery(new NextRequest(`https://website-fixture.invalid${path}`));
    expect(await response.json()).toEqual({ status: "error" });
    expect(serverAuth.verifyOtp).not.toHaveBeenCalled();
  });

  it.each(["email", "signup"])("preserves email confirmation type %s", async type => {
    const response = await verifyEmail(new NextRequest(`https://website-fixture.invalid/api/auth/verify-email?token_hash=fabricated-email-only&type=${type}`));
    expect(await response.json()).toEqual({ status: "success" });
    expect(serverAuth.verifyOtp).toHaveBeenCalledWith({ token_hash: "fabricated-email-only", type });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("preserves email confirmation's explicit Continue gesture and safe redirect", async () => {
    hooks.query = new URLSearchParams("token_hash=fabricated-email-only&type=email");
    vi.mocked(fetch).mockImplementation(async input => verifyEmail(new NextRequest(`https://website-fixture.invalid${input}`)));
    const button = find(renderForm(ConfirmEmailPage), element => element.type === "button")!;
    expect(fetch).not.toHaveBeenCalled();
    expect(serverAuth.verifyOtp).not.toHaveBeenCalled();
    (button.props.onClick as () => void)();
    await vi.waitFor(() => expect(browserAuth.replace).toHaveBeenCalledWith("/email-verified?status=success"));
    expect(serverAuth.verifyOtp).toHaveBeenCalledWith({ token_hash: "fabricated-email-only", type: "email" });
  });
});

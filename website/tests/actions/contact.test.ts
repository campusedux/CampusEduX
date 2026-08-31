import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: () =>
    new Map([
      ["x-forwarded-for", "203.0.113.7, 10.0.0.1"],
      ["user-agent", "vitest"],
    ]),
}));

import { supabase, resetSupabaseMock, setRpcResult, rpcCall } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import { submitContactMessageAction } from "@/lib/actions/contact";

const VALID = { name: "Asha Rao", email: "asha@example.com", message: "I have a question about custom projects." };

beforeEach(() => resetSupabaseMock());

describe("submitContactMessageAction", () => {
  it("rejects a too-short name", async () => {
    const r = await submitContactMessageAction({ ...VALID, name: "A" });
    expect(r).toEqual({ error: expect.stringMatching(/name/i) });
  });

  it("rejects an invalid email", async () => {
    const r = await submitContactMessageAction({ ...VALID, email: "not-an-email" });
    expect(r).toEqual({ error: expect.stringMatching(/valid email/i) });
  });

  it("rejects a too-short message", async () => {
    const r = await submitContactMessageAction({ ...VALID, message: "hi" });
    expect(r).toEqual({ error: expect.stringMatching(/more detail/i) });
  });

  it("passes trimmed values + a derived client key to the RPC on success", async () => {
    setRpcResult("submit_contact_message", { data: "new-id", error: null });
    const r = await submitContactMessageAction({ name: "  Asha  ", email: " ASHA@EXAMPLE.COM ", message: "  A proper message here.  " });
    expect(r).toEqual({ ok: true });

    const call = rpcCall("submit_contact_message");
    const args = call?.args?.[0] as Record<string, string>;
    expect(args.p_name).toBe("Asha");
    expect(args.p_message).toBe("A proper message here.");
    expect(args.p_client_key).toBe("ip:203.0.113.7"); // first forwarded IP
  });

  it("maps the RATE_LIMITED db error to a friendly message", async () => {
    setRpcResult("submit_contact_message", { data: null, error: { message: "RATE_LIMITED" } });
    const r = await submitContactMessageAction(VALID);
    expect(r).toEqual({ error: expect.stringMatching(/try again/i) });
  });

  it("tells the user to email directly when the function isn't deployed yet", async () => {
    setRpcResult("submit_contact_message", {
      data: null,
      error: { message: "Could not find the function public.submit_contact_message" },
    });
    const r = await submitContactMessageAction(VALID);
    expect(r).toEqual({ error: expect.stringMatching(/email us directly/i) });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { supabase, resetSupabaseMock, setUser, setTableResult, callsFor } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import { sendCustomProjectMessageAction } from "@/lib/actions/customProjects";

const USER = { id: "user-1", email: "s@campusedux.app" };
const REQ_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

beforeEach(() => resetSupabaseMock());

describe("sendCustomProjectMessageAction", () => {
  it("rejects an empty message", async () => {
    setUser(USER);
    const r = await sendCustomProjectMessageAction({ requestId: REQ_ID, body: "   " });
    expect(r).toEqual({ error: expect.stringMatching(/write a message/i) });
  });

  it("rejects an over-long message", async () => {
    setUser(USER);
    const r = await sendCustomProjectMessageAction({ requestId: REQ_ID, body: "x".repeat(4001) });
    expect(r).toEqual({ error: expect.stringMatching(/too long/i) });
  });

  it("rejects a non-uuid request id", async () => {
    setUser(USER);
    const r = await sendCustomProjectMessageAction({ requestId: "not-a-uuid", body: "hello" });
    expect("error" in r).toBe(true);
  });

  it("rejects when signed out", async () => {
    setUser(null);
    const r = await sendCustomProjectMessageAction({ requestId: REQ_ID, body: "hello" });
    expect(r).toEqual({ error: expect.stringMatching(/sign in/i) });
  });

  it("rejects when the request is not the caller's", async () => {
    setUser(USER);
    setTableResult("custom_project_requests", { data: null }); // ownership lookup misses
    const r = await sendCustomProjectMessageAction({ requestId: REQ_ID, body: "hello" });
    expect(r).toEqual({ error: expect.stringMatching(/could not be found/i) });
  });

  it("inserts a student message on the happy path", async () => {
    setUser(USER);
    setTableResult("custom_project_requests", { data: { id: REQ_ID } });
    setTableResult("custom_project_messages", { data: null, error: null });

    const r = await sendCustomProjectMessageAction({ requestId: REQ_ID, body: "  When is delivery?  " });
    expect(r).toEqual({ ok: true });

    const insert = callsFor("custom_project_messages").find((c) => c.verb === "insert");
    expect(insert?.args?.[0]).toMatchObject({
      request_id: REQ_ID,
      sender_id: "user-1",
      sender_role: "student",
      body: "When is delivery?", // trimmed
    });
  });
});

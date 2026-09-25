jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { describeRunFailure } from "@/lib/runFailure";
import { PracticeApiError, practiceService } from "@/services/practice.service";
import { supabase } from "@/lib/supabase";

describe("describeRunFailure (mobile)", () => {
  it("maps 401 / 429 / 5xx with the shared wording", () => {
    expect(describeRunFailure(401)).toMatchObject({ kind: "auth", message: "Your session expired — sign in again." });
    expect(describeRunFailure(429, { retry_after: 9 }).message).toBe(
      "You're running code too fast — try again in 9 seconds.",
    );
    expect(describeRunFailure(429, {}, "1").message).toContain("1 second.");
    expect(describeRunFailure(429).message).toContain("in a few seconds");
    expect(describeRunFailure(503, { error: "Judge is not configured." })).toMatchObject({
      kind: "server",
      message: "Code execution is temporarily unavailable.",
    });
    expect(describeRunFailure(400, { error: "Bad language" }).message).toBe("Bad language");
  });
});

describe("practiceService.run error mapping", () => {
  const origFetch = global.fetch;
  afterEach(() => {
    global.fetch = origFetch;
  });
  function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
    global.fetch = jest.fn().mockResolvedValue({
      status,
      ok: status < 400,
      json: async () => body,
      headers: { get: (k: string) => headers[k] ?? null },
    }) as unknown as typeof fetch;
  }
  beforeEach(() => {
    (supabase.auth as any).getSession = jest.fn().mockResolvedValue({ data: { session: { access_token: "t" } } });
  });
  const input = { language: "python", source: "print(1)", stdin: "" };

  it("401 -> auth error", async () => {
    mockFetch(401, { ok: false, error: "Sign in to run code." });
    await expect(practiceService.run(input)).rejects.toMatchObject({ kind: "auth", message: "Your session expired — sign in again." });
  });
  it("429 -> rate_limit with Retry-After", async () => {
    mockFetch(429, { ok: false }, { "Retry-After": "7" });
    const e = await practiceService.run(input).catch((x) => x);
    expect(e).toBeInstanceOf(PracticeApiError);
    expect(e).toMatchObject({ kind: "rate_limit", retryAfter: 7 });
  });
  it("503 -> generic unavailable", async () => {
    mockFetch(503, { ok: false, error: "Judge is not configured." });
    await expect(practiceService.run(input)).rejects.toMatchObject({ message: "Code execution is temporarily unavailable." });
  });
});

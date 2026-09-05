import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => {
  class RateLimitError extends Error {}
  class APIError extends Error {}
  class MockAnthropic {
    static RateLimitError = RateLimitError;
    static APIError = APIError;
    messages = { create: createMock };
    constructor(_opts: unknown) {
      void _opts;
    }
  }
  return { default: MockAnthropic };
});

import { supabase, resetSupabaseMock, setTableResult, callsFor } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/server", () => ({ getPublicSupabase: () => supabase }));

import { getAssistSuggestion } from "@/lib/resumeBuilder/aiAssist";

const ORIGINAL_ENV = process.env.ANTHROPIC_API_KEY;

beforeEach(() => {
  resetSupabaseMock();
  createMock.mockReset();
  process.env.ANTHROPIC_API_KEY = "test-key";
  setTableResult("resume_ai_prompts", { data: { system_prompt: "You are a resume assistant.", max_tokens: 300 } });
  setTableResult("resume_ai_requests", { count: 0, error: null });
});

afterEach(() => {
  process.env.ANTHROPIC_API_KEY = ORIGINAL_ENV;
});

const BASE_REQUEST = {
  userId: "user-1",
  resumeId: "res-1",
  section: "summary" as const,
  currentText: "Old summary.",
  instruction: "Make this more concise.",
};

describe("getAssistSuggestion", () => {
  it("returns a config error when ANTHROPIC_API_KEY is unset", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await getAssistSuggestion(supabase as never, BASE_REQUEST);
    expect(result).toEqual({ error: expect.stringMatching(/isn't configured/i) });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns a cap error and never calls Anthropic once the daily limit is reached", async () => {
    setTableResult("resume_ai_requests", { count: 30, error: null });
    const result = await getAssistSuggestion(supabase as never, BASE_REQUEST);
    expect(result).toEqual({ error: expect.stringMatching(/today's AI assist limit/i) });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns an error when no active prompt exists for the section", async () => {
    setTableResult("resume_ai_prompts", { data: null });
    const result = await getAssistSuggestion(supabase as never, BASE_REQUEST);
    expect(result).toEqual({ error: expect.stringMatching(/isn't available/i) });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("calls Anthropic with the section's system prompt and max_tokens, returns the suggestion, and logs the request", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "  A tighter, ATS-friendly summary.  " }] });

    const result = await getAssistSuggestion(supabase as never, BASE_REQUEST);

    expect(result).toEqual({ suggestion: "A tighter, ATS-friendly summary." });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: "You are a resume assistant.",
      }),
    );
    const [call] = createMock.mock.calls;
    expect(call[0].messages[0].content).toContain("Old summary.");
    expect(call[0].messages[0].content).toContain("Make this more concise.");

    const logged = callsFor("resume_ai_requests").find((c) => c.verb === "insert");
    expect(logged?.args[0]).toMatchObject({ user_id: "user-1", resume_id: "res-1", mode: "summary" });
  });

  it("includes the JD text in the prompt when provided", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "Tailored summary." }] });
    await getAssistSuggestion(supabase as never, { ...BASE_REQUEST, jdText: "We need a React developer." });
    const [call] = createMock.mock.calls;
    expect(call[0].messages[0].content).toContain("We need a React developer.");
  });

  it("surfaces a friendly error when the model returns no usable text", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "   " }] });
    const result = await getAssistSuggestion(supabase as never, BASE_REQUEST);
    expect(result).toEqual({ error: expect.stringMatching(/didn't return a suggestion/i) });
  });

  it("maps a RateLimitError to a friendly busy message", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default as unknown as { RateLimitError: new (msg: string) => Error };
    createMock.mockRejectedValue(new Anthropic.RateLimitError("rate limited"));
    const result = await getAssistSuggestion(supabase as never, BASE_REQUEST);
    expect(result).toEqual({ error: expect.stringMatching(/busy/i) });
  });
});

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { resumeAssistService } from "@/services/resumeAssist.service";
import { resetSupabaseMock, setAuthResult } from "../../mocks/supabase.mock";

const originalFetch = global.fetch;

beforeEach(() => {
  resetSupabaseMock();
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

const INPUT = { resumeId: "res-1", section: "summary" as const, currentText: "Old.", instruction: "Improve it." };

describe("resumeAssistService.requestSuggestion", () => {
  it("returns an error when there is no active session", async () => {
    setAuthResult("getSession", { data: { session: null }, error: null });
    const result = await resumeAssistService.requestSuggestion(INPUT);
    expect(result).toEqual({ error: expect.stringMatching(/sign in/i) });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends the bearer token and returns the suggestion on success", async () => {
    setAuthResult("getSession", { data: { session: { access_token: "jwt-token" } }, error: null });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ suggestion: "A tighter summary." }) });

    const result = await resumeAssistService.requestSuggestion(INPUT);

    expect(result).toEqual({ suggestion: "A tighter summary." });
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/resume/assist");
    expect(options.headers.Authorization).toBe("Bearer jwt-token");
    expect(JSON.parse(options.body)).toMatchObject(INPUT);
  });

  it("surfaces the server's error message on a non-ok response", async () => {
    setAuthResult("getSession", { data: { session: { access_token: "jwt-token" } }, error: null });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Daily limit reached." }) });

    const result = await resumeAssistService.requestSuggestion(INPUT);
    expect(result).toEqual({ error: "Daily limit reached." });
  });

  it("falls back to a generic error when fetch itself throws", async () => {
    setAuthResult("getSession", { data: { session: { access_token: "jwt-token" } }, error: null });
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network down"));

    const result = await resumeAssistService.requestSuggestion(INPUT);
    expect(result).toEqual({ error: expect.stringMatching(/couldn't get a suggestion/i) });
  });
});

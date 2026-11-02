import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const rpc = vi.fn();
const load = (route: string) => import(/* @vite-ignore */ `../../src/app/api/${route}/route.ts`);
let caller: { user: { id: string }; supabase: { rpc: typeof rpc } } | null = null;

vi.mock("@/lib/apiAuth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/apiAuth")>("@/lib/apiAuth");
  return { ...actual, resolveApiCaller: vi.fn(async () => caller) };
});
vi.mock("@/lib/compiler/run", () => ({
  runCode: vi.fn(async () => ({ ok: true, provider: "x", run: { status: "ok", stdout: "1\n", stderr: "", exitCode: 0, timeMs: 1 } })),
}));
vi.mock("@/lib/resumeBuilder/aiAssist", () => ({ ASSIST_SECTIONS: ["summary"], getAssistSuggestion: vi.fn(async () => ({ suggestion: "hi" })) }));
vi.mock("@/lib/customProjects/aiUnderstand", () => ({ getProjectUnderstanding: vi.fn(async () => ({ overview: "ok" })) }));

const req = (body: unknown) =>
  new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const allowHit = { data: { allowed: true, remaining: 1, retry_after_seconds: 0 }, error: null };
const runBody = { language: "python", source: "print(1)", stdin: "" };

beforeEach(() => {
  rpc.mockReset();
  caller = { user: { id: "u1" }, supabase: { rpc } };
  vi.unstubAllEnvs();
});
afterEach(() => vi.unstubAllEnvs());

describe("compiler/run", () => {
  it("requires auth by default", async () => {
    caller = null;
    const { POST } = await import("@/app/api/compiler/run/route");
    expect((await POST(req(runBody))).status).toBe(401);
  });
  it("only an explicit COMPILER_REQUIRE_AUTH=false lets anonymous callers in", async () => {
    caller = null;
    vi.stubEnv("COMPILER_REQUIRE_AUTH", "false");
    const { POST } = await import("@/app/api/compiler/run/route");
    expect((await POST(req(runBody))).status).toBe(200);
  });
  it("rate limits via rl_hit and fails closed when it errors", async () => {
    const { POST } = await import("@/app/api/compiler/run/route");
    rpc.mockResolvedValueOnce({ data: { allowed: false, remaining: 0, retry_after_seconds: 12 }, error: null });
    const r = await POST(req(runBody));
    expect(r.status).toBe(429);
    expect(r.headers.get("Retry-After")).toBe("12");
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    expect((await POST(req(runBody))).status).toBe(503);
  });
  it("runs when allowed", async () => {
    const { POST } = await import("@/app/api/compiler/run/route");
    rpc.mockResolvedValueOnce(allowHit);
    expect((await POST(req(runBody))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("rl_hit", expect.objectContaining({ p_bucket: "compiler-run" }));
  });
});

describe.each([
  ["practice/judge", "practice_problem_run_cases"],
  ["coding-problems/judge", "coding_problem_run_cases"],
])("%s", (route, fn) => {
  const body = { slug: "two-sum", language: "python", source: "print(1)" };
  it("401 when unauthenticated", async () => {
    caller = null;
    const { POST } = await load(route);
    expect((await POST(req(body))).status).toBe(401);
  });
  it("503 (fail closed) when JUDGE_RPC_SECRET is unset", async () => {
    const { POST } = await load(route);
    rpc.mockResolvedValueOnce(allowHit);
    expect((await POST(req(body))).status).toBe(503);
    expect(rpc).toHaveBeenCalledTimes(1); // only rl_hit, never the cases RPC
  });
  it("503 when the limiter errors", async () => {
    vi.stubEnv("JUDGE_RPC_SECRET", "s3cret");
    const { POST } = await load(route);
    rpc.mockResolvedValueOnce({ data: null, error: { message: "x" } });
    expect((await POST(req(body))).status).toBe(503);
  });
  it("passes the secret to the run_cases RPC", async () => {
    vi.stubEnv("JUDGE_RPC_SECRET", "s3cret");
    const { POST } = await load(route);
    rpc.mockResolvedValueOnce(allowHit).mockResolvedValueOnce({ data: [{ input: "", expected_output: "1" }], error: null });
    const r = await POST(req(body));
    expect(r.status).toBe(200);
    expect(rpc).toHaveBeenLastCalledWith(fn, { p_slug: "two-sum", p_secret: "s3cret" });
  });
});

describe.each(["practice/submit", "coding-problems/submit"])("%s", (route) => {
  it("401 when unauthenticated", async () => {
    caller = null;
    const { POST } = await load(route);
    expect((await POST(req({ slug: "a", language: "python", source: "x" }))).status).toBe(401);
  });
  it("503 when JUDGE_RPC_SECRET is unset", async () => {
    const { POST } = await load(route);
    rpc.mockResolvedValueOnce(allowHit);
    expect((await POST(req({ slug: "a", language: "python", source: "x" }))).status).toBe(503);
  });
});

describe("AI routes", () => {
  const assistBody = { section: "summary", currentText: "t", instruction: "improve" };
  const underBody = { title: "T", objective: "O" };
  it.each([
    ["resume/assist", assistBody, "resume_assist"],
    ["custom-projects/understand", underBody, "project_understand"],
  ])("%s: 401 anon, budget consumed before the model call, 429 over budget, 503 when RPC errors", async (route, body, kind) => {
    const { POST } = await load(route);
    caller = null;
    expect((await POST(req(body))).status).toBe(401);
    caller = { user: { id: "u1" }, supabase: { rpc } };

    rpc.mockResolvedValueOnce(allowHit).mockResolvedValueOnce({ data: { allowed: true, used: 1, limit: 30 }, error: null });
    expect((await POST(req(body))).status).toBe(200);
    expect(rpc).toHaveBeenLastCalledWith("ai_budget_take", { p_kind: kind, p_daily_limit: expect.any(Number) });

    rpc.mockResolvedValueOnce(allowHit).mockResolvedValueOnce({ data: { allowed: false, used: 30, limit: 30 }, error: null });
    expect((await POST(req(body))).status).toBe(429);

    rpc.mockResolvedValueOnce(allowHit).mockResolvedValueOnce({ data: null, error: { message: "x" } });
    expect((await POST(req(body))).status).toBe(503);
  });
});


describe("Zod release gate: API validation", () => {
  it.each(["compiler/run", "practice/judge", "practice/submit", "coding-problems/judge", "coding-problems/submit", "resume/assist", "custom-projects/understand"])("%s rejects anonymous callers before reading a body", async (route) => {
    caller = null;
    const request = req({});
    const json = vi.spyOn(request, "json");
    const { POST } = await load(route);
    expect((await POST(request)).status).toBe(401);
    expect(json).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["compiler/run", { language: "python" }, "Required"],
    ["resume/assist", { section: "summary", currentText: "x".repeat(20_001), instruction: "Improve" }, "String must contain at most 20000 character(s)"],
    ["custom-projects/understand", { title: "x".repeat(201), objective: "Help" }, "String must contain at most 200 character(s)"],
  ])("%s rejects invalid or excessive fields before downstream work", async (route, body, error) => {
    rpc.mockResolvedValueOnce(allowHit);
    const { POST } = await load(route);
    const response = await POST(req(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error });
    expect(rpc).toHaveBeenCalledTimes(1); // rate limiter only; no provider/budget/data RPC
  });
});

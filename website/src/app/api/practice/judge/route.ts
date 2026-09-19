import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { resolveLanguage } from "@/lib/compiler/languages";
import { MAX_CODE_BYTES, byteLength, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/lib/compiler/limits";
import { checkRateLimit } from "@/lib/compiler/rateLimit";
import { runCode } from "@/lib/compiler/run";
import { judgeCase, MAX_JUDGE_CASES, type RunCase, type JudgeCaseResult } from "@/lib/codingProblems";

/**
 * POST /api/practice/judge — run a global Practice coding-problem submission
 * against its test cases WITHOUT persisting anything ("Run Tests").
 *
 *   Browser → this route → practice_problem_run_cases() RPC (server-side,
 *   premium gated) → execution provider per case → per-case pass/fail
 *
 * Sibling of /api/coding-problems/judge — identical behaviour, different RPC.
 * User code never runs in this process (same sandbox provider as
 * /api/compiler/run). Hidden test-case inputs / expected outputs are read
 * server-side and are NEVER echoed back to the browser.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().trim().min(1, "Missing problem.").max(200),
  language: z
    .string()
    .trim()
    .min(1, "Pick a language.")
    .refine((v) => resolveLanguage(v) !== null, "That language isn't supported."),
  source: z
    .string()
    .min(1, "Write some code first.")
    .refine((v) => byteLength(v) <= MAX_CODE_BYTES, `Your code is too long (max ${MAX_CODE_BYTES.toLocaleString()} bytes).`),
});

function clientKey(req: Request): string {
  const fwd = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ip = fwd || req.headers.get("x-real-ip") || "";
  return ip ? `ip:${ip}` : `ua:${(req.headers.get("user-agent") ?? "unknown").slice(0, 100)}`;
}

/**
 * Mobile sends `Authorization: Bearer <supabase JWT>`; the website keeps using its
 * cookie session. A Bearer token that Supabase Auth rejects is treated as "no token".
 */
function bearerClient(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;
  const client = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { client, token };
}

export async function POST(req: Request) {
  // A valid Bearer token (mobile) is rate-limited per user instead of per IP, and the
  // problem RPC then runs as that user (same premium/RLS rules as the cookie session).
  let bearerSupabase: NonNullable<ReturnType<typeof bearerClient>>["client"] | null = null;
  let bearerUserId: string | null = null;
  const bearer = bearerClient(req);
  if (bearer) {
    const { data, error } = await bearer.client.auth.getUser(bearer.token);
    if (!error && data.user) {
      bearerSupabase = bearer.client;
      bearerUserId = data.user.id;
    }
  }

  const rate = checkRateLimit(`practice-judge:${bearerUserId ? `user:${bearerUserId}` : clientKey(req)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "You're running code very quickly. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Check your input and try again." },
      { status: 400 },
    );
  }
  const { slug, language, source } = parsed.data;

  const supabase = bearerSupabase ?? createAuthedServerSupabase();
  const { data, error } = await supabase.rpc("practice_problem_run_cases", { p_slug: slug });
  if (error) {
    return NextResponse.json({ ok: false, error: "Couldn't load this problem's tests." }, { status: 502 });
  }
  const cases = (Array.isArray(data) ? data : []) as RunCase[];
  if (cases.length === 0) {
    return NextResponse.json(
      { ok: false, error: "This problem isn't available to run, or has no test cases yet." },
      { status: 404 },
    );
  }

  const toRun = cases.slice(0, MAX_JUDGE_CASES);
  const results: JudgeCaseResult[] = [];
  let provider = "";
  let compileError: string | undefined;

  for (const c of toRun) {
    const outcome = await runCode({ language, source, stdin: c.input ?? "" });
    if (!outcome.ok) {
      const status = outcome.code === "not_configured" ? 503 : 502;
      return NextResponse.json({ ok: false, error: outcome.error, code: outcome.code }, { status });
    }
    provider = outcome.provider;
    results.push(judgeCase(c, outcome.run));

    if (outcome.run.status === "compile_error") {
      compileError = outcome.run.compileOutput || "The compiler reported an error.";
      for (const rest of toRun.slice(results.length)) {
        results.push(judgeCase(rest, outcome.run));
      }
      break;
    }
  }

  const passed = results.filter((r) => r.passed).length;
  return NextResponse.json({
    ok: true,
    provider,
    compileError,
    summary: { passed, total: results.length },
    results,
  });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST." }, { status: 405, headers: { Allow: "POST" } });
}

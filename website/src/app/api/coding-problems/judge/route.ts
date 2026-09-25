import { NextResponse } from "next/server";
import { z } from "zod";
import { judgeRpcSecret, resolveApiCaller } from "@/lib/apiAuth";
import { JUDGE_BUCKET, judgeMax, judgeWindowSeconds, limitResponse, rlHit } from "@/lib/rateLimitDb";
import { resolveLanguage } from "@/lib/compiler/languages";
import { MAX_CODE_BYTES, byteLength } from "@/lib/compiler/limits";
import { runCode } from "@/lib/compiler/run";
import { composeSubmissionSource, judgeCase, MAX_JUDGE_CASES, type RunCase, type JudgeCaseResult } from "@/lib/codingProblems";

/**
 * POST /api/coding-problems/judge — run a Coding Problem submission against its
 * test cases.
 *
 *   Browser → this route → coding_problem_run_cases() RPC (server-side, premium
 *   gated) → execution provider per case → per-case pass/fail
 *
 * User code never runs in this process (it goes to the same sandbox provider as
 * `/api/compiler/run`). Hidden test-case inputs / expected outputs are read
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

export async function POST(req: Request) {
  // Auth required (cookie session or Bearer). The RPCs below run as that user.
  const caller = await resolveApiCaller(req);
  if (!caller) {
    return NextResponse.json({ ok: false, error: "Sign in to run your code." }, { status: 401 });
  }
  const supabase = caller.supabase;

  // One request = up to MAX_JUDGE_CASES sandbox runs, so the cap is on requests (see rateLimitDb.ts).
  const limited = limitResponse(await rlHit(supabase, JUDGE_BUCKET, judgeMax(), judgeWindowSeconds()), {
    message: "You're running code very quickly. Please wait a moment.",
  });
  if (limited) return limited;

  const secret = judgeRpcSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Judge is not configured." }, { status: 503 });
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

  const { data, error } = await supabase.rpc("coding_problem_run_cases", { p_slug: slug, p_secret: secret });
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
    const outcome = await runCode({ language, source: composeSubmissionSource(language, source, c), stdin: c.input ?? "" });
    if (!outcome.ok) {
      const status = outcome.code === "not_configured" ? 503 : 502;
      return NextResponse.json({ ok: false, error: outcome.error, code: outcome.code }, { status });
    }
    provider = outcome.provider;
    const judged = judgeCase(c, outcome.run);
    results.push(judged);

    // Same source + same compile step for every case — stop after the first
    // compile failure and fail the rest with the shared diagnostic.
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

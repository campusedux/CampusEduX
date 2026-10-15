import { NextResponse } from "next/server";
import { z } from "zod";
import { judgeRpcSecret, resolveApiCaller } from "@/lib/apiAuth";
import { JUDGE_BUCKET, judgeMax, judgeWindowSeconds, limitResponse, rlHit } from "@/lib/rateLimitDb";
import { resolveLanguage } from "@/lib/compiler/languages";
import { MAX_CODE_BYTES, byteLength } from "@/lib/compiler/limits";
import { runCode } from "@/lib/compiler/run";
import { judgeCase, MAX_JUDGE_CASES, type RunCase, type JudgeCaseResult } from "@/lib/codingProblems";

/**
 * POST /api/practice/submit — "Submit": run every test case for a global
 * Practice coding problem AND persist the attempt.
 *
 *   Browser → this route → practice_problem_run_cases() RPC → execution provider
 *     → per-case pass/fail → record_coding_submission() RPC (judge-secret gated)
 *       + UPSERT user_dsa_progress (solved / attempted, never downgraded)
 *
 * Requires a signed-in user. Same sandbox + hidden-case redaction as
 * /api/practice/judge; adds only the two owner-scoped writes.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Missing problem.")
    .max(200)
    .regex(/^[a-z0-9-]+$/i, "Bad problem id."),
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

type Verdict =
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "error";

export async function POST(req: Request) {
  // Auth required (cookie session or Bearer). A rejected Bearer is a 401 — no silent fallback.
  const caller = await resolveApiCaller(req);
  if (!caller) {
    return NextResponse.json({ ok: false, error: "Sign in to submit your solution." }, { status: 401 });
  }
  const { supabase, user } = caller;

  // One request = up to MAX_JUDGE_CASES sandbox runs, so the cap is on requests (see rateLimitDb.ts).
  const limited = limitResponse(await rlHit(supabase, JUDGE_BUCKET, judgeMax(), judgeWindowSeconds()), {
    message: "You're submitting very quickly. Please wait a moment.",
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
  const { language, source } = parsed.data;
  const slug = parsed.data.slug.toLowerCase();

  const { data: casesData, error: casesErr } = await supabase.rpc("practice_problem_run_cases", { p_slug: slug, p_secret: secret });
  if (casesErr) {
    return NextResponse.json({ ok: false, error: "Couldn't load this problem's tests." }, { status: 502 });
  }
  const cases = (Array.isArray(casesData) ? casesData : []) as RunCase[];
  if (cases.length === 0) {
    return NextResponse.json(
      { ok: false, error: "This problem isn't available to submit, or has no test cases yet." },
      { status: 404 },
    );
  }

  const { data: problemRow } = await supabase
    .from("dsa_problems")
    .select("id")
    .eq("slug", slug)
    .is("learning_topic_id", null)
    .not("topic_id", "is", null)
    .maybeSingle();
  if (!problemRow?.id) {
    return NextResponse.json({ ok: false, error: "Problem not found." }, { status: 404 });
  }
  const problemId = problemRow.id as string;

  const toRun = cases.slice(0, MAX_JUDGE_CASES);
  const results: JudgeCaseResult[] = [];
  let provider = "";
  let compileError: string | undefined;
  let maxTimeMs = 0;
  let maxMemoryKb: number | undefined;
  let sawTimeout = false;
  let sawRuntimeError = false;
  let sawCompileError = false;

  for (const c of toRun) {
    const outcome = await runCode({ language, source, stdin: c.input ?? "" });
    if (!outcome.ok) {
      const status = outcome.code === "not_configured" ? 503 : 502;
      return NextResponse.json({ ok: false, error: outcome.error, code: outcome.code }, { status });
    }
    provider = outcome.provider;
    maxTimeMs = Math.max(maxTimeMs, outcome.run.timeMs ?? 0);
    if (typeof outcome.run.memoryKb === "number") {
      maxMemoryKb = Math.max(maxMemoryKb ?? 0, outcome.run.memoryKb);
    }
    if (outcome.run.status === "timeout" || outcome.run.timedOut) sawTimeout = true;
    if (outcome.run.status === "runtime_error") sawRuntimeError = true;
    results.push(judgeCase(c, outcome.run));

    if (outcome.run.status === "compile_error") {
      sawCompileError = true;
      compileError = outcome.run.compileOutput || "The compiler reported an error.";
      for (const rest of toRun.slice(results.length)) {
        results.push(judgeCase(rest, outcome.run));
      }
      break;
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total && total > 0;

  const verdict: Verdict = sawCompileError
    ? "compile_error"
    : sawTimeout
      ? "time_limit_exceeded"
      : allPassed
        ? "accepted"
        : sawRuntimeError
          ? "runtime_error"
          : "wrong_answer";

  // Persist the attempt (owner-only RLS). A write failure doesn't fail the run —
  // the user still sees their results.
  let saved = true;
  // Recorded through record_coding_submission() (0120/092): clients can no longer INSERT
  // coding_submissions directly, and the RPC needs the server-only judge secret, so a user cannot
  // fake a row to unlock the solution.
  const { data: insertedId, error: insErr } = await supabase.rpc("record_coding_submission", {
    p_secret: secret,
    p_problem_id: problemId,
    p_slug: slug,
    p_language: language,
    p_source: source.slice(0, MAX_CODE_BYTES),
    p_verdict: verdict,
    p_passed: passed,
    p_total: total,
    p_runtime_ms: maxTimeMs || null,
    p_memory_kb: maxMemoryKb ?? null,
  });
  const inserted = typeof insertedId === "string" ? { id: insertedId } : null;
  if (insErr) saved = false;

  let progressSaved = true;
  if (allPassed) {
    const { error: progressError } = await supabase
      .from("user_dsa_progress")
      .upsert(
        { user_id: user.id, problem_id: problemId, status: "solved", solved_at: new Date().toISOString() },
        { onConflict: "user_id,problem_id" },
      );
    if (progressError) {
      console.error("Progress save failed", progressError);
      progressSaved = false;
    }
  } else {
    // Record an attempt only if there is no row yet — never downgrade "solved".
    const { error: progressError } = await supabase
      .from("user_dsa_progress")
      .upsert(
        { user_id: user.id, problem_id: problemId, status: "attempted" },
        { onConflict: "user_id,problem_id", ignoreDuplicates: true },
      );
    if (progressError) {
      console.error("Progress save failed", progressError);
      progressSaved = false;
    }
  }

  return NextResponse.json({
    ok: true,
    provider,
    compileError,
    verdict,
    saved,
    progressSaved,
    submissionId: inserted?.id ?? null,
    summary: { passed, total },
    results,
  }, { status: saved && progressSaved ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST." }, { status: 405, headers: { Allow: "POST" } });
}

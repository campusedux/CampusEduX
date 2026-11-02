import { NextResponse } from "next/server";
import { validationError } from "@/lib/validation";
import { compilerAuthRequired, resolveApiCaller } from "@/lib/apiAuth";
import { limitResponse, rlHit } from "@/lib/rateLimitDb";
import { runRequestSchema } from "@/lib/compiler/schema";
import { runCode } from "@/lib/compiler/run";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/lib/compiler/limits";

/**
 * POST /api/compiler/run — the only path the browser uses to execute code.
 *
 *   Browser → this route → execution provider (Judge0 / Piston) → normalised result
 *
 * User code never runs in this process. Provider keys are read from env here and
 * never leave the server. Every request is Zod-validated, size-capped, timed out
 * and rate-limited (durable, per user). See `src/lib/compiler/*`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const caller = await resolveApiCaller(req);
  if (!caller && compilerAuthRequired()) {
    return NextResponse.json({ ok: false, error: "Sign in to run code." }, { status: 401 });
  }

  // Durable per-user limiter (Postgres). Anonymous callers only exist when auth is
  // explicitly disabled; the limiter needs auth.uid(), so they are unthrottled here.
  if (caller) {
    const limited = limitResponse(
      await rlHit(caller.supabase, "compiler-run", RATE_LIMIT_MAX, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
      { message: "You're running code very quickly. Please wait a moment." },
    );
    if (limited) return limited;
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const parsed = runRequestSchema.safeParse(json, { error: validationError });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Check your input and try again." },
      { status: 400 },
    );
  }

  const outcome = await runCode(parsed.data);
  if (!outcome.ok) {
    const status = outcome.code === "not_configured" ? 503 : 502;
    return NextResponse.json({ ok: false, error: outcome.error, code: outcome.code }, { status });
  }

  return NextResponse.json({ ok: true, provider: outcome.provider, run: outcome.run });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST." }, { status: 405, headers: { Allow: "POST" } });
}

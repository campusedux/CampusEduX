import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { runRequestSchema } from "@/lib/compiler/schema";
import { runCode } from "@/lib/compiler/run";
import { checkRateLimit } from "@/lib/compiler/rateLimit";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/lib/compiler/limits";

/**
 * POST /api/compiler/run — the only path the browser uses to execute code.
 *
 *   Browser → this route → execution provider (Judge0 / Piston) → normalised result
 *
 * User code never runs in this process. Provider keys are read from env here and
 * never leave the server. Every request is Zod-validated, size-capped, timed out
 * and best-effort rate-limited. See `src/lib/compiler/*`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(req: Request): string {
  const fwd = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ip = fwd || req.headers.get("x-real-ip") || "";
  if (ip) return `ip:${ip}`;
  return `ua:${(req.headers.get("user-agent") ?? "unknown").slice(0, 100)}`;
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
  // A valid Bearer token identifies the user (mobile); rate-limit per user instead of per IP
  // so many students behind one carrier IP don't block each other.
  let bearerUserId: string | null = null;
  const bearer = bearerClient(req);
  if (bearer) {
    const { data, error } = await bearer.client.auth.getUser(bearer.token);
    if (!error && data.user) bearerUserId = data.user.id;
  }

  // Optional gate — off by default so the compiler is usable straight from a
  // tutorial link without signing in.
  if (!bearerUserId && (process.env.COMPILER_REQUIRE_AUTH || "").toLowerCase() === "true") {
    const supabase = createAuthedServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Sign in to run code." }, { status: 401 });
    }
  }

  const rate = checkRateLimit(bearerUserId ? `user:${bearerUserId}` : clientKey(req), RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
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

  const parsed = runRequestSchema.safeParse(json);
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

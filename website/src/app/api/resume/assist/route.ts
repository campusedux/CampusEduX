import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getOptionalUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { checkRateLimit } from "@/lib/compiler/rateLimit";
import { getAssistSuggestion, ASSIST_SECTIONS } from "@/lib/resumeBuilder/aiAssist";

/**
 * POST /api/resume/assist — the one AI writing-assist endpoint, called by
 * both the website (cookie session) and the mobile app (bearer JWT). This
 * is the first route in the codebase that needs to authenticate a mobile
 * client directly, so it supports both:
 *
 *   Website  -> cookie session -> createAuthedServerSupabase()
 *   Mobile   -> Authorization: Bearer <supabase JWT> -> a client scoped to
 *               that token, validated via supabase.auth.getUser(token)
 *
 * CORS is enabled (also a first for this codebase) since a request from a
 * mobile WebView/dev client isn't same-origin. Never writes to
 * resumes_builder — it only returns a suggestion string; accept/reject/edit
 * is entirely a client-side decision (see ResumeAIAssistPanel).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function corsJson(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const bodySchema = z.object({
  resumeId: z.string().uuid().nullable().optional(),
  section: z.enum(ASSIST_SECTIONS),
  currentText: z.string().max(20_000),
  instruction: z.string().trim().min(1, "Missing instruction.").max(500),
  jdText: z.string().max(20_000).optional(),
});

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  let userId: string;
  let supabase: ReturnType<typeof createAuthedServerSupabase> | ReturnType<typeof createClient>;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return corsJson({ error: "Server misconfigured." }, 500);

    const bearerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data, error } = await bearerClient.auth.getUser(token);
    if (error || !data.user) return corsJson({ error: "Please sign in again." }, 401);
    userId = data.user.id;
    supabase = bearerClient;
  } else {
    const user = await getOptionalUser();
    if (!user) return corsJson({ error: "Please sign in again." }, 401);
    userId = user.id;
    supabase = createAuthedServerSupabase();
  }

  const rate = checkRateLimit(`resume-assist:${userId}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You're requesting suggestions very quickly. Please wait a moment." },
      { status: 429, headers: { ...CORS_HEADERS, "Retry-After": String(rate.retryAfter) } },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return corsJson({ error: "Malformed request." }, 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return corsJson({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, 400);
  }

  const result = await getAssistSuggestion(supabase, {
    userId,
    resumeId: parsed.data.resumeId ?? null,
    section: parsed.data.section,
    currentText: parsed.data.currentText,
    instruction: parsed.data.instruction,
    jdText: parsed.data.jdText,
  });

  if ("error" in result) return corsJson(result, 502);
  return corsJson(result, 200);
}

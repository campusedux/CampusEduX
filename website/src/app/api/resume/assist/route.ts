import { NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { resolveApiCaller } from "@/lib/apiAuth";
import { AI_DAILY_LIMIT_ASSIST, aiBudgetTake, budgetResponse, limitResponse, rlHit } from "@/lib/rateLimitDb";
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
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

const bodySchema = z.object({
  resumeId: z.guid().nullable().optional(),
  section: z.enum(ASSIST_SECTIONS),
  currentText: z.string().max(20_000),
  instruction: z.string().trim().min(1, "Missing instruction.").max(500),
  jdText: z.string().max(20_000).optional(),
});

export async function POST(req: Request) {
  const caller = await resolveApiCaller(req);
  if (!caller) return corsJson({ error: "Please sign in again." }, 401);
  const userId = caller.user.id;
  const supabase = caller.supabase;

  const limited = limitResponse(await rlHit(supabase, "resume-assist", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS), {
    message: "You're requesting suggestions very quickly. Please wait a moment.",
    withOk: false,
    headers: CORS_HEADERS,
  });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return corsJson({ error: "Malformed request." }, 400);
  }
  const parsed = bodySchema.safeParse(json, { error: validationError });
  if (!parsed.success) {
    return corsJson({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, 400);
  }

  // Daily per-user AI budget, consumed BEFORE the billable call (failed calls count).
  const overBudget = budgetResponse(await aiBudgetTake(supabase, "resume_assist", AI_DAILY_LIMIT_ASSIST()), {
    message: "You've reached today's AI suggestion limit. Please try again tomorrow.",
    headers: CORS_HEADERS,
  });
  if (overBudget) return overBudget;

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

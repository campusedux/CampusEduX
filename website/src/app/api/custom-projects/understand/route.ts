import { NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { resolveApiCaller } from "@/lib/apiAuth";
import { AI_DAILY_LIMIT_UNDERSTAND, aiBudgetTake, budgetResponse, limitResponse, rlHit } from "@/lib/rateLimitDb";
import { getProjectUnderstanding } from "@/lib/customProjects/aiUnderstand";
import { PLATFORMS, PROJECT_LEVELS, PROJECT_TYPES } from "@/lib/customProjects";

/**
 * POST /api/custom-projects/understand — cookie session or Bearer JWT.
 * Infers project type/level/platform + a short overview + feature
 * suggestions from the Details step's freeform text. Never writes to the
 * draft itself; the Details step applies the result client-side.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

const bodySchema = z.object({
  title: z.string().trim().min(1, "Missing project name.").max(200),
  objective: z.string().trim().min(1, "Missing project objective.").max(4000),
  problemStatement: z.string().max(4000).optional(),
  description: z.string().max(4000).optional(),
  targetUsers: z.string().max(4000).optional(),
  technologyPreference: z.string().max(4000).optional(),
  projectTypeHint: z.enum(PROJECT_TYPES).nullable().optional(),
  projectLevelHint: z.enum(PROJECT_LEVELS).nullable().optional(),
  platformHint: z.enum(PLATFORMS).nullable().optional(),
});

export async function POST(req: Request) {
  const caller = await resolveApiCaller(req);
  if (!caller) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const { user, supabase } = caller;

  const limited = limitResponse(await rlHit(supabase, "custom-projects-understand", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS), {
    message: "You're requesting this very quickly. Please wait a moment.",
    withOk: false,
  });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json, { error: validationError });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  // Daily per-user AI budget, consumed BEFORE the billable call (failed calls count).
  const overBudget = budgetResponse(await aiBudgetTake(supabase, "project_understand", AI_DAILY_LIMIT_UNDERSTAND()), {
    message: "You've reached today's AI limit. Please try again tomorrow.",
  });
  if (overBudget) return overBudget;

  const result = await getProjectUnderstanding(supabase, {
    userId: user.id,
    title: parsed.data.title,
    objective: parsed.data.objective,
    problemStatement: parsed.data.problemStatement,
    description: parsed.data.description,
    targetUsers: parsed.data.targetUsers,
    technologyPreference: parsed.data.technologyPreference,
    projectTypeHint: parsed.data.projectTypeHint ?? null,
    projectLevelHint: parsed.data.projectLevelHint ?? null,
    platformHint: parsed.data.platformHint ?? null,
  });

  if ("error" in result) return NextResponse.json(result, { status: 502 });
  return NextResponse.json(result, { status: 200 });
}

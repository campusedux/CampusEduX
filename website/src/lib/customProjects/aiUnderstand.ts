import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabase } from "@/lib/supabase/server";
import { PLATFORMS, PROJECT_LEVELS, PROJECT_TYPES, type Platform, type ProjectLevel, type ProjectType } from "@/lib/customProjects";

// Haiku 4.5 — same cost-conscious pick already made for resume AI-assist
// (website/src/lib/resumeBuilder/aiAssist.ts): fast/cheap, a good fit for a
// short structured inference call, not a silent default.
const MODEL_ID = "claude-haiku-4-5-20251001";
const DAILY_REQUEST_CAP = 30;

export interface UnderstandRequest {
  userId: string;
  title: string;
  objective: string;
  problemStatement?: string;
  description?: string;
  targetUsers?: string;
  technologyPreference?: string;
  /** Already chosen by the customer — the AI must not override these. */
  projectTypeHint?: ProjectType | null;
  projectLevelHint?: ProjectLevel | null;
  platformHint?: Platform | null;
}

export interface UnderstandResult {
  projectType: ProjectType;
  projectLevel: ProjectLevel;
  platform: Platform;
  overview: string;
  /** Catalog ids the model considers necessary for this project (free or paid). */
  recommendedFeatureIds: string[];
  /** Catalog ids the model considers optional-but-relevant add-ons. */
  suggestedExtraFeatureIds: string[];
}
export type UnderstandOutcome = UnderstandResult | { error: string };

const modelResponseSchema = z.object({
  projectType: z.enum(PROJECT_TYPES),
  projectLevel: z.enum(PROJECT_LEVELS),
  platform: z.enum(PLATFORMS),
  overview: z.string().max(600),
  recommendedFeatureIds: z.array(z.string()).max(60).default([]),
  suggestedExtraFeatureIds: z.array(z.string()).max(60).default([]),
});

async function countTodayRequests(supabase: SupabaseClient, userId: string): Promise<number> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("custom_project_ai_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  return count ?? 0;
}

async function logRequest(supabase: SupabaseClient, userId: string): Promise<void> {
  await supabase.from("custom_project_ai_requests").insert({ user_id: userId });
}

function buildSystemPrompt(catalog: { id: string; name: string; category: string; price: number }[]): string {
  const catalogLines = catalog.map((f) => `- ${f.id} | ${f.name} | ${f.category} | ${f.price === 0 ? "free" : `₹${f.price}`}`).join("\n");
  return [
    "You help scope custom software projects for a student/business project-builder service.",
    "Given a project name and a plain-language description of what it should achieve, infer the project's shape and suggest features from a fixed catalog — never invent a feature id that isn't in the catalog below.",
    "",
    `Valid projectType values: ${PROJECT_TYPES.join(", ")}.`,
    `Valid projectLevel values: ${PROJECT_LEVELS.join(", ")}. Use "standard" unless the description clearly needs more complex functionality, multiple integrations, or heavy customization — do not default to "advanced".`,
    `Valid platform values: ${PLATFORMS.join(", ")}.`,
    "",
    "Feature catalog (id | name | category | price):",
    catalogLines,
    "",
    "Respond with strict JSON only, no prose, matching exactly this shape:",
    '{"projectType":"...","projectLevel":"...","platform":"...","overview":"one or two sentence, customer-friendly, non-technical summary of what this project does","recommendedFeatureIds":["..."],"suggestedExtraFeatureIds":["..."]}',
    "",
    "recommendedFeatureIds = features genuinely necessary or strongly expected for this specific project (both free and paid ids are fine here) — keep this practical and proportionate to the project level, not maximal.",
    "suggestedExtraFeatureIds = paid features that would be a nice, relevant enhancement but aren't required.",
    "Every id in both lists must come from the catalog above, exactly as written. Do not recommend advanced/enterprise features for a project that doesn't need them.",
  ].join("\n");
}

/**
 * Infers project type/level/platform + feature suggestions from freeform
 * project text. Never writes anything about the draft itself — it only
 * returns a suggestion; the caller (the Details step) decides what to apply.
 * Mirrors the resume AI-assist contract: never throws, always a tagged result.
 */
export async function getProjectUnderstanding(supabase: SupabaseClient, req: UnderstandRequest): Promise<UnderstandOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "AI project understanding isn't configured yet." };

  const requestCount = await countTodayRequests(supabase, req.userId);
  if (requestCount >= DAILY_REQUEST_CAP) {
    return { error: `You've reached today's AI assist limit (${DAILY_REQUEST_CAP} requests). Please try again tomorrow.` };
  }

  const pub = getPublicSupabase();
  if (!pub) return { error: "AI project understanding isn't available right now." };
  const { data: catalogRows } = await pub
    .from("custom_project_features")
    .select("id,name,category,price")
    .eq("is_active", true);
  const catalog = (catalogRows ?? []) as { id: string; name: string; category: string; price: number }[];
  if (catalog.length === 0) return { error: "AI project understanding isn't available right now." };

  const userMessageParts = [
    `Project name: ${req.title}`,
    `What it should achieve: ${req.objective}`,
  ];
  if (req.problemStatement) userMessageParts.push(`Problem statement: ${req.problemStatement}`);
  if (req.description) userMessageParts.push(`Description: ${req.description}`);
  if (req.targetUsers) userMessageParts.push(`Target users: ${req.targetUsers}`);
  if (req.technologyPreference) userMessageParts.push(`Technology preference: ${req.technologyPreference}`);
  if (req.projectTypeHint) userMessageParts.push(`The customer already chose projectType="${req.projectTypeHint}" — keep it exactly as-is.`);
  if (req.projectLevelHint) userMessageParts.push(`The customer already chose projectLevel="${req.projectLevelHint}" — keep it exactly as-is.`);
  if (req.platformHint) userMessageParts.push(`The customer already chose platform="${req.platformHint}" — keep it exactly as-is.`);

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 1024,
      system: buildSystemPrompt(catalog),
      messages: [{ role: "user", content: userMessageParts.join("\n") }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.type === "text" ? textBlock.text.trim() : "";
    if (!raw) return { error: "The assistant didn't return a result. Please try again." };

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(stripCodeFence(raw));
    } catch {
      return { error: "Couldn't understand the project right now. Please try again." };
    }
    const parsed = modelResponseSchema.safeParse(parsedJson);
    if (!parsed.success) return { error: "Couldn't understand the project right now. Please try again." };

    const validIds = new Set(catalog.map((f) => f.id));
    const projectType = req.projectTypeHint ?? parsed.data.projectType;
    const projectLevel = req.projectLevelHint ?? parsed.data.projectLevel;
    const platform = req.platformHint ?? parsed.data.platform;

    await logRequest(supabase, req.userId);

    return {
      projectType,
      projectLevel,
      platform,
      overview: parsed.data.overview.trim(),
      recommendedFeatureIds: parsed.data.recommendedFeatureIds.filter((id) => validIds.has(id)),
      suggestedExtraFeatureIds: parsed.data.suggestedExtraFeatureIds.filter((id) => validIds.has(id)),
    };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { error: "The AI assistant is busy right now. Please try again shortly." };
    }
    if (error instanceof Anthropic.APIError) {
      return { error: "Couldn't understand the project right now. Please try again." };
    }
    return { error: "Couldn't understand the project right now. Please try again." };
  }
}

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1] : text;
}

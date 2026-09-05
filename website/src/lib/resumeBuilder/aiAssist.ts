import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabase } from "@/lib/supabase/server";

// Haiku 4.5 — fast/cheap, a good fit for short interactive rewrite
// suggestions (confirmed with the user before implementing, per the
// engagement's own plan: this was flagged as a cost decision, not a default
// to bake in silently).
const MODEL_ID = "claude-haiku-4-5-20251001";
const DAILY_REQUEST_CAP = 30;

export const ASSIST_SECTIONS = ["summary", "experience", "projects", "skills"] as const;
export type AssistSection = (typeof ASSIST_SECTIONS)[number];

export interface AssistRequest {
  userId: string;
  resumeId: string | null;
  section: AssistSection;
  currentText: string;
  instruction: string;
  jdText?: string;
}

export type AssistResult = { suggestion: string } | { error: string };

async function getActivePrompt(section: AssistSection): Promise<{ systemPrompt: string; maxTokens: number } | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("resume_ai_prompts")
    .select("system_prompt, max_tokens")
    .eq("section", section)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { systemPrompt: data.system_prompt, maxTokens: data.max_tokens };
}

async function countTodayRequests(supabase: SupabaseClient, userId: string): Promise<number> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("resume_ai_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  return count ?? 0;
}

async function logRequest(supabase: SupabaseClient, userId: string, resumeId: string | null, mode: string): Promise<void> {
  await supabase.from("resume_ai_requests").insert({ user_id: userId, resume_id: resumeId, mode });
}

/**
 * Runs one AI writing-assist request. Never writes to resumes_builder
 * itself — it only returns a suggestion; the caller decides whether to
 * accept, edit, or reject it (the mandatory Original/Suggested/Accept/
 * Reject/Edit contract lives entirely in the client-side panel).
 *
 * `supabase` is injected rather than created here because the caller (the
 * assist route) resolves it differently depending on whether the request
 * came from the website (cookie session) or mobile (bearer JWT) — this
 * function doesn't need to know which.
 */
export async function getAssistSuggestion(supabase: SupabaseClient, req: AssistRequest): Promise<AssistResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "AI writing assist isn't configured yet." };

  const requestCount = await countTodayRequests(supabase, req.userId);
  if (requestCount >= DAILY_REQUEST_CAP) {
    return { error: `You've reached today's AI assist limit (${DAILY_REQUEST_CAP} requests). Please try again tomorrow.` };
  }

  const prompt = await getActivePrompt(req.section);
  if (!prompt) return { error: "AI assist isn't available for this section right now." };

  const userMessageParts = [`Instruction: ${req.instruction}`, `Current text:\n${req.currentText || "(empty)"}`];
  if (req.jdText) {
    userMessageParts.push(`Target job description (for context only — do not copy from it verbatim):\n${req.jdText}`);
  }

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: prompt.maxTokens,
      system: prompt.systemPrompt,
      messages: [{ role: "user", content: userMessageParts.join("\n\n") }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const suggestion = textBlock?.type === "text" ? textBlock.text.trim() : "";
    if (!suggestion) return { error: "The assistant didn't return a suggestion. Please try again." };

    await logRequest(supabase, req.userId, req.resumeId, req.section);
    return { suggestion };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { error: "The AI assistant is busy right now. Please try again shortly." };
    }
    if (error instanceof Anthropic.APIError) {
      return { error: "Couldn't get a suggestion right now. Please try again." };
    }
    return { error: "Couldn't get a suggestion right now. Please try again." };
  }
}

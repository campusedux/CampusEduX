import { supabase } from "@/lib/supabase";
import { BRAND } from "@/constants/brand";

/**
 * Calls the website's /api/resume/assist over HTTPS with a bearer JWT — the
 * same endpoint the website's own editor calls with a cookie session. This
 * is the first mobile call into a website API route rather than Supabase
 * directly, so the endpoint has to validate a raw bearer token itself
 * (see the route's dual-auth handling) instead of relying on RLS alone.
 */

export type AssistSection = "summary" | "experience" | "projects" | "skills";

export interface AssistRequestInput {
  resumeId: string;
  section: AssistSection;
  currentText: string;
  instruction: string;
  jdText?: string;
}

export type AssistResult = { suggestion: string } | { error: string };

const ASSIST_URL = `${BRAND.website.replace(/\/$/, "")}/api/resume/assist`;

export const resumeAssistService = {
  async requestSuggestion(input: AssistRequestInput): Promise<AssistResult> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return { error: "Please sign in again." };

      const response = await fetch(ASSIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok) return { error: body?.error ?? "Couldn't get a suggestion. Please try again." };
      return { suggestion: body.suggestion as string };
    } catch {
      return { error: "Couldn't get a suggestion. Please try again." };
    }
  },
};

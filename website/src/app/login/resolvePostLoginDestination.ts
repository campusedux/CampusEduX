import type { createBrowserSupabase } from "@/lib/supabase/browser";
import { isAcademicComplete } from "@/lib/academic";

type BrowserSupabase = ReturnType<typeof createBrowserSupabase>;

/**
 * Where to send the browser after a successful password sign-in. An
 * incomplete profile (course/branch/year) always goes to /onboarding,
 * regardless of `next` — mirrors auth/callback/route.ts's
 * `postLoginDestination` for the Google OAuth flow. Kept out of page.tsx
 * (which may only export Next.js's reserved page exports) so it stays
 * testable without rendering.
 */
export async function resolvePostLoginDestination(
  supabase: BrowserSupabase,
  userId: string,
  next: string,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("course, branch, year")
    .eq("id", userId)
    .maybeSingle();
  return isAcademicComplete(profile ?? {}) ? next : "/onboarding";
}

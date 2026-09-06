import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { CURRENT_LEGAL_VERSION, LEGAL_VERSIONS } from "@/legal/config";

/**
 * Payload for `public.record_legal_consent(...)` (mobile-app migration
 * 0039_legal_consent.sql) — a SECURITY DEFINER RPC that pins `user_id` and
 * `accepted_at` server-side; the client only reports which version strings it
 * displayed. The website records the same way the app does.
 */
export function legalConsentArgs(source: string) {
  return {
    p_legal_version: CURRENT_LEGAL_VERSION,
    p_privacy_version: LEGAL_VERSIONS["privacy-policy"].version,
    p_terms_version: LEGAL_VERSIONS.terms.version,
    p_source: source,
  };
}

/**
 * Best-effort: make sure the signed-in user has a consent row for the current
 * policy version, recording one if not. Safe to call on every authenticated
 * page load — it does one indexed SELECT and only writes when missing. Never
 * throws (the table/RPC may not be deployed yet, or the network may fail); a
 * missing consent record must never break a page.
 */
export async function ensureLegalConsent(source = "website"): Promise<void> {
  try {
    const supabase = createAuthedServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("legal_consents")
      .select("id")
      .eq("legal_version", CURRENT_LEGAL_VERSION)
      .limit(1)
      .maybeSingle();

    if (error || data) return; // already recorded, or the table isn't there
    await supabase.rpc("record_legal_consent", legalConsentArgs(source));
  } catch {
    // swallow — consent tracking is non-critical to rendering the page
  }
}

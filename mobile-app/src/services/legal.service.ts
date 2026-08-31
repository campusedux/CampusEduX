import { supabase } from "@/lib/supabase";
import { CURRENT_LEGAL_VERSION, LEGAL_VERSIONS } from "@/constants/legal";

/**
 * Records that the signed-in user has accepted the current legal policies.
 *
 * The acceptance gesture is the checkbox on the Register screen (which links to
 * the actual Terms & Privacy documents). Because sign-up may require email
 * confirmation, there is no session at that moment, so the durable record is
 * written on the user's first authenticated load (useAuthBootstrap).
 *
 * The DB function record_legal_consent (migration 0039) stamps user_id from
 * auth.uid() and accepted_at from now() server-side; the client only supplies
 * which version strings it displayed.
 */
export const legalService = {
  async recordConsent(source: "app" | "register" | "reprompt" = "app"): Promise<void> {
    const { error } = await supabase.rpc("record_legal_consent", {
      p_legal_version: CURRENT_LEGAL_VERSION,
      p_privacy_version: LEGAL_VERSIONS["privacy-policy"].version,
      p_terms_version: LEGAL_VERSIONS.terms.version,
      p_source: source,
    });
    if (error) throw new Error(error.message);
  },

  /** True when a consent row for the current aggregate version already exists. */
  async hasCurrentConsent(): Promise<boolean> {
    const { data, error } = await supabase
      .from("legal_consents")
      .select("legal_version")
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.legal_version === CURRENT_LEGAL_VERSION;
  },

  /**
   * Writes a consent record if the current version has not been recorded yet.
   * Safe to call on every authenticated startup; errors are non-fatal.
   */
  async ensureConsentRecorded(source: "app" | "register" | "reprompt" = "app"): Promise<void> {
    try {
      if (await legalService.hasCurrentConsent()) return;
      await legalService.recordConsent(source);
    } catch (error) {
      console.warn("[legal.service] consent record skipped:", (error as Error).message);
    }
  },
};

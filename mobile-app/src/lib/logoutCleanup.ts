import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { useJobFilterStore } from "@/store/jobFilterStore";
import { useProjectFilterStore } from "@/store/projectFilterStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useBuilderStore } from "@/customProjects/builderStore";
import { clearCachedProfile } from "@/lib/storage";

/**
 * The ONE place that wipes per-user client state. Call it after sign-out (and
 * from the SIGNED_OUT auth event) so the next account on this device never
 * sees the previous account's cached server data, drafts, filters or prefs.
 * Idempotent — safe to call from several paths for the same logout.
 *
 * Device-level display prefs (theme, accent, AMOLED, reduce-animations,
 * language) are kept: they are not personal data and resetting them would make
 * the app flash back to light theme on the login screen. Everything
 * account-bound (notification prefs, terms agreement, hydration flag) is reset,
 * so the next user's server preferences are re-hydrated.
 */
export async function performLogoutCleanup(): Promise<void> {
  queryClient.cancelQueries();
  queryClient.clear();

  useBuilderStore.getState().reset();
  useJobFilterStore.getState().resetFilters();
  useProjectFilterStore.getState().resetFilters();
  useSettingsStore.getState().resetForSignOut();
  useAuthStore.getState().reset();

  try {
    await clearCachedProfile();
  } catch {
    // Non-fatal: the cached profile is id-checked on the next bootstrap.
  }
}

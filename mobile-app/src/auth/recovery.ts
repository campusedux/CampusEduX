import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { performLogoutCleanup } from "@/lib/logoutCleanup";
import { reportError } from "@/lib/errorReporting";

/**
 * Called when the user leaves the forgot-password flow without saving a new
 * password (back button, screen unmount). Verifying the reset OTP creates a
 * real session, so an abandoned flow would otherwise leave them signed in
 * without ever proving they know a password — and keep `isRecoveringPassword`
 * true, which makes the auth listener swallow every later SIGNED_IN.
 *
 * No-op when the flag is already false (e.g. the password was saved and the
 * Reset screen already signed the recovery session out).
 */
export async function abandonPasswordRecovery(): Promise<void> {
  const store = useAuthStore.getState();
  if (!store.isRecoveringPassword) return;
  // Clear the flag first so the SIGNED_OUT / SIGNED_IN listener paths run normally.
  store.setRecoveringPassword(false);
  store.setPendingIdentifier(null);
  try {
    const session = await authService.getSession();
    if (session) {
      await authService.logout();
      await performLogoutCleanup();
    }
  } catch (error) {
    reportError(error, { source: "abandonPasswordRecovery" });
  }
}

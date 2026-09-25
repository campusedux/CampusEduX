import { useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { performLogoutCleanup } from "@/lib/logoutCleanup";
import type { LoginPayload, RegisterPayload } from "@/types";

/**
 * Wraps authService calls with store updates so screens stay declarative.
 *
 * NOTE: login/register must NOT touch the global `isLoading`. That flag is the
 * cold-start "restoring session" flag consumed by RootNavigator: flipping it
 * unmounts the whole NavigationContainer (and the Login/Register screen with
 * its typed values and inline error). Screens track their own `submitting`.
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { profile } = await authService.login(payload);
      setUser(profile);
      return profile;
    },
    [setUser]
  );

  const register = useCallback((payload: RegisterPayload) => authService.register(payload), []);

  const resendVerificationEmail = useCallback((email: string) => authService.resendVerificationEmail(email), []);

  const loginWithGoogle = useCallback(async () => {
    // The session (and profile) is picked up by useAuthBootstrap's
    // onAuthStateChange handler once the OAuth redirect completes.
    await authService.signInWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    await performLogoutCleanup();
  }, []);

  return { user, isAuthenticated, isLoading, login, register, resendVerificationEmail, loginWithGoogle, logout };
}

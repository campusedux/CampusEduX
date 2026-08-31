import { useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import type { LoginPayload, RegisterPayload } from "@/types";

/**
 * Wraps authService calls with store updates so screens stay declarative.
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, reset } = useAuthStore();

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const { profile } = await authService.login(payload);
        setUser(profile);
        return profile;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setUser]
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      return await authService.register(payload);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const loginWithGoogle = useCallback(async () => {
    // The session (and profile) is picked up by useAuthBootstrap's
    // onAuthStateChange handler once the OAuth redirect completes.
    await authService.signInWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    reset();
  }, [reset]);

  return { user, isAuthenticated, isLoading, login, register, loginWithGoogle, logout };
}

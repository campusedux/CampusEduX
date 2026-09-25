import { create } from "zustand";
import type { UserProfile } from "@/types";

interface AuthStoreState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  /**
   * Cold-start "restoring session" flag ONLY (consumed by RootNavigator to show
   * the splash). Never set it for login/register: it unmounts the navigator.
   */
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasCompletedProfileSetup: boolean;
  pendingIdentifier: string | null; // used across forgot-password / OTP flow
  /**
   * True from the moment the user starts the forgot-password flow until the
   * new password is saved. The OTP step creates a real Supabase session, so
   * without this flag the auth listener would treat the user as "logged in"
   * and navigate away from the reset screen before they set a password.
   */
  isRecoveringPassword: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
  setProfileSetupComplete: (value: boolean) => void;
  setPendingIdentifier: (identifier: string | null) => void;
  setRecoveringPassword: (value: boolean) => void;
  updateUserFields: (fields: Partial<UserProfile>) => void;
  reset: () => void;
}

/**
 * Academic setup is "complete" only when all three values are persisted on the
 * profile row. This is the single source of truth for whether to show the
 * course / branch / year setup flow — never transient React state.
 */
export function isAcademicComplete(user: UserProfile | null): boolean {
  return !!(user?.course && user?.branch && user?.year);
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,
  hasCompletedProfileSetup: false,
  pendingIdentifier: null,
  isRecoveringPassword: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      hasCompletedProfileSetup: isAcademicComplete(user),
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setOnboardingComplete: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
  setProfileSetupComplete: (hasCompletedProfileSetup) => set({ hasCompletedProfileSetup }),
  setPendingIdentifier: (pendingIdentifier) => set({ pendingIdentifier }),
  setRecoveringPassword: (isRecoveringPassword) => set({ isRecoveringPassword }),
  updateUserFields: (fields) =>
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, ...fields };
      return { user, hasCompletedProfileSetup: isAcademicComplete(user) };
    }),
  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      hasCompletedProfileSetup: false,
      pendingIdentifier: null,
      isRecoveringPassword: false,
    }),
}));

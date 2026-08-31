import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";
import { legalService } from "@/services/legal.service";
import { useAuthStore, isAcademicComplete } from "@/store/authStore";
import {
  secureStorage,
  STORAGE_KEYS,
  getCachedProfile,
  setCachedProfile,
  clearCachedProfile,
} from "@/lib/storage";
import type { UserProfile } from "@/types";

/**
 * Restores the auth session on every cold start / web refresh and keeps the
 * store in sync with Supabase's auth lifecycle for the rest of the session.
 *
 * Flow (matches the spec's "App Start → Restore Session → …" diagram):
 *   1. Read the onboarding flag + the cached profile so the first paint is
 *      already correct (no Login flash while the session is being restored).
 *   2. Ask Supabase for the persisted session (local read — survives app
 *      restart, browser refresh, Android/iOS restart until explicit logout).
 *   3. If there is a session, load the profile row (source of truth for
 *      course / branch / year) and cache it. If the network is down, fall
 *      back to the cached profile for the same user.
 *   4. Flip isLoading off — RootNavigator then renders Auth / ProfileSetup /
 *      Main declaratively from the store.
 *
 * The onAuthStateChange subscription then handles sign-in (incl. Google OAuth
 * redirects), sign-out, and password-recovery for the running app.
 */
export function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setProfileSetupComplete = useAuthStore((s) => s.setProfileSetupComplete);
  const setRecoveringPassword = useAuthStore((s) => s.setRecoveringPassword);
  const reset = useAuthStore((s) => s.reset);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const [onboardingFlag, cachedProfile] = await Promise.all([
          secureStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
          getCachedProfile<UserProfile>(),
        ]);
        if (!mounted) return;
        setOnboardingComplete(!!onboardingFlag);

        const session = await authService.getSession();

        if (!session?.user) {
          setUser(null);
          await clearCachedProfile();
          return;
        }

        // Seed from cache immediately so academic details are on screen even
        // before / without the network round-trip.
        if (cachedProfile?.id === session.user.id) {
          setUser(cachedProfile);
          setProfileSetupComplete(isAcademicComplete(cachedProfile));
        }

        try {
          const profile = await authService.getProfile(
            session.user.id,
            session.user.email ?? ""
          );
          if (!mounted) return;
          setUser(profile);
          setProfileSetupComplete(isAcademicComplete(profile));
          await setCachedProfile(profile);
          // Persist acceptance of the current legal policies (the gesture is the
          // Register checkbox; this is its durable record). Non-blocking.
          void legalService.ensureConsentRecorded();
        } catch (error) {
          // Offline or transient: keep the cached profile for this user rather
          // than bouncing them to Login.
          if (cachedProfile?.id !== session.user.id) {
            console.error("Profile load failed and no cached profile:", error);
            setUser(null);
          } else {
            console.warn("Profile load failed; using cached profile.", error);
          }
        }
      } catch (error) {
        console.error("Auth bootstrap error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const store = useAuthStore.getState();

      if (event === "PASSWORD_RECOVERY") {
        setRecoveringPassword(true);
        return;
      }

      if (event === "SIGNED_OUT" || !session?.user) {
        if (store.isAuthenticated || store.user) {
          reset();
          await clearCachedProfile();
        }
        return;
      }

      // A session exists mid password-reset (the OTP step created it) — leave
      // the user on the reset screen until they set a new password.
      if (store.isRecoveringPassword) return;

      if (event === "SIGNED_IN" && !store.user) {
        try {
          const profile = await authService.getProfile(
            session.user.id,
            session.user.email ?? ""
          );
          store.setUser(profile);
          store.setProfileSetupComplete(isAcademicComplete(profile));
          await setCachedProfile(profile);
          void legalService.ensureConsentRecorded();
        } catch (error) {
          console.error("onAuthStateChange: profile load failed:", error);
        }
        return;
      }

      if (event === "USER_UPDATED" && store.user) {
        try {
          const profile = await authService.getProfile(
            session.user.id,
            session.user.email ?? ""
          );
          store.setUser(profile);
          await setCachedProfile(profile);
        } catch (error) {
          console.error("onAuthStateChange: profile refresh failed:", error);
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // Store setters are stable (zustand) — run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppPreferences, NotificationPreferences } from "@/types";

export const ACCENT_COLORS = ["#4F39F6", "#3B82F6", "#22C55E", "#F97316", "#EF4444", "#EC4899"];

const DEFAULT_PREFERENCES: AppPreferences = {
  theme: "light",
  accentColor: ACCENT_COLORS[0],
  useAmoledDark: false,
  reduceAnimations: false,
  languageCode: "en",
  hasAgreedToTerms: false,
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  pushEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  promotions: true,
  jobAlerts: true,
  applicationUpdates: true,
  messageAlerts: true,
  newsUpdates: true,
};

interface SettingsState {
  preferences: AppPreferences;
  notifications: NotificationPreferences;
  hasHydratedFromServer: boolean;
  setPreferences: (partial: Partial<AppPreferences>) => void;
  setNotifications: (partial: Partial<NotificationPreferences>) => void;
  hydrateFromServer: (preferences: AppPreferences, notifications: NotificationPreferences) => void;
  /** Sign-out: drop account-bound settings, keep device-level display prefs. */
  resetForSignOut: () => void;
}

/** Display prefs that belong to the device, not the account. */
const DEVICE_LEVEL_PREF_KEYS = ["theme", "accentColor", "useAmoledDark", "reduceAnimations", "languageCode"] as const;

export function preferencesAfterSignOut(current: AppPreferences): AppPreferences {
  const kept: Partial<AppPreferences> = {};
  for (const key of DEVICE_LEVEL_PREF_KEYS) (kept as Record<string, unknown>)[key] = current[key];
  return { ...DEFAULT_PREFERENCES, ...kept };
}

/**
 * Local-first settings: the UI reads/writes here for instant feedback
 * (theme toggles, switches) and persists across app restarts via
 * AsyncStorage. settings.service.ts syncs these to Supabase in the
 * background so preferences follow the user across devices.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      notifications: DEFAULT_NOTIFICATIONS,
      hasHydratedFromServer: false,
      setPreferences: (partial) => set((state) => ({ preferences: { ...state.preferences, ...partial } })),
      setNotifications: (partial) => set((state) => ({ notifications: { ...state.notifications, ...partial } })),
      hydrateFromServer: (preferences, notifications) => set({ preferences, notifications, hasHydratedFromServer: true }),
      resetForSignOut: () =>
        set((state) => ({
          preferences: preferencesAfterSignOut(state.preferences),
          notifications: DEFAULT_NOTIFICATIONS,
          hasHydratedFromServer: false,
        })),
    }),
    {
      name: "campusedux-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ preferences: state.preferences, notifications: state.notifications }),
    }
  )
);

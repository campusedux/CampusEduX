import { userScopedKey } from "@/lib/queryClient";
import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import type { AppPreferences, NotificationPreferences } from "@/types";

/**
 * Loads server-synced preferences once per session (on first mount after
 * login) and merges them into the local store, so a user's theme/language/
 * notification choices follow them across devices. Local changes remain
 * instant (see useUpdatePreferences) — this only runs one-way, on load.
 */
export function useHydrateSettingsFromServer() {
  const userId = useAuthStore((s) => s.user?.id);
  const hasHydrated = useSettingsStore((s) => s.hasHydratedFromServer);
  const hydrateFromServer = useSettingsStore((s) => s.hydrateFromServer);
  const attempted = useRef(false);

  useEffect(() => {
    if (!userId || hasHydrated || attempted.current) return;
    attempted.current = true;
    settingsService.getPreferences(userId).then((result) => {
      if (result) hydrateFromServer(result.preferences, result.notifications);
    });
  }, [userId, hasHydrated, hydrateFromServer]);
}

export function useUpdatePreferences() {
  const userId = useAuthStore((s) => s.user?.id);
  const setPreferences = useSettingsStore((s) => s.setPreferences);

  return (partial: Partial<AppPreferences>) => {
    setPreferences(partial);
    if (userId) {
      const next = { ...useSettingsStore.getState().preferences, ...partial };
      settingsService.syncPreferences(userId, next).catch((error) => console.error("Failed to sync preferences:", error));
    }
  };
}

export function useUpdateNotifications() {
  const userId = useAuthStore((s) => s.user?.id);
  const setNotifications = useSettingsStore((s) => s.setNotifications);

  return (partial: Partial<NotificationPreferences>) => {
    setNotifications(partial);
    if (userId) {
      const next = { ...useSettingsStore.getState().notifications, ...partial };
      settingsService.syncNotifications(userId, next).catch((error) => console.error("Failed to sync notifications:", error));
    }
  };
}

export const useBlockedUsers = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(["blocked-users"] as const, userId),
    queryFn: () => settingsService.getBlockedUsers(userId as string),
    enabled: !!userId,
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (blockedUserId: string) => settingsService.unblockUser(userId as string, blockedUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocked-users"] }),
  });
};

export const useCacheSize = () =>
  useQuery({ queryKey: ["cache-size"], queryFn: settingsService.getCacheSizeMB, staleTime: 0 });

export const useClearCache = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsService.clearCache,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cache-size"] }),
  });
};

export const useDeleteAccount = () => useMutation({ mutationFn: settingsService.deleteAccount });

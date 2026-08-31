import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/lib/supabase";
import type { AppPreferences, NotificationPreferences, BlockedUser } from "@/types";

export const settingsService = {
  async getPreferences(userId: string): Promise<{ preferences: AppPreferences; notifications: NotificationPreferences } | null> {
    const [{ data: prefRow }, { data: notifRow }] = await Promise.all([
      supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (!prefRow && !notifRow) return null;

    return {
      preferences: {
        theme: prefRow?.theme ?? "light",
        accentColor: prefRow?.accent_color ?? "#4F39F6",
        useAmoledDark: prefRow?.use_amoled_dark ?? false,
        reduceAnimations: prefRow?.reduce_animations ?? false,
        languageCode: prefRow?.language_code ?? "en",
        hasAgreedToTerms: prefRow?.has_agreed_to_terms ?? false,
      },
      notifications: {
        pushEnabled: notifRow?.push_enabled ?? true,
        soundEnabled: notifRow?.sound_enabled ?? true,
        vibrationEnabled: notifRow?.vibration_enabled ?? true,
        promotions: notifRow?.promotions ?? true,
        jobAlerts: notifRow?.job_alerts ?? true,
        applicationUpdates: notifRow?.application_updates ?? true,
        messageAlerts: notifRow?.message_alerts ?? true,
        newsUpdates: notifRow?.news_updates ?? true,
      },
    };
  },

  async syncPreferences(userId: string, prefs: AppPreferences): Promise<void> {
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: userId,
      theme: prefs.theme,
      accent_color: prefs.accentColor,
      use_amoled_dark: prefs.useAmoledDark,
      reduce_animations: prefs.reduceAnimations,
      language_code: prefs.languageCode,
      has_agreed_to_terms: prefs.hasAgreedToTerms,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  },

  async syncNotifications(userId: string, prefs: NotificationPreferences): Promise<void> {
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: userId,
      push_enabled: prefs.pushEnabled,
      sound_enabled: prefs.soundEnabled,
      vibration_enabled: prefs.vibrationEnabled,
      promotions: prefs.promotions,
      job_alerts: prefs.jobAlerts,
      application_updates: prefs.applicationUpdates,
      message_alerts: prefs.messageAlerts,
      news_updates: prefs.newsUpdates,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  },

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("blocked_at, blocked:profiles!blocked_users_blocked_user_id_fkey(id, full_name, avatar_url)")
        .eq("user_id", userId)
        .order("blocked_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? [])
        .filter((row: any) => row.blocked)
        .map((row: any) => ({
          id: row.blocked.id,
          fullName: row.blocked.full_name,
          avatarUrl: row.blocked.avatar_url,
          blockedAt: row.blocked_at,
        }));
    } catch (error) {
      console.info(`[settings.service] getBlockedUsers: none available (${(error as Error).message})`);
      return [];
    }
  },

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("user_id", userId)
      .eq("blocked_user_id", blockedUserId);
    if (error) throw new Error(`Couldn't unblock this user: ${error.message}`);
  },

  /**
   * Computes the size of the app's on-device cache directory (downloaded
   * files, cached images, etc.) and clears it. This only frees local
   * device storage — it doesn't touch anything in Supabase.
   */
  async getCacheSizeMB(): Promise<number> {
    if (!FileSystem.cacheDirectory) return 0;
    const info = await FileSystem.getInfoAsync(FileSystem.cacheDirectory);
    if (!info.exists || !("size" in info)) return 0;
    return Math.round(((info.size ?? 0) / (1024 * 1024)) * 10) / 10;
  },

  async clearCache(): Promise<void> {
    if (!FileSystem.cacheDirectory) return;
    const entries = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
    await Promise.all(
      entries.map((entry) => FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${entry}`, { idempotent: true }))
    );
  },

  /**
   * Permanently deletes the account via an Edge Function (service role),
   * since the client can never be trusted to delete its own auth user.
   * Cascades to profile, purchases, applications, etc. via FK constraints.
   */
  async deleteAccount(): Promise<void> {
    const { error } = await supabase.functions.invoke("delete-account", { body: {} });
    if (error) throw new Error(error.message);
  },
};

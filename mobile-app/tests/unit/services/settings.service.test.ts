jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 5 * 1024 * 1024 })),
  readDirectoryAsync: jest.fn(() => Promise.resolve(["a.tmp", "b.tmp"])),
  deleteAsync: jest.fn(() => Promise.resolve()),
}));

import { settingsService } from "@/services/settings.service";
import { resetSupabaseMock, setTableResult, setFunctionResult, supabase } from "../../mocks/supabase.mock";

beforeEach(() => resetSupabaseMock());

describe("settingsService.getPreferences", () => {
  it("returns null when the student has neither preferences nor notification rows", async () => {
    setTableResult("user_preferences", { data: null });
    setTableResult("notification_preferences", { data: null });

    expect(await settingsService.getPreferences("u-1")).toBeNull();
  });

  it("fills defaults for any column missing from a partial preferences row", async () => {
    setTableResult("user_preferences", { data: { theme: "dark", accent_color: "#000000" } });
    setTableResult("notification_preferences", { data: null });

    const result = await settingsService.getPreferences("u-1");

    expect(result?.preferences.theme).toBe("dark");
    expect(result?.preferences.accentColor).toBe("#000000");
    expect(result?.preferences.languageCode).toBe("en"); // default
    expect(result?.notifications.pushEnabled).toBe(true); // default
  });
});

describe("settingsService.syncPreferences / syncNotifications", () => {
  it("syncPreferences maps camelCase prefs to snake_case columns", async () => {
    let captured: any;
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      upsert: (payload: unknown) => {
        captured = payload;
        return Promise.resolve({ error: null });
      },
    }));

    await settingsService.syncPreferences("u-1", {
      theme: "dark",
      accentColor: "#123456",
      useAmoledDark: true,
      reduceAnimations: false,
      languageCode: "hi",
      hasAgreedToTerms: true,
    });

    expect(captured).toMatchObject({
      user_id: "u-1",
      theme: "dark",
      accent_color: "#123456",
      use_amoled_dark: true,
      language_code: "hi",
      has_agreed_to_terms: true,
    });
  });

  it("syncNotifications throws on a Supabase error", async () => {
    setTableResult("notification_preferences", { error: { message: "rls" } });

    await expect(
      settingsService.syncNotifications("u-1", {
        pushEnabled: true, soundEnabled: true, vibrationEnabled: true, promotions: false,
        jobAlerts: true, applicationUpdates: true, messageAlerts: true, newsUpdates: false,
      })
    ).rejects.toThrow("rls");
  });
});

describe("settingsService.getBlockedUsers", () => {
  it("maps the embedded profile and drops rows with no profile", async () => {
    setTableResult("blocked_users", {
      data: [
        { blocked_at: "2025-06-01", blocked: { id: "b-1", full_name: "Spammer", avatar_url: null } },
        { blocked_at: "2025-05-01", blocked: null },
      ],
    });

    const blocked = await settingsService.getBlockedUsers("u-1");

    expect(blocked).toEqual([{ id: "b-1", fullName: "Spammer", avatarUrl: null, blockedAt: "2025-06-01" }]);
  });

  it("returns an empty list when the table cannot be read", async () => {
    setTableResult("blocked_users", { error: { message: "no table" } });
    expect(await settingsService.getBlockedUsers("u-1")).toEqual([]);
  });
});

describe("settingsService.unblockUser", () => {
  it("throws a friendly error when the delete fails", async () => {
    setTableResult("blocked_users", { error: { message: "rls" } });
    await expect(settingsService.unblockUser("u-1", "b-1")).rejects.toThrow("Couldn't unblock this user: rls");
  });
});

describe("settingsService cache + account", () => {
  it("getCacheSizeMB reports the on-device cache size in MB", async () => {
    expect(await settingsService.getCacheSizeMB()).toBe(5);
  });

  it("clearCache deletes every entry in the cache directory", async () => {
    const FileSystem = require("expo-file-system/legacy");
    await settingsService.clearCache();
    expect(FileSystem.deleteAsync).toHaveBeenCalledTimes(2);
  });

  it("deleteAccount invokes the delete-account Edge Function", async () => {
    setFunctionResult("delete-account", { data: {} });
    await settingsService.deleteAccount();
    expect(supabase.functions.invoke).toHaveBeenCalledWith("delete-account", { body: {} });
  });

  it("deleteAccount throws when the Edge Function errors", async () => {
    setFunctionResult("delete-account", { error: { message: "still has open orders" } });
    await expect(settingsService.deleteAccount()).rejects.toThrow("still has open orders");
  });
});

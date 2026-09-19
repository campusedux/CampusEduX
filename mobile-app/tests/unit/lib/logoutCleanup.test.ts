jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("@/lib/storage", () => ({
  clearCachedProfile: jest.fn(() => Promise.resolve()),
  secureStorage: {},
  STORAGE_KEYS: {},
}));

import { performLogoutCleanup } from "@/lib/logoutCleanup";
import { queryClient, userScopedKey } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import { useJobFilterStore } from "@/store/jobFilterStore";
import { useProjectFilterStore } from "@/store/projectFilterStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useBuilderStore } from "@/customProjects/builderStore";
import { clearCachedProfile } from "@/lib/storage";
import { DEFAULT_JOB_FILTERS, DEFAULT_PROJECT_FILTERS } from "@/types";

describe("performLogoutCleanup", () => {
  it("wipes every per-user client store and the query cache", async () => {
    queryClient.setQueryData(["wallet", "summary", "user-a"], { balance: 999 });
    useAuthStore.getState().setUser({ id: "user-a" } as never);
    useAuthStore.getState().setRecoveringPassword(true);
    useBuilderStore.getState().patch({ title: "secret", projectType: "academic" as never });
    useJobFilterStore.getState().setFilters({ ...DEFAULT_JOB_FILTERS, workMode: "Remote" } as never);
    useProjectFilterStore.getState().setFilters({ ...DEFAULT_PROJECT_FILTERS, sortBy: "price" } as never);
    useSettingsStore.getState().hydrateFromServer(
      { ...useSettingsStore.getState().preferences, theme: "dark", hasAgreedToTerms: true },
      { ...useSettingsStore.getState().notifications, pushEnabled: false }
    );

    await performLogoutCleanup();

    expect(queryClient.getQueryData(["wallet", "summary", "user-a"])).toBeUndefined();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isRecoveringPassword).toBe(false);
    expect(useBuilderStore.getState().config.title).toBe("");
    expect(useBuilderStore.getState().config.projectType).toBeNull();
    expect(useJobFilterStore.getState().filters).toEqual(DEFAULT_JOB_FILTERS);
    expect(useProjectFilterStore.getState().filters).toEqual(DEFAULT_PROJECT_FILTERS);
    const settings = useSettingsStore.getState();
    expect(settings.hasHydratedFromServer).toBe(false);
    expect(settings.preferences.hasAgreedToTerms).toBe(false);
    expect(settings.notifications.pushEnabled).toBe(true);
    expect(settings.preferences.theme).toBe("dark"); // device-level pref kept
    expect(clearCachedProfile).toHaveBeenCalled();
  });

  it("is idempotent and survives a failing cached-profile clear", async () => {
    (clearCachedProfile as jest.Mock).mockRejectedValueOnce(new Error("disk"));
    await expect(performLogoutCleanup()).resolves.toBeUndefined();
    await expect(performLogoutCleanup()).resolves.toBeUndefined();
  });
});

describe("userScopedKey", () => {
  it("keeps the base key as a prefix and separates users", () => {
    const a = userScopedKey(["wallet", "summary"] as const, "a");
    const b = userScopedKey(["wallet", "summary"] as const, "b");
    expect(a).toEqual(["wallet", "summary", "a"]);
    expect(a).not.toEqual(b);
    expect(userScopedKey(["x"] as const, undefined)).toEqual(["x", "anon"]);
  });

  it("invalidating the unscoped prefix still hits the scoped entry", () => {
    queryClient.setQueryData(userScopedKey(["jobs", "saved"] as const, "a"), [1]);
    queryClient.invalidateQueries({ queryKey: ["jobs", "saved"] });
    expect(queryClient.getQueryState(["jobs", "saved", "a"])?.isInvalidated).toBe(true);
    queryClient.clear();
  });
});

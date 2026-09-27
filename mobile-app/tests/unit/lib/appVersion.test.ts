const mockConstants: { expoConfig: { version?: string } | null } = { expoConfig: null };
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockConstants.expoConfig;
    },
  },
}));

import { compareVersions, currentAppVersion, isUpdateRequired, parseVersion } from "@/lib/appVersion";

describe("appVersion", () => {
  it("parses only x.y.z", () => {
    expect(parseVersion("1.2.3")).toEqual([1, 2, 3]);
    expect(parseVersion("1.2")).toBeNull();
    expect(parseVersion("1.2.3-beta")).toBeNull();
    expect(parseVersion(null)).toBeNull();
  });

  it("compares numerically, not as strings", () => {
    expect(compareVersions("1.10.0", "1.9.9")).toBe(1);
    expect(compareVersions("0.1.0", "0.1.0")).toBe(0);
    expect(compareVersions("0.9.0", "1.0.0")).toBe(-1);
  });

  it("requires an update only when the installed version is strictly lower", () => {
    expect(isUpdateRequired("0.1.0", "0.2.0")).toBe(true);
    expect(isUpdateRequired("0.2.0", "0.2.0")).toBe(false);
    expect(isUpdateRequired("1.0.0", "0.0.0")).toBe(false);
  });

  it("fails open when either version is missing or malformed", () => {
    expect(isUpdateRequired("0.1.0", null)).toBe(false);
    expect(isUpdateRequired(null, "9.9.9")).toBe(false);
    expect(isUpdateRequired("0.1.0", "garbage")).toBe(false);
  });
});

describe("currentAppVersion", () => {
  it("reads Constants.expoConfig.version (app.json expo.version, embedded in every build)", () => {
    mockConstants.expoConfig = { version: "0.1.0" };
    expect(currentAppVersion()).toBe("0.1.0");
  });

  it("is null when the config is unavailable, so the gate fails open", () => {
    mockConstants.expoConfig = null;
    expect(currentAppVersion()).toBeNull();
    expect(isUpdateRequired(currentAppVersion(), "9.9.9")).toBe(false);
  });
});

import { compareVersions, isUpdateRequired, parseVersion } from "@/lib/appVersion";

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

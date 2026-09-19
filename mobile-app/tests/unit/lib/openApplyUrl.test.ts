jest.mock("react-native", () => ({
  Linking: { openURL: jest.fn(() => Promise.resolve()), canOpenURL: jest.fn(() => Promise.resolve(true)) },
  Platform: { OS: "web" },
  Alert: { alert: jest.fn() },
}));

import { openApplyUrl, openHttpUrl, toHttpUrl } from "@/lib/openApplyUrl";

import { Linking, Platform } from "react-native";
const mockOpen = Linking.openURL as jest.Mock;
const mockCan = Linking.canOpenURL as jest.Mock;
const mockPlatform = Platform as { OS: string };

beforeEach(() => {
  mockOpen.mockClear();
  mockCan.mockClear();
  mockPlatform.OS = "web";
  (globalThis as any).window = { alert: jest.fn() };
});

describe("toHttpUrl (MOB-25)", () => {
  it("prefixes bare hosts and keeps http(s)", () => {
    expect(toHttpUrl("www.acme.com")).toBe("https://www.acme.com");
    expect(toHttpUrl(" https://acme.com/x ")).toBe("https://acme.com/x");
    expect(toHttpUrl("acme.com:8080/a")).toBe("https://acme.com:8080/a");
  });
  it("rejects other schemes and empties", () => {
    expect(toHttpUrl("javascript:alert(1)")).toBeNull();
    expect(toHttpUrl("data:text/html,x")).toBeNull();
    expect(toHttpUrl("")).toBeNull();
    expect(toHttpUrl(null)).toBeNull();
  });
});

describe("openHttpUrl", () => {
  it("returns false for invalid links and never throws when openURL rejects", async () => {
    expect(await openHttpUrl("javascript:1")).toBe(false);
    mockOpen.mockRejectedValueOnce(new Error("x") as never);
    expect(await openHttpUrl("acme.com")).toBe(false);
  });
});

describe("openApplyUrl (MOB-24)", () => {
  it("on web opens synchronously without awaiting canOpenURL", async () => {
    const p = openApplyUrl("https://jobs.acme.com/1");
    expect(mockOpen).toHaveBeenCalledTimes(1); // called before any await resolved
    await p;
    expect(mockCan).not.toHaveBeenCalled();
  });
  it("on native still checks canOpenURL first", async () => {
    mockPlatform.OS = "android";
    await openApplyUrl("https://jobs.acme.com/1");
    expect(mockCan).toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalled();
  });
  it("blocks non-http schemes", async () => {
    await openApplyUrl("javascript:alert(1)");
    expect(mockOpen).not.toHaveBeenCalled();
  });
});

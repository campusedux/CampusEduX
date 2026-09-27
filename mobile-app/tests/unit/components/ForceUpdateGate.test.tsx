import React from "react";
import { Linking, Text } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockGetMin = jest.fn();
let mockCurrent: string | null = "0.1.0";
const mockContact = { STORE_URL: "https://play.google.com/store/apps/details?id=com.campusedux.app" };
jest.mock("@/constants/contact", () => ({
  get STORE_URL() {
    return mockContact.STORE_URL;
  },
}));
jest.mock("@/services/appConfig.service", () => ({
  appConfigService: { getMinSupportedVersion: () => mockGetMin() },
}));
jest.mock("@/lib/appVersion", () => {
  const actual = jest.requireActual("@/lib/appVersion");
  return { ...actual, currentAppVersion: () => mockCurrent };
});

import { ForceUpdateGate } from "@/components/ForceUpdateGate";

const mounted: { r: TestRenderer.ReactTestRenderer; client: QueryClient }[] = [];

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(
      <QueryClientProvider client={client}>
        <ForceUpdateGate>
          <Text testID="app">app</Text>
        </ForceUpdateGate>
      </QueryClientProvider>
    );
  });
  await act(async () => {
    await new Promise((res) => setTimeout(res, 0));
  });
  mounted.push({ r, client });
  return r;
}

// The gate refetches every 30 minutes; unmount + clear so no timer keeps Jest alive.
afterEach(() => {
  for (const m of mounted.splice(0)) {
    act(() => m.r.unmount());
    m.client.clear();
  }
  jest.restoreAllMocks();
});

const has = (r: TestRenderer.ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;

beforeEach(() => {
  mockGetMin.mockReset();
  mockCurrent = "0.1.0";
  mockContact.STORE_URL = "https://play.google.com/store/apps/details?id=com.campusedux.app";
});

describe("ForceUpdateGate", () => {
  it("blocks an older build and links to the Play Store", async () => {
    mockGetMin.mockResolvedValue("0.2.0");
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const r = await render();
    expect(has(r, "force-update-screen")).toBe(true);
    expect(has(r, "app")).toBe(false);
    const button = r.root.findAll((n) => typeof n.props.onPress === "function")[0];
    await act(async () => {
      await button.props.onPress();
    });
    expect(openURL).toHaveBeenCalledWith("https://play.google.com/store/apps/details?id=com.campusedux.app");
  });

  it("still blocks, without a store button, while STORE_URL is unset (app not published)", async () => {
    mockGetMin.mockResolvedValue("0.2.0");
    mockContact.STORE_URL = "";
    const r = await render();
    expect(has(r, "force-update-screen")).toBe(true);
    expect(r.root.findAll((n) => typeof n.props.onPress === "function")).toHaveLength(0);
  });

  it("renders the app when the build is current", async () => {
    mockGetMin.mockResolvedValue("0.1.0");
    const r = await render();
    expect(has(r, "app")).toBe(true);
    expect(has(r, "force-update-screen")).toBe(false);
  });

  it("fails open when the minimum cannot be read", async () => {
    mockGetMin.mockResolvedValue(null);
    const r = await render();
    expect(has(r, "app")).toBe(true);
  });
});

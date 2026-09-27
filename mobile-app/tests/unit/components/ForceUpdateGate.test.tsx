import React from "react";
import { Linking, Text } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockGetMin = jest.fn();
let mockCurrent: string | null = "0.1.0";
jest.mock("@/services/appConfig.service", () => ({
  appConfigService: { getMinSupportedVersion: () => mockGetMin() },
}));
jest.mock("@/lib/appVersion", () => {
  const actual = jest.requireActual("@/lib/appVersion");
  return { ...actual, currentAppVersion: () => mockCurrent };
});

import { ForceUpdateGate } from "@/components/ForceUpdateGate";

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
  return r;
}

const has = (r: TestRenderer.ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;

beforeEach(() => {
  mockGetMin.mockReset();
  mockCurrent = "0.1.0";
});

describe("ForceUpdateGate", () => {
  it("blocks an older build and links to the Play Store", async () => {
    mockGetMin.mockResolvedValue("0.2.0");
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(false);
    const r = await render();
    expect(has(r, "force-update-screen")).toBe(true);
    expect(has(r, "app")).toBe(false);
    const button = r.root.findAll((n) => typeof n.props.onPress === "function")[0];
    await act(async () => {
      await button.props.onPress();
    });
    expect(openURL).toHaveBeenCalledWith("https://play.google.com/store/apps/details?id=com.campusedux.app");
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

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), popTo: jest.fn() }),
}));

jest.mock("@/hooks/useCustomProjects", () => ({
  useCustomPricing: () => ({
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    data: {
      pricing: [
        { projectType: "academic", projectLevel: "standard", basePrice: 7999, tokenAmount: 1500, pricingVersion: 1 },
        { projectType: "academic", projectLevel: "advanced", basePrice: 9999, tokenAmount: 1500, pricingVersion: 1 },
        { projectType: "personal", projectLevel: "standard", basePrice: 15999, tokenAmount: 3000, pricingVersion: 1 },
        { projectType: "business", projectLevel: "standard", basePrice: 29999, tokenAmount: 6000, pricingVersion: 1 },
      ],
      platformPricing: [],
    },
  }),
  useCustomFeatures: () => ({ isLoading: false, isError: false, refetch: jest.fn(), data: [] }),
}));

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BuilderTypeScreen } from "@/customProjects/BuilderTypeScreen";
import { useBuilderStore, EMPTY_BUILDER_CONFIG } from "@/customProjects/builderStore";

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<SafeAreaProvider initialMetrics={METRICS}>{el}</SafeAreaProvider>);
  });
  return r;
}

const allText = (r: TestRenderer.ReactTestRenderer) =>
  r.root
    .findAllByType(Text)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.join("") : n.props.children))
    .filter((c) => typeof c === "string") as string[];

const cards = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.accessibilityRole === "radio" && typeof n.props.onPress === "function");

const continueBtn = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.label === "Continue to level")[0];

beforeEach(() => {
  mockNavigate.mockClear();
  act(() => useBuilderStore.setState({ config: EMPTY_BUILDER_CONFIG, hydratedFromDraft: false, previews: {} }));
});

describe("Step 1 — Project type", () => {
  it("renders one card per project type with its description", () => {
    const r = render(<BuilderTypeScreen />);
    expect(cards(r)).toHaveLength(3);
    expect(allText(r)).toEqual(expect.arrayContaining(["Academic Project", "Personal Project", "Business Project"]));
  });

  it("shows 'Starting from' from live pricing (lowest level) and the fixed token per type", () => {
    const blob = allText(render(<BuilderTypeScreen />)).join(" | ");
    expect(blob).toContain("Starting from ₹7,999");
    expect(blob).toContain("Starting from ₹15,999");
    expect(blob).toContain("Starting from ₹29,999");
    expect(blob).toContain("Token ₹1,500 to start");
    expect(blob).toContain("Token ₹3,000 to start");
    expect(blob).toContain("Token ₹6,000 to start");
  });

  it("shows the step name in the header", () => {
    expect(allText(render(<BuilderTypeScreen />)).join(" | ")).toContain("Step 1 of 8 · Project type");
  });

  it("tapping a card selects that type in the builder store", () => {
    const r = render(<BuilderTypeScreen />);
    act(() => cards(r)[1].props.onPress());
    expect(useBuilderStore.getState().config.projectType).toBe("personal");
  });

  it("Continue is disabled (with a reason) until a type is picked, then goes to BuilderLevel", () => {
    const r = render(<BuilderTypeScreen />);
    expect(continueBtn(r).props.disabled).toBe(true);
    expect(allText(r)).toContain("Choose a project type to continue.");

    act(() => cards(r)[0].props.onPress());
    const btn = continueBtn(r);
    expect(btn.props.disabled).toBeFalsy();
    act(() => btn.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith("BuilderLevel");
  });
});

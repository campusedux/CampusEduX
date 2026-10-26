jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), popTo: jest.fn() }),
}));

const FEATURES = [
  { id: "login", name: "Secure login", description: "Sign in.", category: "Authentication", projectTypes: ["academic"], projectLevels: ["standard", "advanced"], price: 0, sortOrder: 1, includedInLevels: ["academic:standard", "academic:advanced"], dependencies: [], conflicts: [] },
  { id: "search-filters", name: "Filters", description: "Filter lists.", category: "Search", projectTypes: ["academic"], projectLevels: ["standard", "advanced"], price: 800, sortOrder: 2, includedInLevels: ["academic:advanced"], dependencies: [], conflicts: [] },
  { id: "auth-google", name: "Google login", description: "One-tap sign in.", category: "Authentication", projectTypes: ["academic"], projectLevels: ["standard", "advanced"], price: 800, sortOrder: 3, includedInLevels: [], dependencies: ["login"], conflicts: [] },
  { id: "pay-razorpay", name: "Razorpay", description: "Take payments.", category: "Payments", projectTypes: ["academic"], projectLevels: ["advanced"], price: 2000, sortOrder: 4, includedInLevels: [], dependencies: [], conflicts: [] },
];

jest.mock("@/hooks/useCustomProjects", () => ({
  useCustomPricing: () => ({
    isLoading: false, isError: false, refetch: jest.fn(),
    data: {
      pricing: [
        { projectType: "academic", projectLevel: "standard", basePrice: 1500, tokenAmount: 1500, pricingVersion: 1 },
        { projectType: "academic", projectLevel: "advanced", basePrice: 1500, tokenAmount: 1500, pricingVersion: 1 },
      ],
      platformPricing: [{ platform: "web", label: "Web", charge: 0, sortOrder: 1 }],
    },
  }),
  useCustomFeatures: () => ({ isLoading: false, isError: false, refetch: jest.fn(), data: FEATURES }),
  useCustomProjectSubmit: () => ({ submit: jest.fn(), isProcessing: false }),
}));

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BuilderFeaturesScreen } from "@/customProjects/BuilderFeaturesScreen";
import { BuilderEstimateScreen } from "@/customProjects/BuilderEstimateScreen";
import { useBuilderStore, EMPTY_BUILDER_CONFIG } from "@/customProjects/builderStore";

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<SafeAreaProvider initialMetrics={METRICS}>{el}</SafeAreaProvider>);
  });
  return r;
}
const text = (r: TestRenderer.ReactTestRenderer) =>
  r.root
    .findAllByType(Text)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.join("") : n.props.children))
    .filter((c) => typeof c === "string")
    .join(" | ");
const pressables = (r: TestRenderer.ReactTestRenderer, label: RegExp) =>
  r.root.findAll((n) => typeof n.props.onPress === "function" && label.test(String(n.props.accessibilityLabel ?? "")));

const setConfig = (level: "standard" | "advanced", featureIds: string[] = []) =>
  act(() =>
    useBuilderStore.setState({
      config: { ...EMPTY_BUILDER_CONFIG, projectType: "academic", projectLevel: level, platform: "web", title: "Hotel Management System", featureIds },
      previews: {},
    })
  );

beforeEach(() => {
  mockNavigate.mockClear();
});

describe("new academic mentoring flow", () => {
  it("shows guidance instead of implementation features or add-on controls", () => {
    setConfig("standard", ["auth-google", "search-filters"]);
    const r = render(<BuilderFeaturesScreen />);
    expect(text(r)).toContain("Mentoring scope");
    expect(text(r)).toContain("Code review, debugging, architecture guidance");
    expect(pressables(r, /^Add Google login/)).toHaveLength(0);
    expect(useBuilderStore.getState().config.featureIds).toEqual([]);
  });

  it("quotes mentoring without implementation add-ons or delivery promises", () => {
    setConfig("standard", ["auth-google"]);
    const estimate = text(render(<BuilderEstimateScreen />));
    expect(estimate).toContain("₹1,500");
    expect(estimate).toContain("You author any assessed deliverables");
    expect(estimate).toContain("Mentoring and feedback");
    expect(estimate).not.toContain("You receive the finished project");
    expect(estimate).not.toContain("Add-ons (1)");
  });
});

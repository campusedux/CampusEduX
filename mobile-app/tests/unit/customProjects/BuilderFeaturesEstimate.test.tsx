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
        { projectType: "academic", projectLevel: "standard", basePrice: 7999, tokenAmount: 1500, pricingVersion: 1 },
        { projectType: "academic", projectLevel: "advanced", basePrice: 9999, tokenAmount: 1500, pricingVersion: 1 },
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

describe("Step 5 — Features", () => {
  it("lists included features read-only and keeps them out of the add-on cards", () => {
    setConfig("standard");
    const r = render(<BuilderFeaturesScreen />);
    const t = text(r);
    expect(t).toContain("Included in your project");
    expect(t).toContain("Secure login");
    expect(pressables(r, /^(Add|Remove) Secure login/)).toHaveLength(0); // no toggle for included
    expect(pressables(r, /^Add Google login/)).toHaveLength(1);
    expect(pressables(r, /^Add Filters/)).toHaveLength(1); // paid at Standard
  });

  it("Standard -> Advanced moves Filters into Included and unlocks/locks correctly", () => {
    setConfig("advanced");
    const r = render(<BuilderFeaturesScreen />);
    expect(pressables(r, /^Add Filters/)).toHaveLength(0);
    expect(text(r)).toContain("Filters");
    expect(text(r)).toContain("2 features included");

    setConfig("standard");
    const s = render(<BuilderFeaturesScreen />);
    // Razorpay is Advanced-only: locked with a switch-level link, not an Add button
    expect(pressables(s, /^Add Razorpay/)).toHaveLength(0);
    expect(pressables(s, /Razorpay is available in Advanced/)).toHaveLength(1);
  });

  it("adding an add-on updates the live footer price using the Academic override", () => {
    setConfig("standard");
    const r = render(<BuilderFeaturesScreen />);
    expect(text(r)).toContain("₹7,999");
    act(() => pressables(r, /^Add Google login/)[0].props.onPress());
    expect(useBuilderStore.getState().config.featureIds).toEqual(["auth-google"]);
    // auth-google academic override = ₹50 (not the 800 catalog price)
    expect(text(r)).toContain("Base ₹7,999 + Add-ons ₹50 = ₹8,049");
  });

  it("prunes a saved selection that is now included for the level", () => {
    setConfig("advanced", ["search-filters", "auth-google"]);
    render(<BuilderFeaturesScreen />);
    expect(useBuilderStore.getState().config.featureIds).toEqual(["auth-google"]);
  });
});

describe("Step 7 — Estimate", () => {
  it("shows the same total as the features footer, with a receipt and token/balance", () => {
    setConfig("standard", ["auth-google"]);
    const feat = text(render(<BuilderFeaturesScreen />));
    const est = text(render(<BuilderEstimateScreen />));
    expect(feat).toContain("₹8,049");
    expect(est).toContain("₹8,049");
    expect(est).toContain("Base price (Standard)");
    expect(est).toContain("Included features (1)");
    expect(est).toContain("Add-ons (1)");
    expect(est).toContain("Platform charges");
    expect(est).toContain("Estimated project price");
    expect(est).toContain("₹1,500"); // token
    expect(est).toContain("₹6,549"); // balance = 8049 - 1500
  });

  it("gates the payment button behind the acknowledgement checkbox", () => {
    setConfig("standard");
    const r = render(<BuilderEstimateScreen />);
    const btn = () => r.root.findAll((n) => typeof n.props.label === "string" && n.props.label.startsWith("Continue to payment"))[0];
    expect(btn().props.label).toBe("Continue to payment — ₹1,500");
    expect(btn().props.disabled).toBe(true);
    act(() => r.root.findAll((n) => n.props.accessibilityRole === "checkbox")[0].props.onPress());
    expect(btn().props.disabled).toBeFalsy();
  });

  it("shows the price-may-change note ONLY when custom requirements exist", () => {
    setConfig("standard");
    expect(text(render(<BuilderEstimateScreen />))).not.toContain("custom requirements will be reviewed");
    act(() => useBuilderStore.getState().addRequirement("Bills in Hindi"));
    expect(text(render(<BuilderEstimateScreen />))).toContain("Your custom requirements will be reviewed; if they change the price, we'll confirm with you before starting work.");
  });
});

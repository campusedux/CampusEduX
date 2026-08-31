jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { BuilderTypeScreen } from "@/customProjects/BuilderTypeScreen";
import { useBuilderStore, EMPTY_BUILDER_CONFIG } from "@/customProjects/builderStore";

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r;
}

const allText = (r: TestRenderer.ReactTestRenderer) =>
  r.root
    .findAllByType(Text)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.join("") : n.props.children))
    .filter((c) => typeof c === "string") as string[];

/** the three project-type cards: a Pressable carrying onPress + an object style */
const cards = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll(
    (n) =>
      typeof n.props.onPress === "function" &&
      !!n.props.style &&
      typeof n.props.style === "object" &&
      !Array.isArray(n.props.style),
  );

/** the sticky-footer primary action */
const continueBtn = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAll((n) => n.props.label === "Continue")[0];

beforeEach(() => {
  mockNavigate.mockClear();
  act(() => useBuilderStore.setState({ config: EMPTY_BUILDER_CONFIG, hydratedFromDraft: false }));
});

describe("Step 1 — Choose a project type (UI-only trim)", () => {
  it("renders exactly 3 cards, one per project name", () => {
    const r = render(<BuilderTypeScreen />);
    expect(cards(r)).toHaveLength(3);
    expect(allText(r)).toEqual(
      expect.arrayContaining(["Academic Project", "Personal Project", "Business Project"]),
    );
  });

  it("shows NO price, token, ₹ amount or description text anywhere", () => {
    const blob = allText(render(<BuilderTypeScreen />)).join(" | ");
    expect(blob).not.toMatch(/₹/);
    expect(blob).not.toMatch(/token/i);
    expect(blob).not.toMatch(/\bbase\b/i);
    expect(blob).not.toMatch(/price/i);
    expect(blob).not.toMatch(/estimate/i);
    expect(blob).not.toMatch(/final-year projects/i);
    expect(blob).not.toMatch(/portfolio/i);
    expect(blob).not.toMatch(/enterprise-grade/i);
    expect(blob).not.toMatch(/base price range and the project token/i);
  });

  it("each card still renders a radio indicator", () => {
    const r = render(<BuilderTypeScreen />);
    const radios = r.root.findAll(
      (n) => n.type === Text && /radio-button-(on|off)/.test(String(n.props.children)),
    );
    expect(radios.length).toBeGreaterThanOrEqual(3);
  });

  it("tapping a card selects that type in the builder store (selection logic intact)", () => {
    const r = render(<BuilderTypeScreen />);
    act(() => cards(r)[1].props.onPress()); // Personal
    expect(useBuilderStore.getState().config.projectType).toBe("personal");

    const r2 = render(<BuilderTypeScreen />);
    act(() => cards(r2)[2].props.onPress()); // Business
    expect(useBuilderStore.getState().config.projectType).toBe("business");
  });

  it("Continue is disabled until a type is picked, then navigates to BuilderLevel", () => {
    const r = render(<BuilderTypeScreen />);
    expect(continueBtn(r).props.disabled).toBe(true);

    act(() => cards(r)[0].props.onPress()); // Academic
    const btn = continueBtn(r);
    expect(btn.props.disabled).toBeFalsy();

    act(() => btn.props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith("BuilderLevel");
  });
});

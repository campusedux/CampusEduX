jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack, getParent: () => ({ navigate: jest.fn() }) }),
}));

const mockCategories = jest.fn();
jest.mock("@/hooks/useHomeData", () => ({
  useCategories: () => mockCategories(),
}));

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { ProjectListTemplate } from "@/components/cards/ProjectListTemplate";
import { CategoriesScreen } from "@/home/CategoriesScreen";
import { SkeletonList } from "@/components/ui";

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r;
}
const texts = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map((t) => (Array.isArray(t.props.children) ? t.props.children.join("") : t.props.children));

const q = (over: object) => ({ data: undefined, isLoading: false, isError: false, refetch: jest.fn(), ...over }) as any;

describe("ProjectListTemplate (Trending / Premium / Best Sellers / New Arrivals)", () => {
  it("shows a skeleton (not a spinner) while loading", () => {
    const r = render(<ProjectListTemplate title="Trending Projects" query={q({ isLoading: true })} emptyLabel="none" />);
    expect(r.root.findAllByType(SkeletonList)).toHaveLength(1);
    act(() => r.unmount());
  });

  it("shows the friendly empty state and the header title", () => {
    const r = render(<ProjectListTemplate title="Premium Projects" query={q({ data: [] })} emptyLabel="No premium projects yet" />);
    expect(texts(r)).toEqual(expect.arrayContaining(["Premium Projects", "No premium projects yet"]));
  });

  it("shows retry on error and the back button goes back", () => {
    const refetch = jest.fn();
    const r = render(<ProjectListTemplate title="Best Sellers" query={q({ isError: true, refetch })} emptyLabel="none" />);
    const retry = r.root.findAllByType(Text).find((t) => t.props.children === "Tap to retry")!;
    act(() => retry.props.onPress());
    expect(refetch).toHaveBeenCalled();
    const back = r.root.find((n) => n.props.accessibilityLabel === "Go back" && typeof n.props.onPress === "function");
    act(() => back.props.onPress());
    expect(mockGoBack).toHaveBeenCalled();
  });
});

describe("CategoriesScreen", () => {
  it("renders category tiles with real counts and a real subtitle", () => {
    mockCategories.mockReturnValue(
      q({ data: [{ id: "1", name: "Web Dev", icon: "globe-outline", projectCount: 12 }, { id: "2", name: "AI", icon: "sparkles-outline", projectCount: 5 }] }),
    );
    const r = render(<CategoriesScreen />);
    expect(texts(r)).toEqual(expect.arrayContaining(["All Categories", "2 categories", "Web Dev", "12+ Projects", "AI", "5+ Projects"]));
  });

  it("shows empty state when there are none", () => {
    mockCategories.mockReturnValue(q({ data: [] }));
    expect(texts(render(<CategoriesScreen />))).toContain("No categories yet");
  });
});

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const mockMutate = jest.fn();
const baseProject = {
  categoryId: "c", categoryName: "Web", techStack: ["react"], price: 499, rating: 4, reviewCount: 2,
  thumbnailUrl: null, isPremium: false, isBestSeller: false, salesCount: 1, createdAt: "2025-01-01",
};
jest.mock("@/hooks/useProjects", () => ({
  useWishlist: () => ({
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    data: [
      { ...baseProject, id: "p-live", title: "Live Project", available: true },
      { ...baseProject, id: "p-gone", title: "No longer available", price: 0, techStack: [], available: false },
    ],
  }),
  useToggleWishlist: () => ({ mutate: mockMutate }),
}));

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WishlistScreen } from "@/project/WishlistScreen";

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function render() {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <WishlistScreen />
      </SafeAreaProvider>
    );
  });
  return r;
}

describe("WishlistScreen tombstones (7c)", () => {
  it("shows an unpublished project as a greyed 'No longer available' row that is not openable but removable", () => {
    const r = render();
    const texts = r.root.findAllByType(Text).map((n) => (Array.isArray(n.props.children) ? n.props.children.join("") : n.props.children));
    expect(texts).toContain("Live Project");
    expect(texts).toContain("No longer available");

    const tomb = r.root.findByProps({ testID: "wishlist-unavailable" });
    expect(tomb.props.accessibilityState).toEqual({ disabled: true });
    expect(tomb.props.onPress).toBeUndefined();

    act(() => {
      r.root.findByProps({ testID: "wishlist-remove" }).props.onPress();
    });
    expect(mockMutate).toHaveBeenCalledWith(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

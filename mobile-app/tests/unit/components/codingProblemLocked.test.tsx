import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@/theme/fonts", () => ({ useLearningFonts: () => true }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: ({ children }: any) => children }));
jest.mock("expo-haptics", () => ({}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn(), getParent: jest.fn(), navigate: jest.fn() }),
  useRoute: () => ({ params: { slug: "two-sum", title: "Two Sum" } }),
}));
jest.mock("@/hooks/useLearning", () => ({
  useCodingProblem: () => ({
    data: { locked: true, problem: { title: "Two Sum", difficulty: "Easy", description: "", supported_languages: [], is_premium: true } },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

import { LearningCodingProblemScreen } from "@/learning/LearningCodingProblemScreen";
import { useSettingsStore } from "@/store/settingsStore";
import { AMOLED_COLORS, DARK_COLORS, LIGHT_COLORS } from "@/theme/colors";

const setTheme = (theme: "light" | "dark", amoled = false) =>
  act(() => {
    useSettingsStore.setState((s) => ({ preferences: { ...s.preferences, theme, useAmoledDark: amoled } }));
  });
afterEach(() => setTheme("light"));

it.each([
  ["light", "light", false, LIGHT_COLORS],
  ["dark", "dark", false, DARK_COLORS],
  ["amoled", "dark", true, AMOLED_COLORS],
] as const)("Premium-locked box follows the %s theme (no fixed amber classes)", (_n, theme, amoled, c) => {
  setTheme(theme, amoled);
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<LearningCodingProblemScreen />);
  });
  const json = JSON.stringify(r.toJSON());
  expect(json).toContain("Premium problem");
  expect(json).toContain(c.callout.warning.bg);
  expect(json).not.toMatch(/amber-(50|200|800|900)/);
  act(() => r.unmount());
});

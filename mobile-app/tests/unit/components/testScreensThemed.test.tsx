import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@/theme/fonts", () => ({ useLearningFonts: () => true }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: ({ children }: any) => children }));
jest.mock("expo-haptics", () => ({}));

const mockNav = { navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() };
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNav,
  useRoute: () => ({ params: { testId: "t1", attemptId: "a1" } }),
  CommonActions: { reset: (x: any) => x },
}));

const mockTest = { id: "t1", title: "Java Basics Quiz", questionCount: 2, durationMinutes: 10 };
const mockQuestions = [
  { id: "q1", questionText: "What is JVM?", options: ["A", "B"], marks: 1 },
  { id: "q2", questionText: "What is JDK?", options: ["C", "D"], marks: 1 },
];
jest.mock("@/hooks/usePlacement", () => ({
  useTestDetail: () => ({ data: mockTest, isLoading: false, isError: false, refetch: jest.fn() }),
  useTestQuestions: () => ({ data: mockQuestions, isLoading: false, isError: false, refetch: jest.fn() }),
  useSubmitTestAttempt: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useTestResult: () => ({ data: { attemptId: "a1", score: 1, totalMarks: 2, accuracyPercent: 50, correctCount: 1, incorrectCount: 1 }, isLoading: false, isError: false, refetch: jest.fn() }),
  usePerformanceAnalysis: () => ({
    data: { testsTaken: 2, overallAccuracyPercent: 60, averageScorePercent: 55, questionsAttempted: 20, trend: [{ label: "T1", scorePercent: 40 }], sectionScores: [{ section: "Core", scorePercent: 70 }] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

import { TestInstructionScreen } from "@/placement/TestInstructionScreen";
import { LiveTestScreen } from "@/placement/LiveTestScreen";
import { TestResultScreen } from "@/placement/TestResultScreen";
import { PerformanceAnalysisScreen } from "@/placement/PerformanceAnalysisScreen";
import { useSettingsStore } from "@/store/settingsStore";
import { AMOLED_COLORS, DARK_COLORS, LIGHT_COLORS } from "@/theme/colors";

const setTheme = (theme: "light" | "dark", amoled = false) =>
  act(() => {
    useSettingsStore.setState((s) => ({ preferences: { ...s.preferences, theme, useAmoledDark: amoled } }));
  });
afterEach(() => setTheme("light"));

const SCREENS: [string, React.ComponentType][] = [
  ["TestInstruction", TestInstructionScreen],
  ["LiveTest", LiveTestScreen],
  ["TestResult", TestResultScreen],
  ["PerformanceAnalysis", PerformanceAnalysisScreen],
];
const SCHEMES: [string, "light" | "dark", boolean, typeof LIGHT_COLORS][] = [
  ["light", "light", false, LIGHT_COLORS],
  ["dark", "dark", false, DARK_COLORS],
  ["amoled", "dark", true, AMOLED_COLORS],
];

describe.each(SCREENS)("%s", (_n, Comp) => {
  it.each(SCHEMES)("renders on the %s ground with no leftover light-mode hexes", (_s, theme, amoled, c) => {
    setTheme(theme, amoled);
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Comp />);
    });
    const json = JSON.stringify(r.toJSON());
    expect(json).toContain(c.bg);
    if (theme === "dark") {
      // the classic light palette must not leak onto a dark ground
      for (const light of ["#EEF0FF", "#F3F4F6", "#D1D5DB", "#111827", "#DCFCE7"]) expect(json.toUpperCase()).not.toContain(light);
    }
    act(() => r.unmount());
  });
});

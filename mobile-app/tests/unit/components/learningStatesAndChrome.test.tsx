import React from "react";
import { Text } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@/theme/fonts", () => ({ useLearningFonts: () => true }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: ({ children }: any) => children }));
jest.mock("expo-haptics", () => ({}));

const mockNav = { navigate: jest.fn(), goBack: jest.fn(), getParent: jest.fn() };
jest.mock("@react-navigation/native", () => ({ useNavigation: () => mockNav, useRoute: () => ({ params: {} }), DrawerActions: {} }));

let mockGrids: any;
jest.mock("@/hooks/useLearning", () => ({
  useLearningGrids: () => mockGrids,
  useLearningSearch: () => ({ data: [], isFetching: false, isError: false, refetch: jest.fn() }),
  useLearningTree: () => ({ data: undefined }),
  useLearningBookmarks: () => ({ data: new Set() }),
}));

import { Screen } from "@/components/ui";
import { ErrorBlock, EmptyBlock, StateFrame } from "@/components/learning/LearningStates";
import { LearningGridsScreen } from "@/learning/LearningGridsScreen";
import { useSettingsStore } from "@/store/settingsStore";
import { resolveScheme } from "@/theme/scheme";
import { AMOLED_COLORS, DARK_COLORS, LIGHT_COLORS } from "@/theme/colors";

const mounted: TestRenderer.ReactTestRenderer[] = [];
const render = (el: React.ReactElement) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  mounted.push(r);
  return r;
};
const setTheme = (theme: "light" | "dark" | "system", amoled = false) => {
  act(() => {
    useSettingsStore.setState((s) => ({ preferences: { ...s.preferences, theme, useAmoledDark: amoled } }));
  });
};
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((r) => r.unmount());
  });
  setTheme("light");
});
const dump = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());
const textOf = (r: TestRenderer.ReactTestRenderer): string => {
  const walk = (n: any): string => (n == null ? "" : typeof n === "string" ? n : Array.isArray(n) ? n.map(walk).join("") : walk(n.children));
  return walk(r.toJSON());
};
const press = (r: TestRenderer.ReactTestRenderer, label: string) => {
  const node = r.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === "function")[0];
  act(() => node.props.onPress());
};

it("resolveScheme: Light / Dark / System", () => {
  expect(resolveScheme("light", "dark")).toBe("light");
  expect(resolveScheme("dark", "light")).toBe("dark");
  expect(resolveScheme("system", "dark")).toBe("dark");
  expect(resolveScheme("system", "light")).toBe("light");
  expect(resolveScheme("system", null)).toBe("light");
  expect(resolveScheme(undefined, "dark")).toBe("light");
});

describe("Screen theming is opt-in (other screens are not put on a dark ground)", () => {
  it("themed Screen follows Light / Dark / AMOLED", () => {
    setTheme("light");
    expect(dump(render(<Screen themed><Text>x</Text></Screen>))).toContain(LIGHT_COLORS.bg);
    setTheme("dark");
    expect(dump(render(<Screen themed><Text>x</Text></Screen>))).toContain(DARK_COLORS.bg);
    setTheme("dark", true);
    expect(dump(render(<Screen themed><Text>x</Text></Screen>))).toContain(AMOLED_COLORS.bg);
    setTheme("dark");
    expect(dump(render(<Screen themed background="canvas"><Text>x</Text></Screen>))).toContain(DARK_COLORS.canvas);
  });

  it("a classic (un-themed) Screen never gets a dark ground, even in Dark mode", () => {
    setTheme("dark");
    const out = dump(render(<Screen><Text>x</Text></Screen>));
    expect(out).not.toContain(DARK_COLORS.bg);
    expect(out).not.toContain(DARK_COLORS.canvas);
  });

  it("in Light mode a themed Screen uses exactly the classic colours", () => {
    setTheme("light");
    expect(dump(render(<Screen themed><Text>x</Text></Screen>))).toContain("#FFFFFF");
    expect(dump(render(<Screen themed background="canvas"><Text>x</Text></Screen>))).toContain("#F5F6FB");
  });
});

describe("shared states", () => {
  it("ErrorBlock: consistent copy + Retry; no Retry without a handler", () => {
    const onRetry = jest.fn();
    const r = render(<ErrorBlock what="courses" onRetry={onRetry} />);
    expect(textOf(r)).toContain("Couldn't load courses");
    expect(textOf(r)).toContain("Check your connection and try again.");
    press(r, "Retry");
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(textOf(render(<ErrorBlock title="Search failed" />))).not.toContain("Retry");
  });

  it("EmptyBlock and StateFrame (back button + title)", () => {
    expect(textOf(render(<EmptyBlock emoji="🔍" title="No topics found" message="Try again" />))).toContain("No topics found");
    const onBack = jest.fn();
    const r = render(<StateFrame onBack={onBack} title="Java"><Text>child</Text></StateFrame>);
    expect(textOf(r)).toContain("Java");
    expect(textOf(r)).toContain("child");
    press(r, "Go back");
    expect(onBack).toHaveBeenCalled();
  });
});

describe("LearningGridsScreen states", () => {
  const grid = (o: any = {}) => ({ id: "g1", name: "Java Tutorial", slug: "java", description: "", icon: null, icon_url: null, cover_image_url: null, accent_color: null, is_featured: false, sort_order: 0, section_count: 2, topic_count: 12, grid_type: "content", is_premium: false, ...o });

  it("loading → skeleton", () => {
    mockGrids = { isLoading: true, isError: false, data: undefined, refetch: jest.fn() };
    expect(render(<LearningGridsScreen />).root.findAll((n) => n.props.accessibilityLabel === "Loading courses").length).toBeGreaterThan(0);
  });

  it("error → shared ErrorBlock with working Retry", () => {
    const refetch = jest.fn();
    mockGrids = { isLoading: false, isError: true, data: undefined, refetch };
    const r = render(<LearningGridsScreen />);
    expect(textOf(r)).toContain("Couldn't load learning resources");
    press(r, "Retry");
    expect(refetch).toHaveBeenCalled();
  });

  it("empty → friendly empty state", () => {
    mockGrids = { isLoading: false, isError: false, data: [], refetch: jest.fn() };
    expect(textOf(render(<LearningGridsScreen />))).toContain("No learning resources yet");
  });

  it("data → course cards navigate exactly as before", () => {
    mockGrids = { isLoading: false, isError: false, data: [grid()], refetch: jest.fn() };
    const r = render(<LearningGridsScreen />);
    expect(textOf(r)).toContain("Java Tutorial");
    const card = r.root.findAll((n) => typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.startsWith("Java Tutorial") && typeof n.props.onPress === "function")[0];
    act(() => card.props.onPress());
    expect(mockNav.navigate).toHaveBeenCalledWith("LearningGrid", { gridSlug: "java", gridName: "Java Tutorial" });
  });

  it("renders on a dark ground in Dark mode", () => {
    setTheme("dark");
    mockGrids = { isLoading: false, isError: false, data: [grid()], refetch: jest.fn() };
    expect(dump(render(<LearningGridsScreen />))).toContain(DARK_COLORS.canvas);
  });
});

import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@/theme/fonts", () => ({ useLearningFonts: () => true }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: ({ children }: any) => children }));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn() }));
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn().mockResolvedValue(undefined), notificationAsync: jest.fn().mockResolvedValue(undefined), NotificationFeedbackType: { Success: "success" } }));

const mockNav = { navigate: jest.fn(), replace: jest.fn(), goBack: jest.fn(), getParent: jest.fn(() => ({ navigate: jest.fn() })) };
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNav,
  useRoute: () => ({ params: { gridSlug: "java", topicSlug: "variables", topicTitle: "Variables" } }),
  DrawerActions: { openDrawer: jest.fn() },
}));

let mockTopic: any;
jest.mock("@/hooks/useLearning", () => ({
  useLearningTopic: () => ({ data: mockTopic, isLoading: false, isError: false, refetch: jest.fn() }),
  useLearningTree: () => ({ data: { grid: { id: "g", name: "Java", slug: "java", description: "", icon: null, icon_url: null, cover_image_url: null, accent_color: null }, sections: [{ id: "s1", name: "Basics", slug: "basics", description: "", topics: [] }, { id: "s2", name: "OOP", slug: "oop", description: "", topics: [{ id: "t9", title: "Classes", slug: "classes", short_description: "", is_premium: false }] }] } }),
  useLearningBookmarks: () => ({ data: new Set<string>() }),
  useToggleLearningBookmark: () => ({ mutate: jest.fn() }),
  useTopicPractice: () => ({ data: { mock_tests: [{ id: "m1", title: "Variables quiz", description: "", category: "", question_count: 10, duration_minutes: 10, difficulty: "easy", total_marks: 10, negative_marking: 0, is_premium: false }], coding_problems: [] } }),
}));

let mockUser: any = { id: "user-1", isPremium: false, fullName: "A" };
jest.mock("@/store/authStore", () => {
  const useAuthStore: any = (sel: any) => sel({ user: mockUser });
  useAuthStore.getState = () => ({ user: mockUser });
  return { useAuthStore };
});

import { LearningTopicScreen } from "@/learning/LearningTopicScreen";
import { useProgressStore } from "@/learning/progress/progressStore";

const body = "# Variables\n\n## 1. What is a variable?\n\nA box.\n\n## 2. Why is it used?\n\nTo store.\n\n## 3. Syntax\n\n```java\nint x = 1;\n```";
const readable = () => ({
  topic: { id: "t1", title: "Variables", slug: "variables", short_description: "Named storage", is_premium: false, updated_at: "" },
  section: { name: "Basics", slug: "basics" },
  grid: { name: "Java", slug: "java" },
  locked: false,
  contents: [{ id: "c1", heading: "", body, content_format: "markdown", file_url: null, video_url: null, metadata: {} }],
  prev: null,
  next: { title: "Classes", slug: "classes" },
});

const mounted: TestRenderer.ReactTestRenderer[] = [];
const mount = () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<LearningTopicScreen />);
  });
  mounted.push(r);
  return r;
};
const textOf = (r: TestRenderer.ReactTestRenderer): string => {
  const walk = (n: any): string => (n == null ? "" : typeof n === "string" ? n : Array.isArray(n) ? n.map(walk).join("") : walk(n.children));
  return walk(r.toJSON());
};
const press = (r: TestRenderer.ReactTestRenderer, label: string) => {
  const node = r.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === "function")[0];
  act(() => node.props.onPress());
};
const hasLabel = (r: TestRenderer.ReactTestRenderer, label: string) => r.root.findAll((n) => n.props.accessibilityLabel === label).length > 0;
const me = () => useProgressStore.getState().users["user-1"];

beforeEach(() => {
  mockUser = { id: "user-1", isPremium: false, fullName: "A" };
  mockTopic = readable();
  useProgressStore.setState({ users: {} });
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((r) => r.unmount());
  });
});

it("readable topic: header, real read time, hidden duplicate title, outline, complete + neighbours + practice", () => {
  const r = mount();
  const out = textOf(r);
  expect(out).toContain("Named storage");
  expect(out).toContain("min read");
  expect(out).toContain("A box.");
  expect(out).toContain("int x = 1;");
  // the topic title appears once (the header) — the body's own "# Variables" heading is hidden
  expect(out.replace("Variables quiz", "").match(/Variables/g)?.length).toBe(1);
  expect(hasLabel(r, "In this topic, 3 sections")).toBe(true);
  expect(hasLabel(r, "Text size")).toBe(true);
  expect(out).toContain("Mark as Complete ✓");
  expect(out).toContain("Next chapter · OOP"); // Classes lives in a different chapter
  expect(out).toContain("Variables quiz");
  // recorded for Continue Learning
  expect(me().lastOpened).toMatchObject({ gridSlug: "java", topicSlug: "variables" });
});

it("Mark as Complete toggles on and off and updates the user's progress", () => {
  const r = mount();
  press(r, "Mark this topic as complete");
  expect(me().completed["java/variables"]).toBeTruthy();
  expect(textOf(r)).toContain("Tap to undo");
  press(r, "Topic completed. Tap to mark as not complete");
  expect(me().completed["java/variables"]).toBeUndefined();
  expect(textOf(r)).toContain("Mark as Complete ✓");
});

it("signed out: no Complete button and nothing recorded", () => {
  mockUser = undefined;
  const r = mount();
  expect(textOf(r)).not.toContain("Mark as Complete");
  expect(useProgressStore.getState().users).toEqual({});
});

it("locked topic: existing locked view, no Complete / Aa / progress bar / outline, nothing recorded or saved", () => {
  mockTopic = { ...readable(), locked: true, contents: [] };
  const r = mount();
  const out = textOf(r);
  expect(out).toContain("Premium topic");
  expect(out).toContain("Upgrade to CampusEduX Premium to read this topic.");
  expect(out).toContain("See Premium Plans");
  expect(out).not.toContain("Mark as Complete");
  expect(hasLabel(r, "Text size")).toBe(false);
  expect(hasLabel(r, "Reading progress")).toBe(false);
  expect(out).not.toContain("In this topic");
  // neighbours + existing practice links stay
  expect(out).toContain("Classes");
  expect(out).toContain("Variables quiz");
  // no tracking of any kind
  act(() => {
    const sv = r.root.findAll((n) => typeof n.props.onScrollEndDrag === "function")[0];
    sv.props.onScrollEndDrag({ nativeEvent: { contentOffset: { y: 900 } } });
  });
  expect(me()?.lastOpened ?? null).toBeNull();
  expect(me()?.scroll ?? {}).toEqual({});
});

describe("scroll position", () => {
  const scrollView = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => typeof n.props.onContentSizeChange === "function")[0];
  const grow = (r: TestRenderer.ReactTestRenderer, viewport = 800, content = 4000) => {
    const sv = scrollView(r);
    act(() => sv.props.onLayout({ nativeEvent: { layout: { height: viewport } } }));
    act(() => sv.props.onContentSizeChange(400, content));
  };
  let scrollTo: jest.Mock;
  const spy = (r: TestRenderer.ReactTestRenderer) => {
    scrollTo = jest.fn();
    // the Animated.ScrollView instance the screen scrolls
    const inst: any = r.root.findAll((n) => typeof n.props.onContentSizeChange === "function" && n.instance)[0]?.instance;
    if (inst) inst.scrollTo = scrollTo;
    return scrollTo;
  };

  it("saves the offset when scrolling ends, and reopening restores it", () => {
    let r = mount();
    act(() => scrollView(r).props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: 1234 } } }));
    expect(me().scroll["java/variables"]).toBe(1234);
    act(() => mounted.splice(0).forEach((x) => x.unmount()));

    r = mount();
    const st = spy(r);
    grow(r);
    expect(st).toHaveBeenCalledWith({ y: 1234, animated: false });
  });

  it("does NOT restore a completed topic (starts at the top)", () => {
    let r = mount();
    act(() => scrollView(r).props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: 1234 } } }));
    press(r, "Mark this topic as complete");
    act(() => mounted.splice(0).forEach((x) => x.unmount()));

    r = mount();
    const st = spy(r);
    grow(r);
    expect(st).not.toHaveBeenCalled();
  });

  it("small offsets aren't restored; another user's offset is never restored", () => {
    useProgressStore.setState({ users: { "user-2": { completed: {}, lastOpened: null, activeDays: [], scroll: { "java/variables": 2000 }, readerFontSize: "medium" } } });
    const r = mount();
    const st = spy(r);
    grow(r);
    expect(st).not.toHaveBeenCalled();
  });
});

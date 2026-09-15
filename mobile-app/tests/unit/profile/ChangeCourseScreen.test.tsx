import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";

// Stand-ins for the design-system primitives so this test exercises
// ChangeCourseScreen's own logic (state, effects, handleSave) without
// pulling in SafeAreaView / native chrome.
jest.mock("@/components/ui", () => {
  const ReactLib = require("react");
  const { View, Text: RNText, Pressable } = require("react-native");
  return {
    Screen: ({ children }: any) => ReactLib.createElement(View, null, children),
    Button: ({ label, onPress, disabled, loading }: any) =>
      ReactLib.createElement(
        Pressable,
        { onPress, disabled },
        ReactLib.createElement(RNText, null, loading ? `${label}…` : label)
      ),
    LoadingState: ({ label }: any) => ReactLib.createElement(RNText, null, label ?? "Loading"),
  };
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

let mockUser: any;
const mockUpdateUserFields = jest.fn();
jest.mock("@/store/authStore", () => ({
  useAuthStore: () => ({ user: mockUser, updateUserFields: mockUpdateUserFields }),
}));

jest.mock("@/hooks/useAcademicOptions", () => ({
  useCourseOptions: () => ({
    data: [
      { id: "btech", label: "B.Tech" },
      { id: "mca", label: "MCA" },
    ],
    isLoading: false,
  }),
  courseIdForLabel: (options: { id: string; label: string }[], label?: string | null) =>
    options.find((o) => o.label.trim().toLowerCase() === (label ?? "").trim().toLowerCase())?.id,
}));

const mockGetBranches = jest.fn();
jest.mock("@/services/academic.service", () => ({
  academicService: { getBranches: (...args: unknown[]) => mockGetBranches(...args) },
}));

const mockUpdateAcademicDetails = jest.fn();
jest.mock("@/services/auth.service", () => ({
  authService: { updateAcademicDetails: (...args: unknown[]) => mockUpdateAcademicDetails(...args) },
}));

const mockInvalidateContent = jest.fn();
jest.mock("@/hooks/useHomeData", () => ({
  useInvalidateAcademicContent: () => mockInvalidateContent,
}));

jest.mock("@/lib/notify", () => ({ notify: jest.fn() }));

import { ChangeCourseScreen } from "@/profile/ChangeCourseScreen";

function render(el: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(el);
  });
  return renderer;
}

/** Finds the nearest onPress-bearing ancestor of a Text node with this exact content. */
function findPressableWithText(root: TestRenderer.ReactTestInstance, text: string) {
  const textNode = root.findAll((n) => n.type === Text && n.props.children === text)[0];
  if (!textNode) throw new Error(`No Text node with content "${text}"`);
  let current: TestRenderer.ReactTestInstance | null = textNode.parent;
  while (current) {
    if (typeof current.props.onPress === "function") return current;
    current = current.parent;
  }
  throw new Error(`No onPress ancestor found for "${text}"`);
}

describe("<ChangeCourseScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      id: "u-1",
      course: "B.Tech",
      branch: "Computer Science Engineering",
      year: "3rd Year",
    };
    mockGetBranches.mockImplementation((courseId: string) =>
      Promise.resolve(
        courseId === "mca"
          ? [{ id: "mca-gen", label: "General", courseId: "mca" }]
          : [{ id: "btech-cse", label: "Computer Science Engineering", courseId: "btech" }]
      )
    );
    mockUpdateAcademicDetails.mockResolvedValue(undefined);
  });

  it("switching to a course without the current branch clears branch in the DB, keeps it out of the auth store, and hands off to ChangeBranch (not full onboarding)", async () => {
    const renderer = render(<ChangeCourseScreen />);

    act(() => {
      findPressableWithText(renderer.root, "MCA").props.onPress();
    });

    await act(async () => {
      await findPressableWithText(renderer.root, "Continue").props.onPress();
    });

    // DB correctly reflects the now-invalid branch as missing.
    expect(mockUpdateAcademicDetails).toHaveBeenCalledWith("u-1", { course: "MCA", branch: null });

    // The auth store must NOT receive branch: null — that would flip
    // hasCompletedProfileSetup false and RootNavigator would tear the whole
    // app out of Settings into the first-time ProfileSetup wizard.
    expect(mockUpdateUserFields).toHaveBeenCalledWith({ course: "MCA" });
    expect(mockUpdateUserFields).not.toHaveBeenCalledWith(
      expect.objectContaining({ branch: expect.anything() })
    );

    // Stays inside the Settings stack, handed straight to ChangeBranch.
    expect(mockNavigate).toHaveBeenCalledWith("ChangeBranch");
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it("re-saving a course that still has the current branch does not touch branch and just goes back", async () => {
    const renderer = render(<ChangeCourseScreen />);

    // No option tapped: effectiveSelected defaults to the student's current
    // course ("B.Tech"), whose branches still include their current branch.
    await act(async () => {
      await findPressableWithText(renderer.root, "Continue").props.onPress();
    });

    expect(mockUpdateAcademicDetails).toHaveBeenCalledWith("u-1", { course: "B.Tech" });
    expect(mockUpdateUserFields).toHaveBeenCalledWith({ course: "B.Tech" });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

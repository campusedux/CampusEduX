import { useAuthStore, isAcademicComplete } from "@/store/authStore";
import type { UserProfile } from "@/types";

const baseProfile: UserProfile = {
  id: "u-1",
  fullName: "Rohan Verma",
  email: "rohan@campusedux.app",
  mobileNumber: "9999999999",
  course: "B.Tech",
  branch: "Computer Science Engineering",
  year: "3rd Year",
  isPremium: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("isAcademicComplete", () => {
  it("is true when course, branch and year are all present (existing user, complete profile)", () => {
    expect(isAcademicComplete(baseProfile)).toBe(true);
  });

  it("is false for a brand new user with no academic fields set", () => {
    expect(isAcademicComplete({ ...baseProfile, course: null, branch: null, year: null })).toBe(false);
  });

  it("is false when any single field is missing", () => {
    expect(isAcademicComplete({ ...baseProfile, branch: null })).toBe(false);
    expect(isAcademicComplete({ ...baseProfile, course: null })).toBe(false);
    expect(isAcademicComplete({ ...baseProfile, year: null })).toBe(false);
  });

  it("is false for a null user", () => {
    expect(isAcademicComplete(null)).toBe(false);
  });
});

describe("useAuthStore — the RootNavigator gate", () => {
  beforeEach(() => useAuthStore.getState().reset());

  it("setUser with a complete profile flips hasCompletedProfileSetup true (existing user -> Main/Home)", () => {
    useAuthStore.getState().setUser(baseProfile);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.hasCompletedProfileSetup).toBe(true);
  });

  it("setUser with an incomplete profile leaves hasCompletedProfileSetup false (new user -> onboarding)", () => {
    useAuthStore.getState().setUser({ ...baseProfile, course: null, branch: null, year: null });
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.hasCompletedProfileSetup).toBe(false);
  });

  it("updateUserFields recomputes hasCompletedProfileSetup as fields are filled in during onboarding", () => {
    useAuthStore.getState().setUser({ ...baseProfile, course: null, branch: null, year: null });
    expect(useAuthStore.getState().hasCompletedProfileSetup).toBe(false);

    useAuthStore.getState().updateUserFields({ course: "B.Tech" });
    expect(useAuthStore.getState().hasCompletedProfileSetup).toBe(false);

    useAuthStore.getState().updateUserFields({ branch: "Computer Science Engineering" });
    expect(useAuthStore.getState().hasCompletedProfileSetup).toBe(false);

    // Mirrors WelcomeScreen: committing the last field flips the gate, which
    // is what lets RootNavigator swap from ProfileSetup to Main.
    useAuthStore.getState().updateUserFields({ year: "3rd Year" });
    expect(useAuthStore.getState().hasCompletedProfileSetup).toBe(true);
  });

  it("updateUserFields({ course }) alone does not regress an already-complete profile (ChangeCourseScreen fix)", () => {
    useAuthStore.getState().setUser(baseProfile);
    expect(useAuthStore.getState().hasCompletedProfileSetup).toBe(true);

    // ChangeCourseScreen only ever pushes `course` into the store, even when
    // the branch is cleared in the DB — see its handleSave comment.
    useAuthStore.getState().updateUserFields({ course: "MCA" });

    expect(useAuthStore.getState().hasCompletedProfileSetup).toBe(true);
    expect(useAuthStore.getState().user?.branch).toBe(baseProfile.branch);
  });
});

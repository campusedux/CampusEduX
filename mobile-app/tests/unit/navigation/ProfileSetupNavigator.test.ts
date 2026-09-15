// ProfileSetupNavigator also imports the four setup screens, whose own
// dependency chains (Supabase, secure storage, react-query) reach native
// modules that don't exist under plain react-test-renderer. Only
// resumeProfileSetupStep is under test here, so those chains are stubbed out
// rather than exercised.
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), multiRemove: jest.fn() },
}));
jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { resumeProfileSetupStep } from "@/navigation/ProfileSetupNavigator";

describe("resumeProfileSetupStep", () => {
  it("starts at SelectCourse for a genuinely new user (nothing saved yet)", () => {
    expect(resumeProfileSetupStep(null)).toBe("SelectCourse");
    expect(resumeProfileSetupStep({ course: null, branch: null, year: null })).toBe("SelectCourse");
  });

  it("resumes at SelectBranch when only the course is saved", () => {
    expect(resumeProfileSetupStep({ course: "B.Tech", branch: null, year: null })).toBe("SelectBranch");
  });

  it("resumes at SelectYear when course and branch are already saved", () => {
    expect(
      resumeProfileSetupStep({ course: "B.Tech", branch: "Computer Science Engineering", year: null })
    ).toBe("SelectYear");
  });

  it("resumes at SelectBranch after ChangeCourseScreen clears an incompatible branch", () => {
    // course was just updated, year is still whatever it was before — only
    // branch is actually missing.
    expect(resumeProfileSetupStep({ course: "MCA", branch: null, year: "3rd Year" })).toBe("SelectBranch");
  });

  it("falls back to SelectCourse when every field is already present (defensive — this navigator should not mount then)", () => {
    expect(
      resumeProfileSetupStep({ course: "B.Tech", branch: "Computer Science Engineering", year: "3rd Year" })
    ).toBe("SelectCourse");
  });
});

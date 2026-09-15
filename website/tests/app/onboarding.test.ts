import { describe, it, expect, vi, beforeEach } from "vitest";

// redirect() throws to halt rendering — same pattern as tests/lib/auth.test.ts
// and tests/app/auth-callback.test.ts.
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw { digest: "NEXT_REDIRECT", url };
  }),
}));
vi.mock("next/navigation", () => ({ redirect }));

import { supabase, resetSupabaseMock, setUser, setTableResult } from "../helpers/supabase.mock";
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: () => supabase }));

import OnboardingPage from "@/app/onboarding/page";
import OnboardingForm from "@/app/onboarding/OnboardingForm";

beforeEach(() => resetSupabaseMock());

/** Recursively finds the first element of the given component type in a React element tree. */
function findByType(node: unknown, type: unknown): { props: Record<string, unknown> } | null {
  if (!node || typeof node !== "object") return null;
  const el = node as { type?: unknown; props?: { children?: unknown } };
  if (el.type === type) return el as { props: Record<string, unknown> };
  const children = el.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findByType(child, type);
      if (found) return found;
    }
    return null;
  }
  return findByType(children, type);
}

const CATALOG_ROWS = {
  courses: [
    { id: "btech", name: "B.Tech" },
    { id: "mca", name: "MCA" },
  ],
  branches: [
    { id: "btech-cse", name: "CSE", course_id: "btech" },
    { id: "mca-gen", name: "General", course_id: "mca" },
  ],
  academic_years: [
    { id: "1", label: "1st Year" },
    { id: "2", label: "2nd Year" },
  ],
};

function setCatalog() {
  setTableResult("courses", { data: CATALOG_ROWS.courses });
  setTableResult("branches", { data: CATALOG_ROWS.branches });
  setTableResult("academic_years", { data: CATALOG_ROWS.academic_years });
}

describe("OnboardingPage", () => {
  it("redirects to /login when there is no session (unauthenticated)", async () => {
    setUser(null);
    await expect(OnboardingPage()).rejects.toMatchObject({ url: "/login" });
  });

  it("does NOT redirect for a signed-in user with an incomplete profile — renders the form instead (no redirect loop)", async () => {
    setUser({ id: "u-1", email: "new@campusedux.app" });
    setTableResult("profiles", { data: { id: "u-1", course: null, branch: null, year: null } });
    setCatalog();

    const result = await OnboardingPage();

    // The onboarding page never calls requireUser() (which redirects an
    // incomplete profile to /onboarding) — proving that here would be the
    // exact loop this page exists to avoid.
    expect(redirect).not.toHaveBeenCalled();
    expect(findByType(result, OnboardingForm)).not.toBeNull();
  });

  it("redirects an already-complete profile straight to /account (stale bookmark / back-navigation)", async () => {
    setUser({ id: "u-2", email: "done@campusedux.app" });
    setTableResult("profiles", { data: { id: "u-2", course: "B.Tech", branch: "CSE", year: "3" } });

    await expect(OnboardingPage()).rejects.toMatchObject({ url: "/account" });
  });

  it("loads the courses/branches/academic_years catalog and passes it to the form", async () => {
    setUser({ id: "u-3", email: "new2@campusedux.app" });
    setTableResult("profiles", { data: { id: "u-3", course: null, branch: null, year: null } });
    setCatalog();

    const result = await OnboardingPage();
    const form = findByType(result, OnboardingForm);

    expect(form).not.toBeNull();
    expect(form!.props.userId).toBe("u-3");
    expect(form!.props.initial).toEqual({ course: "", branch: "", year: "" });
    expect(form!.props.catalog).toEqual({
      courses: CATALOG_ROWS.courses,
      branches: CATALOG_ROWS.branches,
      years: ["1st Year", "2nd Year"],
    });
  });

  it("prefills initial values from an existing partial profile", async () => {
    setUser({ id: "u-4", email: "partial@campusedux.app" });
    setTableResult("profiles", { data: { id: "u-4", course: "B.Tech", branch: null, year: null } });
    setCatalog();

    const result = await OnboardingPage();
    const form = findByType(result, OnboardingForm);

    expect(form!.props.initial).toEqual({ course: "B.Tech", branch: "", year: "" });
  });
});

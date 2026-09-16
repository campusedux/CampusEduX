import { describe, it, expect, beforeEach } from "vitest";

import { supabase, resetSupabaseMock, setTableResult } from "../helpers/supabase.mock";

import { resolvePostLoginDestination } from "@/app/login/resolvePostLoginDestination";

beforeEach(() => resetSupabaseMock());

describe("resolvePostLoginDestination (password login redirect)", () => {
  it("returns next for an existing complete profile — login from /projects returns to /projects", async () => {
    setTableResult("profiles", { data: { course: "B.Tech", branch: "CSE", year: "3" } });
    await expect(resolvePostLoginDestination(supabase as never, "u-1", "/projects")).resolves.toBe("/projects");
  });

  it("sends an incomplete profile to /onboarding, ignoring next", async () => {
    setTableResult("profiles", { data: { course: "B.Tech", branch: null, year: null } });
    await expect(resolvePostLoginDestination(supabase as never, "u-2", "/jobs")).resolves.toBe("/onboarding");
  });

  it("sends a brand-new user with no profiles row to /onboarding", async () => {
    setTableResult("profiles", { data: null });
    await expect(resolvePostLoginDestination(supabase as never, "u-3", "/learning/java")).resolves.toBe(
      "/onboarding",
    );
  });
});

jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { authService } from "@/services/auth.service";
import {
  resetSupabaseMock,
  setTableResult,
  setRpcResult,
  setAuthResult,
  supabase,
} from "../../mocks/supabase.mock";
import { profileRow, signInSuccess } from "../../mocks/users.mock";

beforeEach(() => resetSupabaseMock());

describe("integration: sign-in happy path", () => {
  it("resolves a mobile number to an email, signs in, and returns the mapped profile", async () => {
    setRpcResult("email_for_mobile", { data: "demo@campusedux.app" });
    setAuthResult("signInWithPassword", signInSuccess);
    setTableResult("profiles", { data: [profileRow] });

    const { session, profile } = await authService.login({
      identifier: "9999999999",
      password: "CampusEduXDemo!23",
    });

    expect(supabase.rpc).toHaveBeenCalledWith("email_for_mobile", { p_mobile: "9999999999" });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "demo@campusedux.app",
      password: "CampusEduXDemo!23",
    });
    expect(session).toBe(signInSuccess.data.session);
    expect(profile).toMatchObject({
      id: profileRow.id,
      fullName: "Rohan Verma",
      email: "demo@campusedux.app",
      mobileNumber: "9999999999",
      isPremium: true,
    });
  });

  it("signs in directly when the identifier is already an email (no RPC lookup)", async () => {
    setAuthResult("signInWithPassword", signInSuccess);
    setTableResult("profiles", { data: [profileRow] });

    await authService.login({ identifier: "demo@campusedux.app", password: "x" });

    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("surfaces 'No account found' when the mobile number is unknown", async () => {
    setRpcResult("email_for_mobile", { data: null });

    await expect(
      authService.login({ identifier: "1231231231", password: "x" })
    ).rejects.toThrow("No account found");
  });

  it("creates the profile row from auth metadata when it does not exist yet", async () => {
    setAuthResult("signInWithPassword", signInSuccess);
    // first select -> empty ; the follow-up insert -> the created row
    setTableResult("profiles", [
      { data: [] },
      { data: [{ ...profileRow, course: null, branch: null, year: null }] },
    ]);

    const { profile } = await authService.login({ identifier: "demo@campusedux.app", password: "x" });

    expect(profile.id).toBe(profileRow.id);
  });
});

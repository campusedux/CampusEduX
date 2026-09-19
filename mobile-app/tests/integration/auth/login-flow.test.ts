jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { authService, SessionInvalidError } from "@/services/auth.service";
import {
  resetSupabaseMock,
  setTableResult,
  setRpcResult,
  setAuthResult,
  supabase,
} from "../../mocks/supabase.mock";
import { authUser, profileRow, signInSuccess } from "../../mocks/users.mock";

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
    setAuthResult("getUser", { data: { user: authUser }, error: null });
    // first select -> empty ; the follow-up insert -> the created row
    setTableResult("profiles", [
      { data: [] },
      { data: [{ ...profileRow, course: null, branch: null, year: null }] },
    ]);

    const { profile } = await authService.login({ identifier: "demo@campusedux.app", password: "x" });

    expect(profile.id).toBe(profileRow.id);
  });

  it("does NOT insert a ghost profile when the auth user no longer exists (MOB-32)", async () => {
    setAuthResult("signInWithPassword", signInSuccess);
    setAuthResult("getUser", { data: { user: null }, error: { status: 403, message: "User from sub claim in JWT does not exist" } });
    setTableResult("profiles", { data: [] });

    await expect(
      authService.login({ identifier: "demo@campusedux.app", password: "x" })
    ).rejects.toBeInstanceOf(SessionInvalidError);
  });

  it("treats a 401 on the profile select as an invalid session", async () => {
    setTableResult("profiles", { error: { status: 401, code: "PGRST301", message: "JWT expired" } });
    await expect(authService.getProfile("u", "e@x.com")).rejects.toBeInstanceOf(SessionInvalidError);
  });

  it("does not treat an offline getUser failure as a deleted account", async () => {
    setTableResult("profiles", { data: [] });
    setAuthResult("getUser", { data: { user: null }, error: { message: "Network request failed" } });
    await expect(authService.getProfile("u", "e@x.com")).rejects.not.toBeInstanceOf(SessionInvalidError);
  });
});

describe("integration: OTP / resend / register", () => {
  it("sendOTP never creates users (shouldCreateUser:false) for email and phone", async () => {
    await authService.sendOTP("a@b.co");
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: "a@b.co", options: { shouldCreateUser: false } });
    await authService.sendOTP("9999999999");
    expect(supabase.auth.signInWithOtp).toHaveBeenLastCalledWith({ phone: "9999999999", options: { shouldCreateUser: false } });
  });

  it("resendVerificationEmail uses auth.resend for a signup", async () => {
    await authService.resendVerificationEmail(" a@b.co ");
    expect(supabase.auth.resend).toHaveBeenCalledWith({ type: "signup", email: "a@b.co" });
  });

  it("login failure keeps supabase code/status and the email for the UI to map", async () => {
    setAuthResult("signInWithPassword", { data: {}, error: { message: "Email not confirmed", code: "email_not_confirmed", status: 400 } });
    await expect(authService.login({ identifier: "a@b.co", password: "x" })).rejects.toMatchObject({
      code: "email_not_confirmed",
      email: "a@b.co",
    });
  });
});

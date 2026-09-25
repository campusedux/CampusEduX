jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { authService } from "@/services/auth.service";
import {
  resetSupabaseMock,
  setTableResult,
  setRpcResult,
  setAuthResult,
  supabase,
} from "../../mocks/supabase.mock";
import { profileRow, authUser, signInSuccess } from "../../mocks/users.mock";

beforeEach(() => resetSupabaseMock());

describe("authService.login", () => {
  it("signs in with an email identifier and returns the session + mapped profile", async () => {
    setAuthResult("signInWithPassword", signInSuccess);
    setTableResult("profiles", { data: [profileRow] });

    const { session, profile } = await authService.login({ identifier: " demo@campusedux.app ", password: "pw" });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: "demo@campusedux.app", password: "pw" });
    expect(session).toEqual(signInSuccess.data.session);
    expect(profile.id).toBe(profileRow.id);
    expect(profile.fullName).toBe("Rohan Verma");
    expect(profile.isPremium).toBe(true);
  });

  it("resolves a mobile-number identifier to an email via the email_for_mobile RPC", async () => {
    setRpcResult("email_for_mobile", { data: "demo@campusedux.app" });
    setAuthResult("signInWithPassword", signInSuccess);
    setTableResult("profiles", { data: [profileRow] });

    await authService.login({ identifier: "9999999999", password: "pw" });

    expect(supabase.rpc).toHaveBeenCalledWith("email_for_mobile", { p_mobile: "9999999999" });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: "demo@campusedux.app", password: "pw" });
  });

  it("throws when no account maps to the given mobile number", async () => {
    setRpcResult("email_for_mobile", { data: null });

    await expect(authService.login({ identifier: "8888888888", password: "pw" })).rejects.toThrow(
      "No account found with this mobile number."
    );
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("propagates a Supabase auth error", async () => {
    setAuthResult("signInWithPassword", { data: null, error: { message: "Invalid login credentials" } });

    await expect(authService.login({ identifier: "demo@campusedux.app", password: "bad" })).rejects.toThrow(
      "Invalid login credentials"
    );
  });
});

describe("authService.register", () => {
  it("rejects mismatched passwords before calling Supabase", async () => {
    await expect(
      authService.register({
        fullName: "A",
        email: "a@b.com",
        mobileNumber: "9",
        password: "one",
        confirmPassword: "two",
      } as any)
    ).rejects.toThrow("Passwords do not match.");
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("passes profile metadata (uppercased referral code) to signUp", async () => {
    setAuthResult("signUp", { data: { user: authUser }, error: null });

    await authService.register({
      fullName: "Rohan Verma",
      email: "rohan@x.com",
      mobileNumber: "9999999999",
      password: "secret1",
      confirmPassword: "secret1",
      referralCode: " rohan21 ",
    } as any);

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "rohan@x.com",
      password: "secret1",
      options: {
        data: { full_name: "Rohan Verma", mobile_number: "9999999999", referral_code: "ROHAN21" },
      },
    });
  });

  it("propagates a signUp error", async () => {
    setAuthResult("signUp", { data: null, error: { message: "User already registered" } });

    await expect(
      authService.register({
        fullName: "A",
        email: "a@b.com",
        mobileNumber: "9",
        password: "same",
        confirmPassword: "same",
      } as any)
    ).rejects.toThrow("User already registered");
  });
});

describe("authService OTP", () => {
  it("sendOTP uses the email channel for an email identifier", async () => {
    await authService.sendOTP("demo@campusedux.app");
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: "demo@campusedux.app", options: { shouldCreateUser: false } });
  });

  it("sendOTP uses the phone channel for a non-email identifier", async () => {
    await authService.sendOTP("9999999999");
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ phone: "9999999999", options: { shouldCreateUser: false } });
  });

  it("sendOTP throws on a Supabase error", async () => {
    setAuthResult("signInWithOtp", { error: { message: "rate limited" } });
    await expect(authService.sendOTP("demo@campusedux.app")).rejects.toThrow("rate limited");
  });

  it("verifyOTP passes type=email for an email identifier", async () => {
    await authService.verifyOTP("demo@campusedux.app", "123456");
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: "demo@campusedux.app", token: "123456", type: "email" });
  });

  it("verifyOTP passes type=sms for a phone identifier", async () => {
    await authService.verifyOTP("9999999999", "123456");
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ phone: "9999999999", token: "123456", type: "sms" });
  });
});

describe("authService.updatePassword", () => {
  it("calls updateUser with the new password", async () => {
    await authService.updatePassword("newSecret1");
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "newSecret1" });
  });

  it("throws on a Supabase error", async () => {
    setAuthResult("updateUser", { data: null, error: { message: "weak password" } });
    await expect(authService.updatePassword("x")).rejects.toThrow("weak password");
  });
});

describe("authService.getProfile", () => {
  it("returns the mapped profile when the row exists", async () => {
    setTableResult("profiles", { data: [profileRow] });

    const profile = await authService.getProfile(profileRow.id, profileRow.email);

    expect(profile.email).toBe(profileRow.email);
    expect(profile.branch).toBe("Computer Science Engineering");
  });

  it("creates the profile row from auth metadata when it is missing", async () => {
    setAuthResult("getUser", { data: { user: { id: profileRow.id } }, error: null });
    setTableResult("profiles", [
      { data: [] }, // initial lookup: no row
      { data: [{ id: profileRow.id, email: "new@x.com", full_name: "New Student", mobile_number: "1", is_premium: false }] }, // insert().select().single()
    ]);

    const profile = await authService.getProfile(profileRow.id, "new@x.com", { full_name: "New Student", mobile_number: "1" });

    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(profile.fullName).toBe("New Student");
    expect(profile.isPremium).toBe(false);
  });

  it("re-reads the row when a concurrent insert already created it (23505)", async () => {
    setAuthResult("getUser", { data: { user: { id: profileRow.id } }, error: null });
    setTableResult("profiles", [
      { data: [] }, // initial lookup
      { error: { code: "23505", message: "duplicate key value" } }, // our insert loses the race
      { data: [profileRow] }, // re-read
    ]);

    const profile = await authService.getProfile(profileRow.id, profileRow.email);

    expect(supabase.from).toHaveBeenCalledTimes(3);
    expect(profile.id).toBe(profileRow.id);
  });

  it("translates a PGRST205 schema-cache error into an actionable message", async () => {
    setTableResult("profiles", { error: { code: "PGRST205", message: "Could not find the table in the schema cache" } });

    await expect(authService.getProfile(profileRow.id, profileRow.email)).rejects.toThrow(
      /0001_profiles\.sql/
    );
  });
});

describe("authService.updateAcademicDetails", () => {
  it("only sends the fields that are provided", async () => {
    let captured: unknown;
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      update: (payload: unknown) => {
        captured = payload;
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }));

    await authService.updateAcademicDetails("u-1", { year: "Final Year" });

    expect(captured).toEqual({ year: "Final Year" });
  });

  it("throws on a Supabase error", async () => {
    setTableResult("profiles", { error: { message: "rls denied" } });
    await expect(authService.updateAcademicDetails("u-1", { course: "B.Tech" })).rejects.toThrow("rls denied");
  });
});

describe("authService session helpers", () => {
  it("logout calls signOut", async () => {
    await authService.logout();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it("getSession returns the current session", async () => {
    setAuthResult("getSession", { data: { session: { access_token: "jwt" } }, error: null });
    expect(await authService.getSession()).toEqual({ access_token: "jwt" });
  });
});

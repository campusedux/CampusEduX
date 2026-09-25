import { classifyAuthError, describeAuthError, interpretSignUp, isSessionInvalidError } from "@/auth/authErrors";

describe("describeAuthError", () => {
  it("maps invalid credentials", () => {
    const r = describeAuthError(new Error("Invalid login credentials"));
    expect(r.kind).toBe("invalid_credentials");
    expect(r.message).not.toMatch(/Invalid login credentials/);
    expect(r.canResendVerification).toBe(false);
  });

  it("maps email-not-confirmed by code or message and offers resend", () => {
    expect(describeAuthError({ code: "email_not_confirmed", message: "x" }).canResendVerification).toBe(true);
    expect(describeAuthError(new Error("Email not confirmed")).kind).toBe("email_not_confirmed");
  });

  it("maps rate limits (429, code, message)", () => {
    expect(classifyAuthError({ status: 429, message: "" })).toBe("rate_limit");
    expect(classifyAuthError({ code: "over_email_send_rate_limit" })).toBe("rate_limit");
    expect(classifyAuthError(new Error("For security purposes, you can only request this after 45 seconds"))).toBe("rate_limit");
  });

  it("maps network failures and unregistered OTP targets", () => {
    expect(classifyAuthError(new Error("Network request failed"))).toBe("network");
    expect(classifyAuthError(new Error("Signups not allowed for otp"))).toBe("user_not_found");
  });

  it("passes our own readable messages through, falls back for junk", () => {
    expect(describeAuthError(new Error("Passwords do not match.")).message).toBe("Passwords do not match.");
    expect(describeAuthError(undefined, "Try later").message).toBe("Try later");
  });
});

describe("interpretSignUp", () => {
  it("signed_in when a session exists (email confirmation off)", () => {
    expect(interpretSignUp({ session: { a: 1 }, user: { identities: [{}] } }).kind).toBe("signed_in");
  });
  it("already_registered when identities is empty", () => {
    expect(interpretSignUp({ session: null, user: { identities: [] } }).kind).toBe("already_registered");
  });
  it("verify_email otherwise", () => {
    expect(interpretSignUp({ session: null, user: { identities: [{}] } }).kind).toBe("verify_email");
    expect(interpretSignUp({}).kind).toBe("verify_email");
  });
});

describe("isSessionInvalidError", () => {
  it("true for 401/403, JWT codes and deleted-user messages", () => {
    expect(isSessionInvalidError({ status: 401 })).toBe(true);
    expect(isSessionInvalidError({ code: "PGRST301", message: "JWT expired" })).toBe(true);
    expect(isSessionInvalidError({ status: 403, message: "User from sub claim in JWT does not exist" })).toBe(true);
  });
  it("false for RLS, offline and empty", () => {
    expect(isSessionInvalidError({ status: 403, code: "42501", message: "new row violates row-level security" })).toBe(false);
    expect(isSessionInvalidError(new Error("Network request failed"))).toBe(false);
    expect(isSessionInvalidError(null)).toBe(false);
  });
});

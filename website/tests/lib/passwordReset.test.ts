import { describe, it, expect } from "vitest";
import { describeResetPasswordError } from "@/lib/passwordReset";

describe("describeResetPasswordError (Bug 5)", () => {
  it("gives a rate-limit-specific message for a 429 status", () => {
    expect(describeResetPasswordError({ status: 429, message: "over_email_send_rate_limit" })).toMatch(/Too many requests/);
  });

  it("gives a rate-limit-specific message when the text says so, regardless of status", () => {
    expect(describeResetPasswordError({ message: "Email rate limit exceeded" })).toMatch(/Too many requests/);
  });

  it("falls back to a generic try-again message for any other error (SMTP failure, malformed address, ...)", () => {
    expect(describeResetPasswordError({ status: 500, message: "Error sending recovery email" })).toMatch(/couldn't send the reset email/);
  });

  it("never mentions whether the account exists (Supabase itself already stays silent on that)", () => {
    const msg = describeResetPasswordError({ status: 500, message: "anything" });
    expect(msg.toLowerCase()).not.toMatch(/account|exist|register/);
  });
});

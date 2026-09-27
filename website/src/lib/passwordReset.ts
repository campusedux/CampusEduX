// Pure helper for the "forgot password" form (Bug 5). Supabase's own
// resetPasswordForEmail already protects against email enumeration — it
// silently succeeds (no error) for an address with no account, by design. So
// any error it DOES return is never "that email doesn't exist"; it's a real
// problem (rate limit, SMTP/provider failure, malformed address) the user
// needs to see, not something to swallow into a fake "check your email".
export function describeResetPasswordError(error: { status?: number; message: string }): string {
  const rateLimited = error.status === 429 || /rate limit/i.test(error.message);
  return rateLimited
    ? "Too many requests. Please wait a few minutes and try again."
    : "We couldn't send the reset email right now. Please try again in a moment.";
}

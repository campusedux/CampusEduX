/**
 * Maps raw Supabase / network auth errors to friendly, actionable copy.
 * Pure — no React / Supabase imports so it is trivially testable.
 */
export type AuthErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limit"
  | "user_exists"
  | "weak_password"
  | "network"
  | "otp_invalid"
  | "user_not_found"
  | "unknown";

export interface FriendlyAuthError {
  kind: AuthErrorKind;
  message: string;
  /** True when a "Resend verification email" action makes sense. */
  canResendVerification: boolean;
}

type ErrorLike = { message?: unknown; code?: unknown; status?: unknown } | null | undefined;

const MESSAGES: Record<AuthErrorKind, string> = {
  invalid_credentials: "Incorrect email/mobile or password. Please check and try again.",
  email_not_confirmed: "Your email isn't verified yet. Check your inbox, or resend the verification email.",
  rate_limit: "Too many attempts. Please wait a minute and try again.",
  user_exists: "An account with this email already exists. Try logging in instead.",
  weak_password: "That password is too weak. Use at least 6 characters, mixing letters and numbers.",
  network: "Couldn't reach the server. Check your internet connection and try again.",
  otp_invalid: "That code is invalid or has expired. Request a new one and try again.",
  user_not_found: "We couldn't find an account with those details.",
  unknown: "Something went wrong. Please try again.",
};

export function classifyAuthError(error: unknown): AuthErrorKind {
  const e = (error && typeof error === "object" ? error : { message: error }) as NonNullable<ErrorLike>;
  const code = typeof e.code === "string" ? e.code.toLowerCase() : "";
  const status = typeof e.status === "number" ? e.status : undefined;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";

  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return "email_not_confirmed";
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "invalid_credentials";
  if (status === 429 || code.includes("rate_limit") || msg.includes("rate limit") || msg.includes("too many") || msg.includes("security purposes"))
    return "rate_limit";
  if (code === "user_already_exists" || code === "email_exists" || msg.includes("already registered") || msg.includes("already been registered"))
    return "user_exists";
  if (code === "weak_password" || msg.includes("password should be") || msg.includes("weak password")) return "weak_password";
  if (code === "otp_expired" || msg.includes("token has expired") || (msg.includes("otp") && msg.includes("invalid")) || msg.includes("invalid token"))
    return "otp_invalid";
  if (msg.includes("signups not allowed") || msg.includes("user not found")) return "user_not_found";
  if (msg.includes("network request failed") || msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("timeout"))
    return "network";
  return "unknown";
}

/**
 * Friendly text for an auth failure. Messages we authored ourselves (e.g.
 * "No account found with this mobile number.") pass through unchanged when the
 * classifier does not recognise them.
 */
export function describeAuthError(error: unknown, fallback?: string): FriendlyAuthError {
  const kind = classifyAuthError(error);
  const raw = error && typeof error === "object" ? (error as ErrorLike)?.message : error;
  let message = MESSAGES[kind];
  if (kind === "unknown") {
    message = typeof raw === "string" && raw.trim() && !/^(auth|error)/i.test(raw) ? raw : fallback ?? MESSAGES.unknown;
  }
  return { kind, message, canResendVerification: kind === "email_not_confirmed" };
}

export interface SignUpOutcomeInput {
  session?: unknown;
  user?: { identities?: unknown[] | null } | null;
}

export type SignUpOutcome =
  | { kind: "signed_in" }
  | { kind: "already_registered"; message: string }
  | { kind: "verify_email"; message: string };

/** Decide what Register should tell the user, from what signUp actually returned. */
export function interpretSignUp(data: SignUpOutcomeInput | null | undefined): SignUpOutcome {
  if (data?.session) return { kind: "signed_in" };
  const identities = data?.user?.identities;
  if (Array.isArray(identities) && identities.length === 0) {
    return {
      kind: "already_registered",
      message: "This email is already registered. Log in instead, or use Forgot Password if you don't remember it.",
    };
  }
  return {
    kind: "verify_email",
    message: "We've sent a verification link to your email. Please verify it before logging in.",
  };
}

type ApiErrorLike = { status?: unknown; code?: unknown; message?: unknown } | null | undefined;

/**
 * True when an error means "this session/JWT is no longer valid" (expired,
 * revoked, or the auth user was deleted) as opposed to a transient/offline
 * failure or an RLS/config problem. Callers sign the user out on true.
 */
export function isSessionInvalidError(error: unknown): boolean {
  const e = (error && typeof error === "object" ? error : null) as ApiErrorLike;
  if (!e) return false;
  const status = typeof e.status === "number" ? e.status : undefined;
  const code = typeof e.code === "string" ? e.code : "";
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  if (code === "42501" || msg.includes("row-level security")) return false;
  if (status === 401 || status === 403) return true;
  if (code === "PGRST301" || code === "PGRST303" || code === "bad_jwt" || code === "user_not_found" || code === "session_not_found") return true;
  return msg.includes("jwt") || msg.includes("user from sub claim") || msg.includes("user not found");
}

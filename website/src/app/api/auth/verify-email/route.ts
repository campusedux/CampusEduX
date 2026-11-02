import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store" } as const;

// The signup-confirmation email only ever produces `type=email` (or the
// classic Supabase default `type=signup`, kept for older/dashboard-default
// templates). Anything else is out of scope for this endpoint and rejected
// up front — this route is not a general-purpose OTP verifier.
const ALLOWED_TYPES = new Set<string>(["email", "signup"]);

export type VerifyEmailStatus = "success" | "already-verified" | "error";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || !type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json<{ status: VerifyEmailStatus }>(
      { status: "error" },
      { headers: PRIVATE },
    );
  }

  const supabase = await createAuthedServerSupabase();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (!error) {
    return NextResponse.json<{ status: VerifyEmailStatus }>(
      { status: "success" },
      { headers: PRIVATE },
    );
  }

  // Never log the token itself — only the Supabase error code, for debugging.
  console.error("[api/auth/verify-email] verifyOtp failed", { code: error.code ?? error.status });

  // A confirmation token is single-use. If this exact link was already
  // clicked once before (a common case: mail-client link pre-fetching, or
  // the user clicking it twice), the token is now "invalid" even though the
  // email really is verified. Distinguish that case from a genuinely bad/
  // expired link by checking whether a session already exists for this
  // browser — e.g. from the first, successful click.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const status: VerifyEmailStatus = user ? "already-verified" : "error";
  return NextResponse.json<{ status: VerifyEmailStatus }>({ status }, { headers: PRIVATE });
}

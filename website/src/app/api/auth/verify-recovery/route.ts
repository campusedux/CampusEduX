import { NextResponse, type NextRequest } from "next/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store" } as const;

export type VerifyRecoveryStatus = "success" | "error";

/**
 * Server-side, device-independent counterpart to
 * src/app/api/auth/verify-email/route.ts, for the "Forgot password" link.
 *
 * Deliberately does NOT use the browser client's PKCE code-exchange
 * (`?code=` + a locally-stored code_verifier) — that only works when the
 * link is opened in the same browser that requested it. `verifyOtp` with a
 * `token_hash` needs no client-stored state, so the link works from any
 * device/browser, exactly like email confirmation already does.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || type !== "recovery") {
    return NextResponse.json<{ status: VerifyRecoveryStatus }>(
      { status: "error" },
      { headers: PRIVATE },
    );
  }

  const supabase = await createAuthedServerSupabase();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (!error) {
    return NextResponse.json<{ status: VerifyRecoveryStatus }>(
      { status: "success" },
      { headers: PRIVATE },
    );
  }

  // Never log the token itself — only the Supabase error code, for debugging.
  console.error("[api/auth/verify-recovery] verifyOtp failed", { code: error.code ?? error.status });
  return NextResponse.json<{ status: VerifyRecoveryStatus }>({ status: "error" }, { headers: PRIVATE });
}

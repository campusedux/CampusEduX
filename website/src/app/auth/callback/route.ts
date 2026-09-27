import { NextResponse, type NextRequest } from "next/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { safeInternalPath } from "@/lib/nav";
import { postLoginDestination } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Lands the browser back from Google (or any future `signInWithOAuth`
 * provider) after `LoginForm.handleGoogleSignIn` sends it to Google with
 * `redirectTo=/auth/callback?next=...`. Unlike the mobile app's web build
 * (plain supabase-js, `detectSessionInUrl` picks the session out of the URL
 * client-side), this site's browser client is `@supabase/ssr`'s cookie-backed
 * client — the `?code=` has to be exchanged for a session *here*, server-side,
 * with `createAuthedServerSupabase()` so the session lands in httpOnly cookies
 * the same way password login's session cookie does.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // Never trust `next` as a redirect target as-is — same guard password login
  // uses before calling router.push().
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));
  // Set by RegisterView.handleGoogleSignIn when a referral link was opened —
  // Google round-trips arbitrary query params on `redirectTo` unchanged, so
  // this survives the OAuth hop without a cookie.
  const ref = request.nextUrl.searchParams.get("ref");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  const supabase = createAuthedServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Never log the code itself — only the Supabase error code, for debugging.
    console.error("[auth/callback] exchangeCodeForSession failed", { code: error.code ?? error.status });
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  // A brand-new Google sign-up has an identical created_at/last_sign_in_at
  // (both stamped by the same auth.users insert); a returning user's
  // created_at predates this sign-in. Only a genuinely new account may ever
  // attach a referral code, and only once (also enforced inside the RPC).
  const user = data.user;
  const isNewSignup = !!user && user.created_at === user.last_sign_in_at;
  if (ref && isNewSignup) {
    const { error: referralError } = await supabase.rpc("apply_referral_code", { p_code: ref });
    if (referralError) {
      // Best-effort — never block sign-in over a referral attach failure.
      console.error("[auth/callback] apply_referral_code failed", { code: referralError.code });
    }
  }

  // An incomplete profile (new Google sign-up) is sent to /onboarding instead
  // of `next` — same gate password login applies client-side.
  const destination = await postLoginDestination(next);
  return NextResponse.redirect(new URL(destination, request.url));
}

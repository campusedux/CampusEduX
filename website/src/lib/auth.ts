import { cache } from "react";
import { redirect } from "next/navigation";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

/**
 * `cache()` is a React Server Components primitive: in the Next.js server
 * runtime it de-dupes a call for the lifetime of a single request (not a
 * module-level or cross-request store). The plain `react` build used by the
 * Node test runner does not ship it, so fall back to an un-memoised
 * pass-through there — correctness is identical, only the per-request de-dupe
 * is skipped in that environment.
 */
const requestCache: typeof cache =
  typeof cache === "function" ? cache : (fn) => fn;

export interface AccountUser {
  id: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  avatarUrl: string | null;
  course: string | null;
  branch: string | null;
  year: string | null;
  isPremium: boolean;
  referralCode: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
}

/**
 * Request-scoped memo of `supabase.auth.getUser()`.
 *
 * `cache()` from React is per-request in the App Router: the memo lives only
 * for the current server render/request and is torn down afterwards. It is not
 * a module-level variable, not a shared `Map`, and never persists or is shared
 * between requests or users. Within one request the layout, `ensureLegalConsent`
 * and the page all reach the same in-flight `getUser()` call instead of each
 * making its own round-trip to the Supabase Auth server.
 */
export const getAuthUser = requestCache(async () => {
  const supabase = createAuthedServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Request-scoped memo of the signed-in user's `profiles` row, mapped to
 * `AccountUser`. Same `cache()` semantics as {@link getAuthUser} — one
 * `profiles` SELECT per request no matter how many callers ask for it.
 * Exported so /onboarding can read the same memoised row without calling
 * {@link requireUser} (which would redirect an incomplete profile straight
 * back to /onboarding and loop).
 */
export const getAccountUser = requestCache(async (): Promise<AccountUser | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = createAuthedServerSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, mobile_number, avatar_url, course, branch, year, is_premium, referral_code, linkedin_url, github_url, portfolio_url",
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    fullName: profile?.full_name ?? "",
    mobileNumber: profile?.mobile_number ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    course: profile?.course ?? null,
    branch: profile?.branch ?? null,
    year: profile?.year ?? null,
    isPremium: profile?.is_premium ?? false,
    referralCode: profile?.referral_code ?? null,
    linkedinUrl: profile?.linkedin_url ?? null,
    githubUrl: profile?.github_url ?? null,
    portfolioUrl: profile?.portfolio_url ?? null,
  };
});

/**
 * course / branch / year are the only fields the onboarding gate checks —
 * mirrors mobile-app/src/store/authStore.ts's isAcademicComplete exactly.
 */
export function isAcademicComplete(account: Pick<AccountUser, "course" | "branch" | "year">): boolean {
  return !!(account.course && account.branch && account.year);
}

/**
 * The one gate every /account page passes through. A signed-in Supabase
 * session with no matching `profiles` row shouldn't normally happen (the
 * `handle_new_user` trigger creates one on signup — see mobile-app
 * migrations/0001_profiles.sql) but is handled defensively rather than
 * crashing the page. A signed-in user whose course/branch/year aren't all
 * set yet is sent to /onboarding instead — /onboarding itself never calls
 * this function, so that redirect can't loop.
 *
 * The auth check + profile read are request-memoised (see {@link getAuthUser}
 * / {@link getAccountUser}), so calling this from both the account layout and
 * the page it wraps costs a single `getUser()` + a single `profiles` SELECT.
 */
export async function requireUser(): Promise<AccountUser> {
  const account = await getAccountUser();
  if (!account) redirect("/login");
  if (!isAcademicComplete(account)) redirect("/onboarding");
  return account;
}

/**
 * The id + email of the signed-in user, or `null` — the non-redirecting
 * counterpart to `requireUser()`, for Server Actions that want to return a
 * friendly error (e.g. "your session expired, sign in again") rather than
 * bounce a mid-form submit to /login. Does not read `profiles`.
 */
export async function getOptionalUser(): Promise<{ id: string; email: string } | null> {
  const user = await getAuthUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}

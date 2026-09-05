import { redirect } from "next/navigation";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";

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
 * The one gate every /account page passes through. A signed-in Supabase
 * session with no matching `profiles` row shouldn't normally happen (the
 * `handle_new_user` trigger creates one on signup — see mobile-app
 * migrations/0001_profiles.sql) but is handled defensively rather than
 * crashing the page.
 */
export async function requireUser(): Promise<AccountUser> {
  const supabase = createAuthedServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
}

/**
 * The id + email of the signed-in user, or `null` — the non-redirecting
 * counterpart to `requireUser()`, for Server Actions that want to return a
 * friendly error (e.g. "your session expired, sign in again") rather than
 * bounce a mid-form submit to /login.
 */
export async function getOptionalUser(): Promise<{ id: string; email: string } | null> {
  const supabase = createAuthedServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? "" };
}

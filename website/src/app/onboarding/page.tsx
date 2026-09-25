import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser, getAccountUser, isAcademicComplete } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import OnboardingForm from "./OnboardingForm";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Course/branch/year collection for a new (or still-incomplete) student —
 * the one place requireUser()'s gate (see @/lib/auth) sends a signed-in user
 * whose profile isn't complete yet. This page deliberately does NOT call
 * requireUser() itself: that function redirects an incomplete profile to
 * /onboarding, so calling it from /onboarding would redirect back to itself
 * in a loop. Session presence is checked directly via getAuthUser() instead.
 */
export default async function OnboardingPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  // Same memoised read requireUser() uses — one `profiles` SELECT per request
  // no matter how many callers ask for it.
  const account = await getAccountUser();
  // Nothing left to onboard — a stale bookmark or back-navigation shouldn't
  // show the form again.
  if (account && isAcademicComplete(account)) redirect("/account");

  const supabase = createAuthedServerSupabase();
  const [{ data: courses }, { data: branches }, { data: years }] = await Promise.all([
    supabase.from("courses").select("id,name").eq("status", "active").order("sort_order"),
    supabase.from("branches").select("id,name,course_id").eq("status", "active").order("sort_order"),
    supabase.from("academic_years").select("id,label").eq("status", "active").order("sort_order"),
  ]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-bold text-ink">Tell us about your studies</h1>
        <p className="mt-1 text-sm text-ink-muted">
          A few details so we can personalise projects, jobs and learning content for you.
        </p>
        <div className="mt-6">
          <OnboardingForm
            userId={authUser.id}
            initial={{
              course: account?.course ?? "",
              branch: account?.branch ?? "",
              year: account?.year ?? "",
            }}
            catalog={{
              courses: courses ?? [],
              branches: branches ?? [],
              years: (years ?? []).map((y) => y.label),
            }}
          />
        </div>
      </div>
    </div>
  );
}

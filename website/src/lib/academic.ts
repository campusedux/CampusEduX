/**
 * course / branch / year are the only fields the onboarding gate checks —
 * mirrors mobile-app/src/store/authStore.ts's isAcademicComplete exactly.
 *
 * Pulled out of `@/lib/auth` (which pulls in `next/headers` cookies() via
 * `createAuthedServerSupabase`) so this pure check can also run in Client
 * Components — see src/app/login/page.tsx's post-sign-in redirect.
 */
export function isAcademicComplete(account: {
  course?: string | null;
  branch?: string | null;
  year?: string | null;
}): boolean {
  return !!(account.course && account.branch && account.year);
}

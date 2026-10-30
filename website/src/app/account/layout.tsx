import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ensureLegalConsent } from "@/lib/legalConsent";
import { AccountNav } from "@/components/account/AccountNav";
import { Avatar, Badge } from "@/components/ui";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Records acceptance of the current policy version for web users who verified
  // their email and signed in without a session on /register. Best-effort, never throws.
  await ensureLegalConsent("website");

  return (
    <div className="page-shell">
      {/* grid-cols-1 = minmax(0,1fr): without it the implicit mobile track sizes to the
          tab row's min-content width and widens the whole page past the viewport. */}
      <div className="account-layout flex min-w-0 flex-col gap-4 md:grid md:grid-cols-[230px_minmax(0,1fr)] md:gap-5">
        <aside className="min-w-0 md:sticky md:top-24 md:self-start">
          <div className="card mb-4 hidden items-center gap-3 p-4 md:flex">
            <Avatar src={user.avatarUrl} name={user.fullName || user.email} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-ink">{user.fullName || user.email}</div>
              {user.isPremium ? (
                <span className="mt-1 inline-block">
                  <Badge tone="premium">Premium</Badge>
                </span>
              ) : (
                <div className="truncate text-xs text-ink-faint">{user.email}</div>
              )}
            </div>
          </div>
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

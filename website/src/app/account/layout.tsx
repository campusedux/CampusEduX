import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/purchases", label: "Purchases" },
  { href: "/account/applications", label: "Applications" },
  { href: "/account/saved-jobs", label: "Saved Jobs" },
  { href: "/account/resume", label: "Resume" },
  { href: "/account/wallet", label: "Wallet" },
  { href: "/account/referral", label: "Referral" },
  { href: "/account/notifications", label: "Notifications" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <aside>
          <div className="mb-4">
            <div className="font-serif text-lg text-navy">{user.fullName || user.email}</div>
            {user.isPremium && <span className="mt-1 inline-block rounded-sm bg-marigold px-2 py-0.5 text-[0.65rem] font-semibold text-navy">Premium</span>}
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-sm px-2 py-1.5 text-navy hover:bg-navy/5">
                {n.label}
              </Link>
            ))}
            <Link href="/logout" className="mt-3 rounded-sm px-2 py-1.5 text-slate hover:bg-navy/5">Sign out</Link>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}

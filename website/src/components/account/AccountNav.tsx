"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/purchases", label: "Purchases" },
  { href: "/account/saved-projects", label: "Saved Projects" },
  { href: "/account/applications", label: "Applications" },
  { href: "/account/saved-jobs", label: "Saved Jobs" },
  { href: "/account/resume", label: "Resume" },
  { href: "/account/wallet", label: "Wallet" },
  { href: "/account/referral", label: "Referral" },
  { href: "/account/notifications", label: "Notifications" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 text-sm md:flex-col md:overflow-visible md:pb-0">
      {NAV.map((n) => {
        const active = n.href === "/account" ? pathname === "/account" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition",
              active ? "bg-primary-50 text-primary" : "text-ink-muted hover:bg-surface hover:text-ink",
            )}
          >
            {n.label}
          </Link>
        );
      })}
      <Link
        href="/logout"
        className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-ink-faint transition hover:bg-surface hover:text-ink md:mt-3"
      >
        Sign out
      </Link>
    </nav>
  );
}

export default AccountNav;

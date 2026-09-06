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
  { href: "/resume", label: "Resume" },
  { href: "/account/wallet", label: "Wallet" },
  { href: "/account/referral", label: "Referral" },
  { href: "/account/notifications", label: "Notifications" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 text-sm md:flex-col md:gap-0.5 md:overflow-visible md:bg-transparent md:p-0">
      {NAV.map((n) => {
        const active = n.href === "/account" ? pathname === "/account" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 font-medium transition",
              active
                ? "bg-white text-primary shadow-sm md:bg-primary-50 md:shadow-none"
                : "text-ink-muted hover:text-ink md:hover:bg-surface",
            )}
          >
            {n.label}
          </Link>
        );
      })}
      <Link
        href="/logout"
        className="whitespace-nowrap rounded-lg px-3 py-2 font-medium text-ink-faint transition hover:text-danger md:mt-2 md:hover:bg-surface"
      >
        Sign out
      </Link>
    </nav>
  );
}

export default AccountNav;

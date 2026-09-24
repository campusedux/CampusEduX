"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bell, Bookmark, Briefcase, FileText, Gift, Heart, LayoutDashboard, LogOut, ShoppingBag, User, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/account/saved-projects", label: "Saved Projects", icon: Bookmark },
  { href: "/account/applications", label: "Applications", icon: Briefcase },
  { href: "/account/saved-jobs", label: "Saved Jobs", icon: Heart },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/account/wallet", label: "Wallet", icon: Wallet },
  { href: "/account/referral", label: "Referral", icon: Gift },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

/** Account navigation — horizontal scroller on phones, vertical list from md. */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Account"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 text-sm [scrollbar-width:none] md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {NAV.map((n) => {
        const active = n.href === "/account" ? pathname === "/account" : pathname.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex flex-shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 font-medium transition",
              active
                ? "bg-primary-50 text-primary"
                : "border border-line bg-card text-ink-muted hover:text-ink md:border-transparent md:bg-transparent md:hover:bg-surface",
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
            {n.label}
          </Link>
        );
      })}
      <Link
        href="/logout"
        className="inline-flex flex-shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 font-medium text-ink-faint transition hover:text-danger md:mt-2 md:hover:bg-danger/10"
      >
        <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden />
        Sign out
      </Link>
    </nav>
  );
}

export default AccountNav;

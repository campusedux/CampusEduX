"use client";

import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bell, Bookmark, Briefcase, FileText, Gift, Heart, LayoutDashboard, LogOut, ShoppingBag, User, Wallet } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ChipRow } from "@/components/ui/ChipRow";

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
    <ChipRow
      label="Account"
      className="text-sm md:flex-col md:overflow-visible"
    >
      {NAV.map((n) => {
        const active = n.href === "/account" ? pathname === "/account" : pathname.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Chip
            key={n.href}
            href={n.href}
            active={active}
            className="gap-2 whitespace-nowrap md:justify-start"
          >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
            {n.label}
          </Chip>
        );
      })}
      <Chip
        href="/logout"
        className="gap-2 whitespace-nowrap hover:text-danger md:mt-2 md:justify-start"
      >
        <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden />
        Sign out
      </Chip>
    </ChipRow>
  );
}

export default AccountNav;

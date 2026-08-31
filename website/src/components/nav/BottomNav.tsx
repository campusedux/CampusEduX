"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_TABS } from "./navConfig";
import { cn } from "@/lib/cn";

/** Hidden on focused flows where a persistent tab bar gets in the way. */
const HIDE_ON = ["/login", "/register", "/logout", "/custom-projects/start", "/custom-projects/features", "/custom-projects/estimate", "/custom-projects/checkout"];

/** Fixed bottom tab bar on mobile — mirrors `mobile-app` BottomTabNavigator. */
export function BottomNav() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 backdrop-blur md:hidden"
      aria-label="Primary"
    >
      {BOTTOM_TABS.map((tab) => {
        const active = isActive(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
              active ? "text-primary" : "text-ink-faint",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;

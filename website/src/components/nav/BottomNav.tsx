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
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line/70 bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
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
              "flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-1.5 text-[11px] font-semibold transition-colors",
              active ? "text-primary" : "text-ink-faint hover:text-ink",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                active && "bg-primary-50",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;

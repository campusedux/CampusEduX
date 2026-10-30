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
      className="fixed inset-x-0 bottom-0 z-bottom-nav flex h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] gap-2 border-t border-line/70 bg-card/95 pb-[env(safe-area-inset-bottom)] pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))] backdrop-blur-xl md:hidden"
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
              "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[11px] leading-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
              active ? "font-bold text-primary" : "font-medium text-ink-muted hover:text-ink",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-11 items-center justify-center rounded-lg transition-colors",
                active && "bg-primary/10 ring-1 ring-inset ring-primary/20 dark:bg-primary/20",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;

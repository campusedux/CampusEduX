"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronRight, Crown } from "lucide-react";
import { Drawer } from "@/components/ui";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useSessionProfile } from "@/lib/useSessionProfile";
import { loginHrefFor } from "@/lib/nav";
import { DRAWER_LINKS } from "./navConfig";
import { cn } from "@/lib/cn";

/**
 * Hamburger + slide-in drawer — mirrors `mobile-app/src/navigation/DrawerContent.tsx`.
 * Visible below `lg`; on `lg+` the horizontal `<HeaderLinks>` takes over.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useSessionProfile();

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const items = DRAWER_LINKS.filter((i) => !i.authOnly || profile);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink transition hover:bg-surface sm:h-9 sm:w-9 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} side="left">
        {/* Gradient profile header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent-violet px-5 pb-6 pt-12 text-white">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile?.avatarUrl}
                name={profile?.fullName || profile?.email || "G"}
                size="lg"
                className="border-2 border-white/40"
              />
              <div className="min-w-0">
                <div className="truncate text-base font-bold">{profile?.fullName || "Guest"}</div>
                <div className="truncate text-xs text-white/70">{profile?.email || "Not signed in"}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2.5 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
          {profile?.isPremium && (
            <span className="relative mt-3 inline-flex items-center gap-1 rounded-full bg-warning px-3 py-1 text-xs font-semibold text-amber-950">
              <Crown className="h-3 w-3" aria-hidden />
              Premium Member
            </span>
          )}
        </div>

        {/* Menu */}
        <nav className="px-3 py-3">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "mb-0.5 flex items-center justify-between rounded-xl px-3 py-2.5",
                  active ? "bg-primary-50" : "hover:bg-surface",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${item.tint}1A` }}
                  >
                    <Icon className="h-[18px] w-[18px]" style={{ color: item.tint }} aria-hidden />
                  </span>
                  <span className={cn("truncate text-[15px]", active ? "font-semibold text-primary" : "text-ink")}>
                    {item.label}
                  </span>
                </span>
                <ChevronRight className={cn("h-4 w-4", active ? "text-primary" : "text-ink-faint")} aria-hidden />
              </Link>
            );
          })}

          <div className="my-2 h-px bg-line" />

          <div className="px-3 pb-3 pt-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Appearance</p>
            <ThemeToggle variant="segmented" />
          </div>

          <div className="my-2 h-px bg-line" />

          {profile ? (
            <Link href="/logout" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10">
                <LogOut className="h-[18px] w-[18px] text-danger" aria-hidden />
              </span>
              <span className="text-[15px] font-semibold text-danger">Logout</span>
            </Link>
          ) : (
            <div className="flex flex-col gap-2 px-3 pb-2 pt-2">
              <Link
                href={loginHrefFor(pathname)}
                className="flex h-11 items-center justify-center rounded-xl bg-primary text-[15px] font-semibold text-white transition hover:bg-primary-600 active:scale-[.98] motion-reduce:active:scale-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="flex h-11 items-center justify-center rounded-xl border border-line text-[15px] font-semibold text-ink transition hover:bg-surface active:scale-[.98] motion-reduce:active:scale-100"
              >
                Create account
              </Link>
            </div>
          )}
        </nav>
      </Drawer>
    </>
  );
}

export default MobileNav;

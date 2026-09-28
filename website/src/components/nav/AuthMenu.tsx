"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  LayoutGrid,
  Briefcase,
  Bookmark,
  Wallet,
  Bell,
  FileText,
  Gift,
  Crown,
  Boxes,
} from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";
import { loginHrefFor } from "@/lib/nav";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const MENU = [
  { href: "/account", label: "My account", icon: User },
  { href: "/account/purchases", label: "My projects", icon: LayoutGrid },
  { href: "/custom-projects/my-projects", label: "My custom projects", icon: Boxes },
  { href: "/account/resume", label: "My resumes", icon: FileText },
  { href: "/account/applications", label: "Applications", icon: Briefcase },
  { href: "/account/saved-projects", label: "Saved", icon: Bookmark },
  { href: "/account/referral", label: "Refer & earn", icon: Gift },
  { href: "/account/wallet", label: "Wallet", icon: Wallet },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

/**
 * Header right-side auth control.
 * - Signed out: "Log in" (sm+) + a prominent "Get started" (→ /register); on
 *   the narrowest phones just "Log in", with "Create account" in the drawer.
 * - Signed in: avatar dropdown on lg+ (the drawer covers account below lg).
 */
export function AuthMenu() {
  const { loading, profile } = useSessionProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) return <span className="h-9 w-16 shrink-0 animate-pulse rounded-xl bg-surface sm:w-[5.25rem]" aria-hidden />;

  if (!profile) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          href={loginHrefFor(pathname)}
          className="inline-flex h-11 items-center whitespace-nowrap rounded-xl px-3 text-[0.8rem] font-semibold text-ink transition hover:bg-surface max-sm:bg-primary max-sm:text-white max-sm:hover:bg-primary-600 sm:h-9"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="hidden h-9 items-center whitespace-nowrap rounded-xl bg-primary px-4 text-[0.8rem] font-semibold text-white shadow-glow transition hover:-translate-y-px hover:bg-primary-600 active:scale-[.97] motion-reduce:transform-none sm:inline-flex"
        >
          Get started
        </Link>
      </div>
    );
  }

  const displayName = profile.fullName || profile.email;

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="rounded-full ring-2 ring-transparent transition hover:ring-primary/30 focus-visible:ring-primary"
      >
        <Avatar src={profile.avatarUrl} name={displayName} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right animate-scale-in rounded-2xl border border-line bg-card p-1.5 shadow-card-lg"
        >
          <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-3">
            <Avatar src={profile.avatarUrl} name={displayName} />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-ink">{profile.fullName || "Your account"}</div>
              {profile.email && <div className="truncate text-xs text-ink-muted">{profile.email}</div>}
            </div>
          </div>
          {profile.isPremium ? (
            <p className="mx-1 mt-1.5 inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[0.7rem] font-semibold text-amber-800 dark:text-amber-300">
              <Crown className="h-3 w-3" aria-hidden /> Premium member
            </p>
          ) : (
            <Link
              href="/premium"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1.5 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-warning/15 to-accent-pink/10 px-3 py-2 text-sm font-semibold text-ink transition hover:from-warning/25"
            >
              <Crown className="h-4 w-4 text-warning" aria-hidden />
              Upgrade to Premium
            </Link>
          )}
          <div className="my-1.5 h-px bg-line" />
          {MENU.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink transition hover:bg-surface"
              >
                <Icon className="h-4 w-4 text-ink-faint" aria-hidden />
                {m.label}
              </Link>
            );
          })}
          <div className="my-1.5 h-px bg-line" />
          <div className="px-1.5 py-1">
            <ThemeToggle variant="segmented" />
          </div>
          <div className="my-1.5 h-px bg-line" />
          <Link
            href="/logout"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Link>
        </div>
      )}
    </div>
  );
}

export default AuthMenu;

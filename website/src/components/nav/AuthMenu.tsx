"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  User,
  LogOut,
  LayoutGrid,
  Briefcase,
  Bookmark,
  Wallet,
  Bell,
  ArrowRight,
} from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";

const MENU = [
  { href: "/account", label: "My account", icon: User },
  { href: "/account/purchases", label: "My projects", icon: LayoutGrid },
  { href: "/account/applications", label: "Applications", icon: Briefcase },
  { href: "/account/saved-projects", label: "Saved", icon: Bookmark },
  { href: "/account/wallet", label: "Wallet", icon: Wallet },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

/** Header right-side auth control: "Sign in" button, or a profile dropdown. */
export function AuthMenu() {
  const { loading, profile } = useSessionProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  if (loading)
    return <span className="h-9 w-[5.25rem] shrink-0 animate-pulse rounded-xl bg-surface" aria-hidden />;

  // Signed out — always show the "Sign in" CTA (opens the login page).
  if (!profile) {
    return (
      <Link
        href="/login"
        className="group inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 px-4 text-[0.8rem] font-semibold text-white shadow-[0_4px_14px_-3px_rgba(79,57,246,0.5)] ring-1 ring-inset ring-white/15 transition-[transform,box-shadow,background-color] hover:from-primary-600 hover:to-primary-700 hover:shadow-[0_6px_20px_-3px_rgba(79,57,246,0.6)] active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transform-none"
      >
        Sign in
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
          aria-hidden
        />
      </Link>
    );
  }

  const initial = (profile.fullName?.trim()[0] || profile.email?.[0] || "A").toUpperCase();

  // Signed in — avatar dropdown on desktop; on mobile the drawer covers account.
  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-white transition hover:opacity-90"
      >
        {profile.avatarUrl ? (
          // Raw <img>: avatar host (Google / GitHub / Supabase) intentionally
          // not in next.config `remotePatterns`. 36px, fixed-size parent (no
          // CLS), in the header — never the LCP element.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-scale-in rounded-2xl border border-line bg-white p-1.5 shadow-card-lg"
        >
          <div className="px-3 py-2">
            <div className="truncate text-sm font-bold text-ink">{profile.fullName || "Your account"}</div>
            {profile.email && <div className="truncate text-xs text-ink-muted">{profile.email}</div>}
          </div>
          <div className="my-1 h-px bg-line" />
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
          <div className="my-1 h-px bg-line" />
          <Link
            href="/logout"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/5"
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

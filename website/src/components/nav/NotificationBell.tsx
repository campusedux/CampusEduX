"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";

/**
 * Header notifications icon — always visible. Signed-in users go to the
 * notifications screen; signed-out users are sent to the login page (which
 * returns them here afterwards). No unread badge: the site does not fetch a
 * count (mirrors keeping the root layout static and never inventing data).
 */
export function NotificationBell() {
  const { profile } = useSessionProfile();
  const signedIn = Boolean(profile);

  return (
    <Link
      href={signedIn ? "/account/notifications" : "/login?next=%2Faccount%2Fnotifications"}
      aria-label={signedIn ? "Notifications" : "Sign in to see notifications"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-primary/40 hover:bg-surface hover:text-primary"
    >
      <Bell className="h-5 w-5" aria-hidden />
    </Link>
  );
}

export default NotificationBell;

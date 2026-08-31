"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";
import { Button } from "@/components/ui";

/** Header right-side auth control. Replaces the old AuthNavLink. */
export function AuthMenu() {
  const { loading, profile } = useSessionProfile();

  if (loading) return <span className="h-9 w-20" aria-hidden />;

  if (!profile) {
    return (
      <Button href="/login" size="sm" variant="primary">
        Sign in
      </Button>
    );
  }

  const first = profile.fullName?.trim().split(" ")[0] || "Account";
  return (
    <Link
      href="/account"
      className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-2.5 py-1.5 text-sm font-semibold text-ink hover:bg-surface"
    >
      <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-primary">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-3.5 w-3.5" aria-hidden />
        )}
      </span>
      <span className="hidden max-w-[8rem] truncate sm:inline">{first}</span>
    </Link>
  );
}

export default AuthMenu;

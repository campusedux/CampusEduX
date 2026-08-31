"use client";

import Link from "next/link";
import { Crown, ArrowRight } from "lucide-react";
import { useSessionProfile } from "@/lib/useSessionProfile";

/**
 * Indigo "Upgrade to Premium" card — mirrors the app Home promo. Hidden for
 * users who already have Premium; shown to everyone else (incl. signed-out).
 */
export function PremiumPromo() {
  const { loading, profile } = useSessionProfile();
  if (loading || profile?.isPremium) return null;

  return (
    <Link
      href="/premium"
      className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-white shadow-card-lg transition hover:bg-primary-600"
    >
      <div className="flex-1">
        <div className="text-base font-bold">Upgrade to Premium</div>
        <p className="mt-1 text-sm text-white/80">Unlock premium projects &amp; expert prep resources.</p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-warning px-3 py-1.5 text-sm font-semibold text-[#78350F]">
          See plans
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      <Crown className="h-11 w-11 flex-shrink-0 text-warning" aria-hidden />
    </Link>
  );
}

export default PremiumPromo;

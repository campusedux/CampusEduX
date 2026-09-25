import Link from "next/link";
import { ArrowRight, Check, Crown, Gift } from "lucide-react";

// Same three claims the previous Home copy made — the full list lives in the
// admin-managed `premium_features` table shown on /premium.
const PREMIUM_POINTS = ["Priority access", "Extra placement material", "Faster support"];

/**
 * Home Premium + Referral pair. Copy only restates what the product already
 * offers (see /premium and /referral) — no invented prices or reward amounts.
 */
export function PremiumReferralCta() {
  return (
    <section className="container-page pt-14 sm:pt-20" aria-label="Premium and referral">
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-warning/30 bg-gradient-to-br from-warning/15 via-card to-accent-pink/10 p-6 sm:p-8">
          <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-warning/20 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
              <Crown className="h-3.5 w-3.5" aria-hidden /> CampusEduX Premium
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">
              Go further, faster with Premium
            </h2>
            <p className="mt-2 max-w-lg text-[15px] text-ink-muted">Everything that&apos;s free stays free — Premium adds more on top.</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {PREMIUM_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm font-medium text-ink">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15">
                    <Check className="h-3 w-3 text-success" aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <Link href="/premium" className="btn-primary mt-7 h-12 px-6">
              See Premium plans <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-accent-pink/25 bg-card p-6 sm:p-8">
          <span aria-hidden className="pointer-events-none absolute -bottom-14 -right-10 h-44 w-44 rounded-full bg-accent-pink/15 blur-2xl" />
          <div className="relative flex h-full flex-col">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-pink/10">
              <Gift className="h-6 w-6 text-accent-pink" aria-hidden />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">Refer friends, earn rewards</h2>
            <p className="mt-2 flex-1 text-[15px] text-ink-muted">
              Share your referral link — when friends join CampusEduX, you earn wallet credit.
            </p>
            <Link
              href="/referral"
              className="mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-xl border border-line bg-card px-6 text-sm font-semibold text-ink transition hover:border-accent-pink/40 hover:bg-surface"
            >
              How referrals work <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PremiumReferralCta;

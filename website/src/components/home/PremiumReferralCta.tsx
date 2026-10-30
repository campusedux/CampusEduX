import Link from "next/link";
import { ArrowRight, Check, Crown, Gift } from "lucide-react";
import { getRewardSettings, referralRewardText } from "@/lib/referral";

// Same three claims the previous Home copy made — the full list lives in the
// admin-managed `premium_features` table shown on /premium.
const PREMIUM_POINTS = ["Priority access", "Extra placement material", "Faster support"];

/**
 * Home Premium + Referral pair. Premium copy only restates what the product
 * already offers (see /premium). The referral reward line comes live from
 * `reward_settings` — the same source /referral and the mobile home banner
 * read — so it never invents a number and stays in sync across surfaces.
 */
export async function PremiumReferralCta() {
  const rewardSettings = await getRewardSettings();
  const rewardText = referralRewardText(rewardSettings);
  return (
    <section className="container-page pt-10 md:pt-14" aria-label="Premium and referral">
      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-warning/30 bg-gradient-to-br from-warning/15 via-card to-accent-pink/10 p-5">
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
              <Crown className="h-3.5 w-3.5" aria-hidden /> CampusEduX Premium
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">
              Go further, faster with Premium
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Everything that&apos;s free stays free — Premium adds more on top.</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {PREMIUM_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm font-medium text-ink">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15">
                    <Check className="h-3 w-3 text-success" aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <Link href="/premium" className="btn-primary mt-2">
              See Premium plans <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-accent-pink/25 bg-card p-5">
          <div className="relative flex h-full flex-col">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-pink/10">
                <Gift className="h-5 w-5 text-accent-pink" aria-hidden />
              </span>
              <h2 className="min-w-0 font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">Refer friends, earn rewards</h2>
            </div>
            <div className="mt-1 flex-1">
              <p className="text-sm font-semibold text-ink">{rewardText}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                Share your referral link — when friends join CampusEduX, you earn wallet credit.
              </p>
            </div>
            <Link
              href="/referral"
              className="mt-2 inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-semibold text-ink transition hover:border-accent-pink/40 hover:bg-surface"
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

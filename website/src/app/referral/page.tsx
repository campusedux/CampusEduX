import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeIndianRupee } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { ReferralHero } from "@/components/referral/ReferralHero";
import { ReferralHowItWorks } from "@/components/referral/ReferralHowItWorks";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { getRewardSettings } from "@/lib/referral";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getRewardSettings();
  return {
    title: { absolute: "CampusEduX Referral Rewards" },
    description: "Invite friends to CampusEduX and see how current referral rewards, wallet credit and eligibility work.",
    alternates: { canonical: absoluteUrl("/referral") },
    // No reward rule configured yet -> don't index a page with no terms to show.
    robots: settings ? undefined : { index: false, follow: true },
  };
}

export default async function ReferralPage() {
  const settings = await getRewardSettings();

  return (
    <div className="page-shell space-y-12">
      <JsonLd data={breadcrumbJsonLd([{ name: "Referral", path: "/referral" }])} />
      <ReferralHero
        title="Invite friends, earn wallet credit"
        subtitle="Every CampusEduX student gets a referral code. When a friend joins through it, credit is added directly to your wallet — tracked on a running dashboard in your account."
      >
        <Link
          href="/account/referral"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[0.95rem] font-semibold text-[#7A1F5C] shadow-card transition hover:-translate-y-px motion-reduce:transform-none"
        >
          Get your referral link <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </ReferralHero>

      <ReferralHowItWorks rewardOnSignup={settings?.reward_on_signup} />

      <section aria-labelledby="reward-rule-title">
        <h2 id="reward-rule-title" className="h-section">
          Current reward
        </h2>
        {settings ? (
          <div className="card mt-5 flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-success/15">
              <BadgeIndianRupee className="h-6 w-6 text-success" aria-hidden />
            </span>
            <div>
              <p className="font-display text-xl font-bold text-ink">
                {settings.bonus_type === "flat"
                  ? `₹${settings.bonus_value} per successful referral`
                  : `${settings.bonus_value}% of your friend's first order`}
              </p>
              <p className="mt-1.5 text-sm text-ink-muted">
                {settings.bonus_type === "flat" ? "" : `Capped at ₹${settings.max_payout}. `}
                {settings.reward_on_signup
                  ? "Credited as soon as a referred friend signs up."
                  : "Credited after the referred friend's first purchase."}
              </p>
              <p className="mt-3 text-xs text-ink-faint">
                Credit is valid for {settings.bonus_validity_days} days. This rule is set in the admin panel and can
                change — the app and website always show the current value.
              </p>
            </div>
          </div>
        ) : (
          <EmptyState className="mt-5" title="Reward terms coming soon" subtitle="Current terms appear here once configured." />
        )}
      </section>

      <p className="text-xs text-ink-faint">
        Referral credit lands in your CampusEduX wallet and can be spent on projects, Premium, or withdrawn per the
        wallet&apos;s rules.
      </p>
    </div>
  );
}

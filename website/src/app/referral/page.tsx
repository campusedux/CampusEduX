import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { completeSeoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeIndianRupee } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { ReferralHero } from "@/components/referral/ReferralHero";
import { ReferralHowItWorks } from "@/components/referral/ReferralHowItWorks";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { getRewardSettings, referralRewardText } from "@/lib/referral";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getRewardSettings();
  return completeSeoMetadata({
    title: { absolute: "CampusEduX Referral Rewards" },
    description: "Invite friends to CampusEduX and see how current referral rewards, wallet credit and eligibility work.",
    alternates: { canonical: absoluteUrl("/referral") },
    // No reward rule configured yet -> don't index a page with no terms to show.
    robots: settings ? undefined : { index: false, follow: true },
  });
}

export default async function ReferralPage() {
  const settings = await getRewardSettings();

  return (
    <div className="page-shell space-y-10 md:space-y-14">
      <JsonLd data={breadcrumbJsonLd([{ name: "Referral", path: "/referral" }])} />
      <Breadcrumb className="mb-4" items={[{ label: "Referral" }]} />
      <ReferralHero
        title="Invite friends, earn wallet credit"
        subtitle={referralRewardText(settings)}
      >
        <Link
          href="/account/referral"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#7A1F5C] transition hover:-translate-y-px motion-reduce:transform-none"
        >
          Get your referral link <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </ReferralHero>

      <ReferralHowItWorks rewardText={referralRewardText(settings)} />

      <section aria-labelledby="reward-rule-title">
        <h2 id="reward-rule-title" className="h-section">
          Current reward
        </h2>
        {settings ? (
          <div className="card mt-5 flex flex-col gap-3 p-4 md:flex-row md:items-start md:p-5">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-success/15">
              <BadgeIndianRupee className="h-5 w-5 text-success" aria-hidden />
            </span>
            <div>
              <p className="font-display text-xl font-bold text-ink">
                {referralRewardText(settings)}
              </p>
            </div>
          </div>
        ) : (
          <EmptyState className="mt-5" title="Reward terms unavailable" subtitle="Please contact us for current referral terms." />
        )}
      </section>

      <p className="text-xs text-ink-faint">
        Referral credit lands in your CampusEduX wallet and can be spent on projects, Premium, or withdrawn per the
        wallet&apos;s rules.
      </p>
    </div>
  );
}

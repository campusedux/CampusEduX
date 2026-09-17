import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Referral Program",
  alternates: { canonical: absoluteUrl("/referral") },
};

export default async function ReferralPage() {
  const supabase = getPublicSupabase();
  let settings: {
    bonus_type?: string;
    bonus_value?: number;
    max_payout?: number;
    reward_on_signup?: boolean;
    bonus_validity_days?: number;
  } | null = null;
  if (supabase) {
    const { data } = await supabase
      .from("reward_settings")
      .select("bonus_type,bonus_value,max_payout,reward_on_signup,bonus_validity_days")
      .eq("id", 1)
      .maybeSingle();
    settings = data;
  }

  return (
    <div className="page-shell-narrow">
      <h1 className="text-3xl font-bold text-ink">Referral Program</h1>
      <p className="mt-3 text-ink-muted">
        Every CampusEduX student gets a referral code. When a friend joins through it, credit is added directly to your
        wallet — tracked on a running dashboard in your account.
      </p>

      {settings ? (
        <div className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="font-semibold text-ink">Current reward rule</div>
          <p className="mt-2 text-sm text-ink-muted">
            {settings.bonus_type === "flat"
              ? `A flat reward of ₹${settings.bonus_value} per successful referral.`
              : `${settings.bonus_value}% of the referred student's first order (capped at ₹${settings.max_payout}).`}{" "}
            {settings.reward_on_signup
              ? "Credited as soon as a referred friend signs up."
              : "Credited after the referred friend's first purchase."}
          </p>
          <p className="mt-2 text-xs text-ink-faint">
            Credit is valid for {settings.bonus_validity_days} days. This rule is set in the admin panel and can change —
            the app and website always show the current value.
          </p>
        </div>
      ) : (
        <EmptyState className="mt-8" title="Reward terms coming soon" subtitle="Current terms appear here once configured." />
      )}

      <p className="mt-8 text-xs text-ink-faint">
        Referral credit lands in your CampusEduX wallet and can be spent on projects, Premium, or withdrawn per the
        wallet&apos;s rules.
      </p>
    </div>
  );
}

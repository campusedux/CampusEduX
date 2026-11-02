import { getPublicSupabase } from "@/lib/supabase/server";
import { cache } from "react";
import { formatINR } from "@/lib/format";

// Single source for the current referral reward rule — same `reward_settings`
// row (public SELECT policy, admin 007 / mobile 0026) the mobile app reads in
// src/services/home.service.ts, so the website and app never drift.
export type RewardSettings = {
  bonus_type?: string;
  bonus_value?: number;
  max_payout?: number;
  reward_on_signup?: boolean;
  reward_on_first_purchase?: boolean;
  bonus_validity_days?: number;
} | null;

export const getRewardSettings = cache(async (): Promise<RewardSettings> => {
  const supabase = getPublicSupabase({ fresh: true });
  if (!supabase) return null;
  const { data } = await supabase
    .from("reward_settings")
    .select("bonus_type,bonus_value,max_payout,reward_on_signup,reward_on_first_purchase,bonus_validity_days")
    .eq("id", 1)
    .maybeSingle();
  return data;
});

/**
 * One-line reward blurb for compact banners/CTAs. Never invents a number —
 * falls back to a plain sentence when the row is missing or unreadable
 * instead of rendering blank or "₹undefined". Migration 0121 disables signup
 * payouts; 0026 pays the first successful purchase.
 */
export function referralRewardText(settings: RewardSettings): string {
  if (!settings || settings.bonus_value == null || !settings.bonus_validity_days) {
    return "See the Referral page or contact us for current reward terms.";
  }
  if (settings.reward_on_first_purchase === false) return "Referral rewards are currently unavailable. Contact us for help.";
  const cap = settings.max_payout ? ` (up to ${formatINR(settings.max_payout)})` : "";
  const reward = settings.bonus_type === "percent"
    ? `${settings.bonus_value}% of your friend's first successful purchase${cap}`
    : `${formatINR(settings.bonus_value)} after your friend's first successful purchase`;
  return `Earn ${reward}. Credit is valid for ${settings.bonus_validity_days} days from the award.`;
}

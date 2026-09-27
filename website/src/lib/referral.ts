import { getPublicSupabase } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

// Single source for the current referral reward rule — same `reward_settings`
// row (public SELECT policy, admin 007 / mobile 0026) the mobile app reads in
// src/services/home.service.ts, so the website and app never drift.
export type RewardSettings = {
  bonus_type?: string;
  bonus_value?: number;
  max_payout?: number;
  reward_on_signup?: boolean;
  bonus_validity_days?: number;
} | null;

export async function getRewardSettings(): Promise<RewardSettings> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("reward_settings")
    .select("bonus_type,bonus_value,max_payout,reward_on_signup,bonus_validity_days")
    .eq("id", 1)
    .maybeSingle();
  return data;
}

/**
 * One-line reward blurb for compact banners/CTAs. Never invents a number —
 * falls back to a plain sentence when the row is missing or unreadable
 * instead of rendering blank or "₹undefined".
 */
export function referralRewardText(settings: RewardSettings): string {
  if (!settings || settings.bonus_value == null) {
    return "Check your current referral reward";
  }
  if (settings.bonus_type === "percent") {
    const cap = settings.max_payout ? ` (up to ${formatINR(settings.max_payout)})` : "";
    return `Earn ${settings.bonus_value}% of your friend's first order${cap}`;
  }
  return `Earn ${formatINR(settings.bonus_value)} per successful referral`;
}

import type { ReferralSummary } from "@/types";

/**
 * Display text for what a referral pays, from reward_settings only.
 * Returns null when the rule couldn't be read, so screens HIDE the amount
 * rather than show a default number.
 */
export function referralAmountText(summary: Pick<ReferralSummary, "referrerBonus" | "referrerBonusPercent">): string | null {
  if (summary.referrerBonus != null) return `₹${summary.referrerBonus}`;
  if (summary.referrerBonusPercent != null) return `${summary.referrerBonusPercent}% of the order`;
  return null;
}

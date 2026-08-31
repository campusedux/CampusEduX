/**
 * The referral reward rule as configured by the admin panel
 * (reward_settings row). Mirrored here so the mobile UI can explain exactly
 * what a student earns — no hard-coded ₹ amounts.
 */
export interface ReferralRewardRule {
  bonusType: "flat" | "percent";
  bonusValue: number;
  maxPayout: number;
  rewardOnSignup: boolean;
  rewardOnFirstPurchase: boolean;
}

export interface ReferralOverview {
  code: string;
  shareLink: string;
  totalReferrals: number;
  totalEarned: number;
  successfulReferrals: number;
  pendingReferrals: number;
  cancelledReferrals: number;
  /** Estimated ₹ still to be paid once pending referrals convert. */
  pendingRewards: number;
  rewardRule: ReferralRewardRule;
}

export type ReferralStatus = "successful" | "pending" | "cancelled";

export interface ReferralEntry {
  id: string;
  referredUserName: string;
  referredUserEmail: string;
  status: ReferralStatus;
  rewardAmount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface EarningsMonthPoint {
  month: string;
  amount: number;
}

export interface EarningsSummary {
  totalEarnings: number;
  totalReferrals: number;
  pendingEarnings: number;
  successfulReferrals: number;
  pendingReferrals: number;
  cancelledReferrals: number;
  monthlyTrend: EarningsMonthPoint[];
  recentEarnings: ReferralEntry[];
}

export type LeaderboardPeriod = "this_month" | "this_year" | "all_time";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  totalReferrals: number;
  totalEarned: number;
  isCurrentUser: boolean;
}

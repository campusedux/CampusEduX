import type {
  ReferralOverview,
  ReferralEntry,
  EarningsSummary,
  LeaderboardEntry,
  LeaderboardPeriod,
  ReferralStatus,
} from "@/types";

/**
 * Sample content for Module 9 (Referral). Every referral service read tries
 * Supabase first and falls back here so the 6 screens render like the
 * mockups before the database is seeded.
 */

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const SAMPLE_REFERRAL_OVERVIEW: ReferralOverview = {
  code: "ROHAN21",
  shareLink: "https://campusedux.app/ref/ROHAN21",
  totalReferrals: 25,
  totalEarned: 1250,
  successfulReferrals: 20,
  pendingReferrals: 5,
  cancelledReferrals: 0,
  pendingRewards: 500,
  rewardRule: {
    bonusType: "flat",
    bonusValue: 100,
    maxPayout: 5000,
    rewardOnSignup: false,
    rewardOnFirstPurchase: true,
  },
};

const entry = (
  id: string,
  name: string,
  email: string,
  status: ReferralStatus,
  reward: number,
  days: number
): ReferralEntry => ({
  id,
  referredUserName: name,
  referredUserEmail: email,
  status,
  rewardAmount: reward,
  createdAt: daysAgo(days),
  completedAt: status === "successful" ? daysAgo(days - 1) : null,
});

export const SAMPLE_REFERRAL_HISTORY: ReferralEntry[] = [
  entry("rf-1", "Amit Kumar", "amitkumar@email.com", "successful", 100, 2),
  entry("rf-2", "Neha Singh", "nehasingh@email.com", "successful", 100, 4),
  entry("rf-3", "Rahul Sharma", "rahulsharma@email.com", "successful", 100, 7),
  entry("rf-4", "Pooja Verma", "poojaverma@email.com", "successful", 100, 10),
  entry("rf-5", "Vikash Patel", "vikashpatel@email.com", "pending", 0, 12),
  entry("rf-6", "Manoj Gupta", "manojgupta@email.com", "cancelled", 0, 17),
];

export const SAMPLE_EARNINGS_SUMMARY: EarningsSummary = {
  totalEarnings: 1250,
  totalReferrals: 25,
  pendingEarnings: 250,
  successfulReferrals: 20,
  pendingReferrals: 5,
  cancelledReferrals: 0,
  monthlyTrend: [
    { month: "Jan", amount: 100 },
    { month: "Feb", amount: 200 },
    { month: "Mar", amount: 250 },
    { month: "Apr", amount: 300 },
    { month: "May", amount: 400 },
    { month: "Jun", amount: 500 },
  ],
  recentEarnings: SAMPLE_REFERRAL_HISTORY.filter((e) => e.status === "successful").slice(0, 3),
};

const board = (
  rank: number,
  name: string,
  email: string,
  refs: number,
  earned: number,
  isCurrentUser = false
): LeaderboardEntry => ({
  rank,
  userId: `lb-${rank}`,
  userName: name,
  userEmail: email,
  avatarUrl: null,
  totalReferrals: refs,
  totalEarned: earned,
  isCurrentUser,
});

const ALL_TIME: LeaderboardEntry[] = [
  board(1, "Rohan Verma", "rohanverma21@gmail.com", 250, 5000, true),
  board(2, "Amit Kumar", "amitkumar@email.com", 180, 3600),
  board(3, "Neha Singh", "nehasingh@email.com", 150, 3000),
  board(4, "Rahul Sharma", "rahulsharma@email.com", 120, 2400),
  board(5, "Pooja Verma", "poojaverma@email.com", 100, 2000),
  board(6, "Vikash Patel", "vikashpatel@email.com", 80, 1600),
  board(7, "Sneha Reddy", "snehareddy@email.com", 60, 1200),
  board(8, "Manoj Gupta", "manojgupta@email.com", 40, 800),
];

export function sampleLeaderboard(period: LeaderboardPeriod): LeaderboardEntry[] {
  const factor = period === "this_month" ? 0.15 : period === "this_year" ? 0.6 : 1;
  return ALL_TIME.map((e) => ({
    ...e,
    totalReferrals: Math.round(e.totalReferrals * factor),
    totalEarned: Math.round(e.totalEarned * factor),
  }));
}

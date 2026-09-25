import { supabase } from "@/lib/supabase";
import { BRAND } from "@/constants";
import type {
  ReferralOverview,
  ReferralRewardRule,
  ReferralEntry,
  EarningsSummary,
  LeaderboardEntry,
  LeaderboardPeriod,
  ReferralStatus,
} from "@/types";
import {
  SAMPLE_REFERRAL_OVERVIEW,
  SAMPLE_REFERRAL_HISTORY,
  SAMPLE_EARNINGS_SUMMARY,
  sampleLeaderboard,
} from "@/data/sampleReferralContent";

/**
 * __DEV__-only stand-in when reward_settings can't be read (table not migrated
 * / offline). Production never uses it: `getRewardRule` returns null and the
 * screens hide every amount. Mirrors the column defaults in admin 007.
 */
export const DEFAULT_REWARD_RULE: ReferralRewardRule = {
  bonusType: "flat",
  bonusValue: 100,
  maxPayout: 5000,
  rewardOnSignup: false,
  rewardOnFirstPurchase: true,
};

/** null when the row has no usable bonus_value — never a substituted default amount. */
function mapRewardRule(row: any): ReferralRewardRule | null {
  const bonusValue = row?.bonus_value == null ? NaN : Number(row.bonus_value);
  if (!Number.isFinite(bonusValue)) return null;
  const maxPayout = Number(row?.max_payout ?? 0);
  return {
    bonusType: row?.bonus_type === "percent" ? "percent" : "flat",
    bonusValue,
    maxPayout: Number.isFinite(maxPayout) ? maxPayout : 0,
    rewardOnSignup: !!row?.reward_on_signup,
    rewardOnFirstPurchase: row?.reward_on_first_purchase ?? true,
  };
}

/**
 * Plain-language description of what a referral pays, for the referral screens.
 * "UI must explain the actual rule" — driven entirely by the admin settings.
 */
export function describeRewardRule(rule: ReferralRewardRule): string {
  const earn =
    rule.bonusType === "flat"
      ? `₹${rule.bonusValue}`
      : `${rule.bonusValue}% of their first order` +
        (rule.maxPayout > 0 ? ` (up to ₹${rule.maxPayout})` : "");
  if (rule.rewardOnSignup) {
    return `You earn ${earn} as soon as a friend signs up with your code.`;
  }
  if (rule.rewardOnFirstPurchase) {
    return `A friend signs up with your code (Pending), and you earn ${earn} when they make their first purchase (Successful). The reward is credited to your wallet.`;
  }
  return `Referral rewards are currently paused by the CampusEduX team.`;
}

/** Best-effort ₹ still owed once the given pending referrals convert. */
function estimatePendingRewards(pendingCount: number, rule: ReferralRewardRule | null): number | null {
  if (!rule) return null; // rule unknown → no estimate
  if (pendingCount <= 0 || !rule.rewardOnFirstPurchase) return 0;
  // Percentage rewards depend on a future order value we can't know yet.
  return rule.bonusType === "flat" ? pendingCount * rule.bonusValue : 0;
}

function mapReferralRow(row: any): ReferralEntry {
  return {
    id: row.id,
    referredUserName: row.referred_user?.full_name || "New Member",
    referredUserEmail: row.referred_user?.email || "",
    status: row.status,
    rewardAmount: row.reward_amount ?? 0,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export const referralService = {
  /**
   * The admin-configured referral reward rule, or null when reward_settings
   * can't be read (error, no row, unusable value). In production null means
   * "unknown": callers hide every ₹ amount and estimate. DEFAULT_REWARD_RULE is
   * a __DEV__-only stand-in.
   */
  async getRewardRule(): Promise<ReferralRewardRule | null> {
    try {
      const { data, error } = await supabase
        .from("reward_settings")
        .select("bonus_type, bonus_value, max_payout, reward_on_signup, reward_on_first_purchase")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const rule = data ? mapRewardRule(data) : null;
      if (rule) return rule;
      throw new Error("reward_settings has no usable row");
    } catch (error) {
      if (__DEV__) {
        console.info(`[referral.service] getRewardRule: using default rule in dev (${(error as Error).message})`);
        return DEFAULT_REWARD_RULE;
      }
      console.info(`[referral.service] getRewardRule: rule unavailable, hiding amounts (${(error as Error).message})`);
      return null;
    }
  },

  async getOverview(userId: string): Promise<ReferralOverview> {
    try {
      const [
        { data: codeRow, error: codeError },
        { data: referralRows, error: referralError },
        rewardRule,
      ] = await Promise.all([
        // maybeSingle(): 0 rows -> { data: null, error: null }, NOT an error.
        supabase.from("referral_codes").select("code, total_referrals, total_earned").eq("user_id", userId).maybeSingle(),
        supabase.from("referrals").select("status").eq("referrer_id", userId),
        referralService.getRewardRule(),
      ]);
      // Only a genuine query error (table not migrated, network, RLS) falls back
      // to sample data. A successful query with no rows is a real new user.
      if (codeError) throw new Error(codeError.message);

      const counts = { successful: 0, pending: 0, cancelled: 0 } as Record<ReferralStatus, number>;
      if (!referralError) {
        (referralRows ?? []).forEach((r: any) => {
          counts[r.status as ReferralStatus] = (counts[r.status as ReferralStatus] ?? 0) + 1;
        });
      }

      // codeRow is created by the ensure_referral_code trigger on signup
      // (migration 0021); the `?? ""` branch is defensive only — never a
      // borrowed sample code.
      const code = codeRow?.code ?? "";
      return {
        code,
        shareLink: code ? `${BRAND.referralBaseUrl}${code}` : "",
        totalReferrals: codeRow?.total_referrals ?? 0,
        totalEarned: codeRow?.total_earned ?? 0,
        successfulReferrals: counts.successful,
        pendingReferrals: counts.pending,
        cancelledReferrals: counts.cancelled,
        pendingRewards: estimatePendingRewards(counts.pending, rewardRule),
        rewardRule,
      };
    } catch (error) {
      if (__DEV__) {
        console.info(`[referral.service] getOverview: using sample content in dev (${(error as Error).message})`);
        return SAMPLE_REFERRAL_OVERVIEW;
      }
      throw error;
    }
  },

  async getReferralHistory(userId: string, filter: "all" | ReferralStatus = "all"): Promise<ReferralEntry[]> {
    try {
      let query = supabase
        .from("referrals")
        .select("*, referred_user:profiles!referrals_referred_user_id_fkey(full_name, email)")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      // an empty history is real for a student who has not referred anyone yet.
      return (data ?? []).map(mapReferralRow);
    } catch (error) {
      if (__DEV__) {
        console.info(`[referral.service] getReferralHistory: using sample content in dev (${(error as Error).message})`);
        return filter === "all"
          ? SAMPLE_REFERRAL_HISTORY
          : SAMPLE_REFERRAL_HISTORY.filter((e) => e.status === filter);
      }
      throw error;
    }
  },

  async getEarningsSummary(userId: string): Promise<EarningsSummary> {
    let data: any[] | null = null;
    let rewardRule: ReferralRewardRule | null = null;
    try {
      const [res, rule] = await Promise.all([
        supabase
          .from("referrals")
          .select("*, referred_user:profiles!referrals_referred_user_id_fkey(full_name, email)")
          .eq("referrer_id", userId)
          .order("created_at", { ascending: false }),
        referralService.getRewardRule(),
      ]);
      if (res.error) throw new Error(res.error.message);
      data = res.data ?? [];
      rewardRule = rule;
      // empty is real for a new student — the reductions below yield all-zeros.
    } catch (error) {
      if (__DEV__) {
        console.info(`[referral.service] getEarningsSummary: using sample content in dev (${(error as Error).message})`);
        return SAMPLE_EARNINGS_SUMMARY;
      }
      throw error;
    }

    const entries = (data ?? []).map(mapReferralRow);
    const successful = entries.filter((e) => e.status === "successful");
    const pending = entries.filter((e) => e.status === "pending");
    const cancelled = entries.filter((e) => e.status === "cancelled");

    const totalEarnings = successful.reduce((sum, e) => sum + e.rewardAmount, 0);
    // Estimated from the admin's current reward rule, not a hard-coded ₹100.
    const pendingEarnings = estimatePendingRewards(pending.length, rewardRule);

    const monthBuckets = new Map<string, number>();
    successful.forEach((e) => {
      const date = new Date(e.completedAt ?? e.createdAt);
      const key = date.toLocaleString("en-US", { month: "short" });
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + e.rewardAmount);
    });
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    const last6Months = Array.from({ length: 6 }, (_, i) => monthOrder[(currentMonthIndex - 5 + i + 12) % 12]);
    const monthlyTrend = last6Months.map((month) => ({ month, amount: monthBuckets.get(month) ?? 0 }));

    return {
      totalEarnings,
      totalReferrals: entries.length,
      pendingEarnings,
      successfulReferrals: successful.length,
      pendingReferrals: pending.length,
      cancelledReferrals: cancelled.length,
      monthlyTrend,
      recentEarnings: entries.slice(0, 5),
    };
  },

  async getLeaderboard(period: LeaderboardPeriod, currentUserId: string): Promise<LeaderboardEntry[]> {
    // DB-15: the `referrals` table is readable only by the two parties, so the
    // board is served by the aggregated `referral_leaderboard` RPC (top 50 +
    // the caller's own row; other users' ids/emails/avatars are never exposed).
    let data: any[] | null = null;
    try {
      const res = await supabase.rpc("referral_leaderboard", { p_period: period });
      if (res.error) throw new Error(res.error.message);
      data = res.data;
    } catch (error) {
      if (__DEV__) {
        console.info(`[referral.service] getLeaderboard: using sample content in dev (${(error as Error).message})`);
        return sampleLeaderboard(period);
      }
      throw error;
    }
    // No successful referrals yet this period is a real, honest empty state —
    // never substitute unrelated sample leaderboard entries for it.
    return (data ?? []).map((row: any) => ({
      rank: Number(row.rank),
      userId: row.user_id ?? "",
      userName: row.display_name || "CampusEduX Member",
      userEmail: "",
      avatarUrl: null,
      totalReferrals: Number(row.total_referrals ?? 0),
      totalEarned: Number(row.total_earned ?? 0),
      isCurrentUser: Boolean(row.is_current_user) || (!!row.user_id && row.user_id === currentUserId),
    }));
  },
};

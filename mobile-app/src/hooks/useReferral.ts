import { useQuery } from "@tanstack/react-query";
import { referralService } from "@/services/referral.service";
import { useAuthStore } from "@/store/authStore";
import type { ReferralStatus, LeaderboardPeriod } from "@/types";

export const referralQueryKeys = {
  overview: ["referral", "overview"] as const,
  history: (filter: "all" | ReferralStatus) => ["referral", "history", filter] as const,
  earnings: ["referral", "earnings"] as const,
  leaderboard: (period: LeaderboardPeriod) => ["referral", "leaderboard", period] as const,
};

export const useReferralOverview = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: referralQueryKeys.overview,
    queryFn: () => referralService.getOverview(userId as string),
    enabled: !!userId,
  });
};

export const useReferralHistory = (filter: "all" | ReferralStatus = "all") => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: referralQueryKeys.history(filter),
    queryFn: () => referralService.getReferralHistory(userId as string, filter),
    enabled: !!userId,
  });
};

export const useEarningsSummary = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: referralQueryKeys.earnings,
    queryFn: () => referralService.getEarningsSummary(userId as string),
    enabled: !!userId,
  });
};

export const useLeaderboard = (period: LeaderboardPeriod) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: referralQueryKeys.leaderboard(period),
    queryFn: () => referralService.getLeaderboard(period, userId as string),
    enabled: !!userId,
  });
};

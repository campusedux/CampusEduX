import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { homeService } from "@/services/home.service";
import { useAuthStore } from "@/store/authStore";
import { academicFromUser, academicKey } from "@/lib/personalization";

export const homeQueryKeys = {
  categories: ["categories"] as const,
  trending: (academic = "") => ["projects", "trending", academic] as const,
  premium: ["projects", "premium"] as const,
  bestSellers: ["projects", "best-sellers"] as const,
  newArrivals: ["projects", "new-arrivals"] as const,
  latestJobs: (academic = "") => ["jobs", "latest", academic] as const,
  notifications: ["notifications"] as const,
  offers: ["offer-banners"] as const,
  referral: ["referral-summary"] as const,
  search: (query: string) => ["search", query] as const,
};

/** The signed-in student's academic profile, for content personalization. */
export const useAcademicProfile = () => {
  const user = useAuthStore((s) => s.user);
  return academicFromUser(user);
};

/**
 * Drops every academic-dependent cache so the next render refetches content for
 * the student's new course / branch / year (spec §21, §22). The lists it clears
 * are all now RLS-scoped to the student's course + branch (migration 0036), so
 * stale content for the previous course/branch can't linger. Call it right
 * after persisting an academic change. `companies` covers the company-jobs
 * cache (keyed under ["companies", "jobs", …]).
 */
export const useInvalidateAcademicContent = () => {
  const queryClient = useQueryClient();
  return useCallback(() => {
    for (const key of ["projects", "jobs", "notes", "categories", "search", "companies"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [queryClient]);
};

export const useCategories = () =>
  useQuery({ queryKey: homeQueryKeys.categories, queryFn: homeService.getCategories });

export const useTrendingProjects = () => {
  const academic = useAcademicProfile();
  return useQuery({
    queryKey: homeQueryKeys.trending(academicKey(academic)),
    queryFn: () => homeService.getTrendingProjects(5, academic),
  });
};

export const usePremiumProjects = () =>
  useQuery({ queryKey: homeQueryKeys.premium, queryFn: () => homeService.getPremiumProjects() });

export const useBestSellers = () =>
  useQuery({ queryKey: homeQueryKeys.bestSellers, queryFn: () => homeService.getBestSellers() });

export const useNewArrivals = () =>
  useQuery({ queryKey: homeQueryKeys.newArrivals, queryFn: () => homeService.getNewArrivals() });

export const useLatestJobs = () => {
  const academic = useAcademicProfile();
  return useQuery({
    queryKey: homeQueryKeys.latestJobs(academicKey(academic)),
    queryFn: () => homeService.getLatestJobs(10, academic),
  });
};

export const useNotifications = () =>
  useQuery({ queryKey: homeQueryKeys.notifications, queryFn: homeService.getNotifications });

export const useOfferBanners = () =>
  useQuery({ queryKey: homeQueryKeys.offers, queryFn: homeService.getOfferBanners });

export const useReferralSummary = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: homeQueryKeys.referral,
    queryFn: () => homeService.getReferralSummary(userId as string),
    enabled: !!userId,
  });
};

export const useSearchAll = (query: string) =>
  useQuery({
    queryKey: homeQueryKeys.search(query),
    queryFn: () => homeService.searchAll(query),
    enabled: query.trim().length > 1,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeService.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: homeQueryKeys.notifications }),
  });
};

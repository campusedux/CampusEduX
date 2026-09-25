import type {
  Project,
  Review,
  RatingBreakdown,
} from "@/types";
import {
  SAMPLE_TRENDING,
  SAMPLE_PREMIUM,
  SAMPLE_BEST_SELLERS,
  SAMPLE_NEW_ARRIVALS,
  SAMPLE_SEARCH_PROJECTS,
} from "./sampleHomeContent";

/**
 * Sample content for Module 3 (Projects). Every project service call tries
 * Supabase first and falls back to this data so the marketplace screens
 * render like the mockups before the database is seeded.
 */

/** De-duplicated pool of every sample project, used by the browse/search screens. */
export const SAMPLE_ALL_PROJECTS: Project[] = (() => {
  const seen = new Set<string>();
  const pool = [
    ...SAMPLE_TRENDING,
    ...SAMPLE_PREMIUM,
    ...SAMPLE_BEST_SELLERS,
    ...SAMPLE_NEW_ARRIVALS,
    ...SAMPLE_SEARCH_PROJECTS,
  ];
  return pool.filter((p) => (seen.has(p.title) ? false : (seen.add(p.title), true)));
})();

export function sampleReviews(): { reviews: Review[]; breakdown: RatingBreakdown } {
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
  const reviews: Review[] = [
    {
      id: "rv-1",
      projectId: "sample",
      userName: "Rahul Sharma",
      userAvatarUrl: null,
      rating: 5,
      comment: "Great project! Well structured and easy to customize.",
      createdAt: daysAgo(2),
    },
    {
      id: "rv-2",
      projectId: "sample",
      userName: "Priya Verma",
      userAvatarUrl: null,
      rating: 4,
      comment: "Nice work. Documentation is helpful.",
      createdAt: daysAgo(7),
    },
    {
      id: "rv-3",
      projectId: "sample",
      userName: "Amit Kumar",
      userAvatarUrl: null,
      rating: 5,
      comment: "Perfect for learning. Recommended!",
      createdAt: daysAgo(14),
    },
  ];
  return {
    reviews,
    breakdown: { average: 4.6, totalReviews: 28, counts: { 1: 1, 2: 1, 3: 1, 4: 6, 5: 18 } },
  };
}

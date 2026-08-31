import type {
  Project,
  ProjectDetail,
  Review,
  RatingBreakdown,
  PurchasedProject,
  DownloadRecord,
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

const DETAIL_IMAGES: string[] = [];

export function sampleProjectDetail(projectId: string): ProjectDetail {
  const base =
    SAMPLE_ALL_PROJECTS.find((p) => p.id === projectId) ??
    SAMPLE_ALL_PROJECTS[0] ?? {
      id: projectId,
      title: "E-Commerce Website",
      categoryId: "web-development",
      categoryName: "Web Development",
      techStack: ["React", "Node.js", "MongoDB"],
      price: 499,
      rating: 4.6,
      reviewCount: 28,
      thumbnailUrl: null,
      isPremium: false,
      isBestSeller: true,
      salesCount: 210,
      createdAt: "2025-05-15T00:00:00.000Z",
    };

  return {
    ...base,
    id: projectId,
    description:
      "A complete e-commerce website with user authentication, product management, cart, orders and payment integration. Includes an admin panel, responsive UI and clean, well-documented source code.",
    images: DETAIL_IMAGES,
    videoUrl: null,
    liveDemoUrl: "https://demo.campusedux.app/ecommerce",
    sourceCodeSizeMB: 45.6,
    documentationSizeMB: 2.7,
    platformFeePercent: 2,
    isWishlisted: false,
  };
}

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

export function sampleWishlist(): Project[] {
  return SAMPLE_ALL_PROJECTS.filter((p) =>
    ["E-Commerce Website", "AI Chat Application", "Portfolio Website", "Chat Application"].includes(p.title)
  );
}

export function samplePurchased(): PurchasedProject[] {
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
  const pick = (title: string) => SAMPLE_ALL_PROJECTS.find((p) => p.title === title) ?? SAMPLE_ALL_PROJECTS[0];
  return [
    { orderId: "ord-1001", project: pick("E-Commerce Website"), purchasedAt: daysAgo(9) },
    { orderId: "ord-1002", project: pick("Chat Application"), purchasedAt: daysAgo(22) },
    { orderId: "ord-1003", project: pick("AI Chat Application"), purchasedAt: daysAgo(32) },
    { orderId: "ord-1004", project: pick("Portfolio Website"), purchasedAt: daysAgo(47) },
  ];
}

export function sampleDownloads(): DownloadRecord[] {
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
  return [
    { id: "dl-1", projectId: "p1", projectTitle: "E-Commerce Website", fileLabel: "Source Code (ZIP)", fileSizeMB: 25.4, downloadedAt: daysAgo(9) },
    { id: "dl-2", projectId: "p2", projectTitle: "Chat Application", fileLabel: "Source Code (ZIP)", fileSizeMB: 18.7, downloadedAt: daysAgo(22) },
    { id: "dl-3", projectId: "p3", projectTitle: "AI Chat Application", fileLabel: "Documentation (PDF)", fileSizeMB: 12.1, downloadedAt: daysAgo(32) },
    { id: "dl-4", projectId: "p4", projectTitle: "Portfolio Website", fileLabel: "Source Code (ZIP)", fileSizeMB: 8.9, downloadedAt: daysAgo(47) },
  ];
}

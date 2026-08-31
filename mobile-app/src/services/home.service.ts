import { supabase } from "@/lib/supabase";
import { BRAND } from "@/constants";
import { rankByAcademicRelevance, type AcademicProfile } from "@/lib/personalization";
import type { Project, ProjectCategory, Job, AppNotification, ReferralSummary, OfferBanner } from "@/types";
import {
  SAMPLE_CATEGORIES,
  SAMPLE_TRENDING,
  SAMPLE_PREMIUM,
  SAMPLE_BEST_SELLERS,
  SAMPLE_NEW_ARRIVALS,
  SAMPLE_LATEST_JOBS,
  SAMPLE_SEARCH_PROJECTS,
  SAMPLE_OFFERS,
  SAMPLE_REFERRAL,
  buildSampleNotifications,
} from "@/data/sampleHomeContent";

function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? row.category_name ?? "",
    techStack: row.tech_stack ?? [],
    price: row.price,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    thumbnailUrl: row.thumbnail_url ?? null,
    isPremium: row.is_premium ?? false,
    isBestSeller: row.is_best_seller ?? false,
    salesCount: row.sales_count ?? 0,
    createdAt: row.created_at,
  };
}

function mapJobRow(row: any): Job {
  const postedDate = new Date(row.posted_at ?? row.created_at);
  const daysAgo = Math.max(0, Math.floor((Date.now() - postedDate.getTime()) / 86_400_000));
  return {
    id: row.id,
    title: row.title,
    companyId: row.company_id ?? "",
    companyName: row.company_name,
    companyLogoUrl: row.company_logo_url ?? null,
    location: row.location,
    salaryRange: row.salary_range,
    postedAt: daysAgo === 0 ? "Today" : `${daysAgo}d ago`,
    jobType: row.job_type ?? "Full Time",
    isNew: daysAgo <= 3,
  };
}

/**
 * Runs a Supabase query and returns its rows.
 *
 * On error (e.g. the table has not been created yet) the sample data is used so
 * the Home screens still match the designs before the backend exists.
 *
 * `fallbackWhenEmpty` controls what happens when the query SUCCEEDS but returns
 * no rows: for shared catalog content (categories, trending, …) we still show
 * sample data so the marketplace never looks dead; for per-user content
 * (notifications) an empty result is real — a new student genuinely has none —
 * so it is passed straight through.
 */
async function withFallback<T>(
  label: string,
  run: () => Promise<T[]>,
  sample: T[],
  fallbackWhenEmpty = true
): Promise<T[]> {
  try {
    const rows = await run();
    if (rows.length > 0) return rows;
    return fallbackWhenEmpty ? sample : rows;
  } catch (error) {
    console.info(`[home.service] ${label}: using sample content (${(error as Error).message})`);
    return sample;
  }
}

export const homeService = {
  async getCategories(): Promise<ProjectCategory[]> {
    return withFallback(
      "categories",
      async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, icon, project_count")
          .order("project_count", { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          icon: row.icon,
          projectCount: row.project_count ?? 0,
        }));
      },
      SAMPLE_CATEGORIES
    );
  },

  async getTrendingProjects(limit = 5, academic?: AcademicProfile): Promise<Project[]> {
    return withFallback(
      "trending",
      async () => {
        // Pull a wider slice so branch-relevant projects can surface even when
        // they aren't in the global top-N by sales, then re-rank + trim.
        const { data, error } = await supabase
          .from("projects")
          .select("*, category:categories(name)")
          .order("sales_count", { ascending: false })
          .limit(academic ? Math.max(limit * 4, 20) : limit);
        if (error) throw new Error(error.message);
        const ranked = academic ? rankByAcademicRelevance(data ?? [], academic) : data ?? [];
        return ranked.slice(0, limit).map(mapProjectRow);
      },
      SAMPLE_TRENDING
    );
  },

  async getPremiumProjects(limit = 10): Promise<Project[]> {
    return withFallback(
      "premium",
      async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("*, category:categories(name)")
          .eq("is_premium", true)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapProjectRow);
      },
      SAMPLE_PREMIUM
    );
  },

  async getBestSellers(limit = 10): Promise<Project[]> {
    return withFallback(
      "best-sellers",
      async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("*, category:categories(name)")
          .eq("is_best_seller", true)
          .order("sales_count", { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapProjectRow);
      },
      SAMPLE_BEST_SELLERS
    );
  },

  async getNewArrivals(limit = 10): Promise<Project[]> {
    return withFallback(
      "new-arrivals",
      async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("*, category:categories(name)")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapProjectRow);
      },
      SAMPLE_NEW_ARRIVALS
    );
  },

  async getLatestJobs(limit = 10, academic?: AcademicProfile): Promise<Job[]> {
    return withFallback(
      "latest-jobs",
      async () => {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .order("posted_at", { ascending: false })
          .limit(academic ? Math.max(limit * 3, 20) : limit);
        if (error) throw new Error(error.message);
        const ranked = academic ? rankByAcademicRelevance(data ?? [], academic) : data ?? [];
        return ranked.slice(0, limit).map(mapJobRow);
      },
      SAMPLE_LATEST_JOBS
    );
  },

  async getNotifications(): Promise<AppNotification[]> {
    return withFallback(
      "notifications",
      async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw new Error(error.message);
        return (data ?? []).map(
          (row): AppNotification => ({
            id: row.id,
            title: row.title,
            body: row.body,
            category: row.category,
            isRead: row.is_read ?? false,
            createdAt: row.created_at,
            imageUrl: row.image_url ?? null,
          })
        );
      },
      buildSampleNotifications(),
      // per-user: a new student has no notifications — show an empty list, not
      // someone else's sample notifications.
      false
    );
  },

  async markNotificationRead(id: string) {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw new Error(error.message);
    } catch {
      // Sample notifications have no backing row — nothing to persist.
    }
  },

  async getOfferBanners(): Promise<OfferBanner[]> {
    return withFallback(
      "offer-banners",
      async () => {
        const { data, error } = await supabase
          .from("offer_banners")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          discountLabel: row.discount_label,
          couponCode: row.coupon_code,
        }));
      },
      SAMPLE_OFFERS
    );
  },

  async searchAll(query: string): Promise<{ projects: Project[]; jobs: Job[] }> {
    try {
      const [{ data: projectRows, error: projectError }, { data: jobRows, error: jobError }] = await Promise.all([
        supabase.from("projects").select("*, category:categories(name)").ilike("title", `%${query}%`).limit(20),
        supabase.from("jobs").select("*").ilike("title", `%${query}%`).limit(20),
      ]);
      if (projectError) throw new Error(projectError.message);
      if (jobError) throw new Error(jobError.message);
      const projects = (projectRows ?? []).map(mapProjectRow);
      const jobs = (jobRows ?? []).map(mapJobRow);
      if (projects.length > 0 || jobs.length > 0) return { projects, jobs };
      throw new Error("no rows");
    } catch {
      const q = query.trim().toLowerCase();
      const projects = SAMPLE_SEARCH_PROJECTS.filter((p) => p.title.toLowerCase().includes(q));
      const jobs = SAMPLE_LATEST_JOBS.filter((j) => j.title.toLowerCase().includes(q));
      return {
        projects: projects.length || jobs.length ? projects : SAMPLE_SEARCH_PROJECTS,
        jobs,
      };
    }
  },

  async getReferralSummary(userId: string): Promise<ReferralSummary> {
    // Per-user (not catalog): only fall back to SAMPLE_REFERRAL on a genuine
    // query error. A new student has a real referral_codes row (created by the
    // ensure_referral_code trigger, migration 0021) with zeroed totals.
    try {
      const [{ data, error }, { data: reward }] = await Promise.all([
        supabase
          .from("referral_codes")
          .select("code, total_referrals, total_earned")
          .eq("user_id", userId)
          .maybeSingle(),
        // reward_settings has a public SELECT policy (admin 007); drives the
        // "earn ₹X" copy on the home referral banner instead of a hard-coded 100.
        supabase
          .from("reward_settings")
          .select("bonus_type, bonus_value")
          .eq("id", 1)
          .maybeSingle(),
      ]);
      if (error) throw new Error(error.message);
      const code = data?.code ?? "";
      const referrerBonus =
        reward && reward.bonus_type !== "percent" ? Number(reward.bonus_value ?? 100) : 100;
      return {
        code,
        shareLink: code ? `${BRAND.referralBaseUrl}/${code}` : "",
        totalReferrals: data?.total_referrals ?? 0,
        totalEarned: data?.total_earned ?? 0,
        referrerBonus,
        refereeDiscountPercent: 20,
      };
    } catch {
      return SAMPLE_REFERRAL;
    }
  },
};

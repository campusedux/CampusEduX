import { supabase } from "@/lib/supabase";
import { BRAND } from "@/constants";
import { cleanText, timeAgo, formatSalary, isUsableImageUrl } from "@/lib/homeFormat";
import { rankByAcademicRelevance, type AcademicProfile } from "@/lib/personalization";
import type { Project, ProjectCategory, Job, AppNotification, ReferralSummary, OfferBanner } from "@/types";
import {
  SAMPLE_CATEGORIES,
  SAMPLE_PREMIUM,
  SAMPLE_BEST_SELLERS,
  SAMPLE_NEW_ARRIVALS,
  SAMPLE_OFFERS,
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
 * Home-only mappers: normalise raw rows into clean display values and return
 * null for rows that can't be shown (no title / no company) so they're dropped.
 */
function mapCleanProject(row: any): Project | null {
  const title = cleanText(row.title);
  if (!title) return null;
  const price = Number(row.price);
  return {
    ...mapProjectRow(row),
    title,
    categoryName: cleanText(row.category?.name ?? row.category_name),
    techStack: (Array.isArray(row.tech_stack) ? row.tech_stack : []).map(cleanText).filter(Boolean),
    price: Number.isFinite(price) ? price : (undefined as unknown as number),
    thumbnailUrl: isUsableImageUrl(row.thumbnail_url) ? row.thumbnail_url.trim() : null,
  };
}

function mapCleanJob(row: any): Job | null {
  const title = cleanText(row.title);
  const companyName = cleanText(row.company_name);
  if (!title || !companyName) return null;
  const posted = row.posted_at ?? row.created_at;
  const days = Math.floor((Date.now() - new Date(posted).getTime()) / 86_400_000);
  return {
    ...mapJobRow(row),
    title,
    companyName,
    location: cleanText(row.location),
    salaryRange: formatSalary(row.salary_range),
    postedAt: timeAgo(posted),
    isNew: Number.isFinite(days) && days <= 3,
    companyLogoUrl: isUsableImageUrl(row.company_logo_url) ? row.company_logo_url.trim() : null,
  };
}

const notNull = <T,>(v: T | null): v is T => v !== null;

/**
 * Runs a Supabase query and returns its rows.
 *
 * A real empty result is always returned as-is (the screen shows its honest
 * EmptyState / hides the section). A query failure throws so the hook reports
 * `isError` (ErrorState + retry). Sample rows are a `__DEV__`-only stand-in
 * for a failed query — never in a production build.
 */
async function withFallback<T>(label: string, run: () => Promise<T[]>, sample: T[]): Promise<T[]> {
  try {
    return await run();
  } catch (error) {
    if (__DEV__) {
      console.info(`[home.service] ${label}: using sample content in dev (${(error as Error).message})`);
      return sample;
    }
    throw error instanceof Error ? error : new Error(String(error));
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

  /** Real rows only: errors propagate and an empty table yields [] — never sample data. */
  async getTrendingProjects(limit = 5, academic?: AcademicProfile): Promise<Project[]> {
    // Pull a wider slice so branch-relevant projects can surface even when
    // they aren't in the global top-N by sales, then re-rank + trim.
    const { data, error } = await supabase
      .from("projects")
      .select("*, category:categories(name)")
      .eq("status", "published")
      .order("sales_count", { ascending: false })
      .limit(academic ? Math.max(limit * 4, 20) : Math.max(limit * 2, 10));
    if (error) throw new Error(error.message);
    const ranked = academic ? rankByAcademicRelevance(data ?? [], academic) : data ?? [];
    return ranked.map(mapCleanProject).filter(notNull).slice(0, limit);
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

  /** Real rows only: errors propagate and an empty table yields [] — never sample data. */
  async getLatestJobs(limit = 10, academic?: AcademicProfile): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("posted_at", { ascending: false })
      .limit(academic ? Math.max(limit * 3, 20) : Math.max(limit * 2, 10));
    if (error) throw new Error(error.message);
    const ranked = academic ? rankByAcademicRelevance(data ?? [], academic) : data ?? [];
    return ranked.map(mapCleanJob).filter(notNull).slice(0, limit);
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
      buildSampleNotifications()
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

  /** Real rows only: no match → empty result, error → throws. Never returns sample projects. */
  async searchAll(query: string): Promise<{ projects: Project[]; jobs: Job[] }> {
    const [{ data: projectRows, error: projectError }, { data: jobRows, error: jobError }] = await Promise.all([
      supabase.from("projects").select("*, category:categories(name)").ilike("title", `%${query}%`).limit(20),
      supabase.from("jobs").select("*").ilike("title", `%${query}%`).limit(20),
    ]);
    if (projectError) throw new Error(projectError.message);
    if (jobError) throw new Error(jobError.message);
    return { projects: (projectRows ?? []).map(mapProjectRow), jobs: (jobRows ?? []).map(mapJobRow) };
  },

  /**
   * Per-user and real only. A failed read of the user's own code THROWS (ErrorState
   * + retry) — no borrowed code or link is ever returned. A new student has a real
   * referral_codes row (ensure_referral_code trigger, migration 0021) with zeroed
   * totals. Reward amounts come from reward_settings only; if that row can't be
   * read they are `null` and the screens hide the amount text.
   */
  async getReferralSummary(userId: string): Promise<ReferralSummary> {
    const [{ data, error }, rewardRes] = await Promise.all([
      supabase
        .from("referral_codes")
        .select("code, total_referrals, total_earned")
        .eq("user_id", userId)
        .maybeSingle(),
      // reward_settings has a public SELECT policy (admin 007).
      supabase
        .from("reward_settings")
        .select("bonus_type, bonus_value, reward_on_signup, reward_on_first_purchase")
        .eq("id", 1)
        .maybeSingle(),
    ]);
    if (error) throw new Error(error.message);
    const reward = rewardRes.error ? null : rewardRes.data;
    const bonusValue = reward && reward.bonus_value != null ? Number(reward.bonus_value) : null;
    const validBonus = bonusValue !== null && Number.isFinite(bonusValue);
    const code = data?.code ?? "";
    return {
      code,
      shareLink: code ? `${BRAND.referralBaseUrl}${code}` : "",
      totalReferrals: data?.total_referrals ?? 0,
      totalEarned: data?.total_earned ?? 0,
      referrerBonus: validBonus && reward?.bonus_type !== "percent" ? bonusValue : null,
      referrerBonusPercent: validBonus && reward?.bonus_type === "percent" ? bonusValue : null,
      rewardOnSignup: reward ? !!reward.reward_on_signup : null,
      rewardOnFirstPurchase: reward ? reward.reward_on_first_purchase ?? true : null,
    };
  },
};

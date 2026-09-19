import { compactRows } from "@/lib/safeRows";
import { supabase } from "@/lib/supabase";
import { rankByAcademicRelevance, type AcademicProfile } from "@/lib/personalization";
import type { Project, ProjectDetail, ProjectFilters, Review, RatingBreakdown, PurchasedProject, DownloadRecord } from "@/types";
import {
  SAMPLE_ALL_PROJECTS,
  sampleReviews,
} from "@/data/sampleProjectContent";

const PROJECT_SELECT = "*, category:categories(name)";
const PAGE_SIZE = 20;
// `project-files` is a private bucket (RLS-gated on purchase ownership); URLs
// are minted fresh per fetch, so an hour is plenty to cover the download.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Returns `run()`'s rows. A real empty result is always returned as-is (honest
 * EmptyState). A failure throws so the hook reports `isError` (ErrorState +
 * retry). Pass `sample` for catalog reads to get a `__DEV__`-only stand-in;
 * omit it for per-user / purchase reads (wishlist, purchases, downloads) so
 * fabricated rows can never appear, even in development.
 */
async function orSample<T>(label: string, run: () => Promise<T[]>, sample?: T[]): Promise<T[]> {
  try {
    return await run();
  } catch (error) {
    if (__DEV__ && sample) {
      console.info(`[project.service] ${label}: using sample content in dev (${(error as Error).message})`);
      return sample;
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function matchesFilters(p: Project, f: Partial<ProjectFilters>): boolean {
  if (f.categoryId && p.categoryId !== f.categoryId) return false;
  if (typeof f.minPrice === "number" && p.price < f.minPrice) return false;
  if (typeof f.maxPrice === "number" && f.maxPrice < 1000 && p.price > f.maxPrice) return false;
  if (f.minRating && p.rating < f.minRating) return false;
  if (f.technologies && f.technologies.length > 0 && !f.technologies.some((t) => p.techStack.includes(t))) return false;
  return true;
}

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

function mapProjectDetailRow(row: any, isWishlisted: boolean): ProjectDetail {
  return {
    ...mapProjectRow(row),
    description: row.description ?? "",
    images: row.images ?? [],
    videoUrl: row.video_url ?? null,
    liveDemoUrl: row.live_demo_url ?? null,
    sourceCodeSizeMB: row.source_code_size_mb ?? 0,
    documentationSizeMB: row.documentation_size_mb ?? 0,
    platformFeePercent: row.platform_fee_percent ?? 2,
    isWishlisted,
  };
}

function applyFilters(query: any, filters: Partial<ProjectFilters>) {
  let q = query;
  if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
  if (typeof filters.minPrice === "number") q = q.gte("price", filters.minPrice);
  if (typeof filters.maxPrice === "number") q = q.lte("price", filters.maxPrice);
  if (filters.minRating) q = q.gte("rating", filters.minRating);
  if (filters.technologies && filters.technologies.length > 0) q = q.overlaps("tech_stack", filters.technologies);

  switch (filters.sortBy) {
    case "latest":
      return q.order("created_at", { ascending: false });
    case "price":
      return q.order("price", { ascending: true });
    default:
      return q.order("sales_count", { ascending: false });
  }
}

export const projectService = {
  async getAllProjects(
    filters: Partial<ProjectFilters> = {},
    page = 0,
    academic?: AcademicProfile
  ): Promise<{ projects: Project[]; hasMore: boolean }> {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    try {
      const { data, error } = await applyFilters(supabase.from("projects").select(PROJECT_SELECT), filters).range(from, to);
      if (error) throw new Error(error.message);
      // The DB (RLS, migration 0036) has already restricted this page to the
      // student's GLOBAL + Course + Branch content — filtering happens before
      // pagination, server-side (spec §8, §17). Client-side ranking only
      // re-orders what is already authorised (spec §16).
      const ordered = academic ? rankByAcademicRelevance(data ?? [], academic) : data ?? [];
      const projects = ordered.map(mapProjectRow);
      // An empty page is a real answer for this student — show the empty state,
      // not unrelated sample marketplace rows (spec §18). Sample content is a
      // __DEV__-only stand-in for a genuine query failure.
      return { projects, hasMore: projects.length === PAGE_SIZE };
    } catch (error) {
      if (__DEV__) {
        console.info(`[project.service] getAllProjects: using sample content in dev (${(error as Error).message})`);
        const projects = page === 0 ? SAMPLE_ALL_PROJECTS.filter((p) => matchesFilters(p, filters)) : [];
        return { projects, hasMore: false };
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  },

  async getCategoryProjects(categoryId: string): Promise<Project[]> {
    return orSample(
      "getCategoryProjects",
      async () => {
        const { data, error } = await supabase
          .from("projects")
          .select(PROJECT_SELECT)
          .eq("category_id", categoryId)
          .order("sales_count", { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapProjectRow);
      },
      SAMPLE_ALL_PROJECTS.filter((p) => p.categoryId === categoryId)
    );
  },

  async searchProjects(query: string): Promise<Project[]> {
    return orSample(
      "searchProjects",
      async () => {
        const { data, error } = await supabase.from("projects").select(PROJECT_SELECT).ilike("title", `%${query}%`).limit(30);
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapProjectRow);
      }
      // no sample: a search never returns rows that didn't match the query
    );
  },

  /**
   * Real rows only — NO sample fallback, not even in __DEV__. Buy / Payment /
   * Download all read this, so a project that didn't come from Supabase must
   * never reach the checkout path. Errors and missing rows throw (ErrorState + retry).
   */
  async getProjectDetail(projectId: string, userId?: string): Promise<ProjectDetail> {
    const [{ data: row, error }, wishlisted] = await Promise.all([
      supabase.from("projects").select(PROJECT_SELECT).eq("id", projectId).single(),
      userId ? projectService.isWishlisted(projectId, userId) : Promise.resolve(false),
    ]);
    if (error || !row) throw new Error("Project not found.");
    return mapProjectDetailRow(row, wishlisted);
  },

  async getSimilarProjects(projectId: string, categoryId: string, limit = 10): Promise<Project[]> {
    return orSample(
      "getSimilarProjects",
      async () => {
        const { data, error } = await supabase
          .from("projects")
          .select(PROJECT_SELECT)
          .eq("category_id", categoryId)
          .neq("id", projectId)
          .limit(limit);
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapProjectRow);
      },
      SAMPLE_ALL_PROJECTS.filter((p) => p.id !== projectId).slice(0, limit)
    );
  },

  async getReviews(projectId: string): Promise<{ reviews: Review[]; breakdown: RatingBreakdown }> {
    let data: any[] | null = null;
    try {
      const res = await supabase
        .from("reviews")
        .select("*, profile:profiles(full_name, avatar_url)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (res.error) throw new Error(res.error.message);
      data = res.data ?? [];
      // an empty list is real (nobody has reviewed this project yet) — only fall
      // back to sample reviews when the query itself failed.
    } catch (error) {
      if (__DEV__) {
        console.info(`[project.service] getReviews: using sample content in dev (${(error as Error).message})`);
        return sampleReviews();
      }
      throw error instanceof Error ? error : new Error(String(error));
    }

    const reviews: Review[] = (data ?? []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      userName: row.profile?.full_name || "CampusEduX User",
      userAvatarUrl: row.profile?.avatar_url ?? null,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
    }));

    const counts: RatingBreakdown["counts"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const bucket = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[bucket] += 1;
    });
    const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    return { reviews, breakdown: { average, totalReviews: reviews.length, counts } };
  },

  async addReview(projectId: string, userId: string, rating: number, comment: string): Promise<void> {
    const { error } = await supabase.from("reviews").insert({ project_id: projectId, user_id: userId, rating, comment });
    if (error) {
      throw new Error(
        error.code === "23505"
          ? "You've already reviewed this project."
          : `Couldn't submit your review: ${error.message}`
      );
    }
  },

  async isWishlisted(projectId: string, userId: string): Promise<boolean> {
    const { data } = await supabase.from("wishlists").select("project_id").eq("project_id", projectId).eq("user_id", userId).maybeSingle();
    return !!data;
  },

  async getWishlist(userId: string): Promise<Project[]> {
    return orSample(
      "getWishlist",
      async () => {
        const { data, error } = await supabase
          .from("wishlists")
          .select("project:projects(*, category:categories(name))")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return compactRows(data as any[], "project").map((row: any) => mapProjectRow(row.project));
      },
      // per-user read: no sample, ever
    );
  },

  async addToWishlist(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase.from("wishlists").insert({ project_id: projectId, user_id: userId });
    if (error) throw new Error(error.message);
  },

  async removeFromWishlist(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase.from("wishlists").delete().eq("project_id", projectId).eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  async getPurchasedProjects(userId: string): Promise<PurchasedProject[]> {
    return orSample(
      "getPurchasedProjects",
      async () => {
        const { data, error } = await supabase
          .from("purchases")
          .select("id, created_at, project:projects(*, category:categories(name))")
          .eq("user_id", userId)
          .eq("status", "success")
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return compactRows(data as any[], "project").map((row: any) => ({
          orderId: row.id,
          project: mapProjectRow(row.project),
          purchasedAt: row.created_at,
        }));
      },
      // money/purchase read: no sample, ever — errors propagate
    );
  },

  async hasPurchased(projectId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from("purchases")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("status", "success")
      .maybeSingle();
    return !!data;
  },

  async getDownloadHistory(userId: string): Promise<DownloadRecord[]> {
    return orSample(
      "getDownloadHistory",
      async () => {
        const { data, error } = await supabase
          .from("downloads")
          .select("*, project:projects(title)")
          .eq("user_id", userId)
          .order("downloaded_at", { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((row: any) => ({
          id: row.id,
          projectId: row.project_id,
          projectTitle: row.project?.title ?? "",
          fileLabel: row.file_label,
          fileSizeMB: row.file_size_mb,
          downloadedAt: row.downloaded_at,
        }));
      },
      // per-user entitlement record: no sample, ever — errors propagate
    );
  },

  async recordDownload(userId: string, projectId: string, fileLabel: string, fileSizeMB: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("downloads")
        .insert({ user_id: userId, project_id: projectId, file_label: fileLabel, file_size_mb: fileSizeMB });
      if (error) throw new Error(error.message);
    } catch (error) {
      console.info(`[project.service] recordDownload: not persisted (${(error as Error).message})`);
    }
  },

  /**
   * Builds signed Storage URLs for a purchased project's downloadable files.
   * `project-files` is a private bucket (RLS-gated on `purchases.status =
   * 'success'` for this project), so each caller needs their own short-lived
   * signed URL rather than a public one. Files are expected at
   * `${projectId}/source-code.zip` etc. (uploaded by the admin panel).
   */
  async getDownloadableFiles(projectId: string, detail: Pick<ProjectDetail, "sourceCodeSizeMB" | "documentationSizeMB">) {
    const bucket = async (path: string) => {
      const { data } = await supabase.storage.from("project-files").createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      return data?.signedUrl ?? "";
    };
    const [sourceCodeUrl, documentationUrl, installationGuideUrl, installationSizeMB] = await Promise.all([
      bucket(`${projectId}/source-code.zip`),
      bucket(`${projectId}/documentation.pdf`),
      bucket(`${projectId}/installation-guide.pdf`),
      // Real size of the installation guide, when the admin recorded it.
      (async () => {
        try {
          const { data } = await supabase
            .from("project_files")
            .select("file_name, size_mb")
            .eq("project_id", projectId)
            .eq("file_name", "installation-guide.pdf")
            .maybeSingle();
          const size = Number((data as any)?.size_mb);
          return Number.isFinite(size) && size > 0 ? size : 0;
        } catch {
          return 0;
        }
      })(),
    ]);
    const files = [
      { label: "Source Code (ZIP)", fileName: "source-code.zip", sizeMB: detail.sourceCodeSizeMB, url: sourceCodeUrl },
      { label: "Documentation (PDF)", fileName: "documentation.pdf", sizeMB: detail.documentationSizeMB, url: documentationUrl },
      { label: "Installation Guide (PDF)", fileName: "installation-guide.pdf", sizeMB: installationSizeMB, url: installationGuideUrl },
    ];
    // createSignedUrl fails for objects that don't exist (or RLS denial) and
    // `bucket()` maps that to "" — never offer a download with no URL.
    return files.filter((f) => f.url !== "");
  },
};

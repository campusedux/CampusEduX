import { supabase } from "@/lib/supabase";
import { projectService } from "@/services/project.service";
import type { PurchasedProject, OwnedProjectDetail, ProjectFile, ProjectVersionChange } from "@/types";
import {
  sampleProjectFiles,
  sampleVersionHistory,
} from "@/data/sampleMyProjectsContent";

type OwnershipFilter = "purchased" | "wishlist" | "collections";

export const myProjectsService = {
  async getOwnedProjects(userId: string, filter: OwnershipFilter): Promise<PurchasedProject[]> {
    if (filter === "wishlist") {
      const wishlisted = await projectService.getWishlist(userId);
      return wishlisted.map((project) => ({ orderId: `wishlist-${project.id}`, project, purchasedAt: project.createdAt }));
    }

    const purchased = await projectService.getPurchasedProjects(userId);
    if (filter === "purchased") return purchased;

    // "Collections" groups purchased projects by category rather than a
    // separate custom-folder feature, since the mockup treats it as a
    // filter tab alongside Purchased/Wishlist rather than its own screen.
    return [...purchased].sort((a, b) => a.project.categoryName.localeCompare(b.project.categoryName));
  },

  async getOwnedProjectDetail(orderId: string, userId: string): Promise<OwnedProjectDetail> {
    // This is a purchase read gated on `user_id` — never fall back to a sample
    // "you own this" detail on a failed fetch or a missing row. Both cases
    // propagate so the screen shows its error state instead of fabricated
    // ownership.
    const res = await supabase
      .from("purchases")
      .select("id, created_at, purchased_version, project:projects(*, category:categories(name))")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();
    if (res.error || !res.data) throw new Error("Purchase not found.");
    const purchase = res.data;

    const projectRow = purchase.project as any;
    const { data: latestVersionRow } = await supabase
      .from("project_versions")
      .select("version")
      .eq("project_id", projectRow.id)
      .eq("is_latest", true)
      .maybeSingle();

    const latestVersion = latestVersionRow?.version ?? purchase.purchased_version ?? "1.0";

    return {
      orderId: purchase.id,
      project: {
        id: projectRow.id,
        title: projectRow.title,
        categoryId: projectRow.category_id,
        categoryName: projectRow.category?.name ?? "",
        techStack: projectRow.tech_stack ?? [],
        price: projectRow.price,
        rating: projectRow.rating ?? 0,
        reviewCount: projectRow.review_count ?? 0,
        thumbnailUrl: projectRow.thumbnail_url ?? null,
        isPremium: projectRow.is_premium ?? false,
        isBestSeller: projectRow.is_best_seller ?? false,
        salesCount: projectRow.sales_count ?? 0,
        createdAt: projectRow.created_at,
      },
      purchasedAt: purchase.created_at,
      license: projectRow.license ?? "Regular License",
      developerName: projectRow.developer_name ?? "Unknown Developer",
      purchasedVersion: purchase.purchased_version ?? "1.0",
      latestVersion,
      isUpdateAvailable: !!purchase.purchased_version && purchase.purchased_version !== latestVersion,
      githubUrl: projectRow.github_url ?? null,
      repo: projectRow.repo_owner
        ? {
            owner: projectRow.repo_owner,
            name: projectRow.repo_name ?? "",
            language: projectRow.repo_language ?? "",
            stars: projectRow.repo_stars ?? 0,
            forks: projectRow.repo_forks ?? 0,
            updatedAt: projectRow.repo_updated_at ?? projectRow.created_at,
          }
        : null,
    };
  },

  async getProjectFiles(projectId: string, category: "main" | "documentation"): Promise<ProjectFile[]> {
    try {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .eq("category", category)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      const rows = (data ?? []).map((row) => ({
        id: row.id,
        projectId: row.project_id,
        category: row.category,
        label: row.label,
        fileName: row.file_name,
        sizeMB: row.size_mb,
        url: supabase.storage.from("project-files").getPublicUrl(row.storage_path).data.publicUrl,
      }));
      return rows.length > 0 ? rows : sampleProjectFiles(projectId, category);
    } catch (error) {
      console.info(`[myProjects.service] getProjectFiles: using sample content (${(error as Error).message})`);
      return sampleProjectFiles(projectId, category);
    }
  },

  async getVersionHistory(projectId: string): Promise<ProjectVersionChange[]> {
    try {
      const { data, error } = await supabase
        .from("project_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("released_at", { ascending: false });
      if (error) throw new Error(error.message);
      const rows = (data ?? []).map((row) => ({
        version: row.version,
        isLatest: row.is_latest,
        releasedAt: row.released_at,
        sizeMB: row.size_mb,
        changelog: row.changelog ?? [],
      }));
      return rows.length > 0 ? rows : sampleVersionHistory();
    } catch (error) {
      console.info(`[myProjects.service] getVersionHistory: using sample content (${(error as Error).message})`);
      return sampleVersionHistory();
    }
  },

  async markVersionUpdated(orderId: string, userId: string, newVersion: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("purchases")
        .update({ purchased_version: newVersion })
        .eq("id", orderId)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    } catch (error) {
      console.info(`[myProjects.service] markVersionUpdated: not persisted (${(error as Error).message})`);
    }
  },
};

import type { ProjectCardData } from "@/components/ProjectCard";

/**
 * One row of the `my_wishlist()` RPC (migration 0120/092). Unpublished / removed projects come
 * back as tombstones: `available: false` and every detail column null — the DB never reveals a
 * draft's details to someone who merely wishlisted its id.
 */
export interface WishlistRow {
  project_id: string;
  available: boolean;
  title: string | null;
  category_name: string | null;
  tech_stack: string[] | null;
  price: number | null;
  rating: number | null;
  review_count: number | null;
  thumbnail_url: string | null;
  is_premium: boolean | null;
  is_best_seller: boolean | null;
}

export type WishlistEntry =
  | { kind: "project"; project: ProjectCardData }
  | { kind: "unavailable"; projectId: string };

export function toWishlistEntries(rows: unknown): WishlistEntry[] {
  if (!Array.isArray(rows)) return [];
  return (rows as WishlistRow[])
    .filter((r) => r && typeof r.project_id === "string")
    .map((r): WishlistEntry =>
      r.available && r.title
        ? {
            kind: "project",
            project: {
              id: r.project_id,
              title: r.title,
              category_name: r.category_name,
              tech_stack: r.tech_stack,
              price: Number(r.price ?? 0),
              rating: Number(r.rating ?? 0),
              review_count: Number(r.review_count ?? 0),
              thumbnail_url: r.thumbnail_url,
              is_premium: !!r.is_premium,
              is_best_seller: !!r.is_best_seller,
            },
          }
        : { kind: "unavailable", projectId: r.project_id },
    );
}

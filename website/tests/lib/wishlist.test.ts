import { describe, it, expect, vi, beforeEach } from "vitest";
import { toWishlistEntries } from "@/lib/wishlist";

describe("toWishlistEntries", () => {
  it("maps available rows to cards and unavailable rows to detail-free tombstones", () => {
    const entries = toWishlistEntries([
      { project_id: "p1", available: true, title: "Alpha", category_name: "Web", tech_stack: ["react"], price: "499", rating: 4.5, review_count: 3, thumbnail_url: null, is_premium: false, is_best_seller: true },
      { project_id: "p2", available: false, title: null, category_name: null, tech_stack: null, price: null, rating: null, review_count: null, thumbnail_url: null, is_premium: null, is_best_seller: null },
    ]);
    expect(entries[0]).toMatchObject({ kind: "project", project: { id: "p1", title: "Alpha", price: 499 } });
    expect(entries[1]).toEqual({ kind: "unavailable", projectId: "p2" });
  });
  it("treats a row flagged available without a title as a tombstone and tolerates junk", () => {
    expect(toWishlistEntries([{ project_id: "p3", available: true, title: null }])).toEqual([{ kind: "unavailable", projectId: "p3" }]);
    expect(toWishlistEntries(null)).toEqual([]);
  });
});

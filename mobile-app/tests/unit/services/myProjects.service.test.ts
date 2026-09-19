jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { myProjectsService } from "@/services/myProjects.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";

beforeEach(() => resetSupabaseMock());

const projectEmbed = {
  id: "pr-1",
  title: "E-Commerce Website",
  category_id: "cat-1",
  category: { name: "Web Development" },
  tech_stack: ["React", "Node"],
  price: 499,
  rating: 4.5,
  review_count: 12,
  thumbnail_url: null,
  is_premium: false,
  is_best_seller: true,
  sales_count: 120,
  created_at: "2025-01-01T00:00:00.000Z",
  license: "Extended License",
  developer_name: "CampusEduX Studio",
};

describe("myProjectsService.getOwnedProjects", () => {
  it("wraps wishlisted projects as pseudo-orders", async () => {
    setTableResult("wishlists", { data: [{ project: { ...projectEmbed, category: { name: "Web Development" } } }] });

    const owned = await myProjectsService.getOwnedProjects("u-1", "wishlist");

    expect(owned).toHaveLength(1);
    expect(owned[0].orderId).toBe("wishlist-pr-1");
    expect(owned[0].project.title).toBe("E-Commerce Website");
  });

  it("returns purchased projects for the 'purchased' filter", async () => {
    setTableResult("purchases", {
      data: [{ id: "ord-1", created_at: "2025-06-01T00:00:00.000Z", project: { ...projectEmbed } }],
    });

    const owned = await myProjectsService.getOwnedProjects("u-1", "purchased");

    expect(owned).toEqual([
      expect.objectContaining({ orderId: "ord-1", purchasedAt: "2025-06-01T00:00:00.000Z" }),
    ]);
  });

  it("sorts the 'collections' filter by category name", async () => {
    setTableResult("purchases", {
      data: [
        { id: "o1", created_at: "2025-06-01", project: { ...projectEmbed, id: "b", category: { name: "Mobile" } } },
        { id: "o2", created_at: "2025-06-02", project: { ...projectEmbed, id: "a", category: { name: "AI" } } },
      ],
    });

    const owned = await myProjectsService.getOwnedProjects("u-1", "collections");

    expect(owned.map((o) => o.project.categoryName)).toEqual(["AI", "Mobile"]);
  });
});

describe("myProjectsService.getOwnedProjectDetail", () => {
  it("assembles the owned-project detail with the latest version flag", async () => {
    setTableResult("purchases", [
      { data: [{ id: "ord-1", created_at: "2025-06-01T00:00:00.000Z", purchased_version: "1.0", project: { ...projectEmbed } }] },
    ]);
    setTableResult("project_versions", { data: [{ version: "1.2" }] });

    const detail = await myProjectsService.getOwnedProjectDetail("ord-1", "u-1");

    expect(detail.orderId).toBe("ord-1");
    expect(detail.purchasedVersion).toBe("1.0");
    expect(detail.latestVersion).toBe("1.2");
    expect(detail.isUpdateAvailable).toBe(true);
    expect(detail.license).toBe("Extended License");
  });

  it("throws instead of returning a sample 'you own this' detail when the fetch fails (money-safety)", async () => {
    setTableResult("purchases", { error: { message: "relation does not exist" } });

    await expect(myProjectsService.getOwnedProjectDetail("ord-1", "u-1")).rejects.toThrow(/Purchase not found/);
  });

  it("throws when the purchase row does not belong to the user", async () => {
    setTableResult("purchases", { data: [] });

    await expect(myProjectsService.getOwnedProjectDetail("ord-1", "u-1")).rejects.toThrow(/Purchase not found/);
  });
});

describe("myProjectsService.getProjectFiles", () => {
  it("maps file rows and builds signed storage URLs", async () => {
    setTableResult("project_files", {
      data: [{ id: "f1", project_id: "pr-1", category: "main", label: "Source", file_name: "src.zip", size_mb: 4.2, storage_path: "pr-1/src.zip" }],
    });

    const files = await myProjectsService.getProjectFiles("pr-1", "main");

    expect(files[0]).toEqual(
      expect.objectContaining({ id: "f1", fileName: "src.zip", sizeMB: 4.2, url: "https://cdn.test/signed/pr-1/src.zip" })
    );
  });

  it("falls back to sample files when the query fails (content screen, not money)", async () => {
    setTableResult("project_files", { error: { message: "no table" } });
    expect((await myProjectsService.getProjectFiles("pr-1", "main")).length).toBeGreaterThan(0);
  });
});

describe("myProjectsService.getVersionHistory", () => {
  it("maps version rows", async () => {
    setTableResult("project_versions", {
      data: [{ version: "1.2", is_latest: true, released_at: "2025-06-01", size_mb: 5, changelog: ["fix"] }],
    });

    const history = await myProjectsService.getVersionHistory("pr-1");

    expect(history[0]).toEqual({ version: "1.2", isLatest: true, releasedAt: "2025-06-01", sizeMB: 5, changelog: ["fix"] });
  });

  it("falls back to sample history on error", async () => {
    setTableResult("project_versions", { error: { message: "no table" } });
    expect((await myProjectsService.getVersionHistory("pr-1")).length).toBeGreaterThan(0);
  });
});

describe("myProjectsService.markVersionUpdated", () => {
  it("throws instead of silently dropping the write when it fails (a mutation must surface failure)", async () => {
    setTableResult("purchases", { error: { message: "no table" } });
    await expect(myProjectsService.markVersionUpdated("ord-1", "u-1", "1.2")).rejects.toThrow(
      "Couldn't mark this project as updated: no table"
    );
  });
});

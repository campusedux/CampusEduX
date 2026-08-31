jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { projectService } from "@/services/project.service";
import { resetSupabaseMock, setTableResult, supabase } from "../../mocks/supabase.mock";
import { projectDetailRow, projectRows } from "../../mocks/projects.mock";

beforeEach(() => resetSupabaseMock());

describe("integration: browse -> detail -> wishlist -> purchase check", () => {
  it("lists projects, opens one, adds & removes it from the wishlist", async () => {
    // 1. browse
    setTableResult("projects", { data: projectRows });
    const { projects } = await projectService.getAllProjects({}, 0);
    expect(projects.map((p) => p.id)).toEqual(["tr-1", "pr-3"]);

    // 2. detail (not yet wishlisted)
    setTableResult("projects", { data: [projectDetailRow] });
    setTableResult("wishlists", { data: null });
    const detail = await projectService.getProjectDetail("tr-1", "u-1");
    expect(detail.isWishlisted).toBe(false);
    expect(detail.sourceCodeSizeMB).toBe(45.6);

    // 3. add to wishlist
    setTableResult("wishlists", { data: null });
    await expect(projectService.addToWishlist("tr-1", "u-1")).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith("wishlists");

    // 4. now it shows as wishlisted
    setTableResult("wishlists", { data: { project_id: "tr-1" } });
    expect(await projectService.isWishlisted("tr-1", "u-1")).toBe(true);

    // 5. remove
    setTableResult("wishlists", { data: null });
    await expect(projectService.removeFromWishlist("tr-1", "u-1")).resolves.toBeUndefined();
  });

  it("reports purchase ownership from the purchases table", async () => {
    setTableResult("purchases", { data: { id: "d-1" } });
    expect(await projectService.hasPurchased("tr-1", "u-1")).toBe(true);

    setTableResult("purchases", { data: null });
    expect(await projectService.hasPurchased("pr-3", "u-1")).toBe(false);
  });

  it("lists purchased projects mapped to PurchasedProject", async () => {
    setTableResult("purchases", {
      data: [
        { id: "d-1", created_at: "2025-05-25T00:00:00.000Z", project: { ...projectDetailRow, category: { name: "Web Development" } } },
      ],
    });

    const purchased = await projectService.getPurchasedProjects("u-1");

    expect(purchased).toHaveLength(1);
    expect(purchased[0].orderId).toBe("d-1");
    expect(purchased[0].project.title).toBe("E-Commerce Website");
  });
});

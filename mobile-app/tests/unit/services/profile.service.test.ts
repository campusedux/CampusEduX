jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { profileService } from "@/services/profile.service";
import { resetSupabaseMock, setTableResult, supabase } from "../../mocks/supabase.mock";

beforeEach(() => resetSupabaseMock());

describe("profileService.updateProfile", () => {
  it("maps editable fields to snake_case columns", async () => {
    let captured: unknown;
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      update: (payload: unknown) => {
        captured = payload;
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }));

    await profileService.updateProfile("u-1", {
      fullName: "Rohan Verma",
      mobileNumber: "9999999999",
      dateOfBirth: "2000-01-01",
      gender: "male",
      location: "Bangalore",
      avatarUrl: "https://cdn/x.jpg",
    } as any);

    expect(captured).toEqual({
      full_name: "Rohan Verma",
      mobile_number: "9999999999",
      date_of_birth: "2000-01-01",
      gender: "male",
      location: "Bangalore",
      avatar_url: "https://cdn/x.jpg",
    });
  });

  it("throws a friendly error when the write fails", async () => {
    setTableResult("profiles", { error: { message: "rls denied" } });

    await expect(profileService.updateProfile("u-1", { fullName: "X" } as any)).rejects.toThrow(
      "Couldn't save your profile: rls denied"
    );
  });
});

describe("profileService.getPurchaseHistory", () => {
  it("maps purchase rows and normalises the success status to 'completed'", async () => {
    setTableResult("purchases", {
      data: [
        { id: "p1", total_amount: 299, status: "success", created_at: "2025-06-01", project: { title: "E-Commerce Website" } },
        { id: "p2", total_amount: 499, status: "pending", created_at: "2025-05-20", project: null },
      ],
    });

    const history = await profileService.getPurchaseHistory("u-1");

    expect(history).toEqual([
      { id: "p1", type: "project", title: "E-Commerce Website", amount: 299, purchasedAt: "2025-06-01", status: "completed" },
      { id: "p2", type: "project", title: "Project", amount: 499, purchasedAt: "2025-05-20", status: "pending" },
    ]);
  });

  it("returns an empty history for a student who has not bought anything", async () => {
    setTableResult("purchases", { data: [] });
    expect(await profileService.getPurchaseHistory("u-1")).toEqual([]);
  });

  it("throws instead of returning sample orders when the query fails (money-safety)", async () => {
    setTableResult("purchases", { error: { message: "relation does not exist" } });

    await expect(profileService.getPurchaseHistory("u-1")).rejects.toThrow("relation does not exist");
  });
});

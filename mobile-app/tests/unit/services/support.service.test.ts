jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());

import { supportService } from "@/services/support.service";
import { resetSupabaseMock, setTableResult } from "../../mocks/supabase.mock";

beforeEach(() => resetSupabaseMock());

describe("supportService.getFaqs", () => {
  it("returns active FAQ rows authored in the admin panel", async () => {
    setTableResult("faqs", {
      data: [
        { id: "a", question: "Q1", answer: "A1", category: "Payments" },
        { id: "b", question: "Q2", answer: "A2", category: "Account" },
      ],
    });

    const faqs = await supportService.getFaqs();

    expect(faqs.map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("falls back to the bundled FAQs when the faqs table is empty", async () => {
    setTableResult("faqs", { data: [] });

    const faqs = await supportService.getFaqs();

    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs.every((f) => f.question && f.answer)).toBe(true);
  });

  it("falls back to the bundled FAQs when the query fails (migration 008 not applied / offline)", async () => {
    setTableResult("faqs", { error: { message: "relation \"faqs\" does not exist" } });

    const faqs = await supportService.getFaqs();

    expect(faqs.length).toBeGreaterThan(0);
  });
});

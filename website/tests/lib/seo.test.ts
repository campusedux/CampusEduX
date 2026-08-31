import { describe, it, expect } from "vitest";
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

describe("seo helpers", () => {
  it("absoluteUrl joins without double slashes", () => {
    expect(absoluteUrl("/projects/x")).toMatch(/^https?:\/\/[^/]+\/projects\/x$/);
    expect(absoluteUrl("projects/x")).toMatch(/\/projects\/x$/);
  });
  it("breadcrumbJsonLd numbers positions from 1", () => {
    const d = breadcrumbJsonLd([
      { name: "Projects", path: "/projects" },
      { name: "Thing", path: "/projects/thing" },
    ]) as { itemListElement: { position: number; name: string }[] };
    expect(d.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(d.itemListElement[1].name).toBe("Thing");
  });
  it("faqJsonLd maps questions/answers", () => {
    const d = faqJsonLd([{ question: "Q?", answer: "A." }]) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(d.mainEntity[0].name).toBe("Q?");
    expect(d.mainEntity[0].acceptedAnswer.text).toBe("A.");
  });
});

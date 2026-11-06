import { describe, it, expect } from "vitest";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  websiteJsonLd,
  courseJsonLd,
  courseListJsonLd,
  jobPostingIdentifier,
  hiringOrganizationJsonLd,
} from "@/lib/seo";
import { BRAND } from "@/lib/brand";

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
    expect(d.itemListElement.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(d.itemListElement.map((i) => i.name)).toEqual(["Home", "Projects", "Thing"]);
  });
  it("faqJsonLd maps questions/answers", () => {
    const d = faqJsonLd([{ question: "Q?", answer: "A." }]) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(d.mainEntity[0].name).toBe("Q?");
    expect(d.mainEntity[0].acceptedAnswer.text).toBe("A.");
  });

  it("websiteJsonLd carries the real brand name and site URL, no SearchAction", () => {
    const d = websiteJsonLd() as { "@type": string; name: string; url: string; potentialAction?: unknown };
    expect(d["@type"]).toBe("WebSite");
    expect(d.name).toBe(BRAND.name);
    expect(d.url).toBe("https://www.campusedux.com");
    expect(d.potentialAction).toBeUndefined();
  });

  it("courseJsonLd emits only name/description/provider/url — nothing invented", () => {
    const d = courseJsonLd({ name: "Java Tutorials", description: "Learn Java.", path: "/learning/java-tutorial" }) as {
      "@type": string;
      name: string;
      description: string;
      provider: { "@type": string; name: string };
      url: string;
      instructor?: unknown;
      hasCourseInstance?: unknown;
      courseMode?: unknown;
    };
    expect(d["@type"]).toBe("Course");
    expect(d.name).toBe("Java Tutorials");
    expect(d.description).toBe("Learn Java.");
    expect(d.provider).toEqual({ "@type": "Organization", name: BRAND.name });
    expect(d.url).toBe("https://www.campusedux.com/learning/java-tutorial");
    expect(d.instructor).toBeUndefined();
    expect(d.hasCourseInstance).toBeUndefined();
    expect(d.courseMode).toBeUndefined();
  });

  it("courseJsonLd omits description when empty/absent rather than emitting a blank field", () => {
    const d = courseJsonLd({ name: "Grid", description: "", path: "/learning/grid" }) as Record<string, unknown>;
    expect("description" in d).toBe(false);
  });

  it("courseListJsonLd numbers positions from 1 and wraps a real Course per item", () => {
    const grids = [
      { name: "Java Tutorials", description: "Learn Java.", path: "/learning/java-tutorial" },
      { name: "Python Tutorial", description: "Learn Python.", path: "/learning/python-tutorial" },
      { name: "DBMS & SQL Tutorial", description: "Learn SQL.", path: "/learning/dbms-sql-tutorial" },
    ];
    const d = courseListJsonLd(grids) as {
      "@type": string;
      itemListElement: { "@type": string; position: number; url: string; item: { "@type": string; name: string } }[];
    };
    expect(d["@type"]).toBe("ItemList");
    expect(d.itemListElement).toHaveLength(3);
    expect(d.itemListElement.map((e) => e.position)).toEqual([1, 2, 3]);
    expect(d.itemListElement[0].url).toBe("https://www.campusedux.com/learning/java-tutorial");
    expect(d.itemListElement[0].item["@type"]).toBe("Course");
    expect(d.itemListElement[0].item.name).toBe("Java Tutorials");
    // No topic-level entries — grid-level only.
    for (const entry of d.itemListElement) {
      expect(entry.item).not.toHaveProperty("hasPart");
    }
  });

  it("jobPostingIdentifier wraps the real job id as a PropertyValue", () => {
    const d = jobPostingIdentifier("Acme Corp", "job-123") as { "@type": string; name: string; value: string };
    expect(d).toEqual({ "@type": "PropertyValue", name: "Acme Corp", value: "job-123" });
  });

  it("hiringOrganizationJsonLd adds logo/sameAs only when real data exists", () => {
    const withBoth = hiringOrganizationJsonLd({
      name: "Acme Corp",
      logoUrl: "https://cdn.example/acme.png",
      website: "https://acme.example",
    });
    expect(withBoth).toEqual({
      "@type": "Organization",
      name: "Acme Corp",
      logo: "https://cdn.example/acme.png",
      sameAs: "https://acme.example",
    });

    const withNeither = hiringOrganizationJsonLd({ name: "Acme Corp", logoUrl: null, website: null });
    expect(withNeither).toEqual({ "@type": "Organization", name: "Acme Corp" });
    expect(withNeither).not.toHaveProperty("logo");
    expect(withNeither).not.toHaveProperty("sameAs");
  });
});

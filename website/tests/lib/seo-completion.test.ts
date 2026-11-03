import { describe, expect, it } from "vitest";
import { completeSeoMetadata, DEFAULT_OG_IMAGE, hasQueryVariants } from "@/lib/seo";

describe("metadata completion", () => {
  it("supplies regional social fields and an absolute canonical without changing authored copy", () => {
    const result = completeSeoMetadata({ title: "Resume Templates", description: "Choose a template.", alternates: { canonical: "/resume/templates" } });
    expect(result.title).toBe("Resume Templates");
    expect(result.alternates?.canonical).toBe("https://www.campusedux.com/resume/templates");
    expect(result.openGraph).toMatchObject({ locale: "en_IN", title: "Resume Templates | CampusEduX", images: [DEFAULT_OG_IMAGE] });
    expect(result.twitter).toMatchObject({ card: "summary_large_image", title: "Resume Templates | CampusEduX", images: [DEFAULT_OG_IMAGE] });
  });
  it("retains external canonical overrides, article dates and authored social fields", () => {
    const result = completeSeoMetadata({ title: { absolute: "An article" }, description: "Description", alternates: { canonical: "https://publisher.example/article" }, openGraph: { type: "article", publishedTime: "2026-01-01", images: ["https://publisher.example/image.png"] }, twitter: { title: "Authored social title" } });
    expect(result.alternates?.canonical).toBe("https://publisher.example/article");
    expect(result.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-01" });
    expect(result.twitter?.title).toBe("Authored social title");
  });
  it("does not shadow file-based dynamic OG images with the generic fallback", () => {
    const result = completeSeoMetadata({ title: "Lesson", description: "Description", alternates: { canonical: "/learning/course/lesson" } }, { dynamicImage: true });
    expect(result.openGraph?.images).toBeUndefined();
    expect(result.twitter && "images" in result.twitter ? result.twitter.images : undefined).toBeUndefined();
  });
  it("keeps private and missing-page directives unchanged", () => {
    const input = { title: "Not found", robots: { index: false, follow: true } };
    expect(completeSeoMetadata(input)).toBe(input);
    expect(hasQueryVariants({})).toBe(false);
    expect(hasQueryVariants({ q: "" })).toBe(true);
  });
});

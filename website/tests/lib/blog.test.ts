import { describe, it, expect } from "vitest";
import {
  slugId,
  formatBlogDate,
  readingTimeFromMarkdown,
  stripMarkdown,
  extractToc,
  extractFaqs,
  articleJsonLd,
} from "@/lib/blogText";
import type { BlogPostDetail } from "@/lib/blog.types";

describe("slugId", () => {
  it("lower-cases, hyphenates and trims", () => {
    expect(slugId("How AI Works")).toBe("how-ai-works");
    expect(slugId("  Types of AI!! ")).toBe("types-of-ai");
    expect(slugId("AI vs. Humans — the short version")).toBe("ai-vs-humans-the-short-version");
  });
  it("caps at 60 chars and handles junk", () => {
    expect(slugId("#".repeat(30))).toBe("");
    expect(slugId("a".repeat(100)).length).toBe(60);
  });
});

describe("formatBlogDate", () => {
  it("formats an ISO date in a fixed en-GB / UTC style", () => {
    expect(formatBlogDate("2026-09-06T10:00:00.000Z")).toBe("6 September 2026");
  });
  it("is empty for null / invalid input", () => {
    expect(formatBlogDate(null)).toBe("");
    expect(formatBlogDate("not-a-date")).toBe("");
  });
});

describe("readingTimeFromMarkdown", () => {
  it("is ~200 wpm and never below 1", () => {
    expect(readingTimeFromMarkdown("")).toBe(1);
    expect(readingTimeFromMarkdown("word ".repeat(200))).toBe(1);
    expect(readingTimeFromMarkdown("word ".repeat(1000))).toBe(5);
  });
  it("does not count fenced code at prose speed", () => {
    const withCode = "intro\n\n```\n" + "x ".repeat(4000) + "\n```\n\noutro";
    expect(readingTimeFromMarkdown(withCode)).toBeLessThan(3);
  });
});

describe("stripMarkdown", () => {
  it("removes syntax but keeps link text and words", () => {
    const md = "## Heading\n\nSome **bold** and a [link](https://x.com) and `code`.\n\n![alt](/img.svg)";
    const out = stripMarkdown(md);
    expect(out).toContain("Heading");
    expect(out).toContain("Some bold and a link and code.");
    expect(out).not.toContain("![");
    expect(out).not.toContain("https://x.com");
  });
});

describe("extractToc", () => {
  const md = [
    "# Title",
    "",
    "## What is AI?",
    "text",
    "### A simple definition",
    "```",
    "## not a heading (inside a code fence)",
    "```",
    "## How AI works",
  ].join("\n");

  it("collects h2 + h3, ignores h1 and fenced lines, and matches slugId", () => {
    const toc = extractToc(md);
    expect(toc.map((t) => t.text)).toEqual(["What is AI?", "A simple definition", "How AI works"]);
    expect(toc.map((t) => t.level)).toEqual([2, 3, 2]);
    expect(toc[0].id).toBe(slugId("What is AI?"));
  });
});

describe("extractFaqs", () => {
  const md = [
    "## Intro",
    "### Not a FAQ question",
    "ignored because it is not under a FAQ heading",
    "",
    "## Frequently Asked Questions",
    "",
    "### Is AI the same as machine learning?",
    "Not quite. ML is the main technique.",
    "It sits inside AI.",
    "",
    "### Will AI take my job?",
    "It is more likely to change your job.",
    "",
    "## Conclusion",
    "### After the FAQ section",
    "also ignored",
  ].join("\n");

  it("pulls only the ### Q/A pairs inside the FAQ section", () => {
    const faqs = extractFaqs(md);
    expect(faqs).toHaveLength(2);
    expect(faqs[0].question).toBe("Is AI the same as machine learning?");
    expect(faqs[0].answer).toBe("Not quite. ML is the main technique. It sits inside AI.");
    expect(faqs[1].question).toBe("Will AI take my job?");
  });

  it("returns [] when there is no FAQ section", () => {
    expect(extractFaqs("## Intro\ntext\n## Body\nmore")).toEqual([]);
  });
});

describe("articleJsonLd", () => {
  const post: BlogPostDetail = {
    id: "p1",
    title: "What is AI?",
    slug: "what-is-ai",
    excerpt: "A short intro.",
    featured_image: "/blog/ai-hero.svg",
    featured_image_alt: "hero",
    author_name: "CampusEduX Team",
    category_name: "Artificial Intelligence",
    category_slug: "artificial-intelligence",
    tags: ["ai", "beginners"],
    reading_time: 12,
    published_at: "2026-09-06T09:00:00.000Z",
    is_featured: true,
    content: "## Body\n\nText.",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    canonical_url: "",
    updated_at: "2026-09-08T09:00:00.000Z",
  };

  it("emits a BlogPosting with an absolute url + image, author, publisher and dates", () => {
    const ld = articleJsonLd(post) as Record<string, any>;
    expect(ld["@type"]).toBe("BlogPosting");
    expect(ld.headline).toBe("What is AI?");
    expect(String(ld.mainEntityOfPage["@id"])).toMatch(/^https?:\/\/.+\/blog\/what-is-ai$/);
    expect(String(ld.image[0])).toMatch(/^https?:\/\/.+\/blog\/ai-hero\.svg$/);
    expect(ld.author).toEqual({ "@type": "Person", name: "CampusEduX Team" });
    expect(ld.publisher["@type"]).toBe("Organization");
    expect(ld.datePublished).toBe("2026-09-06T09:00:00.000Z");
    expect(ld.dateModified).toBe("2026-09-08T09:00:00.000Z");
    expect(ld.keywords).toBe("ai, beginners");
  });

  it("uses an explicit canonical_url when one is set", () => {
    const ld = articleJsonLd({ ...post, canonical_url: "https://example.com/x" }) as Record<string, any>;
    expect(ld.mainEntityOfPage["@id"]).toBe("https://example.com/x");
  });
});

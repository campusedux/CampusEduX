/**
 * Pure text + structured-data helpers for the blog — no React, no Supabase, no
 * Next. Shared by the Markdown renderer (`slugId`), the article page (TOC / FAQ
 * / reading time / JSON-LD) and unit tests.
 */

import { absoluteUrl, BRAND_LOGO_URL } from "@/lib/seo";
import { BRAND } from "@/lib/brand";
import type { BlogPostDetail } from "@/lib/blog.types";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** Heading → anchor id. The Markdown renderer stamps this exact id on every
 *  `<h*>`, so a table of contents built from the source targets the right spot. */
export function slugId(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** "6 September 2026" — fixed locale + UTC so server and client agree. */
export function formatBlogDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** ~200 words per minute, always at least 1. */
export function readingTimeFromMarkdown(markdown: string): number {
  const words = String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ") // code blocks don't read at prose speed
    .replace(/[#>*_`|~\-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Strip Markdown syntax to plain text — meta-description / preview fallback. */
export function stripMarkdown(markdown: string): string {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[#>\s|:-]+/gm, " ")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a table of contents from `##` / `###` headings (fenced code ignored). */
export function extractToc(markdown: string): TocItem[] {
  const out: TocItem[] = [];
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = m[2].replace(/[*_`]/g, "").trim();
    if (!text) continue;
    out.push({ id: slugId(text), text, level: m[1].length });
  }
  return out;
}

/** Pull `### Question` / answer pairs from an `## FAQ` section for FAQPage
 *  structured data. Returns `[]` when the article has no FAQ section. */
export function extractFaqs(markdown: string): { question: string; answer: string }[] {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const faqs: { question: string; answer: string }[] = [];
  let inFaqSection = false;
  let current: { question: string; answer: string[] } | null = null;
  let inFence = false;

  const flush = () => {
    if (current && current.question) {
      const answer = current.answer.join(" ").replace(/\s+/g, " ").trim();
      if (answer) faqs.push({ question: current.question, answer });
    }
    current = null;
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      if (current) current.answer.push(line);
      continue;
    }
    if (inFence) {
      if (current) current.answer.push(line);
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      inFaqSection = /faq|frequently asked|common questions/i.test(h2[1]);
      continue;
    }
    if (!inFaqSection) continue;
    const h3 = line.match(/^###\s+(.+?)\s*#*\s*$/);
    if (h3) {
      flush();
      current = { question: h3[1].replace(/[*_`]/g, "").trim(), answer: [] };
      continue;
    }
    if (current) current.answer.push(stripMarkdown(line));
  }
  flush();
  return faqs;
}

// ---- Structured data --------------------------------------------------

/** schema.org BlogPosting for a post. */
export function articleJsonLd(post: BlogPostDetail): Record<string, unknown> {
  const url = post.canonical_url || absoluteUrl(`/blog/${post.slug}`);
  const description = post.seo_description || post.excerpt || stripMarkdown(post.content).slice(0, 200);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    ...(post.featured_image
      ? { image: [post.featured_image.startsWith("http") ? post.featured_image : absoluteUrl(post.featured_image)] }
      : {}),
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: { "@type": "Person", name: post.author_name || `${BRAND.name} Team` },
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: BRAND.website,
      logo: { "@type": "ImageObject", url: BRAND_LOGO_URL },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.tags.length ? { keywords: post.tags.join(", ") } : {}),
  };
}

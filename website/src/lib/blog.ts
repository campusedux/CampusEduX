import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getPublicSupabase } from "@/lib/supabase/server";
import { RpcFailed } from "@/lib/publicCache";
import { BRAND } from "@/lib/brand";
import type { BlogCategory, BlogPostCard, BlogPostDetail, BlogListResult } from "@/lib/blog.types";

export type { BlogCategory, BlogPostCard, BlogPostDetail, BlogListResult } from "@/lib/blog.types";
export type { TocItem } from "@/lib/blogText";
export {
  slugId,
  formatBlogDate,
  readingTimeFromMarkdown,
  stripMarkdown,
  extractToc,
  extractFaqs,
  articleJsonLd,
} from "@/lib/blogText";

/**
 * Blog read layer for the website. Every query runs on the anon key through
 * `getPublicSupabase()`; RLS on `blog_posts` (migration 037 / 0065, relaxed by
 * 039 / 0067) restricts the anon role to `status='published'` — the same rule
 * the admin panel uses (its "Published" stat, status pill and Publish toggle
 * all key off `status` alone). A draft / archived post can never appear here;
 * the extra `.eq('status','published')` filters below are a defence-in-depth
 * belt, not the only lock.
 *
 * `published_at` is still stored and used for ordering + article metadata, but
 * it no longer gates visibility: a `status='published'` row with a NULL or
 * future `published_at` is live immediately (an undated row just sorts last).
 *
 * Public catalog reads are wrapped in `unstable_cache` (tag `blog`) exactly
 * like `src/lib/cache.ts` — `@supabase/supabase-js` bypasses Next's fetch
 * cache, so this memoises the *result* across requests. `POST /api/revalidate`
 * with `{ "tags": ["blog"] }` busts it immediately after an admin edit;
 * otherwise it refreshes on its own interval.
 */

export const BLOG_PAGE_SIZE = 12;
/** How many of the newest published posts fill the `/blog` "Featured" strip. */
export const FEATURED_COUNT = 6;
const FIVE_MIN = 300;
const TWO_MIN = 120;

const CARD_COLS =
  "id,title,slug,excerpt,featured_image,featured_image_alt,author_name,category_name,tags,reading_time,published_at,is_featured,category:blog_categories(slug)";
const DETAIL_COLS = `${CARD_COLS},content,seo_title,seo_description,seo_keywords,canonical_url,updated_at`;

type RawEmbed = { slug: string } | { slug: string }[] | null;
interface RawRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  featured_image_alt: string | null;
  author_name: string;
  category_name: string | null;
  tags: string[] | null;
  reading_time: number | null;
  published_at: string;
  is_featured: boolean | null;
  category: RawEmbed;
  content?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;
  updated_at?: string;
}

function categorySlug(embed: RawEmbed): string | null {
  if (!embed) return null;
  const row = Array.isArray(embed) ? embed[0] : embed;
  return row?.slug ?? null;
}

function toCard(r: RawRow): BlogPostCard {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt ?? "",
    featured_image: r.featured_image ?? null,
    featured_image_alt: r.featured_image_alt ?? "",
    author_name: r.author_name || BRAND.name + " Team",
    category_name: r.category_name ?? "",
    category_slug: categorySlug(r.category),
    tags: Array.isArray(r.tags) ? r.tags : [],
    reading_time: r.reading_time ?? 0,
    published_at: r.published_at,
    is_featured: Boolean(r.is_featured),
  };
}

function toDetail(r: RawRow): BlogPostDetail {
  return {
    ...toCard(r),
    content: r.content ?? "",
    seo_title: r.seo_title ?? "",
    seo_description: r.seo_description ?? "",
    seo_keywords: r.seo_keywords ?? "",
    canonical_url: r.canonical_url ?? "",
    updated_at: r.updated_at ?? r.published_at,
  };
}

// ---- Categories ----------------------------------------------------------
export const getBlogCategories = unstable_cache(
  async (): Promise<BlogCategory[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase
      .from("blog_categories")
      .select("id,name,slug,description")
      .order("sort_order")
      .order("name");
    return (data ?? []) as BlogCategory[];
  },
  ["blog:categories"],
  { revalidate: FIVE_MIN, tags: ["blog"] },
);

// ---- Listing -----------------------------------------------------------
export interface BlogPageArgs {
  page: number;
  q?: string;
  /** category *slug* */
  category?: string;
  tag?: string;
}

export const getBlogPage = unstable_cache(
  async (a: BlogPageArgs): Promise<BlogListResult> => {
    const supabase = getPublicSupabase();
    if (!supabase) throw new RpcFailed("Blog listing is unavailable");

    const from = (Math.max(1, a.page) - 1) * BLOG_PAGE_SIZE;

    let categoryId: string | null = null;
    if (a.category) {
      const { data: cat, error } = await supabase
        .from("blog_categories")
        .select("id")
        .eq("slug", a.category)
        .maybeSingle();
      if (error) throw new RpcFailed("Blog category lookup is unavailable");
      categoryId = cat?.id ?? "__none__"; // unknown slug → force an empty result
    }

    let query = supabase
      .from("blog_posts")
      .select(CARD_COLS, { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + BLOG_PAGE_SIZE - 1);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (a.tag) query = query.contains("tags", [a.tag]);
    if (a.q) {
      const term = a.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
    }

    const { data, count, error } = await query;
    // Throw inside unstable_cache: failed refreshes must not replace good data
    // with an empty/noindex listing. A cold failure reaches the error boundary.
    if (error || !Array.isArray(data))
      throw new RpcFailed("Blog listing is unavailable");
    return {
      posts: ((data ?? []) as unknown as RawRow[]).map(toCard),
      total: count ?? 0,
      missing: false,
    };
  },
  ["blog:page"],
  { revalidate: TWO_MIN, tags: ["blog"] },
);

/**
 * The newest published posts, most-recent first — `published_at DESC` (undated
 * rows sort last), then `created_at DESC` as the tie-breaker. This is the *same*
 * ordering `getBlogPage` uses, so the first N rows here are exactly the first N
 * cards of page 1.
 *
 * The `/blog` "Featured" strip is simply `getLatestPosts(FEATURED_COUNT)` — it
 * is deliberately NOT gated on the `is_featured` admin flag, so a post goes live
 * in Featured the moment it is published with no extra editorial step, and no
 * published post is ever hidden from the listing. `is_featured` stays in the
 * schema for future use but no longer controls public visibility.
 */
export const getLatestPosts = unstable_cache(
  async (limit: number = FEATURED_COUNT): Promise<BlogPostCard[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase
      .from("blog_posts")
      .select(CARD_COLS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(1, limit), 24));
    return ((data ?? []) as unknown as RawRow[]).map(toCard);
  },
  ["blog:latest"],
  { revalidate: TWO_MIN, tags: ["blog"] },
);

/** Distinct tag vocabulary across published posts, most-used first. */
export const getBlogTags = unstable_cache(
  async (limit = 24): Promise<string[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase
      .from("blog_posts")
      .select("tags")
      .eq("status", "published")
      .limit(500);
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as { tags: string[] | null }[]) {
      for (const t of row.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([t]) => t);
  },
  ["blog:tags"],
  { revalidate: FIVE_MIN, tags: ["blog"] },
);

// ---- Single post ------------------------------------------------------
const _getBlogPost = unstable_cache(
  async (slug: string): Promise<BlogPostDetail | null> => {
    const supabase = getPublicSupabase();
    if (!supabase) return null;
    const { data } = await supabase
      .from("blog_posts")
      .select(DETAIL_COLS)
      .eq("status", "published")
      .ilike("slug", slug)
      .maybeSingle();
    return data ? toDetail(data as unknown as RawRow) : null;
  },
  ["blog:post"],
  { revalidate: FIVE_MIN, tags: ["blog"] },
);
/** Per-request memo over the cross-request cache (metadata + page share it). */
export const getBlogPost = cache((slug: string) => _getBlogPost(slug));

export const getRelatedPosts = unstable_cache(
  async (postId: string, categoryName: string, limit = 3): Promise<BlogPostCard[]> => {
    const supabase = getPublicSupabase();
    if (!supabase || !categoryName) return [];
    const { data } = await supabase
      .from("blog_posts")
      .select(CARD_COLS)
      .eq("status", "published")
      .eq("category_name", categoryName)
      .neq("id", postId)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as unknown as RawRow[]).map(toCard);
  },
  ["blog:related"],
  { revalidate: FIVE_MIN, tags: ["blog"] },
);

/** { prev: older post, next: newer post } for in-article navigation. */
export const getAdjacentPosts = unstable_cache(
  async (publishedAt: string): Promise<{ prev: BlogPostCard | null; next: BlogPostCard | null }> => {
    const supabase = getPublicSupabase();
    if (!supabase) return { prev: null, next: null };
    const [{ data: older }, { data: newer }] = await Promise.all([
      supabase
        .from("blog_posts")
        .select(CARD_COLS)
        .eq("status", "published")
        .lt("published_at", publishedAt)
        .order("published_at", { ascending: false })
        .limit(1),
      supabase
        .from("blog_posts")
        .select(CARD_COLS)
        .eq("status", "published")
        .gt("published_at", publishedAt)
        .order("published_at", { ascending: true })
        .limit(1),
    ]);
    return {
      prev: older?.[0] ? toCard(older[0] as unknown as RawRow) : null,
      next: newer?.[0] ? toCard(newer[0] as unknown as RawRow) : null,
    };
  },
  ["blog:adjacent"],
  { revalidate: FIVE_MIN, tags: ["blog"] },
);

/** Slugs of every published post — `generateStaticParams` + sitemap. */
export const getAllBlogSlugs = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    const supabase = getPublicSupabase();
    if (!supabase) return [];
    const { data } = await supabase
      .from("blog_posts")
      .select("slug,updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1000);
    return (data ?? []) as { slug: string; updated_at: string }[];
  },
  ["blog:all-slugs"],
  { revalidate: FIVE_MIN, tags: ["blog"] },
);

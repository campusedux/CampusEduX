import { revisionedPublicRead } from "@/lib/revisionedPublicRead";
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
 * `getPublicSupabase({ fresh: true })`; RLS on `blog_posts` (migration 037 / 0065, relaxed by
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
 * Each render checks the atomic database revision before reusing process-local
 * anonymous payloads. Admin refresh is optional for these reads. Route HTML
 * stays dynamic; metadata and page share primitive-keyed results per render.
 */

export const BLOG_PAGE_SIZE = 12;
/** How many of the newest published posts fill the `/blog` "Featured" strip. */
export const FEATURED_COUNT = 6;

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
export const getBlogCategories = revisionedPublicRead("blog", "getBlogCategories",
  async (supabase): Promise<BlogCategory[]> => {
    if (!supabase) throw new RpcFailed("Blog read is unavailable");
    const { data, error } = await supabase
      .from("blog_categories")
      .select("id,name,slug,description")
      .order("sort_order")
      .order("name");
    if (error || !Array.isArray(data)) throw new RpcFailed("Blog categories are unavailable");
    return data as BlogCategory[];
  },
);

// ---- Listing -----------------------------------------------------------
export interface BlogPageArgs {
  page: number;
  q?: string;
  /** category *slug* */
  category?: string;
  tag?: string;
}

const readBlogPage = revisionedPublicRead("blog", "readBlogPage",
  async (supabase, page: number, q?: string, category?: string, tag?: string): Promise<BlogListResult> => {
    if (!supabase) throw new RpcFailed("Blog listing is unavailable");

    const from = (Math.max(1, page) - 1) * BLOG_PAGE_SIZE;

    let categoryId: string | undefined;
    if (category) {
      // The index also needs these rows for its category chips. Reuse that read
      // and return a clean empty result for unknown slugs (never a bogus UUID).
      const categories = await getBlogCategories();
      categoryId = categories.find((c) => c.slug === category)?.id;
      if (!categoryId) return { posts: [], total: 0, missing: false };
    }

    let query = supabase
      .from("blog_posts")
      .select(CARD_COLS, { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + BLOG_PAGE_SIZE - 1);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (tag) query = query.contains("tags", [tag]);
    if (q) {
      const term = q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
    }

    const { data, count, error } = await query;
    // An upstream failure must reach the error boundary, never become absence.
    if (error || !Array.isArray(data))
      throw new RpcFailed("Blog listing is unavailable");
    return {
      posts: ((data ?? []) as unknown as RawRow[]).map(toCard),
      total: count ?? 0,
      missing: false,
    };
  },
);

/** Objects from metadata/page are different identities; memoize by scalar values. */
export function getBlogPage(a: BlogPageArgs): Promise<BlogListResult> {
  return readBlogPage(a.page, a.q, a.category, a.tag);
}

/**
 * The newest published posts, most-recent first — `published_at DESC` (undated
 * rows sort last), then `created_at DESC` as the tie-breaker. This is the *same*
 * ordering `getBlogPage` uses, so the first N rows here are exactly the first N
 * cards of page 1.
 *
 * The `/blog` "Featured" strip takes the same leading slice from page 1. It
 * is deliberately NOT gated on the `is_featured` admin flag, so a post goes live
 * in Featured the moment it is published with no extra editorial step, and no
 * published post is ever hidden from the listing. `is_featured` stays in the
 * schema for future use but no longer controls public visibility.
 */
export const getLatestPosts = revisionedPublicRead("blog", "getLatestPosts",
  async (supabase, limit: number = FEATURED_COUNT): Promise<BlogPostCard[]> => {
    if (!supabase) throw new RpcFailed("Blog read is unavailable");
    const { data, error } = await supabase
      .from("blog_posts")
      .select(CARD_COLS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(1, limit), 24));
    if (error || !Array.isArray(data)) throw new RpcFailed("Blog cards are unavailable");
    return (data as unknown as RawRow[]).map(toCard);
  },
);

/** Distinct tag vocabulary across published posts, most-used first. */
export const getBlogTags = revisionedPublicRead("blog", "getBlogTags",
  async (supabase, limit: number = 24): Promise<string[]> => {
    if (!supabase) throw new RpcFailed("Blog read is unavailable");
    const { data, error } = await supabase
      .from("blog_posts")
      .select("tags")
      .eq("status", "published")
      .limit(500);
    if (error || !Array.isArray(data)) throw new RpcFailed("Blog tags are unavailable");
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as { tags: string[] | null }[]) {
      for (const t of row.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([t]) => t);
  },
);

// ---- Single post ------------------------------------------------------
export const getBlogPost = revisionedPublicRead("blog", "getBlogPost",
  async (supabase, slug: string): Promise<BlogPostDetail | null> => {
    if (!supabase) throw new RpcFailed("Blog post is unavailable");
    const { data, error } = await supabase
      .from("blog_posts")
      .select(DETAIL_COLS)
      .eq("status", "published")
      .ilike("slug", slug)
      .maybeSingle();
    if (error) throw new RpcFailed("Blog post is unavailable");
    return data ? toDetail(data as unknown as RawRow) : null;
  },
);

export const getRelatedPosts = revisionedPublicRead("blog", "getRelatedPosts",
  async (supabase, postId: string, categoryName: string, limit: number = 3): Promise<BlogPostCard[]> => {
    if (!categoryName) return [];
    if (!supabase) throw new RpcFailed("Related blog posts are unavailable");
    const { data, error } = await supabase
      .from("blog_posts")
      .select(CARD_COLS)
      .eq("status", "published")
      .eq("category_name", categoryName)
      .neq("id", postId)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !Array.isArray(data)) throw new RpcFailed("Blog cards are unavailable");
    return (data as unknown as RawRow[]).map(toCard);
  },
);

/** { prev: older post, next: newer post } for in-article navigation. */
export const getAdjacentPosts = revisionedPublicRead("blog", "getAdjacentPosts",
  async (supabase, publishedAt: string): Promise<{ prev: Pick<BlogPostCard, "title" | "slug"> | null; next: Pick<BlogPostCard, "title" | "slug"> | null }> => {
    if (!supabase) throw new RpcFailed("Blog navigation is unavailable");
    const [older, newer] = await Promise.all([
      supabase
        .from("blog_posts")
        .select("title,slug")
        .eq("status", "published")
        .lt("published_at", publishedAt)
        .order("published_at", { ascending: false })
        .limit(1),
      supabase
        .from("blog_posts")
        .select("title,slug")
        .eq("status", "published")
        .gt("published_at", publishedAt)
        .order("published_at", { ascending: true })
        .limit(1),
    ]);
    if (older.error || newer.error || !Array.isArray(older.data) || !Array.isArray(newer.data))
      throw new RpcFailed("Blog navigation is unavailable");
    return { prev: older.data[0] ?? null, next: newer.data[0] ?? null };
  },
);

/** Bounded public slug inventory for callers that need it. */
export const getAllBlogSlugs = revisionedPublicRead("blog", "getAllBlogSlugs",
  async (supabase): Promise<{ slug: string; updated_at: string }[]> => {
    if (!supabase) throw new RpcFailed("Blog read is unavailable");
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug,updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error || !Array.isArray(data)) throw new RpcFailed("Blog slugs are unavailable");
    return data as { slug: string; updated_at: string }[];
  },
);

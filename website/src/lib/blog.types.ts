/**
 * Blog read-model types for the website. Kept in sync with the columns created
 * in `admin-panel/supabase/migrations/037_blog.sql` (mobile twin `0065_blog.sql`).
 * The website only ever reads published rows — RLS on `blog_posts` guarantees a
 * draft / archived / future-dated post never reaches the anon key.
 */

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

/** Shape used by cards / lists — no `content`, so a listing stays light. */
export interface BlogPostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  featured_image_alt: string;
  author_name: string;
  category_name: string;
  category_slug: string | null;
  tags: string[];
  reading_time: number;
  published_at: string;
  is_featured: boolean;
}

/** Full article, for `/blog/[slug]`. */
export interface BlogPostDetail extends BlogPostCard {
  content: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  canonical_url: string;
  updated_at: string;
}

export interface BlogListResult {
  posts: BlogPostCard[];
  total: number;
  /** true when the `blog_posts` table is absent (migration not applied yet). */
  missing: boolean;
}

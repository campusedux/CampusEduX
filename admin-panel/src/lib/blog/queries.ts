import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';
import { BLOG_PAGE_SIZE, sortToOrder } from '@/lib/blog/constants';
import type { BlogStatus } from '@/lib/blog/constants';

export { BLOG_PAGE_SIZE } from '@/lib/blog/constants';

// ---------------------------------------------------------------------------
// Types — kept in sync with admin migration 037 / mobile 0065.
// ---------------------------------------------------------------------------
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  post_count?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  featured_image_alt: string;
  author_id: string | null;
  author_name: string;
  category_id: string | null;
  category_name: string;
  tags: string[];
  status: BlogStatus;
  published_at: string | null;
  reading_time: number;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  canonical_url: string;
  is_featured: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

const LIST_COLS =
  'id,title,slug,excerpt,featured_image,author_name,category_id,category_name,tags,status,published_at,reading_time,is_featured,created_at,updated_at';

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export async function getBlogDashboard() {
  const supabase = createClient();
  const [total, published, drafts, archived, featured, categories] = await Promise.all([
    safeCount(supabase.from('blog_posts').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    safeCount(supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft')),
    safeCount(supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'archived')),
    safeCount(
      supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_featured', true)
        .eq('status', 'published'),
    ),
    safeCount(supabase.from('blog_categories').select('id', { count: 'exact', head: true })),
  ]);
  return { total, published, drafts, archived, featured, categories };
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
export async function listBlogPosts(opts: {
  page: number;
  q?: string;
  status?: string;
  category?: string;
  sort?: string;
}) {
  const supabase = createClient();
  const from = (Math.max(1, opts.page) - 1) * BLOG_PAGE_SIZE;
  const order = sortToOrder(opts.sort);

  let query = supabase
    .from('blog_posts')
    .select(LIST_COLS, { count: 'exact' })
    .order(order.column, { ascending: order.ascending, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, from + BLOG_PAGE_SIZE - 1);

  if (opts.q) query = query.or(`title.ilike.%${opts.q}%,slug.ilike.%${opts.q}%`);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.category) query = query.eq('category_id', opts.category);

  const { data, count, error } = await query;
  return {
    rows: error ? [] : ((data ?? []) as unknown as BlogPost[]),
    total: error ? 0 : count ?? 0,
    missing: Boolean(error),
  };
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  const supabase = createClient();
  const { data } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle();
  return (data as BlogPost) ?? null;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createClient();
  const { data } = await supabase.from('blog_posts').select('*').ilike('slug', slug).maybeSingle();
  return (data as BlogPost) ?? null;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function listBlogCategories(): Promise<BlogCategory[]> {
  const supabase = createClient();
  const cats = await safe<BlogCategory[]>(
    supabase.from('blog_categories').select('*').order('sort_order').order('name'),
    [],
  );
  if (cats.length === 0) return cats;
  const { data: posts } = await supabase.from('blog_posts').select('category_id');
  const counts = new Map<string, number>();
  for (const p of (posts ?? []) as { category_id: string | null }[]) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }
  return cats.map((c) => ({ ...c, post_count: counts.get(c.id) ?? 0 }));
}

export async function getBlogCategory(id: string): Promise<BlogCategory | null> {
  const supabase = createClient();
  const { data } = await supabase.from('blog_categories').select('*').eq('id', id).maybeSingle();
  return (data as BlogCategory) ?? null;
}

/** `{ id, name }[]` for the post form's category `<select>`. */
export async function getCategoryOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data } = await supabase.from('blog_categories').select('id,name').order('sort_order').order('name');
  return (data ?? []) as { id: string; name: string }[];
}

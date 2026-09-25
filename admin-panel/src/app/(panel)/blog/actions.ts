'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { urlFieldError } from '@/lib/safeUrl';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import {
  slugify,
  isValidSlug,
  parseTags,
  readingTimeFromMarkdown,
  excerptFromMarkdown,
  BLOG_STATUSES,
} from '@/lib/blog/constants';
import type { BlogStatus } from '@/lib/blog/constants';

// The Blog CMS runs under its own `blog` permission module (migration 037/0065
// seeds `role_permissions`). RLS `blog_posts_admin_all` / `blog_categories_admin_all`
// (is_admin) is the authoritative backstop; the public only ever sees a live
// published row.
const MODULE = 'blog' as const;

type Result = { ok: boolean; error?: string };
type IdResult = Result & { id?: string };

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';

async function actorId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function pgError(message: string): string {
  if (/duplicate key|unique constraint/i.test(message)) return 'That slug is already used by another post — pick a different one.';
  if (/blog_posts_slug_check|blog_categories_slug_check|slug.*~/i.test(message))
    return 'Slug must be lower-case letters, numbers and single hyphens.';
  if (/violates foreign key/i.test(message)) return 'That category no longer exists — reload and try again.';
  return message;
}

function statusOf(fd: FormData): BlogStatus {
  const v = s(fd, 'status');
  return (BLOG_STATUSES as readonly string[]).includes(v) ? (v as BlogStatus) : 'draft';
}

function resolveSlug(fd: FormData, from: string): { ok: true; slug: string } | { ok: false; error: string } {
  const raw = s(fd, 'slug');
  const slug = raw ? slugify(raw) : slugify(s(fd, from));
  if (!slug) return { ok: false, error: 'Could not build a URL slug — enter one explicitly.' };
  if (!isValidSlug(slug)) return { ok: false, error: 'Slug must be lower-case letters, numbers and single hyphens.' };
  return { ok: true, slug };
}

/** Parse the form's `<input type="datetime-local">` into an ISO string. */
function publishedAtFrom(fd: FormData): string | null {
  const raw = s(fd, 'published_at');
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function postPayload(fd: FormData) {
  const content = String(fd.get('content') ?? '');
  const title = s(fd, 'title');
  const status = statusOf(fd);
  let publishedAt = publishedAtFrom(fd);
  // Publishing with no explicit date → stamp "now" so the post goes live.
  if (status === 'published' && !publishedAt) publishedAt = new Date().toISOString();

  return {
    title,
    excerpt: s(fd, 'excerpt') || excerptFromMarkdown(content),
    content,
    featured_image: s(fd, 'featured_image') || null,
    featured_image_alt: s(fd, 'featured_image_alt'),
    author_name: s(fd, 'author_name') || 'CampusEduX Team',
    category_id: s(fd, 'category_id') || null,
    tags: parseTags(s(fd, 'tags')),
    status,
    published_at: publishedAt,
    reading_time: readingTimeFromMarkdown(content),
    seo_title: s(fd, 'seo_title'),
    seo_description: s(fd, 'seo_description'),
    seo_keywords: s(fd, 'seo_keywords'),
    canonical_url: s(fd, 'canonical_url'),
    is_featured: bool(fd, 'is_featured'),
  };
}

/** Best-effort: bust the website's `blog` cache tag immediately after a write.
 *  No-op unless BOTH the website origin and the shared secret are configured. */
async function pingWebsiteBlogCache(): Promise<void> {
  const origin = process.env.NEXT_PUBLIC_WEBSITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!origin || !secret) return;
  try {
    await fetch(`${origin.replace(/\/$/, '')}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ tags: ['blog'] }),
      cache: 'no-store',
    });
  } catch {
    /* the website also refreshes on its own interval — never block the action */
  }
}

// ===========================================================================
// POSTS
// ===========================================================================
export async function createPost(_p: IdResult, fd: FormData): Promise<IdResult> {
  await requirePermission(MODULE, 'add');
  const urlErr = urlFieldError(fd, { featured_image: 'Featured image URL', canonical_url: 'Canonical URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const payload = await postPayload(fd);
  if (!payload.title) return { ok: false, error: 'Title is required.' };
  const slug = resolveSlug(fd, 'title');
  if (!slug.ok) return slug;
  const uid = await actorId();

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({ ...payload, slug: slug.slug, created_by: uid, updated_by: uid })
    .select('id')
    .single();
  if (error) return { ok: false, error: pgError(error.message) };

  await logActivity({ action: 'blog.post.create', module: MODULE, resourceType: 'blog_posts', resourceId: data.id });
  revalidatePath('/blog');
  await pingWebsiteBlogCache();
  return { ok: true, id: data.id };
}

export async function updatePost(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const urlErr = urlFieldError(fd, { featured_image: 'Featured image URL', canonical_url: 'Canonical URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const payload = await postPayload(fd);
  if (!payload.title) return { ok: false, error: 'Title is required.' };
  const slug = resolveSlug(fd, 'title');
  if (!slug.ok) return slug;

  const { error } = await supabase
    .from('blog_posts')
    .update({ ...payload, slug: slug.slug, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };

  await logActivity({ action: 'blog.post.update', module: MODULE, resourceType: 'blog_posts', resourceId: id });
  revalidatePath('/blog');
  revalidatePath(`/blog/${id}`);
  await pingWebsiteBlogCache();
  return { ok: true };
}

export async function deletePost(id: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'blog.post.delete', module: MODULE, resourceType: 'blog_posts', resourceId: id });
  revalidatePath('/blog');
  await pingWebsiteBlogCache();
  return { ok: true };
}

/** Publish / unpublish (→ draft) / archive from the table. Publishing stamps
 *  `published_at` the first time only, so re-publishing keeps the original date. */
export async function setPostStatus(id: string, status: BlogStatus): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  if (!(BLOG_STATUSES as readonly string[]).includes(status)) return { ok: false, error: 'Unknown status.' };
  const supabase = createClient();

  const patch: Record<string, unknown> = { status, updated_by: await actorId() };
  if (status === 'published') {
    const { data: row } = await supabase.from('blog_posts').select('published_at').eq('id', id).maybeSingle();
    if (!row?.published_at) patch.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from('blog_posts').update(patch).eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `blog.post.${status}`, module: MODULE, resourceType: 'blog_posts', resourceId: id });
  revalidatePath('/blog');
  await pingWebsiteBlogCache();
  return { ok: true };
}

export async function setPostFeatured(id: string, next: boolean): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('blog_posts')
    .update({ is_featured: next, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'blog.post.featured', module: MODULE, resourceType: 'blog_posts', resourceId: id });
  revalidatePath('/blog');
  await pingWebsiteBlogCache();
  return { ok: true };
}

/** Copy a post as a fresh draft — handy for a series or a template. */
export async function duplicatePost(id: string): Promise<IdResult> {
  await requirePermission(MODULE, 'add');
  const supabase = createClient();
  const { data: src, error: readErr } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle();
  if (readErr || !src) return { ok: false, error: 'Post not found.' };

  const uid = await actorId();
  const base = slugify(`${src.slug}-copy`).slice(0, 70) || 'post-copy';
  let slug = base;
  for (let i = 2; i < 50; i += 1) {
    const { data: clash } = await supabase.from('blog_posts').select('id').ilike('slug', slug).maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const { id: _omit, created_at: _c, updated_at: _u, ...rest } = src as Record<string, unknown>;
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      ...rest,
      title: `${src.title} (copy)`,
      slug,
      status: 'draft',
      is_featured: false,
      published_at: null,
      created_by: uid,
      updated_by: uid,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'blog.post.duplicate', module: MODULE, resourceType: 'blog_posts', resourceId: data.id });
  revalidatePath('/blog');
  return { ok: true, id: data.id };
}

// ===========================================================================
// CATEGORIES
// ===========================================================================
export async function createCategory(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'add');
  const supabase = createClient();
  const name = s(fd, 'name');
  if (!name) return { ok: false, error: 'Category name is required.' };
  const slug = resolveSlug(fd, 'name');
  if (!slug.ok) return slug;

  const { error } = await supabase.from('blog_categories').insert({
    name,
    slug: slug.slug,
    description: s(fd, 'description'),
    sort_order: Number(s(fd, 'sort_order')) || 0,
  });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'blog.category.create', module: MODULE, resourceType: 'blog_categories' });
  revalidatePath('/blog/categories');
  revalidatePath('/blog');
  await pingWebsiteBlogCache();
  return { ok: true };
}

export async function updateCategory(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const name = s(fd, 'name');
  if (!name) return { ok: false, error: 'Category name is required.' };
  const slug = resolveSlug(fd, 'name');
  if (!slug.ok) return slug;

  const { error } = await supabase
    .from('blog_categories')
    .update({
      name,
      slug: slug.slug,
      description: s(fd, 'description'),
      sort_order: Number(s(fd, 'sort_order')) || 0,
    })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'blog.category.update', module: MODULE, resourceType: 'blog_categories', resourceId: id });
  revalidatePath('/blog/categories');
  revalidatePath('/blog');
  await pingWebsiteBlogCache();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);
  if ((count ?? 0) > 0) {
    return { ok: false, error: `${count} post${count === 1 ? '' : 's'} still use this category — reassign them first.` };
  }
  const { error } = await supabase.from('blog_categories').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'blog.category.delete', module: MODULE, resourceType: 'blog_categories', resourceId: id });
  revalidatePath('/blog/categories');
  revalidatePath('/blog');
  await pingWebsiteBlogCache();
  return { ok: true };
}

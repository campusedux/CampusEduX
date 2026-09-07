import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidatePath, requirePermission, logActivity } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requirePermission: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/auth', () => ({ requirePermission }));
vi.mock('@/lib/audit', () => ({ logActivity }));

import { supabase, resetSupabaseMock, setUser, setTableResult, callsFor } from '../helpers/supabase.mock';
vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));

import {
  createPost,
  updatePost,
  deletePost,
  setPostStatus,
  setPostFeatured,
  createCategory,
  deleteCategory,
} from '@/app/(panel)/blog/actions';

const ADMIN = { id: 'admin-1', email: 'a@campusedux.app', fullName: 'A', role: 'editor' };

beforeEach(() => {
  resetSupabaseMock();
  requirePermission.mockReset().mockResolvedValue(ADMIN);
  logActivity.mockReset().mockResolvedValue(undefined);
  revalidatePath.mockClear();
  setUser({ id: 'admin-1' });
  delete process.env.NEXT_PUBLIC_WEBSITE_URL;
  delete process.env.REVALIDATE_SECRET;
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe('createPost', () => {
  it('gates on blog:add, derives a slug, computes reading time and audits', async () => {
    setTableResult('blog_posts', { data: { id: 'post-9' } });

    const res = await createPost({ ok: false }, form({
      title: 'What is Artificial Intelligence?',
      content: 'word '.repeat(600),
      status: 'draft',
    }));

    expect(res).toEqual({ ok: true, id: 'post-9' });
    expect(requirePermission).toHaveBeenCalledWith('blog', 'add');
    const insert = callsFor('blog_posts').find((c) => c.verb === 'insert');
    expect(insert?.args[0]).toMatchObject({
      title: 'What is Artificial Intelligence?',
      slug: 'what-is-artificial-intelligence',
      status: 'draft',
      published_at: null,
      created_by: 'admin-1',
    });
    expect((insert?.args[0] as { reading_time: number }).reading_time).toBe(3);
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'blog.post.create', module: 'blog', resourceType: 'blog_posts' }),
    );
  });

  it('stamps published_at when created directly as published', async () => {
    setTableResult('blog_posts', { data: { id: 'post-10' } });
    await createPost({ ok: false }, form({ title: 'Live now', content: 'hello world', status: 'published' }));
    const insert = callsFor('blog_posts').find((c) => c.verb === 'insert');
    expect((insert?.args[0] as { published_at: string | null }).published_at).toBeTypeOf('string');
    expect((insert?.args[0] as { status: string }).status).toBe('published');
  });

  it('rejects an empty title before writing', async () => {
    const res = await createPost({ ok: false }, form({ title: '   ', content: 'x' }));
    expect(res.ok).toBe(false);
    expect(callsFor('blog_posts').some((c) => c.verb === 'insert')).toBe(false);
  });

  it('normalises a messy explicit slug instead of rejecting it', async () => {
    setTableResult('blog_posts', { data: { id: 'post-11' } });
    await createPost({ ok: false }, form({ title: 'Ok', slug: 'My Cool Post!!', content: 'x' }));
    const insert = callsFor('blog_posts').find((c) => c.verb === 'insert');
    expect((insert?.args[0] as { slug: string }).slug).toBe('my-cool-post');
  });

  it('rejects when no usable slug can be built', async () => {
    const res = await createPost({ ok: false }, form({ title: '!!!', slug: '!!!', content: 'x' }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/slug/i);
    expect(callsFor('blog_posts').some((c) => c.verb === 'insert')).toBe(false);
  });

  it('propagates a permission failure (never writes)', async () => {
    requirePermission.mockRejectedValueOnce(new Error("You don't have permission to add in blog."));
    await expect(createPost({ ok: false }, form({ title: 'x', content: 'y' }))).rejects.toThrow(/permission/i);
    expect(callsFor('blog_posts').some((c) => c.verb === 'insert')).toBe(false);
  });
});

describe('updatePost', () => {
  it('gates on blog:edit and writes updated_by', async () => {
    setTableResult('blog_posts', { data: null, error: null });
    const res = await updatePost('post-1', { ok: false }, form({ title: 'Edited', content: 'body text here' }));
    expect(res).toEqual({ ok: true });
    expect(requirePermission).toHaveBeenCalledWith('blog', 'edit');
    const update = callsFor('blog_posts').find((c) => c.verb === 'update');
    expect(update?.args[0]).toMatchObject({ title: 'Edited', updated_by: 'admin-1' });
  });
});

describe('setPostStatus', () => {
  it('publishing stamps published_at only when it is not already set', async () => {
    setTableResult('blog_posts', { data: { published_at: null } });
    const res = await setPostStatus('post-1', 'published');
    expect(res.ok).toBe(true);
    expect(requirePermission).toHaveBeenCalledWith('blog', 'edit');
    const update = callsFor('blog_posts').find((c) => c.verb === 'update');
    expect(update?.args[0]).toMatchObject({ status: 'published' });
    expect((update?.args[0] as { published_at?: string }).published_at).toBeTypeOf('string');
  });

  it('keeps the original published_at on re-publish', async () => {
    setTableResult('blog_posts', { data: { published_at: '2026-01-01T00:00:00Z' } });
    await setPostStatus('post-1', 'published');
    const update = callsFor('blog_posts').find((c) => c.verb === 'update');
    expect((update?.args[0] as Record<string, unknown>).published_at).toBeUndefined();
  });

  it('unpublish sets status back to draft', async () => {
    setTableResult('blog_posts', { data: { published_at: '2026-01-01T00:00:00Z' } });
    await setPostStatus('post-1', 'draft');
    const update = callsFor('blog_posts').find((c) => c.verb === 'update');
    expect((update?.args[0] as { status: string }).status).toBe('draft');
  });

  it('rejects an unknown status', async () => {
    const res = await setPostStatus('post-1', 'bogus' as never);
    expect(res.ok).toBe(false);
  });
});

describe('setPostFeatured / deletePost', () => {
  it('setPostFeatured gates on blog:edit', async () => {
    setTableResult('blog_posts', { data: null });
    await setPostFeatured('post-1', true);
    expect(requirePermission).toHaveBeenCalledWith('blog', 'edit');
    const update = callsFor('blog_posts').find((c) => c.verb === 'update');
    expect(update?.args[0]).toMatchObject({ is_featured: true });
  });

  it('deletePost gates on blog:delete', async () => {
    setTableResult('blog_posts', { data: null });
    const res = await deletePost('post-1');
    expect(res.ok).toBe(true);
    expect(requirePermission).toHaveBeenCalledWith('blog', 'delete');
    expect(callsFor('blog_posts').some((c) => c.verb === 'delete')).toBe(true);
  });
});

describe('categories', () => {
  it('createCategory gates on blog:add and derives a slug', async () => {
    setTableResult('blog_categories', { data: null });
    const res = await createCategory({ ok: false }, form({ name: 'Future of Technology' }));
    expect(res.ok).toBe(true);
    expect(requirePermission).toHaveBeenCalledWith('blog', 'add');
    const insert = callsFor('blog_categories').find((c) => c.verb === 'insert');
    expect(insert?.args[0]).toMatchObject({ name: 'Future of Technology', slug: 'future-of-technology' });
  });

  it('deleteCategory refuses while posts still use it', async () => {
    setTableResult('blog_posts', { data: null, count: 4 });
    const res = await deleteCategory('cat-1');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/reassign/i);
    expect(callsFor('blog_categories').some((c) => c.verb === 'delete')).toBe(false);
  });
});

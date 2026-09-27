import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { updateTopic, setGridField, deleteGrid, updateContent, deleteContent } from '@/app/(panel)/learning/actions';
import { deleteTopicCodingProblem } from '@/app/(panel)/learning/practice-actions';
import { createInterviewCategory } from '@/app/(panel)/learning/interview-questions-global-actions';
import { retryWebsiteRefresh } from '@/app/(panel)/learning/site-sync-actions';

const SHARED = 'unit-test-shared-value-123';
const ADMIN = { id: 'admin-1', email: 'a@campusedux.app', fullName: 'A', role: 'editor' };
const TOPIC_PATH = '/learning/grids/g1/sections/s1/topics/t1';

/** Every call to the website endpoint: its tags, and how many DB writes had happened by then. */
const fetchMock = vi.fn();
const sent = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).tags as string[]);
const writes = () => supabase.calls.filter((c) => ['insert', 'update', 'delete', 'upsert'].includes(c.verb ?? '')).length;

function acceptAll(tagsSeenAt?: number[]) {
  fetchMock.mockImplementation(async (_url: string, init: { body: string }) => {
    tagsSeenAt?.push(writes());
    const tags = JSON.parse(init.body).tags as string[];
    return new Response(JSON.stringify({ revalidated: true, tags, paths: [] }), { status: 200 });
  });
}

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  resetSupabaseMock();
  requirePermission.mockReset().mockResolvedValue(ADMIN);
  logActivity.mockReset().mockResolvedValue(undefined);
  revalidatePath.mockClear();
  setUser({ id: 'admin-1' });
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NEXT_PUBLIC_WEBSITE_URL', 'https://site.example');
  vi.stubEnv('REVALIDATE_SECRET', SHARED);
  // One row answers every lookup on these tables (slug reads and writes alike).
  setTableResult('learning_grids', { data: { slug: 'java-tutorial' } });
  setTableResult('learning_topics', { data: { slug: 'intro', grid_id: 'g1' } });
  setTableResult('dsa_problems', { data: { slug: 'two-sum' } });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('the website refresh happens only after a successful write', () => {
  it('a failed write returns the error and never calls the website', async () => {
    setTableResult('learning_topics', { data: null, error: { message: 'boom' } });
    const res = await updateTopic('t1', 's1', 'g1', { ok: false }, form({ title: 'Intro', slug: 'intro' }));
    expect(res.ok).toBe(false);
    expect(res.error).toBe('boom');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a validation failure (no write) never calls the website', async () => {
    const res = await updateTopic('t1', 's1', 'g1', { ok: false }, form({ title: '' }));
    expect(res.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a permission failure throws before any write or website call', async () => {
    requirePermission.mockRejectedValue(new Error('forbidden'));
    await expect(setGridField('g1', 'status', 'published')).rejects.toThrow('forbidden');
    expect(writes()).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls the website after the write has been issued', async () => {
    const at: number[] = [];
    acceptAll(at);
    const res = await setGridField('g1', 'status', 'published');
    expect(res).toEqual({ ok: true });
    expect(at).toEqual([1]); // exactly one DB write had happened when the website was called
  });
});

describe('tags sent', () => {
  it('grid change: catalogue + sitemap + that course', async () => {
    acceptAll();
    await setGridField('g1', 'is_premium', true);
    expect(sent()).toEqual([['learning:list', 'learning:sitemap', 'learning:grid:java-tutorial']]);
  });

  it('topic edit: the whole course, catalogue and sitemap (titles/order/visibility can change)', async () => {
    acceptAll();
    const res = await updateTopic('t1', 's1', 'g1', { ok: false }, form({ title: 'Intro', slug: 'intro' }));
    expect(res.ok).toBe(true);
    expect(sent()).toEqual([['learning:list', 'learning:sitemap', 'learning:grid:java-tutorial']]);
  });

  it('content edit: only that topic', async () => {
    acceptAll();
    const res = await updateContent('c1', TOPIC_PATH, { ok: false }, form({ title: 'Body', body: 'x', content_format: 'markdown' }));
    expect(res.ok).toBe(true);
    expect(sent()).toEqual([['learning:topic:java-tutorial:intro']]);
  });

  it('client-supplied path is only used to look ids up, never turned into a tag', async () => {
    acceptAll();
    await deleteContent('c1', '/learning/grids/g1/sections/s1/topics/t1/../../evil:tag');
    expect(sent().flat().every((t) => /^learning:topic:java-tutorial:intro$/.test(t))).toBe(true);
  });

  it('deleting a grid reads its slug BEFORE the delete', async () => {
    acceptAll();
    setTableResult('learning_sections', { data: null, error: null });
    const res = await deleteGrid('g1');
    expect(res.ok).toBe(true);
    const grid = callsFor('learning_grids');
    expect(grid.findIndex((c) => c.verb === 'select')).toBeLessThan(grid.findIndex((c) => c.verb === 'delete'));
    expect(sent()[0]).toContain('learning:grid:java-tutorial');
  });

  it('coding problem delete: topic, the problem page (slug read before the delete) and sitemap', async () => {
    acceptAll();
    const res = await deleteTopicCodingProblem('p1', TOPIC_PATH);
    expect(res.error).toBeUndefined();
    expect(res.ok).toBe(true);
    expect(sent()[0]).toEqual(expect.arrayContaining(['learning:topic:java-tutorial:intro', 'learning:sitemap', 'learning:coding:two-sum']));
  });

  it('interview module uses its coarse tag', async () => {
    acceptAll();
    const res = await createInterviewCategory({ ok: false }, form({ name: 'Java', slug: 'java' }));
    expect(res.error).toBeUndefined();
    expect(res.ok).toBe(true);
    expect(sent()).toEqual([['interview-questions']]);
  });
});

describe('a refresh failure is a warning, never an error, and never rolls back', () => {
  it('network failure: ok stays true, warning + retry tags, secret not leaked', async () => {
    fetchMock.mockRejectedValue(new Error(`connect failed ${SHARED}`));
    const res = await setGridField('g1', 'status', 'published');
    expect(res.ok).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.warning).toMatch(/not refreshed/);
    expect(res.retryTags).toEqual(['learning:list', 'learning:sitemap', 'learning:grid:java-tutorial']);
    expect(JSON.stringify(res)).not.toContain(SHARED);
    expect(callsFor('learning_grids').some((c) => c.verb === 'delete')).toBe(false); // nothing undone
  });

  it('website 401 (wrong value) is also only a warning', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));
    const res = await setGridField('g1', 'status', 'published');
    expect(res).toMatchObject({ ok: true });
    expect(res.warning).toBeDefined();
  });

  it('not configured: warning, no request made', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '');
    const res = await setGridField('g1', 'status', 'published');
    expect(res.ok).toBe(true);
    expect(res.warning).toMatch(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('success carries no warning field at all', async () => {
    acceptAll();
    expect(await setGridField('g1', 'status', 'published')).toEqual({ ok: true });
  });
});

describe('retryWebsiteRefresh (Retry button)', () => {
  it('requires learning:edit, drops malformed tags, and refreshes the rest', async () => {
    acceptAll();
    const res = await retryWebsiteRefresh(['learning:list', 'projects', 'learning:grid:x y']);
    expect(requirePermission).toHaveBeenCalledWith('learning', 'edit');
    expect(res).toEqual({ ok: true });
    expect(sent()).toEqual([['learning:list']]);
  });

  it('rejects an all-invalid list without calling the website', async () => {
    const res = await retryWebsiteRefresh(['projects', 'x']);
    expect(res.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is denied for callers without permission', async () => {
    requirePermission.mockRejectedValue(new Error('forbidden'));
    await expect(retryWebsiteRefresh(['learning:list'])).rejects.toThrow('forbidden');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a still-failing retry as a warning again', async () => {
    fetchMock.mockRejectedValue(new Error('down'));
    const res = await retryWebsiteRefresh(['learning:list']);
    expect(res.ok).toBe(true);
    expect(res.warning).toBeDefined();
    expect(res.retryTags).toEqual(['learning:list']);
  });
});

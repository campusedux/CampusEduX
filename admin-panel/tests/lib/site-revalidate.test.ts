import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshWebsiteCache, sanitizeTags, learningTag } from '@/lib/learning/siteRevalidate';

const SHARED = 'unit-test-shared-value-123';
const ORIGIN = 'https://site.example';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NEXT_PUBLIC_WEBSITE_URL', ORIGIN + '/');
  vi.stubEnv('REVALIDATE_SECRET', SHARED);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const ok = (tags: string[]) => new Response(JSON.stringify({ revalidated: true, tags, paths: [] }), { status: 200 });

describe('sanitizeTags', () => {
  it('keeps only well-formed learning tags and de-duplicates', () => {
    expect(
      sanitizeTags(['learning:list', 'learning:list', 'learning:grid:java', 'learning:topic:java:intro', 'learning:coding:two-sum', 'practice', 'interview-questions', 'learning']),
    ).toEqual(['learning:list', 'learning:grid:java', 'learning:topic:java:intro', 'learning:coding:two-sum', 'practice', 'interview-questions', 'learning']);
  });
  it('drops anything else', () => {
    expect(sanitizeTags(['projects', 'learning:grid:', 'learning:grid:a b', 'x', 42, null, 'learning:topic:a'])).toEqual([]);
    expect(sanitizeTags('learning:list')).toEqual([]);
  });
});

describe('refreshWebsiteCache', () => {
  it('POSTs the tags to the website with the shared value in a header, and reports nothing on success', async () => {
    const tags = [learningTag.list, learningTag.grid('Java'), learningTag.sitemap];
    fetchMock.mockResolvedValue(ok(tags));
    expect(await refreshWebsiteCache(tags)).toEqual({});
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${ORIGIN}/api/revalidate`);
    expect(init.method).toBe('POST');
    expect(init.headers.get('x-revalidate-secret')).toBe(SHARED);
    expect(JSON.parse(init.body)).toEqual({ tags: ['learning:list', 'learning:grid:java', 'learning:sitemap'] });
  });

  it('sends nothing for an empty or invalid tag list', async () => {
    expect(await refreshWebsiteCache([])).toEqual({});
    expect(await refreshWebsiteCache(['evil'])).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  const cases: [string, () => void][] = [
    ['not configured (origin)', () => vi.stubEnv('NEXT_PUBLIC_WEBSITE_URL', '')],
    ['not configured (shared value)', () => vi.stubEnv('REVALIDATE_SECRET', '')],
    ['website answers 401', () => fetchMock.mockResolvedValue(new Response('{}', { status: 401 }))],
    ['website answers 500', () => fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))],
    ['network error', () => fetchMock.mockRejectedValue(new Error(`boom ${SHARED}`))],
    ['old endpoint ignores the new tags', () => fetchMock.mockResolvedValue(ok([]))],
  ];
  for (const [name, arrange] of cases) {
    it(`returns a warning with retry tags (not a throw) when ${name}`, async () => {
      fetchMock.mockResolvedValue(ok([learningTag.list]));
      arrange();
      const res = await refreshWebsiteCache([learningTag.list]);
      expect(res.warning).toMatch(/Saved, but the website cache was not refreshed/);
      expect(res.retryTags).toEqual(['learning:list']);
      const text = JSON.stringify(res);
      expect(text).not.toContain(SHARED);
      expect(text).not.toContain(ORIGIN);
    });
  }
});

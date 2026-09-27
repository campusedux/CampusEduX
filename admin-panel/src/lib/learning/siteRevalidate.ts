/**
 * Website cache refresh for Learning content — SERVER ONLY.
 *
 * After an admin write succeeds, `refreshWebsiteCache()` asks the public
 * website (`POST /api/revalidate`) to drop the matching cache tags. The shared
 * revalidation value is read from `process.env` here and nowhere else; this
 * module must never be imported from a `'use client'` file (a test enforces it).
 * Same pattern as `pingWebsiteBlogCache` in the Blog module.
 *
 * A refresh problem NEVER fails or rolls back the data write: it is reported as
 * a `warning` (+ `retryTags`) on an otherwise `ok: true` result.
 */

/** What an action returns on top of `{ ok: true }` when the site refresh did not happen. */
export type SiteSync = { warning?: string; retryTags?: string[] };

const SLUG = '[a-z0-9][a-z0-9_-]{0,99}';
/** Tags the website endpoint accepts for Learning (mirrors website/src/lib/learningTags.ts). */
const TAG_PATTERN = new RegExp(
  `^(?:learning|practice|interview-questions|learning:(?:list|sitemap|grid:${SLUG}|topic:${SLUG}:${SLUG}|coding:${SLUG}))$`,
);
const MAX_TAGS = 50;
const TIMEOUT_MS = 5000;

export const learningTag = {
  list: 'learning:list',
  sitemap: 'learning:sitemap',
  grid: (grid: string) => `learning:grid:${grid.toLowerCase()}`,
  topic: (grid: string, topic: string) => `learning:topic:${grid.toLowerCase()}:${topic.toLowerCase()}`,
  coding: (slug: string) => `learning:coding:${slug.toLowerCase()}`,
} as const;

/** Keep only well-formed, de-duplicated tags (also used to vet client-supplied retry tags). */
export function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const out = new Set<string>();
  for (const t of tags) {
    if (typeof t === 'string' && TAG_PATTERN.test(t)) out.add(t);
    if (out.size >= MAX_TAGS) break;
  }
  return [...out];
}

const EXPIRY_NOTE = 'It will appear on the public site when its cache expires (up to about an hour). You can retry the refresh.';

export async function refreshWebsiteCache(tags: string[]): Promise<SiteSync> {
  const send = sanitizeTags(tags);
  if (send.length === 0) return {};
  const fail = (why: string): SiteSync => ({ warning: `Saved, but the website cache was not refreshed (${why}). ${EXPIRY_NOTE}`, retryTags: send });

  const origin = process.env.NEXT_PUBLIC_WEBSITE_URL;
  const shared = process.env.REVALIDATE_SECRET;
  if (!origin || !shared) return fail('refresh is not configured');

  try {
    const headers = new Headers();
    headers.set('content-type', 'application/json');
    headers.set('x-revalidate-secret', shared);
    const res = await fetch(`${origin.replace(/\/$/, '')}/api/revalidate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tags: send }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return fail(`website answered ${res.status}`);
    const body = (await res.json().catch(() => null)) as { tags?: unknown } | null;
    const accepted = Array.isArray(body?.tags) ? (body!.tags as unknown[]) : [];
    const missed = send.filter((t) => !accepted.includes(t));
    if (missed.length) return fail('the website did not accept every tag');
    return {};
  } catch {
    return fail('the website could not be reached');
  }
}

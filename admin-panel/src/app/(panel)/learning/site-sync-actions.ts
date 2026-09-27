'use server';

import { requirePermission } from '@/lib/auth';
import { refreshWebsiteCache, sanitizeTags, type SiteSync } from '@/lib/learning/siteRevalidate';

/**
 * "Retry" for a Learning save whose website cache refresh failed. The tags come
 * from the browser, so they are re-validated against the allowlist pattern and
 * the caller must hold the `learning:edit` permission. Only the cache is touched.
 */
export async function retryWebsiteRefresh(tags: string[]): Promise<{ ok: boolean; error?: string } & SiteSync> {
  await requirePermission('learning', 'edit');
  const clean = sanitizeTags(tags);
  if (clean.length === 0) return { ok: false, error: 'Nothing to refresh.' };
  return { ok: true, ...(await refreshWebsiteCache(clean)) };
}

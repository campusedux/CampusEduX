import { createClient } from '@/lib/supabase/server';
import { learningTag, refreshWebsiteCache, type SiteSync } from '@/lib/learning/siteRevalidate';

/**
 * Turns "what the admin just changed" into website cache tags and refreshes
 * them. SERVER ONLY. Every function here is best-effort and never throws: the
 * data write has already succeeded and must not be reported as failed because
 * a slug lookup or the refresh call failed. Slugs are read with the admin's own
 * session (read-only SELECTs, RLS unchanged). If a scope cannot be resolved, the
 * coarse `learning` tag is used instead of silently skipping the refresh.
 */

const COARSE = 'learning';

export async function gridSlugById(gridId: string): Promise<string | null> {
  try {
    const { data } = await createClient().from('learning_grids').select('slug').eq('id', gridId).maybeSingle();
    return (data?.slug as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function codingSlugById(id: string): Promise<string | null> {
  try {
    const { data } = await createClient().from('dsa_problems').select('slug').eq('id', id).maybeSingle();
    return (data?.slug as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function topicSlugsById(topicId: string): Promise<{ grid: string; topic: string } | null> {
  try {
    const supabase = createClient();
    const { data: t } = await supabase.from('learning_topics').select('slug, grid_id').eq('id', topicId).maybeSingle();
    if (!t?.slug || !t.grid_id) return null;
    const grid = await gridSlugById(t.grid_id as string);
    return grid ? { grid, topic: t.slug as string } : null;
  } catch {
    return null;
  }
}

/** Admin URLs look like /learning/grids/<gridId>[/sections/<id>][/topics/<topicId>]. */
export function parseAdminPath(path: string): { gridId?: string; topicId?: string } {
  const m = /^\/learning\/grids\/([^/?#]+)(?:\/sections\/[^/?#]+)?(?:\/topics\/([^/?#]+))?/.exec(path);
  return { gridId: m?.[1], topicId: m?.[2] };
}

/** Grid/section/topic structure changed (titles, order, visibility, create/delete): refresh the course + catalogue + sitemap. */
export async function syncGridStructure(gridSlugs: (string | null | undefined)[]): Promise<SiteSync> {
  const slugs = [...new Set(gridSlugs.filter((s): s is string => Boolean(s)))];
  return refreshWebsiteCache([learningTag.list, learningTag.sitemap, ...slugs.map(learningTag.grid)]);
}

export async function syncGridStructureById(gridId: string, extraSlugs: (string | null | undefined)[] = []): Promise<SiteSync> {
  const slug = await gridSlugById(gridId);
  return slug || extraSlugs.some(Boolean) ? syncGridStructure([slug, ...extraSlugs]) : refreshWebsiteCache([COARSE]);
}

/**
 * A single topic's content / practice changed. `path` is the admin page URL the
 * action was called from; it is only used to look up ids in the database, never
 * to build a tag directly. `extraTags` adds e.g. a coding-problem tag.
 */
export async function syncTopicByPath(path: string, extraTags: string[] = []): Promise<SiteSync> {
  const { gridId, topicId } = parseAdminPath(path);
  const scope = topicId ? await topicSlugsById(topicId) : null;
  if (scope) return refreshWebsiteCache([learningTag.topic(scope.grid, scope.topic), ...extraTags]);
  const grid = gridId ? await gridSlugById(gridId) : null;
  return refreshWebsiteCache(grid ? [learningTag.grid(grid), ...extraTags] : [COARSE, ...extraTags]);
}

/** Coding problems are also served at /coding-problems/<slug> and listed in the sitemap. */
export function codingTags(...slugs: (string | null | undefined)[]): string[] {
  return [learningTag.sitemap, ...[...new Set(slugs.filter((s): s is string => Boolean(s)))].map(learningTag.coding)];
}

/** Global Practice / Interview Questions modules. Their website reads use the coarse tags. */
export const syncPractice = () => refreshWebsiteCache(['practice']);
export const syncInterview = () => refreshWebsiteCache(['interview-questions']);

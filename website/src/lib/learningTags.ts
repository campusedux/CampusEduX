/**
 * Cache tags for the public Learning read layer (`lib/learning.ts`), derived
 * from the real route structure /learning/[gridSlug]/[topicSlug]. Every entry
 * also carries the coarse `learning` tag, so the existing `{ tags: ["learning"] }`
 * call keeps working.
 *
 *   learning:list                 grid catalogue (/learning, home, discovery)
 *   learning:sitemap              sitemap + static-param sources
 *   learning:grid:<gridSlug>      one course: brief, tree, and ALL its topics
 *   learning:topic:<grid>:<topic> one topic (content + practice)
 *   learning:coding:<slug>        one topic coding problem
 */
/**
 * Data-cache TTLs. The route's ISR `revalidate` (3600) stacks on top of these, so
 * worst-case staleness after an edit with NO on-demand revalidation is
 * page TTL + data TTL. Per-topic entries are read once per page regeneration, so a
 * short TTL costs nothing (leaf: ~65 min worst case); the shared entries (grid
 * list, tree, brief, slug lists) serve many pages, so they get a longer one
 * (~75 min worst case). `revalidateTag` clears the data entry AND the ISR page
 * that consumed it.
 */
export const LEARNING_LEAF_REVALIDATE = 300;
export const LEARNING_SHARED_REVALIDATE = 900;

export const learningTag = {
  list: "learning:list",
  sitemap: "learning:sitemap",
  grid: (grid: string) => `learning:grid:${grid.toLowerCase()}`,
  topic: (grid: string, topic: string) => `learning:topic:${grid.toLowerCase()}:${topic.toLowerCase()}`,
  coding: (slug: string) => `learning:coding:${slug.toLowerCase()}`,
} as const;

const SLUG = "[a-z0-9][a-z0-9_-]{0,99}";
export const LEARNING_TAG_PATTERN = new RegExp(
  `^learning:(?:list|sitemap|grid:${SLUG}|topic:${SLUG}:${SLUG}|coding:${SLUG})$`,
);

export function isAllowedLearningTag(tag: string): boolean {
  return LEARNING_TAG_PATTERN.test(tag);
}

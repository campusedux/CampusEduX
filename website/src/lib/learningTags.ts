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
 * Data-cache TTLs. A route's ISR `revalidate` stacks on top of these, so worst-case
 * staleness after a change that does NOT go through `/api/revalidate` (direct SQL,
 * a migration, an admin call that failed) is page TTL + data TTL:
 *
 *   topic / coding / practice / interview DETAIL pages  ISR 86400 + data 3600  = ~25 h
 *   course overview, practice + interview hubs          ISR 21600 + data 3600  = ~7 h
 *   sitemap                                             ISR 3600  + data 3600  = ~2 h
 *
 * Admin saves and `scripts/revalidate-learning.mjs` clear both layers immediately:
 * `revalidateTag` drops the data entry AND the ISR page that consumed it.
 */
export const CONTENT_LEAF_REVALIDATE = 3600;
export const CONTENT_SHARED_REVALIDATE = 3600;
export const LEARNING_LEAF_REVALIDATE = CONTENT_LEAF_REVALIDATE;
export const LEARNING_SHARED_REVALIDATE = CONTENT_SHARED_REVALIDATE;

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

/**
 * Global Practice + Interview Questions (website/src/lib/practice.ts, interviewQuestions.ts).
 * Each entry also carries its coarse tag (`practice` / `interview-questions`), which the
 * admin panel already sends, so an admin save refreshes them even before it sends these.
 *
 *   practice:problem:<slug>            one practice problem page (+ its related/prev/next)
 *   interview:category:<cat>           category page AND every topic page in it (prev/next links)
 *   interview:topic:<cat>:<topic>      one interview topic page
 */
export const practiceTag = {
  problem: (slug: string) => `practice:problem:${slug.toLowerCase()}`,
} as const;
export const interviewTag = {
  category: (cat: string) => `interview:category:${cat.toLowerCase()}`,
  topic: (cat: string, topic: string) => `interview:topic:${cat.toLowerCase()}:${topic.toLowerCase()}`,
} as const;

export const CONTENT_TAG_PATTERN = new RegExp(
  `^(?:practice:problem:${SLUG}|interview:category:${SLUG}|interview:topic:${SLUG}:${SLUG})$`,
);

/** Every granular tag `/api/revalidate` accepts for Learning, Practice and Interview content. */
export function isAllowedContentTag(tag: string): boolean {
  return isAllowedLearningTag(tag) || CONTENT_TAG_PATTERN.test(tag);
}

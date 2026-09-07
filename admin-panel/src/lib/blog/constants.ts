/** Pure constants + helpers for the Blog module — safe to import from client
 *  components. Mirrors the CHECK constraints in admin migration 037 /
 *  mobile migration 0065. */

export { slugify, isValidSlug, parseTags } from '@/lib/learning/constants';

export const BLOG_STATUSES = ['draft', 'published', 'archived'] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const BLOG_STATUS_LABEL: Record<BlogStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

export const BLOG_PAGE_SIZE = 20;

/** Reuses the existing public `admin-media` bucket (migration 012 / 0032). */
export const BLOG_BUCKET = 'admin-media';
export const BLOG_PATH_PREFIX = 'blog';

export const BLOG_SORTS = [
  { value: 'published_desc', label: 'Newest published' },
  { value: 'published_asc', label: 'Oldest published' },
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'created_desc', label: 'Recently created' },
  { value: 'title_asc', label: 'Title A–Z' },
] as const;
export type BlogSort = (typeof BLOG_SORTS)[number]['value'];

export function sortToOrder(sort: string | undefined): { column: string; ascending: boolean } {
  switch (sort) {
    case 'published_asc':
      return { column: 'published_at', ascending: true };
    case 'updated_desc':
      return { column: 'updated_at', ascending: false };
    case 'created_desc':
      return { column: 'created_at', ascending: false };
    case 'title_asc':
      return { column: 'title', ascending: true };
    case 'published_desc':
    default:
      return { column: 'published_at', ascending: false };
  }
}

/** ~200 words/minute, minimum 1. Kept in sync with the website's
 *  `readingTimeFromMarkdown` in `website/src/lib/blog.ts`. */
export function readingTimeFromMarkdown(markdown: string): number {
  const words = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`|~\-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** A short plain-text preview from Markdown, for an auto-filled excerpt. */
export function excerptFromMarkdown(markdown: string, max = 220): string {
  const text = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^[#>\s|:-]+/gm, ' ')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

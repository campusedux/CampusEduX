/** Pure constants + helpers for the Learning module — safe to import from
 *  client components. Mirrors the CHECK constraints in
 *  admin migration 019/021 · mobile migration 0042/0044. */

export const LEARNING_STATUSES = ['draft', 'published', 'archived'] as const;
export type LearningStatus = (typeof LEARNING_STATUSES)[number];

export const CONTENT_FORMATS = ['markdown', 'plain'] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const LEARNING_PAGE_SIZE = 20;

/** The Supabase Storage bucket + folder Learning images live in (reuses the
 *  existing admin-media bucket — same as prep-notes thumbnails). */
export const LEARNING_BUCKET = 'admin-media';
export const LEARNING_PATH_PREFIX = 'learning';
/** Private bucket for premium / downloadable files (migration 0045/022). */
export const LEARNING_FILES_BUCKET = 'learning-files';

/** Grid types (migration 0044/021 CHECK, tightened to these two by 036/0064).
 *  Every grid is an ordinary Grid → (Section) → Topic → Content tree; `custom`
 *  is a cosmetic label variant of `content`. */
export const GRID_TYPES = ['content', 'custom'] as const;
export type GridType = (typeof GRID_TYPES)[number];

export const GRID_TYPE_LABEL: Record<GridType, string> = {
  content: 'Notes / Content',
  custom: 'Custom',
};

/** Content-block "kind" — stored in `learning_contents.metadata.content_type`
 *  so no schema change is needed (migration model: normal content is markdown). */
export const CONTENT_TYPES = [
  'article',
  'video',
  'pdf',
  'external',
  'question',
  'interview_question',
  'example',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  article: 'Article / Notes',
  video: 'Video',
  pdf: 'PDF / File',
  external: 'External resource',
  question: 'Question',
  interview_question: 'Interview question',
  example: 'Worked example',
};

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Languages a topic Coding Problem can be attempted in on the website compiler.
 *  Mirrors `website/src/lib/compiler/languages.ts` canonical ids. */
export const CODING_LANGUAGES = ['java', 'python', 'c', 'cpp', 'javascript'] as const;
export type CodingLanguage = (typeof CODING_LANGUAGES)[number];
export const CODING_LANGUAGE_LABEL: Record<CodingLanguage, string> = {
  java: 'Java',
  python: 'Python',
  c: 'C',
  cpp: 'C++',
  javascript: 'JavaScript',
};

/** Test / MCQ categories on `practice_tests` (mirrors the CHECK from 0016). */
export const MOCK_TEST_CATEGORIES = ['aptitude', 'logical', 'verbal', 'hr', 'company'] as const;

/** URL-safe slug: lower-case, alphanumerics separated by single hyphens.
 *  Matches the `slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'` CHECK in the migration. */
export function slugify(input: string): string {
  return String(input || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export const STATUS_LABEL: Record<LearningStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

/** Turn a comma / newline separated string into a clean tag array. */
export function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      String(raw || '')
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ).slice(0, 30);
}

/** Human summary of a row's academic targeting, for list badges. */
export function targetingSummary(t: {
  target_type?: string | null;
  target_course_name?: string | null;
  target_branch_names?: string[] | null;
  target_year_label?: string | null;
}): string {
  const type = t.target_type ?? 'global';
  let base = 'Global';
  if (type === 'course') base = t.target_course_name || 'Course';
  else if (type === 'branch') {
    const n = t.target_branch_names?.length ?? 0;
    base = n ? `${t.target_course_name ? t.target_course_name + ' · ' : ''}${n} branch${n === 1 ? '' : 'es'}` : 'Branch';
  }
  return t.target_year_label ? `${base} · ${t.target_year_label}` : base;
}

/** Pure types + helpers for Learning — no React/server imports, so
 *  it's safe to unit-test and to import from client components. */

/** Grid types (migration 0044/021). `content` / `custom` (and anything the
 *  website doesn't recognise) are ordinary Grid → Topic → Content trees; the
 *  other four bind to the canonical practice tables. */
export type LearningGridType =
  | "content"
  | "aptitude"
  | "dsa"
  | "mock_test"
  | "hr"
  | "company"
  | "custom";

export const GRID_TYPE_LABEL: Record<string, string> = {
  content: "Notes",
  aptitude: "Aptitude",
  dsa: "DSA / Coding",
  mock_test: "Mock Test",
  hr: "HR Interview",
  company: "Company Specific",
  custom: "Resource",
};

/** True when a grid renders as the generic Grid → Topic → Content tree (i.e.
 *  NOT one of the specialised practice catalogs). Unknown / future types fall
 *  through to the tree so a new admin grid type still opens without a deploy. */
export function isContentGrid(gridType: string | null | undefined): boolean {
  return !["aptitude", "dsa", "mock_test", "hr", "company"].includes(String(gridType));
}

export interface LearningGridCard {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  icon_url: string | null;
  cover_image_url: string | null;
  accent_color: string | null;
  is_featured: boolean;
  sort_order: number;
  section_count: number;
  topic_count: number;
  /** From `learning_grids_list()` (migration 0045/022). */
  grid_type: string;
  is_premium: boolean;
}

/** Lightweight grid header (no tree) for typed grid pages + generateMetadata. */
export interface LearningGridBrief {
  id: string;
  name: string;
  slug: string;
  description: string;
  grid_type: string;
  is_premium: boolean;
  icon: string | null;
  cover_image_url: string | null;
  accent_color: string | null;
}

export interface LearningTreeTopic {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  is_premium: boolean;
}
export interface LearningTreeSection {
  id: string;
  name: string;
  slug: string;
  description: string;
  topics: LearningTreeTopic[];
}
export interface LearningTree {
  grid: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
    icon_url: string | null;
    cover_image_url: string | null;
    accent_color: string | null;
  };
  sections: LearningTreeSection[];
}

export interface LearningContentBlock {
  id: string;
  heading: string;
  body: string;
  content_format: "markdown" | "plain";
  file_url: string | null;
  video_url: string | null;
  metadata: Record<string, unknown>;
}
export interface LearningTopicPage {
  topic: {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    is_premium: boolean;
    updated_at: string;
  };
  section: { name: string; slug: string };
  grid: { name: string; slug: string };
  locked: boolean;
  contents: LearningContentBlock[];
  prev: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
}

export interface LearningSearchHit {
  kind: "grid" | "topic";
  grid_slug: string;
  grid_name: string;
  section_name: string | null;
  topic_slug: string | null;
  title: string;
  snippet: string | null;
  is_premium: boolean;
}

/** First readable topic of a grid, for "start reading" / grid-root redirect. */
export function firstTopicOf(tree: LearningTree): { sectionSlug: string; topic: LearningTreeTopic } | null {
  for (const section of tree.sections) {
    if (section.topics.length) return { sectionSlug: section.slug, topic: section.topics[0] };
  }
  return null;
}

/** Flat reading order across the whole grid (matches the RPC's prev/next). */
export function flattenTopics(tree: LearningTree): { section: LearningTreeSection; topic: LearningTreeTopic }[] {
  return tree.sections.flatMap((section) => section.topics.map((topic) => ({ section, topic })));
}

/** Pure types + helpers for Learning — no React/server imports, so
 *  it's safe to unit-test and to import from client components. */

/** Grid types (migration 0044/021, tightened by 036/0064). Every grid is an
 *  ordinary Grid → Section → Topic → Content tree — `custom` is a cosmetic
 *  variant of `content`. Any unrecognised value renders as the tree too. */
export type LearningGridType = "content" | "custom";

export const GRID_TYPE_LABEL: Record<string, string> = {
  content: "Notes",
  custom: "Resource",
};

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

// ---------------------------------------------------------------------------
// Topic-specific practice — Mock Tests + Coding Problems attached to one topic
// (migration 0048/025 RPCs: learning_topic_practice / coding_problem_detail /
//  mock_test_detail). Both platforms consume the same rows.
// ---------------------------------------------------------------------------
export interface TopicMockTestCard {
  id: string;
  title: string;
  description: string;
  category: string;
  question_count: number;
  duration_minutes: number;
  difficulty: string;
  total_marks: number;
  negative_marking: number;
  is_premium: boolean;
}

export interface TopicCodingProblemCard {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  supported_languages: string[];
  is_premium: boolean;
}

export interface TopicPractice {
  mock_tests: TopicMockTestCard[];
  coding_problems: TopicCodingProblemCard[];
}

export interface CodingProblemDetail {
  problem: {
    id: string;
    slug: string;
    title: string;
    difficulty: string;
    is_premium: boolean;
    supported_languages: string[];
    description: string | null;
    examples: { input?: string; output?: string; explanation?: string }[];
    constraints: string[];
    hints: string[];
    starter_code: Record<string, string>;
    time_complexity: string;
    space_complexity: string;
  };
  topic: { grid_slug: string; topic_slug: string; title: string };
  locked: boolean;
  editorial: string;
  /** Empty `{}` until the caller has submitted an attempt (or is admin) — see `solution_locked`. */
  solution_code: Record<string, string>;
  /** true = a solution exists but is withheld until the user submits an attempt. */
  solution_locked?: boolean;
  solution_approach: string;
}

// ---------------------------------------------------------------------------
// Internal linking — related problems + prev/next problem nav (migration
// 0102/074 RPCs: coding_problem_related / practice_problem_related). Shared
// shape for both the Learning topic-practice and global Practice systems.
// ---------------------------------------------------------------------------
export interface RelatedProblemCard {
  slug: string;
  title: string;
  difficulty: string;
  is_premium: boolean;
  supported_languages: string[];
}

export interface AdjacentProblem {
  slug: string;
  title: string;
}

export interface CodingProblemRelated {
  related: RelatedProblemCard[];
  prev: AdjacentProblem | null;
  next: AdjacentProblem | null;
}

export interface MockTestDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  difficulty: string;
  negative_marking: number;
  instructions: string;
  question_count: number;
  total_marks: number;
  attempts_allowed: number | null;
  is_premium: boolean;
  /** 'chapter' / 'course' tests draw a random sample from a live pool instead
   *  of owning their own test_questions — see practice_test_questions() /
   *  submit_randomized_test_attempt() (0091/063). Older rows / RPC responses
   *  without this field behave as 'topic'. */
  scope?: "topic" | "chapter" | "course";
  topic: { grid_slug: string; topic_slug: string; title: string } | null;
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

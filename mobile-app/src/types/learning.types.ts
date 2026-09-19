/** Learning types — mirror the `learning_*` RPC shapes from
 *  mobile migration 0042 / admin migration 019. All reads are pinned to the
 *  `'mobile'` platform, so every row here is already published + show_on_mobile
 *  with its whole parent chain likewise visible. */

/** Grid types (migration 0044/021, tightened by 036/0064). Every grid is an
 *  ordinary Grid → Section → Topic → Content tree — `custom` is a cosmetic
 *  variant of `content`, and any unknown value renders as the tree too. */
export type LearningGridType = 'content' | 'custom';

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
  grid_type: LearningGridType | string;
  is_premium: boolean;
}

export interface LearningTopicRef {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  is_premium: boolean;
}

export interface LearningSectionNode {
  id: string;
  name: string;
  slug: string;
  description: string;
  topics: LearningTopicRef[];
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
  sections: LearningSectionNode[];
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
// Topic-specific practice (migration 0048/025 RPCs). Mock Tests are taken
// natively in the app (reuse the existing TestInstruction → LiveTest →
// TestResult flow). Coding Problems are shown read-only + "Solve on Website".
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
  /** `{}` until the caller has submitted an attempt (or is admin); see `solution_locked`. */
  solution_code: Record<string, string>;
  /** true = a solution exists but is withheld until the user submits an attempt (migration 0120/092). */
  solution_locked?: boolean;
  solution_approach: string;
}

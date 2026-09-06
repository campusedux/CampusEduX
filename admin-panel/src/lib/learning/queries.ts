import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';
import type { LearningStatus, ContentFormat, GridType } from '@/lib/learning/constants';
import { LEARNING_PAGE_SIZE } from '@/lib/learning/constants';

export { LEARNING_PAGE_SIZE } from '@/lib/learning/constants';

// ---------------------------------------------------------------------------
// Types — kept in sync with admin migration 019/021 · mobile 0042/0044.
// ---------------------------------------------------------------------------
export interface Targeting {
  target_type: string;
  target_course_id: string | null;
  target_course_name: string | null;
  target_branch_ids: string[] | null;
  target_branch_names: string[] | null;
  target_year_id: string | null;
  target_year_label: string | null;
}

export interface LearningGrid extends Targeting {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  icon_url: string | null;
  cover_image_url: string | null;
  accent_color: string | null;
  grid_type: GridType;
  sort_order: number;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  is_featured: boolean;
  is_premium: boolean;
  source_kind: string | null;
  source_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningSection {
  id: string;
  grid_id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningTopic extends Targeting {
  id: string;
  section_id: string | null;
  grid_id: string;
  title: string;
  slug: string;
  short_description: string;
  icon: string | null;
  icon_url: string | null;
  company_id: string | null;
  sort_order: number;
  is_premium: boolean;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  source_prep_note_id: string | null;
  source_kind: string | null;
  source_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningContent extends Targeting {
  id: string;
  topic_id: string;
  title: string;
  slug: string | null;
  short_description: string;
  heading: string;
  body: string;
  content_format: ContentFormat;
  difficulty: string | null;
  estimated_minutes: number | null;
  tags: string[] | null;
  file_url: string | null;
  file_bucket: string;
  file_path: string | null;
  external_url: string | null;
  video_url: string | null;
  is_premium: boolean;
  metadata: Record<string, unknown>;
  sort_order: number;
  status: LearningStatus;
  created_at: string;
  updated_at: string;
}

const GRID_COLS =
  'id,name,slug,description,icon,icon_url,cover_image_url,accent_color,grid_type,sort_order,status,' +
  'show_on_website,show_on_mobile,is_featured,is_premium,source_kind,source_ref,' +
  'target_type,target_course_id,target_course_name,target_branch_ids,target_branch_names,target_year_id,target_year_label,' +
  'created_at,updated_at';

// ---------------------------------------------------------------------------
// Dashboard (spec §4)
// ---------------------------------------------------------------------------
export async function getLearningDashboard() {
  const supabase = createClient();
  const [
    grids,
    publishedGrids,
    archivedGrids,
    sections,
    topics,
    premiumTopics,
    contents,
    publishedContents,
    draftContents,
  ] = await Promise.all([
    safeCount(supabase.from('learning_grids').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('learning_grids').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    safeCount(supabase.from('learning_grids').select('id', { count: 'exact', head: true }).eq('status', 'archived')),
    safeCount(supabase.from('learning_sections').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('learning_topics').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('learning_topics').select('id', { count: 'exact', head: true }).eq('is_premium', true)),
    safeCount(supabase.from('learning_contents').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('learning_contents').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    safeCount(supabase.from('learning_contents').select('id', { count: 'exact', head: true }).eq('status', 'draft')),
  ]);

  const { data: recent } = await supabase
    .from('learning_contents')
    .select('id,title,heading,topic_id,status,updated_at')
    .order('updated_at', { ascending: false })
    .limit(8);

  return {
    grids,
    publishedGrids,
    draftGrids: Math.max(0, grids - publishedGrids - archivedGrids),
    archivedGrids,
    sections,
    topics,
    premiumTopics,
    contents,
    publishedContents,
    draftContents,
    recentlyUpdated: (recent ?? []) as {
      id: string;
      title: string;
      heading: string;
      topic_id: string;
      status: LearningStatus;
      updated_at: string;
    }[],
  };
}

// ---------------------------------------------------------------------------
// Grids
// ---------------------------------------------------------------------------
export async function listLearningGrids(opts: {
  page: number;
  q?: string;
  status?: string;
  type?: string;
  premium?: string;
  course?: string;
}) {
  const supabase = createClient();
  const from = (opts.page - 1) * LEARNING_PAGE_SIZE;
  let query = supabase
    .from('learning_grids')
    .select(GRID_COLS, { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .range(from, from + LEARNING_PAGE_SIZE - 1);
  if (opts.q) query = query.ilike('name', `%${opts.q}%`);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.type) query = query.eq('grid_type', opts.type);
  if (opts.premium === 'yes') query = query.eq('is_premium', true);
  if (opts.premium === 'no') query = query.eq('is_premium', false);
  if (opts.course) query = query.eq('target_course_id', opts.course);
  const { data, count, error } = await query;
  const rows = error ? [] : ((data ?? []) as unknown as LearningGrid[]);

  const ids = rows.map((r) => r.id);
  let sectionCounts = new Map<string, number>();
  let topicCounts = new Map<string, number>();
  let contentCounts = new Map<string, number>();
  if (ids.length) {
    const [{ data: secs }, { data: tops }, { data: cons }] = await Promise.all([
      supabase.from('learning_sections').select('grid_id').in('grid_id', ids),
      supabase.from('learning_topics').select('id,grid_id').in('grid_id', ids),
      supabase.from('learning_topics').select('id,grid_id').in('grid_id', ids),
    ]);
    sectionCounts = tally((secs ?? []).map((r: { grid_id: string }) => r.grid_id));
    topicCounts = tally((tops ?? []).map((r: { grid_id: string }) => r.grid_id));
    // content count = blocks under the grid's topics
    const topicIds = (cons ?? []).map((r: { id: string }) => r.id);
    if (topicIds.length) {
      const { data: blocks } = await supabase
        .from('learning_contents')
        .select('topic_id')
        .in('topic_id', topicIds);
      const byTopic = tally((blocks ?? []).map((b: { topic_id: string }) => b.topic_id));
      const topicToGrid = new Map((cons ?? []).map((r: { id: string; grid_id: string }) => [r.id, r.grid_id]));
      for (const [tid, n] of byTopic) {
        const gid = topicToGrid.get(tid);
        if (gid) contentCounts.set(gid, (contentCounts.get(gid) ?? 0) + n);
      }
    }
  }

  return {
    rows: rows.map((r) => ({
      ...r,
      section_count: sectionCounts.get(r.id) ?? 0,
      topic_count: topicCounts.get(r.id) ?? 0,
      content_count: contentCounts.get(r.id) ?? 0,
    })),
    total: error ? 0 : count ?? 0,
    missing: Boolean(error),
  };
}

export async function getLearningGrid(id: string): Promise<LearningGrid | null> {
  const supabase = createClient();
  const { data } = await supabase.from('learning_grids').select(GRID_COLS).eq('id', id).maybeSingle();
  return (data as unknown as LearningGrid) ?? null;
}

export async function getGridSections(gridId: string): Promise<LearningSection[]> {
  const supabase = createClient();
  return safe(
    supabase
      .from('learning_sections')
      .select('*')
      .eq('grid_id', gridId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    [] as LearningSection[],
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
export async function getLearningSection(id: string): Promise<LearningSection | null> {
  const supabase = createClient();
  const { data } = await supabase.from('learning_sections').select('*').eq('id', id).maybeSingle();
  return (data as LearningSection) ?? null;
}

export async function getSectionTopics(sectionId: string): Promise<LearningTopic[]> {
  const supabase = createClient();
  return safe(
    supabase
      .from('learning_topics')
      .select('*')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    [] as LearningTopic[],
  );
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------
export async function getLearningTopic(id: string): Promise<LearningTopic | null> {
  const supabase = createClient();
  const { data } = await supabase.from('learning_topics').select('*').eq('id', id).maybeSingle();
  return (data as LearningTopic) ?? null;
}

export async function getTopicContents(topicId: string): Promise<LearningContent[]> {
  const supabase = createClient();
  return safe(
    supabase
      .from('learning_contents')
      .select('*')
      .eq('topic_id', topicId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    [] as LearningContent[],
  );
}

// ---------------------------------------------------------------------------
// Topic-specific practice — Mock Tests (practice_tests) + Coding Problems
// (dsa_problems with topic_id NULL), both linked by learning_topic_id
// (migration 0048/025). Rendered by PracticeManager on the topic page.
// ---------------------------------------------------------------------------
export interface TopicMockTest {
  id: string;
  title: string;
  description: string;
  category: string;
  question_count: number;
  duration_minutes: number;
  difficulty: string;
  negative_marking: number;
  instructions: string;
  is_premium: boolean;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  created_at: string;
}

export interface TopicCodingProblem {
  id: string;
  title: string;
  slug: string | null;
  difficulty: string;
  description: string;
  examples: unknown;
  constraints: unknown;
  starter_code: unknown;
  solution_code: unknown;
  test_cases: unknown;
  hints: unknown;
  editorial: string;
  solution_approach: string;
  supported_languages: string[];
  is_premium: boolean;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  sort_order: number;
}

export async function getTopicMockTests(topicId: string): Promise<TopicMockTest[]> {
  const supabase = createClient();
  return safe(
    supabase
      .from('practice_tests')
      .select(
        'id,title,description,category,question_count,duration_minutes,difficulty,negative_marking,instructions,is_premium,status,show_on_website,show_on_mobile,created_at',
      )
      .eq('learning_topic_id', topicId)
      .order('created_at', { ascending: true }),
    [] as TopicMockTest[],
  );
}

export async function getTopicCodingProblems(topicId: string): Promise<TopicCodingProblem[]> {
  const supabase = createClient();
  return safe(
    supabase
      .from('dsa_problems')
      .select(
        'id,title,slug,difficulty,description,examples,constraints,starter_code,solution_code,test_cases,hints,editorial,solution_approach,supported_languages,is_premium,status,show_on_website,show_on_mobile,sort_order',
      )
      .eq('learning_topic_id', topicId)
      .is('topic_id', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    [] as TopicCodingProblem[],
  );
}

/** Published topics of a grid, for the "attach content to a topic" picker on
 *  the specialised (DSA / Mock / HR) editors. */
export async function getGridTopicOptions(gridId: string): Promise<{ id: string; title: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('learning_topics')
    .select('id, title')
    .eq('grid_id', gridId)
    .order('sort_order', { ascending: true });
  return (data ?? []) as { id: string; title: string }[];
}

function tally(ids: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

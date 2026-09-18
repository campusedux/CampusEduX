import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';
import type { LearningStatus, ContentFormat, GridType, Difficulty } from '@/lib/learning/constants';
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

// ---------------------------------------------------------------------------
// Global Practice → Coding Problems (migration 0072/044). Categories are
// `dsa_topics` rows with `kind='practice'`; problems are `dsa_problems` rows
// with `learning_topic_id IS NULL` and `topic_id` -> such a category. Separate
// from Learning, managed under the same `learning` permission module.
// ---------------------------------------------------------------------------
export interface PracticeCategoryRow {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  sort_order: number;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  problem_count: number;
}

export interface PracticeProblemRow extends TopicCodingProblem {
  /** The category id (`dsa_topics.id`, `kind='practice'`). */
  topic_id: string;
  category_name?: string;
  category_slug?: string | null;
}

const PRACTICE_PROBLEM_COLS =
  'id,topic_id,title,slug,difficulty,description,examples,constraints,starter_code,solution_code,test_cases,hints,editorial,solution_approach,supported_languages,is_premium,status,show_on_website,show_on_mobile,sort_order';

export async function listPracticeCategories(): Promise<PracticeCategoryRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('dsa_topics')
    .select('id,name,slug,description,sort_order,status,show_on_website,show_on_mobile')
    .eq('kind', 'practice')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  const rows = (data ?? []) as Omit<PracticeCategoryRow, 'problem_count'>[];
  const ids = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: probs } = await supabase
      .from('dsa_problems')
      .select('topic_id')
      .is('learning_topic_id', null)
      .in('topic_id', ids);
    for (const p of (probs ?? []) as { topic_id: string }[]) {
      counts.set(p.topic_id, (counts.get(p.topic_id) ?? 0) + 1);
    }
  }
  return rows.map((r) => ({ ...r, problem_count: counts.get(r.id) ?? 0 }));
}

export async function listPracticeProblems(opts: {
  page: number;
  q?: string;
  difficulty?: string;
  category?: string;
  status?: string;
}): Promise<{ rows: PracticeProblemRow[]; total: number; categories: PracticeCategoryRow[] }> {
  const supabase = createClient();
  const categories = await listPracticeCategories();
  const catIds = categories.map((c) => c.id);
  const catById = new Map(categories.map((c) => [c.id, c]));
  if (catIds.length === 0) return { rows: [], total: 0, categories };

  const from = (opts.page - 1) * LEARNING_PAGE_SIZE;
  let query = supabase
    .from('dsa_problems')
    .select(PRACTICE_PROBLEM_COLS, { count: 'exact' })
    .is('learning_topic_id', null)
    .in('topic_id', opts.category && catIds.includes(opts.category) ? [opts.category] : catIds)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(from, from + LEARNING_PAGE_SIZE - 1);
  if (opts.q) query = query.ilike('title', `%${opts.q}%`);
  if (opts.difficulty) query = query.eq('difficulty', opts.difficulty);
  if (opts.status) query = query.eq('status', opts.status);

  const { data, count, error } = await query;
  const rows = ((error ? [] : (data ?? [])) as unknown as PracticeProblemRow[]).map((r) => ({
    ...r,
    category_name: catById.get(r.topic_id)?.name,
    category_slug: catById.get(r.topic_id)?.slug ?? null,
  }));
  return { rows, total: error ? 0 : count ?? 0, categories };
}

export async function getPracticeProblem(id: string): Promise<PracticeProblemRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('dsa_problems')
    .select(PRACTICE_PROBLEM_COLS)
    .eq('id', id)
    .is('learning_topic_id', null)
    .maybeSingle();
  return (data ?? null) as unknown as PracticeProblemRow | null;
}

// ---------------------------------------------------------------------------
// PRACTICE ▸ INTERVIEW QUESTIONS  (admin migration 075 · mobile 0103)
// 3-level catalog, separate from both Learning and Practice ▸ Coding Problems:
// `interview_categories` (one row per language, e.g. "Java") ->
// `interview_topics` (e.g. "OOP") -> `interview_questions`. Managed under the
// same `learning` permission module.
// ---------------------------------------------------------------------------
export interface InterviewCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  topic_count: number;
}

export interface InterviewTopicRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  category_name?: string;
  category_slug?: string;
  question_count: number;
}

export interface InterviewQuestionRow {
  id: string;
  topic_id: string;
  question: string;
  answer: string;
  example: string;
  important_point: string;
  difficulty: Difficulty;
  sort_order: number;
  status: LearningStatus;
  show_on_website: boolean;
  show_on_mobile: boolean;
  topic_name?: string;
  topic_slug?: string;
  category_name?: string;
  category_slug?: string;
}

export async function listInterviewCategories(): Promise<InterviewCategoryRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('interview_categories')
    .select('id,name,slug,description,icon,sort_order,status,show_on_website,show_on_mobile')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  const rows = (data ?? []) as Omit<InterviewCategoryRow, 'topic_count'>[];
  const ids = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: topics } = await supabase.from('interview_topics').select('category_id').in('category_id', ids);
    for (const t of (topics ?? []) as { category_id: string }[]) {
      counts.set(t.category_id, (counts.get(t.category_id) ?? 0) + 1);
    }
  }
  return rows.map((r) => ({ ...r, topic_count: counts.get(r.id) ?? 0 }));
}

export async function listInterviewTopics(categoryId?: string): Promise<InterviewTopicRow[]> {
  const supabase = createClient();
  const categories = await listInterviewCategories();
  const catById = new Map(categories.map((c) => [c.id, c]));
  let query = supabase
    .from('interview_topics')
    .select('id,category_id,name,slug,description,sort_order,status,show_on_website,show_on_mobile')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data } = await query;
  const rows = (data ?? []) as Omit<InterviewTopicRow, 'question_count' | 'category_name'>[];
  const ids = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: questions } = await supabase.from('interview_questions').select('topic_id').in('topic_id', ids);
    for (const q of (questions ?? []) as { topic_id: string }[]) {
      counts.set(q.topic_id, (counts.get(q.topic_id) ?? 0) + 1);
    }
  }
  return rows.map((r) => ({
    ...r,
    category_name: catById.get(r.category_id)?.name,
    category_slug: catById.get(r.category_id)?.slug,
    question_count: counts.get(r.id) ?? 0,
  }));
}

const INTERVIEW_QUESTION_COLS =
  'id,topic_id,question,answer,example,important_point,difficulty,sort_order,status,show_on_website,show_on_mobile';

export async function listInterviewQuestions(opts: {
  page: number;
  q?: string;
  topic?: string;
  category?: string;
  difficulty?: string;
  status?: string;
}): Promise<{ rows: InterviewQuestionRow[]; total: number; categories: InterviewCategoryRow[]; topics: InterviewTopicRow[] }> {
  const supabase = createClient();
  const [categories, topics] = await Promise.all([listInterviewCategories(), listInterviewTopics()]);
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const topicIdsInCategory = opts.category ? topics.filter((t) => t.category_id === opts.category).map((t) => t.id) : null;
  if (topics.length === 0) return { rows: [], total: 0, categories, topics };

  const from = (opts.page - 1) * LEARNING_PAGE_SIZE;
  let query = supabase
    .from('interview_questions')
    .select(INTERVIEW_QUESTION_COLS, { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(from, from + LEARNING_PAGE_SIZE - 1);
  if (opts.topic) query = query.eq('topic_id', opts.topic);
  else if (topicIdsInCategory) query = query.in('topic_id', topicIdsInCategory.length ? topicIdsInCategory : ['__none__']);
  if (opts.q) query = query.ilike('question', `%${opts.q}%`);
  if (opts.difficulty) query = query.eq('difficulty', opts.difficulty);
  if (opts.status) query = query.eq('status', opts.status);

  const { data, count, error } = await query;
  const rows = ((error ? [] : (data ?? [])) as unknown as InterviewQuestionRow[]).map((r) => ({
    ...r,
    topic_name: topicById.get(r.topic_id)?.name,
    topic_slug: topicById.get(r.topic_id)?.slug,
    category_name: topicById.get(r.topic_id)?.category_name,
    category_slug: topicById.get(r.topic_id)?.category_slug,
  }));
  return { rows, total: error ? 0 : count ?? 0, categories, topics };
}

export async function getInterviewQuestion(id: string): Promise<InterviewQuestionRow | null> {
  const supabase = createClient();
  const { data } = await supabase.from('interview_questions').select(INTERVIEW_QUESTION_COLS).eq('id', id).maybeSingle();
  return (data ?? null) as unknown as InterviewQuestionRow | null;
}

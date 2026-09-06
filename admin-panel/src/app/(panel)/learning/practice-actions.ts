'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { slugify, isValidSlug, CODING_LANGUAGES, MOCK_TEST_CATEGORIES } from '@/lib/learning/constants';

/**
 * Topic-specific practice CRUD — Mock Tests (`practice_tests`) and Coding
 * Problems (`dsa_problems` with `topic_id` NULL), both linked to a Learning
 * topic via `learning_topic_id` (migration 0048/025). Runs under the `learning`
 * permission module; RLS `*_admin_all` (is_admin) is the backstop.
 *
 * Mock-test *questions* are managed on the existing `/placement/tests/[id]`
 * page — its question CRUD already works for any `practice_tests` row.
 */
const MODULE = 'learning' as const;

type Result = { ok: boolean; error?: string };

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(s(fd, k) || 0);
const num = (fd: FormData, k: string, dflt: number) => {
  const v = Number(s(fd, k));
  return Number.isFinite(v) ? v : dflt;
};
const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';
const lines = (fd: FormData, k: string) =>
  s(fd, k)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function status(fd: FormData): 'draft' | 'published' | 'archived' {
  const v = s(fd, 'status');
  return v === 'published' || v === 'archived' ? v : 'draft';
}

function parseJson(raw: string, fallback: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: true, value: fallback };
  try {
    return { ok: true, value: JSON.parse(t) };
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
}

function pgError(message: string): string {
  if (/dsa_problems_cp_slug_key|duplicate key/i.test(message))
    return 'That slug is already used by another coding problem — pick another.';
  if (/dsa_problems_home_chk/i.test(message)) return 'A coding problem must be attached to a topic.';
  if (/targeting:/i.test(message)) return message.replace(/^.*?targeting:/i, 'Targeting:').trim();
  return message;
}

async function actorId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function nextSort(table: string, topicId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from(table)
    .select('sort_order')
    .eq('learning_topic_id', topicId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number | undefined) ?? -1) + 1;
}

// ===========================================================================
// MOCK TESTS  (practice_tests · question CRUD lives on /placement/tests/[id])
// ===========================================================================
function mockTestPayload(fd: FormData) {
  const category = s(fd, 'category');
  return {
    title: s(fd, 'title'),
    description: s(fd, 'description'),
    category: (MOCK_TEST_CATEGORIES as readonly string[]).includes(category) ? category : 'aptitude',
    duration_minutes: Math.max(0, num(fd, 'duration_minutes', 10)),
    difficulty: ['Easy', 'Medium', 'Hard'].includes(s(fd, 'difficulty')) ? s(fd, 'difficulty') : 'Medium',
    negative_marking: Math.max(0, num(fd, 'negative_marking', 0)),
    instructions: s(fd, 'instructions'),
    is_premium: bool(fd, 'is_premium'),
    status: status(fd),
    show_on_website: bool(fd, 'show_on_website'),
    show_on_mobile: bool(fd, 'show_on_mobile'),
  };
}

export async function createTopicMockTest(
  topicId: string,
  gridId: string,
  path: string,
  _p: Result,
  fd: FormData,
): Promise<Result> {
  await requirePermission(MODULE, 'add');
  const supabase = createClient();
  const payload = mockTestPayload(fd);
  if (!payload.title) return { ok: false, error: 'Test title is required.' };
  const uid = await actorId();
  const { error } = await supabase.from('practice_tests').insert({
    id: rid('mt'),
    ...payload,
    question_count: 0,
    learning_topic_id: topicId,
    learning_grid_id: gridId,
  });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.mocktest.create', module: MODULE, resourceType: 'practice_tests' });
  void uid;
  revalidatePath(path);
  return { ok: true };
}

export async function updateTopicMockTest(id: string, path: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const payload = mockTestPayload(fd);
  if (!payload.title) return { ok: false, error: 'Test title is required.' };
  const { error } = await supabase.from('practice_tests').update(payload).eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.mocktest.update', module: MODULE, resourceType: 'practice_tests', resourceId: id });
  revalidatePath(path);
  return { ok: true };
}

export async function deleteTopicMockTest(id: string, path: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('practice_tests').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.mocktest.delete', module: MODULE, resourceType: 'practice_tests', resourceId: id });
  revalidatePath(path);
  return { ok: true };
}

export async function setTopicMockTestField(
  id: string,
  path: string,
  field: 'status' | 'is_premium' | 'show_on_website' | 'show_on_mobile',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('practice_tests').update({ [field]: value }).eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.mocktest.${field}`, module: MODULE, resourceType: 'practice_tests', resourceId: id });
  revalidatePath(path);
  return { ok: true };
}

// ===========================================================================
// CODING PROBLEMS  (dsa_problems, topic_id NULL, learning_topic_id set)
// ===========================================================================
function codingPayload(fd: FormData):
  | { ok: true; value: Record<string, unknown>; slug: string }
  | { ok: false; error: string } {
  const title = s(fd, 'title');
  if (!title) return { ok: false, error: 'Problem title is required.' };
  const slug = slugify(s(fd, 'slug') || title);
  if (!slug || !isValidSlug(slug)) {
    return { ok: false, error: 'Could not derive a valid URL slug — set one explicitly (a-z, 0-9, hyphens).' };
  }
  const examples = parseJson(s(fd, 'examples'), []);
  const starter = parseJson(s(fd, 'starter_code'), {});
  const solution = parseJson(s(fd, 'solution_code'), {});
  const testCases = parseJson(s(fd, 'test_cases'), []);
  if (!examples.ok) return { ok: false, error: `Examples — ${examples.error}` };
  if (!starter.ok) return { ok: false, error: `Starter code — ${starter.error}` };
  if (!solution.ok) return { ok: false, error: `Solution code — ${solution.error}` };
  if (!testCases.ok) return { ok: false, error: `Test cases — ${testCases.error}` };

  const langs = fd.getAll('supported_languages').map(String).filter((l) => (CODING_LANGUAGES as readonly string[]).includes(l));

  return {
    ok: true,
    slug,
    value: {
      title,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(s(fd, 'difficulty')) ? s(fd, 'difficulty') : 'Easy',
      description: s(fd, 'description'),
      examples: examples.value,
      constraints: lines(fd, 'constraints'),
      starter_code: starter.value,
      solution_code: solution.value,
      test_cases: testCases.value,
      hints: lines(fd, 'hints'),
      editorial: s(fd, 'editorial'),
      solution_approach: s(fd, 'solution_approach'),
      supported_languages: langs.length ? langs : ['java', 'python', 'c', 'cpp'],
      is_premium: bool(fd, 'is_premium'),
      status: status(fd),
      show_on_website: bool(fd, 'show_on_website'),
      show_on_mobile: bool(fd, 'show_on_mobile'),
    },
  };
}

/** Reject a slug already owned by another topic coding problem (the website
 *  route /coding-problems/<slug> resolves on the global slug). */
async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = createClient();
  let q = supabase.from('dsa_problems').select('id').is('topic_id', null).ilike('slug', slug).limit(1);
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}

export async function createTopicCodingProblem(
  topicId: string,
  gridId: string,
  path: string,
  _p: Result,
  fd: FormData,
): Promise<Result> {
  await requirePermission(MODULE, 'add');
  const parsed = codingPayload(fd);
  if (!parsed.ok) return parsed;
  if (await slugTaken(parsed.slug)) {
    return { ok: false, error: 'That slug is already used by another coding problem — pick another.' };
  }
  const supabase = createClient();
  const { error } = await supabase.from('dsa_problems').insert({
    id: rid('dsa'),
    topic_id: null,
    learning_topic_id: topicId,
    learning_grid_id: gridId,
    slug: parsed.slug,
    sort_order: await nextSort('dsa_problems', topicId),
    ...parsed.value,
  });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.coding.create', module: MODULE, resourceType: 'dsa_problems' });
  revalidatePath(path);
  return { ok: true };
}

export async function updateTopicCodingProblem(id: string, path: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const parsed = codingPayload(fd);
  if (!parsed.ok) return parsed;
  if (await slugTaken(parsed.slug, id)) {
    return { ok: false, error: 'That slug is already used by another coding problem — pick another.' };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('dsa_problems')
    .update({ slug: parsed.slug, ...parsed.value })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.coding.update', module: MODULE, resourceType: 'dsa_problems', resourceId: id });
  revalidatePath(path);
  return { ok: true };
}

export async function deleteTopicCodingProblem(id: string, path: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('dsa_problems').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.coding.delete', module: MODULE, resourceType: 'dsa_problems', resourceId: id });
  revalidatePath(path);
  return { ok: true };
}

export async function setTopicCodingProblemField(
  id: string,
  path: string,
  field: 'status' | 'is_premium' | 'show_on_website' | 'show_on_mobile',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('dsa_problems').update({ [field]: value }).eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.coding.${field}`, module: MODULE, resourceType: 'dsa_problems', resourceId: id });
  revalidatePath(path);
  return { ok: true };
}

export async function reorderTopicCodingProblem(id: string, topicId: string, path: string, dir: 'up' | 'down'): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { data: rows } = await supabase
    .from('dsa_problems')
    .select('id,sort_order')
    .eq('learning_topic_id', topicId)
    .is('topic_id', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  const list = (rows ?? []) as { id: string; sort_order: number }[];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return { ok: false, error: 'Problem not found.' };
  const swap = dir === 'up' ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return { ok: true };
  const a = list[idx];
  const b = list[swap];
  const { error: e1 } = await supabase.from('dsa_problems').update({ sort_order: b.sort_order }).eq('id', a.id);
  const { error: e2 } = await supabase.from('dsa_problems').update({ sort_order: a.sort_order }).eq('id', b.id);
  if (e1 || e2) return { ok: false, error: (e1 ?? e2)!.message };
  revalidatePath(path);
  return { ok: true };
}

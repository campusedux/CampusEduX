'use server';

import { revalidatePath } from 'next/cache';
import type { SiteSync } from '@/lib/learning/siteRevalidate';
import { syncPractice } from '@/lib/learning/siteSync';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { slugify, isValidSlug, CODING_LANGUAGES } from '@/lib/learning/constants';

/**
 * Global "Practice → Coding Problems" CRUD (migration 0072/044). Categories are
 * `dsa_topics` rows with `kind='practice'`; problems are `dsa_problems` rows with
 * `learning_topic_id IS NULL` and `topic_id` -> such a category. Runs under the
 * `learning` permission module (same as the topic-practice editors); RLS
 * `*_admin_all` (is_admin) is the backstop.
 */
const MODULE = 'learning' as const;
const LIST_PATH = '/learning/practice';

type Result = { ok: boolean; error?: string } & SiteSync;

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
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
  if (/dsa_problems_practice_slug_key|dsa_topics_practice_slug_key|duplicate key/i.test(message))
    return 'That slug is already taken — pick another.';
  if (/dsa_problems_home_chk/i.test(message)) return 'A coding problem must be attached to a category.';
  if (/foreign key|violates foreign key/i.test(message)) return 'Pick a valid category.';
  return message;
}

// ===========================================================================
// CATEGORIES  (dsa_topics, kind='practice')
// ===========================================================================
function categoryPayload(fd: FormData):
  | { ok: true; value: Record<string, unknown>; slug: string }
  | { ok: false; error: string } {
  const name = s(fd, 'name');
  if (!name) return { ok: false, error: 'Category name is required.' };
  const slug = slugify(s(fd, 'slug') || name);
  if (!slug || !isValidSlug(slug)) {
    return { ok: false, error: 'Could not derive a valid URL slug — set one explicitly (a-z, 0-9, hyphens).' };
  }
  return {
    ok: true,
    slug,
    value: {
      name,
      description: s(fd, 'description'),
      sort_order: Math.max(0, num(fd, 'sort_order', 0)),
      status: status(fd),
      show_on_website: bool(fd, 'show_on_website'),
      show_on_mobile: bool(fd, 'show_on_mobile'),
    },
  };
}

async function categorySlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = createClient();
  let q = supabase.from('dsa_topics').select('id').eq('kind', 'practice').ilike('slug', slug).limit(1);
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}

export async function createPracticeCategory(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'add');
  const parsed = categoryPayload(fd);
  if (!parsed.ok) return parsed;
  if (await categorySlugTaken(parsed.slug)) return { ok: false, error: 'That slug is already taken — pick another.' };
  const supabase = createClient();
  const { error } = await supabase.from('dsa_topics').insert({
    id: rid('dt-practice'),
    kind: 'practice',
    slug: parsed.slug,
    ...parsed.value,
  });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.practice.category.create', module: MODULE, resourceType: 'dsa_topics' });
  revalidatePath(LIST_PATH);
  return { ok: true, ...(await syncPractice()) };
}

export async function updatePracticeCategory(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const parsed = categoryPayload(fd);
  if (!parsed.ok) return parsed;
  if (await categorySlugTaken(parsed.slug, id)) return { ok: false, error: 'That slug is already taken — pick another.' };
  const supabase = createClient();
  const { error } = await supabase
    .from('dsa_topics')
    .update({ slug: parsed.slug, ...parsed.value })
    .eq('id', id)
    .eq('kind', 'practice');
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.practice.category.update', module: MODULE, resourceType: 'dsa_topics', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true, ...(await syncPractice()) };
}

export async function deletePracticeCategory(id: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  // dsa_problems.topic_id is ON DELETE CASCADE — refuse while it still holds problems.
  const { count } = await supabase
    .from('dsa_problems')
    .select('id', { count: 'exact', head: true })
    .is('learning_topic_id', null)
    .eq('topic_id', id);
  if ((count ?? 0) > 0) {
    return { ok: false, error: `Move or delete this category's ${count} problem(s) first.` };
  }
  const { error } = await supabase.from('dsa_topics').delete().eq('id', id).eq('kind', 'practice');
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.practice.category.delete', module: MODULE, resourceType: 'dsa_topics', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true, ...(await syncPractice()) };
}

// ===========================================================================
// PROBLEMS  (dsa_problems, learning_topic_id NULL, topic_id -> practice category)
// ===========================================================================
function problemPayload(fd: FormData):
  | { ok: true; value: Record<string, unknown>; slug: string; category: string }
  | { ok: false; error: string } {
  const title = s(fd, 'title');
  if (!title) return { ok: false, error: 'Problem title is required.' };
  const category = s(fd, 'category');
  if (!category) return { ok: false, error: 'Pick a category.' };
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

  const langs = fd
    .getAll('supported_languages')
    .map(String)
    .filter((l) => (CODING_LANGUAGES as readonly string[]).includes(l));

  return {
    ok: true,
    slug,
    category,
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
      supported_languages: langs.length ? langs : ['java', 'python', 'c', 'cpp', 'javascript'],
      is_premium: bool(fd, 'is_premium'),
      status: status(fd),
      show_on_website: bool(fd, 'show_on_website'),
      show_on_mobile: bool(fd, 'show_on_mobile'),
    },
  };
}

async function problemSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = createClient();
  let q = supabase
    .from('dsa_problems')
    .select('id')
    .is('learning_topic_id', null)
    .not('topic_id', 'is', null)
    .ilike('slug', slug)
    .limit(1);
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}

async function nextSort(categoryId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from('dsa_problems')
    .select('sort_order')
    .is('learning_topic_id', null)
    .eq('topic_id', categoryId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number | undefined) ?? -1) + 1;
}

export async function createPracticeProblem(_p: Result, fd: FormData): Promise<Result & { id?: string }> {
  await requirePermission(MODULE, 'add');
  const parsed = problemPayload(fd);
  if (!parsed.ok) return parsed;
  if (await problemSlugTaken(parsed.slug)) return { ok: false, error: 'That slug is already taken — pick another.' };
  const supabase = createClient();
  const id = rid('cp-practice');
  const { error } = await supabase.from('dsa_problems').insert({
    id,
    topic_id: parsed.category,
    learning_topic_id: null,
    learning_grid_id: null,
    slug: parsed.slug,
    sort_order: await nextSort(parsed.category),
    ...parsed.value,
  });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.practice.problem.create', module: MODULE, resourceType: 'dsa_problems', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true, id, ...(await syncPractice()) };
}

export async function updatePracticeProblem(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const parsed = problemPayload(fd);
  if (!parsed.ok) return parsed;
  if (await problemSlugTaken(parsed.slug, id)) return { ok: false, error: 'That slug is already taken — pick another.' };
  const supabase = createClient();
  const { error } = await supabase
    .from('dsa_problems')
    .update({ topic_id: parsed.category, slug: parsed.slug, ...parsed.value })
    .eq('id', id)
    .is('learning_topic_id', null);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.practice.problem.update', module: MODULE, resourceType: 'dsa_problems', resourceId: id });
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  return { ok: true, ...(await syncPractice()) };
}

export async function deletePracticeProblem(id: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('dsa_problems').delete().eq('id', id).is('learning_topic_id', null);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.practice.problem.delete', module: MODULE, resourceType: 'dsa_problems', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true, ...(await syncPractice()) };
}

export async function setPracticeProblemField(
  id: string,
  field: 'status' | 'is_premium' | 'show_on_website' | 'show_on_mobile',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('dsa_problems').update({ [field]: value }).eq('id', id).is('learning_topic_id', null);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.practice.problem.${field}`, module: MODULE, resourceType: 'dsa_problems', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true, ...(await syncPractice()) };
}

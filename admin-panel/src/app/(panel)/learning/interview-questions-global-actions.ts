'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { slugify, isValidSlug, DIFFICULTIES } from '@/lib/learning/constants';

/**
 * Practice ▸ Interview Questions CRUD (migration 0103/075). A 3-level catalog
 * — `interview_categories` (one row per language, e.g. "Java") ->
 * `interview_topics` (e.g. "OOP") -> `interview_questions` — kept separate
 * from Learning and from Practice ▸ Coding Problems. Runs under the `learning`
 * permission module (same as Coding Practice); RLS `*_admin_all` (is_admin)
 * is the backstop.
 */
const MODULE = 'learning' as const;
const LIST_PATH = '/learning/interview-questions';

type Result = { ok: boolean; error?: string };

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string, dflt: number) => {
  const v = Number(s(fd, k));
  return Number.isFinite(v) ? v : dflt;
};
const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function status(fd: FormData): 'draft' | 'published' | 'archived' {
  const v = s(fd, 'status');
  return v === 'published' || v === 'archived' ? v : 'draft';
}

function pgError(message: string): string {
  if (/interview_categories_slug_key|interview_topics_category_slug_key|duplicate key/i.test(message))
    return 'That slug is already taken — pick another.';
  if (/foreign key|violates foreign key/i.test(message)) return 'Pick a valid category or topic.';
  return message;
}

// ===========================================================================
// CATEGORIES  (interview_categories — one row per language/track)
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
      icon: s(fd, 'icon'),
      sort_order: Math.max(0, num(fd, 'sort_order', 0)),
      status: status(fd),
      show_on_website: bool(fd, 'show_on_website'),
      show_on_mobile: bool(fd, 'show_on_mobile'),
    },
  };
}

async function categorySlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const supabase = createClient();
  let q = supabase.from('interview_categories').select('id').ilike('slug', slug).limit(1);
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}

export async function createInterviewCategory(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'add');
  const parsed = categoryPayload(fd);
  if (!parsed.ok) return parsed;
  if (await categorySlugTaken(parsed.slug)) return { ok: false, error: 'That slug is already taken — pick another.' };
  const supabase = createClient();
  const { error } = await supabase.from('interview_categories').insert({ id: rid('ic'), slug: parsed.slug, ...parsed.value });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.category.create', module: MODULE, resourceType: 'interview_categories' });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

export async function updateInterviewCategory(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const parsed = categoryPayload(fd);
  if (!parsed.ok) return parsed;
  if (await categorySlugTaken(parsed.slug, id)) return { ok: false, error: 'That slug is already taken — pick another.' };
  const supabase = createClient();
  const { error } = await supabase.from('interview_categories').update({ slug: parsed.slug, ...parsed.value }).eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.category.update', module: MODULE, resourceType: 'interview_categories', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

export async function deleteInterviewCategory(id: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { count } = await supabase.from('interview_topics').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if ((count ?? 0) > 0) return { ok: false, error: `Move or delete this category's ${count} topic(s) first.` };
  const { error } = await supabase.from('interview_categories').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.category.delete', module: MODULE, resourceType: 'interview_categories', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

// ===========================================================================
// TOPICS  (interview_topics — one row per topic within a category)
// ===========================================================================
function topicPayload(fd: FormData):
  | { ok: true; value: Record<string, unknown>; slug: string; category: string }
  | { ok: false; error: string } {
  const name = s(fd, 'name');
  if (!name) return { ok: false, error: 'Topic name is required.' };
  const category = s(fd, 'category');
  if (!category) return { ok: false, error: 'Pick a category.' };
  const slug = slugify(s(fd, 'slug') || name);
  if (!slug || !isValidSlug(slug)) {
    return { ok: false, error: 'Could not derive a valid URL slug — set one explicitly (a-z, 0-9, hyphens).' };
  }
  return {
    ok: true,
    slug,
    category,
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

async function topicSlugTaken(categoryId: string, slug: string, exceptId?: string): Promise<boolean> {
  const supabase = createClient();
  let q = supabase.from('interview_topics').select('id').eq('category_id', categoryId).ilike('slug', slug).limit(1);
  if (exceptId) q = q.neq('id', exceptId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}

export async function createInterviewTopic(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'add');
  const parsed = topicPayload(fd);
  if (!parsed.ok) return parsed;
  if (await topicSlugTaken(parsed.category, parsed.slug)) {
    return { ok: false, error: 'That slug is already taken in this category — pick another.' };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('interview_topics')
    .insert({ id: rid('it'), category_id: parsed.category, slug: parsed.slug, ...parsed.value });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.topic.create', module: MODULE, resourceType: 'interview_topics' });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

export async function updateInterviewTopic(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const parsed = topicPayload(fd);
  if (!parsed.ok) return parsed;
  if (await topicSlugTaken(parsed.category, parsed.slug, id)) {
    return { ok: false, error: 'That slug is already taken in this category — pick another.' };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from('interview_topics')
    .update({ category_id: parsed.category, slug: parsed.slug, ...parsed.value })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.topic.update', module: MODULE, resourceType: 'interview_topics', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

export async function deleteInterviewTopic(id: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { count } = await supabase.from('interview_questions').select('id', { count: 'exact', head: true }).eq('topic_id', id);
  if ((count ?? 0) > 0) return { ok: false, error: `Move or delete this topic's ${count} question(s) first.` };
  const { error } = await supabase.from('interview_topics').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.topic.delete', module: MODULE, resourceType: 'interview_topics', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

// ===========================================================================
// QUESTIONS  (interview_questions)
// ===========================================================================
function questionPayload(fd: FormData):
  | { ok: true; value: Record<string, unknown>; topic: string }
  | { ok: false; error: string } {
  const question = s(fd, 'question');
  if (!question) return { ok: false, error: 'Question text is required.' };
  const topic = s(fd, 'topic');
  if (!topic) return { ok: false, error: 'Pick a topic.' };
  const difficulty = (DIFFICULTIES as readonly string[]).includes(s(fd, 'difficulty')) ? s(fd, 'difficulty') : 'Medium';
  return {
    ok: true,
    topic,
    value: {
      question,
      answer: s(fd, 'answer'),
      example: s(fd, 'example'),
      important_point: s(fd, 'important_point'),
      difficulty,
      sort_order: Math.max(0, num(fd, 'sort_order', 0)),
      status: status(fd),
      show_on_website: bool(fd, 'show_on_website'),
      show_on_mobile: bool(fd, 'show_on_mobile'),
    },
  };
}

async function nextSort(topicId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from('interview_questions')
    .select('sort_order')
    .eq('topic_id', topicId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number | undefined) ?? -1) + 1;
}

export async function createInterviewQuestion(_p: Result, fd: FormData): Promise<Result & { id?: string }> {
  await requirePermission(MODULE, 'add');
  const parsed = questionPayload(fd);
  if (!parsed.ok) return parsed;
  const supabase = createClient();
  const id = rid('iq');
  const { error } = await supabase
    .from('interview_questions')
    .insert({ id, topic_id: parsed.topic, sort_order: await nextSort(parsed.topic), ...parsed.value });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.question.create', module: MODULE, resourceType: 'interview_questions', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true, id };
}

export async function updateInterviewQuestion(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const parsed = questionPayload(fd);
  if (!parsed.ok) return parsed;
  const supabase = createClient();
  const { error } = await supabase.from('interview_questions').update({ topic_id: parsed.topic, ...parsed.value }).eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.question.update', module: MODULE, resourceType: 'interview_questions', resourceId: id });
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  return { ok: true };
}

export async function deleteInterviewQuestion(id: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('interview_questions').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.interview.question.delete', module: MODULE, resourceType: 'interview_questions', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

export async function setInterviewQuestionField(
  id: string,
  field: 'status' | 'show_on_website' | 'show_on_mobile',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('interview_questions').update({ [field]: value }).eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.interview.question.${field}`, module: MODULE, resourceType: 'interview_questions', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

export async function setInterviewTopicField(
  id: string,
  field: 'status' | 'show_on_website' | 'show_on_mobile',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('interview_topics').update({ [field]: value }).eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.interview.topic.${field}`, module: MODULE, resourceType: 'interview_topics', resourceId: id });
  revalidatePath(LIST_PATH);
  return { ok: true };
}

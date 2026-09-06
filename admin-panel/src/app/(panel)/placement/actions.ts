'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

/**
 * What survives of the retired "Placement (legacy)" section: CRUD for mock tests
 * (`practice_tests`) and their MCQ questions (`test_questions`). These are kept
 * only to serve Learning topic practice — a topic's Mock Test card links to
 * `/placement/tests/[id]` for question management. Everything else (aptitude /
 * DSA / HR / company / live tests / categories / reports) was removed with the
 * specialised Learning grids (migration 036/0064).
 */

type Result = { ok: boolean; error?: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(s(fd, k) || 0);
const lines = (fd: FormData, k: string) =>
  s(fd, k)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

async function syncTestQuestionCount(testId: string) {
  const supabase = createClient();
  const { count } = await supabase
    .from('test_questions')
    .select('id', { count: 'exact', head: true })
    .eq('test_id', testId);
  await supabase.from('practice_tests').update({ question_count: count ?? 0 }).eq('id', testId);
}

// ============ MCQ questions (test_questions) =============
export async function createTestQuestion(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'add');
  const supabase = createClient();
  const testId = s(fd, 'test_id');
  if (!testId) return { ok: false, error: 'Pick a mock test for this question.' };
  const options = lines(fd, 'options');
  if (options.length < 2) return { ok: false, error: 'Add at least two options (one per line).' };
  const correct = n(fd, 'correct_index');
  if (correct < 0 || correct >= options.length) return { ok: false, error: 'Correct option index is out of range.' };

  const id = rid('q');
  const { error } = await supabase.from('test_questions').insert({
    id,
    test_id: testId,
    question_text: s(fd, 'question_text'),
    options,
    correct_index: correct,
    explanation: s(fd, 'explanation'),
    marks: n(fd, 'marks') || 1,
    difficulty: s(fd, 'difficulty') || 'Medium',
    sort_order: n(fd, 'sort_order'),
  });
  if (error) return { ok: false, error: error.message };
  await syncTestQuestionCount(testId);
  await logActivity({ action: 'placement.question.create', module: 'placement', resourceType: 'test_questions', resourceId: id });
  revalidatePath(`/placement/tests/${testId}`);
  redirect(`/placement/tests/${testId}?created=1`);
}

export async function updateTestQuestion(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const options = lines(fd, 'options');
  const correct = n(fd, 'correct_index');
  if (options.length < 2) return { ok: false, error: 'Add at least two options.' };
  if (correct < 0 || correct >= options.length) return { ok: false, error: 'Correct option index is out of range.' };

  const { data, error } = await supabase
    .from('test_questions')
    .update({
      test_id: s(fd, 'test_id'),
      question_text: s(fd, 'question_text'),
      options,
      correct_index: correct,
      explanation: s(fd, 'explanation'),
      marks: n(fd, 'marks') || 1,
      difficulty: s(fd, 'difficulty') || 'Medium',
      sort_order: n(fd, 'sort_order'),
    })
    .eq('id', id)
    .select('test_id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (data?.test_id) await syncTestQuestionCount(data.test_id);
  await logActivity({ action: 'placement.question.update', module: 'placement', resourceType: 'test_questions', resourceId: id });
  revalidatePath(data?.test_id ? `/placement/tests/${data.test_id}` : '/placement/tests');
  redirect(data?.test_id ? `/placement/tests/${data.test_id}?saved=1` : '/placement/tests');
}

export async function deleteTestQuestion(id: string, testId: string): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('test_questions').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  if (testId) await syncTestQuestionCount(testId);
  await logActivity({ action: 'placement.question.delete', module: 'placement', resourceType: 'test_questions', resourceId: id });
  revalidatePath(testId ? `/placement/tests/${testId}` : '/placement/tests');
  return { ok: true };
}

// ============ mock tests (practice_tests) =============
export async function createMockTest(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'add');
  const supabase = createClient();
  const title = s(fd, 'title');
  if (!title) return { ok: false, error: 'Title is required.' };
  const id = rid('mt');
  const { error } = await supabase.from('practice_tests').insert({
    id,
    title,
    category: s(fd, 'category') || 'aptitude',
    company_id: s(fd, 'company_id') || null,
    duration_minutes: n(fd, 'duration_minutes') || 30,
    total_marks: n(fd, 'total_marks'),
    pass_marks: n(fd, 'pass_marks'),
    difficulty: s(fd, 'difficulty') || 'Medium',
    is_published: fd.get('is_published') === 'on',
    description: s(fd, 'description'),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.test.create', module: 'placement', resourceType: 'practice_tests', resourceId: id });
  revalidatePath('/placement/tests');
  redirect(`/placement/tests/${id}?created=1`);
}

export async function updateMockTest(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('practice_tests')
    .update({
      title: s(fd, 'title'),
      category: s(fd, 'category') || 'aptitude',
      company_id: s(fd, 'company_id') || null,
      duration_minutes: n(fd, 'duration_minutes') || 30,
      total_marks: n(fd, 'total_marks'),
      pass_marks: n(fd, 'pass_marks'),
      difficulty: s(fd, 'difficulty') || 'Medium',
      is_published: fd.get('is_published') === 'on',
      description: s(fd, 'description'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.test.update', module: 'placement', resourceType: 'practice_tests', resourceId: id });
  revalidatePath(`/placement/tests/${id}`);
  redirect(`/placement/tests/${id}?saved=1`);
}

export async function deleteMockTest(id: string): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('practice_tests').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.test.delete', module: 'placement', resourceType: 'practice_tests', resourceId: id });
  revalidatePath('/placement/tests');
  return { ok: true };
}

export async function toggleTestPublished(id: string, next: boolean): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('practice_tests').update({ is_published: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/tests');
  return { ok: true };
}

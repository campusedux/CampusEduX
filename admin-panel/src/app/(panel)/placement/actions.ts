'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { resolveTargetingFromForm } from '@/lib/academic-targeting';

type Result = { ok: boolean; error?: string };
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const n = (fd: FormData, k: string) => Number(s(fd, k) || 0);
const lines = (fd: FormData, k: string) =>
  s(fd, k)
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 32);

function parseJson(raw: string, fallback: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: true, value: fallback };
  try {
    return { ok: true, value: JSON.parse(t) };
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
}

async function syncTestQuestionCount(testId: string) {
  const supabase = createClient();
  const { count } = await supabase
    .from('test_questions')
    .select('id', { count: 'exact', head: true })
    .eq('test_id', testId);
  await supabase.from('practice_tests').update({ question_count: count ?? 0 }).eq('id', testId);
}

// ============ MCQ / aptitude questions (test_questions) =============
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
  revalidatePath('/placement/aptitude');
  redirect('/placement/aptitude?created=1');
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
  revalidatePath('/placement/aptitude');
  redirect('/placement/aptitude?saved=1');
}

export async function deleteTestQuestion(id: string, testId: string): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('test_questions').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  if (testId) await syncTestQuestionCount(testId);
  await logActivity({ action: 'placement.question.delete', module: 'placement', resourceType: 'test_questions', resourceId: id });
  revalidatePath('/placement/aptitude');
  return { ok: true };
}

// ============ DSA problems =============
export async function createDsaProblem(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'add');
  const supabase = createClient();
  const topicId = s(fd, 'topic_id');
  if (!topicId) return { ok: false, error: 'Pick a DSA topic.' };

  const examples = parseJson(s(fd, 'examples'), []);
  const starter = parseJson(s(fd, 'starter_code'), {});
  const solution = parseJson(s(fd, 'solution_code'), {});
  if (!examples.ok) return { ok: false, error: `Examples — ${examples.error}` };
  if (!starter.ok) return { ok: false, error: `Starter code — ${starter.error}` };
  if (!solution.ok) return { ok: false, error: `Solution code — ${solution.error}` };

  const id = rid('dsa');
  const { error } = await supabase.from('dsa_problems').insert({
    id,
    topic_id: topicId,
    title: s(fd, 'title'),
    difficulty: s(fd, 'difficulty') || 'Easy',
    description: s(fd, 'description'),
    examples: examples.value,
    constraints: lines(fd, 'constraints'),
    starter_code: starter.value,
    time_complexity: s(fd, 'time_complexity'),
    space_complexity: s(fd, 'space_complexity'),
    solution_approach: s(fd, 'solution_approach'),
    solution_code: solution.value,
    sort_order: n(fd, 'sort_order'),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.dsa.create', module: 'placement', resourceType: 'dsa_problems', resourceId: id });
  revalidatePath('/placement/dsa');
  redirect('/placement/dsa?created=1');
}

export async function updateDsaProblem(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const examples = parseJson(s(fd, 'examples'), []);
  const starter = parseJson(s(fd, 'starter_code'), {});
  const solution = parseJson(s(fd, 'solution_code'), {});
  if (!examples.ok) return { ok: false, error: `Examples — ${examples.error}` };
  if (!starter.ok) return { ok: false, error: `Starter code — ${starter.error}` };
  if (!solution.ok) return { ok: false, error: `Solution code — ${solution.error}` };

  const { error } = await supabase
    .from('dsa_problems')
    .update({
      topic_id: s(fd, 'topic_id'),
      title: s(fd, 'title'),
      difficulty: s(fd, 'difficulty') || 'Easy',
      description: s(fd, 'description'),
      examples: examples.value,
      constraints: lines(fd, 'constraints'),
      starter_code: starter.value,
      time_complexity: s(fd, 'time_complexity'),
      space_complexity: s(fd, 'space_complexity'),
      solution_approach: s(fd, 'solution_approach'),
      solution_code: solution.value,
      sort_order: n(fd, 'sort_order'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.dsa.update', module: 'placement', resourceType: 'dsa_problems', resourceId: id });
  revalidatePath('/placement/dsa');
  redirect('/placement/dsa?saved=1');
}

export async function deleteDsaProblem(id: string): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('dsa_problems').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.dsa.delete', module: 'placement', resourceType: 'dsa_problems', resourceId: id });
  revalidatePath('/placement/dsa');
  return { ok: true };
}

// ============ HR questions =============
export async function createHrQuestion(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'add');
  const supabase = createClient();
  const id = rid('hr');
  const { error } = await supabase.from('hr_questions').insert({
    id,
    company_id: s(fd, 'company_id') || null,
    category: s(fd, 'category') || 'General Questions',
    question: s(fd, 'question'),
    answer_tips: lines(fd, 'answer_tips'),
    sample_answer: s(fd, 'sample_answer'),
    difficulty: s(fd, 'difficulty') || 'Medium',
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.hr.create', module: 'placement', resourceType: 'hr_questions', resourceId: id });
  const back = s(fd, 'company_id') ? '/placement/company' : '/placement/hr';
  revalidatePath(back);
  redirect(`${back}?created=1`);
}

export async function updateHrQuestion(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('hr_questions')
    .update({
      company_id: s(fd, 'company_id') || null,
      category: s(fd, 'category') || 'General Questions',
      question: s(fd, 'question'),
      answer_tips: lines(fd, 'answer_tips'),
      sample_answer: s(fd, 'sample_answer'),
      difficulty: s(fd, 'difficulty') || 'Medium',
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.hr.update', module: 'placement', resourceType: 'hr_questions', resourceId: id });
  const back = s(fd, 'company_id') ? '/placement/company' : '/placement/hr';
  revalidatePath(back);
  redirect(`${back}?saved=1`);
}

export async function deleteHrQuestion(id: string, scope: 'generic' | 'company'): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('hr_questions').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.hr.delete', module: 'placement', resourceType: 'hr_questions', resourceId: id });
  revalidatePath(scope === 'company' ? '/placement/company' : '/placement/hr');
  return { ok: true };
}

// ============ mock tests =============
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

// ============ live tests =============
export async function createLiveTest(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'add');
  const supabase = createClient();
  const title = s(fd, 'title');
  if (!title) return { ok: false, error: 'Title is required.' };
  const id = rid('lt');
  const { error } = await supabase.from('live_tests').insert({
    id,
    title,
    practice_test_id: s(fd, 'practice_test_id') || null,
    category: s(fd, 'category') || 'aptitude',
    scheduled_start: s(fd, 'scheduled_start') || null,
    scheduled_end: s(fd, 'scheduled_end') || null,
    duration_minutes: n(fd, 'duration_minutes') || 60,
    total_marks: n(fd, 'total_marks'),
    status: s(fd, 'status') || 'upcoming',
    instructions: s(fd, 'instructions'),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.livetest.create', module: 'placement', resourceType: 'live_tests', resourceId: id });
  revalidatePath('/placement/live-tests');
  redirect('/placement/live-tests?created=1');
}

export async function updateLiveTest(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('live_tests')
    .update({
      title: s(fd, 'title'),
      practice_test_id: s(fd, 'practice_test_id') || null,
      category: s(fd, 'category') || 'aptitude',
      scheduled_start: s(fd, 'scheduled_start') || null,
      scheduled_end: s(fd, 'scheduled_end') || null,
      duration_minutes: n(fd, 'duration_minutes') || 60,
      total_marks: n(fd, 'total_marks'),
      status: s(fd, 'status') || 'upcoming',
      instructions: s(fd, 'instructions'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.livetest.update', module: 'placement', resourceType: 'live_tests', resourceId: id });
  revalidatePath('/placement/live-tests');
  redirect('/placement/live-tests?saved=1');
}

export async function deleteLiveTest(id: string): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('live_tests').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/live-tests');
  return { ok: true };
}

// ============ topics / categories =============
export async function createAptitudeTopic(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'add');
  const supabase = createClient();
  const name = s(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const { error } = await supabase.from('aptitude_topics').insert({
    id: `apt-${slug(name)}-${Math.random().toString(36).slice(2, 5)}`,
    category: s(fd, 'category') || 'quantitative',
    name,
    total_questions: n(fd, 'total_questions'),
    sort_order: n(fd, 'sort_order'),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/categories');
  return { ok: true };
}
export async function updateAptitudeTopic(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('aptitude_topics')
    .update({
      category: s(fd, 'category') || 'quantitative',
      name: s(fd, 'name'),
      total_questions: n(fd, 'total_questions'),
      sort_order: n(fd, 'sort_order'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/categories');
  return { ok: true };
}
export async function deleteAptitudeTopic(id: string): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('aptitude_topics').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/categories');
  return { ok: true };
}

export async function createDsaTopic(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'add');
  const supabase = createClient();
  const name = s(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const { error } = await supabase.from('dsa_topics').insert({
    id: `dsa-${slug(name)}-${Math.random().toString(36).slice(2, 5)}`,
    name,
    sort_order: n(fd, 'sort_order'),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/categories');
  return { ok: true };
}
export async function updateDsaTopic(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('dsa_topics')
    .update({ name: s(fd, 'name'), sort_order: n(fd, 'sort_order') })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/categories');
  return { ok: true };
}
export async function deleteDsaTopic(id: string): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('dsa_topics').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/categories');
  return { ok: true };
}

// ============ reports =============
export async function logPlacementReport(kind: string, params: Record<string, unknown>, rowCount: number): Promise<Result> {
  await requirePermission('placement', 'view');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from('admin_users').select('email').eq('id', user?.id ?? '').maybeSingle();
  const { error } = await supabase.from('generated_reports').insert({
    kind,
    module: 'placement',
    params,
    format: 'csv',
    row_count: rowCount,
    created_by: user?.id ?? null,
    created_by_email: me?.email ?? '',
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/reports');
  return { ok: true };
}

export async function buildPlacementReport(
  kind: string,
  from: string,
  to: string,
): Promise<{ ok: boolean; error?: string; rows?: Record<string, unknown>[] }> {
  try {
    return await buildPlacementReportInner(kind, from, to);
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Could not build the report.' };
  }
}

async function buildPlacementReportInner(
  kind: string,
  from: string,
  to: string,
): Promise<{ ok: boolean; error?: string; rows?: Record<string, unknown>[] }> {
  await requirePermission('placement', 'view');
  const supabase = createClient();
  const start = from ? new Date(from).toISOString() : new Date(Date.now() - 30 * 86_400_000).toISOString();
  const end = to ? new Date(`${to}T23:59:59`).toISOString() : new Date().toISOString();

  if (kind === 'attempts') {
    const { data, error } = await supabase
      .from('test_attempts')
      .select('created_at, score, total_marks, correct_count, incorrect_count, time_taken_seconds, test:practice_tests(title, category), user:profiles(full_name, email)')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      rows: (data ?? []).map((a: any) => ({
        date: a.created_at,
        student: a.user?.full_name ?? '',
        email: a.user?.email ?? '',
        test: a.test?.title ?? '',
        category: a.test?.category ?? '',
        score: a.score,
        total_marks: a.total_marks,
        correct: a.correct_count,
        incorrect: a.incorrect_count,
        minutes: Math.round((a.time_taken_seconds || 0) / 60),
      })),
    };
  }

  if (kind === 'questions') {
    const [{ data: mcq }, { data: dsa }, { data: hr }] = await Promise.all([
      supabase.from('test_questions').select('id, question_text, difficulty, marks, test:practice_tests(title)').limit(5000),
      supabase.from('dsa_problems').select('id, title, difficulty, topic:dsa_topics(name)').limit(5000),
      supabase.from('hr_questions').select('id, question, category, company:companies(name)').limit(5000),
    ]);
    const rows = [
      ...(mcq ?? []).map((q: any) => ({ type: 'MCQ', id: q.id, title: q.question_text, difficulty: q.difficulty, group: q.test?.title ?? '' })),
      ...(dsa ?? []).map((q: any) => ({ type: 'DSA', id: q.id, title: q.title, difficulty: q.difficulty, group: q.topic?.name ?? '' })),
      ...(hr ?? []).map((q: any) => ({ type: 'HR', id: q.id, title: q.question, difficulty: '', group: q.company?.name ?? q.category })),
    ];
    return { ok: true, rows };
  }

  // leaderboard
  const { data, error } = await supabase
    .from('test_attempts')
    .select('user_id, score, correct_count, incorrect_count, user:profiles(full_name, email)')
    .gte('created_at', start)
    .lte('created_at', end)
    .limit(10000);
  if (error) return { ok: false, error: error.message };
  const agg = new Map<string, any>();
  for (const r of data ?? []) {
    const cur = agg.get(r.user_id) ?? { student: (r as any).user?.full_name ?? '', email: (r as any).user?.email ?? '', score: 0, tests: 0, correct: 0, answered: 0 };
    cur.score += Number(r.score) || 0;
    cur.tests += 1;
    cur.correct += Number(r.correct_count) || 0;
    cur.answered += (Number(r.correct_count) || 0) + (Number(r.incorrect_count) || 0);
    agg.set(r.user_id, cur);
  }
  const rows = [...agg.values()]
    .map((v) => ({ ...v, accuracy: v.answered ? Math.round((v.correct / v.answered) * 100) : 0 }))
    .sort((a, b) => b.score - a.score);
  return { ok: true, rows };
}

export async function deleteReport(id: string): Promise<Result> {
  await requirePermission('placement', 'view');
  const supabase = createClient();
  const { error } = await supabase.from('generated_reports').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/reports');
  return { ok: true };
}

// ============ preparation notes =============
const tagList = (fd: FormData, k: string) =>
  s(fd, k)
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);

function notePayload(fd: FormData) {
  return {
    title: s(fd, 'title'),
    content: s(fd, 'content'),
    category: s(fd, 'category') || 'General Placement',
    topic: s(fd, 'topic'),
    tags: tagList(fd, 'tags'),
    file_url: s(fd, 'file_url') || null,
    thumbnail_url: s(fd, 'thumbnail_url') || null,
    is_premium: fd.get('is_premium') === 'on',
    is_published: fd.get('is_published') === 'on',
  };
}

export async function createNote(_p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'add');
  const supabase = createClient();
  const payload = notePayload(fd);
  if (!payload.title) return { ok: false, error: 'Title is required.' };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('prep_notes')
    .insert({ ...payload, ...(await resolveTargetingFromForm(fd)), created_by: user?.id ?? null });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.note.create', module: 'placement', resourceType: 'prep_notes' });
  revalidatePath('/placement/notes');
  return { ok: true };
}

export async function updateNote(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const payload = notePayload(fd);
  if (!payload.title) return { ok: false, error: 'Title is required.' };
  const { error } = await supabase
    .from('prep_notes')
    .update({ ...payload, ...(await resolveTargetingFromForm(fd)) })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.note.update', module: 'placement', resourceType: 'prep_notes', resourceId: id });
  revalidatePath('/placement/notes');
  return { ok: true };
}

export async function deleteNote(id: string): Promise<Result> {
  await requirePermission('placement', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('prep_notes').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'placement.note.delete', module: 'placement', resourceType: 'prep_notes', resourceId: id });
  revalidatePath('/placement/notes');
  return { ok: true };
}

export async function toggleNotePublished(id: string, next: boolean): Promise<Result> {
  await requirePermission('placement', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('prep_notes').update({ is_published: next }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/placement/notes');
  return { ok: true };
}

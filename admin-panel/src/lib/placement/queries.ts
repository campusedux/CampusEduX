import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';

export { PLACEMENT_PAGE_SIZE } from '@/lib/placement/constants';
import { PLACEMENT_PAGE_SIZE } from '@/lib/placement/constants';

// --- dashboard --------------------------------------------------------
export async function getPlacementDashboard() {
  const supabase = createClient();
  // All counts are HEAD queries (no rows). The one row-returning query is a
  // single bounded sample of recent attempts, reused for both the unique-taker
  // count and the top-categories donut — instead of two unbounded scans.
  const [aptTopics, dsaProblems, hrQ, testQ, mockTests, liveTests, attemptsTotal, students, attemptSample] =
    await Promise.all([
      safe(supabase.from('aptitude_topics').select('total_questions'), [] as { total_questions: number }[]),
      safeCount(supabase.from('dsa_problems').select('id', { count: 'exact', head: true })),
      safeCount(supabase.from('hr_questions').select('id', { count: 'exact', head: true })),
      safeCount(supabase.from('test_questions').select('id', { count: 'exact', head: true })),
      safeCount(supabase.from('practice_tests').select('id', { count: 'exact', head: true })),
      safeCount(supabase.from('live_tests').select('id', { count: 'exact', head: true })),
      safeCount(supabase.from('test_attempts').select('id', { count: 'exact', head: true })),
      safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true })),
      safe(
        supabase
          .from('test_attempts')
          .select('user_id, test:practice_tests(category)')
          .order('created_at', { ascending: false })
          .limit(4000),
        [] as { user_id: string; test: { category: string } | null }[],
      ),
    ]);

  const questionsTotal =
    aptTopics.reduce((s, t) => s + (Number(t.total_questions) || 0), 0) + hrQ + testQ + dsaProblems;

  const catCounts = new Map<string, number>();
  for (const r of attemptSample) {
    const c = r.test?.category ?? 'other';
    catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  }
  const topCategories = [...catCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  return {
    questionsTotal,
    mockTests,
    liveTests,
    students,
    attempts: attemptsTotal,
    uniqueTestTakers: new Set(attemptSample.map((a) => a.user_id)).size,
    topCategories,
  };
}

// --- aptitude / HR / DSA question lists -----------------------------
export async function listAptitudeQuestions(opts: { page: number; q?: string; test?: string; difficulty?: string }) {
  const supabase = createClient();
  const from = (opts.page - 1) * PLACEMENT_PAGE_SIZE;
  let query = supabase
    .from('test_questions')
    .select('id, question_text, options, correct_index, marks, difficulty, sort_order, test:practice_tests(id, title, category)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PLACEMENT_PAGE_SIZE - 1);
  if (opts.q) query = query.ilike('question_text', `%${opts.q}%`);
  if (opts.test) query = query.eq('test_id', opts.test);
  if (opts.difficulty) query = query.eq('difficulty', opts.difficulty);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function listDsaProblems(opts: { page: number; q?: string; topic?: string; difficulty?: string }) {
  const supabase = createClient();
  const from = (opts.page - 1) * PLACEMENT_PAGE_SIZE;
  let query = supabase
    .from('dsa_problems')
    .select('id, title, difficulty, time_complexity, space_complexity, sort_order, topic:dsa_topics(id, name)', {
      count: 'exact',
    })
    .order('sort_order')
    .range(from, from + PLACEMENT_PAGE_SIZE - 1);
  if (opts.q) query = query.ilike('title', `%${opts.q}%`);
  if (opts.topic) query = query.eq('topic_id', opts.topic);
  if (opts.difficulty) query = query.eq('difficulty', opts.difficulty);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function listHrQuestions(opts: { page: number; q?: string; company?: string; scope: 'generic' | 'company' }) {
  const supabase = createClient();
  const from = (opts.page - 1) * PLACEMENT_PAGE_SIZE;
  let query = supabase
    .from('hr_questions')
    .select('id, category, question, answer_tips, sample_answer, difficulty, company_id, company:companies(name)', {
      count: 'exact',
    })
    .order('category')
    .range(from, from + PLACEMENT_PAGE_SIZE - 1);
  if (opts.scope === 'generic') query = query.is('company_id', null);
  else query = query.not('company_id', 'is', null);
  if (opts.company) query = query.eq('company_id', opts.company);
  if (opts.q) query = query.ilike('question', `%${opts.q}%`);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

// --- single-record getters -----------------------------------------
export async function getTestQuestion(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('test_questions').select('*').eq('id', id).maybeSingle();
  return data as any;
}
export async function getDsaProblem(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('dsa_problems').select('*').eq('id', id).maybeSingle();
  return data as any;
}
export async function getHrQuestion(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('hr_questions').select('*').eq('id', id).maybeSingle();
  return data as any;
}

// --- mock tests ---------------------------------------------------
export async function listMockTests(opts: { page: number; q?: string; category?: string }) {
  const supabase = createClient();
  const from = (opts.page - 1) * PLACEMENT_PAGE_SIZE;
  let query = supabase
    .from('practice_tests')
    .select('id, title, category, question_count, duration_minutes, total_marks, is_published, company:companies(name)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PLACEMENT_PAGE_SIZE - 1);
  if (opts.q) query = query.ilike('title', `%${opts.q}%`);
  if (opts.category) query = query.eq('category', opts.category);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getMockTest(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('practice_tests').select('*').eq('id', id).maybeSingle();
  return data as any;
}

export async function getTestOptions() {
  const supabase = createClient();
  return safe(
    supabase.from('practice_tests').select('id, title, category').order('title'),
    [] as { id: string; title: string; category: string }[],
  );
}

// --- live tests -------------------------------------------------
export async function listLiveTests() {
  const supabase = createClient();
  return safe(
    supabase
      .from('live_tests')
      .select('id, title, category, scheduled_start, scheduled_end, duration_minutes, total_marks, status')
      .order('scheduled_start', { ascending: false }),
    [] as any[],
  );
}
export async function getLiveTest(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('live_tests').select('*').eq('id', id).maybeSingle();
  return data as any;
}

// --- results --------------------------------------------------
export async function getTestResults(testId: string) {
  const supabase = createClient();
  const [test, attempts] = await Promise.all([
    supabase.from('practice_tests').select('id, title, total_marks').eq('id', testId).maybeSingle(),
    safe(
      supabase
        .from('test_attempts')
        .select('user_id, score, total_marks, correct_count, incorrect_count, time_taken_seconds, created_at, user:profiles(full_name, email)')
        .eq('test_id', testId)
        .order('score', { ascending: false }),
      [] as any[],
    ),
  ]);

  const scores = attempts.map((a) => (a.total_marks ? (a.score / a.total_marks) * 100 : 0));
  const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
  const highest = scores.length ? Math.max(...scores) : 0;

  const bands = [
    { label: '0–40%', value: 0 },
    { label: '40–60%', value: 0 },
    { label: '60–80%', value: 0 },
    { label: '80–100%', value: 0 },
  ];
  for (const p of scores) {
    if (p < 40) bands[0].value += 1;
    else if (p < 60) bands[1].value += 1;
    else if (p < 80) bands[2].value += 1;
    else bands[3].value += 1;
  }

  return {
    test: test.data as { id: string; title: string; total_marks: number } | null,
    totalStudents: new Set(attempts.map((a) => a.user_id)).size,
    attempts: attempts.length,
    avg,
    highest,
    bands,
    top: attempts.slice(0, 10),
  };
}

// --- difficulty levels ---------------------------------------
export async function getDifficultyCounts() {
  const supabase = createClient();
  const one = (table: string, col: string, val: string) =>
    safeCount(supabase.from(table).select('id', { count: 'exact', head: true }).eq(col, val));
  const out = await Promise.all(
    ['Easy', 'Medium', 'Hard'].map(async (d) => ({
      difficulty: d,
      dsa: await one('dsa_problems', 'difficulty', d),
      mcq: await one('test_questions', 'difficulty', d),
    })),
  );
  return out;
}

// --- categories (topics) -----------------------------------
export async function getAptitudeTopics() {
  const supabase = createClient();
  return safe(
    supabase.from('aptitude_topics').select('id, category, name, total_questions, solved_questions, sort_order').order('category').order('sort_order'),
    [] as any[],
  );
}
export async function getDsaTopics() {
  const supabase = createClient();
  return safe(
    supabase.from('dsa_topics').select('id, name, sort_order, problems:dsa_problems(id)').order('sort_order'),
    [] as any[],
  );
}

// --- leaderboard -----------------------------------------
export async function getLeaderboard(category: string) {
  const supabase = createClient();
  const rows = await safe(
    supabase
      .from('test_attempts')
      .select('user_id, score, total_marks, correct_count, incorrect_count, test:practice_tests(category), user:profiles(full_name, email)')
      .limit(5000),
    [] as any[],
  );

  const filtered =
    category === 'overall' ? rows : rows.filter((r) => r.test?.category === category);

  const agg = new Map<string, { name: string; email: string; score: number; tests: number; correct: number; total: number }>();
  for (const r of filtered) {
    const cur = agg.get(r.user_id) ?? {
      name: r.user?.full_name ?? 'CampusEduX user',
      email: r.user?.email ?? '',
      score: 0,
      tests: 0,
      correct: 0,
      total: 0,
    };
    cur.score += Number(r.score) || 0;
    cur.tests += 1;
    cur.correct += Number(r.correct_count) || 0;
    cur.total += (Number(r.correct_count) || 0) + (Number(r.incorrect_count) || 0);
    agg.set(r.user_id, cur);
  }

  return [...agg.entries()]
    .map(([user_id, v]) => ({
      user_id,
      ...v,
      accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

export async function getDsaLeaderboard() {
  const supabase = createClient();
  const rows = await safe(
    supabase
      .from('user_dsa_progress')
      .select('user_id, status, problem:dsa_problems(difficulty), user:profiles(full_name, email)')
      .eq('status', 'solved')
      .limit(10000),
    [] as any[],
  );
  const agg = new Map<string, { name: string; email: string; score: number; tests: number; correct: number; total: number }>();
  for (const r of rows) {
    const cur = agg.get(r.user_id) ?? {
      name: r.user?.full_name ?? 'CampusEduX user',
      email: r.user?.email ?? '',
      score: 0,
      tests: 0,
      correct: 0,
      total: 0,
    };
    const w = r.problem?.difficulty === 'Hard' ? 3 : r.problem?.difficulty === 'Medium' ? 2 : 1;
    cur.score += w;
    cur.tests += 1;
    cur.correct += 1;
    cur.total += 1;
    agg.set(r.user_id, cur);
  }
  return [...agg.entries()]
    .map(([user_id, v]) => ({ user_id, ...v, accuracy: 100 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
}

// --- student analytics --------------------------------
export async function getStudentPlacementAnalytics(studentId?: string) {
  const supabase = createClient();
  let query = supabase
    .from('test_attempts')
    .select('user_id, score, total_marks, correct_count, incorrect_count, created_at, test:practice_tests(category)')
    .order('created_at')
    .limit(5000);
  if (studentId) query = query.eq('user_id', studentId);
  const rows = await safe(query, [] as any[]);

  const pct = (r: any) => (r.total_marks ? (r.score / r.total_marks) * 100 : 0);
  const avg = rows.length ? rows.reduce((s, r) => s + pct(r), 0) / rows.length : 0;

  // improvement trend: monthly average
  const monthly = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = String(r.created_at).slice(0, 7);
    const m = monthly.get(k) ?? { sum: 0, n: 0 };
    m.sum += pct(r);
    m.n += 1;
    monthly.set(k, m);
  }
  const trend = [...monthly.entries()]
    .sort()
    .map(([k, v]) => ({ label: k, score: Math.round(v.sum / v.n) }));

  // by category
  const cats = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const c = r.test?.category ?? 'other';
    const m = cats.get(c) ?? { sum: 0, n: 0 };
    m.sum += pct(r);
    m.n += 1;
    cats.set(c, m);
  }
  const byCategory = [...cats.entries()].map(([label, v]) => ({ label, value: Math.round(v.sum / v.n) }));

  return {
    attempts: rows.length,
    students: new Set(rows.map((r) => r.user_id)).size,
    avg: Math.round(avg),
    trend,
    byCategory,
  };
}

export async function getStudentOptions() {
  const supabase = createClient();
  return safe(
    supabase.from('profiles').select('id, full_name, email').order('full_name').limit(500),
    [] as { id: string; full_name: string; email: string }[],
  );
}

// --- preparation notes ----------------------------------------------
export interface AdminPrepNote {
  id: string;
  title: string;
  content: string;
  category: string;
  topic: string;
  tags: string[];
  file_url: string | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  is_published: boolean;
  target_type: string | null;
  target_course_id: string | null;
  target_branch_id: string | null;
  target_branch_ids: string[] | null;
  target_year_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPrepNotes(): Promise<AdminPrepNote[]> {
  const supabase = createClient();
  // select('*') (not an explicit column list) so the query still works before
  // migration 011 adds the target_* columns.
  return safe(
    supabase.from('prep_notes').select('*').order('category').order('updated_at', { ascending: false }),
    [] as AdminPrepNote[],
  );
}

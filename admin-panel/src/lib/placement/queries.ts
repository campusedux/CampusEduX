import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';

export { PLACEMENT_PAGE_SIZE } from '@/lib/placement/constants';
import { PLACEMENT_PAGE_SIZE } from '@/lib/placement/constants';

/**
 * What survives of the retired "Placement (legacy)" section: reads for mock
 * tests (`practice_tests`), their MCQ questions (`test_questions`) and attempt
 * results (`test_attempts`). Kept only to serve Learning topic practice — the
 * aptitude / DSA / HR / company / live-test / leaderboard / analytics screens
 * were removed with the specialised Learning grids (migration 036/0064).
 */

// --- MCQ questions -----------------------------------------------
export async function getTestQuestion(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('test_questions')
    .select('id, test_id, question_text, options, correct_index, explanation, difficulty, marks, sort_order')
    .eq('id', id).maybeSingle();
  return data as any;
}

// --- mock tests -------------------------------------------------
export async function listMockTests(opts: { page: number; q?: string; category?: string; grid?: string }) {
  const supabase = createClient();
  const from = (opts.page - 1) * PLACEMENT_PAGE_SIZE;
  let query = supabase
    .from('practice_tests')
    .select('id, title, category, question_count, duration_minutes, total_marks, is_published, company:companies(name)', {
      count: 'estimated',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PLACEMENT_PAGE_SIZE - 1);
  if (opts.q) query = query.ilike('title', `%${opts.q}%`);
  if (opts.category) query = query.eq('category', opts.category);
  if (opts.grid) query = query.eq('learning_grid_id', opts.grid);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getMockTest(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('practice_tests')
    .select('id, title, description, category, company_id, difficulty, duration_minutes, total_marks, pass_marks, is_published')
    .eq('id', id).maybeSingle();
  return data as any;
}

export async function getTestOptions() {
  const supabase = createClient();
  return safe(
    supabase.from('practice_tests').select('id, title, category').order('title'),
    [] as { id: string; title: string; category: string }[],
  );
}

// --- attempt results -----------------------------------------
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

import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';

export const STUDENT_PAGE_SIZE = 20;

export interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  course: string | null;
  branch: string | null;
  year: string | null;
  is_premium: boolean;
  status: string | null;
  created_at: string;
}

export async function listStudents(opts: {
  page: number;
  q?: string;
  status?: string;
  premium?: string;
  course?: string;
}): Promise<{ rows: StudentRow[]; total: number; missing: boolean }> {
  const supabase = createClient();
  const from = (opts.page - 1) * STUDENT_PAGE_SIZE;

  let query = supabase
    .from('profiles')
    .select(
      'id, full_name, email, mobile_number, course, branch, year, is_premium, status, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + STUDENT_PAGE_SIZE - 1);

  if (opts.q) {
    query = query.or(
      `full_name.ilike.%${opts.q}%,email.ilike.%${opts.q}%,mobile_number.ilike.%${opts.q}%,referral_code.ilike.%${opts.q}%`,
    );
  }
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.premium === 'yes') query = query.eq('is_premium', true);
  if (opts.premium === 'no') query = query.eq('is_premium', false);
  if (opts.course) query = query.eq('course', opts.course);

  const { data, count, error } = await query;
  return {
    rows: error ? [] : (data ?? []),
    total: error ? 0 : count ?? 0,
    missing: Boolean(error),
  };
}

export interface StudentDetail {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  avatar_url: string | null;
  course: string | null;
  branch: string | null;
  year: string | null;
  date_of_birth: string | null;
  gender: string | null;
  location: string | null;
  is_premium: boolean;
  referral_code: string | null;
  status: string | null;
  blocked_reason: string | null;
  blocked_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getStudent(id: string): Promise<StudentDetail | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, mobile_number, avatar_url, course, branch, year, date_of_birth, gender, location, is_premium, referral_code, status, blocked_reason, blocked_at, admin_notes, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle();
  return (data as StudentDetail) ?? null;
}

export interface StudentSummary {
  orders: number;
  spend: number;
  downloads: number;
  walletBalance: number;
  testsAttempted: number;
  problemsSolved: number;
}

export async function getStudentSummary(id: string): Promise<StudentSummary> {
  const supabase = createClient();
  const [orderRows, downloads, walletRows, tests, solved] = await Promise.all([
    safe(
      supabase.from('purchases').select('total_amount, status').eq('user_id', id),
      [] as { total_amount: number; status: string }[],
    ),
    safeCount(supabase.from('downloads').select('id', { count: 'exact', head: true }).eq('user_id', id)),
    safe(
      supabase.from('wallet_transactions').select('type, amount').eq('user_id', id),
      [] as { type: string; amount: number }[],
    ),
    safeCount(supabase.from('test_attempts').select('id', { count: 'exact', head: true }).eq('user_id', id)),
    safeCount(
      supabase
        .from('user_dsa_progress')
        .select('problem_id', { count: 'exact', head: true })
        .eq('user_id', id)
        .eq('status', 'solved'),
    ),
  ]);

  const success = orderRows.filter((o) => o.status === 'success');
  return {
    orders: success.length,
    spend: success.reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
    downloads,
    walletBalance: walletRows.reduce((s, w) => s + (w.type === 'credit' ? 1 : -1) * (Number(w.amount) || 0), 0),
    testsAttempted: tests,
    problemsSolved: solved,
  };
}

export async function getStudentStats() {
  const supabase = createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const since = new Date(Date.now() - 29 * 86_400_000);
  since.setHours(0, 0, 0, 0);

  const [total, premium, blocked, newThis, newLast, signups] = await Promise.all([
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true)),
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'blocked')),
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart)),
    safeCount(
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', lastStart)
        .lt('created_at', monthStart),
    ),
    safe(
      supabase.from('profiles').select('created_at').gte('created_at', since.toISOString()),
      [] as { created_at: string }[],
    ),
  ]);

  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(since.getTime() + i * 86_400_000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of signups) {
    const k = String(s.created_at).slice(0, 10);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
  }
  const series = [...buckets.entries()].map(([k, v]) => ({
    label: new Date(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    signups: v,
  }));

  return { total, premium, blocked, newThis, newLast, series };
}

/** Distinct course values for the list-page filter. */
export async function getCourseOptions(): Promise<string[]> {
  const supabase = createClient();
  const rows = await safe(
    supabase.from('profiles').select('course').not('course', 'is', null).limit(1000),
    [] as { course: string | null }[],
  );
  return [...new Set(rows.map((r) => r.course).filter(Boolean) as string[])].sort();
}

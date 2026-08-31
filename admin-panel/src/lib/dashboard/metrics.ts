import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';

const DAY = 86_400_000;

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const shortDay = (k: string) => new Date(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export interface OverviewPoint {
  label: string;
  users: number;
  orders: number;
  revenue: number;
}

/** Per-day new users / successful orders / revenue for the last `days` days. */
export async function getOverviewSeries(days = 30): Promise<OverviewPoint[]> {
  const supabase = createClient();
  const since = new Date(Date.now() - (days - 1) * DAY);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [users, orders] = await Promise.all([
    safe(
      supabase.from('profiles').select('created_at').gte('created_at', sinceIso),
      [] as { created_at: string }[],
    ),
    safe(
      supabase.from('purchases').select('created_at, total_amount, status').gte('created_at', sinceIso),
      [] as { created_at: string; total_amount: number; status: string }[],
    ),
  ]);

  const buckets = new Map<string, OverviewPoint>();
  for (let i = 0; i < days; i += 1) {
    const k = dayKey(new Date(since.getTime() + i * DAY));
    buckets.set(k, { label: shortDay(k), users: 0, orders: 0, revenue: 0 });
  }
  for (const u of users) {
    const b = buckets.get(String(u.created_at).slice(0, 10));
    if (b) b.users += 1;
  }
  for (const o of orders) {
    const b = buckets.get(String(o.created_at).slice(0, 10));
    if (b && o.status === 'success') {
      b.orders += 1;
      b.revenue += Number(o.total_amount) || 0;
    }
  }
  return [...buckets.values()];
}

export interface Kpis {
  users: { current: number; previous: number };
  orders: { current: number; previous: number };
  revenue: { current: number; previous: number };
  students: number;
  projects: number;
  jobs: number;
}

/** This-calendar-month vs last-month totals for the top stat-card row. */
export async function getKpis(): Promise<Kpis> {
  const supabase = createClient();
  const now = new Date();
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const countIn = (table: string, from: string, to: string | null, apply?: (q: any) => any) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true }).gte('created_at', from);
    if (to) q = q.lt('created_at', to);
    if (apply) q = apply(q);
    return safeCount(q);
  };
  const sumRevenue = async (from: string, to: string | null) => {
    let q = supabase.from('purchases').select('total_amount').eq('status', 'success').gte('created_at', from);
    if (to) q = q.lt('created_at', to);
    const rows = await safe(q, [] as { total_amount: number }[]);
    return rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  };

  const [usersC, usersP, ordersC, ordersP, revC, revP, students, projects, jobs] = await Promise.all([
    countIn('profiles', thisStart, null),
    countIn('profiles', lastStart, thisStart),
    countIn('purchases', thisStart, null, (q) => q.eq('status', 'success')),
    countIn('purchases', lastStart, thisStart, (q) => q.eq('status', 'success')),
    sumRevenue(thisStart, null),
    sumRevenue(lastStart, thisStart),
    safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('projects').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('jobs').select('id', { count: 'exact', head: true })),
  ]);

  return {
    users: { current: usersC, previous: usersP },
    orders: { current: ordersC, previous: ordersP },
    revenue: { current: revC, previous: revP },
    students,
    projects,
    jobs,
  };
}

export async function getOrdersByStatus() {
  const supabase = createClient();
  const one = (status: string) =>
    safeCount(supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', status));
  const [success, pending, failed] = await Promise.all([one('success'), one('pending'), one('failed')]);
  return [
    { label: 'Success', value: success, color: '#16A34A' },
    { label: 'Pending', value: pending, color: '#E8A93A' },
    { label: 'Failed', value: failed, color: '#DC2626' },
  ];
}

export async function getTopCategories(limit = 6) {
  const supabase = createClient();
  const rows = await safe(
    supabase.from('categories').select('id, name, project_count').order('project_count', { ascending: false }).limit(limit),
    [] as { id: string; name: string; project_count: number }[],
  );
  return rows.map((r) => ({ label: r.name, value: Number(r.project_count) || 0 }));
}

export async function getRecentOrders(limit = 8) {
  const supabase = createClient();
  return safe(
    supabase
      .from('purchases')
      .select('id, total_amount, status, created_at, profile:profiles(full_name, email), project:projects(title)')
      .order('created_at', { ascending: false })
      .limit(limit),
    [] as any[],
  );
}

export async function getRecentUsers(limit = 8) {
  const supabase = createClient();
  return safe(
    supabase
      .from('profiles')
      .select('id, full_name, email, course, branch, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    [] as any[],
  );
}

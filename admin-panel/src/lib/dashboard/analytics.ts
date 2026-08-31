import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';
import { getOverviewSeries, getOrdersByStatus, getTopCategories } from '@/lib/dashboard/metrics';

export type AnalyticsTab = 'users' | 'projects' | 'orders' | 'revenue';

export interface AnalyticsResult {
  stats: { label: string; value: string; current?: number; previous?: number; hint?: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: Record<string, any>[];
  seriesKeys: { key: string; label: string; color?: string }[];
  currency?: boolean;
  donuts: { title: string; data: { label: string; value: number; color?: string }[] }[];
}

const money = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export async function getAnalytics(tab: AnalyticsTab): Promise<AnalyticsResult> {
  const supabase = createClient();
  const series = await getOverviewSeries(30);

  if (tab === 'users') {
    const [total, premium, blocked, byCourse] = await Promise.all([
      safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true })),
      safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true)),
      safeCount(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'blocked')),
      safe(supabase.from('profiles').select('course').limit(2000), [] as { course: string | null }[]),
    ]);
    const courseCounts = new Map<string, number>();
    for (const r of byCourse) {
      const c = r.course || 'Unspecified';
      courseCounts.set(c, (courseCounts.get(c) ?? 0) + 1);
    }
    const courseDonut = [...courseCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    return {
      stats: [
        { label: 'Total students', value: String(total) },
        { label: 'Premium', value: String(premium) },
        { label: 'Blocked', value: String(blocked) },
        { label: 'New (30d)', value: String(series.reduce((s, p) => s + Number(p.users), 0)) },
      ],
      series,
      seriesKeys: [{ key: 'users', label: 'New users', color: '#2563EB' }],
      donuts: [
        { title: 'Students by course', data: courseDonut },
        { title: 'Premium vs free', data: [
          { label: 'Premium', value: premium, color: '#4F39F6' },
          { label: 'Free', value: Math.max(0, total - premium), color: '#E7E8EF' },
        ] },
      ],
    };
  }

  if (tab === 'projects') {
    const [total, best, premium, created] = await Promise.all([
      safeCount(supabase.from('projects').select('id', { count: 'exact', head: true })),
      safeCount(supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_best_seller', true)),
      safeCount(supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_premium', true)),
      safe(supabase.from('projects').select('created_at').gte('created_at', series.length ? new Date(Date.now() - 30 * 86400000).toISOString() : ''), [] as { created_at: string }[]),
    ]);
    const byDay = new Map(series.map((p) => [p.label, 0]));
    for (const r of created) {
      const k = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + 1);
    }
    const projSeries = series.map((p) => ({ label: p.label, projects: byDay.get(p.label) ?? 0 }));
    const cats = await getTopCategories(6);

    return {
      stats: [
        { label: 'Total projects', value: String(total) },
        { label: 'Best sellers', value: String(best) },
        { label: 'Premium', value: String(premium) },
        { label: 'Added (30d)', value: String(created.length) },
      ],
      series: projSeries,
      seriesKeys: [{ key: 'projects', label: 'Projects added', color: '#4F39F6' }],
      donuts: [{ title: 'Projects by category', data: cats }],
    };
  }

  if (tab === 'orders') {
    const [success, pending, failed] = (await getOrdersByStatus()).map((s) => s.value);
    const totalOrders = success + pending + failed;
    return {
      stats: [
        { label: 'Total orders', value: String(totalOrders) },
        { label: 'Successful', value: String(success) },
        { label: 'Pending', value: String(pending) },
        { label: 'Failed', value: String(failed) },
      ],
      series,
      seriesKeys: [{ key: 'orders', label: 'Successful orders', color: '#4F39F6' }],
      donuts: [{ title: 'Orders by status', data: await getOrdersByStatus() }],
    };
  }

  // revenue
  const rows = await safe(
    supabase
      .from('purchases')
      .select('total_amount, platform_fee, discount, status, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    [] as { total_amount: number; platform_fee: number; discount: number; status: string }[],
  );
  const ok = rows.filter((r) => r.status === 'success');
  const gross = ok.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const fees = ok.reduce((s, r) => s + (Number(r.platform_fee) || 0), 0);
  const discounts = ok.reduce((s, r) => s + (Number(r.discount) || 0), 0);
  const aov = ok.length ? gross / ok.length : 0;

  return {
    stats: [
      { label: 'Revenue (30d)', value: money(gross) },
      { label: 'Avg order value', value: money(aov) },
      { label: 'Platform fees', value: money(fees) },
      { label: 'Discounts given', value: money(discounts) },
    ],
    series,
    seriesKeys: [{ key: 'revenue', label: 'Revenue (₹)', color: '#16A34A' }],
    currency: true,
    donuts: [
      {
        title: 'Gross vs fees vs discounts',
        data: [
          { label: 'Net revenue', value: Math.max(0, gross - fees - discounts), color: '#16A34A' },
          { label: 'Platform fees', value: fees, color: '#4F39F6' },
          { label: 'Discounts', value: discounts, color: '#E8A93A' },
        ],
      },
    ],
  };
}

import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';

export const REPORT_TYPES = [
  { value: 'revenue', label: 'Revenue Report' },
  { value: 'sales', label: 'Sales Report' },
  { value: 'students', label: 'Students Report' },
  { value: 'projects', label: 'Projects Report' },
  { value: 'jobs', label: 'Jobs Report' },
  { value: 'placement', label: 'Placement Report' },
  { value: 'referral', label: 'Referral Report' },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]['value'];

const DAY = 86_400_000;
const money = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const num = (n: number) => Number(n || 0).toLocaleString('en-IN');

export interface ReportResult {
  label: string;
  range: { from: string; to: string };
  stats: { label: string; value: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trend: Record<string, any>[];
  trendKeys: { key: string; label: string; color?: string }[];
  currency?: boolean;
  donut: { title: string; data: { label: string; value: number }[] };
  topList: { title: string; items: { label: string; value: string }[] };
  rows: Record<string, unknown>[];
}

function resolveRange(from?: string, to?: string) {
  const end = to ? new Date(`${to}T23:59:59`) : new Date();
  const start = from ? new Date(from) : new Date(Date.now() - 29 * DAY);
  start.setHours(0, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString(), start, end };
}

/** Daily buckets between start and end (capped at 90 for chart sanity). */
function dailyBuckets(start: Date, end: Date) {
  const days = Math.min(90, Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY) + 1));
  const base = new Date(end.getTime() - (days - 1) * DAY);
  base.setHours(0, 0, 0, 0);
  const map = new Map<string, number>();
  for (let i = 0; i < days; i += 1) map.set(new Date(base.getTime() + i * DAY).toISOString().slice(0, 10), i);
  const label = (k: string) => new Date(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return { map, label, keys: [...map.keys()] };
}

export async function buildReport(type: ReportType, from?: string, to?: string): Promise<ReportResult> {
  const supabase = createClient();
  const { startIso, endIso, start, end } = resolveRange(from, to);
  const meta = REPORT_TYPES.find((t) => t.value === type)!;
  const range = { from: startIso.slice(0, 10), to: endIso.slice(0, 10) };
  const bk = dailyBuckets(start, end);

  if (type === 'revenue' || type === 'sales') {
    const rows = await safe(
      supabase
        .from('purchases')
        .select('total_amount, platform_fee, discount, status, payment_method, created_at, project:projects(title)')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .limit(20000),
      [] as any[],
    );
    const ok = rows.filter((r) => r.status === 'success');
    const gross = ok.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
    const fees = ok.reduce((s, r) => s + (Number(r.platform_fee) || 0), 0);
    const failed = rows.filter((r) => r.status === 'failed').length;
    const refunded = rows.filter((r) => r.status === 'refunded').length;

    const trend = bk.keys.map((k) => ({ label: bk.label(k), value: 0 }));
    for (const r of ok) {
      const i = bk.map.get(String(r.created_at).slice(0, 10));
      if (i != null) trend[i].value += type === 'revenue' ? Number(r.total_amount) || 0 : 1;
    }

    const method = new Map<string, number>();
    for (const r of ok) method.set(r.payment_method || 'Razorpay', (method.get(r.payment_method || 'Razorpay') ?? 0) + (Number(r.total_amount) || 0));

    const products = new Map<string, number>();
    for (const r of ok) {
      const t = r.project?.title || 'Unknown';
      products.set(t, (products.get(t) ?? 0) + (type === 'revenue' ? Number(r.total_amount) || 0 : 1));
    }

    return {
      label: meta.label,
      range,
      stats:
        type === 'revenue'
          ? [
              { label: 'Gross revenue', value: money(gross) },
              { label: 'Platform fees', value: money(fees) },
              { label: 'Avg order value', value: money(ok.length ? gross / ok.length : 0) },
              { label: 'Refunded orders', value: num(refunded) },
            ]
          : [
              { label: 'Total orders', value: num(rows.length) },
              { label: 'Successful', value: num(ok.length) },
              { label: 'Failed', value: num(failed) },
              { label: 'Refunded', value: num(refunded) },
            ],
      trend,
      trendKeys: [{ key: 'value', label: type === 'revenue' ? 'Revenue (₹)' : 'Orders', color: '#16A34A' }],
      currency: type === 'revenue',
      donut:
        type === 'revenue'
          ? { title: 'Revenue by payment method', data: [...method.entries()].map(([label, value]) => ({ label, value })) }
          : {
              title: 'Orders by status',
              data: [
                { label: 'Success', value: ok.length },
                { label: 'Failed', value: failed },
                { label: 'Refunded', value: refunded },
              ],
            },
      topList: {
        title: type === 'revenue' ? 'Top products by revenue' : 'Top products by units',
        items: [...products.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, v]) => ({ label, value: type === 'revenue' ? money(v) : num(v) })),
      },
      rows: ok.map((r) => ({ date: r.created_at, product: r.project?.title ?? '', amount: r.total_amount, fee: r.platform_fee, discount: r.discount, method: r.payment_method ?? 'Razorpay' })),
    };
  }

  if (type === 'students') {
    const [inRange, all] = await Promise.all([
      safe(supabase.from('profiles').select('full_name, email, course, branch, is_premium, status, created_at').gte('created_at', startIso).lte('created_at', endIso).limit(20000), [] as any[]),
      safe(supabase.from('profiles').select('is_premium, status').limit(50000), [] as any[]),
    ]);
    const trend = bk.keys.map((k) => ({ label: bk.label(k), value: 0 }));
    for (const r of inRange) {
      const i = bk.map.get(String(r.created_at).slice(0, 10));
      if (i != null) trend[i].value += 1;
    }
    const course = new Map<string, number>();
    for (const r of inRange) course.set(r.course || 'Unspecified', (course.get(r.course || 'Unspecified') ?? 0) + 1);

    return {
      label: meta.label,
      range,
      stats: [
        { label: 'New students', value: num(inRange.length) },
        { label: 'Total students', value: num(all.length) },
        { label: 'Premium (all)', value: num(all.filter((r) => r.is_premium).length) },
        { label: 'Blocked (all)', value: num(all.filter((r) => r.status === 'blocked').length) },
      ],
      trend,
      trendKeys: [{ key: 'value', label: 'Sign-ups', color: '#2563EB' }],
      donut: { title: 'New students by course', data: [...course.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value })) },
      topList: {
        title: 'Top courses (in range)',
        items: [...course.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, v]) => ({ label, value: num(v) })),
      },
      rows: inRange.map((r) => ({ name: r.full_name, email: r.email, course: r.course ?? '', branch: r.branch ?? '', premium: r.is_premium, status: r.status ?? 'active', joined: r.created_at })),
    };
  }

  if (type === 'projects') {
    const [inRange, all] = await Promise.all([
      safe(supabase.from('projects').select('title, category_name, price, sales_count, is_premium, is_best_seller, status, created_at').gte('created_at', startIso).lte('created_at', endIso).limit(20000), [] as any[]),
      safe(supabase.from('projects').select('category_name, sales_count').limit(20000), [] as any[]),
    ]);
    const trend = bk.keys.map((k) => ({ label: bk.label(k), value: 0 }));
    for (const r of inRange) {
      const i = bk.map.get(String(r.created_at).slice(0, 10));
      if (i != null) trend[i].value += 1;
    }
    const cat = new Map<string, number>();
    for (const r of all) cat.set(r.category_name || 'Uncategorised', (cat.get(r.category_name || 'Uncategorised') ?? 0) + 1);
    const bySales = [...all].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 10);

    return {
      label: meta.label,
      range,
      stats: [
        { label: 'Added in range', value: num(inRange.length) },
        { label: 'Total projects', value: num(all.length) },
        { label: 'Best sellers', value: num(all.filter((r: any) => r.is_best_seller).length) },
        { label: 'Total sales', value: num(all.reduce((s, r) => s + (Number(r.sales_count) || 0), 0)) },
      ],
      trend,
      trendKeys: [{ key: 'value', label: 'Projects added', color: '#4F39F6' }],
      donut: { title: 'Projects by category', data: [...cat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value })) },
      topList: { title: 'Top projects by sales', items: bySales.map((r: any) => ({ label: r.title, value: num(r.sales_count) })) },
      rows: inRange.map((r) => ({ title: r.title, category: r.category_name, price: r.price, sales: r.sales_count, status: r.status, created: r.created_at })),
    };
  }

  if (type === 'jobs') {
    const [jobs, apps] = await Promise.all([
      safe(supabase.from('jobs').select('title, company_name, job_type, created_at').gte('created_at', startIso).lte('created_at', endIso).limit(20000), [] as any[]),
      safe(supabase.from('applications').select('status, created_at, job:jobs(company_name, job_type)').gte('created_at', startIso).lte('created_at', endIso).limit(20000), [] as any[]),
    ]);
    const trend = bk.keys.map((k) => ({ label: bk.label(k), postings: 0, applications: 0 }));
    for (const j of jobs) {
      const i = bk.map.get(String(j.created_at).slice(0, 10));
      if (i != null) trend[i].postings += 1;
    }
    for (const a of apps) {
      const i = bk.map.get(String(a.created_at).slice(0, 10));
      if (i != null) trend[i].applications += 1;
    }
    const type_ = new Map<string, number>();
    for (const j of jobs) type_.set(j.job_type || 'Full Time', (type_.get(j.job_type || 'Full Time') ?? 0) + 1);
    const byCompany = new Map<string, number>();
    for (const a of apps) {
      const c = a.job?.company_name || 'Unknown';
      byCompany.set(c, (byCompany.get(c) ?? 0) + 1);
    }

    return {
      label: meta.label,
      range,
      stats: [
        { label: 'Postings', value: num(jobs.length) },
        { label: 'Applications', value: num(apps.length) },
        { label: 'Hires', value: num(apps.filter((a) => a.status === 'hired').length) },
        { label: 'Shortlisted', value: num(apps.filter((a) => a.status === 'shortlisted').length) },
      ],
      trend,
      trendKeys: [
        { key: 'postings', label: 'Postings', color: '#4F39F6' },
        { key: 'applications', label: 'Applications', color: '#2563EB' },
      ],
      donut: { title: 'Jobs by type', data: [...type_.entries()].map(([label, value]) => ({ label, value })) },
      topList: {
        title: 'Top companies by applications',
        items: [...byCompany.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, v]) => ({ label, value: num(v) })),
      },
      rows: jobs.map((j) => ({ title: j.title, company: j.company_name, type: j.job_type, created: j.created_at })),
    };
  }

  if (type === 'placement') {
    const attempts = await safe(
      supabase
        .from('test_attempts')
        .select('user_id, score, total_marks, created_at, test:practice_tests(title, category), user:profiles(full_name, email)')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .limit(20000),
      [] as any[],
    );
    const trend = bk.keys.map((k) => ({ label: bk.label(k), value: 0 }));
    for (const a of attempts) {
      const i = bk.map.get(String(a.created_at).slice(0, 10));
      if (i != null) trend[i].value += 1;
    }
    const cat = new Map<string, number>();
    for (const a of attempts) cat.set(a.test?.category || 'other', (cat.get(a.test?.category || 'other') ?? 0) + 1);
    const pct = (a: any) => (a.total_marks ? (a.score / a.total_marks) * 100 : 0);
    const avg = attempts.length ? attempts.reduce((s, a) => s + pct(a), 0) / attempts.length : 0;
    const byUser = new Map<string, { name: string; best: number }>();
    for (const a of attempts) {
      const cur = byUser.get(a.user_id) ?? { name: a.user?.full_name ?? 'CampusEduX user', best: 0 };
      cur.best = Math.max(cur.best, pct(a));
      byUser.set(a.user_id, cur);
    }

    return {
      label: meta.label,
      range,
      stats: [
        { label: 'Attempts', value: num(attempts.length) },
        { label: 'Unique students', value: num(new Set(attempts.map((a) => a.user_id)).size) },
        { label: 'Avg score', value: `${Math.round(avg)}%` },
        { label: 'Categories', value: num(cat.size) },
      ],
      trend,
      trendKeys: [{ key: 'value', label: 'Attempts', color: '#4F39F6' }],
      donut: { title: 'Attempts by category', data: [...cat.entries()].map(([label, value]) => ({ label, value })) },
      topList: {
        title: 'Top performers (best %)',
        items: [...byUser.values()].sort((a, b) => b.best - a.best).slice(0, 10).map((u) => ({ label: u.name, value: `${Math.round(u.best)}%` })),
      },
      rows: attempts.map((a) => ({ date: a.created_at, student: a.user?.full_name ?? '', email: a.user?.email ?? '', test: a.test?.title ?? '', category: a.test?.category ?? '', score: a.score, total: a.total_marks })),
    };
  }

  // referral
  const [refs, earn] = await Promise.all([
    safe(
      supabase
        .from('referrals')
        .select('status, reward_amount, source, created_at, referrer:profiles!referrals_referrer_id_fkey(full_name, email)')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .limit(20000),
      [] as any[],
    ),
    safe(supabase.from('referral_earnings').select('amount, created_at').gte('created_at', startIso).lte('created_at', endIso).limit(20000), [] as any[]),
  ]);
  const trend = bk.keys.map((k) => ({ label: bk.label(k), referrals: 0, earnings: 0 }));
  for (const r of refs) {
    const i = bk.map.get(String(r.created_at).slice(0, 10));
    if (i != null) trend[i].referrals += 1;
  }
  for (const e of earn) {
    const i = bk.map.get(String(e.created_at).slice(0, 10));
    if (i != null) trend[i].earnings += Number(e.amount) || 0;
  }
  const successful = refs.filter((r) => r.status === 'successful');
  const source = new Map<string, number>();
  for (const r of refs) source.set(r.source || 'link', (source.get(r.source || 'link') ?? 0) + 1);
  const byReferrer = new Map<string, number>();
  for (const r of successful) {
    const k = r.referrer?.full_name || r.referrer?.email || 'unknown';
    byReferrer.set(k, (byReferrer.get(k) ?? 0) + (Number(r.reward_amount) || 0));
  }

  return {
    label: meta.label,
    range,
    stats: [
      { label: 'Referrals', value: num(refs.length) },
      { label: 'Successful', value: num(successful.length) },
      { label: 'Paid out', value: money(successful.reduce((s, r) => s + (Number(r.reward_amount) || 0), 0)) },
      { label: 'Conversion', value: `${refs.length ? Math.round((successful.length / refs.length) * 100) : 0}%` },
    ],
    trend,
    trendKeys: [
      { key: 'referrals', label: 'Referrals', color: '#4F39F6' },
      { key: 'earnings', label: 'Earnings (₹)', color: '#16A34A' },
    ],
    donut: { title: 'Referrals by source', data: [...source.entries()].map(([label, value]) => ({ label, value })) },
    topList: {
      title: 'Top referrers by earnings',
      items: [...byReferrer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, v]) => ({ label, value: money(v) })),
    },
    rows: refs.map((r) => ({ date: r.created_at, referrer: r.referrer?.full_name ?? '', status: r.status, reward: r.reward_amount, source: r.source ?? 'link' })),
  };
}

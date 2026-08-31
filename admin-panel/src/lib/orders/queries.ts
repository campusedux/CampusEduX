import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';

export const ORDER_PAGE_SIZE = 20;

export async function listOrders(opts: {
  page: number;
  q?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const supabase = createClient();
  const start = (opts.page - 1) * ORDER_PAGE_SIZE;
  let query = supabase
    .from('purchases')
    .select(
      'id, total_amount, price, discount, platform_fee, status, coupon_code, payment_method, razorpay_payment_id, failure_reason, created_at, profile:profiles(full_name, email), project:projects(title)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(start, start + ORDER_PAGE_SIZE - 1);

  if (opts.status) query = query.eq('status', opts.status);
  if (opts.from) query = query.gte('created_at', new Date(opts.from).toISOString());
  if (opts.to) query = query.lte('created_at', new Date(`${opts.to}T23:59:59`).toISOString());
  if (opts.q)
    query = query.or(
      `coupon_code.ilike.%${opts.q}%,razorpay_order_id.ilike.%${opts.q}%,razorpay_payment_id.ilike.%${opts.q}%`,
    );

  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getOrder(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('purchases')
    .select(
      '*, profile:profiles(id, full_name, email, mobile_number), project:projects(id, title, price)',
    )
    .eq('id', id)
    .maybeSingle();
  return data as any;
}

export async function getOrderStats() {
  const supabase = createClient();
  const [total, success, failed, pending, refunded, revenueRows, pendingRefunds] = await Promise.all([
    safeCount(supabase.from('purchases').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'success')),
    safeCount(supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'failed')),
    safeCount(supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    safeCount(supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('status', 'refunded')),
    safe(supabase.from('purchases').select('total_amount').eq('status', 'success'), [] as { total_amount: number }[]),
    safeCount(supabase.from('refund_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
  ]);
  return {
    total,
    success,
    failed,
    pending,
    refunded,
    revenue: revenueRows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0),
    pendingRefunds,
  };
}

export async function listRefundRequests(opts: { page: number; status?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * ORDER_PAGE_SIZE;
  let query = supabase
    .from('refund_requests')
    .select(
      'id, amount, reason, status, refund_to, decision_note, decided_at, created_at, user:profiles(full_name, email), purchase:purchases(project:projects(title))',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(start, start + ORDER_PAGE_SIZE - 1);
  if (opts.status) query = query.eq('status', opts.status);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getCoupons() {
  const supabase = createClient();
  return safe(
    supabase
      .from('coupons')
      .select('id, code, description, discount_type, discount_value, max_discount, min_order, usage_limit, used_count, valid_from, valid_till, status')
      .order('created_at', { ascending: false }),
    [] as any[],
  );
}
export async function getCoupon(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle();
  return data as any;
}

export async function getOffers() {
  const supabase = createClient();
  return safe(
    supabase.from('offers').select('id, title, description, discount_label, coupon_code, priority, valid_from, valid_till, status').order('priority'),
    [] as any[],
  );
}

export async function listTransactions(opts: { page: number; q?: string; type?: string; category?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * ORDER_PAGE_SIZE;
  let query = supabase
    .from('wallet_transactions')
    .select('id, type, category, amount, description, created_at, user:profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, start + ORDER_PAGE_SIZE - 1);
  if (opts.type) query = query.eq('type', opts.type);
  if (opts.category) query = query.eq('category', opts.category);
  if (opts.q) query = query.ilike('description', `%${opts.q}%`);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getRevenueBreakdown() {
  const supabase = createClient();
  const [purchases, premium, topups] = await Promise.all([
    safe(
      supabase.from('purchases').select('total_amount, status, payment_method, project:projects(title)').limit(5000),
      [] as any[],
    ),
    safe(supabase.from('premium_subscriptions').select('price, status, payment_method').limit(5000), [] as any[]),
    safe(supabase.from('wallet_topup_orders').select('amount, status').limit(5000), [] as any[]),
  ]);

  const okPurch = purchases.filter((p) => p.status === 'success');
  const okPrem = premium.filter((p) => p.status === 'active');
  const okTop = topups.filter((t) => t.status === 'paid');

  const method = new Map<string, number>();
  for (const p of okPurch) method.set(p.payment_method || 'Razorpay', (method.get(p.payment_method || 'Razorpay') ?? 0) + (Number(p.total_amount) || 0));
  for (const p of okPrem) method.set(p.payment_method || 'Razorpay', (method.get(p.payment_method || 'Razorpay') ?? 0) + (Number(p.price) || 0));
  for (const t of okTop) method.set('Wallet top-up', (method.get('Wallet top-up') ?? 0) + (Number(t.amount) || 0));

  const productTotals = new Map<string, number>();
  for (const p of okPurch) {
    const t = p.project?.title || 'Unknown';
    productTotals.set(t, (productTotals.get(t) ?? 0) + (Number(p.total_amount) || 0));
  }

  return {
    projectRevenue: okPurch.reduce((s, p) => s + (Number(p.total_amount) || 0), 0),
    premiumRevenue: okPrem.reduce((s, p) => s + (Number(p.price) || 0), 0),
    topupVolume: okTop.reduce((s, t) => s + (Number(t.amount) || 0), 0),
    byMethod: [...method.entries()].map(([label, value]) => ({ label, value })),
    topProducts: [...productTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

export async function getMonthlyReport() {
  const supabase = createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [orders, users] = await Promise.all([
    safe(
      supabase.from('purchases').select('total_amount, status, created_at').gte('created_at', sinceIso),
      [] as { total_amount: number; status: string; created_at: string }[],
    ),
    safe(supabase.from('profiles').select('created_at').gte('created_at', sinceIso), [] as { created_at: string }[]),
  ]);

  const months: { key: string; label: string; revenue: number; orders: number; users: number }[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      revenue: 0,
      orders: 0,
      users: 0,
    });
  }
  const idx = new Map(months.map((m, i) => [m.key, i]));
  for (const o of orders) {
    if (o.status !== 'success') continue;
    const i = idx.get(String(o.created_at).slice(0, 7));
    if (i != null) {
      months[i].revenue += Number(o.total_amount) || 0;
      months[i].orders += 1;
    }
  }
  for (const u of users) {
    const i = idx.get(String(u.created_at).slice(0, 7));
    if (i != null) months[i].users += 1;
  }
  return months.map((m, i) => ({
    ...m,
    growth: i === 0 || months[i - 1].revenue === 0 ? null : Math.round(((m.revenue - months[i - 1].revenue) / months[i - 1].revenue) * 100),
  }));
}

export async function getPaymentAnalytics() {
  const supabase = createClient();
  const [purchases, premium] = await Promise.all([
    safe(supabase.from('purchases').select('status, payment_method').limit(10000), [] as any[]),
    safe(supabase.from('premium_subscriptions').select('status, payment_method').limit(10000), [] as any[]),
  ]);

  const succ = purchases.filter((p) => p.status === 'success').length;
  const fail = purchases.filter((p) => p.status === 'failed').length;
  const pend = purchases.filter((p) => p.status === 'pending').length;
  const total = succ + fail + pend;

  const methods = new Map<string, { ok: number; total: number }>();
  const bump = (m: string, ok: boolean) => {
    const cur = methods.get(m) ?? { ok: 0, total: 0 };
    cur.total += 1;
    if (ok) cur.ok += 1;
    methods.set(m, cur);
  };
  for (const p of purchases) bump(p.payment_method || 'Razorpay', p.status === 'success');
  for (const p of premium) bump(p.payment_method || 'Razorpay', p.status === 'active');

  return {
    successRate: total ? Math.round((succ / total) * 100) : 0,
    failureRate: total ? Math.round((fail / total) * 100) : 0,
    counts: { succ, fail, pend, total },
    methodBars: [...methods.entries()].map(([label, v]) => ({
      label,
      value: v.total ? Math.round((v.ok / v.total) * 100) : 0,
      total: v.total,
    })),
  };
}

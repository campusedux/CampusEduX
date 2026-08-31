import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';

export const REFERRAL_PAGE_SIZE = 20;

const DAY = 86_400_000;

export async function getReferralDashboard() {
  const supabase = createClient();
  const since = new Date(Date.now() - 29 * DAY);
  since.setHours(0, 0, 0, 0);

  const [all, earnings] = await Promise.all([
    safe(
      supabase
        .from('referrals')
        .select('id, status, reward_amount, source, created_at, completed_at, referrer:profiles!referrals_referrer_id_fkey(full_name, email)')
        .limit(10000),
      [] as any[],
    ),
    safe(supabase.from('referral_earnings').select('amount, created_at').limit(10000), [] as { amount: number; created_at: string }[]),
  ]);

  const successful = all.filter((r) => r.status === 'successful');
  const pending = all.filter((r) => r.status === 'pending');
  const totalPaid = successful.reduce((s, r) => s + (Number(r.reward_amount) || 0), 0);
  const conversion = all.length ? Math.round((successful.length / all.length) * 100) : 0;

  // 30-day trend of referrals created
  const buckets = new Map<string, { label: string; referrals: number; earnings: number }>();
  for (let i = 0; i < 30; i += 1) {
    const k = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    buckets.set(k, { label: new Date(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), referrals: 0, earnings: 0 });
  }
  for (const r of all) {
    const b = buckets.get(String(r.created_at).slice(0, 10));
    if (b) b.referrals += 1;
  }
  for (const e of earnings) {
    const b = buckets.get(String(e.created_at).slice(0, 10));
    if (b) b.earnings += Number(e.amount) || 0;
  }

  // top earning referrers
  const byReferrer = new Map<string, { name: string; email: string; earned: number; count: number }>();
  for (const r of successful) {
    const key = r.referrer?.email || 'unknown';
    const cur = byReferrer.get(key) ?? { name: r.referrer?.full_name ?? 'CampusEduX member', email: r.referrer?.email ?? '', earned: 0, count: 0 };
    cur.earned += Number(r.reward_amount) || 0;
    cur.count += 1;
    byReferrer.set(key, cur);
  }

  // invite-channel donut
  const channel = new Map<string, number>();
  for (const r of all) channel.set(r.source || 'link', (channel.get(r.source || 'link') ?? 0) + 1);

  return {
    total: all.length,
    successful: successful.length,
    pending: pending.length,
    totalPaid,
    conversion,
    trend: [...buckets.values()],
    topReferrers: [...byReferrer.values()].sort((a, b) => b.earned - a.earned).slice(0, 8),
    channels: [...channel.entries()].map(([label, value]) => ({ label, value })),
  };
}

export async function listReferralUsers(opts: { page: number; q?: string; status?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * REFERRAL_PAGE_SIZE;
  let query = supabase
    .from('referrals')
    .select(
      'id, status, reward_amount, source, created_at, completed_at, referred_user:profiles!referrals_referred_user_id_fkey(full_name, email, location), referrer:profiles!referrals_referrer_id_fkey(full_name, email)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(start, start + REFERRAL_PAGE_SIZE - 1);
  if (opts.status) query = query.eq('status', opts.status);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getReferralEarnings() {
  const supabase = createClient();
  const [refs, earn] = await Promise.all([
    safe(
      supabase
        .from('referrals')
        .select('status, reward_amount, referrer:profiles!referrals_referrer_id_fkey(full_name, email)')
        .limit(10000),
      [] as any[],
    ),
    safe(supabase.from('referral_earnings').select('amount, created_at').limit(10000), [] as { amount: number; created_at: string }[]),
  ]);

  const paid = refs.filter((r) => r.status === 'successful').reduce((s, r) => s + (Number(r.reward_amount) || 0), 0);
  const pendingAmt = refs.filter((r) => r.status === 'pending').reduce((s, r) => s + (Number(r.reward_amount) || 0), 0);

  const monthly = new Map<string, number>();
  for (const e of earn) {
    const k = String(e.created_at).slice(0, 7);
    monthly.set(k, (monthly.get(k) ?? 0) + (Number(e.amount) || 0));
  }
  const trend = [...monthly.entries()].sort().map(([label, earnings]) => ({ label, earnings }));

  const top = new Map<string, { name: string; email: string; earned: number }>();
  for (const r of refs) {
    if (r.status !== 'successful') continue;
    const key = r.referrer?.email || 'unknown';
    const cur = top.get(key) ?? { name: r.referrer?.full_name ?? 'CampusEduX member', email: r.referrer?.email ?? '', earned: 0 };
    cur.earned += Number(r.reward_amount) || 0;
    top.set(key, cur);
  }

  return { paid, pendingAmt, trend, topEarners: [...top.values()].sort((a, b) => b.earned - a.earned).slice(0, 10) };
}

export async function getPlatformWallet() {
  const supabase = createClient();
  const [tx, pendingW, recent] = await Promise.all([
    safe(supabase.from('wallet_transactions').select('type, amount').limit(50000), [] as { type: string; amount: number }[]),
    safe(supabase.from('withdrawal_requests').select('amount').eq('status', 'pending'), [] as { amount: number }[]),
    safe(
      supabase
        .from('wallet_transactions')
        .select('id, type, category, amount, description, created_at, user:profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(15),
      [] as any[],
    ),
  ]);

  const credit = tx.filter((t) => t.type === 'credit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const debit = tx.filter((t) => t.type === 'debit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const pending = pendingW.reduce((s, w) => s + (Number(w.amount) || 0), 0);
  const total = credit - debit;

  return { total, available: total - pending, pending, credited: credit, debited: debit, recent };
}

export async function getReferralLeaderboard(tab: 'earners' | 'referrals' | 'active') {
  const supabase = createClient();
  const rows = await safe(
    supabase
      .from('referrals')
      .select('referrer_id, status, reward_amount, created_at, referrer:profiles!referrals_referrer_id_fkey(full_name, email, avatar_url)')
      .limit(20000),
    [] as any[],
  );

  const agg = new Map<string, { name: string; email: string; earned: number; total: number; successful: number; last: string }>();
  for (const r of rows) {
    const cur = agg.get(r.referrer_id) ?? {
      name: r.referrer?.full_name ?? 'CampusEduX member',
      email: r.referrer?.email ?? '',
      earned: 0,
      total: 0,
      successful: 0,
      last: r.created_at,
    };
    cur.total += 1;
    if (r.status === 'successful') {
      cur.successful += 1;
      cur.earned += Number(r.reward_amount) || 0;
    }
    if (r.created_at > cur.last) cur.last = r.created_at;
    agg.set(r.referrer_id, cur);
  }

  const list = [...agg.entries()].map(([id, v]) => ({ id, ...v }));
  if (tab === 'earners') list.sort((a, b) => b.earned - a.earned);
  else if (tab === 'referrals') list.sort((a, b) => b.successful - a.successful);
  else list.sort((a, b) => b.last.localeCompare(a.last));
  return list.slice(0, 50);
}

export async function getRewardSettings() {
  const supabase = createClient();
  const { data } = await supabase.from('reward_settings').select('*').eq('id', 1).maybeSingle();
  return (
    (data as any) ?? {
      bonus_type: 'flat',
      bonus_value: 100,
      min_payout: 100,
      max_payout: 5000,
      bonus_validity_days: 90,
      reward_on_signup: false,
      reward_on_first_purchase: true,
      reward_on_subscription: false,
    }
  );
}

export async function getReferralAnalytics() {
  const supabase = createClient();
  const [refs, earn] = await Promise.all([
    safe(
      supabase
        .from('referrals')
        .select('status, source, created_at, referred_user:profiles!referrals_referred_user_id_fkey(location)')
        .limit(20000),
      [] as any[],
    ),
    safe(supabase.from('referral_earnings').select('amount, created_at').limit(20000), [] as { amount: number; created_at: string }[]),
  ]);

  const monthly = new Map<string, { referrals: number; earnings: number }>();
  for (const r of refs) {
    const k = String(r.created_at).slice(0, 7);
    const m = monthly.get(k) ?? { referrals: 0, earnings: 0 };
    m.referrals += 1;
    monthly.set(k, m);
  }
  for (const e of earn) {
    const k = String(e.created_at).slice(0, 7);
    const m = monthly.get(k) ?? { referrals: 0, earnings: 0 };
    m.earnings += Number(e.amount) || 0;
    monthly.set(k, m);
  }
  const dual = [...monthly.entries()].sort().map(([label, v]) => ({ label, ...v }));

  const source = new Map<string, number>();
  const city = new Map<string, number>();
  for (const r of refs) {
    source.set(r.source || 'link', (source.get(r.source || 'link') ?? 0) + 1);
    const c = r.referred_user?.location || 'Unknown';
    city.set(c, (city.get(c) ?? 0) + 1);
  }

  return {
    dual,
    bySource: [...source.entries()].map(([label, value]) => ({ label, value })),
    topCities: [...city.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value })),
  };
}

export async function getStudentSearchOptions(q: string) {
  const supabase = createClient();
  if (!q) return [];
  return safe(
    supabase.from('profiles').select('id, full_name, email').or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(20),
    [] as { id: string; full_name: string; email: string }[],
  );
}

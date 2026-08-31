import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';

export const REVIEW_PAGE_SIZE = 20;

export async function listReviews(opts: { page: number; q?: string; status?: string; rating?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * REVIEW_PAGE_SIZE;
  let query = supabase
    .from('reviews')
    .select('id, rating, comment, status, entity_type, created_at, project:projects(id, title), profile:profiles(full_name, email)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(start, start + REVIEW_PAGE_SIZE - 1);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.rating) query = query.eq('rating', Number(opts.rating));
  if (opts.q) query = query.ilike('comment', `%${opts.q}%`);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getReviewStats() {
  const supabase = createClient();
  const [published, pending, reported, removed] = await Promise.all([
    safeCount(supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    safeCount(supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
    safeCount(supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'reported')),
    safeCount(supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'removed')),
  ]);
  return { published, pending, reported, removed };
}

export async function getRatingAnalytics() {
  const supabase = createClient();
  const [rows, projects] = await Promise.all([
    safe(
      supabase.from('reviews').select('rating, entity_type, created_at, project_id').limit(20000),
      [] as { rating: number; entity_type: string; created_at: string; project_id: string }[],
    ),
    safe(supabase.from('projects').select('id, title, rating, review_count').order('rating', { ascending: false }).limit(10), [] as any[]),
  ]);

  const count = rows.length;
  const avg = count ? rows.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: rows.filter((r) => r.rating === star).length }));

  const monthly = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = String(r.created_at).slice(0, 7);
    const m = monthly.get(k) ?? { sum: 0, n: 0 };
    m.sum += r.rating;
    m.n += 1;
    monthly.set(k, m);
  }
  const trend = [...monthly.entries()].sort().map(([label, v]) => ({ label, rating: Math.round((v.sum / v.n) * 10) / 10 }));

  const byType = new Map<string, number>();
  for (const r of rows) byType.set(r.entity_type || 'project', (byType.get(r.entity_type || 'project') ?? 0) + 1);

  return {
    avg,
    count,
    dist,
    trend,
    byType: [...byType.entries()].map(([label, value]) => ({ label, value })),
    topRated: (projects ?? []).filter((p: any) => p.review_count > 0).slice(0, 8),
  };
}

export async function listReportedReviews(opts: { page: number; status?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * REVIEW_PAGE_SIZE;
  let query = supabase
    .from('review_reports')
    .select(
      'id, reason, category, status, resolution, resolved_at, created_at, reporter:profiles!review_reports_reported_by_fkey(full_name, email), review:reviews(id, rating, comment, status, project:projects(title))',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(start, start + REVIEW_PAGE_SIZE - 1);
  if (opts.status) query = query.eq('status', opts.status);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function listReviewsForDeletion(opts: { page: number; category?: string }) {
  const supabase = createClient();
  const start = (opts.page - 1) * REVIEW_PAGE_SIZE;
  // reviews with an open/resolved report, joined to the latest report's category
  let query = supabase
    .from('review_reports')
    .select(
      'id, category, reason, status, review:reviews(id, rating, comment, status, created_at, profile:profiles(full_name, email), project:projects(title))',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(start, start + REVIEW_PAGE_SIZE - 1);
  if (opts.category) query = query.eq('category', opts.category);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getTestimonials() {
  const supabase = createClient();
  return safe(
    supabase
      .from('testimonials')
      .select('id, author_name, author_role, avatar_url, rating, quote, display_on, status, sort_order')
      .order('sort_order'),
    [] as any[],
  );
}

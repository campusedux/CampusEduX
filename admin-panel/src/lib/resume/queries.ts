import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';

export const RESUME_PAGE_SIZE = 20;

export { ATS_SECTIONS, ATS_SECTION_LABEL, IMPORTANCE, IMPORTANCE_TONE } from '@/lib/resume/constants';

export async function getResumeDashboard() {
  const supabase = createClient();
  const [resumes, downloads, scoreRows, dlUserRows, templates] = await Promise.all([
    safeCount(supabase.from('resumes_builder').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('resume_downloads').select('id', { count: 'exact', head: true })),
    safe(supabase.from('resumes_builder').select('ats_score'), [] as { ats_score: number }[]),
    safe(supabase.from('resume_downloads').select('user_id').limit(10000), [] as { user_id: string }[]),
    safe(
      supabase.from('resume_templates').select('id, name, accent_color').order('sort_order'),
      [] as { id: string; name: string; accent_color: string }[],
    ),
  ]);

  const scores = scoreRows.map((r) => Number(r.ats_score) || 0).filter((n) => n > 0);
  const avgAts = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;

  // top templates by resume count
  const tplRows = await safe(supabase.from('resumes_builder').select('template').limit(10000), [] as { template: string }[]);
  const tplCounts = new Map<string, number>();
  for (const r of tplRows) tplCounts.set(r.template, (tplCounts.get(r.template) ?? 0) + 1);
  const nameOf = new Map(templates.map((t) => [t.id, t.name]));
  const topTemplates = [...tplCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, value]) => ({ label: nameOf.get(id) ?? id, value }));

  const bands = [
    { label: '0–40', value: 0 },
    { label: '40–60', value: 0 },
    { label: '60–80', value: 0 },
    { label: '80–100', value: 0 },
  ];
  for (const sc of scores) {
    if (sc < 40) bands[0].value += 1;
    else if (sc < 60) bands[1].value += 1;
    else if (sc < 80) bands[2].value += 1;
    else bands[3].value += 1;
  }

  return {
    resumes,
    downloads,
    avgAts,
    activeUsers: new Set(dlUserRows.map((r) => r.user_id)).size,
    topTemplates,
    scoreBands: bands,
  };
}

export async function getTemplates() {
  const supabase = createClient();
  return safe(
    supabase
      .from('resume_templates')
      .select('id, name, accent_color, description, category, preview_image_url, features, status, is_premium, sort_order')
      .order('sort_order'),
    [] as any[],
  );
}

export async function getTemplate(id: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('resume_templates')
    .select('id, name, accent_color, description, category, preview_image_url, features, status, is_premium, sort_order')
    .eq('id', id).maybeSingle();
  return data as any;
}

export async function getTemplateCategories() {
  const supabase = createClient();
  return safe(
    supabase.from('resume_template_categories').select('id, name, slug, status, sort_order').order('sort_order'),
    [] as any[],
  );
}

export async function getAtsRules() {
  const supabase = createClient();
  return safe(
    supabase.from('ats_rules').select('id, section, rule, guideline, importance, is_active, sort_order').order('section').order('sort_order'),
    [] as any[],
  );
}

export async function getAiPrompts() {
  const supabase = createClient();
  return safe(
    supabase.from('resume_ai_prompts').select('id, section, system_prompt, max_tokens, is_active, updated_at').order('section'),
    [] as any[],
  );
}

export async function getShareReports() {
  const supabase = createClient();
  return safe(
    supabase
      .from('resume_share_reports')
      .select(
        'id, reason, status, created_at, resolved_at, share:resume_shares(id, token, is_active, resume:resumes_builder(title))',
      )
      .order('created_at', { ascending: false }),
    [] as any[],
  );
}

export async function listResumeDownloads(opts: { page: number; q?: string }) {
  const supabase = createClient();
  const from = (opts.page - 1) * RESUME_PAGE_SIZE;
  let query = supabase
    .from('resume_downloads')
    .select('id, resume_title, file_url, downloaded_at, user:profiles(full_name, email)', { count: 'estimated' })
    .order('downloaded_at', { ascending: false })
    .range(from, from + RESUME_PAGE_SIZE - 1);
  if (opts.q) query = query.ilike('resume_title', `%${opts.q}%`);
  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export async function getResumeAnalytics() {
  const supabase = createClient();
  const [scoreRows, created, tplRows, catRows, templates] = await Promise.all([
    safe(supabase.from('resumes_builder').select('ats_score'), [] as { ats_score: number }[]),
    safe(
      supabase.from('resumes_builder').select('created_at').gte('created_at', new Date(Date.now() - 89 * 86_400_000).toISOString()),
      [] as { created_at: string }[],
    ),
    safe(supabase.from('resumes_builder').select('template').limit(10000), [] as { template: string }[]),
    safe(supabase.from('resume_templates').select('id, category').limit(2000), [] as { id: string; category: string }[]),
    safe(supabase.from('resume_templates').select('id, name').limit(2000), [] as { id: string; name: string }[]),
  ]);

  const scores = scoreRows.map((r) => Number(r.ats_score) || 0);
  const bands = [
    { label: '0–40', value: 0 },
    { label: '40–60', value: 0 },
    { label: '60–80', value: 0 },
    { label: '80–100', value: 0 },
  ];
  for (const sc of scores) {
    if (sc < 40) bands[0].value += 1;
    else if (sc < 60) bands[1].value += 1;
    else if (sc < 80) bands[2].value += 1;
    else bands[3].value += 1;
  }

  // created over time (monthly)
  const monthly = new Map<string, number>();
  for (const r of created) {
    const k = String(r.created_at).slice(0, 7);
    monthly.set(k, (monthly.get(k) ?? 0) + 1);
  }
  const trend = [...monthly.entries()].sort().map(([label, count]) => ({ label, resumes: count }));

  const nameOf = new Map(templates.map((t) => [t.id, t.name]));
  const catOf = new Map(catRows.map((t) => [t.id, t.category]));
  const tplCounts = new Map<string, number>();
  const catCounts = new Map<string, number>();
  for (const r of tplRows) {
    tplCounts.set(r.template, (tplCounts.get(r.template) ?? 0) + 1);
    const c = catOf.get(r.template) ?? 'General';
    catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  }

  return {
    bands,
    trend,
    topTemplates: [...tplCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, value]) => ({ label: nameOf.get(id) ?? id, value })),
    topCategories: [...catCounts.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })),
  };
}

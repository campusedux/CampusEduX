import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';

export const PROJECT_PAGE_SIZE = 20;

export interface ProjectRow {
  id: string;
  title: string;
  category_id: string | null;
  category_name: string | null;
  price: number;
  rating: number;
  review_count: number;
  sales_count: number;
  is_premium: boolean;
  is_best_seller: boolean;
  is_featured: boolean;
  status: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export async function listProjects(opts: {
  page: number;
  q?: string;
  category?: string;
  status?: string;
  flag?: string; // 'premium' | 'best_seller' | 'featured'
  targeting?: string; // 'global' | 'course' | 'branch'
}): Promise<{ rows: ProjectRow[]; total: number; missing: boolean }> {
  const supabase = createClient();
  const from = (opts.page - 1) * PROJECT_PAGE_SIZE;

  let query = supabase
    .from('projects')
    .select(
      'id, title, category_id, category_name, price, rating, review_count, sales_count, is_premium, is_best_seller, is_featured, status, thumbnail_url, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + PROJECT_PAGE_SIZE - 1);

  if (opts.q) query = query.ilike('title', `%${opts.q}%`);
  if (opts.category) query = query.eq('category_id', opts.category);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.flag === 'premium') query = query.eq('is_premium', true);
  if (opts.flag === 'best_seller') query = query.eq('is_best_seller', true);
  if (opts.flag === 'featured') query = query.eq('is_featured', true);
  if (opts.targeting) query = query.eq('target_type', opts.targeting);

  const { data, count, error } = await query;
  return { rows: error ? [] : (data ?? []), total: error ? 0 : count ?? 0, missing: Boolean(error) };
}

export interface ProjectDetail extends ProjectRow {
  tech_stack: string[];
  description: string;
  images: string[];
  video_url: string | null;
  live_demo_url: string | null;
  source_code_size_mb: number;
  documentation_size_mb: number;
  platform_fee_percent: number;
  license: string;
  developer_name: string;
  github_url: string | null;
  featured_priority: number;
  best_seller_priority: number;
  view_count: number;
  updated_at: string;
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const supabase = createClient();
  const { data } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  return (data as ProjectDetail) ?? null;
}

export async function getProjectStats() {
  const supabase = createClient();
  const [total, published, premium, best, featured, sales] = await Promise.all([
    safeCount(supabase.from('projects').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'published')),
    safeCount(supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_premium', true)),
    safeCount(supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_best_seller', true)),
    safeCount(supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_featured', true)),
    safe(supabase.from('projects').select('sales_count, price'), [] as { sales_count: number; price: number }[]),
  ]);
  const totalSales = sales.reduce((s, p) => s + (Number(p.sales_count) || 0), 0);
  return { total, published, premium, best, featured, totalSales };
}

export async function getCategories() {
  const supabase = createClient();
  return safe(
    supabase.from('categories').select('id, name, icon, project_count, sort_order').order('sort_order'),
    [] as { id: string; name: string; icon: string; project_count: number; sort_order: number }[],
  );
}

export async function getTechnologies() {
  const supabase = createClient();
  return safe(
    supabase.from('technologies').select('id, name, slug, icon, category, status, sort_order').order('sort_order'),
    [] as { id: string; name: string; slug: string; icon: string; category: string; status: string; sort_order: number }[],
  );
}

export async function getProjectImages(projectId: string) {
  const supabase = createClient();
  return safe(
    supabase.from('project_images').select('id, url, sort_order').eq('project_id', projectId).order('sort_order'),
    [] as { id: string; url: string; sort_order: number }[],
  );
}

export async function getProjectFiles(projectId: string, category: 'main' | 'documentation') {
  const supabase = createClient();
  return safe(
    supabase
      .from('project_files')
      .select('id, label, file_name, size_mb, storage_path, sort_order')
      .eq('project_id', projectId)
      .eq('category', category)
      .order('sort_order'),
    [] as { id: string; label: string; file_name: string; size_mb: number; storage_path: string; sort_order: number }[],
  );
}

export async function getProjectVersions(projectId: string) {
  const supabase = createClient();
  return safe(
    supabase
      .from('project_versions')
      .select('id, version, is_latest, released_at, size_mb, changelog, sort_order')
      .eq('project_id', projectId)
      .order('released_at', { ascending: false }),
    [] as { id: string; version: string; is_latest: boolean; released_at: string; size_mb: number; changelog: string[]; sort_order: number }[],
  );
}

export function publicFileUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${base}/storage/v1/object/public/project-files/${storagePath}`;
}

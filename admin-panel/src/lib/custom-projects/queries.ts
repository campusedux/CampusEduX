import { createClient } from '@/lib/supabase/server';
import { safe, safeCount } from '@/lib/utils';
import {
  CUSTOM_PROJECTS_PAGE_SIZE,
  FEATURES_PAGE_SIZE,
  parseAmounts,
  type AddonStatus,
  type CustomProjectAmounts,
} from './constants';

const UPLOADS_BUCKET = 'custom-project-uploads';
const DELIVERIES_BUCKET = 'custom-project-deliveries';

export interface CustomRequestRow {
  id: string;
  request_code: string;
  title: string;
  project_type: string;
  project_level: string;
  platform: string;
  estimated_total: number;
  final_price: number | null;
  amount_paid: number;
  token_amount: number;
  token_payment_status: string;
  status: string;
  created_at: string;
  profile: { id: string; full_name: string | null; email: string | null; mobile_number: string | null } | null;
}

const LIST_SELECT =
  'id, request_code, title, project_type, project_level, platform, estimated_total, final_price, amount_paid, token_amount, ' +
  'token_payment_status, status, created_at, ' +
  'profile:profiles!custom_project_requests_user_id_fkey ( id, full_name, email, mobile_number )';

export async function listCustomRequests(opts: {
  page: number;
  q?: string;
  status?: string;
  type?: string;
}): Promise<{ rows: CustomRequestRow[]; total: number; missing: boolean; amounts: Record<string, CustomProjectAmounts> }> {
  const supabase = createClient();
  const from = (opts.page - 1) * CUSTOM_PROJECTS_PAGE_SIZE;

  let query = supabase
    .from('custom_project_requests')
    .select(LIST_SELECT, { count: 'exact' })
    .eq('token_payment_status', 'paid') // spec §16 — admin only sees paid requests
    .order('created_at', { ascending: false })
    .range(from, from + CUSTOM_PROJECTS_PAGE_SIZE - 1);

  if (opts.q) query = query.or(`title.ilike.%${opts.q}%,request_code.ilike.%${opts.q}%`);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.type) query = query.eq('project_type', opts.type);

  const { data, count, error } = await query;
  const rows = error ? [] : ((data ?? []) as unknown as CustomRequestRow[]);
  return {
    rows,
    total: error ? 0 : count ?? 0,
    missing: Boolean(error),
    amounts: await getAmountsFor(rows.map((r) => r.id)),
  };
}

/** Due/payment status for many requests in one call — the same DB calculation the apps use. */
export async function getAmountsFor(ids: string[]): Promise<Record<string, CustomProjectAmounts>> {
  if (ids.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase.rpc('custom_project_amounts_bulk', { p_request_ids: ids });
  const out: Record<string, CustomProjectAmounts> = {};
  if (error || !Array.isArray(data)) return out;
  for (const raw of data) {
    const a = parseAmounts(raw);
    if (a) out[a.requestId] = a;
  }
  return out;
}

export interface AddonRow {
  id: string;
  title: string;
  description: string;
  status: AddonStatus;
  price: number | null;
  created_at: string;
  updated_at: string;
}
export interface CreditRow {
  id: string;
  amount: number;
  kind: string;
  note: string;
  created_at: string;
}
export interface ChangeRow {
  id: string;
  addon_id: string | null;
  actor_role: string;
  entity: string;
  action: string;
  field: string | null;
  old_value: unknown;
  new_value: unknown;
  note: string | null;
  created_at: string;
}

export async function getCustomRequestStats() {
  const supabase = createClient();
  const paid = () =>
    supabase.from('custom_project_requests').select('id', { count: 'exact', head: true }).eq('token_payment_status', 'paid');

  const [total, inDev, testing, ready, delivered, amounts] = await Promise.all([
    safeCount(paid()),
    safeCount(paid().eq('status', 'in_development')),
    safeCount(paid().eq('status', 'testing')),
    safeCount(paid().eq('status', 'ready')),
    safeCount(paid().eq('status', 'delivered')),
    safe(
      supabase.from('custom_project_requests').select('token_amount, estimated_total').eq('token_payment_status', 'paid'),
      [] as { token_amount: number; estimated_total: number }[],
    ),
  ]);

  const tokenRevenue = amounts.reduce((s, r) => s + (Number(r.token_amount) || 0), 0);
  const estimatedPipeline = amounts.reduce((s, r) => s + (Number(r.estimated_total) || 0), 0);
  return { total, inDev, testing, ready, delivered, tokenRevenue, estimatedPipeline };
}

async function signedUrls(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  paths: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    paths.filter(Boolean).map(async (p) => {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(p, 60 * 60);
      if (data?.signedUrl) out[p] = data.signedUrl;
    }),
  );
  return out;
}

export async function getCustomRequest(id: string) {
  const supabase = createClient();

  const { data: request } = await supabase
    .from('custom_project_requests')
    .select(
      '*, profile:profiles!custom_project_requests_user_id_fkey ( id, full_name, email, mobile_number )',
    )
    .eq('id', id)
    .maybeSingle();
  if (!request) return null;

  const [features, files, history, deliveryRow, messages, amountsRes, addons, credits, changes] = await Promise.all([
    safe(
      supabase
        .from('custom_project_request_features')
        .select('feature_id, feature_name, feature_price, category, is_included')
        .eq('request_id', id),
      [] as {
        feature_id: string;
        feature_name: string;
        feature_price: number;
        category: string;
        is_included: boolean;
      }[],
    ),
    safe(
      supabase
        .from('custom_project_request_files')
        .select('id, label, file_name, size_mb, storage_path')
        .eq('request_id', id)
        .order('sort_order'),
      [] as { id: string; label: string; file_name: string; size_mb: number; storage_path: string }[],
    ),
    safe(
      supabase
        .from('custom_project_request_history')
        .select('id, old_status, new_status, changed_by_role, note, created_at, event, old_value, new_value')
        .eq('request_id', id)
        .order('created_at'),
      [] as {
        id: string;
        old_status: string | null;
        new_status: string;
        changed_by_role: string;
        note: string | null;
        created_at: string;
        event: 'status' | 'price' | 'payment';
        old_value: string | null;
        new_value: string | null;
      }[],
    ),
    supabase
      .from('custom_project_deliveries')
      .select('id, demo_url, notes, delivered_at')
      .eq('request_id', id)
      .maybeSingle()
      .then((r) => r.data),
    safe(
      supabase
        .from('custom_project_messages')
        .select('id, sender_role, body, created_at')
        .eq('request_id', id)
        .order('created_at'),
      [] as { id: string; sender_role: string; body: string; created_at: string }[],
    ),
    supabase.rpc('custom_project_amounts', { p_request_id: id }),
    safe(
      supabase
        .from('custom_project_addons')
        .select('id, title, description, status, price, created_at, updated_at')
        .eq('project_id', id)
        .order('created_at'),
      [] as AddonRow[],
    ),
    safe(
      supabase
        .from('custom_project_credits')
        .select('id, amount, kind, note, created_at')
        .eq('request_id', id)
        .order('created_at'),
      [] as CreditRow[],
    ),
    safe(
      supabase
        .from('custom_project_changes')
        .select('id, addon_id, actor_role, entity, action, field, old_value, new_value, note, created_at')
        .eq('request_id', id)
        .order('created_at', { ascending: false })
        .limit(200),
      [] as ChangeRow[],
    ),
  ]);
  const amounts = amountsRes.error ? null : parseAmounts(amountsRes.data);

  let delivery: {
    id: string;
    demo_url: string | null;
    notes: string;
    delivered_at: string | null;
    assets: { id: string; kind: string; label: string; storage_path: string; file_name: string; size_mb: number }[];
  } | null = null;
  if (deliveryRow) {
    const assets = await safe(
      supabase
        .from('custom_project_delivery_assets')
        .select('id, kind, label, storage_path, file_name, size_mb')
        .eq('delivery_id', deliveryRow.id)
        .order('sort_order'),
      [] as { id: string; kind: string; label: string; storage_path: string; file_name: string; size_mb: number }[],
    );
    delivery = { ...deliveryRow, assets };
  }

  const uploadPaths = [
    ...(request.project_image_path ? [request.project_image_path] : []),
    ...files.map((f) => f.storage_path),
  ];
  const deliveryPaths = (delivery?.assets ?? []).map((a) => a.storage_path);

  const [uploadUrls, deliveryUrls] = await Promise.all([
    signedUrls(supabase, UPLOADS_BUCKET, uploadPaths),
    signedUrls(supabase, DELIVERIES_BUCKET, deliveryPaths),
  ]);

  return {
    request,
    features,
    files,
    history,
    delivery,
    messages,
    uploadUrls,
    deliveryUrls,
    amounts,
    addons,
    credits,
    changes,
  };
}

// --- feature catalog (spec §1–§17) -----------------------------------

export interface FeatureRow {
  id: string;
  name: string;
  description: string;
  category: string;
  project_types: string[] | null;
  project_levels: string[] | null;
  level: string;
  price: number;
  icon: string | null;
  image_url: string | null;
  dependencies: string[] | null;
  /** "<type>:<level>" combos where this feature is included (free, read-only). */
  included_in_levels: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureListOpts {
  page?: number;
  q?: string;
  type?: string; // academic | personal | business  (§1 tabs / §2)
  category?: string; // matches custom_project_features.category (the human name)
  level?: string; // basic | standard | advanced | premium  (§5)
  active?: string; // 'active' | 'inactive'  (§2)
  priceMin?: number;
  priceMax?: number;
  sort?: string; // see FEATURE_SORT_OPTIONS
}

const FEATURE_SELECT =
  'id, name, description, category, project_types, project_levels, level, price, icon, image_url, ' +
  'dependencies, included_in_levels, is_active, sort_order, created_at, updated_at';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFeatureFilters(query: any, o: FeatureListOpts) {
  if (o.q) {
    // strip PostgREST `.or()` control chars so a stray comma/paren can't break the filter
    const term = o.q.replace(/[%,()]/g, ' ').trim();
    if (term) query = query.or(`name.ilike.%${term}%,id.ilike.%${term}%,category.ilike.%${term}%`);
  }
  if (o.type) query = query.contains('project_types', [o.type]);
  if (o.category) query = query.eq('category', o.category);
  if (o.level) query = query.eq('level', o.level);
  if (o.active === 'active') query = query.eq('is_active', true);
  else if (o.active === 'inactive') query = query.eq('is_active', false);
  if (typeof o.priceMin === 'number' && Number.isFinite(o.priceMin)) query = query.gte('price', o.priceMin);
  if (typeof o.priceMax === 'number' && Number.isFinite(o.priceMax)) query = query.lte('price', o.priceMax);
  return query;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFeatureSort(query: any, sort?: string) {
  switch (sort) {
    case 'price_asc':
      return query.order('price', { ascending: true }).order('name', { ascending: true });
    case 'price_desc':
      return query.order('price', { ascending: false }).order('name', { ascending: true });
    case 'name_asc':
      return query.order('name', { ascending: true });
    case 'recent':
      return query.order('created_at', { ascending: false });
    default:
      return query.order('sort_order', { ascending: true }).order('name', { ascending: true });
  }
}

/** Server-side filtered + sorted + paginated feature list (spec §16 / §17 / §22). */
export async function listFeatures(
  opts: FeatureListOpts = {},
): Promise<{ rows: FeatureRow[]; total: number; missing: boolean; page: number }> {
  const supabase = createClient();
  const page = Math.max(1, opts.page ?? 1);
  const from = (page - 1) * FEATURES_PAGE_SIZE;

  let query = supabase.from('custom_project_features').select(FEATURE_SELECT, { count: 'exact' });
  query = applyFeatureFilters(query, opts);
  query = applyFeatureSort(query, opts.sort);
  query = query.range(from, from + FEATURES_PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return {
    rows: error ? [] : ((data ?? []) as unknown as FeatureRow[]),
    total: error ? 0 : count ?? 0,
    missing: Boolean(error),
    page,
  };
}

/**
 * Summary + level counts (spec §10 / §11). Each facet ignores its own dimension
 * but honours every other active filter, so the cards track the current view.
 */
export async function getFeatureFacetCounts(opts: FeatureListOpts = {}) {
  const supabase = createClient();
  const head = () => supabase.from('custom_project_features').select('id', { count: 'exact', head: true });

  const omit = (drop: 'type' | 'level' | 'active') => {
    const o: FeatureListOpts = { ...opts };
    if (drop === 'type') o.type = undefined;
    if (drop === 'level') o.level = undefined;
    if (drop === 'active') o.active = undefined;
    return applyFeatureFilters(head(), o);
  };

  const [
    academic,
    personal,
    business,
    activeCount,
    inactiveCount,
    total,
    basic,
    standard,
    advanced,
    premium,
  ] = await Promise.all([
    safeCount(omit('type').contains('project_types', ['academic'])),
    safeCount(omit('type').contains('project_types', ['personal'])),
    safeCount(omit('type').contains('project_types', ['business'])),
    safeCount(omit('active').eq('is_active', true)),
    safeCount(omit('active').eq('is_active', false)),
    safeCount(omit('active')),
    safeCount(omit('level').eq('level', 'basic')),
    safeCount(omit('level').eq('level', 'standard')),
    safeCount(omit('level').eq('level', 'advanced')),
    safeCount(omit('level').eq('level', 'premium')),
  ]);

  return {
    types: { academic, personal, business },
    status: { active: activeCount, inactive: inactiveCount, total },
    levels: { basic, standard, advanced, premium },
  };
}

export interface FeatureCategoryRow {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** The managed category vocabulary (spec §3 / §15). */
export async function listFeatureCategories(
  opts: { activeOnly?: boolean } = {},
): Promise<{ rows: FeatureCategoryRow[]; missing: boolean }> {
  const supabase = createClient();
  let query = supabase
    .from('custom_project_feature_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (opts.activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  return { rows: error ? [] : ((data ?? []) as FeatureCategoryRow[]), missing: Boolean(error) };
}

/** Categories + how many features use each (by name) — powers the manager's "unused" gate (§15). */
export async function getFeatureCategoriesWithCounts() {
  const supabase = createClient();
  const [{ rows }, used] = await Promise.all([
    listFeatureCategories(),
    safe(
      supabase.from('custom_project_features').select('category'),
      [] as { category: string }[],
    ),
  ]);
  const byName = new Map<string, number>();
  for (const r of used) byName.set(r.category, (byName.get(r.category) ?? 0) + 1);
  return rows.map((c) => ({ ...c, feature_count: byName.get(c.name) ?? 0 }));
}

/** Lightweight id/name list for the dependency picker + bulk pickers (§14). */
export async function listFeatureOptions(excludeId?: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('custom_project_features')
    .select('id, name, category, project_types, level')
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  const rows = (error ? [] : (data ?? [])) as {
    id: string;
    name: string;
    category: string;
    project_types: string[] | null;
    level: string;
  }[];
  return excludeId ? rows.filter((r) => r.id !== excludeId) : rows;
}

export async function getFeature(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('custom_project_features').select('*').eq('id', id).maybeSingle();
  return data as (FeatureRow & Record<string, unknown>) | null;
}

export async function featureKeyExists(id: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.from('custom_project_features').select('id').eq('id', id).maybeSingle();
  return Boolean(data);
}

// --- pricing ---------------------------------------------------------

export async function getPricingConfig() {
  const supabase = createClient();
  const [pricing, platforms] = await Promise.all([
    safe(
      supabase.from('custom_project_pricing').select('*').order('project_type').order('project_level'),
      [] as { project_type: string; project_level: string; base_price: number; token_amount: number; is_active: boolean }[],
    ),
    safe(
      supabase.from('custom_project_platform_pricing').select('*').order('sort_order'),
      [] as { platform: string; label: string; charge: number; is_active: boolean }[],
    ),
  ]);
  return { pricing, platforms };
}

// --- admin inbox (spec §32) -----------------------------------------

export async function getAdminInbox(limit = 8) {
  const supabase = createClient();
  const [unread, recent] = await Promise.all([
    safeCount(
      supabase.from('custom_project_admin_inbox').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ),
    safe(
      supabase
        .from('custom_project_admin_inbox')
        .select('id, request_id, title, body, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      [] as { id: string; request_id: string | null; title: string; body: string; is_read: boolean; created_at: string }[],
    ),
  ]);
  return { unread, recent };
}

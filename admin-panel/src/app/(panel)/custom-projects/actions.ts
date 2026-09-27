'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { urlFieldError } from '@/lib/safeUrl';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import type { UploadedFile } from '@/components/ui/UploadDropzone';
import { FEATURE_LEVELS, INCLUDED_KEYS } from '@/lib/custom-projects/constants';

type Result = { ok: boolean; error?: string };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string) => Number(str(fd, k) || 0);

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

// --- request lifecycle ------------------------------------------------

export async function setRequestStatus(id: string, newStatus: string, note: string): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.rpc('custom_project_set_status', {
    p_request_id: id,
    p_new_status: newStatus,
    p_note: note || null,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: `custom_project.status.${newStatus}`,
    module: 'custom_projects',
    resourceType: 'custom_project_requests',
    resourceId: id,
  });
  revalidatePath(`/custom-projects/${id}`);
  revalidatePath('/custom-projects');
  return { ok: true };
}

// Bug 3: admin-set final price. The RPC (migration 0124 / 096) itself re-checks
// permission, refuses below amount_paid, refuses once the balance is fully paid,
// refuses while a balance checkout is open, and writes its own history row — this
// action only surfaces its error message and revalidates the page.
export async function setFinalPrice(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const raw = String(fd.get('final_price') ?? '').trim();
  const value = Number(raw);
  if (!raw || !Number.isFinite(value)) return { ok: false, error: 'Enter a valid amount.' };
  const supabase = createClient();
  const { error } = await supabase.rpc('admin_set_custom_project_final_price', {
    p_request_id: id,
    p_final_price: value,
    p_note: String(fd.get('note') ?? '').trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_project.final_price.set',
    module: 'custom_projects',
    resourceType: 'custom_project_requests',
    resourceId: id,
    details: { final_price: value },
  });
  revalidatePath(`/custom-projects/${id}`);
  return { ok: true };
}

export async function saveRequestAdminNotes(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('custom_project_requests')
    .update({ admin_notes: str(fd, 'admin_notes') || null })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_project.notes.save',
    module: 'custom_projects',
    resourceType: 'custom_project_requests',
    resourceId: id,
  });
  revalidatePath(`/custom-projects/${id}`);
  return { ok: true };
}

export async function replyToRequest(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const body = str(fd, 'body');
  if (!body) return { ok: false, error: 'Message is empty.' };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('custom_project_messages').insert({
    request_id: id,
    sender_id: user?.id ?? null,
    sender_role: 'admin',
    body,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_project.message.reply',
    module: 'custom_projects',
    resourceType: 'custom_project_messages',
    resourceId: id,
  });
  revalidatePath(`/custom-projects/${id}`);
  return { ok: true };
}

export async function markInboxRead(inboxId: string): Promise<Result> {
  await requirePermission('custom_projects', 'view');
  const supabase = createClient();
  const { error } = await supabase
    .from('custom_project_admin_inbox')
    .update({ is_read: true })
    .eq('id', inboxId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/custom-projects');
  return { ok: true };
}

// --- delivery (spec §31) --------------------------------------------

export async function saveDelivery(requestId: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const urlErr = urlFieldError(fd, { demo_url: 'Demo URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const { error } = await supabase
    .from('custom_project_deliveries')
    .upsert(
      { request_id: requestId, demo_url: str(fd, 'demo_url') || null, notes: str(fd, 'notes') },
      { onConflict: 'request_id' },
    );
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_project.delivery.save',
    module: 'custom_projects',
    resourceType: 'custom_project_deliveries',
    resourceId: requestId,
  });
  revalidatePath(`/custom-projects/${requestId}/delivery`);
  revalidatePath(`/custom-projects/${requestId}`);
  return { ok: true };
}

export async function addDeliveryAssets(
  requestId: string,
  kind: string,
  label: string,
  files: UploadedFile[],
): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  if (!files.length) return { ok: false, error: 'No file uploaded.' };
  const supabase = createClient();

  // ensure a delivery row exists
  const { data: delivery, error: dErr } = await supabase
    .from('custom_project_deliveries')
    .upsert({ request_id: requestId }, { onConflict: 'request_id' })
    .select('id')
    .single();
  if (dErr) return { ok: false, error: dErr.message };

  const { data: existing } = await supabase
    .from('custom_project_delivery_assets')
    .select('sort_order')
    .eq('delivery_id', delivery.id)
    .order('sort_order', { ascending: false })
    .limit(1);
  let next = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = files.map((f) => ({
    delivery_id: delivery.id,
    kind,
    label: label || f.name,
    storage_path: f.path,
    file_name: f.name,
    size_mb: Math.round((f.size / (1024 * 1024)) * 100) / 100,
    sort_order: next++,
  }));
  const { error } = await supabase.from('custom_project_delivery_assets').insert(rows);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_project.delivery.asset.add',
    module: 'custom_projects',
    resourceType: 'custom_project_delivery_assets',
    resourceId: requestId,
    details: { kind, count: files.length },
  });
  revalidatePath(`/custom-projects/${requestId}/delivery`);
  return { ok: true };
}

export async function removeDeliveryAsset(
  requestId: string,
  assetId: string,
  storagePath: string,
): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('custom_project_delivery_assets').delete().eq('id', assetId);
  if (error) return { ok: false, error: error.message };
  if (storagePath) {
    await supabase.storage.from('custom-project-deliveries').remove([storagePath]);
  }
  revalidatePath(`/custom-projects/${requestId}/delivery`);
  return { ok: true };
}

// --- feature catalog (spec §4 – §15) -------------------------------

function targetArray(fd: FormData, key: string, allowed: readonly string[]): string[] {
  return fd
    .getAll(key)
    .map(String)
    .filter((v, i, a) => allowed.includes(v) && a.indexOf(v) === i);
}
const TYPES = ['academic', 'personal', 'business'] as const;
const LEVELS = ['standard', 'advanced'] as const; // project tier the builder filters on

/** Shared field parser + validator for create/update (spec §5). */
function parseFeatureForm(fd: FormData):
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string } {
  const name = str(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };

  const category = str(fd, 'category');
  if (!category) return { ok: false, error: 'Category is required.' };

  const urlErr = urlFieldError(fd, { image_url: 'Image URL' });
  if (urlErr) return { ok: false, error: urlErr };

  const project_types = targetArray(fd, 'project_types', TYPES);
  if (project_types.length === 0) return { ok: false, error: 'Pick at least one project type.' };

  const level = str(fd, 'level') || 'standard';
  if (!(FEATURE_LEVELS as readonly string[]).includes(level)) {
    return { ok: false, error: 'Choose a feature level.' };
  }

  const price = num(fd, 'price');
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'Price cannot be negative.' };

  const project_levels = targetArray(fd, 'project_levels', LEVELS);
  const offeredLevels = project_levels.length ? project_levels : [...LEVELS];

  const included_in_levels = targetArray(fd, 'included_in_levels', INCLUDED_KEYS);
  for (const key of included_in_levels) {
    const [t, l] = key.split(':');
    if (!project_types.includes(t) || !offeredLevels.includes(l)) {
      return { ok: false, error: `Included for ${key} but the feature is not offered for that type and level.` };
    }
    // Advanced must never include less than Standard.
    if (l === 'standard' && !included_in_levels.includes(`${t}:advanced`)) {
      return { ok: false, error: `Included in ${t} Standard must also be included in ${t} Advanced.` };
    }
  }
  const dependencies = fd
    .getAll('dependencies')
    .map(String)
    .filter((v, i, a) => v && a.indexOf(v) === i);

  return {
    ok: true,
    row: {
      name,
      description: str(fd, 'description'),
      category,
      project_types,
      // never store an empty tier array — that would hide the feature everywhere
      project_levels: project_levels.length ? project_levels : ['standard', 'advanced'],
      included_in_levels,
      level,
      price,
      icon: str(fd, 'icon') || null,
      image_url: str(fd, 'image_url') || null,
      dependencies,
      is_active: fd.get('is_active') === 'on',
      sort_order: num(fd, 'sort_order'),
    },
  };
}

/** Remove ids that no longer exist from every other feature's `dependencies` (spec §14). */
async function pruneDanglingDependencies(
  supabase: ReturnType<typeof createClient>,
  removed: string[],
): Promise<void> {
  if (removed.length === 0) return;
  const { data } = await supabase
    .from('custom_project_features')
    .select('id, dependencies')
    .overlaps('dependencies', removed);
  for (const row of (data ?? []) as { id: string; dependencies: string[] | null }[]) {
    const next = (row.dependencies ?? []).filter((d) => !removed.includes(d));
    await supabase.from('custom_project_features').update({ dependencies: next }).eq('id', row.id);
  }
}

export async function createFeature(_prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'add');
  const parsed = parseFeatureForm(fd);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const supabase = createClient();
  const typedKey = slugify(str(fd, 'key'));
  const id = typedKey || `${slugify(parsed.row.name as string)}-${Math.random().toString(36).slice(2, 6)}`;
  if (!id) return { ok: false, error: 'Feature key is invalid — use letters, numbers and dashes.' };

  const { data: clash } = await supabase
    .from('custom_project_features')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (clash) return { ok: false, error: `Feature key "${id}" is already taken — choose another.` };

  const { error } = await supabase.from('custom_project_features').insert({ id, ...parsed.row });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_feature.create',
    module: 'custom_projects',
    resourceType: 'custom_project_features',
    resourceId: id,
  });
  revalidatePath('/custom-projects/features');
  redirect('/custom-projects/features?saved=1');
}

export async function updateFeature(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const parsed = parseFeatureForm(fd);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const supabase = createClient();
  // the key (id) is the primary key + the value frozen into request snapshots — never rewritten
  const { error } = await supabase.from('custom_project_features').update(parsed.row).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_feature.update',
    module: 'custom_projects',
    resourceType: 'custom_project_features',
    resourceId: id,
  });
  revalidatePath('/custom-projects/features');
  redirect('/custom-projects/features?saved=1');
}

export async function toggleFeatureActive(id: string, value: boolean): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('custom_project_features').update({ is_active: value }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: `custom_feature.${value ? 'activate' : 'deactivate'}`,
    module: 'custom_projects',
    resourceType: 'custom_project_features',
    resourceId: id,
  });
  revalidatePath('/custom-projects/features');
  return { ok: true };
}

export async function deleteFeature(id: string): Promise<Result> {
  await requirePermission('custom_projects', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('custom_project_features').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await pruneDanglingDependencies(supabase, [id]);
  await logActivity({
    action: 'custom_feature.delete',
    module: 'custom_projects',
    resourceType: 'custom_project_features',
    resourceId: id,
  });
  revalidatePath('/custom-projects/features');
  return { ok: true };
}

/** Clone a feature so the admin can tweak name / types / category / level / price (spec §8). */
export async function duplicateFeature(id: string): Promise<Result> {
  await requirePermission('custom_projects', 'add');
  const supabase = createClient();
  const { data: src } = await supabase
    .from('custom_project_features')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!src) return { ok: false, error: 'Feature not found.' };

  const base = slugify(String(src.name)).slice(0, 40) || 'feature';
  const newId = `${base}-copy-${Math.random().toString(36).slice(2, 6)}`;
  const { error } = await supabase.from('custom_project_features').insert({
    id: newId,
    name: `${src.name} (copy)`,
    description: src.description ?? '',
    category: src.category ?? 'General',
    project_types: src.project_types ?? ['academic', 'personal', 'business'],
    project_levels: src.project_levels ?? ['standard', 'advanced'],
    level: src.level ?? 'standard',
    price: Number(src.price) || 0,
    icon: src.icon ?? null,
    image_url: src.image_url ?? null,
    dependencies: src.dependencies ?? [],
    is_active: false, // a copy starts inactive so it can't reach the builder before it's adjusted
    sort_order: Number(src.sort_order) || 0,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_feature.duplicate',
    module: 'custom_projects',
    resourceType: 'custom_project_features',
    resourceId: newId,
    details: { from: id },
  });
  revalidatePath('/custom-projects/features');
  return { ok: true };
}

export type FeatureBulkAction =
  | 'activate'
  | 'deactivate'
  | 'delete'
  | 'set_category'
  | 'set_level'
  | 'assign_types';

/** Apply one action to many selected features (spec §9). */
export async function bulkUpdateFeatures(input: {
  action: FeatureBulkAction;
  ids: string[];
  category?: string;
  level?: string;
  types?: string[];
}): Promise<Result> {
  await requirePermission('custom_projects', input.action === 'delete' ? 'delete' : 'edit');
  const ids = (input.ids ?? []).filter(Boolean);
  if (ids.length === 0) return { ok: false, error: 'No features selected.' };

  const supabase = createClient();
  let patch: Record<string, unknown> | null = null;

  switch (input.action) {
    case 'activate':
      patch = { is_active: true };
      break;
    case 'deactivate':
      patch = { is_active: false };
      break;
    case 'set_category': {
      const category = (input.category ?? '').trim();
      if (!category) return { ok: false, error: 'Pick a category first.' };
      patch = { category };
      break;
    }
    case 'set_level': {
      const level = input.level ?? '';
      if (!(FEATURE_LEVELS as readonly string[]).includes(level)) {
        return { ok: false, error: 'Pick a level first.' };
      }
      patch = { level };
      break;
    }
    case 'assign_types': {
      const types = (input.types ?? []).filter((t) => (TYPES as readonly string[]).includes(t));
      if (types.length === 0) return { ok: false, error: 'Pick at least one project type.' };
      patch = { project_types: types };
      break;
    }
    case 'delete': {
      const { error } = await supabase.from('custom_project_features').delete().in('id', ids);
      if (error) return { ok: false, error: error.message };
      await pruneDanglingDependencies(supabase, ids);
      await logActivity({
        action: 'custom_feature.bulk.delete',
        module: 'custom_projects',
        resourceType: 'custom_project_features',
        details: { count: ids.length },
      });
      revalidatePath('/custom-projects/features');
      return { ok: true };
    }
  }

  const { error } = await supabase.from('custom_project_features').update(patch).in('id', ids);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: `custom_feature.bulk.${input.action}`,
    module: 'custom_projects',
    resourceType: 'custom_project_features',
    details: { count: ids.length, ...patch },
  });
  revalidatePath('/custom-projects/features');
  return { ok: true };
}

// --- feature categories (spec §3 / §15) --------------------------

export async function createFeatureCategory(_prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'add');
  const name = str(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const id = slugify(str(fd, 'id') || name);
  if (!id) return { ok: false, error: 'Category id is invalid.' };
  const supabase = createClient();
  const { error } = await supabase.from('custom_project_feature_categories').insert({
    id,
    name,
    description: str(fd, 'description'),
    icon: str(fd, 'icon') || null,
    sort_order: num(fd, 'sort_order'),
    is_active: true,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_feature_category.create',
    module: 'custom_projects',
    resourceType: 'custom_project_feature_categories',
    resourceId: id,
  });
  revalidatePath('/custom-projects/features/categories');
  revalidatePath('/custom-projects/features');
  return { ok: true };
}

export async function updateFeatureCategory(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const name = str(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const supabase = createClient();

  // keep every feature that referenced the old name pointing at the new one
  const { data: current } = await supabase
    .from('custom_project_feature_categories')
    .select('name')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('custom_project_feature_categories')
    .update({
      name,
      description: str(fd, 'description'),
      icon: str(fd, 'icon') || null,
      sort_order: num(fd, 'sort_order'),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  const oldName = current?.name;
  if (oldName && oldName !== name) {
    await supabase
      .from('custom_project_features')
      .update({ category: name })
      .eq('category', oldName);
  }

  await logActivity({
    action: 'custom_feature_category.update',
    module: 'custom_projects',
    resourceType: 'custom_project_feature_categories',
    resourceId: id,
  });
  revalidatePath('/custom-projects/features/categories');
  revalidatePath('/custom-projects/features');
  return { ok: true };
}

export async function toggleFeatureCategoryActive(id: string, value: boolean): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('custom_project_feature_categories')
    .update({ is_active: value })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/custom-projects/features/categories');
  return { ok: true };
}

export async function deleteFeatureCategory(id: string): Promise<Result> {
  await requirePermission('custom_projects', 'delete');
  const supabase = createClient();
  const { data: cat } = await supabase
    .from('custom_project_feature_categories')
    .select('name')
    .eq('id', id)
    .maybeSingle();
  if (cat?.name) {
    const { count } = await supabase
      .from('custom_project_features')
      .select('id', { count: 'exact', head: true })
      .eq('category', cat.name);
    if ((count ?? 0) > 0) {
      return { ok: false, error: `${count} feature(s) still use this category.` };
    }
  }
  const { error } = await supabase.from('custom_project_feature_categories').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_feature_category.delete',
    module: 'custom_projects',
    resourceType: 'custom_project_feature_categories',
    resourceId: id,
  });
  revalidatePath('/custom-projects/features/categories');
  return { ok: true };
}

// --- pricing (spec §24 / §2 — token stays per type) ---------------

export async function updatePricingRow(
  projectType: string,
  projectLevel: string,
  _prev: Result,
  fd: FormData,
): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('custom_project_pricing')
    .update({
      base_price: num(fd, 'base_price'),
      token_amount: num(fd, 'token_amount'),
      pricing_version: num(fd, 'pricing_version') || 1,
      is_active: fd.get('is_active') === 'on',
    })
    .eq('project_type', projectType)
    .eq('project_level', projectLevel);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_pricing.update',
    module: 'custom_projects',
    resourceType: 'custom_project_pricing',
    resourceId: `${projectType}/${projectLevel}`,
  });
  revalidatePath('/custom-projects/pricing');
  return { ok: true };
}

export async function updatePlatformCharge(platform: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('custom_projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('custom_project_platform_pricing')
    .update({ charge: num(fd, 'charge'), is_active: fd.get('is_active') === 'on' })
    .eq('platform', platform);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    action: 'custom_platform_pricing.update',
    module: 'custom_projects',
    resourceType: 'custom_project_platform_pricing',
    resourceId: platform,
  });
  revalidatePath('/custom-projects/pricing');
  return { ok: true };
}

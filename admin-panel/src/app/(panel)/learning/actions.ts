'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { urlFieldError } from '@/lib/safeUrl';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { isValidSlug, slugify, GRID_TYPES, parseTags } from '@/lib/learning/constants';
import type { LearningStatus, GridType } from '@/lib/learning/constants';
import { resolveLearningTargeting } from '@/lib/learning/targeting';
import type { SiteSync } from '@/lib/learning/siteRevalidate';
import { gridSlugById, syncGridStructure, syncGridStructureById, syncTopicByPath } from '@/lib/learning/siteSync';

// The unified Learning CMS runs under its own `learning` permission module
// (migration 0045/022 seeds `role_permissions`). RLS `*_admin_all` (is_admin)
// on every learning_* / practice table is the authoritative backstop.
const MODULE = 'learning' as const;

type Result = { ok: boolean; error?: string } & SiteSync;
type IdResult = Result & { id?: string };

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';
const intOrNull = (fd: FormData, k: string) => {
  const raw = s(fd, k);
  if (!raw) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : null;
};

async function actorId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function resolveSlug(fd: FormData, fromField: string): { ok: true; slug: string } | { ok: false; error: string } {
  const raw = s(fd, 'slug');
  const slug = raw ? slugify(raw) : slugify(s(fd, fromField));
  if (!slug) return { ok: false, error: 'Could not derive a URL slug — set one explicitly.' };
  if (!isValidSlug(slug)) return { ok: false, error: 'Slug must be lower-case letters, numbers and single hyphens.' };
  return { ok: true, slug };
}

function status(fd: FormData): LearningStatus {
  const v = s(fd, 'status');
  return v === 'published' || v === 'archived' ? v : 'draft';
}

/** Friendlier text for the common Postgres errors these actions can hit. */
function pgError(message: string): string {
  if (/duplicate key|unique constraint/i.test(message)) return 'That slug is already used here — pick another.';
  if (/violates foreign key/i.test(message) && /still referenced/i.test(message))
    return 'This item still has child items. Archive or remove them first.';
  if (/slug_format/i.test(message)) return 'Slug must be lower-case letters, numbers and single hyphens.';
  if (/targeting:/i.test(message)) return message.replace(/^.*?targeting:/i, 'Targeting:').trim();
  return message;
}

async function nextSortOrder(table: string, col: string, val: string | null): Promise<number> {
  const supabase = createClient();
  let q = supabase.from(table).select('sort_order').order('sort_order', { ascending: false }).limit(1);
  q = val === null ? q.is(col, null) : q.eq(col, val);
  const { data } = await q.maybeSingle();
  return ((data?.sort_order as number | undefined) ?? -1) + 1;
}

/** Swap a row with its previous / next sibling (scoped by a parent column). */
async function moveRow(table: string, id: string, parentCol: string, dir: 'up' | 'down'): Promise<Result> {
  const supabase = createClient();
  const { data: row } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (!row) return { ok: false, error: 'Item not found.' };
  const parentVal = (row as Record<string, unknown>)[parentCol] as string | null;

  let sq = supabase
    .from(table)
    .select('id, sort_order')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  sq = parentVal === null ? sq.is(parentCol, null) : sq.eq(parentCol, parentVal);
  const { data: siblings } = await sq;
  const list = (siblings ?? []) as { id: string; sort_order: number }[];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return { ok: false, error: 'Item not found.' };
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= list.length) return { ok: true };

  const reordered = [...list];
  [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
  const writes = reordered
    .map((r, i) => ({ id: r.id, i }))
    .filter(({ id: rid, i }) => list.find((x) => x.id === rid)!.sort_order !== i || i === idx || i === swapIdx);
  for (const w of writes) {
    const { error } = await supabase.from(table).update({ sort_order: w.i }).eq('id', w.id);
    if (error) return { ok: false, error: pgError(error.message) };
  }
  return { ok: true };
}

// ===========================================================================
// GRIDS
// ===========================================================================
function gridBase(fd: FormData) {
  return {
    name: s(fd, 'name'),
    description: s(fd, 'description'),
    icon: s(fd, 'icon') || null,
    icon_url: s(fd, 'icon_url') || null,
    cover_image_url: s(fd, 'cover_image_url') || null,
    accent_color: s(fd, 'accent_color') || null,
    status: status(fd),
    show_on_website: bool(fd, 'show_on_website'),
    show_on_mobile: bool(fd, 'show_on_mobile'),
    is_featured: bool(fd, 'is_featured'),
    is_premium: bool(fd, 'is_premium'),
  };
}
function gridType(fd: FormData): GridType {
  const v = s(fd, 'grid_type') as GridType;
  return (GRID_TYPES as readonly string[]).includes(v) ? v : 'content';
}

export async function createGrid(_p: IdResult, fd: FormData): Promise<IdResult> {
  await requirePermission(MODULE, 'add');
  const urlErr = urlFieldError(fd, { icon_url: 'Icon URL', cover_image_url: 'Cover image URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const base = gridBase(fd);
  if (!base.name) return { ok: false, error: 'Grid name is required.' };
  const slug = resolveSlug(fd, 'name');
  if (!slug.ok) return slug;
  const uid = await actorId();
  const { data, error } = await supabase
    .from('learning_grids')
    .insert({
      ...base,
      ...(await resolveLearningTargeting(fd)),
      grid_type: gridType(fd),
      slug: slug.slug,
      sort_order: await nextSortOrder('learning_grids', 'status', base.status).catch(() => 0),
      created_by: uid,
      updated_by: uid,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.grid.create', module: MODULE, resourceType: 'learning_grids', resourceId: data.id });
  revalidatePath('/learning');
  return { ok: true, id: data.id, ...(await syncGridStructure([slug.slug])) };
}

export async function updateGrid(id: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const urlErr = urlFieldError(fd, { icon_url: 'Icon URL', cover_image_url: 'Cover image URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const base = gridBase(fd);
  if (!base.name) return { ok: false, error: 'Grid name is required.' };
  const slug = resolveSlug(fd, 'name');
  if (!slug.ok) return slug;

  const before = await gridSlugById(id);
  const { error } = await supabase
    .from('learning_grids')
    .update({
      ...base,
      ...(await resolveLearningTargeting(fd)),
      grid_type: gridType(fd),
      slug: slug.slug,
      updated_by: await actorId(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.grid.update', module: MODULE, resourceType: 'learning_grids', resourceId: id });
  revalidatePath('/learning');
  revalidatePath(`/learning/grids/${id}`);
  return { ok: true, ...(await syncGridStructure([before, slug.slug])) };
}

export async function deleteGrid(id: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { count } = await supabase.from('learning_sections').select('id', { count: 'exact', head: true }).eq('grid_id', id);
  const { count: tcount } = await supabase.from('learning_topics').select('id', { count: 'exact', head: true }).eq('grid_id', id);
  if ((count ?? 0) > 0 || (tcount ?? 0) > 0) {
    return { ok: false, error: 'This grid still has sections or topics. Archive the grid, or remove them first.' };
  }
  const before = await gridSlugById(id);
  const { error } = await supabase.from('learning_grids').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.grid.delete', module: MODULE, resourceType: 'learning_grids', resourceId: id });
  revalidatePath('/learning');
  return { ok: true, ...(await syncGridStructure([before])) };
}

export async function setGridField(
  id: string,
  field: 'status' | 'show_on_website' | 'show_on_mobile' | 'is_featured' | 'is_premium',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('learning_grids')
    .update({ [field]: value, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.grid.${field}`, module: MODULE, resourceType: 'learning_grids', resourceId: id });
  revalidatePath('/learning');
  return { ok: true, ...(await syncGridStructureById(id)) };
}

export async function reorderGrid(id: string, dir: 'up' | 'down'): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const r = await moveRow('learning_grids', id, 'status', dir);
  revalidatePath('/learning');
  return r.ok ? { ...r, ...(await syncGridStructure([])) } : r;
}

// ===========================================================================
// SECTIONS
// ===========================================================================
function sectionPayload(fd: FormData) {
  return {
    name: s(fd, 'name'),
    description: s(fd, 'description'),
    status: status(fd),
    show_on_website: bool(fd, 'show_on_website'),
    show_on_mobile: bool(fd, 'show_on_mobile'),
  };
}

export async function createSection(gridId: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'add');
  const supabase = createClient();
  const payload = sectionPayload(fd);
  if (!payload.name) return { ok: false, error: 'Section name is required.' };
  const slug = resolveSlug(fd, 'name');
  if (!slug.ok) return slug;
  const uid = await actorId();
  const { error } = await supabase.from('learning_sections').insert({
    ...payload,
    grid_id: gridId,
    slug: slug.slug,
    sort_order: await nextSortOrder('learning_sections', 'grid_id', gridId),
    created_by: uid,
    updated_by: uid,
  });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.section.create', module: MODULE, resourceType: 'learning_sections' });
  revalidatePath(`/learning/grids/${gridId}`);
  return { ok: true, ...(await syncGridStructureById(gridId)) };
}

export async function updateSection(id: string, gridId: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const payload = sectionPayload(fd);
  if (!payload.name) return { ok: false, error: 'Section name is required.' };
  const slug = resolveSlug(fd, 'name');
  if (!slug.ok) return slug;
  const { error } = await supabase
    .from('learning_sections')
    .update({ ...payload, slug: slug.slug, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.section.update', module: MODULE, resourceType: 'learning_sections', resourceId: id });
  revalidatePath(`/learning/grids/${gridId}`);
  revalidatePath(`/learning/grids/${gridId}/sections/${id}`);
  return { ok: true, ...(await syncGridStructureById(gridId)) };
}

export async function deleteSection(id: string, gridId: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { count } = await supabase.from('learning_topics').select('id', { count: 'exact', head: true }).eq('section_id', id);
  if ((count ?? 0) > 0) {
    return { ok: false, error: 'This section still has topics. Archive the section, or delete its topics first.' };
  }
  const { error } = await supabase.from('learning_sections').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.section.delete', module: MODULE, resourceType: 'learning_sections', resourceId: id });
  revalidatePath(`/learning/grids/${gridId}`);
  return { ok: true, ...(await syncGridStructureById(gridId)) };
}

export async function setSectionField(
  id: string,
  gridId: string,
  field: 'status' | 'show_on_website' | 'show_on_mobile',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('learning_sections')
    .update({ [field]: value, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.section.${field}`, module: MODULE, resourceType: 'learning_sections', resourceId: id });
  revalidatePath(`/learning/grids/${gridId}`);
  return { ok: true, ...(await syncGridStructureById(gridId)) };
}

export async function reorderSection(id: string, gridId: string, dir: 'up' | 'down'): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const r = await moveRow('learning_sections', id, 'grid_id', dir);
  revalidatePath(`/learning/grids/${gridId}`);
  return r.ok ? { ...r, ...(await syncGridStructureById(gridId)) } : r;
}

// ===========================================================================
// TOPICS
// ===========================================================================
async function topicPayload(fd: FormData) {
  return {
    title: s(fd, 'title'),
    short_description: s(fd, 'short_description'),
    icon: s(fd, 'icon') || null,
    icon_url: s(fd, 'icon_url') || null,
    company_id: s(fd, 'company_id') || null,
    is_premium: bool(fd, 'is_premium'),
    status: status(fd),
    show_on_website: bool(fd, 'show_on_website'),
    show_on_mobile: bool(fd, 'show_on_mobile'),
    ...(await resolveLearningTargeting(fd)),
  };
}

/** Create a topic inside a section (Grid → Section → Topic → Content). */
export async function createTopic(sectionId: string, gridId: string, _p: IdResult, fd: FormData): Promise<IdResult> {
  await requirePermission(MODULE, 'add');
  const urlErr = urlFieldError(fd, { icon_url: 'Icon URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const payload = await topicPayload(fd);
  if (!payload.title) return { ok: false, error: 'Topic title is required.' };
  const slug = resolveSlug(fd, 'title');
  if (!slug.ok) return slug;
  const uid = await actorId();
  const { data, error } = await supabase
    .from('learning_topics')
    .insert({
      ...payload,
      section_id: sectionId,
      slug: slug.slug,
      sort_order: await nextSortOrder('learning_topics', 'section_id', sectionId),
      created_by: uid,
      updated_by: uid,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.topic.create', module: MODULE, resourceType: 'learning_topics', resourceId: data.id });
  revalidatePath(`/learning/grids/${gridId}/sections/${sectionId}`);
  return { ok: true, id: data.id, ...(await syncGridStructureById(gridId)) };
}

/** Create a topic directly under a grid (Grid → Topic → Content — used by the
 *  company-type grids and any admin who skips sections). */
export async function createGridTopic(gridId: string, _p: IdResult, fd: FormData): Promise<IdResult> {
  await requirePermission(MODULE, 'add');
  const urlErr = urlFieldError(fd, { icon_url: 'Icon URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const payload = await topicPayload(fd);
  if (!payload.title) return { ok: false, error: 'Topic title is required.' };
  const slug = resolveSlug(fd, 'title');
  if (!slug.ok) return slug;
  const uid = await actorId();
  const { data, error } = await supabase
    .from('learning_topics')
    .insert({
      ...payload,
      section_id: null,
      grid_id: gridId,
      slug: slug.slug,
      sort_order: await nextSortOrder('learning_topics', 'grid_id', gridId),
      created_by: uid,
      updated_by: uid,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.topic.create', module: MODULE, resourceType: 'learning_topics', resourceId: data.id });
  revalidatePath(`/learning/grids/${gridId}`);
  return { ok: true, id: data.id, ...(await syncGridStructureById(gridId)) };
}

export async function updateTopic(
  id: string,
  sectionId: string | null,
  gridId: string,
  _p: Result,
  fd: FormData,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const urlErr = urlFieldError(fd, { icon_url: 'Icon URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const payload = await topicPayload(fd);
  if (!payload.title) return { ok: false, error: 'Topic title is required.' };
  const slug = resolveSlug(fd, 'title');
  if (!slug.ok) return slug;
  const { error } = await supabase
    .from('learning_topics')
    .update({ ...payload, slug: slug.slug, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.topic.update', module: MODULE, resourceType: 'learning_topics', resourceId: id });
  revalidatePath(`/learning/grids/${gridId}`);
  if (sectionId) {
    revalidatePath(`/learning/grids/${gridId}/sections/${sectionId}`);
    revalidatePath(`/learning/grids/${gridId}/sections/${sectionId}/topics/${id}`);
  }
  return { ok: true, ...(await syncGridStructureById(gridId)) };
}

export async function deleteTopic(id: string, sectionId: string | null, gridId: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  // learning_contents cascades on topic delete — that is the explicit action.
  // Progress / bookmarks reference learning_topics.id; a topic with student
  // bookmarks is blocked from hard delete (archive instead).
  const { count } = await supabase
    .from('learning_bookmarks')
    .select('topic_id', { count: 'exact', head: true })
    .eq('topic_id', id);
  if ((count ?? 0) > 0) {
    return { ok: false, error: `Students have bookmarked this topic (${count}). Archive it instead of deleting.` };
  }
  const { error } = await supabase.from('learning_topics').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.topic.delete', module: MODULE, resourceType: 'learning_topics', resourceId: id });
  revalidatePath(`/learning/grids/${gridId}`);
  if (sectionId) revalidatePath(`/learning/grids/${gridId}/sections/${sectionId}`);
  return { ok: true, ...(await syncGridStructureById(gridId)) };
}

export async function setTopicField(
  id: string,
  sectionId: string | null,
  gridId: string,
  field: 'status' | 'show_on_website' | 'show_on_mobile' | 'is_premium',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('learning_topics')
    .update({ [field]: value, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.topic.${field}`, module: MODULE, resourceType: 'learning_topics', resourceId: id });
  revalidatePath(`/learning/grids/${gridId}`);
  if (sectionId) revalidatePath(`/learning/grids/${gridId}/sections/${sectionId}`);
  return { ok: true, ...(await syncGridStructureById(gridId)) };
}

export async function reorderTopic(
  id: string,
  sectionId: string | null,
  gridId: string,
  dir: 'up' | 'down',
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const r = await moveRow('learning_topics', id, sectionId ? 'section_id' : 'grid_id', dir);
  revalidatePath(`/learning/grids/${gridId}`);
  if (sectionId) revalidatePath(`/learning/grids/${gridId}/sections/${sectionId}`);
  return r.ok ? { ...r, ...(await syncGridStructureById(gridId)) } : r;
}

// ===========================================================================
// CONTENT BLOCKS
// ===========================================================================
async function contentPayload(fd: FormData) {
  const format = s(fd, 'content_format');
  const contentType = s(fd, 'content_type') || 'article';
  const metadata: Record<string, unknown> = { content_type: contentType };
  const slugRaw = s(fd, 'slug');
  return {
    title: s(fd, 'title'),
    slug: slugRaw ? slugify(slugRaw) : null,
    short_description: s(fd, 'short_description'),
    heading: s(fd, 'heading'),
    body: String(fd.get('body') ?? ''),
    content_format: format === 'plain' ? 'plain' : 'markdown',
    difficulty: (['Easy', 'Medium', 'Hard'].includes(s(fd, 'difficulty')) ? s(fd, 'difficulty') : null) as string | null,
    estimated_minutes: intOrNull(fd, 'estimated_minutes'),
    tags: parseTags(s(fd, 'tags')),
    file_url: s(fd, 'file_url') || null,
    external_url: s(fd, 'external_url') || null,
    video_url: s(fd, 'video_url') || null,
    is_premium: bool(fd, 'is_premium'),
    metadata,
    status: status(fd),
    ...(await resolveLearningTargeting(fd)),
  };
}

export async function createContent(topicId: string, path: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'add');
  const urlErr = urlFieldError(fd, { file_url: 'File URL', external_url: 'External URL', video_url: 'Video URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const payload = await contentPayload(fd);
  if (payload.slug && !isValidSlug(payload.slug)) {
    return { ok: false, error: 'Slug must be lower-case letters, numbers and single hyphens.' };
  }
  const uid = await actorId();
  const { error } = await supabase.from('learning_contents').insert({
    ...payload,
    topic_id: topicId,
    sort_order: await nextSortOrder('learning_contents', 'topic_id', topicId),
    created_by: uid,
    updated_by: uid,
  });
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.content.create', module: MODULE, resourceType: 'learning_contents' });
  revalidatePath(path);
  return { ok: true, ...(await syncTopicByPath(path)) };
}

export async function updateContent(id: string, path: string, _p: Result, fd: FormData): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const urlErr = urlFieldError(fd, { file_url: 'File URL', external_url: 'External URL', video_url: 'Video URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const payload = await contentPayload(fd);
  if (payload.slug && !isValidSlug(payload.slug)) {
    return { ok: false, error: 'Slug must be lower-case letters, numbers and single hyphens.' };
  }
  const { error } = await supabase
    .from('learning_contents')
    .update({ ...payload, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.content.update', module: MODULE, resourceType: 'learning_contents', resourceId: id });
  revalidatePath(path);
  return { ok: true, ...(await syncTopicByPath(path)) };
}

export async function deleteContent(id: string, path: string): Promise<Result> {
  await requirePermission(MODULE, 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('learning_contents').delete().eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: 'learning.content.delete', module: MODULE, resourceType: 'learning_contents', resourceId: id });
  revalidatePath(path);
  return { ok: true, ...(await syncTopicByPath(path)) };
}

export async function setContentField(
  id: string,
  path: string,
  field: 'status' | 'is_premium',
  value: string | boolean,
): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('learning_contents')
    .update({ [field]: value, updated_by: await actorId() })
    .eq('id', id);
  if (error) return { ok: false, error: pgError(error.message) };
  await logActivity({ action: `learning.content.${field}`, module: MODULE, resourceType: 'learning_contents', resourceId: id });
  revalidatePath(path);
  return { ok: true, ...(await syncTopicByPath(path)) };
}

export async function reorderContent(id: string, path: string, dir: 'up' | 'down'): Promise<Result> {
  await requirePermission(MODULE, 'edit');
  const r = await moveRow('learning_contents', id, 'topic_id', dir);
  revalidatePath(path);
  return r.ok ? { ...r, ...(await syncTopicByPath(path)) } : r;
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { urlFieldError } from '@/lib/safeUrl';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { resolveTargetingFromForm } from '@/lib/academic-targeting';
import type { UploadedFile } from '@/components/ui/UploadDropzone';

type Result = { ok: boolean; error?: string };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string) => Number(str(fd, k) || 0);

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

async function syncImagesArray(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('project_images')
    .select('url')
    .eq('project_id', projectId)
    .order('sort_order');
  await supabase
    .from('projects')
    .update({ images: (data ?? []).map((r) => r.url) })
    .eq('id', projectId);
}

async function recomputeFileSize(projectId: string, category: 'main' | 'documentation') {
  const supabase = createClient();
  const { data } = await supabase
    .from('project_files')
    .select('size_mb')
    .eq('project_id', projectId)
    .eq('category', category);
  const total = (data ?? []).reduce((s, r) => s + (Number(r.size_mb) || 0), 0);
  await supabase
    .from('projects')
    .update(category === 'main' ? { source_code_size_mb: total } : { documentation_size_mb: total })
    .eq('id', projectId);
}

// --- project CRUD --------------------------------------------------------
export async function createProject(_prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('projects', 'add');
  const urlErr = urlFieldError(fd, { live_demo_url: 'Live demo URL', github_url: 'GitHub URL', thumbnail_url: 'Thumbnail URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();

  const title = str(fd, 'title');
  if (!title) return { ok: false, error: 'Title is required.' };

  const id = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;
  const categoryId = str(fd, 'category_id') || null;
  let categoryName = '';
  if (categoryId) {
    const { data: cat } = await supabase.from('categories').select('name').eq('id', categoryId).maybeSingle();
    categoryName = cat?.name ?? '';
  }

  const { error } = await supabase.from('projects').insert({
    id,
    title,
    category_id: categoryId,
    category_name: categoryName,
    tech_stack: str(fd, 'tech_stack')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    price: num(fd, 'price'),
    description: str(fd, 'description'),
    live_demo_url: str(fd, 'live_demo_url') || null,
    github_url: str(fd, 'github_url') || null,
    developer_name: str(fd, 'developer_name') || 'CampusEduX Studio',
    license: str(fd, 'license') || 'Regular License',
    platform_fee_percent: num(fd, 'platform_fee_percent') || 2,
    is_premium: fd.get('is_premium') === 'on',
    status: str(fd, 'status') || 'published',
    thumbnail_url: str(fd, 'thumbnail_url') || null,
    ...(await resolveTargetingFromForm(fd)),
  });
  if (error) return { ok: false, error: error.message };

  await logActivity({ action: 'project.create', module: 'projects', resourceType: 'projects', resourceId: id });
  revalidatePath('/projects');
  redirect(`/projects/${id}?created=1`);
}

export async function updateProject(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('projects', 'edit');
  const urlErr = urlFieldError(fd, { live_demo_url: 'Live demo URL', github_url: 'GitHub URL', thumbnail_url: 'Thumbnail URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();

  const categoryId = str(fd, 'category_id') || null;
  let categoryName = str(fd, 'category_name');
  if (categoryId) {
    const { data: cat } = await supabase.from('categories').select('name').eq('id', categoryId).maybeSingle();
    categoryName = cat?.name ?? categoryName;
  }

  const { error } = await supabase
    .from('projects')
    .update({
      title: str(fd, 'title'),
      category_id: categoryId,
      category_name: categoryName,
      tech_stack: str(fd, 'tech_stack')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      price: num(fd, 'price'),
      description: str(fd, 'description'),
      live_demo_url: str(fd, 'live_demo_url') || null,
      github_url: str(fd, 'github_url') || null,
      developer_name: str(fd, 'developer_name') || 'CampusEduX Studio',
      license: str(fd, 'license') || 'Regular License',
      platform_fee_percent: num(fd, 'platform_fee_percent') || 2,
      is_premium: fd.get('is_premium') === 'on',
      status: str(fd, 'status') || 'published',
      thumbnail_url: str(fd, 'thumbnail_url') || null,
      ...(await resolveTargetingFromForm(fd)),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  await logActivity({ action: 'project.update', module: 'projects', resourceType: 'projects', resourceId: id });
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}?saved=1`);
}

export async function deleteProject(id: string): Promise<Result> {
  await requirePermission('projects', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'project.delete', module: 'projects', resourceType: 'projects', resourceId: id });
  revalidatePath('/projects');
  return { ok: true };
}

// --- flags / priority --------------------------------------------------
export async function toggleProjectFlag(
  id: string,
  field: 'is_featured' | 'is_best_seller' | 'is_premium',
  value: boolean,
): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: `project.${field}.${value ? 'on' : 'off'}`, module: 'projects', resourceType: 'projects', resourceId: id });
  revalidatePath('/projects/featured');
  revalidatePath('/projects/best-sellers');
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function setProjectPriority(
  id: string,
  field: 'featured_priority' | 'best_seller_priority',
  value: number,
): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/projects/featured');
  revalidatePath('/projects/best-sellers');
  return { ok: true };
}

// --- thumbnail ------------------------------------------------------
export async function setProjectThumbnail(projectId: string, files: UploadedFile[]): Promise<Result> {
  await requirePermission('projects', 'edit');
  if (!files.length) return { ok: false, error: 'No file uploaded.' };
  const supabase = createClient();
  const { error } = await supabase.from('projects').update({ thumbnail_url: files[0].url }).eq('id', projectId);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'project.thumbnail.set', module: 'projects', resourceType: 'projects', resourceId: projectId });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/images`);
  return { ok: true };
}

export async function removeProjectThumbnail(projectId: string): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { data: current } = await supabase.from('projects').select('thumbnail_url').eq('id', projectId).maybeSingle();
  const { error } = await supabase.from('projects').update({ thumbnail_url: null }).eq('id', projectId);
  if (error) return { ok: false, error: error.message };

  // Best-effort clean-up if the file lived in our own bucket.
  const url = current?.thumbnail_url ?? '';
  const marker = '/project-media/';
  const idx = url.indexOf(marker);
  if (idx >= 0) await supabase.storage.from('project-media').remove([url.slice(idx + marker.length)]);

  await logActivity({ action: 'project.thumbnail.remove', module: 'projects', resourceType: 'projects', resourceId: projectId });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/images`);
  return { ok: true };
}

// --- images ----------------------------------------------------------
export async function addProjectImages(projectId: string, files: UploadedFile[]): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('project_images')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1);
  let next = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = files.map((f) => ({ project_id: projectId, url: f.url, sort_order: next++ }));
  const { error } = await supabase.from('project_images').insert(rows);
  if (error) return { ok: false, error: error.message };
  await syncImagesArray(projectId);
  await logActivity({ action: 'project.images.add', module: 'projects', resourceType: 'projects', resourceId: projectId, details: { count: files.length } });
  revalidatePath(`/projects/${projectId}/images`);
  return { ok: true };
}

export async function deleteProjectImage(projectId: string, imageId: string, url: string): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('project_images').delete().eq('id', imageId);
  if (error) return { ok: false, error: error.message };

  const marker = '/project-media/';
  const idx = url.indexOf(marker);
  if (idx >= 0) await supabase.storage.from('project-media').remove([url.slice(idx + marker.length)]);
  await syncImagesArray(projectId);
  revalidatePath(`/projects/${projectId}/images`);
  return { ok: true };
}

// --- video ---------------------------------------------------------
export async function setProjectVideo(projectId: string, files: UploadedFile[]): Promise<Result> {
  await requirePermission('projects', 'edit');
  if (!files.length) return { ok: false, error: 'No file uploaded.' };
  const supabase = createClient();
  const { error } = await supabase.from('projects').update({ video_url: files[0].url }).eq('id', projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}/video`);
  return { ok: true };
}

export async function setProjectVideoUrl(projectId: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('projects', 'edit');
  const urlErr = urlFieldError(fd, { video_url: 'Video URL' });
  if (urlErr) return { ok: false, error: urlErr };
  const supabase = createClient();
  const url = str(fd, 'video_url') || null;
  const { error } = await supabase.from('projects').update({ video_url: url }).eq('id', projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}/video`);
  return { ok: true };
}

export async function removeProjectVideo(projectId: string): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('projects').update({ video_url: null }).eq('id', projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}/video`);
  return { ok: true };
}

// --- files (source code / documentation) --------------------------
export async function addProjectFile(
  projectId: string,
  category: 'main' | 'documentation',
  label: string,
  files: UploadedFile[],
): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('project_files')
    .select('sort_order')
    .eq('project_id', projectId)
    .eq('category', category)
    .order('sort_order', { ascending: false })
    .limit(1);
  let next = (existing?.[0]?.sort_order ?? -1) + 1;

  const rows = files.map((f, i) => ({
    id: `${projectId}-${category}-${Date.now()}-${i}`,
    project_id: projectId,
    category,
    label: label || f.name,
    file_name: f.name,
    size_mb: Math.round((f.size / (1024 * 1024)) * 100) / 100,
    storage_path: f.path,
    sort_order: next++,
  }));
  const { error } = await supabase.from('project_files').insert(rows);
  if (error) return { ok: false, error: error.message };
  await recomputeFileSize(projectId, category);
  await logActivity({ action: `project.file.add`, module: 'projects', resourceType: 'project_files', resourceId: projectId, details: { category } });
  revalidatePath(`/projects/${projectId}/${category === 'main' ? 'source-code' : 'documentation'}`);
  return { ok: true };
}

export async function deleteProjectFile(
  projectId: string,
  fileId: string,
  storagePath: string,
  category: 'main' | 'documentation',
): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('project_files').delete().eq('id', fileId);
  if (error) return { ok: false, error: error.message };
  if (storagePath) await supabase.storage.from('project-files').remove([storagePath]);
  await recomputeFileSize(projectId, category);
  revalidatePath(`/projects/${projectId}/${category === 'main' ? 'source-code' : 'documentation'}`);
  return { ok: true };
}

// --- versions -----------------------------------------------------
export async function addVersion(projectId: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const version = str(fd, 'version');
  if (!version) return { ok: false, error: 'Version label is required.' };
  const isLatest = fd.get('is_latest') === 'on';
  const changelog = str(fd, 'changelog')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (isLatest) {
    await supabase.from('project_versions').update({ is_latest: false }).eq('project_id', projectId);
  }
  const { error } = await supabase.from('project_versions').insert({
    project_id: projectId,
    version,
    is_latest: isLatest,
    size_mb: num(fd, 'size_mb'),
    changelog,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'project.version.add', module: 'projects', resourceType: 'project_versions', resourceId: projectId, details: { version } });
  revalidatePath(`/projects/${projectId}/versions`);
  return { ok: true };
}

export async function setLatestVersion(projectId: string, versionId: string): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  await supabase.from('project_versions').update({ is_latest: false }).eq('project_id', projectId);
  const { error } = await supabase.from('project_versions').update({ is_latest: true }).eq('id', versionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}/versions`);
  return { ok: true };
}

export async function deleteVersion(projectId: string, versionId: string): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase.from('project_versions').delete().eq('id', versionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects/${projectId}/versions`);
  return { ok: true };
}

// --- reviews ----------------------------------------------------
export async function deleteReview(projectId: string, reviewId: string): Promise<Result> {
  await requirePermission('projects', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'review.delete', module: 'projects', resourceType: 'reviews', resourceId: reviewId });
  revalidatePath(`/projects/${projectId}/reviews`);
  return { ok: true };
}

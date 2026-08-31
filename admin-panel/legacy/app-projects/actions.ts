'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser, requirePermission } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export interface ProjectFormValues {
  title: string;
  slug: string;
  branchId: string;
  categoryId: string | null;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice: number | null;
  isPremium: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  status: 'draft' | 'published' | 'archived';
  technologyIds: string[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createProject(values: ProjectFormValues) {
  const staff = await requireStaffUser();
  await requirePermission('projects', 'create');

  const supabase = createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      title: values.title,
      slug: values.slug || slugify(values.title),
      branch_id: values.branchId,
      category_id: values.categoryId,
      short_description: values.shortDescription,
      description: values.description,
      price: values.price,
      discount_price: values.discountPrice,
      is_premium: values.isPremium,
      difficulty: values.difficulty,
      status: values.status,
      seller_id: staff.id,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  if (values.technologyIds.length > 0) {
    await supabase
      .from('project_technologies')
      .insert(values.technologyIds.map((technology_id) => ({ project_id: project.id, technology_id })));
  }

  await writeAuditLog({
    actorId: staff.id,
    action: 'project.create',
    resourceType: 'projects',
    resourceId: project.id,
    newValue: values,
  });

  revalidatePath('/projects');
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, values: ProjectFormValues) {
  const staff = await requireStaffUser();
  const supabase = createClient();

  const { data: before } = await supabase.from('projects').select('*').eq('id', projectId).single();

  const { error } = await supabase
    .from('projects')
    .update({
      title: values.title,
      slug: values.slug || slugify(values.title),
      branch_id: values.branchId,
      category_id: values.categoryId,
      short_description: values.shortDescription,
      description: values.description,
      price: values.price,
      discount_price: values.discountPrice,
      is_premium: values.isPremium,
      difficulty: values.difficulty,
      status: values.status,
    })
    .eq('id', projectId);
  if (error) throw new Error(error.message);

  // Simplest correct way to keep the join table in sync: replace the set.
  await supabase.from('project_technologies').delete().eq('project_id', projectId);
  if (values.technologyIds.length > 0) {
    await supabase
      .from('project_technologies')
      .insert(values.technologyIds.map((technology_id) => ({ project_id: projectId, technology_id })));
  }

  await writeAuditLog({
    actorId: staff.id,
    action: 'project.update',
    resourceType: 'projects',
    resourceId: projectId,
    oldValue: before,
    newValue: values,
  });

  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
}

export async function setProjectStatus(projectId: string, status: 'draft' | 'published' | 'archived') {
  const staff = await requireStaffUser();
  const supabase = createClient();

  const { data: before } = await supabase.from('projects').select('status').eq('id', projectId).single();
  const { error } = await supabase.from('projects').update({ status }).eq('id', projectId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'project.status_change',
    resourceType: 'projects',
    resourceId: projectId,
    oldValue: before,
    newValue: { status },
  });

  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
}

export async function softDeleteProject(projectId: string) {
  const staff = await requireStaffUser();
  await requirePermission('projects', 'update');
  const supabase = createClient();

  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString(), status: 'archived' })
    .eq('id', projectId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'project.delete',
    resourceType: 'projects',
    resourceId: projectId,
  });

  revalidatePath('/projects');
}

export async function addProjectImage(projectId: string, storagePath: string, sortOrder: number) {
  await requireStaffUser();
  const supabase = createClient();
  const { error } = await supabase
    .from('project_images')
    .insert({ project_id: projectId, storage_path: storagePath, sort_order: sortOrder });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectImage(projectId: string, imageId: string, storagePath: string) {
  await requireStaffUser();
  const supabase = createClient();
  await supabase.storage.from('project-images').remove([storagePath]);
  const { error } = await supabase.from('project_images').delete().eq('id', imageId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function addProjectVideo(
  projectId: string,
  storagePath: string,
  videoType: 'preview' | 'demo',
  durationSeconds: number | null,
) {
  await requireStaffUser();
  const supabase = createClient();
  const { error } = await supabase.from('project_videos').insert({
    project_id: projectId,
    storage_path: storagePath,
    video_type: videoType,
    duration_seconds: durationSeconds,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectVideo(projectId: string, videoId: string, storagePath: string) {
  await requireStaffUser();
  const supabase = createClient();
  await supabase.storage.from('project-videos').remove([storagePath]);
  const { error } = await supabase.from('project_videos').delete().eq('id', videoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

// Note: the mobile app does not currently render project_documents anywhere
// (verified against src/data/repositories/SupabaseProjectRepository.ts — only
// project_videos is selected/read). This gives admins a place to upload
// documentation/report/PPT previews ahead of that app-side feature landing,
// but uploading here will not yet be visible in the app until that read path
// is added.
export async function addProjectDocument(
  projectId: string,
  docType: 'documentation' | 'report' | 'ppt' | 'installation_guide',
  storagePath: string,
  previewStoragePath: string | null,
  isLocked: boolean,
) {
  await requireStaffUser();
  const supabase = createClient();
  const { error } = await supabase.from('project_documents').insert({
    project_id: projectId,
    doc_type: docType,
    storage_path: storagePath,
    preview_storage_path: previewStoragePath,
    is_locked: isLocked,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectDocument(
  projectId: string,
  documentId: string,
  storagePath: string,
  previewStoragePath: string | null,
) {
  await requireStaffUser();
  const supabase = createClient();
  await supabase.storage.from('project-assets').remove([storagePath]);
  if (previewStoragePath) await supabase.storage.from('project-previews').remove([previewStoragePath]);
  const { error } = await supabase.from('project_documents').delete().eq('id', documentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function addProjectFile(
  projectId: string,
  fileType: 'source_zip' | 'database' | 'other',
  storagePath: string,
  checksum: string,
  sizeBytes: number,
) {
  await requireStaffUser();
  const supabase = createClient();
  const { error } = await supabase.from('project_files').insert({
    project_id: projectId,
    file_type: fileType,
    storage_path: storagePath,
    checksum_sha256: checksum,
    size_bytes: sizeBytes,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectFile(projectId: string, fileId: string, storagePath: string) {
  await requireStaffUser();
  const supabase = createClient();
  await supabase.storage.from('project-assets').remove([storagePath]);
  const { error } = await supabase.from('project_files').delete().eq('id', fileId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

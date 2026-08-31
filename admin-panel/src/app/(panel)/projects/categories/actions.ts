'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

type Result = { ok: boolean; error?: string };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function createCategory(_prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('projects', 'add');
  const supabase = createClient();
  const name = str(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const id = str(fd, 'id') || slug(name);
  const { error } = await supabase.from('categories').insert({
    id,
    name,
    icon: str(fd, 'icon') || 'folder-outline',
    sort_order: Number(str(fd, 'sort_order') || 0),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'category.create', module: 'projects', resourceType: 'categories', resourceId: id });
  revalidatePath('/projects/categories');
  return { ok: true };
}

export async function updateCategory(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('categories')
    .update({
      name: str(fd, 'name'),
      icon: str(fd, 'icon') || 'folder-outline',
      sort_order: Number(str(fd, 'sort_order') || 0),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'category.update', module: 'projects', resourceType: 'categories', resourceId: id });
  revalidatePath('/projects/categories');
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  await requirePermission('projects', 'delete');
  const supabase = createClient();
  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);
  if ((count ?? 0) > 0) return { ok: false, error: `${count} project(s) still use this category.` };
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'category.delete', module: 'projects', resourceType: 'categories', resourceId: id });
  revalidatePath('/projects/categories');
  return { ok: true };
}

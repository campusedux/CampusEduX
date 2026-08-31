'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

type Result = { ok: boolean; error?: string };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function createTechnology(_prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('projects', 'add');
  const supabase = createClient();
  const name = str(fd, 'name');
  if (!name) return { ok: false, error: 'Name is required.' };
  const s = str(fd, 'slug') || slugify(name);
  const { error } = await supabase.from('technologies').insert({
    id: s,
    name,
    slug: s,
    icon: str(fd, 'icon') || 'code',
    category: str(fd, 'category') || 'General',
    status: str(fd, 'status') || 'active',
    sort_order: Number(str(fd, 'sort_order') || 0),
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'technology.create', module: 'projects', resourceType: 'technologies', resourceId: s });
  revalidatePath('/projects/technologies');
  return { ok: true };
}

export async function updateTechnology(id: string, _prev: Result, fd: FormData): Promise<Result> {
  await requirePermission('projects', 'edit');
  const supabase = createClient();
  const { error } = await supabase
    .from('technologies')
    .update({
      name: str(fd, 'name'),
      icon: str(fd, 'icon') || 'code',
      category: str(fd, 'category') || 'General',
      status: str(fd, 'status') || 'active',
      sort_order: Number(str(fd, 'sort_order') || 0),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'technology.update', module: 'projects', resourceType: 'technologies', resourceId: id });
  revalidatePath('/projects/technologies');
  return { ok: true };
}

export async function deleteTechnology(id: string): Promise<Result> {
  await requirePermission('projects', 'delete');
  const supabase = createClient();
  const { error } = await supabase.from('technologies').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  await logActivity({ action: 'technology.delete', module: 'projects', resourceType: 'technologies', resourceId: id });
  revalidatePath('/projects/technologies');
  return { ok: true };
}

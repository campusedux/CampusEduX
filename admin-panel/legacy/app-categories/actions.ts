'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

function assertCanManage(roleId: string) {
  if (roleId !== 'admin' && roleId !== 'super_admin' && roleId !== 'manager') {
    throw new Error('You do not have permission to manage the catalog.');
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createBranch(name: string) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);
  if (!name.trim()) throw new Error('Branch name is required.');

  const supabase = createClient();
  const { data: branch, error } = await supabase
    .from('branches')
    .insert({ name, slug: slugify(name) })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'branch.create', resourceType: 'branches', resourceId: branch.id, newValue: { name } });
  revalidatePath('/categories');
}

export async function toggleBranchActive(branchId: string, isActive: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('branches').update({ is_active: isActive }).eq('id', branchId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'branch.activate' : 'branch.deactivate',
    resourceType: 'branches',
    resourceId: branchId,
  });
  revalidatePath('/categories');
}

export async function createCategory(branchId: string, name: string, parentId: string | null) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);
  if (!name.trim()) throw new Error('Category name is required.');

  const supabase = createClient();
  const { error } = await supabase.from('categories').insert({
    branch_id: branchId,
    parent_id: parentId,
    name,
    slug: slugify(name),
  });
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'category.create', resourceType: 'categories', newValue: { branchId, name, parentId } });
  revalidatePath(`/categories/${branchId}`);
}

export async function toggleCategoryActive(id: string, branchId: string, isActive: boolean) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('categories').update({ is_active: isActive }).eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'category.activate' : 'category.deactivate',
    resourceType: 'categories',
    resourceId: id,
  });
  revalidatePath(`/categories/${branchId}`);
}

export async function deleteCategory(id: string, branchId: string) {
  const staff = await requireStaffUser();
  assertCanManage(staff.roleId);

  const supabase = createClient();
  const { error } = await supabase.from('categories').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'category.delete', resourceType: 'categories', resourceId: id });
  revalidatePath(`/categories/${branchId}`);
}

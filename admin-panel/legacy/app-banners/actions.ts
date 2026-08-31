'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export interface BannerFormValues {
  title: string;
  storagePath: string;
  placement: 'home_top' | 'category_top' | 'checkout';
  linkType: 'project' | 'category' | 'branch' | 'external_url' | 'none';
  linkValue: string | null;
  sortOrder: number;
  isActive: boolean;
}

export async function createBanner(values: BannerFormValues) {
  const staff = await requireStaffUser();
  if (staff.roleId !== 'admin' && staff.roleId !== 'super_admin') throw new Error('Only Admins can manage banners.');

  const supabase = createClient();
  const { data: banner, error } = await supabase
    .from('banners')
    .insert({
      title: values.title,
      image_storage_path: values.storagePath,
      placement: values.placement,
      link_type: values.linkType,
      link_value: values.linkValue,
      sort_order: values.sortOrder,
      is_active: values.isActive,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'banner.create',
    resourceType: 'banners',
    resourceId: banner.id,
    newValue: values,
  });

  revalidatePath('/banners');
  redirect('/banners');
}

export async function toggleBannerActive(bannerId: string, isActive: boolean) {
  const staff = await requireStaffUser();
  if (staff.roleId !== 'admin' && staff.roleId !== 'super_admin') throw new Error('Only Admins can manage banners.');

  const supabase = createClient();
  const { error } = await supabase.from('banners').update({ is_active: isActive }).eq('id', bannerId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: isActive ? 'banner.activate' : 'banner.deactivate',
    resourceType: 'banners',
    resourceId: bannerId,
  });

  revalidatePath('/banners');
}

export async function deleteBanner(bannerId: string, storagePath: string) {
  const staff = await requireStaffUser();
  if (staff.roleId !== 'admin' && staff.roleId !== 'super_admin') throw new Error('Only Admins can manage banners.');

  const supabase = createClient();
  await supabase.storage.from('banners').remove([storagePath]);
  const { error } = await supabase.from('banners').delete().eq('id', bannerId);
  if (error) throw new Error(error.message);

  await writeAuditLog({ actorId: staff.id, action: 'banner.delete', resourceType: 'banners', resourceId: bannerId });

  revalidatePath('/banners');
}

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

const ROLE_IDS = ['user', 'content_editor', 'manager', 'admin', 'super_admin'] as const;
type RoleId = (typeof ROLE_IDS)[number];

export async function updateUserRole(userId: string, roleId: RoleId) {
  const staff = await requireStaffUser();
  // Only admins can grant staff access — role changes have no seeded row in
  // role_permissions (see 002), so has_permission would only ever fall back
  // to is_admin anyway. This mirrors that same rule explicitly on the client side.
  if (staff.roleId !== 'admin' && staff.roleId !== 'super_admin') {
    throw new Error('Only Admins can change user roles.');
  }

  const supabase = createClient();
  const { data: before } = await supabase.from('user_profiles').select('role_id').eq('id', userId).single();

  const { error } = await supabase.from('user_profiles').update({ role_id: roleId }).eq('id', userId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'user.role_change',
    resourceType: 'user_profiles',
    resourceId: userId,
    oldValue: before,
    newValue: { role_id: roleId },
  });

  revalidatePath('/users');
}

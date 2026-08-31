'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function markAllNotificationsRead() {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ is_read: true })
    .eq('is_read', false);
  if (error && error.code !== 'PGRST205') throw new Error(error.message);
  await logActivity({ action: 'notifications.mark_all_read', module: 'dashboard' });
  revalidatePath('/notifications');
}

export async function markNotificationRead(id: string) {
  await requireAdmin();
  const supabase = createClient();
  const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
  if (error && error.code !== 'PGRST205') throw new Error(error.message);
  revalidatePath('/notifications');
}

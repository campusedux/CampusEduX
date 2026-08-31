'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser, requirePermission } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export async function moderateReview(reviewId: string, status: 'approved' | 'rejected' | 'flagged') {
  const staff = await requireStaffUser();
  await requirePermission('reviews', 'moderate');

  const supabase = createClient();
  const { error } = await supabase
    .from('reviews')
    .update({ status, moderated_by: staff.id, moderated_at: new Date().toISOString() })
    .eq('id', reviewId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: `review.${status}`,
    resourceType: 'reviews',
    resourceId: reviewId,
    newValue: { status },
  });

  revalidatePath('/reviews');
}

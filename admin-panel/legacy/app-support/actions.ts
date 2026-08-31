'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireStaffUser, requirePermission } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
) {
  const staff = await requireStaffUser();
  await requirePermission('support_tickets', 'update');

  const supabase = createClient();
  const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'support_ticket.status_change',
    resourceType: 'support_tickets',
    resourceId: ticketId,
    newValue: { status },
  });

  revalidatePath('/support');
}

export async function assignTicketToSelf(ticketId: string) {
  const staff = await requireStaffUser();
  await requirePermission('support_tickets', 'update');

  const supabase = createClient();
  const { error } = await supabase
    .from('support_tickets')
    .update({ assigned_to: staff.id, status: 'in_progress' })
    .eq('id', ticketId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    actorId: staff.id,
    action: 'support_ticket.assign',
    resourceType: 'support_tickets',
    resourceId: ticketId,
    newValue: { assigned_to: staff.id },
  });

  revalidatePath('/support');
}

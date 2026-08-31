import Link from 'next/link';
import { requireStaffUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';
import { TicketControls } from '@/app/support/TicketControls';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
] as const;

const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
  urgent: 'danger',
  high: 'warning',
  normal: 'neutral',
  low: 'neutral',
};

export default async function SupportPage({ searchParams }: { searchParams: { status?: string } }) {
  const staff = await requireStaffUser();
  const status = searchParams.status ?? 'open';
  const supabase = createClient();
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('id, subject, message, status, priority, assigned_to, created_at, user_profiles(full_name, email)')
    .eq('status', status)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Support Tickets</h1>
        <p className="text-sm text-ink-muted">Customer questions and issues</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/support?status=${t.key}`}
            className={`px-4 py-2 text-sm font-medium ${
              status === t.key ? 'border-b-2 border-brand text-brand' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card>
        {!tickets || tickets.length === 0 ? (
          <EmptyState title={`No ${status.replace('_', ' ')} tickets`} />
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((ticket: any) => (
              <li key={ticket.id} className="py-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{ticket.subject}</span>
                    <Badge label={ticket.priority} tone={PRIORITY_TONE[ticket.priority] ?? 'neutral'} />
                  </div>
                  <TicketControls
                    ticketId={ticket.id}
                    status={ticket.status}
                    isAssigned={ticket.assigned_to === staff.id}
                  />
                </div>
                <p className="text-sm text-ink-muted">{ticket.message}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {ticket.user_profiles?.full_name || ticket.user_profiles?.email} · {formatDateTime(ticket.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

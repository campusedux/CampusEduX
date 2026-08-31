import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, EmptyState, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { safe, timeAgo } from '@/lib/utils';
import { CheckCheck, Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { markAllNotificationsRead } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notifications · CampusEduX Admin' };

const LEVEL_ICON: Record<string, typeof Bell> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

export default async function NotificationsPage() {
  await requireModule('dashboard');
  const supabase = createClient();
  const rows = await safe(
    supabase
      .from('admin_notifications')
      .select('id, title, body, level, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    [] as any[],
  );
  const unread = rows.filter((r) => !r.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="System alerts, queue reminders and broadcast receipts."
        action={
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary" disabled={unread === 0}>
              <CheckCheck size={16} /> Mark all as read
            </Button>
          </form>
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            description="System notifications (pending refunds, withdrawal requests, reported reviews, broadcast receipts) appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((n: any) => {
              const Icon = LEVEL_ICON[n.level] ?? Bell;
              return (
                <li key={n.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      n.level === 'warning' || n.level === 'critical'
                        ? 'bg-warning/10 text-[#B77A1B]'
                        : n.level === 'success'
                          ? 'bg-success/10 text-success'
                          : 'bg-brand-light text-brand-dark'
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      {!n.is_read ? <Badge label="New" tone="info" /> : null}
                    </div>
                    {n.body ? <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p> : null}
                    <p className="mt-0.5 text-xs text-ink-faint">{timeAgo(n.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

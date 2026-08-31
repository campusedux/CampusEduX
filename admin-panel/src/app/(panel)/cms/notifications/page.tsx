import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDateTime, formatNumber } from '@/lib/utils';
import { getPushHistory } from '@/lib/cms/queries';
import { PushComposer } from './PushComposer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Push Notifications · CampusEduX Admin' };

export default async function PushNotificationsPage() {
  const admin = await requireModule('cms');
  const history = await getPushHistory();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/cms" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Banner & CMS
        </Link>
        <PageHeader title="Push Notifications" subtitle="Compose and send in-app notifications to a target audience." />
      </div>

      {admin.perms.cms.add ? <PushComposer /> : null}

      <Card>
        <CardHeader title="Sent history" />
        {history.length === 0 ? (
          <EmptyState title="Nothing sent yet" />
        ) : (
          <ul className="divide-y divide-border">
            {history.map((h: any) => (
              <li key={h.id} className="flex gap-3 py-3">
                {h.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.image_url}
                    alt=""
                    className="h-14 w-14 flex-shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink">{h.title}</p>
                    <Badge
                      label={h.status}
                      tone={h.status === 'sent' ? 'success' : h.status === 'failed' ? 'danger' : 'neutral'}
                    />
                  </div>
                  {h.body ? <p className="mt-0.5 text-sm text-ink-muted">{h.body}</p> : null}
                  {h.status === 'failed' && h.error_message ? (
                    <p className="mt-0.5 text-xs text-danger">{h.error_message}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-ink-faint">
                    {h.category} · {h.target_audience} · {formatNumber(h.recipient_count)} recipients ·{' '}
                    {formatDateTime(h.created_at)}
                    {h.sent_by_email ? ` · ${h.sent_by_email}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

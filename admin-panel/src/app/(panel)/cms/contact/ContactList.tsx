'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';
import { setContactStatus } from '../actions';

interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  user_id: string | null;
  created_at: string;
}

export function ContactList({ submissions, canEdit }: { submissions: Submission[]; canEdit: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function update(id: string, status: 'new' | 'read' | 'archived') {
    startTransition(async () => {
      const res = await setContactStatus(id, status);
      if (res.error) toast({ title: 'Could not update', description: res.error, variant: 'error' });
      else {
        toast({ title: `Marked ${status}`, variant: 'success' });
        router.refresh();
      }
    });
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="Submissions from the website contact form will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((s) => (
        <Card key={s.id} className={s.status === 'archived' ? 'opacity-60' : undefined}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-medium text-ink">
                {s.name}{' '}
                <a href={`mailto:${s.email}`} className="text-sm font-normal text-brand hover:underline">
                  &lt;{s.email}&gt;
                </a>
              </div>
              <div className="text-xs text-ink-faint">
                {formatDateTime(s.created_at)}
                {s.user_id ? ' · signed-in user' : ' · anonymous'}
              </div>
            </div>
            <StatusPill status={s.status} />
          </div>

          <p className="mt-3 whitespace-pre-line text-sm text-ink-muted">{s.message}</p>

          {canEdit && (
            <div className="mt-3 flex gap-2">
              {s.status !== 'read' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update(s.id, 'read')}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink hover:border-brand disabled:opacity-50"
                >
                  Mark read
                </button>
              )}
              {s.status !== 'archived' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update(s.id, 'archived')}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink hover:border-brand disabled:opacity-50"
                >
                  Archive
                </button>
              )}
              {s.status !== 'new' && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update(s.id, 'new')}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink hover:border-brand disabled:opacity-50"
                >
                  Reopen
                </button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { revokeResumeShare, setShareReportStatus } from '../actions';

type Result = { ok: boolean; error?: string };
interface Report {
  id: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  share: { id: string; token: string; is_active: boolean; resume: { title: string } | null } | null;
}

const STATUS_TONE: Record<Report['status'], 'neutral' | 'success' | 'danger'> = {
  open: 'danger',
  resolved: 'success',
  dismissed: 'neutral',
};

export function ShareReportManager({ reports, perms }: { reports: Report[]; perms: { edit: boolean } }) {
  if (reports.length === 0) {
    return <EmptyState title="No reports yet" description="Reports submitted from a shared resume page will show up here." />;
  }
  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <ReportRow key={r.id} report={r} perms={perms} />
      ))}
    </div>
  );
}

function useActionToast() {
  const { toast } = useToast();
  const router = useRouter();
  return async (action: () => Promise<Result>) => {
    const result = await action();
    if (result.error) toast({ title: 'Could not update', description: result.error, variant: 'error' });
    else {
      toast({ title: 'Updated', variant: 'success' });
      router.refresh();
    }
  };
}

function ReportRow({ report, perms }: { report: Report; perms: { edit: boolean } }) {
  const run = useActionToast();
  const resumeTitle = report.share?.resume?.title ?? '(resume deleted)';
  const shareActive = report.share?.is_active ?? false;

  return (
    <Card>
      <CardHeader
        title={resumeTitle}
        description={`Reported ${new Date(report.created_at).toLocaleString()} · share link is ${shareActive ? 'active' : 'disabled'}`}
      />
      <p className="text-sm text-ink">{report.reason}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Badge label={report.status} tone={STATUS_TONE[report.status]} />
        {perms.edit && (
          <>
            {shareActive && report.share && (
              <button
                type="button"
                onClick={() => run(() => revokeResumeShare(report.share!.id))}
                className="text-sm font-medium text-danger hover:underline"
              >
                Revoke share link
              </button>
            )}
            {report.status === 'open' && (
              <>
                <button
                  type="button"
                  onClick={() => run(() => setShareReportStatus(report.id, 'resolved'))}
                  className="text-sm font-medium text-success hover:underline"
                >
                  Mark resolved
                </button>
                <button
                  type="button"
                  onClick={() => run(() => setShareReportStatus(report.id, 'dismissed'))}
                  className="text-sm font-medium text-ink-muted hover:underline"
                >
                  Dismiss
                </button>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

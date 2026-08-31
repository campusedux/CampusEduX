import Link from 'next/link';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils';
import { APP_STATUS_LABEL } from '@/lib/jobs/queries';

interface AppRow {
  id: string;
  status: string;
  created_at: string;
  rejection_reason: string | null;
  job: { title: string; company_name: string } | null;
  applicant: { full_name: string; email: string } | null;
  resume: { file_name: string } | null;
}

export function ApplicationsTable({
  rows,
  total,
  page,
  pageSize,
  basePath,
  searchParams = {},
  showReason = false,
  missing = false,
}: {
  rows: AppRow[];
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  showReason?: boolean;
  missing?: boolean;
}) {
  return (
    <Card>
      {rows.length === 0 ? (
        <EmptyState
          title="No applications"
          description={missing ? 'The applications table isn’t available yet — apply the mobile migrations.' : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Applicant</th>
                <th className="pb-2 font-medium">Job</th>
                <th className="pb-2 font-medium">Resume</th>
                <th className="pb-2 font-medium">Status</th>
                {showReason ? <th className="pb-2 font-medium">Reason</th> : null}
                <th className="pb-2 font-medium">Applied</th>
                <th className="pb-2 text-right font-medium">Review</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-border odd:bg-surface-subtle/40">
                  <td className="py-2.5">
                    <p className="font-medium text-ink">{a.applicant?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-ink-faint">{a.applicant?.email}</p>
                  </td>
                  <td className="py-2.5 text-ink-muted">
                    {a.job?.title || '—'}
                    {a.job?.company_name ? <span className="block text-xs text-ink-faint">{a.job.company_name}</span> : null}
                  </td>
                  <td className="py-2.5 text-ink-muted">{a.resume?.file_name || '—'}</td>
                  <td className="py-2.5">
                    <StatusPill status={APP_STATUS_LABEL[a.status] ?? a.status} />
                  </td>
                  {showReason ? <td className="py-2.5 text-ink-muted">{a.rejection_reason || '—'}</td> : null}
                  <td className="py-2.5 text-ink-muted">{formatDate(a.created_at)}</td>
                  <td className="py-2.5 text-right">
                    <Link href={`/jobs/applications/${a.id}`} className="font-medium text-brand hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3">
        <Pagination page={page} pageSize={pageSize} total={total} basePath={basePath} searchParams={searchParams} />
      </div>
    </Card>
  );
}

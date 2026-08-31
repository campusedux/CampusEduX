import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';
import { listReportedReviews, REVIEW_PAGE_SIZE } from '@/lib/reviews/queries';
import { ReportResolveBar } from './ReportResolveBar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reported Reviews · CampusEduX Admin' };

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'resolved', label: 'Resolved' },
];

export default async function ReportedReviewsPage({
  searchParams,
}: {
  searchParams: { tab?: string; page?: string };
}) {
  const admin = await requireModule('reviews');
  const tab = TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab! : 'all';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { rows, total, missing } = await listReportedReviews({ page, status: tab === 'all' ? '' : tab });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reviews" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Reviews & Ratings
        </Link>
        <PageHeader title="Reported Reviews" subtitle="Reviews flagged by students, with the reason and reporter." />
      </div>

      <Tabs basePath="/reviews/reported" current={tab} tabs={TABS} />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No reports" description={missing ? 'The review_reports table isn’t available — apply admin migration 008.' : undefined} />
        ) : (
          <div className="space-y-3">
            {rows.map((r: any) => (
              <div key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={r.category} tone="neutral" />
                      <StatusPill status={r.status} />
                      <span className="text-xs text-ink-faint">
                        reported by {r.reporter?.full_name || r.reporter?.email || 'someone'} · {formatDateTime(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-ink">
                      <span className="text-ink-muted">Reason:</span> {r.reason || '—'}
                    </p>
                    <div className="mt-2 rounded-lg bg-surface-subtle p-2 text-sm">
                      <p className="text-ink-muted">
                        {r.review?.rating}★ on <span className="font-medium text-ink">{r.review?.project?.title || 'a project'}</span>
                      </p>
                      <p className="mt-0.5 text-ink-muted">{r.review?.comment || <span className="italic text-ink-faint">no text</span>}</p>
                    </div>
                    {r.resolution ? <p className="mt-1.5 text-xs text-ink-faint">Resolution: {r.resolution}</p> : null}
                  </div>
                  {r.status !== 'resolved' && admin.perms.reviews.edit ? (
                    <ReportResolveBar reportId={r.id} reviewId={r.review?.id} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={REVIEW_PAGE_SIZE} total={total} basePath="/reviews/reported" searchParams={{ tab }} />
        </div>
      </Card>
    </div>
  );
}

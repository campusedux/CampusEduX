import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';
import { listReviewsForDeletion, REVIEW_PAGE_SIZE } from '@/lib/reviews/queries';
import { DeleteReviewButton } from '../ReviewModeration';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Delete Reviews · CampusEduX Admin' };

const TABS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'other', label: 'Other' },
];

export default async function DeleteReviewsPage({
  searchParams,
}: {
  searchParams: { tab?: string; page?: string };
}) {
  const admin = await requireModule('reviews');
  const tab = TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab! : 'spam';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { rows, total, missing } = await listReviewsForDeletion({ page, category: tab });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reviews" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Reviews & Ratings
        </Link>
        <PageHeader title="Delete Reviews" subtitle="Flagged reviews grouped by reason — delete with a recorded reason." />
      </div>

      <Tabs basePath="/reviews/delete" current={tab} tabs={TABS} />

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing here"
            description={missing ? 'The review_reports table isn’t available — apply admin migration 008.' : 'No reviews flagged as ' + tab + '.'}
          />
        ) : (
          <div className="space-y-3">
            {rows.map((rr: any) => (
              <div key={rr.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge label={rr.category} tone="neutral" />
                    <span className="text-xs text-ink-faint">
                      {rr.review?.rating}★ on {rr.review?.project?.title || 'a project'} ·{' '}
                      {rr.review?.profile?.full_name || 'CampusEduX user'} · {formatDate(rr.review?.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {rr.review?.comment || <span className="italic text-ink-faint">no text</span>}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">Report reason: {rr.reason || '—'}</p>
                </div>
                {admin.perms.reviews.delete && rr.review?.id ? <DeleteReviewButton id={rr.review.id} label="Delete" /> : null}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={REVIEW_PAGE_SIZE} total={total} basePath="/reviews/delete" searchParams={{ tab }} />
        </div>
      </Card>
    </div>
  );
}

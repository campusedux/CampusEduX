import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { Card, EmptyState } from '@/components/ui/primitives';
import { ActionButton } from '@/components/ui/ActionButton';
import { formatDateTime } from '@/lib/utils';
import { listReviews, REVIEW_PAGE_SIZE } from '@/lib/reviews/queries';
import { setReviewStatus } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Approve Reviews · CampusEduX Admin' };

export default async function ApproveReviewsPage({ searchParams }: { searchParams: { page?: string } }) {
  const admin = await requireModule('reviews');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { rows, total, missing } = await listReviews({ page, status: 'pending' });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reviews" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Reviews & Ratings
        </Link>
        <PageHeader title="Approve Reviews" subtitle="Pending queue — approve to publish, reject to remove." />
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing pending"
            description={missing ? 'The reviews table isn’t available yet.' : 'All caught up — no reviews awaiting approval.'}
          />
        ) : (
          <div className="space-y-3">
            {rows.map((r: any) => (
              <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-mono">{r.rating}★</span> on{' '}
                    <span className="font-medium text-ink">{r.project?.title || 'a project'}</span>
                    <span className="ml-2 text-xs text-ink-faint">
                      {r.profile?.full_name || 'CampusEduX user'} · {formatDateTime(r.created_at)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{r.comment || <span className="italic text-ink-faint">no text</span>}</p>
                </div>
                {admin.perms.reviews.edit ? (
                  <div className="flex items-center gap-1.5">
                    <ActionButton action={setReviewStatus.bind(null, r.id, 'published')} variant="primary" successToast="Published">
                      Approve
                    </ActionButton>
                    <ActionButton action={setReviewStatus.bind(null, r.id, 'removed')} variant="danger" successToast="Removed">
                      Reject
                    </ActionButton>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={REVIEW_PAGE_SIZE} total={total} basePath="/reviews/approve" />
        </div>
      </Card>
    </div>
  );
}

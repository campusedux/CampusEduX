import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';
import { ReviewActions } from '@/app/reviews/ReviewActions';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'flagged', label: 'Flagged' },
] as const;

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  flagged: 'danger',
};

export default async function ReviewsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status ?? 'pending';
  const supabase = createClient();
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('id, title, body, status, created_at, user_profiles(full_name, email), projects(title)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Reviews</h1>
        <p className="text-sm text-ink-muted">Moderate written reviews before they go public</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/reviews?status=${t.key}`}
            className={`px-4 py-2 text-sm font-medium ${
              status === t.key ? 'border-b-2 border-brand text-brand' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card>
        {!reviews || reviews.length === 0 ? (
          <EmptyState title={`No ${status} reviews`} />
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((review: any) => (
              <li key={review.id} className="py-3">
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-ink">{review.projects?.title}</span>
                    <span className="ml-2 text-xs text-ink-faint">
                      by {review.user_profiles?.full_name || review.user_profiles?.email} · {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge label={review.status} tone={STATUS_TONE[review.status] ?? 'neutral'} />
                    {review.status === 'pending' || review.status === 'flagged' ? (
                      <ReviewActions reviewId={review.id} />
                    ) : null}
                  </div>
                </div>
                {review.title ? <p className="text-sm font-medium text-ink">{review.title}</p> : null}
                <p className="text-sm text-ink-muted">{review.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

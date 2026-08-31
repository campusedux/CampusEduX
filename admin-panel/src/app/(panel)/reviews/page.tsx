import Link from 'next/link';
import { CheckCircle2, Clock, Flag, Trash2 } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { formatDate, formatNumber } from '@/lib/utils';
import { listReviews, getReviewStats, REVIEW_PAGE_SIZE } from '@/lib/reviews/queries';
import { ReviewStatusSelect, DeleteReviewButton } from './ReviewModeration';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reviews & Ratings · CampusEduX Admin' };

const NAV = [
  { href: '/reviews/analytics', label: 'Rating Analytics' },
  { href: '/reviews/reported', label: 'Reported' },
  { href: '/reviews/approve', label: 'Approve' },
  { href: '/reviews/delete', label: 'Delete' },
  { href: '/reviews/testimonials', label: 'Testimonials' },
];

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string; rating?: string };
}) {
  const admin = await requireModule('reviews');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const status = searchParams.status ?? '';
  const rating = searchParams.rating ?? '';

  const [{ rows, total, missing }, stats] = await Promise.all([
    listReviews({ page, q, status, rating }),
    getReviewStats(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews & Ratings"
        subtitle="Every review across the platform."
        action={
          <div className="flex flex-wrap gap-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                <Button variant="secondary" size="sm">
                  {n.label}
                </Button>
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Published" value={formatNumber(stats.published)} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending" value={formatNumber(stats.pending)} icon={Clock} tone="warning" />
        <StatCard label="Reported" value={formatNumber(stats.reported)} icon={Flag} tone="danger" />
        <StatCard label="Removed" value={formatNumber(stats.removed)} icon={Trash2} tone="info" />
      </div>

      <SearchFilterBar
        placeholder="Search review text…"
        filters={
          <>
            <FilterSelect
              name="status"
              label="Status"
              options={[
                { value: 'published', label: 'Published' },
                { value: 'pending', label: 'Pending' },
                { value: 'reported', label: 'Reported' },
                { value: 'removed', label: 'Removed' },
              ]}
            />
            <FilterSelect
              name="rating"
              label="Rating"
              options={[5, 4, 3, 2, 1].map((r) => ({ value: String(r), label: `${r} ★` }))}
            />
          </>
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No reviews found" description={missing ? 'The reviews table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Review</th>
                  <th className="pb-2 font-medium">Entity</th>
                  <th className="pb-2 font-medium">Rating</th>
                  <th className="pb-2 font-medium">Author</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border align-top odd:bg-surface-subtle/40">
                    <td className="max-w-sm py-2.5 text-ink-muted">{r.comment || <span className="italic text-ink-faint">no text</span>}</td>
                    <td className="py-2.5 text-ink-muted">{r.project?.title || r.entity_type}</td>
                    <td className="py-2.5 font-mono">{r.rating}★</td>
                    <td className="py-2.5 text-ink-muted">{r.profile?.full_name || 'CampusEduX user'}</td>
                    <td className="py-2.5 text-ink-muted">{formatDate(r.created_at)}</td>
                    <td className="py-2.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {admin.perms.reviews.edit ? <ReviewStatusSelect id={r.id} current={r.status} /> : null}
                        {admin.perms.reviews.delete ? <DeleteReviewButton id={r.id} /> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={REVIEW_PAGE_SIZE} total={total} basePath="/reviews" searchParams={{ q, status, rating }} />
        </div>
      </Card>
    </div>
  );
}

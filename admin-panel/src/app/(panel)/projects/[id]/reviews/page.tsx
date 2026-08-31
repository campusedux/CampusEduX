import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { Pagination } from '@/components/ui/Pagination';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatDateTime, initials } from '@/lib/utils';
import { Star } from 'lucide-react';
import { deleteReview } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project Reviews · CampusEduX Admin' };

const SIZE = 15;

export default async function ProjectReviewsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const admin = await requireModule('projects');
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * SIZE;

  const [allRatings, pageRes] = await Promise.all([
    safe(supabase.from('reviews').select('rating').eq('project_id', params.id), [] as { rating: number }[]),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, profile:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('project_id', params.id)
      .order('created_at', { ascending: false })
      .range(from, from + SIZE - 1),
  ]);

  const rows = pageRes.error ? [] : (pageRes.data ?? []);
  const total = pageRes.error ? 0 : pageRes.count ?? 0;
  const count = allRatings.length;
  const avg = count ? allRatings.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: allRatings.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Rating breakdown" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="text-center">
            <p className="text-4xl font-bold text-ink">{avg.toFixed(1)}</p>
            <p className="mt-1 flex items-center justify-center gap-0.5 text-warning">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={14} fill={i <= Math.round(avg) ? 'currentColor' : 'none'} />
              ))}
            </p>
            <p className="mt-1 text-xs text-ink-faint">{count} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-ink-muted">{d.star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-subtle">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: `${count ? (d.n / count) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-ink-faint">{d.n}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title={`Reviews (${total})`} />
        {rows.length === 0 ? (
          <EmptyState title="No reviews yet" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r: any) => (
              <li key={r.id} className="flex items-start gap-3 py-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
                  {initials(r.profile?.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">{r.profile?.full_name || 'CampusEduX user'}</p>
                    <span className="flex items-center gap-0.5 text-warning">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={12} fill={i <= r.rating ? 'currentColor' : 'none'} />
                      ))}
                    </span>
                  </div>
                  {r.comment ? <p className="mt-0.5 text-sm text-ink-muted">{r.comment}</p> : null}
                  <p className="mt-0.5 text-xs text-ink-faint">{formatDateTime(r.created_at)}</p>
                </div>
                {admin.perms.projects.delete ? (
                  <DeleteButton action={deleteReview.bind(null, params.id, r.id)} confirmMessage="Delete this review?" />
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={SIZE} total={total} basePath={`/projects/${params.id}/reviews`} />
        </div>
      </Card>
    </div>
  );
}

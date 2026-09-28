import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDateTime, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recent Users · CampusEduX Admin' };

const PAGE_SIZE = 20;

export default async function RecentUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; premium?: string };
}) {
  await requireModule('dashboard');
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const premium = searchParams.premium ?? '';
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, mobile_number, course, branch, year, is_premium, status, created_at', {
      count: 'estimated',
    })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (premium === 'yes') query = query.eq('is_premium', true);
  if (premium === 'no') query = query.eq('is_premium', false);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,mobile_number.ilike.%${q}%`);

  const { data, count, error } = await query;
  const rows = error ? [] : (data ?? []);
  const total = error ? 0 : count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Recent Users" subtitle="Newest student sign-ups across the platform." />

      <SearchFilterBar
        placeholder="Search name, email or phone…"
        filters={
          <FilterSelect
            name="premium"
            label="Plan"
            options={[
              { value: 'yes', label: 'Premium' },
              { value: 'no', label: 'Free' },
            ]}
          />
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No users found"
            description={error ? 'The profiles table isn’t readable yet — apply migration 002 (admin RLS).' : 'Try a different search.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Course · Branch</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u: any) => (
                  <tr key={u.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
                          {initials(u.full_name)}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{u.full_name || '—'}</p>
                          <p className="text-xs text-ink-faint">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-ink-muted">
                      {[u.course, u.branch, u.year].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-2.5">
                      {u.is_premium ? <Badge label="Premium" tone="brand" /> : <Badge label="Free" tone="neutral" />}
                    </td>
                    <td className="py-2.5">
                      <StatusPill status={u.status ?? 'active'} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/recent-users"
            searchParams={{ q, premium }}
          />
        </div>
      </Card>
    </div>
  );
}

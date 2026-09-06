import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { formatNumber } from '@/lib/utils';
import { listMockTests, PLACEMENT_PAGE_SIZE } from '@/lib/placement/queries';
import { TEST_CATEGORIES } from '@/lib/placement/constants';
import { deleteMockTest, toggleTestPublished } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mock Tests · CampusEduX Admin' };

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; category?: string; grid?: string };
}) {
  const admin = await requireModule('placement');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const category = searchParams.category ?? '';
  const grid = searchParams.grid ?? '';
  const { rows, total, missing } = await listMockTests({ page, q, category, grid });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Tests"
        subtitle="Timed practice tests students take across every category."
        action={
          admin.perms.placement.add ? (
            <Link href="/placement/tests/new">
              <Button>
                <Plus size={16} /> Add Mock Test
              </Button>
            </Link>
          ) : null
        }
      />

      <SearchFilterBar
        placeholder="Search test title…"
        filters={<FilterSelect name="category" label="Category" options={TEST_CATEGORIES.map((c) => ({ value: c, label: c }))} />}
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No mock tests found" description={missing ? 'The practice_tests table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Questions</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Marks</th>
                  <th className="pb-2 font-medium">Published</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <Link href={`/placement/tests/${r.id}`} className="font-medium text-ink hover:text-brand">
                        {r.title}
                      </Link>
                      {r.company?.name ? <span className="block text-xs text-ink-faint">{r.company.name}</span> : null}
                    </td>
                    <td className="py-2.5">
                      <Badge label={r.category} tone="neutral" />
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatNumber(r.question_count)}</td>
                    <td className="py-2.5 text-ink-muted">{r.duration_minutes} min</td>
                    <td className="py-2.5 text-ink-muted">{r.total_marks || '—'}</td>
                    <td className="py-2.5">
                      {admin.perms.placement.edit ? (
                        <ToggleSwitch checked={r.is_published} action={toggleTestPublished.bind(null, r.id)} />
                      ) : (
                        <Badge label={r.is_published ? 'Yes' : 'No'} tone={r.is_published ? 'success' : 'neutral'} />
                      )}
                    </td>
                    <td className="py-2.5">
                      <RowActions
                        viewHref={`/placement/tests/${r.id}`}
                        editHref={admin.perms.placement.edit ? `/placement/tests/${r.id}/edit` : undefined}
                        deleteSlot={
                          admin.perms.placement.delete ? (
                            <DeleteButton action={deleteMockTest.bind(null, r.id)} confirmMessage={`Delete "${r.title}"? Its questions go with it.`} />
                          ) : null
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={PLACEMENT_PAGE_SIZE} total={total} basePath="/placement/tests" searchParams={{ q, category }} />
        </div>
      </Card>
    </div>
  );
}

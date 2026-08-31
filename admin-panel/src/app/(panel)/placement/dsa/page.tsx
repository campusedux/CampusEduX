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
import { FlashToast } from '@/components/ui/FlashToast';
import { listDsaProblems, getDsaTopics, PLACEMENT_PAGE_SIZE } from '@/lib/placement/queries';
import { DIFFICULTIES } from '@/lib/placement/constants';
import { deleteDsaProblem } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'DSA Problems · CampusEduX Admin' };

export default async function DsaProblemsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; topic?: string; difficulty?: string; created?: string; saved?: string };
}) {
  const admin = await requireModule('placement');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const topic = searchParams.topic ?? '';
  const difficulty = searchParams.difficulty ?? '';

  const [{ rows, total, missing }, topics] = await Promise.all([
    listDsaProblems({ page, q, topic, difficulty }),
    getDsaTopics(),
  ]);

  return (
    <div className="space-y-6">
      {searchParams.created ? <FlashToast title="Problem created" /> : null}
      {searchParams.saved ? <FlashToast title="Problem saved" /> : null}

      <PageHeader
        title="DSA Problems"
        subtitle="Coding problems grouped by topic and difficulty."
        action={
          admin.perms.placement.add ? (
            <Link href="/placement/questions/new?type=dsa">
              <Button>
                <Plus size={16} /> Add Problem
              </Button>
            </Link>
          ) : null
        }
      />

      <SearchFilterBar
        placeholder="Search problem title…"
        filters={
          <>
            <FilterSelect name="topic" label="Topic" options={topics.map((t: any) => ({ value: t.id, label: t.name }))} />
            <FilterSelect name="difficulty" label="Difficulty" options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} />
          </>
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No problems found" description={missing ? 'The dsa_problems table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Topic</th>
                  <th className="pb-2 font-medium">Difficulty</th>
                  <th className="pb-2 font-medium">Complexity</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5 font-medium text-ink">{r.title}</td>
                    <td className="py-2.5 text-ink-muted">{r.topic?.name || '—'}</td>
                    <td className="py-2.5">
                      <Badge label={r.difficulty} tone={r.difficulty === 'Hard' ? 'danger' : r.difficulty === 'Easy' ? 'success' : 'warning'} />
                    </td>
                    <td className="py-2.5 font-mono text-xs text-ink-muted">
                      {[r.time_complexity, r.space_complexity].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="py-2.5">
                      <RowActions
                        editHref={admin.perms.placement.edit ? `/placement/questions/dsa/${r.id}/edit` : undefined}
                        deleteSlot={
                          admin.perms.placement.delete ? (
                            <DeleteButton action={deleteDsaProblem.bind(null, r.id)} confirmMessage={`Delete "${r.title}"?`} />
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
          <Pagination page={page} pageSize={PLACEMENT_PAGE_SIZE} total={total} basePath="/placement/dsa" searchParams={{ q, topic, difficulty }} />
        </div>
      </Card>
    </div>
  );
}

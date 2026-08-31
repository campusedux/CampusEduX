import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, StatusPill, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { FlashToast } from '@/components/ui/FlashToast';
import { formatDateTime } from '@/lib/utils';
import { listLiveTests } from '@/lib/placement/queries';
import { deleteLiveTest } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Live Tests · CampusEduX Admin' };

export default async function LiveTestsPage({ searchParams }: { searchParams: { created?: string; saved?: string } }) {
  const admin = await requireModule('placement');
  const rows = await listLiveTests();

  return (
    <div className="space-y-6">
      {searchParams.created ? <FlashToast title="Live test scheduled" /> : null}
      {searchParams.saved ? <FlashToast title="Changes saved" /> : null}

      <PageHeader
        title="Live Tests"
        subtitle="Scheduled tests with a fixed window — Upcoming, Ongoing or Completed."
        action={
          admin.perms.placement.add ? (
            <Link href="/placement/live-tests/new">
              <Button>
                <Plus size={16} /> Schedule Live Test
              </Button>
            </Link>
          ) : null
        }
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No live tests" description="Schedule one to run a timed test for a cohort." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Window</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5 font-medium text-ink">{r.title}</td>
                    <td className="py-2.5">
                      <Badge label={r.category} tone="neutral" />
                    </td>
                    <td className="py-2.5 text-ink-muted">
                      {r.scheduled_start ? formatDateTime(r.scheduled_start) : 'TBD'}
                      {r.scheduled_end ? ` → ${formatDateTime(r.scheduled_end)}` : ''}
                    </td>
                    <td className="py-2.5 text-ink-muted">{r.duration_minutes} min</td>
                    <td className="py-2.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-2.5">
                      <RowActions
                        editHref={admin.perms.placement.edit ? `/placement/live-tests/${r.id}/edit` : undefined}
                        deleteSlot={
                          admin.perms.placement.delete ? (
                            <DeleteButton action={deleteLiveTest.bind(null, r.id)} confirmMessage={`Delete "${r.title}"?`} />
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
      </Card>
    </div>
  );
}

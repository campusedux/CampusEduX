import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, EmptyState } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';
import { listResumeDownloads, RESUME_PAGE_SIZE } from '@/lib/resume/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resume Downloads · CampusEduX Admin' };

export default async function ResumeDownloadsPage({ searchParams }: { searchParams: { page?: string; q?: string } }) {
  await requireModule('resume');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const { rows, total, missing } = await listResumeDownloads({ page, q });

  return (
    <div className="space-y-6">
      <PageHeader title="Resume Downloads" subtitle="Who downloaded which resume, and when." />
      <SearchFilterBar placeholder="Search by resume title…" />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No downloads yet" description={missing ? 'The resume_downloads table isn’t available yet.' : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Resume</th>
                  <th className="pb-2 font-medium">File</th>
                  <th className="pb-2 font-medium">Downloaded</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d: any) => (
                  <tr key={d.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <p className="font-medium text-ink">{d.user?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-ink-faint">{d.user?.email}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">{d.resume_title || '—'}</td>
                    <td className="py-2.5">
                      {d.file_url ? (
                        <a href={d.file_url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                          Open
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDateTime(d.downloaded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageSize={RESUME_PAGE_SIZE} total={total} basePath="/resume/downloads" searchParams={{ q }} />
        </div>
      </Card>
    </div>
  );
}
